import { open } from './mock.mjs';
const day=new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const surfers=[{id:'u4',name:'이성현',cohort:'6기',profile:{}},{id:'u0',name:'김도훈',cohort:'6기',profile:{play:{xp:100,best:300,dbest:{day,score:777}}}}];
const t=await open({surfers},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',play:{base:80,bonus:0,badges:{drill1:1},qd:{},qall:0,best:120,gday:'',gxp:0,gn:{},lvSeen:2,xp:80,lv:2}}},{wait:2500});
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); gameOpen(); }); await t.sleep(400);
await (await t.p.$('.game-stage')).screenshot({path:'/tmp/gs_start.png'});
await t.S(()=>{ _game.setTheme('day'); document.getElementById('g-go').click(); _game.setTheme('day'); const g=_game, s=g.st; s.shield=1; for(let i=0;i<200;i++){ const o=s.obs.find(o=>o.x+o.w>48); if(o&&!s.air&&(o.x-52)<s.speed*0.30) g.jump(); g.step(1/60); if(!s.air) g.release(); } }); await t.sleep(200);
await (await t.p.$('.game-stage')).screenshot({path:'/tmp/gs_run.png'});
await t.b.close();
