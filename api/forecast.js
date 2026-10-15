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
  if(h >= 1.2) s = Math.min(s, 3);                      // 입문~초중급 기준 — 큰 파도는 주기·바람이 좋아도 별 3개까지
  if(h >= 2) s = Math.min(s, 1);
  return { s:Math.max(0, Math.min(5, Math.round(s))), why };
}

/* 서핑 일지용 — 하루 · 한 구역의 오전/오후 파도(지난 7일 ~ 앞으로 6일). ?day=YYYY-MM-DD&r=north */
async function oneDay(req, res){
  const day = String(req.query.day), g = REG.find(x=>x.k === req.query.r) || REG[1];
  const q = `latitude=${g.lat}&longitude=${g.lon}&past_days=7&forecast_days=7&timezone=Asia%2FSeoul`;
  let M, W;
  try{
    [M, W] = await Promise.all([
      fetch(`https://marine-api.open-meteo.com/v1/marine?${q}&hourly=wave_height,wave_period,wave_direction,sea_surface_temperature`, { signal:AbortSignal.timeout(8000) }).then(r=>{ if(!r.ok) throw 0; return r.json(); }),
      fetch(`https://api.open-meteo.com/v1/forecast?${q}&hourly=wind_speed_10m,wind_direction_10m,weather_code,temperature_2m&wind_speed_unit=ms`, { signal:AbortSignal.timeout(8000) }).then(r=>{ if(!r.ok) throw 0; return r.json(); }) ]);
  }catch(e){ res.setHeader('Cache-Control', 'no-store'); res.status(502).json({ error:'forecast' }); return; }
  const part = (h0, h1)=>{
    const P = { h:[], p:[], dir:[], sst:[], w:[], wd:[], tmp:[], code:[] };
    (M.hourly?.time || []).forEach((t, i)=>{ if(t.slice(0, 10) !== day) return; const hr = +t.slice(11, 13); if(hr < h0 || hr >= h1) return;
      P.h.push(M.hourly.wave_height?.[i]); P.p.push(M.hourly.wave_period?.[i]); P.dir.push(M.hourly.wave_direction?.[i]); P.sst.push(M.hourly.sea_surface_temperature?.[i]); });
    (W.hourly?.time || []).forEach((t, i)=>{ if(t.slice(0, 10) !== day) return; const hr = +t.slice(11, 13); if(hr < h0 || hr >= h1) return;
      P.w.push(W.hourly.wind_speed_10m?.[i]); P.wd.push(W.hourly.wind_direction_10m?.[i]); P.tmp.push(W.hourly.temperature_2m?.[i]); P.code.push(W.hourly.weather_code?.[i]); });
    const h = avg(P.h); if(h == null) return null;
    const p = avg(P.p), w = avg(P.w), wd = angAvg(P.wd), rt = rate(h, p, w, wd);
    return { h:r1(h), p:r1(p), dir:Math.round(angAvg(P.dir) ?? -1), w:r1(w), wd:Math.round(wd ?? -1), tmp:r1(avg(P.tmp)), sst:r1(avg(P.sst)), code:Math.max(...P.code.filter(x=>x != null), 0), s:rt.s, why:rt.why };
  };
  const out = { day, r:g.k, rn:g.n, am:part(6, 12), pm:part(12, 18) };
  const past = day < new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  res.setHeader('Cache-Control', out.am || out.pm ? `s-maxage=${past ? 21600 : 1800}, stale-while-revalidate=3600` : 'no-store');
  res.status(200).json(out);
}

export default async function handler(req, res){
  if(/^\d{4}-\d{2}-\d{2}$/.test(String(req.query?.day || ''))) return oneDay(req, res);
  const lat = REG.map(r=>r.lat).join(','), lon = REG.map(r=>r.lon).join(',');
  let mar, wx;
  try{
    [mar, wx] = await Promise.all([
      fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_period,wave_direction&forecast_days=7&timezone=Asia%2FSeoul`, { signal:AbortSignal.timeout(8000) }).then(r=>{ if(!r.ok) throw 0; return r.json(); }),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m,wind_direction_10m,weather_code,temperature_2m,precipitation_probability&daily=sunrise,sunset&wind_speed_unit=ms&forecast_days=7&timezone=Asia%2FSeoul`, { signal:AbortSignal.timeout(8000) }).then(r=>{ if(!r.ok) throw 0; return r.json(); }) ]);
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
  /* 해 뜨고 지는 시각 — 가운데 구역 기준(세 구역 차이는 1분 안팎) */
  const D = (wx[1] || wx[0])?.daily || {}, sunOf = day=>{ const i = (D.time || []).indexOf(day); return i < 0 ? null : { rise:String(D.sunrise?.[i] || '').slice(11, 16), set:String(D.sunset?.[i] || '').slice(11, 16) }; };
  const out = Object.keys(days).sort().slice(0, 7).map(day=>({ day, sun:sunOf(day), regions:REG.map(g=>{
    const one = part => { const r = days[day][g.k]?.[part]; if(!r) return null;
      const h = avg(r.h), p = avg(r.p), w = avg(r.w), wd = angAvg(r.wd), rt = rate(h, p, w, wd);
      return { h:r1(h), p:r1(p), dir:Math.round(angAvg(r.dir) ?? -1), w:r1(w), wd:Math.round(wd ?? -1), tmp:r1(avg(r.tmp)), rain:Math.round(Math.max(...r.rain.filter(x=>x != null), 0)),
        code:Math.max(...r.code.filter(x=>x != null), 0), s:rt.s, why:rt.why }; };
    return { k:g.k, n:g.n, am:one('am'), pm:one('pm') }; }) }));
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
  res.status(200).json({ fetched:new Date().toISOString(), src:'Open-Meteo', days:out });
}
