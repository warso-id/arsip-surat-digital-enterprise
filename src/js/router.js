/**
 * ROUTER - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Hash-based router dengan lazy loading
 */

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
    
    // Set route data
    if (Object.keys(data).length > 0) {
      sessionStorage.setItem(`route_data_${path}`, JSON.stringify(data));
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
  start() {
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
    
    console.log('✅ Router started');
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
        component: this.errorComponent || 'error-404',
        layout: this.defaultLayout,
        title: '404 - Halaman Tidak Ditemukan'
      };
    }
    
    // Check auth guard
    if (matchedRoute.auth && !AuthService.isAuthenticated()) {
      this.navigate('/login', { 
        query: { redirect: path },
        replace: true 
      });
      return;
    }
    
    // Check role guard
    if (matchedRoute.roles && !matchedRoute.roles.includes(AuthService.getUserRole())) {
      this.navigate('/403', { replace: true });
      return;
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
    
    // Set current route
    this.currentRoute = {
      ...matchedRoute,
      params,
      query,
      path: hash
    };
    
    // Get route data
    const routeData = sessionStorage.getItem(`route_data_${path}`);
    if (routeData) {
      this.currentRoute.data = JSON.parse(routeData);
      sessionStorage.removeItem(`route_data_${path}`);
    }
    
    // Update state
    store.dispatch('ui.currentRoute', this.currentRoute);
    store.dispatch('ui.breadcrumbs', this.buildBreadcrumbs(this.currentRoute));
    
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
    if (APP_CONFIG.ANALYTICS.ENABLED) {
      AnalyticsService.trackPageView(path, matchedRoute.title);
    }
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
      const LayoutComponent = await this.loadComponent(this.layouts[layoutName] || this.layouts[this.defaultLayout]);
      
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
        this.renderComponent(appShell, ErrorComponent, { error });
      }
    }
  }
  
  /**
   * Load component (with lazy loading)
   */
  async loadComponent(component) {
    if (typeof component === 'function') {
      return component;
    }
    
    if (typeof component === 'string') {
      // Dynamic import
      try {
        const module = await import(`./pages/${component}.js`);
        return module.default || module;
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

// Route definitions
const routes = [
  // Auth routes
  { path: '/login', component: 'auth/login', layout: 'auth', title: 'Login', auth: false, breadcrumb: 'Login' },
  { path: '/register', component: 'auth/register', layout: 'auth', title: 'Register', auth: false },
  { path: '/forgot-password', component: 'auth/forgot-password', layout: 'auth', title: 'Lupa Password', auth: false },
  { path: '/reset-password', component: 'auth/reset-password', layout: 'auth', title: 'Reset Password', auth: false },
  { path: '/2fa', component: 'auth/two-factor', layout: 'auth', title: 'Verifikasi 2FA', auth: false },
  
  // Main routes
  { path: '/', component: 'dashboard/dashboard', title: 'Dashboard', breadcrumb: 'Dashboard' },
  { path: '/dashboard', component: 'dashboard/dashboard', title: 'Dashboard', breadcrumb: 'Dashboard' },
  { path: '/dashboard/analytics', component: 'dashboard/analytics', title: 'Analytics', breadcrumb: 'Analytics', roles: ['admin', 'kabid'] },
  { path: '/dashboard/realtime', component: 'dashboard/realtime', title: 'Real-time', breadcrumb: 'Real-time', roles: ['admin'] },
  
  // Surat Masuk routes
  { path: '/surat-masuk', component: 'surat-masuk/list', title: 'Surat Masuk', breadcrumb: 'Surat Masuk' },
  { path: '/surat-masuk/create', component: 'surat-masuk/create', title: 'Tambah Surat Masuk', breadcrumb: 'Tambah' },
  { path: '/surat-masuk/:id', component: 'surat-masuk/detail', title: 'Detail Surat Masuk', breadcrumb: 'Detail' },
  { path: '/surat-masuk/:id/edit', component: 'surat-masuk/edit', title: 'Edit Surat Masuk', breadcrumb: 'Edit' },
  { path: '/surat-masuk/:id/history', component: 'surat-masuk/history', title: 'Riwayat Surat', breadcrumb: 'Riwayat' },
  { path: '/surat-masuk/import', component: 'surat-masuk/import', title: 'Import Surat Masuk', breadcrumb: 'Import', roles: ['admin'] },
  
  // Surat Keluar routes
  { path: '/surat-keluar', component: 'surat-keluar/list', title: 'Surat Keluar', breadcrumb: 'Surat Keluar' },
  { path: '/surat-keluar/create', component: 'surat-keluar/create', title: 'Tambah Surat Keluar', breadcrumb: 'Tambah' },
  { path: '/surat-keluar/:id', component: 'surat-keluar/detail', title: 'Detail Surat Keluar', breadcrumb: 'Detail' },
  { path: '/surat-keluar/:id/edit', component: 'surat-keluar/edit', title: 'Edit Surat Keluar', breadcrumb: 'Edit' },
  { path: '/surat-keluar/agenda', component: 'surat-keluar/agenda', title: 'Agenda Surat', breadcrumb: 'Agenda' },
  
  // Disposisi routes
  { path: '/disposisi', component: 'disposisi/list', title: 'Disposisi', breadcrumb: 'Disposisi' },
  { path: '/disposisi/create', component: 'disposisi/create', title: 'Buat Disposisi', breadcrumb: 'Buat' },
  { path: '/disposisi/:id', component: 'disposisi/detail', title: 'Detail Disposisi', breadcrumb: 'Detail' },
  { path: '/disposisi/kalender', component: 'disposisi/kalender', title: 'Kalender Disposisi', breadcrumb: 'Kalender' },
  { path: '/disposisi/laporan', component: 'disposisi/report', title: 'Laporan Disposisi', breadcrumb: 'Laporan', roles: ['admin', 'kabid'] },
  
  // Approval routes
  { path: '/approval', component: 'approval/list', title: 'Approval', breadcrumb: 'Approval' },
  { path: '/approval/:id', component: 'approval/process', title: 'Proses Approval', breadcrumb: 'Proses' },
  
  // Users routes
  { path: '/users', component: 'users/list', title: 'Pengguna', breadcrumb: 'Pengguna', roles: ['admin'] },
  { path: '/users/create', component: 'users/create', title: 'Tambah Pengguna', breadcrumb: 'Tambah', roles: ['admin'] },
  { path: '/users/:id/edit', component: 'users/edit', title: 'Edit Pengguna', breadcrumb: 'Edit', roles: ['admin'] },
  { path: '/profile', component: 'users/profile', title: 'Profil Saya', breadcrumb: 'Profil' },
  
  // Reports routes
  { path: '/reports', component: 'reports/comprehensive', title: 'Laporan', breadcrumb: 'Laporan', roles: ['admin', 'kabid'] },
  { path: '/reports/surat-masuk', component: 'reports/surat-masuk', title: 'Laporan Surat Masuk', breadcrumb: 'Surat Masuk', roles: ['admin', 'kabid'] },
  { path: '/reports/surat-keluar', component: 'reports/surat-keluar', title: 'Laporan Surat Keluar', breadcrumb: 'Surat Keluar', roles: ['admin', 'kabid'] },
  
  // Search routes
  { path: '/search', component: 'search/global', title: 'Pencarian', breadcrumb: 'Pencarian' },
  { path: '/search/advanced', component: 'search/advanced', title: 'Pencarian Lanjutan', breadcrumb: 'Lanjutan' },
  
  // Settings routes
  { path: '/settings', component: 'settings/general', title: 'Pengaturan', breadcrumb: 'Pengaturan', roles: ['admin'] },
  { path: '/settings/security', component: 'settings/security', title: 'Keamanan', breadcrumb: 'Keamanan', roles: ['admin'] },
  { path: '/settings/notifications', component: 'settings/notifications', title: 'Notifikasi', breadcrumb: 'Notifikasi', roles: ['admin'] },
  { path: '/settings/api-keys', component: 'settings/api-keys', title: 'API Keys', breadcrumb: 'API Keys', roles: ['admin'] },
  { path: '/settings/webhooks', component: 'settings/webhooks', title: 'Webhooks', breadcrumb: 'Webhooks', roles: ['admin'] },
  { path: '/settings/backup', component: 'settings/backup', title: 'Backup', breadcrumb: 'Backup', roles: ['admin'] },
  
  // Files routes
  { path: '/files', component: 'files/manager', title: 'File Manager', breadcrumb: 'Files', roles: ['admin'] },
  
  // Audit Log routes
  { path: '/audit-log', component: 'audit-log/list', title: 'Audit Log', breadcrumb: 'Audit Log', roles: ['admin'] },
  
  // Blockchain routes
  { path: '/blockchain', component: 'blockchain/explorer', title: 'Blockchain', breadcrumb: 'Blockchain', roles: ['admin'] },
  { path: '/blockchain/verify', component: 'blockchain/verify', title: 'Verifikasi Dokumen', breadcrumb: 'Verifikasi' },
  
  // Error routes
  { path: '/403', component: 'error/403', layout: 'auth', title: '403 - Akses Ditolak', auth: false },
  { path: '*', component: 'error/404', layout: 'auth', title: '404 - Halaman Tidak Ditemukan', auth: false }
];

// Singleton instance
const router = new Router();

// Register routes
router.register(routes);

// Set layouts
router.registerLayout('default', 'core/app-shell');
router.registerLayout('auth', 'core/auth-shell');

// Set error component
router.setErrorComponent('error/error-boundary');

// Set loading component
router.setLoadingComponent('ui/spinner');

// Before hooks
router.beforeEach(async (route, params, query) => {
  // Check maintenance mode
  const maintenance = store.getState('app.maintenance');
  if (maintenance && route.path !== '/maintenance') {
    return '/maintenance';
  }
  
  // Check if app is initialized
  const initialized = store.getState('app.initialized');
  if (!initialized && route.path !== '/setup') {
    await store.init();
  }
  
  // Refresh CSRF token for POST operations
  if (route.path.includes('create') || route.path.includes('edit')) {
    await api.getCsrfToken();
  }
  
  return true;
});

// After hooks
router.afterEach(async (route) => {
  // Update sidebar active state
  const sidebar = document.querySelector('sidebar-component');
  if (sidebar) {
    sidebar.setActive(route.path);
  }
  
  // Close mobile sidebar
  const sidebarCollapsed = store.getState('app.sidebarCollapsed');
  if (window.innerWidth < APP_CONFIG.UI.SIDEBAR.MOBILE_BREAKPOINT) {
    store.dispatch('app.sidebarCollapsed', true);
  }
  
  // Load notifications
  if (AuthService.isAuthenticated()) {
    NotificationService.loadNotifications();
  }
});

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Router, router, routes };
}
