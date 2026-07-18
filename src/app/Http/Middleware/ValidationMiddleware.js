const { validationResult } = require('express-validator');
const ResponseHelper = require('../../Helpers/ResponseHelper');

class ValidationMiddleware {
    /**
     * Validate request
     */
    static validate(validations) {
        return async (req, res, next) => {
            // Run all validations
            for (let validation of validations) {
                const result = await validation.run(req);
                if (result.errors.length) break;
            }

            // Check for errors
            const errors = validationResult(req);
            
            if (errors.isEmpty()) {
                return next();
            }

            // Format errors
            const formattedErrors = errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }));

            return ResponseHelper.validationError(res, 'Validasi gagal', formattedErrors);
        };
    }

    /**
     * Sanitize input
     */
    static sanitize(req, res, next) {
        // Sanitize body
        if (req.body) {
            Object.keys(req.body).forEach(key => {
                if (typeof req.body[key] === 'string') {
                    req.body[key] = req.body[key].trim();
                    // Prevent XSS
                    req.body[key] = req.body[key].replace(/<[^>]*>/g, '');
                }
            });
        }

        // Sanitize query
        if (req.query) {
            Object.keys(req.query).forEach(key => {
                if (typeof req.query[key] === 'string') {
                    req.query[key] = req.query[key].trim();
                    req.query[key] = req.query[key].replace(/<[^>]*>/g, '');
                }
            });
        }

        next();
    }

    /**
     * Validate ID parameter
     */
    static validateId(req, res, next) {
        const id = req.params.id;
        
        if (!id || isNaN(id) || parseInt(id) <= 0) {
            return ResponseHelper.error(res, 'ID tidak valid', 400);
        }

        next();
    }

    /**
     * Validate pagination
     */
    static validatePagination(req, res, next) {
        let { page = 1, perPage = 20 } = req.query;
        
        page = parseInt(page);
        perPage = parseInt(perPage);

        if (isNaN(page) || page < 1) {
            req.query.page = 1;
        }

        if (isNaN(perPage) || perPage < 1) {
            req.query.perPage = 20;
        } else if (perPage > 100) {
            req.query.perPage = 100;
        }

        next();
    }
}

module.exports = ValidationMiddleware;
