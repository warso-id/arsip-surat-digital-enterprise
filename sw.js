/**
 * ============================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.1.0
 * Service Worker - STANDALONE PWA
 * ============================================
 * Fitur:
 * - Offline Caching
 * - Background Sync
 * - Push Notification
 * - Periodic Sync
 * - Cache Management
 */

// ========== CONFIGURATION ==========
const CONFIG = {
  VERSION: '3.1.0',
  BUILD_DATE: '2026-07-10',
  CACHE_NAME: 'arsip-surat-v3.1.0',
  RUNTIME_CACHE: 'arsip-surat-runtime-v3.1.0',
  
  // Daftar file yang akan di-cache saat install
  PRECACHE_ASSETS: [
    '/',
    '/login.html',
    '/index.html',
    '/setup.html',
    '/manifest.json',
    '/404.html'
  ],
  
  // Pola URL yang akan di-cache saat runtime
  RUNTIME_PATTERNS: [
    /\.(png|jpg|jpeg|gif|svg|ico|webp)$/i,
    /\.(css)$/i,
    /\.(js)$/i,
    /\.(woff|woff2|ttf|eot)$/i
  ],
  
  // URL API yang TIDAK di-cache (selalu fetch dari network)
  API_URL: 'script.google.com/macros/s',
  
  // Batas maksimum cache entries
  MAX_CACHE_ENTRIES: 100,
  MAX_CACHE_AGE: 7 * 24 * 60 * 60 * 1000, // 7 hari
};

// ========== INSTALL EVENT ==========
self.addEventListener('install', (event) => {
  console.log(`🔧 SW v${CONFIG.VERSION} - Installing...`);
  
  event.waitUntil(
    caches.open(CONFIG.CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching precache assets...');
        
        // Coba cache semua asset, tapi jangan gagal jika ada yang error
        return Promise.allSettled(
          CONFIG.PRECACHE_ASSETS.map((asset) => {
            return cache.add(asset).catch((error) => {
              console.warn(`⚠️ Failed to cache: ${asset}`, error.message);
            });
          })
        );
      })
      .then(() => {
        console.log('✅ Precache complete');
        // Force activation
        return self.skipWaiting();
      })
  );
});

// ========== ACTIVATE EVENT ==========
self.addEventListener('activate', (event) => {
  console.log(`🚀 SW v${CONFIG.VERSION} - Activating...`);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Hapus cache versi lama
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== CONFIG.CACHE_NAME && 
                     name !== CONFIG.RUNTIME_CACHE;
            })
            .map((name) => {
              console.log(`🗑️ Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('✅ Activation complete');
        // Claim semua clients
        return self.clients.claim();
      })
  );
});

// ========== FETCH EVENT - STRATEGI CACHE FIRST DENGAN NETWORK FALLBACK ==========
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip Google Apps Script API requests (selalu network first)
  if (request.url.includes(CONFIG.API_URL)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Skip chrome-extension dan browser internal requests
  if (!request.url.startsWith('http')) return;
  
  // Untuk halaman HTML - Network First
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Untuk static assets - Cache First
  if (isStaticAsset(request.url)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // Default: Network First
  event.respondWith(networkFirstStrategy(request));
});

// ========== CACHE FIRST STRATEGY ==========
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache di background (stale-while-revalidate)
    updateCache(request).catch(() => {});
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache valid response
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CONFIG.RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn(`⚠️ Fetch failed for: ${request.url}`);
    
    // Return custom offline response untuk image
    if (request.headers.get('accept')?.includes('image')) {
      return new Response(
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
           <rect width="200" height="200" fill="#E0E0E0"/>
           <text x="100" y="110" text-anchor="middle" font-size="40">📄</text>
           <text x="100" y="150" text-anchor="middle" font-size="14" fill="#757575">Offline</text>
         </svg>`,
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    throw error;
  }
}

// ========== NETWORK FIRST STRATEGY ==========
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache valid response
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CONFIG.CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn(`⚠️ Network failed, trying cache for: ${request.url}`);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Jika HTML, return halaman offline
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/404.html').then((response) => {
        return response || new Response(
          `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Offline</title>
           <meta name="viewport" content="width=device-width, initial-scale=1.0">
           <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#F5F5F5;text-align:center;}
           h1{color:#333;}p{color:#757575;}.btn{display:inline-block;margin-top:16px;padding:12px 24px;background:#1976D2;color:white;text-decoration:none;border-radius:8px;font-weight:600;}</style></head>
           <body><div><div style="font-size:80px;">📡</div><h1>Anda Sedang Offline</h1><p>Periksa koneksi internet Anda dan coba lagi.</p>
           <a href="/" class="btn" onclick="location.reload()">🔄 Coba Lagi</a></div></body></html>`,
          { headers: { 'Content-Type': 'text/html' } }
        );
      });
    }
    
    throw error;
  }
}

// ========== BACKGROUND SYNC ==========
self.addEventListener('sync', (event) => {
  console.log(`🔄 Background Sync: ${event.tag}`);
  
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests());
  }
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// ========== PUSH NOTIFICATION ==========
self.addEventListener('push', (event) => {
  console.log('📨 Push notification received');
  
  let data = {
    title: 'Arsip Surat Digital',
    body: 'Ada notifikasi baru',
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" rx="20" fill="%231976D2"/%3E%3Ctext x="50" y="70" font-size="50" text-anchor="middle" fill="white"%3E📄%3C/text%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%231976D2"/%3E%3Ctext x="50" y="70" font-size="50" text-anchor="middle" fill="white"%3E📄%3C/text%3E%3C/svg%3E',
    data: {
      url: '/index.html#notifikasi'
    }
  };
  
  if (event.data) {
    try {
      data = { ...data, ...JSON.parse(event.data.text()) };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 100, 200],
    data: data.data,
    actions: [
      {
        action: 'open',
        title: '🔍 Lihat'
      },
      {
        action: 'close',
        title: '✕ Tutup'
      }
    ],
    requireInteraction: false,
    silent: false,
    timestamp: Date.now()
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ========== NOTIFICATION CLICK ==========
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'close') return;
  
  const urlToOpen = event.notification.data?.url || '/index.html';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      // Cek jika sudah ada window yang terbuka
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: urlToOpen
          });
          return;
        }
      }
      
      // Buka window baru
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ========== MESSAGE FROM CLIENT ==========
self.addEventListener('message', (event) => {
  console.log('📨 Message from client:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      }).then(() => {
        console.log('🗑️ All caches cleared');
        // Kirim response ke client
        event.ports && event.ports[0] && event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATS') {
    event.waitUntil(
      getCacheStats().then((stats) => {
        event.ports && event.ports[0] && event.ports[0].postMessage(stats);
      })
    );
  }
});

// ========== PERIODIC SYNC ==========
self.addEventListener('periodicsync', (event) => {
  console.log(`🔄 Periodic Sync: ${event.tag}`);
  
  if (event.tag === 'check-updates') {
    event.waitUntil(checkForUpdates());
  }
});

// ========== HELPER FUNCTIONS ==========

// Cek apakah URL adalah static asset
function isStaticAsset(url) {
  return CONFIG.RUNTIME_PATTERNS.some((pattern) => pattern.test(url));
}

// Update cache di background (stale-while-revalidate)
async function updateCache(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CONFIG.RUNTIME_CACHE);
      cache.put(request, response);
    }
  } catch (error) {
    // Silent fail
  }
}

// Sync pending requests
async function syncPendingRequests() {
  try {
    // Buka IndexedDB untuk mengambil pending requests
    const db = await openDB();
    const pendingRequests = await getAllPendingRequests(db);
    
    for (const req of pendingRequests) {
      try {
        const response = await fetch(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body
        });
        
        if (response.ok) {
          await deletePendingRequest(db, req.id);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to sync request ${req.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Sync notifications
async function syncNotifications() {
  // Placeholder untuk sync notifikasi
  console.log('🔔 Syncing notifications...');
}

// Check for updates
async function checkForUpdates() {
  try {
    const response = await fetch('/manifest.json?check=' + Date.now(), {
      cache: 'no-cache'
    });
    
    if (response.ok) {
      const manifest = await response.json();
      console.log('📋 Current version:', manifest.version);
      
      // Notify clients if there's an update
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: 'VERSION_CHECK',
          version: manifest.version
        });
      });
    }
  } catch (error) {
    console.warn('⚠️ Update check failed:', error);
  }
}

// Get cache stats
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {
    caches: {},
    totalEntries: 0,
    totalSize: 0
  };
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    stats.caches[name] = {
      entries: keys.length,
      urls: keys.map((req) => req.url)
    };
    stats.totalEntries += keys.length;
  }
  
  return stats;
}

// Simple IndexedDB wrapper (untuk background sync)
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ArsipSuratSW', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingRequests')) {
        db.createObjectStore('pendingRequests', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

function getAllPendingRequests(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pendingRequests', 'readonly');
    const store = transaction.objectStore('pendingRequests');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deletePendingRequest(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pendingRequests', 'readwrite');
    const store = transaction.objectStore('pendingRequests');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ========== LOGGING ==========
console.log(`✅ Service Worker v${CONFIG.VERSION} - ${CONFIG.BUILD_DATE} - READY`);
console.log('📦 Cache Name:', CONFIG.CACHE_NAME);
console.log('📋 Precached Assets:', CONFIG.PRECACHE_ASSETS.length, 'files');
