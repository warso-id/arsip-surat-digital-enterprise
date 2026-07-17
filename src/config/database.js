// database.js - Database Configuration
const DatabaseConfig = {
    // Google Apps Script Database Connection
    connection: {
        url: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
        type: 'google-apps-script',
        encoding: 'base64',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000
    },

    // Cache Configuration
    cache: {
        enabled: true,
        driver: 'localstorage',
        prefix: 'db_cache_',
        ttl: 300, // 5 minutes in seconds
        maxSize: 100 // Maximum number of cached items
    },

    // Query Configuration
    query: {
        defaultLimit: 10,
        maxLimit: 100,
        defaultOrderBy: 'created_at',
        defaultOrder: 'DESC'
    },

    // Table Configurations
    tables: {
        roles: {
            name: 'roles',
            primaryKey: 'id',
            timestamps: true,
            softDeletes: false
        },
        pengguna: {
            name: 'pengguna',
            primaryKey: 'id',
            timestamps: true,
            softDeletes: true,
            hidden: ['password']
        },
        kategori: {
            name: 'kategori',
            primaryKey: 'id',
            timestamps: true,
            softDeletes: false
        },
        instansi: {
            name: 'instansi',
            primaryKey: 'id',
            timestamps: true,
            softDeletes: false
        },
        surat_masuk: {
            name: 'surat_masuk',
            primaryKey: 'id',
            timestamps: true,
            softDeletes: false,
            searchable: ['no_agenda', 'pengirim', 'perihal']
        },
        surat_keluar: {
            name: 'surat_keluar',
            primaryKey: 'id',
            timestamps: true,
            softDeletes: false,
            searchable: ['no_surat', 'tujuan', 'perihal']
        },
        disposisi: {
            name: 'disposisi',
            primaryKey: 'id',
            timestamps: true,
            softDeletes: false
        },
        lampiran: {
            name: 'lampiran',
            primaryKey: 'id',
            timestamps: true,
            softDeletes: false
        },
        notifikasi: {
            name: 'notifikasi',
            primaryKey: 'id',
            timestamps: true,
            softDeletes: false
        },
        log_aktivitas: {
            name: 'log_aktivitas',
            primaryKey: 'id',
            timestamps: true,
            softDeletes: false
        },
        pengaturan: {
            name: 'pengaturan',
            primaryKey: 'id',
            timestamps: true,
            softDeletes: false
        }
    },

    // Migration settings
    migrations: {
        table: 'migrations',
        path: 'src/database/migrations/',
        enabled: true
    },

    // Seeder settings
    seeders: {
        path: 'src/database/seeders/',
        enabled: true
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseConfig;
}
