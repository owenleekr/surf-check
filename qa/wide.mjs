import { open, dfw, iso } from './mock.mjs';
import fs from 'fs';
const NM=['김도훈','김태은','박초롱','심재영','이성현'];
const surfers=NM.map((n,i)=>({id:'u'+i,name:n,cohort:'6기',profile:{gender:i%2?'f':'m'}}));
const drills=[0,1,2].map(n=>({user_id:'u4',name:'이성현',day:iso(n)}));
const rides=[{id:'r1',user_id:'u0',name:'김도훈',cohort:'6기',profile:{},date:dfw(2),dir:'go',depart_at:'06:00',from_place:'별내역',to_place:'인구리',seats:3,riders:[],note:'',created_at:new Date().toISOString()}];
for(const W of [768,1280]){
  const t=await open({surfers,drills,rides},{id:'u4',name:'이성현',profile:{gender:'m',birth:'1',dressed:1}},{width:W,height:900,wait:2500});
  await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(400);
  for(const tab of ['home','ride','town']){ await t.S(tb=>setTab(tb),tab); await t.sleep(900); fs.writeFileSync(`/tmp/w${W}_${tab}.png`, await t.p.screenshot()); }
  console.log(W, await t.S(()=>({ 가로넘침:document.documentElement.scrollWidth-innerWidth, 본문폭:Math.round(document.querySelector('.wrap').getBoundingClientRect().width), 탭바폭:Math.round(document.getElementById('nav').getBoundingClientRect().width), 쪽지버튼우측:Math.round(innerWidth-document.getElementById('mail').getBoundingClientRect().right) })), t.errs);
  await t.b.close();
}
