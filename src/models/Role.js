const { Model } = require('objection');

class Role extends Model {
  static get tableName() {
    return 'roles';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['nama', 'slug'],
      properties: {
        id: { type: 'integer' },
        nama: { type: 'string', minLength: 1, maxLength: 50 },
        slug: { type: 'string', minLength: 1, maxLength: 50 },
        deskripsi: { type: ['string', 'null'], maxLength: 255 },
        permissions: { type: ['object', 'null'] },
        is_active: { type: 'boolean', default: true },
        created_at: { type: 'string' },
        updated_at: { type: 'string' }
      }
    };
  }

  static get relationMappings() {
    const Pengguna = require('./Pengguna');

    return {
      pengguna: {
        relation: Model.HasManyRelation,
        modelClass: Pengguna,
        join: {
          from: 'roles.id',
          to: 'pengguna.role_id'
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

  static async getDefaultPermissions(roleSlug) {
    const permissions = {
      'super-admin': {
        surat: ['create', 'read', 'update', 'delete'],
        disposisi: ['create', 'read', 'update', 'delete'],
        pengguna: ['create', 'read', 'update', 'delete'],
        laporan: ['read', 'export'],
        pengaturan: ['read', 'update']
      },
      'admin': {
        surat: ['create', 'read', 'update'],
        disposisi: ['create', 'read', 'update'],
        pengguna: ['read'],
        laporan: ['read', 'export'],
        pengaturan: ['read']
      },
      'staff': {
        surat: ['create', 'read'],
        disposisi: ['read'],
        pengguna: ['read'],
        laporan: ['read'],
        pengaturan: []
      }
    };

    return permissions[roleSlug] || {};
  }
}

module.exports = Role;
