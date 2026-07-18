const Role = require('../../app/Models/Role');

async function seedRoles() {
    try {
        const roles = [
            {
                nama_role: 'superadmin',
                deskripsi: 'Super Administrator dengan akses penuh ke semua fitur'
            },
            {
                nama_role: 'admin',
                deskripsi: 'Administrator dengan akses manajemen'
            },
            {
                nama_role: 'kepala_bagian',
                deskripsi: 'Kepala Bagian dengan akses disposisi dan laporan'
            },
            {
                nama_role: 'staff',
                deskripsi: 'Staff dengan akses input surat'
            },
            {
                nama_role: 'user',
                deskripsi: 'Pengguna biasa dengan akses terbatas'
            }
        ];

        for (const role of roles) {
            await Role.findOrCreate({
                where: { nama_role: role.nama_role },
                defaults: role
            });
        }

        console.log('✓ Roles seeded successfully');
    } catch (error) {
        console.error('✗ Error seeding roles:', error);
        throw error;
    }
}

module.exports = seedRoles;

// Run if executed directly
if (require.main === module) {
    seedRoles().then(() => process.exit(0)).catch(() => process.exit(1));
}
