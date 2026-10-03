import { open, iso } from './mock.mjs';
const evil='<img src=x onerror="window.__pwned=(window.__pwned||0)+1">';
const surfers=[{id:'u4',name:'이성현',cohort:'6기',profile:{}},
  {id:'u1',name:'공격자',cohort:'6기',profile:{play:{xp:evil,lv:evil,best:evil}}},
  {id:'u2',name:'과대값',cohort:'6기',profile:{play:{xp:1e12,lv:99,best:1e15}}},
  {id:'u3',name:'음수',cohort:'6기',profile:{play:{xp:-500,lv:-3,best:-9}}}];
const t=await open({surfers,drills:[]},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1'}},{wait:2500});
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); });
await t.S(()=>{ openPlay(); }); await t.sleep(700);
await t.S(()=>{ closePlay(); setTab('town'); }); await t.sleep(1500);
await t.S(()=>document.querySelector('.vp[data-id="u1"]')?.click()); await t.sleep(300);
await t.S(()=>{ openPlay(); document.querySelector('[data-rk="best"]').click(); }); await t.sleep(500);
console.log('주입 실행 횟수(0이어야 안전)', await t.S(()=>window.__pwned||0));
console.log('도감 순위 행', await t.S(()=>[...document.querySelectorAll('.prk')].map(r=>r.textContent.replace(/\s+/g,' ').trim())));
console.log('마을 레벨 배지', await t.S(()=>[...document.querySelectorAll('.vp')].map(v=>v.querySelector('.nm').textContent+':'+(v.querySelector('.vlv')?.textContent||'-'))));
console.log('errs',t.errs); await t.b.close();
