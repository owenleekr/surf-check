/* 안 써 본 기능 추천 — 오늘 테이크오프 안 했으면 먼저, 다른 추천 넘기기, ✕ 오늘 숨김, 써 보면 사라짐 */
import { open } from './mock.mjs';
import fs from 'fs';
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] }, { id:'u4', name:'이성현', profile:{ gender:'f', birth:'1', play:{ base:50,bonus:0,badges:{},qd:{},qall:0,best:0,gday:'',gxp:0,gn:{},lvSeen:1, shells:40 } } }, { wait:2500, hour:9 });
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); setTab('home'); }); await t.sleep(400);
const cur = ()=>t.S(()=>({ 보임:!document.getElementById('home-rec').hidden, 제목:document.querySelector('#home-rec b')?.textContent, 순번:document.querySelector('#home-rec small')?.textContent }));
console.log('첫 추천', await cur());
fs.writeFileSync('/tmp/rec.png', await t.p.screenshot());
const seen=[]; for(let i=0;i<14;i++){ const c=await cur(); seen.push(c.제목); await t.S(()=>document.getElementById('rec-next')?.click()); await t.sleep(80); }
console.log('넘겨 본 추천', [...new Set(seen)]);
await t.S(()=>{ while(document.querySelector('#home-rec b')?.textContent !== '서프스케이트 훈련 3분') document.getElementById('rec-next').click(); document.getElementById('rec-x').click(); });
console.log('✕ 뒤 라인업 서핑 남음?', await t.S(()=>{ const out=[]; for(let i=0;i<14;i++){ out.push(document.querySelector('#home-rec b')?.textContent); document.getElementById('rec-next')?.click(); } return out.includes('서프스케이트 훈련 3분'); }));
await t.S(()=>{ skateOpen(); skateClose(); foodOpen('food'); setTab('home'); }); await t.sleep(400);
console.log('써 본 뒤 남음?', await t.S(()=>{ const out=[]; for(let i=0;i<14;i++){ out.push(document.querySelector('#home-rec b')?.textContent); document.getElementById('rec-next')?.click(); } return { 스케이트:out.some(x=>/서프스케이트/.test(x)), 맛집:out.includes('양서학 찐맛집 봤어요?'), 등록권유:out.includes('가 본 맛집 하나 등록해요') }; }));
console.log('소식줄에 추천', await t.S(()=>{ window.feedRefresh?.(); return typeof recTop === 'function' && recTop()?.text; }));
console.log('errs', t.errs); await t.b.close(); process.exit(0);
