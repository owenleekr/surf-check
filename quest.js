/* ── 🗺️ 전설의 보드 원정 — 강원 해안 마을 탐험 RPG ──────────────────────────────
   장르: 마을을 걸어 다니며 주민과 대화하고 부탁(퀘스트)을 들어주며 캐릭터와 동료를 키우는 RPG.
   고성 아야진 → 삼척 장호항 11마을. 마을마다 부탁 셋(① 해변의 몬스터 물리치기 ② 흩어진 물건 모으기 ③ 누군가에게 전하기)을
   마치면 해변 끝에 보스가 나타나고, 보스를 넘으면 봉인 조각·동료 합류·다음 마을이 열린다. 전설의 보드 이야기는 마을 사람들의 대사로 흐른다.
   전투는 예전 자동 전투 엔진 그대로(동료 최대 4명 앞줄·뒷줄, 기력이 차면 초상을 눌러 필살기). 키우기 — 동료 경험치 레벨,
   조개(🐚)로 ⭐ 성급·장비(보드·슈트) 강화, 🔧 강화소 보너스. 해변 순찰 몬스터로 언제든 레벨 업, 떠나 있던 동안 방치 보상(최대 8시간).
   진행은 프로필 play.qb — sg(마친 부탁 수 = 옛 깬 스테이지 수)·st 별·hx 경험치·hs 성급·fm 편성·it 방치 시각·qp 진행 중 부탁·eq 장비.
   옛 ch 는 sg=ch×4 로 옮긴다. 마지막 보스를 넘으면 전설의 보드(BOARDC.legend).
   화면 — 맨 아래 장면 SVG(#q-bg) / 걷기 층(#q-wv, DOM) 또는 240×240 전투 캔버스(투명) / 맨 위 DOM 덮개(대화·지도·가방·편성·카드).
   전투 물리는 1/60초 고정, 배속(×1·×2)만 바꾼다. */
(function(){
const W = 240, H = 240, SEA = 150, FIX = 1 / 60, HZ = 118;
const $q = id => document.getElementById(id);
const RM = (()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })();   // 줄줄이 타자·카메라 흔들림을 끈다

/* 이야기 — 전설의 서퍼 '윤슬'이 큰 너울을 잠재우고 보드를 바다 밑에 봉인, 매듭을 열한 마을에 나눠 맡겼다.
   봉인을 노리는 '검은 너울'의 서퍼(정체는 윤슬의 제자 흑조)가 한발 앞서 다니고, 길동무(끼룩·꽃게 대장·몽돌·파랑)가 하나씩 붙는다.
   정동진에서 흑조의 이유가 밝혀지고, 망상에서 '윤슬은 수호자가 되어 바다 밑에 있다'는 반전, 장호항에서 화해·봉인 해제.
   대사 줄: [누가, 말] — n 해설(영화 띠) · m 나 · L 전설 보드 든 나 · a/b 마을 인물 · 그 밖은 CAST(다시 나오는 인물) */
const GULL = { ic:'🕊️', n:'갈매기 끼룩' };
const CAST = {
  gull:GULL, crab:{ ic:'🦀', n:'꽃게 대장' }, seal:{ ic:'🦭', n:'물개 몽돌' }, dol:{ ic:'🐬', n:'돌고래 파랑' },
  huk0:{ ic:'🏄‍♂️', n:'검은 서퍼', fx:'sil' }, huk:{ ic:'🏄‍♂️', n:'흑조', fx:'sil' }, yun:{ ic:'🏄‍♀️', n:'윤슬', fx:'gold' },
};
/* 장 — 실제 지명, 한 줄 설명은 널리 알려진 것만. tod 는 장면 시간대(여정이 새벽→낮→노을→밤→폭풍→새벽으로 흐른다),
   alt 는 이긴 뒤 바뀌는 하늘(정동진 해돋이·장호항 새벽). fo 는 나오는 위협(여러 번 적을수록 자주), need 는 넘어야 할 수 */
const CH = [
  { n:'고성 아야진해변', d:'작은 항구를 품은 고성의 해변', s:'바다가 보낸 편지', lm:'⚓', tod:'dawn',
    a:{ ic:'🧓', n:'해녀 할머니' }, b:GULL, fo:['jelly','jelly','crab'], need:6,
    gift:{ ic:'🪢', n:'해녀 할머니의 리쉬', d:'체력 +15', f:s=>{ s.maxHp += 15; s.hp += 15; } },
    pre:[['n','오래전, 열흘 밤낮 그치지 않는 큰 너울이 강원 바다를 덮쳤어요.'],
         ['n','금빛 보드를 탄 서퍼 윤슬이 너울 꼭대기에서 바다를 달랬고, 그 보드를 바다 밑에 봉인했대요.'],
         ['a','봉인 매듭은 열한 조각으로 나눠 마을마다 맡겼지. 우리 아야진이 첫 조각이란다.'],
         ['a','근데 요 며칠 새벽마다 바다가 검게 울어. 매듭이 느슨해진 게야.'],
         ['m','제가 조각을 모아서 매듭을 다시 묶을게요!'],
         ['gull','끼룩! 바닷길은 내가 안내할게. 난 끼룩, 이 바다 토박이야!']],
    post:[['a','허허, 손이 야무지구먼. 첫 조각이다. 내 리쉬도 가져가.'], ['a','리쉬는 끝까지 놓지 않는 마음이란다. 잊지 말거라.'], ['gull','끼룩! 다음은 천진. 물이 맑아서 바닥까지 보여!']] },
  { n:'고성 천진해변', d:'물이 맑고 아담한 고성의 해변', s:'맑은 물 아래 집게', lm:'🪨', tod:'morning',
    a:GULL, b:{ ic:'🦀', n:'꽃게 대장' }, fo:['crab','crab','jelly'], need:7,
    gift:{ ic:'🦀', n:'꽃게 집게 부적', d:'공격력 +2', f:s=>{ s.atk += 2; } },
    pre:[['a','저기 바위 아래! 꽃게들이 반짝이는 걸 물고 있어.'],
         ['b','이건 우리가 지키는 조각이다! 가져가려면 우릴 넘어 봐라!'],
         ['m','빼앗으려는 게 아니야. 느슨해진 매듭을 다시 묶으려는 거야.'],
         ['b','말로는 누가 못 해? 집게로 증명해!']],
    post:[['b','집게가 얼얼하네… 너 진짜구나. 조각 가져가.'], ['b','나도 따라간다! 한번 물면 안 놓는 게 꽃게 자랑이거든.'], ['gull','끼룩, 길동무가 늘었다!']] },
  { n:'속초해변', d:'설악산을 등지고 선 속초의 큰 해변', s:'선장의 그물', lm:'🎡', tod:'day',
    a:{ ic:'🧔', n:'고깃배 선장' }, b:GULL, fo:['jelly','jelly','crab','shark'], need:8,
    gift:{ ic:'⚓', n:'선장의 닻 매듭', d:'보호막 15로 시작', f:s=>{ s.startShield += 15; } },
    pre:[['n','설악산이 내려다보는 속초 바다. 대관람차가 느릿느릿 돌고 있어요.'],
         ['a','밤마다 상어 떼가 그물을 찢어 놔. 근데 이상한 게 있어.'],
         ['a','상어 떼 뒤에 검은 슈트 입은 서퍼가 있더라고. 파도를 타는 게 아니라 끌고 다녀.'],
         ['crab','검은 너울이다! 우리 바위 밑까지 소문이 났어.'],
         ['m','일단 상어부터 막고 볼게요.']],
    post:[['a','이야, 오늘 밤은 발 뻗고 자겠구먼! 약속한 조각이다.'], ['a','닻 매듭도 얹어 주지. 첫 한 방은 꼭 버텨 줄 거다.'], ['gull','끼룩… 검은 서퍼라. 어디서 본 것 같은데.']] },
  { n:'양양 낙산해변', d:'낙산사 아래 긴 백사장', s:'의상대의 그림자', lm:'🛕', tod:'noon',
    a:{ ic:'🏄', n:'서핑 코치' }, b:GULL, fo:['jelly','jelly','crab','crab','shark','wave'], need:9,
    gift:{ ic:'🕯️', n:'코치의 왁스', d:'공격 속도 +10%', f:s=>{ s.cd *= 0.9; } },
    pre:[['n','낙산사 의상대 아래 긴 백사장. 바위 위에서 누군가 바다를 내려다보고 있어요.'],
         ['huk0','네가 조각 모은다는 서퍼구나. 수고했어. 나머진 내가 챙기지.'],
         ['m','당신이 검은 너울…? 조각을 모아서 뭘 하려고요?'],
         ['huk0','봉인을 푸는 거야. 이유는 알 필요 없어.'],
         ['a','신경 쓰지 마! 성난 파도 온다. 너울은 피하는 게 아니라 읽는 거야!']],
    post:[['a','좋아, 파도 보는 눈이 생겼네. 조각이랑 내 왁스 가져가.'], ['a','그 검은 서퍼 말이야… 옛날 윤슬 곁에 늘 꼬마 하나가 붙어 다녔대.'], ['gull','…끼룩. 다음은 죽도야. 몽돌이 기다릴 거야.']] },
  { n:'양양 죽도·인구해변', d:'서퍼들이 모이는 작은 섬 앞 해변', s:'서퍼 마을의 물개', lm:'🏝️', tod:'afternoon',
    a:{ ic:'🦭', n:'물개 몽돌' }, b:{ ic:'🏄‍♀️', n:'죽도 서퍼들' }, fo:['jelly','jelly','crab','crab','shark','shark','wave'], need:9,
    gift:{ ic:'🎵', n:'몽돌의 휘파람', d:'바다 친구가 더 자주 와요', f:s=>{ s.palRate += 0.08; } },
    pre:[['b','라인업이 엉망이야! 해파리랑 상어가 한꺼번에 몰려왔어.'],
         ['a','꾸웅… 검은 서퍼가 휘파람 한 번 부니까 다 몰려왔어.'],
         ['a','조각 지키느라 꼼짝도 못 했어. 같이 막아 줄래?'],
         ['m','서퍼끼리는 서로 돕는 거지. 가자!']],
    post:[['a','꾸웅! 고마워. 나도 같이 갈래. 이 휘파람이면 바다 친구들이 와 줘.'], ['b','다음은 하조대래. 바위 위에 오래 사신 거북 할아버지가 계셔.']] },
  { n:'양양 하조대', d:'바위 절벽과 소나무 정자의 바다', s:'바위 위의 거북', lm:'🌲', tod:'golden',
    a:{ ic:'🐢', n:'바다거북 할아버지' }, b:GULL, fo:['jelly','crab','crab','shark','shark','wave'], need:10,
    gift:{ ic:'🐢', n:'거북 등껍질', d:'받는 피해 -10%', f:s=>{ s.def *= 0.9; } },
    pre:[['n','해 기우는 하조대. 절벽 위 정자 아래, 커다란 거북이 쉬고 있어요.'],
         ['a','허어, 윤슬의 매듭을 모으는 아이로구나. 눈빛이 그 아이를 닮았어.'],
         ['a','윤슬에겐 제자가 하나 있었지. 스승이 사라진 날부터 바다만 보며 기다렸다더구나.'],
         ['m','설마… 그 검은 서퍼가?'],
         ['a','답은 바다가 알려 줄 게다. 우선 상어 떼부터 넘어 보거라.']],
    post:[['a','잘 버텼다. 내 등껍질 한 조각을 떼어 주마. 덜 아플 게다.'], ['seal','꾸웅, 배고파… 주문진 가면 맛있는 거 있대!'], ['a','허허, 그래. 배를 채우고 가거라. 먼 길이니라.']] },
  { n:'강릉 주문진항', d:'오징어·대게로 이름난 항구', s:'항구의 주먹밥', lm:'🦑', tod:'sunset',
    a:{ ic:'👩‍🍳', n:'시장 이모' }, b:GULL, fo:['jelly','crab','crab','shark','wave','wave'], need:11,
    gift:{ ic:'🍙', n:'이모의 주먹밥', d:'체력 +20', f:s=>{ s.maxHp += 20; s.hp += 20; } },
    pre:[['a','아이고, 얼굴이 반쪽이네! 일단 이거부터 먹어.'],
         ['a','아까 검은 옷 입은 청년이 와서 조각을 팔라더라. 눈빛이 짠해서 혼만 냈지.'],
         ['a','근데 그 뒤로 방파제 앞에 성난 파도가 계속 쳐. 배가 못 나가.'],
         ['crab','배도 채웠겠다, 집게 한번 걷어붙이자!']],
    post:[['a','장하다 우리 서퍼! 조각은 앞치마 주머니에 있었지 뭐야.'], ['a','주먹밥 넉넉히 쌌어. 그 청년 만나면 하나 나눠 줘. 밥은 먹고 다니는지…']] },
  { n:'강릉 경포해변', d:'경포호를 끼고 있는 강릉의 대표 해변', s:'다섯 번째 달', lm:'🏞️', tod:'dusk',
    a:{ ic:'🐬', n:'돌고래 파랑' }, b:GULL, fo:['jelly','jelly','crab','crab','shark','wave'], need:11,
    gift:{ ic:'🐬', n:'파랑의 지느러미 요령', d:'물보라가 두 마리까지 맞아요', f:s=>{ s.multi = Math.max(s.multi, 2); } },
    pre:[['n','달 뜨는 경포. 호수와 바다 사이로 반딧불이 떠다녀요.'],
         ['a','삐-익! 경포엔 달이 다섯 개 뜬대. 하늘, 호수, 바다, 술잔, 그리고 마주 본 눈.'],
         ['a','근데 오늘은 바다에 달이 안 비쳐. 검은 너울이 삼켜 버렸나 봐.'],
         ['m','바다 달을 되찾자. 같이 가 줄래?'],
         ['a','삐익! 몸부터 풀자!']],
    post:[['a','바다에 달이 돌아왔어! 너 물보라 진짜 빠르다.'], ['a','나도 끝까지 갈래. 지느러미 요령도 알려 줄게.'], ['gull','끼룩… 정동진은 해 뜨는 곳인데, 왠지 불길해.']] },
  { n:'강릉 정동진', d:'바다 바로 앞 기차역 — 해돋이 명소', s:'해가 뜨지 않는 역', lm:'🚉', tod:'night', alt:'sunrise', boss:'octo',
    a:{ ic:'🧑‍✈️', n:'간이역 역장' }, b:{ ic:'🐙', n:'대왕문어' }, fo:['jelly','crab'], need:1,
    gift:{ ic:'🌅', n:'정동진 해돋이 표', d:'공격력 +3', f:s=>{ s.atk += 3; } },
    pre:[['n','새벽 다섯 시, 해돋이 역. 해가 떠야 할 시간인데 하늘이 깜깜해요.'],
         ['a','첫차가 못 들어와요. 철길 옆 바다에 엄청 큰 문어가 먹물을 뿜고 있거든요.'],
         ['huk','왔구나. 문어는 내가 불렀어. 이제 그 조각들 넘겨.'],
         ['m','왜 그렇게까지 봉인을 풀려는 거예요?'],
         ['huk','스승님이 그랬어. 큰 너울이 다시 오면 돌아오겠다고. 그러니 내가 너울을 부를 거야.'],
         ['dol','삐익! 그럼 바다가 또 성나잖아! 막자!']],
    post:[['b','크윽… 먹물이 다 떨어졌다. 해를 가린 건 미안하다.'], ['n','문어가 물러나자 수평선이 붉게 타오르며 해가 떠올랐어요.'],
          ['huk','…스승님은 정말 돌아오지 않는 걸까.'], ['a','첫차 들어옵니다! 이 해돋이 표, 행운이 따른대요.']] },
  { n:'동해 망상해변', d:'동해시의 길고 넓은 백사장', s:'폭풍 속의 노래', lm:'🏕️', tod:'storm',
    a:{ ic:'🐋', n:'고래 할머니' }, b:GULL, fo:['jelly','crab','crab','shark','shark','wave','wave'], need:12,
    gift:{ ic:'🐋', n:'고래의 노래', d:'보호막 +20으로 시작', f:s=>{ s.startShield += 20; } },
    pre:[['n','폭풍이 몰아치는 망상. 캠핑장 텐트들이 바람에 펄럭여요.'],
         ['a','우우웅… 열 조각을 모은 아이야. 윤슬 이야기를 들려줄 때가 됐구나.'],
         ['a','윤슬은 사라진 게 아니란다. 스스로 너울의 수호자가 되어 바다 밑에서 보드를 지키고 있지.'],
         ['gull','…끼룩. 이제 기억나. 나, 윤슬이랑 같이 파도 타던 갈매기야.'],
         ['a','흑조가 마지막 매듭을 억지로 당기고 있구나. 서두르거라.']],
    post:[['a','우우웅… 내 노래를 줄게. 위험할 때 바다가 너를 감싸 줄 거야.'], ['gull','장호항으로 가자. 윤슬이 거기 있어!']] },
  { n:'삼척 장호항', d:'맑은 물빛으로 이름난 작은 항구', s:'풀리는 봉인', lm:'⛵', tod:'stormnight', alt:'finale', boss:'guard',
    a:{ ic:'🐉', n:'너울의 수호자', fx:'dark' }, b:GULL, fo:['jelly','crab'], need:1,
    pre:[['n','장호항. 바위섬 사이 바다가 검게 소용돌이쳐요.'],
         ['huk','봉인이 풀린다…! 스승님, 제가 너울을 불렀어요!'],
         ['a','크르르… (검은 너울에 휘감긴 수호자가 몸부림쳐요)'],
         ['seal','꾸웅! 휘파람 듣고 다 모였어. 우리가 길을 열게!'],
         ['m','할머니 말씀대로, 끝까지 놓지 않을 거예요!']],
    post:[['yun','…고마워. 덕분에 정신이 들었어. 나는 윤슬이야.'],
          ['huk','스승님…! 정말 스승님이에요?'],
          ['yun','오래 기다리게 했구나. 너울을 부르지 않아도, 나는 늘 이 바다에 있었어.'],
          ['m','흑조 씨, 주문진 이모가 이거 꼭 전해 달래요. 🍙'],
          ['n','열한 조각이 맞물리자 바다가 잠잠해지고, 금빛 보드가 떠올랐어요.'],
          ['yun','이제 네 차례야. 강원 바다를 부탁해.'],
          ['L','이게… 전설의 보드! 강원 바다는 이제 우리가 지킬게요.'],
          ['gull','끼룩! 진짜 전설이 됐어!']] },
];
const N = CH.length;
/* ── 장르 — 동료 최대 4명이 앞줄·뒷줄로 서서 자동으로 싸우는 수집형 RPG(AFK 아레나·쿠키런 킹덤류).
   마을 하나 = 스테이지 셋 + 보스 = 11마을 44판. 역할이 다르다 — 탱커는 앞줄에서 맞아 주고, 딜러는 때리고,
   힐러는 살리고, 서포터는 판을 바꾼다. rg 0 근접(튀어 나가 때림) · 1 원거리(투사체). j = 그 마을 보스를 깨면 합류(-1 처음부터) */
const HERO = {
  me:     { ic:'🏄', n:'나', role:'딜러', rg:0, hp:150, atk:20, spd:1, j:-1, u:'파도 가르기', ud:'앞의 적에게 큰 한 방 + 밀쳐 기절', col:'#E8A317' },
  gull:   { ic:'🕊️', n:'끼룩', role:'딜러', rg:1, hp:95, atk:16, spd:.8, j:-1, u:'급강하 연타', ud:'체력이 가장 적은 적을 세 번 쪼기', col:'#3E8FD0' },
  haenyeo:{ ic:'🧓', n:'해녀 할머니', role:'힐러', rg:1, hp:110, atk:8, spd:1.2, j:0, u:'숨비소리', ud:'아군 전체 회복', col:'#2FA58A' },
  crab:   { ic:'🦀', n:'꽃게 대장', role:'탱커', rg:0, hp:270, atk:11, spd:1.1, j:1, u:'집게 방패', ud:'적을 4초간 끌어당기고 보호막 · 전체 타격', col:'#D9503A' },
  coach:  { ic:'📣', n:'서핑 코치', role:'서포터', rg:1, hp:115, atk:11, spd:1, j:3, u:'파도 읽기', ud:'아군 공격력 +40% 6초 · 기력 +25', col:'#8A5CD0' },
  seal:   { ic:'🦭', n:'몽돌', role:'탱커', rg:0, hp:240, atk:10, spd:1, j:4, u:'몽돌 휘파람', ud:'아군 전체 보호막', col:'#2F9F7A' },
  turtle: { ic:'🐢', n:'거북 할아버지', role:'탱커', rg:0, hp:310, atk:9, spd:1.3, j:5, u:'등껍질 요새', ud:'4초간 아군이 받는 피해 -60%', col:'#5E8A3A' },
  dol:    { ic:'🐬', n:'파랑', role:'딜러', rg:1, hp:105, atk:18, spd:.9, j:7, u:'물보라', ud:'적 전체에 물보라', col:'#1F7FC0' },
  whale:  { ic:'🐋', n:'고래 할머니', role:'서포터', rg:1, hp:150, atk:11, spd:1.2, j:9, u:'고래의 노래', ud:'아군 회복 + 적 전체 밀쳐 기절', col:'#3A5EA8' },
};
const HK = Object.keys(HERO);
const ROLE = { 탱커:'#D9503A', 딜러:'#B87A00', 힐러:'#1F8A6C', 서포터:'#7A4CC0' };
Object.assign(CAST, { haenyeo:{ ic:'🧓', n:'해녀 할머니' }, coach:{ ic:'🏄', n:'서핑 코치' }, turtle:{ ic:'🐢', n:'바다거북 할아버지' }, whale:{ ic:'🐋', n:'고래 할머니' } });
/* 적 — rg 1 은 독침을 쏜다(뒷줄도 맞는다). 스테이지(g, 0~43)가 오를수록 체력·공격이 붙는다(EH·EA) */
const FOES = {
  jelly:{ ic:'🪼', n:'해파리', hp:70, atk:8, spd:1.4, rg:1 },
  crab: { ic:'🦀', n:'꽃게 떼', hp:62, atk:8, spd:.9, rg:0 },
  shark:{ ic:'🦈', n:'상어', hp:130, atk:15, spd:1.3, rg:0 },
  wave: { ic:'🌊', n:'성난 파도', hp:95, atk:13, spd:1.8, rg:0 },
};
const TUNE = { h:1.8, a:1.9, bh:.55, eh:.2, ea:.16 };                                          // 적 기본 배율·스테이지당 성장 — 봇 균형 시험(qa/quest.mjs)으로 맞춘 값
/* 마을 보스 — pat 은 예고(빨간 바닥 1.7초) 뒤 터지는 기술 순서. front 앞줄 · back 뒷줄 · all 전체 · call 부하 부르기.
   예고를 보고 탱커 보호막·거북 요새를 맞춰 쓰는 게 손맛이다 */
const BOSS = [
  { ic:'🪼', n:'대왕 해파리', hp:2.8, pat:['all','front'] },
  { ic:'🦀', n:'꽃게 대장', hp:4.4, pat:['front','call'] },
  { ic:'🦈', n:'상어 떼 우두머리', hp:5.6, pat:['back','front'] },
  { ic:'🌊', n:'성난 너울', hp:6, pat:['all','back','front'] },
  { ic:'🐡', n:'대왕 복어', hp:6, pat:['front','all','call'] },
  { ic:'🦈', n:'백상아리', hp:5.2, pat:['front','back','all'] },
  { ic:'🦑', n:'대왕 오징어', hp:6.4, pat:['all','call','back'] },
  { ic:'🌑', n:'달 삼킨 너울', hp:6.8, pat:['back','all','front'] },
  { ic:'🐙', n:'대왕문어', hp:7.2, pat:['all','front','call','back'] },
  { ic:'⛈️', n:'폭풍 너울', hp:7.4, pat:['all','back','front','all'] },
  { ic:'🐉', n:'검은 너울에 휘감긴 수호자', hp:8.5, pat:['front','all','back','call','all'] },
];
const PAT = { front:'앞줄 내려찍기', back:'뒷줄 덮치기', all:'해일', call:'부하 부르기' };
/* 스테이지 사이 짧은 이야기 — [2스테이지 전, 3스테이지 전, 보스 전]. 1스테이지 전은 pre, 보스 뒤는 post */
const BEATS = [
  [[['gull','끼룩! 방파제 쪽에 해파리가 또 몰려와!'],['a','물질하던 자리가 다 막혔구먼. 내 망사리 좀 지켜 주렴.'],['m','끼룩은 뒤에서 쪼아 줘. 내가 앞에서 막을게!']],
   [['n','해가 오르자 바다 빛이 이상하게 검게 일렁여요.'],['a','저 물빛… 매듭이 풀릴 때 저런단다. 큰 놈이 깨어났어.']],
   [['n','수평선 아래서 거대한 해파리가 떠올라요. 촉수마다 검은 빛이 맺혀 있어요.'],['gull','끼룩! 바닥이 빨갛게 빛나면 큰 기술이 와! 미리 대비해!'],['m','첫 조각, 꼭 지킬게요!']]],
  [[['b','하나 넘었다고 끝난 줄 알아? 다음 줄 앞으로!'],['haenyeo','허허, 집게 힘이 좋구먼. 할미가 뒤에서 받쳐 주마.']],
   [['a','끼룩, 물이 맑아서 꽃게들 작전이 다 보여!'],['m','앞줄은 단단하게, 뒷줄은 멀리서. 이게 우리 진형이야.']],
   [['b','좋다, 이제 대장 차례다! 내 집게 맛 좀 봐라!'],['gull','끼룩! 앞줄을 노린대. 앞에 선 동료가 버텨야 해!']]],
  [[['a','그물 찢는 놈들이 또 왔어! 이번엔 상어까지 섞였네.'],['crab','상어는 내가 앞에서 받는다. 집게가 근질근질해!']],
   [['n','대관람차 불빛 아래, 검은 지느러미가 줄지어 다가와요.'],['a','저 뒤에… 검은 서퍼가 휘파람을 불고 있어!'],['m','쫓아가기 전에 상어부터!']],
   [['a','우두머리다! 저놈이 그물을 다 찢어 놨어!'],['gull','끼룩! 저 녀석은 뒷줄로 덮쳐! 할머니 조심!']]],
  [[['a','파도는 세트로 와. 첫 파도 넘었다고 방심하면 안 돼!'],['haenyeo','숨 고르고. 바다는 서두르는 사람한테 안 열린단다.']],
   [['huk0','아직도 따라오네. 조각은 내게 넘기라니까.'],['m','이유를 말해 주면 생각해 볼게요.'],['huk0','…너울을 불러야 해. 그게 다야.']],
   [['n','검은 서퍼가 손을 들자, 바다가 통째로 일어서요.'],['a','성난 너울이다! 예고가 뜨면 버틸 준비부터!']]],
  [[['b','해파리 사이로 상어까지 섞였어! 가시 조심!'],['a','꾸웅… 내가 더 단단했으면 좋았을 텐데.'],['crab','걱정 마, 앞줄은 원래 둘이 서는 거야.']],
   [['a','꾸웅! 저기 봐, 섬 뒤에 뭔가 부풀어 오르고 있어!'],['b','저거… 복어 맞아? 집채만 한데?']],
   [['n','죽도 앞바다에 거대한 복어가 가시를 세워요.'],['coach','가시가 서면 큰 게 와. 탱커 앞으로, 힐러는 숨 아껴 둬!']]],
  [[['a','허어, 절벽 아래 물살이 거칠구나. 상어 떼가 숨어 있어.'],['seal','꾸웅, 이 정도는 몽돌이 막을 수 있어!']],
   [['a','흑조 그 아이도 여기 왔었지. 스승의 정자를 한참 올려다보더구나.'],['m','…스승님을 많이 그리워하나 봐요.']],
   [['n','해가 기울자 하얀 등지느러미가 물을 가르고 솟아요.'],['a','백상아리다. 등껍질 같은 마음으로 버티거라.']]],
  [[['a','배 든든히 채웠지? 방파제 앞 파도 좀 잠재워 줘!'],['turtle','허허, 주먹밥 힘이 나는구먼.']],
   [['a','그 검은 청년, 아까 주먹밥은 받아 가더라. 고맙다는 말도 없이…'],['crab','그래도 받아 갔다는 게 어디야.']],
   [['n','항구 불빛 사이로 거대한 다리 열 개가 솟구쳐요.'],['a','대왕 오징어야! 배들이 다 묶였어!'],['m','항구는 우리가 지킬게요!']]],
  [[['a','삐익! 호수 쪽에서도 해파리가 넘어와!'],['coach','양쪽에서 오면 줄을 지켜. 앞줄이 무너지면 끝이야.']],
   [['n','달빛이 점점 흐려지고, 바다에 검은 원이 번져요.'],['a','달을 삼킨 게 저 안에 있어…!']],
   [['a','삐-익! 달 삼킨 너울이야! 내 달 돌려줘!'],['gull','끼룩, 빨간 바닥 잘 봐! 피할 순 없어도 버틸 순 있어!']]],
  [[['a','철길까지 먹물이 튀었어요. 첫차가 위험해요!'],['dol','삐익, 먹물 속에 꽃게 떼가 숨어 있어!']],
   [['huk','왜 자꾸 막아? 너도 바다를 지키는 거라며.'],['m','지키는 거랑 부수는 건 달라요.'],['huk','…스승님이 없는 바다는 지킬 이유가 없어.']],
   [['b','크르르… 해를 삼킨 이 먹물을 뚫을 수 있겠느냐!'],['coach','다리 넷이 번갈아 와. 예고를 읽어!']]],
  [[['a','우우웅… 폭풍이 텐트를 다 날리겠구나.'],['seal','꾸웅! 비 때문에 앞이 안 보여도 우린 줄을 지켜!']],
   [['gull','끼룩… 윤슬이랑 이 바람 속을 같이 날았었어. 그날도 이랬어.'],['haenyeo','기억이 돌아오면 길도 보이는 법이란다.']],
   [['n','폭풍 한가운데서 너울이 하늘까지 솟아요.'],['a','흑조가 부른 폭풍이야. 내 노래로 길을 열어 줄게.']]],
  [[['huk','오지 마! 이제 곧 스승님이 돌아오신다고!'],['m','흑조 씨, 저건 스승님이 아니라 너울이에요!']],
   [['n','바위섬 사이 소용돌이가 점점 커져요.'],['whale','우우웅… 저 안에서 누군가 울고 있어.'],['gull','…윤슬이야. 끼룩, 서두르자!']],
   [['a','크르르르…'],['huk','스승님…? 왜 저를 공격해요…?'],['m','다 같이! 끝까지 놓지 않을 거예요!']]],
];
/* 동료 합류 대사 — 보스를 처음 깬 뒤 post 끝에 붙는다(꽃게·몽돌·파랑은 원래 대사에 합류가 들어 있다) */
const JOINL = { 0:['a','이 할미도 따라가마. 물질 오십 년, 상처 돌보는 덴 내가 최고지.'], 3:['a','나도 같이 가지. 파도 읽는 법, 싸움에서도 통하거든.'],
  5:['a','이 늙은 등껍질도 데려가거라. 오래 버티는 건 자신 있느니라.'], 9:['a','이 할미도 함께 가마. 마지막 바다엔 노래가 필요하단다.'] };
const postOf = v => JOINL[v] ? [...CH[v].post, JOINL[v]] : CH[v].post;


/* ── 장면 팔레트 — 시간대마다 하늘 4단·바다 2단, 그리고 거리별 색(먼 산 far → 랜드마크 mid → 곶 near → 앞 실루엣 fg).
   멀수록 하늘색에 가깝게(대기 원근), 가까울수록 어둡게 — 이것만 지켜도 층이 깊어 보인다. lit 은 테두리 빛, win 은 창·등불 */
const TOD = {
  dawn:      { nm:'새벽',      sky:['#232A57','#6B5E95','#E8968A','#FCD3A0'], sea:['#C9A3A8','#3B4778'], far:'#8A7AA6', mid:'#4A4672', near:'#35335A', fg:'#221F3D', sand:'#8A7187', lit:'#FFC9A0', roof:'#5B4F7E', win:'#FFD98A', crest:'#FBD9C4', cloud:['#F6B9A6','#8E7BA6'], sun:{ x:62, y:113, r:10, c:'#FFE1B0', g:'#FF9F7A' }, star:14, vig:.45 },
  morning:   { nm:'아침',      sky:['#5FB4EA','#9BD3F4','#D5EEFA','#F1F8F6'], sea:['#86CDEA','#1F6FAE'], far:'#A9C9DD', mid:'#5E8F82', near:'#3E6E5C', fg:'#2F4F3F', sand:'#EBD7A8', lit:'#FFF6D8', roof:'#C95B4A', win:'#FFE9A8', crest:'#FFFFFF', cloud:['#FFFFFF','#CFE4F2'], sun:{ x:200, y:40, r:9, c:'#FFF8DD', g:'#FFF1B8' }, rays:1, vig:.25 },
  day:       { nm:'한낮',      sky:['#3E9BE0','#78C2F0','#BEE4F8','#E6F6FB'], sea:['#62BAE0','#145C9C'], far:'#93B3CB', mid:'#5D7F73', near:'#46685A', fg:'#334B3E', sand:'#EED9A6', lit:'#FFFFFF', roof:'#3F6FA8', win:'#FFE9A8', crest:'#FFFFFF', cloud:['#FFFFFF','#C8E0F0'], sun:{ x:196, y:30, r:9, c:'#FFFBE8', g:'#FFF6C8' }, rays:1, aut:'#C98A5A', vig:.25 },
  noon:      { nm:'정오',      sky:['#3A93DA','#74BEEE','#B9E1F7','#E2F4FA'], sea:['#5DB6DE','#135896'], far:'#9DB9CF', mid:'#557A6C', near:'#3F6253', fg:'#2E463A', sand:'#F0DDAA', lit:'#FFFFFF', roof:'#9A3B30', win:'#FFE9A8', crest:'#FFFFFF', cloud:['#FFFFFF','#CBE2F1'], sun:{ x:150, y:20, r:9, c:'#FFFDF0', g:'#FFF7CF' }, rays:2, aut:'#C27F55', vig:.25 },
  afternoon: { nm:'오후',      sky:['#4AA0DC','#8FCBEE','#D6EBF0','#F4E5C3'], sea:['#6AB6D8','#17558E'], far:'#A6BBCB', mid:'#5F7C70', near:'#4A6656', fg:'#344A3D', sand:'#EBD3A0', lit:'#FFF3D6', roof:'#2F8F8A', win:'#FFE9A8', crest:'#FFFFFF', cloud:['#FFF8EC','#D4E2EC'], sun:{ x:205, y:52, r:9, c:'#FFF3CF', g:'#FFE6A8' }, rays:1, vig:.28 },
  golden:    { nm:'해 질 무렵', sky:['#5C86C4','#A9B7D0','#F2C08E','#F7A564'], sea:['#E6AE7E','#2E4E7E'], far:'#A493AE', mid:'#6B5468', near:'#4C3A4E', fg:'#2E2236', sand:'#D9A877', lit:'#FFD08A', roof:'#7A3F3A', win:'#FFD98A', crest:'#FFE2B8', cloud:['#FFD6A6','#9A7E9C'], sun:{ x:176, y:96, r:11, c:'#FFE6A6', g:'#FFB060' }, rays:1, flare:1, vig:.35 },
  sunset:    { nm:'노을',      sky:['#2F3C7A','#9A5A8E','#EE7D5E','#FFC067'], sea:['#E89070','#2A2F62'], far:'#9A6690', mid:'#5A3A63', near:'#3F2A4D', fg:'#24182F', sand:'#B9776E', lit:'#FFB070', roof:'#3A2240', win:'#FFD27A', crest:'#FFD0A8', cloud:['#FFB38A','#8B4F7A'], sun:{ x:120, y:113, r:14, c:'#FFD27A', g:'#FF7A4A' }, vig:.4 },
  dusk:      { nm:'달 뜨는 저녁', sky:['#141C46','#3B3A78','#8D5E92','#D88A8E'], sea:['#6A5888','#141A3C'], far:'#5A4F84', mid:'#2F2A55', near:'#221E42', fg:'#15122B', sand:'#4A3F62', lit:'#F3C6D8', roof:'#1E1A3C', win:'#FFD98A', crest:'#E8C8E0', cloud:['#B07A9E','#3E3466'], moon:{ x:170, y:56, r:8 }, star:22, ff:1, night:1, vig:.5 },
  night:     { nm:'해 뜨기 전', sky:['#04081E','#0D1638','#1B2550','#2E3868'], sea:['#22305C','#060B22'], far:'#1E2852', mid:'#10173A', near:'#0B1130', fg:'#060A1E', sand:'#232B4A', lit:'#8FA6E0', roof:'#0B1130', win:'#FFD98A', crest:'#8FA6E0', cloud:['#2A3462','#141C40'], star:50, night:1, vig:.55 },
  sunrise:   { nm:'해돋이',    sky:['#2B2E6A','#B95C82','#FF8E5E','#FFD48A'], sea:['#F2A070','#2C2E62'], far:'#8A5A86', mid:'#4E2F58', near:'#3A2445', fg:'#22142C', sand:'#A96A6A', lit:'#FFB070', roof:'#2A1830', win:'#FFE0A0', crest:'#FFD8B0', cloud:['#FFB08A','#8A4E78'], sun:{ x:120, y:118, r:22, c:'#FFE08A', g:'#FF6A3A' }, rays:1, star:6, vig:.35 },
  storm:     { nm:'폭풍',      sky:['#1E2430','#363F4E','#4E5866','#66707C'], sea:['#52606C','#151D26'], far:'#48505C', mid:'#2C333E', near:'#222831', fg:'#161B22', sand:'#4E5157', lit:'#B8C4D4', roof:'#1A1F27', win:'#FFC870', crest:'#D5DDE4', cloud:['#5A6370','#2A313B'], rain:1, flash:'#EAF2FF', big:2, night:1, vig:.5 },
  stormnight:{ nm:'폭풍의 밤',  sky:['#0C0A1E','#1F1638','#36254F','#4A3060'], sea:['#33265A','#08061A'], far:'#30264F', mid:'#1C1534', near:'#140F28', fg:'#0A0818', sand:'#2A2238', lit:'#C49BFF', roof:'#120E24', win:'#FFC870', crest:'#B49AE0', cloud:['#3A2A5A','#1A1230'], rain:1, flash:'#D8B8FF', big:1.6, night:1, vortex:1, vig:.6 },
  finale:    { nm:'새벽',      sky:['#3E5FB0','#9C8EC0','#F6B29A','#FFE3A6'], sea:['#F4CFA0','#2D5C8E'], far:'#9A9AC0', mid:'#5B5C88', near:'#45466E', fg:'#2A2A48', sand:'#E8C79A', lit:'#FFE6A8', roof:'#3A3A60', win:'#FFE6A8', crest:'#FFF1D0', cloud:['#FFD8C0','#A08EB8'], sun:{ x:186, y:104, r:15, c:'#FFF0B8', g:'#FFC46A' }, rays:1, board:1, vig:.3 },
};
/* 밤 장 빛 구멍 [x, y, 반지름] — 경포 달·호수 달, 정동진 역 창·가로등·호텔·문어 눈, 망상 텐트·캠핑카, 장호항 창·등대·소용돌이. 내 자리는 따로 늘 뚫는다 */
const HOLES = { 7:[[170,56,34],[170,138,26],[30,86,20],[62,112,14]], 8:[[34,113,24],[60,104,14],[197,94,24],[182,152,22]], 9:[[14,110,16],[38,110,16],[84,110,16],[61,107,16]], 10:[[20,112,22],[48,112,18],[94,98,22],[130,164,40]] };
const DARK = { dusk:['#0A0A26', .5], night:['#03061A', .8], storm:['#080C14', .42], stormnight:['#06031A', .78] };
const f1 = v => Math.round(v * 10) / 10;
const hs = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };   // 고정 난수 — 장면이 매번 같게

/* ── 장면 부품 — 전부 240×240 좌표. 수평선 HZ=118 ── */
function range(x0, x1, base, amp, col, seed, jag){            // 산줄기 — 양 끝이 바다로 잦아드는 능선(봉우리는 사인 몇 개의 합)
  let d = `M${x0} ${base + 2}`;
  for(let x = x0; x <= x1; x += 3){
    const u = (x - x0) / (x1 - x0), env = Math.pow(Math.sin(Math.PI * u), .7);
    const h = Math.sin(x * .045 + seed) * .45 + Math.sin(x * .11 + seed * 2.3) * .3 + Math.abs(Math.sin(x * .29 + seed * 4.1)) * (jag || .12);
    d += `L${x} ${f1(base - amp * env * (h * .5 + .62))}`;
  }
  return `<path d="${d}L${x1} ${base + 2}Z" fill="${col}"/>`;
}
const pine = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><path d="M-.8 0Q-2 -7 .6 -13Q2.6 -17.5 2 -22L3.4 -22Q4.4 -16.5 2.4 -12.6Q.8 -7 1.8 0Z"/><path d="M1.6 -10Q4.6 -12.4 7.4 -14.6M1.2 -13Q-1.4 -14.6 -3.6 -15.6" stroke="${c}" stroke-width="1" fill="none" stroke-linecap="round"/><ellipse cx="-4" cy="-16.4" rx="5.4" ry="3.2"/><ellipse cx="2" cy="-17.6" rx="5.2" ry="3.6"/><ellipse cx="7.6" cy="-15.8" rx="4.4" ry="3"/><ellipse cx="-.6" cy="-22.4" rx="4.6" ry="3.2"/><ellipse cx="4.6" cy="-23" rx="4.2" ry="3.4"/><ellipse cx="2.2" cy="-27" rx="3.4" ry="2.8"/><g fill="#FFFFFF" opacity=".16"><ellipse cx="-3.2" cy="-18" rx="3.4" ry="1.4"/><ellipse cx="2.8" cy="-19.6" rx="3.2" ry="1.5"/><ellipse cx="7.8" cy="-17.2" rx="2.6" ry="1.2"/><ellipse cx="1.6" cy="-24.6" rx="3.2" ry="1.4"/><ellipse cx="2.6" cy="-28.4" rx="2" ry="1"/></g></g>`;   // 소나무 — 납작한 막대 대신 둥근 잎 뭉치를 층층이, 윗면만 살짝 밝게(캐릭터의 셀 셰이딩과 맞춘다)
const pav = (x, y, s, c, lit) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><path d="M-10.4 0H10.4L9.2 -2.2H-9.2Z"/><rect x="-7.8" y="-9.6" width="1.7" height="7.6" rx=".6"/><rect x="6.1" y="-9.6" width="1.7" height="7.6" rx=".6"/><path d="M-6.2 -5.6H6.2" stroke="${c}" stroke-width=".9"/><path d="M-14 -11.2Q-10.6 -11 -8.6 -13L-5 -16.8Q0 -17.8 5 -16.8L8.6 -13Q10.6 -11 14 -11.2Q11.4 -9.2 9.4 -9.4H-9.4Q-11.4 -9.2 -14 -11.2Z"/><path d="M-5 -16.8Q0 -17.8 5 -16.8" stroke="${lit}" stroke-width=".9" fill="none" opacity=".85" stroke-linecap="round"/><path d="M-12 -10.6Q-10 -10.2 -8.4 -11.6M12 -10.6Q10 -10.2 8.4 -11.6" stroke="${lit}" stroke-width=".6" fill="none" opacity=".55"/></g>`;   // 정자 — 기둥 둘·난간·끝이 들린 처마(가는 막대 여럿은 멀리서 얼룩이 된다)
const shade = (x, y, w) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(w / 2)}" ry="${f1(Math.max(.6, w * .07))}" fill="#0A1626" opacity=".16"/>`;   // 바닥 그림자 — 건물이 떠 보이지 않게 땅에 붙인다
const foam = (x0, x1, y, P, op) => `<path d="M${x0} ${f1(y)}Q${f1((x0 + x1) / 2)} ${f1(y - 1.4)} ${x1} ${f1(y)}" stroke="${P.crest}" stroke-width=".9" fill="none" opacity="${op || .6}" stroke-linecap="round"/>`;   // 물가 흰 거품 줄 — 땅과 바다의 경계를 또렷하게
const spray = (x, y, w, dl, P) => `<path class="qsp"${dl ? ` style="animation-delay:${dl}s"` : ''} d="M${f1(x - w / 2)} ${f1(y)}q${f1(w / 4)} ${f1(-w * .45)} ${f1(w / 2)} 0q${f1(w / 4)} ${f1(-w * .45)} ${f1(w / 2)} 0" stroke="${P.crest}" stroke-width="1.1" fill="none" opacity=".85" stroke-linecap="round"/>`;   // 바위 물보라 — 흰 점은 얼룩으로 읽혀 작은 거품 곡선으로
const buoy = (x, y, i) => `<g class="qbob" style="animation-delay:${-i * .8}s"><ellipse cx="${x}" cy="${y + 1.8}" rx="2.6" ry=".5" fill="#FF9A52" opacity=".35"/><circle cx="${x}" cy="${y}" r="1.6" fill="#FF8A3D"/><path d="M${x - 1.55} ${y - .2}H${x + 1.55}" stroke="#FFFFFF" stroke-width=".7"/><circle cx="${x - .5}" cy="${y - .7}" r=".45" fill="#FFFFFF" opacity=".8"/></g>`;   // 부표 — 밝은 주황·흰 띠·물그림자(어두운 점은 흙먼지로 읽힌다)
function grove(x0, x1, base, amp, P, seed){                  // 숲 덮인 섬 — 둥근 잎 뭉치가 이어진 한 덩어리 윤곽(공을 여러 개 늘어놓으면 돌무더기로 읽힌다), 윗가장자리만 밝게
  const n = Math.max(3, Math.round((x1 - x0) / 9)), pts = [];
  for(let j = 0; j <= n; j++){ const u = j / n; pts.push([x0 + (x1 - x0) * u, base - amp * Math.pow(Math.sin(Math.PI * u), .8) * (j && j < n ? .9 + hs(j, seed) * .2 : 1)]); }
  const d = dy => { let s = `M${x0} ${base + 2}L${x0} ${f1(base + dy)}`; for(let j = 1; j <= n; j++){ const w = pts[j][0] - pts[j - 1][0]; s += `A${f1(w * .55)} ${f1(w * .42)} 0 0 1 ${f1(pts[j][0])} ${f1(pts[j][1] + dy)}`; } return s + `L${x1} ${base + 2}Z`; };
  return `<path d="${d(-1.3)}" fill="${P.lit}" opacity=".3"/><path d="${d(0)}" fill="${P.mid}"/>`;
}
const lighthouse = (x, y, s, body, band, P) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-3 0L-2 -16H2L3 0Z" fill="${body}"/><rect x="-2.6" y="-11" width="5.2" height="2" fill="${band}"/><rect x="-2.3" y="-6" width="4.6" height="2" fill="${band}"/><rect x="-2.6" y="-20" width="5.2" height="4" fill="${band}"/><path d="M-3 -20L0 -23L3 -20Z" fill="${band}"/><circle cy="-18" r="1.3" fill="${P.win}"/>${P.night ? `<path class="qbm" d="M0 -18L-36 -23.5V-12.5Z" fill="${P.win}" opacity=".1"/><path class="qbm" d="M0 -18L-22 -20.6V-15.4Z" fill="${P.win}" opacity=".12"/><circle cy="-18" r="5" fill="${P.win}" opacity=".3"/>` : ''}</g>`;
function houses(x0, y, n, P, seed){                          // 마을 지붕 — 밤이면 창에 불이 켜진다
  let s = '';
  for(let i = 0; i < n; i++){
    const w = 7 + hs(i, seed) * 6, h = 5 + hs(i, seed + 1) * 5, x = x0 + i * 8.5;
    s += `<rect x="${f1(x)}" y="${f1(y - h)}" width="${f1(w)}" height="${f1(h)}" fill="${P.mid}"/><path d="M${f1(x - 1)} ${f1(y - h)}L${f1(x + w / 2)} ${f1(y - h - 3)}L${f1(x + w + 1)} ${f1(y - h)}Z" fill="${P.roof}"/>`;
    if(P.night || hs(i, seed + 2) < .3) s += `<rect x="${f1(x + 2)}" y="${f1(y - h + 2)}" width="2" height="2" fill="${P.win}" opacity="${P.night ? .95 : .55}"/>${P.night ? `<circle cx="${f1(x + 3)}" cy="${f1(y - h + 3)}" r="3.5" fill="${P.win}" opacity=".18"/>` : ''}`;
  }
  return s;
}
function rocks(x, y, w, h, P, seed){                         // 갯바위 — 위쪽 모서리에만 빛(lit)을 얹어 덩어리감
  let d = `M${x} ${y}`, n = 7;
  for(let i = 1; i < n; i++){ const u = i / n; d += `L${f1(x + w * u + (hs(i, seed) - .5) * w * .12)} ${f1(y - h * Math.sin(Math.PI * u) * (.6 + hs(i, seed + 3) * .5))}`; }
  return `<path d="${d}L${x + w} ${y}Z" fill="${P.near}"/><path d="${d}" fill="none" stroke="${P.lit}" stroke-width=".8" opacity=".55"/>`;
}
function gull(x, y, s, col, dl){ return `<g class="qgu" style="animation-delay:${dl}s"><path class="qfp" transform="translate(${x} ${y}) scale(${s})" d="M-5 0Q-2.5 -3 0 0Q2.5 -3 5 0" stroke="${col}" stroke-width="1.1" fill="none" stroke-linecap="round"/></g>`; }
function wv(y, a, col, op, dur, w, dash, rev){                // 물결 띠 — 한 파장 24px 를 이어 붙여 한 파장만큼 옮기면 이음매 없이 돈다
  let d = `M-48 ${y}`; for(let x = -48; x < 264; x += 24) d += `q6 ${-a} 12 0t12 0`;
  return `<g class="qw${rev ? ' rv' : ''}" style="animation-duration:${dur}s"><path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" opacity="${op}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/></g>`;
}
function ferris(x, y, r, P){                                  // 속초 대관람차 — 천천히 돈다
  let sp = '', gd = '';
  for(let i = 0; i < 10; i++){ const a = i / 10 * Math.PI * 2, cx = f1(Math.cos(a) * r), cy = f1(Math.sin(a) * r);
    sp += `M0 0L${cx} ${cy}`; gd += `<circle cx="${cx}" cy="${cy}" r="1.5" fill="${P.night ? P.win : ['#E86A5A','#F4C430','#5BB5E0','#7BD389'][i % 4]}"/>`; }
  return `<g transform="translate(${x} ${y})"><path d="M${-r * .55} ${r + 6}L0 0L${r * .55} ${r + 6}" stroke="${P.mid}" stroke-width="1.4" fill="none"/><g class="qfw"><circle r="${r}" fill="none" stroke="${P.mid}" stroke-width="1.1"/><path d="${sp}" stroke="${P.mid}" stroke-width=".5"/>${gd}</g></g>`;
}
const sandFg = (P, y) => `<path d="M-12 ${y + 4}Q40 ${y - 3} 100 ${y + 1}T252 ${y}V252H-12Z" fill="${P.sand}"/><g class="qsh"><path d="M-12 ${y + 2}Q40 ${y - 5} 100 ${y - 1}T252 ${y - 2}" stroke="${P.crest}" stroke-width="1.6" fill="none" opacity=".75"/></g>`;
const flare = (sx, sy, P) => [.35, .55, .8, 1.1].map((u, i)=>`<circle cx="${f1(sx + (120 - sx) * u * 1.6)}" cy="${f1(sy + (150 - sy) * u * 1.6)}" r="${[5, 3, 8, 4][i]}" fill="${P.sun.c}" opacity="${[.18, .25, .1, .2][i]}"/>`).join('');

/* 마을별 랜드마크 — far(먼 산) · mid(마을·곶) · sea(바다 위 소품) · fg(앞 실루엣·모래) 네 층으로 돌려준다 */
function village(k, P, alt){
  const L = { far:'', mid:'', sea:'', fg:'' };
  switch(k){
    case 0:   // 아야진 — 작은 항구와 빨간 등대, 앞바다의 납작한 층층 바위
      L.far = range(-40, 120, HZ, 18, P.far, 1.3);
      L.mid = `<path d="M-12 ${HZ - 8}Q30 ${HZ - 12} 70 ${HZ - 4}Q86 ${HZ} 96 ${HZ + 2}H-12Z" fill="${P.near}"/>${pine(78, HZ - 2, .4, P.mid)}${houses(-2, HZ - 5, 8, P, 3)}<path d="M64 ${HZ + 2.6}Q66 ${HZ + .6} 70 ${HZ + .6}H108Q110.5 ${HZ + .6} 110.5 ${HZ + 2.6}Z" fill="${P.mid}"/>${foam(-12, 112, HZ + 3, P, .5)}${lighthouse(108, HZ + 2, .8, '#E25A4A', '#F6F1E8', P)}`;
      L.sea = rocks(176, 132, 34, 8, P, 1) + rocks(196, 136, 40, 10, P, 2) + spray(200, 128.5, 7, 0, P) + spray(215, 131.5, 6, -1.2, P) + foam(174, 238, 136.6, P, .55);
      L.fg = sandFg(P, 224) + rocks(-14, 244, 46, 22, { near:P.fg, lit:P.lit }, 4) + `<path d="M222 240q2 -14 6 -20M228 240q0 -12 -5 -18M234 240q1 -10 5 -15" stroke="${P.fg}" stroke-width="1.6" fill="none"/>`;
      break;
    case 1:   // 천진 — 언덕 위 청간정과 소나무, 바닥까지 비치는 맑은 물
      L.far = range(140, 300, HZ, 12, P.far, 2.1);
      L.mid = `<path d="M-12 ${HZ + 2}V${HZ - 14}Q20 ${HZ - 26} 52 ${HZ - 18}Q76 ${HZ - 8} 92 ${HZ + 2}Z" fill="${P.near}"/>${pine(10, HZ - 14, .8, P.mid)}${pine(26, HZ - 18, .9, P.mid)}${pav(46, HZ - 16, .9, P.mid, P.lit)}${pine(66, HZ - 10, .7, P.mid)}${rocks(196, HZ + 3, 22, 9, P, 5)}${pine(207, HZ - 4, .45, P.mid)}`;
      L.sea = Array.from({ length:9 }, (_, i)=>`<path class="qca" style="animation-delay:${-i * .4}s" d="M${20 + i * 24} ${184 + (i % 3) * 10}q4 -2 8 0t8 0" stroke="#FFFFFF" stroke-width=".8" fill="none" opacity=".5"/>`).join('') + `<path d="M150 ${HZ - 1}h8l-4 -7z" fill="#FFFFFF" opacity=".85"/><rect x="153.5" y="${HZ - 1}" width="1" height="2" fill="${P.mid}"/>`;
      L.fg = sandFg(P, 222) + [[30, 232], [90, 236], [180, 233]].map(([x, y])=>`<circle cx="${x}" cy="${y}" r="2.2" fill="#FFF4E6"/><path d="M${x - 1} ${y}a1 1 0 1 1 1 1" stroke="#D9A88A" stroke-width=".6" fill="none"/>`).join('');
      break;
    case 2:   // 속초 — 설악산(울산바위) 능선, 도시와 대관람차, 오른쪽 영금정
      L.far = range(-30, 180, HZ, 52, P.far, .4, .9) + `<path d="M40 ${HZ - 34}q6 -12 16 -10q8 -6 14 2q6 0 6 8z" fill="${P.far}"/><path d="M42 ${HZ - 34}q6 -12 16 -10" stroke="#FFFFFF" stroke-width="1" fill="none" opacity=".5"/>` + range(-20, 150, HZ, 22, (P.aut || P.mid), 2.4) + ``;
      L.mid = Array.from({ length:9 }, (_, i)=>{ const h = 8 + hs(i, 7) * 14, x = -4 + i * 7.5; return `<rect x="${x}" y="${f1(HZ - h)}" width="6.4" height="${f1(h + 1)}" rx=".8" fill="${P.mid}"/><rect x="${x}" y="${f1(HZ - h)}" width="2" height="${f1(h + 1)}" fill="#FFFFFF" opacity=".1"/><path d="M${x + 1.6} ${f1(HZ - h + 3)}h3M${x + 1.6} ${f1(HZ - h + 6)}h3" stroke="${P.lit}" stroke-width=".7" stroke-dasharray=".9 .9" opacity=".55"/>`; }).join('') + foam(-12, 76, HZ + 1.6, P, .45) + ferris(84, HZ - 16, 12, P) + rocks(178, HZ + 4, 60, 12, P, 8) + pav(206, HZ - 6, .85, P.mid, P.lit) + spray(186, HZ + 2, 7, 0, P) + spray(230, HZ + 3, 6, -.8, P);
      L.fg = sandFg(P, 224) + [20, 44, 68].map(x=>`<rect x="${x}" y="226" width="2" height="12" fill="${P.fg}"/>`).join('') + `<path d="M21 229Q33 233 45 229T69 229" stroke="${P.fg}" stroke-width=".8" fill="none"/>`;
      break;
    case 3:   // 낙산 — 언덕 위 해수관음상, 절벽 끝 의상대와 기운 소나무
      L.far = range(-30, 130, HZ - 6, 34, P.far, 1.9, .6) + range(-20, 110, HZ - 8, 14, (P.aut || P.mid), .7);
      L.mid = `<path d="M-12 ${HZ + 4}V${HZ - 22}Q20 ${HZ - 40} 50 ${HZ - 30}Q80 ${HZ - 22} 96 ${HZ - 8}Q101 ${HZ - 2} 104 ${HZ + 4}Z" fill="${P.near}"/>` +
        [[2, HZ - 26, 7, 4.6], [16, HZ - 31, 7.5, 5], [62, HZ - 27, 7, 4.6], [76, HZ - 20, 6.5, 4.2], [88, HZ - 12, 5.5, 3.6]].map(([x, y, rx, ry])=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${P.mid}"/><ellipse cx="${x - 1}" cy="${f1(y - ry * .45)}" rx="${f1(rx * .6)}" ry="${f1(ry * .35)}" fill="#FFFFFF" opacity=".14"/>`).join('') +
        `<circle cx="34" cy="${HZ - 41}" r="6" fill="#FFFFFF" opacity=".22"/><g opacity=".9"><path d="M34 ${HZ - 45}q2 0 2 3q0 2 -1 3q4 1 4.5 6l2 18h-15l2 -18q.5 -5 4.5 -6q-1 -1 -1 -3q0 -3 2 -3z" fill="#EDE7DA"/><path d="M35 ${HZ - 39}q4 1 4.5 6l2 18h-4z" fill="#000000" opacity=".1"/></g>` +
        pine(10, HZ - 28, .7, P.mid) + pine(58, HZ - 27, .62, P.mid) + pav(86, HZ - 12, .8, P.fg, P.lit) + `<g transform="translate(98 ${HZ - 7}) rotate(24)">${pine(0, 0, .55, P.mid)}</g>` + foam(80, 108, HZ + 3.4, P, .55);
      L.fg = sandFg(P, 220) + `<path d="M150 252q6 -18 18 -24M160 252q2 -14 -4 -22" stroke="${P.fg}" stroke-width="1.4" fill="none"/>`;
      break;
    case 4:   // 죽도 — 대숲 섬 위 죽도정, 오른쪽 해변의 서핑숍과 라인업의 서퍼들
      L.far = range(130, 290, HZ, 12, P.far, 3.3);
      L.mid = `<path d="M10 ${HZ + 3}Q16 ${HZ - 8} 34 ${HZ - 11}Q58 ${HZ - 15} 84 ${HZ - 11}Q100 ${HZ - 8} 108 ${HZ + 3}Z" fill="${P.near}"/>` + grove(18, 100, HZ + 1, 22, P, 3) +
        pine(30, HZ - 14, .5, P.mid) + pine(48, HZ - 20, .58, P.mid) + pine(86, HZ - 13, .48, P.mid) + pav(65, HZ - 22, .7, P.fg, P.lit) + rocks(8, HZ + 3.5, 20, 5, P, 15) + rocks(96, HZ + 3.5, 16, 4, P, 16) + foam(6, 114, HZ + 3.6, P, .6) +
        // 서핑숍 — 떠 있는 상자 대신: 뒤 솔숲 언덕 → 모래띠 → 지붕·차양·문 달린 작은 가게(바닥 그림자) → 기대 세운 짧은 보드
        `<path d="M138 ${HZ + 1}Q156 ${HZ - 10} 184 ${HZ - 9}Q214 ${HZ - 13} 252 ${HZ - 8}V${HZ + 1}Z" fill="${P.near}"/>` + [146, 160, 172, 226, 238].map((x, i)=>pine(x, HZ - 4 - (i % 2) * 2, .38, P.mid)).join('') +
        `<path d="M132 ${HZ + 3.6}Q146 ${HZ - 1.6} 168 ${HZ - 1.8}H252V${HZ + 3.6}Z" fill="${P.sand}"/>${foam(132, 252, HZ + 3.8, P, .6)}` +
        [['#3E9C96', '#2C6E6A', 156, 8], ['#E9A94A', '#B9782A', 170, 9.5], ['#E2786A', '#A9524A', 184, 8], ['#6FB5D9', '#3F7FA6', 198, 9], ['#F0C94A', '#B8962A', 212, 8]].map(([c, r, x, h])=>{ const y = HZ + 1.2, w = 12;
          return shade(x + w / 2, y + .4, w + 4) + `<rect x="${x}" y="${f1(y - h)}" width="${w}" height="${h}" rx=".8" fill="${c}"/><rect x="${x + w - 3}" y="${f1(y - h)}" width="3" height="${h}" fill="#000000" opacity=".1"/><path d="M${x - 1.4} ${f1(y - h + .4)}L${x + w / 2} ${f1(y - h - 4)}L${x + w + 1.4} ${f1(y - h + .4)}Z" fill="${r}" stroke="${r}" stroke-width=".8" stroke-linejoin="round"/><rect x="${x + 1.6}" y="${f1(y - h + 2.2)}" width="${w - 3.2}" height="1.6" rx=".8" fill="#FFF8EC" opacity=".9"/><rect x="${x + 4.6}" y="${f1(y - 3.6)}" width="2.8" height="3.6" rx=".6" fill="${r}"/>`; }).join('') +
        [[167, '#FFFFFF', -10], [181.5, '#F4C430', 8], [209, '#FFFFFF', -8]].map(([x, c, a])=>`<rect x="${x}" y="${HZ - 5}" width="1.8" height="6.2" rx=".9" fill="${c}" transform="rotate(${a} ${x + .9} ${HZ + 1.2})"/>`).join('');
      L.sea = buoy(118, 131, 0) + buoy(176, 134, 1);   // 라인업 서퍼 실루엣(어두운 점)은 빼고 부표 둘만
      L.fg = sandFg(P, 222) + [[196, '#F4C430', -8], [208, '#E86A5A', 4], [220, '#5BB5E0', -3]].map(([x, c, r])=>`<rect x="${x}" y="200" width="7" height="32" rx="3.5" fill="${c}" stroke="${P.fg}" stroke-width="1" transform="rotate(${r} ${x + 3} 232)"/>`).join('');
      break;
    case 5:   // 하조대 — 오른쪽 바위 절벽 위 정자, 바위 기둥 위 외톨이 소나무, 왼쪽 흰 등대
      L.far = range(-40, 110, HZ, 16, P.far, 4.2);
      L.mid = `<path d="M150 ${HZ + 4}L156 ${HZ - 18}Q168 ${HZ - 36} 190 ${HZ - 34}Q214 ${HZ - 40} 252 ${HZ - 30}V${HZ + 4}Z" fill="${P.near}"/><path d="M156 ${HZ - 18}Q168 ${HZ - 36} 190 ${HZ - 34}Q214 ${HZ - 40} 252 ${HZ - 30}" stroke="${P.lit}" stroke-width="1" fill="none" opacity=".6"/>` +
        pav(196, HZ - 35, .9, P.mid, P.lit) + pine(222, HZ - 34, .8, P.mid) + pine(170, HZ - 30, .6, P.mid) + `<path d="M128 ${HZ + 4}L131 ${HZ - 10}H139L141 ${HZ + 4}Z" fill="${P.near}"/>` + pine(134, HZ - 10, .7, P.mid) + rocks(10, HZ + 4, 40, 8, P, 9) + lighthouse(30, HZ - 2, .85, '#F4F1EA', '#D9D4CB', P);
      L.fg = sandFg(P, 226) + `<path d="M252 -2Q214 6 196 2Q206 12 226 12Q214 18 200 16Q216 26 252 22Z" fill="${P.fg}"/><path d="M252 30Q232 26 222 30Q236 36 252 36Z" fill="${P.fg}"/>`;
      break;
    case 6:   // 주문진 — 어시장 천막과 등불, 빨강·하양 방파제 등대, 집어등 단 오징어배
      L.far = range(-40, 100, HZ, 14, P.far, 5.1);
      L.mid = `<rect x="-12" y="${HZ - 2}" width="98" height="6" fill="${P.near}"/>${foam(-12, 86, HZ + 4.2, P, .4)}` + Array.from({ length:7 }, (_, i)=>`<rect x="${-6 + i * 12}" y="${HZ - 9}" width="11" height="7" fill="${P.mid}"/><path d="M${-7 + i * 12} ${HZ - 9}h13l-2 -3h-9z" fill="${i % 2 ? '#E86A5A' : '#F4F1EA'}" opacity=".85"/><circle cx="${-1 + i * 12}" cy="${HZ - 6}" r="1.2" fill="${P.win}"/><circle cx="${-1 + i * 12}" cy="${HZ - 6}" r="3.5" fill="${P.win}" opacity=".2"/>`).join('') +
        `<rect x="86" y="${HZ + 1}" width="56" height="3" fill="${P.mid}"/>${lighthouse(140, HZ + 2, .8, '#E25A4A', '#F6F1E8', P)}<rect x="196" y="${HZ + 1}" width="56" height="3" fill="${P.mid}"/>${lighthouse(198, HZ + 2, .8, '#F4F1EA', '#9AA0A8', P)}` +
        [104, 160, 176].map((x, i)=>`<path d="M${x} ${HZ + 7}h16l-3 4h-10z" fill="${P.fg}"/><rect x="${x + 7}" y="${HZ - 6}" width="1" height="13" fill="${P.fg}"/><path d="M${x + 1} ${HZ - 2}H${x + 15}" stroke="${P.win}" stroke-width="1.2" stroke-dasharray="1.2 1.6"/>`).join('');
      L.fg = sandFg(P, 226) + [6, 22, 38].map((x, i)=>`<rect x="${x}" y="${206 + i * 4}" width="5" height="40" fill="${P.fg}"/>`).join('') + `<rect x="0" y="210" width="48" height="3" fill="${P.fg}"/><circle cx="214" cy="232" r="5" fill="#E86A5A" stroke="${P.fg}"/><circle cx="226" cy="234" r="4" fill="#F4C430" stroke="${P.fg}"/>`;
      break;
    case 7:   // 경포 — 소나무 언덕 위 경포대, 그 아래 경포호(달이 또 하나 비친다)
      L.far = range(-40, 120, HZ - 8, 20, P.far, 6.3);
      L.mid = `<rect x="-12" y="${HZ - 9}" width="118" height="5" fill="#8C80B8" opacity=".55"/><ellipse cx="62" cy="${HZ - 6.5}" rx="4" ry="1" fill="#FFF4D6" opacity=".8"/>` +
        `<path d="M-12 ${HZ - 8}V${HZ - 26}Q14 ${HZ - 40} 40 ${HZ - 32}Q56 ${HZ - 26} 64 ${HZ - 8}Z" fill="${P.near}"/>` + [0, 14, 52].map((x, i)=>pine(x, HZ - 26 - (i === 1 ? 6 : 0), .7, P.mid)).join('') + pav(30, HZ - 33, 1.1, P.mid, P.lit) +
        `<path d="M-12 ${HZ + 3}Q40 ${HZ - 4} 110 ${HZ - 3}L140 ${HZ + 3}Z" fill="${P.near}"/>` + Array.from({ length:7 }, (_, i)=>pine(70 + i * 10, HZ - 1, .45 + hs(i, 4) * .2, P.mid)).join('');
      L.fg = sandFg(P, 226) + `<path d="M252 -4Q220 0 204 10Q220 12 232 8Q222 20 206 24Q228 26 252 18Z" fill="${P.fg}"/><path d="M240 -4L232 30" stroke="${P.fg}" stroke-width="2.5"/>`;
      break;
    case 8:   // 정동진 — 바다 앞 간이역과 철길, 지나가는 밤 기차, 절벽 위 배 모양 호텔
      L.far = range(140, 300, HZ - 16, 14, P.far, 7.4);
      L.mid = `<path d="M150 ${HZ + 4}L158 ${HZ - 14}Q190 ${HZ - 22} 252 ${HZ - 18}V${HZ + 4}Z" fill="${P.near}"/><path d="M170 ${HZ - 20}h56l-6 6h-46z" fill="${P.mid}"/><rect x="178" y="${HZ - 26}" width="38" height="6" fill="${P.mid}"/><rect x="188" y="${HZ - 31}" width="18" height="5" fill="${P.mid}"/>` +
        Array.from({ length:8 }, (_, i)=>`<rect x="${180 + i * 4.4}" y="${HZ - 24}" width="2" height="1.6" fill="${P.win}" opacity="${alt ? .5 : .95}"/>`).join('') +
        `<rect x="-12" y="${HZ - 1}" width="164" height="7" fill="${P.near}"/><path d="M-12 ${HZ + 2}H152M-12 ${HZ + 4}H152" stroke="${P.lit}" stroke-width=".5" opacity=".7"/>` +
        `<rect x="22" y="${HZ - 12}" width="26" height="11" fill="${P.mid}"/><path d="M19 ${HZ - 12}L35 ${HZ - 19}L51 ${HZ - 12}Z" fill="${P.roof}"/><rect x="31" y="${HZ - 8}" width="6" height="7" fill="${P.win}" opacity=".85"/><circle cx="34" cy="${HZ - 5}" r="9" fill="${P.win}" opacity=".15"/><rect x="60" y="${HZ - 14}" width="1" height="13" fill="${P.mid}"/><circle cx="60.5" cy="${HZ - 14}" r="1.3" fill="${P.win}"/>` +
        `<g class="qtr"><rect x="0" y="${HZ - 7}" width="62" height="7" rx="2" fill="${P.mid}"/>${Array.from({ length:9 }, (_, i)=>`<rect x="${4 + i * 6.4}" y="${HZ - 5.6}" width="3.6" height="2.2" fill="${P.win}"/>`).join('')}</g>`;
      if(!alt) L.sea = `<g class="qeye"><circle cx="176" cy="152" r="2" fill="#FF5A7A"/><circle cx="188" cy="152" r="2" fill="#FF5A7A"/><ellipse cx="182" cy="152" rx="20" ry="7" fill="#7A1A5A" opacity=".25"/></g>`;   // 바다 밑 두 눈 — 문어가 먼저 보인다
      L.fg = sandFg(P, 226) + `<path d="M196 252L208 226L212 252Z" fill="${P.fg}"/><path d="M204 232h12l-2 -4h-8z" fill="${P.fg}"/>`;
      break;
    case 9:   // 망상 — 모래언덕 위 캠핑장(불 켜진 텐트·캠핑카), 휘는 소나무, 비·번개
      L.far = range(-40, 90, HZ, 12, P.far, 8.5);
      L.mid = `<path d="M-12 ${HZ + 4}V${HZ - 10}Q40 ${HZ - 16} 104 ${HZ - 4}L118 ${HZ + 4}Z" fill="${P.near}"/>` +
        [[6, '#E8A43A'], [30, '#5BB5E0'], [76, '#E86A5A']].map(([x, c])=>`<path d="M${x} ${HZ - 5}L${x + 8} ${HZ - 17}L${x + 16} ${HZ - 5}Z" fill="${c}" opacity=".75"/><path d="M${x + 6} ${HZ - 5}L${x + 8} ${HZ - 11}L${x + 10} ${HZ - 5}Z" fill="${P.win}"/><circle cx="${x + 8}" cy="${HZ - 8}" r="8" fill="${P.win}" opacity=".16"/>`).join('') +
        `<rect x="50" y="${HZ - 16}" width="22" height="10" rx="2" fill="#D9DDE2"/><rect x="54" y="${HZ - 13}" width="5" height="3" fill="${P.win}"/><rect x="62" y="${HZ - 13}" width="5" height="3" fill="${P.win}"/><circle cx="55" cy="${HZ - 5}" r="2" fill="${P.fg}"/><circle cx="67" cy="${HZ - 5}" r="2" fill="${P.fg}"/>` +
        `<g transform="translate(100 ${HZ - 4}) rotate(-14)">${pine(0, 0, .7, P.mid)}</g><g transform="translate(112 ${HZ}) rotate(-18)">${pine(0, 0, .55, P.mid)}</g>`;
      L.sea = Array.from({ length:10 }, (_, i)=>`<path d="M${f1(hs(i, 11) * 230)} ${f1(126 + hs(i, 12) * 80)}h${f1(4 + hs(i, 13) * 8)}" stroke="#FFFFFF" stroke-width="1.2" opacity=".7"/>`).join('') + `<circle class="qsp" cx="200" cy="150" r="3" fill="${P.crest}"/><circle class="qsp" style="animation-delay:-1s" cx="60" cy="170" r="3" fill="${P.crest}"/>`;
      L.fg = sandFg(P, 226) + `<path d="M-12 252Q10 228 30 236Q46 226 62 252Z" fill="${P.fg}"/>`;
      break;
    case 10:  // 장호항 — 작은 항구, 바위섬들, 빛나는 투명 카누 / 검은 소용돌이(밤) · 금빛 보드(새벽)
      L.far = range(130, 300, HZ - 4, 16, P.far, 9.2);
      L.mid = `<path d="M-12 ${HZ + 3}V${HZ - 6}Q30 ${HZ - 12} 70 ${HZ - 2}L80 ${HZ + 3}Z" fill="${P.near}"/>${houses(-4, HZ - 3, 7, P, 13)}<rect x="62" y="${HZ + 1}" width="34" height="2.4" fill="${P.mid}"/>${lighthouse(94, HZ + 2, .75, '#E25A4A', '#F6F1E8', P)}` +
        `<path d="M150 ${HZ + 4}L156 ${HZ - 16}L162 ${HZ - 22}L170 ${HZ - 12}L174 ${HZ + 4}Z" fill="${P.near}"/><path d="M180 ${HZ + 4}L186 ${HZ - 8}L196 ${HZ - 12}L204 ${HZ + 4}Z" fill="${P.near}"/><path d="M212 ${HZ + 4}L220 ${HZ - 26}L228 ${HZ - 30}L236 ${HZ - 18}L240 ${HZ + 4}Z" fill="${P.near}"/>` + pine(224, HZ - 28, .55, P.mid) + pine(162, HZ - 21, .45, P.mid) +
        `<path d="M156 ${HZ - 16}L162 ${HZ - 22}L170 ${HZ - 12}M220 ${HZ - 26}L228 ${HZ - 30}L236 ${HZ - 18}" stroke="${P.lit}" stroke-width=".8" fill="none" opacity=".6"/>`;
      L.sea = [[44, 138], [74, 146], [26, 156]].map(([x, y], i)=>`<g class="qbob" style="animation-delay:${-i}s"><ellipse cx="${x}" cy="${y}" rx="10" ry="2.4" fill="#CFF6FF" opacity=".3" stroke="#E8FCFF" stroke-width=".7"/><circle cx="${x}" cy="${y - 3}" r="1.6" fill="${P.fg}"/></g>`).join('') +
        (alt ? `<circle cx="130" cy="166" r="40" fill="url(#qsB)"/><g class="qbd"><rect x="114" y="160" width="32" height="7" rx="3.5" fill="#F4C430" stroke="#FFF3C4" stroke-width="1"/><path d="M118 163.5H142" stroke="#FFF3C4" stroke-width=".8"/></g>`
             : `<g class="qvx"><ellipse cx="130" cy="164" rx="44" ry="11" fill="none" stroke="#8A5AD0" stroke-width="1.4" stroke-dasharray="10 6" opacity=".7"/><ellipse cx="130" cy="164" rx="28" ry="7" fill="none" stroke="#B48AF0" stroke-width="1.2" stroke-dasharray="6 5" opacity=".7"/><ellipse cx="130" cy="164" rx="12" ry="3" fill="#0A0418" opacity=".85"/></g>`);
      L.fg = sandFg(P, 226) + rocks(196, 252, 60, 26, { near:P.fg, lit:P.lit }, 14);
      break;
  }
  return L;
}

/* 한 장면 문자열 — 층 순서가 곧 원근. 장·시간대마다 한 번만 만들고 캐시 */
const SC = {};
function scene(k, alt){
  const key = k + (alt ? 'a' : ''); if(SC[key]) return SC[key];
  const c = CH[k], P = TOD[alt && c.alt || c.tod], V = village(k, P, alt), big = P.big || 1, L = P.sun || P.moon;
  let s = `<svg class="qs-svg" viewBox="0 0 240 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>
    <linearGradient id="qsS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky[0]}"/><stop offset=".45" stop-color="${P.sky[1]}"/><stop offset=".8" stop-color="${P.sky[2]}"/><stop offset="1" stop-color="${P.sky[3]}"/></linearGradient>
    <linearGradient id="qsW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sea[0]}"/><stop offset="1" stop-color="${P.sea[1]}"/></linearGradient>
    <radialGradient id="qsG"><stop offset="0" stop-color="${P.sun ? P.sun.g : '#E8E4FF'}" stop-opacity=".7"/><stop offset="1" stop-color="${P.sun ? P.sun.g : '#E8E4FF'}" stop-opacity="0"/></radialGradient>
    <radialGradient id="qsV" cx=".5" cy=".46" r=".72"><stop offset=".6" stop-color="#05040F" stop-opacity="0"/><stop offset="1" stop-color="#05040F" stop-opacity="${P.vig}"/></radialGradient>
    <radialGradient id="qsB"><stop offset="0" stop-color="#FFE9A0" stop-opacity=".9"/><stop offset="1" stop-color="#F4C430" stop-opacity="0"/></radialGradient>
    <radialGradient id="qsH"><stop offset="0" stop-color="#000"/><stop offset=".45" stop-color="#000" stop-opacity=".85"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <linearGradient id="qsR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".3"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
    ${P.rain ? '<pattern id="qsN" width="9" height="24" patternUnits="userSpaceOnUse"><path d="M7 0L4 11" stroke="#D8E4F4" stroke-width=".7" opacity=".5"/><path d="M3 13L1 20" stroke="#D8E4F4" stroke-width=".6" opacity=".35"/></pattern>' : ''}
  </defs><rect x="-12" y="-12" width="264" height="${HZ + 14}" fill="url(#qsS)"/>`;
  // ① 하늘 — 별·해/달·빛살·구름 (거의 안 움직이는 층)
  s += '<g data-d=".15">';
  for(let i = 0; i < (P.star || 0); i++) s += `<circle${i % 3 ? '' : ` class="qtw" style="animation-delay:${f1(-hs(i, 21) * 4)}s"`} cx="${f1(hs(i, 19) * 240)}" cy="${f1(hs(i, 20) * (HZ - 30))}" r="${hs(i, 22) < .15 ? 1 : .55}" fill="#FFFFFF" opacity="${f1(.4 + hs(i, 23) * .6)}"/>`;
  if(L) s += `<circle cx="${L.x}" cy="${L.y}" r="${L.r * 5}" fill="url(#qsG)"/>`;
  if(P.sun) s += `<circle cx="${P.sun.x}" cy="${P.sun.y}" r="${P.sun.r}" fill="${P.sun.c}"/>`;
  if(P.moon) s += `<circle cx="${P.moon.x}" cy="${P.moon.y}" r="${P.moon.r}" fill="#FFF4D6"/><circle cx="${P.moon.x + 3}" cy="${P.moon.y - 2}" r="${P.moon.r * .9}" fill="${P.sky[1]}" opacity=".18"/>`;
  if(P.rays && P.sun) s += `<g class="qry">${[-28, -12, 6, 24].map((a, i)=>{ const x = P.sun.x, y = P.sun.y, r = a * Math.PI / 180, w = .07 + (i % 2) * .04;
    return `<path d="M${x} ${y}L${f1(x + Math.sin(r - w) * 260)} ${f1(y + Math.cos(r - w) * 260)}L${f1(x + Math.sin(r + w) * 260)} ${f1(y + Math.cos(r + w) * 260)}Z" fill="url(#qsR)" opacity="${P.rays > 1 ? .5 : .32}"/>`; }).join('')}</g>`;
  s += `<g class="qcl">${[[30, 34, 26], [120, 22, 20], [196, 60, 30], [80, 70, 16]].map(([x, y, r], i)=>`<g opacity="${P.rain ? .95 : .85}"><ellipse cx="${x}" cy="${y + 3}" rx="${r * 1.3}" ry="${r * .32}" fill="${P.cloud[1]}"/><ellipse cx="${x - r * .3}" cy="${y}" rx="${r * .6}" ry="${r * .34}" fill="${P.cloud[0]}"/><ellipse cx="${x + r * .35}" cy="${y + 1}" rx="${r * .5}" ry="${r * .26}" fill="${P.cloud[0]}"/></g>`).join('')}${P.rain ? `<rect x="-12" y="-12" width="264" height="44" fill="${P.cloud[1]}" opacity=".7"/>` : ''}</g></g>`;
  // ② 먼 산 · ③ 마을 랜드마크 (수평선 위)
  s += `<g data-d=".4">${V.far}<rect x="-12" y="${HZ - 6}" width="264" height="8" fill="${P.sky[3]}" opacity=".35"/></g>`;
  // ④ 바다 — 그라데이션 + 해·달 반짝임 기둥 + 물결 여섯 겹(멀수록 얇고 느리게)
  s += `<g data-d=".55"><rect x="-12" y="${HZ}" width="264" height="${H - HZ + 12}" fill="url(#qsW)"/><path d="M-12 ${HZ + .5}H252" stroke="${P.sky[3]}" stroke-width="1" opacity=".7"/>`;
  if(L && !(P.sun && P.sun.y > HZ)) for(let i = 0; i < 9; i++){ const w = 3 + i * 3.2; s += `<rect class="qgl" style="animation-delay:${f1(-i * .37)}s" x="${f1(L.x - w / 2 + Math.sin(i * 2.1) * 3)}" y="${f1(HZ + 2 + i * i * 1.25)}" width="${f1(w)}" height="1" fill="${P.sun ? P.sun.c : '#FFF4D6'}" opacity=".8"/>`; }
  if(P.sun && P.sun.y > HZ - P.sun.r) s += `<rect x="${P.sun.x - P.sun.r * 1.6}" y="${HZ + 1}" width="${P.sun.r * 3.2}" height="2" fill="${P.sun.c}" opacity=".6"/>`;
  s += wv(124, .6 * big, P.crest, .35, 9, .6, '7 9') + wv(133, 1 * big, P.crest, .4, 7, .8, '10 6', 1) + wv(147, 1.5 * big, P.crest, .45, 6, 1) + wv(166, 2.2 * big, P.crest, .5, 5, 1.2, '', 1) + wv(190, 3 * big, P.crest, .55, 4.4, 1.5) + wv(213, 3.4 * big, P.crest, .6, 3.8, 1.8, '', 1);
  s += V.sea + `</g><g data-d=".85">${V.mid}</g>`;
  // ⑤ 앞 실루엣 — 가장 많이 움직이는 층(시차)
  s += `<g data-d="1.8">${V.fg}</g>`;
  // ⑤-2 밤 장 — 어둠 한 장을 덮고 등불·달·창·내 자리만 뚫는다(빛 구멍은 숨 쉬듯 커졌다 작아짐). 스프라이트는 캔버스라 어둠 위에 그대로 보인다
  const dk = !alt && DARK[c.tod];
  if(dk) s += `<g data-d=".85"><mask id="qsM"><rect x="-12" y="-12" width="264" height="264" fill="#fff"/>${[...(HOLES[k] || []), [45, 130, 42]].map(([x, y, r], i)=>`<circle class="qho" style="animation-delay:${f1(-i * .9)}s" cx="${x}" cy="${y}" r="${r}" fill="url(#qsH)"/>`).join('')}</mask><rect x="-12" y="-12" width="264" height="264" fill="${dk[0]}" opacity="${dk[1]}" mask="url(#qsM)"/></g>`;
  // ⑥ 입자 — 갈매기·반딧불·비·번개
  if(!P.rain && !P.night || P.board) s += gull(60, 50, 1, P.fg, 0) + gull(80, 40, .7, P.fg, -6) + gull(150, 64, .8, P.fg, -11);
  if(P.ff) for(let i = 0; i < 9; i++) s += `<circle class="qff" style="animation-delay:${f1(-hs(i, 31) * 6)}s" cx="${f1(20 + hs(i, 32) * 200)}" cy="${f1(150 + hs(i, 33) * 70)}" r=".9" fill="#F6FFB0"/>`;
  if(P.rain) s += `<g class="qrn"><rect x="-20" y="-40" width="280" height="300" fill="url(#qsN)"/></g>`;
  if(P.flare && P.sun) s += flare(P.sun.x, P.sun.y, P);
  if(P.flash) s += `<g class="qfl"><rect x="-12" y="-12" width="264" height="264" fill="${P.flash}" opacity=".5"/><path d="M168 -2L158 30L166 32L150 72L172 34L163 32L176 -2Z" fill="${P.flash}"/></g>`;
  // ⑦ 빛 — 가장자리 비네트(시선이 가운데로)
  s += `<rect x="-12" y="-12" width="264" height="264" fill="url(#qsV)" pointer-events="none"/></svg>`;
  // id 는 장면마다 다르게 — 크로스페이드로 두 장면이 겹칠 때 남의 그라데이션을 집어 오지 않게
  return SC[key] = s.replace(/(id="|url\(#)qs([A-Z])(?=[")])/g, `$1qs$2${key}`);
}
/* 장면 갈아 끼우기 — 새 장면을 위에 얹어 서서히 밝히고(크로스페이드) 옛 장면은 치운다. 카메라 층(data-d)을 잡아 둔다 */
const BG = { key:'', n:[] };
function setBg(k, alt){
  const el = $q('q-bg'); if(!el) return;
  const key = k + (alt ? 'a' : ''); if(BG.key === key && el.firstElementChild) return;
  BG.key = key;
  while(el.children.length > 1) el.firstElementChild.remove();                 // 겹침은 둘까지만 — 빠르게 넘겨도 쌓이지 않게
  const old = el.firstElementChild, d = document.createElement('div'); d.className = 'qs-l' + (old ? ' in' : ''); d.innerHTML = scene(k, alt);
  el.appendChild(d); if(old) setTimeout(()=>{ if(old.parentNode && old !== el.lastElementChild) old.remove(); }, 900);
  BG.n = [...d.querySelectorAll('[data-d]')].map(g=>[g, +g.dataset.d]);
}
/* 카메라 — 서로 무관한 주기의 사인 합(닫히지 않는 궤적)으로 층마다 깊이만큼 살짝 흔든다. 맞으면 잠깐 흔들림 */
function cam(ts){
  if(RM || !BG.n.length) return;
  const t = ts / 1000, sh = S && S.shk > 0 ? S.shk * 12 : 0;
  const cx = Math.sin(t * .23) * 1.4 + Math.sin(t * .097 + 1.7) * .9, cy = Math.sin(t * .17 + .5) * .6;
  for(const [g, d] of BG.n) g.setAttribute('transform', `translate(${(cx * d + (sh ? (rnd() - .5) * sh * d : 0)).toFixed(2)} ${(cy * d).toFixed(2)})`);
}

let cv, ctx, me = null, meImg = '', legImg = '', raf = 0, last = 0, acc = 0, speed = 1, auto = true, S = null, sel = 0, T = null, tmr = 0, CN = null;
const UI = { s:null, bt:null, p:[], b:[] };                                       // 전투 아래 기술 카드 — 바뀔 때만 다시 그린다
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
const OPK = 'lineup.share.qop';
const seenOp = () => { try{ return localStorage.getItem(OPK) === '1'; }catch(e){ return false; } };

/* 진행 — qb.sg(깬 스테이지 수 0~44)·st(스테이지별 별 0~3)·hx(영웅 경험치)·hs(영웅 성급 1~5)·fm(편성 4칸 [앞,앞,뒤,뒤])·it(방치 보상 받은 시각).
   예전 저장(qb.ch = 깬 마을 수)은 sg = ch×4 로 읽는다. 서버에서 온 값이라도 숫자로 가둔다 */
const NS = N * 4;
const nm = (v, mx) => { const x = Math.floor(+v); return Number.isFinite(x) ? Math.max(0, Math.min(mx, x)) : 0; };
const qbOf = () => (ME && ME.profile && ME.profile.play && ME.profile.play.qb) || {};
const sgN = () => { const q = qbOf(); return q.legend ? NS : Math.max(nm(q.sg, NS), nm(q.ch, N) * 4); };
const gotN = () => Math.min(N, Math.floor(sgN() / 4));                                  // 깬 마을 수 = 모은 봉인 조각
const openTo = () => Math.min(NS - 1, sgN());                                          // 도전할 수 있는 마지막 스테이지
const starOf = g => { const a = qbOf().st; return Array.isArray(a) ? nm(a[g], 3) : 0; };
const starAll = () => { let n = 0; for(let g = 0; g < NS; g++) n += starOf(g); return n; };
const lvOf = x => Math.min(30, 1 + Math.floor(Math.sqrt(nm(x, 1e6) / 30)));             // 레벨 = 경험치의 제곱근 — 초반은 빨리, 뒤로 갈수록 천천히
const xpAt = l => (l - 1) * (l - 1) * 30;
const heroXp = k => nm((qbOf().hx || {})[k], 1e6);
const heroLv = k => lvOf(heroXp(k));
const heroSt = k => Math.max(1, nm((qbOf().hs || {})[k], 5));
const unl = k => HERO[k].j < 0 || gotN() > HERO[k].j;
const STC = [0, 40, 90, 180, 320];                                                    // 성급 올리는 조개 — 2성 40 … 5성 320 (play.js 와 같은 표)
const recPow = g => Math.round(200 * (1 + g * .2));
/* 옛 저장 옮기기 — 처음 한 번. 깬 장은 별 하나로, 동료는 그만큼 레벨을 미리(처음부터 다시 키우지 않게) */
function migrate(){
  try{ if(!ME.profile.play && typeof playTick === 'function'){ playReady.force = true; playTick(); } }catch(e){}
  const p = ME && ME.profile && ME.profile.play; if(!p) return;
  const q = (p.qb ||= {}), sg = sgN(); let ch = false;
  if(nm(q.sg, NS) !== sg){ q.sg = sg; ch = true; }
  if(!Array.isArray(q.st)){ q.st = Array.from({ length:NS }, (_, g)=>g < sg ? 1 : 0); ch = true; }
  if(!q.hx || typeof q.hx !== 'object'){ q.hx = {}; if(sg) HK.forEach(k=>{ if(unl(k)) q.hx[k] = xpAt(Math.min(14, 1 + Math.floor(sg / 3))); }); ch = true; }
  if(!q.hs || typeof q.hs !== 'object'){ q.hs = {}; ch = true; }
  if(!Array.isArray(q.fm)){ const o = ['me', '', 'gull', '']; HK.forEach(k=>{ if(!o.includes(k) && unl(k)){ const i = (HERO[k].role === '탱커' ? [0, 1, 2, 3] : [2, 3, 1, 0]).find(j=>!o[j]); if(i != null) o[i] = k; } }); q.fm = o; ch = true; }
  if(ch && typeof playPush === 'function') playPush();
}
/* 편성 — 모르는 값·잠긴 영웅·중복은 비운다. 비면 나·끼룩 */
function fmGet(){
  const a = Array.isArray(qbOf().fm) ? qbOf().fm : [], o = ['', '', '', ''], seen = {};
  a.slice(0, 4).forEach((k, i)=>{ if(HERO[k] && unl(k) && !seen[k]){ o[i] = k; seen[k] = 1; } });
  if(!o.some(Boolean)){ o[0] = 'me'; o[2] = 'gull'; }
  return o;
}
function fmSet(o){ const p = ME && ME.profile && ME.profile.play; if(!p) return; (p.qb ||= {}).fm = o.slice(0, 4); if(typeof playPush === 'function') playPush(); }   // 바로 저장(서버 전송은 playPush 가 알아서 모아 보낸다) — 곧바로 새로고침해도 편성이 남는다
function place(k, i){ if(!HERO[k] || !unl(k) || !(i >= 0 && i < 4)) return; const o = fmGet(), j = o.indexOf(k), was = o[i]; o[i] = k; if(j >= 0 && j !== i) o[j] = was; fmSet(o); }
function unplace(k){ const o = fmGet(), j = o.indexOf(k); if(j < 0 || o.filter(Boolean).length < 2) return; o[j] = ''; fmSet(o); }
function autoPlace(k){ const o = fmGet(); if(o.includes(k)) return true; const i = (HERO[k].role === '탱커' ? [0, 1, 2, 3] : [2, 3, 1, 0]).find(j=>!o[j]); if(i != null){ o[i] = k; fmSet(o); return true; } return false; }   // 빈 칸이 없으면 false — 대기석
const NEWH = new Set();                                                                // 막 합류한 동료 — 편성 화면에 NEW
/* 영웅 능력치 — 레벨(경험치) × 성급(조개) × 봉인 조각(마을마다 +3%) × 장비(보드 공격 +4%·슈트 체력 +5%씩) × 🔧 강화소(원정대 체력·공격) */
function heroStat(k, U){
  const H = HERO[k], l = heroLv(k), st = heroSt(k), u = U || {}, m = (1 + .1 * (l - 1)) * (1 + .2 * (st - 1)) * (1 + .03 * gotN()), eb = 1 + .04 * eqOf('b'), ew = 1 + .05 * eqOf('w');
  return { hp:Math.round(H.hp * m * ew * (1 + .06 * nm(u.hp, 9))), atk:Math.round(H.atk * m * eb * (1 + .05 * nm(u.atk, 9))), l, st };
}
const power = (k, U) => { const s = heroStat(k, U); return Math.round(s.hp * .25 + s.atk * 4); };
const ovEl = cls => { const L = $q('q-fx'); if(L && L.firstChild) L.innerHTML = ''; const ov = $q('q-ov'); ov.className = 'game-ov' + (cls ? ' ' + cls : ''); ov.hidden = false; ov.onclick = ov.onkeydown = null; return ov; };
function clearT(){ clearTimeout(tmr); tmr = 0; if(T){ clearInterval(T.iv); T = null; } cineStop(); const L = $q('q-fx'); if(L) L.innerHTML = ''; }   // 화면이 바뀌면 남은 컷인·띠도 걷는다

/* ── 장면 엔진 — 오프닝·엔딩. 장면마다 {bg:[장, 바뀐 하늘], dur, cam:[[배율,x%,y%] 시작, 끝], lines:[[ms, 자막]], fx(), cue()}.
   배경은 마을 장면 SVG(#q-bg)를 그대로 쓰고 카메라만 천천히 민다(CSS transition 한 번 — 매 프레임 그리지 않는다).
   자막은 아래 가운데 초당 54자 타자, 장면 사이 0.4초 검은 페이드. 탭 = 다음(타자 중이면 먼저 완성), 건너뛰기 = 끝으로 */
const lights = () => Array.from({ length:N }, (_, i)=>{ const a = Math.PI * (1.08 + i / (N - 1) * .84); return `<i class="qc-lt" style="--x:${Math.round(Math.cos(a) * 150)}px;--y:${Math.round(Math.sin(a) * 120 - 10)}px;--d:${(.25 + i * .14).toFixed(2)}s"></i>`; }).join('');
const OPEN = [
  { bg:[10, false], dur:8000, cam:[[1.24, 0, -3], [1.05, 0, 1]], cue:()=>beep(98, 60, 1.4, .07),
    lines:[[250, '오래전, 열흘 밤낮 그치지 않는 큰 너울이 강원 바다를 덮쳤어요.'], [4200, '해안 마을의 불빛이 하나둘 파도에 삼켜졌죠.']] },
  { bg:[7, false], dur:8500, cam:[[1.08, -3, 0], [1.2, 3, -2]], cue:()=>beep(660, 1320, .7, .05),
    fx:()=>'<i class="qc-glow"></i><span class="qc-yun">🏄‍♀️</span>',
    lines:[[250, '그때 금빛 보드를 탄 서퍼 윤슬이 너울 꼭대기에 올랐어요.'], [4400, '윤슬이 지나간 자리마다 바다가 숨을 고르며 잠잠해졌어요.']] },
  { bg:[10, true], dur:8500, cam:[[1.3, 0, 4], [1.06, 0, 0]], cue:()=>{ for(let i = 0; i < N; i++) CN && CN.tm.push(setTimeout(()=>beep(880 + i * 60, 0, .12, .025), 250 + i * 140)); },
    fx:lights,
    lines:[[250, '윤슬은 그 보드를 바다 밑 깊이 봉인했어요.'], [4100, '봉인 매듭은 열한 조각의 빛이 되어 해안 마을마다 내려앉았죠.']] },
  { bg:[0, false], dur:8000, cam:[[1.16, 4, 2], [1.02, 0, 0]], cue:()=>beep(1200, 1500, .15, .03),
    fx:()=>`<span class="qc-gl">🕊️</span>${meImg ? `<img class="qc-me" src="${meImg}" alt="">` : ''}`,
    lines:[[250, '그리고 지금 — 고성 아야진의 새벽.'], [3700, '바다가 다시 검게 울기 시작했어요. 이번엔 내가 매듭을 묶을 차례예요.']] },
];
const END = [
  { bg:[10, true], dur:8000, cam:[[1.25, 0, 3], [1.05, 0, 0]], cue:()=>beep(523, 1047, .8, .05),
    fx:()=>legImg ? `<img class="qc-me" src="${legImg}" alt="">` : '',
    lines:[[250, '열한 조각이 맞물리자 바다가 잠잠해지고, 금빛 보드가 떠올랐어요.'], [4200, '윤슬은 다시 바다의 빛이 되었고, 보드는 새 주인을 찾았죠.']] },
  { bg:[8, true], dur:7500, cam:[[1.04, 0, 0], [1.18, -3, 1]],
    lines:[[250, '정동진의 해는 다시 제시간에 떠오르고, 첫차가 바다 앞에 섰어요.'], [3900, '주문진 이모의 주먹밥은 흑조의 손에 무사히 닿았대요.']] },
  { bg:[4, false], dur:7500, cam:[[1.16, 3, 0], [1.04, -1, 0]],
    lines:[[250, '흑조는 장호항에 작은 서핑 학교를 열었어요.'], [3700, '새벽 파도 위엔 가끔 금빛 그림자가 비친대요.']] },
  { bg:[0, false], dur:8000, cam:[[1.04, 0, 0], [1.14, 0, -2]], cue:()=>beep(784, 1568, .5, .04),
    fx:()=>`<span class="qc-gl">🕊️</span><span class="qc-tm">🦀 🦭 🐬</span>`,
    lines:[[250, '끼룩은 오늘도 바닷길을 안내하고 —'], [3300, '강원 바다는 이제 우리가 지켜요. — 끝 —']] },
];
function cineStop(){
  if(!CN) return; CN.tm.forEach(clearTimeout); clearInterval(CN.iv); CN = null;
  const bg = $q('q-bg'); if(bg){ bg.style.transition = ''; bg.style.transform = ''; }
}
function cine(list, done){
  clearT(); CN = { list, done, i:-1, tm:[], iv:0, t0:0, full:null }; if(S) S.mode = 'cine';
  const ov = ovEl('qv-cine');
  ov.innerHTML = `<div class="qc-fx" id="qc-fx" aria-hidden="true"></div><div class="qc-dots" aria-hidden="true">${list.map(()=>'<b></b>').join('')}</div>
    <div class="qc-ctl"><button class="btn sm ghost" id="qc-nx" type="button">다음 ▶</button><button class="btn sm ghost" id="qc-sk" type="button">건너뛰기 ⏭</button></div>
    <p class="qc-sub" id="qc-sub" aria-live="polite"></p><i class="qc-fd" id="qc-fd" aria-hidden="true"></i>`;
  const nx = ()=>{ if(!CN) return; if(CN.iv){ CN.full(); return; } if(Date.now() - CN.t0 < 450) return; cineGo(CN.i + 1); };
  ov.onclick = e=>{ if(!e.target.closest('#qc-sk')) nx(); };
  $q('qc-sk').onclick = e=>{ e.stopPropagation(); const d = CN && CN.done; cineStop(); if(d) d(); };
  const l = $q('q-log'); if(l) l.innerHTML = '<div>🎬 전설의 시작 — 화면을 누르면 다음, 「건너뛰기」로 바로 원정</div>';
  cineGo(0);
}
function cineGo(i){
  const C = CN; if(!C) return;
  C.tm.forEach(clearTimeout); C.tm = []; clearInterval(C.iv); C.iv = 0;
  if(i >= C.list.length){ const d = C.done; cineStop(); if(d) d(); return; }
  const first = C.i < 0, fd = $q('qc-fd'); C.i = i;
  if(!first && !RM && fd) fd.classList.add('on');
  const show = ()=>{
    if(CN !== C) return;
    const sc = C.list[i], bg = $q('q-bg'), cm = ([s, x, y]) => `scale(${s}) translate(${x}%,${y}%)`;
    C.t0 = Date.now(); setBg(sc.bg[0], sc.bg[1]);
    if(bg){ bg.style.transition = 'none'; bg.style.transform = cm(sc.cam[0]); void bg.offsetWidth; if(!RM){ bg.style.transition = `transform ${sc.dur}ms linear`; bg.style.transform = cm(sc.cam[1]); } }
    document.querySelectorAll('.qc-dots b').forEach((b, j)=>b.classList.toggle('on', j <= i));
    const fx = $q('qc-fx'); if(fx) fx.innerHTML = sc.fx ? sc.fx() : '';
    const sub = $q('qc-sub'); if(sub) sub.textContent = '';
    sc.lines.forEach(([ms, txt])=>C.tm.push(setTimeout(()=>type(C, txt), RM ? Math.min(ms, 200) : ms)));
    if(sc.cue) sc.cue();
    C.tm.push(setTimeout(()=>cineGo(i + 1), sc.dur));
    if(fd) fd.classList.remove('on');
  };
  if(first || RM) show(); else C.tm.push(setTimeout(show, 400));
}
function type(C, txt){                                                            // 자막 타자 — 초당 54자
  if(CN !== C) return; const el = $q('qc-sub'); if(!el) return;
  clearInterval(C.iv); C.iv = 0; const ch = Array.from(txt); let n = RM ? ch.length : 0;
  C.full = ()=>{ clearInterval(C.iv); C.iv = 0; el.textContent = txt; };
  el.textContent = ch.slice(0, n).join('');
  if(n < ch.length) C.iv = setInterval(()=>{ n++; el.textContent = ch.slice(0, n).join(''); if(n >= ch.length){ clearInterval(C.iv); C.iv = 0; } }, 1000 / 54);
}
function opening(){ cine(OPEN, ()=>{ try{ localStorage.setItem(OPK, '1'); }catch(e){} town(sgN() ? TV : 0, true); }); }
function ending(){ if(S) S.mode = 'cine'; cine(END, legend); }

/* ── 지도 — 그린 해안 지도. 서쪽(왼쪽) 땅·산, 동쪽(오른쪽) 동해. 마을은 해안선 위 표지, 지나온 길은 금빛 실선, 남은 길은 점선 ── */
const CX = [.58, .6, .62, .63, .65, .67, .69, .7, .72, .74, .75], RY = 66, Y0 = 34;   // 남쪽으로 갈수록 해안이 동쪽으로 — 실제 강원 해안의 기울기
/* 이정표 독백 — 3·6·9번째 조각을 받은 뒤 길동무가 한마디(레퍼런스의 '검의 목소리'처럼 성장과 이야기를 묶는다) */
const MONO = { 2:['gull', '끼룩… 조각이 셋. 바다 냄새가 조금 달라졌어. 매듭이 우릴 알아보는 것 같아.'],
  5:['crab', '집게가 근질근질해. 그 검은 서퍼, 나쁜 녀석 같진 않던데… 눈이 슬퍼 보였어.'],
  8:['dol', '삐익… 해가 뜨니까 흑조 얼굴이 보였어. 오래 누군가를 기다린 얼굴이었어.'] };
function smooth(p){ let d = `M${f1(p[0][0])} ${f1(p[0][1])}`; for(let i = 0; i < p.length - 1; i++){ const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
  d += `C${f1(b[0] + (c[0] - a[0]) / 6)} ${f1(b[1] + (c[1] - a[1]) / 6)} ${f1(c[0] - (e[0] - b[0]) / 6)} ${f1(c[1] - (e[1] - b[1]) / 6)} ${f1(c[0])} ${f1(c[1])}`; } return d; }
function mapSvg(w, h, got, rt){
  const V = CH.map((c, i)=>[w * CX[i], Y0 + i * RY]), cp = [[V[0][0] - 8, -20]];
  V.forEach((v, i)=>{ cp.push([v[0] + 3, v[1]]); if(i < N - 1) cp.push([(v[0] + V[i + 1][0]) / 2 + (i % 2 ? 12 : -9), v[1] + RY / 2]); });
  cp.push([V[N - 1][0] + 10, h + 20]);
  const coast = smooth(cp), land = `${coast}L-20 ${h + 20}L-20 -20Z`, route = smooth(V), done = got > 0 ? smooth(V.slice(0, Math.min(N, (rt >= 0 ? rt : got) + 1))) : '', seg = rt >= 0 ? smooth(V.slice(rt, rt + 2)) : '';
  let m = '';
  for(let i = 0; i < 26; i++){ const y = 20 + hs(i, 41) * (h - 40), cx = w * CX[Math.min(N - 1, Math.floor((y - Y0) / RY + .5))] || w * .6, x = 6 + hs(i, 42) * Math.max(10, cx - 70), s = 7 + hs(i, 43) * 7, snow = y > Y0 + RY * 1.4 && y < Y0 + RY * 4;
    m += `<path d="M${f1(x - s)} ${f1(y)}L${f1(x)} ${f1(y - s * 1.1)}L${f1(x + s)} ${f1(y)}Z" fill="#B9A77A"/><path d="M${f1(x)} ${f1(y - s * 1.1)}L${f1(x + s)} ${f1(y)}H${f1(x + s * .2)}Z" fill="#9C8A5E"/>${snow ? `<path d="M${f1(x - s * .3)} ${f1(y - s * .78)}L${f1(x)} ${f1(y - s * 1.1)}L${f1(x + s * .3)} ${f1(y - s * .78)}Z" fill="#FFFFFF"/>` : ''}`; }
  for(let i = 0; i < 18; i++){ const y = 20 + hs(i, 51) * (h - 40), x = 8 + hs(i, 52) * w * .45; m += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(2.5 + hs(i, 53) * 2)}" fill="#8FB07A" opacity=".55"/>`; }
  const lab = (t, y) => `<text x="10" y="${y}" class="qm-lb">${t}</text>`;
  return `<svg class="qm-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false"><defs>
    <linearGradient id="qmS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8FD3EE"/><stop offset="1" stop-color="#3F8FCB"/></linearGradient>
    <pattern id="qmW" width="26" height="16" patternUnits="userSpaceOnUse"><path d="M2 9q4 -4 8 0t8 0" stroke="#FFFFFF" stroke-width="1" fill="none" opacity=".35"/></pattern>
    <pattern id="qmL" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".7" fill="#C9B98A"/><circle cx="7" cy="8" r=".6" fill="#C9B98A"/></pattern></defs>
    <rect width="${w}" height="${h}" fill="url(#qmS)"/><rect width="${w}" height="${h}" fill="url(#qmW)"/>
    <path d="${coast}" stroke="#CFF1FF" stroke-width="18" fill="none" opacity=".55"/><path d="${land}" fill="#EFE3BE"/><path d="${land}" fill="url(#qmL)"/>${m}
    ${lab('설악산', Y0 + RY * 2.5 + 4)}${lab('오대산', Y0 + RY * 5.5 + 4)}${lab('두타산', Y0 + RY * 8.5 + 4)}
    <path d="${coast}" stroke="#E8CF94" stroke-width="5" fill="none"/><path d="${coast}" stroke="#7A6A48" stroke-width="1" fill="none" opacity=".6"/>
    <path d="${route}" stroke="#8A6A3A" stroke-width="2.4" fill="none" stroke-dasharray="2 6" stroke-linecap="round"/>${done ? `<path d="${done}" stroke="#F4C430" stroke-width="4" fill="none" stroke-linecap="round"/><path d="${done}" stroke="#FFF3C4" stroke-width="1.2" fill="none" stroke-linecap="round"/>` : ''}
    ${seg ? `<path class="qm-rt" pathLength="1" d="${seg}" stroke="#F4C430" stroke-width="4" fill="none" stroke-linecap="round"/>` : ''}
    <g transform="translate(${w - 26} 26)"><circle r="13" fill="#FFF7E3" stroke="#1F2A44" stroke-width="1.5"/><path d="M0 -10L3 0L0 10L-3 0Z" fill="#1F2A44"/><path d="M0 -10L3 0H-3Z" fill="#E25A4A"/><text y="-15" text-anchor="middle" class="qm-lb">N</text></g>
    <text x="${w - 16}" y="${h * .42}" class="qm-sea">동</text><text x="${w - 16}" y="${h * .42 + 22}" class="qm-sea">해</text>
    ${[[.86, .2], [.9, .62], [.84, .84]].map(([x, y], i)=>`<g transform="translate(${f1(w * x)} ${f1(h * y)})" opacity=".85"><path d="M-7 3h14l-3 3h-8z" fill="#7A4A2A"/><path d="M0 2V-9L6 1z" fill="#FFFFFF"/><path d="M-1 2V-6L-5 1z" fill="#F4F1EA"/></g>`).join('')}
    <g transform="translate(${f1(w * .88)} ${f1(h * .5)})" opacity=".8"><path d="M-6 0q6 -3 12 0q-6 3 -12 0z" fill="#2E5E8A"/><path d="M6 0l4 -3v6z" fill="#2E5E8A"/><path d="M-2 -2q-1 -5 -3 -6M-2 -2q1 -5 3 -6" stroke="#FFFFFF" stroke-width=".8" fill="none"/></g></svg>`;
}
/* from — 방금 깬 마을 번호. 그 마을에서 다음 마을까지 금빛 길이 그려지는 걸 보여 준다.
   마을을 고르면 아래에 그 마을의 진행(부탁 몇 개·보스·별)과 「가기」 — 열린 마을이면 언제든 돌아가 순찰·대화할 수 있다 */
function map(keep, from){
  clearT(); tutOff(); S = null; window._gameRun = false; wMode(true); TB = '';
  const got = gotN(), sg = sgN(), op = openTo(), ov = ovEl('qv-map'), y0 = keep ? ov.scrollTop : 0, rt = from != null && got === from + 1 && from + 1 < N ? from : -1, top = Math.floor(op / 4);
  sel = Math.max(0, Math.min(top, sel));
  const w = Math.max(280, ov.clientWidth || 320), h = Y0 * 2 + (N - 1) * RY + 10, nx = qNow();
  const team = HK.filter(unl).map(k=>HERO[k]), vst = i => [0, 1, 2, 3].reduce((a, s)=>a + starOf(i * 4 + s), 0);
  const stOf = i => i < got || qbOf().legend ? `✅ 부탁 3/3 · 보스 격파 · ⭐ ${vst(i)}/12` : `📜 부탁 ${Math.min(3, nx.s)}/3${nx.s === 3 ? ' · 👑 보스 차례!' : ''}`;
  const todo = nx.all ? '🏄 봉인을 풀었어요! 마을을 돌며 순찰로 동료를 키워 보세요' : `📍 지금 — <b>${esc(short(nx.v))}</b> ${nx.s === 3 ? `👑 보스 ${esc(BOSS[nx.v].n)}` : `「${esc(VIL[nx.v].q[nx.s].t)}」`}`;
  ov.innerHTML = `<div class="qm"><div class="qm-top"><div class="qm-hd"><b>🗺️ 강원 해안 지도</b><span class="qm-bt"><button class="btn sm ghost" id="q-op" type="button" aria-label="오프닝 다시 보기">🎬</button><button class="btn sm ghost" id="q-cdx" type="button">📖 기록</button><button class="btn sm ghost" id="q-mx" type="button" aria-label="지도 닫기">✕</button></span></div>
    <div class="qm-bar" role="progressbar" aria-label="마친 부탁" aria-valuemin="0" aria-valuemax="${NS}" aria-valuenow="${sg}"><i style="width:${sg / NS * 100}%"></i></div>
    <p class="qm-tip"><span style="flex:1;min-width:0">${todo} · 🌙 시간당 🐚${2 + Math.floor(sg / 4)}</span><span class="qm-team" aria-label="동료">${team.map(p=>`<i title="${esc(p.n)}">${esc(p.ic)}</i>`).join('')}</span></p></div>
    <div class="qm-map" style="height:${h}px">${mapSvg(w, h, got, rt)}${CH.map((c, i)=>{ const st = i < got ? 'done' : i === got ? 'now' : i <= top ? 'open' : 'lock';
      return `<button type="button" class="qm-n ${st}${i === sel ? ' sel' : ''}" data-ch="${i}" style="top:${Y0 + i * RY}px;width:${Math.round(w * CX[i]) + 17 - 6}px"${st === 'lock' ? ' disabled' : ''} aria-pressed="${i === sel}">
        <span class="qm-t"><b>${esc(c.n)}${i === N - 1 ? ' ⚠️' : ''}</b><small>제${i + 1}장 · ${st === 'lock' ? '아직 잠겨 있어요' : `⭐ ${vst(i)}/12 · ${esc(c.s)}`}</small></span>
        <span class="qm-d" aria-hidden="true">${st === 'lock' ? '🔒' : esc(c.lm)}<i>${st === 'done' ? '🧩' : i + 1}</i></span>
        ${i === sel ? (meImg ? `<img class="qm-me${rt >= 0 ? ' mv' : ''}" src="${meImg}" alt="내 캐릭터">` : '<span class="qm-me">🏄</span>') : ''}</button>`; }).join('')}</div>
    <div class="qm-ft"><p class="qm-inf"><b>${esc(CH[sel].lm)} ${esc(CH[sel].n)}</b><br>${stOf(sel)}</p>
      <div class="qm-go"><button class="btn ghost" id="q-tm" type="button">👥 팀</button><button class="btn blue" id="q-go" type="button">🚶 ${esc(ro(short(sel)))} ${sel === TV ? '돌아가기' : '가기'}</button></div></div></div>`;
  ov.querySelectorAll('[data-ch]').forEach(b=>b.onclick = ()=>{ sel = +b.dataset.ch; map(true); });
  $q('q-go').onclick = e=>{ e.stopPropagation(); town(sel, true); };
  $q('q-tm').onclick = e=>{ e.stopPropagation(); TB = 'map'; teamUp(); };
  $q('q-op').onclick = e=>{ e.stopPropagation(); opening(); };
  $q('q-cdx').onclick = e=>{ e.stopPropagation(); codex(); };
  $q('q-mx').onclick = e=>{ e.stopPropagation(); town(TV); };
  const b = ov.querySelector('.qm-n.sel');
  ov.scrollTop = keep ? y0 : (b ? b.offsetTop + b.offsetParent.offsetTop - ov.clientHeight / 2 + 20 : 0);
  setBg(sel, false);
}
/* ── 기록장 — 만난 이들·지나온 곳. 깬 장에서 처음 말한 인물만 열리고, 장소마다 「가기」로 그 마을로 간다 ── */
function codex(){
  clearT(); S = null; window._gameRun = false; wMode(true);
  const got = qbOf().legend ? N : gotN(), ov = ovEl('qv-cdx'), seen = {}, ppl = [], top = Math.floor(openTo() / 4);
  CH.forEach((c, i)=>{ [...c.pre, ...(BEATS[i] || []).flat(), ...c.post].forEach(([w])=>{ const p = w === 'a' || w === 'b' ? c[w] : CAST[w]; if(!p || seen[p.n]) return; seen[p.n] = 1; ppl.push({ p, i }); });
    ['c', 'd'].forEach(k=>{ const o = VIL[i][k]; if(o && !seen[o.n]){ seen[o.n] = 1; ppl.push({ p:o, i }); } }); });
  const it = (u, ic, n, sm, ex) => `<div class="qx-it${u ? '' : ' lk'}"><i aria-hidden="true">${u ? esc(ic) : '❔'}</i><span><b>${u ? esc(n) : '???'}</b><small>${esc(sm)}</small></span>${ex || ''}</div>`;
  ov.innerHTML = `<div class="qx"><div class="qx-hd"><b>📖 원정 기록</b><span>만난 이 ${ppl.filter(x=>x.i < got).length}/${ppl.length}</span><button class="btn sm ghost" id="q-cx" type="button">🗺️ 지도</button></div>
    <h4>만난 이들</h4><div class="qx-g">${ppl.map(({ p, i })=>it(i < got, p.ic, p.n, `제${i + 1}장 ${short(i)}`)).join('')}</div>
    <h4>지나온 곳</h4><div class="qx-l">${CH.map((c, i)=>it(i <= top, c.lm, c.n, i < got ? `제${i + 1}장 · ${c.s} · ${TOD[c.tod].nm}` : i <= top ? `제${i + 1}장 · 지금 머무는 마을` : `제${i + 1}장 · 아직 못 가 봤어요`, i <= top ? `<button class="btn sm" type="button" data-rp="${i}" aria-label="${esc(ro(c.n))} 가기">🚶 가기</button>` : '')).join('')}</div>
    ${got >= N ? '<button class="btn ghost" id="q-end" type="button" style="width:100%;margin-top:10px">🎬 엔딩 다시 보기</button>' : ''}</div>`;
  $q('q-cx').onclick = ()=>map();
  ov.querySelectorAll('[data-rp]').forEach(b=>b.onclick = ()=>town(+b.dataset.rp));
  const e = $q('q-end'); if(e) e.onclick = ()=>cine(END, ()=>town(TV));
}

/* ── 한 판 — (처음 깨는 판이면) 장 제목·대화 → 팀 편성 → 웨이브 전투 → 별 → 결과(다음 스테이지 한 번에) ──
   보스를 처음 깨면 뒷이야기 → 봉인 조각·동료 합류 카드 → 지도(다음 마을까지 금빛 길) */
let meW = null, PK = '', DR = null, drT = 0;
const HPOS = [[88, SEA - 14], [98, SEA + 8], [50, SEA - 16], [60, SEA + 6]];          // 편성 칸 → 화면 자리(앞줄이 적 쪽)
const EPOS = [[156, SEA - 12], [166, SEA + 9], [196, SEA - 16], [206, SEA + 5], [182, SEA - 2]];
function wavesOf(g){                                                                // 고정 난수로 뽑아 같은 스테이지는 늘 같은 적 — 다시 할 때 공략이 쌓인다
  const v = Math.floor(g / 4), s = g % 4, fo = CH[v].fo, nw = s === 2 ? 3 : 2, out = [];
  for(let w = 0; w < nw; w++){ const n = Math.min(4, 2 + Math.floor(g / 14) + (w === nw - 1 && s < 3 ? 1 : 0)), L = [];
    for(let i = 0; i < n; i++) L.push(fo[Math.floor(hs(g * 13 + i, w + 3) * fo.length)]);
    out.push(L); }
  if(s === 3) out[1] = ['BOSS', ...out[1].slice(0, 1 + Math.floor(v / 6))];
  return out;
}
function mkFoe(kind, i, g){
  const v = Math.floor(g / 4), B = BOSS[v], boss = kind === 'BOSS', F = boss ? { ic:B.ic, n:B.n, hp:120 * B.hp, atk:20, spd:1.5, rg:0 } : FOES[kind];
  const hp = Math.round(F.hp * (boss ? TUNE.bh : TUNE.h) * (1 + g * TUNE.eh)), p = boss ? [182, SEA - 6] : EPOS[i % 5];
  return { side:'e', k:kind, ic:F.ic, n:F.n, rg:F.rg, hp, max:hp, hpD:hp, dT:0, atk:F.atk * TUNE.a * (1 + g * TUNE.ea), spd:F.spd, cd:.8 + i * .25 + rnd() * .3, x:W + 24 + i * 16, y:p[1], hx:p[0],
    en:0, fl:0, kb:0, lg:0, lgD:.22, st:0, sh:0, boss, pat:boss ? B.pat : null, pi:0, pT:boss ? 5 : 0, tel:null, sz:boss ? 30 : 16, dead:0, dd:0 };
}
function mkHero(k, i){
  const H = HERO[k], s = heroStat(k, S.U), p = HPOS[i];
  return { side:'h', k, ic:H.ic, n:H.n, role:H.role, rg:H.rg, hp:s.hp, max:s.hp, hpD:s.hp, dT:0, atk:s.atk, spd:H.spd, cd:.3 + i * .2, x:p[0] - 50, y:p[1], hx:p[0],
    en:k === 'me' ? 40 : 20, fl:0, kb:0, lg:0, lgD:.22, st:0, sh:0, slot:i, sz:16, dead:0, dd:0, l:s.l };
}
function session(g){
  clearT(); tutOff(); const v = Math.floor(g / 4);
  S = { g, v, k:v, s:g % 4, mode:'title', t:0, hs:0, shk:0, heroes:[], foes:[], proj:[], fx:[], sched:[], log:[], wv:0, wq:0, waves:wavesOf(g), left:g % 4 === 3 ? 120 : 90,
        deaths:0, killed:0, bonus:0, buff:0, red:0, taunt:null, res:null, pend:null, alt:false, tut:0, tutT:0, first:g === sgN() };
  S.U = typeof upFor === 'function' ? upFor('quest', true) : {};                    // 🔧 강화소 원정대 체력·공격 — 영웅 능력치에 곱으로 붙는다
  S.kind = S.s === 3 ? 'boss' : 'hunt';
  setBg(v, false); window._gameRun = true;                                         // 원정 중엔 다른 알림 카드가 덮지 않게
}
/* 말하는 이 — m 나 · L 전설 보드 든 나 · a/b 이야기 속 인물(마을마다) · c/d 마을 주민 · shop 상점 · 그 밖은 CAST. 사람은 모찌 그림(img) */
function who(w){
  const v = S ? S.k : TV, c = CH[v], V = VIL[v] || {};
  if(w === 'm') return { img:meImg, ic:'🏄', n:ME.name || '나', me:1 };
  if(w === 'L') return { img:legImg || meImg, ic:'🏄', n:ME.name || '나', me:1 };
  if(w === 'a' || w === 'b'){ const lk = V[w] && V[w].lk; return lk ? { ...c[w], img:npcImg(lk) } : c[w]; }
  if(w === 'c' || w === 'd'){ const o = V[w]; return o ? { ic:o.ic, n:o.n, img:npcImg(o.lk) } : null; }
  if(w === 'shop') return { ic:'🛒', n:'파도상회 사장', img:npcImg('shop') };
  return CAST[w] || null;                                                         // n = 해설(초상 없음)
}
/* 대화 — o.ch 가 있으면 마지막 줄에 고르기 버튼([글, 할 일]…). done 이 없으면 마을로 돌아간다 */
function talk(lines, done, o){ clearT(); if(S) S.mode = 'talk'; T = { lines, i:0, done:done || wBack, n:0, iv:0, npc:'', seen:{}, ch:o && o.ch, cancel:o && o.cancel }; line(); }
/* 비주얼노벨 무대 — 왼쪽은 늘 나, 오른쪽은 마지막으로 말한 상대. 말하는 쪽만 밝고 크게 */
function line(){
  const ov = ovEl('qv-talk'), [w, txt] = T.lines[T.i], sp = who(w), nar = !sp, isMe = !!(sp && sp.me);
  if(sp && !isMe) T.npc = w;
  const np = T.npc ? who(T.npc) : null, lImg = w === 'L' ? (legImg || meImg) : meImg;
  const inL = !T.seen.l, inR = np && T.seen.r !== T.npc; if(!nar){ T.seen.l = 1; if(np) T.seen.r = T.npc; }
  if(S) S.spk = w; ov.classList.toggle('cine', nar);
  ov.innerHTML = `<div class="qvn" aria-hidden="true">
      <div class="qvn-f qvn-l qt-pt${isMe ? ' on' : ''}${inL && !nar ? ' in' : ''}">${lImg ? `<img src="${lImg}" alt="">` : '<span>🏄</span>'}</div>
      ${np ? `<div class="qvn-f qvn-r${!isMe && !nar ? ' on' : ''}${inR && !nar ? ' in' : ''}${np.fx ? ' ' + np.fx : ''}">${np.img ? `<img src="${np.img}" alt="">` : `<span>${esc(np.ic)}</span>`}</div>` : ''}</div>
    <button class="btn sm ghost qt-sk" id="q-sk" type="button">건너뛰기 ⏭</button>
    <div class="qt${nar ? ' nar' : ''}${sp && !isMe ? ' r' : ''}" id="q-tb" role="button" tabindex="0" aria-label="다음 대사 (${T.i + 1}/${T.lines.length})">
    ${sp ? `<b class="qt-n">${esc(sp.n)}</b>` : ''}<p class="qt-x" id="q-tx" aria-hidden="true"></p><span class="qt-sr">${sp ? esc(sp.n) + ': ' : ''}${esc(txt)}</span><i class="qt-nx" aria-hidden="true">▼</i>
    <i class="qt-pg" aria-hidden="true">${T.lines.map((_, i)=>`<b${i === T.i ? ' class="on"' : ''}></b>`).join('')}</i>${T.ch && T.i === T.lines.length - 1 ? `<div class="qt-ch">${T.ch.map(([t], i)=>`<button type="button" class="btn ${i ? 'ghost' : 'blue'}" data-tc="${i}">${esc(t)}</button>`).join('')}</div>` : ''}</div>`;
  const tx = $q('q-tx'), chars = Array.from(txt);
  T.n = RM ? chars.length : 0; tx.textContent = chars.slice(0, T.n).join('');
  if(T.n < chars.length) T.iv = setInterval(()=>{ T.n++; tx.textContent = chars.slice(0, T.n).join(''); if(T.n >= chars.length){ clearInterval(T.iv); T.iv = 0; } }, 28);
  T.full = ()=>{ clearInterval(T.iv); T.iv = 0; T.n = chars.length; tx.textContent = txt; };
  const tb = $q('q-tb'); tb.onclick = e=>{ if(!e.target.closest('[data-tc]')) next(); }; tb.onkeydown = e=>{ if(e.target === tb && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); next(); } };
  ov.onclick = e=>{ if(e.target === ov || e.target.closest('.qvn')) next(); };
  tb.querySelectorAll('[data-tc]').forEach(b=>b.onclick = e=>{ e.stopPropagation(); const f = T.ch[+b.dataset.tc][1]; clearT(); f(); });
  $q('q-sk').onclick = e=>{ e.stopPropagation(); if(T.ch && T.i < T.lines.length - 1){ clearInterval(T.iv); T.iv = 0; T.i = T.lines.length - 1; line(); return; } const d = T.done; clearT(); d(); };
  if(T.ch && T.i === T.lines.length - 1) $q('q-sk').hidden = true;
  try{ tb.focus({ preventScroll:true }); }catch(e){}
}
function next(){
  if(!T) return;
  if(T.iv){ T.full(); return; }
  if(T.ch && T.i === T.lines.length - 1) return;                                 // 고르기 버튼을 눌러야 넘어간다
  T.i++; if(T.i < T.lines.length){ line(); return; }
  const d = T.done; clearT(); d();
}

/* ── 팀 편성 — 칸 넷(앞줄 둘·뒷줄 둘). 카드를 끌어 놓거나, 눌러 고른 뒤 칸을 누른다. 고른 영웅은 아래에 상세·⭐ 강화 ── */
function teamUp(){
  if(S){ clearT(); S.mode = 'team'; }
  const ov = ovEl('qv-team'), fm = fmGet(), pw = fm.reduce((a, k)=>a + (k ? power(k, S && S.U) : 0), 0), rp = S ? recPow(S.g) : 0, bal = typeof shellBal === 'function' ? shellBal() : 0;
  if(PK && !unl(PK)) PK = '';
  const stars = k => '★'.repeat(heroSt(k)), role = k => `<small style="color:${ROLE[HERO[k].role]}">${HERO[k].role} · Lv${heroLv(k)}</small>`;
  const slot = i => { const k = fm[i], H = k && HERO[k];                         // 잠긴 동료는 다음에 합류할 한 명만 보여 목록이 물음표로 덮이지 않게
    return `<button type="button" class="qtm-s${k ? ' on' : ''}${PK && PK !== k ? ' tg' : ''}" data-sl="${i}"${k ? ` data-hero="${k}"` : ''} aria-label="${i < 2 ? '앞줄' : '뒷줄'} ${i % 2 + 1}번 — ${k ? esc(H.n) : '비어 있음'}">${k ? `<i aria-hidden="true">${H.ic}</i><b>${esc(H.n)}</b>${role(k)}<em aria-hidden="true">${stars(k)}</em>` : '<i aria-hidden="true">＋</i><small>비어 있음</small>'}</button>`; };
  const card = k => { const H = HERO[k];
    if(!unl(k)) return `<div class="qtm-h lk" aria-label="잠긴 동료"><i aria-hidden="true">❔</i><small>제${H.j + 1}장 보스를 넘으면 합류</small></div>`;
    return `<button type="button" class="qtm-h${PK === k ? ' pk' : ''}${fm.includes(k) ? ' in' : ''}" data-hero="${k}" aria-pressed="${PK === k}"><i aria-hidden="true">${H.ic}</i><b>${esc(H.n)}</b>${role(k)}<em aria-hidden="true">${stars(k)}</em>${NEWH.has(k) && !fm.includes(k) ? '<u class="qtm-new">NEW</u>' : ''}</button>`; };
  let det = '';
  if(PK){ const H = HERO[PK], s = heroStat(PK, S && S.U), st = s.st, c = STC[st], x = heroXp(PK), a = xpAt(s.l), b = xpAt(s.l + 1);
    det = `<div class="qtm-d">${fm.includes(PK) ? '' : `<p class="qtm-dh">👆 위 칸을 누르면 ${esc(H.n)}${fin(H.n) ? '이' : '가'} 그 자리에 들어가요</p>`}<div><b>${H.ic} ${esc(H.n)}</b> · ${H.role} · ${H.rg ? '원거리' : '근접'} · Lv${s.l} · ${'★'.repeat(st)}${'☆'.repeat(5 - st)}</div>
      <span class="qtm-xp" role="progressbar" aria-label="경험치" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round((x - a) / Math.max(1, b - a) * 100)}"><i style="width:${Math.min(100, (x - a) / Math.max(1, b - a) * 100).toFixed(0)}%"></i></span>
      <p>❤️ 체력 ${s.hp} · ⚔️ 공격 ${s.atk} · 전투력 ${power(PK, S && S.U)}</p><p>✨ 필살기 <b>${esc(H.u)}</b> — ${esc(H.ud)}</p>
      <div class="qtm-db"><button type="button" class="btn sm ${st < 5 && bal >= c ? 'blue' : 'ghost'}" id="q-star"${st >= 5 ? ' disabled' : ''}>${st >= 5 ? '★ 최고 성급' : `⭐ ${st + 1}성 강화 · 🐚${c}`}</button>${fm.includes(PK) ? '<button type="button" class="btn sm ghost" id="q-out">편성에서 빼기</button>' : ''}</div></div>`; }
  const kl = S ? (S.kind === 'boss' ? `👑 ${esc(BOSS[S.v].n)}` : S.kind === 'patrol' ? '⚔️ 해변 순찰' : `📜 ${esc((VIL[S.v].q[S.s] || {}).t || '')}`) : '';
  ov.innerHTML = `<div class="qtm"><div class="qtm-hd"><b>👥 팀 편성</b>${S ? `<span>${kl}</span>` : ''}<button class="btn sm ghost" id="q-tmx" type="button">${S ? '↩ 마을로' : TB.startsWith('rw') ? '완료 ▶' : '✕ 닫기'}</button></div>
    <div class="qtm-pw"><span>전투력 <b>${pw}</b></span>${S ? `<span class="${pw >= rp ? 'ok' : 'lo'}">권장 ${rp}${pw >= rp ? ' ✓' : ' — ⭐ 강화나 레벨 업'}</span>` : ''}<span>🐚 ${bal}</span></div>
    <div class="qtm-f"><div class="qtm-c"><small>뒷줄 · 딜러·힐러</small>${slot(2)}${slot(3)}</div><div class="qtm-c"><small>앞줄 · 탱커 ⚔️→</small>${slot(0)}${slot(1)}</div></div>
    ${S ? '<p class="qtm-tip qtm-bt">⚔️ 전투는 자동이에요! 동료들이 알아서 싸우고, 기력이 차면 아래 초상을 눌러 필살기 ✨</p>' : ''}
    <p class="qtm-tip">카드를 칸으로 끌어 놓거나, 눌러 고른 뒤 칸을 누르세요 · 적은 앞줄부터 노려요</p>
    <div class="qtm-l">${HK.filter((k, i)=>unl(k) || HK.findIndex(j=>!unl(j)) === i).map(card).join('')}</div>
    ${det || S ? `<div class="qtm-ft">${det}${S ? `<button class="btn blue" id="q-fight" type="button">⚔️ 출전 — ${S.kind === 'boss' ? '보스전' : S.kind === 'patrol' ? '순찰 전투' : '퀘스트 전투'}</button>` : ''}</div>` : ''}</div>`;   // 고른 동료 상세는 아래에 붙어 있어 작은 폰에서도 스크롤 없이 보인다
  const box = ov.querySelector('.qtm');
  box.onpointerdown = e=>{ const h = e.target.closest('[data-hero]'); DR = h ? { k:h.dataset.hero, x:e.clientX, y:e.clientY, mv:0, sl:h.dataset.sl } : null; };
  box.onpointermove = e=>{ if(!DR) return;
    if(!DR.mv && Math.hypot(e.clientX - DR.x, e.clientY - DR.y) > 8){ DR.mv = 1; DR.g = document.createElement('div'); DR.g.className = 'qtm-gh'; DR.g.textContent = HERO[DR.k].ic; document.body.appendChild(DR.g); }
    if(DR.mv){ DR.g.style.transform = `translate(${e.clientX - 20}px,${e.clientY - 24}px)`; e.preventDefault(); } };
  box.onpointerup = box.onpointercancel = e=>{ const d = DR; DR = null; if(!d || !d.mv) return; d.g.remove(); drT = Date.now();
    const el = e.type === 'pointerup' && document.elementFromPoint(e.clientX, e.clientY), sl = el && el.closest('[data-sl]');
    if(sl) place(d.k, +sl.dataset.sl); else if(d.sl != null && el && el.closest('.qtm-l')) unplace(d.k);   // 칸 밖 목록으로 끌어내면 뺀다
    PK = ''; teamUp(); };
  box.onclick = e=>{ if(Date.now() - drT < 350) return;
    const sl = e.target.closest('[data-sl]'), h = e.target.closest('[data-hero]');
    if(sl && PK && sl.dataset.hero !== PK){ place(PK, +sl.dataset.sl); PK = ''; beep(660, 880, .08, .03); return teamUp(); }
    if(h){ PK = PK === h.dataset.hero ? '' : h.dataset.hero; return teamUp(); } };
  $q('q-tmx').onclick = e=>{ e.stopPropagation(); PK = ''; NEWH.clear(); const b = TB; TB = ''; if(S) town(S.v); else if(b === 'bag') bag(); else if(b === 'map') map(true); else if(b.startsWith('rw')){ const v = +b.slice(2); sel = Math.min(N - 1, v + 1); map(false, v); } else wBack(); };
  const sb = $q('q-star'); if(sb) sb.onclick = e=>{ e.stopPropagation(); if(typeof playQuestStar === 'function' && playQuestStar(PK)){ beep(523, 1047, .3, .05); if(typeof toast === 'function') toast(`⭐ ${HERO[PK].n} ${heroSt(PK)}성! 체력·공격 +20%`); } teamUp(); };
  const ob = $q('q-out'); if(ob) ob.onclick = e=>{ e.stopPropagation(); unplace(PK); teamUp(); };
  const fb = $q('q-fight'); if(fb) fb.onclick = e=>{ e.stopPropagation(); begin(); };
  const l = $q('q-log'); if(l) l.innerHTML = '<div>👥 팀 편성 — 탱커는 앞줄, 힐러·딜러는 뒷줄이 안전해요</div><div style="opacity:.75">조개로 ⭐ 성급 강화 · 부탁·전투로 레벨 업 · 마을 보스를 넘으면 새 동료</div>';
}
function begin(){
  if(!S) return; PK = '';
  S.heroes = fmGet().map((k, i)=>k ? mkHero(k, i) : null).filter(Boolean); if(!S.heroes.length) return;
  wMode(false); const hd = document.querySelector('#quest .game-hd > b'); if(hd) hd.textContent = `⚔️ ${short(S.v)}`;   // 전투는 정사각 화면 — 걷기 층은 숨긴다
  S.mode = 'go'; S.wv = 0; spawnWave(); render();
  S.banQ = [S.kind === 'boss' ? `👑 보스 — ${BOSS[S.v].n}` : '⚔️ 전투 시작!', S.kind === 'boss' ? 'boss' : ''];
  log(`⚔️ ${CH[S.v].n} — WAVE ${S.waves.length}개 · 전투는 자동, 기력이 차면 초상을 눌러 필살기`);
  if(tutNeed()) S.tutT = 1.6;                                                       // 첫 판 — 1.6초 싸운 뒤 멈추고 필살기 쓰는 법을 짚는다
}
function spawnWave(){
  S.foes = S.waves[S.wv].map((k, i)=>mkFoe(k, i, S.g));
  if(S.wv) S.banQ = S.foes.some(f=>f.boss) ? [`👑 ${BOSS[S.v].n} 등장!`, 'boss'] : [`🌊 WAVE ${S.wv + 1}/${S.waves.length}`, ''];
  if(S.foes.some(f=>f.boss)){ log(`⚠️ ${BOSS[S.v].ic} ${BOSS[S.v].n} 등장! 빨간 바닥이 뜨면 큰 기술`); beep(110, 70, .6, .07); }
}
function log(t){ if(!S) return; S.log.unshift({ t, at:S.t }); S.log = S.log.slice(0, 40); paintLog(); }

/* ── 전투 — 자리는 고정, 근접은 튀어 나갔다 돌아오고 원거리는 투사체. 때리면 기력이 차고(맞아도 조금), 100이면 필살기 ── */
const alive = a => a.filter(u=>!u.dead && Math.abs(u.x - u.hx) < 30);
const front = a => alive(a).sort((p, q)=>p.x - q.x)[0];
const weak = a => alive(a).sort((p, q)=>p.hp / p.max - q.hp / q.max)[0];
function target(u, O){
  if(u.side === 'h') return u.rg ? weak(O) : front(O);                              // 근접은 맨 앞, 원거리는 마무리(가장 약한 적)
  if(S.taunt && !S.taunt.u.dead) return S.taunt.u;
  const a = alive(O), fr = a.filter(h=>h.slot < 2);
  if(u.rg && rnd() < .45) return pick(a);                                           // 독침은 뒷줄도 노린다
  return (fr.length ? fr : a).sort((p, q)=>q.x - p.x)[0];
}
function unitTick(u, dt, O){
  if(u.dead){ u.dd += dt; return; }
  u.fl = Math.max(0, u.fl - dt); u.kb = Math.max(0, u.kb - dt * 60); trail(u, Math.max(0, u.hp), u.max, dt);
  if(u.side === 'h') u.en = Math.min(100, u.en + 5 * dt);
  if(u.x !== u.hx){ const d = u.hx - u.x, m = 120 * dt; u.x = Math.abs(d) <= m ? u.hx : u.x + Math.sign(d) * m; return; }   // 입장 — 자리까지 걸어 들어온다
  if(u.lg > 0){ const was = u.lg; u.lg -= dt; if(was > u.lgD / 2 && u.lg <= u.lgD / 2 && u.pd){ const p = u.pd; u.pd = null; if(!p.t.dead) strike(u, p.t, p.m); } }
  if(u.st > 0){ u.st -= dt; return; }
  if((u.cd -= dt * (u.side === 'h' && S.buff > 0 ? 1.25 : 1)) > 0) return;
  if(u.k === 'haenyeo'){ const lo = alive(S.heroes).filter(h=>h.hp < h.max * .8).sort((p, q)=>p.hp / p.max - q.hp / q.max)[0];   // 힐러 — 다친 동료가 있으면 치료 물방울
    if(lo){ u.cd = u.spd; u.en = Math.min(100, u.en + 12); S.proj.push({ x:u.x + 6, y:u.y - 8, t:lo, a:u, heal:u.atk * 1.8, c:'#7BF0B0' }); return; } }
  const t = target(u, O); if(!t) return;
  u.cd = u.spd * (.92 + rnd() * .16);
  if(u.side === 'h') u.en = Math.min(100, u.en + 12);
  if(u.rg) S.proj.push({ x:u.x + (u.side === 'h' ? 6 : -6), y:u.y - 8, t, a:u, m:1, c:u.side === 'h' ? HERO[u.k].col : '#C86BFF' });
  else { u.lg = u.lgD = .22; u.lt = t; u.pd = { t, m:1 }; }
}
function strike(a, t, m){
  let d = a.atk * m * (.9 + rnd() * .2); const cr = rnd() < (a.side === 'h' ? .18 : .07);
  if(cr) d *= 1.8; if(a.side === 'h' && S.buff > 0) d *= 1.4;
  hit(t, d, cr);
}
function hit(t, d, cr){
  if(t.dead) return;
  if(t.side === 'h' && S.red > 0) d *= .4;
  d = Math.max(1, Math.round(d));
  if(t.sh > 0){ const a = Math.min(t.sh, d); t.sh -= a; d -= a; if(!d){ txt(t, '막음', '#7BE0FF', 0); return; } }
  t.hp -= d; t.fl = .14; t.dT = .45; t.kb = Math.max(t.kb, cr ? 10 : 4); if(t.side === 'h') t.en = Math.min(100, t.en + 6);
  txt(t, (cr ? '치명! ' : '') + d, cr ? '#FFE27A' : t.side === 'h' ? '#FF7A7A' : '#FFFFFF', cr ? 2 : 1);
  spark(t.x, t.y - t.sz / 2, cr ? 8 : 3, cr ? '#FFE27A' : '#FFFFFF');
  if(cr){ S.hs = Math.max(S.hs, .06); S.shk = Math.max(S.shk, .12); beep(1200, 600, .07, .03); } else beep(t.side === 'h' ? 220 : 700, 0, .04, .015);
  if(t.side === 'h' && d >= t.max * .2) try{ if(typeof vib === 'function') vib(10); }catch(e){}
}
function heal(t, n){ if(t.dead) return; n = Math.round(n); t.hp = Math.min(t.max, t.hp + n); txt(t, '+' + n, '#7BF0B0', 1); }
function projTick(dt){
  for(let i = S.proj.length - 1; i >= 0; i--){ const p = S.proj[i], t = p.t, dx = t.x - p.x, dy = t.y - t.sz / 2 - p.y, d = Math.hypot(dx, dy), m = 250 * dt;
    if(t.dead){ S.proj.splice(i, 1); continue; }
    if(d <= m + 3){ S.proj.splice(i, 1); if(p.heal) heal(t, p.heal); else strike(p.a, t, p.m); continue; }
    p.px = p.x; p.py = p.y; p.x += dx / d * m; p.y += dy / d * m; }
}
function die(u){
  pop(u.x, u.y - u.sz / 2, u.boss ? 20 : 10, u.side === 'e' ? '#FFE27A' : '#FF8A8A');
  if(u.side === 'e'){ S.killed++; if(u.boss || rnd() < .35){ S.bonus++; txt(u, '+🐚', '#FFF3C4', 1); } S.shk = Math.max(S.shk, u.boss ? .4 : .08); beep(900, 1400, .08, .03);
    if(u.boss){ S.hs = .35; fxPush({ k:'flash', x:0, y:0, c:'#FFFFFF' }); log(`🏆 ${u.ic} ${u.n}를 쓰러뜨렸어요!`); } }
  else { S.deaths++; log(`💫 ${u.ic} ${u.n} 쓰러졌어요`); }
}
/* 필살기 — 컷인 띠(DOM)는 다음 프레임에, 시뮬레이션은 DOM 없이 돈다 */
const ULT = {
  me:u=>{ const t = front(S.foes); if(!t) return; u.lg = u.lgD = .32; u.lt = t; S.sched.push({ t:.14, f:()=>{ if(t.dead) return; strike(u, t, 3.2); t.kb = 24; t.st = Math.max(t.st, t.boss ? .4 : .9); fxPush({ k:'slash', x:t.x, y:t.y - 10 }); } }); },
  gull:u=>{ for(let i = 0; i < 3; i++) S.sched.push({ t:.1 + i * .16, f:()=>{ const t = weak(S.foes); if(t){ strike(u, t, 1.4); fxPush({ k:'dive', x:t.x, y:t.y - 10 }); } } }); },
  haenyeo:u=>{ alive(S.heroes).forEach(h=>heal(h, u.atk * 3 + h.max * .14)); fxPush({ k:'ring', x:75, y:SEA - 6, c:'#7BF0B0' }); },
  crab:u=>{ S.taunt = { u, t:4 }; u.sh += u.max * .35; alive(S.foes).forEach(t=>strike(u, t, .8)); fxPush({ k:'ring', x:u.x, y:u.y - 8, c:'#FF9A7A' }); },
  coach:u=>{ S.buff = 6; alive(S.heroes).forEach(h=>{ if(h !== u) h.en = Math.min(100, h.en + 25); }); fxPush({ k:'ring', x:75, y:SEA - 6, c:'#C9A8FF' }); },
  seal:u=>{ alive(S.heroes).forEach(h=>{ h.sh += h.max * .22; }); fxPush({ k:'ring', x:75, y:SEA - 6, c:'#7BE0FF' }); },
  turtle:()=>{ S.red = 4; fxPush({ k:'ring', x:75, y:SEA - 6, c:'#9CE07A' }); },
  dol:u=>{ fxPush({ k:'wash' }); alive(S.foes).forEach(t=>strike(u, t, 1.6)); },
  whale:u=>{ fxPush({ k:'wash' }); alive(S.heroes).forEach(h=>heal(h, h.max * .15)); alive(S.foes).forEach(t=>{ strike(u, t, .8); t.kb = 22; t.st = Math.max(t.st, t.boss ? .6 : 1.5); }); },
};
function ult(i){
  const u = S && S.heroes[i]; if(!u || u.dead || S.mode !== 'go' || u.en < 100 || S.tut === 1) return false;
  if(!alive(S.foes).length) return false;
  u.en = 0; ULT[u.k](u); S.cutQ = u; S.ults = (S.ults || 0) + 1; if(!RM) S.hs = Math.max(S.hs, .28);
  fxPush({ k:'flash', x:0, y:0, c:HERO[u.k].col });
  log(`✨ ${u.ic} ${u.n} — ${HERO[u.k].u}!`); beep(440, 880, .18, .05);
  if(S.tut === 2) tutGo(0);
  UI.p[i] = -1; return true;
}
function autoUlt(){                                                                 // AUTO — 공격기는 바로, 회복·방어기는 예고가 떴거나 다쳤을 때 아껴 쓴다
  const tel = S.foes.some(f=>f.tel && !f.dead), low = S.heroes.some(h=>!h.dead && h.hp < h.max * .55);
  S.heroes.forEach((u, i)=>{ if(u.dead || u.en < 100) return;
    if(u.k === 'haenyeo' && !low) return; if((u.k === 'seal' || u.k === 'turtle') && !tel && !low) return;
    ult(i); });
}
const telTargets = k => { const a = S.heroes.filter(h=>!h.dead), fr = a.filter(h=>h.slot < 2), bk = a.filter(h=>h.slot >= 2);
  return k === 'all' ? a : k === 'front' ? (fr.length ? fr : bk) : (bk.length ? bk : fr); };
function bossTick(b, dt){
  if(b.x !== b.hx) return;
  if(!b.rage && b.hp < b.max * .5){ b.rage = 1; b.spd *= .75; S.banQ = [`🔥 ${b.n} 분노!`, 'boss']; S.shk = .3; log(`🔥 ${b.n}가 성났어요 — 기술이 더 자주 와요`); }
  if(b.tel){ if((b.tel.t -= dt) <= 0){ const k = b.tel.k; b.tel = null; bossHit(b, k); } return; }
  if(b.st > 0 || (b.pT -= dt) > 0) return;
  const k = b.pat[b.pi++ % b.pat.length]; b.tel = { k, t:1.7, d:1.7 }; b.pT = b.rage ? 5.5 : 7.5;
  S.banQ = [`⚠️ ${PAT[k]}!`, 'boss']; log(`⚠️ ${b.ic} ${PAT[k]} 준비 — 빨간 바닥을 보세요`); beep(180, 120, .3, .05);
}
function bossHit(b, k){
  if(k === 'call'){ for(let i = 0; i < 2; i++) S.foes.push(mkFoe(CH[S.v].fo[i % CH[S.v].fo.length], i + 1, S.g)); S.banQ = ['🌊 부하가 몰려와요!', 'boss']; return; }
  telTargets(k).forEach(h=>hit(h, b.atk * (k === 'all' ? 1.3 : k === 'back' ? 1.7 : 2.3), 0));   // 뒷줄은 약한 동료라 덜 아프게 — 대신 예고를 못 읽으면 힐러가 먼저 눕는다
  S.shk = .4; S.hs = Math.max(S.hs, .1); fxPush({ k:'boom' }); beep(90, 50, .4, .07);
}
function step(dt){
  const s = S; if(!s || s.mode !== 'go' || s.tut) return;
  s.t += dt; s.left -= dt; fxTick(dt);
  if(s.tutT > 0 && (s.tutT -= dt) <= 0) return tutGo(1);
  if(s.buff > 0) s.buff -= dt; if(s.red > 0) s.red -= dt; if(s.taunt && (s.taunt.t -= dt) <= 0) s.taunt = null;
  for(let i = s.sched.length - 1; i >= 0; i--){ const q = s.sched[i]; if((q.t -= dt) <= 0){ s.sched.splice(i, 1); q.f(); } }
  for(const u of s.heroes) unitTick(u, dt, s.foes);
  for(const u of s.foes) unitTick(u, dt, s.heroes);
  projTick(dt);
  for(const b of s.foes) if(b.boss && !b.dead) bossTick(b, dt);
  if(auto) autoUlt();
  for(const u of s.heroes) if(u.hp <= 0 && !u.dead){ u.dead = 1; die(u); }
  for(const u of s.foes) if(u.hp <= 0 && !u.dead){ u.dead = 1; die(u); }
  if(!s.heroes.some(u=>!u.dead)) return end(false);
  if(s.left <= 0) return end(false, 1);
  if(!s.wq && !s.foes.some(u=>!u.dead)){ if(s.wv >= s.waves.length - 1) return end(true); s.wq = .9; }
  if(s.wq > 0 && (s.wq -= dt) <= 0){ s.wq = 0; s.wv++; spawnWave(); s.heroes.forEach(u=>{ if(!u.dead) u.hp = Math.min(u.max, u.hp + u.max * .1); }); }   // 웨이브 사이 숨 고르기 +10%
}
function trail(o, cur, max, dt){ if(o.hpD == null || o.hpD < cur) o.hpD = cur; else if((o.dT -= dt) <= 0) o.hpD = Math.max(cur, o.hpD - max * .7 * dt); }

/* 효과 — 객체를 버리지 않고 POOL 로 돌려써 가비지가 안 쌓이게 */
const POOL = [], FXL = { p:.45, txt:.9, ring:.6, pop:.4, slash:.35, dive:.3, wash:1.2, boom:.5, flash:.3 };
function fxPush(o){ if(!S) return; const f = POOL.pop() || {}; f.x = 0; f.y = 0; f.vx = 0; f.vy = 0; f.c = '#FFFFFF'; f.v = ''; f.big = 0; Object.assign(f, o); f.t = 0; S.fx.push(f); return f; }
function fxTick(dt){ const a = S.fx; for(let i = a.length - 1; i >= 0; i--){ const f = a[i]; f.t += dt; if(f.k === 'p'){ f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 170 * dt; }
  if(f.t >= (FXL[f.k] || .9)){ a[i] = a[a.length - 1]; a.pop(); POOL.push(f); } } }
function spark(x, y, n, c){ for(let i = 0; i < (RM ? Math.min(2, n) : n); i++) fxPush({ k:'p', x, y, vx:(rnd() - .5) * 130, vy:-40 - rnd() * 90, c }); }
function pop(x, y, n, c){ spark(x, y, n, c); fxPush({ k:'pop', x, y, c }); }
function txt(u, v, c, big){ fxPush({ k:'txt', x:u.x + (rnd() - .5) * 10, y:u.y - u.sz - 4, v:String(v), c, big }); }

/* 판 끝 — 별(쓰러진 동료 0명 ★3 · 1명 ★2 · 그 밖 ★1) · 조개 · 참가 영웅 경험치. 결과 띠를 1.5초 보여 준 뒤(pend) 다음 화면으로.
   kind — boss: 이기면 마을을 깬다(조각·합류·다음 마을) · hunt: 이긴 별을 부탁에 적어 두고, 부탁한 사람에게 보고해야 끝 · patrol: 경험치·조개만 */
function end(win, tmo){
  const s = S, g = s.g, v = s.v, kind = s.kind || (s.s === 3 ? 'boss' : 'hunt'), boss = kind === 'boss', last = g === NS - 1, first = win && s.first;
  s.res = win ? 'win' : 'lose'; s.mode = 'done'; window._gameRun = false; tutOff();
  const stars = win ? (s.deaths === 0 ? 3 : s.deaths === 1 ? 2 : 1) : 0, prev = starOf(g);
  const sh = kind === 'patrol' ? (win ? 2 + Math.floor(g / 6) + s.bonus : 1) : win ? 3 + Math.floor(g / 4) + (first && boss ? 23 : 0) + (boss ? Math.max(0, stars - prev) * 2 : 0) + s.bonus : 1 + Math.floor(g / 8);
  const xp = kind === 'patrol' ? (win ? 14 + g * 3 : 6 + g) : win ? 20 + g * 4 : 8 + g, team = s.heroes.map(h=>h.k), before = team.map(heroLv);
  let r = { gain:0, shells:sh };
  try{ if(typeof playQuestDone === 'function') r = playQuestDone(v, boss && win && last, sh, boss && win, { g, won:boss && win, stars:boss ? stars : 0, xp, team }) || r; }catch(e){}
  if(kind === 'hunt' && win && g === sgN()) qpSet({ a:1, w:Math.max(qpOf().w, stars) });
  if(kind === 'patrol' && win && s.pid) DEAD[v + s.pid] = Date.now();
  s.r = r; s.stars = stars; s.newSt = boss && stars > prev; s.lv = team.map((k, i)=>[k, before[i], heroLv(k)]);
  if(first && boss){ s.bench = HK.filter(k=>HERO[k].j === v).filter(k=>{ NEWH.add(k); return !autoPlace(k); });   /* 빈 칸이 있으면 바로 출전, 가득 찼으면 보상 카드에서 편성으로 안내 */ const p = ME && ME.profile && ME.profile.play; if(p && p.qb) p.qb.qp = { g:sgN(), a:0, n:0, w:0 }; }   // 새 동료는 빈 칸에 바로
  log(win ? `✅ 승리 ${'★'.repeat(stars)}` : `💤 ${tmo ? '시간 초과' : '전멸'}`);
  s.banQ = win ? [`🏆 승리! ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`, 'win'] : [tmo ? '⏱ 시간 초과…' : '💤 전멸…', 'bad'];
  s.pend = !win ? lost : boss && first ? ()=>{ if(CH[v].alt){ s.alt = true; setBg(v, true); } talk(postOf(v), last ? ending : vReward); } : result;
  if(win) beep(523, 1047, .3); else beep(330, 165, .4);
  tmr = setTimeout(()=>{ if(S === s && s.pend){ const f = s.pend; s.pend = null; f(); } }, RM ? 600 : 1500);
}
const starsHtml = n => `<div class="q-stars" aria-label="별 ${n}개">${[0, 1, 2].map(i=>`<i class="${i < n ? '' : 'off'}" style="animation-delay:${.15 + i * .22}s">★</i>`).join('')}</div>`;
const stats = () => `<div class="go-st"><span>처치<b>${S.killed}</b></span><span>조개<b>${S.r && S.r.shells || 0}${S.r && S.r.x2 ? ' ×2' : ''}</b></span><span>XP<b>+${S.r && S.r.gain || 0}</b></span></div>`;
const lvRow = () => lvHtml(S.lv || []);
function result(){
  const s = S, ov = ovEl(''), hunt = s.kind === 'hunt', q = VIL[s.v].q[s.s], by = hunt && q ? whoN(q.by) : ''; s.mode = 'card';
  ov.innerHTML = `<div class="go-card"><div class="go-t">🏆 승리!</div>${starsHtml(s.stars)}
    <div class="go-d">${hunt && q ? `📜 「${esc(q.t)}」 — 이제 <b>${esc(by)}</b>에게 돌아가 보고하세요` : s.stars < 3 ? '해변 순찰 완료! 아무도 쓰러지지 않으면 ★3' : '해변 순찰 완료! 완벽해요!'}</div>${lvRow()}${stats()}
    <div class="q-ctl" style="margin-top:0"><button class="btn blue" id="q-home" type="button">🏘️ 마을로${hunt ? ' — 보고하기' : ''}</button>${hunt ? '' : '<button class="btn ghost" id="q-again" type="button">🔁 한 번 더</button>'}</div></div>`;
  $q('q-home').onclick = ()=>town(s.v);
  const a = $q('q-again'); if(a) a.onclick = ()=>{ fight(s.kind, s.g); begin(); };
  if(typeof popNext === 'function') setTimeout(popNext, 1200);
}
function vReward(){
  const v = S.v, c = CH[v], ov = ovEl(''), mo = MONO[v], js = HK.filter(k=>HERO[k].j === v), bench = (S.bench || []).filter(k=>!fmGet().includes(k));
  S.mode = 'card';
  ov.innerHTML = `<div class="go-card"><div class="qpc" aria-hidden="true">🧩</div><div class="go-t">봉인 조각 ${gotN()}/${N}</div>${starsHtml(S.stars)}
    <div class="go-d">${esc(c.n)}의 매듭 조각 — 동료 전원 체력·공격 +3%</div>
    ${js.map(k=>`<div class="q-gift"><i aria-hidden="true">${HERO[k].ic}</i><span><b>🤝 ${esc(HERO[k].n)} 합류! · ${HERO[k].role}</b><small>${fmGet().includes(k) ? '✅ 빈 자리에 바로 출전해요' : `✨ ${esc(HERO[k].u)} — ${esc(HERO[k].ud)}`}</small></span></div>`).join('')}
    ${bench.length ? `<div class="q-bench"><b>👥 새 동료가 왔어요! 팀에서 바꿔 보세요</b><small>팀이 4명으로 가득 차서 ${esc(bench.map(k=>HERO[k].n).join('·'))}${fin(HERO[bench[bench.length - 1]].n) ? '은' : '는'} 대기 중이에요</small><button class="btn" id="q-tmn" type="button">👥 팀 편성 열기</button></div>` : ''}
    ${c.gift ? `<div class="q-gift"><i aria-hidden="true">${c.gift.ic}</i><span><b>🎁 ${esc(c.gift.n)}</b><small>마을 선물 — 🎒 가방에 들어갔어요</small></span></div>` : ''}
    ${mo ? `<div class="q-mono"><i aria-hidden="true">${esc(CAST[mo[0]].ic)}</i><span><b>${esc(CAST[mo[0]].n)}의 혼잣말</b>${esc(mo[1])}</span></div>` : ''}
    ${lvRow()}${stats()}<button class="btn blue" id="q-next" type="button" style="width:100%;min-height:52px;font-size:16px">🗺️ 다음 마을 — ${esc(CH[v + 1].n)}</button></div>`;
  $q('q-next').onclick = ()=>{ sel = v + 1; map(false, v); };
  const tn = $q('q-tmn'); if(tn) tn.onclick = ()=>{ S = null; window._gameRun = false; TB = 'rw' + v; PK = bench[0] || ''; teamUp(); };   // 편성을 마치고 닫으면 지도(다음 마을까지 금빛 길)로
  if(typeof popNext === 'function') setTimeout(popNext, 1200);
}
function legend(){
  const ov = ovEl(''); if(S) S.mode = 'card';
  ov.innerHTML = `<div class="go-card">${legImg ? `<img class="q-leg" src="${legImg}" alt="전설의 보드를 든 내 캐릭터">` : '<div class="qpc">🏄</div>'}
    <div class="go-t">🏆 전설의 보드!</div><div class="go-d">열한 마을의 조각으로 봉인을 풀었어요.<br>캐릭터 꾸미기 → 보드 색에 <b>‘전설’</b>이 열렸어요.<br>마을을 돌며 순찰로 동료를 더 키워 보세요!</div>
    ${S ? stats() : ''}<button class="btn blue" id="q-next" type="button" style="width:100%;min-height:52px;font-size:16px">🏘️ 마을로</button></div>`;
  $q('q-next').onclick = ()=>town(N - 1);
  if(typeof popNext === 'function') setTimeout(popNext, 1200);
}
function lost(){
  const s = S, c = CH[s.v], ov = ovEl(''), a = (VIL[s.v].q[Math.min(2, s.s)] || {}).by, nm0 = a ? whoN(a) : c.a.n; s.mode = 'card';
  ov.innerHTML = `<div class="go-card"><div class="go-t">💤 ${s.left <= 0 ? '시간 초과' : '전멸'}…</div>
    <div class="go-d">${esc(nm0)}: “쉬었다 다시 가 보렴.”</div>
    <div class="go-b">💡 더 세지는 법 — ⚔️ 해변 순찰로 레벨 업 · 🎒 장비·⭐ 성급 강화(🐚) · 탱커 앞줄·힐러 뒷줄 · 보스 예고엔 방어 필살기</div>${lvRow()}${stats()}
    <div class="q-ctl" style="margin-top:0"><button class="btn blue" id="q-again" type="button">🔁 다시</button><button class="btn ghost" id="q-tm2" type="button">👥 편성</button><button class="btn ghost" id="q-home" type="button" aria-label="마을로">🏘️</button></div></div>`;
  $q('q-again').onclick = ()=>{ fight(s.kind, s.g); begin(); };
  $q('q-tm2').onclick = ()=>fight(s.kind, s.g);
  $q('q-home').onclick = ()=>town(s.v);
  if(typeof popNext === 'function') setTimeout(popNext, 1200);
}
function idleCard(id){
  const ov = ovEl('');
  ov.innerHTML = `<div class="go-card"><div class="qpc" aria-hidden="true">🌙</div><div class="go-t">떠나 있던 동안</div>
    <div class="go-d">동료들이 바다를 지키며 조개를 모았어요<br><b style="font-size:20px">🐚 ${nm(id.n, 999)}개</b><br>${id.h}시간 · 시간당 ${nm(id.rate, 99)}개${id.h >= 8 ? ' (최대 8시간)' : ''}</div>
    <div class="go-b">부탁을 마칠수록 시간당 조개가 늘어요 · 8시간마다 들러 주세요</div>
    <button class="btn blue" id="q-idle" type="button" style="width:100%;min-height:50px">받기</button></div>`;
  $q('q-idle').onclick = wBack;
}

/* ── 첫 판 튜토리얼 — AUTO를 끄게 하고, 기력이 찬 초상을 짚어 필살기를 직접 써 보게 한다(그동안 전투는 멈춤) ── */
const TUK = 'lineup.share.qtut';
const tutNeed = () => { try{ return localStorage.getItem(TUK) !== '1'; }catch(e){ return false; } };
function tutGo(n){
  if(!S) return; tutOff(); S.tut = n;
  if(n === 1){ if(!auto) return tutGo(2); tutAt($q('q-auto'), 'AUTO를 끄면 필살기 타이밍을 내가 정해요 — 눌러 보세요!', 'up'); }
  else if(n === 2){ const i = Math.max(0, S.heroes.findIndex(u=>!u.dead)); S.heroes[i].en = 100; UI.p = []; tutAt(UI.b[i] || $q('q-sks'), '기력이 찼어요! 초상을 눌러 필살기 ✨', 'dn'); }
  else { S.tut = 0; try{ localStorage.setItem(TUK, '1'); }catch(e){} if(typeof toast === 'function') toast('👍 좋아요! AUTO를 다시 켜면 동료들이 알아서 써요'); }
}
function tutAt(el, t, dir){
  if(!el) return; let b = $q('q-tut'); if(!b){ b = document.createElement('div'); b.id = 'q-tut'; b.setAttribute('role', 'status'); document.body.appendChild(b); }
  const r = el.getBoundingClientRect(); b.className = 'q-tut ' + dir; b.textContent = t; b.hidden = false;
  b.style.left = Math.max(120, Math.min(innerWidth - 120, r.left + r.width / 2)) + 'px'; b.style.top = (dir === 'up' ? r.bottom + 12 : r.top - 12) + 'px';
  el.classList.add('q-hl');
}
function tutOff(){ const b = $q('q-tut'); if(b) b.hidden = true; document.querySelectorAll('.q-hl').forEach(e=>e.classList.remove('q-hl')); }

/* ══ 마을 탐험 — 마을을 걸어 다니며 주민과 대화하고 부탁(퀘스트)을 들어준다 ══════════════════════════
   마을 하나 = 부탁 셋(① 물리치기 ② 모으기 ③ 전하기) + 해변 끝 보스. 부탁 하나를 마치는 것이 옛 '스테이지 하나'와 같다
   (qb.sg 를 그대로 쓴다) — 그래서 옛 저장도 그대로 이어진다(sg 12 = 네 번째 마을 첫 부탁부터).
   진행 중인 부탁은 qb.qp {g 몇 번째 부탁, a 받았나, n 모은 수, w 물리치기 별}, 장비는 qb.eq {b 보드, w 슈트 0~10}.
   화면 — 장면 SVG(#q-bg, 하늘·바다·마을 랜드마크)는 뒤에서 느리게 흐르고(시차), 아래 모래사장 띠(#q-wd)를 걷는다.
   눌러서 이동, 사람·몬스터·물건을 누르면 걸어가서 말 걸기·전투·줍기. 키보드는 방향키 + Enter. */
const WW = 1100, SPD = 185, TWK = 'lineup.share.qtw', TVK = 'lineup.share.qtv';
/* 마을 사람 생김새 — 앱의 모찌 캐릭터(mochiSVG) 프로필. 동물(꽃게·물개·거북·돌고래·고래)은 이모지 그대로 */
const LK = {
  haenyeo:{ gender:'f', hair:'bun', hairc:'w', skin:'d', wear:'suit', top:'k', bottom:'k', face:'happy', eye:'droopy', brow:'soft', acc:'none' },
  fisher:{ gender:'m', hair:'short', hairc:'k', skin:'t', wear:'vest', top:'khaki', bottom:'denim', hat:'bucket', hatc:'khaki', brow:'thick', acc:'none' },
  kid:{ gender:'f', hair:'pony', hairc:'n', skin:'s', wear:'rash', top:'sky', bottom:'b', face:'wow' },
  inn:{ gender:'f', hair:'bob', hairc:'n', skin:'l', wear:'aloha', top:'pink', bottom:'w', face:'happy' },
  snork:{ gender:'m', hair:'twoblock', hairc:'k', skin:'s', wear:'rash', top:'g', bottom:'navy', gear:'fins', acc:'none' },
  captain:{ gender:'m', hair:'short', hairc:'n', skin:'t', wear:'vest', top:'navy', bottom:'k', hat:'cap', hatc:'navy', brow:'thick', acc:'none' },
  ferry:{ gender:'m', hair:'buzz', hairc:'w', skin:'d', wear:'knit', top:'beige', bottom:'navy', brow:'thick', eye:'droopy', acc:'mole' },
  ticket:{ gender:'f', hair:'halfup', hairc:'k', skin:'l', wear:'zipup', top:'r', bottom:'k', hat:'visor', hatc:'r' },
  coach:{ gender:'m', hair:'surf', hairc:'y', skin:'t', wear:'rash', top:'o', bottom:'k', face:'cool', acc:'zinc' },
  pupil:{ gender:'f', hair:'wave', hairc:'n', skin:'s', wear:'shorty', top:'pink', bottom:'pink', face:'happy' },
  photo:{ gender:'m', hair:'twoblock', hairc:'n', skin:'s', wear:'tee', top:'w', bottom:'denim', hat:'cap', hatc:'k', hold:'gopro' },
  surfer:{ gender:'m', hair:'long', hairc:'k', skin:'t', wear:'suit', top:'k', bottom:'k', face:'cool' },
  cafe:{ gender:'f', hair:'bob', hairc:'y', skin:'l', wear:'overall', top:'cream', bottom:'denim', hold:'coffee', face:'happy' },
  keeper:{ gender:'m', hair:'short', hairc:'w', skin:'d', wear:'knit', top:'navy', bottom:'k', hat:'beanie', hatc:'r', brow:'thick' },
  hiker:{ gender:'f', hair:'perm', hairc:'n', skin:'s', wear:'zipup', top:'g', bottom:'k', hat:'bucket', hatc:'g', face:'happy' },
  imo:{ gender:'f', hair:'perm', hairc:'k', skin:'s', wear:'check', top:'r', bottom:'navy', face:'happy', hat:'band' },
  market:{ gender:'m', hair:'short', hairc:'k', skin:'t', wear:'overall', top:'w', bottom:'sky', face:'happy', acc:'none' },
  sailor:{ gender:'m', hair:'buzz', hairc:'k', skin:'t', wear:'stripe', top:'navy', bottom:'navy', hat:'beanie', hatc:'navy' },
  poet:{ gender:'m', hair:'bun', hairc:'w', skin:'s', wear:'knit', top:'beige', bottom:'khaki', brow:'soft', eye:'droopy', acc:'none' },
  bike:{ gender:'f', hair:'pony', hairc:'b', skin:'l', wear:'zipup', top:'sky', bottom:'w', hat:'cap', hatc:'sky' },
  station:{ gender:'m', hair:'twoblock', hairc:'k', skin:'s', wear:'zipup', top:'navy', bottom:'navy', hat:'cap', hatc:'navy', acc:'glasses' },
  sunrise:{ gender:'f', hair:'long', hairc:'k', skin:'s', wear:'zipup', top:'wine', bottom:'k', hold:'gopro' },
  travel:{ gender:'m', hair:'short', hairc:'n', skin:'l', wear:'hood', top:'b', bottom:'denim', hold:'coffee', face:'sleepy' },
  camp:{ gender:'m', hair:'short', hairc:'n', skin:'t', wear:'vest', top:'khaki', bottom:'khaki', hat:'cap', hatc:'khaki', gear:'towel' },
  campkid:{ gender:'f', hair:'twin', hairc:'n', skin:'s', wear:'poncho', top:'y', bottom:'b', face:'happy' },
  guide:{ gender:'f', hair:'hime', hairc:'k', skin:'s', wear:'suit', top:'sky', bottom:'sky', gear:'fins' },
  huk:{ gender:'m', hair:'short', hairc:'k', skin:'s', wear:'suit', top:'k', bottom:'k', face:'cool', brow:'sad' },
  shop:{ gender:'f', hair:'pixie', hairc:'r', skin:'s', wear:'aloha', top:'o', bottom:'denim', hat:'straw', face:'wink' },
};
const BOARDY = ['coach', 'pupil', 'surfer', 'kid', 'huk'];                           // 보드를 든 사람들
/* 마을마다 — a·b 는 이야기 속 인물(CH 의 a·b, x·d 는 서 있는 자리), c·d 는 주민, q 는 부탁 셋.
   q: by 부탁하는 사람 · t 제목 · k 종류(hunt 물리치기 / get 3개 모으기 / give 전하기) · o 할 일 · ask 부탁 대사 · ok 끝 대사(전하기는 받는 사람이 말한다).
   x 는 마을 안 가로 자리(0~1100, 왼쪽이 마을, 오른쪽이 해변), d 는 앞뒤 깊이(0 물가 ~ 1 화면 앞) */
const VIL = [
  { a:{ lk:'haenyeo', x:400, d:.42 },
    c:{ n:'어부 아저씨', ic:'🎣', lk:'fisher', x:150, d:.66, say:['아야진 항구는 작아도 새벽 배가 부지런히 들어와.', '해녀 할머니는 물질만 오십 년이셔. 이 바다 바닥을 손바닥처럼 아시지.'] },
    d:{ n:'꼬마 서퍼 해솔', ic:'🏄', lk:'kid', x:560, d:.8, say:['나도 언젠가 전설의 보드 타 볼 거야!', '끼룩이는 말도 해! 진짜라니까!'] },
    q:[{ by:'a', t:'해파리 쫓아내기', k:'hunt', o:'해변의 해파리 무리 물리치기', ask:'방파제 쪽 해파리 때문에 물질을 못 해. 오른쪽 해변의 해파리 무리 좀 쫓아 주렴.', ok:'허허, 손이 맵구먼! 이제야 물에 들어가겠다.' },
       { by:'a', t:'흩어진 전복 찾기', k:'get', it:'🐚', itn:'전복', o:'모래밭에 흩어진 전복 줍기', ask:'파도에 망사리가 뒤집혀서 전복이 모래밭에 흩어졌어. 세 개만 찾아다 주련?', ok:'고맙다. 저녁엔 전복죽 끓여 주마.' },
       { by:'a', t:'할머니의 도시락', k:'give', it:'🍱', itn:'도시락', to:'c', o:'어부 아저씨에게 도시락 전하기', ask:'새벽부터 배 손질하는 어부한테 이 도시락 좀 갖다주련?', ok:'오, 할머니 도시락! 이 맛에 배 타지. 고맙다고 전해 줘.' }] },
  { b:{ x:880, d:.3, bs:1 },
    c:{ n:'민박집 사장님', ic:'🏠', lk:'inn', x:400, d:.45, say:['천진은 물이 맑아서 손님들이 스노클을 많이 하러 와요.', '저녁엔 마당에서 파도 소리 들으면서 쉬어 가요.'] },
    d:{ n:'스노클 대학생', ic:'🤿', lk:'snork', x:150, d:.72, say:['천진은 물이 맑아서 바닥까지 다 보여요!', '바위 근처엔 꽃게가 진짜 많아요. 발 조심!'] },
    q:[{ by:'c', t:'바위 밑 꽃게 떼', k:'hunt', o:'해변의 꽃게 떼 물리치기', ask:'꽃게들이 손님들 발가락을 꼬집어서 난리예요! 해변 쪽 꽃게 떼 좀 진정시켜 줘요.', ok:'이제야 손님들이 물에 들어가네요. 고마워요!' },
       { by:'c', t:'날아간 튜브 찾기', k:'get', it:'🛟', itn:'튜브', o:'바람에 날아간 튜브 줍기', ask:'바람이 세게 불어서 손님들 튜브가 다 날아갔어요. 세 개만 찾아 줄래요?', ok:'우리 민박 튜브 맞아요! 오늘 저녁은 서비스예요.' },
       { by:'c', t:'꽃게 대장과 화해', k:'give', it:'🐚', itn:'반짝 조개', to:'b', o:'꽃게 대장에게 반짝 조개 전하기', ask:'꽃게 대장이 단단히 화가 났대요. 이 반짝 조개를 선물로 건네 볼래요?', ok:'흥, 선물로 넘어갈 줄 알고? …예쁘긴 하네. 그래도 조각은 집게로 증명해야 준다!' }] },
  { a:{ lk:'captain', x:400, d:.42 },
    c:{ n:'갯배 사공', ic:'⛴️', lk:'ferry', x:150, d:.62, say:['갯배는 줄을 당겨서 건너는 배야. 힘보다 박자지.', '아바이마을 순대 먹어 봤어? 속초 왔으면 한 접시는 먹어야지.'] },
    d:{ n:'관람차 매표원', ic:'🎡', lk:'ticket', x:560, d:.8, say:['밤엔 대관람차 불빛이 바다에 비쳐서 정말 예뻐요.', '설악산 바람이 내려오면 바닷바람이 금방 차가워져요.'] },
    q:[{ by:'a', t:'그물 찢는 상어', k:'hunt', o:'해변의 상어 떼 물리치기', ask:'밤마다 상어 떼가 그물을 찢어 놔. 해변 쪽 놈들 좀 쫓아 줘.', ok:'이야, 오늘 밤은 그물 걱정 없겠구먼!' },
       { by:'a', t:'찢긴 그물 조각', k:'get', it:'🪢', itn:'그물 조각', o:'해변에 널린 그물 조각 줍기', ask:'찢긴 그물 조각이 해변에 널렸어. 세 개 모아 오면 기워 보지.', ok:'이 정도면 금방 기우지. 손재주 좋은 선장 아니겠어?' },
       { by:'a', t:'선장의 쪽지', k:'give', it:'✉️', itn:'쪽지', to:'c', o:'갯배 사공에게 쪽지 전하기', ask:'갯배 사공한테 이 쪽지 좀 전해 줘. 검은 서퍼를 봤는지 물어봐 줘.', ok:'검은 슈트 청년? 어제 바다만 한참 보다 가더라. 쓸쓸한 눈이었어.' }] },
  { a:{ lk:'coach', x:400, d:.44 },
    c:{ n:'강습생 바다', ic:'🏄‍♀️', lk:'pupil', x:150, d:.72, say:['코치님 강습은 무섭지만 금방 일어서게 돼요!', '패들은 팔로만 하는 게 아니래요. 등까지 같이 써야 한대요.'] },
    d:{ n:'해변 사진사', ic:'📷', lk:'photo', x:560, d:.58, say:['의상대에서 내려다보면 낙산 해변이 한눈에 들어와요.', '해 뜰 때 바다 쪽 정자를 찍으면 그림 같아요.'] },
    q:[{ by:'a', t:'성난 파도 읽기', k:'hunt', o:'해변의 성난 파도 물리치기', ask:'파도 읽는 법은 부딪혀 봐야 알아. 해변의 성난 파도랑 한판 붙어 봐!', ok:'좋아, 파도 보는 눈이 생겼네.' },
       { by:'a', t:'빠진 보드 핀', k:'get', it:'🔷', itn:'보드 핀', o:'떠내려간 보드 핀 줍기', ask:'강습생들 보드 핀이 빠져서 다 떠내려갔어. 세 개만 찾아 줄래?', ok:'핀 없이 타면 보드가 빙글빙글 돌거든. 고마워!' },
       { by:'a', t:'강습 전단지', k:'give', it:'📄', itn:'전단지', to:'d', o:'사진사에게 전단지 전하기', ask:'사진사한테 이 강습 전단지 좀 전해 줘. 잘 보이는 데 붙여 달라고.', ok:'코치님 전단지네요! 아, 아까 바위 위에 검은 서퍼가 서 있었어요.' }] },
  { a:{ x:430, d:.36 }, b:{ lk:'surfer', x:570, d:.66 },
    c:{ n:'카페 사장님', ic:'☕', lk:'cafe', x:150, d:.62, say:['서핑 끝나고 마시는 커피가 제일 맛있대요.', '죽도·인구 해변은 서퍼들이 많이 모여요. 주말엔 라인업이 꽉 차요.'] },
    q:[{ by:'b', t:'라인업 지키기', k:'hunt', o:'해변의 해파리·상어 물리치기', ask:'라인업에 해파리랑 상어가 몰려왔어! 같이 몰아내자!', ok:'역시! 이제 다시 파도 탈 수 있겠다.' },
       { by:'a', t:'몽돌의 조개 간식', k:'get', it:'🦪', itn:'조개', o:'모래밭에서 조개 줍기', ask:'꾸웅… 배고파서 힘이 안 나. 조개 세 개만 찾아 줄래?', ok:'꾸웅! 냠냠. 이제 힘이 난다!' },
       { by:'b', t:'서퍼들의 주문', k:'give', it:'📝', itn:'주문서', to:'c', o:'카페 사장님에게 주문서 전하기', ask:'카페 사장님한테 우리 주문 좀 전해 줘. 아이스 아메리카노 다섯!', ok:'다섯 잔 금방 나가요! 그런데 요즘 밤마다 바다에서 휘파람 소리가 들려요.' }] },
  { a:{ x:400, d:.42 },
    c:{ n:'등대지기', ic:'🗼', lk:'keeper', x:150, d:.6, say:['하조대 등대는 바위 위에 있어서 멀리서도 잘 보여.', '절벽 위 정자에 오르면 바다가 한눈에 들어오지.'] },
    d:{ n:'등산객 아주머니', ic:'🥾', lk:'hiker', x:560, d:.78, say:['하조대 바위 절벽은 언제 봐도 장관이에요.', '바다랑 소나무가 한 화면에 들어오는 데가 흔치 않아요.'] },
    q:[{ by:'a', t:'절벽 아래 상어 떼', k:'hunt', o:'해변의 상어 떼 물리치기', ask:'절벽 아래 물살에 상어 떼가 숨어 있구나. 쫓아내 보거라.', ok:'잘 버텼다. 침착함이 몸에 붙었구나.' },
       { by:'c', t:'등대 불쏘시개', k:'get', it:'🪵', itn:'마른 솔가지', o:'마른 솔가지 줍기', ask:'폭풍 오기 전에 비상 불을 준비해야 해. 마른 솔가지 세 개만 주워 줘.', ok:'이걸로 오늘 밤은 든든하다. 고마워.' },
       { by:'c', t:'등대지기의 소식', k:'give', it:'🔭', itn:'관측 기록', to:'a', o:'거북 할아버지께 관측 기록 전하기', ask:'거북 할아버지께 이 기록 좀 전해 줘. 어젯밤 검은 서퍼가 남쪽으로 갔어.', ok:'허어, 남쪽이라… 주문진 쪽이로구나. 서두르되 배는 채우고 가거라.' }] },
  { a:{ lk:'imo', x:400, d:.46 },
    c:{ n:'수산시장 상인', ic:'🦑', lk:'market', x:150, d:.62, say:['주문진은 오징어랑 대게로 유명하지!', '새벽 경매 소리가 주문진의 아침 알람이야.'] },
    d:{ n:'오징어배 선원', ic:'⚓', lk:'sailor', x:560, d:.76, say:['밤바다에 오징어배 불빛이 줄지어 떠 있으면 장관이야.', '방파제 앞 파도가 세지면 배가 못 나가.'] },
    q:[{ by:'a', t:'방파제 앞 성난 파도', k:'hunt', o:'해변의 성난 파도 물리치기', ask:'방파제 앞에 성난 파도가 계속 쳐서 배가 못 나가. 좀 잠재워 줄래?', ok:'장하다! 배들이 다시 나간다!' },
       { by:'c', t:'탈출한 대게', k:'get', it:'🦀', itn:'대게', o:'수조에서 탈출한 대게 잡기', ask:'아이고, 대게 세 마리가 수조에서 탈출했어! 모래밭 어딘가에 있을 거야.', ok:'요 녀석들! 고맙다, 서퍼 양반.' },
       { by:'a', t:'주먹밥 배달', k:'give', it:'🍙', itn:'주먹밥', to:'d', o:'선원에게 주먹밥 전하기', ask:'밤새 배 탄 선원한테 주먹밥 좀 갖다줄래? 넉넉히 쌌어.', ok:'이모 주먹밥은 언제나 최고야! 기운 난다!' }] },
  { a:{ x:420, d:.36 },
    c:{ n:'시인 할아버지', ic:'📜', lk:'poet', x:150, d:.58, say:['경포엔 달이 다섯 뜬다지. 하늘, 호수, 바다, 술잔, 그리고 마주 본 눈.', '경포호 둘레를 천천히 걸어 보게. 마음이 잔잔해진다네.'] },
    d:{ n:'자전거 대여점 직원', ic:'🚲', lk:'bike', x:580, d:.78, say:['경포호 한 바퀴는 자전거로 돌면 금방이에요.', '저녁엔 해변 산책로에 불이 켜져서 걷기 좋아요.'] },
    q:[{ by:'a', t:'호수 넘어온 해파리', k:'hunt', o:'해변의 해파리 떼 물리치기', ask:'삐익! 호수 쪽에서 해파리가 넘어오고 있어! 같이 막자!', ok:'삐-익! 너 진짜 빠르다!' },
       { by:'c', t:'흩어진 달빛 조각', k:'get', it:'🌙', itn:'달빛 조각', o:'모래밭의 달빛 조각 줍기', ask:'바다에 달이 비치지 않는구나. 모래밭에 떨어진 달빛 조각 셋을 모아 주겠나?', ok:'오오, 바다 달이 조금 돌아왔구먼.' },
       { by:'c', t:'시 한 수 전하기', k:'give', it:'📜', itn:'시', to:'a', o:'파랑에게 시 전하기', ask:'이 시를 파랑에게 전해 주게. 바다 친구에게 바치는 노래라네.', ok:'삐익… 바다에 달이 다시 비쳤어! 할아버지께 고맙다고 전해 줘!' }] },
  { a:{ lk:'station', x:400, d:.42 },
    c:{ n:'해돋이 사진가', ic:'📸', lk:'sunrise', x:150, d:.62, say:['정동진은 바다 바로 앞 기차역으로 유명해요.', '해돋이를 보려고 밤기차 타고 온 사람이 많아요.'] },
    d:{ n:'여행객', ic:'🎒', lk:'travel', x:570, d:.78, say:['첫차가 와야 집에 가는데… 해가 안 떠요.', '모래시계 공원의 큰 모래시계 봤어요? 진짜 커요.'] },
    q:[{ by:'a', t:'철길 옆 꽃게 떼', k:'hunt', o:'해변의 꽃게 떼 물리치기', ask:'철길까지 먹물이 튀었어요. 해변의 꽃게 떼부터 막아 주세요!', ok:'철길이 깨끗해졌어요! 이제 문어만 남았네요.' },
       { by:'d', t:'날아간 기차표', k:'get', it:'🎫', itn:'기차표', o:'바람에 날아간 기차표 줍기', ask:'바람에 승객들 기차표가 다 날아갔어요. 세 장만 찾아 주세요!', ok:'찾았다! 이제 첫차만 오면 돼요.' },
       { by:'a', t:'첫차 시간표', k:'give', it:'🗒️', itn:'시간표', to:'c', o:'사진가에게 첫차 시간표 전하기', ask:'사진가님께 첫차 시간표 좀 전해 주세요. 해돋이 찍으러 오셨거든요.', ok:'고마워요! 해만 뜨면 최고의 사진이 될 거예요. 저 문어만 아니면…' }] },
  { a:{ x:640, d:.12 },
    c:{ n:'캠핑장 관리인', ic:'⛺', lk:'camp', x:400, d:.5, say:['망상은 백사장이 길고 넓어서 캠핑하기 좋아.', '폭풍 오는 날엔 텐트 줄을 두 번씩 묶어야 해.'] },
    d:{ n:'캠핑 온 아이', ic:'🧒', lk:'campkid', x:150, d:.76, say:['비가 와도 텐트 안은 따뜻해요!', '고래 할머니 노래 들었어요? 바다 전체가 울리는 소리예요.'] },
    q:[{ by:'c', t:'폭풍 속 상어', k:'hunt', o:'해변의 상어 떼 물리치기', ask:'폭풍 틈에 상어가 얕은 물까지 들어왔어. 캠핑객들 다치기 전에 막아 줘!', ok:'휴, 다들 무사해. 정말 고마워.' },
       { by:'c', t:'날아간 텐트 말뚝', k:'get', it:'📌', itn:'텐트 말뚝', o:'날아간 텐트 말뚝 줍기', ask:'바람에 텐트 말뚝이 다 날아갔어. 세 개만 찾아 줘!', ok:'이걸로 텐트는 버티겠다!' },
       { by:'c', t:'고래 할머니께 랜턴', k:'give', it:'🏮', itn:'랜턴', to:'a', o:'고래 할머니께 랜턴 전하기', ask:'바닷가의 고래 할머니께 이 랜턴 좀 전해 줘. 폭풍 속에서도 길을 비춰 줄 거야.', ok:'우우웅… 따뜻한 불빛이구나. 고맙다, 아이야.' }] },
  { c:{ n:'스노클 가이드', ic:'🤿', lk:'guide', x:400, d:.5, say:['장호항 물은 맑아서 스노클하기 딱 좋아요.', '바위섬 사이 소용돌이가 점점 커지고 있어요. 조심하세요!'] },
    d:{ n:'흑조', ic:'🏄‍♂️', lk:'huk', x:640, d:.16, say:['…가. 지금은 아무 말도 듣고 싶지 않아.', '스승님은 꼭 돌아오실 거야.'] },
    q:[{ by:'c', t:'소용돌이 앞 해파리', k:'hunt', o:'해변의 해파리 떼 물리치기', ask:'소용돌이에서 해파리가 쏟아져요! 바위섬 앞을 막아 주세요!', ok:'고마워요! 이제 소용돌이만 남았어요.' },
       { by:'c', t:'흩어진 매듭 실', k:'get', it:'🧵', itn:'매듭 실', o:'봉인 매듭 실 줍기', ask:'소용돌이에 봉인 매듭 실이 풀려 흩어졌어요. 세 가닥만 모아 주세요!', ok:'실이 빛나요… 열한 조각이 서로를 부르는 것 같아요.' },
       { by:'c', t:'흑조에게 리쉬를', k:'give', it:'🪢', itn:'해녀 할머니의 리쉬', to:'d', o:'흑조에게 리쉬 건네기', ask:'저기 물가의 검은 서퍼… 흑조 씨예요. 해녀 할머니 리쉬를 건네 볼래요?', ok:'…끝까지 놓지 않는 마음이라고? …스승님이 늘 하던 말이야.' }] },
];
const SHOPX = 270, MOB = { q:[830, .56], p1:[740, .22], p2:[960, .84] }, BX = [1040, .32];
const JN = { 0:'a', 1:'b', 3:'a', 4:'a', 5:'a', 7:'a', 9:'a' };                       // 보스를 넘으면 동료로 따라오는 사람 — 마을엔 더 서 있지 않는다
const short = v => CH[v].n.split(' ').pop();
const fin = w => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 ? (c - 0xAC00) % 28 : 0; };   // 받침(0 = 없음)
const jo = (w, a, b) => w + (fin(w) ? a : b);                                          // 을/를 · 이/가 · 와/과
const ro = w => w + (fin(w) && fin(w) !== 8 ? '으로' : '로');                            // ㄹ 받침은 '로'
const tw = () => { try{ return +localStorage.getItem(TWK) || 0; }catch(e){ return 3; } };
const twSet = n => { try{ localStorage.setItem(TWK, String(n)); }catch(e){} };
let GOT = { g:-1, s:[] };                                                               // 이번 부탁에서 주운 자리 — 다른 자리 것을 먼저 주워도 주운 게 다시 나타나지 않게
const gotOk = I => GOT.g === I.g && GOT.s.length === I.p.n;                          // 저장된 개수와 맞을 때만 믿는다(다른 기기·초기화)
const DEAD = {};                                                                        // 순찰 몬스터 — 이긴 무리는 40초 뒤에 다시 나온다
const NIMG = {};
function npcImg(k){
  if(NIMG[k] != null) return NIMG[k]; let u = '';
  try{ if(typeof mochiSVG === 'function' && LK[k]) u = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(mochiSVG(LK[k], { charm:BOARDY.includes(k) ? 2 : 0, uid:'qn' + k })); }catch(e){}
  return NIMG[k] = u;
}
let TV = 0, WK = null, walkImg = '', TB = '';
const KEY = {};

/* ── 진행 ── 지금 몇 번째 부탁인지(g = sg), 그 부탁의 진행(qp), 장비(eq) */
const qNow = () => { const g = sgN(); return { g, v:Math.floor(g / 4), s:g % 4, all:g >= NS || !!qbOf().legend }; };
const qpOf = () => { const p = qbOf().qp, g = sgN(); return p && typeof p === 'object' && nm(p.g, NS) === g ? { g, a:nm(p.a, 1), n:nm(p.n, 3), w:nm(p.w, 3) } : { g, a:0, n:0, w:0 }; };
function qpSet(o){ const p = ME && ME.profile && ME.profile.play; if(!p) return; (p.qb ||= {}).qp = { ...qpOf(), ...o }; if(typeof playPush === 'function') playPush(); }
/* 지금 마을의 상태 — s: 0~2 부탁 순서 · 3 보스 차례 · 4 다 깸 */
function vInfo(){ const n = qNow(), here = !n.all && n.v === TV, s = here ? n.s : 4; return { ...n, here, s, q:here && s < 3 ? VIL[TV].q[s] : null, p:qpOf() }; }
const ready = I => !!(I.q && I.p.a && (I.q.k === 'hunt' ? I.p.w > 0 : I.q.k === 'get' ? I.p.n >= 3 : false));
const EQ = { b:{ ic:'🏄', n:'서핑보드', d:'동료 전원 공격', per:4 }, w:{ ic:'🩱', n:'웻슈트', d:'동료 전원 체력', per:5 } };
const EQC = [20, 35, 55, 80, 110, 150, 200, 260, 330, 400];
const eqOf = k => nm((qbOf().eq || {})[k], 10);
function eqBuy(k){
  const p = ME && ME.profile && ME.profile.play; if(!p || !EQ[k]) return false;
  const lv = eqOf(k), say = t => { if(typeof toast === 'function') toast(t); };
  if(lv >= 10){ say('이미 최고 단계예요'); return false; }
  const c = EQC[lv], bal = typeof shellBal === 'function' ? shellBal() : 0;
  if(bal < c){ say(`🐚 조개가 모자라요 — ${c}개 필요 (보유 ${bal})`); return false; }
  (p.qb ||= {}).eq = { b:eqOf('b'), w:eqOf('w'), [k]:lv + 1 }; p.spent = (p.spent || 0) + c;
  if(typeof playPush === 'function') playPush(); try{ vib([20, 40, 20]); }catch(e){} return true;
}
const whoN = id => { const w = who(id); return w ? w.n : ''; };

/* ── 마을 그림 — 모래사장 띠(가로 1100) + 소품. 깊이 d(0~1) → 화면 y ── */
const fy = (G, d) => G.gt + 30 + d * (G.gh - 50);
const mix = (a, b, t) => '#' + [1, 3, 5].map(i=>Math.round(parseInt(a.substr(i, 2), 16) * (1 - t) + parseInt(b.substr(i, 2), 16) * t).toString(16).padStart(2, '0')).join('');
function ground(v, P, G, dk){
  const h = G.gh, w = WW; let e = 'M0 16';
  for(let x = 0; x < w; x += 44) e += `Q${x + 22} ${f1(7 + hs(x, v + 7) * 7)} ${x + 44} 16`;
  let s = `<svg class="qw-gr" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="top:${G.gt}px" aria-hidden="true" focusable="false"><defs>
    <linearGradient id="qwS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(P.sand, '#2A3550', .32)}"/><stop offset=".12" stop-color="${mix(P.sand, '#2A3550', .12)}"/><stop offset=".3" stop-color="${P.sand}"/><stop offset="1" stop-color="${mix(P.sand, '#FFFFFF', .14)}"/></linearGradient></defs>
    <path d="${e}V${h}H0Z" fill="url(#qwS)"/>
    <path d="M0 30Q275 24 550 31T1100 29" stroke="${P.crest}" stroke-width="1.2" fill="none" opacity=".35"/>`;
  for(let i = 0; i < 70; i++){ const x = f1(hs(i, v + 31) * w), y = f1(34 + hs(i, v + 32) * (h - 40)), r = f1(1 + hs(i, v + 33) * 1.6);
    s += i % 5 ? `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f1(r * .55)}" fill="${mix(P.sand, '#3B2A2C', .22)}" opacity=".5"/>` : `<path d="M${x} ${y}l2.4 -3.4l2.4 3.4z" fill="#FFF3E8" opacity=".7"/>`; }
  if(dk) s += `<rect width="${w}" height="${h}" fill="${dk[0]}" opacity="${f1(dk[1] * .7)}"/>`;
  return s + `</svg><svg class="qw-gr qw-fm" width="${w}" height="26" viewBox="0 0 ${w} 26" style="top:${G.gt}px" aria-hidden="true" focusable="false"><path d="${e}" stroke="${P.crest}" stroke-width="3" fill="none" opacity=".85" stroke-linecap="round"/></svg>`;   // 물가 거품 줄은 따로 — 그 한 줄만 움직여 모래밭 전체를 매 프레임 다시 그리지 않는다
}
const PW = { stall:[124, 100], umb:[74, 92], boat:[110, 54], tower:[70, 112], rack:[64, 76], rocks:[160, 74], pine:[66, 92], sign:[100, 76], lamp:[26, 100], tent:[100, 62] };   // 소품 크기(px) — 발밑 기준
const OLc = '#3B2A2C', OL = `stroke="${OLc}" stroke-width="2" stroke-linejoin="round"`;
function prop(t, x, d, G, P, i, o, dk){
  const [w, h] = PW[t], y = fy(G, d), id = 'qwp' + i; let s = '';
  if(t === 'stall') s = `<defs><pattern id="${id}" width="18" height="40" patternUnits="userSpaceOnUse"><rect width="9" height="40" fill="${o[1]}"/><rect x="9" width="9" height="40" fill="#FFFDF4"/></pattern></defs>
    <rect x="13" y="28" width="5" height="44" fill="#6B4A33"/><rect x="106" y="28" width="5" height="44" fill="#6B4A33"/>
    <path d="M4 34L16 6H108L120 34${Array.from({ length:8 }, ()=>'a7.25 6 0 0 1 -14.5 0').join('')}Z" fill="url(#${id})" ${OL}/>
    <rect x="8" y="62" width="108" height="36" rx="3" fill="#C8955F" ${OL}/><rect x="9" y="63" width="106" height="6" fill="#A87642"/>
    <rect x="26" y="72" width="72" height="18" rx="4" fill="#FFF7E3" stroke="${OLc}" stroke-width="1.5"/><text x="62" y="85.5" text-anchor="middle" font-size="11" font-weight="800" fill="#1F2A44">${esc(o[0])}</text>`;
  else if(t === 'umb') s = `<rect x="35.5" y="16" width="3" height="76" fill="#7A6A58"/><path d="M3 36Q37 -6 71 36Q62 30 54 36Q46 30 37 36Q28 30 20 36Q12 30 3 36Z" fill="${o}" ${OL}/><path d="M37 8Q27 18 22 34M37 8Q47 18 52 34" stroke="#FFFDF4" stroke-width="5" fill="none" opacity=".9"/>`;
  else if(t === 'boat') s = `<path d="M4 26H106L94 52H16Z" fill="${o}" ${OL}/><rect x="4" y="22" width="102" height="7" fill="#FFFDF4" ${OL}/><rect x="40" y="5" width="34" height="18" rx="2" fill="#FFFDF4" ${OL}/><rect x="46" y="10" width="9" height="7" fill="#8FD3FF"/><rect x="59" y="10" width="9" height="7" fill="#8FD3FF"/>`;
  else if(t === 'tower') s = `<path d="M16 112L24 52M54 112L46 52M19 86H51" stroke="#F4F1EA" stroke-width="5"/><path d="M16 112L24 52M54 112L46 52" stroke="${OLc}" stroke-width="1" opacity=".5"/><rect x="12" y="32" width="46" height="24" rx="2" fill="#FF6B6B" ${OL}/><path d="M5 34L35 12L65 34Z" fill="#FFFDF4" ${OL}/><text x="35" y="49" text-anchor="middle" font-size="11" font-weight="800" fill="#FFFFFF">구조</text>`;
  else if(t === 'rack') s = `<rect x="4" y="44" width="56" height="6" fill="#8A6A48" ${OL}/><rect x="6" y="50" width="4" height="26" fill="#8A6A48"/><rect x="54" y="50" width="4" height="26" fill="#8A6A48"/>${['#FFD23F', '#3FD49A', '#FF7A7A'].map((c, k)=>`<rect x="${10 + k * 16}" y="${4 + k * 3}" width="12" height="62" rx="6" fill="${c}" ${OL}/><path d="M${16 + k * 16} ${8 + k * 3}V${62 + k * 3}" stroke="#FFFFFF" stroke-width="1.4" opacity=".7"/>`).join('')}`;
  else if(t === 'rocks') s = `<path d="M6 74Q4 44 30 40Q44 18 70 26Q96 8 120 30Q152 34 156 74Z" fill="${P.near}" ${OL}/><path d="M30 42Q44 22 68 28M96 14Q112 18 120 30" stroke="${P.lit}" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/>`;
  else if(t === 'pine') s = `<g transform="translate(30 92) scale(3)">${pine(0, 0, 1, mix(P.near, '#3E7A4E', P.night ? .2 : .55))}</g>`;
  else if(t === 'sign') s = `<rect x="47" y="34" width="6" height="42" fill="#7A5A3A"/><rect x="3" y="6" width="94" height="32" rx="6" fill="#F3E2B8" ${OL}/><text x="50" y="27" text-anchor="middle" font-size="12.5" font-weight="800" fill="#1F2A44">${esc(o)}</text>`;
  else if(t === 'lamp') s = `${dk ? `<circle cx="13" cy="14" r="13" fill="${P.win}" opacity=".35"/>` : ''}<rect x="11" y="16" width="4" height="84" fill="#3B4A5E"/><rect x="5" y="6" width="16" height="14" rx="3" fill="${dk ? P.win : '#E9EEF4'}" ${OL}/>`;
  else if(t === 'tent') s = `<path d="M6 60L50 6L94 60Z" fill="${o}" ${OL}/><path d="M50 6L40 60H60Z" fill="#1F2A44" opacity=".75"/><path d="M50 6L50 60" stroke="${OLc}" stroke-width="1.5"/>`;
  return `<div class="qp" style="left:${f1(x - w / 2)}px;top:${f1(y - h)}px;width:${w}px;height:${h}px;z-index:${Math.round(y)}"><svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" focusable="false">${s}</svg></div>`;
}
function propsOf(v){
  const harbor = [0, 2, 6, 10].includes(v), awn = ['#3E8FD0', '#FF8A3D', '#2FA58A', '#E25A4A'][v % 4];
  const L = [['pine', 34, 0], ['pine', 92, .03], ['sign', 196, .1, short(v)], ['stall', SHOPX, .02, ['🛒 파도상회', awn]], ['rack', 348, .05], ['lamp', 470, .04],
    harbor ? ['boat', 590, 0, ['#3E8FD0', '#FF8A3D', '#2FA58A', '#7A4CC0'][v % 4]] : ['tower', 600, .02], ['umb', 690, .06, ['#FF6B6B', '#F4C430', '#3FD49A', '#8A5CD0'][v % 4]], ['umb', 905, .03, '#3E8FD0'], ['rocks', 1060, 0]];
  if(v === 9) L.push(['tent', 520, .02, '#F4C430']);
  return L;
}

/* ── 마을에 있는 것들 — 사람(npc)·주울 물건(item)·몬스터 무리(mob)·보스(boss). 진행이 바뀌면 다시 만든다 ── */
function wEnts(){
  const v = TV, V = VIL[v], c = CH[v], I = vInfo(), L = [], cleared = I.s === 4;
  const npc = (id, o, base) => { if(!o) return; L.push({ t:'npc', id, x:o.x, d:o.d, n:(base || o).n, ic:(base || o).ic, img:o.lk ? npcImg(o.lk) : '' }); };
  if(V.a && !(cleared && JN[v] === 'a')) npc('a', V.a, c.a);
  if(V.b && !(cleared && JN[v] === 'b') && !(V.b.bs && I.s >= 3)) npc('b', V.b, c.b);
  npc('c', V.c); npc('d', V.d);
  L.push({ t:'npc', id:'shop', x:SHOPX + 8, d:.5, n:'상점 주인', ic:'🛒', img:npcImg('shop') });
  const mob = (id, x, d, g, quest) => { const ks = wavesOf(g)[0].filter(k=>FOES[k]).slice(0, 3), F = FOES[ks[0]] || FOES.jelly;
    L.push({ t:'mob', id, x, d, g, quest, n:F.n.replace(/ 떼$/, '') + ' 무리', ic:ks.map(k=>FOES[k].ic).join('') }); };
  if(I.q && I.p.a && I.q.k === 'hunt' && !I.p.w) mob('q', MOB.q[0], MOB.q[1], I.g, 1);
  if(I.q && I.p.a && I.q.k === 'get') for(const i of [0, 1, 2].filter(j=>gotOk(I) ? !GOT.s.includes(j) : j >= I.p.n).slice(0, 3 - I.p.n)) L.push({ t:'item', id:'i' + i, x:Math.round(150 + hs(v * 3 + i, 61) * 840), d:f1(.25 + hs(v * 3 + i, 62) * .7), ic:I.q.it, n:I.q.itn });
  if(cleared || (I.here && I.s >= 1)) ['p1', 'p2'].forEach(id=>{ if(!(DEAD[v + id] > Date.now() - 4e4)) mob(id, MOB[id][0], MOB[id][1], v * 4 + 1, 0); });
  if(!cleared) L.push({ t:'boss', id:'boss', x:BX[0], d:BX[1], lock:!(I.here && I.s === 3), n:BOSS[v].n, ic:BOSS[v].ic });
  return L;
}
function eEl(e){
  const b = document.createElement('button'); b.type = 'button'; b.className = 'qe ' + e.t + (e.lock ? ' lk' : ''); b.dataset.i = e.id;
  const lab = e.t === 'npc' ? e.n : e.t === 'mob' ? (e.quest ? '📜 ' : '⚔️ ') + e.n : e.t === 'boss' ? '👑 ' + e.n : '';
  b.setAttribute('aria-label', e.t === 'npc' ? `${e.n}에게 말 걸기` : e.t === 'item' ? `${e.n} 줍기` : e.t === 'boss' ? `보스 ${e.n}` : `${e.n}와 싸우기`);
  b.innerHTML = `<i class="qe-sh" aria-hidden="true"></i><span class="qe-b" aria-hidden="true">${e.t !== 'item' ? '<i class="qe-m"></i>' : ''}${lab ? `<span class="qe-n${e.t === 'mob' || e.t === 'boss' ? ' bad' : ''}${e.quest ? ' q' : ''}">${esc(lab)}</span>` : ''}${e.img ? `<img src="${e.img}" alt="" draggable="false">` : `<span class="qe-e">${esc(e.ic)}</span>`}</span>`;
  e.el = b; e.mk = b.querySelector('.qe-m'); return b;
}
function at(el, x, d, extra){                                                     // 발밑 기준으로 세운다 — 앞(아래)일수록 살짝 크고 위에 그린다
  const G = WK.G, y0 = fy(G, d), tx = f1(x), ty = f1(y0 + (extra || 0));                  // 바뀐 값만 쓴다 — 매 프레임 스타일을 다시 계산하지 않게
  if(el._x !== tx || el._y !== ty){ el._x = tx; el._y = ty; el.style.transform = `translate3d(${tx}px,${ty}px,0)`; }
  const z = Math.round(y0) + 1; if(el._z !== z){ el._z = z; el.style.zIndex = String(z); }
  const k = ((.86 + d * .24) * (WK.k || 1)).toFixed(2); if(el._s !== k){ el._s = k; el.style.setProperty('--s', k); }
}
/* 머리 위 표시 — ❗ 부탁이 있다 · ❓ 보고/전달할 사람 · 💬 이야기 · 🛒 상점 · 👑/🔒 보스 */
function wMarks(){
  if(!WK) return; const I = vInfo(), q = I.q;
  for(const e of WK.ents){ if(!e.mk) continue; let m = '', hot = false;
    if(e.t === 'npc'){
      if(q && !I.p.a && q.by === e.id){ m = '❗'; hot = true; }
      else if(q && I.p.a && q.k === 'give' && q.to === e.id){ m = '❓'; hot = true; }
      else if(q && I.p.a && q.by === e.id){ m = ready(I) ? '❓' : '…'; hot = ready(I); }
      else m = e.id === 'shop' ? '🛒' : '💬';
    } else if(e.t === 'mob') m = e.quest ? '❗' : '';
    else if(e.t === 'boss'){ m = e.lock ? '🔒' : '❗'; hot = !e.lock; }
    e.mk.textContent = m; e.mk.className = 'qe-m' + (hot ? ' hot' : ''); e.el.classList.toggle('hot', hot); }
}
function wRefresh(){
  if(!WK || !WK.wd) return;
  WK.ents.forEach(e=>e.el && e.el.remove()); WK.ents = wEnts();
  if(WK.go){ const o = WK.go, nw = WK.ents.find(x=>x.id === o.id && x.t === o.t); WK.go = nw || null; if(!nw) WK.tx = null; }   // 가던 대상은 새로 만든 것으로 바꿔 쥔다(주운 물건이면 멈춘다)
  WK.ents.forEach(e=>{ WK.wd.appendChild(eEl(e)); at(e.el, e.x, e.d); });
  WK.near = undefined; wMarks(); wTrack(); wTut();
}
/* 퀘스트 알림판(위) — 지금 할 일 한 줄 + 목적지 방향. 누르면 그곳으로 걸어간다 */
function wGoal(){
  const I = vInfo(), q = I.q, E = id => WK.ents.find(e=>e.id === id);
  if(I.s === 4) return { t:I.all ? '🏄 전설의 보드를 찾았어요!' : `✅ ${short(TV)}의 부탁을 모두 들어줬어요`, o:I.all ? '해변 순찰로 동료를 더 키워 보세요' : `🗺️ 지도에서 다음 마을로 · ⚔️ 순찰 몬스터로 레벨 업`, e:null };
  if(I.s === 3) return { t:`👑 보스 — ${BOSS[TV].n}`, o:'해변 끝의 보스를 물리치면 봉인 조각!', e:E('boss') };
  const gv = whoN(q.by);
  if(!I.p.a) return { t:`❗ ${jo(gv, '과', '와')} 이야기하기`, o:'머리 위에 ❗가 뜬 사람을 눌러 보세요', e:E(q.by) };
  if(ready(I)) return { t:`📜 ${q.t}`, o:`완료! ${gv}에게 돌아가 보고하기`, e:E(q.by) };
  if(q.k === 'hunt') return { t:`📜 ${q.t}`, o:`${q.o} 0/1`, e:E('q') };
  if(q.k === 'get'){ const P = WK.p, its = WK.ents.filter(e=>e.t === 'item').sort((a, b)=>Math.abs(a.x - P.x) - Math.abs(b.x - P.x)); return { t:`📜 ${q.t}`, o:`${q.o} ${I.p.n}/3`, e:its[0] || null }; }
  return { t:`📜 ${q.t}`, o:`${q.o} 0/1`, e:E(q.to) };
}
function wTrack(){
  const el = $q('q-trk'); if(!el || !WK) return; const g = wGoal(); WK.goal = g;
  el.innerHTML = `<span><b>${esc(g.t)}</b><small>${esc(g.o)}</small></span><i id="q-dir" aria-hidden="true"></i>`;
  el.setAttribute('aria-label', `${g.t} — ${g.o}${g.e ? ' · 누르면 그곳으로 걸어가요' : ''}`); WK.dirT = 0; wDir();
}
function trkFlash(){ const k = $q('q-trk'); if(!k) return; k.classList.remove('nw'); void k.offsetWidth; k.classList.add('nw'); clearTimeout(trkFlash.t); trkFlash.t = setTimeout(()=>{ const e = $q('q-trk'); if(e) e.classList.remove('nw'); }, 3200); }   // 할 일이 바뀌면 알림판이 반짝 — 토스트가 대화창을 덮지 않게
function wDir(){
  const el = $q('q-dir'), g = WK && WK.goal; if(!el) return;
  if(!g || !g.e){ el.hidden = true; return; } el.hidden = false;
  const dx = g.e.x - WK.p.x, m = Math.round(Math.abs(dx) / 20), t = Math.abs(dx) < 60 ? '⬇ 바로 여기' : `${dx < 0 ? '◀' : '▶'} ${m}m`;
  if(el.textContent !== t) el.textContent = t;
}

/* ── 마을 들어가기 — 처음이면 장 제목부터. 같은 마을로 돌아오면(전투 뒤) 서 있던 자리 그대로 ── */
function town(v, title){
  v = Math.max(0, Math.min(Math.floor(openTo() / 4), nm(v, N - 1)));
  clearT(); tutOff(); S = null; window._gameRun = false; PK = ''; DR = null;
  const keep = WK && WK.v === v ? WK.p : null; TV = v; sel = v;
  try{ localStorage.setItem(TVK, String(v)); }catch(e){}
  wMode(true); const ov = $q('q-ov'); ov.hidden = true; ov.className = 'game-ov';
  WK = { v, p:keep || { x:104, d:.4, f:1 }, tx:null, td:0, go:null, cam:0, tr:[], ents:[], say:{}, t:0, dirT:0, tuT:0, sp:0, dsT:0, dsI:0 };   // 처음엔 마을 왼쪽 끝 — 주민과 겹치지 않게
  setBg(v, !!(gotN() > v && CH[v].alt)); wBuild();
  const I = vInfo(); if(title && I.here && I.s === 0 && !I.p.a) vTitle(v);
}
/* 걷기 화면 켜고 끄기 — 걷는 동안은 키 큰 화면(#quest.qw), 전투는 원래 정사각 화면 */
function wMode(on){
  const g = $q('quest'), wv = $q('q-wv'), hd = document.querySelector('#quest .game-hd > b');
  if(g) g.classList.toggle('qw', !!on); if(wv) wv.hidden = !on;
  if(!on){ const bg = $q('q-bg'); if(bg && !CN) bg.style.transform = ''; const a = $q('q-act'); if(a) a.hidden = true; }
  if(hd) hd.textContent = on ? `🏘️ ${short(TV)}` : '🗺️ 전설의 보드 원정';
}
function wBuild(){
  const wv = $q('q-wv'); if(!wv || !WK) return;
  const G = { w:wv.clientWidth || 360, h:wv.clientHeight || 600 }; G.gh = Math.round(Math.max(200, Math.min(350, G.h * .48))); G.gt = G.h - G.gh; WK.G = G; WK.k = Math.max(.9, Math.min(1.25, G.gh / 280));
  const v = TV, alt = gotN() > v && CH[v].alt, P = TOD[alt || CH[v].tod], dk = !alt && DARK[CH[v].tod];
  wv.innerHTML = `<div class="qw-wd${dk ? ' dk' : ''}" id="q-wd" style="width:${WW}px;height:${G.h}px">${ground(v, P, G, dk)}${propsOf(v).map(([t, x, d, o], i)=>prop(t, x, d, G, P, i, o, dk)).join('')}<i class="qw-tap" id="q-tap" aria-hidden="true"></i><i class="qw-ring" id="q-ring" aria-hidden="true" hidden></i>${'<i class="qw-ds" aria-hidden="true"></i>'.repeat(5)}</div>
    <button type="button" class="qw-trk" id="q-trk"></button><button type="button" class="btn blue qw-act" id="q-act" hidden></button>`;
  WK.wd = $q('q-wd'); WK.ring = $q('q-ring'); WK.ds = [...WK.wd.querySelectorAll('.qw-ds')];
  const me = document.createElement('div'); me.className = 'qe me'; me.setAttribute('aria-hidden', 'true');
  me.innerHTML = `<i class="qe-sh"></i><span class="qe-b">${walkImg ? `<img src="${walkImg}" alt="" draggable="false">` : '<span class="qe-e">🏄</span>'}</span>`;
  WK.wd.appendChild(me); WK.me = me;
  WK.fw = fmGet().filter(k=>k && k !== 'me').slice(0, 3).map(k=>{ const f = document.createElement('div'); f.className = 'qe fw' + (k === 'gull' ? ' fly' : ''); f.setAttribute('aria-hidden', 'true');
    const im = LK[k] ? npcImg(k) : '';                                                // 사람 동료(해녀 할머니·코치)는 마을 사람과 같은 모찌 그림
    f.innerHTML = `<i class="qe-sh"></i><span class="qe-b">${im ? `<img src="${im}" alt="" draggable="false">` : `<span class="qe-e">${HERO[k].ic}</span>`}</span>`; WK.wd.appendChild(f); return f; });
  WK.tr = []; WK.cam = Math.max(0, Math.min(WW - G.w, WK.p.x - G.w / 2)); WK.camSet = '';
  wRefresh(); wTick(0);
  $q('q-trk').onclick = e=>{ e.stopPropagation(); const g = WK && WK.goal; if(g && g.e) goTo(g.e); };
  $q('q-act').onclick = e=>{ e.stopPropagation(); if(WK && WK.near) interact(WK.near); };
}
function goTo(e){
  if(!WK || !e) return; const P = WK.p, DY = WK.G.gh - 50;
  if(Math.hypot(e.x - P.x, (e.d - P.d) * DY) < 62 || e.t === 'item' && Math.abs(e.x - P.x) < 30) return interact(e);
  WK.go = e; WK.tx = e.t === 'item' ? e.x : e.x + (P.x < e.x ? -46 : 46); WK.td = e.d;
}
function interact(e){
  if(!e || !WK || !$q('q-ov').hidden) return; WK.tx = null; WK.go = null; if(e.x !== WK.p.x) WK.p.f = e.x > WK.p.x ? 1 : -1;
  if(e.t === 'npc') return npcTalk(e.id);
  if(e.t === 'item') return grab(e);
  if(e.t === 'mob') return fight(e.quest ? 'hunt' : 'patrol', e.g, e);
  if(e.t === 'boss') return bossTalk();
}
/* 한 프레임 — 이동(키보드·눌러 이동), 동료 따라오기, 물건 줍기, 카메라·배경 시차, 가까운 대상 버튼 */
function wTick(dt){
  if(!WK || !WK.G || !WK.me) return;
  const G = WK.G, P = WK.p, DY = G.gh - 50, busy = !$q('q-ov').hidden; let mv = false; WK.t += dt;
  if(!busy && dt > 0){
    const kx = (KEY.r ? 1 : 0) - (KEY.l ? 1 : 0), kd = (KEY.d ? 1 : 0) - (KEY.u ? 1 : 0);
    const acc = ()=>{ WK.sp = Math.min(1, WK.sp + dt * 6); return SPD * (.35 + .65 * WK.sp); };   // 출발은 살짝 밀어 주듯(0.15초), 도착 직전엔 감속
    if(kx || kd){ WK.tx = null; WK.go = null; const L = Math.hypot(kx, kd), v = acc(); P.x += kx / L * v * dt; P.d += kd / L * v * dt / DY; mv = true; if(kx) P.f = kx; }
    else if(WK.tx != null){ const dx = WK.tx - P.x, dd = (WK.td - P.d) * DY, L = Math.hypot(dx, dd);
      if(L < 3){ WK.tx = null; const g = WK.go; WK.go = null; if(g) interact(g); }
      else { const s = Math.min(L, acc() * Math.min(1, .3 + L / 40) * dt); P.x += dx / L * s; P.d += dd / L * s / DY; mv = true; if(Math.abs(dx) > 1) P.f = dx > 0 ? 1 : -1; } }
    if(!mv) WK.sp = 0;
    P.x = Math.max(24, Math.min(WW - 24, P.x)); P.d = Math.max(.08, Math.min(1, P.d));
    for(const e of WK.ents) if(e.t === 'item' && Math.abs(e.x - P.x) < 28 && Math.abs((e.d - P.d) * DY) < 26){ grab(e); break; }
  }
  const tl = WK.tr, l0 = tl[0]; if(!l0 || Math.hypot(l0.x - P.x, (l0.d - P.d) * DY) > 5){ tl.unshift({ x:P.x, d:P.d }); if(tl.length > 40) tl.pop(); }
  at(WK.me, P.x, P.d); WK.me.classList.toggle('mv', mv); WK.me.classList.toggle('fl', P.f < 0);
  if(mv && !RM && (WK.dsT -= dt) <= 0 && WK.ds.length){ WK.dsT = .24; const el = WK.ds[WK.dsI++ % WK.ds.length], x = f1(P.x - P.f * 10), y = f1(fy(G, P.d) - 2);   // 발자국 모래먼지 — 미리 만든 다섯 개를 돌려 쓴다
    el.style.zIndex = String(Math.round(fy(G, P.d))); try{ el.animate([{ transform:`translate(${x}px,${y}px) scale(.4)`, opacity:.75 }, { transform:`translate(${f1(x - P.f * 14)}px,${f1(y - 8)}px) scale(1.25)`, opacity:0 }], { duration:480, easing:'ease-out' }); }catch(e){} }
  const gl = WK.goal && WK.goal.e, rg = WK.ring;                                    // 목적지 바닥의 빛나는 고리 — 알림판이 가리키는 그곳
  if(rg){ if(gl && gl.el && gl.el.isConnected && !busy){ if(rg.hidden) rg.hidden = false; at(rg, gl.x + (gl.ox || 0), gl.d); } else if(!rg.hidden) rg.hidden = true; }
  WK.fw.forEach((f, i)=>{ const fly = f.classList.contains('fly'), tx = Math.max(22, Math.min(WW - 22, P.x - P.f * (fly ? 30 : 46 + i * 34))), td = Math.max(.08, P.d - (fly ? 0 : .06 + i * .04)), o = f._p || (f._p = { x:tx, d:td }), k = dt ? Math.min(1, dt * (3.2 - i * .5)) : 1;
    const ox = o.x, od = o.d; o.x += (tx - o.x) * k; o.d += (td - o.d) * k; at(f, o.x, o.d, fly ? -74 + (RM ? 0 : Math.sin(WK.t * 3 + i) * 5) : 0);
    f.classList.toggle('mv', Math.abs(o.x - ox) + Math.abs(o.d - od) * 100 > .3); f.classList.toggle('fl', tx < o.x - 2); });
  for(const e of WK.ents) if(e.t === 'mob' && !RM){ e.ox = Math.sin(WK.t * .8 + e.x) * 14; at(e.el, e.x + e.ox, e.d); }
  const tc = Math.max(0, Math.min(WW - G.w, P.x - G.w / 2)); WK.cam += (tc - WK.cam) * (dt ? Math.min(1, dt * 7) : 1);
  const cs = `translate3d(${f1(-WK.cam)}px,0,0)`; if(cs !== WK.camSet){ WK.camSet = cs; WK.wd.style.transform = cs;
    const bg = $q('q-bg'), r = WW > G.w ? WK.cam / (WW - G.w) : .5; if(bg && !CN) bg.style.transform = `translate3d(${f1((.5 - r) * G.w * .5)}px,0,0)`; }
  let nb = null, nd = 70; if(!busy) for(const e of WK.ents){ if(e.t === 'item') continue; const dd = Math.hypot(e.x - P.x, (e.d - P.d) * DY); if(dd < nd){ nd = dd; nb = e; } }
  if(nb !== WK.near){ WK.near = nb; const a = $q('q-act'); if(a){ a.hidden = !nb;
    if(nb) a.textContent = nb.t === 'npc' ? `💬 ${nb.n}` : nb.t === 'boss' ? (nb.lock ? `🔒 ${nb.n}` : `👑 보스와 싸우기`) : `⚔️ ${nb.n}와 싸우기`; } }
  if((WK.dirT -= dt) <= 0){ WK.dirT = .25; wDir(); }
  if(WK.tu && (WK.tuT -= dt) <= 0){ WK.tuT = .15; wTutPos(); }
}

/* ── 대화·부탁 ── */
function npcTalk(id){
  const I = vInfo(), q = I.q;
  if(id === 'shop') return talk([['shop', I.s === 4 && TV === N - 1 ? '전설의 서퍼님! 장비 손볼 데 있으면 언제든 와요.' : '어서 와요, 파도상회예요! 조개만 있으면 보드랑 슈트를 손봐 줄게요. 장비는 동료 모두를 강하게 해요.']], null,
    { ch:[['🛠️ 장비 강화하기', ()=>bag()], ['괜찮아요', wBack]] });
  if(q){
    if(!I.p.a && q.by === id) return offer();
    if(I.p.a && q.k === 'give' && q.to === id) return talk([['m', `${jo(whoN(q.by), '이', '가')} ${jo(q.itn, '을', '를')} 전해 달래요.`], [id, q.ok]], ()=>qComplete(I.g));
    if(I.p.a && q.by === id){
      if(ready(I)) return talk([['m', q.k === 'hunt' ? '해변 녀석들, 다 쫓아냈어요!' : `${q.itn} 세 개, 다 찾아왔어요!`], [id, q.ok]], ()=>qComplete(I.g));
      return talk([[id, q.k === 'hunt' ? '오른쪽 해변의 무리를 눌러 싸워 줘. 전투는 동료들이 알아서 해!' : q.k === 'get' ? `${q.itn} ${3 - I.p.n}개만 더 부탁해. 반짝이는 걸 찾아봐!` : `${whoN(q.to)}에게 꼭 전해 줘!`]]);
    }
  }
  const V = VIL[TV][id];
  if(V && V.say){ const k = WK.say[id] = ((WK.say[id] ?? -1) + 1) % V.say.length; return talk([[id, V.say[k]]]); }
  if(I.s === 4) return talk([[id, '덕분에 마을이 다시 평화로워졌어. 고마워!']]);
  if(I.s === 3) return talk([[id, `해변 끝에 ${jo(BOSS[TV].n, '이', '가')} 나타났어! 준비되면 가 봐.`]]);
  return talk([[id, `${jo(whoN(q.by), '이', '가')} 널 찾던데? 머리 위에 ❗나 ❓가 뜬 사람을 찾아봐.`]]);
}
function offer(){
  const I = vInfo(), q = I.q; if(!q) return;
  talk([...(I.s === 0 ? CH[TV].pre : BEATS[TV][I.s - 1]), [q.by, q.ask]], null, { ch:[['📜 부탁 들어주기', ()=>{ qpSet({ a:1, n:0, w:0 }); beep(523, 784, .2, .04); wBack(); trkFlash(); }], ['나중에', wBack]] });
}
function bossTalk(){
  const I = vInfo();
  if(!(I.here && I.s === 3)) return talk([['n', `${BOSS[TV].ic} ${BOSS[TV].n}의 기척이 느껴져요. 마을 사람들의 부탁을 먼저 들어주세요 (${Math.min(3, I.s)}/3)`]]);
  talk(BEATS[TV][2], ()=>fight('boss', TV * 4 + 3), { cancel:wBack });            // 뒤로가기는 싸움으로 넘기지 않고 마을로
}
function grab(e){
  const I = vInfo(); if(!(I.q && I.q.k === 'get' && I.p.a) || !e || e.got || !WK || !WK.ents.includes(e)) return;   // 한 물건은 한 번만 — 걸어가는 중에 먼저 주웠으면 도착해서 또 세지 않는다
  e.got = 1; if(!gotOk(I)) GOT = { g:I.g, s:[0, 1, 2].filter(j=>j < I.p.n) }; GOT.s.push(+e.id.slice(1)); const n = Math.min(3, I.p.n + 1); qpSet({ n }); beep(880, 1320, .12, .04); try{ vib(12); }catch(er){}
  if(WK && WK.wd){ const t = document.createElement('i'); t.className = 'qw-got'; t.textContent = `${I.q.it} ${n}/3${n >= 3 ? ' 다 모았다!' : ''}`; t.style.transform = `translate(${f1(e.x)}px,${f1(fy(WK.G, e.d) - 40)}px)`; t.style.zIndex = '999'; WK.wd.appendChild(t); setTimeout(()=>t.remove(), 900); }
  wRefresh(); if(n >= 3) trkFlash();
}
function qComplete(g0){
  const I = vInfo(); if(!(I.here && I.q && I.s < 3) || (g0 != null && g0 !== I.g)) return wBack();   // 같은 보고가 두 번 와도 다음 부탁까지 끝내 버리지 않게
  const q = I.q, g = I.g, team = fmGet().filter(Boolean), before = team.map(heroLv), stars = q.k === 'hunt' ? Math.max(1, I.p.w) : 3, sh = 11 + Math.floor(g / 4), xp = qXp(g);
  let r = { gain:0, shells:sh };
  try{ if(typeof playQuestDone === 'function') r = playQuestDone(TV, false, sh, false, { g, won:true, stars, xp, team }) || r; }catch(e){}
  const p = ME && ME.profile && ME.profile.play; if(p && p.qb){ p.qb.qp = { g:sgN(), a:0, n:0, w:0 }; if(typeof playPush === 'function') playPush(); }
  const lv = team.map((k, i)=>[k, before[i], heroLv(k)]), nx = vInfo(), first = g === 0;
  const ov = ovEl('');
  ov.innerHTML = `<div class="go-card"><div class="qpc" aria-hidden="true">📜</div><div class="go-t">부탁 완료!</div><div class="go-d"><b>${esc(q.t)}</b></div>${starsHtml(stars)}
    <div class="go-st"><span>조개<b>+${nm(r.shells, 999)}${r.x2 ? ' ×2' : ''}</b></span><span>동료 경험치<b>+${xp}</b></span><span>XP<b>+${nm(r.gain, 99)}</b></span></div>${lvHtml(lv)}
    <div class="go-b">${nx.s === 3 ? `👑 해변 끝에 <b>${esc(BOSS[TV].n)}</b>${fin(BOSS[TV].n) ? '이' : '가'} 나타났어요!` : nx.q ? `다음 부탁 — ${esc(nx.q.t)} (${esc(whoN(nx.q.by))})` : ''}</div>
    ${first ? '<p class="go-d" style="margin:0 0 8px">👍 이렇게 마을 사람의 부탁을 들어주며 강해져요. 🎒 내 정보에서 장비도 강화해 보세요!</p>' : ''}
    <button class="btn blue" id="q-ok" type="button" style="width:100%;min-height:50px">계속 ▶</button></div>`;
  if(first) twSet(3);
  $q('q-ok').onclick = wBack; beep(659, 1319, .35, .05);
  if(typeof popNext === 'function') setTimeout(popNext, 1200);
}
/* 덮개를 걷고 마을로 — 진행이 바뀌었을 수 있으니 다시 그린다 */
function wBack(){
  clearT(); const ov = $q('q-ov'); if(ov){ ov.hidden = true; ov.className = 'game-ov'; ov.innerHTML = ''; }
  if(!WK || WK.v !== TV || !$q('quest').classList.contains('qw') || !WK.wd || !WK.wd.isConnected) return town(TV);
  wRefresh();
}
function vTitle(v){
  const c = CH[v], ov = ovEl('qv-title');
  ov.innerHTML = `<div class="q-reg" aria-hidden="true">${esc(c.lm)} ${esc(c.n)}</div><div class="qtt" role="button" tabindex="0" aria-label="마을 둘러보기"><small>제 ${v + 1} 장 · ${esc(TOD[c.tod].nm)}</small><b>${esc(c.s)}</b><span>${esc(c.lm)} ${esc(c.n)}</span><p>${esc(c.d)}</p></div>`;
  beep(392, 523, .4, .04);
  const go = ()=>{ clearTimeout(tmr); if(ov.classList.contains('qv-title')) wBack(); };
  ov.onclick = go; ov.onkeydown = e=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } };
  tmr = setTimeout(go, RM ? 1400 : 2600);
}
/* ── 전투로 — 물리치기 부탁(hunt)·순찰(patrol)·보스(boss). 전투 엔진은 그대로, 끝나면 마을로 돌아온다 ── */
function fight(kind, g, e){
  g = nm(g, NS - 1); session(g); S.kind = kind; S.first = kind !== 'patrol' && g === sgN();
  if(kind === 'patrol'){ S.pid = e ? e.id : ''; S.waves = S.waves.map(w=>w.filter(k=>k !== 'BOSS')); }
  if(S.U.tag && typeof toast === 'function') toast('🔧 강화 적용: ' + S.U.tag);
  teamUp();
}
const qXp = g => 40 + g * 9;                                                          // 부탁을 마치면 출전 동료 모두에게 — 전투 한 판보다 조금 많게
const lvHtml = lv => `<div class="q-lv">${lv.map(([k, a, b])=>`<span>${HERO[k].ic} Lv${b}${b > a ? ' <b>⬆</b>' : ''}</span>`).join('')}</div>`;

/* ── 첫 마을 길잡이 — ① ❗ 사람에게 말 걸기 → ② 알림판을 눌러 해변의 무리와 전투 → ③ 돌아가 보고. 첫 부탁(g 0)에서만 ── */
function wTut(){
  if(!WK) return; const I = vInfo();
  if(tw() >= 3 || I.g > 0 || !I.here){ if(I.g > 0 && tw() < 3) twSet(3); WK.tu = null; tutOff(); return; }
  WK.tu = !I.p.a ? ['a', '① 머리 위에 ❗가 뜬 해녀 할머니를 눌러 말을 걸어 보세요', '① 해녀 할머니(❗)가 오른쪽에 있어요 — 이 알림판을 누르면 걸어가요'] : !I.p.w ? ['trk', '② 퀘스트를 받았어요! 이 알림판을 누르면 해변의 해파리 무리로 걸어가요'] : ['a', '③ 이겼어요! ❓ 해녀 할머니에게 돌아가 보고하세요', '③ 이겼어요! 알림판을 눌러 해녀 할머니(❓)에게 돌아가 보고하세요'];
  WK.tuT = 0; wTutPos();
}
function wTutPos(){
  const u = WK && WK.tu, ov = $q('q-ov'); if(!u) return;
  if(!ov.hidden){ const b = $q('q-tut'); if(b) b.hidden = true; return; }
  const en = u[0] === 'trk' ? null : WK.ents.find(e=>e.id === u[0]), off = en && Math.abs(en.x - WK.cam - WK.G.w / 2) > WK.G.w / 2 - 30;   // 화면 밖이면 알림판을 가리킨다
  const el = u[0] === 'trk' || off ? $q('q-trk') : en && en.el, txt = off ? u[2] : u[1]; if(!el) return;
  let b = $q('q-tut'); if(!b){ b = document.createElement('div'); b.id = 'q-tut'; b.setAttribute('role', 'status'); document.body.appendChild(b); }
  const r = (el.querySelector('.qe-b') || el).getBoundingClientRect(), up = el.id === 'q-trk' || r.top < 150;
  if(b.textContent !== txt) b.textContent = txt; b.className = 'q-tut ' + (up ? 'up' : 'dn'); b.hidden = false;
  b.style.left = Math.max(124, Math.min(innerWidth - 124, r.left + r.width / 2)) + 'px'; b.style.top = (up ? r.bottom + 12 : r.top - 10) + 'px';
}

/* ── 내 정보·가방 — 레벨·능력치·장비(🐚 강화)·동료·받은 선물 ── */
function bag(){
  clearT(); tutOff(); S = null; window._gameRun = false; wMode(true);
  const ov = ovEl('qv-bag'), U = typeof upFor === 'function' ? upFor('quest', true) : {}, s = heroStat('me', U), x = heroXp('me'), a = xpAt(s.l), b = xpAt(s.l + 1);
  const pct = s.l >= 30 ? 100 : Math.min(100, (x - a) / Math.max(1, b - a) * 100), fm = fmGet().filter(Boolean), pw = fm.reduce((t, k)=>t + power(k, U), 0), bal = typeof shellBal === 'function' ? shellBal() : 0, got = qbOf().legend ? N : gotN(), I = vInfo();
  const eqRow = k => { const E = EQ[k], l = eqOf(k), c = EQC[l];
    return `<div class="qb-eq"><i aria-hidden="true">${E.ic}</i><span><b>${E.n} Lv${l}/10</b><small>${E.d} +${l * E.per}%${l < 10 ? ` → +${(l + 1) * E.per}%` : ''}</small></span><button type="button" class="btn sm ${l < 10 && bal >= c ? 'blue' : 'ghost'}" data-eq="${k}"${l >= 10 ? ' disabled' : ''}>${l >= 10 ? '최고' : `강화 🐚${c}`}</button></div>`; };
  const items = CH.slice(0, got).filter(c=>c.gift).map(c=>[c.gift.ic, c.gift.n, short(CH.indexOf(c)) + '에서 받은 선물']);
  if(qbOf().legend) items.unshift(['🏄', '전설의 보드', '봉인을 풀고 얻은 보드']);
  if(I.q && I.p.a && I.q.k !== 'hunt') items.unshift([I.q.it, I.q.itn + (I.q.k === 'get' ? ` ${I.p.n}/3` : ''), '퀘스트 물건']);
  ov.innerHTML = `<div class="qb"><div class="qb-hd"><b>🎒 내 정보</b><span>🐚 ${bal}</span><button class="btn sm ghost" id="q-bx" type="button">✕ 닫기</button></div>
    <div class="qb-me">${walkImg ? `<img src="${walkImg}" alt="내 캐릭터">` : '<i aria-hidden="true">🏄</i>'}<div><b>${esc(ME.name || '나')}</b><small>Lv${s.l} · ${'★'.repeat(s.st)}${'☆'.repeat(5 - s.st)} · 딜러</small>
      <span class="qtm-xp" role="progressbar" aria-label="경험치" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i style="width:${pct.toFixed(0)}%"></i></span><small>${s.l >= 30 ? '최고 레벨' : `다음 레벨까지 ${b - x} XP`}</small></div></div>
    <div class="qb-st"><span>❤️ 체력<b>${s.hp}</b></span><span>⚔️ 공격<b>${s.atk}</b></span><span>💪 팀 전투력<b>${pw}</b></span><span>🧩 봉인 조각<b>${got}/${N}</b></span></div>
    <h4>🛠️ 장비 — 동료 모두에게 적용</h4>${eqRow('b')}${eqRow('w')}
    <h4>👥 동료 ${HK.filter(unl).length}/${HK.length}</h4><div class="qb-tm">${HK.filter(unl).map(k=>`<span class="${fm.includes(k) ? 'in' : ''}"><i aria-hidden="true">${HERO[k].ic}</i><b>${esc(HERO[k].n)}</b><small>Lv${heroLv(k)} ${'★'.repeat(heroSt(k))}${fm.includes(k) ? ' · 출전' : ''}</small></span>`).join('')}</div>
    <button class="btn" id="q-btm" type="button" style="width:100%;min-height:46px">👥 편성 · ⭐ 성급 강화</button>
    <h4>🎁 가방</h4>${items.length ? `<div class="qb-it">${items.map(([ic, n, d])=>`<span><i aria-hidden="true">${esc(ic)}</i><b>${esc(n)}</b><small>${esc(d)}</small></span>`).join('')}</div>` : '<p class="qb-tip">아직 비어 있어요 — 마을 보스를 넘으면 선물을 받아요</p>'}
    <p class="qb-tip">💡 강해지는 법 — 부탁을 들어주고 해변 순찰 몬스터(⚔️)와 싸워 레벨 업 · 🐚 조개로 장비·⭐ 성급 강화${U.tag ? ` · 🔧 강화소 ${esc(U.tag)}` : ' · 놀이 메뉴 🔧 강화소 보너스도 붙어요'}</p></div>`;
  $q('q-bx').onclick = wBack;
  $q('q-btm').onclick = ()=>{ TB = 'bag'; teamUp(); };
  ov.querySelectorAll('[data-eq]').forEach(b=>b.onclick = ()=>{ const k = b.dataset.eq; if(eqBuy(k)){ beep(523, 1047, .3, .05); if(typeof toast === 'function') toast(`${EQ[k].ic} ${EQ[k].n} Lv${eqOf(k)}! ${EQ[k].d} +${eqOf(k) * EQ[k].per}%`); } const y = ov.scrollTop; bag(); ov.scrollTop = y; });
}
/* 뒤로가기(안드로이드) — 대화·지도·가방 같은 덮개부터 닫고, 전투 중이면 마을로. 걷기 화면이면 false(원정을 닫는다) */
function qBack(){
  if(CN){ const d = CN.done; cineStop(); if(d) d(); return true; }
  if(T){ const d = T.cancel || (T.ch ? wBack : T.done); clearT(); if(d) d(); return true; }   // 고르기가 있는 대화는 '나중에'로
  if(S && S.pend){ const f = S.pend; S.pend = null; clearTimeout(tmr); f(); return true; }   // 결과 띠 중이면 건너뛰기 — 보스 뒷이야기·합류 카드를 놓치지 않게
  if(S){ town(S.v); return true; }                                                   // 전투 중 뒤로가기 — 원정을 통째로 닫지 않고 마을로(진행은 그대로)
  const ov = $q('q-ov'); if(ov && !ov.hidden){ const tm = ov.classList.contains('qv-team') && $q('q-tmx'); if(tm && (TB === 'bag' || TB.startsWith('rw'))) tm.click(); else town(TV); return true; }
  return false;
}
function wKey(e, down){
  if($q('quest').hidden || !WK || !$q('quest').classList.contains('qw')) return;
  if(e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  const k = { ArrowLeft:'l', a:'l', A:'l', ArrowRight:'r', d:'r', D:'r', ArrowUp:'u', w:'u', W:'u', ArrowDown:'d', s:'d', S:'d' }[e.key];
  if(k){ KEY[k] = down; if(e.key.startsWith('Arrow')) e.preventDefault(); return; }
  if(down && (e.key === 'Enter' || e.key === ' ') && $q('q-ov').hidden && WK.near && !(e.target && e.target.closest && e.target.closest('button'))){ e.preventDefault(); interact(WK.near); }
}
function wCss(){
  if($q('q-css')) return; const st = document.createElement('style'); st.id = 'q-css';
  st.textContent = `
#quest.qw .game-box{ width:100%; max-width:480px; justify-content:flex-start }
#quest.qw .game-stage{ flex:1 1 0; min-height:0; overflow:hidden }
#quest.qw #q-cv,#quest.qw .q-sks,#quest.qw .q-log{ display:none }
#quest:not(.qw) #q-bar{ display:none }
#quest.qw .qs-bg{ inset:auto; left:-30%; right:-30%; top:-10%; height:100% }
.qw-v{ position:absolute; inset:0; z-index:1; overflow:hidden; cursor:pointer; touch-action:none; -webkit-tap-highlight-color:transparent }
.qw-v[hidden]{ display:none }
.qw-wd{ position:absolute; left:0; top:0; will-change:transform }
.qw-gr{ position:absolute; left:0; display:block }
.qw-fm{ animation:qwfm 2.6s ease-in-out infinite alternate; will-change:transform } @keyframes qwfm{ to{ transform:translateY(4px) } }
#quest.qw .qs-svg .qho{ animation:none }   /* 걷는 동안 밤 장의 빛 구멍(마스크)은 멈춘다 — 화면 전체 마스크를 매 프레임 다시 그리지 않게 */
.qp{ position:absolute; pointer-events:none } .qp svg{ display:block; overflow:visible }
.qw-wd.dk .qp{ filter:brightness(.62) saturate(.8) } .qw-wd.dk .qe img,.qw-wd.dk .qe-e{ filter:brightness(.88) }
.qe{ position:absolute; left:0; top:0; width:0; height:0; margin:0; padding:0; border:0; background:none; font:inherit; color:inherit; cursor:pointer }
.qe:focus{ outline:none } .qe:focus-visible .qe-b{ outline:3px solid #F4C430; outline-offset:3px; border-radius:10px }
.qe-b{ position:absolute; left:0; bottom:0; display:flex; flex-direction:column; align-items:center; transform:translateX(-50%) scale(var(--s,1)); transform-origin:50% 100% }
.qe-sh{ position:absolute; left:-24px; top:-7px; width:48px; height:14px; border-radius:50%; background:radial-gradient(rgba(10,22,38,.38), rgba(10,22,38,0) 70%) }
.qe img{ display:block; height:78px; width:auto; pointer-events:none; -webkit-user-drag:none; animation:qwbr 2.6s ease-in-out infinite alternate; transform-origin:50% 100% }
.qe-e{ display:block; font-size:46px; line-height:1.05; font-family:sans-serif; filter:drop-shadow(0 3px 0 rgba(0,0,0,.18)); animation:qwbr 2.6s ease-in-out infinite alternate; transform-origin:50% 100% }
@keyframes qwbr{ to{ transform:scale(1.025,.975) } }
.qe-n{ margin:0 0 3px; padding:1px 7px; font-size:11.5px; font-weight:800; line-height:1.45; white-space:nowrap; color:#1F2A44; background:rgba(255,253,246,.94); border:1.5px solid #1F2A44; border-radius:8px }
.qe-n.bad{ background:#FFE3E3 } .qe-n.q{ background:#FFE27A }
.qe-m{ display:block; min-height:24px; font-style:normal; font-size:19px; line-height:1.2; font-family:sans-serif; filter:drop-shadow(0 2px 0 rgba(0,0,0,.25)) }
.qe-m.hot{ font-size:28px; animation:qwmk .8s ease-in-out infinite alternate } @keyframes qwmk{ to{ transform:translateY(-6px) } }
.qe.hot .qe-n{ background:#FFE27A }
.qe.me,.qe.fw{ pointer-events:none } .qe.me img{ height:84px }
.qe.me.fl .qe-b{ transform:translateX(-50%) scale(calc(var(--s,1) * -1), var(--s,1)) }
.qe.mv img,.qe.mv .qe-e{ animation:qwwk .3s ease-in-out infinite alternate } @keyframes qwwk{ from{ transform:translateY(0) rotate(-3deg) } to{ transform:translateY(-5px) rotate(3deg) } }
.qe.fw .qe-e{ font-size:30px } .qe.fw.fly .qe-sh{ opacity:.4; transform:translateY(46px) scale(.6) }
.qe.item .qe-e{ font-size:30px; animation:qwit 1.1s ease-in-out infinite alternate; filter:drop-shadow(0 0 6px #FFF3A0) drop-shadow(0 0 2px #FFFFFF) } @keyframes qwit{ to{ transform:translateY(-6px) } }
.qe.item .qe-b::after{ content:'✨'; position:absolute; right:-14px; top:-10px; font-size:14px; animation:qwtw 1.4s ease-in-out infinite alternate } @keyframes qwtw{ from{ opacity:.2 } to{ opacity:1 } }
.qe.mob .qe-e{ font-size:34px; letter-spacing:-4px }
.qe.boss .qe-e{ font-size:76px; filter:drop-shadow(0 0 12px rgba(224,69,122,.85)) } .qe.boss.lk .qe-e{ filter:grayscale(1) brightness(.45); opacity:.6 } .qe.boss.lk .qe-n{ opacity:.8 }
.qw-tap{ position:absolute; left:-14px; top:-6px; width:28px; height:12px; border:2px solid #FFFFFF; border-radius:50%; opacity:0; pointer-events:none } .qw-tap.on{ animation:qwtp .5s ease-out }
@keyframes qwtp{ from{ opacity:.9; transform:var(--p) scale(.4) } to{ opacity:0; transform:var(--p) scale(1.4) } }
.qw-got{ position:absolute; left:0; top:0; font-style:normal; font-size:18px; font-weight:900; color:#FFF3A0; text-shadow:0 2px 0 #1F2A44; pointer-events:none; animation:qwgt .9s ease-out forwards } @keyframes qwgt{ to{ margin-top:-30px; opacity:0 } }
.qw-trk{ position:absolute; left:8px; right:8px; top:8px; z-index:3; display:flex; align-items:center; gap:8px; min-height:52px; padding:6px 10px; text-align:left; font:inherit; color:#1F2A44; background:rgba(255,253,246,.96); border:2px solid #1F2A44; border-radius:12px; box-shadow:0 3px 0 #1F2A44; cursor:pointer }
.qw-trk > span{ flex:1; min-width:0 } .qw-trk b{ display:block; font-size:14px; line-height:1.35; word-break:keep-all } .qw-trk small{ display:block; font-size:12px; font-weight:700; line-height:1.4; color:#5B6275; word-break:keep-all }
.qw-trk > i{ flex:none; padding:4px 8px; font-size:12.5px; font-style:normal; font-weight:800; white-space:nowrap; background:#FFE27A; border:1.5px solid #1F2A44; border-radius:8px } .qw-trk > i[hidden]{ display:none }
.qw-act{ position:absolute; left:50%; bottom:12px; z-index:3; transform:translateX(-50%); max-width:calc(100% - 24px); min-height:52px; padding:0 22px; font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; box-shadow:0 4px 0 #1F2A44 } .qw-act[hidden]{ display:none }
#q-bar{ display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-top:8px }
#q-bar .btn{ min-height:54px; padding:2px 4px; font-size:12.5px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; line-height:1.2 } #q-bar .btn i{ font-style:normal; font-size:20px }
.qt-ch{ display:flex; gap:8px; margin-top:6px } .qt-ch .btn{ flex:1; min-height:48px; font-size:15px } .qt-ch .btn:first-child{ flex:1.6 }
#q-ov.qv-bag{ display:block; padding:0; background:#FFF7E3; overflow:auto }
.qb{ padding:12px 12px 18px; color:var(--ink) } .qb h4{ margin:14px 0 6px; font-size:14px }
.qb-hd{ display:flex; align-items:center; gap:8px } .qb-hd b{ flex:1; font-family:"Galmuri11",sans-serif; font-size:17px } .qb-hd span{ font-weight:800 }
.qb-me{ display:flex; align-items:center; gap:12px; margin-top:10px; padding:10px; background:#fff; border:2px solid var(--ink); border-radius:12px } .qb-me img{ width:72px; height:auto } .qb-me > i{ font-size:48px; font-style:normal }
.qb-me > div{ flex:1; min-width:0 } .qb-me b{ display:block; font-size:16px } .qb-me small{ display:block; font-size:12px; font-weight:700; color:#5B6275 } .qb-me .qtm-xp{ margin:6px 0 2px }
.qb-st{ display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:8px } .qb-st span{ display:flex; justify-content:space-between; align-items:center; padding:8px 10px; font-size:13px; font-weight:700; background:#fff; border:2px solid var(--ink); border-radius:10px } .qb-st b{ font-size:15px }
.qb-eq{ display:flex; align-items:center; gap:10px; margin-bottom:6px; padding:8px 10px; background:#fff; border:2px solid var(--ink); border-radius:10px } .qb-eq > i{ font-size:26px; font-style:normal } .qb-eq span{ flex:1; min-width:0 } .qb-eq b{ display:block; font-size:14px } .qb-eq small{ display:block; font-size:12px; font-weight:700; color:#5B6275 } .qb-eq .btn{ min-height:42px; white-space:nowrap }
.qb-tm,.qb-it{ display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin-bottom:8px } .qb-tm span,.qb-it span{ display:flex; flex-direction:column; align-items:center; padding:6px 4px; text-align:center; background:#fff; border:2px solid var(--ink); border-radius:10px } .qb-tm span.in{ background:#E6FBEF }
.qb-tm i,.qb-it i{ font-size:24px; font-style:normal } .qb-tm b,.qb-it b{ font-size:12px; line-height:1.3; word-break:keep-all } .qb-tm small,.qb-it small{ font-size:11px; font-weight:700; color:#5B6275; word-break:keep-all }
.qb-tip{ margin:10px 0 0; font-size:12.5px; font-weight:700; line-height:1.55; color:#5B6275; word-break:keep-all }
.qm-inf{ margin:0 0 8px; padding:8px 10px; font-size:13px; font-weight:700; line-height:1.5; color:var(--ink); background:rgba(255,250,236,.95); border:2px solid var(--ink); border-radius:10px; word-break:keep-all } .qm-inf b{ font-size:14.5px }
#quest .game-box{ justify-content:flex-start }
#quest .btn.sm,#q-x{ min-height:44px; min-width:44px }   /* 손가락으로 누르기 쉬운 최소 크기 */
#quest .game-hd > b{ min-width:0; overflow:hidden; white-space:nowrap; text-overflow:ellipsis } #q-hp{ flex:none; white-space:nowrap; font-size:13px !important }
#q-ov.qv-title{ background:linear-gradient(rgba(5,8,20,0) 22%,rgba(5,8,20,.72) 55%,rgba(5,8,20,.9)) }
.qw-ring{ position:absolute; left:0; top:0; width:0; height:0; pointer-events:none } .qw-ring[hidden]{ display:none }
.qw-ring::before{ content:''; position:absolute; left:-36px; top:-13px; width:72px; height:26px; border-radius:50%; border:3px solid #FFE27A; background:radial-gradient(rgba(255,226,122,.45),rgba(255,226,122,0) 70%); box-shadow:0 0 14px #FFD23F; transform:scale(var(--s,1)); animation:qwrg .9s ease-in-out infinite alternate } @keyframes qwrg{ from{ opacity:.55; transform:scale(calc(var(--s,1) * .86)) } to{ opacity:1; transform:scale(calc(var(--s,1) * 1.08)) } }
.qw-ds{ position:absolute; left:-7px; top:-7px; width:14px; height:14px; border-radius:50%; background:rgba(255,246,226,.85); opacity:0; pointer-events:none; will-change:transform,opacity }
.qe.fw img{ height:62px }
.qw-trk.nw{ animation:qwnw .5s ease-out 3 alternate } @keyframes qwnw{ to{ background:#FFE27A; transform:scale(1.03) } }
.qw-trk.nw::before{ content:'NEW'; position:absolute; left:-4px; top:-9px; padding:0 6px; font-size:11px; font-weight:900; line-height:18px; color:#fff; background:#E25A4A; border:1.5px solid #1F2A44; border-radius:9px }
.q-bench{ display:flex; flex-direction:column; gap:4px; margin:6px 0; padding:10px; text-align:left; background:#FFF3C4; border:2px solid #1F2A44; border-radius:12px; word-break:keep-all } .q-bench b{ font-size:14.5px } .q-bench small{ font-size:12px; font-weight:700; color:#5B6275 } .q-bench .btn{ min-height:46px; margin-top:4px }
.qtm-new{ position:absolute; left:-5px; top:-8px; padding:0 5px; font-size:9.5px; font-weight:900; font-style:normal; text-decoration:none; line-height:15px; color:#fff; background:#E25A4A; border-radius:8px }
.qtm-ft .qtm-d{ margin:0 0 6px; box-shadow:0 -2px 10px rgba(0,0,0,.18) } .qtm-dh{ margin:0 0 4px !important; color:#FFE27A; font-weight:800 }
@media (prefers-reduced-motion:reduce){ .qw-ring::before,.qw-trk.nw,.qw-fm,.qe img,.qe-e,.qe-m.hot,.qe.item .qe-e,.qe.item .qe-b::after,.qw-tap.on,.qw-got{ animation:none !important } }`;
  document.head.appendChild(st);
}

/* ── 그리기 — 캔버스는 투명(배경은 장면 SVG). 이모지는 한 번만 오프스크린에 구워 쓰고(매 프레임 글자 그리기는 비싸다), 흰 실루엣도 같이 구워 맞을 때 번쩍 ── */
const BK = {};
function bake(ic, px, wh){ const key = ic + px + (wh ? 'w' : ''); if(BK[key]) return BK[key];
  const c = document.createElement('canvas'), s = Math.ceil(px * 1.3); c.width = c.height = s; const x = c.getContext('2d');
  x.font = `${px}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ic, s / 2, s / 2 + px * .06);
  if(wh){ x.globalCompositeOperation = 'source-in'; x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, s, s); }
  return BK[key] = c; }
function whiteOf(src){ const c = document.createElement('canvas'); c.width = src.width || 24; c.height = src.height || 24; const x = c.getContext('2d'); try{ x.drawImage(src, 0, 0); }catch(e){} x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); return c; }
function Rq(c, x, y, w, h){ ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), h); }
function hb(x, y, w, h, cur, dly, max, col){ Rq('rgba(0,0,0,.55)', x - 1, y - 1, w + 2, h + 2); Rq('#FFFFFF', x, y, w * Math.max(0, Math.min(1, dly / max)), h); Rq(col, x, y, w * Math.max(0, Math.min(1, cur / max)), h); }
function unit(u){
  const t = S.t, dir = u.side === 'h' ? 1 : -1, img = u.k === 'me' && me ? me : bake(u.ic, u.sz);
  let x = u.x - dir * u.kb, y = u.y, a = 1, sc = 1;
  if(u.lg > 0 && u.lt){ const p = Math.sin((1 - u.lg / u.lgD) * Math.PI); x += (u.lt.x - u.x - dir * 18) * p; y += (u.lt.y - u.y) * p * .5; }
  if(u.dead){ const k = u.dd / .35; if(k >= 1) return; a = 1 - k; sc = 1 + k * .6; }
  else if(!RM) y += Math.sin(t * 4 + u.hx * .7) * 1.2;
  const w = img.width * sc, h = img.height * sc, top = y - h + 3;
  ctx.globalAlpha = .28 * a; ctx.fillStyle = '#0A1626'; ctx.beginPath(); ctx.ellipse(x, u.y + 2, w * .38, 2.2, 0, 0, 6.3); ctx.fill();
  if(S.taunt && S.taunt.u === u){ ctx.globalAlpha = .55 + .3 * Math.sin(t * 10); ctx.strokeStyle = '#FF5A3A'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, u.y + 2, w * .6, 4, 0, 0, 6.3); ctx.stroke(); }
  ctx.globalAlpha = a; ctx.drawImage(img, Math.round(x - w / 2), Math.round(top), w, h);
  if(u.fl > 0 && !u.dead){ ctx.globalAlpha = Math.min(1, u.fl / .14) * .85; ctx.drawImage(u.k === 'me' && meW ? meW : bake(u.ic, u.sz, 1), Math.round(x - w / 2), Math.round(top), w, h); }
  ctx.globalAlpha = 1;
  if(u.dead) return;
  if(u.sh > 0){ ctx.strokeStyle = 'rgba(123,224,255,.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, top + h / 2, h * .62, 0, 6.3); ctx.stroke(); }
  if(u.side === 'h' && S.red > 0){ ctx.strokeStyle = 'rgba(156,224,122,.85)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, top + h / 2 + 2, h * .7, Math.PI, 0); ctx.stroke(); }
  if(u.st > 0) for(let i = 0; i < 3; i++){ const r = t * 6 + i * 2.1; Rq('#FFE27A', x + Math.cos(r) * 7 - 1, top - 4 + Math.sin(r) * 2, 2, 2); }
  if(u.boss) return;
  hb(x - 10, top - 6, 20, 3, u.hp, u.hpD, u.max, u.side === 'h' ? '#4ADE80' : '#FF6B6B');
  if(u.side === 'h'){ Rq('rgba(0,0,0,.5)', x - 10, top - 2, 20, 1); Rq(u.en >= 100 ? (Math.sin(t * 12) > 0 ? '#FFFFFF' : '#FFE27A') : '#F4C430', x - 10, top - 2, 20 * u.en / 100, 1); }
}
function fxDraw(){
  for(const f of S.fx){ const u = f.t / (FXL[f.k] || .9);
    if(f.k === 'p'){ ctx.globalAlpha = 1 - u; Rq(f.c, f.x - 1, f.y - 1, 2, 2); }
    else if(f.k === 'txt'){ const pp = !RM && f.t < .12 ? 1 + (1 - f.t / .12) * .7 : 1, y = f.y - f.t * 22, fs = Math.round((f.big === 2 ? 14 : f.big ? 11 : 9) * pp);
      ctx.globalAlpha = Math.max(0, 1 - u * u); ctx.font = `bold ${fs}px Galmuri11, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,16,34,.85)'; ctx.strokeText(f.v, f.x, y); ctx.fillStyle = f.c; ctx.fillText(f.v, f.x, y); ctx.textAlign = 'left'; }
    else if(f.k === 'pop' || f.k === 'ring'){ ctx.globalAlpha = 1 - u; ctx.strokeStyle = f.c; ctx.lineWidth = f.k === 'pop' ? 2 : 3; ctx.beginPath(); ctx.arc(f.x, f.y, 4 + u * (f.k === 'pop' ? 16 : 44), 0, 6.3); ctx.stroke(); }
    else if(f.k === 'slash'){ ctx.globalAlpha = 1 - u; ctx.strokeStyle = '#FFF6C8'; ctx.lineWidth = 5 * (1 - u) + 1; ctx.beginPath(); ctx.moveTo(f.x - 18, f.y - 16 + u * 4); ctx.lineTo(f.x + 18, f.y + 12 - u * 4); ctx.stroke(); }
    else if(f.k === 'dive'){ ctx.globalAlpha = 1 - u; ctx.strokeStyle = '#BFE6FF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.x - 22 + u * 22, f.y - 44 + u * 44); ctx.lineTo(f.x, f.y); ctx.stroke(); }
    else if(f.k === 'wash'){ ctx.globalAlpha = Math.max(0, .55 - u * .55); Rq('#BFEFFF', 0, SEA - 36, W * Math.min(1, u * 3), 50); }
    else if(f.k === 'boom'){ ctx.globalAlpha = (1 - u) * .45; Rq('#FF3A3A', 0, 0, W, H); }
    else if(f.k === 'flash' && !RM){ ctx.globalAlpha = (1 - u) * .3; Rq(f.c, 0, 0, W, H); } }
  ctx.globalAlpha = 1;
}
function draw(){
  ctx.clearRect(0, 0, W, H);
  const s = S; if(!s || !(s.mode === 'go' || s.mode === 'done')) return;
  const sh = !RM && s.shk > 0 ? s.shk * 14 : 0;
  ctx.save(); if(sh) ctx.translate(Math.round((rnd() - .5) * sh), Math.round((rnd() - .5) * sh));
  for(const b of s.foes){ if(!b.tel || b.dead) continue;                           // 보스 예고 — 맞을 자리 바닥이 빨갛게 숨 쉬고, 보스 위 막대가 찬다
    ctx.globalAlpha = .3 + .2 * Math.sin(s.t * 18); ctx.fillStyle = '#FF2A2A';
    telTargets(b.tel.k).forEach(h=>{ ctx.beginPath(); ctx.ellipse(h.hx, h.y + 2, 16, 5, 0, 0, 6.3); ctx.fill(); });
    ctx.globalAlpha = 1; Rq('rgba(0,0,0,.5)', b.x - 16, b.y - b.sz - 10, 32, 3); Rq('#FF4A4A', b.x - 16, b.y - b.sz - 10, 32 * (1 - b.tel.t / b.tel.d), 3); }
  const all = [...s.heroes, ...s.foes].sort((p, q)=>p.y - q.y);
  for(const u of all) unit(u);
  for(const p of s.proj){ ctx.fillStyle = p.c; ctx.globalAlpha = .45; ctx.beginPath(); ctx.arc(p.px ?? p.x, p.py ?? p.y, 2.2, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 6.3); ctx.fill(); Rq('#FFFFFF', p.x - 1, p.y - 1, 2, 2); }
  fxDraw();
  ctx.restore();
  ctx.textBaseline = 'top'; ctx.font = '8px Galmuri11, sans-serif';               // 윗줄·보스 띠 — 흔들림 밖에서 그려 읽기 쉽게
  Rq('rgba(10,16,34,.72)', 0, 0, W, 14);
  ctx.fillStyle = '#FFE27A'; ctx.fillText(`${s.kind === 'boss' ? '보스' : s.kind === 'patrol' ? '순찰' : '퀘스트'} · ${short(s.v)}`, 4, 3);
  ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.fillText(`WAVE ${s.wv + 1}/${s.waves.length}`, W / 2 + 10, 3);
  ctx.textAlign = 'right'; ctx.fillStyle = s.left < 15 ? '#FF6B6B' : '#FFFFFF'; ctx.fillText(`⏱${Math.max(0, Math.ceil(s.left))}`, W - 4, 3); ctx.textAlign = 'left';
  const bf = [s.buff > 0 ? '⚔️+40%' : '', s.red > 0 ? '🛡️-60%' : '', s.taunt ? '🦀도발' : ''].filter(Boolean).join(' ');
  if(bf){ ctx.fillStyle = '#FFF3C4'; ctx.fillText(bf, 4, 17); }
  const boss = s.foes.find(f=>f.boss && !f.dead);
  if(boss){ Rq('rgba(24,6,34,.82)', 0, H - 19, W, 19); ctx.fillStyle = boss.tel ? '#FF8A8A' : '#FFD6F0'; ctx.fillText(boss.tel ? `⚠️ ${PAT[boss.tel.k]}!` : `${boss.rage ? '🔥 ' : ''}${boss.n}  ${Math.max(0, Math.ceil(boss.hp))}/${boss.max}`, 4, H - 17); hb(4, H - 7, W - 8, 4, boss.hp, boss.hpD, boss.max, '#E0457A'); }
}
function paintLog(){ const el = $q('q-log'); if(!el || !S) return; el.innerHTML = S.log.slice(0, 6).map((l, i)=>`<div style="opacity:${1 - i * 0.13}">${esc(l.t)}</div>`).join(''); }

/* 전투 위 AUTO·배속, 아래 초상(체력·기력) — 기력이 차면 반짝, 누르면 필살기(AUTO 켬이어도 직접 눌러 쓸 수 있다) */
function ctl(){
  const sp = $q('q-speed'); if(sp){ sp.textContent = '×' + speed; sp.setAttribute('aria-label', `배속 ${speed}배`); sp.classList.toggle('on', speed > 1); }
  const au = $q('q-auto'); if(au){ au.textContent = auto ? 'AUTO 켬' : 'AUTO 끔'; au.setAttribute('aria-pressed', String(auto)); au.classList.toggle('on', auto); }
}
function fxAdd(html, ms){ const L = $q('q-fx'); if(!L) return; while(L.children.length > 2) L.firstElementChild.remove(); L.insertAdjacentHTML('beforeend', html); const e = L.lastElementChild; setTimeout(()=>e.remove(), ms); }
function paintBar(){
  const bar = $q('q-sks'); if(!bar) return; UI.b = [];
  if(UI.bt){
    bar.innerHTML = S.heroes.map((u, i)=>`<button type="button" class="q-pt" data-pt="${i}" style="--c:${HERO[u.k].col}" aria-disabled="true" aria-label="${esc(u.n)} 필살기 ${esc(HERO[u.k].u)} — ${esc(HERO[u.k].ud)}"><i aria-hidden="true">${u.ic}</i><b>${esc(HERO[u.k].u)}</b><span class="q-pt-h"><em></em></span><span class="q-pt-e"><em></em></span></button>`).join('');
    UI.b = [...bar.querySelectorAll('[data-pt]')]; UI.b.forEach(b=>b.onclick = ()=>ult(+b.dataset.pt));
  } else bar.innerHTML = `<div class="q-sks-t">👥 <span aria-hidden="true">${fmGet().filter(Boolean).map(k=>HERO[k].ic).join(' ')}</span> 동료와 자동 전투 — 초상을 눌러 필살기</div>`;
}
function ui(){
  const bt = !!(S && (S.mode === 'go' || S.mode === 'done') && S.heroes.length), top = $q('q-top');
  if(bt !== UI.bt || UI.s !== S){ UI.bt = bt; UI.s = S; UI.p = []; if(top) top.hidden = !bt; paintBar(); }
  if(!bt) return;
  S.heroes.forEach((u, i)=>{ const b = UI.b[i]; if(!b) return; const hq = Math.round(Math.max(0, u.hp) / u.max * 20), eq = Math.round(u.en / 5), key = hq * 100 + eq + (u.dead ? 5000 : 0); if(UI.p[i] === key) return; UI.p[i] = key;
    b.style.setProperty('--h', (hq / 20).toFixed(2)); b.style.setProperty('--e', (eq / 20).toFixed(2)); b.classList.toggle('rdy', u.en >= 100 && !u.dead); b.classList.toggle('dead', !!u.dead); b.setAttribute('aria-disabled', String(u.en < 100 || !!u.dead)); });
}
function render(){ ctl(); UI.bt = null; if(S && S.mode === 'go') $q('q-ov').hidden = true; }

function loop(ts){
  raf = requestAnimationFrame(loop);
  if(!last) last = ts; const dt = Math.min(0.033, (ts - last) / 1000); last = ts;
  if(S && S.hs > 0){ S.hs = RM ? 0 : S.hs - dt; }                                  // 히트스톱 — 큰 한 방에 몇 프레임 시간을 멈춘다
  else if(S && !S.paused && S.mode === 'go'){ acc += dt * speed; let n = 0; while(acc >= FIX && n++ < 30){ step(FIX); acc -= FIX; if(!S || S.mode !== 'go') break; } }
  else{ acc = 0; if(S && S.mode === 'done'){ S.t += dt; fxTick(dt); for(const u of [...S.heroes, ...S.foes]) if(u.dead) u.dd += dt; } }
  if(S && S.shk > 0) S.shk -= dt;
  if(S && S.cutQ){ const u = S.cutQ; S.cutQ = null; fxAdd(`<div class="q-cut" style="--c:${HERO[u.k].col}"><i>${esc(u.ic)}</i><span>${esc(HERO[u.k].u)}<small>${esc(u.n)} · ${esc(HERO[u.k].ud)}</small></span></div>`, 950); }
  if(S && S.banQ){ const [t, c] = S.banQ; S.banQ = null; fxAdd(`<div class="q-ban ${c}">${esc(t)}</div>`, 1500); }
  if((S && S.mode === 'go' || CN) && !$q('q-ov').classList.contains('qv-map')) cam(ts);   // 카메라 흔들림은 전투·장면에서만 — 걷는 동안은 시차 이동으로 충분하고, 장면 SVG를 매 프레임 다시 그리지 않는다
  draw(); ui();
  if(!S && WK && $q('quest').classList.contains('qw')) wTick(dt);
  const hp = $q('q-hp'), hv = S && S.mode === 'go' ? `👥 ${S.heroes.filter(u=>!u.dead).length}/${S.heroes.length} · 💥${S.killed}` : `Lv${heroLv('me')} · 🧩${gotN()} · 🐚${typeof shellBal === 'function' ? shellBal() : 0}`;
  if(hp && hp.textContent !== hv) hp.textContent = hv;
}

function questOpen(){
  cv = $q('q-cv'); ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false; wire();
  $q('quest').hidden = false; document.body.classList.add('game-on');
  me = mkMe(); meW = whiteOf(me); const lk = look(); meImg = svgUrl(lk, 'qme'); legImg = svgUrl({ ...lk, boardc:'legend' }, 'qlg');
  try{ walkImg = typeof mochiSVG === 'function' ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(mochiSVG(lk, { charm:2, uid:'q' })) : ''; }catch(e){ walkImg = ''; }
  migrate();
  S = null; UI.bt = null; PK = ''; WK = null; ctl();
  const top = Math.floor(openTo() / 4); let tv = top; try{ const x = localStorage.getItem(TVK); if(x != null && x !== '') tv = nm(x, top); }catch(e){}
  TV = sel = qNow().all ? tv : top;                                                  // 진행 중이면 그 마을, 다 깼으면 마지막에 있던 마을
  let id = null; try{ id = typeof playQuestIdle === 'function' ? playQuestIdle() : null; }catch(e){}
  last = 0; acc = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  if(!seenOp() && sgN() === 0 && !qbOf().legend){ wMode(true); opening(); return; }   // 처음 한 번은 오프닝부터 — 지도 🎬 로 다시 본다
  town(TV, true);
  if(id && id.n > 0) idleCard(id);
}
function questClose(){ cancelAnimationFrame(raf); raf = 0; clearT(); tutOff(); S = null; WK = null; for(const k in KEY) KEY[k] = false; window._gameRun = false; $q('quest').hidden = true; document.body.classList.remove('game-on');
  wMode(false); const L = $q('q-fx'); if(L) L.innerHTML = ''; document.querySelectorAll('.qtm-gh').forEach(e=>e.remove()); const wv = $q('q-wv'); if(wv) wv.innerHTML = '';
  if(typeof playTick === 'function') playTick(); if(typeof renderHub === 'function' && typeof state !== 'undefined' && state.tab === 'play') renderHub(); }
function wire(){
  if(wire.done || !$q('quest')) return; wire.done = true; wCss();
  const stg = document.querySelector('#quest .game-stage');
  if(stg && !$q('q-wv')){ const wv = document.createElement('div'); wv.className = 'qw-v'; wv.id = 'q-wv'; wv.hidden = true; stg.insertBefore(wv, $q('q-ov')); }
  const box = document.querySelector('#quest .game-box');
  if(box && !$q('q-bar')){ const b = document.createElement('div'); b.id = 'q-bar'; b.setAttribute('role', 'group'); b.setAttribute('aria-label', '원정 메뉴');
    b.innerHTML = '<button class="btn ghost" id="q-bmap" type="button"><i aria-hidden="true">🗺️</i>지도</button><button class="btn ghost" id="q-bbag" type="button"><i aria-hidden="true">🎒</i>내 정보</button><button class="btn ghost" id="q-bteam" type="button"><i aria-hidden="true">👥</i>동료</button><button class="btn ghost" id="q-bcdx" type="button"><i aria-hidden="true">📖</i>기록</button>';
    box.appendChild(b);
    $q('q-bmap').onclick = ()=>{ sel = TV; map(); };
    $q('q-bbag').onclick = ()=>bag();
    $q('q-bteam').onclick = ()=>{ clearT(); S = null; TB = ''; teamUp(); };
    $q('q-bcdx').onclick = ()=>codex(); }
  /* 걷기 — 땅을 누르면 그 자리로, 사람·몬스터·물건을 누르면 걸어가서 말 걸기·전투·줍기 */
  const wv = $q('q-wv');
  if(wv) wv.onclick = e=>{
    if(!WK || !WK.G || e.target.closest('.qw-trk,.qw-act') || !$q('q-ov').hidden) return;
    const t = e.target.closest('.qe[data-i]'); if(t){ const en = WK.ents.find(x=>x.id === t.dataset.i); if(en) goTo(en); return; }
    const r = wv.getBoundingClientRect(), G = WK.G, x = Math.max(24, Math.min(WW - 24, e.clientX - r.left + WK.cam)), d = Math.max(.08, Math.min(1, (e.clientY - r.top - G.gt - 30) / (G.gh - 50)));
    WK.go = null; WK.tx = x; WK.td = d;
    const tp = $q('q-tap'); if(tp){ tp.style.setProperty('--p', `translate(${f1(x)}px,${f1(fy(G, d))}px)`); tp.style.transform = `translate(${f1(x)}px,${f1(fy(G, d))}px)`; tp.classList.remove('on'); void tp.offsetWidth; tp.classList.add('on'); }
  };
  $q('q-x').onclick = e=>{ if(e && e.isTrusted === false && qBack()) return; questClose(); };   // 휴대폰 뒤로가기(backnav 가 대신 누름)는 덮개부터 닫는다
  $q('q-speed').onclick = ()=>{ speed = speed === 1 ? 2 : 1; try{ localStorage.setItem('lineup.share.qspd', String(speed)); }catch(e){} ctl(); };
  $q('q-auto').onclick = ()=>{ auto = !auto; try{ localStorage.setItem('lineup.share.qauto', auto ? '1' : '0'); }catch(e){} ctl(); if(S && S.tut === 1 && !auto) tutGo(2); };
  try{ auto = localStorage.getItem('lineup.share.qauto') !== '0'; speed = localStorage.getItem('lineup.share.qspd') === '2' ? 2 : 1; }catch(e){}
  addEventListener('keydown', e=>{ if($q('quest').hidden) return; if(e.key === 'Escape'){ if(!qBack()) questClose(); return; } wKey(e, true); });
  addEventListener('keyup', e=>wKey(e, false));
  addEventListener('blur', ()=>{ for(const k in KEY) KEY[k] = false; });
  let rz = 0; addEventListener('resize', ()=>{ clearTimeout(rz); rz = setTimeout(()=>{ if(WK && !$q('quest').hidden && $q('quest').classList.contains('qw')) wBuild(); }, 200); });
  document.addEventListener('visibilitychange', ()=>{ if(S) S.paused = document.hidden; last = 0; });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
window.questOpen = questOpen; window.questClose = questClose;
window._quest = { TUNE, get S(){ return S; }, get CN(){ return CN; }, get auto(){ return auto; }, set auto(v){ auto = v; ctl(); }, get WK(){ return WK; }, qXp, get TV(){ return TV; }, get T(){ return T; }, step, session, town, bag, fight, vInfo, qpOf, eqOf, eqBuy, goTo, interact, npcTalk, qBack, wTick, VIL, EQC, begin, teamUp, ult, end, map, codex, opening, place, fmGet, migrate, wavesOf, power, recPow, heroStat, heroLv, heroSt, starOf, sgN, CH, HERO, BOSS, N, NS, FIX, scene,
  sim(g, cap, kind){ session(g); if(kind === 'patrol'){ S.kind = kind; S.waves = S.waves.map(w=>w.filter(k=>k !== 'BOSS')); } begin(); const s = S; s.tutT = 0; let n = 0; while(S === s && !s.res && n++ < (cap || 60 * 200)) step(FIX); clearTimeout(tmr); return { res:s.res, stars:s.stars, t:Math.round(s.t), deaths:s.deaths, ults:s.ults || 0 }; },
  force(g, win){ session(g); S.heroes = fmGet().map((k, i)=>k ? mkHero(k, i) : null).filter(Boolean); S.mode = 'go'; end(win); },
  skip(){ for(let n = 0; n < 6; n++){                                              // 결과 띠 → 뒷이야기 → (엔딩) 순서로 끝까지 넘긴다
    if(CN){ const d = CN.done; cineStop(); if(d) d(); }
    else if(S && S.pend){ const f = S.pend; S.pend = null; clearTimeout(tmr); f(); }
    else if(T){ const d = T.done; clearT(); d(); }
    else break; } } };
})();
