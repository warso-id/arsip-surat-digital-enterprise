const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Instansi = sequelize.define('Instansi', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nama_instansi: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [3, 200]
        }
    },
    alamat: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    kode_pos: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
            is: /^[0-9]{5}$/
        }
    },
    telepon: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
            is: /^[0-9+\-\s()]+$/
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    website: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isUrl: true
        }
    },
    logo: {
        type: DataTypes.STRING(255),
        allowNull: true
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
    tableName: 'instansi',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Instansi;
