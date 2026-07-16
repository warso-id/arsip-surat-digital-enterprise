// ==================== PENGGUNA CONTROLLER ====================
// Arsip Surat Digital Enterprise

const bcrypt = require('bcryptjs');

class PenggunaController {
    constructor() {
        this.penggunaModel = require('../../Models/Pengguna');
        this.logModel = require('../../Models/LogAktivitas');
    }

    /**
     * Get all users
     */
    async index(req, res) {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
                search: req.query.search || null,
                role_id: req.query.role_id || null,
                instansi_id: req.query.instansi_id || null,
                is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : null,
            };

            const result = await this.penggunaModel.findAll(options);

            return res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });

        } catch (error) {
            console.error('Get users error:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil data pengguna',
            });
        }
    }

    /**
     * Show user
     */
    async show(req, res) {
        try {
            const { id } = req.params;
            const user = await this.penggunaModel.findById(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Pengguna tidak ditemukan',
                });
            }

            // Remove sensitive data
            delete user.password;
            delete user.reset_token;

            return res.json({
                success: true,
                data: user,
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil detail pengguna',
            });
        }
    }

    /**
     * Create user
     */
    async store(req, res) {
        try {
            const { username, email, password, fullname, jabatan, nip, phone, role_id, instansi_id } = req.body;

            // Check existing
            const existingUser = await this.penggunaModel.findByUsername(username);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username sudah digunakan',
                });
            }

            const existingEmail = await this.penggunaModel.findByEmail(email);
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email sudah terdaftar',
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(password, salt);

            const userId = await this.penggunaModel.create({
                username, email, password: hashedPassword,
                fullname, jabatan, nip, phone,
                role_id, instansi_id,
            });

            await this.logActivity(req, 'CREATE_USER', `Create user: ${username}`);

            return res.status(201).json({
                success: true,
                message: 'Pengguna berhasil dibuat',
                data: { id: userId },
            });

        } catch (error) {
            console.error('Create user error:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal membuat pengguna',
            });
        }
    }

    /**
     * Update user
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const user = await this.penggunaModel.findById(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Pengguna tidak ditemukan',
                });
            }

            const updateData = { ...req.body };
            delete updateData.password; // Password updated separately

            await this.penggunaModel.update(id, updateData);
            await this.logActivity(req, 'UPDATE_USER', `Update user: ${user.username}`);

            return res.json({
                success: true,
                message: 'Pengguna berhasil diperbarui',
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal memperbarui pengguna',
            });
        }
    }

    /**
     * Change password
     */
    async changePassword(req, res) {
        try {
            const { id } = req.params;
            const { password } = req.body;

            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(password, salt);

            await this.penggunaModel.updatePassword(id, hashedPassword);
            await this.logActivity(req, 'CHANGE_PASSWORD', `Change password for user ID: ${id}`);

            return res.json({
                success: true,
                message: 'Password berhasil diubah',
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengubah password',
            });
        }
    }

    /**
     * Toggle user status
     */
    async toggleStatus(req, res) {
        try {
            const { id } = req.params;
            const user = await this.penggunaModel.findById(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Pengguna tidak ditemukan',
                });
            }

            const newStatus = !user.is_active;
            await this.penggunaModel.update(id, { is_active: newStatus });
            await this.logActivity(req, 'TOGGLE_USER', 
                `${newStatus ? 'Activate' : 'Deactivate'} user: ${user.username}`);

            return res.json({
                success: true,
                message: `Pengguna berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengubah status pengguna',
            });
        }
    }

    /**
     * Delete user
     */
    async destroy(req, res) {
        try {
            const { id } = req.params;
            const user = await this.penggunaModel.findById(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Pengguna tidak ditemukan',
                });
            }

            await this.penggunaModel.delete(id);
            await this.logActivity(req, 'DELETE_USER', `Delete user: ${user.username}`);

            return res.json({
                success: true,
                message: 'Pengguna berhasil dihapus',
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal menghapus pengguna',
            });
        }
    }

    /**
     * Get profile
     */
    async profile(req, res) {
        try {
            const user = await this.penggunaModel.findById(req.user.id);
            delete user.password;
            delete user.reset_token;

            return res.json({
                success: true,
                data: user,
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil profil',
            });
        }
    }

    /**
     * Log activity
     */
    async logActivity(req, action, description) {
        try {
            await this.logModel.create({
                user_id: req.user.id,
                action, description,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'] || 'unknown',
                created_at: new Date(),
            });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
}

module.exports = new PenggunaController();
