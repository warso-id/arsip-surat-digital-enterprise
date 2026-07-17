// DisposisiController.js - Manajemen Disposisi Controller
class DisposisiController {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
    }

    async index(page = 1, limit = 10, filters = {}) {
        try {
            const payload = this.encodeData({
                action: 'disposisi_index',
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
            console.error('Index disposisi error:', error);
            return { success: false, data: [], total: 0 };
        }
    }

    async store(data) {
        try {
            const payload = this.encodeData({
                action: 'disposisi_store',
                surat_masuk_id: data.surat_masuk_id,
                dari_user_id: this.getUserId(),
                kepada_user_id: data.kepada_user_id,
                instruksi: data.instruksi,
                sifat: data.sifat || 'biasa',
                batas_waktu: data.batas_waktu,
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
            console.error('Store disposisi error:', error);
            return { success: false, message: 'Gagal membuat disposisi' };
        }
    }

    async show(id) {
        try {
            const payload = this.encodeData({
                action: 'disposisi_show',
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
            console.error('Show disposisi error:', error);
            return { success: false, data: null };
        }
    }

    async updateStatus(id, status, catatan = '') {
        try {
            const payload = this.encodeData({
                action: 'disposisi_update_status',
                id: id,
                status: status,
                catatan: catatan,
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
            console.error('Update status disposisi error:', error);
            return { success: false, message: 'Gagal mengupdate status' };
        }
    }

    async getTracking(id) {
        try {
            const payload = this.encodeData({
                action: 'disposisi_tracking',
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
            console.error('Tracking disposisi error:', error);
            return { success: false, data: [] };
        }
    }

    async getDisposisiMasuk(page = 1, limit = 10) {
        try {
            const payload = this.encodeData({
                action: 'disposisi_masuk',
                user_id: this.getUserId(),
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
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Disposisi masuk error:', error);
            return { success: false, data: [] };
        }
    }

    async getDisposisiKeluar(page = 1, limit = 10) {
        try {
            const payload = this.encodeData({
                action: 'disposisi_keluar',
                user_id: this.getUserId(),
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
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Disposisi keluar error:', error);
            return { success: false, data: [] };
        }
    }

    async getStatistics() {
        try {
            const payload = this.encodeData({
                action: 'disposisi_statistics',
                user_id: this.getUserId(),
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

    async notifyUser(disposisiId) {
        try {
            const payload = this.encodeData({
                action: 'disposisi_notify',
                id: disposisiId,
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
            console.error('Notify error:', error);
            return { success: false };
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
    module.exports = DisposisiController;
}
