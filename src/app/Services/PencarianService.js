const { Op } = require('sequelize');
const SuratMasuk = require('../Models/SuratMasuk');
const SuratKeluar = require('../Models/SuratKeluar');
const Disposisi = require('../Models/Disposisi');
const Pengguna = require('../Models/Pengguna');

class PencarianService {
    /**
     * Global search across all modules
     */
    static async globalSearch(keyword, userId, options = {}) {
        try {
            const {
                page = 1,
                perPage = 20,
                modules = ['surat_masuk', 'surat_keluar', 'disposisi'],
                filters = {}
            } = options;

            const results = {};
            const offset = (page - 1) * perPage;

            // Search surat masuk
            if (modules.includes('surat_masuk')) {
                results.surat_masuk = await this.searchSuratMasuk(keyword, {
                    limit: perPage,
                    offset,
                    filters
                });
            }

            // Search surat keluar
            if (modules.includes('surat_keluar')) {
                results.surat_keluar = await this.searchSuratKeluar(keyword, {
                    limit: perPage,
                    offset,
                    filters
                });
            }

            // Search disposisi
            if (modules.includes('disposisi')) {
                results.disposisi = await this.searchDisposisi(keyword, userId, {
                    limit: perPage,
                    offset,
                    filters
                });
            }

            return results;
        } catch (error) {
            console.error('Global search failed:', error);
            throw error;
        }
    }

    /**
     * Search surat masuk
     */
    static async searchSuratMasuk(keyword, options = {}) {
        try {
            const where = {
                [Op.or]: [
                    { nomor_surat: { [Op.like]: `%${keyword}%` } },
                    { pengirim: { [Op.like]: `%${keyword}%` } },
                    { perihal: { [Op.like]: `%${keyword}%` } },
                    { isi_ringkas: { [Op.like]: `%${keyword}%` } },
                    { nomor_agenda: { [Op.like]: `%${keyword}%` } }
                ]
            };

            // Apply additional filters
            if (options.filters) {
                if (options.filters.tanggal_mulai && options.filters.tanggal_selesai) {
                    where.tanggal_surat = {
                        [Op.between]: [options.filters.tanggal_mulai, options.filters.tanggal_selesai]
                    };
                }
                if (options.filters.status) {
                    where.status = options.filters.status;
                }
                if (options.filters.sifat) {
                    where.sifat = options.filters.sifat;
                }
            }

            const { count, rows } = await SuratMasuk.findAndCountAll({
                where,
                include: ['instansi', 'kategori'],
                order: [['tanggal_terima', 'DESC']],
                limit: options.limit || 20,
                offset: options.offset || 0
            });

            return {
                data: rows,
                total: count,
                highlight: keyword
            };
        } catch (error) {
            console.error('Search surat masuk failed:', error);
            throw error;
        }
    }

    /**
     * Search surat keluar
     */
    static async searchSuratKeluar(keyword, options = {}) {
        try {
            const where = {
                [Op.or]: [
                    { nomor_surat: { [Op.like]: `%${keyword}%` } },
                    { tujuan: { [Op.like]: `%${keyword}%` } },
                    { perihal: { [Op.like]: `%${keyword}%` } },
                    { isi_ringkas: { [Op.like]: `%${keyword}%` } }
                ]
            };

            if (options.filters) {
                if (options.filters.tanggal_mulai && options.filters.tanggal_selesai) {
                    where.tanggal_surat = {
                        [Op.between]: [options.filters.tanggal_mulai, options.filters.tanggal_selesai]
                    };
                }
                if (options.filters.status) {
                    where.status = options.filters.status;
                }
            }

            const { count, rows } = await SuratKeluar.findAndCountAll({
                where,
                include: ['instansi', 'kategori'],
                order: [['tanggal_surat', 'DESC']],
                limit: options.limit || 20,
                offset: options.offset || 0
            });

            return {
                data: rows,
                total: count,
                highlight: keyword
            };
        } catch (error) {
            console.error('Search surat keluar failed:', error);
            throw error;
        }
    }

    /**
     * Search disposisi
     */
    static async searchDisposisi(keyword, userId, options = {}) {
        try {
            const where = {
                [Op.or]: [
                    { instruksi: { [Op.like]: `%${keyword}%` } },
                    { catatan: { [Op.like]: `%${keyword}%` } }
                ]
            };

            // User can only see their own disposisi unless admin
            if (userId && options.filters?.all !== true) {
                where[Op.or] = [
                    { dari_user_id: userId },
                    { kepada_user_id: userId }
                ];
            }

            if (options.filters?.status) {
                where.status = options.filters.status;
            }

            const { count, rows } = await Disposisi.findAndCountAll({
                where,
                include: [
                    { association: 'surat_masuk', attributes: ['id', 'nomor_surat', 'perihal'] },
                    { association: 'dari_user', attributes: ['id', 'nama_lengkap'] },
                    { association: 'kepada_user', attributes: ['id', 'nama_lengkap'] }
                ],
                order: [['created_at', 'DESC']],
                limit: options.limit || 20,
                offset: options.offset || 0
            });

            return {
                data: rows,
                total: count,
                highlight: keyword
            };
        } catch (error) {
            console.error('Search disposisi failed:', error);
            throw error;
        }
    }

    /**
     * Advanced search with multiple criteria
     */
    static async advancedSearch(criteria, options = {}) {
        try {
            const {
                keyword,
                tipe_surat,
                tanggal_mulai,
                tanggal_selesai,
                pengirim_tujuan,
                status,
                sifat,
                kategori_id,
                instansi_id
            } = criteria;

            const results = {
                surat_masuk: [],
                surat_keluar: [],
                total: 0
            };

            const commonWhere = {};
            
            if (keyword) {
                commonWhere[Op.or] = [
                    { nomor_surat: { [Op.like]: `%${keyword}%` } },
                    { perihal: { [Op.like]: `%${keyword}%` } },
                    { isi_ringkas: { [Op.like]: `%${keyword}%` } }
                ];
            }

            if (tanggal_mulai && tanggal_selesai) {
                commonWhere.tanggal_surat = {
                    [Op.between]: [tanggal_mulai, tanggal_selesai]
                };
            }

            if (status) {
                commonWhere.status = status;
            }

            if (sifat) {
                commonWhere.sifat = sifat;
            }

            if (kategori_id) {
                commonWhere.kategori_id = kategori_id;
            }

            if (instansi_id) {
                commonWhere.instansi_id = instansi_id;
            }

            // Search surat masuk
            if (!tipe_surat || tipe_surat === 'masuk') {
                const masukWhere = { ...commonWhere };
                if (pengirim_tujuan) {
                    masukWhere.pengirim = { [Op.like]: `%${pengirim_tujuan}%` };
                }

                const suratMasuk = await SuratMasuk.findAll({
                    where: masukWhere,
                    include: ['instansi', 'kategori'],
                    order: [['tanggal_terima', 'DESC']],
                    limit: options.limit || 50
                });

                results.surat_masuk = suratMasuk.map(s => ({
                    ...s.toJSON(),
                    tipe_surat: 'masuk'
                }));
            }

            // Search surat keluar
            if (!tipe_surat || tipe_surat === 'keluar') {
                const keluarWhere = { ...commonWhere };
                if (pengirim_tujuan) {
                    keluarWhere.tujuan = { [Op.like]: `%${pengirim_tujuan}%` };
                }

                const suratKeluar = await SuratKeluar.findAll({
                    where: keluarWhere,
                    include: ['instansi', 'kategori'],
                    order: [['tanggal_surat', 'DESC']],
                    limit: options.limit || 50
                });

                results.surat_keluar = suratKeluar.map(s => ({
                    ...s.toJSON(),
                    tipe_surat: 'keluar'
                }));
            }

            // Combine and sort results
            const allResults = [...results.surat_masuk, ...results.surat_keluar];
            allResults.sort((a, b) => {
                const dateA = new Date(a.tanggal_surat || a.tanggal_terima);
                const dateB = new Date(b.tanggal_surat || b.tanggal_terima);
                return dateB - dateA;
            });

            results.total = allResults.length;

            return results;
        } catch (error) {
            console.error('Advanced search failed:', error);
            throw error;
        }
    }

    /**
     * Get search suggestions
     */
    static async getSuggestions(keyword, limit = 10) {
        try {
            const suggestions = new Set();

            // Search in surat masuk
            const suratMasuk = await SuratMasuk.findAll({
                where: {
                    [Op.or]: [
                        { pengirim: { [Op.like]: `%${keyword}%` } },
                        { perihal: { [Op.like]: `%${keyword}%` } }
                    ]
                },
                attributes: ['pengirim', 'perihal'],
                limit: limit
            });

            suratMasuk.forEach(s => {
                if (s.pengirim.toLowerCase().includes(keyword.toLowerCase())) {
                    suggestions.add(s.pengirim);
                }
                if (s.perihal.toLowerCase().includes(keyword.toLowerCase())) {
                    suggestions.add(s.perihal);
                }
            });

            // Search in surat keluar
            const suratKeluar = await SuratKeluar.findAll({
                where: {
                    [Op.or]: [
                        { tujuan: { [Op.like]: `%${keyword}%` } },
                        { perihal: { [Op.like]: `%${keyword}%` } }
                    ]
                },
                attributes: ['tujuan', 'perihal'],
                limit: limit
            });

            suratKeluar.forEach(s => {
                if (s.tujuan.toLowerCase().includes(keyword.toLowerCase())) {
                    suggestions.add(s.tujuan);
                }
                if (s.perihal.toLowerCase().includes(keyword.toLowerCase())) {
                    suggestions.add(s.perihal);
                }
            });

            return Array.from(suggestions).slice(0, limit);
        } catch (error) {
            console.error('Get suggestions failed:', error);
            throw error;
        }
    }
}

module.exports = PencarianService;
