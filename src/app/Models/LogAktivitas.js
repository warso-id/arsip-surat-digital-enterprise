// LogAktivitas.js - Log Aktivitas Model
class LogAktivitas {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.table = 'log_aktivitas';
        this.primaryKey = 'id';
        this.fillable = ['user_id', 'user_name', 'aktivitas', 'modul', 'deskripsi', 'ip_address', 'user_agent'];
    }

    async log(data) {
        try {
            const sanitizedData = {};
            this.fillable.forEach(field => {
                if (data[field] !== undefined) {
                    sanitizedData[field] = data[field];
                }
            });

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
            console.error('Log aktivitas error:', error);
            return { success: false };
        }
    }

    async getLogs(page = 1, limit = 50, filters = {}) {
        try {
            const payload = this.encode({
                action: 'model_get_all',
                table: this.table,
                page: page,
                limit: limit,
                filters: filters,
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
            console.error('Get logs error:', error);
            return { data: [], total: 0 };
        }
    }

    async getLogsByUser(userId, page = 1, limit = 50) {
        return this.getLogs(page, limit, { user_id: userId });
    }

    async getLogsByModule(modul, page = 1, limit = 50) {
        return this.getLogs(page, limit, { modul: modul });
    }

    async clearOldLogs(daysToKeep = 90) {
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
            console.error('Clear old logs error:', error);
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
    module.exports = LogAktivitas;
}
