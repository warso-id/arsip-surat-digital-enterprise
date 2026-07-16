// ==================== DATA SYNC SERVICE ====================
// Arsip Surat Digital Enterprise
// Sinkronisasi data antara lokal dan cloud

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class DataSyncService {
    constructor() {
        this.syncQueue = [];
        this.syncInterval = null;
        this.syncInProgress = false;
        this.lastSyncTimestamp = null;
        this.apiGateway = require('./ApiGatewayService');
        this.encryptionService = require('./EncryptionService');
    }

    /**
     * Initialize sync service
     */
    async initialize() {
        await this.apiGateway.initialize();
        await this.loadSyncState();
        this.startAutoSync();
        console.log('Data Sync Service initialized');
    }

    /**
     * Load sync state dari local storage
     */
    async loadSyncState() {
        try {
            const statePath = path.join(__dirname, '..', '..', 'storage', 'sync-state.json');
            const stateData = await fs.readFile(statePath, 'utf-8');
            const state = JSON.parse(stateData);
            this.lastSyncTimestamp = state.lastSync || null;
            console.log('Sync state loaded:', this.lastSyncTimestamp);
        } catch (error) {
            console.log('No previous sync state found');
            this.lastSyncTimestamp = null;
        }
    }

    /**
     * Save sync state
     */
    async saveSyncState() {
        try {
            const statePath = path.join(__dirname, '..', '..', 'storage', 'sync-state.json');
            const state = {
                lastSync: new Date().toISOString(),
                queueLength: this.syncQueue.length,
                version: '2.1.0',
            };
            await fs.writeFile(statePath, JSON.stringify(state, null, 2));
        } catch (error) {
            console.error('Failed to save sync state:', error);
        }
    }

    /**
     * Start auto sync
     */
    startAutoSync(intervalMs = 300000) {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(() => {
            this.processSyncQueue();
        }, intervalMs);
        
        console.log(`Auto sync started (every ${intervalMs / 1000}s)`);
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
     * Add data to sync queue
     */
    async addToQueue(type, data, priority = 'normal') {
        const queueItem = {
            id: crypto.randomUUID(),
            type: type,
            data: data,
            priority: priority,
            timestamp: Date.now(),
            retries: 0,
            maxRetries: 3,
            encodedData: this.encodeSyncData(data),
        };

        this.syncQueue.push(queueItem);
        
        // Sort by priority
        this.syncQueue.sort((a, b) => {
            const priorityOrder = { high: 0, normal: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        // Save queue to disk
        await this.saveQueueToDisk();
        
        console.log(`Added to sync queue: ${type} (${this.syncQueue.length} items)`);
    }

    /**
     * Encode data untuk sync (base64)
     */
    encodeSyncData(data) {
        const jsonStr = JSON.stringify(data);
        const encoded = Buffer.from(jsonStr).toString('base64');
        const checksum = crypto.createHash('md5').update(encoded).digest('hex');
        
        return {
            payload: encoded,
            checksum: checksum,
            timestamp: Date.now(),
        };
    }

    /**
     * Decode sync data
     */
    decodeSyncData(encodedData) {
        try {
            const jsonStr = Buffer.from(encodedData.payload, 'base64').toString('utf-8');
            const data = JSON.parse(jsonStr);
            
            // Verify checksum
            const checksum = crypto.createHash('md5').update(encodedData.payload).digest('hex');
            if (checksum !== encodedData.checksum) {
                throw new Error('Data checksum mismatch');
            }
            
            return data;
        } catch (error) {
            console.error('Decode sync data error:', error);
            return null;
        }
    }

    /**
     * Process sync queue
     */
    async processSyncQueue() {
        if (this.syncInProgress || this.syncQueue.length === 0) {
            return;
        }

        this.syncInProgress = true;
        console.log(`Processing sync queue: ${this.syncQueue.length} items`);

        const processed = [];
        const failed = [];

        for (const item of this.syncQueue) {
            try {
                await this.syncItem(item);
                processed.push(item);
            } catch (error) {
                console.error(`Sync failed for ${item.id}:`, error.message);
                item.retries++;
                
                if (item.retries >= item.maxRetries) {
                    failed.push(item);
                }
            }
        }

        // Remove processed items from queue
        this.syncQueue = this.syncQueue.filter(
            item => !processed.includes(item)
        );

        // Save failed items for later
        if (failed.length > 0) {
            await this.saveFailedItems(failed);
        }

        // Save sync state
        await this.saveSyncState();
        await this.saveQueueToDisk();

        this.syncInProgress = false;
        console.log(`Sync complete: ${processed.length} success, ${failed.length} failed`);
    }

    /**
     * Sync single item
     */
    async syncItem(item) {
        switch (item.type) {
            case 'surat-masuk':
                await this.apiGateway.backupToCloud(item.data);
                break;
            case 'surat-keluar':
                await this.apiGateway.backupToCloud(item.data);
                break;
            case 'log':
                await this.apiGateway.logToCloud(item.data);
                break;
            case 'notification':
                await this.apiGateway.sendCloudNotification(item.data);
                break;
            default:
                console.log(`Unknown sync type: ${item.type}`);
        }
    }

    /**
     * Save queue to disk
     */
    async saveQueueToDisk() {
        try {
            const queuePath = path.join(__dirname, '..', '..', 'storage', 'sync-queue.json');
            // Encode queue data ke base64 untuk keamanan
            const queueData = JSON.stringify(this.syncQueue);
            const encoded = Buffer.from(queueData).toString('base64');
            await fs.writeFile(queuePath, encoded);
        } catch (error) {
            console.error('Failed to save sync queue:', error);
        }
    }

    /**
     * Load queue from disk
     */
    async loadQueueFromDisk() {
        try {
            const queuePath = path.join(__dirname, '..', '..', 'storage', 'sync-queue.json');
            const encoded = await fs.readFile(queuePath, 'utf-8');
            const queueData = Buffer.from(encoded, 'base64').toString('utf-8');
            this.syncQueue = JSON.parse(queueData);
            console.log(`Loaded ${this.syncQueue.length} items from sync queue`);
        } catch (error) {
            console.log('No sync queue found on disk');
            this.syncQueue = [];
        }
    }

    /**
     * Save failed items
     */
    async saveFailedItems(items) {
        try {
            const failedPath = path.join(__dirname, '..', '..', 'storage', 'sync-failed.json');
            const existing = await this.loadFailedItems();
            const allFailed = [...existing, ...items];
            const encoded = Buffer.from(JSON.stringify(allFailed)).toString('base64');
            await fs.writeFile(failedPath, encoded);
        } catch (error) {
            console.error('Failed to save failed items:', error);
        }
    }

    /**
     * Load failed items
     */
    async loadFailedItems() {
        try {
            const failedPath = path.join(__dirname, '..', '..', 'storage', 'sync-failed.json');
            const encoded = await fs.readFile(failedPath, 'utf-8');
            return JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
        } catch (error) {
            return [];
        }
    }

    /**
     * Get sync status
     */
    getStatus() {
        return {
            queueLength: this.syncQueue.length,
            syncInProgress: this.syncInProgress,
            lastSync: this.lastSyncTimestamp,
            autoSync: !!this.syncInterval,
        };
    }

    /**
     * Force sync now
     */
    async forceSync() {
        console.log('Force sync initiated');
        await this.processSyncQueue();
        return this.getStatus();
    }
}

module.exports = new DataSyncService();
