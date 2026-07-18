const Notifikasi = require('../../Models/Notifikasi');
const ResponseHelper = require('../../Helpers/ResponseHelper');
const { Op } = require('sequelize');

class NotifikasiController {
    /**
     * Get all notifications for user
     */
    static async index(req, res) {
        try {
            const { page = 1, perPage = 20, is_read } = req.query;
            const where = { user_id: req.user.id };

            if (is_read !== undefined) {
                where.is_read = is_read === 'true';
            }

            const offset = (parseInt(page) - 1) * parseInt(perPage);
            
            const { count, rows } = await Notifikasi.findAndCountAll({
                where,
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
    static async markAsRead(req, res) {
        try {
            const { id } = req.params;
            
            const notifikasi = await Notifikasi.findOne({
                where: {
                    id,
                    user_id: req.user.id
                }
            });

            if (!notifikasi) {
                return ResponseHelper.error(res, 'Notifikasi tidak ditemukan', 404);
            }

            await notifikasi.markAsRead();

            return ResponseHelper.success(res, 'Notifikasi ditandai sebagai dibaca');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Mark all notifications as read
     */
    static async markAllAsRead(req, res) {
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
     * Delete notification
     */
    static async destroy(req, res) {
        try {
            const { id } = req.params;
            
            const notifikasi = await Notifikasi.findOne({
                where: {
                    id,
                    user_id: req.user.id
                }
            });

            if (!notifikasi) {
                return ResponseHelper.error(res, 'Notifikasi tidak ditemukan', 404);
            }

            await notifikasi.destroy();

            return ResponseHelper.success(res, 'Notifikasi berhasil dihapus');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Delete all notifications
     */
    static async destroyAll(req, res) {
        try {
            await Notifikasi.destroy({
                where: {
                    user_id: req.user.id
                }
            });

            return ResponseHelper.success(res, 'Semua notifikasi berhasil dihapus');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Get unread count
     */
    static async unreadCount(req, res) {
        try {
            const count = await Notifikasi.count({
                where: {
                    user_id: req.user.id,
                    is_read: false
                }
            });

            return ResponseHelper.success(res, 'Jumlah notifikasi belum dibaca', { count });
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }
}

module.exports = NotifikasiController;
