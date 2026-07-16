// ==================== AUTHENTICATION FEATURE TEST ====================
// Arsip Surat Digital Enterprise

const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/app');
const db = require('../../src/config/database');

describe('Authentication Feature Tests', () => {
    before(async () => {
        // Setup test database
        await db.run('DELETE FROM pengguna WHERE username = ?', ['testuser']);
    });

    after(async () => {
        // Cleanup
        await db.run('DELETE FROM pengguna WHERE username = ?', ['testuser']);
    });

    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    username: 'testuser',
                    email: 'testuser@test.com',
                    password: 'TestPass123!',
                    fullname: 'Test User',
                });

            expect(res.status).to.equal(201);
            expect(res.body.success).to.be.true;
            expect(res.body.message).to.include('berhasil');
        });

        it('should reject duplicate username', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    username: 'testuser',
                    email: 'another@test.com',
                    password: 'TestPass123!',
                    fullname: 'Another User',
                });

            expect(res.status).to.equal(400);
            expect(res.body.success).to.be.false;
        });

        it('should reject weak password', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    username: 'weakuser',
                    email: 'weak@test.com',
                    password: '123',
                    fullname: 'Weak User',
                });

            expect(res.status).to.equal(422);
        });

        it('should reject invalid email', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    username: 'invalidemail',
                    email: 'not-an-email',
                    password: 'TestPass123!',
                    fullname: 'Invalid Email',
                });

            expect(res.status).to.equal(422);
        });

        it('should reject missing required fields', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    username: 'missingfields',
                });

            expect(res.status).to.equal(422);
        });
    });

    describe('POST /auth/login', () => {
        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'TestPass123!',
                });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body).to.have.property('token');
            expect(res.body.user).to.have.property('username', 'testuser');
        });

        it('should reject invalid password', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'WrongPassword',
                });

            expect(res.status).to.equal(401);
            expect(res.body.success).to.be.false;
        });

        it('should reject non-existent user', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    username: 'nonexistent',
                    password: 'TestPass123!',
                });

            expect(res.status).to.equal(401);
        });

        it('should return token on successful login', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'TestPass123!',
                });

            expect(res.body.token).to.be.a('string');
            expect(res.body.token.split('.')).to.have.lengthOf(3); // JWT format
        });
    });

    describe('GET /auth/verify', () => {
        let token;

        before(async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'TestPass123!',
                });
            token = res.body.token;
        });

        it('should verify valid token', async () => {
            const res = await request(app)
                .get('/auth/verify')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
        });

        it('should reject request without token', async () => {
            const res = await request(app)
                .get('/auth/verify');

            expect(res.status).to.equal(401);
        });

        it('should reject invalid token', async () => {
            const res = await request(app)
                .get('/auth/verify')
                .set('Authorization', 'Bearer invalid-token');

            expect(res.status).to.equal(401);
        });

        it('should reject expired token', async () => {
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjM5MDIyfQ.fake';
            
            const res = await request(app)
                .get('/auth/verify')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(res.status).to.equal(401);
        });
    });
});
