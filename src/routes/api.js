const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../app/Http/Middleware/AuthMiddleware');
const RoleMiddleware = require('../app/Http/Middleware/RoleMiddleware');
const ValidationMiddleware = require('../app/Http/Middleware/ValidationMiddleware');
const FileUploadMiddleware = require('../app/Http/Middleware/FileUploadMiddleware');
const RateLimiter = require('../app/Http/Middleware/RateLimiter');
const AuditMiddleware = require('../app/Http/Middleware/AuditMiddleware');

// Import Controllers
const AuthController = require('../app/Http/Controllers/AuthController');
const DashboardController = require('../app/Http/Controllers/DashboardController');
const SuratMasukController = require('../app/Http/Controllers/SuratMasukController');
const SuratKeluarController = require('../app/Http/Controllers/SuratKeluarController');
const DisposisiController = require('../app/Http/Controllers/DisposisiController');
const PenggunaController = require('../app/Http/Controllers/PenggunaController');
const InstansiController = require('../app/Http/Controllers/InstansiController');
const KategoriController = require('../app/Http/Controllers/KategoriController');
const LaporanController = require('../app/Http/Controllers/LaporanController');
const NotifikasiController = require('../app/Http/Controllers/NotifikasiController');
const PengaturanController = require('../app/Http/Controllers/PengaturanController');

// Apply global middleware
router.use(RateLimiter.api());
router.use(AuditMiddleware.logRequest);
router.use(ValidationMiddleware.sanitize);

// ========== PUBLIC ROUTES ==========

// Auth routes
router.post('/auth/login', RateLimiter.auth(), AuthController.login);
router.post('/auth/register', AuthController.register);
router.post('/auth/forgot-password', RateLimiter.auth(), AuthController.forgotPassword);
router.post('/auth/reset-password', AuthController.resetPassword);
router.post('/auth/refresh-token', AuthController.refreshToken);

// ========== PROTECTED ROUTES ==========

// Apply auth middleware to all routes below
router.use(AuthMiddleware.authenticate);

// Auth (protected)
router.get('/auth/me', AuthController.me);
router.post('/auth/change-password', AuthController.changePassword);
router.post('/auth/logout', AuthController.logout);

// Dashboard
router.get('/dashboard', DashboardController.index);
router.get('/dashboard/chart', DashboardController.chartData);
router.get('/dashboard/search', DashboardController.search);

// Notifications
router.get('/notifications', DashboardController.notifications);
router.put('/notifications/:id/read', DashboardController.markNotificationRead);
router.put('/notifications/read-all', DashboardController.markAllNotificationsRead);

// Surat Masuk
router.get('/surat-masuk', ValidationMiddleware.validatePagination, SuratMasukController.index);
router.get('/surat-masuk/:id', ValidationMiddleware.validateId, SuratMasukController.show);
router.post('/surat-masuk', 
    RoleMiddleware.hasPermission('create_surat_masuk'),
    SuratMasukController.store
);
router.put('/surat-masuk/:id', 
    RoleMiddleware.hasPermission('edit_surat_masuk'),
    ValidationMiddleware.validateId,
    SuratMasukController.update
);
router.delete('/surat-masuk/:id', 
    RoleMiddleware.hasPermission('delete_surat_masuk'),
    ValidationMiddleware.validateId,
    SuratMasukController.destroy
);
router.post('/surat-masuk/:id/upload',
    RoleMiddleware.hasPermission('edit_surat_masuk'),
    RateLimiter.upload(),
    FileUploadMiddleware.single('file', { maxSize: 10 * 1024 * 1024 }),
    SuratMasukController.uploadFile
);
router.get('/surat-masuk/:id/export-pdf', SuratMasukController.exportPDF);

// Surat Keluar
router.get('/surat-keluar', ValidationMiddleware.validatePagination, SuratKeluarController.index);
router.get('/surat-keluar/:id', ValidationMiddleware.validateId, SuratKeluarController.show);
router.post('/surat-keluar',
    RoleMiddleware.hasPermission('create_surat_keluar'),
    SuratKeluarController.store
);
router.put('/surat-keluar/:id',
    RoleMiddleware.hasPermission('edit_surat_keluar'),
    ValidationMiddleware.validateId,
    SuratKeluarController.update
);
router.delete('/surat-keluar/:id',
    RoleMiddleware.hasPermission('delete_surat_keluar'),
    ValidationMiddleware.validateId,
    SuratKeluarController.destroy
);
router.get('/surat-keluar/:id/export-pdf', SuratKeluarController.exportPDF);

// Disposisi
router.get('/disposisi', ValidationMiddleware.validatePagination, DisposisiController.index);
router.get('/disposisi/my', DisposisiController.myDisposisi);
router.get('/disposisi/statistics', DisposisiController.statistics);
router.get('/disposisi/:id', ValidationMiddleware.validateId, DisposisiController.show);
router.post('/disposisi',
    RoleMiddleware.hasPermission('create_disposisi'),
    DisposisiController.store
);
router.put('/disposisi/:id/status',
    RoleMiddleware.hasPermission('process_disposisi'),
    DisposisiController.updateStatus
);
router.post('/disposisi/:id/reply',
    RoleMiddleware.hasPermission('create_disposisi'),
    DisposisiController.reply
);
router.post('/disposisi/batch-update',
    RoleMiddleware.hasPermission('process_disposisi'),
    DisposisiController.batchUpdate
);
router.delete('/disposisi/:id',
    RoleMiddleware.isAdmin,
    DisposisiController.destroy
);
router.get('/disposisi/:id/export-pdf', DisposisiController.exportPDF);

// Pengguna Management (Admin only)
router.get('/pengguna', RoleMiddleware.isAdmin, PenggunaController.index);
router.get('/pengguna/:id', RoleMiddleware.isAdmin, PenggunaController.show);
router.post('/pengguna', RoleMiddleware.isAdmin, PenggunaController.store);
router.put('/pengguna/:id', RoleMiddleware.isAdmin, PenggunaController.update);
router.delete('/pengguna/:id', RoleMiddleware.isSuperAdmin, PenggunaController.destroy);
router.put('/pengguna/:id/status', RoleMiddleware.isAdmin, PenggunaController.toggleStatus);

// Instansi Management
router.get('/instansi', InstansiController.index);
router.get('/instansi/:id', InstansiController.show);
router.post('/instansi', RoleMiddleware.isAdmin, InstansiController.store);
router.put('/instansi/:id', RoleMiddleware.isAdmin, InstansiController.update);
router.delete('/instansi/:id', RoleMiddleware.isAdmin, InstansiController.destroy);

// Kategori Management
router.get('/kategori', KategoriController.index);
router.get('/kategori/tree', KategoriController.tree);
router.get('/kategori/:id', KategoriController.show);
router.post('/kategori', RoleMiddleware.isAdmin, KategoriController.store);
router.put('/kategori/:id', RoleMiddleware.isAdmin, KategoriController.update);
router.delete('/kategori/:id', RoleMiddleware.isAdmin, KategoriController.destroy);

// Laporan
router.get('/laporan', RoleMiddleware.hasPermission('view_laporan'), LaporanController.index);
router.get('/laporan/statistics', RoleMiddleware.hasPermission('view_laporan'), LaporanController.statistics);
router.get('/laporan/export-pdf', RoleMiddleware.hasPermission('export_laporan'), LaporanController.exportPDF);
router.get('/laporan/export-excel', RoleMiddleware.hasPermission('export_laporan'), LaporanController.exportExcel);

// Pengaturan
router.get('/pengaturan', RoleMiddleware.isAdmin, PengaturanController.index);
router.put('/pengaturan', RoleMiddleware.isSuperAdmin, PengaturanController.update);
router.get('/pengaturan/:key', PengaturanController.show);

module.exports = router;
