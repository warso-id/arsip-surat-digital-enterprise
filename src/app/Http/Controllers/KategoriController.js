// KategoriController.js - CRUD Kategori Surat Controller
class KategoriController {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
    }

    async index() {
        try {
            const payload = this.encodeData({
                action: 'kategori_index',
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
            console.error('Index kategori error:', error);
            return { success: false, data: [] };
        }
    }

    async store(data) {
        try {
            const payload = this.encodeData({
                action: 'kategori_store',
                nama_kategori: data.nama_kategori,
                kode: data.kode,
                deskripsi: data.deskripsi || '',
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
            console.error('Store kategori error:', error);
            return { success: false, message: 'Gagal menambah kategori' };
        }
    }

    async update(id, data) {
        try {
            const payload = this.encodeData({
                action: 'kategori_update',
                id: id,
                nama_kategori: data.nama_kategori,
                kode: data.kode,
                deskripsi: data.deskripsi,
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
            console.error('Update kategori error:', error);
            return { success: false, message: 'Gagal mengupdate kategori' };
        }
    }

    async destroy(id) {
        try {
            const payload = this.encodeData({
                action: 'kategori_destroy',
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
            console.error('Delete kategori error:', error);
            return { success: false, message: 'Gagal menghapus kategori' };
        }
    }

    async getKategoriWithCount() {
        try {
            const payload = this.encodeData({
                action: 'kategori_with_count',
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
            console.error('Kategori with count error:', error);
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
    module.exports = KategoriController;
}
