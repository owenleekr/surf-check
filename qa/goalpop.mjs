import { open, iso } from './mock.mjs';
const drills=[]; ['u0','u1','u2','u3','u5','u6'].forEach((u,i)=>[0,1,2,3,4].slice(0,i+1).forEach(n=>drills.push({user_id:u,name:'동기'+i,day:iso(n)}))); [1,2,3,4].forEach(n=>drills.push({user_id:'u4',name:'이성현',day:iso(n)}));
const surfers=['u0','u1','u2','u3','u4','u5','u6'].map(id=>({id,name:id,cohort:'6기',profile:{}}));
const play={base:80,bonus:0,badges:{drill1:1},qd:{},qall:0,best:0,gday:'',gxp:0,gn:{},lvSeen:2,xp:80,lv:2};
const t=await open({surfers,drills},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',play}},{wait:3500});
console.log('팝업', await t.S(()=>!document.getElementById('pop').hidden?document.getElementById('pop-t').textContent+' | '+document.getElementById('pop-d').textContent.replace(/\n/g,' '):'(없음)'));
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(500);
// 다시 그려도 두 번 주지 않는다
await t.S(()=>{ renderDrill(); renderDrill(); renderHome(); }); await t.sleep(300);
console.log('재렌더 후 팝업', await t.S(()=>!document.getElementById('pop').hidden?document.getElementById('pop-t').textContent:'(없음)'));
console.log('저장', await t.S(()=>({ goalN:ME.profile.play.goalN, goalWk:ME.profile.play.goalWk, 배지:Object.keys(ME.profile.play.badges), xp:ME.profile.play.xp })));
console.log('errs',t.errs); await t.b.close();
// 구경만 한 사람(이번 주 0회)은 못 받는다
const t2=await open({surfers,drills},{id:'u9',name:'구경꾼',profile:{gender:'f',birth:'1',play:{...play}}},{wait:3500});
console.log('구경꾼 팝업', await t2.S(()=>({pop:!document.getElementById('pop').hidden?document.getElementById('pop-t').textContent:'(없음)', goalN:ME.profile.play.goalN||0})));
await t2.b.close();
