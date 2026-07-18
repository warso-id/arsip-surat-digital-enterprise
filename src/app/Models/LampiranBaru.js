const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const SuratMasuk = require('./SuratMasuk');
const SuratKeluar = require('./SuratKeluar');
const Pengguna = require('./Pengguna');

const Lampiran = sequelize.define('Lampiran', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    surat_masuk_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: SuratMasuk,
            key: 'id'
        }
    },
    surat_keluar_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: SuratKeluar,
            key: 'id'
        }
    },
    nama_file: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    file_path: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    file_size: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    file_type: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    uploaded_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Pengguna,
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
    tableName: 'lampiran',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    validate: {
        mustHaveOneSurat() {
            if (!this.surat_masuk_id && !this.surat_keluar_id) {
                throw new Error('Lampiran harus terkait dengan surat masuk atau surat keluar');
            }
        }
    }
});

// Associations
Lampiran.belongsTo(SuratMasuk, {
    foreignKey: 'surat_masuk_id',
    as: 'surat_masuk'
});

Lampiran.belongsTo(SuratKeluar, {
    foreignKey: 'surat_keluar_id',
    as: 'surat_keluar'
});

Lampiran.belongsTo(Pengguna, {
    foreignKey: 'uploaded_by',
    as: 'uploader'
});

module.exports = Lampiran;
