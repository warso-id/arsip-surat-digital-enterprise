const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Pengguna = require('./Pengguna');

const Notifikasi = sequelize.define('Notifikasi', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Pengguna,
            key: 'id'
        }
    },
    judul: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    pesan: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    tipe: {
        type: DataTypes.ENUM('disposisi', 'surat_masuk', 'surat_keluar', 'sistem'),
        defaultValue: 'sistem'
    },
    referensi_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    read_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'notifikasi',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

// Associations
Notifikasi.belongsTo(Pengguna, {
    foreignKey: 'user_id',
    as: 'user'
});

// Instance methods
Notifikasi.prototype.markAsRead = async function() {
    this.is_read = true;
    this.read_at = new Date();
    return await this.save();
};

// Static methods
Notifikasi.getUnreadCount = async function(userId) {
    return await this.count({
        where: {
            user_id: userId,
            is_read: false
        }
    });
};

module.exports = Notifikasi;
