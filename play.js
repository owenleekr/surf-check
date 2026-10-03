/* ── 서퍼 레벨 · 배지 · 오늘의 퀘스트 ─────────────────────────────────
   서버에 새 표를 만들지 않는다. 이미 쌓이는 기록(훈련·번개·차량·숙소·채팅·반응)에서
   점수를 계산하고, 결과만 프로필(JSON)에 얹어 둔다 — 그래야 다른 사람 화면에서도 순위가 나온다.

   원칙 두 가지:
   1) 점수는 줄어들지 않는다. 서버에서 불러오는 기간(차량 30일 등)이 지나 기록이 빠져도 레벨이 내려가면 안 된다.
      그래서 계산값과 저장값 중 큰 쪽을 쓴다.
   2) 처음 켜는 사람에게 과거 업적 알림 20개를 한꺼번에 쏟지 않는다. 첫 계산은 조용히 반영하고 환영 카드 한 장만 보여준다.

   신뢰 모델은 채팅·반응과 같다 — 서버가 '누가 했나'를 증명하지 못하니, 순위에 보상을 걸지 말 것. */

const PLV = [[0,'모래알','🐚'],[50,'물장구','💦'],[150,'패들러','🏊'],[300,'테이크오프','🏄'],[500,'라인업','🌊'],
             [800,'아웃사이드','🦈'],[1200,'튜브라이더','🌀'],[1800,'로컬','🌴'],[2600,'바다의 주인','👑']];
const lvOf = xp => { let i = 0; PLV.forEach((l,k)=>{ if(xp >= l[0]) i = k; }); return i; };

/* ── 레벨 보상 ── 새 꾸미기 아이템은 여기서만 정의한다.
   sprite.js 는 라인업 앱도 쓰므로 건드리지 않고, 서프쉐어에서 이 파일이 로드될 때 목록에 얹는다.
   (그래서 동기들 화면에서도 왕관을 쓴 사람이 그대로 그려진다.) */
const _pad = (s, left) => ('.'.repeat(left) + s).padEnd(24, '.');
HAT.band  = [ '.'.repeat(24), '.'.repeat(24), _pad('k' + 'o'.repeat(16) + 'k', 3), _pad('k'.repeat(18), 3) ];
HAT.crown = [ _pad('k.....k.....k', 5), _pad('ko...kok...ok', 5), _pad(['k','ooo','k','ooo','k','ooo','k'].join(''), 5),
              _pad('kt' + 'o'.repeat(9) + 'tk', 5), _pad('k'.repeat(13), 5) ];
HAT_KO.band = '서프 헤어밴드'; HAT_KO.crown = '왕관';
BOARDC.gold = '#E8B923'; BOARDC_KO.gold = '골드';
BOARDC.neon = '#3DFFE0'; BOARDC_KO.neon = '네온';
/* lv 는 0부터(Lv.1 = 0). 아이콘은 해금 카드와 도감에 쓴다 */
const UNLOCKS = [
  { lv:1, key:'boardc', v:'gold',  n:'골드 보드',      ic:'🟡' },
  { lv:2, key:'hat',    v:'band',  n:'서프 헤어밴드',  ic:'🎽' },
  { lv:4, key:'boardc', v:'neon',  n:'네온 보드',      ic:'🟢' },
  { lv:6, key:'hat',    v:'crown', n:'왕관',           ic:'👑' },
];
const myLv = () => lvOf(playXp(ME?.profile?.play || { base:0, bonus:0 }));
/* 잠겨 있으면 필요한 레벨(0부터)을, 열려 있으면 null */
const lockOf = (key, v) => { const u = UNLOCKS.find(x=>x.key === key && x.v === v); return u && myLv() < u.lv ? u.lv : null; };

/* 조건은 stats(s)와 저장값(p)만 본다. xp 는 받는 순간 한 번만 더해진다. */
const BADGES = [
  { id:'drill1',  ic:'🏄', n:'첫 테이크오프',  d:'훈련을 처음 체크했어요',            t:s=>s.drillDays >= 1 },
  { id:'streak3', ic:'🔥', n:'3일 연속',       d:'훈련을 3일 연속으로 했어요',        t:s=>s.bestStreak >= 3 },
  { id:'streak7', ic:'📅', n:'한 주 개근',     d:'훈련을 7일 연속으로 했어요',        t:s=>s.bestStreak >= 7, xp:40 },
  { id:'streak14',ic:'🌟', n:'2주 개근',       d:'훈련을 14일 연속으로 했어요',       t:s=>s.bestStreak >= 14, xp:60 },
  { id:'streak30',ic:'🏆', n:'한 달 개근',     d:'훈련을 30일 연속으로 했어요',       t:s=>s.bestStreak >= 30, xp:100 },
  { id:'drill10', ic:'💪', n:'열 번째 훈련',   d:'훈련을 누적 10일 했어요',           t:s=>s.drillDays >= 10 },
  { id:'drill30', ic:'🦵', n:'서른 번째 훈련', d:'훈련을 누적 30일 했어요',           t:s=>s.drillDays >= 30, xp:50 },
  { id:'bolt1',   ic:'⚡', n:'번개 소집',      d:'서핑번개를 처음 열었어요',           t:s=>s.boltsMade >= 1 },
  { id:'bolt2',   ic:'🤝', n:'번개 합류',      d:'남이 연 번개에 들어갔어요',         t:s=>s.boltsJoined >= 1 },
  { id:'ride1',   ic:'🚗', n:'카풀 시작',      d:'차량 쉐어를 올리거나 탔어요',       t:s=>s.ridesMade + s.ridesJoined >= 1 },
  { id:'stay1',   ic:'🏠', n:'한 지붕 아래',   d:'숙소 쉐어를 올리거나 함께했어요',   t:s=>s.staysMade + s.staysJoined >= 1 },
  { id:'chat5',   ic:'💬', n:'마을 수다쟁이',  d:'마을에 한마디를 5번 남겼어요',      t:s=>s.chat >= 5 },
  { id:'react10', ic:'👏', n:'응원왕',         d:'동기에게 반응·응원을 10번 보냈어요', t:s=>s.reacts >= 10 },
  { id:'game1',   ic:'🎮', n:'첫 파도 점프',   d:'파도 점프를 한 판 해봤어요',        t:(s,p)=>(p.best||0) > 0 },
  { id:'game300', ic:'🦈', n:'상어도 피했다',  d:'파도 점프에서 600점을 넘겼어요',    t:(s,p)=>(p.best||0) >= 600, xp:40 },
  { id:'quest5',  ic:'✅', n:'퀘스트 5일',     d:'오늘의 퀘스트를 5일 완료했어요',    t:(s,p)=>(p.qall||0) >= 5, xp:40 },
  { id:'lv5',     ic:'🌊', n:'라인업 입성',    d:'레벨 5에 올랐어요',                 t:(s,p)=>lvOf(p.base + p.bonus) >= 4, xp:0 },
];

/* 사용자가 한 번도 건드리지 않은 페이지의 진동은 브라우저가 막고 경고를 남긴다 — 눌러본 뒤에만 */
const vib = pat => { try{ if(navigator.userActivation?.hasBeenActive) navigator.vibrate?.(pat); }catch(e){} };
const playP = () => (ME.profile.play ||= { base:0, bonus:0, badges:{}, qd:{}, qall:0, best:0, gday:'', gxp:0, gn:{}, lvSeen:0 });
const playXp = p => (p.base||0) + (p.bonus||0);
const localDay = iso => { const d = new Date(iso); return new Date(d - d.getTimezoneOffset()*6e4).toISOString().slice(0,10); };

function playStats(){
  const id = ME.id, S = (typeof dSet !== 'undefined' && dSet[id]) || new Set();
  const days = [...S].sort(); let best = 0, run = 0, prev = null;
  days.forEach(d=>{ run = (prev && (new Date(d) - new Date(prev)) === 864e5) ? run + 1 : 1; best = Math.max(best, run); prev = d; });
  const inL = l => (l||[]).some(x=>x.id === id);
  const B = (typeof bolts !== 'undefined' && bolts) || [], R = state.rides || [], T = state.stays || [];
  return { drillDays:S.size, bestStreak:Math.max(best, typeof drillStat === 'function' ? drillStat(id).streak : 0),
    boltsMade:B.filter(b=>b.user_id === id).length, boltsJoined:B.filter(b=>b.user_id !== id && inL(b.joins)).length,
    ridesMade:R.filter(r=>r.user_id === id).length, ridesJoined:R.filter(r=>r.user_id !== id && inL(r.riders)).length,
    staysMade:T.filter(x=>x.user_id === id).length, staysJoined:T.filter(x=>x.user_id !== id && inL(x.guests)).length,
    chat:(state.chat||[]).filter(m=>m.user_id === id).length, reacts:(state.reacts||[]).filter(r=>r.user_id === id).length };
}
/* 한 번에 쏟아부을 수 있는 건 상한을 둔다 — 수다·반응 도배로 레벨을 사지 못하게 */
const rawXp = s => s.drillDays*10 + s.boltsMade*15 + s.boltsJoined*5 + s.ridesMade*15 + s.ridesJoined*5
                 + s.staysMade*15 + s.staysJoined*5 + Math.min(s.chat, 30) + Math.min(s.reacts, 30);

/* 오늘의 퀘스트 — 하루 세 개, 전부 오늘 한 일에서 계산한다 */
function playQuests(p){
  const day = today(), mine = id => id === ME.id;
  const talked = (state.chat||[]).some(m=>mine(m.user_id) && localDay(m.created_at) === day)
              || (state.reacts||[]).some(r=>mine(r.user_id) && r.created_at && localDay(r.created_at) === day);
  return [
    { id:'drill', ic:'🏄', t:'테이크오프 훈련 체크', hint:'홈에서 한 번 누르기', done:!!((typeof dSet !== 'undefined' && dSet[ME.id]) || new Set()).has(day),
      go:()=>{ closePlay(); setTab('home'); setTimeout(()=>$('drill')?.scrollIntoView({ block:'center', behavior:'smooth' }), 80); } },
    { id:'talk',  ic:'💬', t:'마을에 한마디 · 응원',   hint:'채팅을 남기거나 동기에게 반응', done:talked,
      go:()=>{ closePlay(); setTab('town'); } },
    { id:'game',  ic:'🎮', t:'파도 점프 한 판',        hint:'쉬는 시간에 가볍게', done:(p.gn?.[day] || 0) > 0,
      go:()=>{ closePlay(); gameOpen(); } },
  ];
}

/* ── 저장 ── 프로필 upsert 는 saveProfile 과 같은 길. 연달아 불려도 요청은 한 번 */
let _pt = 0;
function playPush(){
  try{ localStorage.setItem('lineup.share.me', JSON.stringify(ME)); }catch(e){}
  clearTimeout(_pt);
  _pt = setTimeout(async ()=>{ try{ await api('surfers', { method:'POST', body:JSON.stringify({
    id:ME.id, name:ME.name, cohort:ME.cohort || 'open', profile:ME.profile }) }); }catch(e){} }, 1200);
}

/* 다른 기기에서 쌓은 것을 덮어쓰지 않는다 — 숫자는 큰 쪽, 배지는 합집합 */
function playMerge(remote){
  if(!remote || !ME?.profile) return;
  const p = playP(); let ch = false;
  ['base','bonus','best','qall'].forEach(k=>{ if((remote[k]||0) > (p[k]||0)){ p[k] = remote[k]; ch = true; } });
  Object.keys(remote.badges||{}).forEach(k=>{ if(!p.badges[k]){ p.badges[k] = remote.badges[k]; ch = true; } });
  Object.keys(remote.qd||{}).forEach(d=>{ if(!p.qd[d]){ p.qd[d] = remote.qd[d]; ch = true; }
    else Object.keys(remote.qd[d]).forEach(q=>{ if(!p.qd[d][q]){ p.qd[d][q] = 1; ch = true; } }); });
  Object.keys(remote.gn||{}).forEach(d=>{ if((remote.gn[d]||0) > (p.gn[d]||0)){ p.gn[d] = remote.gn[d]; ch = true; } });
  if(remote.gday === p.gday && (remote.gxp||0) > (p.gxp||0)){ p.gxp = remote.gxp; ch = true; }
  if(ch){ p.lvSeen = Math.max(p.lvSeen||0, lvOf(playXp(p))); playPush(); renderPlayBits(); }
}
async function playSync(){
  try{ const r = await api(`surfers?id=eq.${encodeURIComponent(ME.id)}&select=profile`); playMerge(r?.[0]?.profile?.play); }catch(e){}
}

/* ── 계산 ──
   처음 계산은 훈련·번개·차량·숙소 기록이 다 도착한 뒤에 한다. 반쯤 온 데이터로 초기화하면
   나머지가 도착하는 순간 과거 업적 알림이 한꺼번에 쏟아진다. 8초가 지나면 있는 대로 간다. */
const playLoaded = {};
const playMark = k => { playLoaded[k] = true; playTick(); };
const playReady = () => ['drill','rides','stays','bolts'].every(k=>playLoaded[k]) || playReady.force || (Date.now() - (playReady.t0 ||= Date.now())) > 8000;
let _popQ = [], _popBusy = false;
function playTick(){
  if(!ME || !ME.profile || typeof state === 'undefined') return;
  const first = !ME.profile.play;
  if(first && !playReady()) return;
  const p = playP(), s = playStats();
  let ch = first;
  const raw = rawXp(s); if(raw > p.base){ p.base = raw; ch = true; }
  const fresh = [];
  BADGES.forEach(b=>{ if(!p.badges[b.id] && b.t(s, p)){ p.badges[b.id] = Date.now(); p.bonus += (b.xp ?? 20); fresh.push(b); ch = true; } });
  /* 퀘스트 보상은 하루에 한 번씩만 — 저장값(qd)으로 막는다 */
  const day = today(), qs = playQuests(p), done = (p.qd[day] ||= {});
  let allNow = false;
  qs.forEach(q=>{ if(q.done && !done[q.id]){ done[q.id] = 1; p.bonus += 5; ch = true; } });
  if(qs.every(q=>q.done) && !done.all){ done.all = 1; p.bonus += 20; p.qall = (p.qall||0) + 1; allNow = true; ch = true; }
  Object.keys(p.qd).sort().slice(0, -14).forEach(d=>delete p.qd[d]);      // 2주 지난 기록은 버린다(qall 이 누적을 들고 있다)
  const xp = playXp(p), lv = lvOf(xp);
  if(p.xp !== xp || p.lv !== lv){ p.xp = xp; p.lv = lv; ch = true; }
  if(first){ p.lvSeen = lv; _popQ.push({ ic:'📖', t:'서퍼 도감이 열렸어요', d:`지금까지 배지 ${Object.keys(p.badges).length}개 · Lv.${lv+1} ${PLV[lv][1]}`, welcome:true }); }
  else{
    if(allNow) _popQ.push({ ic:'🎉', t:'오늘의 퀘스트 완료!', d:'세 가지를 모두 해냈어요  +20 XP' });
    fresh.forEach(b=>_popQ.push({ ic:b.ic, t:`새 배지 · ${b.n}`, d:b.d }));
    if(lv > (p.lvSeen||0)){
      const opened = UNLOCKS.filter(u=>u.lv > (p.lvSeen||0) && u.lv <= lv);
      _popQ.push({ ic:PLV[lv][2], t:`레벨 업! Lv.${lv+1} ${PLV[lv][1]}`,
        d: opened.length ? `새 아이템이 열렸어요: ${opened.map(u=>u.ic + ' ' + u.n).join(', ')}\n내 캐릭터 꾸미기에서 써보세요` : '바다에서 한 걸음 더 나아갔어요', up:true }); }
  }
  p.lvSeen = Math.max(p.lvSeen||0, lv);
  if(ch) playPush();
  renderPlayBits(); popNext();
}

/* 게임이 끝났을 때 — 하루 XP 상한을 둔다(게임만 해서 레벨을 올리지 못하게). 상한은 저장값(gxp)으로 막는다 */
function playGameDone(score){
  if(!ME.profile.play){ playReady.force = true; playTick(); }
  const p = playP(), day = today();
  p.gn[day] = (p.gn[day] || 0) + 1;
  const newBest = score > (p.best || 0); if(newBest) p.best = score;
  if(p.gday !== day){ p.gday = day; p.gxp = 0; }
  const gain = Math.max(0, Math.min(Math.floor(score / 30), 15 - p.gxp));
  p.gxp += gain; p.bonus += gain;
  playTick(); playPush();
  return { gain, newBest, best:p.best };
}

/* ── 알림 카드 ── 한꺼번에 여러 개가 걸려도 한 장씩 */
function popNext(){
  if(_popBusy || !_popQ.length || !$('pop')) return;
  /* 다른 시트가 열려 있거나 게임 중이면 기다린다 — 게임 도중에 카드가 덮으면 죽는다 */
  if(window._gameRun || ($('game') && !$('game').hidden)) return;
  const c = _popQ.shift(); _popBusy = true;
  $('pop-ic').textContent = c.ic; $('pop-t').textContent = c.t; $('pop-d').textContent = c.d;
  $('pop').hidden = false; $('pop-ok').focus({ preventScroll:true });
  vib(c.up ? [30,50,30,50,60] : [20,40,20]);
  if(typeof burst === 'function') burst($('pop-ic'), c.up ? 22 : 12);
}
function popClose(){ $('pop').hidden = true; _popBusy = false; setTimeout(popNext, 220); }

/* ── 화면 조각 ── 홈 프로필 줄의 레벨 막대, 퀘스트 띠 */
function renderPlayBits(){
  if(!ME?.profile?.play) return;
  const p = ME.profile.play, xp = playXp(p), lv = lvOf(xp), cur = PLV[lv][0], nxt = PLV[lv+1]?.[0];
  const pct = nxt ? Math.max(4, Math.round((xp - cur) / (nxt - cur) * 100)) : 100;      // 0% 도 눈에 보이게 조금은 채운다
  if($('lv-chip')) $('lv-chip').textContent = `Lv.${lv+1} ${PLV[lv][1]} ${PLV[lv][2]}`;
  if($('xp-fill')) $('xp-fill').style.width = pct + '%';
  if($('xp-txt')) $('xp-txt').textContent = nxt ? `${xp - cur}/${nxt - cur} XP` : `${xp} XP · 최고 레벨`;
  const qs = playQuests(p), n = qs.filter(q=>q.done).length;
  if($('quest-strip')){
    $('quest-strip').hidden = false;
    $('quest-strip').classList.toggle('all', n === qs.length);
    $('qs-ic').innerHTML = qs.map(q=>`<i class="${q.done?'on':''}" aria-hidden="true">${q.done ? '✔' : q.ic}</i>`).join('');
    $('qs-t').textContent = n === qs.length ? '오늘 퀘스트 모두 완료!' : `오늘의 퀘스트 ${n}/${qs.length}`;
    $('qs-s').textContent = n === qs.length ? '내일 또 만나요 · 도감 보기' : (qs.find(q=>!q.done).t + ' · 남았어요');
  }
}

/* ── 도감 시트 ── */
let _rkView = 'xp';
async function openPlay(){
  $('play-sheet').hidden = false;
  renderPlay();
  /* 순위는 마을 명단이 있어야 나온다 — 홈에서는 아직 안 불러왔을 수 있다 */
  if(!(state.town||[]).length){
    try{ state.town = (await api('surfers?select=id,name,cohort,profile&limit=300')).filter(x=>!isTest(x.id)); renderPlay(); }catch(e){} }
}
function closePlay(){ $('play-sheet').hidden = true; }
function renderPlay(){
  if(!ME?.profile?.play) return;
  const p = ME.profile.play, xp = playXp(p), lv = lvOf(xp), cur = PLV[lv][0], nxt = PLV[lv+1];
  const pct = nxt ? Math.max(4, Math.round((xp - cur) / (nxt[0] - cur) * 100)) : 100;
  const qs = playQuests(p), got = Object.keys(p.badges).length;
  const rows = (state.town||[]).filter(x=>x.id !== ME.id).map(x=>({ id:x.id, name:x.name, xp:x.profile?.play?.xp || 0, best:x.profile?.play?.best || 0 }))
    .concat([{ id:ME.id, name:ME.name, xp, best:p.best||0 }]);
  const key = _rkView === 'xp' ? 'xp' : 'best';
  const top = rows.filter(r=>r[key] > 0).sort((a,b)=>b[key]-a[key]);
  const myRank = top.findIndex(r=>r.id === ME.id) + 1;
  const shown = top.slice(0, 5); if(myRank > 5) shown.push(top[myRank-1]);
  const medal = i => ['🥇','🥈','🥉'][i] || (i + 1);
  $('play-body').innerHTML = `
    <div class="ph">
      <div class="ph-em">${PLV[lv][2]}</div>
      <div class="ph-t"><b>Lv.${lv+1} ${PLV[lv][1]}</b><span>${xp} XP${nxt ? ` · 다음 ${nxt[1]}까지 ${nxt[0] - xp}` : ' · 최고 레벨'}</span></div>
    </div>
    <div class="xpbar big" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
    ${(()=>{ const nu = UNLOCKS.find(u=>u.lv > lv); return nu ? `<div class="note" style="margin-top:8px">🔓 Lv.${nu.lv+1} ${PLV[nu.lv][1]}에서 <b>${nu.ic} ${nu.n}</b>이 열려요</div>` : `<div class="note" style="margin-top:8px">🎉 꾸미기 아이템을 모두 열었어요</div>`; })()}

    <div class="pt">오늘의 퀘스트 <small>${qs.filter(q=>q.done).length}/${qs.length} · 모두 하면 +20 XP</small></div>
    ${qs.map((q,i)=>`<button type="button" class="pq${q.done?' done':''}" data-q="${i}">
        <i>${q.done ? '✔' : q.ic}</i><span>${q.t}<small>${q.done ? '완료 · +5 XP' : q.hint}</small></span><b>${q.done ? '' : '›'}</b></button>`).join('')}

    <div class="pt">🎮 파도 점프 <small>내 최고 ${p.best || 0}점</small></div>
    <button type="button" class="btn blue" id="pg-start" style="width:100%;min-height:48px">점프하러 가기 — 하루 15 XP까지</button>

    <div class="pt">배지 <small>${got}/${BADGES.length}</small></div>
    <div class="bgrid">${BADGES.map(b=>`<button type="button" class="bd${p.badges[b.id]?' on':''}" data-bd="${b.id}" aria-label="${b.n}${p.badges[b.id]?'':' (잠김)'}">
        <i>${p.badges[b.id] ? b.ic : '🔒'}</i><span>${b.n}</span></button>`).join('')}</div>

    <div class="pt">동기 순위 <small>
      <button type="button" class="prk-tab${_rkView==='xp'?' on':''}" data-rk="xp">레벨</button>
      <button type="button" class="prk-tab${_rkView==='best'?' on':''}" data-rk="best">점프</button></small></div>
    ${shown.length ? shown.map(r=>{ const i = top.indexOf(r); const l = lvOf(r.xp);
      return `<div class="prk${r.id===ME.id?' me':''}"><span class="n">${medal(i)}</span><span class="nm2">${esc(r.name)}</span>
        <span class="v">${_rkView==='xp' ? `Lv.${l+1} · ${r.xp}` : `${r.best}점`}</span></div>`; }).join('')
      : `<div class="note">${_rkView==='xp' ? '아직 기록이 없어요.' : '아직 아무도 안 뛰었어요 — 첫 번째가 되어보세요'}</div>`}
    <div class="note" style="margin-top:10px">점수는 훈련·번개·차량·숙소·마을 활동에서 쌓여요. 순위는 재미로만 봐주세요 — 서버가 누가 했는지 증명하진 못해요.</div>`;
  $('play-body').querySelectorAll('[data-q]').forEach(b=>b.onclick = ()=>{ const q = qs[+b.dataset.q]; if(!q.done) q.go(); });
  $('play-body').querySelectorAll('[data-bd]').forEach(b=>b.onclick = ()=>{ const bd = BADGES.find(x=>x.id === b.dataset.bd);
    toast(p.badges[bd.id] ? `${bd.ic} ${bd.n} — ${bd.d}` : `🔒 ${bd.n} — ${bd.d}`); });
  $('play-body').querySelectorAll('[data-rk]').forEach(b=>b.onclick = ()=>{ _rkView = b.dataset.rk; renderPlay(); });
  $('pg-start').onclick = ()=>{ closePlay(); gameOpen(); };
}

/* ── 배선 ── */
function playWire(){
  if(playWire.done) return; playWire.done = true;
  $('pop-ok').onclick = popClose;
  $('pop').addEventListener('click', e=>{ if(e.target === $('pop')) popClose(); });
  document.querySelectorAll('[data-playclose]').forEach(b=>b.onclick = closePlay);
  ['prof-lv','quest-strip'].forEach(id=>{ const el = $(id); if(el) el.onclick = openPlay; });
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape'){ if(!$('pop').hidden) popClose(); else if(!$('play-sheet').hidden) closePlay(); } });
}
