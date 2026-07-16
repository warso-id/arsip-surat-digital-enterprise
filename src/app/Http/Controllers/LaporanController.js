// ==================== LAPORAN CONTROLLER ====================
// Arsip Surat Digital Enterprise

const path = require('path');
const fs = require('fs');

class LaporanController {
    constructor() {
        this.suratMasukModel = require('../../Models/SuratMasuk');
        this.suratKeluarModel = require('../../Models/SuratKeluar');
        this.disposisiModel = require('../../Models/Disposisi');
        this.pdfService = require('../../Services/PdfService');
        this.logModel = require('../../Models/LogAktivitas');
    }

    /**
     * Generate laporan surat masuk
     */
    async suratMasuk(req, res) {
        try {
            const options = {
                startDate: req.query.start_date,
                endDate: req.query.end_date,
                status: req.query.status,
                kategori: req.query.kategori,
            };

            // Get data
            const result = await this.suratMasukModel.findAll({
                ...options,
                instansi_id: req.user.instansi_id,
                limit: 1000,
            });

            const statistics = await this.suratMasukModel.getStatistics(
                req.user.instansi_id,
                'month'
            );

            // Check if export requested
            if (req.query.export === 'pdf') {
                const pdfResult = await this.pdfService.generateSuratMasukReport(
                    { items: result.data, statistics },
                    options
                );

                await this.logActivity(req, 'EXPORT_LAPORAN', 'Export laporan surat masuk PDF');

                return res.json({
                    success: true,
                    data: { url: pdfResult.url, filename: pdfResult.filename },
                });
            }

            return res.json({
                success: true,
                data: result.data,
                statistics: statistics,
                pagination: result.pagination,
            });

        } catch (error) {
            console.error('Laporan surat masuk error:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal generate laporan surat masuk',
            });
        }
    }

    /**
     * Generate laporan surat keluar
     */
    async suratKeluar(req, res) {
        try {
            const options = {
                startDate: req.query.start_date,
                endDate: req.query.end_date,
                status: req.query.status,
            };

            const result = await this.suratKeluarModel.findAll({
                ...options,
                instansi_id: req.user.instansi_id,
                limit: 1000,
            });

            const statistics = await this.suratKeluarModel.getStatistics(
                req.user.instansi_id,
                'month'
            );

            if (req.query.export === 'pdf') {
                const pdfResult = await this.pdfService.generateSuratKeluarReport(
                    { items: result.data, statistics },
                    options
                );

                await this.logActivity(req, 'EXPORT_LAPORAN', 'Export laporan surat keluar PDF');

                return res.json({
                    success: true,
                    data: { url: pdfResult.url, filename: pdfResult.filename },
                });
            }

            return res.json({
                success: true,
                data: result.data,
                statistics: statistics,
                pagination: result.pagination,
            });

        } catch (error) {
            console.error('Laporan surat keluar error:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal generate laporan surat keluar',
            });
        }
    }

    /**
     * Generate laporan disposisi
     */
    async disposisi(req, res) {
        try {
            const options = {
                startDate: req.query.start_date,
                endDate: req.query.end_date,
                status: req.query.status,
            };

            const result = await this.disposisiModel.findAll({
                ...options,
                instansi_id: req.user.instansi_id,
                limit: 1000,
            });

            const statistics = await this.disposisiModel.getStatistics(req.user.instansi_id);

            if (req.query.export === 'pdf') {
                const pdfResult = await this.pdfService.generateDisposisiReport(
                    { items: result.data, statistics },
                    options
                );

                await this.logActivity(req, 'EXPORT_LAPORAN', 'Export laporan disposisi PDF');

                return res.json({
                    success: true,
                    data: { url: pdfResult.url, filename: pdfResult.filename },
                });
            }

            return res.json({
                success: true,
                data: result.data,
                statistics: statistics,
                pagination: result.pagination,
            });

        } catch (error) {
            console.error('Laporan disposisi error:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal generate laporan disposisi',
            });
        }
    }

    /**
     * Generate laporan rekapitulasi
     */
    async rekap(req, res) {
        try {
            const instansiId = req.user.instansi_id;

            const [
                suratMasukStats,
                suratKeluarStats,
                disposisiStats,
            ] = await Promise.all([
                this.suratMasukModel.getStatistics(instansiId, 'year'),
                this.suratKeluarModel.getStatistics(instansiId, 'year'),
                this.disposisiModel.getStatistics(instansiId),
            ]);

            const rekapData = {
                periode: {
                    mulai: req.query.start_date || 'Awal',
                    akhir: req.query.end_date || 'Sekarang',
                },
                suratMasuk: suratMasukStats,
                suratKeluar: suratKeluarStats,
                disposisi: disposisiStats,
                generatedAt: new Date().toISOString(),
            };

            return res.json({
                success: true,
                data: rekapData,
            });

        } catch (error) {
            console.error('Rekap error:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal generate rekap laporan',
            });
        }
    }

    /**
     * Export laporan ke file
     */
    async export(req, res) {
        try {
            const { type, format } = req.body;

            if (!type || !format) {
                return res.status(400).json({
                    success: false,
                    message: 'Type dan format diperlukan',
                });
            }

            let result;
            switch (type) {
                case 'surat-masuk':
                    result = await this.suratMasuk({ ...req, query: { ...req.body, export: format } }, res);
                    break;
                case 'surat-keluar':
                    result = await this.suratKeluar({ ...req, query: { ...req.body, export: format } }, res);
                    break;
                case 'disposisi':
                    result = await this.disposisi({ ...req, query: { ...req.body, export: format } }, res);
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Type laporan tidak valid',
                    });
            }

            return result;

        } catch (error) {
            console.error('Export error:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal export laporan',
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

module.exports = new LaporanController();
