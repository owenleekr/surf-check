/* 강원 해변 마을 풍경 — 원정(quest.js)의 장면 그림을 게임 배경으로 함께 쓴다.
   원정 쪽 그림은 CSS 애니메이션·카메라 층이 붙어 있어 그대로 두고, 여기엔 같은 부품을 복사해 "멈춘 한 장"으로만 굽는다.
   캔버스 게임은 매 프레임 SVG 를 해석하면 느리므로 장면·크기마다 한 번만 오프스크린 캔버스로 구워 drawImage 한다. */
(()=>{
const HZ = 118, H = 240;
const PLACES = ['아야진','천진','속초','낙산','죽도','하조대','주문진','경포','정동진','망상','장호항'];
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
const pine = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><path d="M-1 0Q-2 -8 1 -14Q3 -18 2 -22L3.2 -22Q4.5 -17 2.6 -13Q.6 -8 1.4 0Z"/><ellipse cx="2" cy="-22" rx="9" ry="2.6"/><ellipse cx="-3" cy="-17" rx="6" ry="2.2"/><ellipse cx="7" cy="-15.5" rx="5" ry="2"/><ellipse cx="3" cy="-26" rx="5" ry="2"/></g>`;
const pav = (x, y, s, c, lit) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-9" y="-2" width="18" height="2" fill="${c}"/><rect x="-7.5" y="-10" width="1.4" height="8" fill="${c}"/><rect x="6.1" y="-10" width="1.4" height="8" fill="${c}"/><rect x="-2.6" y="-10" width="1.1" height="8" fill="${c}"/><rect x="1.5" y="-10" width="1.1" height="8" fill="${c}"/><path d="M-13.5 -9Q-10.5 -10 -9 -11.6L-4.6 -16.4H4.6L9 -11.6Q10.5 -10 13.5 -9Q12 -11.6 10.4 -12.2L5.2 -18H-5.2L-10.4 -12.2Q-12 -11.6 -13.5 -9Z" fill="${c}"/><path d="M-5.2 -18H5.2" stroke="${lit}" stroke-width=".8" opacity=".9"/></g>`;   // 정자 — 처마 끝이 살짝 들린 한옥 지붕
const lighthouse = (x, y, s, body, band, P) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-3 0L-2 -16H2L3 0Z" fill="${body}"/><rect x="-2.6" y="-11" width="5.2" height="2" fill="${band}"/><rect x="-2.3" y="-6" width="4.6" height="2" fill="${band}"/><rect x="-2.6" y="-20" width="5.2" height="4" fill="${band}"/><path d="M-3 -20L0 -23L3 -20Z" fill="${band}"/><circle cy="-18" r="1.3" fill="${P.win}"/>${P.night ? `<path class="qbm" d="M0 -18L-46 -26V-10Z" fill="${P.win}" opacity=".2"/><circle cy="-18" r="5" fill="${P.win}" opacity=".3"/>` : ''}</g>`;
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
      L.mid = `<path d="M-12 ${HZ - 8}Q30 ${HZ - 12} 70 ${HZ - 4}L96 ${HZ + 2}H-12Z" fill="${P.near}"/>${houses(-2, HZ - 5, 8, P, 3)}<rect x="66" y="${HZ + 1}" width="44" height="2.4" fill="${P.mid}"/>${lighthouse(108, HZ + 2, .8, '#E25A4A', '#F6F1E8', P)}`;
      L.sea = rocks(176, 132, 34, 8, P, 1) + rocks(196, 136, 40, 10, P, 2) + `<circle class="qsp" cx="200" cy="128" r="2.5" fill="${P.crest}"/><circle class="qsp" style="animation-delay:-1.2s" cx="214" cy="131" r="2" fill="${P.crest}"/>`;
      L.fg = sandFg(P, 224) + rocks(-14, 244, 46, 22, { near:P.fg, lit:P.lit }, 4) + `<path d="M222 240q2 -14 6 -20M228 240q0 -12 -5 -18M234 240q1 -10 5 -15" stroke="${P.fg}" stroke-width="1.6" fill="none"/>`;
      break;
    case 1:   // 천진 — 언덕 위 청간정과 소나무, 바닥까지 비치는 맑은 물
      L.far = range(140, 300, HZ, 12, P.far, 2.1);
      L.mid = `<path d="M-12 ${HZ + 2}V${HZ - 14}Q20 ${HZ - 26} 52 ${HZ - 18}Q76 ${HZ - 8} 92 ${HZ + 2}Z" fill="${P.near}"/>${pine(10, HZ - 14, .8, P.mid)}${pine(26, HZ - 18, .9, P.mid)}${pav(46, HZ - 16, .9, P.mid, P.lit)}${pine(66, HZ - 10, .7, P.mid)}${rocks(196, HZ + 3, 22, 9, P, 5)}${pine(207, HZ - 4, .45, P.mid)}`;
      L.sea = Array.from({ length:9 }, (_, i)=>`<path class="qca" style="animation-delay:${-i * .4}s" d="M${20 + i * 24} ${184 + (i % 3) * 10}q4 -2 8 0t8 0" stroke="#FFFFFF" stroke-width=".8" fill="none" opacity=".5"/>`).join('') + `<path d="M150 ${HZ - 1}h8l-4 -7z" fill="#FFFFFF" opacity=".85"/><rect x="153.5" y="${HZ - 1}" width="1" height="2" fill="${P.mid}"/>`;
      L.fg = sandFg(P, 222) + [[30, 232], [90, 236], [180, 233]].map(([x, y])=>`<circle cx="${x}" cy="${y}" r="2.2" fill="#FFF4E6"/><path d="M${x - 1} ${y}a1 1 0 1 1 1 1" stroke="#D9A88A" stroke-width=".6" fill="none"/>`).join('');
      break;
    case 2:   // 속초 — 설악산(울산바위) 능선, 도시와 대관람차, 오른쪽 영금정
      L.far = range(-30, 180, HZ, 52, P.far, .4, .9) + `<path d="M40 ${HZ - 34}q6 -12 16 -10q8 -6 14 2q6 0 6 8z" fill="${P.far}"/><path d="M42 ${HZ - 34}q6 -12 16 -10" stroke="#FFFFFF" stroke-width="1" fill="none" opacity=".5"/>` + range(-20, 150, HZ, 22, P.aut, 2.4) + `<rect x="-12" y="${HZ - 14}" width="170" height="16" fill="${P.far}" opacity=".35"/>`;
      L.mid = Array.from({ length:9 }, (_, i)=>{ const h = 8 + hs(i, 7) * 14; return `<rect x="${-4 + i * 7.5}" y="${f1(HZ - h)}" width="6" height="${f1(h)}" fill="${P.mid}"/><rect x="${-2 + i * 7.5}" y="${f1(HZ - h + 3)}" width="2" height="1" fill="${P.lit}" opacity=".6"/>`; }).join('') + ferris(84, HZ - 16, 12, P) + rocks(178, HZ + 4, 60, 12, P, 8) + pav(206, HZ - 6, .85, P.mid, P.lit) + `<circle class="qsp" cx="186" cy="${HZ + 2}" r="3" fill="${P.crest}"/><circle class="qsp" style="animation-delay:-.8s" cx="230" cy="${HZ + 3}" r="2.5" fill="${P.crest}"/>`;
      L.fg = sandFg(P, 224) + [20, 44, 68].map(x=>`<rect x="${x}" y="226" width="2" height="12" fill="${P.fg}"/>`).join('') + `<path d="M21 229Q33 233 45 229T69 229" stroke="${P.fg}" stroke-width=".8" fill="none"/>`;
      break;
    case 3:   // 낙산 — 언덕 위 해수관음상, 절벽 끝 의상대와 기운 소나무
      L.far = range(-30, 130, HZ - 6, 34, P.far, 1.9, .6) + range(-20, 110, HZ - 8, 14, P.aut, .7);
      L.mid = `<path d="M-12 ${HZ + 4}V${HZ - 22}Q20 ${HZ - 40} 50 ${HZ - 30}Q80 ${HZ - 22} 96 ${HZ - 8}L104 ${HZ + 4}Z" fill="${P.near}"/>` +
        `<path d="M34 ${HZ - 36}q2 0 2 3q0 2 -1 3q4 1 4.5 6l2 18h-15l2 -18q.5 -5 4.5 -6q-1 -1 -1 -3q0 -3 2 -3z" transform="translate(0 -8)" fill="#EDE7DA"/><circle cx="34" cy="${HZ - 46}" r="5" fill="#FFFFFF" opacity=".25"/>` +
        pine(12, HZ - 26, .8, P.mid) + pine(58, HZ - 26, .7, P.mid) + pav(86, HZ - 11, .8, P.mid, P.lit) + `<g transform="translate(97 ${HZ - 11}) rotate(28)">${pine(0, 0, .65, P.mid)}</g>`;
      L.fg = sandFg(P, 220) + `<path d="M150 252q6 -18 18 -24M160 252q2 -14 -4 -22" stroke="${P.fg}" stroke-width="1.4" fill="none"/>`;
      break;
    case 4:   // 죽도 — 대숲 섬 위 죽도정, 오른쪽 해변의 서핑숍과 라인업의 서퍼들
      L.far = range(130, 290, HZ, 12, P.far, 3.3);
      L.mid = `<path d="M18 ${HZ + 3}Q24 ${HZ - 20} 58 ${HZ - 22}Q92 ${HZ - 20} 100 ${HZ + 3}Z" fill="${P.near}"/>` + [26, 38, 50, 72, 84].map((x, i)=>pine(x, HZ - 12 - (i % 2) * 4, .55, P.mid)).join('') + pav(62, HZ - 21, .75, P.mid, P.lit) +
        [['#2F8F8A', 150], ['#E8A43A', 166], ['#E86A5A', 182], ['#5BB5E0', 198], ['#F4C430', 214]].map(([c, x], i)=>`<rect x="${x}" y="${HZ - 9 - (i % 2) * 2}" width="14" height="${11 + (i % 2) * 2}" fill="${c}" opacity=".9"/><rect x="${x - 1}" y="${HZ - 11 - (i % 2) * 2}" width="16" height="2" fill="${P.mid}"/><rect x="${x + 3}" y="${HZ - 5}" width="3" height="3" fill="${P.lit}" opacity=".7"/><rect x="${x + 11}" y="${HZ - 14}" width="2.4" height="12" rx="1.2" fill="#FFFFFF" transform="rotate(8 ${x + 12} ${HZ})"/>`).join('');
      L.sea = [116, 132, 148, 166].map((x, i)=>`<g class="qbob" style="animation-delay:${-i * .7}s"><rect x="${x}" y="${131 + (i % 2) * 3}" width="7" height="1.6" rx=".8" fill="#FFFFFF"/><circle cx="${x + 3.5}" cy="${129 + (i % 2) * 3}" r="1.6" fill="${P.fg}"/></g>`).join('');
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
      L.mid = `<rect x="-12" y="${HZ - 2}" width="98" height="6" fill="${P.near}"/>` + Array.from({ length:7 }, (_, i)=>`<rect x="${-6 + i * 12}" y="${HZ - 9}" width="11" height="7" fill="${P.mid}"/><path d="M${-7 + i * 12} ${HZ - 9}h13l-2 -3h-9z" fill="${i % 2 ? '#E86A5A' : '#F4F1EA'}" opacity=".85"/><circle cx="${-1 + i * 12}" cy="${HZ - 6}" r="1.2" fill="${P.win}"/><circle cx="${-1 + i * 12}" cy="${HZ - 6}" r="3.5" fill="${P.win}" opacity=".2"/>`).join('') +
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


/* 한 장면 SVG 문자열 — 층 순서가 곧 원근. noFg: 앞 실루엣 빼기(게임이 제 바다·땅을 앞에 그린다), noVig: 비네트 빼기 */
function svg(k, tod, o){
  o = o || {}; k = typeof k === 'string' ? PLACES.indexOf(k) : k; const alt = !!o.alt;
  const P = typeof tod === 'string' ? TOD[tod] || TOD.day : tod, V = village(k, P, alt), big = P.big || 1, L = P.sun || P.moon;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${o.px || 240}" height="${o.px || 240}" viewBox="0 0 240 240"><defs>
    <linearGradient id="qsS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky[0]}"/><stop offset=".45" stop-color="${P.sky[1]}"/><stop offset=".8" stop-color="${P.sky[2]}"/><stop offset="1" stop-color="${P.sky[3]}"/></linearGradient>
    <linearGradient id="qsW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sea[0]}"/><stop offset="1" stop-color="${P.sea[1]}"/></linearGradient>
    <radialGradient id="qsG"><stop offset="0" stop-color="${P.sun ? P.sun.g : '#E8E4FF'}" stop-opacity=".7"/><stop offset="1" stop-color="${P.sun ? P.sun.g : '#E8E4FF'}" stop-opacity="0"/></radialGradient>
    <radialGradient id="qsV" cx=".5" cy=".46" r=".72"><stop offset=".6" stop-color="#05040F" stop-opacity="0"/><stop offset="1" stop-color="#05040F" stop-opacity="${P.vig}"/></radialGradient>
    <radialGradient id="qsB"><stop offset="0" stop-color="#FFE9A0" stop-opacity=".9"/><stop offset="1" stop-color="#F4C430" stop-opacity="0"/></radialGradient>
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
  if(!o.noFg) s += `<g data-d="1.8">${V.fg}</g>`;
  // ⑥ 입자 — 갈매기·반딧불·비·번개
  if(!P.rain && !P.night || P.board) s += gull(60, 50, 1, P.fg, 0) + gull(80, 40, .7, P.fg, -6) + gull(150, 64, .8, P.fg, -11);
  if(P.ff) for(let i = 0; i < 9; i++) s += `<circle class="qff" style="animation-delay:${f1(-hs(i, 31) * 6)}s" cx="${f1(20 + hs(i, 32) * 200)}" cy="${f1(150 + hs(i, 33) * 70)}" r=".9" fill="#F6FFB0"/>`;
  if(P.rain) s += `<g class="qrn"><rect x="-20" y="-40" width="280" height="300" fill="url(#qsN)"/></g>`;
  if(P.flare && P.sun) s += flare(P.sun.x, P.sun.y, P);
  if(P.flash && o.flash) s += `<g class="qfl"><rect x="-12" y="-12" width="264" height="264" fill="${P.flash}" opacity=".5"/><path d="M168 -2L158 30L166 32L150 72L172 34L163 32L176 -2Z" fill="${P.flash}"/></g>`;
  // ⑦ 빛 — 가장자리 비네트(시선이 가운데로)
  s += `${o.noVig ? '' : '<rect x="-12" y="-12" width="264" height="264" fill="url(#qsV)"/>'}</svg>`;
  return s;
}

/* 굽기 — 장면·옵션마다 한 번만 SVG → 이미지 → 오프스크린 캔버스. 로딩 중엔 null(게임은 예전 하늘로 버틴다) */
const CACHE = {};
function bake(k, tod, o){
  o = o || {}; const K = o.k || 1;
  const key = [k, typeof tod === 'string' ? tod : JSON.stringify(tod), o.alt ? 1 : 0, o.noFg ? 1 : 0, o.noVig ? 1 : 0, K].join('|');
  const e = CACHE[key]; if(e) return e.cv;
  const ent = CACHE[key] = { cv:null }, px = 240 * K, im = new Image();
  im.onload = ()=>{ const cv = document.createElement('canvas'); cv.width = cv.height = px; cv.getContext('2d').drawImage(im, 0, 0, px, px); cv.K = K; ent.cv = cv; };
  im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(k, tod, Object.assign({}, o, { px })));
  return null;
}
/* 그리기 — 장면의 수평선(HZ)을 게임 화면의 hz 에 맞춰 s 배로 놓고, 남는 폭 안에서 pan(-1~1)만큼 옆으로 민다(시차) */
function draw(c, k, tod, o){
  const cv = bake(k, tod, o); if(!cv) return false;
  const s = o.s || 1, K = cv.K, dx = o.x || 0, dy = o.y || 0, pan = RM ? 0 : Math.max(-1, Math.min(1, o.pan || 0));
  const sw = Math.min(240, o.w / s), sx = (240 - sw) / 2 * (1 + pan);
  let sy = HZ - (o.hz - dy) / s, sh = o.h / s, ty = dy, th = o.h;
  if(sy < 0){ ty -= sy * s; th += sy * s; sh += sy; sy = 0; }                       // 장면 위로 벗어난 몫은 잘라낸다(사파리는 바깥 좌표를 싫어한다)
  if(sy + sh > 240){ const cut = sy + sh - 240; sh -= cut; th -= cut * s; }
  if(sh <= 0) return false;
  const sm = c.imageSmoothingEnabled; c.imageSmoothingEnabled = true;
  c.drawImage(cv, sx * K, sy * K, sw * K, sh * K, dx, ty, sw * s, th);
  c.imageSmoothingEnabled = sm; return true;
}

/* ── 위에서 내려다본 바닷가 — 스케이트(산책로)·해변 수호(물길 지도)용. 캔버스 붓으로 바로 그려 기다림이 없다 ── */
const rgba = (h, a) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
function pineTop(c, x, y, r){                                  // 위에서 본 소나무 — 짙은 그림자 위에 밝은 잎 뭉치 몇 개
  c.fillStyle = 'rgba(20,40,30,.28)'; c.beginPath(); c.ellipse(x + r * .35, y + r * .3, r, r * .8, 0, 0, 7); c.fill();
  [['#1F5A3A', 0, 0, 1], ['#2E7D4F', -.3, -.25, .62], ['#3F9A62', .25, -.3, .45], ['#4FB072', -.1, -.45, .28]].forEach(([col, ox, oy, rr])=>{ c.fillStyle = col; c.beginPath(); c.arc(x + ox * r, y + oy * r, r * rr, 0, 7); c.fill(); });
}
function rockTop(c, x, y, r, seed){                            // 갯바위 + 둘레 거품
  c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(x, y + 1, r * 1.7, r * 1.25, 0, 0, 7); c.fill();
  c.fillStyle = '#4A4E5C'; c.beginPath(); for(let i = 0; i < 9; i++){ const a = i / 9 * 6.283, rr = r * (.75 + hs(i, seed) * .4); c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .8); } c.fill();
  c.fillStyle = '#7A7F90'; c.beginPath(); c.ellipse(x - r * .25, y - r * .25, r * .45, r * .3, -.4, 0, 7); c.fill();
}
function grain(c, x, y, w, h, n, cols, seed){ for(let i = 0; i < n; i++){ c.fillStyle = cols[i % cols.length]; c.fillRect(Math.round(x + hs(i, seed) * w), Math.round(y + hs(i, seed + 1) * h), 1, 1); } }
const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };

/* 스케이트 산책로 — 바다 0~22 · 모래 22~30 · 길 30~154 · 잔디 154~180. 세로로 이음매 없이 반복되는 한 장(높이 T) */
const TD = {};
function promenade(w, T){
  const key = 'p' + w + 'x' + T; if(TD[key]) return TD[key];
  const cv = mk(w, T), c = cv.getContext('2d');
  let g = c.createLinearGradient(0, 0, 22, 0); g.addColorStop(0, '#1F6FAE'); g.addColorStop(.7, '#3D9BD6'); g.addColorStop(1, '#6CCBE6'); c.fillStyle = g; c.fillRect(0, 0, 22, T);
  for(let y = 0; y < T; y += 2){ const fx = 19 + Math.round(Math.sin(y / T * 6.283 * 6) * 1.5 + Math.sin(y / T * 6.283 * 14) * .8); c.fillStyle = '#FFFFFF'; c.fillRect(fx, y, 3, 2); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(fx - 2, y, 2, 2); }   // 밀려온 거품 테
  c.fillStyle = '#D9BC86'; c.fillRect(22, 0, 3, T); c.fillStyle = '#F2D7A0'; c.fillRect(25, 0, 5, T); grain(c, 22, 0, 8, T, T / 3, ['#C9A56E', '#FFF0C8'], 3);
  [[8, 40, '#F4C430'], [12, 150, '#E86A5A']].forEach(([x, y, col])=>{ c.fillStyle = col; c.fillRect(x, y, 2, 7); c.fillStyle = '#2B2B3A'; c.fillRect(x, y + 2, 2, 2); });   // 바다 위 서퍼(보드+사람 점)
  c.fillStyle = '#FF7A3D'; c.beginPath(); c.arc(6, 100, 1.6, 0, 7); c.fill();                                                                     // 부표
  c.fillStyle = '#8E8E99'; c.fillRect(30, 0, 124, T); grain(c, 30, 0, 124, T, T * 2, ['#80808B', '#9C9CA6', '#868691'], 5);
  c.fillStyle = '#C9C6BE'; c.fillRect(30, 0, 2, T); c.fillRect(152, 0, 2, T); c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(32, 0, 1, T); c.fillRect(151, 0, 1, T);
  for(let y = 0; y < T; y += 24){ c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(33, y, 118, 1); }                                                 // 보도블록 줄눈 — 아주 옅게(코스 점선이 먼저 보이게)
  c.fillStyle = '#7DBA5F'; c.fillRect(154, 0, w - 154, T); grain(c, 154, 0, w - 154, T, T, ['#6AA64E', '#92CC72'], 7);
  c.fillStyle = '#D8CFC0'; c.fillRect(156, 0, 3, T);                                                                                                   // 잔디 옆 오솔길
  for(let y = 0; y < T; y += 120){                                                                                                                    // 서핑숍 오두막 + 세워 둔 보드
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(163, y + 12, 16, 16); c.fillStyle = ['#2F8F8A', '#E86A5A'][(y / 120) % 2]; c.fillRect(161, y + 10, 16, 16); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(161, y + 10, 16, 3);
    ['#F4C430', '#5BB5E0', '#FFFFFF'].forEach((col, i)=>{ c.fillStyle = col; c.fillRect(160 + i * 3, y + 28, 2, 8); });
    c.fillStyle = '#8D6E63'; c.fillRect(162, y + 64, 12, 3); c.fillStyle = '#6B5045'; c.fillRect(163, y + 67, 1, 2); c.fillRect(172, y + 67, 1, 2);   // 벤치
  }
  for(let y = 50; y < T + 50; y += 60) pineTop(c, 170 + (y / 60 % 2) * 4, y % T, 7);
  return TD[key] = cv;
}

/* 해변 수호 지도 — 깊은 바다 → 얕은 옥빛 → 젖은 모래 → 마른 모래. 소품은 물길·수호대 자리를 피해서 놓는다 */
function shore(W, H, SH){
  const key = 's' + W + 'x' + H; if(TD[key]) return TD[key];
  const M = 4, cv = mk((W + M * 2) * 2, (H + M * 2) * 2), c = cv.getContext('2d'); c.scale(2, 2); c.translate(M, M);
  let g = c.createLinearGradient(0, -M, 0, SH); g.addColorStop(0, '#0A3A66'); g.addColorStop(.55, '#17679F'); g.addColorStop(.85, '#2C9CC8'); g.addColorStop(1, '#63CFD6'); c.fillStyle = g; c.fillRect(-M, -M, W + M * 2, SH + M);
  for(let i = 0; i < 14; i++){ c.fillStyle = `rgba(4,30,60,${.10 + hs(i, 41) * .12})`; c.beginPath(); c.ellipse(hs(i, 42) * W, hs(i, 43) * SH * .7, 14 + hs(i, 44) * 26, 6 + hs(i, 45) * 10, hs(i, 46), 0, 7); c.fill(); }   // 깊은 골
  c.strokeStyle = 'rgba(190,240,255,.16)'; c.lineWidth = .8;
  for(let i = 0; i < 36; i++){ const x = hs(i, 51) * W, y = 20 + hs(i, 52) * (SH - 26); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 4, y - 2.5, x + 8, y); c.quadraticCurveTo(x + 11, y + 2, x + 14, y); c.stroke(); }   // 물빛 물결무늬
  [[226, 18, 6, 1], [100, 6, 4, 2], [8, 98, 5, 3], [231, 96, 4.5, 4]].forEach(([x, y, r, sd])=>rockTop(c, x, y, r, sd));
  g = c.createLinearGradient(0, SH, 0, H + M); g.addColorStop(0, '#D8B87E'); g.addColorStop(.06, '#EBD09A'); g.addColorStop(.2, '#F2DDA6'); g.addColorStop(1, '#F7E6BC'); c.fillStyle = g; c.fillRect(-M, SH, W + M * 2, H - SH + M);
  grain(c, 0, SH + 4, W, H - SH, 900, ['rgba(176,140,84,.55)', 'rgba(255,248,224,.8)', 'rgba(200,164,104,.4)'], 61);
  c.strokeStyle = 'rgba(160,120,70,.25)'; c.lineWidth = 1; for(let i = 0; i < 5; i++){ const y = SH + 30 + i * 30; c.beginPath(); c.moveTo(-M, y); for(let x = 0; x <= W + M; x += 20) c.quadraticCurveTo(x - 10, y + (i % 2 ? 3 : -3), x, y); c.stroke(); }   // 바람이 남긴 모래 결
  [[14, 210], [52, 186], [196, 150], [100, 230], [226, 210]].forEach(([x, y], i)=>{ c.fillStyle = ['#FFF4E6', '#F6B9A6', '#FFE9A8'][i % 3]; c.beginPath(); c.arc(x, y, 1.6, 0, 7); c.fill(); });   // 조개
  // 파라솔 + 수건
  [[226, 168, ['#E86A5A', '#FFFFFF']], [10, 236, ['#5BB5E0', '#FFFFFF']]].forEach(([x, y, cols])=>{ c.fillStyle = 'rgba(80,60,30,.22)'; c.beginPath(); c.ellipse(x + 3, y + 3, 9, 7, 0, 0, 7); c.fill();
    for(let i = 0; i < 8; i++){ c.fillStyle = cols[i % 2]; c.beginPath(); c.moveTo(x, y); c.arc(x, y, 8, i * .785, (i + 1) * .785); c.fill(); } c.fillStyle = '#6B5045'; c.beginPath(); c.arc(x, y, 1.2, 0, 7); c.fill(); });
  c.fillStyle = '#F4C430'; c.fillRect(214, 182, 14, 7); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(214, 184, 14, 1);
  [['#F4C430', 228, 226], ['#5BB5E0', 234, 230]].forEach(([col, x, y])=>{ c.fillStyle = 'rgba(80,60,30,.25)'; c.fillRect(x + 2, y + 2, 3, 14); c.fillStyle = col; c.beginPath(); c.ellipse(x, y + 7, 2, 8, 0, 0, 7); c.fill(); });   // 모래에 꽂은 보드
  // 서핑학교 건물 — 이름표(게임이 그리는 주황 간판)를 정면에 단다. 화면이 300보다 길면 그만큼 내려 바닥에 붙인다
  c.save(); c.translate(0, H - 300);
  c.fillStyle = 'rgba(80,60,30,.25)'; c.fillRect(92, 268, 62, 34); c.fillStyle = '#F6F1E8'; c.fillRect(88, 266, 64, 34); c.fillStyle = '#2F6F9A'; c.fillRect(86, 262, 68, 6); c.fillStyle = '#245A80'; c.fillRect(86, 267, 68, 1.5);
  [94, 104, 136, 146].forEach(x=>{ c.fillStyle = '#9FD6F0'; c.fillRect(x - 2, 271, 6, 5); });
  pineTop(c, 14, 290, 10); pineTop(c, 228, 292, 10); c.restore(); pineTop(c, 220, 128, 6);
  return TD[key] = cv;
}

const RM = (()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })();
window.scenery = { PLACES, TOD, svg, bake, draw, promenade, shore, RM };
})();
