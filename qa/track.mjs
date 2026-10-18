/* 📊 사용 기록(track.js): 접속(open) 한 번, 탭·창·메뉴·행동·게임이 모여 events 로 한 번에 나가는지(줄 모양),
   글 내용·전화·생일·토큰이 섞이지 않는지, 같은 세션에 다시 열어도 open 이 또 안 생기는지, 화면을 떠날 때 보내는지, 끄면 안 보내는지 */
import { open } from './mock.mjs';
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); console.log(c ? '  ✓' : '  ✗', m); };
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] },
  { id:'u4', name:'이성현', profile:{ gender:'f', birth:'990101', dressed:1, play:{ base:50, bonus:0, badges:{ drill1:1 }, qd:{}, qall:0, best:0, gday:'', gxp:0, gn:{}, lvSeen:1, xp:50, lv:1 } } }, { wait:3000 });
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(200);
const evs = () => t.posts.filter(p=>p[0] === 'events').flatMap(p=>Array.isArray(p[1]) ? p[1] : [p[1]]);
const flush = async () => { await t.S(()=>window.trackFlush()); await t.sleep(400); await t.S(()=>window.trackFlush()); await t.sleep(300); };

console.log('① 접속');
await flush();
let E = evs();
const opens = E.filter(e=>e.ev === 'open');
console.log('   open', JSON.stringify(opens));
ok(opens.length === 1, 'open 한 번');
ok(opens[0] && opens[0].user_id === 'u4' && opens[0].meta.name === '이성현' && opens[0].meta.co === '6기' && 'pwa' in opens[0].meta && opens[0].meta.os, 'open — 아이디·이름·기수·홈 화면 앱 여부·기기');
ok(opens[0] && Object.keys(opens[0].meta).every(k=>['name', 'co', 'os', 'br', 'pwa', 'v', 'w'].includes(k)), 'open meta 는 정해진 칸만');

console.log('② 탭 · 창 · 메뉴 · 행동');
await t.S(()=>{ setTab('food'); }); await t.sleep(150); await t.S(()=>{ setTab('play'); }); await t.sleep(150);
await t.S(()=>document.getElementById('t-more').click()); await t.sleep(150);
await t.S(()=>document.querySelector('[data-more="kcg"]').click()); await t.sleep(300);
await t.S(()=>{ document.querySelectorAll('.sheet').forEach(s=>s.hidden = true); });
await t.S(()=>sendChat('비밀내용XYZ 010-1234-5678')); await t.sleep(400);
await t.S(()=>document.getElementById('now-btn').click()); await t.sleep(400);
await t.S(()=>{ window.gameOpen(); }); await t.sleep(400);
await t.S(()=>{ playGameDone(123, false, 5, false); }); await t.sleep(100);
await t.S(()=>{ document.getElementById('g-x').click(); }); await t.sleep(200);
await flush();
E = evs();
const has = (ev, target) => E.some(e=>e.ev === ev && e.target === target);
console.log('   ', E.map(e=>`${e.ev}:${e.target || ''}`).join(' '));
ok(has('tab', 'food') && has('tab', 'play'), '탭 food·play');
ok(has('sheet', 'more-sheet'), '창 — 기타 메뉴');
ok(has('menu', 'more:kcg') && has('action', 'kcg_open'), '메뉴 more:kcg + 행동 kcg_open');
ok(has('action', 'chat_send'), '행동 chat_send');
ok(has('action', 'checkin'), '행동 checkin');
ok(has('game_start', 'jump'), 'game_start jump');
const ge = E.find(e=>e.ev === 'game_end');
ok(ge && ge.target === 'jump' && ge.meta.sc === 100 && ge.meta.hard === 0 && typeof ge.meta.dur === 'number', 'game_end — 점수는 구간(123 → 100)·시간');
const raw = JSON.stringify(t.posts.filter(p=>p[0] === 'events'));
ok(!/비밀내용|1234-5678|990101|birth|token|"pw"|lat|lon/.test(raw), '내용·전화·생일·토큰·좌표 없음');
ok(E.every(e=>Object.keys(e).every(k=>['user_id', 'sid', 'ev', 'target', 'meta', 'at'].includes(k)) && e.user_id === 'u4' && e.sid === E[0].sid && !isNaN(Date.parse(e.at))), '줄 모양 {user_id,sid,ev,target,meta,at} · 같은 세션');
ok(E.every(e=>!e.target || e.target.length <= 32) && E.every(e=>!e.meta || Object.values(e.meta).every(v=>typeof v === 'number' || String(v).length <= 24)), '길이 제한');
ok(t.posts.filter(p=>p[0] === 'events').length <= 4, '모아서 보냄(요청 수 적게)');

console.log('③ 다시 열어도 같은 세션이면 open 없음');
const before = t.posts.length;
await t.p.reload({ waitUntil:'networkidle2' }); await t.sleep(2500);
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); }); await flush();
const after = t.posts.slice(before).filter(p=>p[0] === 'events').flatMap(p=>p[1]);
ok(!after.some(e=>e.ev === 'open'), 'open 다시 안 생김');
console.log('④ 30분 넘게 쉬면 새 접속');
await t.S(()=>{ localStorage.setItem('lineup.trk.last', String(Date.now() - 31 * 60e3)); setTab('cam'); }); await t.sleep(200); await flush();
const after2 = t.posts.slice(before).filter(p=>p[0] === 'events').flatMap(p=>p[1]);
ok(after2.filter(e=>e.ev === 'open').length === 1 && after2.every(e=>e.sid !== E[0].sid) && after2.find(e=>e.ev === 'tab').sid === after2.find(e=>e.ev === 'open').sid, '새 sid 로 open 한 번');

console.log('⑤ 화면을 떠날 때 보냄');
await t.S(()=>setTab('home')); await t.sleep(200);
const n5 = t.posts.length;
await t.S(()=>{ Object.defineProperty(document, 'visibilityState', { configurable:true, get:()=>'hidden' }); document.dispatchEvent(new Event('visibilitychange')); }); await t.sleep(500);
ok(t.posts.slice(n5).some(p=>p[0] === 'events' && p[1].some(e=>e.ev === 'tab' && e.target === 'home')), 'visibilitychange→hidden 에 바로 보냄');
await t.S(()=>{ Object.defineProperty(document, 'visibilityState', { configurable:true, get:()=>'visible' }); });

console.log('⑥ 끄기');
await t.S(()=>setTab('play')); await t.sleep(500);
const lbl = await t.S(()=>document.querySelector('[data-set="track"]')?.textContent.replace(/\s+/g, ' ').trim());
console.log('   설정 줄', lbl);
ok(/사용 기록/.test(lbl || '') && /켜짐/.test(lbl || ''), '설정에 「사용 기록 보내기 · 켜짐」');
await t.S(()=>document.querySelector('[data-set="track"]').click()); await t.sleep(300);
ok(await t.S(()=>localStorage.getItem('lineup.share.track') === '0' && /꺼짐/.test(document.querySelector('[data-set="track"]').textContent)), '끄면 저장 · 「꺼짐」');
const n6 = t.posts.length;
await t.S(()=>{ setTab('food'); setTab('cam'); window.gameOpen(); }); await t.sleep(300);
await t.S(()=>document.getElementById('g-x').click()); await flush();
ok(!t.posts.slice(n6).some(p=>p[0] === 'events'), '끈 뒤엔 하나도 안 보냄');
ok(await t.S(()=>window._trk.q.length === 0), '모아 둔 것도 버림');

console.log('errs', t.errs); await t.b.close();
if(t.errs.length) fails.push('page errors');
if(fails.length){ console.log('FAIL', fails); process.exit(1); }
console.log('OK track'); process.exit(0);
