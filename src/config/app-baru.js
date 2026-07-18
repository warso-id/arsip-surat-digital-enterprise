require('dotenv').config();

module.exports = {
    // Application
    app: {
        name: process.env.APP_NAME || 'Arsip Surat Digital',
        env: process.env.APP_ENV || 'development',
        url: process.env.APP_URL || 'http://localhost:3000',
        port: parseInt(process.env.APP_PORT) || 3000,
        secret: process.env.APP_SECRET || 'your-secret-key',
        debug: process.env.APP_ENV === 'development'
    },
    
    // Session
    session: {
        secret: process.env.SESSION_SECRET || 'session-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.APP_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    },
    
    // CORS
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: true,
        maxAge: 86400
    },
    
    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        message: {
            status: 429,
            message: 'Terlalu banyak permintaan, silakan coba lagi nanti'
        }
    },
    
    // Pagination
    pagination: {
        defaultPerPage: 20,
        maxPerPage: 100
    }
};
