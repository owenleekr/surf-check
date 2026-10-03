import { open, iso } from './mock.mjs';
const surfers=['김도훈','김태은','이성현'].map((n,i)=>({id:'u'+i,name:n,cohort:'6기',profile:{play:{xp:100+i*80,best:90*i}}}));
const play={base:200,bonus:20,badges:{drill1:1,streak3:1,bolt2:1},qd:{},qall:0,best:240,gday:'',gxp:0,gn:{},lvSeen:2,xp:220,lv:2,shells:34,spent:0,own:{},stamps:{'낙산':'2026-10-01','물치':'2026-10-02'}};
const t=await open({surfers:[...surfers,{id:'u4',name:'이성현',cohort:'6기',profile:{}}]},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1,play}},{wait:2500});
await t.sleep(800); for(let i=0;i<4;i++){ await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(400); } await t.S(()=>openPlay()); await t.sleep(500);
const fs=await import('fs');
for(const k of ['today','collect','rank']){
  await t.S(k=>document.querySelector(`[data-plt="${k}"]`).click(), k); await t.sleep(200); await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(300);
  fs.writeFileSync(`/tmp/plt_${k}.png`, await (await t.p.$('#play-sheet .sheet-in')).screenshot());
  console.log(k, await t.S(()=>({ 보이는섹션:[...document.querySelectorAll('.plpane')].filter(e=>e.offsetParent).map(e=>e.dataset.pane), 시트높이:Math.round(document.querySelector('#play-sheet .sheet-in').scrollHeight) })));
}
console.log('errs',t.errs); await t.b.close();
