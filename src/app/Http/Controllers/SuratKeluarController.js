// SuratKeluarController.js - CRUD Surat Keluar Controller
class SuratKeluarController {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
    }

    async index(page = 1, limit = 10, filters = {}) {
        try {
            const payload = this.encodeData({
                action: 'surat_keluar_index',
                page: page,
                limit: limit,
                filters: filters,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Index surat keluar error:', error);
            return { success: false, data: [], total: 0 };
        }
    }

    async store(data) {
        try {
            const payload = this.encodeData({
                action: 'surat_keluar_store',
                no_surat: data.no_surat,
                tanggal_surat: data.tanggal_surat,
                tujuan: data.tujuan,
                instansi_id: data.instansi_id,
                perihal: data.perihal,
                kategori_id: data.kategori_id,
                isi_surat: data.isi_surat,
                status: data.status || 'draft',
                created_by: this.getUserId(),
                token: this.token,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Store surat keluar error:', error);
            return { success: false, message: 'Gagal menyimpan surat keluar' };
        }
    }

    async show(id) {
        try {
            const payload = this.encodeData({
                action: 'surat_keluar_show',
                id: id,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Show surat keluar error:', error);
            return { success: false, data: null };
        }
    }

    async update(id, data) {
        try {
            const payload = this.encodeData({
                action: 'surat_keluar_update',
                id: id,
                no_surat: data.no_surat,
                tanggal_surat: data.tanggal_surat,
                tujuan: data.tujuan,
                instansi_id: data.instansi_id,
                perihal: data.perihal,
                kategori_id: data.kategori_id,
                isi_surat: data.isi_surat,
                status: data.status,
                updated_by: this.getUserId(),
                token: this.token,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Update surat keluar error:', error);
            return { success: false, message: 'Gagal mengupdate surat keluar' };
        }
    }

    async destroy(id) {
        try {
            const payload = this.encodeData({
                action: 'surat_keluar_destroy',
                id: id,
                deleted_by: this.getUserId(),
                token: this.token,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Delete surat keluar error:', error);
            return { success: false, message: 'Gagal menghapus surat keluar' };
        }
    }

    async search(keyword, filters = {}) {
        try {
            const payload = this.encodeData({
                action: 'surat_keluar_search',
                keyword: keyword,
                filters: filters,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Search surat keluar error:', error);
            return { success: false, data: [] };
        }
    }

    async exportData(filters = {}) {
        try {
            const payload = this.encodeData({
                action: 'surat_keluar_export',
                filters: filters,
                format: 'excel',
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decodeData(result.data);
            
            if (data.success && data.url) {
                window.open(data.url, '_blank');
            }

            return data;

        } catch (error) {
            console.error('Export surat keluar error:', error);
            return { success: false, message: 'Gagal export data' };
        }
    }

    async getStatistics() {
        try {
            const payload = this.encodeData({
                action: 'surat_keluar_statistics',
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Statistics error:', error);
            return { success: false, data: {} };
        }
    }

    async sendSurat(id) {
        try {
            const payload = this.encodeData({
                action: 'surat_keluar_send',
                id: id,
                sent_by: this.getUserId(),
                token: this.token,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Send surat error:', error);
            return { success: false, message: 'Gagal mengirim surat' };
        }
    }

    async printSurat(id) {
        try {
            const payload = this.encodeData({
                action: 'surat_keluar_print',
                id: id,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decodeData(result.data);
            
            if (data.success && data.html) {
                const printWindow = window.open('', '_blank');
                printWindow.document.write(data.html);
                printWindow.document.close();
                setTimeout(() => printWindow.print(), 500);
            }

            return data;

        } catch (error) {
            console.error('Print surat error:', error);
            return { success: false, message: 'Gagal mencetak surat' };
        }
    }

    getUserId() {
        const user = JSON.parse(localStorage.getItem('user_data') || '{}');
        return user.id || 0;
    }

    encodeData(data) {
        return btoa(encodeURIComponent(JSON.stringify(data)));
    }

    decodeData(encoded) {
        try {
            return JSON.parse(decodeURIComponent(atob(encoded)));
        } catch (error) {
            return {};
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SuratKeluarController;
}
