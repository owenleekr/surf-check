import { open } from './mock.mjs';
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}]},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',hair:'bob',hairc:'k'}},{wait:2500});
await t.S(()=>{ document.getElementById('pop').hidden=true; gameOpen(); }); await t.sleep(400);
for(const k of ['day','sunset','night']){
  await t.S(k=>{ _game.setTheme(k); _game.begin(); const g=_game; const s=g.st; for(let i=0;i<150;i++){ const o=s.obs.find(o=>o.x+o.w>48); if(o&&!s.air&&(o.x-52)<s.speed*0.30) g.jump(); g.step(1/60); if(!s.air) g.release(); } }, k);
  await t.sleep(300);
  await (await t.p.$('.game-stage')).screenshot({path:`/tmp/gm_${k}.png`});
}
// 일시정지/이어서
await t.S(()=>{ _game.begin(); }); await t.sleep(200);
await t.S(()=>_game.pause()); console.log('일시정지', await t.S(()=>({모드:_game.mode, 카드:document.querySelector('#g-ov .go-t')?.textContent })));
const sc1 = await t.S(()=>_game.score()); await t.sleep(600); const sc2 = await t.S(()=>_game.score());
console.log('멈춘 동안 점수 변화', sc1===sc2?'없음 ✅':`${sc1}→${sc2} ❌`);
await t.S(()=>document.getElementById('g-resume').click()); await t.sleep(200); console.log('이어서', await t.S(()=>_game.mode));
// 소리 토글 기억
await t.S(()=>document.getElementById('g-snd').click());
console.log('소리', await t.S(()=>({버튼:document.getElementById('g-snd').textContent, 저장:localStorage.getItem('lineup.share.snd')})));
await t.S(()=>document.getElementById('g-snd').click());
// 높은 점수 → 자랑하기
await t.S(()=>{ const g=_game; g.begin(); const s=g.st; let n=0; while(!s.dead && n<60*25){ const o=s.obs.find(o=>o.x+o.w>48); if(o&&!s.air&&(o.x-52)<s.speed*0.30) g.jump(); g.step(1/60); n++; if(!s.air) g.release(); } s.dist+=0; /* 이제 안 뛴다 */ let m=0; while(!s.dead&&m<600){ g.step(1/60); m++; } });
await t.sleep(1500);
console.log('끝난 화면', await t.S(()=>({ 모드:_game.mode, 제목:document.querySelector('#g-ov .go-t')?.textContent, 점수:document.querySelector('#g-ov .go-s')?.textContent, 자랑버튼:!!document.getElementById('g-brag') })));
await t.S(()=>document.getElementById('g-brag')?.click()); await t.sleep(900);
const chat=t.posts.filter(([tb])=>tb.startsWith('chat')).map(([,b])=>b.text);
console.log('채팅 전송', chat, '| 말풍선(mood) 갱신 안 함 →', await t.S(()=>!ME.profile.mood));
console.log('errs',t.errs); await t.b.close();
