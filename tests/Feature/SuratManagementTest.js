// ==================== SURAT MANAGEMENT FEATURE TEST ====================
// Arsip Surat Digital Enterprise

const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/app');

let authToken;
let createdSuratId;

describe('Surat Management Feature Tests', () => {
    before(async () => {
        // Login to get token
        const res = await request(app)
            .post('/auth/login')
            .send({
                username: 'admin',
                password: 'admin123',
            });
        authToken = res.body.token;
    });

    describe('GET /api/surat-masuk', () => {
        it('should return paginated list', async () => {
            const res = await request(app)
                .get('/api/surat-masuk')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body).to.have.property('data');
            expect(res.body).to.have.property('pagination');
            expect(res.body.pagination).to.have.property('total');
            expect(res.body.pagination).to.have.property('page');
        });

        it('should filter by status', async () => {
            const res = await request(app)
                .get('/api/surat-masuk?status=baru')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(200);
            res.body.data.forEach(surat => {
                expect(surat.status).to.equal('baru');
            });
        });

        it('should search by keyword', async () => {
            const res = await request(app)
                .get('/api/surat-masuk?search=rapat')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(200);
        });

        it('should reject unauthenticated request', async () => {
            const res = await request(app)
                .get('/api/surat-masuk');

            expect(res.status).to.equal(401);
        });
    });

    describe('POST /api/surat-masuk', () => {
        it('should create new surat masuk', async () => {
            const res = await request(app)
                .post('/api/surat-masuk')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    nomor_surat: 'TEST-001',
                    tanggal_surat: '2024-01-17',
                    tanggal_terima: '2024-01-17',
                    pengirim: 'Test Pengirim',
                    perihal: 'Test Perihal Surat',
                    ringkasan: 'Ini adalah surat test',
                    kategori: 'biasa',
                    sifat_surat: 'biasa',
                    prioritas: 'sedang',
                });

            expect(res.status).to.equal(201);
            expect(res.body.success).to.be.true;
            expect(res.body.data).to.have.property('id');
            expect(res.body.data).to.have.property('nomor_agenda');
            
            createdSuratId = res.body.data.id;
        });

        it('should reject missing required fields', async () => {
            const res = await request(app)
                .post('/api/surat-masuk')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    perihal: 'Missing Fields',
                });

            expect(res.status).to.equal(422);
        });

        it('should auto-generate nomor agenda', async () => {
            const res = await request(app)
                .post('/api/surat-masuk')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    nomor_surat: 'TEST-002',
                    tanggal_surat: '2024-01-17',
                    tanggal_terima: '2024-01-17',
                    pengirim: 'Test Pengirim 2',
                    perihal: 'Test Agenda Auto',
                });

            expect(res.body.data.nomor_agenda).to.match(/^SM-\d{4}-\d{4}$/);
        });
    });

    describe('GET /api/surat-masuk/:id', () => {
        it('should return surat detail', async () => {
            const res = await request(app)
                .get(`/api/surat-masuk/${createdSuratId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(200);
            expect(res.body.data.surat).to.have.property('nomor_agenda');
            expect(res.body.data).to.have.property('lampiran');
            expect(res.body.data).to.have.property('disposisi');
        });

        it('should return 404 for non-existent surat', async () => {
            const res = await request(app)
                .get('/api/surat-masuk/99999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(404);
        });
    });

    describe('PUT /api/surat-masuk/:id', () => {
        it('should update surat masuk', async () => {
            const res = await request(app)
                .put(`/api/surat-masuk/${createdSuratId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    perihal: 'Updated Perihal',
                    status: 'proses',
                });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
        });

        it('should reject update from unauthorized user', async () => {
            // Login as different role
            const loginRes = await request(app)
                .post('/auth/login')
                .send({
                    username: 'viewer',
                    password: 'password123',
                });
            
            const res = await request(app)
                .put(`/api/surat-masuk/${createdSuratId}`)
                .set('Authorization', `Bearer ${loginRes.body.token}`)
                .send({
                    perihal: 'Unauthorized Update',
                });

            expect(res.status).to.equal(403);
        });
    });

    describe('DELETE /api/surat-masuk/:id', () => {
        it('should delete surat masuk', async () => {
            const res = await request(app)
                .delete(`/api/surat-masuk/${createdSuratId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
        });

        it('should return 404 for already deleted surat', async () => {
            const res = await request(app)
                .delete(`/api/surat-masuk/${createdSuratId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(404);
        });
    });
});
