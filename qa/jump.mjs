/* /jump 단독 페이지 — 이름 넣기 → 시작 화면 → 한 판 → 결과(XP 문구 없음) → 순위표(표 없으면 '준비 중', 있으면 이름별 최고) · 띄어쓰기로 게임 시작 안 됨 · 주입 방어 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
const BASE = process.env.BASE || 'http://localhost:8765';
const run = async (withTable)=>{
  const b = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new' });
  const p = await b.newPage(); const errs = [], posts = [];
  p.on('pageerror', e=>errs.push(String(e).slice(0, 160)));
  await p.setViewport({ width:390, height:844, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  await p.setRequestInterception(true);
  const rows = [{ name:'김도훈', mode:'easy', score:500 }, { name:'<img src=x onerror=window.__f=1>', mode:'easy', score:300 }, { name:'김도훈', mode:'easy', score:200 }, { name:'바다', mode:'hard', score:900 }];
  p.on('request', r=>{ const u = r.url(), CORS = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'*', 'Access-Control-Allow-Methods':'*' };
    if(r.method() === 'OPTIONS' && u.includes('supabase')) return r.respond({ status:204, headers:CORS, body:'' });
    if(u.includes('rest/v1/jump_scores')){
      if(!withTable) return r.respond({ status:404, headers:CORS, contentType:'application/json', body:'{}' });
      if(r.method() === 'POST'){ posts.push(JSON.parse(r.postData())); return r.respond({ status:201, headers:CORS, body:'' }); }
      const body = u.includes('mode=eq.daily') ? [{ name:'오늘왕', score:420 }] : rows;
      return r.respond({ status:200, headers:CORS, contentType:'application/json', body:JSON.stringify(body) }); }
    if(/supabase/.test(u)) return r.abort(); r.continue(); });
  await p.goto(BASE + '/jump.html', { waitUntil:'networkidle2' }); await p.evaluate(()=>localStorage.clear()); await p.reload({ waitUntil:'networkidle2' }); await new Promise(r=>setTimeout(r, 800));
  const S = (f, ...a)=>p.evaluate(f, ...a);
  console.log(withTable ? '[표 있음]' : '[표 없음]', '이름 카드', await S(()=>({ 보임:!!document.getElementById('name-in'), 제목:document.querySelector('#g-ov .go-t')?.textContent })));
  await p.type('#name-in', '파도 왕'); await new Promise(r=>setTimeout(r, 200));
  console.log('  띄어쓰기로 게임 시작 안 됨', await S(()=>!window._gameRun));
  await S(()=>document.getElementById('name-go').click()); await new Promise(r=>setTimeout(r, 600));
  console.log('  시작 화면', await S(()=>({ 제목:document.querySelector('#g-ov .go-t')?.textContent, 최고:document.querySelector('#g-ov .go-b')?.textContent, 이름칩:document.getElementById('who').textContent, 주입:window.__f || 0 })));
  if(withTable) fs.writeFileSync('/tmp/jump-start.png', await p.screenshot());
  // 쉬움 한 판 끝내기
  await S(()=>{ const g=_game; g.begin(false); const s=g.st; s.pts=777; s.obs=[{k:'rock',w:12,h:10,y:0,x:40}]; g.step(1/60); }); await new Promise(r=>setTimeout(r, 1200));
  console.log('  결과', await S(()=>({ 제목:document.querySelector('#g-ov .go-t')?.textContent, 줄:[...document.querySelectorAll('#g-ov .go-b')].map(x=>x.textContent), 저장:JSON.parse(localStorage.getItem('jump.me')).play.best })));
  if(withTable) fs.writeFileSync('/tmp/jump-over.png', await p.screenshot());
  await S(()=>document.getElementById('g-exit').click()); await new Promise(r=>setTimeout(r, 300));
  console.log('  닫기 → 시작 화면', await S(()=>document.querySelector('#g-ov .go-t')?.textContent), '| 게임창 그대로', await S(()=>!document.getElementById('game').hidden));
  await S(()=>document.getElementById('lb-open').click()); await new Promise(r=>setTimeout(r, 500));
  await S(()=>document.querySelector('[data-lb="easy"]').click()); await new Promise(r=>setTimeout(r, 200));
  console.log('  순위표(쉬움)', await S(()=>[...document.querySelectorAll('#lb-body .lb-row, #lb-body .lb-none')].map(x=>x.textContent.replace(/\s+/g,' ').trim())), '| 주입', await S(()=>window.__f || 0));
  if(withTable){ console.log('  올린 기록', JSON.stringify(posts)); fs.writeFileSync('/tmp/jump-lb.png', await p.screenshot()); }
  console.log('  errs', errs); await b.close();
};
await run(false); await run(true); process.exit(0);
