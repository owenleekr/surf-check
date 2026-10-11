/* ── 양서학 맛집·스팟 ──────────────────────────────────────────────
   네이버지도 '공유 폴더'를 서버(/api/naver-list)가 대신 읽어 준다. 폴더에 장소를 추가하면 최대 10분 안에 여기에도 나타난다.
   남이 쓴 글(한줄평·이름·주소)은 모두 esc 를 거치고, 링크는 http(s) 만(safeHttp)이다.
   서버가 안 닿으면(신호·오프라인) 마지막으로 받은 목록을 그대로 보여준다. */
(function(){
const KEY = 'lineup.share.food', SEEN = 'lineup.share.foodseen', FRESH = 5 * 60e3;
let data = null, area = '전체', sort = 'near', busy = false, failed = false;
const $f = id => document.getElementById(id);
const areaOf = a => /양양/.test(a) ? '양양' : /속초/.test(a) ? '속초' : /고성/.test(a) ? '고성' : /강릉/.test(a) ? '강릉' : '기타';
const seenSet = () => { try{ return new Set(JSON.parse(localStorage.getItem(SEEN) || '[]')); }catch(e){ return new Set(); } };

function items(){ return (data?.folders || []).flatMap(f=>f.items.map(i=>({ ...i, folder:f.title }))); }
function newCount(){ const s = seenSet(); return s.size ? items().filter(i=>!s.has(i.id)).length : 0; }   // 처음 여는 사람에게 27개가 전부 NEW 로 뜨지 않게

function badge(){
  const n = newCount(), b = $f('food-new');
  if(b){ b.hidden = !n; b.textContent = n ? `NEW ${n}` : ''; }
  const d = $f('stay-dot'); if(d && n && state.tab !== 'stay'){ /* 숙소 탭 점은 기존 글 알림이 쓴다 — 건드리지 않는다 */ }
}

async function load(force){
  if(!data){ try{ data = JSON.parse(localStorage.getItem(KEY) || 'null')?.data || null; }catch(e){} }
  const at = (()=>{ try{ return JSON.parse(localStorage.getItem(KEY) || 'null')?.at || 0; }catch(e){ return 0; } })();
  if(busy || (!force && data && Date.now() - at < FRESH)){ render(); return; }
  busy = true; render();
  try{ const r = await fetch('/api/naver-list'); if(!r.ok) throw new Error('http'); const j = await r.json();
    if(!j.folders?.length) throw new Error('empty'); data = j; failed = false;
    try{ localStorage.setItem(KEY, JSON.stringify({ at:Date.now(), data:j })); }catch(e){}
  }catch(e){ failed = true; }
  busy = false; render(); badge();
}

function render(){
  const root = $f('food-view'); if(!root || root.hidden) return;
  if(!data){ root.querySelector('.food-body').innerHTML = busy ? '<div class="skel" aria-hidden="true"><i></i><i></i><i></i></div>' : `<div class="empty">맛집 목록을 아직 못 불러왔어요.<br><button class="btn sm mint" type="button" id="food-retry" style="margin-top:9px">다시 불러오기</button></div>`;
    $f('food-retry')?.addEventListener('click', ()=>load(true)); return; }
  const f = data.folders[0], all = items();
  const counts = { 전체:all.length }; all.forEach(i=>{ const a = areaOf(i.a); counts[a] = (counts[a] || 0) + 1; });
  const areas = ['전체', '양양', '속초', '고성', '강릉', '기타'].filter(a=>counts[a]);
  const seen = seenSet(), week = Date.now() - 7 * 864e5;
  let list = all.filter(i=>area === '전체' || areaOf(i.a) === area);
  const dist = i => distKm(i.lat, i.lon);
  list.sort((a,b)=> sort === 'new' ? (b.t - a.t) : (dist(a) - dist(b)));
  const at = (()=>{ try{ const t = JSON.parse(localStorage.getItem(KEY) || 'null')?.at; return t ? new Date(t).toTimeString().slice(0,5) : ''; }catch(e){ return ''; } })();
  root.querySelector('.food-body').innerHTML = `
    <div class="food-hd"><b>${esc(f.title)}</b><span>${esc(f.memo || '')}</span>
      <small>${all.length}곳 · 네이버지도 폴더에 장소가 추가되면 최대 10분 안에 여기에도 나타나요${at ? ` · 갱신 ${at}` : ''}${failed ? ' · ⚠️ 새로 못 불러와 저장된 목록이에요' : ''}</small>
      <a class="btn sm ghost" href="${esc(safeHttp(f.link) || '#')}" target="_blank" rel="noopener">네이버지도에서 전체 보기 ↗</a></div>
    <div class="food-chips" role="group" aria-label="지역">${areas.map(a=>`<button type="button" aria-pressed="${a === area}" data-area="${esc(a)}">${esc(a)} <small>${counts[a]}</small></button>`).join('')}</div>
    <div class="food-sort" role="group" aria-label="정렬"><button type="button" aria-pressed="${sort === 'near'}" data-sort="near">📍 학교에서 가까운 순</button><button type="button" aria-pressed="${sort === 'new'}" data-sort="new">🆕 최근 추가 순</button></div>
    ${list.map(i=>{ const km = dist(i), isNew = i.t && i.t > week, fresh = seen.size && !seen.has(i.id);
      const link = safeHttp(i.u) || `https://map.naver.com/p/search/${encodeURIComponent(i.n)}`;
      return `<article class="card food-card"><div class="hd"><b>${esc(i.n)}</b>${i.c ? `<span class="tag">${esc(i.c)}</span>` : ''}${isNew || fresh ? '<span class="tag" style="background:var(--coral);color:#fff">NEW</span>' : ''}</div>
        ${i.m ? `<div class="food-memo">💬 ${esc(i.m)}</div>` : ''}
        <div class="meta">${esc(i.a)} · 학교에서 <b>${km < 10 ? km.toFixed(1) : Math.round(km)}km</b></div>
        <div class="acts"><a class="btn sm mint" href="${esc(link)}" target="_blank" rel="noopener">네이버지도에서 보기 ↗</a></div></article>`; }).join('') || '<div class="empty">이 지역에는 아직 없어요</div>'}
    <div class="note">목록은 폴더 주인이 네이버지도에서 추가해요. 앱에서는 읽기만 해요.</div>`;
  root.querySelectorAll('[data-area]').forEach(b=>b.onclick = ()=>{ area = b.dataset.area; render(); });
  root.querySelectorAll('[data-sort]').forEach(b=>b.onclick = ()=>{ sort = b.dataset.sort; render(); });
}

function markSeen(){ try{ localStorage.setItem(SEEN, JSON.stringify(items().map(i=>i.id))); }catch(e){} badge(); }

function setView(v){
  const pane = $f('pane-stay'); if(!pane) return; pane.dataset.view = v;
  $f('stay-seg')?.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  const root = $f('food-view'); if(root) root.hidden = v !== 'food';
  if(v === 'food'){ load(false).then(()=>{ setTimeout(markSeen, 1500); }); }
}
function foodOpen(){ if(state.tab !== 'stay') setTab('stay'); setView('food'); }

function wire(){
  $f('stay-seg')?.querySelectorAll('[data-view]').forEach(b=>b.onclick = ()=>setView(b.dataset.view));
  load(false).catch(()=>{});            // 홈 요약·NEW 표시를 위해 조용히 미리 받아 둔다(5분 안엔 다시 안 받는다)
}
window.foodOpen = foodOpen; window.foodCount = () => items().length; window.foodItems = items;
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
