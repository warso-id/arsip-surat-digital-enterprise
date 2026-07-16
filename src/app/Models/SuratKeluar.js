// ==================== SURAT KELUAR MODEL ====================
// Arsip Surat Digital Enterprise

const db = require('../../../config/database');
const config = require('../../../config/app');

class SuratKeluar {
    constructor() {
        this.tableName = 'surat_keluar';
    }

    /**
     * Get all surat keluar with pagination
     */
    async findAll(options = {}) {
        const {
            page = 1, limit = 15,
            status = null, kategori = null,
            search = null, startDate = null, endDate = null,
            instansi_id = null, tujuan = null,
            orderBy = 'created_at', orderDir = 'DESC',
        } = options;

        const offset = (page - 1) * limit;
        
        let query = `SELECT sk.*, 
                            k.nama as kategori_nama,
                            u.fullname as created_by_name,
                            i.nama as instansi_nama
                     FROM ${this.tableName} sk
                     LEFT JOIN kategori k ON sk.kategori_id = k.id
                     LEFT JOIN pengguna u ON sk.created_by = u.id
                     LEFT JOIN instansi i ON sk.instansi_id = i.id
                     WHERE 1=1`;
        
        const params = [];

        if (status) {
            query += ` AND sk.status = ?`;
            params.push(status);
        }

        if (kategori) {
            query += ` AND sk.kategori = ?`;
            params.push(kategori);
        }

        if (instansi_id) {
            query += ` AND sk.instansi_id = ?`;
            params.push(instansi_id);
        }

        if (tujuan) {
            query += ` AND sk.tujuan LIKE ?`;
            params.push(`%${tujuan}%`);
        }

        if (startDate) {
            query += ` AND sk.tanggal_surat >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND sk.tanggal_surat <= ?`;
            params.push(endDate);
        }

        if (search) {
            query += ` AND (sk.nomor_surat LIKE ? 
                           OR sk.tujuan LIKE ? 
                           OR sk.perihal LIKE ? 
                           OR sk.isi_surat LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }

        // Count
        const countQuery = query.replace(/SELECT sk\.\*,.*?FROM/, 'SELECT COUNT(*) as total FROM');
        const totalResult = await db.get(countQuery, params);
        const total = totalResult?.total || 0;

        // Order & paginate
        query += ` ORDER BY sk.${orderBy} ${orderDir}`;
        query += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const rows = await db.all(query, params);

        return {
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Find by ID
     */
    async findById(id) {
        const query = `SELECT sk.*, 
                              k.nama as kategori_nama,
                              u.fullname as created_by_name,
                              i.nama as instansi_nama
                       FROM ${this.tableName} sk
                       LEFT JOIN kategori k ON sk.kategori_id = k.id
                       LEFT JOIN pengguna u ON sk.created_by = u.id
                       LEFT JOIN instansi i ON sk.instansi_id = i.id
                       WHERE sk.id = ?`;
        return await db.get(query, [id]);
    }

    /**
     * Create surat keluar
     */
    async create(data) {
        const {
            nomor_surat, tanggal_surat, tujuan, perihal,
            isi_surat, kategori, sifat_surat, status = 'konsep',
            catatan, instansi_id, created_by,
        } = data;

        const query = `INSERT INTO ${this.tableName} 
                       (nomor_surat, tanggal_surat, tujuan, perihal, isi_surat,
                        kategori, sifat_surat, status, catatan,
                        instansi_id, created_by, created_at, updated_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`;

        const result = await db.run(query, [
            nomor_surat, tanggal_surat, tujuan, perihal, isi_surat || null,
            kategori || 'biasa', sifat_surat || 'biasa', status, catatan || null,
            instansi_id, created_by,
        ]);

        return { id: result.lastID, nomor_surat };
    }

    /**
     * Update surat keluar
     */
    async update(id, data) {
        const fields = [];
        const params = [];
        const allowed = ['nomor_surat', 'tanggal_surat', 'tujuan', 'perihal', 
                         'isi_surat', 'kategori', 'sifat_surat', 'status', 'catatan'];

        for (const [key, value] of Object.entries(data)) {
            if (allowed.includes(key)) {
                fields.push(`${key} = ?`);
                params.push(value);
            }
        }

        if (fields.length === 0) return false;

        fields.push('updated_at = datetime("now")');
        params.push(id);

        await db.run(`UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`, params);
        return true;
    }

    /**
     * Delete surat keluar
     */
    async delete(id) {
        await db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
        return true;
    }

    /**
     * Search surat keluar
     */
    async search(query, instansi_id = null, limit = 20) {
        let sql = `SELECT * FROM ${this.tableName} WHERE 1=1`;
        const params = [];

        if (query) {
            sql += ` AND (nomor_surat LIKE ? OR tujuan LIKE ? OR perihal LIKE ? OR isi_surat LIKE ?)`;
            const s = `%${query}%`;
            params.push(s, s, s, s);
        }

        if (instansi_id) {
            sql += ` AND instansi_id = ?`;
            params.push(instansi_id);
        }

        sql += ` ORDER BY tanggal_surat DESC LIMIT ?`;
        params.push(limit);

        return await db.all(sql, params);
    }

    /**
     * Get statistics
     */
    async getStatistics(instansi_id = null, period = 'month') {
        let dateFilter = '';
        if (period === 'month') dateFilter = `AND tanggal_surat >= date('now', '-30 days')`;
        if (period === 'year') dateFilter = `AND tanggal_surat >= date('now', '-365 days')`;

        let instansiFilter = '';
        if (instansi_id) instansiFilter = `AND instansi_id = ${instansi_id}`;

        const totalQuery = `SELECT 
                                COUNT(*) as total,
                                SUM(CASE WHEN status = 'konsep' THEN 1 ELSE 0 END) as konsep,
                                SUM(CASE WHEN status = 'terkirim' THEN 1 ELSE 0 END) as terkirim,
                                SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft
                            FROM ${this.tableName} WHERE 1=1 ${dateFilter} ${instansiFilter}`;

        const monthlyQuery = `SELECT 
                                  strftime('%Y-%m', tanggal_surat) as month,
                                  COUNT(*) as count
                              FROM ${this.tableName} WHERE 1=1 ${instansiFilter}
                              GROUP BY strftime('%Y-%m', tanggal_surat)
                              ORDER BY month DESC LIMIT 12`;

        const [total, monthly] = await Promise.all([
            db.get(totalQuery),
            db.all(monthlyQuery),
        ]);

        return { total: total || {}, monthly: monthly || [] };
    }
}

module.exports = new SuratKeluar();
