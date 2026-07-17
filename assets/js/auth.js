// auth.js - Authentication Service
class AuthService {
    constructor() {
        this.token = localStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
        this.user = this.getUserData();
        this.isAuthenticated = this.validateToken();
    }

    getUserData() {
        try {
            const userData = localStorage.getItem(CONFIG.AUTH.USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch {
            return null;
        }
    }

    validateToken() {
        if (!this.token) return false;
        
        try {
            // Simple token validation (bisa diperluas dengan JWT decode)
            const tokenParts = this.token.split('.');
            if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                if (payload.exp && payload.exp < Date.now() / 1000) {
                    this.clearAuth();
                    return false;
                }
            }
            return true;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }

    async login(email, password, remember = false) {
        try {
            const result = await api.login(email, password, remember);
            
            if (result.success) {
                this.token = result.token;
                this.user = result.user;
                this.isAuthenticated = true;
                return {
                    success: true,
                    user: result.user,
                    message: 'Login berhasil'
                };
            }
            
            return {
                success: false,
                message: result.message || 'Email atau password salah'
            };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Gagal terhubung ke server. Periksa koneksi internet Anda.'
            };
        }
    }

    async register(userData) {
        try {
            const result = await api.register(userData);
            return {
                success: result.success,
                message: result.message || 'Registrasi berhasil'
            };
        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                message: 'Gagal melakukan registrasi. Silakan coba lagi.'
            };
        }
    }

    async logout() {
        await api.logout();
        this.clearAuth();
    }

    clearAuth() {
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;
        localStorage.removeItem(CONFIG.AUTH.TOKEN_KEY);
        localStorage.removeItem(CONFIG.AUTH.USER_KEY);
        localStorage.removeItem(CONFIG.AUTH.REMEMBER_KEY);
    }

    getUser() {
        return this.user;
    }

    hasRole(role) {
        return this.user && this.user.role === role;
    }

    hasPermission(permission) {
        return this.user && this.user.permissions && 
               this.user.permissions.includes(permission);
    }

    refreshUserData() {
        this.user = this.getUserData();
    }
}

// Create global instance
const auth = new AuthService();
console.log('Auth Service initialized, authenticated:', auth.isAuthenticated);
