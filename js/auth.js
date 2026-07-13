/**
 * ============================================
 * AUTH.JS - Authentication & Session Management
 * ARSIP SURAT DIGITAL v3.2.2
 * Enhanced with Material Design 3 & Responsive UI
 * ============================================
 */

const Auth = {
    // ========== SESSION STATE ==========
    sessionTimeout: 30 * 60 * 1000, // 30 menit
    refreshInterval: null,
    lastActivity: Date.now(),
    deviceInfo: null,
    
    /**
     * Inisialisasi Auth Module
     */
    init() {
        this.deviceInfo = this.getDeviceInfo();
        this.setupActivityTracking();
        this.setupSecurityEventListeners();
        console.log('Auth Module Initialized', this.deviceInfo);
    },

    /**
     * Deteksi Device & OS untuk Responsive Layout
     */
    getDeviceInfo() {
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        return {
            isWindows: platform.includes('Win'),
            isMac: platform.includes('Mac'),
            isLinux: platform.includes('Linux'),
            isIOS: /iPad|iPhone|iPod/.test(ua),
            isAndroid: /Android/.test(ua),
            isMobile: /Mobi|Android/i.test(ua),
            isTablet: /iPad|Tablet|PlayBook/i.test(ua) || (this.isMobile && screen.width >= 768),
            screenWidth: screen.width,
            screenHeight: screen.height,
            devicePixelRatio: window.devicePixelRatio || 1,
            orientation: screen.width > screen.height ? 'landscape' : 'portrait',
            browser: this.detectBrowser(ua),
            touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0
        };
    },

    /**
     * Deteksi Browser
     */
    detectBrowser(ua) {
        if (ua.includes('Firefox')) return 'firefox';
        if (ua.includes('SamsungBrowser')) return 'samsung';
        if (ua.includes('Opera') || ua.includes('OPR')) return 'opera';
        if (ua.includes('Edge')) return 'edge';
        if (ua.includes('Chrome')) return 'chrome';
        if (ua.includes('Safari')) return 'safari';
        return 'unknown';
    },

    // ========== LOGIN ENHANCED ==========
    async login(username, password, rememberMe = false) {
        try {
            // Validasi Input
            if (!username || !password) {
                throw new Error('Username dan password wajib diisi');
            }

            // Sanitasi Input
            const sanitizedUsername = this.sanitizeInput(username);
            
            // Device Fingerprint untuk Keamanan
            const deviceFingerprint = await this.generateDeviceFingerprint();
            
            // Kirim Request Login
            const response = await API.post('login', {
                username: sanitizedUsername,
                password: password,
                deviceInfo: this.deviceInfo,
                fingerprint: deviceFingerprint,
                rememberMe: rememberMe
            });

            // Handle Response
            if (response.status === 'success') {
                // Cek 2FA Required
                if (response.data.require2FA) {
                    return {
                        status: '2fa_required',
                        message: 'Verifikasi 2FA diperlukan',
                        tempToken: response.data.tempToken
                    };
                }

                // Simpan Session
                this.saveSession(response.data, rememberMe);
                
                // Setup Auto Refresh Token
                this.setupTokenRefresh(response.data.expiresIn);
                
                // Log Aktivitas Login
                this.logActivity('login_success', sanitizedUsername);
                
                return {
                    status: 'success',
                    message: 'Login berhasil',
                    user: response.data.user,
                    redirect: this.getRedirectUrl(response.data.user.role)
                };
            } else {
                throw new Error(response.message || 'Login gagal');
            }
        } catch (error) {
            this.logActivity('login_failed', username, error.message);
            throw new Error('Login gagal: ' + error.message);
        }
    },

    /**
     * Generate Device Fingerprint
     */
    async generateDeviceFingerprint() {
        const components = [
            navigator.userAgent,
            navigator.language,
            screen.colorDepth,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            !!navigator.cookieEnabled,
            !!navigator.doNotTrack,
            navigator.hardwareConcurrency || 'unknown',
            navigator.deviceMemory || 'unknown'
        ];
        
        const fingerprint = components.join('|');
        return await this.hashString(fingerprint);
    },

    /**
     * Simple Hash Function
     */
    async hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    // ========== REGISTER ENHANCED ==========
    async register(data) {
        try {
            // Validasi Input
            this.validateRegistrationData(data);
            
            // Sanitasi Data
            const sanitizedData = {
                username: this.sanitizeInput(data.username),
                email: data.email.toLowerCase().trim(),
                password: data.password,
                fullName: this.sanitizeInput(data.fullName),
                role: data.role || 'user',
                phone: data.phone ? data.phone.replace(/[^0-9+]/g, '') : '',
                deviceInfo: this.deviceInfo
            };

            // Password Strength Check
            const passwordStrength = this.checkPasswordStrength(sanitizedData.password);
            if (passwordStrength.score < 3) {
                throw new Error('Password terlalu lemah. ' + passwordStrength.feedback);
            }

            const response = await API.post('users.create', sanitizedData);
            
            if (response.status === 'success') {
                this.logActivity('register_success', sanitizedData.username);
                
                // Auto Login setelah Register (opsional)
                if (data.autoLogin) {
                    return await this.login(sanitizedData.username, data.password);
                }
            }
            
            return response;
        } catch (error) {
            this.logActivity('register_failed', data.username, error.message);
            throw new Error('Registrasi gagal: ' + error.message);
        }
    },

    /**
     * Validasi Data Registrasi
     */
    validateRegistrationData(data) {
        if (!data.username || data.username.length < 3) {
            throw new Error('Username minimal 3 karakter');
        }
        if (!data.email || !this.isValidEmail(data.email)) {
            throw new Error('Format email tidak valid');
        }
        if (!data.password || data.password.length < 8) {
            throw new Error('Password minimal 8 karakter');
        }
        if (!data.fullName || data.fullName.length < 2) {
            throw new Error('Nama lengkap wajib diisi');
        }
    },

    /**
     * Validasi Email
     */
    isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    },

    /**
     * Check Password Strength
     */
    checkPasswordStrength(password) {
        let score = 0;
        const feedback = [];

        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score < 3) feedback.push('Gunakan kombinasi huruf besar, kecil, angka, dan simbol');
        if (password.length < 8) feedback.push('Password minimal 8 karakter');

        return {
            score: score,
            strength: score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong',
            feedback: feedback.join('. ')
        };
    },

    // ========== SOCIAL LOGIN ==========
    async socialLogin(provider) {
        try {
            const providers = {
                google: {
                    url: 'https://accounts.google.com/o/oauth2/auth',
                    clientId: CONFIG.GOOGLE_CLIENT_ID,
                    scope: 'email profile',
                    responseType: 'code'
                },
                microsoft: {
                    url: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
                    clientId: CONFIG.MICROSOFT_CLIENT_ID,
                    scope: 'user.read',
                    responseType: 'code'
                }
            };

            if (!providers[provider]) {
                throw new Error('Provider tidak didukung');
            }

            const authUrl = this.buildOAuthUrl(providers[provider]);
            
            // Buka Popup OAuth
            const popup = window.open(
                authUrl,
                'oauth-popup',
                `width=500,height=600,left=${screen.width/2-250},top=${screen.height/2-300}`
            );

            // Listen untuk callback
            const code = await this.waitForOAuthCallback(popup);
            
            // Kirim code ke backend
            const response = await API.post(`auth/${provider}/callback`, {
                code: code,
                deviceInfo: this.deviceInfo
            });

            if (response.status === 'success') {
                this.saveSession(response.data);
                this.logActivity('social_login_success', provider);
                return response;
            }

            throw new Error(response.message);
        } catch (error) {
            this.logActivity('social_login_failed', provider, error.message);
            throw new Error(`Login ${provider} gagal: ${error.message}`);
        }
    },

    /**
     * Build OAuth URL
     */
    buildOAuthUrl(config) {
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: window.location.origin + '/oauth/callback',
            response_type: config.responseType,
            scope: config.scope,
            state: this.generateState()
        });
        return `${config.url}?${params.toString()}`;
    },

    /**
     * Generate State untuk OAuth Security
     */
    generateState() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Wait for OAuth Callback
     */
    waitForOAuthCallback(popup) {
        return new Promise((resolve, reject) => {
            const timer = setInterval(() => {
                if (popup.closed) {
                    clearInterval(timer);
                    reject(new Error('Popup ditutup oleh user'));
                }
                
                try {
                    if (popup.location.href.includes('code=')) {
                        const url = new URL(popup.location.href);
                        const code = url.searchParams.get('code');
                        popup.close();
                        clearInterval(timer);
                        resolve(code);
                    }
                } catch (e) {
                    // Cross-origin error, ignore
                }
            }, 500);

            // Timeout setelah 5 menit
            setTimeout(() => {
                clearInterval(timer);
                popup.close();
                reject(new Error('Timeout'));
            }, 300000);
        });
    },

    // ========== BIOMETRIC AUTH ==========
    async biometricLogin() {
        try {
            // Cek dukungan WebAuthn
            if (!window.PublicKeyCredential) {
                throw new Error('Biometric authentication tidak didukung');
            }

            // Cek credential tersimpan
            const credential = await this.getBiometricCredential();
            
            if (credential) {
                const response = await API.post('auth/biometric/verify', {
                    credential: credential,
                    deviceInfo: this.deviceInfo
                });
                
                if (response.status === 'success') {
                    this.saveSession(response.data);
                    this.logActivity('biometric_login_success');
                    return response;
                }
            }

            throw new Error('Biometric login gagal');
        } catch (error) {
            this.logActivity('biometric_login_failed', null, error.message);
            throw new Error('Biometric login gagal: ' + error.message);
        }
    },

    /**
     * Get Biometric Credential
     */
    async getBiometricCredential() {
        try {
            const publicKey = {
                challenge: new Uint8Array(32),
                rpId: window.location.hostname,
                allowCredentials: [],
                userVerification: 'required',
                timeout: 60000
            };

            const credential = await navigator.credentials.get({
                publicKey: publicKey,
                mediation: 'optional'
            });

            return credential;
        } catch (error) {
            console.error('Biometric error:', error);
            return null;
        }
    },

    /**
     * Register Biometric
     */
    async registerBiometric() {
        try {
            const user = App.getUser();
            if (!user) throw new Error('User tidak ditemukan');

            const publicKey = {
                challenge: new Uint8Array(32),
                rp: {
                    name: 'Arsip Surat Digital',
                    id: window.location.hostname
                },
                user: {
                    id: new Uint8Array(16),
                    name: user.email,
                    displayName: user.fullName
                },
                pubKeyCredParams: [{
                    type: 'public-key',
                    alg: -7 // ES256
                }],
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    userVerification: 'required',
                    residentKey: 'required'
                },
                timeout: 60000
            };

            const credential = await navigator.credentials.create({
                publicKey: publicKey
            });

            // Simpan credential ke backend
            await API.post('auth/biometric/register', {
                credential: credential,
                deviceInfo: this.deviceInfo
            });

            return { status: 'success', message: 'Biometric berhasil didaftarkan' };
        } catch (error) {
            throw new Error('Registrasi biometric gagal: ' + error.message);
        }
    },

    // ========== SESSION MANAGEMENT ==========
    saveSession(data, rememberMe = false) {
        const storage = rememberMe ? localStorage : sessionStorage;
        
        const sessionData = {
            token: data.token,
            refreshToken: data.refreshToken,
            user: data.user,
            expiresAt: Date.now() + (data.expiresIn * 1000),
            deviceInfo: this.deviceInfo,
            lastActivity: Date.now()
        };

        storage.setItem('arsip_session', JSON.stringify(sessionData));
        
        // Set App state
        App.token = data.token;
        App.user = data.user;
        App.isLoggedIn = true;

        // Simpan ke IndexedDB untuk offline support
        if ('indexedDB' in window) {
            this.saveToIndexedDB(sessionData);
        }

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('auth:sessionUpdated', {
            detail: { user: data.user }
        }));
    },

    /**
     * Save Session to IndexedDB
     */
    async saveToIndexedDB(sessionData) {
        try {
            const db = await this.openIndexedDB();
            const tx = db.transaction('sessions', 'readwrite');
            const store = tx.objectStore('sessions');
            await store.put(sessionData, 'current');
            await tx.complete;
        } catch (error) {
            console.error('Failed to save to IndexedDB:', error);
        }
    },

    /**
     * Open IndexedDB
     */
    openIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ArsipDB', 1);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('sessions')) {
                    db.createObjectStore('sessions', { keyPath: 'id' });
                }
            };
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get Session
     */
    getSession() {
        // Cek sessionStorage dulu
        let session = sessionStorage.getItem('arsip_session');
        
        // Cek localStorage jika tidak ada
        if (!session) {
            session = localStorage.getItem('arsip_session');
        }
        
        if (session) {
            const parsed = JSON.parse(session);
            
            // Cek expired
            if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
                this.clearSession();
                return null;
            }
            
            return parsed;
        }
        
        return null;
    },

    /**
     * Check Session Validity
     */
    async checkSession() {
        const session = this.getSession();
        
        if (!session) {
            return false;
        }

        // Cek token validity
        try {
            const response = await API.get('verifyToken', { token: session.token });
            return response.status === 'success';
        } catch (error) {
            // Try refresh token
            return await this.refreshSession();
        }
    },

    /**
     * Refresh Session
     */
    async refreshSession() {
        const session = this.getSession();
        
        if (!session?.refreshToken) {
            return false;
        }

        try {
            const response = await API.post('refreshToken', {
                refreshToken: session.refreshToken,
                deviceInfo: this.deviceInfo
            });

            if (response.status === 'success') {
                this.saveSession(response.data, true);
                return true;
            }
        } catch (error) {
            console.error('Refresh token failed:', error);
        }

        this.clearSession();
        return false;
    },

    /**
     * Setup Auto Token Refresh
     */
    setupTokenRefresh(expiresIn) {
        // Clear existing interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Refresh 5 menit sebelum expired
        const refreshTime = (expiresIn - 300) * 1000;
        
        if (refreshTime > 0) {
            this.refreshInterval = setInterval(async () => {
                await this.refreshSession();
            }, refreshTime);
        }
    },

    /**
     * Update Last Activity
     */
    updateActivity() {
        this.lastActivity = Date.now();
        
        // Update session storage
        const session = this.getSession();
        if (session) {
            session.lastActivity = this.lastActivity;
            const storage = localStorage.getItem('arsip_session') ? localStorage : sessionStorage;
            storage.setItem('arsip_session', JSON.stringify(session));
        }
    },

    /**
     * Setup Activity Tracking
     */
    setupActivityTracking() {
        const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.updateActivity();
            }, { passive: true });
        });

        // Cek idle setiap menit
        setInterval(() => {
            if (this.lastActivity && Date.now() - this.lastActivity > this.sessionTimeout) {
                this.handleSessionTimeout();
            }
        }, 60000);
    },

    /**
     * Handle Session Timeout
     */
    async handleSessionTimeout() {
        console.warn('Session timeout');
        
        // Tampilkan notifikasi
        if (typeof UI !== 'undefined' && UI.showNotification) {
            UI.showNotification('Sesi telah berakhir', 'Silakan login kembali', 'warning');
        }

        // Logout
        await this.logout(true);
    },

    // ========== LOGOUT ENHANCED ==========
    async logout(isTimeout = false) {
        try {
            // Kirim request logout ke server
            const session = this.getSession();
            if (session?.token) {
                await API.post('logout', {
                    token: session.token,
                    deviceInfo: this.deviceInfo
                }).catch(() => {}); // Ignore errors
            }

            // Clear biometric credentials
            await this.clearBiometricCredentials();

        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local session
            this.clearSession();
            
            // Clear refresh interval
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }

            // Notifikasi
            if (!isTimeout && typeof UI !== 'undefined' && UI.showNotification) {
                UI.showNotification('Berhasil logout', 'Sampai jumpa kembali', 'info');
            }

            // Redirect ke halaman login
            this.showAuthPage();
        }
    },

    /**
     * Clear Biometric Credentials
     */
    async clearBiometricCredentials() {
        try {
            if (window.PublicKeyCredential) {
                // Clear dari IndexedDB
                const db = await this.openIndexedDB();
                const tx = db.transaction('sessions', 'readwrite');
                const store = tx.objectStore('sessions');
                await store.delete('biometric');
                await tx.complete;
            }
        } catch (error) {
            console.error('Clear biometric error:', error);
        }
    },

    /**
     * Clear Session
     */
    clearSession() {
        sessionStorage.removeItem('arsip_session');
        localStorage.removeItem('arsip_session');
        
        App.token = null;
        App.user = null;
        App.isLoggedIn = false;

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('auth:loggedOut'));
    },

    // ========== PASSWORD MANAGEMENT ==========
    async changePassword(oldPassword, newPassword) {
        try {
            // Validasi password baru
            const strength = this.checkPasswordStrength(newPassword);
            if (strength.score < 3) {
                throw new Error('Password baru terlalu lemah. ' + strength.feedback);
            }

            if (oldPassword === newPassword) {
                throw new Error('Password baru tidak boleh sama dengan password lama');
            }

            const response = await API.post('changePassword', {
                oldPassword,
                newPassword,
                token: App.token
            });

            if (response.status === 'success') {
                this.logActivity('password_changed');
                
                if (typeof UI !== 'undefined' && UI.showNotification) {
                    UI.showNotification('Password berhasil diubah', '', 'success');
                }
            }

            return response;
        } catch (error) {
            this.logActivity('password_change_failed', null, error.message);
            throw new Error('Ganti password gagal: ' + error.message);
        }
    },

    async forgotPassword(email) {
        try {
            if (!this.isValidEmail(email)) {
                throw new Error('Format email tidak valid');
            }

            const response = await API.post('forgotPassword', {
                email: email.toLowerCase().trim(),
                deviceInfo: this.deviceInfo
            });

            this.logActivity('forgot_password_requested', email);
            
            return {
                status: 'success',
                message: 'Link reset password telah dikirim ke email Anda'
            };
        } catch (error) {
            throw new Error('Reset password gagal: ' + error.message);
        }
    },

    async resetPassword(token, newPassword) {
        try {
            const strength = this.checkPasswordStrength(newPassword);
            if (strength.score < 3) {
                throw new Error('Password terlalu lemah. ' + strength.feedback);
            }

            const response = await API.post('resetPassword', {
                token,
                newPassword,
                deviceInfo: this.deviceInfo
            });

            if (response.status === 'success') {
                this.logActivity('password_reset_success');
            }

            return response;
        } catch (error) {
            throw new Error('Reset password gagal: ' + error.message);
        }
    },

    // ========== PROFILE MANAGEMENT ==========
    async updateProfile(data) {
        try {
            const sanitizedData = {
                fullName: this.sanitizeInput(data.fullName),
                email: data.email?.toLowerCase().trim(),
                phone: data.phone?.replace(/[^0-9+]/g, ''),
                avatar: data.avatar || null,
                bio: this.sanitizeInput(data.bio || ''),
                preferences: data.preferences || {}
            };

            const response = await API.post('users.updateProfile', sanitizedData, App.token);

            if (response.status === 'success') {
                // Update local user data
                App.user = { ...App.user, ...response.data.user };
                
                // Update session
                const session = this.getSession();
                if (session) {
                    session.user = App.user;
                    const storage = localStorage.getItem('arsip_session') ? localStorage : sessionStorage;
                    storage.setItem('arsip_session', JSON.stringify(session));
                }

                this.logActivity('profile_updated');
                
                window.dispatchEvent(new CustomEvent('auth:profileUpdated', {
                    detail: { user: App.user }
                }));
            }

            return response;
        } catch (error) {
            throw new Error('Update profil gagal: ' + error.message);
        }
    },

    async getProfile() {
        try {
            const response = await API.get('me', { token: App.token });
            
            if (response.status === 'success') {
                App.user = response.data;
                
                // Update session
                const session = this.getSession();
                if (session) {
                    session.user = response.data;
                    const storage = localStorage.getItem('arsip_session') ? localStorage : sessionStorage;
                    storage.setItem('arsip_session', JSON.stringify(session));
                }
            }
            
            return response;
        } catch (error) {
            throw new Error('Get profil gagal: ' + error.message);
        }
    },

    async uploadAvatar(file) {
        try {
            // Validasi file
            if (!file.type.startsWith('image/')) {
                throw new Error('File harus berupa gambar');
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB
                throw new Error('Ukuran file maksimal 5MB');
            }

            const formData = new FormData();
            formData.append('avatar', file);
            formData.append('token', App.token);

            const response = await fetch(`${CONFIG.API_URL}/users/uploadAvatar`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                // Update profile dengan avatar baru
                await this.updateProfile({ avatar: result.data.url });
            }

            return result;
        } catch (error) {
            throw new Error('Upload avatar gagal: ' + error.message);
        }
    },

    // ========== 2FA MANAGEMENT ==========
    async setup2FA(method = 'authenticator') {
        try {
            const response = await API.post('2fa.setup', { method }, App.token);

            if (response.status === 'success') {
                this.logActivity('2fa_setup_initiated');
                
                // Return QR code data untuk authenticator apps
                if (method === 'authenticator') {
                    return {
                        status: 'success',
                        qrCode: response.data.qrCode,
                        secret: response.data.secret,
                        backupCodes: response.data.backupCodes
                    };
                }
            }

            return response;
        } catch (error) {
            throw new Error('Setup 2FA gagal: ' + error.message);
        }
    },

    async verify2FA(code, tempToken = null) {
        try {
            const response = await API.post('2fa.verify', {
                code,
                tempToken,
                token: tempToken ? null : App.token,
                deviceInfo: this.deviceInfo
            });

            if (response.status === 'success' && tempToken) {
                // Login dengan 2FA, simpan session
                this.saveSession(response.data);
                this.logActivity('2fa_login_success');
            }

            return response;
        } catch (error) {
            throw new Error('Verifikasi 2FA gagal: ' + error.message);
        }
    },

    async get2FAStatus() {
        try {
            const response = await API.get('2fa.status', { token: App.token });
            return response;
        } catch (error) {
            throw new Error('Get 2FA status gagal: ' + error.message);
        }
    },

    async disable2FA(code) {
        try {
            const response = await API.post('2fa.disable', {
                code,
                token: App.token,
                deviceInfo: this.deviceInfo
            });

            if (response.status === 'success') {
                this.logActivity('2fa_disabled');
            }

            return response;
        } catch (error) {
            throw new Error('Disable 2FA gagal: ' + error.message);
        }
    },

    async getBackupCodes() {
        try {
            const response = await API.get('2fa.backupCodes', { token: App.token });
            return response;
        } catch (error) {
            throw new Error('Get backup codes gagal: ' + error.message);
        }
    },

    async regenerateBackupCodes() {
        try {
            const response = await API.post('2fa.regenerateBackupCodes', {
                token: App.token
            });

            if (response.status === 'success') {
                this.logActivity('2fa_backup_codes_regenerated');
            }

            return response;
        } catch (error) {
            throw new Error('Regenerate backup codes gagal: ' + error.message);
        }
    },

    // ========== SESSION LIST ==========
    async getActiveSessions() {
        try {
            const response = await API.get('sessions', { token: App.token });
            return response;
        } catch (error) {
            throw new Error('Get sessions gagal: ' + error.message);
        }
    },

    async terminateSession(sessionId) {
        try {
            const response = await API.post('sessions.terminate', {
                sessionId,
                token: App.token
            });

            if (response.status === 'success') {
                this.logActivity('session_terminated', sessionId);
            }

            return response;
        } catch (error) {
            throw new Error('Terminate session gagal: ' + error.message);
        }
    },

    async terminateAllSessions(exceptCurrent = true) {
        try {
            const response = await API.post('sessions.terminateAll', {
                token: App.token,
                exceptCurrent
            });

            if (response.status === 'success') {
                this.logActivity('all_sessions_terminated');
            }

            return response;
        } catch (error) {
            throw new Error('Terminate all sessions gagal: ' + error.message);
        }
    },

    // ========== UTILITY FUNCTIONS ==========
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input.replace(/[<>]/g, '').trim();
    },

    getRedirectUrl(role) {
        const redirectMap = {
            admin: '/dashboard/admin',
            user: '/dashboard/user',
            viewer: '/dashboard/viewer',
            guest: '/dashboard/guest'
        };
        
        // Cek redirect parameter di URL
        const urlParams = new URLSearchParams(window.location.search);
        const redirectParam = urlParams.get('redirect');
        
        if (redirectParam && this.isValidRedirectUrl(redirectParam)) {
            return redirectParam;
        }
        
        return redirectMap[role] || '/dashboard';
    },

    isValidRedirectUrl(url) {
        // Pastikan redirect URL internal
        return url.startsWith('/') && !url.startsWith('//') && !url.includes('://');
    },

    showAuthPage() {
        if (typeof App !== 'undefined' && App.showAuth) {
            App.showAuth();
        } else {
            window.location.href = '/login';
        }
    },

    /**
     * Setup Security Event Listeners
     */
    setupSecurityEventListeners() {
        // Deteksi perubahan visibility (user switch tab)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.lastActivity = Date.now();
            }
        });

        // Deteksi copy/paste untuk keamanan
        document.addEventListener('copy', (e) => {
            if (window.location.pathname.includes('dashboard')) {
                this.logActivity('copy_detected', document.title);
            }
        });

        // Deteksi screenshot attempt (mobile)
        if (this.deviceInfo.isMobile) {
            document.addEventListener('contextmenu', (e) => {
                this.logActivity('contextmenu_detected');
            });
        }

        // Network status monitoring
        window.addEventListener('online', () => {
            console.log('Back online, checking session...');
            this.checkSession();
        });

        window.addEventListener('offline', () => {
            console.log('Offline mode');
        });
    },

    /**
     * Log Activity
     */
    logActivity(action, target = null, details = null) {
        try {
            const logData = {
                timestamp: new Date().toISOString(),
                action,
                target,
                details,
                userAgent: navigator.userAgent,
                url: window.location.href,
                deviceInfo: this.deviceInfo
            };

            // Simpan ke array log (max 100 entries)
            if (!window.activityLog) window.activityLog = [];
            window.activityLog.unshift(logData);
            window.activityLog = window.activityLog.slice(0, 100);

            // Kirim ke server jika online
            if (navigator.onLine && App.token) {
                API.post('activityLog', { logs: [logData] }, App.token)
                    .catch(() => {}); // Ignore errors
            }

            // Simpan ke localStorage sebagai backup
            const storedLogs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
            storedLogs.unshift(logData);
            localStorage.setItem('activity_logs', JSON.stringify(storedLogs.slice(0, 100)));

        } catch (error) {
            console.error('Log activity error:', error);
        }
    },

    /**
     * Get Activity Logs
     */
    getActivityLogs(limit = 50) {
        const storedLogs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
        return storedLogs.slice(0, limit);
    },

    /**
     * Clear Activity Logs
     */
    clearActivityLogs() {
        localStorage.removeItem('activity_logs');
        window.activityLog = [];
    },

    /**
     * Enhanced Error Handler with Retry
     */
    async withRetry(fn, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${i + 1} failed, retrying...`);
                
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                }
            }
        }
        
        throw lastError;
    },

    /**
     * Offline Login Support
     */
    async offlineLogin(username, password) {
        try {
            // Cek IndexedDB untuk cached credentials
            const db = await this.openIndexedDB();
            const tx = db.transaction('sessions', 'readonly');
            const store = tx.objectStore('sessions');
            const cached = await store.get('offline_auth');
            
            if (cached && cached.username === username) {
                // Verifikasi password hash
                const hashedPassword = await this.hashString(password);
                if (hashedPassword === cached.passwordHash) {
                    return {
                        status: 'success',
                        data: cached.userData,
                        offline: true
                    };
                }
            }
            
            throw new Error('Offline login gagal');
        } catch (error) {
            throw new Error('Tidak dapat login dalam mode offline');
        }
    },

    /**
     * Cache Credentials for Offline Access
     */
    async cacheCredentials(username, passwordHash, userData) {
        try {
            const db = await this.openIndexedDB();
            const tx = db.transaction('sessions', 'readwrite');
            const store = tx.objectStore('sessions');
            
            await store.put({
                id: 'offline_auth',
                username,
                passwordHash,
                userData,
                timestamp: Date.now()
            });
            
            await tx.complete;
        } catch (error) {
            console.error('Cache credentials error:', error);
        }
    }
};

// ========== INITIALIZE ON LOAD ==========
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

// ========== EXPORT FOR MODULE SYSTEM ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}

// ========== WINDOW OBJECT FOR GLOBAL ACCESS ==========
window.Auth = Auth;

console.log('✅ Auth.js v3.2.2 loaded successfully with all enhancements');
