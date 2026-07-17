// app.js - Enterprise Application Configuration
const AppConfig = {
    // Application
    name: 'Arsip Surat Digital Enterprise',
    version: '2026.1.0',
    environment: 'production', // development, staging, production
    debug: false,
    
    // API
    api: {
        baseUrl: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
        timeout: 30000, // 30 seconds
        retryAttempts: 3,
        retryDelay: 1000,
        version: 'v1'
    },
    
    // Authentication
    auth: {
        tokenKey: 'auth_token',
        userKey: 'user_data',
        tokenExpiry: 86400, // 24 hours in seconds
        refreshTokenBefore: 3600, // Refresh 1 hour before expiry
        maxLoginAttempts: 5,
        lockoutDuration: 900 // 15 minutes
    },
    
    // Database
    database: {
        type: 'google-apps-script',
        encoding: 'base64',
        cacheEnabled: true,
        cacheDuration: 300 // 5 minutes
    },
    
    // UI/UX
    ui: {
        theme: 'enterprise',
        primaryColor: '#1a73e8',
        itemsPerPage: 10,
        dateFormat: 'DD/MM/YYYY',
        dateTimeFormat: 'DD/MM/YYYY HH:mm',
        timezone: 'Asia/Jakarta',
        locale: 'id-ID',
        animation: true,
        toastDuration: 3000
    },
    
    // File Upload
    upload: {
        maxFileSize: 10485760, // 10MB in bytes
        allowedTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
        storagePath: 'src/storage/app/surat/',
        tempPath: 'src/storage/app/temp/'
    },
    
    // PWA
    pwa: {
        enabled: true,
        cacheName: 'arsip-surat-enterprise-v2026.1',
        cacheUrls: [
            '/',
            '/index.html',
            '/offline.html',
            '/src/public/css/app.css',
            '/src/public/js/app.js'
        ],
        backgroundSync: true,
        notifications: true
    },
    
    // Security
    security: {
        cors: {
            enabled: true,
            allowedOrigins: ['*'],
            allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        },
        rateLimit: {
            enabled: true,
            maxRequests: 100,
            windowMs: 60000 // 1 minute
        },
        encryption: {
            algorithm: 'AES-256-CBC',
            keySize: 256
        }
    },
    
    // Features
    features: {
        dashboard: true,
        suratMasuk: true,
        suratKeluar: true,
        disposisi: true,
        laporan: true,
        pengguna: true,
        pengaturan: true,
        notifikasi: true,
        backup: true,
        export: true,
        import: true,
        bulkOperations: true,
        search: true,
        filter: true,
        print: true
    },
    
    // Roles & Permissions
    roles: {
        superadmin: {
            id: 1,
            name: 'Super Admin',
            permissions: ['*']
        },
        admin: {
            id: 2,
            name: 'Administrator',
            permissions: [
                'dashboard.view',
                'surat.*',
                'disposisi.*',
                'laporan.view',
                'pengguna.view',
                'pengaturan.view'
            ]
        },
        operator: {
            id: 3,
            name: 'Operator',
            permissions: [
                'dashboard.view',
                'surat.view',
                'surat.create',
                'surat.edit',
                'disposisi.view',
                'disposisi.create'
            ]
        },
        viewer: {
            id: 4,
            name: 'Viewer',
            permissions: [
                'dashboard.view',
                'surat.view',
                'disposisi.view',
                'laporan.view'
            ]
        }
    }
};

// Freeze configuration to prevent modifications
Object.freeze(AppConfig);

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
}
