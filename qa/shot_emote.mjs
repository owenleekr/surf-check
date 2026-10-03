import { open } from './mock.mjs';
const now=Date.now();
const NM=['김도훈','김태은','박초롱','심재영','이성현','이한솔','이해룡','장은옥'];
const surfers=NM.map((n,i)=>({id:'u'+i,name:n,cohort:'6기',profile:{gender:i%2?'f':'m',emote:[0,3,5].includes(i)?{e:['🔥','🥳','🌊'][[0,3,5].indexOf(i)],at:now-(i*800)}:undefined}}));
const t=await open({surfers},{id:'u4',name:'이성현',profile:{gender:'m',birth:'1',dressed:1}},{wait:2500});
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); setTab('town'); }); await t.sleep(1500);
await (await t.p.$('#pane-town .village')).screenshot({path:'/tmp/emote.png'});
await t.b.close();
