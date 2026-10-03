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
/* 남의 프로필(play)은 누구나 쓸 수 있는 곳에서 온 값이다 — 글자를 넣어 HTML 을 주입하거나 99 같은 레벨로 화면을 깨뜨릴 수 있다.
   (실제로 xp 에 <img onerror> 를 넣으면 모두의 도감에서 실행됐다.) 화면에 찍기 전에 반드시 숫자로 걸러 범위를 가둔다.
   레벨은 적힌 값을 믿지 않고 xp 로 다시 계산한다. */
const _num = (v, max) => { const x = Math.floor(+v); return Number.isFinite(x) ? Math.max(0, Math.min(max, x)) : 0; };
const peerPlay = pl => (pl && typeof pl === 'object') ? { xp:_num(pl.xp, 100000), best:_num(pl.best, 100000),
  dbest:(pl.dbest && typeof pl.dbest === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(String(pl.dbest.day))) ? { day:String(pl.dbest.day), score:_num(pl.dbest.score, 100000) } : null } : null;
const lvOf = xp => { let i = 0; PLV.forEach((l,k)=>{ if(xp >= l[0]) i = k; }); return i; };

/* ── 레벨 보상 ── 새 꾸미기 아이템은 여기서만 정의한다.
   sprite.js 는 라인업 앱도 쓰므로 건드리지 않고, 서프쉐어에서 이 파일이 로드될 때 목록에 얹는다.
   (그래서 동기들 화면에서도 왕관을 쓴 사람이 그대로 그려진다.) */
const _pad = (s, left) => ('.'.repeat(left) + s).padEnd(24, '.');
HAT.band  = [ '.'.repeat(24), '.'.repeat(24), _pad('k' + 'o'.repeat(16) + 'k', 3), _pad('k'.repeat(18), 3) ];
HAT.crown = [ _pad('k.....k.....k', 5), _pad('ko...kok...ok', 5), _pad(['k','ooo','k','ooo','k','ooo','k'].join(''), 5),
              _pad('kt' + 'o'.repeat(9) + 'tk', 5), _pad('k'.repeat(13), 5) ];
/* 조개로 사는 것들 — 레벨이 아니라 게임에서 모은 조개(🐚)로 연다 */
HAT.sprout = [ _pad('g..g...g', 8), _pad('ggggg.ggg', 7), _pad('kggkgkggk', 7).slice(0,24), _pad('kkkkkkkkkkkk', 6) ];
HAT.wave   = [ '.'.repeat(24), _pad('..cc', 8), _pad('kcwwcckcwwk', 6), _pad('kbbbbbbbbbbk', 6), _pad('kkkkkkkkkkkk', 6) ];
HAT_KO.band = '서프 헤어밴드'; HAT_KO.crown = '왕관'; HAT_KO.sprout = '새싹'; HAT_KO.wave = '파도 모자';
BOARDC.sunset = '#FF7A59'; BOARDC_KO.sunset = '노을';
BOARDC.violet = '#8E5BFF'; BOARDC_KO.violet = '바이올렛';
BOARDC.gold = '#E8B923'; BOARDC_KO.gold = '골드';
BOARDC.neon = '#3DFFE0'; BOARDC_KO.neon = '네온';
/* lv 는 0부터(Lv.1 = 0). 아이콘은 해금 카드와 도감에 쓴다 */
const UNLOCKS = [
  { lv:1, key:'boardc', v:'gold',  n:'골드 보드',      ic:'🟡' },
  { lv:2, key:'hat',    v:'band',  n:'서프 헤어밴드',  ic:'🎽' },
  { lv:4, key:'boardc', v:'neon',  n:'네온 보드',      ic:'🟢' },
  { lv:6, key:'hat',    v:'crown', n:'왕관',           ic:'👑' },
];
/* 조개 상점 — 값은 조개(🐚). 번 만큼(shells) 쓴 만큼(spent)을 빼서 잔액을 센다. 산 것(own)은 영구. */
const SHOP = [
  { key:'boardc', v:'sunset', n:'노을 보드',     ic:'🟠', cost:20 },
  { key:'boardc', v:'violet', n:'바이올렛 보드', ic:'🟣', cost:20 },
  { key:'hat',    v:'sprout', n:'새싹',          ic:'🌱', cost:30 },
  { key:'hat',    v:'wave',   n:'파도 모자',     ic:'🌊', cost:60 },
];
const shellBal = () => { const p = ME?.profile?.play; return p ? Math.max(0, (p.shells||0) - (p.spent||0)) : 0; };
/* 아직 안 샀으면 상품을, 샀거나 상품이 아니면 null */
const shopOf = (key, v) => { const it = SHOP.find(x=>x.key === key && x.v === v); return it && !ME?.profile?.play?.own?.[key + ':' + v] ? it : null; };
function playBuy(key, v){
  const it = SHOP.find(x=>x.key === key && x.v === v), p = ME?.profile?.play; if(!it || !p) return false;
  if(p.own?.[key + ':' + v]) return true;
  if(shellBal() < it.cost){ toast(`🐚 조개가 모자라요 — ${it.cost}개 필요 (보유 ${shellBal()})`); return false; }
  (p.own ||= {})[key + ':' + v] = 1; p.spent = (p.spent || 0) + it.cost;
  playPush(); vib([20, 40, 20]); if(typeof burst === 'function') setTimeout(()=>burst($('bld-av') || document.body, 12), 50);
  toast(`${it.ic} ${it.n}을(를) 샀어요!`); return true;
}

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
  { id:'boltgo',   ic:'🔥', n:'번개 대장',        d:'내가 연 번개에 세 명이 모였어요',       t:s=>s.boltsGo >= 1, xp:30 },
  { id:'bolt2',   ic:'🤝', n:'번개 합류',      d:'남이 연 번개에 들어갔어요',         t:s=>s.boltsJoined >= 1 },
  { id:'ride1',   ic:'🚗', n:'카풀 시작',      d:'차량 쉐어를 올리거나 탔어요',       t:s=>s.ridesMade + s.ridesJoined >= 1 },
  { id:'stay1',   ic:'🏠', n:'한 지붕 아래',   d:'숙소 쉐어를 올리거나 함께했어요',   t:s=>s.staysMade + s.staysJoined >= 1 },
  { id:'chat5',   ic:'💬', n:'마을 수다쟁이',  d:'마을에 한마디를 5번 남겼어요',      t:s=>s.chat >= 5 },
  { id:'react10', ic:'👏', n:'응원왕',         d:'동기에게 반응·응원을 10번 보냈어요', t:s=>s.reacts >= 10 },
  { id:'mvp1',    ic:'👑', n:'주간 MVP',       d:'한 주에 훈련 1위(3회 이상)를 했어요', t:s=>s.mvp >= 1, xp:50 },
  { id:'quiz10',  ic:'🧠', n:'코치님 말씀 척척', d:'코치 퀴즈에서 정답을 10개 맞혔어요', t:(s,p)=>(p.qz||0) >= 10 },
  { id:'quiz30',  ic:'🎓', n:'코치님 제자',     d:'코치 퀴즈에서 정답을 30개 맞혔어요', t:(s,p)=>(p.qz||0) >= 30, xp:40 },
  { id:'goal1',    ic:'🤝', n:'함께 채운 한 주',  d:'6기 이번 주 목표를 같이 채웠어요',     t:(s,p)=>(p.goalN||0) >= 1 },
  { id:'goal4',    ic:'🌈', n:'한 달 팀워크',     d:'6기 주간 목표를 4주 채웠어요',         t:(s,p)=>(p.goalN||0) >= 4, xp:50 },
  { id:'daily7',   ic:'📅', n:'7일 챌린저',       d:'오늘의 챌린지에 7일 참여했어요',       t:(s,p)=>(p.dN||0) >= 7, xp:40 },
  { id:'stamp3',   ic:'🗺️', n:'해변 탐험가',      d:'서로 다른 해변 3곳에서 체크인했어요',   t:(s,p)=>Object.keys(p.stamps||{}).length >= 3, xp:20 },
  { id:'stampAll', ic:'🧭', n:'양양 마스터',      d:'모든 해변에서 체크인했어요',            t:(s,p)=>typeof SEAS !== 'undefined' && Object.keys(p.stamps||{}).length >= SEAS.length, xp:80 },
  { id:'secret1',  ic:'🥚', n:'비밀 발견',        d:'SurfShare 제목을 연달아 눌러 숨은 걸 찾았어요', t:(s,p)=>!!p.secret, xp:30 },
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
    boltsMade:B.filter(b=>b.user_id === id).length, boltsGo:B.filter(b=>b.user_id === id && (b.joins||[]).length >= 3).length, boltsJoined:B.filter(b=>b.user_id !== id && inL(b.joins)).length,
    ridesMade:R.filter(r=>r.user_id === id).length, ridesJoined:R.filter(r=>r.user_id !== id && inL(r.riders)).length,
    staysMade:T.filter(x=>x.user_id === id).length, staysJoined:T.filter(x=>x.user_id !== id && inL(x.guests)).length,
    mvp:(typeof weeklyTop === 'function' ? Object.values(weeklyTop()).filter(a=>a.some(x=>x.id === id)).length : 0),
    chat:(state.chat||[]).filter(m=>m.user_id === id).length, reacts:(state.reacts||[]).filter(r=>r.user_id === id).length };
}
/* 한 번에 쏟아부을 수 있는 건 상한을 둔다 — 수다·반응 도배로 레벨을 사지 못하게 */
const rawXp = s => s.drillDays*10 + s.boltsMade*15 + s.boltsGo*10 + s.boltsJoined*5 + s.ridesMade*15 + s.ridesJoined*5
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
    /* 세 번째는 격일로 바뀐다 — 매일 같은 숙제면 둘째 주부터 안 본다 */
    [ { id:'game', ic:'🎮', t:'파도 점프 한 판',   hint:'쉬는 시간에 가볍게', done:(p.gn?.[day] || 0) > 0,
        go:()=>{ closePlay(); gameOpen(); } },
      { id:'cam',  ic:'📹', t:'낙산 캠으로 바다 확인', hint:'오늘 파도 어떤지 보기', done:!!p.vis?.[day]?.cam,
        go:()=>{ closePlay(); setTab('cam'); } },
      { id:'quiz', ic:'🧠', t:'코치님 퀴즈 한 판',   hint:'누가 한 말일까요?', done:!!p.vis?.[day]?.quiz,
        go:()=>{ closePlay(); quizOpen(); } },
    ][Math.floor(Date.parse(day + 'T00:00:00Z') / 864e5) % 3],     // 날짜 문자열로 센다 — Date.now()/864e5 는 UTC 라 오전 9시에 바뀐다
  ];
}

/* 탭 방문을 퀘스트로 쓴다 — 오늘 처음 열었을 때만 기록하고 저장은 하루 한 번 */
function playVisit(k){
  if(!ME?.profile?.play) return;
  const p = playP(), day = today(); const v = (p.vis ||= {});
  if(v[day]?.[k]) return;
  (v[day] ||= {})[k] = 1; Object.keys(v).sort().slice(0, -3).forEach(d=>delete v[d]);
  playPush(); playTick();
}

/* ── 저장 ── 프로필 upsert 는 saveProfile 과 같은 길. 연달아 불려도 요청은 한 번 */
let _pt = 0;
function playPush(){
  try{ localStorage.setItem('lineup.share.me', JSON.stringify(ME)); }catch(e){}
  clearTimeout(_pt);
  _pt = setTimeout(async ()=>{ try{ await api('surfers', { method:'POST', body:JSON.stringify({
    id:ME.id, name:ME.name, cohort:ME.cohort || 'open', profile:pubSelf() }) }); }catch(e){} }, 1200);
}

/* 다른 기기에서 쌓은 것을 덮어쓰지 않는다 — 숫자는 큰 쪽, 배지는 합집합 */
function playMerge(remote){
  if(!remote || !ME?.profile) return;
  const p = playP(); let ch = false;
  Object.keys(remote.stamps||{}).forEach(k=>{ const s = (p.stamps ||= {}); if(!s[k]){ s[k] = remote.stamps[k]; ch = true; } });
  ['base','bonus','best','qall','qz','goalN','dN','shells','spent'].forEach(k=>{ if((remote[k]||0) > (p[k]||0)){ p[k] = remote[k]; ch = true; } });
  Object.keys(remote.own||{}).forEach(k=>{ const o = (p.own ||= {}); if(!o[k]){ o[k] = 1; ch = true; } });
  Object.keys(remote.badges||{}).forEach(k=>{ if(!p.badges[k]){ p.badges[k] = remote.badges[k]; ch = true; } });
  Object.keys(remote.qd||{}).forEach(d=>{ if(!p.qd[d]){ p.qd[d] = remote.qd[d]; ch = true; }
    else Object.keys(remote.qd[d]).forEach(q=>{ if(!p.qd[d][q]){ p.qd[d][q] = 1; ch = true; } }); });
  Object.keys(remote.gn||{}).forEach(d=>{ if((remote.gn[d]||0) > (p.gn[d]||0)){ p.gn[d] = remote.gn[d]; ch = true; } });
  Object.keys(remote.vis||{}).forEach(d=>{ (p.vis ||= {})[d] = { ...(remote.vis[d]||{}), ...(p.vis[d]||{}) }; });
  if(remote.dbest && remote.dbest.day && (!p.dbest || remote.dbest.day > p.dbest.day || (remote.dbest.day === p.dbest.day && remote.dbest.score > p.dbest.score))){ p.dbest = remote.dbest; ch = true; }
  if(remote.dcday && remote.dcday > (p.dcday || '')){ p.dcday = remote.dcday; ch = true; }
  if(remote.goalWk && remote.goalWk > (p.goalWk || '')){ p.goalWk = remote.goalWk; ch = true; }
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
  if(_xpShown != null && xp > _xpShown && !first) xpFloat(xp - _xpShown);
  _xpShown = xp;
  /* 이미 쓰던 사람에게 한 번만 알린다. 방금 시작한 사람은 환영 카드가 있으니 건너뛰고 본 걸로 친다. */
  const NEWS = 'play1';
  let newsSeen = false; try{ newsSeen = localStorage.getItem('lineup.share.news') === NEWS; }catch(e){ newsSeen = true; }
  if(!newsSeen){ try{ localStorage.setItem('lineup.share.news', NEWS); }catch(e){}
    if(!first) _popQ.push({ ic:'🎮', t:'새로 생겼어요', d:'레벨 · 오늘의 퀘스트 · 배지 도감, 그리고 쉬는 시간용 파도 점프 게임!\n홈의 내 이름 줄을 눌러 보세요.', go:openPlay, btn:'도감 열기' }); }
  /* 방금 가입한 사람은 배지가 없다 — 온보딩이 도감을 소개하니 빈 환영 카드는 생략한다. 기록이 있는 사람에게만 '지금까지'를 보여준다. */
  if(first){ p.lvSeen = lv; if(Object.keys(p.badges).length) _popQ.push({ ic:'📖', t:'서퍼 도감이 열렸어요', d:`지금까지 배지 ${Object.keys(p.badges).length}개 · Lv.${lv+1} ${PLV[lv][1]}`, welcome:true }); }
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
function playGameDone(score, isDaily, shells){
  if(!ME.profile.play){ playReady.force = true; playTick(); }
  const p = playP(), day = today();
  p.gn[day] = (p.gn[day] || 0) + 1;
  const newBest = score > (p.best || 0); if(newBest) p.best = score;
  p.shells = (p.shells || 0) + _num(shells, 500);                       // 이번 판에 모은 조개는 지갑에 쌓인다
  if(p.gday !== day){ p.gday = day; p.gxp = 0; }
  const gain = Math.max(0, Math.min(Math.floor(score / 30), 15 - p.gxp));
  p.gxp += gain; p.bonus += gain;
  /* 오늘의 챌린지 — 그날 최고점만 남기고(다른 날 값은 덮어쓴다), 그날 처음 참여하면 +5 XP. 연속 참여일이 아니라 '참여한 날 수'를 센다. */
  let dGain = 0;
  if(isDaily){
    if(!p.dbest || p.dbest.day !== day) p.dbest = { day, score:0 };
    if(score > p.dbest.score) p.dbest.score = score;
    if(p.dcday !== day){ p.dcday = day; p.dN = (p.dN || 0) + 1; p.bonus += 5; dGain = 5; }
  }
  playTick(); playPush();
  return { gain:gain + dGain, newBest, best:p.best, daily:!!isDaily, shells:_num(shells, 500), bal:shellBal() };
}

/* 6기 전체 주간 목표를 채웠을 때 — 보는 사람이 그 주에 한 번이라도 훈련했어야 받는다(구경만 하고 받아가지 않게).
   주(월요일 시작)마다 한 번만. 렌더 때마다 불리므로 저장값(goalWk)으로 막는다. */
function playGoal(sum, goal, myWeek){
  if(!ME?.profile?.play || sum < goal || myWeek < 1) return;
  const wk = weekKey(dayOf(0)), p = playP();
  if(p.goalWk === wk) return;
  p.goalWk = wk; p.goalN = (p.goalN || 0) + 1; p.bonus += 10;
  _popQ.push({ ic:'🎉', t:'6기 이번 주 목표 달성!', d:'다 같이 채웠어요\n+10 XP', up:true });
  playPush(); playTick();
}

/* 해변 스탬프 — 그 해변에서 체크인하면 한 번 찍힌다. 앱 안의 점수가 아니라 실제로 간 곳을 모으게 한다.
   해변 이름은 SEAS 목록에 있는 것만 받는다. */
function playStamp(beach){
  if(!ME?.profile?.play || typeof SEAS === 'undefined' || !SEAS.some(s=>s[0] === beach)) return;
  const p = playP(); const st = (p.stamps ||= {});
  if(st[beach]) return;
  st[beach] = today(); p.bonus += 5;
  _popQ.push({ ic:'📍', t:`새 스탬프 · ${beach}`, d:`해변 스탬프 ${Object.keys(st).length}/${SEAS.length}\n+5 XP` });
  playPush(); playTick();
}

/* XP 가 오르는 순간 화면 위에 +N 이 떠서, 무엇을 했더니 점수가 됐는지 바로 보인다. 연달아 오르면 합쳐서 한 번에. */
let _xpShown = null, _xpFx = 0, _xpSum = 0, _xpT = 0;
function xpFloat(d){
  const el = $('xpfx'); if(!el || d <= 0) return;
  _xpSum = (Date.now() - _xpFx < 1400 ? _xpSum : 0) + d; _xpFx = Date.now();
  el.textContent = `+${_xpSum} XP`; el.hidden = false; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
  clearTimeout(_xpT); _xpT = setTimeout(()=>{ el.hidden = true; }, 1800);
}

/* 오늘의 서핑 운세 — 사람(아이디)과 날짜로 정해지니 하루 종일 같고 내일이면 바뀐다. 컨디션은 3~5별만 나온다(안 좋은 운세는 재미가 없다).
   여는 건 하루 한 번 +3 XP. 재료는 앱 안에 있는 것(해변·보드 색·코치님 말씀)이라 새 데이터가 없다. */
const _fh = s => { let h = 2166136261; for(const c of String(s)){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
function fortune(){
  const h = _fh(ME.id + '|' + today()), pick = (arr, k) => arr[(h >>> k) % arr.length];
  const colors = Object.entries(BOARDC_KO || {}).map(x=>x[1]);
  const v = (typeof VOICES !== 'undefined' && VOICES.length) ? VOICES[(h >>> 11) % VOICES.length] : null;
  return { star:3 + (h % 3), beach:pick(SEAS.map(s=>s[0]), 3), time:pick(['오전 6시','오전 7시','오전 9시','오후 1시','오후 4시','오후 5시'], 7),
           color:pick(colors, 5), n:1 + ((h >>> 9) % 9), voice:v };
}
function playFortune(){
  const p = playP(), day = today();
  if(p.fortDay !== day){ p.fortDay = day; p.bonus += 3; playPush(); playTick(); }
  renderPlay();
}

/* 숨은 보너스 — 제목을 3초 안에 7번. 알려주지 않는다. 한 번만 받는다. */
function playSecret(){
  if(!ME?.profile?.play) return;
  const p = playP(); if(p.secret) return toast('🥚 이미 찾았어요!');
  p.secret = 1; if(typeof burst === 'function') burst($('title-egg') || document.body, 24); vib([20, 30, 20, 30, 60]);
  playPush(); playTick();
}
(function eggWire(){
  const arm = ()=>{ const h = document.querySelector('.wrap h1'); if(!h || h._egg) return; h._egg = 1; h.id = h.id || 'title-egg'; let n = 0, t0 = 0;
    h.addEventListener('click', ()=>{ const now = Date.now(); if(now - t0 > 3000){ n = 0; t0 = now; } if(++n >= 7){ n = 0; playSecret(); } }); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm); else arm();
})();

/* ── 알림 카드 ── 한꺼번에 여러 개가 걸려도 한 장씩 */
function popNext(){
  if(_popBusy || !_popQ.length || !$('pop')) return;
  /* 다른 시트가 열려 있거나 게임 중이면 기다린다 — 게임 도중에 카드가 덮으면 죽는다 */
  if(window._gameRun || ($('game') && !$('game').hidden)) return;
  if($('onb') && !$('onb').hidden) return;                    // 온보딩 중에는 미룬다 — onbEnd 가 다시 부른다
  const c = _popQ.shift(); _popBusy = true;
  $('pop-ic').textContent = c.ic; $('pop-t').textContent = c.t; $('pop-d').textContent = c.d;
  const go = $('pop-go'); go.hidden = !c.go; _popGo = c.go || null; if(c.go) go.textContent = c.btn || '보러가기';
  $('pop').hidden = false; $('pop-ok').focus({ preventScroll:true });
  vib(c.up ? [30,50,30,50,60] : [20,40,20]);
  if(typeof burst === 'function') burst($('pop-ic'), c.up ? 22 : 12);
}
let _popGo = null;
function popGo(){ const f = _popGo; popClose(); if(f) setTimeout(f, 260); }
function popClose(){ $('pop').hidden = true; _popBusy = false; setTimeout(popNext, 220); }

/* ── 화면 조각 ── 홈 프로필 줄의 레벨 막대, 퀘스트 띠 */
function renderPlayBits(){
  if(!ME?.profile?.play) return;
  const p = ME.profile.play, xp = playXp(p), lv = lvOf(xp), cur = PLV[lv][0], nxt = PLV[lv+1]?.[0];
  const pct = nxt ? Math.max(4, Math.round((xp - cur) / (nxt - cur) * 100)) : 100;      // 0% 도 눈에 보이게 조금은 채운다
  if($('lv-chip')) $('lv-chip').textContent = `Lv.${lv+1} ${PLV[lv][1]} ${PLV[lv][2]}`;
  if($('xp-fill')) $('xp-fill').style.width = pct + '%';
  const stk = (typeof drillStat === 'function' && ME) ? drillStat(ME.id).streak : 0;
  if($('xp-txt')) $('xp-txt').textContent = (stk ? `🔥${stk} · ` : '') + (nxt ? `${xp - cur}/${nxt - cur} XP` : `${xp} XP · 최고 레벨`);
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
let _rkView = 'xp', _plTab = 'today';
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
  const dToday = d => (d && d.day === today()) ? d.score : 0;
  const rows = (state.town||[]).filter(x=>x.id !== ME.id).map(x=>{ const pp = peerPlay(x.profile?.play) || { xp:0, best:0, dbest:null }; return { id:x.id, name:x.name, xp:pp.xp, best:pp.best, daily:dToday(pp.dbest) }; })
    .concat([{ id:ME.id, name:ME.name, xp, best:p.best||0, daily:dToday(p.dbest) }]);
  const key = _rkView === 'xp' ? 'xp' : _rkView === 'daily' ? 'daily' : 'best';
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

    <div class="pltabs" role="tablist" aria-label="도감 구역"><button type="button" role="tab" data-plt="today" aria-selected="${_plTab==='today'}">🎯 오늘</button><button type="button" role="tab" data-plt="collect" aria-selected="${_plTab==='collect'}">🎒 수집</button><button type="button" role="tab" data-plt="rank" aria-selected="${_plTab==='rank'}">🏆 순위</button></div>
    <div class="plpane" data-pane="today">
    <div class="pt">오늘의 퀘스트 <small>${qs.filter(q=>q.done).length}/${qs.length} · 모두 하면 +20 XP</small></div>
    ${qs.map((q,i)=>`<button type="button" class="pq${q.done?' done':''}" data-q="${i}">
        <i>${q.done ? '✔' : q.ic}</i><span>${q.t}<small>${q.done ? '완료 · +5 XP' : q.hint}</small></span><b>${q.done ? '' : '›'}</b></button>`).join('')}

    <div class="pt">🎮 파도 점프 <small>내 최고 ${p.best || 0}점 · 🐚 ${shellBal()}</small></div>
    <button type="button" class="btn blue" id="pg-start" style="width:100%;min-height:48px">📅 오늘의 챌린지 · 점프하러 가기</button>

    <div class="pt">🔮 오늘의 서핑 운세</div>
    ${p.fortDay === today() ? (()=>{ const f = fortune(); return `<div class="fort"><div class="fs">서핑 컨디션 <b>${'★'.repeat(f.star)}${'☆'.repeat(5 - f.star)}</b></div>
      <div>🌊 행운의 해변 <b>${esc(f.beach)}</b></div><div>⏰ 행운의 시간 <b>${f.time}</b></div><div>🎨 행운의 보드 색 <b>${esc(f.color)}</b></div><div>🐚 행운의 조개 <b>${f.n}개</b></div>
      ${f.voice ? `<div class="fv">“${esc(f.voice[0])}”<small>— ${esc(f.voice[1])}</small></div>` : ''}</div>`; })()
      : `<button type="button" class="btn mint" id="pg-fort" style="width:100%;min-height:48px">🔮 오늘의 운세 열어보기 (+3 XP)</button>`}

    <div class="pt">🧠 코치 퀴즈 <small>누적 정답 ${p.qz || 0}개</small></div>
    <button type="button" class="btn mint" id="pg-quiz" style="width:100%;min-height:48px">누가 한 말일까요? — 한 판에 5문제</button>
    </div>
    <div class="plpane" data-pane="collect">
    <div class="pt">📍 해변 스탬프 <small>${Object.keys(p.stamps||{}).length}/${SEAS.length} · 체크인하면 찍혀요</small></div>
    <div class="stmps">${SEAS.map(s=>`<span class="stmp${p.stamps?.[s[0]] ? ' on' : ''}"${p.stamps?.[s[0]] ? ` title="${esc(p.stamps[s[0]])}"` : ''}>${p.stamps?.[s[0]] ? '📍' : '·'} ${esc(s[0])}</span>`).join('')}</div>

    <div class="pt">배지 <small>${got}/${BADGES.length}</small></div>
    <div class="bgrid">${BADGES.map(b=>`<button type="button" class="bd${p.badges[b.id]?' on':''}" data-bd="${b.id}" aria-label="${b.n}${p.badges[b.id]?'':' (잠김)'}">
        <i>${p.badges[b.id] ? b.ic : '🔒'}</i><span>${b.n}</span></button>`).join('')}</div>
    </div>
    <div class="plpane" data-pane="rank">
    <div class="pt">동기 순위 <small>
      <button type="button" class="prk-tab${_rkView==='xp'?' on':''}" data-rk="xp">레벨</button>
      <button type="button" class="prk-tab${_rkView==='best'?' on':''}" data-rk="best">점프</button>
      <button type="button" class="prk-tab${_rkView==='daily'?' on':''}" data-rk="daily">오늘</button></small></div>
    ${shown.length ? shown.map(r=>{ const i = top.indexOf(r); const l = lvOf(r.xp);
      return `<div class="prk${r.id===ME.id?' me':''}"><span class="n">${medal(i)}</span><span class="nm2">${esc(r.name)}</span>
        <span class="v">${_rkView==='xp' ? `Lv.${l+1} · ${r.xp}` : `${r[key]}점`}</span></div>`; }).join('')
      : `<div class="note">${_rkView==='xp' ? '아직 기록이 없어요.' : _rkView==='daily' ? '오늘의 챌린지는 아직 아무도 안 뛰었어요 — 첫 번째가 되어보세요' : '아직 아무도 안 뛰었어요 — 첫 번째가 되어보세요'}</div>`}
    <div class="note" style="margin-top:10px">점수는 훈련·번개·차량·숙소·마을 활동에서 쌓여요. 순위는 재미로만 봐주세요 — 서버가 누가 했는지 증명하진 못해요.</div>
    </div>`;
  $('play-body').dataset.tab = _plTab;
  $('play-body').querySelectorAll('[data-plt]').forEach(b=>b.onclick = ()=>{ _plTab = b.dataset.plt; $('play-body').dataset.tab = _plTab;
    $('play-body').querySelectorAll('[data-plt]').forEach(x=>x.setAttribute('aria-selected', String(x === b))); });
  $('play-body').querySelectorAll('[data-q]').forEach(b=>b.onclick = ()=>{ const q = qs[+b.dataset.q]; if(!q.done) q.go(); });
  $('play-body').querySelectorAll('[data-bd]').forEach(b=>b.onclick = ()=>{ const bd = BADGES.find(x=>x.id === b.dataset.bd);
    toast(p.badges[bd.id] ? `${bd.ic} ${bd.n} — ${bd.d}` : `🔒 ${bd.n} — ${bd.d}`); });
  $('play-body').querySelectorAll('[data-rk]').forEach(b=>b.onclick = ()=>{ _rkView = b.dataset.rk; renderPlay(); });
  $('pg-start').onclick = ()=>{ closePlay(); gameOpen(); };
  $('pg-quiz').onclick = ()=>{ closePlay(); quizOpen(); };
  if($('pg-fort')) $('pg-fort').onclick = playFortune;
}

/* ── 배선 ── */
function playWire(){
  if(playWire.done) return; playWire.done = true;
  $('pop-ok').onclick = popClose; $('pop-go').onclick = popGo;
  $('pop').addEventListener('click', e=>{ if(e.target === $('pop')) popClose(); });
  document.querySelectorAll('[data-playclose]').forEach(b=>b.onclick = closePlay);
  ['prof-lv','quest-strip'].forEach(id=>{ const el = $(id); if(el) el.onclick = openPlay; });
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape'){ if(!$('pop').hidden) popClose(); else if(!$('play-sheet').hidden) closePlay(); } });
}

/* ── 대화창 접근성 ─────────────────────────────────────────────
   시트·팝업·게임은 모두 hidden 속성으로 여닫는다. 그 속성만 지켜보면 각 함수를 고치지 않고도
   (1) 열릴 때 포커스를 창 안으로, (2) 닫히면 누르던 자리로 돌려놓고, (3) Tab 이 창 밖으로 새지 않게 막는다.
   키보드·화면낭독 사용자가 뒤에 남은 화면을 헤매지 않게 하는 최소한이다. */
(function dialogs(){
  const LIST = [['mail-sheet','쪽지'], ['play-sheet','서퍼 도감'], ['quiz-sheet','코치 퀴즈'], ['game','파도 점프'], ['pop','알림']];   // 뒤에 있을수록 위에 뜬다
  const opener = {};
  const focusables = root => [...root.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')]
    .filter(e=>!e.disabled && e.offsetParent !== null);
  function arm(){
    LIST.forEach(([id, label])=>{
      const el = document.getElementById(id); if(!el || el._dlg) return; el._dlg = true;
      el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); if(!el.getAttribute('aria-label')) el.setAttribute('aria-label', label);
      new MutationObserver(()=>{
        if(!el.hidden){ opener[id] = document.activeElement;
          setTimeout(()=>{ const f = focusables(el); (el.querySelector('[data-autofocus]') || f[0])?.focus({ preventScroll:true }); }, 60); }
        else{ const o = opener[id]; opener[id] = null; if(o && document.contains(o) && o.offsetParent !== null) o.focus({ preventScroll:true }); }
      }).observe(el, { attributes:true, attributeFilter:['hidden'] });
    });
  }
  document.addEventListener('keydown', e=>{
    if(e.key !== 'Tab') return;
    const top = LIST.map(([id])=>document.getElementById(id)).filter(el=>el && !el.hidden).pop(); if(!top) return;
    const f = focusables(top); if(!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if(!top.contains(document.activeElement)){ e.preventDefault(); first.focus(); }
    else if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm); else arm();
})();
