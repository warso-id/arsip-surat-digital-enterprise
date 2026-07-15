const { Model } = require('objection');

class Disposisi extends Model {
  static get tableName() {
    return 'disposisi';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['surat_id', 'dari_user_id', 'tujuan_user_id', 'instruksi'],
      properties: {
        id: { type: 'integer' },
        surat_id: { type: 'integer' },
        dari_user_id: { type: 'integer' },
        tujuan_user_id: { type: 'integer' },
        instruksi: { type: 'string', minLength: 1, maxLength: 1000 },
        catatan: { type: ['string', 'null'], maxLength: 500 },
        status: {
          type: 'string',
          enum: ['pending', 'diterima', 'diproses', 'selesai', 'ditolak'],
          default: 'pending'
        },
        tanggal_disposisi: { type: 'string', format: 'date-time' },
        tanggal_batas: { type: ['string', 'null'], format: 'date' },
        tanggal_selesai: { type: ['string', 'null'], format: 'date-time' },
        prioritas: {
          type: 'string',
          enum: ['rendah', 'sedang', 'tinggi', 'mendesak'],
          default: 'sedang'
        },
        is_read: { type: 'boolean', default: false },
        created_at: { type: 'string' },
        updated_at: { type: 'string' }
      }
    };
  }

  static get relationMappings() {
    const Surat = require('./Surat');
    const Pengguna = require('./Pengguna');

    return {
      surat: {
        relation: Model.BelongsToOneRelation,
        modelClass: Surat,
        join: {
          from: 'disposisi.surat_id',
          to: 'surat.id'
        }
      },
      dari_user: {
        relation: Model.BelongsToOneRelation,
        modelClass: Pengguna,
        join: {
          from: 'disposisi.dari_user_id',
          to: 'pengguna.id'
        }
      },
      tujuan_user: {
        relation: Model.BelongsToOneRelation,
        modelClass: Pengguna,
        join: {
          from: 'disposisi.tujuan_user_id',
          to: 'pengguna.id'
        }
      }
    };
  }

  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
    this.tanggal_disposisi = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }

  static async getDisposisiByUser(userId, page = 1, limit = 10) {
    return this.query()
      .where('tujuan_user_id', userId)
      .withGraphFetched('[surat, dari_user, tujuan_user]')
      .orderBy('created_at', 'desc')
      .page(page - 1, limit);
  }

  static async getDisposisiBySurat(suratId) {
    return this.query()
      .where('surat_id', suratId)
      .withGraphFetched('[dari_user, tujuan_user]')
      .orderBy('created_at', 'desc');
  }

  static async updateStatus(id, status, userId) {
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'selesai') {
      updateData.tanggal_selesai = new Date().toISOString();
    }

    return this.query()
      .patch(updateData)
      .where('id', id)
      .where('tujuan_user_id', userId);
  }
}

module.exports = Disposisi;
