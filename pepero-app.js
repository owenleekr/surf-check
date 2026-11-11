/* ── 🎁 11.11 낙산 해변 빼빼로 선물 — 빼빼로데이 이벤트 페이지(/pepero = pepero.html) ─────────────────
   로그인 없이 연다. 양양서핑학교 6기·코치 명단(아래 STUDENTS·STAFF)에서 내 이름을 찾고 → 남자/여자 탭에서 캐릭터를 고르고 →
   낙산 해변 이야기(가을 낙산의 친구들 → 색이 식으며 나만 남은 겨울 해변 → 라인업까지 패들 → 세트 기다리기 → 리시가 묵직 → 영차 ×3) → 선물상자 → 경품.
   한 이름 한 번 — 결과는 이 기기(localStorage)와 place_talk 표(target 'pepero:2026', id 'pepero26:<이름>', user_id 'roster:<이름>',
   text '<경품id>|<보이는 이름>')에 남는다. 뽑기 전에 그 이름의 줄이 있으면(앱에서 먼저 뽑은 줄 포함) 그 결과를 보여 준다.
   같은 이름 두 번째 줄은 id 가 겹쳐 서버가 받지 않는다(409) — 그때는 서버 결과로 맞춘다.
   당첨 뒤 인스타 스토리용 그림(1080×1920 PNG)과 짧은 영상(약 11초)을 폰에서 만든다 — 서버로는 당첨 한 줄만 간다.
   그림은 클레이 일러스트(img/pepero, GPT·제미나이로 그려 다듬음) 위에 카메라 이동·색 보정·빛 번짐·비네트·필름 결을 얹은 시네마틱 연출. */
(function(){
/* 이벤트 기간(한국 시간) — 뽑기는 START ~ DRAW_END(11.11 자정)까지. 페이지는 그 뒤에도 계속 열린다(받은 사람은 「내 선물 다시 보기」).
   여기 시계는 화면만 정한다 — 마감은 서버(gift_claim 의 closed)가 지킨다. 앱 띠는 pepero.js 따로 */
const START = Date.parse('2026-11-11T00:00:00+09:00'), DRAW_END = Date.parse('2026-11-12T00:00:00+09:00');
const TARGET = 'pepero:2026', LS = 'lineup.pepero2026:', LSME = 'lineup.pepero.me';
/* 경품 — 24명에게 기프티콘 하나씩(GS25 빼빼로 15 · 배스킨라빈스 싱글레귤러 9). 누가 무엇을 받을지는 서버가 정한다(supabase-gift.sql 의 gift_claim).
   기프티콘 그림은 서버에만 있고(gift_open, 받은 폰의 열쇠가 맞을 때만) 이 기기에도 공유 그림에도 남기지 않는다 */
const KINDS = { pepero:{ id:'pepero', rank:'빼빼로', tag:'빼빼로', ic:'🍫', n:'GS25 빼빼로 기프티콘', short:'빼빼로', pic:'p2', big:'p1', pose:'pep' },
  br:{ id:'br', rank:'아이스크림', tag:'베스킨라빈스', ic:'🍦', n:'베스킨라빈스 싱글레귤러 기프티콘', short:'베스킨라빈스 아이스크림', pic:'ice', big:'ice', pose:'br' } };
/* 캐릭터 — 남자/여자 탭에서 넷 중 하나(이름으로 성별을 짐작하지 않는다 — 본인이 고른다).
   클레이 캐릭터 그림(GPT) 한 사람에 세 자세: pad 엎드려 패들 · sit 보드에 앉아 기다리기 · gift 선물상자 들고 서기 → img/pepero/<id>-<자세>.webp */
const LOOKS = { m:[ { id:'m1', ko:'웻슈트' }, { id:'m2', ko:'버킷햇' }, { id:'m3', ko:'곱슬머리' }, { id:'m4', ko:'금발 곱슬' } ],
  f:[ { id:'f1', ko:'포니테일' }, { id:'f2', ko:'헤어밴드' }, { id:'f3', ko:'꽃핀' }, { id:'f4', ko:'똥머리' } ] };
const W = 1080, H = 1920, BY = 1120;   // 스토리 좌표 — 화면 캔버스도 같은 좌표를 줄여서 그린다(BY: 물보라 높이)
const FONT = '"Apple SD Gothic Neo","Noto Sans KR",sans-serif', INK = '#2B2340';
const RM = (()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })();
/* 시연 모드(?demo=1) — 사람들 앞에서 몇 번이고 돌려 보는 용. 뽑기는 진짜 랜덤이지만 서버에 아무것도 안 쓰고, 이름도 안 잠그고, 새로 열면 다 잊는다(기간과도 상관없이 열린다) */
const DEMO = /(^|[?&])demo=1(&|$)/.test(location.search), MEM = {};
const store = { get:k => DEMO ? (MEM[k] ?? null) : localStorage.getItem(k), set:(k, v) => { if(DEMO) MEM[k] = v; else localStorage.setItem(k, v); } };
let SHUT = false;   // 서버가 「마감」(closed)이라고 답했다
const closed = () => !DEMO && (SHUT || Date.now() >= DRAW_END);
const live = () => { const n = Date.now(); return DEMO || (n >= START && !closed()); };
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const label = p => `${p.ic} ${p.short}`;
const seen = r => String(r && r.text || '').split('|').slice(1).join('|') || String(r && r.text || '');
function say(t){ const el = $('pp-toast'); if(!el) return; el.textContent = t; el.hidden = false; clearTimeout(say.t); say.t = setTimeout(()=>{ el.hidden = true; }, 2600); }
let me = null, res = null, wall = [], checking = null, imgs = {}, cv = null, raf = 0, S = null, vid = null, X = null, last = 0;

/* ── 참가 명단 — 이 이벤트만의 명단(roster.js 와 따로). 6기 18명(운영자 이성현 뺌) + 코치·매니저 6명 = 24명. 바꾸려면 여기만 ── */
const STUDENTS = ['김도훈','김태은','심재영','이나영','이미진','정선아','조혜미','허예령','홍미영','최원재','장은옥','박초롱','이한솔','정유정','전영훈','전인수','엄주승','장베드로'];
const STAFF = [['이승대','교장'],['김나리','코치'],['이해룡','코치'],['이상문','코치'],['장진혁','코치'],['김법성','매니저']];
/* 성별 — 오웬이 정해 준 대로(이름으로 짐작하지 않는다). 여기 없는 이름은 여자 캐릭터 */
const MEN = ['김도훈','심재영','최원재','전영훈','전인수','엄주승','장베드로','이승대','이해룡','이상문','장진혁','김법성'];
const PEOPLE = [...STUDENTS.map(name=>({ name, cohort:'6기' })), ...STAFF.map(([name, role])=>({ name, cohort:role, staff:1 }))];
const lookOf = m => m && LOOKS[m.g] && LOOKS[m.g][m.li] ? LOOKS[m.g][m.li].id : 'f1';
function loadMe(){ try{ const v = JSON.parse(store.get(LSME) || 'null'); if(v && PEOPLE.some(p=>p.name === v.name)) me = { name:v.name, cohort:PEOPLE.find(p=>p.name === v.name).cohort, g:MEN.includes(v.name) ? 'm' : 'f', li:Math.min(3, Math.max(0, v.li | 0)) }; }catch(e){} }
function saveMe(){ try{ store.set(LSME, JSON.stringify(me)); }catch(e){} }

/* ── 서버(place_talk) — anon 키, 다른 표와 같은 수준 ── */
async function api(path, opt){
  const C = window.SURF_CONFIG || {}, sig = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(opt ? 20000 : 12000) : undefined;
  const r = await fetch(`${C.supabaseUrl}/rest/v1/${path}`, { headers:{ apikey:C.supabaseKey, Authorization:'Bearer ' + C.supabaseKey, 'Content-Type':'application/json', Prefer:'return=minimal' }, signal:sig, ...opt });
  if(!r.ok){ let m = 'HTTP ' + r.status; try{ const b = await r.json(); if(b && b.message) m = b.message; }catch(e){} throw Object.assign(new Error(m), { status:r.status }); }
  return r.status === 204 || r.status === 201 ? null : r.json().catch(()=>null);
}
const ours = r => (Array.isArray(r) ? r : []).filter(x=>x && x.target === TARGET);
const rpc = (fn, body) => api('rpc/' + fn, { method:'POST', body:JSON.stringify(body) });
/* 이 이름의 열쇠 — 처음 받을 때 이 기기에서 만든 32자. 서버는 이 열쇠로 「받은 폰」을 알아본다 */
function tok(make){ const k = 'lineup.pepero.tok:' + me.name; let v = null; try{ v = localStorage.getItem(k); }catch(e){}
  if(!v && make){ v = [...crypto.getRandomValues(new Uint8Array(16))].map(b=>b.toString(16).padStart(2, '0')).join(''); try{ localStorage.setItem(k, v); }catch(e){} } return v; }
const prizeOf = r => r && !r.soldout && !r.closed && (KINDS[r.id] || { id:r.id, rank:'선물', ic:'🎁', n:seen(r).slice(0, 30) || '선물', short:seen(r).slice(0, 20) || '선물' });
function loadRes(){ res = null; try{ const v = JSON.parse(store.get(LS + me.name) || 'null'); if(v && typeof v.id === 'string') res = v; }catch(e){} }
function saveRes(){ try{ store.set(LS + me.name, JSON.stringify(res)); }catch(e){} }
/* 이미 받은 이름 — 서버 당첨 줄(wall)·서버가 「다른 기기 것」이라 한 이름(TAKEN)·이 기기에 남은 결과(mine:false). 시연은 아무것도 안 잠근다.
   이 기기가 받은 이름(받을 때 만든 열쇠가 있고 결과나 서버 줄이 있음)은 잠그지 않고 「내 선물 다시 보기」 */
const TAKEN = new Set();
function resOf(n){ try{ const v = JSON.parse(store.get(LS + n) || 'null'); return v && typeof v.id === 'string' ? v : null; }catch(e){ return null; } }
const onWall = n => wall.some(r=>r.name === n);
function mineHere(n){
  const r = resOf(n); if(DEMO) return !!(r && r.id);
  let t = null; try{ t = localStorage.getItem('lineup.pepero.tok:' + n); }catch(e){}
  return !!t && !(r && r.mine === false) && (!!(r && r.id) || onWall(n));
}
const takenBy = n => !DEMO && !mineHere(n) && (onWall(n) || TAKEN.has(n) || (resOf(n) || {}).mine === false);
/* 이 이름으로 이미 뽑았나 — 앱에서 뽑은 줄(user_id 가 계정)도 이름으로 찾는다 */
function pullMine(){
  if(checking) return checking;
  const nm = me.name;
  if(DEMO) return Promise.resolve();   // 시연은 서버 기록을 안 본다(이름 안 잠금)
  checking = (async ()=>{
    try{ const r = ours(await api(`place_talk?select=id,target,user_id,name,text,created_at&target=eq.${encodeURIComponent(TARGET)}&name=eq.${encodeURIComponent(nm)}&order=created_at.asc&limit=5`)).find(x=>x.name === nm);
      if(me && me.name === nm){
        if(r){ const t = tok(false); let mine = false;   // 이 기기에 열쇠가 있을 때만 서버에 「내 것」인지 묻는다(이미 받은 이름이라 새로 배정되지 않는다)
          if(t){ try{ mine = !!(await rpc('gift_claim', { p_name:nm, p_token:t })).mine; }catch(e){ mine = !!(res && res.mine); } }
          res = { id:String(r.text || '').split('|')[0], text:String(r.text || ''), at:Date.parse(r.created_at) || Date.now(), sent:1, mine }; saveRes(); if(!mine) TAKEN.add(nm); }
        else if(res && !res.sent) send();
      }
    }catch(e){}
    checking = null;
  })();
  return checking;
}
async function pullWall(){
  try{ wall = ours(await api(`place_talk?select=id,target,user_id,name,cohort,text,created_at&target=eq.${encodeURIComponent(TARGET)}&order=created_at.desc&limit=100`)); }catch(e){}
  paintWall(); if(!$('pp-enter').hidden) enterList();   // 받은 이름은 입장 화면에서 잠근다
}
async function send(){
  if(!res || res.sent || !me) return;
  if(DEMO){ res.sent = 1; wall = [{ id:'demo', name:me.name + ' (시연)', text:res.text }, ...wall.filter(r=>r.id !== 'demo')]; paintWall(); return; }   // 시연은 화면에만
  const row = { id:`pepero26:${me.name}`, target:TARGET, parent:null, user_id:`roster:${me.name}`.slice(0, 32), name:me.name, cohort:me.cohort, text:res.text, created_at:new Date(res.at).toISOString() };
  try{ await api('place_talk', { method:'POST', body:JSON.stringify(row) }); res.sent = 1; saveRes(); wall = [row, ...wall.filter(r=>r.id !== row.id)].slice(0, 40); paintWall(); }
  catch(e){ if(e && e.status === 409){ res.sent = 1; await pullMine(); ctl(); if(X) X.prize = prizeOf(res); } }   // 같은 이름이 이미 뽑았다 — 서버 결과로. 못 보냈으면 다음에 열 때 다시
}
/* 선물 받기 — 서버가 남은 기프티콘 중 하나를 이 이름에 묶는다. 시연은 서버 없이 이 화면에서만 */
async function claim(){
  if(res) return res;
  let r;
  if(DEMO) r = { kind:crypto.getRandomValues(new Uint8Array(1))[0] % 24 < 15 ? 'pepero' : 'br', mine:true };
  else r = await rpc('gift_claim', { p_name:me.name, p_token:tok(true) });
  if(r && r.closed){ SHUT = true; res = { id:'', closed:1, sent:1 }; return res; }   // 마감 — 저장하지 않고 선물로 넘어가지 않는다
  if(!r || r.soldout || !KINDS[r.kind]){ res = { id:'', soldout:1, sent:1 }; return res; }   // 저장하지 않는다 — 다음에 열면 다시 묻는다
  const k = KINDS[r.kind]; res = { id:k.id, text:`${k.id}|${label(k)}`, at:Date.now(), sent:r.mine ? 0 : 1, mine:!!r.mine }; saveRes();
  if(r.mine) send(); else TAKEN.add(me.name); return res;
}
/* ── 그림 — 낙산 해변 클레이 일러스트(img/pepero/*.webp). autumn-open: 가을 낙산의 친구들(첫 장면) · bg: 빈 해변 · tug: 물속 단면 · gift: 선물상자 · p1~p4: 경품 스티커 ── */
const PIC = {}, PICP = {}, ALL = ['autumn-open', 'bg', 'tug', 'gift', 'p1', 'p2', 'ice', 'logo-w', 'ending-center', 'ride', 'gather'];
function want(ns){ return Promise.all(ns.map(n=>PICP[n] || (PICP[n] = new Promise(ok=>{ const im = new Image();
  im.onload = ()=>{ PIC[n] = im; ok(); }; im.onerror = ()=>{ delete PICP[n]; ok(); }; im.src = `img/pepero/${n}.webp`; })))); }   // 못 받으면 다음에 다시 — 그동안은 색으로 그린다
const stickerOf = p => p && KINDS[p.id] ? KINDS[p.id].pic : 'gift';
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
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = ink || INK; g.fillText(t, x, y + h * .5 + size * .04); g.textBaseline = 'alphabetic';   // 글자를 알약 한가운데에
  return y + h + Math.round(size * .18);   // 옆면까지 포함한 아래 끝
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
function sunFx(g, t, a, sun = SUN){
  g.save(); g.globalCompositeOperation = 'screen';
  const gr = g.createRadialGradient(sun[0], sun[1], 10, sun[0], sun[1], 520); gr.addColorStop(0, `rgba(255,236,190,${.85 * a})`); gr.addColorStop(.3, `rgba(255,190,140,${.35 * a})`); gr.addColorStop(1, 'rgba(255,190,140,0)');
  g.fillStyle = gr; g.fillRect(0, 300, W, 1300);
  [[.45, 50, 'rgba(255,200,160,'], [.8, 26, 'rgba(160,230,255,'], [1.25, 80, 'rgba(255,220,170,']].forEach(([f, r, c], i)=>{
    const x = sun[0] + (560 - sun[0]) * f * 1.6, y = sun[1] + (980 - sun[1]) * f * 1.6 + Math.sin(t * .4 + i) * 6;
    g.fillStyle = c + (.16 * a) + ')'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
  g.restore();
  for(let i = 0; i < 12; i++){ const x = 120 + (i * 173) % 900, y = 990 + (i * 67) % 260, tw = Math.max(0, Math.sin(t * (1.3 + i % 3 * .4) + i * 2.1));
    glint(g, x, y, 16 + (i % 3) * 8, tw * .85 * a); }
}
/* 가을의 낙산(autumn-open) — 웃고 떠들던 친구들 → 출발하면 색이 바래고 식으며 → 사람들이 사라진 눈 내리는 빈 해변(bg) */
const WALK_END = 4.2;   // 걷기(walk) 장면 길이 — 첫 1.3초는 「가을의 낙산은…」 자막 그대로
function cold(){
  const im = PIC['autumn-open']; if(!im) return null; if(PIC['autumn-open~c']) return PIC['autumn-open~c'];
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
  g.drawImage(im, 0, 0); g.globalCompositeOperation = 'saturation'; g.fillStyle = 'rgba(128,128,128,.8)'; g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(80,110,185,.3)'; g.fillRect(0, 0, c.width, c.height);   // 바랜 겨울빛
  return PIC['autumn-open~c'] = c;
}
function autumn(g, s, X, t){
  const k = s.ph === 'walk' ? (X.rm ? 9 : s.k) : 0, cool = easeO((k - 1) / 1.3), gone = easeO((k - 1.8) / 1.4), z = 1.04 + .04 * Math.min(1, k / WALK_END);
  back(g, PIC['autumn-open'] || PIC.bg, t, z, 540, 1300);
  const c = cool > 0 && cold(); if(c){ g.globalAlpha = cool; back(g, c, t, z, 540, 1300); g.globalAlpha = 1; }
  if(gone > 0){ g.globalAlpha = gone; back(g, PIC.bg, t, 1.05, 540, 1150); g.globalAlpha = 1; }
  if(cool < 1) sunFx(g, t, (1 - cool) * .6, [90, 690]);
}
/* 탐험 — 물가에서 엎드려 패들(진짜 누워서, 팔 젓기) → 라인업에 앉아 세트 기다리기 */
const STROKE = .62;
function rider(g, s, X, t){
  if(s.ph === 'intro' || s.ph === 'walk') return;   // 가을 장면은 autumn() 이 그린다
  const p = s.pg, sc = 1 - .3 * p, sit = s.ph !== 'paddle', im = sit ? X.sit : X.pad;
  if(s.ph === 'paddle') crew.walk.forEach((m, i)=>{ if(!m) return;   // 동기들을 떠올리는 기억 방울
    const bx = 150 + i * 130, by = 780 + Math.sin(t * .9 + i * 1.3) * 22, r = 62, a = .22 + .12 * Math.sin(t * 1.4 + i);
    g.save(); g.globalAlpha = a; g.beginPath(); g.arc(bx, by, r, 0, 7); g.fillStyle = 'rgba(255,255,255,.35)'; g.fill(); g.clip(); const h = r * 2.6, w = h * m.width / m.height; g.drawImage(m, bx - w / 2, by - r * .9, w, h); g.restore();
    g.save(); g.globalAlpha = a * 1.6; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(bx, by, r, 0, 7); g.stroke(); g.restore(); });
  let x = 400 + 240 * p, y = 1310 - 220 * p + Math.sin(t * 2.2) * 7 * sc, ang = Math.sin(t * 1.7) * .025;
  if(!sit && !X.rm){ const st = (s.t % STROKE) / STROKE; ang += Math.sin(st * 6.283) * .03; y -= Math.abs(Math.sin(st * Math.PI)) * 7 * sc; x += st * 6; }   // 팔 한 번 저을 때마다 살짝 들썩
  if(s.ph === 'tug' && !X.rm){ const m = 1 + s.pulls * .5; x += Math.sin(s.t * 47) * 7 * m; y += 8 + Math.sin(s.t * 39) * 4 * m; ang += Math.sin(s.t * 31) * .03 * m; }
  if(sit){   // 다가오는 세트 — 부드러운 물결 줄
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineCap = 'round';
    for(let i = 0; i < 4; i++){ const yy = 980 + ((t * 70 + i * 95) % 380), a = (yy - 980) / 380; g.lineWidth = 4 + a * 8; g.globalAlpha = Math.sin(a * Math.PI) * .9;
      g.beginPath(); g.moveTo(x - 420 * (.6 + a), yy); g.quadraticCurveTo(x, yy - 22 - a * 20, x + 420 * (.6 + a), yy); g.stroke(); } g.globalAlpha = 1;
  }
  const w = (sit ? 380 : 500) * sc, h = im ? w * im.height / im.width : 0;
  if(!sit){ g.fillStyle = 'rgba(16,70,100,.24)'; g.beginPath(); g.ellipse(x, y - 4, w * .46, 20 * sc, 0, 0, 7); g.fill(); }
  s.hx = x + w * .42; s.hy = y - h * .12;   // 손 끝 — 물보라가 여기서
  g.save(); g.translate(x, y); g.rotate(ang);
  if(im){ g.drawImage(sit ? sunk(im) : im, -w / 2, -h, w, h); if(sit) ripple(g, 0, 0, w, h, t); }
  else{ board(g, 0, -20 * sc, 430 * sc, 52 * sc, 0); g.textAlign = 'center'; g.font = `${Math.round(200 * sc)}px ${FONT}`; g.fillText('🏄', 0, -40); }
  g.restore();
}
/* 물에 잠긴 듯 — 앉은 그림의 아래쪽(다리·보드 밑)을 물빛으로 물들이며 지워 배경 바다에 스며들게 하고, 물 위에 잔물결 고리를 얹는다 */
const WL = .64;   // 물높이 — 그림 위에서부터 64%
/* wl 물높이(그림 위에서부터 비율) · edge 물선 바로 아래 지우는 세기(0 이면 부드럽게, 클수록 물결 모양 물선이 또렷) */
function sunk(im, wl = WL, edge = 0){
  if(!im) return null; const ck = `__sunk${wl}_${edge}`; if(im[ck]) return im[ck];
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'), h = im.height; g.imageSmoothingQuality = 'high';
  g.drawImage(im, 0, 0);
  g.globalCompositeOperation = 'source-atop'; const tint = g.createLinearGradient(0, h * wl - 6, 0, h); tint.addColorStop(0, 'rgba(70,190,205,0)'); tint.addColorStop(.08, 'rgba(70,190,205,.55)'); tint.addColorStop(1, 'rgba(40,150,190,.7)'); g.fillStyle = tint; g.fillRect(0, 0, c.width, h);
  g.globalCompositeOperation = 'destination-out'; const er = g.createLinearGradient(0, h * wl - 4, 0, h); er.addColorStop(0, `rgba(0,0,0,${edge})`); er.addColorStop(.12, `rgba(0,0,0,${Math.max(.55, edge + .2)})`); er.addColorStop(.6, 'rgba(0,0,0,.9)'); er.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = er;
  g.beginPath(); g.moveTo(0, h); for(let x = 0; x <= c.width + 8; x += 8) g.lineTo(x, h * wl - 4 + Math.sin(x / c.width * Math.PI * 5) * h * .01); g.lineTo(c.width, h); g.closePath(); g.fill();   // 물결 모양 물선
  return im[ck] = c;
}
function ripple(g, bx, by, w, h, t, wl = WL, rx = .3){   // bx·by = 그림 가운데 아래
  const y = by - h * (1 - wl), rp = (t * .5) % 1;
  g.save(); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = Math.max(2, w * .014); g.lineCap = 'round';
  g.beginPath(); g.ellipse(bx, y, w * rx, h * .03, 0, .15, Math.PI - .15); g.stroke();
  g.globalAlpha = (1 - rp) * .6; g.beginPath(); g.ellipse(bx, y, w * (rx + .04 + rp * .22), h * (.034 + rp * .02), 0, 0, 7); g.stroke();
  g.restore();
}
/* 겨울 해변 — 혼자(뒷모습) → 눈 덮인 해변을 걸어오는 버디들(gather 그림) → 다 같이 파도(ride) → 단체 사진 */
const easeO = x => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
function winterScene(g, s, X, t){
  if(s.ph === 'ride'){   // 다 같이, 각자의 파도 위에서 — 물보라 튀며 다가간다
    const k = X.rm ? 1 : Math.min(1, s.k / 3.5);
    back(g, PIC.bg, t, 1.12, 540, 1300);
    g.globalAlpha = X.rm ? 1 : Math.min(1, s.k / .6); back(g, PIC.ride || PIC.bg, t, 1.03 + .12 * k, 540, 1150); g.globalAlpha = 1;
    if(!X.rm){ g.fillStyle = '#fff'; for(let i = 0; i < 26; i++){ const p = ((t * (.6 + (i % 5) * .15) + i * .37) % 1), x = (i * 211) % 1080 + Math.sin(i) * 40, y = 1900 - p * 1300 - (i % 7) * 40;
      g.globalAlpha = (1 - p) * .7; g.beginPath(); g.arc(x, y, 4 + (i % 4) * 3, 0, 7); g.fill(); } g.globalAlpha = 1; }
    return;
  }
  if(s.ph === 'together'){   // 단체 사진 — 흐릿하게 멀리서 → 초점이 맞으며 다가가고 → 찰칵! 하얗게 번쩍, 스냅사진으로 멈춘다
    const k = X.rm ? 9 : s.k, f = Math.min(1, k / 1.6), e = f * f * (3 - 2 * f);
    if(k < SHOT){ back(g, PIC[ENDING_PIC] || PIC.bg, t, 1 + .07 * e, 540, 1000); const b = soft(ENDING_PIC); if(b){ g.globalAlpha = 1 - e; back(g, b, t, 1 + .07 * e, 540, 1000); g.globalAlpha = 1; } return; }
    back(g, soft(ENDING_PIC) || PIC.bg, t, 1.05, 540, 960); g.fillStyle = 'rgba(25,20,45,.38)'; g.fillRect(0, 0, W, H);
    const q = Math.min(1, (k - SHOT) / .35), [, pb] = snapshot(g, 540, 860, 700, -.03 * q, 1 - .1 * q);
    g.globalAlpha = Math.min(1, (k - SHOT - .2) / .5); if(g.globalAlpha > 0) title(g, '우리들의 아름다웠던 추억', W / 2, pb + 100, 72, 980); g.globalAlpha = 1;
    const fl = 1 - (k - SHOT) / .3; if(fl > 0 && !X.rm){ g.fillStyle = `rgba(255,255,255,${fl})`; g.fillRect(0, 0, W, H); }
    return;
  }
  if(s.ph === 'gather'){ const k = X.rm ? 1 : easeO(s.k / 4.6); back(g, PIC.gather || PIC.bg, t, 1.02 + .1 * k, 540, 1150); return; }   // 눈 덮인 해변을 걸어오는 버디들(한 장 그림)로 천천히 다가간다
  back(g, PIC.bg, t, 1.12, 540, 1300);
  const im = X.alone; if(im){ const w = Math.min(760, 700 * im.width / im.height * 1.3), h = w * im.height / im.width; g.drawImage(im, 540 - w / 2, H - 120 - h, w, h); }   // 아래는 검은 띠에 묻힌다
}
/* 리시 당기기 — 물 위의 나를 크게(화면 높이 1/3쯤, 물선 TY 위로) 등 뒤 빛·테두리 빛으로 또렷하게, 물 아래엔 리시 끝에 걸린 선물상자.
   당길 때마다(s.pk) 몸을 뒤로 젖히고 리시가 팽팽해진다. 자막은 위, 버튼은 그림 밖이라 캐릭터를 가리지 않는다 */
const TY = 940, TWL = .74;   // 물선(화면) · 그림 위에서부터 물높이 — 보드 윗면까지 물 위로
function tugScene(g, s, X, t){
  const inK = X.rm ? 1 : Math.min(1, s.k / 1.4), z = 1 + .1 * Math.pow(1 - inK, 3) + (s.ph === 'pop' ? .2 * Math.min(1, s.k / .35) : 0);
  const e = X.rm || s.pk == null ? 1 : Math.min(1, (s.t - s.pk) / .55), jolt = Math.sin(e * Math.PI) * (1 - e * .3), ten = Math.min(1, .35 + s.pulls * .2 + jolt * .5);
  g.save(); cam(g, z, 540, 1000);
  if(s.ph === 'tug' && !X.rm){ const m = 1 + s.pulls * .4; g.translate(Math.sin(s.t * 47) * 3 * m, Math.sin(s.t * 39) * 2 * m); }
  if(PIC.tug) g.drawImage(PIC.tug, -20, TY - 632, W + 40, H + 20);   // 물 아래 — 그림의 물선(632)을 TY 에 맞춰 상자를 아래쪽으로
  else{ g.fillStyle = '#4FC3D8'; g.fillRect(0, TY, W, H); }
  if(PIC.bg){ const f = PIC.bg.width / W; g.drawImage(PIC.bg, 130 * f, 500 * f, 820 * f, 650 * f, -40, -40, W + 80, TY + 50); }   // 물 위 — 하늘과 바다(그림 속 다른 서퍼를 덮는다)
  const wl = g.createLinearGradient(0, TY - 90, 0, TY + 10); wl.addColorStop(0, 'rgba(120,215,225,0)'); wl.addColorStop(1, 'rgba(120,215,225,.95)'); g.fillStyle = wl; g.fillRect(-40, TY - 90, W + 80, 100);
  const im = X.sit, h = 640, w = im ? h * im.width / im.height : 0, bx = 560 - 26 * jolt, lean = -.22 * jolt, sp = im && sunk(im, TWL, .3);
  g.save(); g.globalCompositeOperation = 'screen'; const bl = g.createRadialGradient(bx, TY - 230, 30, bx, TY - 230, 430); bl.addColorStop(0, 'rgba(255,240,205,.6)'); bl.addColorStop(1, 'rgba(255,240,205,0)'); g.fillStyle = bl; g.fillRect(0, 0, W, TY + 200); g.restore();   // 등 뒤 빛
  /* 리시 — 보드 꼬리에서 물속으로, 당길수록 팽팽 */
  const tx = bx - w * .44 * Math.cos(lean), ty = TY - h * .01, ex = 250, ey = TY + 120;
  g.strokeStyle = '#2E2A36'; g.lineWidth = 11; g.lineCap = 'round'; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo((tx + ex) / 2 - 10, (ty + ey) / 2 + 60 * (1 - ten), ex, ey); g.stroke();
  if(im){ g.save(); g.translate(bx, TY); g.rotate(lean);
    g.shadowColor = 'rgba(255,248,228,.95)'; g.shadowBlur = 28; g.drawImage(sp, -w / 2, -h * TWL, w, h);   // 테두리 빛
    g.shadowBlur = 6; g.shadowColor = 'rgba(255,255,255,.9)'; g.drawImage(sp, -w / 2, -h * TWL, w, h); g.shadowBlur = 0;
    ripple(g, 0, h * (1 - TWL), w, h, t, TWL, .42); g.restore();
    g.save(); g.translate(bx + w * .36, TY - h * TWL + 40); g.rotate(.15); pill(g, '!', 0, -50, 70, '#FFE08A', '#E7B640'); g.restore(); }
  else{ board(g, bx, TY, 430, 52, 0); }
  g.restore();
  g.save(); g.globalCompositeOperation = 'screen';   // 물속 빛줄기
  for(let i = 0; i < 4; i++){ const x0 = 180 + i * 230 + Math.sin(t * .5 + i) * 40, gr = g.createLinearGradient(0, TY, 0, 1770);
    gr.addColorStop(0, 'rgba(220,255,250,.24)'); gr.addColorStop(1, 'rgba(220,255,250,0)'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(x0, TY + 20); g.lineTo(x0 + 70, TY + 20); g.lineTo(x0 + 220, 1770); g.lineTo(x0 + 90, 1770); g.closePath(); g.fill(); }
  g.restore();
  for(let i = 0; i < 14; i++){ const sp = 120 + (i % 5) * 40, y = 1720 - ((t * sp + i * 97) % (1720 - TY - 40)), x = 560 + Math.sin(i * 12.9 + t * 1.3) * (60 + (i % 4) * 70);
    bubble(g, x, y, 9 + (i % 4) * 6); }
}
/* 선물 공개 — 떠오른 상자가 들썩이다 열리고, 큰 클레이 선물(빼빼로 상자·아이스크림)이 튀어 올라 「○○ 당첨!」, 양옆 꽃가루. 약 2.5초(또는 누르면) 뒤 「선물은 기쁘지만…」 */
function prizeOpen(g, s, X, t){
  const k = X.rm ? 9 : s.k, p = X.prize, op = easeO((k - .45) / .45), big = p && KINDS[p.id] ? PIC[KINDS[p.id].big] : PIC[stickerOf(p)];
  back(g, PIC.bg, t, 1.02, 540, 1150); sunFx(g, t, .55); dof(g, t, 1); g.fillStyle = 'rgba(255,240,225,.14)'; g.fillRect(0, 0, W, H); rays(g, 540, 760, t, .45 + .5 * op);
  if(op < 1 && PIC.gift){ const im = PIC.gift, sh = k < .45 && !X.rm ? Math.sin(k * 60) * .07 : 0, sc = 1 - .35 * op, w = 350 * im.width / im.height;   // 들썩 → 작아지며 사라짐
    g.save(); g.globalAlpha = 1 - op; g.translate(540, 905 + op * 80); g.rotate(sh); g.scale(sc, sc); g.drawImage(im, -w / 2, -350, w, 350); g.restore(); }
  if(op > 0 && p){
    if(!X.rm) CF.forEach((c, i)=>{ const y = (k * c.sp + c.ph) % 1700 + 120, a = Math.min(1, op * 2); g.save(); g.globalAlpha = a; g.translate(c.x, y); g.rotate(c.r + k * 3); g.fillStyle = CFC[i % CFC.length]; g.fillRect(-c.s / 2, -c.s * .3, c.s, c.s * .6); g.restore(); });
    const sc = X.rm ? 1 : easeBack(op), y = 760 - 120 * op;
    g.save(); g.globalAlpha = Math.min(1, op * 1.5); g.translate(540, y); g.scale(sc, sc);
    g.fillStyle = 'rgba(255,253,246,.92)'; g.beginPath(); g.arc(0, 0, 250, 0, 7); g.fill(); g.restore();
    if(big){ g.save(); g.globalAlpha = Math.min(1, op * 1.5); sticker(g, big, 540, y, 400 * sc, -.06); g.restore(); }
    const ta = X.rm ? 1 : Math.min(1, (k - .7) / .35); if(ta > 0){ g.globalAlpha = ta; title(g, `${p.short} 당첨!`, W / 2, 1150, 96, 980);
      g.save(); g.textAlign = 'center'; g.shadowColor = 'rgba(30,15,40,.6)'; g.shadowBlur = 14; g.fillStyle = '#fff'; g.font = `800 38px ${FONT}`; g.fillText(p.n, W / 2, 1230); g.restore(); g.globalAlpha = 1; }
  }
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
/* 흐린 배경 위 또렷한 선물 — 위쪽(하늘·바다)은 흐리게, 아래 모래사장은 그대로(얕은 심도) */
function dof(g, t, a){
  const b = soft('bg'); if(!b || a <= 0) return;
  g.save(); g.globalAlpha = a; g.beginPath(); g.rect(0, 0, W, 1300); g.clip(); back(g, b, t, 1.02, 540, 1150); g.restore();
  g.save(); g.globalAlpha = a * .5; g.beginPath(); g.rect(0, 1300, W, 110); g.clip(); back(g, b, t, 1.02, 540, 1150); g.restore();
}
/* 선물상자가 물 밖으로 — 흐린 해변·햇살 위로 튀어 올라 찌그러졌다 펴진다 */
function prizeScene(g, s, X, t){
  const k = Math.min(1, s.k / .7);
  dof(g, t, Math.min(1, s.k / .5));
  g.fillStyle = 'rgba(255,240,225,.12)'; g.fillRect(0, 0, W, H);
  rays(g, 540, 730, t, k * .8);
  let gb = 905, sx = 1, sy = 1;
  if(!X.rm){ gb = 1900 - (1900 - 905) * (1 - Math.pow(1 - k, 3)); if(k < 1){ sx = .84; sy = 1.18; }
    else{ const l = Math.min(1, (s.k - .7) / .3), w = Math.sin(l * Math.PI * 2.5) * (1 - l) * .2; sx = 1 + w; sy = 1 - w; } }
  g.save(); g.translate(540, gb); g.scale(sx, sy);
  const im = PIC.gift; if(im){ const w = 350 * im.width / im.height; g.drawImage(im, -w / 2, -350, w, 350); } else{ g.textAlign = 'center'; g.font = `240px ${FONT}`; g.fillText('🎁', 0, -60); }
  g.restore();
}
/* ── 공유 포스터 — 「아름다웠던 가을 바다의 추억」 서프 버디 단체 사진(1080×1920) ──
   내 캐릭터가 가운데 앞에서 선물을 들고, 나머지 일곱은 라인업에 반쯤 잠겨 앉거나 모래사장에 서 있다. 노을빛 보정·빛 번짐·비네트.
   화면 공개·스토리 이미지·영상이 같은 그림을 쓴다. 기프티콘 그림은 여기에 절대 안 들어간다(종류 아이콘만) */
const CREW_IDS = ['m1', 'f1', 'm2', 'f2', 'm3', 'f3', 'm4', 'f4'];
let crew = { key:null, p:null, walk:[] };
function loadCrew(){
  const mine = lookOf(me); if(crew.key === mine) return crew.p;
  const ids = CREW_IDS.filter(id=>id !== mine), one = src => new Promise(ok=>{ const im = new Image(); im.onload = ()=>ok(im); im.onerror = ()=>ok(null); im.src = src; });
  crew = { key:mine, walk:[], p:Promise.all(ids.map(id=>one(charSrc(id, 'walk')))).then(b=>{ crew.walk = b; }) };
  return crew.p;
}
const ENDING_PIC = 'ending-me', SHOT = 1.9;   // 마지막 사진 = ending-center 의 가운데 빈자리에 「나」를 앉힌 합성
/* 가운데의 나 — 정면을 보고 보드에 걸터앉아 받은 선물(빼빼로 상자·아이스크림)을 두 손에 들고, 보드·다리는 반쯤 물에 잠긴다(물결 물선·잔물결).
   머리 위에 「서프 버디 ○○」 알약, 그 아래 받은 선물 배지(아이콘 + 「빼빼로」·「베스킨라빈스」) — 모두 캐릭터 가운데 축에.
   정면 그림은 고른 캐릭터·받은 종류 한 장만 받는다(img/pepero/front-<id>-pep|br.webp). 받는 동안·없으면 옆모습(sit)으로 */
const WLF = .8, ASKED = new Set(), frontOf = X => X && X.prize && KINDS[X.prize.id] ? `front-${lookOf(me)}-${KINDS[X.prize.id].pose}` : null;
function badge(g, p, cx, bot){   // 받은 선물 배지 — 아래 끝(bot)에 맞춰 그리고 위 끝을 돌려준다
  const t = p.tag || p.rank || '선물', ic = 50, hh = 60, lift = 6; g.font = `900 28px ${FONT}`;
  const w = 16 + ic + 10 + g.measureText(t).width + 24, x = cx - w / 2, y = bot - hh - lift;
  clay(g, x, y, w, hh, hh / 2, '#FFFDF8', p.id === 'br' ? '#F2B8C6' : '#EBC66A', lift);
  sticker(g, PIC[stickerOf(p)], x + 16 + ic / 2, y + hh / 2, ic, 0);
  g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = INK; g.fillText(t, x + 16 + ic + 10, y + hh / 2 + 1); g.textBaseline = 'alphabetic';
  return y;
}
function photo(X){
  const base = PIC['ending-center'], fn = frontOf(X); if(fn && !ASKED.has(fn)){ ASKED.add(fn); want([fn]); }   // 매 장면마다 다시 묻지 않게 한 번만(내보내기는 따로 기다린다)
  const fr = fn && PIC[fn], im = fr || X.sit, key = [imgs.key, X.prize && X.prize.id, X.name, !!X.sit, !!fr, !!base, !!(X.prize && PIC[stickerOf(X.prize)])].join('|');
  if(!base){ PIC['ending-me'] = null; return; } if(PIC['ending-me'] && PIC['ending-me'].__k === key) return;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; c.__k = key;
  g.drawImage(base, 0, 0, W, H);
  if(im){ const h = fr ? 500 : 520, w = h * im.width / im.height, bx = 540, by = fr ? 1335 : 1300, wl = fr ? WLF : WL, sp = sunk(im, wl, fr ? .4 : 0);
    const tmp = document.createElement('canvas'); tmp.width = sp.width; tmp.height = sp.height; const tg = tmp.getContext('2d'); tg.drawImage(sp, 0, 0); tg.globalCompositeOperation = 'source-atop'; tg.fillStyle = 'rgba(255,160,110,.16)'; tg.fillRect(0, 0, tmp.width, tmp.height);   // 노을빛 맞추기
    g.fillStyle = 'rgba(20,30,60,.18)'; g.beginPath(); g.ellipse(bx, by - h * (1 - wl) + 8, w * .42, 14, 0, 0, 7); g.fill();
    g.drawImage(tmp, bx - w / 2, by - h, w, h); ripple(g, bx, by, w, h, 0, wl, fr ? .36 : .3);
    let top = by - h - 14;
    if(fr && X.prize) top = badge(g, X.prize, bx, top) - 12;   // 옆모습(받는 중)엔 선물을 안 들고 있으니 배지도 정면 그림과 함께
    if(X.name) pill(g, '서프 버디 ' + String(X.name).slice(0, 10), bx, top - Math.round(34 * 1.93), 34, '#fff', '#F2C9D3'); }
  PIC['ending-me'] = c; delete PIC['ending-me~'];
}   // 마지막 그림 — 'ending-gemini' 로 바꾸면 다른 그림
/* o: { cam:[z, fx, fy], badge 0~1, text 0~1, t } */
/* 찍힌 사진 — 흰 테두리 스냅사진(살짝 기울어짐). cx·cy 가운데, iw 사진 너비 */
function snapshot(g, cx, cy, iw, rot, sc){
  const im = PIC[ENDING_PIC] || PIC.bg; if(!im) return; const ih = iw * im.height / im.width, b = 22, w = iw + b * 2, h = ih + b * 2;
  g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(sc, sc);
  g.shadowColor = 'rgba(20,10,30,.45)'; g.shadowBlur = 40; g.shadowOffsetY = 18; g.fillStyle = '#FFFDF8'; g.fillRect(-w / 2, -h / 2, w, h); g.shadowBlur = 0; g.shadowOffsetY = 0;
  g.drawImage(im, -iw / 2, -ih / 2, iw, ih); g.restore(); return [cy - h / 2 * sc, cy + h / 2 * sc];
}
/* 공유 포스터 = 그 순간 찍힌 사진: 흐린 배경 위 스냅사진(받은 선물 배지는 사진 속 내 머리 위) · 「우리들의 아름다웠던 추억」 · 편지 두 줄 · 이름 알약 · 날짜 줄(모두 가운데 축) · 로고
   o: { text 0~1, t, fade } */
function poster(g, X, o){
  photo(X); const t = o.t || 0, a = Math.max(0, Math.min(1, o.text == null ? 1 : o.text));
  back(g, soft(ENDING_PIC) || PIC[ENDING_PIC] || PIC.bg, t, 1.05, 540, 960); g.fillStyle = 'rgba(25,20,45,.38)'; g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'soft-light'; const sr = g.createLinearGradient(0, 0, 0, H); sr.addColorStop(0, 'rgba(255,190,120,.6)'); sr.addColorStop(.55, 'rgba(255,165,120,.25)'); sr.addColorStop(1, 'rgba(120,140,220,.2)'); g.fillStyle = sr; g.fillRect(0, 0, W, H); g.restore();   // 다시 돌아온 해돋이 온기
  snow(g, t, .6);
  const [, pb] = snapshot(g, 540, 770, 640, -.025, 1);
  if(PIC['logo-w']){ const im = PIC['logo-w'], h = 46, w = h * im.width / im.height; g.save(); g.shadowColor = 'rgba(20,10,30,.6)'; g.shadowBlur = 10; g.drawImage(im, W / 2 - w / 2, 64, w, h); g.restore(); }
  if(a > 0){ g.globalAlpha = a; const y0 = pb + 92;
    title(g, '우리들의 아름다웠던 추억', W / 2, y0, 70, 980);
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(20,10,30,.7)'; g.shadowBlur = 12; g.fillStyle = '#fff'; g.font = `800 31px ${FONT}`;
    g.fillText('작은 선물이지만, 함께 파도 위에서 나눈 마음을 나눠요.', W / 2, y0 + 66); g.fillText('겨울 바다에서도, 다시 만나요 🌊', W / 2, y0 + 110); g.restore();
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(20,10,30,.7)'; g.shadowBlur = 10; g.fillStyle = '#fff'; g.font = `800 28px ${FONT}`; g.fillText('양양서핑학교 가을학기 6기', W / 2, y0 + 160); g.restore();
    const foot = X.name ? pill(g, '서프 버디 ' + String(X.name).slice(0, 10), W / 2, y0 + 184, 34, '#fff', '#F2C9D3') : y0 + 232;   // 학기 줄 · 이름 알약 · 날짜 줄은 같은 가운데 축
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(20,10,30,.7)'; g.shadowBlur = 10; g.fillStyle = '#FFE8CC'; g.font = `800 27px ${FONT}`; g.fillText('2026.11.11 낙산 해변', W / 2, foot + 20 + 15); g.restore();
    g.globalAlpha = 1; }
  if(o.fade > 0){ g.fillStyle = `rgba(20,10,20,${o.fade})`; g.fillRect(0, 0, W, H); }
}
function sticker(g, im, x, y, sz, rot){ if(!im) return; const f = sz / Math.max(im.width, im.height); g.save(); g.translate(x, y); g.rotate(rot); g.shadowColor = 'rgba(80,40,60,.3)'; g.shadowBlur = 14; g.shadowOffsetY = 6;
  g.drawImage(im, -im.width * f / 2, -im.height * f / 2, im.width * f, im.height * f); g.restore(); }
/* ── 소리 — 「우쿨렐레 서프 팝」, 브라우저에서 바로 만든다(녹음 파일·저작권 없음). 104 BPM, C–G–Am–F.
   뜯는 줄은 Karplus-Strong(잡음을 짧은 지연선에 돌려 줄 소리로), 박수·셰이커는 걸러 낸 잡음, 종은 사인파 셋. 같은 함수를 화면 배경 음악·영상 소리·효과음이 같이 쓴다 ── */
const BPM = 104, BEAT = 60 / BPM, NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
const CHORDS = [[67, 60, 64, 69], [67, 62, 67, 71], [69, 60, 64, 69], [69, 60, 65, 69]], ROOT = [48, 43, 45, 41];   // 우쿨렐레 GCEA 자리 C G Am F
const STRUM = [[0, 0, 1], [1, 0, .7], [1.5, 1, .5], [2.5, 1, .6], [3, 0, .8], [3.5, 1, .55]];   // [박, 위로?, 세기] — 다운 다운업 업다운업
function pluck(ctx, f){ const m = ctx.__pl || (ctx.__pl = {}); if(m[f]) return m[f];
  const sr = ctx.sampleRate, N = Math.max(2, Math.round(sr / f)), L = Math.round(sr * 1.3), b = ctx.createBuffer(1, L, sr), d = b.getChannelData(0);
  for(let i = 0; i < N; i++) d[i] = (Math.random() * 2 - 1) * .9;
  for(let i = N; i < L; i++) d[i] = .4975 * (d[i - N] + d[i - N + 1]);
  return m[f] = b; }
function noise(ctx){ if(ctx.__nz) return ctx.__nz; const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0); for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return ctx.__nz = b; }
function src(ctx, out, buf, t, gain, filt){
  const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = buf; g.gain.value = gain; let n = s;
  if(filt){ const f = ctx.createBiquadFilter(); f.type = filt[0]; f.frequency.value = filt[1]; f.Q.value = filt[2] || .7; n.connect(f); n = f; }
  n.connect(g); g.connect(out); s.start(Math.max(0, t)); return [s, g];
}
function hit(ctx, out, t, dur, gain, filt){ t = Math.max(0, t); const [s, g] = src(ctx, out, noise(ctx), t, 0, filt); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.stop(t + dur + .02); }
function strum(ctx, out, t, ns, v, up){ (up ? ns.slice().reverse() : ns).forEach((n, i)=>{ const [s] = src(ctx, out, pluck(ctx, NOTE(n)), t + i * .013, .15 * v, ['lowpass', 5200]); s.stop(Math.max(0, t) + 1.3); }); }
function tone(ctx, out, t, f, gain, dur, type){ t = Math.max(0, t); const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'sine'; o.frequency.value = f;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + .05); }
function cheer(ctx, out, t){   // 웃음·함성·박수 — 걸러 낸 잡음이 부풀었다 잦아드는 소리 + 흩어진 박수
  t = Math.max(0, t); const [s1, g1] = src(ctx, out, noise(ctx), t, 0, ['bandpass', 900, .7]); g1.gain.setValueAtTime(.0001, t); g1.gain.exponentialRampToValueAtTime(.22, t + .25); g1.gain.exponentialRampToValueAtTime(.0001, t + 1.3); s1.stop(t + 1.4);
  for(let i = 0; i < 14; i++) clap(ctx, out, t + .05 + Math.random() * 1.1, .25 + Math.random() * .3); chime(ctx, out, t + .1, .4);
}
const clap = (ctx, out, t, v) => { for(let i = 0; i < 3; i++) hit(ctx, out, t + i * .008, .09, .3 * v, ['bandpass', 1400, 1.2]); };
const chime = (ctx, out, t, v = 1) => [[1, 1], [2.76, .45], [5.4, .2]].forEach(([r, a])=>tone(ctx, out, t, 1046.5 * r, .16 * a * v, 1.8 / r));
const shutter = (ctx, out, t) => { hit(ctx, out, t, .03, .55, ['highpass', 2600]); hit(ctx, out, t + .06, .06, .4, ['bandpass', 1700, 2]); tone(ctx, out, t + .01, 2600, .05, .12, 'triangle'); };
function sparkle(ctx, out, t){ t = Math.max(0, t); const [s, g] = src(ctx, out, noise(ctx), t, 0, ['bandpass', 900, 3]);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.35, t + .05); g.gain.exponentialRampToValueAtTime(.0001, t + .6); s.stop(t + .65);
  [0, .07, .14, .21].forEach((d, i)=>tone(ctx, out, t + d, [1568, 2093, 2637, 3136][i], .07, .5, 'triangle')); chime(ctx, out, t + .05, 1.2); }
function bar(ctx, out, t, i){
  const c = i % 4;
  STRUM.forEach(([b, up, v])=>strum(ctx, out, t + b * BEAT, CHORDS[c], v, up));
  [0, 2].forEach(b=>tone(ctx, out, t + b * BEAT, NOTE(ROOT[c]), .22, .45));
  [1, 3].forEach(b=>clap(ctx, out, t + b * BEAT, .8));
  for(let e = 0; e < 8; e++) hit(ctx, out, t + e * BEAT / 2, .045, e % 2 ? .07 : .035, ['highpass', 7000]);
}
/* 화면 배경 음악 — 처음엔 꺼 둔다(자동 재생 막힘). 켜 두면 기억했다가 다음에 첫 터치에 다시 켠다 */
const LSND = 'lineup.pepero.sound', SND = { on:false, ctx:null, out:null, iv:0, next:0, bar:0 };
function sndCtx(){
  if(SND.ctx) return SND.ctx; const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null;
  SND.ctx = new AC(); SND.out = SND.ctx.createGain(); SND.out.gain.value = 0; SND.out.connect(SND.ctx.destination); return SND.ctx;
}
function paintSnd(){ const b = $('pp-snd'); if(!b) return; b.textContent = SND.on ? '🔊' : '🔇'; b.setAttribute('aria-pressed', String(SND.on)); b.setAttribute('aria-label', SND.on ? '배경 음악 끄기' : '배경 음악 켜기'); }
function music(on, keep){
  SND.on = on; if(!keep) try{ localStorage.setItem(LSND, on ? '1' : '0'); }catch(e){}
  paintSnd(); const c = sndCtx(); if(!c) return;
  if(on){ c.resume?.(); SND.out.gain.setTargetAtTime(.3, c.currentTime, .08); SND.next = Math.max(SND.next, c.currentTime + .08); clearInterval(SND.iv);
    const fill = ()=>{ while(SND.next < c.currentTime + 1.6){ bar(c, SND.out, SND.next, SND.bar++); SND.next += 4 * BEAT; } }; fill(); SND.iv = setInterval(fill, 300); }
  else{ clearInterval(SND.iv); SND.out.gain.setTargetAtTime(0, c.currentTime, .06); SND.next = 0; }
}
function sfx(fn){ if(SND.on && SND.ctx) try{ fn(SND.ctx, SND.out, SND.ctx.currentTime + .02); }catch(e){} }
/* 장면 상태 — 화면과 영상이 같은 걸 쓴다(입자는 미리 만들어 두고 돌려 쓴다) */
const CAM = { intro:[1, 540, 1150], walk:[1.06, 540, 1250], paddle:[1.1, 640, 1150], wait:[1.26, 610, 1080], tug:[1.3, 610, 1080], pop:[1, 540, 1000], reveal:[1, 540, 1000] };
function newS(){ return { ph:'intro', k:0, t:0, pg:0, n:0, pulls:0, cz:1, cx:540, cy:1150, sv:0, sp:Array.from({ length:48 }, ()=>({ a:0, x:0, y:0, vx:0, vy:0 })) }; }
function go(s, ph){ s.ph = ph; s.k = 0; }
function splash(s, x, y, n){ for(const q of s.sp){ if(n <= 0) break; if(q.a > 0) continue; q.a = 1; q.x = x; q.y = y; q.vx = (Math.random() - .5) * 520; q.vy = -260 - Math.random() * 420; n--; } }
function step(s, dt, rm){
  s.t += dt; s.k += dt;
  const pt = s.ph === 'intro' || s.ph === 'walk' ? 0 : s.ph === 'paddle' ? s.n / 5 : 1, e = rm ? 1 : Math.min(1, dt * 3);
  const SV = { intro:0, walk:s.k < 1.1 ? 0 : .85, paddle:.68, wait:.72, tug:.8, pop:.9, prize:.9, alone:1, gather:1, ride:.55, together:.35, reveal:1 }; s.sv += ((SV[s.ph] || 0) - s.sv) * (rm ? 1 : Math.min(1, dt * .8));   // 가을 → 겨울
  s.pg += (pt - s.pg) * e;
  const c = CAM[s.ph] || CAM.intro, cx = c[1], ce = rm ? 1 : Math.min(1, dt * 1.1);   // 천천히 따라붙는 카메라
  s.cz += (c[0] - s.cz) * ce; s.cx += (cx - s.cx) * ce; s.cy += (c[2] - s.cy) * ce;
  if(s.ph === 'paddle' && !rm && s.hx && Math.floor(s.t / STROKE) !== Math.floor((s.t - dt) / STROKE)) splash(s, s.hx, s.hy, 4);   // 팔 젓는 박자마다 손끝 물보라
  for(const q of s.sp) if(q.a > 0){ q.vy += 1100 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.a -= dt * 1.3; }
}
/* 장면 자막 — 이야기 순서. 위쪽에 영화 자막처럼(물속 장면은 가운데) */
const CAP = { intro:['가을의 낙산은', '웃음소리와 함성, 응원으로 가득했어요'], walk:['이제는…', '어쩐지 나만 남은 것 같아요'], paddle:['쓸쓸히 바다로 나가며', '동기들을 떠올려요'],
  wait:['어느새 바다는 겨울이 되었어요', '라인업에서 세트를 기다려요'], tug:['쓸쓸히 떠 있는데…', '발밑에 뭔가 걸렸어요!'], alone:['선물은 기쁘지만…', '여전히 혼자라 쓸쓸해요'], gather:['그때, 멀리서 웃음소리가 들려와요', '버디들이 하나둘, 나에게 다가와요'], ride:['겨울 바다에서', '누군가는 파도를 타고, 누군가는 응원해요'], together:['파도에서 나와', '함께 나눠 먹으며 웃어요'], pop:['끌어올려 보니,', '선물이었어요 🎁'] };
function caption(g, s, X){
  let c = CAP[s.ph], k = s.k; if(!c || (s.ph === 'together' && (X.rm || s.k >= SHOT))) return;
  if(s.ph === 'walk'){ if(k < 1.3 && !X.rm){ c = CAP.intro; k = 9; } else k -= 1.3; }   // 출발 뒤 잠깐은 함성과 함께 첫 자막 그대로
  const a = X.rm ? 1 : Math.min(1, k / .5), y = 300 + (1 - a) * 24, main = c[1];
  g.save(); g.globalAlpha = a; g.textAlign = 'center';
  g.shadowColor = 'rgba(30,15,40,.6)'; g.shadowBlur = 22; g.shadowOffsetY = 4;
  g.fillStyle = '#FFE2B8'; g.font = `800 38px ${FONT}`; g.fillText(c[0], W / 2, y);
  fit(g, main, 960, 74, 900); g.fillStyle = '#fff'; g.fillText(main, W / 2, y + 92);
  g.restore();
}
/* 눈송이 — a(0~1)만큼, x0~x1 사이만 */
const FLAKES = Array.from({ length:46 }, (_, i)=>({ x:(i * 173) % 1080, y:(i * 389) % 1920, r:3 + (i % 4) * 2.2, sp:40 + (i % 5) * 18, sw:20 + (i % 3) * 14 }));
function snow(g, t, a, x0, x1){
  if(a <= 0) return; g.save(); g.fillStyle = '#fff';
  FLAKES.forEach((f, i)=>{ if(i / FLAKES.length > a) return; const x = f.x + Math.sin(t * .8 + i) * f.sw, y = (f.y + t * f.sp) % 1920; if(x0 != null && (x < x0 || x > x1)) return;
    g.globalAlpha = .75; g.beginPath(); g.arc(x, y, f.r, 0, 7); g.fill(); g.globalAlpha = .18; g.beginPath(); g.arc(x, y, f.r * 2.4, 0, 7); g.fill(); });
  g.restore();
}
/* 화면 마무리 — 따뜻한 색 보정 · 비네트 · 위아래 검은 띠(선물 공개 때 걷힌다) · 아주 옅은 필름 결 */
function post(g, s, X, t){
  g.save();
  const sv = s.sv || 0, mix = (a, b) => a.map((v, i)=>Math.round(v + (b[i] - v) * sv)).join(',');   // 가을 황금빛 → 겨울 푸른 라일락
  g.globalCompositeOperation = 'soft-light'; const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, `rgba(${mix([255, 170, 130], [150, 165, 235])},.5)`); gr.addColorStop(.55, `rgba(${mix([255, 214, 170], [190, 200, 240])},.28)`); gr.addColorStop(1, 'rgba(120,170,220,.3)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  if(sv > .2 && s.ph !== 'tug'){ const m = g.createLinearGradient(0, 900, 0, 1260); m.addColorStop(0, 'rgba(235,240,255,0)'); m.addColorStop(.5, `rgba(235,240,255,${(sv - .2) * .35})`); m.addColorStop(1, 'rgba(235,240,255,0)'); g.fillStyle = m; g.fillRect(0, 900, W, 360); }   // 물 위 입김 같은 안개
  snow(g, t, sv > .6 ? (sv - .6) / .4 : 0);
  const v = g.createRadialGradient(W / 2, H * .48, H * .32, W / 2, H * .5, H * .78); v.addColorStop(0, 'rgba(30,15,40,0)'); v.addColorStop(1, `rgba(30,15,40,${s.ph === 'reveal' ? .32 : .5})`);
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  if(CAP[s.ph]){ const sc = g.createLinearGradient(0, 0, 0, 560); sc.addColorStop(0, 'rgba(30,15,40,.4)'); sc.addColorStop(1, 'rgba(30,15,40,0)'); g.fillStyle = sc; g.fillRect(0, 0, W, 560); }
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
  if(ph === 'together' || ph === 'reveal') photo(X);
  if(ph === 'reveal'){ const k = X.rm ? 9 : s.k; poster(g, X, { t, text:k / .8, fade:Math.max(0, .6 - k * 1.5) }); return; }   // 공개 = 단체 포스터(내보내는 그림과 같다)
  const tugA = ph === 'tug' ? (X.rm ? 1 : Math.min(1, s.k / .6)) : ph === 'pop' ? (X.rm ? 0 : Math.max(0, 1 - s.k / .35)) : 0;
  if(ph === 'prize'){ prizeOpen(g, s, X, t); post(g, s, X, t); return; }
  if(ph === 'alone' || ph === 'gather' || ph === 'ride' || ph === 'together'){ winterScene(g, s, X, t); post(g, s, X, t); caption(g, s, X); return; }
  if(tugA < 1){
    const beach = ph !== 'pop' && ph !== 'reveal';
    g.save(); if(beach) cam(g, 1 + (s.cz - 1) * .8, s.cx, s.cy);   // 배경은 조금 덜 움직여 깊이감(시차)
    if(ph === 'intro' || ph === 'walk') autumn(g, s, X, t); else{ back(g, PIC.bg, t, beach ? 1.05 : 1.02, 540, 1150); sunFx(g, t, beach ? 1 : .55); }
    g.restore();
    if(beach){ g.save(); cam(g, s.cz, s.cx, s.cy); rider(g, s, X, t);
      g.fillStyle = '#fff'; for(const q of s.sp) if(q.a > 0){ g.globalAlpha = Math.max(0, q.a); g.beginPath(); g.arc(q.x, q.y, 10, 0, 7); g.fill(); } g.globalAlpha = 1; g.restore(); }
    else prizeScene(g, s, X, t);
  }
  if(tugA > 0){ g.globalAlpha = tugA; tugScene(g, s, X, t); g.globalAlpha = 1;
    if(ph === 'tug'){ g.fillStyle = '#fff'; for(const q of s.sp) if(q.a > 0){ g.globalAlpha = Math.max(0, q.a) * .8; g.beginPath(); g.arc(q.x, q.y, 9, 0, 7); g.fill(); } g.globalAlpha = 1; } }
  post(g, s, X, t);
  caption(g, s, X);
}

/* ── 화면 ── */
const canShare = () => { try{ return !!navigator.canShare?.({ files:[new File(['x'], 'a.png', { type:'image/png' })] }); }catch(e){ return false; } };
function show(id){ ['pp-enter', 'pp-look', 'pp-play'].forEach(k=>{ $(k).hidden = k !== id; }); if(id !== 'pp-play'){ cancelAnimationFrame(raf); raf = 0; } scrollTo(0, 0); }
/* 1) 이름 찾기 */
function paintList(){
  const q = $('pp-q').value.trim().replace(/\s+/g, ''), list = PEOPLE.filter(p=>!q || p.name.toLowerCase().includes(q.toLowerCase()));
  const chip = p => { const n = esc(p.name), role = p.staff ? `<small>${esc(p.cohort)}</small>` : '';
    if(mineHere(p.name)) return `<button type="button" class="pp-name mine" data-name="${n}" data-mine="${n}">${n}${role}<em>🎁 내 선물 다시 보기</em></button>`;
    if(takenBy(p.name)) return `<button type="button" class="pp-name off" data-name="${n}" disabled aria-disabled="true" aria-label="${n} — 이미 받았어요">${n}${role}<em>받음 ✓</em></button>`;
    if(closed()) return `<button type="button" class="pp-name off" data-name="${n}" disabled aria-disabled="true" aria-label="${n} — 마감">${n}${role}<em>마감</em></button>`;
    return `<button type="button" class="pp-name" data-name="${n}">${n}${role}</button>`; };
  const grp = (t, ps) => ps.length ? `<h3 class="pp-grp">${t}</h3><div class="pp-chips">${ps.map(chip).join('')}</div>` : '';
  $('pp-list').innerHTML = list.length ? grp('양양서핑학교 6기', list.filter(p=>!p.staff)) + grp('코치·매니저', list.filter(p=>p.staff))
    : '<p class="pep-note">명단에 없는 이름이에요 · 띄어쓰기 없이 다시 찾아 주세요</p>';
}
function enter(){ show('pp-enter'); enterList(); pullWall(); }   // 돌아올 때마다 받은 이름을 새로 읽는다
function enterList(){
  paintList();
  const mine = PEOPLE.filter(p=>mineHere(p.name)), top = $('pp-mine');
  top.hidden = mine.length !== 1; top.innerHTML = mine.length === 1 ? `<button type="button" class="btn pep-big pep-open" data-mine="${esc(mine[0].name)}">🎁 ${esc(mine[0].name)}님 선물 다시 보기</button>` : '';
  $('pp-closed').hidden = !closed();
  const again = $('pp-again'), show_ = !!me && !mineHere(me.name) && !takenBy(me.name) && !closed(); again.hidden = !show_;
  again.innerHTML = show_ ? `<button type="button" class="btn pep-big" data-pagain>${esc(me.name)} 님으로 계속하기 ›</button>` : '';
}
/* 내 선물 다시 보기 — 이야기를 건너뛰고 결과 화면으로. 새로 뽑지 않는다(gift_claim 안 부름) */
function again(n){
  const p = PEOPLE.find(x=>x.name === n); if(!p) return;
  me = { name:p.name, cohort:p.cohort, g:MEN.includes(p.name) ? 'm' : 'f', li:me && me.name === n ? me.li : 0 }; saveMe(); loadRes();
  if(!res || !res.id){ const row = wall.find(r=>r.name === n); if(!row) return pickName(n);
    res = { id:String(row.text || '').split('|')[0], text:String(row.text || ''), at:Date.parse(row.created_at) || Date.now(), sent:1, mine:true }; saveRes(); }   // 열쇠가 있는 이름 — 받은 종류는 서버 줄에서, 진짜 내 것인지는 gift_open 이 열쇠로 확인한다
  play(true);
}
/* 이야기 처음부터 다시 보기 — 아는 선물로 다시 돌린다(새로 안 뽑음) */
function replay(){ if(!S || !res || !res.id) return; S = newS(); S.re = 1; go(S, 'walk'); if(X) X.prize = prizeOf(res); sfx(cheer); loadCrew(); ctl(); scrollTo(0, 0); }
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
  me = { name:p.name, cohort:p.cohort, g:MEN.includes(p.name) ? 'm' : 'f', li:same ? me.li : 0 };
  lookG = me.g; lookI = me.li; $('pp-who').textContent = `${me.name} 님`;
  show('pp-look'); paintLook(); loadRes(); pullMine();
}
/* 3) 탐험 */
function ctl(){
  const el = $('pep-ctl'), hint = $('pep-hint'); if(!el) return;
  const ph = S ? S.ph : 'intro';
  if(res && res.closed){ hint.textContent = ''; el.innerHTML = '<div class="pep-res"><div><span>🌙</span><b>선물 지급이 마감됐어요</b><small>빼빼로 이벤트 선물 지급은 11월 11일 자정에 마감됐어요.</small></div></div><button type="button" class="btn sm ghost" data-pback>‹ 처음으로</button>'; return; }
  if(res && res.soldout){ hint.textContent = ''; el.innerHTML = '<div class="pep-res"><div><span>앗</span><b>선물이 모두 나갔어요</b><small>문제가 있으면 오웬에게 알려 주세요.</small></div></div>'; return; }
  if(['prize', 'alone', 'gather', 'ride', 'together'].includes(ph)){ const p = prizeOf(res); hint.textContent = ph === 'prize' ? (p ? p.short + ' 당첨!' : '') : (CAP[ph] || [])[1] || ''; el.innerHTML = '<button type="button" class="btn sm ghost" data-pskip>다음 장면 ›</button>'; return; }
  if(res && ph !== 'pop' && (!S || !S.re || ph === 'reveal')){
    const p = prizeOf(res); hint.textContent = '';
    el.innerHTML = `<div class="pep-res"><img src="img/pepero/${stickerOf(p)}.webp" alt="" width="76" height="76" onerror="this.hidden=true"><div><span>${esc(p.rank || '선물')}</span><b>${esc(p.n)}</b><small>${res.mine === false ? '이 이름은 다른 기기에서 이미 받았어요.<br>받은 폰에서 열어 주세요 — 문제가 있으면 오웬에게 알려 주세요.' : '아래 버튼으로 기프티콘을 열어<br>매장에서 보여 주세요.'}</small></div></div>
      <div class="pp-letter"><p>우리가 함께 나눈 추억, 가을 바다에서 시작해서 어느새 겨울 바다가 되어 가요.</p><b>작은 선물이지만, 함께 파도 위에서 나눈 마음을 나눠요.</b><p>겨울 바다에서도, 다시 만나요 🌊</p><small>양양서핑학교 가을학기 6기<br>서프 버디 ${esc(me.name)} · 2026.11.11 낙산 해변</small></div>
      ${res.mine === false ? '' : '<button type="button" class="btn pep-big pep-open" data-popen>🎁 당첨된 기프티콘 열기</button>'}
      <button type="button" class="btn pep-big pep-brag" data-pimgsh>📸 서프 버디에게 추억 나누기</button>
      <div class="pep-share"><button type="button" class="btn sm" data-pimg>💾 추억 사진 저장</button><button type="button" class="btn sm mint" data-pvid>🎬 스토리 영상 만들기</button></div><div id="pep-vid" class="pep-vid"></div>
      <small class="pep-note">공유 창에서 Instagram › 스토리를 고르면 돼요</small>
      <button type="button" class="btn sm ghost" data-preplay>↺ 이야기 처음부터 다시 보기</button>`;
    paintVid(); return;
  }
  if(ph === 'intro'){
    const open = live(), wait = !!checking; hint.textContent = '';
    el.innerHTML = `<p class="pep-intro"><b>가을 낙산에서 함께 탔던 우리, 겨울 바다에서 다시 만나요</b>
      혼자 나간 겨울 라인업, 리시 끝에 걸린 건 바다가 보낸 빼빼로데이 선물상자! 꽝은 없어요.</p>
      <button type="button" class="btn pep-big" data-pgo ${open && !wait ? '' : 'disabled'}>${!open ? (Date.now() < START ? '11월 11일에 열려요' : '선물 지급이 마감됐어요') : wait ? '확인하는 중…' : '🏖️ 해변으로 출발'}</button>
      <small class="pep-note">24명 모두 하나씩 · 🍫 GS25 빼빼로 또는 🍦 베스킨라빈스 싱글레귤러 기프티콘</small>`;
    return;
  }
  const dots = (n, of) => `<div class="pep-dots" aria-hidden="true">${'<i class="on"></i>'.repeat(n)}${'<i></i>'.repeat(Math.max(0, of - n))}</div>`;
  if(ph === 'walk'){ hint.textContent = ''; el.innerHTML = '<button type="button" class="btn sm ghost" data-pstep>다음 장면 ›</button>'; return; }
  if(ph === 'paddle'){ hint.textContent = `엎드려서 라인업까지 패들! (${S.n}/5)`;
    el.innerHTML = `<button type="button" class="btn pep-big pep-pad" data-ppad>🌊 패들!</button>${dots(S.n, 5)}`; return; }
  if(ph === 'wait'){ hint.textContent = '라인업에서 세트를 기다려요…'; el.innerHTML = '<button type="button" class="btn pep-big pep-pad" disabled>🌊 세트를 기다리는 중…</button>'; return; }
  if(ph === 'tug'){ hint.textContent = `어? 리시가 묵직해요 — 발밑에 뭔가 걸렸어요! (${S.pulls}/3)`; el.innerHTML = `<button type="button" class="btn pep-big pep-pull" data-ppull>💪 영차! 리시 끌어올리기</button>${dots(S.pulls, 3)}`; return; }
  if(ph === 'pop'){ hint.textContent = '바다가 보낸 선물상자를 열어요…'; el.innerHTML = '<button type="button" class="btn pep-big" disabled>🎁 두근두근</button>'; }
}
function paintWall(){
  const el = $('pep-wall'); if(!el) return;
  el.innerHTML = `<h4>🎉 오늘 당첨 소식</h4>${wall.length ? wall.slice(0, 40).map(r=>`<div class="pep-w${me && r.name === me.name ? ' me' : ''}"><b>${esc(String(r.name || '').slice(0, 20))}</b><span>${esc(seen(r).slice(0, 40))}</span></div>`).join('') : '<p class="pep-note">아직 소식이 없어요 · 첫 선물을 건져 보세요</p>'}`;
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
  imgs = { key:id, p:Promise.all(['pad', 'sit', 'gift', 'alone', 'walk'].map(ps=>new Promise(ok=>{ const im = new Image(); im.onload = ()=>ok(im); im.onerror = ()=>ok(null); im.src = charSrc(id, ps); })))
    .then(([a, b, c, d, e])=>{ imgs.pad = a; imgs.sit = b; imgs.gift = c; imgs.alone = d; imgs.walk = e; }) };
  return imgs.p;
}
function assets(){ want(ALL); return { name:me ? me.name : '', pad:imgs.pad || null, sit:imgs.sit || null, gift:imgs.gift || null, alone:imgs.alone || null, walk:imgs.walk || null, prize:res ? prizeOf(res) : null, rm:RM }; }
function loop(now){
  raf = 0; if($('pp-play').hidden || !cv) return;
  const dt = Math.min(.05, last ? (now - last) / 1000 : 0); last = now;
  step(S, dt, RM);
  if(S.ph === 'walk' && S.k > WALK_END){ go(S, 'paddle'); splash(S, 420, 1300, 12); ctl(); }
  else if(S.ph === 'wait' && S.k > 2.8){ go(S, 'tug'); navigator.vibrate?.([30, 40, 30, 40, 60]); ctl(); }
  else if(S.ph === 'pop' && S.k > 1.8 && res && res.id){ X.prize = prizeOf(res); next(); }
  else if(S.ph === 'prize' && S.k > 2.9) next();
  else if(S.ph === 'alone' && S.k > 3) next();
  else if(S.ph === 'gather' && S.k > 4.6) next();
  else if(S.ph === 'ride' && S.k > 3.5) next();
  else if(S.ph === 'together' && S.k > SHOT + 2.2) next();
  if(S.ph === 'together' && S.k >= SHOT && !S.shot){ S.shot = 1; sfx(shutter); navigator.vibrate?.(30); }
  if(S.ph === 'gather'){ const n = S.k > 1.6 ? 2 : S.k > .2 ? 1 : 0; if(n > (S.gn || 0)){ S.gn = n; sfx(n === 1 ? (c, o, t)=>{ const f = c.createGain(); f.gain.value = .4; f.connect(o); cheer(c, f, t); } : cheer); } }   // 멀리서 웃음소리 → 가까이
  paint(cv.getContext('2d'), S, X);
  raf = requestAnimationFrame(loop);
}
function sizeCv(){
  cv = $('pep-cv'); const w = Math.max(160, Math.round(cv.getBoundingClientRect().width * Math.min(2, devicePixelRatio || 1)));
  if(cv.width !== w){ cv.width = w; cv.height = Math.round(w * H / W); }
  const g = cv.getContext('2d'); g.setTransform(w / W, 0, 0, w / W, 0, 0); g.imageSmoothingQuality = 'high'; g.__gp = null;   // 기본(low)은 줄여 그릴 때 가장자리가 계단져 보인다
  X = assets();
}
async function play(direct){
  show('pp-play'); $('pp-me').textContent = `서프 버디 ${me.name}${me.cohort !== '6기' ? ' · ' + me.cohort : ''}`;
  S = newS(); if(res){ go(S, 'reveal'); S.k = 1; }
  sizeCv(); ctl(); paintWall();
  last = 0; if(!raf) raf = requestAnimationFrame(loop);
  loadImgs().then(()=>{ if(X) Object.assign(X, { pad:imgs.pad, sit:imgs.sit, gift:imgs.gift, alone:imgs.alone, walk:imgs.walk }); });
  loadCrew();
  pullWall();
  if(!direct) await pullMine();   // 다시 보기는 서버에 묻지 않는다
  if(res && S.ph === 'intro'){ go(S, 'reveal'); S.k = 1; X.prize = prizeOf(res); }
  ctl();
}
function walk(){ if(S && S.ph === 'walk') S.k = Math.max(S.k, WALK_END); }   // 가을 → 겨울 장면 건너뛰기
function paddle(){
  if(!S || S.ph !== 'paddle') return;
  S.n++; splash(S, S.hx || 600, S.hy || BY, 8); sfx((c, o, t)=>hit(c, o, t, .16, .22, ['bandpass', 800, .8])); navigator.vibrate?.(10);
  if(S.n >= 5){ go(S, 'wait'); splash(S, 610, BY, 10); }
  ctl();
}
function pull(){
  if(!S || S.ph !== 'tug') return;
  S.pulls++; S.pk = S.t; splash(S, 300, TY - 10, 10); sfx((c, o, t)=>clap(c, o, t, .9)); navigator.vibrate?.(18);
  if(S.pulls >= 3){ go(S, 'pop'); splash(S, 540, 1500, 20);
    claim().then(()=>{ if(X) X.prize = prizeOf(res); ctl(); }).catch(e=>{ go(S, 'tug'); S.pulls = 2; ctl(); say(/noname|notoken/.test(e && e.message) ? '선물을 받을 수 없는 이름이에요 — 오웬에게 알려 주세요' : '신호가 약해요 — 한 번 더 당겨 주세요'); }); }   // 서버가 답할 때까지 상자가 떠 있다
  ctl();
}
async function start(){
  if(res || checking || !live()) return ctl();
  await pullMine(); if(res){ go(S, 'reveal'); S.k = 1; X.prize = prizeOf(res); return ctl(); }   // 다른 기기에서 이 이름으로 이미 뽑았다
  go(S, 'walk'); sfx(cheer); loadCrew(); ctl();
}
const ENDING = ['pop', 'prize', 'alone', 'gather', 'ride', 'together', 'reveal'];
function next(){   // 이야기 다음 장면 — 시간이 되거나 그림을 누르면(건너뛰기)
  const i = ENDING.indexOf(S.ph); if(i < 0 || i >= ENDING.length - 1 || !res || !res.id) return;   // 마감·모두 나감이면 선물 장면으로 안 간다
  go(S, ENDING[i + 1]); if(X) X.prize = prizeOf(res);
  if(S.ph === 'reveal' || S.ph === 'prize'){ navigator.vibrate?.([20, 40, 20]); sfx(sparkle); }
  if(S.ph === 'ride') sfx(cheer);
  ctl();
}
const act = () => S && (S.ph === 'walk' ? walk() : S.ph === 'paddle' ? paddle() : S.ph === 'tug' ? pull() : ['prize', 'alone', 'gather', 'ride', 'together'].includes(S.ph) ? next() : 0);   // 그림을 눌러도 같은 동작

/* ── 스토리 내보내기 — 단체 포스터 PNG · 약 15.6초 추억 영상(가을 → 겨울 → 다시 함께, 우쿨렐레 음악·효과음까지 영상에 담는다) ── */
function storyCanvas(){ const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').imageSmoothingQuality = 'high'; return c; }
async function png(){
  await Promise.all([loadImgs(), want(ALL), loadCrew()]); await want([frontOf(assets())].filter(Boolean)); const c = storyCanvas();
  poster(c.getContext('2d'), Object.assign(assets(), { rm:true }), { text:1 });
  return new Promise(ok=>c.toBlob(ok, 'image/png'));
}
const MIMES = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
/* 영상 장면표 — 가을 낙산(웃음소리) → 색이 식으며 사람들이 사라짐 → 눈 속에 혼자 → 멀리서 웃음소리, 버디들이 하나둘 → 다 같이 파도 → 초점이 맞으며 찰칵, 단체 사진 → 끝 화면(로고·편지).
   색은 가을 황금빛 → 겨울 푸른빛 → 해돋이 온기로 돌아온다 */
const TL = [['intro', .6], ['walk', 3.0], ['alone', 1.6], ['gather', 3.2], ['ride', 2.0], ['together', 3.0], ['reveal', 2.2]], REEL_END = TL.reduce((a, x)=>a + x[1], 0);
const at = ph => { let a = 0; for(const [p, d] of TL){ if(p === ph) return a; a += d; } return a; };
function reel(g, X, el, s, dt){
  let acc = 0, ph = 'reveal'; for(const [p, d] of TL){ if(el < acc + d){ ph = p; break; } acc += d; }
  if(s.ph !== ph) go(s, ph);
  step(s, dt, false); paint(g, s, X);
}
function score(ctx, out, a0){
  const q0 = at('walk') + 1.3, q1 = at('gather');   // 사람들이 사라질 때부터 혼자인 장면까지는 음악이 잦아든다
  for(let i = 0, t = 0; t < REEL_END - .5; i++, t += 4 * BEAT) if(t + 4 * BEAT <= q0 + .3 || t >= q1 - .3) bar(ctx, out, a0 + t, i);
  strum(ctx, out, a0 + q0, CHORDS[2], .5, 0); strum(ctx, out, a0 + q0 + 1.3, CHORDS[3], .4, 0); strum(ctx, out, a0 + at('alone') + .2, CHORDS[2], .35, 0);
  const far = ctx.createGain(); far.gain.value = .4; far.connect(out);   // 멀리서 들려오는 웃음소리
  cheer(ctx, out, a0 + .1); cheer(ctx, far, a0 + q1 + .1); cheer(ctx, out, a0 + q1 + 1.5); cheer(ctx, out, a0 + at('ride')); shutter(ctx, out, a0 + at('together') + SHOT);
  sparkle(ctx, out, a0 + at('reveal') + .1); chime(ctx, out, a0 + REEL_END - 1, .7);
}
async function video(onP){
  await Promise.all([loadImgs(), want(ALL), loadCrew()]); await want([frontOf(assets())].filter(Boolean));
  const mime = typeof MediaRecorder === 'undefined' ? null : MIMES.find(m=>{ try{ return MediaRecorder.isTypeSupported(m); }catch(e){ return false; } });
  const c = storyCanvas(); if(!mime || !c.captureStream) throw new Error('norec');
  const g = c.getContext('2d'), A = Object.assign(assets(), { rm:false });
  let ac = null, dest = null;
  try{ const AC = window.AudioContext || window.webkitAudioContext; ac = new AC(); await Promise.race([ac.resume(), new Promise(r=>setTimeout(r, 300))]); dest = ac.createMediaStreamDestination(); }catch(e){ dest = null; }
  const st = newS(); let lt = 0; reel(g, A, 0, st, 0);
  const vs = c.captureStream(30), stream = new MediaStream([...vs.getVideoTracks(), ...(dest ? dest.stream.getAudioTracks() : [])]);
  const rec = new MediaRecorder(stream, { mimeType:mime, videoBitsPerSecond:6e6 }), parts = [];
  rec.ondataavailable = e=>{ if(e.data && e.data.size) parts.push(e.data); };
  return new Promise((ok, no)=>{
    let iv = 0; const t0 = performance.now() + 150;
    if(dest){ const m = ac.createGain(); m.gain.value = .9; m.connect(dest); score(ac, m, ac.currentTime + .15); }
    const done = ()=>{ clearTimeout(kill); clearInterval(iv); stream.getTracks().forEach(t=>t.stop()); vs.getTracks().forEach(t=>t.stop()); try{ ac && ac.close(); }catch(e){} };
    const kill = setTimeout(()=>{ done(); no(new Error('timeout')); try{ rec.stop(); }catch(e){} }, 30000);   // 멈춘 채 기다리지 않게
    rec.onstop = ()=>{ done(); const b = new Blob(parts, { type:mime.split(';')[0] }); b.size ? ok(b) : no(new Error('empty')); };
    rec.start(250);
    iv = setInterval(()=>{
      const el = Math.max(0, (performance.now() - t0) / 1000);
      reel(g, A, el, st, Math.min(.1, Math.max(0, el - lt))); lt = el; onP?.(Math.min(1, el / REEL_END));
      if(el >= REEL_END){ clearInterval(iv); try{ rec.stop(); }catch(e){} }
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
  if(t.id === 'pp-snd') return music(!SND.on);
  if(t.matches('[data-mine]')) return again(t.dataset.mine);
  if(t.matches('[data-preplay]')) return replay();
  if(t.matches('[data-name]')) return pickName(t.dataset.name);
  if(t.matches('[data-pagain]')) return pickName(me.name);
  if(t.matches('[data-pl]')){ lookI = +t.dataset.pl; return paintLook(); }
  if(t.matches('[data-plook]')){ me.g = lookG; me.li = lookI; saveMe(); return play(); }
  if(t.matches('[data-pback]')) return enter();
  if(t.matches('[data-pgo]')) return start();
  if(t.matches('[data-pskip]')) return next();
  if(t.matches('[data-popen]')) return openGift(t);
  if(t.matches('[data-pgclose]')) return closeGift();
  if(t.matches('[data-pstep]')) return walk();
  if(t.matches('[data-ppad]')){ if(e.detail === 0) paddle(); return; }   // 키보드 — 손가락은 pointerdown 이 맡는다
  if(t.matches('[data-ppull]')) return pull();
  if(t.matches('[data-pimg], [data-pimgsh]')){
    t.disabled = true; let b = null; try{ b = await png(); }catch(e){} t.disabled = false;
    if(!b) return say('그림을 만들지 못했어요 — 화면을 캡처해 주세요');
    const f = new File([b], `naksan-1111-${Date.now()}.png`, { type:'image/png' });
    if(t.matches('[data-pimgsh]') && await shareFile(f)) return;
    saveBlob(b, f.name); say(t.matches('[data-pimgsh]') ? '📸 추억 사진을 저장했어요 — 인스타 스토리에 올려 주세요' : '📸 추억 사진을 저장했어요'); return;
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
/* 기프티콘 보기 — 받은 폰에서만(열쇠). 그림은 화면에만 잠깐 두고 닫으면 지운다(기기·캐시·공유 그림에 안 남김) */
function closeGift(){ const m = $('pp-gc'); if(!m) return; m.hidden = true; const im = m.querySelector('img'); if(im) im.removeAttribute('src'); }
function sampleCard(){   // 시연용 가짜 카드 — 바코드 숫자 없음
  const c = document.createElement('canvas'); c.width = 600; c.height = 900; const g = c.getContext('2d'), k = KINDS[res.id] || KINDS.pepero;
  g.fillStyle = '#fff'; g.fillRect(0, 0, 600, 900); g.fillStyle = '#FFE1E8'; g.fillRect(0, 0, 600, 140);
  g.textAlign = 'center'; g.fillStyle = INK; g.font = `900 40px ${FONT}`; g.fillText('시연용 예시', 300, 70); g.font = `800 26px ${FONT}`; g.fillText('실제 기프티콘 아님', 300, 112);
  const im = PIC[k.pic]; if(im){ const f = 300 / Math.max(im.width, im.height); g.drawImage(im, 300 - im.width * f / 2, 200, im.width * f, im.height * f); }
  g.fillStyle = INK; g.font = `900 34px ${FONT}`; g.fillText(k.n, 300, 580);
  g.fillStyle = '#ddd'; for(let x = 90; x < 510; x += 14) g.fillRect(x, 640, 6 + (x * 7) % 6, 120);
  g.fillStyle = '#E0607A'; g.font = `900 30px ${FONT}`; g.fillText('시연용 — 실제 기프티콘 아님', 300, 830); return c.toDataURL('image/png');
}
async function openGift(b){
  if(!res || res.mine === false) return;
  b.disabled = true; let src = null;
  try{ src = DEMO ? sampleCard() : await rpc('gift_open', { p_name:me.name, p_token:tok(false) || '' }); }catch(e){}
  b.disabled = false;
  if(typeof src !== 'string' || !/^data:image\//.test(src)) return say('기프티콘을 열 수 없어요 — 받은 폰에서 열어 주세요 · 문제가 있으면 오웬에게');
  const m = $('pp-gc'); m.querySelector('img').src = src; m.hidden = false; m.querySelector('[data-pgclose]').focus();
}
function boot(){
  const app = $('pep-app'); if(!app) return;
  app.addEventListener('click', onClick);
  /* 패들은 꾹 누르고 있어도 저어진다 */
  let hold = 0; const stop = ()=>{ clearInterval(hold); hold = 0; };
  app.addEventListener('pointerdown', e=>{ const b = e.target.closest('[data-ppad]'); if(!b || b.disabled) return; e.preventDefault(); paddle(); stop(); hold = setInterval(paddle, 300); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(k=>app.addEventListener(k, stop));
  $('pp-q').addEventListener('input', paintList);
  addEventListener('keydown', e=>{ if(e.key === 'Escape') closeGift(); });
  addEventListener('resize', ()=>{ if(!$('pp-play').hidden) sizeCv(); });
  if(DEMO){ const bd = $('pp-demo'); if(bd) bd.hidden = false; }
  let again = false; try{ again = localStorage.getItem(LSND) === '1'; }catch(e){}
  paintSnd(); if(again){ const b = $('pp-snd'); if(b) b.textContent = '🔊';   // 켜 두었으면 첫 터치에 다시(자동 재생은 막혀 있다)
    addEventListener('pointerdown', e=>{ if(!SND.on && !e.target.closest('#pp-snd')) music(true, true); }, { once:true, capture:true }); }
  want(['autumn-open', 'bg']); loadMe(); enter();
}
boot();
window._pepero = { next:()=>next(), replay:()=>replay(), KINDS, LOOKS, png, video, audio:{ bar, score, BEAT, REEL_END }, music, walk, paddle, pull, get res(){ return res; }, get S(){ return S; }, get wall(){ return wall; }, get me(){ return me; } };
})();
