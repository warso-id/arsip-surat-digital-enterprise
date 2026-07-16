// ==================== GOOGLE APPS SCRIPT SERVICE ====================
// Arsip Surat Digital Enterprise
// Integrasi dengan Google Apps Script untuk backup cloud & sinkronisasi

const config = require('../config/app');

class GoogleAppsScriptService {
    constructor() {
        // Base64 encoded URL untuk keamanan
        this.baseUrl = null;
        this.apiKey = null;
        this.initialized = false;
    }

    /**
     * Initialize service dengan decode base64
     */
    async initialize() {
        try {
            // Decode konfigurasi dari base64 environment variable
            if (process.env.GAS_CONFIG_BASE64) {
                const decoded = Buffer.from(process.env.GAS_CONFIG_BASE64, 'base64').toString('utf-8');
                const gasConfig = JSON.parse(decoded);
                this.baseUrl = gasConfig.url;
                this.apiKey = gasConfig.key;
                this.initialized = true;
                console.log('Google Apps Script service initialized');
            } else {
                console.log('Google Apps Script not configured - using local mode');
            }
        } catch (error) {
            console.error('Failed to initialize GAS service:', error.message);
        }
    }

    /**
     * Send data to Google Apps Script
     */
    async sendData(endpoint, data) {
        if (!this.initialized) {
            throw new Error('GAS service not initialized');
        }

        try {
            const response = await fetch(`${this.baseUrl}?action=${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey,
                },
                body: JSON.stringify({
                    ...data,
                    timestamp: new Date().toISOString(),
                    source: config.app.name,
                    version: config.app.version,
                }),
            });

            if (!response.ok) {
                throw new Error(`GAS request failed: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('GAS send error:', error.message);
            throw error;
        }
    }

    /**
     * Backup surat ke Google Sheets
     */
    async backupSuratToSheets(suratData) {
        return this.sendData('backupSurat', {
            type: 'surat_masuk',
            data: suratData,
        });
    }

    /**
     * Sync data dari Google Sheets
     */
    async syncFromSheets(sheetName) {
        return this.sendData('syncData', {
            sheet: sheetName,
        });
    }

    /**
     * Log aktivitas ke Google Sheets
     */
    async logToSheets(logData) {
        return this.sendData('logActivity', {
            level: logData.level || 'INFO',
            message: logData.message,
            metadata: logData.metadata,
        });
    }

    /**
     * Generate report via Google Apps Script
     */
    async generateCloudReport(reportConfig) {
        return this.sendData('generateReport', {
            type: reportConfig.type,
            period: reportConfig.period,
            format: reportConfig.format || 'pdf',
        });
    }

    /**
     * Send notification via Google Apps Script
     */
    async sendCloudNotification(notification) {
        return this.sendData('sendNotification', {
            to: notification.to,
            subject: notification.subject,
            body: notification.body,
        });
    }
}

module.exports = new GoogleAppsScriptService();
