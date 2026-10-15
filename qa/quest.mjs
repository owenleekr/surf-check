/* 전설의 보드 원정(이야기판) — 오프닝(첫 진입 자동·건너뛰기)·지도·장 제목·대화·준비물·전투, 장별 승률(난이도), 조각 진행 저장·전설 보드 잠금 해제, 지면 진행 그대로, 가로 넘침 */
import { open } from './mock.mjs';
import fs from 'fs';
const OUT = process.env.QSHOT || '/tmp';
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] }, { id:'u4', name:'이성현', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:2500, width:375 });
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); setTab('play'); }); await t.sleep(300);
console.log('놀이 카드', await t.S(()=>document.querySelector('[data-hub="quest"]')?.textContent.replace(/\s+/g,' ').trim()));
await t.S(()=>document.querySelector('[data-hub="quest"]').click()); await t.sleep(1700);
const op = await t.S(()=>({ 오프닝:document.getElementById('q-ov').classList.contains('qv-cine'), 점:document.querySelectorAll('.qc-dots b').length, 자막:document.getElementById('qc-sub')?.textContent.length || 0, 건너뛰기:!!document.getElementById('qc-sk'), 넘침:document.documentElement.scrollWidth > innerWidth }));
console.log('오프닝', JSON.stringify(op));
fs.writeFileSync(OUT + '/q3-opening.png', await t.p.screenshot());
await t.S(()=>document.getElementById('qc-sk').click()); await t.sleep(400);
op.건너뛴뒤 = await t.S(()=>({ 지도:document.querySelectorAll('.qm-n').length, 기억:localStorage.getItem('lineup.share.qop'), 카메라:document.getElementById('q-bg').style.transform }));
console.log('오프닝 건너뛰기', JSON.stringify(op.건너뛴뒤));
console.log('지도', JSON.stringify(await t.S(()=>({ 마을:document.querySelectorAll('.qm-n').length, 잠김:document.querySelectorAll('.qm-n:disabled').length, 내캐릭터:!!document.querySelector('.qm-n.sel img.qm-me[src^="data:image/svg"]'), 버튼:document.getElementById('q-go').textContent, 넘침:document.documentElement.scrollWidth > innerWidth }))));
fs.writeFileSync(OUT + '/quest-map.png', await t.p.screenshot());
await t.S(()=>document.getElementById('q-go').click()); await t.sleep(300);
console.log('장 제목', await t.S(()=>document.querySelector('.qtt')?.textContent.trim()));
await t.S(()=>document.getElementById('q-ov').click()); await t.sleep(200);
await t.S(()=>{ for(let i=0;i<8;i++) document.getElementById('q-tb').click(); }); await t.sleep(1200);   // 해설 2줄·할머니 2줄 넘겨 '나' 대사(모찌 초상)
console.log('대화', JSON.stringify(await t.S(()=>({ 이름:document.querySelector('.qt-n')?.textContent, 초상:!!document.querySelector('.qt-pt img[src^="data:image/svg"]'), 말:document.getElementById('q-tx').textContent, 단계:_quest.S.mode }))));
fs.writeFileSync(OUT + '/quest-talk.png', await t.p.screenshot());
await t.S(()=>document.getElementById('q-sk').click()); await t.sleep(200);
console.log('준비물', await t.S(()=>({ 단계:_quest.S.mode, 카드:document.querySelectorAll('[data-qb]').length })));
await t.S(()=>document.querySelector('[data-qb="0"]').click()); await t.sleep(2000);
console.log('전투 중', await t.S(()=>({ 단계:_quest.S.mode, 체력:document.getElementById('q-hp').textContent, 로그:document.getElementById('q-log').textContent.slice(0, 60) })));
// AUTO 끔 = 기술 카드를 눌러 쓴다, 배속 ×2
await t.S(()=>document.getElementById('q-auto').click()); await t.sleep(150);
const au = await t.S(()=>{ const q=_quest, k=q.S.sk[0]; k.t=k.cd; const r={ 버튼:document.getElementById('q-auto').textContent, 눌림:document.getElementById('q-auto').getAttribute('aria-pressed'), 카드:document.querySelectorAll('.q-skc').length, 위버튼:!document.getElementById('q-top').hidden };
  document.querySelector('.q-skc').click(); r.썼다 = k.t === 0; return r; });
await t.S(()=>document.getElementById('q-speed').click()); au.배속 = await t.S(()=>document.getElementById('q-speed').textContent);
await t.sleep(120); au.컷인 = await t.S(()=>!!document.querySelector('.q-cut'));
console.log('AUTO·기술', JSON.stringify(au));
fs.writeFileSync(OUT + '/q3-battle.png', await t.p.screenshot());
await t.S(()=>{ document.getElementById('q-auto').click(); document.getElementById('q-speed').click(); });
// 장별 자동 40판 — 앞 마을 선물이 붙은 상태로 이길 수 있는지
const sim = await t.S(()=>{ const q=_quest; q.auto=true; const save=JSON.stringify(ME.profile.play||{}); const out={}; const _pq=window.playQuestDone; window.playQuestDone=()=>({best:0,gain:0});
  for(let k=0;k<q.N;k++){ let w=0, tm=0; for(let r=0;r<40;r++){ q.session(k); q.pickPhase(); let n=0; while(!q.S.res && n++<60*60*20){ if(q.S.mode==='pick') q.choose(Math.floor(Math.random()*3)); q.step(q.FIX); } if(q.S.res==='win') w++; tm+=q.S.t; q.skip&&q.skip(); }
    out[k+1]=`${Math.round(w/40*100)}% ${Math.round(tm/40)}s`; }
  window.playQuestDone=_pq; ME.profile.play=JSON.parse(save); q.map(); return out; });
console.log('장별 승률', JSON.stringify(sim));
// 지면 조각은 그대로, 이기면 순서대로 하나씩, 마지막 장에서 전설
const prog = await t.S(()=>{ const q=_quest, qb=()=>ME.profile.play.qb, run=(k,win)=>{ q.session(k); q.pickPhase(); q.choose(0); if(win){ q.S.hp=q.S.maxHp=99999; } else { q.S.hp=0.01; q.S.def=1e6; q.S.atk=0; q.S.palRate=0; q.S.shield=0; } let n=0; while(!q.S.res && n++<60*60*40) q.step(q.FIX); const r=q.S.res; q.skip(); return r; };
  const a = run(0,false), afterLose = qb().ch ?? 0, jump = run(3,true), afterJump = qb().ch ?? 0;
  const seq=[]; for(let k=0;k<q.N;k++){ const r=run(k,true); seq.push(qb().ch); }
  return { 짐:a, 진뒤조각:afterLose, 건너뛴승리:jump, 건너뛴뒤조각:afterJump, 순서:seq.join(','), 전설:qb().legend, 완주:qb().clears, 잠금:lockOf('boardc','legend'), 카드:document.querySelector('#q-ov .go-t')?.textContent }; });
console.log('진행', JSON.stringify(prog));
await t.S(()=>_quest.map()); await t.sleep(200);
console.log('완주 뒤 지도', await t.S(()=>({ 잠김:document.querySelectorAll('.qm-n:disabled').length, 조각:document.querySelectorAll('.qm-n.done').length, 넘침:document.documentElement.scrollWidth > innerWidth })));
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(200);
await t.S(()=>document.getElementById('q-cdx').click()); await t.sleep(300);
const cdx = await t.S(()=>({ 항목:document.querySelectorAll('.qx-it').length, 잠김:document.querySelectorAll('.qx-it.lk').length, 다시:document.querySelectorAll('[data-rp]').length, 엔딩:!!document.getElementById('q-end'), 넘침:document.documentElement.scrollWidth > innerWidth }));
console.log('기록장', JSON.stringify(cdx));
fs.writeFileSync(OUT + '/q3-codex.png', await t.p.screenshot());
await t.S(()=>document.getElementById('q-cx').click()); await t.sleep(200);
await t.S(()=>document.getElementById('q-x').click()); await t.sleep(200);
console.log('닫기', await t.S(()=>({ 숨김:document.getElementById('quest').hidden, 카드:document.querySelector('[data-hub="quest"]')?.textContent.replace(/\s+/g,' ').trim() })));
const ok = op.오프닝 && op.점 === 4 && op.자막 > 0 && op.건너뛴뒤.지도 === 11 && op.건너뛴뒤.기억 === '1' && au.눌림 === 'false' && au.카드 > 0 && au.썼다 && au.배속 === '×2' && cdx.다시 === 11 && cdx.잠김 === 0 && !cdx.넘침 && prog.진뒤조각 === 0 && prog.건너뛴뒤조각 === 0 && prog.순서 === '1,2,3,4,5,6,7,8,9,10,11' && prog.전설 === 1 && prog.잠금 === null;
console.log('판정', ok ? 'OK' : 'FAIL');
console.log('errs', t.errs); await t.b.close(); process.exit(ok && !t.errs.length ? 0 : 1);
