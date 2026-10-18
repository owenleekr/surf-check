/* 💡 개선 요청(feedback.js): 기타·놀이 설정에서 열기, 화면 자동 선택, 보내기 줄 모양(토큰·생일 없음), 30초·하루 10개 제한,
   「내가 보낸 요청」 — 서버(my_feedback) 상태·운영자 답(주입 방어) + 토큰이 없으면 이 기기 기록만 */
import { open } from './mock.mjs';
import fs from 'fs';
const OUT = process.env.SHOT || '/tmp';
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); console.log(c ? '  ✓' : '  ✗', m); };
const XSS = '<img src=x onerror="window.__x=1">';
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }],
  __rpc:{ my_feedback:[{ id:3, cid:'srv1', cat:'bug', text:'캠이 가끔 안 나와요 ' + XSS, screen:'cam', status:'반영됨', reply:'고쳤어요 🙏 ' + XSS, created_at:new Date(Date.now() - 864e5).toISOString() }] } },
  { id:'u4', name:'이성현', profile:{ gender:'f', birth:'990101', dressed:1 } }, { wait:2500 });
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(200);
const fbPosts = () => t.posts.filter(p=>p[0] === 'feedback');

console.log('① 기타에서 열기 · 화면 자동 선택');
await t.S(()=>setTab('food')); await t.sleep(300);
await t.S(()=>document.getElementById('t-more').click()); await t.sleep(200);
ok(await t.S(()=>!!document.querySelector('#more-sheet [data-more="feedback"]')), '기타에 💡 개선 요청');
await t.S(()=>document.querySelector('[data-more="feedback"]').click()); await t.sleep(600);
const s1 = await t.S(()=>({ open:!document.getElementById('fb-sheet').hidden, more:document.getElementById('more-sheet').hidden, scr:document.getElementById('fb-screen').value,
  cats:[...document.querySelectorAll('[data-fbcat]')].map(b=>b.textContent.trim()), list:document.getElementById('fb-list').textContent, imgs:document.querySelectorAll('#fb-list img').length, x:window.__x || 0 }));
console.log('  ', JSON.stringify(s1));
ok(s1.open && s1.more, '개선 요청 창이 열리고 기타는 닫힘');
ok(s1.scr === 'food', '어느 화면 = 지금 탭(맛집)');
ok(s1.cats.join('|') === '😣 불편해요|✨ 이런 기능 원해요|🐞 버그|💛 칭찬', '종류 칩 4개');
ok(/반영됨/.test(s1.list) && /고쳤어요/.test(s1.list) && s1.list.includes('<img src=x'), '서버의 내 요청 — 상태·답');
ok(s1.imgs === 0 && s1.x === 0, '운영자 답·글 주입 방어');
fs.writeFileSync(`${OUT}/trk-feedback.png`, await t.p.screenshot());

console.log('② 보내기');
await t.S(()=>document.getElementById('fb-send').click()); await t.sleep(200);
ok(/골라 주세요/.test(await t.S(()=>document.getElementById('fb-err').textContent)) && !fbPosts().length, '종류 안 고르면 안내 · 안 보냄');
await t.S(()=>{ document.querySelector('[data-fbcat="idea"]').click(); const a = document.getElementById('fb-text'); a.value = '버스 탭에서 돌아오는 차도 한 번에 보고 싶어요'; a.dispatchEvent(new Event('input')); });
ok(/\/500/.test(await t.S(()=>document.getElementById('fb-n').textContent)), '글자 수 표시');
await t.S(()=>document.getElementById('fb-send').click()); await t.sleep(800);
const P = fbPosts();
console.log('   POST', JSON.stringify(P));
ok(P.length === 1, '한 번 보냄');
const row = P[0] && P[0][1];
ok(row && row.user_id === 'u4' && row.name === '이성현' && row.cohort === '6기' && row.cat === 'idea' && row.screen === 'food' && /돌아오는 차/.test(row.text) && row.cid, '줄 모양(아이디·이름·기수·종류·화면·글·cid)');
ok(row && !('token' in row) && !('status' in row) && !('reply' in row) && !JSON.stringify(row).includes('990101'), '토큰·상태·답·생일 없음');
const s2 = await t.S(()=>({ toast:document.getElementById('toast').textContent, text:document.getElementById('fb-text').value, items:document.querySelectorAll('#fb-list .fb-it').length, list:document.getElementById('fb-list').textContent }));
ok(/보냈어요/.test(s2.toast) && s2.text === '' && s2.items === 2 && /돌아오는 차/.test(s2.list), '보낸 뒤 — 토스트·칸 비움·내 목록에 추가');

console.log('③ 제한');
await t.S(()=>{ document.querySelector('[data-fbcat="ux"]').click(); document.getElementById('fb-text').value = '한 번 더'; document.getElementById('fb-send').click(); }); await t.sleep(300);
ok(/천천히/.test(await t.S(()=>document.getElementById('fb-err').textContent)) && fbPosts().length === 1, '30초 안에 또 → 막힘');
await t.S(()=>{ localStorage.setItem('lineup.share.fb.sent', JSON.stringify(Array.from({ length:10 }, (_, i)=>Date.now() - 60e3 * (i + 1)))); document.getElementById('fb-send').click(); }); await t.sleep(300);
ok(/10개/.test(await t.S(()=>document.getElementById('fb-err').textContent)) && fbPosts().length === 1, '하루 10개 → 막힘');

console.log('④ 토큰이 없으면 이 기기 기록만');
await t.S(()=>{ document.getElementById('fb-sheet').hidden = true; ME.token = null; window.feedbackOpen(); }); await t.sleep(400);
const s4 = await t.S(()=>({ list:document.getElementById('fb-list').textContent, items:document.querySelectorAll('#fb-list .fb-it').length }));
ok(s4.items === 1 && /돌아오는 차/.test(s4.list) && !/캠이 가끔/.test(s4.list) && /이 폰에서 보낸 것만/.test(s4.list), '로컬 목록 + 안내');

console.log('⑤ 놀이 › 설정에서도');
await t.S(()=>{ document.getElementById('fb-sheet').hidden = true; setTab('play'); }); await t.sleep(500);
await t.S(()=>document.querySelector('[data-set="feedback"]').click()); await t.sleep(300);
ok(await t.S(()=>!document.getElementById('fb-sheet').hidden && document.getElementById('fb-screen').value === 'play'), '놀이 설정 → 열림 · 화면=놀이');

console.log('errs', t.errs); await t.b.close();
if(t.errs.length) fails.push('page errors');
if(fails.length){ console.log('FAIL', fails); process.exit(1); }
console.log('OK feedback'); process.exit(0);
