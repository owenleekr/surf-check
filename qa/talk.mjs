import { open } from './mock.mjs';
const snap=(await import('../api/_naver-snapshot.js')).default;
const now=Date.now();
const fresh={...snap.folders[0].items[0], t:now-2*3600e3};                        // 2시간 전에 들어온 가게
const food={...snap.folders[0], items:[fresh, ...snap.folders[0].items.slice(1)]};
const spot=snap.folders.find(f=>f.kind==='spot');
const play=(best,bat)=>({ xp:100, best, bat });
const surfers=[
  {id:'u4',name:'이성현',cohort:'6기',profile:{},play:null},
  {id:'infinagree',name:'오웬',cohort:'6기',profile:{},play:null},
  {id:'u0',name:'김도훈',cohort:'6기',profile:{play:play(777,now-3600e3)},play:play(777,now-3600e3)},
  {id:'u1',name:'<img src=x onerror=window.__f=1>',cohort:'open',profile:{},play:play(450,now-5*3600e3)},
  {id:'u2',name:'옛날',cohort:'6기',profile:{},play:play(900,now-30*864e5)},          // 오래된 기록 — 안 나와야
];
const fid=String(fresh.id);
const talk=[
  { id:'u0|1', target:`food:${fid}`, parent:null, user_id:'u0', name:'김도훈', cohort:'6기', text:'<b>갈비</b> 최고 <img src=x onerror=window.__f=2>', created_at:new Date(now-3600e3).toISOString() },
  { id:'u1|2', target:`food:${fid}`, parent:'u0|1', user_id:'u1', name:'서퍼A', cohort:'open', text:'저도요!', created_at:new Date(now-1800e3).toISOString() },
  { id:'u0|3', target:'req:food', parent:null, user_id:'u0', name:'김도훈', cohort:'6기', title:'새가게', link:'javascript:window.__f=3', text:'가보고 싶어요', created_at:new Date(now-900e3).toISOString() },
  { id:'u1|4', target:'req:food', parent:null, user_id:'u1', name:'서퍼A', cohort:'open', title:snap.folders[0].items[1].n, link:null, text:null, created_at:new Date(now-800e3).toISOString() },
];
const reacts=[{ id:`u0|ft:p:food:${fid}|👍`, user_id:'u0', name:'김도훈', target:`ft:p:food:${fid}`, emo:'👍' }];
const t=await open({surfers,place_talk:talk,reacts,__naver:{folders:[food,spot]}},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1}},{wait:3500});
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); }); await t.sleep(300);
const feeds=[]; for(let k=0;k<7;k++){ feeds.push(await t.S(()=>({ 보임:!document.getElementById('feed').hidden, 글:document.getElementById('feed-t').textContent, 새소식:document.getElementById('feed-n').textContent, go:document.getElementById('feed').dataset.go }))); await t.sleep(5400); }
console.log('소식줄', [...new Set(feeds.map(f=>f.글))]);
console.log('이동 대상', [...new Set(feeds.map(f=>f.go))], '| 새 소식 배지', feeds[0].새소식, '| 옛 기록 노출', feeds.some(f=>/옛날/.test(f.글)), '| 주입', await t.S(()=>window.__f||0));
await t.S(()=>setTab('food')); await t.sleep(900);
console.log('맛집 탭', await t.S(()=>({ 카드:document.querySelectorAll('.food-card').length, 추천버튼:document.querySelectorAll('[data-rx]').length, 첫카드추천:document.querySelector('.food-card [data-rx$="👍"]')?.textContent.replace(/\s+/g,' ').trim(), 요청섹션:!!document.querySelector('.ft-req') })));
// 댓글 펼치기(가장 위 카드 = 가까운 순이라 fresh 가 아닐 수 있다 — 해당 카드를 찾아서)
await t.S((fid)=>{ document.querySelector(`[data-tg="food:${fid}"]`).click(); }, fid); await t.sleep(300);
console.log('스레드', await t.S(()=>({ 댓글:[...document.querySelectorAll('.ft-th .ft-c')].map(c=>c.textContent.replace(/\s+/g,' ').trim().slice(0,60)), 기수태그:[...document.querySelectorAll('.ft-th .ft-co')].map(x=>x.textContent), 주입:window.__f||0, img:document.querySelectorAll('.ft-th img').length })));
// 공감 토글
await t.S(()=>document.querySelector('.ft-th [data-rx$="|1"][data-emo="❤️"], .ft-th [data-emo="❤️"]').click()); await t.sleep(300);
console.log('공감 눌림', await t.S(()=>[...document.querySelectorAll('.ft-th [data-emo="❤️"]')].map(b=>b.getAttribute('aria-pressed')+':'+b.textContent.replace(/\s+/g,' ').trim())), '| POST', JSON.stringify(t.posts.filter(p=>p[0]==='reacts').map(p=>p[1].target+'/'+p[1].emo)));
// 대댓글
await t.S(()=>document.querySelector('.ft-th [data-reply]').click()); await t.sleep(300);
await t.S(()=>{ const i=document.querySelector('.ft-th [data-draft]'); i.value='저도 먹고 싶다'; i.dispatchEvent(new Event('input',{bubbles:true})); }); 
await t.S(()=>document.querySelector('.ft-th [data-send]').click()); await t.sleep(400);
const post=t.posts.filter(p=>p[0]==='place_talk').pop()?.[1];
console.log('답글 POST', post && { target:post.target, parent:post.parent, cohort:post.cohort, name:post.name, text:post.text });
console.log('답글 화면', await t.S(()=>[...document.querySelectorAll('.ft-th .ft-c.re')].map(c=>c.textContent.replace(/\s+/g,' ').trim().slice(0,50))));
// 내 글 지우기
await t.S(()=>{ window.confirm=()=>true; document.querySelector('.ft-th [data-del]').click(); }); await t.sleep(400);
console.log('지움', t.posts.length >= 0, await t.S(()=>document.querySelectorAll('.ft-th .ft-c.re').length));
// 요청
await t.S(()=>window.scrollTo(0,0));
console.log('요청 목록(올라간 건 빠져야)', await t.S(()=>[...document.querySelectorAll('.ft-req .ft-c')].map(c=>c.querySelector('b').textContent)));
console.log('요청 링크', await t.S(()=>[...document.querySelectorAll('.ft-req .ft-c a')].map(a=>a.getAttribute('href').slice(0,50))));
await t.S(()=>document.querySelector('[data-rqopen="food"]').click()); await t.sleep(200);
const setRq=(k,v)=>t.S((k,v)=>{ const i=document.querySelector(`.ft-form [data-rq="${k}"]`); i.value=v; i.dispatchEvent(new Event('input',{bubbles:true})); },k,v);
await setRq('title','테스트식당'); await setRq('link','https://evil.example.com/x');
await t.S(()=>document.querySelector('[data-rqsend]').click()); await t.sleep(300);
console.log('나쁜 링크 → 토스트', await t.S(()=>document.getElementById('toast')?.textContent || document.querySelector('.toast')?.textContent), '| 요청 POST 수', t.posts.filter(p=>p[0]==='place_talk'&&p[1].target==='req:food').length);
await t.sleep(3100); await setRq('link','https://naver.me/abcd'); await t.S(()=>document.querySelector('[data-rqsend]').click()); await t.sleep(400);
console.log('요청 POST', JSON.stringify(t.posts.filter(p=>p[0]==='place_talk'&&p[1].target==='req:food').map(p=>({title:p[1].title,link:p[1].link,cohort:p[1].cohort}))));
// 가이드
await t.S(()=>document.querySelector('[data-guide="food"]').click()); await t.sleep(300);
console.log('가이드', await t.S(()=>({ 보임:!document.getElementById('food-guide').hidden, 단계:document.querySelectorAll('#food-guide .gd-st li').length, 제목:document.querySelector('#food-guide .gd-st li').textContent.slice(0,30) })));
await t.S(()=>document.querySelector('#food-guide [data-gk="spot"]').click()); await t.sleep(200);
console.log('스팟 가이드 폴더명', await t.S(()=>/양서학 서핑 스팟 리스트/.test(document.getElementById('food-guide-body').textContent)));
await t.S(()=>document.querySelector('#food-guide [data-gclose]').click());
// 스팟 탭
await t.S(()=>document.querySelector('#food-seg [data-view="spot"]').click()); await t.sleep(500);
await t.S(()=>document.querySelector('[data-tg^="spot:"]').click()); await t.sleep(300);
console.log('스팟 댓글 열림', await t.S(()=>({ 입력칸:!!document.querySelector('.ft-th [data-draft]'), 요청버튼:!!document.querySelector('[data-rqopen="spot"]'), 캠카드id:[...document.querySelectorAll('[data-tg^="spot:cam-"]')].length })));
await t.S(()=>setTab('home')); await t.sleep(600); (await import('fs')).writeFileSync('/tmp/home-feed.png', await t.p.screenshot());
console.log('주입', await t.S(()=>window.__f||0), 'errs', t.errs);
await t.b.close(); process.exit(0);
