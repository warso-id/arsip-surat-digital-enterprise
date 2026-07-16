// ==================== ADMIN SEEDER ====================
// Arsip Surat Digital Enterprise

const bcrypt = require('bcryptjs');
const db = require('../../config/database');

async function seed() {
    console.log('Seeding default data...');

    try {
        // ==================== ROLES ====================
        const roles = [
            { nama: 'Super Admin', kode: 'superadmin', deskripsi: 'Akses penuh ke semua fitur' },
            { nama: 'Administrator', kode: 'admin', deskripsi: 'Administrator instansi' },
            { nama: 'Operator', kode: 'operator', deskripsi: 'Operator surat menyurat' },
            { nama: 'Pimpinan', kode: 'pimpinan', deskripsi: 'Pimpinan instansi' },
            { nama: 'Viewer', kode: 'viewer', deskripsi: 'Hanya melihat data' },
        ];

        for (const role of roles) {
            await db.run(
                `INSERT OR IGNORE INTO roles (nama, kode, deskripsi) VALUES (?, ?, ?)`,
                [role.nama, role.kode, role.deskripsi]
            );
        }
        console.log('Roles seeded.');

        // ==================== INSTANSI ====================
        await db.run(
            `INSERT OR IGNORE INTO instansi (kode, nama, alamat, phone, email) 
             VALUES (?, ?, ?, ?, ?)`,
            ['INST-001', 'Instansi Default', 'Jl. Contoh No. 123', '021-1234567', 'info@instansi.id']
        );
        console.log('Instansi seeded.');

        // ==================== KATEGORI ====================
        const kategori = [
            { nama: 'Biasa', kode: 'biasa', deskripsi: 'Surat biasa', warna: '#3b82f6' },
            { nama: 'Penting', kode: 'penting', deskripsi: 'Surat penting', warna: '#f59e0b' },
            { nama: 'Rahasia', kode: 'rahasia', deskripsi: 'Surat rahasia', warna: '#ef4444' },
            { nama: 'Segera', kode: 'segera', deskripsi: 'Surat segera', warna: '#10b981' },
        ];

        for (const kat of kategori) {
            await db.run(
                `INSERT OR IGNORE INTO kategori (nama, kode, deskripsi, warna) VALUES (?, ?, ?, ?)`,
                [kat.nama, kat.kode, kat.deskripsi, kat.warna]
            );
        }
        console.log('Kategori seeded.');

        // ==================== ADMIN USER ====================
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        await db.run(
            `INSERT OR IGNORE INTO pengguna 
             (username, email, password, fullname, jabatan, role_id, instansi_id, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ['admin', 'admin@arsipsurat.id', hashedPassword, 'Administrator', 'Administrator Sistem', 1, 1, 1]
        );

        // ==================== DEMO USERS ====================
        const demoPassword = await bcrypt.hash('password123', salt);
        
        const demoUsers = [
            { username: 'kabag', email: 'kabag@instansi.id', fullname: 'Kepala Bagian', jabatan: 'Kepala Bagian Umum', role_id: 4 },
            { username: 'staff', email: 'staff@instansi.id', fullname: 'Staff Administrasi', jabatan: 'Staff', role_id: 3 },
            { username: 'operator', email: 'operator@instansi.id', fullname: 'Operator Surat', jabatan: 'Operator', role_id: 3 },
        ];

        for (const user of demoUsers) {
            await db.run(
                `INSERT OR IGNORE INTO pengguna 
                 (username, email, password, fullname, jabatan, role_id, instansi_id, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [user.username, user.email, demoPassword, user.fullname, user.jabatan, user.role_id, 1, 1]
            );
        }
        console.log('Users seeded.');

        // ==================== PENGATURAN DEFAULT ====================
        const settings = [
            { kunci: 'app_name', nilai: 'Arsip Surat Digital Enterprise', deskripsi: 'Nama aplikasi' },
            { kunci: 'app_description', nilai: 'Sistem Manajemen Arsip Surat', deskripsi: 'Deskripsi aplikasi' },
            { kunci: 'items_per_page', nilai: '15', deskripsi: 'Jumlah item per halaman' },
            { kunci: 'default_language', nilai: 'id', deskripsi: 'Bahasa default' },
            { kunci: 'timezone', nilai: 'Asia/Jakarta', deskripsi: 'Zona waktu' },
            { kunci: 'date_format', nilai: 'd-m-Y', deskripsi: 'Format tanggal' },
            { kunci: 'enable_notification', nilai: 'true', deskripsi: 'Aktifkan notifikasi' },
            { kunci: 'auto_backup', nilai: 'false', deskripsi: 'Backup otomatis' },
        ];

        for (const setting of settings) {
            await db.run(
                `INSERT OR IGNORE INTO pengaturan (kunci, nilai, deskripsi, instansi_id) VALUES (?, ?, ?, ?)`,
                [setting.kunci, setting.nilai, setting.deskripsi, 1]
            );
        }
        console.log('Settings seeded.');

        // ==================== SAMPLE DATA ====================
        // Sample surat masuk
        const sampleSuratMasuk = [
            {
                nomor_agenda: 'SM-2024-001',
                nomor_surat: '005/UND-KEM-A/I/2024',
                tanggal_surat: '2024-01-10',
                tanggal_terima: '2024-01-15',
                pengirim: 'Kementerian A',
                perihal: 'Undangan Rapat Koordinasi',
                ringkasan: 'Mengundang Kepala Bagian untuk menghadiri rapat koordinasi.',
                kategori: 'penting',
                sifat_surat: 'segera',
                prioritas: 'tinggi',
                status: 'proses',
                instansi_id: 1,
                created_by: 1,
            },
            {
                nomor_agenda: 'SM-2024-002',
                nomor_surat: '010/PRM-DIN-B/I/2024',
                tanggal_surat: '2024-01-12',
                tanggal_terima: '2024-01-14',
                pengirim: 'Dinas B',
                perihal: 'Permohonan Data Statistik',
                ringkasan: 'Memohon data statistik untuk keperluan penelitian.',
                kategori: 'biasa',
                sifat_surat: 'biasa',
                prioritas: 'sedang',
                status: 'proses',
                instansi_id: 1,
                created_by: 1,
            },
            {
                nomor_agenda: 'SM-2024-003',
                nomor_surat: '015/LAP-INS-C/I/2024',
                tanggal_surat: '2024-01-08',
                tanggal_terima: '2024-01-13',
                pengirim: 'Instansi C',
                perihal: 'Laporan Tahunan 2023',
                ringkasan: 'Menyampaikan laporan tahunan untuk diarsipkan.',
                kategori: 'rahasia',
                sifat_surat: 'rahasia',
                prioritas: 'sedang',
                status: 'selesai',
                instansi_id: 1,
                created_by: 1,
            },
        ];

        for (const surat of sampleSuratMasuk) {
            await db.run(
                `INSERT OR IGNORE INTO surat_masuk 
                 (nomor_agenda, nomor_surat, tanggal_surat, tanggal_terima, pengirim, 
                  perihal, ringkasan, kategori, sifat_surat, prioritas, status, instansi_id, created_by) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [surat.nomor_agenda, surat.nomor_surat, surat.tanggal_surat, surat.tanggal_terima,
                 surat.pengirim, surat.perihal, surat.ringkasan, surat.kategori,
                 surat.sifat_surat, surat.prioritas, surat.status, surat.instansi_id, surat.created_by]
            );
        }

        // Sample disposisi
        await db.run(
            `INSERT OR IGNORE INTO disposisi 
             (surat_masuk_id, dari_user_id, kepada_user_id, isi_disposisi, 
              sifat_disposisi, batas_waktu, status, instansi_id, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [1, 1, 2, 'Tolong diproses dan siapkan bahan rapat.', 'segera', '2024-01-20', 'pending', 1, 1]
        );

        console.log('Sample data seeded.');
        console.log('========================================');
        console.log('Default login credentials:');
        console.log('Admin: admin / admin123');
        console.log('Kabag: kabag / password123');
        console.log('Staff: staff / password123');
        console.log('Operator: operator / password123');
        console.log('========================================');

    } catch (error) {
        console.error('Seeding failed:', error);
        throw error;
    }
}

// Run seeder
if (require.main === module) {
    seed().then(() => {
        console.log('Seeding completed!');
        process.exit(0);
    }).catch(error => {
        console.error('Seeding error:', error);
        process.exit(1);
    });
}

module.exports = { seed };
