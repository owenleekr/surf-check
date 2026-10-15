/* 서핑 일지 — 기록·경험치·고치기·지우기·주입 차단·합치기 */
import { open } from './mock.mjs';
import fs from 'fs';
const snap = (await import('../api/_naver-snapshot.js')).default;
const fc = JSON.parse(fs.readFileSync(new URL('./fixture-forecast.json', import.meta.url)));
const bad = [{ id:'x1', d:'2026-10-01', s:'<img src=x onerror=window.__f=1>', m:'9999', w:99, f:-5, t:'"><svg onload=window.__f=2>', h:'<b>' }, { id:'x2', d:'nope', s:'a' },
  /* 자세히 쓰기 칸 주입 + 범위 밖 개수 */
  { id:'x3', d:'2026-10-02', s:'죽도', m:60, wn:'500', good:'<img src=x onerror=window.__f=3>', bad:'</textarea><img src=x onerror=window.__f=4>', fb:'"><svg onload=window.__f=5>'.repeat(20) },
  { id:'x4', d:'2026-10-03', s:'인구', m:60, w:2, wn:'abc' }, { id:'x5', d:'2026-10-04', s:'기사문', m:60, w:1 }];
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }], __naver:{ folders:snap.folders }, __fc:fc },
  { id:'u4', name:'이성현', profile:{ gender:'f', birth:'1', dressed:1, play:{ base:50, bonus:0, badges:{}, qd:{}, qall:0, best:0, gday:'', gxp:0, gn:{}, lvSeen:1, log:bad } } }, { wait:3500 });
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); setTab('home'); window.surfLogRender(); });
await t.sleep(400);
console.log('카드', await t.S(()=>({ 보임:!document.getElementById('home-log').hidden, 요약:document.querySelector('.sl-sum')?.innerText.replace(/\n/g, ' '), 행:document.querySelectorAll('.sl-row').length, 주입:window.__f || 0 })));
const xp0 = await t.S(()=>ME.profile.play.bonus);
await t.S(()=>document.querySelector('[data-slnew]').click()); await t.sleep(300);
await t.S(()=>{ const b = [...document.querySelectorAll('[data-slspot]')]; b[1]?.click(); document.querySelector('[data-slk="m"][data-slv="3"]').click(); document.querySelector('[data-slwq="5"]').click(); document.querySelector('[data-slwn="1"]').click(); document.querySelector('[data-slwn="1"]').click();
  document.querySelector('.sl-more2').open = true;
  [['good', '테이크오프 성공'], ['bad', '패들 늦음'], ['fb', '코치: 시선은 앞으로']].forEach(([k, v])=>{ const a = document.querySelector(`[data-slin="${k}"]`); a.value = v; a.dispatchEvent(new Event('input', { bubbles:true })); }); document.querySelector('[data-slk="f"][data-slv="3"]').click();
  const i = document.querySelector('[data-slin="t"]'); i.value = '첫 그린 웨이브!'; i.dispatchEvent(new Event('input', { bubbles:true })); document.querySelector('[data-slsave]').click(); });
await t.sleep(400);
const after = await t.S(()=>({ xp:ME.profile.play.bonus, n:ME.profile.play.log.length, last:ME.profile.play.log[0], 배지:Object.keys(ME.profile.play.badges || {}) }));
console.log('기록', { 'XP+':after.xp - xp0, n:after.n, last:after.last, 배지:after.배지 });
const L0 = after.last; if(L0.wn !== 7 || L0.w !== 3 || L0.good !== '테이크오프 성공' || L0.bad !== '패들 늦음' || L0.fb !== '코치: 시선은 앞으로') t.errs.push('정확한 개수·자세히 쓰기 저장 실패');
/* 걸러 내기 — 개수 범위·글자 길이, 옛 기록은 구간 그대로 */
const cl = await t.S(()=>{ const c = window._slog.clean; const a = ME.profile.play.log.map(c).filter(Boolean); const x3 = a.find(e=>e.id === 'x3'), x4 = a.find(e=>e.id === 'x4');
  return { x3wn:x3.wn, x3w:x3.w, fbLen:x3.fb.length, x4wn:x4.wn, x4w:x4.w }; });
console.log('걸러 내기', cl); if(cl.x3wn !== 99 || cl.x3w !== 4 || cl.fbLen !== 120 || cl.x4wn !== null || cl.x4w !== 2) t.errs.push('clean 범위 실패');
/* 모두 보기 — 자세히 쓴 줄이 보이고 주입은 안 됨 */
await t.S(()=>document.querySelector('[data-slall]').click()); await t.sleep(200);
console.log('모두 보기', await t.S(()=>({ 줄:document.querySelectorAll('#sl-body .sl-nt').length, 개수:[...document.querySelectorAll('#sl-body .sl-m small')].map(x=>x.innerText.split(' · ')[1]).slice(0, 6), 통계:document.querySelector('.sl-stat')?.innerText.match(/한 번에[^\n]*/)?.[0], 주입:window.__f || 0 })));
/* 주입된 기록 고치기 화면 — textarea 밖으로 못 나옴 */
await t.S(()=>document.querySelector('#sl-body [data-slid="x3"]').click()); await t.sleep(200);
console.log('주입 기록 열기', await t.S(()=>({ 펼침:document.querySelector('.sl-more2').open, bad:document.querySelector('[data-slin="bad"]').value.slice(0, 20), 개수:document.getElementById('sl-wn').textContent, 주입:window.__f || 0 })));
await t.S(()=>document.querySelector('[data-slclose]').click()); await t.sleep(100);
/* 말로 기록 — 정확한 개수 */
console.log('음성', await t.S(()=>['파도 일곱 개', '열두 개 탔어', '하나도 못 탔어'].map(x=>window._slogParse(x).wn)));
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
