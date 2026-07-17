// RoleSeeder.js - Seed Default Roles
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';

const roles = [
    {
        nama_role: 'Super Admin',
        kode: 'superadmin',
        deskripsi: 'Akses penuh ke semua fitur sistem'
    },
    {
        nama_role: 'Administrator',
        kode: 'admin',
        deskripsi: 'Mengelola surat, disposisi, dan pengguna'
    },
    {
        nama_role: 'Operator',
        kode: 'operator',
        deskripsi: 'Membuat dan mengelola surat masuk/keluar'
    },
    {
        nama_role: 'Viewer',
        kode: 'viewer',
        deskripsi: 'Hanya melihat data surat dan laporan'
    }
];

async function seedRoles() {
    console.log('Seeding roles...');

    for (const role of roles) {
        try {
            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'seeder_role',
                data: role,
                timestamp: Date.now()
            })));

            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = JSON.parse(decodeURIComponent(atob(result.data)));

            if (data.success) {
                console.log(`  ✓ Role "${role.nama_role}" seeded`);
            } else {
                console.log(`  ⚠ Role "${role.nama_role}" skipped: ${data.message}`);
            }

        } catch (error) {
            console.error(`  ✗ Role "${role.nama_role}" failed: ${error.message}`);
        }
    }

    console.log('Role seeding complete!');
}

// Run seeder
seedRoles().catch(console.error);
