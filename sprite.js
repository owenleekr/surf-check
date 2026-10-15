/* 캐릭터 도트 — school.html(앱)과 surfshare.html이 같이 쓴다.
   예전엔 og/og.html·og/icon.html에 통째로 복사해 뒀는데, 캐릭터를 고치면
   두 곳이 조용히 갈라졌다. 화면은 멀쩡해 보이는데 옛 모습만 나온다 —
   알아채기가 특히 어렵다. 그래서 한 파일로 뺀다.

   쓰는 쪽은 <script src="sprite.js"></script> 를 먼저 읽고,
   canvas 하나에 drawSpr(canvas, avatarRows(profile), avatarTintOf(profile, level)) 하면 된다.
   data-anim 을 붙이면 550ms마다 몸이 1px 움직인다.

   바깥에서 필요한 것: 없음. 이 파일만으로 돈다. */
/* ═══════════ 스프라이트 (문자 = 팔레트 키, . = 투명) ═══════════ */
const PAL = { S:'#7A4F35', H:'#3A2A1E', R:'#9A2F2F', B:'#14308F', Y:'#8A6B10', T:'#8A6F3A', Q:'#992D2D', O:'#99600F', G:'#1F7A5A', C:'#4A7FA3', k:'#1B1B2F', w:'#FFF9E6', s:'#F7C59F', h:'#3A2A1E', r:'#FF6B6B', b:'#2E6BFF', y:'#FFD23F', g:'#4DE1A5', p:'#9B6BFF', o:'#FF9F1C', c:'#8FD3FF', d:'#1A47C9', t:'#E2B96A' };
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
  '......kssssssssssk......',
  '......kssssssssssk......',
  '......kssssssssssk......',
  '.....kssssssssssssk.....',
  '.....kssssssssssssk.....',
  '......kssssssssssk......',
  '........kkkkkkkk........',
];
/* 상의는 색만 바꾸면 다 같은 옷이라, 실루엣이 바뀌는 5종으로 나눴다.
   LEGS/ARMS가 아니라 8줄 통째로 두는 편이 읽기 쉬워서 변형마다 전부 적는다. */
const LEGS = ['........kbbbbbbk........','........kbbkkbbk........','........ksk..ksk........','........kkk..kkk........'];
const WEAR = {
  rash: { ko:'래시가드', rows:['.....krrkrrrrrrkrrk.....','...ksskkkrrrrrrkkkssk...','...kkkk.krrrrrrk.kkkk...','........krrrrrrk........'].concat(LEGS) },
  hood: { ko:'후디',     rows:['.....krrkrwrrwrkrrk.....','...krrkkkrwrrwrkkkrrk...','...kkkk.krrrrrrk.kkkk...','........kRRRRRRk........'].concat(LEGS),   // 가슴 무늬가 얼굴처럼 읽혀서 끈 두 줄 + 밑단으로
          neck:['....krr..........rrk....','....krr..........rrk....'] },
  tank: { ko:'민소매',   rows:['.....kssksrrrrskssk.....','...ksskkkrrrrrrkkkssk...','...kkkk.krrrrrrk.kkkk...','........krrrrrrk........'].concat(LEGS) },
  suit: { ko:'풀슈트',   rows:['.....krrkrrrrrrkrrk.....','...krrkkkrrrrrrkkkrrk...','...kkkk.krrrrrrk.kkkk...','........krrrrrrk........',
                               '........krrrrrrk........','........krrkkrrk........','........krk..krk........','........kkk..kkk........'] },
  bare: { ko:'맨몸',     rows:['.....kssksssssskssk.....','...ksskkksssssskkkssk...','...kkkk.kssssssk.kkkk...','........kssssssk........'].concat(LEGS) },
};
const WEAR_KO = Object.fromEntries(Object.entries(WEAR).map(([k,v])=>[k,v.ko]));
const BOARD = {
  long: ['.yyyyyyyyyyyyyyyyyyyyyy.','kyyyyyyyyyyyyyyyyyyyyyyk','kyyyyyyyyyyyyyyyyyyyyyyk','.kkkkkkkkkkkkkkkkkkkkkk.'],
  fun:  ['....yyyyyyyyyyyyyyyy....','...kyyyyyyyyyyyyyyyyk...','...kyyyyyyyyyyyyyyyyk...','....kkkkkkkkkkkkkkkk....'],
  short:['.......yyyyyyyyyy.......','......kyyyyyyyyyyk......','......kyyyyyyyyyyk......','.......kkkkkkkkkk.......'],
};
/* 표정 — y5부터 5줄(눈·볼·입)을 통째로 갈아끼운다 */
/* 표정 — 요즘 캐릭터(망그러진 곰·잔망루피·앙코)처럼 '낮게 붙은 점 눈 + 작은 입 + 볼터치'만. 눈이 크고 진하면 무섭고 늙어 보였다.
   '.' 은 아래(얼굴 살)를 그대로 둔다 — 머리 모양이 바뀌어도 테두리를 덮지 않는다. */
const FACE = {
  smile:[ '........................','........................','.........e....e.........','.......ppe....epp.......','...........ee...........' ],
  happy:[ '........................','........................','.........e....e.........','.......pe.e..e.ep.......','..........eqqe..........' ],
  cool:[ '........................','........................','.......kkkkkkkkkk.......','.......kdddkkdddk.......','.......p...ee...p.......' ],
  wow:[ '........................','........................','.........e....e.........','.......ppe....epp.......','...........qq...........' ],
  wink:[ '........................','........................','.........e..............','.......ppe...eeep.......','...........ee...........' ],
  sleepy:[ '........................','........................','........................','.......pee....eep.......','...........ee...........' ],
};
const FACE_KO = { smile:'미소', happy:'신남', cool:'선글라스', wow:'놀람', wink:'윙크', sleepy:'졸림' };
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
/* 외곽선을 전부 같은 검정으로 두면 캐릭터가 '도장 찍은 스티커'처럼 뻣뻣해 보인다(실제로 못생겼다는 말이 많았다).
   닿아 있는 색의 어두운 톤으로 바꾼다 — 피부 옆은 진한 살색, 머리카락 옆은 진한 머리색, 옷·보드도 같다.
   (픽셀아트의 '선택적 외곽선'이다.) 어느 색 옆인지는 네 이웃을 먼저, 없으면 대각선을 본다. 눈동자·안경 같은 'e'·'d' 는 건드리지 않는다. */
const SOFT = { h:'H', r:'R', q:'Q', o:'O', g:'G', c:'C', t:'T', b:'B', y:'Y', s:'S' }, SOFT_ORDER = ['h','r','q','o','g','c','t','b','y','s'];
function softOutline(rows){
  const at = (x,y)=> (y >= 0 && y < rows.length && x >= 0 && x < rows[y].length) ? rows[y][x] : '.';
  return rows.map((r,y)=>[...r].map((ch,x)=>{
    if(ch !== 'k') return ch;
    if(y >= 5 && y <= 9 && x >= 7 && x <= 16) return ch;          // 얼굴 안쪽(입·눈썹)은 선명한 어두운 색 그대로 — 살색 톤으로 번지면 입이 코처럼 보인다
    for(const set of [[at(x,y-1),at(x,y+1),at(x-1,y),at(x+1,y)], [at(x-1,y-1),at(x+1,y-1),at(x-1,y+1),at(x+1,y+1)]])
      for(const c of SOFT_ORDER) if(set.includes(c)) return SOFT[c];
    return 'k'; }).join(''));
}
function avatarRows(pr, withPet){
  pr = pr || {};
  const w = WEAR[pr.wear] || WEAR.rash;
  let rows = HEAD.concat(w.rows, BOARD[pr.board] || BOARD.long);
  if(w.neck) rows = overlay(rows, w.neck, 10);            // 후드가 목 뒤로 보이게
  rows = overlay(rows, FACE[pr.face] || FACE.smile, 5);
  rows = overlay(rows, HAIR[hairOf(pr)], 0);
  if(pr.role==='coach' && pr.vest!==false) rows = overlay(rows, VEST, 12);
  if(HAT[pr.hat]) rows = overlay(rows, HAT[pr.hat], 0);
  /* 보드 무늬(서프쉐어 조개 상점, play.js 가 BPAT 을 정의) — 보드 색 칸 위에만 칠한다(보드 모양이 달라도 밖으로 안 샌다) */
  if(typeof BPAT === 'object' && BPAT[pr.bpat]){ const y0 = rows.length - 4;
    rows = rows.map((r,y)=>{ const pt = BPAT[pr.bpat][y - y0]; return pt ? [...r].map((c,x)=> c === 'y' && pt[x] && pt[x] !== '.' ? pt[x] : c).join('') : r; }); }
  rows = softOutline(rows);
  const tag = (o, pet)=>{ o._pr = pr; o._pet = pet; return o; };    // 벡터로 다시 그릴 때 쓰는 고르기 값(paint → paintVec)
  if(withPet===false || !PET[pr.pet]) return tag(rows, false);
  const body = petDress(PET[pr.pet], pr.pet, pr.petLv||0);
  const pet = body.concat(PETBOARD), blank = '.'.repeat(14);
  return tag(rows.map((r,y)=> (y>=9 ? pet[y-9] : blank) + r), true);     // 38×24 — 펫이 옆에서 같이 달리는 한 장면
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
  // 부드러운 외곽선 — 각 색의 어두운 톤 (softOutline)
  S: shade(SKIN[pr?.skin] || SKIN.s, .6), H: shade(HAIRC[pr?.hairc] || HAIRC.k, .55), R: shade(TOPS[pr?.top] || TOPS.r, .55),
  B: shade(BOTTOMS[pr?.bottom] || BOTTOMS.b, .55), Y: shade(BOARDC[pr?.boardc] || BOARDC.y, .55), T: shade('#F7DC8F', .6),
  Q: shade('#FF4B4B', .6), O: shade('#FF9F1C', .6), G: shade('#4DE1A5', .6), C: shade('#8FD3FF', .6),
});
let frame = 0; setInterval(()=>{ frame ^= 1; document.querySelectorAll('canvas[data-anim]').forEach(c=>{ if(c._rows) paint(c, c._rows, c._tint, frame); }); }, 550);
/* 부드러운 확대 — 24칸 도트를 크게 띄우면 계단이 도드라져 조잡해 보였다("너무 도트라 이상하다").
   크게 보이는 자리에서는 Scale2x(EPX)를 두 번 돌려 4배로 그린다 — 대각선·둥근 머리가 매끈하게 이어져 미니미처럼 보인다.
   작게 쓰는 자리(채팅 머리 등)·화면에 안 붙은 캔버스(게임이 1:1 로 가져다 그린다)·data-raw 는 예전 그대로. */
const _rgba = {};
function rgbaOf(c){
  if(_rgba[c] != null) return _rgba[c];
  let r = 0, g = 0, b = 0, a = 255, m;
  if((m = /^#([0-9a-f]{6})$/i.exec(c))){ const n = parseInt(m[1], 16); r = n >> 16 & 255; g = n >> 8 & 255; b = n & 255; }
  else if((m = /^#([0-9a-f]{3})$/i.exec(c))){ const h = m[1]; r = parseInt(h[0] + h[0], 16); g = parseInt(h[1] + h[1], 16); b = parseInt(h[2] + h[2], 16); }
  else if((m = /^rgba?\(([^)]+)\)$/i.exec(c))){ const v = m[1].split(',').map(Number); [r, g, b] = v; a = Math.round((v[3] == null ? 1 : v[3]) * 255); }
  return (_rgba[c] = ((a << 24) | (b << 16) | (g << 8) | r) >>> 0);        // ImageData 를 Uint32 로 볼 때의 순서(리틀엔디언)
}
function epx(src, w, h){
  const out = new Uint32Array(w * h * 4), W2 = w * 2, at = (x, y)=>src[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))];
  for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){
    const P = src[y * w + x], A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
    const o = y * 2 * W2 + x * 2;
    out[o]          = (C === A && C !== D && A !== B) ? A : P;
    out[o + 1]      = (A === B && A !== C && B !== D) ? B : P;
    out[o + W2]     = (D === C && D !== B && C !== A) ? C : P;
    out[o + W2 + 1] = (B === D && B !== A && D !== C) ? D : P;
  }
  return out;
}
function paint(cv, rows, tint, f){
  if(rows && rows._pr && cv.isConnected && cv.dataset.raw == null && cv.clientHeight >= 22 && typeof cv.getContext === 'function'){
    if(typeof window.mochiSVG === 'function'){ paintMochi(cv, rows, f); return; }
    paintVec(cv, rows, tint, f); return; }
  /* 숨은 탭에서 그려지면 높이가 0이라 도트로 남았다(홈 프로필) — 보이게 되는 순간 다시 그린다 */
  if(rows && rows._pr && cv.isConnected && cv.dataset.raw == null && !cv.clientHeight && !cv._ro && typeof ResizeObserver === 'function'){
    cv._ro = new ResizeObserver(()=>{ if(cv.clientHeight && cv._rows){ cv._ro.disconnect(); cv._ro = null; paint(cv, cv._rows, cv._tint, frame); } }); cv._ro.observe(cv); }
  const W = rows[0].length, H = rows.length, anim = cv.dataset.anim!=null, pad = anim ? 1 : 0;
  const ch = cv.clientHeight, hq = cv.isConnected && cv.dataset.raw == null && ch >= (H + pad*2) * 1.6, K = hq ? 4 : 1;
  cv.width = (W + pad*2) * K; cv.height = (H + pad*2) * K;
  /* 펫이 있으면 장면이 36칸으로 넓어진다 — CSS는 정사각으로 잡혀 있으므로 높이 기준으로 폭을 다시 준다.
     (안 그러면 캐릭터가 가로로 눌려 보인다) */
  if(ch) cv.style.width = Math.round(ch * cv.width / cv.height) + 'px';
  const g = cv.getContext('2d'); g.clearRect(0,0,cv.width,cv.height);
  const bob = anim && f ? 1 : 0;                                   // 몸만 1px 위아래, 보드(마지막 3줄)는 고정
  const px = [];                                                   // [x,y,ch] 최종 좌표
  rows.forEach((r,y)=>[...r].forEach((ch,x)=>{ if(ch!=='.') px.push([x+pad, y+pad-(y>=H-4?0:bob), ch]); }));
  const cw = W + pad*2, chh = H + pad*2;
  if(!hq){
    if(anim){
      g.fillStyle = 'rgba(27,27,47,.18)'; g.fillRect(pad+2, H+pad-2, W-4, 1);          // 보드 그림자
      const occ = new Set(px.map(([x,y])=>x+','+y)); g.fillStyle = 'rgba(255,255,255,.6)';
      px.forEach(([x,y])=>[[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{ if(!occ.has((x+dx)+','+(y+dy))) g.fillRect(x+dx,y+dy,1,1); }));
    }
    px.forEach(([x,y,ch])=>{ g.fillStyle = (tint&&tint[ch])||PAL[ch]||ch; g.fillRect(x,y,1,1); });
    return;
  }
  const key = f + '|' + cw + 'x' + chh;
  if(cv._hqRows !== rows || cv._hqTint !== tint){ cv._hqRows = rows; cv._hqTint = tint; cv._hq = {}; }
  let img = cv._hq[key];
  if(!img){
    let grid = new Uint32Array(cw * chh);
    const put = (x, y, c)=>{ if(x >= 0 && y >= 0 && x < cw && y < chh) grid[y * cw + x] = rgbaOf(c); };
    if(anim){
      for(let x = pad + 2; x < pad + W - 2; x++) put(x, H + pad - 2, 'rgba(27,27,47,.18)');
      const occ = new Set(px.map(([x,y])=>x+','+y));
      px.forEach(([x,y])=>[[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{ if(!occ.has((x+dx)+','+(y+dy))) put(x+dx, y+dy, 'rgba(255,255,255,.6)'); }));
    }
    px.forEach(([x,y,c])=>put(x, y, (tint&&tint[c])||PAL[c]||c));
    grid = epx(epx(grid, cw, chh), cw * 2, chh * 2);
    img = new ImageData(new Uint8ClampedArray(grid.buffer), cw * 4, chh * 4);
    cv._hq[key] = img;
  }
  g.putImageData(img, 0, 0);
}
function drawSpr(cv, name, tint){
  const rows = Array.isArray(name) ? name : SPR[name]; if(!rows||!cv) return;
  cv._rows = rows; cv._tint = tint; paint(cv, rows, tint, frame);
}
function paintAll(root=document){ root.querySelectorAll('canvas[data-spr]').forEach(c=>drawSpr(c, c.dataset.spr)); }

/* ═══════════ 벡터 캐릭터 ═══════════
   24칸 도트를 아무리 다듬어도 크게 띄우면 머리가 헬멧, 몸이 상자로 읽혔다("캐릭터가 못생겼다").
   크게 보이는 자리(프로필·마을·꾸미기)는 같은 고르기 값(머리·표정·옷·모자·색·펫)을 둥근 도형으로 다시 그린다.
   좌표는 도트와 같은 24칸 격자 단위 — 머리 6.4 반지름의 큰 치비 비율, 팔을 벌린 서핑 자세.
   게임처럼 화면에 안 붙은 캔버스·data-raw·아주 작은 자리는 도트 그대로(avatarRows 의 rows 를 그대로 쓴다). */
const _VEC_HAIR = {      // [옆머리 내려오는 높이, 앞머리 선(오른쪽→왼쪽)]
  buzz: [5.2, [[16.6,3.9],[12,3.2],[7.4,3.9]]],
  short:[7.6, [[17.7,6.6],[15.6,5.1],[13.2,5.9],[11.4,4.5],[8.8,5.6],[6.4,6.8]]],
  bob:  [10.6,[[17.5,9],[16.8,5.9],[12,6.2],[7.2,5.9],[6.5,9]]],
  long: [10.6,[[17.6,9.6],[16.4,5.6],[13.3,4.7],[12,4.1],[10.7,4.7],[7.6,5.6],[6.4,9.6]]],
  pony: [8.4, [[17.7,7.6],[16,5.1],[12.4,4.5],[8.8,5.8],[6.5,7.8]]],
  twin: [8.6, [[17.5,7.8],[16.5,5.9],[12,6.1],[7.5,5.9],[6.5,7.8]]],
  wave: [9.8, [[17.7,9],[16.7,6.4],[15.1,5.3],[13.6,6.2],[12,5.1],[10.4,6.2],[8.9,5.3],[7.3,6.4],[6.3,9]]],
  surf: [7.2, [[17.7,6.8],[16.4,5.3],[15.2,6.4],[14,4.7],[12.6,6],[11.2,4.5],[9.8,5.8],[8.4,4.8],[6.5,6.8]]],
};
function _vRR(g, x, y, w, h, r){
  const R = Array.isArray(r) ? r : [r, r, r, r];
  g.beginPath(); g.moveTo(x + R[0], y); g.lineTo(x + w - R[1], y); g.quadraticCurveTo(x + w, y, x + w, y + R[1]);
  g.lineTo(x + w, y + h - R[2]); g.quadraticCurveTo(x + w, y + h, x + w - R[2], y + h); g.lineTo(x + R[3], y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - R[3]); g.lineTo(x, y + R[0]); g.quadraticCurveTo(x, y, x + R[0], y); g.closePath();
}
function _vEl(g, x, y, rx, ry, rot){ g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); }
function _vFS(g, c, lw){ g.fillStyle = c; g.fill(); if(lw !== 0){ g.strokeStyle = shade(c, .58); g.lineWidth = lw || .34; g.stroke(); } }
function _vSmooth(g, pts){ g.lineTo(pts[0][0], pts[0][1]);
  for(let i = 1; i < pts.length - 1; i++){ const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; g.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
  const z = pts[pts.length - 1]; g.lineTo(z[0], z[1]); }
const _vHex = c => /^#[0-9a-f]{6}$/i.test(c) ? c : /^#[0-9a-f]{3}$/i.test(c) ? c : '#888888';
function _vHairBack(g, kind, H){
  if(kind === 'bob'){ _vRR(g, 5.1, 2, 13.8, 10.3, [6.4, 6.4, 2.2, 2.2]); _vFS(g, H); }
  else if(kind === 'long'){ _vRR(g, 4.7, 2, 14.6, 13.9, [6.7, 6.7, 2.6, 2.6]); _vFS(g, H); }
  else if(kind === 'wave'){ _vRR(g, 4.9, 2, 14.2, 9.4, [6.6, 6.6, 2, 2]); _vFS(g, H, 0);
    [[5.5,10.4],[7.2,11.6],[16.8,11.6],[18.5,10.4],[5,8.2],[19,8.2]].forEach(([x,y])=>{ _vEl(g, x, y, 1.55, 1.55); _vFS(g, H); });
    _vRR(g, 5.6, 2.6, 12.8, 8.4, 6); g.fillStyle = H; g.fill(); }
  else if(kind === 'twin'){ [[4.1,10.8,.25],[19.9,10.8,-.25]].forEach(([x,y,r])=>{ _vEl(g, x, y, 1.8, 3.2, r); _vFS(g, H); }); }
  else if(kind === 'pony'){ _vEl(g, 18.9, 10, 1.9, 3.8, -.38); _vFS(g, H); }
}
let _vHatOn = 'none';
function _vHairFront(g, kind, H){
  const def = _VEC_HAIR[kind] || _VEC_HAIR.short, cx = 12, cy = 7.2, rx = 6.8, ry = 6.2;
  const sy = Math.min(def[0], cy + ry * .96), t = (sy - cy) / ry, aL = Math.PI - Math.asin(t), aR = 2 * Math.PI + Math.asin(t);
  const path = ()=>{ g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, aL, aR); _vSmooth(g, def[1]); g.closePath(); };
  if(kind === 'surf' && !HAT[_vHatOn]){ [[9.2,1.6,8.2,-.4],[12,1.1,12.2,-.9],[14.8,1.6,16,-.3]].forEach(([x,y,tx,ty])=>{ g.beginPath(); g.moveTo(x - 1.6, y + 1.2); g.quadraticCurveTo(tx - .6, ty + 1, tx, ty); g.quadraticCurveTo(x + .4, y + .2, x + 1.6, y + 1.4); g.closePath(); _vFS(g, H); }); }
  path(); _vFS(g, H);
  g.save(); path(); g.clip(); g.beginPath(); g.arc(cx - .4, cy - .2, 4.9, Math.PI * 1.14, Math.PI * 1.42); g.strokeStyle = 'rgba(255,255,255,.32)'; g.lineWidth = .65; g.lineCap = 'round'; g.stroke(); g.restore();
  if(kind === 'twin'){ [[5.6,7.6],[18.4,7.6]].forEach(([x,y])=>{ _vEl(g, x, y, .75, .75); _vFS(g, '#FF6B9A'); }); }
  if(kind === 'pony'){ _vEl(g, 17.7, 6.6, .7, .7); _vFS(g, '#FF6B9A'); }
}
function _vFace(g, face, T){
  const E = '#2A2438', ey = 8.3, L = 9.6, R = 14.4;
  const dot = (x, big)=>{ _vEl(g, x, ey, big ? .78 : .62, big ? .98 : .82); g.fillStyle = E; g.fill(); _vEl(g, x + .22, ey - .32, big ? .3 : .24, big ? .3 : .24); g.fillStyle = '#fff'; g.fill(); };
  const arcEye = (x, up)=>{ g.beginPath(); g.moveTo(x - .72, ey + (up ? .25 : -.15)); g.quadraticCurveTo(x, ey + (up ? -.6 : .55), x + .72, ey + (up ? .25 : -.15)); g.strokeStyle = E; g.lineWidth = .4; g.lineCap = 'round'; g.stroke(); };
  const smile = ()=>{ g.beginPath(); g.arc(12, 9.45, .78, .18 * Math.PI, .82 * Math.PI); g.strokeStyle = E; g.lineWidth = .34; g.lineCap = 'round'; g.stroke(); };
  if(face !== 'cool'){ [[8.2,9.55],[15.8,9.55]].forEach(([x,y])=>{ _vEl(g, x, y, 1, .58); g.fillStyle = 'rgba(255,110,140,.42)'; g.fill(); }); }
  if(face === 'happy'){ arcEye(L, true); arcEye(R, true); g.beginPath(); g.moveTo(10.9, 9.55); g.lineTo(13.1, 9.55); g.arc(12, 9.55, 1.1, 0, Math.PI); g.closePath(); g.fillStyle = '#B8303F'; g.fill();
    _vEl(g, 12, 10.25, .55, .3); g.fillStyle = '#FF8FA3'; g.fill(); }
  else if(face === 'cool'){ [[8.3,7.4],[12.9,7.4]].forEach(([x,y])=>{ _vRR(g, x, y, 2.8, 1.75, .7); g.fillStyle = '#1A2340'; g.fill(); g.beginPath(); g.moveTo(x + .6, y + 1.3); g.lineTo(x + 1.4, y + .4); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = .3; g.stroke(); });
    g.beginPath(); g.moveTo(11.1, 7.9); g.lineTo(12.9, 7.9); g.strokeStyle = '#1A2340'; g.lineWidth = .35; g.stroke();
    g.beginPath(); g.moveTo(11.1, 9.9); g.quadraticCurveTo(12.3, 10.5, 13.2, 9.6); g.strokeStyle = E; g.lineWidth = .34; g.lineCap = 'round'; g.stroke(); }
  else if(face === 'wow'){ dot(L, true); dot(R, true); _vEl(g, 12, 10.05, .5, .62); g.fillStyle = '#B8303F'; g.fill(); }
  else if(face === 'wink'){ dot(L); arcEye(R, true); smile(); }
  else if(face === 'sleepy'){ arcEye(L, false); arcEye(R, false); _vEl(g, 12, 9.85, .32, .38); g.fillStyle = '#B8303F'; g.fill(); }
  else { dot(L); dot(R); smile(); }
}
function _vHat(g, hat, T){
  if(hat === 'bucket'){ const c = _vHex(T.t || '#F7DC8F'); _vRR(g, 6.4, .5, 11.2, 4.6, [3.2, 3.2, .4, .4]); _vFS(g, c); _vEl(g, 12, 5.1, 8.4, 1.35); _vFS(g, c); _vRR(g, 6.4, 3.7, 11.2, .9, .2); g.fillStyle = shade(c, .78); g.fill(); }
  else if(hat === 'cap'){ const c = _vHex(T.q || '#FF4B4B'); _vEl(g, 17.6, 4.9, 3.8, .95); _vFS(g, shade(c, .85)); g.beginPath(); g.ellipse(12, 5, 6.7, 4.6, 0, Math.PI, 2 * Math.PI); g.closePath(); _vFS(g, c); _vEl(g, 12, .5, .55, .45); _vFS(g, shade(c, .8)); }
  else if(hat === 'visor'){ _vRR(g, 5.7, 3.1, 12.6, 1.4, .7); _vFS(g, '#FFFFFF'); _vEl(g, 12, 4.7, 7.8, 1.15); _vFS(g, '#F2F5F8'); }
  else if(hat === 'beanie'){ const c = _vHex(T.q || '#FF4B4B'); g.beginPath(); g.ellipse(12, 5, 6.8, 4.7, 0, Math.PI, 2 * Math.PI); g.closePath(); _vFS(g, c); _vRR(g, 5.1, 3.8, 13.8, 2.1, 1); _vFS(g, '#F7F3EA'); _vEl(g, 12, .3, 1.05, 1.05); _vFS(g, '#F7F3EA'); }
}
function _vBoard(g, pr, T){
  const B = { long:[.6, 22.8], fun:[3, 18], short:[6, 12] }[pr.board] || [.6, 22.8], c = _vHex(T.y || '#FFD23F');
  _vEl(g, 12, 23.25, B[1] / 2 - .4, .55); g.fillStyle = 'rgba(18,36,95,.16)'; g.fill();
  _vRR(g, B[0], 20.6, B[1], 2.2, 1.1); _vFS(g, c, .36);
  if(typeof BPAT === 'object' && BPAT[pr.bpat]){ g.save(); _vRR(g, B[0], 20.6, B[1], 2.2, 1.1); g.clip();
    BPAT[pr.bpat].forEach((r, y)=>[...r].forEach((ch, x)=>{ if(ch === '.' || ch === 'y') return; g.fillStyle = T[ch] || PAL[ch] || ch; g.fillRect(x, 20 + y, 1.02, 1.02); })); g.restore();
    _vRR(g, B[0], 20.6, B[1], 2.2, 1.1); g.strokeStyle = shade(c, .58); g.lineWidth = .36; g.stroke(); }
  g.beginPath(); g.moveTo(B[0] + 1.2, 21.15); g.lineTo(B[0] + B[1] - 1.2, 21.15); g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = .35; g.lineCap = 'round'; g.stroke();
}
function _vBody(g, pr, T){
  const S = _vHex(T.s), top = _vHex(T.r), bot = _vHex(T.b), wear = WEAR[pr.wear] ? pr.wear : 'rash';
  const sleeve = wear === 'tank' || wear === 'bare' ? S : top, legC = wear === 'suit' ? top : S;
  /* 다리 · 반바지 */
  [9.5, 12.3].forEach(x=>{ _vRR(g, x, 16.6, 2.2, 4.1, [.6, .6, .9, .9]); _vFS(g, legC); });
  if(wear !== 'suit'){ _vRR(g, 8.9, 15.6, 6.2, 2.7, [.6, .6, 1, 1]); _vFS(g, bot); g.beginPath(); g.moveTo(12, 17); g.lineTo(12, 18.2); g.strokeStyle = shade(bot, .58); g.lineWidth = .3; g.stroke(); }
  /* 팔 — 옆으로 벌린 밸런스 자세 */
  [[9.2, 13.4, 5.4, 15.1], [14.8, 13.4, 18.6, 15.1]].forEach(([x1, y1, x2, y2])=>{
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineCap = 'round'; g.strokeStyle = shade(sleeve, .58); g.lineWidth = 2.2; g.stroke(); g.strokeStyle = sleeve; g.lineWidth = 1.55; g.stroke();
    _vEl(g, x2, y2, .95, .95); _vFS(g, S, .3); });
  /* 몸통 */
  if(wear === 'hood'){ _vEl(g, 12, 12.4, 3.6, 1.3); _vFS(g, shade(top, .85)); }
  _vRR(g, 8.7, 12.2, 6.6, wear === 'suit' ? 5.6 : 4.6, [1.8, 1.8, 1, 1]); _vFS(g, wear === 'bare' || wear === 'tank' ? S : top);
  if(wear === 'tank'){ _vRR(g, 9.4, 12.9, 5.2, 3.9, [1, 1, .8, .8]); _vFS(g, top); }
  if(wear === 'hood'){ [11.2, 12.8].forEach(x=>{ g.beginPath(); g.moveTo(x, 12.9); g.lineTo(x, 14.6); g.strokeStyle = '#fff'; g.lineWidth = .32; g.lineCap = 'round'; g.stroke(); }); }
  if(wear === 'suit'){ g.beginPath(); g.moveTo(12, 12.6); g.lineTo(12, 16.6); g.strokeStyle = shade(top, .7); g.lineWidth = .3; g.stroke(); }
  if(wear === 'bare'){ g.beginPath(); g.arc(12, 14.6, 1.1, .2 * Math.PI, .8 * Math.PI); g.strokeStyle = shade(S, .75); g.lineWidth = .22; g.stroke(); }
  if(pr.role === 'coach' && pr.vest !== false){ _vRR(g, 9, 12.6, 6, 3.6, [1.2, 1.2, .8, .8]); _vFS(g, '#FF9F1C'); _vRR(g, 9, 14.3, 6, .6, 0); g.fillStyle = '#FFF4D6'; g.fill(); }
}
function _vPet(g, pr, T, f){
  const kind = pr.pet, n = _vHex(T.n || '#FFE0A0'), m = _vHex(T.m || shade(n, .7)), lv = pr.petLv || 0, E = '#2A2438', dy = f ? -.3 : 0;
  _vEl(g, 7, 23.2, 5.6, .5); g.fillStyle = 'rgba(18,36,95,.14)'; g.fill();
  _vRR(g, .8, 20.7, 12.4, 2, 1); _vFS(g, '#F7F9FB', .32);
  g.save(); g.translate(0, dy);
  const eyes = (y, x1, x2)=>{ [x1, x2].forEach(x=>{ _vEl(g, x, y, .55, .7); g.fillStyle = E; g.fill(); _vEl(g, x + .2, y - .28, .2, .2); g.fillStyle = '#fff'; g.fill(); }); };
  let hy = 13.6, ex = [5.3, 8.7];
  if(kind === 'penguin'){
    _vEl(g, 7, 15.8, 4.3, 5.1); _vFS(g, n); _vEl(g, 7, 16.8, 2.8, 3.6); _vFS(g, '#FFFFFF', 0);
    [[2.9,16.2,.5],[11.1,16.2,-.5]].forEach(([x,y,r])=>{ _vEl(g, x, y, .9, 2.4, r); _vFS(g, m); });
    [[5.6,20.4],[8.4,20.4]].forEach(([x,y])=>{ _vEl(g, x, y, 1, .5); _vFS(g, '#FF9F1C'); });
    hy = 13; ex = [5.5, 8.5]; eyes(hy, ex[0], ex[1]);
    g.beginPath(); g.moveTo(6.2, 14.2); g.lineTo(7.8, 14.2); g.lineTo(7, 15.1); g.closePath(); _vFS(g, '#FF9F1C', .25);
  } else {
    if(kind === 'rabbit') [[5.4,8.4,-.12],[8.6,8.4,.12]].forEach(([x,y,r])=>{ _vEl(g, x, y, 1.1, 3.2, r); _vFS(g, n); _vEl(g, x, y + .3, .5, 2.2, r); g.fillStyle = '#FFB3C8'; g.fill(); });
    if(kind === 'cat') [[3.8,9.6,4.8,11.8,2.8,12.4],[10.2,9.6,9.2,11.8,11.2,12.4]].forEach(([tx,ty,ax,ay,bx,by])=>{ g.beginPath(); g.moveTo(tx, ty); g.lineTo(ax + (tx < 7 ? 1.6 : -1.6), ay); g.lineTo(bx, by); g.closePath(); _vFS(g, n); });
    if(kind === 'cat'){ g.beginPath(); g.moveTo(10.5, 18.8); g.quadraticCurveTo(13.6, 18.6, 12.6, 15.6); g.strokeStyle = shade(m, .7); g.lineWidth = 1.3; g.lineCap = 'round'; g.stroke(); g.strokeStyle = m; g.lineWidth = .8; g.stroke(); }
    if(kind === 'seal'){ _vEl(g, 7, 17.2, 5.4, 3.6); _vFS(g, n); [[1.8,18.2,.6],[12.2,18.2,-.6]].forEach(([x,y,r])=>{ _vEl(g, x, y, .9, 1.8, r); _vFS(g, m); }); }
    else { _vEl(g, 7, 17.6, 4, 3); _vFS(g, n); _vEl(g, 7, 18, 2.2, 1.9); _vFS(g, '#FFFFFF', 0); [[5,20.2],[9,20.2]].forEach(([x,y])=>{ _vEl(g, x, y, 1.1, .6); _vFS(g, n, .28); }); }
    _vEl(g, 7, hy, kind === 'seal' ? 4.2 : 4.1, kind === 'seal' ? 3.7 : 3.6); _vFS(g, n);
    if(kind === 'dog') [[3.1,13.4,.35],[10.9,13.4,-.35]].forEach(([x,y,r])=>{ _vEl(g, x, y, 1.3, 2.5, r); _vFS(g, m); });
    if(kind === 'cat') [[4.3,11.3],[9.7,11.3]].forEach(([x,y])=>{ _vEl(g, x, y, .45, .6); g.fillStyle = '#FFB3C8'; g.fill(); });
    eyes(hy - .2, ex[0], ex[1]);
    _vEl(g, 7, hy + 1.45, 1.6, 1.05); _vFS(g, '#FFFFFF', 0);
    _vEl(g, 7, hy + 1, .5, .36); g.fillStyle = E; g.fill();
    if(kind === 'dog'){ _vEl(g, 7, hy + 2.35, .45, .5); g.fillStyle = '#FF7A95'; g.fill(); }
    if(kind === 'rabbit'){ _vRR(g, 6.55, hy + 1.6, .9, .7, .15); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#C9C2D6'; g.lineWidth = .14; g.stroke(); }
    if(kind === 'cat' || kind === 'seal') [[-1,1.2],[1,1.2]].forEach(([s])=>{ [-.3, .3].forEach(o=>{ g.beginPath(); g.moveTo(7 + s * 1.6, hy + 1.3 + o); g.lineTo(7 + s * 3.4, hy + 1 + o * 2); g.strokeStyle = 'rgba(42,36,56,.55)'; g.lineWidth = .16; g.stroke(); }); });
  }
  if(lv >= 1) [[ex[0] - 1, hy + .9], [ex[1] + 1, hy + .9]].forEach(([x,y])=>{ _vEl(g, x, y, .75, .45); g.fillStyle = 'rgba(255,110,140,.5)'; g.fill(); });
  if(lv >= 2){ _vRR(g, 4.2, kind === 'penguin' ? 15.3 : hy + 3.1, 5.6, 1, .5); _vFS(g, '#FF4B4B', .25); }
  if(lv >= 3){ const y = (kind === 'penguin' ? 13 : hy - .2) - .65; [ex[0] - 1.1, ex[1] - .7].forEach(x=>{ _vRR(g, x, y, 1.8, 1.25, .45); g.fillStyle = '#1A2340'; g.fill(); }); g.beginPath(); g.moveTo(ex[0] + .7, y + .4); g.lineTo(ex[1] - .7, y + .4); g.strokeStyle = '#1A2340'; g.lineWidth = .3; g.stroke(); }
  g.restore();
}
function drawAvatarVec(g, pr, withPet, T, f){
  pr = pr || {}; T = T || {};
  const kind = hairOf(pr), S = _vHex(T.s), H = _vHex(T.h);
  g.lineJoin = 'round';
  if(withPet) _vPet(g, pr, T, f);
  g.save(); if(withPet) g.translate(14, 0);
  _vBoard(g, pr, T);
  g.translate(0, f ? .35 : 0);
  _vHairBack(g, kind, H);
  _vBody(g, pr, T);
  if(!/bob|long|twin|wave/.test(kind)) [[5.6, 8.3], [18.4, 8.3]].forEach(([x,y])=>{ _vEl(g, x, y, 1.05, 1.15); _vFS(g, S, .3); });
  _vEl(g, 12, 7.3, 6.4, 5.85); _vFS(g, S, .36);
  _vFace(g, pr.face, T);
  _vHatOn = pr.hat || 'none'; _vHairFront(g, kind, H);
  if(HAT[pr.hat]) _vHat(g, pr.hat, T);
  g.restore();
}
function paintVec(cv, rows, tint, f){
  const W = rows[0].length, H = rows.length, pad = cv.dataset.anim != null ? 1 : 0, ch = cv.clientHeight;
  const dpr = Math.min(3, window.devicePixelRatio || 1), U = ch * dpr / (H + pad * 2);
  const w = Math.round((W + pad * 2) * U), h = Math.round((H + pad * 2) * U);
  if(cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
  cv.style.width = Math.round(ch * w / h) + 'px'; cv.style.imageRendering = 'auto';
  const key = f + '|' + w + 'x' + h;
  if(cv._vRows !== rows || cv._vTint !== tint){ cv._vRows = rows; cv._vTint = tint; cv._vc = {}; }
  let off = cv._vc[key];
  if(!off){ off = document.createElement('canvas'); off.width = w; off.height = h; const o = off.getContext('2d');
    o.setTransform(U, 0, 0, U, pad * U, pad * U); drawAvatarVec(o, rows._pr, rows._pet, tint || {}, f); cv._vc[key] = off; }
  const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.drawImage(off, 0, 0);
}

/* ═══════════ 모찌 미니미(mochi.js) ═══════════
   캐릭터 생김새를 새로 그린 SVG 를 그림으로 바꿔 캔버스에 올린다. 같은 프로필이면 같은 SVG 문자열 → 그림을 다시 만들지 않는다.
   data-anim 이면 550ms 마다 몸 전체가 살짝 떠오른다(보드·펫 포함 — 한 장 그림이라). */
const _mImg = new Map();
function paintMochi(cv, rows, f){
  const svg = window.mochiSVG(rows._pr, { charm:2, pet:rows._pet, uid:'a' });
  let im = _mImg.get(svg);
  if(!im){ im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); _mImg.set(svg, im); if(_mImg.size > 400) _mImg.delete(_mImg.keys().next().value); }
  const VW = rows._pet ? 320 : 200, ch = cv.clientHeight, dpr = Math.min(3, window.devicePixelRatio || 1);
  const w = Math.round(ch * VW / 250 * dpr), h = Math.round(ch * dpr);
  if(cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
  cv.style.width = Math.round(ch * VW / 250) + 'px'; cv.style.imageRendering = 'auto';
  const g = cv.getContext('2d');
  const draw = ()=>{ if(cv._rows !== rows) return; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.drawImage(im, 0, f && cv.dataset.anim != null ? -Math.round(h * .015) : 0, w, h); };
  if(im.complete && im.naturalWidth) draw(); else im.addEventListener('load', draw, { once:true });
}
