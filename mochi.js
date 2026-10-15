/* ═══════════ 모찌 미니미 — 캐릭터 그리기 (SVG) ═══════════
   아래가 통통한 모찌 얼굴 · 얼굴 아래쪽의 크고 반짝이는 세로 눈 · 짧은 몸 · 쪼리.
   그림체만 바꾸던 이전과 달리 '생김새' 자체를 손으로 다시 그렸다(캐릭터 시안 /charface 1번 → 매력 다듬기 /charmochi).
   mochiSVG(profile, { charm, pet }) → SVG 문자열. 앱(sprite.js)은 이 SVG 를 그림으로 바꿔 캔버스에 그린다.
   좌표: 사람 200×250, 펫이 있으면 왼쪽에 120 을 더 붙여 320×250.
   남의 프로필 값은 전부 아래 표(HAIR·HAT·…)의 키로만 쓰고, 색은 #RRGGBB 만 받는다 — SVG 안에 문자열이 그대로 들어가지 않게. */
(function(){
const HEXOK = c => /^#[0-9a-f]{6}$/i.test(String(c || '')) ? c : null;
const dk = (hex, f)=>'#' + hex.slice(1).match(/../g).map(h=>Math.max(0, Math.min(255, Math.round(parseInt(h, 16) * f))).toString(16).padStart(2, '0')).join('');
const lt = (hex, t)=>'#' + hex.slice(1).match(/../g).map(h=>{ const v = parseInt(h, 16); return Math.round(v + (255 - v) * t).toString(16).padStart(2, '0'); }).join('');

const SKIN_ = { l:'#FFE3CC', s:'#FBD3B5', d:'#E2A57D', t:'#B5774D' };
const HAIR_ = { k:'#2E2420', n:'#6B4A33', y:'#E8C46A', r:'#C4522F', b:'#3C6BB0', p:'#E07BB2', g:'#3FA36B', w:'#E9E3D8' };
const TOP_ = { r:'#FF7A7A', b:'#3D6DF2', g:'#3FD49A', p:'#9B6BFF', y:'#FFD23F', k:'#2B2F45', w:'#FFFFFF', o:'#FF9F1C' };
const BOT_ = { b:'#4F7BFF', k:'#2B2F45', r:'#FF6B6B', g:'#3FD49A', p:'#9B6BFF', t:'#E2B96A' };
const BRD_ = { y:'#FFD23F', w:'#FFFFFF', c:'#8FD3FF', g:'#A6F542', p:'#FF9BD2', o:'#FF9F1C' };
const PETC_ = { p:'#FFC2D9', y:'#FFE3B0', w:'#F4F6F9', n:'#C98A5B', g:'#A8F0D8', k:'#7A748A' };

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

function face(F, U, charm){
  const E = '#2A1F2B', ey = 112, X = [76, 124]; let o = '';
  /* 볼 + 빗금 */
  [62, 138].forEach(cx=>{ o += `<ellipse cx="${cx}" cy="${ey + 17}" rx="13.5" ry="7.5" fill="#FF8FA3" opacity=".5"/>`;
    if(charm) o += [-5, 0, 5].map(d=>`<path d="M${cx + d - 2},${ey + 20} L${cx + d + 2},${ey + 14}" stroke="#FF6F8A" stroke-width="1.8" stroke-linecap="round" opacity=".55"/>`).join(''); });
  const eye = (x, big)=>{ const k = big ? 1.1 : 1;
    let s = `<ellipse cx="${x}" cy="${ey}" rx="${10 * k}" ry="${13 * k}" fill="${E}"/><ellipse cx="${x}" cy="${ey + 3.5}" rx="${7.4 * k}" ry="${8.4 * k}" fill="url(#${U}iris)"/>`;
    s += `<circle cx="${x + 3.8 * k}" cy="${ey - 5.4 * k}" r="${4.8 * k}" fill="#fff"/><circle cx="${x - 3.6}" cy="${ey + 5.6}" r="2.1" fill="#fff" opacity=".9"/>`;
    if(charm){ const out = x < 100 ? -1 : 1; s += `<path d="M${x - 10.5},${ey - 6} Q${x},${ey - 15.5} ${x + 10.5},${ey - 6}" fill="none" stroke="${E}" stroke-width="3" stroke-linecap="round"/><path d="M${x + out * 9.5},${ey - 7.5} L${x + out * 14},${ey - 10.5}" stroke="${E}" stroke-width="2.6" stroke-linecap="round"/>`; }
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

function petSVG(kind, c, lv, U){
  const m = dk(c, .78), E = '#2A1F2B', W = '#FFFFFF';
  const eyes = (y, xs)=>xs.map(x=>`<ellipse cx="${x}" cy="${y}" rx="5.4" ry="6.6" fill="${E}"/><circle cx="${x + 2}" cy="${y - 2.6}" r="2.2" fill="#fff"/>`).join('');
  let o = `<ellipse cx="60" cy="242" rx="36" ry="5" fill="#12245F" opacity=".12"/>`, ey = 176, ex = [48, 72];
  if(kind === 'penguin'){
    o += `<path d="M60,140 C88,140 96,176 94,206 C92,232 78,240 60,240 C42,240 28,232 26,206 C24,176 32,140 60,140 Z" fill="${c}"/><path d="M60,166 C78,166 82,190 80,212 C78,230 70,236 60,236 C50,236 42,230 40,212 C38,190 42,166 60,166 Z" fill="${W}"/>`;
    o += `<path d="M28,190 C18,200 18,214 24,222 C30,214 32,204 34,196 Z" fill="${m}"/><path d="M92,190 C102,200 102,214 96,222 C90,214 88,204 86,196 Z" fill="${m}"/>`;
    o += `<ellipse cx="50" cy="240" rx="9" ry="4" fill="#FF9F1C"/><ellipse cx="70" cy="240" rx="9" ry="4" fill="#FF9F1C"/>`;
    ey = 166; ex = [49, 71]; o += eyes(ey, ex) + `<path d="M54,176 L66,176 L60,184 Z" fill="#FF9F1C"/>`;
  } else if(kind === 'seal'){
    o += `<path d="M20,236 C14,200 26,152 60,150 C94,152 106,200 100,236 Z" fill="${c}"/><path d="M14,220 C4,226 4,236 12,240 C18,236 22,230 24,224 Z" fill="${m}"/><path d="M106,220 C116,226 116,236 108,240 C102,236 98,230 96,224 Z" fill="${m}"/>`;
    ey = 178; ex = [47, 73]; o += eyes(ey, ex) + `<ellipse cx="60" cy="194" rx="12" ry="8" fill="${W}"/><ellipse cx="60" cy="189" rx="4.4" ry="3.2" fill="${E}"/>`;
    o += [[-1],[1]].map(([s])=>[-3, 3].map(d=>`<path d="M${60 + s * 12},${194 + d} L${60 + s * 26},${192 + d * 2}" stroke="${E}" stroke-opacity=".45" stroke-width="1.4"/>`).join('')).join('');
  } else {
    o += `<ellipse cx="60" cy="214" rx="28" ry="24" fill="${c}"/><ellipse cx="60" cy="220" rx="16" ry="15" fill="${W}"/><ellipse cx="46" cy="236" rx="9" ry="5.5" fill="${c}"/><ellipse cx="74" cy="236" rx="9" ry="5.5" fill="${c}"/>`;
    if(kind === 'cat') o += `<path d="M86,224 C104,222 108,200 98,192" fill="none" stroke="${m}" stroke-width="7" stroke-linecap="round"/>`;
    if(kind === 'rabbit') o += `<ellipse cx="48" cy="128" rx="9" ry="26" fill="${c}" transform="rotate(-8 48 128)"/><ellipse cx="72" cy="128" rx="9" ry="26" fill="${c}" transform="rotate(8 72 128)"/><ellipse cx="48" cy="130" rx="4.5" ry="18" fill="#FFC2D2" transform="rotate(-8 48 130)"/><ellipse cx="72" cy="130" rx="4.5" ry="18" fill="#FFC2D2" transform="rotate(8 72 130)"/>`;
    if(kind === 'cat') o += `<path d="M30,160 L34,130 L56,148 Z M90,160 L86,130 L64,148 Z" fill="${c}"/><path d="M35,152 L37,138 L48,148 Z M85,152 L83,138 L72,148 Z" fill="#FFC2D2"/>`;
    o += `<path d="M60,144 C86,144 96,160 96,178 C96,198 80,206 60,206 C40,206 24,198 24,178 C24,160 34,144 60,144 Z" fill="${c}"/>`;
    if(kind === 'dog') o += `<ellipse cx="26" cy="174" rx="10" ry="20" fill="${m}" transform="rotate(18 26 174)"/><ellipse cx="94" cy="174" rx="10" ry="20" fill="${m}" transform="rotate(-18 94 174)"/>`;
    o += `<path d="M60,144 C86,144 96,160 96,178 C96,198 80,206 60,206 C40,206 24,198 24,178 C24,160 34,144 60,144 Z" fill="url(#${U}gl)"/>`;
    o += eyes(ey, ex) + `<ellipse cx="60" cy="192" rx="12" ry="8.5" fill="${W}"/><ellipse cx="60" cy="187" rx="4.6" ry="3.4" fill="${E}"/>`;
    if(kind === 'dog') o += `<ellipse cx="60" cy="199" rx="4" ry="5" fill="#FF7A95"/>`;
    if(kind === 'rabbit') o += `<rect x="56.5" y="193" width="7" height="6" rx="1.5" fill="#fff" stroke="#D8D2E0" stroke-width="1"/>`;
    if(kind === 'cat') o += [[-1],[1]].map(([s])=>[-3, 3].map(d=>`<path d="M${60 + s * 10},${192 + d} L${60 + s * 24},${190 + d * 2}" stroke="${E}" stroke-opacity=".45" stroke-width="1.4"/>`).join('')).join('');
  }
  if(lv >= 1) o += ex.map(x=>`<ellipse cx="${x + (x < 60 ? -8 : 8)}" cy="${ey + 10}" rx="6" ry="3.6" fill="#FF8FA3" opacity=".55"/>`).join('');
  if(lv >= 2) o += `<path d="M36,${kind === 'penguin' ? 186 : 204} Q60,${kind === 'penguin' ? 196 : 214} 84,${kind === 'penguin' ? 186 : 204} L84,${kind === 'penguin' ? 194 : 212} Q60,${kind === 'penguin' ? 204 : 222} 36,${kind === 'penguin' ? 194 : 212} Z" fill="#FF5A5A"/>`;
  if(lv >= 3) o += ex.map(x=>`<rect x="${x - 9}" y="${ey - 7}" width="18" height="13" rx="5" fill="#1B2440"/>`).join('') + `<path d="M${ex[0] + 9},${ey - 3} L${ex[1] - 9},${ey - 3}" stroke="#1B2440" stroke-width="3"/>`;
  return o;
}

let seq = 0;
function mochiSVG(pr, opt){
  pr = pr || {}; opt = opt || {};
  const charm = opt.charm == null ? 2 : opt.charm, U = opt.uid || 'm' + (seq++).toString(36);
  const S = SKIN_[pr.skin] || SKIN_.s, H = HAIR_[pr.hairc] || HAIR_.k, T = TOP_[pr.top] || TOP_.r, B = BOT_[pr.bottom] || BOT_.b;
  const BD = BRD_[pr.boardc] || (typeof BOARDC === 'object' && Object.prototype.hasOwnProperty.call(BOARDC, pr.boardc) && HEXOK(BOARDC[pr.boardc])) || BRD_.y;
  const hk = HAIRS[pr.hair] ? pr.hair : (pr.gender === 'm' ? 'short' : 'bob'), h = HAIRS[hk];
  const wear = ['rash','hood','tank','suit','bare','stripe','heart','aloha','vest','poncho'].includes(pr.wear) ? pr.wear : 'rash';
  const hat = HATS[pr.hat] || HAT2[pr.hat] ? pr.hat : null, cover = hat && (HATS[hat] || HAT2[hat].cover) && !['cap','visor'].includes(hat);
  const face_ = ['smile','happy','cool','wow','wink','sleepy'].includes(pr.face) ? pr.face : 'smile';
  const pet = opt.pet && ['dog','cat','rabbit','penguin','seal'].includes(pr.pet) ? pr.pet : null;
  const holdBoard = charm >= 2 && opt.board !== false, wave = charm >= 1 && !holdBoard;
  const gl = d=>`<path d="${d}" fill="url(#${U}gl)"/>`;
  const sleeve = wear === 'tank' || wear === 'bare' ? S : T;
  let o = `<defs><radialGradient id="${U}gl" cx=".32" cy=".26" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity=".08"/><stop offset=".8" stop-color="#000030" stop-opacity=".05"/><stop offset="1" stop-color="#000030" stop-opacity=".22"/></radialGradient>
    <linearGradient id="${U}iris" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A1F2B" stop-opacity="0"/><stop offset="1" stop-color="#8A5A3E"/></linearGradient>
    <clipPath id="${U}hd"><path d="M100,36 C142,36 168,62 169,99 C170,138 143,161 100,161 C57,161 30,138 31,99 C32,62 58,36 100,36Z"/></clipPath></defs>`;
  if(pet) o += `<g>${petSVG(pet, PETC_[pr.petc] || PETC_.y, Math.max(0, Math.min(3, +pr.petLv || 0)), U)}</g><g transform="translate(120 0)">`;
  o += `<ellipse cx="100" cy="242" rx="42" ry="6" fill="#12245F" opacity=".14"/>`;
  /* 옆에 낀 서핑보드(뒤) */
  if(holdBoard){ const bd = 'M24,112 C24,86 34,70 44,70 C54,70 64,86 64,112 L64,214 C64,232 54,242 44,242 C34,242 24,232 24,214 Z';
    const pat = ['stringer','racing','flower','flame'].includes(pr.bpat) ? pr.bpat : null;
    o += `<path d="${bd}" fill="${BD}"/><clipPath id="${U}bd"><path d="${bd}"/></clipPath><g clip-path="url(#${U}bd)">`;
    if(pat === 'racing') o += `<path d="M20,118 L68,104 L68,116 L20,130 Z M20,138 L68,124 L68,132 L20,146 Z" fill="#FF4B4B"/>`;
    if(pat === 'flower') o += [[36,100],[52,128],[34,160],[54,190],[38,214]].map(([x, y], i)=>`<g transform="translate(${x} ${y})">${[0,72,144,216,288].map(a=>`<circle cx="${Math.cos(a * Math.PI / 180) * 4}" cy="${Math.sin(a * Math.PI / 180) * 4}" r="3.6" fill="${i % 2 ? '#FF8FB8' : '#fff'}"/>`).join('')}<circle r="2.6" fill="#FFD23F"/></g>`).join('');
    if(pat === 'flame') o += `<path d="M20,246 L20,200 Q28,214 32,196 Q36,176 42,190 Q46,170 50,186 Q56,168 58,192 Q62,182 68,198 L68,246 Z" fill="#FF9F1C"/><path d="M20,246 L20,218 Q30,226 34,212 Q40,200 46,214 Q52,202 56,216 Q62,208 68,220 L68,246 Z" fill="#FF4B4B"/>`;
    if(pr.boardc === 'legend') o += [[34,96],[54,140],[36,186]].map(([x, y])=>`<path d="M${x},${y - 7} L${x + 2},${y - 2} L${x + 7},${y} L${x + 2},${y + 2} L${x},${y + 7} L${x - 2},${y + 2} L${x - 7},${y} L${x - 2},${y - 2} Z" fill="#fff" opacity=".85"/>`).join('');
    o += `</g>${gl(bd)}<path d="M44,74 L44,238" stroke="${pat === 'stringer' ? '#fff' : dk(BD, .78)}" stroke-width="${pat === 'stringer' ? 4 : 2.4}"/><path d="M38,226 L44,240 L50,226 Z" fill="${dk(BD, .7)}"/>`; }
  /* 뒷머리 · 꽁지 */
  if(h.back) o += `<path d="${h.back}" fill="${H}"/>${gl(h.back)}`;
  if(h.tail) o += `<path d="${h.tail}" fill="${H}"/>${gl(h.tail)}`;
  if(h.tails) h.tails.forEach(d=>{ o += `<path d="${d}" fill="${H}"/>${gl(d)}`; });
  /* 다리 · 쪼리 */
  const legC = wear === 'suit' ? T : S;
  o += `<rect x="83" y="206" width="14" height="26" rx="7" fill="${legC}"/><rect x="103" y="206" width="14" height="26" rx="7" fill="${legC}"/>`;
  [89, 111].forEach(x=>{ o += `<ellipse cx="${x}" cy="237" rx="12.5" ry="5" fill="${dk(BD, .92)}"/><ellipse cx="${x}" cy="233" rx="9" ry="5.5" fill="${S}"/><path d="M${x - 6},234 L${x},228 L${x + 6},234" fill="none" stroke="${dk(BD, .75)}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`; });
  /* 반바지 */
  if(wear !== 'suit'){ const sh = 'M71,192 Q100,201 129,192 L131,212 Q118,217 104,215 L100,207 L96,215 Q82,217 69,212 Z';
    o += `<path d="${sh}" fill="${B}"/><path d="M73,200 L71,211 M127,200 L129,211" stroke="#fff" stroke-opacity=".75" stroke-width="3" stroke-linecap="round"/>`;
    if(charm) o += [[80,204],[90,209],[112,209],[121,204]].map(([x, y])=>`<circle cx="${x}" cy="${y}" r="2" fill="#fff" opacity=".55"/>`).join(''); }
  /* 팔 — 왼팔은 내리거나 보드를 잡고, 오른팔은 손 흔들기 */
  const armL = holdBoard ? 'M80,158 C66,162 56,170 52,180 C50,188 58,192 63,186 C68,178 76,172 86,168 Z' : 'M80,158 C68,166 61,180 62,193 C63,201 73,202 75,195 C76,185 80,175 86,168 Z';
  const handL = holdBoard ? [56, 184] : [68, 196];
  const armR = wave ? 'M118,157 C134,156 152,150 164,141 C170,135 179,141 175,148 C165,159 145,167 120,169 Z' : 'M120,158 C132,166 139,180 138,193 C137,201 127,202 125,195 C124,185 120,175 114,168 Z';   // 흔드는 손은 볼 옆으로 — 머리 뒤로 들면 가려졌다
  const handR = wave ? [172, 142] : [132, 196];
  if(wear !== 'poncho') o += `<path d="${armL}" fill="${sleeve}"/><path d="${armR}" fill="${sleeve}"/>`;
  if(wear === 'hood') o += `<path d="M74,156 C76,144 124,144 126,156 C116,162 84,162 74,156 Z" fill="${dk(T, .82)}"/>`;
  /* 몸통 */
  const torso = 'M78,150 C74,168 71,186 72,200 Q100,208 128,200 C129,186 126,168 122,150 Z';
  const VEST = 'M80,152 L95,152 L97,200 Q88,203 74,199 C73,184 75,166 80,152 Z M120,152 L105,152 L103,200 Q112,203 126,199 C127,184 125,166 120,152 Z';
  if(wear === 'tank' || wear === 'bare') o += `<path d="${torso}" fill="${S}"/>`;
  if(wear === 'tank') o += `<path d="M84,158 L88,152 L112,152 L116,158 C120,172 124,188 124,200 Q100,207 76,200 C76,188 80,172 84,158 Z" fill="${T}"/>`;
  else if(wear !== 'bare') o += `<path d="${torso}" fill="${T}"/>`;
  o += gl(torso);
  if(wear === 'rash' && charm){ o += `<path d="M74,176 Q100,183 126,176 L126,183 Q100,190 74,183 Z" fill="#fff" opacity=".85"/><path d="M92,166 Q96,160 100,166 Q104,172 108,166" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`; }
  if(wear === 'hood') o += `<path d="M95,158 L94,172 M105,158 L106,172" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M84,186 Q100,192 116,186" fill="none" stroke="${dk(T, .75)}" stroke-width="2.4"/>`;
  if(wear === 'suit') o += `<path d="M100,152 L100,204" stroke="${dk(T, .7)}" stroke-width="2.4"/><path d="M74,176 L126,176" stroke="${lt(T, .35)}" stroke-width="3"/>`;
  if(wear === 'bare') o += `<circle cx="100" cy="188" r="1.8" fill="${dk(S, .75)}"/>`;
  if(wear === 'stripe') o += `<clipPath id="${U}to"><path d="${torso}"/></clipPath><g clip-path="url(#${U}to)" fill="#fff" opacity=".9"><rect x="60" y="160" width="80" height="6"/><rect x="60" y="174" width="80" height="6"/><rect x="60" y="188" width="80" height="6"/></g>`;
  if(wear === 'heart') o += `<path d="M100,190 C86,180 84,170 90,166 C95,163 99,166 100,170 C101,166 105,163 110,166 C116,170 114,180 100,190 Z" fill="#fff"/>`;
  if(wear === 'aloha') o += `<path d="M90,152 L100,166 L110,152" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>` + [[86,176],[112,172],[96,192],[118,190]].map(([x, y], i)=>`<g transform="translate(${x} ${y})">${[0,72,144,216,288].map(a=>`<circle cx="${Math.cos(a * Math.PI / 180) * 3.6}" cy="${Math.sin(a * Math.PI / 180) * 3.6}" r="3.2" fill="${i % 2 ? '#FFD23F' : '#fff'}"/>`).join('')}<circle r="2.2" fill="#FF6B6B"/></g>`).join('');
  if(wear === 'vest') o += `<path d="${VEST}" fill="#FF7A1C"/><path d="M76,172 L124,172 M76,188 L124,188" stroke="#2B2F45" stroke-width="3"/><rect x="95" y="168" width="10" height="8" rx="2" fill="#C9D1E0"/><rect x="95" y="184" width="10" height="8" rx="2" fill="#C9D1E0"/>`;
  if(wear === 'poncho'){ const pc = 'M58,206 C60,180 66,156 84,148 Q100,142 116,148 C134,156 140,180 142,206 Q100,214 58,206 Z';
    o += `<path d="${pc}" fill="${T}"/>${gl(pc)}<path d="M62,188 L72,180 L82,188 L92,180 L102,188 L112,180 L122,188 L132,180 L140,188" fill="none" stroke="#fff" stroke-width="3.4" stroke-linejoin="round"/>`; }
  if(pr.role === 'coach' && pr.vest !== false && wear !== 'vest' && wear !== 'poncho') o += `<path d="M80,154 L92,154 L96,198 Q88,200 76,198 C75,184 77,166 80,154 Z M120,154 L108,154 L104,198 Q112,200 124,198 C125,184 123,166 120,154 Z" fill="#FF9F1C"/><path d="M76,180 L96,180 M104,180 L124,180" stroke="#FFF4D6" stroke-width="4"/>`;
  if(wear === 'poncho') o += `<circle cx="66" cy="204" r="8" fill="${S}"/><circle cx="134" cy="204" r="8" fill="${S}"/>`;
  else o += `<circle cx="${handL[0]}" cy="${handL[1]}" r="8.5" fill="${S}"/><circle cx="${handR[0]}" cy="${handR[1]}" r="8.5" fill="${S}"/>`;
  if(charm >= 2) o += `<path d="M86,151 Q100,163 114,151" fill="none" stroke="#8B6B4A" stroke-width="1.8"/><path d="M96,158 L100,168 L104,158 Z" fill="#FFF8EC" stroke="#D9C6A8" stroke-width="1"/>`;
  /* 귀 · 얼굴 */
  if(h.ears && !cover) o += `<circle cx="32" cy="110" r="11" fill="${S}"/><circle cx="168" cy="110" r="11" fill="${S}"/><circle cx="33" cy="111" r="5" fill="${dk(S, .9)}"/><circle cx="167" cy="111" r="5" fill="${dk(S, .9)}"/>`;
  const head = 'M100,36 C142,36 168,62 169,99 C170,138 143,161 100,161 C57,161 30,138 31,99 C32,62 58,36 100,36Z';
  o += `<path d="${head}" fill="${S}"/>${gl(head)}`;
  /* 앞머리가 이마에 드리우는 그림자 — 입체감 */
  if(charm && h.front) o += `<g clip-path="url(#${U}hd)"><path d="${h.front}" transform="translate(0 6)" fill="#8A4A3A" opacity=".16"/></g>`;
  if(charm >= 2 && face_ !== 'cool') o += [[56,124],[62,121],[61,128],[138,124],[144,121],[143,128]].map(([x, y])=>`<circle cx="${x}" cy="${y - 2}" r="1.6" fill="${dk(S, .72)}" opacity=".7"/>`).join('');
  o += face(face_, U, charm);
  /* 앞머리 */
  if(h.side) o += `<path d="${h.side}" fill="${H}"/><path d="${h.side}" transform="translate(200 0) scale(-1 1)" fill="${H}"/>`;
  if(h.spikes && !cover) o += `<path d="${h.spikes}" fill="${H}"/>`;
  o += `<path d="${h.front}" fill="${H}"/>${gl(h.front)}`;
  if(!cover){ o += `<path d="M60,48 Q100,30 140,48" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="7" stroke-linecap="round"/><path d="M128,40 Q136,42 142,48" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>`;
    if(charm && h.ahoge && !hat) o += `<path d="M98,28 C90,12 102,0 118,6 C106,8 102,16 105,28 Z" fill="${H}"/>`; }
  if(h.tie) o += `<circle cx="${h.tie[0]}" cy="${h.tie[1]}" r="7" fill="#FF6B9A"/>`;
  if(h.ties) h.ties.forEach(([x, y])=>{ o += `<circle cx="${x}" cy="${y}" r="7" fill="#FF6B9A"/><circle cx="${x - 2}" cy="${y - 2}" r="2.2" fill="#fff" opacity=".6"/>`; });
  /* 선글라스를 머리에(소품) */
  if(charm >= 2 && !hat && face_ !== 'cool' && (hk === 'short' || hk === 'surf' || hk === 'buzz')) o += `<path d="M58,58 Q60,50 70,50 L88,52 Q94,54 92,62 L88,68 Q84,72 74,71 Q62,70 58,58 Z M142,58 Q140,50 130,50 L112,52 Q106,54 108,62 L112,68 Q116,72 126,71 Q138,70 142,58 Z" fill="#1B2440"/><path d="M92,58 Q100,54 108,58" fill="none" stroke="#1B2440" stroke-width="3"/>`;
  /* 모자 */
  if(hat && HAT2[hat]) o += HAT2[hat].svg;
  if(hat && HATS[hat]){ const X = HATS[hat], c = hat === 'cap' || hat === 'beanie' ? X.c : X.c;
    if(X.bill && hat === 'cap'){ o += `<path d="${X.d[0]}" fill="${c}"/>${gl(X.d[0])}<path d="${X.bill}" fill="${dk(c, .85)}"/><circle cx="${X.btn[0]}" cy="${X.btn[1]}" r="5.5" fill="${dk(c, .85)}"/>`; }
    if(hat === 'bucket'){ o += `<path d="${X.d[0]}" fill="${c}"/>${gl(X.d[0])}<ellipse cx="${X.brim[0]}" cy="${X.brim[1]}" rx="${X.brim[2]}" ry="${X.brim[3]}" fill="${c}"/><path d="${X.band}" fill="${dk(c, .8)}"/>`; }
    if(hat === 'visor'){ o += `<path d="${X.d[0]}" fill="#fff"/><path d="${X.bill}" fill="#F0F4FA"/>`; }
    if(hat === 'beanie'){ o += `<path d="${X.d[0]}" fill="${c}"/>${gl(X.d[0])}<rect x="${X.cuff[0]}" y="${X.cuff[1]}" width="${X.cuff[2]}" height="${X.cuff[3]}" rx="12" fill="#F7F3EA"/><circle cx="${X.pom[0]}" cy="${X.pom[1]}" r="11" fill="#F7F3EA"/>`; } }
  if(pet) o += '</g>';
  const W = pet ? 320 : 200;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 250" width="${W}" height="250">${o}</svg>`;
}
window.mochiSVG = mochiSVG;
})();
