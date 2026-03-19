// Yankuş Service Worker v1.7.4
const CACHE_NAME = 'yankus-v1.7.4';
const OFFLINE_URL = '/';

// Install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json'
      ]);
    })
  );
  self.skipWaiting();
});

// Activate
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
  if (e.request.url.includes('/ping') || 
      e.request.method === 'POST') {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Başarılı yanıtı cache'le
        if (res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, clone);
          });
        }
        return res;
      })
      .catch(() => {
        // Offline - cache'den döndür
        return caches.match(e.request).then((cached) => {
          return cached || caches.match(OFFLINE_URL);
        });
      })
  );
});

// Push notifications (gelecekte)
self.addEventListener('push', (e) => {
  const data = e.data?.json() || {};
  self.registration.showNotification(data.title || 'Yankuş', {
    body: data.body || 'Yeni bildirim',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.url || '/'
  });
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data));
});
