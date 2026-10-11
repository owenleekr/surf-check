import { open } from './mock.mjs';
import fs from 'fs';
const snap=(await import('../api/_naver-snapshot.js')).default;
const evil={id:'999',n:'<img src=x onerror=window.__f=1>',a:'강원 양양군 <b>',lat:38.11,lon:128.64,m:'<img src=x onerror=window.__f=2>',c:'음식점',u:'javascript:window.__f=3',t:Date.now()};
const sp=snap.folders.find(f=>f.kind==='spot'), evil2={...evil,id:'998',n:'<b>악성스팟</b>',lat:38.0,lon:128.7};
const data={folders:[{...snap.folders[0],items:[...snap.folders[0].items,evil]},{...sp,items:[...sp.items,evil2]}]};
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}},{id:'infinagree',name:'이성현',cohort:'6기',profile:{}}],__naver:data},{id:'u4',name:'테스터',profile:{gender:'f',birth:'1',dressed:1}},{wait:3000});
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(300);
console.log('탭', await t.S(()=>({ 탭수:document.querySelectorAll('#nav button').length, 가로넘침:document.documentElement.scrollWidth-innerWidth, 버튼폭:Math.round(document.getElementById('t-food').getBoundingClientRect().width) })));
console.log('홈 줄', await t.S(()=>[...document.querySelectorAll('.hrow')].map(r=>r.textContent.replace(/\s+/g,' ').trim()).filter(x=>x.includes('맛집'))));
await t.S(()=>document.querySelector('.hrow[data-go="food"]').click()); await t.sleep(800);
console.log('맛집 탭', await t.S(()=>({ 탭:state.tab, 카드:document.querySelectorAll('.food-card').length, 안내:!!document.querySelector('.food-how'), 링크:[...document.querySelectorAll('.food-how a')].map(a=>a.getAttribute('href')), 쪽지버튼:!!document.getElementById('food-rec'), 칩:[...document.querySelectorAll('[data-area]')].map(b=>b.textContent.replace(/\s+/g,' ').trim()) })));
await t.S(()=>document.getElementById('food-rec').click()); await t.sleep(500);
console.log('추천 쪽지', await t.S(()=>({ 열림:!document.getElementById('mail-sheet').hidden, 받는사람:document.getElementById('mail-to-name').textContent, 양식:document.getElementById('mail-text').value.split('\n')[0] })));
await t.S(()=>mailClose());
console.log('주입', await t.S(()=>({f:window.__f||0, js링크:[...document.querySelectorAll('#pane-food a')].filter(a=>/^javascript/i.test(a.getAttribute('href'))).length })));
await t.S(()=>document.querySelector('#food-seg [data-view="spot"]').click()); await t.sleep(400);
console.log('서핑 스팟', await t.S(()=>({ 카드:document.querySelectorAll('.food-card').length, 첫:document.querySelector('.food-card b').textContent, 캠버튼:document.querySelectorAll('[data-cam]').length, 링크예:document.querySelector('.food-card a').getAttribute('href').slice(0,60), 칩:[...document.querySelectorAll('[data-sarea]')].map(b=>b.textContent.replace(/\s+/g,' ').trim()), 캠이름:[...document.querySelectorAll('[data-cam]')].map(b=>b.dataset.cam), 아라캠프:document.body.textContent.includes('아라캠프'), 스팟쪽지:!!document.getElementById('spot-rec'), 주입:window.__f||0 })));
await t.S(()=>document.querySelector('[data-sarea="고성"]').click()); await t.sleep(300);
console.log('고성만', await t.S(()=>({ 카드:document.querySelectorAll('.food-card').length, 다른해변:document.body.textContent.includes('다른 해변') })));
await t.S(()=>document.querySelector('[data-sarea="전체"]').click()); await t.sleep(300);
await t.S(()=>document.getElementById('spot-rec').click()); await t.sleep(500);
console.log('스팟 쪽지', await t.S(()=>document.getElementById('mail-text').value.split('\n')[0])); await t.S(()=>mailClose());
fs.writeFileSync('/tmp/food2.png', await t.p.screenshot());
await t.S(()=>document.querySelector('[data-cam]').click()); await t.sleep(400); console.log('캠 보기 →', await t.S(()=>state.tab));
// 온보딩: 맛집 단계
await t.S(()=>{ onbStart(); }); const names=[]; for(let i=0;i<14;i++){ const st=await t.S(()=>({ n:ONB.length, i:onbI, t:ONB[onbI]?.t, at:ONB[onbI]?.at, 대상보임:!!document.getElementById(ONB[onbI]?.at)?.offsetParent, 탭:state.tab })); if(st.t&&st.t.includes('맛집')) console.log('온보딩 맛집 단계', JSON.stringify(st)); const last=st.i>=st.n-1; await t.S(()=>document.getElementById('onb-next').click()); if(last) break; await t.sleep(120); }
console.log('errs',t.errs); await t.b.close(); process.exit(0);
