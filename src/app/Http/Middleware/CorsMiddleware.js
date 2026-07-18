class CorsMiddleware {
    /**
     * Handle CORS
     */
    static handle(req, res, next) {
        // Allow origins
        const allowedOrigins = process.env.CORS_ORIGIN 
            ? process.env.CORS_ORIGIN.split(',') 
            : ['*'];

        const origin = req.headers.origin;
        
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin || '*');
        }

        // Allow methods
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        
        // Allow headers
        res.header('Access-Control-Allow-Headers', 
            'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token'
        );
        
        // Allow credentials
        res.header('Access-Control-Allow-Credentials', 'true');
        
        // Expose headers
        res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, X-Total-Count');
        
        // Max age for preflight
        res.header('Access-Control-Max-Age', '86400');

        // Handle preflight
        if (req.method === 'OPTIONS') {
            return res.status(204).end();
        }

        next();
    }

    /**
     * Strict CORS for production
     */
    static strict(req, res, next) {
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
        const origin = req.headers.origin;

        if (!origin) {
            return res.status(403).json({ message: 'Origin not allowed' });
        }

        if (!allowedOrigins.includes(origin) && !allowedOrigins.includes('*')) {
            return res.status(403).json({ message: 'Origin not allowed' });
        }

        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Vary', 'Origin');

        if (req.method === 'OPTIONS') {
            return res.status(204).end();
        }

        next();
    }
}

module.exports = CorsMiddleware;
