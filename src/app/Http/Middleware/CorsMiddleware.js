// CorsMiddleware.js - CORS Handling Middleware
class CorsMiddleware {
    constructor() {
        this.allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:8080',
            'https://script.google.com'
        ];
        
        this.allowedMethods = [
            'GET',
            'POST',
            'PUT',
            'DELETE',
            'PATCH',
            'OPTIONS'
        ];
        
        this.allowedHeaders = [
            'Content-Type',
            'Authorization',
            'X-Enterprise-Token',
            'X-Request-ID',
            'X-App-Version'
        ];
        
        this.exposedHeaders = [
            'X-Request-ID',
            'X-Response-Time',
            'X-Rate-Limit-Remaining',
            'X-Rate-Limit-Reset'
        ];
        
        this.maxAge = 86400; // 24 hours
    }

    async handle(request) {
        const origin = this.getOrigin(request);
        
        // Check if origin is allowed
        if (!this.isOriginAllowed(origin)) {
            return {
                allowed: false,
                status: 403,
                message: 'Origin not allowed by CORS policy'
            };
        }

        // Handle preflight request
        if (this.isPreflight(request)) {
            return this.handlePreflight(origin);
        }

        // Handle actual request
        return this.handleActualRequest(origin);
    }

    isOriginAllowed(origin) {
        if (!origin) return true; // Allow same-origin requests
        if (this.allowedOrigins.includes('*')) return true;
        return this.allowedOrigins.includes(origin);
    }

    isPreflight(request) {
        return request.method === 'OPTIONS';
    }

    handlePreflight(origin) {
        const headers = {
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Methods': this.allowedMethods.join(', '),
            'Access-Control-Allow-Headers': this.allowedHeaders.join(', '),
            'Access-Control-Max-Age': this.maxAge.toString()
        };

        return {
            allowed: true,
            status: 204,
            headers: headers
        };
    }

    handleActualRequest(origin) {
        const headers = {
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Expose-Headers': this.exposedHeaders.join(', ')
        };

        if (this.allowedOrigins.includes('*') || !origin) {
            headers['Access-Control-Allow-Origin'] = '*';
        }

        return {
            allowed: true,
            headers: headers
        };
    }

    getOrigin(request) {
        return request.headers?.origin || request.headers?.Origin || null;
    }

    addAllowedOrigin(origin) {
        if (!this.allowedOrigins.includes(origin)) {
            this.allowedOrigins.push(origin);
        }
    }

    removeAllowedOrigin(origin) {
        this.allowedOrigins = this.allowedOrigins.filter(o => o !== origin);
    }

    setAllowedMethods(methods) {
        this.allowedMethods = methods;
    }

    setAllowedHeaders(headers) {
        this.allowedHeaders = headers;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CorsMiddleware;
}
