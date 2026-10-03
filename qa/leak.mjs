import { open, dfw } from './mock.mjs';
const surfers=[{id:'u4',name:'이성현',cohort:'6기',profile:{}},{id:'u0',name:'김도훈',cohort:'6기',profile:{}}];
const rides=[{id:'r9',user_id:'u0',name:'김도훈',cohort:'6기',profile:{},date:dfw(3),dir:'go',depart_at:'06:00',from_place:'별내역',to_place:'인구리',seats:3,riders:[],note:'',created_at:new Date().toISOString()}];
const stays=[{id:'s9',user_id:'u0',name:'김도훈',cohort:'6기',profile:{},place:'양양비치콘도',date_from:dfw(1),date_to:dfw(3),capacity:4,guests:[],created_at:new Date().toISOString()}];
const parties=[{id:'p9',user_id:'u0',name:'김도훈',date:dfw(1),beach:'인구',time:'06:00',note:'',joins:[{id:'u0',name:'김도훈',profile:{}}],created_at:new Date().toISOString()}];
const t=await open({surfers,rides,stays,parties},{id:'u4',name:'이성현',profile:{gender:'f',birth:'881102',hair:'bob',hairc:'k'}});
const S=t.S;
await S(()=>{ document.getElementById('pop').hidden=true; });
// 채팅 / 말풍선(surfers upsert)
await S(()=>{ setTab('town'); }); await t.sleep(800);
await S(()=>{ document.getElementById('chat-in').value='안녕'; document.getElementById('chat-send').click(); }); await t.sleep(1500);
// 체크인
await S(()=>{ setTab('home'); document.getElementById('now-btn').click(); }); await t.sleep(800);
// 번개 만들기 + 합류
await S(()=>{ setTab('bolt'); }); await t.sleep(500);
await S(()=>{ const j=document.querySelector('[data-bin]'); j&&j.click(); }); await t.sleep(600);
// 차 타기·숙소 합류
await S(()=>{ setTab('ride'); }); await t.sleep(500);
await S(()=>{ const j=document.querySelector('#rides [data-join], [data-join]'); j&&j.click(); }); await t.sleep(600);
// 꾸미기 저장
await S(()=>{ document.getElementById('bld-fold') && (ME.profile.hair='bun', saveProfile()); }); await t.sleep(1500);
// 훈련 체크, 도감 푸시
await S(()=>{ setTab('home'); document.getElementById('drill-btn').click(); }); await t.sleep(1800);
const bad=t.posts.filter(([tbl,body])=>JSON.stringify(body).includes('birth'));
console.log('서버로 나간 쓰기', t.posts.length, '건:', [...new Set(t.posts.map(p=>p[0].split('?')[0]))].join(', '));
console.log('birth 포함된 쓰기', bad.length, bad.map(b=>b[0]));
const withPlayInRows=t.posts.filter(([tbl,body])=>!tbl.startsWith('surfers') && JSON.stringify(body).includes('"play"'));
console.log('surfers 이외 행에 play 포함', withPlayInRows.length, withPlayInRows.map(b=>b[0]));
console.log('내 surfers 행엔 play 유지', t.posts.some(([tbl,body])=>tbl.startsWith('surfers') && body.profile && body.profile.play));
console.log('로컬 ME 는 birth 보유(재설정용)', await S(()=>!!ME.profile.birth));
console.log('errs', t.errs); await t.b.close();
