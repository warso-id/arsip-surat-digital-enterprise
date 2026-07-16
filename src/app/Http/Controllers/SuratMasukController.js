// ==================== SURAT MASUK CONTROLLER ====================
// Arsip Surat Digital Enterprise

const fs = require('fs').promises;
const path = require('path');
const { validationResult } = require('express-validator');
const config = require('../../../config/app');

class SuratMasukController {
    constructor() {
        this.suratMasukModel = require('../../Models/SuratMasuk');
        this.lampiranModel = require('../../Models/Lampiran');
        this.logModel = require('../../Models/LogAktivitas');
        this.notifikasiModel = require('../../Models/Notifikasi');
        this.fileService = require('../../Services/FileService');
        this.qrService = require('../../Services/QrCodeService');
    }

    /**
     * Get all surat masuk with pagination
     */
    async index(req, res) {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || config.api.pagination.perPage,
                status: req.query.status || null,
                kategori: req.query.kategori || null,
                search: req.query.search || null,
                startDate: req.query.start_date || null,
                endDate: req.query.end_date || null,
                instansi_id: req.user.instansi_id,
                orderBy: req.query.order_by || 'tanggal_terima',
                orderDir: req.query.order_dir || 'DESC',
            };

            const result = await this.suratMasukModel.findAll(options);

            // Log activity
            await this.logActivity(req, 'VIEW_SURAT_MASUK_LIST', 'View surat masuk list');

            return res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });

        } catch (error) {
            console.error('Error fetching surat masuk:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil data surat masuk',
            });
        }
    }

    /**
     * Show single surat masuk
     */
    async show(req, res) {
        try {
            const { id } = req.params;

            const surat = await this.suratMasukModel.findById(id);
            if (!surat) {
                return res.status(404).json({
                    success: false,
                    message: 'Surat masuk tidak ditemukan',
                });
            }

            // Check instansi access
            if (req.user.role !== 'superadmin' && surat.instansi_id !== req.user.instansi_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Anda tidak memiliki akses ke surat ini',
                });
            }

            // Get lampiran
            const lampiran = await this.lampiranModel.findBySuratMasuk(id);

            // Get riwayat disposisi
            const disposisiModel = require('../../Models/Disposisi');
            const disposisi = await disposisiModel.findBySuratMasuk(id);

            // Get QR code
            const qrCode = await this.qrService.generateSuratQR(surat.nomor_agenda, surat.id);

            // Log activity
            await this.logActivity(req, 'VIEW_SURAT_MASUK', `View surat masuk: ${surat.nomor_agenda}`);

            return res.json({
                success: true,
                data: {
                    surat: surat,
                    lampiran: lampiran || [],
                    disposisi: disposisi || [],
                    qrCode: qrCode,
                },
            });

        } catch (error) {
            console.error('Error fetching surat masuk detail:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil detail surat masuk',
            });
        }
    }

    /**
     * Create new surat masuk
     */
    async store(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    success: false,
                    message: 'Validasi gagal',
                    errors: errors.array(),
                });
            }

            const {
                nomor_surat,
                tanggal_surat,
                tanggal_terima,
                pengirim,
                perihal,
                ringkasan,
                kategori,
                sifat_surat,
                prioritas,
                catatan,
            } = req.body;

            // Generate nomor agenda
            const nomor_agenda = await this.suratMasukModel.generateNomorAgenda(req.user.instansi_id);

            // Create surat masuk
            const suratData = {
                nomor_agenda: nomor_agenda,
                nomor_surat: nomor_surat,
                tanggal_surat: tanggal_surat,
                tanggal_terima: tanggal_terima || new Date().toISOString().split('T')[0],
                pengirim: pengirim,
                perihal: perihal,
                ringkasan: ringkasan || null,
                kategori: kategori || 'biasa',
                sifat_surat: sifat_surat || 'biasa',
                prioritas: prioritas || 'sedang',
                status: 'baru',
                catatan: catatan || null,
                instansi_id: req.user.instansi_id,
                created_by: req.user.id,
            };

            const result = await this.suratMasukModel.create(suratData);

            // Handle file uploads
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const fileData = await this.fileService.saveFile(file, 'surat/masuk');
                    
                    await this.lampiranModel.create({
                        surat_masuk_id: result.id,
                        nama_file: file.originalname,
                        path: fileData.path,
                        ukuran: file.size,
                        tipe: file.mimetype,
                        uploaded_by: req.user.id,
                    });
                }
            }

            // Generate QR Code for the surat
            await this.qrService.generateAndSave(result.id, nomor_agenda);

            // Send notification to admin/pimpinan
            await this.notifikasiModel.create({
                user_id: null, // Will be sent to all admins
                type: 'SURAT_MASUK_BARU',
                title: 'Surat Masuk Baru',
                message: `Surat masuk baru: ${nomor_agenda} - ${perihal}`,
                data: JSON.stringify({ surat_id: result.id, nomor_agenda: nomor_agenda }),
                instansi_id: req.user.instansi_id,
            });

            // Log activity
            await this.logActivity(req, 'CREATE_SURAT_MASUK', `Create surat masuk: ${nomor_agenda}`);

            return res.status(201).json({
                success: true,
                message: 'Surat masuk berhasil dibuat',
                data: {
                    id: result.id,
                    nomor_agenda: nomor_agenda,
                },
            });

        } catch (error) {
            console.error('Error creating surat masuk:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal membuat surat masuk',
            });
        }
    }

    /**
     * Update surat masuk
     */
    async update(req, res) {
        try {
            const { id } = req.params;

            // Check if surat exists
            const surat = await this.suratMasukModel.findById(id);
            if (!surat) {
                return res.status(404).json({
                    success: false,
                    message: 'Surat masuk tidak ditemukan',
                });
            }

            // Check instansi access
            if (req.user.role !== 'superadmin' && surat.instansi_id !== req.user.instansi_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Anda tidak memiliki akses',
                });
            }

            // Update surat
            await this.suratMasukModel.update(id, req.body);

            // Log activity
            await this.logActivity(req, 'UPDATE_SURAT_MASUK', `Update surat masuk: ${surat.nomor_agenda}`);

            return res.json({
                success: true,
                message: 'Surat masuk berhasil diperbarui',
            });

        } catch (error) {
            console.error('Error updating surat masuk:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal memperbarui surat masuk',
            });
        }
    }

    /**
     * Delete surat masuk
     */
    async destroy(req, res) {
        try {
            const { id } = req.params;

            const surat = await this.suratMasukModel.findById(id);
            if (!surat) {
                return res.status(404).json({
                    success: false,
                    message: 'Surat masuk tidak ditemukan',
                });
            }

            // Check instansi access
            if (req.user.role !== 'superadmin' && surat.instansi_id !== req.user.instansi_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Anda tidak memiliki akses',
                });
            }

            // Delete associated files
            const lampiran = await this.lampiranModel.findBySuratMasuk(id);
            for (const file of lampiran) {
                await this.fileService.deleteFile(file.path);
            }

            // Delete surat
            await this.suratMasukModel.delete(id);

            // Log activity
            await this.logActivity(req, 'DELETE_SURAT_MASUK', `Delete surat masuk: ${surat.nomor_agenda}`);

            return res.json({
                success: true,
                message: 'Surat masuk berhasil dihapus',
            });

        } catch (error) {
            console.error('Error deleting surat masuk:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal menghapus surat masuk',
            });
        }
    }

    /**
     * Get lampiran surat
     */
    async getLampiran(req, res) {
        try {
            const { id } = req.params;
            const lampiran = await this.lampiranModel.findBySuratMasuk(id);

            return res.json({
                success: true,
                data: lampiran,
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil lampiran',
            });
        }
    }

    /**
     * Upload lampiran
     */
    async uploadLampiran(req, res) {
        try {
            const { id } = req.params;

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'File tidak ditemukan',
                });
            }

            const uploadedFiles = [];
            for (const file of req.files) {
                const fileData = await this.fileService.saveFile(file, 'surat/masuk');
                
                const lampiran = await this.lampiranModel.create({
                    surat_masuk_id: parseInt(id),
                    nama_file: file.originalname,
                    path: fileData.path,
                    ukuran: file.size,
                    tipe: file.mimetype,
                    uploaded_by: req.user.id,
                });

                uploadedFiles.push(lampiran);
            }

            return res.json({
                success: true,
                message: 'Lampiran berhasil diupload',
                data: uploadedFiles,
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal upload lampiran',
            });
        }
    }

    /**
     * Delete lampiran
     */
    async deleteLampiran(req, res) {
        try {
            const { id, lampiranId } = req.params;

            const lampiran = await this.lampiranModel.findById(lampiranId);
            if (!lampiran) {
                return res.status(404).json({
                    success: false,
                    message: 'Lampiran tidak ditemukan',
                });
            }

            await this.fileService.deleteFile(lampiran.path);
            await this.lampiranModel.delete(lampiranId);

            return res.json({
                success: true,
                message: 'Lampiran berhasil dihapus',
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal menghapus lampiran',
            });
        }
    }

    /**
     * Bulk update status
     */
    async bulkUpdateStatus(req, res) {
        try {
            const { ids, status } = req.body;

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'IDs surat diperlukan',
                });
            }

            const validStatuses = ['baru', 'proses', 'selesai', 'arsip'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Status tidak valid',
                });
            }

            await this.suratMasukModel.bulkUpdateStatus(ids, status);

            return res.json({
                success: true,
                message: `${ids.length} surat berhasil diupdate`,
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal update status',
            });
        }
    }

    /**
     * Log activity helper
     */
    async logActivity(req, action, description) {
        try {
            await this.logModel.create({
                user_id: req.user?.id || null,
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

module.exports = new SuratMasukController();
