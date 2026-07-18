const Kategori = require('../../app/Models/Kategori');

async function seedKategori() {
    try {
        const kategoriList = [
            {
                nama_kategori: 'Surat Keputusan',
                kode: 'SK',
                deskripsi: 'Surat keputusan dan ketetapan',
                parent_id: null
            },
            {
                nama_kategori: 'Surat Edaran',
                kode: 'SE',
                deskripsi: 'Surat edaran dan pemberitahuan',
                parent_id: null
            },
            {
                nama_kategori: 'Surat Undangan',
                kode: 'SU',
                deskripsi: 'Surat undangan resmi',
                parent_id: null
            },
            {
                nama_kategori: 'Surat Tugas',
                kode: 'ST',
                deskripsi: 'Surat perintah tugas',
                parent_id: null
            },
            {
                nama_kategori: 'Nota Dinas',
                kode: 'ND',
                deskripsi: 'Nota dinas internal',
                parent_id: null
            },
            {
                nama_kategori: 'Laporan',
                kode: 'LAP',
                deskripsi: 'Laporan kegiatan dan keuangan',
                parent_id: null
            },
            {
                nama_kategori: 'Berita Acara',
                kode: 'BA',
                deskripsi: 'Berita acara kegiatan',
                parent_id: null
            },
            {
                nama_kategori: 'Perjanjian',
                kode: 'PJ',
                deskripsi: 'Surat perjanjian dan MOU',
                parent_id: null
            }
        ];

        for (const katData of kategoriList) {
            const [kategori, created] = await Kategori.findOrCreate({
                where: { kode: katData.kode },
                defaults: katData
            });

            if (created) {
                console.log(`✓ Created kategori: ${kategori.nama_kategori}`);
            } else {
                console.log(`→ Kategori already exists: ${kategori.nama_kategori}`);
            }
        }

        console.log('✓ Kategori seeded successfully');
    } catch (error) {
        console.error('✗ Error seeding kategori:', error);
        throw error;
    }
}

module.exports = seedKategori;

if (require.main === module) {
    seedKategori().then(() => process.exit(0)).catch(() => process.exit(1));
}
