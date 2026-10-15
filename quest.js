/* ── 🗺️ 전설의 보드 원정 ───────────────────────────────────────────────
   무과금 · 무육성 · 자동 진행. 양양 낙산에서 출발해 동해안을 따라 내려가 묵호항에서 배를 타고 울릉도·독도까지.
   서퍼는 알아서 패들하며 다가오는 바다의 위협(해파리·꽃게 떼·상어·성난 파도·대왕문어)을 물보라로 막고,
   가끔 바다 친구(돌고래·바다거북·물개·고래·갈매기)가 나타나 돕는다. 내가 하는 건 장소마다 '준비물' 하나 고르기 —
   그것도 '자동'이면 알아서 고른다. 판마다 처음부터(육성 없음). 독도 서도의 수호자를 넘으면 '전설의 보드'.
   240×240 도트 캔버스 + 아래 기록 줄. 물리는 1/60초 고정, 배속(1·2·4배)만 바꾼다. */
(function(){
const W = 240, H = 240, SEA = 150, FIX = 1 / 60;
const $q = id => document.getElementById(id);
/* 실제 지명 — 한 줄 설명은 그곳에 대해 널리 알려진 것만 */
const PLACES = [
  { n:'양양 낙산해변', d:'원정 출발 — 낙산사 아래 긴 백사장', sky:['#BFE9FF','#9BDBFF'] },
  { n:'양양 죽도해변', d:'서퍼들이 모이는 작은 섬 앞 해변', sky:['#B5E5FF','#8ED3FF'] },
  { n:'강릉 주문진항', d:'오징어·대게로 이름난 항구', sky:['#AEE2FF','#86CFF7'] },
  { n:'강릉 경포해변', d:'경포호를 끼고 있는 강릉의 대표 해변', sky:['#A8DEFF','#7FCBF5'] },
  { n:'강릉 정동진', d:'바다 바로 앞 기차역 — 해돋이 명소', sky:['#FFD9B0','#FFB98A'], boss:'octo' },
  { n:'동해 묵호항', d:'울릉도 가는 배가 뜨는 항구 — 여기서부턴 먼바다', sky:['#FFC9A0','#F7A47E'] },
  { n:'울릉도 저동항', d:'오징어잡이 배가 드나드는 울릉도 동쪽 항구', sky:['#C9B7F2','#9E8FD9'] },
  { n:'울릉도 관음도', d:'울릉도 곁 무인도 — 보행교로 이어진 섬', sky:['#9E8FD9','#6E68B8'] },
  { n:'독도 동도', d:'우리 땅 가장 동쪽 — 동도와 서도 두 섬', sky:['#4A5C9E','#2E3F7A'] },
  { n:'독도 서도', d:'전설의 보드가 잠든 곳', sky:['#22305E','#141E40'], boss:'guard' },
];
const FOES = {
  jelly:{ ic:'🪼', n:'해파리', hp:20, atk:4, sp:16, r:8, rate:1.2 },
  crab: { ic:'🦀', n:'꽃게 떼', hp:12, atk:3, sp:22, r:7, rate:0.9 },
  shark:{ ic:'🦈', n:'상어', hp:46, atk:12, sp:38, r:11, rate:1.4 },
  wave: { ic:'🌊', n:'성난 파도', hp:30, atk:16, sp:52, r:12, rate:99, crash:true },
  octo: { ic:'🐙', n:'대왕문어', hp:260, atk:14, sp:12, r:22, rate:1.6, boss:true },
  guard:{ ic:'🐉', n:'너울의 수호자', hp:640, atk:20, sp:10, r:26, rate:1.5, boss:true },
};
const PALS = {
  dolphin:{ ic:'🐬', n:'돌고래', say:'돌고래가 함께 헤엄쳐요 — 상어를 쫓아내요!' },
  turtle: { ic:'🐢', n:'바다거북', say:'바다거북이 등껍질로 막아 줘요 (보호막 +40)' },
  seal:   { ic:'🦭', n:'물개', say:'물개가 곁에서 쉬게 해 줘요 (천천히 회복)' },
  whale:  { ic:'🐋', n:'고래', say:'고래가 큰 물살로 바다를 쓸어 줘요!' },
  gull:   { ic:'🕊️', n:'갈매기', say:'갈매기가 조개를 물어다 줘요 (+5🐚)' },
};
const BOONS = [
  { k:'leash', ic:'🪢', n:'튼튼한 리쉬', d:'최대 체력 +30', f:s=>{ s.maxHp += 30; s.hp += 30; } },
  { k:'wax',   ic:'🕯️', n:'새 왁스', d:'공격 속도 +20%', f:s=>{ s.cd *= 0.8; } },
  { k:'lesson',ic:'📘', n:'코치님 한마디', d:'공격력 +5', f:s=>{ s.atk += 5; } },
  { k:'fin',   ic:'🛹', n:'새 핀', d:'물보라가 두 마리까지 맞아요', f:s=>{ s.multi = Math.max(s.multi, 2); } },
  { k:'whistle',ic:'🎵', n:'돌고래 휘파람', d:'바다 친구가 더 자주 와요', f:s=>{ s.palRate += 0.12; } },
  { k:'shell', ic:'🐢', n:'거북 부적', d:'장소마다 보호막 30으로 시작', f:s=>{ s.startShield += 30; s.shield += 30; } },
  { k:'wet',   ic:'🧥', n:'두꺼운 웻수트', d:'받는 피해 -20%', f:s=>{ s.def *= 0.8; } },
  { k:'snack', ic:'🍙', n:'주문진 주먹밥', d:'지금 체력 50 회복', f:s=>{ s.hp = Math.min(s.maxHp, s.hp + 50); } },
];

let cv, ctx, me = null, raf = 0, last = 0, acc = 0, speed = 1, auto = true, S = null;
const sndOn = () => { try{ return localStorage.getItem('lineup.share.snd') === '1'; }catch(e){ return false; } };
let AC = null;
function beep(f0, f1, dur, vol){ if(!sndOn()) return; try{ AC ||= new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
  o.type = 'triangle'; o.frequency.setValueAtTime(f0, t); if(f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(vol || 0.04, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + .02); }catch(e){} }
function mkMe(){ const c = document.createElement('canvas'); try{ const q = withLook(ME.profile, ME.name); drawSpr(c, avatarRows(q, false), avatarTintOf(q, 0)); }catch(e){ c.width = 24; c.height = 24; } return c; }
const rnd = Math.random, pick = a => a[Math.floor(rnd() * a.length)];

function newRun(){
  S = { st:0, phase:'pick', hp:100, maxHp:100, atk:11, cd:0.8, cdT:0, def:1, multi:1, shield:0, startShield:0, palRate:0.22,
        foes:[], pals:[], fx:[], log:[], t:0, killed:0, need:0, spawnT:1, shells:0, whale:false, boons:[], seed:Date.now() % 100000 };
  enterStage(0); window._gameRun = true;                          // 원정 중엔 다른 알림 카드가 덮지 않게
}
function enterStage(i){
  S.st = i; const P = PLACES[i];
  S.foes = []; S.fx = []; S.need = P.boss ? 1 : 5 + i * 2; S.killed = 0; S.spawnT = 1.2; S.bossOut = false;
  S.shield = Math.max(S.shield, S.startShield);
  S.choices = []; const pool = BOONS.slice(); while(S.choices.length < 3) S.choices.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  S.phase = 'pick'; S.pickT = 2.2;                                        // 자동이면 2.2초 뒤 알아서 고른다
  log(`📍 ${P.n} — ${P.d}`);
  render();
}
function choose(k){
  const b = S.choices[k]; if(!b || S.phase !== 'pick') return;
  b.f(S); S.boons.push(b.ic); log(`${b.ic} ${b.n} 챙겼어요 — ${b.d}`); S.phase = 'go'; render(); beep(523, 784, 0.12);
}
function log(t){ S.log.unshift({ t, at:S.t }); S.log = S.log.slice(0, 40); paintLog(); }

/* 적 만들기 — 장소가 깊어질수록 세진다 */
function spawn(kind){
  const F = FOES[kind], k = 1 + S.st * 0.15;
  S.foes.push({ kind, ...F, hp:Math.round(F.hp * k), max:Math.round(F.hp * k), atk:F.atk * (1 + S.st * 0.1), x:W + 20, y:SEA - (F.boss ? 18 : 6) + (rnd() * 6 - 3), hitT:0, wob:rnd() * 6 });
  if(F.boss) log(`⚠️ ${F.ic} ${F.n} 등장!`);
}
function spawnTick(dt){
  const P = PLACES[S.st];
  if(P.boss){ if(!S.bossOut){ S.bossOut = true; spawn(P.boss); } if(rnd() < dt * 0.35) spawn(pick(['jelly', 'crab'])); return; }
  S.spawnT -= dt; if(S.spawnT > 0 || S.killed + S.foes.length >= S.need) return;
  const deep = S.st >= 5;
  const r = rnd(); spawn(r < 0.34 ? 'jelly' : r < 0.55 ? 'crab' : r < (deep ? 0.82 : 0.9) ? 'shark' : 'wave');
  if(rnd() < 0.25) spawn('crab');
  S.spawnT = Math.max(0.8, 2.2 - S.st * 0.12) * (0.7 + rnd() * 0.6);
}
function palTick(dt){
  if(rnd() > dt / 6 * (S.palRate / 0.22) * 0.9) return;
  if(rnd() > S.palRate * 2.2) return;
  const r = rnd(), k = r < 0.34 ? 'dolphin' : r < 0.56 ? 'turtle' : r < 0.76 ? 'seal' : r < 0.92 ? 'gull' : (!S.whale ? 'whale' : 'dolphin');
  const P = PALS[k]; log(`${P.ic} ${P.say}`); beep(660, 990, 0.15);
  if(k === 'turtle'){ S.shield += 40; S.fx.push({ k:'txt', x:40, y:SEA - 50, t:0, v:'🛡 +40' }); }
  else if(k === 'gull'){ S.shells += 5; S.fx.push({ k:'txt', x:60, y:SEA - 60, t:0, v:'🐚 +5' }); }
  else if(k === 'whale'){ S.whale = true; S.foes.forEach(f=>{ f.hp -= f.boss ? 60 : 9999; }); S.fx.push({ k:'whale', t:0 }); }
  S.pals.push({ k, t:0, life:k === 'dolphin' ? 18 : k === 'seal' ? 10 : k === 'whale' ? 2.5 : 3, cd:0, x:20 + rnd() * 40 });
}

function step(dt){
  const s = S; s.t += dt;
  s.fx.forEach(f=>f.t += dt); s.fx = s.fx.filter(f=>f.t < (f.k === 'whale' ? 2.5 : 0.9));
  if(s.phase === 'pick'){ if(auto){ s.pickT -= dt; if(s.pickT <= 0) choose(Math.floor(rnd() * 3)); } return; }
  if(s.phase !== 'go') return;
  spawnTick(dt); palTick(dt);
  const sx = 46;
  // 적 움직임·공격
  for(const f of s.foes){
    const reach = sx + 12 + f.r;
    if(f.x > reach) f.x -= f.sp * dt;
    else{
      if(f.crash){ hurt(f.atk, f); f.hp = 0; s.fx.push({ k:'splash', x:sx + 10, y:SEA - 10, t:0 }); continue; }
      f.hitT -= dt; if(f.hitT <= 0){ f.hitT = f.rate; hurt(f.atk, f); }
    }
  }
  // 친구들
  for(const p of s.pals){ p.t += dt;
    if(p.k === 'dolphin'){ p.cd -= dt; if(p.cd <= 0){ const f = s.foes.filter(x=>x.hp > 0).sort((a,b)=>a.x - b.x)[0]; if(f){ f.hp -= 8; p.cd = 0.6; s.fx.push({ k:'zap', x:f.x, y:f.y, t:0, c:'#7BE0FF' }); } } }
    if(p.k === 'seal') s.hp = Math.min(s.maxHp, s.hp + 2.2 * dt);
  }
  s.pals = s.pals.filter(p=>p.t < p.life);
  // 서퍼의 물보라
  s.cdT -= dt;
  if(s.cdT <= 0){
    const tg = s.foes.filter(f=>f.hp > 0 && f.x < sx + 120).sort((a,b)=>a.x - b.x).slice(0, s.multi);
    if(tg.length){ tg.forEach(f=>{ f.hp -= s.atk; s.fx.push({ k:'zap', x:f.x, y:f.y, t:0, c:'#FFFFFF' }); }); s.cdT = s.cd; beep(880, 660, 0.05, 0.02); }
  }
  // 정리
  for(const f of s.foes) if(f.hp <= 0 && !f.dead){ f.dead = true; s.killed++; if(f.boss){ log(`🏆 ${f.ic} ${f.n}를 넘었어요!`); } else if(rnd() < 0.3) s.shells++; }
  s.foes = s.foes.filter(f=>!f.dead);
  if(s.hp <= 0) return end(false);
  const P = PLACES[s.st];
  if((P.boss ? s.killed >= 1 && !s.foes.some(f=>f.boss) : s.killed >= s.need) ){
    s.foes = [];
    if(s.st >= PLACES.length - 1) return end(true);
    s.hp = Math.min(s.maxHp, s.hp + s.maxHp * 0.25);
    log(`✅ ${P.n} 통과 — 체력 조금 회복`);
    s.phase = 'travel'; s.travelT = 1.6;
  }
}
function hurt(n, f){
  let d = n * S.def;
  if(S.shield > 0){ const a = Math.min(S.shield, d); S.shield -= a; d -= a; }
  if(d > 0){ S.hp -= d; S.fx.push({ k:'txt', x:40, y:SEA - 44, t:0, v:'-' + Math.round(d), c:'#FF6B6B' }); }
  if(f.kind === 'shark' && rnd() < 0.3) log('🦈 상어가 물었어요!');
  if(f.kind === 'wave') log('🌊 성난 파도에 맞았어요!');
  try{ if(typeof vib === 'function') vib(8); }catch(e){}
}
function end(win){
  S.phase = win ? 'win' : 'lose'; window._gameRun = false;
  const r = typeof playQuestDone === 'function' ? playQuestDone(S.st, win, S.shells) : { best:S.st };
  log(win ? '🏄‍♂️✨ 전설의 보드를 찾았어요!' : `💤 ${PLACES[S.st].n}에서 쓰러졌어요`);
  const ov = $q('q-ov'); ov.hidden = false;
  ov.innerHTML = `<div class="go-card"><div class="go-t">${win ? '🏆 전설의 보드!' : '🌊 원정 끝'}</div>
    <div class="go-d">${win ? '독도 서도에서 전설의 보드를 찾았어요.<br>캐릭터 꾸미기 → 보드 색에 <b>‘전설’</b>이 열렸어요.' : `<b>${PLACES[S.st].n}</b>까지 왔어요 (${S.st + 1}/${PLACES.length})`}</div>
    <div class="go-st"><span>도착<b>${S.st + 1}/${PLACES.length}</b></span><span>최고<b>${(r.best ?? S.st) + 1}</b></span><span>쓰러뜨림<b>${S.killed}</b></span><span>조개<b>${S.shells}</b></span></div>
    <div class="go-b">챙긴 것 ${S.boons.join(' ') || '—'}</div>
    <button class="btn blue" id="q-again" type="button" style="width:100%;min-height:52px;font-size:16px">낙산에서 다시 출발</button></div>`;
  $q('q-again').onclick = ()=>{ ov.hidden = true; newRun(); };
  render();
  if(typeof popNext === 'function') setTimeout(popNext, 1200);
}

/* ── 그리기 ── */
function Rq(c, x, y, w, h){ ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
function draw(){
  const s = S, P = PLACES[s ? s.st : 0], t = s ? s.t : 0;
  Rq(P.sky[0], 0, 0, W, 60); Rq(P.sky[1], 0, 60, W, 60);
  // 먼 육지·섬 실루엣 — 장소마다 조금씩
  const land = s && s.st >= 6 ? '#3E4A73' : '#4E7A5A';
  if(s && s.st >= 8){ Rq('#2E365A', 150, 96, 24, 24); Rq('#2E365A', 180, 104, 30, 16); }
  else if(s && s.st >= 6){ for(let i = 0; i < 40; i++){ const h = 26 - Math.abs(i - 20) * 1.2; Rq(land, 140 + i * 2, 120 - h, 2, h); } }
  else { Rq(land, 0, 108, W, 12); for(let i = 0; i < 12; i++) Rq('#3F6A4C', i * 22, 100 + (i % 3) * 3, 14, 8); }
  Rq('#2E7FC0', 0, 120, W, 30); Rq('#2569A8', 0, SEA, W, H - SEA);
  for(let i = 0; i < 18; i++){ const x = ((i * 31 - t * (s && s.phase === 'travel' ? 90 : 20)) % 260 + 260) % 260 - 10; Rq('rgba(255,255,255,.35)', x, 128 + (i % 4) * 7, 10, 1); Rq('rgba(255,255,255,.25)', x + 6, SEA + 10 + (i % 5) * 16, 14, 1); }
  if(!s) return;
  ctx.font = '8px Galmuri11, sans-serif'; ctx.textBaseline = 'top';
  // 장소 팻말
  Rq('rgba(20,30,50,.75)', 0, 0, W, 16); ctx.fillStyle = '#FFE27A'; ctx.fillText(`${s.st + 1}/${PLACES.length} ${P.n}`, 4, 4);
  ctx.fillStyle = '#FFFFFF'; ctx.fillText(`🐚${s.shells}`, W - 30, 4);
  // 진행 막대
  const prog = P.boss ? (s.foes.find(f=>f.boss) ? 1 - s.foes.find(f=>f.boss).hp / s.foes.find(f=>f.boss).max : 1) : s.killed / Math.max(1, s.need);
  Rq('rgba(0,0,0,.3)', 4, 18, W - 8, 3); Rq('#FFE27A', 4, 18, (W - 8) * Math.min(1, prog), 3);
  // 서퍼
  const bob = Math.round(Math.sin(t * 5) * 1.5), sy = SEA - 22 + bob;
  Rq('#FF6B6B', 34, sy + 22, 22, 3); if(me) ctx.drawImage(me, 33, sy);
  if(s.shield > 0){ ctx.strokeStyle = 'rgba(123,224,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(45, sy + 12, 17, 0, 6.3); ctx.stroke(); }
  // 체력
  Rq('rgba(0,0,0,.35)', 24, sy - 8, 44, 4); Rq(s.hp / s.maxHp > 0.35 ? '#4ADE80' : '#FF6B6B', 24, sy - 8, 44 * Math.max(0, s.hp / s.maxHp), 4);
  if(s.shield > 0) Rq('#7BE0FF', 24, sy - 3, Math.min(44, 44 * s.shield / 60), 2);
  // 친구들
  ctx.font = '14px sans-serif';
  s.pals.forEach((p, i)=>{ const px = p.k === 'whale' ? 60 + p.t * 60 : p.x + Math.sin(p.t * 3 + i) * 10, py = p.k === 'gull' ? 40 + Math.sin(p.t * 4) * 6 : p.k === 'whale' ? SEA + 10 : SEA + 6 + Math.sin(p.t * 4 + i) * 3;
    ctx.font = p.k === 'whale' ? '26px sans-serif' : '14px sans-serif'; ctx.fillText(PALS[p.k].ic, px, py); });
  // 적
  s.foes.forEach(f=>{ const wob = Math.sin(t * 4 + f.wob) * 2; ctx.font = (f.boss ? 34 : f.kind === 'wave' ? 20 : 15) + 'px sans-serif'; ctx.fillText(f.ic, f.x - f.r, f.y - f.r + wob);
    Rq('rgba(0,0,0,.35)', f.x - f.r, f.y - f.r - 6, f.r * 2, 3); Rq('#FF6B6B', f.x - f.r, f.y - f.r - 6, f.r * 2 * Math.max(0, f.hp / f.max), 3); });
  // 효과
  s.fx.forEach(f=>{
    if(f.k === 'zap'){ ctx.globalAlpha = 1 - f.t / 0.9; ctx.strokeStyle = f.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, 4 + f.t * 14, 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1; }
    else if(f.k === 'txt'){ ctx.globalAlpha = 1 - f.t / 0.9; ctx.font = '9px Galmuri11, sans-serif'; ctx.fillStyle = f.c || '#FFE27A'; ctx.fillText(f.v, f.x, f.y - f.t * 18); ctx.globalAlpha = 1; }
    else if(f.k === 'splash'){ ctx.globalAlpha = 1 - f.t / 0.9; Rq('#FFFFFF', f.x - 10, f.y - f.t * 20, 20, 4); ctx.globalAlpha = 1; }
    else if(f.k === 'whale'){ ctx.globalAlpha = Math.max(0, 0.5 - f.t / 5); Rq('#BFEFFF', 0, SEA - 30, W * Math.min(1, f.t / 0.8), 40); ctx.globalAlpha = 1; } });
  if(s.phase === 'travel'){ ctx.font = '9px Galmuri11, sans-serif'; ctx.fillStyle = '#FFFFFF'; ctx.fillText(`→ ${PLACES[s.st + 1]?.n || ''}로 패들 중…`, 60, 40); }
}
function paintLog(){ const el = $q('q-log'); if(!el || !S) return; el.innerHTML = S.log.slice(0, 6).map((l, i)=>`<div style="opacity:${1 - i * 0.13}">${esc(l.t)}</div>`).join(''); }

/* 장소마다 '준비물 고르기' 카드 — 자동이면 잠깐 보여 주고 알아서 고른다 */
function render(){
  const ov = $q('q-ov'); if(!ov || !S) return;
  if(S.phase === 'pick'){
    const P = PLACES[S.st];
    ov.hidden = false;
    ov.innerHTML = `<div class="go-card"><div class="go-t">📍 ${esc(P.n)}</div><div class="go-d">${esc(P.d)}</div>
      <div class="q-pick">${S.choices.map((b, i)=>`<button type="button" class="q-b" data-qb="${i}"><i>${b.ic}</i><b>${esc(b.n)}</b><small>${esc(b.d)}</small></button>`).join('')}</div>
      <div class="go-b" style="margin:8px 0 0">${auto ? '🤖 자동 — 곧 알아서 골라요 (눌러서 직접 골라도 돼요)' : '하나 골라 주세요'}</div></div>`;
    ov.querySelectorAll('[data-qb]').forEach(b=>b.onclick = ()=>choose(+b.dataset.qb));
  } else if(S.phase === 'go' || S.phase === 'travel') ov.hidden = true;
  const sp = $q('q-speed'); if(sp) sp.textContent = `⏩ ${speed}배`;
  const au = $q('q-auto'); if(au){ au.textContent = auto ? '🤖 자동 고르기 켜짐' : '✋ 직접 고르기'; au.setAttribute('aria-pressed', String(auto)); }
}

function loop(ts){
  raf = requestAnimationFrame(loop);
  if(!last) last = ts; let dt = Math.min(0.033, (ts - last) / 1000); last = ts;
  if(S && !S.paused){ acc += dt * speed; let n = 0; while(acc >= FIX && n++ < 30){
    if(S.phase === 'travel'){ S.t += FIX; S.travelT -= FIX; if(S.travelT <= 0) enterStage(S.st + 1); }
    else step(FIX);
    acc -= FIX; if(S.phase === 'win' || S.phase === 'lose') break; } }
  draw();
  const hp = $q('q-hp'); if(hp && S) hp.textContent = `❤️ ${Math.max(0, Math.round(S.hp))}/${S.maxHp}${S.shield > 0 ? ` 🛡${Math.round(S.shield)}` : ''}`;
}

function intro(){
  const p = ME.profile.play?.qb || {};
  const ov = $q('q-ov'); ov.hidden = false;
  ov.innerHTML = `<div class="go-card"><div class="go-t">🗺️ 전설의 보드 원정</div>
    <div class="go-d" style="text-align:left">양양 낙산에서 출발해 주문진 · 경포 · 정동진 · 묵호항을 지나 배로 <b>울릉도 · 독도</b>까지.<br>
      서퍼는 <b>알아서</b> 싸워요 — 🪼 해파리 · 🦀 꽃게 떼 · 🦈 상어 · 🌊 성난 파도 · 🐙 대왕문어를 물보라로 막고,<br>
      🐬 돌고래 · 🐢 바다거북 · 🦭 물개 · 🐋 고래 · 🕊️ 갈매기가 가끔 도와요.<br>내가 하는 건 장소마다 <b>준비물 하나</b> 고르기(자동도 돼요). 판마다 처음부터!</div>
    <div class="go-b">최고 기록 <b>${p.best != null ? p.best + 1 : 0}/${PLACES.length}</b> · 완주 ${p.clears || 0}번${p.legend ? ' · 🏄 전설의 보드 보유' : ''}</div>
    <button class="btn blue" id="q-go" type="button" style="width:100%;min-height:52px;font-size:16px">⛵ 원정 출발</button></div>`;
  $q('q-go').onclick = ()=>{ newRun(); };
}
function questOpen(){
  cv = $q('q-cv'); ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  $q('quest').hidden = false; document.body.classList.add('game-on');
  me = mkMe(); S = null; intro(); last = 0; acc = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  const l = $q('q-log'); if(l) l.innerHTML = '<div>⛵ 출발을 누르면 원정이 시작돼요</div>';
}
function questClose(){ cancelAnimationFrame(raf); raf = 0; S = null; window._gameRun = false; $q('quest').hidden = true; document.body.classList.remove('game-on');
  if(typeof playTick === 'function') playTick(); if(typeof renderHub === 'function' && typeof state !== 'undefined' && state.tab === 'play') renderHub(); }
function wire(){
  if(wire.done || !$q('quest')) return; wire.done = true;
  $q('q-x').onclick = questClose;
  $q('q-speed').onclick = ()=>{ speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; render(); };
  $q('q-auto').onclick = ()=>{ auto = !auto; try{ localStorage.setItem('lineup.share.qauto', auto ? '1' : '0'); }catch(e){} render(); };
  try{ auto = localStorage.getItem('lineup.share.qauto') !== '0'; }catch(e){}
  addEventListener('keydown', e=>{ if(!$q('quest').hidden && e.key === 'Escape') questClose(); });
  document.addEventListener('visibilitychange', ()=>{ if(S) S.paused = document.hidden; last = 0; });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
window.questOpen = questOpen; window.questClose = questClose;
window._quest = { get S(){ return S; }, step, newRun, choose, enterStage, PLACES, FOES, set auto(v){ auto = v; }, FIX };
})();
