import { open, iso } from './mock.mjs';
const drills=[1,2,3].map(n=>({user_id:'u4',name:'이성현',day:iso(n)}));
const play={base:60,bonus:0,badges:{drill1:1},qd:{},qall:0,best:0,gday:'',gxp:0,gn:{},lvSeen:1,xp:60,lv:1};
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}],drills},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1,play}},{wait:3000});
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(400);
console.log('프로필 줄', await t.S(()=>document.getElementById('xp-txt').textContent));
// XP 떠오름 — 훈련 체크
await t.S(()=>document.getElementById('drill-btn').click()); await t.sleep(500);
console.log('XP 플로트', await t.S(()=>({ 보임:!document.getElementById('xpfx').hidden, 글:document.getElementById('xpfx').textContent })));
await t.sleep(2200); console.log('2초 뒤 사라짐', await t.S(()=>document.getElementById('xpfx').hidden));
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(300);
// 스탬프
const beaches=await t.S(()=>SEAS.map(s=>s[0]));
for(const b of [beaches[0],beaches[1],beaches[0],beaches[2]]){
  await t.S(b=>{ const sel=document.getElementById('now-beach'); sel.value=b; document.getElementById('now-btn').click(); }, b); await t.sleep(700);
  await t.S(()=>{ while(!document.getElementById('pop').hidden){ popClose(); } }); await t.sleep(300);
  console.log(' 체크인', b, '→ 스탬프', await t.S(()=>Object.keys(ME.profile.play.stamps||{}).join(',')));
}
console.log('배지', await t.S(()=>Object.keys(ME.profile.play.badges)));
await t.S(()=>openPlay()); await t.sleep(400);
console.log('도감 스탬프', await t.S(()=>[...document.querySelectorAll('.stmp')].map(s=>s.textContent.trim()+(s.classList.contains('on')?'✔':'')).join(' | ')));
await (await t.p.$('#play-sheet .sheet-in')).screenshot({path:'/tmp/stamps.png'});
console.log('errs',t.errs); await t.b.close();
