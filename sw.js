/**
 * ============================================
 * ARSIP SURAT DIGITAL ENTERPRISE v30.1.0
 * Service Worker - PWA FINAL
 * ============================================
 */

const CONFIG = {
  VERSION: '30.1.0',
  BUILD_DATE: '2026-07-10',
  CACHE_NAME: 'arsip-surat-v30.1.0',
  PRECACHE: ['/','/login.html','/index.html','/setup.html','/manifest.json','/404.html']
};

// Install
self.addEventListener('install', (event) => {
  console.log(`🔧 SW v${CONFIG.VERSION} - Installing...`);
  event.waitUntil(
    caches.open(CONFIG.CACHE_NAME).then((cache) => {
      return Promise.allSettled(CONFIG.PRECACHE.map((url) => cache.add(url).catch((e) => console.warn('Cache failed:', url, e))));
    }).then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', (event) => {
  console.log(`🚀 SW v${CONFIG.VERSION} - Activating...`);
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CONFIG.CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Fetch - Cache First with Network Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('script.google.com')) return; // Skip API calls
  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CONFIG.CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) return caches.match('/404.html');
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Push Notification
self.addEventListener('push', (event) => {
  const data = event.data ? JSON.parse(event.data.text()) : { title: 'Arsip Surat Digital', body: 'Notifikasi baru' };
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" rx="20" fill="%231976D2"/%3E%3Ctext x="50" y="70" font-size="50" text-anchor="middle" fill="white"%3E📄%3C/text%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%231976D2"/%3E%3C/svg%3E',
    data: { url: data.url || '/index.html#notifikasi' }
  }));
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/index.html'));
});

// Message Handler
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

console.log(`✅ Service Worker v${CONFIG.VERSION} - READY`);
