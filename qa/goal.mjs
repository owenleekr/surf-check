import { open, iso } from './mock.mjs';
const drills=[]; const U=['u0','u1','u2','u3','u5','u6'];
U.forEach((u,i)=>[0,1,2,3,4].slice(0,i+1).forEach(n=>drills.push({user_id:u,name:'동기'+i,day:iso(n)})));
[1,2,3,4].forEach(n=>drills.push({user_id:'u4',name:'이성현',day:iso(n)}));   // 나: 어제까지 4일 연속, 오늘 아직
const surfers=['u0','u1','u2','u3','u4','u5','u6'].map(id=>({id,name:id,cohort:'6기',profile:{}}));
for(const hour of [10,19]){
  const t=await open({surfers,drills},{id:'u4',name:'이성현',profile:{birth:'1'}},{hour});
  await t.S(()=>{ document.getElementById('pop').hidden=true; });
  console.log('시각',hour, JSON.stringify(await t.S(()=>({ 부제:document.getElementById('drill-sub').textContent, 위험색:document.getElementById('drill-sub').classList.contains('risk'), 목표:document.getElementById('dgoal').textContent.replace(/\s+/g,' ').trim(), 퀘스트3:[...document.querySelectorAll('#qs-ic i')].length }))));
  if(hour===19) await (await t.p.$('#drill')).screenshot({path:'/tmp/goal.png'});
  console.log('  errs',t.errs); await t.b.close();
}
