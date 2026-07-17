// config.js - Konfigurasi Aplikasi Enterprise 2026
const CONFIG = {
    APP_NAME: 'Arsip Surat Digital Enterprise',
    APP_VERSION: '2026.1.0',
    APP_DESCRIPTION: 'Sistem Manajemen Arsip Surat Terintegrasi',
    
    API: {
        BASE_URL: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
        TIMEOUT: 30000,
        RETRY_ATTEMPTS: 3
    },
    
    AUTH: {
        TOKEN_KEY: 'asde_auth_token',
        USER_KEY: 'asde_user_data',
        REMEMBER_KEY: 'asde_remember_me',
        TOKEN_EXPIRY: 86400000
    },
    
    PAGINATION: {
        PER_PAGE: 10,
        MAX_PAGES_DISPLAY: 5
    },
    
    ROUTES: {
        DASHBOARD: 'dashboard',
        SURAT_MASUK: 'surat-masuk',
        SURAT_KELUAR: 'surat-keluar',
        DISPOSISI: 'disposisi',
        KATEGORI: 'kategori',
        INSTANSI: 'instansi',
        LAPORAN: 'laporan',
        PENGGUNA: 'pengguna',
        PENGATURAN: 'pengaturan',
        PROFILE: 'profile'
    }
};

Object.freeze(CONFIG);
console.log('Config loaded:', CONFIG.APP_NAME, 'v' + CONFIG.APP_VERSION);
