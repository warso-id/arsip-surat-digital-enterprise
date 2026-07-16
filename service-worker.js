// ==================== SERVICE WORKER ====================
// Arsip Surat Digital Enterprise - Service Worker
// Version: 2.1.0

const CACHE_NAME = 'arsip-surat-v2.1.0';
const RUNTIME_CACHE = 'arsip-surat-runtime';

// Resources to pre-cache
const PRECACHE_URLS = [
    './',
    './index.html',
    './offline.html',
    './manifest.json',
    './version.json',
    './src/public/css/app.css',
    './src/public/css/dashboard.css',
    './src/public/js/app.js',
    './src/views/errors/404.ejs',
    './src/views/errors/500.ejs',
    './src/views/errors/403.ejs'
];

// ==================== INSTALL EVENT ====================
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing v2.1.0...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Pre-caching resources');
                return cache.addAll(PRECACHE_URLS).catch(err => {
                    console.warn('[Service Worker] Some resources failed to cache:', err);
                    // Continue even if some fail
                    return Promise.resolve();
                });
            })
            .then(() => {
                console.log('[Service Worker] Skip waiting');
                return self.skipWaiting();
            })
    );
});

// ==================== ACTIVATE EVENT ====================
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating v2.1.0...');
    
    const cacheWhitelist = [CACHE_NAME, RUNTIME_CACHE];
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Claiming clients');
            return self.clients.claim();
        })
    );
});

// ==================== FETCH EVENT ====================
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and chrome-extension requests
    if (event.request.method !== 'GET' || 
        event.request.url.startsWith('chrome-extension://')) {
        return;
    }

    // Skip API calls and external resources
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/api/') || 
        url.hostname !== self.location.hostname) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached response if available
                if (cachedResponse) {
                    // Fetch fresh version in background
                    fetch(event.request)
                        .then((response) => {
                            if (response && response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(RUNTIME_CACHE)
                                    .then((cache) => {
                                        cache.put(event.request, responseClone);
                                    });
                            }
                        })
                        .catch(() => {
                            // Ignore fetch errors for background update
                        });
                    
                    return cachedResponse;
                }

                // Network first, then cache
                return fetch(event.request)
                    .then((response) => {
                        // Check if valid response
                        if (!response || response.status !== 200 || 
                            response.type !== 'basic') {
                            return response;
                        }

                        // Cache the response
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE)
                            .then((cache) => {
                                cache.put(event.request, responseClone);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Network failed, serve offline page for navigation
                        if (event.request.mode === 'navigate') {
                            return caches.match('./offline.html');
                        }
                        // Return cached version or throw error
                        return caches.match(event.request);
                    });
            })
    );
});

// ==================== PUSH NOTIFICATION ====================
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received:', event);
    
    let data = {
        title: 'Arsip Surat Digital',
        body: 'Notifikasi baru',
        icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA5NiA5NiIgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2Ij48cmVjdCB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHJ4PSIxNiIgZmlsbD0iIzFhNTZkYiIvPjx0ZXh0IHg9IjQ4IiB5PSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFEPC90ZXh0Pjwvc3ZnPg==',
        badge: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA5NiA5NiIgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2Ij48cmVjdCB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHJ4PSIxNiIgZmlsbD0iIzFhNTZkYiIvPjx0ZXh0IHg9IjQ4IiB5PSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFEPC90ZXh0Pjwvc3ZnPg==',
        tag: 'arsip-surat-notification',
        data: {
            url: './'
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
                title: 'Buka'
            },
            {
                action: 'close',
                title: 'Tutup'
            }
        ],
        requireInteraction: false,
        silent: false
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ==================== NOTIFICATION CLICK ====================
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click:', event);
    
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const urlToOpen = event.notification.data?.url || './';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 
                    'focus' in client) {
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

// ==================== MESSAGE EVENT ====================
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            console.log('[Service Worker] All caches cleared');
            // Notify client
            event.ports[0]?.postMessage({ result: 'success' });
        });
    }
});

// ==================== BACKGROUND SYNC ====================
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background Sync:', event.tag);
    
    if (event.tag === 'sync-surat') {
        event.waitUntil(
            syncPendingSurat()
        );
    }
});

async function syncPendingSurat() {
    try {
        // Get pending surat from IndexedDB
        const pendingData = await getPendingData();
        
        if (pendingData && pendingData.length > 0) {
            for (const data of pendingData) {
                try {
                    const response = await fetch('/api/sync', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    
                    if (response.ok) {
                        await removePendingData(data.id);
                    }
                } catch (err) {
                    console.error('Sync failed for:', data.id, err);
                }
            }
        }
    } catch (err) {
        console.error('Background sync failed:', err);
    }
}

// ==================== INDEXEDDB HELPERS ====================
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ArsipSuratOffline', 1);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pendingSurat')) {
                db.createObjectStore('pendingSurat', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
            }
        };
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

async function getPendingData() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('pendingSurat', 'readonly');
        const store = transaction.objectStore('pendingSurat');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function removePendingData(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('pendingSurat', 'readwrite');
        const store = transaction.objectStore('pendingSurat');
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

console.log('[Service Worker] Service Worker v2.1.0 loaded');
