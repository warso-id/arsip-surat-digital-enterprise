const { Model } = require('objection');

class Instansi extends Model {
  static get tableName() {
    return 'instansi';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['nama', 'kode'],
      properties: {
        id: { type: 'integer' },
        nama: { type: 'string', minLength: 1, maxLength: 200 },
        kode: { type: 'string', minLength: 1, maxLength: 20 },
        alamat: { type: ['string', 'null'], maxLength: 500 },
        kota: { type: ['string', 'null'], maxLength: 100 },
        provinsi: { type: ['string', 'null'], maxLength: 100 },
        kode_pos: { type: ['string', 'null'], maxLength: 10 },
        no_telp: { type: ['string', 'null'], maxLength: 20 },
        email: { 
          type: ['string', 'null'], 
          format: 'email',
          maxLength: 100 
        },
        website: { type: ['string', 'null'], maxLength: 100 },
        logo: { type: ['string', 'null'] },
        is_active: { type: 'boolean', default: true },
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
        relation: Model.HasManyRelation,
        modelClass: Surat,
        join: {
          from: 'instansi.id',
          to: 'surat.instansi_id'
        }
      },
      pengguna: {
        relation: Model.HasManyRelation,
        modelClass: Pengguna,
        join: {
          from: 'instansi.id',
          to: 'pengguna.instansi_id'
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

  static async getAktif() {
    return this.query()
      .where('is_active', true)
      .orderBy('nama');
  }

  static async getWithStats() {
    return this.query()
      .select('instansi.*')
      .select(
        Instansi.relatedQuery('surat').count().as('total_surat')
      )
      .select(
        Instansi.relatedQuery('pengguna').count().as('total_pengguna')
      )
      .where('instansi.is_active', true)
      .orderBy('instansi.nama');
  }
}

module.exports = Instansi;
