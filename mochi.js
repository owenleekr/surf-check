/* ═══════════ 모찌 미니미 — 캐릭터 그리기 (SVG) ═══════════
   아래가 통통한 모찌 얼굴 · 얼굴 아래쪽의 크고 반짝이는 세로 눈 · 짧은 몸 · 쪼리.
   그림체만 바꾸던 이전과 달리 '생김새' 자체를 손으로 다시 그렸다(캐릭터 시안 /charface 1번 → 매력 다듬기 /charmochi).
   mochiSVG(profile, { charm, pet }) → SVG 문자열. 앱(sprite.js)은 이 SVG 를 그림으로 바꿔 캔버스에 그린다.
   좌표: 사람 200×250, 펫이 있으면 왼쪽에 120 을 더 붙여 320×250.
   남의 프로필 값은 전부 아래 표(HAIR·HAT·…)의 키로만 쓰고, 색은 #RRGGBB 만 받는다 — SVG 안에 문자열이 그대로 들어가지 않게. */
(function(){
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined;   // 'constructor' 같은 키로 프로토타입 값이 새어 나오지 않게
const HEXOK = c => /^#[0-9a-f]{6}$/i.test(String(c || '')) ? c : null;
const dk = (hex, f)=>'#' + hex.slice(1).match(/../g).map(h=>Math.max(0, Math.min(255, Math.round(parseInt(h, 16) * f))).toString(16).padStart(2, '0')).join('');
const lt = (hex, t)=>'#' + hex.slice(1).match(/../g).map(h=>{ const v = parseInt(h, 16); return Math.round(v + (255 - v) * t).toString(16).padStart(2, '0'); }).join('');

const SKIN_ = { l:'#FFE3CC', s:'#FBD3B5', d:'#E2A57D', t:'#B5774D' };
const HAIR_ = { k:'#2E2420', n:'#6B4A33', y:'#E8C46A', r:'#C4522F', b:'#3C6BB0', p:'#E07BB2', g:'#3FA36B', w:'#E9E3D8' };
const TOP_ = { r:'#FF7A7A', b:'#3D6DF2', g:'#3FD49A', p:'#9B6BFF', y:'#FFD23F', k:'#2B2F45', w:'#FFFFFF', o:'#FF9F1C',
  sky:'#8FD3FF', navy:'#2C3E73', beige:'#E9D8BC', lav:'#C9B6FF', pink:'#FFB3C8', khaki:'#8C9A5B', cream:'#FFF3D6', wine:'#9E3A55' };
const TOP_KO_ = { sky:'하늘', navy:'네이비', beige:'베이지', lav:'라벤더', pink:'연핑크', khaki:'카키', cream:'크림', wine:'와인' };
const BOT_ = { b:'#4F7BFF', k:'#2B2F45', r:'#FF6B6B', g:'#3FD49A', p:'#9B6BFF', t:'#E2B96A',
  denim:'#5B7DB1', w:'#F4F6FA', khaki:'#8C9A5B', pink:'#FFB3C8', navy:'#2C3E73', sky:'#8FD3FF' };
const BOT_KO_ = { denim:'데님', w:'화이트', khaki:'카키', pink:'연핑크', navy:'네이비', sky:'하늘' };
const BRD_ = { y:'#FFD23F', w:'#FFFFFF', c:'#8FD3FF', g:'#A6F542', p:'#FF9BD2', o:'#FF9F1C' };
const PETC_ = { p:'#FFC2D9', y:'#FFE3B0', w:'#F4F6F9', n:'#C98A5B', g:'#A8F0D8', k:'#7A748A' };
const PETDEF_ = { otter:'n', turtle:'g', penguin:'k' };

/* ── 머리 — [뒷머리, 앞머리, 옆머리(좌), 귀 보임] ── */
const HAIRS = {
  buzz:  { front:'M34,96 C30,52 62,30 100,30 C138,30 170,52 166,96 C160,80 150,70 136,64 C124,60 112,58 100,58 C88,58 76,60 64,64 C50,70 40,80 34,96 Z', ears:1 },
  short: { front:'M31,106 C26,54 60,24 100,24 C140,24 174,54 169,106 C166,97 162,88 158,81 C150,91 138,93 126,87 C120,94 108,96 96,89 C86,95 72,93 64,85 C56,93 45,97 37,101 Z', ears:1, ahoge:1 },
  bob:   { back:'M24,106 C20,52 56,20 100,20 C144,20 180,52 176,106 L178,146 C179,162 163,168 150,160 L50,160 C37,168 21,162 22,146 Z',
           front:'M30,104 C27,56 60,25 100,25 C140,25 173,56 170,104 C167,95 162,86 157,79 C151,89 141,94 129,92 C125,82 119,74 113,68 C108,81 98,89 85,89 C81,79 76,73 71,69 C65,81 55,90 43,93 C38,97 34,101 30,104 Z',
           side:'M30,98 C25,122 28,142 41,156 C45,141 47,122 44,104 Z', ahoge:1 },
  long:  { back:'M22,106 C18,52 56,18 100,18 C144,18 182,52 178,106 L182,194 C182,208 168,212 158,204 L42,204 C32,212 18,208 18,194 Z',
           front:'M30,104 C27,56 60,25 100,25 C140,25 173,56 170,104 C164,90 150,74 132,66 C120,60 110,58 103,57 C101,65 96,71 89,74 C75,78 62,86 51,95 C43,99 36,102 30,104 Z',
           side:'M30,98 C23,130 25,170 38,198 C47,170 49,130 44,104 Z' },
  pony:  { tail:'M146,58 C188,54 200,104 186,148 C180,166 168,172 160,162 C174,132 172,96 150,82 Z',
           front:'M30,104 C27,56 60,25 100,25 C140,25 173,56 170,104 C166,94 160,84 152,78 C140,86 124,86 112,78 C102,86 84,88 72,82 C62,88 50,94 40,98 C36,100 33,102 30,104 Z', ears:1, tie:[152,66] },
  twin:  { tails:['M40,88 C10,94 2,140 16,172 C22,186 36,184 36,170 C30,146 34,118 48,100 Z','M160,88 C190,94 198,140 184,172 C178,186 164,184 164,170 C170,146 166,118 152,100 Z'],
           front:'M30,104 C27,56 60,25 100,25 C140,25 173,56 170,104 C167,95 162,86 157,79 C151,89 141,94 129,92 C125,82 119,74 113,68 C108,81 98,89 85,89 C81,79 76,73 71,69 C65,81 55,90 43,93 C38,97 34,101 30,104 Z', ties:[[42,92],[158,92]] },
  wave:  { back:'M22,106 C18,52 56,18 100,18 C144,18 182,52 178,106 C188,120 186,142 176,152 C184,168 170,182 156,174 L44,174 C30,182 16,168 24,152 C14,142 12,120 22,106 Z',
           front:'M30,104 C27,56 60,25 100,25 C140,25 173,56 170,104 C166,96 160,86 152,82 C146,92 134,94 126,86 C120,95 106,97 100,87 C94,97 80,95 74,86 C66,94 54,92 48,82 C40,86 34,96 30,104 Z' },
  bun:   { top:'<circle cx="100" cy="20" r="23"/>', topTie:[100,40],
           front:'M30,104 C27,56 60,25 100,25 C140,25 173,56 170,104 C167,95 162,86 157,79 C151,89 141,94 129,92 C125,82 119,74 113,68 C108,81 98,89 85,89 C81,79 76,73 71,69 C65,81 55,90 43,93 C38,97 34,101 30,104 Z', ears:1 },
  halfup:{ back:'M22,106 C18,52 56,18 100,18 C144,18 182,52 178,106 L182,194 C182,208 168,212 158,204 L42,204 C32,212 18,208 18,194 Z', top:'<circle cx="100" cy="24" r="15"/>', topTie:[100,37],
           front:'M30,104 C27,56 60,25 100,25 C140,25 173,56 170,104 C164,90 150,74 132,66 C120,60 110,58 103,57 C101,65 96,71 89,74 C75,78 62,86 51,95 C43,99 36,102 30,104 Z',
           side:'M30,98 C23,130 25,170 38,198 C47,170 49,130 44,104 Z' },
  pixie: { front:'M30,104 C26,54 60,24 100,24 C140,24 174,54 170,104 C168,92 164,82 157,74 C140,82 118,86 98,84 C82,90 66,100 50,106 C42,108 35,107 30,104 Z', ears:1 },
  perm:  { perm:1, ears:0 },
  braid: { back:'M24,106 C20,52 56,20 100,20 C144,20 180,52 176,106 L176,132 C176,142 166,146 158,140 L42,140 C34,146 24,142 24,132 Z', braid:1,
           front:'M30,104 C27,56 60,25 100,25 C140,25 173,56 170,104 C167,95 162,86 157,79 C151,89 141,94 129,92 C125,82 119,74 113,68 C108,81 98,89 85,89 C81,79 76,73 71,69 C65,81 55,90 43,93 C38,97 34,101 30,104 Z' },
  twoblock:{ front:'M36,96 C30,52 62,20 104,20 C146,20 172,50 166,92 C160,80 150,72 138,70 C124,74 108,72 94,66 C80,72 62,76 50,84 C44,88 40,92 36,96 Z', shave:1, ears:1, ahoge:1 },
  hime:  { back:'M22,104 C18,52 56,18 100,18 C144,18 182,52 178,104 L180,204 L20,204 Z',
           front:'M31,100 C28,54 60,25 100,25 C140,25 172,54 169,100 L167,86 L33,86 Z', side:'M31,92 L31,150 L49,150 L47,96 Z' },
  surf:  { front:'M31,106 C26,54 60,22 100,22 C140,22 174,54 169,106 C166,96 160,86 154,80 L150,95 C142,88 136,82 130,78 L124,93 C116,85 110,79 104,75 L98,91 C90,83 82,79 76,77 L70,93 C62,87 54,87 46,91 L40,101 Z',
           spikes:'M66,34 L58,10 L84,26 L96,4 L110,25 L134,8 L132,34 Z', ears:1 },
};
const HATS = {
  bucket:{ d:['M44,76 C44,36 70,20 100,20 C130,20 156,36 156,76 Z'], brim:[100,80,78,15], band:'M44,64 Q100,56 156,64 L156,74 Q100,66 44,74 Z', c:'#F3D98E' },
  cap:   { d:['M28,86 C28,40 62,18 100,18 C138,18 172,40 172,86 Z'], bill:'M146,80 C174,74 198,80 200,90 C186,95 164,93 146,90 Z', btn:[100,20], c:'#FF5A5A' },
  visor: { d:['M28,70 Q100,56 172,70 L172,84 Q100,70 28,84 Z'], bill:'M24,82 Q100,66 176,82 Q174,96 100,92 Q26,96 24,82 Z', c:'#FFFFFF' },
  beanie:{ d:['M28,88 C28,34 62,12 100,12 C138,12 172,34 172,88 Z'], cuff:[24,70,152,24], pom:[100,12], c:'#FF5A5A' },
};
/* 레벨 보상·조개 상점 모자(play.js 가 목록에 얹는 것들) — 귀를 덮는 것만 cover */
const HAT2 = {
  band:  { svg:'<path d="M30,80 Q100,60 170,80 L170,92 Q100,72 30,92 Z" fill="#FF9F1C"/><path d="M160,78 L176,70 L174,86 Z M160,82 L178,92 L168,96 Z" fill="#F08A0C"/>' },
  crown: { svg:'<path d="M62,42 L60,12 L80,28 L100,4 L120,28 L140,12 L138,42 Z" fill="#F4C430"/><rect x="60" y="38" width="80" height="11" rx="4" fill="#E0AE1E"/><circle cx="100" cy="26" r="5" fill="#FF4B6B"/><circle cx="80" cy="36" r="3.6" fill="#3D8BFF"/><circle cx="120" cy="36" r="3.6" fill="#3FD49A"/><path d="M72,22 L76,30" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>' },
  sprout:{ svg:'<path d="M100,30 C100,20 99,12 100,4" fill="none" stroke="#3FA36B" stroke-width="4" stroke-linecap="round"/><ellipse cx="88" cy="8" rx="12" ry="6.5" fill="#5BD48A" transform="rotate(-20 88 8)"/><ellipse cx="112" cy="6" rx="12" ry="6.5" fill="#5BD48A" transform="rotate(20 112 6)"/>' },
  wave:  { cover:1, svg:'<path d="M28,88 C28,36 62,14 100,14 C138,14 172,36 172,88 Z" fill="#3D8BFF"/><path d="M30,74 Q46,56 62,68 Q78,52 94,68 Q110,52 126,68 Q142,52 170,74 L170,88 L30,88 Z" fill="#fff" opacity=".92"/><circle cx="100" cy="14" r="8" fill="#fff"/>' },
  straw: { cover:1, svg:'<path d="M48,74 C48,36 74,20 100,20 C126,20 152,36 152,74 Z" fill="#EBC775"/><path d="M48,60 Q100,52 152,60 L152,71 Q100,63 48,71 Z" fill="#E5484D"/><ellipse cx="100" cy="78" rx="88" ry="15" fill="#EBC775"/><path d="M30,80 Q100,90 170,80" fill="none" stroke="#C9A24E" stroke-width="2"/>' },
  cat:   { svg:'<path d="M42,58 L48,16 L80,40 Z M158,58 L152,16 L120,40 Z" fill="#3A3040"/><path d="M50,48 L53,26 L70,40 Z M150,48 L147,26 L130,40 Z" fill="#FFB3C8"/>' },
  flower:{ svg:'<g transform="translate(150 58)">' + [0,72,144,216,288].map(a=>`<circle cx="${Math.cos(a * Math.PI / 180) * 8}" cy="${Math.sin(a * Math.PI / 180) * 8}" r="7" fill="#FF8FB8"/>`).join('') + '<circle r="5.5" fill="#FFD23F"/></g>' },
};

/* 얼굴형 — 실루엣이 달라야 멀리서도 '누구'가 보인다 */
const FSHAPE = {
  mochi: 'M100,36 C142,36 168,62 169,99 C170,138 143,161 100,161 C57,161 30,138 31,99 C32,62 58,36 100,36Z',
  round: 'M100,34 C136,34 165,62 165,98 C165,134 136,162 100,162 C64,162 35,134 35,98 C35,62 64,34 100,34Z',
  oval:  'M100,34 C142,34 168,62 167,98 C166,128 140,158 100,167 C60,158 34,128 33,98 C32,62 58,34 100,34Z',
  square:'M100,36 C150,36 169,58 169,96 C169,134 156,159 100,160 C44,159 31,134 31,96 C31,58 50,36 100,36Z',
  peach: 'M100,42 C134,42 158,62 165,92 C173,132 146,161 100,161 C54,161 27,132 35,92 C42,62 66,42 100,42Z',
};
const EYES = ['sparkle','dot','cat','droopy','star','lash'], BROWS = ['none','soft','thick','sad'], ACCS = ['freckles','none','zinc','bandaid','glasses','star','mole'];

function face(F, U, charm, es, H){
  const E = '#2A1F2B', ey = 112, X = [76, 124]; let o = '';
  /* 볼 + 빗금 */
  [62, 138].forEach(cx=>{ o += `<ellipse cx="${cx}" cy="${ey + 17}" rx="13.5" ry="7.5" fill="#FF8FA3" opacity=".5"/>`;
    if(charm) o += [-5, 0, 5].map(d=>`<path d="M${cx + d - 2},${ey + 20} L${cx + d + 2},${ey + 14}" stroke="#FF6F8A" stroke-width="1.8" stroke-linecap="round" opacity=".55"/>`).join(''); });
  const star = (cx, cy, r)=>`<path d="M${cx},${cy - r} L${cx + r * .3},${cy - r * .3} L${cx + r},${cy} L${cx + r * .3},${cy + r * .3} L${cx},${cy + r} L${cx - r * .3},${cy + r * .3} L${cx - r},${cy} L${cx - r * .3},${cy - r * .3} Z" fill="#fff"/>`;
  const eye = (x, big)=>{ const k = big ? 1.1 : 1, out = x < 100 ? -1 : 1;
    if(es === 'dot') return `<ellipse cx="${x + out * 2}" cy="${ey + 2}" rx="${6.6 * k}" ry="${7.8 * k}" fill="${E}"/><circle cx="${x + out * 2 + 2.4}" cy="${ey - 1}" r="2.4" fill="#fff"/>`;
    if(es === 'cat'){ const t = x < 100 ? ` transform="translate(${2 * x} 0) scale(-1 1)"` : '';
      return `<g${t}><path d="M${x - 11},${ey + 3} Q${x - 4},${ey - 13} ${x + 12},${ey - 8} Q${x + 6},${ey + 13} ${x - 11},${ey + 3} Z" fill="${E}"/><ellipse cx="${x}" cy="${ey + 2}" rx="5.6" ry="7" fill="url(#${U}iris)"/><circle cx="${x + 3.4}" cy="${ey - 3.6}" r="3.6" fill="#fff"/>
        <path d="M${x - 11},${ey + 2} Q${x - 3},${ey - 14} ${x + 12},${ey - 8} L${x + 16},${ey - 12}" fill="none" stroke="${E}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>`; }
    let s = `<ellipse cx="${x}" cy="${ey + (es === 'droopy' ? 1 : 0)}" rx="${9.4 * k}" ry="${(es === 'droopy' ? 11 : 12.2) * k}" fill="${E}"/><ellipse cx="${x}" cy="${ey + 3.5}" rx="${7.4 * k}" ry="${8.4 * k}" fill="url(#${U}iris)"/>`;
    s += es === 'star' ? star(x + 2.6 * k, ey - 3.6 * k, 6.4 * k) + `<circle cx="${x - 3.6}" cy="${ey + 6}" r="1.9" fill="#fff" opacity=".9"/>`
                       : `<circle cx="${x + 3.8 * k}" cy="${ey - 5.4 * k}" r="${4.8 * k}" fill="#fff"/><circle cx="${x - 3.6}" cy="${ey + 5.6}" r="2.1" fill="#fff" opacity=".9"/>`;
    if(es === 'droopy') s += `<path d="M${x - out * 10},${ey - 11} Q${x + out * 2},${ey - 14} ${x + out * 12},${ey - 2}" fill="none" stroke="${E}" stroke-width="3" stroke-linecap="round"/>`;
    else if(charm){ s += `<path d="M${x - 10.5},${ey - 6} Q${x},${ey - 15} ${x + 10.5},${ey - 6}" fill="none" stroke="${E}" stroke-width="3.8" stroke-linecap="round"/><path d="M${x + out * 9.5},${ey - 7.5} L${x + out * 14},${ey - 10.5}" stroke="${E}" stroke-width="2.6" stroke-linecap="round"/>`;
      if(es === 'lash') s += `<path d="M${x + out * 6},${ey - 12} L${x + out * 9},${ey - 17} M${x + out * 1},${ey - 14} L${x + out * 2},${ey - 19}" stroke="${E}" stroke-width="2.4" stroke-linecap="round"/>`; }
    return s; };
  const closed = (x, up)=>`<path d="M${x - 9.5},${ey + (up ? 3 : -2)} Q${x},${ey + (up ? -10 : 7)} ${x + 9.5},${ey + (up ? 3 : -2)}" fill="none" stroke="${E}" stroke-width="4" stroke-linecap="round"/>`;
  const my = ey + 17;
  const smile = `<path d="M92,${my - 1} Q100,${my + 7} 108,${my - 1}" fill="none" stroke="${E}" stroke-width="3.2" stroke-linecap="round"/>`;
  const open = `<path d="M91,${my - 2} Q100,${my - 3} 109,${my - 2} Q107,${my + 10} 100,${my + 10} Q93,${my + 10} 91,${my - 2} Z" fill="#9C2B3A"/><ellipse cx="100" cy="${my + 6.5}" rx="4.6" ry="2.8" fill="#FF8FA3"/>`;
  if(F === 'happy'){ o += closed(X[0], true) + closed(X[1], true) + open; }
  else if(F === 'cool'){ o += `<path d="M58,102 Q58,98 62,98 L90,98 Q94,98 93,103 L91,116 Q89,124 80,124 L68,124 Q59,124 58,116 Z M110,98 L138,98 Q142,98 142,102 L142,116 Q141,124 132,124 L120,124 Q111,124 109,116 L107,103 Q106,98 110,98 Z" fill="#1B2440"/>
      <path d="M93,104 Q100,100 107,104" fill="none" stroke="#1B2440" stroke-width="3"/><path d="M64,104 L72,104 M116,104 L124,104" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>
      <path d="M93,${my + 1} Q103,${my + 6} 109,${my - 3}" fill="none" stroke="${E}" stroke-width="3.2" stroke-linecap="round"/>`; }
  else if(F === 'wow'){ o += eye(X[0], 1) + eye(X[1], 1) + `<ellipse cx="100" cy="${my + 3}" rx="4.8" ry="6" fill="#9C2B3A"/>`; }
  else if(F === 'wink'){ o += eye(X[0]) + closed(X[1], true) + smile + `<path d="M101,${my + 3} Q103,${my + 11} 108,${my + 5}" fill="#FF8FA3" stroke="#E2657E" stroke-width="1.4"/>`; }
  else if(F === 'sleepy'){ o += closed(X[0], false) + closed(X[1], false) + `<ellipse cx="100" cy="${my + 2}" rx="3.4" ry="4" fill="#9C2B3A"/><path d="M150,42 L162,42 L150,54 L162,54" fill="none" stroke="#7FA6D9" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`; }
  else { o += eye(X[0]) + eye(X[1]) + smile; }
  return o;
}

/* ── 소품샵 · 서핑 용품 ── 손 소품(hold)은 오른손에, 서핑 용품(gear)은 몸·보드에. 조개 상점(play.js)에서 산다 */
const HOLDS = ['none','coffee','coconut','gopro','wax','shell','flag'], GEARS = ['none','leash','booties','helmet','towel','watch','pouch','fins'];
const HOLD_SVG = {
  coffee:'<path d="M-9,-27 L15,-27 L12,4 L-6,4 Z" fill="#EAF3FF" fill-opacity=".9" stroke="#B8C4D8" stroke-width="1.6"/><path d="M-7.6,-16 L13.6,-16 L12,4 L-6,4 Z" fill="#6B4A2F"/><rect x="-4" y="-22" width="6" height="6" rx="1.5" fill="#fff" opacity=".8"/><rect x="4" y="-20" width="6" height="6" rx="1.5" fill="#fff" opacity=".8"/><path d="M-11,-30 L17,-30 L15,-25 L-9,-25 Z" fill="#fff" stroke="#B8C4D8" stroke-width="1.2"/><path d="M6,-30 L10,-46" stroke="#3FD49A" stroke-width="3.2" stroke-linecap="round"/>',
  coconut:'<circle cx="4" cy="-12" r="14" fill="#7A4E2D"/><path d="M-6,-20 Q4,-30 14,-20" fill="none" stroke="#5E3A20" stroke-width="2"/><ellipse cx="4" cy="-24" rx="9" ry="3.2" fill="#F6F0E0"/><path d="M6,-24 L13,-42" stroke="#FF6B9A" stroke-width="2.8" stroke-linecap="round"/><path d="M3,-41 Q13,-52 23,-41 Z" fill="#FFD23F"/>',
  gopro:'<path d="M0,0 L16,-50" stroke="#5B6275" stroke-width="4.4" stroke-linecap="round"/><rect x="8" y="-66" width="20" height="16" rx="3.5" fill="#25262B"/><circle cx="18" cy="-58" r="5" fill="#5A6B8C"/><circle cx="19.6" cy="-59.6" r="1.6" fill="#fff"/><rect x="10" y="-64" width="5" height="3" rx="1" fill="#FF4B4B"/>',
  wax:'<ellipse cx="4" cy="-6" rx="13" ry="7" fill="#E9D27A"/><rect x="-9" y="-14" width="26" height="8" fill="#F7E9A0"/><ellipse cx="4" cy="-14" rx="13" ry="6" fill="#FFF6C9"/><path d="M-4,-14 Q4,-18 12,-14" fill="none" stroke="#FF6B9A" stroke-width="2"/>',
  shell:'<path d="M-8,-2 C-12,-22 8,-38 22,-24 C26,-16 18,-4 6,0 Z" fill="#FFC9B9"/><path d="M-4,-8 C0,-20 12,-26 18,-20 M0,-4 C6,-14 14,-16 16,-12" fill="none" stroke="#E89A86" stroke-width="2"/><circle cx="-6" cy="-1" r="3" fill="#F7A994"/>',
  flag:'<path d="M0,6 L0,-64" stroke="#8B6B4A" stroke-width="3.4" stroke-linecap="round"/><path d="M0,-64 L34,-55 L0,-44 Z" fill="#2E6BFF"/><path d="M5,-54 Q10,-59 15,-54 Q20,-49 25,-54" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
};

function petSVG(kind, c, lv, U, pv){
  /* 머리 큰 치비 펫 — 종마다 4가지(pv 0~3). 친밀도: 1 볼터치 진하게 · 2 리본 · 3 선글라스 */
  pv = Math.max(0, Math.min(3, +pv || 0));
  const E = '#2A1F2B', W = '#FFFFFF', CR = '#FFF6EA', PK = '#FFC2D2';
  /* 종류가 색을 정하는 경우(턱시도·샴·아기 물범 등) */
  if(kind === 'cat' && pv === 1) c = '#3A3646';
  if(kind === 'cat' && pv === 3) c = '#F4E6D2';
  if(kind === 'seal' && pv === 1) c = '#F7F9FB';
  if(kind === 'seal' && pv === 3) c = '#8D93A3';
  if(kind === 'otter' && pv === 2) c = '#7A5236';
  if(kind === 'dog' && pv === 2) c = '#F6EBDD';
  const m = dk(c, .8), mm = dk(c, .66);
  const gl = d=>`<path d="${d}" fill="url(#${U}gl)"/>`;
  const egl = (x, y, rx, ry)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#${U}gl)"/>`;
  const eyes = (y, xs, k, iris)=>xs.map(x=>`<ellipse cx="${x}" cy="${y}" rx="${6.6 * (k || 1)}" ry="${8 * (k || 1)}" fill="${iris || E}"/>${iris ? `<ellipse cx="${x}" cy="${y + 1}" rx="${3.4 * (k || 1)}" ry="${4.6 * (k || 1)}" fill="${E}"/>` : ''}<circle cx="${x + 2.4}" cy="${y - 3}" r="2.8" fill="#fff"/><circle cx="${x - 2}" cy="${y + 3.4}" r="1.3" fill="#fff" opacity=".85"/>`).join('');
  const mouthW = (x, y)=>`<path d="M${x - 6},${y} Q${x - 3},${y + 4} ${x},${y} Q${x + 3},${y + 4} ${x + 6},${y}" fill="none" stroke="${E}" stroke-width="2" stroke-linecap="round"/>`;
  const whisk = (x, y)=>[-1, 1].map(sg=>[-3, 3].map(d=>`<path d="M${x + sg * 14},${y + d} L${x + sg * 28},${y + d * 1.8}" stroke="${c === '#3A3646' ? '#fff' : E}" stroke-opacity=".45" stroke-width="1.4" stroke-linecap="round"/>`).join('')).join('');
  const body = 'M60,192 C86,192 94,212 92,229 C90,241 78,244 60,244 C42,244 30,241 28,229 C26,212 34,192 60,192 Z';
  let o = `<ellipse cx="60" cy="244" rx="34" ry="5" fill="#12245F" opacity=".12"/>`, hy = 164, ex = [46, 74], blushY = 178, scarfY = 196, k = 1;
  if(kind === 'penguin'){
    const bd = 'M60,128 C92,128 100,170 98,206 C96,234 82,244 60,244 C38,244 24,234 22,206 C20,170 28,128 60,128 Z';
    o += `<path d="M26,184 C12,194 10,214 18,224 C26,216 30,202 32,192 Z M94,184 C108,194 110,214 102,224 C94,216 90,202 88,192 Z" fill="${mm}"/>`;
    o += `<path d="${bd}" fill="${c}"/>${gl(bd)}<path d="M60,150 C38,140 30,164 36,178 C40,196 50,206 60,236 C70,206 80,196 84,178 C90,164 82,140 60,150 Z" fill="${W}"/>`;
    if(pv === 1) o += `<path d="M34,178 C30,190 36,198 44,196 C42,188 40,182 34,178 Z M86,178 C90,190 84,198 76,196 C78,188 80,182 86,178 Z" fill="#FFC93C"/>`;
    if(pv === 3) o += `<path d="M42,140 C30,128 26,118 36,120 C44,124 48,132 50,138 Z M78,140 C90,128 94,118 84,120 C76,124 72,132 70,138 Z" fill="#FFC93C"/>`;
    o += `<ellipse cx="48" cy="243" rx="10" ry="4.5" fill="#FF9F1C"/><ellipse cx="72" cy="243" rx="10" ry="4.5" fill="#FF9F1C"/>`;
    hy = 160; ex = [48, 72]; k = .85;
    if(pv === 2) o += ex.map(x=>`<circle cx="${x}" cy="${hy}" r="9.5" fill="#fff"/>`).join('');
    o += eyes(hy, ex, k) + `<path d="M53,171 Q60,166 67,171 Q60,180 53,171 Z" fill="#FF9F1C"/>`; blushY = 172; scarfY = 188;
  } else if(kind === 'seal'){
    const bd = 'M18,240 C10,202 24,146 60,144 C96,146 110,202 102,240 Z';
    o += `<path d="${bd}" fill="${c}"/>${gl(bd)}<path d="M12,222 C0,228 0,240 10,243 C18,238 22,232 24,226 Z M108,222 C120,228 120,240 110,243 C102,238 98,232 96,226 Z" fill="${pv === 1 ? '#E3E8EE' : mm}"/>`;
    if(pv === 0) o += [[34,214,4],[86,206,3],[78,226,3.6],[40,232,2.6],[70,158,2.4]].map(([x, y, r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${m}" opacity=".7"/>`).join('');
    if(pv === 1) o += [[26,190],[94,190],[60,148],[40,160],[80,160]].map(([x, y])=>`<circle cx="${x}" cy="${y}" r="7" fill="#fff"/>`).join('');
    if(pv === 2) o += `<ellipse cx="34" cy="160" rx="4" ry="7" fill="${mm}" transform="rotate(-20 34 160)"/><ellipse cx="86" cy="160" rx="4" ry="7" fill="${mm}" transform="rotate(20 86 160)"/>`;
    hy = 176; ex = [45, 75]; k = pv === 1 ? 1.2 : 1; o += eyes(hy, ex, k) + `<ellipse cx="53" cy="192" rx="9" ry="7" fill="${CR}"/><ellipse cx="67" cy="192" rx="9" ry="7" fill="${CR}"/><ellipse cx="60" cy="186" rx="5" ry="3.6" fill="${E}"/>` + whisk(60, 192) + mouthW(60, 198);
    blushY = 190; scarfY = 208;
  } else if(kind === 'turtle'){
    const sea = pv === 1, baby = pv === 3, sc = sea ? '#5FB3A8' : c, sk = sea ? '#BFE8D8' : '#9BD98C';
    const s0 = baby ? 'M24,230 C24,198 40,184 60,184 C80,184 96,198 96,230 Z' : 'M14,226 C14,186 34,166 60,166 C86,166 106,186 106,226 Z';
    if(sea) o += `<path d="M10,222 C-6,214 -8,234 4,238 C10,236 14,230 16,226 Z M110,222 C126,214 128,234 116,238 C110,236 106,230 104,226 Z" fill="${sk}"/>`;
    else o += `<ellipse cx="${baby ? 30 : 24}" cy="236" rx="10" ry="7" fill="${sk}"/><ellipse cx="${baby ? 90 : 96}" cy="236" rx="10" ry="7" fill="${sk}"/>`;
    o += `<path d="${s0}" fill="${sc}"/>${gl(s0)}`;
    if(pv === 2) o += [[60,196],[40,212],[80,212],[60,180]].map(([x, y])=>`<path d="M${x},${y - 7} L${x + 2},${y - 2} L${x + 7},${y} L${x + 2},${y + 2} L${x},${y + 7} L${x - 2},${y + 2} L${x - 7},${y} L${x - 2},${y - 2} Z" fill="#FFD23F"/>`).join('');
    else if(!baby) o += `<path d="M60,176 L76,186 L76,206 L60,216 L44,206 L44,186 Z" fill="none" stroke="${dk(sc, .8)}" stroke-width="3" stroke-linejoin="round"/><path d="M44,186 L28,196 M76,186 L92,196 M44,206 L30,222 M76,206 L90,222" stroke="${dk(sc, .8)}" stroke-width="3" stroke-linecap="round"/>`;
    o += `<path d="${baby ? 'M22,230 Q60,236 98,230 L98,233 Q60,240 22,233 Z' : 'M12,226 Q60,234 108,226 L108,230 Q60,240 12,230 Z'}" fill="${dk(sc, .66)}"/>`;
    hy = baby ? 168 : 150; const hr = baby ? 22 : 26;
    o += `<ellipse cx="60" cy="${hy}" rx="${hr}" ry="${hr - 2}" fill="${sk}"/>${egl(60, hy, hr, hr - 2)}`;
    if(baby) o += `<path d="M44,150 L50,142 L56,150 L62,142 L68,150 L74,142 L76,152 Q60,146 44,152 Z" fill="#FFF8EC" stroke="#E8DCC6" stroke-width="1"/>`;
    ex = [50, 70]; o += eyes(hy, ex, .75) + mouthW(60, hy + 12); blushY = hy + 10; scarfY = hy + 20;
  } else {
    /* 강아지·고양이·토끼·해달 — 앉은 몸 + 큰 머리 */
    const baby = kind === 'otter' && pv === 3, S = baby ? .85 : 1;
    if(kind === 'dog') o += pv === 1 ? `<path d="M90,214 C108,208 108,190 96,190 C88,192 92,202 98,202" fill="none" stroke="${m}" stroke-width="8" stroke-linecap="round"/>`
                                     : `<path d="M88,222 C104,214 108,198 100,190" fill="none" stroke="${pv === 2 ? '#6B4A33' : m}" stroke-width="8" stroke-linecap="round"/>`;
    if(kind === 'cat') o += `<path d="M88,230 C110,228 112,202 100,194 C96,190 92,196 96,200 C102,208 98,222 86,222" fill="${pv === 3 ? '#5A4032' : m}"/>` + (pv === 0 ? `<path d="M100,206 L108,204 M98,216 L106,216" stroke="${mm}" stroke-width="3"/>` : '');
    if(kind === 'rabbit') o += `<circle cx="92" cy="232" r="9" fill="${W}"/>`;
    if(kind === 'otter') o += `<path d="M86,238 C108,240 116,224 110,212" fill="none" stroke="${m}" stroke-width="10" stroke-linecap="round"/>`;
    if(kind === 'rabbit' && pv === 2) o += [...Array(10)].map((_, i)=>{ const a = Math.PI * 2 * i / 10; return `<circle cx="${60 + Math.cos(a) * 38}" cy="${164 + Math.sin(a) * 33}" r="11" fill="${W}"/>`; }).join('');
    o += `<path d="${body}" fill="${c}"/>${gl(body)}`;
    const belly = kind === 'otter' ? CR : (kind === 'cat' && pv === 2) ? W : W;
    o += `<ellipse cx="60" cy="222" rx="17" ry="16" fill="${belly}" opacity="${kind === 'otter' ? 1 : .9}"/>`;
    if(kind === 'dog' && pv === 2) o += `<ellipse cx="80" cy="212" rx="12" ry="10" fill="#6B4A33"/>`;
    o += `<ellipse cx="45" cy="240" rx="10" ry="6" fill="${(kind === 'cat' && pv === 1) ? W : c}"/><ellipse cx="75" cy="240" rx="10" ry="6" fill="${(kind === 'cat' && pv === 1) ? W : c}"/>`;
    if(kind === 'otter' && pv !== 2){ const st = pv === 1;
      o += st ? `<g transform="translate(60 212)"><path d="M0,-12 L3,-4 L12,-4 L5,2 L8,11 L0,5 L-8,11 L-5,2 L-12,-4 L-3,-4 Z" fill="#FF9F5A"/><circle r="2" fill="#FFD9B0"/></g>`
              : `<g transform="translate(60 214)"><path d="M-11,2 C-11,-10 11,-10 11,2 Q0,8 -11,2 Z" fill="#F6E3C8"/><path d="M-6,-5 L-4,3 M0,-7 L0,4 M6,-5 L4,3" stroke="#D9BF9A" stroke-width="1.6"/></g>`;
      o += `<ellipse cx="46" cy="212" rx="7" ry="5.5" fill="${m}"/><ellipse cx="74" cy="212" rx="7" ry="5.5" fill="${m}"/>`; }
    if(kind === 'otter' && pv === 2) o += `<ellipse cx="52" cy="210" rx="7" ry="5.5" fill="${m}"/><ellipse cx="68" cy="210" rx="7" ry="5.5" fill="${m}"/>`;
    /* 귀 */
    if(kind === 'rabbit'){
      if(pv === 1) o += `<g transform="rotate(14 26 172)"><ellipse cx="26" cy="176" rx="10" ry="26" fill="${c}"/><ellipse cx="26" cy="178" rx="5" ry="18" fill="${PK}"/></g><g transform="rotate(-14 94 172)"><ellipse cx="94" cy="176" rx="10" ry="26" fill="${c}"/><ellipse cx="94" cy="178" rx="5" ry="18" fill="${PK}"/></g>`;
      else o += `<g transform="rotate(-10 46 116)"><ellipse cx="46" cy="116" rx="10" ry="28" fill="${pv === 3 ? '#6B4A33' : c}"/><ellipse cx="46" cy="118" rx="5" ry="19" fill="${PK}"/></g><g transform="rotate(28 76 112)"><path d="M66,124 C64,98 72,86 80,90 C90,94 88,112 84,126 Z" fill="${pv === 3 ? '#6B4A33' : c}"/><path d="M70,120 C70,102 74,94 79,96 C84,99 83,110 80,120 Z" fill="${PK}"/></g>`; }
    if(kind === 'cat') o += `<path d="M24,152 L28,118 L54,138 Z M96,152 L92,118 L66,138 Z" fill="${pv === 3 ? '#5A4032' : c}"/><path d="M30,144 L32,126 L46,138 Z M90,144 L88,126 L74,138 Z" fill="${PK}"/>`;
    if(kind === 'otter') o += `<circle cx="${60 - 30 * S}" cy="140" r="9" fill="${c}"/><circle cx="${60 + 30 * S}" cy="140" r="9" fill="${c}"/><circle cx="${60 - 30 * S}" cy="140" r="4.5" fill="${m}"/><circle cx="${60 + 30 * S}" cy="140" r="4.5" fill="${m}"/>`;
    if(kind === 'dog' && pv === 1) o += `<path d="M26,148 L30,116 L52,136 Z M94,148 L90,116 L68,136 Z" fill="${c}"/><path d="M32,140 L34,124 L46,136 Z M88,140 L86,124 L74,136 Z" fill="${PK}" opacity=".8"/>`;
    o += `<ellipse cx="60" cy="${hy}" rx="${38 * S}" ry="${33 * S}" fill="${c}"/>${egl(60, hy, 38 * S, 33 * S)}`;
    if(kind === 'dog' && pv === 0) o += `<ellipse cx="76" cy="160" rx="12" ry="11" fill="${m}" opacity=".55"/>`;
    if(kind === 'dog' && pv !== 1){ const ec = pv === 2 ? '#6B4A33' : m;
      if(pv === 3) o += [[22,160],[24,178],[98,160],[96,178],[34,134],[50,128],[70,128],[86,134],[60,126]].map(([x, y])=>`<circle cx="${x}" cy="${y}" r="${x === 60 ? 13 : 11}" fill="${c}"/>`).join('') + [[22,160],[96,178],[50,128]].map(([x, y])=>`<circle cx="${x}" cy="${y}" r="11" fill="url(#${U}gl)"/>`).join('');
      else o += `<g transform="rotate(16 25 166)"><path d="M14,146 C10,166 14,184 24,190 C34,186 38,166 34,148 C30,140 18,140 14,146 Z" fill="${ec}"/></g><g transform="rotate(-16 95 166)"><path d="M106,146 C110,166 106,184 96,190 C86,186 82,166 86,148 C90,140 102,140 106,146 Z" fill="${ec}"/></g>`;
      if(pv === 2) o += `<path d="M54,132 C56,150 52,164 50,172 L70,172 C68,164 64,150 66,132 Z" fill="${W}"/><ellipse cx="40" cy="152" rx="14" ry="12" fill="#6B4A33" opacity=".9"/><ellipse cx="80" cy="152" rx="14" ry="12" fill="#6B4A33" opacity=".9"/>`; }
    if(kind === 'dog' && pv === 1) o += `<path d="M30,170 C34,190 50,196 60,196 C70,196 86,190 90,170 C80,180 70,178 60,170 C50,178 40,180 30,170 Z" fill="${W}"/><ellipse cx="44" cy="146" rx="5" ry="3" fill="${W}" opacity=".9"/><ellipse cx="76" cy="146" rx="5" ry="3" fill="${W}" opacity=".9"/>`;
    if(kind === 'cat' && pv === 0) o += `<path d="M54,134 L56,144 M60,132 L60,143 M66,134 L64,144" stroke="${m}" stroke-width="3" stroke-linecap="round"/>`;
    if(kind === 'cat' && pv === 1) o += `<path d="M44,168 C48,188 56,196 60,196 C64,196 72,188 76,168 C70,174 64,172 60,166 C56,172 50,174 44,168 Z" fill="${W}"/>`;
    if(kind === 'cat' && pv === 2) o += `<path d="M30,140 C40,132 54,134 54,146 C52,156 38,158 30,152 Z" fill="#F2A65A"/><path d="M90,138 C82,132 70,136 72,146 C74,154 86,154 92,148 Z" fill="#3A3646"/><path d="M82,214 C90,206 94,222 86,226 Z" fill="#F2A65A"/>`;
    if(kind === 'cat' && pv === 3) o += `<ellipse cx="60" cy="176" rx="20" ry="16" fill="#8A6650" opacity=".75"/>`;
    if(kind === 'rabbit' && pv === 3) o += `<path d="M24,160 C24,140 40,132 52,134 L54,172 C42,176 28,174 24,160 Z M96,160 C96,140 80,132 68,134 L66,172 C78,176 92,174 96,160 Z" fill="#6B4A33"/>`;
    if(kind === 'otter') o += `<ellipse cx="60" cy="${hy + 10}" rx="${26 * S}" ry="${18 * S}" fill="${CR}"/>`;
    if(kind === 'rabbit') o += `<ellipse cx="34" cy="${hy + 12}" rx="7" ry="5" fill="${W}" opacity=".7"/><ellipse cx="86" cy="${hy + 12}" rx="7" ry="5" fill="${W}" opacity=".7"/>`;
    o += eyes(hy, ex, baby ? 1.15 : 1, kind === 'cat' && pv === 3 ? '#6FB7E8' : null);
    const ny = hy + 12;
    if(kind !== 'otter') o += `<ellipse cx="60" cy="${ny + 4}" rx="11" ry="8" fill="${W}" opacity=".95"/>`;
    o += `<ellipse cx="60" cy="${ny}" rx="${kind === 'rabbit' ? 3.6 : 5}" ry="${kind === 'rabbit' ? 2.8 : 3.6}" fill="${kind === 'rabbit' || kind === 'cat' ? '#FF8FA3' : E}"/>` + mouthW(60, ny + 5);
    if(kind === 'dog') o += `<path d="M56,${ny + 8} Q60,${ny + 20} 64,${ny + 8} Z" fill="#FF7A95"/>`;
    if(kind === 'rabbit') o += `<rect x="56.5" y="${ny + 7}" width="7" height="6" rx="1.5" fill="#fff" stroke="#D8D2E0" stroke-width="1"/>`;
    if(kind === 'cat' || kind === 'otter') o += whisk(60, ny + 2);
    blushY = hy + 12;
  }
  o += ex.map(x=>`<ellipse cx="${x + (x < 60 ? -9 : 9)}" cy="${blushY}" rx="${lv >= 1 ? 7 : 6}" ry="4" fill="#FF8FA3" opacity="${lv >= 1 ? .7 : .4}"/>`).join('');
  if(lv >= 2) o += `<path d="M38,${scarfY} Q60,${scarfY + 9} 82,${scarfY} L82,${scarfY + 8} Q60,${scarfY + 17} 38,${scarfY + 8} Z" fill="#FF5A5A"/><path d="M66,${scarfY + 10} L72,${scarfY + 26} L80,${scarfY + 20} Z" fill="#E84848"/>`;
  if(lv >= 3){ const y = (kind === 'penguin' ? 160 : kind === 'seal' ? 176 : hy); o += ex.map(x=>`<rect x="${x - 10}" y="${y - 7}" width="20" height="14" rx="6" fill="#1B2440"/><path d="M${x - 6},${y - 3} L${x - 2},${y - 3}" stroke="#fff" stroke-opacity=".6" stroke-width="2.4" stroke-linecap="round"/>`).join('') + `<path d="M${ex[0] + 10},${y - 2} L${ex[1] - 10},${y - 2}" stroke="#1B2440" stroke-width="3"/>`; }
  return o;
}

/* 소품샵 확대 — 산 물건이 있는 자리만 잘라 보여 준다 */
const VIEWS = { head:'14 -8 172 178', torso:'46 134 108 94', hand:'92 116 112 104', feet:'56 196 88 54', board:'8 60 74 190', pet:'-6 100 132 150', leash:'14 184 118 66', tail:'10 186 72 62', wrist:'100 160 68 58' };
const VIEW_OF = (key, v)=>({ hat:'head', hair:'head', acc:'head', eye:'head', brow:'head', fshape:'head', wear:'torso', hold:'hand', boardc:'board', bpat:'board', pet:'pet',
  gear:{ leash:'leash', fins:'tail', towel:'torso', pouch:'torso', watch:'wrist', booties:'feet', helmet:'head' }[v] }[key] || null);
let seq = 0;
function mochiSVG(pr, opt){
  pr = pr || {}; opt = opt || {};
  const charm = opt.charm == null ? 2 : opt.charm, U = opt.uid || 'm' + (seq++).toString(36);
  const S = own(SKIN_, pr.skin) || SKIN_.s, H = own(HAIR_, pr.hairc) || HAIR_.k, T = own(TOP_, pr.top) || TOP_.r, B = own(BOT_, pr.bottom) || BOT_.b;
  const BD = own(BRD_, pr.boardc) || (typeof BOARDC === 'object' && Object.prototype.hasOwnProperty.call(BOARDC, pr.boardc) && HEXOK(BOARDC[pr.boardc])) || BRD_.y;
  const hk = own(HAIRS, pr.hair) ? pr.hair : (pr.gender === 'm' ? 'short' : 'bob'), h = HAIRS[hk];
  const face_ = ['smile','happy','cool','wow','wink','sleepy'].includes(pr.face) ? pr.face : 'smile';
  const hold = HOLDS.includes(pr.hold) ? pr.hold : 'none', gear = GEARS.includes(pr.gear) ? pr.gear : 'none';
  const HEAD = own(FSHAPE, pr.fshape) || FSHAPE.mochi, es = EYES.includes(pr.eye) ? pr.eye : 'sparkle', brow = BROWS.includes(pr.brow) ? pr.brow : 'none', acc = ACCS.includes(pr.acc) ? pr.acc : 'freckles';
  const wear = ['rash','hood','tank','suit','bare','stripe','heart','aloha','vest','poncho','tee','shorty','overall','check','dress','knit','zipup','sailor'].includes(pr.wear) ? pr.wear : 'rash';
  const SHORT = ['tee','shorty','dress','sailor'].includes(wear), HC = own(TOP_, pr.hatc) || null;
  const hat = gear !== 'helmet' && (own(HATS, pr.hat) || own(HAT2, pr.hat)) ? pr.hat : null, cover = (hat && (HATS[hat] || HAT2[hat].cover) && !['cap','visor'].includes(hat)) || gear === 'helmet';
  const pet = opt.pet && ['dog','cat','rabbit','penguin','seal','otter','turtle'].includes(pr.pet) ? pr.pet : null;
  const holdBoard = charm >= 2 && opt.board !== false, wave = charm >= 1 && !holdBoard;
  const gl = d=>`<path d="${d}" fill="url(#${U}gl)"/>`;
  /* 잉크 선 — 실루엣은 진한 밤색 한 줄(필터), 안쪽 경계는 그 면의 진한 색으로. 도트 RPG 캐릭터처럼 또렷하게 읽히게 */
  const OL = '#3B2A2C', ln = (c, w)=>` stroke="${dk(c, .58)}" stroke-width="${w || 2.2}" stroke-linejoin="round"`;
  const sleeve = wear === 'tank' || wear === 'bare' || SHORT ? S : T;
  let o = `<defs><radialGradient id="${U}gl" cx=".3" cy=".24" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".17" stop-color="#fff" stop-opacity=".34"/><stop offset=".18" stop-color="#fff" stop-opacity="0"/><stop offset=".72" stop-color="#3A1E30" stop-opacity="0"/><stop offset=".73" stop-color="#3A1E30" stop-opacity=".13"/><stop offset="1" stop-color="#3A1E30" stop-opacity=".17"/></radialGradient>
    <filter id="${U}ol" x="-6%" y="-6%" width="112%" height="112%"><feMorphology in="SourceAlpha" operator="dilate" radius="2.6" result="d"/><feFlood flood-color="${OL}"/><feComposite in2="d" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <linearGradient id="${U}iris" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A1F2B" stop-opacity="0"/><stop offset="1" stop-color="#8A5A3E"/></linearGradient>
    <clipPath id="${U}hd"><path d="${HEAD}"/></clipPath></defs>`;
  if(pet) o += `<g filter="url(#${U}ol)">${petSVG(pet, own(PETC_, pr.petc) || PETC_[PETDEF_[pet]] || PETC_.y, Math.max(0, Math.min(3, +pr.petLv || 0)), U, pr.petv)}</g><g transform="translate(120 0)">`;
  o += `<ellipse cx="100" cy="242" rx="42" ry="6" fill="#12245F" opacity=".14"/><g filter="url(#${U}ol)">`;
  /* 옆에 낀 서핑보드(뒤) */
  if(holdBoard){ const bd = 'M24,112 C24,86 34,70 44,70 C54,70 64,86 64,112 L64,214 C64,232 54,242 44,242 C34,242 24,232 24,214 Z';
    const pat = ['stringer','racing','flower','flame'].includes(pr.bpat) ? pr.bpat : null;
    o += `<path d="${bd}" fill="${BD}"/><clipPath id="${U}bd"><path d="${bd}"/></clipPath><g clip-path="url(#${U}bd)">`;
    if(pat === 'racing') o += `<path d="M20,118 L68,104 L68,116 L20,130 Z M20,138 L68,124 L68,132 L20,146 Z" fill="#FF4B4B"/>`;
    if(pat === 'flower') o += [[36,100],[52,128],[34,160],[54,190],[38,214]].map(([x, y], i)=>`<g transform="translate(${x} ${y})">${[0,72,144,216,288].map(a=>`<circle cx="${Math.cos(a * Math.PI / 180) * 4}" cy="${Math.sin(a * Math.PI / 180) * 4}" r="3.6" fill="${i % 2 ? '#FF8FB8' : '#fff'}"/>`).join('')}<circle r="2.6" fill="#FFD23F"/></g>`).join('');
    if(pat === 'flame') o += `<path d="M20,246 L20,200 Q28,214 32,196 Q36,176 42,190 Q46,170 50,186 Q56,168 58,192 Q62,182 68,198 L68,246 Z" fill="#FF9F1C"/><path d="M20,246 L20,218 Q30,226 34,212 Q40,200 46,214 Q52,202 56,216 Q62,208 68,220 L68,246 Z" fill="#FF4B4B"/>`;
    if(pr.boardc === 'legend') o += [[34,96],[54,140],[36,186]].map(([x, y])=>`<path d="M${x},${y - 7} L${x + 2},${y - 2} L${x + 7},${y} L${x + 2},${y + 2} L${x},${y + 7} L${x - 2},${y + 2} L${x - 7},${y} L${x - 2},${y - 2} Z" fill="#fff" opacity=".85"/>`).join('');
    o += `</g>${gl(bd)}<path d="M44,74 L44,238" stroke="${pat === 'stringer' ? '#fff' : dk(BD, .78)}" stroke-width="${pat === 'stringer' ? 4 : 2.4}"/>${gear === 'fins' ? `<path d="M31,222 L34,236 L39,222 Z M41,228 L44,242 L47,228 Z M49,222 L54,236 L57,222 Z" fill="#2B2F45"/>` : `<path d="M38,226 L44,240 L50,226 Z" fill="${dk(BD, .7)}"/>`}`; }
  /* 뒷머리 · 꽁지 */
  const curls = (pts, r)=>pts.map(([x, y])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${H}"/>`).join('');
  const PERM_B = [...Array(14)].map((_, i)=>{ const a = Math.PI * (0.92 + i / 13 * 1.16) ; return [100 + Math.cos(a) * 72, 100 + Math.sin(a) * 66]; }).concat([[34,140],[166,140],[44,160],[156,160]]);
  if(h.perm) o += curls(PERM_B, 22) + `<ellipse cx="100" cy="100" rx="70" ry="66" fill="${H}"/>${gl('M30,100 C30,40 170,40 170,100 C170,160 30,160 30,100 Z')}`;
  if(h.back) o += `<path d="${h.back}" fill="${H}"${ln(H)}/>${gl(h.back)}`;
  if(h.top) o += h.top.replace('/>', ` fill="${H}"/>`) + `<ellipse cx="${h.topTie[0]}" cy="${h.topTie[1]}" rx="13" ry="4.5" fill="#FF6B9A"/>`;
  if(h.tail) o += `<path d="${h.tail}" fill="${H}"/>${gl(h.tail)}`;
  if(h.tails) h.tails.forEach(d=>{ o += `<path d="${d}" fill="${H}"/>${gl(d)}`; });
  /* 다리 · 쪼리 */
  const legC = wear === 'suit' ? T : S;
  o += `<rect x="83" y="206" width="14" height="26" rx="7" fill="${legC}"${ln(legC, 2)}/><rect x="103" y="206" width="14" height="26" rx="7" fill="${legC}"${ln(legC, 2)}/>`;
  if(gear === 'booties') [89, 111].forEach(x=>{ o += `<path d="M${x - 9},220 L${x + 8},220 L${x + 9},234 Q${x + 13},239 ${x + 5},241 L${x - 11},241 Q${x - 14},238 ${x - 11},233 Z" fill="#22262F"/><path d="M${x - 11},238 L${x + 10},238" stroke="#3A3F4D" stroke-width="2"/>`; });
  else [89, 111].forEach(x=>{ o += `<ellipse cx="${x}" cy="237" rx="12.5" ry="5" fill="${dk(BD, .92)}"/><ellipse cx="${x}" cy="233" rx="9" ry="5.5" fill="${S}"/><path d="M${x - 6},234 L${x},228 L${x + 6},234" fill="none" stroke="${dk(BD, .75)}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`; });
  /* 반바지 */
  if(wear !== 'suit'){ const sh = 'M71,192 Q100,201 129,192 L131,212 Q118,217 104,215 L100,207 L96,215 Q82,217 69,212 Z';
    o += `<path d="${sh}" fill="${wear === 'shorty' ? T : B}"${ln(wear === 'shorty' ? T : B)}/><path d="M73,200 L71,211 M127,200 L129,211" stroke="#fff" stroke-opacity=".75" stroke-width="3" stroke-linecap="round"/>`;
    if(charm) o += [[80,204],[90,209],[112,209],[121,204]].map(([x, y])=>`<circle cx="${x}" cy="${y}" r="2" fill="#fff" opacity=".55"/>`).join(''); }
  /* 팔 — 왼팔은 내리거나 보드를 잡고, 오른팔은 손 흔들기 */
  const armL = holdBoard ? 'M80,158 C66,162 56,170 52,180 C50,188 58,192 63,186 C68,178 76,172 86,168 Z' : 'M80,158 C68,166 61,180 62,193 C63,201 73,202 75,195 C76,185 80,175 86,168 Z';
  const handL = holdBoard ? [56, 184] : [68, 196];
  const armR = wave ? 'M118,157 C134,156 152,150 164,141 C170,135 179,141 175,148 C165,159 145,167 120,169 Z' : 'M120,158 C132,166 139,180 138,193 C137,201 127,202 125,195 C124,185 120,175 114,168 Z';   // 흔드는 손은 볼 옆으로 — 머리 뒤로 들면 가려졌다
  const handR = wave ? [172, 142] : [132, 196];
  if(wear !== 'poncho') o += `<path d="${armL}" fill="${sleeve}"${ln(sleeve)}/><path d="${armR}" fill="${sleeve}"${ln(sleeve)}/>`;
  if(wear === 'hood' || wear === 'zipup') o += `<path d="M74,156 C76,144 124,144 126,156 C116,162 84,162 74,156 Z" fill="${dk(T, .82)}"/>`;
  if(SHORT && wear !== 'poncho') o += `<circle cx="84" cy="161" r="10" fill="${wear === 'sailor' ? '#FFFFFF' : T}"/><circle cx="116" cy="161" r="10" fill="${wear === 'sailor' ? '#FFFFFF' : T}"/>`;
  /* 몸통 */
  const torso = 'M78,150 C74,168 71,186 72,200 Q100,208 128,200 C129,186 126,168 122,150 Z';
  const VEST = 'M80,152 L95,152 L97,200 Q88,203 74,199 C73,184 75,166 80,152 Z M120,152 L105,152 L103,200 Q112,203 126,199 C127,184 125,166 120,152 Z';
  if(wear === 'tank' || wear === 'bare') o += `<path d="${torso}" fill="${S}"${ln(S)}/>`;
  if(wear === 'tank') o += `<path d="M84,158 L88,152 L112,152 L116,158 C120,172 124,188 124,200 Q100,207 76,200 C76,188 80,172 84,158 Z" fill="${T}"/>`;
  else if(wear !== 'bare') o += `<path d="${torso}" fill="${wear === 'sailor' ? '#FFFFFF' : T}"${ln(wear === 'sailor' ? '#FFFFFF' : T)}/>`;
  o += gl(torso);
  if(wear === 'rash' && charm){ o += `<path d="M74,176 Q100,183 126,176 L126,183 Q100,190 74,183 Z" fill="#fff" opacity=".85"/><path d="M92,166 Q96,160 100,166 Q104,172 108,166" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`; }
  if(wear === 'hood') o += `<path d="M95,158 L94,172 M105,158 L106,172" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M84,186 Q100,192 116,186" fill="none" stroke="${dk(T, .75)}" stroke-width="2.4"/>`;
  if(wear === 'suit') o += `<path d="M100,152 L100,204" stroke="${dk(T, .7)}" stroke-width="2.4"/><path d="M74,176 L126,176" stroke="${lt(T, .35)}" stroke-width="3"/>`;
  if(wear === 'bare') o += `<circle cx="100" cy="188" r="1.8" fill="${dk(S, .75)}"/>`;
  const TC = `<clipPath id="${U}tc"><path d="${torso}"/></clipPath>`;
  if(wear === 'tee') o += `<rect x="106" y="164" width="11" height="10" rx="2" fill="none" stroke="${dk(T, .75)}" stroke-width="2"/><path d="M90,152 Q100,160 110,152" fill="none" stroke="${dk(T, .75)}" stroke-width="2.4"/>`;
  if(wear === 'shorty') o += `<path d="M100,152 L100,204" stroke="${dk(T, .7)}" stroke-width="2.4"/><path d="M76,168 Q100,174 124,168 L124,176 Q100,182 76,176 Z" fill="${lt(T, .4)}"/><path d="M71,206 L76,196 M129,206 L124,196" stroke="${lt(T, .4)}" stroke-width="4"/>`;
  if(wear === 'overall') o += `<path d="M84,170 L116,170 L119,200 Q100,207 81,200 Z" fill="${B}"/><path d="M86,171 L84,152 M114,171 L116,152" stroke="${B}" stroke-width="4.4" stroke-linecap="round"/><circle cx="86" cy="173" r="2.6" fill="#FFD23F"/><circle cx="114" cy="173" r="2.6" fill="#FFD23F"/><rect x="93" y="180" width="14" height="10" rx="2" fill="none" stroke="${dk(B, .75)}" stroke-width="2"/>`;
  if(wear === 'check') o += `${TC}<g clip-path="url(#${U}tc)" stroke="#fff" stroke-opacity=".5" stroke-width="3">${[80,90,100,110,120].map(x=>`<path d="M${x},148 L${x},210"/>`).join('')}${[160,170,180,190,200].map(y=>`<path d="M68,${y} L132,${y}"/>`).join('')}</g><path d="M88,150 L100,162 L112,150" fill="${lt(T, .3)}" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/>`;
  if(wear === 'dress'){ const sk = 'M72,186 Q100,194 128,186 L141,214 Q100,225 59,214 Z';
    o += `<path d="${sk}" fill="${T}"/>${gl(sk)}` + [[78,204],[96,210],[114,206],[128,212],[88,196],[106,198],[70,212]].map(([x, y])=>`<circle cx="${x}" cy="${y}" r="2.6" fill="#fff" opacity=".85"/>`).join('') + `<path d="M74,186 Q100,194 126,186" fill="none" stroke="${dk(T, .75)}" stroke-width="3"/><path d="M100,190 L92,184 L92,196 Z M100,190 L108,184 L108,196 Z" fill="#fff"/>`; }
  if(wear === 'knit') o += `${TC}<g clip-path="url(#${U}tc)" fill="none" stroke="${dk(T, .82)}" stroke-width="2.4">${[86,100,114].map(x=>`<path d="M${x},154 Q${x + 4},160 ${x},166 Q${x - 4},172 ${x},178 Q${x + 4},184 ${x},190 Q${x - 4},196 ${x},202"/>`).join('')}</g><path d="M73,197 Q100,205 127,197" fill="none" stroke="${dk(T, .82)}" stroke-width="5"/><path d="M88,152 Q100,160 112,152" fill="none" stroke="${dk(T, .82)}" stroke-width="4"/>`;
  if(wear === 'zipup') o += `<path d="M94,152 L106,152 L104,205 L96,205 Z" fill="#FFFFFF"/><path d="M94,152 L96,205 M106,152 L104,205" stroke="${dk(T, .7)}" stroke-width="2.2"/><path d="M92,158 L90,174 M108,158 L110,174" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><rect x="78" y="182" width="12" height="9" rx="2" fill="none" stroke="${dk(T, .75)}" stroke-width="2"/>`;
  if(wear === 'sailor') o += `<path d="M78,151 L122,151 L115,170 L100,180 L85,170 Z" fill="${T}"/><path d="M82,156 L118,156 L112,168 L100,175 L88,168 Z" fill="none" stroke="#fff" stroke-width="2"/><path d="M100,178 L94,194 L100,190 L106,194 Z" fill="#E5484D"/>`;
  if(wear === 'stripe') o += `<clipPath id="${U}to"><path d="${torso}"/></clipPath><g clip-path="url(#${U}to)" fill="#fff" opacity=".9"><rect x="60" y="160" width="80" height="6"/><rect x="60" y="174" width="80" height="6"/><rect x="60" y="188" width="80" height="6"/></g>`;
  if(wear === 'heart') o += `<path d="M100,190 C86,180 84,170 90,166 C95,163 99,166 100,170 C101,166 105,163 110,166 C116,170 114,180 100,190 Z" fill="#fff"/>`;
  if(wear === 'aloha') o += `<path d="M90,152 L100,166 L110,152" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>` + [[86,176],[112,172],[96,192],[118,190]].map(([x, y], i)=>`<g transform="translate(${x} ${y})">${[0,72,144,216,288].map(a=>`<circle cx="${Math.cos(a * Math.PI / 180) * 3.6}" cy="${Math.sin(a * Math.PI / 180) * 3.6}" r="3.2" fill="${i % 2 ? '#FFD23F' : '#fff'}"/>`).join('')}<circle r="2.2" fill="#FF6B6B"/></g>`).join('');
  if(wear === 'vest') o += `<path d="${VEST}" fill="#FF7A1C"/><path d="M76,172 L124,172 M76,188 L124,188" stroke="#2B2F45" stroke-width="3"/><rect x="95" y="168" width="10" height="8" rx="2" fill="#C9D1E0"/><rect x="95" y="184" width="10" height="8" rx="2" fill="#C9D1E0"/>`;
  if(wear === 'poncho'){ const pc = 'M58,206 C60,180 66,156 84,148 Q100,142 116,148 C134,156 140,180 142,206 Q100,214 58,206 Z';
    o += `<path d="${pc}" fill="${T}"/>${gl(pc)}<path d="M62,188 L72,180 L82,188 L92,180 L102,188 L112,180 L122,188 L132,180 L140,188" fill="none" stroke="#fff" stroke-width="3.4" stroke-linejoin="round"/>`; }
  if(pr.role === 'coach' && pr.vest !== false && wear !== 'vest' && wear !== 'poncho') o += `<path d="M80,154 L92,154 L96,198 Q88,200 76,198 C75,184 77,166 80,154 Z M120,154 L108,154 L104,198 Q112,200 124,198 C125,184 123,166 120,154 Z" fill="#FF9F1C"/><path d="M76,180 L96,180 M104,180 L124,180" stroke="#FFF4D6" stroke-width="4"/>`;
  if(gear === 'towel') o += `<path d="M75,150 Q100,167 125,150 L129,164 Q100,181 71,164 Z" fill="#FF7A7A"/><path d="M76,156 Q100,172 124,156" fill="none" stroke="#fff" stroke-width="3"/><rect x="74" y="160" width="13" height="32" rx="4" fill="#FF7A7A"/><path d="M74,170 L87,170 M74,180 L87,180" stroke="#fff" stroke-width="3"/>`;
  if(gear === 'pouch') o += `<path d="M84,152 L121,192" stroke="#2B2F45" stroke-width="2.6" stroke-linecap="round"/><rect x="111" y="184" width="24" height="18" rx="5" fill="#3FD49A"/><path d="M111,191 L135,191" stroke="#2BAA7A" stroke-width="2"/><rect x="111" y="184" width="24" height="18" rx="5" fill="url(#${U}gl)"/>`;
  if(gear === 'leash'){ o += `<rect x="103" y="219" width="16" height="7" rx="3" fill="#2B2F45"/>`;
    if(holdBoard) o += `<path d="M44,238 C50,250 57,232 63,244 C69,254 75,234 81,246 C87,254 93,236 99,244 C103,249 106,236 108,226" fill="none" stroke="#2B2F45" stroke-width="2.4" stroke-linecap="round"/>`; }
  const hR = wear === 'poncho' ? [134, 204] : handR;
  if(hold !== 'none') o += `<g transform="translate(${hR[0]} ${hR[1]})">${HOLD_SVG[hold]}</g>`;
  if(wear === 'poncho') o += `<circle cx="66" cy="204" r="8" fill="${S}"/><circle cx="134" cy="204" r="8" fill="${S}"/>`;
  else o += `<circle cx="${handL[0]}" cy="${handL[1]}" r="8.5" fill="${S}"${ln(S, 2)}/><circle cx="${handR[0]}" cy="${handR[1]}" r="8.5" fill="${S}"${ln(S, 2)}/>`;
  if(gear === 'watch') o += `<rect x="${hR[0] - 8}" y="${hR[1] - 15}" width="16" height="7" rx="3" fill="#2B2F45"/><circle cx="${hR[0]}" cy="${hR[1] - 11.5}" r="4.4" fill="#8FD3FF" stroke="#2B2F45" stroke-width="1.6"/>`;
  if(charm >= 2 && gear !== 'towel') o += `<path d="M86,151 Q100,163 114,151" fill="none" stroke="#8B6B4A" stroke-width="1.8"/><path d="M96,158 L100,168 L104,158 Z" fill="#FFF8EC" stroke="#D9C6A8" stroke-width="1"/>`;
  /* 귀 · 얼굴 */
  if(h.ears && !cover) o += `<circle cx="32" cy="110" r="11" fill="${S}"${ln(S)}/><circle cx="168" cy="110" r="11" fill="${S}"${ln(S)}/><circle cx="33" cy="111" r="5" fill="${dk(S, .9)}"/><circle cx="167" cy="111" r="5" fill="${dk(S, .9)}"/>`;
  o += `<path d="${HEAD}" fill="${S}"${ln(S)}/>${gl(HEAD)}`;
  if(h.shave) o += `<g clip-path="url(#${U}hd)"><path d="M28,70 L50,70 L48,112 L28,116 Z M172,70 L150,70 L152,112 L172,116 Z" fill="${dk(H, .9)}" opacity=".55"/></g>`;
  /* 앞머리가 이마에 드리우는 그림자 — 입체감 */
  if(charm && h.front) o += `<g clip-path="url(#${U}hd)"><path d="${h.front}" transform="translate(0 6)" fill="#8A4A3A" opacity=".16"/></g>`;
  if(charm >= 2 && acc === 'freckles' && face_ !== 'cool') o += [[56,124],[62,121],[61,128],[138,124],[144,121],[143,128]].map(([x, y])=>`<circle cx="${x}" cy="${y - 2}" r="1.6" fill="${dk(S, .72)}" opacity=".7"/>`).join('');
  o += face(face_, U, charm, es, H);
  if(acc === 'zinc') o += `<rect x="82" y="116" width="36" height="8" rx="4" fill="#fff" opacity=".92"/><path d="M50,124 L66,121 M134,121 L150,124" stroke="#fff" stroke-opacity=".9" stroke-width="5" stroke-linecap="round"/>`;
  if(acc === 'bandaid') o += `<g transform="rotate(-24 138 132)"><rect x="126" y="127" width="24" height="10" rx="5" fill="#F3C9A0"/><rect x="134" y="127" width="8" height="10" fill="#E8B88C"/></g>`;
  if(acc === 'glasses' && face_ !== 'cool') o += `<circle cx="76" cy="112" r="17" fill="#fff" fill-opacity=".14" stroke="#3A3040" stroke-width="3.2"/><circle cx="124" cy="112" r="17" fill="#fff" fill-opacity=".14" stroke="#3A3040" stroke-width="3.2"/><path d="M93,110 Q100,105 107,110" fill="none" stroke="#3A3040" stroke-width="3"/>`;
  if(acc === 'star') o += `<path d="M144,122 L146.5,128 L153,128.5 L148,132.5 L149.5,139 L144,135.5 L138.5,139 L140,132.5 L135,128.5 L141.5,128 Z" fill="#FFD23F" stroke="#F0B400" stroke-width="1"/>`;
  if(acc === 'mole') o += `<circle cx="116" cy="138" r="2.2" fill="${dk(S, .5)}"/>`;
  /* 앞머리 */
  if(h.side) o += `<path d="${h.side}" fill="${H}"/><path d="${h.side}" transform="translate(200 0) scale(-1 1)" fill="${H}"/>`;
  if(h.spikes && !cover) o += `<path d="${h.spikes}" fill="${H}"/>`;
  if(h.perm){ o += curls([[44,82],[62,70],[82,64],[100,62],[118,64],[138,70],[156,82],[36,100],[164,100]], 15) + curls([[70,48],[100,40],[130,48]], 20); }
  else o += `<path d="${h.front}" fill="${H}"${ln(H, 2.6)}/>${gl(h.front)}<clipPath id="${U}hf"><path d="${h.front}"/></clipPath><g clip-path="url(#${U}hf)" fill="none" stroke="${lt(H, .34)}" stroke-width="4.6" stroke-linecap="round"><path d="M62,58 Q72,44 86,40"/><path d="M96,36 Q104,33 112,35"/><path d="M128,40 Q138,45 144,52"/></g>`;
  if(h.braid){ o += [0,1,2,3,4,5].map(i=>`<ellipse cx="${156 + (i % 2 ? 4 : -2)}" cy="${118 + i * 15}" rx="11" ry="9" fill="${H}" stroke="${dk(H, .78)}" stroke-width="1.6"/>`).join('') + `<ellipse cx="157" cy="206" rx="6" ry="4" fill="#FF6B9A"/><path d="M151,210 Q157,224 163,210" fill="${H}"/>`; }
  if(brow !== 'none' && face_ !== 'cool'){ const bc = dk(H, .8);
    o += [76, 124].map(x=>{ const o2 = x < 100 ? -1 : 1, y = 92;
      if(brow === 'soft') return `<path d="M${x - 9},${y + 2} Q${x},${y - 3} ${x + 9},${y + 2}" fill="none" stroke="${bc}" stroke-width="3" stroke-linecap="round"/>`;
      if(brow === 'thick') return `<path d="M${x - 10},${y + 1} L${x + 10},${y + 1}" stroke="${bc}" stroke-width="5.5" stroke-linecap="round"/>`;
      return `<path d="M${x - o2 * 9},${y - 3} L${x + o2 * 9},${y + 3}" stroke="${bc}" stroke-width="3.4" stroke-linecap="round"/>`; }).join(''); }
  if(!cover){ if(h.perm) o += `<path d="M60,48 Q100,30 140,48" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="7" stroke-linecap="round"/>`;   // 나머지 머리는 앞머리 결 하이라이트가 대신
    if(charm && h.ahoge && !hat) o += `<path d="M98,28 C90,12 102,0 118,6 C106,8 102,16 105,28 Z" fill="${H}"${ln(H, 2)}/>`; }
  if(h.tie) o += `<circle cx="${h.tie[0]}" cy="${h.tie[1]}" r="7" fill="#FF6B9A"/>`;
  if(h.ties) h.ties.forEach(([x, y])=>{ o += `<circle cx="${x}" cy="${y}" r="7" fill="#FF6B9A"/><circle cx="${x - 2}" cy="${y - 2}" r="2.2" fill="#fff" opacity=".6"/>`; });
  /* 선글라스를 머리에(소품) */
  if(charm >= 2 && !hat && face_ !== 'cool' && (hk === 'short' || hk === 'surf' || hk === 'buzz')) o += `<path d="M58,58 Q60,50 70,50 L88,52 Q94,54 92,62 L88,68 Q84,72 74,71 Q62,70 58,58 Z M142,58 Q140,50 130,50 L112,52 Q106,54 108,62 L112,68 Q116,72 126,71 Q138,70 142,58 Z" fill="#1B2440"/><path d="M92,58 Q100,54 108,58" fill="none" stroke="#1B2440" stroke-width="3"/>`;
  /* 모자 */
  if(gear === 'helmet'){ const hm = 'M27,94 C27,38 62,13 100,13 C138,13 173,38 173,94 Z';
    o += `<path d="M34,112 Q58,170 100,168 Q142,170 166,112" fill="none" stroke="#2B2F45" stroke-width="2.6"/><circle cx="32" cy="104" r="15" fill="#FFD23F"/><circle cx="168" cy="104" r="15" fill="#FFD23F"/><circle cx="32" cy="104" r="6" fill="#E0B21E"/><circle cx="168" cy="104" r="6" fill="#E0B21E"/>`;
    o += `<path d="${hm}" fill="#FFD23F"/>${gl(hm)}<path d="M27,90 Q100,76 173,90 L173,96 Q100,82 27,96 Z" fill="#E0B21E"/>` + [76, 100, 124].map(x=>`<ellipse cx="${x}" cy="34" rx="4" ry="8" fill="#2B2F45" opacity=".55"/>`).join(''); }
  if(hat && HAT2[hat]) o += HC && hat === 'wave' ? HAT2[hat].svg.split('#3D8BFF').join(HC) : HC && hat === 'straw' ? HAT2[hat].svg.split('#E5484D').join(HC) : HAT2[hat].svg;
  if(hat && HATS[hat]){ const X = HATS[hat], c = HC || X.c;
    if(X.bill && hat === 'cap'){ o += `<path d="${X.d[0]}" fill="${c}"/>${gl(X.d[0])}<path d="${X.bill}" fill="${dk(c, .85)}"/><circle cx="${X.btn[0]}" cy="${X.btn[1]}" r="5.5" fill="${dk(c, .85)}"/>`; }
    if(hat === 'bucket'){ o += `<path d="${X.d[0]}" fill="${c}"/>${gl(X.d[0])}<ellipse cx="${X.brim[0]}" cy="${X.brim[1]}" rx="${X.brim[2]}" ry="${X.brim[3]}" fill="${c}"/><path d="${X.band}" fill="${dk(c, .8)}"/>`; }
    if(hat === 'visor'){ o += `<path d="${X.d[0]}" fill="${c}"/><path d="${X.bill}" fill="${dk(c, .94)}"/>`; }
    if(hat === 'beanie'){ o += `<path d="${X.d[0]}" fill="${c}"/>${gl(X.d[0])}<rect x="${X.cuff[0]}" y="${X.cuff[1]}" width="${X.cuff[2]}" height="${X.cuff[3]}" rx="12" fill="#F7F3EA"/><circle cx="${X.pom[0]}" cy="${X.pom[1]}" r="11" fill="#F7F3EA"/>`; } }
  o += '</g>';
  /* 금빛 반짝이 — 칭찬받는 순간처럼. 외곽선 없이 가볍게 */
  if(charm >= 2 && face_ !== 'sleepy') o += [[180, 34, 7], [192, 56, 4.4]].map(([x, y, r])=>`<path d="M${x},${y - r} Q${x + r * .18},${y - r * .18} ${x + r},${y} Q${x + r * .18},${y + r * .18} ${x},${y + r} Q${x - r * .18},${y + r * .18} ${x - r},${y} Q${x - r * .18},${y - r * .18} ${x},${y - r} Z" fill="#F2B632"/>`).join('');
  if(pet) o += '</g>';
  const W = pet ? 320 : 200, VB = opt.view && VIEWS[opt.view];
  if(VB){ const [, , vw, vh] = VB.split(' ').map(Number); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}" width="${vw * 2}" height="${vh * 2}">${o}</svg>`; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 250" width="${W}" height="250">${o}</svg>`;
}
window.mochiSVG = mochiSVG;
/* 꾸미기 목록에 얹기 — sprite.js(도트, 게임·라인업 앱과 공유)의 목록에 새 머리·펫을 더하고, 도트로 그릴 땐 가까운 모양을 빌려 쓴다 */
const WEAR_NEW = { tee:'반팔 티', shorty:'스프링슈트', overall:'멜빵', check:'체크셔츠', dress:'원피스', knit:'니트', zipup:'후드집업', sailor:'세일러' };
try{ if(typeof WEAR === 'object') Object.entries(WEAR_NEW).forEach(([k, ko])=>{ if(!WEAR[k]){ WEAR[k] = { ko, rows:WEAR.rash.rows }; WEAR_KO[k] = ko; } }); }catch(e){}
try{ if(typeof TOPS === 'object') Object.entries(TOP_KO_).forEach(([k, ko])=>{ if(!TOPS[k]){ TOPS[k] = TOP_[k]; TOP_KO[k] = ko; } }); }catch(e){}
try{ if(typeof BOTTOMS === 'object') Object.entries(BOT_KO_).forEach(([k, ko])=>{ if(!BOTTOMS[k]){ BOTTOMS[k] = BOT_[k]; BOTTOM_KO[k] = ko; } }); }catch(e){}
window.mochiItem = (pr, key, v)=>{ const view = VIEW_OF(key, v); if(!view) return ''; return mochiSVG({ ...pr, [key]:v }, { charm:2, pet:key === 'pet', view, uid:'z' }); };
const HAIR_NEW = { bun:['bob','똥머리'], halfup:['long','반묶음'], pixie:['short','숏컷'], perm:['wave','뽀글펌'], braid:['bob','땋은머리'], twoblock:['short','투블럭'], hime:['long','히메컷'] };
try{ if(typeof HAIR === 'object') Object.entries(HAIR_NEW).forEach(([k, [fb, ko]])=>{ if(!HAIR[k]){ HAIR[k] = HAIR[fb]; HAIR_KO[k] = ko; } }); }catch(e){}
try{ if(typeof PET === 'object'){ if(!PET.otter){ PET.otter = PET.seal; PET_ACC.otter = PET_ACC.seal; PET_KO.otter = '해달'; } if(!PET.turtle){ PET.turtle = PET.penguin; PET_ACC.turtle = PET_ACC.penguin; PET_KO.turtle = '거북이'; } } }catch(e){}
window.MOCHI_OPT = {
  fshape:{ mochi:'모찌', round:'동글', oval:'갸름', square:'각진', peach:'복숭아' },
  eye:{ sparkle:'반짝', dot:'점눈', cat:'고양이눈', droopy:'처진눈', star:'별눈', lash:'속눈썹' },
  brow:{ none:'없음', soft:'둥근', thick:'짙은', sad:'팔자' },
  petv:{ dog:['리트리버','시바','비글','푸들'], cat:['치즈','턱시도','삼색','샴'], rabbit:['기본','롭이어','라이언헤드','더치'], penguin:['기본','황제','아델리','마카로니'],
    seal:['점박이','아기 물범','바다사자','회색'], otter:['조개','불가사리','수달','아기 해달'], turtle:['육지','바다거북','별무늬','아기'] },
  hold:{ none:'없음', coffee:'아이스 아메리카노', coconut:'코코넛 음료', gopro:'액션캠', wax:'서프 왁스', shell:'소라', flag:'양서학 깃발' },
  gear:{ none:'없음', leash:'리쉬', booties:'서핑 부츠', helmet:'서핑 헬멧', towel:'비치타월', watch:'방수 시계', pouch:'방수 파우치', fins:'트라이 핀' },
  acc:{ freckles:'주근깨', none:'없음', zinc:'서퍼 선크림', bandaid:'반창고', glasses:'동그란 안경', star:'별 스티커', mole:'점' },
};
})();
