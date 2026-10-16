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
console.log('errs', t.errs); await t.b.close();
// 새로 온 사람(오후) — 위 소식줄과 아래 추천 카드에 같은 말(「오늘 바다 다녀왔어요?」)이 두 번 나오지 않는다
const bad = [];
const t2 = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] }, { id:'u9', name:'새친구', profile:{ gender:'f', birth:'1' } }, { wait:2500, hour:14 });
await t2.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); setTab('home'); }); await t2.sleep(400);
const dup = await t2.S(async ()=>{ const card = ()=>document.querySelector('#home-rec b')?.textContent || '', out = [];
  for(let i = 0; i < 4; i++){ const top = typeof recTop === 'function' ? recTop()?.text : null; out.push({ 카드:card(), 소식줄:top || null });
    if(i === 1){ window.feedRefresh?.(); } document.getElementById('rec-next')?.click(); await new Promise(z=>setTimeout(z, 60)); }
  const n = [...document.querySelectorAll('#feed, #home-rec')].reduce((a, e)=>a + (e.hidden ? 0 : (e.textContent.match(/오늘 바다 다녀왔어요\?/g) || []).length), 0);
  return { out, 화면에보인횟수:n, 첫카드:out[0].카드 }; });
console.log('소식줄·카드 중복', JSON.stringify(dup));
if(dup.out.some(o=>o.소식줄 && o.소식줄 === o.카드)) bad.push('소식줄 추천 = 카드 추천');
if(dup.화면에보인횟수 > 1) bad.push('같은 말 두 번');
if(dup.첫카드 !== '오늘 바다 다녀왔어요?') bad.push('오후 새 사람 첫 추천이 일지가 아님(시험 전제)');
console.log('errs', t2.errs, '| bad', bad); await t2.b.close(); process.exit(bad.length || t.errs.length || t2.errs.length ? 1 : 0);
