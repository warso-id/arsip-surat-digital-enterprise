// ==================== AUTH ROUTES ====================
// Arsip Surat Digital Enterprise

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AuthController = require('../app/Http/Controllers/AuthController');
const AuthMiddleware = require('../app/Http/Middleware/AuthMiddleware');

// ==================== LOGIN ====================
router.get('/login', AuthController.showLoginForm);

router.post('/login', [
    body('username').trim().notEmpty().withMessage('Username diperlukan'),
    body('password').notEmpty().withMessage('Password diperlukan'),
], AuthController.login);

// ==================== REGISTER ====================
router.get('/register', (req, res) => {
    res.render('auth/register', { layout: 'layouts/auth' });
});

router.post('/register', [
    body('username').trim().isLength({ min: 4 }).withMessage('Username minimal 4 karakter'),
    body('email').isEmail().withMessage('Email tidak valid'),
    body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter'),
    body('fullname').trim().notEmpty().withMessage('Nama lengkap diperlukan'),
], AuthController.register);

// ==================== LOGOUT ====================
router.post('/logout', AuthMiddleware.authenticate, AuthController.logout);
router.get('/logout', AuthMiddleware.authenticate, AuthController.logout);

// ==================== FORGOT PASSWORD ====================
router.get('/forgot-password', (req, res) => {
    res.render('auth/forgot-password', { layout: 'layouts/auth' });
});

router.post('/forgot-password', [
    body('email').isEmail().withMessage('Email tidak valid'),
], AuthController.forgotPassword);

// ==================== RESET PASSWORD ====================
router.get('/reset-password', (req, res) => {
    res.render('auth/reset-password', {
        layout: 'layouts/auth',
        token: req.query.token || '',
    });
});

router.post('/reset-password', [
    body('token').notEmpty().withMessage('Token diperlukan'),
    body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter'),
    body('password_confirmation').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Konfirmasi password tidak cocok');
        }
        return true;
    }),
], AuthController.resetPassword);

// ==================== TOKEN VERIFICATION ====================
router.get('/verify', AuthController.verifyToken);
router.post('/refresh-token', AuthController.refreshToken);

module.exports = router;
