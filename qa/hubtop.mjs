import { open } from './mock.mjs';
const day=new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const surfers=[{id:'u4',name:'이성현',cohort:'6기',profile:{}},{id:'u0',name:'김도훈',cohort:'6기',profile:{play:{xp:100,best:300,dbest:{day,score:777}}}},{id:'u1',name:'어제',cohort:'6기',profile:{play:{xp:50,dbest:{day:'2020-01-01',score:999}}}},{id:'u2',name:'악성',cohort:'6기',profile:{play:{dbest:{day:'<img src=x onerror=window.__t=1>',score:'<b>'}}}}];
const t=await open({surfers},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1,play:{base:50,bonus:0,badges:{drill1:1},qd:{},qall:0,best:0,gday:'',gxp:0,gn:{},lvSeen:1,xp:50,lv:1,dbest:{day,score:400}}}},{wait:3000});
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); document.getElementById('t-play').click(); }); await t.sleep(700);
console.log('TOP', await t.S(()=>[...document.querySelectorAll('.dtop div')].map(d=>d.textContent.replace(/\s+/g,' ').trim())), '| 주입', await t.S(()=>window.__t||0));
// defer 로 바뀐 스크립트도 동작
await t.S(()=>document.querySelector('[data-hub="game"]').click()); await t.sleep(400);
console.log('게임 열림', await t.S(()=>!document.getElementById('game').hidden), '| 스크립트 defer', await t.S(()=>[...document.scripts].filter(s=>/surfgame|quiz/.test(s.src)).map(s=>s.defer)));
console.log('errs',t.errs); await t.b.close(); process.exit(0);
