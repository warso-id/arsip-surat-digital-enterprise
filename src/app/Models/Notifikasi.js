// ==================== NOTIFIKASI MODEL ====================
// Arsip Surat Digital Enterprise

const db = require('../../../config/database');

class Notifikasi {
    constructor() {
        this.tableName = 'notifikasi';
    }

    /**
     * Create notification
     */
    async create(data) {
        const {
            user_id,
            type,
            title,
            message,
            data: notificationData,
            instansi_id,
        } = data;

        const query = `INSERT INTO ${this.tableName} 
                       (user_id, type, title, message, data, instansi_id, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`;

        const result = await db.run(query, [
            user_id || null,
            type,
            title,
            message || null,
            notificationData ? JSON.stringify(notificationData) : null,
            instansi_id || null,
        ]);

        return { id: result.lastID };
    }

    /**
     * Get notifications for user
     */
    async findByUser(userId, options = {}) {
        const {
            page = 1,
            limit = 20,
            isRead = null,
            type = null,
        } = options;

        const offset = (page - 1) * limit;
        
        let query = `SELECT * FROM ${this.tableName} WHERE 1=1`;
        const params = [];

        // Filter by user (specific user or broadcast)
        query += ` AND (user_id = ? OR user_id IS NULL)`;
        params.push(userId);

        if (isRead !== null) {
            query += ` AND is_read = ?`;
            params.push(isRead ? 1 : 0);
        }

        if (type) {
            query += ` AND type = ?`;
            params.push(type);
        }

        // Count total
        const countResult = await db.get(
            query.replace('SELECT *', 'SELECT COUNT(*) as total'),
            params
        );
        const total = countResult?.total || 0;

        // Get data
        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const data = await db.all(query, params);

        return {
            data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get unread count
     */
    async getUnreadCount(userId) {
        const query = `SELECT COUNT(*) as count FROM ${this.tableName} 
                       WHERE (user_id = ? OR user_id IS NULL) 
                       AND is_read = 0`;
        const result = await db.get(query, [userId]);
        return result?.count || 0;
    }

    /**
     * Mark notification as read
     */
    async markAsRead(id, userId) {
        const query = `UPDATE ${this.tableName} 
                       SET is_read = 1, read_at = datetime('now') 
                       WHERE id = ? AND (user_id = ? OR user_id IS NULL)`;
        await db.run(query, [id, userId]);
        return true;
    }

    /**
     * Mark all as read for user
     */
    async markAllAsRead(userId) {
        const query = `UPDATE ${this.tableName} 
                       SET is_read = 1, read_at = datetime('now') 
                       WHERE (user_id = ? OR user_id IS NULL) 
                       AND is_read = 0`;
        const result = await db.run(query, [userId]);
        return result.changes;
    }

    /**
     * Delete notification
     */
    async delete(id) {
        const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
        await db.run(query, [id]);
        return true;
    }

    /**
     * Delete all read notifications for user
     */
    async deleteAllRead(userId) {
        const query = `DELETE FROM ${this.tableName} 
                       WHERE (user_id = ? OR user_id IS NULL) 
                       AND is_read = 1`;
        const result = await db.run(query, [userId]);
        return result.changes;
    }

    /**
     * Broadcast notification to all users in instansi
     */
    async broadcastToInstansi(instansiId, notification) {
        const users = await db.all(
            'SELECT id FROM pengguna WHERE instansi_id = ? AND is_active = 1',
            [instansiId]
        );

        const results = [];
        for (const user of users) {
            const result = await this.create({
                ...notification,
                user_id: user.id,
                instansi_id: instansiId,
            });
            results.push(result);
        }

        return results;
    }

    /**
     * Broadcast to specific role
     */
    async broadcastToRole(roleId, notification) {
        const users = await db.all(
            'SELECT id, instansi_id FROM pengguna WHERE role_id = ? AND is_active = 1',
            [roleId]
        );

        const results = [];
        for (const user of users) {
            const result = await this.create({
                ...notification,
                user_id: user.id,
                instansi_id: user.instansi_id,
            });
            results.push(result);
        }

        return results;
    }

    /**
     * Clean old notifications
     */
    async cleanOld(days = 30) {
        const query = `DELETE FROM ${this.tableName} 
                       WHERE created_at < datetime('now', '-' || ? || ' days')
                       AND is_read = 1`;
        const result = await db.run(query, [days]);
        return result.changes;
    }

    /**
     * Get notification statistics
     */
    async getStatistics(userId) {
        const totalQuery = `SELECT COUNT(*) as total FROM ${this.tableName} 
                            WHERE (user_id = ? OR user_id IS NULL)`;
        const unreadQuery = `SELECT COUNT(*) as count FROM ${this.tableName} 
                             WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`;
        const byTypeQuery = `SELECT type, COUNT(*) as count FROM ${this.tableName} 
                             WHERE (user_id = ? OR user_id IS NULL) 
                             GROUP BY type`;

        const [total, unread, byType] = await Promise.all([
            db.get(totalQuery, [userId]),
            db.get(unreadQuery, [userId]),
            db.all(byTypeQuery, [userId]),
        ]);

        return {
            total: total?.total || 0,
            unread: unread?.count || 0,
            byType: byType || [],
        };
    }
}

module.exports = new Notifikasi();
