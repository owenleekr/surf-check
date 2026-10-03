import { open } from './mock.mjs';
const play={base:300,bonus:0,badges:{},qd:{},qall:0,best:0,gday:'',gxp:0,gn:{},lvSeen:3,xp:300,lv:3,shells:500,spent:0,own:{'hat:sprout':1,'hat:wave':1,'boardc:sunset':1,'boardc:violet':1}};
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}]},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1,hair:'bob',hairc:'k',play}},{wait:2500});
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); });
const shots=[];
for(const [h,b] of [['sprout','sunset'],['wave','violet'],['band','gold'],['crown','neon']]){
  await t.S((h,b)=>{ ME.profile.hat=h; ME.profile.boardc=b; document.getElementById('bld-fold').open=true; renderBuilder(); }, h, b); await t.sleep(250);
  const png=await (await t.p.$('#bld-av')).screenshot(); shots.push(png);
}
import fs from 'fs'; shots.forEach((p,i)=>fs.writeFileSync(`/tmp/hat${i}.png`,p));
await t.b.close();
