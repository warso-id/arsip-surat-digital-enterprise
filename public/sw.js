// ============================================
// Enterprise Service Worker - Root Level
// Path: /arsip-surat-digital-enterprise/sw.js
// ============================================

const CACHE_NAME = 'arsip-surat-enterprise-v2';
const STATIC_CACHE = CACHE_NAME + '-static';
const RUNTIME_CACHE = CACHE_NAME + '-runtime';

// Assets yang akan di-cache (relative path dari root)
const STATIC_ASSETS = [
    '/arsip-surat-digital-enterprise/',
    '/arsip-surat-digital-enterprise/index.html',
    '/arsip-surat-digital-enterprise/404.html',
    '/arsip-surat-digital-enterprise/public/css/landing.css',
    '/arsip-surat-digital-enterprise/public/css/app.css',
    '/arsip-surat-digital-enterprise/public/css/dashboard.css',
    '/arsip-surat-digital-enterprise/public/css/surat.css',
    '/arsip-surat-digital-enterprise/public/css/print.css',
    '/arsip-surat-digital-enterprise/public/js/landing.js',
    '/arsip-surat-digital-enterprise/public/js/app.js',
    '/arsip-surat-digital-enterprise/public/js/api.js',
    '/arsip-surat-digital-enterprise/public/js/dashboard.js',
    '/arsip-surat-digital-enterprise/public/js/surat.js',
    '/arsip-surat-digital-enterprise/public/js/disposisi.js',
    '/arsip-surat-digital-enterprise/public/js/laporan.js',
    '/arsip-surat-digital-enterprise/public/manifest.json',
    '/arsip-surat-digital-enterprise/public/offline.html',
    '/arsip-surat-digital-enterprise/public/assets/images/logo.svg',
    '/arsip-surat-digital-enterprise/public/assets/images/favicon.svg',
    '/arsip-surat-digital-enterprise/public/assets/images/hero-dashboard.svg',
    '/arsip-surat-digital-enterprise/public/assets/images/og-image.svg',
    '/arsip-surat-digital-enterprise/public/assets/images/default-avatar.svg',
    '/arsip-surat-digital-enterprise/public/assets/images/icon-192x192.svg',
    '/arsip-surat-digital-enterprise/public/assets/images/icon-512x512.svg',
    '/arsip-surat-digital-enterprise/views/auth/login.html',
    '/arsip-surat-digital-enterprise/views/auth/register.html',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
];

// ============================================
// INSTALL EVENT
// ============================================
self.addEventListener('install', function(event) {
    console.log('[SW] Installing Service Worker...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(function(cache) {
                console.log('[SW] Caching static assets...');
                // Cache assets satu per satu agar yang gagal tidak mempengaruhi lainnya
                return Promise.allSettled(
                    STATIC_ASSETS.map(function(url) {
                        return cache.add(url).catch(function(error) {
                            console.warn('[SW] Gagal cache:', url, '-', error.message);
                        });
                    })
                );
            })
            .then(function() {
                console.log('[SW] Installation complete, skip waiting...');
                return self.skipWaiting();
            })
    );
});

// ============================================
// ACTIVATE EVENT
// ============================================
self.addEventListener('activate', function(event) {
    console.log('[SW] Activating Service Worker...');
    
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== STATIC_CACHE && cacheName !== RUNTIME_CACHE) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            console.log('[SW] Claiming clients...');
            return self.clients.claim();
        })
    );
});

// ============================================
// FETCH EVENT
// ============================================
self.addEventListener('fetch', function(event) {
    var request = event.request;
    var url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension requests
    if (url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Google Apps Script API - Network first
    if (url.href.includes('script.google.com') || url.href.includes('script.googleusercontent.com')) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // CDN resources - Cache first
    if (url.href.includes('cdn.jsdelivr.net') || 
        url.href.includes('cdnjs.cloudflare.com') ||
        url.href.includes('unpkg.com')) {
        event.respondWith(cacheFirst(request));
        return;
    }
    
    // HTML pages - Network first
    if (request.headers.get('Accept') && request.headers.get('Accept').includes('text/html')) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // Static assets (CSS, JS, images) - Cache first
    if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
        event.respondWith(cacheFirst(request));
        return;
    }
    
    // Default - Network first
    event.respondWith(networkFirst(request));
});

// ============================================
// CACHE FIRST STRATEGY
// ============================================
function cacheFirst(request) {
    return caches.match(request).then(function(cachedResponse) {
        if (cachedResponse) {
            // Update cache di background
            updateCache(request);
            return cachedResponse;
        }
        
        return fetch(request).then(function(response) {
            if (!response || response.status !== 200) {
                return response;
            }
            
            var responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then(function(cache) {
                cache.put(request, responseToCache);
            });
            
            return response;
        }).catch(function(error) {
            console.warn('[SW] Fetch failed:', request.url, error);
            
            // Return offline page untuk HTML
            if (request.headers.get('Accept') && request.headers.get('Accept').includes('text/html')) {
                return caches.match('/arsip-surat-digital-enterprise/public/offline.html');
            }
            
            // Return placeholder image
            if (request.url.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
                return new Response(
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f0f0f0"/></svg>',
                    { headers: { 'Content-Type': 'image/svg+xml' } }
                );
            }
            
            throw error;
        });
    });
}

// ============================================
// NETWORK FIRST STRATEGY
// ============================================
function networkFirst(request) {
    return fetch(request).then(function(response) {
        if (response && response.status === 200) {
            var responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then(function(cache) {
                cache.put(request, responseToCache);
            });
        }
        return response;
    }).catch(function() {
        return caches.match(request).then(function(cachedResponse) {
            if (cachedResponse) {
                return cachedResponse;
            }
            
            // Return offline response untuk API
            if (request.url.includes('script.google.com')) {
                return new Response(
                    JSON.stringify({
                        status: 'error',
                        message: 'Anda sedang offline',
                        offline: true
                    }),
                    { 
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }
            
            // Return offline page
            if (request.headers.get('Accept') && request.headers.get('Accept').includes('text/html')) {
                return caches.match('/arsip-surat-digital-enterprise/public/offline.html');
            }
            
            return new Response('Offline', { status: 503 });
        });
    });
}

// ============================================
// BACKGROUND CACHE UPDATE
// ============================================
function updateCache(request) {
    fetch(request).then(function(response) {
        if (response && response.status === 200) {
            caches.open(RUNTIME_CACHE).then(function(cache) {
                cache.put(request, response);
            });
        }
    }).catch(function() {
        // Silent fail
    });
}

// ============================================
// PUSH NOTIFICATION
// ============================================
self.addEventListener('push', function(event) {
    console.log('[SW] Push received');
    
    var title = 'Arsip Surat Digital';
    var options = {
        body: 'Ada notifikasi baru',
        icon: '/arsip-surat-digital-enterprise/public/assets/images/icon-192x192.svg',
        badge: '/arsip-surat-digital-enterprise/public/assets/images/icon-72x72.svg',
        tag: 'arsip-surat-notification',
        vibrate: [200, 100, 200],
        data: {
            url: '/arsip-surat-digital-enterprise/'
        }
    };
    
    if (event.data) {
        try {
            var data = event.data.json();
            options.body = data.body || options.body;
            options.data.url = data.url || options.data.url;
        } catch (e) {
            options.body = event.data.text();
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// ============================================
// NOTIFICATION CLICK
// ============================================
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    var url = event.notification.data?.url || '/arsip-surat-digital-enterprise/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url.includes(url) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

console.log('[SW] Enterprise Service Worker Loaded - v2024.1.0');
