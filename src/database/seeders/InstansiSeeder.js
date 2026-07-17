// InstansiSeeder.js - Seed Default Instansi
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';

const instansi = [
    {
        nama_instansi: 'Dinas Komunikasi dan Informatika',
        kode_instansi: 'DISKOMINFO',
        alamat: 'Jl. Teknologi No. 1, Jakarta',
        telepon: '021-1234567',
        email: 'diskominfo@example.com'
    },
    {
        nama_instansi: 'Badan Perencanaan Daerah',
        kode_instansi: 'BAPPEDA',
        alamat: 'Jl. Pembangunan No. 2, Jakarta',
        telepon: '021-2345678',
        email: 'bappeda@example.com'
    },
    {
        nama_instansi: 'Dinas Pendidikan',
        kode_instansi: 'DISDIK',
        alamat: 'Jl. Pendidikan No. 3, Jakarta',
        telepon: '021-3456789',
        email: 'disdik@example.com'
    },
    {
        nama_instansi: 'Dinas Kesehatan',
        kode_instansi: 'DINKES',
        alamat: 'Jl. Kesehatan No. 4, Jakarta',
        telepon: '021-4567890',
        email: 'dinkes@example.com'
    },
    {
        nama_instansi: 'Sekretariat Daerah',
        kode_instansi: 'SETDA',
        alamat: 'Jl. Pemerintahan No. 5, Jakarta',
        telepon: '021-5678901',
        email: 'setda@example.com'
    }
];

async function seedInstansi() {
    console.log('Seeding instansi...');

    for (const item of instansi) {
        try {
            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'seeder_instansi',
                data: item,
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
                console.log(`  ✓ Instansi "${item.nama_instansi}" seeded`);
            } else {
                console.log(`  ⚠ Instansi "${item.nama_instansi}" skipped`);
            }

        } catch (error) {
            console.error(`  ✗ Instansi "${item.nama_instansi}" failed: ${error.message}`);
        }
    }

    console.log('Instansi seeding complete!');
}

seedInstansi().catch(console.error);
