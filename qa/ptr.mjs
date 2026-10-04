import { open, dfw } from './mock.mjs';
const rides=[{id:'r1',user_id:'u0',name:'김도훈',cohort:'6기',profile:{},date:dfw(2),dir:'go',depart_at:'06:00',from_place:'별내역',to_place:'인구리',seats:3,riders:[],note:'',created_at:new Date().toISOString()}];
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}],rides},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1,play:{base:50,bonus:0,badges:{drill1:1},qd:{},qall:0,best:0,gday:'',gxp:0,gn:{},lvSeen:1,xp:50,lv:1}}},{wait:2500});
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(400);
let ridesGets=0; t.p.on('request',r=>{ if(r.url().includes('rest/v1/rides')&&r.method()==='GET') ridesGets++; });
const cdp=await t.p.createCDPSession();
const drag=async(x,y1,y2,steps=8)=>{ await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y1}]}); for(let i=1;i<=steps;i++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y1+(y2-y1)*i/steps}]}); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); };
await t.S(()=>setTab('ride')); await t.sleep(500);
console.log('탭 전환 연출', await t.S(()=>({ 클래스:document.getElementById('pane-ride').classList.contains('tin'), dx:document.getElementById('pane-ride').style.getPropertyValue('--dx'), 아이콘애니:getComputedStyle(document.querySelector('#t-ride i')).animationName })));
// 1) 짧게 끌기 — 새로고침 안 함
let g0=ridesGets; await drag(200,200,240); await t.sleep(600); console.log('짧게 끌기(40px) → 요청 증가', ridesGets-g0, '(0)');
// 2) 충분히 끌기
g0=ridesGets; await drag(200,200,330); await t.sleep(300);
console.log('끄는 중/직후', await t.S(()=>({ 표시:document.getElementById('ptr').classList.contains('on'), 글:document.getElementById('ptr').textContent.trim() })));
await t.sleep(1500); console.log('충분히 끌기(130px) → 요청 증가', ridesGets-g0, '(1+) | 토스트', await t.S(()=>document.getElementById('toast').textContent), '| 표시 사라짐', await t.S(()=>!document.getElementById('ptr').classList.contains('on')));
// 3) 스크롤된 상태에서는 안 됨
await t.S(()=>{ document.body.style.minHeight='3000px'; window.scrollTo(0,300); }); await t.sleep(200);
g0=ridesGets; await drag(200,200,340); await t.sleep(600); console.log('스크롤된 상태 → 요청 증가', ridesGets-g0, '(0)');
await t.S(()=>window.scrollTo(0,0)); await t.sleep(200);
// 4) 도감 시트 위에서는 안 됨
await t.S(()=>openPlay()); await t.sleep(300); g0=ridesGets; await drag(200,300,430); await t.sleep(600); console.log('도감 시트 위 → 요청 증가', ridesGets-g0, '(0)'); await t.S(()=>closePlay());
// 5) 움직임 줄이기
await t.p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
await t.S(()=>{ document.getElementById('pane-stay').classList.remove('tin'); setTab('stay'); }); await t.sleep(300);
console.log('움직임 줄이기 → 슬라이드 클래스', await t.S(()=>document.getElementById('pane-stay').classList.contains('tin')), '(false)');
console.log('errs',t.errs); await t.b.close(); process.exit(0);
