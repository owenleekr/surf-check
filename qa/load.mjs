import puppeteer from 'puppeteer-core';
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'};
const d=n=>new Date(Date.now()+n*864e5).toISOString().slice(0,10);
const RIDE=[{id:'r1',user_id:'u0',name:'김도훈',cohort:'6기',profile:{},date:d(3),dir:'go',depart_at:'06:00',from_place:'별내역',to_place:'인구리',seats:3,riders:[],note:'',created_at:new Date().toISOString()}];
async function run(mode){
  const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new'});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,140)));
  await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.setRequestInterception(true); let ridesCalls=0, delayMs=0, fail=false, notable=false;
  p.on('request', async r=>{ const u=r.url(), m=r.method(), J=(st,o)=>r.respond({status:st,headers:CORS,contentType:'application/json',body:JSON.stringify(o)});
    if(m==='OPTIONS'&&u.includes('supabase')) return r.respond({status:204,headers:CORS,body:''});
    if(u.includes('rest/v1/rides')&&m==='GET'){ ridesCalls++; if(delayMs) await new Promise(x=>setTimeout(x,delayMs)); if(notable) return J(404,{}); if(fail) return r.abort('failed'); return J(200,RIDE); }
    if(u.includes('rpc/note_box')) return J(200,{inbox:[],sent:[],unread:0});
    if(u.includes('rest/v1/')) return J(200,[]);
    if(/smilecdn|wsbfarm|supabase/.test(u)) return r.abort(); r.continue(); });
  await p.goto('http://localhost:8765/surfshare.html',{waitUntil:'domcontentloaded'});
  await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('lineup.share.invited','1'); localStorage.setItem('lineup.share.onb','1'); localStorage.setItem('lineup.share.news','play1'); localStorage.setItem('lineup.share.me', JSON.stringify({id:'u4',name:'이성현',cohort:'6기',token:'T',profile:{gender:'f',birth:'1'}})); });
  const S=(f)=>p.evaluate(f), sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const snap=()=>S(()=>({ 목록:document.getElementById('rides').textContent.replace(/\s+/g,' ').trim().slice(0,46), 스켈레톤:!!document.querySelector('#rides .skel'), 알림줄:document.getElementById('rides-bar').hidden?'(없음)':document.getElementById('rides-bar').textContent.replace(/\s+/g,' ').trim() }));
  if(mode==='slow'){ delayMs=1500; await p.goto('http://localhost:8765/surfshare.html',{waitUntil:'domcontentloaded'}); await sleep(900); await S(()=>setTab('ride')); await sleep(300); console.log('느린 응답 중   ', JSON.stringify(await snap())); await sleep(2200); console.log('도착 후        ', JSON.stringify(await snap())); }
  if(mode==='flaky'){ await p.goto('http://localhost:8765/surfshare.html',{waitUntil:'networkidle2'}); await sleep(1500); await S(()=>setTab('ride')); await sleep(300); console.log('처음엔 정상    ', JSON.stringify(await snap()));
    fail=true; await S(()=>pullRides()); await sleep(700); console.log('신호 끊김      ', JSON.stringify(await snap()));
    fail=false; await S(()=>document.querySelector('#rides-bar [data-retry]').click()); await sleep(900); console.log('다시 눌러 복구  ', JSON.stringify(await snap())); }
  if(mode==='nofail'){ fail=true; await p.goto('http://localhost:8765/surfshare.html',{waitUntil:'networkidle2'}); await sleep(1500); await S(()=>setTab('ride')); await sleep(300); console.log('처음부터 실패  ', JSON.stringify(await snap())); }
  if(mode==='notable'){ notable=true; await p.goto('http://localhost:8765/surfshare.html',{waitUntil:'networkidle2'}); await sleep(1500); await S(()=>setTab('ride')); await sleep(300); console.log('표 없음(404)   ', JSON.stringify(await snap())); }
  console.log('  errs',errs); await b.close();
}
for(const m of ['slow','flaky','nofail','notable']) await run(m);
