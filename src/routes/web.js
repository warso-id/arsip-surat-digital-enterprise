// ==================== WEB ROUTES ====================
// Arsip Surat Digital Enterprise

const express = require('express');
const router = express.Router();
const path = require('path');

// ==================== LANDING PAGE ====================
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'index.html'));
});

// ==================== AUTH PAGES ====================
router.get('/login', (req, res) => {
    res.render('auth/login', {
        title: 'Login',
        layout: 'layouts/auth',
    });
});

router.get('/register', (req, res) => {
    res.render('auth/register', {
        title: 'Register',
        layout: 'layouts/auth',
    });
});

router.get('/forgot-password', (req, res) => {
    res.render('auth/forgot-password', {
        title: 'Lupa Password',
        layout: 'layouts/auth',
    });
});

router.get('/reset-password', (req, res) => {
    res.render('auth/reset-password', {
        title: 'Reset Password',
        layout: 'layouts/auth',
        token: req.query.token || '',
    });
});

// ==================== DASHBOARD ====================
router.get('/dashboard', (req, res) => {
    res.render('dashboard/index', {
        title: 'Dashboard',
        layout: 'layouts/main',
        user: req.user || { fullname: 'User', role: 'Operator' },
    });
});

router.get('/dashboard/statistik', (req, res) => {
    res.render('dashboard/statistik', {
        title: 'Statistik Detail',
        layout: 'layouts/main',
    });
});

// ==================== SURAT MASUK ====================
router.get('/surat-masuk', (req, res) => {
    res.render('surat-masuk/index', {
        title: 'Surat Masuk',
        layout: 'layouts/main',
    });
});

router.get('/surat-masuk/create', (req, res) => {
    res.render('surat-masuk/create', {
        title: 'Tambah Surat Masuk',
        layout: 'layouts/main',
    });
});

router.get('/surat-masuk/:id', (req, res) => {
    res.render('surat-masuk/show', {
        title: 'Detail Surat Masuk',
        layout: 'layouts/main',
        id: req.params.id,
    });
});

router.get('/surat-masuk/:id/edit', (req, res) => {
    res.render('surat-masuk/edit', {
        title: 'Edit Surat Masuk',
        layout: 'layouts/main',
        id: req.params.id,
    });
});

router.get('/surat-masuk/:id/disposisi', (req, res) => {
    res.render('surat-masuk/disposisi', {
        title: 'Form Disposisi',
        layout: 'layouts/main',
        id: req.params.id,
    });
});

// ==================== SURAT KELUAR ====================
router.get('/surat-keluar', (req, res) => {
    res.render('surat-keluar/index', {
        title: 'Surat Keluar',
        layout: 'layouts/main',
    });
});

router.get('/surat-keluar/create', (req, res) => {
    res.render('surat-keluar/create', {
        title: 'Buat Surat Keluar',
        layout: 'layouts/main',
    });
});

router.get('/surat-keluar/:id', (req, res) => {
    res.render('surat-keluar/show', {
        title: 'Detail Surat Keluar',
        layout: 'layouts/main',
        id: req.params.id,
    });
});

router.get('/surat-keluar/:id/edit', (req, res) => {
    res.render('surat-keluar/edit', {
        title: 'Edit Surat Keluar',
        layout: 'layouts/main',
        id: req.params.id,
    });
});

// ==================== DISPOSISI ====================
router.get('/disposisi', (req, res) => {
    res.render('disposisi/index', {
        title: 'Disposisi',
        layout: 'layouts/main',
    });
});

router.get('/disposisi/:id', (req, res) => {
    res.render('disposisi/show', {
        title: 'Detail Disposisi',
        layout: 'layouts/main',
        id: req.params.id,
    });
});

router.get('/disposisi/tracking/:suratId', (req, res) => {
    res.render('disposisi/tracking', {
        title: 'Tracking Disposisi',
        layout: 'layouts/main',
        suratId: req.params.suratId,
    });
});

// ==================== LAPORAN ====================
router.get('/laporan', (req, res) => {
    res.render('laporan/index', {
        title: 'Laporan',
        layout: 'layouts/main',
    });
});

router.get('/laporan/surat-masuk', (req, res) => {
    res.render('laporan/surat-masuk', {
        title: 'Laporan Surat Masuk',
        layout: 'layouts/main',
    });
});

router.get('/laporan/surat-keluar', (req, res) => {
    res.render('laporan/surat-keluar', {
        title: 'Laporan Surat Keluar',
        layout: 'layouts/main',
    });
});

router.get('/laporan/disposisi', (req, res) => {
    res.render('laporan/disposisi', {
        title: 'Laporan Disposisi',
        layout: 'layouts/main',
    });
});

// ==================== PENCARIAN ====================
router.get('/pencarian', (req, res) => {
    res.render('pencarian/index', {
        title: 'Pencarian',
        layout: 'layouts/main',
        query: req.query.q || '',
    });
});

// ==================== PENGATURAN ====================
router.get('/pengaturan', (req, res) => {
    res.render('pengaturan/index', {
        title: 'Pengaturan',
        layout: 'layouts/main',
    });
});

// ==================== PENGGUNA ====================
router.get('/pengguna', (req, res) => {
    res.render('pengguna/index', {
        title: 'Manajemen Pengguna',
        layout: 'layouts/main',
    });
});

router.get('/pengguna/create', (req, res) => {
    res.render('pengguna/create', {
        title: 'Tambah Pengguna',
        layout: 'layouts/main',
    });
});

router.get('/pengguna/:id/edit', (req, res) => {
    res.render('pengguna/edit', {
        title: 'Edit Pengguna',
        layout: 'layouts/main',
        id: req.params.id,
    });
});

router.get('/profile', (req, res) => {
    res.render('pengguna/profile', {
        title: 'Profil Saya',
        layout: 'layouts/main',
    });
});

// ==================== INSTANSI ====================
router.get('/instansi', (req, res) => {
    res.render('instansi/index', {
        title: 'Data Instansi',
        layout: 'layouts/main',
    });
});

router.get('/instansi/create', (req, res) => {
    res.render('instansi/create', {
        title: 'Tambah Instansi',
        layout: 'layouts/main',
    });
});

// ==================== KATEGORI ====================
router.get('/kategori', (req, res) => {
    res.render('kategori/index', {
        title: 'Kategori Surat',
        layout: 'layouts/main',
    });
});

// ==================== NOTIFIKASI ====================
router.get('/notifikasi', (req, res) => {
    res.render('notifikasi/index', {
        title: 'Notifikasi',
        layout: 'layouts/main',
    });
});

// ==================== EXPORT ROUTES ====================
module.exports = router;
