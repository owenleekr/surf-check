// 네이버지도 '공유 폴더'를 서버에서 읽어 앱에 준다 — 양서학 맛집·스팟 목록 (Vercel 서버리스).
//
// 왜 서버가 읽나: 브라우저에서 pages.map.naver.com 을 직접 부르면 CORS 로 막힌다.
// 어떻게 '자동으로 늘어나나': 폴더에 장소를 추가하면 다음 요청 때 이 함수가 새로 읽는다. 결과는 10분간 엣지에
//   캐시되므로(s-maxage) 네이버를 사람마다 두들기지 않고, 추가한 장소는 최대 10분 안에 앱에 나타난다.
//   네이버가 잠깐 죽어도 stale-if-error 로 이전 결과가 계속 나간다.
//
// (요청 헤더: 낯선 User-Agent 는 500, 'Mozilla/5.0' 한 줄만 보내면 10번 중 절반이 빈 응답으로 멈췄다.
//  브라우저처럼 UA·accept·accept-language 를 갖추면 6/6 성공(0.1~0.2초). 그래서 아래 HDR 을 줄이지 말 것.)
// 아무 폴더나 대신 가져다 주는 프록시가 되면 안 되므로, 읽을 폴더는 아래 목록에 박아 둔다.
// 폴더를 더 보여주려면(예: 서핑 스팟 폴더) 네이버지도에서 폴더 공유 링크를 만들어 shareId 를 여기에 추가한다.
const FOLDERS = [
  { id:'fef5bd35c7a245e8b9b6e8b1eb27c2aa', kind:'food', label:'양서학 추천 맛집', share:'https://naver.me/xiLePsoO' },
  { id:'6df327f7963c4a6abb30319265b541b1', kind:'spot', label:'양서학 서핑 스팟 리스트', share:'https://naver.me/FWTnIrDa' },
];
const HDR = { 'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  referer:'https://map.naver.com/', accept:'application/json, text/plain, */*', 'accept-language':'ko-KR,ko;q=0.9' };
const API = id => `https://pages.map.naver.com/save-pages/api/maps-bookmark/v3/shares/${id}/bookmarks`;
const num = v => Number.isFinite(+v) ? +v : null;

async function readFolder(f){
  const items = []; let title = f.label, memo = '', count = 0;
  for(let start = 0; start < 500; start += 100){                                   // 100개씩 — 폴더가 커져도 끝까지
    let j = null;
    for(let k = 0; k < 2 && !j; k++){                                              // 가끔 멈추니 두 번까지(각 4초) — 함수 제한 안에서
      try{ const r = await fetch(`${API(f.id)}?start=${start}&limit=100&sort=lastUseTime`, { headers:HDR, signal:AbortSignal.timeout(4000) });
        if(r.ok) j = await r.json(); }catch(e){}
    }
    if(!j) throw new Error('naver');
    if(start === 0){ title = j.folder?.name || f.label; memo = String(j.folder?.memo || '').slice(0, 80); count = j.folder?.bookmarkCount || 0; }
    const list = j.bookmarkList || [];
    for(const b of list){
      const lat = num(b.py), lon = num(b.px);
      if(lat == null || lon == null || lat < 33 || lat > 39 || lon < 124 || lon > 132) continue;    // 한국 밖 좌표는 버린다
      if(b.available === false) continue;                                           // 폐업·삭제로 표시된 곳
      if(/외부\s*유출|비공개|공유\s*금지/.test(String(b.memo || ''))) continue;          // 메모에 '외부유출 금지'라고 적은 곳은 공개 앱에 싣지 않는다
      items.push({
        id:String(b.bookmarkId), n:String(b.displayName || b.name || '').slice(0, 40), a:String(b.address || '').slice(0, 60),
        lat, lon, m:String(b.memo || '').slice(0, 140), c:f.kind === 'food' ? String(b.mcidName || '').slice(0, 12) : '',
        u:/^\d{4,12}$/.test(String(b.sid || '')) ? `https://map.naver.com/p/entry/place/${b.sid}` : '',
        t:b.creationTime || b.lastUpdateTime || 0 });
    }
    if(list.length < 100) break;
  }
  return { id:f.id, kind:f.kind, label:f.label, title, memo, count:count || items.length, share:f.share,
           link:`https://map.naver.com/p/favorite/sharedPlace/folder/${f.id}`, items };
}

import SNAP from './_naver-snapshot.js';
/* 네이버가 완전히 죽었을 때를 위한 저장본 — 비어 있는 것보다 며칠 묵은 목록이 낫다. 정상일 때는 쓰이지 않는다. */
const snapshot = () => SNAP;        // 정적 import — 파일 경로를 계산하지 않는다(import.meta 는 이 배포 방식에서 안 통했다)

export default async function handler(req, res){
  const out = await Promise.allSettled(FOLDERS.map(readFolder));
  const folders = out.filter(x=>x.status === 'fulfilled').map(x=>x.value);
  res.setHeader('Access-Control-Allow-Origin', '*');
  if(!folders.length){                                  // 전부 실패 — 저장본을 주되 캐시하지 않는다(다음 요청이 바로 다시 시도)
    const snap = snapshot(); res.setHeader('Cache-Control', 'no-store');
    if(snap) return res.status(200).json({ ...snap, stale:true });
    return res.status(502).json({ error:'naver' }); }
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600, stale-if-error=86400');
  res.status(200).json({ fetched:new Date().toISOString(), folders });
}
