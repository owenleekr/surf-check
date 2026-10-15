/* ── 📒 서핑 일지 ─────────────────────────────────────────────────
   "오늘 어디서 얼마나 탔지?"를 10초 만에 남긴다 — 스팟 · 시간 · 탄 파도 · 기분 · 한줄.
   그날 파도 예보(/api/forecast, waves.js)를 같이 적어 두면 나중에 "몇 m 에서 잘 탔나"가 보인다.
   저장은 내 프로필(play.log) — 다른 기기와는 id 로 합친다(play.js playMerge). 날짜마다 처음 남길 때 +15 XP.
   값은 내 프로필에서 오지만 화면에 찍기 전에 전부 걸러 낸다(숫자는 범위, 글자는 esc). */
(function(){
const $l = id => document.getElementById(id);
const MIN = [30, 60, 90, 120, 180], WAVES = ['0개', '1~2개', '3~5개', '6~10개', '10개+'], FEEL = ['😵 힘듦', '😐 그럭저럭', '🙂 좋음', '😆 최고'];
const todayS = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const num = (v, lo, hi) => { v = Math.round(+v); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo; };
const clean = e => e && typeof e === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(String(e.d)) ? {
  id:String(e.id || '').slice(0, 40), d:e.d, s:String(e.s || '').slice(0, 20), m:num(e.m, 10, 600), w:num(e.w, 0, 4), f:num(e.f, 0, 3),
  t:String(e.t || '').slice(0, 60), h:e.h == null || !isFinite(+e.h) ? null : Math.max(0, Math.min(9, Math.round(+e.h * 10) / 10)) } : null;
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
  el.hidden = false;
  el.innerHTML = `<div class="hsec">📒 서핑 일지 <small>바다에 다녀오면 10초 기록</small></div>
    <div class="sl-card">
      <div class="sl-sum"><div><b>${M.length}</b><small>이번 달</small></div><div><b>${hrs}</b><small>시간</small></div><div><b>${L.length}</b><small>전체</small></div><div class="sl-fav"><b>${fav ? esc(fav) : '-'}</b><small>자주 간 곳</small></div></div>
      <button type="button" class="btn ${done ? 'ghost' : 'blue'} sl-go" data-slnew>${done ? '✓ 오늘 기록했어요 · 하나 더' : '🏄 오늘 서핑 기록하기 <small>+15 XP</small>'}</button>
      ${L.length ? `<div class="sl-list">${L.slice(0, 3).map(row).join('')}</div>${L.length > 3 ? `<button type="button" class="sl-more" data-slall>기록 ${L.length}개 모두 보기 ›</button>` : ''}` : '<div class="note" style="margin:8px 0 0">첫 기록을 남기면 이번 달 몇 번·몇 시간 탔는지 쌓여요.</div>'}
    </div>`;
  el.onclick = e=>{ if(e.target.closest('[data-slnew]')) form(); else if(e.target.closest('[data-slall]')) all(); else { const r = e.target.closest('[data-slid]'); if(r) form(r.dataset.slid); } };
}
function row(e){
  const [y, m, d] = e.d.split('-'), dow = '일월화수목금토'[new Date(e.d + 'T00:00').getDay()];
  return `<button type="button" class="sl-row" data-slid="${esc(e.id)}"><span class="sl-d"><b>${+m}.${+d}</b><small>${dow}</small></span>
    <span class="sl-m"><b>${esc(e.s || '어딘가')}</b><small>${e.m >= 60 ? (e.m / 60).toString().replace(/\.0$/, '') + '시간' : e.m + '분'} · 파도 ${WAVES[e.w]}${e.h != null ? ` · 예보 ${e.h}m` : ''}${e.t ? ' · ' + esc(e.t) : ''}</small></span><span class="sl-f">${FEEL[e.f].split(' ')[0]}</span></button>`;
}

let cur = null;
function sheet(){
  let sh = $l('sl-sheet');
  if(!sh){ sh = document.createElement('div'); sh.className = 'sheet'; sh.id = 'sl-sheet'; sh.hidden = true;
    sh.innerHTML = '<div class="sheet-dim" data-slclose></div><div class="sheet-in"><div class="sheet-hd"><span class="t" id="sl-t">📒 서핑 기록</span><button class="btn sm ghost" data-slclose>닫기</button></div><div id="sl-body"></div></div>';
    document.body.appendChild(sh);
    sh.addEventListener('click', onClick); sh.addEventListener('input', e=>{ if(!cur) return; const k = e.target.dataset.slin; if(k === 't') cur.t = e.target.value.slice(0, 60); if(k === 's'){ cur.s = e.target.value.slice(0, 20); cur.sOther = 1; } }); }
  return sh;
}
function chips(key, items, val){ return `<div class="food-chips sl-chips" role="group">${items.map((t, i)=>`<button type="button" data-slk="${key}" data-slv="${i}" aria-pressed="${val === i}">${t}</button>`).join('')}</div>`; }
function form(id){
  const old = id ? logs().find(e=>e.id === id) : null;
  cur = old ? { ...old } : { id:'', d:todayS(), s:spotNames()[0] || '낙산', m:60, w:2, f:2, t:'' };
  const sh = sheet(); $l('sl-t').textContent = old ? '📒 기록 고치기' : '📒 오늘 서핑 기록'; paintForm(!!old); sh.hidden = false;
}
function paintForm(edit){
  const names = spotNames(); if(cur.s && !names.includes(cur.s)) names.unshift(cur.s);
  const td = todayS(), y = new Date(Date.now() - 864e5); y.setMinutes(y.getMinutes() - y.getTimezoneOffset()); const yd = y.toISOString().slice(0, 10);
  $l('sl-body').innerHTML = `
    <div class="sl-lb">언제</div>${chips('d', ['오늘', '어제'], cur.d === td ? 0 : cur.d === yd ? 1 : -1)}
    <div class="sl-lb">어디서</div><div class="food-chips sl-chips" role="group">${names.slice(0, 10).map(n=>`<button type="button" data-slspot="${esc(n)}" aria-pressed="${cur.s === n}">${esc(n)}</button>`).join('')}</div>
    <input data-slin="s" maxlength="20" placeholder="다른 곳이면 적어요" value="${cur.sOther ? esc(cur.s) : ''}" style="margin-top:6px">
    <div class="sl-lb">얼마나</div>${chips('m', MIN.map(m=>m >= 60 ? (m / 60) + '시간' : m + '분'), MIN.indexOf(cur.m))}
    <div class="sl-lb">탄 파도</div>${chips('w', WAVES, cur.w)}
    <div class="sl-lb">기분</div>${chips('f', FEEL, cur.f)}
    <div class="sl-lb">한줄 <small>(선택)</small></div><input data-slin="t" maxlength="60" placeholder="예) 첫 그린 웨이브! · 패들 힘들었다" value="${esc(cur.t)}">
    <div class="food-btns" style="margin-top:12px"><button type="button" class="btn blue" data-slsave>${edit ? '고치기' : '기록하기'}</button>${edit ? '<button type="button" class="btn sm ghost" data-sldel>지우기</button>' : ''}</div>`;
}
function onClick(e){
  const sh = $l('sl-sheet');
  if(e.target.closest('[data-slclose]')){ sh.hidden = true; return; }
  const k = e.target.closest('[data-slk]');
  if(k){ const i = +k.dataset.slv, key = k.dataset.slk;
    if(key === 'd'){ const x = new Date(Date.now() - i * 864e5); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); cur.d = x.toISOString().slice(0, 10); }
    else if(key === 'm') cur.m = MIN[i]; else cur[key] = i;
    k.parentNode.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed', b === k)); return; }
  const sp = e.target.closest('[data-slspot]');
  if(sp){ cur.s = sp.dataset.slspot; cur.sOther = 0; sp.parentNode.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed', b === sp)); const inp = sh.querySelector('[data-slin="s"]'); if(inp) inp.value = ''; return; }
  if(e.target.closest('[data-slsave]')) return save();
  if(e.target.closest('[data-sldel]')){ if(!confirm('이 기록을 지울까요?')) return; const p = P(); if(p){ p.log = (p.log || []).filter(x=>x && x.id !== cur.id); (p.logdel ||= {})[cur.id] = 1; } sh.hidden = true; push(); render(); }
}
function save(){
  const p = P(); if(!p || !cur) return;
  if(!String(cur.s || '').trim()) return toast('어디서 탔는지 골라 주세요');
  const e = clean({ ...cur, id:cur.id || `${Date.now().toString(36)}`, h:cur.h ?? waveOf(cur.d) }); if(!e) return;
  p.log = (p.log || []).filter(x=>x && x.id !== e.id); p.log.push(e); p.log = p.log.map(clean).filter(Boolean).sort((a, b)=>a.d < b.d ? 1 : -1).slice(0, 120);
  let msg = '📒 기록했어요';
  const lx = (p.logx ||= {});
  if(!lx[e.d]){ lx[e.d] = 1; p.bonus = (p.bonus || 0) + 15; msg = '📒 기록했어요 · +15 XP'; Object.keys(lx).sort().slice(0, -60).forEach(k=>delete lx[k]); }
  $l('sl-sheet').hidden = true; push(); render(); toast(msg); navigator.vibrate?.(15);
  if(typeof playTick === 'function') playTick();
}
function push(){ if(typeof playPush === 'function') playPush(); }
function all(){
  const sh = sheet(); $l('sl-t').textContent = '📒 내 서핑 기록';
  const L = logs(), by = {}; L.forEach(e=>{ (by[e.d.slice(0, 7)] ||= []).push(e); });
  $l('sl-body').innerHTML = Object.keys(by).map(m=>{ const a = by[m], h = Math.round(a.reduce((s, e)=>s + e.m, 0) / 6) / 10;
    return `<div class="sl-lb">${+m.slice(5)}월 · ${a.length}번 · ${h}시간</div><div class="sl-list">${a.map(row).join('')}</div>`; }).join('') || '<div class="note">아직 기록이 없어요.</div>';
  sh.hidden = false;
  $l('sl-body').onclick = e=>{ const r = e.target.closest('[data-slid]'); if(r){ $l('sl-body').onclick = null; form(r.dataset.slid); } };
}
window.surfLogRender = render; window.surfLogOpen = ()=>form();
window._slog = { logs, clean, waveOf };
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(render, 300)); else setTimeout(render, 300);
})();
