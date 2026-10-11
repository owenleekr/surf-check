/* ── 맛집·서핑 스팟 탭 ──────────────────────────────────────────────
   맛집: 네이버지도 '공유 폴더'를 서버(/api/naver-list)가 대신 읽어 준다. 폴더에 가게를 추가하면 최대 10분 안에 여기에도 나타난다.
   서핑 스팟: 네이버 '양서학 서핑 스팟 리스트' 폴더(kind 'spot')를 같은 방식으로 읽고, 앱의 해변 캠(SEAS)과 이름이 맞으면 캠 버튼을 붙인다.
   남이 쓴 글(한줄평·이름·주소)은 모두 esc, 링크는 http(s) 만(safeHttp). 서버가 안 닿으면 마지막으로 받은 목록을 보여준다. */
(function(){
const KEY = 'lineup.share.food', SEEN = 'lineup.share.foodseen', FRESH = 5 * 60e3;
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

function howTo(link){
  return `<div class="food-how"><b>➕ 맛집 추가하는 법</b>
    <ol><li>네이버지도 앱에서 가게를 검색해 <b>⭐ 저장</b> → 폴더 <b>‘양서학 추천 맛집’</b> 선택 → 메모에 한줄평</li>
      <li><b>10분 안에 이 목록에 자동으로</b> 나타나요 — 앱에서 따로 등록할 필요가 없어요</li>
      <li>폴더에 직접 넣을 수 없다면(편집 권한이 필요해요) 맨 아래 <b>‘추가 요청하기’</b>를 남겨 주세요</li></ol>
    <div class="food-btns"><button type="button" class="btn sm mint" data-guide="food">📖 자세한 가이드</button>
      <a class="btn sm blue" href="${esc(safeHttp(link) || '#')}" target="_blank" rel="noopener">🍜 네이버지도 맛집 리스트 열기 ↗</a></div></div>`;
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
        <div class="acts"><a class="btn sm mint" href="${esc(link)}" target="_blank" rel="noopener">네이버지도에서 보기 ↗</a></div>${FT.block('food', i.id)}</article>`; }).join('') || '<div class="empty">이 지역에는 아직 없어요</div>'}
    ${FT.reqs('food')}`;
  root.querySelectorAll('[data-area]').forEach(b=>b.onclick = ()=>{ area = b.dataset.area; render(); });
  root.querySelectorAll('[data-sort]').forEach(b=>b.onclick = ()=>{ sort = b.dataset.sort; render(); });
}

/* 서핑 스팟 — 네이버 '서핑 스팟' 폴더(kind 'spot')가 본체. 폴더에 스팟을 추가하면 10분 안에 여기 나타난다.
   앱의 해변 캠(SEAS)과 이름이 맞으면 📹 캠 버튼이 붙고, 폴더에 없는 캠 해변은 아래에 따로 보여준다. 모든 글은 esc */
const spotKey = n => String(n).replace(/해수욕장|해변|[\s·]/g, '').replace(/[0-9]+리$/, '');
let sarea = '전체';
function renderSpots(root){
  const search = n => `https://map.naver.com/p/search/${encodeURIComponent(String(n).replace(/·/g, ' ') + (/해수욕장|해변|항|교$/.test(n) ? '' : ' 해변'))}`;
  const f = folders('spot')[0], all = items('spot'), dist = i => distKm(i.lat, i.lon);
  const camOf = n => SEAS.find(x=>x[2] && spotKey(x[0]) === spotKey(n));
  const used = new Set(all.map(i=>camOf(i.n)?.[0]).filter(Boolean));
  const only = SEAS.filter(x=>x[2] && !used.has(x[0])).map(x=>({ id:'cam-' + x[1], n:x[0], lat:x[3], lon:x[4], cam:true })).sort((a,b)=>dist(a) - dist(b));
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
        ${cam ? `<button type="button" class="btn sm blue" data-cam="${esc(cam[0])}">📹 지금 파도 보기</button>` : ''}</div>${FT.block('spot', i.id || ('cam-' + (cam?.[1] || '')))}</article>`; };
  root.innerHTML = `
    <div class="food-hd"><b>${esc(f?.title || '🏄 양양 서핑 스팟')}</b><span>${esc(f?.memo || '학교에서 가까운 순 · 캠이 있는 곳은 바로 볼 수 있어요')}</span>
      ${f ? `<small>${all.length}곳 · 네이버지도 폴더와 자동으로 맞춰져요</small>` : ''}</div>
    ${f ? `<div class="food-how"><b>➕ 스팟 추가하는 법</b>
      <ol><li>네이버지도 앱에서 해변·포인트를 검색해 <b>⭐ 저장</b> → 폴더 <b>‘양서학 서핑 스팟 리스트’</b>를 고르고, 메모에 포인트·파도 특징을 적어요</li>
        <li><b>10분 안에 이 목록에 자동으로</b> 나타나요 — 군사시설 등 알리고 싶지 않은 곳은 메모에 <b>‘외부유출 금지’</b>라고 적으면 앱에는 안 올라와요</li>
      <li>폴더에 직접 넣을 수 없다면(편집 권한이 필요해요) 맨 아래 <b>‘추가 요청하기’</b>를 남겨 주세요</li></ol>
      <div class="food-btns"><button type="button" class="btn sm mint" data-guide="spot">📖 자세한 가이드</button>
        <a class="btn sm blue" href="${esc(safeHttp(f.link) || '#')}" target="_blank" rel="noopener">🏄 네이버지도 서핑 스팟 리스트 열기 ↗</a></div></div>` : ''}
    ${areas.length > 1 ? `<div class="food-chips" role="group" aria-label="지역">${areas.map(a=>`<button type="button" aria-pressed="${a === sarea}" data-sarea="${esc(a)}">${esc(a)} <small>${counts[a]}</small></button>`).join('')}</div>` : ''}
    ${list.map(i=>card(i, true)).join('')}
    ${only.length && (sarea === '전체' || sarea === '양양') ? `<div class="pt" style="margin-top:16px;color:var(--paper);text-shadow:2px 2px 0 var(--ink)">캠으로 볼 수 있는 다른 해변</div>` + only.map(i=>card(i, false)).join('') : ''}
    ${!f && !all.length ? '<div class="empty">스팟 목록을 아직 못 불러왔어요</div>' : ''}
    ${FT.reqs('spot')}`;
  root.querySelectorAll('[data-cam]').forEach(b=>b.onclick = ()=>{ setSea(b.dataset.cam); setTab('cam'); });
  root.querySelectorAll('[data-sarea]').forEach(b=>b.onclick = ()=>{ sarea = b.dataset.sarea; render(); });
}

function render(force){
  const root = $f('food-body'); if(!root || state.tab !== 'food') return;
  const ae = document.activeElement; if(force !== true && ae && root.contains(ae) && ae.matches('input')) return;   // 글 쓰는 중에 배경 갱신이 칸을 날리지 않게
  $f('food-seg')?.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.view === view)));
  view === 'spot' ? renderSpots(root) : renderFood(root);
}
function markSeen(){ try{ localStorage.setItem(SEEN, JSON.stringify(items('food').map(i=>i.id))); }catch(e){} badge(); }

function foodEnter(){ render(); FT.pull(); load(false).then(()=>setTimeout(markSeen, 1500)); }
function foodOpen(v){ if(v) view = v; if(state.tab !== 'food') setTab('food'); else foodEnter(); }

/* 네이버 리스트 추가 가이드 — 맛집/스팟 공통 5단계 + 메모 요령 + 자주 묻는 것 */
function guideHTML(k){
  const food = k !== 'spot', fn = food ? '양서학 추천 맛집' : '양서학 서핑 스팟 리스트';
  const ex = food ? '물회 시키세요 · 웨이팅 20분 · 주차 가능' : '북쪽 막혀서 큰 파도 좋음 · 주차는 해변 앞 · 초보는 안쪽';
  return `<div class="gd"><div class="seg" role="group" aria-label="가이드 종류"><button type="button" data-gk="food" aria-pressed="${food}">🍜 맛집</button><button type="button" data-gk="spot" aria-pressed="${!food}">🏄 스팟</button></div>
    <ol class="gd-st">
      <li><b>1. 검색</b><span>네이버지도 앱을 열고 ${food ? '가게 이름' : '해변·포인트 이름'}을 검색해요. ${food ? '지점이 여러 개면 가본 지점으로.' : '‘○○해수욕장’처럼 이름으로 찾으면 돼요.'}</span></li>
      <li><b>2. ⭐ 저장</b><span>장소 화면에서 <b>⭐ 저장</b>을 눌러요.</span></li>
      <li><b>3. 폴더 고르기</b><span>저장 폴더 목록에서 <b>‘${esc(fn)}’</b>를 선택해요. 폴더가 안 보이면 아래 ‘자주 묻는 것’을 봐 주세요.</span></li>
      <li><b>4. 메모 한 줄</b><span>메모 칸에 이렇게 적어요 → <i>${esc(ex)}</i><br>앱에 💬 로 그대로 보여요.</span></li>
      <li><b>5. 끝</b><span><b>10분 안에</b> 이 앱 ${food ? '맛집' : '서핑 스팟'} 목록에 자동으로 나타나요. 새로 고칠 필요 없어요.</span></li></ol>
    <div class="gd-tip"><b>메모 팁</b><ul><li>첫머리에 핵심(메뉴·특징) → 뒤에 가격·웨이팅·주의</li>
      ${food ? '<li>예: “갈비탕 · 웨이팅 30분 · 점심 전에 가요”</li>' : '<li>파도 방향·위험(리프·이안류)·주차·허가 필요 여부를 적어 주세요</li>'}
      <li><b>군사시설·허가가 필요한 곳</b>은 메모에 <b>‘외부유출 금지’</b>를 적으면 앱에는 안 올라와요</li></ul></div>
    <div class="gd-tip"><b>자주 묻는 것</b><ul>
      <li><b>폴더가 안 보여요 / 저장이 안 돼요</b> — 폴더에 직접 넣으려면 편집 권한이 필요해요. 권한이 없으면 목록 맨 아래 <b>‘추가 요청하기’</b>에 이름·링크·한줄평을 남겨 주세요. 목록에 올라오면 ✅ 로 바뀌어요.</li>
      <li><b>10분이 지났는데 안 보여요</b> — 맛집 탭을 닫았다 다시 열어 보세요. 폐업으로 표시된 곳, 메모에 ‘외부유출 금지’가 있는 곳은 숨겨져요.</li>
      <li><b>지우고 싶어요</b> — 폴더에서 지우면 10분 안에 앱에서도 사라져요.</li>
      <li><b>가게 말고 한마디만 남기고 싶어요</b> — 각 카드의 <b>💬 댓글</b>·<b>👍 추천</b>·<b>🙋 가봤어요</b>를 눌러 주세요(내 기수가 같이 보여요).</li></ul></div></div>`;
}
let guideKind = 'food';
function guideOpen(k){
  guideKind = k === 'spot' ? 'spot' : 'food';
  let sh = $f('food-guide');
  if(!sh){ sh = document.createElement('div'); sh.className = 'sheet'; sh.id = 'food-guide';
    sh.innerHTML = '<div class="sheet-dim" data-gclose></div><div class="sheet-in"><div class="sheet-hd"><span class="t">📖 네이버 리스트 추가 가이드</span><button class="btn sm ghost" data-gclose>닫기</button></div><div id="food-guide-body"></div></div>';
    document.body.appendChild(sh);
    sh.addEventListener('click', e=>{ if(e.target.closest('[data-gclose]')) sh.hidden = true;
      const g = e.target.closest('[data-gk]'); if(g){ guideKind = g.dataset.gk; $f('food-guide-body').innerHTML = guideHTML(guideKind); } }); }
  $f('food-guide-body').innerHTML = guideHTML(guideKind); sh.hidden = false;
}
window.foodGuide = guideOpen;

function wire(){
  FT.init($f('food-body'), ()=>render(true), items);
  $f('food-body')?.addEventListener('click', e=>{ const b = e.target.closest('[data-guide]'); if(b) guideOpen(b.dataset.guide); });
  $f('food-seg')?.querySelectorAll('[data-view]').forEach(b=>b.onclick = ()=>{ view = b.dataset.view; render(); window.scrollTo({ top:0, behavior:'smooth' }); });
  load(false).catch(()=>{});            // 홈 요약·NEW 점을 위해 조용히 미리 받아 둔다(5분 안엔 다시 안 받는다)
}
window.foodOpen = foodOpen; window.foodEnter = foodEnter; window.foodCount = () => items('food').length; window.foodItems = items;
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
