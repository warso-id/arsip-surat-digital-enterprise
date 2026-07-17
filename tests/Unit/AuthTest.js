// AuthTest.js - Unit Tests for Authentication
const AuthService = require('../../src/app/Services/AuthService');

describe('AuthService', () => {
    let authService;

    beforeEach(() => {
        authService = new AuthService();
        
        // Mock localStorage
        const localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };
        global.localStorage = localStorageMock;
        
        // Mock fetch
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should create a new instance', () => {
        expect(authService).toBeInstanceOf(AuthService);
    });

    test('should hash password correctly', () => {
        const password = 'test123';
        const hash1 = authService.hashPassword(password);
        const hash2 = authService.hashPassword(password);
        
        expect(hash1).toBe(hash2);
        expect(hash1.length).toBeGreaterThan(0);
    });

    test('should validate email format', () => {
        expect(authService.isValidEmail('test@example.com')).toBe(true);
        expect(authService.isValidEmail('invalid-email')).toBe(false);
        expect(authService.isValidEmail('')).toBe(false);
    });

    test('should validate registration data', () => {
        const validData = {
            nama: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        };
        
        const validResult = authService.validateRegistration(validData);
        expect(validResult.valid).toBe(true);
        
        const invalidData = {
            nama: '',
            email: 'invalid',
            password: '123'
        };
        
        const invalidResult = authService.validateRegistration(invalidData);
        expect(invalidResult.valid).toBe(false);
    });

    test('should generate token', () => {
        const token = authService.generateToken(1);
        expect(token).toBeTruthy();
        expect(token.split('.')).toHaveLength(3);
    });

    test('should set and get token', () => {
        const testToken = 'test-token-123';
        authService.setToken(testToken);
        
        expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', testToken);
    });

    test('should set and get user', () => {
        const testUser = { id: 1, nama: 'Test', email: 'test@example.com' };
        authService.setUser(testUser);
        
        expect(localStorage.setItem).toHaveBeenCalledWith('user_data', JSON.stringify(testUser));
    });

    test('should clear auth data', () => {
        authService.clearAuth();
        
        expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
        expect(localStorage.removeItem).toHaveBeenCalledWith('user_data');
    });

    test('should login successfully', async () => {
        const mockResponse = {
            json: jest.fn().mockResolvedValue({
                data: btoa(encodeURIComponent(JSON.stringify({
                    success: true,
                    token: 'test-token',
                    user: { id: 1, nama: 'Test', email: 'test@example.com' }
                })))
            })
        };
        
        global.fetch = jest.fn().mockResolvedValue(mockResponse);
        
        const result = await authService.login('test@example.com', 'password123');
        expect(result.success).toBe(true);
        expect(result.user).toBeTruthy();
    });

    test('should handle login failure', async () => {
        const mockResponse = {
            json: jest.fn().mockResolvedValue({
                data: btoa(encodeURIComponent(JSON.stringify({
                    success: false,
                    message: 'Invalid credentials'
                })))
            })
        };
        
        global.fetch = jest.fn().mockResolvedValue(mockResponse);
        
        const result = await authService.login('test@example.com', 'wrongpassword');
        expect(result.success).toBe(false);
        expect(result.message).toBeTruthy();
    });
});
