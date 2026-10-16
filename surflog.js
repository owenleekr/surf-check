/* ── 📒 서핑 일지 ─────────────────────────────────────────────────
   "오늘 어디서 얼마나 탔지?"를 10초 만에 남긴다 — 스팟 · 시간 · 탄 파도 · 기분 · 한줄.
   그날 파도 예보(/api/forecast, waves.js)를 같이 적어 두면 나중에 "몇 m 에서 잘 탔나"가 보인다.
   저장은 내 프로필(play.log) — 다른 기기와는 id 로 합친다(play.js playMerge). 날짜마다 처음 남길 때 +15 XP.
   값은 내 프로필에서 오지만 화면에 찍기 전에 전부 걸러 낸다(숫자는 범위, 글자는 esc).
   탄 파도는 정확한 개수(wn 0~99)로 — 옛 기록·옛 버전과 맞추려고 구간(w)도 같이 남긴다.
   잘한 것·아쉬운 것·받은 피드백(good·bad·fb)은 '자세히 쓰기'에 접어 둔다(10초 기록을 해치지 않게). */
(function(){
const $l = id => document.getElementById(id);
const MIN = [30, 60, 90, 120, 180], WAVES = ['0개', '1~2개', '3~5개', '6~10개', '10개+'], FEEL = ['😵 힘듦', '😐 그럭저럭', '🙂 좋음', '😆 최고'];
const todayS = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const wB = n => n <= 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : n <= 10 ? 3 : 4;   // 정확한 개수 → 옛 구간
const QWN = [0, 1, 3, 5, 10], NOTE = [['good', '👍 잘한 것', '예) 테이크오프 타이밍 잡았다'], ['bad', '🤔 아쉬운 것', '예) 패들 늦게 시작해서 파도 놓침'], ['fb', '🗣️ 받은 피드백', '예) 코치: 시선을 해변 말고 진행 방향으로']];
const num = (v, lo, hi) => { v = Math.round(+v); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo; };
const cleanWn = v => v == null || v === '' || !isFinite(+v) ? null : num(v, 0, 99);
const clean = e => e && typeof e === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(String(e.d)) ? {
  id:String(e.id || '').slice(0, 40), d:e.d, s:String(e.s || '').slice(0, 20), m:num(e.m, 10, 600), wn:cleanWn(e.wn), w:cleanWn(e.wn) != null ? wB(cleanWn(e.wn)) : num(e.w, 0, 4), f:num(e.f, 0, 3),
  good:String(e.good || '').slice(0, 120), bad:String(e.bad || '').slice(0, 120), fb:String(e.fb || '').slice(0, 120),
  t:String(e.t || '').slice(0, 60), h:e.h == null || !isFinite(+e.h) ? null : Math.max(0, Math.min(9, Math.round(+e.h * 10) / 10)),
  tm:e.tm === 1 || e.tm === 0 ? e.tm : null, wx:cleanWx(e.wx) } : null;
/* 그날 파도 — /api/forecast?day= 에서 받은 값. 남의 프로필에서도 오므로 숫자만, 범위 안으로 */
function cleanWx(w){
  if(!w || typeof w !== 'object') return null;
  const n = (v, lo, hi, d)=>v == null || !isFinite(+v) ? null : Math.max(lo, Math.min(hi, Math.round(+v * (d || 10)) / (d || 10)));
  const o = { h:n(w.h, 0, 9), p:n(w.p, 0, 30), dir:n(w.dir, -1, 360, 1), w:n(w.w, 0, 40), wd:n(w.wd, -1, 360, 1), sst:n(w.sst, -5, 35), tmp:n(w.tmp, -30, 45) };
  return o.h == null ? null : o;
}
const wTxt = e => e.wn != null ? e.wn + '개' : WAVES[e.w];   // 옛 기록은 구간 그대로
const COMP = d => d == null || d < 0 ? '' : ['북','북동','동','남동','남','남서','서','북서'][Math.round(d / 45) % 8];
const wxLine = (w, tm) => w ? `${tm === 0 ? '오전 ' : tm === 1 ? '오후 ' : ''}${w.h}m${w.p ? ` · ${w.p}초` : ''}${COMP(w.dir) ? ` · ${COMP(w.dir)}쪽 파도` : ''}${w.w != null ? ` · 바람 ${COMP(w.wd)}${COMP(w.wd) ? '풍 ' : ''}${w.w}m/s` : ''}${w.sst != null ? ` · 수온 ${w.sst}°${typeof suitOf === 'function' ? ` (${suitOf(w.sst)})` : ''}` : ''}` : '';
const me = () => (typeof ME !== 'undefined' && ME) ? ME : null;      // ME 는 surfshare.html 의 전역 let — window 속성이 아니다
const P = () => (typeof playP === 'function' && me()?.profile) ? playP() : null;
const logs = () => { const p = P(); return p && Array.isArray(p.log) ? p.log.map(clean).filter(Boolean).sort((a, b)=>a.d < b.d ? 1 : a.d > b.d ? -1 : 0) : []; };

function spotNames(){
  const L = (typeof window.foodItems === 'function' ? window.foodItems('spot') : []).map(i=>String(i.n || '').replace(/해수욕장|해변/g, '').trim()).filter(Boolean);
  const seen = new Set(), out = [];
  /* 내가 자주 간 곳을 앞에 */
  const cnt = {}; logs().forEach(e=>{ cnt[e.s] = (cnt[e.s] || 0) + 1; });
  Object.keys(cnt).sort((a, b)=>cnt[b] - cnt[a]).concat(['낙산'], L).forEach(n=>{ if(n && !seen.has(n)){ seen.add(n); out.push(n); } });
  return out.slice(0, 10);
}
const regionOfSpot = name => { const it = (typeof window.foodItems === 'function' ? window.foodItems('spot') : []).find(i=>String(i.n || '').replace(/해수욕장|해변/g, '').trim() === name);
  const lat = it?.lat ?? (/고성|아야진|천진|봉수대|삼포|송지호|공현진|가진/.test(name) ? 38.3 : /속초|설악|물치|낙산|정암|후진/.test(name) ? 38.12 : 38.0);
  return lat >= 38.25 ? 'goseong' : lat >= 38.09 ? 'north' : 'south'; };
const WXC = {};
async function fetchWx(d, s){
  const r = regionOfSpot(s), k = d + '|' + r; if(WXC[k]) return WXC[k];
  try{ const res = await fetch(`/api/forecast?day=${encodeURIComponent(d)}&r=${r}`, AbortSignal.timeout ? { signal:AbortSignal.timeout(12000) } : undefined); if(!res.ok) throw 0; const j = await res.json(); WXC[k] = j; return j; }catch(e){ return null; }
}
function waveOf(d){
  const fc = window._wave?.fc; const day = fc?.days?.find(x=>x.day === d); if(!day) return null;
  const hs = day.regions.flatMap(r=>[r.am, r.pm]).filter(x=>x && x.h != null).map(x=>x.h);
  return hs.length ? Math.round(hs.reduce((a, b)=>a + b, 0) / hs.length * 10) / 10 : null;
}

function render(){
  const el = $l('home-log'); if(!el) return;
  if(!me()?.profile){ el.hidden = true; return; }
  const L = logs(), td = todayS(), mon = td.slice(0, 7), M = L.filter(e=>e.d.slice(0, 7) === mon);
  const hrs = Math.round(M.reduce((a, e)=>a + e.m, 0) / 6) / 10, cnt = {}; L.forEach(e=>{ cnt[e.s] = (cnt[e.s] || 0) + 1; });
  const fav = Object.keys(cnt).sort((a, b)=>cnt[b] - cnt[a])[0], done = L.some(e=>e.d === td);
  /* 이번 주 바다 간 동기 — 마을 명단(state.town, 홈에서 이미 받아 둠)의 각자 일지에서 */
  const wk = (()=>{ const d = new Date(Date.now() - 6 * 864e5); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); })();
  const town = (typeof state !== 'undefined' && Array.isArray(state.town)) ? state.town : [];
  const fr = town.filter(x=>x && x.id !== me().id).map(x=>{ const raw = x.profile?.play?.log; const a = Array.isArray(raw) ? raw.slice(-60).map(clean).filter(e=>e && e.d >= wk && e.d <= td) : [];
    if(!a.length) return null; a.sort((p, q)=>p.d < q.d ? 1 : -1); return { name:String(x.name || '').slice(0, 12), n:a.length, s:a[0].s, h:a.reduce((t, e)=>t + e.m, 0) }; }).filter(Boolean).sort((a, b)=>b.n - a.n || b.h - a.h);
  const mine = L.filter(e=>e.d >= wk).length;
  const frHTML = town.length ? `<div class="sl-fr"><b>🌊 이번 주 바다 간 동기</b>${fr.length ? `<div class="sl-frs">${fr.slice(0, 8).map(f=>`<span><b>${esc(f.name)}</b> ${esc(f.s || '')} ${f.n}번</span>`).join('')}</div>`
    : `<small>${mine ? '이번 주엔 아직 나만 기록했어요 🏄' : '아직 아무도 기록 안 했어요 — 첫 번째가 돼 봐요'}</small>`}</div>` : '';
  el.hidden = false;
  el.innerHTML = `<div class="hsec">📒 서핑 일지 <small>바다에 다녀오면 10초 기록</small></div>
    <div class="sl-card">
      <div class="sl-sum"><div><b>${M.length}</b><small>이번 달</small></div><div><b>${hrs}</b><small>시간</small></div><div><b>${L.length}</b><small>전체</small></div><div class="sl-fav"><b>${fav ? esc(fav) : '-'}</b><small>자주 간 곳</small></div></div>
      <button type="button" class="btn ${done ? 'ghost' : 'blue'} sl-go" data-slnew>${done ? '✓ 오늘 기록했어요 · 하나 더' : '🏄 오늘 서핑 기록하기 <small>+15 XP</small>'}</button>
      ${L.length ? `<div class="sl-list">${L.slice(0, 3).map(row).join('')}</div>${L.length > 3 ? `<button type="button" class="sl-more" data-slall>기록 ${L.length}개 모두 보기 ›</button>` : ''}` : '<div class="note" style="margin:8px 0 0">첫 기록을 남기면 이번 달 몇 번·몇 시간 탔는지 쌓여요.</div>'}
      ${frHTML}
    </div>`;
  el.onclick = e=>{ if(e.target.closest('[data-slnew]')) form(); else if(e.target.closest('[data-slall]')) all(); else { const r = e.target.closest('[data-slid]'); if(r) form(r.dataset.slid); } };
}
function row(e, full){
  const [y, m, d] = e.d.split('-'), dow = '일월화수목금토'[new Date(e.d + 'T00:00').getDay()];
  return `<button type="button" class="sl-row" data-slid="${esc(e.id)}"><span class="sl-d"><b>${+m}.${+d}</b><small>${dow}</small></span>
    <span class="sl-m"><b>${esc(e.s || '어딘가')}</b><small>${e.m >= 60 ? (e.m / 60).toString().replace(/\.0$/, '') + '시간' : e.m + '분'} · 파도 ${wTxt(e)}${e.wx ? ` · 🌊 ${e.wx.h}m${e.wx.p ? '·' + e.wx.p + '초' : ''}${e.wx.w != null ? '·바람 ' + e.wx.w : ''}` : e.h != null ? ` · 예보 ${e.h}m` : ''}${e.t ? ' · ' + esc(e.t) : ''}${!full && (e.good || e.bad || e.fb) ? ' · ✍️' : ''}</small>${full ? NOTE.filter(([k])=>e[k]).map(([k, lb])=>`<span class="sl-nt">${lb.split(' ')[0]} ${esc(e[k])}</span>`).join('') : ''}</span><span class="sl-f">${FEEL[e.f].split(' ')[0]}</span></button>`;
}

let cur = null, slDraft = null;
function sheet(){
  let sh = $l('sl-sheet');
  if(!sh){ sh = document.createElement('div'); sh.className = 'sheet'; sh.id = 'sl-sheet'; sh.hidden = true;
    sh.innerHTML = '<div class="sheet-dim" data-slclose></div><div class="sheet-in"><div class="sheet-hd"><span class="t" id="sl-t">📒 서핑 기록</span><button class="btn sm ghost" data-slclose>닫기</button></div><div id="sl-body"></div></div>';
    document.body.appendChild(sh);
    sh.addEventListener('click', onClick);
    sh.addEventListener('change', e=>{ if(!cur || !e.target.matches('[data-sldate]')) return; const v = e.target.value; if(/^\d{4}-\d{2}-\d{2}$/.test(v) && v <= todayS()){ cur.d = v; cur.wx = null; cur.h = null; const b = e.target.parentNode.querySelector('[data-slk="d"][data-slv="2"]'); if(b) b.textContent = `🗓️ ${+v.slice(5, 7)}.${+v.slice(8)}`; loadWx(); } });
    sh.addEventListener('input', e=>{ if(!cur) return; const k = e.target.dataset.slin; if(k === 't') cur.t = e.target.value.slice(0, 60); if(NOTE.some(n=>n[0] === k)) cur[k] = e.target.value.slice(0, 120); if(k === 's'){ cur.s = e.target.value.slice(0, 20); cur.sOther = 1; } }); }
  return sh;
}
function chips(key, items, val){ return `<div class="food-chips sl-chips" role="group">${items.map((t, i)=>`<button type="button" data-slk="${key}" data-slv="${i}" aria-pressed="${val === i}">${t}</button>`).join('')}</div>`; }
function form(id, pre){
  const old = id ? logs().find(e=>e.id === id) : null;
  cur = old ? { ...old } : (slDraft && slDraft.d === todayS() && !pre) ? { ...slDraft } : { id:'', d:todayS(), s:spotNames()[0] || '낙산', m:60, w:2, wn:3, f:2, t:'', good:'', bad:'', fb:'' };
  const resumed = !old && !pre && slDraft && cur.d === slDraft.d && cur.t === slDraft.t;
  /* 체크인 → '나왔어요' 에서 열리면 그 해변과 머문 시간으로 미리 채운다 */
  if(!old && pre){ if(pre.s) cur.s = String(pre.s).replace(/해수욕장|해변/g, '').trim().slice(0, 20); if(pre.m){ const m = +pre.m; cur.m = MIN.reduce((b, x)=>Math.abs(x - m) < Math.abs(b - m) ? x : b, 60); } }
  if(cur.tm == null) cur.tm = new Date().getHours() < 13 ? 0 : 1;
  const sh = sheet(); $l('sl-t').textContent = old ? '📒 기록 고치기' : resumed ? '📒 쓰던 기록 이어서' : '📒 오늘 서핑 기록'; paintForm(!!old); sh.hidden = false; loadWx();
}
function paintForm(edit){
  const names = spotNames(); if(cur.s && !names.includes(cur.s)) names.unshift(cur.s);
  const td = todayS(), y = new Date(Date.now() - 864e5); y.setMinutes(y.getMinutes() - y.getTimezoneOffset()); const yd = y.toISOString().slice(0, 10);
  $l('sl-body').innerHTML = `
    ${voiceOK() ? `<button type="button" class="btn sm blue sl-mic" data-slmic>🎤 말로 기록하기</button><div class="sl-heard" id="sl-heard">예) "오늘 낙산에서 두 시간 탔고 파도 다섯 개, 최고였어"</div>` : ''}
    <div class="sl-lb">언제</div>${chips('d', ['오늘', '어제', cur.d !== td && cur.d !== yd ? `🗓️ ${+cur.d.slice(5, 7)}.${+cur.d.slice(8)}` : '🗓️ 다른 날'], cur.d === td ? 0 : cur.d === yd ? 1 : 2)}
    <input type="date" class="sl-date" data-sldate value="${esc(cur.d)}" max="${td}" min="${(()=>{ const x = new Date(Date.now() - 60 * 864e5); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); })()}" ${cur.d !== td && cur.d !== yd ? '' : 'hidden'} aria-label="날짜">
    ${chips('tm', ['오전', '오후'], cur.tm)}
    <div class="sl-lb">어디서</div><div class="food-chips sl-chips" role="group">${names.slice(0, 10).map(n=>`<button type="button" data-slspot="${esc(n)}" aria-pressed="${cur.s === n}">${esc(n)}</button>`).join('')}</div>
    <input data-slin="s" maxlength="20" placeholder="다른 곳이면 적어요" value="${cur.sOther ? esc(cur.s) : ''}" style="margin-top:6px">
    <div class="sl-wx" id="sl-wx">${cur.wx ? '🌊 그날 파도 · ' + wxLine(cur.wx, cur.tm) : '🌊 그날 파도를 불러오는 중…'}</div>
    <div class="sl-lb">얼마나</div>${chips('m', MIN.map(m=>m >= 60 ? (m / 60) + '시간' : m + '분'), MIN.indexOf(cur.m))}
    <div class="sl-lb">탄 파도 <small>정확히 몇 개</small></div>
    <div class="sl-step"><button type="button" data-slwn="-1" aria-label="하나 빼기">−</button><b id="sl-wn" aria-live="polite">${cur.wn != null ? cur.wn : '–'}</b><span>개</span><button type="button" data-slwn="1" aria-label="하나 더하기">+</button></div>
    <div class="food-chips sl-chips" role="group">${QWN.map(n=>`<button type="button" data-slwq="${n}" aria-pressed="${cur.wn === n}">${n === 10 ? '10+' : n}</button>`).join('')}</div>
    ${cur.wn == null ? `<small class="sl-old" id="sl-old">예전 기록: ${WAVES[cur.w]} — 숫자를 고르면 정확히 바뀌어요</small>` : ''}
    <div class="sl-lb">기분</div>${chips('f', FEEL, cur.f)}
    <div class="sl-lb">한줄 <small>(선택)</small></div><input data-slin="t" maxlength="60" placeholder="예) 첫 그린 웨이브! · 패들 힘들었다" value="${esc(cur.t)}">
    <details class="sl-more2"${NOTE.some(([k])=>cur[k]) ? ' open' : ''}><summary>✍️ 자세히 쓰기 <small>잘한 것 · 아쉬운 것 · 받은 피드백</small></summary>
      ${NOTE.map(([k, lb, ph])=>`<div class="sl-lb">${lb}</div><textarea data-slin="${k}" rows="2" maxlength="120" placeholder="${ph}">${esc(cur[k] || '')}</textarea>`).join('')}</details>
    <div class="food-btns" style="margin-top:12px"><button type="button" class="btn blue" data-slsave>${edit ? '고치기' : '기록하기'}</button>${edit ? '<button type="button" class="btn sm mint" data-slcard>📸 카드로 공유</button><button type="button" class="btn sm ghost" data-sldel>지우기</button>' : ''}</div>`;
}
/* 날짜·스팟·오전/오후가 바뀌면 그날 파도를 다시 */
let wxSeq = 0;
async function loadWx(){
  if(!cur) return; const my = ++wxSeq, d = cur.d, s0 = cur.s, tm = cur.tm;
  const j = await fetchWx(d, s0); if(my !== wxSeq || !cur) return;
  const el = $l('sl-wx'); const w = j ? cleanWx(tm === 0 ? (j.am || j.pm) : (j.pm || j.am)) : null;
  cur.wx = w; if(w) cur.h = w.h;
  if(el) el.innerHTML = w ? `🌊 그날 파도 · ${esc(wxLine(w, tm))}${j.rn ? ` <small>(${esc(j.rn)})</small>` : ''}` : '🌊 그날 파도를 못 불러왔어요 — 기록은 그대로 돼요';
}
function onClick(e){
  const sh = $l('sl-sheet');
  if(e.target.closest('[data-slclose]')){ if(cur && !cur.id) slDraft = { ...cur };   // 저장 안 하고 닫으면 임시 저장(끌어 닫기·뒤로가기 실수)
    sh.hidden = true; return; }
  const k = e.target.closest('[data-slk]');
  if(k){ const i = +k.dataset.slv, key = k.dataset.slk;
    if(key === 'd' && i === 2){ const dt = $l('sl-body').querySelector('[data-sldate]'); if(dt){ dt.hidden = false; try{ dt.showPicker?.(); }catch(_){ dt.focus(); } } k.parentNode.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed', b === k)); return; }
    if(key === 'd'){ const x = new Date(Date.now() - i * 864e5); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); cur.d = x.toISOString().slice(0, 10); const dt = $l('sl-body').querySelector('[data-sldate]'); if(dt) dt.hidden = true; }
    else if(key === 'm') cur.m = MIN[i]; else cur[key] = i;
    k.parentNode.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed', b === k));
    if(key === 'd' || key === 'tm'){ cur.wx = null; cur.h = null; loadWx(); } return; }
  /* 탄 파도 — − / + 는 하나씩, 빠른 칩은 그 숫자로. 큰 숫자 칸만 다시 그린다 */
  const st = e.target.closest('[data-slwn],[data-slwq]');
  if(st){ const base = cur.wn != null ? cur.wn : [0, 1, 3, 6, 10][cur.w] ?? 3;
    cur.wn = num(st.dataset.slwq != null ? +st.dataset.slwq : base + +st.dataset.slwn, 0, 99); cur.w = wB(cur.wn);
    $l('sl-wn').textContent = cur.wn; $l('sl-old')?.remove();
    sh.querySelectorAll('[data-slwq]').forEach(b=>b.setAttribute('aria-pressed', +b.dataset.slwq === cur.wn)); navigator.vibrate?.(8); return; }
  const sp = e.target.closest('[data-slspot]');
  if(sp){ cur.s = sp.dataset.slspot; cur.sOther = 0; sp.parentNode.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed', b === sp)); const inp = sh.querySelector('[data-slin="s"]'); if(inp) inp.value = ''; cur.wx = null; loadWx(); return; }
  if(e.target.closest('[data-slmic]')) return listen();
  if(e.target.closest('[data-slcard]')){ const en = logs().find(x=>x.id === cur.id) || clean(cur); if(typeof window.charCardShare === 'function') window.charCardShare(en); return; }
  if(e.target.closest('[data-slsave]')) return save();
  if(e.target.closest('[data-sldel]')){ const p = P(); if(!p) return; const gone = (p.log || []).find(x=>x && x.id === cur.id), id = cur.id;
    p.log = (p.log || []).filter(x=>x && x.id !== id); (p.logdel ||= {})[id] = 1; sh.hidden = true; push(); render();
    /* 확인창 대신 바로 지우고 5초 동안 되돌릴 수 있게 */
    if(gone && window.undoToast) undoToast('📒 기록을 지웠어요', ()=>{ const q = P(); if(!q) return; delete (q.logdel || {})[id]; q.log = (q.log || []).filter(x=>x && x.id !== id).concat([gone]); push(); render(); }); }
}
function save(){
  const p = P(); if(!p || !cur) return;
  if(!String(cur.s || '').trim()) return toast('어디서 탔는지 골라 주세요');
  const e = clean({ ...cur, id:cur.id || `${Date.now().toString(36)}`, h:cur.wx?.h ?? cur.h ?? waveOf(cur.d) }); if(!e) return;
  p.log = (p.log || []).filter(x=>x && x.id !== e.id); p.log.push(e); p.log = p.log.map(clean).filter(Boolean).sort((a, b)=>a.d < b.d ? 1 : -1).slice(0, 120);
  let msg = '📒 기록했어요 · 기록을 누르면 📸 카드로 공유';
  const lx = (p.logx ||= {});
  if(!lx[e.d]){ lx[e.d] = 1; p.bonus = (p.bonus || 0) + 15; msg = '📒 기록했어요 · +15 XP · 기록을 누르면 📸 카드 공유'; Object.keys(lx).sort().slice(0, -60).forEach(k=>delete lx[k]); }
  slDraft = null; $l('sl-sheet').hidden = true; push(); render(); window.waveHome?.(); toast(msg); navigator.vibrate?.(15);
  if(typeof playTick === 'function') playTick();
}
function push(){ if(typeof playPush === 'function') playPush(); }
function all(){
  const sh = sheet(); $l('sl-t').textContent = '📒 내 서핑 기록';
  const L = logs(), by = {}; L.forEach(e=>{ (by[e.d.slice(0, 7)] ||= []).push(e); });
  /* 나만의 통계 — 기분이 좋았던 날의 예보 파고, 스팟별 횟수, 월별 막대 */
  const good = L.filter(e=>e.f >= 2 && e.h != null), avgH = good.length ? Math.round(good.reduce((t, e)=>t + e.h, 0) / good.length * 10) / 10 : null;
  const hs = good.map(e=>e.h).sort((a, b)=>a - b), rng = hs.length >= 3 ? `${hs[Math.floor(hs.length * .2)]}~${hs[Math.ceil(hs.length * .8) - 1]}m` : null;
  const sc = {}; L.forEach(e=>{ sc[e.s] = (sc[e.s] || 0) + 1; }); const spots = Object.entries(sc).sort((a, b)=>b[1] - a[1]).slice(0, 5);
  const ex = L.filter(e=>e.wn != null), avgW = ex.length ? Math.round(ex.reduce((t, e)=>t + e.wn, 0) / ex.length * 10) / 10 : null, maxW = ex.length ? Math.max(...ex.map(e=>e.wn)) : null;
  const months = Object.keys(by).sort().slice(-6), mx = Math.max(1, ...months.map(m=>by[m].length));
  const stat = L.length >= 2 ? `<div class="sl-stat">
      ${avgH != null ? `<div class="sl-ins">🌊 기분 좋았던 날 예보 평균 <b>${avgH}m</b>${rng ? ` · 보통 <b>${rng}</b>` : ''}<small>이 높이 예보가 뜨면 나가 볼 만해요</small></div>` : ''}
      ${avgW != null ? `<div class="sl-ins">🏄 한 번에 평균 <b>${avgW}개</b> · 최고 <b>${maxW}개</b><small>개수를 정확히 적은 ${ex.length}번 기준</small></div>` : ''}
      <div class="sl-bars">${months.map(m=>`<div><i style="height:${Math.round(by[m].length / mx * 100)}%"></i><b>${by[m].length}</b><small>${+m.slice(5)}월</small></div>`).join('')}</div>
      <div class="sl-frs">${spots.map(([n, c])=>`<span><b>${esc(n)}</b> ${c}번</span>`).join('')}</div></div>` : '';
  $l('sl-body').innerHTML = stat + Object.keys(by).map(m=>{ const a = by[m], h = Math.round(a.reduce((s, e)=>s + e.m, 0) / 6) / 10;
    return `<div class="sl-lb">${+m.slice(5)}월 · ${a.length}번 · ${h}시간</div><div class="sl-list">${a.map(e=>row(e, 1)).join('')}</div>`; }).join('') || '<div class="note">아직 기록이 없어요.</div>';
  sh.hidden = false;
  $l('sl-body').onclick = e=>{ const r = e.target.closest('[data-slid]'); if(r){ $l('sl-body').onclick = null; form(r.dataset.slid); } };
}
/* ── 🎤 말로 기록 ── 브라우저 음성 인식(크롬·사파리). 받아 적은 문장에서 날짜·스팟·시간·파도 수·기분을 골라 칸을 채운다 */
const voiceOK = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);
const KN = { 한:1, 하나:1, 두:2, 둘:2, 세:3, 셋:3, 네:4, 넷:4, 다섯:5, 여섯:6, 일곱:7, 여덟:8, 아홉:9, 열:10, 스무:20, 스물:20 };
function knum(t){ t = String(t); if(/^\d+$/.test(t)) return +t; let v = 0; const m = t.match(/^(열|스무|스물)?(한|하나|두|둘|세|셋|네|넷|다섯|여섯|일곱|여덟|아홉)?$/); if(!m) return null; if(m[1]) v += KN[m[1]]; if(m[2]) v += KN[m[2]]; return v || null; }
const NUMW = '(\\d+|열|스무|스물|한|하나|두|둘|세|셋|네|넷|다섯|여섯|일곱|여덟|아홉|열한|열두|열세|열네|열다섯)';
function parseSpeech(t){
  const o = {}, s = String(t).replace(/\s+/g, ' ');
  if(/어제/.test(s)) o.d = 1; else if(/오늘/.test(s)) o.d = 0;
  if(/오전|아침|새벽/.test(s)) o.tm = 0; else if(/오후|저녁|낮/.test(s)) o.tm = 1;
  const names = spotNames().concat((typeof window.foodItems === 'function' ? window.foodItems('spot') : []).map(i=>String(i.n || '').replace(/해수욕장|해변/g, '').trim()), ['죽도','인구','기사문','하조대','서피비치','남애','동호','중광정','갯마을','설악','물치','낙산','정암','후진','오산','송전','지경','주문진','사천','경포','금진','고성','삼포','송지호','공현진','아야진','봉수대','천진','교암']);
  const hit = names.filter(Boolean).sort((a, b)=>b.length - a.length).find(n=>s.includes(n)); if(hit) o.s = hit;
  let m = s.match(new RegExp(NUMW + '\\s*시간\\s*(반)?')); if(m){ const h = knum(m[1]); if(h) o.m = h * 60 + (m[2] ? 30 : 0); }
  m = s.match(/(\d+)\s*분/); if(m && !o.m) o.m = +m[1];
  m = s.match(new RegExp('파도\\s*' + NUMW + '\\s*개|' + NUMW + '\\s*개')); if(m){ const n = knum(m[1] || m[2]); if(n != null){ o.wn = Math.min(99, n); o.w = wB(o.wn); } }
  if(/못\s*탔|하나도|0\s*개|빵\s*개/.test(s)){ o.w = 0; o.wn = 0; }
  if(/최고|대박|짱|완전 좋|너무 좋|미쳤/.test(s)) o.f = 3; else if(/힘들|별로|최악|어려웠|지쳤/.test(s)) o.f = 0; else if(/그럭저럭|보통|그냥|무난/.test(s)) o.f = 1; else if(/좋았|좋아|재밌|재미있/.test(s)) o.f = 2;
  o.t = s.slice(0, 60);
  return o;
}
let rec = null;
function listen(){
  const R = window.SpeechRecognition || window.webkitSpeechRecognition; if(!R) return toast('이 브라우저는 음성 인식을 못 해요 — 키보드의 🎤 를 써 주세요');
  if(rec){ try{ rec.stop(); }catch(e){} rec = null; return; }
  rec = new R(); rec.lang = 'ko-KR'; rec.interimResults = true; rec.maxAlternatives = 1;
  const btn = document.querySelector('[data-slmic]'), heard = $l('sl-heard'); let last = '';
  if(btn) btn.textContent = '🔴 듣는 중… (다시 누르면 멈춤)';
  rec.onresult = ev=>{ last = [...ev.results].map(r=>r[0].transcript).join(' '); if(heard) heard.textContent = '🗣️ ' + last; };
  rec.onerror = ev=>{ toast(ev.error === 'not-allowed' ? '마이크 권한을 허용해 주세요' : '잘 못 들었어요 — 다시 한 번'); };
  rec.onend = ()=>{ rec = null; if(btn) btn.textContent = '🎤 말로 기록하기'; if(!last || !cur) return;
    const o = parseSpeech(last);
    if(o.d != null){ const x = new Date(Date.now() - o.d * 864e5); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); cur.d = x.toISOString().slice(0, 10); }
    if(o.tm != null) cur.tm = o.tm; if(o.s){ cur.s = o.s; cur.sOther = 0; }
    if(o.m) cur.m = MIN.reduce((b, x)=>Math.abs(x - o.m) < Math.abs(b - o.m) ? x : b, 60);
    if(o.wn != null){ cur.wn = o.wn; cur.w = wB(o.wn); } else if(o.w != null) cur.w = o.w; if(o.f != null) cur.f = o.f; if(!cur.t) cur.t = o.t;
    cur.wx = null; paintForm(!!cur.id); const h2 = $l('sl-heard'); if(h2) h2.textContent = '🗣️ ' + last + ' — 칸을 채웠어요. 확인하고 기록하기!'; loadWx(); };
  try{ rec.start(); }catch(e){ rec = null; toast('음성 인식을 시작하지 못했어요'); }
}
window._slogParse = parseSpeech;
window.surfLogRender = render; window.surfLogOpen = pre=>form(null, pre && typeof pre === 'object' ? pre : null);
window._slog = { logs, clean, waveOf };
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(render, 300)); else setTimeout(render, 300);
})();
