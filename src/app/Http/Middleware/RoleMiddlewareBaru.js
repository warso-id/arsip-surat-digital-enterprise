const ResponseHelper = require('../../Helpers/ResponseHelper');

class RoleMiddleware {
    /**
     * Check if user has specific role
     */
    static hasRole(...roles) {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    return ResponseHelper.error(res, 'Autentikasi diperlukan', 401);
                }

                const userRole = req.user.role.nama_role;
                
                if (!roles.includes(userRole)) {
                    return ResponseHelper.error(res, 'Anda tidak memiliki akses', 403);
                }

                next();
            } catch (error) {
                return ResponseHelper.error(res, 'Gagal memeriksa role', 500);
            }
        };
    }

    /**
     * Check if user has permission
     */
    static hasPermission(permission) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return ResponseHelper.error(res, 'Autentikasi diperlukan', 401);
                }

                const AuthService = require('../../Services/AuthService');
                const hasPermission = await AuthService.checkPermission(req.user.id, permission);

                if (!hasPermission) {
                    return ResponseHelper.error(res, 'Anda tidak memiliki izin untuk akses ini', 403);
                }

                next();
            } catch (error) {
                return ResponseHelper.error(res, 'Gagal memeriksa izin', 500);
            }
        };
    }

    /**
     * Check if user is admin
     */
    static isAdmin(req, res, next) {
        try {
            if (!req.user) {
                return ResponseHelper.error(res, 'Autentikasi diperlukan', 401);
            }

            const userRole = req.user.role.nama_role;
            const adminRoles = ['superadmin', 'admin'];

            if (!adminRoles.includes(userRole)) {
                return ResponseHelper.error(res, 'Akses admin diperlukan', 403);
            }

            next();
        } catch (error) {
            return ResponseHelper.error(res, 'Gagal memeriksa role', 500);
        }
    }

    /**
     * Check if user is superadmin
     */
    static isSuperAdmin(req, res, next) {
        try {
            if (!req.user) {
                return ResponseHelper.error(res, 'Autentikasi diperlukan', 401);
            }

            if (req.user.role.nama_role !== 'superadmin') {
                return ResponseHelper.error(res, 'Akses superadmin diperlukan', 403);
            }

            next();
        } catch (error) {
            return ResponseHelper.error(res, 'Gagal memeriksa role', 500);
        }
    }

    /**
     * Check if user can access specific resource
     */
    static canAccess(model, paramName = 'id') {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return ResponseHelper.error(res, 'Autentikasi diperlukan', 401);
                }

                // Superadmin can access everything
                if (req.user.role.nama_role === 'superadmin') {
                    return next();
                }

                const resourceId = req.params[paramName];
                const resource = await model.findByPk(resourceId);

                if (!resource) {
                    return ResponseHelper.error(res, 'Resource tidak ditemukan', 404);
                }

                // Check if user created this resource
                if (resource.created_by && resource.created_by === req.user.id) {
                    return next();
                }

                // Check if disposisi is assigned to user
                if (resource.kepada_user_id && resource.kepada_user_id === req.user.id) {
                    return next();
                }

                return ResponseHelper.error(res, 'Anda tidak memiliki akses ke resource ini', 403);
            } catch (error) {
                return ResponseHelper.error(res, 'Gagal memeriksa akses', 500);
            }
        };
    }
}

module.exports = RoleMiddleware;
