// Konfigurasi Aplikasi Enterprise
const APP_CONFIG = {
    name: 'Arsip Surat Digital Enterprise',
    version: '2026.1.0',
    api: {
        baseUrl: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
        timeout: 30000,
        retryAttempts: 3
    },
    auth: {
        tokenKey: 'asde_token',
        userKey: 'asde_user',
        expiryTime: 86400000 // 24 jam
    },
    pwa: {
        cacheName: 'asde-cache-v2026',
        cacheFiles: [
            '/',
            '/index.html',
            '/offline.html',
            '/assets/css/app.css',
            '/assets/css/dashboard.css',
            '/assets/css/surat.css',
            '/assets/js/config.js',
            '/assets/js/database.js',
            '/assets/js/api.js',
            '/assets/js/auth.js',
            '/assets/js/app.js',
            '/assets/js/dashboard.js',
            '/assets/js/surat.js',
            '/assets/js/disposisi.js',
            '/assets/js/laporan.js'
        ]
    },
    pagination: {
        perPage: 10,
        maxPages: 5
    },
    dateFormat: 'DD/MM/YYYY HH:mm',
    storage: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']
    }
};

// Export untuk digunakan di module lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
}
