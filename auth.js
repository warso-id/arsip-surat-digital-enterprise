/**
 * ============================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.1.0 (2026)
 * Authentication Module - GRAND MASTER FINAL
 * ============================================
 * Features: JWT Auth, Biometric Login, Session Management,
 *           Role-Based Access, Password Management
 * ============================================
 */

class AuthManager {
  constructor() {
    this.tokenKey = 'app_token_v3';
    this.userKey = 'app_user_v3';
    this.refreshKey = 'app_refresh_v3';
    this.sessionTimeout = 3600000; // 1 jam
    this.refreshThreshold = 300000; // 5 menit sebelum expired
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 1800000; // 30 menit
    this.loginAttempts = this.loadLoginAttempts();
    this.init();
  }

  /**
   * Initialize auth module
   */
  init() {
    // Check session on load
    this.checkSession();
    
    // Setup auto-refresh
    this.setupAutoRefresh();
    
    // Listen for storage events (multi-tab support)
    window.addEventListener('storage', (e) => {
      if (e.key === this.tokenKey && !e.newValue) {
        this.handleLogout('Session ended in another tab');
      }
    });
    
    console.log('🔐 Auth Manager v3.1.0 initialized');
  }

  /**
   * Login with username/password
   * @param {string} username - Username or email
   * @param {string} password - Password
   * @param {boolean} rememberMe - Remember session
   * @returns {Object} Login result
   */
  async login(username, password, rememberMe = false) {
    // Validate input
    if (!username || !password) {
      return { success: false, message: 'Username dan password wajib diisi' };
    }

    // Check rate limiting
    if (this.isLockedOut(username)) {
      const remaining = this.getLockoutRemaining(username);
      return { 
        success: false, 
        message: `Akun terkunci. Silakan coba lagi dalam ${Math.ceil(remaining / 60000)} menit` 
      };
    }

    try {
      APP.ui.loading(true);
      
      const response = await APP.api.post('login', { 
        username: username.trim(), 
        password: password 
      });

      APP.ui.loading(false);

      if (response.status === 'success') {
        const { token, refreshToken, user, expiresIn } = response.data;
        
        // Save session
        this.saveSession(token, refreshToken, user, rememberMe);
        
        // Update API client
        APP.api.setToken(token);
        
        // Update app state
        APP.token = token;
        APP.user = user;
        APP.isAuthenticated = true;
        
        // Clear login attempts
        this.clearLoginAttempts(username);
        
        // Setup biometric if available
        if (rememberMe && APP.biometric.isAvailable()) {
          this.promptBiometricSetup();
        }
        
        // Log blockchain
        APP.blockchain.addBlock({
          type: 'LOGIN',
          user: user.username,
          timestamp: new Date().toISOString(),
        });
        
        APP.ui.toast(`Selamat datang, ${user.namaLengkap || user.username}!`, 'success');
        
        // Redirect
        setTimeout(() => {
          const returnUrl = new URLSearchParams(window.location.search).get('return') || '/';
          window.location.href = returnUrl;
        }, 500);

        return { success: true, user, token };
      }

      // Failed login
      this.recordLoginAttempt(username);
      const attempts = this.loginAttempts[username] || 0;
      const remaining = this.maxLoginAttempts - attempts;
      
      return { 
        success: false, 
        message: `Login gagal. ${remaining > 0 ? `Sisa percobaan: ${remaining}` : 'Akun terkunci selama 30 menit'}` 
      };

    } catch (error) {
      APP.ui.loading(false);
      return { success: false, message: error.message || 'Login gagal' };
    }
  }

  /**
   * Login with biometric
   */
  async loginWithBiometric() {
    if (!APP.biometric.isAvailable()) {
      return { success: false, message: 'Biometric tidak didukung' };
    }

    try {
      const authenticated = await APP.biometric.authenticate();
      
      if (authenticated) {
        // Restore session from storage
        const token = localStorage.getItem(this.tokenKey);
        const user = JSON.parse(localStorage.getItem(this.userKey) || 'null');
        
        if (token && user) {
          APP.token = token;
          APP.user = user;
          APP.isAuthenticated = true;
          APP.api.setToken(token);
          
          APP.ui.toast(`Selamat datang kembali, ${user.namaLengkap}!`, 'success');
          
          setTimeout(() => {
            window.location.href = '/';
          }, 500);
          
          return { success: true, user };
        }
      }
      
      return { success: false, message: 'Biometric authentication failed' };
      
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Register new user
   */
  async register(userData) {
    const { username, email, password, namaLengkap, role } = userData;

    // Validate
    if (!username || !email || !password || !namaLengkap) {
      return { success: false, message: 'Semua field wajib diisi' };
    }

    if (password.length < 8) {
      return { success: false, message: 'Password minimal 8 karakter' };
    }

    if (!APP.security.validateEmail(email)) {
      return { success: false, message: 'Email tidak valid' };
    }

    try {
      APP.ui.loading(true);
      
      const response = await APP.api.post('users.create', {
        username, email, password, namaLengkap, 
        role: role || 'staff' 
      });

      APP.ui.loading(false);

      if (response.status === 'success') {
        APP.ui.toast('User berhasil dibuat', 'success');
        return { success: true, data: response.data };
      }

      return { success: false, message: response.message };

    } catch (error) {
      APP.ui.loading(false);
      return { success: false, message: error.message };
    }
  }

  /**
   * Logout
   */
  async logout() {
    try {
      // Call logout API
      await APP.api.post('logout').catch(() => {});
      
      // Log blockchain
      APP.blockchain.addBlock({
        type: 'LOGOUT',
        user: APP.user?.username,
        timestamp: new Date().toISOString(),
      });
      
    } finally {
      this.clearSession();
      APP.ui.toast('Anda telah keluar', 'info');
      window.location.href = '/login.html';
    }
  }

  /**
   * Handle forced logout
   */
  handleLogout(reason = 'Session expired') {
    this.clearSession();
    APP.ui.toast(reason, 'warning');
    setTimeout(() => {
      window.location.href = '/login.html?reason=expired';
    }, 1000);
  }

  /**
   * Change password
   */
  async changePassword(oldPassword, newPassword) {
    if (!oldPassword || !newPassword) {
      return { success: false, message: 'Field wajib diisi' };
    }

    if (newPassword.length < 8) {
      return { success: false, message: 'Password baru minimal 8 karakter' };
    }

    if (oldPassword === newPassword) {
      return { success: false, message: 'Password baru tidak boleh sama' };
    }

    try {
      const response = await APP.api.post('changePassword', {
        oldPassword, newPassword
      });

      return { success: response.status === 'success', message: response.message };

    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    if (!email) {
      return { success: false, message: 'Email wajib diisi' };
    }

    if (!APP.security.validateEmail(email)) {
      return { success: false, message: 'Email tidak valid' };
    }

    try {
      const response = await APP.api.post('forgotPassword', { email });
      return { success: response.status === 'success', message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    if (!token || !newPassword) {
      return { success: false, message: 'Field wajib diisi' };
    }

    if (newPassword.length < 8) {
      return { success: false, message: 'Password minimal 8 karakter' };
    }

    try {
      const response = await APP.api.post('resetPassword', { token, newPassword });
      return { success: response.status === 'success', message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Save session to storage
   */
  saveSession(token, refreshToken, user, rememberMe = false) {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem(this.tokenKey, token);
    if (refreshToken) storage.setItem(this.refreshKey, refreshToken);
    storage.setItem(this.userKey, JSON.stringify(user));
    
    // Set expiry
    const expiry = Date.now() + this.sessionTimeout;
    storage.setItem('app_session_expiry', expiry.toString());
    
    // If remember me, also save to localStorage
    if (rememberMe) {
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
  }

  /**
   * Clear session
   */
  clearSession() {
    const keys = [this.tokenKey, this.userKey, this.refreshKey, 'app_session_expiry'];
    
    keys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    APP.token = null;
    APP.user = null;
    APP.isAuthenticated = false;
    APP.api.setToken(null);
  }

  /**
   * Check session validity
   */
  checkSession() {
    const token = localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
    const expiry = localStorage.getItem('app_session_expiry') || sessionStorage.getItem('app_session_expiry');
    
    if (!token) return false;
    
    if (expiry && Date.now() > parseInt(expiry)) {
      this.clearSession();
      return false;
    }
    
    // Restore session
    const user = JSON.parse(localStorage.getItem(this.userKey) || sessionStorage.getItem(this.userKey) || 'null');
    
    if (user) {
      APP.token = token;
      APP.user = user;
      APP.isAuthenticated = true;
      APP.api.setToken(token);
      return true;
    }
    
    return false;
  }

  /**
   * Setup auto token refresh
   */
  setupAutoRefresh() {
    // Check every minute
    setInterval(() => {
      const expiry = localStorage.getItem('app_session_expiry') || sessionStorage.getItem('app_session_expiry');
      
      if (expiry) {
        const remaining = parseInt(expiry) - Date.now();
        
        if (remaining > 0 && remaining < this.refreshThreshold) {
          this.refreshToken();
        } else if (remaining <= 0) {
          this.handleLogout('Session expired');
        }
      }
    }, 60000);
  }

  /**
   * Refresh token
   */
  async refreshToken() {
    const refreshToken = localStorage.getItem(this.refreshKey) || sessionStorage.getItem(this.refreshKey);
    
    if (!refreshToken) return false;
    
    try {
      const response = await fetch(`${APP.apiUrl}?action=refreshToken&token=${refreshToken}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        this.saveSession(data.data.token, data.data.refreshToken, APP.user, true);
        APP.api.setToken(data.data.token);
        return true;
      }
    } catch (e) {
      console.warn('Token refresh failed');
    }
    
    return false;
  }

  /**
   * Check user permissions
   */
  hasRole(role) {
    return APP.user?.role === role;
  }

  hasAnyRole(roles) {
    return roles.includes(APP.user?.role);
  }

  isAdmin() {
    return this.hasRole('admin');
  }

  isKepala() {
    return this.hasRole('kepala');
  }

  isAuthenticated() {
    return APP.isAuthenticated === true && !!APP.token;
  }

  /**
   * Prompt biometric setup
   */
  async promptBiometricSetup() {
    if (!APP.biometric.isAvailable()) return;
    
    const registered = localStorage.getItem('biometric_registered_v3');
    if (registered) return;
    
    setTimeout(() => {
      const setup = confirm('Ingin mengaktifkan login biometric untuk akses lebih cepat?');
      if (setup) {
        APP.biometric.register().then(result => {
          if (result) APP.ui.toast('Biometric berhasil didaftarkan', 'success');
        });
      }
    }, 2000);
  }

  /**
   * Rate limiting
   */
  loadLoginAttempts() {
    try {
      const stored = localStorage.getItem('login_attempts_v3');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }

  saveLoginAttempts() {
    localStorage.setItem('login_attempts_v3', JSON.stringify(this.loginAttempts));
  }

  recordLoginAttempt(username) {
    const key = username.toLowerCase();
    const now = Date.now();
    
    if (!this.loginAttempts[key]) {
      this.loginAttempts[key] = { count: 0, firstAttempt: now, lockUntil: 0 };
    }
    
    const attempt = this.loginAttempts[key];
    
    // Reset if lockout expired
    if (now > attempt.lockUntil) {
      attempt.count = 0;
      attempt.firstAttempt = now;
      attempt.lockUntil = 0;
    }
    
    attempt.count++;
    
    // Lock if exceeded
    if (attempt.count >= this.maxLoginAttempts) {
      attempt.lockUntil = now + this.lockoutDuration;
    }
    
    this.saveLoginAttempts();
  }

  clearLoginAttempts(username) {
    const key = username.toLowerCase();
    delete this.loginAttempts[key];
    this.saveLoginAttempts();
  }

  isLockedOut(username) {
    const key = username.toLowerCase();
    const attempt = this.loginAttempts[key];
    return attempt && Date.now() < attempt.lockUntil;
  }

  getLockoutRemaining(username) {
    const key = username.toLowerCase();
    const attempt = this.loginAttempts[key];
    return attempt ? Math.max(0, attempt.lockUntil - Date.now()) : 0;
  }
}

// Create global instance
const authManager = new AuthManager();

// Export
window.authManager = authManager;
window.AuthManager = AuthManager;

console.log('✅ auth.js v3.1.0 GRAND MASTER FINAL loaded');