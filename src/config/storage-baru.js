require('dotenv').config();
const path = require('path');

module.exports = {
    // Path configurations
    paths: {
        root: path.resolve(__dirname, '../../'),
        storage: process.env.STORAGE_PATH || path.resolve(__dirname, '../../storage'),
        uploads: path.resolve(__dirname, '../../uploads'),
        backups: process.env.BACKUP_PATH || path.resolve(__dirname, '../../backups'),
        logs: path.resolve(__dirname, '../../storage/logs'),
        public: path.resolve(__dirname, '../../public'),
        temp: path.resolve(__dirname, '../../temp')
    },
    
    // File configurations
    file: {
        maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
        allowedExtensions: (process.env.ALLOWED_EXTENSIONS || 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png').split(','),
        allowedMimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png'
        ]
    },
    
    // Image configurations
    image: {
        maxWidth: 2000,
        maxHeight: 2000,
        quality: 80,
        thumbnailWidth: 200,
        thumbnailHeight: 200
    },
    
    // Backup configurations
    backup: {
        enabled: process.env.BACKUP_ENABLED === 'true',
        retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
        schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
        includeUploads: true,
        includeDatabase: true
    }
};
