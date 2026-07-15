/**
 * ============================================
 * MAIN APPLICATION - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL APPLICATION ENTRY POINT - SIAP PRODUKSI
 * Mengelola: Init, Modules, Routing, Auth,
 * Theme, PWA, Errors, Performance, Shortcuts
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class App {
  constructor() {
    this.version = this.getConfig('APP_VERSION', '3.2.2');
    this.appName = this.getConfig('APP_NAME', 'Arsip Surat Digital Enterprise');
    this.initialized = false;
    this.modules = {};
    this.initStartTime = null;
    this.deferredPrompt = null;
    this.idleTimer = null;
    this.autoSaveTimer = null;
  }

  /**
   * Get config safely
   */
  getConfig(path, defaultValue) {
    try {
      const keys = path.split('.');
      let value = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG : {};
      for (const key of keys) {
        if (value && typeof value === 'object') value = value[key];
        else return defaultValue;
      }
      return value !== undefined ? value : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature) {
    return this.getConfig(`FEATURES.${feature}`, false);
  }

  /**
   * Initialize entire application
   */
  async init() {
    this.initStartTime = performance.now();
    console.log(`🚀 Starting ${this.appName} v${this.version}...`);
    console.log(`📍 URL: ${window.location.href}`);
    console.log(`🖥️ Platform: ${navigator.platform}`);

    try {
      // Show loading screen immediately
      this.showLoadingScreen();

      // 1. Initialize core state first
      await this.initState();

      // 2. Initialize error handling (must be early)
      this.setupErrorHandling();

      // 3. Initialize essential services
      await this.initEssentialServices();

      // 4. Check online status
      this.checkOnlineStatus();

      // 5. Initialize authentication
      await this.initAuth();

      // 6. Initialize theme
      this.initTheme();

      // 7. Initialize i18n
      await this.initI18n();

      // 8. Initialize feature modules
      await this.initFeatureModules();

      // 9. Setup UI enhancements
      this.setupKeyboardShortcuts();
      this.setupContextMenu();
      this.setupIdleDetection();
      this.setupAutoSave();

      // 10. Initialize PWA
      if (this.getConfig('PWA.ENABLED', true)) {
        await this.initPWA();
      }

      // 11. Initialize accessibility
      this.initAccessibility();

      // 12. Initialize voice commands
      if (this.isFeatureEnabled('VOICE_COMMANDS')) {
        this.initVoiceCommands();
      }

      // 13. Load cached data
      await this.loadCachedData();

      // 14. Start router
      this.startRouter();

      // 15. Register service worker
      await this.registerServiceWorker();

      // 16. Performance monitoring
      this.setupPerformanceMonitoring();

      // Hide loading screen
      this.hideLoadingScreen();

      // Mark as initialized
      this.initialized = true;
      this.updateState('app.initialized', true);
      this.updateState('app.loading', false);

      const initDuration = Math.round(performance.now() - this.initStartTime);
      console.log(`✅ Application initialized in ${initDuration}ms`);
      console.log(`📦 Modules loaded: ${Object.keys(this.modules).length}`);

      // Show welcome message
      this.showWelcomeMessage();

      // Track initialization
      this.trackEvent('app', 'init', { duration: initDuration });

    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.showErrorScreen(error);
    }
  }

  /**
   * Initialize state management
   */
  async initState() {
    if (typeof store !== 'undefined' && store.init) {
      await store.init({
        app: {
          loading: true,
          initialized: false,
          online: navigator.onLine,
          theme: localStorage.getItem('app-theme') || 'light',
          sidebarCollapsed: localStorage.getItem('sidebar-collapsed') === '1',
          language: localStorage.getItem('asd_language') || 'id',
          maintenance: false,
          installPrompt: false,
          version: this.version
        },
        auth: {
          isAuthenticated: false,
          user: null,
          token: null,
          csrf: null,
          permissions: {},
          loginAttempts: 0,
          lastActivity: Date.now()
        }
      });
      this.modules.store = store;
    }
  }

  /**
   * Initialize essential services
   */
  async initEssentialServices() {
    const essentialModules = [
      { name: 'logger', instance: typeof LoggerService !== 'undefined' ? LoggerService : null },
      { name: 'errorHandler', instance: typeof ErrorHandler !== 'undefined' ? ErrorHandler : null },
      { name: 'cache', instance: typeof CacheService !== 'undefined' ? CacheService : null },
      { name: 'api', instance: typeof api !== 'undefined' ? api : null },
      { name: 'auth', instance: typeof AuthService !== 'undefined' ? AuthService : null },
      { name: 'router', instance: typeof router !== 'undefined' ? router : null },
      { name: 'notifications', instance: typeof NotificationService !== 'undefined' ? NotificationService : null },
    ];

    for (const mod of essentialModules) {
      if (mod.instance && typeof mod.instance.init === 'function') {
        try {
          await mod.instance.init();
          this.modules[mod.name] = mod.instance;
          console.log(`  ✅ ${mod.name}`);
        } catch (error) {
          console.warn(`  ⚠️ ${mod.name} failed:`, error.message);
        }
      } else if (mod.instance) {
        this.modules[mod.name] = mod.instance;
      }
    }
  }

  /**
   * Initialize authentication
   */
  async initAuth() {
    const auth = this.modules.auth;
    if (!auth) return;

    try {
      const token = auth.getToken?.() || localStorage.getItem('asd_token');
      const user = auth.getUser?.() || JSON.parse(localStorage.getItem('asd_user') || 'null');

      if (token && user) {
        // Validate token with server
        if (this.modules.api) {
          try {
            const response = await this.modules.api.getMe();
            if (response?.status === 'success') {
              this.updateState('auth', {
                isAuthenticated: true,
                user: response.data?.user || user,
                permissions: response.data?.permissions || {},
                token: token
              });
              // Refresh CSRF
              await this.modules.api.getCsrfToken();
              return;
            }
          } catch (e) {
            console.warn('Token validation failed, clearing auth');
          }
        }
        
        // If no server validation, use local data
        this.updateState('auth', {
          isAuthenticated: true,
          user: user,
          token: token,
          lastActivity: Date.now()
        });
      }
    } catch (error) {
      console.warn('Auth initialization failed:', error);
      auth.clearAuth?.();
    }
  }

  /**
   * Initialize theme
   */
  initTheme() {
    const theme = this.getState('app.theme') || localStorage.getItem('app-theme') || 'light';
    this.applyTheme(theme);

    // Listen for system preference changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const currentTheme = this.getState('app.theme');
        if (currentTheme === 'auto') {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  /**
   * Apply theme to document
   */
  applyTheme(theme) {
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDark ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;

    // Update meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = theme === 'dark' ? '#1A1C1E' : '#1976D2';
    }

    // Update theme toggle icons
    document.querySelectorAll('[data-theme-icon]').forEach(el => {
      el.textContent = theme === 'dark' ? 'dark_mode' : 'light_mode';
    });
  }

  /**
   * Toggle theme
   */
  toggleTheme() {
    const current = this.getState('app.theme') || 'light';
    const themes = ['light', 'dark', 'auto'];
    const next = themes[(themes.indexOf(current) + 1) % themes.length];
    this.updateState('app.theme', next);
    localStorage.setItem('app-theme', next);
    this.applyTheme(next);
    
    const labels = { light: '☀️ Mode Terang', dark: '🌙 Mode Gelap', auto: '🔄 Auto' };
    this.showToast(labels[next], 'info');
  }

  /**
   * Initialize i18n
   */
  async initI18n() {
    if (typeof i18n !== 'undefined' && i18n.init) {
      await i18n.init();
      this.modules.i18n = i18n;
    }
  }

  /**
   * Initialize feature modules
   */
  async initFeatureModules() {
    const featureModules = [
      { name: 'offline', condition: true, instance: typeof OfflineService !== 'undefined' ? OfflineService : null },
      { name: 'sync', condition: true, instance: typeof SyncService !== 'undefined' ? SyncService : null },
      { name: 'search', condition: true, instance: typeof SearchService !== 'undefined' ? SearchService : null },
      { name: 'files', condition: true, instance: typeof FileService !== 'undefined' ? FileService : null },
      { name: 'validation', condition: true, instance: typeof ValidationService !== 'undefined' ? ValidationService : null },
      { name: 'encryption', condition: true, instance: typeof EncryptionService !== 'undefined' ? EncryptionService : null },
      { name: 'export', condition: true, instance: typeof ExportService !== 'undefined' ? ExportService : null },
      { name: 'backup', condition: true, instance: typeof BackupService !== 'undefined' ? BackupService : null },
      { name: 'performance', condition: true, instance: typeof PerformanceMonitor !== 'undefined' ? PerformanceMonitor : null },
      { name: 'analytics', condition: this.getConfig('ANALYTICS.ENABLED', false), instance: typeof AnalyticsService !== 'undefined' ? AnalyticsService : null },
      { name: 'websocket', condition: this.isFeatureEnabled('WEBSOCKET'), instance: typeof WebSocketService !== 'undefined' ? WebSocketService : null },
      { name: 'biometric', condition: this.isFeatureEnabled('BIOMETRIC'), instance: typeof BiometricService !== 'undefined' ? BiometricService : null },
      { name: 'ai', condition: this.isFeatureEnabled('AI_FEATURES'), instance: typeof AIService !== 'undefined' ? AIService : null },
      { name: 'ocr', condition: this.isFeatureEnabled('OCR'), instance: typeof OCRService !== 'undefined' ? OCRService : null },
      { name: 'blockchain', condition: this.isFeatureEnabled('BLOCKCHAIN'), instance: typeof BlockchainService !== 'undefined' ? BlockchainService : null },
      { name: 'signature', condition: this.isFeatureEnabled('DIGITAL_SIGNATURE'), instance: typeof SignatureService !== 'undefined' ? SignatureService : null },
      { name: 'push', condition: this.isFeatureEnabled('PUSH_NOTIFICATIONS'), instance: typeof PushService !== 'undefined' ? PushService : null },
      { name: 'qr', condition: true, instance: typeof QRService !== 'undefined' ? QRService : null },
    ];

    for (const mod of featureModules) {
      if (mod.condition && mod.instance && typeof mod.instance.init === 'function') {
        try {
          await mod.instance.init();
          this.modules[mod.name] = mod.instance;
          console.log(`  ✅ ${mod.name}`);
        } catch (error) {
          console.warn(`  ⚠️ ${mod.name} failed:`, error.message);
        }
      } else if (mod.instance) {
        this.modules[mod.name] = mod.instance;
      }
    }
  }

  /**
   * Initialize PWA
   */
  async initPWA() {
    // Register install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.updateState('app.installPrompt', true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.updateState('app.installPrompt', false);
      this.trackEvent('pwa', 'installed');
    });
  }

  /**
   * Install PWA
   */
  async installPWA() {
    if (!this.deferredPrompt) {
      this.showToast('Aplikasi sudah terinstall atau fitur tidak didukung', 'info');
      return;
    }
    this.deferredPrompt.prompt();
    const result = await this.deferredPrompt.userChoice;
    this.trackEvent('pwa', 'install', result.outcome);
    this.deferredPrompt = null;
    this.updateState('app.installPrompt', false);
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
      console.log('✅ Service Worker registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showUpdateBanner();
          }
        });
      });

      // Handle messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'UPDATE_AVAILABLE') {
          this.showUpdateBanner();
        }
      });

    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  }

  /**
   * Initialize accessibility
   */
  initAccessibility() {
    if (typeof AccessibilityService !== 'undefined' && AccessibilityService.init) {
      AccessibilityService.init();
      this.modules.accessibility = AccessibilityService;
    }
  }

  /**
   * Initialize voice commands
   */
  initVoiceCommands() {
    if (typeof VoiceService !== 'undefined' && VoiceService.init) {
      VoiceService.init();
      this.modules.voice = VoiceService;
    }
  }

  /**
   * Load cached data
   */
  async loadCachedData() {
    const cache = this.modules.cache;
    if (!cache) return;

    try {
      const keys = [
        { cacheKey: 'dashboard_stats', statePath: 'data.dashboard.stats' },
        { cacheKey: 'sm_list', statePath: 'data.suratMasuk.items', extract: 'items' },
        { cacheKey: 'sk_list', statePath: 'data.suratKeluar.items', extract: 'items' },
        { cacheKey: 'disp_list', statePath: 'data.disposisi.items', extract: 'items' },
      ];

      for (const { cacheKey, statePath, extract } of keys) {
        const cached = await cache.get(cacheKey);
        if (cached) {
          this.updateState(statePath, extract ? (cached[extract] || cached.data?.[extract] || []) : cached);
        }
      }
    } catch (error) {
      console.warn('Failed to load cached data:', error);
    }
  }

  /**
   * Start router
   */
  startRouter() {
    if (this.modules.router && typeof this.modules.router.start === 'function') {
      this.modules.router.start();
    }
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Global errors
    window.addEventListener('error', (event) => {
      const errorHandler = this.modules.errorHandler;
      if (errorHandler?.handleError) {
        errorHandler.handleError(event.error || event.message, {
          type: 'global',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      }
      console.error('Global error:', event.error || event.message);
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const errorHandler = this.modules.errorHandler;
      if (errorHandler?.handleError) {
        errorHandler.handleError(event.reason, { type: 'unhandled_promise' });
      }
      console.error('Unhandled rejection:', event.reason);
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Skip when typing in inputs
      if (event.target.matches('input, textarea, [contenteditable], select')) return;

      const key = [
        event.ctrlKey || event.metaKey ? 'Ctrl' : '',
        event.altKey ? 'Alt' : '',
        event.shiftKey ? 'Shift' : '',
        event.key.toUpperCase()
      ].filter(Boolean).join('+');

      const shortcuts = {
        'Ctrl+B': () => {
          const collapsed = this.getState('app.sidebarCollapsed');
          this.updateState('app.sidebarCollapsed', !collapsed);
        },
        'Ctrl+Shift+T': () => this.toggleTheme(),
        'Ctrl+/': () => this.toggleHelp(),
        'Ctrl+F': () => {
          const searchInput = document.querySelector('#global-search-input, .search-input input');
          if (searchInput) searchInput.focus();
        },
        'Ctrl+K': () => {
          if (this.modules.router) {
            this.modules.router.navigate('/search');
          }
        },
        'Escape': () => this.closeAllModals(),
        'Alt+D': () => this.navigate('/'),
        'Alt+M': () => this.navigate('/surat-masuk'),
        'Alt+K': () => this.navigate('/surat-keluar'),
        'Alt+P': () => this.navigate('/disposisi'),
        'Alt+S': () => this.navigate('/settings'),
      };

      if (shortcuts[key]) {
        event.preventDefault();
        shortcuts[key]();
      }
    });
  }

  /**
   * Setup context menu
   */
  setupContextMenu() {
    document.addEventListener('contextmenu', (event) => {
      const target = event.target.closest('[data-context-menu]');
      if (target) {
        event.preventDefault();
        this.showContextMenu(event.clientX, event.clientY, target.dataset.contextMenu, target);
      }
    });
  }

  /**
   * Setup idle detection
   */
  setupIdleDetection() {
    const idleTimeout = this.getConfig('AUTH.SESSION_TIMEOUT', 3600000);

    const resetIdleTimer = () => {
      if (this.idleTimer) clearTimeout(this.idleTimer);
      this.updateState('auth.lastActivity', Date.now());

      this.idleTimer = setTimeout(() => {
        const auth = this.modules.auth;
        if (auth?.isAuthenticated?.()) {
          auth.logout?.();
          this.navigate('/login', { reason: 'idle' });
          this.showToast('Sesi berakhir karena tidak aktif', 'warning');
        }
      }, idleTimeout);
    };

    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });

    resetIdleTimer();
  }

  /**
   * Setup auto-save for forms
   */
  setupAutoSave() {
    this.autoSaveTimer = setInterval(() => {
      document.querySelectorAll('[data-autosave]').forEach(form => {
        const key = form.dataset.autosave || 'form-draft';
        const data = new FormData(form);
        const formData = {};
        data.forEach((v, k) => { formData[k] = v; });
        try {
          localStorage.setItem(`asd_draft_${key}`, JSON.stringify(formData));
        } catch {}
      });
    }, 15000);
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    const perf = this.modules.performance;
    if (!perf) return;

    // Track page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navEntry = performance.getEntriesByType('navigation')[0];
        if (navEntry) {
          perf.trackPageLoad?.({
            domContentLoaded: Math.round(navEntry.domContentLoadedEventEnd - navEntry.startTime),
            loadComplete: Math.round(navEntry.loadEventEnd - navEntry.startTime),
            firstByte: Math.round(navEntry.responseStart - navEntry.startTime)
          });
        }
      }, 0);
    });
  }

  /**
   * Check online status
   */
  checkOnlineStatus() {
    const updateStatus = () => {
      this.updateState('app.online', navigator.onLine);
      document.getElementById('offline-indicator')?.style.display = navigator.onLine ? 'none' : 'flex';

      if (navigator.onLine) {
        this.modules.sync?.sync?.();
        this.showToast('🌐 Koneksi tersedia', 'success');
      } else {
        this.showToast('📡 Anda sedang offline', 'warning', 5000);
      }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
  }

  /**
   * Show loading screen
   */
  showLoadingScreen() {
    const existing = document.getElementById('app-loading');
    if (existing) return;

    const loading = document.createElement('div');
    loading.id = 'app-loading';
    loading.innerHTML = `
      <div class="loading-content">
        <div class="loading-logo">AS</div>
        <h1>${this.appName}</h1>
        <div class="loading-spinner"></div>
        <p>Memuat aplikasi...</p>
        <small>v${this.version}</small>
      </div>
    `;
    document.body.appendChild(loading);
  }

  /**
   * Hide loading screen
   */
  hideLoadingScreen() {
    const loading = document.getElementById('app-loading');
    if (loading) {
      loading.classList.add('fade-out');
      setTimeout(() => loading.remove(), 500);
    }
  }

  /**
   * Show error screen
   */
  showErrorScreen(error) {
    const loading = document.getElementById('app-loading');
    const message = error?.message || 'Terjadi kesalahan yang tidak diketahui';

    if (loading) {
      loading.innerHTML = `
        <div class="error-content">
          <span class="material-icons" style="font-size:64px;color:#F44336">error_outline</span>
          <h2>Gagal Memuat Aplikasi</h2>
          <p>${message}</p>
          <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top:16px">
            <span class="material-icons">refresh</span> Muat Ulang
          </button>
        </div>
      `;
      loading.classList.add('error-screen');
    }
  }

  /**
   * Show update banner
   */
  showUpdateBanner() {
    const banner = document.getElementById('update-banner');
    if (banner) {
      banner.classList.remove('hidden');
      banner.querySelector('#btn-update')?.addEventListener('click', () => window.location.reload());
    }
  }

  /**
   * Show welcome message
   */
  showWelcomeMessage() {
    const user = this.getState('auth.user');
    if (user) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';
      console.log(`${greeting}, ${user.namaLengkap || user.username}! 👋`);
    }
  }

  /**
   * Toggle help dialog
   */
  toggleHelp() {
    const existing = document.getElementById('help-dialog');
    if (existing) {
      existing.remove();
      return;
    }

    const dialog = document.createElement('div');
    dialog.id = 'help-dialog';
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="modal-content modal-content--sm">
        <div class="modal-header">
          <h3>⌨️ Keyboard Shortcuts</h3>
          <button class="btn-icon" onclick="document.getElementById('help-dialog').remove()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <table style="width:100%;font-size:13px">
            <tr><td><kbd>Ctrl+B</kbd></td><td>Toggle Sidebar</td></tr>
            <tr><td><kbd>Ctrl+Shift+T</kbd></td><td>Toggle Theme</td></tr>
            <tr><td><kbd>Ctrl+F</kbd></td><td>Search</td></tr>
            <tr><td><kbd>Ctrl+K</kbd></td><td>Go to Search Page</td></tr>
            <tr><td><kbd>Ctrl+/</kbd></td><td>Show Help</td></tr>
            <tr><td><kbd>Escape</kbd></td><td>Close Modals</td></tr>
            <tr><td><kbd>Alt+D</kbd></td><td>Dashboard</td></tr>
            <tr><td><kbd>Alt+M</kbd></td><td>Surat Masuk</td></tr>
            <tr><td><kbd>Alt+K</kbd></td><td>Surat Keluar</td></tr>
            <tr><td><kbd>Alt+P</kbd></td><td>Disposisi</td></tr>
            <tr><td><kbd>Alt+S</kbd></td><td>Settings</td></tr>
          </table>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.remove(); });
  }

  /**
   * Close all modals
   */
  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => {
      if (m.id !== 'help-dialog') m.remove();
    });
  }

  /**
   * Show context menu
   */
  showContextMenu(x, y, type, target) {
    const existing = document.querySelector('.context-menu');
    if (existing) existing.remove();

    const items = this.getContextMenuItems(type);
    if (!items.length) return;

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;z-index:9999;background:var(--md-sys-color-surface-container);border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.2);min-width:180px;padding:4px`;
    menu.innerHTML = items.map(item => `
      <button class="context-menu-item" data-action="${item.action}" data-id="${target?.dataset?.id || ''}"
              style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;border:none;background:transparent;cursor:pointer;font-size:13px;border-radius:8px;color:var(--md-sys-color-on-surface)"
              onmouseover="this.style.background='var(--md-sys-color-surface-container-highest)'" 
              onmouseout="this.style.background='transparent'">
        <span class="material-icons" style="font-size:18px">${item.icon}</span> ${item.label}
      </button>
    `).join('');

    menu.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (btn) this.handleContextAction(btn.dataset.action, btn.dataset.id);
      menu.remove();
    });

    document.body.appendChild(menu);
    document.addEventListener('click', () => menu.remove(), { once: true });
  }

  /**
   * Get context menu items
   */
  getContextMenuItems(type) {
    const menus = {
      'surat-item': [
        { action: 'view', icon: 'visibility', label: 'Lihat Detail' },
        { action: 'edit', icon: 'edit', label: 'Edit' },
        { action: 'disposisi', icon: 'forward', label: 'Disposisi' },
        { action: 'download', icon: 'download', label: 'Download' },
        { action: 'delete', icon: 'delete', label: 'Hapus' },
      ]
    };
    return menus[type] || [];
  }

  /**
   * Handle context menu action
   */
  handleContextAction(action, id) {
    switch (action) {
      case 'view': this.navigate(`/surat-masuk/${id}`); break;
      case 'edit': this.navigate(`/surat-masuk/${id}/edit`); break;
      case 'delete': this.confirmAndDelete(id); break;
      case 'disposisi': this.navigate(`/disposisi/create?suratMasukId=${id}`); break;
      case 'download': this.modules.files?.download?.(id); break;
    }
  }

  /**
   * Navigate helper
   */
  navigate(path, query) {
    if (this.modules.router?.navigate) {
      this.modules.router.navigate(path, query ? { query } : {});
    } else {
      const queryStr = query ? '?' + new URLSearchParams(query).toString() : '';
      window.location.hash = '#' + path + queryStr;
    }
  }

  /**
   * State helpers
   */
  getState(path) {
    if (this.modules.store?.getState) {
      return this.modules.store.getState(path);
    }
    return undefined;
  }

  updateState(path, value) {
    if (this.modules.store?.dispatch) {
      this.modules.store.dispatch(path, value);
    }
  }

  /**
   * Confirm and delete
   */
  async confirmAndDelete(id) {
    const notifications = this.modules.notifications;
    const confirmed = notifications?.confirm
      ? await notifications.confirm('Hapus item ini?')
      : window.confirm('Hapus item ini?');

    if (confirmed && this.modules.api) {
      try {
        await this.modules.api.deleteSuratMasuk(id);
        this.showToast('Item berhasil dihapus', 'success');
      } catch (e) {
        this.showToast('Gagal menghapus item', 'error');
      }
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info', duration = 4000) {
    if (typeof Toast !== 'undefined') {
      Toast.show(message, type, duration);
    } else if (this.modules.notifications?.show) {
      this.modules.notifications.show(message, type, { duration });
    }
  }

  /**
   * Track analytics event
   */
  trackEvent(category, action, label) {
    if (this.modules.analytics?.trackEvent) {
      this.modules.analytics.trackEvent(category, action, label);
    }
  }

  /**
   * Get a module by name
   */
  getModule(name) {
    return this.modules[name] || null;
  }

  /**
   * Destroy/cleanup
   */
  destroy() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    Object.values(this.modules).forEach(mod => {
      if (mod?.destroy) mod.destroy();
    });
  }
}

// ============================================
// CREATE & INITIALIZE
// ============================================
const app = new App();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// ============================================
// GLOBAL EXPOSURE
// ============================================
window.app = app;
if (typeof store !== 'undefined') window.store = store;
if (typeof router !== 'undefined') window.router = router;
if (typeof api !== 'undefined') window.api = api;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { App, app };
}
