// 양양 ↔ 동서울 시외버스 '남은 좌석' 조회 (Vercel 서버리스) — 예매는 하지 않는다. 보기만.
//
// 출처: 티머니 시외버스 통합예매(txbus.t-money.co.kr)의 배차 조회 화면. 브라우저로 '배차 조회'를 한 번 누르는 것과 같은 요청이다.
// 그 사이트 robots.txt 는 자동 수집을 막아 두었다 — 오웬이 알고 진행하기로 결정(2026-10-11). 그래서 부담을 최소로:
//   · 엣지 캐시 120초(s-maxage) — 사용자가 몇 명이든 (방향·날짜) 하나당 2분에 한 번만 원 사이트를 부른다.
//   · 로그인·좌석 선택·결제 요청은 하지 않는다. 조회 1건만.
//   · 봇 차단(캡차·차단 페이지)이 보이면 우회하지 않고 '지금은 못 불러와요'로 끝낸다.
// 파싱은 화면 HTML 의 표(tr)에서: 출발 시각 · 운수사 · 소요 · 등급 · 일반 요금 · 남은/전체 좌석.
const T = { yy:['2503101', '양양'], ds:['0511601', '동서울'] };
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const strip = s => String(s || '').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export function parse(html){
  const out = [];
  for(const m of String(html).matchAll(/<tr>([\s\S]*?)<\/tr>/g)){
    const tr = m[1]; if(!/td_wrap1/.test(tr)) continue;
    const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(x=>x[1]);
    const t = strip(tds[0]); if(!/^\d{1,2}:\d{2}$/.test(t)) continue;
    /* 같은 표가 PC용(7칸)·모바일용(4칸, 등급이 운수사 괄호 안) 두 번 들어 있다 — 둘 다 읽고 아래에서 겹친 건 하나로 */
    const wide = tds.length >= 6;
    let co = strip((tds[1] || '').match(/<strong>([\s\S]*?)<\/strong>/)?.[1]).slice(0, 24);
    let grade = wide ? strip(tds[2]).slice(0, 10) : ((co.match(/\(([^)]+)\)\s*$/) || [])[1] || '');
    co = co.replace(/\([^)]*\)\s*$/, '').trim();
    const dur = (strip(tds[1]).match(/(\d{1,2}:\d{2})\s*소요/) || [])[1] || '';
    const fare = +(strip(tds[wide ? 3 : 2]).replace(/[^\d]/g, '')) || null;
    const seat = tr.match(/<strong>\s*(\d+)\s*석\s*<em>\s*<span>\s*\/총\s*<\/span>\s*(\d+)\s*석/);
    const last = strip(tds[tds.length - 1]);
    const left = seat ? +seat[1] : /매진/.test(last) ? 0 : null, total = seat ? +seat[2] : null;
    const shut = !seat && /(마감|불가|종료)/.test(last);                       // 예매 마감 등 — 좌석 수를 모름
    if(out.some(x=>x.t === t.padStart(5, '0') && x.co === co)) continue;
    out.push({ t:t.padStart(5, '0'), co, dur, grade, fare, left, total, shut });
  }
  return out.sort((a,b)=>a.t.localeCompare(b.t));
}

export default async function handler(req, res){
  const q = req.query || {}, dir = q.dir === 'in' ? 'in' : 'out';
  const date = String(q.date || '').replace(/\D/g, '');
  const d = date.length === 8 ? new Date(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}T00:00:00+09:00`) : null;
  const now = Date.now();
  if(!d || isNaN(d) || d.getTime() < now - 864e5 * 1.5 || d.getTime() > now + 864e5 * 31){ res.status(400).json({ error:'date' }); return; }
  const [a, b] = dir === 'out' ? [T.yy, T.ds] : [T.ds, T.yy];
  const body = new URLSearchParams({ depr_Trml_Cd:a[0], arvl_Trml_Cd:b[0], depr_Trml_Nm:a[1], arvl_Trml_Nm:b[1], depr_Dt:date, depr_Time:'0000', bef_Aft_Dvs:'D', req_Rec_Num:'60', ig:'1', im:'0', ic:'0', iv:'0' });
  let html = '';
  try{
    const r = await fetch('https://txbus.t-money.co.kr/otck/readAlcnList.do', { method:'POST', body,
      headers:{ 'user-agent':UA, referer:'https://txbus.t-money.co.kr/main.do', 'content-type':'application/x-www-form-urlencoded', 'accept-language':'ko-KR,ko;q=0.9' },
      signal:AbortSignal.timeout(9000) });
    html = await r.text();
    if(!r.ok) throw new Error('http ' + r.status);
  }catch(e){
    res.setHeader('Cache-Control', 'no-store'); res.status(502).json({ error:'upstream' }); return;
  }
  const buses = parse(html);
  if(!buses.length && /(captcha|자동입력|비정상|차단|잠시 후 다시)/i.test(html)){        // 차단·오류 화면 — 우회하지 않는다
    res.setHeader('Cache-Control', 's-maxage=60'); res.status(503).json({ error:'blocked' }); return;
  }
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');
  res.status(200).json({ fetched:new Date().toISOString(), dir, date, from:a[1], to:b[1], buses,
    src:'티머니 시외버스 통합예매', book:'https://txbus.t-money.co.kr/main.do' });
}
