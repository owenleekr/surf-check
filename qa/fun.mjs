import { open, dfw } from './mock.mjs';
const play={base:60,bonus:0,badges:{drill1:1},qd:{},qall:0,best:0,gday:'',gxp:0,gn:{},lvSeen:1,xp:60,lv:1};
const rides=[{id:'r1',user_id:'u0',name:'김도훈',cohort:'6기',profile:{},date:dfw(3),dir:'go',depart_at:'06:00',from_place:'별내역',to_place:'인구리',seats:2,riders:[{id:'u1',name:'김태은',profile:{}}],note:'',created_at:new Date().toISOString()}];
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}],rides},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1,play}},{wait:2800});
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(300);
// 운세
await t.S(()=>openPlay()); await t.sleep(300);
const f1=await t.S(()=>{ const x=fortune(); return JSON.stringify({별:x.star,해변:x.beach,시간:x.time,색:x.color,조개:x.n}); });
const f2=await t.S(()=>{ const x=fortune(); return JSON.stringify({별:x.star,해변:x.beach,시간:x.time,색:x.color,조개:x.n}); });
console.log('운세 같은 날 일관?', f1===f2?'✅ '+f1:'❌');
const xp0=await t.S(()=>ME.profile.play.xp);
await t.S(()=>document.getElementById('pg-fort').click()); await t.sleep(400);
console.log('열고 나서', await t.S(()=>({ 카드:!!document.querySelector('.fort'), 줄:document.querySelectorAll('.fort > div').length, 버튼남음:!!document.getElementById('pg-fort'), 이전xp:null, xp:ME.profile.play.xp, fortDay:ME.profile.play.fortDay })), 'xp 전', xp0);
await t.S(()=>{ closePlay(); openPlay(); }); await t.sleep(300);
const xp1=await t.S(()=>ME.profile.play.xp); await t.S(()=>{ closePlay(); openPlay(); }); await t.sleep(300);
console.log('다시 열어도 +3 은 한 번', xp1===await t.S(()=>ME.profile.play.xp) ? '✅' : '❌');
await (await t.p.$('#play-sheet .sheet-in')).screenshot({path:'/tmp/fort.png'});
await t.S(()=>closePlay());
// 다른 사람(다른 id)은 다른 운세
const other=await t.S(()=>{ const id=ME.id; ME.id='u9'; const x=fortune(); ME.id=id; return x.beach+x.time+x.n; }); const mine=await t.S(()=>{ const x=fortune(); return x.beach+x.time+x.n; }); console.log('사람마다 다름', other!==mine?'✅':'(우연히 같음)');
// 만석 축하
await t.S(()=>setTab('ride')); await t.sleep(500);
await t.S(()=>document.querySelector('[data-join="r1"]').click()); await t.sleep(900);
console.log('만석', await t.S(()=>({ 토스트:document.getElementById('toast').textContent, 입자:document.querySelectorAll('.burst').length })));
// 숨은 보너스
await t.S(()=>setTab('home')); await t.sleep(400);
const before=await t.S(()=>!!ME.profile.play.secret);
for(let i=0;i<6;i++){ await t.S(()=>document.querySelector('.wrap h1').click()); }
console.log('6번째까지', await t.S(()=>!!ME.profile.play.secret), '(아직 안 열려야 함)');
await t.S(()=>document.querySelector('.wrap h1').click()); await t.sleep(500);
console.log('7번째', await t.S(()=>({ secret:!!ME.profile.play.secret, 배지:!!ME.profile.play.badges.secret1 })));
console.log('errs',t.errs); await t.b.close();
