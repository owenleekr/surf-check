/* ── 업데이트 소식 ─────────────────────────────────────────────────
   새 기능이 생겨도 사람들이 모르면 없는 것과 같다. 홈 맨 위에 '최근 업데이트' 카드 한 장,
   누르면 전체 내역(날짜별). 안 본 업데이트가 있으면 NEW 표시 — 본 시점은 이 기기에만 기억한다.
   새 배포 때 맨 위에 한 줄 추가하면 된다(id 는 겹치지 않게). go 는 그 기능으로 바로 가는 버튼. */
(function(){
const SEEN = 'lineup.share.upd', HIDE = 'lineup.share.updhide';
const UPDATES = [
  { id:'u1015a', date:'10.15', t:'🚌 버스 빈자리 조회', items:[
      ['🚌', '양양↔동서울 시외버스 남은 좌석을 바로 — 차량 탭 → 🚌 버스 빈자리', 'bus'],
      ['🔔', '매진 차에 🔕 누르면 자리 날 때 알려 드려요(앱이 열려 있는 동안)', 'bus'],
      ['🍜', '맛집 등록 — 네이버 공유 글을 붙이면 이름·지역 자동, 막히면 이유가 칸 안에', 'food'] ] },
  { id:'u1012b', date:'10.12', t:'💡 오늘의 추천', items:[
      ['🏄', '홈에 「오늘 테이크오프 연습했어요?」처럼 오늘 할 일·아직 안 해 본 기능을 하나씩 권해요', null],
      ['✕', '필요 없으면 ✕ — 그 추천은 오늘 하루 숨어요', null] ] },
  { id:'u1012a', date:'10.12', t:'게임 쉬움 · 어려움 모드', items:[
      ['🏄', '파도 점프가 메인 게임 — 홈·놀이 맨 앞에 크게, 매일 📅 오늘의 챌린지', 'game'],
      ['🙂', '파도 점프 · 라인업 서핑에 쉬움/어려움 — 쉬움은 처음 버전처럼 가볍게, 기록은 모드별로 따로', 'game'],
      ['🧹', '화면 간격 정리 · 바다 상황은 한 줄로 접고 연습·게임·맛집을 앞으로', null],
      ['🔕', '업데이트 알림은 「다시 보지 않기」로 닫을 수 있어요', null] ] },
  { id:'u1011d', date:'10.11', t:'캐릭터가 더 귀여워졌어요', items:[
      ['🙂', '점 눈 · 볼터치 · 통통한 볼 — 표정 6가지(미소·신남·선글라스·놀람·윙크·졸림)', 'me'],
      ['🛍️', '조개 상점 — 알로하 셔츠·판초·밀짚모자·고양이 귀·보드 무늬, 입어 보고 사요 · 오늘의 할인', 'shop'],
      ['🏠', '홈 정리 — 연습 체크 · 게임 · 맛집/스팟이 맨 앞으로', null] ] },
  { id:'u1011c', date:'10.11', t:'새 게임 · 서프스케이트 훈련', items:[
      ['🌊', '라인업 서핑 — 패들로 파도 잡고, 팝업, 튜브·탑턴·에어, 무너지면 풀아웃', 'surf'],
      ['🛹', '서프스케이트 훈련 — 땅에서 펌핑·바텀턴·컷백 리듬 + 실제 연습 코칭', 'skate'],
      ['🏄', '파도 점프 — 목숨 3개 · 아이템 7가지 · 스테이지 5개 · 화면 크게', 'game'] ] },
  { id:'u1011b', date:'10.11', t:'맛집 · 스팟 누구나 등록', items:[
      ['➕', '네이버지도 링크 + 한줄평이면 바로 올라가요 · 운영자가 리스트에 넣으면 ❌ → ⭕', 'food'],
      ['💬', '카드마다 댓글 · 답글 · 👍 추천 · 🙋 가봤어요 (내 기수 표시)', 'food'],
      ['📲', '홈 화면에 추가 · 사용 가이드 페이지(/guide)', 'guide'] ] },
  { id:'u1011a', date:'10.11', t:'맛집 탭 · 서핑 스팟', items:[
      ['🍜', '양서학 네이버 맛집 리스트가 자동으로 들어와요', 'food'],
      ['🏄', '서핑 스팟 리스트 — 지역별 · 라이브캠 바로 보기', 'spot'] ] },
];
const $u = id => document.getElementById(id);
const seen = () => { try{ return localStorage.getItem(SEEN) || ''; }catch(e){ return ''; } };
const unseen = () => { const s = seen(); const i = UPDATES.findIndex(u=>u.id === s); return i < 0 ? UPDATES.length : i; };   // 맨 위부터 본 것 전까지
function go(k){
  const sh = $u('upd-sheet'); if(sh) sh.hidden = true;
  if(k === 'surf') window.surfOpen?.(); else if(k === 'skate') window.skateOpen?.(); else if(k === 'game') window.gameOpen?.();
  else if(k === 'shop') window.shopOpen?.(); else if(k === 'food' || k === 'spot') window.foodOpen?.(k);
  else if(k === 'bus') window.busOpen?.();
  else if(k === 'guide') window.open('/guide', '_blank', 'noopener');
  else if(k === 'me'){ setTab('home'); setTimeout(()=>{ const d = $u('bld-fold'); if(d){ d.open = true; d.scrollIntoView({ block:'start', behavior:'smooth' }); } }, 120); }
}
/* 홈 카드 — 안 본 업데이트가 있을 때만 뜬다. '다시 보지 않기'를 누르면 다음 업데이트가 나올 때까지 숨는다. */
const hiddenFor = () => { try{ return localStorage.getItem(HIDE) || ''; }catch(e){ return ''; } };
function card(){
  const el = $u('home-upd'); if(!el) return;
  const u = UPDATES[0], n = unseen();
  if(!n || hiddenFor() === u.id){ el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  el.innerHTML = `<button type="button" class="upd" id="upd-open"><span class="upd-h"><b>🆕 업데이트 · ${u.date}</b>${n ? `<em>NEW ${n}</em>` : ''}</span>
    <span class="upd-t">${u.t}</span><span class="upd-l">${u.items.slice(0, 2).map(i=>`${i[0]} ${i[1].split(' — ')[0]}`).join('<br>')}</span><span class="upd-more">전체 보기 ›</span></button>
    <button type="button" class="upd-x" id="upd-x">다시 보지 않기</button>`;
  $u('upd-open').onclick = openAll;
  $u('upd-x').onclick = ()=>{ try{ localStorage.setItem(HIDE, u.id); localStorage.setItem(SEEN, u.id); }catch(e){} card(); };
}
function openAll(){
  let sh = $u('upd-sheet');
  if(!sh){ sh = document.createElement('div'); sh.className = 'sheet'; sh.id = 'upd-sheet';
    sh.innerHTML = '<div class="sheet-dim" data-uclose></div><div class="sheet-in"><div class="sheet-hd"><span class="t">🆕 업데이트 소식</span><button class="btn sm ghost" data-uclose>닫기</button></div><div id="upd-body"></div></div>';
    document.body.appendChild(sh);
    sh.addEventListener('click', e=>{ if(e.target.closest('[data-uclose]')){ sh.hidden = true; return; } const b = e.target.closest('[data-ugo]'); if(b) go(b.dataset.ugo); }); }
  const n = unseen();
  $u('upd-body').innerHTML = UPDATES.map((u, i)=>`<section class="upd-sec${i < n ? ' new' : ''}"><h4>${u.date} · ${u.t}${i < n ? ' <em>NEW</em>' : ''}</h4>
    ${u.items.map(([ic, txt, k])=>`<div class="upd-it"><i>${ic}</i><span>${txt}</span>${k ? `<button type="button" class="btn sm mint" data-ugo="${k}">가 보기</button>` : ''}</div>`).join('')}</section>`).join('')
    + '<div class="note" style="margin-top:10px">자세한 사용법은 <a href="/guide" target="_blank" rel="noopener">surf.owenai.xyz/guide</a></div>';
  sh.hidden = false;
  try{ localStorage.setItem(SEEN, UPDATES[0].id); }catch(e){}
  card();
}
window.updCard = card; window.updOpen = openAll; window.UPDATES = UPDATES;
window.updEvents = () => UPDATES.slice(0, 1).map(u=>({ ic:'🆕', who:'', text:`업데이트 — ${u.t}`, go:'upd' }));
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', card); else card();
})();
