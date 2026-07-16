// ==================== AUTH MIDDLEWARE ====================
// Arsip Surat Digital Enterprise

const jwt = require('jsonwebtoken');
const config = require('../../../config/app');

class AuthMiddleware {
    constructor() {
        this.userModel = require('../../Models/Pengguna');
    }

    /**
     * Authenticate user via JWT token
     */
    async authenticate(req, res, next) {
        try {
            // Get token from various sources
            const token = this.extractToken(req);

            if (!token) {
                // Check if request accepts JSON
                if (req.xhr || req.headers.accept?.includes('application/json')) {
                    return res.status(401).json({
                        success: false,
                        message: 'Token autentikasi tidak ditemukan',
                        code: 'TOKEN_MISSING',
                    });
                }
                // Redirect to login for web requests
                return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
            }

            // Verify token
            let decoded;
            try {
                decoded = jwt.verify(token, config.auth.jwt.secret, {
                    algorithms: [config.auth.jwt.algorithm],
                    issuer: config.auth.jwt.issuer,
                });
            } catch (err) {
                if (err.name === 'TokenExpiredError') {
                    return this.handleError(req, res, 'Token sudah kadaluarsa', 'TOKEN_EXPIRED', 401);
                }
                return this.handleError(req, res, 'Token tidak valid', 'TOKEN_INVALID', 401);
            }

            // Verify token type
            if (decoded.type !== 'access') {
                return this.handleError(req, res, 'Token type tidak valid', 'TOKEN_TYPE_INVALID', 401);
            }

            // Find user
            const user = await this.userModel.findById(decoded.userId);
            if (!user) {
                return this.handleError(req, res, 'User tidak ditemukan', 'USER_NOT_FOUND', 401);
            }

            // Check if user is active
            if (!user.is_active) {
                return this.handleError(req, res, 'Akun tidak aktif', 'USER_INACTIVE', 403);
            }

            // Check if token was issued before password change
            if (user.password_changed_at) {
                const passwordChangedAt = new Date(user.password_changed_at).getTime() / 1000;
                if (decoded.iat < passwordChangedAt) {
                    return this.handleError(req, res, 'Token tidak valid (password changed)', 'TOKEN_INVALID', 401);
                }
            }

            // Attach user to request
            req.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                fullname: user.fullname,
                role: user.role,
                role_id: user.role_id,
                instansi_id: user.instansi_id,
            };

            // Update last activity
            await this.userModel.updateLastActivity(user.id);

            return next();

        } catch (error) {
            console.error('Auth middleware error:', error);
            return this.handleError(req, res, 'Terjadi kesalahan autentikasi', 'AUTH_ERROR', 500);
        }
    }

    /**
     * Check if user has specific role
     */
    authorize(...roles) {
        return (req, res, next) => {
            if (!req.user) {
                return this.handleError(req, res, 'Autentikasi diperlukan', 'AUTH_REQUIRED', 401);
            }

            if (!roles.includes(req.user.role)) {
                return this.handleError(req, res, 'Anda tidak memiliki akses', 'FORBIDDEN', 403);
            }

            return next();
        };
    }

    /**
     * Check if user belongs to same instansi
     */
    sameInstansi(req, res, next) {
        const instansiId = parseInt(req.params.instansiId || req.body.instansi_id);
        
        if (req.user.role === 'superadmin') {
            return next();
        }

        if (req.user.instansi_id !== instansiId) {
            return this.handleError(req, res, 'Akses lintas instansi tidak diizinkan', 'CROSS_INSTANSI', 403);
        }

        return next();
    }

    /**
     * Check if user is owner of resource
     */
    isOwner(modelName, paramId = 'id') {
        return async (req, res, next) => {
            try {
                const Model = require(`../../Models/${modelName}`);
                const resource = await Model.findById(req.params[paramId]);

                if (!resource) {
                    return this.handleError(req, res, 'Resource tidak ditemukan', 'NOT_FOUND', 404);
                }

                if (req.user.role === 'superadmin' || req.user.role === 'admin') {
                    return next();
                }

                if (resource.created_by !== req.user.id && resource.user_id !== req.user.id) {
                    return this.handleError(req, res, 'Anda tidak memiliki akses ke resource ini', 'FORBIDDEN', 403);
                }

                return next();
            } catch (error) {
                console.error('Owner middleware error:', error);
                return this.handleError(req, res, 'Terjadi kesalahan', 'ERROR', 500);
            }
        };
    }

    /**
     * Check API key for service-to-service communication
     */
    async apiKey(req, res, next) {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return this.handleError(req, res, 'API key diperlukan', 'API_KEY_MISSING', 401);
        }

        if (apiKey !== config.app.key) {
            return this.handleError(req, res, 'API key tidak valid', 'API_KEY_INVALID', 401);
        }

        return next();
    }

    /**
     * Rate limiting per user
     */
    rateLimiter(windowMs = 900000, max = 100) {
        const requests = new Map();

        return (req, res, next) => {
            const key = req.user?.id || req.ip;
            const now = Date.now();
            
            if (!requests.has(key)) {
                requests.set(key, []);
            }

            const userRequests = requests.get(key);
            const windowStart = now - windowMs;

            // Remove old requests
            while (userRequests.length > 0 && userRequests[0] < windowStart) {
                userRequests.shift();
            }

            if (userRequests.length >= max) {
                return this.handleError(req, res, 'Terlalu banyak permintaan', 'RATE_LIMIT', 429);
            }

            userRequests.push(now);
            return next();
        };
    }

    /**
     * Extract token from request
     */
    extractToken(req) {
        // From Authorization header
        const authHeader = req.headers?.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
        }

        // From cookie
        if (req.cookies?.token) {
            return req.cookies.token;
        }

        // From query string (not recommended for production)
        if (req.query?.token) {
            return req.query.token;
        }

        // From body
        if (req.body?.token) {
            return req.body.token;
        }

        return null;
    }

    /**
     * Handle error response
     */
    handleError(req, res, message, code, statusCode) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(statusCode).json({
                success: false,
                message: message,
                code: code,
            });
        }

        // For web requests
        switch (statusCode) {
            case 401:
                return res.redirect('/login?error=' + encodeURIComponent(message));
            case 403:
                return res.status(403).render('errors/403', {
                    message: message,
                    layout: 'layouts/error',
                });
            default:
                return res.status(statusCode).json({
                    success: false,
                    message: message,
                });
        }
    }
}

module.exports = new AuthMiddleware();
