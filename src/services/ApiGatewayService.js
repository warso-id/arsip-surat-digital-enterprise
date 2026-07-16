// ==================== API GATEWAY SERVICE ====================
// Arsip Surat Digital Enterprise
// Central API Gateway dengan Base64 Encoding

const crypto = require('crypto');
const config = require('../config/app');

class ApiGatewayService {
    constructor() {
        this.services = new Map();
        this.initialized = false;
    }

    /**
     * Initialize API Gateway dengan konfigurasi base64
     */
    async initialize() {
        try {
            // Google Apps Script URL (Base64 encoded)
            const gasUrlBase64 = 'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J3YmxhdXcyOUN2OHJtcmpRSGhmWGdkbDBjc0JIbHhPM3h2WkppbXlCc1N5QTRGNWY5cUgyNUVqNVFZSXUtLU9HeTZCdw';
            
            // Decode dan register services
            this.registerService('gas', {
                url: Buffer.from(gasUrlBase64, 'base64').toString('utf-8') + '/exec',
                type: 'google-apps-script',
                description: 'Google Apps Script Cloud Service',
                endpoints: {
                    backup: 'backupSurat',
                    sync: 'syncData',
                    log: 'logActivity',
                    report: 'generateReport',
                    notify: 'sendNotification',
                },
            });

            this.initialized = true;
            console.log('API Gateway initialized with encoded services');
        } catch (error) {
            console.error('API Gateway initialization error:', error.message);
        }
    }

    /**
     * Register service
     */
    registerService(name, config) {
        this.services.set(name, config);
    }

    /**
     * Get service configuration
     */
    getService(name) {
        return this.services.get(name);
    }

    /**
     * Encode request payload ke base64
     */
    encodeRequest(data) {
        const jsonStr = JSON.stringify(data);
        const encoded = Buffer.from(jsonStr).toString('base64');
        const signature = this.generateSignature(encoded);
        
        return {
            payload: encoded,
            signature: signature,
            timestamp: Date.now(),
        };
    }

    /**
     * Decode response dari base64
     */
    decodeResponse(encodedData) {
        try {
            const jsonStr = Buffer.from(encodedData, 'base64').toString('utf-8');
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('Decode response error:', error);
            return null;
        }
    }

    /**
     * Generate signature untuk verifikasi
     */
    generateSignature(data) {
        const secret = config.app.key || 'default-secret';
        return crypto
            .createHmac('sha256', secret)
            .update(data)
            .digest('base64');
    }

    /**
     * Verify signature
     */
    verifySignature(data, signature) {
        const expected = this.generateSignature(data);
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expected)
        );
    }

    /**
     * Send request ke Google Apps Script
     */
    async sendToGAS(endpoint, data) {
        const service = this.getService('gas');
        if (!service) {
            throw new Error('GAS service not registered');
        }

        const encodedRequest = this.encodeRequest({
            action: service.endpoints[endpoint],
            ...data,
            appVersion: config.app.version,
            environment: config.app.env,
        });

        try {
            const response = await fetch(service.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(encodedRequest),
            });

            const result = await response.json();
            
            // Decode response jika di-encode
            if (result.payload) {
                result.data = this.decodeResponse(result.payload);
            }

            return result;
        } catch (error) {
            console.error(`GAS ${endpoint} error:`, error.message);
            throw error;
        }
    }

    /**
     * Backup surat ke Google Sheets via GAS
     */
    async backupToCloud(suratData) {
        return this.sendToGAS('backup', {
            sheet: 'SuratMasuk',
            data: suratData,
            operation: 'append',
        });
    }

    /**
     * Sync data dari cloud
     */
    async syncFromCloud(sheetName, lastSync) {
        return this.sendToGAS('sync', {
            sheet: sheetName,
            lastSync: lastSync,
            operation: 'fetch',
        });
    }

    /**
     * Kirim log aktivitas ke cloud
     */
    async logToCloud(logEntry) {
        return this.sendToGAS('log', {
            sheet: 'ActivityLog',
            data: logEntry,
            operation: 'append',
        });
    }

    /**
     * Generate laporan via cloud
     */
    async generateCloudReport(reportType, params) {
        return this.sendToGAS('report', {
            type: reportType,
            params: params,
            operation: 'generate',
        });
    }

    /**
     * Kirim notifikasi via cloud
     */
    async sendCloudNotification(notification) {
        return this.sendToGAS('notify', {
            to: notification.to,
            subject: notification.subject,
            body: notification.body,
            operation: 'send',
        });
    }

    /**
     * Health check semua services
     */
    async healthCheck() {
        const results = {};
        
        for (const [name, service] of this.services) {
            try {
                const startTime = Date.now();
                const response = await fetch(service.url + '?action=ping');
                results[name] = {
                    status: response.ok ? 'healthy' : 'unhealthy',
                    latency: Date.now() - startTime,
                    url: service.url.replace(/\/exec$/, ''),
                };
            } catch (error) {
                results[name] = {
                    status: 'unreachable',
                    error: error.message,
                };
            }
        }

        return results;
    }
}

module.exports = new ApiGatewayService();
