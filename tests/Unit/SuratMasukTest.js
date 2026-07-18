const SuratService = require('../../src/app/Services/SuratService');
const { sequelize } = require('../../src/config/database');

describe('SuratService - Surat Masuk', () => {
    let userId = 1;

    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('createSuratMasuk', () => {
        it('should create a new surat masuk', async () => {
            const suratData = {
                nomor_surat: '001/TEST/2024',
                pengirim: 'Dinas Test',
                tanggal_surat: '2024-01-15',
                tanggal_terima: '2024-01-16',
                perihal: 'Test Surat Masuk',
                isi_ringkas: 'Ini adalah surat test',
                sifat: 'biasa'
            };

            const surat = await SuratService.createSuratMasuk(suratData, userId);

            expect(surat).toBeDefined();
            expect(surat.nomor_surat).toBe(suratData.nomor_surat);
            expect(surat.pengirim).toBe(suratData.pengirim);
            expect(surat.nomor_agenda).toBeDefined();
            expect(surat.status).toBe('diterima');
        });

        it('should generate unique nomor agenda', async () => {
            const surat1 = await SuratService.createSuratMasuk({
                nomor_surat: '002/TEST/2024',
                pengirim: 'Dinas Test 2',
                tanggal_surat: '2024-01-15',
                tanggal_terima: '2024-01-16',
                perihal: 'Test Surat Masuk 2',
                sifat: 'biasa'
            }, userId);

            const surat2 = await SuratService.createSuratMasuk({
                nomor_surat: '003/TEST/2024',
                pengirim: 'Dinas Test 3',
                tanggal_surat: '2024-01-15',
                tanggal_terima: '2024-01-16',
                perihal: 'Test Surat Masuk 3',
                sifat: 'biasa'
            }, userId);

            expect(surat1.nomor_agenda).not.toBe(surat2.nomor_agenda);
        });
    });

    describe('getSuratMasuk', () => {
        it('should return paginated surat masuk', async () => {
            const result = await SuratService.getSuratMasuk({}, 1, 10);

            expect(result).toBeDefined();
            expect(result.data).toBeInstanceOf(Array);
            expect(result.pagination).toBeDefined();
            expect(result.pagination.total).toBeGreaterThan(0);
        });

        it('should filter by status', async () => {
            const result = await SuratService.getSuratMasuk({ status: 'diterima' }, 1, 10);

            expect(result.data.every(surat => surat.status === 'diterima')).toBe(true);
        });
    });

    describe('updateSuratMasuk', () => {
        it('should update surat masuk', async () => {
            const suratList = await SuratService.getSuratMasuk({}, 1, 1);
            const surat = suratList.data[0];

            const updatedData = {
                perihal: 'Updated Perihal',
                status: 'selesai'
            };

            const updated = await SuratService.updateSuratMasuk(surat.id, updatedData, userId);

            expect(updated.perihal).toBe(updatedData.perihal);
            expect(updated.status).toBe(updatedData.status);
        });
    });

    describe('deleteSuratMasuk', () => {
        it('should soft delete surat masuk', async () => {
            const suratList = await SuratService.getSuratMasuk({}, 1, 1);
            const surat = suratList.data[0];

            await SuratService.deleteSuratMasuk(surat.id, userId);

            // Verify soft delete
            const deletedSurat = await SuratService.getSuratMasukById(surat.id).catch(() => null);
            expect(deletedSurat).toBeNull();
        });
    });
});
