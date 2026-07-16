// ==================== CACHE SERVICE ====================
// Arsip Surat Digital Enterprise
// In-memory dan file-based caching

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CacheService {
    constructor() {
        this.memoryCache = new Map();
        this.cacheDir = path.join(__dirname, '..', '..', 'storage', 'cache');
        this.defaultTTL = 3600000; // 1 hour
        this.cleanupInterval = 300000; // 5 minutes
        
        this.startCleanup();
    }

    /**
     * Set cache value
     */
    async set(key, value, ttl = this.defaultTTL) {
        const cacheKey = this.generateKey(key);
        const expiresAt = Date.now() + ttl;
        
        // Memory cache
        this.memoryCache.set(cacheKey, {
            value: value,
            expiresAt: expiresAt,
        });

        // File cache untuk persistence
        try {
            const cacheFile = path.join(this.cacheDir, `${cacheKey}.cache`);
            const cacheData = {
                value: value,
                expiresAt: expiresAt,
                created: Date.now(),
            };
            const encoded = Buffer.from(JSON.stringify(cacheData)).toString('base64');
            await fs.mkdir(this.cacheDir, { recursive: true });
            await fs.writeFile(cacheFile, encoded);
        } catch (error) {
            console.error('Cache file write error:', error.message);
        }
    }

    /**
     * Get cache value
     */
    async get(key) {
        const cacheKey = this.generateKey(key);
        
        // Check memory cache first
        if (this.memoryCache.has(cacheKey)) {
            const cached = this.memoryCache.get(cacheKey);
            if (Date.now() < cached.expiresAt) {
                return cached.value;
            }
            this.memoryCache.delete(cacheKey);
        }

        // Check file cache
        try {
            const cacheFile = path.join(this.cacheDir, `${cacheKey}.cache`);
            const encoded = await fs.readFile(cacheFile, 'utf-8');
            const cached = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
            
            if (Date.now() < cached.expiresAt) {
                // Restore to memory
                this.memoryCache.set(cacheKey, {
                    value: cached.value,
                    expiresAt: cached.expiresAt,
                });
                return cached.value;
            }
            
            // Expired, delete file
            await fs.unlink(cacheFile).catch(() => {});
        } catch (error) {
            // Cache miss
        }

        return null;
    }

    /**
     * Delete cache
     */
    async delete(key) {
        const cacheKey = this.generateKey(key);
        this.memoryCache.delete(cacheKey);
        
        try {
            const cacheFile = path.join(this.cacheDir, `${cacheKey}.cache`);
            await fs.unlink(cacheFile);
        } catch (error) {
            // File doesn't exist
        }
    }

    /**
     * Clear all cache
     */
    async clear() {
        this.memoryCache.clear();
        
        try {
            const files = await fs.readdir(this.cacheDir);
            for (const file of files) {
                await fs.unlink(path.join(this.cacheDir, file));
            }
        } catch (error) {
            // Directory doesn't exist
        }
    }

    /**
     * Remember cache (get or set)
     */
    async remember(key, ttl, callback) {
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        
        const value = await callback();
        await this.set(key, value, ttl);
        return value;
    }

    /**
     * Generate cache key
     */
    generateKey(key) {
        if (typeof key === 'string') {
            return crypto.createHash('md5').update(key).digest('hex');
        }
        return crypto.createHash('md5').update(JSON.stringify(key)).digest('hex');
    }

    /**
     * Start cleanup interval
     */
    startCleanup() {
        setInterval(() => {
            this.cleanup();
        }, this.cleanupInterval);
    }

    /**
     * Cleanup expired cache
     */
    async cleanup() {
        const now = Date.now();
        let cleaned = 0;

        // Clean memory
        for (const [key, value] of this.memoryCache.entries()) {
            if (now > value.expiresAt) {
                this.memoryCache.delete(key);
                cleaned++;
            }
        }

        // Clean files
        try {
            const files = await fs.readdir(this.cacheDir);
            for (const file of files) {
                try {
                    const cacheFile = path.join(this.cacheDir, file);
                    const encoded = await fs.readFile(cacheFile, 'utf-8');
                    const cached = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
                    
                    if (now > cached.expiresAt) {
                        await fs.unlink(cacheFile);
                        cleaned++;
                    }
                } catch (error) {
                    // Skip corrupted files
                }
            }
        } catch (error) {
            // Directory doesn't exist
        }

        if (cleaned > 0) {
            console.log(`Cache cleanup: ${cleaned} items removed`);
        }
    }

    /**
     * Get cache stats
     */
    getStats() {
        return {
            memorySize: this.memoryCache.size,
            timestamp: new Date().toISOString(),
        };
    }
}

module.exports = new CacheService();
