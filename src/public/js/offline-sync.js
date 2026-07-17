/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Offline Sync Engine
 * ============================================================
 * Handles data synchronization when offline/online
 * ============================================================
 */

const EnterpriseOfflineSync = (() => {
    'use strict';

    // ==================== SYNC CONFIGURATION ====================
    const SYNC_CONFIG = {
        maxRetries: 5,
        retryDelay: 3000,
        batchSize: 10,
        syncInterval: 30000, // 30 seconds
        conflictResolution: 'server-wins', // server-wins | client-wins | manual
    };

    // ==================== SYNC QUEUE ====================
    class SyncQueue {
        constructor() {
            this.queue = [];
            this.processing = false;
            this.loadQueue();
        }

        /**
         * Add item to sync queue
         */
        add(action, data, options = {}) {
            const item = {
                id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                action,
                data,
                options,
                timestamp: Date.now(),
                retries: 0,
                status: 'pending', // pending, processing, completed, failed
                createdAt: new Date().toISOString(),
            };

            this.queue.push(item);
            this.saveQueue();
            this.scheduleProcess();

            return item.id;
        }

        /**
         * Process sync queue
         */
        async process() {
            if (this.processing || this.queue.length === 0) return;
            if (!navigator.onLine) return;

            this.processing = true;
            console.log(`🔄 Processing sync queue: ${this.queue.length} items`);

            const batch = this.queue
                .filter(item => item.status === 'pending')
                .slice(0, SYNC_CONFIG.batchSize);

            let successCount = 0;
            let failCount = 0;

            for (const item of batch) {
                try {
                    item.status = 'processing';
                    item.retries++;
                    
                    // Attempt sync via Google Apps Script
                    const response = await this.syncItem(item);
                    
                    if (response?.success) {
                        item.status = 'completed';
                        item.completedAt = new Date().toISOString();
                        successCount++;
                    } else {
                        throw new Error(response?.error || 'Sync failed');
                    }
                } catch (error) {
                    failCount++;
                    
                    if (item.retries >= SYNC_CONFIG.maxRetries) {
                        item.status = 'failed';
                        item.error = error.message;
                        item.failedAt = new Date().toISOString();
                    } else {
                        item.status = 'pending';
                        item.lastError = error.message;
                    }
                }
            }

            // Clean completed items
            this.queue = this.queue.filter(item => 
                item.status !== 'completed'
            );

            this.saveQueue();
            this.processing = false;

            console.log(`✅ Sync batch complete: ${successCount} success, ${failCount} failed`);

            // Process remaining if any
            if (this.queue.some(item => item.status === 'pending')) {
                this.scheduleProcess();
            }

            return { successCount, failCount };
        }

        /**
         * Sync single item
         */
        async syncItem(item) {
            // Use Enterprise Connector if available
            if (window.EnterpriseConnector) {
                return window.EnterpriseConnector.request(item.action, {
                    ...item.data,
                    _syncId: item.id,
                    _syncTimestamp: item.timestamp,
                });
            }

            // Fallback: direct JSONP
            return new Promise((resolve, reject) => {
                const callbackName = `syncCallback_${item.id}`;
                const encoded = btoa(unescape(encodeURIComponent(JSON.stringify({
                    ...item.data,
                    action: item.action,
                }))));

                const url = `https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec?action=${item.action}&data=${encoded}&callback=${callbackName}`;

                const timeout = setTimeout(() => {
                    cleanup();
                    reject(new Error('Sync timeout'));
                }, 30000);

                window[callbackName] = (response) => {
                    cleanup();
                    resolve(response);
                };

                const script = document.createElement('script');
                script.src = url;
                script.onerror = () => {
                    cleanup();
                    reject(new Error('Network error'));
                };

                function cleanup() {
                    clearTimeout(timeout);
                    delete window[callbackName];
                    if (script.parentNode) script.parentNode.removeChild(script);
                }

                document.head.appendChild(script);
            });
        }

        /**
         * Schedule processing
         */
        scheduleProcess() {
            setTimeout(() => this.process(), SYNC_CONFIG.syncInterval);
        }

        /**
         * Load queue from storage
         */
        loadQueue() {
            try {
                const saved = localStorage.getItem('sync_queue');
                if (saved) {
                    this.queue = JSON.parse(saved);
                }
            } catch (e) {
                this.queue = [];
            }
        }

        /**
         * Save queue to storage
         */
        saveQueue() {
            try {
                localStorage.setItem('sync_queue', JSON.stringify(this.queue));
            } catch (e) {
                console.warn('Failed to save sync queue:', e);
            }
        }

        /**
         * Get queue stats
         */
        getStats() {
            return {
                total: this.queue.length,
                pending: this.queue.filter(i => i.status === 'pending').length,
                processing: this.queue.filter(i => i.status === 'processing').length,
                failed: this.queue.filter(i => i.status === 'failed').length,
                completed: this.queue.filter(i => i.status === 'completed').length,
            };
        }

        /**
         * Clear queue
         */
        clear() {
            this.queue = [];
            this.saveQueue();
        }

        /**
         * Retry failed items
         */
        retryFailed() {
            this.queue.forEach(item => {
                if (item.status === 'failed') {
                    item.status = 'pending';
                    item.retries = 0;
                }
            });
            this.saveQueue();
            this.process();
        }
    }

    // ==================== CONFLICT RESOLVER ====================
    class ConflictResolver {
        /**
         * Resolve conflict between local and server data
         */
        resolve(localData, serverData, strategy = SYNC_CONFIG.conflictResolution) {
            switch (strategy) {
                case 'server-wins':
                    return serverData;
                case 'client-wins':
                    return localData;
                case 'last-modified':
                    return new Date(localData.updated_at) > new Date(serverData.updated_at) 
                        ? localData 
                        : serverData;
                case 'merge':
                    return { ...serverData, ...localData };
                default:
                    return serverData;
            }
        }

        /**
         * Detect conflicts
         */
        detectConflict(localData, serverData) {
            if (!localData || !serverData) return false;
            
            const localTime = new Date(localData.updated_at).getTime();
            const serverTime = new Date(serverData.updated_at).getTime();
            
            return localTime > serverTime;
        }
    }

    // ==================== DATA VALIDATOR ====================
    class DataValidator {
        /**
         * Validate data before sync
         */
        validate(data, schema) {
            const errors = [];

            if (!schema) return { valid: true, errors: [] };

            Object.entries(schema).forEach(([field, rules]) => {
                const value = data[field];

                if (rules.required && (value === undefined || value === null || value === '')) {
                    errors.push({ field, message: `${field} is required` });
                }

                if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
                    errors.push({ field, message: `${field} must be at least ${rules.minLength} characters` });
                }

                if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
                    errors.push({ field, message: `${field} must be at most ${rules.maxLength} characters` });
                }

                if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
                    errors.push({ field, message: `${field} format is invalid` });
                }

                if (rules.type && typeof value !== rules.type) {
                    errors.push({ field, message: `${field} must be of type ${rules.type}` });
                }
            });

            return {
                valid: errors.length === 0,
                errors,
            };
        }
    }

    // ==================== INITIALIZE ====================
    const syncQueue = new SyncQueue();
    const conflictResolver = new ConflictResolver();
    const dataValidator = new DataValidator();

    // Process queue when coming online
    window.addEventListener('online', () => {
        console.log('🌐 Online - processing sync queue...');
        syncQueue.process();
    });

    // Process queue periodically
    setInterval(() => {
        if (navigator.onLine) {
            syncQueue.process();
        }
    }, SYNC_CONFIG.syncInterval);

    // Initial process
    if (navigator.onLine) {
        syncQueue.process();
    }

    // ==================== PUBLIC API ====================
    return {
        queue: syncQueue,
        conflict: conflictResolver,
        validator: dataValidator,

        // Queue operations
        addToSync: (action, data, options) => syncQueue.add(action, data, options),
        processSync: () => syncQueue.process(),
        getSyncStats: () => syncQueue.getStats(),
        retryFailed: () => syncQueue.retryFailed(),
        clearSync: () => syncQueue.clear(),

        // Validation
        validate: (data, schema) => dataValidator.validate(data, schema),

        // Conflict resolution
        resolveConflict: (local, server, strategy) => conflictResolver.resolve(local, server, strategy),
        detectConflict: (local, server) => conflictResolver.detectConflict(local, server),
    };
})();

window.EnterpriseOfflineSync = EnterpriseOfflineSync;
