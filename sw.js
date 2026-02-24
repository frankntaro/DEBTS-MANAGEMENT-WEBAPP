// sw.js – Advanced Service Worker for DebtApp
const CACHE_NAME = 'debtapp-cache-v3'; // Increment version to force update
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/shops.html',
  '/debts.html',
  '/profile.html',
  '/customer-dashboard.html',
  '/manifest.json', 
  '/assets/js/common.js',
  '/assets/js/auth2.js', 
  '/assets/js/dashboard.js',
  '/assets/js/shops.js',
  '/assets/js/debts.js',
  '/assets/js/profile.js',
  '/assets/js/customer.js',
  '/assets/images/icon-512.png'

];

// 1. Install Event: Cache core files immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Pre-caching core assets');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// 2. Activate Event: Cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event: Network-First Strategy
// This ensures users see the latest debt data if they are online, 
// but can still see the last known data if they are offline.

self.addEventListener('fetch', event => {
  // Skip cross-origin requests (like Google Fonts or CDNs if you don't want to cache them)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // If successful, clone and update the cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If network fails, try the cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback: If page is a navigation request, show index or offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});