// ============================================
// Enterprise Service Worker - Fixed
// ============================================

const CACHE_NAME = 'arsip-surat-enterprise-v1';
const STATIC_CACHE = CACHE_NAME + '-static';
const RUNTIME_CACHE = CACHE_NAME + '-runtime';

// Assets to cache - only existing files
const STATIC_ASSETS = [
    '/arsip-surat-digital-enterprise/index.html',
    '/arsip-surat-digital-enterprise/public/css/landing.css',
    '/arsip-surat-digital-enterprise/public/css/app.css',
    '/arsip-surat-digital-enterprise/public/css/dashboard.css',
    '/arsip-surat-digital-enterprise/public/js/landing.js',
    '/arsip-surat-digital-enterprise/public/js/app.js',
    '/arsip-surat-digital-enterprise/public/js/api.js',
    '/arsip-surat-digital-enterprise/public/assets/images/logo.svg',
    '/arsip-surat-digital-enterprise/public/assets/images/favicon.svg',
    '/arsip-surat-digital-enterprise/public/assets/images/hero-dashboard.svg',
    '/arsip-surat-digital-enterprise/public/assets/images/og-image.svg',
    '/arsip-surat-digital-enterprise/public/assets/images/default-avatar.svg',
    '/arsip-surat-digital-enterprise/public/assets/images/icon-192x192.png',
    '/arsip-surat-digital-enterprise/public/assets/images/icon-512x512.png',
    '/arsip-surat-digital-enterprise/public/offline.html',
    '/arsip-surat-digital-enterprise/views/auth/login.html',
    '/arsip-surat-digital-enterprise/views/auth/register.html'
];

// Install event
self.addEventListener('install', function(event) {
    console.log('[SW] Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(function(cache) {
                console.log('[SW] Caching static assets...');
                // Cache one by one to avoid failing all if one fails
                return Promise.allSettled(
                    STATIC_ASSETS.map(function(url) {
                        return cache.add(url).catch(function(error) {
                            console.warn('[SW] Failed to cache:', url, error.message);
                        });
                    })
                );
            })
            .then(function() {
                console.log('[SW] Installation complete');
                return self.skipWaiting();
            })
    );
});

// Activate event
self.addEventListener('activate', function(event) {
    console.log('[SW] Activating...');
    
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
            return self.clients.claim();
        })
    );
});

// Fetch event
self.addEventListener('fetch', function(event) {
    var request = event.request;
    var url = new URL(request.url);
    
    // Skip non-GET requests and chrome-extension
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }
    
    // For API requests - network first
    if (url.href.includes('script.google.com')) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // For HTML - network first, fallback to cache
    if (request.headers.get('Accept') && request.headers.get('Accept').includes('text/html')) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // For static assets - cache first
    event.respondWith(cacheFirst(request));
});

// Cache first strategy
function cacheFirst(request) {
    return caches.match(request).then(function(cachedResponse) {
        if (cachedResponse) {
            return cachedResponse;
        }
        
        return fetch(request).then(function(response) {
            if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
            }
            
            var responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then(function(cache) {
                cache.put(request, responseToCache);
            });
            
            return response;
        }).catch(function() {
            // Return offline page for HTML requests
            if (request.headers.get('Accept') && request.headers.get('Accept').includes('text/html')) {
                return caches.match('/arsip-surat-digital-enterprise/public/offline.html');
            }
            return new Response('Offline', { status: 503 });
        });
    });
}

// Network first strategy
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
            return cachedResponse || new Response(
                JSON.stringify({ status: 'error', message: 'Anda sedang offline' }),
                { headers: { 'Content-Type': 'application/json' } }
            );
        });
    });
}

console.log('[SW] Enterprise Service Worker Loaded');
