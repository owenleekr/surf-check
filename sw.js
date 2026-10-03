// 네트워크 우선, 실패 시 캐시 — 바다 앞 신호 약할 때 앱 껍데기가 뜨게
// '/' 는 /surfshare 로 넘어가므로 캐시 키로 쓰지 않는다. 대신 화면 이동은 아래에서 받아낸다.
const C = 'surf-v63', FILES = ['./surfshare.html', './school.html', './sprite.js', './roster.js', './play.js', './surfgame.js', './quiz.js', './config.js', './lex.js', './manifest.webmanifest', './school.webmanifest', './icon-180.png', './attendance-seed.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if(e.request.method !== 'GET' || u.origin !== location.origin) return;         // API·CDN은 건드리지 않음
  e.respondWith(fetch(e.request)
    .then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; })
    .catch(async () => {
      const hit = await caches.match(e.request, { ignoreSearch:true });
      if(hit) return hit;
      // 끊긴 채로 주소만 치고 들어온 경우 — 빈 화면 대신 그 페이지의 껍데기를 준다
      if(e.request.mode === 'navigate'){
        const p = u.pathname;
        const f = (p === '/school' || p.startsWith('/index')) ? './school.html' : './surfshare.html';
        const shell = await caches.match(f);
        if(shell) return shell;
      }
      return Response.error();
    }));
});
