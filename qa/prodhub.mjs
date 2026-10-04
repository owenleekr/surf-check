import { open } from './mock.mjs';
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}]},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1}},{wait:3000});
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); document.getElementById('t-play').click(); }); await t.sleep(800);
console.log('운영 놀이 탭', await t.S(()=>({ 카드수:document.querySelectorAll('.hubcard').length, 탭수:document.querySelectorAll('#nav button').length })), 'errs', t.errs);
await t.b.close(); process.exit(0);
