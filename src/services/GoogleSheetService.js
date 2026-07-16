// ==================== GOOGLE SHEETS SERVICE ====================
// Arsip Surat Digital Enterprise
// Integrasi Google Sheets via Apps Script (Base64 Encoded)

const crypto = require('crypto');

class GoogleSheetService {
    constructor() {
        // Base64 encoded Google Apps Script URL
        this.gasUrlBase64 = 'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J3YmxhdXcyOUN2OHJtcmpRSGhmWGdkbDBjc0JIbHhPM3h2WkppbXlCc1N5QTRGNWY5cUgyNUVqNVFZSXUtLU9HeTZCdwvZXhlYw==';
        this.gasUrl = null;
        this.initialized = false;
        this.cacheTimeout = 300000; // 5 minutes
        this.cache = new Map();
    }

    /**
     * Initialize service dengan decode base64 URL
     */
    initialize() {
        try {
            this.gasUrl = Buffer.from(this.gasUrlBase64, 'base64').toString('utf-8');
            this.initialized = true;
            console.log('Google Sheets Service initialized');
        } catch (error) {
            console.error('Failed to decode GAS URL:', error.message);
        }
    }

    /**
     * Send request ke Google Apps Script
     */
    async sendRequest(action, data) {
        if (!this.initialized) this.initialize();
        
        const payload = this.encodePayload({
            action,
            data,
            timestamp: Date.now(),
            nonce: crypto.randomBytes(8).toString('hex'),
        });

        try {
            const response = await fetch(`${this.gasUrl}?action=${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            return this.decodeResponse(result);
        } catch (error) {
            console.error(`GAS ${action} error:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Encode payload ke base64
     */
    encodePayload(data) {
        const jsonStr = JSON.stringify(data);
        const encoded = Buffer.from(jsonStr).toString('base64');
        const signature = crypto
            .createHmac('sha256', 'arsip-surat-secret')
            .update(encoded)
            .digest('hex');
        
        return { payload: encoded, signature };
    }

    /**
     * Decode response dari base64
     */
    decodeResponse(response) {
        if (response.payload) {
            try {
                const decoded = Buffer.from(response.payload, 'base64').toString('utf-8');
                return { ...response, data: JSON.parse(decoded) };
            } catch (e) {
                return response;
            }
        }
        return response;
    }

    // ==================== SHEET OPERATIONS ====================

    /**
     * Append data ke sheet
     */
    async appendToSheet(sheetName, rowData) {
        return this.sendRequest('append', { sheet: sheetName, data: rowData });
    }

    /**
     * Read data dari sheet
     */
    async readFromSheet(sheetName, limit = 100) {
        const cacheKey = `read_${sheetName}_${limit}`;
        
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }
        
        const result = await this.sendRequest('read', { sheet: sheetName, limit });
        
        if (result.success) {
            this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
        }
        
        return result;
    }

    /**
     * Update data di sheet
     */
    async updateSheet(sheetName, rowIndex, data) {
        return this.sendRequest('update', { 
            sheet: sheetName, 
            row: rowIndex, 
            data 
        });
    }

    /**
     * Delete data dari sheet
     */
    async deleteFromSheet(sheetName, rowIndex) {
        return this.sendRequest('delete', { sheet: sheetName, row: rowIndex });
    }

    /**
     * Clear sheet
     */
    async clearSheet(sheetName) {
        return this.sendRequest('clear', { sheet: sheetName });
    }

    /**
     * Get sheet info
     */
    async getSheetInfo() {
        return this.sendRequest('info', {});
    }

    // ==================== BACKUP OPERATIONS ====================

    /**
     * Backup surat masuk ke Google Sheets
     */
    async backupSuratMasuk(suratData) {
        return this.appendToSheet('SuratMasuk', {
            nomor_agenda: suratData.nomor_agenda,
            tanggal_terima: suratData.tanggal_terima,
            pengirim: suratData.pengirim,
            perihal: suratData.perihal,
            status: suratData.status,
            created_at: new Date().toISOString(),
        });
    }

    /**
     * Backup surat keluar ke Google Sheets
     */
    async backupSuratKeluar(suratData) {
        return this.appendToSheet('SuratKeluar', {
            nomor_surat: suratData.nomor_surat,
            tanggal_surat: suratData.tanggal_surat,
            tujuan: suratData.tujuan,
            perihal: suratData.perihal,
            status: suratData.status,
            created_at: new Date().toISOString(),
        });
    }

    /**
     * Backup log aktivitas
     */
    async backupActivityLog(logData) {
        return this.appendToSheet('ActivityLog', {
            user: logData.user || 'system',
            action: logData.action,
            description: logData.description,
            ip: logData.ip || '-',
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Sync all data
     */
    async syncAllData() {
        const results = {
            suratMasuk: null,
            suratKeluar: null,
            disposisi: null,
            activityLog: null,
        };

        try {
            results.suratMasuk = await this.readFromSheet('SuratMasuk', 500);
            results.suratKeluar = await this.readFromSheet('SuratKeluar', 500);
            results.activityLog = await this.readFromSheet('ActivityLog', 100);
        } catch (error) {
            console.error('Sync all data error:', error);
        }

        return results;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}

module.exports = new GoogleSheetService();
