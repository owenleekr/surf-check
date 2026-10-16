/* 해변 수호(서바이버류 디펜스) — 놀이 카드로 열기, 해변 고르기(잠김), 스틱 이동·자동 공격, 멈춤·배속,
   진주 레벨 업(기술 3장 고르기·세상 멈춤), 정비 보급 사기, 큰 파도, 보스 단계, 지는 판·이기는 판(별·첫 클리어·다음 해변 열림) 저장,
   뒤로·Escape 닫기, 이상한 값, 가로 넘침. 스크린샷 3장: 해변 고르기 · 기술 들고 싸우는 중 · 레벨 업 */
import { open } from './mock.mjs';
const OUT = process.env.DSHOT || '/tmp';
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] }, { id:'u4', name:'이성현', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:2500, width:375 });
const bad = [];
const ok = (c, m) => { if(!c) bad.push(m); };
const shot = async n => { await t.p.screenshot({ path:`${OUT}/df3-${n}.png` }); };
const D = (f, a) => t.S(f, a);
await D(()=>{ while(!document.getElementById('pop').hidden) popClose(); setTab('play'); }); await t.sleep(300);
const card = await D(()=>document.querySelector('[data-hub="defend"]')?.textContent.replace(/\s+/g,' ').trim());
console.log('놀이 카드', card); ok(/해변 수호/.test(card || ''), '카드 없음');
await D(()=>document.querySelector('[data-hub="defend"]').click()); await t.sleep(600);
const o1 = await D(()=>({ 열림:!document.getElementById('defend').hidden, 안내:/스틱/.test(document.querySelector('#d-ov .go-d')?.textContent), 해변:document.querySelectorAll('#d-ov [data-stage]').length, 잠김:[...document.querySelectorAll('#d-ov [data-stage]')].map(b=>b.disabled), run:!!window._gameRun, 캔버스:document.getElementById('d-cv').width }));
console.log('시작', JSON.stringify(o1)); ok(o1.열림 && o1.해변 === 3 && o1.잠김.join() === 'false,true,true' && o1.안내 && !o1.run && o1.캔버스 > 480, '시작 화면·잠김');
await shot('stage');
await D(()=>document.getElementById('d-go').click()); await t.sleep(300);
const o2 = await D(()=>({ run:!!window._gameRun, 단계:_defend.S.ph, 라운드:_defend.S.r, 해변:_defend.S.stg, 덮개:document.getElementById('d-ov').hidden, 띠:document.getElementById('d-bar').hidden, 기술:JSON.stringify(_defend.S.sk) }));
console.log('시작함', JSON.stringify(o2)); ok(o2.run && o2.단계 === 'fight' && o2.라운드 === 1 && o2.해변 === 0 && o2.덮개 && o2.띠 && /wax/.test(o2.기술), '시작 실패');
// 손가락으로 끌기
const box = await D(()=>{ const b = document.getElementById('d-cv').getBoundingClientRect(); return { l:b.left, t:b.top, w:b.width, h:b.height }; });
const at = (x, y) => [box.l + x / 240 * box.w, box.t + y / 360 * box.h];
const p0 = await D(()=>({ x:_defend.P.x, y:_defend.P.y }));
await t.p.touchscreen.touchStart(...at(60, 280)); await t.sleep(50);
await t.p.touchscreen.touchMove(...at(80, 262)); await t.p.touchscreen.touchMove(...at(95, 250));
const ds = await D(()=>!!_defend.stick); await t.sleep(900);
const p1 = await D(()=>({ x:_defend.P.x, y:_defend.P.y }));
await t.p.touchscreen.touchEnd(); await t.sleep(100);
console.log('끌기', JSON.stringify({ 스틱:ds, 전:p0, 후:p1 })); ok(ds && p1.x > p0.x + 15 && p1.y < p0.y - 15, '스틱 이동 안 됨');
ok(await D(()=>!_defend.stick), '손 떼도 스틱 남음');
// 멈춤·배속
await D(()=>document.getElementById('d-pause').click()); const tp = await D(()=>_defend.S.t); await t.sleep(400);
ok(await D(tp=>_defend.S.paused && _defend.S.t === tp, tp), '멈춤 실패');
await D(()=>{ document.getElementById('d-pause').click(); document.getElementById('d-speed').click(); });
ok(await D(()=>!_defend.S.paused && /×2/.test(document.getElementById('d-speed').textContent)), '배속 표시');
await D(()=>document.getElementById('d-speed').click());
// 레벨 업 — 진주가 차면 기술 3장, 고르는 동안 세상이 멈춘다
await D(()=>{ _defend.skip(7); _defend.fast(4); _defend.xp(_defend.S.need); }); await t.sleep(400);
const lv = await D(()=>({ 고름:_defend.S.pick && _defend.S.pick.length, 카드:[...document.querySelectorAll('#d-bar [data-pick]')].map(b=>b.textContent.replace(/\s+/g,' ').trim().slice(0, 24)), 띠:document.getElementById('d-bar').classList.contains('pick'), t:_defend.S.t, lv:_defend.S.lv }));
await shot('pick'); await t.sleep(300);
const lvT = await D(()=>_defend.S.t);
console.log('레벨 업', JSON.stringify(lv)); ok(lv.고름 === 3 && lv.카드.length === 3 && lv.띠 && lvT === lv.t && lv.lv === 2, '레벨 업 카드');
const sk0 = await D(()=>JSON.stringify(_defend.S.sk));
await D(()=>document.querySelector('#d-bar [data-pick="0"]').click()); await t.sleep(200);
const lv2 = await D(()=>({ sk:JSON.stringify(_defend.S.sk), 고름:!!_defend.S.pick, 띠:document.getElementById('d-bar').hidden }));
console.log('고른 뒤', JSON.stringify(lv2)); ok(lv2.sk !== sk0 && !lv2.고름 && lv2.띠, '기술 고르기 실패');
// 기술을 여럿 든 한복판(스크린샷)
await D(()=>{ Object.assign(_defend.S.sk, { wax:5, boom:3, dolph:2, shield:2, sun:2 }); _defend.S.evo.wax = 1; _defend.xp(_defend.S.need); _defend.pick(0); _defend.skip(12); _defend.fast(3.2); }); await t.sleep(500);
await shot('fight');
const o3 = await D(()=>({ 적:_defend.S.q.length - _defend.S.qi, 처치:_defend.S.kills, hud:document.getElementById('d-hud').textContent, 돌고래:_defend.S.dn, 방패:_defend.S.ar }));
console.log('싸우는 중', JSON.stringify(o3)); ok(/Lv/.test(o3.hud) && o3.돌고래 >= 1 && o3.방패 > 0, '기술 동작');
// 라운드 끝 → 정비 보급
await D(()=>{ _defend.S.qi = _defend.S.q.length; _defend.killAll(); _defend.fast(.1); _defend.S.shells += 60; _defend.fast(.6); }); await t.sleep(400);
const o4 = await D(()=>({ 단계:_defend.S.ph, 카드:[...document.querySelectorAll('#d-bar [data-buy]')].map(b=>b.textContent.replace(/\s+/g,' ').trim().slice(0, 16)), 조개:_defend.S.shells, 고름:!!_defend.S.pick }));
console.log('정비', JSON.stringify(o4)); ok(o4.단계 === 'shop' && (o4.카드.length === 3 || o4.고름), '보급 안 뜸');
await D(()=>{ while(_defend.S.pick) _defend.pick(0); }); await t.sleep(200);
const sh0 = await D(()=>_defend.S.shells), k0 = await D(()=>_defend.S.offer[0]);
await D(()=>document.querySelector('#d-bar [data-buy="0"]').click()); await t.sleep(200);
await D(()=>{ while(_defend.S.pick) _defend.pick(0); }); await t.sleep(200);
const o5 = await D(()=>({ 조개:_defend.S.shells, 샀음:!!document.querySelector('#d-bar .d-card.on'), nb:JSON.stringify(_defend.S.nb) }));
console.log('보급 산 뒤', k0, JSON.stringify(o5)); ok(o5.조개 < sh0 && o5.샀음, '보급 사기 실패');
await D(()=>document.querySelector('#d-bar [data-gonext]').click()); await t.sleep(200);
ok(await D(()=>_defend.S.ph === 'fight' && _defend.S.r === 13 && document.getElementById('d-bar').hidden), '출발 실패');
// 큰 파도
await t.sleep(1500);
const u1 = await D(()=>{ const n = _defend.S.ult; document.getElementById('d-act').click(); return { 썼음:_defend.S.ult === n - 1 }; });
console.log('큰 파도', JSON.stringify(u1)); ok(u1.썼음, '큰 파도');
// 마지막 보스(대왕 해파리) — 2단계로 넘어가면 배너
await D(()=>{ _defend.skip(15); _defend.fast(3); const b = _defend.S.boss; if(b) b.hp = b.max * .5; _defend.fast(.05); });
const o6 = await D(()=>({ 보스:_defend.S.boss && _defend.S.boss.k, 단계:_defend.S.boss && _defend.S.boss.bp, 라운드:_defend.S.r }));
console.log('보스', JSON.stringify(o6)); ok(o6.보스 === 'king' && o6.단계 === 2 && o6.라운드 === 15, '보스 단계');
// 지는 판
await D(()=>_defend.lose()); await t.sleep(300);
const o7 = await D(()=>({ 결과:document.querySelector('#d-ov .go-t')?.textContent, 통계:document.querySelector('#d-ov .go-st')?.textContent.replace(/\s+/g,' '), 기술:document.querySelector('#d-ov .d-build')?.textContent, df:JSON.stringify(ME.profile.play?.df), run:!!window._gameRun, 닫기:!!document.getElementById('d-close'), 다음:!!document.getElementById('d-next') }));
console.log('지는 판', JSON.stringify(o7)); ok(/잠겼/.test(o7.결과) && /처치/.test(o7.통계) && /왁스/.test(o7.기술 || '') && !o7.run && o7.닫기 && !o7.다음 && /"best":14/.test(o7.df), '패배 경로');
// 이기는 판 — 별·첫 클리어·다음 해변
const sh1 = await D(()=>ME.profile.play.shells || 0);
await D(()=>document.getElementById('d-go').click()); await t.sleep(200);
await D(()=>_defend.win()); await t.sleep(600);
const o8 = await D(()=>({ 결과:document.querySelector('#d-ov .go-t')?.textContent, 별:document.querySelectorAll('#d-ov .d-stars span').length, 첫:document.querySelector('#d-ov .d-new')?.textContent, df:ME.profile.play.df, 조개:ME.profile.play.shells, 다음:!!document.getElementById('d-next') }));
console.log('이긴 판', JSON.stringify(o8)); ok(/지켰/.test(o8.결과) && o8.별 === 3 && /첫 클리어/.test(o8.첫 || '') && o8.df.best === 15 && o8.df.clears === 1 && o8.df.hd === 1 && o8.df.st[0] >= 1 && o8.조개 >= sh1 + 20 && o8.다음, '승리 보상');
await t.sleep(1200);
ok(t.posts.some(([u, j])=>u.startsWith('surfers') && j.profile?.play?.df?.st?.[0] >= 1), '저장(push) 없음');
// 다음 해변 → 죽도로 바로 시작, 해변 고르기에서 죽도 열림·하조대 잠김
await D(()=>document.getElementById('d-next').click()); await t.sleep(200);
const o9 = await D(()=>({ 해변:_defend.S.stg, 단계:_defend.S.ph }));
await D(()=>_defend.lose()); await t.sleep(200); await D(()=>document.getElementById('d-sel').click()); await t.sleep(200);
const o10 = await D(()=>[...document.querySelectorAll('#d-ov [data-stage]')].map(b=>b.disabled).join());
console.log('다음 해변', JSON.stringify(o9), o10); ok(o9.해변 === 1 && o9.단계 === 'fight' && o10 === 'false,false,true', '다음 해변·열림');
// 균형 봇 한 판(보상 저장 없이) — 끝까지 굴러가는지
const b = await D(()=>_defend.run(0, 7));
console.log('봇(낙산)', JSON.stringify(b)); ok(b.res === 'win' || b.res === 'lose', '봇이 안 끝남');
// 폰 뒤로 / Escape 닫기
await D(()=>document.getElementById('d-go').click()); await t.sleep(100);
await t.p.goBack(); await t.sleep(500);
const bk = await D(()=>({ 닫힘:document.getElementById('defend').hidden, run:!!window._gameRun }));
console.log('폰 뒤로', JSON.stringify(bk)); ok(bk.닫힘 && !bk.run, '뒤로 버튼으로 안 닫힘');
await D(()=>defendOpen()); await t.sleep(200); await t.p.keyboard.press('Escape'); await t.sleep(300);
const o11 = await D(()=>({ 닫힘:document.getElementById('defend').hidden, run:!!window._gameRun, 카드:document.querySelector('[data-hub="defend"]')?.textContent.replace(/\s+/g,' ').trim(), 넘침:document.documentElement.scrollWidth > innerWidth }));
console.log('닫기', JSON.stringify(o11)); ok(o11.닫힘 && !o11.run && /⭐ 3\/9/.test(o11.카드) && /15\/15/.test(o11.카드) && !o11.넘침, '닫기·카드');
// 이상한 값이어도 카드·시작 화면이 깨지지 않게
await D(()=>{ ME.profile.play.df = { best:'<b>99', clears:-3, st:'<img>', hd:'x', sb:[1e9] }; renderHub(); });
const wv = await D(()=>{ defendOpen(); const r = { 카드:document.querySelector('[data-hub="defend"]')?.textContent.replace(/\s+/g,' ').trim(), 잠김:[...document.querySelectorAll('#d-ov [data-stage]')].map(b=>b.disabled).join(), 태그:!!document.querySelector('#d-ov img, #d-ov b b') }; defendClose(); return r; });
console.log('이상한 값', JSON.stringify(wv)); ok(wv.잠김 === 'false,true,true' && !wv.태그, '이상한 값');
// 320px
await t.p.setViewport({ width:320, height:640, deviceScaleFactor:2, isMobile:true, hasTouch:true }); await D(()=>defendOpen()); await t.sleep(300);
const nw = await D(()=>({ 넘침:document.documentElement.scrollWidth > innerWidth, 판:Math.round(document.querySelector('#defend .game-stage').getBoundingClientRect().right) }));
console.log('320폭', JSON.stringify(nw)); ok(!nw.넘침 && nw.판 <= 320, '320 넘침');
console.log('bad', bad); console.log('errs', t.errs);
await t.b.close(); process.exit(bad.length || t.errs.length ? 1 : 0);
