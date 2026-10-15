/* ── 안 써 본 기능 추천 ─────────────────────────────────────────────
   메뉴가 늘면서 "이런 게 있는 줄 몰랐다"가 생겼다. 홈에 한 장씩 권한다 — 오늘 할 일(테이크오프·챌린지)이 먼저,
   그다음 아직 안 해 본 것(라인업 서핑·서프스케이트·맛집·스팟·상점·꾸미기·마을·번개·홈 화면 추가).
   · '다른 추천 ›' 으로 넘겨 보고, ✕ 는 그 추천만 오늘 하루 숨긴다.
   · 써 봤는지는 프로필 기록(게임 판수·꾸미기·상점) + 이 기기에서 연 탭·화면(localStorage)으로 판단한다. */
(function(){
const USED = 'lineup.share.used', OFF = 'lineup.share.recoff';
const $r = id => document.getElementById(id);
const getJ = (k, d) => { try{ return JSON.parse(localStorage.getItem(k) || 'null') || d; }catch(e){ return d; } };
const setJ = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
const day = () => (typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10));
const used = k => !!getJ(USED, {})[k];
function markUsed(k){ const u = getJ(USED, {}); if(u[k]) return; u[k] = Date.now(); setJ(USED, u); }
const offToday = () => { const o = getJ(OFF, {}); return o.day === day() ? (o.ids || []) : []; };
let idx = 0;

/* 기존 함수를 감싸 '써 봤다'를 기록한다(원래 동작은 그대로) */
function wrap(name, key){
  const f = window[name]; if(typeof f !== 'function' || f._rec) return;
  const g = function(...a){ markUsed(typeof key === 'function' ? key(...a) : key); return f.apply(this, a); }; g._rec = true; window[name] = g;
}

function list(){
  if(typeof ME === 'undefined' || !ME) return [];
  const p = ME.profile?.play || {}, d = day(), h = new Date().getHours();
  const drillDone = ((typeof dSet !== 'undefined' && dSet[ME.id]) || new Set()).has(d);
  const scrollTo = id => ()=>{ setTab('home'); setTimeout(()=>{ const el = $r(id); if(el){ if(el.tagName === 'DETAILS') el.open = true; el.scrollIntoView({ block:'center', behavior:'smooth' }); } }, 120); };
  const bal = typeof shellBal === 'function' ? shellBal() : 0;
  return [
    { id:'drill', ok:!drillDone && h >= 6, ic:'🏄', t:'오늘 테이크오프 연습했어요?', d:'땅에서 10번 — 하고 나서 체크하면 연속일수가 쌓여요', btn:'체크하러 가기', go:scrollTo('drill') },
    { id:'daily', ok:!(p.dbest && p.dbest.day === d), ic:'📅', t:'오늘의 챌린지 아직이에요', d:'파도 점프 — 모두 같은 코스, 오늘 순위에 이름 올리기', btn:'도전', go:()=>window.gameOpen?.() },
    { id:'surf', ok:!(p.sn > 0) && !used('surf'), ic:'🌊', t:'라인업 서핑 해 봤어요?', d:'패들 → 팝업 → 튜브 · 진짜 서핑에 가까운 게임', btn:'해 보기', go:()=>window.surfOpen?.() },
    { id:'skate', ok:!(p.sk?.n > 0) && !used('skate'), ic:'🛹', t:'서프스케이트 훈련 3분', d:'펌핑 리듬을 익히면 바다에서 속도가 붙어요', btn:'해 보기', go:()=>window.skateOpen?.() },
    { id:'food', ok:!used('tab:food'), ic:'🍜', t:'양서학 찐맛집 봤어요?', d:'서퍼들이 가 본 곳 · 👍 추천 · 💬 댓글', btn:'보기', go:()=>window.foodOpen?.('food') },
    { id:'spot', ok:!used('spot'), ic:'🏄', t:'서핑 스팟 리스트', d:'고성·속초·양양 포인트 · 📹 캠 바로 보기', btn:'보기', go:()=>window.foodOpen?.('spot') },
    { id:'addfood', ok:used('tab:food') && !used('addfood'), ic:'➕', t:'가 본 맛집 하나 등록해요', d:'네이버지도 링크 + 한줄평이면 바로 올라가요', btn:'등록하기',
      go:()=>{ markUsed('addfood'); window.foodOpen?.('food'); setTimeout(()=>document.querySelector('[data-rqopen="food"]')?.click(), 450); } },
    { id:'quiz', ok:!p.vis?.[d]?.quiz, ic:'🧠', t:'코치님 퀴즈 한 판', d:'누가 한 말일까요? · 맞히면 XP', btn:'풀기', go:()=>window.quizOpen?.() },
    { id:'dress', ok:!ME.profile?.dressed, ic:'🙂', t:'내 캐릭터 꾸미기', d:'머리·표정·옷·보드 — 마을에서 이 모습으로 보여요', btn:'꾸미기', go:scrollTo('bld-fold') },
    { id:'shop', ok:bal >= 20 && !Object.keys(p.own || {}).length, ic:'🛍️', t:`조개 ${bal}개 — 옷 사러 가요`, d:'알로하 셔츠·밀짚모자·보드 무늬 · 입어 보고 사요', btn:'상점', go:()=>window.shopOpen?.() },
    { id:'bus', ok:!used('bus'), ic:'🚌', t:'서울 가는 버스, 몇 석 남았나', d:'양양↔동서울 시외버스 남은 좌석 · 매진 차는 자리 나면 알림', btn:'보기', go:()=>{ markUsed('bus'); window.busOpen?.(); } },
    { id:'town', ok:!used('tab:town'), ic:'🏘', t:'마을에 한마디 남겨요', d:'친 말이 내 캐릭터 머리 위 말풍선으로 떠요', btn:'마을로', go:()=>setTab('town') },
    { id:'bolt', ok:!used('tab:bolt'), ic:'⚡', t:'서핑번개 — 같이 들어갈 사람', d:'시간과 바다만 정해서 올리면 돼요', btn:'보기', go:()=>setTab('bolt') },
    { id:'cam', ok:!p.vis?.[d]?.cam && h >= 5 && h < 13, ic:'📹', t:'지금 파도 캠으로 볼까요?', d:'나가기 전에 해변을 눈으로 확인', btn:'캠 보기', go:()=>setTab('cam') },
    /* 홈 화면 추가는 홈 위 전용 카드가 따로 있어서 여기선 권하지 않는다 */
  ].filter(x=>x.ok && !offToday().includes(x.id));
}

function card(){
  const el = $r('home-rec'); if(!el) return;
  const L = list(); if(!L.length){ el.hidden = true; el.innerHTML = ''; return; }
  idx = idx % L.length; const r = L[idx];
  el.hidden = false;
  el.innerHTML = `<div class="rec"><span class="rec-ic">${r.ic}</span><span class="rec-m"><small>💡 추천${L.length > 1 ? ` ${idx + 1}/${L.length}` : ''}</small><b>${r.t}</b><span>${r.d}</span></span>
    <button type="button" class="rec-x" id="rec-x" aria-label="이 추천 오늘은 그만">✕</button></div>
    <div class="rec-btns"><button type="button" class="btn sm blue" id="rec-go">${r.btn}</button>${L.length > 1 ? '<button type="button" class="btn sm ghost" id="rec-next">다른 추천 ›</button>' : ''}</div>`;
  $r('rec-go').onclick = ()=>{ r.go(); setTimeout(card, 600); };
  $r('rec-x').onclick = ()=>{ const o = getJ(OFF, {}); const ids = o.day === day() ? (o.ids || []) : []; ids.push(r.id); setJ(OFF, { day:day(), ids }); card(); };
  if($r('rec-next')) $r('rec-next').onclick = ()=>{ idx++; card(); };
}

function init(){
  wrap('setTab', t=>'tab:' + t); wrap('surfOpen', 'surf'); wrap('skateOpen', 'skate'); wrap('gameOpen', 'game'); wrap('shopOpen', 'shop'); wrap('quizOpen', 'quiz');
  wrap('foodOpen', v=>v === 'spot' ? 'spot' : 'tab:food'); wrap('a2hsOpen', 'a2hs');
  document.addEventListener('click', e=>{ if(e.target.closest?.('#food-seg [data-view="spot"]')) markUsed('spot'); if(e.target.closest?.('[data-rqopen]')) markUsed('addfood'); }, true);
  card();
}
window.recCard = card; window.markUsed = markUsed;
window.recTop = () => { const L = list(); return L[0] ? { ic:'💡', who:'', text:`${L[0].t}`, go:'rec' } : null; };
window.recGo = () => { const L = list(); L[0]?.go(); };
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else setTimeout(init, 0);
})();
