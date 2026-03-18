// ═══════════════════════════════════════════════════════════════
// YANKUŞ SERVICE WORKER — PWA Offline Desteği
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME = 'yankus-v1.6.0';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // API istekleri - network only
  if (url.pathname.startsWith('/api') || 
      request.method === 'POST' ||
      url.pathname === '/ping' ||
      url.pathname === '/trending' ||
      url.pathname === '/patchnotes') {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets - cache first
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;
        
        return fetch(request)
          .then(response => {
            // Sadece başarılı yanıtları cache'le
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, responseToCache));

            return response;
          })
          .catch(() => {
            // Offline durumda ana sayfayı göster
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Push notifications (gelecekte)
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Yeni bildirim',
    icon: '/assets/icon-192.png',
    badge: '/assets/badge.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Aç' },
      { action: 'close', title: 'Kapat' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Yankuş', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'close') return;
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
