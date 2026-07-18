const Kategori = require('../../Models/Kategori');
const ResponseHelper = require('../../Helpers/ResponseHelper');
const LogAktivitas = require('../../Models/LogAktivitas');
const { Op } = require('sequelize');

class KategoriController {
    /**
     * Get all kategori with pagination
     */
    static async index(req, res) {
        try {
            const { page = 1, perPage = 20, search } = req.query;
            const where = {};

            if (search) {
                where[Op.or] = [
                    { nama_kategori: { [Op.like]: `%${search}%` } },
                    { kode: { [Op.like]: `%${search}%` } }
                ];
            }

            const offset = (parseInt(page) - 1) * parseInt(perPage);
            
            const { count, rows } = await Kategori.findAndCountAll({
                where,
                include: [{
                    model: Kategori,
                    as: 'parent',
                    attributes: ['id', 'nama_kategori']
                }],
                order: [['nama_kategori', 'ASC']],
                limit: parseInt(perPage),
                offset: offset,
                distinct: true
            });

            return ResponseHelper.success(res, 'Data kategori berhasil diambil', {
                data: rows,
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
     * Get kategori tree structure
     */
    static async tree(req, res) {
        try {
            const kategori = await Kategori.findAll({
                where: { parent_id: null },
                include: [{
                    model: Kategori,
                    as: 'children',
                    include: [{
                        model: Kategori,
                        as: 'children'
                    }]
                }],
                order: [['nama_kategori', 'ASC']]
            });

            return ResponseHelper.success(res, 'Data kategori tree berhasil diambil', kategori);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Get kategori by ID
     */
    static async show(req, res) {
        try {
            const { id } = req.params;
            const kategori = await Kategori.findByPk(id, {
                include: [
                    {
                        model: Kategori,
                        as: 'parent',
                        attributes: ['id', 'nama_kategori']
                    },
                    {
                        model: Kategori,
                        as: 'children',
                        attributes: ['id', 'nama_kategori']
                    }
                ]
            });

            if (!kategori) {
                return ResponseHelper.error(res, 'Kategori tidak ditemukan', 404);
            }

            return ResponseHelper.success(res, 'Data kategori berhasil diambil', kategori);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Create new kategori
     */
    static async store(req, res) {
        try {
            // Generate kode if not provided
            if (!req.body.kode) {
                req.body.kode = await KategoriController.generateKode(req.body.nama_kategori);
            }

            const kategori = await Kategori.create(req.body);

            // Log activity
            await LogAktivitas.log({
                user_id: req.user.id,
                aksi: 'create',
                modul: 'kategori',
                deskripsi: `Membuat kategori baru: ${kategori.nama_kategori}`,
                data_baru: kategori.toJSON()
            });

            return ResponseHelper.success(res, 'Kategori berhasil dibuat', kategori, 201);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Update kategori
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const kategori = await Kategori.findByPk(id);

            if (!kategori) {
                return ResponseHelper.error(res, 'Kategori tidak ditemukan', 404);
            }

            // Prevent circular parent reference
            if (req.body.parent_id && parseInt(req.body.parent_id) === parseInt(id)) {
                return ResponseHelper.error(res, 'Kategori tidak bisa menjadi parent dari dirinya sendiri', 400);
            }

            const dataLama = kategori.toJSON();
            await kategori.update(req.body);

            // Log activity
            await LogAktivitas.log({
                user_id: req.user.id,
                aksi: 'update',
                modul: 'kategori',
                deskripsi: `Mengupdate kategori: ${kategori.nama_kategori}`,
                data_lama: dataLama,
                data_baru: kategori.toJSON()
            });

            return ResponseHelper.success(res, 'Kategori berhasil diupdate', kategori);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Delete kategori
     */
    static async destroy(req, res) {
        try {
            const { id } = req.params;
            const kategori = await Kategori.findByPk(id);

            if (!kategori) {
                return ResponseHelper.error(res, 'Kategori tidak ditemukan', 404);
            }

            // Check if has children
            const childCount = await Kategori.count({ where: { parent_id: id } });
            if (childCount > 0) {
                return ResponseHelper.error(res, 'Kategori memiliki sub-kategori. Hapus sub-kategori terlebih dahulu', 400);
            }

            await kategori.destroy();

            // Log activity
            await LogAktivitas.log({
                user_id: req.user.id,
                aksi: 'delete',
                modul: 'kategori',
                deskripsi: `Menghapus kategori: ${kategori.nama_kategori}`,
                data_lama: kategori.toJSON()
            });

            return ResponseHelper.success(res, 'Kategori berhasil dihapus');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Generate kode kategori
     */
    static async generateKode(nama) {
        const prefix = nama.substring(0, 3).toUpperCase();
        const count = await Kategori.count({
            where: {
                kode: { [Op.like]: `${prefix}%` }
            }
        });
        return `${prefix}${String(count + 1).padStart(3, '0')}`;
    }
}

module.exports = KategoriController;
