// Service Worker untuk PWA
const CACHE_NAME = 'asde-cache-v2026.1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/assets/css/app.css',
    '/assets/css/dashboard.css',
    '/assets/css/surat.css',
    '/assets/js/config.js',
    '/assets/js/api.js',
    '/assets/js/auth.js',
    '/assets/js/database.js',
    '/assets/js/app.js',
    '/assets/js/dashboard.js',
    '/assets/js/surat.js',
    '/assets/js/disposisi.js',
    '/assets/js/laporan.js',
    '/assets/js/components/spinner.js'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('Service Worker: Installed');
                return self.skipWaiting();
            })
    );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activated');
            return self.clients.claim();
        })
    );
});

// Fetch Strategy: Network First, fallback to Cache, then Offline Page
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache successful responses
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseClone);
                        });
                }
                return response;
            })
            .catch(async () => {
                // Try cache first
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Return offline page for navigation requests
                if (event.request.mode === 'navigate') {
                    const offlinePage = await caches.match('/offline.html');
                    if (offlinePage) return offlinePage;
                }
                
                // Return empty response for other requests
                return new Response('', {
                    status: 408,
                    statusText: 'Request timeout'
                });
            })
    );
});

// Background Sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-queue') {
        console.log('Service Worker: Background sync triggered');
        event.waitUntil(syncOfflineData());
    }
});

async function syncOfflineData() {
    try {
        // Get all clients
        const clients = await self.clients.matchAll();
        
        // Send message to main thread to process sync
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_QUEUE',
                timestamp: Date.now()
            });
        });
        
        console.log('Service Worker: Sync message sent to clients');
    } catch (error) {
        console.error('Service Worker: Sync error:', error);
    }
}

// Push Notifications
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body || 'Notifikasi baru',
            icon: '/assets/images/icon-192x192.png',
            badge: '/assets/images/badge.png',
            vibrate: [200, 100, 200],
            data: {
                url: data.url || '/'
            }
        };

        event.waitUntil(
            self.registration.showNotification(
                data.title || 'Arsip Surat Digital',
                options
            )
        );
    }
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then(clientList => {
                // Open URL from notification data
                const url = event.notification.data?.url || '/';
                
                // Check if there's already a window open
                for (const client of clientList) {
                    if (client.url === url && 'focus' in client) {
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

console.log('Service Worker: Loaded');
