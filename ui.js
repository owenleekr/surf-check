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
window.undoToast = function(msg, onUndo, ms){
  let el = document.getElementById('undo-bar');
  if(!el){ el = document.createElement('div'); el.id = 'undo-bar'; el.className = 'undo-bar'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
  el.innerHTML = `<span>${esc_(msg)}</span><button type="button">되돌리기</button>`; el.hidden = false; el.classList.add('on');
  const hide = ()=>{ el.classList.remove('on'); clearTimeout(uT); uT = setTimeout(()=>{ el.hidden = true; }, 250); };
  el.querySelector('button').onclick = ()=>{ hide(); try{ onUndo && onUndo(); }catch(e){} };
  clearTimeout(uT); uT = setTimeout(hide, ms || 5000);
};
})();
