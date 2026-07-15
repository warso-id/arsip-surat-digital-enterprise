exports.seed = async function(knex) {
  // Truncate existing data
  await knex('roles').del();

  // Insert roles
  return knex('roles').insert([
    {
      id: 1,
      nama: 'Super Admin',
      slug: 'super-admin',
      deskripsi: 'Super Administrator dengan akses penuh',
      permissions: JSON.stringify({
        surat: ['create', 'read', 'update', 'delete'],
        disposisi: ['create', 'read', 'update', 'delete'],
        pengguna: ['create', 'read', 'update', 'delete'],
        kategori: ['create', 'read', 'update', 'delete'],
        instansi: ['create', 'read', 'update', 'delete'],
        laporan: ['read', 'export'],
        pengaturan: ['read', 'update'],
        backup: ['create', 'restore']
      }),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      nama: 'Administrator',
      slug: 'admin',
      deskripsi: 'Administrator dengan akses terbatas',
      permissions: JSON.stringify({
        surat: ['create', 'read', 'update'],
        disposisi: ['create', 'read', 'update'],
        pengguna: ['read'],
        kategori: ['create', 'read', 'update'],
        instansi: ['read'],
        laporan: ['read', 'export'],
        pengaturan: ['read'],
        backup: ['create']
      }),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      nama: 'Staff',
      slug: 'staff',
      deskripsi: 'Staff dengan akses dasar',
      permissions: JSON.stringify({
        surat: ['create', 'read'],
        disposisi: ['read', 'update'],
        pengguna: ['read'],
        kategori: ['read'],
        instansi: ['read'],
        laporan: ['read'],
        pengaturan: []
      }),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      nama: 'Kepala Bagian',
      slug: 'kabag',
      deskripsi: 'Kepala Bagian dengan akses disposisi',
      permissions: JSON.stringify({
        surat: ['read'],
        disposisi: ['create', 'read', 'update'],
        pengguna: ['read'],
        kategori: ['read'],
        instansi: ['read'],
        laporan: ['read', 'export'],
        pengaturan: []
      }),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
};
