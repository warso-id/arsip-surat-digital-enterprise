// ==================== VALIDATION MIDDLEWARE ====================
// Arsip Surat Digital Enterprise

const { validationResult } = require('express-validator');

class ValidationMiddleware {
    /**
     * Validate request
     */
    static validate(req, res, next) {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            // Format errors
            const formattedErrors = errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value,
            }));

            return res.status(422).json({
                success: false,
                message: 'Validasi gagal',
                errors: formattedErrors,
            });
        }

        return next();
    }

    /**
     * Sanitize input
     */
    static sanitize(req, res, next) {
        // Sanitize string fields
        if (req.body) {
            Object.keys(req.body).forEach(key => {
                if (typeof req.body[key] === 'string') {
                    req.body[key] = req.body[key].trim();
                    
                    // Prevent XSS
                    req.body[key] = req.body[key]
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                }
            });
        }

        return next();
    }

    /**
     * Validate file upload
     */
    static validateFile(req, res, next) {
        if (!req.file && !req.files) {
            return next();
        }

        const files = req.files || [req.file];
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/gif',
        ];

        for (const file of files) {
            if (file.size > maxSize) {
                return res.status(400).json({
                    success: false,
                    message: `File ${file.originalname} terlalu besar. Maksimal 10MB.`,
                });
            }

            if (!allowedTypes.includes(file.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: `Tipe file ${file.originalname} tidak diizinkan.`,
                });
            }
        }

        return next();
    }

    /**
     * Validate ID parameter
     */
    static validateId(req, res, next) {
        const id = parseInt(req.params.id);
        
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID tidak valid',
            });
        }

        return next();
    }

    /**
     * Validate date range
     */
    static validateDateRange(req, res, next) {
        const { start_date, end_date } = req.query;

        if (start_date && !this.isValidDate(start_date)) {
            return res.status(400).json({
                success: false,
                message: 'Format tanggal mulai tidak valid',
            });
        }

        if (end_date && !this.isValidDate(end_date)) {
            return res.status(400).json({
                success: false,
                message: 'Format tanggal akhir tidak valid',
            });
        }

        if (start_date && end_date && start_date > end_date) {
            return res.status(400).json({
                success: false,
                message: 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir',
            });
        }

        return next();
    }

    /**
     * Validate pagination params
     */
    static validatePagination(req, res, next) {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 15;

        if (page < 1) page = 1;
        if (limit < 1) limit = 1;
        if (limit > 100) limit = 100;

        req.query.page = page;
        req.query.limit = limit;

        return next();
    }

    /**
     * Check if date is valid
     */
    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) && 
               dateString.match(/^\d{4}-\d{2}-\d{2}$/);
    }
}

module.exports = ValidationMiddleware;
