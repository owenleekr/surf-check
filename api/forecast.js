// 이번주의 파도 — 7일 파도·바람 예보를 세 구역(고성·속초&양양 북부·양양 남부)으로 묶어 '언제·어디가 탈 만한가'를 매긴다.
// 출처: Open-Meteo(파고·주기·방향 = Marine API, 바람·날씨 = Forecast API). 키 없이 쓰는 공개 예보 모델.
// 두 요청에 세 지점을 한꺼번에 묻고, 결과는 엣지에 30분 캐시한다(예보는 몇 시간마다 갱신된다).
// 점수는 '입문~초중급 서퍼' 기준의 어림 — 실제 파도는 다를 수 있어 앱은 '나가기 전 캠 확인'을 함께 띄운다.
const REG = [
  { k:'goseong', n:'고성', lat:38.33, lon:128.56 },
  { k:'north',   n:'속초·양양 북부', lat:38.15, lon:128.65 },
  { k:'south',   n:'양양 남부', lat:38.0, lon:128.76 },
];
const avg = a => { const v = a.filter(x=>x != null && isFinite(x)); return v.length ? v.reduce((s, x)=>s + x, 0) / v.length : null; };
/* 방향 평균은 각도라 그냥 평균내면 안 된다(350°와 10°의 평균은 0°) */
const angAvg = a => { const v = a.filter(x=>x != null && isFinite(x)); if(!v.length) return null; const r = Math.PI / 180;
  const x = v.reduce((s, d)=>s + Math.cos(d * r), 0), y = v.reduce((s, d)=>s + Math.sin(d * r), 0); return (Math.atan2(y, x) / r + 360) % 360; };
const r1 = x => x == null ? null : Math.round(x * 10) / 10;

/* 동해안은 바다가 동쪽 — 서풍(오프쇼어)이 좋고 동풍(온쇼어)은 파도를 흐트러뜨린다 */
export function rate(h, p, wind, wdir){
  if(h == null) return { s:0, why:'예보 없음' };
  let s, why;
  if(h < 0.25){ s = 1; why = '거의 잔잔(플랫)'; }
  else if(h < 0.5){ s = 3; why = '작은 파도 — 입문 연습'; }
  else if(h < 1.2){ s = 4; why = '타기 좋은 크기'; }
  else if(h < 2){ s = 3; why = '큰 편 — 중급 이상'; }
  else { s = 1; why = '너무 큼 — 위험'; }
  if(p != null && h >= 0.3){ if(p >= 7) s += 1; else if(p < 5) s -= 1; }
  if(wind != null){
    const off = wdir != null && wdir >= 200 && wdir <= 340, on = wdir != null && wdir >= 30 && wdir <= 150;
    if(wind >= 10){ s -= 2; why += ' · 바람 셈'; }
    else if(on && wind >= 5){ s -= 1.5; why += ' · 온쇼어(파도 흐트러짐)'; }
    else if(off && wind < 8){ s += 0.5; why += ' · 오프쇼어'; }
  }
  return { s:Math.max(0, Math.min(5, Math.round(s))), why };
}

export default async function handler(req, res){
  const lat = REG.map(r=>r.lat).join(','), lon = REG.map(r=>r.lon).join(',');
  let mar, wx;
  try{
    [mar, wx] = await Promise.all([
      fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_period,wave_direction&forecast_days=7&timezone=Asia%2FSeoul`, { signal:AbortSignal.timeout(8000) }).then(r=>{ if(!r.ok) throw 0; return r.json(); }),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m,wind_direction_10m,weather_code,temperature_2m,precipitation_probability&wind_speed_unit=ms&forecast_days=7&timezone=Asia%2FSeoul`, { signal:AbortSignal.timeout(8000) }).then(r=>{ if(!r.ok) throw 0; return r.json(); }) ]);
  }catch(e){ res.setHeader('Cache-Control', 'no-store'); res.status(502).json({ error:'forecast' }); return; }
  if(!Array.isArray(mar)) mar = [mar]; if(!Array.isArray(wx)) wx = [wx];
  const days = {};
  REG.forEach((g, gi)=>{
    const M = mar[gi]?.hourly || {}, W = wx[gi]?.hourly || {};
    (M.time || []).forEach((t, i)=>{
      const day = t.slice(0, 10), hr = +t.slice(11, 13);
      const part = hr >= 6 && hr < 12 ? 'am' : hr >= 12 && hr < 18 ? 'pm' : null; if(!part) return;
      const d = (days[day] ||= {}), r = ((d[g.k] ||= { am:{ h:[], p:[], dir:[], w:[], wd:[], code:[], tmp:[], rain:[] }, pm:{ h:[], p:[], dir:[], w:[], wd:[], code:[], tmp:[], rain:[] } }))[part];
      const j = (W.time || []).indexOf(t);
      r.h.push(M.wave_height?.[i]); r.p.push(M.wave_period?.[i]); r.dir.push(M.wave_direction?.[i]);
      if(j >= 0){ r.w.push(W.wind_speed_10m?.[j]); r.wd.push(W.wind_direction_10m?.[j]); r.code.push(W.weather_code?.[j]); r.tmp.push(W.temperature_2m?.[j]); r.rain.push(W.precipitation_probability?.[j]); }
    });
  });
  const out = Object.keys(days).sort().slice(0, 7).map(day=>({ day, regions:REG.map(g=>{
    const one = part => { const r = days[day][g.k]?.[part]; if(!r) return null;
      const h = avg(r.h), p = avg(r.p), w = avg(r.w), wd = angAvg(r.wd), rt = rate(h, p, w, wd);
      return { h:r1(h), p:r1(p), dir:Math.round(angAvg(r.dir) ?? -1), w:r1(w), wd:Math.round(wd ?? -1), tmp:r1(avg(r.tmp)), rain:Math.round(Math.max(...r.rain.filter(x=>x != null), 0)),
        code:Math.max(...r.code.filter(x=>x != null), 0), s:rt.s, why:rt.why }; };
    return { k:g.k, n:g.n, am:one('am'), pm:one('pm') }; }) }));
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
  res.status(200).json({ fetched:new Date().toISOString(), src:'Open-Meteo', days:out });
}
