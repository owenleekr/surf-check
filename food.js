/* ── 맛집·서핑 스팟 탭 ──────────────────────────────────────────────
   맛집: 네이버지도 '공유 폴더'를 서버(/api/naver-list)가 대신 읽어 준다. 폴더에 가게를 추가하면 최대 10분 안에 여기에도 나타난다.
   서핑 스팟: 네이버 '양서학 서핑 스팟 리스트' 폴더(kind 'spot')를 같은 방식으로 읽고, 앱의 해변 캠(SEAS)과 이름이 맞으면 캠 버튼을 붙인다.
   남이 쓴 글(한줄평·이름·주소)은 모두 esc, 링크는 http(s) 만(safeHttp). 서버가 안 닿으면 마지막으로 받은 목록을 보여준다. */
(function(){
const KEY = 'lineup.share.food', SEEN = 'lineup.share.foodseen', FRESH = 5 * 60e3;
let data = null, view = 'food', area = '전체', sort = 'near', busy = false, failed = false, fcat = '전체';
/* 세부 분류·사진·블로그 후기 — /api/place-info(네이버 공식 검색 API). 가게 이름별로 이 기기에 7일 저장, 서버 키가 없으면 조용히 안 보인다 */
const PIK = 'lineup.share.pi', PI = (()=>{ try{ return JSON.parse(localStorage.getItem(PIK) || '{}'); }catch(e){ return {}; } })();
let piOff = false, piBusy = 0;
const piKey = i => String(i.n || '').slice(0, 40);
/* 종류 — 검색 API 키가 없어도 가게 이름·한줄평으로 어림한다(키가 생기면 API 분류가 이긴다) */
const CAT_RULE = [[/곱창|막창|대창/, '곱창'], [/양꼬치/, '양꼬치'], [/갈비|삼겹|고기|정육|한우|숯불|생구이|돼지|소고기|목살/, '고기'], [/순대|국밥|감자탕|해장|찌개|전골|탕\b/, '국밥·찌개'],
  [/물회|횟집|수산|대게|조개|해물|회센터|생선|오징어/, '횟집·해산물'], [/막국수|메밀|국수|냉면|칼국수|라멘|우동|면\b/, '면'], [/스시|초밥|돈가스|돈까스|히모노|이자카야|일식/, '일식'],
  [/카레|파스타|피자|버거|브런치|스테이크/, '양식'], [/카페|커피|토스트|베이커리|빵|디저트|도넛|아이스크림/, '카페·디저트'], [/포차|호프|주점|맥주|술집|니가쏴라/, '술집'],
  [/짜장|짬뽕|중식|중국/, '중식'], [/분식|떡볶이|김밥/, '분식'], [/쌈밥|백반|한정식|식당|밥집|한식/, '한식']];
const CAT_IC = { '고기':'🥩', '곱창':'🍖', '양꼬치':'🍢', '국밥·찌개':'🍲', '횟집·해산물':'🐟', '면':'🍜', '일식':'🍣', '양식':'🍝', '카페·디저트':'☕', '술집':'🍺', '중식':'🥟', '분식':'🍙', '한식':'🍚' };
const guessCat = i => { const t = `${i.n || ''} ${i.m || ''}`; for(const [re, c] of CAT_RULE) if(re.test(t)) return c; return ''; };
const piOf = i => { const x = PI[piKey(i)]; return x && Date.now() - x.at < 7 * 864e5 ? x.info : null; };
function piHTML(i){
  const x = piOf(i); if(!x || !x.enabled) return '';
  const img = (x.img || []).filter(m=>safeHttp(m.thumb)), bl = (x.blogs || []).filter(b=>safeHttp(b.link));
  if(!img.length && !bl.length) return '';
  return `${img.length ? `<div class="pi-imgs">${img.map(m=>`<a href="${esc(safeHttp(m.link) || safeHttp(m.thumb))}" target="_blank" rel="noopener"><img src="${esc(safeHttp(m.thumb))}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"></a>`).join('')}</div>` : ''}
    ${bl.length ? `<details class="pi-blog"><summary>📝 블로그 후기 ${bl.length}개</summary>${bl.map(b=>`<a class="pi-b" href="${esc(safeHttp(b.link))}" target="_blank" rel="noopener"><b>${esc(b.t)}</b><span>${esc(b.d)}</span><small>${esc(b.by)}${b.date ? ' · ' + esc(b.date.slice(0, 4) + '.' + b.date.slice(4, 6) + '.' + b.date.slice(6)) : ''} ↗</small></a>`).join('')}</details>` : ''}
    <small class="pi-src">사진·후기: ${esc(x.src || '검색 결과')} · 누르면 원문</small>`;
}
async function piLoad(list){
  if(piOff) return;
  const todo = list.filter(i=>!piOf(i)).slice(0, 40); if(!todo.length) return;
  let got = 0;
  const one = async i => { try{ const r = await fetch(`/api/place-info?n=${encodeURIComponent(i.n)}&a=${encodeURIComponent(i.a || '')}`); if(!r.ok) return; const info = await r.json();
      if(info.enabled === false){ piOff = true; return; }
      PI[piKey(i)] = { at:Date.now(), info }; got++;
      const box = document.querySelector(`[data-pi="${CSS.escape(String(i.id))}"]`); if(box) box.innerHTML = piHTML(i);
      const tg = document.querySelector(`[data-pic="${CSS.escape(String(i.id))}"]`); if(tg && info.cat){ tg.textContent = info.cat; tg.hidden = false; } }catch(e){} };
  piBusy++;
  for(let k = 0; k < todo.length && !piOff; k += 4) await Promise.all(todo.slice(k, k + 4).map(one));
  piBusy--;
  try{ localStorage.setItem(PIK, JSON.stringify(Object.fromEntries(Object.entries(PI).filter(([, v])=>Date.now() - v.at < 7 * 864e5).slice(-120)))); }catch(e){}
  if(got && view === 'food') render();                          // 분류 칩이 생기게 한 번 다시 그린다(글 쓰는 중이면 render 가 알아서 건너뛴다)
}
const $f = id => document.getElementById(id);
const areaOf = a => /양양/.test(a) ? '양양' : /속초/.test(a) ? '속초' : /고성/.test(a) ? '고성' : /강릉/.test(a) ? '강릉' : '기타';
const seenSet = () => { try{ return new Set(JSON.parse(localStorage.getItem(SEEN) || '[]')); }catch(e){ return new Set(); } };
const folders = k => (data?.folders || []).filter(f=>f.kind === k);
const items = k => folders(k || 'food').flatMap(f=>f.items.map(i=>({ ...i, folder:f.title })));
const newCount = () => { const s = seenSet(); return s.size ? items('food').filter(i=>!s.has(i.id)).length : 0; };   // 처음 여는 사람에게 전부 NEW 로 뜨지 않게

function badge(){
  const n = newCount(), d = $f('food-dot');
  if(d){ d.textContent = n; d.hidden = !n || state.tab === 'food'; }
}

async function load(force){
  if(!data){ try{ data = JSON.parse(localStorage.getItem(KEY) || 'null')?.data || null; }catch(e){} }
  const at = (()=>{ try{ return JSON.parse(localStorage.getItem(KEY) || 'null')?.at || 0; }catch(e){ return 0; } })();
  if(busy || (!force && data && folders('spot').length && Date.now() - at < FRESH)){ render(); badge(); return; }
  busy = true; render();
  try{ const r = await fetch('/api/naver-list'); if(!r.ok) throw new Error('http'); const j = await r.json();
    if(!j.folders?.length) throw new Error('empty'); data = j; failed = false;
    try{ localStorage.setItem(KEY, JSON.stringify({ at:Date.now(), data:j })); }catch(e){}
  }catch(e){ failed = true; }
  busy = false; render(); badge();
  if(typeof window.homeFood === 'function') window.homeFood();          // 홈의 '최근에 올라온 곳'도 새로
}

/* 추가하는 법 — 네이버 리스트는 운영자만 고칠 수 있어서, 누구나 앱에 등록하고 운영자가 리스트에 옮기는 구조 */
/* 추가하는 법 — 단계 설명은 가이드 시트로 보내고, 목록 위에는 '등록하기' 한 줄 + 가이드·네이버 리스트 링크만 둔다(목록이 먼저 보이게) */
function howTo(kind, link){
  const fn = kind === 'food' ? '양서학 추천 맛집' : '양서학 서핑 스팟 리스트';
  return `<button type="button" class="btn sm ghost" data-guide="${esc(kind)}">📖 등록 가이드</button><a class="btn sm ghost" href="${esc(safeHttp(link) || '#')}" target="_blank" rel="noopener" aria-label="네이버 ‘${esc(fn)}’ 열기">네이버 리스트 ↗</a>`;
}

function renderFood(root){
  if(!data){ root.innerHTML = busy ? '<div class="skel" aria-hidden="true"><i></i><i></i><i></i></div>' : `<div class="empty">맛집 목록을 아직 못 불러왔어요.<br><button class="btn sm mint" type="button" id="food-retry" style="margin-top:9px">다시 불러오기</button></div>`;
    $f('food-retry')?.addEventListener('click', ()=>load(true)); return; }
  const f = folders('food')[0]; if(!f){ root.innerHTML = '<div class="empty">아직 목록이 없어요</div>'; return; }
  const all = items('food').concat(FT.added('food')), counts = { 전체:all.length }; all.forEach(i=>{ const a = areaOf(i.a); counts[a] = (counts[a] || 0) + 1; });
  const areas = ['전체', '양양', '속초', '고성', '강릉', '기타'].filter(a=>counts[a]);
  const seen = seenSet(), week = Date.now() - 7 * 864e5, dist = i => i.lat == null ? Infinity : distKm(i.lat, i.lon);
  const catOfI = i => piOf(i)?.cat || guessCat(i);
  const cc = {}; all.forEach(i=>{ const c = catOfI(i); if(c) cc[c] = (cc[c] || 0) + 1; });
  const cats = Object.keys(cc).sort((a,b)=>cc[b] - cc[a]); if(fcat !== '전체' && !cc[fcat]) fcat = '전체';
  const list = all.filter(i=>(area === '전체' || areaOf(i.a) === area) && (fcat === '전체' || catOfI(i) === fcat)).sort((a,b)=> sort === 'new' ? (b.t - a.t) : (dist(a) - dist(b)) || (b.t - a.t));
  const at = (()=>{ try{ const t = JSON.parse(localStorage.getItem(KEY) || 'null')?.at; return t ? new Date(t).toTimeString().slice(0,5) : ''; }catch(e){ return ''; } })();
  root.innerHTML = `
    <div class="food-hd"><b>${esc(f.title)}</b><span>${esc(f.memo || '')}</span>
      <small>${all.length}곳 · 네이버 리스트와 자동으로 맞춰져요${at ? ` · 갱신 ${at}` : ''}${failed ? ' · ⚠️ 새로 못 불러와 저장된 목록이에요' : ''}</small></div>
    ${FT.ownerBox('food')}${FT.addForm('food', howTo('food', f.link))}
    <div class="food-chips" role="group" aria-label="지역">${areas.map(a=>`<button type="button" aria-pressed="${a === area}" data-area="${esc(a)}">${esc(a)} <small>${counts[a]}</small></button>`).join('')}</div>
    ${cats.length >= 2 ? `<div class="food-chips fc-cat" role="group" aria-label="종류"><button type="button" aria-pressed="${fcat === '전체'}" data-fcat="전체">모든 종류</button>${cats.map(c=>`<button type="button" aria-pressed="${c === fcat}" data-fcat="${esc(c)}">${CAT_IC[c] || ''} ${esc(c)} <small>${cc[c]}</small></button>`).join('')}</div>` : ''}
    <div class="food-sort" role="group" aria-label="정렬"><button type="button" aria-pressed="${sort === 'near'}" data-sort="near">📍 학교에서 가까운 순</button><button type="button" aria-pressed="${sort === 'new'}" data-sort="new">🆕 최근 추가 순</button></div>
    ${list.map(i=>{ const km = dist(i), isNew = i.t && i.t > week, fresh = !i.by && seen.size && !seen.has(i.id), reg = i.by ? i : FT.regOf('food', i.id);
      const link = safeHttp(i.u) || (i.pid ? `https://map.naver.com/p/entry/place/${i.pid}` : `https://map.naver.com/p/search/${encodeURIComponent(i.n)}`);
      return `<article class="card food-card${i.by ? ' app' : ''}"><div class="hd"><span class="fc-ic" aria-hidden="true">${CAT_IC[catOfI(i)] || '🍴'}</span><b>${esc(i.n)}</b><span class="tag pi-cat" data-pic="${esc(i.id)}"${catOfI(i) ? '' : ' hidden'}>${esc(catOfI(i))}</span>${isNew || fresh ? '<span class="tag" style="background:var(--coral);color:#fff">NEW</span>' : ''}</div>
        ${reg ? FT.regLine(reg, !i.by) : ''}
        ${i.m && !i.by ? `<div class="food-memo">💬 ${esc(i.m)}</div>` : i.by && i.m ? `<div class="food-memo">🙋 ${esc(i.m)}</div>` : ''}
        <div class="meta">${esc(i.a)}${km < Infinity ? ` · 학교에서 <b>${km < 10 ? km.toFixed(1) : Math.round(km)}km</b>` : ''}</div>
        <div class="pi" data-pi="${esc(i.id)}">${piHTML(i)}</div>
        ${FT.preview ? FT.preview('food', i.id, !i.by && reg ? reg.id : '') : ''}
        ${FT.block('food', i.id, !i.by && reg ? reg.id : '', `<a class="ft-b ft-map" href="${esc(link)}" target="_blank" rel="noopener">📍 지도 ↗</a>`)}</article>`; }).join('') || '<div class="empty">이 지역에는 아직 없어요</div>'}`;
  root.querySelectorAll('[data-area]').forEach(b=>b.onclick = ()=>{ area = b.dataset.area; render(true); });
  root.querySelectorAll('[data-sort]').forEach(b=>b.onclick = ()=>{ sort = b.dataset.sort; render(true); });
  root.querySelectorAll('[data-fcat]').forEach(b=>b.onclick = ()=>{ fcat = b.dataset.fcat; render(true); });
  if(!piBusy) piLoad(all);
}

/* 서핑 스팟 — 네이버 '서핑 스팟' 폴더(kind 'spot')가 본체. 폴더에 스팟을 추가하면 10분 안에 여기 나타난다.
   앱의 해변 캠(SEAS)과 이름이 맞으면 📹 캠 버튼이 붙고, 폴더에 없는 캠 해변은 아래에 따로 보여준다. 모든 글은 esc */
const spotKey = n => String(n).replace(/해수욕장|해변|[\s·]/g, '').replace(/[0-9]+리$/, '');
let sarea = '전체';
function renderSpots(root){
  const search = n => `https://map.naver.com/p/search/${encodeURIComponent(String(n).replace(/·/g, ' ') + (/해수욕장|해변|항|교$/.test(n) ? '' : ' 해변'))}`;
  const f = folders('spot')[0], all = items('spot').concat(FT.added('spot')), dist = i => i.lat == null ? Infinity : distKm(i.lat, i.lon);
  const camOf = n => SEAS.find(x=>x[2] && spotKey(x[0]) === spotKey(n));
  const used = new Set(all.map(i=>camOf(i.n)?.[0]).filter(Boolean));
  const only = SEAS.filter(x=>x[2] && !used.has(x[0])).map(x=>({ id:'cam-' + x[1], n:x[0], lat:x[3], lon:x[4], cam:true })).sort((a,b)=>dist(a) - dist(b));
  const counts = { 전체:all.length }; all.forEach(i=>{ const a = areaOf(i.a); counts[a] = (counts[a] || 0) + 1; });
  const areas = ['전체', '고성', '속초', '양양', '강릉', '기타'].filter(a=>counts[a]);
  if(!areas.includes(sarea)) sarea = '전체';
  const list = all.filter(i=>sarea === '전체' || areaOf(i.a) === sarea).sort((a,b)=>(dist(a) - dist(b)) || (b.t - a.t));
  const km = i => { const d = dist(i); return d === Infinity ? '' : d < 10 ? d.toFixed(1) : Math.round(d); };
  const card = (i, fromFolder) => { const cam = camOf(i.n) || (i.cam ? [i.n] : null), reg = i.by ? i : (fromFolder ? FT.regOf('spot', i.id) : null), k = km(i);
    return `<article class="card food-card${i.by ? ' app' : ''}"><div class="hd"><b>${esc(i.n)}</b>${cam ? '<span class="tag" style="background:var(--mint)">📹 캠</span>' : ''}</div>
      ${reg ? FT.regLine(reg, !i.by) : ''}
      ${i.m ? `<div class="food-memo">${i.by ? '🙋' : '💬'} ${esc(i.m)}</div>` : ''}
      <div class="meta">${i.a ? esc(i.a) + (k !== '' ? ' · ' : '') : ''}${k !== '' ? `학교에서 <b>${k}km</b>` : ''}</div>
      ${cam ? `<button type="button" class="btn sm blue sp-cam" data-cam="${esc(cam[0])}">📹 지금 파도 보기</button>` : ''}
      ${FT.block('spot', i.id || ('cam-' + (cam?.[1] || '')), !i.by && reg ? reg.id : '', `<a class="ft-b ft-map" href="${esc(safeHttp(i.u) || (i.pid ? `https://map.naver.com/p/entry/place/${i.pid}` : search(i.n)))}" target="_blank" rel="noopener">📍 지도 ↗</a>`)}</article>`; };
  root.innerHTML = `
    <div class="food-hd"><b>${esc(f?.title || '🏄 양양 서핑 스팟')}</b><span>${esc(f?.memo || '학교에서 가까운 순 · 캠이 있는 곳은 바로 볼 수 있어요')}</span>
      ${f ? `<small>${all.length}곳 · 네이버지도 폴더와 자동으로 맞춰져요</small>` : ''}</div>
    ${window.waveSpotHTML ? window.waveSpotHTML() : ''}
    ${FT.ownerBox('spot')}${FT.addForm('spot', f ? howTo('spot', f.link) : '')}
    ${areas.length > 1 ? `<div class="food-chips" role="group" aria-label="지역">${areas.map(a=>`<button type="button" aria-pressed="${a === sarea}" data-sarea="${esc(a)}">${esc(a)} <small>${counts[a]}</small></button>`).join('')}</div>` : ''}
    ${list.map(i=>card(i, true)).join('')}
    ${only.length && (sarea === '전체' || sarea === '양양') ? `<div class="pt" style="margin-top:16px;color:var(--paper);text-shadow:2px 2px 0 var(--ink)">캠으로 볼 수 있는 다른 해변</div>` + only.map(i=>card(i, false)).join('') : ''}
    ${!f && !all.length ? '<div class="empty">스팟 목록을 아직 못 불러왔어요</div>' : ''}
`;
  root.querySelectorAll('[data-cam]').forEach(b=>b.onclick = ()=>{ setSea(b.dataset.cam); setTab('cam'); });
  const ws = root.querySelector('.wv-spot'); if(ws && window.waveWire) window.waveWire(ws);
  root.querySelectorAll('[data-sarea]').forEach(b=>b.onclick = ()=>{ sarea = b.dataset.sarea; render(true); });
}

function render(force){
  const root = $f('food-body'); if(!root || state.tab !== 'food') return;
  const ae = document.activeElement; if(force !== true && ae && root.contains(ae) && ae.matches('input')) return;   // 글 쓰는 중에 배경 갱신이 칸을 날리지 않게
  $f('food-seg')?.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.view === view)));
  view === 'spot' ? renderSpots(root) : renderFood(root);
}
function markSeen(){ try{ localStorage.setItem(SEEN, JSON.stringify(items('food').map(i=>i.id))); }catch(e){} badge(); }

function foodEnter(){ render(true); FT.pull(); load(false).then(()=>setTimeout(markSeen, 1500)); }
function foodOpen(v){ if(v) view = v; if(state.tab !== 'food') setTab('food'); else foodEnter(); }

/* 네이버 리스트 추가 가이드 — 맛집/스팟 공통 5단계 + 메모 요령 + 자주 묻는 것 */
function guideHTML(k){
  const food = k !== 'spot', fn = food ? '양서학 추천 맛집' : '양서학 서핑 스팟 리스트', lbl = food ? '맛집' : '스팟';
  const ex = food ? '물회 시키세요 · 웨이팅 20분 · 주차 가능' : '북쪽 막혀서 큰 파도 좋음 · 주차는 해변 앞 · 초보는 안쪽';
  return `<div class="gd"><div class="seg" role="group" aria-label="가이드 종류"><button type="button" data-gk="food" aria-pressed="${food}">🍜 맛집</button><button type="button" data-gk="spot" aria-pressed="${!food}">🏄 스팟</button></div>
    <ol class="gd-st">
      <li><b>1. 네이버지도에서 찾기</b><span>네이버지도 앱에서 ${food ? '가게 이름' : '해변·포인트 이름'}을 검색해 장소 화면을 열어요.</span></li>
      <li><b>2. 링크 복사</b><span>장소 화면의 <b>공유 → 링크 복사</b>. (‘[네이버지도] … https://naver.me/…’ 를 통째로 붙여도 링크만 알아서 뽑아요)</span></li>
      <li><b>3. 앱에 등록</b><span>이 앱 ${food ? '맛집' : '서핑 스팟'} 화면의 <b>➕ ${lbl} 등록하기</b> → 링크 붙여넣기 · 이름 · 지역 · 한줄평</span></li>
      <li><b>4. 바로 올라가요</b><span>목록에 <b>🙋 내 이름(기수)</b>과 함께 바로 떠요. 다른 사람들이 👍 추천 · 🙋 가봤어요 · 💬 댓글을 달 수 있어요.</span></li>
      <li><b>5. 양서학 리스트 ❌ → ⭕</b><span>네이버 ‘${esc(fn)}’ 리스트는 운영자만 고칠 수 있어요. 운영자가 넣으면 <b>10분 안에 ⭕</b> 로 바뀌고 네이버 카드로 합쳐져요(댓글·추천은 그대로).</span></li></ol>
    <div class="gd-tip"><b>한줄평 팁</b><ul><li>예: “<i>${esc(ex)}</i>”</li>
      <li>첫머리에 핵심(${food ? '메뉴·특징' : '파도·포인트'}) → 뒤에 ${food ? '가격·웨이팅' : '주차·위험(리프·이안류)'}</li>
      <li><b>군사시설·허가가 필요한 곳</b>은 공개 앱이라 올리지 말아 주세요</li></ul></div>
    <div class="gd-tip"><b>자주 묻는 것</b><ul>
      <li><b>이미 있다고 나와요</b> — 같은 장소가 목록에 있어요. 그 카드에 💬 댓글로 남겨 주세요.</li>
      <li><b>잘못 올렸어요</b> — 내 등록 카드의 🗑 로 지울 수 있어요(⭕ 가 되기 전까지).</li>
      <li><b>⭕ 가 안 바뀌어요</b> — 운영자가 아직 리스트에 안 넣은 거예요. 넣고 나서 10분 정도 걸려요.</li></ul></div>
    <div class="gd-tip" style="background:#FFF3C4"><b>운영자용</b><ul><li>${lbl} 화면 위 <b>📥 반영 대기</b> → ❌ 카드의 <b>📌 네이버에 넣기</b> → 네이버지도에서 ⭐ 저장 → ‘${esc(fn)}’ 선택. 10분 안에 ⭕ 로 바뀌어요.</li>
      <li>메모에 ‘외부유출 금지’를 적은 곳은 앱에 안 올라와요.</li></ul></div>
    <div class="food-btns" style="margin-top:12px"><a class="btn sm blue" href="/guide" target="_blank" rel="noopener">📖 가이드 페이지 열기</a><button type="button" class="btn sm ghost" data-gshare>🔗 단톡방에 가이드 공유</button></div></div>`;
}
let guideKind = 'food';
function guideOpen(k){
  guideKind = k === 'spot' ? 'spot' : 'food';
  let sh = $f('food-guide');
  if(!sh){ sh = document.createElement('div'); sh.className = 'sheet'; sh.id = 'food-guide';
    sh.innerHTML = '<div class="sheet-dim" data-gclose></div><div class="sheet-in"><div class="sheet-hd"><span class="t">📖 네이버 리스트 추가 가이드</span><button class="btn sm ghost" data-gclose>닫기</button></div><div id="food-guide-body"></div></div>';
    document.body.appendChild(sh);
    sh.addEventListener('click', e=>{ if(e.target.closest('[data-gclose]')) sh.hidden = true;
      if(e.target.closest('[data-gshare]')){ const d = { title:'SurfShare 가이드', text:'맛집·서핑 스팟 등록하는 법 + 홈 화면에 추가하는 법', url:'https://surf.owenai.xyz/guide' };
        (navigator.share ? navigator.share(d) : navigator.clipboard.writeText(d.url).then(()=>toast('가이드 링크를 복사했어요'))).catch(()=>{}); return; }
      const g = e.target.closest('[data-gk]'); if(g){ guideKind = g.dataset.gk; $f('food-guide-body').innerHTML = guideHTML(guideKind); } }); }
  $f('food-guide-body').innerHTML = guideHTML(guideKind); sh.hidden = false;
}
window.foodGuide = guideOpen;

function wire(){
  FT.init($f('food-body'), ()=>render(true), items);
  $f('food-body')?.addEventListener('click', e=>{ const b = e.target.closest('[data-guide]'); if(b) guideOpen(b.dataset.guide); });
  $f('food-seg')?.querySelectorAll('[data-view]').forEach(b=>b.onclick = ()=>{ view = b.dataset.view; render(true); window.scrollTo({ top:0, behavior:'smooth' }); });
  load(false).catch(()=>{});            // 홈 요약·NEW 점을 위해 조용히 미리 받아 둔다(5분 안엔 다시 안 받는다)
}
window.foodOpen = foodOpen; window.foodEnter = foodEnter; window.foodCount = () => items('food').length; window.foodItems = items;
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
