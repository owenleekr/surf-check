import { open, iso } from './mock.mjs';
const surfers=[{id:'u4',name:'이성현',cohort:'6기',profile:{}},{id:'u0',name:'김도훈',cohort:'6기',profile:{play:{xp:300,lv:3,best:120}}}];
const drills=[1,2,3].map(n=>({user_id:'u4',name:'이성현',day:iso(n)}));
const t=await open({surfers,drills},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1'}},{wait:3500});
console.log(await t.S(()=>({ 파일:[...document.scripts].map(s=>s.src.split('/').pop()).filter(x=>/play|surfgame/.test(x)), 레벨:document.getElementById('lv-chip')?.textContent, 퀘스트:document.getElementById('qs-t')?.textContent, 목표:document.getElementById('dgoal')?.textContent.replace(/\s+/g,' ').slice(0,40), 게임함수:typeof gameOpen, 잠금함수:typeof lockOf, 왕관:!!HAT.crown })));
await t.S(()=>{ document.getElementById('pop').hidden=true; gameOpen(); }); await t.sleep(400);
console.log('게임 열림', await t.S(()=>!document.getElementById('game').hidden)); console.log('errs',t.errs); await t.b.close();
