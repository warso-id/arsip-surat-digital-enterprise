const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const bcrypt = require('bcryptjs');
const Role = require('./Role');

const Pengguna = sequelize.define('Pengguna', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Role,
            key: 'id'
        }
    },
    nama_lengkap: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [3, 100]
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            notEmpty: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [6, 255]
        }
    },
    nip: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
    },
    jabatan: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    no_telp: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
            is: /^[0-9+\-\s()]+$/
        }
    },
    foto: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('aktif', 'nonaktif'),
        defaultValue: 'aktif'
    },
    last_login: {
        type: DataTypes.DATE,
        allowNull: true
    },
    reset_token: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    reset_token_expires: {
        type: DataTypes.DATE,
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
    tableName: 'pengguna',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, 12);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 12);
            }
        }
    }
});

// Instance methods
Pengguna.prototype.verifyPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

Pengguna.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    delete values.reset_token;
    delete values.reset_token_expires;
    return values;
};

// Class methods
Pengguna.findByEmail = function(email) {
    return this.findOne({ where: { email } });
};

Pengguna.findByNIP = function(nip) {
    return this.findOne({ where: { nip } });
};

// Associations
Pengguna.belongsTo(Role, {
    foreignKey: 'role_id',
    as: 'role'
});

module.exports = Pengguna;
