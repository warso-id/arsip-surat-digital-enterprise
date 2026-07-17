// Service Worker for PWA
const CACHE_NAME = 'asde-cache-v2026';
const urlsToCache = [
    '/',
    '/index.html',
    '/offline.html',
    '/assets/css/app.css',
    '/assets/css/dashboard.css',
    '/assets/css/surat.css',
    '/assets/js/config.js',
    '/assets/js/database.js',
    '/assets/js/api.js',
    '/assets/js/auth.js',
    '/assets/js/app.js',
    '/assets/js/dashboard.js',
    '/assets/js/surat.js',
    '/assets/js/disposisi.js',
    '/assets/js/laporan.js',
    '/assets/js/components/spinner.js'
];

// Install Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activate Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch Strategy: Cache First, then Network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached response if found
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest)
                    .then(response => {
                        // Check if valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Return offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/offline.html');
                        }
                    });
            })
    );
});

// Background Sync
self.addEventListener('sync', event => {
    if (event.tag === 'sync-offline-data') {
        event.waitUntil(syncOfflineData());
    }
});

async function syncOfflineData() {
    try {
        // Open IndexedDB
        const db = await openDatabase();
        const transaction = db.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        const queue = await store.getAll();

        // Sync each item
        for (const item of queue) {
            if (!item.synced) {
                try {
                    // Send to API
                    const response = await fetch(APP_CONFIG.api.baseUrl, {
                        method: 'POST',
                        body: JSON.stringify(item.action)
                    });

                    if (response.ok) {
                        item.synced = true;
                        item.syncedAt = new Date().toISOString();
                        await store.put(item);
                    }
                } catch (error) {
                    console.error('Sync error for item:', item, error);
                }
            }
        }
    } catch (error) {
        console.error('Background sync error:', error);
    }
}

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ArsipSuratDigitalDB', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
