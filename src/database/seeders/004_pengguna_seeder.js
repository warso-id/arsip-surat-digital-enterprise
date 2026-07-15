const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Truncate existing data
  await knex('pengguna').del();

  // Hash password
  const password = await bcrypt.hash('password123', 10);

  // Insert users
  return knex('pengguna').insert([
    {
      id: 1,
      nama_lengkap: 'Super Admin',
      email: 'superadmin@arsipsurat.id',
      password: password,
      role_id: 1,
      instansi_id: 1,
      nip: '198501012010011001',
      jabatan: 'Super Administrator',
      no_telp: '081234567890',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      nama_lengkap: 'Admin Utama',
      email: 'admin@arsipsurat.id',
      password: password,
      role_id: 2,
      instansi_id: 1,
      nip: '198602022011012002',
      jabatan: 'Administrator Sistem',
      no_telp: '081234567891',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      nama_lengkap: 'Andi Pratama',
      email: 'andi.pratama@arsipsurat.id',
      password: password,
      role_id: 3,
      instansi_id: 1,
      nip: '198703032012013003',
      jabatan: 'Staff Administrasi',
      no_telp: '081234567892',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      nama_lengkap: 'Budi Santoso',
      email: 'budi.santoso@arsipsurat.id',
      password: password,
      role_id: 4,
      instansi_id: 2,
      nip: '198804042013014004',
      jabatan: 'Kepala Bagian Umum',
      no_telp: '081234567893',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      nama_lengkap: 'Citra Dewi',
      email: 'citra.dewi@arsipsurat.id',
      password: password,
      role_id: 3,
      instansi_id: 2,
      nip: '198905052014015005',
      jabatan: 'Staff Tata Usaha',
      no_telp: '081234567894',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
};
