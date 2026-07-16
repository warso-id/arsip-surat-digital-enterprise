// ==================== ADMIN ROUTES ====================
// Arsip Surat Digital Enterprise

const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../app/Http/Middleware/AuthMiddleware');

// All admin routes require authentication and admin role
router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.authorize('superadmin', 'admin'));

// ==================== DASHBOARD ====================
router.get('/', (req, res) => {
    res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        layout: 'layouts/admin',
    });
});

// ==================== USER MANAGEMENT ====================
router.get('/users', (req, res) => {
    res.render('admin/users/index', {
        title: 'Manajemen Pengguna',
        layout: 'layouts/admin',
    });
});

router.get('/users/create', (req, res) => {
    res.render('admin/users/create', {
        title: 'Tambah Pengguna',
        layout: 'layouts/admin',
    });
});

router.get('/users/:id', (req, res) => {
    res.render('admin/users/show', {
        title: 'Detail Pengguna',
        layout: 'layouts/admin',
        id: req.params.id,
    });
});

router.get('/users/:id/edit', (req, res) => {
    res.render('admin/users/edit', {
        title: 'Edit Pengguna',
        layout: 'layouts/admin',
        id: req.params.id,
    });
});

// ==================== INSTANSI MANAGEMENT ====================
router.get('/instansi', (req, res) => {
    res.render('admin/instansi/index', {
        title: 'Manajemen Instansi',
        layout: 'layouts/admin',
    });
});

router.get('/instansi/create', (req, res) => {
    res.render('admin/instansi/create', {
        title: 'Tambah Instansi',
        layout: 'layouts/admin',
    });
});

// ==================== ROLE MANAGEMENT ====================
router.get('/roles', (req, res) => {
    res.render('admin/roles/index', {
        title: 'Manajemen Role',
        layout: 'layouts/admin',
    });
});

// ==================== SYSTEM SETTINGS ====================
router.get('/settings', (req, res) => {
    res.render('admin/settings', {
        title: 'Pengaturan Sistem',
        layout: 'layouts/admin',
    });
});

// ==================== AUDIT LOG ====================
router.get('/audit-log', (req, res) => {
    res.render('admin/audit-log', {
        title: 'Audit Log',
        layout: 'layouts/admin',
    });
});

// ==================== BACKUP ====================
router.get('/backup', (req, res) => {
    res.render('admin/backup', {
        title: 'Backup & Restore',
        layout: 'layouts/admin',
    });
});

// ==================== SYSTEM INFO ====================
router.get('/system-info', (req, res) => {
    const info = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
    };
    
    res.render('admin/system-info', {
        title: 'Informasi Sistem',
        layout: 'layouts/admin',
        info: info,
    });
});

module.exports = router;
