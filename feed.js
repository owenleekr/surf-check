/* ── 상단 소식줄 ───────────────────────────────────────────────────
   앱 맨 위 한 줄에 "누가 파도 점프 N점을 돌파했다 · 새 맛집이 올라왔다 · 누가 댓글을 남겼다"를 돌려 보여 준다.
   혼자 쓰는 앱처럼 보이지 않게 — 눌러서 바로 그곳(게임·맛집·스팟)으로 간다.

   소식의 출처(전부 이미 있는 데이터, 새 서버 없음):
   · 게임: 동기들 프로필의 play.best / play.bat(최고기록 시각). 72시간 안 것만, 100점 이상만.
   · 맛집·스팟: 네이버 폴더에 새로 들어온 가게(생성 시각 14일 안).
   · 댓글·등록 요청: place_talk 표(foodtalk.js).
   남의 값(이름·점수)은 숫자로 거르고 textContent 로만 넣는다. 읽은 시각만 이 기기에 기억한다. */
(function(){
const SEEN = 'lineup.share.feedseen', ROT = 5200, PULL = 120e3;
let peers = [], pulledAt = 0, i = 0, timer = 0, evs = [];
const $f = id => document.getElementById(id);
const hasMe = () => typeof ME !== 'undefined' && !!ME;
const seen = () => { try{ return +localStorage.getItem(SEEN) || 0; }catch(e){ return 0; } };
const ago = ts => { const m = Math.floor((Date.now() - ts) / 6e4); return m < 1 ? '방금' : m < 60 ? `${m}분 전` : m < 1440 ? `${Math.floor(m / 60)}시간 전` : `${Math.floor(m / 1440)}일 전`; };
const TIERS = [100, 200, 300, 500, 700, 1000, 1500, 2000, 3000, 5000];
const tierOf = n => TIERS.filter(t=>t <= n).pop() || 0;

async function pullPeers(){
  if(typeof api !== 'function' || !hasMe()) return;
  try{ const rows = await api('surfers?select=id,name,cohort,play:profile->play&limit=300');
    peers = (rows || []).filter(x=>x && x.id !== ME.id && !(typeof isTest === 'function' && isTest(x.id))).map(x=>{
      const pp = typeof peerPlay === 'function' ? peerPlay(x.play) : null; return pp ? { id:x.id, name:String(x.name || '').slice(0, 12), cohort:x.cohort, best:pp.best, bat:pp.bat, hbest:pp.hbest, hbat:pp.hbat, sbest:pp.sbest, sbat:pp.sbat } : null; }).filter(Boolean);
  }catch(e){}
  pulledAt = Date.now();
}

function collect(){
  const out = [], now = Date.now(), tag = c => c === '6기' ? '6기' : '서퍼';
  peers.forEach(p=>{ if(p.best >= 100 && p.bat > now - 72 * 3600e3 && p.bat <= now + 6e4)
    out.push({ ts:p.bat, ic:'🏄', who:`${p.name}(${tag(p.cohort)})`, text:`님이 파도 점프 ${tierOf(p.best)}점 돌파! (${p.best}점)`, go:'game' });
    if(p.hbest >= 100 && p.hbat > now - 72 * 3600e3 && p.hbat <= now + 6e4)
      out.push({ ts:p.hbat, ic:'🔥', who:`${p.name}(${tag(p.cohort)})`, text:`님이 파도 점프 어려움 ${tierOf(p.hbest)}점 돌파! (${p.hbest}점)`, go:'game' });
    if(p.sbest >= 100 && p.sbat > now - 72 * 3600e3 && p.sbat <= now + 6e4)
      out.push({ ts:p.sbat, ic:'🌊', who:`${p.name}(${tag(p.cohort)})`, text:`님이 라인업 서핑 ${p.sbest}점 기록!`, go:'surf' }); });
  const wk = now - 14 * 864e5;
  ['food', 'spot'].forEach(k=>{ (window.foodItems ? window.foodItems(k) : []).forEach(it=>{ const t = +it.t; if(t > wk && t <= now + 6e4)
    out.push({ ts:t, ic:k === 'food' ? '🍜' : '🏄', who:'', text:`새 ${k === 'food' ? '맛집' : '서핑 스팟'} ‘${it.n}’ 등록!`, go:k }); }); });
  const nameOf = (k, id) => (window.foodItems ? window.foodItems(k) : []).find(x=>String(x.id) === String(id))?.n;
  if(window.FT) FT.events(nameOf).forEach(e=>out.push({ ts:e.ts, ic:e.ic, who:e.who, text:e.text, go:e.kind }));
  out.sort((a,b)=>b.ts - a.ts);
  const top = out.slice(0, 8);
  /* 업데이트는 홈 카드·로그인 알림이 맡는다 — 소식줄에까지 넣으면 같은 말이 세 번 나온다 */
  { const r = typeof window.recTop === 'function' ? window.recTop() : null; if(r) top.splice(Math.min(2, top.length), 0, r); }   // 안 해 본 것 하나     // 최근 업데이트도 한 칸
  if(top.length < 3){            // 조용한 날엔 '지금의 기록'을 보여 준다 — 도전할 이유
    const best = peers.filter(p=>p.best >= 100).sort((a,b)=>b.best - a.best)[0];
    if(best) top.push({ ts:0, ic:'👑', who:`${best.name}(${tag(best.cohort)})`, text:`님이 파도 점프 최고 ${best.best}점 — 넘어 볼래요?`, go:'game' });
    if(!top.length) top.push({ ts:0, ic:'🏄', who:'', text:'파도 점프 오늘의 챌린지에 도전해 보세요', go:'game' });
  }
  return top;
}

function paint(step){
  const el = $f('feed'); if(!el) return;
  evs = collect(); if(!evs.length){ el.hidden = true; return; }
  if(step) i = (i + 1) % evs.length; else i = Math.min(i, evs.length - 1);
  const e = evs[i], n = evs.filter(x=>x.ts > seen()).length;
  el.hidden = false;
  $f('feed-ic').textContent = e.ic;
  const t = $f('feed-t'); t.textContent = ''; const b = document.createElement('b'); b.textContent = e.who; t.append(b, e.text);
  if(e.ts){ const s = document.createElement('small'); s.textContent = ' · ' + ago(e.ts); t.append(s); }
  const c = $f('feed-n'); c.textContent = n ? `새 소식 ${n}` : ''; c.hidden = !n;
  el.dataset.go = e.go; el.classList.remove('flip'); void el.offsetWidth; el.classList.add('flip');
  el.setAttribute('aria-label', `${e.who} ${e.text}. 누르면 이동해요`);
}

function go(){
  const el = $f('feed'), g = el?.dataset.go;
  try{ localStorage.setItem(SEEN, String(Date.now())); }catch(err){}
  if(g === 'game' && typeof gameOpen === 'function') gameOpen();
  else if(g === 'surf' && typeof surfOpen === 'function') surfOpen();
  else if(g === 'upd' && typeof updOpen === 'function') updOpen();
  else if(g === 'rec' && typeof recGo === 'function') recGo();
  else if((g === 'food' || g === 'spot') && typeof foodOpen === 'function') foodOpen(g);
  paint(false);
}

function tick(){
  if(document.hidden || !hasMe() || !$f('main') || $f('main').hidden) return;
  if(Date.now() - pulledAt > PULL){ pullPeers().then(()=>paint(false)); if(window.FT) FT.pull(false); }
  paint(true);
}
function start(){
  const el = $f('feed'); if(!el || start.done) return; start.done = true;
  el.onclick = go;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  timer = setInterval(tick, reduce ? ROT * 2 : ROT);
  const first = ()=>{ if(hasMe() && $f('main') && !$f('main').hidden){ pullPeers().then(()=>paint(false)); if(window.FT) FT.pull(false); paint(false); } else setTimeout(first, 1500); };
  first();
}
window.feedRefresh = ()=>paint(false);
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
