/* ── 🚌 양양 ↔ 동서울 시외버스 남은 좌석 ──────────────────────────────────
   서버(/api/bus-seats)가 티머니 배차 조회를 대신 읽어 '몇 석 남았나'를 보여준다(2분 엣지 캐시). 예매는 공식 사이트에서.
   🔔 매진·몇 석 안 남은 차에 '자리 나면 알려줘'를 걸면, 앱이 열려 있는 동안 3분마다 다시 보고 자리가 나면
   알림(진동 + 화면 알림 + 허락했다면 휴대폰 알림)을 준다. 앱을 닫으면 멈춘다 — 닫혀 있을 때 푸시는 아직 없다.
   (예전 '자리 제보' 게시판은 쓰는 사람이 없어 없앴다.) */
(function(){
const $b = id => document.getElementById(id);
const WK = 'lineup.share.buswatch', PK = 'lineup.share.buspref';
const ROUTES = { ds:{ n:'동서울', kind:'시외', book:'https://txbus.t-money.co.kr/main.do', bookN:'티머니 시외버스', app:'티머니GO 앱' },
  gb:{ n:'서울경부', kind:'고속', book:'https://www.kobus.co.kr/main.do', bookN:'코버스(고속버스)', app:'고속버스티머니 앱' },
  ic:{ n:'인천', kind:'고속', book:'https://www.kobus.co.kr/main.do', bookN:'코버스(고속버스)', app:'고속버스티머니 앱' } };
const GCLS = g => /프리미엄/.test(g) ? 'pr' : /심야/.test(g) ? 'nt' : /우등/.test(g) ? 'ud' : 'ip';
const read = (k, d) => { try{ return JSON.parse(localStorage.getItem(k) || 'null') || d; }catch(e){ return d; } };
const write = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
const ymd = off => { const d = new Date(Date.now() + off * 864e5); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const DOW = ['일','월','화','수','목','금','토'];
let view = 'bus', pref = { to:'ds', ...read(PK, { dir:'out', day:0 }) }, cache = {}, loading = false, err = '', poll = 0;
const key = (dir, date, to) => `${to || 'ds'}|${dir}|${date}`;
const watches = () => read(WK, []).filter(w=>w.date >= ymd(0));                       // 지난 날짜는 버린다
const wto = w => w.to || 'ds';
const isWatched = (dir, date, t, to) => watches().some(w=>w.dir === dir && w.date === date && w.t === t && wto(w) === to);
const say = m => { if(typeof toast === 'function') toast(m); };

async function fetchDay(dir, date, force, to){
  to = to || 'ds'; const k = key(dir, date, to), c = cache[k];
  if(!force && c && Date.now() - c.at < 110e3) return c.data;
  const r = await fetch(`/api/bus-seats?to=${to}&dir=${dir}&date=${date.replace(/-/g, '')}`);
  if(!r.ok) throw new Error(r.status === 503 ? 'blocked' : 'upstream');
  const j = await r.json(); cache[k] = { at:Date.now(), data:j }; return j;
}

function setView(v){
  view = v; const pane = $b('pane-ride'); pane.dataset.view = v;
  $b('ride-seg')?.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  if(v === 'bus') load(false);
}

async function load(force){
  const date = ymd(pref.day); loading = true; err = ''; render();
  try{ await fetchDay(pref.dir, date, force, pref.to); }catch(e){ err = e.message === 'blocked' ? '지금은 예매 사이트가 조회를 받지 않아요. 잠시 뒤에 다시 볼게요.' : '좌석 정보를 못 불러왔어요 · 신호 확인'; }
  loading = false; render();
}

function seatTag(b){
  if(b.left == null) return `<span class="bs-tag gray">${b.shut ? '마감' : '?'}</span>`;
  if(b.left === 0) return '<span class="bs-tag red">매진</span>';
  return `<span class="bs-tag ${b.left <= 3 ? 'orange' : 'green'}">${b.left}석${b.total ? `<small>/${b.total}</small>` : ''}</span>`;
}
function render(){
  const root = $b('bus-view'); if(!root || view !== 'bus') return;
  const date = ymd(pref.day), c = cache[key(pref.dir, date, pref.to)], d = c?.data, nowHM = new Date().toTimeString().slice(0, 5), RT = ROUTES[pref.to] || ROUTES.ds;
  const list = (d?.buses || []).filter(b=>pref.day > 0 || b.t > nowHM);
  const [a, z] = pref.dir === 'out' ? ['양양', RT.n] : [RT.n, '양양'];
  const ago = d ? Math.max(0, Math.round((Date.now() - new Date(d.fetched).getTime()) / 6e4)) : null;
  const W = watches();
  root.innerHTML = `
    <div class="bus-hd"><b>🚌 시외버스 남은 좌석</b>
      <small>${ago != null ? `${ago ? ago + '분 전' : '방금'} 기준 · ` : ''}매진 차의 🔕 를 누르면 자리 날 때 알려 드려요</small></div>
    <div class="bs-routes" role="group" aria-label="노선">${Object.entries(ROUTES).map(([k, r])=>`<button type="button" data-bto="${k}" aria-pressed="${pref.to === k}"><b>${r.n}</b><small>${r.kind}</small></button>`).join('')}</div>
    <div class="go-mode bs-dir" role="group" aria-label="방향"><button type="button" data-bdir="out" aria-pressed="${pref.dir === 'out'}">양양 → ${RT.n}</button><button type="button" data-bdir="in" aria-pressed="${pref.dir === 'in'}">${RT.n} → 양양</button></div>
    <div class="bs-days" role="group" aria-label="날짜">${Array.from({ length:7 }, (_, i)=>{ const dd = new Date(ymd(i) + 'T00:00'); return `<button type="button" data-bday="${i}" aria-pressed="${pref.day === i}"><small>${i === 0 ? '오늘' : i === 1 ? '내일' : DOW[dd.getDay()]}</small><b>${dd.getDate()}</b></button>`; }).join('')}</div>
    ${W.length ? `<div class="bs-watching">🔔 알림 거는 중 ${W.length}편 · 앱이 열려 있는 동안 3분마다 확인해요${typeof Notification !== 'undefined' && Notification.permission !== 'granted' ? ' <button type="button" class="btn sm ghost" id="bs-perm">휴대폰 알림 켜기</button>' : ''}</div>` : ''}
    ${loading && !d ? '<div class="skel" aria-hidden="true"><i></i><i></i><i></i></div>' : ''}
    ${err ? `<div class="empty">${err}<br><button type="button" class="btn sm mint" id="bs-retry" style="margin-top:8px">다시 불러오기</button></div>` : ''}
    ${d ? (list.length ? `<div class="bs-list">${list.map(b=>{ const w = isWatched(pref.dir, date, b.t, pref.to), want = b.left === 0 || (b.left != null && b.left <= 3);
        return `<div class="bs-row${b.left === 0 ? ' sold' : ''}"><span class="bs-t">${b.t}</span><span class="bs-m"><b>${b.grade ? `<i class="bs-gr ${GCLS(b.grade)}">${esc(b.grade)}</i>` : ''}${esc(b.co)}</b><small>${b.total ? `${b.total}인승` : ''}${b.dur ? `${b.total ? ' · ' : ''}${esc(b.dur)} 소요` : ''}${b.fare ? ` · ${Number(b.fare).toLocaleString()}원` : ''}</small></span>
          ${seatTag(b)}${want || w ? `<button type="button" class="bs-bell${w ? ' on' : ''}" data-bell="${esc(b.t)}" aria-pressed="${w}" aria-label="${esc(b.t)} 자리 나면 알림">${w ? '🔔' : '🔕'}</button>` : '<span class="bs-bell-sp"></span>'}</div>`; }).join('')}</div>`
      : `<div class="empty">${pref.day === 0 ? '오늘은 더 떠날 버스가 없어요' : '이날은 배차가 없어요'}</div>`) : ''}
    <div class="bs-book"><a class="btn sm blue" href="${RT.book}" target="_blank" rel="noopener">🎫 ${RT.bookN}에서 예매 ↗</a><button type="button" class="btn sm ghost" id="bs-refresh">↻ 새로 보기</button></div>
    <div class="note" style="margin-top:6px">📱 휴대폰은 <b>${RT.app}</b>이 편해요(출발 60분 안 차는 앱에서만 예매돼요) · 등급: <i class="bs-gr ud">우등</i> 28인승 · <i class="bs-gr pr">프리미엄</i> 21인승 · <i class="bs-gr ip">일반</i> 41~45인승<br>출처: ${RT.bookN} · ${a} → ${z} · 좌석 수는 몇 분 늦을 수 있어요</div>
    ${reqHTML()}`;
  root.querySelectorAll('[data-bto]').forEach(b=>b.onclick = ()=>{ pref.to = b.dataset.bto; write(PK, pref); load(false); });
  root.querySelectorAll('[data-bdir]').forEach(b=>b.onclick = ()=>{ pref.dir = b.dataset.bdir; write(PK, pref); load(false); });
  root.querySelectorAll('[data-bday]').forEach(b=>b.onclick = ()=>{ pref.day = +b.dataset.bday; write(PK, pref); load(false); });
  root.querySelectorAll('[data-bell]').forEach(b=>b.onclick = ()=>toggleWatch(pref.dir, date, b.dataset.bell, pref.to));
  $b('bs-retry')?.addEventListener('click', ()=>load(true));
  $b('bs-refresh')?.addEventListener('click', ()=>load(true));
  $b('bs-perm')?.addEventListener('click', askPerm);
  wireReq(root);
}

/* ── 노선 추가 요청 ── 지금은 양양↔동서울만 본다. 필요한 노선을 남기고 🙋 '나도 필요'가 모이면 운영자가 추가한다.
   저장은 맛집 댓글과 같은 place_talk 표(target 'req:bus'), 표시는 reacts('🙋'). 남이 쓴 글은 esc. */
const OWNER_ID = 'infinagree';
let reqs = null, votes = [], reqOpen = false, reqAt = 0;
async function pullReq(force){
  if(typeof api !== 'function' || (!force && reqs && Date.now() - reqAt < 60e3)) return;
  reqAt = Date.now();
  try{ reqs = await api('place_talk?target=eq.req:bus&select=id,user_id,name,cohort,title,text,created_at&order=created_at.desc&limit=60') || []; }catch(e){ reqs = reqs || []; }
  try{ votes = await api('reacts?target=like.ft:c:*&emo=eq.' + encodeURIComponent('🙋') + '&select=id,user_id,target&limit=1000') || []; }catch(e){}
  if(view === 'bus') render();
}
const vcount = id => votes.filter(v=>v.target === 'ft:c:' + id).length;
const voted = id => typeof ME !== 'undefined' && ME && votes.some(v=>v.target === 'ft:c:' + id && v.user_id === ME.id);
function reqHTML(){
  if(reqs === null){ pullReq(); return ''; }
  const L = reqs.slice().sort((a,b)=>vcount(b.id) - vcount(a.id));
  return `<div class="bs-req"><div class="bs-rh"><b>🗺️ 다른 노선도 보고 싶어요</b><small>필요한 노선을 남겨 주세요 · 🙋 '나도 필요'가 많은 순서로 추가해요</small></div>
    ${L.map(r=>{ const n = vcount(r.id), me = voted(r.id), mine = ME && (r.user_id === ME.id || ME.id === OWNER_ID);
      return `<div class="bs-rq"><span class="bs-rq-m"><b>${esc(r.title)}</b><small>${esc(r.name)}${r.text ? ' · ' + esc(r.text) : ''}</small></span>
        <button type="button" class="bs-vote${me ? ' on' : ''}" data-rvote="${esc(r.id)}" data-rto="${esc(r.user_id)}" aria-pressed="${me}">🙋 ${n || ''}</button>${mine ? `<button type="button" class="bs-vote" data-rdel="${esc(r.id)}" aria-label="요청 지우기">🗑</button>` : ''}</div>`; }).join('') || '<div class="note" style="margin:6px 0">아직 요청이 없어요 — 첫 요청을 남겨 주세요</div>'}
    ${reqOpen ? `<div class="bs-rf"><input id="br-from" maxlength="12" placeholder="출발 (예: 속초)" aria-label="출발"><span>→</span><input id="br-to" maxlength="12" placeholder="도착 (예: 서울경부)" aria-label="도착"></div>
      <input id="br-note" maxlength="40" placeholder="언제 주로 타요? (선택) 예: 일요일 저녁" aria-label="메모" style="margin-top:6px">
      <div class="err" id="br-err"></div>
      <div class="food-btns"><button type="button" class="btn sm mint" id="br-go">요청하기</button><button type="button" class="btn sm ghost" id="br-close">닫기</button></div>`
      : '<button type="button" class="btn sm mint" id="br-open" style="margin-top:8px">➕ 노선 추가 요청</button>'}</div>`;
}
function wireReq(root){
  $b('br-open')?.addEventListener('click', ()=>{ reqOpen = true; render(); setTimeout(()=>$b('br-from')?.focus(), 30); });
  $b('br-close')?.addEventListener('click', ()=>{ reqOpen = false; render(); });
  $b('br-go')?.addEventListener('click', sendReq);
  root.querySelectorAll('[data-rvote]').forEach(b=>b.onclick = ()=>vote(b.dataset.rvote, b.dataset.rto));
  root.querySelectorAll('[data-rdel]').forEach(b=>b.onclick = async ()=>{ if(!confirm('이 요청을 지울까요?')) return;
    try{ await api(`place_talk?id=eq.${encodeURIComponent(b.dataset.rdel)}`, { method:'DELETE' }); reqs = reqs.filter(r=>r.id !== b.dataset.rdel); render(); }catch(e){ say('지우지 못했어요'); } });
}
const clean = v => String(v || '').replace(/[<>&"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12);
async function sendReq(){
  if(typeof ME === 'undefined' || !ME) return;
  const from = clean($b('br-from')?.value), to = clean($b('br-to')?.value), note = String($b('br-note')?.value || '').trim().slice(0, 40), E = t => { const e = $b('br-err'); if(e) e.textContent = t; };
  if(!from || !to) return E('출발과 도착을 적어 주세요');
  if(from === to) return E('출발과 도착이 같아요');
  const title = `${from} → ${to}`, dup = (reqs || []).find(r=>r.title.replace(/\s/g, '') === title.replace(/\s/g, ''));
  if(dup){ if(!voted(dup.id)) await vote(dup.id, dup.user_id); reqOpen = false; render(); return say('이미 있는 요청이라 🙋 나도 필요에 한 표 넣었어요'); }
  const row = { id:`${ME.id}|${Date.now()}`, target:'req:bus', parent:null, user_id:ME.id, name:ME.name, cohort:ME.cohort || 'open', title, text:note || null, created_at:new Date().toISOString() };
  try{ await api('place_talk', { method:'POST', body:JSON.stringify(row) }); reqs = [row, ...(reqs || [])]; reqOpen = false; render(); say('노선 요청을 남겼어요 🙌'); }
  catch(e){ E('남기지 못했어요 · 신호 확인'); }
}
async function vote(id, to){
  if(typeof ME === 'undefined' || !ME) return;
  const target = 'ft:c:' + id, rid = `${ME.id}|${target}|🙋`, had = voted(id);
  votes = had ? votes.filter(v=>v.id !== rid) : [...votes, { id:rid, user_id:ME.id, target }]; render();
  try{ if(had) await api(`reacts?id=eq.${encodeURIComponent(rid)}`, { method:'DELETE' });
       else await api('reacts', { method:'POST', body:JSON.stringify({ id:rid, user_id:ME.id, name:ME.name, target, emo:'🙋', to_user:to || null }) }); }
  catch(e){ say('반영하지 못했어요'); }
}

function askPerm(){ try{ Notification.requestPermission().then(()=>render()); }catch(e){} }
function toggleWatch(dir, date, t, to){
  to = to || 'ds'; const same = w=>w.dir === dir && w.date === date && w.t === t && wto(w) === to;
  let W = read(WK, []); const on = W.some(same);
  if(on) W = W.filter(w=>!same(w));
  else{ const b = (cache[key(dir, date, to)]?.data?.buses || []).find(x=>x.t === t);
    W.push({ to, dir, date, t, at:Date.now(), last:b?.left ?? null }); say('🔔 자리 나면 알려 드릴게요 (앱이 열려 있는 동안)');
    if(typeof Notification !== 'undefined' && Notification.permission === 'default') askPerm(); }
  write(WK, W.filter(w=>w.date >= ymd(0)).slice(-12)); render(); startPoll();
}

/* 알림 확인 — 걸어 둔 차의 남은 좌석이 걸 때(마지막으로 본 때)보다 늘고 1석 이상이면 알린다 */
async function check(){
  const W = watches(); if(!W.length || document.hidden) return;
  const groups = [...new Set(W.map(w=>key(w.dir, w.date, wto(w))))];
  for(const g of groups){
    const [to, dir, date] = g.split('|'); let d;
    try{ d = await fetchDay(dir, date, false, to); }catch(e){ continue; }
    for(const w of W.filter(x=>x.dir === dir && x.date === date && wto(x) === to)){
      const b = (d.buses || []).find(x=>x.t === w.t); if(!b || b.left == null) continue;
      if(w.last != null && b.left > w.last && b.left > 0){
        const rn = (ROUTES[to] || ROUTES.ds).n, [a, z] = dir === 'out' ? ['양양', rn] : [rn, '양양'];
        const msg = `🚌 ${a}→${z} ${date.slice(5).replace('-', '.')} ${w.t} 자리 ${b.left}석 났어요!`;
        say(msg); navigator.vibrate?.([40, 60, 40, 60, 80]);
        try{ if(typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification('SurfShare 버스 자리', { body:msg, icon:'icon-192.png', tag:'bus-' + g + w.t }); }catch(e){}
      }
      w.last = b.left;
    }
  }
  const all = read(WK, []); all.forEach(x=>{ const n = W.find(y=>y.dir === x.dir && y.date === x.date && y.t === x.t && wto(y) === wto(x)); if(n) x.last = n.last; }); write(WK, all);
  if(view === 'bus') render();
}
function startPoll(){ clearInterval(poll); if(watches().length){ poll = setInterval(check, 180e3); } }

function wire(){
  $b('ride-seg')?.querySelectorAll('[data-view]').forEach(b=>b.onclick = ()=>setView(b.dataset.view));
  startPoll(); if(watches().length) setTimeout(check, 4000);
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden && watches().length) check(); });
}
window.busCheck = ()=>{};                                        // 예전 제보 게시판이 부르던 자리 — 남겨 둔다
window.busRender = ()=>{ if(view === 'bus') render(); };
window.busOpen = ()=>{ if(typeof setTab === 'function') setTab('ride'); setView('bus'); };
window.busEnter = ()=>{ setView(view); pullReq(); };
window.carOpen = ()=>{ if(typeof setTab === 'function') setTab('ride'); setView('car'); };
window._bus = { check, toggleWatch, watches, fetchDay, get cache(){ return cache; } };
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
