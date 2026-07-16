// ==================== JEST CONFIGURATION ====================
// Arsip Surat Digital Enterprise

module.exports = {
    // Test environment
    testEnvironment: 'node',
    
    // Root directory
    rootDir: '.',
    
    // Test files pattern
    testMatch: [
        '**/tests/**/*.test.js',
        '**/tests/**/*.spec.js',
    ],
    
    // Ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/build/',
        '/coverage/',
    ],
    
    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/public/**',
        '!src/views/**',
        '!src/storage/**',
        '!src/database/migrations/**',
        '!src/database/seeders/**',
        '!**/node_modules/**',
    ],
    
    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 60,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },
    
    // Coverage reporters
    coverageReporters: [
        'text',
        'text-summary',
        'lcov',
        'html',
        'json',
    ],
    
    // Setup files
    setupFiles: [],
    setupFilesAfterSetup: [],
    
    // Global variables
    globals: {},
    
    // Module file extensions
    moduleFileExtensions: [
        'js',
        'json',
        'node',
    ],
    
    // Module name mapper (for aliases)
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@config/(.*)$': '<rootDir>/src/config/$1',
        '^@controllers/(.*)$': '<rootDir>/src/app/Http/Controllers/$1',
        '^@models/(.*)$': '<rootDir>/src/app/Models/$1',
        '^@middleware/(.*)$': '<rootDir>/src/app/Http/Middleware/$1',
        '^@services/(.*)$': '<rootDir>/src/app/Services/$1',
        '^@helpers/(.*)$': '<rootDir>/src/app/Helpers/$1',
    },
    
    // Transform configuration
    transform: {},
    
    // Verbose output
    verbose: true,
    
    // Timeout
    testTimeout: 30000,
    
    // Bail configuration
    bail: false,
    
    // Cache
    cache: true,
    cacheDirectory: '.jest-cache',
    
    // Clear mocks between tests
    clearMocks: true,
    
    // Restore mocks between tests
    restoreMocks: true,
    
    // Automatically reset mock state
    resetMocks: false,
    
    // Detect open handles
    detectOpenHandles: true,
    
    // Force exit
    forceExit: true,
    
    // Reporters
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputDirectory: './test-results',
                outputName: 'junit.xml',
            },
        ],
    ],
};
