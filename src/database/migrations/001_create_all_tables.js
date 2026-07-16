// ==================== DATABASE MIGRATION ====================
// Arsip Surat Digital Enterprise
// Create all tables

const db = require('../../config/database');

async function up() {
    console.log('Running migration: Create all tables...');

    // ==================== ROLES TABLE ====================
    await db.run(`
        CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama VARCHAR(50) NOT NULL UNIQUE,
            kode VARCHAR(20) NOT NULL UNIQUE,
            deskripsi TEXT,
            permissions TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // ==================== PENGGUNA TABLE ====================
    await db.run(`
        CREATE TABLE IF NOT EXISTS pengguna (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            fullname VARCHAR(100) NOT NULL,
            jabatan VARCHAR(100),
            nip VARCHAR(30),
            phone VARCHAR(20),
            avatar VARCHAR(255),
            role_id INTEGER NOT NULL,
            instansi_id INTEGER,
            is_active INTEGER DEFAULT 1,
            login_attempts INTEGER DEFAULT 0,
            last_login_attempt DATETIME,
            last_login DATETIME,
            last_activity DATETIME,
            password_changed_at DATETIME,
            reset_token VARCHAR(255),
            reset_token_expires DATETIME,
            remember_token VARCHAR(255),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (role_id) REFERENCES roles(id),
            FOREIGN KEY (instansi_id) REFERENCES instansi(id)
        )
    `);

    // ==================== INSTANSI TABLE ====================
    await db.run(`
        CREATE TABLE IF NOT EXISTS instansi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kode VARCHAR(20) NOT NULL UNIQUE,
            nama VARCHAR(100) NOT NULL,
            alamat TEXT,
            phone VARCHAR(20),
            email VARCHAR(100),
            website VARCHAR(100),
            logo VARCHAR(255),
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // ==================== KATEGORI TABLE ====================
    await db.run(`
        CREATE TABLE IF NOT EXISTS kategori (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama VARCHAR(50) NOT NULL,
            kode VARCHAR(20) NOT NULL UNIQUE,
            deskripsi TEXT,
            warna VARCHAR(7) DEFAULT '#3b82f6',
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // ==================== SURAT MASUK TABLE ====================
    await db.run(`
        CREATE TABLE IF NOT EXISTS surat_masuk (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nomor_agenda VARCHAR(30) NOT NULL UNIQUE,
            nomor_surat VARCHAR(100) NOT NULL,
            tanggal_surat DATE NOT NULL,
            tanggal_terima DATE NOT NULL,
            pengirim VARCHAR(200) NOT NULL,
            perihal VARCHAR(500) NOT NULL,
            ringkasan TEXT,
            kategori VARCHAR(30) DEFAULT 'biasa',
            sifat_surat VARCHAR(30) DEFAULT 'biasa',
            prioritas VARCHAR(30) DEFAULT 'sedang',
            status VARCHAR(20) DEFAULT 'baru',
            catatan TEXT,
            qr_code VARCHAR(255),
            instansi_id INTEGER NOT NULL,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (instansi_id) REFERENCES instansi(id),
            FOREIGN KEY (created_by) REFERENCES pengguna(id)
        )
    `);

    // ==================== SURAT KELUAR TABLE ====================
    await db.run(`
        CREATE TABLE IF NOT EXISTS surat_keluar (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nomor_surat VARCHAR(100) NOT NULL UNIQUE,
            tanggal_surat DATE NOT NULL,
            tujuan VARCHAR(200) NOT NULL,
            perihal VARCHAR(500) NOT NULL,
            isi_surat TEXT,
            kategori VARCHAR(30) DEFAULT 'biasa',
            sifat_surat VARCHAR(30) DEFAULT 'biasa',
            status VARCHAR(20) DEFAULT 'konsep',
            catatan TEXT,
            instansi_id INTEGER NOT NULL,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (instansi_id) REFERENCES instansi(id),
            FOREIGN KEY (created_by) REFERENCES pengguna(id)
        )
    `);

    // ==================== DISPOSISI TABLE ====================
    await db.run(`
        CREATE TABLE IF NOT EXISTS disposisi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            surat_masuk_id INTEGER NOT NULL,
            dari_user_id INTEGER NOT NULL,
            kepada_user_id INTEGER,
            kepada_role_id INTEGER,
            isi_disposisi TEXT NOT NULL,
            sifat_disposisi VARCHAR(30) DEFAULT 'biasa',
            batas_waktu DATE,
            status VARCHAR(20) DEFAULT 'pending',
            catatan_tindak_lanjut TEXT,
            tanggal_selesai DATETIME,
            instansi_id INTEGER NOT NULL,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (surat_masuk_id) REFERENCES surat_masuk(id) ON DELETE CASCADE,
            FOREIGN KEY (dari_user_id) REFERENCES pengguna(id),
            FOREIGN KEY (kepada_user_id) REFERENCES pengguna(id),
            FOREIGN KEY (kepada_role_id) REFERENCES roles(id),
            FOREIGN KEY (instansi_id) REFERENCES instansi(id)
        )
    `);

    // ==================== LAMPIRAN TABLE ====================
    await db.run(`
        CREATE TABLE IF NOT EXISTS lampiran (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            surat_masuk_id INTEGER,
            surat_keluar_id INTEGER,
            nama_file VARCHAR(255) NOT NULL,
            path VARCHAR(500) NOT NULL,
            ukuran INTEGER,
            tipe VARCHAR(50),
            uploaded_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (surat_masuk_id) REFERENCES surat_masuk(id) ON DELETE CASCADE,
            FOREIGN KEY (surat_keluar_id) REFERENCES surat_keluar(id) ON DELETE CASCADE
        )
    `);

    // ==================== NOTIFIKASI TABLE ====================
    await db.run(`
        CREATE TABLE IF NOT EXISTS notifikasi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(200) NOT NULL,
            message TEXT,
            data TEXT,
            is_read INTEGER DEFAULT 0,
            read_at DATETIME,
            instansi_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES pengguna(id),
            FOREIGN KEY (instansi_id) REFERENCES instansi(id)
        )
    `);

    // ==================== LOG AKTIVITAS TABLE ====================
    await db.run(`
        CREATE TABLE IF NOT EXISTS log_aktivitas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action VARCHAR(100) NOT NULL,
            description TEXT,
            ip_address VARCHAR(45),
            user_agent TEXT,
            metadata TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES pengguna(id)
        )
    `);

    // ==================== PENGATURAN TABLE ====================
    await db.run(`
        CREATE TABLE IF NOT EXISTS pengaturan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kunci VARCHAR(100) NOT NULL UNIQUE,
            nilai TEXT,
            tipe VARCHAR(20) DEFAULT 'string',
            deskripsi TEXT,
            instansi_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (instansi_id) REFERENCES instansi(id)
        )
    `);

    // ==================== INDEXES ====================
    await db.run(`CREATE INDEX IF NOT EXISTS idx_surat_masuk_status ON surat_masuk(status)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_surat_masuk_tanggal ON surat_masuk(tanggal_terima)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_surat_masuk_instansi ON surat_masuk(instansi_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_surat_keluar_status ON surat_keluar(status)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_disposisi_status ON disposisi(status)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_disposisi_surat ON disposisi(surat_masuk_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_notifikasi_user ON notifikasi(user_id, is_read)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_log_aktivitas_user ON log_aktivitas(user_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_log_aktivitas_action ON log_aktivitas(action)`);

    console.log('Migration completed successfully!');
}

async function down() {
    console.log('Rolling back migration...');
    
    const tables = [
        'log_aktivitas',
        'notifikasi',
        'lampiran',
        'disposisi',
        'surat_keluar',
        'surat_masuk',
        'pengaturan',
        'kategori',
        'pengguna',
        'instansi',
        'roles',
    ];

    for (const table of tables) {
        await db.run(`DROP TABLE IF EXISTS ${table}`);
    }

    console.log('Rollback completed!');
}

// Run migration
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'up';

    if (command === 'down') {
        down().then(() => process.exit(0));
    } else {
        up().then(() => process.exit(0));
    }
}

module.exports = { up, down };
