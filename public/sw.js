// Yankuş Service Worker v1.8.0
const CACHE_NAME = 'yankus-v1.8.0';
const OFFLINE_URL = '/';

// Cache'lenecek dosyalar
const PRECACHE_FILES = [
  '/',
  '/manifest.json',
  '/icon.svg'
];

// Install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_FILES);
    })
  );
  self.skipWaiting();
});

// Activate - eski cache'leri temizle
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch - Network first, fallback to cache
self.addEventListener('fetch', (e) => {
  // API isteklerini cache'leme
  if (e.request.method === 'POST' || 
      e.request.url.includes('/ping') ||
      e.request.url.includes('/api/')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, clone);
          });
        }
        return res;
      })
      .catch(() => {
        return caches.match(e.request).then((cached) => {
          return cached || caches.match(OFFLINE_URL);
        });
      })
  );
});

// Push notifications
self.addEventListener('push', (e) => {
  const data = e.data?.json() || {};
  self.registration.showNotification(data.title || 'Yankuş', {
    body: data.body || 'Yeni bildirim',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: data.url || '/'
  });
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data));
});
