/**
 * OFFLINE SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Offline support with background sync
 */

class OfflineService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingActions = [];
    this.syncInProgress = false;
    this.db = null;
  }
  
  /**
   * Initialize offline service
   */
  async init() {
    // Check online status
    this.isOnline = navigator.onLine;
    
    // Setup listeners
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Initialize IndexedDB for offline storage
    await this.initDB();
    
    // Load pending actions
    await this.loadPendingActions();
    
    // Update state
    store.dispatch('app.online', this.isOnline);
    
    console.log('✅ Offline Service initialized');
  }
  
  /**
   * Initialize IndexedDB
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('asd_offline', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Store for offline data
        if (!db.objectStoreNames.contains('offlineData')) {
          const store = db.createObjectStore('offlineData', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Store for pending actions
        if (!db.objectStoreNames.contains('pendingActions')) {
          const store = db.createObjectStore('pendingActions', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('action', 'action', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Store for offline files
        if (!db.objectStoreNames.contains('offlineFiles')) {
          const store = db.createObjectStore('offlineFiles', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }
  
  /**
   * Handle coming online
   */
  async handleOnline() {
    console.log('🌐 Online - Syncing data...');
    this.isOnline = true;
    store.dispatch('app.online', true);
    
    NotificationService.show('Koneksi tersedia, menyinkronkan data...', 'info', { duration: 3000 });
    
    // Sync pending actions
    await this.syncPendingActions();
    
    // Refresh data
    await this.refreshData();
    
    NotificationService.show('Data berhasil disinkronkan', 'success');
  }
  
  /**
   * Handle going offline
   */
  handleOffline() {
    console.log('📡 Offline - Using cached data');
    this.isOnline = false;
    store.dispatch('app.online', false);
    
    NotificationService.show('Anda sedang offline. Data akan disinkronkan saat online.', 'warning', {
      duration: 5000
    });
    
    // Show offline indicator
    document.getElementById('offline-indicator')?.style.display = 'flex';
  }
  
  /**
   * Save data for offline use
   */
  async saveOfflineData(type, data) {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      
      await store.put({
        id: type,
        type: type,
        data: data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }
  
  /**
   * Get offline data
   */
  async getOfflineData(type) {
    if (!this.db) return null;
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(['offlineData'], 'readonly');
        const store = transaction.objectStore('offlineData');
        const request = store.get(type);
        
        request.onsuccess = () => {
          resolve(request.result?.data || null);
        };
        
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  
  /**
   * Add pending action
   */
  async addPendingAction(action, data) {
    if (!this.db) return;
    
    const pendingAction = {
      action: action,
      data: data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 5
    };
    
    try {
      const transaction = this.db.transaction(['pendingActions'], 'readwrite');
      const store = transaction.objectStore('pendingActions');
      
      await store.add(pendingAction);
      
      this.pendingActions.push(pendingAction);
      
      // Register for background sync
      this.registerBackgroundSync();
      
    } catch (error) {
      console.error('Failed to add pending action:', error);
    }
  }
  
  /**
   * Load pending actions
   */
  async loadPendingActions() {
    if (!this.db) return;
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(['pendingActions'], 'readonly');
        const store = transaction.objectStore('pendingActions');
        const request = store.getAll();
        
        request.onsuccess = () => {
          this.pendingActions = request.result || [];
          resolve();
        };
        
        request.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
  
  /**
   * Sync pending actions
   */
  async syncPendingActions() {
    if (this.syncInProgress || this.pendingActions.length === 0) return;
    
    this.syncInProgress = true;
    
    const actions = [...this.pendingActions];
    
    for (const action of actions) {
      try {
        await this.executeAction(action);
        await this.removePendingAction(action.id);
      } catch (error) {
        console.error(`Failed to sync action ${action.action}:`, error);
        
        // Increment retries
        action.retries++;
        
        if (action.retries >= action.maxRetries) {
          await this.removePendingAction(action.id);
          console.warn(`Action ${action.action} exceeded max retries, removed`);
        }
      }
    }
    
    this.syncInProgress = false;
  }
  
  /**
   * Execute pending action
   */
  async executeAction(action) {
    switch (action.action) {
      case 'suratMasuk.create':
        return api.createSuratMasuk(action.data);
        
      case 'suratMasuk.update':
        return api.updateSuratMasuk(action.data.id, action.data);
        
      case 'suratKeluar.create':
        return api.createSuratKeluar(action.data);
        
      case 'disposisi.create':
        return api.createDisposisi(action.data);
        
      case 'file.upload':
        return api.uploadFile(action.data.file);
        
      default:
        return api.post(action.action, action.data);
    }
  }
  
  /**
   * Remove pending action
   */
  async removePendingAction(id) {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['pendingActions'], 'readwrite');
      const store = transaction.objectStore('pendingActions');
      await store.delete(id);
      
      this.pendingActions = this.pendingActions.filter(a => a.id !== id);
    } catch (error) {
      console.error('Failed to remove pending action:', error);
    }
  }
  
  /**
   * Register background sync
   */
  async registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-data');
        console.log('Background sync registered');
      } catch (error) {
        console.warn('Background sync not available:', error);
      }
    }
  }
  
  /**
   * Save file for offline
   */
  async saveFileOffline(fileId, file) {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['offlineFiles'], 'readwrite');
      const store = transaction.objectStore('offlineFiles');
      
      await store.put({
        id: fileId,
        file: file,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to save offline file:', error);
    }
  }
  
  /**
   * Get offline file
   */
  async getOfflineFile(fileId) {
    if (!this.db) return null;
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(['offlineFiles'], 'readonly');
        const store = transaction.objectStore('offlineFiles');
        const request = store.get(fileId);
        
        request.onsuccess = () => {
          resolve(request.result?.file || null);
        };
        
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  
  /**
   * Refresh data after coming online
   */
  async refreshData() {
    try {
      // Refresh dashboard
      const stats = await api.getDashboardStats();
      if (stats.status === 'success') {
        store.dispatch('data.dashboard.stats', stats.data);
      }
      
      // Refresh notifications
      const unread = await api.getUnreadCount();
      if (unread.status === 'success') {
        store.dispatch('data.notifications.unreadCount', unread.data.count);
      }
      
      // Refresh current page data
      const currentRoute = store.getState('ui.currentRoute');
      if (currentRoute) {
        router.reload();
      }
    } catch (error) {
      console.warn('Failed to refresh data:', error);
    }
  }
  
  /**
   * Check if online
   */
  isOnlineStatus() {
    return this.isOnline;
  }
  
  /**
   * Get pending actions count
   */
  getPendingCount() {
    return this.pendingActions.length;
  }
  
  /**
   * Clear all offline data
   */
  async clearOfflineData() {
    if (!this.db) return;
    
    try {
      const stores = ['offlineData', 'pendingActions', 'offlineFiles'];
      
      for (const storeName of stores) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await store.clear();
      }
      
      this.pendingActions = [];
      console.log('Offline data cleared');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }
  
  /**
   * Get storage usage
   */
  async getStorageUsage() {
    if (!navigator.storage || !navigator.storage.estimate) return null;
    
    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        percent: Math.round((estimate.usage / estimate.quota) * 100)
      };
    } catch {
      return null;
    }
  }
}

// Singleton instance
const OfflineService = new OfflineService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OfflineService };
}
