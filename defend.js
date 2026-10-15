/* 🛡️ 해변 수호 — 바다에서 밀려오는 골칫거리(해파리·성게·쓰레기·폭풍 너울)를 수호대로 막는 한 손 디펜스.
   빈 자리(○)를 눌러 수호대를 놓고, 놓인 수호대를 눌러 강화·회수. 12파도, 7파도 중간 보스·12파도 보스.
   캔버스는 논리 240×300(2배 해상도로 그림) — 글씨·이모지가 흐리지 않게. 고정 간격(FIX)으로 굴려 2배속에서도 결과가 같다. */
(function(){
const $d = id => document.getElementById(id);
const RM = (()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })();   // 물결·흔들림·파편을 끈다
const W = 240, H = 300, SH = 116, FIX = 1 / 60, NW = 12, TS = 1.25;   // TS: 1배속도 실제로는 1.25배로 — 한 판 3~4분에 맞춘다
const LS = 'lineup.share.ddiff';

/* 물길 — 바다(위)에서 해변 서핑학교(아래)까지 지그재그. 길이를 미리 재 둔다 */
const P = [[30,-14],[30,60],[210,60],[210,130],[30,130],[30,200],[210,200],[210,248],[120,248],[120,288]];
const SEG = []; let END = 0;
for(let i = 1; i < P.length; i++){ const [ax, ay] = P[i-1], [bx, by] = P[i], l = Math.hypot(bx - ax, by - ay); SEG.push({ ax, ay, bx, by, a:END, l }); END += l; }
function posAt(d){ for(const s of SEG) if(d <= s.a + s.l){ const k = Math.max(0, (d - s.a) / s.l); return [s.ax + (s.bx - s.ax) * k, s.ay + (s.by - s.ay) * k]; } return [P[P.length-1][0], P[P.length-1][1]]; }
const SLOTS = [[80,26],[130,26],[180,26],[70,95],[120,95],[170,95],[70,165],[120,165],[170,165],[75,226],[165,226],[70,274],[170,274]];

/* 수호대 — 단일 강타 / 범위 / 감속 / 조개 수집. 강화 2번(Lv3)까지 */
const TW = {
  guard:{ ic:'🛟', n:'라이프가드', d:'한 마리 강타', c:50,  col:'#FF6B6B', dmg:15, rng:48, rate:.7 },
  dolph:{ ic:'🐬', n:'돌고래',     d:'튀어 올라 범위', c:75, col:'#4FB3E8', dmg:9,  rng:42, rate:1.2, spl:24 },
  board:{ ic:'🏄', n:'서핑보드',   d:'막아서 느리게', c:45, col:'#FFC94D', dmg:2,  rng:36, rate:.5, slow:.45 },
  diver:{ ic:'🤿', n:'해녀',       d:'조개 줍기·가시 무시', c:60, col:'#7BD389', dmg:6, rng:38, rate:.9, pierce:1, inc:3 }
};
const TK = Object.keys(TW);
const upC = t => Math.round(TW[t.k].c * (t.lv === 1 ? .8 : 1.2));
const st = t => { const b = TW[t.k], m = Math.pow(1.55, t.lv - 1);
  return { dmg:b.dmg * m, rng:b.rng + (t.lv - 1) * 4, rate:b.rate * Math.pow(.88, t.lv - 1), spl:b.spl ? b.spl + (t.lv - 1) * 3 : 0, slow:b.slow ? Math.min(.65, b.slow + (t.lv - 1) * .08) : 0, inc:b.inc ? b.inc + (t.lv - 1) * 2 : 0 }; };

/* 골칫거리 — 가시(arm)는 받는 피해를 깎는다(해녀는 무시). 쓰레기 더미는 부서지면 비닐 둘 */
const FO = {
  jelly:{ n:'해파리', hp:22, sp:58, rw:4, lk:1, r:7, col:'#F49AC1' },
  crab: { n:'꽃게',   hp:16, sp:86, rw:3, lk:1, r:6, col:'#E8613C' },
  urch: { n:'성게',   hp:48, sp:42, rw:7, lk:1, r:7, col:'#3B2D5C', arm:4 },
  trash:{ n:'쓰레기 더미', hp:110, sp:34, rw:10, lk:2, r:9, col:'#8A7A62', split:1 },
  bag:  { n:'비닐',   hp:14, sp:70, rw:2, lk:1, r:5, col:'#DDE6EE' },
  king: { n:'대왕 해파리', hp:650, sp:26, rw:60, lk:5, r:14, col:'#C774E8', arm:2, boss:1, sum:'jelly', se:3 },
  storm:{ n:'폭풍 너울', hp:1900, sp:22, rw:150, lk:20, r:18, col:'#1E4E8C', arm:3, boss:2, sum:'crab', se:2.4 }
};
/* 파도 구성 — [종류, 마리, 간격(초)]. 묶음은 차례로 나온다 */
const WAVES = [
  [['jelly',8,.9]],
  [['jelly',8,.8],['crab',5,.6]],
  [['urch',4,1.2],['jelly',8,.7]],
  [['crab',10,.5],['jelly',6,.7]],
  [['trash',3,2],['jelly',8,.6]],
  [['urch',8,.9],['crab',8,.45]],
  [['king',1,1],['jelly',12,.6]],
  [['trash',5,1.5],['urch',6,.8]],
  [['crab',16,.35],['jelly',10,.5]],
  [['urch',10,.7],['trash',5,1.2]],
  [['jelly',14,.4],['crab',10,.35],['urch',8,.6],['trash',4,1]],
  [['storm',1,1],['jelly',10,.6],['urch',6,.8]]
];
const DIFF = [ { n:'쉬움', hp:.75, lives:25, sh:170 }, { n:'보통', hp:1, lives:20, sh:150 }, { n:'어려움', hp:1.2, lives:15, sh:140 } ];

let S = null, cv, ctx, raf = 0, last = 0, acc = 0, speed = 1, diff = 1, meImg = null, sel = null;
try{ const v = +localStorage.getItem(LS); if(v >= 0 && v <= 2) diff = v; }catch(e){}

function start(df){
  diff = df == null ? diff : df; const D = DIFF[diff];
  S = { lives:D.lives, max:D.lives, shells:D.sh, w:0, ph:'build', cd:10, wt:0, q:[], foes:[], tw:{}, fx:[], t:0, killed:0, earned:0, sk:0, paused:false, shake:0, res:null };
  sel = null; window._gameRun = true; $d('d-ov').hidden = true; $d('d-ov').innerHTML = ''; bar(); ctl();
}
function startWave(){
  const n = S.w, q = []; let t = 0;
  for(const [k, c, g] of WAVES[n]){ for(let i = 0; i < c; i++){ q.push({ t, k }); t += g * .75; } t += .8; }
  S.q = q; S.wt = 0; S.ph = 'wave'; ctl();
}
function spawn(k, d){
  const f = FO[k], m = DIFF[diff].hp * (f.boss ? 1 : 1 + .16 * S.w);   // 보스는 파도 배율을 빼고 고정 — 끝판이 벽이 되지 않게
  S.foes.push({ k, d:d || 0, hp:f.hp * m, max:f.hp * m, slow:0, se:f.se || 0, hit:0 });
}
const near = (x, y, r) => S.foes.filter(f => { const [fx, fy] = posAt(f.d); return f.hp > 0 && f.d > 0 && (fx - x) ** 2 + (fy - y) ** 2 <= r * r; });
function hurt(f, dmg, pierce){ const a = pierce ? 0 : (FO[f.k].arm || 0); f.hp -= Math.max(1, dmg - a); f.hit = .12; }
function kill(f){
  const F = FO[f.k]; S.shells += F.rw; S.killed++;
  if(F.split){ spawn('bag', Math.max(0, f.d - 4)); spawn('bag', f.d + 4); }
  if(!RM){ const [x, y] = posAt(f.d); S.fx.push({ k:'pop', x, y, t:0, c:F.col }); }
  if(F.boss){ const [x, y] = posAt(f.d); S.fx.push({ k:'txt', x, y, t:0, v:`🐚 +${F.rw}` }); }
}

function step(dt){
  if(!S || S.ph === 'done') return;
  S.t += dt; S.sk = Math.max(0, S.sk - dt); S.shake = Math.max(0, S.shake - dt);
  if(S.ph === 'build'){ S.cd -= dt; if(S.cd <= 0) startWave(); }
  else{
    S.wt += dt; while(S.q.length && S.q[0].t <= S.wt) spawn(S.q.shift().k);
  }
  // 움직임 — 감속은 서핑보드가 걸어 둔 시간 동안만
  for(const f of S.foes){
    const F = FO[f.k]; f.hit = Math.max(0, f.hit - dt);
    f.d += F.sp * (f.slow > 0 ? (1 - f.slowK) : 1) * dt; f.slow = Math.max(0, f.slow - dt);
    if(F.sum){ f.se -= dt; if(f.se <= 0){ f.se = F.se; spawn(F.sum, Math.max(0, f.d - 6)); } }
    if(f.d >= END && f.hp > 0){ f.hp = 0; f.gone = 1; S.lives -= F.lk; S.shake = .25; }
  }
  // 수호대 공격 — 물길을 가장 많이 내려온 놈부터(해변에 가까운 순)
  for(const id in S.tw){
    const t = S.tw[id], [x, y] = SLOTS[id], s = st(t), b = TW[t.k];
    if(b.inc && S.ph === 'wave'){ t.it = (t.it || 0) + dt; if(t.it >= 4){ t.it = 0; S.shells += s.inc; if(!RM) S.fx.push({ k:'txt', x, y:y - 10, t:0, v:`🐚+${s.inc}` }); } }
    t.cd = (t.cd || 0) - dt; if(t.cd > 0) continue;
    const fs = near(x, y, s.rng); if(!fs.length){ t.cd = .1; continue; }
    t.cd = s.rate;
    if(b.slow){ for(const f of fs){ hurt(f, s.dmg); if(!FO[f.k].boss || f.slow <= 0){ f.slow = 1; f.slowK = FO[f.k].boss ? s.slow * .5 : s.slow; } } S.fx.push({ k:'ring', x, y, r:s.rng, t:0, c:'rgba(255,201,77,', p:1 }); continue; }
    const tg = fs.reduce((a, f) => f.d > a.d ? f : a), [tx, ty] = posAt(tg.d);
    if(s.spl){ for(const f of near(tx, ty, s.spl)) hurt(f, s.dmg); S.fx.push({ k:'arc', x, y, tx, ty, t:0 }, { k:'ring', x:tx, y:ty, r:s.spl, t:0, c:'rgba(79,179,232,' }); }
    else{ hurt(tg, s.dmg, b.pierce); S.fx.push({ k:'line', x, y, tx, ty, t:0, c:b.col }); }
  }
  for(const f of S.foes) if(f.hp <= 0 && !f.gone && !f.dead){ f.dead = 1; kill(f); }
  S.foes = S.foes.filter(f => f.hp > 0);
  for(const e of S.fx) e.t += dt; S.fx = S.fx.filter(e => e.t < (e.k === 'txt' ? .9 : .3));
  if(S.lives <= 0){ S.lives = 0; return end(false); }
  if(S.ph === 'wave' && !S.q.length && !S.foes.length){
    S.shells += 20 + 4 * S.w; S.w++;
    if(S.w >= NW) return end(true);
    S.ph = 'build'; S.cd = 4; ctl();
  }
}

/* 버튼 — 짓기·강화·회수·지금 부르기·큰 파도. 시험(qa)도 같은 함수를 부른다 */
function build(i, k){ if(!S || S.tw[i] || S.ph === 'done') return false; const c = TW[k].c; if(S.shells < c) return false; S.shells -= c; S.tw[i] = { k, lv:1, spent:c, cd:0 }; return true; }
function up(i){ const t = S && S.tw[i]; if(!t || t.lv >= 3) return false; const c = upC(t); if(S.shells < c) return false; S.shells -= c; t.spent += c; t.lv++; return true; }
function sell(i){ const t = S && S.tw[i]; if(!t) return false; S.shells += Math.floor(t.spent * .6); delete S.tw[i]; return true; }
function callNow(){ if(!S || S.ph !== 'build') return; const b = Math.max(0, Math.round(S.cd * 2)); S.shells += b; startWave(); }
function wave(){
  if(!S || S.ph !== 'wave' || S.sk > 0) return false;
  S.sk = 30; const dmg = 25 * (1 + .1 * S.w);
  for(const f of S.foes){ hurt(f, FO[f.k].boss ? dmg * 2 : dmg, true); f.d = Math.max(0, f.d - (FO[f.k].boss ? 12 : 30)); }
  S.fx.push({ k:'big', t:0 }); if(!RM) S.shake = .2; return true;
}

let R = null, noRw = false;   // noRw: 균형 시뮬레이션 땐 보상을 저장하지 않는다
function end(win){
  S.ph = 'done'; S.res = win ? 'win' : 'lose'; window._gameRun = false; sel = null;
  const reached = win ? NW : S.w;
  S.earned = Math.min(60, reached * 2 + (win ? 10 + diff * 6 : 0));
  R = { best:reached, gain:0 };
  if(!noRw) try{ if(typeof playDefendDone === 'function') R = playDefendDone(reached, win, S.earned, diff) || R; }catch(e){}
  bar(); ctl(); over();
}

/* 덮개 — 시작(난이도 고르기)·끝(결과) */
const best = () => { const d = (typeof ME !== 'undefined' && ME && ME.profile && ME.profile.play && ME.profile.play.df) || {}; const n = v => { const x = Math.floor(+v); return Number.isFinite(x) ? Math.max(0, Math.min(9999, x)) : 0; }; return { b:Math.min(NW, n(d.best)), c:n(d.clears) }; };
function over(){
  const ov = $d('d-ov'), b = best(); ov.hidden = false;
  const mode = `<div class="go-mode" role="group" aria-label="난이도">${DIFF.map((x, i) => `<button type="button" data-df="${i}" aria-pressed="${i === diff}">${x.n}</button>`).join('')}</div>`;
  if(!S || S.ph !== 'done'){
    ov.innerHTML = `<div class="go-card"><div class="go-t">🛡️ 해변 수호</div>
      <div class="go-d">바다에서 낙산 해변으로 골칫거리가 밀려와요.<br>빈 자리 ○ 를 눌러 수호대를 놓고, 12번째 파도의 <b>폭풍 너울</b>까지 막아요!</div>
      <div class="go-r"><span>🛟 한 마리 강타 · 🐬 범위 · 🏄 느리게 · 🤿 조개 줍기</span><span>성게는 가시가 있어 해녀·큰 파도가 잘 들어요</span></div>
      ${mode}<div class="go-b">최고 <b>${b.b}</b>/${NW} 파도 · 수호 성공 <b>${b.c}</b>번</div>
      <button class="btn" id="d-go" type="button" style="width:100%">🌊 시작</button></div>`;
  } else {
    const win = S.res === 'win', nm = typeof ME !== 'undefined' && ME && ME.name ? esc(ME.name) : '';
    ov.innerHTML = `<div class="go-card"><div class="go-t">${win ? '🏆 해변을 지켰어요!' : '🌊 해변이 잠겼어요'}</div>
      <div class="go-d">${win ? `${nm ? nm + ' 님의 ' : ''}수호대가 폭풍 너울까지 막아냈어요 (${DIFF[diff].n})` : `${S.w + 1}번째 파도에서 밀렸어요. 강화·배치를 바꿔 봐요`}</div>
      <div class="go-st"><span>파도<b>${win ? NW : S.w}/${NW}</b></span><span>쓰러뜨림<b>${S.killed}</b></span><span>조개<b>+${S.earned}</b></span><span>XP<b>+${R && R.gain || 0}</b></span></div>
      ${mode}<button class="btn" id="d-go" type="button" style="width:100%">🔁 다시 하기</button></div>`;
  }
  ov.querySelectorAll('[data-df]').forEach(x => x.onclick = () => { diff = +x.dataset.df; try{ localStorage.setItem(LS, diff); }catch(e){} ov.querySelectorAll('[data-df]').forEach(y => y.setAttribute('aria-pressed', y === x)); });
  $d('d-go').onclick = () => start(diff);
}

/* 아래 막대 — 고른 자리에 따라 짓기 / 강화·회수 / 도움말 */
function bar(){
  const el = $d('d-bar'); if(!el) return;
  if(!S || S.ph === 'done' || sel == null){ el.innerHTML = `<div class="d-tip">${S && S.ph !== 'done' ? '빈 자리 ○ 를 눌러 수호대를 놓아요 · 놓인 수호대를 누르면 강화' : '수호대를 놓아 해변을 지켜요'}</div>`; return; }
  const t = S.tw[sel];
  if(!t){
    el.innerHTML = TK.map(k => { const b = TW[k]; return `<button type="button" class="d-b" data-db="${k}" ${S.shells < b.c ? 'disabled' : ''}><i>${b.ic}</i><b>${b.n}</b><small>🐚${b.c} · ${b.d}</small></button>`; }).join('');
  } else {
    const b = TW[t.k], s = st(t), c = t.lv < 3 ? upC(t) : 0;
    el.innerHTML = `<div class="d-info"><i>${b.ic}</i><b>${b.n} Lv${t.lv}</b><small>${b.inc ? `🐚+${s.inc}/4초 · ` : ''}${b.slow ? `${Math.round(s.slow * 100)}% 느리게` : `힘 ${Math.round(s.dmg)}`} · 사거리 ${Math.round(s.rng)}</small></div>
      <button type="button" class="d-b" data-du ${!c || S.shells < c ? 'disabled' : ''}><i>⬆️</i><b>${c ? '강화' : '최대'}</b><small>${c ? '🐚' + c : 'Lv3'}</small></button>
      <button type="button" class="d-b" data-ds><i>↩️</i><b>회수</b><small>🐚+${Math.floor(t.spent * .6)}</small></button>`;
  }
  el.querySelectorAll('[data-db]').forEach(x => x.onclick = () => { if(build(sel, x.dataset.db)) sel = null; bar(); });
  const u = el.querySelector('[data-du]'); if(u) u.onclick = () => { up(sel); bar(); };
  const sl = el.querySelector('[data-ds]'); if(sl) sl.onclick = () => { sell(sel); sel = null; bar(); };
}
let barKey = '';
function ctl(){
  const p = $d('d-pause'), sp = $d('d-speed'), a = $d('d-act'); if(!p) return;
  const on = S && S.ph !== 'done';
  p.disabled = sp.disabled = a.disabled = !on;
  p.textContent = S && S.paused ? '▶ 계속' : '⏸ 멈춤'; p.setAttribute('aria-pressed', !!(S && S.paused));
  sp.textContent = `⏩ ${speed}배`;
  if(on && S.ph === 'build') a.textContent = `▶ 지금 부르기 +🐚${Math.max(0, Math.round(S.cd * 2))}`;
  else if(on && S.ph === 'wave') { a.textContent = S.sk > 0 ? `🌊 큰 파도 ${Math.ceil(S.sk)}초` : '🌊 큰 파도!'; a.disabled = S.sk > 0 || S.paused; }
  else a.textContent = '🌊 큰 파도';
}

/* 그리기 */
function img(){ try{ if(typeof mochiSVG !== 'function' || typeof ME === 'undefined' || !ME) return null; const pr = typeof withLook === 'function' ? withLook(ME.profile, ME.name) : ME.profile; const i = new Image(); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(mochiSVG(pr, { charm:2, uid:'dfme' })); return i; }catch(e){ return null; } }
function draw(){
  const c = ctx; if(!c) return; const t = S ? S.t : performance.now() / 1000;
  c.setTransform(2, 0, 0, 2, 0, 0);
  if(S && S.shake > 0 && !RM) c.translate((Math.random() - .5) * 3, (Math.random() - .5) * 3);
  // 바다 → 모래
  let g = c.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, '#0E4C7A'); g.addColorStop(1, '#2C8CC4'); c.fillStyle = g; c.fillRect(-4, -4, W + 8, SH + 4);
  c.fillStyle = '#F2DDA6'; c.fillRect(-4, SH, W + 8, H - SH + 4);
  c.fillStyle = '#FFFFFF'; c.globalAlpha = .7; c.beginPath(); c.moveTo(-4, SH);
  for(let x = -4; x <= W + 4; x += 6) c.lineTo(x, SH + Math.sin(x / 14 + (RM ? 0 : t * 1.6)) * 2.5);
  c.lineTo(W + 4, SH + 6); c.lineTo(-4, SH + 6); c.fill(); c.globalAlpha = 1;
  if(!RM){ c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1; for(let i = 0; i < 5; i++){ const y = 14 + i * 19, o = (t * 8 + i * 37) % 60; c.beginPath(); c.moveTo(o + i * 30 - 20, y); c.lineTo(o + i * 30, y); c.stroke(); } }
  // 물길
  c.lineJoin = c.lineCap = 'round'; c.beginPath(); P.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.strokeStyle = 'rgba(205,178,122,.55)'; c.lineWidth = 18; c.stroke();
  c.setLineDash([3, 6]); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1; c.stroke(); c.setLineDash([]);
  // 서핑학교(지킬 곳)
  c.fillStyle = '#FF8A3D'; c.fillRect(96, 284, 48, 14); c.fillStyle = '#fff'; c.font = 'bold 7px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('낙산 서핑학교', 120, 291.5);
  if(meImg && meImg.complete && meImg.naturalWidth) c.drawImage(meImg, 132, 260, 26, 26);   // 내 캐릭터가 학교 앞을 지킨다
  // 자리·수호대
  SLOTS.forEach(([x, y], i) => {
    const tw = S && S.tw[i];
    if(sel === i && tw){ c.beginPath(); c.arc(x, y, st(tw).rng, 0, 7); c.fillStyle = 'rgba(255,255,255,.12)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.6)'; c.stroke(); }
    if(!tw){ c.beginPath(); c.arc(x, y, 11, 0, 7); c.fillStyle = sel === i ? 'rgba(255,226,122,.55)' : 'rgba(255,255,255,.28)'; c.fill(); c.setLineDash([3, 3]); c.strokeStyle = sel === i ? '#FFE27A' : 'rgba(20,48,79,.55)'; c.lineWidth = 1.5; c.stroke(); c.setLineDash([]);
      c.fillStyle = 'rgba(20,48,79,.7)'; c.font = 'bold 12px sans-serif'; c.fillText('+', x, y + .5); return; }
    const b = TW[tw.k]; c.beginPath(); c.arc(x, y, 12, 0, 7); c.fillStyle = b.col; c.fill(); c.lineWidth = sel === i ? 2.5 : 1.5; c.strokeStyle = sel === i ? '#FFE27A' : '#14304F'; c.stroke();
    c.font = '14px sans-serif'; c.fillText(b.ic, x, y + 1);
    for(let l = 0; l < tw.lv; l++){ c.fillStyle = '#FFE27A'; c.fillRect(x - 7 + l * 5, y + 13, 4, 3); }
  });
  // 골칫거리
  if(S) for(const f of S.foes){ if(f.d <= 0) continue; const [x, y] = posAt(f.d), F = FO[f.k], r = F.r, bob = RM ? 0 : Math.sin(t * 6 + f.d) * .8;
    c.save(); c.translate(x, y + bob); if(f.hit > 0) c.globalAlpha = .6; c.fillStyle = F.col;
    if(f.k === 'jelly' || f.k === 'king'){ c.beginPath(); c.arc(0, 0, r, Math.PI, 0); c.fill(); c.strokeStyle = F.col; c.lineWidth = r > 10 ? 2 : 1.2; for(let k = -2; k <= 2; k++){ c.beginPath(); c.moveTo(k * r / 3, 0); c.lineTo(k * r / 3 + (RM ? 0 : Math.sin(t * 5 + k) * 1.5), r * .9); c.stroke(); } }
    else if(f.k === 'urch'){ c.strokeStyle = F.col; c.lineWidth = 1.2; for(let k = 0; k < 10; k++){ const a = k * .628; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * (r + 3), Math.sin(a) * (r + 3)); c.stroke(); } c.beginPath(); c.arc(0, 0, r - 1, 0, 7); c.fill(); }
    else if(f.k === 'storm'){ c.beginPath(); c.moveTo(-r, r * .6); c.quadraticCurveTo(-r, -r, r * .4, -r * .8); c.quadraticCurveTo(r * 1.1, -r * .6, r * .5, -r * .1); c.quadraticCurveTo(0, -r * .5, 0, r * .1); c.lineTo(r, r * .6); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(r * .1, -r * .55, 3, 0, 7); c.fill(); }
    else if(f.k === 'crab'){ c.font = `${r * 2.4}px sans-serif`; c.fillText('🦀', 0, 0); }
    else { c.beginPath(); c.ellipse(0, 0, r, r * .75, 0, 0, 7); c.fill(); if(f.k === 'trash'){ c.fillStyle = '#5BA87A'; c.fillRect(-2, -r - 2, 4, 7); } }
    c.restore();
    if(f.slow > 0){ c.fillStyle = 'rgba(255,201,77,.9)'; c.fillRect(x - r, y + r + 1, 3, 3); }
    if(f.hp < f.max || F.boss){ const w = Math.max(14, r * 2); c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(x - w / 2, y - r - 6, w, 3); c.fillStyle = F.boss ? '#FF6B6B' : '#7BD389'; c.fillRect(x - w / 2, y - r - 6, w * Math.max(0, f.hp / f.max), 3); }
  }
  // 효과
  if(S) for(const e of S.fx){ const k = e.t / .3;
    if(e.k === 'line'){ c.strokeStyle = e.c; c.globalAlpha = 1 - k; c.lineWidth = 1.5; c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(e.tx, e.ty); c.stroke(); c.globalAlpha = 1; }
    else if(e.k === 'arc'){ const mx = (e.x + e.tx) / 2, my = Math.min(e.y, e.ty) - 18, q = Math.min(1, k * 1.6), ix = (1-q)*(1-q)*e.x + 2*(1-q)*q*mx + q*q*e.tx, iy = (1-q)*(1-q)*e.y + 2*(1-q)*q*my + q*q*e.ty; c.font = '10px sans-serif'; c.fillText('🐬', ix, iy); }
    else if(e.k === 'ring'){ if(RM && e.p) continue; /* 감속 맥박은 장식 */ c.strokeStyle = e.c + (1 - k) * .7 + ')'; c.lineWidth = 2; c.beginPath(); c.arc(e.x, e.y, e.r * (.5 + k * .5), 0, 7); c.stroke(); }
    else if(e.k === 'pop'){ c.fillStyle = e.c; c.globalAlpha = 1 - k; for(let j = 0; j < 5; j++){ const a = j * 1.26; c.fillRect(e.x + Math.cos(a) * k * 10, e.y + Math.sin(a) * k * 10, 2, 2); } c.globalAlpha = 1; }
    else if(e.k === 'txt'){ c.globalAlpha = 1 - e.t / .9; c.fillStyle = '#FFE27A'; c.font = 'bold 8px sans-serif'; c.fillText(e.v, e.x, e.y - e.t * 12); c.globalAlpha = 1; }
    else if(e.k === 'big'){ c.fillStyle = `rgba(160,220,255,${.45 * (1 - k)})`; c.fillRect(0, 0, W, H); }
  }
  // 위쪽 안내 — 다음 파도 / 보스
  if(S && S.ph === 'build'){ c.fillStyle = 'rgba(11,37,64,.7)'; c.fillRect(50, 4, 140, 16); c.fillStyle = '#fff'; c.font = 'bold 9px sans-serif';
    const bossN = WAVES[S.w].find(g => FO[g[0]].boss); c.fillText(`${S.w + 1}번째 파도${bossN ? ' · ⚠️ ' + FO[bossN[0]].n : ''} ${Math.ceil(S.cd)}초`, 120, 12.5); }
  if(S && S.paused){ c.fillStyle = 'rgba(11,37,64,.55)'; c.fillRect(0, 0, W, H); c.fillStyle = '#fff'; c.font = 'bold 16px sans-serif'; c.fillText('⏸ 멈춤', 120, 150); }
}

function loop(ts){
  raf = requestAnimationFrame(loop);
  if(!last) last = ts; const dt = Math.min(.05, (ts - last) / 1000); last = ts;
  if(S && !S.paused && S.ph !== 'done'){ acc += dt * speed * TS; let n = 0; while(acc >= FIX && n++ < 20){ step(FIX); acc -= FIX; } } else acc = 0;
  draw();
  const h = $d('d-hud'); if(h) h.textContent = S ? `❤️${S.lives} 🐚${S.shells} 🌊${Math.min(NW, S.w + (S.ph === 'wave' ? 1 : 0))}/${NW}` : '';
  // 막대·버튼은 값이 바뀔 때만 다시 그린다(누르는 중 버튼이 바뀌어 탭이 씹히지 않게)
  if(S){ const k = [S.ph, sel, S.shells >= 45, ...TK.map(x => S.shells >= TW[x].c), sel != null && S.tw[sel] ? S.shells >= upC(S.tw[sel]) : 0, Math.ceil(S.cd), Math.ceil(S.sk), S.paused, speed].join(); if(k !== barKey){ barKey = k; bar(); ctl(); } }
}

function tap(e){
  if(!S || S.ph === 'done') return;
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
  let bi = null, bd = 22 * 22;
  SLOTS.forEach(([sx, sy], i) => { const d = (sx - x) ** 2 + (sy - y) ** 2; if(d < bd){ bd = d; bi = i; } });
  sel = bi === sel ? null : bi; bar();
}

function defendOpen(){
  wire(); cv = $d('d-cv'); ctx = cv.getContext('2d');
  $d('defend').hidden = false; document.body.classList.add('game-on');
  meImg = img(); S = null; sel = null; over(); bar(); ctl();
  last = 0; acc = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
}
function defendClose(){
  cancelAnimationFrame(raf); raf = 0; S = null; sel = null; window._gameRun = false;
  $d('defend').hidden = true; document.body.classList.remove('game-on');
  if(typeof playTick === 'function') playTick(); if(typeof renderHub === 'function' && typeof state !== 'undefined' && state.tab === 'play') renderHub();
}
function wire(){
  if(wire.done || !$d('defend')) return; wire.done = true;
  $d('d-x').onclick = defendClose;
  $d('d-cv').addEventListener('pointerdown', tap);
  $d('d-pause').onclick = () => { if(S && S.ph !== 'done'){ S.paused = !S.paused; ctl(); } };
  $d('d-speed').onclick = () => { speed = speed === 1 ? 2 : 1; ctl(); };
  $d('d-act').onclick = () => { if(!S) return; if(S.ph === 'build') callNow(); else wave(); ctl(); };
  addEventListener('keydown', e => { if(!$d('defend').hidden && e.key === 'Escape') defendClose(); });
  document.addEventListener('visibilitychange', () => { if(S && document.hidden && S.ph !== 'done'){ S.paused = true; ctl(); } last = 0; });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
window.defendOpen = defendOpen; window.defendClose = defendClose;

/* 시험·균형 맞추기용 — 정해 둔 순서로 짓고 남으면 강화하는 단순한 봇 */
const PLAN = [[4,'guard'],[1,'guard'],[3,'board'],[5,'dolph'],[7,'diver'],[6,'guard'],[8,'dolph'],[0,'board'],[2,'guard'],[9,'dolph'],[10,'guard'],[11,'guard'],[12,'dolph']];
function bot(n){
  if(!S) return;
  const plan = PLAN.slice(0, n == null ? PLAN.length : n);
  let lo = null; for(const [i] of plan){ const t = S.tw[i]; if(t && t.lv < 3 && (lo == null || upC(t) < upC(S.tw[lo]))) lo = i; }
  const nx = plan.find(([i]) => !S.tw[i]), built = Object.keys(S.tw).length;
  if(nx && (built < 4 || lo == null || upC(S.tw[lo]) > TW[nx[1]].c)) build(nx[0], nx[1]); else if(lo != null) up(lo);
  if(S.ph === 'wave' && S.foes.length >= 8) wave();
}
window._defend = { get S(){ return S; }, start, step, build, up, sell, wave, callNow, bot, FIX, NW, WAVES, END,
  set diff(v){ diff = v; }, get diff(){ return diff; },
  run(df, n, sec, rw){ noRw = !rw; start(df); let k = 0; while(S && S.ph !== 'done' && k < (sec || 900) / FIX){ if(k % 30 === 0) bot(n); step(FIX); k++; } const o = { res:S.res, w:S.w, lives:S.lives, t:Math.round(S.t), tw:Object.keys(S.tw).length }; noRw = false; return o; } };
})();
