/* 🚤 기상특보 · 해경 수상레저 신고 (kcg.js)
   - 공식 특보(풍랑주의보) → 홈 맨 위 빨간 띠(생일 띠보다 위) + 신고 창 하루 한 번 자동 열림, 다시 열어도 또 안 열림
   - 경보 → '금지' 문구 · 특보 없음 → 아무것도 · 키 없음 + 큰 예보 → 노란 '어림' 띠(자동 열림 없음)
   - 메모 저장(전화번호·주민번호는 지움)·복사 · 뒤로가기로 창 닫힘 · 기상청 값 주입 방어 · 320/360/390 가로 넘침
   mock.mjs 는 /api/advisory 를 모르므로 여기서 같은 방식으로 띄운다(나머지 응답은 mock 과 같은 규칙). */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import assert from 'assert';
const PAGE = process.env.BASE ? process.env.BASE + '/surfshare' : 'http://localhost:8765/surfshare.html';
const SHOT = '/private/tmp/claude-501/-Users-owen-Desktop-AI---------/b8d6e173-49ea-4bcc-886a-0a3266382054/scratchpad/';
const CORS = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'*', 'Access-Control-Allow-Methods':'*' };
const fc0 = JSON.parse(fs.readFileSync(new URL('./fixture-forecast.json', import.meta.url)));
fc0.days.forEach((d, i)=>{ d.day = new Date(Date.now() + i * 864e5 - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10); });
const big = JSON.parse(JSON.stringify(fc0)); big.days[1].regions[1].pm.h = 3.4; big.days[1].regions[1].pm.w = 15.2;
const ADV = { ok:true, active:[{ kind:'풍랑주의보', lvl:'주의보', areas:['강원북부앞바다', '강원중부앞바다'] }], tmFc:'202610181000' };
const WARN = { ok:true, active:[{ kind:'강풍주의보', areas:['양양평지'] }, { kind:'풍랑경보', areas:['강원북부앞바다'] }], tmFc:'202610181000' };
const EVIL = { ok:true, active:[{ kind:'<img src=x onerror=window.__pwn=1>', areas:['강원북부앞바다'] }, { kind:'풍랑주의보', areas:['<b>x</b>', '강원북부앞바다', '강원북부앞바다"><img src=x onerror=window.__pwn=2>'] }] };
const me = { id:'u4', name:'이성현', profile:{ gender:'f', birth:'1', dressed:1 } };
let fail = 0; const ok = (c, m) => { if(c) console.log('  ✓', m); else { fail++; console.log('  ✗', m); } };

async function launch(width, adv, fc, opt = {}){
  const b = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new' });
  const p = await b.newPage(); const errs = [];
  p.on('pageerror', e=>errs.push(String(e).slice(0, 160)));
  p.on('console', m=>{ if(m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errs.push('console:' + m.text().slice(0, 140)); });
  await p.setViewport({ width, height:820, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  await p.setRequestInterception(true);
  const data = { surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] };
  p.on('request', r=>{ const u = r.url(), m = r.method(), J = (st, o)=>r.respond({ status:st, headers:CORS, contentType:'application/json', body:JSON.stringify(o) });
    if(u.includes('/api/advisory')) return adv ? J(200, adv) : J(500, { error:'x' });
    if(u.includes('/api/forecast')) return fc ? J(200, fc) : J(502, { error:'forecast' });
    if(u.includes('/api/')) return J(502, { error:'x' });
    if(m === 'OPTIONS' && u.includes('supabase')) return r.respond({ status:204, headers:CORS, body:'' });
    if(m === 'POST' && u.includes('rpc/birthdays_today')) return J(200, opt.bday ? [{ id:'u9', name:'김생일', cohort:'6기' }] : []);
    if(m === 'POST' && u.includes('rest/v1/')) return J(201, []);
    if(u.includes('rpc/note_box')) return J(200, { inbox:[], sent:[], unread:0 });
    if(u.includes('rest/v1/surfers')) return J(200, data.surfers);
    if(u.includes('rest/v1/')) return J(200, []);
    if(/smilecdn|wsbfarm|supabase/.test(u)) return r.abort(); r.continue(); });
  await p.goto(PAGE, { waitUntil:'domcontentloaded' });
  await p.evaluate((m, keep)=>{ const k = keep || {}; localStorage.clear(); Object.entries(k).forEach(([a, v])=>localStorage.setItem(a, v));
    localStorage.setItem('lineup.share.invited', '1'); localStorage.setItem('lineup.share.onb', '1'); localStorage.setItem('lineup.share.me', JSON.stringify({ cohort:'6기', token:'T', ...m })); }, me, opt.keep);
  await p.goto(PAGE, { waitUntil:'networkidle2' });
  const S = (f, ...a)=>p.evaluate(f, ...a), sleep = ms=>new Promise(r=>setTimeout(r, ms));
  await sleep(2000);
  await S(()=>{ for(let i = 0; i < 5 && !document.getElementById('pop').hidden; i++) popClose(); });
  await sleep(opt.wait || 2600);
  return { b, p, errs, S, sleep };
}
const info = S => S(()=>{ const bar = document.getElementById('adv-bar'), sh = document.getElementById('kcg-sheet'), home = document.getElementById('pane-home');
  return { bar:!!bar && !bar.hidden, cls:bar?.className || '', txt:bar ? bar.textContent.replace(/\s+/g, ' ').trim() : '', first:home.firstElementChild?.id || '',
    bdayAfter:!!document.getElementById('bday-bar') && bar?.nextElementSibling?.id === 'bday-bar' && !document.getElementById('bday-bar').hidden, sheet:!!sh && !sh.hidden,
    links:[...document.querySelectorAll('#adv-bar a')].map(a=>[a.textContent.trim(), a.href, a.target, a.rel]), wide:document.documentElement.scrollWidth - innerWidth }; });

/* 1) 공식 특보 — 띠 + 자동 열림(하루 한 번) */
console.log('[공식 풍랑주의보]');
let t = await launch(390, ADV, fc0, { bday:true });
let I = await info(t.S);
ok(I.bar && /adv/.test(I.cls), '빨간 띠가 뜬다');
ok(/풍랑주의보 · 강원북부앞바다·강원중부앞바다/.test(I.txt) && /기상특보활동신고」가 필요해요/.test(I.txt), '문구: ' + I.txt.slice(0, 80));
ok(I.first === 'adv-bar', '홈 맨 위');
ok(I.bdayAfter, '생일 띠는 그 아래');
ok(I.links.some(l=>/신고하러 가기/.test(l[0]) && l[1].endsWith('weathrSpcnwsDclr/infoIns2.do') && l[2] === '_blank' && /noopener/.test(l[3])), '🚤 신고하러 가기 → 해경 새 탭');
ok(I.links.some(l=>/기상청 특보 보기/.test(l[0]) && l[1] === 'https://www.weather.go.kr/w/special-report/overall.do' && /noopener/.test(l[3])), '🌪️ 기상청 특보 보기 → 특보 페이지 새 탭');
ok(I.sheet, '신고 창이 저절로 열림');
const sh = await t.S(()=>({ t:document.querySelector('#kcg-sheet .kcg-st')?.textContent || '', links:[...document.querySelectorAll('#kcg-sheet .kcg-links a')].map(a=>[a.textContent.trim().slice(0, 20), a.href, a.target, a.rel]) }));
ok(/지금 특보: 풍랑주의보/.test(sh.t), '창 위 특보 줄');
ok(sh.links.length === 6 && sh.links.every(l=>l[2] === '_blank' && /noopener/.test(l[3])) && sh.links.some(l=>l[1].includes('special-report/overall.do')) && sh.links.some(l=>l[1].includes('weathrSpcnwsDclr/infoChg1.do')), '공식 링크 6개(새 탭·noopener, 기상청 특보 포함)');
fs.writeFileSync(SHOT + 'adv-sheet-390.png', await t.p.screenshot());
await t.p.goBack(); await t.sleep(500);
ok(await t.S(()=>document.getElementById('kcg-sheet').hidden), '뒤로가기로 창이 닫힘');
fs.writeFileSync(SHOT + 'adv-bday-390.png', await t.p.screenshot());
const keep = await t.S(()=>({ 'lineup.share.adv.open':localStorage.getItem('lineup.share.adv.open') }));
ok(t.errs.length === 0, 'errs ' + JSON.stringify(t.errs)); await t.b.close();
t = await launch(390, ADV, fc0, { keep });
I = await info(t.S); ok(I.bar && !I.sheet, '같은 날 다시 열면 띠만, 창은 안 열림'); await t.b.close();

/* 2) 경보 — 금지 문구, 신고 버튼 대신 특보 보기 */
console.log('[풍랑경보]');
t = await launch(360, WARN, fc0); I = await info(t.S);
ok(/warn/.test(I.cls) && /^⚠️\s*풍랑경보/.test(I.txt) && /금지예요/.test(I.txt), '경보가 먼저 · 금지 문구: ' + I.txt.slice(0, 60));
ok(I.links.some(l=>/기상청 특보 보기/.test(l[0])), '특보 보기 버튼');
await t.S(()=>{ const s = document.getElementById('kcg-sheet'); if(s) s.hidden = true; }); await t.sleep(300);
fs.writeFileSync(SHOT + 'adv-warn-360.png', await t.p.screenshot()); await t.b.close();

/* 3) 특보 없음 → 아무것도 */
console.log('[특보 없음]');
t = await launch(390, { ok:true, active:[], tmFc:null }, big); I = await info(t.S);
ok(!I.bar && !I.sheet, '띠·창 없음(예보가 커도 공식이 없다고 했으면 어림 안 함)'); await t.b.close();

/* 4) 키 없음 + 큰 예보 → 노란 어림 띠, 자동 열림 없음 */
console.log('[키 없음 + 큰 예보]');
t = await launch(390, { ok:false, reason:'nokey' }, big, { wait:4000 }); await t.S(()=>window._kcg.paint()); I = await info(t.S);
ok(I.bar && /est/.test(I.cls) && /주의보 수준 예보 — 내일 파고 3.4m · 바람 15.2m\/s/.test(I.txt) && /공식 특보 아님/.test(I.txt), '어림 띠: ' + I.txt.slice(0, 70));
ok(!I.sheet, '어림일 땐 창을 저절로 안 연다');
ok(I.links.some(l=>l[1].includes('special-report/overall.do')), '기상청 특보 보기 링크');
fs.writeFileSync(SHOT + 'adv-est-390.png', await t.p.screenshot());
await t.b.close();
console.log('[키 없음 + 보통 예보]');
t = await launch(390, { ok:false, reason:'nokey' }, fc0, { wait:4000 }); await t.S(()=>window._kcg.paint()); I = await info(t.S);
ok(!I.bar, '예보도 잔잔하면 띠 없음'); await t.b.close();

/* 5) 주입 방어 */
console.log('[주입]');
t = await launch(390, EVIL, fc0); I = await info(t.S);
ok(!(await t.S(()=>window.__pwn)) && !(await t.S(()=>document.querySelector('#adv-bar img, #kcg-sheet img'))), '기상청 값의 HTML 이 실행·삽입되지 않음');
ok(/풍랑주의보 · 강원북부앞바다지금/.test(I.txt), '모르는 종류·구역은 버림: ' + I.txt.slice(0, 40)); await t.b.close();

/* 6) 메모 — 기타 메뉴로 열기, 저장·복사, 전화번호 지움, 다시 열면 남아 있음 + 폭 */
for(const w of [320, 360, 390]){
  console.log(`[메모 · ${w}px]`);
  t = await launch(w, ADV, fc0);
  await t.S(()=>{ document.getElementById('kcg-sheet').hidden = true; }); await t.sleep(300);
  I = await info(t.S); ok(I.wide <= 0, '홈 가로 넘침 없음 ' + I.wide);
  const bb = await t.S(()=>[...document.querySelectorAll('#adv-bar .adv-btns > *')].map(e=>{ const r = e.getBoundingClientRect(); return [Math.round(r.right), Math.round(r.height)]; }));
  ok(bb.every(([r, h])=>r <= w && h >= 44), '띠 버튼이 화면 안 · 44px 이상 ' + JSON.stringify(bb));
  fs.writeFileSync(SHOT + `adv-home-${w}.png`, await t.p.screenshot());
  await t.S(()=>{ document.getElementById('t-more').click(); }); await t.sleep(300);
  await t.S(()=>document.querySelector('[data-more="kcg"]').click()); await t.sleep(300);
  ok(await t.S(()=>!document.getElementById('kcg-sheet').hidden && document.getElementById('more-sheet').hidden), '☰기타 → 🚤 수상레저 신고');
  ok(await t.S(()=>/이성현 님/.test(document.querySelector('.kcg-memo .who').textContent)), '이름은 보여 주기만');
  await t.S(()=>{ const s = document.getElementById('kcg-spot'); s.value = '죽도'; s.dispatchEvent(new Event('change', { bubbles:true }));
    document.getElementById('kcg-kind').value = 'SUP'; document.getElementById('kcg-n').value = '3'; document.getElementById('kcg-gear').value = '2';
    document.getElementById('kcg-t0').value = '09:00'; document.getElementById('kcg-t1').value = '12:00';
    document.getElementById('kcg-note').value = '강습 일행 010-1234-5678 / 900101-1234567'; });
  await t.S(()=>document.getElementById('kcg-save').click()); await t.sleep(200);
  const m = await t.S(()=>JSON.parse(localStorage.getItem('lineup.share.kcgmemo')));
  ok(m.spot === '죽도' && m.kind === 'SUP' && m.n === 3 && m.gear === 2 && m.t0 === '09:00' && m.t1 === '12:00', '저장 ' + JSON.stringify(m));
  ok(!/\d{3}-\d{4}-\d{4}|\d{6}-\d{7}/.test(JSON.stringify(m)) && /강습 일행/.test(m.note), '전화번호·주민번호는 지우고 저장');
  await t.S(()=>document.getElementById('kcg-copy').click()); await t.sleep(300);
  const c = await t.S(()=>window._kcgLastCopy || '');
  ok(/활동 장소: 죽도/.test(c) && /활동 종류: SUP/.test(c) && /인원: 3명/.test(c) && /09:00 ~ 12:00/.test(c) && /서프보드 2개/.test(c) && /이름: 이성현/.test(c), '복사 글');
  ok(!/주민|\d{6}-\d{7}/.test(c.replace('주민등록', '')), '복사 글에 주민번호 없음');
  ok(await t.S(()=>document.getElementById('kcg-sheet').scrollWidth <= innerWidth && document.querySelector('#kcg-sheet .sheet-in').scrollWidth <= document.querySelector('#kcg-sheet .sheet-in').clientWidth), '창 가로 넘침 없음');
  fs.writeFileSync(SHOT + `adv-memo-${w}.png`, await t.p.screenshot());
  await t.S(()=>document.querySelector('#kcg-sheet .sheet-in').scrollTo(0, 9999)); await t.sleep(150);
  fs.writeFileSync(SHOT + `adv-memo2-${w}.png`, await t.p.screenshot());
  /* 직접 입력 */
  await t.S(()=>{ const s = document.getElementById('kcg-spot'); s.value = '__'; s.dispatchEvent(new Event('change', { bubbles:true })); document.getElementById('kcg-spot2').value = '남애 3리 북쪽'; document.getElementById('kcg-save').click(); });
  ok((await t.S(()=>JSON.parse(localStorage.getItem('lineup.share.kcgmemo')).spot)) === '남애 3리 북쪽', '장소 직접 입력');
  await t.S(()=>document.querySelector('#kcg-sheet [data-kcgclose].btn').click()); await t.sleep(200);
  await t.S(()=>window.kcgOpen()); await t.sleep(200);
  ok(await t.S(()=>document.getElementById('kcg-spot').value === '__' && document.getElementById('kcg-spot2').value === '남애 3리 북쪽' && !document.getElementById('kcg-spot2').hidden), '다시 열면 메모가 그대로');
  await t.p.goBack(); await t.sleep(400);
  ok(await t.S(()=>document.getElementById('kcg-sheet').hidden), '뒤로가기로 닫힘');
  /* 파도 상세에서도 */
  if(w === 390){ await t.S(()=>{ window.waveDetail(0); }); await t.sleep(300);
    await t.S(()=>document.querySelector('[data-wvkcg]').click()); await t.sleep(300);
    ok(await t.S(()=>document.getElementById('wv-sheet').hidden && !document.getElementById('kcg-sheet').hidden), '파도 상세 → 🚤 신고 창'); }
  ok(t.errs.length === 0, 'errs ' + JSON.stringify(t.errs)); await t.b.close();
}
console.log(fail ? `FAIL ${fail}` : 'advisory OK');
process.exit(fail ? 1 : 0);
