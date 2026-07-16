// ==================== NOTIFIKASI CONTROLLER ====================
// Arsip Surat Digital Enterprise

class NotifikasiController {
    constructor() {
        this.notifikasiModel = require('../../Models/Notifikasi');
        this.logModel = require('../../Models/LogAktivitas');
    }

    /**
     * Get all notifications for user
     */
    async index(req, res) {
        try {
            const userId = req.user.id;
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
                isRead: req.query.is_read !== undefined ? req.query.is_read === 'true' : null,
                type: req.query.type || null,
            };

            const result = await this.notifikasiModel.findByUser(userId, options);

            return res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });

        } catch (error) {
            console.error('Get notifications error:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil notifikasi',
            });
        }
    }

    /**
     * Get unread count
     */
    async unreadCount(req, res) {
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

    /**
     * Mark notification as read
     */
    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            await this.notifikasiModel.markAsRead(id, userId);

            return res.json({
                success: true,
                message: 'Notifikasi ditandai sebagai dibaca',
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal menandai notifikasi',
            });
        }
    }

    /**
     * Mark all as read
     */
    async markAllAsRead(req, res) {
        try {
            const userId = req.user.id;
            const count = await this.notifikasiModel.markAllAsRead(userId);

            return res.json({
                success: true,
                message: `${count} notifikasi ditandai sebagai dibaca`,
                data: { count },
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal menandai semua notifikasi',
            });
        }
    }

    /**
     * Delete notification
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.notifikasiModel.delete(id);

            return res.json({
                success: true,
                message: 'Notifikasi berhasil dihapus',
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal menghapus notifikasi',
            });
        }
    }

    /**
     * Delete all read notifications
     */
    async deleteAllRead(req, res) {
        try {
            const userId = req.user.id;
            const count = await this.notifikasiModel.deleteAllRead(userId);

            return res.json({
                success: true,
                message: `${count} notifikasi berhasil dihapus`,
                data: { count },
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal menghapus notifikasi',
            });
        }
    }

    /**
     * Get notification statistics
     */
    async statistics(req, res) {
        try {
            const userId = req.user.id;
            const stats = await this.notifikasiModel.getStatistics(userId);

            return res.json({
                success: true,
                data: stats,
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil statistik notifikasi',
            });
        }
    }

    /**
     * Create notification (internal)
     */
    async create(data) {
        return await this.notifikasiModel.create(data);
    }

    /**
     * Broadcast notification to instansi
     */
    async broadcastToInstansi(instansiId, notification) {
        return await this.notifikasiModel.broadcastToInstansi(instansiId, notification);
    }

    /**
     * Broadcast to specific role
     */
    async broadcastToRole(roleId, notification) {
        return await this.notifikasiModel.broadcastToRole(roleId, notification);
    }
}

module.exports = new NotifikasiController();
