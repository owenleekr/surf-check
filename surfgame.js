/* ── 파도 점프 ─────────────────────────────────────────────────────
   쉬는 시간에 한 판. 내 캐릭터가 보드를 타고 달리고, 바위·지느러미·해파리를 뛰어넘어
   조개를 모은다. 한 번 탭 = 점프, 길게 누르면 더 높이.

   180×220 도트 해상도로 그리고 CSS 로 키운다 — 도트가 저절로 뭉툭하게 보이고 계산도 가볍다.
   물리는 고정 단위(초)로 돈다. 기기 프레임이 달라도 점프 높이·속도가 같아야 점수를 비교할 수 있다.

   점수는 프로필(play.best)에 얹혀 동기 순위에 나온다. 서버 검증은 없다 — 재미로만. */

(function(){
const W = 180, H = 220, GY = 168;               // 월드 크기, 보드가 닿는 수면 높이
const G = 760, JV = 262, CUT = 120;             // 중력, 점프 속도, 일찍 떼면 깎는 속도(px/s)
let cv, ctx, me = null, st = null, raf = 0, last = 0, mode = 'idle', held = false;

const $g = id => document.getElementById(id);
const PAL = { foam:'#FFFFFF', rock:'#5B5368', rock2:'#7B7290', fin:'#6C7A8E', jelly:'#FF9BD2', shell:'#FFD27A' };
/* 지금 시각의 하늘 — 저녁에 켠 사람은 노을을, 밤에 켠 사람은 달을 본다. 같은 게임이 매번 같은 낮이면 금방 질린다. */
const THEMES = {
  day:    { sky:['#CFEFFF','#B5E5FF','#9DDBFF','#86D0FA'], sun:'#FFE27A', far:'#5BB4EE', mid:'#3F9BDF', near:'#2C84CB', deep:'#1F6FB5', w:['#8CCBF6','#6DB4EA','#9ED3F7','#4C98D8','#3A86C8','#2C76B8'], cloud:'#FFFFFF', cloud2:'#E4F4FF', stars:false },
  sunset: { sky:['#FFE3B8','#FFC48C','#FF9F7A','#E97C86'], sun:'#FFB347', far:'#C0689A', mid:'#8E5AA6', near:'#5F4C9A', deep:'#3E3A86', w:['#F0A7B4','#C98BC0','#E7B0C8','#6F5CB0','#5B4BA0','#4A3D90'], cloud:'#FFE2CF', cloud2:'#F4B8A0', stars:false },
  night:  { sky:['#0B1E3F','#10294F','#16355F','#1E4270'], sun:'#E8EEF9', far:'#1E4F85', mid:'#18416F', near:'#12335A', deep:'#0E2848', w:['#2D6AA8','#27598F','#356FAA','#1F4D80','#1A416F','#15375F'], cloud:'#2A4673', cloud2:'#1F3A62', stars:true },
};
const themeNow = () => { const h = new Date().getHours(); return THEMES[(h >= 19 || h < 5) ? 'night' : (h >= 17 || h < 6) ? 'sunset' : 'day']; };
let TH = THEMES.day;
const STARS = Array.from({length:22}, (_,i)=>({ x:(i*47 + 13) % W, y:(i*29 + 7) % 100, s:(i % 3 === 0) ? 2 : 1 }));

/* 소리 — 기본은 꺼짐. 수업 중·바다 앞에서 갑자기 울리면 곤란하다. 켠 건 기억한다. */
let AC = null, snd = false; try{ snd = localStorage.getItem('lineup.share.snd') === '1'; }catch(e){}
function beep(f0, f1, dur, type, vol){
  if(!snd) return;
  try{ AC ||= new (window.AudioContext || window.webkitAudioContext)(); if(AC.state === 'suspended') AC.resume();
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = type || 'square'; o.frequency.setValueAtTime(f0, t); if(f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol || 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.02); }catch(e){}
}
function sndBtn(){ const b = $g('g-snd'); if(!b) return; b.textContent = snd ? '🔊' : '🔇'; b.setAttribute('aria-pressed', String(snd)); b.setAttribute('aria-label', snd ? '소리 끄기' : '소리 켜기'); }

function mkMe(){
  /* 내 캐릭터를 그대로 태운다 — 남의 캐릭터를 조종하는 게임은 두 번 하면 질린다 */
  const c = document.createElement('canvas');
  try{ const q = withLook(ME.profile, ME.name); drawSpr(c, avatarRows(q, false), avatarTintOf(q, 0)); }catch(e){ c.width = 24; c.height = 24; }
  return c;
}

function reset(){
  st = { t:0, dist:0, speed:92, y:0, vy:0, air:false, buf:0, coyote:0, shells:0, obs:[], pick:[], next:150, nextShell:260,
         dead:false, deadT:0, flash:0, shake:0, clouds:[{x:20,y:18,s:3},{x:100,y:34,s:5},{x:150,y:12,s:2}], pops:[] };
}
const score = () => Math.floor(st.dist / 14) + st.shells * 10;

function spawn(){
  const sp = st.speed, roll = Math.random();
  /* 간격은 '뜬 시간 × 속도'보다 반드시 크다 — 안 그러면 착지하자마자 다음 장애물에 막혀 못 피하는 판이 생긴다 */
  const air = (2*JV/G) * sp, gap = air * 0.78 + 34 + Math.random() * 46;
  let o;
  if(roll < 0.45)      o = { k:'rock',  w:12, h:10, y:0 };
  else if(roll < 0.78) o = { k:'fin',   w:14, h:17, y:0 };
  else                 o = { k:'jelly', w:10, h:10, y:3 };
  o.x = W + 8; st.obs.push(o);
  /* 가끔 장애물 위에 조개 — 뛰어넘는 길목이 곧 보상 */
  if(Math.random() < 0.7) st.pick.push({ x:o.x + o.w/2 - 3, y:o.h + 20 + Math.random()*8, got:false });
  st.next = gap;
}

function jump(){
  if(mode !== 'run' || st.dead) return;
  if(!st.air || st.coyote > 0){ st.vy = JV; st.air = true; st.coyote = 0; st.buf = 0; held = true; vib(8); beep(300, 560, 0.12, 'square', 0.04); }
  else st.buf = 0.12;                                // 착지 직전에 눌러도 먹는다
}
function release(){ held = false; if(st && st.vy > CUT) st.vy = CUT; }

function step(dt){
  const s = st; s.t += dt;
  if(s.dead){ s.deadT += dt; s.flash = Math.max(0, s.flash - dt*3); s.shake = Math.max(0, s.shake - dt*20); return; }
  s.speed = Math.min(210, 92 + s.t * 3.4);
  s.dist += s.speed * dt;
  // 점프 물리
  if(s.air){ s.vy -= G * dt; s.y += s.vy * dt;
    if(s.y <= 0){ s.y = 0; s.vy = 0; s.air = false; s.coyote = 0.08; if(s.buf > 0){ s.buf = 0; jump(); } } }
  else if(s.coyote > 0) s.coyote -= dt;
  s.buf = Math.max(0, s.buf - dt);
  // 스폰·이동
  s.next -= s.speed * dt; if(s.next <= 0) spawn();
  s.obs.forEach(o=>o.x -= s.speed * dt); s.obs = s.obs.filter(o=>o.x > -24);
  s.pick.forEach(p=>p.x -= s.speed * dt); s.pick = s.pick.filter(p=>p.x > -12 && !p.got);
  s.clouds.forEach(c=>{ c.x -= c.s * dt; if(c.x < -30) c.x = W + 10; });
  s.pops.forEach(p=>{ p.t += dt; p.y += 26 * dt; }); s.pops = s.pops.filter(p=>p.t < 0.7);
  // 충돌 — 서퍼 몸통은 그림보다 좁게 잡는다(억울한 죽음이 제일 싫다)
  const sx = 40, sw = 12, sb = s.y, st_ = s.y + 20;
  for(const o of s.obs){
    const ox = o.x + 2, ow = o.w - 4, ob = o.y, ot = o.y + o.h - 2;
    if(sx + sw > ox && sx < ox + ow && sb < ot && st_ > ob){ wipeout(); return; }
  }
  for(const p of s.pick){
    if(!p.got && sx + sw + 3 > p.x && sx - 3 < p.x + 7 && sb < p.y + 7 && st_ > p.y){ p.got = true; s.shells++; s.pops.push({ x:p.x, y:GY - p.y - 10, t:0, v:'+10' }); vib(6); beep(880, 1320, 0.09, 'triangle', 0.06); }
  }
}

function wipeout(){
  st.dead = true; st.flash = 1; st.shake = 5; held = false; beep(220, 60, 0.4, 'sawtooth', 0.07);
  vib([40, 30, 60]);
  setTimeout(finish, 650);
}
function finish(){
  if(mode !== 'run') return;
  mode = 'over'; window._gameRun = false;
  const sc = score();
  const r = typeof playGameDone === 'function' ? playGameDone(sc) : { gain:0, newBest:false, best:sc };
  showOver(sc, r);
  if(typeof popNext === 'function') setTimeout(popNext, 400);
}

/* ── 그리기 ── */
function R(c, x, y, w, h){ ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
function draw(){
  const s = st, sh = s.shake ? (Math.random() - .5) * s.shake : 0;
  ctx.save(); ctx.translate(Math.round(sh), 0);
  for(let i = 0; i < 4; i++) R(TH.sky[i], 0, i*32, W, 32);
  if(TH.stars) STARS.forEach((st, i)=>{ if(((s.t * 1.3 + i) | 0) % 5 !== 0) R('#FFFFFF', st.x, st.y, st.s, st.s); });      // 별은 가끔 깜빡인다
  R(TH.sun, 138, 14, 16, 16); R(TH.sky[0], 138, 14, 2, 2); R(TH.sky[0], 152, 14, 2, 2); R(TH.sky[0], 138, 28, 2, 2); R(TH.sky[0], 152, 28, 2, 2);
  s.clouds.forEach(c=>{ R(TH.cloud, c.x, c.y, 22, 5); R(TH.cloud, c.x + 4, c.y - 3, 12, 4); R(TH.cloud2, c.x, c.y + 4, 22, 1); });
  // 먼 바다 → 가까운 바다. 줄마다 속도를 다르게 줘서 달리는 느낌을 만든다
  R(TH.far, 0, 118, W, 18); R(TH.mid, 0, 136, W, 20); R(TH.near, 0, 156, W, 12); R(TH.deep, 0, GY, W, H - GY);
  const wl = (y, spd, c, len, gap)=>{ const off = (s.t * spd) % (len + gap); for(let x = -off; x < W; x += len + gap) R(c, x, y + Math.round(Math.sin((x + s.t*20) / 11)), len, 1); };
  wl(124, 14, TH.w[0], 8, 18); wl(142, 30, TH.w[1], 10, 14); wl(160, 70, TH.w[2], 12, 12);
  wl(180, s.speed * 0.9, TH.w[3], 14, 20); wl(196, s.speed * 1.1, TH.w[4], 18, 22); wl(210, s.speed * 1.3, TH.w[5], 22, 26);
  // 앞쪽 파도 거품 — 수면선을 따라 흐른다
  const foam = (s.t * s.speed * 0.9) % 16; for(let x = -foam; x < W; x += 16) R(PAL.foam, x, GY - 1 + ((x / 16 | 0) % 2), 6, 1);
  // 조개
  s.pick.forEach(p=>{ const py = GY - p.y - 7; R(PAL.shell, p.x + 1, py, 5, 4); R('#FFEFC2', p.x + 2, py, 3, 1); R('#E9A94E', p.x + 1, py + 3, 5, 1); });
  // 장애물
  s.obs.forEach(o=>{ const by = GY - o.y - o.h;
    if(o.k === 'rock'){ R(PAL.rock, o.x, by + 3, o.w, o.h - 3); R(PAL.rock2, o.x + 2, by, o.w - 5, 4); R('#FFFFFF', o.x - 1, GY - 1, o.w + 2, 1); }
    else if(o.k === 'fin'){ for(let i = 0; i < o.h; i++) R(PAL.fin, o.x + Math.floor(i * 0.35), by + i, o.w - Math.floor(i * 0.8) , 1); R('#FFFFFF', o.x - 2, GY - 1, o.w + 4, 1); }
    else{ const wob = Math.round(Math.sin(s.t * 8 + o.x) * 1); R(PAL.jelly, o.x + 1, by + wob, o.w - 2, 6); R('#FFD1E8', o.x + 2, by + wob, 3, 2);
      for(let i = 0; i < 3; i++) R('#FF77BE', o.x + 2 + i*3, by + 6 + wob + (i % 2), 1, 4); }
  });
  // 서퍼
  if(me){
    const bob = (!s.air && !s.dead) ? Math.round(Math.sin(s.t * 9)) : 0;
    const x = 34, y = GY - me.height - Math.round(s.y) + 1 + bob;
    ctx.save();
    if(s.dead){ const k = Math.min(1, s.deadT * 1.6); ctx.translate(x + me.width/2, y + me.height/2 + k * 18); ctx.rotate(k * 2.4); ctx.globalAlpha = 1 - k * 0.5; ctx.drawImage(me, -me.width/2, -me.height/2); }
    else{
      R('rgba(27,27,47,.28)', 38 - Math.min(4, s.y / 8), GY + 1, 18, 2);               // 높이 뜰수록 그림자가 작아진다
      const tilt = s.air ? Math.max(-.22, Math.min(.22, -s.vy / 1500)) : 0;
      ctx.translate(x + me.width/2, y + me.height/2); ctx.rotate(tilt); ctx.drawImage(me, -me.width/2, -me.height/2);
    }
    ctx.restore();
  }
  // 점수 팝
  ctx.font = '8px Galmuri11, sans-serif'; ctx.textBaseline = 'top';
  s.pops.forEach(p=>{ ctx.globalAlpha = 1 - p.t / 0.7; ctx.fillStyle = '#FFE27A'; ctx.fillText(p.v, Math.round(p.x - 2), Math.round(p.y - p.t * 20)); ctx.globalAlpha = 1; });
  if(s.flash > 0){ ctx.globalAlpha = s.flash * 0.55; R('#FFFFFF', 0, 0, W, H); ctx.globalAlpha = 1; }
  ctx.restore();
  $g('g-score').textContent = score();
}

function loop(t){
  raf = requestAnimationFrame(loop);
  if(!last) last = t;
  let dt = (t - last) / 1000; last = t; dt = Math.min(dt, 0.033);        // 탭을 다녀오면 dt 가 커진다 — 한 번에 뛰어넘지 않게
  if(mode === 'run') step(dt);
  else if(mode === 'idle'){ st.t += dt; st.clouds.forEach(c=>{ c.x -= c.s * dt; if(c.x < -30) c.x = W + 10; }); }
  draw();
}

/* ── 화면 ── */
function myBestRows(){
  const rows = (state.town||[]).filter(x=>x.id !== ME.id).map(x=>({ id:x.id, name:x.name, best:(typeof peerPlay === 'function' ? peerPlay(x.profile?.play)?.best : 0) || 0 }))
    .concat([{ id:ME.id, name:ME.name, best:ME.profile?.play?.best || 0 }]).filter(r=>r.best > 0).sort((a,b)=>b.best - a.best);
  return rows.slice(0, 3);
}
function pause(){
  if(mode !== 'run' || st.dead) return;
  mode = 'paused'; held = false; $g('g-ov').hidden = false;
  $g('g-ov').innerHTML = `<div class="go-card"><div class="go-t">⏸ 잠깐 멈췄어요</div><div class="go-b">점수 <b>${score()}</b></div>
    <button class="btn blue" id="g-resume" type="button" style="width:100%;min-height:52px;font-size:16px">이어서</button></div>`;
  $g('g-resume').onclick = ()=>{ mode = 'run'; last = 0; $g('g-ov').hidden = true; };
}
function showStart(){
  mode = 'idle'; window._gameRun = false; reset();
  const p = ME.profile.play || {}, top = myBestRows();
  $g('g-ov').hidden = false;
  $g('g-ov').innerHTML = `<div class="go-card">
      <div class="go-t">🏄 파도 점프</div>
      <div class="go-d">탭하면 점프 · 길게 누르면 더 높이<br>바위·상어·해파리를 넘고 🐚을 모아요</div>
      <div class="go-b">내 최고 <b>${p.best || 0}</b>점</div>
      ${top.length ? `<div class="go-r">${top.map((r,i)=>`<span>${['🥇','🥈','🥉'][i]} ${esc(r.name)} ${r.best}</span>`).join('')}</div>` : ''}
      <button class="btn blue" id="g-go" type="button" style="width:100%;min-height:52px;font-size:16px">시작</button></div>`;
  $g('g-go').onclick = begin;
}
function begin(){
  me = mkMe(); TH = themeNow(); reset(); mode = 'run'; window._gameRun = true; $g('g-ov').hidden = true; last = 0; held = false;
}
function showOver(sc, r){
  const p = ME.profile.play || {};
  const v = (typeof VOICES !== 'undefined' && VOICES.length) ? VOICES[Math.floor(Math.random() * VOICES.length)] : null;
  $g('g-ov').hidden = false;
  $g('g-ov').innerHTML = `<div class="go-card">
      <div class="go-t">${r.newBest && sc > 0 ? '🎉 최고 기록!' : '🌊 와이프아웃'}</div>
      <div class="go-s">${sc}<small>점</small></div>
      <div class="go-b">🐚 ${st.shells}개 · 최고 <b>${p.best || sc}</b>점${r.gain ? ` · <b>+${r.gain} XP</b>` : ' · 오늘 XP는 다 채웠어요'}</div>
      ${v ? `<div class="go-v">“${esc(v[0])}”<small>— ${esc(v[1])}</small></div>` : ''}
      <div style="display:flex;gap:8px"><button class="btn blue" id="g-again" type="button" style="flex:1;min-height:52px;font-size:16px">한 판 더</button>
        <button class="btn ghost" id="g-exit" type="button" style="min-height:52px">닫기</button></div>
      ${sc >= 100 && typeof sendChat === 'function' ? `<button class="btn ghost" id="g-brag" type="button" style="width:100%;min-height:48px;margin-top:8px">📣 마을에 자랑하기</button>` : ''}</div>`;
  $g('g-again').onclick = begin; $g('g-exit').onclick = gameClose;
  if($g('g-brag')) $g('g-brag').onclick = async ()=>{ const b = $g('g-brag'); b.disabled = true;
    await sendChat(`🎮 파도 점프 ${sc}점!${r.newBest ? ' (내 최고 기록 🎉)' : ''}`, true); b.textContent = '✅ 올렸어요'; };
}

function gameOpen(){
  cv = $g('g-cv'); ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  $g('game').hidden = false; document.body.classList.add('game-on');
  me = mkMe(); TH = themeNow(); sndBtn(); showStart(); last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
}
function gameClose(){
  cancelAnimationFrame(raf); raf = 0; mode = 'idle'; window._gameRun = false;
  $g('game').hidden = true; document.body.classList.remove('game-on');
  if(typeof playTick === 'function') playTick();
  if(typeof renderPlay === 'function' && !$g('play-sheet').hidden) renderPlay();
}

/* 입력 — 캔버스 어디를 눌러도 점프. 글자 선택·스크롤·확대가 끼어들지 않게 막는다 */
function wire(){
  if(wire.done) return; wire.done = true;
  const c = $g('g-cv');
  /* 화면 아래 빈 곳을 눌러도 뛴다 — 엄지는 캔버스 위가 아니라 폰 아래쪽에 있다. 버튼·카드는 제외 */
  $g('game').addEventListener('pointerdown', e=>{ if(e.target.closest('button, .go-card')) return; e.preventDefault(); jump(); });
  addEventListener('pointerup', release); addEventListener('pointercancel', release);
  addEventListener('keydown', e=>{
    if($g('game').hidden) return;
    if(e.key === 'Escape'){ gameClose(); return; }
    if((e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') && !e.repeat){ e.preventDefault(); if(mode === 'run') jump(); else if(mode === 'idle' || mode === 'over') begin(); }
  });
  addEventListener('keyup', e=>{ if(e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') release(); });
  $g('g-x').onclick = gameClose;
  /* 다른 앱을 보다 돌아오면 게임이 이어 달려서 바로 죽는다 — 멈춰 두고 다시 누르면 시작한다 */
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden && mode === 'run') pause(); });
  $g('g-snd').onclick = ()=>{ snd = !snd; try{ localStorage.setItem('lineup.share.snd', snd ? '1' : '0'); }catch(e){} sndBtn(); beep(660, 990, 0.1, 'triangle', 0.06); };
}
document.addEventListener('DOMContentLoaded', wire);
if(document.readyState !== 'loading') wire();

window.gameOpen = gameOpen; window.gameClose = gameClose;
window._game = { get TH(){ return TH; }, setTheme:k=>{ TH = THEMES[k]; }, pause, get st(){ return st; }, get mode(){ return mode; }, step, jump, release, score, begin, reset: ()=>reset() };
})();
