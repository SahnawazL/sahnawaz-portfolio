const CACHE_NAME = 'sahnawaz-portfolio-cache-v3';
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

// Install
self.addEventListener('install', event => {
  self.skipWaiting(); // Activate immediately, don't wait
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch — Network first, cache as fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Save fresh copy to cache
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response; // Always serve fresh from network
      })
      .catch(() => caches.match(event.request)) // Offline? Use cache
  );
});

// Activate — delete old caches and take control immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // Take control of all open tabs immediately
});
