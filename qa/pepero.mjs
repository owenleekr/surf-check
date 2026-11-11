/* 🍫 빼빼로 서핑(pepero.js) — 띠·바로가기·패들→파도→걸림→선물·place_talk 한 줄·다시 열면 같은 결과·서버 기록이면 안 뽑음·
   스토리 그림 1080×1920·영상·이스케이프·뒤로가기·좁은 폭. SHOTS=<폴더> 를 주면 화면·그림·영상을 거기 저장한다 */
import { open } from './mock.mjs';
import fs from 'fs';
const SH = process.env.SHOTS || ''; if(SH) fs.mkdirSync(SH, { recursive:true });
const shot = (p, n) => SH ? p.screenshot({ path:`${SH}/${n}.png` }) : null;
const clock = t => { const off = t - Date.now(), N = Date.now.bind(Date); Date.now = () => N() + off; };
const ON = Date.parse('2026-11-11T12:00:00+09:00'), OFF = Date.parse('2026-11-20T12:00:00+09:00');
const me = { id:'jin', name:'진', profile:{ gender:'m', hair:'short' } };
const surfers = [{ id:'jin', name:'진', cohort:'6기', profile:me.profile }];
const now = new Date().toISOString();
const talk = [{ id:'x|1', target:'ft:abc', user_id:'x', name:'맛집러', text:'맛집 후기', created_at:now },
  { id:'kim|1', target:'pepero:2026', user_id:'kim', name:'<img src=x onerror=alert(1)>김', cohort:'6기', text:'p2|🍫 2등 <b>빼빼로</b> 1개', created_at:now }];
let fail = 0; const ok = (c, m) => { console.log((c ? '✔' : '✘') + ' ' + m); if(!c) fail++; };
const blob = (S, fn) => S(async f => { const b = await window._pepero[f](); const a = new Uint8Array(await b.arrayBuffer()); let s = ''; for(let i = 0; i < a.length; i += 32768) s += String.fromCharCode(...a.subarray(i, i + 32768));
  let w = 0, h = 0; if(/image/.test(b.type)){ const im = await createImageBitmap(b); w = im.width; h = im.height; } return { type:b.type, size:b.size, w, h, b64:btoa(s) }; }, fn);

/* 1) 띠 → 장면 → 선물 → 내보내기 */
{ const { b, p, errs, posts, S, sleep } = await open({ surfers, place_talk:talk }, me, { init:clock, initArg:ON });
  await S(()=>{ for(let i = 0; i < 5 && !document.getElementById('pop').hidden; i++) popClose(); });
  const bar = await S(()=>{ const e = document.getElementById('pepero-bar'); return e && !e.hidden ? { t:e.textContent.replace(/\s+/g, ' '), home:e.parentElement.id } : null; });
  ok(bar && bar.home === 'pane-home' && /빼빼로 서핑/.test(bar.t), '11.11 홈 띠: ' + (bar && bar.t));
  await shot(p, 'pepero-1-banner');
  await S(()=>document.getElementById('pepero-bar').click()); await sleep(900);
  const sh = await S(()=>{ const s = document.getElementById('pep-sheet'), w = document.getElementById('pep-wall');
    return { open:!s.hidden, cv:document.getElementById('pep-cv').width > 0, go:!!s.querySelector('[data-pgo]:not([disabled])'), xss:!!w.querySelector('img, b b, span b'), food:w.textContent.includes('맛집'), wall:w.querySelectorAll('.pep-w').length, txt:w.textContent }; });
  ok(sh.open && sh.cv && sh.go, '띠 → 이벤트 창 + 캔버스 + 시작 버튼');
  ok(sh.wall === 1 && !sh.food && !sh.xss && /<img/.test(sh.txt), '당첨 소식: 이벤트 줄만, 글자는 이스케이프');
  await shot(p, 'pepero-2-intro');
  await S(()=>{ const r = window.__rg = crypto.getRandomValues.bind(crypto); crypto.getRandomValues = a => { if(a instanceof Uint32Array && a.length === 1){ a[0] = 4294967000; return a; } return r(a); }; });   // 이번 판은 맨 끝(참여상·조개)
  const sh0 = await S(()=>ME.profile.play?.shells || 0);
  await S(()=>document.querySelector('[data-pgo]').click()); await sleep(400);
  ok(await S(()=>_pepero.S.ph) === 'paddle', '바다로 나가기 → 패들');
  for(let i = 0; i < 5; i++){ await S(()=>{ const bt = document.querySelector('[data-ppad]'); bt.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true })); bt.dispatchEvent(new PointerEvent('pointerup', { bubbles:true })); }); await sleep(120); }
  ok(await S(()=>_pepero.S.ph) === 'ride', '패들 5번 → 파도 탐');
  await sleep(1100); await shot(p, 'pepero-3-ride');
  await sleep(1700);
  ok(await S(()=>_pepero.S.ph) === 'tug' && /발밑에 뭔가 걸렸어요/.test(await S(()=>document.getElementById('pep-hint').textContent)), '「앗! 발밑에 뭔가 걸렸어요」');
  await shot(p, 'pepero-4-tug');
  ok(!posts.some(x=>x[0].startsWith('place_talk')), '끌어올리기 전엔 아무것도 안 보냄');
  for(let i = 0; i < 3; i++){ await S(()=>document.querySelector('[data-ppull]').click()); await sleep(100); }
  await sleep(1500);
  const rv = await S(()=>({ ph:_pepero.S.ph, res:_pepero.res, card:document.querySelector('.pep-res')?.textContent.replace(/\s+/g, ' '), ids:_pepero.PRIZES.map(p=>p.id), shells:ME.profile.play?.shells || 0 }));
  ok(rv.ph === 'reveal' && rv.res && rv.ids.includes(rv.res.id), '선물 공개: ' + rv.card);
  ok(rv.res.id === 'p4' && rv.shells - sh0 === 30, `참여상 → 조개 +30 (${sh0}→${rv.shells})`);
  await shot(p, 'pepero-5-reveal');
  const pt = posts.filter(x=>x[0].startsWith('place_talk'));
  const row = pt[0] && pt[0][1];
  ok(pt.length === 1 && row.target === 'pepero:2026' && row.user_id === 'jin' && row.name === '진' && row.cohort === '6기' && /^jin\|\d+$/.test(row.id) && /^p4\|🐚 참여상 조개 30개$/.test(row.text) && !isNaN(Date.parse(row.created_at)), 'place_talk 한 줄: ' + JSON.stringify(row));
  ok(await S(()=>document.querySelectorAll('#pep-wall .pep-w').length) === 2, '내 당첨이 소식에 바로 보임');
  /* 뽑기 비율 — 무게대로 */
  await S(()=>{ crypto.getRandomValues = window.__rg; });
  const fq = await S(()=>{ const P = _pepero.PRIZES, c = {}; for(let i = 0; i < 20000; i++){ const p = _pepero.pick(); c[p.id] = (c[p.id] || 0) + 1; } const t = P.reduce((a, p)=>a + p.w, 0); return P.map(p=>[p.id, c[p.id] / 20000, p.w / t]); });
  ok(fq.every(([, a, e])=>Math.abs(a - e) < .02), '뽑기 비율 ' + fq.map(([i, a, e])=>`${i} ${(a * 100).toFixed(1)}%/${(e * 100).toFixed(0)}%`).join(' '));
  /* 스토리 그림 */
  const im = await blob(S, 'png');
  ok(im.type === 'image/png' && im.w === 1080 && im.h === 1920 && im.size > 50000, `스토리 그림 ${im.w}×${im.h} ${im.size}B`);
  if(SH) fs.writeFileSync(`${SH}/pepero-story.png`, Buffer.from(im.b64, 'base64'));
  /* 스토리 영상 */
  const vd = await blob(S, 'video');
  ok(vd.size > 10000 && /^video\/(mp4|webm)/.test(vd.type), `스토리 영상 ${vd.type} ${vd.size}B`);
  if(SH) fs.writeFileSync(`${SH}/pepero-story.${/mp4/.test(vd.type) ? 'mp4' : 'webm'}`, Buffer.from(vd.b64, 'base64'));
  /* 닫고 다시 열기 → 같은 결과, 새로 안 보냄 */
  await S(()=>document.querySelector('#pep-sheet [data-pclose]').click()); await sleep(300);
  await S(()=>document.getElementById('pepero-bar').click()); await sleep(800);
  const again = await S(()=>({ ph:_pepero.S.ph, go:!!document.querySelector('[data-pgo]'), card:document.querySelector('.pep-res')?.textContent || '' }));
  ok(again.ph === 'reveal' && !again.go && /조개 30개/.test(again.card), '다시 열면 같은 선물(다시 안 뽑음)');
  ok(posts.filter(x=>x[0].startsWith('place_talk')).length === 1, '다시 열어도 새로 안 보냄');
  ok(/내 선물/.test(await S(()=>document.getElementById('pepero-bar').textContent)), '띠에 내 선물');
  await S(()=>history.back()); await sleep(500);
  ok(await S(()=>document.getElementById('pep-sheet').hidden), '뒤로가기로 닫힘');
  await S(()=>setTab('play')); await sleep(400);
  ok(await S(()=>!!document.querySelector('[data-hub="pepero"]')), '놀이 탭에 이벤트 카드');
  ok(!errs.length, '오류 없음 ' + errs.join(' | ')); await b.close(); }

/* 2) 다른 기기 — 서버에 내 기록이 있으면 ?go=pepero 로 열어도 그 결과만 */
{ const mine = { id:'jin|1', target:'pepero:2026', user_id:'jin', name:'진', cohort:'6기', text:'p2|🍫 2등 빼빼로 1개', created_at:now };
  const { b, p, errs, posts, S, sleep } = await open({ surfers, place_talk:[...talk, mine] }, me, { init:clock, initArg:ON });
  await p.goto(p.url().split('?')[0] + '?go=pepero', { waitUntil:'networkidle2' }); await sleep(2500);
  const r = await S(()=>({ open:!document.getElementById('pep-sheet')?.hidden, ph:_pepero.S?.ph, go:!!document.querySelector('[data-pgo]'), card:document.querySelector('.pep-res')?.textContent || '', url:location.search }));
  ok(r.open && r.ph === 'reveal' && !r.go && /2등/.test(r.card) && /빼빼로 1개/.test(r.card), '?go=pepero → 서버 기록 그대로(2등): ' + r.card.replace(/\s+/g, ' '));
  ok(!posts.some(x=>x[0].startsWith('place_talk')), '서버 기록이 있으면 안 보냄');
  ok(!errs.length, '오류 없음 ' + errs.join(' | ')); await b.close(); }

/* 3) 좁은 폭 — 가로 넘침 없음 */
for(const w of [320, 360, 390]){
  const { b, p, errs, S, sleep } = await open({ surfers, place_talk:talk }, me, { init:clock, initArg:ON, width:w, height:w < 360 ? 568 : 760 });
  await S(()=>{ for(let i = 0; i < 5 && !document.getElementById('pop').hidden; i++) popClose(); });
  const home = await S(()=>document.documentElement.scrollWidth - innerWidth);
  await S(()=>window.peperoOpen()); await sleep(800);
  const o = await S(()=>{ const i = document.querySelector('.pep-in'), c = document.getElementById('pep-cv').getBoundingClientRect(); return { doc:document.documentElement.scrollWidth - innerWidth, inn:i.scrollWidth - i.clientWidth, cv:c.right <= innerWidth && c.left >= 0 }; });
  ok(home <= 0 && o.doc <= 0 && o.inn <= 0 && o.cv, `${w}px 넘침 없음 ${JSON.stringify({ home, ...o })}`);
  ok(!errs.length, '오류 없음 ' + errs.join(' | ')); await b.close(); }

/* 4) 기간 밖 — 띠·카드 없음 */
{ const { b, errs, S, sleep } = await open({ surfers, place_talk:talk }, me, { init:clock, initArg:OFF });
  ok(await S(()=>{ const e = document.getElementById('pepero-bar'); return !e || e.hidden; }), '11.20 → 띠 없음');
  await S(()=>setTab('play')); await sleep(300);
  ok(await S(()=>!document.querySelector('[data-hub="pepero"]')), '11.20 → 놀이 카드 없음');
  await S(()=>window.peperoOpen()); await sleep(500);
  ok(await S(()=>/끝났어요/.test(document.querySelector('#pep-ctl').textContent) && !!document.querySelector('[data-pgo][disabled]')), '11.20 → 「이벤트가 끝났어요」');
  ok(!errs.length, '오류 없음 ' + errs.join(' | ')); await b.close(); }
process.exit(fail ? 1 : 0);
