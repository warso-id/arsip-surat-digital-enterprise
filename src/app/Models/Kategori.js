const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Kategori = sequelize.define('Kategori', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nama_kategori: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [3, 100]
        }
    },
    kode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
        validate: {
            len: [1, 20]
        }
    },
    deskripsi: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'kategori',
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
    tableName: 'kategori',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Self-referential association
Kategori.belongsTo(Kategori, {
    foreignKey: 'parent_id',
    as: 'parent'
});

Kategori.hasMany(Kategori, {
    foreignKey: 'parent_id',
    as: 'children'
});

module.exports = Kategori;
