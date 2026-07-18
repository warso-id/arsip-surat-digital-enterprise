const Pengguna = require('../../app/Models/Pengguna');
const Role = require('../../app/Models/Role');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    try {
        // Find superadmin role
        const superadminRole = await Role.findOne({ 
            where: { nama_role: 'superadmin' } 
        });
        
        if (!superadminRole) {
            throw new Error('Superadmin role not found. Run RoleSeeder first.');
        }

        // Find admin role
        const adminRole = await Role.findOne({ 
            where: { nama_role: 'admin' } 
        });

        const users = [
            {
                role_id: superadminRole.id,
                nama_lengkap: 'Super Administrator',
                email: 'superadmin@arsipsurat.com',
                password: 'SuperAdmin123!',
                nip: '198001012008011001',
                jabatan: 'Super Administrator',
                no_telp: '081234567890',
                status: 'aktif'
            },
            {
                role_id: adminRole.id,
                nama_lengkap: 'Administrator',
                email: 'admin@arsipsurat.com',
                password: 'Admin123!',
                nip: '198501012010011002',
                jabatan: 'Administrator',
                no_telp: '081234567891',
                status: 'aktif'
            },
            {
                role_id: 3, // kepala_bagian
                nama_lengkap: 'Kepala Bagian',
                email: 'kabag@arsipsurat.com',
                password: 'Kabag123!',
                nip: '198801012012011003',
                jabatan: 'Kepala Bagian Umum',
                no_telp: '081234567892',
                status: 'aktif'
            },
            {
                role_id: 4, // staff
                nama_lengkap: 'Staff Administrasi',
                email: 'staff@arsipsurat.com',
                password: 'Staff123!',
                nip: '199001012015011004',
                jabatan: 'Staff Administrasi',
                no_telp: '081234567893',
                status: 'aktif'
            }
        ];

        for (const userData of users) {
            const [user, created] = await Pengguna.findOrCreate({
                where: { email: userData.email },
                defaults: userData
            });

            if (created) {
                console.log(`✓ Created user: ${user.nama_lengkap} (${user.email})`);
            } else {
                console.log(`→ User already exists: ${user.nama_lengkap} (${user.email})`);
            }
        }

        console.log('✓ Admin users seeded successfully');
    } catch (error) {
        console.error('✗ Error seeding admin users:', error);
        throw error;
    }
}

module.exports = seedAdmin;

if (require.main === module) {
    seedAdmin().then(() => process.exit(0)).catch(() => process.exit(1));
}
