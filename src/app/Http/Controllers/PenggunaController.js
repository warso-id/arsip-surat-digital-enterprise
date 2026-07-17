// PenggunaController.js - Manajemen Pengguna Controller
class PenggunaController {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
    }

    async index(page = 1, limit = 10, filters = {}) {
        try {
            const payload = this.encodeData({
                action: 'pengguna_index',
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
            console.error('Index pengguna error:', error);
            return { success: false, data: [], total: 0 };
        }
    }

    async store(data) {
        try {
            const payload = this.encodeData({
                action: 'pengguna_store',
                nama: data.nama,
                email: data.email,
                password: this.hashPassword(data.password),
                role_id: data.role_id,
                instansi_id: data.instansi_id,
                jabatan: data.jabatan || '',
                telepon: data.telepon || '',
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
            console.error('Store pengguna error:', error);
            return { success: false, message: 'Gagal menambah pengguna' };
        }
    }

    async show(id) {
        try {
            const payload = this.encodeData({
                action: 'pengguna_show',
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
            console.error('Show pengguna error:', error);
            return { success: false, data: null };
        }
    }

    async update(id, data) {
        try {
            const updateData = {
                action: 'pengguna_update',
                id: id,
                nama: data.nama,
                email: data.email,
                role_id: data.role_id,
                instansi_id: data.instansi_id,
                jabatan: data.jabatan,
                telepon: data.telepon,
                status: data.status,
                updated_by: this.getUserId(),
                token: this.token,
                timestamp: Date.now()
            };

            if (data.password) {
                updateData.password = this.hashPassword(data.password);
            }

            const payload = this.encodeData(updateData);

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Update pengguna error:', error);
            return { success: false, message: 'Gagal mengupdate pengguna' };
        }
    }

    async destroy(id) {
        try {
            const payload = this.encodeData({
                action: 'pengguna_destroy',
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
            console.error('Delete pengguna error:', error);
            return { success: false, message: 'Gagal menghapus pengguna' };
        }
    }

    async updateProfile(data) {
        try {
            const payload = this.encodeData({
                action: 'pengguna_update_profile',
                user_id: this.getUserId(),
                nama: data.nama,
                email: data.email,
                jabatan: data.jabatan,
                telepon: data.telepon,
                avatar: data.avatar,
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
            console.error('Update profile error:', error);
            return { success: false, message: 'Gagal mengupdate profil' };
        }
    }

    async changePassword(oldPassword, newPassword) {
        try {
            const payload = this.encodeData({
                action: 'pengguna_change_password',
                user_id: this.getUserId(),
                old_password: this.hashPassword(oldPassword),
                new_password: this.hashPassword(newPassword),
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
            console.error('Change password error:', error);
            return { success: false, message: 'Gagal mengubah password' };
        }
    }

    async updateStatus(id, status) {
        try {
            const payload = this.encodeData({
                action: 'pengguna_update_status',
                id: id,
                status: status,
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
            console.error('Update status error:', error);
            return { success: false, message: 'Gagal mengupdate status' };
        }
    }

    hashPassword(password) {
        return btoa(password + 'enterprise_salt_2026');
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
    module.exports = PenggunaController;
}
