// Database Service untuk PWA Offline Support
class DatabaseService {
    constructor() {
        this.dbName = 'ArsipSuratDigitalDB';
        this.dbVersion = 1;
        this.db = null;
        this.initDatabase();
    }

    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Database error:', request.error);
                reject(request.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Store untuk surat masuk
                if (!db.objectStoreNames.contains('suratMasuk')) {
                    const suratMasukStore = db.createObjectStore('suratMasuk', { keyPath: 'id' });
                    suratMasukStore.createIndex('nomor_surat', 'nomor_surat', { unique: true });
                    suratMasukStore.createIndex('tanggal_surat', 'tanggal_surat');
                    suratMasukStore.createIndex('status', 'status');
                }

                // Store untuk surat keluar
                if (!db.objectStoreNames.contains('suratKeluar')) {
                    const suratKeluarStore = db.createObjectStore('suratKeluar', { keyPath: 'id' });
                    suratKeluarStore.createIndex('nomor_surat', 'nomor_surat', { unique: true });
                    suratKeluarStore.createIndex('tanggal_surat', 'tanggal_surat');
                }

                // Store untuk disposisi
                if (!db.objectStoreNames.contains('disposisi')) {
                    const disposisiStore = db.createObjectStore('disposisi', { keyPath: 'id' });
                    disposisiStore.createIndex('surat_id', 'surat_id');
                    disposisiStore.createIndex('status', 'status');
                }

                // Store untuk kategori
                if (!db.objectStoreNames.contains('kategori')) {
                    db.createObjectStore('kategori', { keyPath: 'id' });
                }

                // Store untuk instansi
                if (!db.objectStoreNames.contains('instansi')) {
                    db.createObjectStore('instansi', { keyPath: 'id' });
                }

                // Store untuk pengguna
                if (!db.objectStoreNames.contains('pengguna')) {
                    db.createObjectStore('pengguna', { keyPath: 'id' });
                }

                // Store untuk cache
                if (!db.objectStoreNames.contains('cache')) {
                    db.createObjectStore('cache', { keyPath: 'key' });
                }

                // Store untuk antrian sync
                if (!db.objectStoreNames.contains('syncQueue')) {
                    const syncStore = db.createObjectStore('syncQueue', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    syncStore.createIndex('timestamp', 'timestamp');
                }
            };
        });
    }

    async saveData(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getData(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllData(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteData(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async clearStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async addToSyncQueue(action) {
        const queueItem = {
            action: action,
            timestamp: new Date().toISOString(),
            synced: false
        };
        return await this.saveData('syncQueue', queueItem);
    }

    async getSyncQueue() {
        const allItems = await this.getAllData('syncQueue');
        return allItems.filter(item => !item.synced);
    }

    async clearSyncQueue() {
        return await this.clearStore('syncQueue');
    }
}

// Inisialisasi instance global
const dbService = new DatabaseService();
