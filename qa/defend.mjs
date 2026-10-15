/* 해변 수호(직접 조작 디펜스) — 놀이 카드로 열기, 난이도·시작, 손가락 끌기(스틱)로 모찌 이동·자동 공격, 멈춤·배속,
   라운드를 끝내 정비 상점에서 카드 사기, 큰 파도, 보스 라운드, 지는 판·이기는 판 보상 저장(df·조개·XP), 뒤로·Escape 닫기, 가로 넘침 */
import { open } from './mock.mjs';
const OUT = process.env.DSHOT || '/tmp';
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] }, { id:'u4', name:'이성현', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:2500, width:375 });
const bad = [];
const ok = (c, m) => { if(!c) bad.push(m); };
const shot = async n => { await t.p.screenshot({ path:`${OUT}/df2-${n}.png` }); };
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); setTab('play'); }); await t.sleep(300);
const card = await t.S(()=>document.querySelector('[data-hub="defend"]')?.textContent.replace(/\s+/g,' ').trim());
console.log('놀이 카드', card); ok(/해변 수호/.test(card || ''), '카드 없음');
await t.S(()=>document.querySelector('[data-hub="defend"]').click()); await t.sleep(600);
const o1 = await t.S(()=>({ 열림:!document.getElementById('defend').hidden, 시작카드:document.querySelector('#d-ov .go-t')?.textContent, 안내:/스틱/.test(document.querySelector('#d-ov .go-d')?.textContent), 난이도:document.querySelectorAll('#d-ov [data-df]').length, run:!!window._gameRun, 캔버스:document.getElementById('d-cv').width }));
console.log('시작', JSON.stringify(o1)); ok(o1.열림 && o1.난이도 === 3 && o1.안내 && !o1.run && o1.캔버스 > 480, '시작 화면');
await shot('start');
await t.S(()=>{ document.querySelector('#d-ov [data-df="1"]').click(); document.getElementById('d-go').click(); }); await t.sleep(300);
const o2 = await t.S(()=>({ run:!!window._gameRun, 단계:_defend.S.ph, 라운드:_defend.S.r, 덮개:document.getElementById('d-ov').hidden, 상점:document.getElementById('d-bar').hidden }));
console.log('시작함', JSON.stringify(o2)); ok(o2.run && o2.단계 === 'fight' && o2.라운드 === 1 && o2.덮개 && o2.상점, '시작 실패');
// 손가락으로 끌기 — 왼쪽 아래를 누르고 오른쪽 위로 끌면 모찌가 그쪽으로 간다
const box = await t.S(()=>{ const b = document.getElementById('d-cv').getBoundingClientRect(); return { l:b.left, t:b.top, w:b.width, h:b.height }; });
const at = (x, y) => [box.l + x / 240 * box.w, box.t + y / 360 * box.h];
const p0 = await t.S(()=>({ x:_defend.P.x, y:_defend.P.y }));
await t.p.touchscreen.touchStart(...at(60, 280)); await t.sleep(50);
await t.p.touchscreen.touchMove(...at(80, 262)); await t.p.touchscreen.touchMove(...at(95, 250));
const ds = await t.S(()=>!!_defend.stick);
await t.sleep(900);
const p1 = await t.S(()=>({ x:_defend.P.x, y:_defend.P.y }));
await t.p.touchscreen.touchEnd(); await t.sleep(100);
console.log('끌기', JSON.stringify({ 스틱:ds, 전:p0, 후:p1 }));
ok(ds && p1.x > p0.x + 15 && p1.y < p0.y - 15, '스틱 이동 안 됨');
ok(await t.S(()=>!_defend.stick), '손 떼도 스틱 남음');
await t.sleep(2200);
const o3 = await t.S(()=>({ 남은:_defend.S.q.length - _defend.S.qi, 처치:_defend.S.kills, hud:document.getElementById('d-hud').textContent }));
console.log('라운드 1', JSON.stringify(o3));
await shot('play');
// 멈춤 — 시간이 멈추고 다시 누르면 계속
await t.S(()=>document.getElementById('d-pause').click()); const tp = await t.S(()=>_defend.S.t); await t.sleep(400);
ok(await t.S(tp=>_defend.S.paused && _defend.S.t === tp, tp), '멈춤 실패');
await t.S(()=>{ document.getElementById('d-pause').click(); document.getElementById('d-speed').click(); });
ok(await t.S(()=>!_defend.S.paused && /×2/.test(document.getElementById('d-speed').textContent)), '배속 표시');
await t.S(()=>document.getElementById('d-speed').click());
// 라운드 끝 → 정비 상점(조개를 넉넉히 줘서 카드 사기)
await t.S(()=>{ _defend.S.qi = _defend.S.q.length; _defend.killAll(); _defend.fast(.1); _defend.S.shells += 40; _defend.fast(.6); }); await t.sleep(400);
const o4 = await t.S(()=>({ 단계:_defend.S.ph, 카드:[...document.querySelectorAll('#d-bar [data-buy]')].map(b=>b.textContent.replace(/\s+/g,' ').trim().slice(0, 20)), 조개:_defend.S.shells }));
console.log('정비', JSON.stringify(o4)); ok(o4.단계 === 'shop' && o4.카드.length === 3, '상점 안 뜸');
const lv0 = await t.S(()=>JSON.stringify(_defend.S.lv)), sh0 = o4.조개, k0 = await t.S(()=>_defend.S.offer[0]);
await t.S(()=>document.querySelector('#d-bar [data-buy="0"]').click()); await t.sleep(200);
const o5 = await t.S(()=>({ lv:JSON.stringify(_defend.S.lv), 조개:_defend.S.shells, 샀음:!!document.querySelector('#d-bar .d-card.on') }));
console.log('카드 산 뒤', k0, JSON.stringify(o5)); ok(o5.조개 < sh0 && o5.샀음 && (o5.lv !== lv0 || k0 === 'heal'), '카드 사기 실패');
await t.S(()=>{ document.querySelector('#d-bar [data-buy="1"]')?.click(); }); await t.sleep(100);
await shot('shop');
await t.S(()=>document.querySelector('#d-bar [data-gonext]').click()); await t.sleep(200);
ok(await t.S(()=>_defend.S.ph === 'fight' && _defend.S.r === 2 && document.getElementById('d-bar').hidden), '출발 실패');
// 큰 파도 — 한 판에 한 번
await t.sleep(2500);
const u1 = await t.S(()=>{ document.getElementById('d-act').click(); return { 썼음:!_defend.S.ult, 버튼:document.getElementById('d-act').disabled }; });
console.log('큰 파도', JSON.stringify(u1)); ok(u1.썼음 && u1.버튼, '큰 파도');
// 마지막 보스(폭풍 너울) — 예고 줄이 뜬 순간을 찍는다
await t.S(()=>{ _defend.skip(15); _defend.fast(3.5); for(let i = 0; i < 600 && !(_defend.S.sw && _defend.S.sw.t > .3); i++) _defend.step(_defend.FIX); }); await t.sleep(250);
const o6 = await t.S(()=>({ 보스:_defend.S.boss && _defend.S.boss.k, 라운드:_defend.S.r, 예고줄:!!_defend.S.sw }));
await shot('boss');
console.log('보스', JSON.stringify(o6)); ok(o6.보스 === 'storm' && o6.라운드 === 15 && o6.예고줄, '보스 안 나옴');
// 지는 판 — 학교 HP 0
await t.S(()=>_defend.lose()); await t.sleep(300);
const o7 = await t.S(()=>({ 결과:document.querySelector('#d-ov .go-t')?.textContent, 통계:document.querySelector('#d-ov .go-st')?.textContent.replace(/\s+/g,' '), df:JSON.stringify(ME.profile.play?.df), run:!!window._gameRun, 닫기:!!document.getElementById('d-close') }));
console.log('지는 판', JSON.stringify(o7)); ok(/잠겼/.test(o7.결과) && /처치/.test(o7.통계) && !o7.run && o7.닫기 && /"best":14/.test(o7.df), '패배 경로');
// 이기는 판 — 다시 → 보스까지 건너뛰어 쓰러뜨림
const sh1 = await t.S(()=>ME.profile.play.shells || 0);
await t.S(()=>document.getElementById('d-go').click()); await t.sleep(200);
await t.S(()=>_defend.win()); await t.sleep(600);
const o8 = await t.S(()=>({ 결과:document.querySelector('#d-ov .go-t')?.textContent, 통계:document.querySelector('#d-ov .go-st')?.textContent.replace(/\s+/g,' '), df:ME.profile.play.df, 조개:ME.profile.play.shells }));
console.log('이긴 판', JSON.stringify(o8)); ok(/지켰/.test(o8.결과) && o8.df.best === 15 && o8.df.clears === 1 && o8.df.hd === 2 && o8.조개 > sh1, '승리 보상');
await t.sleep(1200);
ok(t.posts.some(([u, j])=>u.startsWith('surfers') && j.profile?.play?.df?.best === 15), '저장(push) 없음');
// 균형 봇 한 판(보상 저장 없이) — 끝까지 굴러가는지만
const b = await t.S(()=>_defend.run(0, 7));
console.log('봇(쉬움)', JSON.stringify(b)); ok(b.res === 'win', '쉬움 봇이 짐');
// 다시 하기 → 폰 뒤로 / Escape 로 닫기
await t.S(()=>document.getElementById('d-go').click()); await t.sleep(100);
await t.p.goBack(); await t.sleep(500);
const bk = await t.S(()=>({ 닫힘:document.getElementById('defend').hidden, run:!!window._gameRun }));
console.log('폰 뒤로', JSON.stringify(bk)); ok(bk.닫힘 && !bk.run, '뒤로 버튼으로 안 닫힘');
await t.S(()=>defendOpen()); await t.sleep(200); await t.p.keyboard.press('Escape'); await t.sleep(300);
const o9 = await t.S(()=>({ 닫힘:document.getElementById('defend').hidden, run:!!window._gameRun, 카드:document.querySelector('[data-hub="defend"]')?.textContent.replace(/\s+/g,' ').trim(), 넘침:document.documentElement.scrollWidth > innerWidth }));
console.log('닫기', JSON.stringify(o9)); ok(o9.닫힘 && !o9.run && /15\/15/.test(o9.카드) && !o9.넘침, '닫기·카드');
// 남의 프로필 값이 이상해도 카드가 깨지지 않게
await t.S(()=>{ ME.profile.play.df = { best:'<b>99', clears:-3 }; renderHub(); });
console.log('이상한 값', await t.S(()=>document.querySelector('[data-hub="defend"]')?.textContent.replace(/\s+/g,' ').trim()));
// 320px 폭에서도 게임 화면이 넘치지 않게
await t.p.setViewport({ width:320, height:640, deviceScaleFactor:2, isMobile:true, hasTouch:true }); await t.S(()=>defendOpen()); await t.sleep(300);
const nw = await t.S(()=>({ 넘침:document.documentElement.scrollWidth > innerWidth, 판:Math.round(document.querySelector('#defend .game-stage').getBoundingClientRect().right) }));
console.log('320폭', JSON.stringify(nw)); ok(!nw.넘침 && nw.판 <= 320, '320 넘침');
console.log('bad', bad); console.log('errs', t.errs);
await t.b.close(); process.exit(bad.length || t.errs.length ? 1 : 0);
