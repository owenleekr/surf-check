/* ── 파도 점프 ─────────────────────────────────────────────────────
   쉬는 시간에 한 판. 내 캐릭터가 보드를 타고 달리고, 바위·지느러미·해파리를 뛰어넘어
   조개를 모은다. 한 번 탭 = 점프, 길게 누르면 더 높이.

   180×220 도트 해상도로 그리고 CSS 로 키운다 — 도트가 저절로 뭉툭하게 보이고 계산도 가볍다.
   물리는 고정 단위(초)로 돈다. 기기 프레임이 달라도 점프 높이·속도가 같아야 점수를 비교할 수 있다.

   점수는 프로필(play.best)에 얹혀 동기 순위에 나온다. 서버 검증은 없다 — 재미로만.

   난이도: 시간이 지나면 '구간'이 올라간다(잔잔한 바다 → 갈매기 → 통나무·연속 → 폭풍). 구간마다 새 장애물이 붙고
   속도·간격이 빡빡해진다. 갈매기는 '뛰지 말고 아래로' 지나가야 하고, 통나무는 높이 뛰어야 한다 — 탭을 연타하면 죽는다.
   오늘의 파도(MODS)는 날짜로 정해져 모두 같다. 장애물은 전부 rnd() 한 줄로만 뽑아 오늘의 챌린지 코스가 같게 유지된다. */

(function(){
const W = 180, H = 220, GY = 168;               // 월드 크기, 보드가 닿는 수면 높이
const G = 760, JV = 262, CUT = 120;             // 중력, 점프 속도, 일찍 떼면 깎는 속도(px/s)
let cv, ctx, me = null, st = null, raf = 0, last = 0, mode = 'idle', held = false;
/* 오늘의 챌린지 — 날짜로 씨앗을 줘서 모두가 같은 장애물 순서를 만난다. 같은 코스라야 점수를 견줄 수 있다.
   물리를 고정 단위(1/60초)로 돌리는 것도 같은 이유다: 기기 프레임이 달라도 같은 입력이면 같은 결과가 나온다. */
let daily = false, rnd = Math.random, acc = 0;
const FIX = 1 / 60;
const ZONES = [[0,'잔잔한 바다'],[14,'갈매기 구간'],[32,'통나무·연속'],[55,'폭풍']];
const MODS = [
  { n:'균형 잡힌 바다', ic:'🌊', w:{} }, { n:'갈매기의 날', ic:'🐦', w:{ bird:2.4 } }, { n:'통나무의 날', ic:'🪵', w:{ log:2.6, double:1.6 } },
  { n:'해파리 떼의 날', ic:'🪼', w:{ jelly:2.6 } }, { n:'상어의 날', ic:'🦈', w:{ fin:2.3 } }, { n:'연속의 날', ic:'⛓️', w:{ double:2.4, stair:2.4 } } ];
let mod = MODS[0];
const hashStr = s => { let h = 2166136261; for(const c of s){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

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
  rnd = daily ? mulberry(hashStr('wave-' + today())) : Math.random;
  mod = daily ? MODS[hashStr('mod-' + today()) % MODS.length] : MODS[Math.floor(Math.random() * MODS.length)];
  st = { t:0, zone:1, dist:0, speed:100, y:0, vy:0, air:false, buf:0, coyote:0, shells:0, shield:0, invuln:0, obs:[], pick:[], next:150, nextShell:260,
         dead:false, deadT:0, flash:0, shake:0, clouds:[{x:20,y:18,s:3},{x:100,y:34,s:5},{x:150,y:12,s:2}], pops:[] };
}
const score = () => Math.floor(st.dist / 14) + st.shells * 10;

const DIM = { rock:{ w:12, h:10, y:0 }, fin:{ w:14, h:17, y:0 }, jelly:{ w:10, h:10, y:3 }, log:{ w:28, h:8, y:0 }, bird:{ w:12, h:7, y:24 } };
/* 구간이 올라갈수록 장애물 종류가 늘어난다. 뽑기는 rnd() 한 번 — 오늘의 챌린지에서 모두 같은 코스가 나오게 */
function pickKind(){
  const z = st.zone, w = { rock:.45, fin:.33, jelly:.22 };
  if(z >= 2) w.bird = .24;
  if(z >= 3){ w.log = .2; w.double = .16; }
  if(z >= 4){ w.stair = .18; }
  for(const k in mod.w) w[k] = (w[k] || .1) * mod.w[k];
  let tot = 0; for(const k in w) tot += w[k];
  let r = rnd() * tot; for(const k in w){ r -= w[k]; if(r <= 0) return k; }
  return 'rock';
}
function spawn(){
  const sp = st.speed, z = st.zone, kind = pickKind();
  /* 간격은 '뜬 시간 × 속도'에 비례한다 — 구간이 올라갈수록 비율이 줄어 빡빡해진다(그래도 억울한 판은 없게: qa/gamefair.mjs 가 검증) */
  const air = (2*JV/G) * sp, gap = air * [0.78, 0.74, 0.68, 0.64][z - 1] + 30 + rnd() * (46 - 7 * (z - 1));
  const parts = kind === 'double' ? [['rock', 0], ['rock', 22]] : kind === 'stair' ? [['rock', 0], ['fin', 46]] : [[kind, 0]];
  let end = 0;
  parts.forEach(([k, dx])=>{ const d = DIM[k]; st.obs.push({ k, w:d.w, h:d.h, y:d.y, x:W + 8 + dx }); end = Math.max(end, dx + d.w); });
  /* 조개 — 뛰어넘는 길목이 곧 보상. 갈매기 아래엔 땅 가까이에 둔다(갈매기를 피해 '안 뛰는' 쪽이 보상) */
  if(rnd() < 0.7){ const o = st.obs[st.obs.length - 1]; st.pick.push({ x:o.x + o.w/2 - 3, y:kind === 'bird' ? 4 : o.h + 20 + rnd()*8, got:false }); }
  st.next = end + gap;
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
  s.speed = Math.min(240, 100 + s.t * 4.2);
  const zi = s.t < ZONES[1][0] ? 1 : s.t < ZONES[2][0] ? 2 : s.t < ZONES[3][0] ? 3 : 4;
  if(zi > s.zone){ s.zone = zi; s.pops.push({ x:34, y:GY - 96, t:0, life:1.4, v:(zi === 4 ? '⛈ ' : '🌊 ') + '구간 ' + zi + ' · ' + ZONES[zi - 1][1] }); vib([10, 20, 10]); beep(440, 880, 0.18, 'triangle', 0.05); }
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
  s.pops.forEach(p=>{ p.t += dt; p.y += 26 * dt; }); s.pops = s.pops.filter(p=>p.t < (p.life || 0.7));
  // 충돌 — 서퍼 몸통은 그림보다 좁게 잡는다(억울한 죽음이 제일 싫다)
  const sx = 40, sw = 12, sb = s.y, st_ = s.y + 20;
  s.invuln = Math.max(0, s.invuln - dt);
  for(const o of s.obs){
    const ox = o.x + 2, ow = o.w - 4, ob = o.y, ot = o.y + o.h - 2;
    if(sx + sw > ox && sx < ox + ow && sb < ot && st_ > ob){
      if(s.invuln > 0) continue;                                        // 막 튜브가 터진 직후엔 잠깐 무적
      if(s.shield){ s.shield = 0; s.invuln = 0.8; s.flash = 0.45; s.obs = s.obs.filter(x=>x !== o);
        s.pops.push({ x:36, y:GY - 40, t:0, v:'🛟 튕겨냄' }); vib([20, 30, 20]); beep(500, 250, 0.18, 'triangle', 0.06); break; }
      wipeout(); return;
    }
  }
  for(const p of s.pick){
    if(!p.got && sx + sw + 3 > p.x && sx - 3 < p.x + 7 && sb < p.y + 7 && st_ > p.y){ p.got = true; s.shells++; s.pops.push({ x:p.x, y:GY - p.y - 10, t:0, v:'+10' }); vib(6); beep(880, 1320, 0.09, 'triangle', 0.06);
      if(s.shells % 8 === 0 && !s.shield){ s.shield = 1; s.pops.push({ x:30, y:GY - 56, t:0, v:'🛟 구명튜브!' }); beep(660, 1320, 0.2, 'triangle', 0.07); } }
  }
}

function wipeout(){
  st.dead = true; st.flash = 1; st.shake = 5; held = false; beep(220, 60, 0.4, 'sawtooth', 0.07);
  vib([40, 30, 60]);
  if(!window._gameSim) setTimeout(finish, 650);
}
function finish(){
  if(mode !== 'run') return;
  mode = 'over'; window._gameRun = false;
  const sc = score();
  const r = typeof playGameDone === 'function' ? playGameDone(sc, daily, st.shells) : { gain:0, newBest:false, best:sc };
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
    else if(o.k === 'log'){ R('#8A5A3C', o.x, by + 1, o.w, o.h - 1); R('#B07A52', o.x, by, o.w, 2); R('#6B4328', o.x, by + o.h - 2, o.w, 2); R('#D9A878', o.x, by + 2, 3, o.h - 3); R('#6B4328', o.x + 1, by + 4, 1, 1); R('#FFFFFF', o.x - 2, GY - 1, o.w + 4, 1); }
    else if(o.k === 'bird'){ const f = ((s.t * 9) | 0) % 2, by2 = by + Math.round(Math.sin(s.t * 6 + o.x / 9));
      R('#FFFFFF', o.x + 2, by2 + 3, 8, 3); R('#FFFFFF', o.x, by2 + 4, 3, 2); R('#FFB347', o.x - 2, by2 + 4, 2, 1); R('#1B1B2F', o.x + 1, by2 + 3, 1, 1);
      R('#DDE7F2', o.x + 4, f ? by2 : by2 + 5, 5, 3); R('#B9C9DC', o.x + 6, f ? by2 - 1 : by2 + 7, 3, 2); }
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
      if(s.invuln > 0 && ((s.t * 20) | 0) % 2) ctx.globalAlpha = 0.45;                  // 무적 중엔 깜빡인다
      ctx.translate(x + me.width/2, y + me.height/2); ctx.rotate(tilt); ctx.drawImage(me, -me.width/2, -me.height/2);
      if(s.shield){ ctx.globalAlpha = 0.9; ctx.lineWidth = 2; ctx.strokeStyle = '#FF6B6B'; ctx.beginPath(); ctx.arc(0, 4, 16 + Math.sin(s.t * 8), 0, 6.3); ctx.stroke();
        ctx.strokeStyle = '#FFFFFF'; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.arc(0, 4, 16 + Math.sin(s.t * 8), 0, 6.3); ctx.stroke(); ctx.setLineDash([]); }
    }
    ctx.restore();
  }
  // 점수 팝
  ctx.font = '8px Galmuri11, sans-serif'; ctx.textBaseline = 'top';
  s.pops.forEach(p=>{ ctx.globalAlpha = Math.min(1, 1 - p.t / (p.life || 0.7) + 0.2); ctx.fillStyle = '#FFE27A'; ctx.fillText(p.v, Math.round(p.x - 2), Math.round(p.y - p.t * 20)); ctx.globalAlpha = 1; });
  if(s.zone >= 4 && !s.dead){ ctx.globalAlpha = 0.16; R('#0B1E3F', 0, 0, W, H); ctx.globalAlpha = 0.5;
    for(let i = 0; i < 26; i++){ const rx = (i * 37 + s.t * 120) % (W + 20) - 10, ry = (i * 53 + s.t * 380) % H; R('#CFE6FF', W - rx, ry, 1, 5); } ctx.globalAlpha = 1; }
  if(s.flash > 0){ ctx.globalAlpha = s.flash * 0.55; R('#FFFFFF', 0, 0, W, H); ctx.globalAlpha = 1; }
  ctx.restore();
  $g('g-score').textContent = score();
}

function loop(t){
  raf = requestAnimationFrame(loop);
  if(!last) last = t;
  let dt = (t - last) / 1000; last = t; dt = Math.min(dt, 0.033);        // 탭을 다녀오면 dt 가 커진다 — 한 번에 뛰어넘지 않게
  if(mode === 'run'){ acc += dt; let n = 0; while(acc >= FIX && n++ < 6){ step(FIX); acc -= FIX; if(mode !== 'run') break; } }
  else if(mode === 'idle'){ st.t += dt; st.clouds.forEach(c=>{ c.x -= c.s * dt; if(c.x < -30) c.x = W + 10; }); }
  draw();
}

/* ── 화면 ── */
function dailyRows(){
  const day = today();
  return (state.town||[]).filter(x=>x.id !== ME.id).map(x=>{ const d = (typeof peerPlay === 'function' ? peerPlay(x.profile?.play)?.dbest : null); return d && d.day === day ? { id:x.id, name:x.name, best:d.score } : null; }).filter(Boolean)
    .concat((ME.profile.play?.dbest?.day === day) ? [{ id:ME.id, name:ME.name, best:ME.profile.play.dbest.score }] : []).sort((a,b)=>b.best - a.best).slice(0, 3);
}
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
  mod = MODS[hashStr('mod-' + today()) % MODS.length];                                  // 시작 화면엔 오늘의 파도(챌린지와 같다)
  $g('g-ov').hidden = false;
  $g('g-ov').innerHTML = `<div class="go-card">
      <div class="go-t">🏄 파도 점프</div>
      <div class="go-d">탭하면 점프 · 길게 누르면 더 높이<br>🐦 갈매기는 <b>뛰지 말고</b> 아래로 · 🪵 통나무는 <b>높이</b></div>
      <div class="go-b" style="margin:0 0 6px">${mod.ic} 오늘의 파도 <b>${esc(mod.n)}</b></div>
      <div class="go-b">내 최고 <b>${p.best || 0}</b>점 · 🐚 보유 <b>${typeof shellBal === 'function' ? shellBal() : 0}</b></div>
      ${top.length ? `<div class="go-r">${top.map((r,i)=>`<span>${['🥇','🥈','🥉'][i]} ${esc(r.name)} ${r.best}</span>`).join('')}</div>` : ''}
      <div class="go-b" style="margin:0 0 8px">📅 오늘의 챌린지 내 기록 <b>${(p.dbest && p.dbest.day === today()) ? p.dbest.score : '—'}</b></div>
      <button class="btn blue" id="g-go" type="button" style="width:100%;min-height:52px;font-size:16px">📅 오늘의 챌린지 <small style="font-weight:700">모두 같은 코스</small></button>
      <button class="btn ghost" id="g-free" type="button" style="width:100%;min-height:48px;margin-top:8px">자유 플레이</button></div>`;
  $g('g-go').onclick = ()=>begin(true); $g('g-free').onclick = ()=>begin(false);
}
function begin(isDaily){
  daily = isDaily === true;
  me = mkMe(); TH = themeNow(); reset(); mode = 'run'; window._gameRun = true; $g('g-ov').hidden = true; last = 0; held = false; acc = 0;
}
function showOver(sc, r){
  const p = ME.profile.play || {};
  const v = (typeof VOICES !== 'undefined' && VOICES.length) ? VOICES[Math.floor(Math.random() * VOICES.length)] : null;
  $g('g-ov').hidden = false;
  $g('g-ov').innerHTML = `<div class="go-card">
      <div class="go-t">${daily ? '📅 ' : ''}${r.newBest && sc > 0 ? '🎉 최고 기록!' : '🌊 와이프아웃'}</div>
      <div class="go-s">${sc}<small>점</small></div>
      <div class="go-b" style="margin:0 0 4px">구간 ${st.zone} · ${esc(ZONES[st.zone - 1][1])}${daily ? ' · ' + mod.ic + ' ' + esc(mod.n) : ''}</div>
      <div class="go-b">🐚 +${st.shells} (보유 ${r.bal ?? '–'}) · 최고 <b>${p.best || sc}</b>점${r.gain ? ` · <b>+${r.gain} XP</b>` : ' · 오늘 XP는 다 채웠어요'}</div>
      ${daily ? (()=>{ const rk = dailyRows(); return rk.length ? `<div class="go-r" style="margin-bottom:10px"><span style="color:var(--ink)">오늘의 챌린지 순위</span>${rk.map((q,i)=>`<span>${['🥇','🥈','🥉'][i]} ${esc(q.name)} ${q.best}</span>`).join('')}</div>` : ''; })() : ''}
      ${v ? `<div class="go-v">“${esc(v[0])}”<small>— ${esc(v[1])}</small></div>` : ''}
      <div style="display:flex;gap:8px"><button class="btn blue" id="g-again" type="button" style="flex:1;min-height:52px;font-size:16px">한 판 더</button>
        <button class="btn ghost" id="g-exit" type="button" style="min-height:52px">닫기</button></div>
      ${sc >= 100 && typeof sendChat === 'function' ? `<button class="btn ghost" id="g-brag" type="button" style="width:100%;min-height:48px;margin-top:8px">📣 마을에 자랑하기</button>` : ''}</div>`;
  $g('g-again').onclick = ()=>begin(daily); $g('g-exit').onclick = gameClose;
  if($g('g-brag')) $g('g-brag').onclick = async ()=>{ const b = $g('g-brag'); b.disabled = true;
    await sendChat(`🎮 파도 점프 ${sc}점!${r.newBest ? ' (내 최고 기록 🎉)' : ''}`, true); b.textContent = '✅ 올렸어요'; };
}

function gameOpen(){
  cv = $g('g-cv'); ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  $g('game').hidden = false; document.body.classList.add('game-on');
  try{ snd = localStorage.getItem('lineup.share.snd') === '1'; }catch(e){}            // 놀이 메뉴 설정에서 바꿨을 수 있다
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
    if((e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') && !e.repeat){ e.preventDefault(); if(mode === 'run') jump(); else if(mode === 'idle') begin(true); else if(mode === 'over') begin(daily); }
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
window._game = { clone:()=>structuredClone(st), swap:s=>{ const o = st; st = s; return o; }, FIX, get mod(){ return mod; }, set mod(i){ mod = MODS[i]; }, MODS, get TH(){ return TH; }, setTheme:k=>{ TH = THEMES[k]; }, pause, get st(){ return st; }, get mode(){ return mode; }, step, jump, release, score, begin, reset: ()=>reset() };
})();
