// Enterprise Database - Fix v2026.7.18
class EnterpriseDB {
    constructor() {
        this.dbName = 'ArsipSuratEnterprise';
        this.dbVersion = 1;
        this.db = null;
        this.stores = {
            surat: 'surat',
            disposisi: 'disposisi',
            laporan: 'laporan',
            settings: 'settings',
            syncQueue: 'syncQueue',
            users: 'users'
        };
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Database open error:', request.error);
                reject(request.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.isInitialized = true;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                console.log('Database upgrade needed');
                const db = event.target.result;

                // Create all required object stores
                if (!db.objectStoreNames.contains(this.stores.surat)) {
                    const suratStore = db.createObjectStore(this.stores.surat, { keyPath: 'id', autoIncrement: true });
                    suratStore.createIndex('type', 'type', { unique: false });
                    suratStore.createIndex('status', 'status', { unique: false });
                    suratStore.createIndex('tanggal', 'tanggal', { unique: false });
                }

                if (!db.objectStoreNames.contains(this.stores.disposisi)) {
                    const disposisiStore = db.createObjectStore(this.stores.disposisi, { keyPath: 'id', autoIncrement: true });
                    disposisiStore.createIndex('suratId', 'suratId', { unique: false });
                }

                if (!db.objectStoreNames.contains(this.stores.laporan)) {
                    db.createObjectStore(this.stores.laporan, { keyPath: 'id', autoIncrement: true });
                }

                if (!db.objectStoreNames.contains(this.stores.settings)) {
                    db.createObjectStore(this.stores.settings, { keyPath: '', autoIncrement: true });
                }

                if (!db.objectStoreNames.contains(this.stores.syncQueue)) {
                    db.createObjectStore(this.stores.syncQueue, { keyPath: 'id', autoIncrement: true });
                }

                if (!db.objectStoreNames.contains(this.stores.users)) {
                    db.createObjectStore(this.stores.users, { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    async getAll(storeName, query = null) {
        if (!this.isInitialized) {
            await this.init();
        }

        // Check if store exists
        const stores = Array.from(this.db.objectStoreNames);
        if (!stores.includes(storeName)) {
            console.warn(`Store ${storeName} not found, returning empty array`);
            return [];
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = query ? store.index(query).getAll() : store.getAll();

                request.onsuccess = () => {
                    resolve(request.result || []);
                };

                request.onerror = () => {
                    console.error(`Error fetching data from ${storeName}`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error(`Transaction error for ${storeName}`, error);
                resolve([]); // Return empty array instead of throwing
            }
        });
    }

    async add(storeName, data) {
        if (!this.isInitialized) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                data.updatedAt = new Date().toISOString();
                
                if (!data.createdAt) {
                    data.createdAt = new Date().toISOString();
                }

                const request = store.add(data);
                request.onsuccess = () => {
                    console.log(`Data added to ${storeName}`);
                    resolve(request.result);
                };
                request.onerror = () => {
                    console.error(`Error adding data to ${storeName}`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error(`Transaction error for ${storeName}`, error);
                reject(error);
            }
        });
    }

    async update(storeName, data) {
        if (!this.isInitialized) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                data.updatedAt = new Date().toISOString();
                
                const request = store.put(data);
                request.onsuccess = () => {
                    console.log(`Data updated in ${storeName}`);
                    resolve(request.result);
                };
                request.onerror = () => {
                    console.error(`Error updating data in ${storeName}`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error(`Transaction error for ${storeName}`, error);
                reject(error);
            }
        });
    }

    async delete(storeName, id) {
        if (!this.isInitialized) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const request = store.delete(id);
                request.onsuccess = () => {
                    console.log(`Data deleted from ${storeName}`);
                    resolve(true);
                };
                request.onerror = () => {
                    console.error(`Error deleting data from ${storeName}`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error(`Transaction error for ${storeName}`, error);
                reject(error);
            }
        });
    }

    async processPendingSync() {
        // Check if syncQueue store exists
        if (!this.isInitialized) {
            await this.init();
        }

        const stores = Array.from(this.db.objectStoreNames);
        if (!stores.includes(this.stores.syncQueue)) {
            console.log('No syncQueue store, skipping sync processing');
            return;
        }

        try {
            const pendingItems = await this.getAll(this.stores.syncQueue);
            if (pendingItems.length === 0) {
                console.log('No pending sync items');
                return;
            }

            console.log(`Processing ${pendingItems.length} pending sync items`);
            
            for (const item of pendingItems) {
                // Process each pending item
                // This would typically sync with a remote server
                console.log(`Syncing item: ${item.id}`, item);
                
                // Remove from sync queue after processing
                await this.delete(this.stores.syncQueue, item.id);
            }
        } catch (error) {
            console.warn('Pending sync processing failed:', error);
        }
    }

    getDb() {
        return this.db;
    }

    isReady() {
        return this.isInitialized;
    }
}

// Expose to window
window.enterpriseDb = new EnterpriseDB();

// Initialize database
!function() {
    try {
        window.enterpriseDb.init().then(() => {
            console.log('['+new Date().toISOString()+'] Database ready');
        }).catch(error => {
            console.warn('Database initialization failed:', error);
        });
    } catch (error) {
        console.warn('Database initialization failed:', error);
    }
}();
