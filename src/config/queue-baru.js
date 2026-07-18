require('dotenv').config();

module.exports = {
    default: process.env.QUEUE_DRIVER || 'sync',
    
    connections: {
        sync: {
            driver: 'sync'
        },
        
        redis: {
            driver: 'redis',
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD
            },
            queue: process.env.QUEUE_NAME || 'default',
            retryAfter: 90
        },
        
        database: {
            driver: 'database',
            table: 'jobs',
            queue: 'default',
            retryAfter: 90
        }
    },
    
    failed: {
        driver: process.env.QUEUE_FAILED_DRIVER || 'database',
        database: {
            table: 'failed_jobs'
        }
    }
};
