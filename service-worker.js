/**
 * SERVICE WORKER - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Offline support, caching, and background sync
 */

const CACHE_NAME = 'asd-v3.2.2';
const RUNTIME_CACHE = 'asd-runtime';
const API_CACHE = 'asd-api';

// Resources to precache
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/src/css/tokens.css',
  '/src/css/reset.css',
  '/src/css/layout.css',
  '/src/css/typography.css',
  '/src/css/components.css',
  '/src/css/forms.css',
  '/src/css/tables.css',
  '/src/css/cards.css',
  '/src/css/modals.css',
  '/src/css/notifications.css',
  '/src/css/sidebar.css',
  '/src/css/navbar.css',
  '/src/css/content.css',
  '/src/css/dashboard.css',
  '/src/css/auth.css',
  '/src/css/responsive.css',
  '/src/css/themes.css',
  '/src/css/animations.css',
  '/src/css/utilities.css',
  '/src/js/config.js',
  '/src/js/constants.js',
  '/src/js/state.js',
  '/src/js/app.js',
  '/src/js/router.js',
  '/src/js/i18n.js',
  '/src/js/pwa.js',
  '/src/assets/icons/logo.svg',
  '/src/assets/icons/icon-192x192.png',
  '/src/assets/icons/icon-512x512.png',
  '/src/assets/images/empty-state.svg',
  '/src/assets/images/error-state.svg',
  '/src/assets/images/no-data.svg',
  '/src/assets/fonts/MaterialIcons-Regular.woff2',
  '/manifest.json',
  '/offline.html'
];

// Install event - precache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching resources...');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Precaching complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, API_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => !currentCaches.includes(cacheName))
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients...');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip Google Apps Script API calls (handle separately)
  if (url.hostname === 'script.google.com') {
    return handleAPIRequest(event);
  }
  
  // Skip Google Fonts
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    return handleFontRequest(event);
  }
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    return handleNavigationRequest(event);
  }
  
  // Handle static assets
  if (isStaticAsset(url)) {
    return handleStaticAsset(event);
  }
  
  // Default: network first with cache fallback
  event.respondWith(networkFirst(request));
});

/**
 * Handle API requests
 */
function handleAPIRequest(event) {
  const { request } = event;
  
  // Only cache GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Stale while revalidate for API
  event.respondWith(staleWhileRevalidate(request, API_CACHE));
}

/**
 * Handle font requests
 */
function handleFontRequest(event) {
  // Cache first for fonts
  event.respondWith(cacheFirst(event.request, RUNTIME_CACHE));
}

/**
 * Handle navigation requests
 */
function handleNavigationRequest(event) {
  const { request } = event;
  
  event.respondWith(
    fetch(request)
      .catch(() => {
        // Return offline page
        return caches.match('/offline.html');
      })
  );
}

/**
 * Handle static assets
 */
function handleStaticAsset(event) {
  const { request } = event;
  
  // Cache first for static assets
  event.respondWith(cacheFirst(request, CACHE_NAME));
}

/**
 * Cache first strategy
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache the response
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return a fallback if available
    return new Response('Network error', { status: 408 });
  }
}

/**
 * Network first strategy
 */
async function networkFirst(request, cacheName = RUNTIME_CACHE) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ status: 'error', message: 'Anda sedang offline' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Stale while revalidate strategy
 */
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(cacheName);
        cache.then((c) => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(url) {
  const staticExtensions = [
    '.css', '.js', '.svg', '.png', '.jpg', '.jpeg', '.gif',
    '.woff', '.woff2', '.ttf', '.eot', '.ico', '.json', '.xml'
  ];
  
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

/**
 * Background sync
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  } else if (event.tag === 'sync-files') {
    event.waitUntil(syncFiles());
  }
});

/**
 * Sync data with server
 */
async function syncData() {
  try {
    const db = await openDB();
    const pendingRequests = await db.getAll('pendingRequests');
    
    for (const request of pendingRequests) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body
        });
        
        if (response.ok) {
          await db.delete('pendingRequests', request.id);
        }
      } catch (error) {
        console.error('Sync failed for request:', request.id, error);
      }
    }
    
    // Notify clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE' });
    });
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

/**
 * Sync files
 */
async function syncFiles() {
  // Implementation for file sync
  console.log('[SW] File sync not yet implemented');
}

/**
 * Push notification
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = {
        title: 'Notifikasi Baru',
        body: event.data.text(),
        icon: '/src/assets/icons/icon-192x192.png'
      };
    }
  }
  
  const options = {
    body: data.body || 'Anda memiliki notifikasi baru',
    icon: data.icon || '/src/assets/icons/icon-192x192.png',
    badge: data.badge || '/src/assets/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      ...data.data
    },
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || 'default',
    renotify: data.renotify || false,
    silent: data.silent || false
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Arsip Surat Digital',
      options
    )
  );
});

/**
 * Notification click
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        return clients.openWindow(url);
      })
  );
});

/**
 * Message from client
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message from client:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(event.data.urls))
    );
  } else if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.map(key => caches.delete(key))))
    );
  }
});

/**
 * Open IndexedDB for pending requests
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('asd_pending', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingRequests')) {
        const store = db.createObjectStore('pendingRequests', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

console.log('✅ Service Worker v3.2.2 ready');
