exports.seed = async function(knex) {
  // Truncate existing data
  await knex('kategori').del();

  // Insert main categories
  return knex('kategori').insert([
    {
      id: 1,
      nama: 'Surat Keputusan',
      kode: 'SK',
      deskripsi: 'Surat Keputusan dan Ketetapan',
      parent_id: null,
      level: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      nama: 'Surat Edaran',
      kode: 'SE',
      deskripsi: 'Surat Edaran dan Pengumuman',
      parent_id: null,
      level: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      nama: 'Surat Tugas',
      kode: 'ST',
      deskripsi: 'Surat Perintah Tugas',
      parent_id: null,
      level: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      nama: 'Surat Undangan',
      kode: 'SU',
      deskripsi: 'Surat Undangan Resmi',
      parent_id: null,
      level: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      nama: 'Nota Dinas',
      kode: 'ND',
      deskripsi: 'Nota Dinas Internal',
      parent_id: null,
      level: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 6,
      nama: 'Memorandum',
      kode: 'MO',
      deskripsi: 'Memorandum Resmi',
      parent_id: null,
      level: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 7,
      nama: 'Laporan',
      kode: 'LP',
      deskripsi: 'Laporan dan Dokumentasi',
      parent_id: null,
      level: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 8,
      nama: 'Berita Acara',
      kode: 'BA',
      deskripsi: 'Berita Acara Kegiatan',
      parent_id: null,
      level: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 9,
      nama: 'Perjanjian Kerjasama',
      kode: 'PKS',
      deskripsi: 'Perjanjian Kerjasama/MoU',
      parent_id: null,
      level: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 10,
      nama: 'Surat Pengantar',
      kode: 'SP',
      deskripsi: 'Surat Pengantar Dokumen',
      parent_id: null,
      level: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
};
