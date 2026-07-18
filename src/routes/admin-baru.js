const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../app/Http/Middleware/AuthMiddleware');
const RoleMiddleware = require('../app/Http/Middleware/RoleMiddleware');
const BackupService = require('../app/Services/BackupService');
const ResponseHelper = require('../app/Helpers/ResponseHelper');

// Apply auth and admin middleware
router.use(AuthMiddleware.authenticate);
router.use(RoleMiddleware.isAdmin);

/**
 * Backup routes
 */
router.get('/backup/list', async (req, res) => {
    try {
        const backups = await BackupService.listBackups();
        return ResponseHelper.success(res, 'Daftar backup', backups);
    } catch (error) {
        return ResponseHelper.error(res, error.message);
    }
});

router.post('/backup/create', async (req, res) => {
    try {
        const backupFile = await BackupService.createFullBackup();
        return ResponseHelper.success(res, 'Backup berhasil dibuat', { file: backupFile });
    } catch (error) {
        return ResponseHelper.error(res, error.message);
    }
});

router.get('/backup/download/:filename', async (req, res) => {
    try {
        const path = require('path');
        const filePath = path.join(process.env.BACKUP_PATH || './backups', req.params.filename);
        return res.download(filePath);
    } catch (error) {
        return ResponseHelper.error(res, 'File tidak ditemukan', 404);
    }
});

router.post('/backup/restore/:filename', async (req, res) => {
    try {
        const path = require('path');
        const filePath = path.join(process.env.BACKUP_PATH || './backups', req.params.filename);
        await BackupService.restoreDatabase(filePath);
        return ResponseHelper.success(res, 'Restore berhasil');
    } catch (error) {
        return ResponseHelper.error(res, error.message);
    }
});

/**
 * System routes
 */
router.get('/system/info', async (req, res) => {
    const os = require('os');
    
    const info = {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        memory: {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem()
        },
        uptime: os.uptime(),
        nodeVersion: process.version,
        processUptime: process.uptime(),
        processMemory: process.memoryUsage()
    };
    
    return ResponseHelper.success(res, 'System info', info);
});

router.get('/system/logs', async (req, res) => {
    try {
        const fs = require('fs').promises;
        const path = require('path');
        const logFile = path.join(__dirname, '../../storage/logs/combined.log');
        
        const content = await fs.readFile(logFile, 'utf8');
        const lines = content.split('\n').filter(Boolean).slice(-100);
        
        return ResponseHelper.success(res, 'Logs', lines);
    } catch (error) {
        return ResponseHelper.error(res, error.message);
    }
});

/**
 * Cache management
 */
router.post('/cache/clear', async (req, res) => {
    try {
        // Clear application cache if using Redis
        if (process.env.CACHE_DRIVER === 'redis') {
            const redis = require('redis').createClient({
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                password: process.env.REDIS_PASSWORD
            });
            await redis.connect();
            await redis.flushAll();
            await redis.quit();
        }
        
        return ResponseHelper.success(res, 'Cache berhasil dibersihkan');
    } catch (error) {
        return ResponseHelper.error(res, error.message);
    }
});

module.exports = router;
