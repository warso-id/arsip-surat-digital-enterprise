// ==================== GAS DATABASE SERVICE ====================
// Arsip Surat Digital Enterprise
// Integrasi database dengan Google Apps Script

const config = require('../config/app');

class GasDatabaseService {
    constructor() {
        // Base64 encoded GAS URL untuk keamanan
        this.gasUrlBase64 = 'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J3YmxhdXcyOUN2OHJtcmpRSGhmWGdkbDBjc0JIbHhPM3h2WkppbXlCc1N5QTRGNWY5cUgyNUVqNVFZSXUtLU9HeTZCdwvZXhlYw==';
        this.gasUrl = null;
        this.sheets = {
            suratMasuk: 'SuratMasuk',
            suratKeluar: 'SuratKeluar', 
            disposisi: 'Disposisi',
            activityLog: 'ActivityLog',
            pengguna: 'Pengguna',
            instansi: 'Instansi',
        };
    }

    /**
     * Initialize dengan decode base64 URL
     */
    initialize() {
        this.gasUrl = Buffer.from(this.gasUrlBase64, 'base64').toString('utf-8');
        console.log('GAS Database Service initialized');
    }

    /**
     * Kirim data ke Google Sheets
     */
    async sendToSheet(sheetName, action, data) {
        if (!this.gasUrl) this.initialize();

        const payload = Buffer.from(JSON.stringify({
            sheet: sheetName,
            action: action,
            data: data,
            timestamp: new Date().toISOString(),
            appVersion: config.app.version,
        })).toString('base64');

        try {
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
     * Insert data ke sheet
     */
    async insert(sheetName, rowData) {
        return this.sendToSheet(sheetName, 'insert', rowData);
    }

    /**
     * Update data di sheet
     */
    async update(sheetName, rowIndex, rowData) {
        return this.sendToSheet(sheetName, 'update', { row: rowIndex, data: rowData });
    }

    /**
     * Delete data dari sheet
     */
    async delete(sheetName, rowIndex) {
        return this.sendToSheet(sheetName, 'delete', { row: rowIndex });
    }

    /**
     * Query data dari sheet
     */
    async query(sheetName, filters = {}) {
        return this.sendToSheet(sheetName, 'query', filters);
    }

    /**
     * Get all data dari sheet
     */
    async getAll(sheetName) {
        return this.sendToSheet(sheetName, 'getAll', {});
    }

    /**
     * Backup surat masuk ke GAS
     */
    async backupSuratMasuk(suratData) {
        return this.insert(this.sheets.suratMasuk, {
            nomor_agenda: suratData.nomor_agenda,
            nomor_surat: suratData.nomor_surat,
            tanggal_surat: suratData.tanggal_surat,
            tanggal_terima: suratData.tanggal_terima,
            pengirim: suratData.pengirim,
            perihal: suratData.perihal,
            kategori: suratData.kategori,
            status: suratData.status,
            instansi: suratData.instansi_nama,
            created_at: suratData.created_at,
        });
    }

    /**
     * Backup surat keluar ke GAS
     */
    async backupSuratKeluar(suratData) {
        return this.insert(this.sheets.suratKeluar, {
            nomor_surat: suratData.nomor_surat,
            tanggal_surat: suratData.tanggal_surat,
            tujuan: suratData.tujuan,
            perihal: suratData.perihal,
            kategori: suratData.kategori,
            status: suratData.status,
            instansi: suratData.instansi_nama,
            created_at: suratData.created_at,
        });
    }

    /**
     * Backup disposisi ke GAS
     */
    async backupDisposisi(disposisiData) {
        return this.insert(this.sheets.disposisi, {
            surat: disposisiData.surat_perihal,
            dari: disposisiData.dari_nama,
            kepada: disposisiData.kepada_nama,
            isi: disposisiData.isi_disposisi,
            sifat: disposisiData.sifat_disposisi,
            batas_waktu: disposisiData.batas_waktu,
            status: disposisiData.status,
            created_at: disposisiData.created_at,
        });
    }

    /**
     * Backup activity log ke GAS
     */
    async backupActivityLog(logData) {
        return this.insert(this.sheets.activityLog, {
            user: logData.user_fullname || 'System',
            action: logData.action,
            description: logData.description,
            ip: logData.ip_address || '-',
            timestamp: logData.created_at,
        });
    }

    /**
     * Sync semua data ke GAS
     */
    async syncAll() {
        const results = {
            suratMasuk: null,
            suratKeluar: null,
            disposisi: null,
            activityLog: null,
        };

        try {
            const db = require('../config/database');
            
            const suratMasuk = await db.all('SELECT sm.*, i.nama as instansi_nama FROM surat_masuk sm LEFT JOIN instansi i ON sm.instansi_id = i.id ORDER BY sm.created_at DESC LIMIT 100');
            for (const item of suratMasuk) {
                await this.backupSuratMasuk(item);
            }
            results.suratMasuk = { count: suratMasuk.length };

            const suratKeluar = await db.all('SELECT sk.*, i.nama as instansi_nama FROM surat_keluar sk LEFT JOIN instansi i ON sk.instansi_id = i.id ORDER BY sk.created_at DESC LIMIT 100');
            for (const item of suratKeluar) {
                await this.backupSuratKeluar(item);
            }
            results.suratKeluar = { count: suratKeluar.length };

            console.log('GAS sync completed');
        } catch (error) {
            console.error('GAS sync error:', error);
        }

        return results;
    }
}

module.exports = new GasDatabaseService();
