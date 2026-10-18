/* ── 💡 개선 요청 ─────────────────────────────────────────────────
   불편한 점·바라는 기능·버그·칭찬을 오웬에게 바로. ☰기타 › 개선 요청, 놀이 › 설정 › 개선 요청.
   보내기: feedback 표에 넣기만 한다(anon 은 읽을 수 없다).
   「내가 보낸 요청」: my_feedback(아이디, 토큰) 함수로 내 것만 받아 온다 — 토큰이 없거나 낡았으면(다른 폰에서 다시 로그인)
   이 기기에 기억해 둔 보낸 목록만 보여 준다. 남이 쓴 값(운영자 답 포함)은 전부 esc 를 거친다.
   너무 자주 보내지 않게 — 30초에 한 번, 하루 10개(서버도 한 번 더 막는다). */
(function(){
const MINE = 'lineup.share.fb.mine', SENT = 'lineup.share.fb.sent', MAX = 500;
const CATS = [['ux', '😣', '불편해요'], ['idea', '✨', '이런 기능 원해요'], ['bug', '🐞', '버그'], ['praise', '💛', '칭찬']];
const SCREENS = [['home', '홈'], ['food', '맛집 · 스팟'], ['play', '놀이 · 게임'], ['cam', '캠'], ['ride', '버스 · 카풀'], ['bolt', '서핑번개'], ['stay', '숙소'], ['town', '마을 · 채팅'], ['log', '서핑 일지'], ['etc', '기타 · 전체']];
const STATUS = { '접수':'s0', '검토 중':'s1', '반영됨':'s2', '보류':'s3' };
const E = t => String(t == null ? '' : t).replace(/[<>&"']/g, c=>({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&#39;' }[c]));
const $f = id => document.getElementById(id);
const get = (k, d) => { try{ const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; }catch(e){ return d; } };
const put = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
const me = () => { try{ return (typeof ME !== 'undefined' && ME && ME.id) ? ME : null; }catch(e){ return null; } };
const sup = () => { try{ if(typeof SUPA !== 'undefined' && SUPA.url) return SUPA; }catch(e){} const c = window.SURF_CONFIG || {}; return { url:String(c.supabaseUrl || '').replace(/\/$/, ''), key:c.supabaseKey || '' }; };
const say = t => { if(typeof toast === 'function') toast(t); };
const ago = iso => { const t = new Date(iso).getTime(); if(!t) return ''; const m = Math.round((Date.now() - t) / 6e4);
  if(m < 1) return '방금'; if(m < 60) return m + '분 전'; const h = Math.round(m / 60); if(h < 24) return h + '시간 전'; const d = Math.round(h / 24); if(d < 8) return d + '일 전';
  const x = new Date(t); return `${x.getMonth() + 1}.${x.getDate()}`; };

let cat = '', server = null, serverOk = false;

function css(){
  if($f('fb-css')) return;
  const st = document.createElement('style'); st.id = 'fb-css';
  st.textContent = `
.fb-cats{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px; margin-top:8px }
.fb-cats button{ min-height:48px; padding:0 10px; font-family:inherit; font-size:14px; font-weight:800; text-align:left; background:#fff; border:2px solid var(--ink); border-radius:10px; cursor:pointer; color:var(--ink) }
.fb-cats button[aria-pressed="true"]{ background:var(--sun) }
.fb-lab{ display:block; margin:12px 0 4px; font-size:13px; font-weight:800 }
.fb-in{ width:100%; box-sizing:border-box; min-height:110px; border-radius:10px }
.fb-row{ display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:12px; color:#5B6275; font-weight:700; margin-top:4px }
.fb-sel{ width:100%; box-sizing:border-box; border-radius:10px }
.fb-go{ width:100%; min-height:50px; margin-top:6px }
.fb-mine{ margin-top:18px; border-top:3px dashed var(--grid); padding-top:10px }
.fb-mine h4{ margin:0 0 6px; font-size:14.5px }
.fb-it{ padding:9px 0; border-top:2px dashed var(--grid) } .fb-it:first-of-type{ border-top:0 }
.fb-hd{ display:flex; flex-wrap:wrap; align-items:center; gap:6px; font-size:12px; font-weight:800; color:#5B6275 }
.fb-st{ padding:1px 7px; border:2px solid var(--ink); border-radius:999px; color:var(--ink); background:#E3E6EE } .fb-st.s1{ background:#FFE27A } .fb-st.s2{ background:var(--mint) } .fb-st.s3{ background:#FFD1D1 }
.fb-tx{ margin-top:4px; font-size:14px; line-height:1.6; white-space:pre-wrap; word-break:break-word }
.fb-re{ margin-top:6px; padding:8px 10px; font-size:13.5px; line-height:1.6; background:#EAF3FF; border:2px solid var(--ink); border-radius:10px; white-space:pre-wrap; word-break:break-word }
.fb-none{ font-size:13px; color:#5B6275 }`;
  document.head.appendChild(st);
}

function sheet(){
  let sh = $f('fb-sheet'); if(sh) return sh;
  css();
  sh = document.createElement('div'); sh.className = 'sheet'; sh.id = 'fb-sheet'; sh.hidden = true;
  sh.innerHTML = `<div class="sheet-dim" data-fbclose></div><div class="sheet-in" role="dialog" aria-modal="true" aria-labelledby="fb-title">
    <div class="sheet-hd"><span class="t" id="fb-title">💡 개선 요청</span><button class="btn sm ghost" type="button" data-fbclose>닫기</button></div>
    <p class="note" style="margin:0">불편한 점 · 바라는 기능 · 버그 — 오웬이 하나하나 직접 읽어요. 이름과 함께 전해져요.</p>
    <div class="fb-cats" role="group" aria-label="어떤 이야기인가요">${CATS.map(([k, ic, t])=>`<button type="button" data-fbcat="${k}" aria-pressed="false">${ic} ${t}</button>`).join('')}</div>
    <label class="fb-lab" for="fb-text">어떤 점인가요?</label>
    <textarea id="fb-text" class="fb-in" maxlength="${MAX}" placeholder="예) 버스 탭에서 돌아오는 차도 한 번에 보고 싶어요"></textarea>
    <div class="fb-row"><span>개인정보(전화번호 등)는 적지 말아 주세요</span><span id="fb-n">0/${MAX}</span></div>
    <label class="fb-lab" for="fb-screen">어느 화면에서요? <small style="font-weight:700;color:#5B6275">(골라 두었어요 · 바꿔도 돼요)</small></label>
    <select id="fb-screen" class="fb-sel">${SCREENS.map(([k, t])=>`<option value="${k}">${t}</option>`).join('')}</select>
    <div class="err" id="fb-err" role="alert"></div>
    <button type="button" class="btn blue fb-go" id="fb-send">보내기</button>
    <div class="fb-mine"><h4>📮 내가 보낸 요청</h4><div id="fb-list"></div></div>
  </div>`;
  document.body.appendChild(sh);
  sh.addEventListener('click', e=>{
    if(e.target.closest('[data-fbclose]')){ sh.hidden = true; return; }
    const c = e.target.closest('[data-fbcat]'); if(c){ cat = c.dataset.fbcat; paintCats(); $f('fb-err').textContent = ''; return; }
    if(e.target.closest('#fb-send')) send();
  });
  $f('fb-text').addEventListener('input', ()=>{ $f('fb-n').textContent = `${$f('fb-text').value.length}/${MAX}`; });
  return sh;
}
function paintCats(){ document.querySelectorAll('[data-fbcat]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.fbcat === cat))); }

/* 지금 보던 화면 */
function curScreen(){
  try{ if($f('sl-sheet') && !$f('sl-sheet').hidden) return 'log'; }catch(e){}
  let t = ''; try{ t = (typeof state !== 'undefined' && state && state.tab) || ''; }catch(e){}
  if(t === 'ride' && $f('pane-ride')?.dataset.view === 'car') return 'ride';
  return SCREENS.some(s=>s[0] === t) ? t : 'etc';
}

/* 너무 자주 — 30초 · 하루 10개 */
function limit(){
  const now = Date.now(), s = get(SENT, []).filter(x=>typeof x === 'number' && now - x < 864e5);
  if(s.length && now - Math.max(...s) < 30e3) return `조금만 천천히요 — ${Math.ceil((30e3 - (now - Math.max(...s))) / 1000)}초 뒤에 다시 보내 주세요`;
  if(s.length >= 10) return '오늘은 10개까지예요 — 내일 또 들려주세요 🙏';
  return '';
}

async function send(){
  const m = me(), err = $f('fb-err'), btn = $f('fb-send'); err.textContent = '';
  if(!m) return err.textContent = '로그인한 뒤에 보낼 수 있어요';
  if(!cat) return err.textContent = '위에서 어떤 이야기인지 하나 골라 주세요';
  const text = $f('fb-text').value.trim().slice(0, MAX);
  if(text.length < 2) return err.textContent = '한두 마디라도 적어 주세요';
  const lim = limit(); if(lim) return err.textContent = lim;
  const S = sup(); if(!S.url) return err.textContent = '서버 설정이 없어요';
  const cid = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  let ver = ''; try{ const ks = await caches.keys(); const k = ks.find(x=>/^surf-v\d+$/.test(x)); if(k) ver = k.slice(5); }catch(e){}
  const row = { cid, user_id:String(m.id).slice(0, 32), name:String(m.name || '').slice(0, 40), cohort:String(m.cohort || 'open').slice(0, 16), cat, text, screen:$f('fb-screen').value, ver };
  btn.disabled = true; btn.textContent = '보내는 중…';
  try{
    const r = await fetch(`${S.url}/rest/v1/feedback`, { method:'POST', headers:{ apikey:S.key, Authorization:'Bearer ' + S.key, 'Content-Type':'application/json', Prefer:'return=minimal' },
      body:JSON.stringify(row), signal:(typeof AbortSignal !== 'undefined' && AbortSignal.timeout) ? AbortSignal.timeout(20000) : undefined });
    if(!r.ok){ let msg = ''; try{ msg = (await r.json())?.message || ''; }catch(e){}
      throw Object.assign(new Error(msg || 'HTTP ' + r.status), { status:r.status }); }
    put(SENT, get(SENT, []).filter(x=>Date.now() - x < 864e5).concat(Date.now()));
    put(MINE, [{ cid, cat, text, screen:row.screen, at:new Date().toISOString() }].concat(get(MINE, [])).slice(0, 30));
    $f('fb-text').value = ''; $f('fb-n').textContent = `0/${MAX}`; cat = ''; paintCats();
    window.track?.('action', 'feedback_send', { c:row.cat });
    say('보냈어요 · 고마워요! 🙏 답이 오면 여기서 볼 수 있어요'); navigator.vibrate?.(15);
    paint(); pull();
  }catch(e){
    err.textContent = e.status === 404 ? '개선 요청 칸이 아직 서버에 없어요 — 단톡방에 알려 주세요'
      : /toofast/.test(e.message) ? '조금만 천천히요 — 30초 뒤에 다시 보내 주세요'
      : /toomany/.test(e.message) ? '오늘은 10개까지예요 — 내일 또 들려주세요 🙏'
      : (e.name === 'TypeError' || e.name === 'TimeoutError' || /fetch|Load failed|network/i.test(e.message)) ? '서버에 닿지 않아요 · 신호를 확인하고 다시 눌러 주세요'
      : '보내지 못했어요 — 잠시 뒤 다시 해 주세요';
  }finally{ btn.disabled = false; btn.textContent = '보내기'; }
}

/* 내 목록 — 서버(토큰 확인) + 이 기기에 기억한 것 */
async function pull(){
  const m = me(); if(!m || !m.token || typeof rpc !== 'function'){ serverOk = false; return paint(); }
  try{ const r = await rpc('my_feedback', { p_id:m.id, p_token:m.token }); server = Array.isArray(r) ? r : []; serverOk = true; }
  catch(e){ serverOk = false; }
  paint();
}
function paint(){
  const el = $f('fb-list'); if(!el) return;
  const local = get(MINE, []).filter(x=>x && x.cid);
  const rows = [];
  const seen = new Set();
  (serverOk ? server : []).forEach(x=>{ if(!x) return; rows.push({ cid:x.cid, cat:x.cat, text:x.text, at:x.created_at, status:x.status || '접수', reply:x.reply || '' }); if(x.cid) seen.add(x.cid); });
  local.forEach(x=>{ if(!seen.has(x.cid)) rows.push({ cid:x.cid, cat:x.cat, text:x.text, at:x.at, status:serverOk ? '접수' : '', reply:'' }); });
  rows.sort((a, b)=>String(b.at).localeCompare(String(a.at)));
  const C = Object.fromEntries(CATS.map(([k, ic, t])=>[k, `${ic} ${t}`]));
  el.innerHTML = rows.length ? rows.slice(0, 30).map(r=>`<div class="fb-it"><div class="fb-hd"><span>${E(C[r.cat] || '💬')}</span><span>· ${E(ago(r.at))}</span>${r.status ? `<span class="fb-st ${STATUS[r.status] || 's0'}">${E(r.status)}</span>` : ''}</div>
      <div class="fb-tx">${E(r.text)}</div>${r.reply ? `<div class="fb-re"><b>💬 오웬</b> ${E(r.reply)}</div>` : ''}</div>`).join('')
    + (!serverOk && rows.length ? '<p class="note" style="margin-top:8px">진행 상태는 다시 로그인하면 보여요 · 지금은 이 폰에서 보낸 것만 보여요</p>' : '')
    : '<div class="fb-none">아직 보낸 요청이 없어요. 작은 것도 좋아요 — 한 줄이면 충분해요.</div>';
}

function open(screen){
  const sh = sheet();
  const sel = $f('fb-screen'); if(sel) sel.value = SCREENS.some(s=>s[0] === screen) ? screen : curScreen();
  $f('fb-err').textContent = ''; paintCats(); paint(); sh.hidden = false; pull();
  setTimeout(()=>{ const b = sh.querySelector('[data-fbcat]'); if(b && !cat) b.focus({ preventScroll:true }); }, 80);
}
window.feedbackOpen = open;
})();
