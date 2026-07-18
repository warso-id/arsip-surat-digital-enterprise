const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Instansi = require('./Instansi');
const Kategori = require('./Kategori');
const Pengguna = require('./Pengguna');

const SuratKeluar = sequelize.define('SuratKeluar', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nomor_surat: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    tujuan: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    instansi_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Instansi,
            key: 'id'
        }
    },
    tanggal_surat: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: true
        }
    },
    perihal: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    isi_ringkas: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    kategori_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Kategori,
            key: 'id'
        }
    },
    sifat: {
        type: DataTypes.ENUM('biasa', 'segera', 'penting', 'rahasia'),
        defaultValue: 'biasa'
    },
    status: {
        type: DataTypes.ENUM('draft', 'dikirim', 'selesai', 'arsip'),
        defaultValue: 'draft'
    },
    file_path: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    file_name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    file_size: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    penandatangan: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Pengguna,
            key: 'id'
        }
    },
    updated_by: {
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
    },
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'surat_keluar',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true
});

// Associations
SuratKeluar.belongsTo(Instansi, {
    foreignKey: 'instansi_id',
    as: 'instansi'
});

SuratKeluar.belongsTo(Kategori, {
    foreignKey: 'kategori_id',
    as: 'kategori'
});

SuratKeluar.belongsTo(Pengguna, {
    foreignKey: 'created_by',
    as: 'creator'
});

SuratKeluar.belongsTo(Pengguna, {
    foreignKey: 'updated_by',
    as: 'updater'
});

module.exports = SuratKeluar;
