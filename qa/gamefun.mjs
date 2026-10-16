/* 게임 재미 장치 — 파도 점프(연속 배수·피버·아슬아슬·황금 조개·미션·기록 깃발·결과 목표줄), 라인업 서핑(기술 콤보·완벽 테이크오프 연속·세트 파도),
   스케이트(판정·연속·360). 규칙이 st 안에 있어 오늘의 챌린지가 같은 입력이면 같은 결과인지, 조개 보상이 한 번만 들어가는지까지.
   SHOT=폴더 를 주면 fun-g-*.png 화면을 남긴다. 기준 밖이면 exit 1. */
import { open } from './mock.mjs';
const SHOT = process.env.SHOT || '';
const evil = '<img src=x onerror=window.__x=1>';
const surfers = [{ id:'u4', name:'이성현', cohort:'6기', profile:{} },
  { id:'u1', name:'김도훈', cohort:'6기', profile:{ play:{ xp:50, best:120 } } },
  { id:'u2', name:evil, cohort:'6기', profile:{ play:{ xp:50, best:260 } } },
  { id:'u3', name:'바다', cohort:'6기', profile:{ play:{ xp:50, best:9000 } } }];
const t = await open({ surfers }, { id:'u4', name:'테스터', profile:{ gender:'f', birth:'1', dressed:1, play:{ base:80, bonus:0, badges:{}, qd:{}, qall:0, best:200, gday:'', gxp:0, gn:{}, lvSeen:2, xp:80, lv:2, shells:0 } } }, { wait:2500 });
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); gameOpen(); }); await t.sleep(300);
const fails = [], chk = (ok, name, v)=>{ console.log(ok ? '✅' : '❌', name, v === undefined ? '' : JSON.stringify(v)); if(!ok) fails.push(name); };

const J = await t.S(()=>{
  const g = _game, out = {}; window._gameSim = true;
  const fresh = (hard)=>{ g.hard = !!hard; g.begin(false); const s = g.st; s.obs = []; s.pick = []; s.next = 1e9; s.nextItem = 1e9; g.vis.ban = null; return s; };
  // ① 넘을 때마다 연속 +1, 5번째부터 ×2, 10번째에 피버(무적·점수 2배)
  let s = fresh(false); s.y = 40; s.air = true; s.vy = 0;
  const passOne = ()=>{ s.obs.push({ k:'rock', w:12, h:10, y:0, x:24 }); s.y = 40; s.vy = 0; s.air = true; g.step(g.FIX); };
  let p0 = s.pts; for(let i = 0; i < 4; i++) passOne(); const b4 = s.pts - p0;
  passOne(); out.연속 = { combo:s.combo, 넷까지:Math.round(b4) };
  for(let i = 0; i < 5; i++) passOne(); out.피버 = { combo:s.combo, 무적:s.fx.star > 0, 피버:s.fx.fev > 0, 횟수:s.fevN, 다음:s.nextFev };
  // 피버 중 부딪혀도 안 다친다 → 피버 끝난 뒤 튜브로 막으면 연속이 끊긴다
  s.y = 0; s.vy = 0; s.air = false; s.obs.push({ k:'rock', w:12, h:10, y:0, x:44 }); g.step(g.FIX); out.피버충돌 = { 죽음:s.dead, 연속:s.combo };
  s.fx.star = 0; s.fx.fev = 0; s.shield = 1; s.obs = [{ k:'rock', w:12, h:10, y:0, x:44 }]; g.step(g.FIX); out.끊김 = { 연속:s.combo, 다음피버:s.nextFev, 죽음:s.dead };
  // ② 아슬아슬 — 장애물 바로 위를 스치듯 넘으면 보너스
  s = fresh(false); s.obs.push({ k:'rock', w:12, h:10, y:0, x:42 }); s.y = 10; s.vy = 0; s.air = true; for(let i = 0; i < 24; i++){ s.y = 10; s.vy = 0; g.step(g.FIX); }
  out.아슬아슬 = { 횟수:s.cnt.nm, 넘음:s.cnt.pass };
  s = fresh(false); s.obs.push({ k:'rock', w:12, h:10, y:0, x:42 }); for(let i = 0; i < 24; i++){ s.y = 45; s.vy = 0; s.air = true; g.step(g.FIX); } out.높이넘음 = { 아슬아슬:s.cnt.nm };
  // ③ 황금 조개 — 14번째마다, +50 · 조개 1개
  s = fresh(false); s.gsN = 0; let golds = 0; for(let i = 0; i < 28; i++){ s.pick.push({ x:44, y:12, got:false, gold:(++s.gsN % 14 === 0) ? 1 : 0 }); }
  golds = s.pick.filter(p=>p.gold).length; s.pick = [{ x:44, y:12, got:false, gold:1 }]; p0 = s.pts; const sh0 = s.shells; g.step(g.FIX);
  out.황금 = { 스물여덟중:golds, 점수:Math.round(s.pts - p0), 조개:s.shells - sh0, 횟수:s.gold };
  // 실제 스폰도 순번대로 황금이 섞이는지(쉬움 코스로 60초)
  s = fresh(false); s.next = 150; let seen = 0; for(let i = 0; i < 60 * 60 && !s.dead; i++){ s.y = 60; s.vy = 0; s.air = true; g.step(g.FIX); seen = Math.max(seen, s.gsN); }
  out.스폰 = { 순번:seen, 황금있음:seen >= 14 };
  // ④ 미션 — 조개 5개 → 성공(+100, 조개 2개), 다음 미션으로. 45초 지나면 조용히 다음으로
  s = fresh(false); out.첫미션 = s.mn; p0 = s.pts; for(let i = 0; i < 5; i++){ s.pick.push({ x:44, y:12, got:false }); g.step(g.FIX); }
  out.미션 = { 성공:s.md, 조개보상:s.msh, 점수:Math.round(s.pts - p0), 다음:s.mn };
  for(let i = 0; i < 46 * 60 && !s.dead; i++){ s.y = 60; s.vy = 0; s.air = true; s.obs = []; g.step(g.FIX); }
  out.미션시간초과 = { 순번:s.mi, 성공:s.md, 이름:s.mn };
  // 어려움 미션 순서 — 첫 미션은 누구나 되는 것
  s = fresh(true); out.어려움첫미션 = s.mn; s.lives = 9;
  s.y = 26; s.vy = -60; s.air = true; s.obs.push({ k:'jelly', w:10, h:10, y:3, x:58 }); for(let i = 0; i < 40 && s.obs.length; i++) g.step(g.FIX); out.밟기연속 = { 연속:s.combo, 밟음:s.cnt.stomp };
  // ⑤ 오늘의 챌린지 — 같은 입력이면 연속·미션·황금까지 완전히 같다
  const daily = ()=>{ g.hard = false; g.begin(true); const s = g.st; let n = 0; while(!s.dead && n < 60 * 40){ const o = s.obs.find(o=>o.x + o.w > 48); if(o && !s.air && (o.x - 52) < s.speed * 0.30) g.jump(); g.step(g.FIX); n++; if(!s.air) g.release(); }
    return [g.score(), s.cmax, s.md, s.gold, s.fevN, s.cnt.nm, s.shells].join(','); };
  out.챌린지 = [daily(), daily()];
  window._gameSim = false; g.pause();
  return out;
});
console.log(JSON.stringify(J));
chk(J.연속.combo === 5 && J.연속.넷까지 > 0, '연속 5', J.연속);
chk(J.피버.combo === 10 && J.피버.무적 && J.피버.피버 && J.피버.횟수 === 1 && J.피버.다음 === 30, '10연속 피버', J.피버);
chk(!J.피버충돌.죽음 && J.피버충돌.연속 >= 10, '피버 중 무적', J.피버충돌);
chk(J.끊김.연속 === 0 && J.끊김.다음피버 === 10 && !J.끊김.죽음, '부딪히면 연속 끊김', J.끊김);
chk(J.아슬아슬.횟수 === 1 && J.높이넘음.아슬아슬 === 0, '아슬아슬', [J.아슬아슬, J.높이넘음]);
chk(J.황금.스물여덟중 === 2 && J.황금.점수 >= 50 && J.황금.조개 === 1 && J.황금.횟수 === 1, '황금 조개', J.황금);
chk(J.스폰.황금있음, '스폰 순번', J.스폰);
chk(J.첫미션.includes('조개 5개') && J.미션.성공 === 1 && J.미션.조개보상 === 2 && J.미션.점수 >= 100 && J.미션.다음 !== J.첫미션, '미션 성공', J.미션);
chk(J.미션시간초과.순번 >= 2 && J.미션시간초과.성공 === 1, '미션 45초 넘기기', J.미션시간초과);
chk(J.어려움첫미션.includes('조개 10개') && J.밟기연속.연속 === 1 && J.밟기연속.밟음 === 1, '어려움 미션·밟기 연속', [J.어려움첫미션, J.밟기연속]);
chk(J.챌린지[0] === J.챌린지[1], '챌린지 같은 결과', J.챌린지);

// ⑥ 실제 루프 — 친구 기록 깃발·내 최고 돌파·결과 목표줄·조개 한 번만
const shot = async n=>{ if(!SHOT) return; await (await t.p.$('#game .game-stage') || t.p).screenshot({ path:`${SHOT}/fun-g-${n}.png` }); };
await t.S(()=>{ _game.hard = false; _game.begin(false); });
const riv = await t.S(()=>_game.vis.riv.map(r=>r.n + ':' + r.v + (r.me ? '*' : '')));
chk(riv.length === 3 && riv[0].includes('내 최고:200') && riv.some(r=>r.includes('바다:9000')), '넘을 기록 목록(내 최고 위 친구만)', riv);
await t.S(()=>{ const s = _game.st; s.pts = 255; s.next = 1e9; s.obs = []; }); await t.p.waitForFunction(()=>_game.vis.fl.on, { timeout:4000 }).catch(()=>{}); await t.sleep(150);
const flag1 = await t.S(()=>({ 배너:_game.vis.ban && _game.vis.ban.top, 이름:_game.vis.ban && _game.vis.ban.name, 깃발:_game.vis.fl.on, 남은:_game.vis.riv.length, 신기록:_game.vis.nb }));
chk(flag1.깃발 && flag1.신기록 && /신기록/.test(flag1.배너), '내 최고 돌파 깃발', flag1);
await shot('record');
await t.S(()=>{ const s = _game.st; s.pts = 262; }); await t.p.waitForFunction(()=>_game.vis.riv.length === 1, { timeout:4000 }).catch(()=>{}); await t.sleep(150);
const flag2 = await t.S(()=>({ 배너:_game.vis.ban && _game.vis.ban.top, 이름:_game.vis.ban && _game.vis.ban.name, 남은:_game.vis.riv.length }));
chk(/기록 돌파/.test(flag2.배너) && flag2.이름.startsWith('<img s') && flag2.남은 === 1, '친구 기록 돌파(이름은 캔버스 글자, 6자)', flag2);
await shot('rival');
// 피버 화면 · 연속 배수 · 미션 띠
await t.S(()=>{ const s = _game.st; s.combo = 12; s.cmax = 12; s.fx.star = 4; s.fx.fev = 3.2; s.nextFev = 30; s.pts = 300; s.pick.push({ x:120, y:30, got:false, gold:1 }, { x:140, y:30, got:false }); s.cnt.sh = 3; _game.vis.ban = null; }); await t.sleep(300);
await shot('fever');
await t.S(()=>{ const s = _game.st; s.fx.star = 0; s.fx.fev = 0; s.combo = 4; s.obs = []; s.pick = []; for(let i = 0; i < 2; i++) s.pick.push({ x:47 + i * 2, y:s.y + 8, got:false }); }); await t.sleep(80);
await t.S(()=>{ const s = _game.st; s.y = 30; s.vy = 0; s.air = true; s.obs.push({ k:'rock', w:12, h:10, y:0, x:30 }); s.obs.push({ k:'fin', w:14, h:17, y:0, x:60 }); s.pick.push({ x:110, y:18, got:false, gold:1 }); }); await t.sleep(220);
await shot('combo');
// 결과 — 조개(+미션 보상)는 한 번만 지갑에, 다음 목표 줄, 이름 주입 없음
const before = await t.S(()=>ME.profile.play.shells || 0);
const res = await t.S(()=>{ const s = _game.st; s.md = 2; s.msh = 4; s.fevN = 1; s.cnt.nm = 3; s.gold = 1; s.pts = 262; s.shells = 9; s.lives = 1; s.shield = 0; s.invuln = 0; s.fx.star = 0; s.fx.fev = 0; s.y = 0; s.air = false; s.vy = 0; s.obs = [{ k:'rock', w:12, h:10, y:0, x:44 }]; _game.step(_game.FIX); return s.dead; });
await t.sleep(1700);
const over = await t.S(()=>({ 재미줄:document.querySelector('#g-ov .jp-fun')?.textContent, 목표:document.querySelector('#g-ov .jp-goal')?.textContent, 점수:document.querySelector('#g-cnt')?.textContent, 조개:ME.profile.play.shells, 주입:window.__x || 0 }));
const bonus = await t.S(()=>{ const p = ME.profile.play; return p.gn ? 1 : 0; });
chk(over.재미줄 && /미션/.test(over.재미줄) && /피버/.test(over.재미줄) && /아슬아슬/.test(over.재미줄), '결과 재미 줄', over.재미줄);
chk(over.목표 && /바다/.test(over.목표) && /8738/.test(over.목표), '결과 다음 목표', over.목표);
chk(over.점수 === '262' && !over.주입, '결과 점수 카운트 끝·주입 없음', over);
const gotSh = over.조개 - before;
chk(gotSh === 13 || gotSh === 26, '조개 = 주운 9 + 미션 4 (오늘 첫 판이면 ×2)', gotSh);
await shot('over');
await t.S(()=>{ gameClose(); gameClose(); }); await t.sleep(200);
chk((await t.S(()=>ME.profile.play.shells)) === over.조개, '닫아도 조개 두 번 안 들어감');

// ⑦ 라인업 서핑 — 기술 콤보 배수 · 완벽 테이크오프 연속 · 세트 파도
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); surfOpen(); }); await t.sleep(300);
await t.S(()=>document.getElementById('s-go').click()); await t.sleep(100);
const SR = await t.S(()=>{ const g = _surf, out = {};
  g.S.phase = 'ride'; Object.assign(g.R, { v:110, h:0.5, vh:0, x:400, curl:300, pts:0 });
  const p = []; for(let i = 0; i < 5; i++){ const a = g.R.pts; g.trick(100); p.push(Math.round(g.R.pts - a)); }
  out.콤보 = { 점수:p, 콤보:g.R.cmb };
  for(let i = 0; i < 60 * 3; i++){ g.held = g.R.h < 0.5; g.step(g.FIX); if(g.S.phase !== 'ride') break; } out.끊김 = { 콤보:g.R.cmb, 단계:g.S.phase };
  // 완벽 테이크오프 연속
  const take = ()=>{ g.S.phase = 'pop'; g.R.popT = 0; let n = 0; while(g.S.phase === 'pop' && n++ < 300){ g.step(g.FIX); if(g.R.popT > 0.3 && Math.abs(g.R.needle - 0.5) < 0.03){ g.press(); g.step(g.FIX); } } return Math.round(g.R.pts); };
  g.newSession(); g.S.setW = 9; const a1 = take(); g.S.phase = 'ride'; g.pull(); g.nextWave(); g.R.pts = 0; const a2 = take();
  out.완벽연속 = { 첫:a1, 둘째:a2, 연속:g.S.pstk };
  // 세트 파도 — 정해진 번째에 머리 파도, 점수 ×1.5
  g.newSession(); g.S.setW = 1; g.nextWave(); out.세트 = { 세트:g.R.set, 크기:g.R.sz.n }; g.S.phase = 'ride'; Object.assign(g.R, { x:500, curl:480, h:0.7, pts:100 }); g.pull();
  out.세트.받은점수 = g.R.done && g.R.done.got;
  return out; });
console.log(JSON.stringify(SR));
chk(SR.콤보.점수.join(',') === '100,100,150,150,200' && SR.콤보.콤보 === 5, '기술 콤보 배수 ×1.5·×2', SR.콤보);
chk(SR.끊김.콤보 === 0, '2.5초 쉬면 콤보 끊김', SR.끊김);
chk(SR.완벽연속.첫 === 30 && SR.완벽연속.둘째 === 60 && SR.완벽연속.연속 === 2, '완벽 테이크오프 연속 30→60', SR.완벽연속);
chk(SR.세트.세트 && SR.세트.크기 === '머리 파도' && SR.세트.받은점수 === Math.floor((100 + 50) * 1.5), '세트 파도 ×1.5', SR.세트);
if(SHOT){
  await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(100);
  await t.S(()=>{ const g = _surf; g.newSession(); g.R.set = true; g.R.t = 1.2; g.R.meter = .7; document.getElementById('s-ov').hidden = true; window._gameRun = true; }); await t.sleep(350);
  await (await t.p.$('#surf .game-stage') || t.p).screenshot({ path:`${SHOT}/fun-g-surf-set.png` });
  await t.S(()=>{ const g = _surf; g.S.phase = 'ride'; Object.assign(g.R, { v:130, h:0.75, vh:0, x:400, curl:330, pts:240 }); for(let i = 0; i < 5; i++) g.trick(30, '탑턴'); g.held = true; }); await t.sleep(200);
  await (await t.p.$('#surf .game-stage') || t.p).screenshot({ path:`${SHOT}/fun-g-surf-combo.png` });
}
await t.S(()=>surfClose()); await t.sleep(150);

// ⑧ 스케이트 — 판정 글자·연속·4연속 360, 놓치면 끊김
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); skateOpen(); }); await t.sleep(200);
const SK = await t.S(()=>{ const g = _skate; g.start('pump'); const G = g.G; let n = 0, spun = 0, grades = {};
  while(!G.done && n++ < 60 * 120){ const seg = G.segs[G.i]; g.held = !!(seg && G.s >= seg.w0 && G.s <= seg.w1); const i0 = G.i; g.step(g.FIX); if(G.i !== i0) grades[G.gr.k] = (grades[G.gr.k] || 0) + 1; if(G.spin > 0.5) spun++; }
  const perfect = { 최대연속:G.smax, 완벽:G.np, 판정:grades, 돌기:spun > 0 };
  g.start('pump'); const H = g.G; n = 0; while(!H.done && n++ < 60 * 120){ g.held = true; g.step(g.FIX); }
  return { perfect, 계속누름:{ 최대연속:H.smax, 판정:H.gr.k } }; });
console.log(JSON.stringify(SK));
chk(SK.perfect.최대연속 >= 12 && SK.perfect.돌기 && SK.perfect.판정.p >= 10, '스케이트 연속·360', SK.perfect);
chk(SK.계속누름.최대연속 <= 2 && SK.계속누름.판정 === 'm', '계속 누르면 놓침', SK.계속누름);
if(SHOT){
  await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(100);
  await t.S(()=>{ const g = _skate; g.start('bottom'); const G = g.G; let n = 0; while(G.i < 8 && n++ < 6000){ const seg = G.segs[G.i]; g.held = !!(seg && G.s >= seg.w0 && G.s <= seg.w1); g.step(g.FIX); } G.gr.t = .05; G.spin = .3; G.gr.k = 'p'; G.gr.sub = '🌀 8연속 — 360!'; G.paused = true; }); await t.sleep(120);
  await (await t.p.$('#skate .game-stage') || t.p).screenshot({ path:`${SHOT}/fun-g-skate.png` });
}
await t.S(()=>skateClose());
console.log(fails.length ? '결과 FAIL ' + fails.join(' / ') : '결과 OK', '| errs', t.errs);
await t.b.close(); process.exit(fails.length || t.errs.length ? 1 : 0);
