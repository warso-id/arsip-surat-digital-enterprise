/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Service Worker Registration Module
 * ============================================================
 */

const ServiceWorkerRegister = (() => {
    'use strict';

    // ==================== SW CONFIGURATION ====================
    const SW_CONFIG = {
        swUrl: '/service-worker.js',
        scope: '/',
        updateInterval: 3600000, // 1 hour
    };

    // ==================== REGISTRATION MANAGER ====================
    class SWManager {
        constructor() {
            this.registration = null;
            this.updateAvailable = false;
            this.status = 'unregistered'; // unregistered, registering, registered, updated, error
        }

        /**
         * Register service worker
         */
        async register() {
            if (!('serviceWorker' in navigator)) {
                console.log('📱 Service Worker not supported');
                this.status = 'unsupported';
                return null;
            }

            try {
                this.status = 'registering';
                
                this.registration = await navigator.serviceWorker.register(
                    SW_CONFIG.swUrl,
                    { scope: SW_CONFIG.scope }
                );

                this.status = 'registered';
                console.log('📱 Service Worker registered:', this.registration.scope);

                // Handle updates
                this.setupUpdateHandler();

                // Handle messages
                this.setupMessageHandler();

                // Periodic update check
                this.startUpdateCheck();

                return this.registration;

            } catch (error) {
                this.status = 'error';
                console.error('📱 Service Worker registration failed:', error);
                return null;
            }
        }

        /**
         * Setup update handler
         */
        setupUpdateHandler() {
            if (!this.registration) return;

            this.registration.addEventListener('updatefound', () => {
                const newWorker = this.registration.installing;
                
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.updateAvailable = true;
                            this.status = 'updated';
                            console.log('📱 New Service Worker available');
                            this.showUpdateNotification();
                        }
                    });
                }
            });
        }

        /**
         * Setup message handler
         */
        setupMessageHandler() {
            navigator.serviceWorker.addEventListener('message', (event) => {
                console.log('📱 SW Message:', event.data);
                
                switch (event.data?.type) {
                    case 'CACHE_UPDATED':
                        console.log('📦 Cache updated:', event.data.cacheName);
                        break;
                    case 'SYNC_COMPLETED':
                        console.log('🔄 Background sync completed');
                        break;
                    case 'PUSH_RECEIVED':
                        console.log('📨 Push notification received');
                        break;
                }
            });
        }

        /**
         * Start periodic update check
         */
        startUpdateCheck() {
            setInterval(async () => {
                try {
                    await this.registration?.update();
                } catch (error) {
                    console.warn('SW update check failed:', error);
                }
            }, SW_CONFIG.updateInterval);
        }

        /**
         * Show update notification
         */
        showUpdateNotification() {
            const notification = document.createElement('div');
            notification.id = 'sw-update-notification';
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #1f2937;
                color: white;
                padding: 12px 24px;
                border-radius: 30px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 12px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                cursor: pointer;
                animation: slideUp 0.3s ease;
            `;
            
            notification.innerHTML = `
                <span>🔄</span>
                <span>Versi baru tersedia. Klik untuk memperbarui.</span>
            `;
            
            notification.addEventListener('click', () => {
                this.skipWaiting();
                notification.remove();
            });
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) notification.remove();
            }, 15000);
        }

        /**
         * Skip waiting and activate new SW
         */
        async skipWaiting() {
            if (this.registration?.waiting) {
                this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            
            // Reload to activate new SW
            window.location.reload();
        }

        /**
         * Unregister service worker
         */
        async unregister() {
            if (this.registration) {
                await this.registration.unregister();
                this.registration = null;
                this.status = 'unregistered';
                console.log('📱 Service Worker unregistered');
            }
        }

        /**
         * Get registration status
         */
        getStatus() {
            return {
                status: this.status,
                updateAvailable: this.updateAvailable,
                scope: this.registration?.scope || null,
                active: !!this.registration?.active,
                waiting: !!this.registration?.waiting,
                installing: !!this.registration?.installing,
            };
        }

        /**
         * Check if app can be installed
         */
        async canInstall() {
            if (!('getInstalledRelatedApps' in navigator)) return false;
            
            try {
                const relatedApps = await navigator.getInstalledRelatedApps();
                return relatedApps.length === 0;
            } catch {
                return false;
            }
        }

        /**
         * Show install prompt
         */
        setupInstallPrompt() {
            let deferredPrompt = null;
            
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                
                // Show install button
                this.showInstallButton(deferredPrompt);
            });
            
            window.addEventListener('appinstalled', () => {
                console.log('📱 App installed successfully');
                deferredPrompt = null;
            });
        }

        /**
         * Show install button
         */
        showInstallButton(deferredPrompt) {
            const button = document.createElement('button');
            button.textContent = '📱 Install Aplikasi';
            button.style.cssText = `
                position: fixed;
                bottom: 80px;
                right: 20px;
                background: #1a56db;
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 30px;
                cursor: pointer;
                font-weight: 600;
                box-shadow: 0 10px 30px rgba(26,86,219,0.3);
                z-index: 999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            
            button.addEventListener('click', async () => {
                deferredPrompt.prompt();
                const result = await deferredPrompt.userChoice;
                console.log('Install prompt result:', result.outcome);
                deferredPrompt = null;
                button.remove();
            });
            
            document.body.appendChild(button);
            
            // Auto-remove after 30 seconds
            setTimeout(() => {
                if (button.parentNode) button.remove();
            }, 30000);
        }
    }

    // ==================== INITIALIZE ====================
    const swManager = new SWManager();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            swManager.register();
            swManager.setupInstallPrompt();
        });
    } else {
        swManager.register();
        swManager.setupInstallPrompt();
    }

    // ==================== PUBLIC API ====================
    return {
        register: () => swManager.register(),
        unregister: () => swManager.unregister(),
        getStatus: () => swManager.getStatus(),
        skipWaiting: () => swManager.skipWaiting(),
        canInstall: () => swManager.canInstall(),
    };
})();

window.ServiceWorkerRegister = ServiceWorkerRegister;
