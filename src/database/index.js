const { sequelize } = require('../config/database');

// Import all models
const Role = require('../app/Models/Role');
const Pengguna = require('../app/Models/Pengguna');
const Instansi = require('../app/Models/Instansi');
const Kategori = require('../app/Models/Kategori');
const SuratMasuk = require('../app/Models/SuratMasuk');
const SuratKeluar = require('../app/Models/SuratKeluar');
const Disposisi = require('../app/Models/Disposisi');
const Lampiran = require('../app/Models/Lampiran');
const Notifikasi = require('../app/Models/Notifikasi');
const LogAktivitas = require('../app/Models/LogAktivitas');
const Pengaturan = require('../app/Models/Pengaturan');

// Define all associations
const models = {
    Role,
    Pengguna,
    Instansi,
    Kategori,
    SuratMasuk,
    SuratKeluar,
    Disposisi,
    Lampiran,
    Notifikasi,
    LogAktivitas,
    Pengaturan
};

// Setup associations
Object.values(models).forEach(model => {
    if (model.associate) {
        model.associate(models);
    }
});

// Sync database
async function syncDatabase(force = false) {
    try {
        await sequelize.sync({ force, alter: !force });
        console.log('Database synchronized successfully');
    } catch (error) {
        console.error('Database synchronization failed:', error);
        throw error;
    }
}

module.exports = {
    sequelize,
    models,
    syncDatabase
};
