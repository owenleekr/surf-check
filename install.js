/* ── 홈 화면에 추가 ─────────────────────────────────────────────────
   매번 카톡 링크를 찾아 들어오지 않게, 폰 홈 화면에 앱처럼 아이콘을 둔다.
   · 안드로이드 크롬·삼성 인터넷: 브라우저가 '설치' 신호(beforeinstallprompt)를 주면 버튼 한 번으로 설치
   · 아이폰: 사파리는 설치 버튼을 못 띄운다 → 공유(□↑) → '홈 화면에 추가' 안내
   · 카카오톡·인스타 안 브라우저: 거기선 추가가 안 된다 → 사파리/크롬으로 열기부터
   이미 홈 화면에서 연(standalone) 사람에겐 아무것도 안 보인다. 홈 카드의 ✕ 는 14일 숨긴다. */
(function(){
const KEY = 'lineup.share.a2hs', URL0 = 'https://surf.owenai.xyz/surfshare';
const $i = id => document.getElementById(id);
const ua = navigator.userAgent || '';
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/i.test(ua);
const inKakao = /KAKAOTALK/i.test(ua), inApp = inKakao || /NAVER\(inapp|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp/i.test(ua);
const isSamsung = /SamsungBrowser/i.test(ua), isIOSChrome = isIOS && /CriOS/i.test(ua);
let deferred = null;

const hidden = () => { try{ return Date.now() < (+localStorage.getItem(KEY) || 0); }catch(e){ return false; } };
addEventListener('beforeinstallprompt', e=>{ if(isIOS) return; e.preventDefault(); deferred = e; render(); });          // 아이폰엔 이 신호가 없다(테스트용 크롬이 흉내 내도 무시)
addEventListener('appinstalled', ()=>{ deferred = null; try{ localStorage.setItem(KEY, String(Date.now() + 3650 * 864e5)); }catch(e){} render(); if(typeof toast === 'function') toast('홈 화면에 추가했어요 📲'); });

function render(){
  const el = $i('a2hs'); if(!el) return;
  if(standalone() || hidden()){ el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `<button type="button" class="a2-go" id="a2-go"><span class="a2-ic">📲</span><span><b>홈 화면에 SurfShare 추가</b><small>${inApp ? '카톡 안에서는 안 돼요 — 눌러서 방법 보기' : deferred ? '버튼 한 번이면 앱처럼 깔려요' : isIOS ? '공유 → 홈 화면에 추가 (10초)' : '앱처럼 아이콘으로 바로 열기'}</small></span><i>›</i></button>
    <button type="button" class="a2-x" id="a2-x" aria-label="14일 동안 숨기기">✕</button>`;
  $i('a2-go').onclick = a2hsOpen;
  $i('a2-x').onclick = ()=>{ try{ localStorage.setItem(KEY, String(Date.now() + 14 * 864e5)); }catch(e){} render(); };
}

const step = (n, t) => `<li><b>${n}</b><span>${t}</span></li>`;
function guide(){
  if(standalone()) return `<div class="a2-ok">✅ 이미 홈 화면에서 열었어요. 다음엔 아이콘을 누르면 바로 열려요.</div>`;
  if(inKakao && isIOS) return `<p class="a2-p">카카오톡 안 브라우저에서는 홈 화면에 추가가 안 돼요. <b>사파리로 먼저 열어</b> 주세요.</p>
    <a class="btn blue a2-btn" href="kakaotalk://web/openExternal?url=${encodeURIComponent(URL0)}">🧭 사파리로 열기</a>
    <ol class="a2-st">${step('안 되면', '오른쪽 아래 <b>⋯</b> → <b>다른 브라우저로 열기</b>')}${step('사파리에서', '아래 <b>공유(□↑)</b> → <b>홈 화면에 추가</b> → <b>추가</b>')}</ol>`;
  if(inApp && isAndroid) return `<p class="a2-p">앱 안 브라우저에서는 홈 화면에 추가가 안 돼요. <b>크롬으로 먼저 열어</b> 주세요.</p>
    <a class="btn blue a2-btn" href="intent://surf.owenai.xyz/surfshare#Intent;scheme=https;package=com.android.chrome;end">🌐 크롬으로 열기</a>
    <ol class="a2-st">${step('안 되면', '오른쪽 위(또는 아래) <b>⋮</b> → <b>다른 브라우저로 열기</b>')}${step('크롬에서', '이 버튼을 다시 누르면 <b>설치</b>가 떠요')}</ol>`;
  if(inApp) return `<p class="a2-p">앱 안 브라우저에서는 추가가 안 돼요. 메뉴의 <b>다른 브라우저로 열기</b>로 사파리·크롬에서 열어 주세요.</p>`;
  if(isIOS) return `<ol class="a2-st">${step('1', isIOSChrome ? '주소창 오른쪽 <b>공유(□↑)</b>를 눌러요' : '화면 아래 가운데 <b>공유(□↑)</b>를 눌러요')}
      ${step('2', '목록을 조금 내려 <b>홈 화면에 추가</b>를 눌러요')}${step('3', '오른쪽 위 <b>추가</b> — 끝! 홈 화면의 🏄 아이콘으로 열어요')}</ol>
    <p class="a2-p" style="font-size:12.5px">안 보이면 사파리로 열었는지 확인해 주세요(iOS 16.4 이상은 크롬에서도 돼요).</p>`;
  if(isSamsung) return `<ol class="a2-st">${step('1', '아래 <b>≡ 메뉴</b>를 눌러요')}${step('2', '<b>현재 페이지 추가</b> → <b>홈 화면</b>')}${step('3', '홈 화면의 🏄 아이콘으로 열어요')}</ol>`;
  return `<ol class="a2-st">${step('1', '오른쪽 위 <b>⋮</b>를 눌러요')}${step('2', '<b>홈 화면에 추가</b> 또는 <b>앱 설치</b>')}${step('3', '<b>설치/추가</b> — 홈 화면의 🏄 아이콘으로 열어요')}</ol>`;
}
async function a2hsOpen(){
  if(deferred && !inApp){
    try{ deferred.prompt(); const r = await deferred.userChoice; deferred = null; render();
      if(r && r.outcome === 'accepted') return; }catch(e){}
  }
  let sh = $i('a2-sheet');
  if(!sh){ sh = document.createElement('div'); sh.className = 'sheet'; sh.id = 'a2-sheet';
    sh.innerHTML = '<div class="sheet-dim" data-a2close></div><div class="sheet-in"><div class="sheet-hd"><span class="t">📲 홈 화면에 추가</span><button class="btn sm ghost" data-a2close>닫기</button></div><div id="a2-body"></div></div>';
    document.body.appendChild(sh); sh.addEventListener('click', e=>{ if(e.target.closest('[data-a2close]')) sh.hidden = true; }); }
  $i('a2-body').innerHTML = `<div class="a2-why">한 번 해 두면 카톡에서 링크를 찾지 않아도 <b>아이콘 하나로</b> 바로 열려요. 로그인도 그대로예요.</div>${guide()}`;
  sh.hidden = false;
}
window.a2hsOpen = a2hsOpen; window.a2hsRender = render;
window._a2 = { isIOS, isAndroid, inKakao, inApp, standalone };
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
