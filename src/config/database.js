require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_DATABASE || 'arsip_surat',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    logging: process.env.APP_ENV === 'development' ? console.log : false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    },
    dialectOptions: {
        charset: 'utf8mb4',
        dateStrings: true,
        typeCast: true,
        connectTimeout: 60000
    },
    timezone: '+07:00',
    retry: {
        max: 3
    }
});

// Test connection
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

module.exports = {
    sequelize,
    testConnection,
    Sequelize
};
