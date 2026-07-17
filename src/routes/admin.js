// admin.js - Admin Routes Configuration
const AdminRoutes = {
    // Admin endpoints
    endpoints: {
        dashboard: { action: 'admin_dashboard', method: 'POST' },
        users: { action: 'admin_users', method: 'POST' },
        roles: { action: 'admin_roles', method: 'POST' },
        settings: { action: 'admin_settings', method: 'POST' },
        logs: { action: 'admin_logs', method: 'POST' },
        backup: { action: 'admin_backup', method: 'POST' },
        restore: { action: 'admin_restore', method: 'POST' }
    },
    
    // Admin menu items
    menu: [
        { label: 'Admin Dashboard', icon: '📊', route: '/admin' },
        { label: 'Manajemen Pengguna', icon: '👥', route: '/admin/pengguna' },
        { label: 'Manajemen Role', icon: '🔑', route: '/admin/roles' },
        { label: 'Audit Log', icon: '📋', route: '/admin/logs' },
        { label: 'Backup & Restore', icon: '💾', route: '/admin/backup' },
        { label: 'Pengaturan Sistem', icon: '⚙️', route: '/admin/settings' }
    ]
};

class AdminRouter {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
    }

    async checkAdminAccess() {
        const user = JSON.parse(localStorage.getItem('user_data') || '{}');
        const adminRoles = ['superadmin', 'admin'];
        return adminRoles.includes(user.role);
    }

    async getDashboardStats() {
        if (!await this.checkAdminAccess()) {
            return { success: false, message: 'Akses ditolak' };
        }

        try {
            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'admin_dashboard',
                token: this.token,
                timestamp: Date.now()
            })));

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return JSON.parse(decodeURIComponent(atob(result.data)));

        } catch (error) {
            console.error('Admin dashboard error:', error);
            return { success: false, data: {} };
        }
    }

    async getUsers(page = 1, limit = 20) {
        if (!await this.checkAdminAccess()) {
            return { success: false, message: 'Akses ditolak' };
        }

        try {
            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'admin_users',
                page: page,
                limit: limit,
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
            console.error('Admin users error:', error);
            return { success: false, data: [] };
        }
    }

    async getAuditLogs(page = 1, limit = 50, filters = {}) {
        if (!await this.checkAdminAccess()) {
            return { success: false, message: 'Akses ditolak' };
        }

        try {
            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'admin_logs',
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
            console.error('Admin logs error:', error);
            return { success: false, data: [] };
        }
    }

    async createBackup() {
        if (!await this.checkAdminAccess()) {
            return { success: false, message: 'Akses ditolak' };
        }

        try {
            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'admin_backup',
                token: this.token,
                timestamp: Date.now()
            })));

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return JSON.parse(decodeURIComponent(atob(result.data)));

        } catch (error) {
            console.error('Admin backup error:', error);
            return { success: false, message: 'Gagal membuat backup' };
        }
    }

    async restoreBackup(file) {
        if (!await this.checkAdminAccess()) {
            return { success: false, message: 'Akses ditolak' };
        }

        try {
            const reader = new FileReader();
            
            return new Promise((resolve) => {
                reader.onload = async (e) => {
                    const payload = btoa(encodeURIComponent(JSON.stringify({
                        action: 'admin_restore',
                        data: e.target.result,
                        token: this.token
                    })));

                    try {
                        const response = await fetch(this.apiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ data: payload })
                        });

                        const result = await response.json();
                        resolve(JSON.parse(decodeURIComponent(atob(result.data))));
                    } catch (error) {
                        resolve({ success: false, message: 'Gagal restore backup' });
                    }
                };

                reader.readAsDataURL(file);
            });

        } catch (error) {
            console.error('Admin restore error:', error);
            return { success: false, message: 'Gagal restore backup' };
        }
    }
}

// Initialize admin router
const adminRouter = new AdminRouter();
window.adminRouter = adminRouter;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminRoutes, AdminRouter };
}
