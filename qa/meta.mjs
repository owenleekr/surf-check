/* 메타 진행(강화소·오늘의 미션·7일 출석·주간 순위·첫 판 ×2) 시험.
   ① 강화를 사면 다음 판에 적용되고, 오늘의 챌린지·봇 시험에는 적용되지 않는다(공정)
   ② 미션 완료 → 조개, 두 번 못 받는다, 상자 ③ 출석 연속·끊김 ④ 조작된 프로필 합치기는 숫자로 가둔다 ⑤ 남의 이름 XSS
   SHOT=1 이면 화면 3장 + 몽타주를 남긴다. */
import { open } from './mock.mjs';
import fs from 'fs';
const OUT = process.env.SHOT_DIR || '/tmp';
const bad = '<img src=x onerror="window.__xss=1">';
const wkOf = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const W = wkOf();
const surfers = [
  { id:'u1', name:'김도훈', cohort:'6기', profile:{ play:{ xp:200, wk:{ w:W, j:1800, d:9, r:650, q:3 } } } },
  { id:'u2', name:bad, cohort:'6기', profile:{ play:{ xp:'<b>', wk:{ w:W, j:'<img>', d:99, r:1e15, q:2 }, up:{ j_val:'<x>' } } } },
  { id:'u3', name:'다른기수', cohort:'5기', profile:{ play:{ wk:{ w:W, j:99999 } } } },
  { id:'u4', name:'이성현', cohort:'6기', profile:{} },
];
const play = { base:240, bonus:20, badges:{ drill1:1 }, qd:{}, qall:0, best:900, gday:'', gxp:0, gn:{}, lvSeen:2, xp:260, lv:2, shells:400, spent:0, own:{}, df:{ best:6, clears:0 } };
const t = await open({ surfers }, { id:'u4', name:'이성현', cohort:'6기', profile:{ gender:'f', birth:'1', dressed:1, play } }, { wait:2600 });
const fail = [], ok = (c, m) => { if(!c) fail.push(m); };
await t.S(()=>{ for(let i = 0; i < 6; i++) if(!document.getElementById('pop').hidden) popClose(); });

/* ① 강화 사기 → 적용 */
const up = await t.S(()=>{
  const p = ME.profile.play, b0 = shellBal();
  const r1 = playUp('j_shield'), r2 = playUp('j_val'), r3 = playUp('j_val'), r4 = playUp('d_sch');
  const out = { 산것:[r1, r2, r3, r4], 단계:{ ...p.up }, 쓴조개:b0 - shellBal() };
  gameOpen(); _game.begin(false); out.쉬움방패 = _game.st.shield; out.토스트 = document.getElementById('toast').textContent;
  _game.begin(true); out.챌린지방패 = _game.st.shield;
  gameClose();
  _defend.start(0); out.학교HP = _defend.S.max; window.defendClose();
  out.봇학교HP = (_defend.run(0, 7), _defend.S.max);
  return out;
});
console.log('① 강화', up);
ok(up.산것.every(Boolean) && up.단계.j_val === 2 && up.쓴조개 === 30 + 30 + 60 + 30, '강화 구매/비용');
ok(up.쉬움방패 === 1 && /강화 적용/.test(up.토스트), '쉬움에 시작 방패·태그');
ok(up.챌린지방패 === 0, '챌린지엔 강화 없음');
ok(up.학교HP === 132 && up.봇학교HP === 120, '해변 수호 학교 체력 강화(봇 제외)');

/* 첫 판 ×2 */
const x2 = await t.S(()=>{ const a = playGameDone(1200, false, 10, false), b = playGameDone(300, false, 10, false); return { 첫판:a.shells, 첫판x2:a.x2, 둘째:b.shells, 둘째x2:b.x2 }; });
console.log('첫 판 ×2', x2); ok(x2.첫판 === 20 && x2.둘째 === 10 && !x2.둘째x2, '첫 판 ×2');

/* ② 미션 */
const mis = await t.S(()=>{
  const p = ME.profile.play, d = today();
  Object.assign(dmOf(p), { j:2000, df:9, r:999, q:1, sk:5 }); (p.vis ||= {})[d] = { food:1, chk:1, quiz:1 }; (p.log ||= []).push({ id:'t1', d });
  const ms = missions(p), s0 = p.shells;
  const c = ms.map(q=>misClaim(q.id)), again = misClaim(ms[0].id), box = misBox(), box2 = misBox();
  return { 미션:ms.map(q=>q.id), 완료:ms.map(q=>q.done), 받기:c, 다시받기:again, 상자:box, 상자2:box2, 늘어난조개:p.shells - s0 };
});
console.log('② 미션', mis);
ok(mis.미션.length === 3 && new Set(mis.미션).size === 3 && mis.받기.every(Boolean) && !mis.다시받기 && mis.상자 >= 30 && mis.상자 <= 50 && !mis.상자2 && mis.늘어난조개 === 45 + mis.상자, '미션 보상');

/* ③ 출석 */
const att = await t.S(()=>{
  const p = ME.profile.play, y = prevDay(today());
  p.att = { d:y, n:6 }; const s = attState(p), r = attClaim(), again = attClaim();
  const after = { ...p.att };
  p.att = { d:'2000-01-01', n:5 }; const broken = attState(p);
  p.att = after;
  return { 오늘칸:s.slot, 보상:r && r.n, 선물:r && r.gift && r.gift.n, 다시:again, 연속:after.n, 끊김칸:broken.slot };
});
console.log('③ 출석', att);
ok(att.오늘칸 === 7 && att.보상 >= 60 && att.다시 === null && att.연속 === 7 && att.끊김칸 === 1, '출석 연속/끊김');

/* ④ 조작된 프로필 합치기 */
const mg = await t.S(()=>{
  const p = ME.profile.play, d = today();
  playMerge({ shells:'<img src=x>', spent:Infinity, best:'9e999', up:{ j_shield:99, j_mag:'<b>', evil:5, __proto__x:3 },
    dm:{ d, j:'1e99', df:999, c:{ '<x>':1, zz:1 }, f:{ jump:1 }, box:7 }, att:{ d:'<script>', n:5 }, wk:{ w:'2099-01-05', j:1e12, d:'x' } });
  return { up:{ ...p.up }, 조개:p.shells, 쓴:p.spent, best:p.best, dmj:p.dm.j, dmdf:p.dm.df, box:p.dm.box, c:Object.keys(p.dm.c), att:p.att.d, wk:p.wk };
});
console.log('④ 합치기', mg);
ok(mg.up.j_shield === 3 && !('evil' in mg.up) && !mg.up.j_mag && typeof mg.조개 === 'number' && Number.isFinite(mg.쓴) && mg.best <= 1e9, '숫자 가두기');
ok(mg.dmj <= 1e6 && mg.dmdf === 15 && mg.box === 1 && !mg.c.includes('<x>') && mg.att !== '<script>' && mg.wk.j === 1e6 && mg.wk.d === 0, '하루·주 기록 가두기');
await t.S(()=>{ ME.profile.play.wk = { w:weekKey(today()), j:1200, d:7, r:300, q:1 }; ME.profile.play.dm = null; });

/* ⑤ 허브 — 출석·미션·주간 순위·강화소 카드, 남의 이름 XSS */
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); setTab('play'); }); await t.sleep(700);
const hub = await t.S(()=>({ 달력칸:document.querySelectorAll('.atcal .at-d').length, 미션:document.querySelectorAll('[data-mis]').length,
  주간:[...document.querySelectorAll('.wkb>div')].map(x=>x.textContent.replace(/\s+/g, ' ').trim()), 강화소:!!document.querySelector('[data-hub="up"]'),
  img:document.querySelectorAll('#play-hub img').length, xss:window.__xss || 0, 넘침:document.documentElement.scrollWidth - innerWidth }));
console.log('⑤ 허브', hub);
ok(hub.달력칸 === 7 && hub.미션 === 3 && hub.강화소 && hub.주간.length === 4, '허브 구성');
ok(!hub.xss && !hub.img && !hub.주간.join().includes('99999') && hub.넘침 <= 0, 'XSS·기수 거르기·넘침');
if(process.env.SHOT){
  const shots = [], drain = ()=>t.S(()=>{ _popQ.length = 0; if(!document.getElementById('pop').hidden) popClose(); });
  await drain(); await t.sleep(400);
  const at = await t.S(()=>{ const e = document.querySelector('.atcal'); e.scrollIntoView({ block:'start' }); scrollBy(0, -60); return 1; }); await t.sleep(300);
  shots.push(OUT + '/meta-hub.png'); fs.writeFileSync(shots[0], await t.p.screenshot());
  await t.S(()=>document.querySelector('[data-hub="up"]').click()); await t.sleep(500);
  await drain(); await t.sleep(300);
  shots.push(OUT + '/meta-shop.png'); fs.writeFileSync(shots[1], await t.p.screenshot());
  await t.S(()=>{ document.getElementById('shop-sheet').hidden = true; gameOpen(); _game.begin(false); const s = _game.st; for(let i = 0; i < 4000 && !s.dead; i++) _game.step(_game.FIX); }); await t.sleep(1200); await drain(); await t.sleep(300);
  await t.S(()=>document.querySelector('#g-ov .up-nudge')?.scrollIntoView({ block:'center' }));
  shots.push(OUT + '/meta-result.png'); fs.writeFileSync(shots[2], await t.p.screenshot());
  const pg = await t.b.newPage(); await pg.setViewport({ width:1200, height:844 });
  await pg.setContent(`<body style="margin:0;display:flex;gap:6px;background:#222">${shots.map(f=>`<img style="width:396px" src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}">`).join('')}</body>`);
  fs.writeFileSync(OUT + '/meta-montage.png', await pg.screenshot());
}
/* 결과 화면의 강화 안내·한 판 더 */
const res = await t.S(async ()=>{ if(document.getElementById('game').hidden){ gameOpen(); }
  _game.begin(false); const s = _game.st; for(let i = 0; i < 4000 && !s.dead; i++) _game.step(_game.FIX); await new Promise(r=>setTimeout(r, 1000));
  const ov = document.getElementById('g-ov'); return { 안내:!!ov.querySelector('.up-nudge'), 버튼:ov.querySelector('#g-again')?.textContent }; });
console.log('결과 화면', res); ok(res.안내 && /한 판 더/.test(res.버튼), '결과 안내');
console.log('fail', fail);
console.log('errs', t.errs); await t.b.close(); process.exit(fail.length || t.errs.length ? 1 : 0);
