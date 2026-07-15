require('dotenv').config();

module.exports = {
  // Application
  name: process.env.APP_NAME || 'Arsip Surat Digital Enterprise',
  env: process.env.APP_ENV || 'development',
  debug: process.env.APP_DEBUG === 'true',
  url: process.env.APP_URL || 'http://localhost:3000',
  port: process.env.APP_PORT || 3000,
  key: process.env.APP_KEY,

  // Security
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    expiry: process.env.JWT_EXPIRY || '24h'
  },

  // Database
  database: {
    client: process.env.DB_CONNECTION || 'sqlite',
    sqlite: {
      path: process.env.DB_DATABASE || 'database/arsip_surat.sqlite'
    }
  },

  // Storage
  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    path: process.env.STORAGE_PATH || 'storage/app',
    maxUploadSize: process.env.MAX_UPLOAD_SIZE || '10MB',
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,jpg,jpeg,png').split(',')
  },

  // Mail
  mail: {
    driver: process.env.MAIL_DRIVER || 'smtp',
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    username: process.env.MAIL_USERNAME,
    password: process.env.MAIL_PASSWORD,
    encryption: process.env.MAIL_ENCRYPTION,
    fromAddress: process.env.MAIL_FROM_ADDRESS,
    fromName: process.env.MAIL_FROM_NAME
  },

  // Backup
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 0 * * *',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    channel: process.env.LOG_CHANNEL || 'daily',
    retentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 14
  },

  // Features
  features: {
    digitalSignature: process.env.FEATURE_DIGITAL_SIGNATURE === 'true',
    qrCode: process.env.FEATURE_QR_CODE === 'true',
    ocr: process.env.FEATURE_OCR === 'true',
    exportExcel: process.env.FEATURE_EXPORT_EXCEL === 'true',
    exportPdf: process.env.FEATURE_EXPORT_PDF === 'true'
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },

  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'session-secret-key',
    lifetime: parseInt(process.env.SESSION_LIFETIME) || 120
  }
};
