// Service Worker for Arsip Surat Digital PWA

const CACHE_NAME = 'arsip-surat-v2.0.0';
const STATIC_CACHE = 'arsip-surat-static-v2.0.0';
const DYNAMIC_CACHE = 'arsip-surat-dynamic-v2.0.0';
const API_CACHE = 'arsip-surat-api-v2.0.0';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/dashboard',
    '/login',
    '/css/app.css',
    '/css/dashboard.css',
    '/css/surat.css',
    '/css/print.css',
    '/js/app.js',
    '/js/dashboard.js',
    '/js/surat.js',
    '/js/disposisi.js',
    '/js/laporan.js',
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
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js'
];

// Install event
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Skip waiting');
                return self.skipWaiting();
            })
    );
});

// Activate event
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== API_CACHE) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Claiming clients');
                return self.clients.claim();
            })
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // API requests - Network first, then cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstStrategy(request, API_CACHE));
        return;
    }
    
    // Static assets - Cache first
    if (STATIC_ASSETS.includes(request.url) || 
        request.url.includes('/css/') || 
        request.url.includes('/js/') || 
        request.url.includes('/assets/')) {
        event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
        return;
    }
    
    // HTML pages - Network first
    if (request.headers.get('Accept')?.includes('text/html')) {
        event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
        return;
    }
    
    // Other requests - Network first
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

// Cache first strategy
async function cacheFirstStrategy(request, cacheName) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // Return offline page for HTML requests
        if (request.headers.get('Accept')?.includes('text/html')) {
            return caches.match('/offline.html');
        }
        throw error;
    }
}

// Network first strategy
async function networkFirstStrategy(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[Service Worker] Network failed, using cache:', request.url);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for HTML requests
        if (request.headers.get('Accept')?.includes('text/html')) {
            return caches.match('/offline.html');
        }
        
        // Return error response for API
        if (request.url.includes('/api/')) {
            return new Response(
                JSON.stringify({
                    status: 'error',
                    message: 'Anda sedang offline'
                }),
                {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        throw error;
    }
}

// Push notification event
self.addEventListener('push', event => {
    console.log('[Service Worker] Push received');
    
    let data = {
        title: 'Arsip Surat Digital',
        body: 'Ada notifikasi baru',
        icon: '/assets/images/icon-192x192.svg',
        badge: '/assets/images/icon-72x72.svg',
        data: {
            url: '/dashboard'
        }
    };
    
    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            console.error('Error parsing push data:', e);
        }
    }
    
    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        data: data.data,
        vibrate: [200, 100, 200],
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
        tag: 'arsip-surat-notification',
        renotify: true,
        requireInteraction: false
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Notification click');
    
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    const url = event.notification.data?.url || '/dashboard';
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then(clientList => {
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

// Background sync
self.addEventListener('sync', event => {
    console.log('[Service Worker] Background sync:', event.tag);
    
    if (event.tag === 'sync-surat') {
        event.waitUntil(syncPendingSurat());
    }
});

// Sync pending surat
async function syncPendingSurat() {
    try {
        const cache = await caches.open('pending-surat');
        const requests = await cache.keys();
        
        for (const request of requests) {
            try {
                const response = await cache.match(request);
                const data = await response.json();
                
                await fetch(request.url, {
                    method: request.method,
                    headers: request.headers,
                    body: JSON.stringify(data)
                });
                
                await cache.delete(request);
            } catch (error) {
                console.error('Error syncing request:', error);
            }
        }
    } catch (error) {
        console.error('Error in sync:', error);
    }
}
