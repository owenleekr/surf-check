/* 난이도 공정성 — 파도 점프 어려움(끝없는 바다)
   ① 완벽한 플레이어(1.5초 앞을 내다보는 봇): 땅에 서 있는 어떤 순간에도 목숨을 안 잃는 길이 있어야 한다(= 피할 수 없는 배치 0).
      예전 판은 미래를 돌려 볼 때 난수가 실제와 어긋나 '본 것과 다른 미래'가 나왔고, 목숨이 줄어도 괜찮다고 봤다 — 이제 난수 상태를 되돌리고 목숨 하나도 아낀다.
   ② 보통 사람(같은 눈 + 손 타이밍이 ±4프레임(≈67ms) 흔들림): 500m 첫 등대는 거의 다, 1400m 첫 문어는 대부분 만나야 한다.
      더 서툰 손(±6프레임)은 참고로만 찍는다.
   ③ 가만히 있거나 연타만 하면 일찍 끝나야 한다(쉽게 뚫리지 않게).
   기준 밖이면 exit 1. 난수는 전부 씨앗을 줘서 돌릴 때마다 같은 숫자가 나온다. */
import { open } from './mock.mjs';
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] }, { id:'u4', name:'테스터', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:2500 });
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); gameOpen(); }); await t.sleep(300);
const res = await t.S(()=>{
  const g = _game; window._gameSim = true;                                     // 연출(물보라 난수)이 코스 난수를 먹지 않게
  let a = 1; const R = ()=>{ a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
  const rnd0 = Math.random; Math.random = R;
  let nz = 99; const NR = ()=>{ nz = (nz * 1103515245 + 12345) & 0x7fffffff; return nz / 0x7fffffff; };   // 손 떨림 — 게임 난수와 따로
  const gauss = ()=>{ let u = 0; for(let i = 0; i < 6; i++) u += NR(); return (u - 3) * Math.SQRT2; };
  /* 미래 돌려 보기 — 상태·난수를 복사해 돌리고 되돌린다. 목숨이 줄거나 큰 보드를 잃으면 실패 */
  const sim = (plan, N)=>{ const c = g.clone(), o = g.swap(c), a0 = a, l0 = c.lost, b0 = c.big; let f = 0;
    for(; f < N; f++){ for(const [j, h] of plan){ if(f === j) g.jump(); if(f === j + h) g.release(); } g.step(g.FIX); if(c.dead || c.lost > l0 || c.big < b0) break; }
    const ok = f === N && c.y > -1; g.swap(o); a = a0; return ok; };
  const HS = [4, 10, 40], N = 90;
  /* 다음 손 — 가만히 둬도 되면 기다리고, 아니면 가장 이른 '되는 칸'의 가운데를 노린다(사람도 그렇게 본다) */
  const plan = ()=>{
    if(sim([], N)) return { wait:true };
    for(const h of HS){ let s0 = -1, s1 = -1;
      for(let j = 0; j <= 44; j++){ const ok = sim([[j, h]], N); if(ok && s0 < 0) s0 = j; if(ok) s1 = j; if(!ok && s0 >= 0) break; }
      if(s0 >= 0) return { j:(s0 + s1) / 2, h }; }
    for(let j1 = 0; j1 <= 24; j1 += 2) for(const h1 of HS) for(let j2 = j1 + 10; j2 <= j1 + 44; j2 += 3) for(const h2 of [4, 40]) if(sim([[j1, h1], [j2, h2]], N)) return { j:j1, h:h1, j2:j2 - j1, h2 };
    return null; };
  const run = (seed, noise, mi, stopAtBoss)=>{
    a = seed * 7919 + 13; g.hard = true; g.begin(false); g.mod = mi; const s = g.st; let f = 0, act = [], until = 0, unav = 0, boss = false;
    while(!s.dead && s.t < 140 && !(stopAtBoss && boss)){
      if(f >= until && !act.length){ const p = plan();
        if(!p){ if(!s.air && !s.on && s.invuln <= 0) unav++; until = f + 1; }                 // 땅에 서서 무적도 아닌데 길이 없다 = 피할 수 없는 순간
        else if(p.wait) until = f + 4;
        else if(p.j > 10) until = f + Math.floor(p.j - 10);                                    // 칸이 아직 멀면 다가올 때 다시 본다
        else { const jf = Math.max(f, Math.round(f + p.j + gauss() * noise)); act = [[jf, 1], [jf + p.h, 0]];
          if(p.j2 != null){ const j2 = Math.round(jf + p.j2 + gauss() * noise); act.push([j2, 1], [j2 + p.h2, 0]); } } }
      for(const x of act) if(x[0] === f) x[1] ? g.jump() : g.release();
      act = act.filter(x=>x[0] > f);
      g.step(g.FIX); f++; if(s.boss) boss = true;
    }
    return { 시간:+s.t.toFixed(0), 거리m:Math.round(s.sd / 10), 등대:s.miles, 문어만남:boss || s.sd >= 14000, 죽음:s.dead, 잃은목숨:s.lost, 피할수없는순간:unav };
  };
  const oracle = []; for(let i = 0; i < g.MODS.length * 2; i++) oracle.push({ 모드:g.MODS[i % g.MODS.length].n, ...run(i + 1, 0, i % g.MODS.length, false) });
  const casual = k=>{ const r = []; for(let i = 0; i < 24; i++) r.push(run(100 + i, k, i % g.MODS.length, true)); return r; };
  const c4 = casual(4), c6 = casual(6);
  const idle = []; for(let i = 0; i < 4; i++){ a = 500 + i; g.begin(false); const s = g.st; while(!s.dead && s.t < 60) g.step(g.FIX); idle.push(+s.t.toFixed(1)); }
  const spam = []; for(let i = 0; i < 4; i++){ a = 600 + i; g.begin(false); g.mod = i; const s = g.st; let f = 0; while(!s.dead && s.t < 140){ if(f % 12 === 0) g.jump(); if(f % 12 === 5) g.release(); g.step(g.FIX); f++; } spam.push(+s.t.toFixed(1)); }
  Math.random = rnd0; window._gameSim = false; g.pause();
  const pct = (r, f)=>Math.round(r.filter(f).length / r.length * 100);
  const sum = r=>({ 등대500m:pct(r, x=>x.거리m >= 500), 문어1400m:pct(r, x=>x.문어만남), 평균m:Math.round(r.reduce((q, x)=>q + x.거리m, 0) / r.length) });
  return { oracle, 보통:sum(c4), 서툰:sum(c6), idle, spam };
});
console.table(res.oracle);
const unav = res.oracle.reduce((q, r)=>q + r.피할수없는순간, 0);
console.log('완벽한 봇 — 피할 수 없는 순간 합계', unav, '| 140초 전에 끝난 판', res.oracle.filter(r=>r.죽음).length);
console.log('보통 손(±4프레임) 24판', JSON.stringify(res.보통), '| 서툰 손(±6프레임)', JSON.stringify(res.서툰));
console.log('가만히 있으면 죽는 시간(초)', res.idle, '| 연타 시간(초)', res.spam);
const ok = unav === 0 && res.oracle.every(r=>!r.죽음) && res.보통.등대500m >= 90 && res.보통.문어1400m >= 70 && Math.max(...res.idle) < 25 && Math.max(...res.spam) < 100;
console.log('결과', ok ? 'OK' : 'FAIL', '| errs', t.errs); await t.b.close(); process.exit(ok && !t.errs.length ? 0 : 1);
