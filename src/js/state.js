/**
 * STATE MANAGEMENT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Simple reactive state management dengan Observer pattern
 */

class StateManager {
  constructor() {
    this.state = {};
    this.listeners = {};
    this.middlewares = [];
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50;
    this.debounceTimers = {};
  }
  
  /**
   * Initialize state
   */
  init(initialState = {}) {
    this.state = {
      // App State
      app: {
        loading: true,
        initialized: false,
        online: navigator.onLine,
        theme: localStorage.getItem(APP_CONFIG.UI.THEME.STORAGE_KEY) || APP_CONFIG.UI.THEME.DEFAULT,
        sidebarCollapsed: localStorage.getItem(APP_CONFIG.UI.SIDEBAR.COLLAPSED_KEY) === 'true',
        language: localStorage.getItem('asd_language') || 'id',
        maintenance: false,
        version: APP_CONFIG.APP_VERSION
      },
      
      // Auth State
      auth: {
        isAuthenticated: false,
        user: null,
        token: null,
        csrf: null,
        permissions: {},
        loginAttempts: 0,
        lastActivity: null
      },
      
      // UI State
      ui: {
        modals: {},
        toasts: [],
        loading: {},
        errors: {},
        confirmDialog: null,
        currentRoute: null,
        breadcrumbs: [],
        fullscreen: false
      },
      
      // Data State
      data: {
        dashboard: {
          stats: null,
          chart: null,
          insights: null,
          realtime: null,
          lastUpdated: null
        },
        suratMasuk: {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          filters: {},
          selectedItem: null,
          lastUpdated: null
        },
        suratKeluar: {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          filters: {},
          selectedItem: null,
          lastUpdated: null
        },
        disposisi: {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          filters: {},
          selectedItem: null,
          lastUpdated: null
        },
        users: {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          filters: {},
          selectedItem: null
        },
        notifications: {
          items: [],
          unreadCount: 0,
          lastUpdated: null
        },
        search: {
          query: '',
          results: [],
          advanced: {}
        }
      },
      
      // Form State
      forms: {},
      
      // Cache State
      cache: {
        keys: [],
        size: 0
      },
      
      ...initialState
    };
    
    this.initialized = true;
    this.dispatch('app', { loading: false, initialized: true });
    
    // Setup online/offline detection
    this.setupNetworkDetection();
    
    // Setup auto-save
    this.setupAutoSave();
    
    // Setup activity tracking
    this.setupActivityTracking();
    
    return this;
  }
  
  /**
   * Get state
   */
  getState(path = null) {
    if (!path) return this.state;
    
    return path.split('.').reduce((obj, key) => {
      return obj && obj[key] !== undefined ? obj[key] : undefined;
    }, this.state);
  }
  
  /**
   * Set state (dispatch)
   */
  dispatch(path, value) {
    if (typeof path === 'object') {
      // Multiple dispatches
      Object.entries(path).forEach(([key, val]) => {
        this.dispatch(key, val);
      });
      return;
    }
    
    // Deep set
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.state;
    
    for (const key of keys) {
      if (!target[key]) target[key] = {};
      target = target[key];
    }
    
    const oldValue = target[lastKey];
    
    // Don't update if value is the same
    if (JSON.stringify(oldValue) === JSON.stringify(value)) return;
    
    target[lastKey] = value;
    
    // Save to history
    this.addToHistory(path, oldValue, value);
    
    // Run middlewares
    this.runMiddlewares(path, value, oldValue);
    
    // Notify listeners
    this.notifyListeners(path, value, oldValue);
    
    // Auto-save if needed
    this.autoSave(path, value);
  }
  
  /**
   * Subscribe to state changes
   */
  subscribe(path, callback) {
    if (!this.listeners[path]) {
      this.listeners[path] = [];
    }
    this.listeners[path].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners[path] = this.listeners[path].filter(cb => cb !== callback);
    };
  }
  
  /**
   * Subscribe with immediate callback
   */
  subscribeWithCurrent(path, callback) {
    const unsubscribe = this.subscribe(path, callback);
    const currentValue = this.getState(path);
    callback(currentValue);
    return unsubscribe;
  }
  
  /**
   * Notify listeners
   */
  notifyListeners(path, newValue, oldValue) {
    // Notify exact path listeners
    if (this.listeners[path]) {
      this.listeners[path].forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error(`Error in listener for ${path}:`, error);
        }
      });
    }
    
    // Notify parent path listeners (bubbling)
    const parts = path.split('.');
    while (parts.length > 1) {
      parts.pop();
      const parentPath = parts.join('.');
      if (this.listeners[parentPath]) {
        const parentValue = this.getState(parentPath);
        this.listeners[parentPath].forEach(callback => {
          try {
            callback(parentValue);
          } catch (error) {
            console.error(`Error in listener for ${parentPath}:`, error);
          }
        });
      }
    }
    
    // Notify wildcard listeners
    if (this.listeners['*']) {
      this.listeners['*'].forEach(callback => {
        try {
          callback({ path, newValue, oldValue });
        } catch (error) {
          console.error('Error in wildcard listener:', error);
        }
      });
    }
  }
  
  /**
   * Add middleware
   */
  addMiddleware(middleware) {
    this.middlewares.push(middleware);
  }
  
  /**
   * Run middlewares
   */
  runMiddlewares(path, newValue, oldValue) {
    this.middlewares.forEach(middleware => {
      try {
        middleware(path, newValue, oldValue, this.state);
      } catch (error) {
        console.error('Error in middleware:', error);
      }
    });
  }
  
  /**
   * Add to history (undo/redo)
   */
  addToHistory(path, oldValue, newValue) {
    // Clear future history if we're in the middle
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    this.history.push({
      path,
      oldValue,
      newValue,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    
    this.historyIndex = this.history.length - 1;
  }
  
  /**
   * Undo
   */
  undo() {
    if (this.historyIndex > 0) {
      const action = this.history[this.historyIndex];
      this.historyIndex--;
      this.dispatch(action.path, action.oldValue);
      return true;
    }
    return false;
  }
  
  /**
   * Redo
   */
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const action = this.history[this.historyIndex];
      this.dispatch(action.path, action.newValue);
      return true;
    }
    return false;
  }
  
  /**
   * Reset state
   */
  reset(path = null) {
    if (path) {
      const defaultValue = this.getDefaultValue(path);
      this.dispatch(path, defaultValue);
    } else {
      this.state = {};
      this.init();
    }
  }
  
  /**
   * Get default value for path
   */
  getDefaultValue(path) {
    const defaults = {
      'app': { loading: false, initialized: true, online: true, theme: 'light', sidebarCollapsed: false, language: 'id' },
      'auth': { isAuthenticated: false, user: null, token: null, csrf: null, permissions: {}, loginAttempts: 0 },
      'ui': { modals: {}, toasts: [], loading: {}, errors: {}, confirmDialog: null },
      'data.dashboard': { stats: null, chart: null, insights: null, realtime: null },
      'data.suratMasuk': { items: [], total: 0, page: 1, limit: 20, filters: {}, selectedItem: null },
      'data.suratKeluar': { items: [], total: 0, page: 1, limit: 20, filters: {}, selectedItem: null },
      'data.disposisi': { items: [], total: 0, page: 1, limit: 20, filters: {}, selectedItem: null },
      'data.users': { items: [], total: 0, page: 1, limit: 20, filters: {}, selectedItem: null },
      'data.notifications': { items: [], unreadCount: 0 },
      'data.search': { query: '', results: [], advanced: {} }
    };
    
    return defaults[path] || null;
  }
  
  /**
   * Setup network detection
   */
  setupNetworkDetection() {
    window.addEventListener('online', () => {
      this.dispatch('app.online', true);
      // Trigger sync when back online
      SyncService.sync();
    });
    
    window.addEventListener('offline', () => {
      this.dispatch('app.online', false);
    });
  }
  
  /**
   * Setup auto-save for forms
   */
  setupAutoSave() {
    this.subscribe('forms.*', ({ path, newValue }) => {
      // Debounce auto-save
      if (this.debounceTimers[path]) {
        clearTimeout(this.debounceTimers[path]);
      }
      
      this.debounceTimers[path] = setTimeout(() => {
        localStorage.setItem(`asd_form_${path}`, JSON.stringify(newValue));
      }, 1000);
    });
  }
  
  /**
   * Auto-save specific state
   */
  autoSave(path, value) {
    const autoSavePaths = {
      'app.theme': APP_CONFIG.UI.THEME.STORAGE_KEY,
      'app.sidebarCollapsed': APP_CONFIG.UI.SIDEBAR.COLLAPSED_KEY,
      'app.language': 'asd_language'
    };
    
    if (autoSavePaths[path]) {
      localStorage.setItem(autoSavePaths[path], value);
    }
  }
  
  /**
   * Setup activity tracking
   */
  setupActivityTracking() {
    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    let timeout;
    
    const updateActivity = () => {
      this.dispatch('auth.lastActivity', Date.now());
      
      // Check session timeout
      const lastActivity = this.getState('auth.lastActivity');
      const sessionTimeout = APP_CONFIG.AUTH.SESSION_TIMEOUT;
      
      if (lastActivity && (Date.now() - lastActivity) > sessionTimeout) {
        AuthService.logout();
        Router.navigate('/login');
      }
      
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Session about to expire, refresh token
        const refreshBefore = APP_CONFIG.AUTH.REFRESH_BEFORE;
        if (lastActivity && (Date.now() - lastActivity) > (sessionTimeout - refreshBefore)) {
          this.refreshToken();
        }
      }, sessionTimeout - APP_CONFIG.AUTH.REFRESH_BEFORE);
    };
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
  }
  
  /**
   * Refresh token
   */
  async refreshToken() {
    try {
      const response = await api.getMe();
      if (response.data && response.data.token) {
        AuthService.setToken(response.data.token);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  }
  
  /**
   * Computed values
   */
  computed(path, deps, computeFn) {
    const update = () => {
      const values = deps.map(dep => this.getState(dep));
      const result = computeFn(...values);
      this.dispatch(path, result);
    };
    
    deps.forEach(dep => this.subscribe(dep, update));
    update(); // Initial computation
    
    return () => this.getState(path);
  }
}

// Singleton instance
const store = new StateManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StateManager, store };
}
