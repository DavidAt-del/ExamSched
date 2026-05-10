// Vanilla service worker — no build pipeline. Cache static assets so the app
// shell loads offline; let API calls go straight to the network so auth and
// mutations are never served from a stale cache.
//
// Bump CACHE_VERSION whenever this file changes to evict the previous cache.
const CACHE_VERSION = 'proctor-scheduler-v1';
const PRECACHE_URLS = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Same-origin only — never proxy third-party requests through the cache.
  if (url.origin !== self.location.origin) return;

  // API: network-first, no cache fallback. These responses are auth-bearing
  // and often time-sensitive; serving stale data would be worse than failing.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets: cache-first, with a background revalidate. Hashed Vite
  // assets are immutable; index.html is precached and updated on activate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached ?? Response.error());
      return cached ?? networkFetch;
    }),
  );
});
