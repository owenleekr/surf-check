/* ── 🍫 빼빼로 서핑 — 11.11 이벤트 ─────────────────────────────────
   11월 11일 = 모래사장에 나란히 선 서프보드 네 개(1111) = 6기가 함께 탄 파도. 오늘은 빼빼로가 서프보드다.
   홈 맨 위 띠(#pepero-bar) · 놀이 카드 · /pepero(→ /surfshare?go=pepero) 로 들어와
   패들 → 파도 → 「발밑에 뭔가 걸렸어요」 → 끌어올리면 선물. 꽝은 없다.
   한 계정 한 번 — 결과는 이 기기(localStorage)와 place_talk 표(target 'pepero:2026', text '<경품id>|<보이는 이름>')에 남는다.
   다른 기기에서 열어도 서버에 기록이 있으면 다시 뽑지 않는다. 운영자는 이 표에서 당첨자를 보고 경품을 전한다.
   당첨 뒤 인스타 스토리용 그림(1080×1920 PNG)과 짧은 영상(약 7초)을 폰에서 만든다 — 서버로는 당첨 한 줄만 간다. */
(function(){
/* 이벤트 기간(한국 시간) — 띠·도전이 열리는 때. 바꾸려면 여기 */
const START = Date.parse('2026-11-11T00:00:00+09:00'), END = Date.parse('2026-11-13T00:00:00+09:00');
const TARGET = 'pepero:2026', LS = 'lineup.share.pepero2026:';
/* 경품 — 이름·이모지·확률(w, 서로의 비율) 자유롭게 고쳐도 된다. 꽝 없음. shells 가 있으면 앱 조개로 바로 넣어 준다.
   ⚠️ 아래 값은 자리표시 — 실제 준비한 경품에 맞게 고칠 것(id 는 이미 뽑힌 기록과 맞추는 열쇠라 바꾸지 말 것) */
const PRIZES = [
  { id:'p1', rank:'1등',   ic:'🎁', n:'빼빼로 한 상자',          w:5 },
  { id:'p2', rank:'2등',   ic:'🍫', n:'빼빼로 1개',              w:30 },
  { id:'p3', rank:'3등',   ic:'☕', n:'다음 서핑 날 커피 한 잔', w:15 },
  { id:'p4', rank:'참여상', ic:'🐚', n:'조개 30개',               w:50, shells:30 },
];
const W = 1080, H = 1920, HZ = 640, SAND = 1440, BY = 830;   // 스토리 좌표 — 화면 캔버스도 같은 좌표를 줄여서 그린다
const FONT = '"Apple SD Gothic Neo","Noto Sans KR",sans-serif', INK = '#1B1B2F';
const RM = (()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })();
const live = () => { const n = Date.now(); return n >= START && n < END; };
const say = t => { if(typeof toast === 'function') toast(t); };
const meOk = () => typeof ME !== 'undefined' && ME && ME.id;
const label = p => `${p.ic} ${p.rank} ${p.n}`;
const seen = r => String(r && r.text || '').split('|').slice(1).join('|') || String(r && r.text || '');
let res = null, wall = [], checking = null, meImg = null, cv = null, raf = 0, S = null, vid = null;

/* ── 뽑기 — 무게(w) 비율, 암호 난수 ── */
function pick(){
  const tot = PRIZES.reduce((a, p)=>a + p.w, 0), u = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 * tot;
  let acc = 0; for(const p of PRIZES){ acc += p.w; if(u < acc) return p; }
  return PRIZES[PRIZES.length - 1];
}
const prizeOf = r => r && (PRIZES.find(p=>p.id === r.id) || { id:r.id, rank:'', ic:'🎁', n:seen(r).slice(0, 30) || '선물' });
function loadLocal(){ try{ const v = JSON.parse(localStorage.getItem(LS + ME.id) || 'null'); if(v && typeof v.id === 'string') res = v; }catch(e){} }
function saveLocal(){ try{ localStorage.setItem(LS + ME.id, JSON.stringify(res)); }catch(e){} }
const ours = r => (Array.isArray(r) ? r : []).filter(x=>x && x.target === TARGET);

/* 서버 확인 — 이미 뽑았으면 그 결과를 그대로 */
function pullMine(){
  if(checking) return checking;
  checking = (async ()=>{
    try{ const r = ours(await api(`place_talk?select=id,target,user_id,text,created_at&target=eq.${TARGET}&user_id=eq.${encodeURIComponent(ME.id)}&order=created_at.asc&limit=1`)).find(x=>x.user_id === ME.id);
      if(r){ res = { id:String(r.text || '').split('|')[0], text:String(r.text || ''), at:Date.parse(r.created_at) || Date.now(), sent:1 }; saveLocal(); }
      else if(res && !res.sent) send();
    }catch(e){}
    checking = null; bar();
  })();
  return checking;
}
async function pullWall(){
  try{ wall = ours(await api(`place_talk?select=id,target,user_id,name,cohort,text,created_at&target=eq.${TARGET}&order=created_at.desc&limit=30`)).slice(0, 30); }catch(e){}
  paintWall();
}
async function send(){
  if(!res || res.sent || !meOk()) return;
  const row = { id:`${ME.id}|${res.at}`, target:TARGET, parent:null, user_id:ME.id, name:ME.name, cohort:ME.cohort || 'open', text:res.text, created_at:new Date(res.at).toISOString() };
  try{ await api('place_talk', { method:'POST', body:JSON.stringify(row) }); res.sent = 1; saveLocal(); wall = [row, ...wall.filter(r=>r.id !== row.id)].slice(0, 30); paintWall(); }
  catch(e){ if(e && e.status === 409){ res.sent = 1; saveLocal(); } }   // 이미 들어가 있음 — 못 보냈으면 다음에 열 때 다시
}
function claim(){
  if(res) return prizeOf(res);
  const p = pick(); res = { id:p.id, text:`${p.id}|${label(p)}`, at:Date.now(), sent:0 }; saveLocal();
  if(p.shells && typeof playP === 'function'){ const pl = playP(); pl.shells = (pl.shells || 0) + p.shells; if(typeof playPush === 'function') playPush(); }   // 뽑는 순간 한 번만
  send(); bar();
  return p;
}

/* ── 그림 부품(1080×1920 좌표) ── */
function rr(g, x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
/* 빼빼로 보드 — 과자 막대 + 초콜릿 코팅(앞쪽 2/3) */
function stick(g, x, y, len, th, ang){
  const L = len / 2, r = th / 2, c = len * .66;
  g.save(); g.translate(x, y); g.rotate(ang);
  g.fillStyle = '#E2B275'; rr(g, -L, -r, len, th, r); g.fill();
  g.fillStyle = 'rgba(255,244,214,.55)'; rr(g, -L + r * .5, -r * .62, len * .26, th * .24, th * .12); g.fill();
  g.fillStyle = '#5B3220'; rr(g, L - c, -r - 4, c, th + 8, r + 4); g.fill();
  g.fillStyle = '#7C4A31'; rr(g, L - c + 14, -r + 2, c - 34, th * .26, th * .13); g.fill();
  g.strokeStyle = 'rgba(255,236,214,.5)'; g.lineWidth = Math.max(2, th * .07); g.beginPath();
  for(let i = 0; i < 6; i++){ const xx = L - c + 26 + i * (c - 40) / 6; g.moveTo(xx, -r); g.lineTo(xx + c / 14, r); } g.stroke();
  g.restore();
}
const BG = {};
function bg(px, name){
  const key = px + '|' + name; if(BG[key]) return BG[key];
  const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * H / W); const g = c.getContext('2d'); g.scale(px / W, px / W);
  let gr = g.createLinearGradient(0, 0, 0, HZ); gr.addColorStop(0, '#5FB4EA'); gr.addColorStop(.55, '#A9DBF5'); gr.addColorStop(1, '#FFE2CF'); g.fillStyle = gr; g.fillRect(0, 0, W, HZ);
  g.fillStyle = 'rgba(255,233,168,.35)'; g.beginPath(); g.arc(840, 500, 140, 0, 7); g.fill(); g.fillStyle = '#FFE9A8'; g.beginPath(); g.arc(840, 500, 74, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.85)'; [[160, 190, 90], [250, 210, 70], [700, 150, 80], [780, 170, 60]].forEach(([x, y, r])=>{ g.beginPath(); g.ellipse(x, y, r, r * .42, 0, 0, 7); g.fill(); });
  const ridge = (base, amp, col, s)=>{ g.fillStyle = col; g.beginPath(); g.moveTo(0, HZ); for(let x = 0; x <= W; x += 30) g.lineTo(x, base - amp * (.5 + .5 * Math.sin(x / 140 + s) * Math.sin(x / 63 + s * 2))); g.lineTo(W, HZ); g.closePath(); g.fill(); };
  ridge(HZ - 10, 120, '#A9C2D6', 1); ridge(HZ, 70, '#6F9A8C', 4);                       // 설악 능선
  gr = g.createLinearGradient(0, HZ, 0, SAND); gr.addColorStop(0, '#86CDEA'); gr.addColorStop(1, '#1F6FAE'); g.fillStyle = gr; g.fillRect(0, HZ, W, SAND - HZ);
  gr = g.createLinearGradient(0, SAND, 0, H); gr.addColorStop(0, '#F3E2BE'); gr.addColorStop(1, '#E3C792'); g.fillStyle = gr; g.fillRect(0, SAND - 20, W, H - SAND + 20);
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, SAND - 26); for(let x = 0; x <= W; x += 40) g.quadraticCurveTo(x + 20, SAND - 2 - (x / 40 % 2) * 14, x + 40, SAND - 22); g.lineTo(W, SAND - 4); g.lineTo(0, SAND - 4); g.closePath(); g.fill();
  /* 1111 — 모래에 나란히 꽂힌 빼빼로 보드 넷 */
  [-.07, .03, -.02, .06].forEach((a, i)=>{ const x = 540 + (i - 1.5) * 130;
    g.fillStyle = 'rgba(120,90,40,.25)'; g.beginPath(); g.ellipse(x + 20, 1522, 46, 12, 0, 0, 7); g.fill();
    stick(g, x, 1405, 236, 52, -Math.PI / 2 + a); });
  g.textAlign = 'center'; g.lineJoin = 'round';
  g.font = `900 104px ${FONT}`; g.lineWidth = 16; g.strokeStyle = '#fff'; g.strokeText('11.11 빼빼로 서핑', W / 2, 340); g.fillStyle = INK; g.fillText('11.11 빼빼로 서핑', W / 2, 340);
  g.font = `800 44px ${FONT}`; g.lineWidth = 10; g.strokeText('양양 바다, 발밑에 걸린 선물', W / 2, 410); g.fillStyle = '#36405A'; g.fillText('양양 바다, 발밑에 걸린 선물', W / 2, 410);
  g.fillStyle = INK; g.font = `800 40px ${FONT}`; g.fillText('양양서핑학교 6기 · SurfShare', W / 2, 1572);
  g.fillStyle = '#5B6275'; g.font = `700 32px ${FONT}`; g.fillText(`${String(name || '').slice(0, 12)} · surf.owenai.xyz/pepero`, W / 2, 1620);
  return BG[key] = c;
}

/* ── 장면 상태 — 화면 게임과 영상이 같은 걸 쓴다(입자는 미리 만들어 두고 돌려 쓴다) ── */
const VT = { idle:30, paddle:50, ride:340, tug:60, pop:30, reveal:18 };
function newS(){ return { ph:'idle', k:0, t:0, v:30, off:0, rd:0, n:0, pulls:0, sp:Array.from({ length:48 }, ()=>({ a:0, x:0, y:0, vx:0, vy:0 })) }; }
function go(s, ph){ s.ph = ph; s.k = 0; }
function splash(s, x, y, n){ for(const q of s.sp){ if(n <= 0) break; if(q.a > 0) continue; q.a = 1; q.x = x; q.y = y; q.vx = (Math.random() - .5) * 520; q.vy = -260 - Math.random() * 420; n--; } }
function step(s, dt){
  s.t += dt; s.k += dt;
  const vt = VT[s.ph] + (s.ph === 'paddle' ? s.n * 30 : 0); s.v += (vt - s.v) * Math.min(1, dt * 2.5); s.off += s.v * dt;
  const rt = s.ph === 'ride' ? 1 : s.ph === 'tug' || s.ph === 'pop' ? .35 : 0; s.rd += (rt - s.rd) * Math.min(1, dt * 3);
  for(const q of s.sp) if(q.a > 0){ q.vy += 1100 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.a -= dt * 1.3; }
}
const easeBack = x => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
const CF = Array.from({ length:44 }, (_, i)=>({ x:i % 2 ? (i * 37) % 220 : 860 + (i * 41) % 220,   // 양옆으로만 — 제목·선물·주소를 가리지 않게
  sp:200 + (i * 53) % 240, ph:(i * 311) % 2000, s:12 + (i % 4) * 5, r:i * .7 }));
const CFC = ['#FF6B6B', '#FFD23F', '#5AB4EF', '#6BD6A0', '#B48CFF'];
const CAP = { paddle:'패들! 패들! 🌊', ride:'파도 잡았다! 🏄', tug:'앗! 발밑에 뭔가 걸렸어요', pop:'영차! 끌어올려요' };
function fit(g, t, max, size, weight){ do{ g.font = `${weight} ${size}px ${FONT}`; size -= 4; }while(g.measureText(t).width > max && size > 20); }
function paint(g, s, X){
  g.drawImage(X.bg, 0, 0, W, H);
  const r = s.rd;
  if(r > .02){                                                             // 타는 파도 — 뒤에서 솟는 물벽
    const top = BY + 70 - 270 * r; g.globalAlpha = Math.min(1, r * 1.2); g.fillStyle = '#2A7FC0';
    g.beginPath(); g.moveTo(-20, BY + 150); g.bezierCurveTo(260, BY + 130, 520, top + 90, 790, top); g.quadraticCurveTo(910, top - 50, 1010, top + 40); g.quadraticCurveTo(950, top + 10, 935, top + 90);
    g.lineTo(1100, BY + 160); g.lineTo(1100, SAND - 20); g.lineTo(-20, SAND - 20); g.closePath(); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 18; g.lineCap = 'round'; g.beginPath(); g.moveTo(560, top + 70); g.bezierCurveTo(680, top + 20, 760, top - 4, 800, top); g.quadraticCurveTo(910, top - 46, 1004, top + 38); g.stroke(); g.globalAlpha = 1;
  }
  g.lineCap = 'round';
  for(let i = 0; i < 6; i++){                                               // 물결 줄 — 가까울수록 크고 빠르게(모래의 보드 넷은 안 덮게)
    const y = HZ + 40 + i * 108, a = 5 + i * 2.4, wl = 150 + i * 34, o = s.off * (.35 + i * .16);
    g.strokeStyle = `rgba(255,255,255,${.28 + i * .06})`; g.lineWidth = 3 + i * 1.2; g.beginPath();
    for(let x = -40; x <= W + 40; x += 40){ const yy = y + Math.sin((x + o) / wl * 6.283) * a; x === -40 ? g.moveTo(x, yy) : g.lineTo(x, yy); } g.stroke();
  }
  const shake = s.ph === 'tug' && !X.rm;
  let x = 540 + Math.sin(s.t * .8) * 40 * r, y = BY + Math.sin(s.t * 2.2) * 9, ang = -.1 * r + Math.sin(s.t * 1.7) * .03;
  if(shake){ const m = 1 + s.pulls * .5; x += Math.sin(s.t * 47) * 7 * m; y += 8 + Math.sin(s.t * 39) * 4 * m; ang += Math.sin(s.t * 31) * .03 * m; }
  if(s.ph === 'tug' || s.ph === 'pop'){                                    // 거품 — 발밑에서 올라온다
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 4;
    for(let i = 0; i < 16; i++){ const bx = x + Math.sin(i * 12.3) * 190, by = BY + 300 - ((s.t * 140 + i * 57) % 280), br = 6 + (i % 4) * 5; g.beginPath(); g.arc(bx, by, br, 0, 7); g.stroke(); }
  }
  if(s.ph === 'pop'){                                                      // 그물에 걸린 선물 상자가 떠오른다
    const k = Math.min(1, s.k / .8), e = 1 - Math.pow(1 - k, 3), bx = x + 170, by = 1130 - 190 * e;
    g.globalAlpha = .55 + .45 * e; g.fillStyle = '#FF6B6B'; rr(g, bx - 80, by - 60, 160, 120, 14); g.fill(); g.fillStyle = '#E04F4F'; rr(g, bx - 90, by - 78, 180, 34, 10); g.fill();
    g.fillStyle = '#FFD23F'; g.fillRect(bx - 12, by - 78, 24, 138); g.fillRect(bx - 80, by - 8, 160, 20);
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.beginPath(); for(let i = -2; i <= 2; i++){ g.moveTo(bx + i * 40 - 30, by - 80); g.lineTo(bx + i * 40 + 30, by + 62); g.moveTo(bx + i * 40 + 30, by - 80); g.lineTo(bx + i * 40 - 30, by + 62); } g.stroke();
    g.globalAlpha = 1;
  }
  g.fillStyle = 'rgba(10,40,80,.22)'; g.beginPath(); g.ellipse(x, y + 46, 230, 22, 0, 0, 7); g.fill();
  stick(g, x, y + 24, 450, 56, ang);
  g.save(); g.translate(x, y); g.rotate(ang * .6);
  if(X.img){ const h = 330, w = h * X.img.width / X.img.height; g.drawImage(X.img, -w / 2, -h + 14, w, h); }
  else{ g.textAlign = 'center'; g.font = `240px ${FONT}`; g.fillText('🏄', 0, -10); }
  g.restore();
  g.fillStyle = '#fff'; for(const q of s.sp) if(q.a > 0){ g.globalAlpha = Math.max(0, q.a); g.beginPath(); g.arc(q.x, q.y, 9, 0, 7); g.fill(); } g.globalAlpha = 1;
  if(s.ph === 'tug'){ g.textAlign = 'center'; g.font = `96px ${FONT}`; g.fillText('❗', x + 150, BY - 300 + Math.sin(s.t * 9) * 8); }
  const cap = CAP[s.ph];
  if(cap){ g.font = `900 52px ${FONT}`; g.textAlign = 'center'; const tw = g.measureText(cap).width + 70;
    g.fillStyle = s.ph === 'tug' ? '#FF6B6B' : 'rgba(255,255,255,.94)'; rr(g, W / 2 - tw / 2, 1190, tw, 84, 42); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    g.fillStyle = s.ph === 'tug' ? '#fff' : INK; g.fillText(cap, W / 2, 1250); }
  if(s.ph === 'reveal' && X.prize){
    const tc = X.rm ? 2.2 : s.t;
    for(const c of CF){ const yy = (c.ph + tc * c.sp) % 2000 - 80; g.save(); g.translate(c.x, yy); g.rotate(c.r + tc * 2); g.fillStyle = CFC[c.ph % 5]; g.fillRect(-c.s / 2, -c.s, c.s, c.s * 2); g.restore(); }
    const k = Math.min(1, s.k / .45), sc = X.rm ? 1 : .6 + .4 * easeBack(k), p = X.prize;
    g.save(); g.translate(W / 2, 1060); g.scale(sc, sc);
    g.fillStyle = 'rgba(18,36,95,.28)'; rr(g, -390, -152, 800, 340, 44); g.fill();
    g.fillStyle = '#fff'; rr(g, -400, -170, 800, 340, 44); g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    g.textAlign = 'center';
    if(p.rank){ g.font = `900 40px ${FONT}`; const pw = g.measureText(p.rank).width + 60; g.fillStyle = '#FFD23F'; rr(g, -pw / 2, -200, pw, 64, 32); g.fill(); g.lineWidth = 5; g.stroke(); g.fillStyle = INK; g.fillText(p.rank, 0, -154); }
    g.font = `130px ${FONT}`; g.fillText(p.ic, 0, 30);
    fit(g, p.n, 720, 64, 900); g.fillStyle = INK; g.fillText(p.n, 0, 128);
    g.restore();
  }
}

/* ── 화면 ── */
function sheet(){
  let s = document.getElementById('pep-sheet'); if(s) return s;
  s = document.createElement('div'); s.className = 'sheet'; s.id = 'pep-sheet'; s.hidden = true;
  s.innerHTML = `<div class="sheet-dim" data-pclose></div><div class="sheet-in pep-in" role="dialog" aria-modal="true" aria-label="빼빼로 서핑">
    <div class="sheet-hd"><span class="t">🍫 빼빼로 서핑</span><button type="button" class="btn sm ghost" data-pclose>닫기</button></div>
    <div class="pep-stage"><canvas id="pep-cv" role="img" aria-label="빼빼로 보드를 탄 내 캐릭터와 양양 바다"></canvas></div>
    <p id="pep-hint" class="pep-hint" aria-live="polite"></p><div id="pep-ctl" class="pep-ctl"></div><div id="pep-wall" class="pep-wall"></div></div>`;
  document.body.appendChild(s);
  s.addEventListener('click', onClick);
  /* 패들은 꾹 누르고 있어도 저어진다 */
  let hold = 0; const stop = ()=>{ clearInterval(hold); hold = 0; };
  s.addEventListener('pointerdown', e=>{ const b = e.target.closest('[data-ppad]'); if(!b || b.disabled) return; e.preventDefault(); paddle(); stop(); hold = setInterval(paddle, 300); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(k=>s.addEventListener(k, stop));
  return s;
}
const canShare = () => { try{ return !!navigator.canShare?.({ files:[new File(['x'], 'a.png', { type:'image/png' })] }); }catch(e){ return false; } };
function ctl(){
  const el = document.getElementById('pep-ctl'), hint = document.getElementById('pep-hint'); if(!el) return;
  const ph = S ? S.ph : 'idle';
  if(res && ph !== 'pop'){
    const p = prizeOf(res); hint.textContent = '';
    el.innerHTML = `<div class="pep-res"><span>${esc(p.rank || '선물')}</span><b>${esc(p.ic)} ${esc(p.n)}</b><small>${p.shells ? `🐚 조개 ${p.shells}개를 지갑에 넣었어요` : '운영진이 확인하고 전해 드려요 · 이 화면을 보여 주세요'}</small></div>
      <div class="pep-share"><button type="button" class="btn sm" data-pimg>📸 스토리 이미지 저장</button>${canShare() ? '<button type="button" class="btn sm grape" data-pimgsh>인스타 스토리로 공유</button>' : ''}
      <button type="button" class="btn sm mint" data-pvid>🎬 스토리 영상 만들기</button></div><div id="pep-vid" class="pep-vid"></div>
      <small class="pep-note">공유 창에서 Instagram › 스토리를 고르면 돼요</small>`;
    paintVid(); return;
  }
  if(ph === 'idle'){
    const open = live(), wait = !!checking;
    hint.textContent = '';
    el.innerHTML = `<p class="pep-intro"><b>11월 11일, 모래사장에 서프보드 네 개가 나란히 — 1111.</b>
      6기가 함께 탄 파도처럼, 오늘은 빼빼로 보드를 타요. 패들로 파도를 잡으면 발밑에 선물이 걸려요. 꽝은 없어요!</p>
      <button type="button" class="btn coral pep-big" data-pgo ${open && !wait ? '' : 'disabled'}>${!open ? (Date.now() < START ? '11월 11일에 열려요' : '이벤트가 끝났어요') : wait ? '확인하는 중…' : '🏄 바다로 나가기'}</button>
      <small class="pep-note">한 사람에 한 번 · ${PRIZES.map(p=>esc(p.ic + ' ' + p.n)).join(' · ')}</small>`;
    return;
  }
  if(ph === 'paddle'){ hint.textContent = `패들을 저어 파도를 잡아요 (${S.n}/5)`;
    el.innerHTML = `<button type="button" class="btn pep-big pep-pad" data-ppad>🌊 패들!</button><div class="pep-dots" aria-hidden="true">${'<i class="on"></i>'.repeat(S.n)}${'<i></i>'.repeat(Math.max(0, 5 - S.n))}</div>`; return; }
  if(ph === 'ride'){ hint.textContent = '파도를 탔어요! 🏄'; el.innerHTML = '<button type="button" class="btn pep-big" disabled>🏄 타는 중…</button>'; return; }
  if(ph === 'tug'){ hint.textContent = `앗! 발밑에 뭔가 걸렸어요 — 끌어올려요 (${S.pulls}/3)`; el.innerHTML = '<button type="button" class="btn coral pep-big" data-ppull>🎣 끌어올리기!</button>'; return; }
  if(ph === 'pop'){ hint.textContent = '뭐가 걸렸을까…'; el.innerHTML = '<button type="button" class="btn pep-big" disabled>🎁 두근두근</button>'; }
}
function paintWall(){
  const el = document.getElementById('pep-wall'); if(!el) return;
  el.innerHTML = `<h4>🎉 오늘 당첨 소식</h4>${wall.length ? wall.map(r=>`<div class="pep-w${meOk() && r.user_id === ME.id ? ' me' : ''}"><b>${esc(String(r.name || '').slice(0, 20))}</b><span>${esc(seen(r).slice(0, 40))}</span><small>${typeof ago === 'function' ? esc(ago(r.created_at)) : ''}</small></div>`).join('') : '<p class="pep-note">아직 소식이 없어요 · 첫 선물을 건져 보세요</p>'}`;
}
function paintVid(){
  const el = document.getElementById('pep-vid'); if(!el) return;
  if(!vid){ el.innerHTML = ''; return; }
  if(vid.p != null){ el.innerHTML = `<div class="pep-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(vid.p * 100)}"><i style="width:${Math.round(vid.p * 100)}%"></i></div><small class="pep-note">영상 만드는 중… 화면을 켜 두세요</small>`; return; }
  el.innerHTML = `<div class="pep-share"><button type="button" class="btn sm" data-pvsave>💾 영상 저장</button>${canShare() ? '<button type="button" class="btn sm grape" data-pvsh>인스타 스토리로 공유</button>' : ''}</div>
    ${vid.webm ? '<small class="pep-note">이 폰은 webm 영상으로 만들어져요 — 인스타가 안 받으면 이미지를 올려 주세요</small>' : ''}`;
}
function assets(px){ return { bg:bg(px, meOk() ? ME.name : ''), img:meImg, prize:res ? prizeOf(res) : null, rm:RM }; }
function loadMe(){
  if(meImg || typeof window.mochiSVG !== 'function' || typeof withLook !== 'function') return Promise.resolve();
  return new Promise(ok=>{ try{ const im = new Image(); im.onload = ()=>{ meImg = im; ok(); }; im.onerror = ()=>ok();
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(window.mochiSVG(withLook(ME.profile || {}, ME.name), { charm:2, uid:'pp' })); }catch(e){ ok(); } });
}
let X = null, last = 0;
function loop(now){
  raf = 0; const s = document.getElementById('pep-sheet'); if(!s || s.hidden || !cv) return;
  const dt = Math.min(.05, last ? (now - last) / 1000 : 0); last = now;
  step(S, dt);
  if(S.ph === 'ride' && S.k > 2.4){ go(S, 'tug'); splash(S, 540, BY + 30, 14); navigator.vibrate?.([30, 40, 30, 40, 60]); ctl(); }
  else if(S.ph === 'pop' && S.k > 1){ go(S, 'reveal'); X.prize = prizeOf(res); navigator.vibrate?.([20, 40, 20]); ctl(); window.track?.('action', 'pepero_win'); }
  paint(cv.getContext('2d'), S, X);
  raf = requestAnimationFrame(loop);
}
function sizeCv(){
  cv = document.getElementById('pep-cv'); const w = Math.max(160, Math.round(cv.getBoundingClientRect().width * Math.min(2, devicePixelRatio || 1)));
  if(cv.width !== w){ cv.width = w; cv.height = Math.round(w * H / W); }
  cv.getContext('2d').setTransform(w / W, 0, 0, w / W, 0, 0);
  X = assets(w);
}
async function open(){
  if(!meOk()){ say('🍫 먼저 로그인해 주세요 — 로그인하면 바로 열려요'); return; }
  const s = sheet(); s.hidden = false; window.track?.('action', 'pepero_open');
  loadLocal(); S = newS(); if(res){ go(S, 'reveal'); S.k = 1; }
  sizeCv(); ctl(); paintWall();
  last = 0; if(!raf) raf = requestAnimationFrame(loop);
  loadMe().then(()=>{ if(X) X.img = meImg; });
  pullWall();
  await pullMine();
  if(res && S.ph === 'idle'){ go(S, 'reveal'); S.k = 1; X.prize = prizeOf(res); }
  ctl();
}
function close(){ const s = document.getElementById('pep-sheet'); if(s) s.hidden = true; cancelAnimationFrame(raf); raf = 0; }
function paddle(){
  if(!S || S.ph !== 'paddle') return;
  S.n++; splash(S, 330, BY + 40, 6); splash(S, 750, BY + 40, 6); navigator.vibrate?.(10);
  if(S.n >= 5){ go(S, 'ride'); splash(S, 300, BY + 60, 14); }
  ctl();
}
function pull(){
  if(!S || S.ph !== 'tug') return;
  S.pulls++; splash(S, 700, BY + 60, 10); navigator.vibrate?.(18);
  if(S.pulls >= 3){ claim(); go(S, 'pop'); splash(S, 710, BY + 80, 20); }
  ctl();
}
async function start(){
  if(res || checking || !live()) return ctl();
  await pullMine(); if(res){ go(S, 'reveal'); S.k = 1; X.prize = prizeOf(res); return ctl(); }   // 다른 기기에서 이미 뽑았다
  go(S, 'paddle'); ctl();
}

/* ── 스토리 내보내기 ── */
function storyCanvas(){ const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
async function png(){
  await loadMe(); const c = storyCanvas(), g = c.getContext('2d'), s = newS(); go(s, 'reveal'); s.k = 1; s.t = 2.2;
  paint(g, s, Object.assign(assets(W), { rm:true }));
  return new Promise(ok=>c.toBlob(ok, 'image/png'));
}
const MIMES = ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
async function video(onP){
  await loadMe();
  const mime = typeof MediaRecorder === 'undefined' ? null : MIMES.find(m=>{ try{ return MediaRecorder.isTypeSupported(m); }catch(e){ return false; } });
  const c = storyCanvas(); if(!mime || !c.captureStream) throw new Error('norec');
  const g = c.getContext('2d'), s = newS(), A = Object.assign(assets(W), { rm:false }), DUR = 7.6;
  paint(g, s, A);
  const stream = c.captureStream(30), rec = new MediaRecorder(stream, { mimeType:mime, videoBitsPerSecond:6e6 }), parts = [];
  rec.ondataavailable = e=>{ if(e.data && e.data.size) parts.push(e.data); };
  return new Promise((ok, no)=>{
    let iv = 0; const t0 = performance.now(); let lt = t0;
    const kill = setTimeout(()=>{ clearInterval(iv); no(new Error('timeout')); try{ rec.stop(); }catch(e){} }, 30000);   // 멈춘 채 기다리지 않게
    rec.onstop = ()=>{ clearTimeout(kill); clearInterval(iv); stream.getTracks().forEach(t=>t.stop()); const b = new Blob(parts, { type:mime.split(';')[0] }); b.size ? ok(b) : no(new Error('empty')); };
    rec.start(250);
    iv = setInterval(()=>{
      const now = performance.now(), el = (now - t0) / 1000, dt = Math.min(.1, (now - lt) / 1000); lt = now;
      const ph = el < 1.7 ? 'paddle' : el < 3.5 ? 'ride' : el < 4.7 ? 'tug' : el < 5.6 ? 'pop' : 'reveal';
      if(s.ph !== ph){ go(s, ph); splash(s, 600, BY + 60, 14); }
      if(ph === 'paddle' && Math.floor(s.k / .34) > s.n){ s.n++; splash(s, 330, BY + 40, 6); splash(s, 750, BY + 40, 6); }
      if(ph === 'tug' && Math.floor(s.k / .35) > s.pulls){ s.pulls++; splash(s, 700, BY + 60, 8); }
      step(s, dt); paint(g, s, A); onP?.(Math.min(1, el / DUR));
      if(el >= DUR){ clearInterval(iv); try{ rec.stop(); }catch(e){} }
    }, 1000 / 30);
  });
}
function saveBlob(blob, name){ const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 4000); }
async function shareFile(file){
  try{ if(navigator.canShare?.({ files:[file] })){ await navigator.share({ files:[file] }); return true; } }
  catch(e){ if(e?.name === 'AbortError') return true; }
  return false;
}
async function onClick(e){
  const t = e.target.closest('button, .sheet-dim'); if(!t || t.disabled) return;
  if(t.matches('[data-pclose]')) return close();
  if(t.matches('[data-pgo]')) return start();
  if(t.matches('[data-ppad]')){ if(e.detail === 0) paddle(); return; }   // 키보드 — 손가락은 pointerdown 이 맡는다
  if(t.matches('[data-ppull]')) return pull();
  if(t.matches('[data-pimg], [data-pimgsh]')){
    t.disabled = true; let b = null; try{ b = await png(); }catch(e){} t.disabled = false;
    if(!b) return say('그림을 만들지 못했어요 — 화면을 캡처해 주세요');
    const f = new File([b], `pepero-surf-${Date.now()}.png`, { type:'image/png' });
    if(t.matches('[data-pimgsh]') && await shareFile(f)) return;
    saveBlob(b, f.name); say('📸 스토리 이미지를 저장했어요'); window.track?.('action', 'pepero_img'); return;
  }
  if(t.matches('[data-pvid]')){
    if(vid && vid.p != null) return;
    vid = { p:0 }; paintVid();
    try{ const b = await video(p=>{ if(vid && vid.p != null && Math.round(p * 20) !== Math.round(vid.p * 20)){ vid.p = p; paintVid(); } else if(vid) vid.p = p; });
      vid = { blob:b, webm:/webm/.test(b.type) }; window.track?.('action', 'pepero_video'); }
    catch(err){ vid = null; say(err && err.message === 'norec' ? '이 브라우저는 영상을 못 만들어요 — 이미지를 올려 주세요' : '영상을 만들지 못했어요 — 이미지를 올려 주세요'); }
    return paintVid();
  }
  if(t.matches('[data-pvsave], [data-pvsh]') && vid && vid.blob){
    const ext = vid.webm ? 'webm' : 'mp4', f = new File([vid.blob], `pepero-surf-${Date.now()}.${ext}`, { type:vid.blob.type });
    if(t.matches('[data-pvsh]') && await shareFile(f)) return;
    saveBlob(vid.blob, f.name); say('🎬 영상을 저장했어요');
  }
}

/* ── 홈 맨 위 띠 — 생일 띠(bday.js)·특보 띠(kcg.js) 아래 ── */
function bar(){
  const home = document.getElementById('pane-home'); if(!home) return;
  let el = document.getElementById('pepero-bar');
  if(!live()){ if(el) el.hidden = true; return; }
  if(!el){ el = document.createElement('button'); el.type = 'button'; el.id = 'pepero-bar'; el.className = 'bday-bar pep-bar'; el.onclick = ()=>open();
    const ref = document.getElementById('bday-bar') || document.getElementById('adv-bar'); home.insertBefore(el, ref && ref.parentNode === home ? ref.nextSibling : home.firstChild); }
  const p = res && prizeOf(res);
  el.innerHTML = `<i aria-hidden="true">🍫</i><span><b>빼빼로 서핑 — 발밑에 걸린 선물</b><small>${p ? `내 선물 ${esc(p.ic + ' ' + p.n)} · 스토리로 자랑해요` : '11.11 · 패들 몇 번이면 선물이 걸려요'}</small></span><em>${p ? '보기 ›' : '도전 ›'}</em>`;
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  el.hidden = false;
}
function boot(){ if(!meOk() || !document.body.classList.contains('has-nav')) return false; loadLocal(); bar(); if(live()) pullMine(); return true; }
if(!boot()){ const iv = setInterval(()=>{ if(boot()) clearInterval(iv); }, 500); }
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'visible' && meOk()) bar(); });
if(!meOk() && new URLSearchParams(location.search).get('go') === 'pepero') setTimeout(()=>say('🍫 로그인하면 빼빼로 서핑이 바로 열려요'), 1500);
window.peperoOpen = open; window.peperoLive = live;
window._pepero = { PRIZES, pick, png, video, paddle, pull, get res(){ return res; }, get S(){ return S; }, get wall(){ return wall; } };
})();
