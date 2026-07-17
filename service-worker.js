// service-worker.js - Service Worker PWA (FIXED)
const CACHE_NAME = 'asde-cache-v2026.1';
const ASSETS_TO_CACHE = [
    '/arsip-surat-digital-enterprise/',
    '/arsip-surat-digital-enterprise/index.html',
    '/arsip-surat-digital-enterprise/offline.html',
    '/arsip-surat-digital-enterprise/manifest.json',
    '/arsip-surat-digital-enterprise/assets/css/app.css',
    '/arsip-surat-digital-enterprise/assets/css/dashboard.css',
    '/arsip-surat-digital-enterprise/assets/css/surat.css',
    '/arsip-surat-digital-enterprise/assets/css/print.css',
    '/arsip-surat-digital-enterprise/assets/js/config.js',
    '/arsip-surat-digital-enterprise/assets/js/api.js',
    '/arsip-surat-digital-enterprise/assets/js/auth.js',
    '/arsip-surat-digital-enterprise/assets/js/database.js',
    '/arsip-surat-digital-enterprise/assets/js/app.js',
    '/arsip-surat-digital-enterprise/assets/js/dashboard.js',
    '/arsip-surat-digital-enterprise/assets/js/surat.js',
    '/arsip-surat-digital-enterprise/assets/js/disposisi.js',
    '/arsip-surat-digital-enterprise/assets/js/laporan.js',
    '/arsip-surat-digital-enterprise/assets/js/components/spinner.js'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files');
                // Cache files individually to avoid failing all if one fails
                return Promise.allSettled(
                    ASSETS_TO_CACHE.map(url => {
                        return cache.add(url).catch(error => {
                            console.warn(`Failed to cache: ${url}`, error);
                            // Don't throw, just skip this file
                        });
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Install completed');
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

// Fetch Strategy: Network First, then Cache, then Offline Page
self.addEventListener('fetch', (event) => {
    // Skip Google Apps Script requests
    if (event.request.url.includes('script.google.com')) {
        return;
    }
    
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache successful GET responses
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(async () => {
                // Try to get from cache
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Return offline page for navigation requests
                if (event.request.mode === 'navigate') {
                    const offlinePage = await caches.match('/arsip-surat-digital-enterprise/offline.html');
                    if (offlinePage) return offlinePage;
                }
                
                // Return a simple response for other failures
                return new Response('Offline - Resource not available', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: new Headers({
                        'Content-Type': 'text/plain'
                    })
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
        const clients = await self.clients.matchAll();
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

console.log('Service Worker: Loaded');
