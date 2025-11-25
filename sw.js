// sw.js — PWA avec offline + mise à jour propre
const CACHE_NAME = 'nootqa-tracker-v8';

// Les fichiers essentiels à mettre en cache
const ASSETS = [
  '/',          
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// INSTALL : pré-cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ACTIVATE : supprime anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys
        .filter((k) => k !== CACHE_NAME)
        .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// FETCH
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;

  // 1) Navigation → network first
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('/index.html', clone);
          });
          return networkRes;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 2) Fichiers statiques → cache first
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      return (
        cachedRes ||
        fetch(req).catch(() => cachedRes || Response.error())
      );
    })
  );
});
