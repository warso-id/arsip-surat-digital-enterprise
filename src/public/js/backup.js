/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Backup & Restore System
 * ============================================================
 */

const EnterpriseBackup = (() => {
    'use strict';

    // ==================== BACKUP CONFIGURATION ====================
    const CONFIG = {
        autoBackup: true,
        backupInterval: 3600000, // 1 hour
        maxBackups: 5,
        includeFiles: false,
        compression: true,
        encryptBackup: true,
    };

    // ==================== BACKUP MANAGER ====================
    class BackupManager {
        constructor() {
            this.backups = [];
            this.loadBackupList();
        }

        /**
         * Create full system backup
         */
        async createBackup(options = {}) {
            const backupId = `backup_${Date.now()}`;
            
            try {
                const backup = {
                    id: backupId,
                    version: '3.0.0',
                    timestamp: new Date().toISOString(),
                    data: {},
                    metadata: {
                        userAgent: navigator.userAgent,
                        url: window.location.href,
                        size: 0,
                    }
                };

                // Backup IndexedDB
                if (window.EnterpriseDB) {
                    backup.data.database = await this.backupDatabase();
                }

                // Backup localStorage
                backup.data.localStorage = this.backupLocalStorage();

                // Backup sessionStorage
                backup.data.sessionStorage = this.backupSessionStorage();

                // Backup app state
                if (window.EnterpriseCore?.state) {
                    backup.data.appState = window.EnterpriseCore.state.get();
                }

                // Calculate size
                const jsonStr = JSON.stringify(backup);
                backup.metadata.size = new Blob([jsonStr]).size;

                // Compress if enabled
                let backupData = jsonStr;
                if (CONFIG.compression) {
                    backupData = await this.compress(jsonStr);
                }

                // Encrypt if enabled
                if (CONFIG.encryptBackup) {
                    backupData = this.encrypt(backupData);
                }

                // Save backup
                await this.saveBackup(backupId, backupData);

                // Add to list
                this.backups.unshift(backup);
                this.saveBackupList();

                // Clean old backups
                this.cleanOldBackups();

                // Sync to Google Apps Script
                await this.syncBackupToCloud(backup);

                console.log(`✅ Backup created: ${backupId}`);
                return backup;

            } catch (error) {
                console.error('Backup creation failed:', error);
                throw error;
            }
        }

        /**
         * Backup IndexedDB
         */
        async backupDatabase() {
            const dbBackup = {};
            
            if (!window.EnterpriseDB) return dbBackup;

            const tables = window.EnterpriseDB.tables;
            
            for (const [name, tableName] of Object.entries(tables)) {
                try {
                    const data = await window.EnterpriseDB.getAll(tableName);
                    dbBackup[tableName] = data;
                } catch (error) {
                    console.warn(`Failed to backup table ${tableName}:`, error);
                }
            }

            return dbBackup;
        }

        /**
         * Backup localStorage
         */
        backupLocalStorage() {
            const backup = {};
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                try {
                    backup[key] = localStorage.getItem(key);
                } catch (error) {
                    console.warn(`Failed to backup localStorage key ${key}:`, error);
                }
            }

            return backup;
        }

        /**
         * Backup sessionStorage
         */
        backupSessionStorage() {
            const backup = {};
            
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                try {
                    backup[key] = sessionStorage.getItem(key);
                } catch (error) {
                    console.warn(`Failed to backup sessionStorage key ${key}:`, error);
                }
            }

            return backup;
        }

        /**
         * Restore from backup
         */
        async restoreBackup(backupId) {
            try {
                // Load backup data
                let backupData = await this.loadBackup(backupId);
                
                if (!backupData) {
                    throw new Error('Backup not found');
                }

                // Decrypt if needed
                if (CONFIG.encryptBackup) {
                    backupData = this.decrypt(backupData);
                }

                // Decompress if needed
                if (CONFIG.compression) {
                    backupData = await this.decompress(backupData);
                }

                const backup = JSON.parse(backupData);

                // Restore localStorage
                if (backup.data.localStorage) {
                    this.restoreLocalStorage(backup.data.localStorage);
                }

                // Restore sessionStorage
                if (backup.data.sessionStorage) {
                    this.restoreSessionStorage(backup.data.sessionStorage);
                }

                // Restore IndexedDB
                if (backup.data.database && window.EnterpriseDB) {
                    await this.restoreDatabase(backup.data.database);
                }

                console.log(`✅ Backup restored: ${backupId}`);
                return true;

            } catch (error) {
                console.error('Backup restoration failed:', error);
                throw error;
            }
        }

        /**
         * Restore localStorage
         */
        restoreLocalStorage(data) {
            localStorage.clear();
            Object.entries(data).forEach(([key, value]) => {
                try {
                    localStorage.setItem(key, value);
                } catch (error) {
                    console.warn(`Failed to restore localStorage key ${key}:`, error);
                }
            });
        }

        /**
         * Restore sessionStorage
         */
        restoreSessionStorage(data) {
            sessionStorage.clear();
            Object.entries(data).forEach(([key, value]) => {
                try {
                    sessionStorage.setItem(key, value);
                } catch (error) {
                    console.warn(`Failed to restore sessionStorage key ${key}:`, error);
                }
            });
        }

        /**
         * Restore IndexedDB
         */
        async restoreDatabase(data) {
            if (!window.EnterpriseDB) return;

            for (const [tableName, records] of Object.entries(data)) {
                try {
                    await window.EnterpriseDB.clear(tableName);
                    if (records.length > 0) {
                        await window.EnterpriseDB.bulkAdd(tableName, records);
                    }
                } catch (error) {
                    console.warn(`Failed to restore table ${tableName}:`, error);
                }
            }
        }

        /**
         * Save backup to local storage
         */
        async saveBackup(backupId, data) {
            try {
                // Store in IndexedDB if available
                if (window.EnterpriseDB) {
                    await window.EnterpriseDB.add('tbl_backups', {
                        id: backupId,
                        data: data,
                        timestamp: Date.now(),
                    });
                } else {
                    // Fallback to localStorage (limited size)
                    localStorage.setItem(backupId, data);
                }
            } catch (error) {
                console.error('Failed to save backup:', error);
                throw error;
            }
        }

        /**
         * Load backup from storage
         */
        async loadBackup(backupId) {
            try {
                if (window.EnterpriseDB) {
                    const backup = await window.EnterpriseDB.get('tbl_backups', backupId);
                    return backup?.data || null;
                } else {
                    return localStorage.getItem(backupId);
                }
            } catch (error) {
                console.error('Failed to load backup:', error);
                return null;
            }
        }

        /**
         * Delete backup
         */
        async deleteBackup(backupId) {
            try {
                if (window.EnterpriseDB) {
                    await window.EnterpriseDB.delete('tbl_backups', backupId);
                } else {
                    localStorage.removeItem(backupId);
                }

                this.backups = this.backups.filter(b => b.id !== backupId);
                this.saveBackupList();

                console.log(`🗑️ Backup deleted: ${backupId}`);
            } catch (error) {
                console.error('Failed to delete backup:', error);
            }
        }

        /**
         * Sync backup to Google Apps Script
         */
        async syncBackupToCloud(backup) {
            try {
                if (!window.GASAPI) return;

                const encoded = window.EnterpriseBase64 
                    ? window.EnterpriseBase64.encodeObject(backup)
                    : btoa(JSON.stringify(backup));

                await window.GASAPI.call('system/backup', {
                    backup: encoded,
                    action: 'system/backup',
                });

                console.log('☁️ Backup synced to cloud');
            } catch (error) {
                console.warn('Failed to sync backup to cloud:', error);
            }
        }

        /**
         * Download backup as file
         */
        async downloadBackup(backupId) {
            const backupData = await this.loadBackup(backupId);
            if (!backupData) {
                throw new Error('Backup not found');
            }

            const blob = new Blob([backupData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_${backupId}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        /**
         * Import backup from file
         */
        async importBackup(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = async (e) => {
                    try {
                        const data = e.target.result;
                        const backup = JSON.parse(data);
                        const backupId = backup.id || `imported_${Date.now()}`;
                        
                        await this.saveBackup(backupId, data);
                        
                        this.backups.unshift(backup);
                        this.saveBackupList();
                        
                        resolve(backup);
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            });
        }

        /**
         * Compress data (simple implementation)
         */
        async compress(data) {
            // Simple compression: remove whitespace from JSON
            try {
                const obj = JSON.parse(data);
                return JSON.stringify(obj);
            } catch {
                return data;
            }
        }

        /**
         * Decompress data
         */
        async decompress(data) {
            return data; // Already in usable format
        }

        /**
         * Encrypt data (simple XOR encryption)
         */
        encrypt(data) {
            const key = 'EnterpriseBackupKey2024';
            let result = '';
            for (let i = 0; i < data.length; i++) {
                result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return btoa(result);
        }

        /**
         * Decrypt data
         */
        decrypt(data) {
            const key = 'EnterpriseBackupKey2024';
            const decoded = atob(data);
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return result;
        }

        /**
         * Clean old backups
         */
        cleanOldBackups() {
            while (this.backups.length > CONFIG.maxBackups) {
                const oldBackup = this.backups.pop();
                this.deleteBackup(oldBackup.id);
            }
        }

        /**
         * Load backup list
         */
        loadBackupList() {
            try {
                const saved = localStorage.getItem('backup_list');
                if (saved) {
                    this.backups = JSON.parse(saved);
                }
            } catch (error) {
                this.backups = [];
            }
        }

        /**
         * Save backup list
         */
        saveBackupList() {
            try {
                localStorage.setItem('backup_list', JSON.stringify(this.backups.slice(0, CONFIG.maxBackups)));
            } catch (error) {
                console.warn('Failed to save backup list');
            }
        }

        /**
         * Get all backups
         */
        getBackups() {
            return this.backups;
        }

        /**
         * Start auto backup
         */
        startAutoBackup() {
            if (!CONFIG.autoBackup) return;
            
            // Initial backup
            this.createBackup({ auto: true });
            
            // Periodic backup
            setInterval(() => {
                this.createBackup({ auto: true });
            }, CONFIG.backupInterval);
        }
    }

    // ==================== INITIALIZE ====================
    const backupManager = new BackupManager();
    backupManager.startAutoBackup();

    // ==================== PUBLIC API ====================
    return {
        create: (options) => backupManager.createBackup(options),
        restore: (backupId) => backupManager.restore(backupId),
        delete: (backupId) => backupManager.deleteBackup(backupId),
        download: (backupId) => backupManager.downloadBackup(backupId),
        import: (file) => backupManager.importBackup(file),
        list: () => backupManager.getBackups(),
        syncToCloud: () => {
            const latest = backupManager.getBackups()[0];
            if (latest) {
                return backupManager.syncBackupToCloud(latest);
            }
        },
    };
})();

window.EnterpriseBackup = EnterpriseBackup;
