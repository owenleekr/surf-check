/* 파도 점프 어려움(마리오식 끝없는 바다) — 밟기·옆 충돌(멈추지 않고 계속)·? 상자·이단 점프·발판·소용돌이·등대(멈추지 않는 이정표)·
   주기적 문어 보스(격파 뒤 계속)·목숨 다하면 끝을 하나씩 확인하고,
   앞을 내다보는 봇이 첫 문어를 지나 1500m 등대까지 실제로 갈 수 있는지(= 막힌 코스가 없는지) 돌려 본다.
   봇은 난수 상태까지 되돌려 가며 미래를 돌려 보므로 '내다본 대로' 실제로 흘러간다. 실패하면 exit 1. */
import { open } from './mock.mjs';
const SHOT = process.env.SHOT || '';
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] }, { id:'u4', name:'테스터', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:2500 });
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); gameOpen(); }); await t.sleep(300);
const res = await t.S(()=>{
  const g = _game, out = {}; window._gameSim = true;
  let a = 20261016; const R = ()=>{ a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
  const rnd0 = Math.random; Math.random = R;
  const fresh = ()=>{ g.hard = true; g.begin(false); const s = g.st; s.obs = []; s.pick = []; s.next = 1e9; s.nextItem = 1e9; return s; };
  const run = (s, n, f)=>{ for(let i = 0; i < n; i++){ if(f && f(s)) return true; g.step(g.FIX); } return f ? f(s) : true; };
  const M = g.MILE, [B1, BG] = g.BOSS;
  let s = fresh(); s.y = 26; s.vy = -60; s.air = true; s.obs.push({ k:'jelly', w:10, h:10, y:3, x:58 }); let p0 = s.pts;
  run(s, 40, s=>!s.obs.length); out.밟기 = { 쓰러짐:!s.obs.length, 튕김:s.vy > 100, 점수:Math.round(s.pts - p0), 목숨:s.lives };
  s = fresh(); s.obs.push({ k:'jelly', w:10, h:10, y:3, x:54 }); run(s, 30, s=>s.lives < 3); let d0 = s.sd; run(s, 10);
  out.옆충돌 = { 목숨:s.lives, 무적:s.invuln > 0, 계속흐름:s.sd > d0 + 5, 살아있음:!s.dead };
  s = fresh(); s.blk.push({ k:'blk', x:46, y:34, w:12, h:12, c:'board', used:false, bump:0 }); const b = s.blk[0]; g.jump(); run(s, 40, ()=>b.used);
  out.상자 = { 쳤음:b.used, 큰보드:s.big, 머리박음:s.vy <= 0 };
  s.y = 0; s.air = false; s.vy = 0; s.on = null; s.obs.push({ k:'rock', w:12, h:10, y:0, x:44 }); run(s, 20, s=>s.big === 0); out.상자.맞으면 = { 큰보드:s.big, 목숨:s.lives };
  s = fresh(); g.jump(); run(s, 12); const v1 = s.vy; g.jump(); out.이단점프 = { 썼음:s.dj, 다시솟음:s.vy > v1 && s.vy > 200 }; g.release();
  s = fresh(); s.plat.push({ k:'wood', x:120, y:24, by:24, w:60 }); g.jump(); run(s, 90, s=>s.on && s.on.k === 'wood'); out.발판 = { 올라섬:!!(s.on && s.on.k === 'wood'), 높이:Math.round(s.y) }; g.release();
  s = fresh(); s.hole.push({ x:44, w:30 }); run(s, 40, s=>s.lives < 3); run(s, 60); out.소용돌이 = { 빠짐:s.lost === 1, 목숨:s.lives, 다시떠오름:s.y >= 0, 살아있음:!s.dead };
  // 등대 — 500m 째에 정확히 지나가고, 세계는 한 프레임도 멈추지 않는다(조개 보너스·다음 마을)
  s = fresh(); s.sd = M - 300; let sh0 = s.shells, stall = 0, prev = s.sd - 1, at = -1; run(s, 400, s=>{ if(s.sd <= prev) stall++; prev = s.sd; if(s.miles && at < 0) at = s.sd; return s.miles >= 1 && s.sd > at + 200; });
  out.등대 = { 지남:s.miles, 위치m:Math.round(at / 10), 조개:s.shells - sh0, 구간:s.zone, 멈춘프레임:stall, 다음:s.nextMile };
  // 보스 — 1400m에 나오고, 쓰러뜨리면 보너스 뒤 그대로 계속. 다음 문어는 더 세다
  s = fresh(); s.sd = B1 - 5; run(s, 5, s=>!!s.boss); const bz = s.boss ? { 체력:s.boss.hp, 단계:s.boss.lv } : null; s.lives = 9;
  let p1 = s.pts; s.fx.star = 99; const B = s.boss; B.ph = 'wait'; B.x = 40; B.t = 0;
  run(s, 1200, s=>{ if(s.boss){ s.boss.x = 40; s.boss.y = 4; s.boss.hurt = 0; if(s.boss.ph !== 'die'){ s.boss.ph = 'wait'; s.boss.t = 0; } } return !s.boss; });
  let d1 = s.sd; s.fx.star = 0; run(s, 30);
  out.보스 = { 나옴:!!bz, 첫체력:bz && bz.체력, 격파:s.bossN, 보너스:Math.round(s.pts - p1), 다음보스:s.nextBoss, 계속:s.sd > d1 + 10 && !s.dead, 스폰재개:s.next < 1e3 };
  s.sd = s.nextBoss - 2; s.fx.star = 0; run(s, 3, s=>!!s.boss); out.보스.두번째 = s.boss ? { 체력:s.boss.hp, 단계:s.boss.lv } : null;
  // 목숨이 다하면 끝(되살아나는 깃발 없음)
  s = fresh(); s.lives = 1; s.obs.push({ k:'rock', w:12, h:10, y:0, x:44 }); run(s, 30, s=>s.dead); out.끝 = { 끝남:s.dead, 목숨:s.lives };

  /* 봇 — 1초 남짓 앞을 돌려 보고 목숨을 안 잃는 점프(이단 점프 포함)를 고른다. 보스 땐 문어 체력을 가장 깎는 쪽 */
  const sim = (plan, N)=>{ const c = g.clone(), o = g.swap(c), a0 = a, l0 = c.lost; let f = 0;
    for(; f < N; f++){ for(const [j, h] of plan){ if(f === j) g.jump(); if(f === j + h) g.release(); } g.step(g.FIX); if(c.dead || c.resp > 0 || c.lost > l0) break; }
    const r = { ok:f === N && c.y > -1, hp:c.boss ? c.boss.hp : c.bossN > o.bossN ? 0 : 9 }; g.swap(o); a = a0; return r; };
  const HS = [3, 8, 14, 999], N = 100;
  const search = s=>{ const boss = !!s.boss || s.sd > s.nextBoss - 200; let best = null;
    const w = sim([], N); if(w.ok){ if(!boss) return { wait:true }; best = { wait:true, hp:w.hp }; }
    for(let j1 = 0; j1 <= 40; j1++) for(const h1 of HS){ const r = sim([[j1, h1]], N); if(r.ok){ if(!boss) return { j1, h1 }; if(!best || r.hp < best.hp) best = { j1, h1, hp:r.hp }; } }
    if(best) return best;
    for(let j1 = 0; j1 <= 24; j1 += 2) for(const h1 of HS) for(let j2 = j1 + 8; j2 <= j1 + 50; j2 += 3) for(const h2 of HS) if(sim([[j1, h1], [j2, h2]], N).ok) return { j1, h1, j2, h2 };
    return null; };
  const bot = seed=>{
    a = seed; g.hard = true; g.begin(false); const s = g.st, T0 = performance.now(), stage = [], GOAL = 3 * M + 300;
    let f = 0, act = [], until = 0, stuck = 0, z = 0, zt = 0, last = null, frozen = 0, pd = 0; const dbg = [];
    while(!s.dead && !(s.bossN >= 1 && s.sd >= GOAL) && s.t < 600 && performance.now() - T0 < 140000){
      if(f >= until){ const r = search(s); last = { f, r };
        if(!r){ if(!stuck && dbg.length < 4) dbg.push({ 막힘f:f, m:+(s.sd / 10).toFixed(1), y:+s.y.toFixed(1), vy:Math.round(s.vy), air:s.air, dj:s.dj, on:s.on && s.on.k, boss:!!s.boss, obs:s.obs.map(o=>o.k + '@' + Math.round(o.x) + ',' + Math.round(o.y)).join(' '), hole:s.hole.map(h=>Math.round(h.x) + '+' + h.w).join(' '), plat:s.plat.map(p=>p.k + '@' + Math.round(p.x) + ',' + p.y + 'w' + p.w).join(' '), blk:s.blk.map(b=>Math.round(b.x) + ',' + b.y).join(' ') }); stuck++; act = []; until = f + 1; }
        else if(r.wait){ act = []; until = f + 20; }
        else { act = [[f + r.j1, 1], [f + r.j1 + r.h1, 0]]; if(r.j2 != null) act.push([f + r.j2, 1], [f + r.j2 + r.h2, 0]); until = f + (r.j2 != null ? r.j2 : r.j1) + 2; } }
      for(const [ff, k] of act) if(ff === f) k ? g.jump() : g.release();
      const lo = s.lost; pd = s.sd; g.step(g.FIX); f++; if(!s.dead && s.sd <= pd) frozen++;
      if(s.lost > lo && dbg.length < 4) dbg.push({ f, t:+s.t.toFixed(1), m:Math.round(s.sd / 10), why:s.pops.map(p=>p.v).join('|'), last, until, air:s.air, y:+s.y.toFixed(1) });
      if(s.miles !== z){ stage.push(+(s.t - zt).toFixed(0)); z = s.miles; zt = s.t; }
    }
    return { 도달:!s.dead && s.bossN >= 1 && s.sd >= GOAL, 거리m:Math.round(s.sd / 10), 등대:s.miles, 문어:s.bossN, 시간초:+s.t.toFixed(0), 등대별초:stage.join('/'), 멈춘프레임:frozen, 속도:Math.round(s.speed), 잃은목숨:s.lost, 막힘:stuck, 조개:s.shells, 점수:g.score(), 걸린ms:Math.round(performance.now() - T0), dbg };
  };
  out.봇 = [bot(11), bot(4242)];
  Math.random = rnd0; window._gameSim = false; g.pause();
  return out;
});
console.log(JSON.stringify(res, null, 1));
const r = res, ok = r.밟기.쓰러짐 && r.밟기.튕김 && r.밟기.목숨 === 3 && r.옆충돌.목숨 === 2 && r.옆충돌.무적 && r.옆충돌.계속흐름 && r.옆충돌.살아있음
  && r.상자.쳤음 && r.상자.큰보드 === 1 && r.상자.맞으면.큰보드 === 0 && r.상자.맞으면.목숨 === 3
  && r.이단점프.썼음 && r.이단점프.다시솟음 && r.발판.올라섬 && r.소용돌이.빠짐 && r.소용돌이.목숨 === 2 && r.소용돌이.다시떠오름 && r.소용돌이.살아있음
  && r.등대.지남 === 1 && Math.abs(r.등대.위치m - 500) <= 1 && r.등대.조개 >= 5 && r.등대.구간 === 2 && r.등대.멈춘프레임 === 0
  && r.보스.나옴 && r.보스.첫체력 === 3 && r.보스.격파 === 1 && r.보스.보너스 >= 5000 && r.보스.계속 && r.보스.스폰재개 && r.보스.다음보스 === 14000 + 15000 && r.보스.두번째 && r.보스.두번째.체력 === 4
  && r.끝.끝남 && r.끝.목숨 === 0
  && r.봇.every(b=>b.도달 && b.멈춘프레임 === 0);
if(SHOT){   // 화면 3장 + 몽타주 — 상자·발판·꽃게 / 보스 / 등대 통과(멈추지 않음)
  const shot = async (name, fn)=>{ await t.S(fn); await t.sleep(160); await (await t.p.$('#game .game-stage')).screenshot({ path:`${SHOT}/hard-${name}.png` }); };
  const base = `(z)=>{ const g=_game; g.hard=true; g.begin(false); g.vis.ban=null; const s=g.st; s.next=1e9; s.nextItem=1e9; s.zone=z; s.sd=(z-1)*_game.MILE+900; s.miles=z-1; s.nextMile=z*_game.MILE; s.nextBoss=1e9; g.setTheme(['day','noon','sunset','night','aurora'][z-1]); return s; }`;
  await shot('course', new Function(`const s=(${base})(2); s.shells=37; s.blk.push({k:'blk',x:70,y:36,w:12,h:12,c:'star',used:false,bump:0},{k:'blk',x:82,y:36,w:12,h:12,c:'coin',used:true,bump:.09});
    const p={k:'wood',x:112,y:26,by:26,w:52}; s.plat.push(p); s.obs.push({k:'crab',w:12,h:8,y:26,x:130,pl:p,off:18,dir:1},{k:'fish',w:12,h:7,y:28,x:150,ft:.45,A:34}); s.hole.push({x:96,w:30}); s.big=1;
    s.pick.push({x:62,y:6,got:false},{x:72,y:6,got:false},{x:120,y:34,got:false}); s.y=30; s.vy=40; s.air=true; s.fx.star=0;`));
  await shot('boss', new Function(`const s=(${base})(5); s.sd=_game.BOSS[0]+_game.BOSS[1]; s.bossN=1; s.nextMile=6*_game.MILE; s.boss={x:104,y:2,w:30,h:26,hp:3,mx:4,lv:1,ph:'wait',t:.2,hurt:0,shot:1}; s.obs.push({k:'ink',w:8,h:8,y:0,x:84,vx:80}); s.y=44; s.vy=10; s.air=true; s.fx.star=4; s.lives=4;`));
  await shot('mile', new Function(`const s=(${base})(3); s.sd=2*_game.MILE+20; s.miles=2; s.nextMile=3*_game.MILE; s.marks.push({k:'goal',x:26,hit:true,m:1000,ht:.3}); _game.vis.ban={t:.6,top:'🏮 1000m 통과 · 🐚+5',name:'노을 하조대',sm:1}; s.y=0; s.shells=58; s.fx.star=9;`));
  await t.S(()=>_game.pause());
  const fs = await import('fs'); const imgs = ['course', 'boss', 'mile'].map(n=>'data:image/png;base64,' + fs.readFileSync(`${SHOT}/hard-${n}.png`).toString('base64'));
  const pg = await t.b.newPage(); await pg.setViewport({ width:1200, height:520 });
  await pg.setContent(`<body style="margin:0;background:#0b1830;display:flex;gap:12px;padding:12px">${imgs.map(s=>`<img src="${s}" style="height:496px">`).join('')}</body>`);
  await pg.screenshot({ path:`${SHOT}/hard-montage.png`, fullPage:true });
}
console.log('결과', ok ? 'OK' : 'FAIL', '| errs', t.errs); await t.b.close(); process.exit(ok && !t.errs.length ? 0 : 1);
