const jwt = require('jsonwebtoken');
const Pengguna = require('../models/Pengguna');

class AuthMiddleware {
  // Authenticate user
  static async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token autentikasi diperlukan'
        });
      }

      const token = authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token tidak valid'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user exists
      const user = await Pengguna.query()
        .findById(decoded.id)
        .whereNull('deleted_at')
        .withGraphFetched('role');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Pengguna tidak ditemukan'
        });
      }

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Akun dinonaktifkan'
        });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token tidak valid'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token kadaluarsa'
        });
      }

      console.error('Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Authorize by role
  static authorize(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Autentikasi diperlukan'
        });
      }

      const userRole = req.user.role.slug;

      if (allowedRoles.includes('super-admin') && userRole === 'super-admin') {
        return next();
      }

      if (allowedRoles.includes('admin') && ['admin', 'super-admin'].includes(userRole)) {
        return next();
      }

      if (allowedRoles.includes(userRole)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk mengakses resource ini'
      });
    };
  }

  // Authorize by permission
  static authorizePermission(resource, action) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Autentikasi diperlukan'
        });
      }

      const permissions = req.user.role.permissions || {};

      // Super admin has all permissions
      if (req.user.role.slug === 'super-admin') {
        return next();
      }

      if (permissions[resource] && permissions[resource].includes(action)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `Anda tidak memiliki izin untuk ${action} ${resource}`
      });
    };
  }

  // Rate limiter middleware
  static rateLimiter(maxRequests = 100, windowMs = 15 * 60 * 1000) {
    const requests = new Map();

    return (req, res, next) => {
      const key = req.ip;
      const now = Date.now();
      
      if (!requests.has(key)) {
        requests.set(key, []);
      }

      const userRequests = requests.get(key).filter(
        timestamp => now - timestamp < windowMs
      );

      if (userRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.'
        });
      }

      userRequests.push(now);
      requests.set(key, userRequests);
      next();
    };
  }
}

module.exports = AuthMiddleware;
