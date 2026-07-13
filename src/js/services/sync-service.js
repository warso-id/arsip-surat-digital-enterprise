/**
 * SYNC SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Data synchronization between client and server
 */

class SyncService {
  constructor() {
    this.syncQueue = [];
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.syncInterval = 60000; // 1 minute
    this.syncTimer = null;
    this.listeners = [];
  }
  
  /**
   * Initialize sync service
   */
  init() {
    // Load sync queue from storage
    this.loadQueue();
    
    // Setup periodic sync
    this.startPeriodicSync();
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Listen for visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.sync();
      }
    });
    
    console.log('✅ Sync Service initialized');
  }
  
  /**
   * Add to sync queue
   */
  async addToQueue(action, data, options = {}) {
    const queueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: options.maxRetries || 5,
      priority: options.priority || 'normal', // high, normal, low
      status: 'pending'
    };
    
    this.syncQueue.push(queueItem);
    this.saveQueue();
    
    // Try to sync immediately if online
    if (navigator.onLine && !this.isSyncing) {
      this.processQueue();
    }
    
    return queueItem.id;
  }
  
  /**
   * Process sync queue
   */
  async processQueue() {
    if (this.isSyncing || this.syncQueue.length === 0) return;
    
    this.isSyncing = true;
    this.notifyListeners('sync:start');
    
    // Sort by priority
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    this.syncQueue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    const items = [...this.syncQueue];
    let successCount = 0;
    let failCount = 0;
    
    for (const item of items) {
      if (item.status === 'processing') continue;
      
      item.status = 'processing';
      this.notifyListeners('sync:item:start', item);
      
      try {
        await this.executeSyncItem(item);
        item.status = 'completed';
        successCount++;
        this.notifyListeners('sync:item:complete', item);
      } catch (error) {
        item.retries++;
        
        if (item.retries >= item.maxRetries) {
          item.status = 'failed';
          item.error = error.message;
          failCount++;
          this.notifyListeners('sync:item:failed', item);
        } else {
          item.status = 'pending';
          // Exponential backoff
          item.nextRetry = Date.now() + Math.pow(2, item.retries) * 1000;
          this.notifyListeners('sync:item:retry', item);
        }
      }
    }
    
    // Remove completed items
    this.syncQueue = this.syncQueue.filter(item => item.status === 'pending' || item.status === 'failed');
    this.saveQueue();
    
    this.lastSyncTime = Date.now();
    this.isSyncing = false;
    
    this.notifyListeners('sync:complete', { successCount, failCount });
    
    // Notify user if there were failures
    if (failCount > 0 && successCount > 0) {
      NotificationService.warning(
        `${successCount} item disinkronkan, ${failCount} gagal`,
        'Sinkronisasi Sebagian'
      );
    }
  }
  
  /**
   * Execute sync item
   */
  async executeSyncItem(item) {
    const actionMap = {
      'suratMasuk.create': () => api.createSuratMasuk(item.data),
      'suratMasuk.update': () => api.updateSuratMasuk(item.data.id, item.data),
      'suratMasuk.delete': () => api.deleteSuratMasuk(item.data.id),
      'suratMasuk.updateStatus': () => api.updateSuratMasukStatus(item.data.id, item.data.status),
      'suratKeluar.create': () => api.createSuratKeluar(item.data),
      'suratKeluar.update': () => api.updateSuratKeluar(item.data.id, item.data),
      'suratKeluar.delete': () => api.deleteSuratKeluar(item.data.id),
      'disposisi.create': () => api.createDisposisi(item.data),
      'disposisi.tindakLanjut': () => api.tindakLanjutDisposisi(item.data.id, item.data),
      'disposisi.updateStatus': () => api.updateDisposisiStatus(item.data.id, item.data.status),
      'file.upload': () => api.uploadFile(item.data.file),
      'file.delete': () => api.deleteFile(item.data.id),
      'approval.process': () => api.post('approval.process', item.data)
    };
    
    const executor = actionMap[item.action];
    if (executor) {
      return executor();
    }
    
    // Generic API call
    return api.post(item.action, item.data);
  }
  
  /**
   * Sync all pending data
   */
  async sync() {
    if (!navigator.onLine) {
      console.log('Offline, sync postponed');
      return;
    }
    
    // Process queue
    await this.processQueue();
    
    // Refresh data
    await this.refreshData();
  }
  
  /**
   * Force sync
   */
  async forceSync() {
    NotificationService.show('Menyinkronkan data...', 'info', { duration: 2000 });
    await this.sync();
    NotificationService.success('Sinkronisasi selesai');
  }
  
  /**
   * Refresh data from server
   */
  async refreshData() {
    try {
      // Refresh dashboard if on dashboard page
      const currentRoute = store.getState('ui.currentRoute');
      if (currentRoute?.path === '/' || currentRoute?.path === '/dashboard') {
        const stats = await api.getDashboardStats();
        if (stats.status === 'success') {
          store.dispatch('data.dashboard.stats', stats.data);
        }
      }
      
      // Refresh notifications
      if (AuthService.isAuthenticated()) {
        const unread = await api.getUnreadCount();
        if (unread.status === 'success') {
          store.dispatch('data.notifications.unreadCount', unread.data.count);
        }
      }
    } catch (error) {
      console.warn('Data refresh failed:', error);
    }
  }
  
  /**
   * Handle coming online
   */
  async handleOnline() {
    console.log('🌐 Online - Starting sync...');
    store.dispatch('app.online', true);
    
    // Hide offline indicator
    document.getElementById('offline-indicator')?.style.display = 'none';
    
    await this.sync();
  }
  
  /**
   * Handle going offline
   */
  handleOffline() {
    console.log('📡 Offline - Queueing changes');
    store.dispatch('app.online', false);
    
    // Show offline indicator
    document.getElementById('offline-indicator')?.style.display = 'flex';
  }
  
  /**
   * Start periodic sync
   */
  startPeriodicSync() {
    this.stopPeriodicSync();
    
    this.syncTimer = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.processQueue();
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
   * Get sync status
   */
  getStatus() {
    return {
      isSyncing: this.isSyncing,
      queueLength: this.syncQueue.length,
      lastSyncTime: this.lastSyncTime,
      pendingItems: this.syncQueue.filter(i => i.status === 'pending').length,
      failedItems: this.syncQueue.filter(i => i.status === 'failed').length,
      online: navigator.onLine
    };
  }
  
  /**
   * Get pending items
   */
  getPendingItems() {
    return this.syncQueue.filter(i => i.status === 'pending');
  }
  
  /**
   * Get failed items
   */
  getFailedItems() {
    return this.syncQueue.filter(i => i.status === 'failed');
  }
  
  /**
   * Retry failed items
   */
  async retryFailed() {
    const failedItems = this.getFailedItems();
    
    for (const item of failedItems) {
      item.status = 'pending';
      item.retries = 0;
    }
    
    this.saveQueue();
    await this.processQueue();
  }
  
  /**
   * Remove item from queue
   */
  removeFromQueue(id) {
    this.syncQueue = this.syncQueue.filter(item => item.id !== id);
    this.saveQueue();
  }
  
  /**
   * Clear queue
   */
  clearQueue() {
    this.syncQueue = [];
    this.saveQueue();
  }
  
  /**
   * Save queue to storage
   */
  saveQueue() {
    try {
      const serializable = this.syncQueue.map(item => ({
        ...item,
        data: this.serializeData(item.data)
      }));
      localStorage.setItem('asd_sync_queue', JSON.stringify(serializable));
    } catch (error) {
      console.warn('Failed to save sync queue:', error);
    }
  }
  
  /**
   * Load queue from storage
   */
  loadQueue() {
    try {
      const stored = localStorage.getItem('asd_sync_queue');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }
  
  /**
   * Serialize data for storage
   */
  serializeData(data) {
    if (!data) return data;
    
    const serialized = { ...data };
    
    // Remove File objects (can't be serialized)
    Object.keys(serialized).forEach(key => {
      if (serialized[key] instanceof File) {
        serialized[key] = { _type: 'File', name: serialized[key].name };
      }
      if (serialized[key] instanceof Blob) {
        serialized[key] = { _type: 'Blob', size: serialized[key].size };
      }
    });
    
    return serialized;
  }
  
  /**
   * Add sync listener
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notify listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    });
  }
  
  /**
   * Get sync statistics
   */
  getStats() {
    const now = Date.now();
    const hourAgo = now - 3600000;
    const dayAgo = now - 86400000;
    
    return {
      queueLength: this.syncQueue.length,
      lastSync: this.lastSyncTime,
      lastSyncRelative: this.lastSyncTime ? Formatters.relativeTime(this.lastSyncTime) : 'Belum pernah',
      syncedLastHour: this.syncQueue.filter(i => i.status === 'completed' && i.timestamp > hourAgo).length,
      syncedLastDay: this.syncQueue.filter(i => i.status === 'completed' && i.timestamp > dayAgo).length,
      failedLastDay: this.syncQueue.filter(i => i.status === 'failed' && i.timestamp > dayAgo).length
    };
  }
}

// Singleton instance
const SyncService = new SyncService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SyncService };
}
