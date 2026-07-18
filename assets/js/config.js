/* ============================================
   ENTERPRISE CONFIGURATION - Base64 Support
   ============================================ */
(function() {
    'use strict';

    window.APP_CONFIG = {
        // API Configuration
        API_URL: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
        BASE_PATH: '/arsip-surat-digital-enterprise',
        APP_VERSION: '2026.1.0',
        REPO_URL: 'https://github.com/warso-id/arsip-surat-digital-enterprise',
        
        // Google Sheets Configuration
        SHEETS: {
            SURAT_MASUK: 'SuratMasuk',
            SURAT_KELUAR: 'SuratKeluar',
            DISPOSISI: 'Disposisi',
            USERS: 'Users',
            LOGS: 'ActivityLogs'
        },

        // Base64 Configuration
        ENCODING: {
            ENABLED: true,
            FIELDS: ['nomor_surat', 'perihal', 'pengirim', 'penerima', 'isi_disposisi'],
            ALGORITHM: 'base64',
            SALT_KEY: 'ArsipSuratDigital_Enterprise_2026'
        },

        // PWA Configuration
        PWA: {
            CACHE_NAME: 'arsip-surat-v2026.1.0',
            PRECACHE_URLS: [
                '/arsip-surat-digital-enterprise/',
                '/arsip-surat-digital-enterprise/index.html',
                '/arsip-surat-digital-enterprise/offline.html',
                '/arsip-surat-digital-enterprise/404.html',
                '/arsip-surat-digital-enterprise/assets/css/app.css',
                '/arsip-surat-digital-enterprise/assets/css/dashboard.css',
                '/arsip-surat-digital-enterprise/assets/js/config.js',
                '/arsip-surat-digital-enterprise/assets/js/api.js',
                '/arsip-surat-digital-enterprise/assets/js/auth.js',
                '/arsip-surat-digital-enterprise/assets/js/database.js',
                '/arsip-surat-digital-enterprise/assets/js/router.js',
                '/arsip-surat-digital-enterprise/assets/js/app.js'
            ]
        },

        // Sync Configuration
        SYNC: {
            INTERVAL: 30000, // 30 seconds
            RETRY_ATTEMPTS: 3,
            BATCH_SIZE: 50,
            BACKGROUND_SYNC: true
        },

        // Security Configuration
        SECURITY: {
            ENCRYPTION_KEY: 'EnterpriseSecurity2026!',
            TOKEN_EXPIRY: 3600000, // 1 hour
            MAX_LOGIN_ATTEMPTS: 5,
            SESSION_TIMEOUT: 1800000 // 30 minutes
        },

        // Feature Flags
        FEATURES: {
            OFFLINE_MODE: true,
            PUSH_NOTIFICATIONS: false,
            BIOMETRIC_AUTH: false,
            DIGITAL_SIGNATURE: true,
            QR_CODE: true,
            EXPORT_PDF: true,
            BULK_OPERATIONS: true
        }
    };

    // Base64 Utility Functions
    window.Base64Util = {
        encode: function(str) {
            if (!str) return '';
            try {
                return btoa(unescape(encodeURIComponent(str)));
            } catch (e) {
                console.error('Base64 encoding failed:', e);
                return str;
            }
        },

        decode: function(encoded) {
            if (!encoded) return '';
            try {
                return decodeURIComponent(escape(atob(encoded)));
            } catch (e) {
                console.error('Base64 decoding failed:', e);
                return encoded;
            }
        },

        encodeObject: function(obj, fields) {
            const encoded = { ...obj };
            fields.forEach(field => {
                if (encoded[field]) {
                    encoded[field] = this.encode(encoded[field]);
                }
            });
            return encoded;
        },

        decodeObject: function(obj, fields) {
            const decoded = { ...obj };
            fields.forEach(field => {
                if (decoded[field]) {
                    decoded[field] = this.decode(decoded[field]);
                }
            });
            return decoded;
        }
    };

    // Logging Utility
    window.Logger = {
        levels: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 },
        currentLevel: 0,

        log: function(level, message, data = null) {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                level,
                message,
                data: data ? Base64Util.encode(JSON.stringify(data)) : null
            };

            if (level >= this.currentLevel) {
                const method = level === 0 ? 'log' : level === 1 ? 'info' : level === 2 ? 'warn' : 'error';
                console[method](`[${timestamp}] ${message}`, data || '');
            }

            // Store in localStorage for sync
            this.saveToLocal(logEntry);
        },

        saveToLocal: function(logEntry) {
            try {
                const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
                logs.push(logEntry);
                if (logs.length > 1000) logs.shift();
                localStorage.setItem('app_logs', JSON.stringify(logs));
            } catch (e) {
                console.error('Failed to save log:', e);
            }
        },

        debug: function(msg, data) { this.log(0, msg, data); },
        info: function(msg, data) { this.log(1, msg, data); },
        warn: function(msg, data) { this.log(2, msg, data); },
        error: function(msg, data) { this.log(3, msg, data); }
    };

    console.log('Enterprise Config loaded - Version:', APP_CONFIG.APP_VERSION);
})();
