/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Advanced Caching System
 * ============================================================
 */

const EnterpriseCache = (() => {
    'use strict';

    // ==================== CACHE CONFIGURATION ====================
    const CONFIG = {
        defaultTTL: 300000, // 5 minutes
        maxCacheSize: 50 * 1024 * 1024, // 50 MB
        cleanupInterval: 600000, // 10 minutes
        strategies: {
            API_RESPONSE: 'api_response',
            STATIC_ASSET: 'static_asset',
            USER_DATA: 'user_data',
            TEMPORARY: 'temporary',
            PERSISTENT: 'persistent',
        },
    };

    // ==================== CACHE ENTRY ====================
    class CacheEntry {
        constructor(key, data, options = {}) {
            this.key = key;
            this.data = data;
            this.createdAt = Date.now();
            this.accessedAt = Date.now();
            this.accessCount = 0;
            this.size = this.estimateSize(data);
            this.ttl = options.ttl || CONFIG.defaultTTL;
            this.strategy = options.strategy || CONFIG.strategies.TEMPORARY;
            this.tags = options.tags || [];
            this.metadata = options.metadata || {};
        }

        isExpired() {
            if (this.ttl === 0) return false; // Never expires
            return Date.now() - this.createdAt > this.ttl;
        }

        access() {
            this.accessedAt = Date.now();
            this.accessCount++;
        }

        estimateSize(data) {
            try {
                const json = JSON.stringify(data);
                return new Blob([json]).size;
            } catch {
                return 0;
            }
        }
    }

    // ==================== CACHE STORE ====================
    class CacheStore {
        constructor() {
            this.memoryCache = new Map();
            this.totalSize = 0;
            this.hitCount = 0;
            this.missCount = 0;
            this.cleanupTimer = null;
        }

        /**
         * Set cache entry
         */
        set(key, data, options = {}) {
            const entry = new CacheEntry(key, data, options);

            // Check size limit
            if (this.totalSize + entry.size > CONFIG.maxCacheSize) {
                this.evictOldest();
            }

            this.memoryCache.set(key, entry);
            this.totalSize += entry.size;

            // Also store in IndexedDB for persistence
            if (options.strategy === CONFIG.strategies.PERSISTENT) {
                this.persistToIndexedDB(key, entry);
            }

            return entry;
        }

        /**
         * Get cache entry
         */
        get(key) {
            const entry = this.memoryCache.get(key);

            if (!entry) {
                this.missCount++;
                return null;
            }

            if (entry.isExpired()) {
                this.delete(key);
                this.missCount++;
                return null;
            }

            entry.access();
            this.hitCount++;
            return entry.data;
        }

        /**
         * Check if key exists and is valid
         */
        has(key) {
            const entry = this.memoryCache.get(key);
            return entry && !entry.isExpired();
        }

        /**
         * Delete cache entry
         */
        delete(key) {
            const entry = this.memoryCache.get(key);
            if (entry) {
                this.totalSize -= entry.size;
                this.memoryCache.delete(key);
            }
        }

        /**
         * Clear all cache
         */
        clear() {
            this.memoryCache.clear();
            this.totalSize = 0;
        }

        /**
         * Clear by tag
         */
        clearByTag(tag) {
            const keysToDelete = [];
            
            this.memoryCache.forEach((entry, key) => {
                if (entry.tags.includes(tag)) {
                    keysToDelete.push(key);
                }
            });

            keysToDelete.forEach(key => this.delete(key));
        }

        /**
         * Clear by strategy
         */
        clearByStrategy(strategy) {
            const keysToDelete = [];
            
            this.memoryCache.forEach((entry, key) => {
                if (entry.strategy === strategy) {
                    keysToDelete.push(key);
                }
            });

            keysToDelete.forEach(key => this.delete(key));
        }

        /**
         * Evict oldest entries
         */
        evictOldest() {
            let entries = Array.from(this.memoryCache.entries());
            
            // Sort by last accessed (oldest first)
            entries.sort((a, b) => a[1].accessedAt - b[1].accessedAt);
            
            // Remove oldest 20%
            const removeCount = Math.max(1, Math.floor(entries.length * 0.2));
            
            for (let i = 0; i < removeCount && entries.length > 0; i++) {
                this.delete(entries[i][0]);
            }
        }

        /**
         * Persist to IndexedDB
         */
        async persistToIndexedDB(key, entry) {
            try {
                if (window.EnterpriseDB) {
                    await window.EnterpriseDB.add('tbl_cache', {
                        key: key,
                        data: JSON.stringify(entry.data),
                        created_at: entry.createdAt,
                        ttl: entry.ttl,
                        strategy: entry.strategy,
                        tags: JSON.stringify(entry.tags),
                    });
                }
            } catch (error) {
                console.warn('Failed to persist cache:', error);
            }
        }

        /**
         * Load from IndexedDB
         */
        async loadFromIndexedDB() {
            try {
                if (window.EnterpriseDB) {
                    const records = await window.EnterpriseDB.getAll('tbl_cache');
                    
                    records.forEach(record => {
                        try {
                            const data = JSON.parse(record.data);
                            this.set(record.key, data, {
                                ttl: record.ttl,
                                strategy: record.strategy,
                                tags: JSON.parse(record.tags || '[]'),
                            });
                        } catch (error) {
                            console.warn('Failed to load cache entry:', error);
                        }
                    });
                }
            } catch (error) {
                console.warn('Failed to load cache from IndexedDB:', error);
            }
        }

        /**
         * Get cache statistics
         */
        getStats() {
            return {
                entries: this.memoryCache.size,
                totalSize: this.totalSize,
                hitCount: this.hitCount,
                missCount: this.missCount,
                hitRate: this.hitCount + this.missCount > 0 
                    ? ((this.hitCount / (this.hitCount + this.missCount)) * 100).toFixed(2) 
                    : 0,
                maxSize: CONFIG.maxCacheSize,
                usagePercent: ((this.totalSize / CONFIG.maxCacheSize) * 100).toFixed(2),
            };
        }

        /**
         * Start cleanup timer
         */
        startCleanup() {
            this.cleanupTimer = setInterval(() => {
                const keysToDelete = [];
                
                this.memoryCache.forEach((entry, key) => {
                    if (entry.isExpired()) {
                        keysToDelete.push(key);
                    }
                });

                keysToDelete.forEach(key => this.delete(key));
                
                if (keysToDelete.length > 0) {
                    console.log(`🧹 Cache cleanup: removed ${keysToDelete.length} expired entries`);
                }
            }, CONFIG.cleanupInterval);
        }

        /**
         * Stop cleanup timer
         */
        stopCleanup() {
            if (this.cleanupTimer) {
                clearInterval(this.cleanupTimer);
                this.cleanupTimer = null;
            }
        }
    }

    // ==================== API RESPONSE CACHER ====================
    class APIResponseCacher {
        constructor(store) {
            this.store = store;
        }

        /**
         * Cache API response
         */
        async cacheResponse(endpoint, params, response, ttl = CONFIG.defaultTTL) {
            const key = this.generateKey(endpoint, params);
            
            this.store.set(key, response, {
                ttl,
                strategy: CONFIG.strategies.API_RESPONSE,
                tags: ['api', endpoint],
                metadata: { endpoint, params },
            });
        }

        /**
         * Get cached API response
         */
        getCachedResponse(endpoint, params) {
            const key = this.generateKey(endpoint, params);
            return this.store.get(key);
        }

        /**
         * Invalidate API cache
         */
        invalidateCache(endpoint) {
            this.store.clearByTag(endpoint);
            this.store.clearByTag('api');
        }

        /**
         * Generate cache key
         */
        generateKey(endpoint, params) {
            const sortedParams = Object.keys(params)
                .sort()
                .reduce((acc, key) => {
                    acc[key] = params[key];
                    return acc;
                }, {});
            
            return `api:${endpoint}:${JSON.stringify(sortedParams)}`;
        }
    }

    // ==================== INITIALIZE ====================
    const cacheStore = new CacheStore();
    const apiCacher = new APIResponseCacher(cacheStore);

    // Start cleanup
    cacheStore.startCleanup();

    // Load persisted cache
    cacheStore.loadFromIndexedDB();

    // ==================== PUBLIC API ====================
    return {
        store: cacheStore,
        api: apiCacher,

        // Basic operations
        get: (key) => cacheStore.get(key),
        set: (key, data, options) => cacheStore.set(key, data, options),
        has: (key) => cacheStore.has(key),
        delete: (key) => cacheStore.delete(key),
        clear: () => cacheStore.clear(),

        // Tag operations
        clearByTag: (tag) => cacheStore.clearByTag(tag),
        clearByStrategy: (strategy) => cacheStore.clearByStrategy(strategy),

        // API caching
        cacheResponse: (endpoint, params, response, ttl) => 
            apiCacher.cacheResponse(endpoint, params, response, ttl),
        getCachedResponse: (endpoint, params) => 
            apiCacher.getCachedResponse(endpoint, params),
        invalidateCache: (endpoint) => 
            apiCacher.invalidateCache(endpoint),

        // Stats
        getStats: () => cacheStore.getStats(),

        // Preload common data
        preload: async () => {
            const preloadData = [
                { endpoint: 'dashboard/stats', params: {}, ttl: 300000 },
                { endpoint: 'instansi/list', params: {}, ttl: 3600000 },
            ];

            for (const item of preloadData) {
                try {
                    const response = await window.GASAPI?.call(item.endpoint, {
                        ...item.params,
                        action: item.endpoint,
                    });
                    
                    if (response?.success) {
                        apiCacher.cacheResponse(item.endpoint, item.params, response, item.ttl);
                    }
                } catch (error) {
                    console.warn(`Failed to preload ${item.endpoint}:`, error);
                }
            }
        },
    };
})();

window.EnterpriseCache = EnterpriseCache;
