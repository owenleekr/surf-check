import puppeteer from 'puppeteer-core';
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'};
const posts=[]; const rpcs=[];
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new'});
const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,160))); p.on('console',m=>{ if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text())) errs.push('console:'+m.text().slice(0,140)); });
await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
await p.setRequestInterception(true);
p.on('request', r=>{ const u=r.url(), m=r.method(), J=(st,o)=>r.respond({status:st,headers:CORS,contentType:'application/json',body:JSON.stringify(o)});
  if(m==='OPTIONS'&&u.includes('supabase')) return r.respond({status:204,headers:CORS,body:''});
  if(u.includes('rpc/verify_cohort')){ rpcs.push('verify_cohort'); return J(200,true); }
  if(u.includes('rpc/signup')){ rpcs.push('signup:'+JSON.stringify(JSON.parse(r.postData()).p_profile).includes('881102')); return J(200,'tok123'); }
  if(u.includes('rpc/note_box')) return J(200,{inbox:[],sent:[],unread:0});
  if(m==='POST'&&u.includes('rest/v1/')){ try{ posts.push([u.split('rest/v1/')[1].split('?')[0], JSON.parse(r.postData())]); }catch(e){} return J(201,[]); }
  if(u.includes('rest/v1/')) return J(200,[]);
  if(/smilecdn|wsbfarm|supabase|open-meteo/.test(u)) return r.abort(); r.continue(); });
await p.goto('http://localhost:8765/surfshare.html',{waitUntil:'domcontentloaded'});
await p.evaluate(()=>{ localStorage.clear(); });
await p.goto('http://localhost:8765/surfshare.html',{waitUntil:'networkidle2'}); await new Promise(r=>setTimeout(r,1200));
const S=(f,...a)=>p.evaluate(f,...a), sleep=ms=>new Promise(r=>setTimeout(r,ms));
console.log('① 문', await S(()=>({ 문:!document.getElementById('gate').hidden, 로그인:document.getElementById('login').hidden })));
await p.screenshot({path:'/tmp/su_gate.png'});
await S(()=>{ document.getElementById('gate-code').value='test'; document.getElementById('gate-ok').click(); }); await sleep(900);
console.log('   쪽지 버튼(로그인 전)', await S(()=>getComputedStyle(document.getElementById('mail')).display));
console.log('② 비번 통과 후', await S(()=>({ 로그인보임:!document.getElementById('login').hidden, 모드:document.getElementById('m-new').getAttribute('aria-pressed')==='true'?'새 계정':'로그인', 명단수:document.getElementById('uroster').options.length })));
await S(()=>{ document.getElementById('uid').value='newbie1'; const s=document.getElementById('uroster'); s.selectedIndex=2; s.dispatchEvent(new Event('change')); document.getElementById('ubirth').value='881102'; document.getElementById('upw').value='1234'; document.getElementById('agree').checked=true; }); await sleep(300);
await p.screenshot({path:'/tmp/su_form.png'});
await S(()=>document.getElementById('go').click()); await sleep(3500);
console.log('③ 입장 후', JSON.stringify(await S(()=>({ 메인:!document.getElementById('main').hidden, 이름:document.getElementById('who').textContent, 레벨칩:document.getElementById('lv-chip').textContent, 온보딩:!document.getElementById('onb').hidden, 팝업:!document.getElementById('pop').hidden?document.getElementById('pop-t').textContent:'(없음)', 로컬ME에birth:!!ME.profile.birth }))));
console.log('④ 서버 호출', rpcs.join(' | '), '| 공개 표 쓰기:', [...new Set(posts.map(x=>x[0]))].join(','), '| birth 포함:', posts.filter(x=>JSON.stringify(x).includes('881102')).length);
await p.screenshot({path:'/tmp/su_in.png'});
console.log('   쪽지 버튼(로그인 후)', await S(()=>getComputedStyle(document.getElementById('mail')).display));
console.log('errs',errs); await b.close();
