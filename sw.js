const CACHE_NAME = 'nootqa-tracker-v4';

const ASSETS = [
  '/',          // page racine
  '/index.html' // ton tracker
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
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
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
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Seulement les requêtes GET
  if (req.method !== 'GET') return;

  // 1) Navigation (ouvrir / recharger la page)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          // On met à jour le cache avec la dernière version d’index.html
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('/index.html', clone);
          });
          return networkRes;
        })
        .catch(() => {
          // Si on est offline → on sert la version en cache
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 2) Autres fichiers statiques (manifest, icônes…)
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      if (cachedRes) return cachedRes;
      return fetch(req).catch(() => cachedRes || Response.error());
    })
  );
});
