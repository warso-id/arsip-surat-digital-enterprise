/* ============================================
   ENTERPRISE PWA SERVICE WORKER
   ============================================ */
const CACHE_NAME = 'arsip-surat-v2026.1.0';
const RUNTIME_CACHE = 'arsip-surat-runtime';
const API_CACHE = 'arsip-surat-api';

const PRECACHE_URLS = [
    '/arsip-surat-digital-enterprise/',
    '/arsip-surat-digital-enterprise/index.html',
    '/arsip-surat-digital-enterprise/offline.html',
    '/arsip-surat-digital-enterprise/404.html',
    '/arsip-surat-digital-enterprise/assets/css/app.css',
    '/arsip-surat-digital-enterprise/assets/css/dashboard.css',
    '/arsip-surat-digital-enterprise/assets/css/surat.css',
    '/arsip-surat-digital-enterprise/assets/css/print.css',
    '/arsip-surat-digital-enterprise/assets/js/config.js',
    '/arsip-surat-digital-enterprise/assets/js/database.js',
    '/arsip-surat-digital-enterprise/assets/js/api.js',
    '/arsip-surat-digital-enterprise/assets/js/auth.js',
    '/arsip-surat-digital-enterprise/assets/js/router.js',
    '/arsip-surat-digital-enterprise/assets/js/app.js',
    '/arsip-surat-digital-enterprise/assets/js/dashboard.js',
    '/arsip-surat-digital-enterprise/assets/js/surat.js',
    '/arsip-surat-digital-enterprise/assets/js/disposisi.js',
    '/arsip-surat-digital-enterprise/assets/js/laporan.js',
    '/arsip-surat-digital-enterprise/assets/js/components/spinner.js',
    '/arsip-surat-digital-enterprise/assets/images/icon-192x192.svg',
    '/arsip-surat-digital-enterprise/assets/images/icon-512x512.svg',
    '/arsip-surat-digital-enterprise/assets/images/favicon.svg',
    '/arsip-surat-digital-enterprise/assets/images/logo.svg',
    '/arsip-surat-digital-enterprise/assets/images/default-avatar.svg',
    '/arsip-surat-digital-enterprise/manifest.json'
];

// Install Event - Precache critical resources
self.addEventListener('install', event => {
    console.log('[SW] Installing Service Worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Precaching app shell');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => {
                console.log('[SW] Skip waiting');
                return self.skipWaiting();
            })
    );
});

// Activate Event - Clean old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating Service Worker...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && 
                        cacheName !== RUNTIME_CACHE && 
                        cacheName !== API_CACHE) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Claiming clients');
            return self.clients.claim();
        }).then(() => {
            // Notify clients about update
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'SW_ACTIVATED',
                        version: '2026.1.0'
                    });
                });
            });
        })
    );
});

// Fetch Event - Network First with Cache Fallback
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and browser extensions
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }

    // API requests - Network First with offline queue
    if (url.href.includes('script.google.com') || url.href.includes('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // Navigation requests - Network First with offline fallback
    if (request.mode === 'navigate') {
        event.respondWith(handleNavigationRequest(request));
        return;
    }

    // Static assets - Cache First
    event.respondWith(handleStaticRequest(request));
});

// Handle API requests
async function handleApiRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful GET responses
        if (networkResponse.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline API response
        return new Response(JSON.stringify({
            success: false,
            offline: true,
            message: 'Anda sedang offline. Data akan disinkronkan saat online.',
            data: null
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache the response
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, networkResponse.clone());
        
        return networkResponse;
    } catch (error) {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline page for navigation
        const offlineResponse = await caches.match(
            '/arsip-surat-digital-enterprise/offline.html'
        );
        
        if (offlineResponse) {
            return offlineResponse;
        }

        // Ultimate fallback
        return new Response(
            '<html><body><h1>Offline</h1><p>Silakan periksa koneksi internet Anda.</p></body></html>',
            {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            }
        );
    }
}

// Handle static assets - Cache First with Network Update
async function handleStaticRequest(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // Update cache in background
        fetch(request).then(response => {
            if (response.ok) {
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, response);
                });
            }
        }).catch(() => {
            // Silently fail background updates
        });
        
        return cachedResponse;
    }

    // Not in cache, try network
    try {
        const networkResponse = await fetch(request);
        
        // Cache for future
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Return placeholder for images
        if (request.destination === 'image') {
            return new Response(
                `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
                    <rect width="200" height="200" fill="#f0f0f0"/>
                    <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">No Image</text>
                </svg>`,
                { headers: { 'Content-Type': 'image/svg+xml' } }
            );
        }

        // Return error for other assets
        return new Response('Resource unavailable offline', { status: 408 });
    }
}

// Background Sync
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncPendingData());
    }
});

async function syncPendingData() {
    console.log('[SW] Starting background sync...');
    
    try {
        const clients = await self.clients.matchAll();
        if (clients.length > 0) {
            clients[0].postMessage({
                type: 'SYNC_STARTED'
            });
        }

        // Trigger sync in the main app
        if (clients.length > 0) {
            clients[0].postMessage({
                type: 'PROCESS_SYNC'
            });
        }

        console.log('[SW] Background sync completed');
    } catch (error) {
        console.error('[SW] Background sync failed:', error);
    }
}

// Push Notifications
self.addEventListener('push', event => {
    console.log('[SW] Push received:', event);
    
    let data = {
        title: 'Arsip Surat Digital',
        body: 'Ada pembaruan baru',
        icon: '/arsip-surat-digital-enterprise/assets/images/icon-192x192.svg',
        badge: '/arsip-surat-digital-enterprise/assets/images/icon-192x192.svg'
    };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/arsip-surat-digital-enterprise/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification Click
self.addEventListener('notificationclick', event => {
    console.log('[SW] Notification click:', event);
    
    event.notification.close();

    const url = event.notification.data?.url || '/arsip-surat-digital-enterprise/';

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url.includes(url) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-data') {
        event.waitUntil(updateCachedData());
    }
});

async function updateCachedData() {
    console.log('[SW] Periodic background sync...');
    
    try {
        const cache = await caches.open(API_CACHE);
        const requests = await cache.keys();
        
        for (const request of requests) {
            try {
                const response = await fetch(request);
                if (response.ok) {
                    await cache.put(request, response);
                }
            } catch (error) {
                console.error('[SW] Failed to update:', request.url);
            }
        }
    } catch (error) {
        console.error('[SW] Periodic sync failed:', error);
    }
}

// Message handling
self.addEventListener('message', event => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            })
        );
    }
});

console.log('[SW] Enterprise Service Worker Loaded - v2026.1.0');
