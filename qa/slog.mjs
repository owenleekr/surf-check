/* 서핑 일지 — 기록·경험치·고치기·지우기·주입 차단·합치기 */
import { open } from './mock.mjs';
import fs from 'fs';
const snap = (await import('../api/_naver-snapshot.js')).default;
const fc = JSON.parse(fs.readFileSync(new URL('./fixture-forecast.json', import.meta.url)));
const bad = [{ id:'x1', d:'2026-10-01', s:'<img src=x onerror=window.__f=1>', m:'9999', w:99, f:-5, t:'"><svg onload=window.__f=2>', h:'<b>' }, { id:'x2', d:'nope', s:'a' }];
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }], __naver:{ folders:snap.folders }, __fc:fc },
  { id:'u4', name:'이성현', profile:{ gender:'f', birth:'1', dressed:1, play:{ base:50, bonus:0, badges:{}, qd:{}, qall:0, best:0, gday:'', gxp:0, gn:{}, lvSeen:1, log:bad } } }, { wait:3500 });
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); setTab('home'); window.surfLogRender(); });
await t.sleep(400);
console.log('카드', await t.S(()=>({ 보임:!document.getElementById('home-log').hidden, 요약:document.querySelector('.sl-sum')?.innerText.replace(/\n/g, ' '), 행:document.querySelectorAll('.sl-row').length, 주입:window.__f || 0 })));
const xp0 = await t.S(()=>ME.profile.play.bonus);
await t.S(()=>document.querySelector('[data-slnew]').click()); await t.sleep(300);
await t.S(()=>{ const b = [...document.querySelectorAll('[data-slspot]')]; b[1]?.click(); document.querySelector('[data-slk="m"][data-slv="3"]').click(); document.querySelector('[data-slk="w"][data-slv="3"]').click(); document.querySelector('[data-slk="f"][data-slv="3"]').click();
  const i = document.querySelector('[data-slin="t"]'); i.value = '첫 그린 웨이브!'; i.dispatchEvent(new Event('input', { bubbles:true })); document.querySelector('[data-slsave]').click(); });
await t.sleep(400);
const after = await t.S(()=>({ xp:ME.profile.play.bonus, n:ME.profile.play.log.length, last:ME.profile.play.log[0], 배지:Object.keys(ME.profile.play.badges || {}) }));
console.log('기록', { 'XP+':after.xp - xp0, n:after.n, last:after.last, 배지:after.배지 });
/* 같은 날 하나 더 — XP 는 한 번만 */
await t.S(()=>{ document.querySelector('[data-slnew]').click(); }); await t.sleep(200); await t.S(()=>document.querySelector('[data-slsave]').click()); await t.sleep(300);
console.log('같은 날 두 번째 XP', await t.S(()=>ME.profile.play.bonus) - after.xp);
/* 고치기 → 지우기 */
await t.S(()=>document.querySelector('.sl-row').click()); await t.sleep(200);
t.p.on('dialog', d=>d.accept());
await t.S(()=>document.querySelector('[data-sldel]').click()); await t.sleep(300);
console.log('지운 뒤', await t.S(()=>({ n:ME.profile.play.log.length, del:Object.keys(ME.profile.play.logdel || {}).length })));
/* 다른 기기 기록 합치기 — 지운 건 되살아나지 않게 */
console.log('합치기', await t.S(()=>{ const del = Object.keys(ME.profile.play.logdel)[0]; playMerge({ log:[{ id:del, d:'2026-10-14', s:'되살아나면 안 됨', m:60, w:1, f:1 }, { id:'other', d:'2026-10-13', s:'물치', m:90, w:2, f:2 }] }); return ME.profile.play.log.map(e=>e.s); }));
console.log('주입', await t.S(()=>window.__f || 0), 'errs', t.errs);
await t.b.close(); process.exit(0);
