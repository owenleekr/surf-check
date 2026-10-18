// 기상특보 — 양양 서핑 구역에 풍랑·강풍·태풍·해일·호우·대설 주의보/경보가 났는지 알려 준다.
// 출처: 기상청_기상특보 조회서비스(data.go.kr) getPwnStatus — 지금 발효 중인 특보 현황(t6) 한 덩어리 글.
// 키는 Vercel 환경변수 KMA_SERVICE_KEY(공공데이터포털 '일반 인증키', Encoding/Decoding 둘 다 받는다).
// 키가 없거나 기상청이 안 받으면 { ok:false, reason } — 앱은 파도 예보로 '주의보 수준' 어림만 띄운다.
// 수상레저안전법: 주의보 구역에서 서핑하려면 해경 「기상특보활동신고」, 경보면 활동 금지.
const SEA = ['강원북부앞바다', '강원중부앞바다'];               // 양양·속초·고성 = 북부, 강릉 = 중부(스팟이 양양~강릉에 걸쳐 둘 다 본다)
const LAND = ['양양', '속초', '고성', '강릉'];                   // 강원도(…평지) 괄호 안에서만 찾는다 — 경남 고성과 헷갈리지 않게
const KINDS = /(풍랑|강풍|태풍|폭풍해일|해일|호우|대설)\s*(주의보|경보)/;

/* t6 예) "o 풍랑주의보 : 강원북부앞바다, 강원중부앞바다\r\no 강풍주의보 : 강원도(양양군평지, 속초시평지), 울릉도.독도" */
export function parseStatus(t6){
  const out = [];
  String(t6 || '').split(/\r?\n|(?=\s[o○●]\s)/).forEach(line=>{
    const L = line.replace(/^\s*[o○●·\-]\s*/, '').trim(); if(!L) return;
    const ci = L.indexOf(':'); if(ci < 0) return;
    const m = L.slice(0, ci).match(KINDS); if(!m) return;
    const body = L.slice(ci + 1), areas = [];
    SEA.forEach(z=>{ if(body.includes(z)) areas.push(z); });
    for(const g of body.matchAll(/강원[^(),]*\(([^)]*)\)/g)){
      g[1].split(/[,，]/).map(s=>s.trim()).forEach(s=>{
        const n = LAND.find(x=>new RegExp(`^${x}(시|군)?\\s*평지`).test(s)); if(n && !areas.includes(n + '평지')) areas.push(n + '평지'); }); }
    if(!areas.length) return;
    const kind = m[1] + m[2], hit = out.find(x=>x.kind === kind);
    if(hit) areas.forEach(a=>{ if(!hit.areas.includes(a)) hit.areas.push(a); });
    else out.push({ kind, lvl:m[2], areas });
  });
  return out.sort((a, b)=>(b.lvl === '경보') - (a.lvl === '경보'));
}

/* data.go.kr 응답 → { ok, active, tmFc } (실패면 ok:false). 03 = 자료 없음 = 특보 없음 */
export function parseResponse(j){
  const h = j?.response?.header, code = String(h?.resultCode ?? '');
  if(code === '03') return { ok:true, active:[], tmFc:null };
  if(code !== '00') return { ok:false, reason:'api' };
  let it = j.response.body?.items?.item; if(!it) return { ok:true, active:[], tmFc:null };
  if(!Array.isArray(it)) it = [it];
  it = it.slice().sort((a, b)=>String(b.tmFc || '').localeCompare(String(a.tmFc || '')))[0];
  return { ok:true, active:parseStatus(it.t6), tmFc:String(it.tmFc || '').replace(/\D/g, '').slice(0, 12) || null };
}

export default async function handler(req, res){
  const send = (st, o, cache) => { res.setHeader('Cache-Control', cache); res.status(st).json({ ...o, fetched:new Date().toISOString() }); };
  const key = process.env.KMA_SERVICE_KEY;
  if(!key) return send(200, { ok:false, reason:'nokey' }, 's-maxage=600, stale-while-revalidate=600');
  const k = /%[0-9A-F]{2}/i.test(key) ? key : encodeURIComponent(key);   // Encoding 키를 넣었으면 두 번 감싸지 않는다
  let out;
  try{
    const r = await fetch(`https://apis.data.go.kr/1360000/WthrWrnInfoService/getPwnStatus?serviceKey=${k}&numOfRows=10&pageNo=1&dataType=JSON`, { signal:AbortSignal.timeout(8000) });
    const txt = await r.text(); let j = null; try{ j = JSON.parse(txt); }catch(e){}   // 키 오류는 XML로 온다
    out = r.ok && j ? parseResponse(j) : { ok:false, reason:'api' };
  }catch(e){ out = { ok:false, reason:'api' }; }
  send(200, out, out.ok ? 's-maxage=600, stale-while-revalidate=300' : 's-maxage=120');
}
