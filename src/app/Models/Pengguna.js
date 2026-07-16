// ==================== PENGGUNA MODEL ====================
// Arsip Surat Digital Enterprise

const db = require('../../../config/database');

class Pengguna {
    constructor() {
        this.tableName = 'pengguna';
    }

    /**
     * Get all users
     */
    async findAll(options = {}) {
        const { page = 1, limit = 20, search, role_id, instansi_id, is_active } = options;
        const offset = (page - 1) * limit;
        
        let query = `SELECT p.id, p.username, p.email, p.fullname, p.jabatan, 
                            p.nip, p.phone, p.avatar, p.role_id, p.instansi_id,
                            p.is_active, p.last_login, p.last_activity, p.created_at,
                            r.nama as role_nama, r.kode as role_kode,
                            i.nama as instansi_nama
                     FROM ${this.tableName} p
                     LEFT JOIN roles r ON p.role_id = r.id
                     LEFT JOIN instansi i ON p.instansi_id = i.id
                     WHERE 1=1`;
        const params = [];

        if (search) {
            query += ` AND (p.username LIKE ? OR p.email LIKE ? OR p.fullname LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (role_id) { query += ` AND p.role_id = ?`; params.push(role_id); }
        if (instansi_id) { query += ` AND p.instansi_id = ?`; params.push(instansi_id); }
        if (is_active !== null) { query += ` AND p.is_active = ?`; params.push(is_active ? 1 : 0); }

        const total = (await db.get(query.replace(/SELECT p\.\*,.*?FROM/, 'SELECT COUNT(*) as total FROM'), params))?.total || 0;
        
        query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        return {
            data: await db.all(query, params),
            pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
        };
    }

    async findById(id) {
        return await db.get(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
    }

    async findByUsername(username) {
        return await db.get(`SELECT * FROM ${this.tableName} WHERE username = ?`, [username]);
    }

    async findByEmail(email) {
        return await db.get(`SELECT * FROM ${this.tableName} WHERE email = ?`, [email]);
    }

    async create(data) {
        const { username, email, password, fullname, jabatan, nip, phone, role_id, instansi_id } = data;
        const result = await db.run(
            `INSERT INTO ${this.tableName} (username, email, password, fullname, jabatan, nip, phone, role_id, instansi_id, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [username, email, password, fullname, jabatan || null, nip || null, phone || null, role_id, instansi_id || null]
        );
        return result.lastID;
    }

    async update(id, data) {
        const fields = [];
        const params = [];
        const allowed = ['email', 'fullname', 'jabatan', 'nip', 'phone', 'role_id', 'instansi_id', 'is_active'];
        for (const [k, v] of Object.entries(data)) {
            if (allowed.includes(k)) { fields.push(`${k} = ?`); params.push(v); }
        }
        if (!fields.length) return false;
        params.push(id);
        await db.run(`UPDATE ${this.tableName} SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params);
        return true;
    }

    async updatePassword(id, hashedPassword) {
        await db.run(`UPDATE ${this.tableName} SET password = ?, password_changed_at = datetime('now') WHERE id = ?`, [hashedPassword, id]);
    }

    async updateLastLogin(id) {
        await db.run(`UPDATE ${this.tableName} SET last_login = datetime('now'), login_attempts = 0 WHERE id = ?`, [id]);
    }

    async incrementLoginAttempts(id) {
        await db.run(`UPDATE ${this.tableName} SET login_attempts = login_attempts + 1, last_login_attempt = datetime('now') WHERE id = ?`, [id]);
    }

    async resetLoginAttempts(id) {
        await db.run(`UPDATE ${this.tableName} SET login_attempts = 0 WHERE id = ?`, [id]);
    }

    async updateLastActivity(id) {
        await db.run(`UPDATE ${this.tableName} SET last_activity = datetime('now') WHERE id = ?`, [id]);
    }

    async saveResetToken(id, token) {
        await db.run(`UPDATE ${this.tableName} SET reset_token = ?, reset_token_expires = datetime('now', '+1 hour') WHERE id = ?`, [token, id]);
    }

    async clearResetToken(id) {
        await db.run(`UPDATE ${this.tableName} SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?`, [id]);
    }

    async delete(id) {
        await db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    }
}

module.exports = new Pengguna();
