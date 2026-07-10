/**
 * ============================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.1.0 (2026)
 * Service Worker - GRAND MASTER FINAL
 * ============================================
 * Features: Advanced Caching, Background Sync,
 *           Push Notifications, Periodic Sync,
 *           Offline Fallback, Cache Management
 * ============================================
 */

// ========== VERSION ==========
const SW_VERSION = '3.1.0';
const BUILD_DATE = '2026-07-10';
const CACHE_PREFIX = 'arsip-surat-v3';

// ========== CACHE NAMES ==========
const CACHE_NAMES = {
  static: `${CACHE_PREFIX}-static-${SW_VERSION}`,
  dynamic: `${CACHE_PREFIX}-dynamic-${SW_VERSION}`,
  api: `${CACHE_PREFIX}-api-${SW_VERSION}`,
  images: `${CACHE_PREFIX}-images-${SW_VERSION}`,
  fonts: `${CACHE_PREFIX}-fonts-${SW_VERSION}`,
  pages: `${CACHE_PREFIX}-pages-${SW_VERSION}`,
};

// ========== PRE-CACHE ASSETS ==========
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/setup.html',
  '/verify.html',
  '/404.html',
  '/offline.html',
  '/css/custom.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/db.js',
  '/js/notifications.js',
  '/js/security.js',
  '/js/export.js',
  '/js/chart-init.js',
  '/manifest.json',
  '/version.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ========== INSTALL EVENT ==========
self.addEventListener('install', (event) => {
  console.log(`[SW v${SW_VERSION}] Installing...`);

  event.waitUntil(
    Promise.all([
      // Pre-cache static assets
      caches.open(CACHE_NAMES.static)
        .then((cache) => {
          console.log(`[SW] Pre-caching ${PRECACHE_ASSETS.length} assets...`);
          return cache.addAll(PRECACHE_ASSETS);
        })
        .then(() => console.log('[SW] Pre-cache complete')),
      
      // Clean old caches
      cleanOldCaches(),
    ]).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    })
  );
});

// ========== ACTIVATE EVENT ==========
self.addEventListener('activate', (event) => {
  console.log(`[SW v${SW_VERSION}] Activating...`);

  event.waitUntil(
    Promise.all([
      // Claim all clients immediately
      self.clients.claim(),
      
      // Clean old caches
      cleanOldCaches(),
      
      // Initialize storage
      initStorage(),
    ]).then(() => {
      console.log('[SW] Activation complete');
      
      // Notify clients about update
      notifyClients({
        type: 'SW_ACTIVATED',
        version: SW_VERSION,
      });
    })
  );
});

// ========== FETCH EVENT ==========
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Determine strategy based on request type
  const strategy = determineStrategy(url, request);

  switch (strategy) {
    case 'cache-first':
      event.respondWith(cacheFirstStrategy(request));
      break;
    case 'network-first':
      event.respondWith(networkFirstStrategy(request));
      break;
    case 'stale-while-revalidate':
      event.respondWith(staleWhileRevalidateStrategy(request));
      break;
    case 'network-only':
      event.respondWith(fetch(request));
      break;
    case 'cache-only':
      event.respondWith(caches.match(request));
      break;
    default:
      event.respondWith(networkFirstStrategy(request));
  }
});

// ========== CACHE STRATEGIES ==========

/**
 * Determine cache strategy based on URL
 */
function determineStrategy(url, request) {
  // API calls - Network First
  if (url.href.includes('script.google.com') || url.pathname.includes('/api/')) {
    return 'network-first';
  }

  // Static assets - Cache First
  if (url.pathname.match(/\.(css|js|json|woff2?|ttf|eot)$/)) {
    return 'cache-first';
  }

  // Images - Stale While Revalidate
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    return 'stale-while-revalidate';
  }

  // HTML pages - Network First (for freshness)
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    return 'network-first';
  }

  // Google Fonts - Cache First
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    return 'cache-first';
  }

  // CDN libraries - Cache First
  if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'unpkg.com') {
    return 'cache-first';
  }

  // Default - Network First
  return 'network-first';
}

/**
 * Cache First Strategy
 * Check cache first, fallback to network
 */
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAMES.static);
  const cached = await cache.match(request);

  if (cached) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) cache.put(request, response);
    }).catch(() => {});
    
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline page for navigation
    if (request.mode === 'navigate') {
      const offlineCache = await caches.open(CACHE_NAMES.pages);
      return offlineCache.match('/offline.html');
    }
    throw error;
  }
}

/**
 * Network First Strategy
 * Try network first, fallback to cache, then offline page
 */
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAMES.api);

  try {
    const response = await fetch(request, {
      // Set timeout for API calls
      signal: request.url.includes('script.google.com') 
        ? AbortSignal.timeout(15000) 
        : undefined,
    });

    // Cache successful responses
    if (response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log(`[SW] Network failed for: ${request.url}, trying cache...`);

    const cached = await cache.match(request);
    if (cached) {
      // Notify about stale data
      notifyClients({
        type: 'STALE_DATA',
        url: request.url,
      });
      return cached;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineCache = await caches.open(CACHE_NAMES.pages);
      const offlinePage = await offlineCache.match('/offline.html');
      if (offlinePage) return offlinePage;
    }

    // Return JSON error for API requests
    if (request.url.includes('script.google.com') || request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Anda sedang offline. Data akan disinkronkan saat online.',
          offline: true,
          version: SW_VERSION,
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    throw error;
  }
}

/**
 * Stale While Revalidate Strategy
 * Return cached version immediately, update cache in background
 */
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(CACHE_NAMES.images);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// ========== BACKGROUND SYNC ==========
self.addEventListener('sync', (event) => {
  console.log(`[SW] Background Sync: ${event.tag}`);

  switch (event.tag) {
    case 'sync-surat':
      event.waitUntil(syncPendingOperations('surat'));
      break;
    case 'sync-disposisi':
      event.waitUntil(syncPendingOperations('disposisi'));
      break;
    case 'sync-all':
      event.waitUntil(syncAllPending());
      break;
    default:
      console.log(`[SW] Unknown sync tag: ${event.tag}`);
  }
});

/**
 * Sync pending operations from IndexedDB
 */
async function syncPendingOperations(type) {
  try {
    const db = await openIDB();
    const tx = db.transaction('pendingOps', 'readwrite');
    const store = tx.objectStore('pendingOps');
    const items = await store.getAll();

    let synced = 0;
    for (const item of items) {
      if (item.type !== type && type !== 'all') continue;
      
      try {
        const data = JSON.parse(item.data);
        await fetch(data.url || '/api', {
          method: item.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(item.headers || {}),
          },
          body: item.body || JSON.stringify(data),
        });
        
        await store.delete(item.id);
        synced++;
      } catch (e) {
        console.error(`[SW] Sync failed for ${item.id}:`, e);
      }
    }

    await tx.complete;
    console.log(`[SW] Synced ${synced} ${type} operations`);
  } catch (error) {
    console.error(`[SW] Sync ${type} failed:`, error);
  }
}

async function syncAllPending() {
  await syncPendingOperations('all');
}

// ========== PUSH NOTIFICATIONS ==========
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = {
    title: 'Arsip Surat Digital',
    body: 'Ada pembaruan baru',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'default',
    data: {
      url: '/',
      version: SW_VERSION,
    },
    actions: [
      { action: 'open', title: '🔍 Buka' },
      { action: 'dismiss', title: '❌ Tutup' },
    ],
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      data = { ...data, ...pushData };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, data)
  );
});

// ========== NOTIFICATION CLICK ==========
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { action, notification } = event;
  const urlToOpen = notification.data?.url || '/';

  if (action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Find existing window
        for (const client of windowClients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        return clients.openWindow(urlToOpen);
      })
  );
});

// ========== PERIODIC SYNC ==========
self.addEventListener('periodicsync', (event) => {
  console.log(`[SW] Periodic Sync: ${event.tag}`);

  switch (event.tag) {
    case 'check-updates':
      event.waitUntil(checkForUpdates());
      break;
    case 'refresh-cache':
      event.waitUntil(refreshCache());
      break;
    case 'sync-daily':
      event.waitUntil(dailyMaintenance());
      break;
  }
});

async function checkForUpdates() {
  try {
    const response = await fetch('/version.json?v=' + Date.now(), {
      cache: 'no-cache',
    });
    const data = await response.json();

    if (data.version !== SW_VERSION) {
      notifyClients({
        type: 'UPDATE_AVAILABLE',
        version: data.version,
      });
    }
  } catch (e) {
    console.error('[SW] Update check failed:', e);
  }
}

async function refreshCache() {
  const cache = await caches.open(CACHE_NAMES.static);
  for (const asset of PRECACHE_ASSETS) {
    try {
      const response = await fetch(asset, { cache: 'no-cache' });
      if (response.ok) {
        await cache.put(asset, response);
      }
    } catch (e) {
      console.warn(`[SW] Cache refresh failed for: ${asset}`);
    }
  }
}

async function dailyMaintenance() {
  await cleanOldCaches();
  await refreshCache();
}

// ========== MESSAGE HANDLER ==========
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(cleanAllCaches());
      break;
      
    case 'CLEAR_OLD_CACHE':
      event.waitUntil(cleanOldCaches());
      break;
      
    case 'GET_VERSION':
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          version: SW_VERSION,
          buildDate: BUILD_DATE,
        });
      }
      break;
      
    case 'GET_CACHE_SIZE':
      event.waitUntil(
        getCacheSize().then(size => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage(size);
          }
        })
      );
      break;
      
    case 'FORCE_UPDATE':
      event.waitUntil(
        Promise.all([
          self.skipWaiting(),
          refreshCache(),
        ])
      );
      break;
      
    case 'SYNC_NOW':
      event.waitUntil(syncAllPending());
      break;
      
    default:
      console.log(`[SW] Unknown message type: ${type}`);
  }
});

// ========== HELPER FUNCTIONS ==========

/**
 * Clean old caches
 */
async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const validCaches = Object.values(CACHE_NAMES);
  const prefixOnly = cacheNames.filter(name => name.startsWith(CACHE_PREFIX));

  const toDelete = prefixOnly.filter(name => !validCaches.includes(name));

  if (toDelete.length > 0) {
    console.log(`[SW] Cleaning ${toDelete.length} old caches:`, toDelete);
    await Promise.all(toDelete.map(name => caches.delete(name)));
  }
}

/**
 * Clean all caches
 */
async function cleanAllCaches() {
  const cacheNames = await caches.keys();
  console.log(`[SW] Cleaning all ${cacheNames.length} caches`);
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}

/**
 * Get total cache size
 */
async function getCacheSize() {
  let totalSize = 0;
  const cacheNames = await caches.keys();

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return {
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    cacheCount: cacheNames.length,
  };
}

/**
 * Notify all clients
 */
async function notifyClients(data) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => {
    client.postMessage(data);
  });
}

/**
 * Open IndexedDB
 */
function openIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ArsipSuratDB', 30);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingOps')) {
        db.createObjectStore('pendingOps', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'url' });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Initialize storage
 */
async function initStorage() {
  try {
    // Estimate and log storage
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      console.log(`[SW] Storage: ${formatBytes(estimate.usage || 0)} / ${formatBytes(estimate.quota || 0)}`);
    }

    // Enable persistent storage
    if (navigator.storage?.persist) {
      const isPersisted = await navigator.storage.persist();
      console.log(`[SW] Persistent storage: ${isPersisted ? '✅' : '❌'}`);
    }
  } catch (e) {
    console.warn('[SW] Storage init warning:', e);
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
}

// ========== LOG ==========
console.log(`[SW] Service Worker v${SW_VERSION} (${BUILD_DATE}) loaded`);
console.log(`[SW] Caches: ${Object.keys(CACHE_NAMES).length} | Pre-cache: ${PRECACHE_ASSETS.length} assets`);