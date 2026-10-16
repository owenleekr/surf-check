import { open } from './mock.mjs';
const Y = new Date(Date.now()+9*3600e3).toISOString().slice(0,4);
const surfers=[{id:'jin',name:'진',cohort:'6기',profile:{gender:'m',hair:'short'}},{id:'minji',name:'민지',cohort:'6기',profile:{gender:'f',hair:'bob',hairc:'b'}}];
const talk=[{id:'kim|1',target:`bd:minji:${Y}`,user_id:'kim',name:'김서퍼',cohort:'6기',text:'<b>축하</b>해요!',created_at:new Date().toISOString()},{id:'x|1',target:'ft:abc',user_id:'x',name:'x',text:'맛집',created_at:new Date().toISOString()}];
let fail=0; const ok=(c,m)=>{ console.log((c?'✔':'✘')+' '+m); if(!c) fail++; };
{ const { b, p, errs, posts, S, sleep } = await open({ surfers, place_talk:talk, __rpc:{ birthdays_today:[{id:'minji',name:'민지',cohort:'6기'}] } }, { id:'jin', name:'진', profile:surfers[0].profile });
  const bar = await S(()=>{ const e=document.getElementById('bday-bar'); return e && !e.hidden ? { t:e.textContent, top:e.parentElement.id, first:e.parentElement.firstElementChild===e } : null; });
  ok(bar && /민지님 생일/.test(bar.t) && /축하 1개/.test(bar.t), '홈 맨 위 띠: '+(bar&&bar.t.replace(/\s+/g,' ')));
  ok(bar && bar.first, '띠가 홈 맨 위');
  await p.screenshot({ path:'/private/tmp/claude-501/-Users-owen-Desktop-AI---------/b8d6e173-49ea-4bcc-886a-0a3266382054/scratchpad/bd-bar.png' });
  await S(()=>window.popClose?.()); await sleep(300);
  await S(()=>document.getElementById('bday-bar').click()); await sleep(600);
  const sh = await S(()=>{ const s=document.getElementById('bday-sheet'); return { open:!s.hidden, img:!!s.querySelector('.bd-av'), msgs:s.querySelectorAll('.bd-msg').length, xss:!!s.querySelector('.bd-msg p b'), food:s.textContent.includes('맛집') }; });
  ok(sh.open && sh.img, '축하 창 + 캐릭터'); ok(sh.msgs===1 && !sh.food, '이 사람 축하만 1개'); ok(!sh.xss, '댓글 글자는 이스케이프');
  await p.screenshot({ path:'/private/tmp/claude-501/-Users-owen-Desktop-AI---------/b8d6e173-49ea-4bcc-886a-0a3266382054/scratchpad/bd-sheet.png' });
  await S(()=>document.querySelector('[data-bdchip]').click()); await S(()=>document.querySelector('[data-bdsend]').click()); await sleep(500);
  const pt = posts.find(x=>x[0].startsWith('place_talk'));
  ok(pt && pt[1].target===`bd:minji:${Y}` && /생일 축하/.test(pt[1].text), '축하 보내기 → place_talk '+(pt&&pt[1].target));
  ok(await S(()=>document.querySelectorAll('#bday-sheet .bd-msg').length)===2, '보낸 축하가 바로 보임');
  await S(()=>history.back()); await sleep(500);
  ok(await S(()=>document.getElementById('bday-sheet').hidden), '뒤로가기로 닫힘');
  ok(!errs.length, '오류 없음 '+errs.join(' | ')); await b.close(); }
{ const { b, p, errs, S, sleep } = await open({ surfers, place_talk:talk, __rpc:{ birthdays_today:[{id:'jin',name:'진',cohort:'6기'}] } }, { id:'jin', name:'진', profile:surfers[0].profile });
  const t = await S(()=>document.getElementById('bday-bar')?.textContent||'');
  ok(/생일 축하해요, 진님/.test(t), '내 생일 띠: '+t.replace(/\s+/g,' '));
  await S(()=>document.getElementById('bday-bar').click()); await sleep(400);
  ok(await S(()=>!document.getElementById('bd-in') && !!document.querySelector('.bd-burst')), '내 생일엔 입력칸 대신 꽃가루');
  await p.screenshot({ path:'/private/tmp/claude-501/-Users-owen-Desktop-AI---------/b8d6e173-49ea-4bcc-886a-0a3266382054/scratchpad/bd-me.png' });
  ok(!errs.length, '오류 없음 '+errs.join(' | ')); await b.close(); }
{ const { b, errs, S } = await open({ surfers, place_talk:talk }, { id:'jin', name:'진', profile:surfers[0].profile });
  ok(await S(()=>{ const e=document.getElementById('bday-bar'); return !e || e.hidden; }), '생일 없음(함수 없음) → 띠 없음');
  ok(!errs.length, '오류 없음 '+errs.join(' | ')); await b.close(); }
process.exit(fail?1:0);
