// DisposisiService.js - Business Logic Disposisi
class DisposisiService {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
    }

    async createDisposisi(data) {
        try {
            const payload = this.encode({
                action: 'disposisi_create',
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
            const responseData = this.decode(result.data);

            if (responseData.success) {
                // Kirim notifikasi ke penerima disposisi
                await this.sendDisposisiNotification(
                    data.kepada_user_id,
                    responseData.disposisi_id
                );
            }

            return responseData;

        } catch (error) {
            console.error('Create disposisi error:', error);
            return { success: false, message: 'Gagal membuat disposisi' };
        }
    }

    async updateStatus(disposisiId, status, catatan = '') {
        try {
            const payload = this.encode({
                action: 'disposisi_update_status',
                disposisi_id: disposisiId,
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
            const data = this.decode(result.data);

            if (data.success) {
                // Kirim notifikasi ke pembuat disposisi
                await this.sendStatusUpdateNotification(disposisiId, status);
            }

            return data;

        } catch (error) {
            console.error('Update status error:', error);
            return { success: false, message: 'Gagal mengupdate status' };
        }
    }

    async getDisposisiTimeline(disposisiId) {
        try {
            const payload = this.encode({
                action: 'disposisi_timeline',
                disposisi_id: disposisiId,
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
            console.error('Get timeline error:', error);
            return { success: false, data: [] };
        }
    }

    async getDisposisiStatistics(userId = null) {
        try {
            const payload = this.encode({
                action: 'disposisi_statistics',
                user_id: userId || this.getUserId(),
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

    async getOverdueDisposisi(page = 1, limit = 10) {
        try {
            const payload = this.encode({
                action: 'disposisi_overdue',
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
            return this.decode(result.data);

        } catch (error) {
            console.error('Get overdue disposisi error:', error);
            return { success: false, data: [] };
        }
    }

    async remindDisposisi(disposisiId) {
        try {
            const payload = this.encode({
                action: 'disposisi_remind',
                disposisi_id: disposisiId,
                reminded_by: this.getUserId(),
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
            console.error('Remind disposisi error:', error);
            return { success: false, message: 'Gagal mengirim pengingat' };
        }
    }

    async sendDisposisiNotification(userId, disposisiId) {
        try {
            const payload = this.encode({
                action: 'send_notification',
                user_id: userId,
                type: 'disposisi_baru',
                title: 'Disposisi Baru',
                message: `Anda menerima disposisi baru #${disposisiId}`,
                link: `/disposisi/${disposisiId}`,
                token: this.token
            });

            await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });
        } catch (error) {
            console.error('Send notification error:', error);
        }
    }

    async sendStatusUpdateNotification(disposisiId, status) {
        try {
            const payload = this.encode({
                action: 'send_notification',
                type: 'status_update',
                title: 'Update Status Disposisi',
                message: `Disposisi #${disposisiId} status: ${status}`,
                link: `/disposisi/${disposisiId}`,
                token: this.token
            });

            await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });
        } catch (error) {
            console.error('Send status notification error:', error);
        }
    }

    getUserId() {
        const user = JSON.parse(localStorage.getItem('user_data') || '{}');
        return user.id || 0;
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
    module.exports = DisposisiService;
}
