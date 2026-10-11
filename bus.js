/* ── 🚌 버스 자리 제보 ───────────────────────────────────────────────
   양양↔동서울 시외버스 빈자리는 예매 사이트(버스타고·티머니)만 알고, 두 사이트 모두 robots.txt 로 자동 조회를 막아 둔다.
   그래서 서버가 대신 긁어오지 않는다 — 자리가 난 걸 *본 사람이 올리고*, 찾는 사람에게 앱이 알려 준다.
   새 서버 설정 없이 rides 표를 쓴다(dir 'bus_out'=양양→서울, 'bus_in'=서울→양양). pullRides 가 카풀과 갈라 준다. */
(function(){
const $b = id => document.getElementById(id);
const WK = 'lineup.share.busw', SK = 'lineup.share.busseen';
const NAMES = { bus_out:['양양','동서울'], bus_in:['동서울','양양'] };
const BOOK = [['🚌 버스타고(전국 시외버스 예매) ↗','https://www.bustago.or.kr/'], ['티머니 시외버스 예매 ↗','https://txbus.t-money.co.kr/']];
let view = 'car', open = false;
const read = k => { try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } };
const write = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
const when = r => new Date(`${r.date}T${r.depart_at || '23:59'}:00`).getTime();
const alive = r => when(r) > Date.now();                                   // 이미 떠난 버스의 제보는 의미가 없다
const dlabel = r => `${typeof dShort === 'function' ? dShort(r.date) : r.date} ${typeof hLabel === 'function' ? hLabel(r.depart_at) : r.depart_at}`;
const list = () => (state.bus || []).filter(alive).sort((a,b)=>when(a) - when(b));

function setView(v){
  view = v; const pane = $b('pane-ride'); pane.dataset.view = v;
  $b('ride-seg')?.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  if(v === 'bus'){ render(); const s = new Set((state.bus || []).map(r=>r.id)); write(SK, [...s]); const d = $b('bus-new'); if(d) d.hidden = true; }
}

function render(){
  const root = $b('bus-view'); if(!root) return;
  const w = read(WK) || { dir:'bus_out', on:false }, rows = list();
  root.innerHTML = `
    <div class="bus-hd"><b>🚌 양양 ↔ 동서울 시외버스 빈자리</b>
      <small>예매 사이트가 자동 조회를 막아 두어, <b>자리가 난 걸 본 사람이 올리면</b> 찾는 사람에게 알려줘요. 예매·결제는 공식 사이트에서만 돼요.</small>
      <div class="food-btns">${BOOK.map(([t,u])=>`<a class="btn sm blue" href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join('')}</div></div>
    <div class="bus-watch"><label class="bw"><input type="checkbox" id="bw-on" ${w.on ? 'checked' : ''}> <b>🔔 자리 나면 알려주세요</b></label>
      <div class="bw-opts"><button type="button" data-bw="bus_out" aria-pressed="${w.dir === 'bus_out'}">양양 → 동서울</button><button type="button" data-bw="bus_in" aria-pressed="${w.dir === 'bus_in'}">동서울 → 양양</button><button type="button" data-bw="any" aria-pressed="${w.dir === 'any'}">둘 다</button></div>
      <small>앱을 열어 둔 동안 새 제보가 오면 알려요 (앱이 닫혀 있으면 열 때 보여요)</small></div>
    <details class="px sand fold" id="bus-form" ${open ? 'open' : ''}><summary>➕ 자리 났어요 — 제보하기</summary>
      <div class="grid2" style="margin-top:8px">
        <div><label for="bs-dir">방향</label><select id="bs-dir"><option value="bus_out">양양 → 동서울</option><option value="bus_in">동서울 → 양양</option></select></div>
        <div><label for="bs-seats">남은 자리</label><input id="bs-seats" type="number" min="1" max="45" value="2"></div>
        <div><label for="bs-date">날짜</label><input id="bs-date" type="date"></div>
        <div><label for="bs-time">출발 시각</label><input id="bs-time" type="time"></div></div>
      <label for="bs-note">한마디 (선택)</label><input id="bs-note" maxlength="40" placeholder="예) 우등 · 예매 사이트 취소표">
      <div class="err" id="bs-err"></div><button class="btn mint" id="bs-save" style="width:100%;margin-top:6px">제보하기</button></details>
    ${rows.length ? rows.map(r=>{ const [a,b] = NAMES[r.dir] || ['', ''], full = !(r.seats > 0), mins = Math.max(0, Math.round((Date.now() - new Date(r.created_at || Date.now())) / 6e4));
      return `<article class="card bus-card${full ? ' full' : ''}"><div class="hd"><span class="tag" style="background:${r.dir === 'bus_out' ? 'var(--mint)' : 'var(--sun)'}">${esc(a)} → ${esc(b)}</span><b>${esc(dlabel(r))}</b></div>
        <div class="meta">${full ? '<b>다 찼대요</b>' : `남은 자리 <b>${+r.seats || 0}석</b>`} · ${esc(r.name)} 님 제보 · <b>${mins < 2 ? '방금' : mins < 60 ? mins + '분 전' : Math.round(mins/60) + '시간 전'}</b>${r.note ? ` · ${esc(r.note)}` : ''}</div>
        <div class="acts"><a class="btn sm mint" href="https://www.bustago.or.kr/" target="_blank" rel="noopener">예매하러 가기 ↗</a>
          ${full ? '' : `<button type="button" class="btn sm ghost" data-full="${esc(r.id)}">✋ 다 찼어요</button>`}</div></article>`; }).join('')
      : `<div class="empty">지금 올라온 제보가 없어요.<br>예매 사이트에서 자리를 보셨다면 위에서 제보해 주세요</div>`}
    <div class="note">제보는 출발 시각이 지나면 자동으로 사라져요. 확인되지 않은 정보이니 예매 사이트에서 꼭 다시 확인하세요.</div>`;
  const dt = $b('bs-date'); if(dt && !dt.value) dt.value = (typeof today === 'function') ? today() : '';
  $b('bus-form')?.addEventListener('toggle', e=>{ open = e.target.open; });
  $b('bw-on').onchange = e=>{ write(WK, { ...(read(WK) || { dir:'bus_out' }), on:e.target.checked }); if(e.target.checked) toast('🔔 새 제보가 오면 알려드릴게요'); };
  root.querySelectorAll('[data-bw]').forEach(b=>b.onclick = ()=>{ write(WK, { ...(read(WK) || {}), dir:b.dataset.bw }); render(); });
  root.querySelectorAll('[data-full]').forEach(b=>b.onclick = async ()=>{ b.disabled = true;
    try{ await api(`rides?id=eq.${encodeURIComponent(b.dataset.full)}`, { method:'PATCH', body:JSON.stringify({ seats:0 }) }); toast('다 찼다고 표시했어요'); pullRides(); }
    catch(e){ b.disabled = false; toast('실패 · 신호 확인'); } });
  $b('bs-save').onclick = save;
}

async function save(){
  const e = $b('bs-err'), btn = $b('bs-save'); e.textContent = '';
  const dir = $b('bs-dir').value, date = $b('bs-date').value, time = $b('bs-time').value, seats = Math.max(1, Math.min(45, +$b('bs-seats').value || 1));
  if(!date || !time) return e.textContent = '날짜와 출발 시각을 골라주세요';
  if(date < today() || (date === today() && time < nowHM())) return e.textContent = '이미 떠난 시각이에요 — 앞으로의 버스만 제보할 수 있어요';
  if(btn.disabled) return; const [a, b] = NAMES[dir];
  const row = { id:`${ME.id}|${Date.now()}`, user_id:ME.id, name:ME.name, cohort:ME.cohort, profile:pubRow(), date, dir, depart_at:time,
    from_place:a, to_place:b, seats, riders:[], note:$b('bs-note').value.trim().slice(0, 40) || null, created_at:new Date().toISOString() };
  btn.disabled = true;
  try{ await api('rides', { method:'POST', body:JSON.stringify(row) }); toast('제보했어요 — 고마워요!'); $b('bs-note').value = ''; open = false; await pullRides(); }
  catch(err){ e.textContent = err.code === 'notable' ? '서버에 표가 아직 없어요' : '올리지 못했어요 · 신호 확인'; }
  finally{ btn.disabled = false; }
}

/* pullRides 가 끝날 때마다 불린다 — 새 제보가 알림 조건에 맞으면 한 번 알려준다 */
function check(){
  const w = read(WK); const seen = new Set(read(SK) || []);
  const fresh = (state.bus || []).filter(r=>alive(r) && r.seats > 0 && r.user_id !== ME.id && !seen.has(r.id));
  const d = $b('bus-new'); if(d){ d.hidden = !(fresh.length && view !== 'bus'); d.textContent = fresh.length ? `NEW ${fresh.length}` : ''; }
  if(view === 'bus') render();
  if(!w || !w.on) return;
  const hit = fresh.filter(r=>w.dir === 'any' || r.dir === w.dir);
  const notified = new Set(read('lineup.share.busnote') || []); const todo = hit.filter(r=>!notified.has(r.id));
  if(!todo.length) return;
  const r = todo[0], [a, b] = NAMES[r.dir] || ['', ''];
  toast(`🚌 ${a}→${b} ${dlabel(r)} 자리 ${r.seats}석 났대요!${todo.length > 1 ? ` (외 ${todo.length - 1}건)` : ''}`); navigator.vibrate?.([30, 40, 30]);
  write('lineup.share.busnote', [...notified, ...todo.map(x=>x.id)].slice(-50));
}

function wire(){ $b('ride-seg')?.querySelectorAll('[data-view]').forEach(b=>b.onclick = ()=>setView(b.dataset.view)); }
window.busCheck = check; window.busRender = ()=>{ if(view === 'bus') render(); };
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
