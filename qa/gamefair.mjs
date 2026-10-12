/* 난이도 공정성 — "앞을 1초 내다보는 완벽한 플레이어"가 모든 판을 살아남을 수 있어야 한다(= 피할 수 없는 배치가 없다).
   그리고 아무것도 안 하거나 연타만 하면 일찍 죽어야 한다(= 쉽게 돌파되지 않는다). */
import { open } from './mock.mjs';
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] }, { id:'u4', name:'테스터', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:2500 });
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); gameOpen(); }); await t.sleep(300);
const res = await t.S(()=>{
  const g = _game, out = [];
  const seeded = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
  /* 계획: 점프 목록 [[뛸 프레임, 뗄 프레임(점프 후 몇 프레임), ...]]. 한 번 또는 두 번 연속 점프까지 내다본다 */
  const sim = (jumps, frames)=>{
    const c = g.clone(), o = g.swap(c); window._gameSim = true; let f = 0;
    for(; f < frames; f++){ for(const [j, h] of jumps){ if(f === j) g.jump(); if(f === j + h) g.release(); } g.step(g.FIX); if(c.dead) break; }
    g.swap(o); window._gameSim = false; return f;
  };
  const H = [4, 9, 16, 999], N = 110;
  let plan = null;                                      // 지금 실행 중인 [뛸, 뗄] 오프셋 (프레임 카운터 기준)
  const search = ()=>{
    if(sim([], N) === N) return { wait:true };
    for(let j1 = 0; j1 <= 46; j1++) for(const h1 of H) if(sim([[j1, h1]], N) === N) return { j1, h1 };
    for(let j1 = 0; j1 <= 30; j1 += 2) for(const h1 of H) for(let j2 = j1 + 30; j2 <= j1 + 80; j2 += 3) for(const h2 of H) if(sim([[j1, h1], [j2, h2]], N) === N) return { j1, h1 };
    return null;
  };
  const run = (seedN, modIdx, strat)=>{
    const rnd0 = Math.random; Math.random = seeded(seedN * 7919 + 13);
    g.hard = true; g.begin(false); g.mod = modIdx; const s = g.st; let unavoid = 0, frames = 0, rel = -1, jf = -9;
    while(!s.dead && s.t < 140){
      if(strat === 'oracle'){
        if(rel >= 0 && !s.air && frames > jf + 2) rel = -1;                        // 착지했으면 계획 끝 — 다시 내다본다
        if(!s.air && rel < 0){ const r = search(); if(!r) unavoid++; else if(!r.wait && r.j1 === 0){ g.jump(); rel = r.h1; jf = frames; } }
        if(rel >= 0){ if(rel === 0) g.release(); rel--; if(rel < -1) rel = -1; }
      } else if(strat === 'spam'){ if(frames % 12 === 0) g.jump(); if(frames % 12 === 5) g.release(); }
      g.step(g.FIX); frames++;
    }
    Math.random = rnd0;
    return { 시간:+s.t.toFixed(1), 구간:s.zone, 죽음:s.dead, 피할수없는순간:unavoid, 점수:g.score() };
  };
  for(let i = 0; i < g.MODS.length * 2; i++) out.push({ 모드:g.MODS[i % g.MODS.length].n, ...run(i + 1, i % g.MODS.length, 'oracle') });
  const idle = []; for(let i = 0; i < 4; i++){ g.begin(false); const s = g.st; while(!s.dead && s.t < 60) g.step(g.FIX); idle.push(+s.t.toFixed(1)); }
  const spam = []; for(let i = 0; i < 4; i++) spam.push(run(50 + i, i, 'spam').시간);
  return { out, idle, spam };
});
console.table(res.out); console.log('가만히 있으면 죽는 시간(초)', res.idle, '| 연타 시간(초)', res.spam);
console.log('피할 수 없는 순간 합계', res.out.reduce((a,r)=>a + r.피할수없는순간, 0), '| 완주(140초) 못한 판', res.out.filter(r=>r.죽음).length);
console.log('errs', t.errs); await t.b.close(); process.exit(0);
