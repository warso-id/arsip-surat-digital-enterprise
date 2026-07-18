// ============================================
// Cache Manager
// ============================================

class CacheManager {
    constructor() {
        this.cacheNames = {
            static: 'arsip-surat-static',
            dynamic: 'arsip-surat-dynamic',
            api: 'arsip-surat-api',
            images: 'arsip-surat-images'
        };
    }

    /**
     * Get cache stats
     */
    async getStats() {
        try {
            if (!('caches' in window)) {
                return null;
            }

            const stats = {};
            let totalSize = 0;
            let totalEntries = 0;

            for (const [key, cacheName] of Object.entries(this.cacheNames)) {
                try {
                    const cache = await caches.open(cacheName);
                    const keys = await cache.keys();
                    let size = 0;

                    for (const request of keys) {
                        const response = await cache.match(request);
                        if (response) {
                            const blob = await response.clone().blob();
                            size += blob.size;
                        }
                    }

                    stats[key] = {
                        name: cacheName,
                        entries: keys.length,
                        size: size,
                        sizeFormatted: this.formatSize(size)
                    };

                    totalSize += size;
                    totalEntries += keys.length;
                } catch (error) {
                    stats[key] = {
                        name: cacheName,
                        error: error.message
                    };
                }
            }

            return {
                caches: stats,
                total: {
                    entries: totalEntries,
                    size: totalSize,
                    sizeFormatted: this.formatSize(totalSize)
                }
            };
        } catch (error) {
            console.error('[Cache Manager] Failed to get stats:', error);
            return null;
        }
    }

    /**
     * Clear specific cache
     */
    async clearCache(cacheName) {
        try {
            if ('caches' in window) {
                await caches.delete(cacheName);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[Cache Manager] Failed to clear cache:', error);
            return false;
        }
    }

    /**
     * Clear all caches
     */
    async clearAllCaches() {
        try {
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(name => caches.delete(name))
                );
                return true;
            }
            return false;
        } catch (error) {
            console.error('[Cache Manager] Failed to clear all caches:', error);
            return false;
        }
    }

    /**
     * Precache URL
     */
    async precacheUrl(url) {
        try {
            if ('caches' in window) {
                const cache = await caches.open(this.cacheNames.dynamic);
                await cache.add(url);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[Cache Manager] Failed to precache:', error);
            return false;
        }
    }

    /**
     * Precache multiple URLs
     */
    async precacheUrls(urls) {
        try {
            if ('caches' in window) {
                const cache = await caches.open(this.cacheNames.dynamic);
                await Promise.all(
                    urls.map(url => cache.add(url).catch(err => {
                        console.warn('[Cache Manager] Failed to precache:', url, err);
                    }))
                );
                return true;
            }
            return false;
        } catch (error) {
            console.error('[Cache Manager] Failed to precache URLs:', error);
            return false;
        }
    }

    /**
     * Check if URL is cached
     */
    async isCached(url) {
        try {
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                
                for (const cacheName of cacheNames) {
                    const cache = await caches.open(cacheName);
                    const match = await cache.match(url);
                    if (match) return true;
                }
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get cached response
     */
    async getCachedResponse(url) {
        try {
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                
                for (const cacheName of cacheNames) {
                    const cache = await caches.open(cacheName);
                    const match = await cache.match(url);
                    if (match) return match;
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Format size
     */
    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Render cache stats UI
     */
    async renderStats(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const stats = await this.getStats();
        
        if (!stats) {
            container.innerHTML = '<p class="text-muted">Cache API tidak didukung</p>';
            return;
        }

        container.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">Cache Storage</h6>
                    <button class="btn btn-sm btn-outline-danger" onclick="cacheManager.clearAllCaches()">
                        <i class="bi bi-trash"></i> Hapus Semua
                    </button>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span>Total Entries:</span>
                            <strong>${stats.total.entries}</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Total Size:</span>
                            <strong>${stats.total.sizeFormatted}</strong>
                        </div>
                    </div>
                    
                    <div class="list-group">
                        ${Object.entries(stats.caches).map(([key, cache]) => `
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>${key}</strong>
                                    <br>
                                    <small class="text-muted">
                                        ${cache.entries || 0} entries | 
                                        ${cache.sizeFormatted || 'Unknown'}
                                    </small>
                                </div>
                                <button class="btn btn-sm btn-outline-danger" 
                                        onclick="cacheManager.clearCache('${cache.name}')">
                                    <i class="bi bi-x"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize
const cacheManager = new CacheManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheManager;
}
