/* 기타 메뉴 정리: 자주 쓰는 것은 위, 마을·번개·숙소·카풀은 「가끔 쓰는 것」 아래로(지우지 않고 옮김).
   놀이 메뉴의 마을 카드는 기타로, 새 글이 있으면 접힌 칸에도 표시, ?go= 바로가기, 뒤로가기 */
import { open } from './mock.mjs';
import fs from 'fs';
const OUT = process.env.SHOT || '/tmp';
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); console.log(c ? '  ✓' : '  ✗', m); };
const soon = new Date(Date.now() + 2 * 864e5 - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }],
  parties:[{ id:'p1', user_id:'u0', name:'김도훈', date:soon, time:'07:00', beach:'낙산', joins:[], created_at:new Date().toISOString() }] },
  { id:'u4', name:'이성현', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:2500 });
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); localStorage.setItem('lineup.share.seen.bolt', String(Date.now() - 864e5)); refreshDots(); }); await t.sleep(200);

console.log('① 기타 메뉴 구성');
await t.S(()=>document.getElementById('t-more').click()); await t.sleep(250);
const m = await t.S(()=>({ main:[...document.querySelectorAll('#more-sheet .more-grid:not(.more-sub-grid) > .more-it b')].map(b=>b.textContent),
  sub:[...document.querySelectorAll('#more-sheet .more-sub .more-it')].map(b=>b.dataset.more), open:document.querySelector('#more-sheet .more-sub').open,
  sum:document.querySelector('#more-sheet .more-sub > summary').textContent.replace(/\s+/g, ' ').trim() }));
console.log('  ', JSON.stringify(m));
ok(m.main.includes('개선 요청') && m.main.includes('수상레저 신고') && !m.main.includes('마을 · 채팅') && !m.main.includes('서핑번개'), '위 칸 — 개선 요청 있고 마을·번개 없음');
ok(['town', 'bolt', 'stay', 'car'].every(k=>m.sub.includes(k)), '「가끔 쓰는 것」 — 마을·번개·숙소·카풀');
ok(/새 글/.test(m.sum), '접힌 칸 제목에 새 글 표시');
fs.writeFileSync(`${OUT}/trk-more.png`, await t.p.screenshot());
await t.S(()=>{ const d = document.querySelector('#more-sheet .more-sub'); d.open = true; }); await t.sleep(200);
fs.writeFileSync(`${OUT}/trk-more-open.png`, await t.p.screenshot());
await t.S(()=>document.querySelector('[data-more="town"]').click()); await t.sleep(400);
ok(await t.S(()=>state.tab === 'town' && document.getElementById('more-sheet').hidden && document.getElementById('t-more').getAttribute('aria-pressed') === 'true'), '마을로 이동 · 기타 눌림 표시');
await t.p.goBack(); await t.sleep(400);
ok(await t.S(()=>state.tab === 'home'), '뒤로가기 → 홈');

console.log('② 놀이 메뉴에서 마을 카드는 빠짐(기타로)');
await t.S(()=>setTab('play')); await t.sleep(400);
ok(await t.S(()=>!document.querySelector('[data-hub="town"]') && !!document.querySelector('[data-hub="game"]')), '놀이 메뉴에 마을 카드 없음 · 게임은 그대로');

console.log('③ ?go= 바로가기');
for(const [g, chk] of [['town', ()=>state.tab === 'town'], ['bolt', ()=>state.tab === 'bolt'], ['feedback', ()=>!document.getElementById('fb-sheet')?.hidden]]){
  await t.p.goto(`http://localhost:8765/surfshare.html?go=${g}`, { waitUntil:'networkidle2' }); await t.sleep(1600);
  ok(await t.S(chk), `?go=${g}`);
}
console.log('errs', t.errs); await t.b.close();
if(t.errs.length) fails.push('page errors');
if(fails.length){ console.log('FAIL', fails); process.exit(1); }
console.log('OK menu'); process.exit(0);
