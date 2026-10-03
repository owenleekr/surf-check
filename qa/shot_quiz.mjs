import { open } from './mock.mjs';
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}]},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',play:{base:50,bonus:0,badges:{drill1:1},qd:{},qall:0,best:0,gday:'',gxp:0,gn:{},lvSeen:1,xp:50,lv:1}}},{wait:2500});
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); quizOpen(); }); await t.sleep(300);
await t.S(()=>{ const q=document.querySelector('.qz-q').textContent.replace(/^“|”$/g,''); const who=VOICES.find(v=>v[0]===q)[1]; document.querySelector('.qz-o:not([data-s="'+who+'"])').click(); }); await t.sleep(200);
await (await t.p.$('#quiz-sheet .sheet-in')).screenshot({path:'/tmp/quiz1.png'});
await t.b.close();
