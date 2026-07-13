/**
 * AUTH SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Handles authentication, token management, and session
 */

class AuthService {
  constructor() {
    this.tokenKey = APP_CONFIG.AUTH.TOKEN_KEY;
    this.csrfKey = APP_CONFIG.AUTH.CSRF_KEY;
    this.userKey = APP_CONFIG.AUTH.USER_KEY;
    this.rememberKey = APP_CONFIG.AUTH.REMEMBER_KEY;
    this.sessionTimeout = APP_CONFIG.AUTH.SESSION_TIMEOUT;
    this.refreshBefore = APP_CONFIG.AUTH.REFRESH_BEFORE;
    this.tokenRefreshTimer = null;
    this.sessionCheckTimer = null;
  }
  
  /**
   * Initialize auth service
   */
  init() {
    // Restore session
    this.restoreSession();
    
    // Setup token refresh
    this.setupTokenRefresh();
    
    // Setup session check
    this.setupSessionCheck();
    
    // Listen for storage events (multi-tab)
    window.addEventListener('storage', (event) => {
      if (event.key === this.tokenKey) {
        if (!event.newValue) {
          // Token removed in another tab
          this.clearAuth();
          router.navigate('/login');
        }
      }
    });
    
    console.log('✅ Auth Service initialized');
  }
  
  /**
   * Login
   */
  async login(username, password, remember = false) {
    try {
      // Check brute force
      const attempts = this.getLoginAttempts();
      if (attempts >= APP_CONFIG.AUTH.MAX_LOGIN_ATTEMPTS) {
        const lockTime = this.getLockTime();
        const remaining = Math.ceil((lockTime + APP_CONFIG.AUTH.LOCK_DURATION * 60000 - Date.now()) / 60000);
        if (remaining > 0) {
          throw new Error(`Terlalu banyak percobaan. Coba lagi dalam ${remaining} menit.`);
        }
      }
      
      const response = await api.login(username, password);
      
      if (response.status === 'success') {
        const { token, csrf, user, permissions } = response.data;
        
        // Store auth data
        this.setToken(token);
        this.setCsrfToken(csrf);
        this.setUser(user);
        this.setPermissions(permissions);
        
        // Clear login attempts
        this.clearLoginAttempts();
        
        // Update state
        store.dispatch('auth', {
          isAuthenticated: true,
          user: user,
          token: token,
          csrf: csrf,
          permissions: permissions,
          loginAttempts: 0
        });
        
        // Log activity
        this.logActivity('LOGIN');
        
        // Setup auto-refresh
        this.setupTokenRefresh();
        
        return { success: true, user };
      } else {
        // Record failed attempt
        this.recordLoginAttempt();
        throw new Error(response.message || 'Login gagal');
      }
    } catch (error) {
      this.recordLoginAttempt();
      throw error;
    }
  }
  
  /**
   * Register
   */
  async register(data) {
    try {
      const response = await api.register(data);
      
      if (response.status === 'success') {
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message || 'Registrasi gagal');
      }
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Logout
   */
  async logout() {
    try {
      // Call logout API
      await api.logout().catch(() => {});
    } finally {
      // Clear auth data
      this.clearAuth();
      
      // Update state
      store.dispatch('auth', {
        isAuthenticated: false,
        user: null,
        token: null,
        csrf: null,
        permissions: {}
      });
      
      // Clear timers
      this.clearTimers();
      
      // Clear cache
      await CacheService.clear();
      
      // Navigate to login
      router.navigate('/login');
    }
  }
  
  /**
   * Force logout (admin action)
   */
  async forceLogout(userId) {
    try {
      const response = await api.post('session.logout', { userId });
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Change password
   */
  async changePassword(oldPassword, newPassword) {
    try {
      // Validate password strength
      if (newPassword.length < 8) {
        throw new Error('Password minimal 8 karakter');
      }
      
      if (!/[A-Z]/.test(newPassword)) {
        throw new Error('Password harus mengandung huruf besar');
      }
      
      if (!/[a-z]/.test(newPassword)) {
        throw new Error('Password harus mengandung huruf kecil');
      }
      
      if (!/[0-9]/.test(newPassword)) {
        throw new Error('Password harus mengandung angka');
      }
      
      const response = await api.changePassword(oldPassword, newPassword);
      
      if (response.status === 'success') {
        NotificationService.show('Password berhasil diubah', 'success');
        return true;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      NotificationService.show(error.message, 'error');
      throw error;
    }
  }
  
  /**
   * Get current user
   */
  getUser() {
    try {
      const userData = localStorage.getItem(this.userKey);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }
  
  /**
   * Set user data
   */
  setUser(user) {
    if (user) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.userKey);
    }
  }
  
  /**
   * Get token
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }
  
  /**
   * Set token
   */
  setToken(token) {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    } else {
      localStorage.removeItem(this.tokenKey);
    }
  }
  
  /**
   * Get CSRF token
   */
  getCsrfToken() {
    return localStorage.getItem(this.csrfKey);
  }
  
  /**
   * Set CSRF token
   */
  setCsrfToken(token) {
    if (token) {
      localStorage.setItem(this.csrfKey, token);
    } else {
      localStorage.removeItem(this.csrfKey);
    }
  }
  
  /**
   * Get permissions
   */
  getPermissions() {
    try {
      const permissions = localStorage.getItem('asd_permissions');
      return permissions ? JSON.parse(permissions) : {};
    } catch {
      return {};
    }
  }
  
  /**
   * Set permissions
   */
  setPermissions(permissions) {
    if (permissions) {
      localStorage.setItem('asd_permissions', JSON.stringify(permissions));
    }
  }
  
  /**
   * Get user role
   */
  getUserRole() {
    const user = this.getUser();
    return user ? user.role : null;
  }
  
  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return !!this.getToken() && !!this.getUser();
  }
  
  /**
   * Check if has permission
   */
  hasPermission(module, action) {
    const permissions = this.getPermissions();
    if (!permissions) return false;
    
    // Admin has all permissions
    if (permissions.all && permissions.all.includes('*')) return true;
    
    // Check module permission
    if (permissions[module]) {
      return permissions[module].includes(action) || permissions[module].includes('*');
    }
    
    return false;
  }
  
  /**
   * Refresh token
   */
  async refreshToken() {
    try {
      const response = await api.getMe();
      
      if (response.status === 'success' && response.data.token) {
        this.setToken(response.data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }
  
  /**
   * Setup token refresh timer
   */
  setupTokenRefresh() {
    this.clearTimers();
    
    if (!this.isAuthenticated()) return;
    
    const refreshInterval = this.sessionTimeout - this.refreshBefore;
    
    this.tokenRefreshTimer = setInterval(async () => {
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        this.handleSessionExpired();
      }
    }, refreshInterval);
  }
  
  /**
   * Setup session check
   */
  setupSessionCheck() {
    this.sessionCheckTimer = setInterval(() => {
      const lastActivity = store.getState('auth.lastActivity');
      
      if (lastActivity && this.isAuthenticated()) {
        const elapsed = Date.now() - lastActivity;
        
        if (elapsed > this.sessionTimeout) {
          this.handleSessionExpired();
        }
      }
    }, 60000); // Check every minute
  }
  
  /**
   * Handle session expired
   */
  handleSessionExpired() {
    this.clearAuth();
    store.dispatch('auth.isAuthenticated', false);
    
    NotificationService.show('Sesi Anda telah berakhir. Silakan login kembali.', 'warning', {
      duration: 0
    });
    
    router.navigate('/login', { query: { expired: true } });
  }
  
  /**
   * Clear all auth data
   */
  clearAuth() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.csrfKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('asd_permissions');
    
    this.clearTimers();
  }
  
  /**
   * Clear timers
   */
  clearTimers() {
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    
    if (this.sessionCheckTimer) {
      clearInterval(this.sessionCheckTimer);
      this.sessionCheckTimer = null;
    }
  }
  
  /**
   * Restore session
   */
  restoreSession() {
    const token = this.getToken();
    const user = this.getUser();
    const permissions = this.getPermissions();
    
    if (token && user) {
      store.dispatch('auth', {
        isAuthenticated: true,
        user: user,
        token: token,
        permissions: permissions,
        lastActivity: Date.now()
      });
      
      this.setupTokenRefresh();
    }
  }
  
  /**
   * Get login attempts
   */
  getLoginAttempts() {
    const data = sessionStorage.getItem('asd_login_attempts');
    return data ? parseInt(data) : 0;
  }
  
  /**
   * Record login attempt
   */
  recordLoginAttempt() {
    const attempts = this.getLoginAttempts() + 1;
    sessionStorage.setItem('asd_login_attempts', attempts.toString());
    
    if (attempts >= APP_CONFIG.AUTH.MAX_LOGIN_ATTEMPTS) {
      sessionStorage.setItem('asd_lock_time', Date.now().toString());
    }
  }
  
  /**
   * Clear login attempts
   */
  clearLoginAttempts() {
    sessionStorage.removeItem('asd_login_attempts');
    sessionStorage.removeItem('asd_lock_time');
  }
  
  /**
   * Get lock time
   */
  getLockTime() {
    const time = sessionStorage.getItem('asd_lock_time');
    return time ? parseInt(time) : 0;
  }
  
  /**
   * Log activity
   */
  logActivity(action) {
    const activities = JSON.parse(localStorage.getItem('asd_activities') || '[]');
    activities.push({
      action,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ip: 'client'
    });
    
    // Keep only last 100 activities
    if (activities.length > 100) {
      activities.shift();
    }
    
    localStorage.setItem('asd_activities', JSON.stringify(activities));
  }
  
  /**
   * Get activities
   */
  getActivities(limit = 10) {
    const activities = JSON.parse(localStorage.getItem('asd_activities') || '[]');
    return activities.slice(-limit).reverse();
  }
  
  /**
   * Check biometric availability
   */
  async isBiometricAvailable() {
    if (!window.PublicKeyCredential) return false;
    
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch {
      return false;
    }
  }
  
  /**
   * Register biometric
   */
  async registerBiometric() {
    try {
      const response = await api.get('biometric.register');
      
      if (response.status === 'success') {
        const { challenge, user } = response.data;
        
        const publicKey = {
          challenge: Uint8Array.from(challenge, c => c.charCodeAt(0)),
          rp: {
            name: APP_CONFIG.APP_NAME,
            id: window.location.hostname
          },
          user: {
            id: Uint8Array.from(user.id, c => c.charCodeAt(0)),
            name: user.email || user.username,
            displayName: user.namaLengkap || user.username
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 } // RS256
          ],
          timeout: 60000,
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          attestation: 'none'
        };
        
        const credential = await navigator.credentials.create({ publicKey });
        
        // Send credential to server
        const verifyResponse = await api.post('biometric.verify', {
          credential: {
            id: credential.id,
            rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
            response: {
              clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON))),
              attestationObject: btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject)))
            },
            type: credential.type
          }
        });
        
        return verifyResponse.status === 'success';
      }
      return false;
    } catch (error) {
      console.error('Biometric registration failed:', error);
      return false;
    }
  }
  
  /**
   * Verify biometric
   */
  async verifyBiometric() {
    try {
      const response = await api.get('biometric.status');
      
      if (response.status === 'success' && response.data.challenge) {
        const { challenge, credentialIds } = response.data;
        
        const publicKey = {
          challenge: Uint8Array.from(challenge, c => c.charCodeAt(0)),
          allowCredentials: credentialIds.map(id => ({
            id: Uint8Array.from(atob(id), c => c.charCodeAt(0)),
            type: 'public-key'
          })),
          timeout: 60000,
          userVerification: 'required'
        };
        
        const assertion = await navigator.credentials.get({ publicKey });
        
        // Verify assertion
        const verifyResponse = await api.post('biometric.multiFactor', {
          assertion: {
            id: assertion.id,
            rawId: btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))),
            response: {
              clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(assertion.response.clientDataJSON))),
              authenticatorData: btoa(String.fromCharCode(...new Uint8Array(assertion.response.authenticatorData))),
              signature: btoa(String.fromCharCode(...new Uint8Array(assertion.response.signature))),
              userHandle: assertion.response.userHandle ? btoa(String.fromCharCode(...new Uint8Array(assertion.response.userHandle))) : null
            },
            type: assertion.type
          }
        });
        
        return verifyResponse.status === 'success';
      }
      return false;
    } catch (error) {
      console.error('Biometric verification failed:', error);
      return false;
    }
  }
}

// Singleton instance
const AuthService = new AuthService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthService };
}
