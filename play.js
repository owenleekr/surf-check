/* ── 서퍼 레벨 · 배지 · 오늘의 퀘스트 ─────────────────────────────────
   서버에 새 표를 만들지 않는다. 이미 쌓이는 기록(훈련·번개·차량·숙소·채팅·반응)에서
   점수를 계산하고, 결과만 프로필(JSON)에 얹어 둔다 — 그래야 다른 사람 화면에서도 순위가 나온다.

   원칙 두 가지:
   1) 점수는 줄어들지 않는다. 서버에서 불러오는 기간(차량 30일 등)이 지나 기록이 빠져도 레벨이 내려가면 안 된다.
      그래서 계산값과 저장값 중 큰 쪽을 쓴다.
   2) 처음 켜는 사람에게 과거 업적 알림 20개를 한꺼번에 쏟지 않는다. 첫 계산은 조용히 반영하고 환영 카드 한 장만 보여준다.

   신뢰 모델은 채팅·반응과 같다 — 서버가 '누가 했나'를 증명하지 못하니, 순위에 보상을 걸지 말 것. */

const PLV = [[0,'모래알','🐚'],[50,'물장구','💦'],[150,'패들러','🏊'],[300,'테이크오프','🏄'],[500,'라인업','🌊'],
             [800,'아웃사이드','🦈'],[1200,'튜브라이더','🌀'],[1800,'로컬','🌴'],[2600,'바다의 주인','👑']];
/* 남의 프로필(play)은 누구나 쓸 수 있는 곳에서 온 값이다 — 글자를 넣어 HTML 을 주입하거나 99 같은 레벨로 화면을 깨뜨릴 수 있다.
   (실제로 xp 에 <img onerror> 를 넣으면 모두의 도감에서 실행됐다.) 화면에 찍기 전에 반드시 숫자로 걸러 범위를 가둔다.
   레벨은 적힌 값을 믿지 않고 xp 로 다시 계산한다. */
const _num = (v, max) => { const x = Math.floor(+v); return Number.isFinite(x) ? Math.max(0, Math.min(max, x)) : 0; };
const peerPlay = pl => (pl && typeof pl === 'object') ? { xp:_num(pl.xp, 100000), best:_num(pl.best, 100000), bat:_num(pl.bat, 4e12), sebest:_num(pl.sebest, 1000000), hbest:_num(pl.hbest, 100000), hbat:_num(pl.hbat, 4e12), sbest:_num(pl.sbest, 1000000), sbat:_num(pl.sbat, 4e12),
  dbest:(pl.dbest && typeof pl.dbest === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(String(pl.dbest.day))) ? { day:String(pl.dbest.day), score:_num(pl.dbest.score, 100000) } : null,
  wk:(pl.wk && typeof pl.wk === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(String(pl.wk.w))) ? { w:String(pl.wk.w), j:_num(pl.wk.j, 1000000), d:_num(pl.wk.d, 15), r:_num(pl.wk.r, 1000000), q:_num(pl.wk.q, 11) } : null } : null;   // 이번 주 기록(주간 순위)
const lvOf = xp => { let i = 0; PLV.forEach((l,k)=>{ if(xp >= l[0]) i = k; }); return i; };

/* ── 레벨 보상 ── 새 꾸미기 아이템은 여기서만 정의한다.
   sprite.js 는 라인업 앱도 쓰므로 건드리지 않고, 서프쉐어에서 이 파일이 로드될 때 목록에 얹는다.
   (그래서 동기들 화면에서도 왕관을 쓴 사람이 그대로 그려진다.) */
const _pad = (s, left) => ('.'.repeat(left) + s).padEnd(24, '.');
HAT.band  = [ '.'.repeat(24), '.'.repeat(24), _pad('k' + 'o'.repeat(16) + 'k', 3), _pad('k'.repeat(18), 3) ];
HAT.crown = [ _pad('k.....k.....k', 5), _pad('ko...kok...ok', 5), _pad(['k','ooo','k','ooo','k','ooo','k'].join(''), 5),
              _pad('kt' + 'o'.repeat(9) + 'tk', 5), _pad('k'.repeat(13), 5) ];
/* 조개로 사는 것들 — 레벨이 아니라 게임에서 모은 조개(🐚)로 연다 */
HAT.sprout = [ _pad('g..g...g', 8), _pad('ggggg.ggg', 7), _pad('kggkgkggk', 7).slice(0,24), _pad('kkkkkkkkkkkk', 6) ];
HAT.wave   = [ '.'.repeat(24), _pad('..cc', 8), _pad('kcwwcckcwwk', 6), _pad('kbbbbbbbbbbk', 6), _pad('kkkkkkkkkkkk', 6) ];
HAT_KO.band = '서프 헤어밴드'; HAT_KO.crown = '왕관'; HAT_KO.sprout = '새싹'; HAT_KO.wave = '파도 모자';
BOARDC.sunset = '#FF7A59'; BOARDC_KO.sunset = '노을';
BOARDC.violet = '#8E5BFF'; BOARDC_KO.violet = '바이올렛';
BOARDC.gold = '#E8B923'; BOARDC_KO.gold = '골드';
BOARDC.neon = '#3DFFE0'; BOARDC_KO.neon = '네온';
BOARDC.legend = '#F4C430'; BOARDC_KO.legend = '전설';                 // 전설의 보드 원정을 깨면 열린다
/* ── 조개 상점 전용 옷·모자·보드 무늬 ── sprite.js(라인업 앱과 공유)는 건드리지 않고 여기서 목록에 얹는다.
   상의는 가슴(x9~14, 위 4줄)만 무늬를 바꿔 끼운다 — 실루엣은 래시가드 그대로라 어떤 머리·모자와도 맞는다. */
const _chest = pat => WEAR.rash.rows.map((r,i)=> i < 4 && pat[i] ? r.slice(0, 9) + pat[i] + r.slice(15) : r);
WEAR.aloha  = { ko:'알로하 셔츠', rows:_chest(['rwwwwr','rpryrw','yrwrpr','rrypry']) };
WEAR.stripe = { ko:'스트라이프 티', rows:_chest(['wwwwww','rrrrrr','wwwwww','rrrrrr']).map((r,i)=> i === 1 ? r.replace('ksskkk', 'kwwkkk').replace('kkkssk', 'kkkwwk') : r) };
WEAR.heart  = { ko:'하트 티', rows:_chest(['rrrrrr','rwrrwr','rwwwwr','rrwwrr']) };
WEAR.vest   = { ko:'구명조끼', rows:_chest(['oorroo','oorroo','okkkko','oorroo']) };
WEAR.poncho = { ko:'서핑 판초', rows:['.....krrrrrrrrrrrrk.....','....krrrrrrrrrrrrrrk....','...krwrwrwrwrwrwrwrwk...','...kkkkkkkkkkkkkkkkkk...'].concat(LEGS) };
Object.keys(WEAR).forEach(k=>{ if(!WEAR_KO[k] && WEAR[k]?.ko) WEAR_KO[k] = WEAR[k].ko; });   // 상점 옷도 이름표 — 꾸미기에 undefined 로 뜨던 것
HAT.straw   = ['........................','.......kttttttttk.......','......kqqqqqqqqqqk......','.kttttttttttttttttttttk.','..kkkkkkkkkkkkkkkkkkkk..'];
HAT.cat     = ['......kk........kk......','.....kepk......kpek.....','.....keek......keek.....','......kkkkkkkkkkkk......'];
HAT.flower  = ['........................','........................','..............kyk.......','.............kypyk......','..............kyk.......'];
Object.assign(HAT_KO, { straw:'밀짚모자', cat:'고양이 귀', flower:'꽃핀' });
/* 보드 무늬 — 보드 색('y') 칸에만 칠해진다(sprite.js) */
const _row = f => Array.from({ length:24 }, (_, x)=>f(x) || '.').join('');
const BPAT = {
  none:null,
  stringer:[ _row(()=>''), _row(x=>x === 11 || x === 12 ? 'w' : ''), _row(x=>x === 11 || x === 12 ? 'w' : ''), _row(()=>'') ],
  racing:  [ _row(()=>''), _row(x=>x % 6 < 2 ? 'q' : ''), _row(x=>x % 6 < 2 ? 'q' : ''), _row(()=>'') ],
  flower:  [ _row(()=>''), _row(x=>[3, 9, 15, 20].includes(x) ? 'w' : [4, 10, 16].includes(x) ? 'p' : ''), _row(x=>[4, 10, 16, 21].includes(x) ? 'p' : [3, 9, 15].includes(x) ? 'w' : ''), _row(()=>'') ],
  flame:   [ _row(()=>''), _row(x=>x < 10 ? (x % 3 ? 'o' : 'q') : ''), _row(x=>x < 7 ? (x % 2 ? 'q' : 'o') : ''), _row(()=>'') ],
};
window.BPAT = BPAT;
const BPAT_KO = { none:'없음', stringer:'스트링거', racing:'레이싱', flower:'꽃무늬', flame:'불꽃' };

/* lv 는 0부터(Lv.1 = 0). 아이콘은 해금 카드와 도감에 쓴다 */
const UNLOCKS = [
  { lv:1, key:'boardc', v:'gold',  n:'골드 보드',      ic:'🟡' },
  { lv:2, key:'hat',    v:'band',  n:'서프 헤어밴드',  ic:'🎽' },
  { lv:4, key:'boardc', v:'neon',  n:'네온 보드',      ic:'🟢' },
  { lv:6, key:'hat',    v:'crown', n:'왕관',           ic:'👑' },
  /* 모찌 미니미(mochi.js) 얼굴 꾸미기 — 연습할수록 열린다 */
  { lv:1, key:'eye',    v:'star',  n:'별눈',           ic:'⭐' },
  { lv:3, key:'acc',    v:'zinc',  n:'서퍼 선크림',    ic:'🧴' },
  { lv:5, key:'pet',    v:'otter', n:'해달 친구',      ic:'🦦' },
].sort((a, b)=>a.lv - b.lv);
/* 조개 상점 — 값은 조개(🐚). 번 만큼(shells) 쓴 만큼(spent)을 빼서 잔액을 센다. 산 것(own)은 영구. */
const SHOP = [
  { key:'wear',   v:'stripe', n:'스트라이프 티', ic:'👕', cost:30, cat:'옷' },
  { key:'wear',   v:'heart',  n:'하트 티',       ic:'💗', cost:35, cat:'옷' },
  { key:'wear',   v:'aloha',  n:'알로하 셔츠',   ic:'🌺', cost:50, cat:'옷' },
  { key:'wear',   v:'vest',   n:'구명조끼',      ic:'🦺', cost:45, cat:'옷' },
  { key:'wear',   v:'poncho', n:'서핑 판초',     ic:'🧥', cost:70, cat:'옷' },
  { key:'wear',   v:'dress',  n:'물방울 원피스', ic:'👗', cost:40, cat:'옷' },
  { key:'wear',   v:'knit',   n:'꽈배기 니트',   ic:'🧶', cost:35, cat:'옷' },
  { key:'wear',   v:'zipup',  n:'후드집업',      ic:'🧥', cost:45, cat:'옷' },
  { key:'wear',   v:'sailor', n:'세일러 칼라',   ic:'⚓', cost:40, cat:'옷' },
  { key:'hat',    v:'sprout', n:'새싹',          ic:'🌱', cost:30, cat:'모자' },
  { key:'hat',    v:'flower', n:'꽃핀',          ic:'🌼', cost:25, cat:'모자' },
  { key:'hat',    v:'cat',    n:'고양이 귀',     ic:'🐱', cost:45, cat:'모자' },
  { key:'hat',    v:'straw',  n:'밀짚모자',      ic:'👒', cost:50, cat:'모자' },
  { key:'hat',    v:'wave',   n:'파도 모자',     ic:'🌊', cost:60, cat:'모자' },
  { key:'boardc', v:'sunset', n:'노을 보드',     ic:'🟠', cost:20, cat:'보드' },
  { key:'boardc', v:'violet', n:'바이올렛 보드', ic:'🟣', cost:20, cat:'보드' },
  { key:'bpat',   v:'stringer', n:'스트링거 무늬', ic:'➖', cost:20, cat:'보드' },
  { key:'bpat',   v:'racing', n:'레이싱 무늬',   ic:'🏁', cost:35, cat:'보드' },
  { key:'bpat',   v:'flower', n:'꽃무늬 보드',   ic:'🌸', cost:40, cat:'보드' },
  { key:'bpat',   v:'flame',  n:'불꽃 보드',     ic:'🔥', cost:55, cat:'보드' },
  { key:'hair',   v:'perm',   n:'뽀글펌',        ic:'💇', cost:40, cat:'머리' },
  { key:'hair',   v:'braid',  n:'땋은머리',      ic:'🎀', cost:35, cat:'머리' },
  { key:'acc',    v:'glasses',n:'동그란 안경',   ic:'👓', cost:25, cat:'머리' },
  { key:'acc',    v:'star',   n:'별 스티커',     ic:'🌟', cost:15, cat:'머리' },
  { key:'pet',    v:'turtle', n:'거북이 친구',   ic:'🐢', cost:60, cat:'친구' },
  /* 소품(손에 드는 것) · 서핑 용품 — mochi.js 가 그린다 */
  { key:'hold',   v:'coffee', n:'아이스 아메리카노', ic:'🧋', cost:15, cat:'소품' },
  { key:'hold',   v:'coconut',n:'코코넛 음료',   ic:'🥥', cost:20, cat:'소품' },
  { key:'hold',   v:'shell',  n:'소라',          ic:'🐚', cost:20, cat:'소품' },
  { key:'hold',   v:'wax',    n:'서프 왁스',     ic:'🧼', cost:25, cat:'소품' },
  { key:'hold',   v:'gopro',  n:'액션캠 셀카봉', ic:'📷', cost:45, cat:'소품' },
  { key:'hold',   v:'flag',   n:'양서학 깃발',   ic:'🚩', cost:35, cat:'소품' },
  { key:'gear',   v:'leash',  n:'리쉬',          ic:'🪢', cost:20, cat:'서핑 용품' },
  { key:'gear',   v:'fins',   n:'트라이 핀',     ic:'🦈', cost:30, cat:'서핑 용품' },
  { key:'gear',   v:'towel',  n:'비치타월',      ic:'🏖️', cost:25, cat:'서핑 용품' },
  { key:'gear',   v:'watch',  n:'방수 시계',     ic:'⌚', cost:35, cat:'서핑 용품' },
  { key:'gear',   v:'pouch',  n:'방수 파우치',   ic:'👝', cost:30, cat:'서핑 용품' },
  { key:'gear',   v:'booties',n:'서핑 부츠',     ic:'🥾', cost:45, cat:'서핑 용품' },
  { key:'gear',   v:'helmet', n:'서핑 헬멧',     ic:'⛑️', cost:55, cat:'서핑 용품' },
];
/* 오늘의 할인 — 날짜로 하나를 골라 30% 싸게(모두 같은 물건) */
const dealOf = () => { const d = typeof today === 'function' ? today() : ''; let h = 7; for(const c of d) h = (h * 31 + c.charCodeAt(0)) >>> 0; return SHOP[h % SHOP.length]; };
const priceOf = it => it === dealOf() ? Math.round(it.cost * 0.7) : it.cost;
const shellBal = () => { const p = ME?.profile?.play; return p ? Math.max(0, (p.shells||0) - (p.spent||0)) : 0; };
/* 아직 안 샀으면 상품을, 샀거나 상품이 아니면 null */
const shopOf = (key, v) => { const it = SHOP.find(x=>x.key === key && x.v === v); return it && !ME?.profile?.play?.own?.[key + ':' + v] ? it : null; };
function playBuy(key, v){
  const it = SHOP.find(x=>x.key === key && x.v === v), p = ME?.profile?.play; if(!it || !p) return false;
  if(p.own?.[key + ':' + v]) return true;
  const cost = priceOf(it);
  if(shellBal() < cost){ toast(`🐚 조개가 모자라요 — ${cost}개 필요 (보유 ${shellBal()})`); return false; }
  (p.own ||= {})[key + ':' + v] = 1; p.spent = (p.spent || 0) + cost;
  playPush(); vib([20, 40, 20]); if(typeof burst === 'function') setTimeout(()=>burst($('bld-av') || document.body, 12), 50);
  toast(`${it.ic} ${it.n}을(를) 샀어요!`); return true;
}

/* ── 조개 상점 화면 ── 내 캐릭터에 입혀 본 모습(미리보기)으로 고르고, 사면 바로 입는다 */
let shopCat = '전체', shopTry = null;
function shopOpen(cat){
  if(typeof cat === 'string') shopCat = cat;                 // 허브 「강화소」는 강화 칸으로 바로 연다
  let sh = $('shop-sheet');
  if(!sh){ sh = document.createElement('div'); sh.className = 'sheet'; sh.id = 'shop-sheet';
    sh.innerHTML = '<div class="sheet-dim" data-shclose></div><div class="sheet-in"><div class="sheet-hd"><span class="t">🛍️ 소품샵</span><button class="btn sm ghost" data-shclose>닫기</button></div><div id="shop-body"></div></div>';
    document.body.appendChild(sh);
    sh.addEventListener('click', async e=>{
      if(e.target.closest('[data-shclose]')){ sh.hidden = true; shopTry = null; return; }
      const c = e.target.closest('[data-cat]'); if(c){ shopCat = c.dataset.cat; renderShop(); return; }
      const t = e.target.closest('[data-try]'); if(t){ const it = SHOP[+t.dataset.try]; shopTry = shopTry === it ? null : it; renderShop(); return; }
      const up = e.target.closest('[data-up]'); if(up){ const u = UPG.find(x=>x.k === up.dataset.up), c = u ? UPC[upLv(u.k)] : null; if(c == null) return;
        if(shellBal() < c) return toast(`🐚 조개가 모자라요 — ${c}개 필요 (보유 ${shellBal()}). 미션·출석·게임으로 모아요!`);
        const q = `🐚 ${c}개로 ${u.n} ${upLv(u.k) + 1}단계를 살까요?\n(보유 ${shellBal()}개)`;
        if(!(window.ask ? await ask(q, { ok:'강화' }) : confirm(q))) return;
        if(playUp(u.k)) renderShop(); return; }
      const b = e.target.closest('[data-buy]'); if(b){ const it = SHOP[+b.dataset.buy]; const own = ME.profile.play?.own?.[it.key + ':' + it.v];
        if(own){ ME.profile[it.key] = it.v; saveProfile?.(); toast(`${it.ic} ${it.n} 입었어요`); renderShop(); if(typeof renderBuilder === 'function') renderBuilder(); return; }
        const cost = priceOf(it);
        if(shellBal() < cost) return toast(`🐚 조개가 모자라요 — ${cost}개 필요 (보유 ${shellBal()}). 라인업 서핑·파도 점프·서프스케이트에서 모아요!`);
        if(!(window.ask ? await ask(`🐚 ${cost}개로 ${it.n}을(를) 살까요?\n(보유 ${shellBal()}개)`, { ok:'사기' }) : confirm(`🐚 ${cost}개로 ${it.n}을(를) 살까요?\n(보유 ${shellBal()}개)`))) return;
        if(playBuy(it.key, it.v)){ ME.profile[it.key] = it.v; shopTry = null; saveProfile?.(); renderShop(); if(typeof renderBuilder === 'function') renderBuilder(); } }
    }); }
  sh.hidden = false; renderShop();
}
function renderShop(){
  const body = $('shop-body'); if(!body) return;
  const own = ME.profile.play?.own || {}, deal = dealOf();
  const cats = ['전체', '🔧 강화', '서핑 용품', '소품', '옷', '모자', '머리', '보드', '친구'], list = SHOP.map((it, i)=>({ it, i })).filter(({ it })=>shopCat === '전체' || it.cat === shopCat);
  const base = withLook(ME.profile || {}, ME.name), wear = shopTry ? { ...base, [shopTry.key]:shopTry.v } : base;
  body.innerHTML = `<div class="shop-top"><canvas id="shop-me" data-anim></canvas><div><b>🐚 ${shellBal()}개</b><small>${shopTry ? `👀 <b>${esc(shopTry.ic)} ${esc(shopTry.n)}</b> 입어 보는 중 — 왼쪽이 입은 모습` : '물건 그림을 누르면 내 캐릭터에 입혀 봐요'}</small>
      <small>조개는 🌊 라인업 서핑 · 🏄 파도 점프 · 🛹 서프스케이트에서 모여요</small></div></div>
    <div class="shop-deal">🏷️ 오늘의 할인 <b>${esc(deal.ic)} ${esc(deal.n)}</b> 🐚 <s>${deal.cost}</s> → <b>${priceOf(deal)}</b></div>
    <div class="food-chips" role="group" aria-label="종류">${cats.map(c=>`<button type="button" data-cat="${c}" aria-pressed="${c === shopCat}">${c}</button>`).join('')}</div>
    <div class="shop-grid">${list.map(({ it, i })=>{ const got = own[it.key + ':' + it.v], on = ME.profile[it.key] === it.v, sale = it === deal;
      return `<div class="shop-it${shopTry === it ? ' try' : ''}${got ? ' got' : ''}"><button type="button" class="shop-pv" data-try="${i}" aria-label="${esc(it.n)} 입어 보기">${typeof mochiItem === 'function' ? `<img class="shop-zoom" alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(mochiItem(base, it.key, it.v))}">` : `<canvas data-pv="${i}"></canvas>`}${sale ? '<em>할인</em>' : ''}</button>
        <b>${esc(it.ic)} ${esc(it.n)}</b>
        <button type="button" class="btn sm ${got ? (on ? 'ghost' : 'mint') : 'blue'}" data-buy="${i}" ${got && on ? 'disabled' : ''}>${got ? (on ? '입는 중' : '입기') : `🐚 ${priceOf(it)}${sale ? ` <s>${it.cost}</s>` : ''}`}</button></div>`; }).join('')}</div>`;
  if(shopCat === '🔧 강화'){ const g = body.querySelector('.shop-grid'); if(g) g.outerHTML = upShopHtml(); }
  if(typeof drawSpr === 'function'){
    drawSpr($('shop-me'), avatarRows(wear, shopTry?.key === 'pet'), avatarTintOf(wear, 0));
    body.querySelectorAll('[data-pv]').forEach(c=>{ const it = SHOP[+c.dataset.pv], q = { ...base, [it.key]:it.v }; drawSpr(c, avatarRows(q, it.key === 'pet'), avatarTintOf(q, 0)); });
  }
}
window.shopOpen = shopOpen;

const myLv = () => lvOf(playXp(ME?.profile?.play || { base:0, bonus:0 }));
/* 잠겨 있으면 필요한 레벨(0부터)을, 열려 있으면 null */
const lockOf = (key, v) => { if(key === 'boardc' && v === 'legend') return ME?.profile?.play?.qb?.legend ? null : 98;     // 98 = 원정 보상
  const u = UNLOCKS.find(x=>x.key === key && x.v === v); return u && myLv() < u.lv ? u.lv : null; };

/* 조건은 stats(s)와 저장값(p)만 본다. xp 는 받는 순간 한 번만 더해진다. */
const BADGES = [
  { id:'drill1',  ic:'🏄', n:'첫 테이크오프',  d:'훈련을 처음 체크했어요',            t:s=>s.drillDays >= 1 },
  { id:'log1',    ic:'📒', n:'첫 서핑 일지',   d:'바다에 다녀와 일지를 처음 남겼어요',  t:(s, p)=>(p.log || []).length >= 1 },
  { id:'log10',   ic:'🌊', n:'바다 10번',      d:'서핑 일지를 10번 남겼어요',          t:(s, p)=>(p.log || []).length >= 10, xp:50 },
  { id:'streak3', ic:'🔥', n:'3일 연속',       d:'훈련을 3일 연속으로 했어요',        t:s=>s.bestStreak >= 3 },
  { id:'streak7', ic:'📅', n:'한 주 개근',     d:'훈련을 7일 연속으로 했어요',        t:s=>s.bestStreak >= 7, xp:40 },
  { id:'streak14',ic:'🌟', n:'2주 개근',       d:'훈련을 14일 연속으로 했어요',       t:s=>s.bestStreak >= 14, xp:60 },
  { id:'streak30',ic:'🏆', n:'한 달 개근',     d:'훈련을 30일 연속으로 했어요',       t:s=>s.bestStreak >= 30, xp:100 },
  { id:'drill10', ic:'💪', n:'열 번째 훈련',   d:'훈련을 누적 10일 했어요',           t:s=>s.drillDays >= 10 },
  { id:'drill30', ic:'🦵', n:'서른 번째 훈련', d:'훈련을 누적 30일 했어요',           t:s=>s.drillDays >= 30, xp:50 },
  { id:'bolt1',   ic:'⚡', n:'번개 소집',      d:'서핑번개를 처음 열었어요',           t:s=>s.boltsMade >= 1 },
  { id:'boltgo',   ic:'🔥', n:'번개 대장',        d:'내가 연 번개에 세 명이 모였어요',       t:s=>s.boltsGo >= 1, xp:30 },
  { id:'bolt2',   ic:'🤝', n:'번개 합류',      d:'남이 연 번개에 들어갔어요',         t:s=>s.boltsJoined >= 1 },
  { id:'ride1',   ic:'🚗', n:'카풀 시작',      d:'차량 쉐어를 올리거나 탔어요',       t:s=>s.ridesMade + s.ridesJoined >= 1 },
  { id:'stay1',   ic:'🏠', n:'한 지붕 아래',   d:'숙소 쉐어를 올리거나 함께했어요',   t:s=>s.staysMade + s.staysJoined >= 1 },
  { id:'chat5',   ic:'💬', n:'마을 수다쟁이',  d:'마을에 한마디를 5번 남겼어요',      t:s=>s.chat >= 5 },
  { id:'react10', ic:'👏', n:'응원왕',         d:'동기에게 반응·응원을 10번 보냈어요', t:s=>s.reacts >= 10 },
  { id:'mvp1',    ic:'👑', n:'주간 MVP',       d:'한 주에 훈련 1위(3회 이상)를 했어요', t:s=>s.mvp >= 1, xp:50 },
  { id:'quiz10',  ic:'🧠', n:'코치님 말씀 척척', d:'코치 퀴즈에서 정답을 10개 맞혔어요', t:(s,p)=>(p.qz||0) >= 10 },
  { id:'quiz30',  ic:'🎓', n:'코치님 제자',     d:'코치 퀴즈에서 정답을 30개 맞혔어요', t:(s,p)=>(p.qz||0) >= 30, xp:40 },
  { id:'goal1',    ic:'🤝', n:'함께 채운 한 주',  d:'6기 이번 주 목표를 같이 채웠어요',     t:(s,p)=>(p.goalN||0) >= 1 },
  { id:'goal4',    ic:'🌈', n:'한 달 팀워크',     d:'6기 주간 목표를 4주 채웠어요',         t:(s,p)=>(p.goalN||0) >= 4, xp:50 },
  { id:'daily7',   ic:'📅', n:'7일 챌린저',       d:'오늘의 챌린지에 7일 참여했어요',       t:(s,p)=>(p.dN||0) >= 7, xp:40 },
  { id:'stamp3',   ic:'🗺️', n:'해변 탐험가',      d:'서로 다른 해변 3곳에서 체크인했어요',   t:(s,p)=>Object.keys(p.stamps||{}).length >= 3, xp:20 },
  { id:'stampAll', ic:'🧭', n:'양양 마스터',      d:'모든 해변에서 체크인했어요',            t:(s,p)=>typeof SEAS !== 'undefined' && Object.keys(p.stamps||{}).length >= SEAS.length, xp:80 },
  { id:'secret1',  ic:'🥚', n:'비밀 발견',        d:'SurfShare 제목을 연달아 눌러 숨은 걸 찾았어요', t:(s,p)=>!!p.secret, xp:30 },
  { id:'game1',   ic:'🎮', n:'첫 파도 점프',   d:'파도 점프를 한 판 해봤어요',        t:(s,p)=>(p.best||0) > 0 },
  { id:'game300', ic:'🦈', n:'상어도 피했다',  d:'파도 점프에서 600점을 넘겼어요',    t:(s,p)=>(p.best||0) >= 600, xp:40 },
  { id:'quest5',  ic:'✅', n:'퀘스트 5일',     d:'오늘의 퀘스트를 5일 완료했어요',    t:(s,p)=>(p.qall||0) >= 5, xp:40 },
  { id:'lv5',     ic:'🌊', n:'라인업 입성',    d:'레벨 5에 올랐어요',                 t:(s,p)=>lvOf(p.base + p.bonus) >= 4, xp:0 },
];

/* 사용자가 한 번도 건드리지 않은 페이지의 진동은 브라우저가 막고 경고를 남긴다 — 눌러본 뒤에만 */
const vib = pat => { try{ if(navigator.userActivation?.hasBeenActive) navigator.vibrate?.(pat); }catch(e){} };
/* 글씨 크게 — 화면 전체(본문 열)를 12% 키운다. 이 기기에만 */
const bigOn = () => { try{ return localStorage.getItem('lineup.share.big') === '1'; }catch(e){ return false; } };
function applyBig(){ document.documentElement.classList.toggle('big', bigOn()); }
applyBig();
const playP = () => (ME.profile.play ||= { base:0, bonus:0, badges:{}, qd:{}, qall:0, best:0, gday:'', gxp:0, gn:{}, lvSeen:0 });
const playXp = p => (p.base||0) + (p.bonus||0);
const localDay = iso => { const d = new Date(iso); return new Date(d - d.getTimezoneOffset()*6e4).toISOString().slice(0,10); };

function playStats(){
  const id = ME.id, S = (typeof dSet !== 'undefined' && dSet[id]) || new Set();
  const days = [...S].sort(); let best = 0, run = 0, prev = null;
  days.forEach(d=>{ run = (prev && (new Date(d) - new Date(prev)) === 864e5) ? run + 1 : 1; best = Math.max(best, run); prev = d; });
  const inL = l => (l||[]).some(x=>x.id === id);
  const B = (typeof bolts !== 'undefined' && bolts) || [], R = state.rides || [], T = state.stays || [];
  return { drillDays:S.size, bestStreak:Math.max(best, typeof drillStat === 'function' ? drillStat(id).streak : 0),
    boltsMade:B.filter(b=>b.user_id === id).length, boltsGo:B.filter(b=>b.user_id === id && (b.joins||[]).length >= 3).length, boltsJoined:B.filter(b=>b.user_id !== id && inL(b.joins)).length,
    ridesMade:R.filter(r=>r.user_id === id).length, ridesJoined:R.filter(r=>r.user_id !== id && inL(r.riders)).length,
    staysMade:T.filter(x=>x.user_id === id).length, staysJoined:T.filter(x=>x.user_id !== id && inL(x.guests)).length,
    mvp:(typeof weeklyTop === 'function' ? Object.values(weeklyTop()).filter(a=>a.some(x=>x.id === id)).length : 0),
    chat:(state.chat||[]).filter(m=>m.user_id === id).length, reacts:(state.reacts||[]).filter(r=>r.user_id === id).length };
}
/* 한 번에 쏟아부을 수 있는 건 상한을 둔다 — 수다·반응 도배로 레벨을 사지 못하게 */
const rawXp = s => s.drillDays*10 + s.boltsMade*15 + s.boltsGo*10 + s.boltsJoined*5 + s.ridesMade*15 + s.ridesJoined*5
                 + s.staysMade*15 + s.staysJoined*5 + Math.min(s.chat, 30) + Math.min(s.reacts, 30);

/* 오늘의 퀘스트 — 하루 세 개, 전부 오늘 한 일에서 계산한다 */
function playQuests(p){
  const day = today(), mine = id => id === ME.id;
  const talked = (state.chat||[]).some(m=>mine(m.user_id) && localDay(m.created_at) === day)
              || (state.reacts||[]).some(r=>mine(r.user_id) && r.created_at && localDay(r.created_at) === day);
  return [
    { id:'drill', ic:'🏄', t:'테이크오프 훈련 체크', hint:'홈에서 한 번 누르기', done:!!((typeof dSet !== 'undefined' && dSet[ME.id]) || new Set()).has(day),
      go:()=>{ closePlay(); setTab('home'); setTimeout(()=>$('drill')?.scrollIntoView({ block:'center', behavior:'smooth' }), 80); } },
    { id:'talk',  ic:'💬', t:'마을에 한마디 · 응원',   hint:'채팅을 남기거나 동기에게 반응', done:talked,
      go:()=>{ closePlay(); setTab('town'); } },
    /* 세 번째는 격일로 바뀐다 — 매일 같은 숙제면 둘째 주부터 안 본다 */
    [ { id:'game', ic:'🎮', t:'파도 점프 한 판',   hint:'쉬는 시간에 가볍게', done:(p.gn?.[day] || 0) > 0,
        go:()=>{ closePlay(); gameOpen(); } },
      { id:'cam',  ic:'📹', t:'낙산 캠으로 바다 확인', hint:'오늘 파도 어떤지 보기', done:!!p.vis?.[day]?.cam,
        go:()=>{ closePlay(); setTab('cam'); } },
      { id:'quiz', ic:'🧠', t:'코치님 퀴즈 한 판',   hint:'누가 한 말일까요?', done:!!p.vis?.[day]?.quiz,
        go:()=>{ closePlay(); quizOpen(); } },
    ][Math.floor(Date.parse(day + 'T00:00:00Z') / 864e5) % 3],     // 날짜 문자열로 센다 — Date.now()/864e5 는 UTC 라 오전 9시에 바뀐다
  ];
}

/* 탭 방문을 퀘스트로 쓴다 — 오늘 처음 열었을 때만 기록하고 저장은 하루 한 번 */
function playVisit(k){
  if(!ME?.profile?.play) return;
  const p = playP(), day = today(); const v = (p.vis ||= {});
  if(v[day]?.[k]) return;
  (v[day] ||= {})[k] = 1; Object.keys(v).sort().slice(0, -3).forEach(d=>delete v[d]);
  playPush(); playTick();
}

/* ── 저장 ── 프로필 upsert 는 saveProfile 과 같은 길. 연달아 불려도 요청은 한 번 */
let _pt = 0;
function playPush(){
  try{ localStorage.setItem('lineup.share.me', JSON.stringify(ME)); }catch(e){}
  clearTimeout(_pt);
  _pt = setTimeout(async ()=>{ try{ await api('surfers', { method:'POST', body:JSON.stringify({
    id:ME.id, name:ME.name, cohort:ME.cohort || 'open', profile:pubSelf() }) }); }catch(e){} }, 1200);
}

/* 다른 기기에서 쌓은 것을 덮어쓰지 않는다 — 숫자는 큰 쪽, 배지는 합집합 */
function playMerge(remote){
  if(!remote || !ME?.profile) return;
  const p = playP(); let ch = false;
  Object.keys(remote.stamps||{}).forEach(k=>{ const s = (p.stamps ||= {}); if(!s[k]){ s[k] = remote.stamps[k]; ch = true; } });
  ['base','bonus','best','bat','hbest','hbat','sbest','sbat','sebest','qall','qz','goalN','dN','shells','spent'].forEach(k=>{ const v = _num(remote[k], 1e9); if(v > (p[k]||0)){ p[k] = v; ch = true; } });      // 남의 기기 값도 숫자로 가둔다(글자·무한대 차단)
  if(metaMerge(p, remote)) ch = true;
  Object.keys(remote.own||{}).forEach(k=>{ const o = (p.own ||= {}); if(!o[k]){ o[k] = 1; ch = true; } });
  /* 서핑 일지 — id 로 합치고, 어느 기기에서든 지운 건 지운 채로 */
  if(Array.isArray(remote.log) || remote.logdel){ const del = { ...(remote.logdel || {}), ...(p.logdel || {}) }; p.logdel = Object.fromEntries(Object.keys(del).slice(-200).map(k=>[k, 1]));
    const ids = new Set((p.log || []).map(x=>x && x.id)); (remote.log || []).forEach(x=>{ if(x && x.id && !ids.has(x.id) && !del[x.id]){ (p.log ||= []).push(x); ch = true; } });
    if(p.log) p.log = p.log.filter(x=>x && !del[x.id]).slice(-120); }
  Object.keys(remote.logx||{}).forEach(k=>{ const o = (p.logx ||= {}); if(!o[k]){ o[k] = 1; } });
  Object.keys(remote.badges||{}).forEach(k=>{ if(!p.badges[k]){ p.badges[k] = remote.badges[k]; ch = true; } });
  Object.keys(remote.qd||{}).forEach(d=>{ if(!p.qd[d]){ p.qd[d] = remote.qd[d]; ch = true; }
    else Object.keys(remote.qd[d]).forEach(q=>{ if(!p.qd[d][q]){ p.qd[d][q] = 1; ch = true; } }); });
  Object.keys(remote.gn||{}).forEach(d=>{ if((remote.gn[d]||0) > (p.gn[d]||0)){ p.gn[d] = remote.gn[d]; ch = true; } });
  Object.keys(remote.vis||{}).forEach(d=>{ (p.vis ||= {})[d] = { ...(remote.vis[d]||{}), ...(p.vis[d]||{}) }; });
  if(remote.dbest && remote.dbest.day && (!p.dbest || remote.dbest.day > p.dbest.day || (remote.dbest.day === p.dbest.day && remote.dbest.score > p.dbest.score))){ p.dbest = remote.dbest; ch = true; }
  if(remote.qb && typeof remote.qb === 'object'){ const q = (p.qb ||= { best:-1, clears:0 }); if((remote.qb.best ?? -1) > (q.best ?? -1)){ q.best = remote.qb.best; ch = true; } if((remote.qb.clears || 0) > (q.clears || 0)){ q.clears = remote.qb.clears; ch = true; } if(remote.qb.legend && !q.legend){ q.legend = 1; ch = true; } const rc = _num(remote.qb.ch, 11); if(rc > _num(q.ch, 11)){ q.ch = rc; ch = true; } }
  if(remote.df && typeof remote.df === 'object'){ const d = (p.df ||= { best:0, clears:0 }), rb = _num(remote.df.best, 15), rc = _num(remote.df.clears, 9999), rh = _num(remote.df.hd, 3); if(rb > _num(d.best, 15)){ d.best = rb; ch = true; } if(rc > _num(d.clears, 9999)){ d.clears = rc; ch = true; } if(rh > _num(d.hd, 3)){ d.hd = rh; ch = true; }
    for(const [k, mx] of [['st', 3], ['sb', 15]]) if(Array.isArray(remote.df[k])){ const a = Array.isArray(d[k]) ? d[k] : (d[k] = [0, 0, 0]); for(let i = 0; i < 3; i++){ const v = _num(remote.df[k][i], mx); if(v > _num(a[i], mx)){ a[i] = v; ch = true; } } } }   // 해변별 별·최고 라운드 — 칸마다 큰 값
  if(remote.sk && typeof remote.sk === 'object'){ const sk = (p.sk ||= { best:{}, real:{}, n:0 }); sk.best ||= {}; sk.real ||= {};
    Object.keys(remote.sk.best || {}).forEach(k=>{ if((remote.sk.best[k] || 0) > (sk.best[k] || 0)){ sk.best[k] = remote.sk.best[k]; ch = true; } });
    Object.keys(remote.sk.real || {}).forEach(d=>{ if(!sk.real[d]){ sk.real[d] = 1; ch = true; } });
    if((remote.sk.n || 0) > (sk.n || 0)){ sk.n = remote.sk.n; ch = true; } }
  if(remote.dcday && remote.dcday > (p.dcday || '')){ p.dcday = remote.dcday; ch = true; }
  if(remote.goalWk && remote.goalWk > (p.goalWk || '')){ p.goalWk = remote.goalWk; ch = true; }
  if(remote.gday === p.gday && (remote.gxp||0) > (p.gxp||0)){ p.gxp = remote.gxp; ch = true; }
  if(ch){ p.lvSeen = Math.max(p.lvSeen||0, lvOf(playXp(p))); playPush(); renderPlayBits(); }
}
async function playSync(){
  try{ const r = await api(`surfers?id=eq.${encodeURIComponent(ME.id)}&select=profile`); playMerge(r?.[0]?.profile?.play); }catch(e){}
}

/* ── 계산 ──
   처음 계산은 훈련·번개·차량·숙소 기록이 다 도착한 뒤에 한다. 반쯤 온 데이터로 초기화하면
   나머지가 도착하는 순간 과거 업적 알림이 한꺼번에 쏟아진다. 8초가 지나면 있는 대로 간다. */
const playLoaded = {};
const playMark = k => { playLoaded[k] = true; playTick(); };
const playReady = () => ['drill','rides','stays','bolts'].every(k=>playLoaded[k]) || playReady.force || (Date.now() - (playReady.t0 ||= Date.now())) > 8000;
let _popQ = [], _popBusy = false;
function playTick(){
  if(!ME || !ME.profile || typeof state === 'undefined') return;
  const first = !ME.profile.play;
  if(first && !playReady()) return;
  const p = playP(), s = playStats();
  let ch = first;
  const raw = rawXp(s); if(raw > p.base){ p.base = raw; ch = true; }
  const fresh = [];
  BADGES.forEach(b=>{ if(!p.badges[b.id] && b.t(s, p)){ p.badges[b.id] = Date.now(); p.bonus += (b.xp ?? 20); fresh.push(b); ch = true; } });
  /* 퀘스트 보상은 하루에 한 번씩만 — 저장값(qd)으로 막는다 */
  const day = today(), qs = playQuests(p), done = (p.qd[day] ||= {});
  let allNow = false;
  qs.forEach(q=>{ if(q.done && !done[q.id]){ done[q.id] = 1; p.bonus += 5; ch = true; } });
  if(qs.every(q=>q.done) && !done.all){ done.all = 1; p.bonus += 20; p.qall = (p.qall||0) + 1; allNow = true; ch = true; }
  Object.keys(p.qd).sort().slice(0, -14).forEach(d=>delete p.qd[d]);      // 2주 지난 기록은 버린다(qall 이 누적을 들고 있다)
  const xp = playXp(p), lv = lvOf(xp);
  if(p.xp !== xp || p.lv !== lv){ p.xp = xp; p.lv = lv; ch = true; }
  if(_xpShown != null && xp > _xpShown && !first) xpFloat(xp - _xpShown);
  _xpShown = xp;
  /* 이미 쓰던 사람에게 한 번만 알린다. 방금 시작한 사람은 환영 카드가 있으니 건너뛰고 본 걸로 친다. */
  const NEWS = 'play7';       // 버전 문자열 — 새 놀이가 생기면 올린다. 이전 소식을 본 사람에게도 한 번 더 뜬다
  let newsSeen = false; try{ newsSeen = localStorage.getItem('lineup.share.news') === NEWS; }catch(e){ newsSeen = true; }
  if(!newsSeen){ try{ localStorage.setItem('lineup.share.news', NEWS); }catch(e){}
    if(!first){ const u = (window.UPDATES || [])[0];
      _popQ.push({ ic:'🆕', t:u ? `업데이트 · ${u.t}` : '새로 생겼어요', d:u ? u.items.map(x=>`${x[0]} ${x[1].split(' — ')[0]}`).join('\n') : '놀이 탭에 새 게임이 생겼어요',
        go:()=>window.updOpen ? updOpen() : setTab('play'), btn:'자세히 보기', ok:'다시 보지 않기',
        onOk:()=>{ try{ if(u){ localStorage.setItem('lineup.share.updhide', u.id); localStorage.setItem('lineup.share.upd', u.id); } }catch(e){} window.updCard?.(); } }); }
  }
  /* 방금 가입한 사람은 배지가 없다 — 온보딩이 도감을 소개하니 빈 환영 카드는 생략한다. 기록이 있는 사람에게만 '지금까지'를 보여준다. */
  if(first){ p.lvSeen = lv; if(Object.keys(p.badges).length) _popQ.push({ ic:'📖', t:'서퍼 도감이 열렸어요', d:`지금까지 배지 ${Object.keys(p.badges).length}개 · Lv.${lv+1} ${PLV[lv][1]}`, welcome:true }); }
  else{
    if(allNow) _popQ.push({ ic:'🎉', t:'오늘의 퀘스트 완료!', d:'세 가지를 모두 해냈어요  +20 XP' });
    fresh.forEach(b=>_popQ.push({ ic:b.ic, t:`새 배지 · ${b.n}`, d:b.d }));
    if(lv > (p.lvSeen||0)){
      const opened = UNLOCKS.filter(u=>u.lv > (p.lvSeen||0) && u.lv <= lv);
      _popQ.push({ ic:PLV[lv][2], t:`레벨 업! Lv.${lv+1} ${PLV[lv][1]}`,
        d: opened.length ? `새 아이템이 열렸어요: ${opened.map(u=>u.ic + ' ' + u.n).join(', ')}\n내 캐릭터 꾸미기에서 써보세요` : '바다에서 한 걸음 더 나아갔어요', up:true }); }
  }
  p.lvSeen = Math.max(p.lvSeen||0, lv);
  if(ch) playPush();
  renderPlayBits(); popNext();
}

/* 게임이 끝났을 때 — 하루 XP 상한을 둔다(게임만 해서 레벨을 올리지 못하게). 상한은 저장값(gxp)으로 막는다 */
function playGameDone(score, isDaily, shells, hard){
  if(!ME.profile.play){ playReady.force = true; playTick(); }
  const p = playP(), day = today();
  p.gn[day] = (p.gn[day] || 0) + 1;
  const bk = hard ? 'hbest' : 'best', newBest = score > (p[bk] || 0); if(newBest){ p[bk] = score; p[hard ? 'hbat' : 'bat'] = Date.now(); }       // 쉬움·어려움 기록은 따로       // bat = 최고기록 시각 — 상단 소식줄이 '방금 돌파'를 보여준다
  const sh = _num(shells, 500), bx = x2('jump', sh); p.shells = (p.shells || 0) + sh + bx;          // 이번 판에 모은 조개는 지갑에 — 오늘 첫 판은 ×2
  dmNote('j', score); wkNote('j', score);
  if(p.gday !== day){ p.gday = day; p.gxp = 0; }
  const gain = Math.max(0, Math.min(Math.floor(score / 30), 15 - p.gxp));
  p.gxp += gain; p.bonus += gain;
  /* 오늘의 챌린지 — 그날 최고점만 남기고(다른 날 값은 덮어쓴다), 그날 처음 참여하면 +5 XP. 연속 참여일이 아니라 '참여한 날 수'를 센다. */
  let dGain = 0;
  if(isDaily){
    if(!p.dbest || p.dbest.day !== day) p.dbest = { day, score:0 };
    if(score > p.dbest.score) p.dbest.score = score;
    if(p.dcday !== day){ p.dcday = day; p.dN = (p.dN || 0) + 1; p.bonus += 5; dGain = 5; }
  }
  playTick(); playPush();
  return { gain:gain + dGain, newBest, best:p[bk], daily:!!isDaily, shells:sh + bx, x2:bx, bal:shellBal() };
}

/* 라인업 서핑이 끝났을 때 — 최고점(sbest)과 그 시각(sbat). XP 는 파도 점프와 같은 하루 상한(gxp)을 나눠 쓴다 */
function playSurfDone(score, bestRide, hard){
  if(!ME.profile.play){ playReady.force = true; playTick(); }
  const p = playP(), day = today();
  const sc = _num(score, 1000000), bk = hard ? 'sbest' : 'sebest', newBest = sc > (p[bk] || 0);
  if(newBest){ p[bk] = sc; if(hard) p.sbat = Date.now(); }
  p.sn = (p.sn || 0) + 1;
  const s0 = Math.min(30, Math.floor(sc / 40)), bx = x2('surf', s0), shells = s0 + bx; p.shells = (p.shells || 0) + shells;
  dmNote('r', sc); wkNote('r', sc);           // 조개 — 상점에서 옷을 산다
  if(p.gday !== day){ p.gday = day; p.gxp = 0; }
  const gain = Math.max(0, Math.min(Math.floor(sc / 60), 15 - p.gxp));
  p.gxp += gain; p.bonus += gain;
  playTick(); playPush();
  return { gain, newBest, best:p[bk], shells, x2:bx, bal:shellBal() };
}

/* 서프스케이트 훈련 — 드릴별 최고 정확도(sk.best), XP 는 하루 상한(gxp) 공유. 실제로 탔다는 체크는 하루 1번 +5 */
function playSkateDone(kind, accP){
  if(!ME.profile.play){ playReady.force = true; playTick(); }
  const p = playP(), day = today(), sk = (p.sk ||= { best:{}, real:{}, n:0 });
  const a = _num(accP, 100); sk.best ||= {}; sk.best[kind] = Math.max(sk.best[kind] || 0, a); sk.n = (sk.n || 0) + 1;
  const s0 = (a >= 80 ? 5 : a >= 60 ? 3 : 1) + upLv('s_mul'), bx = x2('skate', s0), shells = s0 + bx; p.shells = (p.shells || 0) + shells;
  { const m = dmOf(p); m.sk = _num(m.sk, 999) + 1; }
  if(p.gday !== day){ p.gday = day; p.gxp = 0; }
  const gain = Math.max(0, Math.min(Math.floor(a / 25), 15 - p.gxp)); p.gxp += gain; p.bonus += gain;
  playTick(); playPush();
  return { gain, best:sk.best[kind], real:!!(sk.real || {})[day], shells, x2:bx };
}
function playSkateReal(){
  const p = playP(), day = today(), sk = (p.sk ||= { best:{}, real:{}, n:0 }); sk.real ||= {};
  if(sk.real[day]) return false;
  sk.real[day] = 1; p.bonus += 5;
  const keys = Object.keys(sk.real).sort(); if(keys.length > 60) delete sk.real[keys[0]];               // 프로필이 끝없이 커지지 않게
  playTick(); playPush(); return true;
}

/* 전설의 보드 원정 — 가장 멀리 간 장(best, 0부터)·모은 봉인 조각(ch, 깬 장 수)·완주 횟수·전설의 보드.
   cleared 는 그 장을 깼는지 — 조각은 순서대로만 늘어난다(앞 장을 건너뛰고 뒷장 조각이 생기지 않게). 조개는 지갑에, XP 는 하루 상한 공유 */
function playQuestDone(stage, win, shells, cleared){
  if(!ME.profile.play){ playReady.force = true; playTick(); }
  const p = playP(), day = today(), q = (p.qb ||= { best:-1, clears:0 });
  const st = _num(stage, 20); if(st > (q.best ?? -1)) q.best = st;
  if(cleared && st === _num(q.ch, 11)) q.ch = Math.min(11, st + 1);
  if(win){ q.clears = (q.clears || 0) + 1; if(!q.legend){ q.legend = 1; _popQ.push({ ic:'🏄', t:'전설의 보드를 찾았어요!', d:'캐릭터 꾸미기 → 보드 색 「전설」이 열렸어요', up:true }); } }
  const sh = _num(shells, 300), bx = x2('quest', sh); p.shells = (p.shells || 0) + sh + bx;
  if(cleared){ dmNote('q', 1); wkNote('q', st + 1); }
  if(p.gday !== day){ p.gday = day; p.gxp = 0; }
  const gain = Math.max(0, Math.min(st + (win ? 5 : 0), 15 - p.gxp)); p.gxp += gain; p.bonus += gain;
  playTick(); playPush();
  return { best:q.best, gain, shells:sh + bx, x2:bx };
}

/* 해변 수호가 끝났을 때 — 최고 라운드·성공 횟수·연 해변(hd)·해변별 별(st)·최고 라운드(sb)와 조개.
   해변을 처음 지키면 첫 클리어 보너스(🐚20·30·40, ×2 없음). XP 는 다른 게임과 같은 하루 상한(gxp) 안에서만 */
function playDefendDone(wave, win, shells, stage, stars){
  if(!ME.profile.play){ playReady.force = true; playTick(); }
  const p = playP(), day = today(), d = (p.df ||= { best:0, clears:0 }), g = _num(stage, 2);
  const st = Array.isArray(d.st) ? d.st : (d.st = [0, 0, 0]), sb = Array.isArray(d.sb) ? d.sb : (d.sb = [0, 0, 0]);
  const w = _num(wave, 15); if(w > _num(d.best, 15)) d.best = w; if(w > _num(sb[g], 15)) sb[g] = w;
  let first = 0;
  if(win){ d.clears = _num(d.clears, 9999) + 1; if(g + 1 > _num(d.hd, 3)) d.hd = g + 1;
    if(!_num(st[g], 3)) first = [20, 30, 40][g]; const s = _num(stars, 3); if(s > _num(st[g], 3)) st[g] = s; }
  const sh = _num(shells, 60), bx = x2('defend', sh); p.shells = (p.shells || 0) + sh + bx + first;
  dmNote('df', w); wkNote('d', w);
  if(p.gday !== day){ p.gday = day; p.gxp = 0; }
  const gain = Math.max(0, Math.min(Math.ceil(w / 2) + (win ? 4 : 0), 15 - p.gxp)); p.gxp += gain; p.bonus += gain;
  playTick(); playPush();
  return { best:d.best, gain, shells:sh + bx, x2:bx, first };
}

/* 6기 전체 주간 목표를 채웠을 때 — 보는 사람이 그 주에 한 번이라도 훈련했어야 받는다(구경만 하고 받아가지 않게).
   주(월요일 시작)마다 한 번만. 렌더 때마다 불리므로 저장값(goalWk)으로 막는다. */
function playGoal(sum, goal, myWeek){
  if(!ME?.profile?.play || sum < goal || myWeek < 1) return;
  const wk = weekKey(dayOf(0)), p = playP();
  if(p.goalWk === wk) return;
  p.goalWk = wk; p.goalN = (p.goalN || 0) + 1; p.bonus += 10;
  _popQ.push({ ic:'🎉', t:'6기 이번 주 목표 달성!', d:'다 같이 채웠어요\n+10 XP', up:true });
  playPush(); playTick();
}

/* 해변 스탬프 — 그 해변에서 체크인하면 한 번 찍힌다. 앱 안의 점수가 아니라 실제로 간 곳을 모으게 한다.
   해변 이름은 SEAS 목록에 있는 것만 받는다. */
function playStamp(beach){
  if(!ME?.profile?.play || typeof SEAS === 'undefined' || !SEAS.some(s=>s[0] === beach)) return;
  const p = playP(); const st = (p.stamps ||= {});
  if(st[beach]) return;
  st[beach] = today(); p.bonus += 5;
  _popQ.push({ ic:'📍', t:`새 스탬프 · ${beach}`, d:`해변 스탬프 ${Object.keys(st).length}/${SEAS.length}\n+5 XP` });
  playPush(); playTick();
}

/* XP 가 오르는 순간 화면 위에 +N 이 떠서, 무엇을 했더니 점수가 됐는지 바로 보인다. 연달아 오르면 합쳐서 한 번에. */
let _xpShown = null, _xpFx = 0, _xpSum = 0, _xpT = 0;
function xpFloat(d){
  const el = $('xpfx'); if(!el || d <= 0) return;
  _xpSum = (Date.now() - _xpFx < 1400 ? _xpSum : 0) + d; _xpFx = Date.now();
  el.textContent = `+${_xpSum} XP`; el.hidden = false; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
  clearTimeout(_xpT); _xpT = setTimeout(()=>{ el.hidden = true; }, 1800);
}

/* 오늘의 서핑 운세 — 사람(아이디)과 날짜로 정해지니 하루 종일 같고 내일이면 바뀐다. 컨디션은 3~5별만 나온다(안 좋은 운세는 재미가 없다).
   여는 건 하루 한 번 +3 XP. 재료는 앱 안에 있는 것(해변·보드 색·코치님 말씀)이라 새 데이터가 없다. */
const _fh = s => { let h = 2166136261; for(const c of String(s)){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
function fortune(){
  const h = _fh(ME.id + '|' + today()), pick = (arr, k) => arr[(h >>> k) % arr.length];
  const colors = Object.entries(BOARDC_KO || {}).map(x=>x[1]);
  const v = (typeof VOICES !== 'undefined' && VOICES.length) ? VOICES[(h >>> 11) % VOICES.length] : null;
  return { star:3 + (h % 3), beach:pick(SEAS.map(s=>s[0]), 3), time:pick(['오전 6시','오전 7시','오전 9시','오후 1시','오후 4시','오후 5시'], 7),
           color:pick(colors, 5), n:1 + ((h >>> 9) % 9), voice:v };
}
function playFortune(){
  _hubFort = true;
  const p = playP(), day = today();
  if(p.fortDay !== day){ p.fortDay = day; p.bonus += 3; playPush(); playTick(); }
  renderPlay();
}

/* 숨은 보너스 — 제목을 3초 안에 7번. 알려주지 않는다. 한 번만 받는다. */
function playSecret(){
  if(!ME?.profile?.play) return;
  const p = playP(); if(p.secret) return toast('🥚 이미 찾았어요!');
  p.secret = 1; if(typeof burst === 'function') burst($('title-egg') || document.body, 24); vib([20, 30, 20, 30, 60]);
  playPush(); playTick();
}
(function eggWire(){
  const arm = ()=>{ const h = document.querySelector('.wrap h1'); if(!h || h._egg) return; h._egg = 1; h.id = h.id || 'title-egg'; let n = 0, t0 = 0;
    h.addEventListener('click', ()=>{ const now = Date.now(); if(now - t0 > 3000){ n = 0; t0 = now; } if(++n >= 7){ n = 0; playSecret(); } }); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm); else arm();
})();

/* ── 알림 카드 ── 한꺼번에 여러 개가 걸려도 한 장씩 */
function popNext(){
  if(_popBusy || !_popQ.length || !$('pop')) return;
  /* 다른 시트가 열려 있거나 게임 중이면 기다린다 — 게임 도중에 카드가 덮으면 죽는다 */
  if(window._gameRun || ($('game') && !$('game').hidden)) return;
  if($('onb') && !$('onb').hidden) return;                    // 온보딩 중에는 미룬다 — onbEnd 가 다시 부른다
  const c = _popQ.shift(); _popBusy = true;
  $('pop-ic').textContent = c.ic; $('pop-t').textContent = c.t; $('pop-d').textContent = c.d;
  const go = $('pop-go'); go.hidden = !c.go; _popGo = c.go || null; if(c.go) go.textContent = c.btn || '보러가기';
  $('pop-ok').textContent = c.ok || '좋아요'; _popOk = c.onOk || null;                    // 업데이트 알림은 '다시 보지 않기'
  $('pop').hidden = false; $('pop-ok').focus({ preventScroll:true });
  vib(c.up ? [30,50,30,50,60] : [20,40,20]);
  if(typeof burst === 'function') burst($('pop-ic'), c.up ? 22 : 12);
}
let _popGo = null, _popOk = null;
function popOk(){ const f = _popOk; _popOk = null; popClose(); if(f) f(); }
function popGo(){ const f = _popGo; popClose(); if(f) setTimeout(f, 260); }
function popClose(){ $('pop').hidden = true; _popBusy = false; setTimeout(popNext, 220); }

/* ── 화면 조각 ── 홈 프로필 줄의 레벨 막대, 퀘스트 띠 */
/* ── 놀이 메뉴(허브) ─────────────────────────────────────────────
   게임·퀴즈·운세·스탬프·도감·순위·상점이 도감 시트 안에 묻혀 있어서 찾기 어려웠다. 탭 하나로 모아 한눈에 보이게 한다.
   카드는 '지금 할 수 있는 것'을 먼저 말한다(오늘 안 했으면 +XP 표시). 새로 그리는 건 탭에 들어올 때만 연출한다. */
let _hubFort = false;
const hapticOn = () => { try{ return localStorage.getItem('lineup.share.haptic') !== '0'; }catch(e){ return true; } };
const soundOn = () => { try{ return localStorage.getItem('lineup.share.snd') === '1'; }catch(e){ return false; } };
/* 오늘의 챌린지 순위 — 남의 값은 peerPlay 로 걸러서 읽는다(날짜 형식·점수 범위 검증됨) */
function dailyTop(){
  const day = today(), rows = (state.town||[]).filter(x=>x.id !== ME.id).map(x=>{ const d = peerPlay(x.profile?.play)?.dbest; return d && d.day === day ? { id:x.id, name:x.name, s:d.score } : null; }).filter(Boolean);
  const mine = ME.profile.play?.dbest; if(mine && mine.day === day) rows.push({ id:ME.id, name:ME.name, s:mine.score });
  return rows.sort((a,b)=>b.s - a.s).slice(0, 3);
}
function renderHub(enter){
  const root = $('play-hub'); if(!root || !ME?.profile?.play) return;
  const p = ME.profile.play, xp = playXp(p), lv = lvOf(xp), cur = PLV[lv][0], nxt = PLV[lv+1];
  const pct = nxt ? Math.max(4, Math.round((xp - cur) / (nxt[0] - cur) * 100)) : 100;
  const qs = playQuests(p), done = qs.filter(q=>q.done).length, day = today();
  const stk = (typeof drillStat === 'function') ? drillStat(ME.id).streak : 0;
  const got = Object.keys(p.badges).length, st = Object.keys(p.stamps||{}).length;
  const fortOpen = p.fortDay === day, dsc = (p.dbest && p.dbest.day === day) ? p.dbest.score : null;
  const quizDone = !!p.vis?.[day]?.quiz;
  // 내 순위(레벨) — 명단이 아직 없으면 생략
  const peers = (state.town||[]).filter(x=>x.id !== ME.id).map(x=>peerPlay(x.profile?.play)?.xp || 0);
  const myRank = peers.length ? 1 + peers.filter(v=>v > xp).length : 0;
  const card = (i, ic, t, sub, tag, id)=>`<button type="button" class="hubcard" data-hub="${id}" style="--i:${i}"><span class="hc-ic">${ic}</span><b>${t}</b><small>${sub}</small>${tag ? `<em>${tag}</em>` : ''}</button>`;
  root.classList.toggle('enter', !!enter);
  { const d = $('play-dot'); if(d) d.hidden = true; }                 // 놀이 탭에 있으면 점은 필요 없다
  root.innerHTML = `
    <div class="hubhero">
      <button type="button" class="hh-em hh-av" data-hub="me" aria-label="내 캐릭터 꾸미기"><canvas id="hh-av"></canvas><i>${PLV[lv][2]}</i></button>
      <div class="hh-t"><b>Lv.${lv+1} ${PLV[lv][1]}</b><span><i class="cu" data-to="${xp}">${enter ? 0 : xp}</i> XP${nxt ? ` · 다음 ${nxt[1]}까지 ${nxt[0] - xp}` : ' · 최고 레벨'}</span></div>
      <div class="hh-chips"><span>${stk ? `🔥 ${stk}일` : '🔥 —'}</span><span>🐚 ${shellBal()}</span><span>🏅 ${got}/${BADGES.length}</span></div>
      <div class="xpbar big" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${enter ? 0 : pct}%" data-w="${pct}"></i></div>
    </div>
    <div class="pt" style="margin-top:16px">놀이 메뉴</div>
    <div class="hubgrid">
      ${card(0,'🏄','파도 점프', `메인 게임 · 쉬움 ${p.best || 0} · 어려움 ${p.hbest || 0} · 📅 오늘 ${dsc != null ? dsc : '도전 전'}`, dsc == null ? '챌린지' : '', 'game').replace('class="hubcard"', 'class="hubcard wide main"')}
      ${card(0,'🗺️','전설의 보드 원정', p.qb ? `봉인 조각 ${_num(p.qb.ch, 11)}/11${p.qb.clears ? ` · 완주 ${p.qb.clears}` : ''}` : '강원 해안 11마을 이야기', p.qb && p.qb.ch != null ? '' : 'NEW', 'quest')}
      ${card(0,'🛡️','해변 수호', p.df ? `⭐ ${(Array.isArray(p.df.st) ? p.df.st : []).slice(0, 3).reduce((a, v) => a + _num(v, 3), 0)}/9 · 최고 ${_num(p.df.best, 15)}/15 라운드` : '해변 3곳 · 레벨 업 기술', p.df ? '' : 'NEW', 'defend')}
      ${card(0,'🛹','서프스케이트', `땅에서 펌핑 · ${Object.keys(p.sk?.real || {}).length}일 탐`, (p.sk?.n || 0) ? '' : 'NEW', 'skate')}
      ${card(1,'🧠','코치 퀴즈', `누적 정답 ${p.qz || 0}개`, quizDone ? '' : '+XP', 'quiz')}
      ${card(2,'🔮','오늘의 운세', fortOpen ? '컨디션 ' + '★'.repeat(fortune().star) : '열면 +3 XP', fortOpen ? '' : 'NEW', 'fort')}
      ${card(3,'📍','해변 스탬프', `${st}/${SEAS.length} 곳`, '', 'stamp')}
      ${card(4,'🎒','배지 도감', `${got}/${BADGES.length}개`, '', 'badge')}
      ${card(5,'🏆','동기 순위', myRank ? `레벨 ${myRank}위` : '순위 보기', '', 'rank')}
      ${card(7,'🏘','마을 · 채팅', '캐릭터들이 모인 곳 · 한마디', '', 'town')}
      ${card(6,'🛍️','소품샵', `🐚 ${shellBal()} 보유`, '', 'shop')}
      ${(()=>{ const n = UPG.reduce((a, u)=>a + upLv(u.k), 0), mx = UPG.reduce((a, u)=>a + u.max, 0), c = Math.min(...UPG.filter(u=>upLv(u.k) < u.max).map(u=>UPC[upLv(u.k)]));
        return card(6,'🔧','강화소', `${n}/${mx}단계${Number.isFinite(c) ? ` · 다음 🐚${c}` : ' · 모두 완료'}`, Number.isFinite(c) && shellBal() >= c ? '강화 가능' : '', 'up'); })()}
      ${card(8,'🌊','라인업 서핑', `쉬움 ${p.sebest || 0} · 어려움 ${p.sbest || 0}`, '', 'surf')}
    </div>
    <div class="pt" style="margin-top:18px">오늘의 퀘스트 <small>${done}/${qs.length}${done === qs.length ? ' · 모두 완료 🎉' : ' · 모두 하면 +20 XP'}</small></div>
    ${qs.map((q,i)=>`<button type="button" class="pq${q.done?' done':''}" data-hq="${i}"><i>${q.done ? '✔' : q.ic}</i><span>${q.t}<small>${q.done ? '완료 · +5 XP' : q.hint}</small></span><b>${q.done ? '' : '›'}</b></button>`).join('')}
    ${metaHub(p)}
    <div class="pt" style="margin-top:18px">설정 · 공유</div>
    <div class="hubset">
      <button type="button" data-set="haptic" aria-pressed="${hapticOn()}"><span>📳 진동</span><b>${hapticOn() ? '켜짐' : '꺼짐'}</b></button>
      <button type="button" data-set="sound" aria-pressed="${soundOn()}"><span>🔊 게임 소리</span><b>${soundOn() ? '켜짐' : '꺼짐'}</b></button>
      <button type="button" data-set="big" aria-pressed="${bigOn()}"><span>🔠 글씨 크게</span><b>${bigOn() ? '켜짐' : '꺼짐'}</b></button>
      <button type="button" data-set="a2hs"><span>📲 홈 화면에 추가</span><b>방법</b></button>
      <button type="button" data-set="guide"><span>📖 사용 가이드</span><b>열기</b></button>
      <button type="button" data-set="share"><span>🔗 친구에게 앱 알리기</span><b>공유</b></button>
    </div>
    ${(()=>{ const top = dailyTop(); return top.length ? `<div class="dtop"><h4>📅 오늘의 챌린지 TOP ${top.length}</h4>${top.map((r,i)=>`<div class="${r.id===ME.id?'me':''}"><span>${['🥇','🥈','🥉'][i]} ${esc(r.name)}</span><b>${r.s}점</b></div>`).join('')}</div>` : ''; })()}
    ${_hubFort && fortOpen ? (()=>{ const f = fortune(); return `<div class="fort" style="margin-top:12px"><div class="fs">서핑 컨디션 <b>${'★'.repeat(f.star)}${'☆'.repeat(5 - f.star)}</b></div>
      <div>🌊 행운의 해변 <b>${esc(f.beach)}</b></div><div>⏰ 행운의 시간 <b>${f.time}</b></div><div>🎨 행운의 보드 색 <b>${esc(f.color)}</b></div><div>🐚 행운의 조개 <b>${f.n}개</b></div>
      ${f.voice ? `<div class="fv">“${esc(f.voice[0])}”<small>— ${esc(f.voice[1])}</small></div>` : ''}</div>`; })() : ''}`;
  /* 들어올 때 XP 숫자가 0 에서 올라온다 — 막대가 차오르는 것과 같은 박자(0.7초) */
  if(enter && !matchMedia('(prefers-reduced-motion: reduce)').matches){ const el = root.querySelector('.cu'); if(el){ const to = +el.dataset.to, t0 = performance.now();
    const tick = now=>{ const k = Math.min(1, (now - t0) / 700); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if(k < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); } }
  else if(enter){ const el = root.querySelector('.cu'); if(el) el.textContent = el.dataset.to; }
  if(enter) requestAnimationFrame(()=>requestAnimationFrame(()=>{ const i = root.querySelector('.xpbar i'); if(i) i.style.width = i.dataset.w + '%'; }));   // 막대가 0 에서 차오른다
  root.querySelectorAll('[data-set]').forEach(b=>b.onclick = async ()=>{ const k = b.dataset.set;
    if(k === 'haptic'){ const on = !hapticOn(); try{ localStorage.setItem('lineup.share.haptic', on ? '1' : '0'); }catch(e){} if(on) navigator.vibrate?.(15); renderHub(); toast(on ? '진동을 켰어요' : '진동을 껐어요'); }
    else if(k === 'big'){ const on = !bigOn(); try{ localStorage.setItem('lineup.share.big', on ? '1' : '0'); }catch(e){} applyBig(); renderHub(); toast(on ? '글씨를 크게 했어요' : '글씨를 원래대로 했어요'); }
    else if(k === 'sound'){ const on = !soundOn(); try{ localStorage.setItem('lineup.share.snd', on ? '1' : '0'); }catch(e){} renderHub(); toast(on ? '게임 소리를 켰어요' : '게임 소리를 껐어요'); }
    else if(k === 'guide'){ open('/guide', '_blank', 'noopener'); }
    else if(k === 'a2hs'){ if(typeof a2hsOpen === 'function') a2hsOpen(); }
    else if(k === 'share'){ const data = { title:'SurfShare', text:'양양 낙산 서핑 — 차 같이 타고, 숙소 같이 쓰고. 비밀번호는 단톡방에서 받아요.', url:'https://surf.owenai.xyz/' };
      try{ if(navigator.share) await navigator.share(data); else{ await navigator.clipboard.writeText(data.url); toast('링크를 복사했어요'); } }catch(e){ if(e && e.name !== 'AbortError') toast('공유하지 못했어요'); } } });
  { const hc = root.querySelector('#hh-av'); if(hc && typeof drawSpr === 'function'){ const q = withLook(ME.profile || {}, ME.name); requestAnimationFrame(()=>drawSpr(hc, avatarRows(q, false), avatarTintOf(q, 0))); } }
  root.querySelectorAll('[data-hq]').forEach(b=>b.onclick = ()=>{ const q = qs[+b.dataset.hq]; if(!q.done) q.go(); });
  metaWire(root);
  root.querySelectorAll('[data-hub]').forEach(b=>b.onclick = ()=>{ const k = b.dataset.hub;
    if(k === 'game') gameOpen(); else if(k === 'surf') surfOpen(); else if(k === 'skate') skateOpen(); else if(k === 'quest') questOpen(); else if(k === 'defend') window.defendOpen?.(); else if(k === 'quiz') quizOpen();
    else if(k === 'fort'){ if(!fortOpen) playFortune(); _hubFort = !_hubFort || !fortOpen ? true : false; renderHub(); setTimeout(()=>root.querySelector('.fort')?.scrollIntoView({ block:'center', behavior:'smooth' }), 60); }
    else if(k === 'stamp' || k === 'badge') openPlay('collect');
    else if(k === 'rank') openPlay('rank');
    else if(k === 'shop') shopOpen();
    else if(k === 'up') shopOpen('🔧 강화');
    else if(k === 'me'){ setTab('home'); setTimeout(()=>{ const d = $('bld-fold'); if(d){ d.open = true; d.scrollIntoView({ block:'start', behavior:'smooth' }); } }, 120); }
    else if(k === 'emote' || k === 'town'){ setTab('town'); } });
}

function renderPlayBits(){
  if(!ME?.profile?.play) return;
  if(typeof state !== 'undefined' && state.tab === 'play') renderHub();
  { const q = playQuests(ME.profile.play).filter(x=>!x.done).length, d = $('play-dot');
    /* 안 한 퀘스트 수 — 늘 떠 있으면 아무도 안 본다. 오늘 놀이 탭을 한 번 열면 그날은 숨긴다 */
    let seen = ''; try{ seen = localStorage.getItem('lineup.share.playseen') || ''; }catch(e){}
    if(state.tab === 'play'){ try{ localStorage.setItem('lineup.share.playseen', today()); }catch(e){} seen = today(); }
    if(d){ d.textContent = q; d.hidden = !q || state.tab === 'play' || seen === today(); d.setAttribute('aria-label', `오늘 남은 퀘스트 ${q}개`); } }
  const p = ME.profile.play, xp = playXp(p), lv = lvOf(xp), cur = PLV[lv][0], nxt = PLV[lv+1]?.[0];
  const pct = nxt ? Math.max(4, Math.round((xp - cur) / (nxt - cur) * 100)) : 100;      // 0% 도 눈에 보이게 조금은 채운다
  if($('lv-chip')) $('lv-chip').textContent = `Lv.${lv+1} ${PLV[lv][1]} ${PLV[lv][2]}`;
  if($('xp-fill')) $('xp-fill').style.width = pct + '%';
  const stk = (typeof drillStat === 'function' && ME) ? drillStat(ME.id).streak : 0;
  if($('xp-txt')) $('xp-txt').textContent = (stk ? `🔥${stk} · ` : '') + (nxt ? `${xp - cur}/${nxt - cur} XP` : `${xp} XP · 최고 레벨`);
  const qs = playQuests(p), n = qs.filter(q=>q.done).length;
  if($('quest-strip')){
    $('quest-strip').hidden = false;
    $('quest-strip').classList.toggle('all', n === qs.length);
    $('qs-ic').innerHTML = qs.map(q=>`<i class="${q.done?'on':''}" aria-hidden="true">${q.done ? '✔' : q.ic}</i>`).join('');
    $('qs-t').textContent = n === qs.length ? '오늘 퀘스트 모두 완료!' : `오늘의 퀘스트 ${n}/${qs.length}`;
    $('qs-s').textContent = n === qs.length ? '내일 또 만나요 · 도감 보기' : (qs.find(q=>!q.done).t + ' · 남았어요');
  }
}

/* ── 도감 시트 ── */
let _rkView = 'xp', _plTab = 'today';
async function openPlay(tab){
  if(tab) _plTab = tab;
  $('play-sheet').hidden = false;
  renderPlay();
  /* 순위는 마을 명단이 있어야 나온다 — 홈에서는 아직 안 불러왔을 수 있다 */
  if(!(state.town||[]).length){
    try{ state.town = (await api('surfers?select=id,name,cohort,profile&limit=300')).filter(x=>!isTest(x.id)); renderPlay(); }catch(e){} }
}
function closePlay(){ $('play-sheet').hidden = true; }
function renderPlay(){
  if(!ME?.profile?.play) return;
  const p = ME.profile.play, xp = playXp(p), lv = lvOf(xp), cur = PLV[lv][0], nxt = PLV[lv+1];
  const pct = nxt ? Math.max(4, Math.round((xp - cur) / (nxt[0] - cur) * 100)) : 100;
  const qs = playQuests(p), got = Object.keys(p.badges).length;
  const dToday = d => (d && d.day === today()) ? d.score : 0;
  const rows = (state.town||[]).filter(x=>x.id !== ME.id).map(x=>{ const pp = peerPlay(x.profile?.play) || { xp:0, best:0, dbest:null }; return { id:x.id, name:x.name, xp:pp.xp, best:pp.best, daily:dToday(pp.dbest) }; })
    .concat([{ id:ME.id, name:ME.name, xp, best:p.best||0, daily:dToday(p.dbest) }]);
  const key = _rkView === 'xp' ? 'xp' : _rkView === 'daily' ? 'daily' : 'best';
  const top = rows.filter(r=>r[key] > 0).sort((a,b)=>b[key]-a[key]);
  const myRank = top.findIndex(r=>r.id === ME.id) + 1;
  const shown = top.slice(0, 5); if(myRank > 5) shown.push(top[myRank-1]);
  const medal = i => ['🥇','🥈','🥉'][i] || (i + 1);
  $('play-body').innerHTML = `
    <div class="ph">
      <div class="ph-em">${PLV[lv][2]}</div>
      <div class="ph-t"><b>Lv.${lv+1} ${PLV[lv][1]}</b><span>${xp} XP${nxt ? ` · 다음 ${nxt[1]}까지 ${nxt[0] - xp}` : ' · 최고 레벨'}</span></div>
    </div>
    <div class="xpbar big" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
    ${(()=>{ const nu = UNLOCKS.find(u=>u.lv > lv); return nu ? `<div class="note" style="margin-top:8px">🔓 Lv.${nu.lv+1} ${PLV[nu.lv][1]}에서 <b>${nu.ic} ${nu.n}</b>이 열려요</div>` : `<div class="note" style="margin-top:8px">🎉 꾸미기 아이템을 모두 열었어요</div>`; })()}

    <div class="pltabs" role="tablist" aria-label="도감 구역"><button type="button" role="tab" data-plt="today" aria-selected="${_plTab==='today'}">🎯 오늘</button><button type="button" role="tab" data-plt="collect" aria-selected="${_plTab==='collect'}">🎒 수집</button><button type="button" role="tab" data-plt="rank" aria-selected="${_plTab==='rank'}">🏆 순위</button></div>
    <div class="plpane" data-pane="today">
    <div class="pt">오늘의 퀘스트 <small>${qs.filter(q=>q.done).length}/${qs.length} · 모두 하면 +20 XP</small></div>
    ${qs.map((q,i)=>`<button type="button" class="pq${q.done?' done':''}" data-q="${i}">
        <i>${q.done ? '✔' : q.ic}</i><span>${q.t}<small>${q.done ? '완료 · +5 XP' : q.hint}</small></span><b>${q.done ? '' : '›'}</b></button>`).join('')}

    <div class="pt">🎮 파도 점프 <small>내 최고 ${p.best || 0}점 · 🐚 ${shellBal()}</small></div>
    <button type="button" class="btn blue" id="pg-start" style="width:100%;min-height:48px">📅 오늘의 챌린지 · 점프하러 가기</button>

    <div class="pt">🔮 오늘의 서핑 운세</div>
    ${p.fortDay === today() ? (()=>{ const f = fortune(); return `<div class="fort"><div class="fs">서핑 컨디션 <b>${'★'.repeat(f.star)}${'☆'.repeat(5 - f.star)}</b></div>
      <div>🌊 행운의 해변 <b>${esc(f.beach)}</b></div><div>⏰ 행운의 시간 <b>${f.time}</b></div><div>🎨 행운의 보드 색 <b>${esc(f.color)}</b></div><div>🐚 행운의 조개 <b>${f.n}개</b></div>
      ${f.voice ? `<div class="fv">“${esc(f.voice[0])}”<small>— ${esc(f.voice[1])}</small></div>` : ''}</div>`; })()
      : `<button type="button" class="btn mint" id="pg-fort" style="width:100%;min-height:48px">🔮 오늘의 운세 열어보기 (+3 XP)</button>`}

    <div class="pt">🧠 코치 퀴즈 <small>누적 정답 ${p.qz || 0}개</small></div>
    <button type="button" class="btn mint" id="pg-quiz" style="width:100%;min-height:48px">누가 한 말일까요? — 한 판에 5문제</button>
    </div>
    <div class="plpane" data-pane="collect">
    <div class="pt">📍 해변 스탬프 <small>${Object.keys(p.stamps||{}).length}/${SEAS.length} · 체크인하면 찍혀요</small></div>
    <div class="stmps">${SEAS.map(s=>`<span class="stmp${p.stamps?.[s[0]] ? ' on' : ''}"${p.stamps?.[s[0]] ? ` title="${esc(p.stamps[s[0]])}"` : ''}>${p.stamps?.[s[0]] ? '📍' : '·'} ${esc(s[0])}</span>`).join('')}</div>

    <div class="pt">배지 <small>${got}/${BADGES.length}</small></div>
    <div class="bgrid">${BADGES.map(b=>`<button type="button" class="bd${p.badges[b.id]?' on':''}" data-bd="${b.id}" aria-label="${b.n}${p.badges[b.id]?'':' (잠김)'}">
        <i>${p.badges[b.id] ? b.ic : '🔒'}</i><span>${b.n}</span></button>`).join('')}</div>
    </div>
    <div class="plpane" data-pane="rank">
    <div class="pt">동기 순위 <small>
      <button type="button" class="prk-tab${_rkView==='xp'?' on':''}" data-rk="xp">레벨</button>
      <button type="button" class="prk-tab${_rkView==='best'?' on':''}" data-rk="best">점프</button>
      <button type="button" class="prk-tab${_rkView==='daily'?' on':''}" data-rk="daily">오늘</button></small></div>
    ${shown.length ? shown.map(r=>{ const i = top.indexOf(r); const l = lvOf(r.xp);
      return `<div class="prk${r.id===ME.id?' me':''}"><span class="n">${medal(i)}</span><span class="nm2">${esc(r.name)}</span>
        <span class="v">${_rkView==='xp' ? `Lv.${l+1} · ${r.xp}` : `${r[key]}점`}</span></div>`; }).join('')
      : `<div class="note">${_rkView==='xp' ? '아직 기록이 없어요.' : _rkView==='daily' ? '오늘의 챌린지는 아직 아무도 안 뛰었어요 — 첫 번째가 되어보세요' : '아직 아무도 안 뛰었어요 — 첫 번째가 되어보세요'}</div>`}
    <div class="note" style="margin-top:10px">점수는 훈련·번개·차량·숙소·마을 활동에서 쌓여요. 순위는 재미로만 봐주세요 — 서버가 누가 했는지 증명하진 못해요.</div>
    </div>`;
  $('play-body').dataset.tab = _plTab;
  $('play-body').querySelectorAll('[data-plt]').forEach(b=>b.onclick = ()=>{ _plTab = b.dataset.plt; $('play-body').dataset.tab = _plTab;
    $('play-body').querySelectorAll('[data-plt]').forEach(x=>x.setAttribute('aria-selected', String(x === b))); });
  $('play-body').querySelectorAll('[data-q]').forEach(b=>b.onclick = ()=>{ const q = qs[+b.dataset.q]; if(!q.done) q.go(); });
  $('play-body').querySelectorAll('[data-bd]').forEach(b=>b.onclick = ()=>{ const bd = BADGES.find(x=>x.id === b.dataset.bd);
    toast(p.badges[bd.id] ? `${bd.ic} ${bd.n} — ${bd.d}` : `🔒 ${bd.n} — ${bd.d}`); });
  $('play-body').querySelectorAll('[data-rk]').forEach(b=>b.onclick = ()=>{ _rkView = b.dataset.rk; renderPlay(); });
  $('pg-start').onclick = ()=>{ closePlay(); gameOpen(); };
  $('pg-quiz').onclick = ()=>{ closePlay(); quizOpen(); };
  if($('pg-fort')) $('pg-fort').onclick = playFortune;
}

/* ── 배선 ── */
function playWire(){
  if(playWire.done) return; playWire.done = true;
  $('pop-ok').onclick = popOk; $('pop-go').onclick = popGo;
  $('pop').addEventListener('click', e=>{ if(e.target === $('pop')) popClose(); });
  document.querySelectorAll('[data-playclose]').forEach(b=>b.onclick = closePlay);
  ['prof-lv','quest-strip'].forEach(id=>{ const el = $(id); if(el) el.onclick = ()=>setTab('play'); });       // 놀이 메뉴가 정문이다. 도감 시트는 거기서 상세로 연다
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape'){ if(!$('pop').hidden) popClose(); else if(!$('play-sheet').hidden) closePlay(); } });
}

/* ── 대화창 접근성 ─────────────────────────────────────────────
   시트·팝업·게임은 모두 hidden 속성으로 여닫는다. 그 속성만 지켜보면 각 함수를 고치지 않고도
   (1) 열릴 때 포커스를 창 안으로, (2) 닫히면 누르던 자리로 돌려놓고, (3) Tab 이 창 밖으로 새지 않게 막는다.
   키보드·화면낭독 사용자가 뒤에 남은 화면을 헤매지 않게 하는 최소한이다. */
(function dialogs(){
  const LIST = [['mail-sheet','쪽지'], ['play-sheet','서퍼 도감'], ['quiz-sheet','코치 퀴즈'], ['game','파도 점프'], ['pop','알림']];   // 뒤에 있을수록 위에 뜬다
  const opener = {};
  const focusables = root => [...root.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')]
    .filter(e=>!e.disabled && e.offsetParent !== null);
  function arm(){
    LIST.forEach(([id, label])=>{
      const el = document.getElementById(id); if(!el || el._dlg) return; el._dlg = true;
      el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); if(!el.getAttribute('aria-label')) el.setAttribute('aria-label', label);
      new MutationObserver(()=>{
        if(!el.hidden){ opener[id] = document.activeElement;
          setTimeout(()=>{ const f = focusables(el); (el.querySelector('[data-autofocus]') || f[0])?.focus({ preventScroll:true }); }, 60); }
        else{ const o = opener[id]; opener[id] = null; if(o && document.contains(o) && o.offsetParent !== null) o.focus({ preventScroll:true }); }
      }).observe(el, { attributes:true, attributeFilter:['hidden'] });
    });
  }
  document.addEventListener('keydown', e=>{
    if(e.key !== 'Tab') return;
    const top = LIST.map(([id])=>document.getElementById(id)).filter(el=>el && !el.hidden).pop(); if(!top) return;
    const f = focusables(top); if(!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if(!top.contains(document.activeElement)){ e.preventDefault(); first.focus(); }
    else if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm); else arm();
})();

/* ── 🔧 강화소 · 오늘의 미션 · 출석 · 주간 순위 ─────────────────────────
   돈은 받지 않는다. 조개(🐚)로 영구 강화를 사서 다음 판이 조금 나아진다 — 「한 판 더」와 「내일 또」의 이유.
   공정: 오늘의 챌린지(모두 같은 코스)와 균형 시험(봇·시뮬)에는 강화를 쓰지 않는다.
   저장값은 남의 기기·프로필에서 섞여 들어오므로 읽을 때마다 _num 으로 가둔다. */
const UPC = [30, 60, 120, 240, 480];                 // 단계별 값 — 한 판 10~60개라 윗단계는 며칠 걸린다
const UPG = [
  { k:'j_shield', g:'jump',   ic:'🛟', n:'시작 방패',     s:'방패',   d:'구명튜브를 들고 출발 · 2단계부터 튜브가 더 자주', max:3 },
  { k:'j_mag',    g:'jump',   ic:'🧲', n:'자석 시간+',    s:'자석',   d:'조개 자석이 2초씩 더 길게', max:4 },
  { k:'j_item',   g:'jump',   ic:'🎁', n:'아이템 등장↑',  s:'아이템', d:'쉬움에도 아이템이 나오고, 어려움은 더 자주', max:3 },
  { k:'j_val',    g:'jump',   ic:'🐚', n:'조개 가치↑',    s:'조개',   d:'조개 하나에 +2점씩 더', max:5 },
  { k:'d_atk',    g:'defend', ic:'💥', n:'기본 공격력',   s:'공격',   d:'모든 기술 피해 +8%씩', max:3 },
  { k:'d_sch',    g:'defend', ic:'🏫', n:'학교 체력',     s:'학교',   d:'학교 HP +10%씩', max:4 },
  { k:'d_shell',  g:'defend', ic:'🐚', n:'시작 조개',     s:'조개',   d:'정비용 조개 +3개씩 들고 시작', max:4 },
  { k:'d_free',   g:'defend', ic:'🎟️', n:'첫 카드 무료',  s:'무료',   d:'정비 보급 단계만큼 공짜', max:3 },
  { k:'q_hp',     g:'quest',  ic:'❤️', n:'원정대 체력',   s:'체력',   d:'최대 체력 +8씩', max:5 },
  { k:'q_atk',    g:'quest',  ic:'⚔️', n:'원정대 공격',   s:'공격',   d:'공격력 +1씩', max:5 },
  { k:'r_mul',    g:'surf',   ic:'🌊', n:'라인업 점수 배율', s:'점수', d:'세션 점수 +3%씩', max:5 },
  { k:'s_mul',    g:'skate',  ic:'🛹', n:'스케이트 보상', s:'조개',   d:'드릴 한 번에 조개 +1씩', max:3 },
];
const UPGK = { jump:'🏄 파도 점프', defend:'🛡️ 해변 수호', quest:'🗺️ 전설의 보드 원정', surf:'🌊 라인업 서핑', skate:'🛹 서프스케이트' };
const upLv = k => { const u = UPG.find(x=>x.k === k); return u ? _num(ME?.profile?.play?.up?.[k], u.max) : 0; };
function playUp(k){
  const u = UPG.find(x=>x.k === k), p = ME?.profile?.play; if(!u || !p) return false;
  const lv = upLv(k); if(lv >= u.max){ toast('이미 최고 단계예요'); return false; }
  const c = UPC[lv]; if(shellBal() < c){ toast(`🐚 조개가 모자라요 — ${c}개 필요 (보유 ${shellBal()})`); return false; }
  (p.up ||= {})[k] = lv + 1; p.spent = (p.spent || 0) + c;
  playPush(); vib([20, 40, 20]); toast(`${u.ic} ${u.n} ${lv + 1}단계!`); return true;
}
/* 게임이 판을 시작할 때 — {shield:1, mag:2 …} 와 화면 태그. 강화가 있으면 토스트로 「무엇이 적용됐는지」 보인다 */
function upFor(g, quiet){
  const o = {}, on = [];
  UPG.filter(u=>u.g === g).forEach(u=>{ const lv = upLv(u.k), id = u.k.split('_')[1]; o[id] = lv; if(lv) on.push(`${u.s} ${lv}`); });
  o.tag = on.join(' · ');
  if(o.tag && !quiet && typeof toast === 'function') toast('🔧 강화 적용: ' + o.tag);
  return o;
}
window.upFor = upFor; window.playUp = playUp;
function upShopHtml(){
  return `<div class="note" style="margin-top:8px">🔧 한 번 사면 계속 — 다음 판부터 자동 적용. <b>📅 오늘의 챌린지</b>는 모두 같은 조건(강화 없음)이에요.</div>`
    + Object.keys(UPGK).map(g=>`<div class="uph">${UPGK[g]}</div><div class="uplist">${UPG.filter(u=>u.g === g).map(u=>{ const lv = upLv(u.k), c = UPC[lv], mx = lv >= u.max;
      return `<div class="upit"><i>${u.ic}</i><span><b>${u.n}</b> <em class="pips" aria-label="${lv}/${u.max}단계">${'●'.repeat(lv)}${'○'.repeat(u.max - lv)}</em><small>${u.d}</small></span>
        <button type="button" class="btn sm ${mx ? 'ghost' : shellBal() >= c ? 'blue' : 'ghost'}" data-up="${u.k}" ${mx ? 'disabled' : ''}>${mx ? '최고' : `🐚 ${c}`}</button></div>`; }).join('')}</div>`).join('');
}

/* 하루 기록(dm) — 미션 진행·받은 보상·게임별 오늘 첫 판(f). 날짜가 바뀌면 새로 */
const _isDay = d => /^\d{4}-\d{2}-\d{2}$/.test(String(d));
const DMX = { j:1000000, df:15, r:1000000, q:11, sk:999, box:1 };
function dmOf(p){ const day = today(); if(!p.dm || p.dm.d !== day) p.dm = { d:day, j:0, df:0, r:0, q:0, sk:0, c:{}, f:{}, box:0 }; p.dm.c ||= {}; p.dm.f ||= {}; return p.dm; }
function dmNote(k, v){ const m = dmOf(playP()); m[k] = Math.max(_num(m[k], DMX[k]), _num(v, DMX[k])); }
/* 오늘 첫 판 ×2 — 게임마다 하루 한 번. 조개 0개 판은 기회를 쓰지 않는다 */
function x2(g, sh){ const m = dmOf(playP()); if(!(sh > 0) || m.f[g]) return 0; m.f[g] = 1; return sh; }
/* 이번 주 최고(월요일 시작) — 다른 사람 화면의 주간 순위에 쓰인다 */
function wkNote(k, v){
  if(typeof weekKey !== 'function') return; const p = playP(), w = weekKey(today()), mx = { j:1000000, d:15, r:1000000, q:11 }[k];
  if(!p.wk || p.wk.w !== w) p.wk = { w, j:0, d:0, r:0, q:0 };
  p.wk[k] = Math.max(_num(p.wk[k], mx), _num(v, mx));
}

/* 오늘의 미션 — 게임 둘 + 바다·마을 활동 하나. 날짜로 고르니 모두 같은 미션(단톡방에서 이야기거리) */
const MIS_RW = 15;
function missions(p){
  const day = today(), m = dmOf(p), h = _fh('mis|' + day), v = p.vis?.[day] || {};
  const G = [
    { id:'mj', ic:'🏄', t:'파도 점프 1000점', done:m.j >= 1000, hint:`오늘 최고 ${_num(m.j, 1e6)}/1000점`, go:()=>gameOpen() },
    { id:'md', ic:'🛡️', t:'해변 수호 5라운드 버티기', done:m.df >= 5, hint:`오늘 최고 ${_num(m.df, 15)}/5 라운드`, go:()=>window.defendOpen?.() },
    { id:'mr', ic:'🌊', t:'라인업 서핑 400점', done:m.r >= 400, hint:`오늘 최고 ${_num(m.r, 1e6)}/400점`, go:()=>surfOpen() },
    { id:'mq', ic:'🗺️', t:'원정 한 장 깨기', done:m.q >= 1, hint:'아무 마을이나 한 장', go:()=>questOpen() },
    { id:'ms', ic:'🛹', t:'서프스케이트 드릴 2번', done:m.sk >= 2, hint:`오늘 ${_num(m.sk, 999)}/2번`, go:()=>skateOpen() },
  ], C = [
    { id:'cl', ic:'📒', t:'서핑 일지 쓰기', done:(p.log || []).some(e=>e && e.d === day), hint:'바다 다녀온 기록 한 줄', go:()=>window.surfLogOpen?.() },
    { id:'cf', ic:'🍜', t:'맛집에 한마디', done:!!v.food, hint:'가 본 곳 한 줄 후기', go:()=>setTab('food') },
    { id:'cc', ic:'📍', t:'해변 체크인', done:!!v.chk, hint:'바다에 도착하면 홈에서 체크인', go:()=>setTab('home') },
    { id:'cz', ic:'🧠', t:'코치 퀴즈 한 판', done:!!v.quiz, hint:'누가 한 말일까요?', go:()=>quizOpen() },
  ];
  const a = h % G.length, b = (a + 1 + (h >>> 4) % (G.length - 1)) % G.length;
  return [G[a], G[b], C[(h >>> 9) % C.length]];
}
function misClaim(id){
  const p = playP(), m = dmOf(p), q = missions(p).find(x=>x.id === id);
  if(!q || !q.done || m.c[id]) return false;
  m.c[id] = 1; p.shells = (p.shells || 0) + MIS_RW; playPush(); vib([20, 40, 20]); toast(`🎯 미션 완료 · 🐚 +${MIS_RW}`); return true;
}
function misBox(){
  const p = playP(), m = dmOf(p);
  if(m.box || !missions(p).every(q=>m.c[q.id])) return 0;
  const n = 30 + (_fh('box|' + ME.id + '|' + today()) % 5) * 5;       // 30~50 — 열어 봐야 안다
  m.box = 1; p.shells = (p.shells || 0) + n; playPush(); vib([30, 50, 30, 50, 60]); return n;
}

/* 7일 출석 — 하루라도 거르면 1일부터. 7일째는 큰 조개 + 안 가진 소품 하나 */
const ATT_RW = [10, 15, 20, 25, 30, 40, 60];
const prevDay = d => new Date(Date.parse(d + 'T00:00:00Z') - 864e5).toISOString().slice(0, 10);
function attState(p){
  const day = today(), a = p.att || {}, n0 = _num(a.n, 9999), claimed = a.d === day;
  const n = claimed ? Math.max(1, n0) : a.d === prevDay(day) ? n0 + 1 : 1;
  return { claimed, n, slot:(n - 1) % 7 + 1 };
}
function attClaim(){
  const p = playP(), s = attState(p); if(s.claimed) return null;
  p.att = { d:today(), n:s.n }; let n = ATT_RW[s.slot - 1], gift = null;
  if(s.slot === 7){ const own = p.own || {}, c = SHOP.filter(it=>!own[it.key + ':' + it.v] && it.cost <= 50);
    if(c.length){ gift = c[_fh(ME.id + '|' + today()) % c.length]; (p.own ||= {})[gift.key + ':' + gift.v] = 1; } else n += 40; }
  p.shells = (p.shells || 0) + n; playPush(); vib([30, 50, 30]);
  return { n, gift, slot:s.slot };
}

/* 다른 기기 값 합치기 — 강화는 단계별 큰 쪽, 하루·주 기록은 최신 날짜 우선·같은 날이면 큰 쪽. 모르는 키는 버린다 */
function metaMerge(p, r){
  let ch = false;
  if(r.up && typeof r.up === 'object') UPG.forEach(u=>{ const v = _num(r.up[u.k], u.max); if(v > upLv(u.k)){ (p.up ||= {})[u.k] = v; ch = true; } });
  if(p.up) Object.keys(p.up).forEach(k=>{ const u = UPG.find(x=>x.k === k); if(!u) delete p.up[k]; else p.up[k] = _num(p.up[k], u.max); });
  if(r.dm && typeof r.dm === 'object' && _isDay(r.dm.d)){ const rd = String(r.dm.d);
    if(!p.dm || rd > String(p.dm.d || '')){ p.dm = { d:rd, j:0, df:0, r:0, q:0, sk:0, c:{}, f:{}, box:0 }; ch = true; }
    if(p.dm.d === rd){ const m = p.dm; m.c ||= {}; m.f ||= {};
      Object.keys(DMX).forEach(k=>{ const v = _num(r.dm[k], DMX[k]); if(v > _num(m[k], DMX[k])){ m[k] = v; ch = true; } });
      ['c', 'f'].forEach(k=>{ const o = r.dm[k]; if(o && typeof o === 'object') Object.keys(o).filter(x=>/^[a-z]{1,8}$/.test(x)).slice(0, 12).forEach(x=>{ if(!m[k][x]){ m[k][x] = 1; ch = true; } }); }); } }
  if(r.att && typeof r.att === 'object' && _isDay(r.att.d)){ const rd = String(r.att.d), rn = _num(r.att.n, 9999), a = p.att || {};
    if(rd > String(a.d || '') || (rd === a.d && rn > _num(a.n, 9999))){ p.att = { d:rd, n:rn }; ch = true; } }
  if(r.wk){ const w = peerPlay({ wk:r.wk }).wk;
    if(w && (!p.wk || w.w > String(p.wk.w || ''))){ p.wk = w; ch = true; }
    else if(w && w.w === p.wk.w) ['j', 'd', 'r', 'q'].forEach(k=>{ if(w[k] > (p.wk[k] || 0)){ p.wk[k] = w[k]; ch = true; } }); }
  return ch;
}

/* 결과 화면 한 줄 — 아깝게 놓친 기록(near-miss) · 강화 예고 · 오늘 첫 판 ×2. 문구는 전부 고정값(사람 이름 없음) */
function upNudge(g, o){
  o = o || {}; const L = [], sc = _num(o.sc, 1e7), best = _num(o.best, 1e7);
  if(o.x2) L.push(`🌅 오늘 첫 판 보너스 · 조개 ×2 (+${_num(o.x2, 999)})`);
  if(best > 0 && sc < best && sc >= best * .75) L.push(`🔥 아깝다! 최고 기록까지 ${best - sc}${o.u || '점'} — 한 판 더?`);
  if(o.daily) L.push('📅 챌린지는 강화 없이 모두 같은 조건으로 겨뤄요');
  else{
    const u = (o.k && UPG.find(x=>x.k === o.k && upLv(x.k) < x.max)) || UPG.filter(x=>x.g === g && upLv(x.k) < x.max).sort((a, b)=>upLv(a.k) - upLv(b.k))[0];
    if(u){ const c = UPC[upLv(u.k)], plus = u.k === o.k ? _num(o.plus, 1e6) : 0;
      L.push(plus > 0 ? `🔧 「${u.n}」 강화했으면 <b>+${plus}점</b> 더 나왔을 거예요` : `🔧 다음 강화 「${u.ic} ${u.n}」 ${upLv(u.k) + 1}단계`);
      L.push(shellBal() >= c ? `<button type="button" class="btn sm mint" data-upgo="${g}">🔧 강화소 가기 · 🐚${c} (보유 ${shellBal()})</button>` : `🐚${c} 필요 — ${c - shellBal()}개만 더 모으면 돼요`); }
  }
  return L.length ? `<div class="up-nudge">${L.map(x=>`<div>${x}</div>`).join('')}</div>` : '';
}
window.upNudge = upNudge;
document.addEventListener('click', e=>{
  const b = e.target.closest && e.target.closest('[data-upgo]'); if(!b) return;
  const f = { jump:'gameClose', defend:'defendClose', surf:'surfClose', skate:'skateClose', quest:'questClose' }[b.dataset.upgo];
  try{ if(f && typeof window[f] === 'function') window[f](); }catch(err){}
  setTimeout(()=>shopOpen('🔧 강화'), 150);
});

/* 허브 — 출석 달력 · 미션 · 이번 주 동기 순위 */
function weekHtml(){
  if(typeof weekKey !== 'function') return '';
  const wk = weekKey(today()), co = ME.cohort && ME.cohort !== 'open' ? ME.cohort : '';
  const rows = (state.town || []).filter(x=>x.id !== ME.id && !isTestId(x.id) && (!co || x.cohort === co)).map(x=>({ id:x.id, name:String(x.name || ''), w:peerPlay(x.profile?.play)?.wk }))
    .concat([{ id:ME.id, name:ME.name, w:peerPlay(ME.profile.play)?.wk }]).filter(r=>r.w && r.w.w === wk);
  const G = [['j','🏄 파도 점프','점'], ['d','🛡️ 해변 수호','R'], ['r','🌊 라인업 서핑','점'], ['q','🗺️ 원정','장']];
  const lines = G.map(([k, n, u])=>{ const t = rows.filter(r=>r.w[k] > 0).sort((a, b)=>b.w[k] - a.w[k]);
    if(!t.length) return `<div><span>${n}<small>아직 아무도 — 1위 자리가 비었어요</small></span><b>—</b></div>`;
    const i = t.findIndex(r=>r.id === ME.id), top = t[0];
    const mine = i < 0 ? '나는 아직 기록 없음' : i === 0 ? '👑 내가 1위!' : `나 ${i + 1}위 · 1위까지 ${top.w[k] - t[i].w[k]}${u}`;
    return `<div class="${i === 0 ? 'me' : ''}"><span>${n}<small>${mine}</small></span><b>🥇 ${esc(top.name)} ${top.w[k]}${u}</b></div>`; }).join('');
  return `<div class="pt" style="margin-top:18px">🏆 이번 주 ${co ? esc(co) + ' ' : ''}랭킹 <small>월요일마다 새로 · 강화도 실력</small></div><div class="wkb">${lines}</div>`;
}
const isTestId = id => typeof isTest === 'function' ? isTest(id) : false;
function metaHub(p){
  const at = attState(p), ms = missions(p), m = dmOf(p), nC = ms.filter(q=>m.c[q.id]).length;
  const cal = ATT_RW.map((r, i)=>{ const d = i + 1, got = at.claimed ? d <= at.slot : d < at.slot, now = !at.claimed && d === at.slot;
    return `<span class="at-d${got ? ' on' : ''}${now ? ' now' : ''}"><small>${d}일</small><b>${got ? '✔' : d === 7 ? '🎁' : '🐚'}</b><i>${r}</i></span>`; }).join('');
  return `<div class="pt" style="margin-top:18px">📅 7일 출석 <small>${at.claimed ? `${at.n}일 연속 · 오늘 받았어요` : at.n > 1 ? `${at.n - 1}일 연속 중 — 오늘 받으면 이어져요` : '하루라도 거르면 1일부터'}</small></div>
    <div class="atcal">${cal}</div>
    ${at.claimed ? '' : `<button type="button" class="btn blue" data-att style="width:100%;min-height:46px;margin-top:8px">🎁 ${at.slot}일째 출석 보상 받기 · 🐚 ${ATT_RW[at.slot - 1]}${at.slot === 7 ? ' + 소품 선물' : ''}</button>`}
    <div class="pt" style="margin-top:18px">🎯 오늘의 미션 <small>${nC}/3 · 하나에 🐚${MIS_RW} · 모두 받으면 🎁 상자</small></div>
    ${ms.map(q=>{ const c = m.c[q.id]; return `<button type="button" class="pq${c ? ' done' : ''}${q.done && !c ? ' ready' : ''}" data-mis="${q.id}"><i>${c ? '✔' : q.ic}</i><span>${q.t}<small>${c ? `받았어요 · 🐚 ${MIS_RW}` : q.done ? '완료! 눌러서 조개 받기' : q.hint}</small></span><b>${c ? '' : q.done ? `🐚${MIS_RW}` : '›'}</b></button>`; }).join('')}
    ${nC === 3 ? (m.box ? `<div class="note" style="margin-top:6px">🎁 오늘 상자를 열었어요 — 내일 새 미션!</div>` : `<button type="button" class="btn mint" data-box style="width:100%;min-height:48px;margin-top:6px">🎁 미션 상자 열기</button>`) : ''}
    ${weekHtml()}`;
}
function metaWire(root){
  root.querySelectorAll('[data-mis]').forEach(b=>b.onclick = ()=>{ const p = ME.profile.play, q = missions(p).find(x=>x.id === b.dataset.mis); if(!q || dmOf(p).c[q.id]) return;
    if(!q.done) return q.go();
    if(misClaim(q.id)){ if(typeof burst === 'function') burst(b, 12); renderHub(); } });
  const at = root.querySelector('[data-att]'); if(at) at.onclick = ()=>{ const r = attClaim(); if(!r) return; if(typeof burst === 'function') burst(at, 18);
    _popQ.push({ ic:r.slot === 7 ? '🎁' : '📅', t:`${r.slot}일째 출석!`, d:`🐚 +${r.n}${r.gift ? `\n${r.gift.ic} ${r.gift.n}을(를) 선물로 받았어요 — 소품샵에서 입어 봐요` : ''}${r.slot < 7 ? `\n내일 오면 🐚 ${ATT_RW[r.slot]}` : '\n내일부터 새 7일이 시작돼요'}`, up:r.slot === 7 });
    renderHub(); popNext(); };
  const bx = root.querySelector('[data-box]'); if(bx) bx.onclick = ()=>{ const n = misBox(); if(!n) return;
    _popQ.push({ ic:'🎁', t:'미션 상자를 열었어요!', d:`🐚 +${n}\n내일 새 미션 세 개가 기다려요`, up:true }); renderHub(); popNext(); };
}
/* 화면 조각 스타일 — 이 기능 것만 여기 둔다(본 CSS 를 건드리지 않게) */
(function metaCss(){
  if(document.getElementById('meta-css')) return; const s = document.createElement('style'); s.id = 'meta-css';
  s.textContent = `.atcal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.at-d{display:flex;flex-direction:column;align-items:center;border:2px solid var(--ink);background:#fff;padding:4px 0;font-size:11px;line-height:1.3;color:var(--ink)}
.at-d b{font-size:16px}.at-d i{font-style:normal;font-weight:800}
.at-d.on{background:var(--sun)}.at-d.now{outline:3px solid var(--sea);outline-offset:-2px}
@media (prefers-reduced-motion:no-preference){.at-d.now{animation:atp .9s ease-in-out infinite alternate}.pq.ready{animation:atp .9s ease-in-out infinite alternate}}
@keyframes atp{to{transform:translateY(-2px)}}
.pq.ready{border-color:var(--sea)}
.wkb{border:2px solid var(--ink);background:#fff;padding:4px 10px;color:var(--ink)}
.wkb>div{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 0;border-top:1px dashed rgba(27,27,47,.25);font-size:13.5px}
.wkb>div:first-child{border-top:0}.wkb>div.me b{color:var(--sea)}
.wkb small{display:block;color:var(--ink2);font-size:11.5px;font-weight:400}.wkb b{text-align:right;min-width:0;overflow-wrap:anywhere}
.uph{font-weight:800;margin:14px 0 6px}.uplist{display:grid;gap:8px}
.upit{display:flex;align-items:center;gap:10px;border:2px solid var(--ink);background:#fff;padding:8px 10px;color:var(--ink)}
.upit>i{font-style:normal;font-size:24px}.upit>span{flex:1;min-width:0}.upit small{display:block;font-size:12px;color:var(--ink2)}
.upit .pips{font-style:normal;letter-spacing:1px;font-size:11px;color:var(--sea)}.upit .btn{white-space:nowrap}
.up-nudge{border:2px dashed currentColor;border-radius:10px;padding:6px 10px;margin:8px 0;font-size:13px;line-height:1.5;text-align:center}
.up-nudge .btn{margin-top:4px}`;
  (document.head || document.documentElement).appendChild(s);
})();
