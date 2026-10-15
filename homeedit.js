/* ── 🏠 홈 편집 ─────────────────────────────────────────────────
   홈에 섹션이 열 개 넘게 쌓여 길었다. 사람마다 안 쓰는 게 다르다(게임을 안 하는 사람, 훈련 체크를 안 하는 사람).
   ☰기타 → 홈 편집에서 섹션을 끄고 켠다. 이 기기에만 저장(localStorage) — 남에게 보이는 것은 바뀌지 않는다. */
(function(){
const KEY = 'lineup.share.homeoff';
const SECTIONS = [['home-wave', '🌊 이번주의 파도 · 오늘 갈까'], ['home-log', '📒 서핑 일지'], ['drill', '🏄 테이크오프 훈련'], ['home-games', '🎮 오늘 한 판(게임)'],
  ['home-food', '🍜 맛집 · 스팟'], ['here-grp', '🤙 같이 가요(번개·카풀·숙소)'], ['voice', '🎙️ 코치님 목소리'], ['home-rec', '💡 추천 카드'], ['home-upd', '📰 업데이트 소식'], ['quest-strip', '✅ 오늘의 퀘스트']];
const get = () => { try{ const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a.filter(x=>SECTIONS.some(s=>s[0] === x)) : []; }catch(e){ return []; } };
const set = a => { try{ localStorage.setItem(KEY, JSON.stringify(a)); }catch(e){} };
function apply(){
  let st = document.getElementById('home-off-css'); if(!st){ st = document.createElement('style'); st.id = 'home-off-css'; document.head.appendChild(st); }
  st.textContent = get().map(id=>`#pane-home #${id}{ display:none !important }`).join('\n');
}
function open(){
  let sh = document.getElementById('home-edit');
  if(!sh){ sh = document.createElement('div'); sh.className = 'sheet'; sh.id = 'home-edit'; sh.hidden = true;
    sh.innerHTML = '<div class="sheet-dim" data-heclose></div><div class="sheet-in"><div class="sheet-hd"><span class="t">🏠 홈 편집</span><button class="btn sm ghost" data-heclose>닫기</button></div><div id="he-body"></div></div>';
    document.body.appendChild(sh);
    sh.addEventListener('click', e=>{
      if(e.target.closest('[data-heclose]')){ sh.hidden = true; return; }
      const b = e.target.closest('[data-he]'); if(b){ const id = b.dataset.he, off = get(); const i = off.indexOf(id); if(i < 0) off.push(id); else off.splice(i, 1); set(off); apply(); paint(); return; }
      if(e.target.closest('[data-heall]')){ set([]); apply(); paint(); } }); }
  paint(); sh.hidden = false;
}
function paint(){
  const off = get(), el = document.getElementById('he-body'); if(!el) return;
  el.innerHTML = `<p class="note" style="margin:0 0 8px">끄면 홈에서만 숨겨져요. 이 휴대폰에만 저장돼요.</p>
    <div class="he-list">${SECTIONS.map(([id, t])=>{ const on = !off.includes(id); return `<button type="button" class="he-row" data-he="${id}" role="switch" aria-checked="${on}"><span>${t}</span><i class="he-sw${on ? ' on' : ''}" aria-hidden="true"></i></button>`; }).join('')}</div>
    ${off.length ? '<button type="button" class="btn sm ghost" data-heall style="margin-top:10px">모두 다시 보이기</button>' : ''}`;
}
window.homeEditOpen = open;
apply();
})();
