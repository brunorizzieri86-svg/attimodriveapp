// AttimoDrive — Service Worker (offline-first shell cache)
// Estratégia simples: cache-first para os arquivos do app, com atualização
// em segundo plano (stale-while-revalidate) para pegar novas versões sem
// travar o uso offline. Nenhum dado do usuário passa por aqui — tudo fica
// no localStorage/IndexedDB do aparelho.
const CACHE_NAME = 'attimodrive-shell-v2';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon192.png',
  './icon512.png',
  './icon512_maskable.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((networkResp) => {
        if (networkResp && networkResp.ok) {
          const copy = networkResp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        }
        return networkResp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
