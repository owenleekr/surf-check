import { open } from './mock.mjs';
const play={base:300,bonus:0,badges:{drill1:1},qd:{},qall:0,best:0,gday:'',gxp:0,gn:{},lvSeen:3,xp:300,lv:3,shells:55,spent:0,own:{}};
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}]},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1,hair:'bob',hairc:'k',play}},{wait:2500});
t.p.on('dialog', d=>{ console.log('  [확인창]', d.message().replace(/\n/g,' ')); d.accept(); });
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); document.getElementById('bld-fold').open=true; bldTab='wear'; renderBuilder(); }); await t.sleep(500);
console.log('보유 조개', await t.S(()=>shellBal()), '| 모자 칩', await t.S(()=>[...document.querySelectorAll('#bld-opts .perk')].filter(b=>/새싹|파도 모자/.test(b.textContent)).map(b=>b.textContent.trim())));
// 부족: 파도 모자(60) 눌러보기
await t.S(()=>[...document.querySelectorAll('#bld-opts [data-shop]')].find(b=>b.dataset.shop==='hat:wave').click()); await t.sleep(200);
console.log('잔액 부족', await t.S(()=>document.getElementById('toast').textContent));
// 새싹(30) 구매
await t.S(()=>[...document.querySelectorAll('#bld-opts [data-shop]')].find(b=>b.dataset.shop==='hat:sprout').click()); await t.sleep(700);
console.log('구매 후', await t.S(()=>({ 모자:ME.profile.hat, 잔액:shellBal(), own:ME.profile.play.own, spent:ME.profile.play.spent, 새싹칩:[...document.querySelectorAll('#bld-opts [data-k="hat"]')].map(b=>b.textContent.trim()).includes('새싹') })));
await (await t.p.$('#bld-fold')).screenshot({path:'/tmp/shop_hat.png'});
// 보드 색
await t.S(()=>{ bldTab='board'; renderBuilder(); }); await t.sleep(300);
console.log('보드 색 칩', await t.S(()=>[...document.querySelectorAll('#bld-opts .perk')].map(b=>b.textContent.trim()).filter(x=>/노을|바이올렛|골드|네온/.test(x))));
// 랜덤은 안 산 걸 안 뽑는다
const bad=await t.S(()=>{ let n=0; for(let i=0;i<200;i++){ document.getElementById('bld-rand').click(); if(['wave'].includes(ME.profile.hat)||['sunset','violet'].includes(ME.profile.boardc)) n++; } return n; });
console.log('랜덤이 안 산 걸 뽑은 횟수', bad);
// 게임에서 조개 적립
const g=await t.S(()=>playGameDone(120,false,12)); console.log('게임 결과', JSON.stringify(g), '| 보유', await t.S(()=>shellBal()));
console.log('서버로 나간 own 포함 쓰기', t.posts.some(([tb,b])=>tb.startsWith('surfers')&&b.profile.play&&b.profile.play.own&&b.profile.play.own['hat:sprout']));
console.log('errs',t.errs); await t.b.close();
