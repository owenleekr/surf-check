import { open, dfw, iso } from './mock.mjs';
const evil='<img src=x onerror=window.__n=1>';
const now=new Date().toISOString(), old=new Date(Date.now()-3*864e5).toISOString(), hr=new Date(Date.now()-3*36e5).toISOString();
const surfers=[['u0','김도훈'],['u1','김태은'],['u2',evil],['u4','이성현']].map(([id,name])=>({id,name,cohort:'6기',profile:{}}));
const drills=['u0','u1','u4'].map(u=>({user_id:u,name:u,day:iso(0)}));
const parties=[{id:'p1',user_id:'u2',name:evil,date:dfw(2),beach:evil,time:'06:00',note:'',joins:[{id:'u2',name:evil,profile:{}}],created_at:now},{id:'p9',user_id:'u0',name:'옛날것',date:dfw(2),beach:'인구',time:'06:00',note:'',joins:[],created_at:old}];
const rides=[{id:'r1',user_id:'u0',name:'김도훈',cohort:'6기',profile:{},date:dfw(3),dir:'go',depart_at:'06:00',from_place:'잠실',to_place:'낙산',seats:3,riders:[],note:'',created_at:hr}];
const t=await open({surfers,drills,parties,rides},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1}},{wait:2800});
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); setTab('town'); }); await t.sleep(1500);
console.log('소식', await t.S(()=>({ 보임:!document.getElementById('news-grp').hidden, 줄:[...document.querySelectorAll('#news li')].map(l=>l.textContent.replace(/\s+/g,' ').trim()) })));
console.log('주입 실행', await t.S(()=>window.__n||0));
await (await t.p.$('#pane-town')).screenshot({path:'/tmp/news.png'});
// 데이터가 없으면 감춘다
const t2=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}]},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1}},{wait:2500});
await t2.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); setTab('town'); }); await t2.sleep(1200);
console.log('빈 마을', await t2.S(()=>document.getElementById('news-grp').hidden));
console.log('errs',t.errs,t2.errs); await t.b.close(); await t2.b.close();
