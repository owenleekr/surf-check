import { open } from './mock.mjs';
const now=Date.now();
const surfers=[{id:'u4',name:'이성현',cohort:'6기',profile:{}},
  {id:'u0',name:'김도훈',cohort:'6기',profile:{emote:{e:'🔥',at:now-3000}}},          // 3초 전 — 보임
  {id:'u1',name:'오래됨',cohort:'6기',profile:{emote:{e:'🌊',at:now-60000}}},         // 1분 전 — 안 보임
  {id:'u2',name:'악성',cohort:'6기',profile:{emote:{e:'<img src=x onerror=window.__e=1>',at:now}}},
  {id:'u3',name:'허용밖',cohort:'6기',profile:{emote:{e:'💀',at:now}}}];
const t=await open({surfers},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',play:{base:50,bonus:0,badges:{drill1:1},qd:{},qall:0,best:0,gday:'',gxp:0,gn:{},lvSeen:1,xp:50,lv:1}}},{wait:2500});
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); setTab('town'); }); await t.sleep(1500);
console.log('남의 이모트', await t.S(()=>[...document.querySelectorAll('.vp')].filter(v=>v.querySelector('.vemo')).map(v=>v.querySelector('.nm').textContent+':'+v.querySelector('.vemo').textContent)));
console.log('주입 실행', await t.S(()=>window.__e||0));
// 내 이모트
await t.S(()=>document.querySelector('.vp.me').click()); await t.sleep(300);
console.log('내 카드 이모트 버튼', await t.S(()=>document.querySelectorAll('.vcard [data-emote]').length));
await t.S(()=>document.querySelector('.vcard [data-emote="🥳"]').click()); await t.sleep(600);
console.log('내 머리 옆', await t.S(()=>document.querySelector('.vp.me .vemo')?.textContent), '| 서버에 나간 쓰기', t.posts.filter(([tb])=>tb.startsWith('surfers')).length, '건, emote 포함', t.posts.some(([tb,b])=>tb.startsWith('surfers')&&b.profile.emote?.e==='🥳'));
// 연타 방지
await t.S(()=>document.querySelector('.vp.me').click()); await t.sleep(200);
await t.S(()=>document.querySelector('.vcard [data-emote="🔥"]').click()); await t.sleep(300);
console.log('연타 시 토스트', await t.S(()=>document.getElementById('toast').textContent), '| 아직 🥳?', await t.S(()=>document.querySelector('.vp.me .vemo')?.textContent));
// 공개 행에는 안 복사
await t.S(()=>{ setTab('town'); document.getElementById('chat-in').value='안녕'; document.getElementById('chat-send').click(); }); await t.sleep(1000);
const chatRows=t.posts.filter(([tb])=>tb.startsWith('chat'));
console.log('채팅 행에 emote 복사', chatRows.some(([,b])=>JSON.stringify(b).includes('emote')) ? '❌' : '없음 ✅');
// 12초 뒤 사라짐 (시계 앞당기기)
await t.S(()=>{ ME.profile.emote.at = Date.now()-13000; renderTown(); }); await t.sleep(300);
console.log('13초 뒤 내 이모트', await t.S(()=>document.querySelector('.vp.me .vemo')?.textContent||'(없음 ✅)'));
console.log('errs',t.errs); await t.b.close();
