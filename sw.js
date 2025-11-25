// sw.js — PWA avec offline rapide + mise à jour propre
const CACHE_NAME = 'nootqa-tracker-v10';

const ASSETS = [
  '/',           // racine (Vercel)
  '/index.html',
  '/manifest.json'
  // '/icon-192.png',
  // '/icon-512.png'
];

// INSTALL : on pré-cache les fichiers de base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ACTIVATE : on supprime les anciens caches
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

// FETCH
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // On ne gère que les GET
  if (req.method !== 'GET') return;

  // 1) Navigations (ouvrir / recharger la page)
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cachedResponse) => {
        // Si on a déjà une version en cache → on l'affiche tout de suite
        const fetchPromise = fetch(req)
          .then((networkRes) => {
            // On met à jour le cache pour la prochaine fois
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', clone);
            });
            return networkRes;
          })
          .catch(() => cachedResponse || Response.error());

        // On renvoie ce qu'on a :
        // - si cache dispo → très rapide
        // - sinon (premier lancement) → on attend le réseau
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 2) Fichiers statiques (manifest, icônes…)
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      if (cachedRes) return cachedRes;
      return fetch(req).catch(() => cachedRes || Response.error());
    })
  );
});
