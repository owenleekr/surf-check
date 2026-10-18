/* ── 🚤 수상레저 신고 · 기상특보 ──────────────────────────────────────
   양양 앞바다·해안에 풍랑·강풍·호우·대설(태풍·해일) 주의보가 나면 서핑하려면 해경 「기상특보활동신고」가 필요하다(경보면 활동 금지).
   /api/advisory(기상청 특보 현황)를 보고 특보가 있으면 홈 맨 위에 빨간 띠 + 신고 창을 하루 한 번 자동으로 연다.
   키가 없거나 기상청이 안 되면 파도 예보(waves.js)로 '주의보 수준' 어림만 — 공식 특보가 아니라고 분명히 적는다.
   「내 신고 메모」는 이 기기(localStorage)에만 — 서버로 안 보낸다. 주민등록번호·전화번호는 받지도 저장하지도 않는다.
   해경 신고 양식은 대신 채우거나 제출하지 않는다 — 공식 페이지를 새 탭으로 열고, 붙여 넣을 글만 복사해 준다. */
(function(){
const KCG = 'https://boat.kcg.go.kr/home/wtrlsrActInfo/';
const L = {
  wx:     { u:KCG + 'weathrSpcnwsDclr/infoIns2.do', t:'🚤 기상특보활동신고', s:'특보 중 서핑하려면 여기' },
  kma:    { u:'https://www.weather.go.kr/w/special-report/overall.do', t:'🌪️ 기상청 특보 보기', s:'지금 난 특보 지도' },
  wxchg:  { u:KCG + 'weathrSpcnwsDclr/infoChg1.do', t:'🔁 신고 확인 · 변경 · 취소', s:'기상특보신고' },
  wxinfo: { u:KCG + 'weathrSpcnwsDclr/infoView1.do', t:'📄 기상특보 중 활동 안내', s:'해경 설명 페이지' },
  near:   { u:KCG + 'sdstcWtrlsrActDclr/infoIns2.do', t:'🏖️ 근거리 자율신고', s:'평소 · 선택' },
  far:    { u:KCG + 'ldstcWtrlsrActDclr/infoIns2.do', t:'⛵ 원거리 신고', s:'10해리 넘게 나갈 때' },
};
const KA = 'lineup.share.adv', KM = 'lineup.share.kcgmemo', KO = 'lineup.share.adv.open', FRESH = 10 * 60e3;
const KINDS = ['서핑', 'SUP', '바디보드', '기타'];
const $k = id => document.getElementById(id);
const E = t => (typeof esc === 'function' ? esc(t) : String(t == null ? '' : t).replace(/[<>&"]/g, c=>({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;' }[c]))).replace(/'/g, '&#39;');
const ymd = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const hm = d => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
const say = t => { if(typeof toast === 'function') toast(t); };
const ext = (k, cls) => `<a class="${cls}" href="${L[k].u}" target="_blank" rel="noopener noreferrer">${L[k].t}</a>`;
let adv = null, busy = false;
try{ const c = JSON.parse(localStorage.getItem(KA) || 'null'); if(c && Date.now() - c.at < FRESH) adv = c.d; }catch(e){}

/* 기상청 응답은 남의 글 — 아는 이름만 남긴다(종류·구역 모두 허용 목록) */
const OKK = /^(풍랑|강풍|태풍|폭풍해일|해일|호우|대설)(주의보|경보)$/, OKA = /^(강원(북부|중부)앞바다|(양양|속초|고성|강릉)평지)$/;
function clean(d){
  if(!d || typeof d !== 'object') return { ok:false, reason:'api' };
  if(d.ok !== true) return { ok:false, reason:String(d.reason || 'api').slice(0, 10) };
  const active = (Array.isArray(d.active) ? d.active : []).map(x=>({ kind:String(x?.kind || ''), areas:(Array.isArray(x?.areas) ? x.areas : []).map(String).filter(a=>OKA.test(a)) }))
    .filter(x=>OKK.test(x.kind) && x.areas.length).slice(0, 6);
  return { ok:true, active, tmFc:/^\d{12}$/.test(String(d.tmFc || '')) ? String(d.tmFc) : null };
}
async function load(force){
  if(busy) return adv; if(!force && adv && (()=>{ try{ return Date.now() - JSON.parse(localStorage.getItem(KA)).at < FRESH; }catch(e){ return false; } })()) return adv;
  busy = true;
  try{ const r = await fetch('/api/advisory', AbortSignal.timeout ? { signal:AbortSignal.timeout(10000) } : undefined);
    const d = r.ok ? clean(await r.json()) : { ok:false, reason:'http' };
    adv = d; try{ localStorage.setItem(KA, JSON.stringify({ at:Date.now(), d })); }catch(e){} }
  catch(e){ adv = { ok:false, reason:'net' }; }
  busy = false; paint(); return adv;
}

/* 키 없음·실패일 때만 — 오늘·내일 양양(속초·양양 북부/양양 남부) 예보가 파고 3m 또는 바람 14m/s 넘으면 '주의보 수준' 어림 */
function estimate(){
  const fc = window._wave?.fc; if(!fc?.days?.length) return null;
  let top = null;
  fc.days.slice(0, 2).forEach((d, i)=>(d.regions || []).filter(r=>r.k === 'north' || r.k === 'south').forEach(r=>['am', 'pm'].forEach(p=>{ const x = r[p]; if(!x) return;
    const h = +x.h, w = +x.w; if(!(h >= 3 || w >= 14)) return;
    const sc = Math.max(h / 3, w / 14); if(!top || sc > top.sc) top = { sc, i, h:isFinite(h) ? h : null, w:isFinite(w) ? w : null, rn:String(r.n || '') }; })));
  return top;
}
/* 지금 상태 하나로: off(아무것도) · warn(경보) · adv(주의보) · est(예보 어림) */
function status(){
  if(adv?.ok && adv.active.length){ const w = adv.active.filter(x=>/경보$/.test(x.kind)); return { k:w.length ? 'warn' : 'adv', list:w.length ? w.concat(adv.active.filter(x=>!/경보$/.test(x.kind))) : adv.active }; }
  if(adv && !adv.ok){ const e = estimate(); if(e) return { k:'est', e }; }
  return { k:'off' };
}
const sig = s => s.list.map(x=>x.kind + ':' + x.areas.join(',')).join('|');
const head = s => { const a = s.list[0]; return `${a.kind} · ${a.areas.slice(0, 2).join('·')}${a.areas.length > 2 ? ` 외 ${a.areas.length - 2}곳` : ''}${s.list.length > 1 ? ` (+${s.list.length - 1})` : ''}`; };

function css(){
  if($k('kcg-css')) return; const st = document.createElement('style'); st.id = 'kcg-css';
  st.textContent = `
.adv-bar{ position:relative; margin:0 0 12px; padding:12px 12px 10px; border:2px solid var(--ink); border-radius:14px; background:#FFE3E0; box-shadow:0 2px 6px rgba(18,36,95,.14); color:var(--ink) }
.adv-bar.warn{ background:#FFD0CC } .adv-bar.est{ background:#FFF1C9 }
.adv-bar .ah{ display:flex; gap:8px; align-items:flex-start } .adv-bar .ah > i{ font-style:normal; font-size:22px; line-height:1.2 }
.adv-bar .ah b{ display:block; font-size:15px; line-height:1.35; color:#B3261E } .adv-bar.est .ah b{ color:#7A4B00 }
.adv-bar .ah small{ display:block; font-size:13px; line-height:1.5; color:var(--ink2); margin-top:2px; font-weight:700 }
.adv-btns{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px; margin-top:10px }
.adv-btns > *{ display:flex; align-items:center; justify-content:center; text-align:center; min-height:44px; padding:6px 8px; font:inherit; font-size:13.5px; font-weight:800; color:var(--ink); text-decoration:none; background:#fff; border:2px solid var(--ink); cursor:pointer; line-height:1.25 }
.adv-btns > .go{ background:var(--coral); color:#fff } .adv-btns > .wide{ grid-column:1 / -1 }
.kcg-in{ padding-bottom:calc(14px + env(safe-area-inset-bottom)) }
.kcg-st{ padding:10px 12px; border:2px solid var(--ink); background:#fff; font-size:13.5px; line-height:1.55; margin-bottom:10px }
.kcg-st.adv,.kcg-st.warn{ background:#FFE3E0 } .kcg-st.est{ background:#FFF1C9 } .kcg-st b{ display:block; font-size:14.5px }
.kcg-why{ margin:0 0 10px; padding-left:18px; font-size:13.5px; line-height:1.6; color:var(--ink2) } .kcg-why li{ margin:2px 0 }
.kcg-links{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px; margin-bottom:14px }
.kcg-links a{ display:flex; flex-direction:column; justify-content:center; min-height:56px; padding:8px 10px; border:2px solid var(--ink); background:#fff; color:var(--ink); text-decoration:none; font-weight:800; font-size:14px; line-height:1.3 }
.kcg-links a small{ font-size:12px; color:#5B6275; font-weight:700 } .kcg-links a.main{ grid-column:1 / -1; background:var(--coral); color:#fff; min-height:60px; font-size:16px } .kcg-links a.main small{ color:#fff }
.kcg-links a.kma{ background:#E4EEFF }
.kcg-memo{ border-top:2px dashed var(--grid); padding-top:12px } .kcg-memo h4{ margin:0 0 4px; font-size:15px }
.kcg-memo .who{ font-size:13px; color:var(--ink2); margin:0 0 8px }
.kcg-f{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px }
.kcg-f label{ display:flex; flex-direction:column; gap:3px; font-size:12.5px; font-weight:800; color:var(--ink2); min-width:0 } .kcg-f label.wide{ grid-column:1 / -1 }
.kcg-f input,.kcg-f select,.kcg-f textarea{ font:inherit; font-size:15px; min-height:44px; padding:6px 8px; border:2px solid var(--ink); background:#fff; color:var(--ink); width:100%; box-sizing:border-box; min-width:0 }
.kcg-f textarea{ min-height:64px; resize:vertical }
.kcg-act{ display:flex; gap:6px; margin-top:10px } .kcg-act .btn{ flex:1 }
.kcg-safe{ font-size:12.5px; color:var(--ink2); line-height:1.6; margin-top:10px; padding:8px 10px; background:#fff; border:2px dashed var(--grid) }
.wv-kcg{ display:block; width:100%; margin-top:10px }`;
  document.head.appendChild(st);
}

/* ── 홈 맨 위 띠 (생일 띠보다 위) ── */
function bar(){
  const home = $k('pane-home'); if(!home) return;
  let el = $k('adv-bar'); const s = status();
  if(s.k === 'off'){ if(el) el.hidden = true; return; }
  css();
  if(!el){ el = document.createElement('section'); el.id = 'adv-bar'; el.setAttribute('aria-label', '기상특보 · 해경 신고');
    el.addEventListener('click', e=>{ if(e.target.closest('[data-advmemo]')) open(); }); }
  if(home.firstChild !== el) home.insertBefore(el, home.firstChild);
  el.className = 'adv-bar ' + s.k;
  el.innerHTML = s.k === 'est'
    ? `<div class="ah"><i aria-hidden="true">🌊</i><div><b>주의보 수준 예보 — ${s.e.i === 0 ? '오늘' : '내일'} ${s.e.h != null ? `파고 ${E(s.e.h)}m` : ''}${s.e.h != null && s.e.w >= 14 ? ' · ' : ''}${s.e.w >= 14 ? `바람 ${E(s.e.w)}m/s` : ''}</b><small>예보로 어림한 거예요(공식 특보 아님). 특보가 나면 해경 신고가 필요해요.</small></div></div>
      <div class="adv-btns">${ext('kma', '')}<button type="button" data-advmemo>🚤 신고 안내</button></div>`
    : `<div class="ah"><i aria-hidden="true">⚠️</i><div><b>${E(head(s))}</b><small>${s.k === 'warn' ? '경보 중엔 서핑(수상레저활동)이 금지예요 — 바다에 들어가지 마세요' : '지금 서핑하려면 해경 「기상특보활동신고」가 필요해요'}</small></div></div>
      <div class="adv-btns">${s.k === 'warn' ? ext('kma', 'go wide') : ext('wx', 'go').replace(L.wx.t, '🚤 신고하러 가기') + ext('kma', '')}<button type="button" class="wide" data-advmemo>📝 내 신고 메모</button></div>`;
  el.setAttribute('role', s.k === 'est' ? 'status' : 'alert');
  el.hidden = false;
}

/* ── 신고 창 ── */
function memoGet(){ try{ const m = JSON.parse(localStorage.getItem(KM) || 'null'); return m && typeof m === 'object' ? m : {}; }catch(e){ return {}; } }
const BAD = /(\d{6}\s*-?\s*[1-8]\d{6})|(01[016789][\s.-]?\d{3,4}[\s.-]?\d{4})|(0\d{1,2}[\s.-]\d{3,4}[\s.-]\d{4})/;
function spotNames(){
  const n = [], add = x=>{ x = String(x || '').trim().slice(0, 30); if(x && !n.includes(x)) n.push(x); };
  try{ (typeof SEAS !== 'undefined' ? SEAS : []).forEach(x=>add(x[0])); }catch(e){}
  try{ (typeof window.foodItems === 'function' ? window.foodItems('spot') : []).forEach(i=>add(String(i.n || '').replace(/해수욕장|해변/, '').trim())); }catch(e){}
  return n.slice(0, 40);
}
function sheet(){
  let s = $k('kcg-sheet'); if(s) return s; css();
  s = document.createElement('div'); s.className = 'sheet'; s.id = 'kcg-sheet'; s.hidden = true;
  s.innerHTML = `<div class="sheet-dim" data-kcgclose></div><div class="sheet-in kcg-in" role="dialog" aria-modal="true" aria-label="수상레저 신고">
    <div class="sheet-hd"><span class="t">🚤 수상레저 신고</span><button type="button" class="btn sm ghost" data-kcgclose>닫기</button></div><div id="kcg-body"></div></div>`;
  document.body.appendChild(s);
  s.addEventListener('click', e=>{
    if(e.target.closest('[data-kcgclose]')){ s.hidden = true; return; }
    if(e.target.closest('#kcg-save')){ save(true); return; }
    if(e.target.closest('#kcg-copy')){ save(false); copy(); return; }
  });
  s.addEventListener('change', e=>{ if(e.target.id === 'kcg-spot') $k('kcg-spot2').hidden = e.target.value !== '__'; save(false); });
  s.addEventListener('input', ()=>{ clearTimeout(s._t); s._t = setTimeout(()=>save(false), 600); });
  return s;
}
function form(){
  const m = memoGet(), today = m.day === ymd(), now = new Date(); now.setMinutes(Math.ceil(now.getMinutes() / 10) * 10, 0, 0);
  const end = new Date(now.getTime() + 3 * 3600e3), names = spotNames(), sp = String(m.spot || ''), known = names.includes(sp);
  const name = typeof ME !== 'undefined' && ME?.name ? String(ME.name).slice(0, 20) : '';
  return `<div class="kcg-memo"><h4>📝 내 신고 메모</h4>
    <p class="who">${name ? `${E(name)} 님 · ` : ''}이 기기에만 저장돼요 — 신고 양식에 붙여 넣을 때 쓰세요.</p>
    <div class="kcg-f">
      <label class="wide">활동 장소<select id="kcg-spot"><option value="">고르세요</option>${names.map(n=>`<option${n === sp ? ' selected' : ''}>${E(n)}</option>`).join('')}<option value="__"${sp && !known ? ' selected' : ''}>직접 입력</option></select>
        <input id="kcg-spot2" maxlength="30" placeholder="예) 양양 죽도 해변 북쪽" value="${sp && !known ? E(sp) : ''}"${sp && !known ? '' : ' hidden'}></label>
      <label>활동 종류<select id="kcg-kind">${KINDS.map(k=>`<option${k === (m.kind || '서핑') ? ' selected' : ''}>${k}</option>`).join('')}</select></label>
      <label>인원<input id="kcg-n" type="number" inputmode="numeric" min="1" max="50" value="${Math.max(1, Math.min(50, +m.n || 1))}"></label>
      <label>시작<input id="kcg-t0" type="time" value="${today && /^\d{2}:\d{2}$/.test(m.t0 || '') ? m.t0 : hm(now)}"></label>
      <label>종료<input id="kcg-t1" type="time" value="${today && /^\d{2}:\d{2}$/.test(m.t1 || '') ? m.t1 : hm(end)}"></label>
      <label class="wide">장비 — 서프보드<input id="kcg-gear" type="number" inputmode="numeric" min="0" max="50" value="${Math.max(0, Math.min(50, m.gear == null ? 1 : +m.gear || 0))}"></label>
      <label class="wide">메모<textarea id="kcg-note" maxlength="200" placeholder="예) 롱보드 2 · 보호자 동행 · 강습 일행">${E(m.note || '')}</textarea></label>
    </div>
    <div class="kcg-act"><button type="button" class="btn sm ghost" id="kcg-save">💾 저장</button><button type="button" class="btn sm blue" id="kcg-copy">📋 복사</button></div>
    <div class="kcg-safe">🔒 주민등록번호·전화번호는 앱에 저장하지 않아요 — 해경 사이트 본인확인은 직접 해 주세요. 메모는 이 휴대폰에만 남고 어디로도 보내지 않아요.</div></div>`;
}
function read(){
  const v = id => ($k(id)?.value || '').trim(), sel = v('kcg-spot');
  return { day:ymd(), spot:(sel === '__' ? v('kcg-spot2') : sel).slice(0, 30), kind:KINDS.includes(v('kcg-kind')) ? v('kcg-kind') : '서핑',
    n:Math.max(1, Math.min(50, parseInt(v('kcg-n')) || 1)), t0:v('kcg-t0').slice(0, 5), t1:v('kcg-t1').slice(0, 5),
    gear:Math.max(0, Math.min(50, parseInt(v('kcg-gear')) || 0)), note:v('kcg-note').slice(0, 200) };
}
function save(loud){
  if(!$k('kcg-kind')) return;
  const m = read();
  if(BAD.test(m.note) || BAD.test(m.spot)){ m.note = m.note.replace(new RegExp(BAD.source, 'g'), '').trim(); m.spot = m.spot.replace(new RegExp(BAD.source, 'g'), '').trim();
    $k('kcg-note').value = m.note; if($k('kcg-spot').value === '__') $k('kcg-spot2').value = m.spot; say('전화번호·주민등록번호는 저장하지 않아요 — 지웠어요'); loud = false; }
  try{ localStorage.setItem(KM, JSON.stringify(m)); if(loud) say('💾 이 기기에 저장했어요'); }catch(e){ if(loud) say('저장 공간이 없어 저장하지 못했어요'); }
}
function text(){
  const m = read(), d = new Date(), DOW = '일월화수목금토', name = typeof ME !== 'undefined' && ME?.name ? String(ME.name).slice(0, 20) : '';
  return ['[수상레저 활동 메모]', name && `이름: ${name}`, `날짜: ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} (${DOW[d.getDay()]})`,
    `활동 장소: ${m.spot || '(미정)'}`, `활동 종류: ${m.kind}`, `인원: ${m.n}명`, `활동 시간: ${m.t0 || '?'} ~ ${m.t1 || '?'}`, `장비: 서프보드 ${m.gear}개`, m.note && `메모: ${m.note}`].filter(Boolean).join('\n');
}
async function copy(){
  const t = text(); let ok = false;
  try{ if(navigator.clipboard?.writeText){ await navigator.clipboard.writeText(t); ok = true; } }catch(e){}
  if(!ok){ try{ const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove(); }catch(e){} }
  window._kcgLastCopy = t;
  say(ok ? '📋 복사했어요 — 해경 신고 양식에 붙여 넣으세요' : '복사가 안 돼요 — 메모를 길게 눌러 복사해 주세요');
}
function open(){
  const s = sheet(), st = status();
  const head1 = st.k === 'warn' || st.k === 'adv'
    ? `<div class="kcg-st ${st.k}"><b>⚠️ 지금 특보: ${st.list.map(x=>`${E(x.kind)} · ${E(x.areas.join('·'))}`).join(' / ')}</b>${st.k === 'warn' ? '경보 중엔 서핑할 수 없어요.' : '서핑하려면 아래 「기상특보활동신고」를 먼저 해 주세요.'}</div>`
    : st.k === 'est' ? `<div class="kcg-st est"><b>🌊 주의보 수준 예보 (어림)</b>공식 특보는 기상청에서 확인하세요. 특보가 나면 신고가 필요해요.</div>`
    : adv?.ok ? `<div class="kcg-st"><b>✅ 지금 양양 바다에 난 특보는 없어요</b>평소엔 신고 없이 서핑해도 돼요.</div>`
    : `<div class="kcg-st"><b>특보를 확인하지 못했어요</b>나가기 전에 기상청 특보를 한 번 보세요.</div>`;
  $k('kcg-body').innerHTML = head1 + `
    <ul class="kcg-why"><li>양양 앞바다·해안에 <b>풍랑·강풍·호우·대설 주의보</b>가 나면, 서핑 전에 해경에 「기상특보활동신고」를 해야 해요.</li>
      <li><b>경보</b>가 나면 서핑 자체가 금지예요.</li><li>신고 사이트는 이름·주민등록번호로 본인확인부터 해요 — 그건 해경 사이트에서 직접.</li></ul>
    <div class="kcg-links">${ext('wx', 'main').replace('</a>', `<small>${L.wx.s}</small></a>`)}${['kma', 'wxchg', 'wxinfo', 'near', 'far'].map(k=>ext(k, k === 'kma' ? 'kma' : '').replace('</a>', `<small>${L[k].s}</small></a>`)).join('')}</div>` + form();
  s.hidden = false;
}

/* 특보가 새로 나면 하루 한 번 창을 연다 — 다른 창·안내가 떠 있으면 비켜 줄 때까지 기다린다 */
let autoT = 0, autoN = 0;
function auto(){
  const s = status(); if(s.k !== 'adv' && s.k !== 'warn') return;
  const key = ymd() + '|' + sig(s); let seen = ''; try{ seen = localStorage.getItem(KO) || ''; }catch(e){}
  if(seen === key) return;
  const busyUI = document.querySelector('.sheet:not([hidden]), .pop:not([hidden]), .game:not([hidden])') || ($k('onb') && !$k('onb').hidden) || !document.body.classList.contains('on-home') || typeof ME === 'undefined' || !ME;
  if(busyUI){ clearTimeout(autoT); if(++autoN < 60) autoT = setTimeout(auto, 2000); return; }
  try{ localStorage.setItem(KO, key); }catch(e){}
  open();
}
function paint(){ bar(); auto(); }

window.kcgOpen = open;
window._kcg = { load, status, estimate, paint, text, get adv(){ return adv; }, set adv(v){ adv = v; } };
function boot(){ css(); paint(); load(); [3000, 9000, 20000].forEach(t=>setTimeout(paint, t)); setInterval(()=>{ if(!document.hidden) load(); }, FRESH); }
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) load(); });
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
