const Disposisi = require('../Models/Disposisi');
const SuratMasuk = require('../Models/SuratMasuk');
const Pengguna = require('../Models/Pengguna');
const Notifikasi = require('../Models/Notifikasi');
const LogAktivitas = require('../Models/LogAktivitas');
const EmailService = require('./EmailService');
const { sequelize } = require('../../config/database');
const { Op } = require('sequelize');

class DisposisiService {
    /**
     * Get all disposisi with filters
     */
    static async getDisposisi(filters = {}, page = 1, perPage = 20) {
        try {
            const where = {};
            
            if (filters.status) {
                where.status = filters.status;
            }
            if (filters.dari_user_id) {
                where.dari_user_id = filters.dari_user_id;
            }
            if (filters.kepada_user_id) {
                where.kepada_user_id = filters.kepada_user_id;
            }
            if (filters.surat_masuk_id) {
                where.surat_masuk_id = filters.surat_masuk_id;
            }
            if (filters.sifat) {
                where.sifat = filters.sifat;
            }

            const offset = (page - 1) * perPage;
            
            const { count, rows } = await Disposisi.findAndCountAll({
                where,
                include: [
                    {
                        association: 'surat_masuk',
                        attributes: ['id', 'nomor_surat', 'pengirim', 'perihal', 'nomor_agenda']
                    },
                    {
                        association: 'dari_user',
                        attributes: ['id', 'nama_lengkap', 'jabatan']
                    },
                    {
                        association: 'kepada_user',
                        attributes: ['id', 'nama_lengkap', 'jabatan']
                    },
                    {
                        association: 'replies',
                        include: [
                            {
                                association: 'dari_user',
                                attributes: ['id', 'nama_lengkap']
                            },
                            {
                                association: 'kepada_user',
                                attributes: ['id', 'nama_lengkap']
                            }
                        ]
                    }
                ],
                order: [['created_at', 'DESC']],
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

    /**
     * Get disposisi by ID
     */
    static async getDisposisiById(id) {
        try {
            const disposisi = await Disposisi.findByPk(id, {
                include: [
                    {
                        association: 'surat_masuk',
                        include: ['instansi', 'kategori']
                    },
                    {
                        association: 'dari_user',
                        attributes: ['id', 'nama_lengkap', 'jabatan', 'email']
                    },
                    {
                        association: 'kepada_user',
                        attributes: ['id', 'nama_lengkap', 'jabatan', 'email']
                    },
                    {
                        association: 'parent',
                        include: [
                            {
                                association: 'dari_user',
                                attributes: ['id', 'nama_lengkap']
                            }
                        ]
                    },
                    {
                        association: 'replies',
                        include: [
                            {
                                association: 'dari_user',
                                attributes: ['id', 'nama_lengkap']
                            },
                            {
                                association: 'kepada_user',
                                attributes: ['id', 'nama_lengkap']
                            }
                        ]
                    }
                ]
            });

            if (!disposisi) {
                throw new Error('Disposisi tidak ditemukan');
            }

            return disposisi;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create disposisi
     */
    static async createDisposisi(data, userId) {
        const transaction = await sequelize.transaction();
        
        try {
            // Validasi surat masuk
            const suratMasuk = await SuratMasuk.findByPk(data.surat_masuk_id);
            if (!suratMasuk) {
                throw new Error('Surat masuk tidak ditemukan');
            }

            // Validasi user tujuan
            const userTujuan = await Pengguna.findByPk(data.kepada_user_id);
            if (!userTujuan) {
                throw new Error('User tujuan tidak ditemukan');
            }

            const disposisiData = {
                ...data,
                dari_user_id: userId,
                status: 'dikirim'
            };

            const disposisi = await Disposisi.create(disposisiData, { transaction });

            // Update status surat masuk
            await suratMasuk.update({
                status: 'didisposisikan'
            }, { transaction });

            // Buat notifikasi
            await Notifikasi.create({
                user_id: data.kepada_user_id,
                judul: 'Disposisi Baru',
                pesan: `Anda menerima disposisi surat "${suratMasuk.perihal}" dengan instruksi: "${data.instruksi}"`,
                tipe: 'disposisi',
                referensi_id: disposisi.id
            }, { transaction });

            // Kirim email notifikasi
            try {
                await EmailService.sendDisposisiNotification(disposisi, userTujuan, suratMasuk);
            } catch (emailError) {
                console.error('Error sending disposisi email:', emailError);
            }

            // Log aktivitas
            await LogAktivitas.log({
                user_id: userId,
                aksi: 'create',
                modul: 'disposisi',
                deskripsi: `Membuat disposisi untuk surat masuk "${suratMasuk.perihal}"`,
                data_baru: disposisi.toJSON()
            });

            await transaction.commit();
            return disposisi;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Update disposisi status
     */
    static async updateStatusDisposisi(id, status, catatan, userId) {
        const transaction = await sequelize.transaction();
        
        try {
            const disposisi = await Disposisi.findByPk(id, {
                include: ['surat_masuk', 'dari_user']
            });
            
            if (!disposisi) {
                throw new Error('Disposisi tidak ditemukan');
            }

            // Validasi user yang memproses
            if (disposisi.kepada_user_id !== userId) {
                throw new Error('Anda tidak berhak memproses disposisi ini');
            }

            const dataLama = disposisi.toJSON();
            
            await disposisi.update({
                status,
                catatan: catatan || disposisi.catatan
            }, { transaction });

            // Jika status selesai, update status surat masuk
            if (status === 'selesai') {
                // Cek apakah semua disposisi untuk surat ini sudah selesai
                const disposisiLain = await Disposisi.count({
                    where: {
                        surat_masuk_id: disposisi.surat_masuk_id,
                        status: { [Op.ne]: 'selesai' },
                        id: { [Op.ne]: disposisi.id }
                    }
                });

                if (disposisiLain === 0) {
                    await disposisi.surat_masuk.update({
                        status: 'selesai'
                    }, { transaction });
                }
            }

            // Notifikasi ke pengirim disposisi
            await Notifikasi.create({
                user_id: disposisi.dari_user_id,
                judul: 'Status Disposisi Diperbarui',
                pesan: `Disposisi Anda untuk surat "${disposisi.surat_masuk.perihal}" telah ${status}`,
                tipe: 'disposisi',
                referensi_id: disposisi.id
            }, { transaction });

            // Log aktivitas
            await LogAktivitas.log({
                user_id: userId,
                aksi: 'update_status',
                modul: 'disposisi',
                deskripsi: `Mengupdate status disposisi menjadi ${status}`,
                data_lama: dataLama,
                data_baru: disposisi.toJSON()
            });

            await transaction.commit();
            return disposisi;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Reply disposisi
     */
    static async replyDisposisi(parentId, data, userId) {
        const transaction = await sequelize.transaction();
        
        try {
            const parentDisposisi = await Disposisi.findByPk(parentId, {
                include: ['surat_masuk', 'dari_user', 'kepada_user']
            });
            
            if (!parentDisposisi) {
                throw new Error('Disposisi induk tidak ditemukan');
            }

            const replyData = {
                surat_masuk_id: parentDisposisi.surat_masuk_id,
                dari_user_id: userId,
                kepada_user_id: data.kepada_user_id || parentDisposisi.dari_user_id,
                instruksi: data.instruksi,
                batas_waktu: data.batas_waktu,
                sifat: data.sifat || parentDisposisi.sifat,
                parent_id: parentId,
                status: 'dikirim'
            };

            const reply = await Disposisi.create(replyData, { transaction });

            // Notifikasi
            await Notifikasi.create({
                user_id: reply.kepada_user_id,
                judul: 'Balasan Disposisi',
                pesan: `Anda menerima balasan disposisi untuk surat "${parentDisposisi.surat_masuk.perihal}"`,
                tipe: 'disposisi',
                referensi_id: reply.id
            }, { transaction });

            // Log aktivitas
            await LogAktivitas.log({
                user_id: userId,
                aksi: 'reply',
                modul: 'disposisi',
                deskripsi: `Membalas disposisi untuk surat "${parentDisposisi.surat_masuk.perihal}"`,
                data_baru: reply.toJSON()
            });

            await transaction.commit();
            return reply;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get disposisi untuk user tertentu
     */
    static async getDisposisiForUser(userId, filters = {}, page = 1, perPage = 20) {
        try {
            const where = {
                kepada_user_id: userId,
                ...filters
            };

            const offset = (page - 1) * perPage;
            
            const { count, rows } = await Disposisi.findAndCountAll({
                where,
                include: [
                    {
                        association: 'surat_masuk',
                        attributes: ['id', 'nomor_surat', 'pengirim', 'perihal', 'nomor_agenda', 'tanggal_surat']
                    },
                    {
                        association: 'dari_user',
                        attributes: ['id', 'nama_lengkap', 'jabatan']
                    }
                ],
                order: [
                    ['sifat', 'DESC'],
                    ['created_at', 'DESC']
                ],
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

    /**
     * Get disposisi statistics
     */
    static async getStatistics(userId = null) {
        try {
            const where = userId ? { kepada_user_id: userId } : {};
            
            const stats = {
                total: await Disposisi.count({ where }),
                per_status: {},
                per_sifat: {},
                belum_dibaca: await Disposisi.count({
                    where: { ...where, status: 'dikirim' }
                }),
                dalam_proses: await Disposisi.count({
                    where: { ...where, status: 'diproses' }
                }),
                selesai: await Disposisi.count({
                    where: { ...where, status: 'selesai' }
                }),
                terlambat: await Disposisi.count({
                    where: {
                        ...where,
                        batas_waktu: { [Op.lt]: new Date() },
                        status: { [Op.ne]: 'selesai' }
                    }
                })
            };

            // Hitung per status
            const statuses = ['draft', 'dikirim', 'dibaca', 'diproses', 'selesai'];
            for (const status of statuses) {
                stats.per_status[status] = await Disposisi.count({
                    where: { ...where, status }
                });
            }

            // Hitung per sifat
            const sifatList = ['biasa', 'segera', 'penting', 'rahasia'];
            for (const sifat of sifatList) {
                stats.per_sifat[sifat] = await Disposisi.count({
                    where: { ...where, sifat }
                });
            }

            return stats;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Batch update disposisi
     */
    static async batchUpdateStatus(ids, status, userId) {
        const transaction = await sequelize.transaction();
        
        try {
            const results = [];
            
            for (const id of ids) {
                try {
                    const disposisi = await this.updateStatusDisposisi(id, status, null, userId);
                    results.push({ id, success: true, data: disposisi });
                } catch (error) {
                    results.push({ id, success: false, error: error.message });
                }
            }

            await transaction.commit();
            return results;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Delete disposisi (soft delete)
     */
    static async deleteDisposisi(id, userId) {
        const transaction = await sequelize.transaction();
        
        try {
            const disposisi = await Disposisi.findByPk(id, {
                include: ['surat_masuk']
            });
            
            if (!disposisi) {
                throw new Error('Disposisi tidak ditemukan');
            }

            // Hanya pembuat disposisi yang bisa menghapus
            if (disposisi.dari_user_id !== userId) {
                throw new Error('Anda tidak berhak menghapus disposisi ini');
            }

            // Hapus semua reply
            await Disposisi.destroy({
                where: { parent_id: id },
                transaction
            });

            // Hapus disposisi
            await disposisi.destroy({ transaction });

            // Log aktivitas
            await LogAktivitas.log({
                user_id: userId,
                aksi: 'delete',
                modul: 'disposisi',
                deskripsi: `Menghapus disposisi untuk surat "${disposisi.surat_masuk.perihal}"`
            });

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = DisposisiService;
