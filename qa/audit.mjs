import { open, dfw, iso } from './mock.mjs';
const NM=['김도훈','김태은','박초롱','심재영','이성현','이한솔','이해룡','장은옥','전영훈','김나리','이미진','이승대','홍미영'];
const surfers=NM.map((n,i)=>({id:'u'+i,name:n,cohort:'6기',profile:{gender:i%2?'f':'m',play:i%2?{xp:50+i*30,lv:i%5,best:30*i}:undefined}}));
const drills=[]; [0,1,2].forEach(n=>drills.push({user_id:'u4',name:'이성현',day:iso(n)})); [0,1,4].forEach(n=>drills.push({user_id:'u0',name:'김도훈',day:iso(n)}));
const rides=[{id:'r1',user_id:'u0',name:'김도훈',cohort:'6기',profile:{},date:dfw(2),dir:'go',depart_at:'06:00',from_place:'별내역, 잠실역',to_place:'인구리',seats:3,riders:[],note:'기름값 1/n',created_at:new Date().toISOString()}];
const stays=[{id:'s1',user_id:'u1',name:'김태은',cohort:'6기',profile:{},place:'양양비치콘도',date_from:dfw(1),date_to:dfw(3),capacity:4,guests:[],lat:38.10852,lon:128.6413,price:'1인 3만',created_at:new Date().toISOString()}];
const parties=[{id:'p1',user_id:'u4',name:'이성현',date:dfw(0),beach:'인구',time:'23:00',note:'야간',joins:[{id:'u4',name:'이성현',profile:{}}],created_at:new Date().toISOString()}];
for(const W of [390,320]){
  const t=await open({surfers,drills,rides,stays,parties},{id:'u4',name:'이성현',profile:{gender:'m',birth:'1'}},{width:W});
  await t.S(()=>{ document.getElementById('pop').hidden=true; });
  for(const tab of ['home','ride','stay','bolt','town','play','cam']){
    await t.S(tb=>document.getElementById('t-'+tb).click(), tab); await t.sleep(900);
    const o=await t.S(()=>{ const out={작은글씨:{},작은터치:[],넘침:[]}; const Wd=document.documentElement.clientWidth;
      document.querySelectorAll('#main *').forEach(e=>{ if(!e.offsetParent) return; const r=e.getBoundingClientRect(); if(!r.width) return;
        const txt=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()); const fs=parseFloat(getComputedStyle(e).fontSize);
        if(txt&&fs<12&&!e.closest('.vp')){ (out.작은글씨[fs+'px'] ||= []).push((e.className||e.tagName)+'“'+e.textContent.trim().slice(0,10)+'”'); }
        if(['BUTTON','A','INPUT','SELECT'].includes(e.tagName)&&r.height>0&&r.height<40&&!e.closest('.vp')) out.작은터치.push((e.textContent||e.id).trim().slice(0,12)+':'+Math.round(r.height));
        if(r.right>Wd+1||r.left<-1) out.넘침.push(e.tagName+'.'+(typeof e.className==='string'?e.className.split(' ')[0]:'')); });
      for(const k in out.작은글씨) out.작은글씨[k]=[...new Set(out.작은글씨[k])].slice(0,3); out.작은터치=[...new Set(out.작은터치)].slice(0,6); out.넘침=[...new Set(out.넘침)]; return out; });
    const bad = Object.keys(o.작은글씨).length||o.작은터치.length||o.넘침.length;
    console.log(W, tab, bad? JSON.stringify(o):'OK');
  }
  // 시트·게임 폭 검사
  await t.S(()=>{ setTab('home'); openPlay(); }); await t.sleep(600);
  console.log(W,'도감 넘침', await t.S(()=>{ const sh=document.querySelector('.sheet-in'); return sh.scrollWidth-sh.clientWidth; }), '작은터치', JSON.stringify(await t.S(()=>[...document.querySelectorAll('.sheet-in button')].filter(b=>b.getBoundingClientRect().height<40&&b.offsetParent).map(b=>b.textContent.trim().slice(0,8)+':'+Math.round(b.getBoundingClientRect().height)))));
  await t.S(()=>{ closePlay(); gameOpen(); }); await t.sleep(500);
  console.log(W,'게임 캔버스', await t.S(()=>{ const c=document.getElementById('g-cv').getBoundingClientRect(); return Math.round(c.width)+'x'+Math.round(c.height)+' 화면내='+(c.bottom<=innerHeight); }));
  console.log(W,'errs',t.errs); await t.b.close();
}
