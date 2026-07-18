const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Instansi = require('./Instansi');
const Kategori = require('./Kategori');
const Pengguna = require('./Pengguna');

const SuratMasuk = sequelize.define('SuratMasuk', {
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
    pengirim: {
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
    tanggal_terima: {
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
        type: DataTypes.ENUM('draft', 'diterima', 'didisposisikan', 'selesai', 'arsip'),
        defaultValue: 'diterima'
    },
    nomor_agenda: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
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
    tableName: 'surat_masuk',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true
});

// Associations
SuratMasuk.belongsTo(Instansi, {
    foreignKey: 'instansi_id',
    as: 'instansi'
});

SuratMasuk.belongsTo(Kategori, {
    foreignKey: 'kategori_id',
    as: 'kategori'
});

SuratMasuk.belongsTo(Pengguna, {
    foreignKey: 'created_by',
    as: 'creator'
});

SuratMasuk.belongsTo(Pengguna, {
    foreignKey: 'updated_by',
    as: 'updater'
});

module.exports = SuratMasuk;
