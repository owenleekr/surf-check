/* 뒤로가기 — 창만 닫히고 앱은 남는다 · 탭이면 홈으로 · ✕ 로 닫으면 기록이 쌓이지 않는다 */
import { open } from './mock.mjs';
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}]},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1,play:{base:50,bonus:0,badges:{},qd:{},qall:0,best:0,gday:'',gxp:0,gn:{},lvSeen:1}}},{wait:3000});
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); });
const st = ()=>t.S(()=>({ url:location.pathname, tab:state.tab, more:!document.getElementById('more-sheet').hidden, shop:!!document.getElementById('shop-sheet') && !document.getElementById('shop-sheet').hidden, game:!document.getElementById('game').hidden, depth:_backnav.depth, len:history.length }));
await t.S(()=>document.getElementById('t-more').click()); await t.sleep(300);
console.log('기타 열림', await st());
await t.p.goBack(); await t.sleep(400); console.log('뒤로 → 기타 닫힘', await st());
await t.S(()=>shopOpen()); await t.sleep(300); await t.S(()=>document.querySelector('#shop-sheet [data-shclose]').click()); await t.sleep(400);
console.log('✕로 닫음 → 기록 원위치', await st());
await t.S(()=>setTab('food')); await t.sleep(300); await t.p.goBack(); await t.sleep(400); console.log('맛집 탭 → 뒤로 → 홈', await st());
await t.S(()=>gameOpen()); await t.sleep(500); await t.p.goBack(); await t.sleep(500); console.log('게임 → 뒤로 → 닫힘', await st());
await t.S(()=>{ setTab('play'); shopOpen(); }); await t.sleep(400); await t.p.goBack(); await t.sleep(400); console.log('놀이+상점 → 뒤로 → 상점만 닫힘', await st());
await t.p.goBack(); await t.sleep(400); console.log('한 번 더 → 홈', await st());
console.log('errs', t.errs); await t.b.close(); process.exit(0);
