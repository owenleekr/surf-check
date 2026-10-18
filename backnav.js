/* ── 뒤로가기 ─────────────────────────────────────────────────────
   휴대폰 뒤로가기(안드로이드 버튼·아이폰 스와이프)를 누르면 열린 창이 아니라 앱이 통째로 닫혔다.
   창(시트·팝업·게임)이 열릴 때마다 기록을 한 칸 쌓고, 뒤로가기는 맨 위 창만 닫는다.
   창이 없고 다른 탭이면 홈으로, 홈이면 그때 앱을 나간다.
   창을 화면의 ✕ 로 닫으면 쌓아 둔 기록을 조용히 되돌린다(뒤로가기를 두 번 눌러야 하는 일이 없게). */
(function(){
if(!window.history || !history.pushState) return;
const SEL = '.sheet:not([hidden]), .pop:not([hidden]), .game:not([hidden])';
const GAMEX = { game:'g-x', surf:'s-x', skate:'k-x', quest:'q-x', defend:'d-x' };
let depth = 0, skip = 0, tabBase = false, busy = false;
const opened = () => [...document.querySelectorAll(SEL)].filter(el=>el.offsetParent !== null || getComputedStyle(el).position === 'fixed');
const zOf = el => +getComputedStyle(el).zIndex || 0;
function closeTop(){
  const L = opened(); if(!L.length) return false;
  const el = L.sort((a, b)=>zOf(a) - zOf(b) || (a.compareDocumentPosition(b) & 4 ? -1 : 1)).pop();
  if(el.classList.contains('game')){ const x = document.getElementById(GAMEX[el.id]); if(x){ x.click(); return true; } }
  if(el.id === 'pop' && typeof window.popClose === 'function'){ window.popClose(); return true; }
  const btn = el.querySelector('.sheet-hd button, [data-close], [data-shclose], [data-slclose], [data-wvclose], [data-moreclose], [data-mailclose], [data-uclose], .sheet-dim');
  if(btn){ btn.click(); if(!el.hidden && el.offsetParent !== null){ el.hidden = true; } return true; }
  el.hidden = true; return true;
}
function sync(){
  busy = false;
  const c = opened().length;
  while(c > depth){ history.pushState({ ov:depth + 1 }, ''); depth++; }
  if(c < depth){ const n = depth - c; depth = c; skip += n; history.go(-n); }
}
new MutationObserver(()=>{ if(!busy){ busy = true; queueMicrotask(sync); } })
  .observe(document.body, { subtree:true, childList:true, attributes:true, attributeFilter:['hidden'] });
/* 창을 닫으면서 다른 탭으로 간 경우(☰기타 › 마을·번개 등) — 창 기록을 되돌리는 동안엔 탭 칸을 못 쌓는다(되돌리기가 그 칸을 지운다).
   되돌리기가 끝난 뒤 홈이 아니면 그때 한 칸 쌓는다. 안 그러면 뒤로가기 한 번에 앱이 통째로 닫혔다 */
function reTab(){ if(depth === 0 && !tabBase && document.body.classList.contains('has-nav') && !document.body.classList.contains('on-home')){ history.pushState({ tab:1 }, ''); tabBase = true; } }
addEventListener('popstate', ()=>{
  if(skip){ skip--; if(!skip) reTab(); return; }
  if(depth > 0){ depth--; if(!closeTop()) depth++; return; }
  /* 마을 사람 카드(창이 아니라 그림 위 카드)도 뒤로가기로 닫는다 */
  const vc = document.querySelector('.vcard'); if(vc){ vc.remove(); if(tabBase) history.pushState({ tab:1 }, ''); return; }
  /* 창이 없으면 — 다른 탭이었다면 홈으로 */
  if(tabBase){ tabBase = false; if(!document.body.classList.contains('on-home')) toHome(); }
});
/* 탭 — setTab 은 const 라 감쌀 수 없다. 대신 홈일 때만 붙는 body.on-home 을 지켜본다.
   홈이 아닌 탭으로 가면 한 칸 쌓고(뒤로가기 = 홈), 손으로 홈 탭을 누르면 그 칸을 조용히 되돌린다 */
let wasHome = document.body.classList.contains('on-home');
new MutationObserver(()=>{
  const home = document.body.classList.contains('on-home'); if(home === wasHome) return; wasHome = home;
  if(!document.body.classList.contains('has-nav')) return;
  if(!home && !tabBase && depth === 0 && !skip){ history.pushState({ tab:1 }, ''); tabBase = true; }
  else if(home && tabBase && depth === 0 && !goingHome){ tabBase = false; skip++; history.back(); }
  goingHome = false;
}).observe(document.body, { attributes:true, attributeFilter:['class'] });
let goingHome = false;
function toHome(){ goingHome = true; const b = document.getElementById('t-home'); if(b) b.click(); else goingHome = false; }
window._backnav = { get depth(){ return depth; }, get tabBase(){ return tabBase; }, closeTop };
})();
