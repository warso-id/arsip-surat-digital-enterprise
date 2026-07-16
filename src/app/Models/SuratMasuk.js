// ==================== SURAT MASUK MODEL ====================
// Arsip Surat Digital Enterprise

const db = require('../../../config/database');
const config = require('../../../config/app');

class SuratMasuk {
    constructor() {
        this.tableName = 'surat_masuk';
        this.primaryKey = 'id';
    }

    /**
     * Get all surat masuk with pagination and filters
     */
    async findAll(options = {}) {
        const {
            page = 1,
            limit = config.api.pagination.perPage,
            status = null,
            kategori = null,
            search = null,
            startDate = null,
            endDate = null,
            instansi_id = null,
            orderBy = 'created_at',
            orderDir = 'DESC',
        } = options;

        const offset = (page - 1) * limit;
        
        let query = `SELECT sm.*, 
                            k.nama as kategori_nama,
                            u.fullname as created_by_name,
                            i.nama as instansi_nama
                     FROM ${this.tableName} sm
                     LEFT JOIN kategori k ON sm.kategori_id = k.id
                     LEFT JOIN pengguna u ON sm.created_by = u.id
                     LEFT JOIN instansi i ON sm.instansi_id = i.id
                     WHERE 1=1`;
        
        const params = [];

        if (status) {
            query += ` AND sm.status = ?`;
            params.push(status);
        }

        if (kategori) {
            query += ` AND sm.kategori = ?`;
            params.push(kategori);
        }

        if (instansi_id) {
            query += ` AND sm.instansi_id = ?`;
            params.push(instansi_id);
        }

        if (startDate) {
            query += ` AND sm.tanggal_terima >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND sm.tanggal_terima <= ?`;
            params.push(endDate);
        }

        if (search) {
            query += ` AND (sm.nomor_surat LIKE ? 
                           OR sm.pengirim LIKE ? 
                           OR sm.perihal LIKE ? 
                           OR sm.ringkasan LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        // Count total
        const countQuery = query.replace('SELECT sm.*, k.nama as kategori_nama, u.fullname as created_by_name, i.nama as instansi_nama', 'SELECT COUNT(*) as total');
        const totalResult = await db.get(countQuery, params);
        const total = totalResult?.total || 0;

        // Add ordering and pagination
        const allowedColumns = ['nomor_agenda', 'tanggal_terima', 'pengirim', 'perihal', 'status', 'created_at'];
        const orderColumn = allowedColumns.includes(orderBy) ? orderBy : 'created_at';
        const orderDirection = orderDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        
        query += ` ORDER BY sm.${orderColumn} ${orderDirection}`;
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
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        };
    }

    /**
     * Find surat masuk by ID
     */
    async findById(id) {
        const query = `SELECT sm.*, 
                              k.nama as kategori_nama,
                              u.fullname as created_by_name,
                              i.nama as instansi_nama
                       FROM ${this.tableName} sm
                       LEFT JOIN kategori k ON sm.kategori_id = k.id
                       LEFT JOIN pengguna u ON sm.created_by = u.id
                       LEFT JOIN instansi i ON sm.instansi_id = i.id
                       WHERE sm.id = ?`;
        
        return await db.get(query, [id]);
    }

    /**
     * Find surat masuk by nomor agenda
     */
    async findByNomorAgenda(nomorAgenda) {
        return await db.get(
            `SELECT * FROM ${this.tableName} WHERE nomor_agenda = ?`,
            [nomorAgenda]
        );
    }

    /**
     * Create new surat masuk
     */
    async create(data) {
        const {
            nomor_agenda,
            nomor_surat,
            tanggal_surat,
            tanggal_terima,
            pengirim,
            perihal,
            ringkasan,
            kategori,
            sifat_surat,
            prioritas,
            status = 'baru',
            catatan,
            instansi_id,
            created_by,
        } = data;

        const query = `INSERT INTO ${this.tableName} 
                       (nomor_agenda, nomor_surat, tanggal_surat, tanggal_terima, 
                        pengirim, perihal, ringkasan, kategori, sifat_surat, 
                        prioritas, status, catatan, instansi_id, created_by, 
                        created_at, updated_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`;

        const result = await db.run(query, [
            nomor_agenda,
            nomor_surat,
            tanggal_surat,
            tanggal_terima,
            pengirim,
            perihal,
            ringkasan || null,
            kategori || 'biasa',
            sifat_surat || 'biasa',
            prioritas || 'sedang',
            status,
            catatan || null,
            instansi_id,
            created_by,
        ]);

        return {
            id: result.lastID,
            nomor_agenda: nomor_agenda,
        };
    }

    /**
     * Update surat masuk
     */
    async update(id, data) {
        const fields = [];
        const params = [];

        const allowedFields = [
            'nomor_surat', 'tanggal_surat', 'tanggal_terima', 'pengirim',
            'perihal', 'ringkasan', 'kategori', 'sifat_surat', 'prioritas',
            'status', 'catatan',
        ];

        for (const [key, value] of Object.entries(data)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                params.push(value);
            }
        }

        if (fields.length === 0) {
            return false;
        }

        fields.push('updated_at = datetime("now")');
        params.push(id);

        const query = `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`;
        await db.run(query, params);

        return true;
    }

    /**
     * Delete surat masuk
     */
    async delete(id) {
        const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
        await db.run(query, [id]);
        return true;
    }

    /**
     * Generate nomor agenda
     */
    async generateNomorAgenda(instansi_id) {
        const year = new Date().getFullYear();
        const prefix = config.surat.nomorFormat.masuk
            .replace('{YEAR}', year);

        const query = `SELECT COUNT(*) as count 
                       FROM ${this.tableName} 
                       WHERE instansi_id = ? 
                       AND strftime('%Y', tanggal_terima) = ?`;
        
        const result = await db.get(query, [instansi_id, year.toString()]);
        const count = (result?.count || 0) + 1;
        
        return prefix.replace('{NUMBER}', String(count).padStart(4, '0'));
    }

    /**
     * Get statistics
     */
    async getStatistics(instansi_id = null, period = 'month') {
        let dateFilter = '';
        switch (period) {
            case 'week':
                dateFilter = `AND sm.tanggal_terima >= date('now', '-7 days')`;
                break;
            case 'month':
                dateFilter = `AND sm.tanggal_terima >= date('now', '-30 days')`;
                break;
            case 'year':
                dateFilter = `AND sm.tanggal_terima >= date('now', '-365 days')`;
                break;
            default:
                dateFilter = '';
        }

        let instansiFilter = '';
        if (instansi_id) {
            instansiFilter = `AND sm.instansi_id = ${instansi_id}`;
        }

        const totalQuery = `SELECT 
                                COUNT(*) as total,
                                SUM(CASE WHEN status = 'baru' THEN 1 ELSE 0 END) as baru,
                                SUM(CASE WHEN status = 'proses' THEN 1 ELSE 0 END) as proses,
                                SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as selesai,
                                SUM(CASE WHEN status = 'arsip' THEN 1 ELSE 0 END) as arsip
                            FROM ${this.tableName} sm
                            WHERE 1=1 ${dateFilter} ${instansiFilter}`;

        const kategoriQuery = `SELECT 
                                   kategori,
                                   COUNT(*) as count
                               FROM ${this.tableName} sm
                               WHERE 1=1 ${dateFilter} ${instansiFilter}
                               GROUP BY kategori`;

        const monthlyQuery = `SELECT 
                                  strftime('%Y-%m', tanggal_terima) as month,
                                  COUNT(*) as count
                              FROM ${this.tableName} sm
                              WHERE 1=1 ${instansiFilter}
                              GROUP BY strftime('%Y-%m', tanggal_terima)
                              ORDER BY month DESC
                              LIMIT 12`;

        const [total, kategori, monthly] = await Promise.all([
            db.get(totalQuery),
            db.all(kategoriQuery),
            db.all(monthlyQuery),
        ]);

        return {
            total: total || {},
            kategori: kategori || [],
            monthly: monthly || [],
        };
    }

    /**
     * Bulk update status
     */
    async bulkUpdateStatus(ids, status) {
        const placeholders = ids.map(() => '?').join(',');
        const query = `UPDATE ${this.tableName} 
                       SET status = ?, updated_at = datetime('now') 
                       WHERE id IN (${placeholders})`;
        
        await db.run(query, [status, ...ids]);
        return true;
    }

    /**
     * Search surat (full-text)
     */
    async search(query, instansi_id = null, limit = 20) {
        let sql = `SELECT sm.*, k.nama as kategori_nama
                   FROM ${this.tableName} sm
                   LEFT JOIN kategori k ON sm.kategori_id = k.id
                   WHERE (sm.nomor_surat LIKE ? 
                          OR sm.pengirim LIKE ? 
                          OR sm.perihal LIKE ? 
                          OR sm.ringkasan LIKE ?)`;
        
        const params = [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`];

        if (instansi_id) {
            sql += ` AND sm.instansi_id = ?`;
            params.push(instansi_id);
        }

        sql += ` ORDER BY sm.tanggal_terima DESC LIMIT ?`;
        params.push(limit);

        return await db.all(sql, params);
    }
}

module.exports = new SuratMasuk();
