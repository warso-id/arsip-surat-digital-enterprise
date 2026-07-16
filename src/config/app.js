// ==================== APP CONFIGURATION ====================
// Arsip Surat Digital Enterprise - Main Configuration
// Version: 2.1.0

require('dotenv').config();

const path = require('path');

const config = {
    // ==================== APPLICATION ====================
    app: {
        name: process.env.APP_NAME || 'Arsip Surat Digital Enterprise',
        version: '2.1.0',
        env: process.env.NODE_ENV || 'development',
        debug: process.env.APP_DEBUG === 'true' || false,
        url: process.env.APP_URL || 'http://localhost:3000',
        port: parseInt(process.env.PORT) || 3000,
        host: process.env.HOST || '0.0.0.0',
        timezone: process.env.APP_TIMEZONE || 'Asia/Jakarta',
        locale: process.env.APP_LOCALE || 'id',
        key: process.env.APP_KEY || 'base64:your-app-key-here',
        cipher: 'AES-256-CBC',
    },

    // ==================== DATABASE ====================
    database: {
        connection: process.env.DB_CONNECTION || 'sqlite',
        sqlite: {
            path: path.join(__dirname, '..', 'database', process.env.DB_SQLITE_PATH || 'database.sqlite'),
        },
        mysql: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 3306,
            database: process.env.DB_DATABASE || 'arsip_surat',
            username: process.env.DB_USERNAME || 'root',
            password: process.env.DB_PASSWORD || '',
            charset: 'utf8mb4',
            collation: 'utf8mb4_unicode_ci',
        },
        postgresql: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 5432,
            database: process.env.DB_DATABASE || 'arsip_surat',
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || '',
        },
        pool: {
            min: parseInt(process.env.DB_POOL_MIN) || 2,
            max: parseInt(process.env.DB_POOL_MAX) || 10,
            idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
        },
        migrations: {
            tableName: 'migrations',
            directory: path.join(__dirname, '..', 'database', 'migrations'),
        },
        seeds: {
            directory: path.join(__dirname, '..', 'database', 'seeders'),
        },
    },

    // ==================== AUTHENTICATION ====================
    auth: {
        jwt: {
            secret: process.env.JWT_SECRET || 'your-jwt-secret-key',
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
            algorithm: 'HS256',
            issuer: 'arsip-surat-digital',
        },
        session: {
            driver: process.env.SESSION_DRIVER || 'jwt',
            lifetime: parseInt(process.env.SESSION_LIFETIME) || 120, // minutes
            expireOnClose: process.env.SESSION_EXPIRE_ON_CLOSE === 'true' || false,
        },
        password: {
            minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
            requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true' || true,
            requireNumeric: process.env.PASSWORD_REQUIRE_NUMERIC === 'true' || true,
            requireSpecialChar: process.env.PASSWORD_REQUIRE_SPECIAL === 'true' || true,
            maxAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
            lockoutTime: parseInt(process.env.LOCKOUT_TIME) || 30, // minutes
        },
        roles: {
            superadmin: 'Super Admin',
            admin: 'Administrator',
            operator: 'Operator',
            pimpinan: 'Pimpinan',
            viewer: 'Viewer',
        },
    },

    // ==================== STORAGE ====================
    storage: {
        default: process.env.STORAGE_DISK || 'local',
        disks: {
            local: {
                root: path.join(__dirname, '..', 'storage', 'app'),
                url: '/storage',
                visibility: 'public',
            },
            public: {
                root: path.join(__dirname, '..', 'public', 'uploads'),
                url: '/uploads',
                visibility: 'public',
            },
        },
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB in bytes
        allowedMimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
        ],
        image: {
            maxWidth: parseInt(process.env.IMAGE_MAX_WIDTH) || 2000,
            maxHeight: parseInt(process.env.IMAGE_MAX_HEIGHT) || 2000,
            quality: parseInt(process.env.IMAGE_QUALITY) || 80,
        },
    },

    // ==================== MAIL ====================
    mail: {
        driver: process.env.MAIL_DRIVER || 'smtp',
        from: {
            address: process.env.MAIL_FROM_ADDRESS || 'noreply@arsipsurat.id',
            name: process.env.MAIL_FROM_NAME || 'Arsip Surat Digital',
        },
        smtp: {
            host: process.env.MAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.MAIL_PORT) || 587,
            secure: process.env.MAIL_ENCRYPTION === 'tls',
            auth: {
                user: process.env.MAIL_USERNAME || '',
                pass: process.env.MAIL_PASSWORD || '',
            },
            timeout: 10000,
        },
    },

    // ==================== NOTIFICATION ====================
    notification: {
        channels: ['database', 'email'],
        queue: {
            connection: process.env.QUEUE_CONNECTION || 'sync',
            queue: process.env.QUEUE_NAME || 'notifications',
            retryAfter: parseInt(process.env.QUEUE_RETRY_AFTER) || 60,
        },
    },

    // ==================== CACHE ====================
    cache: {
        driver: process.env.CACHE_DRIVER || 'file',
        prefix: 'arsip_surat_cache_',
        ttl: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour
        file: {
            path: path.join(__dirname, '..', 'storage', 'cache'),
        },
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || null,
            database: parseInt(process.env.REDIS_DB) || 0,
        },
    },

    // ==================== SECURITY ====================
    security: {
        cors: {
            enabled: process.env.CORS_ENABLED === 'true' || true,
            origins: (process.env.CORS_ORIGINS || '*').split(','),
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            exposedHeaders: ['Content-Disposition'],
            maxAge: parseInt(process.env.CORS_MAX_AGE) || 86400,
            credentials: process.env.CORS_CREDENTIALS === 'true' || true,
        },
        rateLimit: {
            enabled: process.env.RATE_LIMIT_ENABLED === 'true' || true,
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
            message: 'Terlalu banyak permintaan, silakan coba lagi nanti.',
        },
        helmet: {
            enabled: process.env.HELMET_ENABLED === 'true' || true,
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    fontSrc: ["'self'", "data:"],
                    connectSrc: ["'self'", "https://api.github.com"],
                },
            },
        },
        encryption: {
            key: process.env.ENCRYPTION_KEY || '',
            cipher: 'aes-256-cbc',
        },
    },

    // ==================== LOGGING ====================
    logging: {
        default: process.env.LOG_CHANNEL || 'daily',
        channels: {
            daily: {
                driver: 'daily',
                path: path.join(__dirname, '..', 'storage', 'logs'),
                level: process.env.LOG_LEVEL || 'debug',
                days: parseInt(process.env.LOG_DAYS) || 30,
            },
            error: {
                driver: 'file',
                path: path.join(__dirname, '..', 'storage', 'logs', 'error.log'),
                level: 'error',
            },
        },
    },

    // ==================== BACKUP ====================
    backup: {
        enabled: process.env.BACKUP_ENABLED === 'true' || false,
        schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
        keep: parseInt(process.env.BACKUP_KEEP) || 7, // Keep last 7 backups
        path: path.join(__dirname, '..', 'storage', 'backup'),
        databases: ['sqlite'],
        include: [
            path.join(__dirname, '..', 'storage', 'app'),
        ],
        exclude: [
            path.join(__dirname, '..', 'storage', 'logs'),
            path.join(__dirname, '..', 'storage', 'cache'),
            path.join(__dirname, '..', 'node_modules'),
        ],
    },

    // ==================== PWA ====================
    pwa: {
        enabled: process.env.PWA_ENABLED === 'true' || true,
        name: 'Arsip Surat Digital',
        shortName: 'Arsip Surat',
        themeColor: '#1a56db',
        backgroundColor: '#ffffff',
        display: 'standalone',
        scope: '/',
        startUrl: '/',
    },

    // ==================== API ====================
    api: {
        prefix: '/api',
        version: 'v1',
        pagination: {
            perPage: parseInt(process.env.API_PER_PAGE) || 15,
            maxPerPage: parseInt(process.env.API_MAX_PER_PAGE) || 100,
        },
        throttle: {
            enabled: process.env.API_THROTTLE_ENABLED === 'true' || true,
            maxAttempts: parseInt(process.env.API_THROTTLE_MAX) || 60,
            decayMinutes: parseInt(process.env.API_THROTTLE_DECAY) || 1,
        },
    },

    // ==================== SURAT ====================
    surat: {
        nomorFormat: {
            masuk: 'SM-{YEAR}-{NUMBER}',
            keluar: 'SK-{YEAR}-{NUMBER}',
        },
        kategori: ['biasa', 'penting', 'rahasia', 'segera'],
        sifat: ['biasa', 'segera', 'sangat-segera', 'rahasia'],
        prioritas: ['rendah', 'sedang', 'tinggi', 'sangat-tinggi'],
        status: ['baru', 'proses', 'selesai', 'arsip'],
    },
};

module.exports = config;
