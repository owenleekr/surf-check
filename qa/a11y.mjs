import { open } from './mock.mjs';
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}]},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1'}},{wait:2500});
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(500);
const act=()=>t.S(()=>{ const a=document.activeElement; return (a.id||a.className||a.tagName)+':'+(a.textContent||'').trim().slice(0,8); });
await t.S(()=>{ setTab('play'); }); await t.sleep(500); await t.S(()=>document.querySelector('[data-hub="badge"]').focus());
await t.p.keyboard.press('Enter'); await t.sleep(300);
console.log('도감 열림 후 포커스', await act(), '| 안쪽?', await t.S(()=>document.getElementById('play-sheet').contains(document.activeElement)));
// Tab 을 40번 눌러도 창 밖으로 나가지 않는다
let out=0; for(let i=0;i<40;i++){ await t.p.keyboard.press('Tab'); if(!await t.S(()=>document.getElementById('play-sheet').contains(document.activeElement))) out++; }
console.log('Tab 40회 중 창 밖으로 샌 횟수', out);
let outS=0; for(let i=0;i<12;i++){ await t.p.keyboard.down('Shift'); await t.p.keyboard.press('Tab'); await t.p.keyboard.up('Shift'); if(!await t.S(()=>document.getElementById('play-sheet').contains(document.activeElement))) outS++; }
console.log('Shift+Tab 12회 중 샌 횟수', outS);
await t.p.keyboard.press('Escape'); await t.sleep(300);
console.log('Esc 후 포커스 복귀(허브 카드여야 함)', await act());
// 팝업
await t.S(()=>{ _popQ.push({ic:'🏅',t:'테스트',d:'확인'}); popNext(); }); await t.sleep(400);
console.log('팝업 보임', await t.S(()=>!document.getElementById('pop').hidden));
console.log('팝업 포커스', await act(), '| 역할', await t.S(()=>document.getElementById('pop').getAttribute('role')));
await t.p.keyboard.press('Enter'); await t.sleep(400);
console.log('팝업 닫힘', await t.S(()=>document.getElementById('pop').hidden));
console.log('토스트 라이브', await t.S(()=>document.getElementById('toast').getAttribute('aria-live')));
console.log('errs',t.errs); await t.b.close();
