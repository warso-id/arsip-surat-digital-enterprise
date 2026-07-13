/**
 * MAIN APPLICATION - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Entry point untuk seluruh aplikasi
 */

class App {
  constructor() {
    this.version = APP_CONFIG.APP_VERSION;
    this.initialized = false;
    this.modules = {};
  }
  
  /**
   * Initialize application
   */
  async init() {
    console.log(`🚀 Starting ${APP_CONFIG.APP_NAME} v${this.version}...`);
    
    try {
      // Show loading screen
      this.showLoadingScreen();
      
      // Initialize modules in order
      await this.initModules();
      
      // Setup error handling
      this.setupErrorHandling();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      // Setup keyboard shortcuts
      this.setupKeyboardShortcuts();
      
      // Setup right-click context menu
      this.setupContextMenu();
      
      // Setup idle detection
      this.setupIdleDetection();
      
      // Initialize state
      await store.init();
      
      // Check online status
      this.checkOnlineStatus();
      
      // Initialize auth
      await this.initAuth();
      
      // Initialize i18n
      await i18n.init();
      
      // Initialize theme
      this.initTheme();
      
      // Initialize PWA
      if (APP_CONFIG.PWA.ENABLED) {
        await this.initPWA();
      }
      
      // Initialize voice commands
      if (APP_CONFIG.FEATURES.VOICE_COMMANDS) {
        VoiceService.init();
      }
      
      // Initialize accessibility
      AccessibilityService.init();
      
      // Setup WebSocket
      if (APP_CONFIG.FEATURES.OFFLINE_MODE) {
        WebSocketService.connect();
      }
      
      // Setup offline support
      if (APP_CONFIG.FEATURES.OFFLINE_MODE) {
        OfflineService.init();
      }
      
      // Load cached data
      await this.loadCachedData();
      
      // Start router
      router.start();
      
      // Register service worker
      if ('serviceWorker' in navigator) {
        await this.registerServiceWorker();
      }
      
      // Hide loading screen
      this.hideLoadingScreen();
      
      // Mark as initialized
      this.initialized = true;
      store.dispatch('app.initialized', true);
      store.dispatch('app.loading', false);
      
      console.log('✅ Application initialized successfully');
      
      // Show welcome back message
      this.showWelcomeMessage();
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.showErrorScreen(error);
    }
  }
  
  /**
   * Initialize all modules
   */
  async initModules() {
    // Core modules
    this.modules.config = APP_CONFIG;
    this.modules.store = store;
    this.modules.router = router;
    this.modules.api = api;
    this.modules.auth = AuthService;
    this.modules.i18n = i18n;
    
    // Feature modules
    if (APP_CONFIG.FEATURES.OFFLINE_MODE) {
      this.modules.cache = CacheService;
      this.modules.sync = SyncService;
      this.modules.offline = OfflineService;
    }
    
    if (APP_CONFIG.FEATURES.BIOMETRIC) {
      this.modules.biometric = BiometricService;
    }
    
    if (APP_CONFIG.FEATURES.AI_FEATURES) {
      this.modules.ai = AIService;
    }
    
    if (APP_CONFIG.FEATURES.OCR) {
      this.modules.ocr = OCRService;
    }
    
    if (APP_CONFIG.FEATURES.BLOCKCHAIN) {
      this.modules.blockchain = BlockchainService;
    }
    
    if (APP_CONFIG.FEATURES.DIGITAL_SIGNATURE) {
      this.modules.signature = SignatureService;
    }
    
    if (APP_CONFIG.FEATURES.PUSH_NOTIFICATIONS) {
      this.modules.push = PushService;
    }
    
    // Service modules
    this.modules.notifications = NotificationService;
    this.modules.files = FileService;
    this.modules.search = SearchService;
    this.modules.export = ExportService;
    this.modules.backup = BackupService;
    this.modules.validation = ValidationService;
    this.modules.encryption = EncryptionService;
    
    // Utility modules
    this.modules.analytics = AnalyticsService;
    this.modules.performance = PerformanceMonitor;
    this.modules.logger = LoggerService;
    this.modules.errorHandler = ErrorHandler;
    
    // Initialize all modules
    for (const [name, module] of Object.entries(this.modules)) {
      if (module && typeof module.init === 'function') {
        try {
          await module.init();
          console.log(`  ✅ Module: ${name}`);
        } catch (error) {
          console.warn(`  ⚠️ Module ${name} failed to init:`, error);
        }
      }
    }
  }
  
  /**
   * Initialize authentication
   */
  async initAuth() {
    const token = AuthService.getToken();
    const user = AuthService.getUser();
    
    if (token && user) {
      try {
        // Validate token
        const response = await api.getMe();
        if (response.status === 'success') {
          store.dispatch('auth', {
            isAuthenticated: true,
            user: response.data.user,
            permissions: response.data.permissions,
            token: token
          });
          
          // Generate CSRF token
          await api.getCsrfToken();
        } else {
          AuthService.clearAuth();
        }
      } catch (error) {
        console.warn('Token validation failed:', error);
        AuthService.clearAuth();
      }
    }
  }
  
  /**
   * Initialize theme
   */
  initTheme() {
    const theme = store.getState('app.theme');
    this.applyTheme(theme);
    
    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const currentTheme = store.getState('app.theme');
        if (currentTheme === 'auto') {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }
  
  /**
   * Apply theme
   */
  applyTheme(theme) {
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDark ? 'dark' : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('color-scheme', theme);
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = theme === 'dark' ? '#1a1a2e' : '#1976D2';
    }
  }
  
  /**
   * Initialize PWA
   */
  async initPWA() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });
        console.log('✅ Service Worker registered:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.showUpdateNotification();
            }
          });
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
    
    // Register PWA install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show install button
      store.dispatch('app.installPrompt', true);
    });
    
    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      store.dispatch('app.installPrompt', false);
      AnalyticsService.trackEvent('pwa', 'installed');
    });
    
    // Store prompt for later use
    this.deferredPrompt = deferredPrompt;
  }
  
  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/service-worker.js');
      } catch (error) {
        console.warn('Service worker registration skipped:', error);
      }
    }
  }
  
  /**
   * Load cached data
   */
  async loadCachedData() {
    if (!APP_CONFIG.FEATURES.OFFLINE_MODE) return;
    
    try {
      const cachedDashboard = await CacheService.get('dashboard_stats');
      if (cachedDashboard) {
        store.dispatch('data.dashboard.stats', cachedDashboard.data);
      }
      
      const cachedSM = await CacheService.get('sm_list');
      if (cachedSM) {
        store.dispatch('data.suratMasuk.items', cachedSM.data.items || []);
      }
      
      const cachedSK = await CacheService.get('sk_list');
      if (cachedSK) {
        store.dispatch('data.suratKeluar.items', cachedSK.data.items || []);
      }
    } catch (error) {
      console.warn('Failed to load cached data:', error);
    }
  }
  
  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      ErrorHandler.handleError(event.error || event.message, {
        type: 'global',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
    
    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      ErrorHandler.handleError(event.reason, {
        type: 'unhandled_promise'
      });
    });
    
    // Resource error
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        ErrorHandler.handleError(`Resource load error: ${event.target.src || event.target.href}`, {
          type: 'resource',
          element: event.target.tagName
        });
      }
    }, true);
  }
  
  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    if (!APP_CONFIG.PERFORMANCE || !APP_CONFIG.ANALYTICS.ENABLED) return;
    
    // Monitor page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          PerformanceMonitor.trackPageLoad({
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.startTime,
            loadComplete: perfData.loadEventEnd - perfData.startTime,
            firstPaint: performance.getEntriesByType('paint')
              .find(e => e.name === 'first-contentful-paint')?.startTime
          });
        }
      }, 0);
    });
    
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            PerformanceMonitor.trackLongTask(entry.duration);
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    }
  }
  
  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target.matches('input, textarea, [contenteditable]')) return;
      
      const shortcuts = {
        // Navigation
        'Alt+D': () => router.navigate('/dashboard'),
        'Alt+S': () => router.navigate('/search'),
        'Alt+M': () => router.navigate('/surat-masuk'),
        'Alt+K': () => router.navigate('/surat-keluar'),
        'Alt+P': () => router.navigate('/disposisi'),
        'Alt+U': () => router.navigate('/users'),
        
        // Actions
        'Alt+N': () => {
          if (window.confirm('Buat surat baru?')) {
            router.navigate('/surat-masuk/create');
          }
        },
        'Ctrl+/': () => this.toggleHelp(),
        'Ctrl+S': () => this.saveCurrentForm(),
        'Escape': () => this.closeAllModals(),
        
        // UI
        'Ctrl+B': () => store.dispatch('app.sidebarCollapsed', !store.getState('app.sidebarCollapsed')),
        'Ctrl+Shift+T': () => this.toggleTheme(),
        'Ctrl+F': () => document.querySelector('.search-input')?.focus(),
        
        // Undo/Redo
        'Ctrl+Z': () => store.undo(),
        'Ctrl+Y': () => store.redo(),
        
        // Refresh
        'F5': (e) => {
          if (event.ctrlKey) {
            e.preventDefault();
            CacheService.clear();
            window.location.reload();
          }
        }
      };
      
      const key = [
        event.ctrlKey ? 'Ctrl' : '',
        event.altKey ? 'Alt' : '',
        event.shiftKey ? 'Shift' : '',
        event.key.toUpperCase()
      ].filter(Boolean).join('+');
      
      if (shortcuts[key]) {
        event.preventDefault();
        shortcuts[key](event);
      }
    });
  }
  
  /**
   * Setup context menu
   */
  setupContextMenu() {
    document.addEventListener('contextmenu', (event) => {
      // Custom context menu for specific elements
      const target = event.target.closest('[data-context-menu]');
      if (target) {
        event.preventDefault();
        const menuType = target.dataset.contextMenu;
        this.showContextMenu(event.clientX, event.clientY, menuType, target);
      }
    });
  }
  
  /**
   * Setup idle detection
   */
  setupIdleDetection() {
    let idleTimer;
    const idleTimeout = 30 * 60 * 1000; // 30 menit
    
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        // User is idle, auto logout
        if (AuthService.isAuthenticated()) {
          AuthService.logout();
          router.navigate('/login', { 
            query: { reason: 'idle' } 
          });
        }
      }, idleTimeout);
    };
    
    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });
    
    resetIdleTimer();
  }
  
  /**
   * Check online status
   */
  checkOnlineStatus() {
    const updateOnlineStatus = () => {
      store.dispatch('app.online', navigator.onLine);
      
      if (navigator.onLine) {
        // Trigger sync when back online
        SyncService.sync();
        NotificationService.show('Anda kembali online', 'success');
      } else {
        NotificationService.show('Anda sedang offline', 'warning');
      }
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }
  
  /**
   * Show loading screen
   */
  showLoadingScreen() {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'app-loading';
    loadingScreen.innerHTML = `
      <div class="loading-content">
        <img src="/src/assets/icons/logo.svg" alt="Logo" class="loading-logo">
        <h1>${APP_CONFIG.APP_NAME}</h1>
        <div class="loading-spinner"></div>
        <p>Memuat aplikasi...</p>
        <small>v${this.version}</small>
      </div>
    `;
    document.body.appendChild(loadingScreen);
  }
  
  /**
   * Hide loading screen
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('app-loading');
    if (loadingScreen) {
      loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        loadingScreen.remove();
      }, 500);
    }
  }
  
  /**
   * Show error screen
   */
  showErrorScreen(error) {
    const loadingScreen = document.getElementById('app-loading');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div class="error-content">
          <img src="/src/assets/images/error-state.svg" alt="Error" class="error-image">
          <h2>Gagal Memuat Aplikasi</h2>
          <p>${error.message || 'Terjadi kesalahan yang tidak diketahui'}</p>
          <button onclick="window.location.reload()" class="btn-primary">
            Muat Ulang
          </button>
        </div>
      `;
      loadingScreen.classList.add('error-screen');
    }
  }
  
  /**
   * Show update notification
   */
  showUpdateNotification() {
    NotificationService.show(
      'Versi baru tersedia! Klik untuk memperbarui.',
      'info',
      {
        duration: 0,
        action: {
          label: 'Perbarui',
          callback: () => {
            window.location.reload();
          }
        }
      }
    );
  }
  
  /**
   * Show welcome message
   */
  showWelcomeMessage() {
    const user = AuthService.getUser();
    if (user) {
      const hour = new Date().getHours();
      let greeting = 'Selamat';
      
      if (hour < 12) greeting = 'Selamat Pagi';
      else if (hour < 15) greeting = 'Selamat Siang';
      else if (hour < 18) greeting = 'Selamat Sore';
      else greeting = 'Selamat Malam';
      
      console.log(`${greeting}, ${user.namaLengkap}! 👋`);
    }
  }
  
  /**
   * Toggle theme
   */
  toggleTheme() {
    const currentTheme = store.getState('app.theme');
    const themes = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    store.dispatch('app.theme', nextTheme);
    this.applyTheme(nextTheme);
  }
  
  /**
   * Toggle help
   */
  toggleHelp() {
    const helpDialog = document.getElementById('help-dialog');
    if (helpDialog) {
      helpDialog.classList.toggle('hidden');
    } else {
      this.showHelpDialog();
    }
  }
  
  /**
   * Show help dialog
   */
  showHelpDialog() {
    const helpDialog = document.createElement('div');
    helpDialog.id = 'help-dialog';
    helpDialog.className = 'modal-overlay';
    helpDialog.innerHTML = `
      <div class="modal-content help-modal">
        <div class="modal-header">
          <h2>Bantuan Keyboard Shortcuts</h2>
          <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()">
            <i class="material-icons">close</i>
          </button>
        </div>
        <div class="modal-body">
          <table class="shortcuts-table">
            <tr><td><kbd>Alt+D</kbd></td><td>Dashboard</td></tr>
            <tr><td><kbd>Alt+S</kbd></td><td>Pencarian</td></tr>
            <tr><td><kbd>Alt+M</kbd></td><td>Surat Masuk</td></tr>
            <tr><td><kbd>Alt+K</kbd></td><td>Surat Keluar</td></tr>
            <tr><td><kbd>Alt+P</kbd></td><td>Disposisi</td></tr>
            <tr><td><kbd>Ctrl+B</kbd></td><td>Toggle Sidebar</td></tr>
            <tr><td><kbd>Ctrl+Shift+T</kbd></td><td>Toggle Theme</td></tr>
            <tr><td><kbd>Ctrl+Z</kbd></td><td>Undo</td></tr>
            <tr><td><kbd>Ctrl+Y</kbd></td><td>Redo</td></tr>
            <tr><td><kbd>Ctrl+/</kbd></td><td>Tampilkan Bantuan</td></tr>
            <tr><td><kbd>Escape</kbd></td><td>Tutup Modal</td></tr>
          </table>
        </div>
      </div>
    `;
    document.body.appendChild(helpDialog);
    
    helpDialog.addEventListener('click', (e) => {
      if (e.target === helpDialog) helpDialog.remove();
    });
  }
  
  /**
   * Save current form
   */
  saveCurrentForm() {
    const activeForm = document.querySelector('form:focus-within');
    if (activeForm) {
      activeForm.dispatchEvent(new Event('submit', { bubbles: true }));
    }
  }
  
  /**
   * Close all modals
   */
  closeAllModals() {
    document.querySelectorAll('.modal-overlay, .drawer-overlay').forEach(modal => {
      modal.dispatchEvent(new Event('close'));
    });
  }
  
  /**
   * Show context menu
   */
  showContextMenu(x, y, type, target) {
    // Remove existing context menu
    const existing = document.querySelector('.context-menu');
    if (existing) existing.remove();
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    
    // Build menu items based on type
    const menuItems = this.getContextMenuItems(type, target);
    menu.innerHTML = menuItems.map(item => `
      <button class="context-menu-item" data-action="${item.action}">
        <i class="material-icons">${item.icon}</i>
        <span>${item.label}</span>
        ${item.shortcut ? `<kbd>${item.shortcut}</kbd>` : ''}
      </button>
    `).join('');
    
    // Add event listeners
    menu.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action) {
        this.handleContextMenuAction(action, target);
        menu.remove();
      }
    });
    
    // Close on click outside
    document.addEventListener('click', () => menu.remove(), { once: true });
    
    document.body.appendChild(menu);
  }
  
  /**
   * Get context menu items
   */
  getContextMenuItems(type, target) {
    const menus = {
      'surat-item': [
        { action: 'view', icon: 'visibility', label: 'Lihat Detail' },
        { action: 'edit', icon: 'edit', label: 'Edit' },
        { action: 'disposisi', icon: 'forward', label: 'Disposisi' },
        { action: 'download', icon: 'download', label: 'Download' },
        { action: 'print', icon: 'print', label: 'Cetak', shortcut: 'Ctrl+P' },
        { type: 'divider' },
        { action: 'delete', icon: 'delete', label: 'Hapus', shortcut: 'Delete' }
      ],
      'user-item': [
        { action: 'edit', icon: 'edit', label: 'Edit' },
        { action: 'reset-password', icon: 'lock', label: 'Reset Password' },
        { action: 'toggle-active', icon: 'toggle_on', label: 'Nonaktifkan' },
        { type: 'divider' },
        { action: 'delete', icon: 'delete', label: 'Hapus' }
      ]
    };
    
    return menus[type] || [];
  }
  
  /**
   * Handle context menu action
   */
  handleContextMenuAction(action, target) {
    const id = target.dataset.id;
    
    switch (action) {
      case 'view':
        router.navigate(`/surat-masuk/${id}`);
        break;
      case 'edit':
        router.navigate(`/surat-masuk/${id}/edit`);
        break;
      case 'delete':
        // Show delete confirmation
        NotificationService.confirm('Apakah Anda yakin ingin menghapus item ini?', () => {
          api.deleteSuratMasuk(id);
        });
        break;
      case 'download':
        FileService.download(id);
        break;
      case 'print':
        window.print();
        break;
    }
  }
  
  /**
   * Install PWA
   */
  async installPWA() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const result = await this.deferredPrompt.userChoice;
      AnalyticsService.trackEvent('pwa', 'install', result.outcome);
      this.deferredPrompt = null;
    }
  }
  
  /**
   * Get module
   */
  getModule(name) {
    return this.modules[name];
  }
  
  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature) {
    return APP_CONFIG.FEATURES[feature] || false;
  }
}

// Create and initialize app
const app = new App();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Export for debugging
window.app = app;
window.store = store;
window.router = router;
window.api = api;

// Export module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { App, app };
}
