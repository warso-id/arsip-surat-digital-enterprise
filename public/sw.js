// ============================================
// Service Worker - Arsip Surat Digital Enterprise
// Version: 2.0.0
// ============================================

const CACHE_VERSION = 'v2.0.0';
const STATIC_CACHE = `arsip-surat-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `arsip-surat-dynamic-${CACHE_VERSION}`;
const API_CACHE = `arsip-surat-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `arsip-surat-images-${CACHE_VERSION}`;
const FONT_CACHE = `arsip-surat-fonts-${CACHE_VERSION}`;

// Assets yang akan di-cache saat install
const STATIC_ASSETS = [
    '/',
    '/offline.html',
    '/manifest.json',
    '/css/app.css',
    '/css/dashboard.css',
    '/css/surat.css',
    '/css/print.css',
    '/js/app.js',
    '/js/dashboard.js',
    '/js/surat.js',
    '/js/disposisi.js',
    '/js/laporan.js',
    '/js/components/SpinnerComponent.js',
    '/assets/images/icon-72x72.svg',
    '/assets/images/icon-96x96.svg',
    '/assets/images/icon-128x128.svg',
    '/assets/images/icon-144x144.svg',
    '/assets/images/icon-152x152.svg',
    '/assets/images/icon-192x192.svg',
    '/assets/images/icon-384x384.svg',
    '/assets/images/icon-512x512.svg',
    '/assets/images/logo.svg',
    '/assets/images/favicon.svg',
    '/assets/images/default-avatar.svg',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js@4.3.0/dist/chart.umd.min.js'
];

// Assets yang harus selalu diambil dari network (tidak di-cache)
const NETWORK_ONLY = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/refresh-token'
];

// Assets yang menggunakan strategi network first
const NETWORK_FIRST = [
    '/api/',
    '/dashboard',
    '/surat-masuk',
    '/surat-keluar',
    '/disposisi',
    '/laporan'
];

// ============================================
// INSTALL EVENT
// ============================================
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE)
                .then((cache) => {
                    console.log('[SW] Caching static assets...');
                    return cache.addAll(STATIC_ASSETS)
                        .then(() => {
                            console.log('[SW] Static assets cached successfully');
                        })
                        .catch((error) => {
                            console.error('[SW] Failed to cache some static assets:', error);
                            // Continue even if some assets fail to cache
                        });
                }),
            
            // Cache fonts
            caches.open(FONT_CACHE)
                .then((cache) => {
                    return cache.addAll([
                        'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/fonts/bootstrap-icons.woff2',
                        'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/fonts/bootstrap-icons.woff'
                    ]).catch(() => {
                        // Font caching is optional
                    });
                })
        ])
        .then(() => {
            console.log('[SW] Installation complete, skipping waiting...');
            return self.skipWaiting();
        })
    );
});

// ============================================
// ACTIVATE EVENT
// ============================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                // Hapus cache lama yang tidak digunakan
                const validCaches = [
                    STATIC_CACHE,
                    DYNAMIC_CACHE,
                    API_CACHE,
                    IMAGE_CACHE,
                    FONT_CACHE
                ];
                
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            // Hapus cache dengan prefix yang sama tapi versi berbeda
                            const isOldCache = cacheName.startsWith('arsip-surat-') && 
                                              !validCaches.includes(cacheName);
                            return isOldCache;
                        })
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
            .then(() => {
                // Kirim pesan ke semua client bahwa SW sudah aktif
                return self.clients.matchAll().then((clients) => {
                    clients.forEach((client) => {
                        client.postMessage({
                            type: 'SW_ACTIVATED',
                            version: CACHE_VERSION
                        });
                    });
                });
            })
    );
});

// ============================================
// FETCH EVENT
// ============================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension requests
    if (url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Network only untuk auth endpoints
    if (NETWORK_ONLY.some(path => url.pathname.startsWith(path))) {
        event.respondWith(fetch(request));
        return;
    }
    
    // Strategi untuk API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstStrategy(request, API_CACHE));
        return;
    }
    
    // Strategi untuk halaman HTML
    if (request.headers.get('Accept')?.includes('text/html')) {
        event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
        return;
    }
    
    // Strategi untuk static assets (CSS, JS, images)
    if (
        request.url.match(/\.(css|js)$/) ||
        url.pathname.startsWith('/assets/') ||
        url.pathname.startsWith('/css/') ||
        url.pathname.startsWith('/js/')
    ) {
        event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
        return;
    }
    
    // Strategi untuk images
    if (
        request.url.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/) ||
        url.pathname.startsWith('/uploads/')
    ) {
        event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
        return;
    }
    
    // Strategi untuk fonts
    if (
        request.url.match(/\.(woff|woff2|ttf|eot)$/) ||
        url.pathname.includes('fonts')
    ) {
        event.respondWith(cacheFirstStrategy(request, FONT_CACHE));
        return;
    }
    
    // Default: network first
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

// ============================================
// CACHE STRATEGIES
// ============================================

/**
 * Cache First Strategy
 * Cek cache dulu, jika tidak ada baru fetch dari network
 */
async function cacheFirstStrategy(request, cacheName) {
    try {
        // Cek di cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            // Update cache di background (stale-while-revalidate)
            updateCacheInBackground(request, cacheName);
            return cachedResponse;
        }
        
        // Fetch dari network
        const networkResponse = await fetch(request);
        
        // Cache response jika valid
        if (isValidResponse(networkResponse)) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Cache first failed:', error);
        
        // Return cached response jika ada
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page untuk HTML requests
        if (request.headers.get('Accept')?.includes('text/html')) {
            return caches.match('/offline.html');
        }
        
        // Return placeholder untuk images
        if (request.url.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
            return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#999" font-size="12">No Image</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
            );
        }
        
        throw error;
    }
}

/**
 * Network First Strategy
 * Coba fetch dari network dulu, jika gagal baru cek cache
 */
async function networkFirstStrategy(request, cacheName) {
    try {
        // Coba fetch dari network dengan timeout
        const networkResponse = await fetchWithTimeout(request, 10000);
        
        // Cache response jika valid
        if (isValidResponse(networkResponse)) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network first failed, trying cache:', request.url);
        
        // Cek di cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page untuk HTML requests
        if (request.headers.get('Accept')?.includes('text/html')) {
            return caches.match('/offline.html');
        }
        
        // Return error response untuk API
        if (request.url.includes('/api/')) {
            return new Response(
                JSON.stringify({
                    status: 'error',
                    message: 'Anda sedang offline. Data akan disinkronisasi saat koneksi kembali.',
                    offline: true,
                    timestamp: new Date().toISOString()
                }),
                {
                    status: 503,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Offline': 'true'
                    }
                }
            );
        }
        
        throw error;
    }
}

/**
 * Network Only Strategy
 * Selalu fetch dari network, tidak menggunakan cache
 */
async function networkOnlyStrategy(request) {
    try {
        return await fetch(request);
    } catch (error) {
        throw error;
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Fetch dengan timeout
 */
async function fetchWithTimeout(request, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(request, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Cek apakah response valid untuk di-cache
 */
function isValidResponse(response) {
    return response && 
           response.status === 200 && 
           response.type === 'basic' || 
           response.type === 'cors';
}

/**
 * Update cache di background (stale-while-revalidate)
 */
async function updateCacheInBackground(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        
        if (isValidResponse(networkResponse)) {
            const cache = await caches.open(cacheName);
            await cache.put(request, networkResponse);
        }
    } catch (error) {
        // Silent fail - cache will be updated next time
    }
}

// ============================================
// BACKGROUND SYNC
// ============================================

/**
 * Simpan request untuk background sync
 */
async function saveRequestForSync(request) {
    try {
        const cache = await caches.open('arsip-surat-pending-sync');
        const serialized = await serializeRequest(request);
        await cache.put(
            `/__pending/${Date.now()}`,
            new Response(JSON.stringify(serialized))
        );
    } catch (error) {
        console.error('[SW] Failed to save request for sync:', error);
    }
}

/**
 * Serialize request untuk disimpan
 */
async function serializeRequest(request) {
    const headers = {};
    request.headers.forEach((value, key) => {
        headers[key] = value;
    });
    
    return {
        url: request.url,
        method: request.method,
        headers: headers,
        body: request.method !== 'GET' ? await request.text() : null
    };
}

/**
 * Background sync event
 */
self.addEventListener('sync', (event) => {
    console.log('[SW] Background Sync triggered:', event.tag);
    
    if (event.tag === 'sync-surat-keluar') {
        event.waitUntil(syncPendingSuratKeluar());
    } else if (event.tag === 'sync-disposisi') {
        event.waitUntil(syncPendingDisposisi());
    } else if (event.tag === 'sync-all') {
        event.waitUntil(syncAllPending());
    }
});

/**
 * Sync pending surat keluar
 */
async function syncPendingSuratKeluar() {
    try {
        const cache = await caches.open('arsip-surat-pending-sync');
        const keys = await cache.keys();
        
        for (const request of keys) {
            try {
                const response = await cache.match(request);
                const data = await response.json();
                
                await fetch(data.url, {
                    method: data.method,
                    headers: data.headers,
                    body: data.body
                });
                
                await cache.delete(request);
            } catch (error) {
                console.error('[SW] Failed to sync request:', error);
            }
        }
        
        // Notify clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_COMPLETED',
                tag: 'sync-surat-keluar'
            });
        });
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

/**
 * Sync pending disposisi
 */
async function syncPendingDisposisi() {
    // Similar to syncPendingSuratKeluar
    console.log('[SW] Syncing pending disposisi...');
}

/**
 * Sync all pending requests
 */
async function syncAllPending() {
    await Promise.all([
        syncPendingSuratKeluar(),
        syncPendingDisposisi()
    ]);
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================

/**
 * Push event
 */
self.addEventListener('push', (event) => {
    console.log('[SW] Push received');
    
    let notificationData = {
        title: 'Arsip Surat Digital',
        body: 'Ada notifikasi baru',
        icon: '/assets/images/icon-192x192.svg',
        badge: '/assets/images/icon-72x72.svg',
        image: '/assets/images/logo.svg',
        tag: 'arsip-surat-notification',
        data: {
            url: '/dashboard',
            date: new Date().toISOString()
        },
        actions: [
            {
                action: 'open',
                title: 'Buka'
            },
            {
                action: 'close',
                title: 'Tutup'
            }
        ],
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: false,
        renotify: false,
        silent: false,
        timestamp: Date.now()
    };
    
    if (event.data) {
        try {
            const pushData = event.data.json();
            notificationData = {
                ...notificationData,
                ...pushData,
                data: {
                    ...notificationData.data,
                    ...(pushData.data || {})
                }
            };
        } catch (e) {
            // If not JSON, use text as body
            notificationData.body = event.data.text();
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(
            notificationData.title,
            {
                body: notificationData.body,
                icon: notificationData.icon,
                badge: notificationData.badge,
                image: notificationData.image,
                tag: notificationData.tag,
                data: notificationData.data,
                actions: notificationData.actions,
                vibrate: notificationData.vibrate,
                requireInteraction: notificationData.requireInteraction,
                renotify: notificationData.renotify,
                silent: notificationData.silent,
                timestamp: notificationData.timestamp
            }
        )
    );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    const urlToOpen = event.notification.data?.url || '/dashboard';
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then((clientList) => {
            // Cari window yang sudah terbuka
            for (const client of clientList) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Buka window baru
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

/**
 * Notification close event
 */
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed');
});

// ============================================
// MESSAGE HANDLING
// ============================================

/**
 * Message event dari client
 */
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    if (!event.data || !event.data.type) return;
    
    switch (event.data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_URL':
            if (event.data.url) {
                event.waitUntil(
                    caches.open(DYNAMIC_CACHE)
                        .then(cache => cache.add(event.data.url))
                );
            }
            break;
            
        case 'CLEAR_CACHE':
            event.waitUntil(
                caches.keys().then(cacheNames => {
                    return Promise.all(
                        cacheNames.map(name => caches.delete(name))
                    );
                })
            );
            break;
            
        case 'GET_VERSION':
            if (event.ports && event.ports[0]) {
                event.ports[0].postMessage({
                    version: CACHE_VERSION,
                    timestamp: Date.now()
                });
            }
            break;
            
        case 'SAVE_FOR_SYNC':
            if (event.data.request) {
                event.waitUntil(
                    saveRequestForSync(event.data.request)
                );
            }
            break;
            
        case 'REGISTER_SYNC':
            if (event.data.tag && 'sync' in self.registration) {
                event.waitUntil(
                    self.registration.sync.register(event.data.tag)
                );
            }
            break;
            
        default:
            console.log('[SW] Unknown message type:', event.data.type);
    }
});

// ============================================
// PERIODIC SYNC (jika didukung)
// ============================================

/**
 * Periodic background sync
 */
self.addEventListener('periodicsync', (event) => {
    console.log('[SW] Periodic sync triggered:', event.tag);
    
    if (event.tag === 'check-updates') {
        event.waitUntil(checkForUpdates());
    } else if (event.tag === 'clean-caches') {
        event.waitUntil(cleanOldCaches());
    }
});

/**
 * Check for updates
 */
async function checkForUpdates() {
    try {
        // Fetch latest version info
        const response = await fetch('/api/version');
        const data = await response.json();
        
        // Notify clients if new version available
        if (data.version !== CACHE_VERSION) {
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'UPDATE_AVAILABLE',
                    version: data.version
                });
            });
        }
    } catch (error) {
        console.error('[SW] Update check failed:', error);
    }
}

/**
 * Clean old caches
 */
async function cleanOldCaches() {
    const cacheNames = await caches.keys();
    const validCaches = [
        STATIC_CACHE,
        DYNAMIC_CACHE,
        API_CACHE,
        IMAGE_CACHE,
        FONT_CACHE
    ];
    
    for (const cacheName of cacheNames) {
        if (cacheName.startsWith('arsip-surat-') && !validCaches.includes(cacheName)) {
            await caches.delete(cacheName);
        }
    }
}

// ============================================
// CACHE SIZE MANAGEMENT
// ============================================

/**
 * Get cache size
 */
async function getCacheSize(cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        let totalSize = 0;
        
        for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
        
        return totalSize;
    } catch (error) {
        console.error('[SW] Failed to get cache size:', error);
        return 0;
    }
}

/**
 * Get total cache size
 */
async function getTotalCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
        totalSize += await getCacheSize(cacheName);
    }
    
    return totalSize;
}

/**
 * Trim cache if too large
 */
async function trimCacheIfNeeded(cacheName, maxSize = 50 * 1024 * 1024) {
    const size = await getCacheSize(cacheName);
    
    if (size > maxSize) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        // Hapus 20% entry terlama
        const deleteCount = Math.ceil(keys.length * 0.2);
        for (let i = 0; i < deleteCount; i++) {
            await cache.delete(keys[i]);
        }
    }
}

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Global error handler
 */
self.addEventListener('error', (event) => {
    console.error('[SW] Global error:', event.error);
});

/**
 * Unhandled rejection handler
 */
self.addEventListener('unhandledrejection', (event) => {
    console.error('[SW] Unhandled rejection:', event.reason);
    event.preventDefault();
});

// ============================================
// EXPORT (untuk testing)
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        cacheFirstStrategy,
        networkFirstStrategy,
        networkOnlyStrategy,
        fetchWithTimeout,
        isValidResponse,
        updateCacheInBackground,
        getCacheSize,
        getTotalCacheSize
    };
}

console.log('[SW] Service Worker loaded successfully - Version:', CACHE_VERSION);
