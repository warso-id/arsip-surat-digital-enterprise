// Notifikasi.js - Notifikasi Model
class Notifikasi {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.table = 'notifikasi';
        this.primaryKey = 'id';
        this.fillable = ['user_id', 'tipe', 'judul', 'pesan', 'is_read', 'link'];
    }

    async getByUser(userId, page = 1, limit = 20) {
        try {
            const payload = this.encode({
                action: 'model_where',
                table: this.table,
                conditions: { user_id: userId },
                page: page,
                limit: limit,
                orderBy: 'created_at',
                order: 'DESC'
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Get notifikasi error:', error);
            return { data: [], total: 0 };
        }
    }

    async getUnreadCount(userId) {
        try {
            const payload = this.encode({
                action: 'model_count',
                table: this.table,
                conditions: {
                    user_id: userId,
                    is_read: false
                }
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);
            
            return data.count || 0;

        } catch (error) {
            console.error('Get unread count error:', error);
            return 0;
        }
    }

    async markAsRead(id) {
        return this.update(id, { is_read: true });
    }

    async markAllAsRead(userId) {
        try {
            const payload = this.encode({
                action: 'model_update_where',
                table: this.table,
                conditions: { user_id: userId, is_read: false },
                data: { is_read: true }
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Mark all read error:', error);
            return { success: false };
        }
    }

    async create(data) {
        try {
            const sanitizedData = {};
            this.fillable.forEach(field => {
                if (data[field] !== undefined) {
                    sanitizedData[field] = data[field];
                }
            });

            sanitizedData.is_read = false;

            const payload = this.encode({
                action: 'model_create',
                table: this.table,
                data: sanitizedData
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Create notifikasi error:', error);
            return { success: false };
        }
    }

    async update(id, data) {
        try {
            const payload = this.encode({
                action: 'model_update',
                table: this.table,
                id: id,
                primaryKey: this.primaryKey,
                data: data
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Update notifikasi error:', error);
            return { success: false };
        }
    }

    async deleteOld(daysToKeep = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const payload = this.encode({
                action: 'model_delete_where',
                table: this.table,
                conditions: {
                    created_at: {
                        operator: '<',
                        value: cutoffDate.toISOString()
                    }
                }
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Delete old notifikasi error:', error);
            return { success: false };
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
    module.exports = Notifikasi;
}
