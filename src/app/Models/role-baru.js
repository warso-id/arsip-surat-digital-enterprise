const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Role = sequelize.define('Role', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nama_role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [2, 50]
        }
    },
    deskripsi: {
        type: DataTypes.TEXT,
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
    tableName: 'roles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Instance methods
Role.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.created_at;
    delete values.updated_at;
    return values;
};

module.exports = Role;
