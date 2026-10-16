/* 게임 고도화(보드·업적·두 번째 보스·폭풍/밤바다 구간 · 라인업 스팟·도감·세션 목표 · 스케이트 프리라이드 · 🔇/🔊)
   ① 파도 점프: 보드 특기는 자유 판에서만(챌린지·시뮬은 기본), 업적은 한 번만(프로필·기기 어느 쪽에 남아도 다시 안 줌),
      문어 ↔ 꽃게 번갈아, 폭풍(1500m~)·밤바다(2000m~) 구간을 내다보는 봇이 목숨 하나 안 잃고 지나간다(피할 수 없는 순간 0).
   ② 라인업 서핑: 스팟 잠금·해제, 기술 도감 등록, 세션 목표 달성 → +150
   ③ 스케이트 프리라이드: 잘 타면 오래, 계속 누르면 금방 끝. 템포가 오른다
   ④ 세 게임 소리 버튼이 같은 설정(lineup.share.snd)을 바꾼다.  SHOT=폴더 면 화면 캡처. 기준 밖이면 exit 1 */
import { open } from './mock.mjs';
const SHOT = process.env.SHOT || '';
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] }, { id:'u4', name:'테스터', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:2500 });
const bad = [], chk = (ok, m)=>{ if(!ok) bad.push(m); };
const shot = async (name, sel)=>{ if(!SHOT) return; await t.S(()=>{ const P = document.getElementById('pop'); if(P && !P.hidden) P.hidden = true; }); await t.sleep(200); const el = await t.p.$(sel); await el.screenshot({ path:`${SHOT}/deep-g-${name}.png` }); };
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); gameOpen(); }); await t.sleep(300);

/* ── ① 파도 점프 ── */
const J = await t.S(()=>{
  const g = _game, out = {}, p = playP();
  out.기본보드 = g.boardOf().k;
  g.board = 'long'; out.잠긴보드 = g.boardOf().k;                         // 쉬움 300점 전엔 기본으로
  p.best = 320; out.열린보드 = g.boardOf().k;
  g.hard = false; g.begin(false); out.자유판 = { pk:g.st.pk, 피버:g.st.nextFev }; g.pause();
  g.begin(true); out.챌린지 = { pk:g.st.pk, 피버:g.st.nextFev }; g.pause();
  // 업적 — 한 번만
  g.hard = false; g.begin(false); const s = g.st; s.fevN = 1; s.cmax = 21; const sh0 = p.shells || 0;
  const a1 = g.achCheck({ sc:1200, daily:false, hard:false }).map(a=>a[0]); const sh1 = p.shells || 0;
  const a2 = g.achCheck({ sc:1200, daily:false, hard:false }).length;
  localStorage.removeItem('lineup.share.jach'); const a3 = g.achCheck({ sc:1200, daily:false, hard:false }).length;   // 기기 기록이 지워져도 프로필에 있으면 안 준다
  const keep = p.ach; p.ach = {}; localStorage.setItem('lineup.share.jach', JSON.stringify(Object.fromEntries(a1.map(k=>[k, 1])))); const a4 = g.achCheck({ sc:1200, daily:false, hard:false }).length; p.ach = keep;
  out.업적 = { 처음:a1, 조개:sh1 - sh0, 두번째:a2, 기기지움:a3, 프로필지움:a4, 총보상:g.ACH.reduce((q, a)=>q + a[4], 0) }; g.pause();
  // 두 번째 보스 = 거대 꽃게
  window._gameSim = true; g.hard = true; g.begin(false); const h = g.st; h.obs = []; h.next = 1e9; h.nextItem = 1e9; h.lives = 9;
  h.sd = g.BOSS[0] - 2; for(let i = 0; i < 4 && !h.boss; i++) g.step(g.FIX); out.첫보스 = h.boss && h.boss.kind;
  h.fx.star = 99; for(let i = 0; i < 1500 && h.boss; i++){ if(h.boss){ h.boss.x = 40; h.boss.y = 4; h.boss.hurt = 0; if(h.boss.ph !== 'die'){ h.boss.ph = 'wait'; h.boss.t = 0; } } g.step(g.FIX); }
  h.sd = h.nextBoss - 2; h.fx.star = 0; for(let i = 0; i < 4 && !h.boss; i++) g.step(g.FIX); out.둘째보스 = h.boss ? { kind:h.boss.kind, hp:h.boss.hp } : null;
  window._gameSim = false; g.pause();
  return out;
});
console.log('파도 점프', JSON.stringify(J));
chk(J.기본보드 === 'basic' && J.잠긴보드 === 'basic' && J.열린보드 === 'long', '보드 잠금');
chk(J.자유판.pk === 'long' && J.자유판.피버 === 9 && J.챌린지.pk === 'basic' && J.챌린지.피버 === 10, '보드 특기는 자유 판만');
chk(J.업적.처음.includes('first') && J.업적.처음.includes('s1000') && J.업적.조개 > 0 && J.업적.두번째 === 0 && J.업적.기기지움 === 0 && J.업적.프로필지움 === 0 && J.업적.총보상 <= 160, '업적 한 번만');
chk(J.첫보스 === 'octo' && J.둘째보스 && J.둘째보스.kind === 'crab' && J.둘째보스.hp === 4, '보스 번갈아');

/* 폭풍·밤바다 공정성 — gamefair 와 같은 눈(1.5초 앞, 난수까지 되돌림)으로 구간 시작부터 35초 */
const F = await t.S(()=>{
  const g = _game; window._gameSim = true;
  let a = 1; const R = ()=>{ a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
  const rnd0 = Math.random; Math.random = R;
  const sim = (plan, N)=>{ const c = g.clone(), o = g.swap(c), a0 = a, l0 = c.lost, b0 = c.big; let f = 0;
    for(; f < N; f++){ for(const [j, h] of plan){ if(f === j) g.jump(); if(f === j + h) g.release(); } g.step(g.FIX); if(c.dead || c.lost > l0 || c.big < b0) break; }
    const ok = f === N && c.y > -1; g.swap(o); a = a0; return ok; };
  const HS = [4, 10, 40], N = 90;
  const plan = ()=>{ if(sim([], N)) return { wait:true };
    for(const h of HS){ let s0 = -1, s1 = -1; for(let j = 0; j <= 44; j++){ const ok = sim([[j, h]], N); if(ok && s0 < 0) s0 = j; if(ok) s1 = j; if(!ok && s0 >= 0) break; } if(s0 >= 0) return { j:(s0 + s1) / 2, h }; }
    for(let j1 = 0; j1 <= 24; j1 += 2) for(const h1 of HS) for(let j2 = j1 + 10; j2 <= j1 + 44; j2 += 3) for(const h2 of [4, 40]) if(sim([[j1, h1], [j2, h2]], N)) return { j:j1, h:h1, j2:j2 - j1, h2 };
    return null; };
  const run = (seed, z)=>{ a = seed * 7919 + 13; g.hard = true; g.begin(false); g.mod = seed % g.MODS.length; const s = g.st, M = g.MILE;
    s.sd = (z - 1) * M + 20; s.miles = z - 1; s.zone = z; s.nextMile = z * M; s.nextBoss = 1e9; s.obs = []; s.pick = []; s.next = 40;
    let f = 0, act = [], until = 0, unav = 0, gust = 0, kinds = {};
    while(!s.dead && s.t < 35){
      if(f >= until && !act.length){ const p = plan();
        if(!p){ if(!s.air && !s.on && s.invuln <= 0) unav++; until = f + 1; }
        else if(p.wait) until = f + 4; else if(p.j > 10) until = f + Math.floor(p.j - 10);
        else { const jf = Math.round(f + p.j); act = [[jf, 1], [jf + p.h, 0]]; if(p.j2 != null){ const j2 = Math.round(jf + p.j2); act.push([j2, 1], [j2 + p.h2, 0]); } } }
      for(const x of act) if(x[0] === f) x[1] ? g.jump() : g.release(); act = act.filter(x=>x[0] > f);
      g.step(g.FIX); f++; if(s.gust > 0) gust++; for(const o of s.obs) kinds[o.k] = 1; }
    return { 구간:g.zkey(s), 시드:seed, 죽음:s.dead, 잃은목숨:s.lost, 피할수없는순간:unav, 바람초:+(gust / 60).toFixed(1), 드럼통:!!kinds.barrel, 오징어:!!kinds.squid, 거리m:Math.round(s.sd / 10) }; };
  const out = []; for(let i = 0; i < 6; i++){ out.push(run(i + 1, 4)); out.push(run(i + 21, 5)); }
  Math.random = rnd0; window._gameSim = false; g.pause(); return out;
});
console.table(F);
/* gamefair 와 같은 기준 — 죽지 않고, 땅에 선 채 길이 없는 순간 0(봇도 가끔 목숨 하나는 잃는다: 1.5초 앞까지만 보므로) */
chk(F.every(r=>!r.죽음 && r.피할수없는순간 === 0) && F.reduce((q, r)=>q + r.잃은목숨, 0) <= 4, '폭풍·밤바다 공정성');
const STm = F.filter((r, i)=>i % 2 === 0), NTm = F.filter((r, i)=>i % 2 === 1);
chk(STm.every(r=>r.바람초 > 3) && STm.filter(r=>r.드럼통).length >= 4 && NTm.filter(r=>r.오징어).length >= 5, '구간 장애물·바람 나옴');

/* 화면 — 폭풍(맞바람)·밤바다·꽃게 보스·보드/업적 */
if(SHOT){
  const setup = z=>`const g=_game; g.hard=true; g.begin(false); g.vis.ban=null; const s=g.st; s.next=1e9; s.nextItem=1e9; s.zone=${z}; s.miles=${z - 1}; s.sd=${z - 1}*g.MILE+900; s.nextMile=${z}*g.MILE; s.nextBoss=1e9; g.setTheme(['day','noon','sunset','night','aurora'][${z - 1}]);`;
  await t.S(new Function(setup(4) + `s.gust=1.5; s.obs.push({k:'barrel',w:12,h:11,y:0,x:110,vx:28},{k:'rock',w:12,h:10,y:0,x:160}); g.pause(); document.getElementById('g-ov').hidden=true;`)); await shot('storm', '#game .game-stage');
  await t.S(new Function(setup(5) + `s.obs.push({k:'squid',w:10,h:10,y:14,x:100,ft:0,ph:0},{k:'squid',w:10,h:10,y:24,x:150,ft:1,ph:2}); g.pause(); document.getElementById('g-ov').hidden=true;`)); await shot('night', '#game .game-stage');
  await t.S(new Function(setup(3) + `s.sd=29000; s.bossN=1; s.nextBoss=29000; s.lives=5; g.step(g.FIX); s.boss.x=110; s.boss.ph='wait'; s.obs.push({k:'bub',w:8,h:8,y:0,x:90,vx:70}); g.pause(); document.getElementById('g-ov').hidden=true;`)); await shot('crab', '#game .game-stage');
  await t.S(()=>{ _game.pause(); _game.achCard(); }); await shot('boards', '#game .game-stage');
}
await t.S(()=>gameClose()); await t.sleep(200);

/* ── ② 라인업 서핑 ── */
await t.S(()=>{ setTab('play'); }); await t.sleep(300);
const S1 = await t.S(()=>{ const p = playP(); p.sebest = 0; p.sbest = 0; surfOpen(); const g = _surf, out = {};
  out.스팟버튼 = [...document.querySelectorAll('#s-ov [data-sp]')].map(b=>b.textContent.trim() + (b.disabled ? '(잠김)' : ''));
  g.spot = 'jukdo'; g.startCard(); out.잠긴스팟고름 = g.spot.k;                 // 잠겨 있으면 낙산으로
  p.sebest = 600; g.startCard(); document.querySelector('#s-ov [data-sp="jukdo"]').click(); out.열린스팟 = g.spot.k;
  g.newSession(); out.첫목표 = g.S.goal.n; out.세션스팟 = g.S.spot.n; out.파도컬 = Math.round(g.R.sz.c);
  // 도감 + 목표 — 탑턴 목표를 강제로
  localStorage.removeItem('lineup.share.scodex'); g.S.goal = { n:'탑턴 3번', k:'top', v:3, c:0, done:false }; g.S.phase = 'ride';
  const t0 = g.S.total; g.trick(30, '탑턴'); g.trick(30, '탑턴'); g.trick(30, '탑턴');
  out.목표 = { 달성:g.S.goal.done, 더한점수:g.S.total - t0 }; out.도감 = Object.keys(g.codex);
  return out; });
console.log('라인업 서핑', JSON.stringify(S1));
chk(S1.스팟버튼.length === 3 && /잠김/.test(S1.스팟버튼[1]) && S1.잠긴스팟고름 === 'naksan' && S1.열린스팟 === 'jukdo', '스팟 잠금');
chk(S1.세션스팟 === '죽도' && S1.목표.달성 && S1.목표.더한점수 === 150 && S1.도감.includes('top'), '목표·도감');
if(SHOT){ await t.S(()=>{ _surf.startCard(); }); await shot('surf-start', '#surf .game-stage');
  await t.S(()=>{ const g = _surf; g.newSession(); document.getElementById('s-ov').hidden = true; g.S.phase = 'ride'; Object.assign(g.R, { v:150, h:.7, x:600, curl:520, cam:120 }); g.trick(30, '탑턴'); g.trick(30, '탑턴'); g.trick(30, '탑턴'); g.trick(30, '탑턴'); g.trick(30, '탑턴'); }); await t.sleep(120); await shot('surf-ride', '#surf .game-stage'); }
const SND = await t.S(()=>{ localStorage.setItem('lineup.share.snd', '0'); const b = document.getElementById('s-snd'); const a0 = b.textContent; b.click(); return { 처음:a0, 누름:b.textContent, 설정:localStorage.getItem('lineup.share.snd') }; });
console.log('서핑 소리', JSON.stringify(SND)); chk(SND.처음 === '🔇' && SND.누름 === '🔊' && SND.설정 === '1', '서핑 소리 버튼');
await t.S(()=>surfClose()); await t.sleep(200);

/* ── ③ 스케이트 프리라이드 ── */
const K = await t.S(()=>{ const p = playP(); p.sk = { best:{}, real:{}, n:0 }; skateOpen(); const out = {};
  out.잠김 = !document.querySelector('#k-ov [data-dr="free"]');
  p.sk.best.pump = 70; _skate.menu(); out.열림 = !!document.querySelector('#k-ov [data-dr="free"]');
  out.소리 = document.getElementById('k-snd').textContent;                     // 서핑에서 켠 게 그대로
  const g = _skate, run = mode=>{ g.start('free'); const G = g.G; let n = 0;
    while(!G.done && n++ < 60 * 150){ const seg = G.segs[G.i]; g.held = mode === 'perfect' ? !!(seg && G.s >= seg.w0 && G.s <= seg.w1) : mode === 'hold'; g.step(g.FIX); }
    return { 끝:G.done, 턴:G.land, 템포:+g.tempoOf(G.i).toFixed(2), 초:Math.round(G.t), 목숨:G.lives }; };
  out.완벽 = run('perfect'); out.계속누름 = run('hold'); out.안누름 = run('none');
  out.기록 = p.sk.best.free; out.결과 = document.querySelector('#k-ov .go-t')?.textContent;
  return out; });
console.log('스케이트', JSON.stringify(K));
chk(K.잠김 && K.열림 && K.소리 === '🔊', '프리라이드 잠금·소리 공유');
chk(K.완벽.턴 >= 60 && K.완벽.템포 >= 1.5 && K.계속누름.초 < 25 && K.안누름.초 < 25, '프리라이드 난이도');
if(SHOT){ await t.S(()=>{ const g = _skate; g.start('free'); const G = g.G; for(let n = 0; n < 60 * 14 && !G.done; n++){ const seg = G.segs[G.i]; g.held = !!(seg && G.s >= seg.w0 && G.s <= seg.w1); g.step(g.FIX); } G.paused = true; }); await shot('skate-free', '#skate .game-stage');
  await t.S(()=>{ _skate.menu(); }); await shot('skate-menu', '#skate .game-stage'); }
await t.S(()=>skateClose()); await t.sleep(200);
console.log('errs', t.errs, '| bad', bad);
await t.b.close(); process.exit(bad.length || t.errs.length ? 1 : 0);
