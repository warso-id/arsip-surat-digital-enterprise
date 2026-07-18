const SuratService = require('../../Services/SuratService');
const DisposisiService = require('../../Services/DisposisiService');
const PdfService = require('../../Services/PdfService');
const ResponseHelper = require('../../Helpers/ResponseHelper');
const ExcelJS = require('exceljs');

class LaporanController {
    /**
     * Get laporan data
     */
    static async index(req, res) {
        try {
            const filters = {
                tipe: req.query.tipe || 'semua',
                tanggal_mulai: req.query.tanggal_mulai,
                tanggal_selesai: req.query.tanggal_selesai,
                kategori_id: req.query.kategori_id,
                status: req.query.status
            };

            const laporan = await SuratService.getLaporan(filters);

            return ResponseHelper.success(res, 'Data laporan berhasil diambil', laporan);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Get statistics
     */
    static async statistics(req, res) {
        try {
            const tahun = req.query.tahun || new Date().getFullYear();
            const stats = await SuratService.getStatistics(tahun);
            const disposisiStats = await DisposisiService.getStatistics();

            return ResponseHelper.success(res, 'Data statistik berhasil diambil', {
                surat: stats,
                disposisi: disposisiStats
            });
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Export laporan to PDF
     */
    static async exportPDF(req, res) {
        try {
            const filters = {
                tipe: req.query.tipe || 'semua',
                tanggal_mulai: req.query.tanggal_mulai,
                tanggal_selesai: req.query.tanggal_selesai,
                kategori_id: req.query.kategori_id,
                status: req.query.status
            };

            const laporan = await SuratService.getLaporan(filters);
            const pdf = await PdfService.generateLaporanPDF(laporan, filters);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=laporan-surat-${Date.now()}.pdf`);
            res.send(pdf);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Export laporan to Excel
     */
    static async exportExcel(req, res) {
        try {
            const filters = {
                tipe: req.query.tipe || 'semua',
                tanggal_mulai: req.query.tanggal_mulai,
                tanggal_selesai: req.query.tanggal_selesai,
                kategori_id: req.query.kategori_id,
                status: req.query.status
            };

            const laporan = await SuratService.getLaporan(filters);

            // Create workbook
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Arsip Surat Digital';
            workbook.created = new Date();

            // Add worksheet
            const worksheet = workbook.addWorksheet('Laporan Surat');

            // Define columns
            worksheet.columns = [
                { header: 'No', key: 'no', width: 5 },
                { header: 'Tipe Surat', key: 'tipe_surat', width: 12 },
                { header: 'Nomor Surat', key: 'nomor_surat', width: 25 },
                { header: 'Tanggal Surat', key: 'tanggal_surat', width: 15 },
                { header: 'Pengirim/Tujuan', key: 'pihak', width: 30 },
                { header: 'Perihal', key: 'perihal', width: 40 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Sifat', key: 'sifat', width: 12 }
            ];

            // Style header
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF007BFF' }
            };
            worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

            // Add data
            laporan.forEach((item, index) => {
                worksheet.addRow({
                    no: index + 1,
                    tipe_surat: item.tipe_surat === 'masuk' ? 'Surat Masuk' : 'Surat Keluar',
                    nomor_surat: item.nomor_surat,
                    tanggal_surat: item.tanggal_surat || item.tanggal_terima,
                    pihak: item.pengirim || item.tujuan,
                    perihal: item.perihal,
                    status: item.status.toUpperCase(),
                    sifat: item.sifat.toUpperCase()
                });
            });

            // Add borders
            worksheet.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            });

            // Set response headers
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=laporan-surat-${Date.now()}.xlsx`);

            // Write to response
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }
}

module.exports = LaporanController;
