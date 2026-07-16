// ==================== DASHBOARD CONTROLLER ====================
// Arsip Surat Digital Enterprise

class DashboardController {
    constructor() {
        this.suratMasukModel = require('../../Models/SuratMasuk');
        this.suratKeluarModel = require('../../Models/SuratKeluar');
        this.disposisiModel = require('../../Models/Disposisi');
        this.penggunaModel = require('../../Models/Pengguna');
        this.logModel = require('../../Models/LogAktivitas');
        this.notifikasiModel = require('../../Models/Notifikasi');
    }

    /**
     * Get dashboard statistics
     */
    async getStats(req, res) {
        try {
            const instansiId = req.user.instansi_id;
            const userId = req.user.id;

            // Get counts in parallel
            const [
                suratMasukStats,
                suratKeluarStats,
                disposisiStats,
                pendingDisposisi,
                recentActivities,
            ] = await Promise.all([
                this.suratMasukModel.getStatistics(instansiId, 'month'),
                this.suratKeluarModel.getStatistics(instansiId, 'month'),
                this.disposisiModel.getStatistics(instansiId),
                this.disposisiModel.getPendingCount(userId),
                this.logModel.getRecent(10, instansiId),
            ]);

            return res.json({
                success: true,
                data: {
                    suratMasuk: {
                        total: suratMasukStats.total?.total || 0,
                        baru: suratMasukStats.total?.baru || 0,
                        proses: suratMasukStats.total?.proses || 0,
                        selesai: suratMasukStats.total?.selesai || 0,
                        arsip: suratMasukStats.total?.arsip || 0,
                    },
                    suratKeluar: {
                        total: suratKeluarStats.total?.total || 0,
                        konsep: suratKeluarStats.total?.konsep || 0,
                        terkirim: suratKeluarStats.total?.terkirim || 0,
                    },
                    disposisi: {
                        total: disposisiStats?.total || 0,
                        pending: disposisiStats?.pending || 0,
                        proses: disposisiStats?.proses || 0,
                        selesai: disposisiStats?.selesai || 0,
                        pendingForMe: pendingDisposisi,
                    },
                    recentActivities: recentActivities || [],
                },
            });

        } catch (error) {
            console.error('Dashboard stats error:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil data dashboard',
            });
        }
    }

    /**
     * Get chart data
     */
    async getChartData(req, res) {
        try {
            const instansiId = req.user.instansi_id;
            const period = req.query.period || 'monthly';

            // Get monthly surat masuk data
            const suratMasukStats = await this.suratMasukModel.getStatistics(instansiId, 'year');
            const suratKeluarStats = await this.suratKeluarModel.getStatistics(instansiId, 'year');

            // Format chart data
            const chartData = {
                labels: [],
                suratMasuk: [],
                suratKeluar: [],
            };

            // Get last 12 months
            for (let i = 11; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                const bulanNama = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                chartData.labels.push(bulanNama);
                
                const masuk = suratMasukStats.monthly?.find(m => m.month === monthKey);
                const keluar = suratKeluarStats.monthly?.find(m => m.month === monthKey);
                
                chartData.suratMasuk.push(masuk?.count || 0);
                chartData.suratKeluar.push(keluar?.count || 0);
            }

            return res.json({
                success: true,
                data: chartData,
            });

        } catch (error) {
            console.error('Chart data error:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil data chart',
            });
        }
    }

    /**
     * Get recent activities
     */
    async getRecentActivities(req, res) {
        try {
            const instansiId = req.user.instansi_id;
            const limit = parseInt(req.query.limit) || 20;

            const activities = await this.logModel.getRecent(limit, instansiId);

            // Format activities
            const formatted = activities.map(activity => ({
                id: activity.id,
                action: this.formatAction(activity.action),
                description: activity.description,
                user: activity.user_fullname || 'System',
                time: activity.created_at,
                timeAgo: this.timeAgo(activity.created_at),
            }));

            return res.json({
                success: true,
                data: formatted,
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil aktivitas terbaru',
            });
        }
    }

    /**
     * Format action name
     */
    formatAction(action) {
        const actionMap = {
            'LOGIN': 'Login',
            'LOGOUT': 'Logout',
            'CREATE_SURAT_MASUK': 'Buat Surat Masuk',
            'UPDATE_SURAT_MASUK': 'Update Surat Masuk',
            'DELETE_SURAT_MASUK': 'Hapus Surat Masuk',
            'CREATE_SURAT_KELUAR': 'Buat Surat Keluar',
            'UPDATE_SURAT_KELUAR': 'Update Surat Keluar',
            'CREATE_DISPOSISI': 'Buat Disposisi',
            'UPDATE_DISPOSISI': 'Update Disposisi',
        };
        return actionMap[action] || action;
    }

    /**
     * Calculate time ago
     */
    timeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        
        if (seconds < 60) return 'Baru saja';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} menit yang lalu`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam yang lalu`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari yang lalu`;
        
        return new Date(date).toLocaleDateString('id-ID');
    }

    /**
     * Get unread notifications count
     */
    async getNotificationCount(req, res) {
        try {
            const userId = req.user.id;
            const count = await this.notifikasiModel.getUnreadCount(userId);

            return res.json({
                success: true,
                data: { count },
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil jumlah notifikasi',
            });
        }
    }
}

module.exports = new DashboardController();
