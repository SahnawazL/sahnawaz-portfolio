const CACHE_NAME = 'sahnawaz-portfolio-cache-v2';
const urlsToCache = [
  './',
  './index.html',
  './favicon.ico',
  './profile.jpg',
  './resume.pdf',
  './favicon-32x32.png',
  './favicon-192x192.png',
  './apple-touch-icon.png',
  './site.webmanifest'
];

// Install service worker and cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch from cache if offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// Activate new service worker and remove old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (!cacheWhitelist.includes(name)) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});
