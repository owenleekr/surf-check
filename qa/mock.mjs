import puppeteer from 'puppeteer-core';
const PAGE = process.env.BASE ? process.env.BASE+'/surfshare' : 'http://localhost:8765/surfshare.html';
export const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'};
export const iso=n=>new Date(Date.now()-n*864e5-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
export const dfw=n=>new Date(Date.now()+n*864e5).toISOString().slice(0,10);
/* data: {surfers,drills,rides,stays,parties,chat,reacts}; me: {id,name,profile}; opts: {width,hour} */
export async function open(data, me, opts={}){
  const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new'});
  const p=await b.newPage(); const errs=[]; const posts=[];
  p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
  p.on('console',m=>{ if(m.type()==='error' && !/Failed to load resource|net::ERR/.test(m.text())) errs.push('console:'+m.text().slice(0,140)); });
  await p.setViewport({width:opts.width||390,height:opts.height||844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.setRequestInterception(true);
  p.on('request', r=>{ const u=r.url(), m=r.method(), J=(st,o)=>r.respond({status:st,headers:CORS,contentType:'application/json',body:JSON.stringify(o)});
    if(m==='OPTIONS' && u.includes('supabase')) return r.respond({status:204,headers:CORS,body:''});
    if(m==='POST' && u.includes('rest/v1/')){ try{ posts.push([u.split('rest/v1/')[1], JSON.parse(r.postData())]); }catch(e){} return J(201,[]); }
    if(m==='DELETE' && u.includes('rest/v1/')) return r.respond({status:204,headers:CORS,body:''});
    for(const t of Object.keys(data).sort((a,b)=>b.length-a.length)) if(u.includes('rest/v1/'+t)) return J(200,data[t]||[]);
    if(u.includes('rpc/note_box')) return J(200,{inbox:[],sent:[],unread:0});
    if(u.includes('rest/v1/')) return J(200,[]);
    if(/smilecdn|wsbfarm|supabase/.test(u)) return r.abort(); r.continue(); });
  if(opts.hour!=null) await p.evaluateOnNewDocument(h=>{ const g=Date.prototype.getHours; Date.prototype.getHours=function(){ return h; }; }, opts.hour);
  await p.goto(PAGE,{waitUntil:'domcontentloaded'});
  await p.evaluate(m=>{ localStorage.clear(); localStorage.setItem('lineup.share.invited','1'); localStorage.setItem('lineup.share.onb','1'); localStorage.setItem('lineup.share.me', JSON.stringify({cohort:'6기',token:'T',...m})); }, me);
  await p.goto(PAGE,{waitUntil:'networkidle2'});
  await new Promise(r=>setTimeout(r,opts.wait||2500));
  return { b, p, errs, posts, S:(f,...a)=>p.evaluate(f,...a), sleep:ms=>new Promise(r=>setTimeout(r,ms)) };
}
