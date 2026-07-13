/**
 * KONFIGURASI GLOBAL - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

const APP_CONFIG = {
  // Informasi Aplikasi
  APP_NAME: 'Arsip Surat Digital Enterprise',
  APP_VERSION: '3.2.2',
  APP_BUILD: '2026-07-12',
  APP_ENV: 'production', // development | staging | production
  
  // API Configuration
  API: {
    BASE_URL: 'https://script.google.com/macros/s/AKfycbw.../exec',
    TIMEOUT: 30000, // 30 detik
    RETRY_COUNT: 3,
    RETRY_DELAY: 1000,
    
    // Endpoints
    ENDPOINTS: {
      AUTH: {
        LOGIN: 'login',
        LOGOUT: 'logout',
        REGISTER: 'publicRegister',
        ME: 'me',
        CHANGE_PASSWORD: 'changePassword',
        CSRF: 'csrf.generate',
        RESET_ADMIN: 'resetAdmin',
        CHECK_USER: 'checkUser'
      },
      
      DASHBOARD: {
        STATS: 'dashboard.stats',
        CHART: 'dashboard.chart',
        AI_INSIGHTS: 'dashboard.aiInsights',
        REALTIME: 'dashboard.realtime',
        CUSTOM: 'dashboard.custom'
      },
      
      SURAT_MASUK: {
        LIST: 'suratMasuk.list',
        DETAIL: 'suratMasuk.detail',
        CREATE: 'suratMasuk.create',
        UPDATE: 'suratMasuk.update',
        DELETE: 'suratMasuk.delete',
        STATS: 'suratMasuk.stats',
        STATUS: 'suratMasuk.updateStatus',
        DISTRIBUSI: 'suratMasuk.distribusi',
        HISTORY: 'suratMasuk.history',
        COMPARE: 'suratMasuk.compare',
        AUTO_SAVE: 'suratMasuk.autoSave'
      },
      
      SURAT_KELUAR: {
        LIST: 'suratKeluar.list',
        DETAIL: 'suratKeluar.detail',
        CREATE: 'suratKeluar.create',
        CREATE_WITH_NUMBER: 'suratKeluar.createWithNumber',
        UPDATE: 'suratKeluar.update',
        DELETE: 'suratKeluar.delete',
        SUBMIT_APPROVAL: 'suratKeluar.submitApproval',
        UPDATE_STATUS: 'suratKeluar.updateStatus',
        HISTORY: 'suratKeluar.history',
        AGENDA: 'suratKeluar.agenda',
        BULK_APPROVE: 'suratKeluar.bulkApprove',
        AUTO_SAVE: 'suratKeluar.autoSave'
      },
      
      DISPOSISI: {
        LIST: 'disposisi.list',
        CREATE: 'disposisi.create',
        CREATE_MULTIPLE: 'disposisi.createMultiple',
        TINDAK_LANJUT: 'disposisi.tindakLanjut',
        UPDATE_STATUS: 'disposisi.updateStatus',
        ESKALASI: 'disposisi.eskalasi',
        REPORT: 'disposisi.report',
        KALENDER: 'disposisi.kalender',
        BULK_UPDATE: 'disposisi.bulkUpdate'
      },
      
      APPROVAL: {
        LIST: 'approval.list',
        PROCESS: 'approval.process',
        MULTI_LEVEL: 'approval.multiLevel',
        ROUTING: 'approval.routing',
        PARALLEL: 'approval.parallel',
        DELEGATE: 'approval.delegate'
      },
      
      TTD: {
        REGISTER: 'ttd.register',
        SIGN: 'ttd.sign',
        VERIFY: 'ttd.verify',
        SIGN_WITH_QR: 'ttd.signWithQR',
        BULK_SIGN: 'ttd.bulkSign',
        CERTIFICATE: 'ttd.certificate'
      },
      
      PDF: {
        GENERATE: 'pdf.generate',
        BULK_GENERATE: 'pdf.bulkGenerate',
        WATERMARK: 'pdf.watermark'
      },
      
      TEMPLATE: {
        SAVE: 'template.save',
        LIST: 'template.list',
        USE: 'template.use',
        DELETE: 'template.delete'
      },
      
      REPORT: {
        SURAT_MASUK: 'report.suratMasuk',
        SURAT_KELUAR: 'report.suratKeluar',
        DISPOSISI: 'disposisi.report',
        COMPREHENSIVE: 'report.comprehensive',
        SCHEDULE: 'report.schedule'
      },
      
      EXPORT: {
        DATA: 'export.data',
        PDF: 'export.pdf',
        EXCEL: 'export.excel',
        ALL: 'export.all'
      },
      
      SEARCH: {
        GLOBAL: 'search',
        ADVANCED: 'search.advanced',
        AI_SMART: 'ai.smartSearch'
      },
      
      USERS: {
        LIST: 'users.list',
        CREATE: 'users.create',
        UPDATE: 'users.update',
        DELETE: 'users.delete',
        PROFILE: 'users.profile',
        UPDATE_PROFILE: 'users.updateProfile',
        BULK_CREATE: 'users.bulkCreate',
        EXPORT: 'users.export',
        ACTIVITY: 'activity.log',
        GROUP_CREATE: 'group.create',
        PERMISSIONS: 'permissions.get',
        SESSIONS: 'session.list',
        REVOKE_SESSION: 'session.revoke',
        FORCE_LOGOUT: 'session.logout'
      },
      
      MASTER_DATA: {
        LIST: 'masterData.list',
        CREATE: 'masterData.create',
        UPDATE: 'masterData.update',
        DELETE: 'masterData.delete',
        BULK_CREATE: 'masterData.bulkCreate'
      },
      
      CONFIG: {
        GET: 'config.get',
        UPDATE: 'config.update',
        RESET: 'config.reset'
      },
      
      AUDIT_LOG: {
        LIST: 'auditLog.list',
        EXPORT: 'auditLog.export',
        ANALYTICS: 'auditLog.analytics'
      },
      
      NOTIFIKASI: {
        LIST: 'notifikasi.list',
        UNREAD: 'notifikasi.unreadCount',
        READ: 'notifikasi.read',
        READ_ALL: 'notifikasi.readAll',
        BULK: 'notifikasi.bulk',
        EMAIL: 'notifikasi.email',
        WEBHOOK: 'notifikasi.webhook',
        TELEGRAM: 'notifikasi.telegram'
      },
      
      PUSH: {
        REGISTER: 'push.register'
      },
      
      REMINDER: {
        CHECK: 'reminder.check',
        SET: 'reminder.set',
        LIST: 'reminder.list',
        CANCEL: 'reminder.cancel'
      },
      
      RETENSI: {
        POLICY: 'retensi.policy',
        CHECK: 'retensi.check'
      },
      
      ARSIP: {
        DESTROY: 'arsip.destroy',
        BULK_DESTROY: 'arsip.bulkDestroy',
        RESTORE: 'arsip.restore',
        AUTO: 'arsip.auto'
      },
      
      KLASIFIKASI: {
        LIST: 'klasifikasi.list',
        CREATE: 'klasifikasi.create',
        UPDATE: 'klasifikasi.update',
        DELETE: 'klasifikasi.delete'
      },
      
      SECURITY: {
        ENCRYPT: 'encrypt.document',
        DECRYPT: 'decrypt.document',
        ACCESS_CHECK: 'access.check',
        DUPLICATE_CHECK: 'duplicate.check',
        VALIDATE: 'validate.data',
        IP_BLACKLIST: 'ip.blacklist',
        IP_UNBLACKLIST: 'ip.unblacklist'
      },
      
      FILE: {
        UPLOAD: 'file.upload',
        UPLOAD_MULTIPLE: 'file.uploadMultiple',
        DELETE: 'file.delete',
        LIST: 'file.list',
        SHARE: 'file.share',
        PREVIEW: 'file.preview'
      },
      
      BACKUP: {
        CREATE: 'backup.create',
        LIST: 'backup.list',
        RESTORE: 'backup.restore',
        SCHEDULE: 'backup.schedule'
      },
      
      BLOCKCHAIN: {
        GET_CHAIN: 'blockchain.getChain',
        VERIFY_CHAIN: 'blockchain.verifyChain',
        GET_BLOCK: 'blockchain.getBlock',
        GET_STATS: 'blockchain.getStats',
        ADD_BLOCK: 'blockchain.addBlock'
      },
      
      BIOMETRIC: {
        REGISTER: 'biometric.register',
        VERIFY: 'biometric.verify',
        STATUS: 'biometric.status',
        REMOVE: 'biometric.remove',
        MULTI_FACTOR: 'biometric.multiFactor'
      },
      
      AI: {
        AUTO_TAG: 'ai.autoTag',
        SUGGEST_TAGS: 'ai.suggestTags',
        ANALYZE: 'ai.analyzeDocument',
        DETECT_ANOMALY: 'ai.detectAnomaly',
        PREDICT_TREND: 'ai.predictTrend',
        CLASSIFY: 'ai.classify',
        SUMMARIZE: 'ai.summarize',
        RECOMMEND: 'ai.recommend'
      },
      
      OCR: {
        SCAN: 'ocr.scan',
        EXTRACT: 'ocr.extract'
      },
      
      WEBHOOK: {
        TRIGGER: 'webhook.trigger',
        REGISTER: 'webhook.register',
        LIST: 'webhook.list',
        DELETE: 'webhook.delete'
      },
      
      BATCH: {
        PROCESS: 'batch.process'
      },
      
      VERSION: {
        SAVE: 'version.save',
        LIST: 'version.list'
      },
      
      ANALYTICS: {
        API: 'analytics.api',
        ADVANCED: 'analytics.advanced'
      },
      
      SYSTEM: {
        STATUS: 'system.status',
        INFO: 'system.info',
        HEALTH: 'system.health',
        CACHE_CLEAR: 'system.cache.clear',
        MAINTENANCE: 'system.maintenance',
        INTEGRITY: 'system.integrity',
        RECOVERY: 'system.recovery'
      },
      
      TRANSLATION: {
        GET: 'translate.get'
      },
      
      TWO_FACTOR: {
        SETUP: '2fa.setup',
        VERIFY: '2fa.verify',
        STATUS: '2fa.status',
        DISABLE: '2fa.disable'
      },
      
      API_KEY: {
        GENERATE: 'apiKey.generate',
        REVOKE: 'apiKey.revoke',
        LIST: 'apiKey.list'
      },
      
      PUBLIC: {
        PING: 'ping',
        SETUP: 'setup',
        SETUP_COMPLETE: 'setupComplete',
        CHECK_SETUP: 'checkSetup',
        GENERATE_FOLDERS: 'generateFolders',
        CORS_TEST: 'corsTest',
        DEBUG: 'debugInfo',
        VERIFY_DOCUMENT: 'verify.document',
        LDAP_LOGIN: 'ldap.login',
        SCHEDULER: 'scheduler.run',
        IMPORT: 'import.data',
        WEBHOOK: 'webhook'
      }
    }
  },
  
  // UI Configuration
  UI: {
    THEME: {
      DEFAULT: 'light',
      STORAGE_KEY: 'app-theme'
    },
    SIDEBAR: {
      COLLAPSED_KEY: 'sidebar-collapsed',
      DEFAULT_COLLAPSED: false,
      MOBILE_BREAKPOINT: 768
    },
    ANIMATION: {
      DURATION: 300,
      EASING: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    TOAST: {
      DURATION: 5000,
      POSITION: 'bottom-right'
    },
    PAGINATION: {
      DEFAULT_PAGE_SIZE: 20,
      PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
    },
    DATE_FORMAT: 'DD/MM/YYYY',
    DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',
    TIMEZONE: 'Asia/Jakarta',
    LOCALE: 'id-ID',
    CURRENCY: 'IDR'
  },
  
  // Auth Configuration
  AUTH: {
    TOKEN_KEY: 'auth-token',
    CSRF_KEY: 'csrf-token',
    USER_KEY: 'auth-user',
    REMEMBER_KEY: 'auth-remember',
    SESSION_TIMEOUT: 3600000, // 1 jam
    REFRESH_BEFORE: 300000, // Refresh 5 menit sebelum expired
    MAX_LOGIN_ATTEMPTS: 5,
    LOCK_DURATION: 15 // menit
  },
  
  // Feature Flags
  FEATURES: {
    BIOMETRIC: true,
    TWO_FACTOR: true,
    PUSH_NOTIFICATIONS: true,
    VOICE_COMMANDS: true,
    OFFLINE_MODE: true,
    AI_FEATURES: true,
    BLOCKCHAIN: true,
    OCR: true,
    PDF_GENERATION: true,
    DIGITAL_SIGNATURE: true,
    WEBHOOKS: true,
    LDAP: true,
    SSO: false, // Coming soon
    CHATBOT: false // Coming soon
  },
  
  // Cache Configuration
  CACHE: {
    PREFIX: 'asd_',
    TTL: 300, // 5 menit
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
    STORAGE: 'indexeddb', // indexeddb | localstorage
    TABLES: {
      SURAT_MASUK: 'cache_sm',
      SURAT_KELUAR: 'cache_sk',
      DISPOSISI: 'cache_disp',
      USERS: 'cache_users',
      MASTER_DATA: 'cache_md',
      CONFIG: 'cache_config',
      DASHBOARD: 'cache_dash'
    }
  },
  
  // PWA Configuration
  PWA: {
    ENABLED: true,
    CACHE_NAME: 'asd-v3.2.2',
    PRECACHE_URLS: [
      '/',
      '/index.html',
      '/src/css/tokens.css',
      '/src/css/layout.css',
      '/src/js/app.js',
      '/src/js/config.js',
      '/src/assets/icons/logo.svg'
    ],
    OFFLINE_PAGE: '/src/pages/error/offline.html'
  },
  
  // Analytics Configuration
  ANALYTICS: {
    ENABLED: true,
    TRACK_PAGE_VIEWS: true,
    TRACK_CLICKS: true,
    TRACK_ERRORS: true,
    TRACK_PERFORMANCE: true,
    BATCH_SIZE: 10,
    FLUSH_INTERVAL: 30000
  },
  
  // Security Configuration
  SECURITY: {
    CSP_ENABLED: true,
    XSS_PROTECTION: true,
    RATE_LIMITING: true,
    ENCRYPTION: {
      ALGORITHM: 'AES-GCM',
      KEY_LENGTH: 256
    }
  },
  
  // Performance Configuration
  PERFORMANCE: {
    LAZY_LOAD_IMAGES: true,
    LAZY_LOAD_COMPONENTS: true,
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,
    VIRTUAL_SCROLL_THRESHOLD: 100
  }
};

// User Roles
const USER_ROLES = {
  ADMIN: 'admin',
  KABID: 'kabid',
  KASUBAG: 'kasubag',
  STAFF: 'staff',
  SEKRETARIS: 'sekretaris'
};

// Surat Status
const SURAT_STATUS = {
  DRAFT: 'draft',
  DITERIMA: 'diterima',
  DIPROSES: 'diproses',
  SELESAI: 'selesai',
  DIARSIPKAN: 'diarsipkan',
  DITOLAK: 'ditolak'
};

// Surat Sifat
const SURAT_SIFAT = {
  BIASA: 'biasa',
  PENTING: 'penting',
  SEGERA: 'segera',
  RAHASIA: 'rahasia',
  SANGAT_RAHASIA: 'sangat_rahasia'
};

// Approval Status
const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVISI: 'revisi'
};

// Disposisi Status
const DISPOSISI_STATUS = {
  PENDING: 'pending',
  DITERIMA: 'diterima',
  DIPROSES: 'diproses',
  SELESAI: 'selesai',
  TERLAMBAT: 'terlambat',
  DIBATALKAN: 'dibatalkan'
};

// Notification Types
const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  DISPOSISI: 'disposisi',
  APPROVAL: 'approval',
  REMINDER: 'reminder',
  SYSTEM: 'system'
};

// Export untuk digunakan di modul lain
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    APP_CONFIG,
    USER_ROLES,
    SURAT_STATUS,
    SURAT_SIFAT,
    APPROVAL_STATUS,
    DISPOSISI_STATUS,
    NOTIFICATION_TYPES
  };
}
