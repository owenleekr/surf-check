import { open } from './mock.mjs';
import fs from 'fs';
const t=await open({surfers:[{id:'u4',name:'이성현',cohort:'6기',profile:{}}]},{id:'u4',name:'이성현',profile:{gender:'f',birth:'1',dressed:1}},{wait:2000});
const out=await t.S(()=>{ const looks=[{gender:'f',hair:'bob',hairc:'k',skin:'s',face:'smile',wear:'rash',top:'r'},{gender:'m',hair:'short',hairc:'n',skin:'d',face:'happy',wear:'hood',top:'b'},{gender:'f',hair:'long',hairc:'y',skin:'l',face:'wink',wear:'tank',top:'g'},{gender:'m',hair:'spike',hairc:'k',skin:'t',face:'cool',wear:'suit',top:'k'},{gender:'f',hair:'bun',hairc:'r',skin:'s',face:'wow',wear:'rash',top:'p'},{gender:'m',hair:'curly',hairc:'w',skin:'l',face:'smile',wear:'bare',top:'o'}];
  const c=document.createElement('canvas'); c.width=24*6*8+70; c.height=24*8+10; const g=c.getContext('2d'); g.fillStyle='#8FD3FF'; g.fillRect(0,0,c.width,c.height); g.imageSmoothingEnabled=false;
  looks.forEach((lk,i)=>{ const q=withLook({board:'long',boardc:'y',bottom:'b',...lk},'x'+i); const cv=document.createElement('canvas'); drawSpr(cv,avatarRows(q,false),avatarTintOf(q,0)); g.drawImage(cv,i*(24*8+10)+5,5,cv.width*8,cv.height*8); });
  return { url:c.toDataURL('image/png'), w:c.width, h:c.height, keys:{hair:Object.keys(HAIR),face:Object.keys(FACE),wear:Object.keys(WEAR)} }; });
fs.writeFileSync('/tmp/chars.png', Buffer.from(out.url.split(',')[1],'base64')); console.log(out.w,out.h,JSON.stringify(out.keys));
await t.b.close(); process.exit(0);
