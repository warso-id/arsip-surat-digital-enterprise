const Pengguna = require('../../Models/Pengguna');
const Role = require('../../Models/Role');
const ResponseHelper = require('../../Helpers/ResponseHelper');
const { Op } = require('sequelize');

class PenggunaController {
    /**
     * Get all users with pagination
     */
    static async index(req, res) {
        try {
            const { page = 1, perPage = 20, search, status, role_id } = req.query;
            const where = {};

            if (search) {
                where[Op.or] = [
                    { nama_lengkap: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } },
                    { nip: { [Op.like]: `%${search}%` } }
                ];
            }

            if (status) {
                where.status = status;
            }

            if (role_id) {
                where.role_id = role_id;
            }

            const offset = (parseInt(page) - 1) * parseInt(perPage);
            
            const { count, rows } = await Pengguna.findAndCountAll({
                where,
                include: [{
                    model: Role,
                    as: 'role',
                    attributes: ['id', 'nama_role']
                }],
                attributes: { exclude: ['password', 'reset_token', 'reset_token_expires'] },
                order: [['created_at', 'DESC']],
                limit: parseInt(perPage),
                offset: offset,
                distinct: true
            });

            return ResponseHelper.success(res, 'Data pengguna berhasil diambil', {
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
     * Get user by ID
     */
    static async show(req, res) {
        try {
            const { id } = req.params;
            
            const user = await Pengguna.findByPk(id, {
                include: [{
                    model: Role,
                    as: 'role',
                    attributes: ['id', 'nama_role']
                }],
                attributes: { exclude: ['password', 'reset_token', 'reset_token_expires'] }
            });

            if (!user) {
                return ResponseHelper.error(res, 'Pengguna tidak ditemukan', 404);
            }

            return ResponseHelper.success(res, 'Data pengguna berhasil diambil', user);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Create new user
     */
    static async store(req, res) {
        try {
            const { email, nip } = req.body;

            // Check unique email
            const existingEmail = await Pengguna.findOne({ where: { email } });
            if (existingEmail) {
                return ResponseHelper.error(res, 'Email sudah digunakan', 400);
            }

            // Check unique NIP
            if (nip) {
                const existingNIP = await Pengguna.findOne({ where: { nip } });
                if (existingNIP) {
                    return ResponseHelper.error(res, 'NIP sudah digunakan', 400);
                }
            }

            const user = await Pengguna.create(req.body);
            
            // Log activity
            await LogAktivitas.log({
                user_id: req.user.id,
                aksi: 'create',
                modul: 'pengguna',
                deskripsi: `Membuat pengguna baru: ${user.nama_lengkap}`,
                data_baru: user.toJSON()
            });

            const userData = await Pengguna.findByPk(user.id, {
                include: [{ model: Role, as: 'role' }],
                attributes: { exclude: ['password', 'reset_token', 'reset_token_expires'] }
            });

            return ResponseHelper.success(res, 'Pengguna berhasil dibuat', userData, 201);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Update user
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const user = await Pengguna.findByPk(id);

            if (!user) {
                return ResponseHelper.error(res, 'Pengguna tidak ditemukan', 404);
            }

            // Check unique email if changed
            if (req.body.email && req.body.email !== user.email) {
                const existingEmail = await Pengguna.findOne({ 
                    where: { email: req.body.email }
                });
                if (existingEmail) {
                    return ResponseHelper.error(res, 'Email sudah digunakan', 400);
                }
            }

            // Check unique NIP if changed
            if (req.body.nip && req.body.nip !== user.nip) {
                const existingNIP = await Pengguna.findOne({ 
                    where: { nip: req.body.nip }
                });
                if (existingNIP) {
                    return ResponseHelper.error(res, 'NIP sudah digunakan', 400);
                }
            }

            const dataLama = user.toJSON();
            await user.update(req.body);

            // Log activity
            await LogAktivitas.log({
                user_id: req.user.id,
                aksi: 'update',
                modul: 'pengguna',
                deskripsi: `Mengupdate pengguna: ${user.nama_lengkap}`,
                data_lama: dataLama,
                data_baru: user.toJSON()
            });

            const userData = await Pengguna.findByPk(user.id, {
                include: [{ model: Role, as: 'role' }],
                attributes: { exclude: ['password', 'reset_token', 'reset_token_expires'] }
            });

            return ResponseHelper.success(res, 'Pengguna berhasil diupdate', userData);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Delete user
     */
    static async destroy(req, res) {
        try {
            const { id } = req.params;
            const user = await Pengguna.findByPk(id);

            if (!user) {
                return ResponseHelper.error(res, 'Pengguna tidak ditemukan', 404);
            }

            // Prevent deleting self
            if (user.id === req.user.id) {
                return ResponseHelper.error(res, 'Tidak dapat menghapus akun sendiri', 400);
            }

            await user.destroy();

            // Log activity
            await LogAktivitas.log({
                user_id: req.user.id,
                aksi: 'delete',
                modul: 'pengguna',
                deskripsi: `Menghapus pengguna: ${user.nama_lengkap}`,
                data_lama: user.toJSON()
            });

            return ResponseHelper.success(res, 'Pengguna berhasil dihapus');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Toggle user status (activate/deactivate)
     */
    static async toggleStatus(req, res) {
        try {
            const { id } = req.params;
            const user = await Pengguna.findByPk(id);

            if (!user) {
                return ResponseHelper.error(res, 'Pengguna tidak ditemukan', 404);
            }

            // Prevent deactivating self
            if (user.id === req.user.id) {
                return ResponseHelper.error(res, 'Tidak dapat mengubah status akun sendiri', 400);
            }

            const newStatus = user.status === 'aktif' ? 'nonaktif' : 'aktif';
            await user.update({ status: newStatus });

            // Log activity
            await LogAktivitas.log({
                user_id: req.user.id,
                aksi: 'update_status',
                modul: 'pengguna',
                deskripsi: `Mengubah status pengguna ${user.nama_lengkap} menjadi ${newStatus}`
            });

            return ResponseHelper.success(res, `Status pengguna berhasil diubah menjadi ${newStatus}`);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Get all roles
     */
    static async getRoles(req, res) {
        try {
            const roles = await Role.findAll({
                order: [['id', 'ASC']]
            });

            return ResponseHelper.success(res, 'Data role berhasil diambil', roles);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }
}

module.exports = PenggunaController;
