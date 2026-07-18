const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../app/Http/Middleware/AuthMiddleware');

// ========== WEB ROUTES ==========

// Home page
router.get('/', (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('auth/login', { 
        title: 'Login',
        layout: 'layouts/auth'
    });
});

// Auth pages
router.get('/login', (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('auth/login', {
        title: 'Login',
        layout: 'layouts/auth'
    });
});

router.get('/register', (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('auth/register', {
        title: 'Register',
        layout: 'layouts/auth'
    });
});

router.get('/forgot-password', (req, res) => {
    res.render('auth/forgot-password', {
        title: 'Lupa Password',
        layout: 'layouts/auth'
    });
});

router.get('/reset-password', (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.redirect('/login');
    }
    res.render('auth/reset-password', {
        title: 'Reset Password',
        token,
        layout: 'layouts/auth'
    });
});

// Protected web routes
router.use(AuthMiddleware.webAuth);

// Dashboard
router.get('/dashboard', (req, res) => {
    res.render('dashboard/index', {
        title: 'Dashboard',
        user: req.user,
        layout: 'layouts/main'
    });
});

// Surat Masuk pages
router.get('/surat-masuk', (req, res) => {
    res.render('surat-masuk/index', {
        title: 'Surat Masuk',
        user: req.user,
        layout: 'layouts/main'
    });
});

router.get('/surat-masuk/create', (req, res) => {
    res.render('surat-masuk/create', {
        title: 'Tambah Surat Masuk',
        user: req.user,
        layout: 'layouts/main'
    });
});

router.get('/surat-masuk/:id', (req, res) => {
    res.render('surat-masuk/detail', {
        title: 'Detail Surat Masuk',
        user: req.user,
        id: req.params.id,
        layout: 'layouts/main'
    });
});

router.get('/surat-masuk/:id/edit', (req, res) => {
    res.render('surat-masuk/edit', {
        title: 'Edit Surat Masuk',
        user: req.user,
        id: req.params.id,
        layout: 'layouts/main'
    });
});

// Surat Keluar pages
router.get('/surat-keluar', (req, res) => {
    res.render('surat-keluar/index', {
        title: 'Surat Keluar',
        user: req.user,
        layout: 'layouts/main'
    });
});

router.get('/surat-keluar/create', (req, res) => {
    res.render('surat-keluar/create', {
        title: 'Tambah Surat Keluar',
        user: req.user,
        layout: 'layouts/main'
    });
});

router.get('/surat-keluar/:id', (req, res) => {
    res.render('surat-keluar/detail', {
        title: 'Detail Surat Keluar',
        user: req.user,
        id: req.params.id,
        layout: 'layouts/main'
    });
});

router.get('/surat-keluar/:id/edit', (req, res) => {
    res.render('surat-keluar/edit', {
        title: 'Edit Surat Keluar',
        user: req.user,
        id: req.params.id,
        layout: 'layouts/main'
    });
});

// Disposisi pages
router.get('/disposisi', (req, res) => {
    res.render('disposisi/index', {
        title: 'Disposisi',
        user: req.user,
        layout: 'layouts/main'
    });
});

router.get('/disposisi/:id', (req, res) => {
    res.render('disposisi/detail', {
        title: 'Detail Disposisi',
        user: req.user,
        id: req.params.id,
        layout: 'layouts/main'
    });
});

// Laporan pages
router.get('/laporan', (req, res) => {
    res.render('laporan/index', {
        title: 'Laporan',
        user: req.user,
        layout: 'layouts/main'
    });
});

// Pengaturan pages (Admin only)
router.get('/pengaturan', (req, res) => {
    res.render('pengaturan/index', {
        title: 'Pengaturan',
        user: req.user,
        layout: 'layouts/main'
    });
});

router.get('/pengguna', (req, res) => {
    res.render('pengguna/index', {
        title: 'Manajemen Pengguna',
        user: req.user,
        layout: 'layouts/main'
    });
});

router.get('/instansi', (req, res) => {
    res.render('instansi/index', {
        title: 'Manajemen Instansi',
        user: req.user,
        layout: 'layouts/main'
    });
});

router.get('/kategori', (req, res) => {
    res.render('kategori/index', {
        title: 'Manajemen Kategori',
        user: req.user,
        layout: 'layouts/main'
    });
});

// Error pages
router.get('/404', (req, res) => {
    res.status(404).render('errors/404', {
        title: 'Halaman Tidak Ditemukan',
        layout: 'layouts/auth'
    });
});

// Catch all 404
router.use((req, res) => {
    res.status(404).render('errors/404', {
        title: 'Halaman Tidak Ditemukan',
        layout: 'layouts/auth'
    });
});

module.exports = router;
