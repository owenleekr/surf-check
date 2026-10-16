/* 전설의 보드 원정(마을 탐험 RPG) — 오프닝 → 마을(장 제목·길잡이) → 땅 눌러 걷기·방향키 → ❗ 주민과 대화(타자·고르기) → 부탁 받기 →
   알림판 눌러 해변의 무리로 → 편성(전투는 자동 안내) → 전투 튜토리얼(AUTO 끄기 → 초상 눌러 필살기) → 승리 → 보고 → 부탁 완료(sg·별·조개) →
   모으기(물건 셋 줍기) → 전하기(다른 주민) → 보스 → 조각·합류 → 지도(다음 마을로) → 다음 마을.
   순찰 전투(진행 그대로·경험치), 패배 카드, 편성(눌러 옮기기·끌어 놓기)·⭐ 성급 강화, 내 정보(장비 강화 🐚), 방치 보상 8시간 상한,
   뒤로가기(덮개부터), 옛 저장 옮기기(ch·sg), 합치기(qp·eq 가두기), 11마을 봇 진행(균형), 마지막 보스 → 전설 */
import { open } from './mock.mjs';
import fs from 'fs';
const OUT = process.env.QSHOT || '/tmp';
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] }, { id:'u4', name:'이성현', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:2500 });
const R = {}, Q = (f, ...a) => t.S(f, ...a);
const snap = async n => fs.writeFileSync(`${OUT}/qrpg-${n}.png`, await t.p.screenshot());
const untilOv = async () => { for(let n = 0; n < 50 && await Q(()=>document.getElementById('q-ov').hidden); n++) await t.sleep(150); };
const walkTo = async id => { await Q(i=>_quest.goTo(_quest.WK.ents.find(e=>e.id === i)), id); await untilOv(); };
const say = () => Q(()=>({ ov:document.getElementById('q-ov').className, n:document.querySelector('.qt-n')?.textContent, ch:[...document.querySelectorAll('[data-tc]')].map(b=>b.textContent) }));
const skipTalk = async () => { await Q(()=>document.getElementById('q-sk')?.click()); await t.sleep(250); };
const accept = async () => { await skipTalk(); await Q(()=>document.querySelector('[data-tc="0"]').click()); await t.sleep(300); };
await Q(()=>{ while(!document.getElementById('pop').hidden) popClose(); setTab('play'); }); await t.sleep(300);
R.카드 = await Q(()=>document.querySelector('[data-hub="quest"]')?.textContent.replace(/\s+/g,' ').trim());
await Q(()=>document.querySelector('[data-hub="quest"]').click()); await t.sleep(1500);
R.오프닝 = await Q(()=>document.getElementById('q-ov').classList.contains('qv-cine'));
await Q(()=>document.getElementById('qc-sk').click()); await t.sleep(500);
R.장제목 = await Q(()=>document.querySelector('.qtt b')?.textContent);
await Q(()=>document.getElementById('q-ov').click()); await t.sleep(500);
R.마을 = await Q(()=>({ 걷기:document.getElementById('quest').classList.contains('qw'), 마을:_quest.TV, 사람:_quest.WK.ents.filter(e=>e.t === 'npc').map(e=>e.id).join(','), 보스잠김:_quest.WK.ents.find(e=>e.t === 'boss')?.lock,
  알림판:document.getElementById('q-trk')?.textContent, 길잡이:!document.getElementById('q-tut')?.hidden && document.getElementById('q-tut')?.textContent, 할머니표시:_quest.WK.ents.find(e=>e.id === 'a').mk.textContent,
  메뉴:document.querySelectorAll('#q-bar .btn').length, 놀이없음:!_quest.WK.ents.some(e=>e.t === 'fish' || e.t === 'chest'), 넘침:document.documentElement.scrollWidth > innerWidth }));
// 땅 누르기 → 걸어간다 / 방향키
const x0 = await Q(()=>_quest.WK.p.x);
const gp = await Q(()=>{ const r = document.getElementById('q-wv').getBoundingClientRect(); return [r.x + r.width * .8, r.y + r.height * .85]; });
await t.p.mouse.click(gp[0], gp[1]); await t.sleep(700);
const x1 = await Q(()=>_quest.WK.p.x);
await t.p.keyboard.down('ArrowLeft'); await t.sleep(400); await t.p.keyboard.up('ArrowLeft'); await t.sleep(100);
R.걷기 = { 눌러서:Math.round(x1 - x0), 방향키:Math.round(await Q(()=>_quest.WK.p.x) - x1) };
await snap('1-village');
// ❗ 해녀 할머니 — 알림판을 누르면 걸어가서 대화(타자) → 건너뛰면 마지막 줄의 고르기
await Q(()=>document.getElementById('q-trk').click()); await untilOv();
R.대화1 = await say();
R.타자 = await Q(()=>document.getElementById('q-tx')?.textContent.length < document.querySelector('.qt-sr')?.textContent.length);
await skipTalk(); await t.sleep(700);
R.고르기 = await say();
await snap('2-dialogue');
await Q(()=>document.querySelector('[data-tc="0"]').click()); await t.sleep(400);
R.수락 = await Q(()=>({ qp:JSON.stringify(ME.profile.play.qb.qp), 알림판:document.getElementById('q-trk').textContent, 무리:!!_quest.WK.ents.find(e=>e.id === 'q'), 길잡이:document.getElementById('q-tut')?.textContent }));
// 알림판 → 해변의 해파리 무리 → 편성(전투는 자동 안내) → 첫 전투 튜토리얼
await Q(()=>document.getElementById('q-trk').click()); for(let n = 0; n < 50 && !(await Q(()=>!!_quest.S)); n++) await t.sleep(150);
R.편성 = await Q(()=>({ 종류:_quest.S?.kind, 안내:document.querySelector('.qtm-bt')?.textContent, 칸:document.querySelectorAll('[data-sl]').length }));
// 눌러 옮기기 — 끼룩 카드 → 앞줄 2번 칸 / 끌어 놓기 — 앞줄 2번(끼룩)을 뒷줄 2번 칸으로
await Q(()=>document.querySelector('.qtm-l [data-hero="gull"]').click()); await t.sleep(80);
await Q(()=>document.querySelector('[data-sl="1"]').click()); await t.sleep(80);
R.탭이동 = await Q(()=>_quest.fmGet().join(','));
const rc = await Q(()=>{ const a = document.querySelector('[data-sl="1"]').getBoundingClientRect(), b = document.querySelector('[data-sl="3"]').getBoundingClientRect(); return [a.x + a.width / 2, a.y + a.height / 2, b.x + b.width / 2, b.y + b.height / 2]; });
await t.p.mouse.move(rc[0], rc[1]); await t.p.mouse.down(); await t.p.mouse.move(rc[0] + 20, rc[1] + 10, { steps:4 }); await t.p.mouse.move(rc[2], rc[3], { steps:6 }); await t.p.mouse.up(); await t.sleep(400);
R.끌기 = await Q(()=>_quest.fmGet().join(','));
await Q(()=>{ localStorage.removeItem('lineup.share.qtut'); _quest.auto = true; document.getElementById('q-fight').click(); }); await t.sleep(2600);
R.튜토1 = await Q(()=>({ 단계:_quest.S.tut, 보임:!document.getElementById('q-tut')?.hidden, 전투화면:!document.getElementById('quest').classList.contains('qw') }));
await Q(()=>document.getElementById('q-auto').click()); await t.sleep(150);
R.튜토2 = await Q(()=>({ 단계:_quest.S.tut, 준비:document.querySelectorAll('.q-pt.rdy').length }));
await Q(()=>document.querySelector('.q-pt.rdy').click()); await t.sleep(160);
R.필살기 = await Q(()=>({ 썼다:_quest.S.ults, 튜토:_quest.S.tut, 저장:localStorage.getItem('lineup.share.qtut'), 컷인:!!document.querySelector('.q-cut') }));
await snap('3-battle');
await Q(()=>document.getElementById('q-auto').click());
R.전투 = await Q(()=>{ const q = _quest, s = q.S; let n = 0; while(!s.res && n++ < 60 * 200) q.step(q.FIX); return { res:s.res, stars:s.stars }; });
await Q(()=>_quest.skip()); await t.sleep(200);
R.승리카드 = await Q(()=>({ 글:document.querySelector('#q-ov .go-d')?.textContent, 진행:ME.profile.play.qb.sg || 0, qp:JSON.stringify(ME.profile.play.qb.qp) }));
await Q(()=>document.getElementById('q-home').click()); await t.sleep(400);
R.보고전 = await Q(()=>({ 표시:_quest.WK.ents.find(e=>e.id === 'a').mk.textContent, 알림판:document.getElementById('q-trk').textContent, 길잡이:document.getElementById('q-tut')?.textContent }));
const sh0 = await Q(()=>shellBal());
await walkTo('a'); await skipTalk(); await skipTalk(); await t.sleep(100);
R.완료 = await Q(()=>({ 전투력:document.querySelector('#q-ov .q-pw')?.textContent, 카드:document.querySelector('#q-ov .go-t')?.textContent, sg:ME.profile.play.qb.sg, 별:ME.profile.play.qb.st[0], 다음:document.querySelector('#q-ov .go-b')?.textContent }));
R.완료.조개 = (await Q(()=>shellBal())) - sh0;
await Q(()=>document.getElementById('q-ok').click()); await t.sleep(300);
// ② 모으기 — 받기 → 물건 셋 줍기 → 보고
await walkTo('a'); await accept();
R.모으기 = { 물건:await Q(()=>_quest.WK.ents.filter(e=>e.t === 'item').length) };
for(let i = 0; i < 3; i++){ await Q(()=>_quest.goTo(_quest.WK.ents.find(e=>e.t === 'item'))); for(let n = 0; n < 60 && await Q(k=>_quest.qpOf().n === k, i); n++) await t.sleep(150); }
R.모으기.모음 = await Q(()=>_quest.qpOf().n); R.모으기.표시 = await Q(()=>_quest.WK.ents.find(e=>e.id === 'a').mk.textContent);
await walkTo('a'); await skipTalk(); await skipTalk();
R.모으기.sg = await Q(()=>ME.profile.play.qb.sg);
await Q(()=>document.getElementById('q-ok').click()); await t.sleep(300);
// ③ 전하기 — 할머니가 부탁 → 어부 아저씨(❓)에게
await walkTo('a'); await accept();
R.전하기 = { 받는이:await Q(()=>_quest.WK.ents.find(e=>e.id === 'c').mk.textContent) };
await walkTo('c'); R.전하기.대사 = (await say()).n; await skipTalk(); await skipTalk();
R.전하기.sg = await Q(()=>ME.profile.play.qb.sg);
await Q(()=>document.getElementById('q-ok').click()); await t.sleep(300);
// 보스 — 부탁 셋을 마치면 잠금이 풀린다 → 대화 → 편성 → (이긴 것으로) 뒷이야기 → 조각·합류 카드
R.보스 = await Q(()=>({ 잠김:_quest.WK.ents.find(e=>e.t === 'boss').lock, 알림판:document.getElementById('q-trk').textContent }));
await walkTo('boss'); R.보스.대화 = (await say()).ov; await skipTalk(); await t.sleep(200);
R.보스.편성 = await Q(()=>_quest.S?.kind);
// 패배 — 진행 그대로, 패배 카드에서 편성·다시
await Q(()=>{ _quest.force(3, false); _quest.skip(); }); await t.sleep(100);
R.패배 = await Q(()=>({ 진행:ME.profile.play.qb.sg, 카드:document.querySelector('#q-ov .go-t')?.textContent, 편성:!!document.getElementById('q-tm2'), 마을:!!document.getElementById('q-home') }));
await Q(()=>{ _quest.force(3, true); _quest.skip(); }); await t.sleep(200);
R.보스.보상 = await Q(()=>({ 카드:document.querySelector('#q-ov .go-t')?.textContent, sg:ME.profile.play.qb.sg, 조각:ME.profile.play.qb.ch, 할머니:_quest.fmGet().includes('haenyeo'), 다음:document.getElementById('q-next')?.textContent }));
await Q(()=>document.getElementById('q-next').click()); await t.sleep(400);
await Q(()=>{ while(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(100);
R.지도 = await Q(()=>({ 마을:document.querySelectorAll('.qm-n').length, 깬마을:document.querySelectorAll('.qm-n.done').length, 열림:document.querySelectorAll('.qm-n:not(:disabled)').length, 가기:document.getElementById('q-go')?.textContent.trim(), 넘침:document.documentElement.scrollWidth > innerWidth }));
await snap('5-map');
await Q(()=>document.getElementById('q-go').click()); await t.sleep(500);
R.다음마을 = await Q(()=>({ 마을:_quest.TV, 제목:document.querySelector('.qtt b')?.textContent }));
await Q(()=>document.getElementById('q-ov').click()); await t.sleep(300);
R.다음마을.사람 = await Q(()=>_quest.WK.ents.filter(e=>e.t === 'npc').map(e=>e.n).join(','));
R.다음마을.동료 = await Q(()=>_quest.WK.fw.length);
// 순찰 — 깬 마을(아야진)로 돌아가 순찰 몬스터와 한 판(진행 그대로, 경험치), 이긴 무리는 잠시 사라진다
await Q(()=>_quest.town(0)); await t.sleep(300);
R.순찰 = await Q(()=>({ 무리:_quest.WK.ents.filter(e=>e.t === 'mob').map(e=>e.id).join(','), 할머니없음:!_quest.WK.ents.find(e=>e.id === 'a'), 보스없음:!_quest.WK.ents.find(e=>e.t === 'boss') }));
const hx0 = await Q(()=>ME.profile.play.qb.hx.me);
await Q(()=>_quest.goTo(_quest.WK.ents.find(e=>e.id === 'p1'))); for(let n = 0; n < 50 && !(await Q(()=>!!_quest.S)); n++) await t.sleep(150);
R.순찰.r = await Q(()=>{ const q = _quest; document.getElementById('q-fight').click(); const s = q.S; let n = 0; while(!s.res && n++ < 60 * 200) q.step(q.FIX); q.skip(); return { 종류:s.kind, res:s.res, sg:ME.profile.play.qb.sg, 한번더:!!document.getElementById('q-again') }; });
R.순찰.경험치 = (await Q(()=>ME.profile.play.qb.hx.me)) - hx0;
await Q(()=>document.getElementById('q-home').click()); await t.sleep(300);
R.순찰.다시없음 = await Q(()=>!_quest.WK.ents.find(e=>e.id === 'p1'));
// 내 정보 — 장비 강화(🐚), 편성 화면에서 ⭐ 성급 강화
await Q(()=>{ ME.profile.play.shells = (ME.profile.play.shells || 0) + 100; document.getElementById('q-bbag').click(); }); await t.sleep(300);
R.가방 = await Q(()=>({ 레벨:document.querySelector('.qb-me small')?.textContent, 장비:document.querySelectorAll('[data-eq]').length, 동료:document.querySelectorAll('.qb-tm span').length, 선물:document.querySelectorAll('.qb-it span').length }));
await snap('4-bag');
R.강화 = await Q(()=>{ const a0 = _quest.heroStat('me').atk, b0 = shellBal(); document.querySelector('[data-eq="b"]').click(); return { 보드:_quest.eqOf('b'), 조개:b0 - shellBal(), 공격:_quest.heroStat('me').atk > a0 }; });
R.성급 = await Q(()=>{ const b0 = shellBal(); document.getElementById('q-btm').click(); document.querySelector('.qtm-l [data-hero="me"]').click(); document.getElementById('q-star').click(); return { 성급:_quest.heroSt('me'), 조개:b0 - shellBal(), 닫기:document.getElementById('q-tmx')?.textContent }; });
await Q(()=>document.getElementById('q-tmx').click()); await t.sleep(150);
R.성급.가방으로 = await Q(()=>document.getElementById('q-ov').classList.contains('qv-bag'));
// 뒤로가기 — 덮개(가방·지도)부터 닫고, 걷기 화면에서 한 번 더면 원정을 닫는다
await Q(()=>history.back()); await t.sleep(400);
R.뒤로 = await Q(()=>({ 덮개:document.getElementById('q-ov').hidden, 원정:!document.getElementById('quest').hidden }));
await Q(()=>document.getElementById('q-bmap').click()); await t.sleep(300);
await Q(()=>history.back()); await t.sleep(400);
R.뒤로.지도닫힘 = await Q(()=>document.getElementById('q-ov').hidden && !document.getElementById('quest').hidden);
await Q(()=>history.back()); await t.sleep(400);
R.뒤로.원정닫힘 = await Q(()=>document.getElementById('quest').hidden);
// 방치 보상 — 20시간 떠나 있어도 8시간치
R.방치 = await Q(()=>{ const q = ME.profile.play.qb; q.it = Date.now() - 20 * 36e5; const b0 = shellBal(), r = playQuestIdle(), again = playQuestIdle(); return { ...r, 늘어남:shellBal() - b0, 다시:again.n, 상한:r.n === 8 * r.rate }; });
// 옛 저장 — ch 5(스테이지 시대) → 여섯 번째 마을 첫 부탁, sg 6 → 천진 세 번째 부탁(민박집 사장님)
R.옮기기 = await Q(()=>{ const p = ME.profile.play; p.qb = { ch:5, best:4, clears:0 }; _quest.migrate(); const q = p.qb; return { sg:q.sg, 별1:q.st.filter(v=>v === 1).length, 레벨:_quest.heroLv('me'), 꽃게:_quest.fmGet().includes('crab') }; });
await Q(()=>questOpen()); await t.sleep(600);
R.옮기기.마을 = await Q(()=>({ 마을:_quest.TV, 부탁:_quest.vInfo().q?.t, 표시:_quest.WK.ents.find(e=>e.id === 'a')?.mk.textContent }));
await Q(()=>{ questClose(); const p = ME.profile.play; p.qb = { sg:6 }; _quest.migrate(); questOpen(); }); await t.sleep(600);
R.옮기기.중간 = await Q(()=>({ 마을:_quest.TV, 부탁:_quest.vInfo().q?.t, 주는이:_quest.vInfo().q?.by, 표시:_quest.WK.ents.find(e=>e.id === 'c')?.mk.textContent }));
await Q(()=>questClose());
// 합치기 — 남의 기기 값은 숫자로 가두고 모르는 영웅·장비 키는 버린다
R.합치기 = await Q(()=>{ ME.profile.play.qb = { sg:6, qp:{ g:6, a:1, n:1, w:0 } }; playMerge({ qb:{ sg:'99', st:[3, 'x', 9e9, 2], hx:{ me:5e9, evil:5 }, hs:{ gull:'<b>', crab:4 }, fm:['me', '<img>', 'crab'], it:'1e99', eq:{ b:'7', w:99, z:3 }, qp:{ g:6, a:'1', n:'<x>', w:2 } } }); const q = ME.profile.play.qb;
  return { sg:q.sg, st:q.st.slice(0, 4).join(','), hx:q.hx.me, evil:'evil' in q.hx, eq:JSON.stringify(q.eq), qp:JSON.stringify(q.qp), it:q.it <= 1e13 }; });
// 균형 — 새 프로필로 11마을을 봇이(물리치기·보스는 실제 전투, 모으기·전하기는 완료 처리). 지면 순찰 두 판 + 조개로 성급·장비
R.균형 = await Q(()=>{ const q = _quest, p = ME.profile.play, _pop = window.popNext; window.popNext = ()=>{}; localStorage.setItem('lineup.share.qtut', '1'); q.auto = true;
  p.qb = {}; p.shells = 0; p.spent = 0; q.migrate(); const tries = [], tt = []; let stuck = -1;
  const buy = ()=>{ const fm = q.fmGet().filter(Boolean).sort((a, b)=>q.heroSt(a) - q.heroSt(b)); for(const k of fm) if(q.heroSt(k) < 5 && shellBal() >= [0, 40, 90, 180, 320][q.heroSt(k)]){ playQuestStar(k); return; } for(const k of ['b', 'w']) if(q.eqOf(k) < 10 && shellBal() >= q.EQC[q.eqOf(k)]) q.eqBuy(k); };
  const team = ()=>q.fmGet().filter(Boolean);
  for(let v = 0; v < q.N && stuck < 0; v++) for(const s of [0, 1, 2, 3]){ const g = v * 4 + s;
    if(s === 1 || s === 2){ playQuestDone(v, false, 11 + v, false, { g, won:true, stars:3, xp:q.qXp(g), team:team() }); continue; }
    let a = 0, r; do{ r = q.sim(g); a++; tt.push(r.t); if(r.res !== 'win'){ q.sim(v * 4 + 1, 0, 'patrol'); q.sim(v * 4 + 1, 0, 'patrol'); } buy(); } while(r.res !== 'win' && a < 15);
    tries.push(a); if(r.res !== 'win'){ stuck = g; break; }
    if(s === 0) playQuestDone(v, false, 11 + v, false, { g, won:true, stars:r.stars, xp:q.qXp(g), team:team() }); }
  window.popNext = _pop; const v = []; for(let i = 0; i < tries.length; i += 2) v.push(tries.slice(i, i + 2).join(''));
  return { '마을별시도(물리치기·보스)':v.join(' '), 막힘:stuck, 판평균초:Math.round(tt.reduce((a, b)=>a + b, 0) / tt.length), 동료:team().map(k=>k + '★' + q.heroSt(k) + 'Lv' + q.heroLv(k)).join(' '), 장비:JSON.stringify(p.qb.eq), sg:p.qb.sg, 전설:p.qb.legend }; });
// 마지막 보스 → 엔딩 → 전설 → 마을로
R.전설 = await Q(()=>{ const q = _quest, p = ME.profile.play; p.qb = { sg:43, ch:10 }; q.migrate(); questOpen(); const I = q.vInfo(); q.force(43, true); q.skip(); return { 마을:q.TV, 보스차례:I.s, 전설:p.qb.legend, 잠금:lockOf('boardc', 'legend'), 진행:p.qb.sg, 조각:p.qb.ch, 카드:document.querySelector('#q-ov .go-t')?.textContent }; });
await Q(()=>document.getElementById('q-next').click()); await t.sleep(300);
R.전설후 = await Q(()=>({ 마을:_quest.TV, 알림판:document.getElementById('q-trk')?.textContent, 순찰:_quest.WK.ents.filter(e=>e.t === 'mob').length }));
await Q(()=>{ while(!document.getElementById('pop').hidden) popClose(); document.getElementById('q-bcdx').click(); }); await t.sleep(200);
R.기록장 = await Q(()=>({ 가기:document.querySelectorAll('[data-rp]').length, 엔딩:!!document.getElementById('q-end') }));
await Q(()=>_quest.town(10)); await Q(()=>document.getElementById('q-x').click()); await t.sleep(200);
R.닫기 = await Q(()=>({ 숨김:document.getElementById('quest').hidden, 카드:document.querySelector('[data-hub="quest"]')?.textContent.replace(/\s+/g,' ').trim() }));
// 견고함 — 새 프로필로 첫 마을부터: 보고 두 번 눌러도 부탁 하나 · 물건은 한 번만 · 보스 앞 뒤로가기 · 전투 중 뒤로가기·닫기 · 꽉 찬 팀의 새 동료 · 새로고침 · 회전
const fresh = async (sg, fm) => { await Q((g, f)=>{ questClose(); const p = ME.profile.play; p.qb = { sg:g }; if(f) p.qb.fm = f; _quest.migrate(); questOpen(); document.getElementById('q-ov').hidden = true; }, sg, fm || null); await t.sleep(400); };
await fresh(0);
R.견고 = await Q(()=>{ const q = _quest, P = ME.profile.play.qb; P.qp = { g:0, a:1, n:0, w:3 }; q.npcTalk('a'); const d = q.T.done; d(); d(); const sg1 = P.sg;
  q.npcTalk('a'); q.T.ch[0][1]();                                                  // ② 모으기 받기
  const it = id => q.WK.ents.find(e=>e.id === id), e2 = it('i2'); q.interact(e2); q.interact(e2); const n1 = q.qpOf().n, ids1 = q.WK.ents.filter(e=>e.t === 'item').map(e=>e.id).join(',');
  const e0 = it('i0'); q.WK.go = e0; q.interact(e0); q.interact(e0); const ids2 = q.WK.ents.filter(e=>e.t === 'item').map(e=>e.id).join(',');
  return { 보고두번:sg1, 한번만:n1, 남은물건:ids1, 두개:q.qpOf().n, 남은물건2:ids2, 가던대상:q.WK.go }; });
await fresh(3);
R.견고.보스뒤로 = await Q(()=>{ const q = _quest; q.interact(q.WK.ents.find(e=>e.t === 'boss')); const talk = !!q.T; q.qBack(); return { 대화:talk, 전투없음:!q.S, 덮개닫힘:document.getElementById('q-ov').hidden, 마을:document.getElementById('quest').classList.contains('qw') }; });
R.견고.전투뒤로 = await Q(()=>{ const q = _quest; q.fight('patrol', 1); q.begin(); for(let i = 0; i < 60; i++) q.step(q.FIX); const b = q.qBack(); return { 처리:b, 전투없음:!q.S, 열림:!document.getElementById('quest').hidden, 마을:document.getElementById('quest').classList.contains('qw') }; });
R.견고.숨김 = await Q(()=>{ const q = _quest; q.fight('patrol', 1); q.begin(); Object.defineProperty(document, 'hidden', { value:true, configurable:true }); document.dispatchEvent(new Event('visibilitychange')); const pz = q.S.paused;
  delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); return { 멈춤:pz, 다시:!q.S.paused }; });
await Q(()=>{ questClose(); questOpen(); document.getElementById('q-ov').hidden = true; }); await t.sleep(400);
R.견고.다시열기 = await Q(()=>({ 전투없음:!_quest.S, 마을:_quest.TV, 걷기:document.getElementById('quest').classList.contains('qw'), 보스:!!_quest.WK.ents.find(e=>e.t === 'boss' && !e.lock) }));
await t.p.setViewport({ width:844, height:390, deviceScaleFactor:1, isMobile:true, hasTouch:true }); await t.sleep(500);
R.견고.회전 = await Q(()=>({ 폭:_quest.WK.G.w, 사람:_quest.WK.ents.filter(e=>e.el && e.el.isConnected).length, 넘침:document.documentElement.scrollWidth > innerWidth }));
await t.p.setViewport({ width:390, height:844, deviceScaleFactor:2, isMobile:true, hasTouch:true }); await t.sleep(500);
// 꽉 찬 팀(4명)으로 낙산 보스를 넘으면 — 서핑 코치는 대기, 보상 카드에서 편성 열기 → 닫으면 지도
await fresh(15, ['crab', 'me', 'gull', 'haenyeo']);
R.새동료 = await Q(()=>{ const q = _quest; q.force(15, true); q.skip(); const b = document.querySelector('.q-bench'); document.getElementById('q-tmn')?.click();
  const r = { 안내:b && b.textContent.includes('팀에서 바꿔 보세요'), 편성:document.getElementById('q-ov').classList.contains('qv-team'), NEW:!!document.querySelector('[data-hero="coach"] .qtm-new'), 상세:!!document.querySelector('.qtm-ft .qtm-d') };
  document.querySelector('[data-sl="3"]').click(); r.자리 = q.fmGet().join(','); document.getElementById('q-tmx').click(); r.지도 = document.getElementById('q-ov').classList.contains('qv-map'); return r; });
await fresh(15, ['crab', 'me', 'gull', '']);
R.새동료.빈칸 = await Q(()=>{ const q = _quest; q.force(15, true); q.skip(); return { 자리:q.fmGet().join(','), 안내없음:!document.querySelector('.q-bench') }; });
// 새로고침 — 받은 부탁·편성이 남는다
await fresh(4); await Q(()=>{ const q = _quest; q.npcTalk('c'); q.T.ch[0][1](); q.place('gull', 1); }); await t.sleep(200);
await t.p.reload({ waitUntil:'networkidle2' }); await t.sleep(2500);
R.새로고침 = await Q(()=>({ qp:JSON.stringify(ME.profile.play.qb.qp), 편성:(ME.profile.play.qb.fm || []).join(',') }));
// 바닷가 놀이 — 첫 마을 보스를 넘으면 🎣 낚시터·✨ 오늘의 보물. 낚시(던지기 → 너무 일찍 → 입질 → 초록 칸에서 낚아채기 / 칸 밖 놓침),
// 도감 보상은 처음 한 번·단계 한 번, 선물은 하루 한 번(♥ · ♥3 🐚5 · ♥5 🐚15 + 가방에 보물), 보물은 하루 한 번, 뒤로가기는 낚시터부터, 남의 값 가두기
await fresh(9);
R.놀이 = await Q(()=>{ const q = _quest, P = ME.profile.play; P.shells = 0; P.spent = 0; P.qb.fs = {}; P.qb.fi = {}; P.qb.hv = {}; P.qb.fk = 0; delete P.qb.fd; localStorage.removeItem('lineup.share.qfn'); q.town(2);
  return { 열림:q.funOn(), 낚시터:!!q.WK.ents.find(e=>e.t === 'fish'), 보물:!!q.WK.ents.find(e=>e.t === 'chest'), NEW:!!document.querySelector('.qe.fish.nw') }; });
await t.sleep(200);
R.놀이.보물 = await Q(()=>{ const q = _quest, b0 = shellBal(); q.interact(q.WK.ents.find(e=>e.t === 'chest')); const card = document.querySelector('#q-ov .go-t')?.textContent, n = shellBal() - b0;
  document.getElementById('q-chk').click(); q.chestOpen(); const n2 = shellBal() - b0; return { 카드:card, 조개:n, 두번:n2 === n, 사라짐:!q.WK.ents.find(e=>e.t === 'chest'), 오늘:q.fdOf().c }; });
await Q(()=>_quest.goTo(_quest.WK.ents.find(e=>e.t === 'fish'))); await untilOv();
R.낚시 = await Q(()=>(ME.profile.play.qb.fs = {}, { 화면:document.getElementById('q-ov').classList.contains('qv-fish'), 안내:document.getElementById('q-fmsg').textContent, 오늘:document.querySelector('.qf-od')?.textContent }));
await Q(()=>document.getElementById('q-fgo').click()); await t.sleep(100);
R.낚시.기다림 = await Q(()=>_quest.FS.st);
await Q(()=>document.getElementById('q-fgo').click());
R.낚시.일찍 = await Q(()=>({ 상태:_quest.FS.st, 글:document.getElementById('q-fmsg').textContent }));
const bite = async () => { await Q(()=>document.getElementById('q-fgo').click()); for(let n = 0; n < 60 && await Q(()=>_quest.FS?.st !== 'bite'); n++) await t.sleep(100); };
const tapWhen = async inside => { for(let n = 0; n < 300; n++){ const ok = await Q(w=>{ const s = _quest.FS; if(!s || s.st !== 'bite') return 2; const tt = +s.an.currentTime, u = (tt % (2 * s.p)) / s.p, pos = (u > 1 ? 2 - u : u) * 100, inz = pos > s.zl + 4 && pos < s.zl + s.z - 4, out = pos < s.zl - 8 || pos > s.zl + s.z + 8; return (w ? inz : out) ? 1 : 0; }, inside); if(ok){ await Q(()=>document.getElementById('q-fgo').click()); return ok; } await t.sleep(12); } return 0; };
await bite(); R.낚시.입질 = await Q(()=>({ 상태:_quest.FS.st, 막대:!document.getElementById('q-fbar').hidden, 버튼:document.getElementById('q-fgo').textContent }));
await tapWhen(false); R.낚시.놓침 = await Q(()=>({ 상태:_quest.FS.st, 글:document.getElementById('q-fmsg').textContent }));
await bite(); await tapWhen(true); await t.sleep(200);
R.낚시.잡음 = await Q(()=>({ 카드:document.getElementById('q-ov').classList.contains('qv-fcat'), 제목:document.querySelector('#q-ov .go-t')?.textContent, 잡은수:Object.values(_quest.fsOf()).reduce((a, b)=>a + b, 0) + document.querySelectorAll('.qf-cat').length * 0, 쓰레기:/쓰레기/.test(document.querySelector('#q-ov .go-t')?.textContent || '') }));
await Q(()=>document.getElementById('q-fag').click()); await t.sleep(100);
R.낚시.한번더 = await Q(()=>({ 화면:document.getElementById('q-ov').classList.contains('qv-fish'), 상태:_quest.FS.st }));
R.낚시.뒤로 = await Q(()=>{ const b = _quest.qBack(); return { 처리:b, 닫힘:document.getElementById('q-ov').hidden, 멈춤:!_quest.FS, 열림:!document.getElementById('quest').hidden }; });
R.도감 = await Q(()=>{ const q = _quest, P = ME.profile.play.qb, F = k=>q.FISH.find(f=>f.k === k); P.fs = {}; P.fi = {}; P.fk = 0; const b0 = shellBal();
  ['mack', 'nore', 'bori', 'shrimp', 'flat'].forEach(k=>q.fGet(F(k))); const n5 = shellBal() - b0; const r = q.fGet(F('mack'));
  return { 조개:n5, 다시:r.sh, 단계:P.fk, 바구니:q.fiOf().mack, 종류:Object.keys(q.fsOf()).length }; });
R.선물 = await Q(()=>{ const q = _quest, P = ME.profile.play.qb, fav = q.favOf(2, 'c'); P.fi = { mack:2, [fav.k]:1 }; q.npcTalk('c'); const L = q.T.lines[0][1], ch = q.T.ch && q.T.ch[0][0];
  q.T.ch[0][1](); const pick = { 화면:document.getElementById('q-ov').classList.contains('qv-gift'), 칸:document.querySelectorAll('[data-gf]').length };
  document.querySelector(`[data-gf="${fav.k}"]`).click(); const h1 = q.hvOf()['2c'], again = q.canGift('c'); q.giftGive('c', 'mack');
  return { 수다:!q.VIL[2].c.say.includes(L), 고르기:ch, ...pick, 좋아함:h1, 오늘또:again, 두번:q.hvOf()['2c'] === h1 && q.fiOf().mack === 2 }; });
R.선물.단짝 = await Q(()=>{ const q = _quest, P = ME.profile.play.qb; q.skip && q.skip(); document.getElementById('q-ov').hidden = true; P.fd = { d:q.fdOf().d, c:1, g:{} }; P.hv = { '2c':2 }; const b0 = shellBal(); q.giftGive('c', 'mack'); const h3 = shellBal() - b0;
  P.fd.g = {}; P.hv = { '2c':4 }; const b1 = shellBal(); q.giftGive('c', 'mack'); const h5 = shellBal() - b1; q.skip(); q.bag();
  return { 셋:h3, 다섯:h5, 하트:q.hvOf()['2c'], 보물:[...document.querySelectorAll('.qb-it b')].some(b=>/갯배 사공의 보물/.test(b.textContent)), 끝:!q.canGift('c') }; });
R.놀이가두기 = await Q(()=>{ const q = _quest, P = ME.profile.play.qb; P.fs = { mack:'9e9', evil:3, gold:-1, __proto__x:1 }; P.hv = { '2c':'<b>', '99z':5, '3d':9 }; P.fd = { d:'2000-01-01', c:1, g:{ '2c':1 } };
  return { fs:JSON.stringify(q.fsOf()), hv:JSON.stringify(q.hvOf()), fd:q.fdOf().c + JSON.stringify(q.fdOf().g) }; });
await Q(()=>{ document.getElementById('q-ov').hidden = true; questClose(); });
for(const k in R) console.log(k, JSON.stringify(R[k]));
const ok = /원정/.test(R.카드) && R.오프닝 && R.장제목 === '바다가 보낸 편지' && R.마을.걷기 && R.마을.마을 === 0 && R.마을.사람 === 'a,c,d,shop' && R.마을.보스잠김 && /해녀 할머니/.test(R.마을.알림판) && /①/.test(R.마을.길잡이) && R.마을.할머니표시 === '❗' && R.마을.메뉴 === 4 && !R.마을.넘침
  && R.걷기.눌러서 > 40 && R.걷기.방향키 < -20 && R.대화1.ov.includes('qv-talk') && R.타자 && R.고르기.n === '해녀 할머니' && R.고르기.ch.length === 2
  && /"a":1/.test(R.수락.qp) && /해파리 쫓아내기/.test(R.수락.알림판) && R.수락.무리 && /②/.test(R.수락.길잡이)
  && R.편성.종류 === 'hunt' && /자동/.test(R.편성.안내) && R.편성.칸 === 4 && R.탭이동 === 'me,gull,,' && R.끌기 === 'me,,,gull'
  && R.튜토1.단계 === 1 && R.튜토1.보임 && R.튜토1.전투화면 && R.튜토2.단계 === 2 && R.튜토2.준비 >= 1 && R.필살기.썼다 >= 1 && R.필살기.튜토 === 0 && R.필살기.저장 === '1' && R.필살기.컷인
  && R.전투.res === 'win' && /보고/.test(R.승리카드.글) && R.승리카드.진행 === 0 && /"w":[123]/.test(R.승리카드.qp) && R.보고전.표시 === '❓' && /보고/.test(R.보고전.알림판) && /③/.test(R.보고전.길잡이)
  && R.완료.카드 === '부탁 완료!' && R.완료.sg === 1 && R.완료.별 >= 1 && R.완료.조개 >= 11 && /전복/.test(R.완료.다음)
  && R.모으기.물건 === 3 && R.모으기.모음 === 3 && R.모으기.표시 === '❓' && R.모으기.sg === 2 && R.전하기.받는이 === '❓' && R.전하기.대사 === '이성현' && R.전하기.sg === 3
  && R.보스.잠김 === false && /보스/.test(R.보스.알림판) && R.보스.대화.includes('qv-talk') && R.보스.편성 === 'boss' && R.패배.진행 === 3 && /전멸/.test(R.패배.카드) && R.패배.편성 && R.패배.마을
  && /봉인 조각 1/.test(R.보스.보상.카드) && R.보스.보상.sg === 4 && R.보스.보상.조각 === 1 && R.보스.보상.할머니
  && R.지도.마을 === 11 && R.지도.깬마을 === 1 && R.지도.열림 === 2 && /천진해변으로 가기/.test(R.지도.가기) && !R.지도.넘침 && R.다음마을.마을 === 1 && R.다음마을.제목 === '맑은 물 아래 집게' && /꽃게 대장/.test(R.다음마을.사람) && R.다음마을.동료 >= 2
  && R.순찰.무리 === 'p1,p2' && R.순찰.할머니없음 && R.순찰.보스없음 && R.순찰.r.종류 === 'patrol' && R.순찰.r.sg === 4 && R.순찰.r.한번더 && R.순찰.경험치 > 0 && R.순찰.다시없음
  && R.가방.장비 === 2 && R.가방.동료 >= 3 && R.가방.선물 >= 1 && R.강화.보드 === 1 && R.강화.조개 === 20 && R.강화.공격 && R.성급.성급 === 2 && R.성급.조개 === 40 && R.성급.가방으로
  && R.뒤로.덮개 && R.뒤로.원정 && R.뒤로.지도닫힘 && R.뒤로.원정닫힘 && R.방치.h === 8 && R.방치.상한 && R.방치.늘어남 === R.방치.n && R.방치.다시 === 0
  && R.옮기기.sg === 20 && R.옮기기.별1 === 20 && R.옮기기.레벨 > 1 && R.옮기기.꽃게 && R.옮기기.마을.마을 === 5 && R.옮기기.마을.표시 === '❗' && R.옮기기.중간.마을 === 1 && R.옮기기.중간.주는이 === 'c' && R.옮기기.중간.표시 === '❗'
  && R.합치기.sg === 44 && R.합치기.st === '3,0,3,2' && R.합치기.hx === 1e6 && !R.합치기.evil && R.합치기.eq === '{"b":7,"w":10}' && R.합치기.qp === '{"g":6,"a":1,"n":1,"w":2}' && R.합치기.it
  && R.균형.막힘 === -1 && R.균형.전설 === 1 && R.전설.마을 === 10 && R.전설.보스차례 === 3 && R.전설.전설 === 1 && R.전설.잠금 === null && R.전설.진행 === 44 && R.전설.조각 === 11 && R.전설후.마을 === 10 && /전설/.test(R.전설후.알림판) && R.전설후.순찰 === 2
  && R.기록장.가기 === 11 && R.기록장.엔딩 && R.닫기.숨김
  && R.견고.보고두번 === 1 && R.견고.한번만 === 1 && R.견고.남은물건 === 'i0,i1' && R.견고.두개 === 2 && R.견고.남은물건2 === 'i1' && R.견고.가던대상 === null
  && R.견고.보스뒤로.대화 && R.견고.보스뒤로.전투없음 && R.견고.보스뒤로.덮개닫힘 && R.견고.보스뒤로.마을 && R.견고.전투뒤로.처리 && R.견고.전투뒤로.전투없음 && R.견고.전투뒤로.열림 && R.견고.전투뒤로.마을
  && R.견고.숨김.멈춤 && R.견고.숨김.다시 && R.견고.다시열기.전투없음 && R.견고.다시열기.마을 === 0 && R.견고.다시열기.걷기 && R.견고.다시열기.보스 && R.견고.회전.폭 >= 300 && R.견고.회전.사람 >= 4 && !R.견고.회전.넘침
  && R.새동료.안내 && R.새동료.편성 && R.새동료.NEW && R.새동료.상세 && R.새동료.자리 === 'crab,me,gull,coach' && R.새동료.지도 && R.새동료.빈칸.자리 === 'crab,me,gull,coach' && R.새동료.빈칸.안내없음
  && /"g":4,"a":1/.test(R.새로고침.qp) && /gull/.test(R.새로고침.편성.split(',')[1])
  && R.마을.놀이없음 && /→/.test(R.완료.전투력 || '')
  && R.놀이.열림 && R.놀이.낚시터 && R.놀이.보물 && R.놀이.NEW && /보물/.test(R.놀이.보물.카드) && R.놀이.보물.조개 >= 5 && R.놀이.보물.두번 && R.놀이.보물.사라짐 && R.놀이.보물.오늘 === 1
  && R.낚시.화면 && /초록 칸/.test(R.낚시.안내) && /오늘의 물고기/.test(R.낚시.오늘) && R.낚시.기다림 === 'wait' && R.낚시.일찍.상태 === 'idle' && /일찍/.test(R.낚시.일찍.글)
  && R.낚시.입질.상태 === 'bite' && R.낚시.입질.막대 && /낚아채기/.test(R.낚시.입질.버튼) && R.낚시.놓침.상태 === 'idle' && /놓쳤/.test(R.낚시.놓침.글)
  && R.낚시.잡음.카드 && (R.낚시.잡음.쓰레기 || R.낚시.잡음.잡은수 === 1) && R.낚시.한번더.화면 && R.낚시.한번더.상태 === 'wait' && R.낚시.뒤로.처리 && R.낚시.뒤로.닫힘 && R.낚시.뒤로.멈춤 && R.낚시.뒤로.열림
  && R.도감.조개 === 22 && R.도감.다시 === 0 && R.도감.단계 === 1 && R.도감.바구니 === 2 && R.도감.종류 === 5
  && R.선물.수다 && /선물/.test(R.선물.고르기) && R.선물.화면 && R.선물.칸 === 2 && R.선물.좋아함 === 2 && R.선물.오늘또 === false && R.선물.두번
  && R.선물.단짝.셋 === 5 && R.선물.단짝.다섯 === 15 && R.선물.단짝.하트 === 5 && R.선물.단짝.보물 && R.선물.단짝.끝
  && R.놀이가두기.fs === '{"mack":9999}' && R.놀이가두기.hv === '{"3d":5}' && R.놀이가두기.fd === '0{}';
console.log('판정', ok ? 'OK' : 'FAIL');
console.log('errs', t.errs); await t.b.close(); process.exit(ok && !t.errs.length ? 0 : 1);
