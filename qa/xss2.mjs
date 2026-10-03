import { open, dfw } from './mock.mjs';
const d=n=>dfw(n);
const base={cohort:'6기',profile:{},date_from:d(1),date_to:d(3),capacity:4,guests:[],created_at:new Date().toISOString(),lat:38.1,lon:128.6};
const stays=[{...base,id:'s1',user_id:'u1',name:'가',place:'JS링크숙소',url:'javascript:window.__x=1'},
  {...base,id:'s2',user_id:'u1',name:'나',place:'따옴표숙소',url:'https://map.naver.com/p/x?c=1" onmouseover="window.__y=1" x="'},
  {...base,id:'s3',user_id:'u1',name:'다',place:'정상숙소',url:'https://map.naver.com/p/entry/place/123?c=128.6,38.1'},
  {...base,id:'s4',user_id:'u1',name:'라',place:'데이터링크',url:'data:text/html,<script>window.__z=1</script>'}];
const stay_reviews=[{id:'v1',user_id:'u1',name:'공격',place:'정상숙소',stars:'<img src=x onerror=window.__w=1>',good:[],text:'후기',profile:{},created_at:new Date().toISOString(),paid:null}];
const places=[{id:'pp',name:'정보판장소',kind:'호텔',lat:38.1,lon:128.6,perks:[],note:'',url:'javascript:window.__q=1',updated_name:'x',updated_at:new Date().toISOString()}];
const t=await open({stays,stay_reviews,places,surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}]},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1'}},{wait:2500});
await t.S(()=>{ if(!document.getElementById('pop').hidden) popClose(); });
await t.S(()=>setTab('stay')); await t.sleep(1200);
const hrefs=await t.S(()=>[...document.querySelectorAll('#pane-stay a[href]')].map(a=>a.getAttribute('href')));
console.log('숙소 탭 링크:'); hrefs.forEach(h=>console.log('  ', h.slice(0,90)));
console.log('javascript:/data: 로 시작하는 링크', hrefs.filter(h=>/^(javascript|data):/i.test(h)).length);
// 눌러보기 (새 창은 막혀 있어도 JS 실행 여부는 확인 가능)
await t.S(()=>{ document.querySelectorAll('#pane-stay a[href]').forEach(a=>{ a.removeAttribute('target'); a.addEventListener('click',e=>e.preventDefault(),{once:true}); a.click(); }); });
await t.S(()=>{ document.querySelectorAll('#pane-stay *').forEach(e=>e.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}))); });
console.log('실행된 주입', await t.S(()=>({x:window.__x||0,y:window.__y||0,z:window.__z||0,w:window.__w||0,q:window.__q||0})));
console.log('별점 표시', await t.S(()=>[...document.querySelectorAll('#pane-stay .meta, #pane-stay b')].map(e=>e.textContent).filter(x=>x.includes('★')).slice(0,3)));
console.log('errs',t.errs); await t.b.close();
