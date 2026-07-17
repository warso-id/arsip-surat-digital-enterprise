// auth.js - Authentication Service (FIXED)
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
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    }

    validateToken() {
        if (!this.token) return false;
        
        try {
            // Simple token validation
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

    checkAuth() {
        if (!this.isAuthenticated) {
            // Tampilkan landing page, bukan error
            if (window.app) {
                window.app.showLandingPage();
            }
            return false;
        }
        return true;
    }

    showLoginForm() {
        // Cek apakah modal tersedia
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) {
            console.error('Modal body not found');
            return;
        }

        const modalTitle = document.getElementById('modal-title');
        const saveBtn = document.getElementById('modal-save-btn');
        
        if (modalTitle) {
            modalTitle.textContent = 'Masuk ke Sistem';
        }
        
        modalBody.innerHTML = `
            <form id="login-form" onsubmit="event.preventDefault(); window.app.handleLogin()">
                <div class="form-group">
                    <label><i class="fas fa-envelope"></i> Email</label>
                    <input type="email" id="login-email" class="form-control" 
                           placeholder="Masukkan email" required autocomplete="email">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-lock"></i> Password</label>
                    <input type="password" id="login-password" class="form-control" 
                           placeholder="Masukkan password" required autocomplete="current-password">
                </div>
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="login-remember">
                        <span>Ingat Saya</span>
                    </label>
                </div>
                <div id="login-error" class="alert alert-error" style="display: none;"></div>
            </form>
        `;
        
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
            saveBtn.onclick = () => {
                if (window.app) window.app.handleLogin();
            };
        }
        
        // Tampilkan modal
        if (window.app) {
            window.app.showModal();
        }
        
        // Focus pada input email
        setTimeout(() => {
            const emailInput = document.getElementById('login-email');
            if (emailInput) emailInput.focus();
        }, 100);
    }
}

// Create global instance
const auth = new AuthService();
console.log('Auth Service initialized');
