/* 서프스케이트 훈련 — 메뉴 → 드릴 → 완벽한 타이밍(노란 칸만 누름) vs 엉망(계속 누름) → 결과·코칭·실제로 탔어요 */
import { open } from './mock.mjs';
import fs from 'fs';
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }] }, { id:'u4', name:'테스터', profile:{ gender:'f', birth:'1', dressed:1 } }, { wait:2500 });
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); setTab('play'); }); await t.sleep(500);
console.log('놀이 카드', await t.S(()=>document.querySelector('[data-hub="skate"]')?.textContent.replace(/\s+/g,' ').trim()));
await t.S(()=>document.querySelector('[data-hub="skate"]').click()); await t.sleep(400);
console.log('메뉴', await t.S(()=>[...document.querySelectorAll('.sk-dr b')].map(b=>b.textContent)));
fs.writeFileSync('/tmp/sk-menu.png', await t.p.screenshot());
const run = (kind, mode)=>t.S((kind, mode)=>{ const g=_skate; g.start(kind); const G=g.G; let n=0;
  while(!G.done && n++ < 60*120){ const seg=G.segs[G.i]; g.held = mode==='perfect' ? !!(seg && G.s >= seg.w0 && G.s <= seg.w1) : mode==='hold'; g.step(g.FIX); }
  return { 끝:G.done, 정확도:Math.round(G.segs.filter(s=>s.q!=null).reduce((a,s)=>a+s.q,0)/Math.max(1,G.segs.filter(s=>s.q!=null).length)*100), 최고속도:Math.round(G.maxV), 턴:G.segs.filter(s=>s.q!=null).length+'/'+G.segs.length }; }, kind, mode);
for(const k of ['pump','bottom','cut','flow']) console.log(k, '완벽', JSON.stringify(await run(k,'perfect')), '| 계속 누름', JSON.stringify(await run(k,'hold')), '| 안 누름', JSON.stringify(await run(k,'none')));
await run('bottom','perfect'); await t.sleep(300);
console.log('결과', await t.S(()=>({ 제목:document.querySelector('#k-ov .go-t').textContent, 칸:[...document.querySelectorAll('#k-ov .go-st span')].map(s=>s.textContent), 팁:document.querySelectorAll('#k-ov .sk-tip li').length, 다음:document.getElementById('k-next')?.textContent })));
fs.writeFileSync('/tmp/sk-result.png', await t.p.screenshot());
await t.S(()=>document.getElementById('k-real').click()); await t.sleep(200);
console.log('실제로 탔어요', await t.S(()=>({ 버튼:document.getElementById('k-real').textContent, 기록:ME.profile.play.sk })));
// 실제 루프로 몇 초 — 렌더 오류 확인 + 캡처
await t.S(()=>_skate.start('flow')); await t.sleep(1800); fs.writeFileSync('/tmp/sk-run.png', await t.p.screenshot());
// 연속 글자(🔥 N연속)와 코스 위 턴 이름표가 겹치지 않는지 — 실제로 그려진 글자 위치를 모아 상자끼리 비교
const ov = await t.S(async ()=>{ const g = _skate; g.start('flow'); const G = g.G, cx = document.querySelector('#skate canvas').getContext('2d');
  const perfect = n => { for(let i = 0; i < n && !G.done; i++){ const seg = G.segs[G.i]; g.held = !!(seg && G.s >= seg.w0 && G.s <= seg.w1); g.step(g.FIX); } };
  perfect(60 * 12); while(G.stk < 2 && !G.done) perfect(10); G.paused = true;
  const f0 = cx.fillText, rec = []; cx.fillText = function(t, x, y){ rec.push({ t:String(t), x, y, w:this.measureText(t).width }); return f0.apply(this, arguments); };
  const box = r => [r.x - 3, r.y - 2, r.x + r.w + 3, r.y + 13], hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const LABS = new Set(['꾹', '탑턴', '바텀턴', '컷백']); let frames = 0, both = 0, near = 0, hits = 0;
  for(let k = 0; k < 120 && !G.done; k++){ perfect(3); rec.length = 0; await new Promise(r=>requestAnimationFrame(r)); await new Promise(r=>requestAnimationFrame(r));
    const st = rec.filter(r=>/연속/.test(r.t)), lb = rec.filter(r=>LABS.has(r.t)); frames++;
    if(st.length && lb.length){ both++; if(lb.some(l=>l.y < 60)) near++; if(lb.some(l=>st.some(s=>hit(box(s), box(l))))) hits++; } }
  cx.fillText = f0; G.paused = false; return { frames, both, near, hits, stk:G.stk }; });
console.log('연속 글자 vs 턴 이름표', JSON.stringify(ov));
const bad = []; if(!(ov.both > 10 && ov.hits === 0)) bad.push('연속 글자와 이름표 겹침');
await t.S(()=>skateClose()); await t.sleep(200);
console.log('닫힘', await t.S(()=>document.getElementById('skate').hidden), '| errs', t.errs, '| bad', bad);
await t.b.close(); process.exit(bad.length || t.errs.length ? 1 : 0);
