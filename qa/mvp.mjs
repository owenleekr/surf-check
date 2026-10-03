import { open, iso } from './mock.mjs';
// 지난주 월요일 기준 5일씩
const today=new Date(); const dow=(today.getDay()+6)%7; const lastMon=new Date(today); lastMon.setDate(today.getDate()-dow-7);
const day=(k)=>{ const d=new Date(lastMon); d.setDate(lastMon.getDate()+k); return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10); };
const drills=[]; [0,1,2,3,4].forEach(k=>{ drills.push({user_id:'u0',name:'김도훈',day:day(k)}); drills.push({user_id:'u4',name:'이성현',day:day(k)}); });
[0,1].forEach(k=>drills.push({user_id:'u2',name:'박초롱',day:day(k)}));
const hh=n=>new Date(Date.now()+n*36e5).toTimeString().slice(0,5);
const dd=n=>new Date(Date.now()+n*36e5-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const parties=[{id:'p1',user_id:'u0',name:'김도훈',date:dd(1),beach:'인구',time:hh(1),note:'',joins:[{id:'u0',name:'김도훈',profile:{}}],created_at:new Date().toISOString()},
               {id:'p2',user_id:'u2',name:'박초롱',date:dd(30),beach:'낙산',time:hh(30),note:'',joins:[{id:'u2',name:'박초롱',profile:{}}],created_at:new Date().toISOString()}];
const surfers=['u0','u2','u4'].map((id,i)=>({id,name:['김도훈','박초롱','이성현'][i],cohort:'6기',profile:{}}));
const t=await open({surfers,drills,parties},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',play:{base:100,bonus:0,badges:{drill1:1},qd:{},qall:0,best:0,gday:'',gxp:0,gn:{},lvSeen:2,xp:100,lv:2}}},{wait:3000});
await t.S(()=>{ document.getElementById('pop').hidden=true; });
console.log('MVP줄', await t.S(()=>document.querySelector('.mvp')?.textContent.trim()||'(없음)'));
console.log('MVP배지', await t.S(()=>!!ME.profile.play.badges.mvp1), '팝업', await t.S(()=>!document.getElementById('pop').hidden?document.getElementById('pop-t').textContent:'(없음)'));
await t.S(()=>setTab('town')); await t.sleep(1400);
console.log('⚡ 표시', await t.S(()=>[...document.querySelectorAll('.vp')].filter(v=>v.querySelector('.vbolt')).map(v=>v.querySelector('.nm').textContent)));
await t.S(()=>document.querySelector('.vp[data-id="u0"]').click()); await t.sleep(300);
console.log('카드', await t.S(()=>document.querySelector('.vcard').textContent.replace(/\s+/g,' ').trim().slice(0,70)));
console.log('errs',t.errs); await t.b.close();
