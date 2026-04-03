
const CACHE_NAME = 'vedc-inventory-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/login',
  '/inventory',
  '/sales',
  '/events',
  '/globals.css',
];

// Installation : Mise en cache des ressources statiques de base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activation : Nettoyage des anciens caches
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
  self.clients.claim();
});

// Interception des requêtes : Stratégie Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  // On ne met pas en cache les requêtes vers Firebase ou les API externes
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('firebaseinstallations.googleapis.com') ||
      event.request.url.includes('identitytoolkit.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((response) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // On ne met en cache que les requêtes réussies (GET)
          if (event.request.method === 'GET' && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Si le réseau échoue et qu'on n'a rien en cache pour une navigation, on renvoie l'index
          if (event.request.mode === 'navigate') {
            return cache.match('/');
          }
        });
        return response || fetchPromise;
      });
    })
  );
});
