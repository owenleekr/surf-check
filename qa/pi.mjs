/* 맛집 세부 분류·사진·블로그 후기 — 키 없으면 아무것도 안 보임 / 있으면 분류 태그·종류 칩·사진·후기(원문 링크), 주입 방어 */
import { open } from './mock.mjs';
import fs from 'fs';
const snap=(await import('../api/_naver-snapshot.js')).default;
const cats=['고기','횟집·해산물','면','곱창'];
for(const on of [false, true]){
  const data={ surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}], __naver:{folders:snap.folders} };
  if(on) data.__pi = u => { const n=decodeURIComponent((u.match(/n=([^&]+)/)||[])[1]||''); const k=n.length%4; return { enabled:true, cat:cats[k], img:[{thumb:'https://search.pstatic.net/x.jpg',link:'https://blog.naver.com/a'},{thumb:'javascript:alert(1)',link:'x'}], blogs:[{t:n+' 후기 <img src=x onerror=window.__f=1>',d:'맛있어요',link:'https://blog.naver.com/b',by:'블로거',date:'20261001'}] }; };
  const t=await open(data,{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1}},{wait:2500});
  await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); localStorage.removeItem('lineup.share.pi'); setTab('food'); }); await t.sleep(2500);
  console.log(on?'[키 있음]':'[키 없음]', await t.S(()=>({ 분류태그:[...document.querySelectorAll('.pi-cat:not([hidden])')].length, 종류칩:[...document.querySelectorAll('[data-fcat]')].map(b=>b.textContent.replace(/\s+/g,' ').trim()), 사진:document.querySelectorAll('.pi-imgs img').length, js사진:[...document.querySelectorAll('.pi-imgs a, .pi-imgs img')].filter(x=>/javascript/i.test(x.getAttribute('href')||x.getAttribute('src')||'')).length, 후기:document.querySelectorAll('.pi-b').length, 주입:window.__f||0 })));
  if(on){ await t.S(()=>document.querySelector('[data-fcat="고기"]')?.click()); await t.sleep(300);
    console.log('  고기만', await t.S(()=>({ 카드:document.querySelectorAll('.food-card').length, 모두고기:[...document.querySelectorAll('.food-card .pi-cat')].every(x=>x.textContent==='고기') })));
    await t.S(()=>document.querySelector('.food-card .pi-blog')?.setAttribute('open','')); await t.S(()=>document.querySelector('.food-card').scrollIntoView()); await t.sleep(200);
    fs.writeFileSync('/tmp/pi.png', await t.p.screenshot()); }
  console.log('  errs', t.errs); await t.b.close();
}
process.exit(0);
