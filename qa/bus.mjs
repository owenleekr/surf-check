/* 🚌 버스 남은 좌석 — 차량 탭 → 버스 빈자리: 방향·날짜, 좌석 표시(매진·몇 석), 🔕→🔔 알림 걸기, 자리 나면 토스트, 서버 실패 시 안내 */
import { open } from './mock.mjs';
import fs from 'fs';
let left = 0;
const bus = u => ({ fetched:new Date().toISOString(), dir:/dir=in/.test(u) ? 'in' : 'out', date:'x', from:'동서울', to:'양양',
  buses:[{ t:'23:50', co:'금강고속', dur:'2:40', grade:'일반', fare:21600, left, total:41, shut:false }, { t:'23:55', co:'동해상사고속', dur:'1:45', grade:'우등', fare:19900, left:12, total:28, shut:false }, { t:'23:58', co:'<b>x</b>', grade:'', left:2, total:28 }] });
const data = { surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }], __bus:bus };
const t = await open(data, { id:'u4', name:'이성현', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:2500 });
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); localStorage.removeItem('lineup.share.buswatch'); busOpen(); }); await t.sleep(700);
console.log('목록', await t.S(()=>[...document.querySelectorAll('.bs-row')].map(r=>r.textContent.replace(/\s+/g,' ').trim())), '| 주입', await t.S(()=>document.querySelectorAll('.bs-row b b').length));
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
data.__bus = null;
await t.S(()=>document.getElementById('bs-refresh').click()); await t.sleep(400);
console.log('서버 실패', await t.S(()=>document.querySelector('#bus-view .empty')?.textContent.trim().slice(0, 30)));
console.log('errs', t.errs); await t.b.close(); process.exit(0);
