// ==================== PENCARIAN CONTROLLER ====================
// Arsip Surat Digital Enterprise

class PencarianController {
    constructor() {
        this.suratMasukModel = require('../../Models/SuratMasuk');
        this.suratKeluarModel = require('../../Models/SuratKeluar');
        this.disposisiModel = require('../../Models/Disposisi');
        this.logModel = require('../../Models/LogAktivitas');
    }

    /**
     * Global search across all modules
     */
    async search(req, res) {
        try {
            const query = req.query.q?.trim();
            const type = req.query.type || 'all';
            const limit = parseInt(req.query.limit) || 20;
            const instansiId = req.user.instansi_id;

            if (!query || query.length < 2) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'Masukkan minimal 2 karakter untuk mencari',
                });
            }

            const results = [];
            let total = 0;

            // Search surat masuk
            if (type === 'all' || type === 'surat-masuk') {
                const suratMasuk = await this.suratMasukModel.search(query, instansiId, limit);
                results.push(...suratMasuk.map(item => ({
                    ...item,
                    _type: 'surat-masuk',
                    _typeLabel: 'Surat Masuk',
                    _icon: '📥',
                    _url: `/surat-masuk/show.ejs?id=${item.id}`,
                })));
            }

            // Search surat keluar
            if (type === 'all' || type === 'surat-keluar') {
                const suratKeluar = await this.suratKeluarModel.search(query, instansiId, limit);
                results.push(...suratKeluar.map(item => ({
                    ...item,
                    _type: 'surat-keluar',
                    _typeLabel: 'Surat Keluar',
                    _icon: '📤',
                    _url: `/surat-keluar/show.ejs?id=${item.id}`,
                })));
            }

            // Search disposisi
            if (type === 'all' || type === 'disposisi') {
                const disposisi = await this.disposisiModel.search(query, instansiId, limit);
                results.push(...disposisi.map(item => ({
                    ...item,
                    _type: 'disposisi',
                    _typeLabel: 'Disposisi',
                    _icon: '📋',
                    _url: `/disposisi/show.ejs?id=${item.id}`,
                })));
            }

            // Sort by relevance (simple: by date)
            results.sort((a, b) => new Date(b.created_at || b.tanggal_terima) - new Date(a.created_at || a.tanggal_terima));

            // Limit total results
            const limitedResults = results.slice(0, limit);

            // Log search activity
            await this.logSearch(req, query, limitedResults.length);

            return res.json({
                success: true,
                data: limitedResults,
                meta: {
                    query: query,
                    type: type,
                    total: results.length,
                    returned: limitedResults.length,
                },
            });

        } catch (error) {
            console.error('Search error:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal melakukan pencarian',
            });
        }
    }

    /**
     * Advanced search with filters
     */
    async advancedSearch(req, res) {
        try {
            const {
                q, type, status, kategori,
                start_date, end_date,
                pengirim, perihal,
                page = 1, limit = 20,
            } = req.query;

            const instansiId = req.user.instansi_id;
            const results = [];

            // Build filters
            const filters = {
                search: q,
                status,
                kategori,
                startDate: start_date,
                endDate: end_date,
                page: parseInt(page),
                limit: parseInt(limit),
                instansi_id: instansiId,
            };

            // Search based on type
            if (!type || type === 'surat-masuk') {
                const suratMasuk = await this.suratMasukModel.findAll({
                    ...filters,
                    pengirim: pengirim,
                    perihal: perihal,
                });
                results.push({
                    type: 'surat-masuk',
                    label: 'Surat Masuk',
                    data: suratMasuk.data,
                    pagination: suratMasuk.pagination,
                });
            }

            if (!type || type === 'surat-keluar') {
                const suratKeluar = await this.suratKeluarModel.findAll({
                    ...filters,
                    tujuan: pengirim,
                    perihal: perihal,
                });
                results.push({
                    type: 'surat-keluar',
                    label: 'Surat Keluar',
                    data: suratKeluar.data,
                    pagination: suratKeluar.pagination,
                });
            }

            return res.json({
                success: true,
                data: results,
                filters: {
                    query: q,
                    type: type,
                    status: status,
                    dateRange: { start: start_date, end: end_date },
                },
            });

        } catch (error) {
            console.error('Advanced search error:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal melakukan pencarian lanjutan',
            });
        }
    }

    /**
     * Get search suggestions (autocomplete)
     */
    async suggestions(req, res) {
        try {
            const query = req.query.q?.trim();
            if (!query || query.length < 2) {
                return res.json({ success: true, data: [] });
            }

            const instansiId = req.user.instansi_id;
            const suggestions = [];

            // Get recent searches
            const recentSearches = await this.logModel.findByAction('SEARCH', 5);
            
            // Get popular perihal
            const suratMasuk = await this.suratMasukModel.findAll({
                search: query,
                limit: 5,
                instansi_id: instansiId,
            });

            suggestions.push(...suratMasuk.data.map(item => ({
                text: item.perihal,
                type: 'surat-masuk',
                subtitle: `${item.nomor_agenda} - ${item.pengirim}`,
            })));

            return res.json({
                success: true,
                data: suggestions.slice(0, 10),
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil saran pencarian',
            });
        }
    }

    /**
     * Log search activity
     */
    async logSearch(req, query, resultCount) {
        try {
            await this.logModel.create({
                user_id: req.user?.id || null,
                action: 'SEARCH',
                description: `Search: "${query}" - ${resultCount} results`,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'] || 'unknown',
                metadata: JSON.stringify({
                    query: query,
                    resultCount: resultCount,
                    type: req.query.type || 'all',
                }),
            });
        } catch (error) {
            console.error('Failed to log search:', error);
        }
    }
}

module.exports = new PencarianController();
