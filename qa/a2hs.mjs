/* 홈 화면에 추가 — 플랫폼별 안내(아이폰 사파리·카톡 인앱·안드로이드 설치 신호), standalone 이면 숨김, ✕ 14일 */
import puppeteer from 'puppeteer-core';
import { open } from './mock.mjs';
import fs from 'fs';
const UAS = {
  iphone:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  kakaoIOS:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.8.5',
  kakaoAnd:'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36 KAKAOTALK 10.8.5',
  android:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
};
for(const [k, ua] of Object.entries(UAS)){
  const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] }, { id:'u4', name:'테스터', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:2200, ua });
  await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); setTab('home'); }); await t.sleep(300);
  if(k === 'android') await t.S(()=>{ const e = new Event('beforeinstallprompt'); e.prompt = ()=>{ window.__prompted = 1; }; e.userChoice = Promise.resolve({ outcome:'accepted' }); dispatchEvent(e); });
  await t.sleep(200);
  const card = await t.S(()=>({ 보임:!document.getElementById('a2hs').hidden, 글:document.querySelector('#a2hs small')?.textContent }));
  await t.S(()=>document.getElementById('a2-go').click()); await t.sleep(300);
  const sheet = await t.S(()=>({ 시트:!!document.getElementById('a2-sheet') && !document.getElementById('a2-sheet').hidden, 버튼:[...document.querySelectorAll('#a2-body a')].map(a=>a.getAttribute('href').slice(0,40)), 단계:[...document.querySelectorAll('#a2-body .a2-st li')].map(l=>l.textContent.replace(/\s+/g,' ').trim().slice(0,30)), 설치호출:window.__prompted||0 }));
  console.log(k, JSON.stringify(card), JSON.stringify(sheet));
  if(k === 'iphone'){ fs.writeFileSync('/tmp/a2-iphone.png', await t.p.screenshot());
    await t.S(()=>{ document.getElementById('a2-sheet').hidden = true; document.getElementById('a2-x').click(); }); console.log('✕ 뒤 숨김', await t.S(()=>document.getElementById('a2hs').hidden)); }
  if(k === 'android') console.log('설치 후 카드', await t.S(()=>{ dispatchEvent(new Event('appinstalled')); return document.getElementById('a2hs').hidden; }));
  console.log('  errs', t.errs); await t.b.close();
}
process.exit(0);
