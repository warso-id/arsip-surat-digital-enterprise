const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const SuratController = require('../controllers/SuratController');
const LaporanController = require('../controllers/LaporanController');
const AuthMiddleware = require('../middleware/AuthMiddleware');
const { validate } = require('../middleware/ValidationMiddleware');
const upload = require('../middleware/FileUploadMiddleware');

// ==================== AUTH ROUTES ====================
router.post('/auth/login', validate('login'), AuthController.login);
router.post('/auth/register', validate('register'), AuthController.register);
router.post('/auth/refresh-token', AuthController.refreshToken);
router.post('/auth/logout', AuthMiddleware.authenticate, AuthController.logout);
router.post('/auth/forgot-password', AuthController.forgotPassword);
router.post('/auth/reset-password', AuthController.resetPassword);
router.get('/auth/profile', AuthMiddleware.authenticate, AuthController.profile);
router.put('/auth/profile', 
  AuthMiddleware.authenticate, 
  upload.single('foto'), 
  AuthController.updateProfile
);

// ==================== SURAT ROUTES ====================
router.get('/surat-masuk', 
  AuthMiddleware.authenticate, 
  SuratController.indexMasuk
);

router.get('/surat-keluar', 
  AuthMiddleware.authenticate, 
  SuratController.indexKeluar
);

router.get('/surat/:id', 
  AuthMiddleware.authenticate, 
  SuratController.show
);

router.post('/surat', 
  AuthMiddleware.authenticate, 
  AuthMiddleware.authorize('surat', 'create'),
  upload.single('file_surat'),
  validate('surat'),
  SuratController.store
);

router.put('/surat/:id', 
  AuthMiddleware.authenticate, 
  AuthMiddleware.authorize('surat', 'update'),
  upload.single('file_surat'),
  validate('surat'),
  SuratController.update
);

router.delete('/surat/:id', 
  AuthMiddleware.authenticate, 
  AuthMiddleware.authorize('surat', 'delete'),
  SuratController.destroy
);

router.get('/surat/statistik', 
  AuthMiddleware.authenticate, 
  SuratController.statistik
);

router.get('/surat/search', 
  AuthMiddleware.authenticate, 
  SuratController.search
);

// ==================== LAPORAN ROUTES ====================
router.get('/laporan/surat-masuk', 
  AuthMiddleware.authenticate, 
  AuthMiddleware.authorize('laporan', 'read'),
  LaporanController.laporanSuratMasuk
);

router.get('/laporan/surat-keluar', 
  AuthMiddleware.authenticate, 
  AuthMiddleware.authorize('laporan', 'read'),
  LaporanController.laporanSuratKeluar
);

router.get('/laporan/disposisi', 
  AuthMiddleware.authenticate, 
  LaporanController.laporanDisposisi
);

router.get('/laporan/statistik', 
  AuthMiddleware.authenticate, 
  LaporanController.laporanStatistik
);

module.exports = router;
