// Simple Service Worker for GitHub Pages
const CACHE_NAME = 'arsip-surat-v3.1.0';

self.addEventListener('install', function(event) {
  console.log('SW: Installed');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('SW: Activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
