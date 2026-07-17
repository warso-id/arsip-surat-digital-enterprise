// ValidationTest.js - Unit Tests for Validation
const ValidationMiddleware = require('../../src/app/Http/Middleware/ValidationMiddleware');
const ValidationHelper = require('../../src/app/Helpers/ValidationHelper');

describe('ValidationMiddleware', () => {
    let validator;

    beforeEach(() => {
        validator = new ValidationMiddleware();
    });

    test('should validate required field', () => {
        const result = validator.validateRequired('test', 'name');
        expect(result).toBe(true);
        
        const emptyResult = validator.validateRequired('', 'name');
        expect(emptyResult).not.toBe(true);
    });

    test('should validate email field', () => {
        const validEmail = validator.validateEmail('test@example.com', 'email');
        expect(validEmail).toBe(true);
        
        const invalidEmail = validator.validateEmail('not-an-email', 'email');
        expect(invalidEmail).not.toBe(true);
    });

    test('should validate min length', () => {
        const valid = validator.validateMin('12345678', 'password', '8');
        expect(valid).toBe(true);
        
        const invalid = validator.validateMin('123', 'password', '8');
        expect(invalid).not.toBe(true);
    });

    test('should validate max length', () => {
        const valid = validator.validateMax('short', 'field', '100');
        expect(valid).toBe(true);
        
        const invalid = validator.validateMax('a'.repeat(101), 'field', '100');
        expect(invalid).not.toBe(true);
    });

    test('should validate numeric field', () => {
        const valid = validator.validateNumeric('123', 'amount');
        expect(valid).toBe(true);
        
        const invalid = validator.validateNumeric('abc', 'amount');
        expect(invalid).not.toBe(true);
    });

    test('should validate date field', () => {
        const valid = validator.validateDate('2026-01-01', 'tanggal');
        expect(valid).toBe(true);
        
        const invalid = validator.validateDate('not-a-date', 'tanggal');
        expect(invalid).not.toBe(true);
    });

    test('should validate match field', () => {
        const data = { password: 'test123', confirm: 'test123' };
        const valid = validator.validateMatch('test123', 'confirm', 'password', data);
        expect(valid).toBe(true);
        
        const invalid = validator.validateMatch('different', 'confirm', 'password', data);
        expect(invalid).not.toBe(true);
    });

    test('should validate all rules', async () => {
        const data = {
            nama: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            password_confirmation: 'password123'
        };
        
        const rules = {
            nama: 'required|max:200',
            email: 'required|email',
            password: 'required|min:8',
            password_confirmation: 'required|match:password'
        };
        
        const result = await validator.validate(data, rules);
        expect(result.valid).toBe(true);
        expect(Object.keys(result.errors)).toHaveLength(0);
    });

    test('should detect validation errors', async () => {
        const data = {
            nama: '',
            email: 'invalid',
            password: '123',
            password_confirmation: '456'
        };
        
        const rules = {
            nama: 'required',
            email: 'required|email',
            password: 'required|min:8',
            password_confirmation: 'required|match:password'
        };
        
        const result = await validator.validate(data, rules);
        expect(result.valid).toBe(false);
        expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    });
});

describe('ValidationHelper', () => {
    let helper;

    beforeEach(() => {
        helper = new ValidationHelper();
    });

    test('should validate email', () => {
        expect(helper.isValidEmail('test@example.com')).toBe(true);
        expect(helper.isValidEmail('invalid')).toBe(false);
    });

    test('should validate phone', () => {
        expect(helper.isValidPhone('081234567890')).toBe(true);
        expect(helper.isValidPhone('abc')).toBe(false);
    });

    test('should validate URL', () => {
        expect(helper.isValidUrl('https://example.com')).toBe(true);
        expect(helper.isValidUrl('not-a-url')).toBe(false);
    });

    test('should sanitize string', () => {
        const dirty = '<script>alert("xss")</script>Hello';
        const clean = helper.sanitizeString(dirty);
        expect(clean).not.toContain('<script>');
    });

    test('should truncate string', () => {
        const long = 'Hello World This Is A Long String';
        const truncated = helper.truncateString(long, 11);
        expect(truncated.length).toBe(11);
        expect(truncated).toContain('...');
    });

    test('should generate random string', () => {
        const random1 = helper.generateRandomString(10);
        const random2 = helper.generateRandomString(10);
        
        expect(random1.length).toBe(10);
        expect(random1).not.toBe(random2);
    });

    test('should slugify string', () => {
        expect(helper.slugify('Hello World')).toBe('hello-world');
        expect(helper.slugify('Test 123!@#')).toBe('test-123');
    });
});
