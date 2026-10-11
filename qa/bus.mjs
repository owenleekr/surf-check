import { open, dfw } from './mock.mjs';
const evil='<img src=x onerror=window.__b=1>';
const fut=(h)=>{ const d=new Date(Date.now()+h*36e5); return { date:new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10), t:d.toTimeString().slice(0,5) }; };
const a=fut(5), b=fut(30), past=fut(-3);
const mk=(id,dir,when,seats,extra={})=>({id,user_id:'u0',name:'김도훈',cohort:'6기',profile:{},date:when.date,dir,depart_at:when.t,from_place:dir==='bus_in'?'동서울':'양양',to_place:dir==='bus_in'?'양양':'동서울',seats,riders:[],note:null,created_at:new Date(Date.now()-5*6e4).toISOString(),...extra});
const rides=[{id:'c1',user_id:'u0',name:'김도훈',cohort:'6기',profile:{},date:dfw(2),dir:'go',depart_at:'06:00',from_place:'별내역',to_place:'인구리',seats:3,riders:[],note:'',created_at:new Date().toISOString()},
  mk('b1','bus_out',a,3), mk('b2','bus_in',b,2,{note:evil,name:evil}), mk('b3','bus_out',past,4)];
const t=await open({surfers:[{id:'u4',name:'테스터',cohort:'6기',profile:{}}],rides},{id:'u4',name:'테스터',profile:{gender:'f',birth:'1',dressed:1}},{wait:3000});
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); setTab('ride'); }); await t.sleep(600);
const patches=[]; t.p.on('request',r=>{ if(r.method()==='PATCH'&&r.url().includes('rest/v1/rides')) patches.push(r.postData()); });
console.log('카풀 목록(버스 제외)', await t.S(()=>document.querySelectorAll('#rides .card').length), '| 상태', await t.S(()=>({car:state.rides.length,bus:state.bus.length})));
await t.S(()=>document.querySelector('#ride-seg [data-view="bus"]').click()); await t.sleep(500);
console.log('버스 보드', await t.S(()=>({ 카드:document.querySelectorAll('.bus-card').length, 카풀목록숨김:getComputedStyle(document.getElementById('rides')).display,카풀폼숨김:getComputedStyle(document.querySelector('#pane-ride > details')).display, 링크:[...document.querySelectorAll('.bus-hd a')].map(a=>a.getAttribute('href')), 첫카드:document.querySelector('.bus-card').textContent.replace(/\s+/g,' ').trim().slice(0,70) })));
console.log('악성 주입', await t.S(()=>window.__b||0));
// 제보: 지난 시각 거부
await t.S(()=>{ const d=document.getElementById('bus-form'); d.open=true; document.getElementById('bs-date').value=today(); document.getElementById('bs-time').value='00:01'; document.getElementById('bs-save').click(); }); await t.sleep(300);
console.log('지난 시각', await t.S(()=>document.getElementById('bs-err').textContent), '| 쓰기', t.posts.filter(([x])=>x.startsWith('rides')).length);
await t.S((d,tm)=>{ document.getElementById('bs-dir').value='bus_in'; document.getElementById('bs-date').value=d; document.getElementById('bs-time').value=tm; document.getElementById('bs-seats').value='4'; const b=document.getElementById('bs-save'); b.click(); b.click(); }, a.date, a.t); await t.sleep(900);
const posted=t.posts.filter(([x])=>x.startsWith('rides')).map(([,b])=>b);
console.log('제보 쓰기', posted.length, '(1)', posted[0]&&JSON.stringify({dir:posted[0].dir,seats:posted[0].seats,from:posted[0].from_place,to:posted[0].to_place}), '| birth', JSON.stringify(posted).includes('birth')?'❌':'없음 ✅');
// 다 찼어요
await t.S(()=>document.querySelector('[data-full]').click()); await t.sleep(500); console.log('다 찼어요 PATCH', patches);
// 알림: 켜고 새 제보 도착 시뮬레이션
await t.S(()=>{ document.getElementById('bw-on').click(); }); await t.sleep(200);
await t.S((r)=>{ state.bus.push(r); localStorage.setItem('lineup.share.busseen','[]'); busCheck(); }, mk('b9','bus_out',fut(8),2,{user_id:'u7',name:'박초롱'})); await t.sleep(300);
console.log('알림 토스트', await t.S(()=>document.getElementById('toast').textContent));
const before=await t.S(()=>document.getElementById('toast').textContent); await t.S(()=>{ document.getElementById('toast').textContent=''; busCheck(); }); console.log('같은 제보는 다시 안 알림', await t.S(()=>document.getElementById('toast').textContent==='' ? '✅' : '❌'));
console.log('errs',t.errs); await t.b.close(); process.exit(0);
