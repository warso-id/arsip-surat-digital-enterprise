const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const SuratMasuk = require('./SuratMasuk');
const Pengguna = require('./Pengguna');

const Disposisi = sequelize.define('Disposisi', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    surat_masuk_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: SuratMasuk,
            key: 'id'
        }
    },
    dari_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Pengguna,
            key: 'id'
        }
    },
    kepada_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Pengguna,
            key: 'id'
        }
    },
    instruksi: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    batas_waktu: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isDate: true
        }
    },
    sifat: {
        type: DataTypes.ENUM('biasa', 'segera', 'penting', 'rahasia'),
        defaultValue: 'biasa'
    },
    status: {
        type: DataTypes.ENUM('draft', 'dikirim', 'dibaca', 'diproses', 'selesai'),
        defaultValue: 'draft'
    },
    catatan: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'disposisi',
            key: 'id'
        }
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'disposisi',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Associations
Disposisi.belongsTo(SuratMasuk, {
    foreignKey: 'surat_masuk_id',
    as: 'surat_masuk'
});

Disposisi.belongsTo(Pengguna, {
    foreignKey: 'dari_user_id',
    as: 'dari_user'
});

Disposisi.belongsTo(Pengguna, {
    foreignKey: 'kepada_user_id',
    as: 'kepada_user'
});

Disposisi.belongsTo(Disposisi, {
    foreignKey: 'parent_id',
    as: 'parent'
});

Disposisi.hasMany(Disposisi, {
    foreignKey: 'parent_id',
    as: 'replies'
});

module.exports = Disposisi;
