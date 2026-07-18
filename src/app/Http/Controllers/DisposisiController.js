const DisposisiService = require('../../Services/DisposisiService');
const ResponseHelper = require('../../Helpers/ResponseHelper');
const PdfService = require('../../Services/PdfService');

class DisposisiController {
    /**
     * Get all disposisi
     */
    static async index(req, res) {
        try {
            const { page = 1, perPage = 20, ...filters } = req.query;
            const result = await DisposisiService.getDisposisi(filters, parseInt(page), parseInt(perPage));

            return ResponseHelper.success(res, 'Data disposisi berhasil diambil', result);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Get disposisi by ID
     */
    static async show(req, res) {
        try {
            const { id } = req.params;
            const disposisi = await DisposisiService.getDisposisiById(id);

            return ResponseHelper.success(res, 'Data disposisi berhasil diambil', disposisi);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 404);
        }
    }

    /**
     * Create disposisi
     */
    static async store(req, res) {
        try {
            const disposisi = await DisposisiService.createDisposisi(req.body, req.user.id);

            return ResponseHelper.success(res, 'Disposisi berhasil dibuat', disposisi, 201);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Update status disposisi
     */
    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, catatan } = req.body;
            const disposisi = await DisposisiService.updateStatusDisposisi(id, status, catatan, req.user.id);

            return ResponseHelper.success(res, 'Status disposisi berhasil diupdate', disposisi);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Reply disposisi
     */
    static async reply(req, res) {
        try {
            const { id } = req.params;
            const reply = await DisposisiService.replyDisposisi(id, req.body, req.user.id);

            return ResponseHelper.success(res, 'Balasan disposisi berhasil dibuat', reply, 201);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Get disposisi for current user
     */
    static async myDisposisi(req, res) {
        try {
            const { page = 1, perPage = 20, ...filters } = req.query;
            const result = await DisposisiService.getDisposisiForUser(
                req.user.id, 
                filters, 
                parseInt(page), 
                parseInt(perPage)
            );

            return ResponseHelper.success(res, 'Data disposisi berhasil diambil', result);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Get disposisi statistics
     */
    static async statistics(req, res) {
        try {
            const stats = await DisposisiService.getStatistics(req.user.id);

            return ResponseHelper.success(res, 'Statistik disposisi berhasil diambil', stats);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Batch update status
     */
    static async batchUpdate(req, res) {
        try {
            const { ids, status } = req.body;
            const results = await DisposisiService.batchUpdateStatus(ids, status, req.user.id);

            return ResponseHelper.success(res, 'Status disposisi berhasil diupdate secara batch', results);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Delete disposisi
     */
    static async destroy(req, res) {
        try {
            const { id } = req.params;
            await DisposisiService.deleteDisposisi(id, req.user.id);

            return ResponseHelper.success(res, 'Disposisi berhasil dihapus');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Export disposisi to PDF
     */
    static async exportPDF(req, res) {
        try {
            const { id } = req.params;
            const disposisi = await DisposisiService.getDisposisiById(id);
            const pdf = await PdfService.generateDisposisiPDF(disposisi);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=disposisi-${id}.pdf`);
            res.send(pdf);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }
}

module.exports = DisposisiController;
