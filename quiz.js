/* ── 코치 퀴즈 ─────────────────────────────────────────────────────
   단톡방에 흩어져 있던 코치님 말씀을 "누가 한 말일까요?"로 맞힌다. 한 판 5문제, 맞힐 때마다 2 XP(하루 10 XP까지).
   틀려도 정답과 말씀 전문이 그대로 보이니, 퀴즈이면서 복습이다.
   말씀은 코드에 박힌 상수(VOICES)라 남이 쓴 값이 아니다 — 그래도 esc 를 거친다. */
(function(){
const $q = id => document.getElementById(id);
const N = 5;
let Q = null;

const speakers = () => [...new Set(VOICES.map(v=>v[1]))];
function deck(){
  const idx = VOICES.map((_,i)=>i);
  for(let i = idx.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx.slice(0, N);
}

function render(){
  const body = $q('quiz-body'); if(!Q || !body) return;
  if(Q.i >= N){ return done(); }
  const [text, who] = VOICES[Q.deck[Q.i]];
  body.innerHTML = `
    <div class="qz-hd"><span>문제 ${Q.i + 1} / ${N}</span><span class="qz-dots" aria-hidden="true">${Array.from({length:N},(_,k)=>`<i class="${k < Q.i ? (Q.res[k] ? 'ok' : 'no') : (k === Q.i ? 'cur' : '')}"></i>`).join('')}</span><span>맞힌 ${Q.ok}</span></div>
    <div class="qz-q">“${esc(text)}”</div>
    <div class="qz-sub">누가 한 말일까요?</div>
    <div class="qz-opts">${speakers().map(s=>`<button type="button" class="qz-o" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div>
    <div class="qz-fb" id="qz-fb" role="status" aria-live="polite"></div>
    <button type="button" class="btn blue" id="qz-next" style="width:100%;min-height:48px;margin-top:10px" hidden>${Q.i === N - 1 ? '결과 보기' : '다음 →'}</button>`;
  body.querySelectorAll('.qz-o').forEach(b=>b.onclick = ()=>answer(b, who));
}

function answer(btn, who){
  if(Q.locked) return; Q.locked = true;
  const right = btn.dataset.s === who;
  Q.res.push(right); if(right) Q.ok++;
  $q('quiz-body').querySelectorAll('.qz-o').forEach(b=>{ b.disabled = true;
    if(b.dataset.s === who) b.classList.add('right'); else if(b === btn) b.classList.add('wrong'); });
  $q('qz-fb').innerHTML = right ? '✅ 맞아요!' : `❌ 아쉬워요 — <b>${esc(who)}</b>의 말씀이에요`;
  vib(right ? 12 : [20, 40, 20]);
  if(right && typeof burst === 'function') burst(btn, 7);
  const nx = $q('qz-next'); nx.hidden = false; nx.focus({ preventScroll:true });
  nx.onclick = ()=>{ Q.i++; Q.locked = false; render(); };
}

function done(){
  const p = playP(), day = today();
  if(p.qzday !== day){ p.qzday = day; p.qzxp = 0; }
  const gain = Math.max(0, Math.min(Q.ok * 2, 10 - (p.qzxp || 0)));
  p.qzxp += gain; p.bonus += gain; p.qz = (p.qz || 0) + Q.ok;
  const total = p.qz;
  playVisit('quiz');                 // 오늘의 퀘스트 표시(오늘 첫 판에만 저장·재계산한다)
  playPush(); playTick();            // 두 번째 판부터는 위가 건너뛰므로 점수·배지는 여기서 다시 계산한다
  const perfect = Q.ok === N;
  $q('quiz-body').innerHTML = `
    <div class="qz-end">
      <div class="qz-big">${perfect ? '🏆' : Q.ok >= 3 ? '👏' : '🌱'}</div>
      <div class="qz-score">${Q.ok} <small>/ ${N}</small></div>
      <div class="qz-msg">${perfect ? '전부 맞혔어요! 코치님 말씀을 다 아시네요.' : Q.ok >= 3 ? '잘했어요. 한 번 더 하면 만점도 가능해요.' : '괜찮아요. 틀린 말씀이 복습이 됐을 거예요.'}</div>
      <div class="qz-xp">${gain ? `+${gain} XP` : Q.ok === 0 ? '다음엔 맞힐 수 있어요' : '오늘 퀴즈 XP는 다 채웠어요'} · 누적 정답 ${total}개</div>
      <div style="display:flex;gap:8px;margin-top:14px"><button type="button" class="btn blue" id="qz-again" style="flex:1;min-height:48px">한 판 더</button>
        <button type="button" class="btn ghost" id="qz-close" style="min-height:48px" data-autofocus>닫기</button></div>
    </div>`;
  if(perfect && typeof burst === 'function') setTimeout(()=>burst($q('quiz-body').querySelector('.qz-big'), 16), 200);
  $q('qz-again').onclick = quizOpen; $q('qz-close').onclick = quizClose;
}

function quizOpen(){
  Q = { deck:deck(), i:0, ok:0, res:[], locked:false };
  $q('quiz-sheet').hidden = false; render();
}
function quizClose(){ $q('quiz-sheet').hidden = true; Q = null; if(typeof renderPlay === 'function' && !$q('play-sheet').hidden) renderPlay(); }

function wire(){
  document.querySelectorAll('[data-quizclose]').forEach(b=>b.onclick = quizClose);
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape' && !$q('quiz-sheet').hidden) quizClose(); });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
window.quizOpen = quizOpen; window.quizClose = quizClose;
})();
