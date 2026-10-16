/* 🛡️ 해변 수호 — 내 모찌를 스틱으로 움직여 낙산 서핑학교를 지키는 직접 조작 디펜스.
   움직이면 가장 가까운 적에게 서프 왁스 탄을 자동으로 던진다. 15라운드(5·14 엘리트, 10 대왕 해파리, 15 폭풍 너울).
   라운드 사이 8초 정비 — 쓰러뜨린 자리의 조개를 주워 강화 카드 3장 중에서 산다. 큰 파도는 한 판에 한 번.
   논리 화면 240×360, 실제 픽셀은 기기 배율만큼. 고정 간격(FIX)으로 굴려 2배속·시뮬레이션에서도 결과가 같다.
   매 프레임 큰 객체를 새로 만들지 않게 적·탄·조개·파편은 미리 만든 칸(pool)을 돌려 쓴다. */
(function(){
const $d = id => document.getElementById(id);
const RM = (()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })();   // 흔들림·밀려드는 띠·파편을 줄인다
const W = 240, H = 360, SH = 120, FIX = 1 / 60, NR = 15, SHOP = 8;
const SX = 120, BY = H - 42, SR = 30;   // 학교 가운데 · 적이 학교에 달라붙는 줄 · 스틱 반지름
const LS = 'lineup.share.ddiff';
const DIFF = [ { n:'쉬움', hp:.75, sp:1.15, bite:1, sch:120, g:.24 }, { n:'보통', hp:.9, sp:1.3, bite:1.3, sch:100, g:.28 }, { n:'어려움', hp:.95, sp:1.4, bite:1.5, sch:90, g:.33 } ];   // 봇(학교 앞을 지키며 공격 카드부터 사는) 기준 승률 ≈ 쉬움 100% · 보통 65% · 어려움 30%

/* 골칫거리 — bite: 학교에 붙어 초당 깎는 양, sh: 떨구는 조개 */
const FO = {
  jelly:{ n:'해파리', hp:12, sp:30, r:6, bite:4.5, sh:1, col:'#F49AC1' },
  crab: { n:'꽃게', hp:9, sp:48, r:6, bite:6, sh:1, col:'#E8613C' },
  urch: { n:'성게', hp:22, sp:22, r:6, bite:7.5, sh:2, col:'#5B3E8C', spike:1 },
  trash:{ n:'쓰레기 더미', hp:36, sp:18, r:8, bite:9, sh:2, col:'#8A7A62', split:1 },
  bag:  { n:'비닐', hp:6, sp:40, r:5, bite:3, sh:0, col:'#DDE6EE' },
  gull: { n:'갈매기', hp:7, sp:90, r:6, bite:7.5, sh:1, col:'#F2F5F8', fly:1 },
  elite:{ n:'대장 꽃게', hp:150, sp:24, r:12, bite:15, sh:10, col:'#D9482B', elite:1 },
  king: { n:'대왕 해파리', hp:340, sp:10, r:16, bite:21, sh:20, col:'#B07FE0', boss:1, sum:'jelly', se:4 },
  storm:{ n:'폭풍 너울', hp:850, sp:6, r:20, bite:45, sh:40, col:'#2C7BC0', boss:2, sum:'trash', se:8 }
};
const NM = { jelly:'해파리 떼', crab:'꽃게 떼', urch:'성게', trash:'쓰레기 더미', gull:'갈매기', elite:'⭐ 대장 꽃게', king:'👑 대왕 해파리', storm:'🌀 폭풍 너울' };
const ROUNDS = [
  [['jelly',8]], [['jelly',6],['crab',6]], [['crab',10],['jelly',4]], [['urch',4],['jelly',8]], [['elite',1],['crab',10]],
  [['trash',4],['jelly',8]], [['gull',6],['crab',10]], [['urch',6],['trash',3],['jelly',8]], [['crab',16],['gull',6]], [['king',1],['jelly',10]],
  [['trash',6],['urch',6],['gull',4]], [['crab',18],['jelly',12]], [['urch',8],['gull',8],['trash',4]], [['elite',2],['crab',14],['jelly',10]], [['storm',1],['jelly',8],['crab',8]]
];
/* 강화 카드 — 값은 c + 레벨×5(수리는 살 때마다 +2) */
const CARDS = [
  { k:'atk', ic:'💥', n:'공격력', d:'왁스 탄 피해 +25%', c:5, max:5 },
  { k:'rate', ic:'⚡', n:'공속', d:'던지는 속도 +18%', c:5, max:5 },
  { k:'rng', ic:'🎯', n:'사거리', d:'자동 공격 거리 +10', c:4, max:5 },
  { k:'pierce', ic:'🏄', n:'관통 보드', d:'탄이 한 마리 더 뚫어요', c:7, max:4 },
  { k:'dolph', ic:'🐬', n:'돌고래 친구', d:'곁을 도는 돌고래 +1', c:8, max:3 },
  { k:'guard', ic:'🛟', n:'라이프가드 호출', d:'지금 선 자리에 포탑', c:8, max:3 },
  { k:'heal', ic:'🩹', n:'학교 수리', d:'학교 HP +35%', c:6, max:99 },
  { k:'move', ic:'👟', n:'이동속도', d:'달리기 +12%', c:4, max:5 },
  { k:'magnet', ic:'🧲', n:'자석', d:'조개 줍는 범위 +60%', c:3, max:4 },
  { k:'crit', ic:'🎲', n:'크리티컬', d:'12% 확률로 2배', c:5, max:4 },
  { k:'ice', ic:'🧊', n:'얼음 왁스', d:'맞은 적이 느려져요', c:6, max:4 },
  { k:'dash', ic:'🌊', n:'파도 타기 대시', d:'달리면 자동 돌진·통과 피해', c:7, max:4 }
];
const CK = {}; CARDS.forEach(c => CK[c.k] = c);

/* 칸(pool) — 꺼낼 때 on=1, 다 쓰면 on=0 */
const pool = (n, mk) => { const a = []; for(let i = 0; i < n; i++) a.push(mk()); return a; };
const take = a => { for(let i = 0; i < a.length; i++) if(!a[i].on){ a[i].on = 1; return a[i]; } return null; };
const FOES = pool(160, () => ({ on:0 })), SHOTS = pool(120, () => ({ on:0, hit:[] })), DROPS = pool(220, () => ({ on:0 })), PARTS = pool(260, () => ({ on:0 })), TXTS = pool(48, () => ({ on:0 }));
const ALL = [FOES, SHOTS, DROPS, PARTS, TXTS];

let rnd = Math.random;
const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

let S = null, P = null, cv, ctx, K = 2, raf = 0, last = 0, acc = 0, speed = 1, diff = 1, meImg = null, PS = null, SPR = {}, stick = null, botOn = 0, noRw = false, R = null;
const IN = [0, 0], KEYS = {};
try{ const v = +localStorage.getItem(LS); if(v >= 0 && v <= 2) diff = v; }catch(e){}

function start(df, sd){
  diff = df == null ? diff : df; const D = DIFF[diff];
  rnd = mul(sd == null ? (Math.random() * 1e9) | 0 : sd);
  for(const a of ALL) for(const o of a) o.on = 0;
  S = { df:diff, r:0, ph:'fight', t:0, rt:0, q:[], qi:0, hp:D.sch, max:D.sch, lag:D.sch, lagT:0, bacc:0, shells:0, got:0, kills:0, ult:1, big:-1, shake:0, paused:false, res:null, ban:null,
        st:0, offer:[], bought:[], rr:2, lv:{}, heal:0, guards:[], sw:null, swc:3, boss:null, hint:4, nid:1, dashT:0, dashId:0, earned:0, pw:null };
  P = { x:SX, y:H - 90, face:1, stun:0, cd:0, dash:0, dx:0, dy:0, kx:0, ky:0, mv:0, thr:0 };
  { const U = (!botOn && typeof upFor === 'function') ? upFor('defend') : {};      // 🔧 강화 — 균형 시험(봇)에는 쓰지 않는다
    if(U.atk) S.lv.atk = U.atk; if(U.sch) S.max = S.hp = S.lag = Math.round(D.sch * (1 + .1 * U.sch)); if(U.shell) S.shells += 3 * U.shell; S.free = U.free || 0; }
  power(); stick = null; window._gameRun = true;
  const ov = $d('d-ov'); if(ov){ ov.hidden = true; ov.innerHTML = ''; }
  startRound(); ctl();
}
function power(){ const L = k => S.lv[k] || 0;
  S.pw = { dmg:12 * (1 + .25 * L('atk')), cd:.42 / Math.pow(1.18, L('rate')), rng:56 + 10 * L('rng'), pierce:L('pierce'), crit:.05 + .12 * L('crit'),
           slow:L('ice') ? .25 + .08 * L('ice') : 0, sp:64 * (1 + .12 * L('move')), mag:16 * (1 + .6 * L('magnet')), dolph:L('dolph'), dash:L('dash') ? Math.max(1.4, 3.6 - .45 * L('dash')) : 0 };
}
function preview(i){ const Rr = ROUNDS[i]; if(!Rr) return ''; const g = Rr.find(x => FO[x[0]].boss || FO[x[0]].elite) || Rr.reduce((a, b) => b[1] > a[1] ? b : a); return `${NM[g[0]]} ×${g[1]}${Rr.length > 1 ? ` 외 ${Rr.length - 1}` : ''}`; }
function banner(k, t, s, d){ S.ban = { k, t, s:s || '', d:d || (k === 'boss' ? 2.6 : 1.6), tm:0 }; }

function startRound(){
  S.r++; S.ph = 'fight'; S.rt = 0; S.q.length = 0; S.qi = 0;
  const Rr = ROUNDS[S.r - 1], T = 3 + S.r * .25;
  for(const [k, n] of Rr) for(let i = 0; i < n; i++){ const big = FO[k].boss || FO[k].elite; S.q.push({ t:1 + (big ? .4 + i * 2.5 : (i + rnd() * .8) / n * T), k }); }
  S.q.sort((a, b) => a.t - b.t);
  const bs = Rr.find(g => FO[g[0]].boss);
  if(bs) banner('boss', `⚠️ ${FO[bs[0]].n}`, bs[0] === 'storm' ? '빨간 줄이 뜨면 줄 밖으로 피해요!' : '새끼를 부르기 전에 쓰러뜨려요');
  else banner('round', `라운드 ${S.r}`, Rr.some(g => FO[g[0]].elite) ? '⭐ 엘리트 등장 — 단단해요' : preview(S.r - 1));
  shopUI();
}
function spawn(k, x, y){
  const f = take(FOES); if(!f) return null; const F = FO[k], D = DIFF[S.df], sc = F.boss ? 1 + D.g * 4 : 1 + D.g * (S.r - 1);   // 라운드마다 단단해진다 — 강화 카드가 쌓이는 만큼 뒤로 갈수록 가파르게
  f.k = k; f.id = S.nid++; f.hp = f.max = f.lag = F.hp * D.hp * sc; f.lagT = 0; f.spm = D.sp * (.9 + rnd() * .2);
  f.t = 0; f.o = rnd() * 6.28; f.sl = 0; f.slk = 0; f.hit = 0; f.kx = 0; f.ky = 0; f.bite = 0; f.ph = 0; f.se = F.se || 0; f.dc = 0; f.dh = 0;
  f.tx = SX - 28 + rnd() * 56;
  if(x != null){ f.x = x; f.y = y; }
  else if(F.boss){ f.x = SX; f.y = 34; S.boss = f; }   // 바다 가운데서 솟아오른다(오른쪽 위 버튼에 가리지 않게)
  else if(F.fly){ f.x = rnd() < .5 ? -8 : W + 8; f.y = 50 + rnd() * 120; }
  else if(k === 'crab' && rnd() < .5){ f.x = rnd() < .5 ? -8 : W + 8; f.y = SH - 40 + rnd() * 50; }
  else { f.x = 14 + rnd() * (W - 28); f.y = -8 + rnd() * 30; }   // 바다 위쪽에서 솟아오른다
  return f;
}

/* 한 칸 굴리기 */
function step(dt){
  if(!S || S.ph === 'done') return;
  S.t += dt; S.shake = Math.max(0, S.shake - dt);
  if(S.hint > 0 && (P.mv || S.t > 7)) S.hint -= dt * 3;
  if(S.ban){ S.ban.tm += dt; if(S.ban.tm > S.ban.d) S.ban = null; }
  if(S.big >= 0){ S.big += dt; if(S.big > 1.1) S.big = -1; }
  if(S.lagT > 0) S.lagT -= dt; else if(S.lag > S.hp) S.lag = Math.max(S.hp, S.lag - S.max * .5 * dt);   // 흰 지연 바 — 잃은 만큼이 잠깐 남았다가 줄어든다
  if(S.ph === 'shop'){ S.st -= dt; if(S.st <= 0) startRound(); }
  else { S.rt += dt; while(S.qi < S.q.length && S.q[S.qi].t <= S.rt) spawn(S.q[S.qi++].k); }
  if(botOn === 1) botTick();
  move(dt); attack(dt); foes(dt); boss(dt); drops(dt); fx(dt);
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
  const pw = S.pw; let sp = pw.sp;
  if(pw.dash){ S.dashT -= dt;
    if(P.dash > 0){ P.dash -= dt; sp *= 3.2; ix = P.dx; iy = P.dy; if(!RM) part(P.x, P.y + 6, '#BFF0FF', 0, 0, .3, 2.5); }
    else if(P.mv && S.dashT <= 0){ const l = Math.hypot(ix, iy) || 1; S.dashT = pw.dash; P.dash = .18; P.dx = ix / l; P.dy = iy / l; S.dashId++; } }
  P.x += (ix * sp + P.kx) * dt; P.y += (iy * sp + P.ky) * dt; P.kx *= .86; P.ky *= .86;
  P.x = Math.max(8, Math.min(W - 8, P.x)); P.y = Math.max(16, Math.min(H - 48, P.y));
  if(ix > .1) P.face = 1; else if(ix < -.1) P.face = -1;
}
function nearest(x, y, r){ let b = null, bd = r * r; for(const f of FOES){ if(!f.on || f.x < -2 || f.x > W + 2 || f.y < -2) continue; const d = (f.x - x) ** 2 + (f.y - y) ** 2; if(d < bd){ bd = d; b = f; } } return b; }
function shoot(x, y, f, dmg, pierce, me){
  const s = take(SHOTS); if(!s) return; const dx = f.x - x, dy = f.y - y, m = Math.hypot(dx, dy) || 1, v = 210;
  s.x = x; s.y = y; s.vx = dx / m * v; s.vy = dy / m * v; s.t = (S.pw.rng + 30) / v; s.n = pierce; s.hit.length = 0; s.me = me;
  s.cr = rnd() < S.pw.crit; s.dmg = dmg;
}
function attack(dt){
  const pw = S.pw;
  P.cd -= dt;
  if(P.cd <= 0 && P.stun <= 0){ const tg = nearest(P.x, P.y, pw.rng); if(tg){ P.cd = pw.cd; shoot(P.x, P.y - 4, tg, pw.dmg, pw.pierce, 1); P.thr = .12; if(Math.abs(tg.x - P.x) > 4 && !P.mv) P.face = tg.x > P.x ? 1 : -1; } else P.cd = .05; }
  for(const g of S.guards){ g.cd -= dt; if(g.cd <= 0){ const tg = nearest(g.x, g.y, 64); if(tg){ g.cd = .75; shoot(g.x, g.y - 8, tg, pw.dmg * .7, 0, 0); } else g.cd = .1; } }
  // 돌고래 — 곁을 돌며 닿는 적을 친다
  for(let i = 0; i < pw.dolph; i++){ const a = S.t * 3.2 + i * 6.283 / pw.dolph, x = P.x + Math.cos(a) * 24, y = P.y + Math.sin(a) * 18;
    for(const f of FOES){ if(!f.on || f.dc > 0) continue; const r = FO[f.k].r + 6; if((f.x - x) ** 2 + (f.y - y) ** 2 < r * r){ f.dc = .4; hurt(f, pw.dmg * .8, false, f.x - P.x, f.y - P.y); } } }
  if(P.dash > 0) for(const f of FOES){ if(!f.on || f.dh === S.dashId) continue; const r = FO[f.k].r + 8; if((f.x - P.x) ** 2 + (f.y - P.y) ** 2 < r * r){ f.dh = S.dashId; hurt(f, pw.dmg * 1.5, false, P.dx, P.dy); } }
  for(const s of SHOTS){ if(!s.on) continue;
    s.x += s.vx * dt; s.y += s.vy * dt; s.t -= dt; if(s.t <= 0){ s.on = 0; continue; }
    for(const f of FOES){ if(!f.on || s.hit.includes(f.id)) continue; const r = FO[f.k].r + 2;
      if((f.x - s.x) ** 2 + (f.y - s.y) ** 2 < r * r){ s.hit.push(f.id); hurt(f, s.dmg, s.cr, s.vx, s.vy); if(--s.n < 0){ s.on = 0; break; } } } }
}
function hurt(f, dmg, cr, dx, dy){
  const F = FO[f.k]; if(cr) dmg *= 2;
  f.hp -= dmg; f.hit = .09;
  const kb = F.boss ? 0 : F.elite ? 14 : 60; if(kb && (dx || dy)){ const m = Math.hypot(dx, dy) || 1; f.kx += dx / m * kb; f.ky += dy / m * kb; }
  if(S.pw.slow){ f.sl = 1.2; f.slk = F.boss ? S.pw.slow * .4 : S.pw.slow; }
  if(F.boss || F.elite){ if(f.lagT <= 0 && f.lag - f.hp < 1) f.lagT = .45; }
  txt(f.x + (rnd() - .5) * 6, f.y - F.r - 3, Math.round(dmg), cr ? 2 : 1);
  if(f.hp <= 0) kill(f);
}
function kill(f){
  if(!f.on) return; f.on = 0; S.kills++; const F = FO[f.k], big = F.boss || F.elite;
  burst(f.x, f.y, F.col, F.boss ? 30 : big ? 16 : 8);
  for(let i = 0; i < F.sh; i++) if(big || rnd() < .75) drop(f.x + (rnd() - .5) * (big ? 30 : 8), f.y + (rnd() - .5) * (big ? 22 : 8));
  if(F.split){ spawn('bag', f.x - 6, f.y); spawn('bag', f.x + 6, f.y); }
  if(f === S.boss){ S.boss = null; S.sw = null; if(!RM) S.shake = .45; banner('round', `🎉 ${F.n} 격파!`, '조개를 주워요', 1.8); }
}
function foes(dt){
  let bite = 0;
  for(const f of FOES){ if(!f.on) continue;
    const F = FO[f.k]; f.t += dt; f.hit = Math.max(0, f.hit - dt); f.dc -= dt; f.sl -= dt;
    if(f.lagT > 0) f.lagT -= dt; else if(f.lag > f.hp) f.lag = Math.max(f.hp, f.lag - f.max * .4 * dt);
    const sp = F.sp * f.spm * (f.sl > 0 ? 1 - f.slk : 1);
    if(f.bite){ bite += F.bite; }
    else if(F.boss){ f.x += (SX + Math.sin(f.t * .45) * 70 - f.x) * dt; if(f.y < BY) f.y += sp * dt; }
    else if(F.fly){
      if(f.ph < 1.1){ f.ph += dt; f.x += (f.x < W / 2 ? 1 : -1) * 34 * dt; f.y += Math.sin(f.t * 5) * 12 * dt; }   // 빙빙 돌다가
      else { const dx = f.tx - f.x, dy = BY - f.y, m = Math.hypot(dx, dy) || 1; f.x += dx / m * sp * dt; f.y += dy / m * sp * dt; } }   // 학교로 내리꽂는다
    else if(f.k === 'crab' || f.k === 'elite'){ f.x += ((f.tx - f.x) * .25 + Math.sin(f.t * 2.6 + f.o) * sp * (f.k === 'elite' ? .5 : .9)) * dt; f.y += sp * .55 * dt; }   // 옆걸음 지그재그
    else { const dx = f.tx - f.x, dy = BY - f.y, m = Math.hypot(dx, dy) || 1; f.x += (dx / m * sp + (f.k === 'jelly' ? Math.sin(f.t * 2 + f.o) * 8 : 0)) * dt; f.y += dy / m * sp * dt; }
    f.x += f.kx * dt; f.y += f.ky * dt; f.kx *= .88; f.ky *= .88;
    f.x = Math.max(-10, Math.min(W + 10, f.x));
    if(f.y >= BY){ f.y = BY; if(Math.abs(f.x - SX) < 46) f.bite = 1; } else if(f.bite && f.y < BY - 3) f.bite = 0;
    if(F.spike && P.stun <= 0 && P.dash <= 0){ const r = F.r + 6, dx = P.x - f.x, dy = P.y - f.y;   // 성게 가시 — 부딪히면 기절하고 튕겨 난다
      if(dx * dx + dy * dy < r * r){ const m = Math.hypot(dx, dy) || 1; P.stun = .8; P.kx = dx / m * 160; P.ky = dy / m * 160; if(!RM) S.shake = Math.max(S.shake, .12); txt(P.x, P.y - 16, '따끔!', 3); } }
  }
  if(bite){ const d = bite * DIFF[S.df].bite * dt; S.hp -= d; S.bacc += d;
    if(S.lagT <= 0 && S.lag - S.hp < .5) S.lagT = .5;
    if(S.bacc > 4){ S.bacc = 0; if(!RM) S.shake = Math.max(S.shake, .2); txt(SX + (rnd() - .5) * 40, BY + 4, '-4', 4); } }
}
function boss(dt){
  const b = S.boss; if(!b) return; if(!b.on){ S.boss = null; return; }
  const F = FO[b.k], rage = b.hp < b.max * .5;
  b.se -= dt; if(b.se <= 0){ b.se = F.se * (rage ? .7 : 1); for(let i = 0; i < 3; i++) spawn(F.sum, b.x + (i - 1) * 18, b.y + 12); }
  if(b.k !== 'storm') return;
  // 폭풍 너울 — 빨간 줄로 예고한 뒤 가로 파도가 화면을 쓸고 간다. 분노(50%↓)면 예고가 짧고 두 줄
  if(!S.sw){ S.swc -= dt; if(S.swc <= 0){ const y1 = Math.max(SH, Math.min(H - 64, P.y)); S.sw = { ys:rage ? [y1, y1 < 200 ? y1 + 70 : y1 - 70] : [y1], t:0, warn:rage ? .8 : 1.2, x:-40, dir:rnd() < .5 ? 1 : -1, hit:0 }; S.swc = rage ? 3.6 : 5.5; } return; }
  const s = S.sw; s.t += dt; if(s.t < s.warn) return;
  const k = (s.t - s.warn) / .75; s.x = s.dir > 0 ? -40 + k * (W + 80) : W + 40 - k * (W + 80);
  if(!s.hit && P.dash <= 0) for(const y of s.ys) if(Math.abs(P.y - y) < 13 && Math.abs(P.x - s.x) < 18){ s.hit = 1; P.stun = 1.2; P.ky = -120; if(!RM) S.shake = .3; txt(P.x, P.y - 16, '꽈당!', 3); }
  if(k >= 1) S.sw = null;
}
function drop(x, y){ const d = take(DROPS); if(!d) return; d.x = Math.max(6, Math.min(W - 6, x)); d.y = Math.max(SH - 20, Math.min(H - 46, y)); d.t = 0; d.fly = 0; }
function drops(dt){
  const r2 = S.pw.mag * S.pw.mag;
  for(const d of DROPS){ if(!d.on) continue; d.t += dt;
    const dx = P.x - d.x, dy = P.y - d.y, q = dx * dx + dy * dy;
    if(!d.fly){ if(q < r2) d.fly = 1; else if(d.t > 9) d.on = 0; continue; }
    const m = Math.sqrt(q) || 1, v = 120 + d.t * 60; d.x += dx / m * v * dt; d.y += dy / m * v * dt;
    if(m < 7){ d.on = 0; S.shells++; S.got++; if(!RM) part(P.x, P.y - 6, '#FFE27A', (rnd() - .5) * 40, -30, .35, 2); } }
}
function roundDone(){
  if(S.r >= NR) return end(true);
  S.ph = 'shop'; S.st = SHOP; S.sw = null;
  for(const d of DROPS) if(d.on){ d.fly = 1; d.t = 0; }   // 라운드를 끝내면 남은 조개는 저절로 모인다
  offer(); banner('round', `라운드 ${S.r} 클리어!`, '정비 시간 — 카드를 골라요', 1.4); shopUI();
}
function offer(){
  const a = CARDS.filter(c => (S.lv[c.k] || 0) < c.max && !(c.k === 'heal' && S.hp >= S.max * .95));
  for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  S.offer = a.slice(0, 3).map(c => c.k); S.bought = [0, 0, 0];
}
const cost = k => S && S.free > 0 ? 0 : k === 'heal' ? CK.heal.c + S.heal * 2 : CK[k].c + (S.lv[k] || 0) * 5;
function buy(i){
  if(!S || S.ph !== 'shop' || S.bought[i]) return false; const k = S.offer[i]; if(!k) return false; const c = cost(k); if(S.shells < c) return false;
  S.shells -= c; S.bought[i] = 1; if(S.free > 0) S.free--;
  if(k === 'heal'){ S.heal++; S.hp = Math.min(S.max, S.hp + S.max * .35); txt(SX, BY - 6, '+HP', 5); }
  else { S.lv[k] = (S.lv[k] || 0) + 1; if(k === 'guard') S.guards.push({ x:P.x, y:P.y, cd:0 }); power(); }
  burst(P.x, P.y, '#FFE27A', 10); shopUI(); return true;
}
function reroll(){ if(!S || S.ph !== 'shop' || S.shells < S.rr) return false; S.shells -= S.rr; S.rr++; offer(); shopUI(); return true; }
function go(){ if(S && S.ph === 'shop'){ startRound(); ctl(); } }
function ult(){
  if(!S || S.ph !== 'fight' || !S.ult || S.paused) return false;
  S.ult = 0; S.big = 0; S.sw = null; if(!RM) S.shake = .5;
  for(let pass = 0; pass < 2; pass++) for(const f of FOES){ if(!f.on) continue; if(FO[f.k].boss){ if(!pass) hurt(f, f.max * .3, false, 0, -1); } else kill(f); }
  ctl(); return true;
}
function end(win){
  S.ph = 'done'; S.res = win ? 'win' : 'lose'; window._gameRun = false; stick = null;
  const cleared = win ? NR : S.r - 1;
  S.earned = Math.min(60, cleared * 2 + (win ? 10 + S.df * 6 : 0));
  R = { best:cleared, gain:0 };
  if(!noRw) try{ if(typeof playDefendDone === 'function') R = playDefendDone(cleared, win, S.earned, S.df) || R; }catch(e){}
  shopUI(); ctl(); if(!botOn) over();
}

/* 효과 — 파편·숫자 */
function part(x, y, c, vx, vy, life, s){ const p = take(PARTS); if(!p) return; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.t = 0; p.l = life; p.c = c; p.s = s; }
function burst(x, y, c, n){ if(RM) n = Math.min(n, 4); for(let i = 0; i < n; i++){ const a = rnd() * 6.28, v = 30 + rnd() * 60; part(x, y, i % 3 ? c : '#FFFFFF', Math.cos(a) * v, Math.sin(a) * v, .35 + rnd() * .25, 1.5 + rnd() * 1.5); } }
function txt(x, y, v, k){ const t = take(TXTS); if(!t) return; t.x = x; t.y = y; t.v = v; t.k = k; t.t = 0; }
function fx(dt){
  for(const p of PARTS){ if(!p.on) continue; p.t += dt; if(p.t > p.l){ p.on = 0; continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .93; p.vy *= .93; }
  for(const t of TXTS){ if(!t.on) continue; t.t += dt; if(t.t > .7){ t.on = 0; continue; } t.y -= 20 * dt; }
}

/* 시험·균형용 봇 — 학교에 가장 가까운 적과 학교 사이에 서서 쏘고, 성게·빨간 줄을 피하고, 공격 강화부터 산다 */
function botIn(){
  let tx = P.x, ty = P.y, b = null, bs = -1e9;
  for(const f of FOES){ if(!f.on || f.x < -4 || f.x > W + 4) continue; const sc = f.y + (f.bite ? 80 : 0) - (FO[f.k].boss ? 60 : 0); if(sc > bs){ bs = sc; b = f; } }
  if(b){ tx = b.x; ty = Math.min(H - 50, b.y + S.pw.rng * .55); }
  else { let bd = 1e9; for(const d of DROPS){ if(!d.on) continue; const q = (d.x - P.x) ** 2 + (d.y - P.y) ** 2; if(q < bd){ bd = q; tx = d.x; ty = d.y; } } }
  if(S.sw) for(const y of S.sw.ys){ if(Math.abs(ty - y) < 22) ty = y + (P.y > y ? 26 : -26); }
  let vx = tx - P.x, vy = ty - P.y; const m = Math.hypot(vx, vy); if(m > .5){ const k = Math.min(1, m / 6) / m; vx *= k; vy *= k; } else vx = vy = 0;
  for(const f of FOES){ if(!f.on || !FO[f.k].spike) continue; const dx = P.x - f.x, dy = P.y - f.y, q = dx * dx + dy * dy; if(q < 22 * 22){ const l = Math.sqrt(q) || 1; vx += dx / l * 1.5; vy += dy / l * 1.5; } }
  IN[0] = vx; IN[1] = vy;
}
const BUYP = ['atk', 'rate', 'pierce', 'crit', 'dolph', 'rng', 'guard', 'ice', 'dash', 'move', 'magnet'];
function botShop(){
  for(let n = 0; n < 4; n++){ let bi = -1, bp = 99;
    S.offer.forEach((k, i) => { if(S.bought[i] || cost(k) > S.shells) return; const p = k === 'heal' ? (S.hp < S.max * .55 ? -1 : 98) : BUYP.indexOf(k); if(p < bp){ bp = p; bi = i; } });
    if(bi < 0 || !buy(bi)) break; }
}
function botTick(){ if(S.ph === 'fight' && S.ult && (S.hp < S.max * .35 || (S.boss && S.boss.k === 'storm' && S.boss.y > BY - 70))) ult(); }

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
    c.strokeStyle = '#1C1530'; c.lineWidth = .9; c.beginPath(); c.moveTo(-r * .48, -r * .38); c.lineTo(-r * .12, -r * .22); c.moveTo(r * .48, -r * .38); c.lineTo(r * .12, -r * .22); c.stroke();   // 화난 눈썹
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
  }
};
const LOOK = { jelly:['jelly'], crab:['crab'], urch:['urch'], trash:['trash'], bag:['bag'], gull:['gull'], elite:['crab', 1], king:['jelly', 1] };
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

function draw(){
  const c = ctx; if(!c) return; const t = S ? S.t : performance.now() / 1000;
  c.setTransform(K, 0, 0, K, 0, 0); c.save();
  if(S && S.shake > 0 && !RM){ const a = Math.min(1, S.shake * 5) * 3; c.translate((Math.random() - .5) * a, (Math.random() - .5) * a); }
  const map = window.scenery && scenery.shore(W, H, SH);
  if(map) c.drawImage(map, -4, -4, W + 8, H + 8);
  else { c.fillStyle = '#17679F'; c.fillRect(-4, -4, W + 8, SH + 4); c.fillStyle = '#F2DDA6'; c.fillRect(-4, SH, W + 8, H - SH + 4); }
  // 움직이는 물결 — 바다의 너울 줄 + 모래에 닿는 거품
  if(!RM){ c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1; for(let i = 0; i < 6; i++){ const y = (i * 22 + t * 9) % (SH - 10) + 4, o = Math.sin(i * 2.1) * 40; c.beginPath(); c.moveTo(o + 20, y); c.quadraticCurveTo(o + 60, y - 3, o + 100, y); c.moveTo(o + 140, y + 6); c.quadraticCurveTo(o + 170, y + 3, o + 200, y + 6); c.stroke(); } }
  const fy = SH + (RM ? 0 : Math.sin(t * .9) * 3);
  c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.moveTo(-4, fy - 2); for(let x = -4; x <= W + 4; x += 6) c.lineTo(x, fy + Math.sin(x / 13 + (RM ? 0 : t * 1.6)) * 2.2); c.lineTo(W + 4, fy + 5); c.lineTo(-4, fy + 5); c.fill();
  c.fillStyle = 'rgba(99,207,214,.25)'; c.fillRect(-4, fy + 5, W + 8, 5);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  // 학교 간판
  c.fillStyle = '#FF8A3D'; rr(c, 92, H - 29, 56, 11, 2); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 7px sans-serif'; c.fillText('낙산 서핑학교', SX, H - 23.3);
  if(!S){ c.restore(); return; }
  // 폭풍 너울 예고 줄 / 쓸고 가는 파도
  if(S.sw){ const s = S.sw;
    for(const y of s.ys){ if(s.t < s.warn){ const a = .18 + .14 * Math.sin(s.t * 22); c.fillStyle = `rgba(255,60,60,${a})`; c.fillRect(0, y - 13, W, 26); c.strokeStyle = 'rgba(255,70,70,.85)'; c.setLineDash([5, 4]); c.lineWidth = 1; c.beginPath(); c.moveTo(0, y - 13); c.lineTo(W, y - 13); c.moveTo(0, y + 13); c.lineTo(W, y + 13); c.stroke(); c.setLineDash([]); c.fillStyle = '#FF4646'; c.font = 'bold 12px sans-serif'; c.fillText('!', s.dir > 0 ? 10 : W - 10, y + 1); }
      else { const x0 = s.dir > 0 ? -40 : s.x, x1 = s.dir > 0 ? s.x : W + 40; c.fillStyle = 'rgba(120,200,240,.35)'; c.fillRect(x0, y - 12, x1 - x0, 24);
        const g = c.createLinearGradient(s.x - 20 * s.dir, 0, s.x + 6 * s.dir, 0); g.addColorStop(0, 'rgba(44,123,192,.0)'); g.addColorStop(.6, '#3D9BE0'); g.addColorStop(1, '#FFFFFF'); c.fillStyle = g;
        c.beginPath(); c.moveTo(s.x - 26 * s.dir, y + 13); c.quadraticCurveTo(s.x - 4 * s.dir, y + 10, s.x + 6 * s.dir, y - 2); c.quadraticCurveTo(s.x + 2 * s.dir, y - 15, s.x - 12 * s.dir, y - 14); c.lineTo(s.x - 26 * s.dir, y - 13); c.closePath(); c.fill(); } } }
  // 조개
  for(const d of DROPS){ if(!d.on) continue; if(d.t > 6.5 && !d.fly && Math.floor(d.t * 8) % 2) continue; const z = d.fly ? 0 : Math.max(0, Math.sin(Math.min(1, d.t * 3) * Math.PI)) * 5;
    c.fillStyle = 'rgba(80,60,30,.25)'; c.beginPath(); c.ellipse(d.x, d.y + 2, 2.6, 1, 0, 0, 7); c.fill();
    c.fillStyle = '#FFE7C2'; c.strokeStyle = '#C98A4B'; c.lineWidth = .6; c.beginPath(); c.moveTo(d.x - 3, d.y - z + 1); c.quadraticCurveTo(d.x, d.y - z - 5, d.x + 3, d.y - z + 1); c.closePath(); c.fill(); c.stroke(); }
  // 라이프가드 포탑
  for(const g of S.guards){ c.fillStyle = 'rgba(80,60,30,.25)'; c.beginPath(); c.ellipse(g.x, g.y + 5, 7, 2.5, 0, 0, 7); c.fill(); c.fillStyle = '#C0392B'; c.fillRect(g.x - 6, g.y - 4, 12, 9); c.fillStyle = '#fff'; c.fillRect(g.x - 6, g.y - 1, 12, 2); c.font = '10px sans-serif'; c.fillText('🛟', g.x, g.y - 9); }
  // 적
  for(const f of FOES){ if(!f.on) continue; const F = FO[f.k];
    c.fillStyle = 'rgba(10,30,50,.22)'; c.beginPath(); c.ellipse(f.x, f.y + F.r * .9 + (F.fly ? 8 : 0), F.r * .9, F.r * .3, 0, 0, 7); c.fill();
    if(f.k === 'storm'){ drawStorm(c, f, t); }
    else { const sp = SPR[f.k]; if(!sp) continue; const q = RM ? 0 : Math.sin(f.t * (F.fly ? 14 : 6) + f.o) * .07, sx = F.fly ? 1 + q * 2.5 : 1 + q, sy = F.fly ? 1 : 1 - q;
      c.save(); c.translate(f.x, f.y); if(F.fly && f.ph >= 1.1) c.rotate(Math.atan2(BY - f.y, f.tx - f.x) - Math.PI / 2); c.scale(sx, sy); c.drawImage(f.hit > 0 ? sp.w : sp.n, -sp.s / 2, -sp.s / 2, sp.s, sp.s); c.restore(); }
    if(f.sl > 0){ c.fillStyle = 'rgba(160,230,255,.85)'; c.font = '6px sans-serif'; c.fillText('❄', f.x + F.r, f.y - F.r); }
    if(!F.boss && f.hp < f.max){ const w = Math.max(12, F.r * 2); bar(c, f.x - w / 2, f.y - F.r - 6, w, 2, f.hp / f.max, f.lag / f.max, F.elite ? '#FFB020' : '#7BD389'); } }
  // 탄 — 서프 왁스 덩어리
  for(const s of SHOTS){ if(!s.on) continue; c.fillStyle = s.me ? (s.cr ? '#FFE27A' : '#FFFFFF') : '#FF9E9E'; c.strokeStyle = 'rgba(20,48,79,.6)'; c.lineWidth = .6; c.beginPath(); c.arc(s.x, s.y, s.cr ? 2.8 : 2.2, 0, 7); c.fill(); c.stroke();
    if(!RM){ c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x - s.vx * .025, s.y - s.vy * .025); c.stroke(); } }
  // 범위 원 — 가만히 있을 때만(움직일 땐 화면을 가리지 않게)
  if(!P.mv && S.ph === 'fight'){ c.strokeStyle = 'rgba(255,255,255,.45)'; c.setLineDash([3, 4]); c.lineWidth = 1; c.beginPath(); c.arc(P.x, P.y, S.pw.rng, 0, 7); c.stroke(); c.setLineDash([]); }
  // 플레이어
  const bob = P.mv ? Math.abs(Math.sin(t * 12)) * 2.2 : Math.sin(t * 3) * .5, sq = P.thr > 0 ? .92 : P.mv ? 1 + Math.sin(t * 24) * .05 : 1 + Math.sin(t * 3) * .02;
  c.fillStyle = 'rgba(10,30,50,.28)'; c.beginPath(); c.ellipse(P.x, P.y + 9, 8, 2.8, 0, 0, 7); c.fill();
  c.save(); c.translate(P.x, P.y + 9 - bob); c.scale(P.face * (2 - sq), sq); if(P.dash > 0) c.globalAlpha = .75;
  if(PS) c.drawImage(PS.c, -PS.w / 2, -PS.h, PS.w, PS.h);
  else { c.fillStyle = '#FFF6EA'; c.strokeStyle = '#14304F'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, -10, 10, 9, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#14304F'; c.fillRect(-4, -12, 2, 3); c.fillRect(3, -12, 2, 3); }
  c.restore();
  if(P.stun > 0){ c.font = '9px sans-serif'; for(let i = 0; i < 3; i++){ const a = t * 6 + i * 2.1; c.fillText('⭐', P.x + Math.cos(a) * 9, P.y - 24 + Math.sin(a) * 3); } }
  // 돌고래 친구
  for(let i = 0; i < S.pw.dolph; i++){ const a = t * 3.2 + i * 6.283 / S.pw.dolph; c.font = '11px sans-serif'; c.fillText('🐬', P.x + Math.cos(a) * 24, P.y + Math.sin(a) * 18); }
  // 파편·숫자
  for(const p of PARTS){ if(!p.on) continue; c.globalAlpha = 1 - p.t / p.l; c.fillStyle = p.c; c.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); } c.globalAlpha = 1;
  for(const x of TXTS){ if(!x.on) continue; c.globalAlpha = Math.min(1, (.7 - x.t) * 4); const big = x.k === 2 || x.k === 3;
    c.font = `bold ${big ? 10 : 7}px sans-serif`; c.lineWidth = 2; c.strokeStyle = 'rgba(11,37,64,.85)'; const v = x.k === 2 ? x.v + '!' : String(x.v);
    c.strokeText(v, x.x, x.y); c.fillStyle = x.k === 2 ? '#FFE27A' : x.k === 4 ? '#FF6B6B' : x.k === 5 ? '#7BD389' : x.k === 3 ? '#FFB3B3' : '#FFFFFF'; c.fillText(v, x.x, x.y); } c.globalAlpha = 1;
  // 큰 파도 — 아래에서 위로 화면을 쓸어 올린다
  if(S.big >= 0){ const y = H - S.big / 1.1 * (H + 90); const g = c.createLinearGradient(0, y, 0, y + 90); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.25, 'rgba(110,200,245,.75)'); g.addColorStop(1, 'rgba(44,123,192,0)'); c.fillStyle = g; c.fillRect(0, y, W, 90); }
  c.restore();
  // 학교 체력(지연 바) — 흔들리지 않게 화면에 고정
  const hr = S.hp / S.max; bar(c, 70, H - 12, 100, 5, hr, S.lag / S.max, hr > .5 ? '#5BD38A' : hr > .25 ? '#FFC94D' : '#FF5A5A');
  c.textAlign = 'center'; c.font = 'bold 6.5px sans-serif'; c.lineWidth = 2; c.strokeStyle = 'rgba(11,37,64,.85)'; c.strokeText(`🏫 ${Math.ceil(S.hp)}`, 56, H - 9.5); c.fillStyle = '#fff'; c.fillText(`🏫 ${Math.ceil(S.hp)}`, 56, H - 9.5);
  // 위 안내 — 라운드·남은 적 / 다음 라운드 예고
  const left = S.ph === 'fight' ? alive() + S.q.length - S.qi : 0;
  chip(c, 4, 4, S.ph === 'shop' ? `R${S.r}/${NR} · 정비 ${Math.ceil(S.st)}초` : `R${S.r}/${NR} · 남은 적 ${left}`, 'rgba(11,37,64,.8)');
  if(S.r < NR) chip(c, 4, 20, `다음: ${preview(S.r)}`, 'rgba(255,255,255,.88)', '#14304F');
  chip(c, 4, 36, `🐚 ${S.shells}`, 'rgba(255,226,122,.92)', '#14304F');
  if(S.boss){ const b = S.boss; c.textAlign = 'center'; c.font = 'bold 8px sans-serif'; c.lineWidth = 2.5; c.strokeStyle = 'rgba(11,37,64,.9)'; c.strokeText(FO[b.k].n, SX, 60); c.fillStyle = '#FFD1D1'; c.fillText(FO[b.k].n, SX, 60); bar(c, 40, 66, 160, 5, b.hp / b.max, b.lag / b.max, b.hp < b.max * .5 ? '#FF3D3D' : '#FF7A59'); }
  // 띠 배너 — 라운드 제목 / 보스 등장
  if(S.ban){ const b = S.ban, k = b.tm / b.d, a = k < .12 ? k / .12 : k > .82 ? (1 - k) / .18 : 1, sl = RM ? 0 : (1 - Math.min(1, k / .12)) * -60, y = 150, bh = b.k === 'boss' ? 44 : 36;
    c.save(); c.globalAlpha = Math.max(0, a); c.translate(sl, 0);
    if(b.k === 'boss'){ c.fillStyle = 'rgba(20,6,10,.85)'; c.fillRect(0, y - bh / 2, W, bh); c.fillStyle = '#E8343A'; for(let x = -20 + (t * 30) % 16; x < W; x += 16){ c.beginPath(); c.moveTo(x, y - bh / 2); c.lineTo(x + 8, y - bh / 2); c.lineTo(x + 4, y - bh / 2 + 4); c.lineTo(x - 4, y - bh / 2 + 4); c.fill(); c.beginPath(); c.moveTo(x, y + bh / 2); c.lineTo(x + 8, y + bh / 2); c.lineTo(x + 4, y + bh / 2 - 4); c.lineTo(x - 4, y + bh / 2 - 4); c.fill(); } }
    else { c.fillStyle = 'rgba(11,37,64,.82)'; c.fillRect(0, y - bh / 2, W, bh); c.fillStyle = '#FFE27A'; c.fillRect(0, y - bh / 2, W, 1.5); c.fillRect(0, y + bh / 2 - 1.5, W, 1.5); }
    c.textAlign = 'center'; c.fillStyle = b.k === 'boss' ? '#FFD1D1' : '#FFFFFF'; c.font = 'bold 15px sans-serif'; c.fillText(b.t, SX, y - (b.s ? 5 : 0)); if(b.s){ c.font = 'bold 8px sans-serif'; c.fillStyle = '#FFE27A'; c.fillText(b.s, SX, y + 11); } c.restore(); }
  // 스틱
  c.textAlign = 'center';
  if(stick){ c.strokeStyle = 'rgba(255,255,255,.6)'; c.fillStyle = 'rgba(11,37,64,.25)'; c.lineWidth = 1.5; c.beginPath(); c.arc(stick.bx, stick.by, SR, 0, 7); c.fill(); c.stroke();
    const dx = stick.x - stick.bx, dy = stick.y - stick.by, m = Math.hypot(dx, dy), k = m > SR ? SR / m : 1; c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(stick.bx + dx * k, stick.by + dy * k, 11, 0, 7); c.fill(); }
  else if(S.hint > 0 && S.ph === 'fight'){ c.globalAlpha = Math.min(1, S.hint); const hx = 52, hy = H - 92, o = RM ? 0 : Math.sin(t * 3) * 12;
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5; c.beginPath(); c.arc(hx, hy, SR, 0, 7); c.stroke(); c.font = '16px sans-serif'; c.fillText('👆', hx + o, hy + 4);
    chip(c, hx, hy + SR + 6, '끌어서 이동 · 자동 공격', 'rgba(11,37,64,.85)', '#fff', 'c'); c.globalAlpha = 1; }
  if(S.paused){ c.fillStyle = 'rgba(11,37,64,.6)'; c.fillRect(0, 0, W, H); c.textAlign = 'center'; c.fillStyle = '#fff'; c.font = 'bold 18px sans-serif'; c.fillText('⏸ 멈춤', SX, 170); c.font = 'bold 9px sans-serif'; c.fillText('화면을 누르면 계속', SX, 190); }
}
function drawStorm(c, f, t){
  const r = FO.storm.r, rage = f.hp < f.max * .5;
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

/* 덮개 — 시작(난이도·방법) / 결과 */
const best = () => { const d = (typeof ME !== 'undefined' && ME && ME.profile && ME.profile.play && ME.profile.play.df) || {}; const n = v => { const x = Math.floor(+v); return Number.isFinite(x) ? Math.max(0, Math.min(9999, x)) : 0; }; return { b:Math.min(NR, n(d.best)), c:n(d.clears) }; };
function over(){
  const ov = $d('d-ov'), b = best(); ov.hidden = false;
  const mode = `<div class="go-mode" role="group" aria-label="난이도">${DIFF.map((x, i) => `<button type="button" data-df="${i}" aria-pressed="${i === diff}">${x.n}</button>`).join('')}</div>`;
  if(!S || S.ph !== 'done'){
    ov.innerHTML = `<div class="go-card"><div class="go-t">🛡️ 해변 수호</div>
      <div class="go-d">바다에서 골칫거리가 <b>낙산 서핑학교</b>로 몰려와요.<br><b>스틱으로 움직이면 자동 공격!</b> 15라운드 끝의 폭풍 너울까지 학교를 지켜요.</div>
      <div class="go-r"><span>👆 화면을 눌러 끌면 스틱 · PC는 방향키/WASD</span><span>🐚 쓰러뜨린 자리의 조개를 주워 정비 시간에 강화</span><span>🌊 큰 파도는 한 판에 한 번 · 성게에 부딪히면 기절</span></div>
      ${mode}<div class="go-b">최고 <b>${b.b}</b>/${NR} 라운드 · 수호 성공 <b>${b.c}</b>번</div>
      <button class="btn" id="d-go" type="button" style="width:100%">🌊 시작</button></div>`;
  } else {
    const win = S.res === 'win', nm = typeof ME !== 'undefined' && ME && ME.name ? esc(ME.name) : '';
    ov.innerHTML = `<div class="go-card"><div class="go-t">${win ? '🏆 학교를 지켰어요!' : '🌊 학교가 잠겼어요'}</div>
      <div class="go-d">${win ? `${nm ? nm + ' 님이 ' : ''}폭풍 너울까지 막아냈어요 (${DIFF[S.df].n})` : `라운드 ${S.r}에서 밀렸어요. 공격력·공속 카드부터 사 봐요`}</div>
      <div class="go-st"><span>도달 라운드<b>${S.r}/${NR}</b></span><span>처치<b>${S.kills}</b></span><span>받은 조개<b>${S.got}</b></span><span>보상<b>🐚${R && R.shells || S.earned}${R && R.x2 ? ' ×2' : ''}</b></span></div>
      <div class="go-b">XP +${R && R.gain || 0}${R && R.best ? ` · 최고 ${Math.min(NR, R.best)}/${NR} 라운드` : ''}</div>
      ${typeof upNudge === 'function' ? upNudge('defend', { sc:win ? NR : S.r - 1, best:R && R.best || 0, u:'라운드', x2:R && R.x2 }) : ''}
      ${mode}<div class="d-row"><button class="btn" id="d-go" type="button">🔁 한 판 더</button><button class="btn ghost" id="d-close" type="button">닫기</button></div></div>`;
    $d('d-close').onclick = defendClose;
  }
  ov.querySelectorAll('[data-df]').forEach(x => x.onclick = () => { diff = +x.dataset.df; try{ localStorage.setItem(LS, diff); }catch(e){} ov.querySelectorAll('[data-df]').forEach(y => y.setAttribute('aria-pressed', y === x)); });
  $d('d-go').onclick = () => start(diff);
}

/* 정비 상점 — 카드는 살 수 있는지가 바뀔 때만 다시 그린다(누르는 중 버튼이 바뀌어 탭이 씹히지 않게). 초·조개 수는 글자만 바꾼다 */
let shopKey = '';
function shopUI(){
  const el = $d('d-bar'); if(!el) return;
  if(!S || S.ph !== 'shop'){ if(!el.hidden){ el.hidden = true; el.innerHTML = ''; } shopKey = ''; return; }
  const key = [S.offer, S.bought, S.offer.map(k => S.shells >= cost(k)), S.shells >= S.rr].join('|'); if(key === shopKey && !el.hidden) return; shopKey = key;
  el.hidden = false;
  el.innerHTML = `<div class="d-sh"><b>🔧 정비 시간 <span id="d-st">${Math.ceil(S.st)}</span>초</b><b>🐚 <span id="d-shs">${S.shells}</span></b></div><div class="d-cards">${S.offer.map((k, i) => { const C = CK[k], lv = S.lv[k] || 0, c = cost(k);
      return S.bought[i] ? `<button type="button" class="d-card on" disabled><i>✅</i><b>${C.n}</b><small>샀어요</small></button>`
        : `<button type="button" class="d-card" data-buy="${i}" ${S.shells < c ? 'disabled' : ''}><i>${C.ic}</i><b>${C.n}</b><small>${C.d}</small><em>${k === 'heal' ? '즉시' : `Lv${lv}→${lv + 1}`}</em><u>${c ? '🐚' + c : '🎟️ 무료'}</u></button>`; }).join('')}</div>
    <div class="d-row"><button type="button" class="btn sm ghost" data-rr ${S.shells < S.rr ? 'disabled' : ''}>🔄 바꾸기 🐚${S.rr}</button><button type="button" class="btn sm" data-gonext>출발 ▶</button></div>`;
  el.querySelectorAll('[data-buy]').forEach(x => x.onclick = () => buy(+x.dataset.buy));
  el.querySelector('[data-rr]').onclick = reroll; el.querySelector('[data-gonext]').onclick = go;
}
let ctlKey = '';
function ctl(){
  const p = $d('d-pause'), sp = $d('d-speed'), a = $d('d-act'); if(!p) return;
  const on = !!(S && S.ph !== 'done'), k = [on, S && S.paused, speed, S && S.ult, S && S.ph].join(); if(k === ctlKey) return; ctlKey = k;
  p.disabled = sp.disabled = !on;
  p.textContent = S && S.paused ? '▶' : '⏸'; p.setAttribute('aria-label', S && S.paused ? '계속하기' : '멈추기'); p.setAttribute('aria-pressed', !!(S && S.paused));
  sp.textContent = `×${speed}`; sp.setAttribute('aria-label', `배속 ${speed}배`);
  a.disabled = !on || !S.ult || S.ph !== 'fight' || S.paused; a.innerHTML = S && !S.ult ? '<b>🌊</b><small>사용함</small>' : '<b>🌊</b><small>큰 파도</small>';
  a.classList.toggle('used', !!(S && !S.ult));
}
let hudKey = '';
function ui(){
  const h = $d('d-hud'); const k = S ? `🐚${S.shells} · 🏫${Math.ceil(S.hp)}` : ''; if(h && k !== hudKey){ hudKey = k; h.textContent = k; }
  if(!S) return; shopUI(); ctl();
  if(S.ph === 'shop'){ const st = $d('d-st'), sh = $d('d-shs'), v = String(Math.max(0, Math.ceil(S.st))); if(st && st.textContent !== v) st.textContent = v; if(sh && sh.textContent !== String(S.shells)) sh.textContent = S.shells; }
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

/* 조작 — 화면 어디든 엄지를 대면 그 자리에 스틱이 생기고, 멀리 끌면 스틱 받침이 따라온다 */
function lp(e){ const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
function pd(e){
  if(!S || S.ph === 'done') return; e.preventDefault();
  if(S.paused){ S.paused = false; return; }
  if(stick) return; const [x, y] = lp(e); stick = { id:e.pointerId, bx:x, by:y, x, y }; try{ cv.setPointerCapture(e.pointerId); }catch(_){}
}
function pm(e){ if(!stick || e.pointerId !== stick.id) return; const [x, y] = lp(e); stick.x = x; stick.y = y; const dx = x - stick.bx, dy = y - stick.by, m = Math.hypot(dx, dy); if(m > SR * 1.4){ const k = (m - SR * 1.4) / m; stick.bx += dx * k; stick.by += dy * k; } }
function pu(e){ if(stick && e.pointerId === stick.id) stick = null; }
const KM = { ArrowLeft:'l', a:'l', A:'l', ArrowRight:'r', d:'r', D:'r', ArrowUp:'u', w:'u', W:'u', ArrowDown:'d', s:'d', S:'d' };

function defendOpen(){
  wire(); cv = $d('d-cv'); ctx = cv.getContext('2d');
  $d('defend').hidden = false; document.body.classList.add('game-on');
  S = null; R = null; loadMe(); fit(); over(); shopUI(); ctlKey = ''; ctl();
  last = 0; acc = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
}
function defendClose(){
  cancelAnimationFrame(raf); raf = 0; S = null; stick = null; window._gameRun = false;
  $d('defend').hidden = true; document.body.classList.remove('game-on'); shopUI();
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
    if(KM[e.key]){ KEYS[KM[e.key]] = 1; e.preventDefault(); } else if(e.key === ' ' && S && S.ph !== 'done'){ S.paused = !S.paused; e.preventDefault(); } });
  addEventListener('keyup', e => { if(KM[e.key]) KEYS[KM[e.key]] = 0; });
  addEventListener('resize', () => { if(!$d('defend').hidden) fit(); });
  document.addEventListener('visibilitychange', () => { if(S && document.hidden && S.ph !== 'done'){ S.paused = true; stick = null; } last = 0; });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
window.defendOpen = defendOpen; window.defendClose = defendClose;

/* 시험·균형용 손잡이 */
function killAll(withBoss){ for(let p = 0; p < 3; p++) for(const f of FOES) if(f.on && (withBoss || !FO[f.k].boss)) kill(f); }
function skip(r){ if(!S) return; for(const a of [FOES, SHOTS]) for(const o of a) o.on = 0; S.boss = null; S.sw = null; S.r = r - 1; startRound(); }
window._defend = { get S(){ return S; }, get P(){ return P; }, get stick(){ return stick; }, start, step, buy, reroll, go, ult, skip, killAll, FIX, NR, ROUNDS, CARDS, DIFF,
  fast(sec){ for(let k = 0; S && S.ph !== 'done' && k < sec / FIX; k++) step(FIX); },
  lose(){ if(S && S.ph !== 'done'){ S.hp = 0; step(FIX); } },
  win(){ if(!S) return; skip(NR); S.qi = S.q.length; for(const o of S.q) spawn(o.k); killAll(true); step(FIX); },
  run(df, sd, rw){ noRw = !rw; botOn = 1; start(df, sd); let f = 0;
    const rt = []; let r0 = 0;
    while(S.ph !== 'done' && S.t < 1200){ if(S.ph === 'shop'){ rt.push(Math.round(f - r0)); r0 = f; botShop(); go(); } step(FIX); if(S.ph === 'fight') f += FIX; }
    const o = { res:S.res, r:S.r, kills:S.kills, t:Math.round(f), hp:Math.round(S.hp), got:S.got, rt:rt.join(), lv:JSON.stringify(S.lv) }; botOn = 0; noRw = false; over(); return o; }
};
})();
