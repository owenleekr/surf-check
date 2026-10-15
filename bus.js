/* ── 🚌 양양 ↔ 동서울 시외버스 남은 좌석 ──────────────────────────────────
   서버(/api/bus-seats)가 티머니 배차 조회를 대신 읽어 '몇 석 남았나'를 보여준다(2분 엣지 캐시). 예매는 공식 사이트에서.
   🔔 매진·몇 석 안 남은 차에 '자리 나면 알려줘'를 걸면, 앱이 열려 있는 동안 3분마다 다시 보고 자리가 나면
   알림(진동 + 화면 알림 + 허락했다면 휴대폰 알림)을 준다. 앱을 닫으면 멈춘다 — 닫혀 있을 때 푸시는 아직 없다.
   (예전 '자리 제보' 게시판은 쓰는 사람이 없어 없앴다.) */
(function(){
const $b = id => document.getElementById(id);
const WK = 'lineup.share.buswatch', PK = 'lineup.share.buspref';
const BOOK = 'https://txbus.t-money.co.kr/main.do';
const read = (k, d) => { try{ return JSON.parse(localStorage.getItem(k) || 'null') || d; }catch(e){ return d; } };
const write = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
const ymd = off => { const d = new Date(Date.now() + off * 864e5); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const DOW = ['일','월','화','수','목','금','토'];
let view = 'car', pref = read(PK, { dir:'out', day:0 }), cache = {}, loading = false, err = '', poll = 0;
const key = (dir, date) => `${dir}|${date}`;
const watches = () => read(WK, []).filter(w=>w.date >= ymd(0));                       // 지난 날짜는 버린다
const isWatched = (dir, date, t) => watches().some(w=>w.dir === dir && w.date === date && w.t === t);
const say = m => { if(typeof toast === 'function') toast(m); };

async function fetchDay(dir, date, force){
  const k = key(dir, date), c = cache[k];
  if(!force && c && Date.now() - c.at < 110e3) return c.data;
  const r = await fetch(`/api/bus-seats?dir=${dir}&date=${date.replace(/-/g, '')}`);
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
  try{ await fetchDay(pref.dir, date, force); }catch(e){ err = e.message === 'blocked' ? '지금은 예매 사이트가 조회를 받지 않아요. 잠시 뒤에 다시 볼게요.' : '좌석 정보를 못 불러왔어요 · 신호 확인'; }
  loading = false; render();
}

function seatTag(b){
  if(b.left == null) return `<span class="bs-tag gray">${b.shut ? '마감' : '?'}</span>`;
  if(b.left === 0) return '<span class="bs-tag red">매진</span>';
  return `<span class="bs-tag ${b.left <= 3 ? 'orange' : 'green'}">${b.left}석${b.total ? `<small>/${b.total}</small>` : ''}</span>`;
}
function render(){
  const root = $b('bus-view'); if(!root || view !== 'bus') return;
  const date = ymd(pref.day), c = cache[key(pref.dir, date)], d = c?.data, nowHM = new Date().toTimeString().slice(0, 5);
  const list = (d?.buses || []).filter(b=>pref.day > 0 || b.t > nowHM);
  const [a, z] = pref.dir === 'out' ? ['양양', '동서울'] : ['동서울', '양양'];
  const ago = d ? Math.max(0, Math.round((Date.now() - new Date(d.fetched).getTime()) / 6e4)) : null;
  const W = watches();
  root.innerHTML = `
    <div class="bus-hd"><b>🚌 시외버스 남은 좌석</b>
      <small>티머니 시외버스 예매 화면의 좌석 수예요${ago != null ? ` · ${ago ? ago + '분 전' : '방금'} 기준` : ''}. 매진 차에 🔕 를 누르면 자리 날 때 알려 드려요. 예매는 공식 사이트·앱에서.</small></div>
    <div class="go-mode bs-dir" role="group" aria-label="방향"><button type="button" data-bdir="out" aria-pressed="${pref.dir === 'out'}">양양 → 동서울</button><button type="button" data-bdir="in" aria-pressed="${pref.dir === 'in'}">동서울 → 양양</button></div>
    <div class="bs-days" role="group" aria-label="날짜">${Array.from({ length:7 }, (_, i)=>{ const dd = new Date(ymd(i) + 'T00:00'); return `<button type="button" data-bday="${i}" aria-pressed="${pref.day === i}"><small>${i === 0 ? '오늘' : i === 1 ? '내일' : DOW[dd.getDay()]}</small><b>${dd.getDate()}</b></button>`; }).join('')}</div>
    ${W.length ? `<div class="bs-watching">🔔 알림 거는 중 ${W.length}편 · 앱이 열려 있는 동안 3분마다 확인해요${typeof Notification !== 'undefined' && Notification.permission !== 'granted' ? ' <button type="button" class="btn sm ghost" id="bs-perm">휴대폰 알림 켜기</button>' : ''}</div>` : ''}
    ${loading && !d ? '<div class="skel" aria-hidden="true"><i></i><i></i><i></i></div>' : ''}
    ${err ? `<div class="empty">${err}<br><button type="button" class="btn sm mint" id="bs-retry" style="margin-top:8px">다시 불러오기</button></div>` : ''}
    ${d ? (list.length ? `<div class="bs-list">${list.map(b=>{ const w = isWatched(pref.dir, date, b.t), want = b.left === 0 || (b.left != null && b.left <= 3);
        return `<div class="bs-row${b.left === 0 ? ' sold' : ''}"><span class="bs-t">${b.t}</span><span class="bs-m"><b>${esc(b.co)}</b><small>${esc(b.grade)}${b.dur ? ` · ${esc(b.dur)} 소요` : ''}${b.fare ? ` · ${Number(b.fare).toLocaleString()}원` : ''}</small></span>
          ${seatTag(b)}${want || w ? `<button type="button" class="bs-bell${w ? ' on' : ''}" data-bell="${esc(b.t)}" aria-pressed="${w}" aria-label="${esc(b.t)} 자리 나면 알림">${w ? '🔔' : '🔕'}</button>` : '<span class="bs-bell-sp"></span>'}</div>`; }).join('')}</div>`
      : `<div class="empty">${pref.day === 0 ? '오늘은 더 떠날 버스가 없어요' : '이날은 배차가 없어요'}</div>`) : ''}
    <div class="food-btns" style="margin-top:12px"><a class="btn sm blue" href="${BOOK}" target="_blank" rel="noopener">🎫 티머니에서 예매하기 ↗</a><button type="button" class="btn sm ghost" id="bs-refresh">↻ 새로 보기</button></div>
    <div class="note" style="margin-top:6px">출처: 티머니 시외버스 통합예매 · ${a} → ${z} · 좌석 수는 몇 분 늦을 수 있어요</div>`;
  root.querySelectorAll('[data-bdir]').forEach(b=>b.onclick = ()=>{ pref.dir = b.dataset.bdir; write(PK, pref); load(false); });
  root.querySelectorAll('[data-bday]').forEach(b=>b.onclick = ()=>{ pref.day = +b.dataset.bday; write(PK, pref); load(false); });
  root.querySelectorAll('[data-bell]').forEach(b=>b.onclick = ()=>toggleWatch(pref.dir, date, b.dataset.bell));
  $b('bs-retry')?.addEventListener('click', ()=>load(true));
  $b('bs-refresh')?.addEventListener('click', ()=>load(true));
  $b('bs-perm')?.addEventListener('click', askPerm);
}

function askPerm(){ try{ Notification.requestPermission().then(()=>render()); }catch(e){} }
function toggleWatch(dir, date, t){
  let W = read(WK, []); const on = W.some(w=>w.dir === dir && w.date === date && w.t === t);
  if(on) W = W.filter(w=>!(w.dir === dir && w.date === date && w.t === t));
  else{ const b = (cache[key(dir, date)]?.data?.buses || []).find(x=>x.t === t);
    W.push({ dir, date, t, at:Date.now(), last:b?.left ?? null }); say('🔔 자리 나면 알려 드릴게요 (앱이 열려 있는 동안)');
    if(typeof Notification !== 'undefined' && Notification.permission === 'default') askPerm(); }
  write(WK, W.filter(w=>w.date >= ymd(0)).slice(-12)); render(); startPoll();
}

/* 알림 확인 — 걸어 둔 차의 남은 좌석이 걸 때(마지막으로 본 때)보다 늘고 1석 이상이면 알린다 */
async function check(){
  const W = watches(); if(!W.length || document.hidden) return;
  const groups = [...new Set(W.map(w=>key(w.dir, w.date)))];
  for(const g of groups){
    const [dir, date] = g.split('|'); let d;
    try{ d = await fetchDay(dir, date, false); }catch(e){ continue; }
    for(const w of W.filter(x=>x.dir === dir && x.date === date)){
      const b = (d.buses || []).find(x=>x.t === w.t); if(!b || b.left == null) continue;
      if(w.last != null && b.left > w.last && b.left > 0){
        const [a, z] = dir === 'out' ? ['양양', '동서울'] : ['동서울', '양양'];
        const msg = `🚌 ${a}→${z} ${date.slice(5).replace('-', '.')} ${w.t} 자리 ${b.left}석 났어요!`;
        say(msg); navigator.vibrate?.([40, 60, 40, 60, 80]);
        try{ if(typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification('SurfShare 버스 자리', { body:msg, icon:'icon-192.png', tag:'bus-' + g + w.t }); }catch(e){}
      }
      w.last = b.left;
    }
  }
  const all = read(WK, []); all.forEach(x=>{ const n = W.find(y=>y.dir === x.dir && y.date === x.date && y.t === x.t); if(n) x.last = n.last; }); write(WK, all);
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
window._bus = { check, toggleWatch, watches, fetchDay, get cache(){ return cache; } };
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
