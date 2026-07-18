const AuthService = require('../../src/app/Services/AuthService');
const Pengguna = require('../../src/app/Models/Pengguna');
const { sequelize } = require('../../src/config/database');

describe('AuthService', () => {
    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                nama_lengkap: 'Test User',
                email: 'test@example.com',
                password: 'TestPass123!',
                role_id: 1
            };

            const user = await AuthService.register(userData);
            
            expect(user).toBeDefined();
            expect(user.email).toBe(userData.email);
            expect(user.nama_lengkap).toBe(userData.nama_lengkap);
            expect(user.password).toBeUndefined(); // Password should not be returned
        });

        it('should reject duplicate email', async () => {
            const userData = {
                nama_lengkap: 'Test User 2',
                email: 'test@example.com',
                password: 'TestPass123!',
                role_id: 1
            };

            await expect(AuthService.register(userData)).rejects.toThrow('Email sudah terdaftar');
        });
    });

    describe('login', () => {
        it('should login successfully with valid credentials', async () => {
            const result = await AuthService.login(
                'test@example.com',
                'TestPass123!',
                '127.0.0.1',
                'test-agent'
            );

            expect(result).toBeDefined();
            expect(result.user).toBeDefined();
            expect(result.token).toBeDefined();
        });

        it('should reject invalid password', async () => {
            await expect(
                AuthService.login('test@example.com', 'wrongpassword', '127.0.0.1', 'test-agent')
            ).rejects.toThrow('Email atau password salah');
        });
    });

    describe('changePassword', () => {
        it('should change password successfully', async () => {
            const user = await Pengguna.findOne({ where: { email: 'test@example.com' } });
            
            await AuthService.changePassword(
                user.id,
                'TestPass123!',
                'NewPass456!'
            );

            // Verify new password works
            const result = await AuthService.login(
                'test@example.com',
                'NewPass456!',
                '127.0.0.1',
                'test-agent'
            );

            expect(result).toBeDefined();
            expect(result.token).toBeDefined();
        });
    });
});
