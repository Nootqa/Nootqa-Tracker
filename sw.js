const CACHE_NAME = 'nootqa-tracker-v1';

const ASSETS = [
  '/index.html',
  '/manifest.json',
  '/sw.js',
  '/Nootqa/icon-192.png.jpeg',
  '/Nootqa/icon-512.png.jpeg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(response =>
      response ||
      fetch(event.request).catch(() => caches.match('/index.html'))
    )
  );
});
