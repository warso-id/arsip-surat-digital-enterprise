// ============================================
// Offline Handler
// ============================================

class OfflineHandler {
    constructor() {
        this.pendingActions = [];
        this.isOnline = navigator.onLine;
        this.init();
    }

    /**
     * Initialize offline handler
     */
    init() {
        // Monitor online/offline status
        window.addEventListener('online', () => this.onOnline());
        window.addEventListener('offline', () => this.onOffline());
        
        // Load pending actions from localStorage
        this.loadPendingActions();
        
        // Initial status
        this.updateUI();
    }

    /**
     * Handle online event
     */
    async onOnline() {
        console.log('[Offline] Back online');
        this.isOnline = true;
        this.updateUI();
        
        // Process pending actions
        await this.processPendingActions();
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('online-status-changed', {
            detail: { online: true }
        }));
    }

    /**
     * Handle offline event
     */
    onOffline() {
        console.log('[Offline] Went offline');
        this.isOnline = false;
        this.updateUI();
        
        // Show offline notification
        this.showOfflineNotification();
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('online-status-changed', {
            detail: { online: false }
        }));
    }

    /**
     * Update UI based on online status
     */
    updateUI() {
        const indicator = document.getElementById('onlineStatus');
        
        if (indicator) {
            if (this.isOnline) {
                indicator.className = 'badge bg-success';
                indicator.innerHTML = '<i class="bi bi-wifi"></i> Online';
            } else {
                indicator.className = 'badge bg-danger';
                indicator.innerHTML = '<i class="bi bi-wifi-off"></i> Offline';
            }
        }
        
        // Disable/enable forms
        document.querySelectorAll('form[data-offline="disable"]').forEach(form => {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = !this.isOnline;
            }
        });
    }

    /**
     * Show offline notification
     */
    showOfflineNotification() {
        // Remove existing notification
        const existing = document.getElementById('offlineNotification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.id = 'offlineNotification';
        notification.className = 'alert alert-warning alert-dismissible fade show position-fixed bottom-0 start-0 end-0 m-3';
        notification.style.zIndex = '9999';
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-wifi-off me-2 fs-5"></i>
                <div>
                    <strong>Anda sedang offline</strong><br>
                    <small>Data akan disimpan secara lokal dan disinkronisasi saat koneksi kembali.</small>
                </div>
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
            </div>
            <div class="progress mt-2" style="height: 3px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                     style="width: 100%"></div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove when back online
        const removeWhenOnline = () => {
            notification.remove();
            window.removeEventListener('online', removeWhenOnline);
        };
        window.addEventListener('online', removeWhenOnline);
        
        // Auto remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    /**
     * Add pending action
     */
    async addPendingAction(action) {
        this.pendingActions.push({
            ...action,
            timestamp: Date.now(),
            id: this.generateId()
        });
        
        this.savePendingActions();
    }

    /**
     * Process pending actions
     */
    async processPendingActions() {
        if (this.pendingActions.length === 0) return;
        
        console.log(`[Offline] Processing ${this.pendingActions.length} pending actions`);
        
        const actions = [...this.pendingActions];
        const successful = [];
        const failed = [];
        
        for (const action of actions) {
            try {
                await this.executeAction(action);
                successful.push(action.id);
            } catch (error) {
                console.error('[Offline] Action failed:', action, error);
                failed.push(action);
            }
        }
        
        // Remove successful actions
        this.pendingActions = failed;
        this.savePendingActions();
        
        // Notify
        if (successful.length > 0) {
            this.showSyncNotification(successful.length);
        }
        
        console.log(`[Offline] Sync complete: ${successful.length} success, ${failed.length} failed`);
    }

    /**
     * Execute single action
     */
    async executeAction(action) {
        const config = {
            method: action.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...action.headers
            }
        };
        
        if (action.body && action.method !== 'GET') {
            config.body = typeof action.body === 'string' 
                ? action.body 
                : JSON.stringify(action.body);
        }
        
        const response = await fetch(action.url, config);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
    }

    /**
     * Save pending actions to localStorage
     */
    savePendingActions() {
        try {
            localStorage.setItem(
                'pendingOfflineActions',
                JSON.stringify(this.pendingActions)
            );
        } catch (error) {
            console.error('[Offline] Failed to save pending actions:', error);
        }
    }

    /**
     * Load pending actions from localStorage
     */
    loadPendingActions() {
        try {
            const stored = localStorage.getItem('pendingOfflineActions');
            if (stored) {
                this.pendingActions = JSON.parse(stored);
                console.log(`[Offline] Loaded ${this.pendingActions.length} pending actions`);
            }
        } catch (error) {
            console.error('[Offline] Failed to load pending actions:', error);
            this.pendingActions = [];
        }
    }

    /**
     * Show sync notification
     */
    showSyncNotification(count) {
        const notification = document.createElement('div');
        notification.className = 'alert alert-success alert-dismissible fade show position-fixed bottom-0 end-0 m-3';
        notification.style.zIndex = '9999';
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-cloud-check me-2"></i>
                <span>${count} data berhasil disinkronisasi</span>
                <button type="button" class="btn-close ms-2" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 5000);
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Get pending count
     */
    getPendingCount() {
        return this.pendingActions.length;
    }

    /**
     * Clear all pending actions
     */
    clearPending() {
        this.pendingActions = [];
        this.savePendingActions();
    }
}

// Initialize
const offlineHandler = new OfflineHandler();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OfflineHandler;
}
