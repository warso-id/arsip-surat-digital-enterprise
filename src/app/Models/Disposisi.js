// ==================== DISPOSISI MODEL ====================
// Arsip Surat Digital Enterprise

const db = require('../../../config/database');

class Disposisi {
    constructor() {
        this.tableName = 'disposisi';
    }

    /**
     * Get all disposisi with pagination
     */
    async findAll(options = {}) {
        const {
            page = 1,
            limit = 15,
            status = null,
            instansi_id = null,
            user_id = null,
            orderBy = 'created_at',
            orderDir = 'DESC',
        } = options;

        const offset = (page - 1) * limit;
        
        let query = `SELECT d.*,
                            sm.nomor_agenda,
                            sm.perihal as surat_perihal,
                            sm.pengirim as surat_pengirim,
                            u1.fullname as dari_nama,
                            u2.fullname as kepada_nama,
                            r.nama as role_nama
                     FROM ${this.tableName} d
                     LEFT JOIN surat_masuk sm ON d.surat_masuk_id = sm.id
                     LEFT JOIN pengguna u1 ON d.dari_user_id = u1.id
                     LEFT JOIN pengguna u2 ON d.kepada_user_id = u2.id
                     LEFT JOIN role r ON d.kepada_role_id = r.id
                     WHERE 1=1`;
        
        const params = [];

        if (status) {
            query += ` AND d.status = ?`;
            params.push(status);
        }

        if (instansi_id) {
            query += ` AND d.instansi_id = ?`;
            params.push(instansi_id);
        }

        if (user_id) {
            query += ` AND (d.dari_user_id = ? OR d.kepada_user_id = ?)`;
            params.push(user_id, user_id);
        }

        // Count total
        const countQuery = query.replace(/SELECT d\.\*,.*?FROM/, 'SELECT COUNT(*) as total FROM');
        const totalResult = await db.get(countQuery, params);
        const total = totalResult?.total || 0;

        // Order and paginate
        query += ` ORDER BY d.${orderBy} ${orderDir}`;
        query += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const rows = await db.all(query, params);

        return {
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Find disposisi by ID
     */
    async findById(id) {
        const query = `SELECT d.*,
                              sm.nomor_agenda,
                              sm.perihal,
                              sm.pengirim,
                              u1.fullname as dari_nama,
                              u2.fullname as kepada_nama
                       FROM ${this.tableName} d
                       LEFT JOIN surat_masuk sm ON d.surat_masuk_id = sm.id
                       LEFT JOIN pengguna u1 ON d.dari_user_id = u1.id
                       LEFT JOIN pengguna u2 ON d.kepada_user_id = u2.id
                       WHERE d.id = ?`;
        
        return await db.get(query, [id]);
    }

    /**
     * Find disposisi by surat masuk
     */
    async findBySuratMasuk(suratMasukId) {
        const query = `SELECT d.*,
                              u1.fullname as dari_nama,
                              u2.fullname as kepada_nama
                       FROM ${this.tableName} d
                       LEFT JOIN pengguna u1 ON d.dari_user_id = u1.id
                       LEFT JOIN pengguna u2 ON d.kepada_user_id = u2.id
                       WHERE d.surat_masuk_id = ?
                       ORDER BY d.created_at DESC`;
        
        return await db.all(query, [suratMasukId]);
    }

    /**
     * Find disposisi by user (inbox/outbox)
     */
    async findByUser(userId, type = 'inbox') {
        let query = `SELECT d.*,
                            sm.nomor_agenda,
                            sm.perihal,
                            u1.fullname as dari_nama,
                            u2.fullname as kepada_nama
                     FROM ${this.tableName} d
                     LEFT JOIN surat_masuk sm ON d.surat_masuk_id = sm.id
                     LEFT JOIN pengguna u1 ON d.dari_user_id = u1.id
                     LEFT JOIN pengguna u2 ON d.kepada_user_id = u2.id
                     WHERE `;
        
        if (type === 'inbox') {
            query += `d.kepada_user_id = ?`;
        } else {
            query += `d.dari_user_id = ?`;
        }
        
        query += ` ORDER BY d.created_at DESC LIMIT 50`;
        
        return await db.all(query, [userId]);
    }

    /**
     * Create new disposisi
     */
    async create(data) {
        const {
            surat_masuk_id,
            dari_user_id,
            kepada_user_id,
            kepada_role_id,
            isi_disposisi,
            sifat_disposisi,
            batas_waktu,
            status = 'pending',
            instansi_id,
            created_by,
        } = data;

        const query = `INSERT INTO ${this.tableName} 
                       (surat_masuk_id, dari_user_id, kepada_user_id, kepada_role_id,
                        isi_disposisi, sifat_disposisi, batas_waktu, status,
                        instansi_id, created_by, created_at, updated_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`;

        const result = await db.run(query, [
            surat_masuk_id,
            dari_user_id,
            kepada_user_id || null,
            kepada_role_id || null,
            isi_disposisi,
            sifat_disposisi || 'biasa',
            batas_waktu || null,
            status,
            instansi_id,
            created_by,
        ]);

        return {
            id: result.lastID,
        };
    }

    /**
     * Update disposisi status
     */
    async updateStatus(id, status, catatan = null) {
        const query = `UPDATE ${this.tableName} 
                       SET status = ?, 
                           catatan_tindak_lanjut = ?,
                           tanggal_selesai = CASE WHEN ? = 'selesai' THEN datetime('now') ELSE tanggal_selesai END,
                           updated_at = datetime('now')
                       WHERE id = ?`;
        
        await db.run(query, [status, catatan, status, id]);
        return true;
    }

    /**
     * Update disposisi
     */
    async update(id, data) {
        const fields = [];
        const params = [];

        const allowedFields = [
            'isi_disposisi', 'sifat_disposisi', 'batas_waktu',
            'status', 'catatan_tindak_lanjut',
        ];

        for (const [key, value] of Object.entries(data)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                params.push(value);
            }
        }

        if (fields.length === 0) return false;

        fields.push('updated_at = datetime("now")');
        params.push(id);

        const query = `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`;
        await db.run(query, params);
        return true;
    }

    /**
     * Get tracking by surat masuk
     */
    async getTracking(suratMasukId) {
        const query = `SELECT d.*,
                              u1.fullname as dari_nama,
                              u1.jabatan as dari_jabatan,
                              u2.fullname as kepada_nama,
                              u2.jabatan as kepada_jabatan,
                              r.nama as role_nama
                       FROM ${this.tableName} d
                       LEFT JOIN pengguna u1 ON d.dari_user_id = u1.id
                       LEFT JOIN pengguna u2 ON d.kepada_user_id = u2.id
                       LEFT JOIN role r ON d.kepada_role_id = r.id
                       WHERE d.surat_masuk_id = ?
                       ORDER BY d.created_at ASC`;
        
        return await db.all(query, [suratMasukId]);
    }

    /**
     * Get disposisi statistics
     */
    async getStatistics(instansi_id = null) {
        let filter = '';
        if (instansi_id) {
            filter = `WHERE instansi_id = ${instansi_id}`;
        }

        const query = `SELECT 
                           COUNT(*) as total,
                           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                           SUM(CASE WHEN status = 'proses' THEN 1 ELSE 0 END) as proses,
                           SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as selesai,
                           SUM(CASE WHEN status = 'ditolak' THEN 1 ELSE 0 END) as ditolak
                       FROM ${this.tableName}
                       ${filter}`;

        return await db.get(query);
    }

    /**
     * Get pending disposisi count for user
     */
    async getPendingCount(userId) {
        const query = `SELECT COUNT(*) as count 
                       FROM ${this.tableName} 
                       WHERE kepada_user_id = ? 
                       AND status IN ('pending', 'proses')`;
        
        const result = await db.get(query, [userId]);
        return result?.count || 0;
    }
}

module.exports = new Disposisi();
