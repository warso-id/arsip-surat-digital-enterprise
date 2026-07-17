// storage.js - Storage Configuration
const StorageConfig = {
    // Default storage disk
    default: 'local',
    
    // Storage disks
    disks: {
        // Local storage
        local: {
            driver: 'local',
            root: 'src/storage/app',
            url: '/storage',
            visibility: 'public'
        },
        
        // Google Drive storage (via Apps Script)
        google: {
            driver: 'google',
            folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
            credentials: {
                type: 'service_account',
                project_id: process.env.GOOGLE_PROJECT_ID || '',
                private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID || '',
                private_key: process.env.GOOGLE_PRIVATE_KEY || ''
            }
        },
        
        // Cloud storage
        s3: {
            driver: 's3',
            key: process.env.AWS_ACCESS_KEY_ID || '',
            secret: process.env.AWS_SECRET_ACCESS_KEY || '',
            region: process.env.AWS_DEFAULT_REGION || 'ap-southeast-1',
            bucket: process.env.AWS_BUCKET || '',
            url: process.env.AWS_URL || '',
            endpoint: process.env.AWS_ENDPOINT || ''
        }
    },
    
    // File path patterns
    paths: {
        surat_masuk: 'surat/masuk/{year}/{month}/{filename}',
        surat_keluar: 'surat/keluar/{year}/{month}/{filename}',
        lampiran: 'lampiran/{year}/{month}/{filename}',
        template: 'template/{filename}',
        temp: 'temp/{filename}',
        avatar: 'avatars/{user_id}/{filename}',
        backup: 'backup/{date}/{filename}'
    },
    
    // Allowed file types
    allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ],
    
    // Allowed extensions
    allowedExtensions: [
        'pdf', 'doc', 'docx', 'xls', 'xlsx',
        'jpg', 'jpeg', 'png', 'gif', 'webp'
    ],
    
    // File size limits (in bytes)
    maxFileSize: {
        document: 10485760, // 10MB
        image: 5242880, // 5MB
        avatar: 2097152, // 2MB
        backup: 104857600 // 100MB
    },
    
    // Image manipulation
    image: {
        driver: 'gd', // gd or imagick
        thumbnails: {
            small: {
                width: 150,
                height: 150,
                fit: 'cover'
            },
            medium: {
                width: 300,
                height: 300,
                fit: 'cover'
            },
            large: {
                width: 800,
                height: 800,
                fit: 'contain'
            }
        },
        quality: 80,
        format: 'jpg'
    },
    
    // Cache control
    cache: {
        maxAge: 31536000, // 1 year in seconds
        immutable: true
    },
    
    // Visibility
    visibility: {
        public: 'public',
        private: 'private'
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageConfig;
}
