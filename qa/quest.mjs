/* 전설의 보드 원정 — 자동으로 여러 판 돌려 어디까지 가는지(난이도), 준비물 고르기·친구·보스·완주 보상(전설 보드)·화면 */
import { open } from './mock.mjs';
import fs from 'fs';
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] }, { id:'u4', name:'이성현', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:2500 });
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); setTab('play'); }); await t.sleep(300);
console.log('놀이 카드', await t.S(()=>document.querySelector('[data-hub="quest"]')?.textContent.replace(/\s+/g,' ').trim()));
await t.S(()=>document.querySelector('[data-hub="quest"]').click()); await t.sleep(300);
fs.writeFileSync('/tmp/q-intro.png', await t.p.screenshot());
const sim = await t.S(()=>{ const q=_quest; q.auto=true; const reach=[], pals={}, foes={}; let wins=0, time=0;
  for(let r=0;r<60;r++){ q.newRun(); let n=0; while(!['win','lose'].includes(q.S.phase) && n++<60*60*30){ if(q.S.phase==='travel'){ q.S.travelT-=q.FIX; q.S.t+=q.FIX; if(q.S.travelT<=0) q.enterStage(q.S.st+1); } else q.step(q.FIX); q.S.pals.forEach(p=>pals[p.k]=(pals[p.k]||0)+0); }
    reach.push(q.S.st+1); if(q.S.phase==='win') wins++; time+=q.S.t; q.S.log.forEach(l=>{ const m=l.t.match(/^(\S+) /); if(m) pals[m[1]]=(pals[m[1]]||0)+1; }); }
  const hist={}; reach.forEach(x=>hist[x]=(hist[x]||0)+1); return { 분포:hist, 완주:wins, 평균판시간:Math.round(time/60)+'초', 로그아이콘:pals }; });
console.log('60판 자동', JSON.stringify(sim));
await t.S(()=>{ _quest.newRun(); }); await t.sleep(400); fs.writeFileSync('/tmp/q-pick.png', await t.p.screenshot());
await t.S(()=>document.querySelector('[data-qb="0"]').click()); await t.sleep(2500); fs.writeFileSync('/tmp/q-run.png', await t.p.screenshot());
console.log('진행 중', await t.S(()=>({ 단계:_quest.S.phase, 체력:document.getElementById('q-hp').textContent, 로그:document.getElementById('q-log').textContent.slice(0, 80) })));
const win = await t.S(()=>{ const q=_quest; q.newRun(); q.choose(0); q.S.hp=q.S.maxHp=99999; let n=0; while(!['win','lose'].includes(q.S.phase) && n++<60*60*40){ if(q.S.phase==='pick') q.choose(0); if(q.S.phase==='travel'){ q.S.travelT-=q.FIX; if(q.S.travelT<=0) q.enterStage(q.S.st+1); } else q.step(q.FIX); } return { 결과:q.S.phase, 기록:ME.profile.play.qb, 잠금:lockOf('boardc','legend') }; });
console.log('완주(무적)', JSON.stringify(win));
await t.sleep(400); fs.writeFileSync('/tmp/q-win.png', await t.p.screenshot());
console.log('errs', t.errs); await t.b.close(); process.exit(0);
