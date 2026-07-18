require('dotenv').config();

module.exports = {
    jwt: {
        secret: process.env.JWT_SECRET || 'jwt-secret-key',
        expiresIn: process.env.JWT_EXPIRATION || '24h',
        refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'jwt-refresh-secret',
        refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d'
    },
    
    bcrypt: {
        saltRounds: 12
    },
    
    password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxFailedAttempts: 5,
        lockoutTime: 15 // minutes
    },
    
    session: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        extendOnActivity: true
    },
    
    roles: {
        SUPERADMIN: 'superadmin',
        ADMIN: 'admin',
        KEPALA_BAGIAN: 'kepala_bagian',
        STAFF: 'staff',
        USER: 'user'
    },
    
    permissions: {
        SURAT_MASUK: {
            VIEW: 'view_surat_masuk',
            CREATE: 'create_surat_masuk',
            EDIT: 'edit_surat_masuk',
            DELETE: 'delete_surat_masuk'
        },
        SURAT_KELUAR: {
            VIEW: 'view_surat_keluar',
            CREATE: 'create_surat_keluar',
            EDIT: 'edit_surat_keluar',
            DELETE: 'delete_surat_keluar'
        },
        DISPOSISI: {
            VIEW: 'view_disposisi',
            CREATE: 'create_disposisi',
            PROCESS: 'process_disposisi'
        },
        LAPORAN: {
            VIEW: 'view_laporan',
            EXPORT: 'export_laporan'
        },
        PENGATURAN: {
            VIEW: 'view_pengaturan',
            EDIT: 'edit_pengaturan'
        }
    }
};
