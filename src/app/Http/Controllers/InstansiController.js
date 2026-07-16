// ==================== INSTANSI CONTROLLER ====================
// Arsip Surat Digital Enterprise

class InstansiController {
    constructor() {
        this.instansiModel = require('../../Models/Instansi');
        this.logModel = require('../../Models/LogAktivitas');
    }

    /**
     * Get all instansi
     */
    async index(req, res) {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
                search: req.query.search || null,
                isActive: req.query.is_active !== undefined ? req.query.is_active === 'true' : null,
            };

            const result = await this.instansiModel.findAll(options);

            return res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });

        } catch (error) {
            console.error('Get instansi error:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil data instansi',
            });
        }
    }

    /**
     * Show single instansi
     */
    async show(req, res) {
        try {
            const { id } = req.params;
            const instansi = await this.instansiModel.findById(id);

            if (!instansi) {
                return res.status(404).json({
                    success: false,
                    message: 'Instansi tidak ditemukan',
                });
            }

            // Get statistics
            const stats = await this.instansiModel.getStatistics(id);

            return res.json({
                success: true,
                data: {
                    ...instansi,
                    statistics: stats,
                },
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil detail instansi',
            });
        }
    }

    /**
     * Create new instansi
     */
    async store(req, res) {
        try {
            const { kode, nama, alamat, phone, email, website } = req.body;

            // Check duplicate
            const existing = await this.instansiModel.findByKode(kode);
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Kode instansi sudah digunakan',
                });
            }

            const result = await this.instansiModel.create({
                kode, nama, alamat, phone, email, website,
            });

            await this.logActivity(req, 'CREATE_INSTANSI', `Create instansi: ${nama}`);

            return res.status(201).json({
                success: true,
                message: 'Instansi berhasil dibuat',
                data: { id: result.id },
            });

        } catch (error) {
            console.error('Create instansi error:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal membuat instansi',
            });
        }
    }

    /**
     * Update instansi
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const instansi = await this.instansiModel.findById(id);

            if (!instansi) {
                return res.status(404).json({
                    success: false,
                    message: 'Instansi tidak ditemukan',
                });
            }

            await this.instansiModel.update(id, req.body);
            await this.logActivity(req, 'UPDATE_INSTANSI', `Update instansi: ${instansi.nama}`);

            return res.json({
                success: true,
                message: 'Instansi berhasil diperbarui',
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal memperbarui instansi',
            });
        }
    }

    /**
     * Toggle instansi status
     */
    async toggleStatus(req, res) {
        try {
            const { id } = req.params;
            const instansi = await this.instansiModel.findById(id);

            if (!instansi) {
                return res.status(404).json({
                    success: false,
                    message: 'Instansi tidak ditemukan',
                });
            }

            const newStatus = !instansi.is_active;
            await this.instansiModel.update(id, { is_active: newStatus });
            await this.logActivity(req, 'TOGGLE_INSTANSI', 
                `${newStatus ? 'Activate' : 'Deactivate'} instansi: ${instansi.nama}`);

            return res.json({
                success: true,
                message: `Instansi berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengubah status instansi',
            });
        }
    }

    /**
     * Delete instansi
     */
    async destroy(req, res) {
        try {
            const { id } = req.params;
            const instansi = await this.instansiModel.findById(id);

            if (!instansi) {
                return res.status(404).json({
                    success: false,
                    message: 'Instansi tidak ditemukan',
                });
            }

            await this.instansiModel.delete(id);
            await this.logActivity(req, 'DELETE_INSTANSI', `Delete instansi: ${instansi.nama}`);

            return res.json({
                success: true,
                message: 'Instansi berhasil dihapus',
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal menghapus instansi',
            });
        }
    }

    /**
     * Get instansi list (for dropdown)
     */
    async list(req, res) {
        try {
            const instansi = await this.instansiModel.findAll({ limit: 100, isActive: true });
            return res.json({
                success: true,
                data: instansi.data.map(item => ({
                    id: item.id,
                    nama: item.nama,
                    kode: item.kode,
                })),
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil list instansi',
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
                action: action,
                description: description,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'] || 'unknown',
                created_at: new Date(),
            });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
}

module.exports = new InstansiController();
