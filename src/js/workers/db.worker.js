/**
 * ============================================
 * INDEXEDDB WORKER - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL BACKGROUND DATABASE OPERATIONS - SIAP PRODUKSI
 * Mendukung: CRUD, Search, Index, Cache, Sync,
 * File Storage, Batch, Migration, Stats
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

const DB_NAME = 'asd_offline_db';
const DB_VERSION = 3;

let db = null;
let pendingRequests = new Map();

/**
 * Initialize database with all stores and indexes
 */
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      self.postMessage({ type: 'error', error: 'Failed to open database: ' + request.error.message });
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      db.onclose = () => self.postMessage({ type: 'warn', message: 'Database connection closed' });
      db.onversionchange = () => { db.close(); self.postMessage({ type: 'warn', message: 'Database version changed, reload required' }); };
      self.postMessage({ type: 'ready', message: 'Database initialized' });
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;

      // v1: Basic stores
      if (oldVersion < 1) {
        createStoreV1(db);
      }

      // v2: Additional indexes and cache store
      if (oldVersion < 2) {
        createStoreV2(db);
      }

      // v3: Forms, logs, and full-text search
      if (oldVersion < 3) {
        createStoreV3(db);
      }
    };

    request.onblocked = () => {
      self.postMessage({ type: 'warn', message: 'Database upgrade blocked. Please close other tabs.' });
    };
  });
}

function createStoreV1(db) {
  // Offline data cache
  if (!db.objectStoreNames.contains('offlineData')) {
    const store = db.createObjectStore('offlineData', { keyPath: 'id' });
    store.createIndex('type', 'type', { unique: false });
    store.createIndex('timestamp', 'timestamp', { unique: false });
    store.createIndex('expiry', 'expiry', { unique: false });
  }

  // Pending sync actions
  if (!db.objectStoreNames.contains('pendingActions')) {
    const store = db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
    store.createIndex('action', 'action', { unique: false });
    store.createIndex('status', 'status', { unique: false });
    store.createIndex('timestamp', 'timestamp', { unique: false });
    store.createIndex('priority', 'priority', { unique: false });
  }

  // Offline files
  if (!db.objectStoreNames.contains('offlineFiles')) {
    const store = db.createObjectStore('offlineFiles', { keyPath: 'id' });
    store.createIndex('timestamp', 'timestamp', { unique: false });
    store.createIndex('type', 'type', { unique: false });
    store.createIndex('name', 'name', { unique: false });
  }

  // Search index
  if (!db.objectStoreNames.contains('searchIndex')) {
    const store = db.createObjectStore('searchIndex', { keyPath: 'id' });
    store.createIndex('type', 'type', { unique: false });
    store.createIndex('searchText', 'searchText', { unique: false });
    store.createIndex('timestamp', 'timestamp', { unique: false });
  }
}

function createStoreV2(db) {
  // Cache store with TTL
  if (!db.objectStoreNames.contains('cache')) {
    const store = db.createObjectStore('cache', { keyPath: 'key' });
    store.createIndex('timestamp', 'timestamp', { unique: false });
    store.createIndex('expiry', 'expiry', { unique: false });
    store.createIndex('size', 'size', { unique: false });
  }

  // Sync log
  if (!db.objectStoreNames.contains('syncLog')) {
    const store = db.createObjectStore('syncLog', { keyPath: 'id', autoIncrement: true });
    store.createIndex('action', 'action', { unique: false });
    store.createIndex('status', 'status', { unique: false });
    store.createIndex('timestamp', 'timestamp', { unique: false });
  }
}

function createStoreV3(db) {
  // Offline forms (auto-save)
  if (!db.objectStoreNames.contains('offlineForms')) {
    const store = db.createObjectStore('offlineForms', { keyPath: 'formKey' });
    store.createIndex('timestamp', 'timestamp', { unique: false });
  }

  // Error logs
  if (!db.objectStoreNames.contains('errorLogs')) {
    const store = db.createObjectStore('errorLogs', { keyPath: 'id', autoIncrement: true });
    store.createIndex('level', 'level', { unique: false });
    store.createIndex('timestamp', 'timestamp', { unique: false });
  }

  // User preferences
  if (!db.objectStoreNames.contains('userPrefs')) {
    db.createObjectStore('userPrefs', { keyPath: 'key' });
  }
}

/**
 * Main message handler
 */
self.onmessage = async (event) => {
  const { action, data, requestId } = event.data;

  try {
    if (!db) await initDB();

    let result;

    switch (action) {
      // CRUD Operations
      case 'get': result = await handleGet(data); break;
      case 'put': result = await handlePut(data); break;
      case 'add': result = await handleAdd(data); break;
      case 'delete': result = await handleDelete(data); break;
      case 'clear': result = await handleClear(data); break;
      case 'getAll': result = await handleGetAll(data); break;
      case 'count': result = await handleCount(data); break;
      case 'getByIndex': result = await handleGetByIndex(data); break;

      // Cache Operations
      case 'cacheGet': result = await handleCacheGet(data); break;
      case 'cacheSet': result = await handleCacheSet(data); break;
      case 'cacheDelete': result = await handleCacheDelete(data); break;
      case 'cacheClear': result = await handleCacheClear(data); break;
      case 'cacheCleanExpired': result = await handleCacheCleanExpired(data); break;

      // Search Operations
      case 'search': result = await handleSearch(data); break;
      case 'indexData': result = await handleIndexData(data); break;
      case 'clearSearchIndex': result = await handleClearSearchIndex(data); break;

      // Sync Operations
      case 'addPending': result = await handleAddPending(data); break;
      case 'getPending': result = await handleGetPending(data); break;
      case 'updatePending': result = await handleUpdatePending(data); break;
      case 'removePending': result = await handleRemovePending(data); break;
      case 'clearPending': result = await handleClearPending(data); break;

      // File Operations
      case 'saveFile': result = await handleSaveFile(data); break;
      case 'getFile': result = await handleGetFile(data); break;
      case 'deleteFile': result = await handleDeleteFile(data); break;
      case 'listFiles': result = await handleListFiles(data); break;

      // Form Operations
      case 'saveForm': result = await handleSaveForm(data); break;
      case 'getForm': result = await handleGetForm(data); break;
      case 'deleteForm': result = await handleDeleteForm(data); break;

      // Log Operations
      case 'logError': result = await handleLogError(data); break;
      case 'getErrors': result = await handleGetErrors(data); break;
      case 'clearErrors': result = await handleClearErrors(data); break;

      // Preference Operations
      case 'getPref': result = await handleGetPref(data); break;
      case 'setPref': result = await handleSetPref(data); break;

      // Stats
      case 'getStats': result = await handleGetStats(); break;
      case 'getStorageEstimate': result = await handleGetStorageEstimate(); break;

      // Maintenance
      case 'vacuum': result = await handleVacuum(); break;
      case 'close': result = await handleClose(); break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    self.postMessage({ requestId, success: true, data: result });

  } catch (error) {
    self.postMessage({ requestId, success: false, error: error.message });
    // Log error
    if (db && action !== 'logError') {
      logErrorInternal('worker', error.message, action);
    }
  }
};

// ============================================
// CRUD OPERATIONS
// ============================================
async function handleGet({ storeName, id }) {
  return dbOperation(storeName, 'readonly', store => store.get(id));
}

async function handlePut({ storeName, value }) {
  return dbOperation(storeName, 'readwrite', store => store.put(value));
}

async function handleAdd({ storeName, value }) {
  return dbOperation(storeName, 'readwrite', store => store.add(value));
}

async function handleDelete({ storeName, id }) {
  return dbOperation(storeName, 'readwrite', store => store.delete(id).then(() => true));
}

async function handleClear({ storeName }) {
  return dbOperation(storeName, 'readwrite', store => store.clear().then(() => true));
}

async function handleGetAll({ storeName, indexName, query, limit, offset, direction = 'next' }) {
  return dbOperation(storeName, 'readonly', store => {
    return new Promise((resolve, reject) => {
      let request;
      if (indexName && query !== undefined) {
        const index = store.index(indexName);
        const range = Array.isArray(query) ? IDBKeyRange.bound(query[0], query[1]) : IDBKeyRange.only(query);
        request = index.openCursor(range, direction);
      } else {
        request = store.openCursor(null, direction);
      }

      const results = [];
      let count = 0;
      let skipped = 0;

      request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (!cursor) { resolve(results); return; }

        if (offset && skipped < offset) { skipped++; cursor.continue(); return; }
        if (limit && count >= limit) { resolve(results); return; }

        results.push(cursor.value);
        count++;
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
    });
  });
}

async function handleCount({ storeName, indexName, query }) {
  return dbOperation(storeName, 'readonly', store => {
    return new Promise((resolve, reject) => {
      let request;
      if (indexName && query !== undefined) {
        const index = store.index(indexName);
        const range = IDBKeyRange.only(query);
        request = index.count(range);
      } else {
        request = store.count();
      }
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

async function handleGetByIndex({ storeName, indexName, value }) {
  return dbOperation(storeName, 'readonly', store => {
    return new Promise((resolve, reject) => {
      const index = store.index(indexName);
      const request = index.get(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

// ============================================
// CACHE OPERATIONS
// ============================================
async function handleCacheGet({ key }) {
  const entry = await handleGet({ storeName: 'cache', id: key });
  if (!entry) return null;
  if (entry.expiry && Date.now() > entry.expiry) {
    await handleDelete({ storeName: 'cache', id: key });
    return null;
  }
  return entry.value;
}

async function handleCacheSet({ key, value, ttl }) {
  const entry = { key, value, timestamp: Date.now(), expiry: ttl ? Date.now() + ttl : null, size: estimateSize(value) };
  return handlePut({ storeName: 'cache', value: entry });
}

async function handleCacheDelete({ key }) {
  return handleDelete({ storeName: 'cache', id: key });
}

async function handleCacheClear() {
  return handleClear({ storeName: 'cache' });
}

async function handleCacheCleanExpired() {
  const entries = await handleGetAll({ storeName: 'cache' });
  const now = Date.now();
  let cleaned = 0;
  for (const entry of entries) {
    if (entry.expiry && now > entry.expiry) {
      await handleDelete({ storeName: 'cache', id: entry.key });
      cleaned++;
    }
  }
  return { cleaned, remaining: entries.length - cleaned };
}

// ============================================
// SEARCH OPERATIONS
// ============================================
async function handleSearch({ query, type, limit = 20, fuzzy = false }) {
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(/\s+/).filter(w => w.length > 1);
  const results = [];

  const items = type
    ? await handleGetByIndex({ storeName: 'searchIndex', indexName: 'type', value: type }).then(r => r ? [r] : [])
    : await handleGetAll({ storeName: 'searchIndex' });

  // Actually get all and filter
  const allItems = await handleGetAll({ storeName: 'searchIndex' });
  const filtered = type ? allItems.filter(i => i.type === type) : allItems;

  for (const item of filtered) {
    if (results.length >= limit) break;
    const text = (item.searchText || '').toLowerCase();
    
    if (fuzzy) {
      let matchCount = 0;
      for (const word of words) {
        if (text.includes(word) || levenshteinSimilarity(text, word) > 0.6) matchCount++;
      }
      if (matchCount > 0) {
        results.push({ ...item, _score: matchCount / words.length });
      }
    } else {
      if (text.includes(lowerQuery)) {
        results.push({ ...item, _score: 1 });
      }
    }
  }

  results.sort((a, b) => (b._score || 0) - (a._score || 0));
  return results;
}

async function handleIndexData({ type, items }) {
  const storeName = 'searchIndex';
  const tx = db.transaction([storeName], 'readwrite');
  const store = tx.objectStore(storeName);

  // Clear existing type
  const existing = await handleGetAll({ storeName, indexName: 'type', query: type });
  for (const item of existing) {
    store.delete(item.id);
  }

  // Insert new items
  for (const item of items) {
    const searchText = [
      item.nomorSurat, item.nomorAgenda, item.perihal, item.pengirim,
      item.tujuan, item.instruksi, item.catatan, item.namaLengkap,
      item.username, item.email, item.jabatan, item.unitKerja
    ].filter(Boolean).join(' ').toLowerCase();

    store.put({
      id: item.id || `idx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      searchText,
      data: item,
      timestamp: Date.now()
    });
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve({ indexed: items.length });
    tx.onerror = () => reject(tx.error);
  });
}

async function handleClearSearchIndex({ type }) {
  if (type) {
    const items = await handleGetAll({ storeName: 'searchIndex', indexName: 'type', query: type });
    for (const item of items) {
      await handleDelete({ storeName: 'searchIndex', id: item.id });
    }
  } else {
    await handleClear({ storeName: 'searchIndex' });
  }
}

// ============================================
// SYNC OPERATIONS
// ============================================
async function handleAddPending({ action, payload, priority = 'normal' }) {
  const item = { action, data: payload, timestamp: Date.now(), retries: 0, maxRetries: 5, priority, status: 'pending' };
  return handleAdd({ storeName: 'pendingActions', value: item });
}

async function handleGetPending({ status = 'pending', limit } = {}) {
  const items = await handleGetAll({ storeName: 'pendingActions', indexName: 'status', query: status, limit });
  return items;
}

async function handleUpdatePending({ id, updates }) {
  const item = await handleGet({ storeName: 'pendingActions', id });
  if (!item) throw new Error('Pending item not found');
  Object.assign(item, updates, { updatedAt: Date.now() });
  return handlePut({ storeName: 'pendingActions', value: item });
}

async function handleRemovePending({ id }) {
  return handleDelete({ storeName: 'pendingActions', id });
}

async function handleClearPending({ status } = {}) {
  if (status) {
    const items = await handleGetAll({ storeName: 'pendingActions', indexName: 'status', query: status });
    for (const item of items) {
      await handleDelete({ storeName: 'pendingActions', id: item.id });
    }
  } else {
    await handleClear({ storeName: 'pendingActions' });
  }
}

// ============================================
// FILE OPERATIONS
// ============================================
async function handleSaveFile({ id, file, name, type, size }) {
  const entry = { id, file, name: name || file?.name, type: type || file?.type, size: size || file?.size, timestamp: Date.now() };
  return handlePut({ storeName: 'offlineFiles', value: entry });
}

async function handleGetFile({ id }) {
  const entry = await handleGet({ storeName: 'offlineFiles', id });
  return entry?.file || null;
}

async function handleDeleteFile({ id }) {
  return handleDelete({ storeName: 'offlineFiles', id });
}

async function handleListFiles({ type, limit } = {}) {
  return handleGetAll({ storeName: 'offlineFiles', indexName: type ? 'type' : null, query: type, limit });
}

// ============================================
// FORM OPERATIONS
// ============================================
async function handleSaveForm({ formKey, data }) {
  return handlePut({ storeName: 'offlineForms', value: { formKey, data, timestamp: Date.now() } });
}

async function handleGetForm({ formKey }) {
  const entry = await handleGet({ storeName: 'offlineForms', id: formKey });
  return entry?.data || null;
}

async function handleDeleteForm({ formKey }) {
  return handleDelete({ storeName: 'offlineForms', id: formKey });
}

// ============================================
// LOG OPERATIONS
// ============================================
async function handleLogError({ level = 'error', message, context }) {
  return handleAdd({ storeName: 'errorLogs', value: { level, message, context, timestamp: Date.now() } });
}

async function handleGetErrors({ level, limit = 50 } = {}) {
  return handleGetAll({ storeName: 'errorLogs', indexName: level ? 'level' : null, query: level, limit });
}

async function handleClearErrors() {
  return handleClear({ storeName: 'errorLogs' });
}

// ============================================
// PREFERENCE OPERATIONS
// ============================================
async function handleGetPref({ key }) {
  const entry = await handleGet({ storeName: 'userPrefs', id: key });
  return entry?.value;
}

async function handleSetPref({ key, value }) {
  return handlePut({ storeName: 'userPrefs', value: { key, value } });
}

// ============================================
// STATS & MAINTENANCE
// ============================================
async function handleGetStats() {
  const stats = {};
  for (const name of Array.from(db.objectStoreNames)) {
    stats[name] = await handleCount({ storeName: name });
  }
  stats.totalStores = Array.from(db.objectStoreNames).length;
  stats.dbName = DB_NAME;
  stats.dbVersion = DB_VERSION;
  return stats;
}

async function handleGetStorageEstimate() {
  if (navigator.storage?.estimate) {
    return navigator.storage.estimate();
  }
  return { quota: 0, usage: 0 };
}

async function handleVacuum() {
  // Clean expired cache
  const cacheResult = await handleCacheCleanExpired({});

  // Remove old error logs (keep last 100)
  const errors = await handleGetErrors({ limit: 1000 });
  if (errors.length > 100) {
    const toDelete = errors.slice(0, errors.length - 100);
    for (const e of toDelete) {
      await handleDelete({ storeName: 'errorLogs', id: e.id });
    }
  }

  return { cacheCleaned: cacheResult.cleaned, errorsCleaned: Math.max(0, errors.length - 100) };
}

async function handleClose() {
  if (db) { db.close(); db = null; }
  return true;
}

// ============================================
// HELPERS
// ============================================
function dbOperation(storeName, mode, callback) {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([storeName], mode);
      const store = tx.objectStore(storeName);
      const result = callback(store);
      if (result instanceof Promise) {
        result.then(resolve).catch(reject);
      } else {
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(new Error('Transaction aborted'));
      }
    } catch (error) {
      reject(error);
    }
  });
}

function estimateSize(value) {
  try { return JSON.stringify(value).length * 2; } catch { return 0; }
}

function levenshteinSimilarity(a, b) {
  const lenA = a.length, lenB = b.length;
  const matrix = Array.from({ length: lenA + 1 }, (_, i) => [i]);
  for (let j = 0; j <= lenB; j++) matrix[0][j] = j;
  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      matrix[i][j] = a[i - 1] === b[j - 1] ? matrix[i - 1][j - 1] : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return 1 - matrix[lenA][lenB] / Math.max(lenA, lenB);
}

function logErrorInternal(level, message, context) {
  handleLogError({ level, message, context }).catch(() => {});
}

console.log('✅ IndexedDB Worker v3 initialized');
