/* 전체 화면 둘러보기 — 탭마다 전체 길이 캡처(/tmp/t2-*.png) + 콘솔 오류·요청 수·가로 넘침 */
import { open } from './mock.mjs';
import fs from 'fs';
const snap = (await import('../api/_naver-snapshot.js')).default;
const fc = JSON.parse(fs.readFileSync(new URL('./fixture-forecast.json', import.meta.url)));
fc.days.forEach((d, i)=>{ d.day = new Date(Date.now() + i * 864e5 - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10); });   // 예보는 오늘부터 — 지난 날은 앱이 버린다
const bus = u => ({ fetched:new Date().toISOString(), buses:[{ t:'23:50', co:'금강고속', dur:'2:40', grade:'일반', fare:21600, left:0, total:41 }, { t:'23:55', co:'동해상사고속', grade:'우등', left:12, total:28 }] });
const t = await open({ surfers:[{ id:'u4', name:'이성현', cohort:'6기', profile:{} }, { id:'u0', name:'김도훈', cohort:'6기', profile:{ play:{ xp:200, best:300 } } }], __naver:{ folders:snap.folders }, __fc:fc, __bus:bus }, { id:'u4', name:'이성현', profile:{ gender:'f', birth:'1', dressed:1, hair:'bob', hairc:'n', play:{ base:50,bonus:0,badges:{drill1:1},qd:{},qall:0,best:420,gday:'',gxp:0,gn:{},lvSeen:1 } } }, { wait:3500 });
let reqs = 0; t.p.on('request', ()=>reqs++);
await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); localStorage.setItem('lineup.share.upd','u1015e'); });
const out = {};
for(const tab of ['home','food','spot','play','cam','ride','bolt','stay','town']){
  await t.S(tb=>{ if(tb === 'spot') foodOpen('spot'); else setTab(tb); window.scrollTo(0,0); }, tab); await t.sleep(1200);
  await t.S(()=>{ while(!document.getElementById('pop').hidden) popClose(); });
  out[tab] = await t.S(()=>({ 높이:document.documentElement.scrollHeight, 넘침:document.documentElement.scrollWidth - innerWidth }));
  fs.writeFileSync(`/tmp/t2-${tab}.png`, await t.p.screenshot({ fullPage:true }));
}
await t.S(()=>document.getElementById('t-more').click()); await t.sleep(200); fs.writeFileSync('/tmp/t2-more.png', await t.p.screenshot());
console.log(JSON.stringify(out)); console.log('요청 수(둘러보는 동안)', reqs, '| errs', t.errs);
await t.b.close(); process.exit(0);
