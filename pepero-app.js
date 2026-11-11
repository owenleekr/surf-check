/* ── 🎁 11.11 낙산 해변 빼빼로 선물 — 빼빼로데이 이벤트 페이지(/pepero = pepero.html) ─────────────────
   로그인 없이 연다. 양양서핑학교 6기·코치 명단(아래 STUDENTS·STAFF)에서 내 이름을 찾고 → 남자/여자 탭에서 캐릭터를 고르고 →
   낙산 해변 탐험(모래사장 보드 넷 1111 지나기 → 라인업까지 패들 → 세트 기다리기 → 리시가 묵직 → 영차 ×3) → 선물상자 → 경품.
   한 이름 한 번 — 결과는 이 기기(localStorage)와 place_talk 표(target 'pepero:2026', id 'pepero26:<이름>', user_id 'roster:<이름>',
   text '<경품id>|<보이는 이름>')에 남는다. 뽑기 전에 그 이름의 줄이 있으면(앱에서 먼저 뽑은 줄 포함) 그 결과를 보여 준다.
   같은 이름 두 번째 줄은 id 가 겹쳐 서버가 받지 않는다(409) — 그때는 서버 결과로 맞춘다.
   당첨 뒤 인스타 스토리용 그림(1080×1920 PNG)과 짧은 영상(약 11초)을 폰에서 만든다 — 서버로는 당첨 한 줄만 간다.
   그림은 클레이 일러스트(img/pepero, GPT·제미나이로 그려 다듬음) 위에 카메라 이동·색 보정·빛 번짐·비네트·필름 결을 얹은 시네마틱 연출. */
(function(){
/* 이벤트 기간(한국 시간) — 도전이 열리는 때. 바꾸려면 여기와 pepero.js(앱 띠) 둘 다 */
const START = Date.parse('2026-11-11T00:00:00+09:00'), END = Date.parse('2026-11-13T00:00:00+09:00');
const TARGET = 'pepero:2026', LS = 'lineup.pepero2026:', LSME = 'lineup.pepero.me';
/* 경품 — 이름·이모지·확률(w, 서로의 비율) 자유롭게 고쳐도 된다. 꽝 없음.
   ⚠️ 아래 값은 자리표시 — 실제 준비한 경품에 맞게 고칠 것(id 는 이미 뽑힌 기록과 맞추는 열쇠라 바꾸지 말 것) */
const PRIZES = [
  { id:'p1', rank:'1등',   ic:'🎁', n:'빼빼로 한 상자',          w:5 },
  { id:'p2', rank:'2등',   ic:'🍫', n:'빼빼로 1개',              w:30 },
  { id:'p3', rank:'3등',   ic:'☕', n:'다음 서핑 날 커피 한 잔', w:15 },
  { id:'p4', rank:'참여상', ic:'🐚', n:'참여 선물',               w:50 },
];
/* 캐릭터 — 남자/여자 탭에서 넷 중 하나(이름으로 성별을 짐작하지 않는다 — 본인이 고른다).
   클레이 캐릭터 그림(GPT) 한 사람에 세 자세: pad 엎드려 패들 · sit 보드에 앉아 기다리기 · gift 선물상자 들고 서기 → img/pepero/<id>-<자세>.webp */
const LOOKS = { m:[ { id:'m1', ko:'웻슈트' }, { id:'m2', ko:'버킷햇' }, { id:'m3', ko:'수염 서퍼' }, { id:'m4', ko:'금발 곱슬' } ],
  f:[ { id:'f1', ko:'포니테일' }, { id:'f2', ko:'헤어밴드' }, { id:'f3', ko:'웨이브' }, { id:'f4', ko:'올림머리' } ] };
const W = 1080, H = 1920, BY = 1120;   // 스토리 좌표 — 화면 캔버스도 같은 좌표를 줄여서 그린다(BY: 물보라 높이)
const FONT = '"Apple SD Gothic Neo","Noto Sans KR",sans-serif', INK = '#2B2340';
const RM = (()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })();
/* 시연 모드(?demo=1) — 사람들 앞에서 몇 번이고 돌려 보는 용. 뽑기는 진짜 랜덤이지만 서버에 아무것도 안 쓰고, 이름도 안 잠그고, 새로 열면 다 잊는다(기간과도 상관없이 열린다) */
const DEMO = /(^|[?&])demo=1(&|$)/.test(location.search), MEM = {};
const store = { get:k => DEMO ? (MEM[k] ?? null) : localStorage.getItem(k), set:(k, v) => { if(DEMO) MEM[k] = v; else localStorage.setItem(k, v); } };
const live = () => { const n = Date.now(); return DEMO || (n >= START && n < END); };
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const label = p => `${p.ic} ${p.rank} ${p.n}`;
const seen = r => String(r && r.text || '').split('|').slice(1).join('|') || String(r && r.text || '');
function say(t){ const el = $('pp-toast'); if(!el) return; el.textContent = t; el.hidden = false; clearTimeout(say.t); say.t = setTimeout(()=>{ el.hidden = true; }, 2600); }
let me = null, res = null, wall = [], checking = null, imgs = {}, cv = null, raf = 0, S = null, vid = null, X = null, last = 0;

/* ── 참가 명단 — 이 이벤트만의 명단(roster.js 와 따로). 6기 18명(운영자 이성현 뺌) + 코치·매니저 6명 = 24명. 바꾸려면 여기만 ── */
const STUDENTS = ['김도훈','김태은','심재영','이나영','이미진','정선아','조혜미','허예령','홍미영','최원재','장은옥','박초롱','이한솔','정유정','전영훈','전인수','엄주승','장베드로'];
const STAFF = [['이승대','교장'],['김나리','코치'],['이해룡','코치'],['이상문','코치'],['장진혁','코치'],['김법성','매니저']];
const PEOPLE = [...STUDENTS.map(name=>({ name, cohort:'6기' })), ...STAFF.map(([name, role])=>({ name, cohort:role, staff:1 }))];
const lookOf = m => m && LOOKS[m.g] && LOOKS[m.g][m.li] ? LOOKS[m.g][m.li].id : 'f1';
function loadMe(){ try{ const v = JSON.parse(store.get(LSME) || 'null'); if(v && PEOPLE.some(p=>p.name === v.name)) me = { name:v.name, cohort:PEOPLE.find(p=>p.name === v.name).cohort, g:v.g === 'm' ? 'm' : 'f', li:Math.min(3, Math.max(0, v.li | 0)) }; }catch(e){} }
function saveMe(){ try{ store.set(LSME, JSON.stringify(me)); }catch(e){} }

/* ── 서버(place_talk) — anon 키, 다른 표와 같은 수준 ── */
async function api(path, opt){
  const C = window.SURF_CONFIG || {}, sig = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(opt ? 20000 : 12000) : undefined;
  const r = await fetch(`${C.supabaseUrl}/rest/v1/${path}`, { headers:{ apikey:C.supabaseKey, Authorization:'Bearer ' + C.supabaseKey, 'Content-Type':'application/json', Prefer:'return=minimal' }, signal:sig, ...opt });
  if(!r.ok) throw Object.assign(new Error('HTTP ' + r.status), { status:r.status });
  return r.status === 204 || r.status === 201 ? null : r.json().catch(()=>null);
}
const ours = r => (Array.isArray(r) ? r : []).filter(x=>x && x.target === TARGET);
function pick(){
  const tot = PRIZES.reduce((a, p)=>a + p.w, 0), u = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 * tot;
  let acc = 0; for(const p of PRIZES){ acc += p.w; if(u < acc) return p; }
  return PRIZES[PRIZES.length - 1];
}
const prizeOf = r => r && (PRIZES.find(p=>p.id === r.id) || { id:r.id, rank:'', ic:'🎁', n:seen(r).slice(0, 30) || '선물' });
function loadRes(){ res = null; try{ const v = JSON.parse(store.get(LS + me.name) || 'null'); if(v && typeof v.id === 'string') res = v; }catch(e){} }
function saveRes(){ try{ store.set(LS + me.name, JSON.stringify(res)); }catch(e){} }
/* 이 이름으로 이미 뽑았나 — 앱에서 뽑은 줄(user_id 가 계정)도 이름으로 찾는다 */
function pullMine(){
  if(checking) return checking;
  const nm = me.name;
  if(DEMO) return Promise.resolve();   // 시연은 서버 기록을 안 본다(이름 안 잠금)
  checking = (async ()=>{
    try{ const r = ours(await api(`place_talk?select=id,target,user_id,name,text,created_at&target=eq.${encodeURIComponent(TARGET)}&name=eq.${encodeURIComponent(nm)}&order=created_at.asc&limit=5`)).find(x=>x.name === nm);
      if(me && me.name === nm){
        if(r){ res = { id:String(r.text || '').split('|')[0], text:String(r.text || ''), at:Date.parse(r.created_at) || Date.now(), sent:1 }; saveRes(); }
        else if(res && !res.sent) send();
      }
    }catch(e){}
    checking = null;
  })();
  return checking;
}
async function pullWall(){
  try{ wall = ours(await api(`place_talk?select=id,target,user_id,name,cohort,text,created_at&target=eq.${encodeURIComponent(TARGET)}&order=created_at.desc&limit=40`)).slice(0, 40); }catch(e){}
  paintWall();
}
async function send(){
  if(!res || res.sent || !me) return;
  if(DEMO){ res.sent = 1; wall = [{ id:'demo', name:me.name + ' (시연)', text:res.text }, ...wall.filter(r=>r.id !== 'demo')]; paintWall(); return; }   // 시연은 화면에만
  const row = { id:`pepero26:${me.name}`, target:TARGET, parent:null, user_id:`roster:${me.name}`.slice(0, 32), name:me.name, cohort:me.cohort, text:res.text, created_at:new Date(res.at).toISOString() };
  try{ await api('place_talk', { method:'POST', body:JSON.stringify(row) }); res.sent = 1; saveRes(); wall = [row, ...wall.filter(r=>r.id !== row.id)].slice(0, 40); paintWall(); }
  catch(e){ if(e && e.status === 409){ res.sent = 1; await pullMine(); ctl(); if(X) X.prize = prizeOf(res); } }   // 같은 이름이 이미 뽑았다 — 서버 결과로. 못 보냈으면 다음에 열 때 다시
}
function claim(){
  if(res) return prizeOf(res);
  const p = pick(); res = { id:p.id, text:`${p.id}|${label(p)}`, at:Date.now(), sent:0 }; saveRes();
  send(); return p;
}

/* ── 그림 — 낙산 해변 클레이 일러스트(img/pepero/*.webp). bg: 해변(의상대·보드 넷 = 1111) · tug: 물속 단면 · gift: 선물상자 · p1~p4: 경품 스티커 ── */
const PIC = {}, PICP = {}, ALL = ['bg', 'tug', 'gift', 'p1', 'p2', 'p3', 'p4'];
function want(ns){ return Promise.all(ns.map(n=>PICP[n] || (PICP[n] = new Promise(ok=>{ const im = new Image();
  im.onload = ()=>{ PIC[n] = im; ok(); }; im.onerror = ()=>{ delete PICP[n]; ok(); }; im.src = `img/pepero/${n}.webp`; })))); }   // 못 받으면 다음에 다시 — 그동안은 색으로 그린다
const stickerOf = p => p && PRIZES.some(x=>x.id === p.id) ? p.id : 'gift';
/* 흐린 배경(피사계 심도) — 작게 줄였다 늘려서 만든다(캔버스 filter 는 iOS 에서 안 먹는다). 한 번만 */
function soft(n){
  const im = PIC[n]; if(!im) return null; if(PIC[n + '~']) return PIC[n + '~'];
  const a = document.createElement('canvas'); a.width = 72; a.height = 128; a.getContext('2d').drawImage(im, 0, 0, 72, 128);
  const b = document.createElement('canvas'); b.width = 216; b.height = 384; const g = b.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(a, 0, 0, 216, 384);
  return PIC[n + '~'] = b;
}
let GRAIN = null;
function grain(){ if(GRAIN) return GRAIN; const c = document.createElement('canvas'); c.width = c.height = 160; const g = c.getContext('2d'), d = g.createImageData(160, 160);
  for(let i = 0; i < d.data.length; i += 4){ const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 40; } g.putImageData(d, 0, 0); return GRAIN = c; }
function rr(g, x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
/* 클레이 덩어리 — 아래로 두툼한 옆면 + 위쪽 윤기 */
function clay(g, x, y, w, h, r, face, side, lift){
  g.fillStyle = 'rgba(60,40,90,.16)'; rr(g, x + 6, y + lift + 14, w, h, r); g.fill();
  g.fillStyle = side; rr(g, x, y + lift, w, h, r); g.fill();
  g.fillStyle = face; rr(g, x, y, w, h, r); g.fill();
  const gl = g.createLinearGradient(0, y, 0, y + h * .5); gl.addColorStop(0, 'rgba(255,255,255,.7)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gl; rr(g, x + 6, y + 5, w - 12, h * .5, Math.max(4, r - 6)); g.fill();
}
function fit(g, t, max, size, weight){ do{ g.font = `${weight} ${size}px ${FONT}`; size -= 4; }while(g.measureText(t).width > max && size > 20); }
function pill(g, t, x, y, size, face, side, ink){
  g.font = `900 ${size}px ${FONT}`; const w = g.measureText(t).width + size * 1.4, h = size * 1.75;
  clay(g, x - w / 2, y, w, h, h / 2, face, side, Math.round(size * .18));
  g.textAlign = 'center'; g.fillStyle = ink || INK; g.fillText(t, x, y + h * .5 + size * .36);
}
/* 제목 — 하얀 클레이 글자 + 분홍 옆면 + 부드러운 그림자 */
function title(g, t, x, y, size, max){
  fit(g, t, max, size, 900); const s = +(g.font.match(/(\d+)px/) || [0, size])[1], d = Math.round(s * .09);
  g.textAlign = 'center'; g.lineJoin = 'round';
  g.save(); g.shadowColor = 'rgba(70,30,60,.45)'; g.shadowBlur = s * .45; g.shadowOffsetY = s * .14; g.fillStyle = '#E86F86'; g.fillText(t, x, y + d); g.restore();
  g.lineWidth = s * .08; g.strokeStyle = '#F3A0B2'; g.strokeText(t, x, y); g.fillStyle = '#fff'; g.fillText(t, x, y);
}
/* 꽉 채워 그리기 + 아주 느린 켄번스(z 배, fx·fy 고정점). 그림을 못 받았으면 하늘·바다·모래 색만 */
function back(g, im, t, z, fx, fy){
  if(!im){ const gr = g.createLinearGradient(0, 0, 0, H); [[0, '#9FD8F5'], [.46, '#FFD9C2'], [.5, '#5CC6D0'], [.68, '#9BE3DA'], [.71, '#F6E3BD'], [1, '#EED3A0']].forEach(([o, c])=>gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, W, H); return; }
  const k = z + .018 * Math.sin(t * .23), dx = Math.sin(t * .17) * (k - 1) * 300;
  g.drawImage(im, fx - fx * k + dx, fy - fy * k, W * k, H * k);
}
const cam = (g, z, fx, fy) => { g.translate(fx, fy); g.scale(z, z); g.translate(-fx, -fy); };
/* 파스텔 서프보드(옆모습) — 그림자·옆면·윤기·줄무늬 */
function board(g, x, y, len, th, ang){
  const L = len / 2, r = th / 2;
  g.save(); g.translate(x, y); g.rotate(ang);
  g.fillStyle = 'rgba(16,70,100,.22)'; g.beginPath(); g.ellipse(10, th * .95, L * .96, th * .42, 0, 0, 7); g.fill();
  g.fillStyle = '#E86F86'; g.beginPath(); g.ellipse(0, th * .26, L, r, 0, 0, 7); g.fill();
  const gr = g.createLinearGradient(0, -r, 0, r); gr.addColorStop(0, '#FFC2CD'); gr.addColorStop(1, '#FF8FA3');
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, L, r, 0, 0, 7); g.fill();
  g.save(); g.clip(); g.fillStyle = '#FFE08A'; g.fillRect(L * .38, -r, th * .34, th); g.fillStyle = '#fff'; g.fillRect(L * .38 + th * .5, -r, th * .16, th); g.restore();
  g.fillStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.ellipse(-L * .3, -r * .42, L * .42, r * .2, 0, 0, 7); g.fill();
  g.restore();
}
function bubble(g, x, y, r){
  g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.lineWidth = Math.max(2, r * .16); g.strokeStyle = 'rgba(255,255,255,.85)'; g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x - r * .36, y - r * .36, r * .22, 0, 7); g.fill();
}
function glint(g, x, y, s, a){   // 물 위 반짝임 — 네 갈래 빛
  g.globalAlpha = a; g.fillStyle = '#FFF6DA';
  g.beginPath(); g.ellipse(x, y, s, s * .14, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(x, y, s * .14, s * .7, 0, 0, 7); g.fill();
  g.globalAlpha = 1;
}
/* 해변 위 빛 — 해 번짐 + 렌즈 플레어 + 물비늘 (배경과 같은 카메라 안에서) */
const SUN = [150, 935];
function sunFx(g, t, a){
  g.save(); g.globalCompositeOperation = 'screen';
  const gr = g.createRadialGradient(SUN[0], SUN[1], 10, SUN[0], SUN[1], 520); gr.addColorStop(0, `rgba(255,236,190,${.85 * a})`); gr.addColorStop(.3, `rgba(255,190,140,${.35 * a})`); gr.addColorStop(1, 'rgba(255,190,140,0)');
  g.fillStyle = gr; g.fillRect(0, 300, W, 1300);
  [[.45, 50, 'rgba(255,200,160,'], [.8, 26, 'rgba(160,230,255,'], [1.25, 80, 'rgba(255,220,170,']].forEach(([f, r, c], i)=>{
    const x = SUN[0] + (560 - SUN[0]) * f * 1.6, y = SUN[1] + (980 - SUN[1]) * f * 1.6 + Math.sin(t * .4 + i) * 6;
    g.fillStyle = c + (.16 * a) + ')'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
  g.restore();
  for(let i = 0; i < 12; i++){ const x = 120 + (i * 173) % 900, y = 990 + (i * 67) % 260, tw = Math.max(0, Math.sin(t * (1.3 + i % 3 * .4) + i * 2.1));
    glint(g, x, y, 16 + (i % 3) * 8, tw * .85 * a); }
}
/* 탐험 — 모래사장 보드 넷 세기(1111) → 물가에서 엎드려 패들(진짜 누워서, 팔 젓기) → 라인업에 앉아 세트 기다리기 */
const BOARDS = [105, 236, 356, 476], STROKE = .62;
function rider(g, s, X, t){
  if(s.ph === 'intro' || s.ph === 'walk'){
    BOARDS.forEach((bx, i)=>{ const on = Math.min(1, Math.max(0, (s.wp - i - .2) * 2)); if(on <= 0) return;
      const sc = X.rm ? 1 : .6 + .4 * easeBack(on); g.save(); g.translate(bx, 1290); g.scale(sc, sc); pill(g, '1', 0, -40, 52, '#FFE08A', '#E7B640'); g.restore(); });
    return;
  }
  const p = s.pg, sc = 1 - .3 * p, sit = s.ph !== 'paddle', im = sit ? X.sit : X.pad;
  let x = 400 + 240 * p, y = 1310 - 220 * p + Math.sin(t * 2.2) * 7 * sc, ang = Math.sin(t * 1.7) * .025;
  if(!sit && !X.rm){ const st = (s.t % STROKE) / STROKE; ang += Math.sin(st * 6.283) * .03; y -= Math.abs(Math.sin(st * Math.PI)) * 7 * sc; x += st * 6; }   // 팔 한 번 저을 때마다 살짝 들썩
  if(s.ph === 'tug' && !X.rm){ const m = 1 + s.pulls * .5; x += Math.sin(s.t * 47) * 7 * m; y += 8 + Math.sin(s.t * 39) * 4 * m; ang += Math.sin(s.t * 31) * .03 * m; }
  if(sit){   // 다가오는 세트 — 부드러운 물결 줄
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineCap = 'round';
    for(let i = 0; i < 4; i++){ const yy = 980 + ((t * 70 + i * 95) % 380), a = (yy - 980) / 380; g.lineWidth = 4 + a * 8; g.globalAlpha = Math.sin(a * Math.PI) * .9;
      g.beginPath(); g.moveTo(x - 420 * (.6 + a), yy); g.quadraticCurveTo(x, yy - 22 - a * 20, x + 420 * (.6 + a), yy); g.stroke(); } g.globalAlpha = 1;
  }
  const w = (sit ? 380 : 500) * sc, h = im ? w * im.height / im.width : 0;
  g.fillStyle = 'rgba(16,70,100,.24)'; g.beginPath(); g.ellipse(x, y - 4, w * .46, 20 * sc, 0, 0, 7); g.fill();
  s.hx = x + w * .42; s.hy = y - h * .12;   // 손 끝 — 물보라가 여기서
  g.save(); g.translate(x, y); g.rotate(ang);
  if(im) g.drawImage(im, -w / 2, -h, w, h);
  else{ board(g, 0, -20 * sc, 430 * sc, 52 * sc, 0); g.textAlign = 'center'; g.font = `${Math.round(200 * sc)}px ${FONT}`; g.fillText('🏄', 0, -40); }
  g.restore();
}
/* 발밑 단면 — 들어설 때 뒤로 빠지며(드러내기) 보여 주고, 리시를 당길수록 선물상자 쪽으로 다가간다 */
function tugScene(g, s, X, t){
  const inK = X.rm ? 1 : Math.min(1, s.k / 1.4), z = 1.04 + s.pulls * .07 + .3 * Math.pow(1 - inK, 3) + (s.ph === 'pop' ? .25 * Math.min(1, s.k / .35) : 0);
  g.save();
  if(s.ph === 'tug' && !X.rm){ const m = 1 + s.pulls * .6; g.translate(Math.sin(s.t * 47) * 5 * m, Math.sin(s.t * 39) * 4 * m); }
  back(g, PIC.tug, t, z, 487, 1462);
  g.restore();
  g.save(); g.globalCompositeOperation = 'screen';   // 물속 빛줄기
  for(let i = 0; i < 4; i++){ const x0 = 180 + i * 230 + Math.sin(t * .5 + i) * 40, gr = g.createLinearGradient(0, 560, 0, 1700);
    gr.addColorStop(0, 'rgba(220,255,250,.28)'); gr.addColorStop(1, 'rgba(220,255,250,0)'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(x0, 560); g.lineTo(x0 + 70, 560); g.lineTo(x0 + 260, 1700); g.lineTo(x0 + 90, 1700); g.closePath(); g.fill(); }
  g.restore();
  for(let i = 0; i < 18; i++){ const sp = 120 + (i % 5) * 40, y = 1560 - ((t * sp + i * 97) % 1000), x = 487 + Math.sin(i * 12.9 + t * 1.3) * (60 + (i % 4) * 60);
    bubble(g, x, y, 10 + (i % 4) * 7); }
}
const easeBack = x => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
const CF = Array.from({ length:40 }, (_, i)=>({ x:i % 2 ? (i * 37) % 160 : 920 + (i * 41) % 160,   // 양옆으로만 — 제목·선물·카드를 가리지 않게
  sp:260 + (i * 53) % 240, ph:(i * 311) % 900, s:10 + (i % 3) * 4, r:i * .7 }));
const CFC = ['#FF8FA3', '#FFD86B', '#7FD6E8', '#8EE3B5', '#C3A6FF', '#7A4A2E'];   // 빼빼로 스프링클
const BOKEH = Array.from({ length:18 }, (_, i)=>({ x:(i * 211) % 1080, y:(i * 389) % 1300, r:14 + (i * 7) % 34, a:.12 + (i % 4) * .06, sp:8 + (i % 5) * 6 }));
function rays(g, x, y, t, a){
  g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'screen'; g.translate(x, y); g.rotate(t * .08);
  const gr = g.createRadialGradient(0, 0, 40, 0, 0, 900); gr.addColorStop(0, 'rgba(255,240,200,.7)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = gr; for(let i = 0; i < 14; i++){ const a0 = i / 14 * 6.283; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 1100, a0, a0 + .16); g.closePath(); g.fill(); }
  g.beginPath(); g.arc(0, 0, 300, 0, 7); g.fill();
  g.restore();
}
function wrap(g, t, max, size){   // 한 줄이 넘치면 두 줄 너비가 가장 고르게 되는 곳에서 나눈다(낱말 짝을 가르지 않게)
  const ws = String(t).split(' ');
  for(;; size -= 4){ g.font = `900 ${size}px ${FONT}`;
    if(g.measureText(t).width <= max) return [[t], size];
    let best = null; for(let i = 1; i < ws.length; i++){ const a = ws.slice(0, i).join(' '), b = ws.slice(i).join(' '), m = Math.max(g.measureText(a).width, g.measureText(b).width); if(!best || m < best[0]) best = [m, a, b]; }
    if((best && best[0] <= max) || size <= 30) return [best ? [best[1], best[2]] : [t], size]; }
}
/* 흐린 배경 위 또렷한 선물 — 위쪽(하늘·바다)은 흐리게, 아래 모래·보드 넷은 그대로(얕은 심도) */
function dof(g, t, a){
  const b = soft('bg'); if(!b || a <= 0) return;
  g.save(); g.globalAlpha = a; g.beginPath(); g.rect(0, 0, W, 1300); g.clip(); back(g, b, t, 1.02, 540, 1150); g.restore();
  g.save(); g.globalAlpha = a * .5; g.beginPath(); g.rect(0, 1300, W, 110); g.clip(); back(g, b, t, 1.02, 540, 1150); g.restore();
}
/* 경품 스티커 — 하얀 테두리 스티커 위에 경품 그림 · 등수 · 이름 */
function badge(g, p, cx, cy, rot, sc){
  const w = 440, h = 520;
  g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(sc, sc);
  g.save(); g.shadowColor = 'rgba(60,30,60,.35)'; g.shadowBlur = 34; g.shadowOffsetY = 16; g.fillStyle = '#fff'; rr(g, -w / 2, -h / 2, w, h, 74); g.fill(); g.restore();
  const gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, '#FFFBF3'); gr.addColorStop(1, '#FFEFD6');
  g.fillStyle = gr; rr(g, -w / 2 + 16, -h / 2 + 16, w - 32, h - 32, 60); g.fill();
  const im = PIC[stickerOf(p)], SZ = 210;
  if(im){ const f = Math.min(SZ / im.width, SZ / im.height); g.save(); g.translate(0, -h / 2 + 36 + SZ / 2); g.rotate(-.08); g.drawImage(im, -im.width * f / 2, -im.height * f / 2, im.width * f, im.height * f); g.restore(); }
  else{ g.textAlign = 'center'; g.font = `170px ${FONT}`; g.fillText(p.ic, 0, -h / 2 + 220); }
  const pc = p.rank === '1등' ? ['#FFD86B', '#E7B640'] : p.rank === '참여상' ? ['#A8EBCF', '#6CCBA6'] : ['#FFC2CD', '#EE8FA3'];
  pill(g, p.rank || '선물', 0, 4, 40, pc[0], pc[1]);
  const [ls, fs] = wrap(g, p.n, w - 70, 60);
  g.fillStyle = INK; g.textAlign = 'center'; g.font = `900 ${fs}px ${FONT}`; ls.forEach((l, i)=>g.fillText(l, 0, 176 + fs * .35 + (i - (ls.length - 1) / 2) * fs * 1.15));
  g.restore();
}
/* 날짜 도장 — 둥근 분홍 스탬프 */
function stamp(g, x, y, rot){
  g.save(); g.translate(x, y); g.rotate(rot);
  g.save(); g.shadowColor = 'rgba(120,30,60,.35)'; g.shadowBlur = 18; g.shadowOffsetY = 8; g.fillStyle = '#E86F86'; g.beginPath(); g.arc(0, 8, 98, 0, 7); g.fill(); g.restore();
  g.fillStyle = '#FF8FA3'; g.beginPath(); g.arc(0, 0, 98, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 5; g.setLineDash([10, 9]); g.beginPath(); g.arc(0, 0, 84, 0, 7); g.stroke(); g.setLineDash([]);
  g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = `900 58px ${FONT}`; g.fillText('11.11', 0, 6); g.font = `900 22px ${FONT}`; g.fillText('빼빼로데이', 0, 46);
  g.restore();
}
/* 선물 장면 — 햇살 위로 선물상자가 튀어 오르고(찌그러졌다 펴지며) → 포스터: 제목 · 날짜 도장 · 경품 스티커 · 선물상자 든 나 · 「서프 버디 ○○」 · 같이 하자는 한 줄 */
function prizeScene(g, s, X, t){
  const pop = s.ph === 'pop', k = pop ? Math.min(1, s.k / .7) : 1, rk = X.rm ? 1 : Math.min(1, s.k / .7), e = 1 - Math.pow(1 - rk, 3);
  dof(g, t, pop ? Math.min(1, s.k / .5) : 1);
  g.fillStyle = 'rgba(255,240,225,.12)'; g.fillRect(0, 0, W, H);
  rays(g, pop ? 540 : 680, pop ? 730 : 1060, t, pop ? k * .8 : .85);
  if(!pop) for(const b of BOKEH){ const y = ((b.y - t * b.sp) % 1300 + 1300) % 1300; g.globalAlpha = b.a; g.fillStyle = '#FFF4DC'; g.beginPath(); g.arc(b.x, y, b.r, 0, 7); g.fill(); } g.globalAlpha = 1;
  /* 바다에서 건진 선물상자 — 튀어 올랐다가 공개 때 모래 위 왼쪽으로 내려앉는다 */
  let gx = 540, gb = 905, gh = 350, sx = 1, sy = 1;
  if(pop && !X.rm){ gb = 1900 - (1900 - 905) * (1 - Math.pow(1 - k, 3)); if(k < 1){ sx = .84; sy = 1.18; }
    else{ const l = Math.min(1, (s.k - .7) / .3), w = Math.sin(l * Math.PI * 2.5) * (1 - l) * .2; sx = 1 + w; sy = 1 - w; } }
  else if(!pop){ gx = 540 + (225 - 540) * e; gb = 905 + (1545 - 905) * e; gh = 350 + (250 - 350) * e; }
  const gim = PIC.gift;
  const drawGift = ()=>{ g.save(); g.translate(gx, gb); g.scale(sx, sy); if(gim){ const w = gh * gim.width / gim.height; g.drawImage(gim, -w / 2, -gh, w, gh); } else{ g.textAlign = 'center'; g.font = `${gh * .7}px ${FONT}`; g.fillText('🎁', 0, -gh * .15); } g.restore(); };
  if(pop){ drawGift(); return; }
  const tk = X.rm ? 1 : Math.min(1, s.k / .6), ty = (1 - tk) * -30, pk = X.rm ? 1 : Math.min(1, Math.max(0, (s.k - .25) / .5));
  /* 선물상자 든 나 */
  if(X.gift){ const h = 760, w = h * X.gift.width / X.gift.height, cx = 700, fy = 1540, b = X.rm ? 0 : Math.sin(t * 2.4) * 6;
    g.fillStyle = 'rgba(90,60,30,.26)'; g.beginPath(); g.ellipse(cx, fy - 8, w * .42, 26, 0, 0, 7); g.fill();
    const sc2 = X.rm ? 1 : .6 + .4 * easeBack(Math.min(1, s.k / .55));
    g.save(); g.translate(cx, fy); g.scale(sc2, sc2); g.drawImage(X.gift, -w / 2, -h + b, w, h); g.restore(); }
  drawGift();
  if(X.prize && pk > 0) badge(g, X.prize, 300, 1010, -.07, X.rm ? 1 : .5 + .5 * easeBack(pk));
  g.globalAlpha = tk;
  pill(g, '양양서핑학교 서프 버디', W / 2 + 70, 268 + ty, 36, '#A8EBCF', '#6CCBA6');
  title(g, '낙산 해변에서', W / 2, 462 + ty, 118, 960);
  title(g, '건진 선물!', W / 2, 612 + ty, 156, 960);
  g.globalAlpha = 1;
  stamp(g, 150, 300, -.22);
  if(X.name) pill(g, '서프 버디 ' + String(X.name).slice(0, 10), 700, 1530, 40, '#fff', '#E8DCCB');
  g.fillStyle = 'rgba(255,255,255,.88)'; rr(g, 90, 1626, 900, 76, 38); g.fill();
  g.textAlign = 'center'; g.fillStyle = INK; fit(g, '너도 낙산에서 선물 건져 봐 → surf.owenai.xyz/pepero', 840, 34, 900); g.fillText('너도 낙산에서 선물 건져 봐 → surf.owenai.xyz/pepero', W / 2, 1676);
  if(!X.rm && s.k < 3.2){ g.globalAlpha = Math.min(1, (3.2 - s.k) / .8);
    for(const c of CF){ const yy = c.ph * .3 - 200 + s.k * c.sp; g.save(); g.translate(c.x, yy); g.rotate(c.r + s.k * 2); g.fillStyle = CFC[c.ph % 6]; rr(g, -c.s / 2, -c.s * 1.6, c.s, c.s * 3.2, c.s / 2); g.fill(); g.restore(); }
    g.globalAlpha = 1; }
}
/* 장면 상태 — 화면과 영상이 같은 걸 쓴다(입자는 미리 만들어 두고 돌려 쓴다) */
const CAM = { intro:[1, 540, 1150], walk:[1.18, 0, 1420], paddle:[1.1, 640, 1150], wait:[1.26, 610, 1080], tug:[1.3, 610, 1080], pop:[1, 540, 1000], reveal:[1, 540, 1000] };
function newS(){ return { ph:'intro', k:0, t:0, w:0, wp:0, pg:0, n:0, pulls:0, cz:1, cx:540, cy:1150, sp:Array.from({ length:48 }, ()=>({ a:0, x:0, y:0, vx:0, vy:0 })) }; }
function go(s, ph){ s.ph = ph; s.k = 0; }
function splash(s, x, y, n){ for(const q of s.sp){ if(n <= 0) break; if(q.a > 0) continue; q.a = 1; q.x = x; q.y = y; q.vx = (Math.random() - .5) * 520; q.vy = -260 - Math.random() * 420; n--; } }
function step(s, dt, rm){
  s.t += dt; s.k += dt;
  const pt = s.ph === 'intro' || s.ph === 'walk' ? 0 : s.ph === 'paddle' ? s.n / 5 : 1, e = rm ? 1 : Math.min(1, dt * 3);
  s.pg += (pt - s.pg) * e; s.wp += (s.w - s.wp) * (rm ? 1 : Math.min(1, dt * 4));
  const c = CAM[s.ph] || CAM.intro, cx = s.ph === 'walk' ? Math.min(560, Math.max(380, 105 + 125 * s.wp)) : c[1], ce = rm ? 1 : Math.min(1, dt * 1.1);   // 천천히 따라붙는 카메라
  s.cz += (c[0] - s.cz) * ce; s.cx += (cx - s.cx) * ce; s.cy += (c[2] - s.cy) * ce;
  if(s.ph === 'paddle' && !rm && s.hx && Math.floor(s.t / STROKE) !== Math.floor((s.t - dt) / STROKE)) splash(s, s.hx, s.hy, 4);   // 팔 젓는 박자마다 손끝 물보라
  for(const q of s.sp) if(q.a > 0){ q.vy += 1100 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.a -= dt * 1.3; }
}
/* 장면 자막 — 이야기 순서. 위쪽에 영화 자막처럼(물속 장면은 가운데) */
const CAP = { intro:['11월 11일 아침 · 낙산 해변', '서프 버디, 바다로 가요'], walk:['모래사장에 보드 넷이 나란히', '1 · 1 · 1 · 1'], paddle:['엎드려서 라인업까지', '패들, 패들!'],
  wait:['라인업에서 세트를 기다려요', '바다가 잔잔해요…'], tug:['어? 리시가 묵직해요…', '발밑에 뭔가 걸렸어요!'], pop:['영차, 영차!', '바다가 보낸 빼빼로 선물상자!'] };
function caption(g, s, X){
  const c = CAP[s.ph]; if(!c) return;
  const a = X.rm ? 1 : Math.min(1, s.k / .5), y = (s.ph === 'tug' ? 820 : 300) + (1 - a) * 24, main = s.ph === 'walk' && s.w >= 4 ? '1111 — 우리 6기 보드!' : c[1];
  g.save(); g.globalAlpha = a; g.textAlign = 'center';
  g.shadowColor = 'rgba(30,15,40,.6)'; g.shadowBlur = 22; g.shadowOffsetY = 4;
  g.fillStyle = '#FFE2B8'; g.font = `800 38px ${FONT}`; g.fillText(c[0], W / 2, y);
  fit(g, main, 960, 74, 900); g.fillStyle = '#fff'; g.fillText(main, W / 2, y + 92);
  g.restore();
}
/* 화면 마무리 — 따뜻한 색 보정 · 비네트 · 위아래 검은 띠(선물 공개 때 걷힌다) · 아주 옅은 필름 결 */
function post(g, s, X, t){
  g.save();
  g.globalCompositeOperation = 'soft-light'; const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,170,130,.5)'); gr.addColorStop(.55, 'rgba(255,214,170,.28)'); gr.addColorStop(1, 'rgba(120,170,220,.3)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  const v = g.createRadialGradient(W / 2, H * .48, H * .32, W / 2, H * .5, H * .78); v.addColorStop(0, 'rgba(30,15,40,0)'); v.addColorStop(1, `rgba(30,15,40,${s.ph === 'reveal' ? .32 : .5})`);
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  if(s.ph !== 'tug'){ const sc = g.createLinearGradient(0, 0, 0, 560); sc.addColorStop(0, 'rgba(30,15,40,.4)'); sc.addColorStop(1, 'rgba(30,15,40,0)'); if(CAP[s.ph]){ g.fillStyle = sc; g.fillRect(0, 0, W, 560); } }
  const lb = s.ph === 'reveal' ? (X.rm ? 0 : 150 * Math.max(0, 1 - s.k / .7)) : 150;
  if(lb > 0){ g.fillStyle = '#140E1A'; g.fillRect(0, 0, W, lb); g.fillRect(0, H - lb, W, lb); }
  if(s.ph === 'pop' && !X.rm){ const f = Math.max(0, 1 - Math.abs(s.k - .32) / .3); if(f > 0){ g.fillStyle = `rgba(255,250,235,${f * .8})`; g.fillRect(0, 0, W, H); } }   // 물 밖으로 나오는 순간 번쩍
  if(X.rm){ g.restore(); return; }   // 멈춘 그림(스토리 이미지·움직임 줄이기)엔 필름 결을 안 얹는다 — PNG 가 몇 배로 커진다
  g.globalCompositeOperation = 'overlay'; g.globalAlpha = .5;
  if(!g.__gp) g.__gp = g.createPattern(grain(), 'repeat');
  g.fillStyle = g.__gp; const ox = (s.t * 997 % 160) | 0, oy = (s.t * 613 % 160) | 0; g.translate(-ox, -oy); g.fillRect(0, 0, W + 160, H + 160);
  g.restore();
}
function paint(g, s, X){
  const ph = s.ph, t = X.rm ? 0 : s.t;
  const tugA = ph === 'tug' ? (X.rm ? 1 : Math.min(1, s.k / .6)) : ph === 'pop' ? (X.rm ? 0 : Math.max(0, 1 - s.k / .35)) : 0;
  if(tugA < 1){
    const beach = ph !== 'pop' && ph !== 'reveal';
    g.save(); if(beach) cam(g, 1 + (s.cz - 1) * .8, s.cx, s.cy);   // 배경은 조금 덜 움직여 깊이감(시차)
    back(g, PIC.bg, t, beach ? 1.05 : 1.02, 540, 1150); sunFx(g, t, beach ? 1 : .55);
    g.restore();
    if(beach){ g.save(); cam(g, s.cz, s.cx, s.cy); rider(g, s, X, t);
      g.fillStyle = '#fff'; for(const q of s.sp) if(q.a > 0){ g.globalAlpha = Math.max(0, q.a); g.beginPath(); g.arc(q.x, q.y, 10, 0, 7); g.fill(); } g.globalAlpha = 1; g.restore(); }
    else prizeScene(g, s, X, t);
  }
  if(tugA > 0){ g.globalAlpha = tugA; tugScene(g, s, X, t); g.globalAlpha = 1;
    if(ph === 'tug'){ g.fillStyle = '#fff'; for(const q of s.sp) if(q.a > 0){ g.globalAlpha = Math.max(0, q.a) * .8; bubble(g, q.x, q.y, 9); } g.globalAlpha = 1; } }
  post(g, s, X, t);
  caption(g, s, X);
}

/* ── 화면 ── */
const canShare = () => { try{ return !!navigator.canShare?.({ files:[new File(['x'], 'a.png', { type:'image/png' })] }); }catch(e){ return false; } };
function show(id){ ['pp-enter', 'pp-look', 'pp-play'].forEach(k=>{ $(k).hidden = k !== id; }); if(id !== 'pp-play'){ cancelAnimationFrame(raf); raf = 0; } scrollTo(0, 0); }
/* 1) 이름 찾기 */
function paintList(){
  const q = $('pp-q').value.trim().replace(/\s+/g, ''), list = PEOPLE.filter(p=>!q || p.name.toLowerCase().includes(q.toLowerCase()));
  const chip = p => `<button type="button" class="pp-name" data-name="${esc(p.name)}">${esc(p.name)}${p.staff ? `<small>${esc(p.cohort)}</small>` : ''}</button>`;
  const grp = (t, ps) => ps.length ? `<h3 class="pp-grp">${t}</h3><div class="pp-chips">${ps.map(chip).join('')}</div>` : '';
  $('pp-list').innerHTML = list.length ? grp('양양서핑학교 6기', list.filter(p=>!p.staff)) + grp('코치·매니저', list.filter(p=>p.staff))
    : '<p class="pep-note">명단에 없는 이름이에요 · 띄어쓰기 없이 다시 찾아 주세요</p>';
}
function enter(){
  show('pp-enter'); paintList();
  const again = $('pp-again'); again.hidden = !me;
  if(me) again.innerHTML = `<button type="button" class="btn pep-big" data-pagain>${esc(me.name)} 님으로 계속하기 ›</button>`;
}
/* 2) 캐릭터 고르기 — 남자/여자 탭 */
let lookG = 'f', lookI = 0;
const charSrc = (id, pose) => `img/pepero/${id}-${pose}.webp`;
function paintLook(){
  document.querySelectorAll('[data-pg]').forEach(b=>b.setAttribute('aria-selected', String(b.dataset.pg === lookG)));
  $('pp-looks').innerHTML = LOOKS[lookG].map((l, i)=>`<button type="button" class="pp-look${i === lookI ? ' on' : ''}" data-pl="${i}" aria-pressed="${i === lookI}">
    <img src="${charSrc(l.id, 'gift')}" alt="" width="120" height="170"><span>${esc(l.ko)}</span></button>`).join('');
}
function pickName(name){
  const p = PEOPLE.find(x=>x.name === name); if(!p) return;
  const same = me && me.name === name;
  me = { name:p.name, cohort:p.cohort, g:same ? me.g : 'f', li:same ? me.li : 0 };
  lookG = me.g; lookI = me.li; $('pp-who').textContent = `${me.name} 님`;
  show('pp-look'); paintLook(); loadRes(); pullMine();
}
/* 3) 탐험 */
function ctl(){
  const el = $('pep-ctl'), hint = $('pep-hint'); if(!el) return;
  const ph = S ? S.ph : 'intro';
  if(res && ph !== 'pop'){
    const p = prizeOf(res); hint.textContent = '';
    el.innerHTML = `<div class="pep-res"><img src="img/pepero/${stickerOf(p)}.webp" alt="" width="76" height="76" onerror="this.hidden=true"><div><span>${esc(p.rank || '선물')}</span><b>${esc(p.n)}</b><small>운영진이 확인하고 전해 드려요.<br>이 화면을 보여 주세요.</small></div></div>
      <button type="button" class="btn pep-big pep-brag" data-pimgsh>📸 인스타 스토리로 자랑하기</button>
      <div class="pep-share"><button type="button" class="btn sm" data-pimg>💾 포스터 저장</button><button type="button" class="btn sm mint" data-pvid>🎬 스토리 영상 만들기</button></div><div id="pep-vid" class="pep-vid"></div>
      <small class="pep-note">공유 창에서 Instagram › 스토리를 고르면 돼요</small>`;
    paintVid(); return;
  }
  if(ph === 'intro'){
    const open = live(), wait = !!checking; hint.textContent = '';
    el.innerHTML = `<p class="pep-intro"><b>11월 11일 아침, 낙산 해변</b>
      양양서핑학교 서프 버디, 라인업에서 파도를 기다리는데… 리시가 묵직해요. 발밑에 걸린 건 바다가 보낸 빼빼로 선물상자! 꽝은 없어요.</p>
      <button type="button" class="btn pep-big" data-pgo ${open && !wait ? '' : 'disabled'}>${!open ? (Date.now() < START ? '11월 11일에 열려요' : '이벤트가 끝났어요') : wait ? '확인하는 중…' : '🏖️ 해변으로 출발'}</button>
      <small class="pep-note">한 이름에 한 번 · ${PRIZES.map(p=>esc(p.ic + ' ' + p.n)).join(' · ')}</small>`;
    return;
  }
  const dots = (n, of) => `<div class="pep-dots" aria-hidden="true">${'<i class="on"></i>'.repeat(n)}${'<i></i>'.repeat(Math.max(0, of - n))}</div>`;
  if(ph === 'walk'){ const done = S.w >= 4; hint.textContent = done ? '1111 — 우리 6기 보드!' : `모래사장의 보드를 하나씩 세어 봐요 (${S.w}/4)`;
    el.innerHTML = `<button type="button" class="btn pep-big pep-sand" data-pstep ${done ? 'disabled' : ''}>${done ? '🏄 바다로 들어가요' : '☝️ 보드 하나 세기'}</button>${dots(S.w, 4)}`; return; }
  if(ph === 'paddle'){ hint.textContent = `엎드려서 라인업까지 패들! (${S.n}/5)`;
    el.innerHTML = `<button type="button" class="btn pep-big pep-pad" data-ppad>🌊 패들!</button>${dots(S.n, 5)}`; return; }
  if(ph === 'wait'){ hint.textContent = '라인업에서 세트를 기다려요…'; el.innerHTML = '<button type="button" class="btn pep-big pep-pad" disabled>🌊 세트를 기다리는 중…</button>'; return; }
  if(ph === 'tug'){ hint.textContent = `어? 리시가 묵직해요 — 발밑에 뭔가 걸렸어요! (${S.pulls}/3)`; el.innerHTML = `<button type="button" class="btn pep-big pep-pull" data-ppull>💪 영차! 리시 끌어올리기</button>${dots(S.pulls, 3)}`; return; }
  if(ph === 'pop'){ hint.textContent = '바다가 보낸 선물상자를 열어요…'; el.innerHTML = '<button type="button" class="btn pep-big" disabled>🎁 두근두근</button>'; }
}
function paintWall(){
  const el = $('pep-wall'); if(!el) return;
  el.innerHTML = `<h4>🎉 오늘 당첨 소식</h4>${wall.length ? wall.map(r=>`<div class="pep-w${me && r.name === me.name ? ' me' : ''}"><b>${esc(String(r.name || '').slice(0, 20))}</b><span>${esc(seen(r).slice(0, 40))}</span></div>`).join('') : '<p class="pep-note">아직 소식이 없어요 · 첫 선물을 건져 보세요</p>'}`;
}
function paintVid(){
  const el = $('pep-vid'); if(!el) return;
  if(!vid){ el.innerHTML = ''; return; }
  if(vid.p != null){ el.innerHTML = `<div class="pep-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(vid.p * 100)}"><i style="width:${Math.round(vid.p * 100)}%"></i></div><small class="pep-note">영상 만드는 중… 화면을 켜 두세요</small>`; return; }
  el.innerHTML = `<div class="pep-share"><button type="button" class="btn sm" data-pvsave>💾 영상 저장</button>${canShare() ? '<button type="button" class="btn sm grape" data-pvsh>인스타 스토리로 공유</button>' : ''}</div>
    ${vid.webm ? '<small class="pep-note">이 폰은 webm 영상으로 만들어져요 — 인스타가 안 받으면 이미지를 올려 주세요</small>' : ''}`;
}
/* 고른 캐릭터 세 자세 — 엎드려 패들 · 앉아 기다리기 · 선물상자 들고 */
function loadImgs(){
  const id = lookOf(me); if(imgs.key === id) return imgs.p;
  imgs = { key:id, p:Promise.all(['pad', 'sit', 'gift'].map(ps=>new Promise(ok=>{ const im = new Image(); im.onload = ()=>ok(im); im.onerror = ()=>ok(null); im.src = charSrc(id, ps); })))
    .then(([a, b, c])=>{ imgs.pad = a; imgs.sit = b; imgs.gift = c; }) };
  return imgs.p;
}
function assets(){ want(ALL); return { name:me ? me.name : '', pad:imgs.pad || null, sit:imgs.sit || null, gift:imgs.gift || null, prize:res ? prizeOf(res) : null, rm:RM }; }
function loop(now){
  raf = 0; if($('pp-play').hidden || !cv) return;
  const dt = Math.min(.05, last ? (now - last) / 1000 : 0); last = now;
  step(S, dt, RM);
  if(S.ph === 'walk' && S.w >= 4 && S.k > 1.6){ go(S, 'paddle'); splash(S, 420, 1300, 12); ctl(); }
  else if(S.ph === 'wait' && S.k > 2.8){ go(S, 'tug'); navigator.vibrate?.([30, 40, 30, 40, 60]); ctl(); }
  else if(S.ph === 'pop' && S.k > 1.1){ go(S, 'reveal'); X.prize = prizeOf(res); navigator.vibrate?.([20, 40, 20]); ctl(); }
  paint(cv.getContext('2d'), S, X);
  raf = requestAnimationFrame(loop);
}
function sizeCv(){
  cv = $('pep-cv'); const w = Math.max(160, Math.round(cv.getBoundingClientRect().width * Math.min(2, devicePixelRatio || 1)));
  if(cv.width !== w){ cv.width = w; cv.height = Math.round(w * H / W); }
  const g = cv.getContext('2d'); g.setTransform(w / W, 0, 0, w / W, 0, 0); g.__gp = null;
  X = assets();
}
async function play(){
  show('pp-play'); $('pp-me').textContent = `서프 버디 ${me.name}${me.cohort !== '6기' ? ' · ' + me.cohort : ''}`;
  S = newS(); if(res){ go(S, 'reveal'); S.k = 1; }
  sizeCv(); ctl(); paintWall();
  last = 0; if(!raf) raf = requestAnimationFrame(loop);
  loadImgs().then(()=>{ if(X){ X.pad = imgs.pad; X.sit = imgs.sit; X.gift = imgs.gift; } });
  pullWall();
  await pullMine();
  if(res && S.ph === 'intro'){ go(S, 'reveal'); S.k = 1; X.prize = prizeOf(res); }
  ctl();
}
function walk(){ if(!S || S.ph !== 'walk' || S.w >= 4) return; S.w++; navigator.vibrate?.(10); if(S.w >= 4) S.k = 0; ctl(); }
function paddle(){
  if(!S || S.ph !== 'paddle') return;
  S.n++; splash(S, S.hx || 600, S.hy || BY, 8); navigator.vibrate?.(10);
  if(S.n >= 5){ go(S, 'wait'); splash(S, 610, BY, 10); }
  ctl();
}
function pull(){
  if(!S || S.ph !== 'tug') return;
  S.pulls++; splash(S, 487, 1320, 10); navigator.vibrate?.(18);
  if(S.pulls >= 3){ claim(); go(S, 'pop'); splash(S, 540, 1500, 20); }
  ctl();
}
async function start(){
  if(res || checking || !live()) return ctl();
  await pullMine(); if(res){ go(S, 'reveal'); S.k = 1; X.prize = prizeOf(res); return ctl(); }   // 다른 기기에서 이 이름으로 이미 뽑았다
  go(S, 'walk'); ctl();
}
const act = () => S && (S.ph === 'walk' ? walk() : S.ph === 'paddle' ? paddle() : S.ph === 'tug' ? pull() : 0);   // 그림을 눌러도 같은 동작

/* ── 스토리 내보내기 ── */
function storyCanvas(){ const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
async function png(){
  await loadImgs(); await want(ALL); const c = storyCanvas(), g = c.getContext('2d'), s = newS(); go(s, 'reveal'); s.k = 1; s.t = 2.2;
  paint(g, s, Object.assign(assets(), { rm:true }));
  return new Promise(ok=>c.toBlob(ok, 'image/png'));
}
const MIMES = ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
/* 영상 — 같은 장면을 줄여서: 해변 와이드 → 보드 넷 1111 → 패들 → 라인업 → 물속 리시 → 선물상자 → 경품 카드 */
const TL = [['intro', 1.3], ['walk', 2.0], ['paddle', 1.7], ['wait', 1.2], ['tug', 1.7], ['pop', 1.0], ['reveal', 2.6]];
async function video(onP){
  await loadImgs(); await want(ALL);
  const mime = typeof MediaRecorder === 'undefined' ? null : MIMES.find(m=>{ try{ return MediaRecorder.isTypeSupported(m); }catch(e){ return false; } });
  const c = storyCanvas(); if(!mime || !c.captureStream) throw new Error('norec');
  const g = c.getContext('2d'), s = newS(), A = Object.assign(assets(), { rm:false }), DUR = TL.reduce((a, x)=>a + x[1], 0);
  paint(g, s, A);
  const stream = c.captureStream(30), rec = new MediaRecorder(stream, { mimeType:mime, videoBitsPerSecond:6e6 }), parts = [];
  rec.ondataavailable = e=>{ if(e.data && e.data.size) parts.push(e.data); };
  return new Promise((ok, no)=>{
    let iv = 0; const t0 = performance.now(); let lt = t0;
    const kill = setTimeout(()=>{ clearInterval(iv); no(new Error('timeout')); try{ rec.stop(); }catch(e){} }, 40000);   // 멈춘 채 기다리지 않게
    rec.onstop = ()=>{ clearTimeout(kill); clearInterval(iv); stream.getTracks().forEach(t=>t.stop()); const b = new Blob(parts, { type:mime.split(';')[0] }); b.size ? ok(b) : no(new Error('empty')); };
    rec.start(250);
    iv = setInterval(()=>{
      const now = performance.now(), el = (now - t0) / 1000, dt = Math.min(.1, (now - lt) / 1000); lt = now;
      let acc = 0, ph = 'reveal'; for(const [p, d] of TL){ if(el < acc + d){ ph = p; break; } acc += d; }
      if(s.ph !== ph){ go(s, ph); if(ph === 'paddle') splash(s, 420, 1300, 12); if(ph === 'pop') splash(s, 540, 1500, 20); }
      if(ph === 'walk' && s.w < 4 && Math.floor(s.k / .35) > s.w) s.w++;
      if(ph === 'paddle' && s.n < 5 && Math.floor(s.k / .3) > s.n){ s.n++; splash(s, s.hx || 600, s.hy || BY, 8); }
      if(ph === 'tug' && s.pulls < 3 && Math.floor(s.k / .45) > s.pulls){ s.pulls++; splash(s, 487, 1320, 8); }
      step(s, dt, false); paint(g, s, A); onP?.(Math.min(1, el / DUR));
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
  const t = e.target.closest('button, canvas'); if(!t || t.disabled) return;
  if(t.id === 'pep-cv') return act();
  if(t.matches('[data-name]')) return pickName(t.dataset.name);
  if(t.matches('[data-pagain]')) return pickName(me.name);
  if(t.matches('[data-pg]')){ lookG = t.dataset.pg; lookI = 0; return paintLook(); }
  if(t.matches('[data-pl]')){ lookI = +t.dataset.pl; return paintLook(); }
  if(t.matches('[data-plook]')){ me.g = lookG; me.li = lookI; saveMe(); return play(); }
  if(t.matches('[data-pback]')) return enter();
  if(t.matches('[data-pgo]')) return start();
  if(t.matches('[data-pstep]')) return walk();
  if(t.matches('[data-ppad]')){ if(e.detail === 0) paddle(); return; }   // 키보드 — 손가락은 pointerdown 이 맡는다
  if(t.matches('[data-ppull]')) return pull();
  if(t.matches('[data-pimg], [data-pimgsh]')){
    t.disabled = true; let b = null; try{ b = await png(); }catch(e){} t.disabled = false;
    if(!b) return say('그림을 만들지 못했어요 — 화면을 캡처해 주세요');
    const f = new File([b], `naksan-1111-${Date.now()}.png`, { type:'image/png' });
    if(t.matches('[data-pimgsh]') && await shareFile(f)) return;
    saveBlob(b, f.name); say(t.matches('[data-pimgsh]') ? '📸 포스터를 저장했어요 — 인스타 스토리에 올려 주세요' : '📸 포스터를 저장했어요'); return;
  }
  if(t.matches('[data-pvid]')){
    if(vid && vid.p != null) return;
    vid = { p:0 }; paintVid();
    try{ const b = await video(p=>{ if(vid && vid.p != null && Math.round(p * 20) !== Math.round(vid.p * 20)){ vid.p = p; paintVid(); } else if(vid) vid.p = p; });
      vid = { blob:b, webm:/webm/.test(b.type) }; }
    catch(err){ vid = null; say(err && err.message === 'norec' ? '이 브라우저는 영상을 못 만들어요 — 이미지를 올려 주세요' : '영상을 만들지 못했어요 — 이미지를 올려 주세요'); }
    return paintVid();
  }
  if(t.matches('[data-pvsave], [data-pvsh]') && vid && vid.blob){
    const ext = vid.webm ? 'webm' : 'mp4', f = new File([vid.blob], `naksan-1111-${Date.now()}.${ext}`, { type:vid.blob.type });
    if(t.matches('[data-pvsh]') && await shareFile(f)) return;
    saveBlob(vid.blob, f.name); say('🎬 영상을 저장했어요');
  }
}
function boot(){
  const app = $('pep-app'); if(!app) return;
  app.addEventListener('click', onClick);
  /* 패들은 꾹 누르고 있어도 저어진다 */
  let hold = 0; const stop = ()=>{ clearInterval(hold); hold = 0; };
  app.addEventListener('pointerdown', e=>{ const b = e.target.closest('[data-ppad]'); if(!b || b.disabled) return; e.preventDefault(); paddle(); stop(); hold = setInterval(paddle, 300); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(k=>app.addEventListener(k, stop));
  $('pp-q').addEventListener('input', paintList);
  addEventListener('resize', ()=>{ if(!$('pp-play').hidden) sizeCv(); });
  if(DEMO){ const bd = $('pp-demo'); if(bd) bd.hidden = false; }
  want(['bg']); loadMe(); enter(); pullWall();
}
boot();
window._pepero = { PRIZES, LOOKS, pick, png, video, walk, paddle, pull, get res(){ return res; }, get S(){ return S; }, get wall(){ return wall; }, get me(){ return me; } };
})();
