const SuratService = require('../../Services/SuratService');
const ResponseHelper = require('../../Helpers/ResponseHelper');

class SuratMasukController {
    /**
     * Get all surat masuk
     */
    static async index(req, res) {
        try {
            const { page = 1, perPage = 20, ...filters } = req.query;
            const result = await SuratService.getSuratMasuk(filters, parseInt(page), parseInt(perPage));

            return ResponseHelper.success(res, 'Data surat masuk berhasil diambil', result);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Get surat masuk by ID
     */
    static async show(req, res) {
        try {
            const { id } = req.params;
            const surat = await SuratService.getSuratMasukById(id);

            return ResponseHelper.success(res, 'Data surat masuk berhasil diambil', surat);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 404);
        }
    }

    /**
     * Create surat masuk
     */
    static async store(req, res) {
        try {
            const surat = await SuratService.createSuratMasuk(req.body, req.user.id);

            return ResponseHelper.success(res, 'Surat masuk berhasil dibuat', surat, 201);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Update surat masuk
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const surat = await SuratService.updateSuratMasuk(id, req.body, req.user.id);

            return ResponseHelper.success(res, 'Surat masuk berhasil diupdate', surat);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Delete surat masuk
     */
    static async destroy(req, res) {
        try {
            const { id } = req.params;
            await SuratService.deleteSuratMasuk(id, req.user.id);

            return ResponseHelper.success(res, 'Surat masuk berhasil dihapus');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Upload file surat masuk
     */
    static async uploadFile(req, res) {
        try {
            const { id } = req.params;
            
            if (!req.file) {
                throw new Error('File tidak ditemukan');
            }

            const result = await SuratService.uploadFileSuratMasuk(id, req.file, req.user.id);

            return ResponseHelper.success(res, 'File berhasil diupload', result);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Export surat masuk to PDF
     */
    static async exportPDF(req, res) {
        try {
            const { id } = req.params;
            const pdf = await SuratService.exportSuratToPDF(id, 'masuk');

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=surat-masuk-${id}.pdf`);
            res.send(pdf);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }
}

module.exports = SuratMasukController;
