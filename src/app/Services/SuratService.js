// SuratService.js - Business Logic Surat
class SuratService {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
    }

    async generateNomorAgenda() {
        try {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');

            const payload = this.encode({
                action: 'generate_nomor_agenda',
                token: this.token,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);

            if (data.success) {
                return data.nomor_agenda;
            }

            // Fallback: generate local nomor agenda
            const random = Math.floor(Math.random() * 9999) + 1;
            return `AGD/${random.toString().padStart(4, '0')}/${month}/${year}`;

        } catch (error) {
            console.error('Generate nomor agenda error:', error);
            const random = Math.floor(Math.random() * 9999) + 1;
            return `AGD/${random.toString().padStart(4, '0')}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
        }
    }

    async generateNomorSuratKeluar() {
        try {
            const payload = this.encode({
                action: 'generate_nomor_surat',
                token: this.token,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);

            if (data.success) {
                return data.nomor_surat;
            }

            const random = Math.floor(Math.random() * 999) + 1;
            return `${random}/SK/ENT/${new Date().getFullYear()}`;

        } catch (error) {
            console.error('Generate nomor surat error:', error);
            const random = Math.floor(Math.random() * 999) + 1;
            return `${random}/SK/ENT/${new Date().getFullYear()}`;
        }
    }

    async getSuratStatistics(type, period = 'monthly') {
        try {
            const payload = this.encode({
                action: 'surat_statistics',
                type: type,
                period: period,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Get statistics error:', error);
            return { success: false, data: {} };
        }
    }

    async getSuratByStatus(type, status, page = 1, limit = 10) {
        try {
            const payload = this.encode({
                action: 'surat_by_status',
                type: type,
                status: status,
                page: page,
                limit: limit,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Get by status error:', error);
            return { success: false, data: [] };
        }
    }

    async getSuratByDateRange(type, startDate, endDate, page = 1, limit = 50) {
        try {
            const payload = this.encode({
                action: 'surat_by_date_range',
                type: type,
                start_date: startDate,
                end_date: endDate,
                page: page,
                limit: limit,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Get by date range error:', error);
            return { success: false, data: [] };
        }
    }

    async getSuratByKategori(type, kategoriId, page = 1, limit = 10) {
        try {
            const payload = this.encode({
                action: 'surat_by_kategori',
                type: type,
                kategori_id: kategoriId,
                page: page,
                limit: limit,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Get by kategori error:', error);
            return { success: false, data: [] };
        }
    }

    async getSuratByInstansi(type, instansiId, page = 1, limit = 10) {
        try {
            const payload = this.encode({
                action: 'surat_by_instansi',
                type: type,
                instansi_id: instansiId,
                page: page,
                limit: limit,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Get by instansi error:', error);
            return { success: false, data: [] };
        }
    }

    async bulkUpdateStatus(type, ids, status) {
        try {
            const payload = this.encode({
                action: 'bulk_update_status',
                type: type,
                ids: ids,
                status: status,
                token: this.token,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Bulk update status error:', error);
            return { success: false, message: 'Gagal update status' };
        }
    }

    async bulkDelete(type, ids) {
        try {
            const payload = this.encode({
                action: 'bulk_delete',
                type: type,
                ids: ids,
                token: this.token,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Bulk delete error:', error);
            return { success: false, message: 'Gagal menghapus data' };
        }
    }

    async exportSurat(type, format = 'excel', filters = {}) {
        try {
            const payload = this.encode({
                action: 'export_surat',
                type: type,
                format: format,
                filters: filters,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);

            if (data.success && data.url) {
                window.open(data.url, '_blank');
            }

            return data;

        } catch (error) {
            console.error('Export error:', error);
            return { success: false, message: 'Gagal export data' };
        }
    }

    async importSurat(type, file) {
        try {
            const reader = new FileReader();
            
            return new Promise((resolve) => {
                reader.onload = async (e) => {
                    const payload = this.encode({
                        action: 'import_surat',
                        type: type,
                        data: e.target.result,
                        filename: file.name,
                        token: this.token
                    });

                    try {
                        const response = await fetch(this.apiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ data: payload })
                        });

                        const result = await response.json();
                        resolve(this.decode(result.data));
                    } catch (error) {
                        resolve({ success: false, message: 'Gagal import data' });
                    }
                };

                reader.readAsDataURL(file);
            });

        } catch (error) {
            console.error('Import error:', error);
            return { success: false, message: 'Gagal import data' };
        }
    }

    encode(data) {
        return btoa(encodeURIComponent(JSON.stringify(data)));
    }

    decode(encoded) {
        try {
            return JSON.parse(decodeURIComponent(atob(encoded)));
        } catch (error) {
            return {};
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SuratService;
}
