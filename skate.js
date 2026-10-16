/* ── 서프스케이트 트레이닝 ──────────────────────────────────────────────
   서프스케이트는 바다 밖에서 서핑 동작(펌핑·바텀턴·컷백·턴 연결)을 반복 연습하는 도구다.
   바다에선 한 세션에 바텀턴을 10~20번 하지만, 땅에선 수십~수백 번 할 수 있다는 게 핵심(출처: Rapture Camps 서프스케이트 가이드).
   이 게임은 그 리듬을 몸에 익히는 연습장 — 위에서 내려다본 산책로를 S자로 카빙한다.
     · 노란 칸(턴의 꼭짓점)을 지나는 동안 꾹 누르기 = 무릎을 굽혀 압축, 칸을 벗어나면 떼기 = 펴기(확장)
     · 타이밍이 맞으면 속도가 붙고(펌핑), 틀리면 빠진다. 멈추면 끝.
   드릴 4개: 펌핑(정지에서 출발) · 바텀턴→탑턴 · 컷백 · 플로우(연결). 끝나면 '실제로 해 보기' 코칭과
   '오늘 실제로 탔어요' 체크(하루 1번 +XP)로 진짜 훈련과 이어 준다. 180×240 도트, 1/60초 고정. */
(function(){
const W = 180, H = 240, PY = 196, FIX = 1 / 60, CX = 90, WARM = 2;
const $k = id => document.getElementById(id);
let cv, ctx, me = null, raf = 0, last = 0, acc = 0, held = false, G = null;

const DRILLS = {
  pump:   { n:'펌핑 기초', ic:'🌀', d:'거의 멈춘 상태에서 시작해 밀지 않고 펌핑만으로 속도를 만든다', v0:32,
            seq:()=>Array.from({ length:14 }, ()=>({ L:70, A:20, w:0.2, lab:'꾹' })),
            tips:['양발을 보드에 올린 채 정지 상태에서 시작 — 발로 밀지 않는다', '턴의 꼭짓점에서 무릎·발목을 굽혀 누르고(압축), 넘어가며 편다(확장)', '상체는 조용히, 하체로 리듬 — 처음 2주는 이것만 해도 충분'] },
  bottom: { n:'바텀턴 → 탑턴', ic:'↩️', d:'크고 낮게 오래 누르는 바텀턴, 짧고 빠른 탑턴을 번갈아', v0:60,
            seq:()=>Array.from({ length:12 }, (_, i)=>i % 2 ? { L:62, A:16, w:0.16, lab:'탑턴' } : { L:126, A:40, w:0.34, lab:'바텀턴' }),
            tips:['앞발에 체중 60~70% — 턴 내내 앞쪽을 누른다', '시선과 앞팔이 먼저 가고 몸이 따라간다', '보드에서 쓰는 스탠스와 똑같이 선다(다르면 다른 동작을 익히게 된다)'] },
  cut:    { n:'컷백', ic:'🔁', d:'펌핑 두 번으로 속도를 붙이고, 크게 돌아 포켓으로 돌아오기', v0:60,
            seq:()=>Array.from({ length:12 }, (_, i)=>i % 3 === 2 ? { L:156, A:54, w:0.36, lab:'컷백' } : { L:66, A:18, w:0.18, lab:'꾹' }),
            tips:['바텀턴에서 낮게 → 어깨 너머로 시선을 돌리며 크게 호를 그린다', '꼭짓점에서 안쪽 레일로 체중을 옮겨 되돌린다', '보드가 상체보다 먼저 기울어야 둥근 컷백이 된다'] },
  flow:   { n:'플로우 (턴 연결)', ic:'🌊', d:'바텀턴·탑턴·컷백을 끊김 없이 이어서', v0:60,
            seq:()=>{ const P = [{ L:126, A:40, w:0.34, lab:'바텀턴' }, { L:62, A:16, w:0.16, lab:'탑턴' }, { L:70, A:20, w:0.2, lab:'꾹' }, { L:156, A:54, w:0.36, lab:'컷백' }];
              return Array.from({ length:18 }, (_, i)=>({ ...P[(i * 7 + (i >> 2)) % 4] })); },
            tips:['바텀턴 → 탑턴 → 컷백을 한 리듬으로 — 바다에서 가장 어려운 게 이 연결', '반대 스탠스로도 한 번(백사이드·늦은 드롭에 도움)', '휴대폰으로 찍어서 보드가 어깨보다 먼저 기우는지 확인'] },
};
const ORDER = ['pump', 'bottom', 'cut', 'flow'];

let AC = null;
const sndOn = () => { try{ return localStorage.getItem('lineup.share.snd') === '1'; }catch(e){ return false; } };
function beep(f0, f1, dur, vol){ if(!sndOn()) return;
  try{ AC ||= new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = 'triangle'; o.frequency.setValueAtTime(f0, t); if(f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol || 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + .02); }catch(e){} }
const buzz = p => { try{ if(typeof vib === 'function') vib(p); else navigator.vibrate?.(p); }catch(e){} };
function mkMe(){ const c = document.createElement('canvas'); try{ const q = withLook(ME.profile, ME.name); drawSpr(c, avatarRows(q, false), avatarTintOf(q, 0)); }catch(e){ c.width = 24; c.height = 24; } return c; }

/* 코스 — 구간마다 좌우로 휘는 반쪽 사인. 꼭짓점 주변(w 비율)이 '누르는 칸' */
function build(kind){
  const segs = DRILLS[kind].seq(); let b = 14;
  segs.forEach((g, i)=>{ g.b = b; g.side = i % 2 ? -1 : 1; g.apex = b + g.L / 2; g.w0 = g.apex - g.L * g.w; g.w1 = g.apex + g.L * g.w; g.inT = 0; g.outT = 0; g.q = null; b += g.L; });
  return { segs, end:b };
}
let segHint = 0;
function segAt(s){ const a = G.segs; let i = Math.min(segHint, a.length - 1);
  if(i < 0) return null; while(i > 0 && s < a[i].b) i--; while(i < a.length - 1 && s >= a[i].b + a[i].L) i++;
  segHint = i; const g = a[i]; return s >= g.b && s < g.b + g.L ? g : null; }
function xAt(s){
  const seg = segAt(s);
  if(!seg) return CX;
  return CX + seg.side * seg.A * Math.sin(Math.PI * (s - seg.b) / seg.L);
}
function slope(s){ return (xAt(s + 2) - xAt(s - 2)) / 4; }

function start(kind){
  if(typeof upFor === 'function') upFor('skate');               // 🔧 강화 적용 표시
  const tr = build(kind);
  G = { kind, ...tr, s:0, v:DRILLS[kind].v0, t:0, maxV:DRILLS[kind].v0, done:false, i:0, pops:[], trail:[], comp:0, stalled:0 };
  $k('k-ov').hidden = true; held = false; window._gameRun = true;
}

function step(dt){
  const g = G; if(!g || g.done) return;
  g.t += dt;
  g.comp += ((held ? 1 : 0) - g.comp) * Math.min(1, dt * 12);                     // 웅크림 정도(그림용)
  g.s += g.v * dt;
  const seg = g.segs[g.i];
  if(seg){
    const inWin = g.s >= seg.w0 && g.s <= seg.w1;
    /* 칸 앞뒤 0.15초는 봐준다 — 사람은 보고 누르니 조금 늦고, 떼는 것도 조금 늦다. 그 밖에서 누르고 있으면 '너무 오래' */
    if(held){ const gr = g.v * 0.15; if(inWin) seg.inT += dt; else if(g.s < seg.w0 - gr || g.s > seg.w1 + gr) seg.outT += dt; }
    if(g.s >= seg.b + seg.L){                                                        // 구간 끝 — 채점
      const winT = (seg.w1 - seg.w0) / Math.max(1, g.v), restT = Math.max(0.2, (seg.L - (seg.w1 - seg.w0) - 2 * g.v * 0.15) / Math.max(1, g.v));   // 봐주는 칸을 뺀 나머지
      const hit = Math.min(1, seg.inT / Math.max(0.05, winT)), miss = Math.min(1, seg.outT / Math.max(0.05, restT));
      seg.q = Math.max(0, Math.min(1, hit - 0.7 * miss));
      const dv = (seg.q - 0.42) * (seg.lab === '꾹' ? 34 : 42); g.v += g.i < WARM ? Math.max(0, dv) : dv;
      if(seg.q > 0.5) g.ok = (g.ok || 0) + 1;
      const msg = seg.q > 0.8 ? (seg.lab === '꾹' ? '완벽한 펌핑!' : `완벽한 ${seg.lab}!`) : seg.q > 0.5 ? '좋아요' : hit < 0.3 && miss < 0.2 ? '더 꾹 눌러요' : miss > 0.4 ? '너무 오래 눌렀어요' : '타이밍!';
      g.pops.push({ t:0, v:msg, good:seg.q > 0.5 }); if(seg.q > 0.8){ beep(660, 990, 0.1); buzz(8); }
      g.i++;
    }
  }
  g.v = Math.max(0, Math.min(170, g.v - (g.i >= WARM ? 4 : 0) * dt)); g.maxV = Math.max(g.maxV, g.v);   // 몸풀기 두 턴 동안은 줄지 않는다(출발 여유)
  if(g.v < 12){ g.stalled += dt; if(g.stalled > 1.2) return finish(true); } else g.stalled = 0;
  g.trail.push({ s:g.s, x:xAt(g.s) }); if(g.trail.length > 60) g.trail.shift();
  g.pops.forEach(p=>p.t += dt); g.pops = g.pops.filter(p=>p.t < 0.9);
  if(g.s >= g.end) finish(false);
}

function finish(stalled){
  const g = G; g.done = true; window._gameRun = false;
  const qs = g.segs.filter(s=>s.q != null).map(s=>s.q), accP = qs.length ? Math.round(qs.reduce((a,b)=>a + b, 0) / qs.length * 100) : 0;
  const sc = stalled ? Math.round(accP * qs.length / g.segs.length) : accP;      // 멈추면 탄 만큼만 — 화면에도 같은 숫자를 보여 준다
  const r = typeof playSkateDone === 'function' ? playSkateDone(g.kind, sc) : { gain:0, best:sc, real:false };
  const D = DRILLS[g.kind], ni = ORDER.indexOf(g.kind) + 1;
  $k('k-ov').hidden = false;
  $k('k-ov').innerHTML = `<div class="go-card" style="text-align:left"><div class="go-t" style="text-align:center">${stalled ? '🛑 멈췄어요' : accP >= 80 ? '🔥 몸에 붙었어요!' : '🛹 드릴 끝'}</div>
    ${stalled ? `<div class="go-d" style="text-align:center">속도가 다 빠졌어요 — 노란 칸에서만 꾹, 칸을 지나면 바로 떼요</div>` : ''}
    <div class="go-st"><span>점수<b>${sc}%</b></span><span>턴<b>${qs.length}/${g.segs.length}</b></span><span>최고 속도<b>${Math.round(g.maxV)}</b></span><span>내 최고<b>${r.best}%</b></span></div>
    <div class="sk-tip"><b>${D.ic} 실제로 해 보기 — ${esc(D.n)}</b><ul>${D.tips.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>
    ${r.gain || r.shells ? `<div class="go-b" style="text-align:center">${[r.gain ? `+${r.gain} XP` : '', r.shells ? `🐚 +${r.shells}${r.x2 ? ' ×2' : ''}` : ''].filter(Boolean).join(' · ')}</div>` : ''}
    <button class="btn mint" id="k-real" type="button" style="width:100%;min-height:48px" ${r.real ? 'disabled' : ''}>${r.real ? '✅ 오늘 실제로 탔어요' : '🛹 오늘 실제로 10분 탔어요 (+5 XP)'}</button>
    <div style="display:flex;gap:8px;margin-top:8px"><button class="btn blue" id="k-again" type="button" style="flex:1;min-height:48px">한 판 더</button>
      ${ni < ORDER.length ? `<button class="btn blue" id="k-next" type="button" style="flex:1;min-height:48px">다음: ${esc(DRILLS[ORDER[ni]].n)}</button>` : ''}
      <button class="btn ghost" id="k-menu" type="button" style="min-height:48px">목록</button></div></div>`;
  $k('k-again').onclick = ()=>start(g.kind);
  if($k('k-next')) $k('k-next').onclick = ()=>start(ORDER[ni]);
  $k('k-menu').onclick = menu;
  $k('k-real').onclick = ()=>{ const ok = typeof playSkateReal === 'function' && playSkateReal(); const b = $k('k-real'); b.disabled = true; b.textContent = '✅ 오늘 실제로 탔어요'; if(ok) toast('훈련 기록했어요 +5 XP 🛹'); };
  beep(523, 1046, 0.25);
}

/* ── 그리기 ── 위에서 본 산책로: 왼쪽은 바다, 오른쪽은 잔디·야자 */
function Rk(c, x, y, w, h){ ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
function lab(t, x, y, col, al, bg){ ctx.font = '11px Galmuri11, sans-serif'; ctx.textBaseline = 'top'; const w = Math.ceil(ctx.measureText(t).width);
  let x0 = al === 'r' ? x - w : al === 'c' ? x - w / 2 : x; x0 = Math.round(Math.max(3, Math.min(W - w - 3, x0)));
  if(bg !== 0) Rk(bg || 'rgba(10,22,40,.62)', x0 - 3, y - 2, w + 6, 15); ctx.fillStyle = col || '#FFFFFF'; ctx.fillText(t, x0, Math.round(y)); }
const TRAIL = Array.from({ length:61 }, (_, i)=>`rgba(30,30,40,${(i / 120).toFixed(3)})`);   // 바퀴 자국 색 — 매 프레임 문자열을 만들지 않게
const sy = s => PY - (s - G.s) * 1.0;                                                // 앞(진행 방향)이 화면 위
function draw(){
  // 바닷가 산책로 한 장(scenery.js) — 세로로 이어 붙여 달린 만큼 흘려 보낸다. 바다 물결·가운데 점선은 그 위에 그대로
  const pm = window.scenery && scenery.promenade(W, H), off = Math.round((G ? G.s : 0) % H);
  if(pm){ ctx.drawImage(pm, 0, off - H); ctx.drawImage(pm, 0, off); }
  else{ Rk('#3D8FD0', 0, 0, 22, H); Rk('#F2D7A0', 22, 0, 8, H); Rk('#8E8E99', 30, 0, 124, H); Rk('#7DBA5F', 154, 0, 26, H); }
  for(let y = 0; y < H; y += 12){ const yy = (y + (G ? G.s : 0)) % H; Rk('#7CC4F0', 4 + (y % 3) * 4, yy, 8, 1); }
  for(let y = 0; y < H + 40; y += 40){ const yy = ((y + (G ? G.s : 0)) % (H + 40)) - 20; if(!pm){ Rk('#2E7D32', 160, yy, 14, 10); Rk('#8D6E63', 166, yy + 10, 3, 12); } Rk('#A5A5AE', 90, yy + 4, 2, 14); }
  if(!G){ return; }
  // 코스 — 앞으로 보이는 길. 누르는 칸은 노란 띠
  for(let s = Math.max(0, G.s - 60); s < G.s + PY + 10; s += 2){
    const y = sy(s); if(y < -4 || y > H) continue;
    const seg = segAt(s); if(!seg) continue;
    const win = s >= seg.w0 && s <= seg.w1;
    Rk(win ? (seg.q == null ? '#FFD84A' : seg.q > 0.5 ? '#4ADE80' : '#FF8A8A') : 'rgba(255,255,255,.55)', xAt(s) - (win ? 3 : 1), y, win ? 6 : 2, 2);
  }
  for(const seg of G.segs){ const y = sy(seg.apex); if(y < 28 || y > PY - 24 || seg.q != null) continue; lab(seg.lab, xAt(seg.apex) + seg.side * 9, y - 6, '#FFE27A', seg.side < 0 ? 'r' : 'l'); }
  // 바퀴 자국
  for(let i = 0; i < G.trail.length; i++){ const p = G.trail[i], y = sy(p.s), c = TRAIL[i] || TRAIL[59]; Rk(c, p.x - 3, y, 1, 2); Rk(c, p.x + 3, y, 1, 2); }
  // 스케이터 — 진행 방향으로 기울고, 누르는 동안 웅크린다
  const x = xAt(G.s), ang = Math.atan(slope(G.s)) * 0.9, k = 1 - G.comp * 0.18;
  ctx.save(); ctx.translate(x, PY); ctx.rotate(ang);
  Rk('#3B2F2F', -3, -9, 6, 18); Rk('#F7B500', -2, -8, 4, 16); Rk('#1B1B2F', -4, -7, 2, 3); Rk('#1B1B2F', 2, -7, 2, 3); Rk('#1B1B2F', -4, 4, 2, 3); Rk('#1B1B2F', 2, 4, 2, 3);
  if(me){ ctx.scale(1, k); ctx.drawImage(me, -12, -22 / k - 4); }
  ctx.restore();
  if(held){ ctx.globalAlpha = 0.5; Rk('#FFD84A', x - 10, PY + 10, 20, 2); ctx.globalAlpha = 1; }
  // 위 — 드릴·진행·속도
  const D = DRILLS[G.kind];
  Rk('rgba(20,30,50,.78)', 0, 0, W, 25); lab(`${D.ic} ${D.n}`, 4, 3, '#FFFFFF', 'l', 0); lab(`${Math.min(G.i + 1, G.segs.length)}/${G.segs.length}`, W - 4, 3, '#FFFFFF', 'r', 0);
  Rk('rgba(255,255,255,.25)', 4, 18, W - 8, 4); Rk(G.v > 90 ? '#4ADE80' : G.v > 40 ? '#FFD84A' : '#FF8A8A', 4, 18, (W - 8) * Math.min(1, G.v / 150), 4);
  /* 몸풀기 두 턴 — 지금 눌러야 하는지 떼야 하는지 스케이터 위에서 알려 준다 */
  const cs = G.segs[G.i];
  if(G.i < WARM && cs && !G.done){ const inW = G.s >= cs.w0 && G.s <= cs.w1, soon = !inW && G.s < cs.w0 && cs.w0 - G.s < 70;
    const t = inW ? (held ? '좋아요, 꾹!' : '👇 지금 꾹 누르기!') : held ? '떼요!' : soon ? '노란 칸이 와요' : G.i === 0 ? '노란 칸에서만 꾹 누르기' : '';
    if(t) lab(t, x, PY + 18, inW ? '#FFE27A' : '#FFFFFF', 'c'); }
  for(const p of G.pops){ ctx.globalAlpha = Math.max(0, 1 - p.t / 0.9); lab(p.v, x, PY - 44 - p.t * 20, p.good ? '#4ADE80' : '#FFE27A', 'c'); } ctx.globalAlpha = 1;
  const v = Math.round(G.v); if(v !== G.scShown){ G.scShown = v; const sc = $k('k-score'); if(sc) sc.textContent = v; }
}

function loop(ts){
  raf = requestAnimationFrame(loop);
  if(!last) last = ts; let dt = Math.min(0.033, (ts - last) / 1000); last = ts;
  if(G && !G.done && !G.paused){ acc += dt; let n = 0; while(acc >= FIX && n++ < 6){ step(FIX); acc -= FIX; } }
  draw();
}

function menu(){
  const p = ME.profile.play?.sk || {}, best = p.best || {};
  G = null; window._gameRun = false; $k('k-ov').hidden = false;
  $k('k-ov').innerHTML = `<div class="go-card" style="text-align:left"><div class="go-t" style="text-align:center">🛹 서프스케이트 훈련</div>
    <div class="go-d">땅에서 서핑 동작을 반복하는 연습장. 바다에선 한 번에 10~20번인 턴을 여기선 수십 번.<br><b>노란 칸을 지나는 동안 꾹(웅크리기)</b>, 벗어나면 떼기(펴기) — 리듬이 맞으면 빨라져요.</div>
    ${ORDER.map((k, i)=>`<button type="button" class="sk-dr" data-dr="${k}"><i>${DRILLS[k].ic}</i><span><b>${i + 1}. ${esc(DRILLS[k].n)}</b><small>${esc(DRILLS[k].d)}</small></span><em>${best[k] != null ? best[k] + '%' : '—'}</em></button>`).join('')}
    <div class="go-d" style="font-size:11.5px;margin-top:8px">참고: Rapture Camps 「Surfskate Drills for Surfers」 등 서프스케이트 훈련 자료. 실제 연습은 보호대·차 없는 곳에서.</div></div>`;
  $k('k-ov').querySelectorAll('[data-dr]').forEach(b=>b.onclick = ()=>start(b.dataset.dr));
}
function skateOpen(){
  cv = $k('k-cv'); ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  $k('skate').hidden = false; document.body.classList.add('game-on');
  me = mkMe(); menu(); last = 0; acc = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
}
function skateClose(){
  cancelAnimationFrame(raf); raf = 0; G = null; window._gameRun = false;
  $k('skate').hidden = true; document.body.classList.remove('game-on');
  if(typeof playTick === 'function') playTick();
  if(typeof renderHub === 'function' && typeof state !== 'undefined' && state.tab === 'play') renderHub();
}
function wire(){
  if(wire.done || !$k('skate')) return; wire.done = true;
  $k('skate').addEventListener('pointerdown', e=>{ if(e.target.closest('button, .go-card')) return; e.preventDefault(); held = true; });
  addEventListener('pointerup', ()=>held = false); addEventListener('pointercancel', ()=>held = false);
  addEventListener('keydown', e=>{ if($k('skate').hidden) return; if(e.key === 'Escape') skateClose(); if((e.code === 'Space' || e.key === 'ArrowDown') && !e.repeat){ e.preventDefault(); held = true; } });
  addEventListener('keyup', e=>{ if(e.code === 'Space' || e.key === 'ArrowDown') held = false; });
  $k('k-x').onclick = skateClose;
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden && G && !G.done){ G.paused = true; held = false;
    $k('k-ov').hidden = false; $k('k-ov').innerHTML = `<div class="go-card"><div class="go-t">⏸ 잠깐 멈췄어요</div><button class="btn blue" id="k-resume" type="button" style="width:100%;min-height:52px">이어서</button></div>`;
    $k('k-resume').onclick = ()=>{ G.paused = false; last = 0; $k('k-ov').hidden = true; }; } });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
window.skateOpen = skateOpen; window.skateClose = skateClose;
window._skate = { get G(){ return G; }, start, step, FIX, set held(v){ held = v; }, xAt, DRILLS, ORDER };
})();
