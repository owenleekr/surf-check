import puppeteer from 'puppeteer-core'; import fs from 'fs';
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'};
const iso=n=>new Date(Date.now()-n*864e5-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const NM=['김도훈','김태은','박초롱','심재영','이성현','이한솔','이해룡','장은옥','전영훈','김나리','이미진','이승대','홍미영'];
const surfers=NM.map((n,i)=>({id:'u'+i,name:n,cohort:'6기',profile:{gender:i%2?'f':'m',pet:[2,5,9,11].includes(i)?'dog':'none',
  play:i%3===0?{xp:100+i*40,lv:Math.min(8,i%5+1),best:50*i}:undefined,
  mood:[4,9,12].includes(i)?['오늘은 서프보드','바베큐파티 왔다가 서핑 때문에 눌러앉았어요','테이크오프 신경쓰기'][[4,9,12].indexOf(i)]:undefined}}));
const drills=[]; [0,1,2].forEach(n=>drills.push({user_id:'u0',name:'김도훈',day:iso(n)})); [0].forEach(n=>[2,4,9].forEach(k=>drills.push({user_id:'u'+k,name:NM[k],day:iso(n)})));
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new'});
for(const W of [390,320,430]){
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,120)));
  await p.setViewport({width:W,height:900,deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.setRequestInterception(true);
  p.on('request', r=>{ const u=r.url(), J=(st,o)=>r.respond({status:st,headers:CORS,contentType:'application/json',body:JSON.stringify(o)});
    if(r.method()==='OPTIONS' && u.includes('supabase')) return r.respond({status:204,headers:CORS,body:''});
    if(u.includes('rest/v1/surfers')) return J(200,surfers);
    if(u.includes('rest/v1/drills')) return J(200,drills);
    if(u.includes('rpc/note_box')) return J(200,{inbox:[],sent:[],unread:0});
    if(u.includes('rest/v1/')) return J(200,[]);
    if(/smilecdn|wsbfarm|supabase/.test(u)) return r.abort(); r.continue(); });
  await p.goto('http://localhost:8765/surfshare.html',{waitUntil:'domcontentloaded'});
  await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('lineup.share.invited','1'); localStorage.setItem('lineup.share.onb','1');
    localStorage.setItem('lineup.share.me', JSON.stringify({id:'u4',name:'이성현',cohort:'6기',profile:{birth:'1'},token:'T'})); });
  await p.goto('http://localhost:8765/surfshare.html',{waitUntil:'networkidle2'});
  await new Promise(r=>setTimeout(r,2000));
  await p.evaluate(()=>{ document.getElementById('pop').hidden=true; document.getElementById('t-town').click(); });
  await new Promise(r=>setTimeout(r,1500));
  const o = await p.evaluate(()=>{
    const cells=[...document.querySelectorAll('.vp')], R=e=>e.getBoundingClientRect();
    let over=0; for(let i=0;i<cells.length;i++){ const a=R(cells[i].querySelector('canvas')); for(let j=i+1;j<cells.length;j++){ const c=R(cells[j].querySelector('canvas'));
      if(a.left<c.right-6&&c.left<a.right-6&&a.top<c.bottom-6&&c.top<a.bottom-6) over++; } }
    const nm=cells.map(e=>R(e.querySelector('.nm'))); let nover=0;
    for(let i=0;i<nm.length;i++)for(let j=i+1;j<nm.length;j++){ const a=nm[i],c=nm[j]; if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1) nover++; }
    let covered=0; document.querySelectorAll('.vp .bub').forEach(bb=>{ const br=R(bb), own=bb.closest('.vp');
      cells.forEach(c=>{ if(c===own) return; const cr=R(c.querySelector('canvas')); if(br.left<cr.right-10&&cr.left<br.right-10&&br.top<cr.bottom-10&&cr.top<br.bottom-10) covered++; }); });
    const v=R(document.querySelector('.village'));
    const badgeOut=[...document.querySelectorAll('.vlv,.vok')].filter(e=>{ const r=R(e); return r.left<v.left||r.right>v.right; }).length;
    return { 사람:cells.length, 캐릭터겹침:over, 이름표겹침:nover, 남캐릭터덮음:covered, 레벨배지:document.querySelectorAll('.vlv').length, 훈련체크:document.querySelectorAll('.vok').length, 배지밖으로:badgeOut, 높이:Math.round(v.height) };
  });
  console.log(W+'px', JSON.stringify(o), errs.length?errs:'');
  if(W===390){ await (await p.$('#pane-town .village')).screenshot({path:'/tmp/v_new.png'});
    await p.evaluate(()=>document.querySelector('.vp[data-id="u0"]').click()); await new Promise(r=>setTimeout(r,300));
    console.log('카드:', await p.evaluate(()=>document.querySelector('.vcard').textContent.replace(/\s+/g,' ').trim())); }
  await p.close();
}
await b.close();
