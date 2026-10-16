// 네트워크 우선, 실패 시 캐시 — 바다 앞 신호 약할 때 앱 껍데기가 뜨게
// '/' 는 /surfshare 로 넘어가므로 캐시 키로 쓰지 않는다. 대신 화면 이동은 아래에서 받아낸다.
const C = 'surf-v212', FILES = ['./surfshare.html', './guide.html', './school.html', './sprite.js', './mochi.js', './ui.js', './surflog.js', './charcard.js', './backnav.js', './homeedit.js', './roster.js', './play.js', './scenery.js', './surfgame.js', './surfride.js', './skate.js', './quest.js', './defend.js', './install.js', './updates.js', './icons.js', './recommend.js', './waves.js', './quiz.js', './food.js', './foodtalk.js', './feed.js', './bday.js', './bus.js', './config.js', './lex.js', './manifest.webmanifest', './school.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './icon-512-maskable.png', './icon2-180.png', './icon2-192.png', './icon2-512.png', './icon2-512-maskable.png', './attendance-seed.json'];
/* 운영(Vercel cleanUrls)에선 ./surfshare.html 이 /surfshare 로 308 되어, 담긴 응답에 '넘어왔음(redirected)' 표시가 붙는다.
   그런 응답을 화면 이동(navigate)에 그대로 주면 브라우저가 거부해 오프라인에서 껍데기가 안 떴다 — 본문만 새 응답으로 옮겨 준다 */
const unredirect = async r => r && r.redirected ? new Response(await r.blob(), { status:200, statusText:'OK', headers:r.headers }) : r;
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if(e.request.method !== 'GET' || u.origin !== location.origin) return;         // API·CDN은 건드리지 않음
  if(u.pathname.startsWith('/api/')) return;                                       // 우리 서버리스 API 도 그대로(엣지가 캐시한다 — 여기서 또 담으면 낡은 목록이 남는다)
  e.respondWith(fetch(e.request)
    .then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; })
    .catch(async () => {
      const hit = await caches.match(e.request, { ignoreSearch:true });
      if(hit) return e.request.mode === 'navigate' ? unredirect(hit) : hit;
      // 끊긴 채로 주소만 치고 들어온 경우 — 빈 화면 대신 그 페이지의 껍데기를 준다
      if(e.request.mode === 'navigate'){
        const p = u.pathname;
        const f = (p === '/school' || p.startsWith('/index')) ? './school.html' : './surfshare.html';
        const shell = await caches.match(f);
        if(shell) return unredirect(shell);
      }
      return Response.error();
    }));
});
/* 알림을 누르면 — 열린 앱이 있으면 그 창을 앞으로, 없으면 새로 열고 바로 그 화면으로(?go=) */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const go = (e.notification.data && e.notification.data.go) || '';
  const url = '/surfshare' + (go ? '?go=' + encodeURIComponent(go) : '');
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(cs => {
    const c = cs.find(x => x.url.includes('/surfshare')); if(c){ c.focus(); return c.navigate ? c.navigate(url).catch(()=>{}) : null; }
    return self.clients.openWindow(url);
  }));
});
