/* 🛡️ 해변 수호 — 서바이버류 직접 조작 디펜스. 스틱으로 모찌를 움직이면 기술들이 알아서 싸운다.
   해변 3곳(낙산 → 죽도 → 하조대) × 15라운드. 깨면 다음 해변이 열리고, 남은 학교 HP로 별 1~3개.
   두 가지 화폐를 일부러 나눴다 — 🫧 진주(XP)는 판 안의 레벨 업(기술 3장 중 하나, 무기 Lv5 + 짝 보조면 진화),
   🐚 조개는 라운드 사이 8초 정비에서 수리·두루마리·포탑 같은 소모품. 고르는 재미와 아끼는 재미가 섞이지 않게.
   논리 화면 240×360. 고정 간격(FIX)으로 굴려 2배속·봇 시험에서도 결과가 같다. 객체는 미리 만든 칸(pool)을 돌려 쓴다(적 최대 150). */
(function(){
const $d = id => document.getElementById(id);
const RM = (()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })();   // 흔들림·띠 미끄럼·파편을 줄인다
const W = 240, H = 360, SH = 120, FIX = 1 / 60, NR = 15, SHOP = 8, SLOT = 4, MAXL = 5;
const SX = 120, BY = H - 42, SR = 30;   // 학교 가운데 · 적이 학교에 달라붙는 줄 · 스틱 반지름
const LS = 'lineup.share.dstg';

/* 골칫거리 — bite: 학교에 붙어 초당 깎는 양, sh: 조개, xp: 진주 */
const FO = {
  jelly:{ n:'해파리', hp:12, sp:30, r:6, bite:4.5, sh:1, xp:1, col:'#F49AC1' },
  sj:   { n:'아기 해파리', hp:5, sp:50, r:4, bite:2, sh:0, xp:1, col:'#C9A3F2' },
  crab: { n:'꽃게', hp:9, sp:48, r:6, bite:6, sh:1, xp:1, col:'#E8613C' },
  urch: { n:'성게', hp:22, sp:22, r:6, bite:7.5, sh:2, xp:2, col:'#5B3E8C', spike:1 },
  trash:{ n:'쓰레기 더미', hp:36, sp:18, r:8, bite:9, sh:2, xp:3, col:'#8A7A62', split:1 },
  bag:  { n:'비닐', hp:6, sp:40, r:5, bite:3, sh:0, xp:1, col:'#DDE6EE' },
  gull: { n:'갈매기', hp:7, sp:90, r:6, bite:7.5, sh:1, xp:1, col:'#F2F5F8', fly:1 },
  puff: { n:'복어', hp:18, sp:26, r:6, bite:5, sh:1, xp:2, col:'#F2C14E', spit:1 },
  shark:{ n:'상어', hp:26, sp:28, r:7, bite:8, sh:2, xp:2, col:'#6F8AA6', chg:1 },
  hermit:{ n:'소라게', hp:30, sp:22, r:7, bite:7, sh:2, xp:2, col:'#E98A5B', shell:1 },
  elite:{ n:'대장 꽃게', hp:150, sp:24, r:12, bite:15, sh:10, xp:12, col:'#D9482B', elite:1 },
  king: { n:'대왕 해파리', hp:560, sp:10, r:16, bite:21, sh:20, xp:25, col:'#B07FE0', boss:1, sum:'jelly', se:4 },
  jaws: { n:'백상아리', hp:520, sp:9, r:16, bite:30, sh:30, xp:30, col:'#5C7A99', boss:1, sum:'shark', se:7 },
  storm:{ n:'폭풍 너울', hp:850, sp:6, r:20, bite:45, sh:40, xp:40, col:'#2C7BC0', boss:1, sum:'trash', se:8 }
};
const NM = { jelly:'해파리 떼', crab:'꽃게 떼', urch:'성게', trash:'쓰레기 더미', gull:'갈매기', puff:'복어', shark:'상어', hermit:'소라게', elite:'⭐ 대장 꽃게', king:'👑 대왕 해파리', jaws:'🦈 백상아리', storm:'🌀 폭풍 너울' };
const BHINT = { king:'2단계부터 독침 고리 — 사이로 피해요', jaws:'빨간 줄 = 돌진! 옆으로 비켜요', storm:'빨간 줄이 뜨면 줄 밖으로 피해요!' };
const PH = { king:['독침 고리를 쏴요', '고리가 촘촘해져요'], jaws:['상어 떼를 불러요', '돌진이 빨라져요'], storm:['너울이 두 줄로', '쓰레기가 쏟아져요'] };
/* 해변 — 뒤로 갈수록 빠르고 아프다. 'swarm' 은 한쪽에서 몰려오는 아기 해파리 떼 */
const STG = [
  { n:'낙산', ic:'🏖️', d:'해파리·꽃게가 몰려오는 첫 해변', hp:.85, sp:1.15, bite:1.6, sch:120, g:.72, R:[
    [['jelly',8]], [['jelly',6],['crab',6]], [['crab',10],['jelly',4],['swarm',10]], [['urch',4],['jelly',8]], [['elite',1],['crab',10]],
    [['trash',4],['jelly',8]], [['gull',6],['crab',10],['swarm',14]], [['puff',3],['urch',4],['jelly',8]], [['crab',16],['gull',6]], [['elite',2],['crab',10],['swarm',12]],
    [['trash',6],['urch',6],['puff',3]], [['crab',18],['jelly',12]], [['urch',8],['gull',8],['puff',4],['swarm',16]], [['elite',2],['crab',14],['jelly',10]], [['king',1],['jelly',10],['crab',6]] ] },
  { n:'죽도', ic:'🦈', d:'상어 돌진·소라게 껍데기·복어 독침', hp:.9, sp:1.25, bite:1.25, sch:110, g:.58, R:[
    [['crab',8],['jelly',4]], [['shark',3],['jelly',8]], [['hermit',3],['crab',8]], [['puff',4],['jelly',8],['swarm',12]], [['elite',1],['shark',4],['crab',8]],
    [['hermit',5],['trash',3]], [['shark',6],['gull',6]], [['puff',5],['hermit',4],['swarm',16]], [['crab',14],['shark',6]], [['king',1],['jelly',8]],
    [['hermit',6],['puff',5],['trash',3]], [['shark',8],['crab',14],['swarm',18]], [['urch',8],['hermit',6],['gull',6]], [['elite',2],['shark',6],['puff',4]], [['jaws',1],['shark',4],['crab',8]] ] },
  { n:'하조대', ic:'🌀', d:'모두가 몰려오는 폭풍의 바다', hp:1, sp:1.35, bite:1.45, sch:100, g:.66, R:[
    [['crab',8],['shark',2]], [['hermit',2],['crab',8],['puff',2]], [['trash',5],['jelly',8],['swarm',14]], [['shark',6],['urch',4]], [['elite',1],['hermit',5],['puff',3]],
    [['gull',8],['shark',6]], [['trash',6],['puff',5],['swarm',18]], [['hermit',8],['urch',6]], [['elite',1],['shark',8],['crab',10]], [['jaws',1],['shark',3]],
    [['puff',7],['hermit',6],['gull',6]], [['trash',8],['shark',8],['swarm',20]], [['urch',10],['hermit',8],['puff',5]], [['elite',2],['shark',8],['gull',8],['swarm',16]], [['storm',1],['jelly',8],['crab',8]] ] }
];
/* 기술 — 무기 6(w) + 보조 6. 무기 Lv5 + 짝 보조(ev)를 가지면 다음 레벨 업에 진화 카드가 꼭 뜬다 */
const SK = {
  wax:  { ic:'🧈', n:'왁스 탄', w:1, d:['가까운 적에게 자동 발사', '피해 +25%', '두 갈래 발사', '관통 +1', '세 갈래 발사'], ev:'sun', en:'💥 폭발 왁스', ed:'맞으면 펑 — 주변까지 터져요' },
  boom: { ic:'🏄', n:'서핑보드 부메랑', w:1, d:['갔다 돌아오며 모두 뚫어요', '피해 +25%', '보드 2개', '더 멀리', '보드 3개'], ev:'magnet', en:'🏄 트윈 부메랑', ed:'보드 5개가 사방으로' },
  whip: { ic:'🪢', n:'리쉬 채찍', w:1, d:['앞쪽을 휘둘러 밀쳐요', '피해 +30%', '범위 +20%', '더 자주', '피해 +30%'], ev:'tide', en:'🌀 회오리 리쉬', ed:'한 바퀴를 크게 휘둘러요' },
  dolph:{ ic:'🐬', n:'돌고래', w:1, d:['곁을 도는 돌고래', '피해 +25%', '돌고래 2마리', '더 빠르게', '돌고래 3마리'], ev:'fins', en:'🐬 쌍돌고래', ed:'돌고래 6마리가 넓게' },
  shield:{ ic:'🪼', n:'해파리 방패', w:1, d:['닿는 적을 쏘고 느리게 · 독침을 막아요', '피해 +30%', '범위 +20%', '더 느리게', '피해 +30%'], ev:'heart', en:'🫧 거품 결계', ed:'넓은 결계가 적을 밀어내요' },
  whistle:{ ic:'📣', n:'라이프가드 휘슬', w:1, d:['주변 적을 잠깐 기절', '범위 +20%', '더 자주', '기절 길게', '피해 ×2'], ev:'luck', en:'🚨 사이렌', ed:'화면 전체를 기절시켜요' },
  sun:  { ic:'🧴', n:'선크림', d:'모든 피해 +12%' },
  tide: { ic:'⏱️', n:'물때 시계', d:'모든 기술 8% 더 자주' },
  fins: { ic:'🩴', n:'오리발', d:'이동 속도 +12%' },
  magnet:{ ic:'🧲', n:'자석', d:'줍는 범위 +50%' },
  luck: { ic:'🍀', n:'행운 부적', d:'크리티컬 +8%' },
  heart:{ ic:'🏫', n:'학교 보강', d:'학교 초당 회복 +0.5 · 받는 피해 −6%' }
};
/* 정비 보급 — 조개로 사는 소모품. 값은 c + 산 횟수×inc */
const ITEMS = [
  { k:'heal', ic:'🩹', n:'학교 수리', d:'학교 HP +30%', c:6, inc:3 },
  { k:'lvl', ic:'📜', n:'기술 두루마리', d:'바로 레벨 업!', c:10, inc:6 },
  { k:'guard', ic:'🛟', n:'라이프가드', d:'선 자리에 포탑 (최대 3)', c:8, inc:5 },
  { k:'wall', ic:'🧱', n:'모래 방벽', d:'다음 라운드 학교 피해 40 막기', c:5, inc:2 },
  { k:'rage', ic:'⚡', n:'에너지 음료', d:'다음 라운드 기술 35% 빠르게', c:6, inc:2 },
  { k:'four', ic:'🎴', n:'네 장 뽑기', d:'다음 레벨 업은 4장 중 골라요', c:5, inc:2 },
  { k:'ult', ic:'🌊', n:'큰 파도 충전', d:'큰 파도 +1번', c:14, inc:8 }
];
const IK = {}; ITEMS.forEach(c => IK[c.k] = c);

/* 칸(pool) — 꺼낼 때 on=1, 다 쓰면 on=0. 가득 차면 새로 안 만든다(폰에서 60fps 유지) */
const pool = (n, mk) => { const a = []; for(let i = 0; i < n; i++) a.push(mk()); return a; };
const take = a => { for(let i = 0; i < a.length; i++) if(!a[i].on){ a[i].on = 1; return a[i]; } return null; };
const FOES = pool(150, () => ({ on:0 })), SHOTS = pool(140, () => ({ on:0, hit:[] })), ESH = pool(60, () => ({ on:0 })), DROPS = pool(220, () => ({ on:0 })), PARTS = pool(260, () => ({ on:0 })), TXTS = pool(48, () => ({ on:0 }));
const ALL = [FOES, SHOTS, ESH, DROPS, PARTS, TXTS];

let rnd = Math.random;
const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const need = l => Math.round(6 + l * 3.6);

let S = null, P = null, cv, ctx, K = 2, raf = 0, last = 0, acc = 0, speed = 1, cur = 0, meImg = null, PS = null, SPR = {}, stick = null, botOn = 0, noRw = false, R = null;
const IN = [0, 0], KEYS = {}, TG = [];
try{ const v = +localStorage.getItem(LS); if(v >= 0 && v <= 2) cur = v; }catch(e){}

function start(stg, sd, Uo){
  if(stg != null) cur = Math.max(0, Math.min(2, stg | 0)); const G = STG[cur];
  rnd = mul(sd == null ? (Math.random() * 1e9) | 0 : sd);
  for(const a of ALL) for(const o of a) o.on = 0;
  S = { stg:cur, r:0, ph:'fight', t:0, ft:0, rt:0, q:[], qi:0, hp:G.sch, max:G.sch, lag:G.sch, lagT:0, bacc:0, shells:0, got:0, kills:0, ult:1, big:-1, shake:0, paused:false, res:null, ban:null,
        st:0, offer:[], bought:[], rr:2, nb:{}, guards:[], sw:null, swc:3, boss:null, hint:4, nid:1, earned:0, pw:null, free:0, stars:0,
        sk:{ wax:1 }, evo:{}, lv:1, xp:0, need:need(1), pick:null, lvq:0, four:0, hs:0, hsc:0, cb:0, cbt:0, cbm:0, wall:0, rage:0, wh:null, ws:null, cd:{}, side:1, ar:0, dn:0 };
  P = { x:SX, y:H - 90, face:1, stun:0, kx:0, ky:0, mv:0, thr:0, ax:0, ay:-1 };
  { const U = Uo || ((!botOn && typeof upFor === 'function') ? upFor('defend') : {}) || {};   // 🔧 강화 — 균형 시험(봇)에는 따로 넘긴 값만
    S.ua = U.atk || 0; if(U.sch) S.max = S.hp = S.lag = Math.round(G.sch * (1 + .1 * U.sch)); if(U.shell) S.shells += 3 * U.shell; S.free = U.free || 0; }
  power(); stick = null; window._gameRun = true;
  const ov = $d('d-ov'); if(ov){ ov.hidden = true; ov.innerHTML = ''; }
  startRound(); ctl();
}
function power(){ const L = k => S.sk[k] || 0;
  S.pw = { B:12 * (1 + .12 * L('sun')) * (1 + .08 * (S.ua || 0)), cdm:(1 - .08 * L('tide')) * (S.rage ? .74 : 1), crit:.05 + .08 * L('luck'), sp:64 * (1 + .12 * L('fins')), mag:18 * (1 + .5 * L('magnet')), regen:.5 * L('heart'), dr:1 - .06 * L('heart'), rng:62 };
}
const RW = () => STG[S.stg].R;
function preview(i){ const Rr = RW()[i]; if(!Rr) return ''; const g2 = Rr.filter(x => x[0] !== 'swarm'), g = g2.find(x => FO[x[0]].boss || FO[x[0]].elite) || g2.reduce((a, b) => b[1] > a[1] ? b : a); return `${NM[g[0]]} ×${g[1]}${Rr.length > 1 ? ` 외 ${Rr.length - 1}` : ''}`; }
function banner(k, t, s, d){ S.ban = { k, t, s:s || '', d:d || (k === 'boss' ? 2.6 : 1.6), tm:0 }; }

function startRound(){
  S.r++; S.ph = 'fight'; S.rt = 0; S.q.length = 0; S.qi = 0;
  const Rr = RW()[S.r - 1], T = 3 + S.r * .25;
  for(const [k, n] of Rr){
    if(k === 'swarm'){ const t0 = 2.5 + T * .45; for(let i = 0; i < n; i++) S.q.push({ t:t0 + i * .09, k:'sj', ban:!i }); continue; }   // 떼 — 배너 0.8초 뒤 한쪽에서 쏟아진다
    for(let i = 0; i < n; i++){ const big = FO[k].boss || FO[k].elite; S.q.push({ t:1 + (big ? .4 + i * 2.5 : (i + rnd() * .8) / n * T), k }); } }
  S.q.sort((a, b) => a.t - b.t);
  const bs = Rr.find(g => g[0] !== 'swarm' && FO[g[0]].boss);
  if(bs) banner('boss', `⚠️ ${S.r < NR ? '중간 보스 · ' : ''}${FO[bs[0]].n}`, BHINT[bs[0]]);
  else banner('round', `라운드 ${S.r}`, Rr.some(g => g[0] !== 'swarm' && FO[g[0]].elite) ? '⭐ 엘리트 등장 — 단단해요' : preview(S.r - 1));
  barUI();
}
function spawn(k, x, y){
  const f = take(FOES); if(!f) return null; const F = FO[k], G = STG[S.stg], sc = F.boss ? (1 + G.g * 4) * (S.r < NR ? .65 : 1) : 1 + G.g * (S.r - 1);   // 라운드마다 단단해진다 — 중간 보스는 65%
  f.k = k; f.id = S.nid++; f.hp = f.max = f.lag = F.hp * G.hp * sc; f.lagT = 0; f.spm = G.sp * (.9 + rnd() * .2);
  f.t = 0; f.o = rnd() * 6.28; f.sl = 0; f.slk = 0; f.hit = 0; f.kx = 0; f.ky = 0; f.bite = 0; f.ph = 0; f.se = F.se || 0; f.dc = 0; f.dh = 0;
  f.stn = 0; f.tk = 0; f.cs = 0; f.cc = 1.5 + rnd() * 2; f.cv = k === 'jaws' ? 230 : 190; f.fc = 1 + rnd(); f.sy = SH + 5 + rnd() * 35; f.bp = 1; f.ax = 0; f.ay = 1; f.cl = 0; f.ct = 0;
  f.tx = SX - 28 + rnd() * 56;
  if(x != null){ f.x = x; f.y = y; }
  else if(F.boss){ f.x = SX; f.y = 34; S.boss = f; f.cc = 3; f.fc = 2; }   // 바다 가운데서 솟아오른다
  else if(k === 'sj'){ f.x = S.side < 0 ? -6 : W + 6; f.y = 30 + rnd() * 90; }
  else if(F.fly){ f.x = rnd() < .5 ? -8 : W + 8; f.y = 50 + rnd() * 120; }
  else if(k === 'crab' && rnd() < .5){ f.x = rnd() < .5 ? -8 : W + 8; f.y = SH - 40 + rnd() * 50; }
  else { f.x = 14 + rnd() * (W - 28); f.y = -8 + rnd() * 30; }
  return f;
}

/* 한 칸 굴리기 */
function step(dt){
  if(!S || S.ph === 'done' || S.pick) return;   // 레벨 업 고르는 동안은 세상이 멈춘다
  if(S.hs > 0){ S.hs -= dt; return; }          // 크리티컬·보스 단계 — 아주 잠깐 멈칫(타격감)
  S.t += dt; S.shake = Math.max(0, S.shake - dt); S.hsc -= dt;
  if(S.cbt > 0){ S.cbt -= dt; if(S.cbt <= 0) S.cb = 0; }
  if(S.hint > 0 && (P.mv || S.t > 7)) S.hint -= dt * 3;
  if(S.ban){ S.ban.tm += dt; if(S.ban.tm > S.ban.d) S.ban = null; }
  if(S.big >= 0){ S.big += dt; if(S.big > 1.1) S.big = -1; }
  if(S.lagT > 0) S.lagT -= dt; else if(S.lag > S.hp) S.lag = Math.max(S.hp, S.lag - S.max * .5 * dt);
  if(S.ph === 'shop'){ S.st -= dt; if(S.st <= 0) startRound(); }
  else { S.ft += dt; S.rt += dt;
    while(S.qi < S.q.length && S.q[S.qi].t <= S.rt){ const o = S.q[S.qi++]; if(o.ban){ S.side = rnd() < .5 ? -1 : 1; banner('swarm', '🪼 해파리 떼 몰려와요!', S.side < 0 ? '← 왼쪽에서' : '오른쪽에서 →', 1.5); } spawn(o.k); }
    if(S.pw.regen && S.hp < S.max) S.hp = Math.min(S.max, S.hp + S.pw.regen * dt); }
  if(botOn === 1) botTick();
  move(dt); attack(dt); foes(dt); esh(dt); boss(dt); drops(dt); fx(dt);
  if(S.hp <= 0){ S.hp = 0; return end(false); }
  if(S.ph === 'fight' && S.qi >= S.q.length && !alive()) roundDone();
}
const alive = () => { let n = 0; for(const f of FOES) if(f.on) n++; return n; };

function input(){
  IN[0] = IN[1] = 0;
  if(botOn === 1){ botIn(); return; }
  if(botOn) return;
  if(stick){ const dx = stick.x - stick.bx, dy = stick.y - stick.by, m = Math.hypot(dx, dy); if(m > 3){ const k = Math.min(1, m / SR) / m; IN[0] = dx * k; IN[1] = dy * k; } return; }
  IN[0] = (KEYS.r ? 1 : 0) - (KEYS.l ? 1 : 0); IN[1] = (KEYS.d ? 1 : 0) - (KEYS.u ? 1 : 0);
}
function move(dt){
  input(); let ix = IN[0], iy = IN[1]; const m = Math.hypot(ix, iy); if(m > 1){ ix /= m; iy /= m; }
  P.mv = m > .05 ? 1 : 0; P.thr = Math.max(0, P.thr - dt);
  if(P.stun > 0){ P.stun -= dt; ix = iy = 0; P.mv = 0; }
  if(P.mv){ const l = Math.hypot(ix, iy) || 1; P.ax = ix / l; P.ay = iy / l; }
  const sp = S.pw.sp;
  P.x += (ix * sp + P.kx) * dt; P.y += (iy * sp + P.ky) * dt; P.kx *= .86; P.ky *= .86;
  P.x = Math.max(8, Math.min(W - 8, P.x)); P.y = Math.max(16, Math.min(H - 48, P.y));
  if(ix > .1) P.face = 1; else if(ix < -.1) P.face = -1;
}
/* 가까운 적 n마리(화면 안) — 배열을 새로 만들지 않고 TG 를 돌려 쓴다 */
function near(x, y, r, n){
  TG.length = 0; const r2 = r * r;
  for(const f of FOES){ if(!f.on || f.y < -2) continue; const d = (f.x - x) ** 2 + (f.y - y) ** 2; if(d >= r2) continue; f.dd = d;
    let i = TG.length; if(i >= n && d >= TG[n - 1].dd) continue; if(i < n) TG.push(f); else i = n - 1; while(i > 0 && TG[i - 1].dd > d){ TG[i] = TG[i - 1]; i--; } TG[i] = f; }
  return TG;
}
function shoot(x, y, f, dmg, pierce, kd, ang){
  const s = take(SHOTS); if(!s) return; let a = Math.atan2(f.y - y, f.x - x) + (ang || 0); const v = 210;
  s.kd = kd; s.x = x; s.y = y; s.vx = Math.cos(a) * v; s.vy = Math.sin(a) * v; s.t = (S.pw.rng + 30) / v; s.n = pierce; s.hit.length = 0; s.dmg = dmg; s.ex = kd === 0 && S.evo.wax ? 1 : 0;
}
function board(a, dmg, range, big){ const s = take(SHOTS); if(!s) return; s.kd = 2; s.x = P.x; s.y = P.y - 4; s.vx = Math.cos(a) * 160; s.vy = Math.sin(a) * 160; s.t = 0; s.out = range / 160; s.ph = 0; s.hit.length = 0; s.n = 999; s.dmg = dmg; s.big = big; s.ex = 0; }
function blast(x, y, r, dmg){ ring(x, y, r, '#FFB15C'); for(const f of FOES){ if(!f.on) continue; const dx = f.x - x, dy = f.y - y, rr = r + FO[f.k].r; if(dx * dx + dy * dy < rr * rr) hurt(f, dmg, false, dx, dy, false); } }
function swing(ax, ay, r, dm, full){
  S.wh = { t:0, a:Math.atan2(ay, ax), r, full };
  for(const f of FOES){ if(!f.on) continue; const dx = f.x - P.x, dy = f.y - P.y, d = Math.hypot(dx, dy) || 1, rr = r + FO[f.k].r;
    if(d < rr && (full || (dx * ax + dy * ay) / d > -.15)) hurt(f, dm, rnd() < S.pw.crit, dx, dy, false); }
}
function attack(dt){
  const pw = S.pw, B = pw.B, cd = S.cd, can = P.stun <= 0;
  for(const k in cd) cd[k] -= dt;
  // 🧈 왁스 탄 — 가까운 적 n마리에게
  let L = S.sk.wax || 0;
  if(L && can && !(cd.wax > 0)){ const ev = S.evo.wax, n = ev || L >= 5 ? 3 : L >= 3 ? 2 : 1, dm = B * (ev ? 1.45 : [1, 1.25, 1.25, 1.4, 1.5][L - 1]), pr = ev || L >= 4 ? 1 : 0, tg = near(P.x, P.y, pw.rng, n);
    if(tg.length){ cd.wax = .5 * pw.cdm; const m = tg.length; for(let i = 0; i < n; i++) shoot(P.x, P.y - 4, tg[i % m], dm, pr, 0, i >= m ? (i - m + 1) * .2 * (i % 2 ? 1 : -1) : 0); P.thr = .12; if(!P.mv && Math.abs(tg[0].x - P.x) > 4) P.face = tg[0].x > P.x ? 1 : -1; }
    else cd.wax = .05; }
  // 🏄 부메랑
  L = S.sk.boom || 0;
  if(L && can && !(cd.boom > 0)){ const ev = S.evo.boom, n = ev ? 5 : [1, 1, 2, 2, 3][L - 1], t = near(P.x, P.y, 150, 1)[0];
    cd.boom = 2.2 * pw.cdm; const a0 = t ? Math.atan2(t.y - P.y, t.x - P.x) : -Math.PI / 2;
    for(let i = 0; i < n; i++) board(a0 + (i - (n - 1) / 2) * (ev ? 1.25 : .5), B * (ev ? 1.8 : [1.1, 1.4, 1.4, 1.6, 1.7][L - 1]), ev || L >= 4 ? 105 : 80, ev ? 1 : 0); }
  // 🪢 리쉬 채찍 — 가까운 적 쪽 반원(진화하면 한 바퀴)
  L = S.sk.whip || 0;
  if(L && can && !(cd.whip > 0)){ const ev = S.evo.whip, r = 34 * (ev ? 1.45 : L >= 3 ? 1.2 : 1), t = near(P.x, P.y, r + 8, 1)[0];
    if(t){ cd.whip = 1.4 * pw.cdm * (L >= 4 ? .75 : 1); const m = Math.hypot(t.x - P.x, t.y - P.y) || 1; swing((t.x - P.x) / m, (t.y - P.y) / m, r, B * 1.5 * (ev ? 2 : 1 + .3 * (L >= 2) + .3 * (L >= 5)), ev); }
    else cd.whip = .1; }
  // 🐬 돌고래 — 곁을 돌며 닿는 적을 친다
  L = S.sk.dolph || 0; S.dn = 0;
  if(L){ const ev = S.evo.dolph, n = ev ? 6 : [1, 1, 2, 2, 3][L - 1], rad = ev ? 34 : 24, sp = ev || L >= 4 ? 4.4 : 3.2, dm = B * .8 * (ev ? 1.7 : 1 + .25 * (L >= 2) + .2 * (L >= 5));
    S.dn = n; S.drad = rad; S.dsp = sp;
    for(let i = 0; i < n; i++){ const a = S.t * sp + i * 6.283 / n, x = P.x + Math.cos(a) * rad, y = P.y + Math.sin(a) * rad * .75;
      for(const f of FOES){ if(!f.on || f.dc > 0) continue; const r = FO[f.k].r + 6; if((f.x - x) ** 2 + (f.y - y) ** 2 < r * r){ f.dc = ev ? .3 : .4; hurt(f, dm, rnd() < pw.crit, f.x - P.x, f.y - P.y, false); } } } }
  // 🪼 해파리 방패 — 둘레 안 적을 0.5초마다 쏘고 느리게, 독침을 지운다
  L = S.sk.shield || 0; S.ar = 0;
  if(L){ const ev = S.evo.shield, r = ev ? 36 : 22 * (L >= 3 ? 1.2 : 1); S.ar = r;
    if(!(cd.shield > 0)){ cd.shield = .5; const dm = B * .4 * (ev ? 2 : 1 + .3 * (L >= 2) + .3 * (L >= 5)), sl = ev || L >= 4 ? .5 : .3;
      for(const f of FOES){ if(!f.on) continue; const dx = f.x - P.x, dy = f.y - P.y, rr = r + FO[f.k].r; if(dx * dx + dy * dy < rr * rr){ hurt(f, dm, false, ev ? dx : 0, ev ? dy : 0, false); f.sl = .8; f.slk = FO[f.k].boss ? sl * .4 : sl; } } }
    for(const e of ESH) if(e.on && (e.x - P.x) ** 2 + (e.y - P.y) ** 2 < r * r){ e.on = 0; burst(e.x, e.y, '#F49AC1', 3); } }
  // 📣 휘슬 — 둘레의 적을 기절(보스는 피해만)
  L = S.sk.whistle || 0;
  if(L && !(cd.whistle > 0)){ const ev = S.evo.whistle, r = ev ? 400 : 52 * (L >= 2 ? 1.2 : 1), t = near(P.x, P.y, Math.min(r, 300), 1)[0];
    if(t){ cd.whistle = (ev ? 5 : 5.5 * (L >= 3 ? .75 : 1)) * pw.cdm; const stn = ev ? 1.3 : L >= 4 ? 1 : .6, dm = B * (ev || L >= 5 ? 1.2 : .6);
      S.ws = { t:0, x:P.x, y:P.y, r:Math.min(r, 260) };
      for(const f of FOES){ if(!f.on) continue; const dx = f.x - P.x, dy = f.y - P.y; if(dx * dx + dy * dy < r * r){ if(!FO[f.k].boss) f.stn = Math.max(f.stn, stn); hurt(f, dm, false, 0, 0, false); } } }
    else cd.whistle = .2; }
  // 🛟 라이프가드 포탑
  for(const g of S.guards){ g.cd -= dt; if(g.cd <= 0){ const t = near(g.x, g.y, 66, 1)[0]; if(t){ g.cd = .75; shoot(g.x, g.y - 8, t, B * .7, 0, 1, 0); } else g.cd = .1; } }
  for(const s of SHOTS){ if(!s.on) continue;
    if(s.kd === 2){ s.t += dt; if(!s.ph && s.t >= s.out){ s.ph = 1; s.hit.length = 0; }   // 돌아오는 길에는 같은 적을 한 번 더 친다
      if(s.ph){ const dx = P.x - s.x, dy = P.y - 4 - s.y, m = Math.hypot(dx, dy) || 1; s.vx = dx / m * 190; s.vy = dy / m * 190; if(m < 8 || s.t > 4){ s.on = 0; continue; } } }
    else { s.t -= dt; if(s.t <= 0){ s.on = 0; continue; } }
    s.x += s.vx * dt; s.y += s.vy * dt;
    const sr = s.kd === 2 ? (s.big ? 9 : 7) : 2;
    for(const f of FOES){ if(!f.on || s.hit.includes(f.id)) continue; const r = FO[f.k].r + sr;
      if((f.x - s.x) ** 2 + (f.y - s.y) ** 2 < r * r){ s.hit.push(f.id); const cr = rnd() < pw.crit; hurt(f, s.dmg, cr, s.vx, s.vy, s.kd !== 2);
        if(cr && s.kd === 0 && S.hsc <= 0){ S.hs = .045; S.hsc = .35; }
        if(s.ex) blast(s.x, s.y, 16, s.dmg * .5);
        if(s.kd !== 2 && --s.n < 0){ s.on = 0; break; } } } }
}
function hurt(f, dmg, cr, dx, dy, fr){
  const F = FO[f.k]; if(cr) dmg *= 2;
  if(F.shell && fr && (dx || dy) && dy / (Math.hypot(dx, dy) || 1) < -.45){ dmg *= .15; cr = false; if(f.tk <= 0){ f.tk = .3; txt(f.x, f.y - F.r - 3, '팅!', 6); } }   // 소라게 — 앞(아래)에서 맞으면 껍데기가 막는다. 뒤·옆을 노려야
  f.hp -= dmg; f.hit = .09;
  const kb = F.boss ? 0 : F.elite ? 14 : 60; if(kb && (dx || dy)){ const m = Math.hypot(dx, dy) || 1; f.kx += dx / m * kb; f.ky += dy / m * kb; }
  if(F.boss || F.elite){ if(f.lagT <= 0 && f.lag - f.hp < 1) f.lagT = .45; }
  if(dmg >= 1) txt(f.x + (rnd() - .5) * 6, f.y - F.r - 3, Math.round(dmg), cr ? 2 : 1);
  if(f.hp <= 0) kill(f);
}
function kill(f){
  if(!f.on) return; f.on = 0; S.kills++; const F = FO[f.k], big = F.boss || F.elite;
  burst(f.x, f.y, F.col, F.boss ? 30 : big ? 16 : 7); ring(f.x, f.y, F.r * 2.4, '#FFFFFF');
  for(let i = 0; i < F.sh; i++) if(big || rnd() < .75) drop(f.x + (rnd() - .5) * (big ? 30 : 8), f.y + (rnd() - .5) * (big ? 22 : 8), 0, 0);
  if(big){ for(let v = F.xp; v > 0; v -= 5) drop(f.x + (rnd() - .5) * 26, f.y + (rnd() - .5) * 20, 1, Math.min(5, v)); }
  else if(f.k !== 'sj' || rnd() < .5) drop(f.x, f.y, 1, F.xp);
  if(F.split){ spawn('bag', f.x - 6, f.y); spawn('bag', f.x + 6, f.y); }
  S.cb = S.cbt > 0 ? S.cb + 1 : 1; S.cbt = 1.6; if(S.cb > S.cbm) S.cbm = S.cb;   // 콤보 — 1.6초 안에 이어 잡기. 25마다 조개 보너스
  if(S.cb % 25 === 0){ S.shells += 2; S.got += 2; txt(P.x, P.y - 22, `🔥${S.cb} +🐚2`, 2); }
  if(f === S.boss){ S.boss = null; S.sw = null; S.hs = .12; if(!RM) S.shake = .45; for(const e of ESH) e.on = 0; banner('round', `🎉 ${F.n} 격파!`, '진주·조개를 주워요', 1.8); }
}
function hurtSchool(d){
  d *= S.pw.dr; if(S.wall > 0){ const a = Math.min(S.wall, d); S.wall -= a; d -= a; } if(d <= 0) return;
  S.hp -= d; S.bacc += d; if(S.lagT <= 0 && S.lag - S.hp < .5) S.lagT = .5;
  if(S.bacc > 4){ S.bacc = 0; if(!RM) S.shake = Math.max(S.shake, .2); txt(SX + (rnd() - .5) * 40, BY + 4, '-4', 4); }
}
function needle(x, y, tx, ty, v, dmg, st){ const e = take(ESH); if(!e) return; const dx = tx - x, dy = ty - y, m = Math.hypot(dx, dy) || 1; e.x = x; e.y = y; e.vx = dx / m * v; e.vy = dy / m * v; e.dmg = dmg; e.st = st; e.t = 0; }
function foes(dt){
  let bite = 0; const G = STG[S.stg];
  for(const f of FOES){ if(!f.on) continue;
    const F = FO[f.k]; f.t += dt; f.hit = Math.max(0, f.hit - dt); f.dc -= dt; f.sl -= dt; f.tk -= dt;
    if(f.lagT > 0) f.lagT -= dt; else if(f.lag > f.hp) f.lag = Math.max(f.hp, f.lag - f.max * .4 * dt);
    if(f.stn > 0){ f.stn -= dt; f.x += f.kx * dt; f.y += f.ky * dt; f.kx *= .88; f.ky *= .88; continue; }   // 기절 — 움직이지도 물지도 않는다
    const sp = F.sp * f.spm * (f.sl > 0 ? 1 - f.slk : 1);
    if(f.cs === 1){ f.ct -= dt; if(f.ct <= 0){ f.cs = 2; f.ct = f.cl / f.cv; f.dh = 0; } }   // 돌진 예고(빨간 줄) — 이때는 멈춰 있다
    else if(f.cs === 2){ f.x += f.ax * f.cv * dt; f.y += f.ay * f.cv * dt; f.ct -= dt;
      if(!f.dh && P.stun <= 0 && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (F.r + 7) ** 2){ f.dh = 1; P.stun = F.boss ? .9 : .55; P.kx = f.ax * 170; P.ky = f.ay * 170; if(!RM) S.shake = Math.max(S.shake, .2); txt(P.x, P.y - 16, '쿵!', 3); }
      if(f.ct <= 0 || f.y >= BY){ f.cs = 0; f.cc = F.boss ? (f.bp === 3 ? 2.2 : f.bp === 2 ? 3 : 4) : 2.4 + rnd() * 1.4; } }
    else if(f.bite){ bite += F.bite; }
    else if(F.boss){ f.x += (SX + Math.sin(f.t * .45) * 70 - f.x) * dt;
      if(f.k === 'jaws'){ const ty = Math.min(BY, 60 + f.t * 3.5); f.y += Math.max(-40 * dt, Math.min(sp * dt, ty - f.y)); }   // 백상아리는 돌진 뒤 바다 쪽으로 돌아간다
      else if(f.y < BY) f.y += sp * dt; }
    else if(F.fly){
      if(f.ph < 1.1){ f.ph += dt; f.x += (f.x < W / 2 ? 1 : -1) * 34 * dt; f.y += Math.sin(f.t * 5) * 12 * dt; }
      else { const dx = f.tx - f.x, dy = BY - f.y, m = Math.hypot(dx, dy) || 1; f.x += dx / m * sp * dt; f.y += dy / m * sp * dt; } }
    else if(F.spit && f.y >= f.sy){ f.x += ((f.tx - f.x) * .3 + Math.sin(f.t * 1.3 + f.o) * 10) * dt; f.fc -= dt;   // 복어 — 물가에 멈춰 학교로 독침. 내 몸으로 막을 수 있다
      if(f.fc <= 0){ f.fc = 2.6; needle(f.x, f.y + 4, SX + (rnd() - .5) * 60, BY, 72, 5 * G.bite, 0); } }
    else if(f.k === 'crab' || f.k === 'elite'){ f.x += ((f.tx - f.x) * .25 + Math.sin(f.t * 2.6 + f.o) * sp * (f.k === 'elite' ? .5 : .9)) * dt; f.y += sp * .55 * dt; }
    else { const dx = f.tx - f.x, dy = BY - f.y, m = Math.hypot(dx, dy) || 1; f.x += (dx / m * sp + (f.k === 'jelly' || f.k === 'sj' ? Math.sin(f.t * 2 + f.o) * 8 : 0)) * dt; f.y += dy / m * sp * dt; }
    if(F.chg && !f.cs && !f.bite){ f.cc -= dt;   // 상어 — 가까우면 나를, 멀면 학교를 향해 돌진
      if(f.cc <= 0 && f.y > 8){ const tp = (P.x - f.x) ** 2 + (P.y - f.y) ** 2 < 110 * 110, tx = tp ? P.x : f.tx, ty = tp ? P.y : BY, m = Math.hypot(tx - f.x, ty - f.y) || 1;
        f.ax = (tx - f.x) / m; f.ay = (ty - f.y) / m; f.cl = Math.min(170, m + 20); f.cs = 1; f.ct = .75; } }
    f.x += f.kx * dt; f.y += f.ky * dt; f.kx *= .88; f.ky *= .88;
    f.x = Math.max(-10, Math.min(W + 10, f.x));
    if(f.y >= BY){ f.y = BY; if(Math.abs(f.x - SX) < 46) f.bite = 1; } else if(f.bite && f.y < BY - 3) f.bite = 0;
    if(F.spike && P.stun <= 0){ const r = F.r + 6, dx = P.x - f.x, dy = P.y - f.y;   // 성게 가시 — 부딪히면 기절하고 튕겨 난다
      if(dx * dx + dy * dy < r * r){ const m = Math.hypot(dx, dy) || 1; P.stun = .8; P.kx = dx / m * 160; P.ky = dy / m * 160; if(!RM) S.shake = Math.max(S.shake, .12); txt(P.x, P.y - 16, '따끔!', 3); } }
  }
  if(bite) hurtSchool(bite * G.bite * dt);
}
function esh(dt){
  for(const e of ESH){ if(!e.on) continue; e.x += e.vx * dt; e.y += e.vy * dt; e.t += dt;
    if((e.x - P.x) ** 2 + (e.y - P.y + 6) ** 2 < 72){ e.on = 0; burst(e.x, e.y, '#E9D8FF', 3);
      if(!e.st) txt(P.x, P.y - 18, '막음!', 5); else if(P.stun <= 0){ P.stun = e.st; txt(P.x, P.y - 16, '따끔!', 3); } continue; }
    if(e.y >= BY - 2 && Math.abs(e.x - SX) < 50){ e.on = 0; hurtSchool(e.dmg); continue; }
    if(e.x < -10 || e.x > W + 10 || e.y < -20 || e.y > H || e.t > 7) e.on = 0; }
}
function boss(dt){
  const b = S.boss; if(!b) return; if(!b.on){ S.boss = null; return; }
  const F = FO[b.k], G = STG[S.stg], ph = b.hp > b.max * .66 ? 1 : b.hp > b.max * .33 ? 2 : 3;
  if(ph > b.bp){ b.bp = ph; banner('boss', `${F.n} ${ph}단계!`, PH[b.k][ph - 2], 1.5); if(!RM) S.shake = .3; S.hs = .1; }
  b.se -= dt; if(b.se <= 0){ b.se = F.se * (ph === 3 ? .6 : ph === 2 ? .8 : 1); const n = ph === 3 && b.k !== 'jaws' ? 4 : b.k === 'jaws' ? (ph > 1 ? 2 : 0) : 3; for(let i = 0; i < n; i++) spawn(F.sum, b.x + (i - (n - 1) / 2) * 18, b.y + 12); }
  if(b.k === 'king'){ if(ph >= 2){ b.fc -= dt; if(b.fc <= 0){ b.fc = ph === 3 ? 2.4 : 3.4; const n = ph === 3 ? 14 : 10; for(let i = 0; i < n; i++){ const a = i / n * 6.283 + b.t; needle(b.x, b.y, b.x + Math.cos(a), b.y + Math.sin(a), 62, 3 * G.bite, .35); } } } return; }
  if(b.k === 'jaws'){ if(!b.cs){ b.cc -= dt; if(b.cc <= 0 && b.y < BY - 30){ const m = Math.hypot(P.x - b.x, P.y - b.y) || 1; b.ax = (P.x - b.x) / m; b.ay = (P.y - b.y) / m; b.cl = Math.min(260, m + 40); b.cs = 1; b.ct = ph === 3 ? .6 : .9; } } return; }
  // 폭풍 너울 — 빨간 줄로 예고한 뒤 가로 파도가 화면을 쓸고 간다. 2단계부터 두 줄
  if(!S.sw){ S.swc -= dt; if(S.swc <= 0){ const y1 = Math.max(SH, Math.min(H - 64, P.y)); S.sw = { ys:ph > 1 ? [y1, y1 < 200 ? y1 + 70 : y1 - 70] : [y1], t:0, warn:ph > 1 ? .8 : 1.2, x:-40, dir:rnd() < .5 ? 1 : -1, hit:0 }; S.swc = ph === 3 ? 2.8 : ph === 2 ? 3.6 : 5.5; } return; }
  const s = S.sw; s.t += dt; if(s.t < s.warn) return;
  const k = (s.t - s.warn) / .75; s.x = s.dir > 0 ? -40 + k * (W + 80) : W + 40 - k * (W + 80);
  if(!s.hit) for(const y of s.ys) if(Math.abs(P.y - y) < 13 && Math.abs(P.x - s.x) < 18){ s.hit = 1; P.stun = 1.2; P.ky = -120; if(!RM) S.shake = .3; txt(P.x, P.y - 16, '꽈당!', 3); }
  if(k >= 1) S.sw = null;
}
/* 줍기 — ty 0 조개(9초 뒤 사라짐), 1 진주(v = XP). 진주 칸이 모자라면 바로 XP 로 */
function drop(x, y, ty, v){ const d = take(DROPS); if(!d){ if(ty){ S.xp += v; checkLv(); } return; }
  d.ty = ty; d.v = v; d.x = Math.max(6, Math.min(W - 6, x)); d.y = Math.max(ty ? 18 : SH - 20, Math.min(H - 46, y)); d.t = 0; d.fly = 0; }
function drops(dt){
  const r2 = S.pw.mag * S.pw.mag;
  for(const d of DROPS){ if(!d.on) continue; d.t += dt;
    const dx = P.x - d.x, dy = P.y - d.y, q = dx * dx + dy * dy;
    if(!d.fly){ if(q < r2) d.fly = 1; else if(d.t > (d.ty ? 20 : 9)) d.on = 0; continue; }
    const m = Math.sqrt(q) || 1, v = 120 + d.t * 70; d.x += dx / m * v * dt; d.y += dy / m * v * dt;
    if(m < 7){ d.on = 0;
      if(d.ty){ S.xp += d.v; checkLv(); if(!RM) part(P.x, P.y - 6, '#7FE3FF', (rnd() - .5) * 30, -26, .3, 2); }
      else { S.shells++; S.got++; if(!RM) part(P.x, P.y - 6, '#FFE27A', (rnd() - .5) * 40, -30, .35, 2); } } }
}
/* 레벨 업 */
function checkLv(){ while(S.xp >= S.need){ S.xp -= S.need; S.lv++; S.need = need(S.lv); S.lvq++; } if(S.lvq && !S.pick && S.ph !== 'done') openPick(); }
function choices(){
  const own = Object.keys(S.sk), nw = own.filter(k => SK[k].w).length, np = own.length - nw, out = [], pl = [];
  for(const k of own) if(SK[k].w && S.sk[k] >= MAXL && !S.evo[k] && S.sk[SK[k].ev]) out.push({ k, e:1 });
  for(const k in SK){ const l = S.sk[k] || 0; if(l >= MAXL || (!l && (SK[k].w ? nw >= SLOT : np >= SLOT))) continue; pl.push({ k, w:rnd() * (l ? 2 : 1) }); }   // 가진 기술이 더 자주 뜬다
  pl.sort((a, b) => b.w - a.w);
  const n = S.four ? 4 : 3; S.four = 0;
  for(const o of pl){ if(out.length >= n) break; out.push({ k:o.k }); }
  if(!out.length) out.push({ k:'$heal' }, { k:'$shell' });
  return out;
}
function openPick(){
  S.lvq--; S.pick = choices(); stick = null;
  for(const d of DROPS) if(d.on && d.ty){ d.fly = 1; }   // 레벨 업 순간 — 화면의 진주가 전부 빨려 온다
  burst(P.x, P.y - 8, '#7FE3FF', 12); barUI();
}
function pick(i){
  if(!S || !S.pick) return false; const o = S.pick[i]; if(!o) return false;
  if(o.k === '$heal') S.hp = Math.min(S.max, S.hp + S.max * .15);
  else if(o.k === '$shell'){ S.shells += 5; S.got += 5; }
  else if(o.e){ S.evo[o.k] = 1; banner('round', `✨ ${SK[o.k].en}`, '진화!', 1.4); }
  else S.sk[o.k] = (S.sk[o.k] || 0) + 1;
  S.pick = null; power(); S.hs = .06; ring(P.x, P.y - 6, 30, '#7FE3FF');
  if(S.lvq > 0) openPick(); barUI(); ctl(); return true;
}
function roundDone(){
  if(S.r >= NR) return end(true);
  S.ph = 'shop'; S.st = SHOP; S.sw = null; S.wall = 0; if(S.rage){ S.rage = 0; power(); }
  for(const e of ESH) e.on = 0;
  for(const d of DROPS) if(d.on){ d.fly = 1; d.t = 0; }   // 라운드를 끝내면 남은 조개·진주는 저절로 모인다
  offer(); banner('round', `라운드 ${S.r} 클리어!`, '정비 시간 — 조개로 보급을 사요', 1.4); barUI();
}
function offer(){
  const a = ITEMS.filter(c => !(c.k === 'heal' && S.hp >= S.max * .95) && !(c.k === 'guard' && S.guards.length >= 3) && !(c.k === 'ult' && S.ult >= 2) && !(c.k === 'four' && S.four));
  for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  S.offer = a.slice(0, 3).map(c => c.k); S.bought = [0, 0, 0];
}
const cost = k => S && S.free > 0 ? 0 : IK[k].c + (S.nb[k] || 0) * IK[k].inc;
function buy(i){
  if(!S || S.ph !== 'shop' || S.pick || S.bought[i]) return false; const k = S.offer[i]; if(!k) return false; const c = cost(k); if(S.shells < c) return false;
  S.shells -= c; S.bought[i] = 1; S.nb[k] = (S.nb[k] || 0) + 1; if(S.free > 0) S.free--;
  if(k === 'heal'){ S.hp = Math.min(S.max, S.hp + S.max * .3); txt(SX, BY - 6, '+HP', 5); }
  else if(k === 'lvl'){ S.lvq++; openPick(); }
  else if(k === 'guard') S.guards.push({ x:P.x, y:P.y, cd:0 });
  else if(k === 'wall') S.wall += 40;
  else if(k === 'rage'){ S.rage = 1; power(); }
  else if(k === 'four') S.four = 1;
  else if(k === 'ult') S.ult++;
  burst(P.x, P.y, '#FFE27A', 10); barUI(); ctl(); return true;
}
function reroll(){ if(!S || S.ph !== 'shop' || S.pick || S.shells < S.rr) return false; S.shells -= S.rr; S.rr++; offer(); barUI(); return true; }
function go(){ if(S && S.ph === 'shop' && !S.pick){ startRound(); ctl(); } }
function ult(){
  if(!S || S.ph !== 'fight' || !S.ult || S.paused || S.pick) return false;
  S.ult--; S.big = 0; S.sw = null; if(!RM) S.shake = .5; for(const e of ESH) e.on = 0;
  for(let pass = 0; pass < 2; pass++) for(const f of FOES){ if(!f.on) continue; if(FO[f.k].boss){ if(!pass) hurt(f, f.max * .3, false, 0, -1, false); } else kill(f); }
  ctl(); return true;
}
function end(win){
  S.ph = 'done'; S.res = win ? 'win' : 'lose'; S.pick = null; window._gameRun = false; stick = null;
  const cleared = win ? NR : S.r - 1;
  S.stars = win ? (S.hp >= S.max * .7 ? 3 : S.hp >= S.max * .35 ? 2 : 1) : 0;
  S.earned = Math.min(60, cleared * 2 + (win ? 6 + S.stg * 5 + S.stars * 3 : 0));   // 한 판 🐚20~60 — 강화소(30·60·120…)와 맞춘다
  R = { best:cleared, gain:0, first:0 };
  if(!noRw) try{ if(typeof playDefendDone === 'function') R = playDefendDone(cleared, win, S.earned, S.stg, S.stars) || R; }catch(e){}
  barUI(); ctl(); if(!botOn) over();
}

/* 효과 — 파편·고리·숫자 */
function part(x, y, c, vx, vy, life, s){ const p = take(PARTS); if(!p) return; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.t = 0; p.l = life; p.c = c; p.s = s; p.rg = 0; }
function ring(x, y, r, c){ if(RM) return; const p = take(PARTS); if(!p) return; p.x = x; p.y = y; p.vx = p.vy = 0; p.t = 0; p.l = .28; p.c = c; p.s = 1; p.rg = r; }
function burst(x, y, c, n){ if(RM) n = Math.min(n, 4); for(let i = 0; i < n; i++){ const a = rnd() * 6.28, v = 30 + rnd() * 60; part(x, y, i % 3 ? c : '#FFFFFF', Math.cos(a) * v, Math.sin(a) * v, .35 + rnd() * .25, 1.5 + rnd() * 1.5); } }
function txt(x, y, v, k){ const t = take(TXTS); if(!t) return; t.x = x; t.y = y; t.v = v; t.k = k; t.t = 0; }
function fx(dt){
  for(const p of PARTS){ if(!p.on) continue; p.t += dt; if(p.t > p.l){ p.on = 0; continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .93; p.vy *= .93; }
  for(const t of TXTS){ if(!t.on) continue; t.t += dt; if(t.t > .7){ t.on = 0; continue; } t.y -= 20 * dt; }
  if(S.wh){ S.wh.t += dt; if(S.wh.t > .2) S.wh = null; }
  if(S.ws){ S.ws.t += dt; if(S.ws.t > .4) S.ws = null; }
}

/* 시험·균형용 봇 — 학교에 가장 가까운 적과 학교 사이에 서서, 성게·돌진 줄·너울을 피하고, 기술은 무기 → 짝 보조 순으로 */
function botIn(){
  let tx = P.x, ty = P.y, b = null, bs = -1e9;
  for(const f of FOES){ if(!f.on || f.x < -4 || f.x > W + 4) continue; const sc = f.y + (f.bite ? 80 : 0) - (FO[f.k].boss ? 60 : 0); if(sc > bs){ bs = sc; b = f; } }
  if(b){ tx = b.x; ty = FO[b.k].shell && !b.bite ? Math.max(18, b.y - 34) : Math.min(H - 50, b.y + S.pw.rng * .55); }   // 소라게는 뒤(바다 쪽)로 돌아가서
  else { let bd = 1e9; for(const d of DROPS){ if(!d.on) continue; const q = (d.x - P.x) ** 2 + (d.y - P.y) ** 2; if(q < bd){ bd = q; tx = d.x; ty = d.y; } } }
  if(S.sw) for(const y of S.sw.ys){ if(Math.abs(ty - y) < 22) ty = y + (P.y > y ? 26 : -26); }
  let vx = tx - P.x, vy = ty - P.y; const m = Math.hypot(vx, vy); if(m > .5){ const k = Math.min(1, m / 6) / m; vx *= k; vy *= k; } else vx = vy = 0;
  for(const f of FOES){ if(!f.on) continue;
    if(FO[f.k].spike){ const dx = P.x - f.x, dy = P.y - f.y, q = dx * dx + dy * dy; if(q < 22 * 22){ const l = Math.sqrt(q) || 1; vx += dx / l * 1.5; vy += dy / l * 1.5; } }
    if(f.cs === 1){ const px = P.x - f.x, py = P.y - f.y, along = px * f.ax + py * f.ay; if(along > 0 && along < f.cl){ const cx = px - f.ax * along, cy = py - f.ay * along, d = Math.hypot(cx, cy); if(d < 18){ const l = d || 1; vx += (d ? cx / l : -f.ay) * 2; vy += (d ? cy / l : f.ax) * 2; } } } }
  IN[0] = vx; IN[1] = vy;
}
const BOTW = ['wax', 'boom', 'whip', 'dolph', 'shield', 'whistle'], BOTP = ['sun', 'tide', 'luck', 'magnet', 'heart', 'fins'];
function botPick(){
  let bi = 0, bs = -1e9;
  S.pick.forEach((o, i) => { let s; if(o.e) s = 100; else if(o.k[0] === '$') s = -10; else { const w = SK[o.k].w, l = S.sk[o.k] || 0;
      s = w ? (l ? 60 + l : 40 - BOTW.indexOf(o.k)) : (l ? 30 + l : 25 - BOTP.indexOf(o.k)); if(!w && Object.keys(S.sk).some(k => SK[k].ev === o.k)) s += 15; }
    if(s > bs){ bs = s; bi = i; } });
  pick(bi);
}
const BUYP = ['lvl', 'guard', 'rage', 'wall', 'four', 'ult'];
function botShop(){
  for(let n = 0; n < 4; n++){ let bi = -1, bp = 99;
    S.offer.forEach((k, i) => { if(S.bought[i] || cost(k) > S.shells) return; const p = k === 'heal' ? (S.hp < S.max * .6 ? -1 : 98) : BUYP.indexOf(k); if(p < bp){ bp = p; bi = i; } });
    if(bi < 0 || !buy(bi)) break; while(S.pick) botPick(); }
}
function botTick(){ if(S.ph === 'fight' && S.ult && (S.hp < S.max * .35 || (S.boss && S.r === NR && S.boss.y > BY - 70))) ult(); }

/* 그리기 — 적 그림은 배율이 바뀔 때만 한 번 구워 둔다(맞을 때 쓰는 흰 그림도 함께) */
function mk(w, h){ const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function shade(hex, k){ const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`; }
function eyes(c, x, y, r){ c.fillStyle = '#fff'; c.beginPath(); c.arc(x - r * 1.6, y, r, 0, 7); c.arc(x + r * 1.6, y, r, 0, 7); c.fill(); c.fillStyle = '#1C1530'; c.beginPath(); c.arc(x - r * 1.5, y + r * .2, r * .55, 0, 7); c.arc(x + r * 1.7, y + r * .2, r * .55, 0, 7); c.fill(); }
function crown(c, y, r){ c.fillStyle = '#FFD24A'; c.strokeStyle = '#8A5A00'; c.lineWidth = .7; c.beginPath(); c.moveTo(-r, y); c.lineTo(-r, y - r * .9); c.lineTo(-r * .5, y - r * .45); c.lineTo(0, y - r * 1.1); c.lineTo(r * .5, y - r * .45); c.lineTo(r, y - r * .9); c.lineTo(r, y); c.closePath(); c.fill(); c.stroke(); }
const SHAPE = {
  jelly(c, r, col, cr){
    c.lineCap = 'round'; c.strokeStyle = col; c.lineWidth = Math.max(1, r * .18);
    for(let i = -2; i <= 2; i++){ c.beginPath(); c.moveTo(i * r * .32, 0); c.quadraticCurveTo(i * r * .32 + r * .3, r * .6, i * r * .3 - r * .15, r * 1.15); c.stroke(); }
    const g = c.createRadialGradient(-r * .35, -r * .55, r * .1, 0, -r * .2, r * 1.2); g.addColorStop(0, '#FFF0F8'); g.addColorStop(.45, col); g.addColorStop(1, shade(col, .62));
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, r, r * .95, 0, Math.PI, 0); c.quadraticCurveTo(r * .5, r * .3, 0, r * .18); c.quadraticCurveTo(-r * .5, r * .3, -r, 0); c.fill();
    c.strokeStyle = shade(col, .45); c.lineWidth = .8; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.65)'; c.beginPath(); c.ellipse(-r * .4, -r * .55, r * .22, r * .13, -.5, 0, 7); c.fill();
    eyes(c, 0, -r * .28, r * .17); c.fillStyle = 'rgba(255,110,150,.5)'; c.beginPath(); c.arc(-r * .55, -r * .05, r * .12, 0, 7); c.arc(r * .55, -r * .05, r * .12, 0, 7); c.fill();
    if(cr) crown(c, -r * .9, r * .45);
  },
  crab(c, r, col, cr){
    c.strokeStyle = shade(col, .6); c.lineWidth = Math.max(1, r * .16); c.lineCap = 'round';
    for(const s of [-1, 1]) for(let i = 0; i < 3; i++){ c.beginPath(); c.moveTo(s * r * .6, r * (i * .25 - .05)); c.lineTo(s * r * 1.25, r * (i * .3 + .1)); c.lineTo(s * r * 1.4, r * (i * .3 + .45)); c.stroke(); }
    for(const s of [-1, 1]){ c.beginPath(); c.moveTo(s * r * .5, -r * .3); c.lineTo(s * r * .95, -r * .75); c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(s * r * 1.05, -r * .95, r * .42, 0, 7); c.fill(); c.strokeStyle = shade(col, .55); c.lineWidth = .7; c.stroke();
      c.fillStyle = shade(col, .5); c.beginPath(); c.moveTo(s * r * 1.05, -r * .95); c.lineTo(s * r * 1.35, -r * 1.25); c.lineTo(s * r * 1.15, -r * 1.3); c.closePath(); c.fill(); c.strokeStyle = shade(col, .6); c.lineWidth = Math.max(1, r * .16); }
    const g = c.createRadialGradient(-r * .3, -r * .35, r * .1, 0, 0, r * 1.1); g.addColorStop(0, shade(col, 1.35)); g.addColorStop(1, shade(col, .8));
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, r * .85, r * .62, 0, 0, 7); c.fill(); c.strokeStyle = shade(col, .5); c.lineWidth = .8; c.stroke();
    c.strokeStyle = shade(col, .55); c.lineWidth = .9; for(const s of [-1, 1]){ c.beginPath(); c.moveTo(s * r * .25, -r * .4); c.lineTo(s * r * .3, -r * .75); c.stroke(); }
    eyes(c, 0, -r * .78, r * .16);
    if(cr) crown(c, -r * .95, r * .45);
  },
  urch(c, r, col){
    c.strokeStyle = shade(col, .7); c.lineWidth = Math.max(.9, r * .13); c.lineCap = 'round';
    for(let k = 0; k < 16; k++){ const a = k * .3927 + (k % 2) * .1, l = r + (k % 2 ? 2.5 : 4); c.beginPath(); c.moveTo(Math.cos(a) * r * .6, Math.sin(a) * r * .6); c.lineTo(Math.cos(a) * l, Math.sin(a) * l); c.stroke(); }
    const g = c.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r); g.addColorStop(0, shade(col, 1.6)); g.addColorStop(1, shade(col, .7));
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * .8, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(-r * .28, -r * .1, r * .16, 0, 7); c.arc(r * .28, -r * .1, r * .16, 0, 7); c.fill();
    c.strokeStyle = '#1C1530'; c.lineWidth = .9; c.beginPath(); c.moveTo(-r * .48, -r * .38); c.lineTo(-r * .12, -r * .22); c.moveTo(r * .48, -r * .38); c.lineTo(r * .12, -r * .22); c.stroke();
  },
  trash(c, r){
    c.fillStyle = 'rgba(60,40,20,.25)'; c.beginPath(); c.ellipse(0, r * .55, r * 1.1, r * .4, 0, 0, 7); c.fill();
    c.fillStyle = '#9A8668'; c.beginPath(); c.moveTo(-r, r * .5); c.quadraticCurveTo(-r * 1.05, -r * .3, -r * .3, -r * .55); c.quadraticCurveTo(r * .4, -r * .9, r * .95, -r * .1); c.quadraticCurveTo(r * 1.1, r * .4, r * .9, r * .55); c.closePath(); c.fill();
    c.strokeStyle = '#5E5038'; c.lineWidth = .8; c.stroke();
    c.save(); c.rotate(-.5); c.fillStyle = '#4FA36A'; c.fillRect(-r * .2, -r * 1.05, r * .38, r * .9); c.fillStyle = '#2F6E44'; c.fillRect(-r * .1, -r * 1.3, r * .18, r * .3); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(-r * .14, -r * .95, r * .08, r * .6); c.restore();
    c.fillStyle = '#4C8FD0'; c.fillRect(r * .2, -r * .3, r * .5, r * .55); c.fillStyle = '#D0E4F5'; c.fillRect(r * .2, -r * .3, r * .5, r * .12);
    c.fillStyle = '#F4F1E8'; c.beginPath(); c.moveTo(-r * .8, r * .2); c.lineTo(-r * .3, -r * .1); c.lineTo(-r * .1, r * .35); c.closePath(); c.fill();
    eyes(c, -r * .2, r * .15, r * .14);
  },
  bag(c, r){
    c.fillStyle = 'rgba(240,246,252,.9)'; c.strokeStyle = '#9BB0C4'; c.lineWidth = .8;
    c.beginPath(); c.moveTo(-r * .8, -r * .4); c.quadraticCurveTo(-r, r * .9, 0, r * .9); c.quadraticCurveTo(r, r * .9, r * .8, -r * .4); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(-r * .45, -r * .55, r * .3, Math.PI, 0); c.arc(r * .45, -r * .55, r * .3, Math.PI, 0); c.stroke();
    eyes(c, 0, r * .25, r * .14);
  },
  gull(c, r){
    c.fillStyle = '#C9D3DD'; for(const s of [-1, 1]){ c.beginPath(); c.moveTo(s * r * .3, -r * .1); c.quadraticCurveTo(s * r * 1.2, -r * .7, s * r * 1.7, -r * .1); c.quadraticCurveTo(s * r * 1.1, r * .1, s * r * .3, r * .25); c.fill();
      c.fillStyle = '#5B6672'; c.beginPath(); c.moveTo(s * r * 1.35, -r * .3); c.lineTo(s * r * 1.7, -r * .1); c.lineTo(s * r * 1.3, 0); c.fill(); c.fillStyle = '#C9D3DD'; }
    c.fillStyle = '#FFFFFF'; c.strokeStyle = '#8D99A6'; c.lineWidth = .7; c.beginPath(); c.ellipse(0, 0, r * .45, r * .85, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = '#F4A52A'; c.beginPath(); c.moveTo(-r * .15, r * .75); c.lineTo(0, r * 1.15); c.lineTo(r * .15, r * .75); c.fill();
    c.fillStyle = '#1C1530'; c.beginPath(); c.arc(-r * .18, r * .45, r * .08, 0, 7); c.arc(r * .18, r * .45, r * .08, 0, 7); c.fill();
  },
  puff(c, r, col){
    c.fillStyle = shade(col, .8); for(const s of [-1, 1]){ c.beginPath(); c.moveTo(s * r * .75, 0); c.lineTo(s * r * 1.35, -r * .4); c.lineTo(s * r * 1.35, r * .4); c.closePath(); c.fill(); }
    c.strokeStyle = shade(col, .45); c.lineWidth = .9; for(let k = 0; k < 12; k++){ const a = k * .5236; c.beginPath(); c.moveTo(Math.cos(a) * r * .85, Math.sin(a) * r * .85); c.lineTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15); c.stroke(); }
    const g = c.createRadialGradient(-r * .3, -r * .35, r * .1, 0, 0, r); g.addColorStop(0, shade(col, 1.3)); g.addColorStop(1, shade(col, .75));
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * .9, 0, 7); c.fill(); c.strokeStyle = shade(col, .5); c.lineWidth = .8; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(0, r * .38, r * .5, r * .28, 0, 0, 7); c.fill();
    eyes(c, 0, -r * .25, r * .16); c.fillStyle = '#C0392B'; c.beginPath(); c.arc(0, r * .15, r * .13, 0, 7); c.fill();
  },
  shark(c, r, col, cr){
    c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(0, r * .55, r * 1.15, r * .32, 0, 0, 7); c.fill();   // 물보라
    const g = c.createLinearGradient(-r, 0, r, 0); g.addColorStop(0, shade(col, 1.25)); g.addColorStop(1, shade(col, .7));
    c.fillStyle = g; c.beginPath(); c.moveTo(-r * .85, r * .5); c.quadraticCurveTo(-r * .2, -r * .2, r * .25, -r * 1.1); c.quadraticCurveTo(r * .35, -r * .2, r * .85, r * .5); c.closePath(); c.fill(); c.strokeStyle = shade(col, .45); c.lineWidth = .8; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(-r * .4, r * .3); c.quadraticCurveTo(0, -r * .2, r * .2, -r * .8); c.stroke();
    eyes(c, -r * .05, r * .18, r * .1);
    if(cr){ c.fillStyle = '#fff'; for(let i = -2; i <= 2; i++){ c.beginPath(); c.moveTo(i * r * .18 - r * .08, r * .36); c.lineTo(i * r * .18, r * .5); c.lineTo(i * r * .18 + r * .08, r * .36); c.fill(); } c.save(); c.translate(r * .25, 0); crown(c, -r * 1.05, r * .35); c.restore(); }
  },
  hermit(c, r, col){
    c.strokeStyle = shade(col, .55); c.lineWidth = Math.max(1, r * .14); c.lineCap = 'round';
    for(const s of [-1, 1]){ c.beginPath(); c.moveTo(s * r * .25, -r * .4); c.lineTo(s * r * .35, -r * .95); c.stroke(); c.fillStyle = '#1C1530'; c.beginPath(); c.arc(s * r * .36, -r * 1.0, r * .15, 0, 7); c.fill(); }
    c.fillStyle = col; c.beginPath(); c.ellipse(0, -r * .3, r * .55, r * .35, 0, 0, 7); c.fill();
    // 껍데기는 아래(학교 쪽)를 막는다 — 위·옆이 약점
    const g = c.createRadialGradient(-r * .3, r * .1, r * .1, 0, r * .3, r * 1.1); g.addColorStop(0, '#FFF3E0'); g.addColorStop(1, '#C9A27A');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, r * .3, r * 1.05, r * .72, 0, 0, 7); c.fill(); c.strokeStyle = '#8A6A48'; c.lineWidth = .9; c.stroke();
    c.beginPath(); for(let k = 0; k < 26; k++){ const a = k * .45, q = r * .62 * (1 - k / 30); c.lineTo(Math.cos(a) * q, r * .3 + Math.sin(a) * q * .65); } c.stroke();
  }
};
const LOOK = { jelly:['jelly'], sj:['jelly'], crab:['crab'], urch:['urch'], trash:['trash'], bag:['bag'], gull:['gull'], puff:['puff'], shark:['shark'], hermit:['hermit'], elite:['crab', 1], king:['jelly', 1], jaws:['shark', 1] };
function bakeAll(){
  SPR = {};
  for(const k in LOOK){ const [sh, cr] = LOOK[k], F = FO[k], s = F.r * 3.4 + 6, n = mk(s * K, s * K), c = n.getContext('2d');
    c.scale(K, K); c.translate(s / 2, s / 2 + F.r * .1); SHAPE[sh](c, F.r, F.col, cr);
    const w = mk(s * K, s * K), cw = w.getContext('2d'); cw.drawImage(n, 0, 0); cw.globalCompositeOperation = 'source-atop'; cw.fillStyle = 'rgba(255,255,255,.85)'; cw.fillRect(0, 0, w.width, w.height);
    SPR[k] = { n, w, s }; }
  bakeMe();
}
function bakeMe(){
  PS = null; if(!meImg || !meImg.complete || !meImg.naturalWidth) return;
  const h = 30, w = h * meImg.naturalWidth / meImg.naturalHeight, c = mk(w * K, h * K);
  c.getContext('2d').drawImage(meImg, 0, 0, c.width, c.height); PS = { c, w, h };
}
function loadMe(){
  meImg = null; PS = null;
  try{ if(typeof mochiSVG !== 'function' || typeof ME === 'undefined' || !ME) return; const pr = typeof withLook === 'function' ? withLook(ME.profile, ME.name) : ME.profile;
    const i = new Image(); i.onload = () => { meImg = i; bakeMe(); }; i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(mochiSVG(pr, { charm:2, uid:'d' })); }catch(e){}
}
function rr(c, x, y, w, h, r){ c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function chip(c, x, y, t, bg, fg, al){ c.font = 'bold 8px sans-serif'; const w = c.measureText(t).width + 10; const X = al === 'c' ? x - w / 2 : x; c.fillStyle = bg; rr(c, X, y, w, 13, 6.5); c.fill(); c.fillStyle = fg || '#fff'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(t, X + 5, y + 7); return w; }
function bar(c, x, y, w, h, v, lag, col){ c.fillStyle = 'rgba(11,37,64,.75)'; rr(c, x - 1, y - 1, w + 2, h + 2, 2); c.fill(); c.fillStyle = '#FFFFFF'; c.fillRect(x, y, w * Math.max(0, lag), h); c.fillStyle = col; c.fillRect(x, y, w * Math.max(0, v), h); }
function outl(c, s, x, y, col){ c.lineWidth = 2.2; c.strokeStyle = 'rgba(11,37,64,.88)'; c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y); }

function draw(){
  const c = ctx; if(!c) return; const t = S ? S.t : performance.now() / 1000;
  c.setTransform(K, 0, 0, K, 0, 0); c.save();
  if(S && S.shake > 0 && !RM){ const a = Math.min(1, S.shake * 5) * 3; c.translate((Math.random() - .5) * a, (Math.random() - .5) * a); }
  const map = window.scenery && scenery.shore(W, H, SH);
  if(map) c.drawImage(map, -4, -4, W + 8, H + 8);
  else { c.fillStyle = '#17679F'; c.fillRect(-4, -4, W + 8, SH + 4); c.fillStyle = '#F2DDA6'; c.fillRect(-4, SH, W + 8, H - SH + 4); }
  if(S && S.stg === 2){ c.fillStyle = 'rgba(20,30,60,.22)'; c.fillRect(-4, -4, W + 8, H + 8); } else if(S && S.stg === 1){ c.fillStyle = 'rgba(255,170,90,.1)'; c.fillRect(-4, -4, W + 8, H + 8); }   // 해변마다 하늘빛이 다르다
  if(!RM){ c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1; for(let i = 0; i < 6; i++){ const y = (i * 22 + t * 9) % (SH - 10) + 4, o = Math.sin(i * 2.1) * 40; c.beginPath(); c.moveTo(o + 20, y); c.quadraticCurveTo(o + 60, y - 3, o + 100, y); c.moveTo(o + 140, y + 6); c.quadraticCurveTo(o + 170, y + 3, o + 200, y + 6); c.stroke(); } }
  const fy = SH + (RM ? 0 : Math.sin(t * .9) * 3);
  c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.moveTo(-4, fy - 2); for(let x = -4; x <= W + 4; x += 6) c.lineTo(x, fy + Math.sin(x / 13 + (RM ? 0 : t * 1.6)) * 2.2); c.lineTo(W + 4, fy + 5); c.lineTo(-4, fy + 5); c.fill();
  c.fillStyle = 'rgba(99,207,214,.25)'; c.fillRect(-4, fy + 5, W + 8, 5);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const sn = `${STG[S ? S.stg : cur].n} 서핑학교`; c.font = 'bold 7px sans-serif'; const sw = c.measureText(sn).width + 12;
  c.fillStyle = '#FF8A3D'; rr(c, SX - sw / 2, H - 29, sw, 11, 2); c.fill(); c.fillStyle = '#fff'; c.fillText(sn, SX, H - 23.3);
  if(!S){ c.restore(); return; }
  if(S.wall > 0){ c.fillStyle = '#C9A86A'; c.strokeStyle = '#7A6238'; c.lineWidth = .7; for(let x = SX - 44; x <= SX + 44; x += 11){ c.beginPath(); c.ellipse(x, BY + 9, 6, 3.4, 0, 0, 7); c.fill(); c.stroke(); } }
  // 폭풍 너울 예고 줄 / 쓸고 가는 파도
  if(S.sw){ const s = S.sw;
    for(const y of s.ys){ if(s.t < s.warn){ const a = RM ? .25 : .18 + .14 * Math.sin(s.t * 22); c.fillStyle = `rgba(255,60,60,${a})`; c.fillRect(0, y - 13, W, 26); c.strokeStyle = 'rgba(255,70,70,.85)'; c.setLineDash([5, 4]); c.lineWidth = 1; c.beginPath(); c.moveTo(0, y - 13); c.lineTo(W, y - 13); c.moveTo(0, y + 13); c.lineTo(W, y + 13); c.stroke(); c.setLineDash([]); c.fillStyle = '#FF4646'; c.font = 'bold 12px sans-serif'; c.fillText('!', s.dir > 0 ? 10 : W - 10, y + 1); }
      else { const x0 = s.dir > 0 ? -40 : s.x, x1 = s.dir > 0 ? s.x : W + 40; c.fillStyle = 'rgba(120,200,240,.35)'; c.fillRect(x0, y - 12, x1 - x0, 24);
        const g = c.createLinearGradient(s.x - 20 * s.dir, 0, s.x + 6 * s.dir, 0); g.addColorStop(0, 'rgba(44,123,192,.0)'); g.addColorStop(.6, '#3D9BE0'); g.addColorStop(1, '#FFFFFF'); c.fillStyle = g;
        c.beginPath(); c.moveTo(s.x - 26 * s.dir, y + 13); c.quadraticCurveTo(s.x - 4 * s.dir, y + 10, s.x + 6 * s.dir, y - 2); c.quadraticCurveTo(s.x + 2 * s.dir, y - 15, s.x - 12 * s.dir, y - 14); c.lineTo(s.x - 26 * s.dir, y - 13); c.closePath(); c.fill(); } } }
  // 돌진 예고 — 빨간 줄
  c.lineCap = 'round';
  for(const f of FOES){ if(!f.on || f.cs !== 1) continue; const a = RM ? .45 : .35 + .25 * Math.sin(t * 30); c.strokeStyle = `rgba(255,50,50,${a})`; c.lineWidth = FO[f.k].boss ? 16 : 8; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x + f.ax * f.cl, f.y + f.ay * f.cl); c.stroke(); }
  // 해파리 방패
  if(S.ar){ const pr = RM ? 0 : Math.sin(t * 5) * 1.2; c.fillStyle = S.evo.shield ? 'rgba(160,220,255,.16)' : 'rgba(244,154,193,.14)'; c.strokeStyle = S.evo.shield ? 'rgba(160,220,255,.7)' : 'rgba(244,154,193,.6)'; c.lineWidth = 1; c.beginPath(); c.arc(P.x, P.y - 4, S.ar + pr, 0, 7); c.fill(); c.stroke(); }
  // 조개·진주
  for(const d of DROPS){ if(!d.on) continue; if(!d.ty && d.t > 6.5 && !d.fly && Math.floor(d.t * 8) % 2) continue;
    if(d.ty){ const r = Math.min(3.6, 1.5 + d.v * .4); c.fillStyle = 'rgba(127,227,255,.35)'; c.beginPath(); c.arc(d.x, d.y, r + 1.6, 0, 7); c.fill(); c.fillStyle = '#7FE3FF'; c.beginPath(); c.arc(d.x, d.y, r, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(d.x - r * .3, d.y - r * .3, r * .35, 0, 7); c.fill(); continue; }
    const z = d.fly ? 0 : Math.max(0, Math.sin(Math.min(1, d.t * 3) * Math.PI)) * 5;
    c.fillStyle = 'rgba(80,60,30,.25)'; c.beginPath(); c.ellipse(d.x, d.y + 2, 2.6, 1, 0, 0, 7); c.fill();
    c.fillStyle = '#FFE7C2'; c.strokeStyle = '#C98A4B'; c.lineWidth = .6; c.beginPath(); c.moveTo(d.x - 3, d.y - z + 1); c.quadraticCurveTo(d.x, d.y - z - 5, d.x + 3, d.y - z + 1); c.closePath(); c.fill(); c.stroke(); }
  // 라이프가드 포탑
  for(const g of S.guards){ c.fillStyle = 'rgba(80,60,30,.25)'; c.beginPath(); c.ellipse(g.x, g.y + 5, 7, 2.5, 0, 0, 7); c.fill(); c.fillStyle = '#C0392B'; c.fillRect(g.x - 6, g.y - 4, 12, 9); c.fillStyle = '#fff'; c.fillRect(g.x - 6, g.y - 1, 12, 2); c.font = '10px sans-serif'; c.fillText('🛟', g.x, g.y - 9); }
  // 적
  for(const f of FOES){ if(!f.on) continue; const F = FO[f.k];
    c.fillStyle = 'rgba(10,30,50,.22)'; c.beginPath(); c.ellipse(f.x, f.y + F.r * .9 + (F.fly ? 8 : 0), F.r * .9, F.r * .3, 0, 0, 7); c.fill();
    if(f.k === 'storm'){ drawStorm(c, f, t); }
    else { const sp = SPR[f.k]; if(!sp) continue; let q = RM || f.stn > 0 ? 0 : Math.sin(f.t * (F.fly ? 14 : 6) + f.o) * .07, sx = F.fly ? 1 + q * 2.5 : 1 + q, sy = F.fly ? 1 : 1 - q;
      if(F.spit && f.y >= f.sy && f.fc < .45){ sx *= 1.25; sy *= 1.25; }   // 복어 — 쏘기 직전 부푼다
      if(f.cs === 1 && !RM){ sx *= 1 + Math.sin(t * 40) * .06; }
      c.save(); c.translate(f.x, f.y); if(F.fly && f.ph >= 1.1) c.rotate(Math.atan2(BY - f.y, f.tx - f.x) - Math.PI / 2); c.scale(sx, sy); c.drawImage(f.hit > 0 ? sp.w : sp.n, -sp.s / 2, -sp.s / 2, sp.s, sp.s); c.restore(); }
    if(f.stn > 0){ c.font = '7px sans-serif'; c.fillText('💫', f.x, f.y - F.r - 5); }
    else if(f.sl > 0){ c.fillStyle = 'rgba(160,230,255,.85)'; c.font = '6px sans-serif'; c.fillText('❄', f.x + F.r, f.y - F.r); }
    if(!F.boss && f.hp < f.max){ const w = Math.max(12, F.r * 2); bar(c, f.x - w / 2, f.y - F.r - 6, w, 2, f.hp / f.max, f.lag / f.max, F.elite ? '#FFB020' : '#7BD389'); } }
  // 독침
  for(const e of ESH){ if(!e.on) continue; const m = Math.hypot(e.vx, e.vy) || 1; c.strokeStyle = e.st ? '#B57CFF' : '#E0A800'; c.lineWidth = 2; c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(e.x - e.vx / m * 6, e.y - e.vy / m * 6); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(e.x, e.y, 1.2, 0, 7); c.fill(); }
  // 탄 — 서프 왁스 / 부메랑 보드
  for(const s of SHOTS){ if(!s.on) continue;
    if(s.kd === 2){ c.save(); c.translate(s.x, s.y); c.rotate(RM ? 0 : t * 14); const l = s.big ? 9 : 7; c.fillStyle = s.big ? '#FFCB3D' : '#FF8A3D'; c.strokeStyle = '#14304F'; c.lineWidth = .7; c.beginPath(); c.ellipse(0, 0, l, l * .32, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.fillRect(-l * .7, -.5, l * 1.4, 1); c.restore(); continue; }
    c.fillStyle = s.kd ? '#FF9E9E' : s.ex ? '#FFB15C' : '#FFFFFF'; c.strokeStyle = 'rgba(20,48,79,.6)'; c.lineWidth = .6; c.beginPath(); c.arc(s.x, s.y, s.ex ? 2.8 : 2.2, 0, 7); c.fill(); c.stroke();
    if(!RM){ c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x - s.vx * .025, s.y - s.vy * .025); c.stroke(); } }
  // 범위 원 — 가만히 있을 때만
  if(!P.mv && S.ph === 'fight'){ c.strokeStyle = 'rgba(255,255,255,.45)'; c.setLineDash([3, 4]); c.lineWidth = 1; c.beginPath(); c.arc(P.x, P.y, S.pw.rng, 0, 7); c.stroke(); c.setLineDash([]); }
  // 채찍·휘슬
  if(S.wh){ const w = S.wh, k = w.t / .2; c.strokeStyle = `rgba(255,255,255,${.85 * (1 - k)})`; c.lineWidth = 4 * (1 - k) + 1; c.beginPath(); if(w.full) c.arc(P.x, P.y - 4, w.r * (.7 + .3 * k), 0, 7); else c.arc(P.x, P.y - 4, w.r * (.7 + .3 * k), w.a - 1.5 + k * .4, w.a + 1.5 + k * .4); c.stroke(); }
  if(S.ws){ const w = S.ws, k = w.t / .4; c.strokeStyle = `rgba(255,230,120,${.8 * (1 - k)})`; c.lineWidth = 3; c.beginPath(); c.arc(w.x, w.y, w.r * k, 0, 7); c.stroke(); }
  // 플레이어
  const bob = P.mv ? Math.abs(Math.sin(t * 12)) * 2.2 : Math.sin(t * 3) * .5, sq = P.thr > 0 ? .92 : P.mv ? 1 + Math.sin(t * 24) * .05 : 1 + Math.sin(t * 3) * .02;
  c.fillStyle = 'rgba(10,30,50,.28)'; c.beginPath(); c.ellipse(P.x, P.y + 9, 8, 2.8, 0, 0, 7); c.fill();
  c.save(); c.translate(P.x, P.y + 9 - bob); c.scale(P.face * (2 - sq), sq);
  if(PS) c.drawImage(PS.c, -PS.w / 2, -PS.h, PS.w, PS.h);
  else { c.fillStyle = '#FFF6EA'; c.strokeStyle = '#14304F'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, -10, 10, 9, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#14304F'; c.fillRect(-4, -12, 2, 3); c.fillRect(3, -12, 2, 3); }
  c.restore();
  if(P.stun > 0){ c.font = '9px sans-serif'; for(let i = 0; i < 3; i++){ const a = t * 6 + i * 2.1; c.fillText('⭐', P.x + Math.cos(a) * 9, P.y - 24 + Math.sin(a) * 3); } }
  for(let i = 0; i < S.dn; i++){ const a = S.t * S.dsp + i * 6.283 / S.dn; c.font = '11px sans-serif'; c.fillText('🐬', P.x + Math.cos(a) * S.drad, P.y + Math.sin(a) * S.drad * .75); }
  // 파편·고리·숫자
  for(const p of PARTS){ if(!p.on) continue; const k = p.t / p.l; c.globalAlpha = 1 - k;
    if(p.rg){ c.strokeStyle = p.c; c.lineWidth = 2 * (1 - k) + .5; c.beginPath(); c.arc(p.x, p.y, p.rg * (.3 + .7 * k), 0, 7); c.stroke(); } else { c.fillStyle = p.c; c.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); } } c.globalAlpha = 1;
  for(const x of TXTS){ if(!x.on) continue; c.globalAlpha = Math.min(1, (.7 - x.t) * 4); const big = x.k === 2 || x.k === 3;
    c.font = `bold ${big ? 10 : 7}px sans-serif`; const v = x.k === 2 && typeof x.v === 'number' ? x.v + '!' : String(x.v);
    outl(c, v, x.x, x.y, x.k === 2 ? '#FFE27A' : x.k === 4 ? '#FF6B6B' : x.k === 5 ? '#7BD389' : x.k === 3 ? '#FFB3B3' : x.k === 6 ? '#B9C6D6' : '#FFFFFF'); } c.globalAlpha = 1;
  // 화면 밖 적 — 가장자리 화살표
  for(const f of FOES){ if(!f.on || (f.x >= 0 && f.x <= W && f.y >= -4)) continue; const x = Math.max(5, Math.min(W - 5, f.x)), y = Math.max(5, Math.min(H - 5, f.y)), a = Math.atan2(f.y - y, f.x - x) || (f.y < 0 ? -Math.PI / 2 : 0);
    c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = FO[f.k].boss || FO[f.k].elite ? '#FFB020' : 'rgba(255,80,80,.9)'; c.beginPath(); c.moveTo(4, 0); c.lineTo(-3, -3.5); c.lineTo(-3, 3.5); c.closePath(); c.fill(); c.restore(); }
  if(S.big >= 0){ const y = H - S.big / 1.1 * (H + 90); const g = c.createLinearGradient(0, y, 0, y + 90); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.25, 'rgba(110,200,245,.75)'); g.addColorStop(1, 'rgba(44,123,192,0)'); c.fillStyle = g; c.fillRect(0, y, W, 90); }
  c.restore();
  // 학교 체력 — 흔들리지 않게 화면에 고정
  const hr = S.hp / S.max; bar(c, 70, H - 12, 100, 5, hr, S.lag / S.max, hr > .5 ? '#5BD38A' : hr > .25 ? '#FFC94D' : '#FF5A5A');
  c.textAlign = 'center'; c.font = 'bold 6.5px sans-serif'; outl(c, `🏫 ${Math.ceil(S.hp)}${S.wall > 0 ? ` 🧱${Math.ceil(S.wall)}` : ''}`, 52, H - 9.5, '#fff');
  // 진주(XP) 바 — 맨 위
  c.fillStyle = 'rgba(11,37,64,.7)'; c.fillRect(0, 0, W, 3); c.fillStyle = '#7FE3FF'; c.fillRect(0, 0, W * Math.min(1, S.xp / S.need), 3);
  const left = S.ph === 'fight' ? alive() + S.q.length - S.qi : 0;
  chip(c, 4, 5, S.ph === 'shop' ? `R${S.r}/${NR} · 정비 ${Math.ceil(S.st)}초` : `R${S.r}/${NR} · 남은 적 ${left}`, 'rgba(11,37,64,.8)');
  if(S.r < NR) chip(c, 4, 20, `다음: ${preview(S.r)}`, 'rgba(255,255,255,.88)', '#14304F');
  const w1 = chip(c, 4, 35, `🐚 ${S.shells}`, 'rgba(255,226,122,.92)', '#14304F'); chip(c, 8 + w1, 35, `Lv ${S.lv}`, 'rgba(127,227,255,.92)', '#14304F');
  // 기술 줄 — 아이콘 + 단계(진화는 ★)
  let sx = 4; c.textBaseline = 'middle';
  for(const k in S.sk){ c.fillStyle = S.evo[k] ? 'rgba(255,203,61,.92)' : SK[k].w ? 'rgba(11,37,64,.78)' : 'rgba(60,70,95,.7)'; rr(c, sx, 51, 17, 13, 3); c.fill(); c.font = '8px sans-serif'; c.textAlign = 'center'; c.fillText(SK[k].ic, sx + 6, 57.5);
    c.font = 'bold 6px sans-serif'; c.fillStyle = S.evo[k] ? '#14304F' : '#FFE27A'; c.fillText(S.evo[k] ? '★' : S.sk[k], sx + 14, 59); sx += 19; }
  // 콤보
  if(S.cb >= 5){ const k = Math.min(1, (1.6 - S.cbt) * 8), sc = RM ? 1 : 1 + (1 - k) * .3; c.save(); c.translate(W - 8, 40); c.scale(sc, sc); c.textAlign = 'right'; c.font = 'bold 11px sans-serif'; outl(c, `🔥 ${S.cb}`, 0, 0, S.cb >= 50 ? '#FF7A59' : '#FFE27A'); c.font = 'bold 6.5px sans-serif'; outl(c, '콤보', 0, 10, '#fff'); c.restore(); }
  // 보스 이름·체력 — 단계 눈금
  if(S.boss){ const b = S.boss; c.textAlign = 'center'; c.font = 'bold 8px sans-serif'; outl(c, `${FO[b.k].n} · ${b.bp}단계`, SX, 76, '#FFD1D1'); bar(c, 40, 82, 160, 5, b.hp / b.max, b.lag / b.max, b.bp === 3 ? '#FF3D3D' : b.bp === 2 ? '#FF7A59' : '#FFB020');
    c.fillStyle = 'rgba(11,37,64,.9)'; c.fillRect(40 + 160 * .33, 81, 1, 7); c.fillRect(40 + 160 * .66, 81, 1, 7); }
  // 띠 배너
  if(S.ban){ const b = S.ban, k = b.tm / b.d, a = k < .12 ? k / .12 : k > .82 ? (1 - k) / .18 : 1, sl = RM ? 0 : (1 - Math.min(1, k / .12)) * -60, y = 150, bh = b.k === 'boss' ? 44 : 36;
    c.save(); c.globalAlpha = Math.max(0, a); c.translate(sl, 0);
    if(b.k === 'boss'){ c.fillStyle = 'rgba(20,6,10,.85)'; c.fillRect(0, y - bh / 2, W, bh); c.fillStyle = '#E8343A'; for(let x = -20 + (t * 30) % 16; x < W; x += 16){ c.beginPath(); c.moveTo(x, y - bh / 2); c.lineTo(x + 8, y - bh / 2); c.lineTo(x + 4, y - bh / 2 + 4); c.lineTo(x - 4, y - bh / 2 + 4); c.fill(); c.beginPath(); c.moveTo(x, y + bh / 2); c.lineTo(x + 8, y + bh / 2); c.lineTo(x + 4, y + bh / 2 - 4); c.lineTo(x - 4, y + bh / 2 - 4); c.fill(); } }
    else { c.fillStyle = b.k === 'swarm' ? 'rgba(70,30,110,.85)' : 'rgba(11,37,64,.82)'; c.fillRect(0, y - bh / 2, W, bh); c.fillStyle = b.k === 'swarm' ? '#E3B8FF' : '#FFE27A'; c.fillRect(0, y - bh / 2, W, 1.5); c.fillRect(0, y + bh / 2 - 1.5, W, 1.5); }
    c.textAlign = 'center'; c.fillStyle = b.k === 'boss' ? '#FFD1D1' : '#FFFFFF'; c.font = 'bold 15px sans-serif'; c.fillText(b.t, SX, y - (b.s ? 5 : 0)); if(b.s){ c.font = 'bold 8px sans-serif'; c.fillStyle = '#FFE27A'; c.fillText(b.s, SX, y + 11); } c.restore(); }
  c.textAlign = 'center';
  if(stick){ c.strokeStyle = 'rgba(255,255,255,.6)'; c.fillStyle = 'rgba(11,37,64,.25)'; c.lineWidth = 1.5; c.beginPath(); c.arc(stick.bx, stick.by, SR, 0, 7); c.fill(); c.stroke();
    const dx = stick.x - stick.bx, dy = stick.y - stick.by, m = Math.hypot(dx, dy), k = m > SR ? SR / m : 1; c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(stick.bx + dx * k, stick.by + dy * k, 11, 0, 7); c.fill(); }
  else if(S.hint > 0 && S.ph === 'fight'){ c.globalAlpha = Math.min(1, S.hint); const hx = 52, hy = H - 92, o = RM ? 0 : Math.sin(t * 3) * 12;
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5; c.beginPath(); c.arc(hx, hy, SR, 0, 7); c.stroke(); c.font = '16px sans-serif'; c.fillText('👆', hx + o, hy + 4);
    chip(c, hx, hy + SR + 6, '끌어서 이동 · 자동 공격', 'rgba(11,37,64,.85)', '#fff', 'c'); c.globalAlpha = 1; }
  if(S.pick){ c.fillStyle = 'rgba(11,37,64,.5)'; c.fillRect(0, 0, W, H); c.textAlign = 'center'; c.font = 'bold 16px sans-serif'; outl(c, `⬆️ 레벨 ${S.lv}!`, SX, 62, '#7FE3FF'); }
  if(S.paused){ c.fillStyle = 'rgba(11,37,64,.6)'; c.fillRect(0, 0, W, H); c.textAlign = 'center'; c.fillStyle = '#fff'; c.font = 'bold 18px sans-serif'; c.fillText('⏸ 멈춤', SX, 170); c.font = 'bold 9px sans-serif'; c.fillText('화면을 누르면 계속', SX, 190); }
}
function drawStorm(c, f, t){
  const r = FO.storm.r, rage = f.bp > 1;
  c.save(); c.translate(f.x, f.y + (RM ? 0 : Math.sin(t * 2) * 2));
  if(rage){ c.fillStyle = 'rgba(255,60,60,.18)'; c.beginPath(); c.arc(0, 0, r * 1.7, 0, 7); c.fill(); }
  const g = c.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#5FB4F0'); g.addColorStop(1, '#0E3A6B'); c.fillStyle = g;
  c.beginPath(); c.moveTo(-r * 1.6, r * .7); c.quadraticCurveTo(-r * 1.5, -r * 1.2, r * .3, -r); c.quadraticCurveTo(r * 1.5, -r * .8, r * .9, -r * .05); c.quadraticCurveTo(r * .3, -r * .55, r * .1, r * .1); c.quadraticCurveTo(r * .7, r * .5, r * 1.6, r * .7); c.closePath(); c.fill();
  c.strokeStyle = '#FFFFFF'; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 1.2, -r * .2); c.quadraticCurveTo(-r * .9, -r * 1.05, r * .3, -r * .95); c.quadraticCurveTo(r * 1.3, -r * .75, r * .85, -r * .1); c.stroke();
  for(let i = 0; i < 5; i++){ c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(-r * 1.3 + i * r * .65, r * .7 + Math.sin(t * 4 + i) * 1.5, 2.6, 0, 7); c.fill(); }
  c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-r * .55, r * .05, 3.6, 2.8, 0, 0, 7); c.ellipse(-r * .05, r * .05, 3.6, 2.8, 0, 0, 7); c.fill();
  c.fillStyle = rage ? '#FF2E2E' : '#0B1A2E'; c.beginPath(); c.arc(-r * .5, r * .1, 1.6, 0, 7); c.arc(0, r * .1, 1.6, 0, 7); c.fill();
  c.strokeStyle = '#0B1A2E'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-r * .8, -r * .2); c.lineTo(-r * .38, -r * .05); c.moveTo(r * .2, -r * .2); c.lineTo(-r * .2, -r * .05); c.stroke();
  if(f.hit > 0){ c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(-r * 2, -r * 2, r * 4, r * 4); }
  c.restore();
}

/* 덮개 — 스테이지 고르기 / 결과 */
function prog(){ const d = (typeof ME !== 'undefined' && ME && ME.profile && ME.profile.play && ME.profile.play.df) || {}; const n = (v, m) => { const x = Math.floor(+v); return Number.isFinite(x) ? Math.max(0, Math.min(m, x)) : 0; };
  const ar = (a, m) => [0, 1, 2].map(i => n(Array.isArray(a) ? a[i] : 0, m)); return { b:n(d.best, NR), c:n(d.clears, 9999), hd:n(d.hd, 3), st:ar(d.st, 3), sb:ar(d.sb, NR) }; }
const opened = (p, i) => i === 0 || i <= p.hd || p.st[i - 1] > 0;   // 앞 해변을 지키면 다음이 열린다
const stars = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const tm = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function build(){ return Object.keys(S.sk).map(k => `<span>${S.evo[k] ? esc(SK[k].en) : `${SK[k].ic} ${esc(SK[k].n)} ${S.sk[k]}`}</span>`).join(''); }
function over(){
  const ov = $d('d-ov'); if(!ov) return; const p = prog(); ov.hidden = false;
  if(!opened(p, cur)) cur = 0;
  if(!S || S.ph !== 'done'){
    ov.innerHTML = `<div class="go-card"><div class="go-t">🛡️ 해변 수호</div>
      <div class="go-d">스틱으로 움직이면 기술이 <b>자동으로</b> 싸워요. 🫧 진주로 레벨 업해 기술을 고르고, 🐚 조개로 정비 시간에 보급을 사요.</div>
      <div class="d-stgs" role="group" aria-label="스테이지">${STG.map((g, i) => { const ok = opened(p, i);
        return `<button type="button" class="d-stg" data-stage="${i}" aria-pressed="${i === cur}" ${ok ? '' : 'disabled'}><i>${ok ? g.ic : '🔒'}</i><b>${i + 1}. ${esc(g.n)}</b><em>${stars(p.st[i])}</em><small>${ok ? esc(g.d) + (p.sb[i] ? ` · 최고 R${p.sb[i]}` : '') : '앞 해변을 지키면 열려요'}</small></button>`; }).join('')}</div>
      <div class="go-r"><span>👆 화면을 눌러 끌면 스틱 · PC는 방향키/WASD</span><span>⬆️ 레벨 업마다 기술 3장 · 무기 Lv5 + 짝 보조 = 진화</span><span>⭐ 학교 HP를 많이 남길수록 별이 늘어요</span></div>
      <button class="btn" id="d-go" type="button" style="width:100%">🌊 ${esc(STG[cur].n)} 시작</button></div>`;
    ov.querySelectorAll('[data-stage]').forEach(x => x.onclick = () => { if(x.disabled) return; cur = +x.dataset.stage; try{ localStorage.setItem(LS, cur); }catch(e){} over(); });
  } else {
    const win = S.res === 'win', G = STG[S.stg], nm = typeof ME !== 'undefined' && ME && ME.name ? esc(ME.name) : '', nx = win && S.stg < 2;
    ov.innerHTML = `<div class="go-card"><div class="go-t">${win ? `🏆 ${esc(G.n)} 해변을 지켰어요!` : '🌊 학교가 잠겼어요'}</div>
      ${win ? `<div class="d-stars" aria-label="별 ${S.stars}개">${[0, 1, 2].map(i => i < S.stars ? '<span>★</span>' : '<span><s>★</s></span>').join('')}</div>` : ''}
      <div class="go-d">${win ? `${nm ? nm + ' 님이 ' : ''}${esc(FO[['king', 'jaws', 'storm'][S.stg]].n)}까지 막아냈어요${S.stars < 3 ? ' · 학교 HP 70% 넘게 남기면 ★3' : ''}` : `${esc(G.n)} 라운드 ${S.r}에서 밀렸어요. 📜 두루마리로 레벨을 더 올려 봐요`}</div>
      <div class="go-st"><span>라운드<b>${S.r}/${NR}</b></span><span>처치<b>${S.kills}</b></span><span>시간<b>${tm(S.ft)}</b></span><span>최고 콤보<b>${S.cbm}</b></span></div>
      <div class="d-build" aria-label="이번 판 기술">${build()}</div>
      <div class="go-b">보상 <b>🐚${R && R.shells || S.earned}${R && R.x2 ? ' ×2' : ''}</b> · XP +${R && R.gain || 0} · Lv ${S.lv}</div>
      ${R && R.first ? `<div class="d-new">🎉 첫 클리어 보너스 🐚+${R.first}${S.stg < 2 ? ` · ${esc(STG[S.stg + 1].n)} 열림!` : ''}</div>` : ''}
      ${typeof upNudge === 'function' ? upNudge('defend', { sc:win ? NR : S.r - 1, best:R && R.best || 0, u:'라운드', x2:R && R.x2 }) : ''}
      <div class="d-row">${nx ? '<button class="btn" id="d-next" type="button">다음 스테이지 ▶</button>' : ''}<button class="btn${nx ? ' ghost' : ''}" id="d-go" type="button">🔁 다시</button></div>
      <div class="d-row"><button class="btn ghost" id="d-sel" type="button">🗺️ 해변 고르기</button><button class="btn ghost" id="d-close" type="button">닫기</button></div></div>`;
    $d('d-close').onclick = defendClose;
    $d('d-sel').onclick = () => { S = null; R = null; barUI(); ctlKey = ''; ctl(); over(); };
    if(nx) $d('d-next').onclick = () => { cur = S.stg + 1; try{ localStorage.setItem(LS, cur); }catch(e){} start(cur); };
  }
  $d('d-go').onclick = () => start(S && S.ph === 'done' ? S.stg : cur);
}

/* 아래 띠 — 레벨 업 기술 고르기 / 정비 보급. 살 수 있는지가 바뀔 때만 다시 그린다(누르는 중 버튼이 바뀌어 탭이 씹히지 않게) */
let barKey = '';
function skCard(o, i){
  if(o.k === '$heal') return `<button type="button" class="d-card" data-pick="${i}"><i>🩹</i><b>학교 수리</b><small>학교 HP +15%</small><em>보너스</em></button>`;
  if(o.k === '$shell') return `<button type="button" class="d-card" data-pick="${i}"><i>🐚</i><b>조개 주머니</b><small>조개 +5</small><em>보너스</em></button>`;
  const C = SK[o.k], l = S.sk[o.k] || 0;
  if(o.e) return `<button type="button" class="d-card evo" data-pick="${i}"><i>${C.ic}</i><b>${esc(C.en)}</b><small>${esc(C.ed)}</small><em>✨ 진화!</em></button>`;
  const d = C.w ? C.d[l] : C.d, pair = C.w ? SK[C.ev] : Object.values(SK).find(x => x.ev === o.k);
  return `<button type="button" class="d-card${l ? '' : ' new'}" data-pick="${i}"><i>${C.ic}</i><b>${esc(C.n)}</b><small>${esc(d)}</small><em>${l ? `Lv${l}→${l + 1}` : 'NEW'}${pair ? ` · 짝 ${pair.ic}` : ''}</em></button>`;
}
function barUI(){
  const el = $d('d-bar'); if(!el) return;
  if(!S || (S.ph !== 'shop' && !S.pick) || S.ph === 'done'){ if(!el.hidden){ el.hidden = true; el.innerHTML = ''; el.classList.remove('pick'); } barKey = ''; return; }
  const key = S.pick ? 'p' + S.lv + S.pick.map(o => o.k + (o.e || '')).join() : [S.offer, S.bought, S.offer.map(k => S.shells >= cost(k)), S.shells >= S.rr].join('|'); if(key === barKey && !el.hidden) return; barKey = key;
  el.hidden = false; el.classList.toggle('pick', !!S.pick);
  if(S.pick){
    el.innerHTML = `<div class="d-sh"><b>⬆️ 레벨 ${S.lv}!</b><b>기술 하나를 골라요</b></div><div class="d-cards${S.pick.length > 3 ? ' n4' : ''}">${S.pick.map(skCard).join('')}</div>`;
    el.querySelectorAll('[data-pick]').forEach(x => x.onclick = () => pick(+x.dataset.pick));
    return;
  }
  el.innerHTML = `<div class="d-sh"><b>🔧 정비 <span id="d-st">${Math.ceil(S.st)}</span>초</b><b>🐚 <span id="d-shs">${S.shells}</span></b></div><div class="d-cards">${S.offer.map((k, i) => { const C = IK[k], c = cost(k);
      return S.bought[i] ? `<button type="button" class="d-card on" disabled><i>✅</i><b>${C.n}</b><small>샀어요</small></button>`
        : `<button type="button" class="d-card" data-buy="${i}" ${S.shells < c ? 'disabled' : ''}><i>${C.ic}</i><b>${C.n}</b><small>${C.d}</small><u>${c ? '🐚' + c : '🎟️ 무료'}</u></button>`; }).join('')}</div>
    <div class="d-row"><button type="button" class="btn sm ghost" data-rr ${S.shells < S.rr ? 'disabled' : ''}>🔄 바꾸기 🐚${S.rr}</button><button type="button" class="btn sm" data-gonext>출발 ▶</button></div>`;
  el.querySelectorAll('[data-buy]').forEach(x => x.onclick = () => buy(+x.dataset.buy));
  el.querySelector('[data-rr]').onclick = reroll; el.querySelector('[data-gonext]').onclick = go;
}
let ctlKey = '';
function ctl(){
  const p = $d('d-pause'), sp = $d('d-speed'), a = $d('d-act'); if(!p) return;
  const on = !!(S && S.ph !== 'done'), k = [on, S && S.paused, speed, S && S.ult, S && S.ph, S && !!S.pick].join(); if(k === ctlKey) return; ctlKey = k;
  p.disabled = sp.disabled = !on;
  p.textContent = S && S.paused ? '▶' : '⏸'; p.setAttribute('aria-label', S && S.paused ? '계속하기' : '멈추기'); p.setAttribute('aria-pressed', !!(S && S.paused));
  sp.textContent = `×${speed}`; sp.setAttribute('aria-label', `배속 ${speed}배`);
  a.disabled = !on || !S.ult || S.ph !== 'fight' || S.paused || !!S.pick; a.innerHTML = S && !S.ult ? '<b>🌊</b><small>사용함</small>' : `<b>🌊</b><small>큰 파도${S && S.ult > 1 ? ' ×' + S.ult : ''}</small>`;
  a.classList.toggle('used', !!(S && !S.ult));
}
let hudKey = '';
function ui(){
  const h = $d('d-hud'); const k = S ? `Lv${S.lv} · 🐚${S.shells} · 🏫${Math.ceil(S.hp)}` : ''; if(h && k !== hudKey){ hudKey = k; h.textContent = k; }
  if(!S) return; barUI(); ctl();
  if(S.ph === 'shop' && !S.pick){ const st = $d('d-st'), sh = $d('d-shs'), v = String(Math.max(0, Math.ceil(S.st))); if(st && st.textContent !== v) st.textContent = v; if(sh && sh.textContent !== String(S.shells)) sh.textContent = S.shells; }
}
function fit(){
  if(!cv) return; const w = cv.getBoundingClientRect().width || W * 2, dpr = Math.min(3, window.devicePixelRatio || 1), pw = Math.round(w * dpr);
  if(pw !== cv.width){ cv.width = pw; cv.height = Math.round(pw * H / W); }
  const k = cv.width / W; if(k !== K || !SPR.jelly){ K = k; bakeAll(); }
}
function loop(ts){
  raf = requestAnimationFrame(loop);
  if(!last) last = ts; const dt = Math.min(.05, (ts - last) / 1000); last = ts;
  if(S && !S.paused && S.ph !== 'done'){ acc += dt * speed; let n = 0; while(acc >= FIX && n++ < 8){ step(FIX); acc -= FIX; } } else acc = 0;
  draw(); ui();
}

/* 조작 — 화면 어디든 엄지를 대면 그 자리에 스틱이 생기고, 멀리 끌면 받침이 따라온다 */
function lp(e){ const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
function pd(e){
  if(!S || S.ph === 'done' || S.pick) return; e.preventDefault();
  if(S.paused){ S.paused = false; return; }
  if(stick) return; const [x, y] = lp(e); stick = { id:e.pointerId, bx:x, by:y, x, y }; try{ cv.setPointerCapture(e.pointerId); }catch(_){}
}
function pm(e){ if(!stick || e.pointerId !== stick.id) return; const [x, y] = lp(e); stick.x = x; stick.y = y; const dx = x - stick.bx, dy = y - stick.by, m = Math.hypot(dx, dy); if(m > SR * 1.4){ const k = (m - SR * 1.4) / m; stick.bx += dx * k; stick.by += dy * k; } }
function pu(e){ if(stick && e.pointerId === stick.id) stick = null; }
const KM = { ArrowLeft:'l', a:'l', A:'l', ArrowRight:'r', d:'r', D:'r', ArrowUp:'u', w:'u', W:'u', ArrowDown:'d', s:'d', S:'d' };

function defendOpen(){
  wire(); cv = $d('d-cv'); ctx = cv.getContext('2d');
  $d('defend').hidden = false; document.body.classList.add('game-on');
  S = null; R = null; loadMe(); fit(); over(); barUI(); ctlKey = ''; ctl();
  last = 0; acc = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
}
function defendClose(){
  cancelAnimationFrame(raf); raf = 0; S = null; stick = null; window._gameRun = false;
  $d('defend').hidden = true; document.body.classList.remove('game-on'); barUI();
  if(typeof playTick === 'function') playTick(); if(typeof renderHub === 'function' && typeof state !== 'undefined' && state.tab === 'play') renderHub();
}
function wire(){
  if(wire.done || !$d('defend')) return; wire.done = true;
  const c = $d('d-cv');
  $d('d-x').onclick = defendClose;
  c.addEventListener('pointerdown', pd); c.addEventListener('pointermove', pm); c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu); c.addEventListener('lostpointercapture', pu);
  $d('d-pause').onclick = () => { if(S && S.ph !== 'done'){ S.paused = !S.paused; stick = null; ctl(); } };
  $d('d-speed').onclick = () => { speed = speed === 1 ? 2 : 1; ctl(); };
  $d('d-act').onclick = () => { ult(); ctl(); };
  addEventListener('keydown', e => { if($d('defend').hidden) return; if(e.key === 'Escape') return defendClose();
    if(/INPUT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName)) return;
    if(S && S.pick && /^[1-4]$/.test(e.key)){ pick(+e.key - 1); e.preventDefault(); return; }   // PC — 숫자키로 기술 고르기
    if(KM[e.key]){ KEYS[KM[e.key]] = 1; e.preventDefault(); } else if(e.key === ' ' && S && S.ph !== 'done'){ S.paused = !S.paused; e.preventDefault(); } });
  addEventListener('keyup', e => { if(KM[e.key]) KEYS[KM[e.key]] = 0; });
  addEventListener('resize', () => { if(!$d('defend').hidden) fit(); });
  document.addEventListener('visibilitychange', () => { if(S && document.hidden && S.ph !== 'done'){ S.paused = true; stick = null; } last = 0; });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
window.defendOpen = defendOpen; window.defendClose = defendClose;

/* 시험·균형용 손잡이 */
function killAll(withBoss){ for(let p = 0; p < 3; p++) for(const f of FOES) if(f.on && (withBoss || !FO[f.k].boss)) kill(f); }
function skip(r){ if(!S) return; for(const a of [FOES, SHOTS, ESH]) for(const o of a) o.on = 0; S.boss = null; S.sw = null; S.pick = null; S.lvq = 0; S.r = r - 1; startRound(); }
window._defend = { get S(){ return S; }, get P(){ return P; }, get stick(){ return stick; }, start, step, buy, reroll, go, ult, skip, killAll, pick, FIX, NR, STG, SK, ITEMS,
  xp(v){ if(S && S.ph !== 'done'){ S.xp += v; checkLv(); } },
  fast(sec){ for(let k = 0; S && S.ph !== 'done' && k < sec / FIX; k++){ if(S.pick) pick(0); step(FIX); } },
  lose(){ if(S && S.ph !== 'done'){ S.pick = null; S.hp = 0; S.hs = 0; step(FIX); } },
  win(){ if(!S) return; skip(NR); S.qi = S.q.length; for(const o of S.q) spawn(o.k); killAll(true); S.pick = null; S.lvq = 0; S.hs = 0; step(FIX); },
  run(stg, sd, rw, U){ noRw = !rw; botOn = 1; start(stg, sd, U || {}); let f = 0;
    while(S.ph !== 'done' && S.t < 1500){ if(S.pick) botPick(); else if(S.ph === 'shop'){ botShop(); go(); } step(FIX); if(S.ph === 'fight') f += FIX; }
    const o = { res:S.res, r:S.r, kills:S.kills, t:Math.round(f), hp:Math.round(S.hp), stars:S.stars, lv:S.lv, cb:S.cbm, sk:Object.keys(S.sk).map(k => k + S.sk[k] + (S.evo[k] ? '*' : '')).join(' ') }; botOn = 0; noRw = false; over(); return o; }
};
})();
