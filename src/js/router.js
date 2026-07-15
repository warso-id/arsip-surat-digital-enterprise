/**
 * ROUTER - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * File: src/js/router.js
 * Support: Google Apps Script (code.gs) + Google Sheets + Frontend
 * Encoding: Base64 untuk komunikasi data
 * Hash-based router dengan lazy loading
 */

// ============================================
// GOOGLE SHEETS ROUTE MIDDLEWARE
// ============================================
const SheetsMiddleware = {
  /**
   * Cek koneksi ke Google Sheets
   */
  async checkConnection() {
    try {
      const payload = Base64Util.encodeObject({
        action: 'system.health',
        timestamp: Date.now(),
        check: 'sheets_connection'
      });
      
      const response = await fetch(`${APP_CONFIG.API.BASE_URL}?data=${payload}`);
      const result = await response.json();
      
      if (result && result.payload) {
        const decoded = Base64Util.decodeObject(result.payload);
        return decoded?.sheetsConnected || false;
      }
      return false;
    } catch (error) {
      console.error('Sheets connection check failed:', error);
      return false;
    }
  },

  /**
   * Validasi akses sheet
   */
  async validateSheetAccess(sheetName, action) {
    const token = localStorage.getItem(APP_CONFIG.AUTH.TOKEN_KEY);
    if (!token) return false;

    try {
      const payload = Base64Util.encodeObject({
        action: 'security.access_check',
        sheet: sheetName,
        operation: action,
        token: token,
        timestamp: Date.now()
      });
      
      const response = await fetch(`${APP_CONFIG.API.BASE_URL}?data=${payload}`);
      const result = await response.json();
      
      if (result && result.payload) {
        const decoded = Base64Util.decodeObject(result.payload);
        return decoded?.hasAccess || false;
      }
      return false;
    } catch (error) {
      console.error('Sheet access validation failed:', error);
      return false;
    }
  },

  /**
   * Load data dari Google Sheets
   */
  async loadSheetData(sheetName, query = {}) {
    try {
      const payload = Base64Util.encodeObject({
        action: `${sheetName}.list`,
        query: query,
        timestamp: Date.now()
      });
      
      // Cek cache dulu
      const cacheKey = `sheets_${sheetName}_${Base64Util.encodeObject(query)}`;
      const cached = await CacheManager.get(cacheKey);
      if (cached) return cached;
      
      const response = await fetch(`${APP_CONFIG.API.BASE_URL}?data=${payload}`);
      const result = await response.json();
      
      if (result && result.payload) {
        const decoded = Base64Util.decodeObject(result.payload);
        
        // Cache data
        await CacheManager.set(cacheKey, decoded, 60);
        
        return decoded;
      }
      return null;
    } catch (error) {
      console.error(`Failed to load sheet data for ${sheetName}:`, error);
      return null;
    }
  }
};

// ============================================
// ROUTE DATA LOADER
// ============================================
const RouteDataLoader = {
  /**
   * Load data yang dibutuhkan oleh route
   */
  async load(route, params, query) {
    const dataLoaders = {
      '/': async () => {
        const [stats, chart, notifications] = await Promise.all([
          SheetsMiddleware.loadSheetData('dashboard', { type: 'stats' }),
          SheetsMiddleware.loadSheetData('dashboard', { type: 'chart' }),
          this.loadNotifications()
        ]);
        return { stats, chart, notifications };
      },
      
      '/dashboard': async () => {
        return await SheetsMiddleware.loadSheetData('dashboard', { type: 'full' });
      },
      
      '/surat-masuk': async () => {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || APP_CONFIG.UI.PAGINATION.DEFAULT_PAGE_SIZE;
        const sort = query.sort || 'tanggal_diterima';
        const order = query.order || 'desc';
        
        return await SheetsMiddleware.loadSheetData('suratMasuk', {
          page, limit, sort, order,
          search: query.search || '',
          status: query.status || '',
          klasifikasi: query.klasifikasi || ''
        });
      },
      
      '/surat-masuk/:id': async () => {
        const id = params.id;
        return await SheetsMiddleware.loadSheetData('suratMasuk', { id, type: 'detail' });
      },
      
      '/surat-masuk/create': async () => {
        const [klasifikasi, masterData] = await Promise.all([
          SheetsMiddleware.loadSheetData('klasifikasi', { type: 'list' }),
          SheetsMiddleware.loadSheetData('masterData', { type: 'surat_masuk_form' })
        ]);
        return { klasifikasi, masterData };
      },
      
      '/surat-keluar': async () => {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || APP_CONFIG.UI.PAGINATION.DEFAULT_PAGE_SIZE;
        
        return await SheetsMiddleware.loadSheetData('suratKeluar', {
          page, limit,
          search: query.search || '',
          status: query.status || '',
          approvalStatus: query.approval || ''
        });
      },
      
      '/surat-keluar/:id': async () => {
        const id = params.id;
        const [detail, history, approval] = await Promise.all([
          SheetsMiddleware.loadSheetData('suratKeluar', { id, type: 'detail' }),
          SheetsMiddleware.loadSheetData('suratKeluar', { id, type: 'history' }),
          SheetsMiddleware.loadSheetData('approval', { suratId: id, type: 'surat_keluar' })
        ]);
        return { detail, history, approval };
      },
      
      '/disposisi': async () => {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || APP_CONFIG.UI.PAGINATION.DEFAULT_PAGE_SIZE;
        
        return await SheetsMiddleware.loadSheetData('disposisi', {
          page, limit,
          status: query.status || '',
          prioritas: query.prioritas || '',
          userId: query.userId || ''
        });
      },
      
      '/disposisi/:id': async () => {
        const id = params.id;
        return await SheetsMiddleware.loadSheetData('disposisi', { id, type: 'detail' });
      },
      
      '/users': async () => {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || APP_CONFIG.UI.PAGINATION.DEFAULT_PAGE_SIZE;
        
        return await SheetsMiddleware.loadSheetData('users', {
          page, limit,
          search: query.search || '',
          role: query.role || '',
          bidang: query.bidang || ''
        });
      },
      
      '/profile': async () => {
        const userId = AuthService.getUserId();
        return await SheetsMiddleware.loadSheetData('users', { id: userId, type: 'profile' });
      },
      
      '/search': async () => {
        const q = query.q || '';
        if (!q) return { results: [] };
        
        return await SheetsMiddleware.loadSheetData('search', { 
          query: q, 
          type: 'global',
          limit: 20 
        });
      },
      
      '/approval': async () => {
        const userId = AuthService.getUserId();
        return await SheetsMiddleware.loadSheetData('approval', { 
          userId,
          status: query.status || 'pending'
        });
      },
      
      '/files': async () => {
        const page = parseInt(query.page) || 1;
        return await SheetsMiddleware.loadSheetData('file', { 
          page,
          type: query.type || 'all'
        });
      },
      
      '/audit-log': async () => {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 50;
        
        return await SheetsMiddleware.loadSheetData('auditLog', {
          page, limit,
          action: query.action || '',
          userId: query.userId || '',
          startDate: query.startDate || '',
          endDate: query.endDate || ''
        });
      },
      
      '/blockchain': async () => {
        return await SheetsMiddleware.loadSheetData('blockchain', { type: 'chain' });
      },
      
      '/settings': async () => {
        return await SheetsMiddleware.loadSheetData('config', { type: 'all' });
      },
      
      '/reports': async () => {
        const type = query.type || 'comprehensive';
        return await SheetsMiddleware.loadSheetData('report', {
          type,
          startDate: query.startDate || '',
          endDate: query.endDate || ''
        });
      }
    };
    
    // Check exact match first
    if (dataLoaders[route.path]) {
      return await dataLoaders[route.path]();
    }
    
    // Check pattern match for routes with params
    for (const [pattern, loader] of Object.entries(dataLoaders)) {
      if (pattern.includes(':')) {
        const regex = new RegExp('^' + pattern.replace(/:(\w+)/g, '([^/]+)') + '$');
        if (regex.test(route.path)) {
          return await loader();
        }
      }
    }
    
    return null;
  },

  /**
   * Load notifications
   */
  async loadNotifications() {
    if (!AuthService.isAuthenticated()) return [];
    
    try {
      return await SheetsMiddleware.loadSheetData('notifikasi', {
        userId: AuthService.getUserId(),
        unread: true,
        limit: 10
      });
    } catch (error) {
      console.error('Failed to load notifications:', error);
      return [];
    }
  }
};

// ============================================
// ROUTER CLASS
// ============================================
class Router {
  constructor() {
    this.routes = new Map();
    this.beforeHooks = [];
    this.afterHooks = [];
    this.currentRoute = null;
    this.previousRoute = null;
    this.params = {};
    this.query = {};
    this.layouts = {};
    this.defaultLayout = 'default';
    this.errorComponent = null;
    this.loadingComponent = null;
    this.sheetsConnected = false;
    this.initialized = false;
  }
  
  /**
   * Register routes
   */
  register(routes) {
    routes.forEach(route => {
      this.routes.set(route.path, {
        ...route,
        regex: this.pathToRegex(route.path),
        paramNames: this.extractParamNames(route.path)
      });
    });
  }
  
  /**
   * Register a single route
   */
  addRoute(path, options) {
    this.routes.set(path, {
      path,
      ...options,
      regex: this.pathToRegex(path),
      paramNames: this.extractParamNames(path)
    });
  }
  
  /**
   * Register layout
   */
  registerLayout(name, component) {
    this.layouts[name] = component;
  }
  
  /**
   * Set default layout
   */
  setDefaultLayout(name) {
    this.defaultLayout = name;
  }
  
  /**
   * Set error component
   */
  setErrorComponent(component) {
    this.errorComponent = component;
  }
  
  /**
   * Set loading component
   */
  setLoadingComponent(component) {
    this.loadingComponent = component;
  }
  
  /**
   * Add before hook
   */
  beforeEach(hook) {
    this.beforeHooks.push(hook);
  }
  
  /**
   * Add after hook
   */
  afterEach(hook) {
    this.afterHooks.push(hook);
  }
  
  /**
   * Navigate to path
   */
  navigate(path, options = {}) {
    const { replace = false, query = {}, data = {} } = options;
    
    // Build URL with query
    let url = path;
    const queryString = new URLSearchParams(query).toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
    
    // Set route data (encoded)
    if (Object.keys(data).length > 0) {
      const encodedData = Base64Util.encodeObject(data);
      sessionStorage.setItem(`route_data_${Base64Util.encode(path)}`, encodedData);
    }
    
    if (replace) {
      window.location.replace(`#${url}`);
    } else {
      window.location.hash = url;
    }
  }
  
  /**
   * Start router
   */
  async start() {
    if (this.initialized) return;
    
    // Check Google Sheets connection
    this.sheetsConnected = await SheetsMiddleware.checkConnection();
    if (!this.sheetsConnected) {
      console.warn('⚠️ Google Sheets connection not available. Running in offline mode.');
    }
    
    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRoute());
    
    // Handle initial route
    if (window.location.hash) {
      this.handleRoute();
    } else {
      this.navigate('/');
    }
    
    // Handle back/forward browser buttons
    window.addEventListener('popstate', () => {
      this.handleRoute();
    });
    
    this.initialized = true;
    console.log('✅ Router started (Sheets connected:', this.sheetsConnected, ')');
  }
  
  /**
   * Handle route change
   */
  async handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, queryString] = hash.split('?');
    
    // Parse query parameters
    const query = {};
    if (queryString) {
      new URLSearchParams(queryString).forEach((value, key) => {
        query[key] = value;
      });
    }
    
    // Find matching route
    let matchedRoute = null;
    let params = {};
    
    for (const [routePath, route] of this.routes) {
      const match = path.match(route.regex);
      if (match) {
        matchedRoute = route;
        // Extract params
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        break;
      }
    }
    
    // Handle 404
    if (!matchedRoute) {
      matchedRoute = this.routes.get('*') || {
        path: '*',
        component: this.errorComponent || 'error/404',
        layout: this.defaultLayout,
        title: '404 - Halaman Tidak Ditemukan'
      };
    }
    
    // Check auth guard
    if (matchedRoute.auth !== false && !AuthService.isAuthenticated()) {
      const redirectPath = Base64Util.encode(path);
      this.navigate('/login', { 
        query: { redirect: redirectPath },
        replace: true 
      });
      return;
    }
    
    // Check role guard
    if (matchedRoute.roles && matchedRoute.roles.length > 0) {
      const userRole = AuthService.getUserRole();
      if (!matchedRoute.roles.includes(userRole)) {
        this.navigate('/403', { replace: true });
        return;
      }
    }
    
    // Check Google Sheets access for protected routes
    if (matchedRoute.auth !== false && this.sheetsConnected) {
      const sheetName = this.getSheetNameForRoute(matchedRoute.path);
      if (sheetName) {
        const hasAccess = await SheetsMiddleware.validateSheetAccess(sheetName, 'read');
        if (!hasAccess) {
          this.navigate('/403', { replace: true });
          return;
        }
      }
    }
    
    // Run before hooks
    for (const hook of this.beforeHooks) {
      const result = await hook(matchedRoute, params, query);
      if (result === false) return;
      if (typeof result === 'string') {
        this.navigate(result);
        return;
      }
    }
    
    // Store previous route
    this.previousRoute = this.currentRoute;
    
    // Load route data from Google Sheets
    let routeData = null;
    if (matchedRoute.auth !== false) {
      routeData = await RouteDataLoader.load(matchedRoute, params, query);
    }
    
    // Set current route
    this.currentRoute = {
      ...matchedRoute,
      params,
      query,
      path: hash,
      data: routeData
    };
    
    // Update state
    if (typeof store !== 'undefined') {
      store.dispatch('ui.currentRoute', this.currentRoute);
      store.dispatch('ui.breadcrumbs', this.buildBreadcrumbs(this.currentRoute));
    }
    
    // Update document title
    document.title = `${matchedRoute.title || APP_CONFIG.APP_NAME} - ${APP_CONFIG.APP_NAME}`;
    
    // Render component
    await this.render(matchedRoute);
    
    // Run after hooks
    for (const hook of this.afterHooks) {
      await hook(matchedRoute, params, query);
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Track page view
    if (APP_CONFIG.ANALYTICS.ENABLED && typeof AnalyticsService !== 'undefined') {
      AnalyticsService.trackPageView(path, matchedRoute.title);
    }
  }
  
  /**
   * Get sheet name for route
   */
  getSheetNameForRoute(path) {
    const sheetMapping = {
      '/surat-masuk': 'SuratMasuk',
      '/surat-masuk/create': 'SuratMasuk',
      '/surat-masuk/:id': 'SuratMasuk',
      '/surat-masuk/:id/edit': 'SuratMasuk',
      '/surat-keluar': 'SuratKeluar',
      '/surat-keluar/create': 'SuratKeluar',
      '/surat-keluar/:id': 'SuratKeluar',
      '/disposisi': 'Disposisi',
      '/disposisi/create': 'Disposisi',
      '/disposisi/:id': 'Disposisi',
      '/approval': 'Approval',
      '/users': 'Users',
      '/files': 'Files',
      '/audit-log': 'AuditLog',
      '/settings': 'Konfigurasi'
    };
    
    // Check exact match
    if (sheetMapping[path]) return sheetMapping[path];
    
    // Check pattern match
    for (const [pattern, sheet] of Object.entries(sheetMapping)) {
      if (pattern.includes(':')) {
        const regex = new RegExp('^' + pattern.replace(/:(\w+)/g, '([^/]+)') + '$');
        if (regex.test(path)) return sheet;
      }
    }
    
    return null;
  }
  
  /**
   * Render route component
   */
  async render(route) {
    const appShell = document.getElementById('app-shell');
    if (!appShell) return;
    
    // Show loading
    if (this.loadingComponent) {
      const LoadingComponent = await this.loadComponent(this.loadingComponent);
      this.renderComponent(appShell, LoadingComponent);
    }
    
    try {
      // Load layout
      const layoutName = route.layout || this.defaultLayout;
      const LayoutComponent = await this.loadComponent(
        this.layouts[layoutName] || this.layouts[this.defaultLayout]
      );
      
      // Load page component
      const PageComponent = await this.loadComponent(route.component);
      
      // Render
      this.renderComponent(appShell, LayoutComponent, {
        page: PageComponent,
        route: this.currentRoute,
        params: this.currentRoute.params,
        query: this.currentRoute.query,
        data: this.currentRoute.data
      });
      
    } catch (error) {
      console.error('Error rendering route:', error);
      if (this.errorComponent) {
        const ErrorComponent = await this.loadComponent(this.errorComponent);
        this.renderComponent(appShell, ErrorComponent, { 
          error,
          route: this.currentRoute
        });
      }
    }
  }
  
  /**
   * Load component (with lazy loading + Sheets caching)
   */
  async loadComponent(component) {
    if (typeof component === 'function') {
      return component;
    }
    
    if (typeof component === 'string') {
      // Check component cache
      const cacheKey = `component_${Base64Util.encode(component)}`;
      const cached = await CacheManager.get(cacheKey);
      if (cached && typeof cached === 'function') {
        return cached;
      }
      
      // Dynamic import
      try {
        const module = await import(`./pages/${component}.js`);
        const ComponentClass = module.default || module;
        
        // Cache component
        await CacheManager.set(cacheKey, ComponentClass, 3600);
        
        return ComponentClass;
      } catch (error) {
        console.error(`Error loading component: ${component}`, error);
        throw error;
      }
    }
    
    return component;
  }
  
  /**
   * Render component to DOM
   */
  renderComponent(container, Component, props = {}) {
    // Clear container
    container.innerHTML = '';
    
    // Create or update component
    if (typeof Component === 'function') {
      const element = Component(props);
      if (element instanceof HTMLElement) {
        container.appendChild(element);
      } else if (typeof element === 'string') {
        container.innerHTML = element;
      }
    } else if (Component instanceof HTMLElement) {
      container.appendChild(Component);
    }
  }
  
  /**
   * Build breadcrumbs
   */
  buildBreadcrumbs(route) {
    const breadcrumbs = [];
    const parts = route.path.split('/').filter(Boolean);
    
    let currentPath = '';
    parts.forEach((part, index) => {
      currentPath += '/' + part;
      const matchedRoute = Array.from(this.routes.values()).find(r => r.path === currentPath);
      breadcrumbs.push({
        label: matchedRoute ? matchedRoute.breadcrumb || matchedRoute.title || part : part,
        path: currentPath,
        active: index === parts.length - 1
      });
    });
    
    return breadcrumbs;
  }
  
  /**
   * Convert path to regex
   */
  pathToRegex(path) {
    const regexString = path
      .replace(/\//g, '\\/')
      .replace(/:(\w+)/g, '([^/]+)')
      .replace(/\*/g, '.*');
    
    return new RegExp(`^${regexString}$`);
  }
  
  /**
   * Extract parameter names from path
   */
  extractParamNames(path) {
    const matches = path.match(/:(\w+)/g);
    return matches ? matches.map(match => match.slice(1)) : [];
  }
  
  /**
   * Get current route
   */
  getCurrentRoute() {
    return this.currentRoute;
  }
  
  /**
   * Get previous route
   */
  getPreviousRoute() {
    return this.previousRoute;
  }
  
  /**
   * Go back
   */
  back() {
    window.history.back();
  }
  
  /**
   * Go forward
   */
  forward() {
    window.history.forward();
  }
  
  /**
   * Reload current route
   */
  reload() {
    this.handleRoute();
  }
  
  /**
   * Get URL for route
   */
  getUrl(path, params = {}, query = {}) {
    let url = path;
    
    // Replace params
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
    
    // Add query
    const queryString = new URLSearchParams(query).toString();
    if (queryString) {
      url += '?' + queryString;
    }
    
    return `#${url}`;
  }
}

// ============================================
// ROUTE DEFINITIONS
// ============================================
const routes = [
  // Auth routes
  { path: '/login', component: 'auth/login', layout: 'auth', title: 'Login', auth: false, breadcrumb: 'Login' },
  { path: '/register', component: 'auth/register', layout: 'auth', title: 'Register', auth: false, breadcrumb: 'Register' },
  { path: '/forgot-password', component: 'auth/forgot-password', layout: 'auth', title: 'Lupa Password', auth: false },
  { path: '/reset-password', component: 'auth/reset-password', layout: 'auth', title: 'Reset Password', auth: false },
  { path: '/2fa', component: 'auth/two-factor', layout: 'auth', title: 'Verifikasi 2FA', auth: false },
  { path: '/setup', component: 'auth/setup', layout: 'auth', title: 'Setup Aplikasi', auth: false },
  
  // Main routes
  { path: '/', component: 'dashboard/dashboard', title: 'Dashboard', breadcrumb: 'Dashboard' },
  { path: '/dashboard', component: 'dashboard/dashboard', title: 'Dashboard', breadcrumb: 'Dashboard' },
  { path: '/dashboard/analytics', component: 'dashboard/analytics', title: 'Analytics', breadcrumb: 'Analytics', roles: ['admin', 'kabid'] },
  { path: '/dashboard/realtime', component: 'dashboard/realtime', title: 'Real-time', breadcrumb: 'Real-time', roles: ['admin'] },
  { path: '/dashboard/custom', component: 'dashboard/custom', title: 'Custom Dashboard', breadcrumb: 'Custom', roles: ['admin'] },
  
  // Surat Masuk routes
  { path: '/surat-masuk', component: 'surat-masuk/list', title: 'Surat Masuk', breadcrumb: 'Surat Masuk' },
  { path: '/surat-masuk/create', component: 'surat-masuk/create', title: 'Tambah Surat Masuk', breadcrumb: 'Tambah' },
  { path: '/surat-masuk/:id', component: 'surat-masuk/detail', title: 'Detail Surat Masuk', breadcrumb: 'Detail' },
  { path: '/surat-masuk/:id/edit', component: 'surat-masuk/edit', title: 'Edit Surat Masuk', breadcrumb: 'Edit' },
  { path: '/surat-masuk/:id/history', component: 'surat-masuk/history', title: 'Riwayat Surat', breadcrumb: 'Riwayat' },
  { path: '/surat-masuk/:id/distribusi', component: 'surat-masuk/distribusi', title: 'Distribusi Surat', breadcrumb: 'Distribusi' },
  { path: '/surat-masuk/import', component: 'surat-masuk/import', title: 'Import Surat Masuk', breadcrumb: 'Import', roles: ['admin'] },
  { path: '/surat-masuk/compare', component: 'surat-masuk/compare', title: 'Bandingkan Surat', breadcrumb: 'Compare', roles: ['admin', 'kabid'] },
  
  // Surat Keluar routes
  { path: '/surat-keluar', component: 'surat-keluar/list', title: 'Surat Keluar', breadcrumb: 'Surat Keluar' },
  { path: '/surat-keluar/create', component: 'surat-keluar/create', title: 'Tambah Surat Keluar', breadcrumb: 'Tambah' },
  { path: '/surat-keluar/:id', component: 'surat-keluar/detail', title: 'Detail Surat Keluar', breadcrumb: 'Detail' },
  { path: '/surat-keluar/:id/edit', component: 'surat-keluar/edit', title: 'Edit Surat Keluar', breadcrumb: 'Edit' },
  { path: '/surat-keluar/:id/history', component: 'surat-keluar/history', title: 'Riwayat Surat', breadcrumb: 'Riwayat' },
  { path: '/surat-keluar/agenda', component: 'surat-keluar/agenda', title: 'Agenda Surat', breadcrumb: 'Agenda' },
  { path: '/surat-keluar/bulk-approve', component: 'surat-keluar/bulk-approve', title: 'Bulk Approval', breadcrumb: 'Bulk Approve', roles: ['admin', 'kabid'] },
  
  // Disposisi routes
  { path: '/disposisi', component: 'disposisi/list', title: 'Disposisi', breadcrumb: 'Disposisi' },
  { path: '/disposisi/create', component: 'disposisi/create', title: 'Buat Disposisi', breadcrumb: 'Buat' },
  { path: '/disposisi/create-multiple', component: 'disposisi/create-multiple', title: 'Buat Disposisi Massal', breadcrumb: 'Buat Massal' },
  { path: '/disposisi/:id', component: 'disposisi/detail', title: 'Detail Disposisi', breadcrumb: 'Detail' },
  { path: '/disposisi/:id/tindak-lanjut', component: 'disposisi/tindak-lanjut', title: 'Tindak Lanjut', breadcrumb: 'Tindak Lanjut' },
  { path: '/disposisi/kalender', component: 'disposisi/kalender', title: 'Kalender Disposisi', breadcrumb: 'Kalender' },
  { path: '/disposisi/laporan', component: 'disposisi/report', title: 'Laporan Disposisi', breadcrumb: 'Laporan', roles: ['admin', 'kabid'] },
  { path: '/disposisi/bulk-update', component: 'disposisi/bulk-update', title: 'Update Massal', breadcrumb: 'Update Massal', roles: ['admin'] },
  
  // Approval routes
  { path: '/approval', component: 'approval/list', title: 'Approval', breadcrumb: 'Approval' },
  { path: '/approval/:id', component: 'approval/process', title: 'Proses Approval', breadcrumb: 'Proses' },
  { path: '/approval/multi-level', component: 'approval/multi-level', title: 'Multi Level Approval', breadcrumb: 'Multi Level', roles: ['admin'] },
  { path: '/approval/routing', component: 'approval/routing', title: 'Routing Approval', breadcrumb: 'Routing', roles: ['admin'] },
  { path: '/approval/delegate', component: 'approval/delegate', title: 'Delegasi Approval', breadcrumb: 'Delegasi' },
  
  // TTD routes
  { path: '/ttd/register', component: 'ttd/register', title: 'Register TTD', breadcrumb: 'Register TTD' },
  { path: '/ttd/verify', component: 'ttd/verify', title: 'Verifikasi TTD', breadcrumb: 'Verifikasi' },
  { path: '/ttd/bulk-sign', component: 'ttd/bulk-sign', title: 'Bulk Sign', breadcrumb: 'Bulk Sign', roles: ['admin', 'kabid'] },
  
  // Users routes
  { path: '/users', component: 'users/list', title: 'Pengguna', breadcrumb: 'Pengguna', roles: ['admin'] },
  { path: '/users/create', component: 'users/create', title: 'Tambah Pengguna', breadcrumb: 'Tambah', roles: ['admin'] },
  { path: '/users/bulk-create', component: 'users/bulk-create', title: 'Tambah Pengguna Massal', breadcrumb: 'Tambah Massal', roles: ['admin'] },
  { path: '/users/:id/edit', component: 'users/edit', title: 'Edit Pengguna', breadcrumb: 'Edit', roles: ['admin'] },
  { path: '/users/export', component: 'users/export', title: 'Export Pengguna', breadcrumb: 'Export', roles: ['admin'] },
  { path: '/profile', component: 'users/profile', title: 'Profil Saya', breadcrumb: 'Profil' },
  { path: '/profile/edit', component: 'users/edit-profile', title: 'Edit Profil', breadcrumb: 'Edit Profil' },
  { path: '/sessions', component: 'users/sessions', title: 'Sesi Aktif', breadcrumb: 'Sesi', roles: ['admin'] },
  
  // Reports routes
  { path: '/reports', component: 'reports/comprehensive', title: 'Laporan', breadcrumb: 'Laporan', roles: ['admin', 'kabid'] },
  { path: '/reports/surat-masuk', component: 'reports/surat-masuk', title: 'Laporan Surat Masuk', breadcrumb: 'Surat Masuk', roles: ['admin', 'kabid'] },
  { path: '/reports/surat-keluar', component: 'reports/surat-keluar', title: 'Laporan Surat Keluar', breadcrumb: 'Surat Keluar', roles: ['admin', 'kabid'] },
  { path: '/reports/disposisi', component: 'reports/disposisi', title: 'Laporan Disposisi', breadcrumb: 'Disposisi', roles: ['admin', 'kabid'] },
  { path: '/reports/schedule', component: 'reports/schedule', title: 'Jadwal Laporan', breadcrumb: 'Jadwal', roles: ['admin'] },
  
  // Export routes
  { path: '/export/data', component: 'export/data', title: 'Export Data', breadcrumb: 'Export Data', roles: ['admin'] },
  { path: '/export/pdf', component: 'export/pdf', title: 'Export PDF', breadcrumb: 'Export PDF', roles: ['admin'] },
  { path: '/export/excel', component: 'export/excel', title: 'Export Excel', breadcrumb: 'Export Excel', roles: ['admin'] },
  
  // Search routes
  { path: '/search', component: 'search/global', title: 'Pencarian', breadcrumb: 'Pencarian' },
  { path: '/search/advanced', component: 'search/advanced', title: 'Pencarian Lanjutan', breadcrumb: 'Lanjutan' },
  
  // Files routes
  { path: '/files', component: 'files/manager', title: 'File Manager', breadcrumb: 'Files', roles: ['admin'] },
  { path: '/files/share', component: 'files/share', title: 'Share File', breadcrumb: 'Share' },
  { path: '/files/preview/:id', component: 'files/preview', title: 'Preview File', breadcrumb: 'Preview' },
  
  // Master Data routes
  { path: '/master-data', component: 'master-data/list', title: 'Master Data', breadcrumb: 'Master Data', roles: ['admin'] },
  { path: '/master-data/klasifikasi', component: 'master-data/klasifikasi', title: 'Klasifikasi', breadcrumb: 'Klasifikasi', roles: ['admin'] },
  
  // Template routes
  { path: '/templates', component: 'templates/list', title: 'Template', breadcrumb: 'Template' },
  { path: '/templates/create', component: 'templates/create', title: 'Buat Template', breadcrumb: 'Buat' },
  
  // Settings routes
  { path: '/settings', component: 'settings/general', title: 'Pengaturan', breadcrumb: 'Pengaturan', roles: ['admin'] },
  { path: '/settings/security', component: 'settings/security', title: 'Keamanan', breadcrumb: 'Keamanan', roles: ['admin'] },
  { path: '/settings/notifications', component: 'settings/notifications', title: 'Notifikasi', breadcrumb: 'Notifikasi', roles: ['admin'] },
  { path: '/settings/api-keys', component: 'settings/api-keys', title: 'API Keys', breadcrumb: 'API Keys', roles: ['admin'] },
  { path: '/settings/webhooks', component: 'settings/webhooks', title: 'Webhooks', breadcrumb: 'Webhooks', roles: ['admin'] },
  { path: '/settings/backup', component: 'settings/backup', title: 'Backup & Restore', breadcrumb: 'Backup', roles: ['admin'] },
  { path: '/settings/retensi', component: 'settings/retensi', title: 'Kebijakan Retensi', breadcrumb: 'Retensi', roles: ['admin'] },
  
  // Notifications routes
  { path: '/notifications', component: 'notifications/list', title: 'Notifikasi', breadcrumb: 'Notifikasi' },
  { path: '/notifications/settings', component: 'notifications/settings', title: 'Pengaturan Notifikasi', breadcrumb: 'Pengaturan' },
  
  // Reminder routes
  { path: '/reminders', component: 'reminders/list', title: 'Reminder', breadcrumb: 'Reminder' },
  { path: '/reminders/create', component: 'reminders/create', title: 'Buat Reminder', breadcrumb: 'Buat' },
  
  // AI routes
  { path: '/ai/analyze', component: 'ai/analyze', title: 'AI Analysis', breadcrumb: 'AI Analysis', roles: ['admin', 'kabid'] },
  { path: '/ai/classify', component: 'ai/classify', title: 'AI Classification', breadcrumb: 'AI Classify', roles: ['admin'] },
  { path: '/ai/recommend', component: 'ai/recommend', title: 'AI Recommendations', breadcrumb: 'AI Recommend' },
  
  // OCR routes
  { path: '/ocr/scan', component: 'ocr/scan', title: 'OCR Scan', breadcrumb: 'OCR Scan' },
  
  // Blockchain routes
  { path: '/blockchain', component: 'blockchain/explorer', title: 'Blockchain', breadcrumb: 'Blockchain', roles: ['admin'] },
  { path: '/blockchain/verify', component: 'blockchain/verify', title: 'Verifikasi Dokumen', breadcrumb: 'Verifikasi' },
  { path: '/blockchain/:id', component: 'blockchain/detail', title: 'Detail Block', breadcrumb: 'Detail', roles: ['admin'] },
  
  // Audit Log routes
  { path: '/audit-log', component: 'audit-log/list', title: 'Audit Log', breadcrumb: 'Audit Log', roles: ['admin'] },
  { path: '/audit-log/analytics', component: 'audit-log/analytics', title: 'Analytics Audit', breadcrumb: 'Analytics', roles: ['admin'] },
  
  // Biometric routes
  { path: '/biometric/register', component: 'biometric/register', title: 'Register Biometric', breadcrumb: 'Biometric' },
  { path: '/biometric/verify', component: 'biometric/verify', title: 'Verify Biometric', breadcrumb: 'Verify' },
  
  // System routes
  { path: '/system/status', component: 'system/status', title: 'System Status', breadcrumb: 'Status', roles: ['admin'] },
  { path: '/system/health', component: 'system/health', title: 'System Health', breadcrumb: 'Health', roles: ['admin'] },
  { path: '/system/integrity', component: 'system/integrity', title: 'Data Integrity', breadcrumb: 'Integrity', roles: ['admin'] },
  { path: '/system/recovery', component: 'system/recovery', title: 'System Recovery', breadcrumb: 'Recovery', roles: ['admin'] },
  { path: '/maintenance', component: 'system/maintenance', layout: 'auth', title: 'Maintenance', auth: false },
  
  // Public routes
  { path: '/verify-document', component: 'public/verify', layout: 'public', title: 'Verifikasi Dokumen', auth: false },
  { path: '/ping', component: 'public/ping', layout: 'public', title: 'Ping', auth: false },
  
  // Error routes
  { path: '/403', component: 'error/403', layout: 'auth', title: '403 - Akses Ditolak', auth: false },
  { path: '/404', component: 'error/404', layout: 'auth', title: '404 - Halaman Tidak Ditemukan', auth: false },
  { path: '/500', component: 'error/500', layout: 'auth', title: '500 - Server Error', auth: false },
  { path: '/offline', component: 'error/offline', layout: 'auth', title: 'Offline', auth: false },
  { path: '*', component: 'error/404', layout: 'auth', title: '404 - Halaman Tidak Ditemukan', auth: false }
];

// ============================================
// ROUTER INITIALIZATION
// ============================================
const router = new Router();

// Register routes
router.register(routes);

// Set layouts
router.registerLayout('default', 'core/app-shell');
router.registerLayout('auth', 'core/auth-shell');
router.registerLayout('public', 'core/public-shell');

// Set error component
router.setErrorComponent('error/error-boundary');

// Set loading component
router.setLoadingComponent('ui/spinner');

// ============================================
// BEFORE HOOKS
// ============================================
router.beforeEach(async (route, params, query) => {
  // Check maintenance mode
  if (typeof store !== 'undefined') {
    const maintenance = store.getState('app.maintenance');
    if (maintenance && route.path !== '/maintenance') {
      return '/maintenance';
    }
  }
  
  // Check if app is initialized
  if (typeof store !== 'undefined') {
    const initialized = store.getState('app.initialized');
    if (!initialized && route.path !== '/setup') {
      await store.init();
    }
  }
  
  // Refresh CSRF token for POST operations
  if (route.path.includes('create') || route.path.includes('edit') || route.path.includes('delete')) {
    if (typeof api !== 'undefined') {
      await api.getCsrfToken();
    }
  }
  
  // Check offline mode
  if (!navigator.onLine && APP_CONFIG.FEATURES.OFFLINE_MODE) {
    // Allow cached routes in offline mode
    const offlineRoutes = ['/', '/dashboard', '/surat-masuk', '/surat-keluar', '/disposisi'];
    if (!offlineRoutes.includes(route.path)) {
      return '/offline';
    }
  }
  
  // Log route access to audit (encoded)
  if (AuthService.isAuthenticated() && route.auth !== false) {
    try {
      const auditPayload = Base64Util.encodeObject({
        action: 'page_access',
        path: route.path,
        userId: AuthService.getUserId(),
        timestamp: Date.now()
      });
      
      // Send asynchronously (fire and forget)
      fetch(`${APP_CONFIG.API.BASE_URL}?data=${auditPayload}`).catch(() => {});
    } catch (e) {
      // Silent fail
    }
  }
  
  return true;
});

// ============================================
// AFTER HOOKS
// ============================================
router.afterEach(async (route) => {
  // Update sidebar active state
  const sidebar = document.querySelector('sidebar-component');
  if (sidebar) {
    sidebar.setActive(route.path);
  }
  
  // Close mobile sidebar
  if (typeof store !== 'undefined' && window.innerWidth < APP_CONFIG.UI.SIDEBAR.MOBILE_BREAKPOINT) {
    store.dispatch('app.sidebarCollapsed', true);
  }
  
  // Load notifications
  if (AuthService.isAuthenticated()) {
    if (typeof NotificationService !== 'undefined') {
      NotificationService.loadNotifications();
    }
  }
  
  // Update online status indicator
  const onlineIndicator = document.querySelector('.online-status');
  if (onlineIndicator) {
    onlineIndicator.classList.toggle('online', navigator.onLine);
    onlineIndicator.classList.toggle('offline', !navigator.onLine);
  }
});

// ============================================
// OFFLINE/ONLINE HANDLERS
// ============================================
window.addEventListener('online', () => {
  console.log('✅ Back online');
  router.reload();
  
  // Show toast notification
  if (typeof ToastService !== 'undefined') {
    ToastService.show('Koneksi internet kembali tersedia', 'success');
  }
});

window.addEventListener('offline', () => {
  console.warn('⚠️ Offline mode');
  
  // Show toast notification
  if (typeof ToastService !== 'undefined') {
    ToastService.show('Anda sedang offline. Data yang ditampilkan mungkin tidak terbaru.', 'warning');
  }
});

// ============================================
// EXPORT FOR MODULE SYSTEMS
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    Router, 
    router, 
    routes,
    SheetsMiddleware,
    RouteDataLoader
  };
}

// ============================================
// GLOBAL EXPOSURE
// ============================================
if (typeof window !== 'undefined') {
  window.Router = Router;
  window.router = router;
  window.routes = routes;
  window.SheetsMiddleware = SheetsMiddleware;
  window.RouteDataLoader = RouteDataLoader;
}
