// AuthController.js - Enterprise Authentication Controller
class AuthController {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
    }

    async login(email, password) {
        try {
            const payload = this.encodeData({
                action: 'auth_login',
                email: email,
                password: this.hashPassword(password),
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decodeData(result.data);

            if (data.success) {
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user_data', JSON.stringify(data.user));
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
            const payload = this.encodeData({
                action: 'auth_register',
                nama: userData.nama,
                email: userData.email,
                password: this.hashPassword(userData.password),
                role_id: userData.role_id || 2,
                instansi_id: userData.instansi_id,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decodeData(result.data);

            return { success: data.success, message: data.message };

        } catch (error) {
            console.error('Register error:', error);
            return { success: false, message: 'Gagal mendaftar' };
        }
    }

    async logout() {
        try {
            const token = localStorage.getItem('auth_token');
            
            const payload = this.encodeData({
                action: 'auth_logout',
                token: token,
                timestamp: Date.now()
            });

            await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            window.location.href = '/login';
        }
    }

    async forgotPassword(email) {
        try {
            const payload = this.encodeData({
                action: 'auth_forgot_password',
                email: email,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decodeData(result.data);

            return { success: data.success, message: data.message };

        } catch (error) {
            console.error('Forgot password error:', error);
            return { success: false, message: 'Gagal mengirim reset password' };
        }
    }

    async resetPassword(token, newPassword) {
        try {
            const payload = this.encodeData({
                action: 'auth_reset_password',
                token: token,
                password: this.hashPassword(newPassword),
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decodeData(result.data);

            return { success: data.success, message: data.message };

        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, message: 'Gagal reset password' };
        }
    }

    isAuthenticated() {
        const token = localStorage.getItem('auth_token');
        return !!token;
    }

    getCurrentUser() {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    }

    hashPassword(password) {
        // Simple hash for demo - use proper hashing in production
        return btoa(password + 'enterprise_salt_2026');
    }

    encodeData(data) {
        return btoa(encodeURIComponent(JSON.stringify(data)));
    }

    decodeData(encoded) {
        try {
            return JSON.parse(decodeURIComponent(atob(encoded)));
        } catch (error) {
            return {};
        }
    }
}

// Export untuk digunakan di controller lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthController;
}
