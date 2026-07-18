module.exports = {
    // Allowed origins
    allowedOrigins: (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim()),
    
    // Allowed methods
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    
    // Allowed headers
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-CSRF-Token',
        'X-API-Key'
    ],
    
    // Exposed headers
    exposedHeaders: [
        'Content-Length',
        'Content-Range',
        'X-Total-Count',
        'X-Response-Time'
    ],
    
    // Credentials
    credentials: true,
    
    // Max age for preflight (24 hours)
    maxAge: 86400,
    
    // Success status for OPTIONS
    optionsSuccessStatus: 204
};
