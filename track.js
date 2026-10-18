/* ── 📊 사용 기록 (서비스 개선용) ─────────────────────────────────
   누가 언제 앱을 열었는지(open), 어느 탭·메뉴·창·게임을 썼는지, 주요 행동(체크인·일지·채팅 보내기…)을 했는지만 센다.
   글 내용·생년월일·토큰·전화번호·위치 좌표는 보내지 않는다 — meta 는 짧은 글자·숫자만 남기고 나머지는 버린다.
   보내기: 기기에 모아 두었다가 20초마다, 화면을 떠날 때(visibilitychange→hidden·pagehide), 앱을 열 때 한 번에(keepalive).
   끄기: 놀이 › 설정 › 「사용 기록 보내기」(lineup.share.track = '0'). 끄면 모아 둔 것도 버린다.
   다른 파일을 거의 안 고치도록 — 탭은 pane 의 hidden 을, 창·게임은 .sheet/.game 의 hidden 을 지켜보고,
   서버에 쓰는 요청(fetch)의 표 이름으로 행동을 알아내고, 게임 끝(play*Done)은 감싸서 센다. */
(function(){
const OPT = 'lineup.share.track', QK = 'lineup.trk.q', LAST = 'lineup.trk.last', SIDK = 'lineup.trk.sid', NA = 'lineup.trk.na';
const IDLE = 30 * 60e3, EVERY = 20e3, QMAX = 300, BATCH = 60;
const ls = { get:k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set:(k, v)=>{ try{ localStorage.setItem(k, v); }catch(e){} }, del:k=>{ try{ localStorage.removeItem(k); }catch(e){} } };
const on = () => ls.get(OPT) !== '0';
const me = () => { try{ return (typeof ME !== 'undefined' && ME && ME.id) ? ME : null; }catch(e){ return null; } };
const sup = () => { try{ if(typeof SUPA !== 'undefined' && SUPA.url) return SUPA; }catch(e){} const c = window.SURF_CONFIG || {}; return { url:String(c.supabaseUrl || '').replace(/\/$/, ''), key:c.supabaseKey || '' }; };

/* 값 다듬기 — 짧은 글자·숫자만. 키 6개·글자 24자 */
const clip = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f<>"'`\\]/g, '').trim().slice(0, n);
const tgt = s => clip(s, 32).replace(/[^\w:.\-가-힣]/g, '');
function clean(meta){
  if(!meta || typeof meta !== 'object') return null;
  const o = {}; let n = 0;
  for(const k of Object.keys(meta)){
    if(n >= 6) break; if(!/^[a-z]{1,8}$/.test(k)) continue;
    const v = meta[k];
    if(typeof v === 'number'){ if(!Number.isFinite(v)) continue; o[k] = Math.round(Math.max(-1e6, Math.min(1e6, v))); }
    else if(typeof v === 'boolean') o[k] = v ? 1 : 0;
    else if(typeof v === 'string'){ const s = clip(v, 24); if(!s) continue; o[k] = s; }
    else continue;
    n++;
  }
  return n ? o : null;
}

/* 줄 — 메모리 + 기기 저장(앱이 갑자기 닫혀도 다음에 보낸다) */
let Q = [];
try{ const a = JSON.parse(ls.get(QK) || '[]'); if(Array.isArray(a)) Q = a.filter(r=>r && typeof r === 'object' && r.ev).slice(-QMAX); }catch(e){}
const save = () => ls.set(QK, JSON.stringify(Q.slice(-QMAX)));

function sid(){
  const now = Date.now(), last = +(ls.get(LAST) || 0), m = me(), uid = m ? String(m.id) : '';
  let [s, u] = String(ls.get(SIDK) || '').split('|');
  const fresh = !s || !last || now - last > IDLE || (uid && u !== uid);        // 30분 넘게 쉬었거나 다른 사람이 들어오면 새 접속
  if(fresh){ s = Math.random().toString(36).slice(2, 10); ls.set(SIDK, s + '|' + uid); }
  ls.set(LAST, String(now));
  return { s, fresh };
}

function track(ev, target, meta){
  if(!on()) return;
  const m = me(); if(!m) return;
  const { s, fresh } = sid();
  if(fresh && ev !== 'open') openEv(s);          // 30분 넘게 쉬었다 다시 쓰면 새 접속
  Q.push({ user_id:clip(m.id, 32), sid:s, ev, target:target ? tgt(target) : null, meta:clean(meta), at:new Date().toISOString() });
  if(Q.length > QMAX) Q = Q.slice(-QMAX);
  save();
}

/* 앱 버전 — 서비스워커 캐시 이름(surf-v215) */
let VER = '';
try{ if(window.caches && caches.keys) caches.keys().then(ks=>{ const k = ks.map(String).filter(x=>/^surf-v\d+$/.test(x)).sort((a, b)=>+b.slice(6) - +a.slice(6))[0]; if(k) VER = k.slice(5); }).catch(()=>{}); }catch(e){}
function plat(){
  const ua = navigator.userAgent || '';
  const os = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'ios' : /Android/.test(ua) ? 'android' : /Windows/.test(ua) ? 'win' : /Macintosh/.test(ua) ? 'mac' : 'other';
  const br = /KAKAOTALK/i.test(ua) ? 'kakao' : /NAVER\(inapp/i.test(ua) ? 'naver' : /Instagram/i.test(ua) ? 'insta' : /FBAN|FBAV/.test(ua) ? 'fb' : '';
  let pwa = false; try{ pwa = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }catch(e){}
  return { os, br, pwa };
}
function openEv(s){
  const m = me(); if(!m || !on()) return;
  const p = plat();
  Q.push({ user_id:clip(m.id, 32), sid:s, ev:'open', target:null,
    meta:clean({ name:m.name, co:m.cohort || 'open', os:p.os, br:p.br, pwa:p.pwa, v:VER || '', w:Math.round((window.innerWidth || 0) / 10) * 10 }), at:new Date().toISOString() });
  save();
}

/* 보내기 */
let busy = false, F = null;
function flush(beacon){
  if(!on()){ if(Q.length){ Q = []; save(); } return Promise.resolve(false); }
  if(busy || !Q.length) return Promise.resolve(false);
  const na = +(ls.get(NA) || 0); if(na && Date.now() - na < 864e5) return Promise.resolve(false);   // 표가 아직 없으면 하루 쉰다
  const S = sup(); if(!S.url || !S.key) return Promise.resolve(false);
  const rows = Q.slice(0, BATCH); busy = true;
  const done = keep => { busy = false; if(!keep){ Q = Q.slice(rows.length); save(); } };
  let p;
  try{
    p = (F || fetch)(`${S.url}/rest/v1/events`, { method:'POST', keepalive:true,
      headers:{ apikey:S.key, Authorization:'Bearer ' + S.key, 'Content-Type':'application/json', Prefer:'return=minimal' },
      body:JSON.stringify(rows) });
  }catch(e){ busy = false; return Promise.resolve(false); }
  return p.then(r=>{
    if(r.ok){ done(false); if(!beacon && Q.length) setTimeout(()=>flush(), 50); return true; }
    if(r.status === 404){ ls.set(NA, String(Date.now())); Q = []; save(); busy = false; return false; }
    if(r.status >= 400 && r.status < 500){ done(false); return false; }     // 잘못된 줄은 버린다(계속 막히지 않게)
    done(true); return false;
  }).catch(()=>{ done(true); return false; });
}
setInterval(()=>{ if(!document.hidden) flush(); }, EVERY);
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState === 'hidden') flush(true);
  else if(me()){ const last = +(ls.get(LAST) || 0); if(!last || Date.now() - last > IDLE){ openEv(sid().s); flush(); } }
});
addEventListener('pagehide', ()=>flush(true));

/* ── 지켜보기 ── */
/* 접속 — 이 파일은 defer 라 start() 가 먼저 돌 수 있다. 들어와 있으면 바로, 아니면 로그인할 때 */
function onStart(){ if(!me()) return; const x = sid(); if(x.fresh) openEv(x.s); setTimeout(()=>flush(), 600); }
if(typeof window.start === 'function'){ const s0 = window.start; window.start = function(){ const r = s0.apply(this, arguments); try{ onStart(); }catch(e){} return r; }; }
if(me() && document.getElementById('main') && !document.getElementById('main').hidden) setTimeout(onStart, VER ? 0 : 400);   // 버전 읽을 틈
else setTimeout(()=>flush(), 1500);                                                                                          // 지난번에 못 보낸 것

/* 탭 — pane-* 가 보이게 되면 */
const PANE = /^pane-([a-z]+)$/;
let lastTab = null;
function tabScan(){
  const v = [...document.querySelectorAll('[id^="pane-"]')].find(el=>PANE.test(el.id) && !el.hidden && el.id !== 'pane-me');
  const k = v ? v.id.match(PANE)[1] : null;
  if(k && k !== lastTab){ const first = lastTab === null; lastTab = k; if(!first) track('tab', k); }
}
/* 창·게임 — .sheet / .game 이 열리면. 게임 시간은 열린 때(또는 지난 판 끝)부터 */
const GAME = { game:'jump', surf:'surf', skate:'skate', quest:'quest', defend:'defend' };
const vis = new WeakMap(), gT = {};
function sheetScan(){
  document.querySelectorAll('.sheet, .game').forEach(el=>{
    const v = !el.hidden, was = vis.get(el) || false; if(v === was) return; vis.set(el, v);
    if(!v) return;
    if(el.classList.contains('game')){ const g = GAME[el.id] || el.id; gT[g] = Date.now(); track('game_start', g); }
    else track('sheet', el.id || 'sheet');
  });
}
let qd = false;
const mo = new MutationObserver(()=>{ if(qd) return; qd = true; queueMicrotask(()=>{ qd = false; try{ tabScan(); sheetScan(); }catch(e){} }); });
function watch(){ mo.observe(document.body, { subtree:true, childList:true, attributes:true, attributeFilter:['hidden'] }); tabScan();
  document.querySelectorAll('.sheet, .game').forEach(el=>vis.set(el, !el.hidden)); }
if(document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);

/* 게임 끝 — 점수는 구간으로만 */
const BK = [0, 1, 10, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
const bucket = n => { n = +n || 0; let b = 0; for(const x of BK) if(n >= x) b = x; return b; };
const dur = g => { const t0 = gT[g]; gT[g] = Date.now(); if(!t0) return null; return Math.min(3600, Math.round((Date.now() - t0) / 10000) * 10); };
function wrapDone(name, g, meta){
  const f = window[name]; if(typeof f !== 'function') return;
  window[name] = function(){ const r = f.apply(this, arguments); try{ track('game_end', g, { ...meta(arguments), dur:dur(g) }); }catch(e){} return r; };
}
wrapDone('playGameDone', 'jump', a=>({ sc:bucket(a[0]), hard:!!a[3], daily:!!a[1] }));
wrapDone('playSurfDone', 'surf', a=>({ sc:bucket(a[0]), hard:!!a[2] }));
wrapDone('playSkateDone', 'skate', a=>({ acc:Math.round((+a[1] || 0) / 10) * 10 }));
wrapDone('playQuestDone', 'quest', a=>({ st:+a[0] || 0, win:!!a[1] }));
wrapDone('playDefendDone', 'defend', a=>({ wv:+a[0] || 0, win:!!a[1] }));

/* 열기 함수 감싸기 */
function wrapOpen(name, act){ const f = window[name]; if(typeof f !== 'function') return; window[name] = function(){ try{ track('action', act); }catch(e){} return f.apply(this, arguments); }; }
wrapOpen('kcgOpen', 'kcg_open'); wrapOpen('updOpen', 'update_open');

/* 메뉴 누름 — 기타·놀이 카드·홈 바로가기·업데이트 「가 보기」 */
document.addEventListener('click', e=>{
  const t = e.target; if(!t || !t.closest) return;
  try{
    let b;
    if((b = t.closest('[data-more]'))) track('menu', 'more:' + b.dataset.more);
    else if(t.closest('#more-sheet .more-sub > summary')) track('menu', 'more:sub');
    else if((b = t.closest('[data-hub]'))) track('menu', 'hub:' + b.dataset.hub);
    else if((b = t.closest('[data-qa]'))) track('menu', 'qa:' + b.dataset.qa);
    else if((b = t.closest('[data-set]'))) track('menu', 'set:' + b.dataset.set);
    else if((b = t.closest('[data-ugo]'))) track('menu', 'upd:' + b.dataset.ugo);
    else if((b = t.closest('#home-sum [data-go]'))) track('menu', 'home:' + b.dataset.go);
    if(t.closest('[data-slsave]')) setTimeout(()=>{ const s = document.getElementById('sl-sheet'); if(s && s.hidden) track('action', 'slog_save'); }, 80);
    if((b = t.closest('[data-buy]')) && /🐚/.test(b.textContent || '')) track('action', 'shop_buy');
  }catch(err){}
}, true);

/* 서버에 쓰는 요청 → 행동. 본문은 종류를 가르는 칸(active·dir·target 앞부분)만 보고 버린다 */
const ACT = { checkins:{ POST:b=>b && b.active === false ? 'checkout' : 'checkin' }, chat:{ POST:'chat_send' },
  rides:{ POST:b=>b && /^bus_/.test(String(b.dir || '')) ? 'bus_report' : 'ride_create', PATCH:'ride_join' },
  stays:{ POST:'stay_create', PATCH:'stay_join' }, parties:{ POST:'bolt_create', PATCH:'bolt_join' },
  stay_reviews:{ POST:'stay_review' }, reacts:{ POST:'react' }, drills:{ POST:'drill' }, place_edits:{ POST:'place_edit' }, places:{ PATCH:'place_edit' },
  place_talk:{ POST:b=>{ const g = String(b && b.target || ''); return /^bd:/.test(g) ? 'bday_comment' : /^req:/.test(g) ? 'bus_request' : /^add:/.test(g) ? 'place_add' : 'food_review'; } },
  'rpc/note_send':{ POST:'note_send' } };
let busAt = 0;
F = window.fetch;
if(typeof F === 'function') window.fetch = function(input, init){
  const p = F.apply(this, arguments);
  try{
    const url = typeof input === 'string' ? input : (input && input.url) || '', m = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    let act = null;
    if(url.includes('/rest/v1/') && m !== 'GET'){
      const path = url.split('/rest/v1/')[1].split('?')[0], rule = ACT[path] && ACT[path][m];
      if(rule){ if(typeof rule === 'function'){ let b = null; try{ b = JSON.parse(init && typeof init.body === 'string' ? init.body : 'null'); }catch(e){} if(Array.isArray(b)) b = b[0]; act = rule(b); } else act = rule; }
    } else if(url.includes('/api/bus-seats') && Date.now() - busAt > 60e3){ busAt = Date.now(); act = 'bus_check'; }
    if(act) p.then(r=>{ if(r && r.ok) track('action', act); }).catch(()=>{});
  }catch(e){}
  return p;
};

/* 설정에서 쓰는 것 */
window.track = (ev, target, meta) => { try{ if(['tab', 'sheet', 'menu', 'game_start', 'game_end', 'action'].includes(ev)) track(ev, target, meta); }catch(e){} };
window.trackOn = on;
window.trackSet = v => { ls.set(OPT, v ? '1' : '0'); if(!v){ Q = []; save(); } };
window.trackFlush = () => flush();
window._trk = { get q(){ return Q.slice(); }, clean, bucket };
})();
