const Surat = require('../models/Surat');
const { validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');

class SuratController {
  // GET /surat-masuk
  static async indexMasuk(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        tanggal_mulai: req.query.tanggal_mulai,
        tanggal_akhir: req.query.tanggal_akhir,
        kategori_id: req.query.kategori_id,
        status: req.query.status,
        search: req.query.search
      };

      const result = await Surat.getSuratMasuk(page, limit, filters);

      return res.json({
        success: true,
        data: result.results,
        pagination: {
          page: page,
          limit: limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      console.error('Error in indexMasuk:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data surat masuk',
        error: error.message
      });
    }
  }

  // GET /surat-keluar
  static async indexKeluar(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        tanggal_mulai: req.query.tanggal_mulai,
        tanggal_akhir: req.query.tanggal_akhir,
        kategori_id: req.query.kategori_id,
        search: req.query.search
      };

      const result = await Surat.getSuratKeluar(page, limit, filters);

      return res.json({
        success: true,
        data: result.results,
        pagination: {
          page: page,
          limit: limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      console.error('Error in indexKeluar:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data surat keluar',
        error: error.message
      });
    }
  }

  // GET /surat/:id
  static async show(req, res) {
    try {
      const surat = await Surat.query()
        .findById(req.params.id)
        .whereNull('deleted_at')
        .withGraphFetched('[kategori, instansi, pembuat, disposisi.[dari_user, tujuan_user], lampiran]');

      if (!surat) {
        return res.status(404).json({
          success: false,
          message: 'Surat tidak ditemukan'
        });
      }

      return res.json({
        success: true,
        data: surat
      });
    } catch (error) {
      console.error('Error in show:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil detail surat',
        error: error.message
      });
    }
  }

  // POST /surat
  static async store(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({
          success: false,
          message: 'Validasi gagal',
          errors: errors.array()
        });
      }

      const data = {
        ...req.body,
        created_by: req.user.id
      };

      // Generate nomor agenda otomatis
      data.nomor_agenda = await Surat.generateNomorAgenda(data.jenis_surat);

      // Handle file upload
      if (req.file) {
        data.file_path = req.file.path;
        data.file_size = req.file.size;
        data.file_type = req.file.mimetype;
      }

      const surat = await Surat.query().insert(data);

      return res.status(201).json({
        success: true,
        message: 'Surat berhasil dibuat',
        data: surat
      });
    } catch (error) {
      console.error('Error in store:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal membuat surat',
        error: error.message
      });
    }
  }

  // PUT /surat/:id
  static async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({
          success: false,
          message: 'Validasi gagal',
          errors: errors.array()
        });
      }

      const surat = await Surat.query()
        .findById(req.params.id)
        .whereNull('deleted_at');

      if (!surat) {
        return res.status(404).json({
          success: false,
          message: 'Surat tidak ditemukan'
        });
      }

      const updateData = {
        ...req.body,
        updated_by: req.user.id
      };

      // Handle new file upload
      if (req.file) {
        // Delete old file if exists
        if (surat.file_path) {
          await fs.unlink(surat.file_path).catch(() => {});
        }
        
        updateData.file_path = req.file.path;
        updateData.file_size = req.file.size;
        updateData.file_type = req.file.mimetype;
      }

      const updatedSurat = await Surat.query()
        .patchAndFetchById(req.params.id, updateData);

      return res.json({
        success: true,
        message: 'Surat berhasil diupdate',
        data: updatedSurat
      });
    } catch (error) {
      console.error('Error in update:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengupdate surat',
        error: error.message
      });
    }
  }

  // DELETE /surat/:id (Soft Delete)
  static async destroy(req, res) {
    try {
      const surat = await Surat.query()
        .findById(req.params.id)
        .whereNull('deleted_at');

      if (!surat) {
        return res.status(404).json({
          success: false,
          message: 'Surat tidak ditemukan'
        });
      }

      await Surat.softDelete(req.params.id, req.user.id);

      return res.json({
        success: true,
        message: 'Surat berhasil dihapus'
      });
    } catch (error) {
      console.error('Error in destroy:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus surat',
        error: error.message
      });
    }
  }

  // GET /surat/statistik
  static async statistik(req, res) {
    try {
      const tahun = req.query.tahun || new Date().getFullYear();
      const statistik = await Surat.getStatistik(tahun);

      return res.json({
        success: true,
        data: statistik
      });
    } catch (error) {
      console.error('Error in statistik:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil statistik',
        error: error.message
      });
    }
  }

  // GET /surat/search
  static async search(req, res) {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Parameter pencarian diperlukan'
        });
      }

      const results = await Surat.query()
        .whereNull('deleted_at')
        .where(function() {
          this.where('nomor_surat', 'like', `%${q}%`)
              .orWhere('perihal', 'like', `%${q}%`)
              .orWhere('pengirim', 'like', `%${q}%`)
              .orWhere('penerima', 'like', `%${q}%`)
              .orWhere('isi_ringkasan', 'like', `%${q}%`)
              .orWhere('nomor_agenda', 'like', `%${q}%`);
        })
        .withGraphFetched('[kategori, instansi]')
        .orderBy('tanggal_surat', 'desc')
        .limit(50);

      return res.json({
        success: true,
        data: results,
        total: results.length
      });
    } catch (error) {
      console.error('Error in search:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal melakukan pencarian',
        error: error.message
      });
    }
  }
}

module.exports = SuratController;
