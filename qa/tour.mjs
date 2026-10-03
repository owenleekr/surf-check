import { open, dfw, iso } from './mock.mjs';
const NM=['김도훈','김태은','박초롱','심재영','이성현','이한솔','이해룡','장은옥','전영훈'];
const surfers=NM.map((n,i)=>({id:'u'+i,name:n,cohort:'6기',profile:{gender:i%2?'f':'m',play:i%2?{xp:80+i*60,best:40*i}:undefined,mood:i===3?'오늘 팝업 3번!':undefined}}));
const drills=[]; [0,1,2,3].forEach(n=>drills.push({user_id:'u4',name:'이성현',day:iso(n)})); [0,1,2,3,4,5].forEach(n=>drills.push({user_id:'u0',name:'김도훈',day:iso(n)})); [0,1].forEach(n=>drills.push({user_id:'u2',name:'박초롱',day:iso(n)}));
const rides=[{id:'r1',user_id:'u0',name:'김도훈',cohort:'6기',profile:{},date:dfw(2),dir:'go',depart_at:'06:00',from_place:'별내역, 잠실역',to_place:'인구리',seats:3,riders:[{id:'u1',name:'김태은',profile:{}}],note:'기름값 1/n',created_at:new Date().toISOString()}];
const stays=[{id:'s1',user_id:'u1',name:'김태은',cohort:'6기',profile:{},place:'양양비치콘도',date_from:dfw(1),date_to:dfw(3),capacity:4,guests:[{id:'u4',name:'이성현',profile:{}}],lat:38.10852,lon:128.6413,price:'1인 3만',created_at:new Date().toISOString()}];
const hh=n=>new Date(Date.now()+n*36e5).toTimeString().slice(0,5), dd=n=>new Date(Date.now()+n*36e5-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const parties=[{id:'p1',user_id:'u4',name:'이성현',date:dd(2),beach:'인구',time:hh(2),note:'선셋 서핑해요',joins:[{id:'u4',name:'이성현',profile:{}},{id:'u0',name:'김도훈',profile:{}}],created_at:new Date().toISOString()}];
const chat=[{id:'c1',user_id:'u1',name:'김태은',text:'오늘 파도 좋아요!',profile:{},created_at:new Date().toISOString()}];
const t=await open({surfers,drills,rides,stays,parties,chat},{id:'u4',name:'이성현',profile:{gender:'m',birth:'1',dressed:1}},{wait:3500});
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(600);
for(const tab of ['home','ride','stay','bolt','town','cam']){
  await t.S(tb=>{ setTab(tb); }, tab); await t.sleep(1100);
  await t.p.screenshot({path:`/tmp/tour_${tab}.png`, fullPage:true});
}
await t.b.close();
