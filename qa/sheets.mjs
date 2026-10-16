/* 창 점검 — 시트마다 열어 가로 넘침 · 닫기 버튼 보임 · 맨 아래 내용이 화면 안에 들어오는지(스크롤 가능) */
import { open } from './mock.mjs';
import fs from 'fs';
const fc = JSON.parse(fs.readFileSync(new URL('./fixture-forecast.json', import.meta.url)));
fc.days.forEach((d, i)=>{ d.day = new Date(Date.now() + i * 864e5 - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10); });   // 예보는 오늘부터 — 지난 날은 앱이 버린다
const snap = (await import('../api/_naver-snapshot.js')).default;
for(const W of [320, 390]){
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}], __fc:fc, __naver:{ folders:snap.folders }},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1,play:{base:50,bonus:0,badges:{log1:1},qd:{},qall:0,best:0,gday:'',gxp:0,gn:{},lvSeen:1,shells:50,spent:0,own:{},log:[{id:'a',d:'2026-10-14',s:'낙산',m:60,w:2,f:2}]}}},{width:W,wait:3500});
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); });
const OPEN = { more:()=>document.getElementById('t-more').click(), shop:()=>shopOpen(), slog:()=>surfLogOpen(), slall:()=>{ setTab('home'); surfLogRender(); document.querySelector('[data-slall]')?.click(); },
  wave:()=>waveDetail(0), upd:()=>updOpen?.(), mail:()=>document.getElementById('mail').click(), collect:()=>openPlay('collect'), rank:()=>openPlay('rank'), guide:()=>{ setTab('food'); document.querySelector('[data-foodguide], .food-guide-btn, [data-guide]')?.click(); } };
const out = {};
for(const [k, f] of Object.entries(OPEN)){
  await t.S(()=>{ document.querySelectorAll('.sheet').forEach(s=>s.hidden = true); }); await t.sleep(100);
  try{ await t.p.evaluate(f); }catch(e){ out[k] = 'open-fail'; continue; } await t.sleep(500);
  out[k] = await t.S(()=>{ const sh = [...document.querySelectorAll('.sheet')].find(s=>!s.hidden); if(!sh) return '열리지 않음';
    const inn = sh.querySelector('.sheet-in'), r = inn.getBoundingClientRect(), hd = sh.querySelector('.sheet-hd button')?.getBoundingClientRect();
    return { 넘침:inn.scrollWidth - inn.clientWidth, 닫기보임:!!hd && hd.top >= 0 && hd.bottom <= innerHeight, 높이:Math.round(r.height), 화면:innerHeight, 위:Math.round(r.top), 스크롤:inn.scrollHeight > inn.clientHeight ? getComputedStyle(inn).overflowY : '-' }; });
}
console.log(W, JSON.stringify(out)); console.log('errs', t.errs); await t.b.close(); }
process.exit(0);
