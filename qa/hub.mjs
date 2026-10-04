import { open, iso } from './mock.mjs';
import fs from 'fs';
const surfers=['김도훈','김태은','이성현'].map((n,i)=>({id:'u'+i,name:n,cohort:'6기',profile:{play:{xp:100+i*90,best:60*i}}}));
const drills=[1,2,3].map(n=>({user_id:'u4',name:'이성현',day:iso(n)}));
const play={base:240,bonus:20,badges:{drill1:1,streak3:1},qd:{},qall:0,best:180,gday:'',gxp:0,gn:{},lvSeen:2,xp:260,lv:2,shells:34,spent:0,own:{},stamps:{'낙산':'2026-10-01'}};
for(const W of [390,320]){
  const t=await open({surfers:[...surfers,{id:'u4',name:'이성현',cohort:'6기',profile:{}}],drills},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1,play}},{width:W,wait:2800});
  await t.S(()=>{ for(let i=0;i<4;i++) if(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(500);
  await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); document.getElementById('t-play').click(); }); await t.sleep(900);
  console.log(W, await t.S(()=>({ 탭:state.tab, 카드:[...document.querySelectorAll('.hubcard')].map(c=>c.querySelector('b').textContent+'('+c.querySelector('small').textContent+')'), 탭버튼수:document.querySelectorAll('#nav button').length, 가로넘침:document.documentElement.scrollWidth-innerWidth, 탭버튼폭:Math.round(document.getElementById('t-play').getBoundingClientRect().width), 점:document.getElementById('play-dot').hidden })));
  if(W===390){
    fs.writeFileSync('/tmp/hub.png', await t.p.screenshot({fullPage:true}));
    // 라우팅
    const go=async(k)=>{ await t.S(()=>setTab('play')); await t.sleep(300); await t.S(k=>document.querySelector(`[data-hub="${k}"]`).click(), k); await t.sleep(500); return t.S(()=>({ 시트:!document.getElementById('play-sheet').hidden, 시트탭:document.getElementById('play-body').dataset.tab, 게임:!document.getElementById('game').hidden, 퀴즈:!document.getElementById('quiz-sheet').hidden, 탭:state.tab, 꾸미기열림:document.getElementById('bld-fold').open })); };
    for(const k of ['game','quiz','stamp','rank','shop','emote']){ console.log(' 카드', k, JSON.stringify(await go(k))); await t.S(()=>{ gameClose(); quizClose(); closePlay(); }); }
    await t.S(()=>setTab('play')); await t.sleep(300); await t.S(()=>document.querySelector('[data-hub="fort"]').click()); await t.sleep(500);
    console.log(' 운세 열기', await t.S(()=>({ 운세:!!document.querySelector('#play-hub .fort'), xp:ME.profile.play.xp })));
    await t.S(()=>document.querySelector('[data-hub="fort"]').click()); await t.sleep(300); console.log(' 다시 누르면 접힘', await t.S(()=>!document.querySelector('#play-hub .fort')));
    await t.S(()=>{ setTab('home'); document.getElementById('prof-lv').click(); }); await t.sleep(400); console.log(' 홈 이름줄 → ', await t.S(()=>state.tab));
  }
  console.log(' errs',t.errs); await t.b.close(); process.exit(0);
}
