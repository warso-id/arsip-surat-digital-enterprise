class SecurityHeadersMiddleware {
    static handle(req, res, next) {
        // Content Security Policy
        res.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.jsdelivr.net cdnjs.cloudflare.com; " +
            "style-src 'self' 'unsafe-inline' cdn.jsdelivr.net cdnjs.cloudflare.com fonts.googleapis.com; " +
            "font-src 'self' fonts.gstatic.com; " +
            "img-src 'self' data: blob:; " +
            "connect-src 'self' *;"
        );

        // Prevent MIME type sniffing
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // Prevent clickjacking
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');

        // Enable XSS filter
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // Referrer policy
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // HTTP Strict Transport Security (only in production)
        if (process.env.NODE_ENV === 'production') {
            res.setHeader(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload'
            );
        }

        // Permissions policy
        res.setHeader(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), interest-cohort=()'
        );

        next();
    }
}

module.exports = SecurityHeadersMiddleware;
