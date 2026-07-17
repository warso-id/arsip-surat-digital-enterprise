// BackupService.js - Backup System Service
class BackupService {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
    }

    async createBackup(type = 'full') {
        try {
            const payload = this.encode({
                action: 'backup_create',
                type: type,
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

            if (data.success && data.url) {
                const link = document.createElement('a');
                link.href = data.url;
                link.download = `backup-${data.filename || Date.now()}.zip`;
                link.click();
            }

            return data;

        } catch (error) {
            console.error('Create backup error:', error);
            return { success: false, message: 'Gagal membuat backup' };
        }
    }

    async restoreBackup(file) {
        try {
            const reader = new FileReader();
            
            return new Promise((resolve) => {
                reader.onload = async (e) => {
                    const payload = this.encode({
                        action: 'backup_restore',
                        data: e.target.result,
                        filename: file.name,
                        token: this.token
                    });

                    try {
                        const response = await fetch(this.apiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ data: payload })
                        });

                        const result = await response.json();
                        resolve(this.decode(result.data));
                    } catch (error) {
                        resolve({ success: false, message: 'Gagal restore backup' });
                    }
                };

                reader.readAsDataURL(file);
            });

        } catch (error) {
            console.error('Restore backup error:', error);
            return { success: false, message: 'Gagal restore backup' };
        }
    }

    async getBackupList() {
        try {
            const payload = this.encode({
                action: 'backup_list',
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
            console.error('Get backup list error:', error);
            return { success: false, data: [] };
        }
    }

    async deleteBackup(backupId) {
        try {
            const payload = this.encode({
                action: 'backup_delete',
                backup_id: backupId,
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
            console.error('Delete backup error:', error);
            return { success: false, message: 'Gagal menghapus backup' };
        }
    }

    async scheduleBackup(schedule) {
        try {
            const payload = this.encode({
                action: 'backup_schedule',
                schedule: schedule,
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
            console.error('Schedule backup error:', error);
            return { success: false, message: 'Gagal menjadwalkan backup' };
        }
    }

    async getBackupStatus() {
        try {
            const payload = this.encode({
                action: 'backup_status',
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
            console.error('Get backup status error:', error);
            return { success: false, data: {} };
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
    module.exports = BackupService;
}
