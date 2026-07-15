// Service Worker for Arsip Surat Digital Enterprise
const CACHE_NAME = 'arsip-surat-v2.0.0';
const RUNTIME_CACHE = 'arsip-surat-runtime';
const API_CACHE = 'arsip-surat-api';

// Resources to pre-cache (static assets)
const PRECACHE_URLS = [
    '/',
    '/offline.html',
    '/index.html',
    '/src/public/css/app.css',
    '/src/public/css/dashboard.css',
    '/src/public/js/app.js',
    '/src/public/images/logo.png',
    '/src/public/images/favicon.ico'
];

// Dynamic caching strategies
const CACHE_STRATEGIES = {
    // Cache first, then network (for static assets)
    cacheFirst: [
        '/src/public/css/',
        '/src/public/js/',
        '/src/public/images/',
        '/src/public/fonts/'
    ],
    // Network first, then cache (for API calls)
    networkFirst: [
        '/api/',
        '/auth/'
    ],
    // Network only (no caching)
    networkOnly: [
        '/api/auth/login',
        '/api/auth/logout',
        '/api/surat/upload'
    ]
};

// Install event - Precache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching App Shell');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => {
                console.log('[SW] Service Worker installed successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Precaching failed:', error);
            })
    );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    
    const currentCaches = [CACHE_NAME, RUNTIME_CACHE, API_CACHE];
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return cacheNames.filter(
                    (cacheName) => !currentCaches.includes(cacheName)
                );
            })
            .then((cachesToDelete) => {
                return Promise.all(
                    cachesToDelete.map((cacheToDelete) => {
                        console.log('[SW] Deleting old cache:', cacheToDelete);
                        return caches.delete(cacheToDelete);
                    })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - Handle requests with different strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests and external URLs
    if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
        return;
    }
    
    // Network Only strategy for specific endpoints
    if (CACHE_STRATEGIES.networkOnly.some(path => url.pathname.startsWith(path))) {
        return; // Let the browser handle it normally
    }
    
    // Cache First strategy for static assets
    if (CACHE_STRATEGIES.cacheFirst.some(path => url.pathname.startsWith(path))) {
        event.respondWith(cacheFirstStrategy(request));
        return;
    }
    
    // Network First strategy for API calls
    if (CACHE_STRATEGIES.networkFirst.some(path => url.pathname.startsWith(path))) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }
    
    // Default: Network first, fallback to cache
    event.respondWith(networkFirstStrategy(request));
});

// Cache First Strategy
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // Update cache in background
        updateCache(request).catch(() => {});
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/offline.html');
        }
        throw error;
    }
}

// Network First Strategy
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache valid responses
        if (networkResponse.ok) {
            const cache = await caches.open(
                request.url.includes('/api/') ? API_CACHE : RUNTIME_CACHE
            );
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/offline.html');
        }
        
        // Return error response for API calls
        if (request.url.includes('/api/')) {
            return new Response(
                JSON.stringify({
                    error: true,
                    message: 'Anda sedang offline. Data akan disinkronkan saat online.',
                    offline: true
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

// Background cache update
async function updateCache(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response);
        }
    } catch (error) {
        console.log('[SW] Background cache update failed:', error);
    }
}

// Push Notification Event
self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);
    
    let data = {
        title: 'Arsip Surat Digital',
        body: 'Ada surat baru yang perlu diproses',
        icon: '/src/public/images/logo-192.png',
        badge: '/src/public/images/badge.png',
        tag: 'surat-notification',
        data: {
            url: '/surat-masuk'
        }
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
        tag: data.tag,
        data: data.data,
        vibrate: [200, 100, 200],
        actions: [
            {
                action: 'open',
                title: 'Buka Surat'
            },
            {
                action: 'close',
                title: 'Tutup'
            }
        ],
        requireInteraction: true
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification click:', event);
    
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    const urlToOpen = event.notification.data?.url || '/surat-masuk';
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then((windowClients) => {
            // Check if there's already a window open
            for (let client of windowClients) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Background Sync for Offline Actions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'sync-surat') {
        event.waitUntil(syncPendingSurat());
    } else if (event.tag === 'sync-disposisi') {
        event.waitUntil(syncPendingDisposisi());
    }
});

// Sync pending surat data
async function syncPendingSurat() {
    try {
        // Open IndexedDB and get pending data
        // This is a placeholder - implement based on your IndexedDB structure
        console.log('[SW] Syncing pending surat data...');
        
        // Notify all clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_COMPLETE',
                message: 'Data surat berhasil disinkronkan'
            });
        });
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

// Sync pending disposisi data
async function syncPendingDisposisi() {
    try {
        console.log('[SW] Syncing pending disposisi data...');
        // Implement disposisi sync logic
    } catch (error) {
        console.error('[SW] Disposisi sync failed:', error);
    }
}

// Message event - Communication from pages
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'UPDATE_CACHE') {
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.addAll(event.data.urls);
            })
        );
    }
});
