/* 🚌 버스 남은 좌석 — 차량 탭 → 버스 빈자리: 방향·날짜, 좌석 표시(매진·몇 석), 🔕→🔔 알림 걸기, 자리 나면 토스트, 서버 실패 시 안내 */
import { open } from './mock.mjs';
import fs from 'fs';
let left = 0;
/* 좌석도: 2+1 두 줄 + 2+2 한 줄 — 빈 좌석 1·3·6·7·8, 그중 창가(줄 양 끝)는 1·3·6·7 (8은 통로 쪽) */
const bus = u => /map=/.test(u) ? { rows:[[{n:1,free:true},{n:2,free:false},{n:3,free:true,gap:true}],[{n:4,free:false},{n:5,free:false},{n:6,free:true,gap:true}],[{n:7,free:true},{n:8,free:true},{n:9,free:false,gap:true},{n:10,free:false}]] } : ({ fetched:new Date().toISOString(), dir:/dir=in/.test(u) ? 'in' : 'out', date:'x', from:'동서울', to:'양양',
  buses:[{ t:'23:50', co:'금강고속', dur:'2:40', grade:'일반', fare:21600, left, total:41, shut:false, k:'RT1~3~20261016' }, { t:'23:55', co:'동해상사고속', dur:'1:45', grade:'우등', fare:19900, left:12, total:28, shut:false }, { t:'23:57', co:'금강고속', grade:'프리미엄', fare:28000, left:5, total:21, k:'RT2~3~20261016' }, { t:'23:58', co:'<b>x</b>', grade:'', left:2, total:28 }] });
const data = { surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }], __bus:bus };
const t = await open(data, { id:'u4', name:'이성현', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:2500 });
/* 가짜 버스 시간이 밤 11시대라, 그 뒤에 돌리면 '이미 출발한 차'로 빠져 테스트가 깨졌다 — 지금을 아침 6시로 고정 */
await t.S(()=>{ Date.prototype.toTimeString = function(){ return '06:00:00 GMT+0900'; }; });
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); localStorage.removeItem('lineup.share.buswatch'); busOpen(); }); await t.sleep(700);
console.log('목록', await t.S(()=>[...document.querySelectorAll('.bs-row')].map(r=>r.textContent.replace(/\s+/g,' ').trim())), '| 주입', await t.S(()=>document.querySelectorAll('.bs-row b b').length));
await t.S(()=>document.querySelector('.bs-row.tap').click()); await t.sleep(400);
console.log('좌석도', await t.S(()=>({ 칸:[...document.querySelectorAll('.bs-st')].map(x=>x.textContent+(x.classList.contains('f')?'○':'●')).join(' '), 요약:document.querySelector('.bs-seat small')?.textContent })));
/* 등급 거르기 · 🪟 창가만 */
let bad = 0; const ok = (name, cond, v) => { console.log(cond ? '✓' : '✗', name, JSON.stringify(v)); if(!cond) bad++; };
const rows = () => t.S(()=>[...document.querySelectorAll('.bs-row .bs-t')].map(x=>x.textContent));
ok('등급 칩', true, await t.S(()=>[...document.querySelectorAll('[data-bgr]')].map(b=>b.textContent)));
await t.S(()=>document.querySelector('[data-bgr="pr"]').click()); await t.sleep(150);
let r = await rows(); ok('프리미엄만', r.join() === '23:57', r);
ok('저장', await t.S(()=>JSON.parse(localStorage.getItem('lineup.share.buspref')).gr) === 'pr', 'pr');
await t.S(()=>document.querySelector('[data-bgr="ud"]').click()); await t.sleep(150);
r = await rows(); ok('우등만(등급 빈 28석 포함)', r.join() === '23:55,23:58', r);
await t.S(()=>document.querySelector('[data-bgr=""]').click()); await t.sleep(150);
r = await rows(); ok('전체', r.length === 4, r);
await t.S(()=>document.querySelector('[data-bwin]').click()); await t.sleep(150);
let sm = await t.S(()=>({ 요약:document.querySelector('.bs-seat small')?.textContent, 창가칸:[...document.querySelectorAll('.bs-st.w')].map(x=>+x.textContent), 행:document.querySelector('[data-seat="23:50"] .bs-wn')?.textContent }));
ok('창가만 요약', /빈 창가 4석 · 1, 3, 6, 7번 · 전체 빈 좌석 5석/.test(sm.요약), sm);
ok('창가 칸', sm.창가칸.join() === '1,3,4,6,7,10', sm.창가칸); ok('행에 창가 수', sm.행 === '창가 4', sm.행);
const before = await t.S(()=>performance.getEntriesByType('resource').filter(e=>/map=/.test(e.name)).length);
await t.S(()=>document.getElementById('bs-winload').click()); await t.sleep(1200);
sm = await t.S(()=>({ 프리미엄:document.querySelector('[data-seat="23:57"] .bs-wn')?.textContent, 버튼:!!document.getElementById('bs-winload'), 줄:document.querySelector('.bs-winbar')?.textContent.replace(/\s+/g,' ').trim() }));
ok('창가 자리 보기', sm.프리미엄 === '창가 4' && !sm.버튼, sm);
ok('이미 받은 차는 다시 안 받음', await t.S(()=>performance.getEntriesByType('resource').filter(e=>/map=/.test(e.name)).length) - before <= 1, 'map 요청');
await t.S(()=>document.querySelector('[data-seat="23:50"]').click()); await t.sleep(100);
await t.S(()=>document.querySelector('[data-seat="23:57"]').click()); await t.sleep(300);
ok('프리미엄 1인석', /프리미엄 1인석 포함/.test(await t.S(()=>document.querySelector('.bs-seat small').textContent)) && await t.S(()=>/1인석/.test(document.querySelector('.bs-st[title*="3번"]').title)), '');
await t.S(()=>{ document.querySelector('[data-bgr="pr"]').click(); }); await t.sleep(100);
await t.S(()=>document.querySelector('[data-seat="23:57"]').click()); await t.sleep(100);
await t.S(()=>document.querySelector('[data-bwin]').click()); await t.sleep(100);
await t.S(()=>document.querySelector('[data-bgr=""]').click()); await t.sleep(100);
ok('창가만 끄기', await t.S(()=>!document.querySelector('.bs-wn') && !document.querySelector('.bs-winbar')), '');
await t.S(()=>document.querySelector('[data-seat="23:50"]').click()); await t.sleep(200);
console.log('알림 버튼', await t.S(()=>[...document.querySelectorAll('[data-bell]')].map(b=>b.dataset.bell + b.textContent)));
await t.S(()=>document.querySelector('[data-bell="23:50"]').click()); await t.sleep(200);
console.log('알림 건 뒤', await t.S(()=>({ 표시:document.querySelector('.bs-watching')?.textContent.replace(/\s+/g,' ').trim(), 저장:JSON.parse(localStorage.getItem('lineup.share.buswatch')) })));
fs.writeFileSync('/tmp/bus.png', await t.p.screenshot());
left = 3;                                                     // 자리가 났다
await t.S(()=>{ for(const k in _bus.cache) delete _bus.cache[k]; return _bus.check(); }); await t.sleep(300);
console.log('자리 나면', await t.S(()=>document.getElementById('toast').textContent));
await t.S(()=>document.querySelector('[data-bdir="in"]').click()); await t.sleep(300);
await t.S(()=>document.querySelector('[data-bday="3"]').click()); await t.sleep(300);
await t.S(()=>document.querySelector('[data-bto="gb"]').click()); await t.sleep(300);
console.log('서울경부', await t.S(()=>({ 노선:document.querySelector('[data-bto][aria-pressed="true"]').textContent, 방향:[...document.querySelectorAll('[data-bdir]')].map(b=>b.textContent), 예매:document.querySelector('.bs-book a').textContent+' '+document.querySelector('.bs-book a').getAttribute('href'), 등급:[...document.querySelectorAll('.bs-row .bs-gr')].map(x=>x.textContent) })));
console.log('방향·날짜', await t.S(()=>({ 방향:document.querySelector('[data-bdir][aria-pressed="true"]').textContent, 날짜:document.querySelector('[data-bday][aria-pressed="true"]').textContent, 행:document.querySelectorAll('.bs-row').length })));
await t.S(()=>document.querySelector('[data-bgr="pr"]').click()); await t.sleep(100);
const keep = data.__bus; data.__bus = u => ({ ...keep(u), buses:[{ t:'23:50', co:'금강고속', grade:'일반', left:3, total:41 }] });
await t.S(()=>document.getElementById('bs-refresh').click()); await t.sleep(400);
const em = await t.S(()=>({ 안내:document.querySelector('#bus-view .empty')?.textContent.trim(), 칩:[...document.querySelectorAll('[data-bgr]')].map(b=>b.textContent) }));
ok('없는 등급 → 빈 안내', /프리미엄 버스가 없어요/.test(em.안내) && em.칩.includes('프리미엄'), em);
await t.S(()=>document.getElementById('bs-gall').click()); await t.sleep(100);
ok('전체 보기로 복귀', await t.S(()=>document.querySelectorAll('.bs-row').length) === 1, '');
data.__bus = null;
await t.S(()=>document.getElementById('bs-refresh').click()); await t.sleep(400);
console.log('서버 실패', await t.S(()=>document.querySelector('#bus-view .empty')?.textContent.trim().slice(0, 30)));
console.log('errs', t.errs); if(bad) process.exit(1); await t.b.close(); process.exit(0);
