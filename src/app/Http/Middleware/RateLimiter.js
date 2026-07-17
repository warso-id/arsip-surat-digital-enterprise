// RateLimiter.js - Rate Limiting Middleware
class RateLimiter {
    constructor() {
        this.maxRequests = 100;
        this.windowMs = 60000; // 1 minute
        this.requests = new Map();
        this.blockedIPs = new Set();
    }

    async handle(request) {
        const clientIP = this.getClientIP();
        
        // Check if IP is blocked
        if (this.blockedIPs.has(clientIP)) {
            return {
                allowed: false,
                message: 'IP diblokir karena terlalu banyak request',
                retryAfter: 3600
            };
        }

        // Get current window
        const now = Date.now();
        const windowStart = now - this.windowMs;

        // Clean old requests
        this.cleanOldRequests(clientIP, windowStart);

        // Get current request count
        const requestCount = this.getRequestCount(clientIP);

        // Check if rate limit exceeded
        if (requestCount >= this.maxRequests) {
            // Block IP for 1 hour if exceeded 3 times
            if (this.getBlockCount(clientIP) >= 3) {
                this.blockedIPs.add(clientIP);
                setTimeout(() => this.blockedIPs.delete(clientIP), 3600000);
            }

            this.incrementBlockCount(clientIP);

            return {
                allowed: false,
                message: 'Rate limit exceeded. Coba lagi nanti.',
                retryAfter: Math.ceil(this.windowMs / 1000)
            };
        }

        // Add current request
        this.addRequest(clientIP, now);

        return {
            allowed: true
        };
    }

    addRequest(ip, timestamp) {
        if (!this.requests.has(ip)) {
            this.requests.set(ip, []);
        }
        this.requests.get(ip).push(timestamp);
    }

    getRequestCount(ip) {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        
        if (!this.requests.has(ip)) {
            return 0;
        }

        return this.requests.get(ip).filter(time => time > windowStart).length;
    }

    cleanOldRequests(ip, windowStart) {
        if (this.requests.has(ip)) {
            const requests = this.requests.get(ip);
            this.requests.set(ip, requests.filter(time => time > windowStart));
        }
    }

    getBlockCount(ip) {
        const key = `block_count_${ip}`;
        return parseInt(localStorage.getItem(key) || '0');
    }

    incrementBlockCount(ip) {
        const key = `block_count_${ip}`;
        const count = this.getBlockCount(ip) + 1;
        localStorage.setItem(key, count.toString());
        
        // Reset after 1 hour
        setTimeout(() => localStorage.removeItem(key), 3600000);
    }

    getClientIP() {
        // In browser environment, use a combination of factors
        const factors = [
            navigator.userAgent,
            navigator.language,
            screen.width,
            screen.height
        ].join('|');
        
        return btoa(factors).substring(0, 16);
    }

    resetLimit(ip) {
        this.requests.delete(ip);
        localStorage.removeItem(`block_count_${ip}`);
    }

    getRemainingRequests(ip) {
        return Math.max(0, this.maxRequests - this.getRequestCount(ip));
    }

    getResetTime() {
        return Math.ceil(this.windowMs / 1000);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RateLimiter;
}
