import { open } from './mock.mjs';
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}]},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',play:{base:50,bonus:0,badges:{drill1:1},qd:{},qall:0,best:0,gday:'',gxp:0,gn:{},lvSeen:1,xp:50,lv:1}}},{wait:2500});
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(400);
console.log('오늘 퀘스트', await t.S(()=>playQuests(ME.profile.play).map(q=>q.id+(q.done?'✔':''))));
const round=async(allRight)=>{
  await t.S(()=>quizOpen()); await t.sleep(200);
  for(let i=0;i<5;i++){
    await t.S(ar=>{ const q=document.querySelector('.qz-q').textContent.replace(/^“|”$/g,''); const who=VOICES.find(v=>v[0]===q)[1];
      const btns=[...document.querySelectorAll('.qz-o')]; (ar?btns.find(b=>b.dataset.s===who):btns.find(b=>b.dataset.s!==who)).click(); }, allRight);
    await t.sleep(80);
    if(i===0) console.log('  첫 문제 응답 후', await t.S(()=>({피드백:document.getElementById('qz-fb').textContent, 옵션잠김:[...document.querySelectorAll('.qz-o')].every(b=>b.disabled), 다음:!document.getElementById('qz-next').hidden })));
    await t.S(()=>document.getElementById('qz-next').click()); await t.sleep(60);
  }
  return t.S(()=>({ 결과:document.querySelector('.qz-score').textContent.replace(/\s+/g,' '), 문구:document.querySelector('.qz-xp').textContent, 누적:ME.profile.play.qz, qzxp:ME.profile.play.qzxp, 오늘방문:ME.profile.play.vis?.[today()]?.quiz, xp:ME.profile.play.xp }));
};
console.log('1판(전부 오답)', JSON.stringify(await round(false)));
console.log('2판(전부 정답)', JSON.stringify(await round(true)));
console.log('3판(전부 정답) — 하루 상한 10XP', JSON.stringify(await round(true)));
console.log('배지', await t.S(()=>Object.keys(ME.profile.play.badges)), '| 팝업', await t.S(()=>!document.getElementById('pop').hidden?document.getElementById('pop-t').textContent:'(없음)'));
await t.S(()=>quizClose()); await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); openPlay(); }); await t.sleep(400);
console.log('도감에 퀴즈', await t.S(()=>!!document.getElementById('pg-quiz')), '| 점검: 접근성 role', await t.S(()=>document.getElementById('quiz-sheet').getAttribute('role')));
console.log('errs',t.errs); await t.b.close();
