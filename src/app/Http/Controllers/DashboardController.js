// DashboardController.js - Enterprise Dashboard Controller
class DashboardController {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
    }

    async getDashboardData() {
        try {
            const payload = this.encodeData({
                action: 'dashboard_get_data',
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
                return {
                    success: true,
                    stats: {
                        totalSuratMasuk: data.total_surat_masuk || 0,
                        totalSuratKeluar: data.total_surat_keluar || 0,
                        totalDisposisi: data.total_disposisi || 0,
                        totalPengguna: data.total_pengguna || 0,
                        suratMasukBulanIni: data.surat_masuk_bulan_ini || 0,
                        suratKeluarBulanIni: data.surat_keluar_bulan_ini || 0,
                        disposisiAktif: data.disposisi_aktif || 0,
                        penggunaAktif: data.pengguna_aktif || 0
                    },
                    recentActivities: data.recent_activities || [],
                    chartData: data.chart_data || {}
                };
            }

            return { success: false, stats: {}, recentActivities: [], chartData: {} };

        } catch (error) {
            console.error('Dashboard error:', error);
            return { success: false, stats: {}, recentActivities: [], chartData: {} };
        }
    }

    async getChartData(type, period = 'monthly') {
        try {
            const payload = this.encodeData({
                action: 'dashboard_get_chart',
                chart_type: type,
                period: period,
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
            console.error('Chart data error:', error);
            return { success: false, data: [] };
        }
    }

    async getRecentActivities(limit = 10) {
        try {
            const payload = this.encodeData({
                action: 'dashboard_recent_activities',
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
            console.error('Activities error:', error);
            return { success: false, data: [] };
        }
    }

    async getNotifications() {
        try {
            const payload = this.encodeData({
                action: 'dashboard_notifications',
                token: this.token,
                user_id: this.getUserId()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Notifications error:', error);
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
    module.exports = DashboardController;
}
