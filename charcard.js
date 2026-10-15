/* ── 📸 내 캐릭터 카드 ─────────────────────────────────────────────
   꾸민 캐릭터를 세로 카드(1080×1350, 인스타 피드 비율) 한 장으로 — 이름 · 기수 · 레벨 · 이번 달 서핑 · 펫.
   휴대폰이면 공유 시트(카톡·인스타)로, 아니면 그림 파일로 내려받는다. 서버로는 아무것도 보내지 않는다. */
(function(){
const W = 1080, H = 1350;
function load(src){ return new Promise((ok, no)=>{ const im = new Image(); im.onload = ()=>ok(im); im.onerror = no; im.src = src; }); }
function rr(g, x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
async function make(entry){
  if(typeof ME === 'undefined' || !ME || typeof window.mochiSVG !== 'function') return null;
  const pr = withLook(ME.profile || {}, ME.name), pet = !!(PET[pr.pet]);
  const svg = window.mochiSVG(pr, { charm:2, pet, uid:'c' });
  const im = await load('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  /* 하늘 → 바다 → 모래 */
  let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#BFE8FF'); gr.addColorStop(.55, '#E6F6FF'); gr.addColorStop(.56, '#7CC4F2'); gr.addColorStop(.66, '#5AB4EF'); gr.addColorStop(.67, '#F3E2BE'); gr.addColorStop(1, '#EAD3A6');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.75)'; for(let i = 0; i < 9; i++){ g.beginPath(); g.ellipse(80 + i * 120, 742 + (i % 2) * 14, 70, 9, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#FFD86B'; g.beginPath(); g.arc(900, 170, 70, 0, Math.PI * 2); g.fill();
  /* 캐릭터 */
  const ch = entry ? 760 : 860, cw = ch * im.width / im.height, cx = (W - cw) / 2, cy = entry ? 280 : 300;
  g.fillStyle = 'rgba(18,36,95,.16)'; g.beginPath(); g.ellipse(W / 2, cy + ch - 40, cw * .42, 30, 0, 0, Math.PI * 2); g.fill();
  g.drawImage(im, cx, cy, cw, ch);
  /* 이름표 */
  const p = ME.profile?.play || {}, lv = typeof lvOf === 'function' && typeof playXp === 'function' ? lvOf(playXp(p)) : 0;
  const lvT = typeof PLV !== 'undefined' && PLV[lv] ? `Lv.${lv + 1} ${PLV[lv][1]} ${PLV[lv][2]}` : '';
  const mon = new Date().toISOString().slice(0, 7), logs = Array.isArray(p.log) ? p.log.filter(e=>e && String(e.d || '').slice(0, 7) === mon).length : 0;
  g.textAlign = 'center'; g.fillStyle = '#1B1B2F';
  g.font = '800 92px "Apple SD Gothic Neo","Noto Sans KR",sans-serif'; g.fillText(String(ME.name || '').slice(0, 12), W / 2, 150);
  const tags = [ME.cohort && ME.cohort !== 'open' ? `🏄 양양서핑학교 ${ME.cohort}` : '🏄 양양 서퍼', lvT].filter(Boolean);
  g.font = '700 40px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';
  let tw = tags.map(t=>g.measureText(t).width + 56), x = (W - tw.reduce((a, b)=>a + b, 0) - 16 * (tags.length - 1)) / 2;
  tags.forEach((t, i)=>{ rr(g, x, 186, tw[i], 64, 32); g.fillStyle = i ? '#FFD23F' : '#FFFFFF'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#1B1B2F'; g.stroke(); g.fillStyle = '#1B1B2F'; g.fillText(t, x + tw[i] / 2, 232); x += tw[i] + 16; });
  /* 아래 띠 */
  if(entry){
    /* 오늘의 서핑 — 스팟 · 시간 · 탄 파도 · 기분 + 그날 파도 */
    const WV = ['0개', '1~2개', '3~5개', '6~10개', '10개+'], FE = ['😵', '😐', '🙂', '😆'];
    const dd = String(entry.d || ''), md = dd ? `${+dd.slice(5, 7)}.${+dd.slice(8, 10)}` : '';
    rr(g, 60, H - 290, W - 120, 240, 36); g.fillStyle = 'rgba(255,255,255,.94)'; g.fill();
    g.fillStyle = '#1B1B2F'; g.font = '800 54px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';
    g.fillText(`${md} ${String(entry.s || '').slice(0, 10)} ${FE[entry.f] || ''}`, W / 2, H - 218);
    g.font = '700 38px "Apple SD Gothic Neo","Noto Sans KR",sans-serif'; g.fillStyle = '#36405A';
    g.fillText(`${entry.m >= 60 ? (entry.m / 60) + '시간' : entry.m + '분'} · 탄 파도 ${WV[entry.w] || ''}${entry.wx ? ` · 🌊 ${entry.wx.h}m ${entry.wx.p ? entry.wx.p + '초' : ''}` : ''}`, W / 2, H - 160);
    if(entry.t){ g.font = '700 34px "Apple SD Gothic Neo","Noto Sans KR",sans-serif'; g.fillStyle = '#5B6275'; g.fillText(`"${String(entry.t).slice(0, 24)}"`, W / 2, H - 108); }
    g.fillStyle = '#5B6275'; g.font = '700 28px "Apple SD Gothic Neo","Noto Sans KR",sans-serif'; g.fillText('SurfShare · surf.owenai.xyz', W / 2, H - 66);
    return cv;
  }
  rr(g, 60, H - 170, W - 120, 120, 36); g.fillStyle = 'rgba(255,255,255,.92)'; g.fill();
  g.fillStyle = '#1B1B2F'; g.font = '800 44px "Apple SD Gothic Neo","Noto Sans KR",sans-serif';
  g.fillText(logs ? `이번 달 바다 ${logs}번 🌊` : '오늘도 파도 타러 🌊', W / 2, H - 112);
  g.fillStyle = '#5B6275'; g.font = '700 32px "Apple SD Gothic Neo","Noto Sans KR",sans-serif'; g.fillText('SurfShare · surf.owenai.xyz', W / 2, H - 68);
  return cv;
}
async function share(entry){
  let cv; try{ cv = await make(entry && entry.d ? entry : null); }catch(e){ cv = null; }
  if(!cv){ toast?.('카드를 만들지 못했어요'); return; }
  let blob = null; try{ blob = await new Promise(ok=>cv.toBlob(ok, 'image/png')); }catch(e){}
  if(!blob){ toast?.('이 브라우저에선 그림 저장이 안 돼요 — 화면을 캡처해 주세요'); return; }
  const file = new File([blob], `surfshare-${Date.now()}.png`, { type:'image/png' });
  try{ if(navigator.canShare?.({ files:[file] })){ await navigator.share({ files:[file], title:'내 서퍼 캐릭터', text:'양양 서핑 · SurfShare' }); return; } }
  catch(e){ if(e?.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  toast?.('📸 캐릭터 카드를 저장했어요');
}
window.charCardMake = make; window.charCardShare = share;
})();
