/* ── 앱 안 확인창 · 되돌리기 ─────────────────────────────────────
   브라우저 기본 confirm() 은 휴대폰에서 앱과 동떨어진 회색 창이고, 홈 화면 앱(standalone)에선 주소까지 찍혔다.
   ask(문구, { ok, danger }) → Promise<boolean>  — 앱 모양의 확인창. 뒤로가기·바깥 누르기 = 취소.
   undoToast(문구, 되돌리기) — 지우기 같은 걸 바로 하고 5초 동안 되돌릴 기회를 준다(확인창 대신). */
(function(){
const esc_ = t => String(t == null ? '' : t).replace(/[<>&"']/g, c=>({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&#39;' }[c]));
let busy = null;
window.ask = function(msg, o){
  o = o || {};
  return new Promise(res=>{
    if(busy){ busy(false); }
    const el = document.createElement('div'); el.className = 'pop ask'; el.setAttribute('role', 'alertdialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="pop-card ask-card"><p>${esc_(msg).replace(/\n/g, '<br>')}</p>
      <div class="ask-btns"><button type="button" class="btn ghost" data-close>${esc_(o.cancel || '취소')}</button><button type="button" class="btn ${o.danger ? 'coral' : 'blue'}" data-ok>${esc_(o.ok || '확인')}</button></div></div>`;
    const done = v=>{ if(!el.isConnected) return; busy = null; el.remove(); document.removeEventListener('keydown', key); res(v); };
    const key = e=>{ if(e.key === 'Escape') done(false); };
    el.addEventListener('click', e=>{ if(e.target === el || e.target.closest('[data-close]')) done(false); else if(e.target.closest('[data-ok]')) done(true); });
    document.addEventListener('keydown', key); busy = done;
    document.body.appendChild(el); el.querySelector('[data-ok]').focus({ preventScroll:true });
  });
};
let uT = 0;
/* 키보드 — 아래에서 올라온 창의 입력칸을 누르면 키보드가 칸을 가렸다.
   칸을 화면 가운데로 끌어올리고, 키보드가 떠 있는 동안(body.kb-on)은 아래 탭을 숨기고 창을 키보드 위까지만 쓴다 */
document.addEventListener('focusin', e=>{ const el = e.target; if(!el.matches || !el.matches('input:not([type=checkbox]):not([type=radio]), textarea, select')) return;
  setTimeout(()=>{ if(document.activeElement === el) el.scrollIntoView({ block:'center', behavior:'smooth' }); }, 320); });
if(window.visualViewport){ const vv = window.visualViewport;
  const f = ()=>{ const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)); document.documentElement.style.setProperty('--kb', kb + 'px'); document.body.classList.toggle('kb-on', kb > 120); };
  vv.addEventListener('resize', f); vv.addEventListener('scroll', f); }
/* 아래로 끌어 닫기 — 시트 제목줄을 잡고 90px 넘게 내리면 닫는다(그보다 짧으면 제자리로).
   내용을 스크롤하는 손짓과 겹치지 않게 제목줄(.sheet-hd)에서 시작한 끌기만 받는다 */
let drag = null;
document.addEventListener('touchstart', e=>{ const hd = e.target.closest && e.target.closest('.sheet-hd'); if(!hd || e.target.closest('button, a, input')) return;
  const inn = hd.closest('.sheet-in'); if(!inn) return; drag = { inn, y0:e.touches[0].clientY, dy:0 }; inn.style.transition = 'none'; }, { passive:true });
document.addEventListener('touchmove', e=>{ if(!drag) return; drag.dy = Math.max(0, e.touches[0].clientY - drag.y0); drag.inn.style.transform = `translateY(${drag.dy}px)`; }, { passive:true });
document.addEventListener('touchend', ()=>{ if(!drag) return; const { inn, dy } = drag; drag = null; inn.style.transition = 'transform .18s ease-out';
  if(dy > 90){ const btn = inn.querySelector('.sheet-hd button'); inn.style.transform = 'translateY(100%)'; setTimeout(()=>{ inn.style.transform = ''; inn.style.transition = ''; if(btn) btn.click(); else inn.closest('.sheet').hidden = true; }, 170); }
  else { inn.style.transform = ''; setTimeout(()=>{ inn.style.transition = ''; }, 200); } });
window.undoToast = function(msg, onUndo, ms){
  let el = document.getElementById('undo-bar');
  if(!el){ el = document.createElement('div'); el.id = 'undo-bar'; el.className = 'undo-bar'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
  el.innerHTML = `<span>${esc_(msg)}</span><button type="button">되돌리기</button>`; el.hidden = false; el.classList.add('on');
  const hide = ()=>{ el.classList.remove('on'); clearTimeout(uT); uT = setTimeout(()=>{ el.hidden = true; }, 250); };
  el.querySelector('button').onclick = ()=>{ hide(); try{ onUndo && onUndo(); }catch(e){} };
  clearTimeout(uT); uT = setTimeout(hide, ms || 5000);
};
})();
