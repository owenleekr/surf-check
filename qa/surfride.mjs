/* 라인업 서핑 — 패들→팝업→라이딩→풀아웃/와이프아웃→세션 끝·기록 저장까지 한 바퀴. 화면 캡처 /tmp/sr-*.png */
import { open } from './mock.mjs';
import fs from 'fs';
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] }, { id:'u4', name:'테스터', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:2500 });
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); setTab('play'); }); await t.sleep(500);
console.log('놀이 카드', await t.S(()=>document.querySelector('[data-hub="surf"]')?.textContent.replace(/\s+/g,' ').trim()));
await t.S(()=>document.querySelector('[data-hub="surf"]').click()); await t.sleep(400);
console.log('시작 카드', await t.S(()=>({ 보임:!document.getElementById('surf').hidden, 제목:document.querySelector('#s-ov .go-t')?.textContent })));
await t.S(()=>document.getElementById('s-go').click()); await t.sleep(200);
const shot = n => t.p.screenshot().then(b=>fs.writeFileSync(`/tmp/sr-${n}.png`, b));
// 1) 패들 안 하면 놓친다
const miss = await t.S(()=>{ const g=_surf; for(let i=0;i<60*3;i++) g.step(g.FIX); return g.S.phase; });
console.log('패들 안 함 →', miss);
await t.S(()=>{ const g=_surf; for(let i=0;i<60*2;i++) g.step(g.FIX); });
console.log('다음 파도 →', await t.S(()=>({ 단계:_surf.S.phase, 파도:_surf.S.wave })));
// 2) 연타 패들
await t.S(()=>{ const g=_surf; for(let i=0;i<60*1.2;i++){ if(i%5===0) g.press(); g.step(g.FIX); } }); await shot('lineup');
await t.S(()=>{ const g=_surf; let n=0; while(g.S.phase==='lineup' && n++<400){ if(n%5===0) g.press(); g.step(g.FIX); } });
console.log('패들 후 →', await t.S(()=>_surf.S.phase));
await t.sleep(100); await shot('pop');
// 바늘이 가운데 올 때 탭
const take = await t.S(()=>{ const g=_surf; let n=0; while(g.S.phase==='pop' && n++<200){ g.step(g.FIX); if(Math.abs(g.R.needle-0.5)<0.05){ g.press(); g.step(g.FIX); } } return { 단계:g.S.phase, 속도:Math.round(g.R.v) }; });
console.log('팝업 →', take);
// 3) 라이딩 — 포켓을 지키는 간단한 손: 컬과의 거리에 따라 위/아래
const ride = await t.S(()=>{ const g=_surf; const log={top:0,air:0,tube:0}; let n=0, maxV=0;
  while(g.S.phase==='ride' && n++<60*12){ const r=g.R, d=r.x-r.curl; g.held = (r.h < 0.45) || (d < 30 && r.h < 0.8); if(n%40===0 && r.h>0.6) g.held=false; g.step(g.FIX); maxV=Math.max(maxV,r.v); }
  return { 단계:g.S.phase, 탄시간:(n/60).toFixed(1), 최고속도:Math.round(maxV), 점수:Math.floor(g.R.pts), 결과:g.R.done?.why, 트릭:g.R.trick }; });
console.log('라이딩 →', ride);
await shot('result');
// 4) 강제로 라이딩 상태를 만들어 풀아웃·튜브·와이프아웃 확인
const forced = await t.S(()=>{ const g=_surf, out={};
  g.nextWave(); g.S.phase='ride'; Object.assign(g.R,{ v:110, h:0.8, vh:0, x:400, curl:380, pts:100 }); g.pull(); out.풀아웃 = g.R.done && { why:g.R.done.why, 받은점수:g.R.done.got };
  g.nextWave(); g.S.phase='ride'; Object.assign(g.R,{ v:60, h:0.8, vh:0, x:400, curl:410, pts:0 }); g.held=true; for(let i=0;i<40;i++) g.step(g.FIX); out.튜브중 = { 튜브:+g.R.tube.toFixed(2), 단계:g.S.phase };
  Object.assign(g.R,{ v:200, curl:g.R.x - 2 }); for(let i=0;i<10;i++) g.step(g.FIX); out.튜브탈출 = { 튜브트릭:g.R.trick.tube, 단계:g.S.phase };
  return out; });
console.log('강제 상황', JSON.stringify(forced));
await shot('tube');
const wipe = await t.S(()=>{ const g=_surf; g.S.phase='ride'; Object.assign(g.R,{ v:40, h:0.1, vh:0, x:400, curl:399 }); g.held=false; for(let i=0;i<30 && g.S.phase==='ride';i++) g.step(g.FIX); return { 단계:g.S.phase, 이유:g.R.done?.why, 목숨:g.S.lives, 점수:g.R.done?.got, 원점수:g.R.done?.raw }; });
console.log('와이프아웃', wipe);
// 5) 세션 끝까지
const end = await t.S(()=>{ const g=_surf; let k=0; while(g.S.phase!=='over' && k++<10){ g.nextWave(); if(g.S.phase==='over') break; g.S.phase='ride'; Object.assign(g.R,{x:500,curl:480,h:0.7,pts:50}); g.pull(); } return { 단계:g.S.phase, 합계:g.S.total, sbest:ME.profile.play?.sbest, 끝카드:document.querySelector('#s-ov .go-t')?.textContent, 칸:[...document.querySelectorAll('#s-ov .go-st span')].map(x=>x.textContent) }; });
console.log('세션 끝', end);
await shot('over');
// 6) 렌더 중 오류 없는지 — 실제 루프를 몇 초 돌린다
await t.S(()=>{ document.getElementById('s-again').click(); }); await t.sleep(300);
await t.S(()=>{ const g=_surf; g.R.meter=1; for(let i=0;i<60*3;i++) g.step(g.FIX); }); await t.sleep(1500);
await t.S(()=>{ const g=_surf; g.S.phase='ride'; Object.assign(g.R,{ v:120, h:0.5, x:300, curl:260 }); }); await t.sleep(800); await shot('ride');
await t.S(()=>{ const g=_surf; Object.assign(g.R,{ v:90, h:0.8, x:600, curl:610 }); g.held=true; }); await t.sleep(250); await shot('tube2');
await t.S(()=>surfClose()); await t.sleep(200);
console.log('닫힘', await t.S(()=>document.getElementById('surf').hidden), '| errs', t.errs);
await t.b.close(); process.exit(0);
