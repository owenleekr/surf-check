/* ── 맛집·서핑 스팟 탭 ──────────────────────────────────────────────
   맛집: 네이버지도 '공유 폴더'를 서버(/api/naver-list)가 대신 읽어 준다. 폴더에 가게를 추가하면 최대 10분 안에 여기에도 나타난다.
   서핑 스팟: 네이버 '양서학 서핑 스팟 리스트' 폴더(kind 'spot')를 같은 방식으로 읽고, 앱의 해변 캠(SEAS)과 이름이 맞으면 캠 버튼을 붙인다.
   남이 쓴 글(한줄평·이름·주소)은 모두 esc, 링크는 http(s) 만(safeHttp). 서버가 안 닿으면 마지막으로 받은 목록을 보여준다. */
(function(){
const KEY = 'lineup.share.food', SEEN = 'lineup.share.foodseen', FRESH = 5 * 60e3;
const OWNER = { id:'infinagree', name:'이성현' };                 // 네이버 폴더 주인 — '추천 쪽지'를 받는다
let data = null, view = 'food', area = '전체', sort = 'near', busy = false, failed = false;
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
}

/* 추천 쪽지 — 폴더에 직접 못 넣는 사람은 폴더 주인에게 가게 이름·링크·한줄평을 보낸다(기존 쪽지 기능, 새 서버 설정 없음) */
function recommend(){
  if(typeof canMail === 'function' && !canMail()) return toast('쪽지를 쓰려면 한 번 다시 로그인해 주세요');
  mailOpen(OWNER.id, OWNER.name);
  setTimeout(()=>{ const t = $f('mail-text'); if(t && !t.value) t.value = '맛집 추천해요!\n가게 이름: \n네이버지도 링크: \n한줄평: '; }, 120);
}

function howTo(link){
  return `<div class="food-how"><b>➕ 맛집 추가하는 법</b>
    <ol><li>네이버지도 앱에서 가게를 검색해 <b>⭐ 저장</b> → 폴더 <b>‘양서학 추천 맛집’</b>을 고르고, 메모에 한줄평을 적어요</li>
      <li>그러면 <b>10분 안에 이 목록에 자동으로</b> 나타나요 — 앱에서 따로 등록할 필요가 없어요</li>
      <li>폴더에 직접 넣기 어려우면 <b>추천 쪽지</b>로 가게 이름·링크·한줄평을 보내 주세요</li></ol>
    <div class="food-btns"><a class="btn sm blue" href="${esc(safeHttp(link) || '#')}" target="_blank" rel="noopener">🍜 네이버지도 맛집 리스트 열기 ↗</a>
      ${ME && ME.id !== OWNER.id ? '<button type="button" class="btn sm mint" id="food-rec">✉️ 추천 쪽지 보내기</button>' : ''}</div></div>`;
}

function renderFood(root){
  if(!data){ root.innerHTML = busy ? '<div class="skel" aria-hidden="true"><i></i><i></i><i></i></div>' : `<div class="empty">맛집 목록을 아직 못 불러왔어요.<br><button class="btn sm mint" type="button" id="food-retry" style="margin-top:9px">다시 불러오기</button></div>`;
    $f('food-retry')?.addEventListener('click', ()=>load(true)); return; }
  const f = folders('food')[0]; if(!f){ root.innerHTML = '<div class="empty">아직 목록이 없어요</div>'; return; }
  const all = items('food'), counts = { 전체:all.length }; all.forEach(i=>{ const a = areaOf(i.a); counts[a] = (counts[a] || 0) + 1; });
  const areas = ['전체', '양양', '속초', '고성', '강릉', '기타'].filter(a=>counts[a]);
  const seen = seenSet(), week = Date.now() - 7 * 864e5, dist = i => distKm(i.lat, i.lon);
  const list = all.filter(i=>area === '전체' || areaOf(i.a) === area).sort((a,b)=> sort === 'new' ? (b.t - a.t) : (dist(a) - dist(b)));
  const at = (()=>{ try{ const t = JSON.parse(localStorage.getItem(KEY) || 'null')?.at; return t ? new Date(t).toTimeString().slice(0,5) : ''; }catch(e){ return ''; } })();
  root.innerHTML = `
    <div class="food-hd"><b>${esc(f.title)}</b><span>${esc(f.memo || '')}</span>
      <small>${all.length}곳 · 네이버지도 폴더와 자동으로 맞춰져요${at ? ` · 갱신 ${at}` : ''}${failed ? ' · ⚠️ 새로 못 불러와 저장된 목록이에요' : ''}</small></div>
    ${howTo(f.link)}
    <div class="food-chips" role="group" aria-label="지역">${areas.map(a=>`<button type="button" aria-pressed="${a === area}" data-area="${esc(a)}">${esc(a)} <small>${counts[a]}</small></button>`).join('')}</div>
    <div class="food-sort" role="group" aria-label="정렬"><button type="button" aria-pressed="${sort === 'near'}" data-sort="near">📍 학교에서 가까운 순</button><button type="button" aria-pressed="${sort === 'new'}" data-sort="new">🆕 최근 추가 순</button></div>
    ${list.map(i=>{ const km = dist(i), isNew = i.t && i.t > week, fresh = seen.size && !seen.has(i.id);
      const link = safeHttp(i.u) || `https://map.naver.com/p/search/${encodeURIComponent(i.n)}`;
      return `<article class="card food-card"><div class="hd"><b>${esc(i.n)}</b>${i.c ? `<span class="tag">${esc(i.c)}</span>` : ''}${isNew || fresh ? '<span class="tag" style="background:var(--coral);color:#fff">NEW</span>' : ''}</div>
        ${i.m ? `<div class="food-memo">💬 ${esc(i.m)}</div>` : ''}
        <div class="meta">${esc(i.a)} · 학교에서 <b>${km < 10 ? km.toFixed(1) : Math.round(km)}km</b></div>
        <div class="acts"><a class="btn sm mint" href="${esc(link)}" target="_blank" rel="noopener">네이버지도에서 보기 ↗</a></div></article>`; }).join('') || '<div class="empty">이 지역에는 아직 없어요</div>'}`;
  root.querySelectorAll('[data-area]').forEach(b=>b.onclick = ()=>{ area = b.dataset.area; render(); });
  root.querySelectorAll('[data-sort]').forEach(b=>b.onclick = ()=>{ sort = b.dataset.sort; render(); });
  $f('food-rec')?.addEventListener('click', recommend);
}

/* 서핑 스팟 — 네이버 '서핑 스팟' 폴더(kind 'spot')가 본체. 폴더에 스팟을 추가하면 10분 안에 여기 나타난다.
   앱의 해변 캠(SEAS)과 이름이 맞으면 📹 캠 버튼이 붙고, 폴더에 없는 캠 해변은 아래에 따로 보여준다. 모든 글은 esc */
const spotKey = n => String(n).replace(/해수욕장|해변|[\s·]/g, '').replace(/[0-9]+리$/, '');
let sarea = '전체';
function spotRecommend(){
  if(typeof canMail === 'function' && !canMail()) return toast('쪽지를 쓰려면 한 번 다시 로그인해 주세요');
  mailOpen(OWNER.id, OWNER.name);
  setTimeout(()=>{ const t = $f('mail-text'); if(t && !t.value) t.value = '서핑 스팟 추천해요!\n스팟 이름: \n네이버지도 링크: \n한줄 설명(파도·포인트·주의점): '; }, 120);
}
function renderSpots(root){
  const search = n => `https://map.naver.com/p/search/${encodeURIComponent(String(n).replace(/·/g, ' ') + (/해수욕장|해변|항|교$/.test(n) ? '' : ' 해변'))}`;
  const f = folders('spot')[0], all = items('spot'), dist = i => distKm(i.lat, i.lon);
  const camOf = n => SEAS.find(x=>x[2] && spotKey(x[0]) === spotKey(n));
  const used = new Set(all.map(i=>camOf(i.n)?.[0]).filter(Boolean));
  const only = SEAS.filter(x=>x[2] && !used.has(x[0])).map(x=>({ n:x[0], lat:x[3], lon:x[4], cam:true })).sort((a,b)=>dist(a) - dist(b));
  const counts = { 전체:all.length }; all.forEach(i=>{ const a = areaOf(i.a); counts[a] = (counts[a] || 0) + 1; });
  const areas = ['전체', '고성', '속초', '양양', '강릉', '기타'].filter(a=>counts[a]);
  if(!areas.includes(sarea)) sarea = '전체';
  const list = all.filter(i=>sarea === '전체' || areaOf(i.a) === sarea).sort((a,b)=>dist(a) - dist(b));
  const km = i => { const d = dist(i); return d < 10 ? d.toFixed(1) : Math.round(d); };
  const card = (i, fromFolder) => { const cam = camOf(i.n) || (i.cam ? [i.n] : null);
    return `<article class="card food-card"><div class="hd"><b>${esc(i.n)}</b>${cam ? '<span class="tag" style="background:var(--mint)">📹 캠</span>' : ''}</div>
      ${i.m ? `<div class="food-memo">💬 ${esc(i.m)}</div>` : ''}
      <div class="meta">${i.a ? esc(i.a) + ' · ' : ''}학교에서 <b>${km(i)}km</b></div>
      <div class="acts"><a class="btn sm mint" href="${esc(safeHttp(i.u) || search(i.n))}" target="_blank" rel="noopener">네이버지도에서 보기 ↗</a>
        ${cam ? `<button type="button" class="btn sm blue" data-cam="${esc(cam[0])}">📹 지금 파도 보기</button>` : ''}</div></article>`; };
  root.innerHTML = `
    <div class="food-hd"><b>${esc(f?.title || '🏄 양양 서핑 스팟')}</b><span>${esc(f?.memo || '학교에서 가까운 순 · 캠이 있는 곳은 바로 볼 수 있어요')}</span>
      ${f ? `<small>${all.length}곳 · 네이버지도 폴더와 자동으로 맞춰져요</small>` : ''}</div>
    ${f ? `<div class="food-how"><b>➕ 스팟 추가하는 법</b>
      <ol><li>네이버지도 앱에서 해변·포인트를 검색해 <b>⭐ 저장</b> → 폴더 <b>‘양서학 서핑 스팟 리스트’</b>를 고르고, 메모에 포인트·파도 특징을 적어요</li>
        <li><b>10분 안에 이 목록에 자동으로</b> 나타나요 — 군사시설 등 알리고 싶지 않은 곳은 메모에 <b>‘외부유출 금지’</b>라고 적으면 앱에는 안 올라와요</li></ol>
      <div class="food-btns"><a class="btn sm blue" href="${esc(safeHttp(f.link) || '#')}" target="_blank" rel="noopener">🏄 네이버지도 서핑 스팟 리스트 열기 ↗</a>
        ${ME && ME.id !== OWNER.id ? '<button type="button" class="btn sm mint" id="spot-rec">✉️ 스팟 추천 쪽지</button>' : ''}</div></div>` : ''}
    ${areas.length > 1 ? `<div class="food-chips" role="group" aria-label="지역">${areas.map(a=>`<button type="button" aria-pressed="${a === sarea}" data-sarea="${esc(a)}">${esc(a)} <small>${counts[a]}</small></button>`).join('')}</div>` : ''}
    ${list.map(i=>card(i, true)).join('')}
    ${only.length && (sarea === '전체' || sarea === '양양') ? `<div class="pt" style="margin-top:16px;color:var(--paper);text-shadow:2px 2px 0 var(--ink)">캠으로 볼 수 있는 다른 해변</div>` + only.map(i=>card(i, false)).join('') : ''}
    ${!f && !all.length ? '<div class="empty">스팟 목록을 아직 못 불러왔어요</div>' : ''}`;
  root.querySelectorAll('[data-cam]').forEach(b=>b.onclick = ()=>{ setSea(b.dataset.cam); setTab('cam'); });
  root.querySelectorAll('[data-sarea]').forEach(b=>b.onclick = ()=>{ sarea = b.dataset.sarea; render(); });
  $f('spot-rec')?.addEventListener('click', spotRecommend);
}

function render(){
  const root = $f('food-body'); if(!root || state.tab !== 'food') return;
  $f('food-seg')?.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.view === view)));
  view === 'spot' ? renderSpots(root) : renderFood(root);
}
function markSeen(){ try{ localStorage.setItem(SEEN, JSON.stringify(items('food').map(i=>i.id))); }catch(e){} badge(); }

function foodEnter(){ render(); load(false).then(()=>setTimeout(markSeen, 1500)); }
function foodOpen(v){ if(v) view = v; if(state.tab !== 'food') setTab('food'); else foodEnter(); }

function wire(){
  $f('food-seg')?.querySelectorAll('[data-view]').forEach(b=>b.onclick = ()=>{ view = b.dataset.view; render(); window.scrollTo({ top:0, behavior:'smooth' }); });
  load(false).catch(()=>{});            // 홈 요약·NEW 점을 위해 조용히 미리 받아 둔다(5분 안엔 다시 안 받는다)
}
window.foodOpen = foodOpen; window.foodEnter = foodEnter; window.foodCount = () => items('food').length; window.foodItems = items;
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
