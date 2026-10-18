/* 운영자 사용 현황(/stats): 열쇠 화면 → 목업 RPC 로 표·순위·게임·안 쓰는 메뉴·개선 요청이 그려지는지,
   남이 쓴 값(이름·요청 글·답)에 HTML 을 넣어도 실행되지 않는지, 상태 저장이 올바른 인자로 나가는지, 틀린 열쇠면 다시 열쇠 화면인지 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
const PAGE = (process.env.BASE || 'http://localhost:8765') + '/stats' + (process.env.BASE ? '' : '.html');
const OUT = process.env.SHOT || '/tmp';
const CORS = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'*', 'Access-Control-Allow-Methods':'*' };
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); console.log(c ? '  ✓' : '  ✗', m); };
const XSS = '<img src=x onerror="window.__xss=1">';
const now = Date.now(), iso = ms => new Date(now - ms).toISOString(), day = n => new Date(now - n * 864e5 + 9 * 36e5).toISOString().slice(0, 10);
const KEY = 'test-admin-key-0123456789';
const usage = days => ({ days, dau:3, wau:5, mau:7, opens_today:6,
  daily:Array.from({ length:days }, (_, i)=>({ d:day(i), u:(i * 3) % 6 + 1, n:40, s:(i % 4) + 2 })),
  rows:[{ ev:'tab', target:'food', n:42, u:5 }, { ev:'tab', target:'play', n:30, u:4 }, { ev:'menu', target:'more:kcg', n:3, u:2 }, { ev:'sheet', target:'fb-sheet', n:2, u:2 },
    { ev:'tab', target:'town', n:1, u:1 }, { ev:'action', target:'checkin', n:12, u:4 }, { ev:'action', target:'slog_save', n:5, u:3 }, { ev:'action', target:XSS, n:1, u:1 }],
  byday:[], games:[{ g:'jump', starts:20, ends:15, dur:95, u:4 }, { g:'quest', starts:4, ends:6, dur:300, u:2 }], plat:[] });
const visits = [
  { id:'u1', name:'이성현', cohort:'6기', last_seen:iso(3 * 36e5), s1:2, s7:9, s30:20, ev7:80, pwa:'1', os:'ios', br:'', ver:'v215' },
  { id:'u2', name:XSS, cohort:'6기', last_seen:iso(2 * 864e5), s1:0, s7:2, s30:3, ev7:10, pwa:'0', os:'android', br:'kakao', ver:'v214' },
  { id:'u3', name:'정선아', cohort:'open', last_seen:null, s1:0, s7:0, s30:0, ev7:0, pwa:null, os:null, br:null, ver:null },
  { id:'zz_test', name:'테스트', cohort:'6기', last_seen:iso(60e3), s1:1, s7:1, s30:1, ev7:1, pwa:'0', os:'mac', br:'', ver:'v215' } ];
const feedback = [
  { id:7, user_id:'u2', name:'김도훈', cohort:'6기', cat:'idea', text:'버스 탭에서 돌아오는 차도 ' + XSS, screen:'ride', ver:'v215', status:'접수', reply:null, created_at:iso(36e5) },
  { id:6, user_id:'u1', name:'이성현', cohort:'6기', cat:'bug', text:'캠이 가끔 안 나와요', screen:'cam', ver:'v215', status:'검토 중', reply:'확인하고 있어요 "' + XSS, created_at:iso(864e5) } ];

const b = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new' });
const errs = [], calls = [];
async function page(width, opt = {}){
  const p = await b.newPage();
  p.on('pageerror', e=>errs.push(String(e).slice(0, 160)));
  await p.setViewport({ width, height:width < 600 ? 844 : 900, deviceScaleFactor:2, isMobile:width < 600, hasTouch:width < 600 });
  await p.setRequestInterception(true);
  p.on('request', r=>{
    const u = r.url(), J = (st, o)=>r.respond({ status:st, headers:CORS, contentType:'application/json', body:JSON.stringify(o) });
    if(r.method() === 'OPTIONS') return r.respond({ status:204, headers:CORS, body:'' });
    if(u.includes('/rest/v1/rpc/')){ const fn = u.split('rpc/')[1].split('?')[0]; let a = {}; try{ a = JSON.parse(r.postData() || '{}'); }catch(e){} calls.push([fn, a]);
      if(a.p_key !== KEY) return J(400, { message:'noadmin' });
      if(fn === 'admin_usage') return J(200, usage(a.p_days));
      if(fn === 'admin_visits') return J(200, visits);
      if(fn === 'admin_feedback') return J(200, feedback);
      if(fn === 'admin_feedback_update') return J(200, true);
      return J(404, { message:'nofn' }); }
    if(/supabase/.test(u)) return r.abort();
    r.continue(); });
  await p.goto(PAGE, { waitUntil:'domcontentloaded' });
  if(opt.key) await p.evaluate(k=>localStorage.setItem('lineup.stats.key', k), opt.key); else await p.evaluate(()=>localStorage.removeItem('lineup.stats.key'));
  await p.reload({ waitUntil:'networkidle2' }); await new Promise(r=>setTimeout(r, 500));
  return p;
}

console.log('① 열쇠 없음 → 열쇠 화면, 틀린 열쇠 → 다시');
let p = await page(390);
ok(await p.evaluate(()=>!document.getElementById('gate').hidden && document.getElementById('app').hidden), '열쇠 화면이 먼저');
await p.type('#gate-k', 'wrong-key-but-long-enough'); await p.click('#gate-f button'); await new Promise(r=>setTimeout(r, 600));
ok(await p.evaluate(()=>!document.getElementById('gate').hidden && /맞지 않아요/.test(document.getElementById('gate-err').textContent) && !localStorage.getItem('lineup.stats.key')), '틀린 열쇠 — 안내 + 기억 안 함');
await p.type('#gate-k', KEY); await p.click('#gate-f button'); await new Promise(r=>setTimeout(r, 800));
ok(await p.evaluate(()=>!document.getElementById('app').hidden && localStorage.getItem('lineup.stats.key')), '맞는 열쇠 — 화면 열리고 기억');
await p.close();

console.log('② 화면 (390)');
p = await page(390, { key:KEY });
const s = await p.evaluate(()=>({
  kpi:[...document.querySelectorAll('.kpi')].map(k=>k.textContent),
  bars:document.querySelectorAll('#chart rect.b').length,
  rows:[...document.querySelectorAll('#visits tbody tr')].map(t=>t.textContent.replace(/\s+/g, ' ').trim()),
  menus:[...document.querySelectorAll('#menus li .lb')].map(x=>x.textContent),
  acts:[...document.querySelectorAll('#acts li .lb')].map(x=>x.textContent),
  games:[...document.querySelectorAll('#games tbody tr')].map(t=>t.textContent.replace(/\s+/g, ' ').trim()),
  unused:[...document.querySelectorAll('#unused li .lb')].map(x=>x.textContent),
  fb:document.querySelectorAll('#fb-list .fb').length,
  imgs:document.querySelectorAll('main img').length, xss:window.__xss || 0,
  wide:document.documentElement.scrollWidth > innerWidth + 1 }));
console.log('  ', JSON.stringify(s).slice(0, 900));
ok(s.kpi.some(k=>/3명/.test(k) && /오늘 활성/.test(k)) && s.kpi.some(k=>/5명/.test(k)), 'DAU·WAU 카드');
ok(s.bars === 14, '14일 막대 14개');
ok(s.rows.length === 3 && !s.rows.some(r=>/테스트/.test(r)), '사람 3명(테스트 계정 숨김)');
ok(s.rows[0].startsWith('이성현') && /3시간 전/.test(s.rows[0]) && /홈 화면 앱/.test(s.rows[0]), '최근 접속 순 · 「3시간 전」 · 홈 화면 앱');
ok(s.rows.some(r=>/기록 없음/.test(r)), '기록 없는 사람도 보임');
ok(s.rows.some(r=>r.includes('<img src=x')), '이름의 HTML 은 글자로');
ok(s.menus[0] === '탭 › 맛집' && s.menus.includes('기타 › 수상레저 신고'), '메뉴 순위 이름표');
ok(s.acts[0] === '체크인', '주요 행동 순위');
ok(s.games[0].startsWith('🏄 파도 점프') && /1분 35초/.test(s.games[0]), '게임 평균 시간');
ok(s.unused.includes('마을 · 채팅') && s.unused.includes('카풀') && !s.unused.includes('맛집'), '안 쓰는 메뉴 — 마을·카풀은 있고 맛집은 없음');
ok(s.fb === 2, '개선 요청 2건');
ok(s.imgs === 0 && s.xss === 0, '주입 방어 — img 태그 0 · 실행 0');
ok(!s.wide, '390 가로 넘침 없음');
fs.writeFileSync(`${OUT}/trk-stats-390.png`, await p.screenshot({ fullPage:true }));

console.log('③ 정렬 · 상태 저장');
await p.evaluate(()=>document.querySelector('[data-sort="name"]').click());
const sorted = await p.evaluate(()=>[...document.querySelectorAll('#visits tbody tr td:first-child')].map(t=>t.textContent));
ok(JSON.stringify(sorted) === JSON.stringify([...sorted].sort((a, b)=>a > b ? 1 : a < b ? -1 : 0)), '이름 오름차순');
calls.length = 0;
await p.evaluate(()=>{ const box = document.querySelector('[data-fid="7"]'); box.querySelector('[data-fst]').value = '반영됨'; box.querySelector('[data-frp]').value = '다음 버전에 넣었어요 🙏'; box.querySelector('[data-fsave]').click(); });
await new Promise(r=>setTimeout(r, 500));
const up = calls.find(c=>c[0] === 'admin_feedback_update');
console.log('  ', JSON.stringify(up));
ok(up && up[1].p_id === 7 && up[1].p_status === '반영됨' && up[1].p_reply === '다음 버전에 넣었어요 🙏' && up[1].p_key === KEY, '저장 인자(p_key·p_id·p_status·p_reply)');
ok(await p.evaluate(()=>/반영됨/.test(document.querySelector('[data-fid="7"] .fb-hd').textContent) && /저장했어요/.test(document.getElementById('toast').textContent)), '저장 후 상태 표시 · 토스트');
await p.evaluate(()=>document.querySelector('[data-fbf="반영됨"]').click());
ok(await p.evaluate(()=>document.querySelectorAll('#fb-list .fb').length === 1), '상태 거르기');
await p.evaluate(()=>document.querySelector('[data-days="7"]').click()); await new Promise(r=>setTimeout(r, 600));
ok(await p.evaluate(()=>document.querySelectorAll('#chart rect.b').length === 7), '7일로 바꾸면 막대 7개');
await p.close();

console.log('④ 데스크톱');
p = await page(1280, { key:KEY });
ok(await p.evaluate(()=>document.documentElement.scrollWidth <= innerWidth + 1), '1280 가로 넘침 없음');
fs.writeFileSync(`${OUT}/trk-stats-1280.png`, await p.screenshot({ fullPage:true }));
await p.close();

console.log('errs', errs);
await b.close();
if(errs.length) fails.push('page errors');
if(fails.length){ console.log('FAIL', fails); process.exit(1); }
console.log('OK stats'); process.exit(0);
