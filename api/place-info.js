// 맛집 카드에 붙일 '세부 분류 · 사진 · 블로그 후기' — 네이버 공식 검색 API(지역·이미지·블로그)로만 가져온다.
//
// 왜 공식 API 인가: 네이버 장소 페이지의 사진·방문자 리뷰는 작성자 저작물이고 네이버가 자동 수집을 막아 둔다.
//   검색 API 는 '검색 결과를 출처 링크와 함께 보여주는' 용도로 열려 있다 → 사진·후기마다 원문 링크를 단다.
// 키(둘 중 하나만 있으면 된다 — 카카오가 먼저):
//   · KAKAO_REST_KEY — 카카오 개발자 앱의 REST API 키(카카오맵 로컬 검색 + 다음 이미지·블로그 검색). 무료.
//   · NAVER_CLIENT_ID / NAVER_CLIENT_SECRET — 네이버 개발자센터 검색 API(2026년 신규 신청이 막혀 기존 키만).
//   키가 없으면 { enabled:false } 만 돌려주고 앱은 지금처럼 보인다.
// 호출량: 가게 하나당 3번, 결과는 엣지에 7일 캐시 — 하루 한도(25,000)에 한참 못 미친다.
const strip = s => String(s || '').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").trim();
const httpsOnly = u => /^https:\/\//i.test(String(u || '')) ? String(u).slice(0, 500) : '';
const httpOk = u => /^https?:\/\//i.test(String(u || '')) ? String(u).slice(0, 500) : '';   // 원문 링크는 http 블로그도 있다(이미지 src 는 https 만)

/* 네이버 분류(예: '한식>육류,고기요리') → 앱에서 쓰는 짧은 분류 */
export function catOf(c){
  const s = String(c || '');
  const R = [[/곱창|막창|대창/, '곱창'], [/양꼬치/, '양꼬치'], [/육류|고기|갈비|삼겹|돼지|소고기|정육/, '고기'], [/회|해물|생선|횟집|조개|대게|물회|수산/, '횟집·해산물'],
    [/국수|냉면|막국수|면요리|칼국수|우동|라멘/, '면'], [/순대|국밥|해장|감자탕|찌개|전골|탕/, '국밥·찌개'], [/초밥|일식|돈가스|돈까스|이자카야/, '일식'], [/중식|중국/, '중식'],
    [/카페|디저트|커피|베이커리|제과|빵/, '카페·디저트'], [/술집|포차|호프|이자카야|바\b|와인/, '술집'], [/분식|떡볶이|김밥/, '분식'], [/양식|이탈리아|피자|파스타|버거|스테이크|브런치/, '양식'],
    [/한식|백반|한정식|쌈밥|보쌈|족발/, '한식']];
  for(const [re, n] of R) if(re.test(s)) return n;
  return s.split('>')[0].slice(0, 8) || '';
}

/* 카카오 — 로컬(장소 분류) · 다음 이미지 · 다음 블로그. 응답 모양을 네이버와 같게 맞춘다 */
async function kk(path, q, key){
  const r = await fetch(`https://dapi.kakao.com/${path}?${new URLSearchParams(q)}`, { headers:{ Authorization:'KakaoAK ' + key }, signal:AbortSignal.timeout(5000) });
  if(!r.ok) throw new Error('kakao ' + r.status);
  return r.json();
}
async function viaKakao(q, key){
  const [loc, img, blog] = await Promise.allSettled([
    kk('v2/local/search/keyword.json', { query:q, size:'1' }, key),
    kk('v2/search/image', { query:q, size:'4', sort:'accuracy' }, key),
    kk('v2/search/blog', { query:`${q} 후기`, size:'3', sort:'accuracy' }, key) ]);
  const L = loc.status === 'fulfilled' ? loc.value.documents?.[0] : null;
  const cat = L ? String(L.category_name || '').split('>').map(x=>x.trim()).slice(1).join('>') : '';   // '음식점 > 한식 > 육류,고기' → '한식>육류,고기'
  return { ok:loc.status === 'fulfilled' || img.status === 'fulfilled', lok:loc.status === 'fulfilled', src:'카카오·다음 검색',
    lerr:loc.status === 'rejected' ? String(loc.reason?.message || 'err').slice(0, 20) : undefined,   // 분류가 비면 왜인지(예: kakao 403 = 카카오맵 꺼짐) — 상태 코드만
    cat:L ? catOf(cat) : '', ncat:cat.slice(0, 30),
    /* 카카오맵 가게 페이지 — 평점·방문자 후기는 공식 API에 없어 긁어오지 않고 원래 페이지로 보낸다 */
    url:L && /^https?:\/\/place\.map\.kakao\.com\/\d+$/.test(String(L.place_url || '')) ? String(L.place_url).replace(/^http:/, 'https:') : '',
    img:(img.status === 'fulfilled' ? img.value.documents || [] : []).map(x=>({ thumb:httpsOnly(x.thumbnail_url), link:httpOk(x.doc_url) })).filter(x=>x.thumb).slice(0, 4),
    blogs:(blog.status === 'fulfilled' ? blog.value.documents || [] : []).map(x=>({ t:strip(x.title).slice(0, 60), d:strip(x.contents).slice(0, 140), link:httpsOnly(x.url), by:strip(x.blogname).slice(0, 20), date:String(x.datetime || '').slice(0, 10).replace(/-/g, '') })).filter(x=>x.link).slice(0, 3) };
}

async function nv(path, q, id, secret){
  const r = await fetch(`https://openapi.naver.com/v1/search/${path}?${new URLSearchParams(q)}`, { headers:{ 'X-Naver-Client-Id':id, 'X-Naver-Client-Secret':secret }, signal:AbortSignal.timeout(5000) });
  if(!r.ok) throw new Error('naver ' + r.status);
  return r.json();
}

export default async function handler(req, res){
  const id = process.env.NAVER_CLIENT_ID, secret = process.env.NAVER_CLIENT_SECRET, kakao = process.env.KAKAO_REST_KEY;
  if(!kakao && (!id || !secret)){ res.setHeader('Cache-Control', 's-maxage=3600'); res.status(200).json({ enabled:false }); return; }
  const n = String(req.query?.n || '').trim().slice(0, 40), a = String(req.query?.a || '').trim().slice(0, 60);
  if(!n){ res.status(400).json({ error:'name' }); return; }
  /* 지역은 '강원 양양군 …'에서 시·군 이름만 — 같은 이름 가게가 전국에 많다 */
  const area = (a.match(/(양양|속초|고성|강릉|주문진|삼척|동해)/) || [])[1] || '양양';
  const q = `${area} ${n.replace(/\s*(본점|[가-힣]{1,4}점)$/, '')}`;
  if(kakao){
    const k = await viaKakao(q, kakao); const { ok, lok, ...rest } = k;
    /* 분류(로컬 검색)까지 받아야 7일 캐시 — 사진만 받고 7일 묶이면 카카오맵을 켜도 일주일 동안 분류가 안 생긴다 */
    res.setHeader('Cache-Control', ok && lok ? 's-maxage=604800, stale-while-revalidate=86400' : ok ? 's-maxage=600' : 'no-store');
    res.status(200).json({ enabled:true, q, ...rest }); return;
  }
  const [loc, img, blog] = await Promise.allSettled([
    nv('local.json', { query:q, display:'1' }, id, secret),
    nv('image', { query:q, display:'4', sort:'sim', filter:'medium' }, id, secret),
    nv('blog.json', { query:`${q} 후기`, display:'2', sort:'sim' }, id, secret) ]);
  const L = loc.status === 'fulfilled' ? loc.value.items?.[0] : null;
  const out = {
    enabled:true, q, src:'네이버 검색',
    cat:L ? catOf(L.category) : '', ncat:L ? strip(L.category).slice(0, 30) : '',
    img:(img.status === 'fulfilled' ? img.value.items || [] : []).map(x=>({ thumb:httpsOnly(x.thumbnail), link:httpsOnly(x.link) })).filter(x=>x.thumb).slice(0, 4),
    blogs:(blog.status === 'fulfilled' ? blog.value.items || [] : []).map(x=>({ t:strip(x.title).slice(0, 60), d:strip(x.description).slice(0, 140), link:httpsOnly(x.link), by:strip(x.bloggername).slice(0, 20), date:String(x.postdate || '').slice(0, 8) })).filter(x=>x.link).slice(0, 2),
  };
  const ok = loc.status === 'fulfilled' || img.status === 'fulfilled';
  res.setHeader('Cache-Control', ok ? 's-maxage=604800, stale-while-revalidate=86400' : 'no-store');
  res.status(200).json(out);
}
