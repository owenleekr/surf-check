/* ── 파도 점프 ─────────────────────────────────────────────────────
   쉬는 시간에 한 판. 내 캐릭터가 보드를 타고 달리고, 바위·지느러미·해파리를 뛰어넘어
   조개를 모은다. 한 번 탭 = 점프, 길게 누르면 더 높이.

   세계는 180×220 단위로 계산하고, 그림은 기기 해상도(K배)로 매끈하게 그린다 — 도트 대신 원정처럼 부드러운 그림.
   스프라이트(내 모찌·보드·장애물·조개·아이템)는 한 번만 구워 두고 매 프레임엔 붙이기만 한다(SVG 를 매번 읽지 않는다).
   물리는 고정 단위(초)로 돈다. 기기 프레임이 달라도 점프 높이·속도가 같아야 점수를 비교할 수 있다.

   점수는 프로필(play.best)에 얹혀 동기 순위에 나온다. 서버 검증은 없다 — 재미로만.

   난이도: 시간이 지나면 '구간'이 올라간다(잔잔한 바다 → 갈매기 → 통나무·연속 → 폭풍). 구간마다 새 장애물이 붙고
   속도·간격이 빡빡해진다. 갈매기는 '뛰지 말고 아래로' 지나가야 하고, 통나무는 높이 뛰어야 한다 — 탭을 연타하면 죽는다.
   오늘의 파도(MODS)는 날짜로 정해져 모두 같다. 장애물은 전부 rnd() 한 줄로만 뽑아 오늘의 챌린지 코스가 같게 유지된다.
   연출(물보라·멈칫·흔들림·배너)은 st 밖(vis)에 둔다 — 코스 재현·공정성 검사(clone)에 섞이면 안 된다. */

(function(){
const W = 180, H = 220, GY = 168;               // 월드 크기, 보드가 닿는 수면 높이
const G = 760, JV = 262, CUT = 120;             // 중력, 점프 속도, 일찍 떼면 깎는 속도(px/s)
let cv, ctx, st = null, raf = 0, last = 0, mode = 'idle', held = false;
/* 오늘의 챌린지 — 날짜로 씨앗을 줘서 모두가 같은 장애물 순서를 만난다. 같은 코스라야 점수를 견줄 수 있다.
   물리를 고정 단위(1/60초)로 돌리는 것도 같은 이유다: 기기 프레임이 달라도 같은 입력이면 같은 결과가 나온다. */
let daily = false, rnd = Math.random, acc = 0;
const FIX = 1 / 60;
/* 스테이지 — 시간이 지나면 배경(하늘·멀리 보이는 풍경)이 바뀌고 장애물이 늘어난다 */
const ZONES = [[0,'아침 낙산','day','light'],[14,'한낮 죽도','noon','island'],[32,'노을 인구','sunset','mount'],[55,'밤 폭풍','night','storm'],[85,'전설의 파도','aurora','aurora']];
const LIVES = 3;
/* 아이템 — 조개(점수) 말고도 판을 바꾸는 것들. 뽑기는 rnd() 로만(오늘의 챌린지 코스가 같게) */
const ITEMS = { heart:{ ic:'❤️', n:'목숨 +1', c:'#FF6B8A' }, tube:{ ic:'🛟', n:'구명튜브', c:'#FF8A5B' }, star:{ ic:'⭐', n:'무적 5초', c:'#FFC23D' }, magnet:{ ic:'🧲', n:'조개 자석', c:'#7A8CFF' },
  slow:{ ic:'🐢', n:'느리게', c:'#3FC489' }, gem:{ ic:'💎', n:'+50', c:'#3FB8FF' }, x2:{ ic:'✖️2', n:'점수 2배', c:'#FFA41F' } };
const MODS = [
  { n:'균형 잡힌 바다', ic:'🌊', w:{} }, { n:'갈매기의 날', ic:'🐦', w:{ bird:2.4 } }, { n:'통나무의 날', ic:'🪵', w:{ log:2.6, double:1.6 } },
  { n:'해파리 떼의 날', ic:'🪼', w:{ jelly:2.6 } }, { n:'상어의 날', ic:'🦈', w:{ fin:2.3 } }, { n:'연속의 날', ic:'⛓️', w:{ double:2.4, stair:2.4 } } ];
let mod = MODS[0];
/* 쉬움 = 처음 버전(목숨 1·아이템·스테이지 없음·느린 속도), 어려움 = 지금 버전. 점수는 따로 쌓는다(best / hbest).
   오늘의 챌린지는 모두가 하도록 쉬움으로 고정. 고른 모드는 이 기기에 기억한다. */
let hard = false; try{ hard = localStorage.getItem('lineup.share.jmode') === 'hard'; }catch(e){}
const hashStr = s => { let h = 2166136261; for(const c of s){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

const $g = id => document.getElementById(id);
/* 지금 시각의 하늘 — 저녁에 켠 사람은 노을을, 밤에 켠 사람은 달을 본다. 같은 게임이 매번 같은 낮이면 금방 질린다. */
const THEMES = {
  day:    { sky:['#CFEFFF','#B5E5FF','#9DDBFF','#86D0FA'], sun:'#FFE27A', far:'#5BB4EE', mid:'#3F9BDF', near:'#2C84CB', deep:'#1F6FB5', w:['#8CCBF6','#6DB4EA','#9ED3F7','#4C98D8','#3A86C8','#2C76B8'], cloud:'#FFFFFF', cloud2:'#E4F4FF', stars:false },
  sunset: { sky:['#FFE3B8','#FFC48C','#FF9F7A','#E97C86'], sun:'#FFB347', far:'#C0689A', mid:'#8E5AA6', near:'#5F4C9A', deep:'#3E3A86', w:['#F0A7B4','#C98BC0','#E7B0C8','#6F5CB0','#5B4BA0','#4A3D90'], cloud:'#FFE2CF', cloud2:'#F4B8A0', stars:false },
  noon:   { sky:['#9FE2FF','#7FD6FF','#62C9FA','#46BCF2'], sun:'#FFF27A', far:'#2FA7E0', mid:'#1E93D3', near:'#1680C2', deep:'#106BAA', w:['#7BD0F5','#5AC0EE','#9BDDF8','#3E9ED6','#2F8CC4','#2479B0'], cloud:'#FFFFFF', cloud2:'#E9F7FF', stars:false },
  aurora: { sky:['#06131F','#0B2230','#0F3140','#15404E'], sun:'#E0FFF4', far:'#14505A', mid:'#0F4350', near:'#0B3644', deep:'#082A38', w:['#2C8C88','#25757A','#3AA39A','#1C5F68','#174F5A','#12414C'], cloud:'#173A48', cloud2:'#122F3C', stars:true, aur:true },
  night:  { sky:['#0B1E3F','#10294F','#16355F','#1E4270'], sun:'#E8EEF9', far:'#1E4F85', mid:'#18416F', near:'#12335A', deep:'#0E2848', w:['#2D6AA8','#27598F','#356FAA','#1F4D80','#1A416F','#15375F'], cloud:'#2A4673', cloud2:'#1F3A62', stars:true },
};
const themeNow = () => { const h = new Date().getHours(); return THEMES[(h >= 19 || h < 5) ? 'night' : (h >= 17 || h < 6) ? 'sunset' : 'day']; };
let TH = THEMES.day;
const STARS = Array.from({length:22}, (_,i)=>({ x:(i*47 + 13) % W, y:(i*29 + 7) % 100, s:(i % 3 === 0) ? 1.1 : .7 }));
const GLINT = Array.from({length:14}, (_,i)=>({ x:(i*53 + 11) % W, y:122 + (i*17) % 42, l:2 + i % 3 }));

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

/* ── 연출 상태 — 실제 시간으로 흐르고, 시뮬레이션(st)에는 들어가지 않는다 ── */
const RM = (()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })();   // 흔들림·번쩍임을 줄인다
const FONT = '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", sans-serif';
const EMO = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const INK = '#3A3040';                          // 모찌 그림과 같은 테두리 색 — 한 세계처럼 보이게
const PX = 46;                                   // 보드 가운데(충돌 몸통 40~52 의 가운데)
let K = 2, SPR = {}, GR = null, meImg = null, RIDER = null, meUrl = '';
const vis = { stop:0, shake:0, flash:0, jt:0, lt:0, ban:null, combo:0, maxCombo:0, comboT:0, best:0, spray:0 };
let PASSED = new WeakSet();
/* 입자 — 미리 만들어 둔 160개를 돌려 쓴다(매 프레임 새 객체를 만들지 않게) */
const PP = Array.from({length:160}, ()=>({ on:false, x:0, y:0, vx:0, vy:0, g:0, t:0, life:1, r:1, c:'#fff', k:0 }));
let pIx = 0;
function part(x, y, vx, vy, life, r, c, g, k){ const p = PP[pIx]; pIx = (pIx + 1) % PP.length; p.on = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.t = 0; p.life = life; p.r = r; p.c = c; p.g = g == null ? 300 : g; p.k = k || 0; }
function burst(x, y, n, cols, sp, up, r, k){ for(let i = 0; i < n; i++){ const a = Math.random() * Math.PI * 2, v = sp * (0.35 + Math.random() * 0.65); part(x, y, Math.cos(a) * v, Math.sin(a) * v - up, 0.35 + Math.random() * 0.4, r * (0.6 + Math.random() * 0.6), cols[i % cols.length], k === 1 ? 60 : 280, k); } }
const SPLASH = ['#FFFFFF','#E3F6FF','#BFE6FF'];
/* 사건 → 연출. 뽑기는 Math.random 만 — rnd() 를 쓰면 오늘의 챌린지 코스가 어긋난다 */
function ev(k, a){
  if(window._gameSim || !st) return;
  const s = st, py = GY - s.y;
  if(k === 'jump'){ vis.jt = 0.16; burst(PX - 8, GY, 7, SPLASH, 50, 40, 1.3); }
  else if(k === 'land'){ vis.lt = 0.15; burst(PX - 2, GY, 9, SPLASH, 55, 34, 1.4); }
  else if(k === 'shell'){ const x = a.x + 3.5, y = GY - a.y - 3.5; burst(x, y, 8, ['#FFE27A','#FFFFFF','#FFC46B'], 60, 10, 1.7, 1); part(x, y, 0, 0, 0.35, 3, '#FFE9A8', 0, 2); }
  else if(k === 'item'){ burst(PX, py - 14, 14, ['#FFE27A','#9BE7FF','#FF9BD2','#FFFFFF'], 80, 20, 1.9, 1); part(PX, py - 14, 0, 0, 0.45, 5, '#FFFFFF', 0, 2); vis.flash = Math.max(vis.flash, 0.22); }
  else if(k === 'smash'){ burst(a.x + a.w / 2, GY - a.y - a.h / 2, 14, ['#FFE27A','#B9A9D6','#FFFFFF'], 95, 40, 1.8); vis.shake = 2.5; vis.stop = 0.05; }
  else if(k === 'shield'){ part(PX, py - 12, 0, 0, 0.5, 7, '#FF8A8A', 0, 2); burst(PX, py - 12, 12, ['#FF6B6B','#FFFFFF'], 80, 20, 1.6); vis.stop = 0.08; vis.shake = 3; }
  else if(k === 'hit'){ burst(PX, GY - 4, 16, SPLASH, 90, 60, 1.8); vis.stop = 0.13; vis.shake = 5; vis.flash = 0.35; vis.combo = 0;
    burst(10 + s.lives * 12, 10, 8, ['#FF5A78','#FFB3C1'], 40, 10, 1.2); }
  else if(k === 'crash'){ burst(PX, GY - 4, 26, SPLASH, 110, 80, 2); vis.stop = 0.16; vis.shake = 7; vis.flash = 0.6; vis.combo = 0; }
  else if(k === 'stage'){ vis.ban = { t:0, top:'STAGE ' + a, name:ZONES[a - 1][1] }; vis.flash = 0.45; }
  else if(k === 'pass'){ vis.combo++; vis.maxCombo = Math.max(vis.maxCombo, vis.combo); vis.comboT = 0.3;
    if(vis.combo % 5 === 0) s.pops.push({ x:PX - 18, y:GY - 70, t:0, life:1, v:'연속 ' + vis.combo + '! 🔥', big:1 }); }
}

function reset(){
  rnd = daily ? mulberry(hashStr('wave-' + today())) : Math.random;
  mod = daily ? MODS[hashStr('mod-' + today()) % MODS.length] : MODS[Math.floor(Math.random() * MODS.length)];
  st = { t:0, zone:1, pts:0, lives:hard ? LIVES : 1, lost:0, items:0, fx:{ star:0, magnet:0, slow:0, x2:0 }, nextItem:hard ? 420 : Infinity, dist:0, speed:100, y:0, vy:0, air:false, buf:0, coyote:0, shells:0, shield:0, invuln:0, obs:[], pick:[], next:150, nextShell:260,
         dead:false, deadT:0, flash:0, shake:0, clouds:[{x:20,y:18,s:3},{x:100,y:34,s:5},{x:150,y:12,s:2}], pops:[] };
  PASSED = new WeakSet(); vis.combo = 0; vis.maxCombo = 0; vis.ban = null; vis.stop = 0;
}
const score = () => Math.floor(st.pts);
const mult = () => st.fx.x2 > 0 ? 2 : 1;

const DIM = { rock:{ w:12, h:10, y:0 }, fin:{ w:14, h:17, y:0 }, jelly:{ w:10, h:10, y:3 }, log:{ w:28, h:8, y:0 }, bird:{ w:12, h:7, y:24 } };
/* 구간이 올라갈수록 장애물 종류가 늘어난다. 뽑기는 rnd() 한 번 — 오늘의 챌린지에서 모두 같은 코스가 나오게 */
function pickKind(){
  const z = st.zone, w = { rock:.45, fin:.33, jelly:.22 };
  if(!hard){ const r = rnd(); return r < .45 ? 'rock' : r < .78 ? 'fin' : 'jelly'; }        // 쉬움: 처음 버전 그대로
  if(z >= 2) w.bird = .24;
  if(z >= 3){ w.log = .2; w.double = .16; }
  if(z >= 4){ w.stair = .18; }
  if(z >= 5){ w.bird *= 1.3; w.double *= 1.3; w.stair *= 1.3; }
  for(const k in mod.w) w[k] = (w[k] || .1) * mod.w[k];
  let tot = 0; for(const k in w) tot += w[k];
  let r = rnd() * tot; for(const k in w){ r -= w[k]; if(r <= 0) return k; }
  return 'rock';
}
function spawn(){
  const sp = st.speed, z = st.zone, kind = pickKind();
  /* 간격은 '뜬 시간 × 속도'에 비례한다 — 구간이 올라갈수록 비율이 줄어 빡빡해진다(그래도 억울한 판은 없게: qa/gamefair.mjs 가 검증) */
  const air = (2*JV/G) * sp, gap = hard ? air * [0.78, 0.74, 0.68, 0.64, 0.6][z - 1] + 30 + rnd() * (46 - 7 * Math.min(3, z - 1)) : air * 0.78 + 34 + rnd() * 46;
  const parts = kind === 'double' ? [['rock', 0], ['rock', 22]] : kind === 'stair' ? [['rock', 0], ['fin', 46]] : [[kind, 0]];
  let end = 0;
  parts.forEach(([k, dx])=>{ const d = DIM[k]; st.obs.push({ k, w:d.w, h:d.h, y:d.y, x:W + 8 + dx }); end = Math.max(end, dx + d.w); });
  /* 조개 — 뛰어넘는 길목이 곧 보상. 갈매기 아래엔 땅 가까이에 둔다(갈매기를 피해 '안 뛰는' 쪽이 보상) */
  if(rnd() < 0.7){ const o = st.obs[st.obs.length - 1]; st.pick.push({ x:o.x + o.w/2 - 3, y:kind === 'bird' ? 4 : o.h + 20 + rnd()*8, got:false }); }
  st.next = end + gap;
}

/* 아이템 하나 — 장애물과 겹치지 않는 높이·자리에. 하트는 목숨이 줄었을 때만 나온다 */
function spawnItem(){
  const w = { tube:.16, star:.12, magnet:.18, slow:.14, gem:.14, x2:.16 };
  if(st.lives < LIVES) w.heart = .14;
  let tot = 0; for(const k in w) tot += w[k];
  let r = rnd() * tot, k = 'gem'; for(const q in w){ r -= w[q]; if(r <= 0){ k = q; break; } }
  const y = [6, 24, 40][Math.floor(rnd() * 3)];
  const x = W + 30;
  if(st.obs.some(o=>Math.abs(o.x - x) < 26)) return;                             // 장애물 바로 위엔 두지 않는다
  st.pick.push({ x, y, got:false, it:k });
}

function jump(){
  if(mode !== 'run' || st.dead) return;
  if(!st.air || st.coyote > 0){ st.vy = JV; st.air = true; st.coyote = 0; st.buf = 0; held = true; vib(8); beep(300, 560, 0.12, 'square', 0.04); ev('jump'); }
  else st.buf = 0.12;                                // 착지 직전에 눌러도 먹는다
}
function release(){ held = false; if(st && st.vy > CUT) st.vy = CUT; }

function step(dt){
  const s = st; s.t += dt;
  if(s.dead){ s.deadT += dt; s.flash = Math.max(0, s.flash - dt*3); s.shake = Math.max(0, s.shake - dt*20); return; }
  for(const k in s.fx) s.fx[k] = Math.max(0, s.fx[k] - dt);
  s.speed = hard ? Math.min(250, 100 + s.t * 4.2) * (s.fx.slow > 0 ? 0.62 : 1) : Math.min(210, 92 + s.t * 3.4);
  let zi = 1; if(hard) ZONES.forEach((z, i)=>{ if(s.t >= z[0]) zi = i + 1; });
  if(zi > s.zone){ s.zone = zi; TH = THEMES[ZONES[zi - 1][2]]; s.flash = 0.35; vib([10, 20, 10]); beep(440, 880, 0.18, 'triangle', 0.05); ev('stage', zi); }
  s.dist += s.speed * dt; s.pts += s.speed * dt / 14 * mult();
  s.nextItem -= s.speed * dt; if(s.nextItem <= 0){ spawnItem(); s.nextItem = 520 + rnd() * 420; }
  // 점프 물리
  if(s.air){ s.vy -= G * dt; s.y += s.vy * dt;
    if(s.y <= 0){ s.y = 0; s.vy = 0; s.air = false; s.coyote = 0.08; ev('land'); if(s.buf > 0){ s.buf = 0; jump(); } } }
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
  if(!window._gameSim) for(const o of s.obs) if(o.x + o.w < sx && !PASSED.has(o)){ PASSED.add(o); ev('pass'); }   // 넘은 장애물 — 연속 표시(점수엔 영향 없음)
  s.invuln = Math.max(0, s.invuln - dt);
  for(const o of s.obs){
    const ox = o.x + 2, ow = o.w - 4, ob = o.y, ot = o.y + o.h - 2;
    if(sx + sw > ox && sx < ox + ow && sb < ot && st_ > ob){
      if(s.fx.star > 0){ ev('smash', o); s.obs = s.obs.filter(x=>x !== o); s.pts += 20 * mult(); s.pops.push({ x:o.x, y:GY - 34, t:0, v:'⭐ 쾅! +20' }); vib(10); beep(700, 1400, 0.1, 'square', 0.05); break; }
      if(s.invuln > 0) continue;                                        // 막 튜브가 터진 직후엔 잠깐 무적
      if(s.shield){ s.shield = 0; s.invuln = 0.8; s.flash = 0.45; s.obs = s.obs.filter(x=>x !== o); ev('shield');
        s.pops.push({ x:36, y:GY - 40, t:0, v:'🛟 튕겨냄' }); vib([20, 30, 20]); beep(500, 250, 0.18, 'triangle', 0.06); break; }
      s.lives--; s.lost++;
      if(s.lives <= 0){ wipeout(); return; }
      /* 목숨이 남았으면 넘어졌다 다시 탄다 — 잠깐 무적, 부딪힌 장애물은 치운다 */
      s.invuln = 1.4; s.flash = 0.6; s.shake = 4; s.obs = s.obs.filter(x=>x !== o); ev('hit');
      s.pops.push({ x:30, y:GY - 46, t:0, life:1, v:'💔 목숨 ' + s.lives + '개 남음' }); vib([30, 40, 30]); beep(300, 120, 0.25, 'sawtooth', 0.06); break;
    }
  }
  if(s.fx.magnet > 0) s.pick.forEach(p=>{ if(!p.it && p.x < 120 && p.x > 20){ p.x += (44 - p.x) * Math.min(1, dt * 5); p.y += (10 + s.y - p.y) * Math.min(1, dt * 5); } });
  for(const p of s.pick){
    if(!p.got && p.it && sx + sw + 4 > p.x && sx - 4 < p.x + 9 && sb < p.y + 9 && st_ > p.y){ p.got = true; s.items++; got(p.it); continue; }
    if(!p.it && !p.got && sx + sw + 3 > p.x && sx - 3 < p.x + 7 && sb < p.y + 7 && st_ > p.y){ p.got = true; s.shells++; s.pts += 10 * mult(); s.pops.push({ x:p.x, y:GY - p.y - 10, t:0, v:'+' + 10 * mult() }); vib(6); beep(880, 1320, 0.09, 'triangle', 0.06); ev('shell', p);
      if(s.shells % (hard ? 8 : 5) === 0 && !s.shield){ s.shield = 1; s.pops.push({ x:30, y:GY - 56, t:0, v:'🛟 구명튜브!' }); beep(660, 1320, 0.2, 'triangle', 0.07); } }
  }
}

function got(k){
  const s = st, it = ITEMS[k];
  if(k === 'heart') s.lives = Math.min(LIVES, s.lives + 1);
  else if(k === 'tube') s.shield = 1;
  else if(k === 'star') s.fx.star = 5;
  else if(k === 'magnet') s.fx.magnet = 8;
  else if(k === 'slow') s.fx.slow = 5;
  else if(k === 'x2') s.fx.x2 = 8;
  else if(k === 'gem') s.pts += 50 * mult();
  s.pops.push({ x:30, y:GY - 60, t:0, life:1, v:it.ic + ' ' + it.n }); vib([8, 20, 8]); beep(660, 1320, 0.2, 'triangle', 0.07); ev('item', k);
}

function wipeout(){
  st.dead = true; st.flash = 1; st.shake = 5; held = false; beep(220, 60, 0.4, 'sawtooth', 0.07); ev('crash');
  vib([40, 30, 60]);
  if(!window._gameSim) setTimeout(finish, 650);
}
function finish(){
  if(mode !== 'run') return;
  mode = 'over'; window._gameRun = false;
  const sc = score();
  const r = typeof playGameDone === 'function' ? playGameDone(sc, daily, st.shells, hard) : { gain:0, newBest:false, best:sc };
  showOver(sc, r);
  if(typeof popNext === 'function') setTimeout(popNext, 400);
}

/* ── 스프라이트 굽기 — K배 해상도 캔버스에 한 번 그려 두고 붙여 쓴다 ── */
function mk(w, h){ const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w * K)); c.height = Math.max(1, Math.ceil(h * K)); const x = c.getContext('2d'); x.scale(K, K); x.lineJoin = 'round'; x.lineCap = 'round'; return { c, x, w, h }; }
function outl(x, P, lw){ x.strokeStyle = INK; x.lineWidth = lw || .85; x.stroke(P); }
function inside(x, P, fn){ x.save(); x.clip(P); fn(); x.restore(); }
function lg(x, x0, y0, x1, y1, a, b){ const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
function blob(x, cx, cy, rx, ry, col, rot){ x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, rot || 0, 0, 7); x.fill(); }
const BAKE = {
  rock(){ const w = 12, h = 10, S = mk(w + 6, h + 6), x = S.x; x.translate(3, 3);
    const P = new Path2D(); P.moveTo(-.6, h + .5); P.bezierCurveTo(-1.2, h * .5, 1, .6, w * .45, .3); P.bezierCurveTo(w * .78, 0, w + 1, h * .4, w + .6, h + .5); P.closePath();
    x.fillStyle = lg(x, 0, 0, 0, h, '#ACA4C6', '#5E5670'); x.fill(P);
    inside(x, P, ()=>{ blob(x, w * .98, h * 1.05, w * .6, h * .72, 'rgba(42,30,64,.32)'); blob(x, w * .32, h * .28, w * .2, h * .11, 'rgba(255,255,255,.45)', -.5); blob(x, w * .2, h + .3, 3.2, 2, '#5FAF7E'); blob(x, w * .7, h * .62, .9, .7, 'rgba(255,255,255,.55)'); });
    outl(x, P); return S; },
  fin(){ const w = 14, h = 17, S = mk(w + 6, h + 6), x = S.x; x.translate(3, 3);
    const P = new Path2D(); P.moveTo(0, h + .5); P.bezierCurveTo(w * .2, h * .45, w * .42, h * .04, w * .92, 0); P.quadraticCurveTo(w * .6, h * .5, w * .84, h + .5); P.closePath();
    x.fillStyle = lg(x, 0, 0, w, h, '#9DB1CC', '#4E5F78'); x.fill(P);
    inside(x, P, ()=>{ blob(x, w * .95, h * .9, w * .35, h * .6, 'rgba(30,40,70,.3)', .3); x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(w * .14, h * .78); x.bezierCurveTo(w * .26, h * .42, w * .45, h * .14, w * .8, h * .05); x.stroke(); });
    outl(x, P); return S; },
  jelly(){ const w = 10, h = 10, S = mk(w + 6, h + 6), x = S.x; x.translate(3, 3);
    x.strokeStyle = '#F06BB0'; x.lineWidth = .9; for(let i = 0; i < 4; i++){ const tx = 1.6 + i * 2.3; x.beginPath(); x.moveTo(tx, 5.5); x.bezierCurveTo(tx - 1, 7, tx + 1, 8.5, tx - .3, 10.2); x.stroke(); }
    const P = new Path2D(); P.moveTo(-.3, 6.4); P.bezierCurveTo(-.6, -1.4, w + .6, -1.4, w + .3, 6.4); for(let i = 0; i < 4; i++){ const a = w + .3 - i * (w + .6) / 4, b = a - (w + .6) / 4; P.quadraticCurveTo((a + b) / 2, 7.7, b, 6.4); } P.closePath();
    const g = x.createRadialGradient(w * .38, 1.6, .4, w * .5, 4, 7); g.addColorStop(0, '#FFE6F3'); g.addColorStop(1, '#FF86C3'); x.fillStyle = g; x.fill(P);
    inside(x, P, ()=>{ x.fillStyle = 'rgba(200,60,140,.22)'; x.fillRect(-1, 5, w + 2, 3); blob(x, 2.8, 2.2, 1.7, 1, 'rgba(255,255,255,.75)', -.4); });
    blob(x, 3.6, 4.3, .55, .6, INK); blob(x, 6.4, 4.3, .55, .6, INK); blob(x, 2.3, 5.2, .85, .45, 'rgba(255,80,150,.45)'); blob(x, 7.7, 5.2, .85, .45, 'rgba(255,80,150,.45)');
    outl(x, P, .8); return S; },
  log(){ const w = 28, h = 8, S = mk(w + 6, h + 6), x = S.x; x.translate(3, 3);
    const P = new Path2D(); P.moveTo(3, 0); P.lineTo(w - 3, 0); P.quadraticCurveTo(w, 0, w, h / 2); P.quadraticCurveTo(w, h, w - 3, h); P.lineTo(3, h); P.closePath();
    x.fillStyle = lg(x, 0, 0, 0, h, '#CF9C6C', '#7A4B2E'); x.fill(P);
    inside(x, P, ()=>{ x.fillStyle = 'rgba(70,35,15,.25)'; x.fillRect(0, h * .62, w, h); x.strokeStyle = 'rgba(80,45,25,.55)'; x.lineWidth = .6;
      [[8, 2.4, 14], [15, 5.2, 22], [19, 2, 25]].forEach(([a, y, b])=>{ x.beginPath(); x.moveTo(a, y); x.quadraticCurveTo((a + b) / 2, y - .8, b, y); x.stroke(); }); blob(x, w * .55, 1.4, 6, .7, 'rgba(255,255,255,.3)'); });
    outl(x, P, .9);
    const E = new Path2D(); E.ellipse(3, h / 2, 2.8, h / 2 - .2, 0, 0, 7); x.fillStyle = '#EDCB98'; x.fill(E); x.strokeStyle = '#B07A52'; x.lineWidth = .5; x.beginPath(); x.ellipse(3, h / 2, 1.4, 2, 0, 0, 7); x.stroke(); outl(x, E, .8);
    x.save(); x.translate(w * .7, -.4); x.rotate(-.5); const L = new Path2D(); L.ellipse(0, -1.4, 1.1, 2.2, 0, 0, 7); x.fillStyle = '#6CC17A'; x.fill(L); outl(x, L, .6); x.restore();
    return S; },
  bird0(){ return bird(0); }, bird1(){ return bird(1); },
  shell(){ const S = mk(11, 10), x = S.x; x.translate(.5, .5);
    const P = new Path2D(); P.moveTo(5, 8.6); P.bezierCurveTo(.5, 7, -.2, 2.2, 2.2, 1); P.quadraticCurveTo(5, -.7, 7.8, 1); P.bezierCurveTo(10.2, 2.2, 9.5, 7, 5, 8.6); P.closePath();
    x.fillStyle = lg(x, 0, 0, 0, 9, '#FFEDC4', '#F49A55'); x.fill(P);
    inside(x, P, ()=>{ x.strokeStyle = 'rgba(170,90,40,.45)'; x.lineWidth = .5; [1.2, 3, 5, 7, 8.8].forEach(t=>{ x.beginPath(); x.moveTo(5, 8.2); x.lineTo(t, .5); x.stroke(); }); blob(x, 3.2, 2.6, 1.4, .8, 'rgba(255,255,255,.75)', -.5); });
    outl(x, P, .75); x.fillStyle = '#F2A35E'; x.fillRect(3.8, 7.8, 2.4, 1.2); return S; },
  board(){ const S = mk(30, 8), x = S.x;
    const P = new Path2D(); P.moveTo(1.4, 2); P.bezierCurveTo(.2, 2.2, .2, 5.2, 2.2, 5.2); P.lineTo(22, 5.2); P.bezierCurveTo(25.5, 5.2, 28, 3.6, 29.2, 1.2); P.bezierCurveTo(26, 1.6, 23, 2, 20, 2); P.closePath();
    const F = new Path2D(); F.moveTo(4, 5); F.quadraticCurveTo(4.6, 7.6, 7.6, 7.4); F.lineTo(8, 5); F.closePath(); x.fillStyle = '#2E5A86'; x.fill(F); outl(x, F, .6);
    x.fillStyle = lg(x, 0, 0, 30, 0, '#FF7A59', '#FFC04D'); x.fill(P);
    inside(x, P, ()=>{ x.fillStyle = 'rgba(120,30,40,.22)'; x.fillRect(0, 4.1, 30, 2); x.strokeStyle = '#FFFFFF'; x.lineWidth = .9; x.beginPath(); x.moveTo(3, 3.4); x.lineTo(24, 3.1); x.stroke(); });
    outl(x, P, .8); return S; },
  blob(){ const S = mk(16, 22), x = S.x;      // 모찌 그림이 오기 전(또는 없을 때) 잠깐 태우는 동글이
    const B = new Path2D(); B.ellipse(8, 16, 5.5, 5.5, 0, 0, 7); x.fillStyle = '#5BB4EE'; x.fill(B); outl(x, B);
    const Hd = new Path2D(); Hd.ellipse(8, 8, 6.5, 6.2, 0, 0, 7); x.fillStyle = '#FFE3C8'; x.fill(Hd); inside(x, Hd, ()=>blob(x, 8, 2, 8, 3.6, '#4A3A3A')); outl(x, Hd);
    blob(x, 5.8, 9, .7, .8, INK); blob(x, 10.2, 9, .7, .8, INK); blob(x, 4.6, 10.6, 1, .5, 'rgba(255,120,140,.5)'); blob(x, 11.4, 10.6, 1, .5, 'rgba(255,120,140,.5)'); return S; },
  cloud(){ const S = mk(34, 14), x = S.x; x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(9, 9, 5, 0, 7); x.arc(17, 6.5, 6.5, 0, 7); x.arc(25, 9, 5, 0, 7); x.fill(); x.fillRect(9, 9, 16, 5); return S; },
};
function bird(f){ const w = 12, S = mk(w + 6, 7 + 10), x = S.x; x.translate(3, 5);
  const T = new Path2D(); T.moveTo(10.6, 3.6); T.lineTo(13.4, 2.2); T.lineTo(13, 5.4); T.closePath(); x.fillStyle = '#E6EDF5'; x.fill(T); outl(x, T, .6);
  const B = new Path2D(); B.ellipse(6.6, 4.3, 4.9, 2.5, 0, 0, 7); x.fillStyle = lg(x, 0, 1.8, 0, 6.8, '#FFFFFF', '#D5DFEA'); x.fill(B); outl(x, B, .75);
  const Wg = new Path2D(); if(f){ Wg.moveTo(5.2, 4.2); Wg.quadraticCurveTo(7.4, 9.8, 10.4, 8.6); Wg.quadraticCurveTo(9.6, 6, 8.6, 4.4); } else { Wg.moveTo(5.2, 3.6); Wg.quadraticCurveTo(7.4, -3.2, 10.4, -2); Wg.quadraticCurveTo(9.6, 1.8, 8.6, 3.8); } Wg.closePath();
  x.fillStyle = '#C3D0E2'; x.fill(Wg); outl(x, Wg, .7);
  const Bk = new Path2D(); Bk.moveTo(.8, 3); Bk.lineTo(-1.9, 3.7); Bk.lineTo(.8, 4.5); Bk.closePath(); x.fillStyle = '#FFB347'; x.fill(Bk); outl(x, Bk, .5);
  const Hd = new Path2D(); Hd.arc(2.7, 3.2, 2.3, 0, 7); x.fillStyle = '#FFFFFF'; x.fill(Hd); outl(x, Hd, .75);
  blob(x, 2.1, 2.8, .5, .55, INK); blob(x, 3.2, 4.1, .7, .4, 'rgba(255,130,150,.5)');
  return S; }
function bakeItem(k){ const it = ITEMS[k], S = mk(14, 14), x = S.x;
  const g = x.createRadialGradient(5, 4.4, .4, 7, 7, 7); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, it.c + '66');
  x.fillStyle = g; x.beginPath(); x.arc(7, 7, 6.3, 0, 7); x.fill(); x.strokeStyle = it.c; x.lineWidth = 1.2; x.stroke();
  x.textAlign = 'center'; x.textBaseline = 'middle';
  if(k === 'x2'){ x.font = `900 6.4px ${FONT}`; x.fillStyle = it.c; x.fillText('×2', 7, 7.3); } else { x.font = `7.4px ${EMO}`; x.fillText(it.ic, 7, 7.5); }
  x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 1; x.beginPath(); x.arc(7, 7, 4.6, 3.5, 4.5); x.stroke();
  return S; }
const spr = k => SPR[k] || (SPR[k] = k.startsWith('it_') ? bakeItem(k.slice(3)) : BAKE[k]());
function bakeRider(){ RIDER = null; if(!meImg || !meImg.naturalWidth) return;
  const h = 24, w = h * meImg.naturalWidth / meImg.naturalHeight, S = mk(w, h); S.x.drawImage(meImg, 0, 0, w, h); RIDER = S; }
/* 내 캐릭터를 그대로 태운다 — 남의 캐릭터를 조종하는 게임은 두 번 하면 질린다. 같은 모습이면 다시 굽지 않는다 */
function loadMe(){
  let pr = { gender:'f' };
  try{ if(typeof ME !== 'undefined' && ME) pr = typeof withLook === 'function' ? withLook(ME.profile, ME.name) : ME.profile; }catch(e){}
  let u = ''; try{ if(typeof mochiSVG === 'function') u = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(mochiSVG(pr, { charm:2, uid:'j' })); }catch(e){}
  if(u === meUrl && (RIDER || !u)) return;
  meUrl = u; meImg = null; RIDER = null; if(!u) return;
  const i = new Image(); i.onload = ()=>{ if(meUrl !== u) return; meImg = i; bakeRider(); }; i.src = u;
}
/* 화면 크기·기기 배율에 맞춰 캔버스 해상도를 고른다(0.5 단위). 바뀌면 스프라이트를 다시 굽는다 */
function fit(){
  if(!cv) return; const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
  const k = Math.max(2, Math.min(4, Math.ceil((r.width || W * 2) / W * d * 2) / 2));
  if(k === K && cv.width === Math.round(W * k)) return;
  K = k; cv.width = Math.round(W * K); cv.height = Math.round(H * K); SPR = {}; GR = null; bakeRider();
}

/* ── 그리기 도우미 ── */
function rr(x, y, w, h, r){ const c = ctx; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function pill(x, y, w, h, a){ rr(x, y, w, h, h / 2); ctx.fillStyle = `rgba(8,24,46,${a || .45})`; ctx.fill(); }
function txt(t, x, y, sz, col, al, wt, stroke){ const c = ctx; c.font = `${wt || 800} ${sz}px ${FONT}`; c.textAlign = al || 'left'; c.textBaseline = 'middle';
  if(stroke){ c.lineJoin = 'round'; c.lineWidth = stroke; c.strokeStyle = 'rgba(8,24,46,.6)'; c.strokeText(t, x, y); } c.fillStyle = col; c.fillText(t, x, y); }
function bar(x, y, w, h, v, col){ rr(x, y, w, h, h / 2); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fill(); if(v > 0){ rr(x, y, Math.max(h, w * Math.min(1, v)), h, h / 2); ctx.fillStyle = col; ctx.fill(); } }
function star4(x, y, r, col){ const c = ctx; c.fillStyle = col; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); }
function heart(x, y, s, on){ const c = ctx; c.beginPath(); c.moveTo(x, y + s * .42); c.bezierCurveTo(x - s * .95, y - s * .1, x - s * .45, y - s * .78, x, y - s * .28); c.bezierCurveTo(x + s * .45, y - s * .78, x + s * .95, y - s * .1, x, y + s * .42); c.closePath();
  if(on){ c.fillStyle = '#FF5A78'; c.fill(); blob(c, x - s * .26, y - s * .2, s * .14, s * .09, 'rgba(255,255,255,.7)', -.6); } else { c.fillStyle = 'rgba(255,255,255,.2)'; c.fill(); } }
function wave(y0, amp, len, ph, close){ const c = ctx; c.beginPath();
  for(let x = -6; x <= W + 6; x += 5){ const y = y0 + Math.sin(x / len + ph) * amp + Math.sin(x / (len * .47) - ph * 1.7) * amp * .35; x === -6 ? c.moveTo(x, y) : c.lineTo(x, y); }
  if(close){ c.lineTo(W + 6, H + 6); c.lineTo(-6, H + 6); c.closePath(); } }
function gr(){ if(GR && GR.th === TH) return GR; const c = ctx;
  const g2 = c.createLinearGradient(0, GY - 2, 0, H); g2.addColorStop(0, TH.near); g2.addColorStop(1, TH.deep);
  const sk = c.createLinearGradient(0, 0, 0, 120); TH.sky.forEach((s, i)=>sk.addColorStop(i / 3, s));
  return GR = { th:TH, g2, sk }; }

/* ── 그리기 ── */
function draw(dt){
  const s = st, c = ctx;
  c.setTransform(K, 0, 0, K, 0, 0);
  vis.shake = Math.max(0, vis.shake - dt * 22); vis.flash = Math.max(0, vis.flash - dt * 1.8); vis.jt = Math.max(0, vis.jt - dt); vis.lt = Math.max(0, vis.lt - dt); vis.comboT = Math.max(0, vis.comboT - dt);
  c.save();
  if(vis.shake > 0 && !RM) c.translate((Math.random() - .5) * vis.shake, (Math.random() - .5) * vis.shake * .6);
  // 뒷배경 — 스테이지마다 강원 마을 풍경 한 장(scenery.js). 달린 거리만큼 아주 천천히 옆으로 흘러 시차를 준다. 굽기 전엔 그린 하늘
  const bg = bgOf(s), bgOk = !!(window.scenery && scenery.draw(c, bg[0], bg[1], { w:W, h:GY, hz:118, pan:Math.sin(s.dist / 2400), noFg:1, noVig:1 }));
  if(!bgOk){
    c.fillStyle = gr().sk; c.fillRect(-6, -6, W + 12, 130);
    if(TH.stars) STARS.forEach((q, i)=>{ c.globalAlpha = .45 + .45 * Math.sin(s.t * 1.6 + i * 1.7); star4(q.x, q.y, q.s * 1.4, '#FFFFFF'); }); c.globalAlpha = 1;
    const sg = c.createRadialGradient(146, 24, 2, 146, 24, 22); sg.addColorStop(0, TH.sun); sg.addColorStop(.35, TH.sun + 'AA'); sg.addColorStop(1, TH.sun + '00'); c.fillStyle = sg; c.fillRect(120, 0, 52, 50);
    blob(c, 146, 24, 7, 7, TH.sun);
    s.clouds.forEach(q=>{ const S = spr('cloud'); c.globalAlpha = .9; c.drawImage(S.c, q.x - 6, q.y - 8, S.w, S.h); }); c.globalAlpha = 1;
  }
  if(TH.aur){ c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    ['#5BFFB0','#3FE0C8','#9B7BFF'].forEach((col, i)=>{ c.globalAlpha = .18; c.strokeStyle = col; c.lineWidth = 7 + i * 3; c.beginPath(); for(let x = -10; x <= W + 10; x += 8){ const y = 24 + i * 12 + Math.sin(x / 23 + s.t * (0.5 + i * .25) + i) * 7; x === -10 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); });
    c.restore(); }
  if(hard) deco(s, bgOk);
  sea(s, bgOk);
  // 아이템 — 반짝이는 방울 속에 떠 있다
  s.pick.forEach(p=>{ if(!p.it) return; const S = spr('it_' + p.it), cx = p.x + 4.5, cy = GY - p.y - 4.5 + Math.sin(s.t * 5 + p.x / 10) * 1.3;
    const pu = 1 + Math.sin(s.t * 6 + p.x) * .05; c.drawImage(S.c, cx - 7 * pu, cy - 7 * pu, 14 * pu, 14 * pu); });
  // 조개 — 가끔 반짝
  s.pick.forEach(p=>{ if(p.it) return; const S = spr('shell'), cx = p.x + 3.5, cy = GY - p.y - 3.5 + Math.sin(s.t * 4 + p.x / 7) * .8;
    c.drawImage(S.c, cx - 5.5, cy - 5, S.w, S.h); const tw = Math.sin(s.t * 5 + p.x * .7); if(tw > .4) star4(cx + 3.6, cy - 3.6, (tw - .4) * 3.2, '#FFFFFF'); });
  // 장애물
  s.obs.forEach(o=>{ const by = GY - o.y - o.h;
    if(o.k === 'bird'){ const S = spr(((s.t * 9) | 0) % 2 ? 'bird1' : 'bird0'); c.drawImage(S.c, o.x - 3, by - 5 + Math.sin(s.t * 6 + o.x / 9), S.w, S.h); return; }
    if(o.k === 'jelly'){ const S = spr('jelly'), q = Math.sin(s.t * 7 + o.x) * .07; c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = .7; c.beginPath(); c.ellipse(o.x + o.w / 2, GY + .5, 6 + q * 20, 1.3, 0, 0, 7); c.stroke();
      c.save(); c.translate(o.x + o.w / 2, by + o.h); c.scale(1 - q, 1 + q); c.drawImage(S.c, -o.w / 2 - 3, -o.h - 3, S.w, S.h); c.restore(); return; }
    const S = spr(o.k); c.drawImage(S.c, o.x - 3, by - 3, S.w, S.h);
    // 물에 닿는 자리 — 하얀 거품 고리가 흔들린다
    const cx = o.x + o.w / 2, ph = s.t * 6 + o.x * .1; blob(c, cx, GY + .4, o.w / 2 + 2.5 + Math.sin(ph) * .6, 1.5, 'rgba(255,255,255,.9)');
    blob(c, o.x - 1.5, GY - 1.2 - Math.abs(Math.sin(ph)) * 1.5, .7, .7, 'rgba(255,255,255,.85)'); });
  drawMe(s, dt);
  foam(s);
  parts(dt);
  // 폭풍 구간 — 비와 어둑함
  if(s.zone === 4 && !s.dead){ c.fillStyle = 'rgba(11,30,63,.16)'; c.fillRect(-6, -6, W + 12, H + 12); c.strokeStyle = 'rgba(207,230,255,.45)'; c.lineWidth = .6; c.beginPath();
    for(let i = 0; i < 26; i++){ const rx = (i * 37 + s.t * 120) % (W + 20) - 10, ry = (i * 53 + s.t * 380) % H; c.moveTo(W - rx, ry); c.lineTo(W - rx - 1.6, ry + 6); } c.stroke(); }
  // 점수 팝 — 톡 튀어나와 떠오른다
  s.pops.forEach(p=>{ const life = p.life || .7, a = Math.min(1, (1 - p.t / life) * 2.2), sc = p.t < .12 ? .6 + p.t / .12 * .5 : p.t < .2 ? 1.1 - (p.t - .12) / .08 * .1 : 1;
    c.save(); c.globalAlpha = Math.max(0, a); c.translate(p.x + 2, p.y - p.t * 20); c.scale(sc, sc); txt(p.v, 0, 0, p.big ? 10 : 8, p.v[0] === '+' ? '#FFE27A' : '#FFFFFF', 'left', 900, 2.6); c.restore(); });
  banner(dt);
  if(mode === 'run' || mode === 'paused') hud(s);                     // 배너 띠 위에 — 가려지면 잘린 것처럼 보인다
  if(vis.flash > 0 && !RM){ c.fillStyle = `rgba(255,255,255,${vis.flash * .55})`; c.fillRect(-6, -6, W + 12, H + 12); }
  c.restore();
  $g('g-score').textContent = score();
}
/* 바다 — 먼 너울부터 발밑까지 겹겹이. 가까운 줄일수록 달린 거리에 빨리 반응해 속도감을 만든다 */
function sea(s, bgOk){
  const c = ctx, d = s.dist;
  [[118, .8, 12, d / 160 + s.t * .3, TH.far, bgOk ? .3 : 1], [133, 1.4, 16, d / 70, TH.mid, bgOk ? .55 : 1], [149, 2, 20, d / 38, TH.near, bgOk ? .82 : 1]].forEach(([y, a, l, ph, col, al])=>{
    c.globalAlpha = al; c.fillStyle = col; wave(y, a, l, ph, true); c.fill(); c.globalAlpha = al * .45; c.strokeStyle = '#FFFFFF'; c.lineWidth = .7; wave(y, a, l, ph, false); c.stroke(); });
  c.globalAlpha = 1; c.strokeStyle = '#FFFFFF'; c.lineWidth = .7; c.lineCap = 'round';
  GLINT.forEach((g, i)=>{ const k = .12 + (g.y - 118) / 160, x = ((g.x - d * k) % W + W) % W; c.globalAlpha = Math.max(0, .15 + .4 * Math.sin(s.t * 3 + i * 1.3)); c.beginPath(); c.moveTo(x, g.y); c.lineTo(x + g.l, g.y); c.stroke(); });
  c.globalAlpha = 1;
  c.fillStyle = gr().g2; wave(GY - .5, .7, 9, d / 9, true); c.fill();
  [[184, .9, TH.w[3], 1.4], [199, 1.1, TH.w[4], 1.8], [213, 1.3, TH.w[5], 2.2]].forEach(([y, k, col, lw], i)=>{
    const len = 14 + i * 5, gap = 22 + i * 6, off = (d * k) % (len + gap); c.strokeStyle = col; c.lineWidth = lw; c.globalAlpha = .75; c.beginPath();
    for(let x = -off - len; x < W + len; x += len + gap){ const yy = y + Math.sin((x + d * k) / 13) * 1.2; c.moveTo(x, yy); c.quadraticCurveTo(x + len / 2, yy - 1.6, x + len, yy); } c.stroke(); });
  c.globalAlpha = 1;
}
/* 수면선 거품 — 서퍼·장애물 위에 덮어 '물에 잠긴' 느낌을 준다 */
function foam(s){ const c = ctx, d = s.dist; c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 1.2; wave(GY - .2, .7, 9, d / 9, false); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.8)'; const off = d % 9; for(let x = -off; x < W + 9; x += 9){ const n = Math.round((x + d) / 9), r = .5 + (((n * 7) % 3) + 3) % 3 * .3; c.beginPath(); c.arc(x, GY + 1.8 + (n & 1), r, 0, 7); c.fill(); } }
/* 서퍼 — 보드와 모찌를 따로 그려 점프엔 기울기·늘어남, 착지엔 찌그러짐, 넘어지면 보드가 튕겨 나간다 */
function drawMe(s, dt){
  const c = ctx, B = spr('board'), Rd = RIDER || spr('blob'), ride = !s.air && !s.dead;
  const by = GY - s.y + (ride ? Math.sin(s.t * 9) * .7 : 0);
  if(s.dead){ const k = Math.min(1, s.deadT * 1.6);
    c.save(); c.translate(PX + k * 30, by - Math.sin(k * Math.PI) * 18 + k * 4); c.rotate(k * 5.5); c.drawImage(B.c, -B.w / 2, -6, B.w, B.h); c.restore();
    c.save(); c.globalAlpha = 1 - k * .55; c.translate(PX - k * 8, by - 12 - Math.sin(k * Math.PI) * 10 + k * k * 24); c.rotate(-k * 2.8); c.drawImage(Rd.c, -Rd.w / 2, -Rd.h / 2, Rd.w, Rd.h); c.restore(); return; }
  // 그림자 — 높이 뜰수록 작고 옅게
  const sk = Math.max(.35, 1 - s.y / 90); blob(c, PX, GY + 1.6, 13 * sk, 2 * sk, `rgba(10,30,60,${.28 * sk})`);
  if(ride){ c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(PX - 13, by - .4); c.quadraticCurveTo(PX - 30, by + 1.6, PX - 54, by + .3); c.stroke();
    c.globalAlpha = .45; c.lineWidth = .8; c.beginPath(); c.moveTo(PX - 12, by + .8); c.quadraticCurveTo(PX - 26, by + 3, PX - 44, by + 2.4); c.stroke(); c.globalAlpha = 1;
    // 꼬리 물보라 — 빠를수록 많이
    if(mode === 'run' || mode === 'idle'){ vis.spray += dt * (30 + s.speed * .35) * (RM ? .4 : 1);
      while(vis.spray >= 1){ vis.spray--; part(PX - 13 + Math.random() * 3, GY - 1, -(s.speed * .45 + Math.random() * 40), -(22 + Math.random() * 46), .3 + Math.random() * .3, .7 + Math.random() * .9, Math.random() < .7 ? '#FFFFFF' : '#CFEFFF', 330, 0); } } }
  c.save(); c.translate(PX, by);
  c.rotate(s.air ? Math.max(-.32, Math.min(.32, -s.vy / 1000)) : Math.sin(s.t * 4.5) * .035);
  const sq = vis.lt > 0 ? Math.sin(vis.lt / .15 * Math.PI) * .2 : 0, sr = vis.jt > 0 ? Math.sin(vis.jt / .16 * Math.PI) * .16 : 0;
  if(s.invuln > 0 && ((s.t * 20) | 0) % 2) c.globalAlpha = .45;                  // 무적 중엔 깜빡인다
  c.drawImage(B.c, -B.w / 2, -6, B.w, B.h);
  c.save(); c.translate(-1, -4); c.scale(1 + sq - sr * .6, 1 - sq + sr); c.rotate(ride ? .05 : -.1); c.drawImage(Rd.c, -Rd.w / 2, -Rd.h, Rd.w, Rd.h); c.restore();
  c.globalAlpha = 1;
  if(s.fx.star > 0){ c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `hsl(${(s.t * 360) % 360},100%,70%)`; c.lineWidth = 1.8; c.globalAlpha = .8; c.beginPath(); c.arc(0, -13, 16, 0, 7); c.stroke(); c.restore();
    if(Math.random() < .3) part(PX + (Math.random() - .5) * 26, by - 13 + (Math.random() - .5) * 26, 0, -10, .5, 1.6, '#FFE27A', 0, 1); }
  if(s.shield){ const r = 17 + Math.sin(s.t * 8) * .8; blob(c, 0, -12, r, r, 'rgba(190,235,255,.16)'); c.lineWidth = 2.2;
    for(let i = 0; i < 8; i++){ c.strokeStyle = i % 2 ? '#FFFFFF' : '#FF5A5A'; c.beginPath(); c.arc(0, -12, r, s.t + i * Math.PI / 4, s.t + (i + 1) * Math.PI / 4); c.stroke(); } }
  c.restore();
}
function parts(dt){ const c = ctx;
  for(const p of PP){ if(!p.on) continue; p.t += dt; if(p.t >= p.life){ p.on = false; continue; }
    p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; if(p.k === 0 && p.vy > 0 && p.y > GY + 2){ p.on = false; continue; }
    const k = 1 - p.t / p.life; c.globalAlpha = Math.min(1, k * 1.6);
    if(p.k === 2){ c.strokeStyle = p.c; c.lineWidth = 1.3 * k; c.beginPath(); c.arc(p.x, p.y, p.r + (1 - k) * 12, 0, 7); c.stroke(); }
    else if(p.k === 1) star4(p.x, p.y, p.r * (.5 + k * .9), p.c);
    else { c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, p.r * (.4 + k * .6), 0, 7); c.fill(); } }
  c.globalAlpha = 1; }
/* 화면 위 — 가운데 점수, 왼쪽 위 목숨·진행 막대·연속·켜진 아이템(남은 시간이 고리로 줄어든다) */
function hud(s){
  const c = ctx, sc = String(score());
  txt(sc, W / 2, 12, 13, '#FFFFFF', 'center', 900, 3);
  if(s.fx.x2 > 0){ c.font = `900 6.5px ${FONT}`; const w = c.measureText('×2 점수').width + 10; rr(W / 2 - w / 2, 21, w, 10, 5); c.fillStyle = '#FFB020'; c.fill(); txt('×2 점수', W / 2, 26.2, 6.5, '#3A2400', 'center', 900); }
  let y = 4;
  if(hard){ pill(4, y, 42, 13); for(let i = 0; i < LIVES; i++) heart(12.5 + i * 12, y + 7, 8, i < s.lives); }
  else { pill(4, y, 36, 13); txt('🐚 ' + s.shells, 9, y + 6.8, 7.5, '#FFFFFF', 'left', 800); }
  y += 16;
  let lab, pr, gold = false;
  if(hard){ const z = s.zone, a = ZONES[z - 1][0]; pr = z < ZONES.length ? (s.t - a) / (ZONES[z][0] - a) : 1; lab = `${z}/5 · ${ZONES[z - 1][1]}`; }
  else { pr = vis.best > 0 ? score() / vis.best : 0; gold = pr >= 1; lab = vis.best > 0 ? (gold ? '🎉 신기록 달리는 중' : `최고 ${vis.best}까지`) : '첫 기록 도전 중'; }
  c.font = `800 6.5px ${FONT}`; const pw = Math.max(64, c.measureText(lab).width + 12);
  pill(4, y, pw, 16); txt(lab, 9, y + 5.8, 6.5, '#FFFFFF', 'left', 800); bar(9, y + 10.6, pw - 10, 2.4, pr, gold ? '#FFD36B' : '#7FE3FF');
  y += 19;
  if(vis.combo >= 3){ const k = 1 + vis.comboT * .7; c.save(); c.translate(4, y); c.scale(k, k); pill(0, 0, 46, 13, .55); txt('🔥 연속 ' + vis.combo, 5, 6.8, 7, '#FFD36B', 'left', 900); c.restore(); y += 16; }
  let x = 10.5;
  const ring = (ic, v)=>{ blob(c, x, y + 6.5, 6.3, 6.3, 'rgba(8,24,46,.5)'); if(v < 1){ c.strokeStyle = '#FFD36B'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y + 6.5, 5.6, -Math.PI / 2, -Math.PI / 2 + v * Math.PI * 2); c.stroke(); }
    c.font = `6.4px ${EMO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ic, x, y + 6.9); x += 15; };
  [['star','⭐',5],['magnet','🧲',8],['slow','🐢',5]].forEach(([k, ic, mx])=>{ if(s.fx[k] > 0) ring(ic, s.fx[k] / mx); });
  if(s.shield) ring('🛟', 1);
}
/* 스테이지 배너 — 위아래 검은 띠가 내려오고 마을 이름이 가운데로 미끄러져 들어온다(영화 자막처럼) */
function banner(dt){
  const b = vis.ban; if(!b) return; b.t += dt; const T = 2.3; if(b.t > T){ vis.ban = null; return; }
  const c = ctx, e0 = b.t < .35 ? b.t / .35 : b.t > T - .4 ? 1 - (b.t - (T - .4)) / .4 : 1, e = 1 - (1 - e0) * (1 - e0), bh = 17 * e;
  c.fillStyle = 'rgba(5,12,24,.85)'; c.fillRect(-6, -6, W + 12, bh + 6); c.fillRect(-6, H - bh, W + 12, bh + 6);
  const y = 86, g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(5,12,24,0)'); g.addColorStop(.5, 'rgba(5,12,24,.55)'); g.addColorStop(1, 'rgba(5,12,24,0)');
  c.globalAlpha = e; c.fillStyle = g; c.fillRect(0, y - 18, W, 34);
  txt(b.top, W / 2 - (1 - e) * 16, y - 8, 7, '#FFD36B', 'center', 900);
  txt(b.name, W / 2 + (1 - e) * 22, y + 4.5, 16, '#FFFFFF', 'center', 900, 3);
  const lw = 64 * e; c.fillStyle = '#FFD36B'; c.fillRect(W / 2 - lw / 2, y + 14, lw, 1);
  c.globalAlpha = 1;
}

/* 멀리 보이는 풍경 — 스테이지마다 다르다(천천히 지나간다) */
/* 스테이지·시간대 → 풍경. 쉬움은 날짜마다 마을이 바뀐다(매일 같은 바다면 질린다) */
const BG_HARD = { light:['낙산','morning'], island:['죽도','noon'], mount:['하조대','sunset'], storm:['망상','storm'], aurora:['장호항','stormnight'] };
const BG_EASY = { day:[['죽도','day'],['아야진','morning'],['천진','day'],['속초','afternoon']], sunset:[['경포','sunset'],['하조대','golden']], night:[['주문진','night'],['정동진','dusk']], noon:[['죽도','noon']], aurora:[['장호항','stormnight']] };
function bgOf(s){
  if(hard) return BG_HARD[ZONES[Math.max(0, s.zone - 1)][3]];
  const k = Object.keys(THEMES).find(n=>THEMES[n] === TH) || 'day', a = BG_EASY[k] || BG_EASY.day;
  return a[new Date().getDate() % a.length];
}
function warmBg(){ if(!window.scenery) return; const o = { noFg:1, noVig:1 }; Object.values(BG_HARD).forEach(b=>scenery.bake(b[0], b[1], o)); Object.values(BG_EASY).forEach(a=>{ const b = a[new Date().getDate() % a.length]; scenery.bake(b[0], b[1], o); }); }
function deco(s, bgOk){   // 마을 풍경이 깔렸으면 실루엣은 겹치므로 생략. 폭풍의 번개는 늘
  const k = ZONES[s.zone - 1][3];
  if(k === 'storm' && !RM && ((s.t * 0.7) % 3) < 0.07) vis.flash = Math.max(vis.flash, .45);
  if(bgOk) return;
  const c = ctx, x0 = W - ((s.t * 5) % (W + 90)) + 20;
  c.fillStyle = k === 'mount' ? '#5F4C9A' : k === 'island' ? '#2E8B57' : 'rgba(40,60,90,.45)';
  c.beginPath(); c.moveTo(x0 - 50, 120); c.quadraticCurveTo(x0 - 10, k === 'mount' ? 86 : 100, x0 + 30, 120); c.closePath(); c.fill();
}

function loop(t){
  raf = requestAnimationFrame(loop);
  if(!last) last = t;
  let dt = (t - last) / 1000; last = t; dt = Math.min(dt, 0.033);        // 탭을 다녀오면 dt 가 커진다 — 한 번에 뛰어넘지 않게
  if(mode === 'run'){
    if(vis.stop > 0) vis.stop -= dt;                                       // 부딪힌 순간 잠깐 멈칫(히트스톱)
    else { acc += dt; let n = 0; while(acc >= FIX && n++ < 6){ step(FIX); acc -= FIX; if(mode !== 'run') break; } } }
  else if(mode === 'idle'){ st.t += dt; st.dist += 90 * dt; st.clouds.forEach(c=>{ c.x -= c.s * dt; if(c.x < -30) c.x = W + 10; }); }
  draw(mode === 'paused' ? 0 : dt);
  const pb = $g('g-pause'); if(pb && pb.hidden !== (mode !== 'run')) pb.hidden = mode !== 'run';
}

/* ── 화면 ── */
function dailyRows(){
  const day = today();
  return (state.town||[]).filter(x=>x.id !== ME.id).map(x=>{ const d = (typeof peerPlay === 'function' ? peerPlay(x.profile?.play)?.dbest : null); return d && d.day === day ? { id:x.id, name:x.name, best:d.score } : null; }).filter(Boolean)
    .concat((ME.profile.play?.dbest?.day === day) ? [{ id:ME.id, name:ME.name, best:ME.profile.play.dbest.score }] : []).sort((a,b)=>b.best - a.best).slice(0, 3);
}
function myBestRows(){
  const k = hard ? 'hbest' : 'best';
  const rows = (state.town||[]).filter(x=>x.id !== ME.id).map(x=>({ id:x.id, name:x.name, best:(typeof peerPlay === 'function' ? peerPlay(x.profile?.play)?.[k] : 0) || 0 }))
    .concat([{ id:ME.id, name:ME.name, best:ME.profile?.play?.[k] || 0 }]).filter(r=>r.best > 0).sort((a,b)=>b.best - a.best);
  return rows.slice(0, 3);
}
function pause(){
  if(mode !== 'run' || st.dead) return;
  mode = 'paused'; held = false; $g('g-ov').hidden = false;
  $g('g-ov').innerHTML = `<div class="go-card"><div class="go-t">⏸ 잠깐 멈췄어요</div><div class="go-s">${score()}<small>점</small></div><div class="go-d">준비되면 이어서 달려요</div>
    <div class="jp-row"><button class="btn blue" id="g-resume" type="button" style="flex:1">▶ 이어서</button><button class="btn ghost" id="g-quit" type="button">그만하기</button></div></div>`;
  $g('g-resume').onclick = ()=>{ mode = 'run'; last = 0; $g('g-ov').hidden = true; };
  $g('g-quit').onclick = ()=>{ $g('g-ov').hidden = true; mode = 'run'; last = 0; st.lives = 0; wipeout(); };     // 그만둬도 여기까지의 점수는 남긴다
}
function showStart(){
  if(hardPref != null){ hard = hardPref; hardPref = null; }
  mode = 'idle'; window._gameRun = false; reset(); loadMe();
  const p = ME.profile.play || {}, top = myBestRows(), dsc = (p.dbest && p.dbest.day === today()) ? p.dbest.score : null;
  $g('g-ov').hidden = false;
  $g('g-ov').innerHTML = `<div class="go-card">
      <div class="jp-logo">${meUrl ? `<img src="${meUrl}" alt="">` : ''}<div><div class="go-t">파도 점프</div><small>탭하면 점프 · 길게 누르면 더 높이</small></div></div>
      <div class="go-mode" role="group" aria-label="난이도"><button type="button" data-jm="easy" aria-pressed="${!hard}">🙂 쉬움</button><button type="button" data-jm="hard" aria-pressed="${hard}">🔥 어려움</button></div>
      <div class="go-d">${hard ? '목숨 ❤️×3 · 스테이지 5개 · 아이템 7가지<br>🐦 갈매기는 <b>뛰지 말고</b> · 🪵 통나무는 <b>높이</b>' : '바위·상어·해파리를 넘고 🐚 조개를 모아요<br>조개 5개마다 🛟 구명튜브 하나'}</div>
      <div class="jp-best"><span class="${hard ? '' : 'on'}"><small>🙂 쉬움 최고</small><b>${p.best || 0}</b></span><span class="${hard ? 'on' : ''}"><small>🔥 어려움 최고</small><b>${p.hbest || 0}</b></span></div>
      <div class="go-b">${hard ? '어려움' : '쉬움'} 내 최고 <b>${(hard ? p.hbest : p.best) || 0}</b>점${top.length ? ` · 🏆 1위 ${esc(top[0].name)} ${top[0].best}` : ''}</div>
      <button class="btn blue jp-wide" id="g-free" type="button">▶ ${hard ? '어려움' : '쉬움'} 시작</button>
      <button class="jp-daily" id="g-go" type="button"><i>📅</i><span><b>오늘의 챌린지</b><small>쉬움 · 모두 같은 코스로 겨뤄요</small></span><em><small>내 기록</small><b>${dsc != null ? dsc : '—'}</b></em></button></div>`;
  $g('g-go').onclick = ()=>begin(true); $g('g-free').onclick = ()=>begin(false);
  $g('g-ov').querySelectorAll('[data-jm]').forEach(b=>b.onclick = ()=>{ hard = b.dataset.jm === 'hard'; try{ localStorage.setItem('lineup.share.jmode', hard ? 'hard' : 'easy'); }catch(e){} showStart(); });
}
let hardPref = null;
function begin(isDaily){
  daily = isDaily === true;
  if(daily){ hardPref = hard; hard = false; } else if(hardPref != null){ hard = hardPref; hardPref = null; }   // 챌린지는 쉬움으로, 끝나면 고른 모드로
  loadMe(); reset(); TH = hard ? THEMES[ZONES[0][2]] : themeNow(); mode = 'run'; window._gameRun = true; $g('g-ov').hidden = true; last = 0; held = false; acc = 0;
  const p = (typeof ME !== 'undefined' && ME && ME.profile && ME.profile.play) || {};
  vis.best = (daily ? (p.dbest && p.dbest.day === today() ? p.dbest.score : 0) : hard ? p.hbest : p.best) || 0;
  vis.ban = { t:0, top:hard ? 'STAGE 1' : daily ? '📅 오늘의 챌린지' : '오늘의 바다', name:hard ? ZONES[0][1] : bgOf(st)[0] + ' 해변' };
}
function showOver(sc, r){
  const p = ME.profile.play || {}, nb = r.newBest && sc > 0;
  const best = daily ? ((p.dbest && p.dbest.day === today()) ? p.dbest.score : sc) : ((hard ? p.hbest : p.best) || sc);
  const v = (typeof VOICES !== 'undefined' && VOICES.length) ? VOICES[Math.floor(Math.random() * VOICES.length)] : null;
  const cells = [['최고', best], hard ? ['스테이지', st.zone + '/5'] : ['거리', Math.round(st.dist / 10) + 'm'], ['조개', st.shells], ['최대 연속', vis.maxCombo]];
  $g('g-ov').hidden = false;
  $g('g-ov').innerHTML = `<div class="go-card${nb ? ' jp-nb' : ''}">
      <div class="jp-rib">${hard ? `🔥 어려움 · ${esc(ZONES[st.zone - 1][1])}까지` : daily ? '📅 오늘의 챌린지 · 쉬움' : '🙂 쉬움'}</div>
      <div class="go-t">${nb ? '🎉 최고 기록!' : '🌊 와이프아웃'}</div>
      <div class="go-s">${sc}<small>점</small></div>
      <div class="go-st">${cells.map(([k, n])=>`<span>${k}<b>${n}</b></span>`).join('')}</div>
      ${hard ? `<div class="go-b">사용한 목숨 <b>${st.lost}/${LIVES}</b> · 아이템 <b>${st.items}</b>개</div>` : ''}
      ${window.JUMP_STANDALONE ? `<div class="go-b">🐚 조개 ${st.shells}개${r.rank ? ` · 🏆 ${r.rank}` : ''}</div>` : `<div class="go-b">🐚 +${st.shells} (보유 ${r.bal ?? '–'})${r.gain ? ` · <b>+${r.gain} XP</b>` : ' · 오늘 XP는 다 채웠어요'}</div>`}
      ${daily ? (()=>{ const rk = dailyRows(); return rk.length ? `<div class="go-r"><span class="jp-rh">오늘의 챌린지 순위</span>${rk.map((q,i)=>`<span>${['🥇','🥈','🥉'][i]} ${esc(q.name)} ${q.best}</span>`).join('')}</div>` : ''; })() : ''}
      ${v && !hard ? `<div class="go-v">“${esc(v[0])}”<small>— ${esc(v[1])}</small></div>` : ''}
      <div class="jp-row"><button class="btn blue" id="g-again" type="button" style="flex:1">↻ 다시 하기</button>
        <button class="btn ghost" id="g-exit" type="button">닫기</button></div>
      ${sc >= 100 && typeof sendChat === 'function' ? `<button class="btn ghost jp-wide" id="g-brag" type="button">📣 마을에 자랑하기</button>` : ''}
      ${window.JUMP_STANDALONE ? `<button class="btn ghost jp-wide" id="g-share" type="button">📤 친구에게 공유</button>` : ''}</div>`;
  if(nb) burst(W / 2, 40, 40, ['#FFD36B','#FF8AB8','#7FE3FF','#FFFFFF','#9BF0B4'], 130, 70, 2.2, 1);      // 신기록 — 꽃가루
  $g('g-again').onclick = ()=>begin(daily); $g('g-exit').onclick = gameClose;
  if($g('g-brag')) $g('g-brag').onclick = async ()=>{ const b = $g('g-brag'); b.disabled = true;
    await sendChat(`🎮 파도 점프${hard ? '(어려움)' : ''} ${sc}점!${r.newBest ? ' (내 최고 기록 🎉)' : ''}`, true); b.textContent = '✅ 올렸어요'; };
  if($g('g-share')) $g('g-share').onclick = async ()=>{ const b = $g('g-share'), t = `🏄 파도 점프 ${sc}점! 나도 해 보기 →`, u = location.origin + location.pathname;
    try{ if(navigator.share){ await navigator.share({ title:'파도 점프', text:t, url:u }); return; } await navigator.clipboard.writeText(t + ' ' + u); b.textContent = '✅ 링크를 복사했어요'; }catch(e){} };
}

function gameOpen(){
  cv = $g('g-cv'); ctx = cv.getContext('2d');
  $g('game').hidden = false; document.body.classList.add('game-on');
  fit(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if(!$g('g-pause')){ const b = document.createElement('button'); b.id = 'g-pause'; b.type = 'button'; b.className = 'jp-pause'; b.hidden = true; b.textContent = '⏸'; b.setAttribute('aria-label', '잠깐 멈춤'); b.onclick = pause; cv.parentNode.appendChild(b); }
  try{ snd = localStorage.getItem('lineup.share.snd') === '1'; }catch(e){}            // 놀이 메뉴 설정에서 바꿨을 수 있다
  TH = themeNow(); warmBg(); sndBtn(); showStart(); last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
}
function gameClose(){
  if(window.JUMP_STANDALONE){ showStart(); return; }                              // /jump 단독 페이지 — 닫기 대신 시작 화면으로
  cancelAnimationFrame(raf); raf = 0; mode = 'idle'; window._gameRun = false;
  $g('game').hidden = true; document.body.classList.remove('game-on');
  if(typeof playTick === 'function') playTick();
  if(typeof renderPlay === 'function' && !$g('play-sheet').hidden) renderPlay();
}

/* 입력 — 캔버스 어디를 눌러도 점프. 글자 선택·스크롤·확대가 끼어들지 않게 막는다 */
function wire(){
  if(wire.done) return; wire.done = true;
  /* 화면 아래 빈 곳을 눌러도 뛴다 — 엄지는 캔버스 위가 아니라 폰 아래쪽에 있다. 버튼·카드는 제외 */
  $g('game').addEventListener('pointerdown', e=>{ if(e.target.closest('button, .go-card')) return; e.preventDefault(); jump(); });
  addEventListener('pointerup', release); addEventListener('pointercancel', release);
  addEventListener('resize', ()=>{ if(cv && !$g('game').hidden){ fit(); ctx.imageSmoothingEnabled = true; } });
  addEventListener('keydown', e=>{
    if($g('game').hidden) return;
    if(e.target && e.target.closest && e.target.closest('input, textarea')) return;      // 이름 칸에 띄어쓰기를 치면 게임이 시작되지 않게
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
window._game = { get hard(){ return hard; }, set hard(v){ hard = !!v; }, clone:()=>structuredClone(st), swap:s=>{ const o = st; st = s; return o; }, FIX, get mod(){ return mod; }, set mod(i){ mod = MODS[i]; }, MODS, get TH(){ return TH; }, setTheme:k=>{ TH = THEMES[k]; }, pause, get st(){ return st; }, get mode(){ return mode; }, step, jump, release, score, begin, reset: ()=>reset() };
})();
