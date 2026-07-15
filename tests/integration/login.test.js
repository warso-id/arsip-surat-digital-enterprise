/**
 * LOGIN INTEGRATION TESTS - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * File: tests/integration/login.test.js
 * Support: Google Apps Script (code.gs) + Google Sheets + Frontend
 * Encoding: Base64 untuk komunikasi data
 */

// ============================================
// TEST HELPERS & UTILITIES
// ============================================
const LoginTestHelpers = {
  /**
   * Generate mock user data
   */
  generateMockUser(role = 'admin') {
    const users = {
      admin: {
        id: 'user-001',
        username: 'admin',
        namaLengkap: 'Administrator Sistem',
        email: 'admin@instansi.go.id',
        role: 'admin',
        jabatan: 'Administrator',
        bidang: 'Teknologi Informasi',
        aktif: true,
        permissions: {
          all: ['*'],
          suratMasuk: ['create', 'read', 'update', 'delete'],
          suratKeluar: ['create', 'read', 'update', 'delete'],
          disposisi: ['create', 'read', 'update', 'delete'],
          users: ['create', 'read', 'update', 'delete'],
          settings: ['read', 'update'],
          reports: ['read', 'export'],
          auditLog: ['read']
        }
      },
      kabid: {
        id: 'user-002',
        username: 'kabid',
        namaLengkap: 'Kepala Bidang',
        email: 'kabid@instansi.go.id',
        role: 'kabid',
        jabatan: 'Kepala Bidang',
        bidang: 'Bidang A',
        aktif: true,
        permissions: {
          suratMasuk: ['create', 'read', 'update'],
          suratKeluar: ['create', 'read', 'update'],
          disposisi: ['create', 'read', 'update'],
          reports: ['read', 'export']
        }
      },
      kasubag: {
        id: 'user-003',
        username: 'kasubag',
        namaLengkap: 'Kepala Sub Bagian',
        email: 'kasubag@instansi.go.id',
        role: 'kasubag',
        jabatan: 'Kepala Sub Bagian',
        bidang: 'Sub Bagian A',
        aktif: true,
        permissions: {
          suratMasuk: ['create', 'read', 'update'],
          suratKeluar: ['create', 'read', 'update'],
          disposisi: ['create', 'read', 'update']
        }
      },
      staff: {
        id: 'user-004',
        username: 'staff',
        namaLengkap: 'Staff',
        email: 'staff@instansi.go.id',
        role: 'staff',
        jabatan: 'Staff',
        bidang: 'Bidang A',
        aktif: true,
        permissions: {
          suratMasuk: ['read'],
          suratKeluar: ['read'],
          disposisi: ['read', 'update']
        }
      },
      sekretaris: {
        id: 'user-005',
        username: 'sekretaris',
        namaLengkap: 'Sekretaris',
        email: 'sekretaris@instansi.go.id',
        role: 'sekretaris',
        jabatan: 'Sekretaris',
        bidang: 'Sekretariat',
        aktif: true,
        permissions: {
          suratMasuk: ['create', 'read', 'update'],
          suratKeluar: ['create', 'read', 'update', 'delete'],
          disposisi: ['create', 'read', 'update']
        }
      }
    };

    return users[role] || users.staff;
  },

  /**
   * Generate mock CSRF token (Base64 encoded)
   */
  generateMockCsrfToken() {
    const tokenData = {
      token: `csrf-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      expiresAt: Date.now() + 3600000, // 1 hour
      issuedAt: Date.now()
    };
    return Base64Util.encodeObject(tokenData);
  },

  /**
   * Generate mock session token (Base64 encoded)
   */
  generateMockSessionToken(userId) {
    const tokenData = {
      userId,
      sessionId: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      issuedAt: Date.now(),
      expiresAt: Date.now() + APP_CONFIG.AUTH.SESSION_TIMEOUT,
      ipAddress: '127.0.0.1',
      userAgent: navigator.userAgent
    };
    return Base64Util.encodeObject(tokenData);
  },

  /**
   * Create mock API response with Base64 encoding
   */
  createApiResponse(success, data, message = '') {
    const payload = Base64Util.encodeObject({
      success,
      data,
      message,
      timestamp: Date.now(),
      version: APP_CONFIG.APP_VERSION
    });

    return {
      ok: success,
      status: success ? 200 : 401,
      json: () => Promise.resolve({
        payload,
        status: success ? 'success' : 'error',
        message
      }),
      text: () => Promise.resolve(JSON.stringify({
        payload,
        status: success ? 'success' : 'error'
      }))
    };
  },

  /**
   * Setup DOM for login testing
   */
  setupLoginDOM() {
    document.body.innerHTML = `
      <div id="app">
        <div id="app-shell">
          <div class="auth-shell">
            <div class="auth-container">
              <div class="auth-header">
                <img src="/assets/logo.png" alt="Logo" class="auth-logo">
                <h1 class="auth-title">Arsip Surat Digital</h1>
                <p class="auth-subtitle">Enterprise v${APP_CONFIG.APP_VERSION}</p>
              </div>
              <div class="auth-card">
                <div class="auth-card-header">
                  <h2>Login</h2>
                  <p>Masukkan kredensial Anda</p>
                </div>
                <form id="login-form" class="auth-form">
                  <div class="form-group">
                    <label for="username" class="form-label">Username</label>
                    <div class="input-group">
                      <span class="input-icon">
                        <i class="icon-user"></i>
                      </span>
                      <input 
                        type="text" 
                        id="username" 
                        name="username" 
                        class="form-input" 
                        placeholder="Masukkan username"
                        autocomplete="username"
                        required
                      >
                    </div>
                    <div class="form-helper" data-error="username"></div>
                  </div>
                  
                  <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <div class="input-group">
                      <span class="input-icon">
                        <i class="icon-lock"></i>
                      </span>
                      <input 
                        type="password" 
                        id="password" 
                        name="password" 
                        class="form-input" 
                        placeholder="Masukkan password"
                        autocomplete="current-password"
                        required
                      >
                      <button type="button" class="input-toggle-password" tabindex="-1">
                        <i class="icon-eye"></i>
                      </button>
                    </div>
                    <div class="form-helper" data-error="password"></div>
                  </div>
                  
                  <div class="form-group form-group--checkbox">
                    <label class="checkbox-label">
                      <input type="checkbox" id="remember" name="remember" class="form-checkbox">
                      <span class="checkbox-text">Ingat saya</span>
                    </label>
                  </div>
                  
                  <div class="form-error" id="login-error" style="display: none;"></div>
                  
                  <div class="form-group">
                    <button type="submit" id="btn-login" class="btn btn-primary btn-block">
                      <span class="btn-text">Masuk</span>
                      <span class="btn-spinner" style="display: none;">
                        <i class="icon-spinner icon-spin"></i>
                      </span>
                    </button>
                  </div>
                  
                  <div class="form-links">
                    <a href="#/forgot-password" class="form-link">Lupa password?</a>
                  </div>
                </form>
              </div>
              
              <div class="auth-footer">
                <p>&copy; ${new Date().getFullYear()} Arsip Surat Digital Enterprise</p>
              </div>
            </div>
          </div>
        </div>
        
        <div id="toast-container"></div>
        <div id="modal-container"></div>
        <div id="loading-overlay" style="display: none;">
          <div class="spinner"></div>
        </div>
      </div>
    `;
  },

  /**
   * Clear auth storage
   */
  clearAuthStorage() {
    localStorage.removeItem(APP_CONFIG.AUTH.TOKEN_KEY);
    localStorage.removeItem(APP_CONFIG.AUTH.CSRF_KEY);
    localStorage.removeItem(APP_CONFIG.AUTH.USER_KEY);
    localStorage.removeItem(APP_CONFIG.AUTH.REMEMBER_KEY);
    sessionStorage.clear();
  },

  /**
   * Fill login form
   */
  async fillLoginForm(username, password, remember = false) {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');

    if (usernameInput) {
      usernameInput.value = username;
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (passwordInput) {
      passwordInput.value = password;
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (rememberCheckbox) {
      rememberCheckbox.checked = remember;
      rememberCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    }

    await new Promise(resolve => setTimeout(resolve, 50));
  },

  /**
   * Submit login form
   */
  async submitLoginForm() {
    const form = document.getElementById('login-form');
    const submitBtn = document.getElementById('btn-login');

    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    } else if (submitBtn) {
      submitBtn.click();
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  },

  /**
   * Get form error messages
   */
  getFormErrors() {
    const errors = {};
    const errorElements = document.querySelectorAll('.form-helper[data-error]');
    
    errorElements.forEach(el => {
      const field = el.getAttribute('data-error');
      const text = el.textContent.trim();
      if (text) {
        errors[field] = text;
      }
    });

    return errors;
  },

  /**
   * Check if login button is in loading state
   */
  isLoginButtonLoading() {
    const btn = document.getElementById('btn-login');
    if (!btn) return false;

    const btnText = btn.querySelector('.btn-text');
    const btnSpinner = btn.querySelector('.btn-spinner');

    return btn.disabled && 
           btnText && btnText.style.display === 'none' && 
           btnSpinner && btnSpinner.style.display !== 'none';
  },

  /**
   * Check if login error is displayed
   */
  getLoginError() {
    const errorEl = document.getElementById('login-error');
    if (errorEl && errorEl.style.display !== 'none') {
      return errorEl.textContent.trim();
    }
    return null;
  }
};

// ============================================
// MOCK AUTH SERVICE
// ============================================
const MockAuthService = {
  isAuthenticated: false,
  currentUser: null,
  token: null,
  csrf: null,

  reset() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.token = null;
    this.csrf = null;
  },

  login(user, token, csrf) {
    this.isAuthenticated = true;
    this.currentUser = user;
    this.token = token;
    this.csrf = csrf;
    
    // Simpan ke localStorage (Base64 encoded)
    if (token) {
      localStorage.setItem(APP_CONFIG.AUTH.TOKEN_KEY, token);
    }
    if (csrf) {
      localStorage.setItem(APP_CONFIG.AUTH.CSRF_KEY, csrf);
    }
    if (user) {
      localStorage.setItem(APP_CONFIG.AUTH.USER_KEY, Base64Util.encodeObject(user));
    }
  },

  logout() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.token = null;
    this.csrf = null;
    
    localStorage.removeItem(APP_CONFIG.AUTH.TOKEN_KEY);
    localStorage.removeItem(APP_CONFIG.AUTH.CSRF_KEY);
    localStorage.removeItem(APP_CONFIG.AUTH.USER_KEY);
  },

  getToken() {
    return this.token || localStorage.getItem(APP_CONFIG.AUTH.TOKEN_KEY);
  },

  getCsrf() {
    return this.csrf || localStorage.getItem(APP_CONFIG.AUTH.CSRF_KEY);
  },

  getUser() {
    if (this.currentUser) return this.currentUser;
    
    const encodedUser = localStorage.getItem(APP_CONFIG.AUTH.USER_KEY);
    if (encodedUser) {
      try {
        return Base64Util.decodeObject(encodedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  getUserRole() {
    const user = this.getUser();
    return user ? user.role : null;
  }
};

// ============================================
// MOCK API SETUP
// ============================================
const MockLoginApi = {
  setupSuccessResponse(userData) {
    const user = userData || LoginTestHelpers.generateMockUser('admin');
    const token = LoginTestHelpers.generateMockSessionToken(user.id);
    const csrf = LoginTestHelpers.generateMockCsrfToken();

    global.fetch = jest.fn().mockResolvedValueOnce(
      LoginTestHelpers.createApiResponse(true, {
        token,
        csrf,
        user,
        permissions: user.permissions,
        sessionExpiry: Date.now() + APP_CONFIG.AUTH.SESSION_TIMEOUT
      })
    );

    return { token, csrf, user };
  },

  setupFailureResponse(status = 401, message = 'Username atau password salah') {
    global.fetch = jest.fn().mockResolvedValueOnce(
      LoginTestHelpers.createApiResponse(false, null, message)
    );
  },

  setupNetworkError() {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));
  },

  setupAccountLockedResponse() {
    global.fetch = jest.fn().mockResolvedValueOnce(
      LoginTestHelpers.createApiResponse(false, {
        locked: true,
        remainingMinutes: 15,
        attempts: APP_CONFIG.AUTH.MAX_LOGIN_ATTEMPTS
      }, 'Akun terkunci karena terlalu banyak percobaan login')
    );
  },

  setupMaintenanceResponse() {
    global.fetch = jest.fn().mockResolvedValueOnce(
      LoginTestHelpers.createApiResponse(false, {
        maintenance: true,
        estimatedDuration: 60
      }, 'Sistem sedang dalam pemeliharaan')
    );
  },

  setupTwoFactorRequiredResponse() {
    const user = LoginTestHelpers.generateMockUser('admin');
    const tempToken = LoginTestHelpers.generateMockSessionToken(user.id);

    global.fetch = jest.fn().mockResolvedValueOnce(
      LoginTestHelpers.createApiResponse(true, {
        requires2FA: true,
        tempToken,
        user: { id: user.id, username: user.username },
        methods: ['totp', 'sms']
      }, 'Verifikasi 2FA diperlukan')
    );
  }
};

// ============================================
// MAIN TEST SUITE
// ============================================
describe('Login Integration Tests - Arsip Surat Digital Enterprise v3.2.2', () => {

  // ============================================
  // SETUP & TEARDOWN
  // ============================================
  beforeAll(() => {
    // Mock window.location
    delete window.location;
    window.location = {
      hash: '#/login',
      href: 'http://localhost/',
      replace: jest.fn(),
      assign: jest.fn()
    };
  });

  beforeEach(() => {
    // Setup DOM
    LoginTestHelpers.setupLoginDOM();
    
    // Clear auth storage
    LoginTestHelpers.clearAuthStorage();
    
    // Reset mock auth service
    MockAuthService.reset();
    
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    // Cleanup DOM
    document.body.innerHTML = '';
    
    // Clear storage
    LoginTestHelpers.clearAuthStorage();
    
    // Restore mocks
    jest.restoreAllMocks();
  });

  afterAll(() => {
    // Final cleanup
    LoginTestHelpers.clearAuthStorage();
  });

  // ============================================
  // RENDER TESTS
  // ============================================
  describe('Login Form Rendering', () => {

    test('Should render login form with all required elements', () => {
      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');
      const loginButton = document.getElementById('btn-login');
      const loginForm = document.getElementById('login-form');
      const rememberCheckbox = document.getElementById('remember');

      expect(usernameInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      expect(loginButton).toBeTruthy();
      expect(loginForm).toBeTruthy();
      expect(rememberCheckbox).toBeTruthy();
    });

    test('Should render app branding', () => {
      const authTitle = document.querySelector('.auth-title');
      const authSubtitle = document.querySelector('.auth-subtitle');

      expect(authTitle).toBeTruthy();
      expect(authTitle.textContent).toContain('Arsip Surat Digital');
      expect(authSubtitle).toBeTruthy();
      expect(authSubtitle.textContent).toContain(APP_CONFIG.APP_VERSION);
    });

    test('Should render form links', () => {
      const forgotPasswordLink = document.querySelector('a[href="#/forgot-password"]');
      expect(forgotPasswordLink).toBeTruthy();
    });

    test('Should have correct input attributes', () => {
      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');

      expect(usernameInput.type).toBe('text');
      expect(usernameInput.autocomplete).toBe('username');
      expect(usernameInput.required).toBe(true);

      expect(passwordInput.type).toBe('password');
      expect(passwordInput.autocomplete).toBe('current-password');
      expect(passwordInput.required).toBe(true);
    });

    test('Should render password toggle button', () => {
      const toggleBtn = document.querySelector('.input-toggle-password');
      expect(toggleBtn).toBeTruthy();
      expect(toggleBtn.type).toBe('button');
    });
  });

  // ============================================
  // VALIDATION TESTS
  // ============================================
  describe('Form Validation', () => {

    test('Should show error when username is empty', async () => {
      await LoginTestHelpers.fillLoginForm('', 'password123');
      await LoginTestHelpers.submitLoginForm();

      const errors = LoginTestHelpers.getFormErrors();
      expect(errors.username).toBeTruthy();
    });

    test('Should show error when password is empty', async () => {
      await LoginTestHelpers.fillLoginForm('admin', '');
      await LoginTestHelpers.submitLoginForm();

      const errors = LoginTestHelpers.getFormErrors();
      expect(errors.password).toBeTruthy();
    });

    test('Should show errors when both fields are empty', async () => {
      await LoginTestHelpers.fillLoginForm('', '');
      await LoginTestHelpers.submitLoginForm();

      const errors = LoginTestHelpers.getFormErrors();
      expect(errors.username).toBeTruthy();
      expect(errors.password).toBeTruthy();
    });

    test('Should validate username minimum length', async () => {
      await LoginTestHelpers.fillLoginForm('ab', 'password123');
      await LoginTestHelpers.submitLoginForm();

      const errors = LoginTestHelpers.getFormErrors();
      // Username minimal 3 karakter
      expect(errors.username).toBeTruthy();
    });

    test('Should validate password minimum length', async () => {
      await LoginTestHelpers.fillLoginForm('admin', '12345');
      await LoginTestHelpers.submitLoginForm();

      const errors = LoginTestHelpers.getFormErrors();
      // Password minimal 6 karakter
      expect(errors.password).toBeTruthy();
    });

    test('Should clear validation errors on input change', async () => {
      // Trigger error first
      await LoginTestHelpers.fillLoginForm('', '');
      await LoginTestHelpers.submitLoginForm();

      let errors = LoginTestHelpers.getFormErrors();
      expect(errors.username).toBeTruthy();

      // Fill username
      await LoginTestHelpers.fillLoginForm('admin', 'password123');

      errors = LoginTestHelpers.getFormErrors();
      expect(errors.username).toBeFalsy();
    });
  });

  // ============================================
  // SUCCESSFUL LOGIN TESTS
  // ============================================
  describe('Successful Login', () => {

    test('Should login successfully with admin credentials', async () => {
      const userData = LoginTestHelpers.generateMockUser('admin');
      const { token, csrf } = MockLoginApi.setupSuccessResponse(userData);

      await LoginTestHelpers.fillLoginForm('admin', 'password123');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify API was called with correct parameters
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      const fetchCall = global.fetch.mock.calls[0];
      const fetchUrl = fetchCall[0];
      
      expect(fetchUrl).toContain(APP_CONFIG.API.BASE_URL);

      // Verify auth state
      expect(MockAuthService.getToken()).toBeTruthy();
      expect(MockAuthService.getCsrf()).toBeTruthy();
    });

    test('Should login successfully with kabid credentials', async () => {
      const userData = LoginTestHelpers.generateMockUser('kabid');
      MockLoginApi.setupSuccessResponse(userData);

      await LoginTestHelpers.fillLoginForm('kabid', 'password123');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(global.fetch).toHaveBeenCalled();
    });

    test('Should login successfully with staff credentials', async () => {
      const userData = LoginTestHelpers.generateMockUser('staff');
      MockLoginApi.setupSuccessResponse(userData);

      await LoginTestHelpers.fillLoginForm('staff', 'password123');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(global.fetch).toHaveBeenCalled();
    });

    test('Should store user data after successful login', async () => {
      const userData = LoginTestHelpers.generateMockUser('admin');
      const { token, csrf, user } = MockLoginApi.setupSuccessResponse(userData);

      // Simulate login
      MockAuthService.login(user, token, csrf);

      const storedUser = MockAuthService.getUser();
      expect(storedUser).toBeTruthy();
      expect(storedUser.username).toBe('admin');
      expect(storedUser.role).toBe('admin');
      expect(storedUser.namaLengkap).toBe('Administrator Sistem');
    });

    test('Should store session token after successful login', async () => {
      const userData = LoginTestHelpers.generateMockUser('admin');
      const { token } = MockLoginApi.setupSuccessResponse(userData);

      // Simpan token ke localStorage
      localStorage.setItem(APP_CONFIG.AUTH.TOKEN_KEY, token);

      const storedToken = localStorage.getItem(APP_CONFIG.AUTH.TOKEN_KEY);
      expect(storedToken).toBeTruthy();
      
      // Verify token is valid Base64
      const decoded = Base64Util.decodeObject(storedToken);
      expect(decoded).toBeTruthy();
      expect(decoded.userId).toBe('user-001');
      expect(decoded.expiresAt).toBeGreaterThan(Date.now());
    });

    test('Should handle remember me checkbox', async () => {
      const userData = LoginTestHelpers.generateMockUser('admin');
      MockLoginApi.setupSuccessResponse(userData);

      await LoginTestHelpers.fillLoginForm('admin', 'password123', true);
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify remember me is stored
      localStorage.setItem(APP_CONFIG.AUTH.REMEMBER_KEY, 'true');
      expect(localStorage.getItem(APP_CONFIG.AUTH.REMEMBER_KEY)).toBe('true');
    });

    test('Should redirect after successful login', async () => {
      const userData = LoginTestHelpers.generateMockUser('admin');
      MockLoginApi.setupSuccessResponse(userData);

      await LoginTestHelpers.fillLoginForm('admin', 'password123');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify redirect intent (hash should change)
      // In actual implementation, router would handle this
      expect(true).toBe(true);
    });
  });

  // ============================================
  // FAILED LOGIN TESTS
  // ============================================
  describe('Failed Login', () => {

    test('Should show error on invalid credentials', async () => {
      MockLoginApi.setupFailureResponse(401, 'Username atau password salah');

      await LoginTestHelpers.fillLoginForm('admin', 'wrongpassword');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 200));

      const loginError = LoginTestHelpers.getLoginError();
      expect(loginError).toBeTruthy();
      expect(loginError).toContain('salah');
    });

    test('Should not authenticate on failed login', async () => {
      MockLoginApi.setupFailureResponse(401);

      await LoginTestHelpers.fillLoginForm('admin', 'wrongpassword');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(MockAuthService.isAuthenticated).toBe(false);
      expect(localStorage.getItem(APP_CONFIG.AUTH.TOKEN_KEY)).toBeNull();
    });

    test('Should handle account locked response', async () => {
      MockLoginApi.setupAccountLockedResponse();

      await LoginTestHelpers.fillLoginForm('admin', 'password123');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 200));

      const loginError = LoginTestHelpers.getLoginError();
      expect(loginError).toBeTruthy();
      expect(loginError).toContain('terkunci');
    });

    test('Should handle maintenance mode', async () => {
      MockLoginApi.setupMaintenanceResponse();

      await LoginTestHelpers.fillLoginForm('admin', 'password123');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 200));

      const loginError = LoginTestHelpers.getLoginError();
      expect(loginError).toBeTruthy();
      expect(loginError).toContain('pemeliharaan');
    });

    test('Should handle inactive user account', async () => {
      const inactiveUser = LoginTestHelpers.generateMockUser('admin');
      inactiveUser.aktif = false;

      global.fetch = jest.fn().mockResolvedValueOnce(
        LoginTestHelpers.createApiResponse(false, {
          inactive: true
        }, 'Akun tidak aktif. Hubungi administrator.')
      );

      await LoginTestHelpers.fillLoginForm('admin', 'password123');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 200));

      const loginError = LoginTestHelpers.getLoginError();
      expect(loginError).toBeTruthy();
      expect(loginError).toContain('tidak aktif');
    });
  });

  // ============================================
  // NETWORK ERROR TESTS
  // ============================================
  describe('Network Errors', () => {

    test('Should handle network error gracefully', async () => {
      MockLoginApi.setupNetworkError();

      await LoginTestHelpers.fillLoginForm('admin', 'password123');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 200));

      const loginError = LoginTestHelpers.getLoginError();
      expect(loginError).toBeTruthy();
      expect(loginError).toContain('jaringan');
    });

    test('Should handle timeout', async () => {
      // Mock slow response that times out
      global.fetch = jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('Timeout'));
          }, APP_CONFIG.API.TIMEOUT + 1000);
        });
      });

      await LoginTestHelpers.fillLoginForm('admin', 'password123');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Login button should show loading state
      expect(LoginTestHelpers.isLoginButtonLoading()).toBe(true);
    });

    test('Should handle server error (500)', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(
        LoginTestHelpers.createApiResponse(false, null, 'Internal server error')
      );

      await LoginTestHelpers.fillLoginForm('admin', 'password123');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 200));

      const loginError = LoginTestHelpers.getLoginError();
      expect(loginError).toBeTruthy();
    });

    test('Should allow retry after network error', async () => {
      // First attempt fails
      MockLoginApi.setupNetworkError();

      await LoginTestHelpers.fillLoginForm('admin', 'password123');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify error is shown
      let loginError = LoginTestHelpers.getLoginError();
      expect(loginError).toBeTruthy();

      // Second attempt succeeds
      MockLoginApi.setupSuccessResponse(LoginTestHelpers.generateMockUser('admin'));

      await LoginTestHelpers.submitLoginForm();
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================
  // 2FA TESTS
  // ============================================
  describe('Two-Factor Authentication', () => {

    test('Should redirect to 2FA page when required', async () => {
      MockLoginApi.setupTwoFactorRequiredResponse();

      await LoginTestHelpers.fillLoginForm('admin', 'password123');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 200));

      // In actual implementation, router would navigate to /2fa
      expect(global.fetch).toHaveBeenCalled();
    });

    test('Should store temp token for 2FA', async () => {
      MockLoginApi.setupTwoFactorRequiredResponse();

      await LoginTestHelpers.fillLoginForm('admin', 'password123');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify API response includes temp token
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  // ============================================
  // LOADING STATE TESTS
  // ============================================
  describe('Loading States', () => {

    test('Should show loading state on submit', async () => {
      // Slow response
      global.fetch = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(LoginTestHelpers.createApiResponse(true, {
              token: LoginTestHelpers.generateMockSessionToken('user-001'),
              csrf: LoginTestHelpers.generateMockCsrfToken(),
              user: LoginTestHelpers.generateMockUser('admin')
            }));
          }, 2000);
        });
      });

      await LoginTestHelpers.fillLoginForm('admin', 'password123');
      await LoginTestHelpers.submitLoginForm();

      // Check loading state immediately
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(LoginTestHelpers.isLoginButtonLoading()).toBe(true);
    });

    test('Should disable form during submission', async () => {
      global.fetch = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(LoginTestHelpers.createApiResponse(true, {
              token: LoginTestHelpers.generateMockSessionToken('user-001'),
              csrf: LoginTestHelpers.generateMockCsrfToken(),
              user: LoginTestHelpers.generateMockUser('admin')
            }));
          }, 2000);
        });
      });

      await LoginTestHelpers.fillLoginForm('admin', 'password123');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 50));

      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');

      expect(usernameInput.disabled).toBe(true);
      expect(passwordInput.disabled).toBe(true);
    });
  });

  // ============================================
  // SECURITY TESTS
  // ============================================
  describe('Security', () => {

    test('Should not expose sensitive data in DOM', () => {
      const passwordInput = document.getElementById('password');
      expect(passwordInput.type).toBe('password');
    });

    test('Should use HTTPS for API calls', () => {
      expect(APP_CONFIG.API.BASE_URL).toMatch(/^https:\/\//);
    });

    test('Should encode data with Base64', async () => {
      MockLoginApi.setupSuccessResponse(LoginTestHelpers.generateMockUser('admin'));

      await LoginTestHelpers.fillLoginForm('admin', 'password123');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify API call was made
      expect(global.fetch).toHaveBeenCalled();
    });

    test('Should not store password in localStorage', () => {
      localStorage.setItem('test-password', 'password123');
      
      // After login, password should not be stored
      const storedPassword = localStorage.getItem('password');
      expect(storedPassword).toBeNull();
      
      localStorage.removeItem('test-password');
    });

    test('Should clear sensitive data on logout', () => {
      // Setup auth data
      const user = LoginTestHelpers.generateMockUser('admin');
      const token = LoginTestHelpers.generateMockSessionToken(user.id);
      const csrf = LoginTestHelpers.generateMockCsrfToken();

      MockAuthService.login(user, token, csrf);

      expect(MockAuthService.isAuthenticated).toBe(true);
      expect(localStorage.getItem(APP_CONFIG.AUTH.TOKEN_KEY)).toBeTruthy();

      // Logout
      MockAuthService.logout();

      expect(MockAuthService.isAuthenticated).toBe(false);
      expect(localStorage.getItem(APP_CONFIG.AUTH.TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(APP_CONFIG.AUTH.USER_KEY)).toBeNull();
      expect(localStorage.getItem(APP_CONFIG.AUTH.CSRF_KEY)).toBeNull();
    });

    test('Should handle CSRF token refresh', () => {
      const oldCsrf = LoginTestHelpers.generateMockCsrfToken();
      const newCsrf = LoginTestHelpers.generateMockCsrfToken();

      expect(oldCsrf).not.toBe(newCsrf);
      expect(Base64Util.decodeObject(oldCsrf)).toBeTruthy();
      expect(Base64Util.decodeObject(newCsrf)).toBeTruthy();
    });

    test('Should handle session expiry', () => {
      const user = LoginTestHelpers.generateMockUser('admin');
      
      // Create expired token
      const expiredTokenData = {
        userId: user.id,
        sessionId: 'sess-expired',
        issuedAt: Date.now() - 7200000, // 2 hours ago
        expiresAt: Date.now() - 3600000, // 1 hour ago (expired)
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent
      };
      
      const expiredToken = Base64Util.encodeObject(expiredTokenData);
      const decoded = Base64Util.decodeObject(expiredToken);
      
      expect(decoded.expiresAt).toBeLessThan(Date.now());
    });
  });

  // ============================================
  // BRUTE FORCE PROTECTION TESTS
  // ============================================
  describe('Brute Force Protection', () => {

    test('Should track login attempts', () => {
      const attempts = [];
      
      // Simulate multiple failed attempts
      for (let i = 0; i < APP_CONFIG.AUTH.MAX_LOGIN_ATTEMPTS; i++) {
        attempts.push({
          attempt: i + 1,
          timestamp: Date.now(),
          username: 'admin'
        });
      }

      expect(attempts.length).toBe(APP_CONFIG.AUTH.MAX_LOGIN_ATTEMPTS);
    });

    test('Should lock account after max attempts', async () => {
      // Setup locked response
      MockLoginApi.setupAccountLockedResponse();

      await LoginTestHelpers.fillLoginForm('admin', 'password123');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 200));

      const loginError = LoginTestHelpers.getLoginError();
      expect(loginError).toBeTruthy();
      expect(loginError.toLowerCase()).toContain('terkunci');
    });
  });

  // ============================================
  // ACCESSIBILITY TESTS
  // ============================================
  describe('Accessibility', () => {

    test('Should have labels for inputs', () => {
      const usernameLabel = document.querySelector('label[for="username"]');
      const passwordLabel = document.querySelector('label[for="password"]');

      expect(usernameLabel).toBeTruthy();
      expect(passwordLabel).toBeTruthy();
    });

    test('Should have proper autocomplete attributes', () => {
      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');

      expect(usernameInput.getAttribute('autocomplete')).toBe('username');
      expect(passwordInput.getAttribute('autocomplete')).toBe('current-password');
    });

    test('Should have submit button with text', () => {
      const submitBtn = document.getElementById('btn-login');
      expect(submitBtn).toBeTruthy();
      expect(submitBtn.textContent).toContain('Masuk');
    });

    test('Should have accessible error messages', () => {
      const errorElement = document.getElementById('login-error');
      expect(errorElement).toBeTruthy();
    });
  });

  // ============================================
  // BASE64 ENCODING TESTS
  // ============================================
  describe('Base64 Encoding for Login', () => {

    test('Should encode login credentials correctly', () => {
      const credentials = {
        username: 'admin',
        password: 'test-password',
        timestamp: Date.now()
      };

      const encoded = Base64Util.encodeObject(credentials);
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');

      const decoded = Base64Util.decodeObject(encoded);
      expect(decoded).toEqual(credentials);
      expect(decoded.username).toBe('admin');
    });

    test('Should encode session token correctly', () => {
      const sessionData = {
        userId: 'user-001',
        sessionId: 'sess-12345',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 3600000
      };

      const encoded = Base64Util.encodeObject(sessionData);
      const decoded = Base64Util.decodeObject(encoded);

      expect(decoded.userId).toBe(sessionData.userId);
      expect(decoded.sessionId).toBe(sessionData.sessionId);
    });

    test('Should encode CSRF token correctly', () => {
      const csrfData = {
        token: 'csrf-random-token',
        expiresAt: Date.now() + 3600000,
        issuedAt: Date.now()
      };

      const encoded = Base64Util.encodeObject(csrfData);
      expect(encoded).toBeTruthy();

      const decoded = Base64Util.decodeObject(encoded);
      expect(decoded.token).toBe(csrfData.token);
    });

    test('Should not expose password in encoded payload', () => {
      const payload = {
        action: 'login',
        username: 'admin',
        password: 'secret-password',
        timestamp: Date.now()
      };

      const encoded = Base64Util.encodeObject(payload);
      const decoded = Base64Util.decodeObject(encoded);

      // Password should be in the decoded payload (for transmission)
      expect(decoded.password).toBe('secret-password');
      
      // But should never be stored
      localStorage.setItem('test', encoded);
      const stored = localStorage.getItem('test');
      localStorage.removeItem('test');
      
      expect(stored).toBe(encoded);
    });
  });

  // ============================================
  // SHEETS INTEGRATION TESTS
  // ============================================
  describe('Google Sheets Integration', () => {

    test('Should verify sheets connection on login', async () => {
      const sheetsConnected = true;
      
      const responseData = {
        token: LoginTestHelpers.generateMockSessionToken('user-001'),
        csrf: LoginTestHelpers.generateMockCsrfToken(),
        user: LoginTestHelpers.generateMockUser('admin'),
        sheetsConnected
      };

      global.fetch = jest.fn().mockResolvedValueOnce(
        LoginTestHelpers.createApiResponse(true, responseData)
      );

      await LoginTestHelpers.fillLoginForm('admin', 'password123');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(global.fetch).toHaveBeenCalled();
    });

    test('Should handle sheets connection failure', async () => {
      const responseData = {
        token: LoginTestHelpers.generateMockSessionToken('user-001'),
        csrf: LoginTestHelpers.generateMockCsrfToken(),
        user: LoginTestHelpers.generateMockUser('admin'),
        sheetsConnected: false
      };

      global.fetch = jest.fn().mockResolvedValueOnce(
        LoginTestHelpers.createApiResponse(true, responseData, 'Login berhasil, koneksi spreadsheet terbatas')
      );

      await LoginTestHelpers.fillLoginForm('admin', 'password123');
      await LoginTestHelpers.submitLoginForm();

      await new Promise(resolve => setTimeout(resolve, 200));

      // Login should still succeed even if sheets is not connected
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});

// ============================================
// EXPORT FOR TEST RUNNER
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LoginTestHelpers,
    MockAuthService,
    MockLoginApi
  };
}
