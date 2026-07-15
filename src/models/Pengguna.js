const { Model } = require('objection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class Pengguna extends Model {
  static get tableName() {
    return 'pengguna';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['nama_lengkap', 'email', 'password', 'role_id'],
      properties: {
        id: { type: 'integer' },
        nama_lengkap: { type: 'string', minLength: 1, maxLength: 100 },
        email: { 
          type: 'string', 
          format: 'email',
          minLength: 1,
          maxLength: 100 
        },
        password: { type: 'string', minLength: 6 },
        role_id: { type: 'integer' },
        instansi_id: { type: ['integer', 'null'] },
        nip: { type: ['string', 'null'], maxLength: 50 },
        jabatan: { type: ['string', 'null'], maxLength: 100 },
        no_telp: { type: ['string', 'null'], maxLength: 20 },
        foto: { type: ['string', 'null'] },
        is_active: { type: 'boolean', default: true },
        last_login: { type: ['string', 'null'] },
        refresh_token: { type: ['string', 'null'] },
        reset_password_token: { type: ['string', 'null'] },
        reset_password_expires: { type: ['string', 'null'] },
        created_at: { type: 'string' },
        updated_at: { type: 'string' },
        deleted_at: { type: ['string', 'null'] }
      }
    };
  }

  static get relationMappings() {
    const Role = require('./Role');
    const Instansi = require('./Instansi');
    const Surat = require('./Surat');
    const Disposisi = require('./Disposisi');

    return {
      role: {
        relation: Model.BelongsToOneRelation,
        modelClass: Role,
        join: {
          from: 'pengguna.role_id',
          to: 'roles.id'
        }
      },
      instansi: {
        relation: Model.BelongsToOneRelation,
        modelClass: Instansi,
        join: {
          from: 'pengguna.instansi_id',
          to: 'instansi.id'
        }
      },
      surat_dibuat: {
        relation: Model.HasManyRelation,
        modelClass: Surat,
        join: {
          from: 'pengguna.id',
          to: 'surat.created_by'
        }
      },
      disposisi_diterima: {
        relation: Model.HasManyRelation,
        modelClass: Disposisi,
        join: {
          from: 'pengguna.id',
          to: 'disposisi.tujuan_user_id'
        }
      }
    };
  }

  // Hooks
  async $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
    
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async $beforeUpdate() {
    this.updated_at = new Date().toISOString();
    
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  // Custom Methods
  async verifyPassword(password) {
    return bcrypt.compare(password, this.password);
  }

  generateAuthToken() {
    const payload = {
      id: this.id,
      email: this.email,
      role: this.role_id
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY || '24h'
    });
  }

  generateRefreshToken() {
    return jwt.sign(
      { id: this.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  toPublicJSON() {
    return {
      id: this.id,
      nama_lengkap: this.nama_lengkap,
      email: this.email,
      nip: this.nip,
      jabatan: this.jabatan,
      role: this.role,
      instansi: this.instansi,
      foto: this.foto,
      last_login: this.last_login
    };
  }

  // Static Methods
  static async findByEmail(email) {
    return this.query()
      .where('email', email)
      .whereNull('deleted_at')
      .withGraphFetched('[role, instansi]')
      .first();
  }

  static async getAktif(page = 1, limit = 10) {
    return this.query()
      .where('is_active', true)
      .whereNull('deleted_at')
      .withGraphFetched('[role, instansi]')
      .orderBy('nama_lengkap')
      .page(page - 1, limit);
  }

  static async updateLastLogin(id) {
    return this.query()
      .patch({ last_login: new Date().toISOString() })
      .where('id', id);
  }
}

module.exports = Pengguna;
