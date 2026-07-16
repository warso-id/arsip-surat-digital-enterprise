// ==================== LOG AKTIVITAS MODEL ====================
// Arsip Surat Digital Enterprise

const db = require('../../../config/database');

class LogAktivitas {
    constructor() {
        this.tableName = 'log_aktivitas';
    }

    /**
     * Create activity log
     */
    async create(data) {
        const {
            user_id,
            action,
            description,
            ip_address,
            user_agent,
            metadata,
        } = data;

        const query = `INSERT INTO ${this.tableName} 
                       (user_id, action, description, ip_address, user_agent, metadata, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`;

        const result = await db.run(query, [
            user_id || null,
            action,
            description || null,
            ip_address || null,
            user_agent || null,
            metadata ? JSON.stringify(metadata) : null,
        ]);

        return { id: result.lastID };
    }

    /**
     * Get recent activities
     */
    async getRecent(limit = 20, instansi_id = null) {
        let query = `SELECT la.*, u.fullname as user_fullname, u.username
                     FROM ${this.tableName} la
                     LEFT JOIN pengguna u ON la.user_id = u.id
                     WHERE 1=1`;
        
        const params = [];

        if (instansi_id) {
            query += ` AND (u.instansi_id = ? OR la.user_id IS NULL)`;
            params.push(instansi_id);
        }

        query += ` ORDER BY la.created_at DESC LIMIT ?`;
        params.push(limit);

        return await db.all(query, params);
    }

    /**
     * Get activities by user
     */
    async findByUser(userId, limit = 50) {
        const query = `SELECT * FROM ${this.tableName} 
                       WHERE user_id = ? 
                       ORDER BY created_at DESC 
                       LIMIT ?`;
        return await db.all(query, [userId, limit]);
    }

    /**
     * Get activities by action
     */
    async findByAction(action, limit = 50) {
        const query = `SELECT la.*, u.fullname as user_fullname
                       FROM ${this.tableName} la
                       LEFT JOIN pengguna u ON la.user_id = u.id
                       WHERE la.action = ?
                       ORDER BY la.created_at DESC
                       LIMIT ?`;
        return await db.all(query, [action, limit]);
    }

    /**
     * Get activities within date range
     */
    async findByDateRange(startDate, endDate, instansi_id = null) {
        let query = `SELECT la.*, u.fullname as user_fullname
                     FROM ${this.tableName} la
                     LEFT JOIN pengguna u ON la.user_id = u.id
                     WHERE la.created_at BETWEEN ? AND ?`;
        
        const params = [startDate, endDate];

        if (instansi_id) {
            query += ` AND u.instansi_id = ?`;
            params.push(instansi_id);
        }

        query += ` ORDER BY la.created_at DESC LIMIT 500`;

        return await db.all(query, params);
    }

    /**
     * Get activity statistics
     */
    async getStatistics(instansi_id = null, days = 30) {
        let filter = '';
        const params = [days];

        if (instansi_id) {
            filter = `AND u.instansi_id = ?`;
            params.push(instansi_id);
        }

        // Count by action
        const actionQuery = `SELECT la.action, COUNT(*) as count
                             FROM ${this.tableName} la
                             LEFT JOIN pengguna u ON la.user_id = u.id
                             WHERE la.created_at >= datetime('now', '-' || ? || ' days')
                             ${filter}
                             GROUP BY la.action
                             ORDER BY count DESC
                             LIMIT 10`;

        // Count by day
        const dailyQuery = `SELECT date(la.created_at) as date, COUNT(*) as count
                            FROM ${this.tableName} la
                            LEFT JOIN pengguna u ON la.user_id = u.id
                            WHERE la.created_at >= datetime('now', '-' || ? || ' days')
                            ${filter}
                            GROUP BY date(la.created_at)
                            ORDER BY date DESC`;

        // Count by user
        const userQuery = `SELECT u.fullname, u.username, COUNT(*) as count
                           FROM ${this.tableName} la
                           LEFT JOIN pengguna u ON la.user_id = u.id
                           WHERE la.created_at >= datetime('now', '-' || ? || ' days')
                           ${filter}
                           AND la.user_id IS NOT NULL
                           GROUP BY la.user_id
                           ORDER BY count DESC
                           LIMIT 10`;

        const [byAction, byDay, byUser] = await Promise.all([
            db.all(actionQuery, params),
            db.all(dailyQuery, params),
            db.all(userQuery, params),
        ]);

        return {
            byAction,
            byDay,
            byUser,
            total: byDay.reduce((sum, d) => sum + d.count, 0),
        };
    }

    /**
     * Clean old logs
     */
    async cleanOld(days = 90) {
        const query = `DELETE FROM ${this.tableName} 
                       WHERE created_at < datetime('now', '-' || ? || ' days')`;
        const result = await db.run(query, [days]);
        return result.changes;
    }

    /**
     * Get login history for user
     */
    async getLoginHistory(userId, limit = 20) {
        const query = `SELECT * FROM ${this.tableName} 
                       WHERE user_id = ? 
                       AND (action = 'LOGIN_SUCCESS' OR action = 'LOGIN_FAILED')
                       ORDER BY created_at DESC 
                       LIMIT ?`;
        return await db.all(query, [userId, limit]);
    }

    /**
     * Get failed login attempts
     */
    async getFailedLogins(minutes = 15) {
        const query = `SELECT la.*, u.username, u.email
                       FROM ${this.tableName} la
                       LEFT JOIN pengguna u ON la.user_id = u.id
                       WHERE la.action = 'LOGIN_FAILED'
                       AND la.created_at >= datetime('now', '-' || ? || ' minutes')
                       ORDER BY la.created_at DESC`;
        return await db.all(query, [minutes]);
    }
}

module.exports = new LogAktivitas();
