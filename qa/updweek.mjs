/* 업데이트 「일주일 닫기」: 홈 카드 버튼은 [자세히 보기][일주일 닫기] 둘, 닫으면 7일 숨김(새로고침해도),
   7일이 지나거나 더 새 업데이트가 나오면 다시, 팝업도 [자세히 보기][일주일 닫기] */
import { open } from './mock.mjs';
import fs from 'fs';
const OUT = process.env.SHOT || '/tmp';
const fails = []; const ok = (c, m) => { if(!c) fails.push(m); console.log(c ? '  ✓' : '  ✗', m); };
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] },
  { id:'u4', name:'이성현', profile:{ gender:'f', dressed:1, play:{ base:50, bonus:0, badges:{ drill1:1 }, qd:{}, qall:0, best:0, gday:'', gxp:0, gn:{}, lvSeen:1, xp:50, lv:1 } } }, { wait:2500 });

console.log('① 팝업');
let pop = null;
for(let i = 0; i < 8; i++){
  const s = await t.S(()=>document.getElementById('pop').hidden ? null : { t:document.getElementById('pop-t').textContent, go:document.getElementById('pop-go').textContent, ok:document.getElementById('pop-ok').textContent });
  if(!s) break;
  if(/업데이트|새로 생겼어요/.test(s.t)){ pop = s; await t.S(()=>document.getElementById('pop-ok').click()); await t.sleep(400); break; }
  await t.S(()=>popClose()); await t.sleep(300);
}
console.log('  ', JSON.stringify(pop));
ok(pop && pop.go === '자세히 보기' && pop.ok === '일주일 닫기', '팝업 버튼 [자세히 보기][일주일 닫기]');
const wk = await t.S(()=>JSON.parse(localStorage.getItem('lineup.share.updweek') || 'null'));
ok(wk && typeof wk.at === 'number' && Date.now() - wk.at < 60e3 && wk.id === await t.S(()=>window.UPDATES[0].id), '팝업 일주일 닫기 → 기록(시각·업데이트 id)');
ok(await t.S(()=>document.getElementById('home-upd').hidden), '팝업에서 닫으면 홈 카드도 숨김');
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); });

console.log('② 홈 카드');
await t.S(()=>{ localStorage.removeItem('lineup.share.updweek'); window.updCard(); }); await t.sleep(200);
const c = await t.S(()=>({ vis:!document.getElementById('home-upd').hidden, btns:[...document.querySelectorAll('#home-upd button')].map(b=>b.textContent.replace(/\s+/g, ' ').trim()) }));
console.log('  ', JSON.stringify(c));
ok(c.vis, '안 본 업데이트가 있으면 카드');
ok(c.btns.some(b=>/자세히 보기/.test(b)) && c.btns.some(b=>b === '일주일 닫기') && !c.btns.some(b=>/다시 보지 않기/.test(b)) && c.btns.length === 2, '버튼 둘 — 자세히 보기 · 일주일 닫기');
fs.writeFileSync(`${OUT}/trk-updcard.png`, await t.p.screenshot());
await t.S(()=>document.getElementById('upd-week').click()); await t.sleep(200);
ok(await t.S(()=>document.getElementById('home-upd').hidden && /일주일/.test(document.getElementById('toast').textContent)), '일주일 닫기 → 숨김 · 안내');
ok(await t.S(()=>localStorage.getItem('lineup.share.upd') !== window.UPDATES[0].id), '본 것으로 치지 않음(7일 뒤 다시)');

const reload = async () => { await t.p.reload({ waitUntil:'networkidle2' }); await t.sleep(1800); await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(200); };
await reload();
ok(await t.S(()=>document.getElementById('home-upd').hidden), '새로고침해도 숨김');

console.log('③ 7일 지나면 / 새 업데이트면 다시');
await t.S(()=>{ const w = JSON.parse(localStorage.getItem('lineup.share.updweek')); w.at = Date.now() - 8 * 864e5; localStorage.setItem('lineup.share.updweek', JSON.stringify(w)); });
await reload();
ok(await t.S(()=>!document.getElementById('home-upd').hidden), '8일 뒤 — 다시 보임');
await t.S(()=>localStorage.setItem('lineup.share.updweek', JSON.stringify({ at:Date.now() - 36e5, id:'u-old' })));
await reload();
ok(await t.S(()=>!document.getElementById('home-upd').hidden), '닫은 뒤 새 업데이트가 나오면 — 다시 보임');
await t.S(()=>localStorage.setItem('lineup.share.updweek', JSON.stringify({ at:Date.now() - 6 * 864e5, id:window.UPDATES[0].id })));
await reload();
ok(await t.S(()=>document.getElementById('home-upd').hidden), '6일째 — 아직 숨김');

console.log('④ 자세히 보기 → 다 본 것');
await t.S(()=>{ localStorage.removeItem('lineup.share.updweek'); window.updCard(); document.getElementById('upd-open').click(); }); await t.sleep(300);
ok(await t.S(()=>!document.getElementById('upd-sheet').hidden && document.getElementById('home-upd').hidden && localStorage.getItem('lineup.share.upd') === window.UPDATES[0].id), '전체 보기 열림 · 본 것 · 카드 숨김');

console.log('errs', t.errs); await t.b.close();
if(t.errs.length) fails.push('page errors');
if(fails.length){ console.log('FAIL', fails); process.exit(1); }
console.log('OK updweek'); process.exit(0);
