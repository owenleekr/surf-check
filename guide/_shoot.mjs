import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://localhost:8765/index.html';
const OUT = process.argv[2] || '/Users/owen/Desktop/surf-check/guide';
mkdirSync(OUT, { recursive: true });

const DEMO_ID = 'zz_guide';
const PROFILE = { hair:'pony', hairc:'n', skin:'s', face:'happy', wear:'hood', top:'g', bottom:'b',
  board:'long', boardc:'c', hat:'none', pet:'rabbit', petc:'p', petLv:1, cls:'beginner', role:'member', home:'naksan' };
const DATA = { onboarded:true, attend:{1:['2026-09-06','2026-09-07'],2:['2026-09-13','2026-09-14'],3:['2026-09-20']},
  skills:{}, missions:{}, notes:{}, logs:2,
  sessions:{'2026-09-20':{t:4,a:9,p:6,l:0,r:0,w:3}}, lvl:{} };

const seed = (loggedIn) => `
  localStorage.setItem('surf.users', JSON.stringify({ ${JSON.stringify(DEMO_ID)}: { name:'나리', cohort:'6기', salt:'x', hash:'y', profile:${JSON.stringify(PROFILE)} } }));
  localStorage.setItem('surf.data.${DEMO_ID}', ${JSON.stringify(JSON.stringify(DATA))});
  ${loggedIn ? `localStorage.setItem('surf.session', ${JSON.stringify(JSON.stringify(DEMO_ID))});` : `localStorage.removeItem('surf.session');`}
`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

const SHOTS = [
  { f:'01-login.png',        login:false, sel:null,  full:false },
  { f:'02-signup.png',       login:false, before:`document.getElementById('m-new').click();`, sel:null },
  { f:'03-onb-character.png',login:true,  before:`onbStart();`, wait:1200, sel:'.onb .dlg' },
  { f:'04-onb-tour.png',     login:true,  before:`onbStart(); for(let i=0;i<4;i++) document.getElementById('onb-next').click();`, wait:1400, sel:'.onb .dlg' },
  { f:'05-wave-top.png',     login:true,  tab:'wave',   sel:null },
  { f:'06-basis.png',        login:true,  tab:'wave',   sel:'#basis' },
  { f:'07-reco.png',         login:true,  tab:'wave',   sel:'#reco' },
  { f:'08-cam-verdict.png',  login:true,  tab:'wave',   sel:'.camwrap' },
  { f:'09-period-slots.png', login:true,  tab:'wave',   sel:'#slots' },
  { f:'10-session-rating.png',login:true, tab:'wave',   sel:'#sess' },
  { f:'11-source-chart.png', login:true,  tab:'wave',   sel:'#chart' },
  { f:'12-checklist.png',    login:true,  tab:'wave',   sel:'#checks' },
  { f:'13-class.png',        login:true,  tab:'mission',sel:'#thisweek' },
  { f:'14-weeks.png',        login:true,  tab:'mission',sel:'#weeks' },
  { f:'15-says.png',         login:true,  tab:'growth', sel:'#says' },
  { f:'16-tko.png',          login:true,  tab:'growth', sel:'#tko' },
  { f:'17-pose.png',         login:true,  tab:'growth', sel:'#pose' },
  { f:'18-me.png',           login:true,  tab:'level',  sel:null },
  { f:'19-builder.png',      login:true,  tab:'level',  sel:'.builder' },
  { f:'20-pet.png',          login:true,  tab:'level',  sel:'#petcard' },
  { f:'21-leveltable.png',   login:true,  tab:'level',  sel:'#slv' },
  { f:'22-village.png',      login:true,  tab:'rank',   sel:'#village' },
  { f:'23-chat.png',         login:true,  tab:'rank',   sel:'#chat' },
  { f:'24-gear.png',         login:true,  tab:'gear',   sel:null },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', defaultViewport:{ width:390, height:844, deviceScaleFactor:2 } });
const page = await browser.newPage();
await page.goto(BASE, { waitUntil:'domcontentloaded' });

const done = [], missing = [];
for(const s of SHOTS){
  await page.evaluate(seed(s.login));
  await page.goto(BASE, { waitUntil:'networkidle2' });
  await sleep(s.login ? 3200 : 900);
  if(s.tab){ await page.evaluate(t=>showTab(t), s.tab); await sleep(1800); }
  if(s.before){ await page.evaluate(s.before); }
  await sleep(s.wait || 700);
  try{
    if(s.sel){
      const el = await page.$(s.sel);
      if(!el){ missing.push(s.f + ' (' + s.sel + ')'); continue; }
      await el.scrollIntoView();
      await sleep(400);
      await el.screenshot({ path: `${OUT}/${s.f}` });
    } else {
      await page.evaluate(()=>window.scrollTo(0,0)); await sleep(300);
      await page.screenshot({ path: `${OUT}/${s.f}` });
    }
    done.push(s.f);
  }catch(e){ missing.push(s.f + ' ! ' + e.message.split('\n')[0]); }
}
await browser.close();
console.log('OK   ', done.join(' '));
if(missing.length) console.log('MISS ', missing.join(' | '));
