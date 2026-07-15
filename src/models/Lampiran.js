const { Model } = require('objection');

class Lampiran extends Model {
  static get tableName() {
    return 'lampiran';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['surat_id', 'nama_file', 'file_path', 'file_size', 'file_type'],
      properties: {
        id: { type: 'integer' },
        surat_id: { type: 'integer' },
        nama_file: { type: 'string', minLength: 1, maxLength: 255 },
        nama_asli: { type: 'string', minLength: 1, maxLength: 255 },
        file_path: { type: 'string', minLength: 1 },
        file_size: { type: 'integer' },
        file_type: { type: 'string', maxLength: 50 },
        mime_type: { type: 'string', maxLength: 100 },
        deskripsi: { type: ['string', 'null'], maxLength: 255 },
        uploaded_by: { type: 'integer' },
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
          from: 'lampiran.surat_id',
          to: 'surat.id'
        }
      },
      uploader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Pengguna,
        join: {
          from: 'lampiran.uploaded_by',
          to: 'pengguna.id'
        }
      }
    };
  }

  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }

  static async getBySurat(suratId) {
    return this.query()
      .where('surat_id', suratId)
      .orderBy('created_at', 'desc');
  }

  static async getTotalSize(suratId) {
    const result = await this.query()
      .where('surat_id', suratId)
      .sum('file_size as total')
      .first();
    
    return result.total || 0;
  }
}

module.exports = Lampiran;
