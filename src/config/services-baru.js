require('dotenv').config();

module.exports = {
    // Email service
    email: {
        provider: process.env.EMAIL_PROVIDER || 'smtp',
        from: process.env.MAIL_FROM_ADDRESS || 'noreply@arsipsurat.com',
        fromName: process.env.MAIL_FROM_NAME || 'Arsip Surat Digital'
    },
    
    // Storage service
    storage: {
        driver: process.env.STORAGE_DRIVER || 'local',
        local: {
            path: process.env.STORAGE_PATH || './storage'
        },
        s3: {
            key: process.env.AWS_ACCESS_KEY_ID,
            secret: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_DEFAULT_REGION,
            bucket: process.env.AWS_BUCKET
        }
    },
    
    // Cache service
    cache: {
        driver: process.env.CACHE_DRIVER || 'redis',
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD
        }
    },
    
    // Queue service
    queue: {
        driver: process.env.QUEUE_DRIVER || 'sync',
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD
        }
    },
    
    // Search service
    search: {
        driver: process.env.SEARCH_DRIVER || 'database',
        elasticsearch: {
            node: process.env.ELASTICSEARCH_NODE,
            index: process.env.ELASTICSEARCH_INDEX || 'arsip_surat'
        }
    },
    
    // Notification service
    notification: {
        channels: ['database', 'email'],
        email: {
            enabled: process.env.NOTIFICATION_EMAIL === 'true'
        },
        push: {
            enabled: process.env.NOTIFICATION_PUSH === 'true',
            vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
            vapidPrivateKey: process.env.VAPID_PRIVATE_KEY
        }
    },
    
    // Backup service
    backup: {
        enabled: process.env.BACKUP_ENABLED === 'true',
        path: process.env.BACKUP_PATH || './backups',
        retention: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
        schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *'
    }
};
