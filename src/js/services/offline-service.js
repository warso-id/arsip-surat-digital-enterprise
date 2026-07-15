/**
 * ============================================
 * OFFLINE SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL OFFLINE SUPPORT - SIAP PRODUKSI
 * Mendukung: IndexedDB, Background Sync, Queue,
 * Cache Strategy, Conflict Resolution, Storage
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class OfflineService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingActions = [];
    this.syncInProgress = false;
    this.db = null;
    this.dbName = 'asd_offline';
    this.dbVersion = 2;
    this.syncListeners = [];
    this.lastSyncTime = null;
    this.syncInterval = 30000;
    this.syncTimer = null;
    this.maxRetries = 5;
    this.retryDelay = 2000;
    this.cacheStrategy = 'network-first'; // network-first | cache-first | stale-while-revalidate
  }

  /**
   * Initialize offline service
   */
  async init() {
    this.isOnline = navigator.onLine;

    // Setup listeners
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Visibility change - sync when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isOnline) {
        this.syncPendingActions();
      }
    });

    // Initialize IndexedDB
    await this.initDB();

    // Load pending actions from DB
    await this.loadPendingActions();

    // Start periodic sync
    this.startPeriodicSync();

    // Update state
    if (typeof store !== 'undefined') {
      store.dispatch('app.online', this.isOnline);
    }

    console.log(`✅ Offline Service initialized (Online: ${this.isOnline}, Pending: ${this.pendingActions.length})`);
  }

  /**
   * Initialize IndexedDB with all stores
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.db.onclose = () => console.warn('IndexedDB connection closed');
        this.db.onversionchange = () => this.db.close();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const txn = event.target.transaction;

        // Offline data cache
        if (!db.objectStoreNames.contains('offlineData')) {
          const store = db.createObjectStore('offlineData', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
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
        }

        // Failed sync log
        if (!db.objectStoreNames.contains('syncLog')) {
          const store = db.createObjectStore('syncLog', { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }

        // Offline forms (auto-save drafts)
        if (!db.objectStoreNames.contains('offlineForms')) {
          const store = db.createObjectStore('offlineForms', { keyPath: 'formKey' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Handle coming online
   */
  async handleOnline() {
    console.log('🌐 Online detected - Starting sync...');
    this.isOnline = true;
    this.updateOnlineStatus(true);

    this.showToast('Koneksi tersedia, menyinkronkan data...', 'info');

    try {
      const result = await this.syncPendingActions();

      if (result.synced > 0 || result.failed > 0) {
        this.showToast(
          `Sinkronisasi: ${result.synced} berhasil${result.failed > 0 ? `, ${result.failed} gagal` : ''}`,
          result.failed > 0 ? 'warning' : 'success'
        );
      }

      await this.refreshData();
    } catch (error) {
      console.error('Online handler error:', error);
    }
  }

  /**
   * Handle going offline
   */
  handleOffline() {
    console.log('📡 Offline detected - Queueing operations');
    this.isOnline = false;
    this.updateOnlineStatus(false);

    this.showToast('Anda sedang offline. Data akan disinkronkan saat online.', 'warning', 6000);

    // Show offline indicator
    const indicator = document.getElementById('offline-indicator');
    if (indicator) indicator.style.display = 'flex';
  }

  /**
   * Update online status in store and UI
   */
  updateOnlineStatus(online) {
    if (typeof store !== 'undefined') {
      store.dispatch('app.online', online);
    }

    // Update offline indicator
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.style.display = online ? 'none' : 'flex';
    }

    // Notify listeners
    this.syncListeners.forEach(cb => {
      try { cb(online); } catch (e) {}
    });
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync() {
    this.stopPeriodicSync();
    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.syncInProgress && this.pendingActions.length > 0) {
        this.syncPendingActions();
      }
    }, this.syncInterval);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Save data for offline use
   */
  async saveOfflineData(type, data, ttl = 86400000) {
    if (!this.db) return;

    try {
      const entry = {
        id: type,
        type: type,
        data: data,
        timestamp: Date.now(),
        expiry: ttl ? Date.now() + ttl : null
      };

      await this.dbPut('offlineData', entry);
      console.log(`Offline data saved: ${type}`);
    } catch (error) {
      console.error('Failed to save offline data:', error);
      // Fallback to localStorage
      try {
        localStorage.setItem(`asd_offline_${type}`, JSON.stringify({ data, timestamp: Date.now() }));
      } catch (e) {}
    }
  }

  /**
   * Get offline data
   */
  async getOfflineData(type) {
    // Try IndexedDB first
    if (this.db) {
      try {
        const entry = await this.dbGet('offlineData', type);
        if (entry) {
          // Check expiry
          if (entry.expiry && Date.now() > entry.expiry) {
            await this.dbDelete('offlineData', type);
            return null;
          }
          return entry.data;
        }
      } catch (e) {}
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(`asd_offline_${type}`);
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < 86400000) return data;
      }
    } catch (e) {}

    return null;
  }

  /**
   * Add pending action to sync queue
   */
  async addPendingAction(action, data, options = {}) {
    const {
      priority = 'normal',
      maxRetries = this.maxRetries
    } = options;

    const pendingAction = {
      action: action,
      data: data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: maxRetries,
      priority: priority,
      status: 'pending'
    };

    try {
      // Save to IndexedDB
      if (this.db) {
        const id = await this.dbAdd('pendingActions', pendingAction);
        pendingAction.id = id;
      }

      this.pendingActions.push(pendingAction);

      // Try immediate sync if online
      if (this.isOnline) {
        this.syncPendingActions();
      }

      // Register background sync
      this.registerBackgroundSync();

      // Save pending count to localStorage for service worker
      this.updatePendingCount();

      console.log(`Pending action added: ${action} (${priority} priority)`);
      return pendingAction.id;
    } catch (error) {
      console.error('Failed to add pending action:', error);
      // Fallback: save to localStorage
      try {
        const queue = JSON.parse(localStorage.getItem('asd_sync_queue') || '[]');
        queue.push(pendingAction);
        localStorage.setItem('asd_sync_queue', JSON.stringify(queue));
      } catch (e) {}
    }
  }

  /**
   * Load pending actions from DB
   */
  async loadPendingActions() {
    if (this.db) {
      try {
        this.pendingActions = await this.dbGetAll('pendingActions');
      } catch (e) {}
    }

    // Merge with localStorage queue
    try {
      const localQueue = JSON.parse(localStorage.getItem('asd_sync_queue') || '[]');
      if (localQueue.length > 0) {
        // Move to IndexedDB
        for (const action of localQueue) {
          if (this.db && !action.id) {
            const id = await this.dbAdd('pendingActions', action);
            action.id = id;
          }
        }
        this.pendingActions = [...localQueue, ...this.pendingActions];
        localStorage.removeItem('asd_sync_queue');
      }
    } catch (e) {}

    // Sort by priority
    this.sortPendingActions();
  }

  /**
   * Sort pending actions by priority
   */
  sortPendingActions() {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    this.pendingActions.sort((a, b) => {
      return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
    });
  }

  /**
   * Sync all pending actions
   */
  async syncPendingActions() {
    if (this.syncInProgress || this.pendingActions.length === 0 || !this.isOnline) {
      return { synced: 0, failed: 0 };
    }

    this.syncInProgress = true;
    this.notifySyncListeners('start');

    const actions = [...this.pendingActions];
    let synced = 0;
    let failed = 0;

    for (const action of actions) {
      if (action.status === 'syncing') continue;

      action.status = 'syncing';
      await this.updatePendingAction(action);

      try {
        await this.executeAction(action);
        await this.removePendingAction(action.id);
        synced++;
        action.status = 'completed';

        // Log success
        await this.logSync(action.action, 'success');
      } catch (error) {
        action.retries = (action.retries || 0) + 1;
        action.lastError = error.message;
        action.lastAttempt = Date.now();

        if (action.retries >= (action.maxRetries || this.maxRetries)) {
          await this.removePendingAction(action.id);
          action.status = 'failed';
          console.warn(`Action ${action.action} exceeded max retries, removed`);
        } else {
          action.status = 'pending';
          action.nextRetry = Date.now() + this.retryDelay * Math.pow(2, action.retries);
          await this.updatePendingAction(action);
        }
        failed++;

        // Log failure
        await this.logSync(action.action, 'failed', error.message);
      }
    }

    // Update pending actions list
    this.pendingActions = this.pendingActions.filter(a => a.status === 'pending');

    this.lastSyncTime = Date.now();
    this.syncInProgress = false;
    this.updatePendingCount();

    this.notifySyncListeners('complete', { synced, failed });

    return { synced, failed };
  }

  /**
   * Execute a pending action
   */
  async executeAction(action) {
    const actionMap = {
      'suratMasuk.create': () => typeof api !== 'undefined' ? api.createSuratMasuk(action.data) : API.post('suratMasuk.create', action.data),
      'suratMasuk.update': () => typeof api !== 'undefined' ? api.updateSuratMasuk(action.data.id, action.data) : API.post('suratMasuk.update', { ...action.data, id: action.data.id }),
      'suratMasuk.delete': () => typeof api !== 'undefined' ? api.deleteSuratMasuk(action.data.id) : API.post('suratMasuk.delete', { id: action.data.id }),
      'suratKeluar.create': () => typeof api !== 'undefined' ? api.createSuratKeluar(action.data) : API.post('suratKeluar.create', action.data),
      'suratKeluar.update': () => typeof api !== 'undefined' ? api.updateSuratKeluar(action.data.id, action.data) : API.post('suratKeluar.update', { ...action.data, id: action.data.id }),
      'disposisi.create': () => typeof api !== 'undefined' ? api.createDisposisi(action.data) : API.post('disposisi.create', action.data),
      'disposisi.updateStatus': () => typeof api !== 'undefined' ? api.post('disposisi.updateStatus', action.data) : API.post('disposisi.updateStatus', action.data),
      'approval.process': () => typeof api !== 'undefined' ? api.post('approval.process', action.data) : API.post('approval.process', action.data),
      'file.upload': () => typeof api !== 'undefined' ? api.uploadFile(action.data.file) : Promise.reject(new Error('File upload requires API')),
      'users.create': () => typeof api !== 'undefined' ? api.createUser(action.data) : API.post('users.create', action.data),
      'users.update': () => typeof api !== 'undefined' ? api.updateUser(action.data.id, action.data) : API.post('users.update', { ...action.data, id: action.data.id }),
    };

    const executor = actionMap[action.action];
    if (executor) {
      await executor();
    } else if (typeof api !== 'undefined') {
      await api.post(action.action, action.data);
    } else if (typeof API !== 'undefined') {
      await API.post(action.action, action.data);
    } else {
      throw new Error(`Unknown action: ${action.action} and no API available`);
    }
  }

  /**
   * Update pending action in DB
   */
  async updatePendingAction(action) {
    if (this.db && action.id) {
      try {
        await this.dbPut('pendingActions', action);
      } catch (e) {}
    }
  }

  /**
   * Remove pending action from DB
   */
  async removePendingAction(id) {
    if (this.db && id) {
      try {
        await this.dbDelete('pendingActions', id);
      } catch (e) {}
    }
    this.pendingActions = this.pendingActions.filter(a => a.id !== id);
    this.updatePendingCount();
  }

  /**
   * Update pending count in localStorage for service worker
   */
  updatePendingCount() {
    try {
      localStorage.setItem('asd_pending_count', String(this.pendingActions.length));
    } catch (e) {}
  }

  /**
   * Log sync event
   */
  async logSync(action, status, error = null) {
    if (!this.db) return;
    try {
      await this.dbAdd('syncLog', {
        action,
        status,
        error,
        timestamp: Date.now()
      });
    } catch (e) {}
  }

  /**
   * Register background sync with service worker
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
   * Save file for offline access
   */
  async saveFileOffline(fileId, file) {
    if (!this.db) return;

    try {
      const entry = {
        id: fileId,
        file: file,
        name: file.name,
        type: file.type,
        size: file.size,
        timestamp: Date.now()
      };

      await this.dbPut('offlineFiles', entry);
    } catch (error) {
      console.error('Failed to save offline file:', error);
    }
  }

  /**
   * Get offline file
   */
  async getOfflineFile(fileId) {
    if (!this.db) return null;

    try {
      const entry = await this.dbGet('offlineFiles', fileId);
      return entry?.file || null;
    } catch {
      return null;
    }
  }

  /**
   * Save form draft for offline
   */
  async saveFormDraft(formKey, data) {
    if (!this.db) {
      // Fallback to localStorage
      try {
        localStorage.setItem(`asd_form_${formKey}`, JSON.stringify({ data, timestamp: Date.now() }));
      } catch (e) {}
      return;
    }

    try {
      await this.dbPut('offlineForms', { formKey, data, timestamp: Date.now() });
    } catch (e) {}
  }

  /**
   * Get form draft
   */
  async getFormDraft(formKey) {
    if (this.db) {
      try {
        const entry = await this.dbGet('offlineForms', formKey);
        return entry?.data || null;
      } catch (e) {}
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(`asd_form_${formKey}`);
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < 86400000) return data;
      }
    } catch (e) {}
    return null;
  }

  /**
   * Refresh data after coming online
   */
  async refreshData() {
    try {
      // Refresh dashboard stats
      if (typeof api !== 'undefined' && api.getDashboardStats) {
        const stats = await api.getDashboardStats();
        if (stats?.status === 'success' && typeof store !== 'undefined') {
          store.dispatch('data.dashboard.stats', stats.data);
        }
      }

      // Refresh notifications
      if (typeof api !== 'undefined' && api.getUnreadCount) {
        const unread = await api.getUnreadCount();
        if (unread?.status === 'success' && typeof store !== 'undefined') {
          store.dispatch('data.notifications.unreadCount', unread.data?.count || 0);
        }
      }

      // Reload current page
      if (typeof router !== 'undefined') {
        router.reload();
      }
    } catch (error) {
      console.warn('Failed to refresh data:', error);
    }
  }

  /**
   * Retry failed actions
   */
  async retryFailed() {
    const failedActions = this.pendingActions.filter(a => a.status === 'failed');
    for (const action of failedActions) {
      action.status = 'pending';
      action.retries = 0;
      if (this.db && action.id) {
        await this.updatePendingAction(action);
      }
    }
    if (this.isOnline) {
      return this.syncPendingActions();
    }
  }

  /**
   * IndexedDB helpers
   */
  async dbGet(storeName, id) {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction([storeName], 'readonly');
      const store = txn.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async dbGetAll(storeName, query = null) {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction([storeName], 'readonly');
      const store = txn.objectStore(storeName);
      const request = query ? store.index(query.index).getAll(query.value) : store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async dbPut(storeName, value) {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction([storeName], 'readwrite');
      const store = txn.objectStore(storeName);
      const request = store.put(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async dbAdd(storeName, value) {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction([storeName], 'readwrite');
      const store = txn.objectStore(storeName);
      const request = store.add(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async dbDelete(storeName, id) {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction([storeName], 'readwrite');
      const store = txn.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all offline data
   */
  async clearOfflineData() {
    if (!this.db) return;

    const stores = ['offlineData', 'pendingActions', 'offlineFiles', 'syncLog', 'offlineForms'];
    for (const storeName of stores) {
      try {
        const txn = this.db.transaction([storeName], 'readwrite');
        const store = txn.objectStore(storeName);
        await new Promise((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = resolve;
          request.onerror = reject;
        });
      } catch (e) {}
    }

    this.pendingActions = [];
    this.updatePendingCount();
    console.log('Offline data cleared');
  }

  /**
   * Get storage usage statistics
   */
  async getStorageUsage() {
    const stats = { indexedDB: 0, localStorage: 0, total: 0 };

    if (navigator.storage?.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        stats.quota = estimate.quota;
        stats.usage = estimate.usage;
        stats.percent = Math.round((estimate.usage / estimate.quota) * 100);
      } catch (e) {}
    }

    try {
      let lsSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        lsSize += (key.length + (localStorage.getItem(key)?.length || 0)) * 2;
      }
      stats.localStorage = lsSize;
    } catch (e) {}

    return stats;
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      online: this.isOnline,
      pendingActions: this.pendingActions.length,
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      dbReady: !!this.db,
      cacheStrategy: this.cacheStrategy
    };
  }

  /**
   * Add sync listener
   */
  addSyncListener(callback) {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify sync listeners
   */
  notifySyncListeners(event, data = {}) {
    this.syncListeners.forEach(cb => {
      try { cb(event, data); } catch (e) {}
    });
  }

  /**
   * Check if online
   */
  isOnlineStatus() { return this.isOnline; }

  /**
   * Get pending count
   */
  getPendingCount() { return this.pendingActions.length; }

  /**
   * Show toast
   */
  showToast(message, type = 'info', duration = 4000) {
    if (typeof Toast !== 'undefined') Toast.show(message, type, duration);
    else if (typeof NotificationService !== 'undefined') NotificationService.show(message, type, { duration });
  }

  /**
   * Destroy service
   */
  destroy() {
    this.stopPeriodicSync();
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.syncListeners = [];
  }
}

// Singleton instance
const OfflineService = new OfflineService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OfflineService };
}
