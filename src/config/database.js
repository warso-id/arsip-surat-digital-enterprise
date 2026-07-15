/**
 * DATABASE CONFIGURATION
 * Arsip Surat Digital Enterprise v2.0.0
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = {
    // ==================== DEVELOPMENT ====================
    development: {
        client: 'sqlite3',
        connection: {
            filename: path.join(__dirname, '../database/arsip_surat.sqlite')
        },
        useNullAsDefault: true,
        pool: {
            afterCreate: (conn, cb) => {
                conn.run('PRAGMA foreign_keys = ON', cb);
                conn.run('PRAGMA journal_mode = WAL', cb);
                conn.run('PRAGMA synchronous = NORMAL', cb);
            }
        },
        migrations: {
            directory: path.join(__dirname, '../database/migrations'),
            tableName: 'migrations',
            extension: 'js'
        },
        seeds: {
            directory: path.join(__dirname, '../database/seeders'),
            extension: 'js'
        },
        debug: true
    },

    // ==================== TESTING ====================
    testing: {
        client: 'sqlite3',
        connection: {
            filename: ':memory:'
        },
        useNullAsDefault: true,
        pool: {
            afterCreate: (conn, cb) => {
                conn.run('PRAGMA foreign_keys = ON', cb);
            }
        },
        migrations: {
            directory: path.join(__dirname, '../database/migrations'),
            tableName: 'migrations'
        },
        seeds: {
            directory: path.join(__dirname, '../database/seeders')
        },
        debug: false
    },

    // ==================== STAGING ====================
    staging: {
        client: process.env.DB_CLIENT || 'postgresql',
        connection: {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_DATABASE || 'arsip_surat_staging',
            user: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'secret',
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
        },
        pool: {
            min: 2,
            max: 10,
            acquireTimeoutMillis: 30000,
            idleTimeoutMillis: 30000
        },
        migrations: {
            directory: path.join(__dirname, '../database/migrations'),
            tableName: 'migrations'
        },
        seeds: {
            directory: path.join(__dirname, '../database/seeders')
        },
        debug: false
    },

    // ==================== PRODUCTION ====================
    production: {
        client: process.env.DB_CLIENT || 'postgresql',
        connection: {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_DATABASE,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false
        },
        pool: {
            min: 5,
            max: 20,
            acquireTimeoutMillis: 60000,
            idleTimeoutMillis: 30000,
            reapIntervalMillis: 1000
        },
        migrations: {
            directory: path.join(__dirname, '../database/migrations'),
            tableName: 'migrations'
        },
        debug: false
    }
};

// Get current environment
const environment = process.env.NODE_ENV || 'development';

// Export config for current environment
module.exports = config[environment] || config.development;

// Export all configs for reference
module.exports.all = config;
module.exports.environment = environment;
