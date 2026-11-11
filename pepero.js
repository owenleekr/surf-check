/* ── 🎁 11.11 낙산 해변 빼빼로 선물 — SurfShare 홈 띠 ─────────────────────────────
   이벤트 화면은 따로 있다: /pepero(pepero.html + pepero-app.js) — 로그인 없이 양양서핑학교 6기·코치 명단에서 이름을 찾고 캐릭터를 골라 탐험한다.
   여기서는 기간 동안 홈 맨 위 띠와 놀이 카드(play.js 가 peperoLive 로 확인)만 보여 주고, 누르면 그 페이지로 간다.
   ?go=pepero 도 peperoOpen 으로 넘어온다. 같은 기기에서 이미 뽑았으면 띠에 내 선물을 보여 준다(페이지와 같은 localStorage). */
(function(){
/* 이벤트 기간(한국 시간) — 바꾸려면 여기와 pepero-app.js 둘 다 */
const START = Date.parse('2026-11-11T00:00:00+09:00'), END = Date.parse('2026-11-13T00:00:00+09:00');
const live = () => { const n = Date.now(); return n >= START && n < END; };
const url = () => /\.html$/.test(location.pathname) ? 'pepero.html' : '/pepero';   // 로컬 정적 서버엔 cleanUrls 가 없다
function open(){ window.track?.('action', 'pepero_open'); location.href = url(); }
function mine(){
  try{ const me = JSON.parse(localStorage.getItem('lineup.pepero.me') || 'null'), r = me && JSON.parse(localStorage.getItem('lineup.pepero2026:' + me.name) || 'null');
    return r && r.text ? String(r.text).split('|').slice(1).join('|') : ''; }catch(e){ return ''; }
}
function bar(){
  const home = document.getElementById('pane-home'); if(!home) return;
  let el = document.getElementById('pepero-bar');
  if(!live()){ if(el) el.hidden = true; return; }
  if(!el){ el = document.createElement('button'); el.type = 'button'; el.id = 'pepero-bar'; el.className = 'bday-bar pep-bar'; el.onclick = open;
    const ref = document.getElementById('bday-bar') || document.getElementById('adv-bar'); home.insertBefore(el, ref && ref.parentNode === home ? ref.nextSibling : home.firstChild); }
  const p = mine();
  el.innerHTML = `<i aria-hidden="true"><img src="img/pepero/gift-s.webp" alt="" width="36" height="40"></i><span><b>11.11 양양서핑학교 서프 버디 · 낙산 해변 빼빼로 선물</b><small>${p ? `내 선물 ${esc(p)} · 스토리로 자랑해요` : '양양서핑학교 서프 버디 · 이름 찾고 탐험하면 선물상자가 걸려요'}</small></span><em>${p ? '보기 ›' : '도전 ›'}</em>`;
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  el.hidden = false;
}
function boot(){ if(!document.body.classList.contains('has-nav')) return false; bar(); return true; }
if(!boot()){ const iv = setInterval(()=>{ if(boot()) clearInterval(iv); }, 500); }
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'visible') bar(); });
window.peperoOpen = open; window.peperoLive = live;
})();
