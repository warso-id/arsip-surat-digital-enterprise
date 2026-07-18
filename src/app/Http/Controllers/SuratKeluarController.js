const SuratService = require('../../Services/SuratService');
const ResponseHelper = require('../../Helpers/ResponseHelper');

class SuratKeluarController {
    /**
     * Get all surat keluar
     */
    static async index(req, res) {
        try {
            const { page = 1, perPage = 20, ...filters } = req.query;
            const result = await SuratService.getSuratKeluar(filters, parseInt(page), parseInt(perPage));

            return ResponseHelper.success(res, 'Data surat keluar berhasil diambil', result);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Get surat keluar by ID
     */
    static async show(req, res) {
        try {
            const { id } = req.params;
            const surat = await SuratService.getSuratKeluarById(id);

            return ResponseHelper.success(res, 'Data surat keluar berhasil diambil', surat);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 404);
        }
    }

    /**
     * Create surat keluar
     */
    static async store(req, res) {
        try {
            const surat = await SuratService.createSuratKeluar(req.body, req.user.id);

            return ResponseHelper.success(res, 'Surat keluar berhasil dibuat', surat, 201);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Update surat keluar
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const surat = await SuratService.updateSuratKeluar(id, req.body, req.user.id);

            return ResponseHelper.success(res, 'Surat keluar berhasil diupdate', surat);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Delete surat keluar
     */
    static async destroy(req, res) {
        try {
            const { id } = req.params;
            await SuratService.deleteSuratKeluar(id, req.user.id);

            return ResponseHelper.success(res, 'Surat keluar berhasil dihapus');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Export surat keluar to PDF
     */
    static async exportPDF(req, res) {
        try {
            const { id } = req.params;
            const pdf = await SuratService.exportSuratToPDF(id, 'keluar');

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=surat-keluar-${id}.pdf`);
            res.send(pdf);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }
}

module.exports = SuratKeluarController;
