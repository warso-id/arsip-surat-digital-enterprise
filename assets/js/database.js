/* ============================================
   ENTERPRISE DATABASE - IndexedDB with Sync
   ============================================ */
(function() {
    'use strict';

    const DB_NAME = 'ArsipSuratEnterprise';
    const DB_VERSION = 3;

    class EnterpriseDB {
        constructor() {
            this.db = null;
            this.isReady = false;
            this.pendingSync = [];
            this.init();
        }

        async init() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = () => {
                    Logger.error('Database failed to open');
                    reject(request.error);
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    this.isReady = true;
                    Logger.info('Database opened successfully');
                    
                    // Process pending sync
                    this.processPendingSync();
                    resolve(this.db);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    Logger.info('Database upgrade needed');

                    // Surat Masuk Store
                    if (!db.objectStoreNames.contains('surat_masuk')) {
                        const suratMasukStore = db.createObjectStore('surat_masuk', { 
                            keyPath: 'id', 
                            autoIncrement: true 
                        });
                        suratMasukStore.createIndex('nomor_surat', 'nomor_surat', { unique: true });
                        suratMasukStore.createIndex('tanggal', 'tanggal_surat', { unique: false });
                        suratMasukStore.createIndex('status', 'status', { unique: false });
                        suratMasukStore.createIndex('sync_status', 'sync_status', { unique: false });
                    }

                    // Surat Keluar Store
                    if (!db.objectStoreNames.contains('surat_keluar')) {
                        const suratKeluarStore = db.createObjectStore('surat_keluar', { 
                            keyPath: 'id', 
                            autoIncrement: true 
                        });
                        suratKeluarStore.createIndex('nomor_surat', 'nomor_surat', { unique: true });
                        suratKeluarStore.createIndex('tanggal', 'tanggal_surat', { unique: false });
                        suratKeluarStore.createIndex('status', 'status', { unique: false });
                        suratKeluarStore.createIndex('sync_status', 'sync_status', { unique: false });
                    }

                    // Disposisi Store
                    if (!db.objectStoreNames.contains('disposisi')) {
                        const disposisiStore = db.createObjectStore('disposisi', { 
                            keyPath: 'id', 
                            autoIncrement: true 
                        });
                        disposisiStore.createIndex('surat_id', 'surat_id', { unique: false });
                        disposisiStore.createIndex('tujuan', 'tujuan', { unique: false });
                        disposisiStore.createIndex('status', 'status', { unique: false });
                        disposisiStore.createIndex('sync_status', 'sync_status', { unique: false });
                    }

                    // Sync Queue Store
                    if (!db.objectStoreNames.contains('sync_queue')) {
                        db.createObjectStore('sync_queue', { 
                            keyPath: 'id', 
                            autoIncrement: true 
                        });
                    }

                    // User Data Store
                    if (!db.objectStoreNames.contains('user_data')) {
                        db.createObjectStore('user_data', { keyPath: 'key' });
                    }
                };
            });
        }

        // Generic CRUD Operations
        async add(storeName, data) {
            await this.waitForDB();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                // Encode sensitive data before storing
                const encodedData = Base64Util.encodeObject(data, APP_CONFIG.ENCODING.FIELDS);
                encodedData.sync_status = 'pending';
                encodedData.created_at = new Date().toISOString();
                encodedData.updated_at = new Date().toISOString();

                const request = store.add(encodedData);

                request.onsuccess = () => {
                    // Add to sync queue
                    this.addToSyncQueue(storeName, 'create', { ...encodedData, id: request.result });
                    resolve(request.result);
                };

                request.onerror = () => reject(request.error);
            });
        }

        async getAll(storeName) {
            await this.waitForDB();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = () => {
                    const data = request.result.map(item => 
                        Base64Util.decodeObject(item, APP_CONFIG.ENCODING.FIELDS)
                    );
                    resolve(data);
                };

                request.onerror = () => reject(request.error);
            });
        }

        async getById(storeName, id) {
            await this.waitForDB();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(id);

                request.onsuccess = () => {
                    if (request.result) {
                        const decoded = Base64Util.decodeObject(
                            request.result, 
                            APP_CONFIG.ENCODING.FIELDS
                        );
                        resolve(decoded);
                    } else {
                        resolve(null);
                    }
                };

                request.onerror = () => reject(request.error);
            });
        }

        async update(storeName, id, data) {
            await this.waitForDB();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const encodedData = Base64Util.encodeObject(data, APP_CONFIG.ENCODING.FIELDS);
                encodedData.id = id;
                encodedData.sync_status = 'pending';
                encodedData.updated_at = new Date().toISOString();

                const request = store.put(encodedData);

                request.onsuccess = () => {
                    this.addToSyncQueue(storeName, 'update', encodedData);
                    resolve(request.result);
                };

                request.onerror = () => reject(request.error);
            });
        }

        async delete(storeName, id) {
            await this.waitForDB();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(id);

                request.onsuccess = () => {
                    this.addToSyncQueue(storeName, 'delete', { id });
                    resolve(true);
                };

                request.onerror = () => reject(request.error);
            });
        }

        // Sync Queue Management
        async addToSyncQueue(store, action, data) {
            const queueItem = {
                store,
                action,
                data,
                timestamp: new Date().toISOString(),
                retry_count: 0
            };

            const transaction = this.db.transaction(['sync_queue'], 'readwrite');
            const queueStore = transaction.objectStore('sync_queue');
            await queueStore.add(queueItem);
        }

        async processPendingSync() {
            const queueItems = await this.getAll('sync_queue');
            
            for (const item of queueItems) {
                try {
                    await this.syncItem(item);
                    await this.delete('sync_queue', item.id);
                } catch (error) {
                    item.retry_count++;
                    if (item.retry_count >= APP_CONFIG.SYNC.RETRY_ATTEMPTS) {
                        Logger.error('Sync failed permanently', item);
                        await this.delete('sync_queue', item.id);
                    } else {
                        await this.update('sync_queue', item.id, item);
                    }
                }
            }
        }

        async syncItem(item) {
            if (!navigator.onLine) throw new Error('Offline');

            const payload = {
                action: item.action,
                store: item.store,
                data: item.data,
                timestamp: item.timestamp
            };

            const response = await fetch(APP_CONFIG.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Sync failed');
            return await response.json();
        }

        async waitForDB() {
            if (this.isReady) return;
            return new Promise(resolve => {
                const check = setInterval(() => {
                    if (this.isReady) {
                        clearInterval(check);
                        resolve();
                    }
                }, 100);
            });
        }

        // Backup and Restore
        async exportAllData() {
            const data = {
                surat_masuk: await this.getAll('surat_masuk'),
                surat_keluar: await this.getAll('surat_keluar'),
                disposisi: await this.getAll('disposisi'),
                export_date: new Date().toISOString(),
                version: APP_CONFIG.APP_VERSION
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-arsip-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        async importData(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        
                        for (const item of data.surat_masuk) {
                            await this.add('surat_masuk', item);
                        }
                        for (const item of data.surat_keluar) {
                            await this.add('surat_keluar', item);
                        }
                        for (const item of data.disposisi) {
                            await this.add('disposisi', item);
                        }

                        resolve(true);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.readAsArrayBuffer(file);
            });
        }
    }

    // Initialize Global Database
    window.DB = new EnterpriseDB();
    Logger.info('Enterprise Database initialized');
})();
