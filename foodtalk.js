/* ── 맛집·서핑 스팟의 댓글 · 대댓글 · 추천/공감 · 등록 요청 ───────────────────
   댓글·앱 등록은 place_talk 표(supabase-placetalk.sql), 추천/공감은 기존 reacts 표를 쓴다.
   표가 아직 없으면(404) 그 기능만 조용히 빠지고 나머지 화면은 그대로다.

   남이 쓴 값(이름·기수·글·제목)은 전부 esc, 링크는 네이버 주소만 받고(피싱 방지) http(s) 만 그린다.
   target 에 들어가는 id 는 영문·숫자·_- 만 허용한다. */
(function(){
const OWNER_ID = 'infinagree', FRESH = 20e3, MAXLEN = 140;
let talk = null, talkOk = null, rx = [], rxOk = null, pulledAt = 0, pulling = null;
const open = new Set(), draft = {}, replyTo = {};
let sentAt = 0, onChange = ()=>{}, getItems = ()=>[];
const ok = id => /^[\w-]{1,40}$/.test(String(id));
const NAVER_OK = /^https?:\/\/(naver\.me|([a-z0-9-]+\.)*naver\.com)\//i;                    // 네이버 주소만(지도·플레이스 앱마다 하위 주소가 달라 *.naver.com 전부)
const tTarget = (kind, id) => `${kind}:${id}`;
const rP = (kind, id) => `ft:p:${kind}:${id}`;
const rC = cid => `ft:c:${cid}`;
const tag = c => c === '6기' ? '6기' : '서퍼';
const ago = ts => { const m = Math.floor((Date.now() - new Date(ts).getTime()) / 6e4);
  return !(m >= 0) ? '' : m < 1 ? '방금' : m < 60 ? `${m}분 전` : m < 1440 ? `${Math.floor(m / 60)}시간 전` : `${Math.floor(m / 1440)}일 전`; };
const norm = s => String(s || '').toLowerCase().replace(/[\s·.,()\-_/]|본점|[가-힣]{1,3}점$/g, '');

async function pull(force){
  if(pulling) return pulling;
  if(!force && talk && Date.now() - pulledAt < FRESH) return;
  pulling = (async ()=>{
    try{ const rows = await api('place_talk?select=*&order=created_at.asc&limit=600'); talk = Array.isArray(rows) ? rows : []; talkOk = true; }
    catch(e){ if(e.code === 'notable') talkOk = false; }
    try{ const rows = await api('reacts?select=id,user_id,name,target,emo&target=like.ft:*&limit=1000'); rx = Array.isArray(rows) ? rows : []; rxOk = true; }
    catch(e){ if(e.code === 'notable') rxOk = false; }
    pulledAt = Date.now(); pulling = null; onChange();
  })();
  return pulling;
}

const cnt = (target, emo) => rx.filter(r=>r.target === target && r.emo === emo).length;
const mine = (target, emo) => typeof ME !== 'undefined' && ME && rx.some(r=>r.target === target && r.emo === emo && r.user_id === ME.id);
async function toggleRx(target, emo, toUser){
  if(!ME) return;
  if(rxOk === false) return toast('반응 표가 아직 없어요');
  const id = `${ME.id}|${target}|${emo}`, had = mine(target, emo);
  rx = had ? rx.filter(r=>r.id !== id) : [...rx, { id, user_id:ME.id, name:ME.name, target, emo }];
  onChange();
  try{
    if(had) await api(`reacts?id=eq.${encodeURIComponent(id)}`, { method:'DELETE' });
    else{ await api('reacts', { method:'POST', body:JSON.stringify({ id, user_id:ME.id, name:ME.name, target, emo, to_user:toUser || null }) }); navigator.vibrate?.(12); }
  }catch(e){ rx = had ? [...rx, { id, user_id:ME.id, name:ME.name, target, emo }] : rx.filter(r=>r.id !== id); onChange(); toast('반응을 보내지 못했어요'); }
}

function rxBtn(target, emo, label, extra, alt){
  const ts = alt ? [target, alt] : [target];
  const n = ts.reduce((a, t)=>a + cnt(t, emo), 0), on = ts.some(t=>mine(t, emo));
  const tgt = alt && mine(alt, emo) ? alt : target;                         // 예전 카드에 눌렀던 걸 떼면 그쪽에서 뗀다
  return `<button type="button" class="ft-b${on ? ' on' : ''}" aria-pressed="${on}" data-rx="${esc(tgt)}" data-emo="${esc(emo)}"${extra || ''}>${emo} ${esc(label)}${n ? ` <b>${n}</b>` : ''}</button>`;
}

function who(c){
  return `<b>${esc(c.name)}</b><span class="tag ft-co${c.cohort === '6기' ? ' six' : ''}">${esc(tag(c.cohort))}</span>${c.user_id === OWNER_ID ? '<span class="tag ft-co">운영</span>' : ''}<small>${esc(ago(c.created_at))}</small>`;
}
function comment(c, T, isReply, topId){
  const mineC = ME && (c.user_id === ME.id || ME.id === OWNER_ID);
  return `<div class="ft-c${isReply ? ' re' : ''}"><div class="ft-ch">${isReply ? '↳ ' : ''}${who(c)}</div>
    <div class="ft-ct">${esc(c.text)}</div>
    <div class="ft-ca">${rxBtn(rC(c.id), '❤️', '공감', ` data-to="${esc(c.user_id)}"`)}${rxBtn(rC(c.id), '👍', '추천', ` data-to="${esc(c.user_id)}"`)}
      <button type="button" class="ft-b" data-reply="${esc(T)}" data-top="${esc(topId)}" data-rname="${esc(c.name)}">↩ 답글</button>
      ${mineC ? `<button type="button" class="ft-b" data-del="${esc(c.id)}" aria-label="내 글 지우기">🗑</button>` : ''}</div></div>`;
}
function thread(T, alt){
  const rows = (talk || []).filter(t=>t.target === T || (alt && t.target === alt));
  const tops = rows.filter(t=>!t.parent), reps = p => rows.filter(t=>t.parent === p);
  const rt = replyTo[T];
  return `<div class="ft-th">
    ${tops.map(c=>comment(c, T, false, c.id) + reps(c.id).map(r=>comment(r, T, true, c.id)).join('')).join('') || '<div class="ft-empty">아직 댓글이 없어요 — 첫 한마디를 남겨 주세요 🙌</div>'}
    <div class="ft-in">${rt ? `<div class="ft-rt">↩ <b>${esc(rt.name)}</b>님에게 답글 <button type="button" class="ft-b" data-rcancel="${esc(T)}">취소</button></div>` : ''}
      <div class="ft-row"><input maxlength="${MAXLEN}" data-draft="${esc(T)}" value="${esc(draft[T] || '')}" placeholder="${rt ? '답글 쓰기' : '한마디 남기기'} · 내 기수(${esc(tag(ME?.cohort))})가 같이 보여요" aria-label="댓글">
        <button type="button" class="btn sm mint" data-send="${esc(T)}">남기기</button></div></div></div>`;
}

/* 카드 하나 밑에 붙는 블록: 추천·가봤어요·댓글 + (펼치면) 댓글.
   altId: 앱에서 먼저 등록됐다가 네이버 리스트로 옮겨진 카드 — 그때 달린 댓글·추천을 같이 보여 준다 */
function block(kind, id, altId, extra){
  if(!ok(id)) return '';
  const T = tTarget(kind, id), A = altId && ok(altId) ? tTarget(kind, altId) : null;
  const n = (talk || []).filter(t=>t.target === T || (A && t.target === A)).length;
  const bar = `${rxOk === false ? '' : rxBtn(rP(kind, id), '👍', '추천', '', A && rP(kind, altId)) + rxBtn(rP(kind, id), '🙋', '가봤어요', '', A && rP(kind, altId))}
    ${talkOk === false ? '' : `<button type="button" class="ft-b${open.has(T) ? ' on' : ''}" aria-expanded="${open.has(T)}" data-tg="${esc(T)}">💬 댓글${n ? ` <b>${n}</b>` : ''}</button>`}`;
  return `<div class="ft"><div class="ft-bar">${bar}${extra || ''}</div>${open.has(T) && talkOk !== false ? thread(T, A) : ''}</div>`;
}

/* ── 앱에서 등록 → 운영자가 네이버 리스트에 반영 ──────────────────────────
   네이버 '양서학' 리스트는 만든 사람(오웬)만 고칠 수 있다. 그래서:
   ① 누구나 네이버지도 링크 + 이름 + 지역 + 한줄평으로 등록 → 앱 목록에 바로 뜬다 (양서학 리스트 ❌)
   ② 오웬이 그 링크를 열어 네이버 리스트에 저장 → 10분 안에 같은 장소 번호(pid)를 찾아 ⭕ 로 바뀌고 네이버 카드 하나로 합쳐진다
      (pid 를 못 뽑은 등록은 이름으로 맞춘다). 등록한 사람·운영자만 지울 수 있다. */
const addOpen = {}, AREAS = { food:['양양', '속초', '고성', '강릉', '기타'], spot:['양양', '속초', '고성', '강릉', '기타'] };
const cardId = rowId => 'a-' + String(rowId).replace(/[^\w-]/g, '_').slice(0, 38);
const pidFrom = s => (String(s || '').match(/(?:entry\/place|\/place|\/restaurant|\/cafe|\/accommodation|\/attraction|\/hairshop|\/nailshop|\/hospital)\/(\d{4,12})/) || [])[1]
  || (String(s || '').match(/[?&](?:pinId|placeId)=(\d{4,12})/) || [])[1] || '';
function registry(kind){
  const list = getItems(kind), pending = [], merged = new Map();
  (talk || []).filter(t=>t.target === `add:${kind}` && t.title).forEach(t=>{
    const reg = { id:cardId(t.id), row:t.id, n:String(t.title).slice(0, 30), a:AREAS[kind].includes(t.area) ? t.area : '기타', m:String(t.text || '').slice(0, 80),
      u:NAVER_OK.test(t.link || '') ? t.link : '', pid:/^\d{4,12}$/.test(String(t.pid || '')) ? String(t.pid) : '', t:new Date(t.created_at).getTime() || 0,
      lat:null, lon:null, by:{ id:t.user_id, name:t.name, cohort:t.cohort } };
    const hit = list.find(i=>(reg.pid && pidFrom(i.u) === reg.pid) || norm(i.n) === norm(reg.n));
    if(hit){ if(!merged.has(hit.id)) merged.set(hit.id, reg); } else pending.push(reg);
  });
  return { pending, merged };
}
const added = kind => registry(kind).pending;
const regOf = (kind, id) => registry(kind).merged.get(id) || null;
/* 카드 머리에 붙는 줄: 누가 등록했나 + 양서학 리스트 반영 ❌/⭕ (+ 운영자에겐 네이버에 넣는 버튼) */
function regLine(reg, inList){
  const del = ME && (reg.by.id === ME.id || ME.id === OWNER_ID), owner = ME && ME.id === OWNER_ID;
  const href = reg.u || (reg.pid ? `https://map.naver.com/p/entry/place/${reg.pid}` : `https://map.naver.com/p/search/${encodeURIComponent(reg.n)}`);
  return `<div class="ft-by"><span>🙋 <b>${esc(reg.by.name)}</b><span class="tag ft-co${reg.by.cohort === '6기' ? ' six' : ''}">${esc(tag(reg.by.cohort))}</span> 님이 등록</span>
    <span class="ft-st${inList ? ' ok' : ''}">양서학 리스트 ${inList ? '⭕' : '❌'}</span>
    ${!inList && owner ? `<a class="ft-b" href="${esc(safeHttp(href) || '#')}" target="_blank" rel="noopener">📌 네이버에 넣기 ↗</a>` : ''}
    ${del && !inList ? `<button type="button" class="ft-b" data-del="${esc(reg.row)}" aria-label="등록 지우기">🗑</button>` : ''}</div>
    ${inList && reg.m ? `<div class="food-memo">🙋 ${esc(reg.m)}</div>` : ''}`;
}
/* 운영자에게만: 반영 대기 목록 요약 */
function ownerBox(kind){
  if(!ME || ME.id !== OWNER_ID || talkOk === false) return '';
  const n = registry(kind).pending.length;
  return n ? `<div class="ft-own"><span>📥 <b>양서학 리스트 반영 대기 ${n}곳</b></span><small>❌ 카드의 <b>📌 네이버에 넣기</b>로 열어 리스트에 저장하면 10분 안에 ⭕ 로 바뀌어요</small></div>` : '';
}
function addForm(kind, links){
  const lbl = kind === 'spot' ? '스팟' : '맛집', k = kind, d = n => esc(draft[`rq-${n}-${k}`] || ''), ar = draft[`rq-area-${k}`] || '';
  if(talkOk === false) return '';
  return `<div class="ft-req" data-rqbox="${esc(k)}"><div class="ft-rh"><b>➕ ${lbl} 등록하기</b>
      <small>네이버지도 링크 + 한줄평이면 <b>바로 올라가요</b> · 운영자가 리스트에 넣으면 ❌ → ⭕</small></div>
    ${addOpen[k] ? `<div class="ft-form">
        <label class="ft-lb">네이버지도 링크 <small>네이버지도 앱 → 장소 → 공유 → 링크 복사</small></label>
        <textarea rows="2" maxlength="400" data-rq="link" inputmode="url" placeholder="네이버지도에서 복사한 걸 그대로 붙여 넣어요 (https://naver.me/…)" aria-label="네이버지도 링크" style="width:100%;font:inherit">${d('link')}</textarea>
        <input maxlength="30" data-rq="title" placeholder="${lbl} 이름" aria-label="이름" value="${d('title')}">
        <div class="food-chips" role="group" aria-label="지역">${AREAS[k].map(a=>`<button type="button" data-rqarea="${esc(a)}" aria-pressed="${a === ar}">${esc(a)}</button>`).join('')}</div>
        <input maxlength="80" data-rq="text" placeholder="${kind === 'spot' ? '한줄 설명 (파도·포인트·주의점)' : '한줄평 (메뉴·웨이팅·팁)'}" aria-label="한줄평" value="${d('text')}">
        <div class="ft-err" role="alert" data-rqerr="${esc(k)}"></div>
        <div class="food-btns"><button type="button" class="btn sm mint" data-rqsend="${esc(k)}">등록하기</button><button type="button" class="btn sm ghost" data-rqopen="${esc(k)}">닫기</button></div>${links ? `<div class="ft-links">${links}</div>` : ''}</div>`
      : `<div class="ft-links"><button type="button" class="btn sm mint" data-rqopen="${esc(k)}">➕ ${lbl} 등록하기</button>${links || ''}</div>`}</div>`;
}

async function send(T){
  if(!ME) return;
  const text = String(draft[T] || '').trim().slice(0, MAXLEN); if(!text) return toast('내용을 적어 주세요');
  if(Date.now() - sentAt < 3000) return toast('조금 천천히요 🙂');
  const rt = replyTo[T];
  const row = { id:`${ME.id}|${Date.now()}`, target:T, parent:rt ? rt.top : null, user_id:ME.id, name:ME.name, cohort:ME.cohort || 'open', text, created_at:new Date().toISOString() };
  sentAt = Date.now();
  try{ await api('place_talk', { method:'POST', body:JSON.stringify(row) }); (talk ||= []).push(row); draft[T] = ''; delete replyTo[T]; onChange(); navigator.vibrate?.(12); }
  catch(e){ toast(e.code === 'notable' ? '댓글 표가 아직 없어요' : '남기지 못했어요 · 신호 확인'); }
}
async function sendAdd(kind, box){
  if(!ME) return;
  const v = k => String(box.querySelector(`[data-rq="${k}"]`)?.value || '').trim();
  const fail = (msg, field)=>{ const el = box.querySelector('[data-rqerr]'); if(el) el.textContent = '⚠️ ' + msg; toast(msg);
    const f = field && box.querySelector(field); if(f){ f.scrollIntoView({ block:'center', behavior:'smooth' }); f.focus?.({ preventScroll:true }); } };
  const title = v('title').slice(0, 30), text = v('text').slice(0, 80), area = draft[`rq-area-${kind}`] || '';
  const link = (v('link').match(/https?:\/\/\S+/) || [''])[0].replace(/[)\]>.,]+$/, '').slice(0, 200);   // '[네이버지도] 가게이름 … https://naver.me/…' 통째로 붙여도 링크만 뽑는다
  if(!link) return fail('네이버지도 링크를 붙여 주세요 — 장소 → 공유 → 링크 복사', '[data-rq="link"]');
  if(!NAVER_OK.test(link)) return fail('네이버지도 링크만 받아요 (naver.me · map.naver.com)', '[data-rq="link"]');
  if(!title) return fail('이름을 적어 주세요', '[data-rq="title"]');
  if(!AREAS[kind].includes(area)) return fail('지역을 하나 골라 주세요 (양양·속초·고성·강릉·기타)', '[data-rqarea]');
  if(!text) return fail('한줄평을 적어 주세요', '[data-rq="text"]');
  if(Date.now() - sentAt < 3000) return toast('조금 천천히요 🙂');
  sentAt = Date.now();
  const btn = box.querySelector('[data-rqsend]'); if(btn){ btn.disabled = true; btn.textContent = '확인 중…'; }
  let pid = pidFrom(link);
  if(!pid){ try{ const r = await fetch(`/api/naver-list?resolve=${encodeURIComponent(link)}`, { signal:AbortSignal.timeout(6000) }); pid = (await r.json())?.pid || ''; }catch(e){} }
  pid = /^\d{4,12}$/.test(String(pid)) ? String(pid) : '';
  const { pending } = registry(kind);
  const dupe = getItems(kind).find(i=>(pid && pidFrom(i.u) === pid) || norm(i.n) === norm(title)) || pending.find(i=>(pid && i.pid === pid) || norm(i.n) === norm(title));
  if(dupe){ if(btn){ btn.disabled = false; btn.textContent = '등록하기'; } return fail(`이미 목록에 있어요 — ‘${dupe.n}’ 카드에 💬 댓글로 남겨 주세요`); }
  const row = { id:`${ME.id}|${Date.now()}`, target:`add:${kind}`, parent:null, user_id:ME.id, name:ME.name, cohort:ME.cohort || 'open', title, area, link, pid:pid || null, text, created_at:new Date().toISOString() };
  try{ await api('place_talk', { method:'POST', body:JSON.stringify(row) }); (talk ||= []).push(row);
    ['title', 'link', 'text', 'area'].forEach(k=>delete draft[`rq-${k}-${kind}`]); addOpen[kind] = false; onChange(); toast('등록했어요 🙌 목록에 바로 올라갔어요'); navigator.vibrate?.(15); }
  catch(e){ if(btn){ btn.disabled = false; btn.textContent = '등록하기'; } fail(e.code === 'notable' ? '등록 표가 아직 없어요 (운영자 설정 필요)' : '등록하지 못했어요 · 신호 확인'); }
}
async function del(id){
  const had = talk; talk = (talk || []).filter(t=>t.id !== id && t.parent !== id); onChange();
  try{ await api(`place_talk?id=eq.${encodeURIComponent(id)}`, { method:'DELETE' }); await api(`place_talk?parent=eq.${encodeURIComponent(id)}`, { method:'DELETE' }).catch(()=>{}); }
  catch(e){ talk = had; onChange(); toast('지우지 못했어요'); }
}

/* 네이버지도 '공유 → 복사'는 보통 '[네이버지도]\n가게 이름\n주소\nhttps://naver.me/…' 꼴이다 — 이름과 지역을 대신 채운다(이미 적은 건 안 덮는다) */
function autofill(box, k, raw){
  if(!box) return;
  const lines = String(raw).split(/\n|\r/).map(x=>x.trim()).filter(Boolean).filter(x=>!/^https?:/i.test(x));
  const body = lines.filter(x=>!/^\[?네이버\s*지도\]?$/.test(x)).map(x=>x.replace(/^\[네이버\s*지도\]\s*/, ''));
  const addr = body.find(x=>/(강원|양양|속초|고성|강릉|서울|경기|부산)/.test(x) && /(시|군|구|읍|면|동|로|길)/.test(x)) || '';
  const name = body.find(x=>x !== addr && x.length <= 30 && !/^https?:/.test(x)) || '';
  const tIn = box.querySelector('[data-rq="title"]');
  if(name && tIn && !tIn.value){ tIn.value = name.slice(0, 30); draft[`rq-title-${k}`] = tIn.value; }
  const area = /양양/.test(addr) ? '양양' : /속초/.test(addr) ? '속초' : /고성/.test(addr) ? '고성' : /강릉/.test(addr) ? '강릉' : addr ? '기타' : '';
  if(area && !draft[`rq-area-${k}`]){ draft[`rq-area-${k}`] = area; box.querySelectorAll('[data-rqarea]').forEach(x=>x.setAttribute('aria-pressed', String(x.dataset.rqarea === area))); }
}

function init(root, rerender, itemsFn){
  onChange = rerender; getItems = itemsFn || (()=>[]);
  if(root.dataset.ftWired) return; root.dataset.ftWired = '1';
  root.addEventListener('input', e=>{
    const d = e.target.closest?.('[data-draft]'); if(d){ draft[d.dataset.draft] = d.value; return; }
    const q = e.target.closest?.('[data-rq]'); const k = q?.closest('[data-rqbox]')?.dataset.rqbox; if(q && k) draft[`rq-${q.dataset.rq}-${k}`] = q.value;
    if(q && k && q.dataset.rq === 'link') autofill(q.closest('[data-rqbox]'), k, q.value);
    const er = q?.closest('[data-rqbox]')?.querySelector('[data-rqerr]'); if(er) er.textContent = ''; });
  root.addEventListener('keydown', e=>{ if(e.key === 'Enter' && e.target.matches?.('[data-draft]')){ e.preventDefault(); send(e.target.dataset.draft); } });
  root.addEventListener('click', e=>{
    const b = e.target.closest('button'); if(!b || !root.contains(b)) return;
    if(b.dataset.rx){ toggleRx(b.dataset.rx, b.dataset.emo, b.dataset.to); return; }
    if(b.dataset.tg){ const T = b.dataset.tg; open.has(T) ? open.delete(T) : open.add(T); onChange(); return; }
    if(b.dataset.send){ send(b.dataset.send); return; }
    if(b.dataset.reply){ replyTo[b.dataset.reply] = { top:b.dataset.top, name:b.dataset.rname }; open.add(b.dataset.reply); onChange(); setTimeout(()=>root.querySelector(`[data-draft="${CSS.escape(b.dataset.reply)}"]`)?.focus(), 30); return; }
    if(b.dataset.rcancel){ delete replyTo[b.dataset.rcancel]; onChange(); return; }
    if(b.dataset.del){ if(confirm('이 글을 지울까요?')) del(b.dataset.del); return; }
    if(b.dataset.rqopen){ const k = b.dataset.rqopen; addOpen[k] = !addOpen[k]; onChange(); if(addOpen[k]) setTimeout(()=>root.querySelector(`[data-rqbox="${CSS.escape(k)}"] [data-rq="title"]`)?.focus(), 30); return; }
    if(b.dataset.rqarea){ const k = b.closest('[data-rqbox]')?.dataset.rqbox; if(k){ draft[`rq-area-${k}`] = b.dataset.rqarea; b.parentElement.querySelectorAll('[data-rqarea]').forEach(x=>x.setAttribute('aria-pressed', String(x === b))); } return; }
    if(b.dataset.rqsend){ sendAdd(b.dataset.rqsend, b.closest('.ft-form')); }
  });
}

/* 상단 알림줄이 쓰는 최근 소식 — 댓글·요청 */
function events(nameOf){
  return (talk || []).filter(t=>/^(food|spot|add:food|add:spot):?/.test(t.target)).slice(-12).map(t=>{
    const ts = new Date(t.created_at).getTime(); if(!(ts > 0)) return null;
    const isAdd = t.target.startsWith('add:'), kind = t.target.includes('spot') ? 'spot' : 'food';
    const id = t.target.split(':')[1];
    const place = isAdd ? t.title : (nameOf(kind, id) || added(kind).find(a=>a.id === id)?.n || [...registry(kind).merged.values()].find(a=>a.id === id)?.n);
    if(!place) return null;
    return { ts, ic:isAdd ? '🙋' : t.parent ? '↩' : '💬', kind, who:`${t.name}(${tag(t.cohort)})`,
      text:isAdd ? `님이 새 ${kind === 'spot' ? '스팟' : '맛집'} ‘${place}’을 등록했어요` : `님이 ‘${place}’에 ${t.parent ? '답글' : '댓글'}을 남겼어요` };
  }).filter(Boolean);
}

window.FT = { pull, block, addForm, added, regOf, regLine, ownerBox, init, events, ok };
})();
