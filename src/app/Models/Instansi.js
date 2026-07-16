// ==================== INSTANSI MODEL ====================
// Arsip Surat Digital Enterprise

const db = require('../../../config/database');

class Instansi {
    constructor() {
        this.tableName = 'instansi';
    }

    /**
     * Get all instansi with pagination
     */
    async findAll(options = {}) {
        const { page = 1, limit = 20, search = null, isActive = null } = options;
        const offset = (page - 1) * limit;
        
        let query = `SELECT i.*,
                            (SELECT COUNT(*) FROM pengguna WHERE instansi_id = i.id) as total_pengguna,
                            (SELECT COUNT(*) FROM surat_masuk WHERE instansi_id = i.id) as total_surat
                     FROM ${this.tableName} i WHERE 1=1`;
        const params = [];

        if (search) {
            query += ` AND (i.nama LIKE ? OR i.kode LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        if (isActive !== null) {
            query += ` AND i.is_active = ?`;
            params.push(isActive ? 1 : 0);
        }

        const countResult = await db.get(
            query.replace(/SELECT i\.\*,.*?FROM/, 'SELECT COUNT(*) as total FROM'),
            params
        );
        const total = countResult?.total || 0;

        query += ` ORDER BY i.nama ASC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const data = await db.all(query, params);

        return {
            data,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
        };
    }

    /**
     * Find by ID
     */
    async findById(id) {
        return await db.get(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
    }

    /**
     * Find by kode
     */
    async findByKode(kode) {
        return await db.get(`SELECT * FROM ${this.tableName} WHERE kode = ?`, [kode]);
    }

    /**
     * Create instansi
     */
    async create(data) {
        const { kode, nama, alamat, phone, email, website } = data;
        const result = await db.run(
            `INSERT INTO ${this.tableName} (kode, nama, alamat, phone, email, website) VALUES (?, ?, ?, ?, ?, ?)`,
            [kode, nama, alamat || null, phone || null, email || null, website || null]
        );
        return { id: result.lastID };
    }

    /**
     * Update instansi
     */
    async update(id, data) {
        const fields = [];
        const params = [];
        const allowed = ['nama', 'alamat', 'phone', 'email', 'website', 'is_active'];

        for (const [key, value] of Object.entries(data)) {
            if (allowed.includes(key)) {
                fields.push(`${key} = ?`);
                params.push(value);
            }
        }

        if (fields.length === 0) return false;
        params.push(id);

        await db.run(`UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`, params);
        return true;
    }

    /**
     * Delete instansi
     */
    async delete(id) {
        await db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
        return true;
    }

    /**
     * Get statistics
     */
    async getStatistics(id) {
        const queries = [
            db.get(`SELECT COUNT(*) as count FROM pengguna WHERE instansi_id = ?`, [id]),
            db.get(`SELECT COUNT(*) as count FROM surat_masuk WHERE instansi_id = ?`, [id]),
            db.get(`SELECT COUNT(*) as count FROM surat_keluar WHERE instansi_id = ?`, [id]),
            db.get(`SELECT COUNT(*) as count FROM disposisi WHERE instansi_id = ?`, [id]),
        ];

        const [pengguna, suratMasuk, suratKeluar, disposisi] = await Promise.all(queries);

        return {
            pengguna: pengguna?.count || 0,
            suratMasuk: suratMasuk?.count || 0,
            suratKeluar: suratKeluar?.count || 0,
            disposisi: disposisi?.count || 0,
        };
    }
}

module.exports = new Instansi();
