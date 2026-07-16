// ==================== DATABASE SYNC SERVICE ====================
// Arsip Surat Digital Enterprise
// Sinkronisasi database dengan Google Sheets via GAS

const config = require('../config/app');

class DatabaseSyncService {
    constructor() {
        this.syncInterval = null;
        this.isSyncing = false;
        this.lastSync = null;
        
        // Base64 encoded GAS URL
        this.gasUrlBase64 = 'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J3YmxhdXcyOUN2OHJtcmpRSGhmWGdkbDBjc0JIbHhPM3h2WkppbXlCc1N5QTRGNWY5cUgyNUVqNVFZSXUtLU9HeTZCdwvZXhlYw==';
        this.gasUrl = null;
    }

    /**
     * Initialize sync service
     */
    initialize() {
        this.gasUrl = Buffer.from(this.gasUrlBase64, 'base64').toString('utf-8');
        console.log('Database Sync Service initialized');
    }

    /**
     * Start auto sync
     */
    startAutoSync(intervalMinutes = 30) {
        if (this.syncInterval) clearInterval(this.syncInterval);
        
        this.syncInterval = setInterval(() => {
            this.syncAll();
        }, intervalMinutes * 60 * 1000);
        
        console.log(`Auto sync started (every ${intervalMinutes} minutes)`);
    }

    /**
     * Stop auto sync
     */
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /**
     * Sync all data ke Google Sheets
     */
    async syncAll() {
        if (this.isSyncing) return;
        this.isSyncing = true;
        
        try {
            console.log('Starting database sync...');
            
            await Promise.all([
                this.syncSuratMasuk(),
                this.syncSuratKeluar(),
                this.syncDisposisi(),
                this.syncActivityLog(),
            ]);
            
            this.lastSync = new Date().toISOString();
            console.log('Database sync completed');
        } catch (error) {
            console.error('Database sync failed:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Sync surat masuk
     */
    async syncSuratMasuk() {
        const db = require('../config/database');
        const data = await db.all('SELECT * FROM surat_masuk ORDER BY created_at DESC LIMIT 50');
        return this.sendToGAS('syncSuratMasuk', data);
    }

    /**
     * Sync surat keluar
     */
    async syncSuratKeluar() {
        const db = require('../config/database');
        const data = await db.all('SELECT * FROM surat_keluar ORDER BY created_at DESC LIMIT 50');
        return this.sendToGAS('syncSuratKeluar', data);
    }

    /**
     * Sync disposisi
     */
    async syncDisposisi() {
        const db = require('../config/database');
        const data = await db.all('SELECT * FROM disposisi ORDER BY created_at DESC LIMIT 50');
        return this.sendToGAS('syncDisposisi', data);
    }

    /**
     * Sync activity log
     */
    async syncActivityLog() {
        const db = require('../config/database');
        const data = await db.all('SELECT * FROM log_aktivitas ORDER BY created_at DESC LIMIT 100');
        return this.sendToGAS('syncActivityLog', data);
    }

    /**
     * Send data ke Google Apps Script
     */
    async sendToGAS(action, data) {
        if (!this.gasUrl) this.initialize();
        
        try {
            const payload = Buffer.from(JSON.stringify({
                action: action,
                data: data,
                timestamp: new Date().toISOString(),
                source: config.app.name,
            })).toString('base64');

            const response = await fetch(`${this.gasUrl}?action=${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload }),
            });

            return await response.json();
        } catch (error) {
            console.error(`GAS ${action} error:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get sync status
     */
    getStatus() {
        return {
            isSyncing: this.isSyncing,
            lastSync: this.lastSync,
            autoSync: !!this.syncInterval,
        };
    }
}

module.exports = new DatabaseSyncService();
