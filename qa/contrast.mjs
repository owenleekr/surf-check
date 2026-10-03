import { open, dfw, iso } from './mock.mjs';
const NM=['김도훈','김태은','박초롱','이성현'];
const surfers=NM.map((n,i)=>({id:'u'+i,name:n,cohort:'6기',profile:{gender:'f',play:{xp:100*i,lv:i,best:50*i}}}));
const drills=[0,1,2].map(n=>({user_id:'u3',name:'이성현',day:iso(n)}));
const rides=[{id:'r1',user_id:'u0',name:'김도훈',cohort:'6기',profile:{},date:dfw(2),dir:'go',depart_at:'06:00',from_place:'별내역',to_place:'인구리',seats:3,riders:[],note:'기름값',created_at:new Date().toISOString()}];
const stays=[{id:'s1',user_id:'u1',name:'김태은',cohort:'6기',profile:{},place:'양양비치콘도',date_from:dfw(1),date_to:dfw(3),capacity:4,guests:[],lat:38.10852,lon:128.6413,price:'1인 3만',created_at:new Date().toISOString()}];
const parties=[{id:'p1',user_id:'u3',name:'이성현',date:dfw(0),beach:'인구',time:'23:00',note:'야간',joins:[{id:'u3',name:'이성현',profile:{}}],created_at:new Date().toISOString()}];
const t=await open({surfers,drills,rides,stays,parties},{id:'u3',name:'이성현',profile:{gender:'f',birth:'1'}});
await t.S(()=>{ document.getElementById('pop').hidden=true; });
const probe = () => t.S(()=>{
  const lum=c=>{ const m=c.match(/[\d.]+/g).map(Number); const f=m.slice(0,3).map(v=>{v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);}); return .2126*f[0]+.7152*f[1]+.0722*f[2]; };
  const bgOf=e=>{ while(e){ const c=getComputedStyle(e).backgroundColor; const a=(c.match(/[\d.]+/g)||[])[3]; if(c && c!=='rgba(0, 0, 0, 0)' && c!=='transparent' && (a===undefined||+a>0.6)) return c; e=e.parentElement; } return 'rgb(255,255,255)'; };
  const bad={};
  document.querySelectorAll('#main *').forEach(e=>{
    if(!e.offsetParent) return; if(e.closest('canvas,.vp,.village,#cam-cover,.camwrap,.game')) return;
    if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())) return;
    const s=getComputedStyle(e), fg=s.color; if(s.opacity<1) return;
    const bg=bgOf(e); const L1=lum(fg), L2=lum(bg); const r=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
    const fs=parseFloat(s.fontSize), bold=+s.fontWeight>=700; const need=(fs>=18.66||(fs>=14&&bold))?3:4.5;
    if(r<need){ const k=fg+' on '+bg+' '+r.toFixed(2)+'<'+need; (bad[k] ||= []).push(e.textContent.trim().slice(0,14)); } });
  return Object.entries(bad).map(([k,v])=>k+' → '+[...new Set(v)].slice(0,4).join(' | ')); });
for(const tab of ['home','ride','stay','bolt','town','cam']){
  await t.S(tb=>document.getElementById('t-'+tb).click(), tab); await t.sleep(800);
  const r=await probe(); console.log('■',tab, r.length?'\n   '+r.join('\n   '):'OK');
}
await t.S(()=>{ setTab('home'); openPlay(); }); await t.sleep(500);
const sheet = await t.S(()=>{ const lum=c=>{ const m=c.match(/[\d.]+/g).map(Number); const f=m.slice(0,3).map(v=>{v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);}); return .2126*f[0]+.7152*f[1]+.0722*f[2]; };
  const bad=[]; document.querySelectorAll('.sheet-in *').forEach(e=>{ if(!e.offsetParent) return; if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())) return;
    let bg='rgb(255,255,255)', x=e; while(x){ const c=getComputedStyle(x).backgroundColor; if(c!=='rgba(0, 0, 0, 0)'){ bg=c; break; } x=x.parentElement; }
    const s=getComputedStyle(e); const L1=lum(s.color), L2=lum(bg); const r=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05); const fs=parseFloat(s.fontSize); const need=(fs>=18.66||(fs>=14&&+s.fontWeight>=700))?3:4.5;
    if(r<need) bad.push(s.color+' on '+bg+' '+r.toFixed(2)+' → '+e.textContent.trim().slice(0,14)); }); return [...new Set(bad)].slice(0,8); });
console.log('■ 도감', sheet.length?'\n   '+sheet.join('\n   '):'OK');
console.log('errs',t.errs); await t.b.close();
