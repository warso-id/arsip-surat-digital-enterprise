// config.js - Konfigurasi Aplikasi Enterprise 2026
const CONFIG = {
    // Informasi Aplikasi
    APP_NAME: 'Arsip Surat Digital Enterprise',
    APP_VERSION: '2026.1.0',
    APP_DESCRIPTION: 'Sistem Manajemen Arsip Surat Terintegrasi',
    
    // API Configuration
    API: {
        BASE_URL: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
        TIMEOUT: 30000,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000
    },
    
    // Authentication
    AUTH: {
        TOKEN_KEY: 'asde_auth_token',
        USER_KEY: 'asde_user_data',
        REMEMBER_KEY: 'asde_remember_me',
        TOKEN_EXPIRY: 86400000
    },
    
    // PWA Configuration
    PWA: {
        CACHE_NAME: 'asde-cache-v2026',
        CACHE_VERSION: '2026.1.0',
        OFFLINE_PAGE: '/offline.html'
    },
    
    // Pagination
    PAGINATION: {
        PER_PAGE: 10,
        MAX_PAGES_DISPLAY: 5
    },
    
    // Date Format
    DATE_FORMAT: {
        DISPLAY: 'DD/MM/YYYY',
        DATETIME: 'DD/MM/YYYY HH:mm',
        INPUT: 'YYYY-MM-DD'
    },
    
    // File Upload
    UPLOAD: {
        MAX_FILE_SIZE: 5242880,
        ALLOWED_TYPES: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'xlsx', 'xls'],
        MAX_FILES: 5
    },
    
    // Routes
    ROUTES: {
        DASHBOARD: 'dashboard',
        SURAT_MASUK: 'surat-masuk',
        SURAT_KELUAR: 'surat-keluar',
        DISPOSISI: 'disposisi',
        LAPORAN: 'laporan',
        PENGGUNA: 'pengguna',
        INSTANSI: 'instansi',
        PENGATURAN: 'pengaturan',
        PROFILE: 'profile'
    }
};

// Freeze config
Object.freeze(CONFIG);

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

console.log('Config loaded:', CONFIG.APP_NAME, 'v' + CONFIG.APP_VERSION);
