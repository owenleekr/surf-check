/* 캐릭터 도트 — school.html(앱)과 surfshare.html이 같이 쓴다.
   예전엔 og/og.html·og/icon.html에 통째로 복사해 뒀는데, 캐릭터를 고치면
   두 곳이 조용히 갈라졌다. 화면은 멀쩡해 보이는데 옛 모습만 나온다 —
   알아채기가 특히 어렵다. 그래서 한 파일로 뺀다.

   쓰는 쪽은 <script src="sprite.js"></script> 를 먼저 읽고,
   canvas 하나에 drawSpr(canvas, avatarRows(profile), avatarTintOf(profile, level)) 하면 된다.
   data-anim 을 붙이면 550ms마다 몸이 1px 움직인다.

   바깥에서 필요한 것: 없음. 이 파일만으로 돈다. */
/* ═══════════ 스프라이트 (문자 = 팔레트 키, . = 투명) ═══════════ */
const PAL = { k:'#1B1B2F', w:'#FFF9E6', s:'#F7C59F', h:'#3A2A1E', r:'#FF6B6B', b:'#2E6BFF', y:'#FFD23F', g:'#4DE1A5', p:'#9B6BFF', o:'#FF9F1C', c:'#8FD3FF', d:'#1A47C9', t:'#E2B96A' };
const SPR = {
  surfer:[ '......kkk.......','.....khhhk......','.....kssske.....','.....ksskk......','......kss.......','....kkrrrkk.....','...krkrrrkrk....','...ks.krr.sk....','......krr.......','.....kbbbk......','....kbbkbbk.....','....kb...bk.....','.yyyyyyyyyyyyyy.','kyyyyyyyyyyyyyyk','.kkkkkkkkkkkkkk.','................'],
  wave:[ '......ww........','....wwcw........','...wccccw.......','..wcccccbw......','.wccccbbbbw.....','wcbbbbbbbbbwwww.','bbbbbbbbbbbbbbbb','dddddddddddddddd'],
  sun:[ '.y....y.','..yyyy..','.yyyyyy.','yyyyyyyy','yyyyyyyy','.yyyyyy.','..yyyy..','.y....y.'],
  flag:[ 'kr......','krrrr...','krrrrrr.','krrrrrr.','krrrr...','kr......','kr......','kr......'],
  star:[ '...yy...','...yy...','.yyyyyy.','..yyyy..','..yyyy..','.yy..yy.','.y....y.','........'],
  stamp:['.rrrrrr.','rrwwwwrr','rwrrrrwr','rwrwwrwr','rwrwwrwr','rwrrrrwr','rrwwwwrr','.rrrrrr.'],
  fire:[ '...o....','..oo.o..','.oooo.o.','.oyooo..','oyyoooo.','oyyyoyo.','.oyyyo..','..ooo...'],
  moon:[ '..yyyy..','.yyy....','yyy.....','yyy.....','yyy.....','yyy.....','.yyy....','..yyyy..'],
  book:[ 'kkkkkkkk','kwwwkwwk','kwwwkwwk','kwwwkwwk','kwwwkwwk','kwwwkwwk','kwwwkwwk','kkkkkkkk'],
  crown:['y......y','yy.yy.yy','yyyyyyyy','yyryyryy','yyyyyyyy','.yyyyyy.','.yyyyyy.','........'],
  map:[ 'gggggggg','gccgggcg','gcccgccg','ggccccgg','gggccggg','ggccccgg','gccggccg','gggggggg'],
  board:['...bb...','..bbbb..','..bwbb..','..bwbb..','..bbbb..','..bbbb..','..bbbb..','...bb...'],
  drop:[ '...k....','..kck...','..kck...','.kcbck..','.kbbbk..','.kbbbk..','..kkk...','........'],
  sunrise:['........','...yy...','..yyyy..','.yyyyyy.','yyyyyyyy','kkkkkkkk','cbcbcbcb','bcbcbcbc'],
  rec:[ '........','.rrrrrr.','.rwwrwr.','.rwrrwr.','.rwwrwr.','.rrrrrr.','........','........'],
  temp:['...rr...','..r..r..','..r..r..','..r..r..','..rrrr..','.rrrrrr.','.rrrrrr.','..rrrr..'],
  wind:['........','.cccc...','....c...','.cccccc.','.......c','.ccccccc','........','........'],
  tide:['........','..pp..pp','.p..pp..','........','..pp..pp','.p..pp..','........','........'],
  clock:['..kkkk..','.k....k.','k...k..k','k...k..k','k..kk..k','k......k','.k....k.','..kkkk..'],
  sprout:['.....g..','..g..g..','..gg.g..','...ggg..','....g...','..kkkkk.','..ktttk.','...kkk..'],
};
/* ═══════════ 캐릭터 (24×24 도트) ═══════════
   레퍼런스대로 머리가 큰 치비 비율 — 머리 12줄 / 몸 8줄 / 보드 4줄.
   멀리서 "누가 누구인지"를 만드는 건 색이 아니라 실루엣이라, 머리 모양 8종은
   길이·폭·삐침이 서로 겹치지 않게 그렸다(스포츠는 이마가 넓고, 장발은 어깨 밖으로 흘러내린다).
   표정은 눈·볼·입 5줄만 갈아끼우는 오버레이라 머리·모자와 독립이다.
   몸은 팔을 옆으로 편 서핑 밸런스 자세 — 덕분에 y15 아래 x0~x7이 비고, 거기에 반려동물이 선다. */
const HEAD = [
  '........kkkkkkkk........',
  '.......kssssssssk.......',
  '......kssssssssssk......',
  '......kssssssssssk......',
  '......kssssssssssk......',
  '......ksswesswessk......',
  '......ksseesseessk......',
  '......kppssssssppk......',
  '......kssskssksssk......',
  '......ksssskkssssk......',
  '.......kssssssssk.......',
  '........kkkkkkkk........',
];
/* 상의는 색만 바꾸면 다 같은 옷이라, 실루엣이 바뀌는 5종으로 나눴다.
   LEGS/ARMS가 아니라 8줄 통째로 두는 편이 읽기 쉬워서 변형마다 전부 적는다. */
const LEGS = ['........kbbbbbbk........','........kbbkkbbk........','........ksk..ksk........','........kkk..kkk........'];
const WEAR = {
  rash: { ko:'래시가드', rows:['...kssrrkrrrrrrkrrssk...','...kkkkkkrrrrrrkkkkkk...','........krrrrrrk........','........krrrrrrk........'].concat(LEGS) },
  hood: { ko:'후디',     rows:['...krrrrkrrrrrrkrrrrk...','...kkkkkkrrrrrrkkkkkk...','........krwrrwrk........','........krkkkkrk........'].concat(LEGS),
          neck:['....krr..........rrk....','....krr..........rrk....'] },
  tank: { ko:'민소매',   rows:['...kssssksrrrrskssssk...','...kkkkkkrrrrrrkkkkkk...','........krrrrrrk........','........krrrrrrk........'].concat(LEGS) },
  suit: { ko:'풀슈트',   rows:['...krrrrkrrrrrrkrrrrk...','...kkkkkkrrrrrrkkkkkk...','........krrrrrrk........','........krrrrrrk........',
                               '........krrrrrrk........','........krrkkrrk........','........krk..krk........','........kkk..kkk........'] },
  bare: { ko:'맨몸',     rows:['...kssssksssssskssssk...','...kkkkkksssssskkkkkk...','........kssssssk........','........kssssssk........'].concat(LEGS) },
};
const WEAR_KO = Object.fromEntries(Object.entries(WEAR).map(([k,v])=>[k,v.ko]));
const BOARD = {
  long: ['.yyyyyyyyyyyyyyyyyyyyyy.','kyyyyyyyyyyyyyyyyyyyyyyk','kyyyyyyyyyyyyyyyyyyyyyyk','.kkkkkkkkkkkkkkkkkkkkkk.'],
  fun:  ['....yyyyyyyyyyyyyyyy....','...kyyyyyyyyyyyyyyyyk...','...kyyyyyyyyyyyyyyyyk...','....kkkkkkkkkkkkkkkk....'],
  short:['.......yyyyyyyyyy.......','......kyyyyyyyyyyk......','......kyyyyyyyyyyk......','.......kkkkkkkkkk.......'],
};
/* 표정 — y5부터 5줄(눈·볼·입)을 통째로 갈아끼운다 */
const FACE = {
  smile:[ '......ksswesswessk......','......ksseesseessk......','......kppssssssppk......','......kssskssksssk......','......ksssskkssssk......'],
  happy:[ '......kssssssssssk......','......ksseesseessk......','......kppssssssppk......','......kssskkkksssk......','......kssskwwksssk......'],
  cool:[  '......kkkkkkkkkkkk......','......kkdddkkdddkk......','......kppssssssppk......','......ksssskkssssk......','......kssssssssssk......'],
  wow:[   '......ksskksskkssk......','......ksseesseessk......','......kppssssssppk......','......ksssskkssssk......','......ksssskkssssk......'],
  wink:[  '......ksswessssssk......','......ksseesseessk......','......kppssssssppk......','......kssskssksssk......','......ksssskkssssk......'],
};
const FACE_KO = { smile:'미소', happy:'신남', cool:'선글라스', wow:'놀람', wink:'윙크' };
/* 머리 — '.'은 아래(맨머리)를 그대로 둔다 */
const HAIR = {
  buzz: ['........................','.......khhhhhhhhk.......','......khhhhhhhhhhk......'],
  short:['........................','.......khhhhhhhhk.......','......khhhhhhhhhhk......','......khhhhhhhhhhk......','......khhhhhhhhhhk......'],
  bob:  ['........................','.......khhhhhhhhk.......','......khhhhhhhhhhk......','......khhhhhhhhhhk......','......khhhhhhhhhhk......','......kh........hk......','.....khh........hhk.....','.....khh........hhk.....','....khhh........hhhk....','....khhh........hhhk....','....kkkk........kkkk....'],
  long: ['........................','.......khhhhhhhhk.......','......khhhhhhhhhhk......','......khhhhhhhhhhk......','......khhhhhhhhhhk......','......kh........hk......','.....khh........hhk.....','.....khh........hhk.....','....khhh........hhhk....','....khhh........hhhk....','...khhh..........hhhk...','...khhh..........hhhk...','...khh............hhk...','...kkk............kkk...'],
  pony: ['........................','.......khhhhhhhhk.......','......khhhhhhhhhhk......','......khhhhhhhhhhkhhk...','......khhhhhhhhhhkhhhk..','.................khhhk..','.................khhhk..','..................khhk..','..................khhk..','...................kkk..'],
  twin: ['........................','.......khhhhhhhhk.......','......khhhhhhhhhhk......','.khhhkkhhhhhhhhhhkkhhhk.','.khhhkkhhhhhhhhhhkkhhhk.','.khhhk............khhhk.','.khhhk............khhhk.','.khhhk............khhhk.','.kkkkk............kkkkk.'],
  wave: ['......kkkkkkkkkkkk......','.....khhhhhhhhhhhhk.....','....khhhhhhhhhhhhhhk....','....khhhh......hhhhk....','...khhhh........hhhhk...','...khhh..........hhhk...','....khh..........hhk....','....khhh........hhhk....','.....khh........hhk.....','.....kkk........kkk.....'],
  surf: ['.....khhk.khhk.khhk.....','.....khhhhhhhhhhhhhk....','....khhhhhhhhhhhhhhhk...','....khhhhhhhhhhhhhhk....','.....khhhhhhhhhhhhk.....','.....khh........hhk.....','......kh........hk......'],
};
const HAIR_KO = { buzz:'스포츠', short:'짧은머리', bob:'단발', long:'장발', pony:'포니테일', twin:'양갈래', wave:'웨이브', surf:'서퍼컷' };
const HAIRC = { k:'#2B2118', n:'#6B4A2F', y:'#E8C46A', r:'#C4522F', b:'#3C6BB0', p:'#D96BA8', g:'#3FA36B', w:'#EDE7DC' };
const HAIRC_KO = { k:'검정', n:'갈색', y:'금발', r:'적갈', b:'블루', p:'핑크', g:'그린', w:'백발' };
const SKIN = { l:'#FFE0C2', s:'#F7C59F', d:'#D89A6A', t:'#A9693C' };
const SKIN_KO = { l:'밝게', s:'보통', d:'그을림', t:'진하게' };
const HAT = {
  none:null,
  bucket:['.......kttttttttk.......','......kttttttttttk......','...kttttttttttttttttk...','...kkkkkkkkkkkkkkkkkk...'],
  cap:   ['.......kqqqqqqqqk.......','......kqqqqqqqqqqk......','......kqqqqqqqqqqkqqqqk.','......kkkkkkkkkkkkkkkkk.'],
  visor: ['........................','........................','...kwwwwwwwwwwwwwwwwk...','...kkkkkkkkkkkkkkkkkk...'],
  beanie:['.......kqqqqqqqqk.......','......kqqqqqqqqqqk......','......kqqqqqqqqqqk......','......kwwwwwwwwwwk......','......kkkkkkkkkkkk......'],
};
const HAT_KO = { none:'없음', bucket:'서프햇', cap:'캡', visor:'바이저', beanie:'비니' };
const VEST = ['.........oooooo.........','.........oooooo.........','.........owwwwo.........','.........oooooo.........'];
/* 반려동물 — 14×11 앞모습, 앉은 자세.
   옆모습을 두 번 시도했는데 둘 다 실패했다. 14칸에 머리·몸·다리·꼬리를 옆으로 늘어놓으면
   한 부위가 2~3칸씩밖에 안 되고, 마을 크기(84px)에선 전부 덩어리로 뭉친다.
   유일하게 잘 읽히던 게 펭귄이었고 이유는 명확했다 — 앞모습 · 좌우대칭 · 흰 배로 색이 갈린다.
   그 규칙을 다섯 마리 전부에 적용했다: 귀 모양으로 종을 가르고, 흰 주둥이/배로 면을 나눈다.
   n = 고른 색, m = 그 색을 0.7로 깎은 톤(귀·꼬리를 몸에서 떼는 용도). */
const PET = {
  none:null,
  dog: [            // 늘어진 귀가 얼굴 옆으로 · 흰 주둥이 · 검은 코 · 혀
    '..mm......mm..',
    '.kmmk....kmmk.',
    '.kmmkkkkkkmmk.',
    '.kmmnnnnnnmmk.',
    '.kmneenneenmk.',
    '.kmwwwwwwwwmk.',
    '.kmwwwkkwwwmk.',
    '.kkmwwqqwwmkk.',
    '..knnnnnnnnk..',
    '..knnnnnnnnk..',
    '..kkk....kkk..'],
  cat: [            // 뾰족한 귀 두 짝 · 수염 · 옆으로 말린 꼬리
    '..m........m..',
    '..mm......mm..',
    '.kmmmkkkkmmmk.',
    '.knnnnnnnnnnk.',
    '.knneenneennk.',
    '.knnwwwwwwnnk.',
    '.knnwwkkwwnnk.',
    'w.knnnnnnnnk.w',
    '..knnnnnnnnk..',
    '..knnnnnnnnkmm',
    '..kkk....kkkmk'],
  rabbit: [         // 길게 선 귀 · 앞니 · 동그란 꼬리
    '...mm..mm.....',
    '..kmmk.kmmk...',
    '..kmmk.kmmk...',
    '..kkmkkkmkk...',
    '.knnnnnnnnnk..',
    '.knneenneenk..',
    '.knnnwwwwnnk..',
    '.kknwwkkwwnkk.',
    '..knnwwwwnnk..',
    'mmknnnnnnnnk..',
    'mkkkk....kkk..'],
  penguin: [        // 서 있는 몸 · 흰 배 · 부리 · 오렌지 발
    '.....kkkk.....',
    '....knnnnk....',
    '...knnennnkoo.',
    '...knnnnnnnk..',
    '..kmnwwwwnmk..',
    '..kmnwwwwnmk..',
    '..kmnwwwwnmk..',
    '..kmnwwwwnmk..',
    '...knwwwwnk...',
    '....kkkkkk....',
    '...koo.ook....'],
  seal: [           // 귀 없이 둥근 머리 · 수염 · 옆으로 벌린 지느러미
    '....kkkkkk....',
    '...knnnnnnk...',
    '..knnnnnnnnk..',
    '..knneenneek..',
    '..knnwwwwnnk..',
    '..knwwkkwwnk..',
    'w.knnwwwwnnk.w',
    '..knnnnnnnnk..',
    '.mknnnnnnnnkm.',
    'mmknnnnnnnnkmm',
    '.mkkkk..kkkkm.'],
};
const PETBOARD = ['..wwwwwwwwww..','.kwwwwwwwwwwk.','.kwwwwwwwwwwk.','..kkkkkkkkkk..'];
/* 친밀도 표식 — 도안마다 눈·목 자리가 달라 동물별로 [줄번호, 14칸 마스크]를 들고 있는다.
   '.'은 그대로 두고 나머지만 덮어쓴다. 선글라스는 렌즈-다리-렌즈(ddkkdd)를 통째로 얹는다 —
   좌표 하나에 2칸만 찍으면 한쪽 눈만 가려져 안대가 된다. */
const PET_ACC = {
  dog:     { blush:[4,'...p......p...'], scarf:[8,'.....qqqq.....'], shades:[4,'....ddkkdd....'] },
  cat:     { blush:[4,'...p......p...'], scarf:[8,'.....qqqq.....'], shades:[4,'....ddkkdd....'] },
  rabbit:  { blush:[5,'...p......p...'], scarf:[9,'.....qqqq.....'], shades:[5,'....ddkkdd....'] },
  penguin: { blush:[2,'....p....p....'], scarf:[3,'.....qqqq.....'], shades:[2,'....dddd......'] },
  seal:    { blush:[4,'...p......p...'], scarf:[7,'.....qqqq.....'], shades:[3,'.....ddkkdd...'] },
};
function petDress(rows, kind, lv){
  const A = PET_ACC[kind]; if(!A || !lv) return rows;
  let out = rows.slice();
  const put = a => { if(a) out = overlay(out, [a[1]], a[0]); };
  if(lv>=1) put(A.blush);
  if(lv>=2) put(A.scarf);
  if(lv>=3) put(A.shades);
  return out;
}
const PET_STAGE = [ { at:0, ko:'처음 만남', un:'' }, { at:25, ko:'친해지는 중', un:'볼터치' }, { at:55, ko:'단짝', un:'리본' }, { at:90, ko:'베스트 버디', un:'선글라스' } ];
const petStageOf = b => PET_STAGE.reduce((n,st,i)=> b>=st.at ? i : n, 0);
const PET_KO = { none:'없음', rabbit:'토끼', cat:'고양이', dog:'강아지', seal:'물개', penguin:'펭귄' };
const PETC = { p:'#FFB3D1', y:'#FFE0A0', w:'#F2F5F8', n:'#C98A5B', g:'#A8F0D8', k:'#6E687F' };
const PETC_KO = { p:'핑크', y:'크림', w:'화이트', n:'브라운', g:'민트', k:'그레이' };
const TOPS = { r:'#FF6B6B', b:'#2E6BFF', g:'#4DE1A5', p:'#9B6BFF', y:'#FFD23F', k:'#1B1B2F', w:'#FFFFFF', o:'#FF9F1C' };
const TOP_KO = { r:'코랄', b:'블루', g:'민트', p:'퍼플', y:'옐로', k:'블랙', w:'화이트', o:'오렌지' };
const COACH_BADGES = ['교장','헤드코치','코치','강사','매니저','라이프가드','촬영','조교'];
/* badge 는 프로필에 적힌 글자 — 남의 것이 그대로 HTML 에 들어오므로 이스케이프한다 */
const _escTag = t => String(t == null ? '' : t).replace(/[<>&"']/g, c=>({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&#39;' }[c]));
const roleTag = pr => pr?.role==='coach' ? `<span class="tagc">${_escTag(pr.badge||'코치')}</span>` : pr?.cls==='inter' ? '<span class="tagc" style="background:var(--sea)">중급</span>' : pr?.cls ? '<span class="tagc" style="background:var(--mint);color:var(--ink)">비기너</span>' : '';
function overlay(rows, ov, y0){ rows = rows.slice(); ov.forEach((r,i)=>{ const y=y0+i; if(!rows[y]) return; rows[y] = [...rows[y]].map((c,x)=> r[x] && r[x]!=='.' ? r[x] : c).join(''); }); return rows; }
/* 예전 계정엔 gender만 있다 → 남자 짧은머리 / 여자 단발로 이어받는다 */
const hairOf = pr => HAIR[pr.hair] ? pr.hair : (pr.gender==='m' ? 'short' : 'bob');
/* 아직 아무도 캐릭터를 안 꾸민 첫 주에 마을이 똑같은 사람 20명으로 보이면
   "캐릭터별 차이"가 애초에 안 생긴다. 이름에서 고정 해시를 뽑아 기본 모습을 흩어 둔다
   — 같은 이름은 어느 기기에서 열어도 같은 모습이고, 본인이 고르면 그게 이긴다. */
const hashN = s => { let h = 7; for(const c of String(s||'')) h = (h*131 + c.charCodeAt(0)) >>> 0; return h; };
const LOOK_M = ['short','buzz','surf','wave'], LOOK_F = ['bob','long','pony','twin','wave','short'];
function withLook(pr, name){
  pr = pr || {}; if(pr.hair && pr.hairc) return pr;
  const h = hashN(name), ck = Object.keys(HAIRC), bk = Object.keys(BOARDC), sk = Object.keys(SKIN);
  const set = pr.gender==='m' ? LOOK_M : LOOK_F;
  return { ...pr,
    hair:   pr.hair   || set[h % set.length],
    hairc:  pr.hairc  || ck[(h >>> 3) % ck.length],
    skin:   pr.skin   || sk[(h >>> 6) % 3],
    wear:   pr.wear   || ['rash','hood','tank','rash','suit'][(h >>> 12) % 5],
    boardc: pr.boardc || bk[(h >>> 9) % bk.length] };
}
/* withPet=false — 헤더·채팅처럼 40px 안팎으로 작게 그리는 자리에서는 펫을 빼서
   서퍼가 화면의 2/3로 쪼그라드는 걸 막는다 */
function avatarRows(pr, withPet){
  pr = pr || {};
  const w = WEAR[pr.wear] || WEAR.rash;
  let rows = HEAD.concat(w.rows, BOARD[pr.board] || BOARD.long);
  if(w.neck) rows = overlay(rows, w.neck, 10);            // 후드가 목 뒤로 보이게
  rows = overlay(rows, FACE[pr.face] || FACE.smile, 5);
  rows = overlay(rows, HAIR[hairOf(pr)], 0);
  if(pr.role==='coach' && pr.vest!==false) rows = overlay(rows, VEST, 12);
  if(HAT[pr.hat]) rows = overlay(rows, HAT[pr.hat], 0);
  if(withPet===false || !PET[pr.pet]) return rows;
  const body = petDress(PET[pr.pet], pr.pet, pr.petLv||0);
  const pet = body.concat(PETBOARD), blank = '.'.repeat(14);
  return rows.map((r,y)=> (y>=9 ? pet[y-9] : blank) + r);     // 38×24 — 펫이 옆에서 같이 달리는 한 장면
}
const SLV_COLORS = ['#FFD23F','#A6F542','#4DE1A5','#2ED3E6','#2E6BFF','#9B6BFF','#FF6B6B','#FF9F1C','#F7C59F','#FFFFFF','#1B1B2F'];   // 서핑 LV.0~10 보드 색
const BOTTOMS = { b:'#2E6BFF', k:'#1B1B2F', r:'#FF6B6B', g:'#4DE1A5', p:'#9B6BFF', t:'#E2B96A' };
const BOTTOM_KO = { b:'블루', k:'블랙', r:'코랄', g:'민트', p:'퍼플', t:'베이지' };
const BOARDC = { y:'#FFD23F', w:'#FFFFFF', c:'#8FD3FF', g:'#A6F542', p:'#FF9BD2', o:'#FF9F1C' };
const BOARDC_KO = { y:'옐로', w:'화이트', c:'하늘', g:'라임', p:'핑크', o:'오렌지' };
/* 귀·꼬리·무늬를 몸에서 떼어내려면 두 번째 톤이 필요하다. 고른 색에서 바로 깎아 쓴다 */
const shade = (hex, f) => '#' + (hex||'#FFE0A0').slice(1).replace(/^(.)(.)(.)$/,'$1$1$2$2$3$3').match(/../g).map(h=>Math.max(0,Math.min(255,Math.round(parseInt(h,16)*f))).toString(16).padStart(2,'0')).join('');
const avatarTintOf = (pr, L) => ({
  k:'#1B1B2F', s: SKIN[pr?.skin] || SKIN.s, h: HAIRC[pr?.hairc] || HAIRC.k,
  e:'#2A2438', w:'#FFFFFF', p:'#FF9BB3', d:'#1A47C9', o:'#FF9F1C',
  q:'#FF4B4B', t:'#F7DC8F', n: PETC[pr?.petc] || PETC.y, m: shade(PETC[pr?.petc] || PETC.y, 0.7),
  b: BOTTOMS[pr?.bottom] || BOTTOMS.b, y: BOARDC[pr?.boardc] || BOARDC.y, r: TOPS[pr?.top] || TOPS.r,
});
let frame = 0; setInterval(()=>{ frame ^= 1; document.querySelectorAll('canvas[data-anim]').forEach(c=>{ if(c._rows) paint(c, c._rows, c._tint, frame); }); }, 550);
function paint(cv, rows, tint, f){
  const W = rows[0].length, H = rows.length, anim = cv.dataset.anim!=null, pad = anim ? 1 : 0;
  cv.width = W + pad*2; cv.height = H + pad*2;
  /* 펫이 있으면 장면이 36칸으로 넓어진다 — CSS는 정사각으로 잡혀 있으므로 높이 기준으로 폭을 다시 준다.
     (안 그러면 캐릭터가 가로로 눌려 보인다) */
  const ch = cv.clientHeight; if(ch) cv.style.width = Math.round(ch * cv.width / cv.height) + 'px';
  const g = cv.getContext('2d'); g.clearRect(0,0,cv.width,cv.height);
  const bob = anim && f ? 1 : 0;                                   // 몸만 1px 위아래, 보드(마지막 3줄)는 고정
  const px = [];                                                   // [x,y,ch] 최종 좌표
  rows.forEach((r,y)=>[...r].forEach((ch,x)=>{ if(ch!=='.') px.push([x+pad, y+pad-(y>=H-4?0:bob), ch]); }));
  if(anim){
    g.fillStyle = 'rgba(27,27,47,.18)'; g.fillRect(pad+2, H+pad-2, W-4, 1);          // 보드 그림자
    const occ = new Set(px.map(([x,y])=>x+','+y)); g.fillStyle = 'rgba(255,255,255,.6)';
    px.forEach(([x,y])=>[[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{ if(!occ.has((x+dx)+','+(y+dy))) g.fillRect(x+dx,y+dy,1,1); }));
  }
  px.forEach(([x,y,ch])=>{ g.fillStyle = (tint&&tint[ch])||PAL[ch]||ch; g.fillRect(x,y,1,1); });
}
function drawSpr(cv, name, tint){
  const rows = Array.isArray(name) ? name : SPR[name]; if(!rows||!cv) return;
  cv._rows = rows; cv._tint = tint; paint(cv, rows, tint, frame);
}
function paintAll(root=document){ root.querySelectorAll('canvas[data-spr]').forEach(c=>drawSpr(c, c.dataset.spr)); }
