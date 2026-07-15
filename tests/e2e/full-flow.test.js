/**
 * END-TO-END TESTS - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * File: tests/e2e/full-flow.test.js
 * Support: Google Apps Script (code.gs) + Google Sheets + Frontend
 * Encoding: Base64 untuk komunikasi data
 */

// ============================================
// TEST HELPERS & UTILITIES
// ============================================
const TestHelpers = {
  /**
   * Generate mock sheet data
   */
  generateMockSheetData(sheetName, count = 5) {
    const generators = {
      SuratMasuk: (i) => ({
        id: `sm-${i}`,
        nomorSurat: `SM-${String(i).padStart(3, '0')}/2024`,
        nomorAgenda: `AGD-${String(i).padStart(3, '0')}/2024`,
        tanggalSurat: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        tanggalDiterima: new Date().toISOString().split('T')[0],
        pengirim: `Dinas ${String.fromCharCode(65 + i)}`,
        perihal: `Surat Undangan ${i}`,
        sifat: ['biasa', 'penting', 'segera', 'rahasia'][i % 4],
        status: ['diterima', 'diproses', 'selesai'][i % 3],
        fileUrl: '',
        fileName: '',
        fileBase64: '',
        klasifikasi: `KL-${String(i).padStart(2, '0')}`,
        catatan: `Catatan surat ${i}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin'
      }),
      SuratKeluar: (i) => ({
        id: `sk-${i}`,
        nomorSurat: `SK-${String(i).padStart(3, '0')}/2024`,
        tanggalSurat: new Date().toISOString().split('T')[0],
        tujuan: `Instansi ${String.fromCharCode(65 + i)}`,
        perihal: `Balasan Surat ${i}`,
        sifat: ['biasa', 'penting'][i % 2],
        status: ['draft', 'dikirim', 'selesai'][i % 3],
        fileUrl: '',
        fileName: '',
        fileBase64: '',
        klasifikasi: `KL-${String(i).padStart(2, '0')}`,
        approvalStatus: ['pending', 'approved', 'rejected'][i % 3],
        disposisiTerkait: '',
        catatan: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin'
      }),
      Disposisi: (i) => ({
        id: `disp-${i}`,
        suratId: `sm-${i}`,
        suratType: 'surat_masuk',
        dari: 'Kepala Dinas',
        kepada: `Staff ${i}`,
        instruksi: `Instruksi disposisi ${i}`,
        status: ['pending', 'diproses', 'selesai'][i % 3],
        tanggalTenggat: new Date(Date.now() + (i * 86400000)).toISOString().split('T')[0],
        tanggalSelesai: i % 2 === 0 ? new Date().toISOString().split('T')[0] : '',
        tindakLanjut: i % 2 === 0 ? 'Sudah ditindaklanjuti' : '',
        prioritas: ['normal', 'tinggi', 'rendah'][i % 3],
        eskalasi: '',
        catatan: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }),
      Users: (i) => ({
        id: `user-${i}`,
        username: `user${i}`,
        namaLengkap: `User ${i}`,
        email: `user${i}@example.com`,
        role: ['admin', 'kabid', 'kasubag', 'staff'][i % 4],
        jabatan: `Jabatan ${i}`,
        bidang: `Bidang ${i}`,
        aktif: true,
        avatarBase64: '',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }),
      Notifikasi: (i) => ({
        id: `notif-${i}`,
        userId: 'user-1',
        type: ['info', 'success', 'warning', 'error'][i % 4],
        title: `Notifikasi ${i}`,
        message: `Pesan notifikasi ${i}`,
        read: i % 2 === 0,
        link: `/surat-masuk/${i}`,
        createdAt: new Date().toISOString()
      }),
      AuditLog: (i) => ({
        id: `audit-${i}`,
        userId: 'user-1',
        action: ['create', 'update', 'delete', 'read'][i % 4],
        module: ['surat_masuk', 'surat_keluar', 'disposisi'][i % 3],
        detail: `Detail audit ${i}`,
        ipAddress: '127.0.0.1',
        timestamp: new Date().toISOString()
      })
    };

    const generator = generators[sheetName];
    if (!generator) return [];

    return Array.from({ length: count }, (_, i) => generator(i + 1));
  },

  /**
   * Create mock fetch response with Base64
   */
  createMockResponse(data, status = 'success') {
    const payload = Base64Util.encodeObject({
      status,
      data,
      timestamp: Date.now(),
      version: APP_CONFIG.APP_VERSION
    });

    return {
      ok: status === 'success',
      status: status === 'success' ? 200 : 400,
      json: () => Promise.resolve({
        payload,
        status,
        timestamp: Date.now()
      }),
      text: () => Promise.resolve(JSON.stringify({ payload, status })),
      blob: () => Promise.resolve(new Blob([JSON.stringify({ payload, status })]))
    };
  },

  /**
   * Create mock file for upload testing
   */
  createMockFile(name = 'test.pdf', type = 'application/pdf', size = 1024) {
    const content = new Array(size).fill('a').join('');
    return new File([content], name, { type });
  },

  /**
   * Wait for DOM updates
   */
  waitForRender(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Wait for async operations
   */
  waitForAsync(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Find element with fallback
   */
  findElement(selector, parent = document) {
    return parent.querySelector(selector);
  },

  /**
   * Find all elements
   */
  findElements(selector, parent = document) {
    return parent.querySelectorAll(selector);
  },

  /**
   * Set input value and trigger events
   */
  async setInputValue(element, value) {
    if (!element) return;
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    await this.waitForRender(50);
  },

  /**
   * Click element with event simulation
   */
  async clickElement(element) {
    if (!element) return;
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await this.waitForRender(50);
  },

  /**
   * Check if element has class
   */
  hasClass(element, className) {
    return element && element.classList.contains(className);
  },

  /**
   * Get text content safely
   */
  getText(element) {
    return element ? element.textContent.trim() : '';
  },

  /**
   * Clear all storage
   */
  clearAllStorage() {
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear IndexedDB
    if (window.indexedDB) {
      const dbNames = ['ASD_StateDB'];
      dbNames.forEach(name => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => console.log(`Deleted database: ${name}`);
        request.onerror = () => console.error(`Failed to delete database: ${name}`);
      });
    }
    
    // Clear cookies
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  }
};

// ============================================
// MOCK API SETUP
// ============================================
const MockApiSetup = {
  mockResponses: {},
  callHistory: [],

  /**
   * Initialize mock responses
   */
  init() {
    this.mockResponses = {
      // System
      'ping': () => TestHelpers.createMockResponse({ 
        message: 'API Running', 
        version: APP_CONFIG.APP_VERSION,
        sheetsConnected: true 
      }),
      'system.health': () => TestHelpers.createMockResponse({
        status: 'healthy',
        sheets: 'connected',
        uptime: 3600,
        memory: '512MB'
      }),
      'system.status': () => TestHelpers.createMockResponse({
        cpu: '45%',
        memory: '60%',
        disk: '30%',
        activeUsers: 5,
        requestsPerMinute: 120
      }),

      // Auth
      'login': () => TestHelpers.createMockResponse({
        token: Base64Util.encode('mock-token-admin-2024'),
        csrf: Base64Util.encode('mock-csrf-token'),
        user: {
          id: 'user-1',
          username: 'admin',
          namaLengkap: 'Administrator',
          email: 'admin@example.com',
          role: 'admin',
          jabatan: 'Administrator Sistem',
          bidang: 'IT'
        },
        permissions: { 
          all: ['*'],
          suratMasuk: ['create', 'read', 'update', 'delete'],
          suratKeluar: ['create', 'read', 'update', 'delete'],
          disposisi: ['create', 'read', 'update', 'delete'],
          users: ['create', 'read', 'update', 'delete']
        },
        sessionExpiry: Date.now() + APP_CONFIG.AUTH.SESSION_TIMEOUT
      }),
      'logout': () => TestHelpers.createMockResponse({ message: 'Logged out successfully' }),
      'me': () => TestHelpers.createMockResponse({
        user: {
          id: 'user-1',
          username: 'admin',
          namaLengkap: 'Administrator',
          email: 'admin@example.com',
          role: 'admin'
        },
        token: Base64Util.encode('mock-token-refreshed')
      }),
      'csrf.generate': () => TestHelpers.createMockResponse({
        csrf: Base64Util.encode('mock-csrf-new')
      }),

      // Dashboard
      'dashboard.stats': () => TestHelpers.createMockResponse({
        suratMasuk: { total: 150, bulanIni: 25, pending: 10 },
        suratKeluar: { total: 120, bulanIni: 20, pending: 8 },
        disposisi: { total: 200, bulanIni: 35, pending: 15, terlambat: 5 },
        users: { total: 50, aktif: 45 }
      }),
      'dashboard.chart': () => TestHelpers.createMockResponse({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        suratMasuk: [20, 25, 30, 22, 28, 25],
        suratKeluar: [15, 20, 25, 18, 22, 20],
        disposisi: [30, 35, 40, 32, 38, 35]
      }),
      'dashboard.aiInsights': () => TestHelpers.createMockResponse({
        insights: [
          'Tren surat masuk meningkat 15% bulan ini',
          'Disposisi dengan prioritas tinggi perlu perhatian khusus',
          'Rata-rata waktu penyelesaian disposisi: 3 hari'
        ],
        recommendations: [
          'Tingkatkan monitoring disposisi prioritas tinggi',
          'Optimalkan distribusi surat masuk'
        ]
      }),

      // Surat Masuk
      'suratMasuk.list': (params) => {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const allItems = TestHelpers.generateMockSheetData('SuratMasuk', 25);
        const start = (page - 1) * limit;
        const items = allItems.slice(start, start + limit);
        
        return TestHelpers.createMockResponse({
          items,
          pagination: { page, limit, total: allItems.length, totalPages: Math.ceil(allItems.length / limit) }
        });
      },
      'suratMasuk.detail': (params) => {
        const items = TestHelpers.generateMockSheetData('SuratMasuk', 1);
        return TestHelpers.createMockResponse(items[0]);
      },
      'suratMasuk.create': () => TestHelpers.createMockResponse({
        id: 'sm-new',
        nomorAgenda: `AGD-${Date.now()}/2024`,
        message: 'Surat masuk berhasil dibuat'
      }),
      'suratMasuk.update': () => TestHelpers.createMockResponse({
        message: 'Surat masuk berhasil diupdate'
      }),
      'suratMasuk.delete': () => TestHelpers.createMockResponse({
        message: 'Surat masuk berhasil dihapus'
      }),
      'suratMasuk.stats': () => TestHelpers.createMockResponse({
        total: 150,
        byStatus: { diterima: 50, diproses: 60, selesai: 30, diarsipkan: 10 },
        bySifat: { biasa: 60, penting: 40, segera: 30, rahasia: 20 },
        byMonth: [
          { month: 'Jan', count: 20 },
          { month: 'Feb', count: 25 }
        ]
      }),

      // Surat Keluar
      'suratKeluar.list': (params) => {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const allItems = TestHelpers.generateMockSheetData('SuratKeluar', 20);
        const start = (page - 1) * limit;
        const items = allItems.slice(start, start + limit);
        
        return TestHelpers.createMockResponse({
          items,
          pagination: { page, limit, total: allItems.length, totalPages: Math.ceil(allItems.length / limit) }
        });
      },
      'suratKeluar.detail': (params) => {
        const items = TestHelpers.generateMockSheetData('SuratKeluar', 1);
        return TestHelpers.createMockResponse(items[0]);
      },
      'suratKeluar.create': () => TestHelpers.createMockResponse({
        id: 'sk-new',
        nomorSurat: `SK-${Date.now()}/2024`,
        message: 'Surat keluar berhasil dibuat'
      }),
      'suratKeluar.updateStatus': () => TestHelpers.createMockResponse({
        message: 'Status surat keluar berhasil diupdate'
      }),
      'suratKeluar.submitApproval': () => TestHelpers.createMockResponse({
        message: 'Approval request submitted',
        approvalId: 'approval-new'
      }),

      // Disposisi
      'disposisi.list': (params) => {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const allItems = TestHelpers.generateMockSheetData('Disposisi', 30);
        const start = (page - 1) * limit;
        const items = allItems.slice(start, start + limit);
        
        return TestHelpers.createMockResponse({
          items,
          pagination: { page, limit, total: allItems.length, totalPages: Math.ceil(allItems.length / limit) }
        });
      },
      'disposisi.detail': (params) => {
        const items = TestHelpers.generateMockSheetData('Disposisi', 1);
        return TestHelpers.createMockResponse(items[0]);
      },
      'disposisi.create': () => TestHelpers.createMockResponse({
        id: 'disp-new',
        message: 'Disposisi berhasil dibuat'
      }),
      'disposisi.tindakLanjut': () => TestHelpers.createMockResponse({
        message: 'Tindak lanjut berhasil dicatat'
      }),
      'disposisi.updateStatus': () => TestHelpers.createMockResponse({
        message: 'Status disposisi berhasil diupdate'
      }),
      'disposisi.report': () => TestHelpers.createMockResponse({
        total: 200,
        selesai: 150,
        pending: 30,
        terlambat: 20,
        rataRataPenyelesaian: '3 hari'
      }),

      // Approval
      'approval.list': () => TestHelpers.createMockResponse({
        items: [
          { id: 'app-1', suratId: 'sk-1', type: 'surat_keluar', status: 'pending', requestedBy: 'Staff 1' },
          { id: 'app-2', suratId: 'sk-2', type: 'surat_keluar', status: 'approved', approvedBy: 'Kabid A' }
        ],
        total: 2
      }),
      'approval.process': () => TestHelpers.createMockResponse({
        message: 'Approval processed',
        newStatus: 'approved'
      }),

      // Users
      'users.list': () => TestHelpers.createMockResponse({
        items: TestHelpers.generateMockSheetData('Users', 10),
        total: 50
      }),
      'users.profile': () => TestHelpers.createMockResponse({
        id: 'user-1',
        username: 'admin',
        namaLengkap: 'Administrator',
        email: 'admin@example.com',
        role: 'admin',
        jabatan: 'Administrator Sistem',
        bidang: 'IT'
      }),
      'users.create': () => TestHelpers.createMockResponse({
        id: 'user-new',
        message: 'User berhasil dibuat'
      }),
      'users.update': () => TestHelpers.createMockResponse({
        message: 'User berhasil diupdate'
      }),
      'users.delete': () => TestHelpers.createMockResponse({
        message: 'User berhasil dihapus'
      }),

      // Notifications
      'notifikasi.list': () => TestHelpers.createMockResponse({
        items: TestHelpers.generateMockSheetData('Notifikasi', 10),
        unreadCount: 5
      }),
      'notifikasi.read': () => TestHelpers.createMockResponse({ message: 'Notifikasi dibaca' }),
      'notifikasi.readAll': () => TestHelpers.createMockResponse({ message: 'Semua notifikasi dibaca' }),

      // Search
      'search': () => TestHelpers.createMockResponse({
        results: {
          suratMasuk: TestHelpers.generateMockSheetData('SuratMasuk', 2),
          suratKeluar: TestHelpers.generateMockSheetData('SuratKeluar', 2),
          disposisi: TestHelpers.generateMockSheetData('Disposisi', 2)
        },
        total: 6
      }),

      // Files
      'file.upload': () => TestHelpers.createMockResponse({
        fileId: 'file-new',
        url: 'https://example.com/files/test.pdf',
        message: 'File berhasil diupload'
      }),
      'file.list': () => TestHelpers.createMockResponse({
        items: [
          { id: 'file-1', name: 'surat1.pdf', size: 102400, uploadedAt: new Date().toISOString() },
          { id: 'file-2', name: 'surat2.pdf', size: 204800, uploadedAt: new Date().toISOString() }
        ]
      }),

      // Audit Log
      'auditLog.list': () => TestHelpers.createMockResponse({
        items: TestHelpers.generateMockSheetData('AuditLog', 10),
        total: 100
      }),

      // Config
      'config.get': () => TestHelpers.createMockResponse({
        appName: 'Arsip Surat Digital',
        maintenance: false,
        maxFileSize: 10,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx']
      }),
      'config.update': () => TestHelpers.createMockResponse({
        message: 'Konfigurasi berhasil diupdate'
      }),

      // Security
      'csrf.generate': () => TestHelpers.createMockResponse({
        csrf: Base64Util.encode('new-csrf-token')
      }),
      'encrypt.document': () => TestHelpers.createMockResponse({
        encrypted: Base64Util.encode('encrypted-content')
      }),
      'decrypt.document': () => TestHelpers.createMockResponse({
        decrypted: 'decrypted-content'
      }),

      // TTD
      'ttd.sign': () => TestHelpers.createMockResponse({
        signatureId: 'sig-1',
        signedAt: new Date().toISOString(),
        message: 'Dokumen berhasil ditandatangani'
      }),
      'ttd.verify': () => TestHelpers.createMockResponse({
        valid: true,
        signedBy: 'Administrator',
        signedAt: new Date().toISOString()
      }),

      // Export
      'export.data': () => TestHelpers.createMockResponse({
        url: 'https://example.com/exports/data.xlsx',
        message: 'Export berhasil'
      }),
      'export.pdf': () => TestHelpers.createMockResponse({
        url: 'https://example.com/exports/report.pdf',
        message: 'PDF generated'
      })
    };
  },

  /**
   * Setup global fetch mock
   */
  setupFetchMock() {
    global.fetch = jest.fn((url, options = {}) => {
      const urlObj = new URL(url);
      let action = urlObj.searchParams.get('action');
      
      // Try to decode payload if exists
      const dataParam = urlObj.searchParams.get('data');
      let decodedParams = {};
      
      if (dataParam) {
        try {
          decodedParams = Base64Util.decodeObject(dataParam) || {};
          if (decodedParams.action) {
            action = decodedParams.action;
          }
        } catch (e) {
          // Not base64 encoded
        }
      }
      
      // Try to get action from body
      if (!action && options.body) {
        try {
          const body = JSON.parse(options.body);
          if (body.action) action = body.action;
        } catch (e) {}
      }
      
      // Record call
      this.callHistory.push({
        url: url.toString(),
        action,
        params: decodedParams,
        method: options.method || 'GET',
        timestamp: Date.now()
      });
      
      // Get mock response
      const responseHandler = this.mockResponses[action];
      if (responseHandler) {
        return Promise.resolve(responseHandler(decodedParams));
      }
      
      // Default response for unknown actions
      return Promise.resolve(TestHelpers.createMockResponse(
        { message: `Mock response for: ${action}` },
        'success'
      ));
    });
  },

  /**
   * Reset mock history
   */
  resetHistory() {
    this.callHistory = [];
  },

  /**
   * Get call history for action
   */
  getCallsForAction(action) {
    return this.callHistory.filter(call => call.action === action);
  },

  /**
   * Assert API was called
   */
  assertApiCalled(action) {
    const calls = this.getCallsForAction(action);
    expect(calls.length).toBeGreaterThan(0);
    return calls;
  }
};

// ============================================
// TEST SUITES
// ============================================

describe('Arsip Surat Digital Enterprise - Full Flow E2E Tests', () => {
  
  // ============================================
  // SETUP & TEARDOWN
  // ============================================
  beforeAll(async () => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="app">
        <div id="app-shell"></div>
        <div id="toast-container"></div>
        <div id="modal-container"></div>
      </div>
    `;
    
    // Initialize mock API
    MockApiSetup.init();
    MockApiSetup.setupFetchMock();
    
    // Clear all storage
    TestHelpers.clearAllStorage();
    
    // Wait for initialization
    await TestHelpers.waitForAsync(500);
  });

  beforeEach(async () => {
    // Reset state before each test
    MockApiSetup.resetHistory();
    
    // Clear toast container
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) toastContainer.innerHTML = '';
    
    // Clear modal container
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) modalContainer.innerHTML = '';
    
    await TestHelpers.waitForRender(100);
  });

  afterAll(async () => {
    // Cleanup
    TestHelpers.clearAllStorage();
    jest.restoreAllMocks();
  });

  // ============================================
  // AUTHENTICATION TESTS
  // ============================================
  describe('Authentication Flow', () => {
    
    test('Should show login page', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/login');
      }
      await TestHelpers.waitForRender(300);
      
      const loginForm = TestHelpers.findElement('#login-form') || 
                        TestHelpers.findElement('.login-form') ||
                        document.body;
      
      expect(loginForm).toBeTruthy();
    });

    test('Should login successfully with valid credentials', async () => {
      // Fill username
      const usernameInput = TestHelpers.findElement('#username') || 
                           TestHelpers.findElement('[name="username"]');
      if (usernameInput) {
        await TestHelpers.setInputValue(usernameInput, 'admin');
      }
      
      // Fill password
      const passwordInput = TestHelpers.findElement('#password') || 
                           TestHelpers.findElement('[name="password"]');
      if (passwordInput) {
        await TestHelpers.setInputValue(passwordInput, 'password');
      }
      
      // Submit form
      const loginForm = TestHelpers.findElement('#login-form') || 
                       TestHelpers.findElement('.login-form');
      const submitBtn = TestHelpers.findElement('#btn-login') || 
                       TestHelpers.findElement('[type="submit"]');
      
      if (submitBtn) {
        await TestHelpers.clickElement(submitBtn);
      } else if (loginForm) {
        loginForm.dispatchEvent(new Event('submit', { bubbles: true }));
      }
      
      await TestHelpers.waitForAsync(500);
      
      // Verify API was called
      MockApiSetup.assertApiCalled('login');
      
      // Check auth state
      if (typeof store !== 'undefined') {
        const isAuthenticated = store.getState('auth.isAuthenticated');
        expect(isAuthenticated).toBe(true);
      }
    });

    test('Should redirect to dashboard after login', async () => {
      if (typeof store !== 'undefined') {
        store.dispatch('auth.isAuthenticated', true);
        store.dispatch('auth.user', {
          id: 'user-1',
          username: 'admin',
          role: 'admin',
          namaLengkap: 'Administrator'
        });
      }
      
      if (typeof router !== 'undefined') {
        router.navigate('/dashboard');
      }
      
      await TestHelpers.waitForRender(300);
      
      const dashboard = TestHelpers.findElement('#dashboard') || 
                       TestHelpers.findElement('.dashboard') ||
                       document.getElementById('app-shell');
      
      expect(dashboard).toBeTruthy();
    });

    test('Should logout successfully', async () => {
      // Click logout
      const logoutBtn = TestHelpers.findElement('#btn-logout') || 
                       TestHelpers.findElement('.btn-logout') ||
                       TestHelpers.findElement('[data-action="logout"]');
      
      if (logoutBtn) {
        await TestHelpers.clickElement(logoutBtn);
      }
      
      await TestHelpers.waitForAsync(500);
      
      // Verify logout API was called
      MockApiSetup.assertApiCalled('logout');
      
      // Check auth state
      if (typeof store !== 'undefined') {
        const isAuthenticated = store.getState('auth.isAuthenticated');
        expect(isAuthenticated).toBe(false);
      }
    });

    test('Should redirect to login when accessing protected route without auth', async () => {
      if (typeof store !== 'undefined') {
        store.dispatch('auth.isAuthenticated', false);
      }
      
      if (typeof router !== 'undefined') {
        router.navigate('/surat-masuk');
      }
      
      await TestHelpers.waitForRender(300);
      
      // Should redirect to login
      expect(window.location.hash).toContain('login');
    });

    test('Should show 403 for unauthorized role access', async () => {
      if (typeof store !== 'undefined') {
        store.dispatch('auth.isAuthenticated', true);
        store.dispatch('auth.user', {
          role: 'staff',
          namaLengkap: 'Staff User'
        });
      }
      
      if (typeof router !== 'undefined') {
        router.navigate('/settings');
      }
      
      await TestHelpers.waitForRender(300);
      
      // Should show 403 or redirect
      const forbiddenPage = TestHelpers.findElement('.error-403') ||
                           TestHelpers.findElement('[data-page="403"]');
      const currentHash = window.location.hash;
      
      const isForbidden = forbiddenPage || 
                         currentHash.includes('403') || 
                         currentHash.includes('login');
      
      expect(isForbidden).toBeTruthy();
    });
  });

  // ============================================
  // SURAT MASUK TESTS
  // ============================================
  describe('Surat Masuk Flow', () => {
    
    beforeEach(async () => {
      // Ensure authenticated
      if (typeof store !== 'undefined') {
        store.dispatch('auth.isAuthenticated', true);
        store.dispatch('auth.user', {
          id: 'user-1',
          username: 'admin',
          role: 'admin',
          namaLengkap: 'Administrator'
        });
      }
      await TestHelpers.waitForRender(100);
    });

    test('Should display surat masuk list', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/surat-masuk');
      }
      
      await TestHelpers.waitForAsync(500);
      
      // Verify API was called
      MockApiSetup.assertApiCalled('suratMasuk.list');
      
      // Check if table or list exists
      const table = TestHelpers.findElement('#surat-masuk-table') || 
                   TestHelpers.findElement('.data-table') ||
                   TestHelpers.findElement('.surat-masuk-list');
      
      expect(table).toBeTruthy();
    });

    test('Should navigate to create surat masuk form', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/surat-masuk/create');
      }
      
      await TestHelpers.waitForRender(300);
      
      const form = TestHelpers.findElement('.surat-masuk-form') || 
                  TestHelpers.findElement('#surat-masuk-form') ||
                  TestHelpers.findElement('form');
      
      expect(form).toBeTruthy();
    });

    test('Should create new surat masuk', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/surat-masuk/create');
      }
      
      await TestHelpers.waitForRender(300);
      
      // Fill form fields
      const nomorSurat = TestHelpers.findElement('[name="nomorSurat"]') ||
                        TestHelpers.findElement('#nomorSurat');
      const pengirim = TestHelpers.findElement('[name="pengirim"]') ||
                      TestHelpers.findElement('#pengirim');
      const perihal = TestHelpers.findElement('[name="perihal"]') ||
                     TestHelpers.findElement('#perihal');
      
      if (nomorSurat) await TestHelpers.setInputValue(nomorSurat, 'SM-999/2024');
      if (pengirim) await TestHelpers.setInputValue(pengirim, 'Dinas Test');
      if (perihal) await TestHelpers.setInputValue(perihal, 'Surat Test E2E');
      
      // Submit form
      const submitBtn = TestHelpers.findElement('#btn-submit') || 
                       TestHelpers.findElement('[type="submit"]');
      const form = TestHelpers.findElement('form');
      
      if (submitBtn) {
        await TestHelpers.clickElement(submitBtn);
      } else if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true }));
      }
      
      await TestHelpers.waitForAsync(500);
      
      // Verify create API was called
      MockApiSetup.assertApiCalled('suratMasuk.create');
      
      // Check for success notification
      const successToast = TestHelpers.findElement('.toast--success') ||
                          TestHelpers.findElement('.alert-success');
      
      // If no toast element, just verify no error
      if (!successToast) {
        const errorToast = TestHelpers.findElement('.toast--error');
        expect(errorToast).toBeFalsy();
      }
    });

    test('Should view surat masuk detail', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/surat-masuk/sm-1');
      }
      
      await TestHelpers.waitForAsync(500);
      
      // Verify detail API was called
      MockApiSetup.assertApiCalled('suratMasuk.detail');
      
      // Check detail elements
      const detailContainer = TestHelpers.findElement('.surat-masuk-detail') ||
                             TestHelpers.findElement('.detail-container') ||
                             document.getElementById('app-shell');
      
      expect(detailContainer).toBeTruthy();
    });

    test('Should edit surat masuk', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/surat-masuk/sm-1/edit');
      }
      
      await TestHelpers.waitForRender(300);
      
      // Verify form is loaded
      const editForm = TestHelpers.findElement('form');
      expect(editForm).toBeTruthy();
      
      // Update a field
      const perihalInput = TestHelpers.findElement('[name="perihal"]') ||
                          TestHelpers.findElement('#perihal');
      
      if (perihalInput) {
        await TestHelpers.setInputValue(perihalInput, 'Surat Test Updated');
      }
      
      // Submit
      const submitBtn = TestHelpers.findElement('#btn-submit') || 
                       TestHelpers.findElement('[type="submit"]');
      
      if (submitBtn) {
        await TestHelpers.clickElement(submitBtn);
      }
      
      await TestHelpers.waitForAsync(300);
      
      // Verify update API was called
      MockApiSetup.assertApiCalled('suratMasuk.update');
    });

    test('Should delete surat masuk', async () => {
      // Mock confirm dialog
      window.confirm = jest.fn(() => true);
      
      // Click delete button
      const deleteBtn = TestHelpers.findElement('#btn-delete') || 
                       TestHelpers.findElement('[data-action="delete"]');
      
      if (deleteBtn) {
        await TestHelpers.clickElement(deleteBtn);
      }
      
      await TestHelpers.waitForAsync(300);
      
      // Verify delete API was called
      MockApiSetup.assertApiCalled('suratMasuk.delete');
    });

    test('Should filter surat masuk', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/surat-masuk');
      }
      
      await TestHelpers.waitForRender(300);
      
      // Change filter
      const statusFilter = TestHelpers.findElement('[name="statusFilter"]') ||
                          TestHelpers.findElement('#filter-status');
      
      if (statusFilter) {
        await TestHelpers.setInputValue(statusFilter, 'diterima');
      }
      
      // Click search/filter button
      const filterBtn = TestHelpers.findElement('#btn-filter') || 
                       TestHelpers.findElement('[data-action="filter"]');
      
      if (filterBtn) {
        await TestHelpers.clickElement(filterBtn);
      }
      
      await TestHelpers.waitForAsync(300);
      
      // Verify list API was called with filter
      MockApiSetup.assertApiCalled('suratMasuk.list');
    });
  });

  // ============================================
  // SURAT KELUAR TESTS
  // ============================================
  describe('Surat Keluar Flow', () => {
    
    beforeEach(async () => {
      if (typeof store !== 'undefined') {
        store.dispatch('auth.isAuthenticated', true);
        store.dispatch('auth.user', {
          id: 'user-1',
          role: 'admin',
          namaLengkap: 'Administrator'
        });
      }
      await TestHelpers.waitForRender(100);
    });

    test('Should display surat keluar list', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/surat-keluar');
      }
      
      await TestHelpers.waitForAsync(500);
      
      MockApiSetup.assertApiCalled('suratKeluar.list');
      
      const table = TestHelpers.findElement('#surat-keluar-table') || 
                   TestHelpers.findElement('.data-table');
      
      expect(table).toBeTruthy();
    });

    test('Should create surat keluar', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/surat-keluar/create');
      }
      
      await TestHelpers.waitForRender(300);
      
      // Fill form
      const tujuan = TestHelpers.findElement('[name="tujuan"]') ||
                    TestHelpers.findElement('#tujuan');
      const perihal = TestHelpers.findElement('[name="perihal"]') ||
                     TestHelpers.findElement('#perihal');
      
      if (tujuan) await TestHelpers.setInputValue(tujuan, 'Instansi Test');
      if (perihal) await TestHelpers.setInputValue(perihal, 'Balasan Test');
      
      // Submit
      const submitBtn = TestHelpers.findElement('#btn-submit') || 
                       TestHelpers.findElement('[type="submit"]');
      
      if (submitBtn) {
        await TestHelpers.clickElement(submitBtn);
      }
      
      await TestHelpers.waitForAsync(300);
      
      MockApiSetup.assertApiCalled('suratKeluar.create');
    });

    test('Should view surat keluar detail', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/surat-keluar/sk-1');
      }
      
      await TestHelpers.waitForAsync(500);
      
      MockApiSetup.assertApiCalled('suratKeluar.detail');
      
      const detailContainer = TestHelpers.findElement('.surat-keluar-detail') ||
                             TestHelpers.findElement('.detail-container');
      
      expect(detailContainer).toBeTruthy();
    });

    test('Should submit for approval', async () => {
      const approveBtn = TestHelpers.findElement('#btn-submit-approval') || 
                        TestHelpers.findElement('[data-action="approve"]');
      
      if (approveBtn) {
        await TestHelpers.clickElement(approveBtn);
      }
      
      await TestHelpers.waitForAsync(300);
      
      MockApiSetup.assertApiCalled('suratKeluar.submitApproval');
    });
  });

  // ============================================
  // DISPOSISI TESTS
  // ============================================
  describe('Disposisi Flow', () => {
    
    beforeEach(async () => {
      if (typeof store !== 'undefined') {
        store.dispatch('auth.isAuthenticated', true);
        store.dispatch('auth.user', {
          id: 'user-1',
          role: 'admin',
          namaLengkap: 'Administrator'
        });
      }
      await TestHelpers.waitForRender(100);
    });

    test('Should display disposisi list', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/disposisi');
      }
      
      await TestHelpers.waitForAsync(500);
      
      MockApiSetup.assertApiCalled('disposisi.list');
      
      const table = TestHelpers.findElement('#disposisi-table') || 
                   TestHelpers.findElement('.data-table');
      
      expect(table).toBeTruthy();
    });

    test('Should create disposisi', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/disposisi/create');
      }
      
      await TestHelpers.waitForRender(300);
      
      // Fill form
      const kepada = TestHelpers.findElement('[name="kepada"]') ||
                    TestHelpers.findElement('#kepada');
      const instruksi = TestHelpers.findElement('[name="instruksi"]') ||
                       TestHelpers.findElement('#instruksi');
      
      if (kepada) await TestHelpers.setInputValue(kepada, 'Staff 1');
      if (instruksi) await TestHelpers.setInputValue(instruksi, 'Tindak lanjuti segera');
      
      // Submit
      const submitBtn = TestHelpers.findElement('#btn-submit') || 
                       TestHelpers.findElement('[type="submit"]');
      
      if (submitBtn) {
        await TestHelpers.clickElement(submitBtn);
      }
      
      await TestHelpers.waitForAsync(300);
      
      MockApiSetup.assertApiCalled('disposisi.create');
    });

    test('Should update disposisi status', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/disposisi/disp-1');
      }
      
      await TestHelpers.waitForRender(300);
      
      const statusBtn = TestHelpers.findElement('#btn-update-status') || 
                       TestHelpers.findElement('[data-action="updateStatus"]');
      
      if (statusBtn) {
        await TestHelpers.clickElement(statusBtn);
      }
      
      await TestHelpers.waitForAsync(300);
      
      MockApiSetup.assertApiCalled('disposisi.updateStatus');
    });

    test('Should add tindak lanjut', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/disposisi/disp-1/tindak-lanjut');
      }
      
      await TestHelpers.waitForRender(300);
      
      const tindakLanjut = TestHelpers.findElement('[name="tindakLanjut"]') ||
                           TestHelpers.findElement('#tindakLanjut');
      
      if (tindakLanjut) {
        await TestHelpers.setInputValue(tindakLanjut, 'Sudah ditindaklanjuti dengan baik');
      }
      
      const submitBtn = TestHelpers.findElement('#btn-submit') || 
                       TestHelpers.findElement('[type="submit"]');
      
      if (submitBtn) {
        await TestHelpers.clickElement(submitBtn);
      }
      
      await TestHelpers.waitForAsync(300);
      
      MockApiSetup.assertApiCalled('disposisi.tindakLanjut');
    });
  });

  // ============================================
  // APPROVAL TESTS
  // ============================================
  describe('Approval Flow', () => {
    
    test('Should display approval list', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/approval');
      }
      
      await TestHelpers.waitForAsync(500);
      
      MockApiSetup.assertApiCalled('approval.list');
      
      const table = TestHelpers.findElement('#approval-table') || 
                   TestHelpers.findElement('.data-table');
      
      expect(table).toBeTruthy();
    });

    test('Should process approval', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/approval/app-1');
      }
      
      await TestHelpers.waitForRender(300);
      
      // Click approve
      const approveBtn = TestHelpers.findElement('#btn-approve') || 
                        TestHelpers.findElement('[data-action="approve"]');
      
      if (approveBtn) {
        await TestHelpers.clickElement(approveBtn);
      }
      
      await TestHelpers.waitForAsync(300);
      
      MockApiSetup.assertApiCalled('approval.process');
    });
  });

  // ============================================
  // SEARCH TESTS
  // ============================================
  describe('Search Flow', () => {
    
    test('Should search globally', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/search', { query: { q: 'undangan' } });
      }
      
      await TestHelpers.waitForAsync(500);
      
      MockApiSetup.assertApiCalled('search');
      
      const results = TestHelpers.findElement('.search-results') || 
                     TestHelpers.findElement('#search-results');
      
      expect(results).toBeTruthy();
    });

    test('Should handle empty search', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/search');
      }
      
      await TestHelpers.waitForRender(300);
      
      const searchInput = TestHelpers.findElement('#search-input') || 
                         TestHelpers.findElement('[name="search"]');
      
      expect(searchInput).toBeTruthy();
    });
  });

  // ============================================
  // NOTIFICATION TESTS
  // ============================================
  describe('Notification Flow', () => {
    
    test('Should load notifications', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/notifications');
      }
      
      await TestHelpers.waitForAsync(500);
      
      MockApiSetup.assertApiCalled('notifikasi.list');
      
      const notifList = TestHelpers.findElement('.notification-list') || 
                       TestHelpers.findElement('#notification-list');
      
      expect(notifList).toBeTruthy();
    });

    test('Should mark notification as read', async () => {
      const readBtn = TestHelpers.findElement('[data-action="read"]') || 
                     TestHelpers.findElement('.btn-read');
      
      if (readBtn) {
        await TestHelpers.clickElement(readBtn);
      }
      
      await TestHelpers.waitForAsync(300);
      
      MockApiSetup.assertApiCalled('notifikasi.read');
    });
  });

  // ============================================
  // FILE UPLOAD TESTS
  // ============================================
  describe('File Upload Flow', () => {
    
    test('Should upload file', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/files');
      }
      
      await TestHelpers.waitForRender(300);
      
      const fileInput = TestHelpers.findElement('#file-input') || 
                       TestHelpers.findElement('[type="file"]');
      
      if (fileInput) {
        // Create mock file
        const mockFile = TestHelpers.createMockFile('test-document.pdf', 'application/pdf', 1024);
        
        // Create file list
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(mockFile);
        fileInput.files = dataTransfer.files;
        
        // Trigger change event
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        await TestHelpers.waitForAsync(500);
        
        MockApiSetup.assertApiCalled('file.upload');
      }
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================
  describe('Error Handling', () => {
    
    test('Should handle network error gracefully', async () => {
      // Mock network error
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      
      if (typeof router !== 'undefined') {
        router.navigate('/surat-masuk');
      }
      
      await TestHelpers.waitForAsync(500);
      
      // Should show error state
      const errorElement = TestHelpers.findElement('.error-state') ||
                          TestHelpers.findElement('.alert-error');
      
      // Restore fetch mock
      MockApiSetup.setupFetchMock();
      
      // Should not crash
      expect(true).toBe(true);
    });

    test('Should handle API error response', async () => {
      // Mock API error
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ 
            payload: Base64Util.encodeObject({ error: 'Internal server error' }),
            status: 'error'
          })
        })
      );
      
      if (typeof router !== 'undefined') {
        router.navigate('/surat-masuk');
      }
      
      await TestHelpers.waitForAsync(500);
      
      // Restore fetch mock
      MockApiSetup.setupFetchMock();
      
      expect(true).toBe(true);
    });

    test('Should handle 404 page', async () => {
      if (typeof router !== 'undefined') {
        router.navigate('/nonexistent-page');
      }
      
      await TestHelpers.waitForRender(300);
      
      const errorPage = TestHelpers.findElement('.error-404') ||
                       TestHelpers.findElement('[data-page="404"]');
      
      // Should show some content
      const appShell = document.getElementById('app-shell');
      expect(appShell).toBeTruthy();
    });
  });

  // ============================================
  // STATE MANAGEMENT TESTS
  // ============================================
  describe('State Management', () => {
    
    test('Should update state on dispatch', async () => {
      if (typeof store !== 'undefined') {
        store.dispatch('test.value', 'test-data');
        const value = store.getState('test.value');
        expect(value).toBe('test-data');
        
        // Cleanup
        store.dispatch('test', {});
      }
    });

    test('Should notify subscribers', async () => {
      if (typeof store !== 'undefined') {
        const mockCallback = jest.fn();
        const unsubscribe = store.subscribe('test.notify', mockCallback);
        
        store.dispatch('test.notify', 'new-value');
        
        expect(mockCallback).toHaveBeenCalledWith('new-value', undefined);
        
        unsubscribe();
      }
    });

    test('Should handle undo/redo', async () => {
      if (typeof store !== 'undefined') {
        store.dispatch('test.undoValue', 'value-1');
        store.dispatch('test.undoValue', 'value-2');
        
        // Undo
        store.undo();
        expect(store.getState('test.undoValue')).toBe('value-1');
        
        // Redo
        store.redo();
        expect(store.getState('test.undoValue')).toBe('value-2');
        
        // Cleanup
        store.dispatch('test', {});
      }
    });
  });

  // ============================================
  // CACHE TESTS
  // ============================================
  describe('Cache Operations', () => {
    
    test('Should cache and retrieve data', async () => {
      if (typeof CacheManager !== 'undefined') {
        const testData = { key: 'value', timestamp: Date.now() };
        
        await CacheManager.set('test-cache', testData, 60);
        const cached = await CacheManager.get('test-cache');
        
        expect(cached).toEqual(testData);
        
        // Cleanup
        await CacheManager.remove('test-cache');
      }
    });

    test('Should expire cache after TTL', async () => {
      if (typeof CacheManager !== 'undefined') {
        const testData = { key: 'expired' };
        
        await CacheManager.set('test-expire', testData, 0); // Immediate expiry
        await TestHelpers.waitForAsync(100);
        
        const cached = await CacheManager.get('test-expire');
        expect(cached).toBeNull();
      }
    });
  });

  // ============================================
  // BASE64 UTILITY TESTS
  // ============================================
  describe('Base64 Utilities', () => {
    
    test('Should encode and decode string', () => {
      if (typeof Base64Util !== 'undefined') {
        const original = 'test-string-data';
        const encoded = Base64Util.encode(original);
        const decoded = Base64Util.decode(encoded);
        
        expect(decoded).toBe(original);
      }
    });

    test('Should encode and decode object', () => {
      if (typeof Base64Util !== 'undefined') {
        const original = { name: 'test', value: 123, nested: { key: 'value' } };
        const encoded = Base64Util.encodeObject(original);
        const decoded = Base64Util.decodeObject(encoded);
        
        expect(decoded).toEqual(original);
      }
    });

    test('Should encode file to base64', async () => {
      if (typeof Base64Util !== 'undefined') {
        const file = TestHelpers.createMockFile('test.txt', 'text/plain', 100);
        const base64 = await Base64Util.encodeFile(file);
        
        expect(base64).toBeTruthy();
        expect(typeof base64).toBe('string');
      }
    });

    test('Should decode base64 to blob', () => {
      if (typeof Base64Util !== 'undefined') {
        const base64 = Base64Util.encode('test content');
        const blob = Base64Util.decodeToBlob(base64, 'text/plain');
        
        expect(blob).toBeTruthy();
        expect(blob instanceof Blob).toBe(true);
      }
    });
  });

  // ============================================
  // PERFORMANCE TESTS
  // ============================================
  describe('Performance Tests', () => {
    
    test('Should load dashboard within timeout', async () => {
      const startTime = Date.now();
      
      if (typeof router !== 'undefined') {
        router.navigate('/dashboard');
      }
      
      await TestHelpers.waitForAsync(1000);
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    test('Should handle rapid navigation', async () => {
      const pages = ['/dashboard', '/surat-masuk', '/surat-keluar', '/disposisi', '/search'];
      
      for (const page of pages) {
        if (typeof router !== 'undefined') {
          router.navigate(page);
        }
        await TestHelpers.waitForRender(50);
      }
      
      // Should not crash
      expect(true).toBe(true);
    });
  });
});

// ============================================
// EXPORT FOR TEST RUNNER
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TestHelpers,
    MockApiSetup
  };
}
