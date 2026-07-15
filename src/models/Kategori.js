const { Model } = require('objection');

class Kategori extends Model {
  static get tableName() {
    return 'kategori';
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
        nama: { type: 'string', minLength: 1, maxLength: 100 },
        kode: { type: 'string', minLength: 1, maxLength: 20 },
        deskripsi: { type: ['string', 'null'], maxLength: 255 },
        parent_id: { type: ['integer', 'null'] },
        level: { type: 'integer', default: 0 },
        is_active: { type: 'boolean', default: true },
        created_at: { type: 'string' },
        updated_at: { type: 'string' }
      }
    };
  }

  static get relationMappings() {
    const Surat = require('./Surat');

    return {
      surat: {
        relation: Model.HasManyRelation,
        modelClass: Surat,
        join: {
          from: 'kategori.id',
          to: 'surat.kategori_id'
        }
      },
      children: {
        relation: Model.HasManyRelation,
        modelClass: Kategori,
        join: {
          from: 'kategori.id',
          to: 'kategori.parent_id'
        }
      },
      parent: {
        relation: Model.BelongsToOneRelation,
        modelClass: Kategori,
        join: {
          from: 'kategori.parent_id',
          to: 'kategori.id'
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

  static async getTree() {
    const categories = await this.query()
      .where('is_active', true)
      .orderBy('level')
      .orderBy('nama');
    
    return buildTree(categories);
  }

  static async getWithSuratCount() {
    return this.query()
      .select('kategori.*')
      .count('surat.id as total_surat')
      .leftJoin('surat', 'kategori.id', 'surat.kategori_id')
      .where('kategori.is_active', true)
      .groupBy('kategori.id')
      .orderBy('kategori.nama');
  }
}

function buildTree(items, parentId = null) {
  return items
    .filter(item => item.parent_id === parentId)
    .map(item => ({
      ...item,
      children: buildTree(items, item.id)
    }));
}

module.exports = Kategori;
