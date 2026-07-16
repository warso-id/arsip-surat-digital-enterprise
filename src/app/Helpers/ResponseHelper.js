// ==================== RESPONSE HELPER ====================
// Arsip Surat Digital Enterprise

class ResponseHelper {
    /**
     * Success response
     */
    static success(res, data = null, message = 'Success', statusCode = 200) {
        const response = {
            success: true,
            message: message,
        };

        if (data !== null) {
            response.data = data;
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Success with pagination
     */
    static successWithPagination(res, data, pagination, message = 'Success') {
        return res.status(200).json({
            success: true,
            message: message,
            data: data,
            pagination: pagination,
        });
    }

    /**
     * Created response
     */
    static created(res, data = null, message = 'Resource created successfully') {
        return this.success(res, data, message, 201);
    }

    /**
     * Error response
     */
    static error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
        const response = {
            success: false,
            message: message,
        };

        if (errors) {
            response.errors = errors;
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Bad request response
     */
    static badRequest(res, message = 'Bad Request', errors = null) {
        return this.error(res, message, 400, errors);
    }

    /**
     * Unauthorized response
     */
    static unauthorized(res, message = 'Unauthorized') {
        return this.error(res, message, 401);
    }

    /**
     * Forbidden response
     */
    static forbidden(res, message = 'Forbidden') {
        return this.error(res, message, 403);
    }

    /**
     * Not found response
     */
    static notFound(res, message = 'Resource not found') {
        return this.error(res, message, 404);
    }

    /**
     * Validation error response
     */
    static validationError(res, errors, message = 'Validation failed') {
        return this.error(res, message, 422, errors);
    }

    /**
     * Too many requests response
     */
    static tooManyRequests(res, message = 'Too many requests. Please try again later.') {
        return this.error(res, message, 429);
    }

    /**
     * Server error response
     */
    static serverError(res, error = null, message = 'Internal Server Error') {
        // Log error for debugging
        if (error) {
            console.error('Server Error:', error);
        }

        // Don't expose error details in production
        const responseMessage = process.env.NODE_ENV === 'production' 
            ? message 
            : `${message}: ${error?.message || 'Unknown error'}`;

        return this.error(res, responseMessage, 500);
    }

    /**
     * File download response
     */
    static download(res, filePath, filename, mimeType = 'application/octet-stream') {
        return res.download(filePath, filename, {
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    }

    /**
     * File stream response
     */
    static stream(res, stream, filename, mimeType = 'application/octet-stream') {
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        stream.pipe(res);
    }

    /**
     * Redirect response
     */
    static redirect(res, url, statusCode = 302) {
        return res.redirect(statusCode, url);
    }

    /**
     * Render view response
     */
    static render(res, view, data = {}) {
        return res.render(view, data);
    }

    /**
     * JSON with status code
     */
    static json(res, data, statusCode = 200) {
        return res.status(statusCode).json(data);
    }

    /**
     * No content response
     */
    static noContent(res) {
        return res.status(204).send();
    }
}

module.exports = ResponseHelper;
