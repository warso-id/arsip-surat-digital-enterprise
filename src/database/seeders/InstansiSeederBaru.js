const Instansi = require('../../app/Models/Instansi');

async function seedInstansi() {
    try {
        const instansiList = [
            {
                nama_instansi: 'Kementerian Dalam Negeri',
                alamat: 'Jl. Medan Merdeka Utara No.7, Jakarta Pusat',
                kode_pos: '10110',
                telepon: '021-3450032',
                email: 'info@kemendagri.go.id',
                website: 'https://www.kemendagri.go.id'
            },
            {
                nama_instansi: 'Pemerintah Provinsi DKI Jakarta',
                alamat: 'Jl. Medan Merdeka Selatan No.8-9, Jakarta Pusat',
                kode_pos: '10110',
                telepon: '021-3822255',
                email: 'info@jakarta.go.id',
                website: 'https://jakarta.go.id'
            },
            {
                nama_instansi: 'Pemerintah Kota Bandung',
                alamat: 'Jl. Wastukencana No.2, Bandung',
                kode_pos: '40117',
                telepon: '022-4233445',
                email: 'info@bandung.go.id',
                website: 'https://www.bandung.go.id'
            },
            {
                nama_instansi: 'Pemerintah Kota Surabaya',
                alamat: 'Jl. Walikota Mustajab No.59, Surabaya',
                kode_pos: '60272',
                telepon: '031-5312144',
                email: 'info@surabaya.go.id',
                website: 'https://surabaya.go.id'
            },
            {
                nama_instansi: 'Badan Pengawasan Keuangan dan Pembangunan',
                alamat: 'Jl. Pramuka No.33, Jakarta Timur',
                kode_pos: '13120',
                telepon: '021-85910031',
                email: 'info@bpkp.go.id',
                website: 'https://www.bpkp.go.id'
            }
        ];

        for (const instansiData of instansiList) {
            const [instansi, created] = await Instansi.findOrCreate({
                where: { nama_instansi: instansiData.nama_instansi },
                defaults: instansiData
            });

            if (created) {
                console.log(`✓ Created instansi: ${instansi.nama_instansi}`);
            } else {
                console.log(`→ Instansi already exists: ${instansi.nama_instansi}`);
            }
        }

        console.log('✓ Instansi seeded successfully');
    } catch (error) {
        console.error('✗ Error seeding instansi:', error);
        throw error;
    }
}

module.exports = seedInstansi;

if (require.main === module) {
    seedInstansi().then(() => process.exit(0)).catch(() => process.exit(1));
}
