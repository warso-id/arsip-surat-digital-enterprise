require('dotenv').config();

module.exports = {
    // Session secret
    secret: process.env.SESSION_SECRET || 'session-secret-key-change-this',
    
    // Session store
    store: process.env.SESSION_DRIVER === 'redis' ? 'redis' : 'memory',
    
    // Redis configuration (if using Redis)
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        prefix: 'sess:',
        ttl: 86400 // 24 hours
    },
    
    // Cookie configuration
    cookie: {
        name: 'arsip_surat.sid',
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    
    // Session configuration
    resave: false,
    saveUninitialized: false,
    rolling: true
};
