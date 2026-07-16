/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Service Worker - PWA Support
 * ============================================================
 * Provides offline caching and background sync capabilities
 * ============================================================
 */

const CACHE_NAME = 'arsip-surat-enterprise-v3.0.0';
const RUNTIME_CACHE = 'arsip-surat-runtime-v3';
const API_CACHE = 'arsip-surat-api-v3';

// Resources to pre-cache
const PRE_CACHE_URLS = [
    '/',
    '/index.html',
    '/login.html',
    '/dashboard.html',
    '/surat-masuk.html',
    '/surat-keluar.html',
    '/disposisi.html',
    '/laporan.html',
    '/admin.html',
    '/profile.html',
    '/404.html',
    '/offline.html',
    '/src/public/js/enterprise-core.js',
    '/src/public/css/enterprise.css',
    '/src/manifest.json',
];

// Install event - pre-cache critical resources
self.addEventListener('install', (event) => {
    console.log('📱 Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Pre-caching resources...');
                return cache.addAll(PRE_CACHE_URLS);
            })
            .then(() => {
                console.log('✅ Pre-caching complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Pre-cache error:', error);
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('📱 Service Worker: Activating...');
    
    const currentCaches = [CACHE_NAME, RUNTIME_CACHE, API_CACHE];
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (!currentCaches.includes(cacheName)) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, then network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    // Skip Google Apps Script API calls (they're handled by JSONP)
    if (url.href.includes('script.google.com')) return;
    
    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) return;
    
    // Strategy: Network First for HTML, Cache First for assets
    if (request.headers.get('Accept')?.includes('text/html')) {
        // HTML - Network first, fallback to cache, then offline page
        event.respondWith(networkFirstStrategy(request));
    } else if (
        request.url.includes('/src/') ||
        request.url.includes('.css') ||
        request.url.includes('.js') ||
        request.url.includes('.png') ||
        request.url.includes('.jpg') ||
        request.url.includes('.svg') ||
        request.url.includes('.ico')
    ) {
        // Assets - Cache first, fallback to network
        event.respondWith(cacheFirstStrategy(request));
    } else if (request.url.includes('/api/') || request.headers.get('Accept')?.includes('application/json')) {
        // API calls - Network first with cache fallback
        event.respondWith(networkFirstWithCacheStrategy(request));
    } else {
        // Default - Network first
        event.respondWith(networkFirstStrategy(request));
    }
});

/**
 * Network First Strategy
 * Try network first, fallback to cache, then offline page
 */
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache the response
        if (networkResponse.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('⚠️ Network failed, trying cache:', request.url);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If HTML request fails, show offline page
        if (request.headers.get('Accept')?.includes('text/html')) {
            return caches.match('/offline.html');
        }
        
        throw error;
    }
}

/**
 * Cache First Strategy
 * Try cache first, fallback to network
 */
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // Update cache in background
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    caches.open(RUNTIME_CACHE)
                        .then((cache) => cache.put(request, response));
                }
            })
            .catch(() => {});
        
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ Both cache and network failed:', request.url);
        throw error;
    }
}

/**
 * Network First with Cache Fallback Strategy (for API calls)
 */
async function networkFirstWithCacheStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('⚠️ API offline, using cached data');
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline JSON response
        return new Response(
            JSON.stringify({
                success: false,
                message: 'Anda sedang offline. Data akan disinkronkan saat koneksi tersedia.',
                offline: true,
                timestamp: new Date().toISOString()
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Background Sync
self.addEventListener('sync', (event) => {
    console.log('🔄 Background Sync triggered:', event.tag);
    
    if (event.tag === 'sync-surat') {
        event.waitUntil(syncPendingRequests());
    }
    
    if (event.tag === 'sync-logs') {
        event.waitUntil(syncPendingLogs());
    }
});

/**
 * Sync pending requests stored in IndexedDB
 */
async function syncPendingRequests() {
    try {
        // Open IndexedDB
        const db = await openDatabase();
        const transaction = db.transaction(['pending_requests'], 'readonly');
        const store = transaction.objectStore('pending_requests');
        const requests = await store.getAll();
        
        if (requests.length === 0) {
            console.log('✅ No pending requests to sync');
            return;
        }
        
        console.log(`🔄 Syncing ${requests.length} pending requests...`);
        
        // Send each pending request
        for (const request of requests) {
            try {
                const response = await fetch(request.url, {
                    method: request.method,
                    headers: request.headers,
                    body: request.body
                });
                
                if (response.ok) {
                    // Remove from pending
                    const deleteTx = db.transaction(['pending_requests'], 'readwrite');
                    const deleteStore = deleteTx.objectStore('pending_requests');
                    await deleteStore.delete(request.id);
                    console.log('✅ Synced:', request.id);
                }
            } catch (error) {
                console.error('❌ Failed to sync:', request.id, error);
            }
        }
    } catch (error) {
        console.error('❌ Background sync failed:', error);
    }
}

async function syncPendingLogs() {
    // Similar to syncPendingRequests but for activity logs
    console.log('🔄 Syncing activity logs...');
}

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ArsipSuratEnterprise', 3);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Push Notification
self.addEventListener('push', (event) => {
    console.log('📨 Push notification received');
    
    let data = {
        title: 'Arsip Surat Digital',
        body: 'Ada notifikasi baru untuk Anda',
        icon: '/src/public/img/icon-192x192.png',
        badge: '/src/public/img/badge-72x72.png',
        data: {
            url: '/dashboard.html'
        }
    };
    
    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (error) {
            console.error('Push data parse error:', error);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            badge: data.badge,
            vibrate: [200, 100, 200],
            data: data.data,
            actions: [
                { action: 'open', title: 'Buka' },
                { action: 'close', title: 'Tutup' }
            ]
        })
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        const url = event.notification.data?.url || '/dashboard.html';
        
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    // If window is already open, focus it
                    for (const client of clientList) {
                        if (client.url.includes(url) && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // Otherwise open new window
                    if (clients.openWindow) {
                        return clients.openWindow(url);
                    }
                })
        );
    }
});

// Message handler from main thread
self.addEventListener('message', (event) => {
    console.log('📨 Message from main thread:', event.data);
    
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
    
    if (event.data.action === 'clearCache') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});

console.log('📱 Service Worker: Ready!');
