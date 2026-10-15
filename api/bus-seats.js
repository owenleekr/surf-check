// 양양 ↔ 동서울 시외버스 '남은 좌석' 조회 (Vercel 서버리스) — 예매는 하지 않는다. 보기만.
//
// 출처: 티머니 시외버스 통합예매(txbus.t-money.co.kr)의 배차 조회 화면. 브라우저로 '배차 조회'를 한 번 누르는 것과 같은 요청이다.
// 그 사이트 robots.txt 는 자동 수집을 막아 두었다 — 오웬이 알고 진행하기로 결정(2026-10-11). 그래서 부담을 최소로:
//   · 엣지 캐시 120초(s-maxage) — 사용자가 몇 명이든 (방향·날짜) 하나당 2분에 한 번만 원 사이트를 부른다.
//   · 로그인·좌석 선택·결제 요청은 하지 않는다. 조회 1건만.
//   · 봇 차단(캡차·차단 페이지)이 보이면 우회하지 않고 '지금은 못 불러와요'로 끝낸다.
// 파싱은 화면 HTML 의 표(tr)에서: 출발 시각 · 운수사 · 소요 · 등급 · 일반 요금 · 남은/전체 좌석.
const T = { yy:['2503101', '양양'], ds:['0511601', '동서울'] };
/* 노선 — 동서울은 시외버스(티머니), 서울경부·인천은 고속버스(코버스). 코버스 터미널 코드: 양양 270 · 서울경부 010 · 인천 100 */
const ROUTES = {
  ds:{ n:'동서울', sys:'tx', book:'https://txbus.t-money.co.kr/main.do', bookN:'티머니 시외버스' },
  gb:{ n:'서울경부', sys:'kb', code:'010', book:'https://www.kobus.co.kr/main.do', bookN:'고속버스 통합예매(코버스)' },
  ic:{ n:'인천', sys:'kb', code:'100', book:'https://www.kobus.co.kr/main.do', bookN:'고속버스 통합예매(코버스)' },
};
/* 등급 — 화면에 등급 글자가 없으면 전체 좌석 수로 가른다(28석 우등 · 21석 프리미엄 · 40석 넘으면 일반) */
export const gradeOf = (g, total) => { g = String(g || '').trim(); if(g) return g; return total == null ? '' : total <= 22 ? '프리미엄' : total <= 31 ? '우등' : '일반'; };
/* 코버스 배차 조회 화면 — 줄마다 <p … role="row"> 안에 출발 · 고속사 · 등급 · 잔여석 · 상태 */
export function parseKobus(html){
  const out = [];
  for(const m of String(html).matchAll(/<p class="([^"]*)" data-time="\d+" role="row">([\s\S]*?)<\/p>/g)){
    const r = m[2], pick = c => strip((r.match(new RegExp(`class="${c}"[^>]*>([\\s\\S]*?)<\\/span>`)) || [])[1]);
    const t = pick('start_time').replace(/\s/g, ''); if(!/^\d{1,2}:\d{2}$/.test(t)) continue;
    const co = pick('bus_com').replace(/^\(주\)/, '').slice(0, 20), grade = pick('grade').slice(0, 10);
    const rem = pick('remain'), status = pick('status');
    const n = (rem.match(/(\d+)\s*석/) || [])[1];
    const left = n != null ? +n : /매진/.test(rem + status) ? 0 : null, shut = n == null && /(마감|불가)/.test(rem + status);
    if(out.some(x=>x.t === t.padStart(5, '0') && x.co === co)) continue;
    out.push({ t:t.padStart(5, '0'), co, dur:'', grade:gradeOf(grade, null), fare:null, left, total:null, shut });
  }
  return out.sort((a,b)=>a.t.localeCompare(b.t));
}
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
    out.push({ t:t.padStart(5, '0'), co, dur, grade:gradeOf(grade, total), fare, left, total, shut });
  }
  return out.sort((a,b)=>a.t.localeCompare(b.t));
}

async function fetchTx(a, b, date){
  const body = new URLSearchParams({ depr_Trml_Cd:a[0], arvl_Trml_Cd:b[0], depr_Trml_Nm:a[1], arvl_Trml_Nm:b[1], depr_Dt:date, depr_Time:'0000', bef_Aft_Dvs:'D', req_Rec_Num:'60', ig:'1', im:'0', ic:'0', iv:'0' });
  const r = await fetch('https://txbus.t-money.co.kr/otck/readAlcnList.do', { method:'POST', body,
    headers:{ 'user-agent':UA, referer:'https://txbus.t-money.co.kr/main.do', 'content-type':'application/x-www-form-urlencoded', 'accept-language':'ko-KR,ko;q=0.9' }, signal:AbortSignal.timeout(9000) });
  const html = await r.text(); if(!r.ok) throw new Error('http ' + r.status);
  return { html, buses:parse(html) };
}
async function fetchKb(dep, arr, date){
  const body = new URLSearchParams({ deprCd:dep[0], deprNm:dep[1], arvlCd:arr[0], arvlNm:arr[1], tfrCd:'', tfrNm:'', tfrArvlFullNm:'', pathDvs:'sngl', pathStep:'1', crchDeprArvlYn:'N',
    deprDtm:date, deprDtmAll:date, arvlDtm:'', arvlDtmAll:'', busClsCd:'0', abnrData:'', prmmDcYn:'N' });
  const r = await fetch('https://www.kobus.co.kr/mrs/alcnSrch.do', { method:'POST', body,
    headers:{ 'user-agent':UA, referer:'https://www.kobus.co.kr/main.do', 'content-type':'application/x-www-form-urlencoded', 'accept-language':'ko-KR,ko;q=0.9' }, signal:AbortSignal.timeout(9000) });
  const html = await r.text(); if(!r.ok) throw new Error('http ' + r.status);
  return { html, buses:parseKobus(html) };
}

export default async function handler(req, res){
  const q = req.query || {}, dir = q.dir === 'in' ? 'in' : 'out', rk = ROUTES[q.to] ? q.to : 'ds', R = ROUTES[rk];
  const date = String(q.date || '').replace(/\D/g, '');
  const d = date.length === 8 ? new Date(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}T00:00:00+09:00`) : null;
  const now = Date.now();
  if(!d || isNaN(d) || d.getTime() < now - 864e5 * 1.5 || d.getTime() > now + 864e5 * 31){ res.status(400).json({ error:'date' }); return; }
  let got;
  try{
    if(R.sys === 'tx'){ const [a, b] = dir === 'out' ? [T.yy, T.ds] : [T.ds, T.yy]; got = await fetchTx(a, b, date); }
    else{ const yy = ['270', '양양'], other = [R.code, R.n]; const [a, b] = dir === 'out' ? [yy, other] : [other, yy]; got = await fetchKb(a, b, date); }
  }catch(e){ res.setHeader('Cache-Control', 'no-store'); res.status(502).json({ error:'upstream' }); return; }
  if(!got.buses.length && /(captcha|자동입력|비정상|차단|잠시 후 다시)/i.test(got.html)){        // 차단·오류 화면 — 우회하지 않는다
    res.setHeader('Cache-Control', 's-maxage=60'); res.status(503).json({ error:'blocked' }); return; }
  const [from, to] = dir === 'out' ? ['양양', R.n] : [R.n, '양양'];
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');
  res.status(200).json({ fetched:new Date().toISOString(), route:rk, dir, date, from, to, kind:R.sys === 'tx' ? '시외버스' : '고속버스', buses:got.buses, src:R.bookN, book:R.book });
}
