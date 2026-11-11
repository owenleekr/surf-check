/* 🎁 11.11 낙산 해변 빼빼로 선물 — 따로 선 페이지(pepero.html + pepero-app.js)와 SurfShare 홈 띠(pepero.js).
   이름 찾기(명단·코치·뺀 이름) → 남자/여자 탭 캐릭터 → 탐험(보드 넷 → 패들 → 세트 → 리시 ×3) → 선물 · place_talk 한 줄(이름당 하나) ·
   서버에 그 이름 줄이 있으면 안 뽑음 · 다시 열면 같은 결과 · 스토리 그림 1080×1920 · 영상 · 이스케이프 · 좁은 폭 · 기간 밖.
   SHOTS=<폴더> 를 주면 화면·그림·영상을 거기 저장한다 */
import puppeteer from 'puppeteer-core';
import { open as openApp } from './mock.mjs';
import fs from 'fs';
const SH = process.env.SHOTS || ''; if(SH) fs.mkdirSync(SH, { recursive:true });
const shot = (p, n) => SH ? p.screenshot({ path:`${SH}/${n}.png` }) : null;
const BASE = process.env.BASE || 'http://localhost:8765', PAGE = process.env.BASE ? BASE + '/pepero' : BASE + '/pepero.html';
const clock = t => { const off = t - Date.now(), N = Date.now.bind(Date); Date.now = () => N() + off; };
const ON = Date.parse('2026-11-11T12:00:00+09:00'), OFF = Date.parse('2026-11-20T12:00:00+09:00');
const now = new Date().toISOString();
const talk = [{ id:'x|1', target:'ft:abc', user_id:'x', name:'맛집러', text:'맛집 후기', created_at:now },
  { id:'kim|1', target:'pepero:2026', user_id:'kim', name:'<img src=x onerror=alert(1)>김', cohort:'6기', text:'p2|🍫 2등 <b>빼빼로</b> 1개', created_at:now }];
let fail = 0; const ok = (c, m) => { console.log((c ? '✔' : '✘') + ' ' + m); if(!c) fail++; };
const CORS = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'*', 'Access-Control-Allow-Methods':'*' };
/* 페이지 열기 — supabase 는 가짜로 받는다(place_talk 읽기 · 쓰기 기록) */
async function page(rows, opts = {}){
  const b = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new', args:['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(), errs = [], posts = [], rpcs = [];
  const RPC = Object.assign({ gift_claim:()=>[200, { kind:'br', mine:true }], gift_open:()=>[200, 'data:image/jpeg;base64,/9j/AAAA'] }, opts.rpc || {});
  p.on('pageerror', e=>errs.push(String(e).slice(0, 160)));
  p.on('console', m=>{ if(m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errs.push('console:' + m.text().slice(0, 140)); });
  await p.setViewport({ width:opts.width || 390, height:opts.height || 844, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  await p.setRequestInterception(true);
  p.on('request', r=>{ const u = r.url(), m = r.method();
    if(!u.includes('supabase')) return r.continue();
    if(m === 'OPTIONS') return r.respond({ status:204, headers:CORS, body:'' });
    if(m === 'POST' && u.includes('/rpc/')){ const fn = u.split('/rpc/')[1].split('?')[0], body = JSON.parse(r.postData() || '{}'); rpcs.push([fn, body]); const [st, js] = RPC[fn](body); return r.respond({ status:st, headers:CORS, contentType:'application/json', body:JSON.stringify(js) }); }
    if(m === 'POST'){ try{ posts.push([u.split('rest/v1/')[1], JSON.parse(r.postData())]); }catch(e){} return r.respond({ status:201, headers:CORS, body:'' }); }
    return r.respond({ status:200, headers:CORS, contentType:'application/json', body:JSON.stringify(rows) }); });
  await p.evaluateOnNewDocument(clock, opts.at || ON);
  await p.goto(PAGE, { waitUntil:'domcontentloaded' }); await p.evaluate(()=>localStorage.clear());
  await p.goto(PAGE + (opts.q || ''), { waitUntil:'networkidle2' });
  const S = (f, ...a) => p.evaluate(f, ...a), sleep = ms => new Promise(r=>setTimeout(r, ms));
  return { b, p, errs, posts, rpcs, S, sleep };
}
/* 출발부터 공개까지 빨리 */
async function playThrough(S, sleep){
  await S(()=>document.querySelector('[data-pgo]').click()); await sleep(300);
  await S(()=>{ for(let i = 0; i < 4; i++) _pepero.walk(); }); await sleep(1900);
  await S(()=>{ for(let i = 0; i < 5; i++) _pepero.paddle(); }); await sleep(3200);
  await S(()=>{ for(let i = 0; i < 3; i++) _pepero.pull(); }); await sleep(1700);
}
const blob = (S, fn) => S(async f => { const b = await window._pepero[f](); const a = new Uint8Array(await b.arrayBuffer()); let s = ''; for(let i = 0; i < a.length; i += 32768) s += String.fromCharCode(...a.subarray(i, i + 32768));
  let w = 0, h = 0; if(/image/.test(b.type)){ const im = await createImageBitmap(b); w = im.width; h = im.height; } return { type:b.type, size:b.size, w, h, b64:btoa(s) }; }, fn);
const pickName = async (S, sleep, n) => { await S(n=>document.querySelector(`[data-name="${n}"]`).click(), n); await sleep(300); };

/* 1) 이름 → 캐릭터 → 탐험 → 선물 → 내보내기 */
{ const { b, p, errs, posts, rpcs, S, sleep } = await page(talk);
  const en = await S(()=>({ names:[...document.querySelectorAll('[data-name]')].map(x=>x.dataset.name), coach:document.querySelectorAll('.pp-name small').length, grp:[...document.querySelectorAll('.pp-grp')].map(x=>x.textContent).join(),
    wall:document.querySelectorAll('#pep-wall .pep-w').length }));
  ok(en.names.length === 24 && !en.names.includes('이성현') && !en.names.includes('루비') && en.names.includes('김도훈') && en.coach === 6 && en.grp === '양양서핑학교 6기,코치·매니저', `명단 24명(6기 18 + 코치·매니저 6, 이성현·루비 등 뺌): ${en.names.length}`);
  await shot(p, 'pepero-1-enter');
  await S(()=>document.getElementById('pp-snd').click());
  ok(await S(()=>document.getElementById('pp-snd').getAttribute('aria-pressed') === 'true' && localStorage.getItem('lineup.pepero.sound') === '1'), '🔊 배경 음악 켜기 · 기억');
  await S(()=>document.getElementById('pp-snd').click());
  ok(await S(()=>document.getElementById('pp-snd').textContent === '🔇' && localStorage.getItem('lineup.pepero.sound') === '0'), '🔇 끄기');
  ok(await S(()=>/매니저/.test(document.querySelector('[data-name="김법성"]').textContent) && /교장/.test(document.querySelector('[data-name="이승대"]').textContent)), '이승대 교장 · 김법성 매니저 표시');
  await p.type('#pp-q', '진혁'); await sleep(200);
  const q = await S(()=>[...document.querySelectorAll('[data-name]')].map(x=>x.textContent));
  ok(q.length === 1 && /장진혁/.test(q[0]) && /코치/.test(q[0]), '이름 찾기 「진혁」 → 장진혁 코치: ' + q.join(','));
  await pickName(S, sleep, '장진혁');
  const lk = await S(()=>({ on:!document.getElementById('pp-look').hidden, who:document.getElementById('pp-who').textContent, tabs:[...document.querySelectorAll('[data-pg]')].map(x=>x.textContent + ':' + x.getAttribute('aria-selected')), n:document.querySelectorAll('.pp-look img').length }));
  ok(lk.on && /장진혁/.test(lk.who) && lk.n === 4 && lk.tabs.join() === '남자:false,여자:true', '캐릭터 고르기 — 남자/여자 탭, 넷씩(클레이 그림): ' + JSON.stringify(lk));
  await S(()=>document.querySelector('[data-pg="m"]').click()); await S(()=>document.querySelector('[data-pl="2"]').click());
  const lk2 = await S(()=>({ tab:document.querySelector('[data-pg="m"]').getAttribute('aria-selected'), on:document.querySelector('.pp-look.on')?.dataset.pl, pressed:document.querySelector('[data-pl="2"]').getAttribute('aria-pressed') }));
  ok(lk2.tab === 'true' && lk2.on === '2' && lk2.pressed === 'true', '남자 탭 → 세 번째 캐릭터 고름');
  await shot(p, 'pepero-2-look');
  await S(()=>document.querySelector('[data-plook]').click()); await sleep(900);
  const pl = await S(()=>({ on:!document.getElementById('pp-play').hidden, cv:document.getElementById('pep-cv').width > 0, go:!!document.querySelector('[data-pgo]:not([disabled])'), me:document.getElementById('pp-me').textContent,
    saved:JSON.parse(localStorage.getItem('lineup.pepero.me')), w:document.getElementById('pep-wall'), }));
  ok(pl.on && pl.cv && pl.go && /서프 버디 장진혁 · 코치/.test(pl.me) && pl.saved.name === '장진혁' && pl.saved.g === 'm' && pl.saved.li === 2, '출발 → 탐험 화면 + 이름·캐릭터 기억');
  const wl = await S(()=>{ const w = document.getElementById('pep-wall'); return { n:w.querySelectorAll('.pep-w').length, xss:!!w.querySelector('img, b b, span b'), food:w.textContent.includes('맛집'), txt:w.textContent }; });
  ok(wl.n === 1 && !wl.food && !wl.xss && /<img/.test(wl.txt), '당첨 소식: 이벤트 줄만, 글자는 이스케이프');
  await shot(p, 'pepero-3-intro');
  await S(()=>document.querySelector('[data-pgo]').click()); await sleep(400);
  ok(await S(()=>_pepero.S.ph) === 'walk', '해변으로 출발 → 모래사장 걷기');
  for(let i = 0; i < 4; i++){ await S(()=>document.querySelector('[data-pstep]').click()); await sleep(150); }
  ok(/1111/.test(await S(()=>document.getElementById('pep-hint').textContent)), '보드 넷 지나기 → 「1111」');
  await sleep(1800);
  ok(await S(()=>_pepero.S.ph) === 'paddle', '→ 라인업까지 패들');
  await shot(p, 'pepero-4-paddle');
  for(let i = 0; i < 5; i++){ await S(()=>{ const bt = document.querySelector('[data-ppad]'); bt.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true })); bt.dispatchEvent(new PointerEvent('pointerup', { bubbles:true })); }); await sleep(120); }
  ok(await S(()=>_pepero.S.ph) === 'wait', '패들 5번 → 세트 기다리기');
  await sleep(3200);
  ok(await S(()=>_pepero.S.ph) === 'tug' && /발밑에 뭔가 걸렸어요/.test(await S(()=>document.getElementById('pep-hint').textContent)), '「어? 리시가 묵직해요 — 발밑에 뭔가 걸렸어요」');
  await shot(p, 'pepero-5-tug');
  ok(!posts.some(x=>x[0].startsWith('place_talk')), '끌어올리기 전엔 아무것도 안 보냄');
  await S(()=>document.getElementById('pep-cv').click()); await sleep(100);   // 그림을 눌러도 당겨진다
  for(let i = 0; i < 2; i++){ await S(()=>document.querySelector('[data-ppull]').click()); await sleep(100); }
  await sleep(1700);
  const rv = await S(()=>({ ph:_pepero.S.ph, res:_pepero.res, card:document.querySelector('.pep-res')?.textContent.replace(/\s+/g, ' '), open:!!document.querySelector('[data-popen]') }));
  ok(rv.ph === 'reveal' && rv.res && rv.res.id === 'br' && rv.res.mine === true && /베스킨라빈스 싱글레귤러/.test(rv.card) && rv.open, '선물 공개(서버가 정한 종류) + 기프티콘 열기 버튼: ' + rv.card);
  const cl = rpcs.filter(x=>x[0] === 'gift_claim');
  ok(cl.length === 1 && cl[0][1].p_name === '장진혁' && /^[0-9a-f]{32}$/.test(cl[0][1].p_token) && await S(t=>localStorage.getItem('lineup.pepero.tok:장진혁') === t, cl[0][1].p_token), 'gift_claim 한 번 · 32자 열쇠를 먼저 기기에 저장');
  await shot(p, 'pepero-6-reveal');
  const pt = posts.filter(x=>x[0].startsWith('place_talk')), row = pt[0] && pt[0][1];
  ok(pt.length === 1 && row.id === 'pepero26:장진혁' && row.target === 'pepero:2026' && row.user_id === 'roster:장진혁' && row.name === '장진혁' && row.cohort === '코치' && /^br\|🍦 베스킨라빈스 아이스크림$/.test(row.text) && !isNaN(Date.parse(row.created_at)), 'place_talk 한 줄(이름당 id): ' + JSON.stringify(row));
  ok(await S(()=>document.querySelectorAll('#pep-wall .pep-w').length) === 2, '내 당첨이 소식에 바로 보임');
  /* 기프티콘 열기 — 화면에만, 닫으면 지움, 기기에 안 남김 */
  await S(()=>document.querySelector('[data-popen]').click()); await sleep(500);
  const gm = await S(()=>{ const m = document.getElementById('pp-gc'), im = m.querySelector('img'); return { on:!m.hidden, src:im.getAttribute('src') || '', menu:!!im.getAttribute('oncontextmenu'), call:/#pp-gc|pp-gc-in img\{[^}]*-webkit-touch-callout:none/.test(document.querySelector('style').textContent) ? 'none' : '' }; });
  ok(gm.on && /^data:image\/jpeg/.test(gm.src) && gm.menu && gm.call === 'none' && rpcs.filter(x=>x[0] === 'gift_open').length === 1, '기프티콘 열기 → 큰 그림(길게 누르기 막음)');
  await shot(p, 'pepero-7-gifticon');
  await S(()=>document.querySelector('[data-pgclose]').click()); await sleep(200);
  ok(await S(()=>document.getElementById('pp-gc').hidden && !document.querySelector('#pp-gc img').getAttribute('src') && !Object.values(localStorage).some(v=>/data:image/.test(v))), '닫으면 그림을 지우고 기기에 안 남김');
  const im = await blob(S, 'png');
  ok(im.type === 'image/png' && im.w === 1080 && im.h === 1920 && im.size > 50000, `스토리 그림 ${im.w}×${im.h} ${im.size}B`);
  if(SH) fs.writeFileSync(`${SH}/pepero-story.png`, Buffer.from(im.b64, 'base64'));
  const vd = await blob(S, 'video');
  ok(vd.size > 10000 && /^video\/(mp4|webm)/.test(vd.type), `스토리 영상 ${vd.type} ${vd.size}B`);
  if(SH) fs.writeFileSync(`${SH}/pepero-story.${/mp4/.test(vd.type) ? 'mp4' : 'webm'}`, Buffer.from(vd.b64, 'base64'));
  ok(rpcs.filter(x=>x[0] === 'gift_open').length === 1, '스토리 그림·영상은 기프티콘을 안 받는다(공유물에 없음)');
  /* 다시 열기 → 이름 기억, 같은 결과, 새로 안 보냄 */
  await p.reload({ waitUntil:'networkidle2' }); await sleep(500);
  ok(await S(()=>!document.getElementById('pp-again').hidden && /장진혁/.test(document.getElementById('pp-again').textContent)), '다시 열면 「장진혁 님으로 계속하기」');
  await S(()=>document.querySelector('[data-pagain]').click()); await sleep(300);
  ok(await S(()=>document.querySelector('[data-pg="m"]').getAttribute('aria-selected') === 'true' && document.querySelector('.pp-look.on')?.dataset.pl === '2'), '고른 캐릭터 기억');
  await S(()=>document.querySelector('[data-plook]').click()); await sleep(900);
  const again = await S(()=>({ ph:_pepero.S.ph, go:!!document.querySelector('[data-pgo]'), card:document.querySelector('.pep-res')?.textContent || '' }));
  ok(again.ph === 'reveal' && !again.go && /베스킨라빈스/.test(again.card) && rpcs.filter(x=>x[0] === 'gift_claim').length === 1, '다시 열면 같은 선물(다시 안 받음)');
  ok(posts.filter(x=>x[0].startsWith('place_talk')).length === 1, '다시 열어도 새로 안 보냄');
  ok(!errs.length, '오류 없음 ' + errs.join(' | ')); await b.close(); }

/* 2) 다른 기기 — 서버에 그 이름 줄이 있으면(앱에서 뽑은 줄도) 그 결과만 */
{ const mine = { id:'pepero26:김도훈', target:'pepero:2026', user_id:'roster:김도훈', name:'김도훈', cohort:'6기', text:'pepero|🍫 빼빼로', created_at:now };
  const { b, errs, posts, rpcs, S, sleep } = await page([...talk, mine]);
  await pickName(S, sleep, '김도훈'); await S(()=>document.querySelector('[data-plook]').click()); await sleep(1500);
  const r = await S(()=>({ ph:_pepero.S?.ph, go:!!document.querySelector('[data-pgo]'), open:!!document.querySelector('[data-popen]'), card:document.querySelector('.pep-res')?.textContent || '' }));
  ok(r.ph === 'reveal' && !r.go && !r.open && /GS25 빼빼로/.test(r.card) && /다른 기기에서 이미 받았어요/.test(r.card) && !rpcs.length, '다른 기기에서 받은 이름 → 결과만, 열기 버튼 없음, 서버에 안 물음: ' + r.card.replace(/\s+/g, ' '));
  ok(!posts.some(x=>x[0].startsWith('place_talk')), '서버 기록이 있으면 안 보냄');
  ok(!errs.length, '오류 없음 ' + errs.join(' | ')); await b.close(); }

/* 3) 좁은 폭 — 세 화면 모두 가로 넘침 없음 */
for(const w of [320, 360, 390]){
  const { b, errs, S, sleep } = await page(talk, { width:w, height:w < 360 ? 568 : 760 });
  const ov = () => S(()=>document.documentElement.scrollWidth - innerWidth);
  const a = await ov(); await pickName(S, sleep, '김도훈'); const c = await ov();
  await S(()=>document.querySelector('[data-plook]').click()); await sleep(800);
  const d = await ov(), cv = await S(()=>{ const r = document.getElementById('pep-cv').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; });
  ok(a <= 0 && c <= 0 && d <= 0 && cv, `${w}px 넘침 없음 ${JSON.stringify({ a, c, d, cv })}`);
  ok(!errs.length, '오류 없음 ' + errs.join(' | ')); await b.close(); }

/* 4) 기간 밖 — 「이벤트가 끝났어요」 */
{ const { b, errs, S, sleep } = await page(talk, { at:OFF });
  await pickName(S, sleep, '김도훈'); await S(()=>document.querySelector('[data-plook]').click()); await sleep(800);
  ok(await S(()=>/끝났어요/.test(document.querySelector('#pep-ctl').textContent) && !!document.querySelector('[data-pgo][disabled]')), '11.20 → 「이벤트가 끝났어요」');
  ok(!errs.length, '오류 없음 ' + errs.join(' | ')); await b.close(); }

/* 5) SurfShare — 11.11 홈 띠·놀이 카드가 /pepero 로, 기간 밖엔 없음 */
{ const me = { id:'jin', name:'진', profile:{ gender:'m', hair:'short' } }, surfers = [{ id:'jin', name:'진', cohort:'6기', profile:me.profile }];
  const { b, p, errs, S, sleep } = await openApp({ surfers, place_talk:talk }, me, { init:clock, initArg:ON });
  await S(()=>{ for(let i = 0; i < 5 && !document.getElementById('pop').hidden; i++) popClose(); });
  const bar = await S(()=>{ const e = document.getElementById('pepero-bar'); return e && !e.hidden ? { t:e.textContent.replace(/\s+/g, ' '), home:e.parentElement.id } : null; });
  ok(bar && bar.home === 'pane-home' && /낙산 해변/.test(bar.t), '11.11 홈 띠: ' + (bar && bar.t));
  await shot(p, 'pepero-0-banner');
  await S(()=>setTab('play')); await sleep(400);
  ok(await S(()=>!!document.querySelector('[data-hub="pepero"]')), '놀이 탭에 이벤트 카드');
  await Promise.all([p.waitForNavigation({ waitUntil:'domcontentloaded' }), S(()=>document.querySelector('[data-hub="pepero"]').click())]);
  ok(/pepero/.test(p.url()) && await S(()=>!!document.getElementById('pp-enter')), '카드 → 이벤트 페이지: ' + p.url());
  ok(!errs.length, '오류 없음 ' + errs.join(' | ')); await b.close(); }
{ const me = { id:'jin', name:'진', profile:{ gender:'m', hair:'short' } };
  const { b, errs, S, sleep } = await openApp({ surfers:[{ id:'jin', name:'진', cohort:'6기', profile:me.profile }], place_talk:talk }, me, { init:clock, initArg:OFF });
  ok(await S(()=>{ const e = document.getElementById('pepero-bar'); return !e || e.hidden; }), '11.20 → 띠 없음');
  await S(()=>setTab('play')); await sleep(300);
  ok(await S(()=>!document.querySelector('[data-hub="pepero"]')), '11.20 → 놀이 카드 없음');
  ok(!errs.length, '오류 없음 ' + errs.join(' | ')); await b.close(); }
/* 5b) 서버가 「다른 기기 것」(mine:false) · 「모두 나감」 · 기프티콘 못 염 */
{ const { b, errs, posts, S, sleep } = await page(talk, { rpc:{ gift_claim:()=>[200, { kind:'pepero', mine:false }] } });
  await pickName(S, sleep, '김태은'); await S(()=>document.querySelector('[data-plook]').click()); await sleep(800); await playThrough(S, sleep);
  const r = await S(()=>({ card:document.querySelector('.pep-res')?.textContent || '', open:!!document.querySelector('[data-popen]') }));
  ok(/다른 기기에서 이미 받았어요/.test(r.card) && !r.open && !posts.some(x=>x[0].startsWith('place_talk')), 'mine:false → 안내, 열기 없음, 소식 안 씀');
  ok(!errs.length, '오류 없음 ' + errs.join(' | ')); await b.close(); }
{ const { b, errs, posts, S, sleep } = await page(talk, { rpc:{ gift_claim:()=>[200, { kind:null, soldout:true }] } });
  await pickName(S, sleep, '김태은'); await S(()=>document.querySelector('[data-plook]').click()); await sleep(800); await playThrough(S, sleep);
  ok(/선물이 모두 나갔어요/.test(await S(()=>document.getElementById('pep-ctl').textContent)) && !posts.length, 'soldout → 「선물이 모두 나갔어요」');
  ok(!errs.length, '오류 없음 ' + errs.join(' | ')); await b.close(); }
{ const { b, errs, S, sleep } = await page(talk, { rpc:{ gift_open:()=>[400, { message:'nogift' }] } });
  await pickName(S, sleep, '김태은'); await S(()=>document.querySelector('[data-plook]').click()); await sleep(800); await playThrough(S, sleep);
  await S(()=>document.querySelector('[data-popen]').click()); await sleep(600);
  ok(await S(()=>document.getElementById('pp-gc').hidden && /열 수 없어요/.test(document.getElementById('pp-toast').textContent)), '기프티콘 못 열면 안내만');
  ok(!errs.length, '오류 없음 ' + errs.join(' | ')); await b.close(); }

/* 6) 시연 모드(?demo=1) — 기간 밖에도 열림 · 서버 기록이 있어도 안 잠김 · 아무것도 안 보냄 · 새로 열면 잊음 */
{ const mine = { id:'acc9|1', target:'pepero:2026', user_id:'acc9', name:'김도훈', cohort:'6기', text:'p2|🍫 2등 빼빼로 1개', created_at:now };
  const { b, p, errs, posts, rpcs, S, sleep } = await page([...talk, mine], { at:OFF, q:'?demo=1' });
  ok(await S(()=>!document.getElementById('pp-demo').hidden), '시연 모드 표시');
  await pickName(S, sleep, '김도훈'); await S(()=>document.querySelector('[data-plook]').click()); await sleep(900);
  ok(await S(()=>_pepero.S.ph === 'intro' && !!document.querySelector('[data-pgo]:not([disabled])')), '시연: 기간 밖·이미 뽑은 이름이어도 출발 가능');
  await S(()=>document.querySelector('[data-pgo]').click()); await sleep(300);
  await S(()=>{ for(let i = 0; i < 4; i++) _pepero.walk(); }); await sleep(1900);
  await S(()=>{ for(let i = 0; i < 5; i++) _pepero.paddle(); }); await sleep(3200);
  await S(()=>{ for(let i = 0; i < 3; i++) _pepero.pull(); }); await sleep(1600);
  ok(await S(()=>_pepero.S.ph === 'reveal' && !!_pepero.res && /\(시연\)/.test(document.getElementById('pep-wall').textContent)), '시연: 선물 공개 + 소식엔 (시연)');
  await S(()=>document.querySelector('[data-popen]').click()); await sleep(400);
  ok(await S(()=>!document.getElementById('pp-gc').hidden && /^data:image\/png/.test(document.querySelector('#pp-gc img').src)), '시연: 예시 카드(가짜)');
  await S(()=>document.querySelector('[data-pgclose]').click());
  ok(!posts.length && !rpcs.length && await S(()=>!Object.keys(localStorage).some(k=>/pepero/.test(k))), '시연: 서버(gift_claim·gift_open 포함)·기기에 아무것도 안 남김');
  await p.reload({ waitUntil:'networkidle2' }); await sleep(400);
  ok(await S(()=>document.getElementById('pp-again').hidden), '시연: 새로 열면 처음부터');
  ok(!errs.length, '오류 없음 ' + errs.join(' | ')); await b.close(); }
process.exit(fail ? 1 : 0);
