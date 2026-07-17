// KategoriSeeder.js - Seed Default Categories
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';

const categories = [
    { nama_kategori: 'Undangan', kode: 'UND', deskripsi: 'Surat undangan resmi' },
    { nama_kategori: 'Pengumuman', kode: 'PENG', deskripsi: 'Surat pengumuman' },
    { nama_kategori: 'Permohonan', kode: 'PERM', deskripsi: 'Surat permohonan' },
    { nama_kategori: 'Laporan', kode: 'LAP', deskripsi: 'Surat laporan' },
    { nama_kategori: 'Keputusan', kode: 'KEP', deskripsi: 'Surat keputusan' },
    { nama_kategori: 'Instruksi', kode: 'INS', deskripsi: 'Surat instruksi' },
    { nama_kategori: 'Edaran', kode: 'EDR', deskripsi: 'Surat edaran' },
    { nama_kategori: 'Nota Dinas', kode: 'ND', deskripsi: 'Nota dinas internal' },
    { nama_kategori: 'Memorandum', kode: 'MEMO', deskripsi: 'Memorandum' },
    { nama_kategori: 'Lainnya', kode: 'LL', deskripsi: 'Surat lainnya' }
];

async function seedCategories() {
    console.log('Seeding categories...');

    for (const category of categories) {
        try {
            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'seeder_kategori',
                data: category,
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
                console.log(`  ✓ Category "${category.nama_kategori}" seeded`);
            } else {
                console.log(`  ⚠ Category "${category.nama_kategori}" skipped`);
            }

        } catch (error) {
            console.error(`  ✗ Category "${category.nama_kategori}" failed: ${error.message}`);
        }
    }

    console.log('Category seeding complete!');
}

seedCategories().catch(console.error);
