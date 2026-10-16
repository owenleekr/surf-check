import { open } from './mock.mjs';
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}]},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',hair:'bob',hairc:'k'}},{wait:2500});
await t.S(()=>{ document.getElementById('pop').hidden=true; gameOpen(); }); await t.sleep(400);
for(const k of ['day','sunset','night']){
  await t.S(k=>{ _game.setTheme(k); _game.begin(); const g=_game; const s=g.st; for(let i=0;i<150;i++){ const o=s.obs.find(o=>o.x+o.w>48); if(o&&!s.air&&(o.x-52)<s.speed*0.30) g.jump(); g.step(1/60); if(!s.air) g.release(); } }, k);
  await t.sleep(300);
  await (await t.p.$('#game .game-stage')).screenshot({path:`/tmp/gm_${k}.png`});
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
// 게임 화면이 열려 있을 때 알림(토스트)·+XP 가 게임 머리줄(제목·점수·✕)을 덮지 않는지 — 폭마다, 게임마다
const bad=[];
await t.S(()=>{ ['gameClose','surfClose','skateClose','defendClose','questClose'].forEach(f=>{ try{ window[f]&&window[f](); }catch(e){} }); });
for(const [w,h] of [[390,844],[320,640]]){
  await t.p.setViewport({width:w,height:h,deviceScaleFactor:2,isMobile:true,hasTouch:true}); await t.sleep(200);
  for(const [g,op,cl] of [['game','gameOpen','gameClose'],['surf','surfOpen','surfClose'],['skate','skateOpen','skateClose'],['defend','defendOpen','defendClose'],['quest','questOpen','questClose']]){
    const r=await t.S(async (op,cl,g)=>{ window[op](); await new Promise(z=>setTimeout(z,500)); xpFloat(7); toast('기록을 저장했어요'); await new Promise(z=>setTimeout(z,450));
      const R=e=>{ const b=e.getBoundingClientRect(); return [b.left,b.top,b.right,b.bottom]; }, hit=(a,b)=>a[0]<b[2]&&b[0]<a[2]&&a[1]<b[3]&&b[1]<a[3];
      const hd=R(document.querySelector(`#${g} .game-hd`)), xp=R(document.getElementById('xpfx')), to=R(document.getElementById('toast'));
      const o={ xp머리줄:hit(xp,hd), 토스트머리줄:hit(to,hd), 서로:hit(xp,to), 화면안:xp[1]>=0&&to[3]<=innerHeight };
      window[cl](); return o; }, op, cl, g);
    if(r.xp머리줄||r.토스트머리줄||r.서로||!r.화면안) bad.push(`${g} ${w}: ${JSON.stringify(r)}`);
  }
}
const back=await t.S(async ()=>{ toast('게임 밖'); xpFloat(3); await new Promise(z=>setTimeout(z,100)); const e=document.getElementById('toast'), x=document.getElementById('xpfx'); return { 토스트:e.style.bottom==='' && getComputedStyle(e).bottom, xp:x.style.top==='' }; });
if(!back.토스트||!back.xp) bad.push('게임 밖 기본 자리 '+JSON.stringify(back));
console.log('게임 중 알림 자리', bad.length?bad:'OK', JSON.stringify(back));
console.log('errs',t.errs); await t.b.close(); process.exit(bad.length||t.errs.length?1:0);
