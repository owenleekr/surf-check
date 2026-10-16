/* 🛡️ 해변 수호 — 액션 아케이드. 「🏫 서핑 학교를 지켜라!」 바다에서 몰려오는 괴물을 내 손으로 때려 막는다.
   조작은 넷뿐 — 왼쪽 스틱(이동) · 👊 공격(가까운 적 자동 조준, 꾹 누르면 3단 콤보, 3타째가 제일 세다) · 💨 대시(잠깐 무적) · 🌊 필살기(때릴수록 차는 게이지, 화면 전체).
   해변 3곳(낙산 → 죽도 → 하조대) × 웨이브 5(마지막은 보스). 웨이브 사이에 큰 그림 카드 3장 중 하나로 강해지고, 싸우는 중엔 🔥🛡️🧲❤️ 아이템이 떨어진다.
   나는 쓰러지지 않는다 — 학교 HP가 0이 되면 끝. 남은 학교 HP로 별 1~3개.
   예전 판(서바이버류 자동 기술 12장·진주 레벨 업·정비 상점)은 「무엇을 하는 게임인지 모르겠다」는 말을 듣고 걷어냈다.
   논리 화면 240×360. 고정 간격(FIX)으로 굴려 봇 시험에서도 결과가 같다. 객체는 미리 만든 칸(pool)을 돌려 쓴다. */
(function(){
const $d = id => document.getElementById(id);
const RM = (()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })();   // 흔들림·띠 미끄럼·파편을 줄인다
const W = 240, H = 360, SH = 120, FIX = 1 / 60, NW = 5;
const SX = 120, BY = H - 42, SR = 30, AIM = 76, PR = 44, VS = 1.3;   // 학교 가운데 · 적이 학교에 달라붙는 줄 · 화면 스틱 반지름 · 자동 조준 거리 · 아래 스틱 반지름(px)
const LS = 'lineup.share.dstg', LH = 'lineup.share.dhow', LB = 'lineup.share.dbest';

/* 바다 괴물 — bite: 학교에 닿으면 깎는 양(보스는 붙어서 초당), sh: 조개(1 미만은 확률), pt: 점수 */
const FO = {
  jelly:{ n:'해파리', hp:12, sp:30, r:6, bite:4, sh:.5, pt:10, col:'#F49AC1' },
  sj:   { n:'아기 해파리', hp:5, sp:50, r:4, bite:2, sh:0, pt:5, col:'#C9A3F2' },
  crab: { n:'꽃게', hp:10, sp:48, r:6, bite:4, sh:.5, pt:10, col:'#E8613C' },
  urch: { n:'성게', hp:24, sp:22, r:6, bite:7, sh:1, pt:20, col:'#5B3E8C', spike:1 },
  trash:{ n:'쓰레기 더미', hp:34, sp:18, r:8, bite:8, sh:1, pt:20, col:'#8A7A62', split:1 },
  bag:  { n:'비닐', hp:6, sp:40, r:5, bite:2, sh:0, pt:5, col:'#DDE6EE' },
  gull: { n:'갈매기', hp:8, sp:80, r:6, bite:5, sh:.5, pt:15, col:'#F2F5F8', fly:1 },
  puff: { n:'복어', hp:18, sp:26, r:6, bite:6, sh:1, pt:20, col:'#F2C14E', spit:1 },
  shark:{ n:'상어', hp:26, sp:28, r:7, bite:8, sh:1, pt:25, col:'#6F8AA6', chg:1 },
  hermit:{ n:'소라게', hp:30, sp:22, r:7, bite:7, sh:1, pt:25, col:'#E98A5B', shell:1 },
  elite:{ n:'대장 꽃게', hp:140, sp:24, r:12, bite:25, sh:6, pt:150, col:'#D9482B', elite:1 },
  king: { n:'대왕 해파리', hp:800, sp:9, r:16, bite:12, sh:12, pt:1000, col:'#B07FE0', boss:1, sum:'jelly', se:5 },
  jaws: { n:'백상아리', hp:950, sp:9, r:16, bite:16, sh:16, pt:1500, col:'#5C7A99', boss:1, sum:'shark', se:8 },
  storm:{ n:'폭풍 너울', hp:1100, sp:6, r:20, bite:15, sh:20, pt:2000, col:'#2C7BC0', boss:1, sum:'trash', se:8 }
};
const NM = { jelly:'해파리', crab:'꽃게', urch:'성게', trash:'쓰레기', gull:'갈매기', puff:'복어', shark:'상어', hermit:'소라게', elite:'대장 꽃게', swarm:'해파리 떼' };
/* 처음 나오는 괴물마다 한 줄 — 웨이브 띠에 뜬다(무엇을 하면 되는지를 그 자리에서) */
const TIP = {
  jelly:'바다에서 학교로 와요 — 👊 공격으로 막아요', crab:'꾹 누르면 3단 콤보 — 3타째가 제일 세요', swarm:'🪼 해파리 떼가 한쪽에서 몰려와요',
  urch:'성게 가시에 닿으면 기절 — 살짝 떨어져서 때려요', gull:'갈매기는 빨라요 — 학교 앞을 지켜요', puff:'복어 독침은 내 몸으로 막을 수 있어요',
  elite:'대장 꽃게는 단단해요 — 🌊 필살기를 써요', shark:'빨간 줄 = 상어 돌진! 💨 대시로 피해요', hermit:'소라게 껍데기는 3타째 💥로 깨요',
  trash:'쓰레기는 부수면 비닐로 갈라져요', king:'2단계부터 독침 고리 — 사이로 피하며 때려요', jaws:'빨간 줄로 돌진해요 — 💨 대시로 피해요!', storm:'빨간 줄이 뜨면 줄 밖으로 피해요!'
};
const PH = { king:['독침 고리를 쏴요', '고리가 촘촘해져요'], jaws:['상어 떼를 불러요', '돌진이 빨라져요'], storm:['너울이 두 줄로', '쓰레기가 쏟아져요'] };
/* 해변 — 웨이브 5개(5번째 = 보스). 'swarm' 은 한쪽에서 몰려오는 아기 해파리 떼 */
const STG = [
  { n:'낙산', ic:'🏖️', d:'해파리·꽃게가 몰려오는 첫 해변', hp:.85, sp:1.1, bite:1, sch:120, boss:'king', W:[
    [['jelly',10],['crab',6]], [['crab',12],['jelly',8],['swarm',10]], [['urch',4],['jelly',10],['gull',6]], [['elite',1],['crab',12],['puff',3],['jelly',6]], [['king',1],['jelly',6],['crab',6]] ] },
  { n:'죽도', ic:'🦈', d:'상어 돌진·소라게 껍데기', hp:1.05, sp:1.2, bite:1.35, sch:110, boss:'jaws', W:[
    [['crab',12],['shark',3],['jelly',6]], [['hermit',4],['jelly',12],['swarm',14]], [['puff',5],['shark',5],['crab',10]], [['elite',1],['hermit',5],['gull',8],['crab',6]], [['jaws',1],['shark',3],['crab',8]] ] },
  { n:'하조대', ic:'🌀', d:'모두 몰려오는 폭풍의 바다', hp:1.35, sp:1.45, bite:1.8, sch:100, boss:'storm', W:[
    [['shark',5],['crab',12],['puff',3]], [['trash',5],['hermit',5],['swarm',18]], [['urch',6],['gull',10],['shark',5],['jelly',8]], [['elite',2],['puff',6],['hermit',5],['crab',8]], [['storm',1],['jelly',8],['crab',8]] ] }
];
/* 웨이브 사이 강화 — 큰 그림 카드 3장 중 하나. 한 줄로 무엇이 좋아지는지만 */
const UPS = [
  { k:'atk', ic:'💪', n:'공격력 업', d:'모든 공격 피해 +25%', max:5 },
  { k:'spd', ic:'⚡', n:'빠른 손', d:'공격 속도 +20%', max:4 },
  { k:'rng', ic:'🏄', n:'긴 보드', d:'공격 범위 +20%', max:3 },
  { k:'fin', ic:'💥', n:'회오리 피니시', d:'3타째가 둘레 전체를 쳐요', max:1 },
  { k:'dash', ic:'💨', n:'번개 대시', d:'대시 쿨타임 -30% · 부딪힌 적 피해 2배', max:2 },
  { k:'sp', ic:'🌊', n:'필살기 충전', d:'필살기 게이지가 40% 빨리 차요', max:3 },
  { k:'dolph', ic:'🐬', n:'돌고래 친구', d:'내 곁을 돌며 닿는 적을 쳐요', max:3 },
  { k:'guard', ic:'🛟', n:'라이프가드', d:'학교 앞에서 가까운 적을 쏴요', max:2 },
  { k:'boot', ic:'👟', n:'빠른 발', d:'이동 속도 +15%', max:2 },
  { k:'heal', ic:'🏫', n:'학교 수리', d:'학교 HP 40% 회복', max:99 }
];
const UK = {}; UPS.forEach(u => UK[u.k] = u);
/* 싸우는 중 떨어지는 아이템 — 밟으면 바로 */
const PU = { fire:{ ic:'🔥', n:'공격력 2배', c:'#FF7A3D' }, shield:{ ic:'🛡️', n:'학교 방패', c:'#7FD3FF' }, mag:{ ic:'🧲', n:'조개 자석', c:'#FFE27A' }, heal:{ ic:'❤️', n:'학교 회복', c:'#FF6B8A' } };

/* 칸(pool) — 꺼낼 때 on=1, 다 쓰면 on=0. 가득 차면 새로 안 만든다(폰에서 60fps 유지) */
const pool = (n, mk) => { const a = []; for(let i = 0; i < n; i++) a.push(mk()); return a; };
const take = a => { for(let i = 0; i < a.length; i++) if(!a[i].on){ a[i].on = 1; return a[i]; } return null; };
const FOES = pool(130, () => ({ on:0 })), SHOTS = pool(40, () => ({ on:0 })), ESH = pool(60, () => ({ on:0 })), DROPS = pool(140, () => ({ on:0 })), PARTS = pool(300, () => ({ on:0 })), TXTS = pool(50, () => ({ on:0 }));
const ALL = [FOES, SHOTS, ESH, DROPS, PARTS, TXTS];

let rnd = Math.random;
const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

let S = null, P = null, cv, ctx, K = 2, raf = 0, last = 0, acc = 0, cur = 0, meImg = null, PS = null, SPR = {}, stick = null, botOn = 0, noRw = false, R = null;
const IN = [0, 0], KEYS = {}, BTN = { atk:0 }, TG = [];
try{ const v = +localStorage.getItem(LS); if(v >= 0 && v <= 2) cur = v; }catch(e){}

function start(stg, sd, Uo){
  if(stg != null) cur = Math.max(0, Math.min(2, stg | 0)); const G = STG[cur];
  rnd = mul(sd == null ? (Math.random() * 1e9) | 0 : sd);
  for(const a of ALL) for(const o of a) o.on = 0;
  S = { stg:cur, w:0, ph:'fight', t:0, ft:0, wt:0, q:[], qi:0, hp:G.sch, max:G.sch, lag:G.sch, lagT:0, bacc:0, shells:0, kills:0, score:0, cb:0, cbt:0, cbm:0,
        sp:0, big:-1, bigId:0, shake:0, hs:0, paused:false, res:null, ban:null, boss:null, sw:null, swc:4, nid:1, stars:0, up:{}, pick:null, pickN:0, pickT:'',
        fire:0, mag:0, wall:0, cl:0, earned:0, dashId:0, qa:0, qd:0, qs:0, hits:0, atks:0, dashes:0, sps:0, seen:{}, guards:[], ua:0, ush:0, mvd:0, flash:0, bt:0, btT:0, bd:{} };
  P = { x:SX, y:H - 100, face:1, ax:0, ay:-1, stun:0, kx:0, ky:0, mv:0, inv:0, dash:0, dcd:0, dx:0, dy:0, acd:0, cmb:2, cwin:0, sw:null, lt:0, lvx:0, lvy:0, tr:[] };
  { const U = Uo || ((!botOn && typeof upFor === 'function') ? upFor('defend') : {}) || {};   // 🔧 강화소 — 균형 시험(봇)에는 따로 넘긴 값만
    S.ua = U.atk || 0; if(U.sch) S.max = S.hp = S.lag = Math.round(G.sch * (1 + .1 * U.sch)); S.ush = U.shell || 0; S.pickN = U.free || 0; }
  BTN.atk = 0; stick = null; window._gameRun = true; padStick();
  const ov = $d('d-ov'); if(ov){ ov.hidden = true; ov.innerHTML = ''; }
  if(S.pickN > 0){ S.pickT = 'free'; openPick(); } else startWave();
  ctl();
}
const B = () => 10 * (1 + .08 * S.ua) * (1 + .25 * (S.up.atk || 0)) * (S.fire > 0 ? 2 : 1);
const reach = () => 25 * (1 + .2 * (S.up.rng || 0));
const dashCd = () => 1.3 * (1 - .3 * (S.up.dash || 0));
const spMul = () => 1 + .4 * (S.up.sp || 0);
const mult = () => 1 + Math.min(2, Math.floor(S.cb / 10) * .5);   // 콤보 10마다 ×0.5, 최대 ×3
function banner(k, t, s, d){ S.ban = { k, t, s:s || '', d:d || 1.8, tm:0 }; }
function preview(Wv){ return Wv.filter(g => g[0] !== 'swarm').map(g => `${NM[g[0]] || g[0]} ${g[1]}`).slice(0, 3).join(' · '); }

function startWave(){
  S.w++; S.ph = 'fight'; S.wt = 0; S.q.length = 0; S.qi = 0; S.pick = null;
  const Wv = STG[S.stg].W[S.w - 1], T = 12 + S.w * 3;
  for(const [k, n] of Wv){
    if(k === 'swarm'){ const t0 = 4 + T * .4; for(let i = 0; i < n; i++) S.q.push({ t:t0 + i * .1, k:'sj', ban:!i }); continue; }   // 떼 — 배너 뒤 한쪽에서 쏟아진다
    const big = FO[k].boss || FO[k].elite;
    for(let i = 0; i < n; i++) S.q.push({ t:big ? 2.2 + i * 5 : 1.5 + (i + rnd() * .8) / n * T, k }); }
  S.q.sort((a, b) => a.t - b.t);
  const bs = Wv.find(g => g[0] !== 'swarm' && FO[g[0]].boss), nw = Wv.map(g => g[0]).find(k => TIP[k] && !S.seen[k]);
  Wv.forEach(g => S.seen[g[0]] = 1);
  if(bs) banner('boss', `⚠️ 보스 · ${FO[bs[0]].n}`, TIP[bs[0]], 2.8);
  else banner('wave', `WAVE ${S.w}/${NW}`, nw ? TIP[nw] : preview(Wv), 2.4);
  sfx('wave'); barUI();
}
function spawn(k, x, y){
  const f = take(FOES); if(!f) return null; const F = FO[k], G = STG[S.stg], sc = F.boss ? G.hp : G.hp * (1 + .1 * (S.w - 1));   // 웨이브마다 10%씩 단단해진다
  f.k = k; f.id = S.nid++; f.hp = f.max = f.lag = F.hp * sc; f.lagT = 0; f.spm = G.sp * (.9 + rnd() * .2);
  f.t = 0; f.o = rnd() * 6.28; f.sl = 0; f.hit = 0; f.hst = 0; f.kx = 0; f.ky = 0; f.bite = 0; f.ph = 0; f.se = F.se || 0; f.dc = 0; f.dh = 0; f.brk = 0; f.dsh = 0; f.bw = 0;
  f.stn = 0; f.tk = 0; f.cs = 0; f.cc = 1.5 + rnd() * 2; f.cv = k === 'jaws' ? 230 : 190; f.fc = 1 + rnd(); f.sy = SH + 5 + rnd() * 35; f.bp = 1; f.ax = 0; f.ay = 1; f.cl = 0; f.ct = 0; f.tw = 0;
  f.tx = SX - 60 + rnd() * 120;   // 학교 앞 넓게 퍼져서 온다 — 한 자리에 서서는 다 못 막게
  if(x != null){ f.x = x; f.y = y; }
  else if(F.boss){ f.x = SX; f.y = 92; S.boss = f; f.cc = 3; f.fc = 3; }   // 바다 가운데서 솟아오른다
  else if(k === 'sj'){ f.x = S.side < 0 ? -6 : W + 6; f.y = 30 + rnd() * 90; }
  else if(F.fly){ f.x = rnd() < .5 ? -8 : W + 8; f.y = 50 + rnd() * 100; }
  else if(k === 'crab' && rnd() < .4){ f.x = rnd() < .5 ? -8 : W + 8; f.y = SH - 40 + rnd() * 50; }
  else { f.x = 14 + rnd() * (W - 28); f.y = -8 + rnd() * 30; }
  return f;
}

/* 한 칸 굴리기 */
function step(dt){
  if(!S || S.ph === 'done' || S.pick) return;   // 카드 고르는 동안은 세상이 멈춘다
  if(S.hs > 0){ S.hs -= dt; fx(dt * .25); return; }   // 히트스톱 — 세게 맞힌 순간 아주 잠깐 멈칫(타격감)
  S.t += dt; S.shake = Math.max(0, S.shake - dt); S.flash = Math.max(0, S.flash - dt);
  if(S.cbt > 0){ S.cbt -= dt; if(S.cbt <= 0) S.cb = 0; }
  if(S.ban){ S.ban.tm += dt; if(S.ban.tm > S.ban.d) S.ban = null; }
  if(S.fire > 0) S.fire -= dt; if(S.mag > 0) S.mag -= dt; if(S.qa > 0) S.qa -= dt;
  if(S.lagT > 0) S.lagT -= dt; else if(S.lag > S.hp) S.lag = Math.max(S.hp, S.lag - S.max * .5 * dt);
  if(S.ph === 'clear'){ S.cl -= dt; if(S.cl <= 0){ afterClear(); if(S.ph === 'done' || S.pick) return; } }
  else { S.ft += dt; S.wt += dt;
    while(S.qi < S.q.length && S.q[S.qi].t <= S.wt){ const o = S.q[S.qi++]; if(o.ban){ S.side = rnd() < .5 ? -1 : 1; banner('swarm', S.side < 0 ? '← 🪼 해파리 떼!' : '🪼 해파리 떼! →', '', 1.4); } spawn(o.k); } }
  player(dt); foes(dt); esh(dt); boss(dt); helpers(dt); bigWave(dt); drops(dt); fx(dt);
  if(S.hp <= 0){ S.hp = 0; return end(false); }
  if(S.ph === 'fight' && S.qi >= S.q.length && !alive()) waveClear();
}
const alive = () => { let n = 0; for(const f of FOES) if(f.on) n++; return n; };
function waveClear(){
  S.ph = 'clear'; S.cl = 1.8; const bonus = Math.round(S.hp / S.max * 200); S.score += bonus;
  for(const d of DROPS) if(d.on && d.ty === 0) d.fly = 1;   // 남은 조개는 알아서 날아온다
  for(const e of ESH) e.on = 0;
  banner('clear', S.w >= NW ? `🎉 ${STG[S.stg].n} 해변을 지켰어요!` : `WAVE ${S.w} 클리어!`, `🏫 학교 보너스 +${bonus}점`, 1.8);
  sfx('clear');
}
function afterClear(){ if(S.w >= NW) return end(true); S.pickN = 1; S.pickT = 'wave'; openPick(); }

/* 강화 카드 — 체력이 낮을수록 🏫 수리가 잘 나온다 */
function choices(){
  const L = UPS.filter(u => (S.up[u.k] || 0) < u.max && (u.k !== 'heal' || (S.pickT !== 'free' && S.hp < S.max * .9))), out = [];
  const wt = u => u.k === 'heal' ? (S.hp < S.max * .5 ? 6 : 2) : u.k === 'atk' || u.k === 'spd' ? 1.4 : 1;
  while(out.length < 3 && L.length){ let r = rnd() * L.reduce((a, u) => a + wt(u), 0), i = 0; for(; i < L.length - 1; i++){ r -= wt(L[i]); if(r < 0) break; } out.push(L.splice(i, 1)[0].k); }
  return out;
}
function openPick(){ S.pick = choices(); S.ph = 'pick'; BTN.atk = 0; stick = null; padStick(); barUI(); ctl(); }
function pick(i){
  if(!S || !S.pick) return false; const k = S.pick[i]; if(!k) return false;
  if(k === 'heal') S.hp = S.lag = Math.min(S.max, S.hp + S.max * .4); else S.up[k] = (S.up[k] || 0) + 1;
  if(k === 'guard') S.guards = [[SX - 50, BY - 12], [SX + 50, BY - 12]].slice(0, S.up.guard).map(([x, y]) => ({ x, y, cd:.5 }));
  S.pick = null; S.pickN--; sfx('pick');
  if(S.pickN > 0) openPick(); else startWave();
  barUI(); ctl(); return true;
}

/* 조작 — 스틱(화면 끌기·아래 왼쪽 스틱·방향키), 👊는 누르는 동안 이어서, 💨·🌊는 한 번씩 */
function input(){
  IN[0] = IN[1] = 0;
  if(botOn){ botIn(); return; }
  if(stick){ IN[0] = stick.vx; IN[1] = stick.vy; return; }
  IN[0] = (KEYS.r ? 1 : 0) - (KEYS.l ? 1 : 0); IN[1] = (KEYS.d ? 1 : 0) - (KEYS.u ? 1 : 0);
}
function player(dt){
  input(); let ix = IN[0], iy = IN[1]; const m = Math.hypot(ix, iy); if(m > 1){ ix /= m; iy /= m; }
  P.inv -= dt; P.dcd -= dt; P.acd -= dt; P.cwin -= dt;
  const free = P.stun <= 0; if(!free){ P.stun -= dt; ix = iy = 0; }
  P.mv = free && m > .08 ? 1 : 0; if(P.mv){ const l = Math.hypot(ix, iy) || 1; P.ax = ix / l; P.ay = iy / l; S.mvd += dt; }
  if(S.qd){ S.qd = 0; if(free && P.dcd <= 0 && P.dash <= 0) dash(); }
  if(S.qs){ S.qs = 0; special(); }
  if((BTN.atk || S.qa > 0) && free && P.acd <= 0 && P.dash <= 0){ S.qa = 0; swingStart(); }
  if(P.dash > 0){ P.dash -= dt; P.x += P.dx * 290 * dt; P.y += P.dy * 290 * dt; dashHits(); if(!RM){ P.tr.push(P.x, P.y); if(P.tr.length > 10) P.tr.splice(0, 2); } }
  else { if(P.tr.length) P.tr.splice(0, 2);
    const sp = 80 * (1 + .15 * (S.up.boot || 0)) * (P.sw && P.sw.t < .1 ? .45 : 1);
    P.x += ix * sp * dt; P.y += iy * sp * dt;
    if(P.lt > 0){ P.lt -= dt; P.x += P.lvx * dt; P.y += P.lvy * dt; } }
  P.x += P.kx * dt; P.y += P.ky * dt; P.kx *= .86; P.ky *= .86;
  P.x = Math.max(8, Math.min(W - 8, P.x)); P.y = Math.max(SH - 34, Math.min(H - 50, P.y));
  if(ix > .1) P.face = 1; else if(ix < -.1) P.face = -1;
  if(P.sw){ P.sw.t += dt; if(!P.sw.done && P.sw.t >= .055) resolve(); if(P.sw.t > (P.sw.fin ? .3 : .22)) P.sw = null; }
}
/* 가까운 적 n마리 — 배열을 새로 만들지 않고 TG 를 돌려 쓴다 */
function near(x, y, r, n){
  TG.length = 0; const r2 = r * r;
  for(const f of FOES){ if(!f.on || f.y < -2 || f.x < -2 || f.x > W + 2) continue; const d = (f.x - x) ** 2 + (f.y - y) ** 2; if(d >= r2) continue; f.dd = d;
    let i = TG.length; if(i >= n && d >= TG[n - 1].dd) continue; if(i < n) TG.push(f); else i = n - 1; while(i > 0 && TG[i - 1].dd > d){ TG[i] = TG[i - 1]; i--; } TG[i] = f; }
  return TG;
}
const aimT = () => near(P.x, P.y - 4, AIM, 1)[0];
/* 👊 공격 — 가까운 적을 자동으로 겨누고, 닿지 않으면 한 걸음 뛰어든다. 0·1·2타, 2타(3번째)가 피니시 */
function swingStart(){
  P.cmb = P.cwin > 0 ? (P.cmb + 1) % 3 : 0; const fin = P.cmb === 2, r = reach() * (fin ? 1.3 : 1) * (fin && S.up.fin ? 1.2 : 1), t = aimT(); let a;
  if(t){ const dx = t.x - P.x, dy = t.y - (P.y - 4), d = Math.hypot(dx, dy) || 1; a = Math.atan2(dy, dx); if(Math.abs(dx) > 3) P.face = dx > 0 ? 1 : -1;
    const want = d - FO[t.k].r - r * .55; if(want > 0){ const v = Math.min(300, want / .09); P.lt = .09; P.lvx = dx / d * v; P.lvy = dy / d * v; } }
  else a = P.mv ? Math.atan2(P.ay, P.ax) : -Math.PI / 2 + P.face * .5;   // 적이 없으면 보는 쪽으로 헛스윙
  P.sw = { t:0, a, r, arc:fin ? 3.4 : 2.3, fin, done:0, tg:t ? t.id : 0, s:P.cmb === 1 ? -1 : 1 };
  const sm = 1 + .2 * (S.up.spd || 0); P.acd = (fin ? .4 : .24) / sm; P.cwin = P.acd + .5;
  S.atks++; sfx(fin ? 'fin' : 'swing');
}
function resolve(){
  const w = P.sw; w.done = 1; let tf = null; if(w.tg) for(const f of FOES) if(f.on && f.id === w.tg){ tf = f; break; }
  if(tf) w.a = Math.atan2(tf.y - (P.y - 4), tf.x - P.x);
  const ax = Math.cos(w.a), ay = Math.sin(w.a), full = w.fin && S.up.fin, dm = B() * (w.fin ? 2.2 : P.cmb ? 1.15 : 1), ca = Math.cos(w.arc / 2);
  let n = 0;
  for(const f of FOES){ if(!f.on) continue; const R0 = FO[f.k].r, dx = f.x - P.x, dy = f.y - (P.y - 4), d = Math.hypot(dx, dy) || 1;
    if(d > w.r + R0) continue; if(!full && d > R0 + 5 && (dx * ax + dy * ay) / d < ca) continue;
    hurt(f, dm, rnd() < .08, dx, dy, w.fin ? 2 : 1); n++; }
  if(full) ring(P.x, P.y - 4, w.r, '#FFE27A');
  if(n){ S.hs = Math.max(S.hs, w.fin ? .075 : .03); if(w.fin && !RM) S.shake = Math.max(S.shake, .16); sfx(w.fin ? 'hitb' : 'hit'); if(w.fin) buzz(15); }
}
/* 💨 대시 — 움직이는 쪽(없으면 가까운 적 쪽)으로 휙. 0.32초 무적, 부딪힌 적은 튕겨 난다 */
function dash(){
  let dx = IN[0], dy = IN[1], m = Math.hypot(dx, dy);
  if(m < .2){ const t = aimT(); if(t){ dx = t.x - P.x; dy = t.y - P.y; } else { dx = P.face; dy = 0; } m = Math.hypot(dx, dy) || 1; }
  P.dx = dx / m; P.dy = dy / m; P.dash = .16; P.inv = .34; P.dcd = dashCd(); P.stun = 0; S.dashId++; S.dashes++; P.sw = null; P.lt = 0;
  if(Math.abs(P.dx) > .1) P.face = P.dx > 0 ? 1 : -1; sfx('dash');
}
function dashHits(){
  for(const f of FOES){ if(!f.on || f.dsh === S.dashId) continue; const r = FO[f.k].r + 8; if((f.x - P.x) ** 2 + (f.y - P.y + 4) ** 2 < r * r){ f.dsh = S.dashId; hurt(f, B() * .6 * (S.up.dash ? 2 : 1), false, -P.dy || f.x - P.x, P.dx || f.y - P.y, 3); } }
}
/* 🌊 필살기 — 학교에서 바다 쪽으로 큰 파도가 화면을 쓸고 간다. 보스는 체력 일부 + 뒤로 밀림 */
function special(){
  if(!S || S.ph !== 'fight' || S.sp < 100 || S.big >= 0) return false;
  S.sp = 0; S.big = 0; S.bigId++; S.sps++; S.hs = .12; S.flash = .25; if(!RM) S.shake = .45; P.inv = Math.max(P.inv, 1.2);
  for(const e of ESH) if(e.on){ e.on = 0; burst(e.x, e.y, '#E9D8FF', 2); }
  txt(SX, 170, '🌊 필살기!', 9); sfx('sp'); buzz([30, 40, 60]); return true;
}
function bigWave(dt){
  if(S.big < 0) return; S.big += dt; const fy = H - S.big / 1.1 * (H + 90);
  for(const f of FOES){ if(!f.on || f.bw === S.bigId || f.y < fy) continue; f.bw = S.bigId; const F = FO[f.k];
    if(F.boss){ hurt(f, B() * 4 + f.max * .07, false, 0, -1, 4); f.y = Math.max(92, f.y - 40); }
    else { hurt(f, B() * 6, false, 0, -1, 4); if(f.on){ f.ky = -170; f.stn = Math.max(f.stn, .9); } } }
  if(S.big > 1.1) S.big = -1;
}
function hurt(f, dmg, cr, dx, dy, kd){
  const F = FO[f.k]; if(cr) dmg *= 1.8;
  if(F.shell && !f.brk){   // 소라게 — 3타째(피니시)·필살기로 껍데기를 깨기 전엔 거의 안 들어간다
    if(kd === 2 || kd === 4){ f.brk = 1; txt(f.x, f.y - F.r - 10, '껍데기 깨짐!', 2); burst(f.x, f.y, '#FFF3E0', 10); }
    else { dmg *= .25; cr = false; if(f.tk <= 0){ f.tk = .35; txt(f.x, f.y - F.r - 4, '팅! 3타째로', 6); } } }
  f.hp -= dmg; f.hit = .1; if(!F.boss) f.hst = Math.max(f.hst, kd === 2 ? .3 : kd === 5 ? .05 : .15);
  const kb = F.boss ? (kd === 2 ? 4 : 0) : F.elite ? (kd === 2 ? 60 : 20) : kd === 2 ? 190 : kd === 3 ? 150 : kd === 5 ? 30 : kd === 4 ? 0 : 70;
  if(kb && (dx || dy)){ const m = Math.hypot(dx, dy) || 1; if(F.boss) f.y = Math.max(92, f.y - kb); else { f.kx += dx / m * kb; f.ky += dy / m * kb; } }
  if(F.boss || F.elite){ if(f.lagT <= 0 && f.lag - f.hp < 1) f.lagT = .45; }
  if(dmg >= 1) txt(f.x + (rnd() - .5) * 6, f.y - F.r - 4, Math.round(dmg), cr || kd === 2 || kd === 4 ? 2 : kd === 5 ? 6 : 1);
  if(!RM && kd !== 5){ const m = Math.hypot(dx, dy) || 1; for(let i = 0; i < (kd === 2 ? 6 : 3); i++) part(f.x, f.y, i % 2 ? '#FFFFFF' : '#FFE27A', dx / m * 70 + (rnd() - .5) * 60, dy / m * 70 + (rnd() - .5) * 60, .22, 1.6); }
  if(kd <= 4){ S.cb++; S.cbt = 2.2; if(S.cb > S.cbm) S.cbm = S.cb; S.hits++; if(kd !== 4) S.sp = Math.min(100, S.sp + 2.6 * spMul()); }
  if(f.hp <= 0) kill(f);
}
function kill(f){
  if(!f.on) return; f.on = 0; S.kills++; const F = FO[f.k], big = F.boss || F.elite;
  const pts = Math.round(F.pt * mult()); S.score += pts; if(big || mult() > 1) txt(f.x, f.y - F.r - 14, '+' + pts, 7);
  burst(f.x, f.y, F.col, F.boss ? 34 : big ? 18 : 9); ring(f.x, f.y, F.r * 2.6, '#FFFFFF');
  if(S.big < 0) S.sp = Math.min(100, S.sp + (big ? 12 : 3) * spMul());
  const n = F.sh >= 1 ? F.sh : rnd() < F.sh ? 1 : 0; for(let i = 0; i < n; i++) drop(f.x + (rnd() - .5) * (big ? 30 : 8), f.y + (rnd() - .5) * (big ? 22 : 8), 0);
  if(F.elite || (F.boss && S.w < NW) || (!F.boss && rnd() < .05 && pups() < 2)) dropPU(f.x, f.y);
  if(F.split){ spawn('bag', f.x - 6, f.y); spawn('bag', f.x + 6, f.y); }
  sfx(big ? 'boom' : 'kill');
  if(f === S.boss){ S.boss = null; S.sw = null; S.hs = .3; if(!RM) S.shake = .55; S.flash = .3; for(const e of ESH) e.on = 0;
    for(const g of FOES) if(g.on) kill(g);   // 보스가 쓰러지면 졸개도 함께 — 시원하게 끝낸다
    banner('clear', `🎉 ${F.n} 격파!`, '', 1.6); buzz([40, 60, 80]); }
}
function hurtSchool(d, x){
  if(S.wall > 0){ const a = Math.min(S.wall, d); S.wall -= a; d -= a; if(x != null && a > 0) txt(x, BY - 6, '🛡️', 5); } if(d <= 0) return;
  S.hp -= d; if(S.lagT <= 0 && S.lag - S.hp < .5) S.lagT = .5;
  if(x != null){ txt(x, BY - 4, '-' + Math.round(d), 4); if(!RM) S.shake = Math.max(S.shake, .15); sfx('ouch'); return; }
  S.bacc += d; if(S.bacc > 4){ S.bacc = 0; if(!RM) S.shake = Math.max(S.shake, .15); txt(SX + (rnd() - .5) * 40, BY + 2, '-4', 4); sfx('ouch'); }
}
function stunP(t, kx, ky, msg){ if(P.inv > 0 || P.dash > 0) return false; P.stun = t; P.kx = kx; P.ky = ky; P.inv = t + .5; P.sw = null; if(!RM) S.shake = Math.max(S.shake, .2); txt(P.x, P.y - 22, msg, 3); sfx('ouch'); return true; }
function needle(x, y, tx, ty, v, dmg, st){ const e = take(ESH); if(!e) return; const dx = tx - x, dy = ty - y, m = Math.hypot(dx, dy) || 1; e.x = x; e.y = y; e.vx = dx / m * v; e.vy = dy / m * v; e.dmg = dmg; e.st = st; e.t = 0; }
function foes(dt){
  let bite = 0; const G = STG[S.stg];
  for(const f of FOES){ if(!f.on) continue;
    const F = FO[f.k]; f.t += dt; f.hit = Math.max(0, f.hit - dt); f.dc -= dt; f.sl -= dt; f.tk -= dt;
    if(f.lagT > 0) f.lagT -= dt; else if(f.lag > f.hp) f.lag = Math.max(f.hp, f.lag - f.max * .4 * dt);
    if(f.stn > 0 || f.hst > 0){ f.stn -= dt; f.hst -= dt; f.x += f.kx * dt; f.y += f.ky * dt; f.kx *= .86; f.ky *= .86; f.y = Math.min(BY, f.y); f.cs = f.cs === 1 ? 0 : f.cs; continue; }   // 맞고 휘청·기절 — 움직이지도 물지도 않는다
    const sp = F.sp * f.spm;
    if(f.cs === 1){ f.ct -= dt; if(f.ct <= 0){ f.cs = 2; f.ct = f.cl / f.cv; f.dh = 0; } }   // 돌진 예고(빨간 줄) — 이때는 멈춰 있다
    else if(f.cs === 2){ f.x += f.ax * f.cv * dt; f.y += f.ay * f.cv * dt; f.ct -= dt;
      if(!f.dh && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (F.r + 7) ** 2){ f.dh = 1; stunP(F.boss ? .8 : .5, f.ax * 170, f.ay * 170, '쿵!'); }
      if(f.ct <= 0 || f.y >= BY){ f.cs = 0; f.cc = F.boss ? (f.bp === 3 ? 2.2 : f.bp === 2 ? 3 : 4) : 2.6 + rnd() * 1.4; } }
    else if(f.bite){ bite += F.bite; }
    else if(F.boss){ f.x += (SX + Math.sin(f.t * .45) * 70 - f.x) * dt;
      if(f.k === 'jaws'){ const ty = Math.min(BY, 92 + f.t * 4); f.y += Math.max(-40 * dt, Math.min(sp * dt, ty - f.y)); }   // 백상아리는 돌진 뒤 바다 쪽으로 돌아간다
      else if(f.y < BY) f.y += sp * dt; }
    else if(F.fly){
      if(f.ph < 1.1){ f.ph += dt; f.x += (f.x < W / 2 ? 1 : -1) * 34 * dt; f.y += Math.sin(f.t * 5) * 12 * dt; }
      else { const dx = f.tx - f.x, dy = BY - f.y, m = Math.hypot(dx, dy) || 1; f.x += dx / m * sp * dt; f.y += dy / m * sp * dt; } }
    else if(F.spit && f.y >= f.sy){ f.x += ((f.tx - f.x) * .3 + Math.sin(f.t * 1.3 + f.o) * 10) * dt; f.fc -= dt;   // 복어 — 물가에 멈춰 학교로 독침. 내 몸으로 막을 수 있다
      if(f.fc <= 0){ f.fc = 2.8; needle(f.x, f.y + 4, SX + (rnd() - .5) * 60, BY, 70, 4 * G.bite, 0); } }
    else if(f.k === 'crab' || f.k === 'elite'){ f.x += ((f.tx - f.x) * .25 + Math.sin(f.t * 2.6 + f.o) * sp * (f.k === 'elite' ? .5 : .9)) * dt; f.y += sp * .55 * dt; }
    else { const dx = f.tx - f.x, dy = BY - f.y, m = Math.hypot(dx, dy) || 1; f.x += (dx / m * sp + (f.k === 'jelly' || f.k === 'sj' ? Math.sin(f.t * 2 + f.o) * 8 : 0)) * dt; f.y += dy / m * sp * dt; }
    if(F.chg && !f.cs && !f.bite){ f.cc -= dt;   // 상어 — 가까이 온 나를 향해 돌진(빨간 줄 예고). 멀면 그냥 헤엄쳐 온다
      if(f.cc <= 0 && f.y > 8){ const m = Math.hypot(P.x - f.x, P.y - f.y) || 1; if(m > 110){ f.cc = .5; } else {
        f.ax = (P.x - f.x) / m; f.ay = (P.y - f.y) / m; f.cl = Math.min(170, m + 30); f.cs = 1; f.ct = .8; } } }
    f.x += f.kx * dt; f.y += f.ky * dt; f.kx *= .88; f.ky *= .88;
    f.x = Math.max(-10, Math.min(W + 10, f.x));
    if(f.y >= BY){ f.y = BY;   // 학교에 닿으면 — 졸개는 부딪혀 사라지며 한 번에 깎고, 보스는 붙어서 계속 문다
      if(F.boss){ f.bite = 1; } else { f.on = 0; hurtSchool(F.bite * G.bite, f.x); burst(f.x, BY, '#FF6B6B', 6); continue; } } else if(f.bite && f.y < BY - 3) f.bite = 0;
    if(F.spike){ const r = F.r + 6, dx = P.x - f.x, dy = P.y - f.y;   // 성게 가시 — 부딪히면 기절하고 튕겨 난다
      if(dx * dx + dy * dy < r * r){ const m = Math.hypot(dx, dy) || 1; stunP(.6, dx / m * 160, dy / m * 160, '따끔!'); } }
  }
  if(bite) hurtSchool(bite * G.bite * dt);
}
function esh(dt){
  for(const e of ESH){ if(!e.on) continue; e.x += e.vx * dt; e.y += e.vy * dt; e.t += dt;
    if((e.x - P.x) ** 2 + (e.y - P.y + 6) ** 2 < 80){ e.on = 0; burst(e.x, e.y, '#E9D8FF', 3);
      if(!e.st) txt(P.x, P.y - 22, '막음!', 5); else stunP(e.st, 0, 0, '따끔!'); continue; }
    if(e.y >= BY - 2 && Math.abs(e.x - SX) < 70){ e.on = 0; hurtSchool(e.dmg, e.x); continue; }
    if(e.x < -10 || e.x > W + 10 || e.y < -20 || e.y > H || e.t > 7) e.on = 0; }
}
function boss(dt){
  const b = S.boss; if(!b) return; if(!b.on){ S.boss = null; return; }
  const F = FO[b.k], G = STG[S.stg], ph = b.hp > b.max * .66 ? 1 : b.hp > b.max * .33 ? 2 : 3;
  if(ph > b.bp){ b.bp = ph; banner('phase', `${F.n} ${ph}단계!`, PH[b.k][ph - 2], 1.4); if(!RM) S.shake = .3; S.hs = .1; }
  b.se -= dt; if(b.se <= 0){ b.se = F.se * (ph === 3 ? .6 : ph === 2 ? .8 : 1); const n = ph === 3 && b.k !== 'jaws' ? 4 : b.k === 'jaws' ? (ph > 1 ? 2 : 1) : 3; for(let i = 0; i < n; i++) spawn(F.sum, b.x + (i - (n - 1) / 2) * 18, b.y + 12); }
  if(b.k === 'king'){ if(ph >= 2){ b.fc -= dt; b.tw = b.fc < .7 ? 1 : 0;   // 쏘기 0.7초 전부터 분홍 고리로 예고
      if(b.fc <= 0){ b.fc = ph === 3 ? 2.6 : 3.6; const n = ph === 3 ? 14 : 10; for(let i = 0; i < n; i++){ const a = i / n * 6.283 + b.t; needle(b.x, b.y, b.x + Math.cos(a), b.y + Math.sin(a), 60, 3 * G.bite, .35); } } } return; }
  if(b.k === 'jaws'){ if(!b.cs){ b.cc -= dt; if(b.cc <= 0 && b.y < BY - 30){ const m = Math.hypot(P.x - b.x, P.y - b.y) || 1; b.ax = (P.x - b.x) / m; b.ay = (P.y - b.y) / m; b.cl = Math.min(260, m + 40); b.cs = 1; b.ct = ph === 3 ? .7 : 1; } } return; }
  // 폭풍 너울 — 빨간 줄로 예고한 뒤 가로 파도가 화면을 쓸고 간다. 2단계부터 두 줄
  if(!S.sw){ S.swc -= dt; if(S.swc <= 0){ const y1 = Math.max(SH, Math.min(H - 64, P.y)); S.sw = { ys:ph > 1 ? [y1, y1 < 200 ? y1 + 70 : y1 - 70] : [y1], t:0, warn:ph > 1 ? .9 : 1.2, x:-40, dir:rnd() < .5 ? 1 : -1, hit:0 }; S.swc = ph === 3 ? 2.8 : ph === 2 ? 3.6 : 5.5; } return; }
  const s = S.sw; s.t += dt; if(s.t < s.warn) return;
  const k = (s.t - s.warn) / .75; s.x = s.dir > 0 ? -40 + k * (W + 80) : W + 40 - k * (W + 80);
  if(!s.hit) for(const y of s.ys) if(Math.abs(P.y - y) < 13 && Math.abs(P.x - s.x) < 18 && stunP(1, 0, -120, '꽈당!')) s.hit = 1;
  if(k >= 1) S.sw = null;
}
/* 돌고래 친구 · 라이프가드 */
function helpers(dt){
  const nD = S.up.dolph || 0;
  for(let i = 0; i < nD; i++){ const a = S.t * 3.6 + i * 6.283 / nD, x = P.x + Math.cos(a) * 28, y = P.y - 4 + Math.sin(a) * 21;
    for(const f of FOES){ if(!f.on || f.dc > 0) continue; const r = FO[f.k].r + 6; if((f.x - x) ** 2 + (f.y - y) ** 2 < r * r){ f.dc = .45; hurt(f, B() * .5, false, f.x - P.x, f.y - P.y, 5); } } }
  for(const g of S.guards){ g.cd -= dt; if(g.cd <= 0){ const t = near(g.x, g.y, 96, 1)[0]; if(t){ g.cd = .7; const s = take(SHOTS); if(s){ const m = Math.hypot(t.x - g.x, t.y - g.y + 8) || 1; s.x = g.x; s.y = g.y - 8; s.vx = (t.x - g.x) / m * 220; s.vy = (t.y - g.y + 8) / m * 220; s.t = .6; } } else g.cd = .1; } }
  for(const s of SHOTS){ if(!s.on) continue; s.t -= dt; if(s.t <= 0){ s.on = 0; continue; } s.x += s.vx * dt; s.y += s.vy * dt;
    for(const f of FOES){ if(!f.on) continue; const r = FO[f.k].r + 2; if((f.x - s.x) ** 2 + (f.y - s.y) ** 2 < r * r){ s.on = 0; hurt(f, B() * .6, false, s.vx, s.vy, 5); break; } } }
}
/* 줍기 — ty 0 조개(10초 뒤 사라짐), 2 아이템(밟으면 바로) */
const pups = () => { let n = 0; for(const d of DROPS) if(d.on && d.ty === 2) n++; return n; };
function drop(x, y, ty){ const d = take(DROPS); if(!d){ if(!ty) S.shells++; return null; }
  d.ty = ty; d.pk = ''; d.x = Math.max(8, Math.min(W - 8, x)); d.y = Math.max(SH - 20, Math.min(H - 52, y)); d.t = 0; d.fly = 0; return d; }
function dropPU(x, y){ const k = S.hp < S.max * .5 && rnd() < .5 ? 'heal' : ['fire', 'shield', 'mag', 'heal'][(rnd() * 4) | 0]; const d = drop(x, y, 2); if(d) d.pk = k; }
function drops(dt){
  const mr = S.mag > 0 ? 500 : 24;
  for(const d of DROPS){ if(!d.on) continue; d.t += dt;
    const dx = P.x - d.x, dy = P.y - 4 - d.y, q = dx * dx + dy * dy;
    if(d.ty === 2){ if(q < 15 * 15){ d.on = 0; power(d.pk); } else if(d.t > 12) d.on = 0; continue; }
    if(!d.fly){ if(q < mr * mr) d.fly = 1; else if(d.t > 10) d.on = 0; continue; }
    const m = Math.sqrt(q) || 1, v = 130 + d.t * 70; d.x += dx / m * v * dt; d.y += dy / m * v * dt;
    if(m < 7){ d.on = 0; S.shells++; if(!RM) part(P.x, P.y - 6, '#FFE27A', (rnd() - .5) * 40, -30, .35, 2); } }
}
function power(k){
  if(k === 'fire') S.fire = 10; else if(k === 'shield') S.wall = Math.max(S.wall, 45); else if(k === 'mag') S.mag = 8; else S.hp = S.lag = Math.min(S.max, S.hp + S.max * .25);
  txt(P.x, P.y - 30, `${PU[k].ic} ${PU[k].n}!`, 8); ring(P.x, P.y - 4, 26, PU[k].c); sfx('pu');
}
function end(win){
  S.ph = 'done'; S.res = win ? 'win' : 'lose'; S.pick = null; window._gameRun = false; stick = null; BTN.atk = 0; padStick();
  const r = S.hp / S.max; S.stars = win ? (r >= .7 ? 3 : r >= .35 ? 2 : 1) : 0;
  S.cw = win ? NW : S.w - 1;
  if(win) S.score += 500 * (S.stg + 1) + S.stars * 200;
  S.earned = Math.min(60, S.shells + S.cw * 2 + (win ? 5 : 0) + S.ush * 3);
  const bs = bests(); S.best = bs[S.stg] || 0; S.newBest = S.score > S.best && S.score > 0;
  R = null;
  if(!noRw){ if(S.newBest){ bs[S.stg] = S.score; try{ localStorage.setItem(LB, JSON.stringify(bs)); }catch(e){} }
    try{ if(typeof playDefendDone === 'function') R = playDefendDone(S.stg * NW + S.cw, win, S.earned, S.stg, S.stars) || null; }catch(e){} }   // 웨이브는 해변을 이어 센다(낙산 5 · 죽도 10 · 하조대 15)
  sfx(win ? 'win' : 'lose'); barUI(); ctl(); if(!botOn) over();
}
function bests(){ try{ const a = JSON.parse(localStorage.getItem(LB) || '[]'); return [0, 1, 2].map(i => { const v = Math.floor(+(Array.isArray(a) ? a[i] : 0)); return Number.isFinite(v) ? Math.max(0, Math.min(9999999, v)) : 0; }); }catch(e){ return [0, 0, 0]; } }

/* 효과 — 파편·고리·숫자 */
function part(x, y, c, vx, vy, life, s){ const p = take(PARTS); if(!p) return; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.t = 0; p.l = life; p.c = c; p.s = s; p.rg = 0; }
function ring(x, y, r, c){ if(RM) return; const p = take(PARTS); if(!p) return; p.x = x; p.y = y; p.vx = p.vy = 0; p.t = 0; p.l = .3; p.c = c; p.s = 1; p.rg = r; }
function burst(x, y, c, n){ if(RM) n = Math.min(n, 4); for(let i = 0; i < n; i++){ const a = rnd() * 6.28, v = 30 + rnd() * 70; part(x, y, i % 3 ? c : '#FFFFFF', Math.cos(a) * v, Math.sin(a) * v, .35 + rnd() * .25, 1.6 + rnd() * 1.6); } }
function txt(x, y, v, k){ const t = take(TXTS); if(!t) return; t.x = x; t.y = y; t.v = v; t.k = k; t.t = 0; t.l = k >= 8 ? 1.1 : .7; }
function fx(dt){
  for(const p of PARTS){ if(!p.on) continue; p.t += dt; if(p.t > p.l){ p.on = 0; continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .92; p.vy *= .92; }
  for(const t of TXTS){ if(!t.on) continue; t.t += dt; if(t.t > t.l){ t.on = 0; continue; } t.y -= (t.k >= 8 ? 10 : 22) * dt; }
}

/* 소리 — 놀이 탭 「🔊 게임 소리」가 켜져 있을 때만. 같은 소리는 45ms 안에 겹치지 않게 */
let AC = null; const sndT = {};
const sndOn = () => { try{ return typeof soundOn === 'function' ? soundOn() : localStorage.getItem('lineup.share.snd') === '1'; }catch(e){ return false; } };
const SFX = { swing:[520, 300, .05, .02], fin:[420, 160, .09, .03], hit:[230, 110, .07, .045, 'square'], hitb:[170, 55, .15, .07, 'square'], kill:[700, 1050, .07, .035], boom:[130, 40, .35, .08, 'sawtooth'],
  dash:[300, 900, .09, .035], sp:[110, 760, .5, .08, 'sawtooth'], pu:[660, 1320, .15, .05], ouch:[120, 80, .12, .045, 'square'], wave:[440, 880, .18, .04], clear:[523, 1046, .25, .05], pick:[600, 900, .08, .04], win:[523, 1568, .6, .06], lose:[300, 90, .6, .06] };
function sfx(k){ if(botOn || !sndOn()) return; const now = performance.now(); if(now - (sndT[k] || 0) < 45) return; sndT[k] = now; const [f0, f1, dur, vol, ty] = SFX[k];
  try{ AC ||= new (window.AudioContext || window.webkitAudioContext)(); if(AC.state === 'suspended') AC.resume(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = ty || 'triangle'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + .02); }catch(e){} }
function buzz(p){ if(botOn) return; try{ if(typeof hapticOn === 'function' && !hapticOn()) return; if(typeof vib === 'function') vib(p); }catch(e){} }

/* 시험·균형용 봇 — 2가지. good: 학교에 가장 위험한 적을 노리고, 빨간 줄은 대시로 피하고, 필살기를 아껴 쓴다.
   casual(가볍게 하는 사람 흉내): 0.7초마다만 목표를 바꾸고, 가까울 때만 누르고, 빨간 줄은 4번에 1번만 피하고, 게이지가 차면 바로 쓴다 */
function botIn(){
  const cas = botOn === 2; let b = null;
  if(cas){ S.btT -= FIX; for(const f of FOES) if(f.on && f.id === S.bt){ b = f; break; }
    if(!b || S.btT <= 0){ S.btT = .9; S.brest = rnd() < .25; S.bnx = (rnd() - .5) * .8; S.bny = (rnd() - .5) * .8; let bs = 1e9; b = null;   // 사람처럼 — 내 가까이 있는 적부터, 가끔 손을 쉰다
      for(const f of FOES){ if(!f.on || f.x < 0 || f.x > W || f.y < 4) continue; const dd = Math.hypot(f.x - P.x, f.y - P.y) - f.y * .15; if(dd < bs){ bs = dd; b = f; } } S.bt = b ? b.id : 0; } }
  else { let bs = -1e9; for(const f of FOES){ if(!f.on || f.x < -4 || f.x > W + 4 || f.y < -2) continue; const F = FO[f.k]; const sc = f.y + (f.bite ? 140 : 0) + (F.elite ? 30 : 0) - Math.hypot(f.x - P.x, f.y - P.y) * .35 - (F.boss && alive() > 3 ? 60 : 0); if(sc > bs){ bs = sc; b = f; } } }
  let tx = P.x, ty = Math.min(H - 60, P.y);
  if(b){ const F = FO[b.k]; tx = b.x; ty = Math.min(H - 50, b.y + F.r + (F.spike ? 22 : 14)); }
  else { tx = SX; ty = BY - 70; }
  let dx = tx - P.x, dy = ty - P.y; const d = Math.hypot(dx, dy);
  if(d > 5){ IN[0] = dx / d * (cas ? .8 : 1) + (cas ? S.bnx : 0); IN[1] = dy / d * (cas ? .8 : 1) + (cas ? S.bny : 0); }
  BTN.atk = b && Math.hypot(b.x - P.x, b.y - P.y) < (cas ? 32 : AIM * .8) && !(cas && S.brest) ? 1 : 0;
  // 빨간 줄 피하기
  let thr = null; for(const f of FOES){ if(!f.on || f.cs !== 1) continue; const px = P.x - f.x, py = P.y - f.y, along = px * f.ax + py * f.ay, perp = Math.abs(px * f.ay - py * f.ax); if(along > -10 && along < f.cl + 10 && perp < FO[f.k].r + 12){ thr = f; break; } }
  if(thr){ const k = 'c' + thr.id + '_' + Math.round(thr.cc * 10); if(S.bd[k] == null) S.bd[k] = cas ? rnd() < .15 : true;
    if(S.bd[k]){ const s = (P.x - thr.x) * thr.ay - (P.y - thr.y) * thr.ax >= 0 ? 1 : -1; IN[0] = thr.ay * s; IN[1] = -thr.ax * s; if(P.dcd <= 0 && thr.ct < .45) S.qd = 1; } }
  if(S.sw && S.sw.t < S.sw.warn + .2){ for(const y of S.sw.ys) if(Math.abs(P.y - y) < 18){ const k = 's' + Math.round(S.t); if(S.bd[k] == null) S.bd[k] = cas ? rnd() < .4 : true; if(S.bd[k]){ IN[0] = 0; IN[1] = P.y > y ? 1 : -1; if(!cas && P.dcd <= 0 && S.sw.t > S.sw.warn - .3) S.qd = 1; } } }
  if(!cas) for(const f of FOES) if(f.on && FO[f.k].spike){ const ex = P.x - f.x, ey = P.y - f.y, m = Math.hypot(ex, ey); if(m < 16){ IN[0] = ex / (m || 1); IN[1] = ey / (m || 1); } }
  if(S.sp >= 100 && (cas || alive() >= 7 || S.boss || S.hp < S.max * .4)) S.qs = 1;
}
const BOTP = ['atk', 'spd', 'fin', 'rng', 'sp', 'dolph', 'guard', 'dash', 'boot'];
function botPick(){ if(botOn === 2) return pick(0); const o = S.pick; if(o.includes('heal') && S.hp < S.max * .55) return pick(o.indexOf('heal')); for(const k of BOTP){ const i = o.indexOf(k); if(i >= 0) return pick(i); } pick(0); }

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

/* 화면에 보이는 코치 한 줄 — 처음 하는 사람이 지금 무엇을 누르면 되는지(누른 적이 없을 때만) */
function coach(){
  if(!S || S.ph !== 'fight' || S.pick || S.paused) return '';
  if(S.atks === 0 && S.wt > 1.5 && aimT()) return 'atk';
  if(S.sp >= 100 && S.sps === 0) return 'sp';
  if(S.dashes === 0) for(const f of FOES) if(f.on && f.cs === 1) return 'dash';
  if(S.mvd < .3 && S.t > 2.5 && S.w === 1) return 'mv';
  return '';
}
const CO = { atk:'👊 공격 버튼을 눌러요', sp:'🌊 필살기 준비 완료!', dash:'💨 대시로 피해요!', mv:'🕹️ 스틱으로 움직여요' };

function draw(){
  const c = ctx; if(!c) return; const t = S ? S.t : performance.now() / 1000;
  c.setTransform(K, 0, 0, K, 0, 0); c.save();
  if(S && S.shake > 0 && !RM){ const a = Math.min(1, S.shake * 5) * 3.2; c.translate((Math.random() - .5) * a, (Math.random() - .5) * a); }
  const map = window.scenery && scenery.shore(W, H, SH);
  if(map) c.drawImage(map, -4, -4, W + 8, H + 8);
  else { c.fillStyle = '#17679F'; c.fillRect(-4, -4, W + 8, SH + 4); c.fillStyle = '#F2DDA6'; c.fillRect(-4, SH, W + 8, H - SH + 4); }
  const sg = S ? S.stg : cur;
  if(sg === 2){ c.fillStyle = 'rgba(20,30,60,.22)'; c.fillRect(-4, -4, W + 8, H + 8); } else if(sg === 1){ c.fillStyle = 'rgba(255,170,90,.1)'; c.fillRect(-4, -4, W + 8, H + 8); }   // 해변마다 하늘빛이 다르다
  if(!RM){ c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1; for(let i = 0; i < 6; i++){ const y = (i * 22 + t * 9) % (SH - 10) + 4, o = Math.sin(i * 2.1) * 40; c.beginPath(); c.moveTo(o + 20, y); c.quadraticCurveTo(o + 60, y - 3, o + 100, y); c.moveTo(o + 140, y + 6); c.quadraticCurveTo(o + 170, y + 3, o + 200, y + 6); c.stroke(); } }
  const fy = SH + (RM ? 0 : Math.sin(t * .9) * 3);
  c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.moveTo(-4, fy - 2); for(let x = -4; x <= W + 4; x += 6) c.lineTo(x, fy + Math.sin(x / 13 + (RM ? 0 : t * 1.6)) * 2.2); c.lineTo(W + 4, fy + 5); c.lineTo(-4, fy + 5); c.fill();
  c.fillStyle = 'rgba(99,207,214,.25)'; c.fillRect(-4, fy + 5, W + 8, 5);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const sn = `🏫 ${STG[sg].n} 서핑학교`; c.font = 'bold 7.5px sans-serif'; const sw = c.measureText(sn).width + 12;
  c.fillStyle = '#FF8A3D'; rr(c, SX - sw / 2, H - 30, sw, 12, 3); c.fill(); c.fillStyle = '#fff'; c.fillText(sn, SX, H - 23.8);
  if(!S){ c.restore(); return; }
  // 학교 방패
  if(S.wall > 0){ const a = Math.min(1, S.wall / 45); c.fillStyle = `rgba(127,211,255,${.12 + .1 * a})`; c.strokeStyle = `rgba(160,225,255,${.5 + .4 * a})`; c.lineWidth = 1.5; c.beginPath(); c.ellipse(SX, H - 8, 70, 42, 0, Math.PI, 0); c.fill(); c.stroke(); }
  // 폭풍 너울 예고 줄 / 쓸고 가는 파도
  if(S.sw){ const s = S.sw;
    for(const y of s.ys){ if(s.t < s.warn){ const a = RM ? .25 : .18 + .14 * Math.sin(s.t * 22); c.fillStyle = `rgba(255,60,60,${a})`; c.fillRect(0, y - 13, W, 26); c.strokeStyle = 'rgba(255,70,70,.85)'; c.setLineDash([5, 4]); c.lineWidth = 1; c.beginPath(); c.moveTo(0, y - 13); c.lineTo(W, y - 13); c.moveTo(0, y + 13); c.lineTo(W, y + 13); c.stroke(); c.setLineDash([]); c.fillStyle = '#FF4646'; c.font = 'bold 12px sans-serif'; c.fillText('!', s.dir > 0 ? 10 : W - 10, y + 1); }
      else { const x0 = s.dir > 0 ? -40 : s.x, x1 = s.dir > 0 ? s.x : W + 40; c.fillStyle = 'rgba(120,200,240,.35)'; c.fillRect(x0, y - 12, x1 - x0, 24);
        const g = c.createLinearGradient(s.x - 20 * s.dir, 0, s.x + 6 * s.dir, 0); g.addColorStop(0, 'rgba(44,123,192,.0)'); g.addColorStop(.6, '#3D9BE0'); g.addColorStop(1, '#FFFFFF'); c.fillStyle = g;
        c.beginPath(); c.moveTo(s.x - 26 * s.dir, y + 13); c.quadraticCurveTo(s.x - 4 * s.dir, y + 10, s.x + 6 * s.dir, y - 2); c.quadraticCurveTo(s.x + 2 * s.dir, y - 15, s.x - 12 * s.dir, y - 14); c.lineTo(s.x - 26 * s.dir, y - 13); c.closePath(); c.fill(); } } }
  // 돌진 예고 — 빨간 줄
  c.lineCap = 'round';
  for(const f of FOES){ if(!f.on || f.cs !== 1) continue; const a = RM ? .45 : .35 + .25 * Math.sin(t * 30); c.strokeStyle = `rgba(255,50,50,${a})`; c.lineWidth = FO[f.k].boss ? 16 : 9; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x + f.ax * f.cl, f.y + f.ay * f.cl); c.stroke();
    c.fillStyle = '#FF3D3D'; c.font = 'bold 11px sans-serif'; outl(c, '!', f.x, f.y - FO[f.k].r - 8, '#FF3D3D'); }
  // 대왕 해파리 독침 고리 예고
  if(S.boss && S.boss.tw){ const b = S.boss, k = 1 - Math.max(0, b.fc) / .7; c.strokeStyle = `rgba(214,120,255,${.4 + .5 * k})`; c.lineWidth = 2 + 3 * k; c.beginPath(); c.arc(b.x, b.y, 18 + k * 30, 0, 7); c.stroke(); }
  // 조개 · 아이템
  for(const d of DROPS){ if(!d.on) continue;
    if(d.ty === 2){ if(d.t > 9 && Math.floor(d.t * 8) % 2) continue; const z = RM ? 0 : Math.sin(d.t * 4) * 2, p = PU[d.pk];
      c.fillStyle = 'rgba(80,60,30,.25)'; c.beginPath(); c.ellipse(d.x, d.y + 7, 6, 2, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.92)'; c.strokeStyle = p.c; c.lineWidth = 2; c.beginPath(); c.arc(d.x, d.y - z, 8, 0, 7); c.fill(); c.stroke();
      c.font = '10px sans-serif'; c.fillStyle = '#000'; c.fillText(p.ic, d.x, d.y - z + .5); continue; }
    if(d.t > 7.5 && !d.fly && Math.floor(d.t * 8) % 2) continue;
    const z = d.fly ? 0 : Math.max(0, Math.sin(Math.min(1, d.t * 3) * Math.PI)) * 5;
    c.fillStyle = 'rgba(80,60,30,.25)'; c.beginPath(); c.ellipse(d.x, d.y + 2, 2.6, 1, 0, 0, 7); c.fill();
    c.fillStyle = '#FFE7C2'; c.strokeStyle = '#C98A4B'; c.lineWidth = .6; c.beginPath(); c.moveTo(d.x - 3, d.y - z + 1); c.quadraticCurveTo(d.x, d.y - z - 5, d.x + 3, d.y - z + 1); c.closePath(); c.fill(); c.stroke(); }
  // 라이프가드
  for(const g of S.guards){ c.fillStyle = 'rgba(80,60,30,.25)'; c.beginPath(); c.ellipse(g.x, g.y + 5, 7, 2.5, 0, 0, 7); c.fill(); c.fillStyle = '#C0392B'; c.fillRect(g.x - 6, g.y - 4, 12, 9); c.fillStyle = '#fff'; c.fillRect(g.x - 6, g.y - 1, 12, 2); c.font = '10px sans-serif'; c.fillText('🛟', g.x, g.y - 9); }
  // 자동 조준 — 다음 공격이 갈 적 발밑에 노란 고리
  const tg = S.ph === 'fight' && P.stun <= 0 ? aimT() : null;
  if(tg){ const r = FO[tg.k].r; c.strokeStyle = 'rgba(255,226,122,.95)'; c.lineWidth = 1.4; c.setLineDash([3, 2.5]); c.lineDashOffset = RM ? 0 : -t * 12; c.beginPath(); c.ellipse(tg.x, tg.y + r * .85, r + 3, (r + 3) * .4, 0, 0, 7); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0; }
  // 적
  for(const f of FOES){ if(!f.on) continue; const F = FO[f.k];
    c.fillStyle = 'rgba(10,30,50,.22)'; c.beginPath(); c.ellipse(f.x, f.y + F.r * .9 + (F.fly ? 8 : 0), F.r * .9, F.r * .3, 0, 0, 7); c.fill();
    if(f.k === 'storm'){ drawStorm(c, f, t); }
    else { const sp = SPR[f.k]; if(!sp) continue; let q = RM || f.stn > 0 ? 0 : Math.sin(f.t * (F.fly ? 14 : 6) + f.o) * .07, sx = F.fly ? 1 + q * 2.5 : 1 + q, sy = F.fly ? 1 : 1 - q;
      if(F.spit && f.y >= f.sy && f.fc < .45){ sx *= 1.25; sy *= 1.25; }   // 복어 — 쏘기 직전 부푼다
      if(f.cs === 1 && !RM){ sx *= 1 + Math.sin(t * 40) * .06; }
      if(f.hit > 0 && !RM){ sx *= 1.15; sy *= .87; }   // 맞는 순간 납작 · 그림은 폰에서 잘 보이게 VS배(맞는 범위는 그대로)
      c.save(); c.translate(f.x, f.y); if(F.fly && f.ph >= 1.1) c.rotate(Math.atan2(BY - f.y, f.tx - f.x) - Math.PI / 2); const vs = F.boss ? 1 : VS; c.scale(sx * vs, sy * vs); c.drawImage(f.hit > 0 ? sp.w : sp.n, -sp.s / 2, -sp.s / 2, sp.s, sp.s); c.restore();
      if(F.shell && f.brk){ c.strokeStyle = '#5E3A1E'; c.lineWidth = .9; c.beginPath(); c.moveTo(f.x - 3, f.y); c.lineTo(f.x, f.y + 4); c.lineTo(f.x + 3, f.y + 1); c.stroke(); } }
    if(f.stn > 0){ c.font = '7px sans-serif'; c.fillText('💫', f.x, f.y - F.r - 5); }
    if(!F.boss && f.hp < f.max){ const w = Math.max(12, F.r * 2); bar(c, f.x - w / 2, f.y - F.r - 6, w, 2, f.hp / f.max, f.lag / f.max, F.elite ? '#FFB020' : '#7BD389'); } }
  // 독침 · 라이프가드 탄
  for(const e of ESH){ if(!e.on) continue; const m = Math.hypot(e.vx, e.vy) || 1; c.strokeStyle = e.st ? '#B57CFF' : '#E0A800'; c.lineWidth = 2; c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(e.x - e.vx / m * 6, e.y - e.vy / m * 6); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(e.x, e.y, 1.2, 0, 7); c.fill(); }
  for(const s of SHOTS){ if(!s.on) continue; c.fillStyle = '#FF9E9E'; c.strokeStyle = 'rgba(20,48,79,.6)'; c.lineWidth = .6; c.beginPath(); c.arc(s.x, s.y, 2.2, 0, 7); c.fill(); c.stroke(); }
  // 플레이어 — 대시 잔상, 🔥 불꽃, 무적 깜빡
  const drawMe = (x, y, al, sq, bob) => { c.save(); c.globalAlpha = al; c.translate(x, y + 9 - bob); c.scale(P.face * (2 - sq), sq);
    if(PS) c.drawImage(PS.c, -PS.w / 2, -PS.h, PS.w, PS.h);
    else { c.fillStyle = '#FFF6EA'; c.strokeStyle = '#14304F'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, -10, 10, 9, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#14304F'; c.fillRect(-4, -12, 2, 3); c.fillRect(3, -12, 2, 3); }
    c.restore(); };
  for(let i = 0; i < P.tr.length; i += 2) drawMe(P.tr[i], P.tr[i + 1], .12 + i * .03, 1, 0);
  if(S.fire > 0){ const g = c.createRadialGradient(P.x, P.y - 6, 2, P.x, P.y - 6, 20); g.addColorStop(0, 'rgba(255,170,60,.55)'); g.addColorStop(1, 'rgba(255,90,40,0)'); c.fillStyle = g; c.beginPath(); c.arc(P.x, P.y - 6, 20, 0, 7); c.fill(); }
  const bob = P.mv ? Math.abs(Math.sin(t * 12)) * 2.2 : Math.sin(t * 3) * .5, sq = P.sw && P.sw.t < .08 ? .9 : P.dash > 0 ? .86 : P.mv ? 1 + Math.sin(t * 24) * .05 : 1 + Math.sin(t * 3) * .02;
  c.fillStyle = 'rgba(10,30,50,.28)'; c.beginPath(); c.ellipse(P.x, P.y + 9, 8, 2.8, 0, 0, 7); c.fill();
  drawMe(P.x, P.y, P.inv > 0 && P.dash <= 0 && P.stun <= 0 && S.big < 0 && Math.floor(t * 18) % 2 ? .55 : 1, sq, bob);
  if(P.sw) drawSwing(c, P.sw);
  if(P.stun > 0){ c.font = '9px sans-serif'; for(let i = 0; i < 3; i++){ const a = t * 6 + i * 2.1; c.fillText('⭐', P.x + Math.cos(a) * 9, P.y - 26 + Math.sin(a) * 3); } }
  for(let i = 0, n = S.up.dolph || 0; i < n; i++){ const a = S.t * 3.6 + i * 6.283 / n; c.font = '11px sans-serif'; c.fillText('🐬', P.x + Math.cos(a) * 28, P.y - 4 + Math.sin(a) * 21); }
  // 파편·고리·숫자
  for(const p of PARTS){ if(!p.on) continue; const k = p.t / p.l; c.globalAlpha = 1 - k;
    if(p.rg){ c.strokeStyle = p.c; c.lineWidth = 2.4 * (1 - k) + .5; c.beginPath(); c.arc(p.x, p.y, p.rg * (.3 + .7 * k), 0, 7); c.stroke(); } else { c.fillStyle = p.c; c.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); } } c.globalAlpha = 1;
  for(const x of TXTS){ if(!x.on) continue; const k = x.t / x.l; c.globalAlpha = Math.min(1, (1 - k) * 3.5); const big = x.k === 2 || x.k === 3, pop = RM ? 1 : 1 + Math.max(0, .12 - x.t) * 4;
    c.font = `bold ${Math.round((x.k >= 8 ? 12 : big ? 12 : x.k === 7 ? 8 : 9) * pop)}px sans-serif`; const v = x.k === 2 && typeof x.v === 'number' ? x.v + '!' : String(x.v);
    outl(c, v, x.x, x.y, x.k === 2 ? '#FFE27A' : x.k === 4 ? '#FF6B6B' : x.k === 5 ? '#7BD389' : x.k === 3 ? '#FFB3B3' : x.k === 6 ? '#D5DEE8' : x.k === 7 ? '#9FF0D0' : x.k >= 8 ? '#FFFFFF' : '#FFFFFF'); } c.globalAlpha = 1;
  // 화면 밖 적 — 가장자리 화살표
  for(const f of FOES){ if(!f.on || (f.x >= 0 && f.x <= W && f.y >= -4)) continue; const x = Math.max(5, Math.min(W - 5, f.x)), y = Math.max(5, Math.min(H - 5, f.y)), a = Math.atan2(f.y - y, f.x - x) || (f.y < 0 ? -Math.PI / 2 : 0);
    c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = FO[f.k].boss || FO[f.k].elite ? '#FFB020' : 'rgba(255,80,80,.9)'; c.beginPath(); c.moveTo(4, 0); c.lineTo(-3, -3.5); c.lineTo(-3, 3.5); c.closePath(); c.fill(); c.restore(); }
  // 🌊 필살기 — 큰 파도가 아래에서 위로
  if(S.big >= 0){ const y = H - S.big / 1.1 * (H + 90); const g = c.createLinearGradient(0, y, 0, y + 110); g.addColorStop(0, 'rgba(255,255,255,.97)'); g.addColorStop(.2, 'rgba(110,200,245,.8)'); g.addColorStop(1, 'rgba(44,123,192,0)'); c.fillStyle = g; c.fillRect(-4, y, W + 8, 110);
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-4, y + 4); for(let x = -4; x <= W + 4; x += 8) c.lineTo(x, y + Math.sin(x / 9 + t * 8) * 3); c.lineTo(W + 4, y + 6); c.lineTo(-4, y + 6); c.fill(); }
  c.restore();
  if(S.flash > 0 && !RM){ c.fillStyle = `rgba(255,255,255,${S.flash * 1.4})`; c.fillRect(0, 0, W, H); }
  hud(c, t);
}
/* 👊 보드 휘두르기 — 부채꼴로 쓸리는 하얀 자국 + 보드. 3타째는 크고 노랗다 */
function drawSwing(c, w){
  const k = Math.min(1, w.t / .12), fade = 1 - Math.max(0, (w.t - .1) / .14), a0 = w.a - w.s * w.arc / 2, a1 = a0 + w.s * w.arc * k, cx = P.x, cy = P.y - 4, full = w.fin && S.up.fin;
  c.save(); c.globalAlpha = Math.max(0, fade);
  if(full){ c.strokeStyle = 'rgba(255,226,122,.85)'; c.lineWidth = 7; c.beginPath(); c.arc(cx, cy, w.r * .8, 0, 6.283 * k); c.stroke(); }
  else { c.strokeStyle = w.fin ? 'rgba(255,214,90,.9)' : 'rgba(255,255,255,.85)'; c.lineWidth = w.fin ? 9 : 6; c.lineCap = 'round'; c.beginPath(); c.arc(cx, cy, w.r * .72, Math.min(a0, a1), Math.max(a0, a1)); c.stroke();
    c.strokeStyle = w.fin ? 'rgba(255,140,60,.55)' : 'rgba(127,227,255,.5)'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, w.r * .98, Math.min(a0, a1), Math.max(a0, a1)); c.stroke(); }
  const ab = full ? 6.283 * k : a1, bx = cx + Math.cos(ab) * w.r * .55, by = cy + Math.sin(ab) * w.r * .55, l = w.fin ? 11 : 9;
  c.globalAlpha = 1; c.translate(bx, by); c.rotate(ab); c.fillStyle = w.fin ? '#FFCB3D' : '#FF8A3D'; c.strokeStyle = '#14304F'; c.lineWidth = .8; c.beginPath(); c.ellipse(0, 0, l, l * .3, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.fillRect(-l * .7, -.5, l * 1.4, 1);
  c.restore();
}
/* 위쪽 HUD — 흔들리지 않게 화면에 고정. 오른쪽 위 64칸은 ? ⏸ 버튼 자리 */
function hud(c, t){
  const hr = S.hp / S.max, col = hr > .5 ? '#5BD38A' : hr > .25 ? '#FFC94D' : '#FF5A5A';
  c.fillStyle = 'rgba(11,37,64,.78)'; rr(c, 3, 3, 168, 14, 7); c.fill();
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '9px sans-serif'; c.fillText('🏫', 12, 10.5);
  bar(c, 21, 6.5, 120, 8, hr, S.lag / S.max, col);
  if(S.wall > 0){ c.fillStyle = 'rgba(160,225,255,.9)'; c.fillRect(21, 6.5, 120 * Math.min(1, S.wall / S.max), 2.5); }
  c.font = 'bold 7px sans-serif'; outl(c, `${Math.ceil(S.hp)}`, 81, 11, '#fff');
  c.textAlign = 'left'; c.font = 'bold 6.5px sans-serif'; c.fillStyle = hr < .3 && !RM && Math.floor(t * 4) % 2 ? '#FF8A8A' : '#CFE3F5'; c.fillText('학교', 145, 11);
  const left = S.ph === 'fight' ? alive() + S.q.length - S.qi : 0, bw = S.boss || (S.ph !== 'pick' && STG[S.stg].W[S.w - 1] && S.w === NW);
  let x = 3 + chip(c, 3, 20, `WAVE ${S.w}/${NW}${bw ? ' · 보스' : ''}`, bw ? 'rgba(200,30,40,.92)' : 'rgba(255,203,61,.95)', bw ? '#fff' : '#14304F') + 3;
  if(S.ph === 'fight') x += chip(c, x, 20, `남은 적 ${left}`, 'rgba(11,37,64,.8)') + 3;
  let y2 = 35, x2 = 3;
  if(S.fire > 0) x2 += chip(c, x2, y2, `🔥 2배 ${Math.ceil(S.fire)}`, 'rgba(255,122,61,.95)') + 3;
  if(S.mag > 0) x2 += chip(c, x2, y2, `🧲 ${Math.ceil(S.mag)}`, 'rgba(255,226,122,.95)', '#14304F') + 3;
  if(S.wall > 0) x2 += chip(c, x2, y2, `🛡️ ${Math.ceil(S.wall)}`, 'rgba(127,211,255,.95)', '#14304F') + 3;
  // 콤보 — 오른쪽, 10마다 점수 배율
  if(S.cb >= 3){ const k = Math.min(1, (2.2 - S.cbt) * 8), sc = RM ? 1 : 1 + (1 - k) * .35, m = mult(); c.save(); c.translate(W - 6, 42); c.scale(sc, sc); c.textAlign = 'right';
    c.font = 'bold 15px sans-serif'; outl(c, `${S.cb}`, 0, 0, S.cb >= 30 ? '#FF7A59' : S.cb >= 10 ? '#FFB020' : '#FFE27A'); c.font = 'bold 7px sans-serif'; outl(c, m > 1 ? `콤보 ×${m}` : '콤보', 0, 11, '#fff'); c.restore(); }
  // 보스 이름·체력 — 단계 눈금
  if(S.boss){ const b = S.boss; c.textAlign = 'center'; c.font = 'bold 8px sans-serif'; outl(c, `${FO[b.k].n} · ${b.bp}단계`, SX, 53, '#FFD1D1'); bar(c, 40, 58, 160, 6, b.hp / b.max, b.lag / b.max, b.bp === 3 ? '#FF3D3D' : b.bp === 2 ? '#FF7A59' : '#FFB020');
    c.fillStyle = 'rgba(11,37,64,.9)'; c.fillRect(40 + 160 * .33, 57, 1, 8); c.fillRect(40 + 160 * .66, 57, 1, 8); }
  // 띠 배너 — WAVE n/5 · 보스 · 클리어
  if(S.ban && (S.ban.k === 'phase' || S.ban.k === 'swarm')){ const b = S.ban, k = b.tm / b.d, a = k < .1 ? k / .1 : k > .8 ? (1 - k) / .2 : 1;   // 싸우는 중 띠는 얇고 비치게 — 나·보스를 가리지 않게 위쪽에
    c.save(); c.globalAlpha = Math.max(0, a); c.fillStyle = b.k === 'phase' ? 'rgba(160,20,30,.72)' : 'rgba(70,30,110,.72)'; rr(c, 20, 82, W - 40, b.s ? 26 : 17, 8); c.fill();
    c.textAlign = 'center'; c.font = '900 10px sans-serif'; outl(c, b.t, SX, 91, '#fff'); if(b.s){ c.font = 'bold 7.5px sans-serif'; c.fillStyle = '#FFE27A'; c.fillText(b.s, SX, 102); } c.restore(); }
  else if(S.ban){ const b = S.ban, k = b.tm / b.d, a = k < .1 ? k / .1 : k > .82 ? (1 - k) / .18 : 1, sl = RM ? 0 : (1 - Math.min(1, k / .1)) * -60, y = 150, bh = b.s ? 50 : 38;
    c.save(); c.globalAlpha = Math.max(0, a); c.translate(sl, 0);
    if(b.k === 'boss'){ c.fillStyle = 'rgba(20,6,10,.8)'; c.fillRect(0, y - bh / 2, W, bh); c.fillStyle = '#E8343A'; for(let x = -20 + (t * 30) % 16; x < W; x += 16){ c.beginPath(); c.moveTo(x, y - bh / 2); c.lineTo(x + 8, y - bh / 2); c.lineTo(x + 4, y - bh / 2 + 4); c.lineTo(x - 4, y - bh / 2 + 4); c.fill(); c.beginPath(); c.moveTo(x, y + bh / 2); c.lineTo(x + 8, y + bh / 2); c.lineTo(x + 4, y + bh / 2 - 4); c.lineTo(x - 4, y + bh / 2 - 4); c.fill(); } }
    else { c.fillStyle = b.k === 'swarm' ? 'rgba(70,30,110,.88)' : b.k === 'clear' ? 'rgba(14,90,60,.88)' : 'rgba(11,37,64,.86)'; c.fillRect(0, y - bh / 2, W, bh); c.fillStyle = b.k === 'swarm' ? '#E3B8FF' : b.k === 'clear' ? '#9FF0D0' : '#FFE27A'; c.fillRect(0, y - bh / 2, W, 2); c.fillRect(0, y + bh / 2 - 2, W, 2); }
    c.textAlign = 'center'; const big = b.k === 'wave'; c.font = `900 ${big ? 22 : 15}px sans-serif`; outl(c, b.t, SX, y - (b.s ? 7 : 0), b.k === 'boss' ? '#FFD1D1' : big ? '#FFE27A' : '#FFFFFF');
    if(b.s){ c.font = 'bold 8.5px sans-serif'; c.fillStyle = '#fff'; c.fillText(b.s, SX, y + 14); } c.restore(); }
  c.textAlign = 'center'; c.textBaseline = 'middle';
  // 화면 위 스틱(화면을 끌 때)
  if(stick && stick.src === 'cv'){ c.strokeStyle = 'rgba(255,255,255,.6)'; c.fillStyle = 'rgba(11,37,64,.25)'; c.lineWidth = 1.5; c.beginPath(); c.arc(stick.bx, stick.by, SR, 0, 7); c.fill(); c.stroke();
    const dx = stick.x - stick.bx, dy = stick.y - stick.by, m = Math.hypot(dx, dy), k = m > SR ? SR / m : 1; c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(stick.bx + dx * k, stick.by + dy * k, 11, 0, 7); c.fill(); }
  // 코치 — 아래 버튼을 가리키는 말풍선
  const co = coach(); if(co){ const a = RM ? 1 : .75 + .25 * Math.sin(t * 8), right = co !== 'mv', bx = right ? W - 6 : 6;
    c.globalAlpha = a; c.font = 'bold 9px sans-serif'; const w = c.measureText(CO[co]).width + 14, X = right ? bx - w : bx;
    c.fillStyle = co === 'dash' ? 'rgba(200,30,40,.95)' : 'rgba(255,203,61,.97)'; rr(c, X, H - 54, w, 17, 8.5); c.fill();
    c.fillStyle = co === 'dash' ? '#fff' : '#14304F'; c.textAlign = 'left'; c.fillText(CO[co], X + 7, H - 45.2);
    c.textAlign = 'center'; c.font = 'bold 12px sans-serif'; outl(c, '▼', right ? X + w - 16 : X + 16, H - 30 + (RM ? 0 : Math.sin(t * 9) * 2), co === 'dash' ? '#FF6B6B' : '#FFE27A'); c.globalAlpha = 1; }
  if(S.pick){ c.fillStyle = 'rgba(11,37,64,.55)'; c.fillRect(0, 0, W, H); }
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

/* 덮개 — 해변 고르기 / 조작법 / 결과 */
function prog(){ const d = (typeof ME !== 'undefined' && ME && ME.profile && ME.profile.play && ME.profile.play.df) || {}; const n = (v, m) => { const x = Math.floor(+v); return Number.isFinite(x) ? Math.max(0, Math.min(m, x)) : 0; };
  const ar = (a, m) => [0, 1, 2].map(i => n(Array.isArray(a) ? a[i] : 0, m)); return { b:n(d.best, 15), c:n(d.clears, 9999), hd:n(d.hd, 3), st:ar(d.st, 3), sb:ar(d.sb, 15) }; }
const opened = (p, i) => i === 0 || i <= p.hd || p.st[i - 1] > 0;   // 앞 해변을 지키면 다음이 열린다
const stars = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const tm = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const fmt = n => Math.round(n).toLocaleString('ko-KR');
const seenHow = () => { try{ return localStorage.getItem(LH) === '1'; }catch(e){ return false; } };
const HOW = `<div class="d-goal">🏫 서핑 학교를 지켜라!</div><div class="d-goal2">몰려오는 바다 괴물을 물리치세요</div>
  <ol class="d-how">
    <li><i class="d-mini mv">🕹️</i><span><b>스틱으로 이동</b><small>아래 왼쪽을 누르고 끌어요 · 화면을 끌어도 돼요</small></span></li>
    <li><i class="d-mini atk">👊</i><span><b>공격 — 자동 조준</b><small>가까운 적을 알아서 때려요 · 꾹 누르면 3단 콤보</small></span></li>
    <li><i class="d-mini sp">🌊</i><span><b>필살기 — 게이지가 차면</b><small>화면 전체를 쓸어요 · <b>💨 대시</b>로 빨간 줄을 피해요</small></span></li>
  </ol>
  <div class="d-hown">💡 나는 쓰러지지 않아요 — <b>학교 HP</b>가 0이 되면 끝<br><span>PC: WASD 이동 · J 공격 · K 대시 · L 필살기</span></div>`;
function how(then){
  const ov = $d('d-ov'); if(!ov) return; ov.hidden = false; const mid = !!(S && S.ph !== 'done');
  if(mid){ S.paused = true; stick = null; BTN.atk = 0; padStick(); ctl(); }
  ov.innerHTML = `<div class="go-card d-howc">${HOW}<button class="btn" id="d-howok" type="button" style="width:100%">${mid ? '계속하기 ▶' : '알겠어요! 시작 ▶'}</button></div>`;
  $d('d-pad').classList.add('show');
  $d('d-howok').onclick = () => { try{ localStorage.setItem(LH, '1'); }catch(e){} $d('d-pad').classList.remove('show');
    if(then) return then(); if(mid){ ov.hidden = true; ov.innerHTML = ''; S.paused = false; ctl(); } else over(); };
}
function over(){
  const ov = $d('d-ov'); if(!ov) return; const p = prog(), bs = bests(); ov.hidden = false;
  if(!opened(p, cur)) cur = 0;
  if(!S || S.ph !== 'done'){
    ov.innerHTML = `<div class="go-card"><div class="d-goal">🏫 서핑 학교를 지켜라!</div><div class="d-goal2">몰려오는 바다 괴물을 물리치세요</div>
      <div class="d-keys" aria-label="조작"><span><i>🕹️</i>이동</span><span><i>👊</i>공격</span><span><i>💨</i>대시</span><span><i>🌊</i>필살기</span></div>
      <div class="d-stgs" role="group" aria-label="해변">${STG.map((g, i) => { const ok = opened(p, i);
        return `<button type="button" class="d-stg" data-stage="${i}" aria-pressed="${i === cur}" ${ok ? '' : 'disabled'}><i>${ok ? g.ic : '🔒'}</i><b>${i + 1}. ${esc(g.n)}</b><em>${stars(p.st[i])}</em><small>${ok ? `${esc(g.d)} · 웨이브 5 · 보스 ${esc(FO[g.boss].n)}${bs[i] ? ` · 최고 ${fmt(bs[i])}점` : ''}` : '앞 해변을 지키면 열려요'}</small></button>`; }).join('')}</div>
      <button class="btn" id="d-go" type="button" style="width:100%">▶ ${esc(STG[cur].n)} 시작</button>
      <button class="btn ghost sm" id="d-how" type="button" style="width:100%;margin-top:6px">❓ 조작법 보기</button></div>`;
    ov.querySelectorAll('[data-stage]').forEach(x => x.onclick = () => { if(x.disabled) return; cur = +x.dataset.stage; try{ localStorage.setItem(LS, cur); }catch(e){} over(); });
    $d('d-how').onclick = () => how();
    $d('d-go').onclick = () => seenHow() ? start(cur) : how(() => start(cur));
    return;
  }
  const win = S.res === 'win', G = STG[S.stg], nx = win && S.stg < 2;
  const tip = win ? '' : S.sps === 0 ? '💡 게이지가 차면 🌊 <b>필살기</b> — 화면 전체를 쓸어요' : S.atks < 30 ? '💡 👊 공격 버튼을 <b>꾹 누르고</b> 있으면 3단 콤보' : S.stg > 0 && S.dashes < 2 ? '💡 빨간 줄이 보이면 💨 <b>대시</b>로 피해요' : '💡 웨이브 사이 카드로 💪 공격력 · 🛟 라이프가드를 골라 봐요';
  ov.innerHTML = `<div class="go-card"><div class="go-t">${win ? '🏆 학교를 지켰어요!' : '🌊 학교가 잠겼어요…'}</div><div class="d-goal2">${esc(G.n)} 해변 · 웨이브 ${S.cw}/${NW}${win ? ` · ${esc(FO[G.boss].n)} 격파` : ''}</div>
    ${win ? `<div class="d-stars" aria-label="별 ${S.stars}개">${[0, 1, 2].map(i => i < S.stars ? '<span>★</span>' : '<span><s>★</s></span>').join('')}</div>` : ''}
    <div class="d-score"><small>점수</small><b>${fmt(S.score)}</b>${S.newBest ? '<em class="nb">🎉 최고 기록!</em>' : S.best ? `<em>최고 ${fmt(S.best)}</em>` : ''}</div>
    <div class="go-st"><span>웨이브<b>${S.cw}/${NW}</b></span><span>처치<b>${S.kills}</b></span><span>최고 콤보<b>${S.cbm}</b></span><span>시간<b>${tm(S.ft)}</b></span></div>
    ${win && S.stars < 3 ? '<div class="go-d">학교 HP를 70% 넘게 남기면 ★3</div>' : ''}${tip ? `<div class="go-d">${tip}</div>` : ''}
    <div class="go-b">보상 <b>🐚${R && R.shells || S.earned}</b> · XP +${R && R.gain || 0}</div>
    ${R && R.first ? `<div class="d-new">🎉 첫 클리어 보너스 🐚+${R.first}${S.stg < 2 ? ` · ${esc(STG[S.stg + 1].n)} 열림!` : ''}</div>` : ''}
    ${typeof upNudge === 'function' ? upNudge('defend', { sc:S.score, best:S.best, u:'점', x2:R && R.x2 }) : ''}
    <div class="d-row">${nx ? '<button class="btn" id="d-next" type="button">다음 해변 ▶</button>' : ''}<button class="btn${nx ? ' ghost' : ''}" id="d-go" type="button">🔁 한 판 더</button></div>
    <div class="d-row"><button class="btn ghost" id="d-sel" type="button">🗺️ 해변 고르기</button><button class="btn ghost" id="d-close" type="button">닫기</button></div></div>`;
  $d('d-close').onclick = defendClose;
  $d('d-sel').onclick = () => { S = null; R = null; barUI(); ctlKey = ''; ctl(); over(); };
  if(nx) $d('d-next').onclick = () => { cur = S.stg + 1; try{ localStorage.setItem(LS, cur); }catch(e){} start(cur); };
  $d('d-go').onclick = () => start(S.stg);
}

/* 웨이브 사이 강화 카드 */
let barKey = '';
function barUI(){
  const el = $d('d-bar'); if(!el) return;
  if(!S || !S.pick || S.ph === 'done'){ if(!el.hidden){ el.hidden = true; el.innerHTML = ''; el.classList.remove('pick'); } barKey = ''; return; }
  const key = S.w + S.pickT + S.pickN + S.pick.join(); if(key === barKey && !el.hidden) return; barKey = key;
  el.hidden = false; el.classList.add('pick');
  el.innerHTML = `<div class="d-sh"><b>${S.pickT === 'free' ? '🎟️ 시작 강화 — 하나 골라요' : `✅ WAVE ${S.w} 클리어!`}</b><b>${S.pickT === 'free' ? '' : '강해질 카드 하나 ▼'}</b></div>
    <div class="d-cards">${S.pick.map((k, i) => { const u = UK[k], l = S.up[k] || 0;
      return `<button type="button" class="d-card${l ? '' : ' new'}" data-pick="${i}"><i>${u.ic}</i><b>${esc(u.n)}</b><small>${esc(u.d)}</small><em>${k === 'heal' ? `🏫 ${Math.ceil(S.hp)} → ${Math.ceil(Math.min(S.max, S.hp + S.max * .4))}` : l ? `Lv${l} → ${l + 1}` : 'NEW'}</em></button>`; }).join('')}</div>`;
  el.querySelectorAll('[data-pick]').forEach(x => x.onclick = () => pick(+x.dataset.pick));
}
/* 아래 패드 — 대시 쿨타임 고리, 필살기 게이지, 코치가 가리키는 버튼은 반짝 */
let ctlKey = '';
function ctl(){
  const pa = $d('d-pause'), pad = $d('d-pad'); if(!pa || !pad) return;
  const on = !!(S && S.ph !== 'done'), fight = on && !S.pick && !S.paused, cd = fight && P.dcd > 0 ? Math.min(1, P.dcd / dashCd()) : 0, g = S ? Math.min(1, S.sp / 100) : 0, co = S ? coach() : '';
  const k = [on, fight, S && S.paused, cd.toFixed(2), g.toFixed(2), co].join(); if(k === ctlKey) return; ctlKey = k;
  pa.disabled = !on; pa.textContent = S && S.paused ? '▶' : '⏸'; pa.setAttribute('aria-label', S && S.paused ? '계속하기' : '멈추기'); pa.setAttribute('aria-pressed', !!(S && S.paused));
  pad.classList.toggle('off', !fight);
  const a = $d('d-atk'), d = $d('d-dash'), s = $d('d-sp');
  for(const b of [a, d, s]) b.setAttribute('aria-disabled', String(!fight));
  d.style.setProperty('--cd', cd.toFixed(3)); d.classList.toggle('cool', cd > 0);
  s.style.setProperty('--g', g.toFixed(3)); s.classList.toggle('full', g >= 1 && fight);
  s.querySelector('small').textContent = g >= 1 ? '필살기!' : `${Math.floor(g * 100)}%`; s.setAttribute('aria-label', g >= 1 ? '필살기 준비됨 — 누르면 화면 전체 공격' : `필살기 게이지 ${Math.floor(g * 100)}%`);
  a.classList.toggle('nudge', co === 'atk'); d.classList.toggle('nudge', co === 'dash'); s.classList.toggle('nudge', co === 'sp'); $d('d-joy').classList.toggle('nudge', co === 'mv');
}
let hudKey = '';
function ui(){
  const h = $d('d-hud'); const k = S ? `점수 ${fmt(S.score)}` : ''; if(h && k !== hudKey){ hudKey = k; h.textContent = k; }
  barUI(); ctl();
}
function fit(){
  if(!cv) return; const w = cv.getBoundingClientRect().width || W * 2, dpr = Math.min(3, window.devicePixelRatio || 1), pw = Math.round(w * dpr);
  if(pw !== cv.width){ cv.width = pw; cv.height = Math.round(pw * H / W); }
  const k = cv.width / W; if(k !== K || !SPR.jelly){ K = k; bakeAll(); }
}
function loop(ts){
  raf = requestAnimationFrame(loop);
  if(!last) last = ts; const dt = Math.min(.05, (ts - last) / 1000); last = ts;
  if(S && !S.paused && S.ph !== 'done' && !window._dfreeze){ acc += dt; let n = 0; while(acc >= FIX && n++ < 8){ step(FIX); acc -= FIX; } } else acc = 0;
  try{ draw(); }catch(e){ if(!loop.err){ loop.err = 1; console.warn('defend draw', e); } window._derr = String(e && e.stack || e).slice(0, 300); }   // 그리기가 한 번 틀려도 HUD·버튼은 계속
  ui();
}

/* 조작 — 스틱은 둘: 아래 왼쪽 패드(px, 반지름 PR) · 화면 끌기(논리 좌표, 반지름 SR). 멀리 끌면 받침이 따라온다 */
const canAct = () => !!(S && S.ph !== 'done' && !S.pick && !S.paused);
function lp(e){ const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
function jp(e){ const r = $d('d-joy').getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
function sdown(e, src){
  if(!S || S.ph === 'done' || S.pick) return; e.preventDefault();
  if(S.paused){ if($d('d-ov').hidden){ S.paused = false; ctl(); } return; }
  if(stick) return; const [x, y] = src === 'cv' ? lp(e) : jp(e); stick = { id:e.pointerId, src, bx:x, by:y, x, y, vx:0, vy:0, R:src === 'cv' ? SR : PR };
  try{ e.currentTarget.setPointerCapture(e.pointerId); }catch(_){} padStick();
}
function smove(e){ if(!stick || e.pointerId !== stick.id) return; const [x, y] = stick.src === 'cv' ? lp(e) : jp(e); stick.x = x; stick.y = y;
  let dx = x - stick.bx, dy = y - stick.by, m = Math.hypot(dx, dy); const Rr = stick.R;
  if(m > Rr * 1.4){ const k = (m - Rr * 1.4) / m; stick.bx += dx * k; stick.by += dy * k; dx = x - stick.bx; dy = y - stick.by; m = Math.hypot(dx, dy); }
  if(m > Rr * .12){ const k = Math.min(1, m / Rr) / m; stick.vx = dx * k; stick.vy = dy * k; } else stick.vx = stick.vy = 0;
  padStick(); }
function sup(e){ if(stick && e.pointerId === stick.id){ stick = null; padStick(); } }
function padStick(){ const j = $d('d-joy'); if(!j) return;
  if(stick && stick.src === 'pad'){ const dx = stick.x - stick.bx, dy = stick.y - stick.by, m = Math.hypot(dx, dy), k = m > PR ? PR / m : 1;
    j.style.setProperty('--bx', stick.bx + 'px'); j.style.setProperty('--by', stick.by + 'px'); j.style.setProperty('--kx', dx * k + 'px'); j.style.setProperty('--ky', dy * k + 'px'); j.classList.add('on'); }
  else { for(const v of ['--bx', '--by', '--kx', '--ky']) j.style.removeProperty(v); j.classList.remove('on'); } }
const KM = { ArrowLeft:'l', a:'l', A:'l', ArrowRight:'r', d:'r', D:'r', ArrowUp:'u', w:'u', W:'u', ArrowDown:'d', s:'d', S:'d' };
function press(k, on){ if(!on){ if(k === 'atk') BTN.atk = 0; return; } if(!canAct()) return;
  if(k === 'atk'){ BTN.atk = 1; S.qa = .3; } else if(k === 'dash') S.qd = 1; else if(k === 'sp'){ if(S.sp >= 100) S.qs = 1; else txt(P.x, P.y - 24, `게이지 ${Math.floor(S.sp)}%`, 6); } }
function hold(el, k){
  el.addEventListener('pointerdown', e => { e.preventDefault(); el.classList.add('on'); press(k, 1); try{ el.setPointerCapture(e.pointerId); }catch(_){} });
  for(const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(ev, () => { el.classList.remove('on'); press(k, 0); });
  el.addEventListener('click', e => { if(e.detail === 0){ press(k, 1); setTimeout(() => press(k, 0), 150); } });   // 키보드(Enter·Space)로 누른 경우
  el.addEventListener('contextmenu', e => e.preventDefault());
}

function defendOpen(){
  wire(); cv = $d('d-cv'); ctx = cv.getContext('2d');
  $d('defend').hidden = false; document.body.classList.add('game-on');
  S = null; R = null; stick = null; BTN.atk = 0; padStick(); loadMe(); fit(); over(); barUI(); ctlKey = ''; ctl();
  last = 0; acc = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
}
function defendClose(){
  cancelAnimationFrame(raf); raf = 0; S = null; stick = null; BTN.atk = 0; window._gameRun = false; padStick();
  $d('defend').hidden = true; document.body.classList.remove('game-on'); barUI();
  if(typeof playTick === 'function') playTick(); if(typeof renderHub === 'function' && typeof state !== 'undefined' && state.tab === 'play') renderHub();
}
function wire(){
  if(wire.done || !$d('defend') || !$d('d-pad')) return; wire.done = true;
  const c = $d('d-cv'), j = $d('d-joy');
  $d('d-x').onclick = defendClose;
  c.addEventListener('pointerdown', e => sdown(e, 'cv')); j.addEventListener('pointerdown', e => sdown(e, 'pad'));
  for(const el of [c, j]){ el.addEventListener('pointermove', smove); el.addEventListener('pointerup', sup); el.addEventListener('pointercancel', sup); el.addEventListener('lostpointercapture', sup); }
  hold($d('d-atk'), 'atk'); hold($d('d-dash'), 'dash'); hold($d('d-sp'), 'sp');
  $d('d-pad').addEventListener('touchmove', e => e.preventDefault(), { passive:false });   // 패드 위에서 페이지가 끌리거나 확대되지 않게
  $d('d-pause').onclick = () => { if(S && S.ph !== 'done'){ S.paused = !S.paused; stick = null; BTN.atk = 0; padStick(); ctl(); } };
  $d('d-help').onclick = () => how();
  addEventListener('keydown', e => { if($d('defend').hidden) return; if(e.key === 'Escape') return defendClose();
    if(/INPUT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName)) return;
    if(S && S.pick && /^[1-3]$/.test(e.key)){ pick(+e.key - 1); e.preventDefault(); return; }   // PC — 숫자키로 카드 고르기
    if(KM[e.key]){ KEYS[KM[e.key]] = 1; e.preventDefault(); return; }
    const k = { j:'atk', J:'atk', ' ':'atk', k:'dash', K:'dash', Shift:'dash', l:'sp', L:'sp', e:'sp', E:'sp' }[e.key];
    if(k && !(document.activeElement && document.activeElement.tagName === 'BUTTON' && e.key === ' ')){ if(!e.repeat) press(k, 1); e.preventDefault(); return; }
    if((e.key === 'p' || e.key === 'P') && S && S.ph !== 'done'){ S.paused = !S.paused; ctl(); } });
  addEventListener('keyup', e => { if(KM[e.key]) KEYS[KM[e.key]] = 0; if(e.key === 'j' || e.key === 'J' || e.key === ' ') press('atk', 0); });
  addEventListener('resize', () => { if(!$d('defend').hidden) fit(); });
  document.addEventListener('visibilitychange', () => { if(S && document.hidden && S.ph !== 'done'){ S.paused = true; stick = null; BTN.atk = 0; padStick(); } last = 0; });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
window.defendOpen = defendOpen; window.defendClose = defendClose;

/* 시험·균형용 손잡이 */
function killAll(withBoss){ for(let p = 0; p < 3; p++) for(const f of FOES) if(f.on && (withBoss || !FO[f.k].boss)) kill(f); }
function skip(w){ if(!S) return; for(const a of [FOES, SHOTS, ESH]) for(const o of a) o.on = 0; S.boss = null; S.sw = null; S.pick = null; S.pickN = 0; S.w = w - 1; startWave(); }
window._defend = { get S(){ return S; }, get P(){ return P; }, get stick(){ return stick; }, BTN, start, step, skip, killAll, pick, press, special, spawn, how, FIX, NW, STG, UPS,
  fast(sec){ for(let k = 0; S && S.ph !== 'done' && k < sec / FIX; k++){ if(S.pick) pick(0); step(FIX); } },
  auto(sec, mode){ const b0 = botOn; botOn = mode === 'casual' ? 2 : 1; for(let k = 0; S && S.ph !== 'done' && k < sec / FIX; k++){ if(S.pick) botPick(); step(FIX); } botOn = b0; BTN.atk = 0; },
  lose(){ if(S && S.ph !== 'done'){ S.pick = null; S.hp = 0; S.hs = 0; step(FIX); } },
  win(){ if(!S) return; skip(NW); S.qi = S.q.length; for(const o of S.q) spawn(o.k); killAll(true); S.pick = null; S.hs = 0; for(let i = 0; i < 200 && S.ph !== 'done'; i++) step(FIX); },
  run(stg, sd, rw, U, mode){ noRw = !rw; botOn = mode === 'casual' ? 2 : 1; const o0 = S; start(stg, sd, U || {});
    let n = 0; const tr = window._dtrace; while(S.ph !== 'done' && S.t < 900){ if(S.pick) botPick(); step(FIX); if(tr && ++n % 60 === 0) tr.push([S.w, Math.round(S.hp), alive(), +P.stun.toFixed(1), S.kills, Math.round(P.x), Math.round(P.y)].join(' ')); }
    const o = { res:S.res, w:S.w, kills:S.kills, t:Math.round(S.ft), hp:Math.round(S.hp), stars:S.stars, score:S.score, cb:S.cbm, sps:S.sps, dashes:S.dashes, up:JSON.stringify(S.up) }; botOn = 0; noRw = false;
    if($d('defend') && !$d('defend').hidden && o0 !== undefined) over(); return o; }
};
})();
