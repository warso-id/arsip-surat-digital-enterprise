/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Database Migration System
 * ============================================================
 */

const DatabaseMigration = (() => {
    'use strict';

    // ==================== MIGRATION CONFIGURATION ====================
    const MIGRATION_CONFIG = {
        versionKey: 'db_version',
        migrations: [
            {
                version: 1,
                name: 'Initial Schema',
                timestamp: '2022-06-01',
                up: async (db) => {
                    console.log('Running migration v1: Initial Schema');
                    
                    // Create users table
                    const usersStore = db.createObjectStore('tbl_users', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    usersStore.createIndex('email', 'email', { unique: true });
                    usersStore.createIndex('role_id', 'role_id');
                    
                    // Create instansi table
                    const instansiStore = db.createObjectStore('tbl_instansi', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    instansiStore.createIndex('kode', 'kode', { unique: true });
                    
                    // Create surat_masuk table
                    const smStore = db.createObjectStore('tbl_surat_masuk', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    smStore.createIndex('no_agenda', 'no_agenda', { unique: true });
                    smStore.createIndex('tanggal_terima', 'tanggal_terima');
                    
                    // Create surat_keluar table
                    const skStore = db.createObjectStore('tbl_surat_keluar', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    skStore.createIndex('no_agenda', 'no_agenda', { unique: true });
                    
                    // Create disposisi table
                    const dispStore = db.createObjectStore('tbl_disposisi', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    dispStore.createIndex('surat_id', 'surat_id');
                },
                down: async (db) => {
                    db.deleteObjectStore('tbl_users');
                    db.deleteObjectStore('tbl_instansi');
                    db.deleteObjectStore('tbl_surat_masuk');
                    db.deleteObjectStore('tbl_surat_keluar');
                    db.deleteObjectStore('tbl_disposisi');
                }
            },
            {
                version: 2,
                name: 'Add Activity Logs & Attachments',
                timestamp: '2023-01-10',
                up: async (db) => {
                    console.log('Running migration v2: Activity Logs & Attachments');
                    
                    // Create activity_logs table
                    const logsStore = db.createObjectStore('tbl_activity_logs', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    logsStore.createIndex('user_id', 'user_id');
                    logsStore.createIndex('timestamp', 'timestamp');
                    
                    // Create attachments table
                    const attachStore = db.createObjectStore('tbl_attachments', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    attachStore.createIndex('surat_id', 'surat_id');
                    
                    // Add status column to users
                    const userStore = db.transaction.objectStore('tbl_users');
                    // Note: In IndexedDB, we can't add columns, we handle this in application code
                },
                down: async (db) => {
                    db.deleteObjectStore('tbl_activity_logs');
                    db.deleteObjectStore('tbl_attachments');
                }
            },
            {
                version: 3,
                name: 'Add Settings & Notifications',
                timestamp: '2024-01-20',
                up: async (db) => {
                    console.log('Running migration v3: Settings & Notifications');
                    
                    // Create settings table
                    const settingsStore = db.createObjectStore('tbl_settings', {
                        keyPath: 'key'
                    });
                    
                    // Create notifications table
                    const notifStore = db.createObjectStore('tbl_notifications', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    notifStore.createIndex('user_id', 'user_id');
                    notifStore.createIndex('read', 'read');
                    
                    // Create pending_sync table
                    const syncStore = db.createObjectStore('tbl_pending_sync', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    syncStore.createIndex('table_name', 'table_name');
                    
                    // Create cache table
                    const cacheStore = db.createObjectStore('tbl_cache', {
                        keyPath: 'key'
                    });
                    
                    // Insert default settings
                    const settingsTransaction = db.transaction('tbl_settings', 'readwrite');
                    const settingsObjStore = settingsTransaction.objectStore('tbl_settings');
                    
                    settingsObjStore.add({ key: 'app_version', value: '3.0.0' });
                    settingsObjStore.add({ key: 'theme', value: 'light' });
                    settingsObjStore.add({ key: 'language', value: 'id' });
                    settingsObjStore.add({ key: 'table_page_size', value: '25' });
                },
                down: async (db) => {
                    db.deleteObjectStore('tbl_settings');
                    db.deleteObjectStore('tbl_notifications');
                    db.deleteObjectStore('tbl_pending_sync');
                    db.deleteObjectStore('tbl_cache');
                }
            }
        ]
    };

    // ==================== MIGRATION RUNNER ====================
    class MigrationRunner {
        constructor() {
            this.currentVersion = 0;
        }

        /**
         * Run all pending migrations
         */
        async run(db) {
            console.log('🔄 Checking database migrations...');
            
            // Get current version
            this.currentVersion = await this.getCurrentVersion();
            console.log(`   Current DB version: ${this.currentVersion}`);
            
            // Find pending migrations
            const pending = MIGRATION_CONFIG.migrations.filter(
                m => m.version > this.currentVersion
            );
            
            if (pending.length === 0) {
                console.log('✅ Database is up to date');
                return;
            }
            
            console.log(`📦 Running ${pending.length} migration(s)...`);
            
            // Run each migration
            for (const migration of pending) {
                try {
                    console.log(`   Running: ${migration.name} (v${migration.version})`);
                    await migration.up(db);
                    await this.setVersion(migration.version);
                    console.log(`   ✅ Migration v${migration.version} completed`);
                } catch (error) {
                    console.error(`   ❌ Migration v${migration.version} failed:`, error);
                    throw error;
                }
            }
            
            console.log('✅ All migrations completed');
        }

        /**
         * Rollback last migration
         */
        async rollback(db) {
            this.currentVersion = await this.getCurrentVersion();
            
            const migration = MIGRATION_CONFIG.migrations.find(
                m => m.version === this.currentVersion
            );
            
            if (!migration) {
                console.log('No migration to rollback');
                return;
            }
            
            console.log(`⏪ Rolling back: ${migration.name} (v${migration.version})`);
            
            try {
                await migration.down(db);
                await this.setVersion(migration.version - 1);
                console.log('✅ Rollback completed');
            } catch (error) {
                console.error('❌ Rollback failed:', error);
                throw error;
            }
        }

        /**
         * Get current database version
         */
        async getCurrentVersion() {
            try {
                const saved = localStorage.getItem(MIGRATION_CONFIG.versionKey);
                return saved ? parseInt(saved) : 0;
            } catch {
                return 0;
            }
        }

        /**
         * Set database version
         */
        async setVersion(version) {
            try {
                localStorage.setItem(MIGRATION_CONFIG.versionKey, version.toString());
                this.currentVersion = version;
            } catch (error) {
                console.warn('Failed to save migration version:', error);
            }
        }

        /**
         * Get migration status
         */
        getStatus() {
            return {
                currentVersion: this.currentVersion,
                totalMigrations: MIGRATION_CONFIG.migrations.length,
                pending: MIGRATION_CONFIG.migrations.filter(
                    m => m.version > this.currentVersion
                ).length,
                migrations: MIGRATION_CONFIG.migrations.map(m => ({
                    version: m.version,
                    name: m.name,
                    timestamp: m.timestamp,
                    applied: m.version <= this.currentVersion
                }))
            };
        }

        /**
         * Seed initial data
         */
        async seed(db) {
            console.log('🌱 Seeding initial data...');
            
            // Create demo users
            const users = [
                {
                    id: 1,
                    nama_lengkap: 'Administrator',
                    email: 'admin@arsipsurat.id',
                    password: 'password123',
                    role_id: 1,
                    instansi_id: 1,
                    status: 'active',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    nama_lengkap: 'Operator',
                    email: 'operator@arsipsurat.id',
                    password: 'operator123',
                    role_id: 2,
                    instansi_id: 1,
                    status: 'active',
                    created_at: new Date().toISOString()
                }
            ];
            
            // Create demo instansi
            const instansi = [
                {
                    id: 1,
                    kode: 'DISKOMINFO',
                    nama: 'Dinas Komunikasi dan Informatika',
                    alamat: 'Jl. Merdeka No. 1',
                    created_at: new Date().toISOString()
                }
            ];
            
            // Insert data
            const tx = db.transaction(['tbl_users', 'tbl_instansi'], 'readwrite');
            
            for (const user of users) {
                tx.objectStore('tbl_users').add(user);
            }
            
            for (const inst of instansi) {
                tx.objectStore('tbl_instansi').add(inst);
            }
            
            console.log('✅ Seed data inserted');
        }
    }

    // ==================== PUBLIC API ====================
    const runner = new MigrationRunner();

    return {
        run: (db) => runner.run(db),
        rollback: (db) => runner.rollback(db),
        seed: (db) => runner.seed(db),
        getStatus: () => runner.getStatus(),
        getVersion: () => runner.currentVersion,
    };
})();

window.DatabaseMigration = DatabaseMigration;
