const SuratMasuk = require('../Models/SuratMasuk');
const SuratKeluar = require('../Models/SuratKeluar');
const Lampiran = require('../Models/Lampiran');
const Disposisi = require('../Models/Disposisi');
const Notifikasi = require('../Models/Notifikasi');
const LogAktivitas = require('../Models/LogAktivitas');
const FileHelper = require('../Helpers/FileHelper');
const { sequelize } = require('../../config/database');
const { Op } = require('sequelize');

class SuratService {
    /**
     * SURAT MASUK SERVICES
     */
    
    // Get all surat masuk with pagination and filters
    static async getSuratMasuk(filters = {}, page = 1, perPage = 20) {
        try {
            const where = {};
            
            if (filters.nomor_surat) {
                where.nomor_surat = { [Op.like]: `%${filters.nomor_surat}%` };
            }
            if (filters.pengirim) {
                where.pengirim = { [Op.like]: `%${filters.pengirim}%` };
            }
            if (filters.perihal) {
                where.perihal = { [Op.like]: `%${filters.perihal}%` };
            }
            if (filters.status) {
                where.status = filters.status;
            }
            if (filters.sifat) {
                where.sifat = filters.sifat;
            }
            if (filters.tanggal_mulai && filters.tanggal_selesai) {
                where.tanggal_surat = {
                    [Op.between]: [filters.tanggal_mulai, filters.tanggal_selesai]
                };
            }
            if (filters.kategori_id) {
                where.kategori_id = filters.kategori_id;
            }
            if (filters.instansi_id) {
                where.instansi_id = filters.instansi_id;
            }

            const offset = (page - 1) * perPage;
            
            const { count, rows } = await SuratMasuk.findAndCountAll({
                where,
                include: [
                    { association: 'instansi', attributes: ['id', 'nama_instansi'] },
                    { association: 'kategori', attributes: ['id', 'nama_kategori'] },
                    { association: 'creator', attributes: ['id', 'nama_lengkap'] }
                ],
                order: [['tanggal_terima', 'DESC']],
                limit: perPage,
                offset: offset,
                distinct: true
            });

            return {
                data: rows,
                pagination: {
                    total: count,
                    perPage: perPage,
                    currentPage: page,
                    totalPages: Math.ceil(count / perPage)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    // Get surat masuk by ID
    static async getSuratMasukById(id) {
        try {
            const surat = await SuratMasuk.findByPk(id, {
                include: [
                    { association: 'instansi' },
                    { association: 'kategori' },
                    { association: 'creator', attributes: ['id', 'nama_lengkap'] },
                    { association: 'updater', attributes: ['id', 'nama_lengkap'] }
                ]
            });

            if (!surat) {
                throw new Error('Surat masuk tidak ditemukan');
            }

            return surat;
        } catch (error) {
            throw error;
        }
    }

    // Create surat masuk
    static async createSuratMasuk(data, userId) {
        const transaction = await sequelize.transaction();
        
        try {
            // Generate nomor agenda otomatis
            const nomorAgenda = await this.generateNomorAgenda();
            
            const suratData = {
                ...data,
                nomor_agenda: nomorAgenda,
                created_by: userId,
                updated_by: userId
            };

            const surat = await SuratMasuk.create(suratData, { transaction });

            // Log aktivitas
            await LogAktivitas.log({
                user_id: userId,
                aksi: 'create',
                modul: 'surat_masuk',
                deskripsi: `Membuat surat masuk dengan nomor agenda ${nomorAgenda}`,
                data_baru: surat.toJSON()
            });

            // Kirim notifikasi ke admin
            await this.sendNotifikasiSuratBaru(surat, 'masuk');

            await transaction.commit();
            return surat;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // Update surat masuk
    static async updateSuratMasuk(id, data, userId) {
        const transaction = await sequelize.transaction();
        
        try {
            const surat = await SuratMasuk.findByPk(id, { transaction });
            
            if (!surat) {
                throw new Error('Surat masuk tidak ditemukan');
            }

            const dataLama = surat.toJSON();
            
            await surat.update({
                ...data,
                updated_by: userId
            }, { transaction });

            // Log aktivitas
            await LogAktivitas.log({
                user_id: userId,
                aksi: 'update',
                modul: 'surat_masuk',
                deskripsi: `Mengupdate surat masuk nomor agenda ${surat.nomor_agenda}`,
                data_lama: dataLama,
                data_baru: surat.toJSON()
            });

            await transaction.commit();
            return surat;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // Delete surat masuk (soft delete)
    static async deleteSuratMasuk(id, userId) {
        const transaction = await sequelize.transaction();
        
        try {
            const surat = await SuratMasuk.findByPk(id, { transaction });
            
            if (!surat) {
                throw new Error('Surat masuk tidak ditemukan');
            }

            // Hapus file jika ada
            if (surat.file_path) {
                await FileHelper.deleteFile(surat.file_path);
            }

            // Soft delete
            await surat.destroy({ transaction });

            // Log aktivitas
            await LogAktivitas.log({
                user_id: userId,
                aksi: 'delete',
                modul: 'surat_masuk',
                deskripsi: `Menghapus surat masuk nomor agenda ${surat.nomor_agenda}`,
                data_lama: surat.toJSON()
            });

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // Upload file surat masuk
    static async uploadFileSuratMasuk(id, file, userId) {
        try {
            const surat = await SuratMasuk.findByPk(id);
            
            if (!surat) {
                throw new Error('Surat masuk tidak ditemukan');
            }

            // Hapus file lama jika ada
            if (surat.file_path) {
                await FileHelper.deleteFile(surat.file_path);
            }

            // Upload file baru
            const uploadedFile = await FileHelper.uploadFile(file, {
                destination: `uploads/surat-masuk/${id}`,
                allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
                maxSize: 10 * 1024 * 1024
            });

            // Update surat
            await surat.update({
                file_path: uploadedFile.path,
                file_name: uploadedFile.originalName,
                file_size: uploadedFile.size,
                updated_by: userId
            });

            return uploadedFile;
        } catch (error) {
            throw error;
        }
    }

    /**
     * SURAT KELUAR SERVICES
     */

    // Get all surat keluar with pagination and filters
    static async getSuratKeluar(filters = {}, page = 1, perPage = 20) {
        try {
            const where = {};
            
            if (filters.nomor_surat) {
                where.nomor_surat = { [Op.like]: `%${filters.nomor_surat}%` };
            }
            if (filters.tujuan) {
                where.tujuan = { [Op.like]: `%${filters.tujuan}%` };
            }
            if (filters.perihal) {
                where.perihal = { [Op.like]: `%${filters.perihal}%` };
            }
            if (filters.status) {
                where.status = filters.status;
            }
            if (filters.sifat) {
                where.sifat = filters.sifat;
            }
            if (filters.tanggal_mulai && filters.tanggal_selesai) {
                where.tanggal_surat = {
                    [Op.between]: [filters.tanggal_mulai, filters.tanggal_selesai]
                };
            }

            const offset = (page - 1) * perPage;
            
            const { count, rows } = await SuratKeluar.findAndCountAll({
                where,
                include: [
                    { association: 'instansi', attributes: ['id', 'nama_instansi'] },
                    { association: 'kategori', attributes: ['id', 'nama_kategori'] },
                    { association: 'creator', attributes: ['id', 'nama_lengkap'] }
                ],
                order: [['tanggal_surat', 'DESC']],
                limit: perPage,
                offset: offset,
                distinct: true
            });

            return {
                data: rows,
                pagination: {
                    total: count,
                    perPage: perPage,
                    currentPage: page,
                    totalPages: Math.ceil(count / perPage)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    // Get surat keluar by ID
    static async getSuratKeluarById(id) {
        try {
            const surat = await SuratKeluar.findByPk(id, {
                include: [
                    { association: 'instansi' },
                    { association: 'kategori' },
                    { association: 'creator', attributes: ['id', 'nama_lengkap'] },
                    { association: 'updater', attributes: ['id', 'nama_lengkap'] }
                ]
            });

            if (!surat) {
                throw new Error('Surat keluar tidak ditemukan');
            }

            return surat;
        } catch (error) {
            throw error;
        }
    }

    // Create surat keluar
    static async createSuratKeluar(data, userId) {
        const transaction = await sequelize.transaction();
        
        try {
            const suratData = {
                ...data,
                created_by: userId,
                updated_by: userId
            };

            const surat = await SuratKeluar.create(suratData, { transaction });

            // Log aktivitas
            await LogAktivitas.log({
                user_id: userId,
                aksi: 'create',
                modul: 'surat_keluar',
                deskripsi: `Membuat surat keluar dengan nomor ${surat.nomor_surat}`,
                data_baru: surat.toJSON()
            });

            await transaction.commit();
            return surat;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // Update surat keluar
    static async updateSuratKeluar(id, data, userId) {
        const transaction = await sequelize.transaction();
        
        try {
            const surat = await SuratKeluar.findByPk(id, { transaction });
            
            if (!surat) {
                throw new Error('Surat keluar tidak ditemukan');
            }

            const dataLama = surat.toJSON();
            
            await surat.update({
                ...data,
                updated_by: userId
            }, { transaction });

            // Log aktivitas
            await LogAktivitas.log({
                user_id: userId,
                aksi: 'update',
                modul: 'surat_keluar',
                deskripsi: `Mengupdate surat keluar nomor ${surat.nomor_surat}`,
                data_lama: dataLama,
                data_baru: surat.toJSON()
            });

            await transaction.commit();
            return surat;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // Delete surat keluar
    static async deleteSuratKeluar(id, userId) {
        const transaction = await sequelize.transaction();
        
        try {
            const surat = await SuratKeluar.findByPk(id, { transaction });
            
            if (!surat) {
                throw new Error('Surat keluar tidak ditemukan');
            }

            // Hapus file jika ada
            if (surat.file_path) {
                await FileHelper.deleteFile(surat.file_path);
            }

            await surat.destroy({ transaction });

            // Log aktivitas
            await LogAktivitas.log({
                user_id: userId,
                aksi: 'delete',
                modul: 'surat_keluar',
                deskripsi: `Menghapus surat keluar nomor ${surat.nomor_surat}`,
                data_lama: surat.toJSON()
            });

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * HELPER METHODS
     */

    // Generate nomor agenda otomatis
    static async generateNomorAgenda() {
        const tahun = new Date().getFullYear();
        const bulan = String(new Date().getMonth() + 1).padStart(2, '0');
        
        // Hitung jumlah surat bulan ini
        const count = await SuratMasuk.count({
            where: {
                created_at: {
                    [Op.between]: [
                        new Date(tahun, new Date().getMonth(), 1),
                        new Date(tahun, new Date().getMonth() + 1, 0)
                    ]
                }
            }
        });

        const nomorUrut = String(count + 1).padStart(4, '0');
        return `${nomorUrut}/SM/${bulan}/${tahun}`;
    }

    // Kirim notifikasi surat baru
    static async sendNotifikasiSuratBaru(surat, tipe) {
        try {
            const Pengguna = require('../Models/Pengguna');
            
            // Cari admin untuk dikirim notifikasi
            const admins = await Pengguna.findAll({
                where: {
                    role_id: [1, 2], // superadmin dan admin
                    status: 'aktif'
                }
            });

            const notifTitle = tipe === 'masuk' 
                ? 'Surat Masuk Baru' 
                : 'Surat Keluar Baru';

            for (const admin of admins) {
                await Notifikasi.create({
                    user_id: admin.id,
                    judul: notifTitle,
                    pesan: `Surat ${tipe} baru dengan perihal "${surat.perihal}" telah ditambahkan`,
                    tipe: `surat_${tipe}`,
                    referensi_id: surat.id
                });
            }
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    // Get statistics surat
    static async getStatistics(tahun = null) {
        try {
            if (!tahun) {
                tahun = new Date().getFullYear();
            }

            const stats = {
                surat_masuk: {
                    total: await SuratMasuk.count({
                        where: {
                            created_at: {
                                [Op.between]: [
                                    new Date(tahun, 0, 1),
                                    new Date(tahun, 11, 31)
                                ]
                            }
                        }
                    }),
                    per_bulan: [],
                    per_status: {}
                },
                surat_keluar: {
                    total: await SuratKeluar.count({
                        where: {
                            created_at: {
                                [Op.between]: [
                                    new Date(tahun, 0, 1),
                                    new Date(tahun, 11, 31)
                                ]
                            }
                        }
                    }),
                    per_bulan: [],
                    per_status: {}
                },
                disposisi: {
                    total: await Disposisi.count()
                }
            };

            // Hitung per bulan untuk surat masuk
            for (let bulan = 0; bulan < 12; bulan++) {
                const count = await SuratMasuk.count({
                    where: {
                        created_at: {
                            [Op.between]: [
                                new Date(tahun, bulan, 1),
                                new Date(tahun, bulan + 1, 0)
                            ]
                        }
                    }
                });
                stats.surat_masuk.per_bulan.push({
                    bulan: bulan + 1,
                    jumlah: count
                });
            }

            // Hitung per bulan untuk surat keluar
            for (let bulan = 0; bulan < 12; bulan++) {
                const count = await SuratKeluar.count({
                    where: {
                        created_at: {
                            [Op.between]: [
                                new Date(tahun, bulan, 1),
                                new Date(tahun, bulan + 1, 0)
                            ]
                        }
                    }
                });
                stats.surat_keluar.per_bulan.push({
                    bulan: bulan + 1,
                    jumlah: count
                });
            }

            // Hitung per status untuk surat masuk
            const statusesMasuk = ['draft', 'diterima', 'didisposisikan', 'selesai', 'arsip'];
            for (const status of statusesMasuk) {
                stats.surat_masuk.per_status[status] = await SuratMasuk.count({
                    where: { status }
                });
            }

            // Hitung per status untuk surat keluar
            const statusesKeluar = ['draft', 'dikirim', 'selesai', 'arsip'];
            for (const status of statusesKeluar) {
                stats.surat_keluar.per_status[status] = await SuratKeluar.count({
                    where: { status }
                });
            }

            return stats;
        } catch (error) {
            throw error;
        }
    }

    // Search surat
    static async searchSurat(keyword, tipe = 'semua', page = 1, perPage = 20) {
        try {
            const offset = (page - 1) * perPage;
            let results = {};

            if (tipe === 'semua' || tipe === 'masuk') {
                const suratMasuk = await SuratMasuk.findAndCountAll({
                    where: {
                        [Op.or]: [
                            { nomor_surat: { [Op.like]: `%${keyword}%` } },
                            { pengirim: { [Op.like]: `%${keyword}%` } },
                            { perihal: { [Op.like]: `%${keyword}%` } },
                            { isi_ringkas: { [Op.like]: `%${keyword}%` } },
                            { nomor_agenda: { [Op.like]: `%${keyword}%` } }
                        ]
                    },
                    include: [
                        { association: 'instansi', attributes: ['id', 'nama_instansi'] },
                        { association: 'kategori', attributes: ['id', 'nama_kategori'] }
                    ],
                    limit: perPage,
                    offset: offset
                });
                results.surat_masuk = suratMasuk;
            }

            if (tipe === 'semua' || tipe === 'keluar') {
                const suratKeluar = await SuratKeluar.findAndCountAll({
                    where: {
                        [Op.or]: [
                            { nomor_surat: { [Op.like]: `%${keyword}%` } },
                            { tujuan: { [Op.like]: `%${keyword}%` } },
                            { perihal: { [Op.like]: `%${keyword}%` } },
                            { isi_ringkas: { [Op.like]: `%${keyword}%` } }
                        ]
                    },
                    include: [
                        { association: 'instansi', attributes: ['id', 'nama_instansi'] },
                        { association: 'kategori', attributes: ['id', 'nama_kategori'] }
                    ],
                    limit: perPage,
                    offset: offset
                });
                results.surat_keluar = suratKeluar;
            }

            return results;
        } catch (error) {
            throw error;
        }
    }

    // Export surat to PDF
    static async exportSuratToPDF(id, tipe = 'masuk') {
        try {
            let surat;
            if (tipe === 'masuk') {
                surat = await this.getSuratMasukById(id);
            } else {
                surat = await this.getSuratKeluarById(id);
            }

            const PdfService = require('./PdfService');
            return await PdfService.generateSuratPDF(surat, tipe);
        } catch (error) {
            throw error;
        }
    }

    // Get laporan surat
    static async getLaporan(filters = {}) {
        try {
            const {
                tipe = 'semua',
                tanggal_mulai,
                tanggal_selesai,
                kategori_id,
                status
            } = filters;

            const where = {};
            
            if (tanggal_mulai && tanggal_selesai) {
                where.tanggal_surat = {
                    [Op.between]: [tanggal_mulai, tanggal_selesai]
                };
            }
            if (kategori_id) {
                where.kategori_id = kategori_id;
            }
            if (status) {
                where.status = status;
            }

            let results = [];

            if (tipe === 'semua' || tipe === 'masuk') {
                const suratMasuk = await SuratMasuk.findAll({
                    where,
                    include: [
                        { association: 'instansi' },
                        { association: 'kategori' },
                        { association: 'creator', attributes: ['nama_lengkap'] }
                    ],
                    order: [['tanggal_terima', 'DESC']]
                });
                results = results.concat(suratMasuk.map(s => ({ ...s.toJSON(), tipe_surat: 'masuk' })));
            }

            if (tipe === 'semua' || tipe === 'keluar') {
                const suratKeluar = await SuratKeluar.findAll({
                    where,
                    include: [
                        { association: 'instansi' },
                        { association: 'kategori' },
                        { association: 'creator', attributes: ['nama_lengkap'] }
                    ],
                    order: [['tanggal_surat', 'DESC']]
                });
                results = results.concat(suratKeluar.map(s => ({ ...s.toJSON(), tipe_surat: 'keluar' })));
            }

            // Sort by date
            results.sort((a, b) => {
                const dateA = new Date(a.tanggal_surat || a.tanggal_terima);
                const dateB = new Date(b.tanggal_surat || b.tanggal_terima);
                return dateB - dateA;
            });

            return results;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = SuratService;
