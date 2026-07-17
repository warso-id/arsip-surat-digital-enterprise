/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Jest Test Configuration
 * ============================================================
 */

module.exports = {
    // Test environment
    testEnvironment: 'jsdom',
    
    // Root directory
    rootDir: '.',
    
    // Test file patterns
    testMatch: [
        '**/tests/unit/**/*.test.js',
        '**/tests/integration/**/*.test.js',
    ],
    
    // Ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/build/',
        '/backups/',
        '/coverage/',
    ],
    
    // Setup files
    setupFiles: [
        '<rootDir>/tests/setup.js',
    ],
    
    setupFilesAfterSetup: [
        '<rootDir>/tests/setupAfterEnv.js',
    ],
    
    // Coverage configuration
    collectCoverage: true,
    collectCoverageFrom: [
        'src/public/js/**/*.js',
        '!src/public/js/dev-tools.js',
        '!src/public/js/analytics.js',
        '!**/node_modules/**',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json'],
    coverageThreshold: {
        global: {
            branches: 60,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },
    
    // Module name mapping
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@js/(.*)$': '<rootDir>/src/public/js/$1',
        '^@css/(.*)$': '<rootDir>/src/public/css/$1',
        '\\.css$': '<rootDir>/tests/mocks/styleMock.js',
        '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/tests/mocks/fileMock.js',
    },
    
    // Transform
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(chart\\.js)/)',
    ],
    
    // Globals
    globals: {
        ENTERPRISE_CONFIG: {
            version: '3.0.0',
            gas: {
                url: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
                encoding: 'base64',
            },
        },
    },
    
    // Max workers
    maxWorkers: '50%',
    
    // Verbose output
    verbose: true,
    
    // Timeout
    testTimeout: 10000,
    
    // Clear mocks
    clearMocks: true,
    restoreMocks: true,
    
    // Reporters
    reporters: [
        'default',
        ['jest-junit', {
            outputDirectory: 'coverage/junit',
            outputName: 'junit.xml',
        }],
    ],
};
