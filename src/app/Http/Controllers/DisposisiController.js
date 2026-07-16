// ==================== DISPOSISI CONTROLLER ====================
// Arsip Surat Digital Enterprise

class DisposisiController {
    constructor() {
        this.disposisiModel = require('../../Models/Disposisi');
        this.suratMasukModel = require('../../Models/SuratMasuk');
        this.penggunaModel = require('../../Models/Pengguna');
        this.notifikasiModel = require('../../Models/Notifikasi');
        this.logModel = require('../../Models/LogAktivitas');
    }

    /**
     * Get all disposisi
     */
    async index(req, res) {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 15,
                status: req.query.status || null,
                instansi_id: req.user.instansi_id,
                user_id: req.query.user_id || null,
            };

            const result = await this.disposisiModel.findAll(options);

            return res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });

        } catch (error) {
            console.error('Error fetching disposisi:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil data disposisi',
            });
        }
    }

    /**
     * Show single disposisi
     */
    async show(req, res) {
        try {
            const { id } = req.params;
            const disposisi = await this.disposisiModel.findById(id);

            if (!disposisi) {
                return res.status(404).json({
                    success: false,
                    message: 'Disposisi tidak ditemukan',
                });
            }

            return res.json({
                success: true,
                data: disposisi,
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil detail disposisi',
            });
        }
    }

    /**
     * Create new disposisi
     */
    async store(req, res) {
        try {
            const {
                surat_masuk_id,
                kepada_user_id,
                kepada_role_id,
                isi_disposisi,
                sifat_disposisi,
                batas_waktu,
            } = req.body;

            // Validate surat exists
            const surat = await this.suratMasukModel.findById(surat_masuk_id);
            if (!surat) {
                return res.status(404).json({
                    success: false,
                    message: 'Surat masuk tidak ditemukan',
                });
            }

            // Create disposisi
            const disposisiData = {
                surat_masuk_id: surat_masuk_id,
                dari_user_id: req.user.id,
                kepada_user_id: kepada_user_id || null,
                kepada_role_id: kepada_role_id || null,
                isi_disposisi: isi_disposisi,
                sifat_disposisi: sifat_disposisi || 'biasa',
                batas_waktu: batas_waktu || null,
                status: 'pending',
                instansi_id: req.user.instansi_id,
                created_by: req.user.id,
            };

            const result = await this.disposisiModel.create(disposisiData);

            // Update surat status to 'proses'
            await this.suratMasukModel.update(surat_masuk_id, { status: 'proses' });

            // Send notification to recipient
            if (kepada_user_id) {
                const recipient = await this.penggunaModel.findById(kepada_user_id);
                if (recipient) {
                    await this.notifikasiModel.create({
                        user_id: kepada_user_id,
                        type: 'DISPOSISI_BARU',
                        title: 'Disposisi Baru',
                        message: `Anda menerima disposisi untuk surat: ${surat.nomor_agenda} - ${surat.perihal}`,
                        data: JSON.stringify({
                            disposisi_id: result.id,
                            surat_id: surat_masuk_id,
                        }),
                        instansi_id: req.user.instansi_id,
                    });
                }
            }

            // Log activity
            await this.logActivity(req, 'CREATE_DISPOSISI', 
                `Create disposisi for surat: ${surat.nomor_agenda}`);

            return res.status(201).json({
                success: true,
                message: 'Disposisi berhasil dibuat',
                data: { id: result.id },
            });

        } catch (error) {
            console.error('Error creating disposisi:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal membuat disposisi',
            });
        }
    }

    /**
     * Update disposisi (tindak lanjut)
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const { status, catatan_tindak_lanjut } = req.body;

            const disposisi = await this.disposisiModel.findById(id);
            if (!disposisi) {
                return res.status(404).json({
                    success: false,
                    message: 'Disposisi tidak ditemukan',
                });
            }

            // Update status
            await this.disposisiModel.updateStatus(id, status, catatan_tindak_lanjut);

            // If completed, check if all disposisi for this surat are done
            if (status === 'selesai') {
                const allDisposisi = await this.disposisiModel.findBySuratMasuk(disposisi.surat_masuk_id);
                const allDone = allDisposisi.every(d => d.status === 'selesai' || d.id === id);
                
                if (allDone) {
                    await this.suratMasukModel.update(disposisi.surat_masuk_id, { status: 'selesai' });
                }
            }

            // Notify sender
            await this.notifikasiModel.create({
                user_id: disposisi.dari_user_id,
                type: 'DISPOSISI_UPDATE',
                title: 'Status Disposisi Diperbarui',
                message: `Disposisi Anda telah ${status}`,
                data: JSON.stringify({ disposisi_id: id }),
                instansi_id: req.user.instansi_id,
            });

            await this.logActivity(req, 'UPDATE_DISPOSISI', 
                `Update disposisi #${id} status to ${status}`);

            return res.json({
                success: true,
                message: 'Status disposisi berhasil diperbarui',
            });

        } catch (error) {
            console.error('Error updating disposisi:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal memperbarui disposisi',
            });
        }
    }

    /**
     * Get tracking for surat
     */
    async tracking(req, res) {
        try {
            const { suratId } = req.params;
            const tracking = await this.disposisiModel.getTracking(suratId);

            return res.json({
                success: true,
                data: tracking,
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil tracking disposisi',
            });
        }
    }

    /**
     * Log activity helper
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

module.exports = new DisposisiController();
