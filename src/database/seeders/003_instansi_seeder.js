exports.seed = async function(knex) {
  // Truncate existing data
  await knex('instansi').del();

  // Insert instansi
  return knex('instansi').insert([
    {
      id: 1,
      nama: 'Dinas Komunikasi dan Informatika',
      kode: 'DISKOMINFO',
      alamat: 'Jl. Merdeka No. 123, Jakarta Pusat',
      kota: 'Jakarta Pusat',
      provinsi: 'DKI Jakarta',
      kode_pos: '10110',
      no_telp: '021-12345678',
      email: 'diskominfo@jakarta.go.id',
      website: 'https://diskominfo.jakarta.go.id',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      nama: 'Badan Kepegawaian Daerah',
      kode: 'BKD',
      alamat: 'Jl. Sudirman No. 45, Jakarta Selatan',
      kota: 'Jakarta Selatan',
      provinsi: 'DKI Jakarta',
      kode_pos: '12190',
      no_telp: '021-87654321',
      email: 'bkd@jakarta.go.id',
      website: 'https://bkd.jakarta.go.id',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      nama: 'Dinas Pendidikan',
      kode: 'DISDIK',
      alamat: 'Jl. Gatot Subroto No. 67, Jakarta Selatan',
      kota: 'Jakarta Selatan',
      provinsi: 'DKI Jakarta',
      kode_pos: '12710',
      no_telp: '021-56789012',
      email: 'disdik@jakarta.go.id',
      website: 'https://disdik.jakarta.go.id',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      nama: 'Dinas Kesehatan',
      kode: 'DINKES',
      alamat: 'Jl. Kesehatan No. 89, Jakarta Timur',
      kota: 'Jakarta Timur',
      provinsi: 'DKI Jakarta',
      kode_pos: '13120',
      no_telp: '021-34567890',
      email: 'dinkes@jakarta.go.id',
      website: 'https://dinkes.jakarta.go.id',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      nama: 'PT Teknologi Digital Indonesia',
      kode: 'TDI',
      alamat: 'Jl. Teknologi No. 10, Bandung',
      kota: 'Bandung',
      provinsi: 'Jawa Barat',
      kode_pos: '40123',
      no_telp: '022-98765432',
      email: 'info@tekdigi.co.id',
      website: 'https://tekdigi.co.id',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
};
