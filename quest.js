/* ── 🗺️ 전설의 보드 원정 — 강원 해안 이야기 ──────────────────────────────────
   봉인된 '전설의 보드'를 찾아 고성 아야진에서 삼척 장호항까지 강원 해안 11마을을 따라 내려간다.
   마을 하나 = 한 장(章): ① 장 제목(영화식 위아래 띠) ② 비주얼노벨 대화 — 마을 장면 위에 큰 초상 좌우 배치
   ③ 준비물 하나 고르고 자동 전투 ④ 봉인 조각 + 마을 선물. 깬 마을은 다시 갈 수 있다.
   진행은 프로필 play.qb.ch(모은 조각 수)에 남아 다른 기기에서도 이어진다. 앞 마을들의 선물이 다음 장 전투에 계속 붙는다.
   마지막 장에서 봉인을 풀면 전설의 보드(BOARDC.legend).
   화면은 세 겹 — 맨 아래 장면 SVG(#q-bg, 장마다 그린 마을·시간대) / 가운데 240×240 도트 캔버스(전투만, 투명) /
   맨 위 DOM 덮개(지도·대화·카드). 물리는 1/60초 고정, 배속(1·2·4배)만 바꾼다. */
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
const FOES = {
  jelly:{ ic:'🪼', n:'해파리', hp:20, atk:4, sp:16, r:8, rate:1.2 },
  crab: { ic:'🦀', n:'꽃게 떼', hp:12, atk:3, sp:22, r:7, rate:0.9 },
  shark:{ ic:'🦈', n:'상어', hp:46, atk:12, sp:38, r:11, rate:1.4 },
  wave: { ic:'🌊', n:'성난 파도', hp:30, atk:16, sp:52, r:12, rate:99, crash:true },
  octo: { ic:'🐙', n:'대왕문어', hp:880, atk:14, sp:12, r:22, rate:1.5, boss:true },          // 보스는 장마다 키우지 않는다 — 그 장 선물·길동무 기술까지 계산해 맞춘 값
  guard:{ ic:'🐉', n:'검은 너울에 휘감긴 수호자', hp:1600, atk:17, sp:10, r:26, rate:1.5, boss:true },
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

/* 진행 — 모은 조각 수(0~N). 서버에서 온 값이라도 숫자로 가둔다 */
const qbOf = () => (ME && ME.profile && ME.profile.play && ME.profile.play.qb) || {};
const gotN = () => { const x = Math.floor(+qbOf().ch); return Number.isFinite(x) ? Math.max(0, Math.min(N, x)) : 0; };
const openTo = () => qbOf().legend ? N - 1 : Math.min(N - 1, gotN());          // 갈 수 있는 마지막 장 — 예전 원정을 깬 서퍼는 다 열려 있다
const ovEl = cls => { const ov = $q('q-ov'); ov.className = 'game-ov' + (cls ? ' ' + cls : ''); ov.hidden = false; ov.onclick = ov.onkeydown = null; return ov; };
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
function opening(){ cine(OPEN, ()=>{ try{ localStorage.setItem(OPK, '1'); }catch(e){} map(); }); }
function ending(){ if(S) S.mode = 'cine'; cine(END, legend); }

/* ── 지도 — 그린 해안 지도. 서쪽(왼쪽) 땅·산, 동쪽(오른쪽) 동해. 마을은 해안선 위 표지, 지나온 길은 금빛 실선, 남은 길은 점선 ── */
const CX = [.58, .6, .62, .63, .65, .67, .69, .7, .72, .74, .75], RY = 66, Y0 = 34;   // 남쪽으로 갈수록 해안이 동쪽으로 — 실제 강원 해안의 기울기
const TEAM = [['gull', 0], ['crab', 1], ['seal', 4], ['dol', 7]];                       // 길동무 — 그 장(번호)을 깨면 합류
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
/* from — 방금 깬 장 번호. 그 마을에서 다음 마을까지 금빛 길이 그려지는 걸 보여 준다 */
function map(keep, from){
  clearT(); S = null; window._gameRun = false;
  const got = gotN(), op = openTo(), ov = ovEl('qv-map'), y0 = keep ? ov.scrollTop : 0, rt = from != null && got === from + 1 && from + 1 < N ? from : -1;
  sel = Math.max(0, Math.min(op, sel));
  const w = Math.max(280, ov.clientWidth || 320), h = Y0 * 2 + (N - 1) * RY + 10;
  const team = TEAM.filter(([, k])=>got > k || k === 0).map(([c])=>CAST[c]);
  ov.innerHTML = `<div class="qm"><div class="qm-top"><div class="qm-hd"><b>🗺️ 강원 해안 원정</b><span class="qm-bt"><button class="btn sm ghost" id="q-op" type="button" aria-label="오프닝 다시 보기">🎬</button><button class="btn sm ghost" id="q-cdx" type="button">📖 기록</button></span><span>🧩 ${got}/${N}</span></div>
    <div class="qm-bar" role="progressbar" aria-label="모은 봉인 조각" aria-valuemin="0" aria-valuemax="${N}" aria-valuenow="${got}"><i style="width:${got / N * 100}%"></i></div>
    <p class="qm-tip">${got >= N ? '🏄 봉인을 풀었어요! 마을을 골라 다시 놀러 가요' : `📍 다음 목적지 — <b>${esc(CH[got].n)}</b> · ${esc(TOD[CH[got].tod].nm)}`}<span class="qm-team" aria-label="길동무">${team.map(p=>`<i title="${esc(p.n)}">${esc(p.ic)}</i>`).join('')}</span></p></div>
    <div class="qm-map" style="height:${h}px">${mapSvg(w, h, got, rt)}${CH.map((c, i)=>{ const st = i < got ? 'done' : i === got ? 'now' : i <= op ? 'open' : 'lock';
      return `<button type="button" class="qm-n ${st}${i === sel ? ' sel' : ''}" data-ch="${i}" style="top:${Y0 + i * RY}px;width:${Math.round(w * CX[i]) + 17 - 6}px"${st === 'lock' ? ' disabled' : ''} aria-pressed="${i === sel}">
        <span class="qm-t"><b>${esc(c.n)}${c.boss ? ' ⚠️' : ''}</b><small>제${i + 1}장 · ${st === 'lock' ? '아직 잠겨 있어요' : esc(c.s)}</small></span>
        <span class="qm-d" aria-hidden="true">${st === 'lock' ? '🔒' : esc(c.lm)}<i>${st === 'done' ? '🧩' : i + 1}</i></span>
        ${i === sel ? (meImg ? `<img class="qm-me${rt >= 0 ? ' mv' : ''}" src="${meImg}" alt="내 캐릭터">` : '<span class="qm-me">🏄</span>') : ''}</button>`; }).join('')}</div>
    <div class="qm-ft"><button class="btn blue" id="q-go" type="button">▶ 제${sel + 1}장 ${sel < got ? '다시 하기' : '떠나기'} — ${esc(CH[sel].n)}</button></div></div>`;
  ov.querySelectorAll('[data-ch]').forEach(b=>b.onclick = ()=>{ sel = +b.dataset.ch; map(true); });
  $q('q-go').onclick = e=>{ e.stopPropagation(); start(sel); };              // 덮개까지 번지면 방금 단 '제목 넘기기'가 바로 눌린다
  $q('q-op').onclick = e=>{ e.stopPropagation(); opening(); };
  $q('q-cdx').onclick = e=>{ e.stopPropagation(); codex(); };
  const b = ov.querySelector('.qm-n.sel');
  ov.scrollTop = keep ? y0 : (b ? b.offsetTop + b.offsetParent.offsetTop - ov.clientHeight / 2 + 20 : 0);
  setBg(sel, false);
  const l = $q('q-log'); if(l) l.innerHTML = `<div>🗺️ ${got >= N ? '봉인을 풀었어요 — 전설의 보드 보유' : `다음 목적지 — ${esc(CH[got].n)} (${esc(CH[got].d)})`}</div><div style="opacity:.75">마을을 누르고 아래 버튼으로 떠나요 · 📖 기록에서 지나온 장을 다시 할 수 있어요</div>`;
}
/* ── 기록장 — 만난 이들·지나온 곳. 깬 장에서 처음 말한 인물만 열리고, 장소마다 「다시」로 그 장을 다시 한다 ── */
function codex(){
  clearT(); S = null; window._gameRun = false;
  const got = qbOf().legend ? N : gotN(), ov = ovEl('qv-cdx'), seen = {}, ppl = [];
  CH.forEach((c, i)=>[...c.pre, ...c.post].forEach(([w])=>{ const p = w === 'a' || w === 'b' ? c[w] : CAST[w]; if(!p || seen[p.n]) return; seen[p.n] = 1; ppl.push({ p, i }); }));
  const it = (u, ic, n, sm, ex) => `<div class="qx-it${u ? '' : ' lk'}"><i aria-hidden="true">${u ? esc(ic) : '❔'}</i><span><b>${u ? esc(n) : '???'}</b><small>${esc(sm)}</small></span>${ex || ''}</div>`;
  ov.innerHTML = `<div class="qx"><div class="qx-hd"><b>📖 원정 기록</b><span>만난 이 ${ppl.filter(x=>x.i < got).length}/${ppl.length}</span><button class="btn sm ghost" id="q-cx" type="button">🗺️ 지도</button></div>
    <h4>만난 이들</h4><div class="qx-g">${ppl.map(({ p, i })=>it(i < got, p.ic, p.n, `제${i + 1}장 ${CH[i].n.split(' ').pop()}`)).join('')}</div>
    <h4>지나온 곳 · 다시 하기</h4><div class="qx-l">${CH.map((c, i)=>it(i < got, c.lm, c.n, i < got ? `제${i + 1}장 · ${c.s} · ${TOD[c.tod].nm}` : `제${i + 1}장 · 아직 못 가 봤어요`, i < got ? `<button class="btn sm" type="button" data-rp="${i}" aria-label="제${i + 1}장 다시 하기">▶ 다시</button>` : '')).join('')}</div>
    ${got >= N ? '<button class="btn ghost" id="q-end" type="button" style="width:100%;margin-top:10px">🎬 엔딩 다시 보기</button>' : ''}</div>`;
  $q('q-cx').onclick = ()=>map();
  ov.querySelectorAll('[data-rp]').forEach(b=>b.onclick = ()=>{ sel = +b.dataset.rp; start(sel); });
  const e = $q('q-end'); if(e) e.onclick = ()=>cine(END, ()=>map());
  const l = $q('q-log'); if(l) l.innerHTML = '<div>📖 원정 기록 — 장을 깰수록 만난 이들과 장소가 채워져요</div>';
}

/* ── 한 장 — 지역 띠·제목 → 도착 대화 → 준비물 → 전투 → 승리 띠 → 뒷이야기 → 보상 카드 → 지도(다음 마을까지 길) ── */
/* 길동무 기술 — 합류한 동료마다 하나. 충전되면 AUTO 켬은 알아서, AUTO 끔은 아래 카드를 눌러 쓴다 */
const SKL = {
  gull:{ n:'끼룩 급강하', col:'#3E8FD0', cd:9,  d:'앞의 적을 쪼고 조개 2개', f:s=>{ const f = front(s); if(f) hitF(s, f, 8 + s.atk, 1); s.shells += 2; } },
  crab:{ n:'집게 회오리', col:'#D9503A', cd:9,  d:'앞의 적에게 큰 한 방', f:s=>{ const f = front(s); if(f) hitF(s, f, s.atk * 2.2, 1); } },
  seal:{ n:'몽돌 휘파람', col:'#2F9F7A', cd:13, d:'체력 회복 + 보호막', f:s=>{ const h = s.maxHp * .16; s.hp = Math.min(s.maxHp, s.hp + h); s.shield += 12; s.fx.push({ k:'txt', x:30, y:SEA - 50, t:0, v:'+' + Math.round(h), c:'#7BF0B0', big:1 }); } },
  dol: { n:'파랑 물보라', col:'#1F7FC0', cd:12, d:'모든 적에게 물보라', f:s=>{ s.foes.forEach(f=>{ if(f.hp > 0) hitF(s, f, s.atk * 1.2, 1); }); s.fx.push({ k:'wash', t:0 }); } },
};
const PARTY = { gull:[28, SEA - 64], crab:[14, SEA - 10], seal:[-2, SEA + 1], dol:[64, SEA + 6] };   // 길동무 자리 — 내 뒤와 위
const front = s => s.foes.filter(f=>f.hp > 0).sort((a, b)=>a.x - b.x)[0];
function hitF(s, f, d, big){
  d = Math.round(d); f.hp -= d; f.dT = .45;
  s.fx.push({ k:'txt', x:f.x - 5, y:f.y - f.r - 10, t:0, v:String(d), c:big ? '#FFE27A' : '#FFFFFF', big });
  if(big){ s.hs = Math.max(s.hs || 0, .08); s.shk = Math.max(s.shk, .14); }       // 큰 한 방은 잠깐 멈칫(히트스톱) + 살짝 흔들림
}
function session(k){
  clearT();
  S = { k, mode:'title', hp:100, maxHp:100, atk:11, cd:0.8, cdT:0, def:1, multi:1, shield:0, startShield:0, palRate:0.22, hs:0,
        foes:[], pals:[], fx:[], log:[], t:0, killed:0, need:CH[k].need, spawnT:1.2, shells:0, whale:false, boons:[], bossOut:false, res:null, gifts:[], alt:false, shk:0, pend:null };
  { const U = typeof upFor === 'function' ? upFor('quest', true) : {}; if(U.hp) S.hp = S.maxHp = 100 + 8 * U.hp; if(U.atk) S.atk += U.atk; S.upTag = U.tag || ''; }   // 🔧 강화 — 마을 선물보다 먼저(선물이 그 위에 더한다)
  for(let j = 0; j < k; j++) if(CH[j].gift){ CH[j].gift.f(S); S.gifts.push(CH[j].gift.ic); }   // 앞 마을들의 선물 — 이야기로 강해진다
  S.sk = TEAM.filter(([, j])=>j === 0 || j < k).map(([c])=>({ c, ...SKL[c], t:SKL[c].cd * .4, act:0 }));
  S.shield = S.startShield; S.hpD = S.hp; window._gameRun = true;              // 원정 중엔 다른 알림 카드가 덮지 않게
  setBg(k, false);
}
function start(k){
  session(k); const c = CH[k], ov = ovEl('qv-title');
  if(S.upTag && typeof toast === 'function') toast('🔧 강화 적용: ' + S.upTag);
  ov.innerHTML = `<div class="q-reg" aria-hidden="true">${esc(c.lm)} ${esc(c.n)}</div><div class="qtt" role="button" tabindex="0" aria-label="이야기 시작"><small>제 ${k + 1} 장 · ${esc(TOD[c.tod].nm)}</small><b>${esc(c.s)}</b><span>${esc(c.lm)} ${esc(c.n)}</span><p>${esc(c.d)}</p></div>`;
  log(`📍 ${c.n} — ${c.d}`); beep(392, 523, .4, .04);
  const go = ()=>{ if(S && S.mode === 'title'){ clearTimeout(tmr); talk(c.pre, pickPhase); } };
  ov.onclick = go; ov.onkeydown = e=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } };
  tmr = setTimeout(go, RM ? 1400 : 2600);
}
function who(w){
  const c = CH[S.k];
  if(w === 'm') return { img:meImg, ic:'🏄', n:ME.name || '나', me:1 };
  if(w === 'L') return { img:legImg || meImg, ic:'🏄', n:ME.name || '나', me:1 };
  if(w === 'a' || w === 'b') return c[w];
  return CAST[w] || null;                                                         // n = 해설(초상 없음)
}
function talk(lines, done){
  clearT(); S.mode = 'talk'; T = { lines, i:0, done, n:0, iv:0, npc:'', seen:{} }; line();
}
/* 비주얼노벨 무대 — 왼쪽은 늘 나, 오른쪽은 마지막으로 말한 상대. 말하는 쪽만 밝고 크게, 나머지는 어둡게.
   해설(n)은 인물을 내리고 위아래 검은 띠 + 가운데 글(레퍼런스의 오프닝 컷 연출) */
function line(){
  const ov = ovEl('qv-talk'), [w, txt] = T.lines[T.i], sp = who(w), nar = !sp, isMe = !!(sp && sp.me);
  if(sp && !isMe) T.npc = w;
  const np = T.npc ? who(T.npc) : null, lImg = w === 'L' ? (legImg || meImg) : meImg;
  const inL = !T.seen.l, inR = np && T.seen.r !== T.npc; if(!nar){ T.seen.l = 1; if(np) T.seen.r = T.npc; }
  S.spk = w; ov.classList.toggle('cine', nar);
  ov.innerHTML = `<div class="qvn" aria-hidden="true">
      <div class="qvn-f qvn-l qt-pt${isMe ? ' on' : ''}${inL && !nar ? ' in' : ''}">${lImg ? `<img src="${lImg}" alt="">` : '<span>🏄</span>'}</div>
      ${np ? `<div class="qvn-f qvn-r${!isMe && !nar ? ' on' : ''}${inR && !nar ? ' in' : ''}${np.fx ? ' ' + np.fx : ''}"><span>${esc(np.ic)}</span></div>` : ''}</div>
    <button class="btn sm ghost qt-sk" id="q-sk" type="button">건너뛰기 ⏭</button>
    <div class="qt${nar ? ' nar' : ''}${sp && !isMe ? ' r' : ''}" id="q-tb" role="button" tabindex="0" aria-label="다음 대사 (${T.i + 1}/${T.lines.length})">
    ${sp ? `<b class="qt-n">${esc(sp.n)}</b>` : ''}<p class="qt-x" id="q-tx" aria-hidden="true"></p><span class="qt-sr">${sp ? esc(sp.n) + ': ' : ''}${esc(txt)}</span><i class="qt-nx" aria-hidden="true">▼</i>
    <i class="qt-pg" aria-hidden="true">${T.lines.map((_, i)=>`<b${i === T.i ? ' class="on"' : ''}></b>`).join('')}</i></div>`;
  const tx = $q('q-tx'), chars = Array.from(txt);
  T.n = RM ? chars.length : 0; tx.textContent = chars.slice(0, T.n).join('');
  if(T.n < chars.length) T.iv = setInterval(()=>{ T.n++; tx.textContent = chars.slice(0, T.n).join(''); if(T.n >= chars.length){ clearInterval(T.iv); T.iv = 0; } }, 28);   // 한 글자씩 — 읽는 속도를 이야기가 정한다
  T.full = ()=>{ clearInterval(T.iv); T.iv = 0; T.n = chars.length; tx.textContent = txt; };
  const tb = $q('q-tb'); tb.onclick = next; tb.onkeydown = e=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); next(); } };
  ov.onclick = e=>{ if(e.target === ov || e.target.closest('.qvn')) next(); };   // 장면 아무 데나 눌러도 넘어간다
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
  b.f(S); S.hpD = S.hp; S.boons.push(b.ic); log(`${b.ic} ${b.n} 챙겼어요 — ${b.d}`); S.mode = 'go'; S.banQ = [`🌊 ${CH[S.k].n.split(' ').pop()} 바다로!`, '']; render(); beep(523, 784, 0.12);
}
function log(t){ if(!S) return; S.log.unshift({ t, at:S.t }); S.log = S.log.slice(0, 40); paintLog(); }
/* 기술 쓰기 — 컷인 띠는 다음 프레임에 DOM으로 띄운다(시뮬레이션은 DOM 없이 돈다) */
function fire(i){
  const s = S, k = s && s.sk && s.sk[i]; if(!k || s.mode !== 'go' || k.t < k.cd) return false;
  k.t = 0; k.act = .5; k.f(s); s.cutQ = k; s.hs = Math.max(s.hs, .22);
  log(`${CAST[k.c].ic} ${CAST[k.c].n} — ${k.n}!`); beep(440, 880, .18, .05);
  UI.p[i] = -1; return true;
}

/* 적 만들기 — 남쪽 마을일수록 세진다 */
function spawn(kind){
  const F = FOES[kind], k = F.boss ? 1 : 1 + S.k * 0.1, hp = Math.round(F.hp * k * (F.boss ? 1 : 1.2));   // 길동무 기술만큼 졸개를 조금 단단하게
  S.foes.push({ kind, ...F, hp, max:hp, hpD:hp, dT:0, atk:F.atk * (F.boss ? 1 : 1 + S.k * 0.06), x:W + 20, y:SEA - (F.boss ? 18 : 6) + (rnd() * 6 - 3), hitT:0, wob:rnd() * 6 });
  if(F.boss){ log(`⚠️ ${F.ic} ${F.n} 등장!`); S.banQ = [`⚠️ ${F.n}`, 'boss']; }
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
  else if(k === 'whale'){ S.whale = true; S.foes.forEach(f=>{ f.hp -= f.boss ? 60 : 9999; f.dT = .45; }); S.fx.push({ k:'whale', t:0 }); }
  S.pals.push({ k, t:0, life:k === 'dolphin' ? 18 : k === 'seal' ? 10 : k === 'whale' ? 2.5 : 3, cd:0, x:20 + rnd() * 40 });
}
/* 지연 HP — 깎인 만큼 흰 꼬리가 잠깐 남았다가 따라 줄어든다 */
function trail(o, cur, max, dt){ if(o.hpD == null || o.hpD < cur) o.hpD = cur; else if((o.dT -= dt) <= 0) o.hpD = Math.max(cur, o.hpD - max * .7 * dt); }

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
    if(p.k === 'dolphin'){ p.cd -= dt; if(p.cd <= 0){ const f = front(s); if(f){ f.hp -= 8; f.dT = .45; p.cd = 0.6; s.fx.push({ k:'zap', x:f.x, y:f.y, t:0, c:'#7BE0FF' }); } } }
    if(p.k === 'seal') s.hp = Math.min(s.maxHp, s.hp + 2.2 * dt);
  }
  s.pals = s.pals.filter(p=>p.t < p.life);
  for(let i = 0; i < s.sk.length; i++){ const k = s.sk[i]; if(k.t < k.cd) k.t = Math.min(k.cd, k.t + dt); if(k.act > 0) k.act -= dt;
    if(auto && k.t >= k.cd && (k.c === 'seal' ? s.hp < s.maxHp * .7 : s.foes.some(f=>f.hp > 0 && f.x < 190))) fire(i); }
  s.cdT -= dt;
  if(s.cdT <= 0){
    const tg = s.foes.filter(f=>f.hp > 0 && f.x < sx + 120).sort((a,b)=>a.x - b.x).slice(0, s.multi);
    if(tg.length){ tg.forEach(f=>{ hitF(s, f, s.atk, 0); s.fx.push({ k:'zap', x:f.x, y:f.y, t:0, c:'#FFFFFF' }); }); s.cdT = s.cd; beep(880, 660, 0.05, 0.02); }
  }
  trail(s, s.hp, s.maxHp, dt); for(const f of s.foes) trail(f, Math.max(0, f.hp), f.max, dt);
  for(const f of s.foes) if(f.hp <= 0 && !f.dead){ f.dead = true; s.killed++; if(f.boss) log(`🏆 ${f.ic} ${f.n}를 넘었어요!`); else if(rnd() < 0.3) s.shells++; }
  s.foes = s.foes.filter(f=>!f.dead);
  if(s.hp <= 0) return end(false);
  const c = CH[s.k];
  if(c.boss ? s.bossOut && !s.foes.some(f=>f.boss) : s.killed >= s.need) end(true);
}
function hurt(n, f){
  let d = n * S.def;
  if(S.shield > 0){ const a = Math.min(S.shield, d); S.shield -= a; d -= a; }
  if(d > 0){ S.hp -= d; S.dT = .5; S.shk = Math.min(.3, d / 40); if(d >= 9) S.hs = Math.max(S.hs, .06); S.fx.push({ k:'txt', x:36, y:SEA - 46, t:0, v:'-' + Math.round(d), c:'#FF6B6B', big:d >= 9 ? 1 : 0 }); }
  if(f.kind === 'shark' && rnd() < 0.3) log('🦈 상어가 물었어요!');
  if(f.kind === 'wave') log('🌊 성난 파도에 맞았어요!');
  try{ if(typeof vib === 'function') vib(8); }catch(e){}
}
/* 장 끝 — 이기면 조각 기록(qb.ch)·마을 사례 조개, 마지막 장이면 전설. 지면 조개만 챙기고 다시.
   결과 띠를 1.5초 보여 준 뒤(pend) 뒷이야기로 — 이기면 하늘이 바뀌는 장(정동진 해돋이·장호항 새벽)은 그때 장면을 갈아 끼운다 */
function end(win){
  const k = S.k, lastCh = k === N - 1, s0 = S;
  S.res = win ? 'win' : 'lose'; S.mode = 'done'; window._gameRun = false;
  if(win) S.shells += 3 + k;
  let r = { best:k, gain:0 };
  try{ if(typeof playQuestDone === 'function') r = playQuestDone(k, win && lastCh, S.shells, win) || r; }catch(e){}
  S.r = r;
  log(win ? `✅ ${CH[k].n}의 바다를 지켰어요` : `💤 ${CH[k].n}에서 쓰러졌어요`);
  S.banQ = win ? ['🏆 바다를 지켰어요!', 'win'] : ['💤 힘이 다했어요…', 'bad'];
  S.pend = win ? ()=>{ if(CH[k].alt){ S.alt = true; setBg(k, true); } talk(CH[k].post, lastCh ? ending : reward); } : lost;
  if(win) beep(523, 1047, 0.3); else beep(330, 165, .4);
  tmr = setTimeout(()=>{ if(S === s0 && S.pend){ const f = S.pend; S.pend = null; f(); } }, RM ? 600 : 1500);
}
const stats = () => `<div class="go-st"><span>장<b>${S.k + 1}/${N}</b></span><span>쓰러뜨림<b>${S.killed}</b></span><span>조개<b>${S.r && S.r.shells || S.shells}${S.r && S.r.x2 ? ' ×2' : ''}</b></span><span>XP<b>+${S.r && S.r.gain || 0}</b></span></div>`;
function reward(){
  const c = CH[S.k], k = S.k, ov = ovEl(''), mo = MONO[k];
  S.mode = 'card';
  const join = TEAM.find(([, j])=>j === k);
  ov.innerHTML = `<div class="go-card"><div class="qpc" aria-hidden="true">🧩</div><div class="go-t">봉인 조각 ${gotN()}/${N}</div>
    <div class="go-d">${esc(c.n)}의 매듭 조각을 받았어요${join ? `<br>${esc(CAST[join[0]].ic)} <b>${esc(CAST[join[0]].n)}</b>이(가) 길동무가 됐어요 — 다음 장부터 기술을 써요` : ''}</div>
    ${c.gift ? `<div class="q-gift"><i aria-hidden="true">${c.gift.ic}</i><span><b>🎁 ${esc(c.gift.n)}</b><small>다음 장부터 계속 · ${esc(c.gift.d)}</small></span></div>` : ''}
    ${mo ? `<div class="q-mono"><i aria-hidden="true">${esc(CAST[mo[0]].ic)}</i><span><b>${esc(CAST[mo[0]].n)}의 혼잣말</b>${esc(mo[1])}</span></div>` : ''}
    ${stats()}<button class="btn blue" id="q-next" type="button" style="width:100%;min-height:52px;font-size:16px">🗺️ 다음 마을 — ${esc(CH[k + 1].n)}</button></div>`;
  $q('q-next').onclick = ()=>{ sel = k + 1; map(false, k); };
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

/* ── 그리기 — 캔버스는 투명. 배경은 장면 SVG가 맡고, 여기선 전투(나·길동무·적·효과·윗줄)만 ── */
function Rq(c, x, y, w, h){ ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), h); }
function hb(x, y, w, h, cur, dly, max, col){                                   // HP 바 — 검은 테 · 흰 지연 꼬리 · 현재 값
  Rq('rgba(0,0,0,.5)', x - 1, y - 1, w + 2, h + 2); Rq('#FFFFFF', x, y, w * Math.max(0, Math.min(1, dly / max)), h); Rq(col, x, y, w * Math.max(0, Math.min(1, cur / max)), h);
}
function draw(){
  ctx.clearRect(0, 0, W, H);
  const s = S; if(!s || !(s.mode === 'go' || s.mode === 'pick' || s.mode === 'done')) return;
  const c = CH[s.k], t = s.t, sh = !RM && s.shk > 0 ? s.shk * 14 : 0;
  ctx.save(); if(sh) ctx.translate(Math.round((rnd() - .5) * sh), Math.round((rnd() - .5) * sh));
  ctx.textBaseline = 'top';
  const bob = RM ? 0 : Math.round(Math.sin(t * 5) * 1.5), sy = SEA - 22 + bob;
  ctx.font = '13px sans-serif';                                                  // 길동무 — 기술 쓰면 앞으로 튀어나갔다 돌아온다
  s.sk.forEach((k, i)=>{ const P = PARTY[k.c], j = k.act > 0 ? Math.sin((.5 - k.act) / .5 * Math.PI) * 26 : 0; ctx.fillText(CAST[k.c].ic, P[0] + j, P[1] + (RM ? 0 : Math.sin(t * 3 + i * 1.7) * 2)); });
  ctx.globalAlpha = .3; Rq('#000', 30, SEA + 2, 30, 2); ctx.globalAlpha = 1;            // 물 위 그림자 — 떠 있는 느낌
  Rq('#FF6B6B', 34, sy + 22, 22, 3); if(me) ctx.drawImage(me, 33, sy);
  if(s.shield > 0){ ctx.strokeStyle = 'rgba(123,224,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(45, sy + 12, 17, 0, 6.3); ctx.stroke(); }
  hb(24, sy - 9, 44, 4, s.hp, s.hpD ?? s.hp, s.maxHp, s.hp / s.maxHp > 0.35 ? '#4ADE80' : '#FF6B6B');
  if(s.shield > 0) Rq('#7BE0FF', 24, sy - 3, Math.min(44, 44 * s.shield / 60), 2);
  ctx.font = '14px sans-serif';
  s.pals.forEach((p, i)=>{ const px = p.k === 'whale' ? 60 + p.t * 60 : p.x + Math.sin(p.t * 3 + i) * 10, py = p.k === 'gull' ? 40 + Math.sin(p.t * 4) * 6 : p.k === 'whale' ? SEA + 10 : SEA + 6 + Math.sin(p.t * 4 + i) * 3;
    ctx.font = p.k === 'whale' ? '26px sans-serif' : '14px sans-serif'; ctx.fillText(PALS[p.k].ic, px, py); });
  s.foes.forEach(f=>{ const wob = Math.sin(t * 4 + f.wob) * 2, fl = f.dT > .3;
    if(f.boss){ ctx.globalAlpha = .35 + Math.sin(t * 3) * .1; ctx.fillStyle = f.kind === 'guard' ? '#7A3AD0' : '#7A1A5A'; ctx.beginPath(); ctx.ellipse(f.x, f.y + f.r - 4, f.r * 1.4, f.r * .4, 0, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; }   // 보스 밑 검은 물빛
    ctx.font = (f.boss ? 34 : f.kind === 'wave' ? 20 : 15) + 'px sans-serif'; ctx.fillText(f.ic, f.x - f.r + (fl && !RM ? 2 : 0), f.y - f.r + wob);
    if(!f.boss) hb(f.x - f.r, f.y - f.r - 6, f.r * 2, 3, f.hp, f.hpD, f.max, '#FF6B6B'); });
  s.fx.forEach(f=>{
    if(f.k === 'zap'){ ctx.globalAlpha = 1 - f.t / 0.9; ctx.strokeStyle = f.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, 4 + f.t * 14, 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1; }
    else if(f.k === 'txt'){ const u = f.t / .9, y = f.y - f.t * 18 - (f.big && !RM ? Math.sin(Math.min(1, f.t * 6) * Math.PI) * 5 : 0);
      ctx.globalAlpha = Math.max(0, 1 - u * u); ctx.font = (f.big ? 12 : 9) + 'px Galmuri11, sans-serif'; ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(10,16,34,.75)'; ctx.strokeText(f.v, f.x, y); ctx.fillStyle = f.c || '#FFE27A'; ctx.fillText(f.v, f.x, y); ctx.globalAlpha = 1; }
    else if(f.k === 'splash'){ ctx.globalAlpha = 1 - f.t / 0.9; Rq('#FFFFFF', f.x - 10, f.y - f.t * 20, 20, 4); ctx.globalAlpha = 1; }
    else if(f.k === 'whale' || f.k === 'wash'){ const wl = f.k === 'whale'; ctx.globalAlpha = Math.max(0, .5 - f.t / (wl ? 5 : 1.8)); Rq('#BFEFFF', 0, SEA - 30, W * Math.min(1, f.t / (wl ? .8 : .3)), 40); ctx.globalAlpha = 1; } });
  ctx.restore();
  // 윗줄·보스 띠 — 흔들림 밖에서 그려 읽기 쉽게(restore 가 글자 기준선도 되돌리므로 다시 top)
  ctx.textBaseline = 'top'; ctx.font = '8px Galmuri11, sans-serif';
  Rq('rgba(10,16,34,.72)', 0, 0, W, 16); ctx.fillStyle = '#FFE27A'; ctx.fillText(`제${s.k + 1}장 ${c.n}`, 4, 4);
  ctx.fillStyle = '#FFFFFF'; ctx.fillText(`🐚${s.shells}`, W - 30, 4);
  const boss = s.foes.find(f=>f.boss), prog = c.boss ? (boss ? 1 - boss.hp / boss.max : s.bossOut ? 1 : 0) : s.killed / Math.max(1, s.need);
  Rq('rgba(0,0,0,.3)', 4, 18, W - 8, 3); Rq('#FFE27A', 4, 18, (W - 8) * Math.min(1, prog), 3);
  if(boss){ Rq('rgba(24,6,34,.8)', 0, H - 19, W, 19); ctx.fillStyle = '#FFD6F0'; ctx.fillText(`${boss.n}  ${Math.max(0, Math.ceil(boss.hp))}/${boss.max}`, 4, H - 17); hb(4, H - 7, W - 8, 4, boss.hp, boss.hpD, boss.max, '#E0457A'); }
}
function paintLog(){ const el = $q('q-log'); if(!el || !S) return; el.innerHTML = S.log.slice(0, 6).map((l, i)=>`<div style="opacity:${1 - i * 0.13}">${esc(l.t)}</div>`).join(''); }

/* 전투 위 AUTO·배속, 아래 기술 카드 */
function ctl(){
  const sp = $q('q-speed'); if(sp){ sp.textContent = '×' + speed; sp.setAttribute('aria-label', `배속 ${speed}배`); sp.classList.toggle('on', speed > 1); }
  const au = $q('q-auto'); if(au){ au.textContent = auto ? 'AUTO 켬' : 'AUTO 끔'; au.setAttribute('aria-pressed', String(auto)); au.classList.toggle('on', auto); }
}
function fxAdd(html, ms){ const L = $q('q-fx'); if(!L) return; while(L.children.length > 2) L.firstElementChild.remove(); L.insertAdjacentHTML('beforeend', html); const e = L.lastElementChild; setTimeout(()=>e.remove(), ms); }
function paintSks(){
  const bar = $q('q-sks'); if(!bar) return; UI.b = [];
  if(UI.bt && S && S.sk){
    bar.innerHTML = S.sk.map((k, i)=>`<button type="button" class="q-skc${auto ? ' au' : ''}" data-sk="${i}" style="--c:${k.col}" aria-disabled="true" aria-label="${esc(CAST[k.c].n)} ${esc(k.n)} — ${esc(k.d)}"><i aria-hidden="true">${esc(CAST[k.c].ic)}</i><b>${esc(k.n)}</b><small>${auto ? '자동' : esc(k.d)}</small></button>`).join('');
    UI.b = [...bar.querySelectorAll('[data-sk]')]; UI.b.forEach(b=>b.onclick = ()=>{ if(!auto) fire(+b.dataset.sk); });
  } else {
    const got = gotN(), team = TEAM.filter(([, k])=>got > k || k === 0).map(([c])=>CAST[c]);
    bar.innerHTML = `<div class="q-sks-t">🤝 길동무 <span aria-hidden="true">${team.map(p=>esc(p.ic)).join(' ')}</span> — 전투에서 기술을 써요</div>`;
  }
}
function ui(){
  const bt = !!(S && (S.mode === 'go' || S.mode === 'pick')), top = $q('q-top');
  if(bt !== UI.bt || UI.s !== S){ UI.bt = bt; UI.s = S; UI.p = []; if(top) top.hidden = !bt; paintSks(); }
  if(!bt || !S.sk) return;
  S.sk.forEach((k, i)=>{ const p = Math.min(1, k.t / k.cd), r = Math.round(p * 25), b = UI.b[i]; if(!b || UI.p[i] === r) return; UI.p[i] = r;
    b.style.setProperty('--p', p.toFixed(2)); b.classList.toggle('rdy', p >= 1); b.setAttribute('aria-disabled', String(auto || p < 1)); });
}
function render(){
  ctl(); UI.bt = null; if(!S) return;
  if(S.mode === 'pick'){
    const c = CH[S.k], ov = ovEl('');
    ov.innerHTML = `<div class="go-card"><div class="go-t">🎒 떠나기 전 준비물</div><div class="go-d">${esc(c.n)} 바다로 — 하나만 챙길 수 있어요${S.gifts.length ? `<br>마을 선물 ${S.gifts.join(' ')} 은 이미 챙겼어요` : ''}</div>
      <div class="q-pick">${S.choices.map((b, i)=>`<button type="button" class="q-b" data-qb="${i}"><i>${b.ic}</i><b>${esc(b.n)}</b><small>${esc(b.d)}</small></button>`).join('')}</div>
      <div class="go-b" style="margin:8px 0 0">${auto ? '🤖 AUTO — 곧 알아서 골라요 (눌러서 직접 골라도 돼요)' : '하나 골라 주세요'}</div></div>`;
    ov.querySelectorAll('[data-qb]').forEach(b=>b.onclick = ()=>choose(+b.dataset.qb));
  } else if(S.mode === 'go') $q('q-ov').hidden = true;
}

function loop(ts){
  raf = requestAnimationFrame(loop);
  if(!last) last = ts; let dt = Math.min(0.033, (ts - last) / 1000); last = ts;
  if(S && S.hs > 0){ S.hs = RM ? 0 : S.hs - dt; }                                  // 히트스톱 — 몇 프레임 시간을 멈춘다
  else if(S && !S.paused && (S.mode === 'go' || S.mode === 'pick')){ acc += dt * speed; let n = 0; while(acc >= FIX && n++ < 30){ step(FIX); acc -= FIX; if(!S || (S.mode !== 'go' && S.mode !== 'pick')) break; } }
  else{ acc = 0; if(S) S.t += dt; }
  if(S && S.shk > 0) S.shk -= dt;
  if(S && S.cutQ){ const k = S.cutQ; S.cutQ = null; fxAdd(`<div class="q-cut" style="--c:${k.col}"><i>${esc(CAST[k.c].ic)}</i><span>${esc(k.n)}<small>${esc(CAST[k.c].n)}</small></span></div>`, 950); }
  if(S && S.banQ){ const [t, c] = S.banQ; S.banQ = null; fxAdd(`<div class="q-ban ${c}">${esc(t)}</div>`, 1500); }
  if(!$q('q-ov').classList.contains('qv-map') || $q('q-ov').hidden) cam(ts);        // 지도가 덮고 있으면 장면은 안 보인다 — 흔들 필요 없음
  draw(); ui();
  const hp = $q('q-hp'), hv = S && S.mode === 'go' ? `❤️ ${Math.max(0, Math.round(S.hp))}/${S.maxHp}${S.shield > 0 ? ` 🛡${Math.round(S.shield)}` : ''}` : `🧩 ${gotN()}/${N}`;
  if(hp && hp.textContent !== hv) hp.textContent = hv;
}

function questOpen(){
  cv = $q('q-cv'); ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  $q('quest').hidden = false; document.body.classList.add('game-on');
  me = mkMe(); const lk = look(); meImg = svgUrl(lk, 'qme'); legImg = svgUrl({ ...lk, boardc:'legend' }, 'qlg');
  S = null; UI.bt = null; sel = Math.min(gotN(), openTo()); ctl();
  if(!seenOp() && gotN() === 0 && !qbOf().legend) opening(); else map();              // 처음 한 번은 오프닝부터 — 지도 🎬 로 다시 본다
  last = 0; acc = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
}
function questClose(){ cancelAnimationFrame(raf); raf = 0; clearT(); S = null; window._gameRun = false; $q('quest').hidden = true; document.body.classList.remove('game-on');
  const L = $q('q-fx'); if(L) L.innerHTML = '';
  if(typeof playTick === 'function') playTick(); if(typeof renderHub === 'function' && typeof state !== 'undefined' && state.tab === 'play') renderHub(); }
function wire(){
  if(wire.done || !$q('quest')) return; wire.done = true;
  $q('q-x').onclick = questClose;
  $q('q-speed').onclick = ()=>{ speed = speed === 1 ? 2 : 1; try{ localStorage.setItem('lineup.share.qspd', String(speed)); }catch(e){} ctl(); };
  $q('q-auto').onclick = ()=>{ auto = !auto; try{ localStorage.setItem('lineup.share.qauto', auto ? '1' : '0'); }catch(e){} render(); };
  try{ auto = localStorage.getItem('lineup.share.qauto') !== '0'; speed = localStorage.getItem('lineup.share.qspd') === '2' ? 2 : 1; }catch(e){}
  addEventListener('keydown', e=>{ if(!$q('quest').hidden && e.key === 'Escape') questClose(); });
  document.addEventListener('visibilitychange', ()=>{ if(S) S.paused = document.hidden; last = 0; });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
window.questOpen = questOpen; window.questClose = questClose;
window._quest = { get S(){ return S; }, get CN(){ return CN; }, step, start, session, pickPhase, choose, next, map, codex, opening, fire, CH, FOES, N, scene, set auto(v){ auto = v; UI.bt = null; ctl(); }, FIX,
  skip(){ for(let n = 0; n < 6; n++){                                              // 결과 띠 → 뒷이야기 → (엔딩) 순서로 끝까지 넘긴다
    if(CN){ const d = CN.done; cineStop(); if(d) d(); }
    else if(S && S.pend){ const f = S.pend; S.pend = null; clearTimeout(tmr); f(); }
    else if(T){ const d = T.done; clearT(); d(); }
    else break; } } };
})();
