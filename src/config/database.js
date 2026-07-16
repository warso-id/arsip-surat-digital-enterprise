// ==================== DATABASE CONFIGURATION ====================
// Arsip Surat Digital Enterprise v2.1.0
// Database connection handler with GAS integration

const path = require('path');
const fs = require('fs');
const config = require('./app');

class Database {
    constructor() {
        this.connection = null;
        this.config = config.database;
        this.gasDbEnabled = false;
        this.gasUrlBase64 = 'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J3YmxhdXcyOUN2OHJtcmpRSGhmWGdkbDBjc0JIbHhPM3h2WkppbXlCc1N5QTRGNWY5cUgyNUVqNVFZSXUtLU9HeTZCdwvZXhlYw==';
        this.gasUrl = null;
    }

    async connect() {
        try {
            const connectionType = this.config.connection;
            switch (connectionType) {
                case 'sqlite': this.connection = await this.connectSQLite(); break;
                case 'mysql': this.connection = await this.connectMySQL(); break;
                case 'postgresql': this.connection = await this.connectPostgreSQL(); break;
                default: throw new Error(`Unsupported database: ${connectionType}`);
            }
            console.log(`Database connected: ${connectionType}`);
            
            // Initialize GAS connection
            if (process.env.GAS_CONFIG_BASE64) {
                this.gasUrl = Buffer.from(process.env.GAS_CONFIG_BASE64, 'base64').toString('utf-8');
            } else {
                this.gasUrl = Buffer.from(this.gasUrlBase64, 'base64').toString('utf-8');
            }
            this.gasDbEnabled = !!this.gasUrl;
            
            return this.connection;
        } catch (error) {
            console.error('Database connection failed:', error.message);
            throw error;
        }
    }

    async connectSQLite() {
        const Database = require('better-sqlite3');
        const dbPath = this.config.sqlite.path;
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
        const db = new Database(dbPath, { verbose: config.app.debug ? console.log : null });
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        db.pragma('cache_size = -20000');
        db.pragma('temp_store = MEMORY');
        return db;
    }

    async connectMySQL() {
        const mysql = require('mysql2/promise');
        return await mysql.createPool({
            host: this.config.mysql.host, port: this.config.mysql.port,
            database: this.config.mysql.database,
            user: this.config.mysql.username, password: this.config.mysql.password,
            charset: this.config.mysql.charset,
            waitForConnections: true,
            connectionLimit: this.config.pool.max, queueLimit: 0,
        });
    }

    async connectPostgreSQL() {
        const { Pool } = require('pg');
        return new Pool({
            host: this.config.postgresql.host, port: this.config.postgresql.port,
            database: this.config.postgresql.database,
            user: this.config.postgresql.username, password: this.config.postgresql.password,
            max: this.config.pool.max, idleTimeoutMillis: this.config.pool.idle,
        });
    }

    getConnection() {
        if (!this.connection) throw new Error('Database not connected');
        return this.connection;
    }

    async run(sql, params = []) {
        const db = this.getConnection();
        if (this.config.connection === 'sqlite') {
            const stmt = db.prepare(sql);
            return stmt.run(...params);
        } else {
            const [result] = await db.execute(sql, params);
            return result;
        }
    }

    async get(sql, params = []) {
        const db = this.getConnection();
        if (this.config.connection === 'sqlite') {
            return db.prepare(sql).get(...params);
        } else {
            const [rows] = await db.execute(sql, params);
            return rows[0] || null;
        }
    }

    async all(sql, params = []) {
        const db = this.getConnection();
        if (this.config.connection === 'sqlite') {
            return db.prepare(sql).all(...params);
        } else {
            const [rows] = await db.execute(sql, params);
            return rows;
        }
    }

    async transaction(callback) {
        const db = this.getConnection();
        if (this.config.connection === 'sqlite') {
            const transaction = db.transaction(callback);
            return transaction();
        } else {
            const connection = await db.getConnection();
            try {
                await connection.beginTransaction();
                const result = await callback(connection);
                await connection.commit();
                return result;
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally { connection.release(); }
        }
    }

    async close() {
        if (this.connection) {
            if (this.config.connection === 'sqlite') this.connection.close();
            else await this.connection.end();
            console.log('Database connection closed');
        }
    }

    getGasUrl() { return this.gasUrl; }
    isGasEnabled() { return this.gasDbEnabled; }
}

const db = new Database();

if (process.env.NODE_ENV !== 'test') {
    db.connect().catch(err => console.error('Failed to connect to database:', err.message));
}

module.exports = db;
