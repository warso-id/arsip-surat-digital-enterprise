const express = require('express');
const router = express.Router();
const path = require('path');

// Landing page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../index.html'));
});

// Auth pages
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/views/auth/login.html'));
});

// Dashboard
router.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/views/dashboard/index.html'));
});

// Surat pages
router.get('/surat-masuk', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/views/surat-masuk/index.html'));
});

router.get('/surat-keluar', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/views/surat-keluar/index.html'));
});

// Disposisi pages
router.get('/disposisi', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/views/disposisi/index.html'));
});

// Laporan pages
router.get('/laporan', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/views/laporan/index.html'));
});

// Pengguna pages (Admin only)
router.get('/pengguna', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/views/pengguna/index.html'));
});

// Pengaturan
router.get('/pengaturan', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/views/pengaturan/index.html'));
});

module.exports = router;
