// AuthService.js - Business Logic Authentication
class AuthService {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.tokenKey = 'auth_token';
        this.userKey = 'user_data';
        this.rememberKey = 'remember_me';
    }

    async login(email, password, rememberMe = false) {
        try {
            // Validasi input
            if (!email || !password) {
                return { success: false, message: 'Email dan password wajib diisi' };
            }

            // Hash password
            const hashedPassword = this.hashPassword(password);

            // Kirim request ke server
            const payload = this.encode({
                action: 'auth_login',
                email: email,
                password: hashedPassword,
                remember_me: rememberMe,
                timestamp: Date.now(),
                user_agent: navigator.userAgent
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);

            if (data.success) {
                // Simpan token dan data user
                this.setToken(data.token);
                this.setUser(data.user);
                
                if (rememberMe) {
                    localStorage.setItem(this.rememberKey, 'true');
                }

                // Log aktivitas login
                await this.logActivity('login', 'Login berhasil');

                return {
                    success: true,
                    user: data.user,
                    message: 'Login berhasil'
                };
            }

            // Log percobaan login gagal
            await this.logFailedLogin(email);

            return {
                success: false,
                message: data.message || 'Email atau password salah'
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
            // Validasi input
            const validation = this.validateRegistration(userData);
            if (!validation.valid) {
                return { success: false, message: validation.message };
            }

            // Hash password
            const hashedPassword = this.hashPassword(userData.password);

            const payload = this.encode({
                action: 'auth_register',
                nama: userData.nama,
                email: userData.email,
                password: hashedPassword,
                role_id: userData.role_id || 4,
                instansi_id: userData.instansi_id,
                jabatan: userData.jabatan || '',
                telepon: userData.telepon || '',
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);

            if (data.success) {
                await this.logActivity('register', `Registrasi user baru: ${userData.email}`);
            }

            return {
                success: data.success,
                message: data.message || 'Registrasi berhasil'
            };

        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                message: 'Gagal melakukan registrasi'
            };
        }
    }

    async logout() {
        try {
            const token = this.getToken();
            const user = this.getUser();

            if (token) {
                const payload = this.encode({
                    action: 'auth_logout',
                    token: token,
                    user_id: user?.id,
                    timestamp: Date.now()
                });

                await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: payload })
                });

                await this.logActivity('logout', 'Logout');
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuth();
            window.location.href = '/login';
        }
    }

    async forgotPassword(email) {
        try {
            if (!email || !this.isValidEmail(email)) {
                return { success: false, message: 'Format email tidak valid' };
            }

            const payload = this.encode({
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
            const data = this.decode(result.data);

            return {
                success: data.success,
                message: data.message || 'Link reset password telah dikirim ke email Anda'
            };

        } catch (error) {
            console.error('Forgot password error:', error);
            return {
                success: false,
                message: 'Gagal mengirim reset password'
            };
        }
    }

    async resetPassword(token, newPassword, confirmPassword) {
        try {
            if (newPassword !== confirmPassword) {
                return { success: false, message: 'Password tidak cocok' };
            }

            if (newPassword.length < 8) {
                return { success: false, message: 'Password minimal 8 karakter' };
            }

            const hashedPassword = this.hashPassword(newPassword);

            const payload = this.encode({
                action: 'auth_reset_password',
                token: token,
                password: hashedPassword,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);

            return {
                success: data.success,
                message: data.message || 'Password berhasil direset'
            };

        } catch (error) {
            console.error('Reset password error:', error);
            return {
                success: false,
                message: 'Gagal mereset password'
            };
        }
    }

    async checkAuth() {
        const token = this.getToken();
        if (!token) return false;

        try {
            const payload = this.encode({
                action: 'auth_verify_token',
                token: token,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);

            if (!data.valid) {
                await this.refreshToken();
                return this.getToken() !== null;
            }

            return true;

        } catch (error) {
            console.error('Check auth error:', error);
            return this.getToken() !== null;
        }
    }

    async refreshToken() {
        try {
            const token = this.getToken();
            if (!token) return false;

            const payload = this.encode({
                action: 'auth_refresh_token',
                token: token,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);

            if (data.success && data.token) {
                this.setToken(data.token);
                return true;
            }

            this.clearAuth();
            return false;

        } catch (error) {
            console.error('Refresh token error:', error);
            return false;
        }
    }

    async changePassword(oldPassword, newPassword) {
        try {
            const user = this.getUser();
            if (!user) return { success: false, message: 'User tidak ditemukan' };

            const payload = this.encode({
                action: 'auth_change_password',
                user_id: user.id,
                old_password: this.hashPassword(oldPassword),
                new_password: this.hashPassword(newPassword),
                token: this.getToken()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);

            return {
                success: data.success,
                message: data.message || 'Password berhasil diubah'
            };

        } catch (error) {
            console.error('Change password error:', error);
            return { success: false, message: 'Gagal mengubah password' };
        }
    }

    // Helper methods
    hashPassword(password) {
        let hashed = password;
        const salt = 'ArsipSuratEnterprise2026!@#$%^&*()';
        for (let i = 0; i < 10; i++) {
            hashed = btoa(hashed + salt + i);
        }
        return hashed;
    }

    generateToken(userId) {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            user_id: userId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 86400
        }));
        const signature = btoa(userId + 'enterprise_secret_' + Date.now());
        return `${header}.${payload}.${signature}`;
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    validateRegistration(data) {
        if (!data.nama || data.nama.trim() === '') {
            return { valid: false, message: 'Nama wajib diisi' };
        }
        if (!data.email || !this.isValidEmail(data.email)) {
            return { valid: false, message: 'Format email tidak valid' };
        }
        if (!data.password || data.password.length < 8) {
            return { valid: false, message: 'Password minimal 8 karakter' };
        }
        return { valid: true };
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    getUser() {
        try {
            const data = localStorage.getItem(this.userKey);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    setUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    clearAuth() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.rememberKey);
    }

    async logActivity(type, description) {
        try {
            const user = this.getUser();
            const payload = this.encode({
                action: 'log_activity',
                user_id: user?.id || 0,
                user_name: user?.nama || 'Unknown',
                activity_type: type,
                description: description,
                module: 'auth',
                ip_address: 'client',
                user_agent: navigator.userAgent,
                timestamp: Date.now()
            });

            await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });
        } catch (error) {
            console.error('Log activity error:', error);
        }
    }

    async logFailedLogin(email) {
        try {
            const payload = this.encode({
                action: 'log_failed_login',
                email: email,
                ip_address: 'client',
                user_agent: navigator.userAgent,
                timestamp: Date.now()
            });

            await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });
        } catch (error) {
            console.error('Log failed login error:', error);
        }
    }

    encode(data) {
        return btoa(encodeURIComponent(JSON.stringify(data)));
    }

    decode(encoded) {
        try {
            return JSON.parse(decodeURIComponent(atob(encoded)));
        } catch (error) {
            return {};
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
}
