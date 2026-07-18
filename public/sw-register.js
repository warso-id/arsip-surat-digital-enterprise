// ============================================
// Service Worker Registration
// ============================================

class ServiceWorkerRegister {
    constructor() {
        this.swUrl = '/sw.js';
        this.registration = null;
        this.updateCheckInterval = 60 * 60 * 1000; // 1 hour
        this.init();
    }

    /**
     * Initialize service worker registration
     */
    async init() {
        if (!('serviceWorker' in navigator)) {
            console.log('[SW Register] Service Worker not supported');
            return;
        }

        try {
            await this.register();
            await this.setupUpdateCheck();
            await this.setupMessageHandling();
            await this.setupBackgroundSync();
            await this.requestNotificationPermission();
        } catch (error) {
            console.error('[SW Register] Initialization failed:', error);
        }
    }

    /**
     * Register service worker
     */
    async register() {
        try {
            this.registration = await navigator.serviceWorker.register(this.swUrl, {
                scope: '/'
            });

            console.log('[SW Register] Registered successfully:', this.registration.scope);

            // Handle updates
            this.registration.addEventListener('updatefound', () => {
                const newWorker = this.registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateNotification();
                    }
                });
            });

            return this.registration;
        } catch (error) {
            console.error('[SW Register] Registration failed:', error);
            throw error;
        }
    }

    /**
     * Setup periodic update check
     */
    async setupUpdateCheck() {
        setInterval(async () => {
            try {
                await this.registration.update();
            } catch (error) {
                console.error('[SW Register] Update check failed:', error);
            }
        }, this.updateCheckInterval);

        // Also check on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.registration.update();
            }
        });
    }

    /**
     * Setup message handling from SW
     */
    setupMessageHandling() {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (!event.data) return;

            switch (event.data.type) {
                case 'SW_ACTIVATED':
                    console.log('[SW Register] New SW activated:', event.data.version);
                    break;

                case 'UPDATE_AVAILABLE':
                    console.log('[SW Register] Update available:', event.data.version);
                    this.showUpdateNotification();
                    break;

                case 'SYNC_COMPLETED':
                    console.log('[SW Register] Background sync completed:', event.data.tag);
                    this.onSyncCompleted(event.data.tag);
                    break;

                case 'CACHE_CLEARED':
                    console.log('[SW Register] Cache cleared');
                    break;

                default:
                    console.log('[SW Register] Unknown message:', event.data.type);
            }
        });
    }

    /**
     * Setup background sync
     */
    async setupBackgroundSync() {
        if (!('SyncManager' in window)) {
            console.log('[SW Register] Background Sync not supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Register sync tags
            await registration.sync.register('sync-surat-keluar');
            await registration.sync.register('sync-disposisi');
            
            console.log('[SW Register] Background sync registered');
        } catch (error) {
            console.error('[SW Register] Background sync setup failed:', error);
        }
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('[SW Register] Notification not supported');
            return;
        }

        if (Notification.permission === 'default') {
            const result = await Notification.requestPermission();
            console.log('[SW Register] Notification permission:', result);
        }
    }

    /**
     * Show update notification
     */
    showUpdateNotification() {
        const shouldUpdate = confirm('Aplikasi versi baru tersedia. Muat ulang sekarang?');
        
        if (shouldUpdate) {
            this.updateApp();
        }
    }

    /**
     * Update application
     */
    async updateApp() {
        try {
            if (this.registration && this.registration.waiting) {
                // Send skip waiting message to waiting SW
                this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            // Reload page
            window.location.reload();
        } catch (error) {
            console.error('[SW Register] Update failed:', error);
        }
    }

    /**
     * Clear all caches
     */
    async clearAllCaches() {
        try {
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CLEAR_CACHE'
                });
            }
        } catch (error) {
            console.error('[SW Register] Clear cache failed:', error);
        }
    }

    /**
     * Save request for background sync
     */
    async saveForSync(request) {
        try {
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SAVE_FOR_SYNC',
                    request: request
                });
            }
        } catch (error) {
            console.error('[SW Register] Save for sync failed:', error);
        }
    }

    /**
     * Register background sync
     */
    async registerSync(tag) {
        try {
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'REGISTER_SYNC',
                    tag: tag
                });
            }
        } catch (error) {
            console.error('[SW Register] Register sync failed:', error);
        }
    }

    /**
     * Get SW version
     */
    async getVersion() {
        return new Promise((resolve, reject) => {
            if (!navigator.serviceWorker.controller) {
                reject(new Error('No active SW'));
                return;
            }

            const channel = new MessageChannel();
            
            channel.port1.onmessage = (event) => {
                resolve(event.data);
            };

            navigator.serviceWorker.controller.postMessage(
                { type: 'GET_VERSION' },
                [channel.port2]
            );
        });
    }

    /**
     * Cache specific URL
     */
    async cacheUrl(url) {
        try {
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CACHE_URL',
                    url: url
                });
            }
        } catch (error) {
            console.error('[SW Register] Cache URL failed:', error);
        }
    }

    /**
     * On sync completed callback
     */
    onSyncCompleted(tag) {
        // Dispatch custom event
        const event = new CustomEvent('sw-sync-completed', {
            detail: { tag: tag }
        });
        document.dispatchEvent(event);
    }

    /**
     * Check if online
     */
    isOnline() {
        return navigator.onLine;
    }

    /**
     * Check if SW is active
     */
    isActive() {
        return !!navigator.serviceWorker.controller;
    }
}

// Initialize when DOM is ready
let swRegister;

document.addEventListener('DOMContentLoaded', () => {
    swRegister = new ServiceWorkerRegister();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServiceWorkerRegister;
}
