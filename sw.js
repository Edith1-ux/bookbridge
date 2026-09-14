/**
 * BookBridgee Service Worker
 * Enables offline capability and fast caching for PWA
 */

const CACHE_NAME = 'bookbridge-v2.1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/browse.html',
  '/exchange.html',
  '/donate.html',
  '/about.html',
  '/contact.html',
  '/dashboard.html',
  '/login.html',
  '/register.html',
  '/style.css',
  '/js/database.js',
  '/js/api.js',
  '/js/live-stats.js',
  '/js/app.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Bypass service worker cache for dynamic API endpoints, admin, and media uploads
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/django-admin') ||
    url.pathname.startsWith('/media') ||
    url.protocol.startsWith('ws')
  ) {
    return; // Pass through directly to network
  }

  // Cache-first strategy for static assets, falling back to network
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const networked = fetch(e.request)
        .then((response) => {
          if (response.status === 200) {
            const cacheCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, cacheCopy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networked;
    })
  );
});
