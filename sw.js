/* ============================================================
   企画ノート — Service Worker
   キャッシュ戦略: Cache-first (オフライン完全対応)
   ============================================================ */

const CACHE_NAME = 'kikakunote-v1';
const FONT_CACHE  = 'kikakunote-fonts-v1';

/* アプリシェル: インストール時にキャッシュするファイル */
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

/* Google Fonts のホスト */
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

/* ===== INSTALL ===== */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

/* ===== ACTIVATE ===== */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== FONT_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ===== FETCH ===== */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  /* Google Fonts: stale-while-revalidate */
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(FONT_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          const network = fetch(event.request).then(response => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  /* アプリシェル: cache-first */
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          /* オフライン時: index.html にフォールバック */
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
    );
  }
});
