// ==================== CACHE MIDDLEWARE ====================
// Arsip Surat Digital Enterprise

const cacheService = require('../services/CacheService');

class CacheMiddleware {
    /**
     * Cache response untuk durasi tertentu
     */
    static cache(duration = 300000) {
        return async (req, res, next) => {
            // Only cache GET requests
            if (req.method !== 'GET') return next();
            
            const key = `cache:${req.originalUrl}`;
            const cached = await cacheService.get(key);
            
            if (cached) {
                return res.json({
                    success: true,
                    data: cached,
                    cached: true,
                });
            }
            
            // Override res.json untuk menyimpan response ke cache
            const originalJson = res.json.bind(res);
            res.json = function(body) {
                if (body.success && body.data) {
                    cacheService.set(key, body.data, duration);
                }
                return originalJson(body);
            };
            
            next();
        };
    }

    /**
     * Clear cache untuk pattern tertentu
     */
    static clearCache(pattern) {
        return async (req, res, next) => {
            const originalJson = res.json.bind(res);
            res.json = async function(body) {
                if (body.success) {
                    // Clear related caches
                    if (pattern) {
                        await cacheService.delete(pattern);
                    }
                }
                return originalJson(body);
            };
            next();
        };
    }
}

module.exports = CacheMiddleware;
