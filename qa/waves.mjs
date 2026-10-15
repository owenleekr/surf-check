/* 이번주의 파도 — 홈 7일 띠(주말 강조)·주말 줄·추천 스팟, 날짜 누르면 상세(오전/오후·구역·추천·캠 버튼), 서핑 스팟 화면의 요일별 추천, 예보 실패 시 숨김 */
import { open } from './mock.mjs';
import fs from 'fs';
const fc = JSON.parse(fs.readFileSync(new URL('./fixture-forecast.json', import.meta.url)));
const snap=(await import('../api/_naver-snapshot.js')).default;
for(const on of (process.env.ONLY ? [process.env.ONLY === "1"] : [true, false])){
  const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }], __fc:on ? fc : null, __naver:{ folders:snap.folders } }, { id:'u4', name:'이성현', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:3000 });
  await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); localStorage.removeItem('lineup.share.fc'); setTab('home'); window.waveHome?.(); }); await t.sleep(1200);
  console.log(on ? '[예보 있음]' : '[예보 없음]', await t.S(()=>({ 카드:!document.getElementById('home-wave').hidden, 날:[...document.querySelectorAll('#home-wave .wv-d')].map(b=>b.textContent.replace(/\s+/g,' ').trim()), 주말:[...document.querySelectorAll('#home-wave .wv-wk')].map(b=>b.textContent.replace(/\s+/g,' ').trim().slice(0, 80)) })));
  if(on){
    await t.S(()=>document.getElementById('home-wave').scrollIntoView()); await t.sleep(200); fs.writeFileSync('/tmp/wave-home.png', await t.p.screenshot());
    await t.S(()=>document.querySelector('#home-wave .wv-wk').click()); await t.sleep(300);
    console.log('  상세', await t.S(()=>({ 제목:document.getElementById('wv-t').textContent, 추천:[...document.querySelectorAll('.wv-rs .wv-rm b')].map(b=>b.textContent), 캠버튼:document.querySelectorAll('[data-wvcam]').length, 구역:[...document.querySelectorAll('.wv-reg h4')].map(h=>h.textContent) })));
    fs.writeFileSync('/tmp/wave-detail.png', await t.p.screenshot());
    const cam = await t.S(()=>{ const b=document.querySelector('[data-wvcam]'); if(!b) return 'none'; b.click(); return state.tab; }); console.log('  캠 버튼 →', cam);
    await t.S(()=>{ foodOpen('spot'); }); await t.sleep(600);
    console.log('  스팟 화면 요일별 추천', await t.S(()=>({ 있음:!!document.querySelector('.wv-spot'), 날:document.querySelectorAll('.wv-spot .wv-d').length })));
  }
  console.log('  errs', t.errs); await t.b.close();
}
process.exit(0);
