// sw.js — PWA avec offline + mise à jour propre
const CACHE_NAME = 'nootqa-tracker-v9';

// Fichiers essentiels à mettre en cache
const ASSETS = [
  '/',           // racine (utile sur Vercel)
  '/index.html',
  '/manifest.json'
  // tu peux ajouter ici: '/icon-192.png', '/icon-512.png'
];

// INSTALL : on pré-cache les fichiers de base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ACTIVATE : on supprime tous les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// FETCH :
// - pour les navigations (pages) → "network first", fallback cache
// - pour le reste → "cache first", fallback réseau
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // On ne gère que les GET
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
          // Si on est offline → on renvoie la version en cache
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 2) Fichiers statiques (manifest, icônes, etc.)
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      if (cachedRes) return cachedRes;
      return fetch(req).catch(() => cachedRes || Response.error());
    })
  );
});
