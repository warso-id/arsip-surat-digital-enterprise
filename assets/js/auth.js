/* ============================================
   ENTERPRISE AUTH - Authentication Service
   ============================================ */
(function() {
    'use strict';

    class EnterpriseAuth {
        constructor() {
            this.currentUser = null;
            this.token = null;
            this.refreshToken = null;
            this.sessionTimeout = null;
            this.loginAttempts = 0;
            this.isLocked = false;
            this.lockTimeout = null;
            
            this.init();
        }

        async init() {
            // Restore session from localStorage
            const savedSession = localStorage.getItem('auth_session');
            if (savedSession) {
                try {
                    const session = JSON.parse(Base64Util.decode(savedSession));
                    if (session.token && session.expiry > Date.now()) {
                        this.token = session.token;
                        this.currentUser = session.user;
                        this.setupSessionTimeout();
                        Logger.info('Session restored');
                    } else {
                        this.clearSession();
                    }
                } catch (e) {
                    this.clearSession();
                }
            }
        }

        async login(username, password) {
            // Check if account is locked
            if (this.isLocked) {
                throw new Error('Akun terkunci. Silakan coba lagi dalam 15 menit.');
            }

            // Check login attempts
            if (this.loginAttempts >= APP_CONFIG.SECURITY.MAX_LOGIN_ATTEMPTS) {
                this.lockAccount();
                throw new Error('Terlalu banyak percobaan login. Akun dikunci selama 15 menit.');
            }

            try {
                const encodedPassword = Base64Util.encode(password);
                
                // Try online login first
                let response;
                try {
                    response = await API.request('login', {
                        method: 'POST',
                        body: {
                            username: Base64Util.encode(username),
                            password: encodedPassword
                        }
                    });
                } catch (error) {
                    // Fallback to offline login
                    response = await this.offlineLogin(username, encodedPassword);
                }

                if (response.success) {
                    this.loginAttempts = 0;
                    this.setSession(response.data);
                    Logger.info('Login successful');
                    return response.data;
                } else {
                    this.loginAttempts++;
                    throw new Error(response.message || 'Login gagal');
                }

            } catch (error) {
                this.loginAttempts++;
                Logger.error('Login failed:', error);
                throw error;
            }
        }

        async offlineLogin(username, password) {
            // Check against local user database
            const users = await DB.getAll('users') || [];
            const user = users.find(u => 
                Base64Util.decode(u.username) === username && 
                u.password === password
            );

            if (user) {
                return {
                    success: true,
                    data: {
                        user: Base64Util.decodeObject(user, ['username', 'nama', 'role']),
                        token: this.generateOfflineToken(),
                        offline: true
                    }
                };
            }

            // Default admin account for first-time offline use
            if (username === 'admin' && password === Base64Util.encode('admin123')) {
                return {
                    success: true,
                    data: {
                        user: {
                            username: 'admin',
                            nama: 'Administrator',
                            role: 'admin'
                        },
                        token: this.generateOfflineToken(),
                        offline: true,
                        firstLogin: true
                    }
                };
            }

            throw new Error('Username atau password salah');
        }

        setSession(data) {
            this.currentUser = data.user;
            this.token = data.token;
            
            if (data.refreshToken) {
                this.refreshToken = data.refreshToken;
            }

            const session = {
                user: this.currentUser,
                token: this.token,
                refreshToken: this.refreshToken,
                expiry: Date.now() + APP_CONFIG.SECURITY.TOKEN_EXPIRY
            };

            localStorage.setItem('auth_session', Base64Util.encode(JSON.stringify(session)));
            this.setupSessionTimeout();
            
            // Update UI
            document.getElementById('user-name').textContent = this.currentUser.nama;
        }

        setupSessionTimeout() {
            if (this.sessionTimeout) {
                clearTimeout(this.sessionTimeout);
            }

            this.sessionTimeout = setTimeout(() => {
                this.logout('Sesi berakhir. Silakan login kembali.');
            }, APP_CONFIG.SECURITY.SESSION_TIMEOUT);

            // Reset timeout on user activity
            this.setupActivityListeners();
        }

        setupActivityListeners() {
            const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
            const resetTimeout = () => {
                clearTimeout(this.sessionTimeout);
                this.sessionTimeout = setTimeout(() => {
                    this.logout('Sesi berakhir karena tidak ada aktivitas.');
                }, APP_CONFIG.SECURITY.SESSION_TIMEOUT);
            };

            events.forEach(event => {
                document.addEventListener(event, resetTimeout, { once: true });
            });
        }

        async logout(message = 'Anda telah keluar dari sistem.') {
            try {
                await API.request('logout', {
                    method: 'POST',
                    body: { token: this.token }
                });
            } catch (error) {
                // Ignore logout errors
            }

            this.clearSession();
            
            // Show notification
            if (message) {
                window.showToast(message, 'info');
            }

            // Redirect to login or reload
            window.location.hash = '#/login';
        }

        clearSession() {
            this.currentUser = null;
            this.token = null;
            this.refreshToken = null;
            
            if (this.sessionTimeout) {
                clearTimeout(this.sessionTimeout);
            }

            localStorage.removeItem('auth_session');
            document.getElementById('user-name').textContent = 'Guest';
        }

        lockAccount() {
            this.isLocked = true;
            this.lockTimeout = setTimeout(() => {
                this.isLocked = false;
                this.loginAttempts = 0;
                Logger.info('Account unlocked');
            }, 900000); // 15 minutes
        }

        generateOfflineToken() {
            const payload = {
                user: this.currentUser?.username || 'admin',
                timestamp: Date.now(),
                random: Math.random().toString(36)
            };
            return Base64Util.encode(JSON.stringify(payload));
        }

        getToken() {
            return this.token;
        }

        isAuthenticated() {
            return !!this.token && !!this.currentUser;
        }

        hasRole(role) {
            return this.currentUser?.role === role;
        }

        async refreshSession() {
            if (!this.refreshToken) return false;

            try {
                const response = await API.request('refreshToken', {
                    method: 'POST',
                    body: { refreshToken: this.refreshToken }
                });

                if (response.success) {
                    this.token = response.data.token;
                    return true;
                }
            } catch (error) {
                Logger.error('Token refresh failed');
            }

            return false;
        }

        async changePassword(oldPassword, newPassword) {
            const encodedOld = Base64Util.encode(oldPassword);
            const encodedNew = Base64Util.encode(newPassword);

            try {
                const response = await API.request('changePassword', {
                    method: 'POST',
                    body: {
                        oldPassword: encodedOld,
                        newPassword: encodedNew
                    }
                });

                return response;
            } catch (error) {
                throw new Error('Gagal mengubah password');
            }
        }

        async register(userData) {
            const encodedData = Base64Util.encodeObject(userData, ['username', 'nama', 'password']);
            
            try {
                const response = await API.request('register', {
                    method: 'POST',
                    body: encodedData
                });
                return response;
            } catch (error) {
                throw new Error('Gagal mendaftarkan user');
            }
        }
    }

    // Initialize Global Auth
    window.Auth = new EnterpriseAuth();
    Logger.info('Enterprise Auth initialized');
})();
