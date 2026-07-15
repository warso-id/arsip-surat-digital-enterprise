/**
 * ============================================
 * SYNC SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL DATA SYNCHRONIZATION - SIAP PRODUKSI
 * Mendukung: Queue, Priority, Retry, Conflict,
 * Periodic, Manual, Background, Analytics
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class SyncService {
  constructor() {
    this.syncQueue = [];
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.syncInterval = 30000; // 30 seconds
    this.syncTimer = null;
    this.listeners = {};
    this.maxRetries = 5;
    this.retryBaseDelay = 1000;
    this.conflictResolution = 'server-wins'; // server-wins | client-wins | manual
    this.syncStats = {
      totalSynced: 0,
      totalFailed: 0,
      totalConflicts: 0,
      averageSyncTime: 0,
      syncHistory: []
    };
  }

  /**
   * Initialize sync service
   */
  init() {
    this.loadQueue();
    this.startPeriodicSync();

    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine && !this.isSyncing) {
        this.processQueue();
      }
    });

    // Listen for storage events (cross-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === 'asd_sync_queue') {
        this.loadQueue();
      }
    });

    console.log('✅ Sync Service initialized');
  }

  /**
   * Add item to sync queue
   */
  async addToQueue(action, data, options = {}) {
    const queueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      data: this.cloneData(data),
      timestamp: Date.now(),
      retries: 0,
      maxRetries: options.maxRetries || this.maxRetries,
      priority: options.priority || 'normal', // high | normal | low
      status: 'pending', // pending | processing | completed | failed | conflict
      error: null,
      nextRetry: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.syncQueue.push(queueItem);
    this.sortQueue();
    this.saveQueue();

    // Try immediate sync if online
    if (navigator.onLine && !this.isSyncing) {
      this.processQueue();
    }

    // Register background sync if available
    this.registerBackgroundSync();

    this.emit('item:added', queueItem);
    return queueItem.id;
  }

  /**
   * Process sync queue
   */
  async processQueue() {
    if (this.isSyncing || this.syncQueue.length === 0 || !navigator.onLine) return;

    this.isSyncing = true;
    const startTime = performance.now();

    this.emit('sync:start', { queueLength: this.syncQueue.length });

    const pendingItems = this.syncQueue.filter(i => i.status === 'pending');
    let successCount = 0;
    let failCount = 0;
    let conflictCount = 0;

    for (const item of pendingItems) {
      // Skip if next retry is in the future
      if (item.nextRetry && Date.now() < item.nextRetry) continue;

      item.status = 'processing';
      item.updatedAt = Date.now();
      this.saveQueue();
      this.emit('item:processing', item);

      try {
        const result = await this.executeSyncItem(item);

        if (result?.conflict) {
          // Handle conflict
          conflictCount++;
          const resolved = await this.resolveConflict(item, result);
          if (resolved) {
            item.status = 'completed';
            successCount++;
          } else {
            item.status = 'conflict';
            item.error = 'Conflict unresolved';
          }
        } else {
          item.status = 'completed';
          successCount++;
        }

        this.emit('item:completed', item);

      } catch (error) {
        item.retries++;
        item.error = error.message;
        item.updatedAt = Date.now();

        if (item.retries >= item.maxRetries) {
          item.status = 'failed';
          failCount++;
          this.emit('item:failed', item);
        } else {
          item.status = 'pending';
          item.nextRetry = Date.now() + this.retryBaseDelay * Math.pow(2, item.retries);
          this.emit('item:retry', item);
        }
      }

      this.saveQueue();
    }

    // Clean completed items (keep failed for review)
    const completedIds = this.syncQueue
      .filter(i => i.status === 'completed')
      .map(i => i.id);
    
    if (completedIds.length > 0) {
      this.syncQueue = this.syncQueue.filter(i => !completedIds.includes(i.id));
      this.saveQueue();
    }

    const duration = performance.now() - startTime;
    this.lastSyncTime = Date.now();
    this.isSyncing = false;

    // Update stats
    this.syncStats.totalSynced += successCount;
    this.syncStats.totalFailed += failCount;
    this.syncStats.totalConflicts += conflictCount;
    this.syncStats.averageSyncTime = Math.round(
      (this.syncStats.averageSyncTime * (this.syncStats.syncHistory.length) + duration) /
      (this.syncStats.syncHistory.length + 1)
    );
    this.syncStats.syncHistory.push({
      timestamp: Date.now(),
      duration: Math.round(duration),
      successCount,
      failCount,
      conflictCount
    });
    if (this.syncStats.syncHistory.length > 100) {
      this.syncStats.syncHistory.shift();
    }

    this.emit('sync:complete', { successCount, failCount, conflictCount, duration: Math.round(duration) });

    // Show notification if there were failures
    if (failCount > 0) {
      this.showToast(
        `${successCount} berhasil, ${failCount} gagal disinkronkan`,
        failCount > successCount ? 'error' : 'warning'
      );
    }

    // Refresh data after sync
    if (successCount > 0) {
      await this.refreshData();
    }
  }

  /**
   * Execute a sync item
   */
  async executeSyncItem(item) {
    const { action, data } = item;

    // Try API service first
    if (typeof api !== 'undefined') {
      // Map common actions to API methods
      const apiMethodMap = {
        'suratMasuk.create': () => api.post('suratMasuk.create', data),
        'suratMasuk.update': () => api.post('suratMasuk.update', { ...data, id: data.id }),
        'suratMasuk.delete': () => api.post('suratMasuk.delete', { id: data.id }),
        'suratMasuk.updateStatus': () => api.post('suratMasuk.updateStatus', { id: data.id, status: data.status }),
        'suratKeluar.create': () => api.post('suratKeluar.create', data),
        'suratKeluar.update': () => api.post('suratKeluar.update', { ...data, id: data.id }),
        'suratKeluar.delete': () => api.post('suratKeluar.delete', { id: data.id }),
        'suratKeluar.submitApproval': () => api.post('suratKeluar.submitApproval', { id: data.id }),
        'disposisi.create': () => api.post('disposisi.create', data),
        'disposisi.createMultiple': () => api.post('disposisi.createMultiple', data),
        'disposisi.tindakLanjut': () => api.post('disposisi.tindakLanjut', { id: data.id, ...data }),
        'disposisi.updateStatus': () => api.post('disposisi.updateStatus', { id: data.id, status: data.status }),
        'disposisi.eskalasi': () => api.post('disposisi.eskalasi', { id: data.id, ...data }),
        'approval.process': () => api.post('approval.process', { id: data.id, ...data }),
        'approval.multiLevel': () => api.post('approval.multiLevel', { id: data.id, ...data }),
        'users.create': () => api.post('users.create', data),
        'users.update': () => api.post('users.update', { id: data.id, ...data }),
        'users.delete': () => api.post('users.delete', { id: data.id }),
        'file.upload': () => api.uploadFile(data.file, data.onProgress),
        'file.delete': () => api.post('file.delete', { id: data.id }),
        'config.update': () => api.post('config.update', data),
      };

      const executor = apiMethodMap[action];
      if (executor) {
        return executor();
      }

      // Generic API call
      return api.post(action, data);
    }

    // Fallback to generic API
    if (typeof API !== 'undefined') {
      return API.post(action, data);
    }

    // Direct fetch fallback
    const url = this.getApiUrl() + '?action=' + action;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  /**
   * Resolve sync conflict
   */
  async resolveConflict(item, serverResult) {
    const { conflictResolution } = this;

    switch (conflictResolution) {
      case 'server-wins':
        // Accept server version
        return true;

      case 'client-wins':
        // Force client version (retry)
        item.retries = 0;
        return false;

      case 'manual':
        // Emit event for manual resolution
        this.emit('conflict', { item, serverResult });
        return false;

      default:
        return true;
    }
  }

  /**
   * Full sync (process queue + refresh)
   */
  async sync() {
    if (!navigator.onLine) {
      console.log('Offline, sync postponed');
      return { synced: 0, failed: 0 };
    }

    await this.processQueue();
    await this.refreshData();
    return this.getStatus();
  }

  /**
   * Force sync now
   */
  async forceSync() {
    this.showToast('🔄 Menyinkronkan data...', 'info');
    const result = await this.sync();
    this.showToast(
      `✅ Sinkronisasi selesai (${result.queueLength} item tersisa)`,
      'success'
    );
    return result;
  }

  /**
   * Refresh data from server
   */
  async refreshData() {
    try {
      // Refresh dashboard stats
      if (typeof store !== 'undefined') {
        const currentRoute = store.getState('ui.currentRoute');
        if (currentRoute?.path === '/' || currentRoute?.path === '/dashboard') {
          if (typeof api !== 'undefined') {
            const stats = await api.get('dashboard.stats');
            if (stats?.status === 'success') {
              store.dispatch('data.dashboard.stats', stats.data);
            }
          }
        }
      }

      // Refresh unread notifications
      if (typeof api !== 'undefined') {
        const unread = await api.get('notifikasi.unreadCount');
        if (unread?.status === 'success' && typeof store !== 'undefined') {
          store.dispatch('data.notifications.unreadCount', unread.data?.count || 0);
        }
      }

      // Reload current route
      if (typeof router !== 'undefined') {
        router.reload();
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
    if (typeof store !== 'undefined') store.dispatch('app.online', true);

    const indicator = document.getElementById('offline-indicator');
    if (indicator) indicator.style.display = 'none';

    await this.sync();
  }

  /**
   * Handle going offline
   */
  handleOffline() {
    console.log('📡 Offline - Queueing operations');
    if (typeof store !== 'undefined') store.dispatch('app.online', false);

    const indicator = document.getElementById('offline-indicator');
    if (indicator) indicator.style.display = 'flex';
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync() {
    this.stopPeriodicSync();
    this.syncTimer = setInterval(() => {
      if (navigator.onLine && !this.isSyncing && this.syncQueue.length > 0) {
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
   * Register background sync
   */
  async registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-data');
      } catch (error) {
        console.warn('Background sync registration failed:', error);
      }
    }
  }

  /**
   * Retry all failed items
   */
  async retryFailed() {
    const failedItems = this.syncQueue.filter(i => i.status === 'failed');
    for (const item of failedItems) {
      item.status = 'pending';
      item.retries = 0;
      item.nextRetry = null;
      item.error = null;
    }
    this.saveQueue();
    if (navigator.onLine) await this.processQueue();
  }

  /**
   * Retry specific item
   */
  async retryItem(itemId) {
    const item = this.syncQueue.find(i => i.id === itemId);
    if (item) {
      item.status = 'pending';
      item.retries = 0;
      item.nextRetry = null;
      item.error = null;
      this.saveQueue();
      if (navigator.onLine) await this.processQueue();
    }
  }

  /**
   * Remove item from queue
   */
  removeFromQueue(itemId) {
    this.syncQueue = this.syncQueue.filter(i => i.id !== itemId);
    this.saveQueue();
  }

  /**
   * Clear entire queue
   */
  clearQueue() {
    this.syncQueue = [];
    this.saveQueue();
  }

  /**
   * Clear completed items
   */
  clearCompleted() {
    this.syncQueue = this.syncQueue.filter(i => i.status !== 'completed');
    this.saveQueue();
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      isSyncing: this.isSyncing,
      queueLength: this.syncQueue.length,
      pendingCount: this.syncQueue.filter(i => i.status === 'pending').length,
      processingCount: this.syncQueue.filter(i => i.status === 'processing').length,
      failedCount: this.syncQueue.filter(i => i.status === 'failed').length,
      conflictCount: this.syncQueue.filter(i => i.status === 'conflict').length,
      lastSyncTime: this.lastSyncTime,
      lastSyncRelative: this.lastSyncTime ? this.formatRelativeTime(this.lastSyncTime) : 'Belum pernah',
      online: navigator.onLine,
      stats: this.syncStats
    };
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event, data) {
    (this.listeners[event] || []).forEach(cb => {
      try { cb(data); } catch (e) { console.error('Sync listener error:', e); }
    });
  }

  /**
   * Queue persistence
   */
  saveQueue() {
    try {
      const serialized = this.syncQueue.map(item => ({
        ...item,
        data: this.serializeData(item.data)
      }));
      localStorage.setItem('asd_sync_queue', JSON.stringify(serialized));
      localStorage.setItem('asd_sync_stats', JSON.stringify(this.syncStats));
    } catch (error) {
      console.warn('Failed to save sync queue:', error);
    }
  }

  loadQueue() {
    try {
      const stored = localStorage.getItem('asd_sync_queue');
      if (stored) this.syncQueue = JSON.parse(stored);

      const statsStored = localStorage.getItem('asd_sync_stats');
      if (statsStored) this.syncStats = JSON.parse(statsStored);
    } catch (error) {
      console.warn('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  sortQueue() {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    this.syncQueue.sort((a, b) => {
      if (a.priority !== b.priority) return priorityOrder[a.priority] - priorityOrder[b.priority];
      return a.timestamp - b.timestamp;
    });
  }

  serializeData(data) {
    if (!data) return data;
    const serialized = { ...data };
    Object.keys(serialized).forEach(key => {
      if (serialized[key] instanceof File) {
        serialized[key] = { _type: 'File', name: serialized[key].name, size: serialized[key].size, lastModified: serialized[key].lastModified };
      } else if (serialized[key] instanceof Blob) {
        serialized[key] = { _type: 'Blob', size: serialized[key].size, mimeType: serialized[key].type };
      }
    });
    return serialized;
  }

  cloneData(data) {
    try { return JSON.parse(JSON.stringify(data)); } catch { return data; }
  }

  // Utilities
  getApiUrl() { return (typeof APP_CONFIG !== 'undefined') ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : ''; }
  formatRelativeTime(t) { try { const s = Math.floor((Date.now() - t) / 1000); if (s < 60) return 'Baru saja'; if (s < 3600) return Math.floor(s / 60) + ' menit'; if (s < 86400) return Math.floor(s / 3600) + ' jam'; return Math.floor(s / 86400) + ' hari'; } catch { return '-'; } }
  showToast(m, t) { if (typeof Toast !== 'undefined') Toast.show(m, t); else if (typeof NotificationService !== 'undefined') NotificationService.show(m, t); }

  destroy() {
    this.stopPeriodicSync();
    this.listeners = {};
  }
}

// Singleton instance
const SyncService = new SyncService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SyncService };
}
