const PencarianService = require('../../Services/PencarianService');
const ResponseHelper = require('../../Helpers/ResponseHelper');

class PencarianController {
    /**
     * Global search
     */
    static async search(req, res) {
        try {
            const { q, page = 1, perPage = 20, modules } = req.query;

            if (!q || q.length < 3) {
                return ResponseHelper.error(res, 'Kata kunci minimal 3 karakter', 400);
            }

            const options = {
                page: parseInt(page),
                perPage: parseInt(perPage)
            };

            if (modules) {
                options.modules = modules.split(',');
            }

            const results = await PencarianService.globalSearch(q, req.user.id, options);

            return ResponseHelper.success(res, 'Hasil pencarian berhasil diambil', results);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Advanced search
     */
    static async advancedSearch(req, res) {
        try {
            const criteria = {
                keyword: req.query.keyword,
                tipe_surat: req.query.tipe_surat,
                tanggal_mulai: req.query.tanggal_mulai,
                tanggal_selesai: req.query.tanggal_selesai,
                pengirim_tujuan: req.query.pengirim_tujuan,
                status: req.query.status,
                sifat: req.query.sifat,
                kategori_id: req.query.kategori_id,
                instansi_id: req.query.instansi_id
            };

            const results = await PencarianService.advancedSearch(criteria);

            return ResponseHelper.success(res, 'Hasil pencarian lanjutan berhasil diambil', results);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Get search suggestions
     */
    static async suggestions(req, res) {
        try {
            const { q, limit = 10 } = req.query;

            if (!q || q.length < 2) {
                return ResponseHelper.success(res, 'Suggestions', []);
            }

            const suggestions = await PencarianService.getSuggestions(q, parseInt(limit));

            return ResponseHelper.success(res, 'Suggestions berhasil diambil', suggestions);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }
}

module.exports = PencarianController;
