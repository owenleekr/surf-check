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
console.log('bad', bad); console.log('errs', t.errs);
await t.b.close(); process.exit(bad.length || t.errs.length ? 1 : 0);
