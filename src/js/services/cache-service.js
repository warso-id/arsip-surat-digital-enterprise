/**
 * CACHE SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Client-side caching with IndexedDB
 */

class CacheService {
  constructor() {
    this.dbName = 'asd_cache';
    this.dbVersion = 1;
    this.db = null;
    this.prefix = APP_CONFIG.CACHE.PREFIX;
    this.defaultTTL = APP_CONFIG.CACHE.TTL * 1000; // Convert to ms
    this.maxSize = APP_CONFIG.CACHE.MAX_SIZE;
    this.storeName = 'cache';
    this.metaStoreName = 'meta';
  }
  
  /**
   * Initialize database
   */
  async init() {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported, falling back to localStorage');
      this.db = null;
      return;
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        this.db = null;
        resolve();
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ Cache Service initialized (IndexedDB)');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create cache store
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('expiry', 'expiry', { unique: false });
        }
        
        // Create meta store
        if (!db.objectStoreNames.contains(this.metaStoreName)) {
          db.createObjectStore(this.metaStoreName, { keyPath: 'key' });
        }
      };
    });
  }
  
  /**
   * Get cached data
   */
  async get(key) {
    const cacheKey = this.prefix + key;
    
    if (this.db) {
      return this.getFromIndexedDB(cacheKey);
    } else {
      return this.getFromLocalStorage(cacheKey);
    }
  }
  
  /**
   * Get from IndexedDB
   */
  async getFromIndexedDB(key) {
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);
        
        request.onsuccess = () => {
          const data = request.result;
          
          if (data) {
            // Check expiry
            if (data.expiry && Date.now() > data.expiry) {
              // Expired, delete it
              this.delete(key);
              resolve(null);
            } else {
              resolve(data.value);
            }
          } else {
            resolve(null);
          }
        };
        
        request.onerror = () => {
          resolve(null);
        };
      } catch (error) {
        resolve(null);
      }
    });
  }
  
  /**
   * Get from localStorage
   */
  getFromLocalStorage(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      
      const data = JSON.parse(raw);
      
      // Check expiry
      if (data.expiry && Date.now() > data.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      return data.value;
    } catch {
      return null;
    }
  }
  
  /**
   * Set cached data
   */
  async set(key, value, ttl = this.defaultTTL) {
    const cacheKey = this.prefix + key;
    const entry = {
      key: cacheKey,
      value: value,
      timestamp: Date.now(),
      expiry: ttl ? Date.now() + ttl : null,
      size: this.estimateSize(value)
    };
    
    // Check cache size
    await this.ensureSpace(entry.size);
    
    if (this.db) {
      return this.setToIndexedDB(entry);
    } else {
      return this.setToLocalStorage(entry);
    }
  }
  
  /**
   * Set to IndexedDB
   */
  async setToIndexedDB(entry) {
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        // Use put to overwrite existing
        store.put(entry);
        
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => resolve(false);
      } catch (error) {
        resolve(false);
      }
    });
  }
  
  /**
   * Set to localStorage
   */
  setToLocalStorage(entry) {
    try {
      localStorage.setItem(entry.key, JSON.stringify(entry));
      return true;
    } catch (error) {
      // Quota exceeded
      console.warn('localStorage quota exceeded, clearing old cache...');
      this.clearOldest();
      
      try {
        localStorage.setItem(entry.key, JSON.stringify(entry));
        return true;
      } catch {
        return false;
      }
    }
  }
  
  /**
   * Delete cached data
   */
  async delete(key) {
    const cacheKey = this.prefix + key;
    
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const transaction = this.db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          store.delete(cacheKey);
          transaction.oncomplete = () => resolve(true);
          transaction.onerror = () => resolve(false);
        } catch {
          resolve(false);
        }
      });
    } else {
      localStorage.removeItem(cacheKey);
      return true;
    }
  }
  
  /**
   * Delete by pattern
   */
  async deletePattern(pattern) {
    const keys = await this.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    for (const key of matchingKeys) {
      await this.delete(key.replace(this.prefix, ''));
    }
  }
  
  /**
   * Clear all cache
   */
  async clear() {
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const transaction = this.db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          store.clear();
          transaction.oncomplete = () => {
            console.log('✅ Cache cleared');
            resolve(true);
          };
          transaction.onerror = () => resolve(false);
        } catch {
          resolve(false);
        }
      });
    } else {
      // Clear all keys with prefix
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
      keys.forEach(k => localStorage.removeItem(k));
      return true;
    }
  }
  
  /**
   * Get all cache keys
   */
  async keys() {
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const transaction = this.db.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const request = store.getAllKeys();
          
          request.onsuccess = () => {
            resolve(request.result || []);
          };
          
          request.onerror = () => {
            resolve([]);
          };
        } catch {
          resolve([]);
        }
      });
    } else {
      return Object.keys(localStorage)
        .filter(k => k.startsWith(this.prefix));
    }
  }
  
  /**
   * Get cache size
   */
  async getSize() {
    let totalSize = 0;
    
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const transaction = this.db.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const request = store.getAll();
          
          request.onsuccess = () => {
            const items = request.result || [];
            totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0);
            resolve(totalSize);
          };
          
          request.onerror = () => {
            resolve(0);
          };
        } catch {
          resolve(0);
        }
      });
    } else {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
      keys.forEach(k => {
        totalSize += (localStorage.getItem(k) || '').length * 2; // UTF-16
      });
      return totalSize;
    }
  }
  
  /**
   * Ensure cache doesn't exceed max size
   */
  async ensureSpace(neededSize) {
    const currentSize = await this.getSize();
    
    if (currentSize + neededSize > this.maxSize) {
      await this.clearOldest();
    }
  }
  
  /**
   * Clear oldest entries
   */
  async clearOldest() {
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const transaction = this.db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const index = store.index('timestamp');
          const request = index.openCursor();
          let count = 0;
          const maxToDelete = 50; // Delete 50 oldest entries
          
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor && count < maxToDelete) {
              cursor.delete();
              count++;
              cursor.continue();
            } else {
              resolve(true);
            }
          };
          
          request.onerror = () => resolve(false);
        } catch {
          resolve(false);
        }
      });
    } else {
      const keys = Object.keys(localStorage)
        .filter(k => k.startsWith(this.prefix))
        .sort((a, b) => {
          const timeA = JSON.parse(localStorage.getItem(a) || '{}').timestamp || 0;
          const timeB = JSON.parse(localStorage.getItem(b) || '{}').timestamp || 0;
          return timeA - timeB;
        });
      
      // Delete oldest 30%
      const deleteCount = Math.ceil(keys.length * 0.3);
      keys.slice(0, deleteCount).forEach(k => localStorage.removeItem(k));
      
      return true;
    }
  }
  
  /**
   * Estimate size of value
   */
  estimateSize(value) {
    try {
      const str = JSON.stringify(value);
      return str.length * 2; // UTF-16
    } catch {
      return 0;
    }
  }
  
  /**
   * Get cache stats
   */
  async getStats() {
    const keys = await this.keys();
    const size = await this.getSize();
    
    return {
      totalEntries: keys.length,
      totalSize: size,
      maxSize: this.maxSize,
      usagePercent: Math.round((size / this.maxSize) * 100)
    };
  }
  
  /**
   * Clean expired entries
   */
  async cleanExpired() {
    const now = Date.now();
    let cleaned = 0;
    
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const transaction = this.db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const index = store.index('expiry');
          const range = IDBKeyRange.upperBound(now);
          const request = index.openCursor(range);
          
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              cursor.delete();
              cleaned++;
              cursor.continue();
            } else {
              resolve(cleaned);
            }
          };
          
          request.onerror = () => resolve(cleaned);
        } catch {
          resolve(cleaned);
        }
      });
    } else {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
      
      keys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.expiry && data.expiry < now) {
            localStorage.removeItem(key);
            cleaned++;
          }
        } catch {}
      });
      
      return cleaned;
    }
  }
  
  /**
   * Warm up cache (preload frequently used data)
   */
  async warmUp() {
    const preloadKeys = [
      'dashboard_stats',
      'master_data',
      'config'
    ];
    
    for (const key of preloadKeys) {
      const cached = await this.get(key);
      if (cached) {
        // Refresh if about to expire
        const entry = this.db 
          ? await this.getFromIndexedDB(this.prefix + key)
          : JSON.parse(localStorage.getItem(this.prefix + key) || '{}');
        
        if (entry && entry.expiry && entry.expiry - Date.now() < 60000) {
          // Will expire soon, refresh
          await this.delete(key);
        }
      }
    }
  }
}

// Singleton instance
const CacheService = new CacheService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CacheService };
}
