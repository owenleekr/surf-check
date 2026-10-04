import puppeteer from 'puppeteer-core';
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'};
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new'});
const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,140)));
await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
await p.setRequestInterception(true); let net=true;
p.on('request', r=>{ const u=r.url(), J=(o)=>r.respond({status:200,headers:CORS,contentType:'application/json',body:JSON.stringify(o)});
  if(!u.startsWith('http://localhost')){ if(!net && r.method()!=='OPTIONS') return r.abort('internetdisconnected'); if(!net) return r.abort('internetdisconnected'); if(r.method()==='OPTIONS') return r.respond({status:204,headers:CORS,body:''}); if(u.includes('rpc/note_box')) return J({inbox:[],sent:[],unread:0}); if(u.includes('supabase')) return J([]); return r.abort(); }
  r.continue(); });
await p.goto('http://localhost:8765/surfshare.html',{waitUntil:'domcontentloaded'});
await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('lineup.share.invited','1'); localStorage.setItem('lineup.share.onb','1'); localStorage.setItem('lineup.share.news','play1'); localStorage.setItem('lineup.share.me', JSON.stringify({id:'u4',name:'이성현',cohort:'6기',token:'T',profile:{gender:'f',birth:'1',dressed:1}})); });
await p.goto('http://localhost:8765/surfshare.html',{waitUntil:'networkidle2'}); await new Promise(r=>setTimeout(r,2500));
console.log('SW 등록', await p.evaluate(async()=>{ const r=await navigator.serviceWorker?.getRegistration(); return r? (r.active?'active':'installing'):'(없음)'; }));
net=false; const cdp=await p.createCDPSession(); await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
let ok=true; try{ await p.reload({waitUntil:'domcontentloaded',timeout:15000}); }catch(e){ ok=false; console.log('오프라인 새로고침 실패:', e.message.slice(0,80)); }
await new Promise(r=>setTimeout(r,3500));
if(ok) console.log('오프라인 화면', JSON.stringify(await p.evaluate(()=>({ 메인:!document.getElementById('main').hidden, 이름:document.getElementById('who')?.textContent, 오프라인배너:!!document.getElementById('offbar') && !document.getElementById('offbar').hidden, 홈보임:!document.getElementById('pane-home').hidden, 체크인카드:document.getElementById('now-t').textContent }))));
await p.screenshot({path:'/tmp/offline.png'});
console.log('errs',errs); await b.close();

