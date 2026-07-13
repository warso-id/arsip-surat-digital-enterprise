/**
 * BACKUP SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * System backup and restore functionality
 */

class BackupService {
  constructor() {
    this.backups = [];
    this.isBackingUp = false;
    this.isRestoring = false;
    this.autoBackupEnabled = false;
    this.autoBackupInterval = 86400000; // 24 hours
    this.autoBackupTimer = null;
  }
  
  /**
   * Initialize backup service
   */
  init() {
    this.loadBackupHistory();
    
    // Check auto-backup settings
    this.checkAutoBackup();
    
    console.log('✅ Backup Service initialized');
  }
  
  /**
   * Create backup
   */
  async createBackup(options = {}) {
    const {
      includeFiles = true,
      includeUsers = false,
      description = '',
      onProgress = null
    } = options;
    
    if (this.isBackingUp) {
      throw new Error('Backup sedang berlangsung');
    }
    
    this.isBackingUp = true;
    
    try {
      NotificationService.show('Membuat backup...', 'info', { duration: 0, id: 'backup-progress' });
      
      if (onProgress) onProgress(10);
      
      // Get data from server
      const response = await api.get('backup.create');
      
      if (onProgress) onProgress(50);
      
      if (response.status === 'success') {
        const backupData = response.data;
        
        // Add metadata
        const backup = {
          id: `backup-${Date.now()}`,
          timestamp: new Date().toISOString(),
          description: description || `Backup ${new Date().toLocaleDateString('id-ID')}`,
          version: APP_CONFIG.APP_VERSION,
          data: backupData,
          size: this.estimateBackupSize(backupData)
        };
        
        // Save to local storage
        this.saveBackupLocally(backup);
        
        // Add to history
        this.backups.unshift(backup);
        this.saveBackupHistory();
        
        if (onProgress) onProgress(100);
        
        NotificationService.show('Backup berhasil dibuat', 'success');
        
        return backup;
      }
      
      throw new Error(response.message || 'Backup gagal');
      
    } catch (error) {
      NotificationService.error('Backup gagal: ' + error.message);
      throw error;
    } finally {
      this.isBackingUp = false;
      NotificationService.dismiss('backup-progress');
    }
  }
  
  /**
   * Save backup locally
   */
  saveBackupLocally(backup) {
    try {
      const key = `asd_backup_${backup.id}`;
      const serialized = JSON.stringify(backup);
      
      // Check storage space
      if (this.getStorageUsage() > 0.8) {
        this.cleanOldBackups(5);
      }
      
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.warn('Failed to save backup locally:', error);
      // Try IndexedDB as fallback
      this.saveBackupToIndexedDB(backup);
    }
  }
  
  /**
   * Save backup to IndexedDB
   */
  async saveBackupToIndexedDB(backup) {
    try {
      const db = await this.openBackupDB();
      const transaction = db.transaction(['backups'], 'readwrite');
      const store = transaction.objectStore('backups');
      
      await store.put({
        id: backup.id,
        data: backup,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to save backup to IndexedDB:', error);
    }
  }
  
  /**
   * Restore backup
   */
  async restoreBackup(backupId) {
    if (this.isRestoring) {
      throw new Error('Restore sedang berlangsung');
    }
    
    const confirmed = await NotificationService.confirm(
      'Restore akan menimpa data saat ini. Lanjutkan?',
      'Konfirmasi Restore',
      { type: 'warning', confirmText: 'Restore', confirmClass: 'btn-error' }
    );
    
    if (!confirmed) return;
    
    this.isRestoring = true;
    
    try {
      NotificationService.show('Merestore data...', 'info', { duration: 0, id: 'restore-progress' });
      
      // Get backup data
      const backup = await this.getBackup(backupId);
      if (!backup) {
        throw new Error('Backup tidak ditemukan');
      }
      
      // Send to server
      const response = await api.post('backup.restore', {
        id: backupId,
        data: backup.data
      });
      
      if (response.status === 'success') {
        NotificationService.success('Restore berhasil! Sistem akan dimuat ulang.');
        
        // Reload after delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      NotificationService.error('Restore gagal: ' + error.message);
    } finally {
      this.isRestoring = false;
      NotificationService.dismiss('restore-progress');
    }
  }
  
  /**
   * Get backup by ID
   */
  async getBackup(backupId) {
    // Check local storage first
    const localBackup = this.backups.find(b => b.id === backupId);
    if (localBackup) return localBackup;
    
    // Try to load from storage
    try {
      const key = `asd_backup_${backupId}`;
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch {}
    
    // Try IndexedDB
    return this.getBackupFromIndexedDB(backupId);
  }
  
  /**
   * Get backup from IndexedDB
   */
  async getBackupFromIndexedDB(backupId) {
    try {
      const db = await this.openBackupDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(['backups'], 'readonly');
        const store = transaction.objectStore('backups');
        const request = store.get(backupId);
        
        request.onsuccess = () => {
          resolve(request.result?.data || null);
        };
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }
  
  /**
   * Get backup list
   */
  async getBackups() {
    // Refresh from server
    try {
      const response = await api.get('backup.list');
      if (response.status === 'success') {
        const serverBackups = response.data.items || [];
        
        // Merge with local backups
        serverBackups.forEach(sb => {
          if (!this.backups.find(lb => lb.id === sb.id)) {
            this.backups.push(sb);
          }
        });
        
        this.saveBackupHistory();
      }
    } catch {}
    
    return this.backups;
  }
  
  /**
   * Delete backup
   */
  async deleteBackup(backupId) {
    // Remove from array
    this.backups = this.backups.filter(b => b.id !== backupId);
    this.saveBackupHistory();
    
    // Remove from localStorage
    localStorage.removeItem(`asd_backup_${backupId}`);
    
    // Remove from IndexedDB
    try {
      const db = await this.openBackupDB();
      const transaction = db.transaction(['backups'], 'readwrite');
      const store = transaction.objectStore('backups');
      store.delete(backupId);
    } catch {}
  }
  
  /**
   * Download backup as JSON file
   */
  async downloadBackup(backupId) {
    const backup = await this.getBackup(backupId);
    if (!backup) {
      NotificationService.error('Backup tidak ditemukan');
      return;
    }
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${backup.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    NotificationService.success('Backup didownload');
  }
  
  /**
   * Upload backup from file
   */
  async uploadBackup(file) {
    try {
      const text = await FileService.readAsText(file);
      const backup = JSON.parse(text);
      
      // Validate backup format
      if (!backup.id || !backup.data) {
        throw new Error('Format backup tidak valid');
      }
      
      // Add to backups
      this.backups.unshift(backup);
      this.saveBackupLocally(backup);
      this.saveBackupHistory();
      
      NotificationService.success('Backup berhasil diupload');
      return backup;
    } catch (error) {
      NotificationService.error('Gagal mengupload backup: ' + error.message);
      throw error;
    }
  }
  
  /**
   * Schedule auto backup
   */
  async scheduleAutoBackup(enabled, interval = 86400000) {
    this.autoBackupEnabled = enabled;
    this.autoBackupInterval = interval;
    
    localStorage.setItem('asd_auto_backup', JSON.stringify({
      enabled,
      interval,
      lastBackup: null
    }));
    
    if (enabled) {
      this.startAutoBackup();
    } else {
      this.stopAutoBackup();
    }
  }
  
  /**
   * Check auto backup settings
   */
  checkAutoBackup() {
    try {
      const settings = JSON.parse(localStorage.getItem('asd_auto_backup'));
      if (settings?.enabled) {
        this.autoBackupEnabled = true;
        this.autoBackupInterval = settings.interval || 86400000;
        this.startAutoBackup();
      }
    } catch {}
  }
  
  /**
   * Start auto backup
   */
  startAutoBackup() {
    this.stopAutoBackup();
    
    this.autoBackupTimer = setInterval(async () => {
      try {
        await this.createBackup({ description: 'Auto Backup' });
      } catch (error) {
        console.warn('Auto backup failed:', error);
      }
    }, this.autoBackupInterval);
  }
  
  /**
   * Stop auto backup
   */
  stopAutoBackup() {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
      this.autoBackupTimer = null;
    }
  }
  
  /**
   * Load backup history
   */
  loadBackupHistory() {
    try {
      const stored = localStorage.getItem('asd_backup_history');
      this.backups = stored ? JSON.parse(stored) : [];
    } catch {
      this.backups = [];
    }
  }
  
  /**
   * Save backup history
   */
  saveBackupHistory() {
    try {
      // Keep only last 50 backups
      if (this.backups.length > 50) {
        this.backups = this.backups.slice(0, 50);
      }
      localStorage.setItem('asd_backup_history', JSON.stringify(this.backups));
    } catch {}
  }
  
  /**
   * Clean old backups
   */
  cleanOldBackups(keepCount = 10) {
    if (this.backups.length <= keepCount) return;
    
    const toDelete = this.backups.slice(keepCount);
    toDelete.forEach(backup => {
      localStorage.removeItem(`asd_backup_${backup.id}`);
    });
    
    this.backups = this.backups.slice(0, keepCount);
    this.saveBackupHistory();
  }
  
  /**
   * Estimate backup size
   */
  estimateBackupSize(data) {
    try {
      return JSON.stringify(data).length * 2; // UTF-16
    } catch {
      return 0;
    }
  }
  
  /**
   * Get storage usage
   */
  getStorageUsage() {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        total += (localStorage.getItem(key) || '').length * 2;
      }
      const quota = 5 * 1024 * 1024; // 5MB typical localStorage limit
      return total / quota;
    } catch {
      return 0;
    }
  }
  
  /**
   * Open IndexedDB for backups
   */
  openBackupDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('asd_backups', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('backups')) {
          db.createObjectStore('backups', { keyPath: 'id' });
        }
      };
    });
  }
  
  /**
   * Get backup stats
   */
  getStats() {
    const totalSize = this.backups.reduce((sum, b) => sum + (b.size || 0), 0);
    
    return {
      totalBackups: this.backups.length,
      totalSize: FileService.formatSize(totalSize),
      lastBackup: this.backups[0]?.timestamp || null,
      autoBackupEnabled: this.autoBackupEnabled,
      storageUsage: Math.round(this.getStorageUsage() * 100)
    };
  }
}

// Singleton instance
const BackupService = new BackupService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BackupService };
}
