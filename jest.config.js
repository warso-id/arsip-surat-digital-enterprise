// jest.config.js - Jest Testing Configuration
module.exports = {
    // Test environment
    testEnvironment: 'jsdom',
    
    // Root directory
    rootDir: '.',
    
    // Test file patterns
    testMatch: [
        '<rootDir>/tests/**/*.test.js',
        '<rootDir>/tests/**/*.spec.js'
    ],
    
    // Ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/build/'
    ],
    
    // Coverage configuration
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/public/js/components/**',
        '!src/database/**',
        '!src/storage/**',
        '!**/node_modules/**'
    ],
    
    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 60,
            functions: 60,
            lines: 60,
            statements: 60
        }
    },
    
    // Module file extensions
    moduleFileExtensions: ['js', 'json', 'jsx'],
    
    // Transform configuration
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    
    // Module name mapper for static files
    moduleNameMapper: {
        '\\.(css|less|scss)$': '<rootDir>/tests/__mocks__/styleMock.js',
        '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/__mocks__/fileMock.js'
    },
    
    // Setup files
    setupFiles: ['<rootDir>/tests/setup.js'],
    setupFilesAfterSetup: ['<rootDir>/tests/setupAfterEnv.js'],
    
    // Global variables
    globals: {
        'btoa': (str) => Buffer.from(str).toString('base64'),
        'atob': (str) => Buffer.from(str, 'base64').toString('utf-8')
    },
    
    // Verbose output
    verbose: true,
    
    // Timeout
    testTimeout: 10000,
    
    // Max workers
    maxWorkers: '50%',
    
    // Clear mocks between tests
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};
