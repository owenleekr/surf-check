import { open } from './mock.mjs';
const day=new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const evil='<img src=x onerror=window.__d=1>';
const surfers=[{id:'u4',name:'이성현',cohort:'6기',profile:{}},
  {id:'u0',name:'김도훈',cohort:'6기',profile:{play:{xp:100,best:300,dbest:{day,score:777}}}},
  {id:'u1',name:'어제만',cohort:'6기',profile:{play:{xp:100,best:300,dbest:{day:'2020-01-01',score:999}}}},
  {id:'u2',name:'악성',cohort:'6기',profile:{play:{xp:100,best:50,dbest:{day:evil,score:evil}}}}];
const t=await open({surfers},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',play:{base:80,bonus:0,badges:{drill1:1},qd:{},qall:0,best:0,gday:'',gxp:0,gn:{},lvSeen:2,xp:80,lv:2}}},{wait:2500});
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); gameOpen(); }); await t.sleep(300);
const seq = (daily)=>t.S((daily)=>{ const g=_game; g.begin(daily); const s=g.st; const out=[]; for(let i=0;i<60*30;i++){ const o=s.obs.find(o=>o.x+o.w>48); if(o&&!s.air&&(o.x-52)<s.speed*0.30) g.jump(); g.step(1/60); if(!s.air) g.release(); if(i%90===0) out.push(s.obs.map(o=>o.k[0]+Math.round(o.x)).join(',')+'|'+s.pick.length); if(s.dead) break; } return { 점수:g.score(), 죽음:s.dead, 스냅:out.join(' ; ') }; }, daily);
const a=await seq(true), b=await seq(true), c=await seq(false), d2=await seq(false);
console.log('챌린지 2회 동일?', JSON.stringify(a)===JSON.stringify(b) ? '✅ 완전히 같음 (점수 '+a.점수+')' : '❌ 다름', '| 자유 플레이 2회', JSON.stringify(c)===JSON.stringify(d2)?'(우연히 같음)':'다름 ✅');
// 구명튜브
const sh=await t.S(()=>{ const g=_game; g.begin(false); const s=g.st; const r={}; s.shield=1; s.obs.push({k:'rock',w:12,h:10,y:0,x:44}); g.step(1/60); r.튜브뒤={죽음:s.dead,튜브:s.shield,무적:+s.invuln.toFixed(2),장애물:s.obs.length};
  s.obs.push({k:'rock',w:12,h:10,y:0,x:44}); g.step(1/60); r.무적중충돌={죽음:s.dead};
  for(let i=0;i<60;i++) g.step(1/60); s.obs.push({k:'rock',w:12,h:10,y:0,x:44}); g.step(1/60); r.무적끝충돌={죽음:s.dead}; return r; });
console.log('구명튜브', JSON.stringify(sh));
const sc=await t.S(()=>{ const g=_game; g.begin(false); const s=g.st; for(let k=0;k<5;k++){ s.pick.push({x:44,y:12,got:false}); g.step(1/60); } return { 조개:s.shells, 튜브:s.shield }; });
console.log('조개 5개 → 튜브', JSON.stringify(sc));
// 챌린지 한 판 끝내기 → 기록·XP·순위
await t.S(()=>{ gameClose(); gameOpen(); }); await t.sleep(300);
console.log('시작 화면', await t.S(()=>({버튼:[...document.querySelectorAll('#g-ov button')].map(b=>b.textContent.replace(/\s+/g,' ').trim()), 오늘기록:document.querySelector('#g-ov .go-b b:last-of-type')?.textContent })));
await t.S(()=>document.getElementById('g-go').click()); await t.sleep(100);
await t.S(()=>{ const g=_game; const s=g.st; let n=0; while(!s.dead&&n<60*25){ const o=s.obs.find(o=>o.x+o.w>48); if(o&&!s.air&&(o.x-52)<s.speed*0.30) g.jump(); g.step(1/60); n++; if(!s.air) g.release(); } let m=0; while(!s.dead&&m<600){ g.step(1/60); m++; } }); await t.sleep(1500);
console.log('끝난 뒤', await t.S(()=>({ 제목:document.querySelector('#g-ov .go-t').textContent, 순위줄:[...document.querySelectorAll('#g-ov .go-r span')].map(x=>x.textContent), dbest:ME.profile.play.dbest, dN:ME.profile.play.dN, xp:ME.profile.play.xp })));
await t.S(()=>{ gameClose(); openPlay(); document.querySelector('[data-rk="daily"]').click(); }); await t.sleep(400);
console.log('도감 오늘 순위', await t.S(()=>[...document.querySelectorAll('.prk')].map(r=>r.textContent.replace(/\s+/g,' ').trim())), '| 악성 주입', await t.S(()=>window.__d||0));
console.log('errs',t.errs); await t.b.close();
