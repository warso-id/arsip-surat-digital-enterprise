const SuratService = require('../../Services/SuratService');
const DisposisiService = require('../../Services/DisposisiService');
const Pengguna = require('../../Models/Pengguna');
const Notifikasi = require('../../Models/Notifikasi');
const ResponseHelper = require('../../Helpers/ResponseHelper');
const { Op } = require('sequelize');

class DashboardController {
    /**
     * Get dashboard data
     */
    static async index(req, res) {
        try {
            const tahun = req.query.tahun || new Date().getFullYear();
            
            const [
                stats,
                recentSuratMasuk,
                recentSuratKeluar,
                pendingDisposisi,
                notifications,
                totalUsers
            ] = await Promise.all([
                SuratService.getStatistics(tahun),
                SuratService.getSuratMasuk({}, 1, 5),
                SuratService.getSuratKeluar({}, 1, 5),
                DisposisiService.getDisposisiForUser(req.user.id, { status: 'dikirim' }, 1, 5),
                Notifikasi.findAll({
                    where: {
                        user_id: req.user.id,
                        is_read: false
                    },
                    order: [['created_at', 'DESC']],
                    limit: 10
                }),
                Pengguna.count({ where: { status: 'aktif' } })
            ]);

            const dashboardData = {
                statistics: stats,
                recent_activities: {
                    surat_masuk: recentSuratMasuk.data,
                    surat_keluar: recentSuratKeluar.data
                },
                pending_disposisi: pendingDisposisi.data,
                notifications: notifications,
                total_users: totalUsers,
                current_year: tahun
            };

            return ResponseHelper.success(res, 'Data dashboard berhasil diambil', dashboardData);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Get chart data
     */
    static async chartData(req, res) {
        try {
            const tahun = req.query.tahun || new Date().getFullYear();
            const stats = await SuratService.getStatistics(tahun);

            const chartData = {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
                datasets: [
                    {
                        label: 'Surat Masuk',
                        data: stats.surat_masuk.per_bulan.map(item => item.jumlah),
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Surat Keluar',
                        data: stats.surat_keluar.per_bulan.map(item => item.jumlah),
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            };

            return ResponseHelper.success(res, 'Data chart berhasil diambil', chartData);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Get notifications
     */
    static async notifications(req, res) {
        try {
            const { page = 1, perPage = 20 } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(perPage);

            const { count, rows } = await Notifikasi.findAndCountAll({
                where: {
                    user_id: req.user.id
                },
                order: [['created_at', 'DESC']],
                limit: parseInt(perPage),
                offset: offset
            });

            const unreadCount = await Notifikasi.count({
                where: {
                    user_id: req.user.id,
                    is_read: false
                }
            });

            return ResponseHelper.success(res, 'Notifikasi berhasil diambil', {
                data: rows,
                unread_count: unreadCount,
                pagination: {
                    total: count,
                    perPage: parseInt(perPage),
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / parseInt(perPage))
                }
            });
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Mark notification as read
     */
    static async markNotificationRead(req, res) {
        try {
            const { id } = req.params;
            const notification = await Notifikasi.findOne({
                where: {
                    id: id,
                    user_id: req.user.id
                }
            });

            if (!notification) {
                throw new Error('Notifikasi tidak ditemukan');
            }

            await notification.markAsRead();

            return ResponseHelper.success(res, 'Notifikasi ditandai sebagai dibaca');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Mark all notifications as read
     */
    static async markAllNotificationsRead(req, res) {
        try {
            await Notifikasi.update(
                {
                    is_read: true,
                    read_at: new Date()
                },
                {
                    where: {
                        user_id: req.user.id,
                        is_read: false
                    }
                }
            );

            return ResponseHelper.success(res, 'Semua notifikasi ditandai sebagai dibaca');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Search global
     */
    static async search(req, res) {
        try {
            const { q, tipe = 'semua', page = 1, perPage = 20 } = req.query;
            
            if (!q || q.length < 3) {
                throw new Error('Kata kunci minimal 3 karakter');
            }

            const results = await SuratService.searchSurat(q, tipe, parseInt(page), parseInt(perPage));

            return ResponseHelper.success(res, 'Hasil pencarian berhasil diambil', results);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }
}

module.exports = DashboardController;
