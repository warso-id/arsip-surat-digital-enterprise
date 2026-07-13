/**
 * INDEXEDDB WORKER - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Background database operations
 */

const DB_NAME = 'asd_offline_db';
const DB_VERSION = 1;

let db = null;

// Initialize database
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Offline data store
      if (!db.objectStoreNames.contains('offlineData')) {
        const store = db.createObjectStore('offlineData', { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      // Pending sync actions
      if (!db.objectStoreNames.contains('pendingActions')) {
        const store = db.createObjectStore('pendingActions', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('action', 'action', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
      
      // Offline files
      if (!db.objectStoreNames.contains('offlineFiles')) {
        const store = db.createObjectStore('offlineFiles', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      // Cache store
      if (!db.objectStoreNames.contains('cache')) {
        const store = db.createObjectStore('cache', { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('expiry', 'expiry', { unique: false });
      }
      
      // Search index
      if (!db.objectStoreNames.contains('searchIndex')) {
        const store = db.createObjectStore('searchIndex', { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('searchText', 'searchText', { unique: false });
      }
    };
  });
}

// Handle messages from main thread
self.onmessage = async (event) => {
  const { action, data, requestId } = event.data;
  
  try {
    if (!db) await initDB();
    
    let result;
    
    switch (action) {
      case 'get':
        result = await handleGet(data);
        break;
      case 'put':
        result = await handlePut(data);
        break;
      case 'delete':
        result = await handleDelete(data);
        break;
      case 'clear':
        result = await handleClear(data);
        break;
      case 'getAll':
        result = await handleGetAll(data);
        break;
      case 'search':
        result = await handleSearch(data);
        break;
      case 'addPending':
        result = await handleAddPending(data);
        break;
      case 'getPending':
        result = await handleGetPending(data);
        break;
      case 'removePending':
        result = await handleRemovePending(data);
        break;
      case 'saveFile':
        result = await handleSaveFile(data);
        break;
      case 'getFile':
        result = await handleGetFile(data);
        break;
      case 'getStats':
        result = await handleGetStats();
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    self.postMessage({ requestId, success: true, data: result });
    
  } catch (error) {
    self.postMessage({ requestId, success: false, error: error.message });
  }
};

/**
 * Handle get operation
 */
async function handleGet(data) {
  const { storeName, id } = data;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Handle put operation
 */
async function handlePut(data) {
  const { storeName, value } = data;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(value);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Handle delete operation
 */
async function handleDelete(data) {
  const { storeName, id } = data;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Handle clear operation
 */
async function handleClear(data) {
  const { storeName } = data;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Handle getAll operation
 */
async function handleGetAll(data) {
  const { storeName, indexName, query, limit, offset } = data;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    let request;
    if (indexName && query) {
      const index = store.index(indexName);
      const range = IDBKeyRange.only(query);
      request = index.getAll(range, limit);
    } else {
      request = store.getAll(null, limit);
    }
    
    const results = [];
    
    request.onsuccess = () => {
      let items = request.result || [];
      if (offset) items = items.slice(offset);
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Handle search operation
 */
async function handleSearch(data) {
  const { query, type, limit = 20 } = data;
  const lowerQuery = query.toLowerCase();
  const results = [];
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['searchIndex'], 'readonly');
    const store = transaction.objectStore('searchIndex');
    
    let request;
    if (type) {
      const index = store.index('type');
      request = index.getAll(type);
    } else {
      request = store.getAll();
    }
    
    request.onsuccess = () => {
      const items = request.result || [];
      
      for (const item of items) {
        if (results.length >= limit) break;
        
        const searchText = (item.searchText || '').toLowerCase();
        if (searchText.includes(lowerQuery)) {
          results.push(item);
        }
      }
      
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Handle add pending action
 */
async function handleAddPending(data) {
  const { action, payload } = data;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');
    
    const pendingItem = {
      action,
      data: payload,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 5,
      status: 'pending'
    };
    
    const request = store.add(pendingItem);
    request.onsuccess = () => resolve({ id: request.result });
    request.onerror = () => reject(request.error);
  });
}

/**
 * Handle get pending actions
 */
async function handleGetPending(data) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingActions'], 'readonly');
    const store = transaction.objectStore('pendingActions');
    const index = store.index('status');
    const request = index.getAll('pending');
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Handle remove pending action
 */
async function handleRemovePending(data) {
  const { id } = data;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Handle save file
 */
async function handleSaveFile(data) {
  const { id, file } = data;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineFiles'], 'readwrite');
    const store = transaction.objectStore('offlineFiles');
    
    const fileEntry = {
      id,
      file,
      timestamp: Date.now()
    };
    
    const request = store.put(fileEntry);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Handle get file
 */
async function handleGetFile(data) {
  const { id } = data;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineFiles'], 'readonly');
    const store = transaction.objectStore('offlineFiles');
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result?.file || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Handle get stats
 */
async function handleGetStats() {
  const stats = {};
  const storeNames = Array.from(db.objectStoreNames);
  
  for (const storeName of storeNames) {
    const count = await new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    stats[storeName] = count;
  }
  
  return stats;
}

console.log('✅ IndexedDB Worker initialized');
