// 오늘의 서핑 소식 — RSS 몇 개를 서버에서 모아 상업·홍보성 기사 걸러서 준다 (Vercel 서버리스, 1시간 캐시)
const FEEDS = [
  { src:'구글뉴스·한국', url:'https://news.google.com/rss/search?q=%EC%84%9C%ED%95%91+when:10d&hl=ko&gl=KR&ceid=KR:ko', lang:'ko' },
  { src:'The Inertia', url:'https://www.theinertia.com/feed/', lang:'en', cat:'surf' },
  { src:'Surfer', url:'https://www.surfer.com/feed/', lang:'en' },
  { src:'BeachGrit', url:'https://beachgrit.com/feed/', lang:'en' },
];
const BLOCK = /할인|특가|세일|프로모션|이벤트 응모|분양|투자|수익|광고|협찬|쿠폰|런칭|출시 기념|sponsored|discount|% off|coupon|giveaway|promo|deal of|black friday|casino|betting|웨이브파크 티켓|리조트 특가|펜션|숙박권|골프|아파트|주식/i;
const KEEP_KO = /서핑|서퍼|파도|양양|죽도|인구|낙산|강릉|해변|롱보드|숏보드|WSL|올림픽/;
const dec = x => x.replace(/&#(\d+);/g,(m,n)=>String.fromCharCode(+n)).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;|&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const tag = (xml, t) => { const m = xml.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`, 'i')); return m ? dec(m[1].replace(/<!\[CDATA\[|\]\]>/g,'').replace(/<[^>]+>/g,'')).trim() : ''; };
export default async function handler(req, res){
  const out = [];
  await Promise.all(FEEDS.map(async f => {
    try{
      const r = await fetch(f.url, { headers:{ 'user-agent':'Mozilla/5.0 (lineup-surf-app)' }, signal: AbortSignal.timeout(8000) }); if(!r.ok) return;
      const xml = await r.text(); const items = xml.split(/<item[ >]/).slice(1);
      for(const it of items){
        const t = tag(it,'title'), l = tag(it,'link') || (it.match(/<link>([^<]+)/)||[])[1] || '', d = tag(it,'pubDate') || tag(it,'dc:date'), cats = [...it.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map(m=>m[1].replace(/<!\[CDATA\[|\]\]>/g,'').toLowerCase()).join(' ');
        const desc = tag(it,'description').slice(0,220);
        if(!t || !l) continue; if(f.cat && cats && !cats.includes(f.cat)) continue;
        if(BLOCK.test(t+' '+desc)) continue; if(f.lang==='ko' && !KEEP_KO.test(t)) continue;
        out.push({ t: t.replace(/\s-\s[^-]+$/,'').slice(0,120), l, d: d ? new Date(d).toISOString() : null, src: f.lang==='ko' ? (t.match(/-\s([^-]+)$/)||[])[1]?.trim()||f.src : f.src, lang: f.lang, s: f.lang==='en' ? desc.replace(/&#8217;/g,"'").slice(0,140) : '' });
      }
    }catch(e){}
  }));
  const seen = new Set(); const items = out.filter(x=>{ const k = x.t.slice(0,40); if(seen.has(k)) return false; seen.add(k); return true; }).sort((a,b)=>(b.d||'').localeCompare(a.d||'')).slice(0, 60);
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400'); res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ fetched: new Date().toISOString(), items });
}
