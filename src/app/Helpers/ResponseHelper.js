// ResponseHelper.js - Standard Response Helper
class ResponseHelper {
    static success(data = null, message = 'Success', code = 200) {
        return {
            success: true,
            code: code,
            message: message,
            data: data,
            timestamp: new Date().toISOString()
        };
    }

    static error(message = 'Error', code = 500, errors = null) {
        return {
            success: false,
            code: code,
            message: message,
            errors: errors,
            timestamp: new Date().toISOString()
        };
    }

    static paginated(data, total, page, limit, message = 'Success') {
        return {
            success: true,
            code: 200,
            message: message,
            data: data,
            pagination: {
                total: total,
                page: page,
                limit: limit,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total
            },
            timestamp: new Date().toISOString()
        };
    }

    static validationError(errors) {
        return {
            success: false,
            code: 422,
            message: 'Validation error',
            errors: errors,
            timestamp: new Date().toISOString()
        };
    }

    static unauthorized(message = 'Unauthorized') {
        return {
            success: false,
            code: 401,
            message: message,
            timestamp: new Date().toISOString()
        };
    }

    static forbidden(message = 'Forbidden') {
        return {
            success: false,
            code: 403,
            message: message,
            timestamp: new Date().toISOString()
        };
    }

    static notFound(message = 'Not found') {
        return {
            success: false,
            code: 404,
            message: message,
            timestamp: new Date().toISOString()
        };
    }

    static created(data = null, message = 'Created successfully') {
        return this.success(data, message, 201);
    }

    static updated(data = null, message = 'Updated successfully') {
        return this.success(data, message, 200);
    }

    static deleted(message = 'Deleted successfully') {
        return this.success(null, message, 200);
    }

    static encode(response) {
        return btoa(encodeURIComponent(JSON.stringify(response)));
    }

    static decode(encoded) {
        try {
            return JSON.parse(decodeURIComponent(atob(encoded)));
        } catch (error) {
            return ResponseHelper.error('Failed to decode response');
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResponseHelper;
}
