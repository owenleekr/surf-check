import { open } from './mock.mjs';
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}]},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1}},{wait:2500});
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); });
const fut=n=>new Date(Date.now()+n*864e5-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const past=fut(-2), tom=fut(2);
const posts=(tb)=>t.posts.filter(([x])=>x.startsWith(tb)).length;
// 차량
await t.S(()=>setTab('ride')); await t.sleep(300);
const ride=async(d,from='잠실',to='인구')=>{ await t.S((d,f,to)=>{ document.getElementById('r-date').value=d; document.getElementById('r-from').value=f; document.getElementById('r-to').value=to; document.getElementById('r-time').value='06:00'; document.getElementById('r-save').click(); }, d, from, to); await t.sleep(500); return t.S(()=>document.getElementById('r-err').textContent); };
console.log('차량·지난 날짜 →', await ride(past), '| 서버 쓰기', posts('rides'));
console.log('차량·빈 칸 →', await ride(tom,'',''), '| 서버 쓰기', posts('rides'));
await t.S((d)=>{ document.getElementById('r-date').value=d; document.getElementById('r-from').value='잠실'; document.getElementById('r-to').value='인구'; const b=document.getElementById('r-save'); b.click(); b.click(); b.click(); }, tom); await t.sleep(900);
console.log('차량·세 번 연타 → 서버 쓰기', posts('rides'), '(1이어야 함)');
// 숙소
await t.S(()=>setTab('stay')); await t.sleep(300);
await t.S((p)=>{ document.getElementById('s-place').value='테스트'; document.getElementById('s-from').value=p; document.getElementById('s-to').value=p; document.getElementById('s-save').click(); }, past); await t.sleep(400);
console.log('숙소·지난 날짜 →', await t.S(()=>document.getElementById('s-err').textContent), '| 서버 쓰기', posts('stays'));
await t.S((d)=>{ document.getElementById('s-from').value=d; document.getElementById('s-to').value=d; const b=document.getElementById('s-save'); b.click(); b.click(); }, tom); await t.sleep(900);
console.log('숙소·연타 → 서버 쓰기', posts('stays'), '(1이어야 함)');
// 번개
await t.S(()=>setTab('bolt')); await t.sleep(300);
await t.S((p)=>{ document.getElementById('b-date').value=p; document.getElementById('b-save').click(); }, past); await t.sleep(400);
console.log('번개·지난 날짜 →', await t.S(()=>document.getElementById('b-err').textContent), '| 서버 쓰기', posts('parties'));
console.log('errs',t.errs); await t.b.close();
