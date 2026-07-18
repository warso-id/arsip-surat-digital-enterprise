const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Pengaturan = sequelize.define('Pengaturan', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
        }
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    deskripsi: {
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
    tableName: 'pengaturan',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Static methods
Pengaturan.get = async function(key, defaultValue = null) {
    const setting = await this.findOne({ where: { key } });
    return setting ? setting.value : defaultValue;
};

Pengaturan.set = async function(key, value, deskripsi = null) {
    const [setting, created] = await this.findOrCreate({
        where: { key },
        defaults: { key, value, deskripsi }
    });
    
    if (!created) {
        setting.value = value;
        if (deskripsi) setting.deskripsi = deskripsi;
        await setting.save();
    }
    
    return setting;
};

module.exports = Pengaturan;
