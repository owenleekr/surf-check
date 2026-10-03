import puppeteer from 'puppeteer-core';
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'};
const NM=['김도훈','김태은','박초롱','이성현'];
const surfers=NM.map((n,i)=>({id:'u'+i,cohort:'6기',name:n,profile:{gender:i%2?'f':'m'},xp:10*i,level:1,attend:i,rides:i}));
const posts=[];
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new'});
const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
await p.setRequestInterception(true);
p.on('request', r=>{ const u=r.url(), m=r.method(), J=(st,o)=>r.respond({status:st,headers:CORS,contentType:'application/json',body:JSON.stringify(o)});
  if(m==='OPTIONS'&&u.includes('supabase')) return r.respond({status:204,headers:CORS,body:''});
  if(m==='POST'&&u.includes('rest/v1/')){ try{ posts.push([u.split('rest/v1/')[1].split('?')[0], JSON.parse(r.postData())]); }catch(e){} return J(201,[]); }
  if(u.includes('rest/v1/surfers')) return J(200,surfers);
  if(u.includes('rest/v1/')) return J(200,[]);
  if(/smilecdn|wsbfarm|supabase|open-meteo/.test(u)) return r.abort(); r.continue(); });
await p.goto('http://localhost:8765/school.html',{waitUntil:'domcontentloaded'});
await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('lineup.app.invited','2');
  const pr={gender:'f',board:'long',role:'member',cls:'beginner',top:'r',hat:'none',bottom:'b',boardc:'y',hair:'bob',hairc:'k',skin:'s',face:'smile',wear:'rash',pet:'none',petc:'y',birth:'881102'};
  const D={onboarded:true,attend:{},skills:{},missions:{},notes:{},logs:0,sessions:{},lvl:{}};
  localStorage.setItem('surf.users',JSON.stringify({u3:{name:'이성현',cohort:'6기',salt:'x',hash:'y',profile:pr,token:'T'}})); localStorage.setItem('surf.session',JSON.stringify('u3')); localStorage.setItem('surf.data.u3',JSON.stringify(D)); });
await p.goto('http://localhost:8765/school.html',{waitUntil:'networkidle2'}); await new Promise(r=>setTimeout(r,3500));
const S=(f,...a)=>p.evaluate(f,...a), sleep=ms=>new Promise(r=>setTimeout(r,ms));
console.log('로그인', await S(()=>ME&&ME.name));
for(const tab of ['wave','mission','growth','level','rank','gear']){
  await S(t=>document.querySelector(`[data-tab="${t}"]`).click(), tab); await sleep(1100);
  const ok = await S(t=>{ const sec=document.querySelector(`[data-pane="${t}"], #pane-${t}, #tab-${t}`); return sec? (!sec.hidden) : 'n/a'; }, tab);
  console.log(' 탭', tab, ok);
}
await S(()=>document.querySelector('[data-tab="rank"]').click()); await sleep(1200);
await S(()=>{ document.getElementById('mood').value='오늘 파이팅'; document.getElementById('mood-save').click(); }); await sleep(900);
await S(()=>{ document.getElementById('chat-in').value='안녕하세요'; document.getElementById('chat-send').click(); }); await sleep(1200);
await S(()=>{ const c=document.getElementById('ci-btn'); c&&c.click(); }); await sleep(900);
const wrote=posts.map(([t])=>t); console.log('쓰기', [...new Set(wrote)].join(', '));
const leaks=posts.filter(x=>JSON.stringify(x).includes('881102')||JSON.stringify(x).includes('birth'));
console.log('birth 가 나간 쓰기', leaks.length, leaks.map(x=>x[0]));
console.log('채팅 화면', await S(()=>[...document.querySelectorAll('#chat .msg')].map(m=>m.textContent.replace(/\s+/g,' ').trim().slice(0,24))));
console.log('errs',errs); await b.close();
