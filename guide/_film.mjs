/* 사용 설명 영상 생성기 — 실제 앱을 헤드리스 크롬으로 돌려 프레임을 찍고 ffmpeg으로 묶는다.
   화면 녹화를 손으로 다시 뜨면 UI를 고칠 때마다 영상이 낡는다. 스크립트로 두면 다시 돌리면 된다.

   실행:  node guide/_film.mjs            (preview.sh 가 8765 포트로 떠 있어야 함)
   산출:  guide/howto.mp4 · guide/howto.jpg(포스터)

   자막은 페이지에 DOM으로 얹는다 — ffmpeg drawtext는 한글 폰트 경로를 타서 잘 깨진다. */
import puppeteer from 'puppeteer-core';
import { mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const APP = process.env.URL || 'http://localhost:8765/index.html';   // 전역 URL을 가리지 않게
const TMP = '/tmp/surf-film';
const FPS = 10;
rmSync(TMP, { recursive:true, force:true }); mkdirSync(TMP, { recursive:true });

const PROFILE = { gender:'f', board:'long', role:'member', cls:'beginner', top:'r', hat:'none', bottom:'b',
  boardc:'y', hair:'bob', hairc:'k', skin:'s', face:'smile', wear:'rash', pet:'dog', petc:'o', home:'naksan' };
const DATA = { onboarded:true, attend:{1:['2026-09-05','2026-09-06'],2:['2026-09-12','2026-09-13']},
  skills:{'1-0':true,'1-1':true,'2-0':true}, missions:{1:true}, notes:{}, logs:3,
  sessions:{}, lvl:{1:true,2:true}, xp:180 };

const b = await puppeteer.launch({ executablePath:CHROME, headless:'new',
  defaultViewport:{ width:390, height:780, deviceScaleFactor:2 } });
const p = await b.newPage();
await p.goto(APP, { waitUntil:'domcontentloaded' });
await p.evaluate((P,D)=>{ localStorage.clear();
  localStorage.setItem('surf.users', JSON.stringify({ zz_film:{ name:'김서퍼', cohort:'6기', salt:'x', hash:'y', profile:P } }));
  localStorage.setItem('surf.session', JSON.stringify('zz_film'));
  localStorage.setItem('surf.data.zz_film', JSON.stringify(D)); }, PROFILE, DATA);
await p.goto(APP, { waitUntil:'networkidle2' });
await new Promise(r=>setTimeout(r,7000));

// 자막 띠
await p.evaluate(()=>{
  const d = document.createElement('div'); d.id = '__cap';
  d.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:999;background:rgba(27,27,47,.94);color:#FFF9E6;'
    + 'font:700 15px/1.45 inherit;padding:12px 14px calc(12px + env(safe-area-inset-bottom,0px));text-align:center;'
    + 'border-top:4px solid #FFD23F;white-space:pre-line;min-height:1.45em';
  document.body.appendChild(d);
});
const cap = t => p.evaluate(x=>{ document.getElementById('__cap').textContent = x; }, t);

let f = 0;
const shot = async () => { await p.screenshot({ path:`${TMP}/${String(f++).padStart(5,'0')}.png` }); };
/* sec초 동안 프레임을 찍는다. 그 사이 화면은 계속 움직인다(애니메이션·스크롤) */
const hold = async (sec) => { const n = Math.round(sec*FPS); for(let i=0;i<n;i++){ await shot(); await new Promise(r=>setTimeout(r, 1000/FPS)); } };
const scrollTo = async (sel, sec=1.2) => {
  await p.evaluate(s=>{ const e=document.querySelector(s); if(e) e.scrollIntoView({block:'center',behavior:'smooth'}); }, sel);
  await hold(sec);
};
const tab = async (t, sec=1.0) => { await p.evaluate(x=>showTab(x), t); await p.evaluate(()=>window.scrollTo(0,0)); await hold(sec); };
const click = async (sel) => { await p.evaluate(s=>document.querySelector(s)?.click(), sel); };

// ── 장면 ─────────────────────────────────────────────
await cap('라인업 — 양양서핑학교 6기');            await hold(1.6);
await cap('① 아침: 오늘 파도부터 본다');            await tab('wave', 1.4);
await cap('해변을 고르면 파고·주기·바람·물때가\n한 장으로 나옵니다');  await scrollTo('.hero', 2.2);
await cap('"오늘의 기준 잡기"를 읽고 체크 —\n아침 루틴은 이거 하나');  await scrollTo('#basis', 1.4);
await click('#basis-ck');                          await hold(1.6);
await cap('② 물에서 나오면: 세션을 센다');           await scrollTo('#sess', 1.2);
await click('#sess-btns [data-ride="a"]');          await hold(0.7);
await click('#sess-btns [data-ride="p"]');          await hold(0.7);
await click('#sess-btns [data-ride="t"]');          await hold(1.6);
await cap('오늘 파도에 ★별점 —\n쌓이면 차트가 실제로 몇 점인지 알게 됩니다'); await scrollTo('#stars', 2.2);
await cap('③ 수업 탭: 이번 주 카드 하나만');          await tab('mission', 1.6);
await scrollTo('#weeks .week', 2.2);
await cap('④ 성장 탭: 코치님 말씀이 주제별로');       await tab('growth', 1.8);
await cap('기준 자세 — 무릎이 모이나, 벌어지나');     await scrollTo('#pose figure', 2.6);
await cap('수업 영상을 올리면 무릎·중심을\n자동으로 재서 주차별로 비교합니다'); await hold(2.2);
await cap('⑤ 나 탭: 캐릭터와 레벨');                await tab('level', 1.6);
await scrollTo('.builder', 2.2);
await cap('⑥ 마을 탭: 6기가 낙산 앞에');            await tab('rank', 1.6);
await scrollTo('#village', 2.4);
await cap('⑦ 장비 탭: 오늘 수온이면 뭘 입지');       await tab('gear', 1.6);
await scrollTo('#gear-today', 2.2);
await cap('오늘 파도 어때?\nsurf.owenai.xyz');       await tab('wave', 2.4);

await b.close();
console.log('프레임', f, '장 →', (f/FPS).toFixed(1), '초');

// ── 인코딩 ───────────────────────────────────────────
const HERE = new URL('.', import.meta.url).pathname;
const OUT = HERE + 'howto.mp4', POSTER = HERE + 'howto.jpg';
execFileSync('ffmpeg', ['-y','-loglevel','error','-framerate',String(FPS),'-i',`${TMP}/%05d.png`,
  '-vf','scale=540:-2:flags=lanczos','-c:v','libx264','-preset','slow','-crf','30',
  '-pix_fmt','yuv420p','-movflags','+faststart', OUT], { stdio:'inherit' });
execFileSync('ffmpeg', ['-y','-loglevel','error','-i',OUT,'-ss','1.5','-frames:v','1',
  '-vf','scale=540:-2','-q:v','4', POSTER], { stdio:'inherit' });
console.log('완성:', OUT);
