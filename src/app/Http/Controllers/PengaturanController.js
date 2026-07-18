const Pengaturan = require('../../Models/Pengaturan');
const ResponseHelper = require('../../Helpers/ResponseHelper');
const LogAktivitas = require('../../Models/LogAktivitas');

class PengaturanController {
    /**
     * Get all settings
     */
    static async index(req, res) {
        try {
            const settings = await Pengaturan.findAll({
                order: [['key', 'ASC']]
            });

            // Convert to key-value object
            const settingsObj = {};
            settings.forEach(setting => {
                settingsObj[setting.key] = setting.value;
            });

            return ResponseHelper.success(res, 'Data pengaturan berhasil diambil', settingsObj);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Get specific setting
     */
    static async show(req, res) {
        try {
            const { key } = req.params;
            const setting = await Pengaturan.findOne({ where: { key } });

            if (!setting) {
                return ResponseHelper.error(res, 'Pengaturan tidak ditemukan', 404);
            }

            return ResponseHelper.success(res, 'Data pengaturan berhasil diambil', {
                [setting.key]: setting.value
            });
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Update settings
     */
    static async update(req, res) {
        try {
            const settings = req.body;
            const results = [];

            for (const [key, value] of Object.entries(settings)) {
                const setting = await Pengaturan.findOne({ where: { key } });
                
                if (setting) {
                    const oldValue = setting.value;
                    await setting.update({ value });
                    
                    results.push({
                        key,
                        old_value: oldValue,
                        new_value: value,
                        updated: true
                    });
                } else {
                    // Create new setting if not exists
                    await Pengaturan.create({
                        key,
                        value,
                        deskripsi: `Pengaturan ${key}`
                    });
                    
                    results.push({
                        key,
                        old_value: null,
                        new_value: value,
                        updated: false,
                        created: true
                    });
                }
            }

            // Log activity
            await LogAktivitas.log({
                user_id: req.user.id,
                aksi: 'update',
                modul: 'pengaturan',
                deskripsi: 'Mengupdate pengaturan sistem',
                data_baru: settings
            });

            return ResponseHelper.success(res, 'Pengaturan berhasil diupdate', results);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Get app info
     */
    static async appInfo(req, res) {
        try {
            const appName = await Pengaturan.get('app_name', 'Arsip Surat Digital');
            const appDesc = await Pengaturan.get('app_description', 'Sistem Manajemen Arsip Surat');
            const version = require('../../../package.json').version;

            return ResponseHelper.success(res, 'Informasi aplikasi', {
                name: appName,
                description: appDesc,
                version: version,
                environment: process.env.NODE_ENV || 'development',
                node_version: process.version
            });
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }
}

module.exports = PengaturanController;
