// queue.js - Queue Configuration
const QueueConfig = {
    // Default queue driver
    default: 'sync', // sync, database, redis
    
    // Queue connections
    connections: {
        // Synchronous (no queue)
        sync: {
            driver: 'sync'
        },
        
        // Database queue
        database: {
            driver: 'database',
            table: 'jobs',
            queue: 'default',
            retryAfter: 90
        },
        
        // Redis queue
        redis: {
            driver: 'redis',
            connection: 'default',
            queue: 'default',
            retryAfter: 90,
            blockFor: null
        }
    },
    
    // Failed jobs
    failed: {
        driver: 'database',
        database: 'database',
        table: 'failed_jobs'
    },
    
    // Queue workers
    workers: {
        email: {
            queue: 'emails',
            sleep: 3,
            maxTries: 3,
            delay: 0,
            timeout: 60
        },
        notification: {
            queue: 'notifications',
            sleep: 3,
            maxTries: 3,
            delay: 0,
            timeout: 30
        },
        backup: {
            queue: 'backups',
            sleep: 5,
            maxTries: 1,
            delay: 0,
            timeout: 300
        },
        report: {
            queue: 'reports',
            sleep: 5,
            maxTries: 2,
            delay: 0,
            timeout: 120
        },
        default: {
            queue: 'default',
            sleep: 3,
            maxTries: 3,
            delay: 0,
            timeout: 60
        }
    },
    
    // Job batching
    batch: {
        enabled: true,
        maxJobsPerBatch: 100,
        timeout: 3600
    },
    
    // Job middleware
    middleware: [
        // Rate limiting
        'App.Middleware.RateLimitJob',
        // Logging
        'App.Middleware.LogJob'
    ],
    
    // Job events
    events: {
        before: [],
        after: [],
        failing: [],
        failed: []
    },
    
    // Monitoring
    monitor: {
        enabled: true,
        horizon: {
            enabled: false,
            path: 'horizon'
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = QueueConfig;
}
