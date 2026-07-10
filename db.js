/**
 * ============================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.1.0 (2026)
 * Database Module (IndexedDB) - GRAND MASTER FINAL
 * ============================================
 * Features: Offline Storage, Cache Management,
 *           Pending Operations, Data Sync,
 *           Query Engine, Export/Import
 * ============================================
 */

class DatabaseManager {
  constructor() {
    this.dbName = 'ArsipSuratDB';
    this.dbVersion = 30;
    this.db = null;
    this.isReady = false;
    this.memoryFallback = {};
    this.useMemory = false;
    this.stores = {
      cache: { keyPath: 'url', indexes: ['timestamp', 'expiresAt'] },
      pendingOps: { keyPath: 'id', autoIncrement: true, indexes: ['type', 'status', 'timestamp', 'retryCount'] },
      suratMasuk: { keyPath: 'id', indexes: ['nomorSurat', 'nomorAgenda', 'pengirim', 'perihal', 'status', 'sifat', 'createdAt', 'aiTags', 'anomalyScore'] },
      suratKeluar: { keyPath: 'id', indexes: ['nomorSurat', 'tujuan', 'perihal', 'status', 'sifat', 'createdAt', 'aiTags', 'approvalStatus'] },
      disposisi: { keyPath: 'id', indexes: ['suratMasukId', 'status', 'sifat', 'batasWaktu', 'createdAt'] },
      approval: { keyPath: 'id', indexes: ['suratKeluarId', 'status', 'level', 'createdAt'] },
      masterData: { keyPath: 'id', indexes: ['kategori', 'kode', 'isActive'] },
      settings: { keyPath: 'key' },
      blockchain: { keyPath: 'index' },
      notifications: { keyPath: 'id', indexes: ['userId', 'isRead', 'tipe', 'createdAt'] },
      auditLog: { keyPath: 'id', indexes: ['userId', 'aksi', 'modul', 'createdAt'] },
      aiCache: { keyPath: 'id', indexes: ['type', 'timestamp'] },
      biometricCred: { keyPath: 'id', indexes: ['userId'] },
    };
    this.init();
  }

  async init() {
    try {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, using memory fallback');
        this.useMemory = true;
        this.isReady = true;
        return;
      }
      this.db = await this.open();
      this.isReady = true;
      await this.cleanup();
      await this.logStats();
      console.log('🗄️ Database v3.1.0 initialized | Stores: ' + Object.keys(this.stores).length);
    } catch (error) {
      console.error('Database init failed, using memory fallback:', error.message);
      this.useMemory = true;
      this.isReady = true;
    }
  }

  open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        Object.entries(this.stores).forEach(([name, config]) => {
          let store;
          if (db.objectStoreNames.contains(name)) {
            store = request.transaction.objectStore(name);
          } else {
            store = db.createObjectStore(name, { keyPath: config.keyPath, autoIncrement: config.autoIncrement || false });
          }
          (config.indexes || []).forEach(idx => {
            if (!store.indexNames.contains(idx)) store.createIndex(idx, idx, { unique: false });
          });
        });
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
      request.onblocked = () => reject(new Error('Database blocked'));
    });
  }

  async ensureReady() {
    if (!this.isReady) await this.init();
    if (!this.isReady && !this.useMemory) throw new Error('Database not available');
  }

  // Memory fallback
  memoryOp(storeName, op, id, data) {
    if (!this.memoryFallback[storeName]) this.memoryFallback[storeName] = new Map();
    const store = this.memoryFallback[storeName];
    switch (op) {
      case 'get': return store.get(id) || null;
      case 'getAll': return Array.from(store.values());
      case 'put': store.set(data[this.stores[storeName]?.keyPath || 'id'] || id, { ...data, _updatedAt: new Date().toISOString() }); return data;
      case 'add': const key = data[this.stores[storeName]?.keyPath || 'id'] || Date.now().toString(); store.set(key, { ...data, _createdAt: new Date().toISOString() }); return key;
      case 'delete': store.delete(id); return true;
      case 'clear': store.clear(); return true;
      case 'count': return store.size;
      default: return null;
    }
  }

  async add(storeName, data) {
    await this.ensureReady();
    if (this.useMemory) return this.memoryOp(storeName, 'add', null, data);
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.add({ ...data, _createdAt: new Date().toISOString(), _updatedAt: new Date().toISOString() });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async put(storeName, data) {
    await this.ensureReady();
    if (this.useMemory) return this.memoryOp(storeName, 'put', null, data);
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put({ ...data, _updatedAt: new Date().toISOString() });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async get(storeName, id) {
    await this.ensureReady();
    if (this.useMemory) return this.memoryOp(storeName, 'get', id);
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(storeName) {
    await this.ensureReady();
    if (this.useMemory) return this.memoryOp(storeName, 'getAll');
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName, id) {
    await this.ensureReady();
    if (this.useMemory) return this.memoryOp(storeName, 'delete', id);
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const req = tx.objectStore(storeName).delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async clear(storeName) {
    await this.ensureReady();
    if (this.useMemory) return this.memoryOp(storeName, 'clear');
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const req = tx.objectStore(storeName).clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async count(storeName) {
    await this.ensureReady();
    if (this.useMemory) return this.memoryOp(storeName, 'count');
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async queryByIndex(storeName, indexName, value) {
    await this.ensureReady();
    if (this.useMemory) {
      const all = this.memoryOp(storeName, 'getAll');
      return all.filter(item => item[indexName] === value);
    }
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const index = tx.objectStore(storeName).index(indexName);
      const req = index.getAll(value);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async query(storeName, filterFn, limit = 100) {
    const all = await this.getAll(storeName);
    const filtered = all.filter(filterFn);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  async cacheResponse(url, data, ttl = 3600000) {
    await this.ensureReady();
    await this.put('cache', { url, data, timestamp: Date.now(), ttl, expiresAt: Date.now() + ttl });
  }

  async getCachedResponse(url) {
    await this.ensureReady();
    const cached = await this.get('cache', url);
    if (!cached) return null;
    if (Date.now() > cached.expiresAt) { await this.delete('cache', url); return null; }
    return cached.data;
  }

  async clearExpiredCache() {
    const all = await this.getAll('cache');
    const now = Date.now();
    let cleared = 0;
    for (const item of all) { if (now > item.expiresAt) { await this.delete('cache', item.url); cleared++; } }
    return cleared;
  }

  async addPendingOperation(type, data, method = 'POST', url = '') {
    return this.add('pendingOps', { type, data: JSON.stringify(data), method, url, status: 'pending', timestamp: new Date().toISOString(), retryCount: 0, maxRetries: 5, headers: { 'Content-Type': 'application/json' } });
  }

  async getPendingOperations() { return this.queryByIndex('pendingOps', 'status', 'pending'); }

  async syncPendingOperations() {
    const pending = await this.getPendingOperations();
    let synced = 0, failed = 0;
    for (const op of pending) {
      try {
        const data = JSON.parse(op.data);
        let response;
        switch (op.type) {
          case 'create_surat_masuk': response = await APP.api.post('suratMasuk.create', data); break;
          case 'create_surat_keluar': response = await APP.api.post('suratKeluar.create', data); break;
          case 'create_disposisi': response = await APP.api.post('disposisi.create', data); break;
          case 'update_surat': response = await APP.api.put('suratMasuk.update', data); break;
          case 'tindak_lanjut': response = await APP.api.put('disposisi.tindakLanjut', data); break;
          default: response = await fetch(op.url || APP.api.buildUrl(op.type), { method: op.method, headers: op.headers, body: op.body || JSON.stringify(data) }); break;
        }
        if (response && (response.status === 'success' || response.ok)) { await this.completeOperation(op.id); synced++; }
        else { await this.failOperation(op.id); failed++; }
      } catch (e) { await this.failOperation(op.id); failed++; }
    }
    return { synced, failed, total: pending.length };
  }

  async completeOperation(id) { await this.put('pendingOps', { id, status: 'completed', completedAt: new Date().toISOString() }); }
  async failOperation(id) {
    const op = await this.get('pendingOps', id);
    if (!op) return;
    const retryCount = (op.retryCount || 0) + 1;
    await this.put('pendingOps', { ...op, status: retryCount >= (op.maxRetries || 5) ? 'failed' : 'pending', retryCount, lastAttempt: new Date().toISOString() });
  }

  async getSetting(key, defaultValue = null) { const s = await this.get('settings', key); return s ? s.value : defaultValue; }
  async setSetting(key, value) { await this.put('settings', { key, value, updatedAt: new Date().toISOString() }); }
  async getAllSettings() { const all = await this.getAll('settings'); const s = {}; all.forEach(i => s[i.key] = i.value); return s; }

  async getSize() {
    if (!navigator.storage?.estimate) return { usage: 0, quota: 0, percentUsed: 0 };
    try { const e = await navigator.storage.estimate(); return { usage: e.usage || 0, quota: e.quota || 0, percentUsed: e.quota ? Math.round((e.usage/e.quota)*100) : 0 }; } catch(e) { return { usage: 0, quota: 0, percentUsed: 0 }; }
  }

  async getStats() {
    await this.ensureReady();
    const stats = {};
    for (const name of Object.keys(this.stores)) { stats[name] = await this.count(name); }
    const size = await this.getSize();
    return { stores: stats, totalRecords: Object.values(stats).reduce((a,b)=>a+b,0), size, version: this.dbVersion, name: this.dbName, isReady: this.isReady, storageType: this.useMemory ? 'memory' : 'indexeddb' };
  }

  async cleanup() {
    const cleared = await this.clearExpiredCache();
    const pending = await this.getAll('pendingOps');
    const weekAgo = Date.now() - 7*24*60*60*1000;
    let oldCleaned = 0;
    for (const op of pending) { if ((op.status === 'completed' || op.status === 'failed') && new Date(op.timestamp).getTime() < weekAgo) { await this.delete('pendingOps', op.id); oldCleaned++; } }
    if (cleared > 0 || oldCleaned > 0) console.log(`🧹 Cleaned ${cleared} cache + ${oldCleaned} old ops`);
  }

  async logStats() { const stats = await this.getStats(); console.log(`   Records: ${stats.totalRecords} | Size: ${(stats.size.usage/1024/1024).toFixed(2)}MB | Type: ${stats.storageType}`); }

  async exportAll() {
    const data = { version: this.dbVersion, exportedAt: new Date().toISOString(), stores: {} };
    for (const name of Object.keys(this.stores)) { data.stores[name] = await this.getAll(name); }
    return data;
  }

  async importAll(data) {
    if (!data?.stores) throw new Error('Invalid data');
    for (const [name, records] of Object.entries(data.stores)) {
      if (this.stores[name]) { await this.clear(name); for (const r of records) { await this.put(name, r); } }
    }
  }

  async reset() { for (const name of Object.keys(this.stores)) { await this.clear(name); } }
  close() { if (this.db) { this.db.close(); this.db = null; this.isReady = false; } }
}

const dbManager = new DatabaseManager();
window.dbManager = dbManager;
window.DatabaseManager = DatabaseManager;
console.log('✅ db.js v3.1.0 GRAND MASTER FINAL loaded');