/* ── 라인업 서핑 ─────────────────────────────────────────────────────
   파도 점프가 '장애물 넘기'라면 이건 진짜 서핑에 가깝게 — 한 세션에 파도 5개.
     ① 라인업: 파도가 오면 연타로 패들해서 속도를 붙인다(모자라면 파도를 놓친다)
     ② 테이크오프: 바늘이 초록 칸에 올 때 탭(놓치면 펄링 → 와이프아웃)
     ③ 라이딩: 누르고 있으면 위로(립 쪽), 떼면 아래로. 내려가면 빨라지고 올라가면 느려진다.
        - 무너지는 곳(컬)에 너무 가까우면 화이트워터에 먹힌다. 단, 높이 붙어 있으면 🌀 튜브 라이딩.
        - 너무 앞(숄더)으로 가면 파도 힘이 빠진다 → 다시 포켓으로.
        - 립을 치면 탑턴, 빠르게 치고 올라가면 에어(공중에서 탭 = 그랩).
        - 앞에서 섹션이 한꺼번에 무너지면(클로즈아웃) 빨리 지나가거나 🛑 풀아웃.
        - 다른 서퍼·바위는 위아래로 피한다.
   와이프아웃 = 목숨 -1, 그 파도 점수는 40%만. 풀아웃·끝까지 타면 다 받는다. 목숨 3개.
   240×180 도트로 그리고 CSS 로 키운다. 물리는 1/60초 고정 — 기기마다 같은 손맛. */
(function(){
const W = 240, H = 240, TR = 200, RX = 92, FIX = 1 / 60, LIVES = 3, WAVES = 5, POP_LOCK = 0.25;
const $s = id => document.getElementById(id);
let cv, ctx, me = null, raf = 0, last = 0, acc = 0, held = false, tapQ = 0;
let S = null;            // 세션
/* 쉬움: 클로즈아웃·바위 없음, 컬이 느리고 팝업 칸이 넓다, 와이프아웃해도 60% — 어려움: 지금 그대로. 기록도 따로(sebest / sbest) */
let hardS = false; try{ hardS = localStorage.getItem('lineup.share.smode') === 'hard'; }catch(e){}
let R = null;            // 지금 파도

/* 소리 — 파도 점프와 같은 설정(기본 꺼짐) */
let AC = null;
const sndOn = () => { try{ return localStorage.getItem('lineup.share.snd') === '1'; }catch(e){ return false; } };
function beep(f0, f1, dur, type, vol){
  if(!sndOn()) return;
  try{ AC ||= new (window.AudioContext || window.webkitAudioContext)(); if(AC.state === 'suspended') AC.resume();
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = type || 'triangle'; o.frequency.setValueAtTime(f0, t); if(f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol || 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.02); }catch(e){}
}
const RM = (()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })();   // 번쩍임을 줄인다
const buzz = p => { try{ if(typeof vib === 'function') vib(p); else navigator.vibrate?.(p); }catch(e){} };

function mkMe(){
  const c = document.createElement('canvas');
  try{ const q = withLook(ME.profile, ME.name); drawSpr(c, avatarRows(q, false), avatarTintOf(q, 0)); }catch(e){ c.width = 24; c.height = 24; }
  return c;
}

/* 파도 크기 — 클수록 컬이 빠르고 길고 섹션이 많다 */
const SIZES = [
  { n:'무릎 파도', c:62, L:1300, lip:68, close:.12, surf:.35, rock:.0 },
  { n:'허리 파도', c:76, L:1700, lip:52, close:.22, surf:.35, rock:.2 },
  { n:'머리 파도', c:92, L:2100, lip:36, close:.32, surf:.3,  rock:.25 } ];
const SKY = [ ['#FFE3C2','#FFD0A8','#C9E8FF'], ['#BFE9FF','#9BDBFF','#7ACCF5'], ['#A8E0FF','#86D3FF','#64C3F0'], ['#FFD6A0','#FFB27A','#F08C7E'], ['#7A6CC4','#B57AB8','#F0A07E'] ];

function newSession(){
  if(typeof upFor === 'function') upFor('surf');               // 🔧 강화 적용 표시
  S = { phase:'lineup', wave:0, lives:LIVES, total:0, bestRide:0, ridden:0, lost:0, tricks:{ top:0, tube:0, air:0, pull:0 }, t:0, pops:[],
        pstk:0, pmax:0, cmax:0, setW:2 + Math.floor(Math.random() * 3), sets:0, fl:0, cmbHint:false };   // setW: 이번 세션의 세트 파도(3~5번째 중 하나)
  newWave();
}
function newWave(){
  const big = S.wave >= 3 ? 2 : S.wave >= 1 ? 1 : 0, set = S.wave === S.setW;
  /* 세트 파도 — 한 세션에 한 번, 가장 큰 파도가 온다. 이 파도 점수는 ×1.5. 쉬움은 그래도 쉬움 규칙(클로즈아웃·바위 없음) */
  const base = SIZES[set ? 2 : Math.min(2, Math.max(0, big - (Math.random() < 0.3 ? 1 : 0) + (Math.random() < 0.25 ? 1 : 0)))];
  const sz = hardS ? base : { ...base, c:base.c * 0.85, close:0, rock:0, surf:0.2 };
  R = { sz, t:0, meter:0, arrive:set ? 3.2 : 2.7, swell:0, needle:0, popT:0, x:0, curl:-30, v:0, h:0.35, vh:0, air:false, ah:0, avh:0, grab:false,
        tube:0, pts:0, obs:[], spray:[], lastUp:false, topLock:0, done:null, msg:'', trick:{ top:0, tube:0, air:0 }, set, cmb:0, cmbT:0, cmax:0 };
  for(let x = 420; x < sz.L - 120; x += 170 + Math.random() * 170){
    const r = Math.random();
    if(r < sz.close) R.obs.push({ k:'close', x, on:false, t:0, broke:false });
    else if(r < sz.close + sz.surf){ const h0 = 0.2 + Math.random() * 0.5; R.obs.push({ k:'surfer', x, h0, h1:h0 + 0.2, v:sz.c * 0.5 }); }
    else if(r < sz.close + sz.surf + sz.rock) R.obs.push({ k:'rock', x, h0:0, h1:0.22 });
  }
  S.phase = 'lineup'; S.t = 0;
}

/* ── 입력 ── */
function press(){ held = true; tapQ++; }
function lift(){ held = false; }
function pull(){
  if(!R || S.phase !== 'ride') return;
  if(R.curl > R.x){ toastIn('지금은 못 빠져요 — 컬 안이에요'); return; }
  if(R.air){ return; }
  const clean = R.h >= 0.5; S.tricks.pull++;
  endRide('pull', clean ? 50 : 0);
}
function toastIn(t){ S.pops.push({ x:RX - 30, y:40, t:0, life:1.2, v:t }); }

/* ── 한 걸음 ── */
function step(dt){
  S.t += dt; S.fl = Math.max(0, S.fl - dt); S.pops.forEach(p=>{ p.t += dt; p.y -= 14 * dt; }); S.pops = S.pops.filter(p=>p.t < (p.life || 0.9));
  const taps = tapQ; tapQ = 0;
  if(S.phase === 'lineup'){
    R.t += dt; R.meter = Math.max(0, R.meter - 0.32 * dt) + taps * (hardS ? 0.13 : 0.16); R.meter = Math.min(1.15, R.meter);
    if(taps) beep(220, 260, 0.05, 'sine', 0.03);
    if(R.t >= R.arrive){
      if(R.meter >= 0.65){ S.phase = 'pop'; R.popT = 0; beep(440, 660, 0.12); buzz(10); }
      else{ S.phase = 'missed'; R.t = 0; S.pops.push({ x:RX - 40, y:60, t:0, life:1.4, v:'파도를 놓쳤어요 — 더 빨리 패들!' }); }
    }
  } else if(S.phase === 'missed'){
    R.t += dt; if(R.t > 1.5){ S.wave++; if(S.wave >= WAVES) return over(); newWave(); }
  } else if(S.phase === 'pop'){
    R.popT += dt; R.needle = (Math.sin(R.popT * 4.2 - Math.PI / 2) + 1) / 2;
    if(taps && R.popT > POP_LOCK){
      const off = Math.abs(R.needle - 0.5);
      const q = off < (hardS ? 0.1 : 0.15) ? 'perfect' : off < (hardS ? 0.24 : 0.34) ? 'good' : 'late';
      R.v = q === 'perfect' ? 118 : q === 'good' ? 100 : 82; R.vh = -0.9; R.h = 0.9; R.x = 0; R.curl = -26;
      /* 완벽한 테이크오프가 이어지면 보너스가 30 → 60 → 90 … 로 커진다. 한 번 놓치면 처음부터 */
      if(q === 'perfect'){ S.pstk++; S.pmax = Math.max(S.pmax, S.pstk); const b = 30 * S.pstk; R.pts += b; S.fl = .3;
        S.pops.push({ x:RX - 20, y:50, t:0, life:1.2, v:S.pstk > 1 ? `✨ 완벽 ${S.pstk}연속! +${b}` : `✨ 완벽한 테이크오프! +${b}` }); if(S.pstk > 1) beep(784, 1568, .2); }
      else { S.pstk = 0; S.pops.push({ x:RX - 20, y:50, t:0, life:1, v:q === 'good' ? '👍 테이크오프' : '😬 늦은 테이크오프' }); }
      S.phase = 'ride'; beep(523, 1046, 0.15); buzz(15);
    } else if(R.popT > 1.9){ wipe('펄링 — 코가 박혔어요'); }
  } else if(S.phase === 'ride') ride(dt, taps);
}

function ride(dt, taps){
  const r = R, sz = r.sz;
  // 위아래 — 누르면 올라가고 떼면 내려간다
  const wasUp = r.vh > 0;
  if(!r.air){
    r.vh = held ? Math.min(1.5, r.vh + 3.4 * dt) : Math.max(-1.7, r.vh - 3.8 * dt);
    r.h += r.vh * dt;
    if(r.vh > 0 && !wasUp && r.h > 0.18 && r.h < 0.85 && r.curl > r.x - 240){ r.v += 9; }                         // 펌핑 — 아래→위로 꺾을 때 속도가 붙는다
    if(r.vh > 0 && !wasUp && r.h <= 0.18){ r.v += 12; trick(r, 10, '바텀턴', TR - 30); }
    if(r.h <= 0){ r.h = 0; if(r.vh < 0) r.vh = 0; r.v -= 14 * dt; }
    r.topLock = Math.max(0, r.topLock - dt);
    if(r.h >= 1){
      if(r.v >= 135 && r.vh > 0.9){ r.air = true; r.ah = 0; r.avh = r.vh * 0.9; r.grab = false; r.h = 1; beep(660, 1320, 0.2); buzz(12); }
      else{ r.h = 1; if(r.vh > 0.35 && !r.topLock){ if(r.v >= 92){ r.trick.top++; trick(r, 30, '탑턴', 30); spray(10); beep(880, 600, 0.12); } r.vh = -0.7; r.topLock = 0.4; } }
    }
  } else {
    r.ah += r.avh * dt; r.avh -= 3.0 * dt;
    if(taps && !r.grab){ r.grab = true; S.pops.push({ x:RX - 6, y:20, t:0, v:'그랩!' }); beep(990, 1320, 0.1); }
    if(r.ah <= 0){ r.air = false; r.ah = 0; r.h = 1; r.vh = -0.9;
      if(r.curl > r.x){ return wipe('착지했는데 화이트워터…'); }
      const bonus = 120 + (r.grab ? 40 : 0); r.trick.air++; trick(r, bonus, `🚀 에어${r.grab ? '+그랩' : ''}`, 30, 1.1); S.fl = .35; spray(14); buzz([10, 20, 10]); }
  }
  if(r.cmb && (r.cmbT -= dt) <= 0){ r.cmb = 0; }                                   // 2.5초 안에 다음 기술이 없으면 콤보가 끊긴다
  // 속도 — 포켓(컬 가까이)에서 힘을 받고, 숄더로 가면 빠진다. 올라가면 느려지고 내려가면 빨라진다.
  const d = r.x - r.curl;
  const P = d < 0 ? 0 : d < 240 ? 72 * (1 - d / 240) : -32;
  r.v += (P - (r.air ? 0 : r.vh * 92) - 0.18 * (r.v - 55)) * dt;
  r.v = Math.max(28, Math.min(240, r.v));
  r.x += r.v * dt; r.curl += sz.c * dt; r.pts += r.v * dt / 12;
  // 컬 — 튜브 or 먹힘
  const d2 = r.x - r.curl;
  if(d2 < 0 && !r.air){
    if(r.h >= 0.55 && d2 > -46){ r.tube += dt; r.pts += 45 * dt * (1 + r.tube); if(r.tube > 2.6) return wipe('튜브가 닫혔어요'); }
    else return wipe(r.h < 0.55 ? '화이트워터에 먹혔어요' : '너무 깊이 들어갔어요');
  } else if(d2 >= 0 && r.tube > 0){
    if(r.tube > 0.25){ const b = Math.floor(80 * r.tube); r.trick.tube++; trick(r, b, '🌀 튜브 성공!', 34, 1.2); S.fl = .35; beep(523, 1568, 0.3); buzz([15, 30, 15]); }
    r.tube = 0;
  }
  // 장애물
  for(const o of r.obs){
    if(o.k === 'surfer') o.x += o.v * dt;
    if(o.k === 'close'){
      if(!o.on && r.x > o.x - 170){ o.on = true; o.t = 1.7; S.pops.push({ x:RX - 30, y:24, t:0, life:1.2, v:'⚠ 앞이 한꺼번에 무너져요!' }); buzz([20, 40, 20]); beep(300, 200, 0.2, 'square'); }
      if(o.on && !o.broke){ o.t -= dt; if(o.t <= 0){ o.broke = true; r.curl = Math.max(r.curl, o.x + 60); if(r.x < r.curl && !r.air) return wipe('클로즈아웃에 맞았어요'); } }
      continue;
    }
    if(!r.air && Math.abs(o.x - r.x) < 9 && r.h >= o.h0 && r.h <= o.h1) return wipe(o.k === 'rock' ? '바위에 걸렸어요' : '다른 서퍼와 부딪혔어요');
  }
  r.obs = r.obs.filter(o=>o.x > r.x - 200 || (o.k === 'close' && !o.broke));
  // 카메라 — 컬과 멀어질수록 서퍼를 오른쪽에 둬서 뒤의 컬(포켓)이 화면에 보이게
  { const tgt = Math.max(70, Math.min(165, 70 + (r.x - r.curl) * 0.5)); r.cam = (r.cam || RX) + (tgt - (r.cam || RX)) * Math.min(1, dt * 3); }
  // 물보라
  if(Math.abs(r.vh) > 1.1 && Math.random() < 0.5) spray(1);
  r.spray.forEach(p=>{ p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; }); r.spray = r.spray.filter(p=>p.t < 0.6);
  // 끝 — 해변
  if(r.x >= sz.L) endRide('shore', 150);
}
/* 기술 콤보 — 기술을 2.5초 안에 이어 하면 배수가 붙는다(3번째부터 ×1.5, 5번째 ×2, 8번째 ×3). 와이프아웃하면 끝 */
const SET_M = 1.5, CMB_T = 2.5;
const cmbM = n => n >= 8 ? 3 : n >= 5 ? 2 : n >= 3 ? 1.5 : 1;
function trick(r, base, name, y, life){
  r.cmb++; r.cmbT = CMB_T; r.cmax = Math.max(r.cmax, r.cmb); S.cmax = Math.max(S.cmax, r.cmb);
  const m = cmbM(r.cmb), v = Math.round(base * m); r.pts += v;
  const pv = { nm:name, x:RX - 16, y:Math.max(y, 64), t:0, life:life || .9, v:`${name} +${v}${m > 1 ? ' ×' + m : ''}` };   // 점수줄(위 두 줄) 아래에서 떠오른다
  { const i = S.pops.findIndex(p=>p.nm === name); if(i >= 0) S.pops[i] = pv; else S.pops.push(pv); }   // 같은 기술(바텀턴 연타)은 한 줄을 고쳐 쓴다 — 네 줄씩 쌓여 서퍼를 가리지 않게
  if(m > 1 && m !== cmbM(r.cmb - 1)){ S.fl = Math.max(S.fl, .25); beep(660 + m * 220, 0, .12); buzz(10);
    if(!S.cmbHint){ S.cmbHint = true; S.pops.push({ x:RX - 60, y:96, t:0, life:2, v:'🔗 기술을 쉬지 않고 이으면 점수 배수!' }); } }
}
function spray(n){ for(let i = 0; i < n; i++) R.spray.push({ x:(R.cam || RX) - 6 + Math.random() * 6, y:riderY() + 4, vx:-30 - Math.random() * 50, vy:-60 - Math.random() * 60, t:0 }); }

function wipe(why){
  const r = R; S.lives--; S.lost++;
  const kept = Math.floor(r.pts * (hardS ? 0.4 : 0.6) * (r.set ? SET_M : 1)); r.cmb = 0;
  r.done = { kind:'wipe', why, got:kept, raw:Math.floor(r.pts) };
  S.total += kept; S.bestRide = Math.max(S.bestRide, kept); S.ridden++;
  S.phase = 'result'; held = false; beep(220, 60, 0.4, 'sawtooth', 0.07); buzz([40, 30, 60]);
  showResult();
}
function endRide(kind, bonus){
  const r = R; const got = Math.floor((r.pts + bonus) * (r.set ? SET_M : 1));
  S.tricks.top += r.trick.top; S.tricks.tube += r.trick.tube; S.tricks.air += r.trick.air; if(r.set) S.sets++;
  r.done = { kind, why:kind === 'shore' ? '해변까지 끝까지 탔어요!' : bonus ? '깔끔한 풀아웃!' : '풀아웃', got, bonus };
  S.total += got; S.bestRide = Math.max(S.bestRide, got); S.ridden++;
  S.phase = 'result'; held = false; beep(523, 1046, 0.25); buzz([10, 30, 10]);
  showResult();
}
function nextWave(){
  S.wave++;
  if(S.wave >= WAVES || S.lives <= 0) return over();
  newWave(); $s('s-ov').hidden = true; ui();
}
function over(){
  S.phase = 'over'; window._gameRun = false;
  const U = typeof upFor === 'function' ? upFor('surf', true) : {}, raw = S.total; if(U.mul) S.total = Math.round(raw * (1 + .03 * U.mul));   // 🔧 점수 배율
  const r = typeof playSurfDone === 'function' ? playSurfDone(S.total, S.bestRide, hardS) : { gain:0, newBest:false, best:S.total };
  const p = ME.profile.play || {}, nb = r.newBest && S.total > 0, best = r.best || 0, gap = best - S.total;
  /* 다음 목표 — 최고까지 얼마 남았는지. 거의 닿았으면 '아깝다' */
  const goal = nb ? '' : gap > 0 ? (S.total >= best * .75 ? `😣 아깝다! 최고까지 <b>${gap}</b>점` : `🎯 다음 목표: 최고 <b>${best}</b>점 — <b>${gap}</b>점 남았어요`) : '';
  $s('s-ov').hidden = false;
  $s('s-ov').innerHTML = `<div class="go-card${nb ? ' jp-nb' : ''}"><div class="go-t">${nb ? '🎉 최고 기록!' : '🏁 세션 끝'}</div>
    <div class="go-s"><span id="s-cnt">${S.total}</span><small>점</small></div>
    ${goal ? `<div class="go-d" style="margin:-2px 0 8px;word-break:keep-all">${goal}</div>` : ''}
    <div class="go-st"><span>잃은 목숨<b>${S.lost}/${LIVES}</b></span><span>탄 파도<b>${S.ridden}/${WAVES}</b></span><span>최고 파도<b>${S.bestRide}</b></span><span>${hardS ? '어려움' : '쉬움'} 최고<b>${(hardS ? p.sbest : p.sebest) || S.total}</b></span></div>
    <div class="go-b">🌀 튜브 ${S.tricks.tube} · 🚀 에어 ${S.tricks.air} · 탑턴 ${S.tricks.top} · 풀아웃 ${S.tricks.pull}${S.cmax >= 3 ? ` · 🔗 최대 콤보 ${S.cmax}` : ''}${S.pmax >= 2 ? ` · ✨ 완벽 ${S.pmax}연속` : ''}${r.gain ? ` · <b>+${r.gain} XP</b>` : ''}${r.shells ? ` · 🐚 +${r.shells}${r.x2 ? ' ×2' : ''}` : ''}${U.mul ? ` · 🔧 ×${(1 + .03 * U.mul).toFixed(2)}` : ''}</div>
    <div style="display:flex;gap:8px;margin-bottom:8px"><button class="btn blue" id="s-again" type="button" style="flex:1;min-height:52px;font-size:16px">↻ 한 판 더</button>
      <button class="btn ghost" id="s-exit" type="button" style="min-height:52px">닫기</button></div>
    ${typeof upNudge === 'function' ? upNudge('surf', { sc:S.total, best:r.newBest ? 0 : r.best, x2:r.x2, k:'r_mul', plus:Math.round(raw * .03) }) : ''}
    ${S.total >= 300 && typeof sendChat === 'function' ? `<button class="btn ghost" id="s-brag" type="button" style="width:100%;min-height:48px;margin-top:8px">📣 마을에 자랑하기</button>` : ''}</div>`;
  $s('s-again').onclick = ()=>{ newSession(); $s('s-ov').hidden = true; window._gameRun = true; ui(); };
  $s('s-exit').onclick = surfClose;
  if($s('s-brag')) $s('s-brag').onclick = async ()=>{ const b = $s('s-brag'); b.disabled = true; await sendChat(`🌊 라인업 서핑${hardS ? '(어려움)' : ''} ${S.total}점!${r.newBest ? ' (내 최고 기록 🎉)' : ''}`, true); b.textContent = '✅ 올렸어요'; };
  if(typeof popNext === 'function') setTimeout(popNext, 400);
  countUp($s('s-cnt'), S.total); if(nb){ [523, 659, 784, 1047, 1319].forEach((f, i)=>setTimeout(()=>beep(f, 0, .12, 'square', .035), i * 90)); buzz([10, 30, 10, 30]); }
  ui();
}
/* 결과 점수가 0부터 촤라락 올라간다(0.7초) */
function countUp(el, to){ if(!el || RM || to <= 0) return; const t0 = performance.now(), D = 700; el.textContent = '0';
  const f = now=>{ if(!el.isConnected) return; const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e); if(k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }
function showResult(){
  const d = R.done;
  $s('s-ov').hidden = false;
  $s('s-ov').innerHTML = `<div class="go-card"><div class="go-t">${d.kind === 'wipe' ? '🌊 와이프아웃' : d.kind === 'shore' ? '🏖 끝까지!' : '🛑 풀아웃'}</div>
    <div class="go-d">${esc(d.why)}${d.kind === 'wipe' ? ` — 이 파도 점수는 ${hardS ? 40 : 60}%만 (${d.raw} → ${d.got})` : ''}</div>
    <div class="go-s">+${d.got}<small>점</small></div>
    <div class="go-b">🌀 ${R.trick.tube} · 🚀 ${R.trick.air} · 탑턴 ${R.trick.top}${R.cmax >= 3 ? ` · 🔗 최대 콤보 ${R.cmax}` : ''}${R.set ? ' · 🌊 세트 ×1.5' : ''} · 합계 <b>${S.total}</b></div>
    <div class="go-st two"><span>목숨<b>${'❤️'.repeat(Math.max(0, S.lives))}${'🤍'.repeat(LIVES - Math.max(0, S.lives))}</b></span><span>파도<b>${S.wave + 1}/${WAVES}</b></span></div>
    <button class="btn blue" id="s-next" type="button" style="width:100%;min-height:52px;font-size:16px">${S.lives <= 0 || S.wave + 1 >= WAVES ? '결과 보기' : '다음 파도 기다리기'}</button></div>`;
  $s('s-next').onclick = nextWave;
  ui();
}
let ftLast = null;
function ui(){
  const pb = $s('s-pull'); if(pb){ const h = !(S && S.phase === 'ride'); if(pb.hidden !== h) pb.hidden = h; }
  const ft = $s('s-ft'), tx = !S ? '' : S.phase === 'lineup' ? '파도가 와요 — 화면을 빠르게 연타해서 패들!' : S.phase === 'pop' ? '바늘이 초록 칸에 오면 탭 — 팝업!' : S.phase === 'ride' ? '누르고 있으면 위로 · 떼면 아래로 · 🛑 풀아웃' : '';
  if(ft && tx !== ftLast){ ftLast = tx; ft.textContent = tx; }
}

/* ── 그리기 ── */
/* 캔버스 글씨 — 하늘·파도 어디에 놓여도 읽히게 어두운 띠를 깔고 11px 로 */
function lab(t, x, y, col, al){ ctx.font = '11px Galmuri11, sans-serif'; ctx.textBaseline = 'top'; const w = Math.ceil(ctx.measureText(t).width);
  let x0 = al === 'r' ? x - w : al === 'c' ? x - w / 2 : x; x0 = Math.round(Math.max(3, Math.min(W - w - 3, x0)));
  Rr('rgba(10,22,40,.6)', x0 - 3, y - 2, w + 6, 15); ctx.fillStyle = col || '#FFFFFF'; ctx.fillText(t, x0, y); }
function Rr(c, x, y, w, h){ ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
const lipY = dx => dx < 0 ? 62 : Math.min(178, R.sz.lip + Math.max(0, dx - 150) * 0.15);
function riderY(){ const ly = lipY(R.x - R.curl); return TR - R.h * (TR - ly) - (R.air ? R.ah * (TR - ly) : 0); }
/* 다섯 파도 = 해돋이 정동진 → 아침 죽도 → 한낮 속초 → 해 질 녘 하조대 → 달 뜨는 경포 (예전 하늘색 순서 그대로) */
const FACE = ['#BFF0FF','#7FD6F5','#4FBDE8','#36A6DC','#2A90CB','#2079B6','#1A66A0'], LY = new Array(W + 2);
const ACT = new Set(['lineup', 'missed', 'pop', 'ride']);
const BGS = [['정동진','sunrise'], ['죽도','morning'], ['속초','day'], ['하조대','golden'], ['경포','dusk']];
function draw(){
  const sky = SKY[Math.min(SKY.length - 1, S ? S.wave : 0)];
  // 뒷배경 — 파도마다 다른 강원 마을의 수평선(scenery.js). 기다리는 동안엔 바다까지 넓게 보이고, 파도를 타면 수평선만 남는다
  const wi = Math.min(BGS.length - 1, S ? S.wave : 0), lu = !S || !R || S.phase === 'lineup' || S.phase === 'missed' || S.phase === 'pop', bh = lu ? 144 : 66;
  const bgOk = !!(window.scenery && scenery.draw(ctx, BGS[wi][0], BGS[wi][1], { w:W, h:bh, hz:62, s:1.12, pan:Math.sin((S ? S.t : 0) / 9) * .8, noFg:1, noVig:1, alt:1 }));
  if(bgOk) Rr('#2C7DB8', 0, bh, W, H - bh);
  else{ Rr(sky[0], 0, 0, W, 20); Rr(sky[1], 0, 20, W, 22); Rr(sky[2], 0, 42, W, 20); Rr('#3A8FC9', 0, 62, W, 4); Rr('#2C7DB8', 0, 66, W, H - 66); }
  if(!S || !R){ return; }
  const t = S.t;
  if(S.phase === 'lineup' || S.phase === 'missed' || S.phase === 'pop'){ drawLineup(t); hud(); pops(); return; }
  // 파도 — 기둥마다 립 높이를 계산해 칠한다. 위(립)는 밝고 아래(골)는 어둡다 → 경사면처럼 보인다
  const CX = R.cam || RX, ly = LY, cxs = CX - (R.x - R.curl);
  let ww0 = W, ww1 = -1;                                                       // 화이트워터 기둥 범위
  for(let c = 0; c < W; c += 2){ const dx = R.x + (c - CX) - R.curl; ly[c] = ly[c + 1] = lipY(dx); if(dx < 0){ ww0 = Math.min(ww0, c); ww1 = c; } }
  if(ww1 >= 0){ // 화이트워터 — 무너진 뒤의 거품(색마다 한 번에)
    Rr('#CFEFFF', ww0, 60, ww1 + 2 - ww0, TR - 60); Rr('#E9F8FF', ww0, 60, ww1 + 2 - ww0, 20);
    const ft = Math.floor(t * 14) * 78.233;
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath();
    for(let c = ww0; c <= ww1; c += 2){ const n = Math.abs((Math.sin(c * 12.9898 + ft) * 43758.5453) % 1); ctx.rect(c, Math.round(60 + n * 80), 2, 3); ctx.rect(c, 56 + Math.round(Math.sin(c / 4 + t * 10) * 3), 2, 5); }
    ctx.fill(); ctx.fillStyle = '#A9DDF2'; ctx.beginPath();
    for(let c = ww0; c <= ww1; c += 2){ const n = Math.abs((Math.sin(c * 12.9898 + ft) * 43758.5453) % 1); ctx.rect(c, Math.round(70 + ((n * 7) % 1) * 70), 2, 2); }
    ctx.fill(); }
  for(let i = 0; i < FACE.length; i++){ ctx.fillStyle = FACE[i]; ctx.beginPath();
    for(let c = ww1 + 2; c < W; c += 2){ const y0 = ly[c], fh = TR - y0; ctx.rect(c, Math.round(y0 + fh * i / FACE.length), 2, Math.ceil(fh / FACE.length) + 1); }
    ctx.fill(); }
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); for(let c = ww1 + 2; c < W; c += 2) ctx.rect(c, Math.round(ly[c] - 1), 2, 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath();                    // 포켓 근처 립 위 물보라
  for(let c = ww1 + 2; c < W; c += 2){ if(R.x + (c - CX) - R.curl >= 60) break; ctx.rect(c, Math.round(ly[c] - 3 - Math.round(Math.sin(c / 3 + t * 12) * 1.5)), 2, 2); }
  ctx.fill();
  // 배럴 — 컬 자리에서 립이 앞으로 말려 떨어진다
  if(cxs > -40 && cxs < W + 10){
    const top = lipY(1), drop = TR - top;
    ctx.fillStyle = '#0E4E7A'; ctx.beginPath(); ctx.moveTo(cxs, top); ctx.quadraticCurveTo(cxs - 34, top + 4, cxs - 30, TR - 6); ctx.lineTo(cxs + 2, TR - 6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#E9FBFF'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cxs + 2, top - 1); ctx.quadraticCurveTo(cxs - 36, top + 2, cxs - 34, top + drop * 0.75); ctx.stroke();
    ctx.strokeStyle = '#7FD6F5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cxs, top + 3); ctx.quadraticCurveTo(cxs - 30, top + 6, cxs - 28, top + drop * 0.7); ctx.stroke();
    for(let i = 0; i < 8; i++){ const n = Math.abs(Math.sin(i * 91.7 + Math.floor(t * 12)) * 1000 % 1); Rr('#FFFFFF', cxs - 40 + n * 20, TR - 12 - n * 14, 3, 3); }
  }
  Rr('#165D93', 0, TR, W, H - TR); Rr('#2C86C2', 0, TR, W, 2);
  for(let i = 0; i < 10; i++){ const x = ((i * 31 - R.x * 0.6) % 250 + 250) % 250 - 5; Rr('rgba(255,255,255,.18)', x, TR + 8 + (i % 3) * 7, 10, 1); }
  // 페이스 결 — 지나가는 느낌
  for(let k = 0; k < 22; k++){ const c = Math.round(((k * 29 - R.x * 1.0) % 260 + 260) % 260) - 10; if(c < 0 || c >= W) continue;
    const y0 = ly[c & ~1] || 100; if(R.x + (c - CX) < R.curl) continue; const f = 0.2 + (k % 4) * 0.2; Rr('rgba(255,255,255,.3)', c, y0 + f * (TR - y0), 10, 1); }
  // 섹션·장애물
  for(const o of R.obs){
    const sx = CX + (o.x - R.x);
    if(o.k === 'close'){ if(sx < -100 || sx > W + 100) continue;
      if(!o.broke){ for(let c = Math.max(0, sx - 20); c < Math.min(W, sx + 60); c += 3) Rr(((c + Math.floor(t * 20)) % 6 < 3) ? '#FFFFFF' : '#D6F3FF', c, (ly[c & ~1] || 70) - 2, 2, 2);
        if(o.on){ Rr('#FF4D4D', sx + 26, 30, 10, 10); ctx.fillStyle = '#fff'; ctx.font = '8px sans-serif'; ctx.textBaseline = 'top'; ctx.fillText('!', sx + 29, 31); Rr('rgba(0,0,0,.3)', sx + 10, 43, 40, 3); Rr('#FF4D4D', sx + 10, 43, Math.max(0, 40 * o.t / 1.7), 3); } }
      continue; }
    if(sx < -12 || sx > W + 12) continue;
    const y0 = ly[Math.max(0, Math.min(W - 1, Math.round(sx))) & ~1] || 90, fy = h => TR - h * (TR - y0);
    if(o.k === 'rock'){ Rr('#4B4458', sx - 6, TR - 6, 13, 7); Rr('#6E6582', sx - 3, TR - 9, 7, 4); Rr('#FFFFFF', sx - 8, TR - 1, 17, 1); }
    else{ const yy = fy((o.h0 + o.h1) / 2); Rr('#FFE27A', sx - 7, yy + 3, 14, 2); Rr('#2E8B57', sx - 2, yy - 6, 5, 9); Rr('#F5C9A8', sx - 2, yy - 10, 5, 4); Rr('#1B1B2F', sx - 2, yy - 11, 5, 2); }
  }
  // 서퍼
  const ry = riderY(), ang = Math.max(-0.7, Math.min(0.7, -(R.air ? R.avh : R.vh) * 0.35));
  ctx.save(); ctx.translate(CX, ry); ctx.rotate(ang);
  Rr('#FF6B6B', -9, 0, 18, 3); Rr('#FFFFFF', -9, 1, 18, 1);
  if(me) ctx.drawImage(me, -12, -22);
  ctx.restore();
  R.spray.forEach(p=>Rr('rgba(255,255,255,.85)', p.x, p.y, 2, 2));
  if(R.tube > 0){ ctx.globalAlpha = 0.25; Rr('#0B3A5E', 0, 0, W, H); ctx.globalAlpha = 1; lab('🌀 튜브! ' + R.tube.toFixed(1) + '초', W / 2, 40, '#7BE0FF', 'c'); }
  // 포켓 막대 — 컬과의 거리
  const d = R.x - R.curl, bx = 60, bw = 120;
  Rr('rgba(0,0,0,.35)', bx, H - 10, bw, 5); Rr('#FF6B6B', bx, H - 10, 10, 5); Rr('#4ADE80', bx + 10, H - 10, 40, 5); Rr('#FFE27A', bx + 50, H - 10, 40, 5); Rr('#9AA5B1', bx + 90, H - 10, 30, 5);
  const mx = bx + Math.max(0, Math.min(bw - 2, 10 + d / 240 * 80)); Rr('#FFFFFF', mx, H - 12, 2, 9);
  ctx.font = '11px Galmuri11, sans-serif'; ctx.fillStyle = '#FFFFFF'; ctx.textBaseline = 'top'; ctx.fillText('컬', bx - 16, H - 14); ctx.fillText('숄더', bx + bw + 4, H - 14);
  hud(); pops();
}
function drawLineup(t){
  // 앉아서 기다리는 서퍼 + 다가오는 너울
  const k = S.phase === 'pop' ? 1 : Math.min(1, R.t / R.arrive), sx = -60 + k * (RX + 40);
  for(let c = 0; c < W; c += 2){ const dd = (c - sx) / 34, hh = Math.exp(-dd * dd) * (20 + 44 * k * (R.sz.lip < 60 ? 1.2 : 0.8)); Rr('#2E9BD3', c, 142 - hh, 2, hh + 2); if(hh > 8) Rr('#E8FBFF', c, 142 - hh, 2, 1); }
  Rr('#2C7DB8', 0, 144, W, H - 144);
  for(let i = 0; i < 12; i++){ const x = ((i * 23 - t * 12) % W + W) % W; Rr('rgba(255,255,255,.3)', x, 150 + (i % 4) * 18, 9, 1); }
  const bob = Math.round(Math.sin(t * 3) * 1.5), py = S.phase === 'pop' ? 118 : 140 + bob;
  Rr('#FF6B6B', RX - 9, py + 2, 18, 3); if(me) ctx.drawImage(me, RX - 12, py - 20);
  if(S.phase === 'lineup'){
    lab(`🌊 ${R.sz.n} 다가와요`, 8, 164);
    Rr('rgba(0,0,0,.35)', 8, 182, 140, 9); Rr('#4ADE80', 8 + 140 * 0.65, 182, 2, 9); Rr(R.meter >= 0.65 ? '#4ADE80' : '#FFE27A', 8, 183, Math.min(140, 140 * R.meter), 7);
    lab(R.meter >= 0.65 ? '좋아요! 계속' : '👆 연타!', 156, 180, R.meter >= 0.65 ? '#4ADE80' : '#FFE27A');
    Rr('rgba(0,0,0,.3)', 8, 198, 140, 3); Rr('#FFFFFF', 8, 198, 140 * Math.min(1, R.t / R.arrive), 3);
  } else if(S.phase === 'pop'){
    lab(R.popT > POP_LOCK ? '지금! 초록 칸에서 탭' : '손 떼고 — 바늘을 봐요', 8, 164, '#FFE27A');
    Rr('rgba(0,0,0,.35)', 8, 182, 160, 12); Rr('#FFE27A', 8 + 160 * 0.26, 182, 160 * 0.48, 12); Rr('#4ADE80', 8 + 160 * 0.4, 182, 160 * 0.2, 12);
    Rr('#FFFFFF', 8 + 160 * R.needle - 1, 179, 3, 18);
  }
}
let scLast = -1;
function hud(){
  Rr('rgba(10,22,40,.5)', 2, 2, LIVES * 11 + 3, 13);
  for(let i = 0; i < LIVES; i++){ const on = i < S.lives, x = 4 + i * 11, y = 4, c = on ? '#FF4D6D' : 'rgba(255,255,255,.4)';
    Rr(c, x + 1, y, 3, 2); Rr(c, x + 5, y, 3, 2); Rr(c, x, y + 2, 9, 3); Rr(c, x + 1, y + 5, 7, 2); Rr(c, x + 3, y + 7, 3, 2); }
  lab(`파도 ${Math.min(WAVES, S.wave + 1)}/${WAVES}`, W - 4, 4, '#FFFFFF', 'r');
  if(S.phase === 'ride'){ lab(`이번 파도 ${Math.floor(R.pts)}${R.set ? ' · 세트 ×1.5' : ''}`, 4, 21, '#FFE27A'); lab(`속도 ${Math.round(R.v)}`, W - 4, 21, R.v >= 135 ? '#4ADE80' : '#FFFFFF', 'r');
    if(R.cmb >= 2){ const m = cmbM(R.cmb); lab(`🔗 콤보 ${R.cmb}${m > 1 ? ' ×' + m : ''}`, 4, H - 42, m >= 3 ? '#FF9BD2' : m >= 2 ? '#FFB86B' : m > 1 ? '#7BE0FF' : '#FFFFFF');   // 왼쪽 아래 — 위쪽 점수줄·기술 글자와 겹치지 않게
      Rr('rgba(0,0,0,.45)', 4, H - 26, 64, 4); Rr('#FFE27A', 4, H - 26, Math.round(64 * Math.max(0, R.cmbT) / CMB_T), 4); } }
  if(R && R.set && (S.phase === 'lineup' || S.phase === 'pop') && Math.floor(S.t * 3) % 3 !== 0) lab('🌊 세트 파도 온다! 이 파도 점수 ×1.5', W / 2, 40, '#FFE27A', 'c');
  if(S.fl > 0 && !RM){ ctx.globalAlpha = Math.min(.5, S.fl * 1.4); Rr('#FFFFFF', 0, 0, W, H); ctx.globalAlpha = 1; }
  const v = S.total + (S.phase === 'ride' ? Math.floor(R.pts) : 0); if(v !== scLast){ scLast = v; const sc = $s('s-score'); if(sc) sc.textContent = v; }
}
/* 떠오르는 글씨가 한꺼번에 여러 개 나오면(트릭 연타·콤보 안내·완벽 테이크오프) 서로 겹쳐 못 읽었다 —
   위에서부터 차례로 쌓아서 한 줄(16px)씩 아래로 민다. 화면 아래(라인업·보드 자리)까지 밀리는 건 그리지 않고 곧 사라진다 */
const POP_H = 16;
function popLay(list){
  let lo = -1e9;
  for(const p of list.slice().sort((a, b) => a.y - b.y)){ p.dy = Math.max(Math.round(p.y), lo); lo = p.dy + POP_H; p.off = p.dy > H - 34; }
  return list;
}
function pops(){
  popLay(S.pops);
  for(const p of S.pops){ if(p.off) continue; ctx.globalAlpha = Math.max(0, Math.min(1, 1 - p.t / (p.life || 0.9) + 0.25)); lab(p.v, p.x, p.dy, '#FFE27A'); } ctx.globalAlpha = 1; }

function loop(ts){
  raf = requestAnimationFrame(loop);
  if(!last) last = ts; let dt = (ts - last) / 1000; last = ts; dt = Math.min(dt, 0.033);
  if(S && ACT.has(S.phase)){ acc += dt; let n = 0; while(acc >= FIX && n++ < 6){ step(FIX); acc -= FIX; if(!ACT.has(S.phase)) break; } ui(); }
  else if(S) S.t += dt;
  draw();
}

/* ── 화면 열기·닫기 ── */
function startCard(){
  const p = ME.profile.play || {};
  $s('s-ov').hidden = false;
  $s('s-ov').innerHTML = `<div class="go-card"><div class="go-t">🌊 라인업 서핑</div>
    <div class="go-mode" role="group" aria-label="난이도"><button type="button" data-sm="easy" aria-pressed="${!hardS}">🙂 쉬움</button><button type="button" data-sm="hard" aria-pressed="${hardS}">🔥 어려움</button></div>
    <div class="go-d" style="text-align:left">① 파도가 오면 <b>연타로 패들</b> ② 초록 칸에서 <b>탭 = 팝업</b><br>③ <b>누르면 위로 · 떼면 아래로</b> — 내려가면 빨라져요<br>${hardS ? '⚠ 앞이 한꺼번에 무너지면 빨리 지나가거나 <b>🛑 풀아웃</b> · 바위·서퍼 피하기' : '컬 가까이 높이 붙으면 🌀 튜브 · 립을 치면 탑턴'}</div>
    <div class="go-b">파도 ${WAVES}개 · ❤️×${LIVES} · ${hardS ? '어려움' : '쉬움'} 최고 <b>${(hardS ? p.sbest : p.sebest) || 0}</b>점</div>
    <button class="btn blue" id="s-go" type="button" style="width:100%;min-height:52px;font-size:16px">▶ 패들 아웃!</button></div>`;
  $s('s-go').onclick = ()=>{ newSession(); $s('s-ov').hidden = true; window._gameRun = true; ui(); };
  $s('s-ov').querySelectorAll('[data-sm]').forEach(b=>b.onclick = ()=>{ hardS = b.dataset.sm === 'hard'; try{ localStorage.setItem('lineup.share.smode', hardS ? 'hard' : 'easy'); }catch(e){} startCard(); });
}
function surfOpen(){
  cv = $s('s-cv'); ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  if(window.scenery) BGS.forEach(b=>scenery.bake(b[0], b[1], { noFg:1, noVig:1, alt:1 }));   // 미리 구워 두면 첫 파도부터 풍경이 뜬다
  $s('surf').hidden = false; document.body.classList.add('game-on');
  me = mkMe(); S = null; R = null; held = false; startCard(); ui();
  last = 0; acc = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
}
function surfClose(){
  cancelAnimationFrame(raf); raf = 0; window._gameRun = false; S = null; R = null;
  $s('surf').hidden = true; document.body.classList.remove('game-on');
  if(typeof playTick === 'function') playTick();
  if(typeof renderHub === 'function' && typeof state !== 'undefined' && state.tab === 'play') renderHub();
}
/* 다른 앱을 보다 오면 — 패들·팝업 중이어도 멈춘다(돌아오자마자 바늘이 지나가 펄링하지 않게) */
function pause(){
  if(!S || !ACT.has(S.phase)) return;
  S.prev = S.phase; S.phase = 'paused'; held = false;
  $s('s-ov').hidden = false;
  $s('s-ov').innerHTML = `<div class="go-card"><div class="go-t">⏸ 잠깐 멈췄어요</div><button class="btn blue" id="s-resume" type="button" style="width:100%;min-height:52px;font-size:16px">이어서</button></div>`;
  $s('s-resume').onclick = ()=>{ if(!S || S.phase !== 'paused') return; S.phase = S.prev || 'ride'; last = 0; acc = 0; tapQ = 0; $s('s-ov').hidden = true; };
}
function wire(){
  if(wire.done || !$s('surf')) return; wire.done = true;
  const box = $s('surf');
  box.addEventListener('pointerdown', e=>{ if(e.target.closest('button, .go-card')) return; e.preventDefault(); press(); });
  addEventListener('pointerup', lift); addEventListener('pointercancel', lift);
  addEventListener('keydown', e=>{
    if($s('surf').hidden) return;
    if(e.key === 'Escape'){ surfClose(); return; }
    if((e.code === 'Space' || e.key === 'ArrowUp') && !e.repeat){ e.preventDefault(); press(); }
    if(e.key === 'p' || e.key === 'P'){ pull(); }
  });
  addEventListener('keyup', e=>{ if(e.code === 'Space' || e.key === 'ArrowUp') lift(); });
  $s('s-x').onclick = surfClose;
  $s('s-pull').onclick = e=>{ e.stopPropagation(); pull(); };
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) pause(); });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();

window.surfOpen = surfOpen; window.surfClose = surfClose;
window._surf = { get hard(){ return hardS; }, set hard(v){ hardS = !!v; }, get S(){ return S; }, get R(){ return R; }, step, press, lift, pull, nextWave, newSession, FIX, set held(v){ held = v; }, trick:(b, n)=>trick(R, b, n || "테스트", 30), cmbM, SET_M, popLay };
})();
