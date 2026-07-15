/**
 * KONFIGURASI GLOBAL - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * File: src/js/config.js
 * Support: Google Apps Script (code.gs) + Google Sheets + Frontend
 * Encoding: Base64 untuk komunikasi data
 */

// ============================================
// BASE64 UTILITY FUNCTIONS
// ============================================
const Base64Util = {
  /**
   * Encode string ke Base64
   */
  encode(str) {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
      console.error('Base64 encode error:', e);
      return null;
    }
  },

  /**
   * Decode Base64 ke string
   */
  decode(str) {
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch (e) {
      console.error('Base64 decode error:', e);
      return null;
    }
  },

  /**
   * Encode object ke Base64
   */
  encodeObject(obj) {
    try {
      const jsonStr = JSON.stringify(obj);
      return this.encode(jsonStr);
    } catch (e) {
      console.error('Base64 encodeObject error:', e);
      return null;
    }
  },

  /**
   * Decode Base64 ke object
   */
  decodeObject(str) {
    try {
      const jsonStr = this.decode(str);
      return jsonStr ? JSON.parse(jsonStr) : null;
    } catch (e) {
      console.error('Base64 decodeObject error:', e);
      return null;
    }
  },

  /**
   * Encode file ke Base64
   */
  encodeFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Decode Base64 ke Blob
   */
  decodeToBlob(base64, mimeType) {
    try {
      const byteChars = atob(base64);
      const byteArrays = [];
      for (let offset = 0; offset < byteChars.length; offset += 512) {
        const slice = byteChars.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
      }
      return new Blob(byteArrays, { type: mimeType });
    } catch (e) {
      console.error('Base64 decodeToBlob error:', e);
      return null;
    }
  },

  /**
   * Decode Base64 ke File
   */
  decodeToFile(base64, filename, mimeType) {
    const blob = this.decodeToBlob(base64, mimeType);
    return blob ? new File([blob], filename, { type: mimeType }) : null;
  }
};

// ============================================
// GOOGLE SHEETS CONFIG
// ============================================
const GOOGLE_SHEETS_CONFIG = {
  // Spreadsheet ID (Base64 encoded)
  SPREADSHEET_ID_ENCODED: 'MUJ6dlh3RmJ0dWg5S2FJOVlkZVRWbGZfTlQ4dDdEY2I0V3pnM0hGWjZfSFE',
  
  // Sheet Names
  SHEETS: {
    SURAT_MASUK: 'SuratMasuk',
    SURAT_KELUAR: 'SuratKeluar',
    DISPOSISI: 'Disposisi',
    USERS: 'Users',
    MASTER_DATA: 'MasterData',
    KONFIGURASI: 'Konfigurasi',
    AUDIT_LOG: 'AuditLog',
    NOTIFIKASI: 'Notifikasi',
    TEMPLATE: 'Template',
    APPROVAL: 'Approval',
    TTD: 'TTD',
    KLASIFIKASI: 'Klasifikasi',
    ARSIP: 'Arsip',
    RETENSI: 'Retensi',
    REMINDER: 'Reminder',
    BACKUP_LOG: 'BackupLog',
    API_KEYS: 'ApiKeys',
    SESSIONS: 'Sessions',
    WEBHOOKS: 'Webhooks'
  },

  // Column Mappings untuk setiap sheet
  COLUMNS: {
    SURAT_MASUK: {
      ID: 'id',
      NOMOR_SURAT: 'nomorSurat',
      TANGGAL_SURAT: 'tanggalSurat',
      TANGGAL_DITERIMA: 'tanggalDiterima',
      PENGIRIM: 'pengirim',
      PERIHAL: 'perihal',
      SIFAT: 'sifat',
      STATUS: 'status',
      FILE_URL: 'fileUrl',
      FILE_NAME: 'fileName',
      FILE_BASE64: 'fileBase64',
      KLASIFIKASI: 'klasifikasi',
      CATATAN: 'catatan',
      CREATED_AT: 'createdAt',
      UPDATED_AT: 'updatedAt',
      CREATED_BY: 'createdBy'
    },
    SURAT_KELUAR: {
      ID: 'id',
      NOMOR_SURAT: 'nomorSurat',
      TANGGAL_SURAT: 'tanggalSurat',
      TUJUAN: 'tujuan',
      PERIHAL: 'perihal',
      SIFAT: 'sifat',
      STATUS: 'status',
      FILE_URL: 'fileUrl',
      FILE_NAME: 'fileName',
      FILE_BASE64: 'fileBase64',
      KLASIFIKASI: 'klasifikasi',
      APPROVAL_STATUS: 'approvalStatus',
      DISPOSISI_TERKAIT: 'disposisiTerkait',
      CATATAN: 'catatan',
      CREATED_AT: 'createdAt',
      UPDATED_AT: 'updatedAt',
      CREATED_BY: 'createdBy'
    },
    DISPOSISI: {
      ID: 'id',
      SURAT_ID: 'suratId',
      SURAT_TYPE: 'suratType',
      DARI: 'dari',
      KEPADA: 'kepada',
      INSTRUKSI: 'instruksi',
      STATUS: 'status',
      TANGGAL_TENGGAT: 'tanggalTenggat',
      TANGGAL_SELESAI: 'tanggalSelesai',
      TINDAK_LANJUT: 'tindakLanjut',
      PRIORITAS: 'prioritas',
      ESKALASI: 'eskalasi',
      CATATAN: 'catatan',
      CREATED_AT: 'createdAt',
      UPDATED_AT: 'updatedAt'
    },
    USERS: {
      ID: 'id',
      USERNAME: 'username',
      PASSWORD_HASH: 'passwordHash',
      NAMA_LENGKAP: 'namaLengkap',
      EMAIL: 'email',
      ROLE: 'role',
      JABATAN: 'jabatan',
      BIDANG: 'bidang',
      AKTIF: 'aktif',
      AVATAR_BASE64: 'avatarBase64',
      LAST_LOGIN: 'lastLogin',
      SESSION_TOKEN: 'sessionToken',
      CREATED_AT: 'createdAt',
      UPDATED_AT: 'updatedAt'
    },
    MASTER_DATA: {
      ID: 'id',
      TYPE: 'type',
      CODE: 'code',
      VALUE: 'value',
      DESCRIPTION: 'description',
      PARENT_CODE: 'parentCode',
      AKTIF: 'aktif'
    }
  }
};

// ============================================
// APP CONFIGURATION
// ============================================
const APP_CONFIG = {
  // Informasi Aplikasi
  APP_NAME: 'Arsip Surat Digital Enterprise',
  APP_VERSION: '3.2.2',
  APP_BUILD: '2026-07-12',
  APP_ENV: 'production',

  // API Configuration
  API: {
    BASE_URL: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
    TIMEOUT: 30000,
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
    SESSION_TIMEOUT: 3600000,
    REFRESH_BEFORE: 300000,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCK_DURATION: 15
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
    SSO: false,
    CHATBOT: false
  },

  // Cache Configuration
  CACHE: {
    PREFIX: 'asd_',
    TTL: 300,
    MAX_SIZE: 100 * 1024 * 1024,
    STORAGE: 'indexeddb',
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

// ============================================
// API HELPER FUNCTIONS
// ============================================
const ApiHelper = {
  /**
   * Mendapatkan Spreadsheet ID yang sudah didecode
   */
  getSpreadsheetId() {
    return Base64Util.decode(GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID_ENCODED);
  },

  /**
   * Membangun URL endpoint
   */
  buildUrl(endpoint) {
    return `${APP_CONFIG.API.BASE_URL}?action=${endpoint}`;
  },

  /**
   * Encode data untuk dikirim ke Google Apps Script
   */
  encodePayload(data) {
    return {
      payload: Base64Util.encodeObject(data),
      timestamp: Date.now(),
      version: APP_CONFIG.APP_VERSION
    };
  },

  /**
   * Decode response dari Google Apps Script
   */
  decodeResponse(response) {
    if (response && response.payload) {
      return Base64Util.decodeObject(response.payload);
    }
    return response;
  },

  /**
   * Upload file dengan Base64 encoding
   */
  async prepareFileUpload(file) {
    const base64 = await Base64Util.encodeFile(file);
    return {
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      base64Data: base64,
      lastModified: file.lastModified
    };
  },

  /**
   * Decode file dari response
   */
  decodeFileResponse(response, fileName, mimeType) {
    if (response && response.fileBase64) {
      return Base64Util.decodeToFile(response.fileBase64, fileName, mimeType);
    }
    return null;
  }
};

// ============================================
// DATA TRANSFORMER
// ============================================
const DataTransformer = {
  /**
   * Transform data surat masuk untuk spreadsheet
   */
  suratMasukToSheet(data) {
    return {
      nomorSurat: data.nomor_surat,
      tanggalSurat: data.tanggal_surat,
      tanggalDiterima: data.tanggal_diterima,
      pengirim: data.pengirim,
      perihal: data.perihal,
      sifat: data.sifat,
      status: data.status || 'diterima',
      fileUrl: data.file_url || '',
      fileName: data.file_name || '',
      fileBase64: data.file_base64 || '',
      klasifikasi: data.klasifikasi || '',
      catatan: data.catatan || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: data.created_by || ''
    };
  },

  /**
   * Transform data surat keluar untuk spreadsheet
   */
  suratKeluarToSheet(data) {
    return {
      nomorSurat: data.nomor_surat,
      tanggalSurat: data.tanggal_surat,
      tujuan: data.tujuan,
      perihal: data.perihal,
      sifat: data.sifat,
      status: data.status || 'draft',
      fileUrl: data.file_url || '',
      fileName: data.file_name || '',
      fileBase64: data.file_base64 || '',
      klasifikasi: data.klasifikasi || '',
      approvalStatus: data.approval_status || 'pending',
      disposisiTerkait: data.disposisi_terkait || '',
      catatan: data.catatan || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: data.created_by || ''
    };
  },

  /**
   * Transform data disposisi untuk spreadsheet
   */
  disposisiToSheet(data) {
    return {
      suratId: data.surat_id,
      suratType: data.surat_type,
      dari: data.dari,
      kepada: data.kepada,
      instruksi: data.instruksi,
      status: data.status || 'pending',
      tanggalTenggat: data.tanggal_tenggat,
      tanggalSelesai: data.tanggal_selesai || '',
      tindakLanjut: data.tindak_lanjut || '',
      prioritas: data.prioritas || 'normal',
      eskalasi: data.eskalasi || '',
      catatan: data.catatan || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  /**
   * Transform sheet data ke format frontend
   */
  sheetToFrontend(sheetData, type) {
    const transformers = {
      surat_masuk: (row) => ({
        id: row[0],
        nomor_surat: row[1],
        tanggal_surat: row[2],
        tanggal_diterima: row[3],
        pengirim: row[4],
        perihal: row[5],
        sifat: row[6],
        status: row[7],
        file_url: row[8],
        file_name: row[9],
        file_base64: row[10],
        klasifikasi: row[11],
        catatan: row[12],
        created_at: row[13],
        updated_at: row[14],
        created_by: row[15]
      }),
      surat_keluar: (row) => ({
        id: row[0],
        nomor_surat: row[1],
        tanggal_surat: row[2],
        tujuan: row[3],
        perihal: row[4],
        sifat: row[5],
        status: row[6],
        file_url: row[7],
        file_name: row[8],
        file_base64: row[9],
        klasifikasi: row[10],
        approval_status: row[11],
        disposisi_terkait: row[12],
        catatan: row[13],
        created_at: row[14],
        updated_at: row[15],
        created_by: row[16]
      }),
      disposisi: (row) => ({
        id: row[0],
        surat_id: row[1],
        surat_type: row[2],
        dari: row[3],
        kepada: row[4],
        instruksi: row[5],
        status: row[6],
        tanggal_tenggat: row[7],
        tanggal_selesai: row[8],
        tindak_lanjut: row[9],
        prioritas: row[10],
        eskalasi: row[11],
        catatan: row[12],
        created_at: row[13],
        updated_at: row[14]
      })
    };

    const transformer = transformers[type];
    if (!transformer) return sheetData;

    if (Array.isArray(sheetData)) {
      return sheetData.map(transformer);
    }
    return transformer(sheetData);
  }
};

// ============================================
// CACHE MANAGER
// ============================================
const CacheManager = {
  async get(key) {
    try {
      const cacheKey = APP_CONFIG.CACHE.PREFIX + key;
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const { data, timestamp, ttl } = JSON.parse(cached);
      if (Date.now() - timestamp > ttl * 1000) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return Base64Util.decodeObject(data);
    } catch (e) {
      console.error('Cache get error:', e);
      return null;
    }
  },

  async set(key, data, ttl = APP_CONFIG.CACHE.TTL) {
    try {
      const cacheKey = APP_CONFIG.CACHE.PREFIX + key;
      const cacheData = {
        data: Base64Util.encodeObject(data),
        timestamp: Date.now(),
        ttl: ttl
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (e) {
      console.error('Cache set error:', e);
    }
  },

  async remove(key) {
    const cacheKey = APP_CONFIG.CACHE.PREFIX + key;
    localStorage.removeItem(cacheKey);
  },

  async clear() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(APP_CONFIG.CACHE.PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
};

// ============================================
// CONSTANTS
// ============================================
const USER_ROLES = {
  ADMIN: 'admin',
  KABID: 'kabid',
  KASUBAG: 'kasubag',
  STAFF: 'staff',
  SEKRETARIS: 'sekretaris'
};

const SURAT_STATUS = {
  DRAFT: 'draft',
  DITERIMA: 'diterima',
  DIPROSES: 'diproses',
  SELESAI: 'selesai',
  DIARSIPKAN: 'diarsipkan',
  DITOLAK: 'ditolak'
};

const SURAT_SIFAT = {
  BIASA: 'biasa',
  PENTING: 'penting',
  SEGERA: 'segera',
  RAHASIA: 'rahasia',
  SANGAT_RAHASIA: 'sangat_rahasia'
};

const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVISI: 'revisi'
};

const DISPOSISI_STATUS = {
  PENDING: 'pending',
  DITERIMA: 'diterima',
  DIPROSES: 'diproses',
  SELESAI: 'selesai',
  TERLAMBAT: 'terlambat',
  DIBATALKAN: 'dibatalkan'
};

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

// ============================================
// EXPORT FOR MODULE SYSTEMS
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Base64Util,
    GOOGLE_SHEETS_CONFIG,
    APP_CONFIG,
    ApiHelper,
    DataTransformer,
    CacheManager,
    USER_ROLES,
    SURAT_STATUS,
    SURAT_SIFAT,
    APPROVAL_STATUS,
    DISPOSISI_STATUS,
    NOTIFICATION_TYPES
  };
}

// ============================================
// GLOBAL EXPOSURE (For non-module scripts)
// ============================================
if (typeof window !== 'undefined') {
  window.Base64Util = Base64Util;
  window.GOOGLE_SHEETS_CONFIG = GOOGLE_SHEETS_CONFIG;
  window.APP_CONFIG = APP_CONFIG;
  window.ApiHelper = ApiHelper;
  window.DataTransformer = DataTransformer;
  window.CacheManager = CacheManager;
  window.USER_ROLES = USER_ROLES;
  window.SURAT_STATUS = SURAT_STATUS;
  window.SURAT_SIFAT = SURAT_SIFAT;
  window.APPROVAL_STATUS = APPROVAL_STATUS;
  window.DISPOSISI_STATUS = DISPOSISI_STATUS;
  window.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
}
