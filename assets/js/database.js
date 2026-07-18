// Enterprise Database - Fix v2026.7.18
class EnterpriseDB {
    constructor() {
        this.dbName = 'ArsipSuratEnterprise';
        this.dbVersion = 3; // Updated to match existing version
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
        this.sheetsApiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
    }

    async init() {
        if (this.isInitialized) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Database open error:', request.error);
                // Try to delete and recreate if version mismatch
                if (request.error.name === 'VersionError') {
                    this.deleteAndRecreate().then(() => {
                        resolve(this.db);
                    }).catch(reject);
                } else {
                    reject(request.error);
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.isInitialized = true;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                console.log('Database upgrade needed from version', event.oldVersion, 'to', event.newVersion);
                const db = event.target.result;

                // Version 1 upgrades
                if (event.oldVersion < 1) {
                    if (!db.objectStoreNames.contains(this.stores.surat)) {
                        const suratStore = db.createObjectStore(this.stores.surat, { keyPath: 'id', autoIncrement: true });
                        suratStore.createIndex('type', 'type', { unique: false });
                        suratStore.createIndex('status', 'status', { unique: false });
                        suratStore.createIndex('tanggal', 'tanggal', { unique: false });
                    }
                }

                // Version 2 upgrades
                if (event.oldVersion < 2) {
                    if (!db.objectStoreNames.contains(this.stores.disposisi)) {
                        const disposisiStore = db.createObjectStore(this.stores.disposisi, { keyPath: 'id', autoIncrement: true });
                        disposisiStore.createIndex('suratId', 'suratId', { unique: false });
                    }
                    
                    if (!db.objectStoreNames.contains(this.stores.laporan)) {
                        db.createObjectStore(this.stores.laporan, { keyPath: 'id', autoIncrement: true });
                    }
                }

                // Version 3 upgrades
                if (event.oldVersion < 3) {
                    if (!db.objectStoreNames.contains(this.stores.settings)) {
                        db.createObjectStore(this.stores.settings, { keyPath: 'id', autoIncrement: true });
                    }

                    if (!db.objectStoreNames.contains(this.stores.syncQueue)) {
                        const syncStore = db.createObjectStore(this.stores.syncQueue, { keyPath: 'id', autoIncrement: true });
                        syncStore.createIndex('status', 'status', { unique: false });
                    }

                    if (!db.objectStoreNames.contains(this.stores.users)) {
                        const userStore = db.createObjectStore(this.stores.users, { keyPath: 'id', autoIncrement: true });
                        userStore.createIndex('email', 'email', { unique: true });
                    }
                }
            };
        });
    }

    async deleteAndRecreate() {
        return new Promise((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase(this.dbName);
            
            deleteRequest.onsuccess = () => {
                console.log('Old database deleted, recreating...');
                this.db = null;
                this.isInitialized = false;
                this.init().then(resolve).catch(reject);
            };
            
            deleteRequest.onerror = () => {
                reject(deleteRequest.error);
            };
        });
    }

    async getAll(storeName, query = null) {
        if (!this.isInitialized) {
            await this.init();
        }

        if (!this.db) {
            console.warn('Database not available');
            return [];
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
                resolve([]);
            }
        });
    }

    async add(storeName, data) {
        if (!this.isInitialized) {
            await this.init();
        }

        if (!this.db) {
            throw new Error('Database not available');
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

        if (!this.db) {
            throw new Error('Database not available');
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

        if (!this.db) {
            throw new Error('Database not available');
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

    // Google Sheets Integration
    async syncWithSheets() {
        try {
            console.log('Starting Google Sheets sync...');
            const response = await fetch(this.sheetsApiUrl);
            const data = await response.json();
            
            if (data.status === 'success' && data.data) {
                // Process surat data from sheets
                if (data.data.surat) {
                    for (const surat of data.data.surat) {
                        await this.add('surat', surat);
                    }
                }
                
                // Process disposisi data
                if (data.data.disposisi) {
                    for (const disposisi of data.data.disposisi) {
                        await this.add('disposisi', disposisi);
                    }
                }
                
                console.log('Google Sheets sync completed');
                return true;
            }
        } catch (error) {
            console.error('Google Sheets sync failed:', error);
            return false;
        }
    }

    async getSheetsData() {
        try {
            const response = await fetch(this.sheetsApiUrl);
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch sheets data:', error);
            return null;
        }
    }

    async processPendingSync() {
        if (!this.isInitialized) {
            await this.init();
        }

        if (!this.db) {
            console.warn('Database not available for sync');
            return;
        }

        const stores = Array.from(this.db.objectStoreNames);
        if (!stores.includes(this.stores.syncQueue)) {
            console.log('No syncQueue store, skipping sync processing');
            return;
        }

        try {
            // First sync with Google Sheets
            await this.syncWithSheets();
            
            // Process local pending items
            const pendingItems = await this.getAll(this.stores.syncQueue);
            if (pendingItems.length === 0) {
                console.log('No pending sync items');
                return;
            }

            console.log(`Processing ${pendingItems.length} pending sync items`);
            
            for (const item of pendingItems) {
                console.log(`Syncing item: ${item.id}`, item);
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
        return this.isInitialized && this.db !== null;
    }
}

// Expose to window
window.enterpriseDb = new EnterpriseDB();

// Initialize database
!function() {
    try {
        window.enterpriseDb.init().then(() => {
            console.log('['+new Date().toISOString()+'] Database ready');
            // Auto sync with sheets on init
            window.enterpriseDb.syncWithSheets().then(() => {
                console.log('['+new Date().toISOString()+'] Initial sheets sync completed');
            });
        }).catch(error => {
            console.warn('Database initialization failed:', error);
        });
    } catch (error) {
        console.warn('Database initialization failed:', error);
    }
}();
