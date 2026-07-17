// AuditMiddleware.js - Audit Log Middleware
class AuditMiddleware {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
        this.enabled = true;
    }

    async log(activity) {
        if (!this.enabled) return;

        try {
            const logData = {
                action: 'audit_log',
                user_id: this.getUserId(),
                user_name: this.getUserName(),
                activity_type: activity.type || 'general',
                activity_description: activity.description,
                module: activity.module || 'system',
                ip_address: this.getClientIP(),
                user_agent: navigator.userAgent,
                request_url: window.location.href,
                request_method: activity.method || 'GET',
                old_data: activity.oldData ? btoa(encodeURIComponent(JSON.stringify(activity.oldData))) : null,
                new_data: activity.newData ? btoa(encodeURIComponent(JSON.stringify(activity.newData))) : null,
                token: this.token,
                timestamp: Date.now()
            };

            const payload = btoa(encodeURIComponent(JSON.stringify(logData)));

            await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

        } catch (error) {
            console.error('Audit log error:', error);
        }
    }

    async logCreate(module, data) {
        await this.log({
            type: 'create',
            description: `Membuat data baru di ${module}`,
            module: module,
            newData: data
        });
    }

    async logUpdate(module, oldData, newData) {
        await this.log({
            type: 'update',
            description: `Mengupdate data di ${module}`,
            module: module,
            oldData: oldData,
            newData: newData
        });
    }

    async logDelete(module, data) {
        await this.log({
            type: 'delete',
            description: `Menghapus data di ${module}`,
            module: module,
            oldData: data
        });
    }

    async logLogin(success, email) {
        await this.log({
            type: success ? 'login_success' : 'login_failed',
            description: success ? `Login berhasil: ${email}` : `Login gagal: ${email}`,
            module: 'auth',
            newData: { email: email }
        });
    }

    async logLogout() {
        await this.log({
            type: 'logout',
            description: 'User logout',
            module: 'auth'
        });
    }

    async logExport(module, format) {
        await this.log({
            type: 'export',
            description: `Export data ${module} ke format ${format}`,
            module: module
        });
    }

    async logImport(module, filename) {
        await this.log({
            type: 'import',
            description: `Import data ${module} dari file ${filename}`,
            module: module
        });
    }

    async logPrint(module, documentId) {
        await this.log({
            type: 'print',
            description: `Mencetak dokumen ${module} #${documentId}`,
            module: module
        });
    }

    async getAuditLogs(page = 1, limit = 50, filters = {}) {
        try {
            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'audit_get_logs',
                page: page,
                limit: limit,
                filters: filters,
                token: this.token
            })));

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return JSON.parse(decodeURIComponent(atob(result.data)));

        } catch (error) {
            console.error('Get audit logs error:', error);
            return { success: false, data: [], total: 0 };
        }
    }

    async clearOldLogs(daysToKeep = 90) {
        try {
            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'audit_clear_logs',
                days_to_keep: daysToKeep,
                token: this.token
            })));

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return JSON.parse(decodeURIComponent(atob(result.data)));

        } catch (error) {
            console.error('Clear audit logs error:', error);
            return { success: false };
        }
    }

    getUserId() {
        const user = JSON.parse(localStorage.getItem('user_data') || '{}');
        return user.id || 0;
    }

    getUserName() {
        const user = JSON.parse(localStorage.getItem('user_data') || '{}');
        return user.nama || 'Unknown';
    }

    getClientIP() {
        return 'client-side';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuditMiddleware;
}
