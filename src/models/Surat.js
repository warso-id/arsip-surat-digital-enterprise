const { Model } = require('objection');
const Knex = require('knex');
const knexConfig = require('../../config/database');
const knex = Knex(knexConfig);

Model.knex(knex);

class Surat extends Model {
  static get tableName() {
    return 'surat';
  }

  static get idColumn() {
    return 'id';
  }

  // JSON Schema for validation
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['nomor_surat', 'jenis_surat', 'perihal', 'tanggal_surat'],
      properties: {
        id: { type: 'integer' },
        nomor_surat: { type: 'string', minLength: 1, maxLength: 100 },
        jenis_surat: { 
          type: 'string', 
          enum: ['masuk', 'keluar'] 
        },
        perihal: { type: 'string', minLength: 1, maxLength: 500 },
        tanggal_surat: { type: 'string', format: 'date' },
        tanggal_terima: { type: ['string', 'null'], format: 'date' },
        pengirim: { type: 'string', maxLength: 255 },
        penerima: { type: 'string', maxLength: 255 },
        kategori_id: { type: ['integer', 'null'] },
        instansi_id: { type: ['integer', 'null'] },
        sifat_surat: {
          type: 'string',
          enum: ['biasa', 'segera', 'penting', 'rahasia'],
          default: 'biasa'
        },
        status: {
          type: 'string',
          enum: ['draft', 'proses', 'selesai', 'arsip'],
          default: 'draft'
        },
        isi_ringkasan: { type: 'string', maxLength: 1000 },
        file_path: { type: ['string', 'null'] },
        file_size: { type: ['integer', 'null'] },
        file_type: { type: ['string', 'null'] },
        nomor_agenda: { type: ['string', 'null'], maxLength: 50 },
        kode_klasifikasi: { type: ['string', 'null'], maxLength: 50 },
        created_by: { type: 'integer' },
        updated_by: { type: ['integer', 'null'] },
        created_at: { type: 'string' },
        updated_at: { type: 'string' },
        deleted_at: { type: ['string', 'null'] }
      }
    };
  }

  // Relations
  static get relationMappings() {
    const Kategori = require('./Kategori');
    const Instansi = require('./Instansi');
    const Pengguna = require('./Pengguna');
    const Disposisi = require('./Disposisi');
    const Lampiran = require('./Lampiran');

    return {
      kategori: {
        relation: Model.BelongsToOneRelation,
        modelClass: Kategori,
        join: {
          from: 'surat.kategori_id',
          to: 'kategori.id'
        }
      },
      instansi: {
        relation: Model.BelongsToOneRelation,
        modelClass: Instansi,
        join: {
          from: 'surat.instansi_id',
          to: 'instansi.id'
        }
      },
      pembuat: {
        relation: Model.BelongsToOneRelation,
        modelClass: Pengguna,
        join: {
          from: 'surat.created_by',
          to: 'pengguna.id'
        }
      },
      disposisi: {
        relation: Model.HasManyRelation,
        modelClass: Disposisi,
        join: {
          from: 'surat.id',
          to: 'disposisi.surat_id'
        }
      },
      lampiran: {
        relation: Model.HasManyRelation,
        modelClass: Lampiran,
        join: {
          from: 'surat.id',
          to: 'lampiran.surat_id'
        }
      }
    };
  }

  // Hooks
  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }

  // Custom Query Methods
  static async getSuratMasuk(page = 1, limit = 10, filters = {}) {
    const query = this.query()
      .where('jenis_surat', 'masuk')
      .whereNull('deleted_at')
      .withGraphFetched('[kategori, instansi, pembuat]');

    if (filters.tanggal_mulai) {
      query.where('tanggal_surat', '>=', filters.tanggal_mulai);
    }
    if (filters.tanggal_akhir) {
      query.where('tanggal_surat', '<=', filters.tanggal_akhir);
    }
    if (filters.kategori_id) {
      query.where('kategori_id', filters.kategori_id);
    }
    if (filters.status) {
      query.where('status', filters.status);
    }
    if (filters.search) {
      query.where(function() {
        this.where('nomor_surat', 'like', `%${filters.search}%`)
            .orWhere('perihal', 'like', `%${filters.search}%`)
            .orWhere('pengirim', 'like', `%${filters.search}%`);
      });
    }

    return query.orderBy('tanggal_surat', 'desc').page(page - 1, limit);
  }

  static async getSuratKeluar(page = 1, limit = 10, filters = {}) {
    const query = this.query()
      .where('jenis_surat', 'keluar')
      .whereNull('deleted_at')
      .withGraphFetched('[kategori, instansi, pembuat]');

    if (filters.tanggal_mulai) {
      query.where('tanggal_surat', '>=', filters.tanggal_mulai);
    }
    if (filters.tanggal_akhir) {
      query.where('tanggal_surat', '<=', filters.tanggal_akhir);
    }
    if (filters.kategori_id) {
      query.where('kategori_id', filters.kategori_id);
    }
    if (filters.search) {
      query.where(function() {
        this.where('nomor_surat', 'like', `%${filters.search}%`)
            .orWhere('perihal', 'like', `%${filters.search}%`);
      });
    }

    return query.orderBy('tanggal_surat', 'desc').page(page - 1, limit);
  }

  static async getStatistik(tahun = null) {
    const query = this.query();
    
    if (tahun) {
      query.whereRaw('strftime("%Y", tanggal_surat) = ?', [tahun.toString()]);
    }

    return {
      total_surat_masuk: await query.clone().where('jenis_surat', 'masuk').count(),
      total_surat_keluar: await query.clone().where('jenis_surat', 'keluar').count(),
      per_bulan: await query.clone()
        .select(knex.raw('strftime("%m", tanggal_surat) as bulan'))
        .select(knex.raw('jenis_surat'))
        .count()
        .groupBy('bulan', 'jenis_surat')
        .orderBy('bulan'),
      per_kategori: await query.clone()
        .join('kategori', 'surat.kategori_id', 'kategori.id')
        .select('kategori.nama')
        .count()
        .groupBy('kategori.nama'),
      per_status: await query.clone()
        .select('status')
        .count()
        .groupBy('status')
    };
  }

  // Soft delete
  static async softDelete(id, userId) {
    return this.query()
      .patch({
        deleted_at: new Date().toISOString(),
        updated_by: userId
      })
      .where('id', id);
  }

  // Generate nomor agenda otomatis
  static async generateNomorAgenda(jenis) {
    const prefix = jenis === 'masuk' ? 'SM' : 'SK';
    const year = new Date().getFullYear();
    const count = await this.query()
      .where('jenis_surat', jenis)
      .whereRaw('strftime("%Y", created_at) = ?', [year.toString()])
      .count();
    
    const nextNumber = (parseInt(count[0]['count(*)']) + 1).toString().padStart(4, '0');
    return `${prefix}/${nextNumber}/${year}`;
  }
}

module.exports = Surat;
