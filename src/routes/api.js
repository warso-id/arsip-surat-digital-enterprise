// ==================== API ROUTES ====================
// Arsip Surat Digital Enterprise

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');

// Controllers
const AuthController = require('../app/Http/Controllers/AuthController');
const SuratMasukController = require('../app/Http/Controllers/SuratMasukController');
const SuratKeluarController = require('../app/Http/Controllers/SuratKeluarController');
const DisposisiController = require('../app/Http/Controllers/DisposisiController');
const DashboardController = require('../app/Http/Controllers/DashboardController');
const LaporanController = require('../app/Http/Controllers/LaporanController');
const PenggunaController = require('../app/Http/Controllers/PenggunaController');
const InstansiController = require('../app/Http/Controllers/InstansiController');
const KategoriController = require('../app/Http/Controllers/KategoriController');
const NotifikasiController = require('../app/Http/Controllers/NotifikasiController');
const PencarianController = require('../app/Http/Controllers/PencarianController');

// Middleware
const AuthMiddleware = require('../app/Http/Middleware/AuthMiddleware');
const RoleMiddleware = require('../app/Http/Middleware/RoleMiddleware');
const ValidationMiddleware = require('../app/Http/Middleware/ValidationMiddleware');
const RateLimiter = require('../app/Http/Middleware/RateLimiter');

// ==================== AUTH ROUTES ====================
router.post('/auth/login', [
    body('username').notEmpty().withMessage('Username diperlukan'),
    body('password').notEmpty().withMessage('Password diperlukan'),
    ValidationMiddleware.validate,
], AuthController.login);

router.post('/auth/register', [
    body('username').isLength({ min: 4 }).withMessage('Username minimal 4 karakter'),
    body('email').isEmail().withMessage('Email tidak valid'),
    body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter'),
    body('fullname').notEmpty().withMessage('Nama lengkap diperlukan'),
    ValidationMiddleware.validate,
], AuthController.register);

router.post('/auth/logout', 
    AuthMiddleware.authenticate, 
    AuthController.logout
);

router.get('/auth/verify', AuthController.verifyToken);
router.post('/auth/refresh-token', AuthController.refreshToken);
router.post('/auth/forgot-password', AuthController.forgotPassword);
router.post('/auth/reset-password', AuthController.resetPassword);

// ==================== DASHBOARD ROUTES ====================
router.get('/dashboard/stats', 
    AuthMiddleware.authenticate,
    DashboardController.getStats
);

router.get('/dashboard/chart-data', 
    AuthMiddleware.authenticate,
    DashboardController.getChartData
);

router.get('/dashboard/recent-activities', 
    AuthMiddleware.authenticate,
    DashboardController.getRecentActivities
);

// ==================== SURAT MASUK ROUTES ====================
router.get('/surat-masuk', 
    AuthMiddleware.authenticate,
    SuratMasukController.index
);

router.get('/surat-masuk/:id', 
    AuthMiddleware.authenticate,
    SuratMasukController.show
);

router.post('/surat-masuk', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('superadmin', 'admin', 'operator'),
    RateLimiter.api,
    SuratMasukController.store
);

router.put('/surat-masuk/:id', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('superadmin', 'admin', 'operator'),
    SuratMasukController.update
);

router.delete('/surat-masuk/:id', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('superadmin', 'admin'),
    SuratMasukController.destroy
);

router.get('/surat-masuk/:id/lampiran', 
    AuthMiddleware.authenticate,
    SuratMasukController.getLampiran
);

router.post('/surat-masuk/:id/lampiran', 
    AuthMiddleware.authenticate,
    SuratMasukController.uploadLampiran
);

router.delete('/surat-masuk/:id/lampiran/:lampiranId', 
    AuthMiddleware.authenticate,
    SuratMasukController.deleteLampiran
);

router.patch('/surat-masuk/bulk-update-status', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('superadmin', 'admin'),
    SuratMasukController.bulkUpdateStatus
);

// ==================== SURAT KELUAR ROUTES ====================
router.get('/surat-keluar', 
    AuthMiddleware.authenticate,
    SuratKeluarController.index
);

router.get('/surat-keluar/:id', 
    AuthMiddleware.authenticate,
    SuratKeluarController.show
);

router.post('/surat-keluar', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('superadmin', 'admin', 'operator'),
    SuratKeluarController.store
);

router.put('/surat-keluar/:id', 
    AuthMiddleware.authenticate,
    SuratKeluarController.update
);

router.delete('/surat-keluar/:id', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('superadmin', 'admin'),
    SuratKeluarController.destroy
);

// ==================== DISPOSISI ROUTES ====================
router.get('/disposisi', 
    AuthMiddleware.authenticate,
    DisposisiController.index
);

router.get('/disposisi/:id', 
    AuthMiddleware.authenticate,
    DisposisiController.show
);

router.post('/disposisi', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('superadmin', 'admin', 'pimpinan'),
    DisposisiController.store
);

router.put('/disposisi/:id', 
    AuthMiddleware.authenticate,
    DisposisiController.update
);

router.get('/disposisi/tracking/:suratId', 
    AuthMiddleware.authenticate,
    DisposisiController.tracking
);

// ==================== LAPORAN ROUTES ====================
router.get('/laporan/surat-masuk', 
    AuthMiddleware.authenticate,
    LaporanController.suratMasuk
);

router.get('/laporan/surat-keluar', 
    AuthMiddleware.authenticate,
    LaporanController.suratKeluar
);

router.get('/laporan/disposisi', 
    AuthMiddleware.authenticate,
    LaporanController.disposisi
);

router.get('/laporan/rekap', 
    AuthMiddleware.authenticate,
    LaporanController.rekap
);

router.post('/laporan/export', 
    AuthMiddleware.authenticate,
    LaporanController.export
);

// ==================== PENCARIAN ROUTES ====================
router.get('/search', 
    AuthMiddleware.authenticate,
    PencarianController.search
);

router.get('/search/advanced', 
    AuthMiddleware.authenticate,
    PencarianController.advancedSearch
);

// ==================== NOTIFIKASI ROUTES ====================
router.get('/notifikasi', 
    AuthMiddleware.authenticate,
    NotifikasiController.index
);

router.get('/notifikasi/unread-count', 
    AuthMiddleware.authenticate,
    NotifikasiController.unreadCount
);

router.patch('/notifikasi/:id/read', 
    AuthMiddleware.authenticate,
    NotifikasiController.markAsRead
);

router.patch('/notifikasi/read-all', 
    AuthMiddleware.authenticate,
    NotifikasiController.markAllAsRead
);

// ==================== PENGATURAN ROUTES ====================
router.get('/pengaturan', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('superadmin', 'admin'),
    PenggunaController.getSettings
);

router.put('/pengaturan', 
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('superadmin', 'admin'),
    PenggunaController.updateSettings
);

// ==================== EXPORT ====================
module.exports = router;
