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
const G = 760, JV = 262, CUT = 120, CUT_H = 160; // 중력, 점프 속도, 일찍 떼면 깎는 속도(px/s) — 어려움은 톡 쳐도 조금 더 높이
let cv, ctx, st = null, raf = 0, last = 0, mode = 'idle', held = false;
/* 오늘의 챌린지 — 날짜로 씨앗을 줘서 모두가 같은 장애물 순서를 만난다. 같은 코스라야 점수를 견줄 수 있다.
   물리를 고정 단위(1/60초)로 돌리는 것도 같은 이유다: 기기 프레임이 달라도 같은 입력이면 같은 결과가 나온다. */
let daily = false, rnd = Math.random, acc = 0;
const FIX = 1 / 60;
/* 구간(마을) — 어려움은 500m(등대)마다 다음 마을로 넘어가 다섯 곳을 돈다. 쉬움은 시간대 풍경 하나 */
const ZONES = [[0,'아침 낙산','day','light'],[14,'한낮 죽도','noon','island'],[32,'노을 하조대','sunset','mount'],[55,'폭풍 망상','night','storm'],[85,'전설의 장호항','aurora','aurora']];
const LIVES = 3;
/* 아이템 — 조개(점수) 말고도 판을 바꾸는 것들. 뽑기는 rnd() 로만(오늘의 챌린지 코스가 같게) */
const ITEMS = { heart:{ ic:'❤️', n:'목숨 +1', c:'#FF6B8A' }, tube:{ ic:'🛟', n:'구명튜브', c:'#FF8A5B' }, star:{ ic:'⭐', n:'무적 5초', c:'#FFC23D' }, magnet:{ ic:'🧲', n:'조개 자석', c:'#7A8CFF' },
  slow:{ ic:'🐢', n:'느리게', c:'#3FC489' }, gem:{ ic:'💎', n:'+50', c:'#3FB8FF' }, x2:{ ic:'✖️2', n:'점수 2배', c:'#FFA41F' } };
const MODS = [
  { n:'균형 잡힌 바다', ic:'🌊', w:{} }, { n:'갈매기의 날', ic:'🐦', w:{ bird:2.4 } }, { n:'통나무의 날', ic:'🪵', w:{ log:2.6, double:1.6 } },
  { n:'해파리 떼의 날', ic:'🪼', w:{ jelly:2.6 } }, { n:'상어의 날', ic:'🦈', w:{ fin:2.3 } }, { n:'연속의 날', ic:'⛓️', w:{ double:2.4, stair:2.4 } } ];
let mod = MODS[0];
/* 🏄 보드 — 기록으로 여는 색 보드. 작은 특기가 하나씩(자유 판에서만 — 오늘의 챌린지·공정성 검사는 기본 보드). 고른 보드는 이 기기에 기억 */
const BOARDS = [
  { k:'basic', n:'기본 보드', c:['#FF7A59','#FFC04D'], perk:'특기 없음 — 처음 보드',             lock:null },
  { k:'long',  n:'롱보드',    c:['#3FA9F5','#B8E6FF'], perk:'피버가 연속 9번에 와요(원래 10번)',  lock:['best', 300, '쉬움 300점'] },
  { k:'fish',  n:'피시 보드', c:['#3FC489','#E6FFB0'], perk:'😮 아슬아슬 판정이 조금 넓어요',     lock:['hbest', 5000, '어려움 5000점'] },
  { k:'gun',   n:'건 보드',   c:['#9B7BFF','#FFB8DA'], perk:'✨ 황금 조개 +20점',                 lock:['ach', 6, '업적 6개'] } ];
let boardK = 'basic'; try{ boardK = localStorage.getItem('lineup.share.jboard') || 'basic'; }catch(e){}
/* 🏅 업적 — 한 번만 받는 작은 조개 보상(합계 145개, 상점 옷 두세 벌 값). 받은 기록은 프로필(play.ach)과 이 기기 둘 다에 — 어느 한쪽에라도 있으면 다시 안 준다 */
const ACH = [
  ['first', '🌊', '첫 파도',       '파도 점프 한 판 끝내기',            3, s=>true],
  ['daily', '📅', '오늘의 도전자', '오늘의 챌린지 한 판',               3, (s, o)=>o.daily],
  ['s300',  '⭐', '300점',         '한 판 300점',                       5, (s, o)=>o.sc >= 300],
  ['s1000', '🌟', '1000점',        '한 판 1000점',                     10, (s, o)=>o.sc >= 1000],
  ['fev',   '🔥', '피버!',         '피버 한 번 켜기',                   5, s=>s.fevN >= 1],
  ['c20',   '⛓️', '연속 20',       '부딪히지 않고 연속 20번',           8, s=>s.cmax >= 20],
  ['gold3', '✨', '황금 손',       '한 판에 황금 조개 3개',             8, s=>s.gold >= 3],
  ['mis5',  '🎯', '미션 다섯',     '한 판에 미션 5개',                 10, s=>s.md >= 5],
  ['m500',  '🏮', '첫 등대',       '어려움 500m',                       8, (s, o)=>o.hard && s.sd >= 5000],
  ['boss',  '🐙', '문어 격파',     '어려움 보스 한 마리',              15, (s, o)=>o.hard && s.bossN >= 1],
  ['storm', '💨', '폭풍 돌파',     '어려움 폭풍 구간 지나기(2000m)',   15, (s, o)=>o.hard && s.sd >= 20000],
  ['night', '🌙', '밤바다',        '어려움 밤바다 끝까지(2500m)',      20, (s, o)=>o.hard && s.sd >= 25000],
  ['crab',  '🦀', '꽃게 왕 격파',  '어려움 두 번째 보스(거대 꽃게)',   20, (s, o)=>o.hard && s.bossN >= 2],
  ['all',   '👑', '파도의 주인',   '한 판 3000점',                     15, (s, o)=>o.sc >= 3000] ];
function achGot(){ let L = {}; try{ L = JSON.parse(localStorage.getItem('lineup.share.jach') || '{}') || {}; }catch(e){}
  try{ const a = ME.profile.play && ME.profile.play.ach; if(a && typeof a === 'object') for(const k in a) if(a[k]) L[k] = 1; }catch(e){} return L; }
const achN = () => { const g = achGot(); return ACH.filter(a=>g[a[0]]).length; };
const boardOpen = b => { if(!b.lock) return true; try{ const p = ME.profile.play || {}; return b.lock[0] === 'ach' ? achN() >= b.lock[1] : (+p[b.lock[0]] || 0) >= b.lock[1]; }catch(e){ return false; } };
const boardOf = () => { const b = BOARDS.find(x=>x.k === boardK) || BOARDS[0]; return boardOpen(b) ? b : BOARDS[0]; };
/* 이번 판의 새 업적 — 판이 끝날 때 한 번만(finish 는 mode 로 한 번만 돈다) */
function achCheck(o){
  if(window._gameSim || !st || typeof playP !== 'function') return [];               // 단독 /jump 페이지(지갑 없음)에선 기록하지 않는다 — 나중에 앱에서 받게
  const g = achGot(), out = [];
  for(const a of ACH){ if(g[a[0]]) continue; let ok = false; try{ ok = !!a[5](st, o); }catch(e){} if(ok) out.push(a); }
  if(!out.length) return out;
  const L = {}; for(const k in g) L[k] = 1; out.forEach(a=>L[a[0]] = 1); try{ localStorage.setItem('lineup.share.jach', JSON.stringify(L)); }catch(e){}
  try{ if(typeof playP === 'function'){ const p = playP(); const A = (p.ach && typeof p.ach === 'object') ? p.ach : (p.ach = {}); let sh = 0; out.forEach(a=>{ if(!A[a[0]]){ A[a[0]] = 1; sh += a[4]; } });
    if(sh){ p.shells = (p.shells || 0) + sh; if(typeof playPush === 'function') playPush(); } } }catch(e){}
  return out;
}
/* 쉬움 = 처음 버전(목숨 1·아이템·스테이지 없음·느린 속도), 어려움 = 마리오식 끝없는 바다. 점수는 따로 쌓는다(best / hbest).
   오늘의 챌린지는 모두가 하도록 쉬움으로 고정. 고른 모드는 이 기기에 기억한다. */
let UP = {};                     // 🔧 강화(play.js upFor) — 챌린지·시뮬에선 비운다(공정)
const SV = () => 10 + 2 * (UP.val || 0);   // 조개 하나 점수
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
const vis = { stop:0, shake:0, flash:0, jt:0, lt:0, ban:null, combo:0, maxCombo:0, comboT:0, best:0, spray:0, sq:[], rise:[], grow:0, mus:0, mi:0, hint:0, sc:-1,
  riv:[], fl:{ on:false, x:0, me:false, nm:'' }, misT:0, nb:false };   // hint: 0 아직 안 뜀 → 1 첫 점프 중 → 2 끝 · riv: 넘을 기록(친구·내 최고) · fl: 지나가는 깃발
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
  if(k === 'jump'){ vis.jt = 0.16; burst(PX - 8, GY, 7, SPLASH, 50, 40, 1.3); if(!vis.hint) vis.hint = hard ? 1 : 2; }
  else if(k === 'land'){ vis.lt = 0.15; burst(PX - 2, py, 9, SPLASH, 55, 34, 1.4); if(vis.hint === 1) vis.hint = 2; }
  else if(k === 'shell'){ const x = a.x + 3.5, y = GY - a.y - 3.5; burst(x, y, 8, ['#FFE27A','#FFFFFF','#FFC46B'], 60, 10, 1.7, 1); part(x, y, 0, 0, 0.35, 3, '#FFE9A8', 0, 2); }
  else if(k === 'item'){ burst(PX, py - 14, 14, ['#FFE27A','#9BE7FF','#FF9BD2','#FFFFFF'], 80, 20, 1.9, 1); part(PX, py - 14, 0, 0, 0.45, 5, '#FFFFFF', 0, 2); vis.flash = Math.max(vis.flash, 0.22); }
  else if(k === 'smash'){ burst(a.x + a.w / 2, GY - a.y - a.h / 2, 14, ['#FFE27A','#B9A9D6','#FFFFFF'], 95, 40, 1.8); vis.shake = 2.5; vis.stop = 0.05; }
  else if(k === 'shield'){ part(PX, py - 12, 0, 0, 0.5, 7, '#FF8A8A', 0, 2); burst(PX, py - 12, 12, ['#FF6B6B','#FFFFFF'], 80, 20, 1.6); vis.stop = 0.08; vis.shake = 3; }
  else if(k === 'hit'){ burst(PX, GY - 4, 16, SPLASH, 90, 60, 1.8); vis.stop = 0.13; vis.shake = 5; vis.flash = 0.35; vis.combo = 0;
    burst(10 + s.lives * 12, 10, 8, ['#FF5A78','#FFB3C1'], 40, 10, 1.2); }
  else if(k === 'crash'){ burst(PX, GY - 4, 26, SPLASH, 110, 80, 2); vis.stop = 0.16; vis.shake = 7; vis.flash = 0.6; vis.combo = 0; }
  else if(k === 'mile'){ vis.ban = { t:0, top:'🏮 ' + a.m + 'm 통과 · 🐚+' + MILE_SH + (a.heal ? ' · ❤️+1' : ''), name:ZONES[st.zone - 1][1], sm:1 }; tune([523, 659, 784, 1047], 95); vis.flash = 0.18; }   // 등대 — 멈추지 않고 지나간다
  /* 어려움(마리오식) 연출 */
  else if(k === 'dj'){ vis.jt = 0.16; vis.hint = 2; burst(PX - 4, py + 1, 12, ['#FFFFFF','#BFE6FF','#9BE7FF'], 75, -10, 1.5); part(PX, py, 0, 0, 0.3, 4, '#FFFFFF', 0, 2); }
  else if(k === 'stomp'){ vis.sq.push({ k:a.k, x:a.x, w:a.w, h:a.h, y:GY - a.y, t:0 }); burst(a.x + a.w / 2, GY - a.y - a.h, 10, ['#FFFFFF','#FFE27A'], 70, 30, 1.5, 1); vis.stop = 0.05; vis.shake = Math.max(vis.shake, 1.5); }
  else if(k === 'bump'){ burst(a.x + a.w / 2, GY - a.y, 6, ['#FFE27A','#FFFFFF'], 40, -20, 1.1); }
  else if(k === 'pop'){ vis.rise.push({ ic:a.ic, x:a.b.x + 6, y:GY - a.b.y - a.b.h, t:0 }); burst(a.b.x + 6, GY - a.b.y - a.b.h, 10, ['#FFE27A','#FFFFFF','#FFC46B'], 60, 20, 1.6, 1); if(a.k === 'board') vis.grow = 0.6; }
  else if(k === 'shrink'){ vis.grow = 0.6; vis.stop = 0.1; vis.shake = 3; burst(PX, py - 10, 10, ['#FFB3C1','#FFFFFF'], 60, 20, 1.4); }
  else if(k === 'splash'){ burst(a.x + 6, GY, 6, SPLASH, 40, 40, 1.1); }
  else if(k === '1up'){ tune([659, 784, 1319, 1047, 1175, 1568], 85); }
  else if(k === 'boss'){ const n = a.lv + 1; vis.ban = { t:0, top:'BOSS' + (n > 1 ? ' ×' + n : '') + (a.kind === 'crab' ? ' · 등껍질을 밟아요!' : ' · 머리를 밟아요!'), name:a.kind === 'crab' ? '🦀 거대 꽃게' : '🐙 거대 문어' }; vis.shake = 4; tune(a.kind === 'crab' ? [220, 196, 220, 165] : [196, 185, 175, 165], 170); }
  else if(k === 'gust'){ s.pops.push({ x:W / 2 - 34, y:GY - 96, t:0, life:1, v:'💨 맞바람!', big:1 }); beep(180, 120, .3, 'sawtooth', .025); }
  else if(k === 'bossHit'){ burst(a.x + 15, GY - a.y - 22, 18, ['#FFFFFF','#FF9BD2','#FFE27A'], 100, 30, 2, 1); vis.stop = 0.12; vis.shake = 5; vis.flash = 0.3; }
  else if(k === 'bossDown'){ vis.ban = { t:0, top:'👑 보스 ' + a + '마리째 격파!', name:a % 2 ? '다음엔 🦀 거대 꽃게' : '다음엔 🐙 거대 문어', sm:1 }; tune([523, 659, 784, 1047, 1319, 1568, 2093], 110); vis.flash = 0.4; }
  else if(k === 'pass'){ vis.combo = s.combo; vis.maxCombo = Math.max(vis.maxCombo, vis.combo); vis.comboT = 0.3;
    const cm = comboM(s.combo);
    if(s.combo >= 5 && s.combo % 5 === 0){ s.pops.push({ x:PX - 22, y:GY - 72, t:0, life:1, v:CALL[Math.min(CALL.length - 1, cm - 1)] + ' ×' + cm, big:1 });   // 나이스! ×2 → 굉장해! ×3 → 파도의 신! ×4
      tune(cm >= 4 ? [784, 988, 1175, 1568] : cm >= 3 ? [659, 784, 988, 1319] : [523, 659, 784], 70); vis.flash = Math.max(vis.flash, .12); burst(PX, GY - 50, 10, ['#FFD36B','#FF9BD2','#FFFFFF'], 70, 20, 1.6, 1); }
    else beep(520 + Math.min(12, s.combo) * 40, 0, .05, 'triangle', .025); }        // 연속이 길수록 '띵' 소리가 한 칸씩 올라간다
  else if(k === 'near'){ part(PX, py - 10, 0, 0, .4, 6, '#9BE7FF', 0, 2); burst(a.x + a.w / 2, GY - a.y - a.h, 6, ['#9BE7FF','#FFFFFF'], 50, 20, 1.2, 1); beep(1200, 1600, .07, 'triangle', .04); }
  else if(k === 'gold'){ const x = a.x + 3.5, y = GY - a.y - 3.5; burst(x, y, 16, ['#FFD36B','#FFF3B0','#FFFFFF','#FFB020'], 90, 20, 2, 1); part(x, y, 0, 0, .5, 5, '#FFE27A', 0, 2); vis.flash = Math.max(vis.flash, .15); tune([1047, 1319, 1568], 60); }
  else if(k === 'fever'){ vis.ban = { t:0, top:'🔥 연속 ' + s.combo + '번!', name:'피버! 무적 · 점수 2배', sm:1 }; vis.flash = .35; vis.shake = 3; tune([523, 659, 784, 1047, 1319, 1568], 70);
    burst(PX, py - 14, 24, ['#FFD36B','#FF6B4A','#FF9BD2','#FFFFFF'], 120, 30, 2.2, 1); }
  else if(k === 'mission'){ vis.flash = Math.max(vis.flash, .2); tune([784, 1047, 1319], 80); burst(W / 2, 64, 14, ['#9BF0B4','#FFFFFF','#FFD36B'], 80, 10, 1.8, 1); }
}
/* 연속 배수 — 넘을 때마다 3점 × 배수. 5번째부터 ×2, 10번째 ×3, 20번째 ×4. 부딪히면 처음부터 */
const CALL = ['좋아요!', '나이스!', '굉장해!', '파도의 신!'];
const comboM = n => n >= 20 ? 4 : n >= 10 ? 3 : n >= 5 ? 2 : 1;
const FEV1 = 10, FEVG = 20, FEVT = 4;                // 처음 10번 연속 → 피버 4초(무적·점수 2배), 그다음은 20번마다
/* 판 안의 작은 목표 — 하나 끝나면 다음이 나온다. 보상은 점수 +100 · 조개 2개(상점 물가를 흔들지 않게 작게). 모두 같은 순서 → 오늘의 챌린지도 공정 */
const MIS_E = [['🐚 조개 5개 모으기','sh',5], ['🔥 연속 10번 넘기','combo',10], ['✨ 황금 조개 줍기','gold',1], ['🐚 조개 15개 모으기','sh',15], ['🔥 연속 20번 넘기','combo',20], ['😮 아슬아슬 넘기','nm',1]];
const MIS_H = [['🐚 조개 10개 모으기','sh',10], ['🦀 적 2마리 밟기','stomp',2], ['❓ 상자 2개 치기','blk',2], ['🔥 연속 10번','combo',10], ['✨ 황금 조개 줍기','gold',1], ['🐚 조개 30개 모으기','sh',30], ['🦀 적 5마리 밟기','stomp',5]];
const MIS_T = 45;                                     // 45초 안에 못 하면 조용히 다음 미션으로(한 미션에 막혀 끝까지 못 보는 일이 없게)
const MIS_SH = 2, MIS_PT = 100;
function misOf(s){ const L = hard ? MIS_H : MIS_E, m = L[s.mi % L.length], r = Math.floor(s.mi / L.length); return { n:m[0], k:m[1], v:m[2] * (1 + r) }; }   // 한 바퀴 돌면 숫자만 커진다
function misVal(s, k){ return k === 'combo' ? s.combo : s.cnt[k] - s.m0; }
function misStart(s){ const m = misOf(s); s.mk = m.k; s.mv = m.v; s.m0 = m.k === 'combo' ? 0 : s.cnt[m.k]; s.mn = m.n; s.mt = 0; }
function missionH(s, dt){
  s.mt += dt;
  if(misVal(s, s.mk) < s.mv){ if(s.mt > MIS_T){ s.mi++; misStart(s); } return; }
  s.md++; s.msh += MIS_SH; s.pts += MIS_PT * mult(); if(hard) oneUpH(s);
  s.pops.push({ x:26, y:GY - 104, t:0, life:1.3, v:'🎯 미션 성공! +' + MIS_PT * mult() + ' 🐚+' + MIS_SH, big:1 }); ev('mission');
  vib([8, 20, 8]); s.mi++; misStart(s);
}
/* 장애물 하나를 넘었다 — 연속·배수·아슬아슬·피버. 전부 st 안(공정성 검사·오늘의 챌린지가 같은 결과를 내게) */
function passH(s, o){
  s.combo++; s.cmax = Math.max(s.cmax, s.combo); s.cnt.pass++;
  s.pts += 3 * comboM(s.combo) * mult();
  if(o.cl != null && o.cl < (s.pk === 'fish' ? NEAR + 3 : NEAR) && s.invuln <= 0 && s.fx.star <= 0){ s.cnt.nm++; const v = 15 * mult(); s.pts += v; s.pops.push({ x:PX - 30, y:GY - 58, t:0, v:'😮 아슬아슬! +' + v }); ev('near', o); }
  ev('pass'); fevChk(s);
}
function fevChk(s){
  if(s.combo >= s.nextFev){ s.nextFev += FEVG; s.fx.star = Math.max(s.fx.star, FEVT); s.fx.fev = FEVT; s.fevN++; ev('fever'); vib([10, 20, 10, 20, 30]); }
}
const fev1 = s => s.pk === 'long' ? FEV1 - 1 : FEV1;
function brk(s){ s.combo = 0; s.nextFev = fev1(s); }        // 부딪히면 연속이 끊긴다(피버까지 다시 10번)
const NEAR = 14;                                      // 장애물 위(아래)로 이만큼 안쪽으로 스치면 '아슬아슬'

function reset(){
  rnd = daily ? mulberry(hashStr('wave-' + today())) : Math.random;
  mod = daily ? MODS[hashStr('mod-' + today()) % MODS.length] : MODS[Math.floor(Math.random() * MODS.length)];
  st = { t:0, zone:1, pts:0, lives:hard ? LIVES : 1, lost:0, items:0, fx:{ star:0, magnet:0, slow:0, x2:0, fev:0 }, nextItem:hard ? 420 : Infinity,
         pk:(daily || window._gameSim) ? 'basic' : boardOf().k, combo:0, cmax:0, nextFev:FEV1, fevN:0, gsN:0, gold:0, cnt:{ sh:0, nm:0, stomp:0, blk:0, pass:0, gold:0 }, mi:0, md:0, msh:0, mk:'sh', mv:0, m0:0, mn:'', mt:0, dist:0, speed:100, y:0, vy:0, air:false, buf:0, coyote:0, shells:0, shield:0, invuln:0, obs:[], pick:[], next:150, nextShell:260,
         dead:false, deadT:0, flash:0, shake:0, clouds:[{x:20,y:18,s:3},{x:100,y:34,s:5},{x:150,y:12,s:2}], pops:[] };
  if(hard) hardInit(st);
  st.nextFev = fev1(st); misStart(st);
  vis.sq = []; vis.rise = []; vis.grow = 0;
  vis.combo = 0; vis.maxCombo = 0; vis.ban = null; vis.stop = 0; vis.hint = 0; vis.riv = []; vis.fl.on = false; vis.misT = 0;
}
const score = () => Math.floor(st.pts);
const mult = () => (st.fx.x2 > 0 ? 2 : 1) * (st.fx.fev > 0 ? 2 : 1);

const DIM = { rock:{ w:12, h:10, y:0 }, fin:{ w:14, h:17, y:0 }, jelly:{ w:10, h:10, y:3 }, log:{ w:28, h:8, y:0 }, bird:{ w:12, h:7, y:24 } };
/* 구간이 올라갈수록 장애물 종류가 늘어난다. 뽑기는 rnd() 한 번 — 오늘의 챌린지에서 모두 같은 코스가 나오게 */
function pickKind(){
  const w = { rock:.45, fin:.33, jelly:.22 };
  if(!hard){ const r = rnd(); return r < .45 ? 'rock' : r < .78 ? 'fin' : 'jelly'; }        // 쉬움: 처음 버전 그대로
  const k = ink(st), hi = 1 + .3 * k(3.6);                                        // 어려움: 달린 거리만큼 종류가 서서히 섞여 든다
  w.bird = .24 * k(.6) * hi; w.log = .2 * k(1.6); w.double = .16 * k(1.6) * hi; w.stair = .18 * k(2.6) * hi;
  for(const k in mod.w) w[k] = (w[k] || .1) * mod.w[k];
  let tot = 0; for(const k in w) tot += w[k];
  let r = rnd() * tot; for(const k in w){ r -= w[k]; if(r <= 0) return k; }
  return 'rock';
}
function spawn(){ if(hard) return spawnH(); spawnObs(); }
/* 황금 조개 — 조개 14개에 하나꼴(난수를 더 뽑지 않고 순번으로 — 오늘의 챌린지 코스가 그대로). 점수 +50, 조개는 1개로 센다 */
const GOLD_N = 14, GOLD_PT = 50;
const isGold = s => ++s.gsN % GOLD_N === 0 ? 1 : 0;
function spawnObs(){
  const sp = st.speed, kind = pickKind();
  /* 간격은 '뜬 시간 × 속도'에 비례한다 — 구간이 올라갈수록 비율이 줄어 빡빡해진다(그래도 억울한 판은 없게: qa/gamefair.mjs 가 검증) */
  const air = (2*JV/G) * sp, gap = hard ? air * (0.84 - 0.2 * ramp(st)) + 34 + rnd() * (46 - 18 * Math.min(1, st.sd / (MILE * 3))) : air * 0.78 + 34 + rnd() * 46;
  const parts = kind === 'double' ? [['rock', 0], ['rock', 22]] : kind === 'stair' ? [['rock', 0], ['fin', 46]] : [[kind, 0]];
  let end = 0;
  parts.forEach(([k, dx])=>{ const d = DIM[k]; st.obs.push({ k, w:d.w, h:d.h, y:d.y, x:W + 8 + dx }); end = Math.max(end, dx + d.w); });
  /* 조개 — 뛰어넘는 길목이 곧 보상. 갈매기 아래엔 땅 가까이에 둔다(갈매기를 피해 '안 뛰는' 쪽이 보상) */
  if(rnd() < 0.7){ const o = st.obs[st.obs.length - 1]; st.pick.push({ x:o.x + o.w/2 - 3, y:kind === 'bird' ? 4 : o.h + 20 + rnd()*8, got:false, gold:isGold(st) }); }
  st.next = end + gap;
}

/* 아이템 하나 — 장애물과 겹치지 않는 높이·자리에. 하트는 목숨이 줄었을 때만 나온다 */
function spawnItem(){
  const w = { tube:.16, star:.12, magnet:.18, slow:.14, gem:.14, x2:.16 };
  if(hard && st.lives < LIVES) w.heart = .14;          // 쉬움은 목숨 하나 규칙 — 강화로 아이템이 나와도 하트는 없다
  let tot = 0; for(const k in w) tot += w[k];
  let r = rnd() * tot, k = 'gem'; for(const q in w){ r -= w[q]; if(r <= 0){ k = q; break; } }
  const y = [6, 24, 40][Math.floor(rnd() * 3)];
  const x = W + 30;
  if(st.obs.some(o=>Math.abs(o.x - x) < 26)) return;                             // 장애물 바로 위엔 두지 않는다
  st.pick.push({ x, y, got:false, it:k });
}

function jump(){
  if(mode !== 'run' || st.dead) return;
  if(!st.air || st.coyote > 0){ st.vy = JV; st.air = true; st.coyote = 0; st.buf = 0; held = true; if(hard){ st.hold = true; st.on = null; } vib(8); beep(300, 560, 0.12, 'square', 0.04); ev('jump'); }
  else if(hard && !st.dj && st.y > 6){ st.dj = true; st.vy = JV * 0.86; st.buf = 0; held = true; st.hold = true; vib(6); beep(420, 900, 0.1, 'square', 0.04); ev('dj'); }   // 어려움: 공중에서 한 번 더 — 물보라를 박차고
  else st.buf = 0.12;                                // 착지 직전에 눌러도 먹는다
}
/* 누르고 있는 상태는 st 에도 둔다 — 공정성 검사가 미래를 돌려 볼 때 같은 높이로 뛰어야 해서 */
/* 어려움은 짧게 톡 쳐도 상어 지느러미(가장 높은 장애물)를 넘을 만큼 뜬다 — 처음 하는 사람은 길게 누르기보다 톡 친다 */
function release(){ held = false; if(st){ st.hold = false; const cut = hard ? CUT_H : CUT; if(st.vy > cut) st.vy = cut; } }

function prune(a, f){ let j = 0; for(let i = 0; i < a.length; i++){ const v = a[i]; if(f(v)) a[j++] = v; } a.length = j; return a; }
const OBS_OK = o=>o.x > -24, PICK_OK = p=>p.x > -12 && !p.got, POP_OK = p=>p.t < (p.life || 0.7), PLAT_OK = p=>p.x + p.w > -30, BLK_OK = b=>b.x > -20, HOLE_OK = h=>h.x + h.w > -10, MARK_OK = m=>m.x > -40;
function step(dt){
  const s = st; s.t += dt;
  if(s.dead){ s.deadT += dt; s.flash = Math.max(0, s.flash - dt*3); s.shake = Math.max(0, s.shake - dt*20); return; }
  for(const k in s.fx) s.fx[k] = Math.max(0, s.fx[k] - dt);
  /* 어려움은 달린 거리만큼 매끄럽게 빨라진다(끝이 없다 — 점점 상한에 다가갈 뿐). 쉬움은 처음 그대로 */
  s.speed = hard ? (s.boss ? 40 : SPD0 + SPDX * ramp(s)) * (s.fx.slow > 0 ? 0.62 : 1) * (s.gust > 0 ? GUST_F : 1) : Math.min(210, 92 + s.t * 3.4);
  s.dist += s.speed * dt; s.pts += s.speed * dt / 14 * mult();
  s.nextItem -= s.speed * dt; if(s.nextItem <= 0){ spawnItem(); s.nextItem = (hard ? 900 + rnd() * 600 : 520 + rnd() * 420) * (1 - .12 * (UP.item || 0)); }
  // 점프 물리
  if(hard){ physH(s, dt); if(s.dead) return; }
  else if(s.air){ s.vy -= G * dt; s.y += s.vy * dt;
    if(s.y <= 0){ s.y = 0; s.vy = 0; s.air = false; s.coyote = 0.08; ev('land'); if(s.buf > 0){ s.buf = 0; jump(); } } }
  else if(s.coyote > 0) s.coyote -= dt;
  s.buf = Math.max(0, s.buf - dt);
  // 스폰·이동
  s.next -= s.speed * dt; if(s.next <= 0) spawn();
  const mv = s.speed * dt;                                                   // 제자리에서 걸러 낸다 — 매 프레임 새 배열을 만들지 않게(중급 안드로이드 GC 끊김)
  for(const o of s.obs) o.x -= mv; prune(s.obs, OBS_OK);
  for(const p of s.pick) p.x -= mv; prune(s.pick, PICK_OK);
  for(const c of s.clouds){ c.x -= c.s * dt; if(c.x < -30) c.x = W + 10; }
  for(const p of s.pops){ p.t += dt; p.y += 26 * dt; } prune(s.pops, POP_OK);
  if(hard){ moveH(s, dt); if(s.dead) return; }
  // 충돌 — 서퍼 몸통은 그림보다 좁게 잡는다(억울한 죽음이 제일 싫다)
  const sx = 40, sw = 12, sb = s.y, st_ = s.y + (s.big ? 25 : 20);
  for(const o of s.obs) if(!o.ps && o.x + o.w < sx){ o.ps = 1; passH(s, o); }   // 넘은 장애물 — 연속·배수·아슬아슬·피버
  s.invuln = Math.max(0, s.invuln - dt);
  for(const o of s.obs){
    const ox = o.x + 3, ow = o.w - 6, ob = o.y, ot = o.y + o.h - 3;   // 그림보다 한 뼘 작게 — 스친 건 봐준다
    if(sx + sw > ox && sx < ox + ow){ const cl = sb >= ot ? sb - ot : st_ <= ob ? ob - st_ : -1; if(cl >= 0 && (o.cl == null || cl < o.cl)) o.cl = cl; }   // 위(아래)로 얼마나 스쳤나
    if(sx + sw > ox && sx < ox + ow && sb < ot && st_ > ob){
      if(hard && STOMP[o.k] && s.vy < 0 && s.py >= o.y + o.h * 0.4){ stompH(s, o); break; }   // 위에서 내려오면 밟기
      if(s.fx.star > 0){ ev('smash', o); s.obs = s.obs.filter(x=>x !== o); s.pts += 20 * mult(); s.pops.push({ x:o.x, y:GY - 34, t:0, v:'⭐ 쾅! +20' }); vib(10); beep(700, 1400, 0.1, 'square', 0.05); break; }
      if(s.invuln > 0) continue;                                        // 막 튜브가 터진 직후엔 잠깐 무적
      if(s.shield){ s.shield = 0; s.invuln = 0.8; s.flash = 0.45; s.obs = s.obs.filter(x=>x !== o); brk(s); ev('shield');
        s.pops.push({ x:36, y:GY - 40, t:0, v:'🛟 튕겨냄' }); vib([20, 30, 20]); beep(500, 250, 0.18, 'triangle', 0.06); break; }
      if(hard){ hurt(s, o); return; }                                   // 어려움: 큰 보드면 작아지기만, 아니면 목숨 하나
      s.lives--; s.lost++; brk(s);
      if(s.lives <= 0){ wipeout(); return; }
      /* 목숨이 남았으면 넘어졌다 다시 탄다 — 잠깐 무적, 부딪힌 장애물은 치운다 */
      s.invuln = 1.4; s.flash = 0.6; s.shake = 4; s.obs = s.obs.filter(x=>x !== o); ev('hit');
      s.pops.push({ x:30, y:GY - 46, t:0, life:1, v:'💔 목숨 ' + s.lives + '개 남음' }); vib([30, 40, 30]); beep(300, 120, 0.25, 'sawtooth', 0.06); break;
    }
  }
  if(s.fx.magnet > 0) s.pick.forEach(p=>{ if(!p.it && p.x < 120 && p.x > 20){ p.x += (44 - p.x) * Math.min(1, dt * 5); p.y += (10 + s.y - p.y) * Math.min(1, dt * 5); } });
  for(const p of s.pick){
    if(!p.got && p.it && sx + sw + 4 > p.x && sx - 4 < p.x + 9 && sb < p.y + 9 && st_ > p.y){ p.got = true; s.items++; got(p.it); continue; }
    if(!p.it && !p.got && sx + sw + 3 > p.x && sx - 3 < p.x + 7 && sb < p.y + 7 && st_ > p.y){ p.got = true; s.shells++; s.cnt.sh++;
      if(p.gold){ s.gold++; s.cnt.gold++; const v = (GOLD_PT + (s.pk === 'gun' ? 20 : 0)) * mult(); s.pts += v; s.pops.push({ x:p.x - 16, y:GY - p.y - 14, t:0, life:1, v:'✨ 황금 조개 +' + v, big:1 }); vib([8, 16, 8]); ev('gold', p); }
      else { s.pts += SV() * mult(); s.pops.push({ x:p.x, y:GY - p.y - 10, t:0, v:'+' + SV() * mult() }); vib(6); beep(880, 1320, 0.09, 'triangle', 0.06); ev('shell', p); }
      if(hard) oneUpH(s); if(s.shells % ((hard ? 25 : 5) - Math.max(0, (UP.shield || 0) - 1) * (hard ? 2 : 1)) === 0 && !s.shield){ s.shield = 1; s.pops.push({ x:30, y:GY - 56, t:0, v:'🛟 구명튜브!' }); beep(660, 1320, 0.2, 'triangle', 0.07); } }
  }
  missionH(s, dt);
}

function got(k){
  const s = st, it = ITEMS[k];
  if(k === 'heart') s.lives = Math.min(hard ? MAXL : LIVES, s.lives + 1);
  else if(k === 'tube') s.shield = 1;
  else if(k === 'star') s.fx.star = 5;
  else if(k === 'magnet') s.fx.magnet = 8 + 2 * (UP.mag || 0);
  else if(k === 'slow') s.fx.slow = 5;
  else if(k === 'x2') s.fx.x2 = 8;
  else if(k === 'gem') s.pts += 50 * mult();
  s.pops.push({ x:30, y:GY - 60, t:0, life:1, v:it.ic + ' ' + it.n }); vib([8, 20, 8]); beep(660, 1320, 0.2, 'triangle', 0.07); ev('item', k);
}

/* ── 어려움 = 마리오식 끝없는 바다 ─────────────────────────────────
   스테이지가 없다 — 멈추지 않고 계속 달린다. 달린 거리만큼 속도·적 종류·간격이 매끄럽게 빡빡해진다.
   500m마다 🏮 등대를 지나며(멈추지 않음) 조개 보너스, 그때 풍경(마을·시간대)이 천천히 바뀐다.
   1400m에 첫 🐙 거대 문어, 그 뒤 1500m마다 다시 — 올 때마다 체력·속도가 는다. 쓰러뜨리면 보너스, 그대로 계속.
   적은 위에서 밟으면 쓰러지고(옆은 아프다) ? 상자는 아래에서 머리로 친다. 나무 발판·방파제엔 올라서고 소용돌이는 넘는다.
   맞으면: 큰 보드면 작아지기만, 아니면 목숨 하나 — 그 자리에서 잠깐 무적으로 계속 탄다. 목숨이 다하면 끝.
   상태는 전부 st 안 — 공정성 검사(clone/swap)가 그대로 미래를 돌려 볼 수 있게. 쉬움·오늘의 챌린지는 이 코드를 타지 않는다. */
const MILE = 5000, MILE_SH = 5, BOSS1 = 14000, BOSSG = 15000, SPD0 = 104, SPDX = 54, MAXL = 9;   // 거리 단위: 10 = 1m
const ramp = s => 1 - Math.exp(-s.sd / 15000);                                // 0 → 1 로 매끄럽게(1000m ≈ .49, 2000m ≈ .74)
const ink = s => { const lv = s.sd / MILE; return q => Math.max(0, Math.min(1, lv - q)); };   // q×500m 부터 500m 동안 서서히 섞여 든다
const meters = s => Math.floor(s.sd / 10);
const zkey = s => ZONES[Math.max(0, s.zone - 1)][3];
const GUST_F = .78, GUST_T = 2.2, GUST_W = 1, GUST_GAP = 4.5;                  // 폭풍 구간 맞바람 — 1초 예고 뒤 2.2초 동안 느려진다(리듬이 흔들린다)
const STOMP = { jelly:1, crab:1, gull:1, bird:1, fish:1, squid:1 }, CHAIN = [100, 200, 400, 800, 1000];
const bodyH = s => s.big ? 25 : 20;
const overX = a => 52 > a.x + 1 && 40 < a.x + a.w - 1;                    // 서퍼 몸통(40~52)과 가로로 겹치나
const holeAt = s => s.hole.some(h=>PX > h.x + 1 && PX < h.x + h.w - 1);
const tune = (ns, ms)=>ns.forEach((f, i)=>setTimeout(()=>beep(f, 0, ms * .0009, 'square', .035), i * ms));
function hardInit(s){ Object.assign(s, { gT:GUST_GAP, gw:0, gust:0, sd:0, big:0, dj:false, hold:false, on:null, plat:[], blk:[], hole:[], marks:[], boss:null, bossN:0, nextBoss:BOSS1, nextMile:MILE, miles:0, bgP:1, bgF:0, chain:0, oneUp:100, py:0, next:200 }); }

/* 코스 조각 하나 — 장애물(예전 그대로)·? 상자·나무 발판·소용돌이·방파제·날치·급강하 갈매기. 멀리 갈수록 종류가 서서히 는다 */
function spawnH(){
  const s = st, X = W + 8, k3 = ink(s), lv = Math.min(5, 1 + s.sd / MILE);
  if(s.boss || s.sd > s.nextBoss - 320){ s.next = 60; return; }                // 보스 앞은 비워 둔다
  const w = { obs:.46 - .06 * k3(3), blk:.2, plat:.16, hole:.14 + .04 * k3(3), fish:.1 * k3(.6), gull:.1 * k3(.6), wall:.08 * k3(.6) }, zk = zkey(s);
  if(zk === 'storm') w.barrel = .2; else if(zk === 'aurora') w.squid = .2;        // 구간 장애물 — 폭풍엔 굴러오는 드럼통, 밤바다엔 오르내리는 야광 오징어(다른 구간 코스는 예전 그대로)
  let tot = 0; for(const k in w) tot += w[k];
  let r = rnd() * tot, k = 'obs'; for(const q in w){ r -= w[q]; if(r <= 0){ k = q; break; } }
  if(k === 'obs') return spawnObs();
  const air = (2*JV/G) * s.speed, gap = air * (0.8 - 0.16 * ramp(s)) + 34 + rnd() * 40;
  const coins = (x0, n, y, dx, arc)=>{ for(let i = 0; i < n; i++) s.pick.push({ x:x0 + i * dx, y:y + (arc ? Math.sin(i / Math.max(1, n - 1) * Math.PI) * arc : 0), got:false, gold:isGold(s) }); };
  let len = 14;
  if(k === 'blk'){ const n = 1 + Math.floor(rnd() * 3), y = 34 + Math.floor(rnd() * 5);
    for(let i = 0; i < n; i++){ const q = rnd(); s.blk.push({ k:'blk', x:X + i * 12, y, w:12, h:12, c:q < .3 ? 'board' : q < .45 ? 'star' : q < .62 ? 'magnet' : 'coin', used:false, bump:0 }); }
    coins(X - 6, n + 2, 5, 10); len = n * 12; }
  else if(k === 'plat'){ const pw = 40 + Math.floor(rnd() * 18), y = 22 + Math.floor(rnd() * 10), p = { k:'wood', x:X, y, by:y, w:pw };
    s.plat.push(p); coins(X + 6, 3, y + 5, 11);
    if(rnd() < .6 * k3(.6)) s.obs.push({ k:'crab', w:12, h:8, y, x:X + 4, pl:p, off:4, dir:1 });   // 꽃게는 발판 위를 오간다
    if(rnd() < .4 * k3(1.6)) s.obs.push({ k:'rock', w:12, h:10, y:0, x:X + pw / 2 - 6 });
    len = pw; }
  else if(k === 'hole'){ const hw = Math.min(46, 22 + Math.floor(lv * 3) + Math.floor(rnd() * 8)); s.hole.push({ x:X, w:hw });
    if(hw > 34) s.plat.push({ k:'buoy', x:X + hw / 2 - 9, y:16, by:16, w:18 });   // 넓은 소용돌이엔 부표 디딤돌
    coins(X + 2, 4, 22, hw / 4, 14); len = hw; }
  else if(k === 'wall'){ const pw = 52 + Math.floor(rnd() * 26), p = { k:'wall', x:X, y:12, by:12, w:pw }; s.plat.push(p);
    coins(X + 8, 3, 18, 13);
    if(rnd() < .5 * k3(1.6)) s.obs.push({ k:'crab', w:12, h:8, y:12, x:X + pw - 16, pl:p, off:pw - 16, dir:-1 });
    len = pw; }
  else if(k === 'fish'){ s.obs.push({ k:'fish', w:12, h:7, y:-12, x:X + 30, ft:0, A:32 + rnd() * 10 }); len = 30; }
  else if(k === 'barrel'){ s.obs.push({ k:'barrel', w:12, h:11, y:0, x:X + 20, vx:26 + rnd() * 8 }); coins(X + 30, 2, 26, 10); len = 30; }
  else if(k === 'squid'){ s.obs.push({ k:'squid', w:10, h:10, y:4, x:X + 10, ft:0, ph:rnd() * 6.28 }); coins(X + 4, 3, 36, 9); len = 24; }
  else { s.obs.push({ k:'gull', w:12, h:7, y:42, x:X }); coins(X - 4, 3, 4, 9); }
  s.next = len + gap;
}

/* 물리 — 발판·상자 위에 서고, 상자는 아래에서 머리로 치고, 소용돌이 위에선 빨려 든다 */
function physH(s, dt){
  s.py = s.y;
  if(s.on){ const p = s.on; if(!overX(p) || !(s.plat.includes(p) || s.blk.includes(p))){ s.on = null; s.air = true; s.vy = 0; s.coyote = .09; } else s.y = p.k === 'blk' ? p.y + p.h : p.y; }
  if(s.air && s.coyote > 0) s.coyote -= dt;
  for(const p of s.plat) if(p.k === 'wall' && s.on !== p && overX(p) && s.y < p.y - 3 && s.py < p.y - 3){ s.y = p.y; landH(s, p); ouch(s, null); return; }   // 방파제 옆면은 아프다
  if(!s.air && !s.on && holeAt(s)){ s.air = true; s.vy = -80; }
  if(!s.air) return;
  s.vy -= G * (s.hold && s.vy > 0 ? .72 : 1) * dt; s.y += s.vy * dt;          // 누르고 있으면 더 높이(가변 점프)
  const hh = bodyH(s);
  if(s.vy > 0){ for(const b of s.blk) if(overX(b) && s.py + hh <= b.y + 1 && s.y + hh > b.y){ s.y = b.y - hh; s.vy = -20; bumpH(s, b); break; } }
  else {
    for(const p of s.plat) if(overX(p) && s.py >= p.y - .5 && s.y <= p.y){ s.y = p.y; landH(s, p); return; }
    for(const b of s.blk) if(overX(b) && s.py >= b.y + b.h - .5 && s.y <= b.y + b.h){ s.y = b.y + b.h; landH(s, b); return; }
  }
  if(s.y <= 0){ if(!holeAt(s)){ s.y = 0; landH(s, null); } else if(s.y < -5) fallH(s); }
}
function landH(s, p){ s.vy = 0; s.air = false; s.on = p; s.dj = false; s.chain = 0; s.coyote = 0; ev('land'); if(s.buf > 0){ s.buf = 0; jump(); } }
function fallH(s){
  if(s.shield){ s.shield = 0; s.y = -5; s.vy = JV * 1.05; s.invuln = .8; s.dj = false; brk(s); ev('shield'); s.pops.push({ x:30, y:GY - 46, t:0, v:'🛟 소용돌이 탈출!' }); beep(500, 900, .18, 'triangle', .06); return; }
  lose(s, '🌀 소용돌이에 빠졌어요');
}
function ouch(s, o){
  if(s.fx.star > 0 || s.invuln > 0 || s.dead) return;
  if(s.shield){ s.shield = 0; s.invuln = .8; s.flash = .45; brk(s); ev('shield'); s.pops.push({ x:36, y:GY - 40, t:0, v:'🛟 튕겨냄' }); vib([20, 30, 20]); beep(500, 250, .18, 'triangle', .06); return; }
  hurt(s, o);
}
function hurt(s, o){
  if(o) s.obs = s.obs.filter(x=>x !== o); brk(s);
  if(s.big){ s.big = 0; s.invuln = 1.4; s.flash = .4; ev('shrink'); s.pops.push({ x:24, y:GY - 50, t:0, life:1, v:'🏄 보드가 작아졌어요' }); vib([20, 30, 20]); beep(600, 200, .25, 'square', .05); return; }
  lose(s);
}
function lose(s, why){
  s.lives--; s.lost++; s.big = 0; brk(s);
  if(s.lives <= 0){ wipeout(); return; }
  /* 멈추지 않는다 — 그 자리에서 잠깐 무적으로 계속. 바로 앞 위험(적·소용돌이)만 치워 연달아 잃지 않게 */
  s.obs = s.obs.filter(o=>o.x > PX + 70 || o.x + o.w < PX - 24); s.hole = s.hole.filter(h=>h.x > PX + 60 || h.x + h.w < PX - 20);
  if(s.y < 0){ s.y = 0; s.vy = JV * .9; s.air = true; s.on = null; }
  s.invuln = 2; s.dj = false; s.chain = 0; s.flash = .6; ev('hit'); vib([30, 40, 30]); beep(300, 120, .25, 'sawtooth', .06);
  s.pops.push({ x:20, y:GY - 56, t:0, life:1.1, v:(why ? why + ' · ' : '💔 ') + '목숨 ' + s.lives + '개 남음' });
}
function stompH(s, o){
  s.obs = s.obs.filter(x=>x !== o); s.cnt.stomp++; s.combo++; s.cmax = Math.max(s.cmax, s.combo); ev('pass'); fevChk(s);   // 밟기도 연속에 든다
  const n = s.chain++, v = CHAIN[n];                                           // 연속 밟기 — 100·200·400·800·1000, 그다음은 1-UP
  if(v){ s.pts += v * mult(); s.pops.push({ x:o.x, y:GY - o.y - o.h - 6, t:0, v:'+' + v * mult() }); }
  else { s.lives = Math.min(MAXL, s.lives + 1); s.pops.push({ x:o.x - 6, y:GY - o.y - 20, t:0, life:1, v:'1-UP!', big:1 }); ev('1up'); }
  s.vy = s.hold ? JV * .95 : JV * .62; s.air = true; s.on = null; s.dj = false;
  ev('stomp', o); vib(12); beep(520, 1040, .08, 'square', .05);
}
function bumpH(s, b){
  b.bump = .18; ev('bump', b); beep(160, 110, .07, 'square', .05);
  if(b.used) return;
  b.used = true; s.cnt.blk++;
  const k = b.c === 'board' && s.big ? 'coin' : b.c;
  if(k === 'coin'){   // 조개 연속 — 하나는 바로, 여섯 개가 앞에 줄지어 다가온다
    s.shells++; s.pts += SV() * mult(); oneUpH(s); s.pops.push({ x:b.x, y:GY - b.y - 22, t:0, v:'+' + SV() * mult() }); ev('pop', { b, ic:'🐚' }); beep(988, 1976, .12, 'triangle', .06);
    for(let i = 0; i < 6; i++) s.pick.push({ x:b.x + 18 + i * 9, y:6 + Math.sin(i / 5 * Math.PI) * 14, got:false });
    return; }
  s.items++;
  if(k === 'board'){ s.big = 1; s.pops.push({ x:16, y:GY - 62, t:0, life:1.2, v:'🏄 큰 파도 보드! 한 번 버텨요' }); }
  else if(k === 'star'){ s.fx.star = 6; s.pops.push({ x:24, y:GY - 62, t:0, life:1.2, v:'⭐ 무적 6초!' }); }
  else { s.fx.magnet = 8 + 2 * (UP.mag || 0); s.pops.push({ x:24, y:GY - 62, t:0, life:1.2, v:'🧲 조개 자석' }); }
  ev('pop', { b, k, ic:k === 'board' ? '🏄' : k === 'star' ? '⭐' : '🧲' }); vib([8, 20, 8]); beep(523, 1568, .3, 'triangle', .07);
}
function oneUpH(s){ while(s.shells >= s.oneUp){ s.oneUp += 100; s.lives = Math.min(MAXL, s.lives + 1); s.pops.push({ x:20, y:GY - 70, t:0, life:1.3, v:'🍄 1-UP! 조개 100개', big:1 }); ev('1up'); } }

/* 움직임 — 발판·상자·소용돌이가 흘러오고, 적은 저마다 패턴으로 움직인다. 등대·보스도 여기서 */
function moveH(s, dt){
  const v = s.speed * dt, lead = W + 8 - PX;
  s.sd += v;
  for(const p of s.plat){ p.x -= v; if(p.k === 'buoy') p.y = p.by + Math.sin(s.t * 3 + p.by) * 1.5; } prune(s.plat, PLAT_OK);
  for(const b of s.blk){ b.x -= v; b.bump = Math.max(0, b.bump - dt); } prune(s.blk, BLK_OK);
  for(const h of s.hole) h.x -= v; prune(s.hole, HOLE_OK);
  for(const o of s.obs){
    if(o.k === 'crab'){ o.off += o.dir * 14 * dt; const mx = o.pl.w - o.w; if(o.off < 0){ o.off = 0; o.dir = 1; } else if(o.off > mx){ o.off = mx; o.dir = -1; } o.x = o.pl.x + o.off; o.y = o.pl.y; }
    else if(o.k === 'fish'){ o.ft += dt; o.x -= 26 * dt; const f = o.ft % 1.7; o.y = f < 1 ? Math.sin(f * Math.PI) * o.A : -12; if(f < dt && o.ft > .1) ev('splash', o); }   // 날치 — 물 밖으로 포물선
    else if(o.k === 'gull') o.y = 6 + 36 * Math.min(1, Math.max(0, (o.x - 40) / 110));                    // 갈매기 — 다가오며 수면까지 내려꽂는다
    else if(o.k === 'squid'){ o.ft += dt; o.y = 4 + 20 * (.5 + .5 * Math.sin(o.ft * 2.4 + o.ph)); }        // 야광 오징어 — 천천히 오르내린다(낮으면 넘고, 높으면 밑으로 · 위에서 밟아도 된다)
    else if(o.vx) o.x -= o.vx * dt;
  }
  // 등대 — 서퍼 자리에 정확히 500m 째에 닿도록 화면 밖에서 미리 띄운다. 지나가도 멈추지 않는다
  if(s.sd >= s.nextMile - lead){ s.marks.push({ k:'goal', x:W + 8 - (s.sd - (s.nextMile - lead)) + v, hit:false, m:s.nextMile / 10, ht:0 }); s.nextMile += MILE; }
  if(!s.boss && s.sd >= s.nextBoss){ const lv = s.bossN, hp = Math.min(6, 3 + lv); s.boss = { x:W + 30, y:4, w:30, h:26, hp, mx:hp, lv, ph:'in', t:0, hurt:0, shot:0, kind:lv % 2 ? 'crab' : 'octo' }; ev('boss', s.boss); }   // 문어 ↔ 거대 꽃게가 번갈아
  for(const m of s.marks){ m.x -= v; if(m.hit) m.ht += dt; else if(m.x <= PX){ m.hit = true; mileH(s, m); } }
  prune(s.marks, MARK_OK);
  /* 맞바람 — 폭풍 구간에서만. 예고(gw) → 바람(gust) → 쉼. 보스 중엔 불지 않는다 */
  if(zkey(s) === 'storm' && !s.boss){ if(s.gust > 0){ s.gust = Math.max(0, s.gust - dt); if(!s.gust) s.gT = GUST_GAP; }
    else if(s.gw > 0){ s.gw = Math.max(0, s.gw - dt); if(!s.gw){ s.gust = GUST_T; ev('gust'); } }
    else if((s.gT -= dt) <= 0){ s.gw = GUST_W; } }
  else if(s.gust || s.gw){ s.gust = 0; s.gw = 0; s.gT = GUST_GAP; }
  if(s.bgF > 0){ s.bgF = Math.max(0, s.bgF - dt / 3); if(s.bgF < .5 && !window._gameSim) TH = THEMES[ZONES[s.zone - 1][2]]; }   // 풍경은 3초에 걸쳐 바뀐다
  if(s.boss) bossH(s, dt);
}
/* 등대 통과 — 조개 보너스, 다음 마을로(풍경이 천천히 넘어간다). 세계는 그대로 흐른다 */
function mileH(s, m){
  s.miles++; s.shells += MILE_SH; s.pts += (MILE_SH * SV() + 100 * s.miles) * mult(); oneUpH(s);
  const heal = s.lives < LIVES; if(heal) s.lives++;                              // 등대 = 쉼표 — 잃은 목숨 하나를 채워 준다(3개까지). 처음 하는 사람도 다음 등대를 노리게
  m.heal = heal;
  s.bgP = s.zone; s.zone = 1 + s.miles % ZONES.length; s.bgF = 1;
  ev('mile', m); vib([10, 20, 10]);
  const zk = zkey(s); if(zk === 'storm' || zk === 'aurora') s.pops.push({ x:18, y:GY - 112, t:0, life:2.2, v:zk === 'storm' ? '💨 폭풍: 맞바람 · 🛢 드럼통' : '🌙 밤바다: 🦑 오징어는 밟아요', big:1 }); beep(784, 1568, .25, 'triangle', .06);
}
/* 거대 문어 — 다가와 먹물을 쏘고, 수면으로 돌진한다. 머리를 밟아 체력을 다 깎으면 끝. 맞을 때마다, 다시 올 때마다 빨라진다 */
function bossH(s, dt){
  const b = s.boss, e = b.mx - b.hp + b.lv * .8; b.t += dt; b.hurt = Math.max(0, b.hurt - dt);
  const cr = b.kind === 'crab';                                                  // 꽃게 — 수면을 걸어오고, 거품을 굴리고, 통통 뛰며 돌진한다
  if(b.ph === 'in'){ b.x -= 70 * dt; b.y = cr ? 0 : 4 + Math.sin(b.t * 3) * 3; if(b.x <= 124){ b.ph = 'wait'; b.t = 0; b.shot = 0; } }
  else if(b.ph === 'wait'){ b.y = cr ? Math.abs(Math.sin(b.t * 6)) * 3 : 4 + Math.sin(b.t * 5) * 3;
    const pk = cr ? 'bub' : 'ink';
    if(b.t > .45 && b.shot < 1){ b.shot = 1; s.obs.push({ k:pk, w:8, h:8, y:0, x:b.x - 4, vx:70 + e * 15 }); }
    if(b.lv >= 2 && b.t > 1.05 && b.shot < 2){ b.shot = 2; s.obs.push({ k:pk, w:8, h:8, y:0, x:b.x - 4, vx:60 + e * 12 }); }   // 세 번째 보스부터는 두 발
    if(b.t > Math.max(.85, 1.7 - e * .2)){ b.ph = 'dash'; b.t = 0; } }
  else if(b.ph === 'dash'){ b.x -= (120 + e * 20) * dt; b.y = cr ? Math.abs(Math.sin(b.t * 7)) * 7 : Math.max(0, b.y - 30 * dt); if(b.x + b.w < -12){ b.x = W + 30; b.ph = 'in'; b.t = 0; } }
  else if(b.ph === 'back'){ b.x += 120 * dt; b.y = cr ? Math.abs(Math.sin(b.t * 8)) * 6 : 10 + Math.sin(b.t * 8) * 2; if(b.x >= 124){ b.ph = 'wait'; b.t = 0; b.shot = 0; } }
  else if(b.ph === 'die'){ b.y -= 30 * dt; if(b.t > 1.3){ s.boss = null; s.bossN++; s.nextBoss += BOSSG; s.next = 140; ev('bossDown', s.bossN); } return; }
  const ox = b.x + 4, ow = b.w - 8, ot = b.y + b.h - 2;
  if(b.hurt > 0 || !(52 > ox && 40 < ox + ow && s.y < ot && s.y + bodyH(s) > b.y)) return;
  if((s.vy < 0 && s.py >= b.y + b.h * .45) || s.fx.star > 0){
    b.hp--; b.hurt = .8; b.t = 0; b.ph = b.hp > 0 ? 'back' : 'die';
    if(s.fx.star <= 0){ s.vy = JV * .95; s.air = true; s.on = null; s.dj = false; }
    const v = (b.hp > 0 ? 1000 : 5000 + 2500 * b.lv) * mult(); s.pts += v; s.pops.push({ x:b.x, y:GY - b.y - 34, t:0, life:1, v:'+' + v, big:1 });
    ev('bossHit', b); vib([20, 20, 40]); beep(200, 900, .25, 'square', .06); return; }
  ouch(s, null);
}
function wipeout(){
  st.dead = true; st.flash = 1; st.shake = 5; held = false; beep(220, 60, 0.4, 'sawtooth', 0.07); ev('crash');
  vib([40, 30, 60]);
  if(!window._gameSim){ const id = runId; setTimeout(()=>{ if(id === runId) finish(); }, 650); }
}
function finish(){
  if(mode !== 'run') return;
  mode = 'over'; window._gameRun = false;
  const sc = score();
  const r = typeof playGameDone === 'function' ? playGameDone(sc, daily, st.shells + st.msh, hard) : { gain:0, newBest:false, best:sc };   // 미션 조개도 지갑에(한 번만 — finish 는 mode 로 한 번만 돈다)
  const b0 = BOARDS.filter(boardOpen).length;
  r.ach = achCheck({ sc, daily, hard }); if(r.ach.length && typeof shellBal === 'function') r.bal = shellBal();
  r.nbd = BOARDS.filter(boardOpen).length > b0 ? BOARDS.filter(boardOpen).pop() : null;   // 이번 판으로 새 보드가 열렸나
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
  gshell(){ const S = mk(11, 10), x = S.x; x.translate(.5, .5);      // 황금 조개 — 같은 모양, 금빛
    const P = new Path2D(); P.moveTo(5, 8.6); P.bezierCurveTo(.5, 7, -.2, 2.2, 2.2, 1); P.quadraticCurveTo(5, -.7, 7.8, 1); P.bezierCurveTo(10.2, 2.2, 9.5, 7, 5, 8.6); P.closePath();
    x.fillStyle = lg(x, 0, 0, 0, 9, '#FFF6B8', '#F2B01E'); x.fill(P);
    inside(x, P, ()=>{ x.strokeStyle = 'rgba(160,100,0,.5)'; x.lineWidth = .5; [1.2, 3, 5, 7, 8.8].forEach(t=>{ x.beginPath(); x.moveTo(5, 8.2); x.lineTo(t, .5); x.stroke(); }); blob(x, 3.2, 2.6, 1.6, .9, 'rgba(255,255,255,.9)', -.5); });
    outl(x, P, .75); return S; },
  board(cols){ const S = mk(30, 8), x = S.x; cols = cols || ['#FF7A59', '#FFC04D'];
    const P = new Path2D(); P.moveTo(1.4, 2); P.bezierCurveTo(.2, 2.2, .2, 5.2, 2.2, 5.2); P.lineTo(22, 5.2); P.bezierCurveTo(25.5, 5.2, 28, 3.6, 29.2, 1.2); P.bezierCurveTo(26, 1.6, 23, 2, 20, 2); P.closePath();
    const F = new Path2D(); F.moveTo(4, 5); F.quadraticCurveTo(4.6, 7.6, 7.6, 7.4); F.lineTo(8, 5); F.closePath(); x.fillStyle = '#2E5A86'; x.fill(F); outl(x, F, .6);
    x.fillStyle = lg(x, 0, 0, 30, 0, cols[0], cols[1]); x.fill(P);
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
const spr = k => SPR[k] || (SPR[k] = k.startsWith('it_') ? bakeItem(k.slice(3)) : k.startsWith('bd_') ? BAKE.board((BOARDS.find(b=>b.k === k.slice(3)) || BOARDS[0]).c) : BAKE[k]());
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
  // 뒷배경 — 구간마다 강원 마을 풍경 한 장(scenery.js). 달린 거리만큼 아주 천천히 옆으로 흘러 시차를 준다. 굽기 전엔 그린 하늘
  const bg = bgOf(s), bo = { w:W, h:GY, hz:118, pan:Math.sin(s.dist / 2400), noFg:1, noVig:1 };
  let bgOk = !!(window.scenery && scenery.draw(c, bg[0], bg[1], bo));
  if(hard && bgOk && s.bgF > 0){ const pb = BG_HARD[ZONES[s.bgP - 1][3]]; c.globalAlpha = s.bgF; scenery.draw(c, pb[0], pb[1], bo); c.globalAlpha = 1; }   // 등대를 지나면 앞 마을이 서서히 옅어진다
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
  if(hard && zkey(s) === 'aurora') nightD(s);
  if(hard) worldH(s, dt);
  // 아이템 — 반짝이는 방울 속에 떠 있다
  s.pick.forEach(p=>{ if(!p.it) return; const S = spr('it_' + p.it), cx = p.x + 4.5, cy = GY - p.y - 4.5 + Math.sin(s.t * 5 + p.x / 10) * 1.3;
    const pu = 1 + Math.sin(s.t * 6 + p.x) * .05; c.drawImage(S.c, cx - 7 * pu, cy - 7 * pu, 14 * pu, 14 * pu); });
  // 조개 — 가끔 반짝
  s.pick.forEach(p=>{ if(p.it) return; const S = spr(p.gold ? 'gshell' : 'shell'), cx = p.x + 3.5, cy = GY - p.y - 3.5 + Math.sin(s.t * 4 + p.x / 7) * .8;
    if(p.gold){ const pu = 1.25 + Math.sin(s.t * 8 + p.x) * .08; c.globalAlpha = .35 + Math.sin(s.t * 6) * .15; blob(c, cx, cy, 7, 7, '#FFE27A'); c.globalAlpha = 1; c.drawImage(S.c, cx - 5.5 * pu, cy - 5 * pu, S.w * pu, S.h * pu); star4(cx + 4.5, cy - 4.5, 1.6 + Math.abs(Math.sin(s.t * 7)) * 1.6, '#FFFFFF'); return; }
    c.drawImage(S.c, cx - 5.5, cy - 5, S.w, S.h); const tw = Math.sin(s.t * 5 + p.x * .7); if(tw > .4) star4(cx + 3.6, cy - 3.6, (tw - .4) * 3.2, '#FFFFFF'); });
  // 장애물
  s.obs.forEach(o=>{ const by = GY - o.y - o.h;
    if(hard && enemyH(o, by, s)) return;
    if(o.k === 'bird'){ const S = spr(((s.t * 9) | 0) % 2 ? 'bird1' : 'bird0'); c.drawImage(S.c, o.x - 3, by - 5 + Math.sin(s.t * 6 + o.x / 9), S.w, S.h); return; }
    if(o.k === 'jelly'){ const S = spr('jelly'), q = Math.sin(s.t * 7 + o.x) * .07; c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = .7; c.beginPath(); c.ellipse(o.x + o.w / 2, GY + .5, 6 + q * 20, 1.3, 0, 0, 7); c.stroke();
      c.save(); c.translate(o.x + o.w / 2, by + o.h); c.scale(1 - q, 1 + q); c.drawImage(S.c, -o.w / 2 - 3, -o.h - 3, S.w, S.h); c.restore(); return; }
    const S = spr(o.k); c.drawImage(S.c, o.x - 3, by - 3, S.w, S.h);
    // 물에 닿는 자리 — 하얀 거품 고리가 흔들린다
    const cx = o.x + o.w / 2, ph = s.t * 6 + o.x * .1; blob(c, cx, GY + .4, o.w / 2 + 2.5 + Math.sin(ph) * .6, 1.5, 'rgba(255,255,255,.9)');
    blob(c, o.x - 1.5, GY - 1.2 - Math.abs(Math.sin(ph)) * 1.5, .7, .7, 'rgba(255,255,255,.85)'); });
  if(hard) bossD(s);
  drawMe(s, dt);
  foam(s);
  if(hard) holesH(s);
  if(s.fx.fev > 0 && !s.dead) feverD(s);
  if(mode === 'run' && !s.dead && !window._gameSim) rivalTick(s, dt);
  flagD(s, dt);
  parts(dt);
  // 폭풍 구간 — 비와 어둑함
  if(hard && !s.dead && (s.gw > 0 || s.gust > 0)) gustD(s);
  if(s.zone === 4 && !s.dead){ c.fillStyle = 'rgba(11,30,63,.16)'; c.fillRect(-6, -6, W + 12, H + 12); c.strokeStyle = 'rgba(207,230,255,.45)'; c.lineWidth = .6; c.beginPath();
    for(let i = 0; i < 26; i++){ const rx = (i * 37 + s.t * 120) % (W + 20) - 10, ry = (i * 53 + s.t * 380) % H; c.moveTo(W - rx, ry); c.lineTo(W - rx - 1.6, ry + 6); } c.stroke(); }
  // 점수 팝 — 톡 튀어나와 떠오른다
  s.pops.forEach(p=>{ const life = p.life || .7, a = Math.min(1, (1 - p.t / life) * 2.2), sc = p.t < .12 ? .6 + p.t / .12 * .5 : p.t < .2 ? 1.1 - (p.t - .12) / .08 * .1 : 1;
    c.save(); c.globalAlpha = Math.max(0, a); c.translate(p.x + 2, p.y - p.t * 20); c.scale(sc, sc); txt(p.v, 0, 0, p.big ? 10 : 8, p.v[0] === '+' ? '#FFE27A' : '#FFFFFF', 'left', 900, 2.6); c.restore(); });
  if(mode === 'run' && !s.dead && vis.hint < 2 && !s.pops.length && (vis.hint ? s.air && !s.dj : s.t > .5)) tip(vis.hint ? '👆 공중에서 한 번 더 탭!' : '👆 탭 = 점프 · 꾹 누르면 더 높이', vis.hint ? 70 : GY - 56, s.t);
  banner(dt);
  if(mode === 'run' || mode === 'paused'){ hud(s); misD(s, dt); }       // 배너 띠 위에 — 가려지면 잘린 것처럼 보인다
  if(vis.flash > 0 && !RM){ c.fillStyle = `rgba(255,255,255,${vis.flash * .55})`; c.fillRect(-6, -6, W + 12, H + 12); }
  c.restore();
  const sc = score(); if(sc !== vis.sc){ vis.sc = sc; $g('g-score').textContent = sc; }   // 점수가 바뀔 때만 DOM 을 건드린다
}
/* 🌙 밤바다 — 배경만 어둡게 덮고(장애물·서퍼는 그 위에 그대로 그린다 — 안 보여서 억울한 일은 없게), 보드 앞 랜턴이 물 위를 비춘다 */
let NG = null;
function nightD(s){ const c = ctx, py = GY - s.y - 12, fl = .92 + Math.sin(s.t * 7) * .04 + Math.sin(s.t * 13) * .03;
  c.fillStyle = 'rgba(3,8,26,.42)'; c.fillRect(-6, -6, W + 12, H + 12);
  if(!NG || NG.c !== c){ const g = c.createRadialGradient(0, 0, 2, 0, 0, 62); g.addColorStop(0, 'rgba(255,214,130,.42)'); g.addColorStop(.45, 'rgba(255,190,100,.14)'); g.addColorStop(1, 'rgba(255,190,100,0)'); NG = { c, g }; }
  c.save(); c.globalCompositeOperation = 'lighter'; c.translate(PX + 10, py); c.scale(1.5 * fl, fl); c.fillStyle = NG.g; c.fillRect(-62, -62, 124, 124); c.restore(); }
/* 💨 맞바람 — 예고는 화살표가 깜빡, 바람이 불면 앞에서 흰 줄이 몰아친다(그림만 — 바람 자체는 st.gust) */
function gustD(s){ const c = ctx;
  if(s.gw > 0 && ((s.t * 6) | 0) % 2){ txt('💨 맞바람 온다', W - 8, 58, 8, '#FFFFFF', 'right', 900, 2.4); }
  if(s.gust <= 0) return; const k = Math.min(1, s.gust / .4, (GUST_T - s.gust) / .3 + .2);
  c.save(); c.globalAlpha = .55 * k * (RM ? .5 : 1); c.strokeStyle = '#FFFFFF'; c.lineWidth = .8; c.beginPath();
  for(let i = 0; i < 16; i++){ const y = 24 + (i * 41) % 150, x = W - ((s.t * (300 + (i % 3) * 90) + i * 67) % (W + 50)), l = 10 + (i % 4) * 6; c.moveTo(x, y); c.lineTo(x + l, y - 1); } c.stroke(); c.restore();
  txt('💨', W - 14, 60, 9, '#FFFFFF', 'center', 900); }
/* 피버 — 화면 가장자리가 금빛으로 달아오르고 속도선이 흐른다(선은 고정 개수, 새 객체 없음) */
function feverD(s){ const c = ctx, k = Math.min(1, s.fx.fev / .5), a = RM ? .25 : .5;
  c.save(); c.globalAlpha = .16 * k; c.fillStyle = '#FFB020'; c.fillRect(-6, -6, W + 12, H + 12); c.globalAlpha = a * k; c.strokeStyle = '#FFFFFF'; c.lineWidth = .8; c.beginPath();
  for(let i = 0; i < 14; i++){ const y = 30 + (i * 37) % 130, x = W - ((s.t * (260 + (i % 4) * 60) + i * 53) % (W + 60)), l = 14 + (i % 3) * 8; c.moveTo(x, y); c.lineTo(x + l, y); } c.stroke(); c.restore();
  const bl = .9 + Math.sin(s.t * 14) * .1; c.save(); c.translate(W / 2, 32); c.scale(bl, bl); txt('🔥 피버 ×2', 0, 0, 9, '#FFE27A', 'center', 900, 2.6); c.restore();
  bar(W / 2 - 24, 39, 48, 2.4, s.fx.fev / FEVT, '#FFD36B'); }
/* 미션 — 화면 아래 가운데 작은 띠. 하나 끝나면 초록으로 번쩍하고 다음 미션으로 */
function misD(s, dt){ if(!s.mn || s.dead) return; const c = ctx, v = Math.min(s.mv, Math.max(0, misVal(s, s.mk)));
  if(vis.misK !== s.mi){ vis.misK = s.mi; vis.misT = s.mi ? .6 : 0; }
  vis.misT = Math.max(0, vis.misT - dt);
  if(vis.misV !== v || vis.misK2 !== s.mi){ vis.misV = v; vis.misK2 = s.mi; vis.misL = s.mn + ' ' + v + '/' + s.mv; c.font = `800 6.5px ${FONT}`; vis.misW = Math.max(70, c.measureText(vis.misL).width + 14); }   // 글자가 바뀔 때만 새로 잰다
  const lb = vis.misL, w = vis.misW, x = W / 2 - w / 2, y = H - 19;
  pill(x, y, w, 14, .55); if(vis.misT > 0){ c.globalAlpha = vis.misT / .6; rr(x, y, w, 14, 7); c.fillStyle = '#3FC489'; c.fill(); c.globalAlpha = 1; }
  txt(lb, W / 2, y + 5.6, 6.5, '#FFFFFF', 'center', 800); bar(x + 6, y + 10.2, w - 12, 1.8, v / s.mv, '#9BF0B4'); }
/* 넘을 기록 — 친구 최고·내 최고를 지나치는 순간 깃발이 서고 배너가 뜬다(그림만, 점수엔 영향 없음) */
function rivalTick(s, dt){
  const sc = score(); let hit = null;
  while(vis.riv.length && sc > vis.riv[0].v){ hit = vis.riv.shift(); if(hit.me) break; }
  if(!hit) return;
  vis.fl.on = true; vis.fl.x = PX + 6; vis.fl.me = !!hit.me; vis.fl.nm = hit.me ? '내 최고' : hit.n;
  if(hit.me){ vis.nb = true; vis.ban = { t:0, top:'🎉 신기록!', name:'내 최고 ' + hit.v + '점 돌파', sm:1 }; vis.flash = Math.max(vis.flash, .4); tune([523, 659, 784, 1047, 1319], 80); vib([10, 30, 10, 30]);
    burst(W / 2, 50, 36, ['#FFD36B','#FF8AB8','#7FE3FF','#FFFFFF','#9BF0B4'], 130, 60, 2.1, 1); }
  else { vis.ban = { t:0, top:'🏁 기록 돌파!', name:hit.n + ' ' + hit.v + '점', sm:1 }; tune([659, 880, 1175], 70); burst(PX + 6, GY - 60, 14, ['#FFFFFF','#7FE3FF','#FFD36B'], 80, 30, 1.6, 1); }
}
function flagD(s, dt){ const f = vis.fl; if(!f.on) return; f.x -= (mode === 'run' ? s.speed : 0) * dt; if(f.x < -30){ f.on = false; return; }
  const c = ctx, x = f.x, top = GY - 58, wv = Math.sin(s.t * 10) * 1.5;
  c.strokeStyle = '#E9EEF4'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, GY); c.lineTo(x, top); c.stroke(); blob(c, x, top - 1, 1.6, 1.6, '#FFD36B');
  c.fillStyle = f.me ? '#FFB020' : '#FFFFFF'; c.beginPath(); c.moveTo(x + .6, top); c.quadraticCurveTo(x + 9, top + wv, x + 18, top + 1); c.lineTo(x + 18, top + 11); c.quadraticCurveTo(x + 9, top + 10 + wv, x + .6, top + 10); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = .6; c.stroke();
  if(!f.me){ c.fillStyle = INK; for(let i = 0; i < 3; i++) for(let j = 0; j < 2; j++) if((i + j) % 2 === 0) c.fillRect(x + 1.5 + i * 5.5, top + 1.5 + j * 4.5, 5, 4); }
  txt(f.nm, x + 9, top - 7, 6.5, '#FFFFFF', 'center', 900, 2); }
/* 첫 판 안내 — 처음 뛰기 전까지 서퍼 위에서 톡톡 뛴다(뛰면 사라진다) */
function tip(t, y, tt){ const c = ctx, b = Math.abs(Math.sin(tt * 5)) * 2.5; c.font = `900 7.5px ${FONT}`; const w = c.measureText(t).width + 14;
  rr(W / 2 - w / 2, y - 7 - b, w, 14, 7); c.fillStyle = 'rgba(8,24,46,.72)'; c.fill(); c.strokeStyle = 'rgba(255,226,122,.9)'; c.lineWidth = .8; c.stroke();
  txt(t, W / 2, y - b + .4, 7.5, '#FFFFFF', 'center', 900); }
/* ── 어려움 그림 — 상자·발판·방파제·소용돌이·꽃게·날치·문어·깃발·등대. 몇 개뿐이라 매 프레임 직접 그린다 ── */
const STAR_N = [523, 659, 784, 1047, 784, 659, 587, 740];
const SQC = { jelly:'#C9B6F2', crab:'#FF6B4A', gull:'#FFFFFF', bird:'#FFFFFF', fish:'#4FA8E8' };
function worldH(s, dt){
  const c = ctx;
  s.marks.forEach(m=>lighthouse(m, s));
  s.plat.forEach(platH);
  s.blk.forEach(b=>blkH(b, s));
  vis.grow = Math.max(0, vis.grow - dt);
  // 밟힌 적 — 납작해졌다 사라진다
  vis.sq = vis.sq.filter(q=>(q.t += dt) < .4);
  vis.sq.forEach(q=>{ q.x -= s.speed * dt; c.save(); c.globalAlpha = 1 - q.t / .4; c.translate(q.x + q.w / 2, q.y); c.scale(1.4, .3); blob(c, 0, -q.h / 2, q.w / 2 + 1, q.h / 2 + 1, SQC[q.k] || '#FFFFFF'); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke(); c.restore(); });
  // 상자에서 튀어나온 것 — 솟아올랐다 사라진다
  vis.rise = vis.rise.filter(r=>(r.t += dt) < .7);
  vis.rise.forEach(r=>{ const e = Math.min(1, r.t / .25); r.x -= s.speed * dt; c.globalAlpha = r.t > .45 ? (.7 - r.t) / .25 : 1; c.font = `${9 + e * 3}px ${EMO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(r.ic, r.x, r.y - 4 - e * 14); });
  c.globalAlpha = 1;
  // 별 — 무적 동안 짧은 멜로디(소리 켰을 때만)
  if(s.fx.star > 0 && mode === 'run'){ vis.mus -= dt; if(vis.mus <= 0){ vis.mus = .13; beep(STAR_N[vis.mi++ % STAR_N.length], 0, .1, 'square', .022); } }
}
function bakeBlk(used){ const S = mk(14, 14), x = S.x; x.translate(1, 1);
  const P = new Path2D(); P.roundRect ? P.roundRect(0, 0, 12, 12, 2.4) : P.rect(0, 0, 12, 12);
  x.fillStyle = used ? lg(x, 0, 0, 0, 12, '#C9A27A', '#9A7350') : lg(x, 0, 0, 0, 12, '#FFE48A', '#F0A23A'); x.fill(P); x.strokeStyle = INK; x.lineWidth = .9; x.stroke(P);
  x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(2.4, 1.5, 7.2, 1.1);
  for(const [dx, dy] of [[2.3, 2.3], [9.7, 2.3], [2.3, 9.7], [9.7, 9.7]]) blob(x, dx, dy, .6, .6, 'rgba(58,48,64,.5)');
  return S; }
function blkH(b, s){
  const c = ctx, bo = b.bump > 0 ? Math.sin(b.bump / .18 * Math.PI) * 3 : 0, x = b.x, y = GY - b.y - b.h - bo;
  const S = SPR[b.used ? 'blk1' : 'blk0'] || (SPR[b.used ? 'blk1' : 'blk0'] = bakeBlk(b.used)); c.drawImage(S.c, x - 1, y - 1, S.w, S.h);
  if(!b.used){ c.globalAlpha = .8 + Math.sin(s.t * 6 + b.x * .1) * .2; txt('?', x + b.w / 2, y + b.h / 2 + .6, 9, '#FFFFFF', 'center', 900, 1.8); c.globalAlpha = 1; }
}
/* 방파제·나무 발판은 폭마다 한 번 구워 둔다(매 프레임 그라디언트·패스를 새로 만들지 않게) */
function bakePlat(k, w, h){ const S = mk(w + 2, h + 2), c = S.x; c.translate(1, 1);
  if(k === 'wall'){ const P = new Path2D(); P.rect(0, 0, w, h);
    c.fillStyle = lg(c, 0, 0, 0, h, '#DCE1E8', '#8D96A3'); c.fill(P);
    inside(c, P, ()=>{ c.strokeStyle = 'rgba(58,48,64,.22)'; c.lineWidth = .6; c.beginPath(); for(let xx = 13; xx < w; xx += 14){ c.moveTo(xx, 2); c.lineTo(xx, h); } c.moveTo(0, 6); c.lineTo(w, 6); c.stroke(); });
    outl(c, P); c.fillStyle = '#F4F6F9'; c.fillRect(1, .7, w - 2, 1.4); return S; }
  const P = new Path2D(); P.moveTo(3, 0); P.lineTo(w - 3, 0); P.quadraticCurveTo(w, 0, w, 3); P.quadraticCurveTo(w, 6, w - 3, 6);
  P.lineTo(3, 6); P.quadraticCurveTo(0, 6, 0, 3); P.quadraticCurveTo(0, 0, 3, 0);
  c.fillStyle = lg(c, 0, 0, 0, 6, '#D29A62', '#8A5A32'); c.fill(P);
  inside(c, P, ()=>{ c.strokeStyle = 'rgba(90,50,20,.45)'; c.lineWidth = .5; c.beginPath(); c.moveTo(5, 2.4); c.lineTo(w * .55, 2.4); c.moveTo(w * .4, 4); c.lineTo(w - 6, 4); c.stroke(); c.fillStyle = 'rgba(255,240,210,.35)'; c.fillRect(0, .5, w, 1); });
  outl(c, P); blob(c, w - 3.2, 3, 1.4, 1.9, '#B5834F'); c.strokeStyle = INK; c.lineWidth = .5; c.stroke();
  return S; }
function platH(p){
  const c = ctx, y = GY - p.y;
  if(p.k === 'wall'){   // 방파제 — 물에서 솟은 콘크리트, 위는 걸을 수 있다
    const key = 'pw' + p.w + '_' + p.y, S = SPR[key] || (SPR[key] = bakePlat('wall', p.w, p.y + 4)); c.drawImage(S.c, p.x - 1, y - 1, S.w, S.h);
    blob(c, p.x + p.w / 2, GY + .6, p.w / 2 + 3, 1.6, 'rgba(255,255,255,.85)'); return; }
  if(p.k === 'buoy'){   // 부표 — 소용돌이 위 디딤돌
    c.strokeStyle = 'rgba(58,48,64,.5)'; c.lineWidth = .6; c.beginPath(); c.moveTo(p.x + p.w / 2, y + 5); c.lineTo(p.x + p.w / 2, GY + 2); c.stroke();
    const P = new Path2D(); P.ellipse(p.x + p.w / 2, y + 3, p.w / 2, 3.4, 0, 0, 7);
    c.fillStyle = '#FF5A5A'; c.fill(P); inside(c, P, ()=>{ c.fillStyle = '#FFFFFF'; c.fillRect(p.x + p.w / 2 - 2.5, y - 2, 5, 12); }); outl(c, P); return; }
  // 떠다니는 나무 발판 — 결과 옹이
  const key = 'pd' + p.w, S = SPR[key] || (SPR[key] = bakePlat('wood', p.w, 6)); c.drawImage(S.c, p.x - 1, y - 1, S.w, S.h);
  blob(c, p.x + p.w / 2, GY + .8, p.w / 2 - 4, 1.2, 'rgba(10,30,60,.18)');
}
function holesH(s){ const c = ctx;   // 소용돌이 — 수면 위 어두운 구멍, 흰 물결이 돈다
  s.hole.forEach(h=>{ const cx = h.x + h.w / 2, rx = h.w / 2 + 1, g = c.createRadialGradient(cx, GY + 1.5, 1, cx, GY + 1.5, rx);
    g.addColorStop(0, 'rgba(6,20,45,.97)'); g.addColorStop(.7, 'rgba(20,70,130,.88)'); g.addColorStop(1, 'rgba(60,140,210,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(cx, GY + 1.5, rx, 5, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = .8; for(let i = 0; i < 3; i++){ const r = 1 - i * .28, a0 = s.t * (5 + i) + i * 2; c.beginPath(); c.ellipse(cx, GY + 1.5, rx * r, 4.2 * r, 0, a0, a0 + 3.6); c.stroke(); } }); }
function lighthouse(m, s){ const c = ctx, x = m.x, tx = x + 18;
  blob(c, tx + 7, GY + 1.5, 20, 5, '#5E6B7A');                                  // 바위섬
  const P = new Path2D(); P.moveTo(tx, GY); P.lineTo(tx + 3, GY - 62); P.lineTo(tx + 11, GY - 62); P.lineTo(tx + 14, GY); P.closePath();
  c.fillStyle = '#FFFFFF'; c.fill(P); inside(c, P, ()=>{ c.fillStyle = '#E8475A'; for(let i = 0; i < 4; i++) c.fillRect(tx - 2, GY - 14 - i * 15, 20, 7); }); outl(c, P, .9);
  const gl = .55 + Math.sin(s.t * 4) * .25, g = c.createRadialGradient(tx + 7, GY - 67, 1, tx + 7, GY - 67, 18); g.addColorStop(0, `rgba(255,236,150,${gl})`); g.addColorStop(1, 'rgba(255,236,150,0)'); c.fillStyle = g; c.fillRect(tx - 12, GY - 86, 38, 38);
  rr(tx + 1.5, GY - 72, 11, 10, 2); c.fillStyle = '#FFE27A'; c.fill(); c.strokeStyle = INK; c.lineWidth = .8; c.stroke();
  const R = new Path2D(); R.moveTo(tx, GY - 72); R.lineTo(tx + 7, GY - 79); R.lineTo(tx + 14, GY - 72); R.closePath(); c.fillStyle = '#E8475A'; c.fill(R); outl(c, R, .8);
  // 깃대 — 지나가는 순간 깃발이 내려온다(멈추지 않는다). 위엔 몇 m 째인지
  c.strokeStyle = '#E9EEF4'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, GY); c.lineTo(x, GY - 60); c.stroke(); blob(c, x, GY - 61, 1.8, 1.8, '#FFD36B');
  if(m.m) txt(m.m + 'm', tx + 7, GY - 88, 7, '#FFE27A', 'center', 900, 2);
  const fy = m.hit ? Math.min(44, (m.ht || 0) * 70) : 0;
  const F = new Path2D(); F.moveTo(x - .5, GY - 58 + fy); F.lineTo(x - 14, GY - 54 + fy); F.lineTo(x - .5, GY - 50 + fy); F.closePath(); c.fillStyle = '#3FC489'; c.fill(F); outl(c, F, .7);
}
function enemyH(o, by, s){
  const c = ctx;
  if(o.k === 'gull'){ const S = spr(((s.t * 9) | 0) % 2 ? 'bird1' : 'bird0'); c.drawImage(S.c, o.x - 3, by - 5, S.w, S.h); return true; }
  if(o.k === 'crab'){ const cx = o.x + 6, cy = by + 4.5, wk = Math.sin(s.t * 16 + o.x) * .9;
    c.strokeStyle = INK; c.lineWidth = .7; c.beginPath(); for(const d of [-1, 1]) for(let i = 0; i < 3; i++){ const lx = cx + d * (2 + i * 1.6); c.moveTo(lx, cy + 1); c.lineTo(lx + d * 1.6, cy + 4 + (i % 2 ? wk : -wk)); } c.stroke();
    for(const d of [-1, 1]){ c.beginPath(); c.moveTo(cx + d * 4, cy - 1); c.lineTo(cx + d * 6.5, cy - 4 + wk * d); c.stroke(); blob(c, cx + d * 7, cy - 5 + wk * d, 2.3, 2, '#FF6B4A'); c.stroke(); }
    const P = new Path2D(); P.ellipse(cx, cy, 6, 4, 0, 0, 7); c.fillStyle = lg(c, 0, cy - 4, 0, cy + 4, '#FF8F6B', '#E0475A'); c.fill(P); outl(c, P, .8);
    for(const d of [-1, 1]){ c.beginPath(); c.moveTo(cx + d * 2, cy - 3); c.lineTo(cx + d * 2.4, cy - 6); c.stroke(); blob(c, cx + d * 2.4, cy - 6.6, 1.5, 1.5, '#FFFFFF'); c.stroke(); blob(c, cx + d * 2.4 - .4, cy - 6.6, .6, .6, INK); }
    return true; }
  if(o.k === 'fish'){ if(o.y < -3) return true; const cx = o.x + 6, cy = by + 3.5, f = o.ft % 1.7, a = Math.cos(f * Math.PI) * .7, fl = Math.sin(s.t * 30) * 1.5;
    c.save(); c.translate(cx, cy); c.rotate(a); c.strokeStyle = INK; c.lineWidth = .6;
    c.fillStyle = '#BFE6FF'; c.beginPath(); c.moveTo(-1, -1); c.lineTo(3, -6 - fl); c.lineTo(5, -1); c.closePath(); c.fill(); c.stroke();          // 날개 지느러미
    const P = new Path2D(); P.ellipse(0, 0, 6, 3, 0, 0, 7); c.fillStyle = lg(c, 0, -3, 0, 3, '#5FB4F0', '#E3F6FF'); c.fill(P); outl(c, P, .7);
    c.fillStyle = '#4FA8E8'; c.beginPath(); c.moveTo(5, 0); c.lineTo(9, -3); c.lineTo(9, 3); c.closePath(); c.fill(); c.stroke();
    blob(c, -3.4, -.6, .8, .8, INK); c.restore(); return true; }
  if(o.k === 'barrel'){ const cx = o.x + 6, cy = by + 5.5, a = -(s.t * 9 + o.x * .2);   // 드럼통 — 굴러온다(옆으로 누운 통, 띠가 돈다)
    blob(c, cx, GY + .6, 8, 1.5, 'rgba(255,255,255,.85)'); c.save(); c.translate(cx, cy); c.rotate(a);
    const P = new Path2D(); P.ellipse(0, 0, 6, 5.5, 0, 0, 7); c.fillStyle = lg(c, 0, -6, 0, 6, '#FF9A4A', '#B8481E'); c.fill(P); outl(c, P, .8);
    c.strokeStyle = 'rgba(58,48,64,.75)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(-6, -1.5); c.lineTo(6, -1.5); c.moveTo(-6, 2); c.lineTo(6, 2); c.stroke(); blob(c, -2, -3.4, 1.4, .8, 'rgba(255,255,255,.5)'); c.restore(); return true; }
  if(o.k === 'squid'){ const cx = o.x + 5, cy = by + 4, wv = Math.sin(s.t * 10 + o.x) * 1.2;   // 야광 오징어 — 스스로 빛나서 밤에도 보인다
    const g = c.createRadialGradient(cx, cy, 1, cx, cy, 12); g.addColorStop(0, 'rgba(140,255,230,.55)'); g.addColorStop(1, 'rgba(140,255,230,0)'); c.fillStyle = g; c.fillRect(cx - 12, cy - 12, 24, 24);
    c.strokeStyle = '#7FF0D8'; c.lineWidth = .9; c.beginPath(); for(let i = 0; i < 4; i++){ const tx = cx - 3 + i * 2; c.moveTo(tx, cy + 3); c.quadraticCurveTo(tx + wv, cy + 7, tx - wv * .5, cy + 10); } c.stroke();
    const P = new Path2D(); P.moveTo(cx, cy - 7); P.quadraticCurveTo(cx + 6, cy - 1, cx + 4, cy + 4); P.lineTo(cx - 4, cy + 4); P.quadraticCurveTo(cx - 6, cy - 1, cx, cy - 7); P.closePath();
    c.fillStyle = lg(c, 0, cy - 7, 0, cy + 4, '#E9FFF8', '#5FE3C8'); c.fill(P); outl(c, P, .7); blob(c, cx - 1.8, cy, .7, .8, INK); blob(c, cx + 1.8, cy, .7, .8, INK); return true; }
  if(o.k === 'bub'){ const cx = o.x + 4, cy = by + 4; blob(c, cx, cy, 4.4, 4.2, 'rgba(210,240,255,.8)'); c.strokeStyle = '#4FA8E8'; c.lineWidth = .8; c.stroke(); blob(c, cx - 1.5, cy - 1.6, 1.3, 1.1, '#FFFFFF'); return true; }
  if(o.k === 'ink'){ const cx = o.x + 4, cy = by + 4; blob(c, cx, cy, 4.2, 4, '#3A2450'); c.strokeStyle = INK; c.lineWidth = .7; c.stroke(); blob(c, cx - 1.4, cy - 1.4, 1.1, 1.1, 'rgba(255,255,255,.55)'); blob(c, cx + 5, cy + 1, 1.2, 1.2, 'rgba(58,36,80,.6)'); return true; }
  return false;
}
function bossD(s){ const b = s.boss; if(!b) return; if(b.kind === 'crab') return crabD(s, b);
  const c = ctx, cx = b.x + 15, base = GY - b.y, cy = base - 16, fl = b.hurt > 0 && ((s.t * 20) | 0) % 2;
  c.save(); if(b.ph === 'die') c.globalAlpha = Math.max(0, 1 - b.t / 1.3);
  c.lineCap = 'round';
  for(let i = 0; i < 6; i++){ const x0 = cx - 11 + i * 4.4, w = Math.sin(s.t * 7 + i) * 3;      // 다리 — 물결처럼 흔들린다
    for(const [col, lw] of [[INK, 4.4], [fl ? '#FFFFFF' : '#C7406A', 3]]){ c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(x0, cy + 6); c.quadraticCurveTo(x0 + w, cy + 13, x0 - w * .6, base + 1); c.stroke(); } }
  const P = new Path2D(); P.ellipse(cx, cy, 14, 13, 0, 0, 7); c.fillStyle = fl ? '#FFFFFF' : lg(c, 0, cy - 13, 0, cy + 13, '#FF7A9C', '#C7406A'); c.fill(P); outl(c, P, 1);
  blob(c, cx + 6, cy - 7, 2.2, 1.6, 'rgba(255,255,255,.4)'); blob(c, cx - 7, cy - 4, 1.4, 1.1, 'rgba(255,255,255,.3)'); blob(c, cx + 9, cy, 1.2, 1, 'rgba(120,20,60,.35)');
  for(const ex of [-6, 2]){ blob(c, cx + ex, cy + 1, 3.4, 3.6, '#FFFFFF'); c.strokeStyle = INK; c.lineWidth = .7; c.stroke(); blob(c, cx + ex - 1.2, cy + 1.6, 1.6, 1.8, INK); }   // 서퍼를 노려본다
  c.strokeStyle = INK; c.lineWidth = 1.1; c.beginPath(); c.moveTo(cx - 9.5, cy - 4.5); c.lineTo(cx - 3, cy - 2.4); c.moveTo(cx + 5.5, cy - 4.5); c.lineTo(cx - .5, cy - 2.4); c.stroke();
  c.restore(); }
/* 🦀 거대 꽃게 — 넓적한 등껍질 위가 밟는 자리. 집게를 딸깍이며 노려본다 */
function crabD(s, b){ const c = ctx, cx = b.x + 15, base = GY - b.y, cy = base - 11, fl = b.hurt > 0 && ((s.t * 20) | 0) % 2, sn = Math.sin(s.t * 9) * 2;
  c.save(); if(b.ph === 'die') c.globalAlpha = Math.max(0, 1 - b.t / 1.3);
  c.strokeStyle = INK; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath();
  for(const d of [-1, 1]) for(let i = 0; i < 3; i++){ const lx = cx + d * (6 + i * 4); c.moveTo(lx, cy + 4); c.lineTo(lx + d * 4, base + (i % 2 ? sn * .5 : -sn * .5)); } c.stroke();
  for(const d of [-1, 1]){ c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(cx + d * 11, cy - 2); c.lineTo(cx + d * 15, cy - 9); c.stroke();
    const P = new Path2D(); P.ellipse(cx + d * 16, cy - 13 + (d < 0 ? sn : -sn) * .5, 5, 4, d * .5, 0, 7); c.fillStyle = fl ? '#FFFFFF' : '#FF6B4A'; c.fill(P); outl(c, P, .9);
    c.strokeStyle = INK; c.lineWidth = .9; c.beginPath(); c.moveTo(cx + d * 16, cy - 13); c.lineTo(cx + d * 20, cy - 14 - Math.abs(sn)); c.stroke(); }
  const P = new Path2D(); P.ellipse(cx, cy, 15, 10, 0, 0, 7); c.fillStyle = fl ? '#FFFFFF' : lg(c, 0, cy - 10, 0, cy + 10, '#FF9A6B', '#D8403A'); c.fill(P); outl(c, P, 1);
  blob(c, cx - 5, cy - 5, 4, 1.6, 'rgba(255,255,255,.45)'); for(const dx of [-7, 0, 7]) blob(c, cx + dx, cy + 1, 1.2, 1, 'rgba(120,20,30,.35)');
  for(const ex of [-4, 4]){ c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(cx + ex, cy - 8); c.lineTo(cx + ex, cy - 13); c.stroke(); blob(c, cx + ex, cy - 14, 2.4, 2.4, '#FFFFFF'); c.stroke(); blob(c, cx + ex - .8, cy - 14, 1.1, 1.2, INK); }
  c.restore(); }
function bossBar(s){ const b = s.boss, n = b.mx, sp = n > 4 ? 9 : 13, pw = 18 + n * sp, x0 = W / 2 - pw / 2; pill(x0, 42, pw, 12); c_txt(b.kind === 'crab' ? '🦀' : '🐙', x0 + 7, 48.2);   // 왼쪽 진행 막대와 겹치지 않게 한 줄 아래
  for(let i = 0; i < n; i++){ rr(x0 + 15 + i * sp, 45, sp - 2, 6, 3); ctx.fillStyle = i < b.hp ? '#FF5A78' : 'rgba(255,255,255,.25)'; ctx.fill(); } }
function c_txt(t, x, y){ const c = ctx; c.font = `7px ${EMO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, x, y); }
const SEA_L = [[118, .8, 12, 160, 'far', .3], [133, 1.4, 16, 70, 'mid', .55], [149, 2, 20, 38, 'near', .82]], SEA_W = [[184, .9, 1.4], [199, 1.1, 1.8], [213, 1.3, 2.2]];
/* 바다 — 먼 너울부터 발밑까지 겹겹이. 가까운 줄일수록 달린 거리에 빨리 반응해 속도감을 만든다 */
function sea(s, bgOk){
  const c = ctx, d = s.dist;
  for(const [y, a, l, dv, ck, ba] of SEA_L){ const ph = d / dv + (dv === 160 ? s.t * .3 : 0), al = bgOk ? ba : 1;
    c.globalAlpha = al; c.fillStyle = TH[ck]; wave(y, a, l, ph, true); c.fill(); c.globalAlpha = al * .45; c.strokeStyle = '#FFFFFF'; c.lineWidth = .7; wave(y, a, l, ph, false); c.stroke(); }
  c.globalAlpha = 1; c.strokeStyle = '#FFFFFF'; c.lineWidth = .7; c.lineCap = 'round';
  GLINT.forEach((g, i)=>{ const k = .12 + (g.y - 118) / 160, x = ((g.x - d * k) % W + W) % W; c.globalAlpha = Math.max(0, .15 + .4 * Math.sin(s.t * 3 + i * 1.3)); c.beginPath(); c.moveTo(x, g.y); c.lineTo(x + g.l, g.y); c.stroke(); });
  c.globalAlpha = 1;
  c.fillStyle = gr().g2; wave(GY - .5, .7, 9, d / 9, true); c.fill();
  for(let i = 0; i < 3; i++){ const [y, k, lw] = SEA_W[i];
    const len = 14 + i * 5, gap = 22 + i * 6, off = (d * k) % (len + gap); c.strokeStyle = TH.w[3 + i]; c.lineWidth = lw; c.globalAlpha = .75; c.beginPath();
    for(let x = -off - len; x < W + len; x += len + gap){ const yy = y + Math.sin((x + d * k) / 13) * 1.2; c.moveTo(x, yy); c.quadraticCurveTo(x + len / 2, yy - 1.6, x + len, yy); } c.stroke(); }
  c.globalAlpha = 1;
}
/* 수면선 거품 — 서퍼·장애물 위에 덮어 '물에 잠긴' 느낌을 준다 */
function foam(s){ const c = ctx, d = s.dist; c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 1.2; wave(GY - .2, .7, 9, d / 9, false); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.8)'; const off = d % 9; for(let x = -off; x < W + 9; x += 9){ const n = Math.round((x + d) / 9), r = .5 + (((n * 7) % 3) + 3) % 3 * .3; c.beginPath(); c.arc(x, GY + 1.8 + (n & 1), r, 0, 7); c.fill(); } }
/* 서퍼 — 보드와 모찌를 따로 그려 점프엔 기울기·늘어남, 착지엔 찌그러짐, 넘어지면 보드가 튕겨 나간다 */
function drawMe(s, dt){
  const c = ctx, B = spr('bd_' + boardOf().k), Rd = RIDER || spr('blob'), ride = !s.air && !s.dead;
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
  const bs = !hard ? 1 : vis.grow > 0 ? (((vis.grow * 22) | 0) % 2 ? 1.22 : 1) : s.big ? 1.22 : 1; if(bs !== 1) c.scale(bs, bs);   // 큰 파도 보드 — 커질 땐 깜빡이며
  c.rotate(s.air ? Math.max(-.32, Math.min(.32, -s.vy / 1000)) : Math.sin(s.t * 4.5) * .035);
  const sq = vis.lt > 0 ? Math.sin(vis.lt / .15 * Math.PI) * .2 : 0, sr = vis.jt > 0 ? Math.sin(vis.jt / .16 * Math.PI) * .16 : 0;
  if(s.invuln > 0 && ((s.t * 20) | 0) % 2) c.globalAlpha = .45;                  // 무적 중엔 깜빡인다
  c.drawImage(B.c, -B.w / 2, -6, B.w, B.h);
  c.save(); c.translate(-1, -4); c.scale(1 + sq - sr * .6, 1 - sq + sr); c.rotate(ride ? .05 : -.1); c.drawImage(Rd.c, -Rd.w / 2, -Rd.h, Rd.w, Rd.h); c.restore();
  c.globalAlpha = 1;
  if(s.fx.star > 0){ c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `hsl(${(s.t * 360) % 360},100%,70%)`; c.lineWidth = 1.8; c.globalAlpha = .8; c.beginPath(); c.arc(0, -13, 16, 0, 7); c.stroke(); c.restore();
    if(Math.random() < .3) part(PX + (Math.random() - .5) * 26, by - 13 + (Math.random() - .5) * 26, 0, -10, .5, 1.6, '#FFE27A', 0, 1);
    if(hard) for(let i = 0; i < (RM ? 1 : 2); i++) part(PX - 8, by - 6 - Math.random() * 14, -(s.speed * .5 + 30), (Math.random() - .5) * 16, .45, 2.2, `hsl(${(s.t * 420 + i * 70) % 360},100%,66%)`, 0, 1); }   // 무지개 꼬리
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
  if(hard){ pill(4, y, 64, 13); heart(11.5, y + 7, 8, true); txt('×' + s.lives + '  🐚' + s.shells, 17, y + 6.8, 7, '#FFFFFF', 'left', 800); }
  else { pill(4, y, 36, 13); txt('🐚 ' + s.shells, 9, y + 6.8, 7.5, '#FFFFFF', 'left', 800); }
  y += 16;
  let lab, pr, gold = false;
  if(hard){ pr = s.boss ? 1 - s.boss.hp / s.boss.mx : (s.sd % MILE) / MILE; lab = `${s.boss ? (s.boss.kind === 'crab' ? '🦀 거대 꽃게' : '🐙 거대 문어') : ZONES[s.zone - 1][1]} · ${meters(s)}m`; }   // 막대 = 다음 등대까지
  else { const nx = vis.riv[0];                                     // 다음에 넘을 기록 — 친구 최고 또는 내 최고
    if(nx){ pr = score() / nx.v; lab = nx.me ? `내 최고 ${nx.v}까지` : `🏁 ${nx.n} ${nx.v}까지`; }
    else { gold = vis.nb || (vis.best > 0 && score() > vis.best); pr = gold ? 1 : 0; lab = gold ? '🎉 신기록 달리는 중' : vis.best > 0 ? `최고 ${vis.best}까지` : '첫 기록 도전 중'; } }
  c.font = `800 6.5px ${FONT}`; const pw = Math.max(64, c.measureText(lab).width + 12);
  pill(4, y, pw, 16); txt(lab, 9, y + 5.8, 6.5, '#FFFFFF', 'left', 800); bar(9, y + 10.6, pw - 10, 2.4, pr, gold ? '#FFD36B' : '#7FE3FF');
  y += 19;
  if(s.combo >= 3){ const k = 1 + vis.comboT * .7, cm = comboM(s.combo), lb = '🔥 연속 ' + s.combo + (cm > 1 ? ' ×' + cm : ''); c.save(); c.translate(4, y); c.scale(k, k); pill(0, 0, cm > 1 ? 58 : 46, 13, .55); txt(lb, 5, 6.8, 7, cm >= 3 ? '#FF9B6B' : '#FFD36B', 'left', 900); c.restore(); y += 16; }
  let x = 10.5;
  const ring = (ic, v)=>{ blob(c, x, y + 6.5, 6.3, 6.3, 'rgba(8,24,46,.5)'); if(v < 1){ c.strokeStyle = '#FFD36B'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y + 6.5, 5.6, -Math.PI / 2, -Math.PI / 2 + v * Math.PI * 2); c.stroke(); }
    c.font = `6.4px ${EMO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ic, x, y + 6.9); x += 15; };
  if(s.fx.star > 0) ring('⭐', s.fx.star / (hard ? 6 : 5)); if(s.fx.magnet > 0) ring('🧲', s.fx.magnet / (8 + 2 * (UP.mag || 0))); if(s.fx.slow > 0) ring('🐢', s.fx.slow / 5);
  if(s.shield) ring('🛟', 1);
  if(hard && s.big) ring('🏄', 1);
  if(hard && s.boss) bossBar(s);
}
/* 배너 — 위아래 검은 띠가 내려오고 마을 이름이 가운데로 미끄러져 들어온다(영화 자막처럼) */
function banner(dt){
  const b = vis.ban; if(!b) return; b.t += dt; const T = 2.3; if(b.t > T){ vis.ban = null; return; }
  const c = ctx, e0 = b.t < .35 ? b.t / .35 : b.t > T - .4 ? 1 - (b.t - (T - .4)) / .4 : 1, e = 1 - (1 - e0) * (1 - e0), bh = 17 * e;
  if(b.sm){ c.globalAlpha = e; rr(W / 2 - 62, 62, 124, 30, 8); c.fillStyle = 'rgba(5,12,24,.62)'; c.fill();   // 작은 배너 — 등대·격파. 달리는 화면을 가리지 않게
    txt(b.top, W / 2, 71.5, 7, '#FFD36B', 'center', 900); txt(b.name, W / 2 + (1 - e) * 14, 83, 10, '#FFFFFF', 'center', 900, 2.4); c.globalAlpha = 1; return; }
  c.fillStyle = 'rgba(5,12,24,.85)'; c.fillRect(-6, -6, W + 12, bh + 6); c.fillRect(-6, H - bh, W + 12, bh + 6);
  const y = 86, g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(5,12,24,0)'); g.addColorStop(.5, 'rgba(5,12,24,.55)'); g.addColorStop(1, 'rgba(5,12,24,0)');
  c.globalAlpha = e; c.fillStyle = g; c.fillRect(0, y - 18, W, 34);
  txt(b.top, W / 2 - (1 - e) * 16, y - 8, 7, '#FFD36B', 'center', 900);
  txt(b.name, W / 2 + (1 - e) * 22, y + 4.5, 16, '#FFFFFF', 'center', 900, 3);
  const lw = 64 * e; c.fillStyle = '#FFD36B'; c.fillRect(W / 2 - lw / 2, y + 14, lw, 1);
  c.globalAlpha = 1;
}

/* 멀리 보이는 풍경 — 어려움은 500m(등대)마다 마을이 바뀐다(천천히 겹쳐 넘어간다) */
/* 구간·시간대 → 풍경. 쉬움은 날짜마다 마을이 바뀐다(매일 같은 바다면 질린다) */
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
      <div class="jp-logo">${meUrl ? `<img src="${meUrl}" alt="" style="width:54px;height:60px">` : ''}<div><div class="go-t">파도 점프</div><small>탭하면 점프 · 길게 누르면 더 높이</small></div></div>
      <div class="go-mode" role="group" aria-label="난이도"><button type="button" data-jm="easy" aria-pressed="${!hard}">🙂 쉬움</button><button type="button" data-jm="hard" aria-pressed="${hard}">🔥 어려움</button></div>
      <div class="go-d" style="word-break:keep-all">${hard ? '❤️×3 · 🏮 500m 등대마다 ❤️ 회복 · 🐙 보스<br>적은 <b>밟고</b> · <b>?</b>는 <b>머리로 쿵</b> · 공중에서 <b>한 번 더</b> 점프' : '바위·상어·해파리를 넘고 🐚 조개를 모아요<br>조개 5개마다 🛟 구명튜브 하나'}</div>
      <div class="jp-best"><span class="${hard ? '' : 'on'}"><small>🙂 쉬움 최고</small><b>${p.best || 0}</b></span><span class="${hard ? 'on' : ''}"><small>🔥 어려움 최고</small><b>${p.hbest || 0}</b></span></div>
      ${top.length && top[0].id !== ME.id ? `<div class="go-b">🏆 ${hard ? '어려움' : '쉬움'} 1위 ${esc(top[0].name)} <b>${top[0].best}</b>점</div>` : ''}
      <button class="btn blue jp-wide" id="g-free" type="button">▶ ${hard ? '어려움' : '쉬움'} 시작</button>
      ${(p.gn && Object.keys(p.gn).length) || achN() ? `<button class="btn ghost jp-wide" id="g-ach" type="button" style="margin-top:6px">🏄 ${esc(boardOf().n)} · 🏅 업적 ${achN()}/${ACH.length}</button>` : ''}
      <button class="jp-daily" id="g-go" type="button"><i>📅</i><span><b>오늘의 챌린지</b><small>쉬움 · 모두 같은 코스로 겨뤄요</small></span><em><small>내 기록</small><b>${dsc != null ? dsc : '—'}</b></em></button></div>`;
  $g('g-go').onclick = ()=>begin(true); $g('g-free').onclick = ()=>begin(false);
  if($g('g-ach')) $g('g-ach').onclick = achCard;
  $g('g-ov').querySelectorAll('[data-jm]').forEach(b=>b.onclick = ()=>{ hard = b.dataset.jm === 'hard'; try{ localStorage.setItem('lineup.share.jmode', hard ? 'hard' : 'easy'); }catch(e){} showStart(); });
}
/* 🏄 보드 고르기 + 🏅 업적 목록 — 한 화면. 잠긴 보드는 여는 조건을 한 줄로 */
function achCard(){
  const g = achGot(), cur = boardOf();
  $g('g-ov').hidden = false;
  $g('g-ov').innerHTML = `<div class="go-card" style="text-align:left;max-height:86%;overflow:auto">
      <div class="go-t" style="text-align:center">🏄 내 보드</div>
      <div class="go-d" style="text-align:center;font-size:12px;margin-bottom:6px">보드마다 작은 특기 — 오늘의 챌린지에선 모두 기본 보드 규칙</div>
      ${BOARDS.map(b=>{ const on = boardOpen(b); return `<button type="button" class="sk-dr" data-bd="${b.k}" ${on ? '' : 'disabled'} aria-pressed="${b === cur}" style="${b === cur ? 'outline:2px solid #3FA9F5;' : ''}${on ? '' : 'opacity:.55'}"><i style="background:linear-gradient(90deg,${b.c[0]},${b.c[1]});border-radius:8px;width:30px;height:12px;display:inline-block"></i><span><b>${esc(b.n)}${b === cur ? ' ✓' : ''}</b><small>${on ? esc(b.perk) : '🔒 ' + esc(b.lock[2]) + '이면 열려요'}</small></span></button>`; }).join('')}
      <div class="go-t" style="text-align:center;margin-top:10px">🏅 업적 ${achN()}/${ACH.length}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0 10px">${ACH.map(a=>`<div style="padding:6px 8px;border-radius:10px;background:${g[a[0]] ? 'rgba(255,211,107,.2)' : 'rgba(127,127,127,.12)'};font-size:12px;line-height:1.3"><b>${g[a[0]] ? a[1] : '🔒'} ${esc(a[2])}</b><br><small style="opacity:.8">${esc(a[3])} · 🐚${a[4]}</small></div>`).join('')}</div>
      <button class="btn blue jp-wide" id="g-achb" type="button">돌아가기</button></div>`;
  $g('g-ov').querySelectorAll('[data-bd]').forEach(b=>b.onclick = ()=>{ const x = BOARDS.find(q=>q.k === b.dataset.bd); if(!x || !boardOpen(x)) return; boardK = x.k; try{ localStorage.setItem('lineup.share.jboard', x.k); }catch(e){} achCard(); });
  $g('g-achb').onclick = showStart;
}
let hardPref = null, runId = 0;
function begin(isDaily){
  daily = isDaily === true; runId++;
  const ae = document.activeElement; if(ae && ae.blur && $g('game').contains(ae)) ae.blur();   // 소리 버튼 포커스 고리가 달리는 내내 남지 않게
  if(daily){ hardPref = hard; hard = false; } else if(hardPref != null){ hard = hardPref; hardPref = null; }   // 챌린지는 쉬움으로, 끝나면 고른 모드로
  loadMe(); reset(); UP = (!daily && !window._gameSim && typeof upFor === 'function') ? upFor('jump') : {};
  if(UP.shield) st.shield = 1; if(UP.item) st.nextItem = hard ? 300 : 600;      // 쉬움은 원래 아이템이 없다 — 강화하면 나온다
  TH = hard ? THEMES[ZONES[0][2]] : themeNow(); mode = 'run'; window._gameRun = true; $g('g-ov').hidden = true; last = 0; held = false; acc = 0;
  const p = (typeof ME !== 'undefined' && ME && ME.profile && ME.profile.play) || {};
  vis.best = (daily ? (p.dbest && p.dbest.day === today() ? p.dbest.score : 0) : hard ? p.hbest : p.best) || 0;
  vis.ban = { t:0, top:hard ? '🔥 끝없는 바다' : daily ? '📅 오늘의 챌린지' : '오늘의 바다', name:hard ? ZONES[0][1] : bgOf(st)[0] + ' 해변' };
  vis.riv = rivals(); vis.nb = false;
}
/* 이번 판에 넘을 기록 — 내 최고 + 내 최고보다 높은 친구 중 가까운 4명(없으면 낮은 순 4명). 낮은 것부터 하나씩 넘는다.
   남의 값은 peerPlay 로 거른다. 이름은 캔버스 글자로만 쓰고(HTML 아님) 6자로 자른다 */
function rivals(){
  try{
    const day = today(), mine = vis.best || 0, out = [];
    const town = (typeof state !== 'undefined' && state.town) || [], myId = typeof ME !== 'undefined' && ME ? ME.id : null;
    for(const x of town){ if(!x || x.id === myId) continue; const pp = typeof peerPlay === 'function' ? peerPlay(x.profile && x.profile.play) : null; if(!pp) continue;
      const v = daily ? (pp.dbest && pp.dbest.day === day ? +pp.dbest.score || 0 : 0) : +(hard ? pp.hbest : pp.best) || 0;
      if(v > 0) out.push({ n:String(x.name || '친구').slice(0, 6), v }); }
    out.sort((a, b)=>a.v - b.v);
    const up = out.filter(r=>r.v > mine), pick = (up.length ? up : out).slice(0, 4);
    if(mine > 0) pick.push({ n:'내 최고', v:mine, me:1 });
    return pick.sort((a, b)=>a.v - b.v || (a.me ? -1 : 1));
  }catch(e){ return mine0(); }
}
const mine0 = () => vis.best > 0 ? [{ n:'내 최고', v:vis.best, me:1 }] : [];
function showOver(sc, r){
  const p = ME.profile.play || {}, nb = r.newBest && sc > 0;
  const best = daily ? ((p.dbest && p.dbest.day === today()) ? p.dbest.score : sc) : ((hard ? p.hbest : p.best) || sc);
  const v = (typeof VOICES !== 'undefined' && VOICES.length) ? VOICES[Math.floor(Math.random() * VOICES.length)] : null;
  const close = !nb && best > sc && sc >= best * .75, xpFull = ((p.gday === today() ? p.gxp : 0) || 0) >= 15;   // 거의 닿았으면 '아깝다' — 한 판 더 누르게
  const cells = [['최고', best], ['거리', (hard ? meters(st) : Math.round(st.dist / 10)) + 'm'], ['조개', st.shells + st.msh], ['최대 연속', st.cmax]];
  const fun = [st.md ? `🎯 미션 <b>${st.md}</b>` : '', st.fevN ? `🔥 피버 <b>${st.fevN}</b>` : '', st.cnt.nm ? `😮 아슬아슬 <b>${st.cnt.nm}</b>` : '', st.gold ? `✨ 황금 조개 <b>${st.gold}</b>` : ''].filter(Boolean);
  /* 다음 목표 — 아직 못 넘은 가장 가까운 기록. 한 판 더 누를 이유를 숫자로 */
  const nx = vis.riv.find(q=>q.v > sc && !q.me), goal = nx ? `🎯 다음 목표: 🏁 ${esc(nx.n)} <b>${nx.v}</b>점 — <b>${nx.v - sc}</b>점 남았어요`   // 신기록이어도 다음 친구를 보여 준다
    : !nb && !close && best > sc ? `🎯 다음 목표: 내 최고 <b>${best}</b>점 — <b>${best - sc}</b>점 남았어요` : '';
  $g('g-ov').hidden = false;
  $g('g-ov').innerHTML = `<div class="go-card${nb ? ' jp-nb' : ''}">
      <div class="jp-rib">${hard ? `🔥 어려움 · ${meters(st)}m · ${esc(ZONES[st.zone - 1][1])}${st.bossN ? ` · 👑 보스 ${st.bossN} 격파` : ''}` : daily ? '📅 오늘의 챌린지 · 쉬움' : '🙂 쉬움'}</div>
      <div class="go-t">${nb ? '🎉 최고 기록!' : close ? `아깝다! 최고까지 ${best - sc}점` : '🌊 와이프아웃'}</div>
      <div class="go-s"><span id="g-cnt">${sc}</span><small>점</small></div>
      ${fun.length ? `<div class="go-d jp-fun" style="margin:-2px 0 6px;word-break:keep-all">${fun.join(' · ')}</div>` : ''}
      <div class="go-st">${cells.map(([k, n])=>`<span>${k}<b>${n}</b></span>`).join('')}</div>
      ${goal ? `<div class="go-d jp-goal" style="margin:0 0 8px;word-break:keep-all">${goal}</div>` : ''}
      ${r.ach && r.ach.length ? `<div class="go-d" style="margin:0 0 8px;word-break:keep-all;background:rgba(255,211,107,.16);border-radius:10px;padding:6px 8px">🏅 업적 달성! ${r.ach.map(a=>`${a[1]} <b>${esc(a[2])}</b> 🐚+${a[4]}`).join(' · ')}</div>` : ''}
      ${r.nbd ? `<div class="go-d" style="margin:0 0 8px">🔓 새 보드 <b>${esc(r.nbd.n)}</b>가 열렸어요 — 시작 화면 🏄에서 골라요</div>` : ''}
      ${window.JUMP_STANDALONE ? `<div class="go-b">🐚 조개 ${st.shells}개${r.rank ? ` · 🏆 ${r.rank}` : ''}</div>` : `<div class="go-b">${hard ? `❤️ 잃은 목숨 <b>${st.lost}</b> · ` : ''}🐚 +${r.shells ?? st.shells}${r.x2 ? ' <b>×2</b>' : ''} (보유 ${r.bal ?? '–'})${r.gain ? ` · <b>+${r.gain} XP</b>` : xpFull ? ' · 오늘 XP는 다 채웠어요' : ''}</div>`}
      <div class="jp-row"><button class="btn blue" id="g-again" type="button" style="flex:1">↻ 한 판 더</button>
        <button class="btn ghost" id="g-exit" type="button">닫기</button></div>
      ${daily ? (()=>{ const rk = dailyRows(); return rk.length ? `<div class="go-r" style="margin-top:10px"><span class="jp-rh">오늘의 챌린지 순위</span>${rk.map((q,i)=>`<span>${['🥇','🥈','🥉'][i]} ${esc(q.name)} ${q.best}</span>`).join('')}</div>` : ''; })() : ''}
      ${typeof upNudge === 'function' && !window.JUMP_STANDALONE ? upNudge('jump', { sc, best:nb || close ? 0 : best, x2:r.x2, daily, k:'j_val', plus:st.shells * 2 }) : ''}
      ${v && !hard ? `<div class="go-v" style="margin-top:10px">“${esc(v[0])}”<small>— ${esc(v[1])}</small></div>` : ''}
      ${sc >= 100 && typeof sendChat === 'function' ? `<button class="btn ghost jp-wide" id="g-brag" type="button">📣 마을에 자랑하기</button>` : ''}
      ${window.JUMP_STANDALONE ? `<button class="btn ghost jp-wide" id="g-share" type="button">📤 친구에게 공유</button>` : ''}</div>`;
  if(nb){ burst(W / 2, 40, 40, ['#FFD36B','#FF8AB8','#7FE3FF','#FFFFFF','#9BF0B4'], 130, 70, 2.2, 1); tune([523, 659, 784, 1047, 1319, 1568], 90); }     // 신기록 — 꽃가루·팡파르
  countUp($g('g-cnt'), sc);
  $g('g-again').onclick = ()=>begin(daily); $g('g-exit').onclick = gameClose;
  if($g('g-brag')) $g('g-brag').onclick = async ()=>{ const b = $g('g-brag'); b.disabled = true;
    await sendChat(`🎮 파도 점프${hard ? '(어려움)' : ''} ${sc}점!${r.newBest ? ' (내 최고 기록 🎉)' : ''}`, true); b.textContent = '✅ 올렸어요'; };
  if($g('g-share')) $g('g-share').onclick = async ()=>{ const b = $g('g-share'), t = `🏄 파도 점프 ${sc}점! 나도 해 보기 →`, u = location.origin + location.pathname;
    try{ if(navigator.share){ await navigator.share({ title:'파도 점프', text:t, url:u }); return; } await navigator.clipboard.writeText(t + ' ' + u); b.textContent = '✅ 링크를 복사했어요'; }catch(e){} };
}

/* 결과 점수가 0부터 촤라락 올라간다(0.7초). 움직임 줄이기 설정이면 바로 */
function countUp(el, to){ if(!el || RM || to <= 0) return; const t0 = performance.now(), D = 700; el.textContent = '0';
  const f = now=>{ if(!el.isConnected) return; const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e); if(k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }
function gameOpen(){
  cv = $g('g-cv'); ctx = cv.getContext('2d');
  $g('game').hidden = false; document.body.classList.add('game-on');
  fit(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if(!$g('g-pause')){ const b = document.createElement('button'); b.id = 'g-pause'; b.type = 'button'; b.className = 'jp-pause'; b.hidden = true; b.textContent = '⏸'; b.setAttribute('aria-label', '잠깐 멈춤'); b.onclick = pause; cv.parentNode.appendChild(b); }
  try{ snd = localStorage.getItem('lineup.share.snd') === '1'; }catch(e){}            // 놀이 메뉴 설정에서 바꿨을 수 있다
  TH = themeNow(); warmBg(); sndBtn(); showStart(); last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
}
function gameClose(){
  if(mode === 'run' && st && st.dead){ runId++; finish(); }                         // 넘어지는 연출 중에 닫아도 기록·조개는 남긴다(한 번만)
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
window._game = { BOARDS, ACH, achCheck, achGot, achCard, boardOf, set board(k){ boardK = k; }, zkey, MILE, BOSS:[BOSS1, BOSSG], get vis(){ return vis; }, get hard(){ return hard; }, set hard(v){ hard = !!v; }, clone:()=>structuredClone(st), swap:s=>{ const o = st; st = s; return o; }, FIX, get mod(){ return mod; }, set mod(i){ mod = MODS[i]; }, MODS, get TH(){ return TH; }, setTheme:k=>{ TH = THEMES[k]; }, pause, get st(){ return st; }, get mode(){ return mode; }, step, jump, release, score, begin, reset: ()=>reset() };
})();
