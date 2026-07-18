const Instansi = require('../../Models/Instansi');
const ResponseHelper = require('../../Helpers/ResponseHelper');
const LogAktivitas = require('../../Models/LogAktivitas');
const { Op } = require('sequelize');

class InstansiController {
    /**
     * Get all instansi with pagination
     */
    static async index(req, res) {
        try {
            const { page = 1, perPage = 20, search } = req.query;
            const where = {};

            if (search) {
                where[Op.or] = [
                    { nama_instansi: { [Op.like]: `%${search}%` } },
                    { alamat: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } }
                ];
            }

            const offset = (parseInt(page) - 1) * parseInt(perPage);
            
            const { count, rows } = await Instansi.findAndCountAll({
                where,
                order: [['nama_instansi', 'ASC']],
                limit: parseInt(perPage),
                offset: offset,
                distinct: true
            });

            return ResponseHelper.success(res, 'Data instansi berhasil diambil', {
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
     * Get instansi by ID
     */
    static async show(req, res) {
        try {
            const { id } = req.params;
            const instansi = await Instansi.findByPk(id);

            if (!instansi) {
                return ResponseHelper.error(res, 'Instansi tidak ditemukan', 404);
            }

            return ResponseHelper.success(res, 'Data instansi berhasil diambil', instansi);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Create new instansi
     */
    static async store(req, res) {
        try {
            const instansi = await Instansi.create(req.body);

            // Log activity
            await LogAktivitas.log({
                user_id: req.user.id,
                aksi: 'create',
                modul: 'instansi',
                deskripsi: `Membuat instansi baru: ${instansi.nama_instansi}`,
                data_baru: instansi.toJSON()
            });

            return ResponseHelper.success(res, 'Instansi berhasil dibuat', instansi, 201);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Update instansi
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const instansi = await Instansi.findByPk(id);

            if (!instansi) {
                return ResponseHelper.error(res, 'Instansi tidak ditemukan', 404);
            }

            const dataLama = instansi.toJSON();
            await instansi.update(req.body);

            // Log activity
            await LogAktivitas.log({
                user_id: req.user.id,
                aksi: 'update',
                modul: 'instansi',
                deskripsi: `Mengupdate instansi: ${instansi.nama_instansi}`,
                data_lama: dataLama,
                data_baru: instansi.toJSON()
            });

            return ResponseHelper.success(res, 'Instansi berhasil diupdate', instansi);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Delete instansi
     */
    static async destroy(req, res) {
        try {
            const { id } = req.params;
            const instansi = await Instansi.findByPk(id);

            if (!instansi) {
                return ResponseHelper.error(res, 'Instansi tidak ditemukan', 404);
            }

            await instansi.destroy();

            // Log activity
            await LogAktivitas.log({
                user_id: req.user.id,
                aksi: 'delete',
                modul: 'instansi',
                deskripsi: `Menghapus instansi: ${instansi.nama_instansi}`,
                data_lama: instansi.toJSON()
            });

            return ResponseHelper.success(res, 'Instansi berhasil dihapus');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }
}

module.exports = InstansiController;
