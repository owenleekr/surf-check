import { open, iso } from './mock.mjs';
const drills=[1,2].map(n=>({user_id:'u4',name:'이성현',day:iso(n)}));
const surfers=[{id:'u4',name:'이성현',cohort:'6기',profile:{}}];
const play={base:40,bonus:0,badges:{drill1:1},qd:{},qall:0,best:0,gday:'',gxp:0,gn:{},lvSeen:0,xp:40,lv:0};
// 기존 사용자(도감 데이터 있음, 소식 안 봄)
const t=await open({surfers,drills},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',play}},{wait:3000});
console.log('소식 팝업', await t.S(()=>({ 보임:!document.getElementById('pop').hidden, 제목:document.getElementById('pop-t').textContent, 버튼:document.getElementById('pop-go').hidden?'(없음)':document.getElementById('pop-go').textContent })));
await t.S(()=>document.getElementById('pop-go').click()); await t.sleep(700);
console.log('도감 열림', await t.S(()=>({ 시트:!document.getElementById('play-sheet').hidden, 팝업닫힘:document.getElementById('pop').hidden })));
await t.S(()=>closePlay());
// 새로고침해도 소식은 다시 안 뜬다
await t.p.reload({waitUntil:'networkidle2'}); await t.sleep(2500);
console.log('재방문 소식', await t.S(()=>!document.getElementById('pop').hidden ? document.getElementById('pop-t').textContent : '(없음)'));
await t.S(()=>{ document.getElementById('pop').hidden=true; });
// 온보딩 전 단계 훑기
await t.S(()=>onbStart()); const out=[];
const NN = await t.S(()=>ONB.length);
for(let i=0;i<NN;i++){
  await t.sleep(250);
  out.push(await t.S(()=>{ const st=ONB[onbI]; const el=document.getElementById(st.at); const r=el&&el.getBoundingClientRect(); return `${onbI+1}. ${st.t} | 대상=${st.at} ${el?(el.offsetParent||el===document.body?'보임':'숨김'):'없음'} | 탭=${state.tab}`; }));
  await t.S(()=>document.getElementById('onb-next').click());
}
console.log(out.join('\n')); console.log('끝난 뒤 온보딩 닫힘', await t.S(()=>document.getElementById('onb').hidden));
console.log('errs',t.errs); await t.b.close();
