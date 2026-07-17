// AuthMiddleware.js - Enterprise Authentication Middleware
class AuthMiddleware {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
    }

    async handle(request, response, next) {
        const currentPath = window.location.pathname;
        
        // Allow public routes
        if (this.publicRoutes.includes(currentPath)) {
            return next();
        }

        // Check token
        const token = localStorage.getItem('auth_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        // Verify token with server
        try {
            const isValid = await this.verifyToken(token);
            if (!isValid) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_data');
                window.location.href = '/login';
                return;
            }

            // Token valid, proceed
            return next();

        } catch (error) {
            console.error('Auth middleware error:', error);
            window.location.href = '/login';
        }
    }

    async verifyToken(token) {
        try {
            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'auth_verify_token',
                token: token,
                timestamp: Date.now()
            })));

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = JSON.parse(decodeURIComponent(atob(result.data)));
            
            return data.valid === true;

        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    }

    async refreshToken() {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return false;

            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'auth_refresh_token',
                token: token,
                timestamp: Date.now()
            })));

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = JSON.parse(decodeURIComponent(atob(result.data)));

            if (data.success && data.token) {
                localStorage.setItem('auth_token', data.token);
                return true;
            }

            return false;

        } catch (error) {
            console.error('Token refresh error:', error);
            return false;
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthMiddleware;
}
