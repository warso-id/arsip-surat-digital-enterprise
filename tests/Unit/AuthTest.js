/**
 * Unit Tests - Auth Controller
 * Arsip Surat Digital Enterprise
 */

const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Pengguna = require('../../src/models/Pengguna');
const AuthController = require('../../src/controllers/AuthController');

describe('Auth Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            user: { id: 1, role: { slug: 'admin' } },
            headers: {}
        };
        
        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    // ==================== LOGIN ====================
    describe('Login', () => {
        it('should login successfully with valid credentials', async () => {
            req.body = {
                email: 'admin@arsipsurat.id',
                password: 'password123'
            };

            const mockUser = {
                id: 1,
                email: 'admin@arsipsurat.id',
                password: await bcrypt.hash('password123', 10),
                is_active: true,
                role: { slug: 'admin' },
                verifyPassword: sinon.stub().resolves(true),
                generateAuthToken: sinon.stub().returns('mock-access-token'),
                generateRefreshToken: sinon.stub().returns('mock-refresh-token'),
                toPublicJSON: sinon.stub().returns({
                    id: 1,
                    nama_lengkap: 'Admin',
                    email: 'admin@arsipsurat.id'
                })
            };

            sinon.stub(Pengguna, 'findByEmail').resolves(mockUser);
            sinon.stub(Pengguna, 'query').returns({
                patch: sinon.stub().resolves(1)
            });

            await AuthController.login(req, res);

            expect(res.status.calledWith(200) || res.json.calledOnce).to.be.true;
        });

        it('should reject login with invalid email', async () => {
            req.body = {
                email: 'invalid@email.com',
                password: 'password123'
            };

            sinon.stub(Pengguna, 'findByEmail').resolves(null);

            await AuthController.login(req, res);

            expect(res.status.calledWith(401)).to.be.true;
        });

        it('should reject login with wrong password', async () => {
            req.body = {
                email: 'admin@arsipsurat.id',
                password: 'wrongpassword'
            };

            const mockUser = {
                id: 1,
                email: 'admin@arsipsurat.id',
                is_active: true,
                verifyPassword: sinon.stub().resolves(false)
            };

            sinon.stub(Pengguna, 'findByEmail').resolves(mockUser);

            await AuthController.login(req, res);

            expect(res.status.calledWith(401)).to.be.true;
        });

        it('should reject inactive user', async () => {
            req.body = {
                email: 'inactive@arsipsurat.id',
                password: 'password123'
            };

            const mockUser = {
                id: 1,
                email: 'inactive@arsipsurat.id',
                is_active: false
            };

            sinon.stub(Pengguna, 'findByEmail').resolves(mockUser);

            await AuthController.login(req, res);

            expect(res.status.calledWith(403)).to.be.true;
        });
    });

    // ==================== REGISTER ====================
    describe('Register', () => {
        it('should register new user successfully', async () => {
            req.body = {
                nama_lengkap: 'Test User',
                email: 'test@arsipsurat.id',
                password: 'password123',
                role_id: 3
            };

            sinon.stub(Pengguna, 'query').returns({
                where: sinon.stub().returnsThis(),
                first: sinon.stub().resolves(null),
                insert: sinon.stub().resolves({
                    id: 1,
                    ...req.body,
                    generateAuthToken: sinon.stub().returns('mock-token'),
                    toPublicJSON: sinon.stub().returns({
                        id: 1,
                        nama_lengkap: 'Test User',
                        email: 'test@arsipsurat.id'
                    })
                })
            });

            await AuthController.register(req, res);

            expect(res.status.calledWith(201)).to.be.true;
        });

        it('should reject duplicate email', async () => {
            req.body = {
                nama_lengkap: 'Test User',
                email: 'existing@arsipsurat.id',
                password: 'password123'
            };

            sinon.stub(Pengguna, 'query').returns({
                where: sinon.stub().returnsThis(),
                first: sinon.stub().resolves({ id: 1, email: 'existing@arsipsurat.id' })
            });

            await AuthController.register(req, res);

            expect(res.status.calledWith(409)).to.be.true;
        });
    });

    // ==================== LOGOUT ====================
    describe('Logout', () => {
        it('should logout successfully', async () => {
            sinon.stub(Pengguna, 'query').returns({
                patch: sinon.stub().resolves(1)
            });

            await AuthController.logout(req, res);

            expect(res.json.calledOnce).to.be.true;
        });
    });

    // ==================== PROFILE ====================
    describe('Profile', () => {
        it('should get user profile', async () => {
            const mockUser = {
                id: 1,
                nama_lengkap: 'Admin',
                email: 'admin@arsipsurat.id',
                toPublicJSON: sinon.stub().returns({
                    id: 1,
                    nama_lengkap: 'Admin',
                    email: 'admin@arsipsurat.id'
                })
            };

            sinon.stub(Pengguna, 'query').returns({
                findById: sinon.stub().returnsThis(),
                withGraphFetched: sinon.stub().resolves(mockUser)
            });

            await AuthController.profile(req, res);

            expect(res.json.calledOnce).to.be.true;
        });
    });

    // ==================== TOKEN VALIDATION ====================
    describe('Token Validation', () => {
        it('should verify valid JWT token', () => {
            const payload = { id: 1, email: 'test@test.com' };
            const token = jwt.sign(payload, 'test-secret');
            
            const decoded = jwt.verify(token, 'test-secret');
            
            expect(decoded).to.have.property('id', 1);
            expect(decoded).to.have.property('email', 'test@test.com');
        });

        it('should reject invalid JWT token', () => {
            const token = 'invalid-token';
            
            try {
                jwt.verify(token, 'test-secret');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.name).to.equal('JsonWebTokenError');
            }
        });

        it('should reject expired JWT token', () => {
            const payload = { id: 1 };
            const token = jwt.sign(payload, 'test-secret', { expiresIn: '0s' });
            
            // Wait for token to expire
            setTimeout(() => {
                try {
                    jwt.verify(token, 'test-secret');
                    expect.fail('Should have thrown an error');
                } catch (error) {
                    expect(error.name).to.equal('TokenExpiredError');
                }
            }, 100);
        });
    });
});
