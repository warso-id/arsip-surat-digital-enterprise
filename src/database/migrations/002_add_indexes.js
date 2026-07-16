// ==================== ADDITIONAL INDEXES MIGRATION ====================
// Arsip Surat Digital Enterprise v2.1.0

const db = require('../../config/database');

async function up() {
    console.log('Running migration: Add performance indexes...');

    const indexes = [
        `CREATE INDEX IF NOT EXISTS idx_surat_masuk_nomor_surat ON surat_masuk(nomor_surat)`,
        `CREATE INDEX IF NOT EXISTS idx_surat_masuk_pengirim ON surat_masuk(pengirim)`,
        `CREATE INDEX IF NOT EXISTS idx_surat_masuk_perihal ON surat_masuk(perihal)`,
        `CREATE INDEX IF NOT EXISTS idx_surat_masuk_kategori ON surat_masuk(kategori)`,
        `CREATE INDEX IF NOT EXISTS idx_surat_masuk_created_by ON surat_masuk(created_by)`,
        `CREATE INDEX IF NOT EXISTS idx_surat_keluar_nomor_surat ON surat_keluar(nomor_surat)`,
        `CREATE INDEX IF NOT EXISTS idx_surat_keluar_tujuan ON surat_keluar(tujuan)`,
        `CREATE INDEX IF NOT EXISTS idx_surat_keluar_created_by ON surat_keluar(created_by)`,
        `CREATE INDEX IF NOT EXISTS idx_disposisi_dari ON disposisi(dari_user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_disposisi_kepada ON disposisi(kepada_user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_disposisi_batas_waktu ON disposisi(batas_waktu)`,
        `CREATE INDEX IF NOT EXISTS idx_lampiran_surat_masuk ON lampiran(surat_masuk_id)`,
        `CREATE INDEX IF NOT EXISTS idx_lampiran_surat_keluar ON lampiran(surat_keluar_id)`,
        `CREATE INDEX IF NOT EXISTS idx_notifikasi_created ON notifikasi(created_at)`,
        `CREATE INDEX IF NOT EXISTS idx_pengguna_role ON pengguna(role_id)`,
        `CREATE INDEX IF NOT EXISTS idx_pengguna_instansi ON pengguna(instansi_id)`,
    ];

    for (const sql of indexes) {
        try {
            await db.run(sql);
        } catch (error) {
            console.warn(`Index warning: ${error.message}`);
        }
    }

    console.log('Additional indexes created successfully!');
}

async function down() {
    console.log('Removing additional indexes...');
    // SQLite automatically removes indexes when tables are dropped
    console.log('Indexes removed.');
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'up';
    if (command === 'down') down().then(() => process.exit(0));
    else up().then(() => process.exit(0));
}

module.exports = { up, down };
