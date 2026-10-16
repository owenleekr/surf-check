/* 해변 수호(액션 아케이드) — 놀이 카드로 열기, 해변 고르기(잠김), 첫 판 조작법(3단계)·「?」로 다시 보기,
   아래 스틱으로 이동, 👊 공격(자동 조준·3단 콤보)이 적을 맞힘, 💨 대시(무적·쿨타임), 🌊 필살기(게이지·화면 전체),
   웨이브 클리어 → 강화 카드 3장(세상 멈춤) → 다음 웨이브, 보스 단계, 지는 판·이기는 판(별·첫 클리어·다음 해변) 저장(playDefendDone),
   키보드, 뒤로·Escape 닫기, 이상한 값, 좁은 폭. 스크린샷 3장: 조작법 · 콤보 싸움 · 보스 → DSHOT/darc-*.png */
import { open } from './mock.mjs';
const OUT = process.env.DSHOT || '/tmp';
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] }, { id:'u4', name:'이성현', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:2500 });
const bad = [];
const ok = (c, m) => { if(!c) bad.push(m); };
const shot = async n => { await t.S(()=>{ const o = document.getElementById('offbar'); if(o) o.hidden = true; }); await t.p.screenshot({ path:`${OUT}/darc-${n}.png` }); };   // 시험 환경의 오프라인 띠는 사진에서만 감춘다
const D = (f, a) => t.S(f, a);
const ctr = async sel => D(s=>{ const b = document.querySelector(s).getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel);
const tap = async sel => { const [x, y] = await ctr(sel); await t.p.touchscreen.touchStart(x, y); await t.sleep(60); await t.p.touchscreen.touchEnd(); };
const steps = n => D(n=>{ for(let i = 0; i < n; i++) _defend.step(_defend.FIX); }, n);
await D(()=>{ while(!document.getElementById('pop').hidden) popClose(); setTab('play'); }); await t.sleep(300);
const card = await D(()=>document.querySelector('[data-hub="defend"]')?.textContent.replace(/\s+/g,' ').trim());
console.log('놀이 카드', card); ok(/해변 수호/.test(card || ''), '카드 없음');
await D(()=>document.querySelector('[data-hub="defend"]').click()); await t.sleep(600);
const o1 = await D(()=>({ 열림:!document.getElementById('defend').hidden, 목표:document.querySelector('#d-ov .d-goal')?.textContent, 해변:document.querySelectorAll('#d-ov [data-stage]').length, 잠김:[...document.querySelectorAll('#d-ov [data-stage]')].map(b=>b.disabled), run:!!window._gameRun, 캔버스:document.getElementById('d-cv').width, 패드:document.getElementById('d-pad').classList.contains('off') }));
console.log('시작', JSON.stringify(o1)); ok(o1.열림 && o1.해변 === 3 && o1.잠김.join() === 'false,true,true' && /서핑 학교를 지켜라/.test(o1.목표) && !o1.run && o1.캔버스 > 480 && o1.패드, '시작 화면·잠김');
// 처음 시작 → 조작법 3단계가 먼저
await D(()=>document.getElementById('d-go').click()); await t.sleep(300);
const hw = await D(()=>({ 단계:document.querySelectorAll('#d-ov .d-how li').length, 글:document.querySelector('#d-ov .d-how')?.textContent.replace(/\s+/g,' '), run:!!window._gameRun, 패드보임:document.getElementById('d-pad').classList.contains('show') }));
console.log('조작법', JSON.stringify(hw)); ok(hw.단계 === 3 && /이동/.test(hw.글) && /공격/.test(hw.글) && /필살기/.test(hw.글) && !hw.run && hw.패드보임, '조작법 안 뜸');
await shot('how');
await D(()=>document.getElementById('d-howok').click()); await t.sleep(300);
const o2 = await D(()=>({ run:!!window._gameRun, 단계:_defend.S.ph, 웨이브:_defend.S.w, 해변:_defend.S.stg, 덮개:document.getElementById('d-ov').hidden, 패드:!document.getElementById('d-pad').classList.contains('off'), 봄:localStorage.getItem('lineup.share.dhow') }));
console.log('시작함', JSON.stringify(o2)); ok(o2.run && o2.단계 === 'fight' && o2.웨이브 === 1 && o2.해변 === 0 && o2.덮개 && o2.패드 && o2.봄 === '1', '시작 실패');
// 아래 왼쪽 스틱으로 끌기
const [jx, jy] = await ctr('#d-joy');
const p0 = await D(()=>({ x:_defend.P.x, y:_defend.P.y }));
await t.p.touchscreen.touchStart(jx, jy); await t.sleep(50);
await t.p.touchscreen.touchMove(jx + 20, jy - 20); await t.p.touchscreen.touchMove(jx + 40, jy - 40);
const ds = await D(()=>({ s:!!_defend.stick, src:_defend.stick?.src, kx:getComputedStyle(document.getElementById('d-joy')).getPropertyValue('--kx') })); await t.sleep(700);
const p1 = await D(()=>({ x:_defend.P.x, y:_defend.P.y }));
await t.p.touchscreen.touchEnd(); await t.sleep(100);
console.log('스틱', JSON.stringify({ ds, 전:p0, 후:p1 })); ok(ds.s && ds.src === 'pad' && parseFloat(ds.kx) > 10 && p1.x > p0.x + 15 && p1.y < p0.y - 15, '스틱 이동 안 됨');
ok(await D(()=>!_defend.stick), '손 떼도 스틱 남음');
// 👊 공격 — 옆의 꽃게를 자동 조준해 맞힌다(한 걸음 뛰어들어)
await D(()=>{ window._dfreeze = 1; _defend.killAll(); const P = _defend.P; _defend.spawn('crab', P.x + 30, P.y - 12).hp = 999; });
const h0 = await D(()=>({ hits:_defend.S.hits, atks:_defend.S.atks }));
await tap('#d-atk'); await steps(12);
const h1 = await D(()=>({ hits:_defend.S.hits, atks:_defend.S.atks }));
console.log('공격', JSON.stringify({ h0, h1 })); ok(h1.atks === h0.atks + 1 && h1.hits === h0.hits + 1, '공격 버튼이 적을 안 맞힘');
// 꾹 누르면 3단 콤보 — 3타째가 피니시, 게이지가 찬다
const [ax, ay] = await ctr('#d-atk'); await t.p.touchscreen.touchStart(ax, ay); await t.sleep(30);
const cmb = await D(()=>{ const seen = []; for(let i = 0; i < 80; i++){ _defend.step(_defend.FIX); const w = _defend.P.sw; if(w && w.t === _defend.FIX) seen.push(w.fin ? 'F' : 'n'); } return { seen:seen.join(''), held:_defend.BTN.atk, sp:Math.round(_defend.S.sp), cb:_defend.S.cb }; });
await t.p.touchscreen.touchEnd(); await t.sleep(50);
console.log('콤보', JSON.stringify(cmb)); ok(/nF|nnF/.test(cmb.seen) && cmb.held === 1 && cmb.sp > 5 && cmb.cb >= 3 && !(await D(()=>_defend.BTN.atk)), '꾹 눌러 콤보');
// 💨 대시 — 무적·쿨타임 고리
await D(()=>{ _defend.killAll(); Object.assign(_defend.P, { x:120, face:1 }); }); const dx0 = await D(()=>_defend.P.x);
await tap('#d-dash'); await steps(1);
const da = await D(()=>({ d:_defend.S.dashes, inv:_defend.P.inv > 0, cd:_defend.P.dcd > 0 }));
await steps(12); await D(()=>{ window._dfreeze = 0; }); await t.sleep(120);
const da2 = await D(()=>({ x:_defend.P.x, ring:+getComputedStyle(document.getElementById('d-dash')).getPropertyValue('--cd') }));
console.log('대시', JSON.stringify({ da, da2, dx0 })); ok(da.d === 1 && da.inv && da.cd && Math.abs(da2.x - dx0) > 20 && da2.ring > 0, '대시');
// 🌊 필살기 — 게이지가 차야 쓸 수 있고, 화면의 적을 친다
await D(()=>{ window._dfreeze = 1; for(let i = 0; i < 4; i++) _defend.spawn('jelly', 40 + i * 50, 200).hp = 999; _defend.S.sp = 40; });
await tap('#d-sp'); await steps(1);
const sp0 = await D(()=>_defend.S.sps);
await D(()=>{ _defend.S.sp = 100; window._dfreeze = 0; }); await t.sleep(80);
const full = await D(()=>document.getElementById('d-sp').classList.contains('full'));
await D(()=>{ window._dfreeze = 1; }); const hit0 = await D(()=>_defend.S.hits);
await tap('#d-sp'); await steps(80);
const sp1 = await D(h=>({ sps:_defend.S.sps, g:_defend.S.sp, 맞음:_defend.S.hits - h }), hit0);
console.log('필살기', JSON.stringify({ 빈게이지:sp0, 반짝:full, 후:sp1 })); ok(sp0 === 0 && full && sp1.sps === 1 && sp1.g < 100 && sp1.맞음 >= 4, '필살기');
await D(()=>{ _defend.killAll(); window._dfreeze = 0; });
// 멈춤 · 「?」 조작법 다시 보기(멈춘 채)
await D(()=>document.getElementById('d-pause').click()); const tp = await D(()=>_defend.S.t); await t.sleep(300);
ok(await D(tp=>_defend.S.paused && _defend.S.t === tp, tp), '멈춤 실패');
await D(()=>document.getElementById('d-pause').click());
await D(()=>document.getElementById('d-help').click()); await t.sleep(200);
const hp2 = await D(()=>({ 멈춤:_defend.S.paused, 단계:document.querySelectorAll('#d-ov .d-how li').length, 버튼:document.getElementById('d-howok')?.textContent }));
await D(()=>document.getElementById('d-howok').click()); await t.sleep(150);
const hp3 = await D(()=>({ 멈춤:_defend.S.paused, 덮개:document.getElementById('d-ov').hidden }));
console.log('? 다시 보기', JSON.stringify({ hp2, hp3 })); ok(hp2.멈춤 && hp2.단계 === 3 && /계속/.test(hp2.버튼) && !hp3.멈춤 && hp3.덮개, '? 버튼');
// 웨이브 클리어 → 강화 카드 3장(세상 멈춤) → 고르면 다음 웨이브
await D(()=>{ const S = _defend.S; S.qi = S.q.length; _defend.killAll(); for(let i = 0; i < 140 && !S.pick; i++) _defend.step(_defend.FIX); }); await t.sleep(300);
const pk = await D(()=>({ 고름:_defend.S.pick && _defend.S.pick.length, 카드:[...document.querySelectorAll('#d-bar [data-pick]')].map(b=>b.textContent.replace(/\s+/g,' ').trim().slice(0, 22)), 띠:document.getElementById('d-bar').classList.contains('pick'), 제목:document.querySelector('#d-bar .d-sh')?.textContent, t:_defend.S.t, 패드:document.getElementById('d-pad').classList.contains('off') }));
await t.sleep(300); const pkT = await D(()=>_defend.S.t);
console.log('강화 카드', JSON.stringify(pk)); ok(pk.고름 === 3 && pk.카드.length === 3 && pk.띠 && /WAVE 1 클리어/.test(pk.제목) && pk.t === pkT && pk.패드, '강화 카드');
const up0 = await D(()=>JSON.stringify(_defend.S.up) + _defend.S.hp);
await D(()=>document.querySelector('#d-bar [data-pick="0"]').click()); await t.sleep(200);
const pk2 = await D(()=>({ up:JSON.stringify(_defend.S.up) + _defend.S.hp, w:_defend.S.w, 띠:document.getElementById('d-bar').hidden, ban:_defend.S.ban && _defend.S.ban.t }));
console.log('고른 뒤', JSON.stringify(pk2)); ok(pk2.up !== up0 && pk2.w === 2 && pk2.띠 && /WAVE 2\/5/.test(pk2.ban || ''), '다음 웨이브');
// 콤보 싸움 한복판(스크린샷) — 해파리·꽃게 떼 한가운데서 3타째
await D(()=>{ _defend.skip(3); _defend.auto(4); if(_defend.S.pick) _defend.pick(0); _defend.killAll(); const S = _defend.S, P = _defend.P; S.qi = S.q.length; Object.assign(S.up, { atk:1, dolph:1 }); S.fire = 6; P.x = 120; P.y = 205; P.stun = 0; P.inv = 9; P.sw = null; P.cwin = 0; P.acd = 0; P.dash = 0;
  for(const [dx, dy] of [[-22, -16], [20, -18], [-4, -26], [26, 4], [-26, 6], [10, -40], [-34, -34]]){ const f = _defend.spawn(dx % 2 ? 'jelly' : 'crab', P.x + dx, P.y + dy); if(f) f.hp = 400; }
  S.cb = 17; S.cbt = 2; S.sp = 64; _defend.BTN.atk = 1; for(let i = 0; i < 200; i++){ _defend.step(_defend.FIX); if(_defend.P.sw && _defend.P.sw.fin && _defend.P.sw.t > .1) break; } _defend.BTN.atk = 0; window._dfreeze = 1; }); await t.sleep(120);
await shot('fight');
const o3 = await D(()=>({ 콤보:_defend.S.cb, 피니시:!!(_defend.P.sw && _defend.P.sw.fin) }));
console.log('싸우는 중', JSON.stringify(o3)); ok(o3.콤보 >= 18 && o3.피니시, '콤보 싸움');
await D(()=>{ window._dfreeze = 0; });
// 마지막 보스(대왕 해파리) — 2단계로 넘어가면 배너
await D(()=>{ _defend.skip(5); _defend.auto(5); const b = _defend.S.boss; if(b) b.hp = b.max * .62; _defend.fast(.05); _defend.S.sp = 0; _defend.auto(.5); _defend.S.sp = 70; window._dfreeze = 1; }); await t.sleep(120);
const o6 = await D(()=>({ 보스:_defend.S.boss && _defend.S.boss.k, 단계:_defend.S.boss && _defend.S.boss.bp, 웨이브:_defend.S.w }));
await shot('boss');
console.log('보스', JSON.stringify(o6)); ok(o6.보스 === 'king' && o6.단계 >= 2 && o6.웨이브 === 5, '보스 단계');
await D(()=>{ window._dfreeze = 0; });
// 지는 판 — 웨이브 4까지 깼으니 best 4(해변을 이어 센다)
await D(()=>_defend.lose()); await t.sleep(300);
const o7 = await D(()=>({ 결과:document.querySelector('#d-ov .go-t')?.textContent, 통계:document.querySelector('#d-ov .go-st')?.textContent.replace(/\s+/g,' '), 점수:document.querySelector('#d-ov .d-score')?.textContent, df:JSON.stringify(ME.profile.play?.df), run:!!window._gameRun, 한판:document.getElementById('d-go')?.textContent, 다음:!!document.getElementById('d-next'), 패드:document.getElementById('d-pad').classList.contains('off') }));
console.log('지는 판', JSON.stringify(o7)); ok(/잠겼/.test(o7.결과) && /처치/.test(o7.통계) && /점수/.test(o7.점수) && !o7.run && /한 판 더/.test(o7.한판) && !o7.다음 && /"best":4/.test(o7.df) && o7.패드, '패배 경로');
// 이기는 판 — 별·첫 클리어·다음 해변
const sh1 = await D(()=>ME.profile.play.shells || 0);
await D(()=>document.getElementById('d-go').click()); await t.sleep(200);
await D(()=>_defend.win()); await t.sleep(600);
const o8 = await D(()=>({ 결과:document.querySelector('#d-ov .go-t')?.textContent, 별:document.querySelectorAll('#d-ov .d-stars span').length, 첫:document.querySelector('#d-ov .d-new')?.textContent, df:ME.profile.play.df, 조개:ME.profile.play.shells, 다음:!!document.getElementById('d-next'), 최고:localStorage.getItem('lineup.share.dbest') }));
console.log('이긴 판', JSON.stringify(o8)); ok(/지켰/.test(o8.결과) && o8.별 === 3 && /첫 클리어/.test(o8.첫 || '') && o8.df.best === 5 && o8.df.clears === 1 && o8.df.hd === 1 && o8.df.st[0] === 3 && o8.df.sb[0] === 5 && o8.조개 >= sh1 + 20 && o8.다음 && /^\[\d+/.test(o8.최고 || ''), '승리 보상');
await t.sleep(1200);
ok(t.posts.some(([u, j])=>u.startsWith('surfers') && j.profile?.play?.df?.st?.[0] >= 1), '저장(push) 없음');
// 다음 해변 → 죽도로 바로 시작, 해변 고르기에서 죽도 열림·하조대 잠김
await D(()=>document.getElementById('d-next').click()); await t.sleep(200);
const o9 = await D(()=>({ 해변:_defend.S.stg, 단계:_defend.S.ph }));
await D(()=>_defend.lose()); await t.sleep(200); await D(()=>document.getElementById('d-sel').click()); await t.sleep(200);
const o10 = await D(()=>[...document.querySelectorAll('#d-ov [data-stage]')].map(b=>b.disabled).join());
console.log('다음 해변', JSON.stringify(o9), o10); ok(o9.해변 === 1 && o9.단계 === 'fight' && o10 === 'false,false,true', '다음 해변·열림');
// 키보드 — J 공격, K 대시 (두 번째부터는 조작법 없이 바로 시작)
await D(()=>{ document.querySelector('#d-ov [data-stage="0"]').click(); document.getElementById('d-go').click(); }); await t.sleep(200);
const kb0 = await D(()=>({ run:!!window._gameRun, how:!!document.querySelector('#d-ov:not([hidden]) .d-how'), a:_defend.S.atks, d:_defend.S.dashes }));
await t.p.keyboard.down('j'); await t.sleep(250); await t.p.keyboard.up('j'); await t.p.keyboard.press('k'); await t.sleep(150);
const kb = await D(()=>({ a:_defend.S.atks, d:_defend.S.dashes, held:_defend.BTN.atk }));
console.log('키보드', JSON.stringify({ kb0, kb })); ok(kb0.run && !kb0.how && kb.a > kb0.a && kb.d === kb0.d + 1 && !kb.held, '키보드');
// 균형 봇 한 판(보상 저장 없이) — 끝까지 굴러가는지
const b = await D(()=>_defend.run(0, 7, false, {}, 'casual'));
console.log('봇(낙산·가볍게)', JSON.stringify(b)); ok(b.res === 'win' || b.res === 'lose', '봇이 안 끝남');
// 폰 뒤로 / Escape 닫기
await D(()=>document.getElementById('d-go').click()); await t.sleep(100);
await t.p.goBack(); await t.sleep(500);
const bk = await D(()=>({ 닫힘:document.getElementById('defend').hidden, run:!!window._gameRun }));
console.log('폰 뒤로', JSON.stringify(bk)); ok(bk.닫힘 && !bk.run, '뒤로 버튼으로 안 닫힘');
await D(()=>defendOpen()); await t.sleep(200); await t.p.keyboard.press('Escape'); await t.sleep(300);
const o11 = await D(()=>({ 닫힘:document.getElementById('defend').hidden, run:!!window._gameRun, 카드:document.querySelector('[data-hub="defend"]')?.textContent.replace(/\s+/g,' ').trim(), 넘침:document.documentElement.scrollWidth > innerWidth }));
console.log('닫기', JSON.stringify(o11)); ok(o11.닫힘 && !o11.run && /⭐ 3\/9/.test(o11.카드) && /웨이브 5\/15/.test(o11.카드) && !o11.넘침, '닫기·카드');
// 이상한 값이어도 카드·시작 화면이 깨지지 않게
await D(()=>{ ME.profile.play.df = { best:'<b>99', clears:-3, st:'<img>', hd:'x', sb:[1e9] }; localStorage.setItem('lineup.share.dbest', '["<img>", 1e99]'); renderHub(); });
const wv = await D(()=>{ defendOpen(); const r = { 카드:document.querySelector('[data-hub="defend"]')?.textContent.replace(/\s+/g,' ').trim(), 잠김:[...document.querySelectorAll('#d-ov [data-stage]')].map(b=>b.disabled).join(), 태그:!!document.querySelector('#d-ov img, #d-ov b b') }; defendClose(); return r; });
console.log('이상한 값', JSON.stringify(wv)); ok(wv.잠김 === 'false,true,true' && !wv.태그, '이상한 값');
// 보스를 쓰러뜨리면 웨이브가 바로 끝난다(남은 졸개 줄이 나오지 않게) → 결과 화면
await D(()=>{ defendOpen(); _defend.start(0, 3, {}); _defend.skip(5); _defend.fast(3.8); const S = _defend.S; S.boss.hp = 1; _defend.spawn('crab', 120, 200); _defend.special(); S.sp = 0; for(let i = 0; i < 5 && S.boss; i++) _defend.press('atk', 1); });
const bz = await D(()=>{ const S = _defend.S; for(let i = 0; i < 600 && S.boss; i++){ _defend.BTN.atk = 1; const b = S.boss; if(b){ _defend.P.x = b.x; _defend.P.y = b.y + 24; } _defend.step(_defend.FIX); } _defend.BTN.atk = 0; const q = S.q.length - S.qi;
  for(let i = 0; i < 400 && S.ph !== 'done'; i++) _defend.step(_defend.FIX); return { 남은줄:q, 결과:S.res }; });
console.log('보스 격파', JSON.stringify(bz)); ok(bz.남은줄 === 0 && bz.결과 === 'win', '보스 격파 뒤 웨이브가 안 끝남');
await D(()=>defendClose());
// 몇 가지 폭에서 — 싸울 때 패드가 화면 안·캔버스와 안 겹침·버튼끼리 안 겹침·엄지 크기 / 해변 고르기·조작법·결과 카드가 스크롤 없이 다 보임
for(const [w, h] of [[390, 844], [375, 667], [360, 740], [320, 640]]){
  await t.p.setViewport({ width:w, height:h, deviceScaleFactor:2, isMobile:true, hasTouch:true }); await t.sleep(150);
  const L = await D(()=>{ const r = id => document.getElementById(id).getBoundingClientRect(), ov = document.getElementById('d-ov'), fits = () => ov.scrollHeight <= ov.clientHeight + 2;
    const hit = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
    defendOpen(); const o = { 고르기:fits() }; document.getElementById('d-how').click(); o.조작법 = fits(); o.조작법버튼 = r('d-howok').bottom <= r('d-sp').top || r('d-howok').bottom <= ov.getBoundingClientRect().bottom;
    _defend.start(0, 5, {}); const st = document.querySelector('#defend .game-stage').getBoundingClientRect(), pad = r('d-pad'), a = r('d-atk'), d = r('d-dash'), sp = r('d-sp'), j = r('d-joy');
    Object.assign(o, { 패드아래:Math.round(pad.bottom), 높이:innerHeight, 캔버스겹침:sp.top < st.bottom - 1 || a.top < st.bottom - 1, 버튼겹침:hit(a, d) || hit(a, sp) || hit(d, sp), 공격:Math.round(a.width), 대시:Math.round(d.width), 필살:Math.round(sp.width), 스틱:Math.round(j.width), 넘침:document.documentElement.scrollWidth > innerWidth || Math.round(pad.right) > innerWidth || pad.left < 0 });
    _defend.lose(); o.패배 = fits(); _defend.start(0, 5, {}); _defend.win(); o.승리 = fits(); o.승리버튼 = !!document.getElementById('d-close') && r('d-close').bottom <= ov.getBoundingClientRect().bottom + 1; defendClose(); return o; });
  console.log(`${w}×${h}`, JSON.stringify(L));
  ok(L.고르기 && L.조작법 && L.패배 && L.승리 && L.승리버튼, `${w} 카드가 잘림`); ok(L.패드아래 <= L.높이 && !L.캔버스겹침 && !L.버튼겹침 && !L.넘침, `${w} 패드 배치`);
  ok(L.공격 >= 80 && L.대시 >= 56 && L.필살 >= 56 && L.스틱 >= 110, `${w} 버튼 크기`);
}
await t.p.setViewport({ width:390, height:844, deviceScaleFactor:2, isMobile:true, hasTouch:true }); await t.sleep(150);
// 두 손가락 — 왼손 스틱을 끄는 채로 오른손 👊 꾹(터치 두 점 동시)
await D(()=>{ defendOpen(); _defend.start(0, 9, {}); window._dfreeze = 1; _defend.killAll(); const P = _defend.P; P.x = 60; P.y = 250; _defend.spawn('crab', 150, 190).hp = 999; window._dfreeze = 0; });
const cdp = await t.p.createCDPSession(), TE = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints:pts.map(([x, y, i], id) => ({ x, y, id:i ?? id, radiusX:5, radiusY:5, force:1 })) });   // touchEnd 에는 뗀 손가락만
const [j2x, j2y] = await ctr('#d-joy'), [a2x, a2y] = await ctr('#d-atk'), mt0 = await D(()=>({ x:_defend.P.x, a:_defend.S.atks }));
await TE('touchStart', [[j2x, j2y]]); await TE('touchMove', [[j2x + 30, j2y - 20]]); await t.sleep(80);
await TE('touchStart', [[j2x + 30, j2y - 20], [a2x, a2y]]); await t.sleep(400);
const mt1 = await D(()=>({ 스틱:!!_defend.stick, 공격중:_defend.BTN.atk, x:_defend.P.x, a:_defend.S.atks }));
await TE('touchMove', [[j2x + 40, j2y - 25], [a2x, a2y]]); await TE('touchEnd', [[a2x, a2y, 1]]); await t.sleep(60);   // 오른손만 뗌
const mt2 = await D(()=>({ 스틱:!!_defend.stick, 공격중:_defend.BTN.atk }));
await TE('touchEnd', [[j2x + 40, j2y - 25, 0]]); await t.sleep(60); const mt3 = await D(()=>({ 스틱:!!_defend.stick, 공격중:_defend.BTN.atk }));
console.log('두 손가락', JSON.stringify({ mt0, mt1, mt2, mt3 })); ok(mt1.스틱 && mt1.공격중 === 1 && mt1.x > mt0.x + 10 && mt1.a > mt0.a && mt2.스틱 && !mt2.공격중 && !mt3.스틱, '스틱+공격 동시');
// 탭이 뒤로 가면 저절로 멈춤 → 아무 버튼이나 누르면 계속
await D(()=>{ Object.defineProperty(document, 'hidden', { configurable:true, get:()=>true }); document.dispatchEvent(new Event('visibilitychange')); });
const vz = await D(()=>({ 멈춤:_defend.S.paused, t:_defend.S.t })); await t.sleep(300);
await D(()=>{ delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); }); const vz2 = await D(()=>({ 멈춤:_defend.S.paused, t:_defend.S.t, 버튼:document.getElementById('d-pause').textContent }));
await tap('#d-atk'); await t.sleep(150); const vz3 = await D(()=>({ 멈춤:_defend.S.paused, 공격:_defend.BTN.atk }));
console.log('백그라운드', JSON.stringify({ vz, vz2, vz3 })); ok(vz.멈춤 && vz2.멈춤 && vz2.t === vz.t && vz2.버튼 === '▶' && !vz3.멈춤 && !vz3.공격, '백그라운드 자동 멈춤');
// 강화 카드 — 막 뜬 카드는 0.4초 동안 손가락이 눌러도 안 고른다 · 고르는 동안 멈춤 버튼은 잠김 · 연타해도 한 장만
await D(()=>{ const S = _defend.S; S.qi = S.q.length; _defend.killAll(); for(let i = 0; i < 200 && !S.pick; i++) _defend.step(_defend.FIX); });
await t.sleep(30); const w0 = await D(()=>_defend.S.w); await tap('#d-bar [data-pick="1"]');
const ar = await D(()=>({ 고름:!!_defend.S.pick, 멈춤잠김:document.getElementById('d-pause').disabled })); await t.sleep(450);
await tap('#d-bar [data-pick="1"]'); await tap('#d-bar [data-pick="1"]').catch(()=>{}); await t.sleep(100);
const ar2 = await D(w0=>({ 고름:!!_defend.S.pick, 웨이브:_defend.S.w - w0, 멈춤잠김:document.getElementById('d-pause').disabled }), w0);
console.log('카드 보호', JSON.stringify({ ar, ar2 })); ok(ar.고름 && ar.멈춤잠김 && !ar2.고름 && ar2.웨이브 === 1 && !ar2.멈춤잠김, '카드 보호·연타');
// 싸우다 닫고 다시 열기 → 처음 화면, 남은 것 없음
await D(()=>{ _defend.BTN.atk = 1; document.getElementById('d-x').click(); }); await t.sleep(200);
const ro = await D(()=>{ defendOpen(); return { S:_defend.S, run:!!window._gameRun, 공격:_defend.BTN.atk, 고르기:!!document.querySelector('#d-ov [data-stage]'), 띠:document.getElementById('d-bar').hidden, 메뉴:document.getElementById('defend').classList.contains('dmenu') }; });
console.log('닫고 다시', JSON.stringify(ro)); ok(ro.S === null && !ro.run && !ro.공격 && ro.고르기 && ro.띠 && ro.메뉴, '다시 열기');
// 폰 뒤로 — 강화 카드 · 조작법 · 결과 화면에서도 닫힌다(멈춘 채 남지 않게)
const backAt = async (n, f) => { await D(()=>{ if(document.getElementById('defend').hidden) defendOpen(); }); await t.sleep(150); await D(f); await t.sleep(150); await t.p.goBack(); await t.sleep(400);
  const r = await D(()=>({ 닫힘:document.getElementById('defend').hidden, run:!!window._gameRun })); console.log('뒤로·' + n, JSON.stringify(r)); ok(r.닫힘 && !r.run, '뒤로 ' + n); };
await backAt('카드', ()=>{ _defend.start(0, 4, {}); const S = _defend.S; S.qi = S.q.length; _defend.killAll(); for(let i = 0; i < 200 && !S.pick; i++) _defend.step(_defend.FIX); });
await backAt('조작법', ()=>{ _defend.start(0, 4, {}); document.getElementById('d-help').click(); });
await backAt('결과', ()=>{ _defend.start(0, 4, {}); _defend.lose(); });
// 보상은 한 판에 한 번 — 끝난 뒤 더 굴려도·「한 판 더」를 연타해도 playDefendDone 은 판마다 한 번
const rw = await D(async ()=>{ let n = 0; const f0 = window.playDefendDone; window.playDefendDone = (...a) => { n++; return f0(...a); };
  defendOpen(); _defend.start(0, 6, {}); _defend.lose(); for(let i = 0; i < 30; i++) _defend.step(_defend.FIX); _defend.lose(); const n1 = n;
  const g = document.getElementById('d-go'); g.click(); g.click(); document.getElementById('d-go')?.click(); const run = _defend.S.ph; _defend.lose(); const n2 = n;
  window.playDefendDone = f0; defendClose(); return { n1, n2, run }; });
console.log('보상 한 번', JSON.stringify(rw)); ok(rw.n1 === 1 && rw.n2 === 2 && rw.run === 'fight', '보상 중복');
// 새로고침 뒤에도 기록(별·최고점)이 남는다
const sv0 = await D(()=>({ st:ME.profile.play.df.st.join(), best:localStorage.getItem('lineup.share.dbest') }));
await t.p.reload({ waitUntil:'networkidle2' }); await t.sleep(1500);
const sv1 = await D(()=>{ const me = JSON.parse(localStorage.getItem('lineup.share.me') || '{}'); return { st:(me.profile?.play?.df?.st || []).join(), best:localStorage.getItem('lineup.share.dbest'), how:localStorage.getItem('lineup.share.dhow') }; });
console.log('새로고침', JSON.stringify({ sv0, sv1 })); ok(sv1.st === sv0.st && sv1.best === sv0.best && sv1.how === '1', '새로고침 뒤 기록');
const re = await D(()=>{ defendOpen(); const r = [...document.querySelectorAll('#d-ov [data-stage]')].map(b=>b.disabled).join(); defendClose(); return r; });
ok(re.startsWith('false,false'), '새로고침 뒤 해변 열림');
// ── 재미 더하기: 🌀 무한 파도 · 오늘의 바다 · 👑 왕관 적 · ✨ 시너지 · 연속 처치 외침 · 마지막 한 마리 슬로 모션 ──
const FOUT = process.env.FSHOT || OUT;
const fshot = async n => { await t.S(()=>{ const o = document.getElementById('offbar'); if(o) o.hidden = true; }); await t.p.screenshot({ path:`${FOUT}/fun-d-${n}.png` }); };
// 잠김 — 낙산을 못 지켰으면 한 줄 안내만
const lk = await D(()=>{ const st = ME.profile.play.df.st; ME.profile.play.df.st = [0, 0, 0]; defendOpen(); const r = { 버튼:!!document.getElementById('d-inf'), 안내:document.querySelector('#d-ov .d-inf0')?.textContent }; defendClose(); ME.profile.play.df.st = st; return r; });
console.log('무한 잠김', JSON.stringify(lk)); ok(!lk.버튼 && /낙산을 지키면 열려요/.test(lk.안내 || ''), '무한 파도 잠김 안내');
// 열림 — 오늘의 바다(날짜로 정해짐)와 최고 기록
const sea = await D(()=>({ a:_defend.seaOf().k, b:_defend.seaOf().k, f:_defend.seaOf('shark').k, n:_defend.SEA.length }));
await D(()=>{ localStorage.removeItem('lineup.share.dinf'); defendOpen(); }); await t.sleep(200);
const iv = await D(()=>({ 버튼:document.getElementById('d-inf')?.textContent.replace(/\s+/g,' ').trim(), 해변:document.querySelectorAll('#d-ov [data-stage]').length }));
console.log('무한 열림', JSON.stringify({ sea, iv })); ok(sea.a === sea.b && sea.f === 'shark' && sea.n === 6 && /무한 파도/.test(iv.버튼 || '') && /오늘의 바다/.test(iv.버튼 || '') && /NEW/.test(iv.버튼 || '') && iv.해변 === 3, '무한 파도 줄');
await fshot('menu');
await D(()=>document.getElementById('d-inf').click()); await t.sleep(250);
const i1 = await D(()=>({ inf:_defend.S.inf, w:_defend.S.w, ban:_defend.S.ban && _defend.S.ban.t, sub:_defend.S.ban && _defend.S.ban.s, run:!!window._gameRun, 덮개:document.getElementById('d-ov').hidden }));
console.log('무한 시작', JSON.stringify(i1)); ok(i1.inf === 1 && i1.w === 1 && /🌀 WAVE 1/.test(i1.ban || '') && /오늘의 바다/.test(i1.sub || '') && i1.run && i1.덮개, '무한 파도 시작');
// 웨이브 5·10은 보스, 6은 보스 아님 · 웨이브가 갈수록 단단해진다 · 카드를 다 모아도 멈추지 않는다
const iw = await D(()=>{ const S = _defend.S, o = {}; _defend.skip(5); _defend.fast(2.6); o.b5 = S.boss && S.boss.k; _defend.skip(6); o.b6 = !!S.boss; const h6 = _defend.spawn('crab', 100, 200).max; _defend.skip(12); const h12 = _defend.spawn('crab', 100, 200).max; o.세짐 = h12 > h6 * 2; _defend.skip(10); _defend.fast(2.6); o.b10 = S.boss && S.boss.k; o.해변그림 = S.stg;
  for(const u of _defend.UPS) if(u.k !== 'heal') S.up[u.k] = u.max; S.hp = S.max; S.qi = S.q.length; _defend.killAll(true); for(let i = 0; i < 300 && !S.pick; i++) _defend.step(_defend.FIX); o.다모음 = S.pick && S.pick.join(); _defend.pick(0); o.다음 = S.w; return o; });
console.log('무한 웨이브', JSON.stringify(iw)); ok(iw.b5 === 'king' && !iw.b6 && iw.b10 === 'jaws' && iw.세짐 && iw.해변그림 === 1 && iw.다모음 === 'heal' && iw.다음 === 11, '무한 웨이브 진행');
// 👑 왕관 적 — 체력 3배, 처음엔 한 줄 안내, 잡으면 아이템·조개 3개
const cr = await D(()=>{ _defend.start(0, 11, {}); const S = _defend.S; _defend.skip(2); S.qi = S.q.length; _defend.killAll(); window._dfreeze = 1; S.ban = null; const P = _defend.P; P.x = 120; P.y = 230;
  const f = _defend.spawn('crab', 120, 205); const h0 = f.max; _defend.crownIt(f); const o = { 배:Math.round(f.max / h0), 표시:f.cr }; S.cb = 0; S.ks = 0;
  for(let i = 0; i < 4; i++){ const g = _defend.spawn('jelly', 60 + i * 30, 180); if(g) g.hp = 1; }
  _defend.step(_defend.FIX); o.안내 = S.ban && S.ban.k === 'tip' && S.ban.t;
  return o; });
await D(()=>{ const S = _defend.S; S.fire = 4; _defend.P.inv = 9; for(let i = 0; i < 20; i++) _defend.step(_defend.FIX); }); await t.sleep(100);
await fshot('crown');
const cr2 = await D(()=>{ const S = _defend.S, c0 = S.crs, s0 = S.shells; window._dfreeze = 1; _defend.killAll(); let pu = 0, sh = 0; for(const d of _defend.drops) if(d.on){ if(d.ty === 2) pu++; else sh++; } return { 왕관잡음:S.crs - c0, 아이템:pu, 조개:sh }; });
console.log('왕관 적', JSON.stringify({ cr, cr2 })); ok(cr.배 === 3 && cr.표시 === 1 && /왕관 적/.test(cr.안내 || '') && cr2.왕관잡음 === 1 && cr2.아이템 >= 1 && cr2.조개 >= 3, '왕관 적');
// 연속 처치 외침 · 마지막 한 마리 슬로 모션 — killAll 은 한꺼번이라 하나씩 잡아 본다
const ks = await D(()=>{ const S = _defend.S; S.qi = S.q.length; S.call = null; S.ks = 0; S.kst = 9; S.slow = 0; const out = [];
  const fs = []; for(let i = 0; i < 6; i++){ const g = _defend.spawn('jelly', 40 + i * 30, 200); g.hp = 1; fs.push(g); }
  for(const g of fs){ _defend.P.x = g.x; _defend.P.y = g.y + 20; _defend.press('atk', 1); for(let i = 0; i < 20 && g.on; i++) _defend.step(_defend.FIX); _defend.press('atk', 0); out.push(S.ks); }
  return { ks:out.join(), 외침:S.call && S.call.s, 슬로:+S.slow.toFixed(2), 단계:S.ph }; });
console.log('연속 처치', JSON.stringify(ks)); ok(/연속 처치 5/.test(ks.외침 || '') && ks.슬로 > 0 && ks.단계 === 'clear', '연속 처치·슬로 모션');
await D(()=>{ window._dfreeze = 0; });
// ✨ 시너지 — 짝 카드엔 표시, 고르면 「시너지!」, 3타째가 토네이도를 남긴다
await D(()=>{ const S = _defend.S; S.up.fin = 1; for(let i = 0; i < 300 && !S.pick; i++) _defend.step(_defend.FIX); S.pick = ['spd', 'atk', 'boot']; S.pickT = 'wave'; }); await t.sleep(500);
const sy = await D(()=>({ 표시:[...document.querySelectorAll('#d-bar [data-pick]')].map(b=>b.classList.contains('syn')).join(), 글:document.querySelector('#d-bar .d-card.syn em')?.textContent, 머리:document.querySelector('#d-bar .d-sh')?.textContent }));
await fshot('syncard');
await D(()=>document.querySelector('#d-bar [data-pick="0"]').click()); await t.sleep(150);
const sy2 = await D(()=>{ const S = _defend.S, P = _defend.P, o = { syn:S.syn.tor, 외침:S.call && S.call.s }; window._dfreeze = 1; _defend.killAll(); S.qi = S.q.length; P.x = 120; P.y = 220; P.cwin = 0; P.acd = 0; P.sw = null; P.stun = 0;
  for(let i = 0; i < 5; i++){ const g = _defend.spawn(i % 2 ? 'crab' : 'jelly', 100 + i * 10, 200 - i * 3); g.hp = 900; }
  _defend.BTN.atk = 1; for(let i = 0; i < 200 && !(S.tor.t > 0); i++) _defend.step(_defend.FIX); _defend.BTN.atk = 0; o.토네이도 = S.tor.t > 0; for(let i = 0; i < 12; i++) _defend.step(_defend.FIX); return o; }); await t.sleep(100);
await fshot('tornado');
console.log('시너지', JSON.stringify({ sy, sy2 })); ok(sy.표시 === 'true,false,false' && /토네이도/.test(sy.글 || '') && /시너지/.test(sy.머리 || '') && sy2.syn === 1 && /시너지! 🌪️ 토네이도/.test(sy2.외침 || '') && sy2.토네이도, '시너지 토네이도');
// 🐬 돌고래 해일 — 필살기가 두 번(두 번째는 절반)
const ts = await D(()=>{ const S = _defend.S; _defend.killAll(); S.syn.tsu = 1; const g = _defend.spawn('elite', 120, 160); g.hp = g.max = 5000; const h0 = g.hp; S.sp = 100; _defend.special(); let n2 = 0; for(let i = 0; i < 200; i++){ _defend.step(_defend.FIX); if(S.big2) n2 = 1; } return { 두번:n2, 깎임:Math.round(h0 - g.hp) }; });
console.log('돌고래 해일', JSON.stringify(ts)); ok(ts.두번 === 1 && ts.깎임 > 0, '돌고래 해일');
await D(()=>{ window._dfreeze = 0; _defend.killAll(true); defendClose(); });
// 무한 파도 끝 — 결과(웨이브·점수·왕관), 기록은 이 기기에, 보상은 한 번·해변 기록/별은 그대로
const ie = await D(()=>{ let n = 0, args = null; const f0 = window.playDefendDone; window.playDefendDone = (...a) => { n++; args = a; return f0(...a); };
  const df0 = JSON.stringify({ st:ME.profile.play.df.st, best:ME.profile.play.df.best, sb:ME.profile.play.df.sb, clears:ME.profile.play.df.clears });
  defendOpen(); _defend.start(3, 21, {}); _defend.skip(7); _defend.S.score = 12345; _defend.lose(); for(let i = 0; i < 20; i++) _defend.step(_defend.FIX); _defend.lose();
  const o = { n, args:args && args.slice(0, 5).join(), inf:args && JSON.stringify(args[5]), 도감:JSON.stringify(ME.profile.play.df.inf), 결과:document.querySelector('#d-ov .go-t')?.textContent, 점수:document.querySelector('#d-ov .d-score')?.textContent, 통계:document.querySelector('#d-ov .go-st')?.textContent.replace(/\s+/g,' '), 기록:localStorage.getItem('lineup.share.dinf'),
    df:JSON.stringify({ st:ME.profile.play.df.st, best:ME.profile.play.df.best, sb:ME.profile.play.df.sb, clears:ME.profile.play.df.clears }) === df0 };
  window.playDefendDone = f0; return o; });
await fshot('infend');
console.log('무한 끝', JSON.stringify(ie)); ok(ie.n === 1 && /^5,false,\d+,0,0$/.test(ie.args || '') && +ie.args.split(',')[2] <= 40 && /웨이브 7까지/.test(ie.결과 || '') && /12,345/.test(ie.점수 || '') && /왕관/.test(ie.통계 || '') && /"s":12345/.test(ie.기록 || '') && /"w":7/.test(ie.기록 || '') && ie.df, '무한 파도 결과·보상');
ok(ie.inf === '{"s":12345,"w":7}' && ie.도감 === '{"s":12345,"w":7}', '무한 파도 최고 기록이 도감(df.inf)에 저장');
const ie2 = await D(()=>{ document.getElementById('d-go').click(); const a = _defend.S.inf; _defend.S.score = 50; _defend.lose(); const r = { 다시:a, 기록:localStorage.getItem('lineup.share.dinf'), 최고:document.querySelector('#d-ov .d-score em')?.textContent }; document.getElementById('d-sel').click(); r.메뉴 = document.getElementById('d-inf')?.textContent.replace(/\s+/g,' '); defendClose(); return r; });
console.log('무한 다시', JSON.stringify(ie2)); ok(ie2.다시 === 1 && /"s":12345/.test(ie2.기록) && /최고 12,345/.test(ie2.최고 || '') && /최고 웨이브 7/.test(ie2.메뉴 || ''), '무한 파도 기록 유지');
// 봇 — 무한 파도는 언젠가 끝난다
const ib = await D(()=>_defend.run(3, 9, false, {}, 'casual', 'shark'));
console.log('봇(무한·가볍게)', JSON.stringify(ib)); ok(ib.res === 'lose' && ib.w >= 5, '무한 파도 봇');
// 이상한 기록값
const wv2 = await D(()=>{ localStorage.setItem('lineup.share.dinf', '{"s":"<img>","w":1e99}'); defendOpen(); const r = { 글:document.getElementById('d-inf')?.textContent, 태그:!!document.querySelector('#d-ov img') }; defendClose(); localStorage.setItem('lineup.share.dinf', '{"s":12345,"w":7}'); return r; });
console.log('이상한 기록', JSON.stringify(wv2)); ok(wv2.글 && !wv2.태그 && /최고 웨이브 999/.test(wv2.글), '이상한 기록값');
// 무한 파도 기록 — 도감에 저장·합치기(칸마다 큰 쪽, 남의 값은 가둔다)·이 기기 기록 옮기기·놀이 카드 표시
const inf = await D(async ()=>{ const d = ME.profile.play.df, r = {};
  playMerge({ df:{ inf:{ s:'<img src=x onerror=alert(1)>', w:1e99 } } }); r.이상 = JSON.stringify(d.inf);
  playMerge({ df:{ inf:{ s:5e7, w:-3 } } }); r.큰점수 = JSON.stringify(d.inf);
  playMerge({ df:{ inf:[1, 2] } }); playMerge({ df:{ inf:'x' } }); r.배열 = JSON.stringify(d.inf);
  d.inf = { s:100, w:3 }; playMerge({ df:{ inf:{ s:50, w:9 } } }); r.칸마다 = JSON.stringify(d.inf);
  setTab('play'); renderHub && renderHub(); await new Promise(z=>setTimeout(z, 100));
  const c = document.querySelector('[data-hub="defend"]'); r.카드 = c && c.textContent.replace(/\s+/g, ' '); r.태그 = !!(c && c.querySelector('img'));
  delete d.inf; localStorage.setItem('lineup.share.dinf', '{"s":777,"w":12}'); _dinfMv = false; playTick(); r.옮김 = JSON.stringify(d.inf);
  _dinfMv = false; const p0 = JSON.stringify(d); playTick(); r.두번째 = JSON.stringify(d) === p0;
  defendOpen(); r.메뉴 = document.getElementById('d-inf')?.textContent.replace(/\s+/g, ' '); defendClose();
  localStorage.removeItem('lineup.share.dinf'); r.기기없음 = JSON.stringify(_defend.infBest());
  return r; });
await t.sleep(1600);
const infPost = t.posts.filter(([u, b])=>u.startsWith('surfers') && b && b.profile && b.profile.play && b.profile.play.df && b.profile.play.df.inf).pop();
console.log('무한 기록 도감', JSON.stringify(inf), '| 올림', infPost && JSON.stringify(infPost[1].profile.play.df.inf));
ok(inf.이상 === '{"s":12345,"w":999}' && inf.큰점수 === '{"s":9999999,"w":999}' && inf.배열 === inf.큰점수, '무한 기록 합치기 — 이상한 값 가두기');
ok(inf.칸마다 === '{"s":100,"w":9}', '무한 기록 합치기 — 칸마다 큰 쪽');
ok(/🌀 무한 웨이브 9/.test(inf.카드 || '') && !inf.태그, '놀이 카드에 무한 웨이브');
ok(inf.옮김 === '{"s":777,"w":12}' && inf.두번째, '이 기기 기록을 도감으로 한 번 옮김');
ok(/최고 웨이브 12/.test(inf.메뉴 || '') && inf.기기없음 === '{"s":777,"w":12}', '기기 기록이 없어도 도감 기록으로 메뉴 표시');
ok(infPost && JSON.stringify(infPost[1].profile.play.df.inf) === '{"s":777,"w":12}', '옮긴 기록을 서버에 올림');
// 폭마다 — 열린 무한 파도 줄이 있어도 해변 고르기·무한 결과가 스크롤 없이 보이고 버튼이 화면 안
for(const [w, h] of [[390, 844], [375, 667], [360, 740], [320, 640]]){
  await t.p.setViewport({ width:w, height:h, deviceScaleFactor:2, isMobile:true, hasTouch:true }); await t.sleep(150);
  const L = await D(()=>{ const ov = document.getElementById('d-ov'), fits = () => ov.scrollHeight <= ov.clientHeight + 2, r = id => document.getElementById(id).getBoundingClientRect();
    defendOpen(); const o = { 고르기:fits(), 무한줄:!!document.getElementById('d-inf') && r('d-inf').right <= innerWidth }; _defend.start(3, 5, {}); _defend.skip(4); _defend.lose(); o.결과 = fits(); o.닫기 = r('d-close').bottom <= ov.getBoundingClientRect().bottom + 1; o.넘침 = document.documentElement.scrollWidth > innerWidth; defendClose(); return o; });
  console.log(`무한 ${w}×${h}`, JSON.stringify(L)); ok(L.고르기 && L.무한줄 && L.결과 && L.닫기 && !L.넘침, `무한 ${w} 배치`);
  if(w === 360){ await D(()=>defendOpen()); await t.sleep(150); await fshot('menu360'); await D(()=>defendClose()); }
}
await t.p.setViewport({ width:390, height:844, deviceScaleFactor:2, isMobile:true, hasTouch:true });
console.log('bad', bad); console.log('errs', t.errs);
await t.b.close(); process.exit(bad.length || t.errs.length ? 1 : 0);
