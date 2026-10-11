/* ── 맛집·서핑 스팟의 댓글 · 대댓글 · 추천/공감 · 등록 요청 ───────────────────
   댓글·요청은 place_talk 표(supabase-placetalk.sql), 추천/공감은 기존 reacts 표를 쓴다.
   표가 아직 없으면(404) 그 기능만 조용히 빠지고 나머지 화면은 그대로다.

   남이 쓴 값(이름·기수·글·제목)은 전부 esc, 링크는 네이버 주소만 받고(피싱 방지) http(s) 만 그린다.
   target 에 들어가는 id 는 영문·숫자·_- 만 허용한다. */
(function(){
const OWNER_ID = 'infinagree', FRESH = 20e3, MAXLEN = 140;
let talk = null, talkOk = null, rx = [], rxOk = null, pulledAt = 0, pulling = null;
const open = new Set(), draft = {}, replyTo = {};
let sentAt = 0, onChange = ()=>{}, getItems = ()=>[];
const ok = id => /^[\w-]{1,40}$/.test(String(id));
const NAVER_OK = /^https?:\/\/(naver\.me|map\.naver\.com|m\.map\.naver\.com|m\.place\.naver\.com|pcmap\.place\.naver\.com|place\.map\.naver\.com)\//i;
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

function rxBtn(target, emo, label, extra){
  const n = cnt(target, emo), on = mine(target, emo);
  return `<button type="button" class="ft-b${on ? ' on' : ''}" aria-pressed="${on}" data-rx="${esc(target)}" data-emo="${esc(emo)}"${extra || ''}>${emo} ${esc(label)}${n ? ` <b>${n}</b>` : ''}</button>`;
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
function thread(T){
  const rows = (talk || []).filter(t=>t.target === T);
  const tops = rows.filter(t=>!t.parent), reps = p => rows.filter(t=>t.parent === p);
  const rt = replyTo[T];
  return `<div class="ft-th">
    ${tops.map(c=>comment(c, T, false, c.id) + reps(c.id).map(r=>comment(r, T, true, c.id)).join('')).join('') || '<div class="ft-empty">아직 댓글이 없어요 — 첫 한마디를 남겨 주세요 🙌</div>'}
    <div class="ft-in">${rt ? `<div class="ft-rt">↩ <b>${esc(rt.name)}</b>님에게 답글 <button type="button" class="ft-b" data-rcancel="${esc(T)}">취소</button></div>` : ''}
      <div class="ft-row"><input maxlength="${MAXLEN}" data-draft="${esc(T)}" value="${esc(draft[T] || '')}" placeholder="${rt ? '답글 쓰기' : '한마디 남기기'} · 내 기수(${esc(tag(ME?.cohort))})가 같이 보여요" aria-label="댓글">
        <button type="button" class="btn sm mint" data-send="${esc(T)}">남기기</button></div></div></div>`;
}

/* 카드 하나 밑에 붙는 블록: 추천·가봤어요·댓글 + (펼치면) 댓글 */
function block(kind, id){
  if(!ok(id)) return '';
  const T = tTarget(kind, id), n = (talk || []).filter(t=>t.target === T).length;
  const bar = `${rxOk === false ? '' : rxBtn(rP(kind, id), '👍', '추천') + rxBtn(rP(kind, id), '🙋', '가봤어요')}
    ${talkOk === false ? '' : `<button type="button" class="ft-b${open.has(T) ? ' on' : ''}" aria-expanded="${open.has(T)}" data-tg="${esc(T)}">💬 댓글${n ? ` <b>${n}</b>` : ''}</button>`}`;
  return `<div class="ft"><div class="ft-bar">${bar}</div>${open.has(T) && talkOk !== false ? thread(T) : ''}</div>`;
}

/* ── 등록 요청 ── 폴더에 직접 못 넣는 사람이 "이런 곳 추가해 주세요"를 남긴다. 목록에 올라오면 자동으로 '올라갔어요'로 바뀐다 */
const reqOpen = {};
function reqs(kind){
  if(talkOk === false) return '';
  const T = `req:${kind}`, names = getItems(kind).map(i=>norm(i.n));
  const rows = (talk || []).filter(t=>t.target === T).slice().reverse();
  const pend = rows.filter(r=>!names.includes(norm(r.title))), done = rows.length - pend.length;
  const lbl = kind === 'spot' ? '스팟' : '맛집';
  return `<div class="ft-req"><div class="ft-rh"><b>🙋 이런 ${lbl} 추가해 주세요</b>
      <small>네이버 폴더에는 만든 사람이 넣어요 · 요청이 올라가면 아래에서 ✅ 로 바뀌어요${done ? ` (지금까지 ${done}곳 반영)` : ''}</small></div>
    ${pend.map(r=>{ const mineR = ME && (r.user_id === ME.id || ME.id === OWNER_ID); const href = NAVER_OK.test(r.link || '') ? r.link : `https://map.naver.com/p/search/${encodeURIComponent(r.title || '')}`;
      return `<div class="ft-c"><div class="ft-ch"><b>${esc(r.title)}</b>${who(r)}</div>${r.text ? `<div class="ft-ct">${esc(r.text)}</div>` : ''}
        <div class="ft-ca">${rxBtn(rC(r.id), '🙋', '나도 궁금', ` data-to="${esc(r.user_id)}"`)}<a class="ft-b" href="${esc(safeHttp(href) || '#')}" target="_blank" rel="noopener">네이버지도 ↗</a>
        ${mineR ? `<button type="button" class="ft-b" data-del="${esc(r.id)}" aria-label="요청 지우기">🗑</button>` : ''}</div></div>`; }).join('') || '<div class="ft-empty">대기 중인 요청이 없어요</div>'}
    ${reqOpen[kind] ? `<div class="ft-form"><input maxlength="30" data-rq="title" placeholder="${lbl} 이름 (필수)" aria-label="이름" value="${esc(draft['rq-title-' + kind] || '')}">
        <input maxlength="200" data-rq="link" inputmode="url" placeholder="네이버지도 링크 (있으면)" aria-label="링크" value="${esc(draft['rq-link-' + kind] || '')}">
        <input maxlength="80" data-rq="text" placeholder="한줄평·이유 (선택)" aria-label="한줄평" value="${esc(draft['rq-text-' + kind] || '')}">
        <div class="food-btns"><button type="button" class="btn sm mint" data-rqsend="${esc(kind)}">요청 남기기</button><button type="button" class="btn sm ghost" data-rqopen="${esc(kind)}">닫기</button></div></div>`
      : `<button type="button" class="btn sm mint" data-rqopen="${esc(kind)}" style="margin-top:8px">➕ ${lbl} 추가 요청하기</button>`}</div>`;
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
async function sendReq(kind, box){
  if(!ME) return;
  const v = k => String(box.querySelector(`[data-rq="${k}"]`)?.value || '').trim();
  const title = v('title').slice(0, 30), text = v('text').slice(0, 80); let link = v('link').slice(0, 200);
  if(!title) return toast('이름을 적어 주세요');
  if(link && !NAVER_OK.test(link)) return toast('네이버지도 링크만 받아요 (naver.me · map.naver.com)');
  if(Date.now() - sentAt < 3000) return toast('조금 천천히요 🙂');
  const row = { id:`${ME.id}|${Date.now()}`, target:`req:${kind}`, parent:null, user_id:ME.id, name:ME.name, cohort:ME.cohort || 'open', title, link:link || null, text:text || null, created_at:new Date().toISOString() };
  sentAt = Date.now();
  try{ await api('place_talk', { method:'POST', body:JSON.stringify(row) }); (talk ||= []).push(row);
    ['title', 'link', 'text'].forEach(k=>delete draft[`rq-${k}-${kind}`]); reqOpen[kind] = false; onChange(); toast('요청을 남겼어요 🙌'); }
  catch(e){ toast(e.code === 'notable' ? '요청 표가 아직 없어요' : '남기지 못했어요 · 신호 확인'); }
}
async function del(id){
  const had = talk; talk = (talk || []).filter(t=>t.id !== id && t.parent !== id); onChange();
  try{ await api(`place_talk?id=eq.${encodeURIComponent(id)}`, { method:'DELETE' }); await api(`place_talk?parent=eq.${encodeURIComponent(id)}`, { method:'DELETE' }).catch(()=>{}); }
  catch(e){ talk = had; onChange(); toast('지우지 못했어요'); }
}

function init(root, rerender, itemsFn){
  onChange = rerender; getItems = itemsFn || (()=>[]);
  if(root.dataset.ftWired) return; root.dataset.ftWired = '1';
  root.addEventListener('input', e=>{
    const d = e.target.closest?.('[data-draft]'); if(d){ draft[d.dataset.draft] = d.value; return; }
    const q = e.target.closest?.('[data-rq]'); const k = q?.closest('[data-rqbox]')?.dataset.rqbox; if(q && k) draft[`rq-${q.dataset.rq}-${k}`] = q.value; });
  root.addEventListener('keydown', e=>{ if(e.key === 'Enter' && e.target.matches?.('[data-draft]')){ e.preventDefault(); send(e.target.dataset.draft); } });
  root.addEventListener('click', e=>{
    const b = e.target.closest('button'); if(!b || !root.contains(b)) return;
    if(b.dataset.rx){ toggleRx(b.dataset.rx, b.dataset.emo, b.dataset.to); return; }
    if(b.dataset.tg){ const T = b.dataset.tg; open.has(T) ? open.delete(T) : open.add(T); onChange(); return; }
    if(b.dataset.send){ send(b.dataset.send); return; }
    if(b.dataset.reply){ replyTo[b.dataset.reply] = { top:b.dataset.top, name:b.dataset.rname }; open.add(b.dataset.reply); onChange(); setTimeout(()=>root.querySelector(`[data-draft="${CSS.escape(b.dataset.reply)}"]`)?.focus(), 30); return; }
    if(b.dataset.rcancel){ delete replyTo[b.dataset.rcancel]; onChange(); return; }
    if(b.dataset.del){ if(confirm('이 글을 지울까요?')) del(b.dataset.del); return; }
    if(b.dataset.rqopen){ const k = b.dataset.rqopen; reqOpen[k] = !reqOpen[k]; onChange(); return; }
    if(b.dataset.rqsend){ sendReq(b.dataset.rqsend, b.closest('.ft-form')); }
  });
}
/* 요청 입력칸에 어느 종류인지 알려 주는 표식 — 위 input 핸들러가 읽는다 */
function reqWrap(kind){ return `<div data-rqbox="${esc(kind)}">${reqs(kind)}</div>`; }

/* 상단 알림줄이 쓰는 최근 소식 — 댓글·요청 */
function events(nameOf){
  return (talk || []).filter(t=>/^(food|spot|req:food|req:spot)/.test(t.target)).slice(-12).map(t=>{
    const ts = new Date(t.created_at).getTime(); if(!(ts > 0)) return null;
    const isReq = t.target.startsWith('req:'), kind = t.target.includes('spot') ? 'spot' : 'food';
    const place = isReq ? t.title : nameOf(kind, t.target.split(':')[1]);
    if(!place) return null;
    return { ts, ic:isReq ? '🙋' : t.parent ? '↩' : '💬', kind, who:`${t.name}(${tag(t.cohort)})`,
      text:isReq ? `님이 ‘${place}’ 추가를 요청했어요` : `님이 ‘${place}’에 ${t.parent ? '답글' : '댓글'}을 남겼어요` };
  }).filter(Boolean);
}

window.FT = { pull, block, reqs:reqWrap, init, events, ok };
})();
