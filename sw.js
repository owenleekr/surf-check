// 네트워크 우선, 실패 시 캐시 — 바다 앞 신호 약할 때 앱 껍데기가 뜨게
const C = 'surf-v2', FILES = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-180.png', './attendance-seed.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if(e.request.method !== 'GET' || u.origin !== location.origin) return;         // API·CDN은 건드리지 않음
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request, { ignoreSearch:true })));
});
