const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Pengguna = require('./Pengguna');

const LogAktivitas = sequelize.define('LogAktivitas', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Pengguna,
            key: 'id'
        }
    },
    aksi: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    modul: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    deskripsi: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
        validate: {
            isIP: true
        }
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    data_lama: {
        type: DataTypes.JSON,
        allowNull: true
    },
    data_baru: {
        type: DataTypes.JSON,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'log_aktivitas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

// Associations
LogAktivitas.belongsTo(Pengguna, {
    foreignKey: 'user_id',
    as: 'user'
});

// Static methods
LogAktivitas.log = async function(data) {
    try {
        return await this.create(data);
    } catch (error) {
        console.error('Error logging activity:', error);
        return null;
    }
};

module.exports = LogAktivitas;
