/* 전설의 보드 원정(자동 전투 RPG) — 놀이 카드 문구, 오프닝→지도(스테이지 4칸), 첫 판 튜토리얼(AUTO 끄기 → 초상 눌러 필살기),
   편성(눌러 옮기기·끌어 놓기), 승리·패배·별, 성급 강화 구매, 방치 보상 8시간 상한, 옛 저장(ch) 옮기기, 44판 봇 진행(균형), 마지막 보스 → 전설 */
import { open } from './mock.mjs';
import fs from 'fs';
const OUT = process.env.QSHOT || '/tmp';
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] }, { id:'u4', name:'이성현', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:2500, width:375 });
const R = {};
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); setTab('play'); }); await t.sleep(300);
R.카드 = await t.S(()=>document.querySelector('[data-hub="quest"]')?.textContent.replace(/\s+/g,' ').trim());
await t.S(()=>document.querySelector('[data-hub="quest"]').click()); await t.sleep(1500);
R.오프닝 = await t.S(()=>document.getElementById('q-ov').classList.contains('qv-cine'));
await t.S(()=>document.getElementById('qc-sk').click()); await t.sleep(400);
R.지도 = await t.S(()=>({ 마을:document.querySelectorAll('.qm-n').length, 스테이지:document.querySelectorAll('.qm-s').length, 잠김:document.querySelectorAll('.qm-s:disabled').length, 버튼:document.getElementById('q-go').textContent.trim(), 넘침:document.documentElement.scrollWidth > innerWidth }));
// 1-1 — 제목 → 대화 건너뛰기 → 편성
await t.S(()=>document.getElementById('q-go').click()); await t.sleep(300);
R.제목 = await t.S(()=>document.querySelector('.qtt b')?.textContent);
await t.S(()=>document.getElementById('q-ov').click()); await t.sleep(200);
await t.S(()=>document.getElementById('q-sk').click()); await t.sleep(200);
R.편성 = await t.S(()=>({ 단계:_quest.S.mode, 칸:document.querySelectorAll('[data-sl]').length, 카드:document.querySelectorAll('.qtm-h').length, 잠김:document.querySelectorAll('.qtm-h.lk').length, 출전:!!document.getElementById('q-fight') }));
// 눌러 옮기기 — 끼룩 카드 → 앞줄 2번 칸
await t.S(()=>document.querySelector('.qtm-l [data-hero="gull"]').click()); await t.sleep(80);
await t.S(()=>document.querySelector('[data-sl="1"]').click()); await t.sleep(80);
R.탭이동 = await t.S(()=>_quest.fmGet().join(','));
// 끌어 놓기 — 앞줄 2번(끼룩)을 뒷줄 2번 칸으로
const rc = await t.S(()=>{ const a = document.querySelector('[data-sl="1"]').getBoundingClientRect(), b = document.querySelector('[data-sl="3"]').getBoundingClientRect(); return [a.x + a.width / 2, a.y + a.height / 2, b.x + b.width / 2, b.y + b.height / 2]; });
await t.p.mouse.move(rc[0], rc[1]); await t.p.mouse.down(); await t.p.mouse.move(rc[0] + 20, rc[1] + 10, { steps:4 }); await t.p.mouse.move(rc[2], rc[3], { steps:6 }); await t.p.mouse.up(); await t.sleep(200);
R.끌기 = await t.S(()=>_quest.fmGet().join(','));
await t.sleep(300); await t.S(()=>document.querySelector('.qtm-l [data-hero="me"]').click()); await t.sleep(100);
fs.writeFileSync(OUT + '/q4-team.png', await t.p.screenshot());
R.상세 = await t.S(()=>document.querySelector('.qtm-d')?.textContent.replace(/\s+/g,' ').slice(0, 60));
// 출전 → 튜토리얼
await t.S(()=>{ localStorage.removeItem('lineup.share.qtut'); _quest.auto = true; document.getElementById('q-fight').click(); }); await t.sleep(2600);
R.튜토1 = await t.S(()=>({ 단계:_quest.S.tut, 말:document.getElementById('q-tut')?.textContent, 보임:!document.getElementById('q-tut')?.hidden, 초상:document.querySelectorAll('.q-pt').length }));
const tm = await t.S(()=>_quest.S.t); await t.sleep(400);
R.튜토멈춤 = await t.S(t0=>_quest.S.t === t0, tm);
await t.S(()=>document.getElementById('q-auto').click()); await t.sleep(150);
R.튜토2 = await t.S(()=>({ 단계:_quest.S.tut, 말:document.getElementById('q-tut')?.textContent, 준비:document.querySelectorAll('.q-pt.rdy').length }));
await t.S(()=>document.querySelector('.q-pt.rdy').click()); await t.sleep(160);
R.필살기 = await t.S(()=>({ 썼다:_quest.S.ults, 튜토:_quest.S.tut, 저장:localStorage.getItem('lineup.share.qtut'), 컷인:!!document.querySelector('.q-cut') }));
fs.writeFileSync(OUT + '/q4-battle.png', await t.p.screenshot());
await t.S(()=>{ document.getElementById('q-speed').click(); }); R.배속 = await t.S(()=>document.getElementById('q-speed').textContent);
await t.S(()=>{ document.getElementById('q-speed').click(); document.getElementById('q-auto').click(); });
// 이 판 끝까지(자동) → 승리·별·결과 카드
const r1 = await t.S(()=>{ const q = _quest, s = q.S; let n = 0; while(!s.res && n++ < 60 * 200) q.step(q.FIX); return { res:s.res, stars:s.stars }; });
await t.S(()=>_quest.skip()); await t.sleep(200);
R.첫승 = { ...r1, 진행:await t.S(()=>ME.profile.play.qb.sg), 별:await t.S(()=>ME.profile.play.qb.st[0]), 카드:await t.S(()=>({ 별:document.querySelectorAll('.q-stars i').length, 다음:document.getElementById('q-nx')?.textContent, 레벨:document.querySelector('.q-lv')?.textContent })) };
// 패배 — 진행 그대로, 패배 카드
await t.S(()=>{ _quest.force(1, false); _quest.skip(); }); await t.sleep(100);
R.패배 = await t.S(()=>({ 진행:ME.profile.play.qb.sg, 카드:document.querySelector('#q-ov .go-t')?.textContent, 편성버튼:!!document.getElementById('q-tm2') }));
// 성급 강화 — 조개로 2성
R.강화 = await t.S(()=>{ const p = ME.profile.play; p.shells = (p.shells || 0) + 200; const b0 = shellBal(); _quest.session(1); _quest.teamUp(); document.querySelector('.qtm-l [data-hero="me"]').click(); document.getElementById('q-star').click(); return { 전:b0, 후:shellBal(), 성급:_quest.heroSt('me'), 공격:_quest.heroStat('me').atk }; });
// 방치 보상 — 20시간 떠나 있어도 8시간치
R.방치 = await t.S(()=>{ const q = ME.profile.play.qb; q.it = Date.now() - 20 * 36e5; const b0 = shellBal(), r = playQuestIdle(), again = playQuestIdle(); return { ...r, 늘어남:shellBal() - b0, 다시:again.n, 상한:r.n === 8 * r.rate }; });
// 옛 저장(ch=5) 옮기기
R.옮기기 = await t.S(()=>{ const p = ME.profile.play; p.qb = { ch:5, best:4, clears:0 }; _quest.migrate(); const q = p.qb;
  return { sg:q.sg, 별1:q.st.filter(v=>v === 1).length, 레벨:_quest.heroLv('me'), 편성:q.fm.filter(Boolean).length, 꽃게:_quest.fmGet().includes('crab') }; });
await t.S(()=>{ _quest.map(); }); await t.sleep(200);
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(100);
R.옮긴지도 = await t.S(()=>({ 깬마을:document.querySelectorAll('.qm-n.done').length, 열린칸:document.querySelectorAll('.qm-s:not(:disabled)').length, 넘침:document.documentElement.scrollWidth > innerWidth }));
fs.writeFileSync(OUT + '/q4-map.png', await t.p.screenshot());
// 균형 — 새 프로필로 44판을 봇이 순서대로(지면 앞 판 한 번 돌고 조개 되는 대로 성급 강화). 판당 시도 수
R.균형 = await t.S(()=>{ const q = _quest, p = ME.profile.play, _pop = window.popNext; window.popNext = ()=>{}; localStorage.setItem('lineup.share.qtut', '1'); q.auto = true;
  p.qb = {}; p.shells = 0; p.spent = 0; q.migrate(); const tries = [], tt = []; let stuck = -1;
  const buy = ()=>{ const fm = q.fmGet().filter(Boolean).sort((a, b)=>q.heroSt(a) - q.heroSt(b)); for(const k of fm) if(q.heroSt(k) < 5 && shellBal() >= [0, 40, 90, 180, 320][q.heroSt(k)]){ playQuestStar(k); break; } };
  for(let g = 0; g < q.NS; g++){ let a = 0, r; do{ r = q.sim(g); a++; tt.push(r.t); if(r.res !== 'win' && g > 0){ q.sim(g - 1); q.sim(g - 1); } buy(); } while(r.res !== 'win' && a < 15); tries.push(a); if(r.res !== 'win'){ stuck = g; break; } }
  window.popNext = _pop; const v = []; for(let i = 0; i < tries.length; i += 4) v.push(tries.slice(i, i + 4).join(''));
  return { 마을별시도:v.join(' '), 막힘:stuck, 판평균초:Math.round(tt.reduce((a, b)=>a + b, 0) / tt.length), 동료:q.fmGet().filter(Boolean).map(k=>k + '★' + q.heroSt(k) + 'Lv' + q.heroLv(k)).join(' '), 별:p.qb.st.reduce((a, b)=>a + b, 0), 전설:p.qb.legend }; });
// 마지막 보스 → 엔딩 → 전설 (테스트 훅)
R.전설 = await t.S(()=>{ const q = _quest, p = ME.profile.play; p.qb = { sg:43, ch:10 }; q.migrate(); q.force(43, true); q.skip(); return { 전설:p.qb.legend, 잠금:lockOf('boardc', 'legend'), 진행:p.qb.sg, 조각:p.qb.ch, 카드:document.querySelector('#q-ov .go-t')?.textContent }; });
// 합치기 — 남의 기기 값은 숫자로 가두고 모르는 영웅은 버린다
R.합치기 = await t.S(()=>{ playMerge({ qb:{ sg:'99', st:[3, 'x', 9e9, 2], hx:{ me:5e9, evil:5 }, hs:{ gull:'<b>', crab:4 }, fm:['me', '<img>', 'crab'], it:'1e99' } }); const q = ME.profile.play.qb;
  return { sg:q.sg, st:q.st.slice(0, 4).join(','), hx:q.hx.me, evil:'evil' in q.hx, hs:JSON.stringify(q.hs), it:q.it <= 1e13 }; });
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); _quest.map(); }); await t.sleep(150);
await t.S(()=>document.getElementById('q-cdx').click()); await t.sleep(200);
R.기록장 = await t.S(()=>({ 다시:document.querySelectorAll('[data-rp]').length, 엔딩:!!document.getElementById('q-end') }));
await t.S(()=>document.getElementById('q-x').click()); await t.sleep(200);
R.닫기 = await t.S(()=>({ 숨김:document.getElementById('quest').hidden, 카드:document.querySelector('[data-hub="quest"]')?.textContent.replace(/\s+/g,' ').trim() }));
for(const k in R) console.log(k, JSON.stringify(R[k]));
const ok = /RPG/.test(R.카드) && R.오프닝 && R.지도.마을 === 11 && R.지도.스테이지 === 4 && R.지도.잠김 === 3 && !R.지도.넘침 && R.편성.칸 === 4 && R.편성.출전
  && R.탭이동 === 'me,gull,,' && R.끌기 === 'me,,,gull' && R.튜토1.단계 === 1 && R.튜토1.보임 && R.튜토멈춤 && R.튜토2.단계 === 2 && R.튜토2.준비 >= 1 && R.필살기.썼다 >= 1 && R.필살기.튜토 === 0 && R.필살기.저장 === '1' && R.필살기.컷인 && R.배속 === '×2'
  && R.첫승.res === 'win' && R.첫승.진행 === 1 && R.첫승.별 >= 1 && R.첫승.카드.별 === 3 && R.패배.진행 === 1 && R.패배.편성버튼
  && R.강화.성급 === 2 && R.강화.전 - R.강화.후 === 40 && R.방치.h === 8 && R.방치.상한 && R.방치.늘어남 === R.방치.n && R.방치.다시 === 0
  && R.옮기기.sg === 20 && R.옮기기.별1 === 20 && R.옮기기.레벨 > 1 && R.옮기기.꽃게 && R.옮긴지도.깬마을 === 5 && !R.옮긴지도.넘침
  && R.균형.막힘 === -1 && R.균형.전설 === 1 && R.전설.전설 === 1 && R.전설.잠금 === null && R.전설.진행 === 44 && R.전설.조각 === 11
  && R.합치기.sg === 44 && R.합치기.st === '3,1,3,2' && R.합치기.hx === 1e6 && !R.합치기.evil && R.합치기.it && R.기록장.다시 === 11 && R.닫기.숨김;
console.log('판정', ok ? 'OK' : 'FAIL');
console.log('errs', t.errs); await t.b.close(); process.exit(ok && !t.errs.length ? 0 : 1);
