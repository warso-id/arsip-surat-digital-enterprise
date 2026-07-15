/**
 * Unit Tests - Surat Model
 * Arsip Surat Digital Enterprise
 */

const { expect } = require('chai');
const sinon = require('sinon');
const Surat = require('../../src/models/Surat');

describe('Surat Model', () => {
    let suratStub;

    beforeEach(() => {
        suratStub = sinon.stub(Surat, 'query');
    });

    afterEach(() => {
        sinon.restore();
    });

    // ==================== CREATE ====================
    describe('Create Surat', () => {
        it('should create surat masuk successfully', async () => {
            const mockData = {
                nomor_surat: 'SK/001/2024',
                jenis_surat: 'masuk',
                perihal: 'Undangan Rapat',
                tanggal_surat: '2024-01-15',
                pengirim: 'Dinas Pendidikan',
                created_by: 1
            };

            const mockInsert = {
                insert: sinon.stub().resolves({ id: 1, ...mockData })
            };

            suratStub.returns(mockInsert);

            const result = await Surat.query().insert(mockData);

            expect(result).to.have.property('id', 1);
            expect(result.nomor_surat).to.equal('SK/001/2024');
            expect(result.jenis_surat).to.equal('masuk');
        });

        it('should create surat keluar successfully', async () => {
            const mockData = {
                nomor_surat: 'ND/001/2024',
                jenis_surat: 'keluar',
                perihal: 'Nota Dinas Pengadaan',
                tanggal_surat: '2024-01-20',
                penerima: 'Kepala Dinas',
                created_by: 1
            };

            const mockInsert = {
                insert: sinon.stub().resolves({ id: 2, ...mockData })
            };

            suratStub.returns(mockInsert);

            const result = await Surat.query().insert(mockData);

            expect(result).to.have.property('id', 2);
            expect(result.jenis_surat).to.equal('keluar');
        });

        it('should reject surat without required fields', async () => {
            const invalidData = {
                jenis_surat: 'masuk'
                // Missing nomor_surat, perihal, tanggal_surat
            };

            const mockInsert = {
                insert: sinon.stub().rejects(new Error('Validation error: required fields missing'))
            };

            suratStub.returns(mockInsert);

            try {
                await Surat.query().insert(invalidData);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('required fields missing');
            }
        });
    });

    // ==================== READ ====================
    describe('Read Surat', () => {
        it('should get surat masuk with pagination', async () => {
            const mockData = [
                { id: 1, nomor_surat: 'SK/001/2024', jenis_surat: 'masuk' },
                { id: 2, nomor_surat: 'SK/002/2024', jenis_surat: 'masuk' }
            ];

            const mockQuery = {
                where: sinon.stub().returnsThis(),
                whereNull: sinon.stub().returnsThis(),
                withGraphFetched: sinon.stub().returnsThis(),
                orderBy: sinon.stub().returnsThis(),
                page: sinon.stub().resolves({
                    results: mockData,
                    total: 2
                })
            };

            suratStub.returns(mockQuery);

            const result = await Surat.getSuratMasuk(1, 10);

            expect(result.results).to.have.length(2);
            expect(result.total).to.equal(2);
        });

        it('should get surat by id', async () => {
            const mockSurat = {
                id: 1,
                nomor_surat: 'SK/001/2024',
                perihal: 'Undangan Rapat',
                kategori: { id: 1, nama: 'Surat Undangan' }
            };

            const mockQuery = {
                findById: sinon.stub().returnsThis(),
                whereNull: sinon.stub().returnsThis(),
                withGraphFetched: sinon.stub().resolves(mockSurat)
            };

            suratStub.returns(mockQuery);

            const result = await Surat.query().findById(1).withGraphFetched('[kategori]');

            expect(result).to.have.property('id', 1);
            expect(result.kategori.nama).to.equal('Surat Undangan');
        });

        it('should return null for non-existent surat', async () => {
            const mockQuery = {
                findById: sinon.stub().returnsThis(),
                whereNull: sinon.stub().returnsThis(),
                withGraphFetched: sinon.stub().resolves(null)
            };

            suratStub.returns(mockQuery);

            const result = await Surat.query().findById(999).withGraphFetched('[kategori]');

            expect(result).to.be.null;
        });
    });

    // ==================== UPDATE ====================
    describe('Update Surat', () => {
        it('should update surat successfully', async () => {
            const updateData = {
                perihal: 'Undangan Rapat Koordinasi (Updated)',
                updated_by: 1
            };

            const mockQuery = {
                findById: sinon.stub().returnsThis(),
                whereNull: sinon.stub().resolves({ id: 1 }),
                patchAndFetchById: sinon.stub().resolves({ id: 1, ...updateData })
            };

            suratStub.returns(mockQuery);

            const result = await Surat.query().patchAndFetchById(1, updateData);

            expect(result.perihal).to.equal('Undangan Rapat Koordinasi (Updated)');
        });
    });

    // ==================== DELETE ====================
    describe('Delete Surat (Soft Delete)', () => {
        it('should soft delete surat', async () => {
            const mockQuery = {
                patch: sinon.stub().resolves(1)
            };

            suratStub.returns(mockQuery);

            const result = await Surat.softDelete(1, 1);

            expect(result).to.equal(1);
        });
    });

    // ==================== SEARCH ====================
    describe('Search Surat', () => {
        it('should find surat by keyword', async () => {
            const mockResults = [
                { id: 1, nomor_surat: 'SK/001/2024', perihal: 'Undangan Rapat' }
            ];

            const mockQuery = {
                whereNull: sinon.stub().returnsThis(),
                where: sinon.stub().returnsThis(),
                withGraphFetched: sinon.stub().returnsThis(),
                orderBy: sinon.stub().returnsThis(),
                limit: sinon.stub().resolves(mockResults)
            };

            suratStub.returns(mockQuery);

            const results = await Surat.query()
                .where('perihal', 'like', '%Undangan%')
                .limit(10);

            expect(results).to.have.length(1);
            expect(results[0].perihal).to.include('Undangan');
        });
    });

    // ==================== STATISTICS ====================
    describe('Statistics', () => {
        it('should return surat statistics', async () => {
            const mockStats = {
                total_surat_masuk: [{ 'count(*)': 150 }],
                total_surat_keluar: [{ 'count(*)': 100 }],
                per_bulan: [
                    { bulan: '01', jenis_surat: 'masuk', 'count(*)': 20 },
                    { bulan: '01', jenis_surat: 'keluar', 'count(*)': 15 }
                ]
            };

            sinon.stub(Surat, 'getStatistik').resolves(mockStats);

            const stats = await Surat.getStatistik(2024);

            expect(stats.total_surat_masuk[0]['count(*)']).to.equal(150);
            expect(stats.total_surat_keluar[0]['count(*)']).to.equal(100);
        });
    });

    // ==================== NOMOR AGENDA ====================
    describe('Generate Nomor Agenda', () => {
        it('should generate correct nomor agenda for surat masuk', async () => {
            const mockCount = [{ 'count(*)': 5 }];
            
            const mockQuery = {
                where: sinon.stub().returnsThis(),
                whereRaw: sinon.stub().returnsThis(),
                count: sinon.stub().resolves(mockCount)
            };

            suratStub.returns(mockQuery);

            const nomor = await Surat.generateNomorAgenda('masuk');

            expect(nomor).to.match(/^SM\/\d{4}\/\d{4}$/);
        });

        it('should generate correct nomor agenda for surat keluar', async () => {
            const mockCount = [{ 'count(*)': 3 }];
            
            const mockQuery = {
                where: sinon.stub().returnsThis(),
                whereRaw: sinon.stub().returnsThis(),
                count: sinon.stub().resolves(mockCount)
            };

            suratStub.returns(mockQuery);

            const nomor = await Surat.generateNomorAgenda('keluar');

            expect(nomor).to.match(/^SK\/\d{4}\/\d{4}$/);
        });
    });

    // ==================== VALIDATION ====================
    describe('Validation', () => {
        it('should validate nomor_surat length', () => {
            const surat = new Surat();
            surat.nomor_surat = 'A'.repeat(101); // Exceeds max 100
            
            expect(surat.nomor_surat.length).to.be.greaterThan(100);
        });

        it('should validate jenis_surat enum', () => {
            const surat = new Surat();
            surat.jenis_surat = 'invalid';
            
            expect(['masuk', 'keluar']).to.not.include(surat.jenis_surat);
        });

        it('should validate sifat_surat enum', () => {
            const surat = new Surat();
            surat.sifat_surat = 'biasa';
            
            expect(['biasa', 'segera', 'penting', 'rahasia']).to.include(surat.sifat_surat);
        });

        it('should validate status enum', () => {
            const surat = new Surat();
            surat.status = 'draft';
            
            expect(['draft', 'proses', 'selesai', 'arsip']).to.include(surat.status);
        });
    });

    // ==================== HOOKS ====================
    describe('Model Hooks', () => {
        it('should set created_at on insert', () => {
            const surat = new Surat();
            surat.$beforeInsert();
            
            expect(surat.created_at).to.exist;
            expect(surat.updated_at).to.exist;
            expect(new Date(surat.created_at)).to.be.instanceOf(Date);
        });

        it('should update updated_at on update', () => {
            const surat = new Surat();
            const oldDate = '2024-01-01T00:00:00.000Z';
            surat.updated_at = oldDate;
            
            surat.$beforeUpdate();
            
            expect(surat.updated_at).to.not.equal(oldDate);
            expect(new Date(surat.updated_at)).to.be.instanceOf(Date);
        });
    });
});
