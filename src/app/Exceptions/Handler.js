const logger = require('../../config/logger');

class ExceptionHandler {
    /**
     * Handle error
     */
    static handle(err, req, res, next) {
        // Log error
        logger.error({
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            user: req.user?.id
        });

        // Handle specific errors
        if (err.name === 'SequelizeValidationError') {
            return res.status(422).json({
                status: 'error',
                message: 'Validasi gagal',
                errors: err.errors.map(e => ({
                    field: e.path,
                    message: e.message
                }))
            });
        }

        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                status: 'error',
                message: 'Data sudah ada',
                errors: err.errors.map(e => ({
                    field: e.path,
                    message: 'Data sudah digunakan'
                }))
            });
        }

        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: 'error',
                message: 'Token tidak valid'
            });
        }

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'Token sudah kadaluarsa'
            });
        }

        if (err.type === 'entity.too.large') {
            return res.status(413).json({
                status: 'error',
                message: 'Ukuran file terlalu besar'
            });
        }

        // Default error response
        const statusCode = err.statusCode || 500;
        const message = process.env.NODE_ENV === 'production' 
            ? 'Terjadi kesalahan internal server' 
            : err.message;

        res.status(statusCode).json({
            status: 'error',
            message: message,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        });
    }

    /**
     * Not found handler
     */
    static notFound(req, res) {
        res.status(404).json({
            status: 'error',
            message: `Route ${req.originalUrl} tidak ditemukan`
        });
    }
}

module.exports = ExceptionHandler;
