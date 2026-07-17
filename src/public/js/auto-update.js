/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Auto Update System
 * ============================================================
 * Checks for updates and notifies users
 * ============================================================
 */

const EnterpriseAutoUpdate = (() => {
    'use strict';

    // ==================== UPDATE CONFIGURATION ====================
    const CONFIG = {
        checkInterval: 3600000, // 1 hour
        versionUrl: null, // Will use GAS API
        currentVersion: '3.0.0',
        autoReload: false,
        notifyUser: true,
    };

    // ==================== UPDATE CHECKER ====================
    class UpdateChecker {
        constructor() {
            this.lastCheck = null;
            this.updateAvailable = false;
            this.latestVersion = null;
            this.checkTimer = null;
        }

        /**
         * Start periodic update checks
         */
        start() {
            // Initial check
            this.check();

            // Periodic checks
            this.checkTimer = setInterval(() => {
                this.check();
            }, CONFIG.checkInterval);

            console.log('🔄 Auto-update checker started');
        }

        /**
         * Stop checking
         */
        stop() {
            if (this.checkTimer) {
                clearInterval(this.checkTimer);
                this.checkTimer = null;
            }
        }

        /**
         * Check for updates
         */
        async check() {
            try {
                console.log('🔍 Checking for updates...');

                // Try to get version from Google Apps Script
                let serverVersion = null;

                if (window.EnterpriseConnector) {
                    const response = await window.EnterpriseConnector.api.getVersion();
                    if (response?.success && response?.data?.version) {
                        serverVersion = response.data.version;
                    }
                }

                // Fallback: check version.json
                if (!serverVersion) {
                    try {
                        const response = await fetch('/VERSION.json');
                        const data = await response.json();
                        serverVersion = data?.application?.version;
                    } catch (e) {
                        console.warn('Could not check version.json');
                    }
                }

                this.lastCheck = new Date().toISOString();

                if (serverVersion && serverVersion !== CONFIG.currentVersion) {
                    console.log(`🆕 Update available: ${CONFIG.currentVersion} → ${serverVersion}`);
                    this.updateAvailable = true;
                    this.latestVersion = serverVersion;
                    this.notifyUpdate(serverVersion);
                } else {
                    console.log('✅ Application is up to date');
                    this.updateAvailable = false;
                }
            } catch (error) {
                console.warn('Update check failed:', error.message);
            }
        }

        /**
         * Notify user about update
         */
        notifyUpdate(newVersion) {
            if (!CONFIG.notifyUser) return;

            // Create update notification
            const notification = document.createElement('div');
            notification.id = 'update-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #1a56db, #7c3aed);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(26,86,219,0.3);
                z-index: 10001;
                display: flex;
                align-items: center;
                gap: 16px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                animation: slideDown 0.3s ease;
                max-width: 90%;
            `;

            notification.innerHTML = `
                <span style="font-size: 24px;">🆕</span>
                <div style="flex: 1;">
                    <strong>Update Tersedia!</strong>
                    <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">
                        Versi ${newVersion} telah tersedia. Versi Anda: ${CONFIG.currentVersion}
                    </p>
                </div>
                <button onclick="this.parentElement.remove(); EnterpriseAutoUpdate.applyUpdate();" 
                        style="padding: 8px 16px; background: white; color: #1a56db; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; white-space: nowrap;">
                    Update Sekarang
                </button>
                <button onclick="this.parentElement.remove();" 
                        style="background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; font-size: 18px; padding: 4px;">
                    ✕
                </button>
            `;

            document.body.appendChild(notification);

            // Auto-remove after 30 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 30000);

            // Add animation style
            if (!document.getElementById('update-animation-style')) {
                const style = document.createElement('style');
                style.id = 'update-animation-style';
                style.textContent = '@keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }';
                document.head.appendChild(style);
            }
        }

        /**
         * Apply update
         */
        applyUpdate() {
            console.log('🔄 Applying update...');

            // Clear caches
            if (window.EnterpriseCache) {
                window.EnterpriseCache.clear();
            }

            // Clear service worker cache
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => {
                        registration.unregister();
                    });
                });
            }

            // Clear application cache
            if ('caches' in window) {
                caches.keys().then(cacheNames => {
                    cacheNames.forEach(cacheName => {
                        caches.delete(cacheName);
                    });
                });
            }

            // Reload after short delay
            setTimeout(() => {
                window.location.reload(true);
            }, 1000);
        }

        /**
         * Get update status
         */
        getStatus() {
            return {
                currentVersion: CONFIG.currentVersion,
                latestVersion: this.latestVersion,
                updateAvailable: this.updateAvailable,
                lastCheck: this.lastCheck,
            };
        }
    }

    // ==================== SERVICE WORKER UPDATER ====================
    class ServiceWorkerUpdater {
        /**
         * Check for Service Worker updates
         */
        check() {
            if (!('serviceWorker' in navigator)) return;

            navigator.serviceWorker.ready.then(registration => {
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('🔄 New Service Worker available');
                                this.notifySWUpdate();
                            }
                        });
                    }
                });
            });

            // Check for updates
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration) {
                    registration.update().catch(() => {
                        // Update check failed, ignore
                    });
                }
            });
        }

        /**
         * Notify about Service Worker update
         */
        notifySWUpdate() {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #1f2937;
                color: white;
                padding: 12px 20px;
                border-radius: 30px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 10001;
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
                notification.remove();
                window.location.reload();
            });

            document.body.appendChild(notification);

            setTimeout(() => {
                if (notification.parentNode) notification.remove();
            }, 15000);
        }
    }

    // ==================== INITIALIZE ====================
    const updateChecker = new UpdateChecker();
    const swUpdater = new ServiceWorkerUpdater();

    // Start checking
    updateChecker.start();
    swUpdater.check();

    // ==================== PUBLIC API ====================
    return {
        check: () => updateChecker.check(),
        getStatus: () => updateChecker.getStatus(),
        applyUpdate: () => updateChecker.applyUpdate(),
        stop: () => updateChecker.stop(),
    };
})();

window.EnterpriseAutoUpdate = EnterpriseAutoUpdate;
