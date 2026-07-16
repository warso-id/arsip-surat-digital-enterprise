/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * IndexedDB Database Manager
 * ============================================================
 * Full offline database support with sync capabilities
 * ============================================================
 */

const EnterpriseDB = (() => {
    'use strict';

    // ==================== CONFIGURATION ====================
    const DB_CONFIG = {
        name: 'ArsipSuratEnterprise',
        version: 3,
        tables: {
            users: {
                name: 'tbl_users',
                keyPath: 'id',
                autoIncrement: true,
                indexes: [
                    { name: 'email', keyPath: 'email', unique: true },
                    { name: 'role_id', keyPath: 'role_id' },
                    { name: 'instansi_id', keyPath: 'instansi_id' },
                    { name: 'status', keyPath: 'status' },
                ]
            },
            instansi: {
                name: 'tbl_instansi',
                keyPath: 'id',
                autoIncrement: true,
                indexes: [
                    { name: 'kode', keyPath: 'kode', unique: true },
                    { name: 'nama', keyPath: 'nama' },
                ]
            },
            roles: {
                name: 'tbl_roles',
                keyPath: 'id',
                autoIncrement: true,
                indexes: [
                    { name: 'slug', keyPath: 'slug', unique: true },
                ]
            },
            permissions: {
                name: 'tbl_permissions',
                keyPath: 'id',
                autoIncrement: true,
                indexes: [
                    { name: 'role_id', keyPath: 'role_id' },
                ]
            },
            suratMasuk: {
                name: 'tbl_surat_masuk',
                keyPath: 'id',
                autoIncrement: true,
                indexes: [
                    { name: 'no_agenda', keyPath: 'no_agenda', unique: true },
                    { name: 'tanggal_terima', keyPath: 'tanggal_terima' },
                    { name: 'tanggal_surat', keyPath: 'tanggal_surat' },
                    { name: 'status', keyPath: 'status' },
                    { name: 'pengirim', keyPath: 'pengirim' },
                    { name: 'instansi_id', keyPath: 'instansi_id' },
                ]
            },
            suratKeluar: {
                name: 'tbl_surat_keluar',
                keyPath: 'id',
                autoIncrement: true,
                indexes: [
                    { name: 'no_agenda', keyPath: 'no_agenda', unique: true },
                    { name: 'tanggal_surat', keyPath: 'tanggal_surat' },
                    { name: 'status', keyPath: 'status' },
                    { name: 'tujuan', keyPath: 'tujuan' },
                ]
            },
            disposisi: {
                name: 'tbl_disposisi',
                keyPath: 'id',
                autoIncrement: true,
                indexes: [
                    { name: 'surat_id', keyPath: 'surat_id' },
                    { name: 'dari_user_id', keyPath: 'dari_user_id' },
                    { name: 'kepada_user_id', keyPath: 'kepada_user_id' },
                    { name: 'status', keyPath: 'status' },
                    { name: 'batas_waktu', keyPath: 'batas_waktu' },
                ]
            },
            attachments: {
                name: 'tbl_attachments',
                keyPath: 'id',
                autoIncrement: true,
                indexes: [
                    { name: 'surat_id', keyPath: 'surat_id' },
                    { name: 'type', keyPath: 'type' },
                ]
            },
            activityLogs: {
                name: 'tbl_activity_logs',
                keyPath: 'id',
                autoIncrement: true,
                indexes: [
                    { name: 'user_id', keyPath: 'user_id' },
                    { name: 'timestamp', keyPath: 'timestamp' },
                    { name: 'action', keyPath: 'action' },
                ]
            },
            settings: {
                name: 'tbl_settings',
                keyPath: 'key',
                autoIncrement: false,
                indexes: []
            },
            notifications: {
                name: 'tbl_notifications',
                keyPath: 'id',
                autoIncrement: true,
                indexes: [
                    { name: 'user_id', keyPath: 'user_id' },
                    { name: 'read', keyPath: 'read' },
                    { name: 'timestamp', keyPath: 'timestamp' },
                ]
            },
            pendingSync: {
                name: 'tbl_pending_sync',
                keyPath: 'id',
                autoIncrement: true,
                indexes: [
                    { name: 'table_name', keyPath: 'table_name' },
                    { name: 'action', keyPath: 'action' },
                ]
            }
        }
    };

    // ==================== DATABASE CLASS ====================
    class Database {
        constructor() {
            this.db = null;
            this.isReady = false;
            this.readyPromise = null;
        }

        /**
         * Initialize database
         */
        async init() {
            if (this.isReady) return this.db;
            
            if (this.readyPromise) return this.readyPromise;
            
            this.readyPromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);
                
                request.onerror = (event) => {
                    console.error('Database initialization failed:', event.target.error);
                    reject(event.target.error);
                };
                
                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    this.isReady = true;
                    console.log('✅ IndexedDB initialized successfully');
                    
                    // Handle database errors
                    this.db.onerror = (event) => {
                        console.error('Database error:', event.target.error);
                    };
                    
                    // Handle version changes
                    this.db.onversionchange = () => {
                        this.db.close();
                        console.warn('Database version changed, please reload the page.');
                    };
                    
                    resolve(this.db);
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    console.log('📦 Upgrading database...');
                    this.createTables(db);
                };
            });
            
            return this.readyPromise;
        }

        /**
         * Create all tables
         */
        createTables(db) {
            Object.values(DB_CONFIG.tables).forEach(table => {
                if (!db.objectStoreNames.contains(table.name)) {
                    const store = db.createObjectStore(table.name, {
                        keyPath: table.keyPath,
                        autoIncrement: table.autoIncrement
                    });
                    
                    // Create indexes
                    table.indexes.forEach(index => {
                        store.createIndex(index.name, index.keyPath, {
                            unique: index.unique || false
                        });
                    });
                    
                    console.log(`  ✓ Created table: ${table.name}`);
                }
            });
        }

        /**
         * Get object store
         */
        async getStore(tableName, mode = 'readonly') {
            await this.init();
            const transaction = this.db.transaction([tableName], mode);
            return transaction.objectStore(tableName);
        }

        /**
         * Add record
         */
        async add(tableName, data) {
            const store = await this.getStore(tableName, 'readwrite');
            
            return new Promise((resolve, reject) => {
                // Add timestamps
                data.created_at = data.created_at || new Date().toISOString();
                data.updated_at = new Date().toISOString();
                
                const request = store.add(data);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * Get record by ID
         */
        async get(tableName, id) {
            const store = await this.getStore(tableName);
            
            return new Promise((resolve, reject) => {
                const request = store.get(id);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * Get all records
         */
        async getAll(tableName, indexName = null, value = null) {
            const store = await this.getStore(tableName);
            
            return new Promise((resolve, reject) => {
                let request;
                
                if (indexName && value !== null) {
                    const index = store.index(indexName);
                    request = index.getAll(value);
                } else if (indexName) {
                    const index = store.index(indexName);
                    request = index.getAll();
                } else {
                    request = store.getAll();
                }
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * Get records with pagination
         */
        async getPaginated(tableName, page = 1, limit = 25, indexName = null, value = null) {
            const allData = await this.getAll(tableName, indexName, value);
            const total = allData.length;
            const offset = (page - 1) * limit;
            const data = allData.slice(offset, offset + limit);
            
            return {
                data,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        }

        /**
         * Update record
         */
        async update(tableName, id, data) {
            const store = await this.getStore(tableName, 'readwrite');
            
            return new Promise((resolve, reject) => {
                const getRequest = store.get(id);
                
                getRequest.onsuccess = () => {
                    const existing = getRequest.result;
                    if (!existing) {
                        reject(new Error(`Record with id ${id} not found in ${tableName}`));
                        return;
                    }
                    
                    const updated = {
                        ...existing,
                        ...data,
                        id: id,
                        updated_at: new Date().toISOString()
                    };
                    
                    const putRequest = store.put(updated);
                    putRequest.onsuccess = () => resolve(putRequest.result);
                    putRequest.onerror = () => reject(putRequest.error);
                };
                
                getRequest.onerror = () => reject(getRequest.error);
            });
        }

        /**
         * Delete record
         */
        async delete(tableName, id) {
            const store = await this.getStore(tableName, 'readwrite');
            
            return new Promise((resolve, reject) => {
                const request = store.delete(id);
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * Delete all records in table
         */
        async clear(tableName) {
            const store = await this.getStore(tableName, 'readwrite');
            
            return new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * Count records
         */
        async count(tableName, indexName = null, value = null) {
            const store = await this.getStore(tableName);
            
            return new Promise((resolve, reject) => {
                let request;
                
                if (indexName && value !== null) {
                    const index = store.index(indexName);
                    request = index.count(value);
                } else {
                    request = store.count();
                }
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * Search records
         */
        async search(tableName, field, query, limit = 50) {
            const allData = await this.getAll(tableName);
            
            const results = allData.filter(item => {
                const value = item[field];
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(query.toLowerCase());
                }
                if (typeof value === 'number') {
                    return value.toString().includes(query);
                }
                return false;
            });
            
            return results.slice(0, limit);
        }

        /**
         * Bulk add records
         */
        async bulkAdd(tableName, records) {
            const store = await this.getStore(tableName, 'readwrite');
            
            const promises = records.map(record => {
                return new Promise((resolve, reject) => {
                    record.created_at = record.created_at || new Date().toISOString();
                    record.updated_at = new Date().toISOString();
                    
                    const request = store.add(record);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            });
            
            return Promise.all(promises);
        }

        /**
         * Bulk update records
         */
        async bulkUpdate(tableName, records) {
            const store = await this.getStore(tableName, 'readwrite');
            
            const promises = records.map(record => {
                return new Promise((resolve, reject) => {
                    record.updated_at = new Date().toISOString();
                    const request = store.put(record);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            });
            
            return Promise.all(promises);
        }

        /**
         * Export table data
         */
        async exportTable(tableName) {
            const data = await this.getAll(tableName);
            return {
                table: tableName,
                exportedAt: new Date().toISOString(),
                count: data.length,
                data: data
            };
        }

        /**
         * Import data to table
         */
        async importTable(tableName, data) {
            await this.clear(tableName);
            return this.bulkAdd(tableName, data);
        }

        /**
         * Get database size
         */
        async getSize() {
            if (!navigator.storage || !navigator.storage.estimate) {
                return null;
            }
            
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage,
                quota: estimate.quota,
                usagePercent: ((estimate.usage / estimate.quota) * 100).toFixed(2)
            };
        }

        /**
         * Close database
         */
        close() {
            if (this.db) {
                this.db.close();
                this.db = null;
                this.isReady = false;
                this.readyPromise = null;
            }
        }

        /**
         * Delete database
         */
        async deleteDatabase() {
            this.close();
            
            return new Promise((resolve, reject) => {
                const request = indexedDB.deleteDatabase(DB_CONFIG.name);
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        }
    }

    // ==================== SYNC MANAGER ====================
    class SyncManager {
        constructor(db) {
            this.db = db;
            this.syncInProgress = false;
        }

        /**
         * Add to pending sync
         */
        async addPendingSync(tableName, action, recordId, data = null) {
            return this.db.add(DB_CONFIG.tables.pendingSync.name, {
                table_name: tableName,
                action: action,
                record_id: recordId,
                data: data ? JSON.stringify(data) : null,
                timestamp: new Date().toISOString()
            });
        }

        /**
         * Get pending sync items
         */
        async getPendingSync() {
            return this.db.getAll(DB_CONFIG.tables.pendingSync.name);
        }

        /**
         * Sync with server
         */
        async syncWithServer() {
            if (this.syncInProgress || !navigator.onLine) {
                return { success: false, message: 'Sync not available' };
            }

            this.syncInProgress = true;
            
            try {
                const pendingItems = await this.getPendingSync();
                
                if (pendingItems.length === 0) {
                    return { success: true, message: 'No pending items to sync', count: 0 };
                }

                // Encode pending items to Base64
                const encodedData = window.EnterpriseBase64 
                    ? window.EnterpriseBase64.encodeObject(pendingItems)
                    : btoa(JSON.stringify(pendingItems));

                // Send to Google Apps Script
                const response = await window.GASAPI.call('sync/batch', {
                    items: encodedData,
                    action: 'sync/batch'
                });

                if (response && response.success) {
                    // Clear synced items
                    await this.db.clear(DB_CONFIG.tables.pendingSync.name);
                    return { success: true, message: 'Sync completed', count: pendingItems.length };
                }

                return { success: false, message: 'Sync failed', count: 0 };
            } catch (error) {
                console.error('Sync error:', error);
                return { success: false, message: error.message, count: 0 };
            } finally {
                this.syncInProgress = false;
            }
        }

        /**
         * Auto sync
         */
        startAutoSync(intervalMs = 60000) {
            return setInterval(() => {
                this.syncWithServer();
            }, intervalMs);
        }
    }

    // ==================== INITIALIZE ====================
    const database = new Database();
    const syncManager = new SyncManager(database);

    // ==================== PUBLIC API ====================
    return {
        // Database initialization
        init: () => database.init(),
        isReady: () => database.isReady,
        
        // CRUD Operations
        add: (table, data) => database.add(table, data),
        get: (table, id) => database.get(table, id),
        getAll: (table, index, value) => database.getAll(table, index, value),
        getPaginated: (table, page, limit, index, value) => database.getPaginated(table, page, limit, index, value),
        update: (table, id, data) => database.update(table, id, data),
        delete: (table, id) => database.delete(table, id),
        clear: (table) => database.clear(table),
        count: (table, index, value) => database.count(table, index, value),
        search: (table, field, query, limit) => database.search(table, field, query, limit),
        
        // Bulk Operations
        bulkAdd: (table, records) => database.bulkAdd(table, records),
        bulkUpdate: (table, records) => database.bulkUpdate(table, records),
        
        // Import/Export
        exportTable: (table) => database.exportTable(table),
        importTable: (table, data) => database.importTable(table, data),
        
        // Database Management
        getSize: () => database.getSize(),
        close: () => database.close(),
        deleteDatabase: () => database.deleteDatabase(),
        
        // Sync
        sync: syncManager,
        
        // Table names
        tables: Object.fromEntries(
            Object.entries(DB_CONFIG.tables).map(([key, value]) => [key, value.name])
        ),
    };
})();

// Export globally
window.EnterpriseDB = EnterpriseDB;
