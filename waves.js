/* ── 🌊 이번주의 파도 ────────────────────────────────────────────────
   /api/forecast(Open-Meteo 7일 예보, 세 구역)를 받아 홈에 '이번주의 파도' 한 줄(7일 · 주말 강조),
   서핑 스팟 화면 위에 '요일별 추천 스팟'을 띄운다. 날짜를 누르면 오전·오후 파고·주기·바람과 추천 스팟.
   추천은 구역 점수 + 스팟 메모(네이버 스팟 리스트의 한줄 — '북쪽 막혀서 큰 파도 좋음' 같은 것)로 매긴다.
   예보는 모델 값이라 실제와 다를 수 있다 — 상세에 '나가기 전 캠 확인'을 함께 둔다. */
(function(){
const K = 'lineup.share.fc', FRESH = 30 * 60e3;
const $w = id => document.getElementById(id);
const DOW = ['일','월','화','수','목','금','토'];
let fc = null, busy = false, failAt = 0;
try{ const c = JSON.parse(localStorage.getItem(K) || 'null'); if(c && Date.now() - c.at < 6 * 3600e3) fc = c.data; }catch(e){}
const fresh = () => { try{ const c = JSON.parse(localStorage.getItem(K) || 'null'); return c && Date.now() - c.at < FRESH; }catch(e){ return false; } };

async function load(){
  if(busy || (fc && fresh()) || Date.now() - failAt < 5 * 60e3) return fc;      // 실패하면 5분은 다시 안 부른다(그리기→불러오기가 돌고 돌지 않게)
  busy = true; let ok = false;
  try{ const r = await fetch('/api/forecast'); if(r.ok){ fc = await r.json(); ok = true; try{ localStorage.setItem(K, JSON.stringify({ at:Date.now(), data:fc })); }catch(e){} } }catch(e){}
  if(!ok) failAt = Date.now();
  busy = false; if(ok) paintAll(); return fc;
}

const comp = d => d == null || d < 0 ? '' : ['북','북동','동','남동','남','남서','서','북서'][Math.round(d / 45) % 8];
const sky = c => c == null ? '' : c === 0 ? '☀️' : c <= 3 ? '⛅' : c <= 48 ? '🌫️' : c <= 67 ? '🌧️' : c <= 77 ? '❄️' : c <= 82 ? '🌦️' : '⛈️';
const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
const dayLbl = (day, i) => { const d = new Date(day + 'T00:00'); return { dow:i === 0 ? '오늘' : i === 1 ? '내일' : DOW[d.getDay()], date:d.getDate(), wk:d.getDay() === 0 || d.getDay() === 6, full:`${d.getMonth() + 1}.${d.getDate()} (${DOW[d.getDay()]})` }; };
const best = d => { let b = null; d.regions.forEach(r=>['am', 'pm'].forEach(p=>{ const x = r[p]; if(x && (!b || x.s > b.x.s)) b = { r, p, x }; })); return b; };

/* 스팟 후보 — 네이버 스팟 리스트(위도·메모) + 앱의 캠 해변. 구역은 위도로 가른다 */
const regionOf = lat => lat >= 38.25 ? 'goseong' : lat >= 38.09 ? 'north' : 'south';
function spots(){
  const L = (typeof window.foodItems === 'function' ? window.foodItems('spot') : []).map(i=>({ n:i.n, lat:i.lat, m:i.m || '', u:i.u, cam:null }));
  const key = n => String(n).replace(/해수욕장|해변|[\s·]/g, '');
  (typeof SEAS !== 'undefined' ? SEAS : []).forEach(x=>{ const hit = L.find(s=>key(s.n) === key(x[0])); if(hit){ if(x[2]) hit.cam = x[0]; } else if(x[2]) L.push({ n:x[0], lat:x[3], m:'', cam:x[0] }); });
  return L.filter(s=>s.lat != null);
}
function recommend(d, n){
  const reg = Object.fromEntries(d.regions.map(r=>[r.k, r]));
  return spots().map(s=>{
    const r = reg[regionOf(s.lat)]; const x = r && [r.am, r.pm].filter(Boolean).sort((a,b)=>b.s - a.s)[0]; if(!x) return null;
    let sc = x.s, why = [];
    const fromN = x.dir >= 300 || (x.dir >= 0 && x.dir <= 45), fromS = x.dir >= 135 && x.dir <= 225;
    if(/북쪽[^.,]{0,6}막/.test(s.m) && fromN && x.h >= 0.8){ sc += 1; why.push('북쪽이 막혀 큰 북동 파도에 좋음'); }
    if(/남쪽\s*스웰|남쪽/.test(s.m) && fromS){ sc += 0.8; why.push('남쪽 스웰이 들어옴'); }
    if(/작은 파도/.test(s.m) && x.h < 0.6){ sc += 0.5; why.push('작은 파도 잘 들어오는 곳'); }
    if(/(이안류|리프|조심)/.test(s.m) && x.h >= 1){ sc -= 0.6; why.push('큰 날엔 이안류·리프 조심'); }
    if(/허가/.test(s.m)){ sc -= 1; why.push('해경 허가 필요'); }
    if(s.cam){ sc += 0.3; why.push('📹 캠으로 미리 확인'); }
    return { ...s, sc, why, x, rn:r.n };
  }).filter(Boolean).sort((a,b)=>b.sc - a.sc).slice(0, n || 3);
}

/* 내 파도 — 서핑 일지에서 기분 좋았던 날(🙂·😆)의 예보 파고 범위. 3번 이상 쌓여야 쓴다 */
function myRange(){
  const L = window._slog?.logs?.() || [], hs = L.filter(e=>e.f >= 2 && e.h != null).map(e=>e.h).sort((a, b)=>a - b);
  if(hs.length < 3) return null;
  return [hs[Math.floor(hs.length * .2)] - .1, hs[Math.ceil(hs.length * .8) - 1] + .1];
}
/* 7일 띠 — 홈 카드와 스팟 화면이 같이 쓴다 */
function strip(){
  if(!fc?.days?.length) return '';
  const mr = myRange();
  return `<div class="wv-strip">${fc.days.map((d, i)=>{ const L = dayLbl(d.day, i), b = best(d), top = recommend(d, 1)[0];
    const mine = mr && b && b.x.h != null && b.x.h >= mr[0] && b.x.h <= mr[1] && b.x.s >= 3;
    return `<button type="button" class="wv-d${L.wk ? ' wk' : ''}${mine ? ' mine' : ''}" data-wvday="${i}"${mine ? ' title="내가 즐긴 파도 높이"' : ''}>${mine ? '<i class="wv-mine">💛</i>' : ''}<small>${L.dow}</small><b>${L.date}</b>
      <span class="wv-h">${b ? `${b.x.h ?? '-'}m` : '-'}</span><span class="wv-s s${b ? b.x.s : 0}">${b ? '★' + b.x.s : ''}</span>${top ? `<em>${esc(String(top.n).replace(/해수욕장|해변/, ''))}</em>` : ''}</button>`; }).join('')}</div>`;
}
function weekendLine(){
  if(!fc?.days?.length) return '';
  const wk = fc.days.map((d, i)=>({ d, i, L:dayLbl(d.day, i) })).filter(o=>o.L.wk).slice(0, 2);
  return wk.map(o=>{ const b = best(o.d), t = recommend(o.d, 2);
    const sr = o.d.sun && /^\d{2}:\d{2}$/.test(o.d.sun.rise || '') ? ` · 🌅 ${o.d.sun.rise}` : '';
    return `<button type="button" class="wv-wk" data-wvday="${o.i}"><b>${o.L.full}${sr}</b><span>${b ? `${stars(b.x.s)} ${b.x.h}m · ${b.x.p}초 — ${esc(b.x.why)}` : '예보 없음'}</span>${t.length ? `<small>추천: ${t.map(x=>esc(x.n)).join(' · ')}</small>` : ''}</button>`; }).join('');
}

function homeCard(){
  const el = $w('home-wave'); if(!el) return;
  if(!fc?.days?.length){ el.hidden = true; load(); return; }
  el.hidden = false;
  el.innerHTML = `<div class="hsec">🌊 이번주의 파도 <small>예보 · 누르면 자세히</small></div>
    <div class="wv-card">${strip()}${myRange() ? `<div class="wv-mynote">💛 = 내가 즐긴 파도 높이(${myRange().map(x=>Math.max(0, Math.round(x * 10) / 10)).join('~')}m)와 맞는 날 · 서핑 일지 기준</div>` : ''}<div class="wv-wks">${weekendLine()}</div></div>`;
  wire(el);
  if(!fresh()) load();
}
function spotSection(){
  if(!fc?.days?.length){ load(); return ''; }
  return `<div class="wv-spot"><div class="wv-spot-h"><b>📅 요일별 추천 스팟</b><small>이번주 파도 예보로 골랐어요 · 날짜를 누르면 자세히</small></div>${strip()}</div>`;
}

function detail(i){
  const d = fc?.days?.[i]; if(!d) return;
  const L = dayLbl(d.day, i), rec = recommend(d, 4);
  let sh = $w('wv-sheet');
  if(!sh){ sh = document.createElement('div'); sh.className = 'sheet'; sh.id = 'wv-sheet';
    sh.innerHTML = '<div class="sheet-dim" data-wvclose></div><div class="sheet-in"><div class="sheet-hd"><span class="t" id="wv-t"></span><button class="btn sm ghost" data-wvclose>닫기</button></div><div id="wv-body"></div></div>';
    document.body.appendChild(sh);
    sh.addEventListener('click', e=>{ if(e.target.closest('[data-wvclose]')){ sh.hidden = true; return; }
      const c = e.target.closest('[data-wvcam]'); if(c){ sh.hidden = true; if(typeof setSea === 'function') setSea(c.dataset.wvcam); setTab('cam'); }
      const n = e.target.closest('[data-wvday]'); if(n) detail(+n.dataset.wvday); }); }
  $w('wv-t').textContent = `🌊 ${L.full} 파도`;
  const sunOk = d.sun && /^\d{2}:\d{2}$/.test(d.sun.rise || '') && /^\d{2}:\d{2}$/.test(d.sun.set || '');
  const row = (lbl, x) => x ? `<div class="wv-r"><span class="wv-rl">${lbl}</span><span class="wv-rv"><b>${x.h}m</b> · ${x.p}초 · ${comp(x.dir)}쪽 파도<br><small>바람 ${comp(x.wd)}풍 ${x.w}m/s · ${sky(x.code)} ${x.tmp ?? ''}° · 비 ${x.rain}%</small></span><span class="wv-s s${x.s}">${stars(x.s)}</span></div><div class="wv-why">${esc(x.why)}</div>` : '';
  $w('wv-body').innerHTML = `
    ${sunOk ? `<div class="wv-sun">🌅 해 뜸 <b>${d.sun.rise}</b> · 🌇 해 짐 <b>${d.sun.set}</b><small>새벽 서핑은 해 뜨기 30분 전부터 물빛이 보여요</small></div>` : ''}
    ${rec.length ? `<div class="wv-rec"><b>🏄 추천 스팟</b>${rec.map((s, k)=>`<div class="wv-rs"><span class="wv-rk">${k + 1}</span><span class="wv-rm"><b>${esc(s.n)}</b><small>${esc(s.rn)} · ${stars(Math.max(0, Math.min(5, Math.round(s.sc))))}${s.why.length ? ' · ' + esc(s.why.join(' · ')) : ''}</small>${s.m ? `<small>💬 ${esc(s.m)}</small>` : ''}</span>
      ${s.cam ? `<button type="button" class="btn sm blue" data-wvcam="${esc(s.cam)}">📹 캠</button>` : ''}</div>`).join('')}</div>` : ''}
    ${d.regions.map(r=>`<div class="wv-reg"><h4>${esc(r.n)}</h4>${row('오전', r.am)}${row('오후', r.pm)}</div>`).join('')}
    <div class="wv-days">${fc.days.map((x, k)=>{ const l = dayLbl(x.day, k); return `<button type="button" data-wvday="${k}" aria-pressed="${k === i}"${l.wk ? ' class="wk"' : ''}>${l.dow} ${l.date}</button>`; }).join('')}</div>
    <div class="note" style="margin-top:10px">예보: ${esc(fc.src || 'Open-Meteo')} 모델 값이라 실제와 다를 수 있어요 — 나가기 전에 📹 캠으로 한 번 확인하세요. 별점은 입문~초중급 기준.</div>`;
  sh.hidden = false;
}
function wire(root){ root.querySelectorAll('[data-wvday]').forEach(b=>b.onclick = ()=>detail(+b.dataset.wvday)); }
function paintAll(){
  homeCard();
  const sp = document.querySelector('.wv-spot'); if(sp){ const html = spotSection(); if(html){ sp.outerHTML = html; wire(document.querySelector('.wv-spot')); } }
}
window.waveHome = homeCard; window.waveSpotHTML = spotSection; window.waveWire = wire; window.waveDetail = detail;
window._wave = { load, recommend, get fc(){ return fc; }, set fc(v){ fc = v; } };
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>load()); else load();
})();
