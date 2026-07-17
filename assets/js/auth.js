// Authentication Service
class AuthService {
    constructor() {
        this.token = localStorage.getItem(APP_CONFIG.auth.tokenKey);
        this.user = JSON.parse(localStorage.getItem(APP_CONFIG.auth.userKey) || 'null');
        this.isAuthenticated = !!this.token;
    }

    async login(username, password) {
        try {
            const result = await apiService.login(username, password);
            
            if (result.success) {
                this.token = result.token;
                this.user = result.user;
                this.isAuthenticated = true;
                return { success: true, user: result.user };
            }
            
            return { success: false, message: result.message || 'Login gagal' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Terjadi kesalahan saat login' };
        }
    }

    async register(userData) {
        try {
            const result = await apiService.register(userData);
            return result;
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, message: 'Terjadi kesalahan saat registrasi' };
        }
    }

    async logout() {
        try {
            await apiService.logout();
        } finally {
            this.token = null;
            this.user = null;
            this.isAuthenticated = false;
            localStorage.removeItem(APP_CONFIG.auth.tokenKey);
            localStorage.removeItem(APP_CONFIG.auth.userKey);
            window.location.reload();
        }
    }

    checkAuth() {
        if (!this.isAuthenticated) {
            this.showLoginForm();
            return false;
        }

        // Check token expiry
        const tokenData = this.decodeToken(this.token);
        if (tokenData && tokenData.exp < Date.now()) {
            this.logout();
            return false;
        }

        return true;
    }

    decodeToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            return null;
        }
    }

    getUser() {
        return this.user;
    }

    hasRole(role) {
        return this.user && this.user.role === role;
    }

    showLoginForm() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <img src="assets/images/logo.png" alt="Logo" class="auth-logo" onerror="this.style.display='none'">
                        <h2>Login Sistem Arsip Surat Digital</h2>
                        <p>Masuk untuk mengelola arsip surat</p>
                    </div>
                    <form id="loginForm" class="auth-form" onsubmit="handleLogin(event)">
                        <div class="form-group">
                            <label for="username">
                                <i class="fas fa-user"></i> Username
                            </label>
                            <input type="text" id="username" name="username" 
                                   class="form-control" required 
                                   placeholder="Masukkan username">
                        </div>
                        <div class="form-group">
                            <label for="password">
                                <i class="fas fa-lock"></i> Password
                            </label>
                            <div class="password-input">
                                <input type="password" id="password" name="password" 
                                       class="form-control" required 
                                       placeholder="Masukkan password">
                                <button type="button" class="toggle-password" 
                                        onclick="togglePassword('password')">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                        <div class="form-group form-check">
                            <input type="checkbox" id="rememberMe" name="rememberMe">
                            <label for="rememberMe">Ingat saya</label>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">
                            <i class="fas fa-sign-in-alt"></i> Masuk
                        </button>
                    </form>
                    <div class="auth-footer">
                        <p>Belum punya akun? 
                            <a href="#" onclick="showRegisterForm(event)">Daftar disini</a>
                        </p>
                        <a href="#" onclick="showForgotPassword()">Lupa password?</a>
                    </div>
                </div>
            </div>
        `;
    }

    showRegisterForm() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <h2>Registrasi Pengguna Baru</h2>
                        <p>Daftar untuk menggunakan sistem</p>
                    </div>
                    <form id="registerForm" class="auth-form" onsubmit="handleRegister(event)">
                        <div class="form-group">
                            <label for="fullName">Nama Lengkap</label>
                            <input type="text" id="fullName" name="fullName" 
                                   class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="regUsername">Username</label>
                            <input type="text" id="regUsername" name="username" 
                                   class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" 
                                   class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="regPassword">Password</label>
                            <input type="password" id="regPassword" name="password" 
                                   class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="confirmPassword">Konfirmasi Password</label>
                            <input type="password" id="confirmPassword" 
                                   name="confirmPassword" class="form-control" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">
                            <i class="fas fa-user-plus"></i> Daftar
                        </button>
                    </form>
                    <div class="auth-footer">
                        <p>Sudah punya akun? 
                            <a href="#" onclick="showLoginForm()">Login disini</a>
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Inisialisasi instance global
const authService = new AuthService();

// Global functions untuk auth
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    authService.login(username, password).then(result => {
        if (result.success) {
            if (rememberMe) {
                localStorage.setItem('rememberedUser', username);
            }
            app.init();
        } else {
            app.showNotification(result.message, 'error');
        }
    });
}

function handleRegister(event) {
    event.preventDefault();
    
    const userData = {
        fullName: document.getElementById('fullName').value,
        username: document.getElementById('regUsername').value,
        email: document.getElementById('email').value,
        password: document.getElementById('regPassword').value
    };

    const confirmPassword = document.getElementById('confirmPassword').value;

    if (userData.password !== confirmPassword) {
        app.showNotification('Password tidak cocok', 'error');
        return;
    }

    authService.register(userData).then(result => {
        if (result.success) {
            app.showNotification('Registrasi berhasil! Silakan login', 'success');
            authService.showLoginForm();
        } else {
            app.showNotification(result.message, 'error');
        }
    });
}

function showLoginForm() {
    authService.showLoginForm();
}

function showRegisterForm(event) {
    if (event) event.preventDefault();
    authService.showRegisterForm();
}

function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        authService.logout();
    }
}

function showForgotPassword() {
    app.showNotification('Fitur lupa password sedang dalam pengembangan', 'info');
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}
