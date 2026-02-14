
const CACHE_NAME = 'vedc-inventory-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/globals.css',
  // On ne peut pas facilement lister tous les chunks Next.js ici, 
  // mais le service worker interceptera les requêtes réseau.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Stratégie : Network First, fallback to cache
  // Pour Firestore, il gère son propre cache via IndexedDB, donc on ne l'intercepte pas ici.
  if (event.request.url.includes('firestore.googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
