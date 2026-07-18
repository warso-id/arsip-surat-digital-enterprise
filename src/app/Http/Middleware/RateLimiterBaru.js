const rateLimit = require('express-rate-limit');
const ResponseHelper = require('../../Helpers/ResponseHelper');

class RateLimiter {
    /**
     * General rate limiter
     */
    static general() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: {
                status: 429,
                message: 'Terlalu banyak permintaan, silakan coba lagi dalam 15 menit'
            },
            standardHeaders: true,
            legacyHeaders: false
        });
    }

    /**
     * Strict rate limiter for auth routes
     */
    static auth() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // limit each IP to 5 login attempts per windowMs
            message: {
                status: 429,
                message: 'Terlalu banyak percobaan login, silakan coba lagi dalam 15 menit'
            },
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests: true
        });
    }

    /**
     * API rate limiter
     */
    static api() {
        return rateLimit({
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 60, // limit each IP to 60 requests per minute
            message: {
                status: 429,
                message: 'Terlalu banyak permintaan API, silakan kurangi frekuensi permintaan'
            },
            standardHeaders: true,
            legacyHeaders: false
        });
    }

    /**
     * Upload rate limiter
     */
    static upload() {
        return rateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 10, // limit each IP to 10 uploads per hour
            message: {
                status: 429,
                message: 'Batas upload tercapai, silakan coba lagi nanti'
            },
            standardHeaders: true,
            legacyHeaders: false
        });
    }
}

module.exports = RateLimiter;
