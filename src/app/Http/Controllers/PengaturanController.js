// PengaturanController.js - Pengaturan Sistem Controller
class PengaturanController {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
        this.settings = {};
    }

    async getSettings() {
        try {
            const payload = this.encodeData({
                action: 'pengaturan_get',
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decodeData(result.data);

            if (data.success) {
                this.settings = data.settings || {};
            }

            return data;

        } catch (error) {
            console.error('Get settings error:', error);
            return { success: false, settings: {} };
        }
    }

    async updateSettings(settings) {
        try {
            const payload = this.encodeData({
                action: 'pengaturan_update',
                settings: {
                    nama_instansi: settings.nama_instansi,
                    alamat: settings.alamat,
                    telepon: settings.telepon,
                    email: settings.email,
                    website: settings.website,
                    logo: settings.logo,
                    theme: settings.theme || 'light',
                    language: settings.language || 'id',
                    timezone: settings.timezone || 'Asia/Jakarta',
                    items_per_page: settings.items_per_page || 10,
                    enable_notifications: settings.enable_notifications !== false,
                    enable_email_notifications: settings.enable_email_notifications || false,
                    backup_enabled: settings.backup_enabled || false,
                    backup_frequency: settings.backup_frequency || 'daily',
                    maintenance_mode: settings.maintenance_mode || false
                },
                token: this.token,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decodeData(result.data);

            if (data.success) {
                this.settings = { ...this.settings, ...settings };
                this.applySettings();
            }

            return data;

        } catch (error) {
            console.error('Update settings error:', error);
            return { success: false, message: 'Gagal mengupdate pengaturan' };
        }
    }

    async updateTheme(theme) {
        try {
            const payload = this.encodeData({
                action: 'pengaturan_update_theme',
                theme: theme,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decodeData(result.data);

            if (data.success) {
                this.applyTheme(theme);
            }

            return data;

        } catch (error) {
            console.error('Update theme error:', error);
            return { success: false };
        }
    }

    async updateLanguage(language) {
        try {
            const payload = this.encodeData({
                action: 'pengaturan_update_language',
                language: language,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decodeData(result.data);

            if (data.success) {
                this.applyLanguage(language);
            }

            return data;

        } catch (error) {
            console.error('Update language error:', error);
            return { success: false };
        }
    }

    async getSystemInfo() {
        try {
            const payload = this.encodeData({
                action: 'pengaturan_system_info',
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
            console.error('System info error:', error);
            return { success: false, info: {} };
        }
    }

    async checkForUpdates() {
        try {
            const payload = this.encodeData({
                action: 'pengaturan_check_updates',
                current_version: '2026.1',
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
            console.error('Check updates error:', error);
            return { success: false, update_available: false };
        }
    }

    async backupDatabase() {
        try {
            const payload = this.encodeData({
                action: 'pengaturan_backup',
                token: this.token,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decodeData(result.data);

            if (data.success && data.url) {
                const link = document.createElement('a');
                link.href = data.url;
                link.download = `backup-${new Date().toISOString().split('T')[0]}.zip`;
                link.click();
            }

            return data;

        } catch (error) {
            console.error('Backup error:', error);
            return { success: false, message: 'Gagal backup database' };
        }
    }

    async restoreDatabase(file) {
        try {
            const reader = new FileReader();
            
            return new Promise((resolve) => {
                reader.onload = async (e) => {
                    const payload = this.encodeData({
                        action: 'pengaturan_restore',
                        data: e.target.result,
                        token: this.token
                    });

                    try {
                        const response = await fetch(this.apiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ data: payload })
                        });

                        const result = await response.json();
                        resolve(this.decodeData(result.data));
                    } catch (error) {
                        resolve({ success: false, message: 'Gagal restore database' });
                    }
                };

                reader.readAsDataURL(file);
            });

        } catch (error) {
            console.error('Restore error:', error);
            return { success: false, message: 'Gagal restore database' };
        }
    }

    async clearCache() {
        try {
            const payload = this.encodeData({
                action: 'pengaturan_clear_cache',
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
            console.error('Clear cache error:', error);
            return { success: false };
        }
    }

    applySettings() {
        // Apply theme
        if (this.settings.theme) {
            this.applyTheme(this.settings.theme);
        }

        // Apply language
        if (this.settings.language) {
            this.applyLanguage(this.settings.language);
        }

        // Apply items per page
        if (this.settings.items_per_page) {
            localStorage.setItem('items_per_page', this.settings.items_per_page);
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    applyLanguage(language) {
        localStorage.setItem('language', language);
        // Reload page to apply language changes
        // window.location.reload();
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
    module.exports = PengaturanController;
}
