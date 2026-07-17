// auth.js - Authentication Service
class AuthService {
    constructor() {
        this.token = localStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
        this.user = this.getUserData();
        this.isAuthenticated = this.token ? true : false;
    }

    getUserData() {
        try {
            const userData = localStorage.getItem(CONFIG.AUTH.USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (e) {
            return null;
        }
    }

    async login(username, password, remember = false) {
        try {
            const result = await api.login(username, password, remember);
            
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
                message: result.message || 'Login gagal. Periksa username dan password.'
            };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Gagal terhubung ke server. Periksa koneksi internet.'
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
                message: 'Gagal melakukan registrasi.'
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

    checkAuth() {
        if (!this.isAuthenticated) {
            return false;
        }
        return true;
    }
}

const auth = new AuthService();
console.log('Auth Service initialized, authenticated:', auth.isAuthenticated);
