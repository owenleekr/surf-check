import { open, dfw } from './mock.mjs';
const parties=[{id:'p1',user_id:'u0',name:'김도훈',date:dfw(2),beach:'인구',time:'06:00',note:'새벽 서핑',joins:[{id:'u0',name:'김도훈',profile:{}},{id:'u1',name:'김태은',profile:{}}],created_at:new Date().toISOString()},
 {id:'p2',user_id:'u0',name:'김도훈',date:dfw(3),beach:'낙산',time:'17:00',note:'선셋',joins:[{id:'u0',name:'김도훈',profile:{}}],created_at:new Date().toISOString()}];
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}],parties},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1}},{wait:2500});
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); setTab('bolt'); }); await t.sleep(700);
const info=()=>t.S(()=>[...document.querySelectorAll('.k-bolt')].map(c=>c.querySelector('.bolt-t').textContent.replace(/\s+/g,' ').trim()+' | '+c.querySelector('.meta:not(.owner .meta)')?.textContent.replace(/\s+/g,' ').trim()));
console.log('전', JSON.stringify(await info()));
await t.S(()=>document.querySelector('[data-bin="p1"]').click()); await t.sleep(900);
console.log('합류 후', JSON.stringify(await info()), '| 토스트', await t.S(()=>document.getElementById('toast').textContent));
console.log('errs',t.errs); await t.b.close();
