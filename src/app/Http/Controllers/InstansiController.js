// InstansiController.js - CRUD Data Instansi Controller
class InstansiController {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
    }

    async index(page = 1, limit = 50) {
        try {
            const payload = this.encodeData({
                action: 'instansi_index',
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
            console.error('Index instansi error:', error);
            return { success: false, data: [] };
        }
    }

    async store(data) {
        try {
            const payload = this.encodeData({
                action: 'instansi_store',
                nama_instansi: data.nama_instansi,
                alamat: data.alamat || '',
                telepon: data.telepon || '',
                email: data.email || '',
                kode_instansi: data.kode_instansi || '',
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
            console.error('Store instansi error:', error);
            return { success: false, message: 'Gagal menambah instansi' };
        }
    }

    async show(id) {
        try {
            const payload = this.encodeData({
                action: 'instansi_show',
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
            console.error('Show instansi error:', error);
            return { success: false, data: null };
        }
    }

    async update(id, data) {
        try {
            const payload = this.encodeData({
                action: 'instansi_update',
                id: id,
                nama_instansi: data.nama_instansi,
                alamat: data.alamat,
                telepon: data.telepon,
                email: data.email,
                kode_instansi: data.kode_instansi,
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
            console.error('Update instansi error:', error);
            return { success: false, message: 'Gagal mengupdate instansi' };
        }
    }

    async destroy(id) {
        try {
            const payload = this.encodeData({
                action: 'instansi_destroy',
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
            console.error('Delete instansi error:', error);
            return { success: false, message: 'Gagal menghapus instansi' };
        }
    }

    async search(keyword) {
        try {
            const payload = this.encodeData({
                action: 'instansi_search',
                keyword: keyword,
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
            console.error('Search instansi error:', error);
            return { success: false, data: [] };
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
    module.exports = InstansiController;
}
