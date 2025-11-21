const CACHE_NAME = "nootqa-tracker-v1";
const OFFLINE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

// Installation : on met tout en cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

// Activation : on supprime les vieux caches si on change de version
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Récupération des fichiers : on essaie le cache d'abord, puis le réseau
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // on ne gère que les requêtes GET
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).catch(() => {
        // si la requête réseau échoue (offline),
        // on renvoie la page principale si possible
        if (request.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});
