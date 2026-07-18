class ResponseHelper {
    /**
     * Success response
     */
    static success(res, message = 'Success', data = null, statusCode = 200) {
        const response = {
            status: 'success',
            message: message
        };

        if (data !== null) {
            response.data = data;
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Error response
     */
    static error(res, message = 'Error', statusCode = 400, errors = null) {
        const response = {
            status: 'error',
            message: message
        };

        if (errors) {
            response.errors = errors;
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Validation error response
     */
    static validationError(res, message = 'Validation Error', errors = []) {
        return res.status(422).json({
            status: 'error',
            message: message,
            errors: errors
        });
    }

    /**
     * Not found response
     */
    static notFound(res, message = 'Resource not found') {
        return res.status(404).json({
            status: 'error',
            message: message
        });
    }

    /**
     * Unauthorized response
     */
    static unauthorized(res, message = 'Unauthorized') {
        return res.status(401).json({
            status: 'error',
            message: message
        });
    }

    /**
     * Forbidden response
     */
    static forbidden(res, message = 'Forbidden') {
        return res.status(403).json({
            status: 'error',
            message: message
        });
    }

    /**
     * Paginated response
     */
    static paginated(res, message = 'Success', data = [], pagination = {}) {
        return res.status(200).json({
            status: 'success',
            message: message,
            data: data,
            pagination: {
                total: pagination.total || 0,
                per_page: pagination.perPage || 20,
                current_page: pagination.currentPage || 1,
                last_page: pagination.totalPages || 1,
                from: pagination.from || null,
                to: pagination.to || null
            }
        });
    }

    /**
     * Created response
     */
    static created(res, message = 'Created successfully', data = null) {
        return this.success(res, message, data, 201);
    }

    /**
     * No content response
     */
    static noContent(res) {
        return res.status(204).send();
    }

    /**
     * Bad request response
     */
    static badRequest(res, message = 'Bad request', errors = null) {
        return this.error(res, message, 400, errors);
    }

    /**
     * Too many requests response
     */
    static tooManyRequests(res, message = 'Too many requests') {
        return res.status(429).json({
            status: 'error',
            message: message
        });
    }

    /**
     * Server error response
     */
    static serverError(res, message = 'Internal server error') {
        return res.status(500).json({
            status: 'error',
            message: message
        });
    }

    /**
     * Send file response
     */
    static file(res, filePath, fileName, mimeType = 'application/octet-stream') {
        return res.download(filePath, fileName, {
            headers: {
                'Content-Type': mimeType
            }
        });
    }

    /**
     * Stream file response
     */
    static stream(res, stream, fileName, mimeType = 'application/octet-stream') {
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        stream.pipe(res);
    }
}

module.exports = ResponseHelper;
