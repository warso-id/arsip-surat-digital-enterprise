// ============================================
// Service Worker Update Handler
// ============================================

class SWUpdateHandler {
    constructor() {
        this.registration = null;
        this.updateAvailable = false;
        this.updateCheckInterval = 30 * 60 * 1000; // 30 minutes
        this.init();
    }

    /**
     * Initialize update handler
     */
    async init() {
        if (!('serviceWorker' in navigator)) return;

        try {
            this.registration = await navigator.serviceWorker.ready;
            this.setupUpdateDetection();
            this.setupPeriodicCheck();
            this.setupVisibilityCheck();
        } catch (error) {
            console.error('[SW Update] Init failed:', error);
        }
    }

    /**
     * Setup update detection
     */
    setupUpdateDetection() {
        if (!this.registration) return;

        this.registration.addEventListener('updatefound', () => {
            console.log('[SW Update] New update found');
            
            const newWorker = this.registration.installing;
            
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[SW Update] New version ready');
                    this.updateAvailable = true;
                    this.showUpdatePrompt();
                }
            });
        });

        // Check for updates immediately
        this.registration.update();
    }

    /**
     * Setup periodic update check
     */
    setupPeriodicCheck() {
        setInterval(async () => {
            if (this.registration) {
                try {
                    await this.registration.update();
                } catch (error) {
                    console.error('[SW Update] Periodic check failed:', error);
                }
            }
        }, this.updateCheckInterval);
    }

    /**
     * Setup visibility-based check
     */
    setupVisibilityCheck() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.registration) {
                this.registration.update();
            }
        });
    }

    /**
     * Show update prompt
     */
    showUpdatePrompt() {
        // Remove existing prompt
        const existing = document.getElementById('updatePrompt');
        if (existing) existing.remove();

        const prompt = document.createElement('div');
        prompt.id = 'updatePrompt';
        prompt.className = 'position-fixed bottom-0 start-0 end-0 p-3';
        prompt.style.zIndex = '9999';
        prompt.innerHTML = `
            <div class="alert alert-info alert-dismissible fade show m-3 shadow-lg">
                <div class="d-flex align-items-center">
                    <i class="bi bi-arrow-repeat fs-4 me-3"></i>
                    <div>
                        <strong>Pembaruan Tersedia</strong>
                        <p class="mb-0">Versi baru aplikasi tersedia. Muat ulang untuk menggunakan versi terbaru.</p>
                    </div>
                </div>
                <div class="mt-3 d-flex gap-2">
                    <button class="btn btn-primary btn-sm" onclick="swUpdateHandler.applyUpdate()">
                        <i class="bi bi-check-circle"></i> Perbarui Sekarang
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" data-bs-dismiss="alert">
                        Nanti Saja
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(prompt);
    }

    /**
     * Apply update
     */
    async applyUpdate() {
        try {
            if (this.registration && this.registration.waiting) {
                // Send skip waiting to SW
                this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                
                // Wait for new SW to activate
                await new Promise((resolve) => {
                    navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
                });
            }

            // Reload page
            window.location.reload();
        } catch (error) {
            console.error('[SW Update] Apply failed:', error);
        }
    }

    /**
     * Check for updates manually
     */
    async checkForUpdates() {
        try {
            if (this.registration) {
                await this.registration.update();
                
                if (this.updateAvailable) {
                    this.showUpdatePrompt();
                    return true;
                }
                
                alert('Aplikasi sudah versi terbaru');
                return false;
            }
        } catch (error) {
            console.error('[SW Update] Manual check failed:', error);
            alert('Gagal memeriksa pembaruan');
            return false;
        }
    }

    /**
     * Get current SW version
     */
    async getVersion() {
        try {
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
        } catch (error) {
            console.error('[SW Update] Get version failed:', error);
            return null;
        }
    }
}

// Initialize
const swUpdateHandler = new SWUpdateHandler();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SWUpdateHandler;
}
