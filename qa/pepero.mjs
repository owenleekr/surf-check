/* 🎁 11.11 낙산 해변 빼빼로 선물 — 따로 선 페이지(pepero.html + pepero-app.js)와 SurfShare 홈 띠(pepero.js).
   이름 찾기(명단·코치·뺀 이름) → 정해 둔 성별 캐릭터 → 가을 낙산(autumn-open) → 식으며 나만 남음 → 패들 → 세트 → 리시 ×3 → 선물 · place_talk 한 줄(이름당 하나) ·
   서버에 그 이름 줄이 있으면 안 뽑음 · 다시 열면 같은 결과 · 스토리 그림 1080×1920 · 영상 · 이스케이프 · 좁은 폭 · 기간 밖 ·
   끌어올린 뒤 선물 공개(「○○ 당첨!」) → 혼자 · 버디들은 한 장 그림(gather) · 포스터 끝줄에 주소 없음 · 에스에이치테크 꼬리말 링크 ·
   마지막 사진의 정면 「나」는 받은 종류 그림 하나만 받고(빼빼로 → -pep, 아이스크림 → -br), 선물 아이콘은 몸이 아니라 머리 위 배지에만 · 공유물엔 기프티콘 그림 없음.
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
  const p = await b.newPage(), errs = [], posts = [], rpcs = [], gets = [];
  const RPC = Object.assign({ gift_claim:()=>[200, { kind:'br', mine:true }], gift_open:()=>[200, 'data:image/jpeg;base64,/9j/AAAA'] }, opts.rpc || {});
  p.on('pageerror', e=>errs.push(String(e).slice(0, 160)));
  p.on('console', m=>{ if(m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errs.push('console:' + m.text().slice(0, 140)); });
  await p.setViewport({ width:opts.width || 390, height:opts.height || 844, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  await p.setRequestInterception(true);
  p.on('request', r=>{ const u = r.url(), m = r.method();
    if(/\/img\/pepero\//.test(u)) gets.push(u.split('/img/pepero/')[1]);
    if(!u.includes('supabase')) return r.continue();
    if(m === 'OPTIONS') return r.respond({ status:204, headers:CORS, body:'' });
    if(m === 'POST' && u.includes('/rpc/')){ const fn = u.split('/rpc/')[1].split('?')[0], body = JSON.parse(r.postData() || '{}'); rpcs.push([fn, body]); const [st, js] = RPC[fn](body); return r.respond({ status:st, headers:CORS, contentType:'application/json', body:JSON.stringify(js) }); }
    if(m === 'POST'){ try{ posts.push([u.split('rest/v1/')[1], JSON.parse(r.postData())]); }catch(e){} return r.respond({ status:201, headers:CORS, body:'' }); }
    return r.respond({ status:200, headers:CORS, contentType:'application/json', body:JSON.stringify(rows) }); });
  await p.evaluateOnNewDocument(clock, opts.at || ON);
  await p.evaluateOnNewDocument(()=>{ window.__draws = []; const d = CanvasRenderingContext2D.prototype.drawImage;   // 어떤 그림을 어디에 그렸나(story: 1080×1920 캔버스)
    CanvasRenderingContext2D.prototype.drawImage = function(im, ...a){ if(im instanceof HTMLImageElement){ const m = this.getTransform(); window.__draws.push({ src:(im.getAttribute('src') || '').slice(0, 60), y:m.f, story:this.canvas.width === 1080 && this.canvas.height === 1920 }); } return d.call(this, im, ...a); };
    window.__texts = []; const ft = CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText = function(t, ...a){ if(this.canvas.width === 1080) window.__texts.push(String(t)); return ft.call(this, t, ...a); }; });
  await p.goto(PAGE, { waitUntil:'domcontentloaded' }); await p.evaluate(()=>localStorage.clear());
  await p.goto(PAGE + (opts.q || ''), { waitUntil:'networkidle2' });
  const S = (f, ...a) => p.evaluate(f, ...a), sleep = ms => new Promise(r=>setTimeout(r, ms));
  return { b, p, errs, posts, rpcs, gets, S, sleep };
}
/* 출발부터 공개까지 빨리 */
async function playThrough(S, sleep){
  await S(()=>document.querySelector('[data-pgo]').click()); await sleep(300);
  await S(()=>_pepero.walk()); await sleep(400);   // 가을 → 겨울 건너뛰기
  await S(()=>{ for(let i = 0; i < 5; i++) _pepero.paddle(); }); await sleep(3200);
  await S(()=>{ for(let i = 0; i < 3; i++) _pepero.pull(); }); await sleep(2100);
  for(let i = 0; i < 5; i++){ await S(()=>_pepero.next()); await sleep(150); }   // 선물 공개 → 혼자 → 버디들 → 다 같이(건너뛰기)
  await sleep(300);
}
const blob = (S, fn) => S(async f => { const b = await window._pepero[f](); const a = new Uint8Array(await b.arrayBuffer()); let s = ''; for(let i = 0; i < a.length; i += 32768) s += String.fromCharCode(...a.subarray(i, i + 32768));
  let w = 0, h = 0; if(/image/.test(b.type)){ const im = await createImageBitmap(b); w = im.width; h = im.height; } return { type:b.type, size:b.size, w, h, b64:btoa(s) }; }, fn);
const pickName = async (S, sleep, n) => { await S(n=>document.querySelector(`[data-name="${n}"]`).click(), n); await sleep(300); };

/* 1) 이름 → 캐릭터 → 탐험 → 선물 → 내보내기 */
{ const { b, p, errs, posts, rpcs, gets, S, sleep } = await page(talk);
  const en = await S(()=>({ names:[...document.querySelectorAll('[data-name]')].map(x=>x.dataset.name), coach:document.querySelectorAll('.pp-name small').length, grp:[...document.querySelectorAll('.pp-grp')].map(x=>x.textContent).join(),
    wall:document.querySelectorAll('#pep-wall .pep-w').length }));
  ok(en.names.length === 24 && !en.names.includes('이성현') && !en.names.includes('루비') && en.names.includes('김도훈') && en.coach === 6 && en.grp === '양양서핑학교 6기,코치·매니저', `명단 24명(6기 18 + 코치·매니저 6, 이성현·루비 등 뺌): ${en.names.length}`);
  await shot(p, 'pepero-1-enter');
  const by = await S(()=>{ const a = document.querySelector('.pp-by a'), r = a.getBoundingClientRect(); return { href:a.href, tg:a.target, rel:a.rel, h:r.height, t:a.textContent, mid:Math.abs(r.left + r.width / 2 - innerWidth / 2) < 2 }; });
  ok(by.href === 'https://ax.owenai.xyz/' && by.tg === '_blank' && /noopener/.test(by.rel) && by.h >= 44 && by.mid && /에스에이치테크/.test(by.t), '꼬리말 「만든 사람 · 에스에이치테크 ↗」 새 탭·44px·가운데: ' + JSON.stringify(by));
  await S(()=>document.getElementById('pp-snd').click());
  ok(await S(()=>document.getElementById('pp-snd').getAttribute('aria-pressed') === 'true' && localStorage.getItem('lineup.pepero.sound') === '1'), '🔊 배경 음악 켜기 · 기억');
  await S(()=>document.getElementById('pp-snd').click());
  ok(await S(()=>document.getElementById('pp-snd').textContent === '🔇' && localStorage.getItem('lineup.pepero.sound') === '0'), '🔇 끄기');
  ok(await S(()=>/매니저/.test(document.querySelector('[data-name="김법성"]').textContent) && /교장/.test(document.querySelector('[data-name="이승대"]').textContent)), '이승대 교장 · 김법성 매니저 표시');
  await p.type('#pp-q', '진혁'); await sleep(200);
  const q = await S(()=>[...document.querySelectorAll('[data-name]')].map(x=>x.textContent));
  ok(q.length === 1 && /장진혁/.test(q[0]) && /코치/.test(q[0]), '이름 찾기 「진혁」 → 장진혁 코치: ' + q.join(','));
  await pickName(S, sleep, '장진혁');
  const lk = await S(()=>({ on:!document.getElementById('pp-look').hidden, who:document.getElementById('pp-who').textContent, tabs:document.querySelectorAll('[data-pg]').length, srcs:[...document.querySelectorAll('.pp-look img')].map(i=>i.getAttribute('src')) }));
  ok(lk.on && /장진혁/.test(lk.who) && lk.tabs === 0 && lk.srcs.length === 4 && lk.srcs.every(s=>/\/m\d-gift/.test(s)), '캐릭터 고르기 — 정해 둔 성별(장진혁 남자) 넷만, 탭 없음: ' + JSON.stringify(lk));
  await S(()=>document.querySelector('[data-pl="2"]').click());
  const lk2 = await S(()=>({ on:document.querySelector('.pp-look.on')?.dataset.pl, pressed:document.querySelector('[data-pl="2"]').getAttribute('aria-pressed') }));
  ok(lk2.on === '2' && lk2.pressed === 'true', '세 번째 캐릭터 고름');
  await shot(p, 'pepero-2-look');
  await S(()=>document.querySelector('[data-plook]').click()); await sleep(900);
  const pl = await S(()=>({ on:!document.getElementById('pp-play').hidden, cv:document.getElementById('pep-cv').width > 0, go:!!document.querySelector('[data-pgo]:not([disabled])'), me:document.getElementById('pp-me').textContent,
    saved:JSON.parse(localStorage.getItem('lineup.pepero.me')), w:document.getElementById('pep-wall'), }));
  ok(pl.on && pl.cv && pl.go && /서프 버디 장진혁 · 코치/.test(pl.me) && pl.saved.name === '장진혁' && pl.saved.g === 'm' && pl.saved.li === 2, '출발 → 탐험 화면 + 이름·캐릭터 기억');
  const wl = await S(()=>{ const w = document.getElementById('pep-wall'); return { n:w.querySelectorAll('.pep-w').length, xss:!!w.querySelector('img, b b, span b'), food:w.textContent.includes('맛집'), txt:w.textContent }; });
  ok(wl.n === 1 && !wl.food && !wl.xss && /<img/.test(wl.txt), '당첨 소식: 이벤트 줄만, 글자는 이스케이프');
  await shot(p, 'pepero-3-intro');
  ok(gets.includes('autumn-open.webp') && /가을 낙산에서 함께 탔던 우리, 겨울 바다에서 다시 만나요/.test(await S(()=>document.querySelector('.pep-intro').textContent)) && !/리시가 묵직해요/.test(await S(()=>document.querySelector('.pep-intro').textContent)), '첫 장면 그림 autumn-open + 새 소개 문구');
  await S(()=>document.querySelector('[data-pgo]').click()); await sleep(400);
  const wk = await S(()=>({ ph:_pepero.S.ph, ctl:document.getElementById('pep-ctl').textContent + document.getElementById('pep-hint').textContent, skip:!!document.querySelector('[data-pstep]') }));
  ok(wk.ph === 'walk' && wk.skip && !/1111|보드/.test(wk.ctl), '출발 → 가을이 식어 가는 장면(보드 넷 세기 없음, 건너뛰기만): ' + wk.ctl);
  await sleep(4300);
  ok(await S(()=>_pepero.S.ph) === 'paddle', '저절로 → 라인업까지 패들');
  await shot(p, 'pepero-4-paddle');
  for(let i = 0; i < 5; i++){ await S(()=>{ const bt = document.querySelector('[data-ppad]'); bt.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true })); bt.dispatchEvent(new PointerEvent('pointerup', { bubbles:true })); }); await sleep(120); }
  ok(await S(()=>_pepero.S.ph) === 'wait', '패들 5번 → 세트 기다리기');
  await sleep(3200);
  ok(await S(()=>_pepero.S.ph) === 'tug' && /발밑에 뭔가 걸렸어요/.test(await S(()=>document.getElementById('pep-hint').textContent)), '「어? 리시가 묵직해요 — 발밑에 뭔가 걸렸어요」');
  await shot(p, 'pepero-5-tug');
  ok(!posts.some(x=>x[0].startsWith('place_talk')), '끌어올리기 전엔 아무것도 안 보냄');
  await S(()=>document.getElementById('pep-cv').click()); await sleep(100);   // 그림을 눌러도 당겨진다
  for(let i = 0; i < 2; i++){ await S(()=>document.querySelector('[data-ppull]').click()); await sleep(100); }
  await sleep(2100);
  const pz = await S(()=>({ ph:_pepero.S.ph, hint:document.getElementById('pep-hint').textContent, skip:!!document.querySelector('[data-pskip]') }));
  ok(pz.ph === 'prize' && pz.hint === '베스킨라빈스 아이스크림 당첨!' && pz.skip, '끌어올리면 먼저 선물 공개(「베스킨라빈스 아이스크림 당첨!」 + 다음 장면): ' + JSON.stringify(pz));
  await S(()=>document.querySelector('[data-pskip]').click()); await sleep(200);
  ok(await S(()=>_pepero.S.ph) === 'alone', '그다음 「여전히 혼자라 쓸쓸해요」');
  await S(()=>document.querySelector('[data-pskip]').click()); await sleep(200);
  ok(await S(()=>_pepero.S.ph) === 'gather', '다음 장면 → 버디들이 모여요'); await sleep(300);
  ok(gets.includes('gather.webp') && await S(()=>window.__draws.some(d=>/gather\.webp/.test(d.src))), '버디들이 다가오는 장면은 한 장 그림(gather.webp)');
  for(let i = 0; i < 3; i++){ await S(()=>document.getElementById('pep-cv').click()); await sleep(200); }   // 다 같이 파도 → 나눠 먹기 → 공개
  await sleep(200);
  const rv = await S(()=>({ ph:_pepero.S.ph, res:_pepero.res, card:document.querySelector('.pep-res')?.textContent.replace(/\s+/g, ' '), open:!!document.querySelector('[data-popen]') }));
  ok(/작은 선물이지만, 함께 파도 위에서 나눈 마음을 나눠요/.test(await S(()=>document.querySelector('.pp-letter')?.textContent || '')), '공개 뒤 편지 카드');
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
  const fr = gets.filter(u=>/^front-/.test(u)), dr = await S(()=>window.__draws);
  ok(fr.length && fr.every(u=>u === 'front-m3-br.webp'), '정면 「나」 — 고른 캐릭터(m3)·받은 종류(아이스크림 → -br) 한 장만 받음: ' + [...new Set(fr)]);
  ok(dr.some(d=>/front-m3-br/.test(d.src)), '마지막 사진에 정면 「나」를 그림');
  const ice = dr.filter(d=>d.story && /ice\.webp/.test(d.src));
  ok(ice.length && ice.every(d=>d.y < 830), '선물 아이콘은 머리 위 배지에만(몸에 붙은 아이콘 없음): ' + ice.map(d=>Math.round(d.y)));
  ok(!dr.some(d=>/^data:/.test(d.src)), '공유 그림·영상에 기프티콘(data:) 그림을 그리지 않음');
  const tx = await S(()=>window.__texts);
  ok(tx.includes('2026.11.11 낙산 해변') && !tx.some(t=>/owenai|surf\.|에스에이치테크/.test(t)), '포스터·영상 끝줄은 「2026.11.11 낙산 해변」만(주소·꼬리말 없음)');
  /* 다시 열기 → 이 기기가 받은 이름은 「🎁 내 선물 다시 보기」 → 이야기 없이 결과, gift_claim 다시 안 부름 */
  await p.reload({ waitUntil:'networkidle2' }); await sleep(500);
  const e2 = await S(()=>{ const top = document.getElementById('pp-mine'), c = document.querySelector('[data-name="장진혁"]'); return { top:top.hidden ? '' : top.textContent, chip:c.textContent, mine:c.hasAttribute('data-mine'), dis:c.disabled, again:document.getElementById('pp-again').hidden }; });
  ok(/장진혁님 선물 다시 보기/.test(e2.top) && e2.mine && !e2.dis && /내 선물 다시 보기/.test(e2.chip) && e2.again, '다시 열면 위에 「🎁 장진혁님 선물 다시 보기」 + 칩도 다시 보기(잠기지 않음): ' + JSON.stringify(e2));
  await shot(p, 'pepero-8-enter-mine');
  await S(()=>document.querySelector('#pp-mine [data-mine]').click()); await sleep(900);
  const again = await S(()=>({ ph:_pepero.S.ph, look:!document.getElementById('pp-look').hidden, li:_pepero.me.li, card:document.querySelector('.pep-res')?.textContent || '', open:!!document.querySelector('[data-popen]'), re:!!document.querySelector('[data-preplay]'), letter:!!document.querySelector('.pp-letter'), share:!!document.querySelector('[data-pimgsh]') }));
  ok(again.ph === 'reveal' && !again.look && again.li === 2 && /베스킨라빈스/.test(again.card) && again.open && again.re && again.letter && again.share && rpcs.filter(x=>x[0] === 'gift_claim').length === 1, '다시 보기 → 바로 결과(편지·기프티콘 열기·공유·처음부터 다시 보기), 고른 캐릭터 그대로, gift_claim 다시 안 부름: ' + JSON.stringify({ ...again, card:'' }));
  await S(()=>document.querySelector('[data-popen]').click()); await sleep(500);
  const go2 = rpcs.filter(x=>x[0] === 'gift_open');
  ok(go2.length === 2 && go2[1][1].p_token === cl[0][1].p_token && go2[1][1].p_name === '장진혁', '다시 보기에서 기프티콘 열기 — 저장된 열쇠로 gift_open');
  await S(()=>document.querySelector('[data-pgclose]').click()); await sleep(200);
  await S(()=>document.querySelector('[data-preplay]').click()); await sleep(400);
  ok(await S(()=>_pepero.S.ph === 'walk' && !document.querySelector('.pep-res')), '「이야기 처음부터 다시 보기」 → 가을 장면부터(결과 카드 숨김)');
  await S(()=>_pepero.walk()); await sleep(400); await S(()=>{ for(let i = 0; i < 5; i++) _pepero.paddle(); }); await sleep(3200);
  ok(await S(()=>_pepero.S.ph === 'tug' && !!document.querySelector('[data-ppull]')), '다시 보기 이야기에서도 리시 당기기 버튼');
  await S(()=>{ for(let i = 0; i < 3; i++) _pepero.pull(); }); await sleep(2100);
  for(let i = 0; i < 6; i++){ await S(()=>_pepero.next()); await sleep(150); }
  ok(await S(()=>_pepero.S.ph === 'reveal' && /베스킨라빈스/.test(document.querySelector('.pep-res')?.textContent || '')) && rpcs.filter(x=>x[0] === 'gift_claim').length === 1, '다시 본 이야기 끝 — 같은 선물, gift_claim 여전히 한 번');
  ok(posts.filter(x=>x[0].startsWith('place_talk')).length === 1, '다시 열어도 새로 안 보냄');
  ok(!errs.length, '오류 없음 ' + errs.join(' | ')); await b.close(); }

/* 2) 다른 기기 — 서버에 그 이름 줄이 있으면(앱에서 뽑은 줄도) 그 결과만 */
{ const mine = { id:'pepero26:김도훈', target:'pepero:2026', user_id:'roster:김도훈', name:'김도훈', cohort:'6기', text:'pepero|🍫 빼빼로', created_at:now };
  const { b, p, errs, posts, rpcs, S, sleep } = await page([...talk, mine]);
  const c = await S(()=>{ const e = document.querySelector('[data-name="김도훈"]'), f = document.querySelector('[data-name="김태은"]'); return { dis:e.disabled, aria:e.getAttribute('aria-disabled'), t:e.textContent, mine:e.hasAttribute('data-mine'), other:!f.disabled, top:document.getElementById('pp-mine').hidden }; });
  ok(c.dis && c.aria === 'true' && /받음 ✓/.test(c.t) && !c.mine && c.other && c.top, '서버에 받은 줄이 있는 이름 → 회색·눌리지 않음·「받음 ✓」, 다른 이름은 그대로: ' + JSON.stringify(c));
  await S(()=>document.querySelector('[data-name="김도훈"]').click()); await sleep(300);
  ok(await S(()=>document.getElementById('pp-look').hidden && !document.getElementById('pp-enter').hidden) && !rpcs.length, '눌러도 안 열리고 서버에 안 물음');
  await shot(p, 'pepero-9-enter-taken');
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
  await pickName(S, sleep, '김태은');
  ok(await S(()=>[...document.querySelectorAll('.pp-look img')].every(i=>/\/f\d-gift/.test(i.getAttribute('src')))), '김태은 → 여자 캐릭터 넷'); await S(()=>document.querySelector('[data-plook]').click()); await sleep(800); await playThrough(S, sleep);
  const r = await S(()=>({ card:document.querySelector('.pep-res')?.textContent || '', open:!!document.querySelector('[data-popen]') }));
  ok(/다른 기기에서 이미 받았어요/.test(r.card) && !r.open && !posts.some(x=>x[0].startsWith('place_talk')), 'mine:false → 안내, 열기 없음, 소식 안 씀');
  await S(()=>document.querySelector('[data-pback]:not([hidden])') && [...document.querySelectorAll('[data-pback]')].find(x=>x.offsetParent).click()); await sleep(400);
  const t5 = await S(()=>{ const e = document.querySelector('[data-name="김태은"]'); return { dis:e.disabled, t:e.textContent, again:document.getElementById('pp-again').hidden, top:document.getElementById('pp-mine').hidden }; });
  ok(t5.dis && /받음 ✓/.test(t5.t) && t5.again && t5.top, 'mine:false 인 이름 → 입장 화면에서 잠김(다시 보기 아님): ' + JSON.stringify(t5));
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
  const { b, p, errs, posts, rpcs, gets, S, sleep } = await page([...talk, mine], { at:OFF, q:'?demo=1' });
  ok(await S(()=>!document.getElementById('pp-demo').hidden), '시연 모드 표시');
  await pickName(S, sleep, '김도훈'); await S(()=>document.querySelector('[data-plook]').click()); await sleep(900);
  ok(await S(()=>_pepero.S.ph === 'intro' && !!document.querySelector('[data-pgo]:not([disabled])')), '시연: 기간 밖·이미 뽑은 이름이어도 출발 가능');
  await playThrough(S, sleep);
  ok(await S(()=>_pepero.S.ph === 'reveal' && !!_pepero.res && /\(시연\)/.test(document.getElementById('pep-wall').textContent)), '시연: 선물 공개 + 소식엔 (시연)');
  const kd = await S(()=>_pepero.res.id), fd = gets.filter(u=>/^front-/.test(u));
  ok(fd.length && fd.every(u=>u === `front-m1-${kd === 'br' ? 'br' : 'pep'}.webp`), `시연: 받은 종류(${kd})에 맞는 정면 그림만: ` + [...new Set(fd)]);
  await S(()=>document.querySelector('[data-popen]').click()); await sleep(400);
  ok(await S(()=>!document.getElementById('pp-gc').hidden && /^data:image\/png/.test(document.querySelector('#pp-gc img').src)), '시연: 예시 카드(가짜)');
  await S(()=>document.querySelector('[data-pgclose]').click());
  await S(()=>[...document.querySelectorAll('[data-pback]')].find(x=>x.offsetParent).click()); await sleep(400);
  const d6 = await S(()=>({ top:document.getElementById('pp-mine').textContent, mine:document.querySelector('[data-name="김도훈"]').hasAttribute('data-mine'), off:document.querySelectorAll('.pp-name.off').length }));
  ok(/김도훈님 선물 다시 보기/.test(d6.top) && d6.mine && d6.off === 0, '시연: 뽑은 이름은 다시 보기(이 화면에서만), 잠긴 이름 없음: ' + JSON.stringify(d6));
  await shot(p, 'pepero-10-demo-enter');
  await S(()=>document.querySelector('#pp-mine [data-mine]').click()); await sleep(800);
  ok(await S(()=>_pepero.S.ph === 'reveal' && !!document.querySelector('[data-preplay]')), '시연: 다시 보기 → 바로 결과');
  ok(!posts.length && !rpcs.length && await S(()=>!Object.keys(localStorage).some(k=>/pepero/.test(k))), '시연: 서버(gift_claim·gift_open 포함)·기기에 아무것도 안 남김');
  await p.reload({ waitUntil:'networkidle2' }); await sleep(400);
  ok(await S(()=>document.getElementById('pp-again').hidden), '시연: 새로 열면 처음부터');
  ok(!errs.length, '오류 없음 ' + errs.join(' | ')); await b.close(); }
process.exit(fail ? 1 : 0);
