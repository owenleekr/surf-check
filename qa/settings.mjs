import { open } from './mock.mjs';
import puppeteer from 'puppeteer-core';
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}]},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1,play:{base:50,bonus:0,badges:{drill1:1},qd:{},qall:0,best:0,gday:'',gxp:0,gn:{},lvSeen:1,xp:50,lv:1}}},{wait:2500});
// 진동 호출을 센다 (헤드리스는 진동이 없으니 원본 자리에 가짜를 심고, 앱의 가로채기를 거치게 다시 감싼다)
await t.S(()=>{ window.__v=0; const fake=()=>{ window.__v++; return true; }; Object.defineProperty(navigator,'vibrate',{value:fake,configurable:true,writable:true});
  // 앱이 이미 가로챈 함수를 쓰려면 원본 자리에 fake 를 두고 같은 래퍼를 다시 적용
  const raw=fake; navigator.vibrate=p=>{ try{ return localStorage.getItem('lineup.share.haptic')==='0' ? false : raw(p); }catch(e){ return raw(p); } }; });
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); document.getElementById('t-play').click(); }); await t.sleep(700);
console.log('설정 줄', await t.S(()=>[...document.querySelectorAll('.hubset button')].map(b=>b.textContent.replace(/\s+/g,' ').trim())));
const n0=await t.S(()=>{ navigator.vibrate(10); return window.__v; });
await t.S(()=>document.querySelector('[data-set="haptic"]').click()); await t.sleep(300);
const after=await t.S(()=>({ 저장:localStorage.getItem('lineup.share.haptic'), 토스트:document.getElementById('toast').textContent, 버튼:document.querySelector('[data-set="haptic"]').textContent.replace(/\s+/g,' ').trim() }));
const v1=await t.S(()=>window.__v); await t.S(()=>{ navigator.vibrate(10); navigator.vibrate(10); }); const v2=await t.S(()=>window.__v);
console.log('진동 끈 뒤', JSON.stringify(after), '| 끄기 후 호출이 실제 진동이 됐나', v2-v1, '(0이어야 함)');
await t.S(()=>document.querySelector('[data-set="haptic"]').click()); await t.sleep(300);
console.log('다시 켬', await t.S(()=>localStorage.getItem('lineup.share.haptic')), '| 켠 직후 진동', await t.S(()=>window.__v)>v2);
// 소리 설정 → 게임에 반영
await t.S(()=>document.querySelector('[data-set="sound"]').click()); await t.sleep(200);
await t.S(()=>document.querySelector('[data-hub="game"]').click()); await t.sleep(400);
console.log('게임 소리 버튼', await t.S(()=>document.getElementById('g-snd').textContent), '(🔊이어야 함)');
console.log('errs',t.errs); await t.b.close(); process.exit(0);
