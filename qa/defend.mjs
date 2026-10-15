/* 해변 수호(디펜스) — 놀이 카드로 열기, 빈 자리 탭→짓기·강화·회수, 멈춤·배속·지금 부르기, 봇으로 끝까지(승·패), 보상 저장(df·조개·XP), 닫기, 가로 넘침 */
import { open } from './mock.mjs';
import fs from 'fs';
const OUT = process.env.DSHOT || '/tmp';
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] }, { id:'u4', name:'이성현', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:2500, width:375 });
const bad = [];
const ok = (c, m) => { if(!c) bad.push(m); };
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); setTab('play'); }); await t.sleep(300);
const card = await t.S(()=>document.querySelector('[data-hub="defend"]')?.textContent.replace(/\s+/g,' ').trim());
console.log('놀이 카드', card); ok(/해변 수호/.test(card || ''), '카드 없음');
await t.S(()=>document.querySelector('[data-hub="defend"]').click()); await t.sleep(400);
const o1 = await t.S(()=>({ 열림:!document.getElementById('defend').hidden, 시작카드:document.querySelector('#d-ov .go-t')?.textContent, 난이도:document.querySelectorAll('#d-ov [data-df]').length, run:!!window._gameRun }));
console.log('시작', JSON.stringify(o1)); ok(o1.열림 && o1.난이도 === 3 && !o1.run, '시작 화면');
await t.S(()=>{ document.querySelector('#d-ov [data-df="1"]').click(); document.getElementById('d-go').click(); }); await t.sleep(200);
// 캔버스 탭 → 자리 4(120,95)
const tapAt = async (x, y) => { const r = await t.S(()=>{ const b = document.getElementById('d-cv').getBoundingClientRect(); return { l:b.left, t:b.top, w:b.width, h:b.height }; }); await t.p.touchscreen.tap(r.l + x / 240 * r.w, r.t + y / 300 * r.h); await t.sleep(150); };
await tapAt(120, 95);
const o2 = await t.S(()=>({ 버튼:[...document.querySelectorAll('#d-bar [data-db]')].map(b=>b.textContent.trim().slice(0, 12)), run:!!window._gameRun, 조개:_defend.S.shells }));
console.log('자리 탭', JSON.stringify(o2)); ok(o2.버튼.length === 4 && o2.run, '짓기 막대');
await t.S(()=>document.querySelector('#d-bar [data-db="guard"]').click()); await t.sleep(100);
await tapAt(120, 95);
const o3 = await t.S(()=>({ 수호대:JSON.stringify(_defend.S.tw), 강화:!!document.querySelector('#d-bar [data-du]'), 조개:_defend.S.shells }));
console.log('지은 뒤', JSON.stringify(o3)); ok(/guard/.test(o3.수호대) && o3.강화, '짓기 실패');
await t.S(()=>document.querySelector('#d-bar [data-du]').click()); await t.sleep(100);
ok(await t.S(()=>_defend.S.tw[4].lv === 2), '강화 실패');
await tapAt(70, 95); await t.S(()=>document.querySelector('#d-bar [data-db="dolph"]')?.click());
await tapAt(170, 95); await t.S(()=>document.querySelector('#d-bar [data-db="board"]')?.click());
await t.S(()=>{ document.getElementById('d-speed').click(); document.getElementById('d-act').click(); }); await t.sleep(2600);
const o4 = await t.S(()=>({ 단계:_defend.S.ph, 적:_defend.S.foes.length, 배속:document.getElementById('d-speed').textContent, 행동:document.getElementById('d-act').textContent, hud:document.getElementById('d-hud').textContent }));
console.log('파도 중', JSON.stringify(o4)); ok(o4.단계 === 'wave' && /2배/.test(o4.배속), '파도 시작');
await tapAt(120, 95);
fs.writeFileSync(OUT + '/defend-play.png', await t.p.screenshot());
await t.S(()=>document.getElementById('d-pause').click()); const tp = await t.S(()=>_defend.S.t); await t.sleep(500);
ok(await t.S(tp=>_defend.S.paused && _defend.S.t === tp, tp), '멈춤 실패');
await t.S(()=>document.getElementById('d-pause').click());
// 지는 판 — 아무것도 안 지음(보상 저장)
const lose = await t.S(()=>_defend.run(0, 0, 900, true));
const o5 = await t.S(()=>({ 결과:document.querySelector('#d-ov .go-t')?.textContent, df:JSON.stringify(ME.profile.play?.df), run:!!window._gameRun }));
console.log('지는 판', JSON.stringify(lose), JSON.stringify(o5)); ok(lose.res === 'lose' && /잠겼/.test(o5.결과) && !o5.run, '패배 경로');
const sh0 = await t.S(()=>ME.profile.play.shells || 0);
const win = await t.S(()=>_defend.run(1, 13, 900, true)); await t.sleep(600);
const o6 = await t.S(()=>({ 결과:document.querySelector('#d-ov .go-t')?.textContent, 통계:document.querySelector('#d-ov .go-st')?.textContent.replace(/\s+/g,' '), df:ME.profile.play.df, 조개:ME.profile.play.shells }));
console.log('이긴 판', JSON.stringify(win), JSON.stringify(o6)); ok(win.res === 'win' && o6.df.best === 12 && o6.df.clears === 1 && o6.df.hd === 2 && o6.조개 > sh0, '승리 보상');
fs.writeFileSync(OUT + '/defend-win.png', await t.p.screenshot()); await t.sleep(1200);
ok(t.posts.some(([u, j])=>u.startsWith('surfers') && j.profile?.play?.df?.best === 12), '저장(push) 없음');
// 다시 하기 → 닫기(Escape)
await t.S(()=>document.getElementById('d-go').click()); await t.sleep(100);
await t.p.goBack(); await t.sleep(500);
const bk = await t.S(()=>({ 닫힘:document.getElementById('defend').hidden, run:!!window._gameRun, tab:state.tab }));
console.log('폰 뒤로', JSON.stringify(bk)); ok(bk.닫힘 && !bk.run, '뒤로 버튼으로 안 닫힘');
await t.S(()=>defendOpen()); await t.sleep(200); await t.p.keyboard.press('Escape'); await t.sleep(300);
const o7 = await t.S(()=>({ 닫힘:document.getElementById('defend').hidden, run:!!window._gameRun, 카드:document.querySelector('[data-hub="defend"]')?.textContent.replace(/\s+/g,' ').trim(), 넘침:document.documentElement.scrollWidth > innerWidth }));
console.log('닫기', JSON.stringify(o7)); ok(o7.닫힘 && !o7.run && /12\/12/.test(o7.카드) && !o7.넘침, '닫기·카드');
// 남의 프로필 값이 이상해도 카드가 깨지지 않게
await t.S(()=>{ ME.profile.play.df = { best:'<b>99', clears:-3 }; renderHub(); });
console.log('이상한 값', await t.S(()=>document.querySelector('[data-hub="defend"]')?.textContent.replace(/\s+/g,' ').trim()));
console.log('bad', bad); console.log('errs', t.errs);
await t.b.close(); process.exit(bad.length || t.errs.length ? 1 : 0);
