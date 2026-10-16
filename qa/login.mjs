/* 입장·로그인·비밀번호 재설정 — 신호 실패 문구(영어·엉뚱한 안내 없이), 재설정 후 바로 입장, 새 가입자에게 '업데이트' 카드·팝업이 온보딩을 덮지 않는지 */
import puppeteer from 'puppeteer-core';
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'};
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new'});
const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,160))); p.on('console',m=>{ if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text())) errs.push('console:'+m.text().slice(0,140)); });
await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
await p.setRequestInterception(true); let down=false, http500=false; const calls=[], sur=[];
/* 다른 기기에서 꾸민 모습·모은 조개·일지 — 새 기기 로그인이 이걸 지우면 안 된다 */
const ROW={ id:'owen', name:'이성현', cohort:'6기', profile:{ gender:'f', hair:'pony', hairc:'y', dressed:1, play:{ base:120, bonus:40, badges:{log1:1}, qd:{}, qall:0, best:300, gday:'', gxp:0, gn:{}, lvSeen:2, shells:99, spent:0, own:{}, log:[{id:'L1',d:'2026-10-10',s:'낙산',m:60,w:3,f:2}] } } };
p.on('request', r=>{ const u=r.url(), m=r.method(), J=(st,o)=>r.respond({status:st,headers:CORS,contentType:'application/json',body:JSON.stringify(o)});
  if(m==='OPTIONS'&&u.includes('supabase')) return r.respond({status:204,headers:CORS,body:''});
  if(u.includes('supabase') && down) return r.abort('failed');
  if(u.includes('supabase') && http500) return r.respond({status:500,headers:CORS,contentType:'text/plain',body:'x'});
  if(u.includes('rpc/verify_cohort')) return J(200,true);
  if(u.includes('rpc/login')){ const a=JSON.parse(r.postData()); calls.push('login:'+a.p_pw); return a.p_pw==='newpw1' ? J(200,{name:'이성현',profile:{gender:'f',hair:'bob',birth:'881102'},token:'tk',cohort:'6기'}) : J(400,{message:'wrongpw'}); }
  if(u.includes('rest/v1/surfers') && !u.includes('select=id,name')){ if(m==='GET'){ sur.push('GET'); return J(200,[ROW]); } if(m==='POST'){ const b=JSON.parse(r.postData()); sur.push('POST:'+b.profile?.hair+':'+(b.profile?.play?.shells)+':'+(b.profile?.play?.log||[]).length+(JSON.stringify(b).includes('881102')?':BIRTH!':'')); return J(201,[]); } }
  if(u.includes('rpc/reset_pw')){ const a=JSON.parse(r.postData()); calls.push('reset:'+a.p_birth); return J(200, a.p_birth==='881102' ? 'ok' : 'wrongbirth'); }
  if(u.includes('rpc/signup')) return J(200,'tok');
  if(u.includes('rpc/note_box')) return J(200,{inbox:[],sent:[],unread:0});
  if(m==='POST'&&u.includes('rest/v1/')) return J(201,[]);
  if(u.includes('rest/v1/')) return J(200,[]);
  if(/smilecdn|wsbfarm|supabase|open-meteo|jsdelivr/.test(u)) return r.abort(); r.continue(); });
const PAGE='http://localhost:8765/surfshare.html', S=(f,...a)=>p.evaluate(f,...a), sleep=ms=>new Promise(r=>setTimeout(r,ms));
await p.goto(PAGE,{waitUntil:'domcontentloaded'}); await S(()=>localStorage.clear());
await p.goto(PAGE,{waitUntil:'networkidle2'}); await sleep(800);
// ① 입장 — 신호 끊김 / 서버 500
down=true; await S(()=>{ document.getElementById('gate-code').value='x'; document.getElementById('gate-ok').click(); }); await sleep(700);
console.log('① 입장·신호 끊김:', await S(()=>document.getElementById('gate-err').textContent));
down=false; http500=true; await S(()=>document.getElementById('gate-ok').click()); await sleep(700);
console.log('   입장·서버 500 :', await S(()=>document.getElementById('gate-err').textContent));
http500=false; await S(()=>document.getElementById('gate-ok').click()); await sleep(800);
// ② 로그인 — 틀린 비번 → 재설정
await S(()=>{ setMode('in'); document.getElementById('uid').value='owen'; document.getElementById('upw').value='bad'; document.getElementById('go').click(); }); await sleep(600);
console.log('② 틀린 비번:', await S(()=>document.getElementById('lerr').textContent), '| 재설정 링크 보임', await S(()=>!document.getElementById('rs-open').hidden && document.getElementById('rs-open').getBoundingClientRect().height>=44));
await S(()=>document.getElementById('rs-open').click()); await sleep(200);
await S(()=>{ document.getElementById('rs-birth').value='000000'; document.getElementById('rs-new').value='newpw1'; document.getElementById('rs-go').click(); }); await sleep(600);
console.log('   틀린 생일:', await S(()=>document.getElementById('rs-err').textContent));
await S(()=>{ document.getElementById('rs-birth').value='881102'; document.getElementById('rs-go').click(); }); await sleep(2500);
await sleep(1500);
console.log('④ 새 기기 로그인 — 서버 모습·도감 보존:', JSON.stringify(await S(()=>({ 머리:ME.profile.hair, 조개:ME.profile.play?.shells, 일지:(ME.profile.play?.log||[]).length, 로컬birth:ME.profile.birth==='881102', pull남음:!!ME.pull }))), '| surfers 순서', sur.join(' '));
console.log('   맞는 생일 → 입장:', JSON.stringify(await S(()=>({ 메인:!document.getElementById('main').hidden, 이름:document.getElementById('who').textContent }))), calls.join(' '));
await p.screenshot({path:'/tmp/login_reset.png'});
// ③ 새 계정 — 신호 끊김 문구, 그다음 가입 → 온보딩만(업데이트 카드·팝업 없음)
await S(()=>{ localStorage.clear(); localStorage.setItem('lineup.share.invited','1'); }); await p.reload({waitUntil:'networkidle2'}); await sleep(800);
await S(()=>{ document.getElementById('uid').value='newbie9'; const s=document.getElementById('uroster'); s.selectedIndex=3; s.dispatchEvent(new Event('change')); document.getElementById('ubirth').value='900101'; document.getElementById('upw').value='1234'; document.getElementById('agree').checked=true; });
down=true; await S(()=>document.getElementById('go').click()); await sleep(800);
console.log('③ 가입·신호 끊김:', await S(()=>document.getElementById('lerr').textContent), '| 재설정 링크 숨김', await S(()=>document.getElementById('rs-open').hidden));
down=false; await S(()=>document.getElementById('go').click()); await sleep(4000);
console.log('   가입 후:', JSON.stringify(await S(()=>({ 온보딩:!document.getElementById('onb').hidden, 팝업:document.getElementById('pop').hidden ? '(없음)' : document.getElementById('pop-t').textContent, 업데이트카드:!document.getElementById('home-upd').hidden }))));
console.log('errs', errs); await b.close();
