import puppeteer from 'puppeteer-core';
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'};
const d=n=>new Date(Date.now()+n*864e5).toISOString().slice(0,10);
const now=()=>new Date().toISOString();
const DB={ surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}},{id:'u0',name:'김도훈',cohort:'6기',profile:{}},{id:'u2',name:'박초롱',cohort:'6기',profile:{}}],
  rides:[{id:'r1',user_id:'u0',name:'김도훈',cohort:'6기',profile:{},date:d(3),dir:'go',depart_at:'06:00',from_place:'별내역',to_place:'인구리',seats:3,riders:[],note:'',created_at:now()}],
  stays:[{id:'s1',user_id:'u0',name:'김도훈',cohort:'6기',profile:{},place:'양양비치콘도',date_from:d(1),date_to:d(3),capacity:2,guests:[],created_at:now()}],
  parties:[{id:'p1',user_id:'u0',name:'김도훈',date:d(1),beach:'인구',time:'06:00',note:'',joins:[{id:'u0',name:'김도훈',profile:{}}],created_at:now()}] };
const posts=[]; const patches=[];
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new'});
const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,160))); p.on('console',m=>{ if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text())) errs.push('console:'+m.text().slice(0,140)); });
await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
await p.setRequestInterception(true);
p.on('request', r=>{ const u=r.url(), m=r.method(), J=(st,o)=>r.respond({status:st,headers:CORS,contentType:'application/json',body:JSON.stringify(o)});
  if(m==='OPTIONS'&&u.includes('supabase')) return r.respond({status:204,headers:CORS,body:''});
  const mm=u.match(/rest\/v1\/(rides|stays|parties|surfers)(\?.*)?$/);
  if(mm){ const [_,tbl,qs]=mm; const q=new URLSearchParams(qs||''); const idq=q.get('id');
    if(m==='GET'){ const rows=DB[tbl]; if(idq){ const id=idq.replace('eq.',''); const row=rows.find(x=>x.id===id); const sel=q.get('select'); return J(200,row?[sel&&sel!=='*'?Object.fromEntries(sel.split(',').map(k=>[k,row[k]])):row]:[]); } return J(200,rows); }
    if(m==='PATCH'){ const id=idq.replace('eq.',''); const row=DB[tbl].find(x=>x.id===id); const body=JSON.parse(r.postData()); Object.assign(row,body); patches.push([tbl,id,body]); return J(200,[row]); }
    if(m==='POST'){ const body=JSON.parse(r.postData()); posts.push([tbl,body]); if(tbl!=='surfers') DB[tbl].push({created_at:now(),...body}); return J(201,[]); } }
  if(m==='POST'&&u.includes('rest/v1/')){ try{ posts.push([u.split('rest/v1/')[1],JSON.parse(r.postData())]); }catch(e){} return J(201,[]); }
  if(u.includes('rpc/note_box')) return J(200,{inbox:[],sent:[],unread:0});
  if(u.includes('rest/v1/')) return J(200,[]);
  if(/smilecdn|wsbfarm|supabase/.test(u)) return r.abort(); r.continue(); });
await p.goto('http://localhost:8765/surfshare.html',{waitUntil:'domcontentloaded'});
await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('lineup.share.invited','1'); localStorage.setItem('lineup.share.onb','1'); localStorage.setItem('lineup.share.me', JSON.stringify({id:'u4',name:'이성현',cohort:'6기',token:'T',profile:{gender:'f',birth:'881102'}})); });
await p.goto('http://localhost:8765/surfshare.html',{waitUntil:'networkidle2'}); await new Promise(r=>setTimeout(r,2000));
const S=(f,...a)=>p.evaluate(f,...a), sleep=ms=>new Promise(r=>setTimeout(r,ms));
await S(()=>{ document.getElementById('pop').hidden=true; });
const ids=l=>l.map(x=>x.id).join(',');
// ① 차량: 화면은 빈 목록, 그 사이 서버엔 박초롱이 먼저 탐
await S(()=>setTab('ride')); await sleep(600);
DB.rides[0].riders=[{id:'u2',name:'박초롱',profile:{}}];
await S(()=>document.querySelector('[data-join="r1"]').click()); await sleep(900);
console.log('① 차 동시 합류 → 서버 riders =', ids(DB.rides[0].riders), ids(DB.rides[0].riders).includes('u2')&&ids(DB.rides[0].riders).includes('u4')?'✅ 둘 다 남음':'❌ 한 명 사라짐');
// 빼기
await S(()=>document.querySelector('[data-leave="r1"]').click()); await sleep(900);
console.log('   빼기 후 =', ids(DB.rides[0].riders), ids(DB.rides[0].riders)==='u2'?'✅ 남의 자리는 그대로':'❌');
// ② 숙소: 정원 2, 화면은 빈 목록, 서버엔 이미 2명 → 그새 자리가 찼다
await S(()=>setTab('stay')); await sleep(600);
DB.stays[0].guests=[{id:'u0',name:'김도훈',profile:{}},{id:'u2',name:'박초롱',profile:{}}];
await S(()=>document.querySelector('[data-join="s1"]').click()); await sleep(900);
console.log('② 숙소 정원 초과 → 서버 guests =', ids(DB.stays[0].guests), ids(DB.stays[0].guests).includes('u4')?'❌ 정원 넘어 들어감':'✅ 막힘', '토스트:', await S(()=>document.getElementById('toast').textContent));
// ③ 번개
await S(()=>setTab('bolt')); await sleep(600);
DB.parties[0].joins.push({id:'u2',name:'박초롱',profile:{}});
await S(()=>document.querySelector('[data-bin="p1"]').click()); await sleep(900);
console.log('③ 번개 동시 합류 → joins =', ids(DB.parties[0].joins), ['u0','u2','u4'].every(x=>ids(DB.parties[0].joins).includes(x))?'✅':'❌');
await S(()=>document.querySelector('[data-bout="p1"]').click()); await sleep(900);
console.log('   번개 빼기 후 =', ids(DB.parties[0].joins), ids(DB.parties[0].joins)==='u0,u2'?'✅':'❌');
// ④ 올리기 3종
await S(()=>setTab('ride')); await sleep(300);
await S(()=>{ document.getElementById('r-date').value=new Date(Date.now()+5*864e5).toISOString().slice(0,10); document.getElementById('r-from').value='잠실역'; document.getElementById('r-to').value='인구리'; document.getElementById('r-save').click(); }); await sleep(900);
await S(()=>setTab('bolt')); await sleep(300);
await S(()=>{ document.getElementById('b-note').value='선셋'; document.getElementById('b-save').click(); }); await sleep(900);
await S(()=>setTab('stay')); await sleep(300);
await S(()=>{ document.getElementById('s-place').value='테스트펜션'; document.getElementById('s-save').click(); }); await sleep(900);
console.log('④ 올린 것', posts.filter(([t])=>['rides','parties','stays'].includes(t)).map(([t])=>t).join(','), '| 오류문구:', await S(()=>['r-err','s-err','b-err'].map(i=>document.getElementById(i)?.textContent||'').filter(Boolean).join(' / ')||'(없음)'));
const bad=[...posts,...patches].filter(x=>JSON.stringify(x).includes('birth')||JSON.stringify(x).includes('"play"')&&x[0]!=='surfers');
console.log('⑤ birth/play 가 공개 행으로 나간 쓰기', bad.length);
console.log('errs',errs); await b.close();
