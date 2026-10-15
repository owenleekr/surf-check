/* ── 🗺️ 전설의 보드 원정 — 강원 해안 이야기 ──────────────────────────────────
   봉인된 '전설의 보드'를 찾아 고성 아야진에서 삼척 장호항까지 강원 해안 11마을을 따라 내려간다.
   마을 하나 = 한 장(章): ① 장 제목 카드 ② 마을 사람·바다 친구와 짧은 대화(눌러서 넘김) ③ 준비물 하나 고르고 자동 전투
   ④ 봉인 조각 + 마을 선물. 지도에서 해안을 따라 진행이 보이고, 깬 마을은 다시 갈 수 있다.
   진행은 프로필 play.qb.ch(모은 조각 수)에 남아 다른 기기에서도 이어진다. 육성 대신 '이야기로 강해진다' —
   앞 마을들의 선물이 다음 장 전투에 계속 붙는다. 마지막 장에서 봉인을 풀면 전설의 보드(BOARDC.legend).
   240×240 도트 캔버스(배경·전투) + 그 위 DOM 덮개(지도·대화·카드). 물리는 1/60초 고정, 배속(1·2·4배)만 바꾼다. */
(function(){
const W = 240, H = 240, SEA = 150, FIX = 1 / 60;
const $q = id => document.getElementById(id);
const RM = (()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })();   // 줄줄이 타자·깜빡임을 끈다

/* 장 — 실제 지명, 한 줄 설명은 널리 알려진 것만. a·b 는 그 마을에서 만나는 사람·바다 친구.
   대사 줄: [누가, 말] — n 해설 · m 나 · a/b 마을 인물. fo 는 나오는 위협(여러 번 적을수록 자주), need 는 넘어야 할 수 */
const GULL = { ic:'🕊️', n:'갈매기 끼룩' };
const CH = [
  { n:'고성 아야진해변', d:'작은 항구를 품은 고성의 해변', s:'바다가 보낸 편지', lm:'⚓', sky:['#CDEEFF','#A6DFFF'],
    a:{ ic:'🧓', n:'해녀 할머니' }, b:GULL, fo:['jelly','jelly','crab'], need:6,
    gift:{ ic:'🪢', n:'해녀 할머니의 리쉬', d:'체력 +15', f:s=>{ s.maxHp += 15; s.hp += 15; } },
    pre:[['n','옛날 옛적, 강원 바다에는 너울을 타고 노는 금빛 보드 한 장이 있었대요.'],
         ['n','바다가 크게 성났던 해, 사람들은 그 보드를 바다 밑에 묶고 매듭 조각을 마을마다 하나씩 나눠 맡겼어요.'],
         ['a','요즘 너울이 심상치 않구먼. 묶어 둔 보드가 깨어나려는 게야.'],
         ['a','우리 마을 조각을 가져가려무나. 대신 앞바다 해파리부터 좀 쫓아 주겠니?'],
         ['m','네! 바로 패들해 볼게요.']],
    post:[['a','허허, 손이 야무지구먼. 자, 첫 번째 조각이다.'], ['b','끼룩! 다음은 천진이야. 바닷길은 내가 알려 줄게!']] },
  { n:'고성 천진해변', d:'물이 맑고 아담한 고성의 해변', s:'맑은 물 아래 집게', lm:'🪨', sky:['#BFE9FF','#9BDBFF'],
    a:GULL, b:{ ic:'🦀', n:'꽃게 대장' }, fo:['crab','crab','jelly'], need:7,
    gift:{ ic:'🦀', n:'꽃게 집게 부적', d:'공격력 +2', f:s=>{ s.atk += 2; } },
    pre:[['a','저기 바위 아래! 꽃게들이 반짝이는 걸 물고 있어.'],
         ['b','이건 우리가 먼저 주웠다! 가져가려면 우릴 넘어 봐라!'],
         ['m','조각은 마을마다 나눠 맡긴 거래. 정정당당하게 겨뤄 보자!']],
    post:[['b','집게가 얼얼하네… 약속은 약속이지. 가져가.'], ['b','이 집게 부적도 줄게. 한번 물면 안 놓는 게 우리 자랑이거든.']] },
  { n:'속초해변', d:'설악산을 등지고 선 속초의 큰 해변', s:'선장의 그물', lm:'🎡', sky:['#B5E5FF','#8ED3FF'],
    a:{ ic:'🧔', n:'고깃배 선장' }, b:GULL, fo:['jelly','jelly','crab','shark'], need:8,
    gift:{ ic:'⚓', n:'선장의 닻 매듭', d:'보호막 15로 시작', f:s=>{ s.startShield += 15; } },
    pre:[['n','설악산이 내려다보는 속초 바다. 항구엔 그물을 손질하는 선장님이 있어요.'],
         ['a','밤마다 상어 녀석들이 그물을 찢어 놓고 가. 조각은 내 배에 잘 모셔 뒀다만…'],
         ['a','상어만 쫓아 주면 조각에 닻 매듭까지 얹어 주지.']],
    post:[['a','이야, 오늘 밤은 발 뻗고 자겠구먼! 약속한 조각이다.'], ['a','닻 매듭은 첫 한 방은 꼭 버텨 줄 거다. 바다에선 그게 제일 중요해.']] },
  { n:'양양 낙산해변', d:'낙산사 아래 긴 백사장', s:'너울을 읽는 법', lm:'🛕', sky:['#AEE2FF','#86CFF7'],
    a:{ ic:'🏄', n:'서핑 코치' }, b:GULL, fo:['jelly','jelly','crab','crab','shark','wave'], need:9,
    gift:{ ic:'🕯️', n:'코치의 왁스', d:'공격 속도 +10%', f:s=>{ s.cd *= 0.9; } },
    pre:[['a','오, 조각 모으는 서퍼가 너구나? 소문 다 났어.'],
         ['a','여기부턴 성난 파도가 와. 너울은 피하는 게 아니라 읽는 거야.'],
         ['m','읽는다… 해 볼게요, 코치님!']],
    post:[['a','좋아, 파도 보는 눈이 생겼네. 조각이랑 내 왁스 가져가.'], ['a','죽도에 가면 물개 몽돌을 찾아봐. 그 녀석이 다음 조각을 지키고 있어.']] },
  { n:'양양 죽도·인구해변', d:'서퍼들이 모이는 작은 섬 앞 해변', s:'서퍼 마을의 물개', lm:'🏝️', sky:['#A8DEFF','#7FCBF5'],
    a:{ ic:'🦭', n:'물개 몽돌' }, b:{ ic:'🏄‍♀️', n:'죽도 서퍼들' }, fo:['jelly','jelly','crab','crab','shark','shark','wave'], need:9,
    gift:{ ic:'🎵', n:'몽돌의 휘파람', d:'바다 친구가 더 자주 와요', f:s=>{ s.palRate += 0.08; } },
    pre:[['b','라인업이 엉망이야! 해파리랑 상어가 한꺼번에 몰려왔어.'],
         ['a','꾸웅… 조각 지키느라 꼼짝도 못 하고 있었어. 같이 막아 줄래?'],
         ['m','서퍼끼리는 서로 돕는 거지. 가자!']],
    post:[['a','꾸웅! 고마워. 이 휘파람을 불면 바다 친구들이 더 자주 와 줄 거야.'], ['b','다음은 하조대래. 바위 위에 오래 사신 거북 할아버지가 계셔.']] },
  { n:'양양 하조대', d:'바위 절벽과 소나무 정자의 바다', s:'바위 위의 거북', lm:'🌲', sky:['#A0D8F5','#78C2EA'],
    a:{ ic:'🐢', n:'바다거북 할아버지' }, b:GULL, fo:['jelly','crab','crab','shark','shark','wave'], need:10,
    gift:{ ic:'🐢', n:'거북 등껍질', d:'받는 피해 -10%', f:s=>{ s.def *= 0.9; } },
    pre:[['n','바위 절벽 위 소나무 정자. 그 아래 바다에 커다란 거북이 쉬고 있어요.'],
         ['a','허어, 조각을 찾는 아이로구나. 오래전 그날도 바다가 이랬지.'],
         ['a','상어 떼를 넘어 보거라. 버티는 법을 아는 자만 다음 바다로 갈 수 있느니.']],
    post:[['a','잘 버텼다. 내 등껍질 한 조각을 떼어 주마. 덜 아플 게다.'], ['a','주문진에 들러 배를 채우고 가거라. 먼 길이니라.']] },
  { n:'강릉 주문진항', d:'오징어·대게로 이름난 항구', s:'항구의 주먹밥', lm:'🦑', sky:['#FFE3B8','#FFC98F'],
    a:{ ic:'👩‍🍳', n:'시장 이모' }, b:GULL, fo:['jelly','crab','crab','shark','wave','wave'], need:11,
    gift:{ ic:'🍙', n:'이모의 주먹밥', d:'체력 +20', f:s=>{ s.maxHp += 20; s.hp += 20; } },
    pre:[['a','아이고, 얼굴이 반쪽이네! 일단 이거부터 먹어.'],
         ['a','근데 어쩌누, 방파제 앞바다에 성난 파도가 계속 쳐서 배가 못 나가.'],
         ['m','배부르게 먹었으니 힘내 볼게요!']],
    post:[['a','장하다 우리 서퍼! 조각은 내 앞치마 주머니에 있었지 뭐야.'], ['a','주먹밥 넉넉히 쌌어. 먹으면 힘이 날 거야.']] },
  { n:'강릉 경포해변', d:'경포호를 끼고 있는 강릉의 대표 해변', s:'호수와 바다 사이', lm:'🏞️', sky:['#FFD9B0','#FFB98A'],
    a:{ ic:'🐬', n:'돌고래 파랑' }, b:GULL, fo:['jelly','jelly','crab','crab','shark','wave'], need:11,
    gift:{ ic:'🐬', n:'파랑의 지느러미 요령', d:'물보라가 두 마리까지 맞아요', f:s=>{ s.multi = Math.max(s.multi, 2); } },
    pre:[['n','호수와 바다가 나란히 누운 경포. 물살 사이로 돌고래 한 마리가 뛰어올라요.'],
         ['a','삐-익! 너 조각 모으지? 나도 하나 갖고 있어!'],
         ['a','근데 정동진 쪽에서 커다란 그림자가 오고 있어. 그 전에 몸 좀 풀자!']],
    post:[['a','삐익! 너 물보라 진짜 빠르다. 내 지느러미 요령 알려 줄게.'], ['a','이제 두 마리도 한 번에 맞힐 수 있을 거야. 정동진 조심해!']] },
  { n:'강릉 정동진', d:'바다 바로 앞 기차역 — 해돋이 명소', s:'해 뜨는 역의 문어', lm:'🚉', sky:['#FFC4A8','#F79A7E'], boss:'octo',
    a:{ ic:'🧑‍✈️', n:'간이역 역장' }, b:{ ic:'🐙', n:'대왕문어' }, fo:['jelly','crab'], need:1,
    gift:{ ic:'🌅', n:'정동진 해돋이 표', d:'공격력 +3', f:s=>{ s.atk += 3; } },
    pre:[['n','바다 바로 앞 기차역. 해가 떠오르는데, 바다 빛이 이상하게 어두워요.'],
         ['a','첫차가 못 들어오고 있어요. 철길 옆 바다에 엄청 큰 문어가 버티고 있거든요.'],
         ['b','조각이 열 개 넘게 모이면 봉인이 풀린다… 그렇게는 못 두지!'],
         ['m','보드가 깨어나야 바다도 다시 잠잠해져. 비켜 줘!']],
    post:[['b','크윽… 어쩌면 네가 그 보드의 주인일지도 모르겠군.'], ['a','첫차가 들어옵니다! 고마워요. 이 해돋이 표, 행운이 따른대요.']] },
  { n:'동해 망상해변', d:'동해시의 길고 넓은 백사장', s:'깊은 바다의 노래', lm:'🏖️', sky:['#C9B7F2','#9E8FD9'],
    a:{ ic:'🐋', n:'고래 할머니' }, b:GULL, fo:['jelly','crab','crab','shark','shark','wave','wave'], need:12,
    gift:{ ic:'🐋', n:'고래의 노래', d:'보호막 +20으로 시작', f:s=>{ s.startShield += 20; } },
    pre:[['n','끝이 안 보이는 긴 백사장. 먼바다에서 낮은 노랫소리가 들려와요.'],
         ['a','우우웅… 아홉 조각을 모은 아이야, 마지막 매듭이 가까웠구나.'],
         ['a','그 앞엔 너울의 수호자가 있단다. 나쁜 게 아니야. 보드를 지킬 뿐이지.'],
         ['a','그러니 마음을 다해 바다를 넘어 보거라.']],
    post:[['a','우우웅… 내 노래를 줄게. 위험할 때 바다가 너를 감싸 줄 거야.'], ['n','이제 삼척 장호항. 마지막 매듭이 기다려요.']] },
  { n:'삼척 장호항', d:'맑은 물빛으로 이름난 작은 항구', s:'풀리는 봉인', lm:'⛵', sky:['#2E3F7A','#1A2650'], boss:'guard',
    a:{ ic:'🐉', n:'너울의 수호자' }, b:GULL, fo:['jelly','crab'], need:1,
    pre:[['n','물빛 맑은 작은 항구. 바다 밑에서 금빛이 희미하게 새어 나와요.'],
         ['b','끼룩! 여기야! 처음 그 바다 냄새가 나!'],
         ['a','열 조각을 모아 왔는가. 허나 보드는 바다를 감당할 자에게만 간다.'],
         ['m','마을마다 믿고 맡겨 준 조각이에요. 끝까지 보여 드릴게요!']],
    post:[['a','…그 물보라엔 열한 마을의 마음이 실려 있구나. 매듭을 풀어라.'],
          ['n','마지막 조각이 맞물리자 바다가 거짓말처럼 잔잔해졌어요.'],
          ['n','봉인이 풀리고, 금빛 보드가 천천히 물 위로 떠올랐어요.'],
          ['L','이게… 전설의 보드! 강원 바다는 이제 내가 지킬게요.'],
          ['b','끼룩! 진짜 전설이 됐어!']] },
];
const N = CH.length;
const FOES = {
  jelly:{ ic:'🪼', n:'해파리', hp:20, atk:4, sp:16, r:8, rate:1.2 },
  crab: { ic:'🦀', n:'꽃게 떼', hp:12, atk:3, sp:22, r:7, rate:0.9 },
  shark:{ ic:'🦈', n:'상어', hp:46, atk:12, sp:38, r:11, rate:1.4 },
  wave: { ic:'🌊', n:'성난 파도', hp:30, atk:16, sp:52, r:12, rate:99, crash:true },
  octo: { ic:'🐙', n:'대왕문어', hp:620, atk:14, sp:12, r:22, rate:1.5, boss:true },          // 보스는 장마다 키우지 않는다 — 그 장 선물까지 계산해 맞춘 값
  guard:{ ic:'🐉', n:'너울의 수호자', hp:1080, atk:17, sp:10, r:26, rate:1.5, boss:true },
};
const PALS = {
  dolphin:{ ic:'🐬', n:'돌고래', say:'돌고래가 함께 헤엄쳐요 — 상어를 쫓아내요!' },
  turtle: { ic:'🐢', n:'바다거북', say:'바다거북이 등껍질로 막아 줘요 (보호막 +40)' },
  seal:   { ic:'🦭', n:'물개', say:'물개가 곁에서 쉬게 해 줘요 (천천히 회복)' },
  whale:  { ic:'🐋', n:'고래', say:'고래가 큰 물살로 바다를 쓸어 줘요!' },
  gull:   { ic:'🕊️', n:'갈매기', say:'갈매기가 조개를 물어다 줘요 (+5🐚)' },
};
const BOONS = [
  { k:'leash', ic:'🪢', n:'튼튼한 리쉬', d:'최대 체력 +30', f:s=>{ s.maxHp += 30; s.hp += 30; } },
  { k:'wax',   ic:'🕯️', n:'새 왁스', d:'공격 속도 +20%', f:s=>{ s.cd *= 0.8; } },
  { k:'lesson',ic:'📘', n:'코치님 한마디', d:'공격력 +5', f:s=>{ s.atk += 5; } },
  { k:'fin',   ic:'🛹', n:'새 핀', d:'물보라가 두 마리까지 맞아요', f:s=>{ s.multi = Math.max(s.multi, 2); } },
  { k:'whistle',ic:'🎵', n:'돌고래 휘파람', d:'바다 친구가 더 자주 와요', f:s=>{ s.palRate += 0.12; } },
  { k:'shell', ic:'🐢', n:'거북 부적', d:'보호막 30으로 시작', f:s=>{ s.shield += 30; } },
  { k:'wet',   ic:'🧥', n:'두꺼운 웻수트', d:'받는 피해 -20%', f:s=>{ s.def *= 0.8; } },
  { k:'snack', ic:'🍙', n:'든든한 간식', d:'체력 +25', f:s=>{ s.maxHp += 25; s.hp += 25; } },
];

let cv, ctx, me = null, meImg = '', legImg = '', raf = 0, last = 0, acc = 0, speed = 1, auto = true, S = null, sel = 0, T = null, tmr = 0;
const sndOn = () => { try{ return localStorage.getItem('lineup.share.snd') === '1'; }catch(e){ return false; } };
let AC = null;
function beep(f0, f1, dur, vol){ if(!sndOn()) return; try{ AC ||= new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
  o.type = 'triangle'; o.frequency.setValueAtTime(f0, t); if(f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(vol || 0.04, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + .02); }catch(e){} }
const look = () => { try{ return withLook(ME.profile || {}, ME.name); }catch(e){ return {}; } };
function mkMe(){ const c = document.createElement('canvas'); try{ const q = look(); drawSpr(c, avatarRows(q, false), avatarTintOf(q, 0)); }catch(e){ c.width = 24; c.height = 24; } return c; }
/* 대화 초상·지도 말 — 앱의 모찌 캐릭터 그대로. 마지막 장은 전설 보드를 든 모습 */
function svgUrl(pr, uid){ try{ return typeof mochiSVG === 'function' ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(mochiSVG(pr, { charm:2, pet:true, uid })) : ''; }catch(e){ return ''; } }
const rnd = Math.random, pick = a => a[Math.floor(rnd() * a.length)];

/* 진행 — 모은 조각 수(0~N). 서버에서 온 값이라도 숫자로 가둔다 */
const qbOf = () => (ME && ME.profile && ME.profile.play && ME.profile.play.qb) || {};
const gotN = () => { const x = Math.floor(+qbOf().ch); return Number.isFinite(x) ? Math.max(0, Math.min(N, x)) : 0; };
const openTo = () => qbOf().legend ? N - 1 : Math.min(N - 1, gotN());          // 갈 수 있는 마지막 장 — 예전 원정을 깬 서퍼는 다 열려 있다
const ovEl = cls => { const ov = $q('q-ov'); ov.className = 'game-ov' + (cls ? ' ' + cls : ''); ov.hidden = false; ov.onclick = ov.onkeydown = null; return ov; };
function clearT(){ clearTimeout(tmr); tmr = 0; if(T){ clearInterval(T.iv); T = null; } }

/* ── 지도 — 해안을 따라 북→남. 지난 마을은 조각, 고른 마을엔 내 캐릭터, 그 뒤는 잠김 ── */
function map(keep){
  clearT(); S = null; window._gameRun = false;
  const got = gotN(), op = openTo(), ov = ovEl('qv-map'), y0 = keep ? ov.scrollTop : 0;
  sel = Math.max(0, Math.min(op, sel));
  ov.innerHTML = `<div class="qm"><div class="qm-hd"><b>🗺️ 강원 해안 원정</b><span>🧩 ${got}/${N}</span></div>
    <div class="qm-bar" role="progressbar" aria-label="모은 봉인 조각" aria-valuemin="0" aria-valuemax="${N}" aria-valuenow="${got}"><i style="width:${got / N * 100}%"></i></div>
    <p class="qm-tip">${got >= N ? '🏄 봉인을 풀었어요! 마을을 골라 다시 놀러 가요' : `📍 다음 목적지 — <b>${esc(CH[got].n)}</b><br>마을 이야기를 듣고 바다를 지키면 봉인 조각을 받아요`}</p>
    <ol class="qm-ls">${CH.map((c, i)=>{ const st = i < got ? 'done' : i === got ? 'now' : i <= op ? 'open' : 'lock';
      return `<li><button type="button" class="qm-n ${st}${i === sel ? ' sel' : ''}" data-ch="${i}"${st === 'lock' ? ' disabled' : ''} aria-pressed="${i === sel}">
        <span class="qm-d" aria-hidden="true">${st === 'done' ? '🧩' : st === 'lock' ? '🔒' : i + 1}</span>
        <span class="qm-t"><b>${esc(c.n)}${c.boss ? ' ⚠️' : ''}</b><small>제${i + 1}장 · ${st === 'lock' ? '아직 잠겨 있어요' : esc(c.s)}</small></span>
        ${i === sel ? (meImg ? `<img class="qm-me" src="${meImg}" alt="내 캐릭터">` : '<span class="qm-me">🏄</span>') : ''}</button></li>`; }).join('')}</ol>
    <div class="qm-ft"><button class="btn blue" id="q-go" type="button">▶ 제${sel + 1}장 ${sel < got ? '다시 하기' : '떠나기'} — ${esc(CH[sel].n)}</button></div></div>`;
  ov.querySelectorAll('[data-ch]').forEach(b=>b.onclick = ()=>{ sel = +b.dataset.ch; map(true); });
  $q('q-go').onclick = e=>{ e.stopPropagation(); start(sel); };              // 덮개까지 번지면 방금 단 '제목 넘기기'가 바로 눌린다
  const b = ov.querySelector('.qm-n.sel');
  ov.scrollTop = keep ? y0 : (b ? b.offsetTop + b.offsetParent.offsetTop - ov.clientHeight / 2 + 20 : 0);
  const l = $q('q-log'); if(l) l.innerHTML = `<div>🗺️ ${got >= N ? '봉인을 풀었어요 — 전설의 보드 보유' : `다음 목적지 — ${esc(CH[got].n)} (${esc(CH[got].d)})`}</div><div style="opacity:.75">마을을 누르고 아래 버튼으로 떠나요 · 깬 마을은 다시 할 수 있어요</div>`;
}

/* ── 한 장 — 제목 카드 → 대화 → 준비물 → 전투 → 대화 → 보상 ── */
function session(k){
  S = { k, mode:'title', hp:100, maxHp:100, atk:11, cd:0.8, cdT:0, def:1, multi:1, shield:0, startShield:0, palRate:0.22,
        foes:[], pals:[], fx:[], log:[], t:0, killed:0, need:CH[k].need, spawnT:1.2, shells:0, whale:false, boons:[], bossOut:false, res:null, gifts:[] };
  for(let j = 0; j < k; j++) if(CH[j].gift){ CH[j].gift.f(S); S.gifts.push(CH[j].gift.ic); }   // 앞 마을들의 선물 — 이야기로 강해진다
  S.shield = S.startShield; window._gameRun = true;                            // 원정 중엔 다른 알림 카드가 덮지 않게
}
function start(k){
  session(k); const c = CH[k], ov = ovEl('qv-title');
  ov.innerHTML = `<div class="qtt" role="button" tabindex="0" aria-label="이야기 시작"><small>제 ${k + 1} 장</small><b>${esc(c.s)}</b><span>${esc(c.lm)} ${esc(c.n)}</span><p>${esc(c.d)}</p></div>`;
  log(`📍 ${c.n} — ${c.d}`);
  const go = ()=>{ if(S && S.mode === 'title'){ clearTimeout(tmr); talk(c.pre, pickPhase); } };
  ov.onclick = go; ov.onkeydown = e=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } };
  tmr = setTimeout(go, RM ? 1200 : 2000);
}
function who(w){
  const c = CH[S.k];
  if(w === 'm') return { img:meImg, ic:'🏄', n:ME.name || '나' };
  if(w === 'L') return { img:legImg || meImg, ic:'🏄', n:ME.name || '나' };
  return w === 'a' || w === 'b' ? c[w] : null;                                   // n = 해설(초상 없음)
}
function talk(lines, done){
  clearT(); S.mode = 'talk'; T = { lines, i:0, done, n:0, iv:0 }; line();
}
function line(){
  const ov = ovEl('qv-talk'), [w, txt] = T.lines[T.i], sp = who(w);
  S.spk = w;
  ov.innerHTML = `<button class="btn sm ghost qt-sk" id="q-sk" type="button">건너뛰기 ⏭</button>
    <div class="qt${sp ? '' : ' nar'}" id="q-tb" role="button" tabindex="0" aria-label="다음 대사 (${T.i + 1}/${T.lines.length})">
    ${sp ? `<div class="qt-pt" aria-hidden="true">${sp.img ? `<img src="${sp.img}" alt="">` : esc(sp.ic)}</div>` : ''}
    <div class="qt-bd">${sp ? `<b class="qt-n">${esc(sp.n)}</b>` : ''}<p class="qt-x" id="q-tx" aria-hidden="true"></p><span class="qt-sr">${esc(txt)}</span></div><i class="qt-nx" aria-hidden="true">▼</i></div>`;
  const tx = $q('q-tx'), chars = Array.from(txt);
  T.n = RM ? chars.length : 0; tx.textContent = chars.slice(0, T.n).join('');
  if(T.n < chars.length) T.iv = setInterval(()=>{ T.n++; tx.textContent = chars.slice(0, T.n).join(''); if(T.n >= chars.length){ clearInterval(T.iv); T.iv = 0; } }, 28);   // 한 글자씩 — 읽는 속도를 이야기가 정한다
  T.full = ()=>{ clearInterval(T.iv); T.iv = 0; T.n = chars.length; tx.textContent = txt; };
  const tb = $q('q-tb'); tb.onclick = next; tb.onkeydown = e=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); next(); } };
  $q('q-sk').onclick = e=>{ e.stopPropagation(); const d = T.done; clearT(); d(); };
  try{ tb.focus({ preventScroll:true }); }catch(e){}
}
function next(){
  if(!T) return;
  if(T.iv){ T.full(); return; }                                                  // 타자 중이면 먼저 한 줄을 다 보여 준다
  T.i++; if(T.i < T.lines.length){ line(); return; }
  const d = T.done; clearT(); d();
}
function pickPhase(){
  if(!S) return;
  S.choices = []; const pool = BOONS.slice(); while(S.choices.length < 3) S.choices.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  S.mode = 'pick'; S.pickT = 2.2; render();                                      // 자동이면 2.2초 뒤 알아서 고른다
}
function choose(k){
  const b = S && S.choices && S.choices[k]; if(!b || S.mode !== 'pick') return;
  b.f(S); S.boons.push(b.ic); log(`${b.ic} ${b.n} 챙겼어요 — ${b.d}`); S.mode = 'go'; render(); beep(523, 784, 0.12);
}
function log(t){ if(!S) return; S.log.unshift({ t, at:S.t }); S.log = S.log.slice(0, 40); paintLog(); }

/* 적 만들기 — 남쪽 마을일수록 세진다 */
function spawn(kind){
  const F = FOES[kind], k = F.boss ? 1 : 1 + S.k * 0.1;
  S.foes.push({ kind, ...F, hp:Math.round(F.hp * k), max:Math.round(F.hp * k), atk:F.atk * (F.boss ? 1 : 1 + S.k * 0.06), x:W + 20, y:SEA - (F.boss ? 18 : 6) + (rnd() * 6 - 3), hitT:0, wob:rnd() * 6 });
  if(F.boss) log(`⚠️ ${F.ic} ${F.n} 등장!`);
}
function spawnTick(dt){
  const c = CH[S.k];
  if(c.boss){ if(!S.bossOut){ S.bossOut = true; spawn(c.boss); } if(rnd() < dt * 0.35) spawn(pick(c.fo)); return; }
  S.spawnT -= dt; if(S.spawnT > 0 || S.killed + S.foes.length >= S.need) return;
  spawn(pick(c.fo)); if(rnd() < 0.2 && S.killed + S.foes.length < S.need) spawn('crab');
  S.spawnT = Math.max(0.8, 2.1 - S.k * 0.1) * (0.7 + rnd() * 0.6);
}
function palTick(dt){
  if(rnd() > dt / 6 * (S.palRate / 0.22) * 0.9) return;
  if(rnd() > S.palRate * 2.2) return;
  const r = rnd(), k = r < 0.34 ? 'dolphin' : r < 0.56 ? 'turtle' : r < 0.76 ? 'seal' : r < 0.92 ? 'gull' : (!S.whale ? 'whale' : 'dolphin');
  const P = PALS[k]; log(`${P.ic} ${P.say}`); beep(660, 990, 0.15);
  if(k === 'turtle'){ S.shield += 40; S.fx.push({ k:'txt', x:40, y:SEA - 50, t:0, v:'🛡 +40' }); }
  else if(k === 'gull'){ S.shells += 5; S.fx.push({ k:'txt', x:60, y:SEA - 60, t:0, v:'🐚 +5' }); }
  else if(k === 'whale'){ S.whale = true; S.foes.forEach(f=>{ f.hp -= f.boss ? 60 : 9999; }); S.fx.push({ k:'whale', t:0 }); }
  S.pals.push({ k, t:0, life:k === 'dolphin' ? 18 : k === 'seal' ? 10 : k === 'whale' ? 2.5 : 3, cd:0, x:20 + rnd() * 40 });
}

function step(dt){
  const s = S; if(!s) return; s.t += dt;
  s.fx.forEach(f=>f.t += dt); s.fx = s.fx.filter(f=>f.t < (f.k === 'whale' ? 2.5 : 0.9));
  if(s.mode === 'pick'){ if(auto){ s.pickT -= dt; if(s.pickT <= 0) choose(Math.floor(rnd() * 3)); } return; }
  if(s.mode !== 'go') return;
  spawnTick(dt); palTick(dt);
  const sx = 46;
  for(const f of s.foes){
    const reach = sx + 12 + f.r;
    if(f.x > reach) f.x -= f.sp * dt;
    else{
      if(f.crash){ hurt(f.atk, f); f.hp = 0; s.fx.push({ k:'splash', x:sx + 10, y:SEA - 10, t:0 }); continue; }
      f.hitT -= dt; if(f.hitT <= 0){ f.hitT = f.rate; hurt(f.atk, f); }
    }
  }
  for(const p of s.pals){ p.t += dt;
    if(p.k === 'dolphin'){ p.cd -= dt; if(p.cd <= 0){ const f = s.foes.filter(x=>x.hp > 0).sort((a,b)=>a.x - b.x)[0]; if(f){ f.hp -= 8; p.cd = 0.6; s.fx.push({ k:'zap', x:f.x, y:f.y, t:0, c:'#7BE0FF' }); } } }
    if(p.k === 'seal') s.hp = Math.min(s.maxHp, s.hp + 2.2 * dt);
  }
  s.pals = s.pals.filter(p=>p.t < p.life);
  s.cdT -= dt;
  if(s.cdT <= 0){
    const tg = s.foes.filter(f=>f.hp > 0 && f.x < sx + 120).sort((a,b)=>a.x - b.x).slice(0, s.multi);
    if(tg.length){ tg.forEach(f=>{ f.hp -= s.atk; s.fx.push({ k:'zap', x:f.x, y:f.y, t:0, c:'#FFFFFF' }); }); s.cdT = s.cd; beep(880, 660, 0.05, 0.02); }
  }
  for(const f of s.foes) if(f.hp <= 0 && !f.dead){ f.dead = true; s.killed++; if(f.boss) log(`🏆 ${f.ic} ${f.n}를 넘었어요!`); else if(rnd() < 0.3) s.shells++; }
  s.foes = s.foes.filter(f=>!f.dead);
  if(s.hp <= 0) return end(false);
  const c = CH[s.k];
  if(c.boss ? s.bossOut && !s.foes.some(f=>f.boss) : s.killed >= s.need) end(true);
}
function hurt(n, f){
  let d = n * S.def;
  if(S.shield > 0){ const a = Math.min(S.shield, d); S.shield -= a; d -= a; }
  if(d > 0){ S.hp -= d; S.fx.push({ k:'txt', x:40, y:SEA - 44, t:0, v:'-' + Math.round(d), c:'#FF6B6B' }); }
  if(f.kind === 'shark' && rnd() < 0.3) log('🦈 상어가 물었어요!');
  if(f.kind === 'wave') log('🌊 성난 파도에 맞았어요!');
  try{ if(typeof vib === 'function') vib(8); }catch(e){}
}
/* 장 끝 — 이기면 조각 기록(qb.ch)·마을 사례 조개, 마지막 장이면 전설. 지면 조개만 챙기고 다시 */
function end(win){
  const k = S.k, lastCh = k === N - 1;
  S.foes = []; S.res = win ? 'win' : 'lose'; S.mode = 'done'; window._gameRun = false;
  if(win) S.shells += 3 + k;
  let r = { best:k, gain:0 };
  try{ if(typeof playQuestDone === 'function') r = playQuestDone(k, win && lastCh, S.shells, win) || r; }catch(e){}
  S.r = r;
  log(win ? `✅ ${CH[k].n}의 바다를 지켰어요` : `💤 ${CH[k].n}에서 쓰러졌어요`);
  if(win){ beep(523, 1047, 0.3); talk(CH[k].post, lastCh ? legend : reward); } else lost();
}
const stats = () => `<div class="go-st"><span>장<b>${S.k + 1}/${N}</b></span><span>쓰러뜨림<b>${S.killed}</b></span><span>조개<b>${S.shells}</b></span><span>XP<b>+${S.r && S.r.gain || 0}</b></span></div>`;
function reward(){
  const c = CH[S.k], k = S.k, ov = ovEl('');
  S.mode = 'card';
  ov.innerHTML = `<div class="go-card"><div class="qpc" aria-hidden="true">🧩</div><div class="go-t">봉인 조각 ${gotN()}/${N}</div>
    <div class="go-d">${esc(c.n)}의 매듭 조각을 받았어요</div>
    ${c.gift ? `<div class="q-gift"><i aria-hidden="true">${c.gift.ic}</i><span><b>🎁 ${esc(c.gift.n)}</b><small>다음 장부터 계속 · ${esc(c.gift.d)}</small></span></div>` : ''}
    ${stats()}<button class="btn blue" id="q-next" type="button" style="width:100%;min-height:52px;font-size:16px">🗺️ 다음 마을 — ${esc(CH[k + 1].n)}</button></div>`;
  $q('q-next').onclick = ()=>{ sel = k + 1; map(); };
  if(typeof popNext === 'function') setTimeout(popNext, 1200);
}
function legend(){
  const ov = ovEl(''); S.mode = 'card';
  ov.innerHTML = `<div class="go-card">${legImg ? `<img class="q-leg" src="${legImg}" alt="전설의 보드를 든 내 캐릭터">` : '<div class="qpc">🏄</div>'}
    <div class="go-t">🏆 전설의 보드!</div><div class="go-d">열한 마을의 조각으로 봉인을 풀었어요.<br>캐릭터 꾸미기 → 보드 색에 <b>‘전설’</b>이 열렸어요.</div>
    ${stats()}<button class="btn blue" id="q-next" type="button" style="width:100%;min-height:52px;font-size:16px">🗺️ 지도로</button></div>`;
  $q('q-next').onclick = ()=>{ sel = N - 1; map(); };
  if(typeof popNext === 'function') setTimeout(popNext, 1200);
}
function lost(){
  const c = CH[S.k], k = S.k, ov = ovEl(''); S.mode = 'card';
  ov.innerHTML = `<div class="go-card"><div class="go-t">💤 마을에서 눈을 떴어요</div>
    <div class="go-d">${esc(c.n)} 바다가 아직 거칠어요.<br>${esc(c.a.n)}: “쉬었다 다시 가 보렴.”</div>${stats()}
    <div class="go-b">챙긴 것 ${[...S.gifts, ...S.boons].join(' ') || '—'}</div>
    <div class="q-ctl" style="margin-top:0"><button class="btn blue" id="q-again" type="button">🔁 다시 도전</button><button class="btn ghost" id="q-map" type="button">🗺️ 지도</button></div></div>`;
  $q('q-again').onclick = ()=>{ session(k); log(`📍 ${c.n} — 다시 도전`); pickPhase(); };            // 다시 할 땐 대화는 건너뛴다
  $q('q-map').onclick = ()=>{ sel = k; map(); };
  if(typeof popNext === 'function') setTimeout(popNext, 1200);
}

/* ── 그리기 ── */
function Rq(c, x, y, w, h){ ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
function draw(){
  const s = S, k = s ? s.k : sel, c = CH[k], t = s ? s.t : performance.now() / 1000;
  Rq(c.sky[0], 0, 0, W, 60); Rq(c.sky[1], 0, 60, W, 60);
  Rq(k >= 9 ? '#3E4A73' : '#4E7A5A', 0, 108, W, 12); for(let i = 0; i < 12; i++) Rq(k >= 9 ? '#34406A' : '#3F6A4C', i * 22, 100 + (i % 3) * 3, 14, 8);
  ctx.textBaseline = 'top'; ctx.font = '14px sans-serif'; ctx.fillText(c.lm, 206, 92);           // 마을 표지 — 대관람차·간이역 같은 그곳의 것
  Rq('#2E7FC0', 0, 120, W, 30); Rq('#2569A8', 0, SEA, W, H - SEA);
  if(k === N - 1 && (!s || s.mode !== 'go')){ ctx.globalAlpha = 0.35 + Math.sin(t * 2) * 0.15; Rq('#F4C430', 150, SEA + 30, 60, 6); Rq('#F4C430', 165, SEA + 24, 30, 4); ctx.globalAlpha = 1; }   // 바다 밑 봉인의 빛
  for(let i = 0; i < 18; i++){ const x = ((i * 31 - t * 20) % 260 + 260) % 260 - 10; Rq('rgba(255,255,255,.35)', x, 128 + (i % 4) * 7, 10, 1); Rq('rgba(255,255,255,.25)', x + 6, SEA + 10 + (i % 5) * 16, 14, 1); }
  if(!s) return;
  ctx.font = '8px Galmuri11, sans-serif';
  Rq('rgba(20,30,50,.75)', 0, 0, W, 16); ctx.fillStyle = '#FFE27A'; ctx.fillText(`제${s.k + 1}장 ${c.n}`, 4, 4);
  ctx.fillStyle = '#FFFFFF'; ctx.fillText(`🐚${s.shells}`, W - 30, 4);
  const boss = s.foes.find(f=>f.boss), prog = c.boss ? (boss ? 1 - boss.hp / boss.max : s.bossOut ? 1 : 0) : s.killed / Math.max(1, s.need);
  Rq('rgba(0,0,0,.3)', 4, 18, W - 8, 3); Rq('#FFE27A', 4, 18, (W - 8) * Math.min(1, prog), 3);
  const bob = RM ? 0 : Math.round(Math.sin(t * 5) * 1.5), sy = SEA - 22 + bob;
  Rq('#FF6B6B', 34, sy + 22, 22, 3); if(me) ctx.drawImage(me, 33, sy);
  if(s.mode !== 'go'){                                                                // 대화 중 — 마을 인물이 바다 쪽에 서 있다. 말하는 쪽이 살짝 뛴다
    [['a', 168], ['b', 200]].forEach(([w, x])=>{ const p = c[w]; if(!p || (w === 'b' && p === GULL && s.spk !== 'b')) return;
      const big = w === 'a' && c.boss, hop = s.spk === w && !RM ? Math.abs(Math.sin(performance.now() / 160)) * 4 : 0;
      ctx.font = (big ? 30 : 18) + 'px sans-serif'; ctx.fillText(p.ic, x - (big ? 10 : 0), SEA - (big ? 30 : 20) - hop); });
    return;
  }
  if(s.shield > 0){ ctx.strokeStyle = 'rgba(123,224,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(45, sy + 12, 17, 0, 6.3); ctx.stroke(); }
  Rq('rgba(0,0,0,.35)', 24, sy - 8, 44, 4); Rq(s.hp / s.maxHp > 0.35 ? '#4ADE80' : '#FF6B6B', 24, sy - 8, 44 * Math.max(0, s.hp / s.maxHp), 4);
  if(s.shield > 0) Rq('#7BE0FF', 24, sy - 3, Math.min(44, 44 * s.shield / 60), 2);
  s.pals.forEach((p, i)=>{ const px = p.k === 'whale' ? 60 + p.t * 60 : p.x + Math.sin(p.t * 3 + i) * 10, py = p.k === 'gull' ? 40 + Math.sin(p.t * 4) * 6 : p.k === 'whale' ? SEA + 10 : SEA + 6 + Math.sin(p.t * 4 + i) * 3;
    ctx.font = p.k === 'whale' ? '26px sans-serif' : '14px sans-serif'; ctx.fillText(PALS[p.k].ic, px, py); });
  s.foes.forEach(f=>{ const wob = Math.sin(t * 4 + f.wob) * 2; ctx.font = (f.boss ? 34 : f.kind === 'wave' ? 20 : 15) + 'px sans-serif'; ctx.fillText(f.ic, f.x - f.r, f.y - f.r + wob);
    Rq('rgba(0,0,0,.35)', f.x - f.r, f.y - f.r - 6, f.r * 2, 3); Rq('#FF6B6B', f.x - f.r, f.y - f.r - 6, f.r * 2 * Math.max(0, f.hp / f.max), 3); });
  s.fx.forEach(f=>{
    if(f.k === 'zap'){ ctx.globalAlpha = 1 - f.t / 0.9; ctx.strokeStyle = f.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, 4 + f.t * 14, 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1; }
    else if(f.k === 'txt'){ ctx.globalAlpha = 1 - f.t / 0.9; ctx.font = '9px Galmuri11, sans-serif'; ctx.fillStyle = f.c || '#FFE27A'; ctx.fillText(f.v, f.x, f.y - f.t * 18); ctx.globalAlpha = 1; }
    else if(f.k === 'splash'){ ctx.globalAlpha = 1 - f.t / 0.9; Rq('#FFFFFF', f.x - 10, f.y - f.t * 20, 20, 4); ctx.globalAlpha = 1; }
    else if(f.k === 'whale'){ ctx.globalAlpha = Math.max(0, 0.5 - f.t / 5); Rq('#BFEFFF', 0, SEA - 30, W * Math.min(1, f.t / 0.8), 40); ctx.globalAlpha = 1; } });
}
function paintLog(){ const el = $q('q-log'); if(!el || !S) return; el.innerHTML = S.log.slice(0, 6).map((l, i)=>`<div style="opacity:${1 - i * 0.13}">${esc(l.t)}</div>`).join(''); }

/* 준비물 고르기 카드 — 자동이면 잠깐 보여 주고 알아서 고른다 */
function ctl(){
  const sp = $q('q-speed'); if(sp) sp.textContent = `⏩ ${speed}배`;
  const au = $q('q-auto'); if(au){ au.textContent = auto ? '🤖 자동 고르기 켜짐' : '✋ 직접 고르기'; au.setAttribute('aria-pressed', String(auto)); }
}
function render(){
  ctl(); if(!S) return;
  if(S.mode === 'pick'){
    const c = CH[S.k], ov = ovEl('');
    ov.innerHTML = `<div class="go-card"><div class="go-t">🎒 떠나기 전 준비물</div><div class="go-d">${esc(c.n)} 바다로 — 하나만 챙길 수 있어요${S.gifts.length ? `<br>마을 선물 ${S.gifts.join(' ')} 은 이미 챙겼어요` : ''}</div>
      <div class="q-pick">${S.choices.map((b, i)=>`<button type="button" class="q-b" data-qb="${i}"><i>${b.ic}</i><b>${esc(b.n)}</b><small>${esc(b.d)}</small></button>`).join('')}</div>
      <div class="go-b" style="margin:8px 0 0">${auto ? '🤖 자동 — 곧 알아서 골라요 (눌러서 직접 골라도 돼요)' : '하나 골라 주세요'}</div></div>`;
    ov.querySelectorAll('[data-qb]').forEach(b=>b.onclick = ()=>choose(+b.dataset.qb));
  } else if(S.mode === 'go') $q('q-ov').hidden = true;
}

function loop(ts){
  raf = requestAnimationFrame(loop);
  if(!last) last = ts; let dt = Math.min(0.033, (ts - last) / 1000); last = ts;
  if(S && !S.paused && (S.mode === 'go' || S.mode === 'pick')){ acc += dt * speed; let n = 0; while(acc >= FIX && n++ < 30){ step(FIX); acc -= FIX; if(!S || (S.mode !== 'go' && S.mode !== 'pick')) break; } }
  else{ acc = 0; if(S) S.t += dt; }
  draw();
  const hp = $q('q-hp'); if(hp) hp.textContent = S && S.mode === 'go' ? `❤️ ${Math.max(0, Math.round(S.hp))}/${S.maxHp}${S.shield > 0 ? ` 🛡${Math.round(S.shield)}` : ''}` : `🧩 ${gotN()}/${N}`;
}

function questOpen(){
  cv = $q('q-cv'); ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  $q('quest').hidden = false; document.body.classList.add('game-on');
  me = mkMe(); const lk = look(); meImg = svgUrl(lk, 'qme'); legImg = svgUrl({ ...lk, boardc:'legend' }, 'qlg');
  S = null; sel = Math.min(gotN(), openTo()); ctl(); map(); last = 0; acc = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
}
function questClose(){ cancelAnimationFrame(raf); raf = 0; clearT(); S = null; window._gameRun = false; $q('quest').hidden = true; document.body.classList.remove('game-on');
  if(typeof playTick === 'function') playTick(); if(typeof renderHub === 'function' && typeof state !== 'undefined' && state.tab === 'play') renderHub(); }
function wire(){
  if(wire.done || !$q('quest')) return; wire.done = true;
  $q('q-x').onclick = questClose;
  $q('q-speed').onclick = ()=>{ speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; ctl(); };
  $q('q-auto').onclick = ()=>{ auto = !auto; try{ localStorage.setItem('lineup.share.qauto', auto ? '1' : '0'); }catch(e){} render(); };
  try{ auto = localStorage.getItem('lineup.share.qauto') !== '0'; }catch(e){}
  addEventListener('keydown', e=>{ if(!$q('quest').hidden && e.key === 'Escape') questClose(); });
  document.addEventListener('visibilitychange', ()=>{ if(S) S.paused = document.hidden; last = 0; });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
window.questOpen = questOpen; window.questClose = questClose;
window._quest = { get S(){ return S; }, step, start, session, pickPhase, choose, next, map, CH, FOES, N, set auto(v){ auto = v; }, FIX,
  skip(){ if(T){ const d = T.done; clearT(); d(); } } };
})();
