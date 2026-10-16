/* 🥊 라이벌 · 🤝 함께 목표 · 소식줄 「OO님을 넘었어요」 시험 (가짜 동기들).
   ① 허브 라이벌 카드 — 같은 기수·이번 주 바로 위 한 명(다른 기수·지난주 기록은 무시)
   ② 판이 끝나 동기를 넘으면 결과 줄에 축하 + 내 프로필 pass(생일 없이 올라감)
   ③ 누가 나를 넘었으면 카드가 「되찾기」로 바뀌고, 소식줄에도 뜬다
   ④ 함께 목표 — 채워야·참여해야 받고, 한 주에 한 번만
   ⑤ 남의 이름·pass 값 XSS, 합치기(merge)는 걸러진 값만
   ⑥ 320·360·390 가로 넘침 없음, 누르는 곳 44px 이상
   SHOT_DIR 이 있으면 화면을 남긴다. */
import { open } from './mock.mjs';
import fs from 'fs';
const OUT = process.env.SHOT_DIR || '';
const bad = '<img src=x onerror="window.__xss=1">';
const wkOf = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const W = wkOf(), now = Date.now();
const mk = (id, name, cohort, play) => ({ id, name, cohort, profile:{ gender:'m', play }, play });
const surfers = [
  { id:'u4', name:'이성현', cohort:'6기', profile:{} },          // 맨 앞 — 목업은 id 조회에도 전체를 돌려줘서 첫 행이 「내 서버 도감」으로 합쳐진다
  mk('u1', '민지', '6기', { xp:300, best:960, wk:{ w:W, j:960, d:4, r:0, q:0 } }),
  mk('u2', '김도훈', '6기', { xp:200, best:700, wk:{ w:W, j:700, d:6, r:300, q:1 } }),
  mk('u3', bad, '6기', { xp:100, wk:{ w:W, j:1500, d:0, r:0, q:0 }, pass:{ t:now - 3600e3, k:'j', n:bad, i:'u9', v:1500 } }),
  mk('u5', '다른기수', '5기', { wk:{ w:W, j:870 } }),
  mk('u7', '진', '6기', { wk:{ w:W, j:500 }, pass:{ t:now - 20 * 6e4, k:'j', n:'민지', i:'u1', v:990 } }),
  mk('u6', '지난주', '6기', { wk:{ w:'2020-01-06', j:880 } }),
];
const play = { base:240, bonus:20, badges:{ drill1:1 }, qd:{}, qall:0, best:900, gday:'', gxp:0, gn:{}, lvSeen:2, xp:260, lv:2, shells:40, spent:0, own:{}, wk:{ w:W, j:840, d:0, r:0, q:0 } };
const fail = [], ok = (c, m) => { if(!c){ fail.push(m); console.log('  ✗', m); } };
const shots = [];
const shot = async (t, name, clip) => { if(!OUT) return; for(let k = 0; k < 6; k++){ const o = await t.S(()=>{ const p = document.getElementById('pop'); if(p.hidden) return false; popClose(); return true; }); if(!o) break; await t.sleep(300); } const f = `${OUT}/fun-s-${name}.png`; fs.writeFileSync(f, await t.p.screenshot(clip ? { clip } : { fullPage:false })); shots.push(f); };

for(const width of [390, 360, 320]){
  const t = await open({ surfers }, { id:'u4', name:'이성현', cohort:'6기', profile:{ gender:'f', birth:'1999-01-01', dressed:1, play } }, { width, wait:2800 });
  await t.S(()=>{ for(let i = 0; i < 8; i++) if(!document.getElementById('pop').hidden) popClose(); document.getElementById('t-play').click(); });
  await t.sleep(700);

  /* ① 라이벌 */
  const r1 = await t.S(()=>{ const b = document.querySelector('#play-hub .rival'), c = document.querySelector('#play-hub .coop');
    const R = b.getBoundingClientRect();
    return { 글:b.textContent.replace(/\s+/g, ' ').trim(), 종류:b.className, 이동:b.dataset.hub, 높이:Math.round(R.height), 함께:c?.textContent.replace(/\s+/g, ' ').trim(), 넘침:document.documentElement.scrollWidth - innerWidth }; });
  console.log(width, '① 라이벌', r1);
  ok(/민지님까지 120점/.test(r1.글) && r1.이동 === 'game' && /up/.test(r1.종류), `${width} 라이벌 = 바로 위 민지(다른 기수 870·지난주 880 무시)`);
  ok(r1.높이 >= 44 && r1.넘침 <= 0, `${width} 라이벌 크기·넘침`);
  ok(/4,500 \/ 4,200점/.test(r1.함께) && /참여 5명/.test(r1.함께), `${width} 함께 목표 합계(같은 기수·이번 주만, 6명×700)`);
  if(width === 390){
    await shot(t, 'hub-rival', { x:0, y:await t.S(()=>Math.max(0, document.querySelector('#play-hub .hubhero').getBoundingClientRect().top + scrollY - 10)), width:390, height:520 });

    /* ② 판이 끝나 민지를 넘는다 */
    const r2 = await t.S(()=>{ const r = playGameDone(1000, false, 10, false); return { 줄:upNudge('jump', { sc:1000, best:0 }), pass:ME.profile.play.pass, 카드:(renderHub(), document.querySelector('#play-hub .rival').textContent.replace(/\s+/g, ' ').trim()) }; });
    console.log(' ② 넘음', r2.줄.replace(/<[^>]+>/g, ''), r2.pass, '| 카드', r2.카드);
    ok(/<b>민지<\/b>님 기록을 넘었어요/.test(r2.줄) && /2위/.test(r2.줄), '결과 줄 축하·순위');
    ok(r2.pass && r2.pass.n === '민지' && r2.pass.i === 'u1' && r2.pass.k === 'j' && r2.pass.v === 1000, 'pass 기록');
    ok(/까지 500점/.test(r2.카드), '다음 라이벌로 넘어감(1500점 동기)');
    /* 다음 판은 못 넘으면 축하가 남지 않는다 */
    const r2b = await t.S(()=>{ playGameDone(200, false, 0, false); return upNudge('jump', { sc:200, best:1000 }); });
    ok(!/넘었어요/.test(r2b) && /바로 위/.test(r2b), '못 넘은 판엔 축하 없음 · 바로 위까지 남은 점수');
    await t.sleep(1600);
    const up = t.posts.filter(([u])=>u.startsWith('surfers')).map(([, b])=>b).pop();
    ok(up && up.profile?.play?.pass?.n === '민지' && !('birth' in (up.profile || {})), '프로필에 pass 저장(생일 없음)');

    /* 결과 화면 실제 모습 — 파도 점프 한 판을 바로 끝낸다 */
    const real = await t.S(async ()=>{ ME.profile.play.wk.j = 840; window.__pp = 0;
      gameOpen(); _game.begin(false); _game.st.pts = 990; _game.st.dead = true;
      const w = state.town.find(x=>x.id === 'u1'); w.profile.play.wk.j = 960;
      gameClose(); return true; });
    await t.sleep(300);
    /* gameClose 는 끝난 판을 기록만 하고 닫는다 — 결과 줄은 업넛지로 다시 그려서 보여 준다 */
    const card = await t.S(()=>{ const h = upNudge('jump', { sc:990, best:0 }); gameClose(); setTab('play');
      const d = document.createElement('div'); d.id = 'qa-res'; d.className = 'card'; d.style.cssText = 'margin:12px;padding:12px;background:#12305A;color:#fff;border:2px solid #000';
      d.innerHTML = '<b style="font-size:18px">🌊 990점</b>' + h; document.getElementById('play-hub').prepend(d); scrollTo(0, 0); return d.textContent; });
    console.log(' 결과 줄', card.replace(/\s+/g, ' '));
    ok(/민지님 기록을 넘었어요/.test(card), '실제 판 끝 → 민지 넘음');
    await t.sleep(200);
    await shot(t, 'result', { x:0, y:await t.S(()=>document.getElementById('qa-res').getBoundingClientRect().top + scrollY - 6), width:390, height:240 });
    await t.S(()=>document.getElementById('qa-res').remove());

    /* ③ 누가 나를 넘었다 */
    const r3 = await t.S(()=>{ const x = state.town.find(x=>x.id === 'u2'); x.profile.play.wk.j = 1200; x.profile.play.pass = { t:Date.now() - 600e3, k:'j', n:'이성현', i:'u4', v:1200 };
      renderHub(); const b = document.querySelector('#play-hub .rival'); return { 글:b.textContent.replace(/\s+/g, ' ').trim(), 종류:b.className }; });
    console.log(' ③ 나를 넘음', r3);
    ok(/김도훈님이 나를 넘었어요/.test(r3.글) && /hit/.test(r3.종류), '나를 넘은 동기가 먼저');
    await shot(t, 'hub-hit', { x:0, y:await t.S(()=>document.querySelector('#play-hub .rival').getBoundingClientRect().top + scrollY - 40), width:390, height:250 });

    /* 소식줄 — 동기들의 pass */
    const f = await t.S(()=>(window.feedEvents ? window.feedEvents() : []).filter(e=>e.ic === '🥊').map(e=>e.who + e.text));
    console.log(' 소식', f);
    ok(f.some(x=>/^진\(6기\)님이 파도 점프에서 민지님을 넘었어요/.test(x)), '소식줄에 라이벌 소식');

    /* ④ 함께 목표 */
    const r4 = await t.S(()=>{ state.town.find(x=>x.id === 'u3').profile.play.wk.j = 100; const s0 = coopState(), before = coopClaim();
      state.town.find(x=>x.id === 'u1').profile.play.wk.j = 5000; const s1 = coopState(); renderHub();
      const btn = !!document.querySelector('[data-coop]'), sh0 = ME.profile.play.shells; document.querySelector('[data-coop]')?.click();
      const got = ME.profile.play.shells - sh0, again = coopClaim();
      return { 전:s0, 못받음:before, 후:s1, 버튼:btn, 받음:got, 다시:again, cwk:ME.profile.play.cwk }; });
    console.log(' ④ 함께', r4);
    ok(r4.못받음 === 0 && r4.버튼 && r4.받음 === 20 && r4.다시 === 0 && r4.cwk === weekKey0(), '함께 목표 보상 1회');
    await t.S(()=>{ for(let i = 0; i < 4; i++) if(!document.getElementById('pop').hidden) popClose(); });
    await t.sleep(300);

    /* ⑤ 합치기 · XSS */
    const r5 = await t.S(b=>{ const p = ME.profile.play, t0 = p.pass.t;
      playMerge({ pass:{ t:'<x>', k:'j', n:b }, cwk:'<img>' }); const a = { ...p.pass }, c1 = p.cwk;
      playMerge({ pass:{ t:Date.now() + 5, k:'zz', n:'해커' } }); const a2 = { ...p.pass };
      playMerge({ pass:{ t:Date.now() + 9, k:'r', n:'  새 친구<script>', i:'"x' } }); const a3 = { ...p.pass };
      return { 그대로:a.t === t0, cwk:c1, 모르는키:a2.t === t0, 새것:a3, 주입:window.__xss || 0 }; }, bad);
    console.log(' ⑤ 합치기', r5);
    ok(r5.그대로 && r5.모르는키 && r5.cwk === weekKey0() && r5.새것.k === 'r' && !/[<>]/.test(r5.새것.n) && r5.새것.i === '' && !r5.주입, '합치기 거름');
    const x = await t.S(()=>({ 주입:window.__xss || 0, 이미지:document.querySelectorAll('#play-hub img[src="x"], #feed img').length }));
    ok(!x.주입 && !x.이미지, 'XSS 없음');

    /* 소식줄 화면 */
    await t.S(()=>{ setTab('home'); });
    await t.sleep(400);
    await t.S(()=>{ const e = (window.feedEvents() || []).findIndex(e=>e.ic === '🥊' && /^진/.test(e.who)); window.feedShow?.(e); scrollTo(0, 0); });
    await t.sleep(300);
    await shot(t, 'feed', { x:0, y:await t.S(()=>{ const f = document.getElementById('feed'); return f && !f.hidden ? Math.max(0, f.getBoundingClientRect().top + scrollY - 8) : 0; }), width:390, height:120 });
  }
  if(width === 320){ await t.S(()=>scrollTo(0, 0)); await shot(t, 'hub-320', { x:0, y:await t.S(()=>Math.max(0, document.querySelector('#play-hub .rival').getBoundingClientRect().top + scrollY - 40)), width:320, height:420 }); }
  ok(!t.errs.length, `${width} 콘솔 에러 ${JSON.stringify(t.errs)}`);
  await t.b.close();
}
function weekKey0(){ return W; }
console.log(shots.join('\n'));
console.log(fail.length ? `실패 ${fail.length}: ${fail.join(' / ')}` : '✅ 라이벌 모두 통과');
process.exit(fail.length ? 1 : 0);
