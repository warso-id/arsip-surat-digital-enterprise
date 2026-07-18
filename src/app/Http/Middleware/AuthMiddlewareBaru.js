const jwt = require('jsonwebtoken');
const Pengguna = require('../../Models/Pengguna');
const ResponseHelper = require('../../Helpers/ResponseHelper');
const authConfig = require('../../../config/auth');

class AuthMiddleware {
    /**
     * Authenticate user via JWT token
     */
    static async authenticate(req, res, next) {
        try {
            // Get token from header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return ResponseHelper.error(res, 'Token tidak ditemukan', 401);
            }

            const token = authHeader.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, authConfig.jwt.secret);

            // Find user
            const user = await Pengguna.findByPk(decoded.id, {
                include: ['role'],
                attributes: { exclude: ['password'] }
            });

            if (!user) {
                return ResponseHelper.error(res, 'User tidak ditemukan', 401);
            }

            if (user.status !== 'aktif') {
                return ResponseHelper.error(res, 'Akun tidak aktif', 401);
            }

            // Set user to request
            req.user = user;
            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return ResponseHelper.error(res, 'Token tidak valid', 401);
            }
            if (error.name === 'TokenExpiredError') {
                return ResponseHelper.error(res, 'Token sudah kadaluarsa', 401);
            }
            return ResponseHelper.error(res, 'Gagal autentikasi', 500);
        }
    }

    /**
     * Optional authenticate - doesn't throw error if no token
     */
    static async optionalAuth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, authConfig.jwt.secret);
                
                const user = await Pengguna.findByPk(decoded.id, {
                    include: ['role'],
                    attributes: { exclude: ['password'] }
                });

                if (user && user.status === 'aktif') {
                    req.user = user;
                }
            }
        } catch (error) {
            // Ignore errors for optional auth
        }
        next();
    }

    /**
     * Authenticate for web views (session-based)
     */
    static async webAuth(req, res, next) {
        try {
            if (!req.session || !req.session.userId) {
                return res.redirect('/auth/login');
            }

            const user = await Pengguna.findByPk(req.session.userId, {
                include: ['role']
            });

            if (!user || user.status !== 'aktif') {
                req.session.destroy();
                return res.redirect('/auth/login');
            }

            req.user = user;
            res.locals.user = user;
            next();
        } catch (error) {
            console.error('Web auth error:', error);
            return res.redirect('/auth/login');
        }
    }

    /**
     * Check if user is authenticated for API
     */
    static async checkAuth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return next();
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, authConfig.jwt.secret);
            
            const user = await Pengguna.findByPk(decoded.id, {
                include: ['role']
            });

            if (user && user.status === 'aktif') {
                req.user = user;
            }
            next();
        } catch (error) {
            next();
        }
    }
}

module.exports = AuthMiddleware;
