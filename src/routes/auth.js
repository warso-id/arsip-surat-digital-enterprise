// auth.js - Authentication Routes Configuration
const AuthRoutes = {
    // API endpoint for authentication
    apiUrl: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
    
    // Auth endpoints
    endpoints: {
        login: { action: 'auth_login', method: 'POST' },
        register: { action: 'auth_register', method: 'POST' },
        logout: { action: 'auth_logout', method: 'POST' },
        forgotPassword: { action: 'auth_forgot_password', method: 'POST' },
        resetPassword: { action: 'auth_reset_password', method: 'POST' },
        verifyToken: { action: 'auth_verify_token', method: 'POST' },
        refreshToken: { action: 'auth_refresh_token', method: 'POST' },
        changePassword: { action: 'auth_change_password', method: 'POST' }
    },
    
    // Auth guard configuration
    guard: {
        enabled: true,
        loginRoute: '/login',
        dashboardRoute: '/dashboard',
        publicRoutes: [
            '/login',
            '/register',
            '/forgot-password',
            '/reset-password',
            '/offline'
        ]
    }
};

class AuthRouter {
    constructor() {
        this.apiUrl = AuthRoutes.apiUrl;
        this.tokenKey = 'auth_token';
        this.userKey = 'user_data';
    }

    async login(email, password, rememberMe = false) {
        try {
            const hashedPassword = this.hashPassword(password);
            
            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'auth_login',
                email: email,
                password: hashedPassword,
                remember_me: rememberMe,
                timestamp: Date.now()
            })));

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = JSON.parse(decodeURIComponent(atob(result.data)));

            if (data.success) {
                this.setToken(data.token);
                this.setUser(data.user);
                
                if (rememberMe) {
                    localStorage.setItem('remember_me', 'true');
                }

                return { success: true, user: data.user };
            }

            return { success: false, message: data.message || 'Login gagal' };

        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Gagal terhubung ke server' };
        }
    }

    async register(userData) {
        try {
            const hashedPassword = this.hashPassword(userData.password);
            
            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'auth_register',
                nama: userData.nama,
                email: userData.email,
                password: hashedPassword,
                role_id: userData.role_id || 4,
                instansi_id: userData.instansi_id,
                jabatan: userData.jabatan || '',
                telepon: userData.telepon || '',
                timestamp: Date.now()
            })));

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = JSON.parse(decodeURIComponent(atob(result.data)));

            return {
                success: data.success,
                message: data.message || 'Registrasi berhasil'
            };

        } catch (error) {
            console.error('Register error:', error);
            return { success: false, message: 'Gagal melakukan registrasi' };
        }
    }

    async logout() {
        try {
            const token = this.getToken();
            
            if (token) {
                const payload = btoa(encodeURIComponent(JSON.stringify({
                    action: 'auth_logout',
                    token: token,
                    timestamp: Date.now()
                })));

                await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: payload })
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuth();
            window.location.href = '/login';
        }
    }

    async verifyToken() {
        const token = this.getToken();
        if (!token) return false;

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
            console.error('Verify token error:', error);
            return false;
        }
    }

    async refreshToken() {
        const token = this.getToken();
        if (!token) return false;

        try {
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
                this.setToken(data.token);
                return true;
            }

            return false;

        } catch (error) {
            console.error('Refresh token error:', error);
            return false;
        }
    }

    async checkAuth() {
        const token = this.getToken();
        if (!token) return false;

        const isValid = await this.verifyToken();
        if (!isValid) {
            const refreshed = await this.refreshToken();
            if (!refreshed) {
                this.clearAuth();
                return false;
            }
        }

        return true;
    }

    isAuthenticated() {
        return !!this.getToken();
    }

    getCurrentUser() {
        try {
            const data = localStorage.getItem(this.userKey);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    hasRole(requiredRole) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        const roleHierarchy = {
            'superadmin': 4,
            'admin': 3,
            'operator': 2,
            'viewer': 1
        };
        
        const userLevel = roleHierarchy[user.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;
        
        return userLevel >= requiredLevel;
    }

    hashPassword(password) {
        let hashed = password;
        const salt = 'ArsipSuratEnterprise2026!@#$%^&*()';
        for (let i = 0; i < 10; i++) {
            hashed = btoa(hashed + salt + i);
        }
        return hashed;
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    setUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    clearAuth() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem('remember_me');
    }
}

// Initialize auth router
const authRouter = new AuthRouter();
window.authRouter = authRouter;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthRoutes, AuthRouter };
}
