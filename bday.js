/* ── 🎂 오늘의 생일 ───────────────────────────────────────────────
   오늘(한국 시간) 생일인 사람이 있으면 홈 맨 위에 띠가 뜬다 → 누르면 축하 창(캐릭터 + 축하 댓글).
   생년월일은 비밀번호 재설정 열쇠라 앱이 읽지 못한다. 서버 함수 birthdays_today() 가
   오늘 생일인 사람의 아이디·이름만 돌려준다(supabase-birthday.sql). 함수가 아직 없으면 조용히 아무것도 안 뜬다.
   축하 댓글은 place_talk 표, target = 'bd:<아이디>:<연도>'. 「생일 알리기」를 끄면(profile.bdoff) 목록에서 빠진다. */
(function(){
const MAXLEN = 120, CHIPS = ['🎉 생일 축하해!', '🎂 행복한 하루 보내요', '🏄 올해도 좋은 파도 많이 타자!', '🌊 생일 파도 받으러 가요'];
let list = [], talk = [], day = '', pick = 0, sentAt = 0, loading = null;
const kst = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const tgt = p => `bd:${p.id}:${day.slice(0, 4)}`;
const mine = p => typeof ME !== 'undefined' && ME && p.id === ME.id;
const count = p => talk.filter(r=>r.target === tgt(p)).length;
const say = t => { if(typeof toast === 'function') toast(t); };

async function load(){
  if(loading) return loading;
  loading = (async ()=>{
    const d = kst();
    try{ const r = await rpc('birthdays_today', {}); day = d;
      list = (Array.isArray(r) ? r : []).filter(x=>x && typeof x.id === 'string' && !(typeof isTest === 'function' && isTest(x.id)))
        .map(x=>({ id:x.id, name:String(x.name || '').slice(0, 20), cohort:String(x.cohort || 'open') })); }
    catch(e){ list = []; day = d; }
    if(pick >= list.length) pick = 0;
    await pullTalk(); loading = null; bar();
  })();
  return loading;
}
async function pullTalk(){
  if(!list.length){ talk = []; return; }
  const inn = list.map(p=>`"${tgt(p)}"`).join(',');
  try{ const r = await api(`place_talk?select=id,target,user_id,name,cohort,text,created_at&target=in.(${encodeURIComponent(inn)})&order=created_at.asc&limit=300`);
    talk = Array.isArray(r) ? r : []; }catch(e){}
}

/* ── 홈 맨 위 띠 ── */
function bar(){
  const home = document.getElementById('pane-home'); if(!home) return;
  let el = document.getElementById('bday-bar');
  if(!list.length){ if(el) el.hidden = true; return; }
  if(!el){ el = document.createElement('button'); el.type = 'button'; el.id = 'bday-bar'; el.className = 'bday-bar';
    el.onclick = ()=>openSheet(); const ab = document.getElementById('adv-bar'); home.insertBefore(el, ab && ab.parentNode === home ? ab.nextSibling : home.firstChild); }   // 기상특보 띠(kcg.js)가 있으면 그 아래
  const me = list.find(mine), n = list.reduce((a, p)=>a + count(p), 0);
  const others = list.filter(p=>!mine(p)).map(p=>esc(p.name) + '님');
  el.innerHTML = me
    ? `<i aria-hidden="true">🎉</i><span><b>생일 축하해요, ${esc(me.name)}님!</b><small>${n ? `축하 ${count(me)}개가 와 있어요` : '오늘 하루 주인공이에요'}${others.length ? ` · ${others.join('·')}도 생일` : ''}</small></span><em>보기 ›</em>`
    : `<i aria-hidden="true">🎂</i><span><b>오늘은 ${others.slice(0, 2).join('·')}${others.length > 2 ? ` 외 ${others.length - 2}명` : ''} 생일!</b><small>${n ? `축하 ${n}개 · 한마디 남겨 주세요` : '첫 축하를 남겨 주세요'}</small></span><em>축하하기 ›</em>`;
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  el.hidden = false;
}

/* ── 축하 창 ── */
function sheet(){
  let s = document.getElementById('bday-sheet'); if(s) return s;
  s = document.createElement('div'); s.className = 'sheet'; s.id = 'bday-sheet'; s.hidden = true;
  s.innerHTML = `<div class="sheet-dim" data-bdclose></div><div class="sheet-in bday-in" role="dialog" aria-modal="true" aria-label="생일 축하">
    <div class="sheet-hd"><span class="t">🎂 오늘의 생일</span><button type="button" class="btn sm ghost" data-bdclose>닫기</button></div><div id="bday-body"></div></div>`;
  document.body.appendChild(s);
  s.addEventListener('click', onClick);
  s.addEventListener('input', e=>{ if(e.target.id === 'bd-in'){ const c = s.querySelector('.bd-cnt'); if(c) c.textContent = `${e.target.value.length}/${MAXLEN}`; } });
  s.addEventListener('keydown', e=>{ if(e.target.id === 'bd-in' && e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229){ e.preventDefault(); send(); } });
  return s;
}
function face(p){
  if(typeof window.mochiSVG !== 'function' || typeof withLook !== 'function') return '<div class="bd-cake">🎂</div>';
  const row = mine(p) ? { profile:ME.profile } : (state?.town || []).find(x=>x.id === p.id);
  try{ const svg = window.mochiSVG(withLook(row?.profile || {}, p.name), { charm:2, uid:'bd' });
    return `<img class="bd-av" alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}">`; }catch(e){ return '<div class="bd-cake">🎂</div>'; }
}
function paint(){
  const body = document.getElementById('bday-body'); if(!body) return;
  if(!list.length){ body.innerHTML = '<p class="bd-empty">오늘은 생일인 사람이 없어요</p>'; return; }
  const p = list[pick] || list[0], T = tgt(p), rows = talk.filter(r=>r.target === T), me = mine(p);
  const prevDraft = document.getElementById('bd-in')?.value || '';
  body.innerHTML = `
    ${list.length > 1 ? `<div class="bd-tabs" role="tablist">${list.map((q, i)=>`<button type="button" role="tab" data-bdpick="${i}" aria-selected="${i === pick}">${esc(q.name)}<small>${count(q)}</small></button>`).join('')}</div>` : ''}
    <div class="bd-hero"><div class="bd-conf" aria-hidden="true">${'<i></i>'.repeat(14)}</div>
      <div class="bd-stage">${face(p)}<span class="bd-cake2" aria-hidden="true">🎂</span></div>
      <h3>${me ? `생일 축하해요, ${esc(p.name)}님! 🎉` : `오늘은 ${esc(p.name)}님 생일이에요`}</h3>
      <p>${p.cohort && p.cohort !== 'open' ? `양양서핑학교 ${esc(p.cohort)} · ` : ''}${me ? '친구들이 남긴 축하를 확인해 보세요' : '짧게 한마디 남겨 주세요'}</p></div>
    <div class="bd-list" aria-live="polite">${rows.length ? rows.map(r=>`<div class="bd-msg${r.user_id === ME?.id ? ' me' : ''}"><b>${esc(String(r.name || '').slice(0, 20))}${r.cohort && r.cohort !== 'open' ? `<small>${esc(String(r.cohort).slice(0, 6))}</small>` : ''}</b>
      <p>${esc(String(r.text || '').slice(0, MAXLEN))}</p><span>${typeof ago === 'function' ? ago(r.created_at) : ''}${r.user_id === ME?.id ? ` · <button type="button" data-bddel="${esc(r.id)}">지우기</button>` : ''}</span></div>`).join('')
      : `<p class="bd-empty">${me ? '아직 축하가 없어요 — 곧 올 거예요 🙂' : '아직 축하가 없어요 · 첫 번째로 남겨 주세요'}</p>`}</div>
    ${me ? '' : `<div class="bd-chips">${CHIPS.map(c=>`<button type="button" data-bdchip="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <div class="bd-form"><textarea id="bd-in" rows="2" maxlength="${MAXLEN}" placeholder="${esc(p.name)}님께 축하 한마디" enterkeyhint="send">${esc(prevDraft)}</textarea>
      <button type="button" class="btn coral" data-bdsend>보내기</button></div><small class="bd-cnt">${prevDraft.length}/${MAXLEN}</small>`}`;
  const L = body.querySelector('.bd-list'); if(L) L.scrollTop = L.scrollHeight;
}
async function openSheet(){
  const s = sheet(); const me = list.findIndex(mine);
  if(me >= 0 && pick === 0 && list.length > 1) pick = me;
  s.hidden = false; paint();
  if(me >= 0) party();
  await pullTalk(); if(!s.hidden){ paint(); bar(); }
}
function close(){ const s = document.getElementById('bday-sheet'); if(s) s.hidden = true; }
/* 생일 당사자가 처음 열면 한 번 — 꽃가루 */
function party(){
  const k = 'lineup.share.bdparty'; try{ if(localStorage.getItem(k) === day) return; localStorage.setItem(k, day); }catch(e){}
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div'); box.className = 'bd-burst'; box.setAttribute('aria-hidden', 'true');
  box.innerHTML = Array.from({ length:36 }, (_, i)=>`<i style="left:${(i * 37) % 100}%;animation-delay:${(i % 9) * 0.07}s;background:${['#FF6B6B', '#FFD23F', '#5AB4EF', '#6BD6A0', '#B48CFF'][i % 5]}"></i>`).join('');
  document.body.appendChild(box); setTimeout(()=>box.remove(), 2600);
  navigator.vibrate?.([20, 40, 20]);
}
async function send(){
  if(typeof ME === 'undefined' || !ME) return;
  const p = list[pick], inp = document.getElementById('bd-in'); if(!p || !inp || mine(p)) return;
  const text = inp.value.trim().slice(0, MAXLEN); if(!text) return say('한마디 적어 주세요');
  if(Date.now() - sentAt < 3000) return say('조금 천천히요 🙂');
  const row = { id:`${ME.id}|${Date.now()}`, target:tgt(p), parent:null, user_id:ME.id, name:ME.name, cohort:ME.cohort || 'open', text, created_at:new Date().toISOString() };
  sentAt = Date.now();
  const btn = document.querySelector('[data-bdsend]'); if(btn) btn.disabled = true;
  try{ await api('place_talk', { method:'POST', body:JSON.stringify(row) }); talk.push(row); inp.value = ''; paint(); bar(); navigator.vibrate?.(12); say(`🎉 ${p.name}님께 축하를 남겼어요`); }
  catch(e){ say('남기지 못했어요 · 신호 확인'); if(btn) btn.disabled = false; }
}
async function del(id){
  const r = talk.find(x=>x.id === id); if(!r || r.user_id !== ME?.id) return;
  if(typeof ask === 'function' && !(await ask('이 축하를 지울까요?', { ok:'지우기', danger:true }))) return;
  try{ await api(`place_talk?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(ME.id)}`, { method:'DELETE' }); talk = talk.filter(x=>x.id !== id); paint(); bar(); }
  catch(e){ say('지우지 못했어요'); }
}
function onClick(e){
  const t = e.target.closest('button, .sheet-dim'); if(!t) return;
  if(t.matches('[data-bdclose]')) return close();
  if(t.dataset.bdpick != null){ pick = +t.dataset.bdpick || 0; const i = document.getElementById('bd-in'); if(i) i.value = ''; return paint(); }
  if(t.dataset.bdchip != null){ const i = document.getElementById('bd-in'); if(i){ i.value = t.dataset.bdchip; i.dispatchEvent(new Event('input', { bubbles:true })); i.focus({ preventScroll:true }); } return; }
  if(t.matches('[data-bdsend]')) return send();
  if(t.dataset.bddel) return del(t.dataset.bddel);
}

/* 로그인 뒤 한 번, 그리고 앱으로 돌아왔을 때 날짜가 바뀌었으면 다시 */
function boot(){ if(typeof ME === 'undefined' || !ME || !document.body.classList.contains('has-nav')) return false; load(); return true; }
if(!boot()){ const iv = setInterval(()=>{ if(boot()) clearInterval(iv); }, 500); }
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'visible' && day && day !== kst() && typeof ME !== 'undefined' && ME) load(); });
window.bdayOpen = openSheet; window._bday = { get list(){ return list; }, get talk(){ return talk; }, load };
})();
