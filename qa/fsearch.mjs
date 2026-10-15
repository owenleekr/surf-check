/* 맛집·스팟 찾기 — 이름·메뉴·종류로 걸리고, 치는 동안 칸이 끊기지 않는다 */
import { open } from './mock.mjs';
const snap = (await import('../api/_naver-snapshot.js')).default;
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}], __naver:{ folders:snap.folders }},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1,play:{base:50,bonus:0,badges:{},qd:{},qall:0,best:0,gday:'',gxp:0,gn:{},lvSeen:1}}},{wait:3000});
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); setTab('food'); }); await t.sleep(700);
const n0 = await t.S(()=>document.querySelectorAll('.food-card').length);
await t.p.click('[data-fq="food"]'); await t.p.keyboard.type('곱창', { delay:60 }); await t.sleep(500);
const r1 = await t.S(()=>({ n:document.querySelectorAll('.food-card').length, names:[...document.querySelectorAll('.food-card .hd b')].map(b=>b.textContent), focus:document.activeElement?.dataset?.fq, v:document.activeElement?.value }));
await t.p.keyboard.press('Backspace'); await t.p.keyboard.press('Backspace'); await t.p.keyboard.type('없는가게zz', { delay:30 }); await t.sleep(500);
const r2 = await t.S(()=>document.querySelector('#food-body .empty')?.textContent);
await t.S(()=>{ const i=document.querySelector('[data-fq="food"]'); i.value='<img src=x onerror=window.__f=1>'; i.dispatchEvent(new Event('input',{bubbles:true})); }); await t.sleep(500);
console.log({ 전체:n0, 곱창:r1, 없음:r2, 주입:await t.S(()=>window.__f||0) }, t.errs); await t.b.close(); process.exit(0);
