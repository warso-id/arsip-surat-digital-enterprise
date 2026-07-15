/**
 * STATE MANAGEMENT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * File: src/js/state.js
 * Support: Google Apps Script (code.gs) + Google Sheets + Frontend
 * Encoding: Base64 untuk komunikasi data dan persistence
 * Simple reactive state management dengan Observer pattern
 */

// ============================================
// SHEETS SYNC ENGINE
// ============================================
const SheetsSyncEngine = {
  syncQueue: [],
  isSyncing: false,
  syncInterval: null,
  
  /**
   * Add to sync queue
   */
  addToQueue(action, sheetName, data) {
    const queueItem = {
      id: Date.now() + Math.random(),
      action,
      sheetName,
      data: Base64Util.encodeObject(data),
      timestamp: Date.now(),
      retryCount: 0
    };
    
    this.syncQueue.push(queueItem);
    this.saveQueue();
    
    // Try to sync immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }
    
    return queueItem.id;
  },
  
  /**
   * Process sync queue
   */
  async processQueue() {
    if (this.isSyncing || this.syncQueue.length === 0) return;
    
    this.isSyncing = true;
    const item = this.syncQueue[0];
    
    try {
      const payload = Base64Util.encodeObject({
        action: item.action,
        sheet: item.sheetName,
        data: item.data,
        timestamp: Date.now(),
        syncId: item.id
      });
      
      const response = await fetch(`${APP_CONFIG.API.BASE_URL}?data=${payload}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result && result.payload) {
          const decoded = Base64Util.decodeObject(result.payload);
          if (decoded?.success) {
            // Remove from queue on success
            this.syncQueue.shift();
            this.saveQueue();
            
            // Notify success
            if (typeof store !== 'undefined') {
              store.dispatch('sync.lastSync', Date.now());
              store.dispatch('sync.pending', this.syncQueue.length);
            }
          } else {
            throw new Error(decoded?.error || 'Sync failed');
          }
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      item.retryCount++;
      
      if (item.retryCount >= APP_CONFIG.API.RETRY_COUNT) {
        // Move failed item to failed queue
        this.syncQueue.shift();
        const failedQueue = JSON.parse(localStorage.getItem('asd_sync_failed') || '[]');
        failedQueue.push(item);
        localStorage.setItem('asd_sync_failed', JSON.stringify(failedQueue));
      } else {
        // Move to end of queue for retry
        this.syncQueue.shift();
        this.syncQueue.push(item);
      }
      
      this.saveQueue();
    }
    
    this.isSyncing = false;
    
    // Process next item
    if (this.syncQueue.length > 0) {
      setTimeout(() => this.processQueue(), 1000);
    }
  },
  
  /**
   * Save queue to localStorage
   */
  saveQueue() {
    try {
      const encoded = Base64Util.encodeObject(this.syncQueue);
      localStorage.setItem('asd_sync_queue', encoded);
    } catch (e) {
      console.error('Failed to save sync queue:', e);
    }
  },
  
  /**
   * Load queue from localStorage
   */
  loadQueue() {
    try {
      const encoded = localStorage.getItem('asd_sync_queue');
      if (encoded) {
        this.syncQueue = Base64Util.decodeObject(encoded) || [];
      }
      
      const failedEncoded = localStorage.getItem('asd_sync_failed');
      if (failedEncoded) {
        const failedItems = JSON.parse(failedEncoded);
        this.syncQueue = [...this.syncQueue, ...failedItems];
        localStorage.removeItem('asd_sync_failed');
      }
    } catch (e) {
      console.error('Failed to load sync queue:', e);
      this.syncQueue = [];
    }
  },
  
  /**
   * Start periodic sync
   */
  startPeriodicSync(intervalMs = 30000) {
    this.stopPeriodicSync();
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && this.syncQueue.length > 0) {
        this.processQueue();
      }
    }, intervalMs);
  },
  
  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  },
  
  /**
   * Get pending sync count
   */
  getPendingCount() {
    return this.syncQueue.length;
  },
  
  /**
   * Clear sync queue
   */
  clearQueue() {
    this.syncQueue = [];
    localStorage.removeItem('asd_sync_queue');
    localStorage.removeItem('asd_sync_failed');
  }
};

// ============================================
// SHEETS DATA PERSISTENCE
// ============================================
const SheetsDataPersistence = {
  /**
   * Save state snapshot to localStorage (Base64 encoded)
   */
  saveSnapshot(state) {
    try {
      const snapshot = {
        timestamp: Date.now(),
        version: APP_CONFIG.APP_VERSION,
        data: {
          auth: state.auth,
          app: state.app,
          ui: {
            theme: state.app.theme,
            sidebarCollapsed: state.app.sidebarCollapsed,
            language: state.app.language
          }
        }
      };
      
      const encoded = Base64Util.encodeObject(snapshot);
      localStorage.setItem('asd_state_snapshot', encoded);
    } catch (e) {
      console.error('Failed to save state snapshot:', e);
    }
  },
  
  /**
   * Load state snapshot from localStorage
   */
  loadSnapshot() {
    try {
      const encoded = localStorage.getItem('asd_state_snapshot');
      if (encoded) {
        const snapshot = Base64Util.decodeObject(encoded);
        if (snapshot && snapshot.version === APP_CONFIG.APP_VERSION) {
          // Check if snapshot is not too old (max 24 hours)
          if (Date.now() - snapshot.timestamp < 86400000) {
            return snapshot.data;
          }
        }
      }
    } catch (e) {
      console.error('Failed to load state snapshot:', e);
    }
    return null;
  },
  
  /**
   * Save data cache to IndexedDB
   */
  async saveDataCache(key, data) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['dataCache'], 'readwrite');
      const store = transaction.objectStore('dataCache');
      
      const cacheEntry = {
        key,
        data: Base64Util.encodeObject(data),
        timestamp: Date.now(),
        ttl: APP_CONFIG.CACHE.TTL
      };
      
      store.put(cacheEntry);
      
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (e) {
      console.error('Failed to save data cache:', e);
      return false;
    }
  },
  
  /**
   * Load data cache from IndexedDB
   */
  async loadDataCache(key) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['dataCache'], 'readonly');
      const store = transaction.objectStore('dataCache');
      
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => {
          const entry = request.result;
          if (entry && (Date.now() - entry.timestamp) < entry.ttl * 1000) {
            resolve(Base64Util.decodeObject(entry.data));
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('Failed to load data cache:', e);
      return null;
    }
  },
  
  /**
   * Open IndexedDB
   */
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ASD_StateDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('dataCache')) {
          db.createObjectStore('dataCache', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('formDrafts')) {
          db.createObjectStore('formDrafts', { keyPath: 'formId' });
        }
        if (!db.objectStoreNames.contains('offlineChanges')) {
          db.createObjectStore('offlineChanges', { keyPath: 'id', autoIncrement: true });
        }
      };
      
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }
};

// ============================================
// STATE MANAGER CLASS
// ============================================
class StateManager {
  constructor() {
    this.state = {};
    this.listeners = {};
    this.middlewares = [];
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50;
    this.debounceTimers = {};
    this.persistenceInterval = null;
  }
  
  /**
   * Initialize state
   */
  async init(initialState = {}) {
    // Load saved snapshot first
    const snapshot = SheetsDataPersistence.loadSnapshot();
    
    // Load sync queue
    SheetsSyncEngine.loadQueue();
    
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
        lastActivity: null,
        sessionExpiry: null
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
        fullscreen: false,
        searchOpen: false
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
          sort: { field: 'tanggal_diterima', order: 'desc' },
          selectedItem: null,
          selectedItems: [],
          lastUpdated: null
        },
        suratKeluar: {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          filters: {},
          sort: { field: 'tanggal_surat', order: 'desc' },
          selectedItem: null,
          selectedItems: [],
          lastUpdated: null
        },
        disposisi: {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          filters: {},
          sort: { field: 'created_at', order: 'desc' },
          selectedItem: null,
          selectedItems: [],
          lastUpdated: null
        },
        approval: {
          items: [],
          total: 0,
          pendingCount: 0,
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
          advanced: {},
          recentSearches: JSON.parse(localStorage.getItem('asd_recent_searches') || '[]')
        },
        masterData: {
          klasifikasi: [],
          sifatSurat: [],
          statusSurat: [],
          lastUpdated: null
        },
        auditLog: {
          items: [],
          total: 0,
          filters: {}
        },
        blockchain: {
          chain: [],
          stats: null
        },
        files: {
          items: [],
          total: 0
        }
      },
      
      // Form State
      forms: {},
      
      // Sync State
      sync: {
        pending: SheetsSyncEngine.getPendingCount(),
        lastSync: null,
        isSyncing: false,
        errors: []
      },
      
      // Cache State
      cache: {
        keys: [],
        size: 0
      },
      
      // Restore snapshot if available
      ...(snapshot || {}),
      
      ...initialState
    };
    
    this.initialized = true;
    this.dispatch('app', { loading: false, initialized: true });
    
    // Setup network detection
    this.setupNetworkDetection();
    
    // Setup auto-save
    this.setupAutoSave();
    
    // Setup activity tracking
    this.setupActivityTracking();
    
    // Setup periodic persistence
    this.setupPeriodicPersistence();
    
    // Start sync engine
    SheetsSyncEngine.startPeriodicSync();
    
    // Restore auth from token
    await this.restoreAuth();
    
    // Load master data
    await this.loadMasterData();
    
    console.log('✅ State manager initialized');
    
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
    
    // Sync with sheets if needed
    this.syncWithSheets(path, value, oldValue);
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
    
    // Save to localStorage
    try {
      const recentHistory = this.history.slice(-10);
      localStorage.setItem('asd_state_history', Base64Util.encodeObject(recentHistory));
    } catch (e) {
      // Silent fail
    }
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
      'data.suratMasuk': { items: [], total: 0, page: 1, limit: 20, filters: {}, selectedItem: null, selectedItems: [] },
      'data.suratKeluar': { items: [], total: 0, page: 1, limit: 20, filters: {}, selectedItem: null, selectedItems: [] },
      'data.disposisi': { items: [], total: 0, page: 1, limit: 20, filters: {}, selectedItem: null, selectedItems: [] },
      'data.approval': { items: [], total: 0, pendingCount: 0 },
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
      // Process sync queue when back online
      SheetsSyncEngine.processQueue();
      // Reload data that may be stale
      this.refreshStaleData();
    });
    
    window.addEventListener('offline', () => {
      this.dispatch('app.online', false);
    });
  }
  
  /**
   * Refresh stale data
   */
  async refreshStaleData() {
    const now = Date.now();
    const maxStale = 5 * 60 * 1000; // 5 minutes
    
    const dataPaths = [
      'data.dashboard',
      'data.suratMasuk',
      'data.suratKeluar',
      'data.disposisi',
      'data.notifications'
    ];
    
    for (const path of dataPaths) {
      const data = this.getState(path);
      if (data && data.lastUpdated && (now - data.lastUpdated) > maxStale) {
        // Trigger reload for this data
        if (typeof RouteDataLoader !== 'undefined') {
          const currentRoute = this.getState('ui.currentRoute');
          if (currentRoute) {
            RouteDataLoader.load(currentRoute, currentRoute.params || {}, currentRoute.query || {})
              .then(newData => {
                if (newData) {
                  // Update based on path
                  const key = path.split('.').pop();
                  if (key === 'dashboard') {
                    this.dispatch('data.dashboard', { ...data, ...newData, lastUpdated: now });
                  }
                }
              })
              .catch(console.error);
          }
        }
      }
    }
  }
  
  /**
   * Setup auto-save for forms
   */
  setupAutoSave() {
    this.subscribe('forms', ({ path, newValue }) => {
      if (path && path.startsWith('forms.')) {
        // Debounce auto-save
        const formKey = path.replace('forms.', '');
        if (this.debounceTimers[formKey]) {
          clearTimeout(this.debounceTimers[formKey]);
        }
        
        this.debounceTimers[formKey] = setTimeout(async () => {
          try {
            // Save form draft to IndexedDB
            const db = await SheetsDataPersistence.openDB();
            const transaction = db.transaction(['formDrafts'], 'readwrite');
            const store = transaction.objectStore('formDrafts');
            store.put({
              formId: formKey,
              data: Base64Util.encodeObject(newValue),
              savedAt: Date.now()
            });
          } catch (e) {
            console.error('Failed to save form draft:', e);
            // Fallback to localStorage
            localStorage.setItem(`asd_form_${formKey}`, Base64Util.encodeObject(newValue));
          }
        }, 1000);
      }
    });
  }
  
  /**
   * Load form draft
   */
  async loadFormDraft(formId) {
    try {
      const db = await SheetsDataPersistence.openDB();
      const transaction = db.transaction(['formDrafts'], 'readonly');
      const store = transaction.objectStore('formDrafts');
      
      return new Promise((resolve) => {
        const request = store.get(formId);
        request.onsuccess = () => {
          const entry = request.result;
          if (entry) {
            resolve(Base64Util.decodeObject(entry.data));
          } else {
            // Try localStorage fallback
            const localData = localStorage.getItem(`asd_form_${formId}`);
            resolve(localData ? Base64Util.decodeObject(localData) : null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch (e) {
      const localData = localStorage.getItem(`asd_form_${formId}`);
      return localData ? Base64Util.decodeObject(localData) : null;
    }
  }
  
  /**
   * Clear form draft
   */
  async clearFormDraft(formId) {
    try {
      const db = await SheetsDataPersistence.openDB();
      const transaction = db.transaction(['formDrafts'], 'readwrite');
      const store = transaction.objectStore('formDrafts');
      store.delete(formId);
      localStorage.removeItem(`asd_form_${formId}`);
    } catch (e) {
      localStorage.removeItem(`asd_form_${formId}`);
    }
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
   * Sync with Google Sheets
   */
  syncWithSheets(path, value, oldValue) {
    const syncPaths = {
      'data.suratMasuk.selectedItem': async (val) => {
        if (val) {
          await SheetsDataPersistence.saveDataCache('suratMasuk_selected', val);
        }
      },
      'data.suratKeluar.selectedItem': async (val) => {
        if (val) {
          await SheetsDataPersistence.saveDataCache('suratKeluar_selected', val);
        }
      },
      'data.disposisi.selectedItem': async (val) => {
        if (val) {
          await SheetsDataPersistence.saveDataCache('disposisi_selected', val);
        }
      }
    };
    
    if (syncPaths[path]) {
      syncPaths[path](value);
    }
    
    // Queue data changes for sync
    if (path.startsWith('data.') && !path.includes('selectedItem')) {
      const sheetMap = {
        'data.suratMasuk': 'SuratMasuk',
        'data.suratKeluar': 'SuratKeluar',
        'data.disposisi': 'Disposisi',
        'data.approval': 'Approval'
      };
      
      for (const [dataPath, sheetName] of Object.entries(sheetMap)) {
        if (path.startsWith(dataPath) && path.includes('items')) {
          // Queue the change for later sync
          SheetsSyncEngine.addToQueue('update', sheetName, {
            path,
            value,
            oldValue,
            timestamp: Date.now()
          });
          break;
        }
      }
    }
  }
  
  /**
   * Setup activity tracking
   */
  setupActivityTracking() {
    const events = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart'];
    let timeout;
    
    const updateActivity = () => {
      this.dispatch('auth.lastActivity', Date.now());
      
      // Check session timeout
      const lastActivity = this.getState('auth.lastActivity');
      const sessionTimeout = APP_CONFIG.AUTH.SESSION_TIMEOUT;
      
      if (lastActivity && (Date.now() - lastActivity) > sessionTimeout) {
        if (typeof AuthService !== 'undefined') {
          AuthService.logout();
        }
        if (typeof router !== 'undefined') {
          router.navigate('/login');
        }
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
    
    // Initial activity
    updateActivity();
  }
  
  /**
   * Refresh token
   */
  async refreshToken() {
    try {
      if (typeof api !== 'undefined') {
        const response = await api.getMe();
        if (response && response.data && response.data.token) {
          if (typeof AuthService !== 'undefined') {
            AuthService.setToken(response.data.token);
          }
          this.dispatch('auth.sessionExpiry', Date.now() + APP_CONFIG.AUTH.SESSION_TIMEOUT);
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  }
  
  /**
   * Restore auth from token
   */
  async restoreAuth() {
    try {
      if (typeof AuthService !== 'undefined') {
        const token = AuthService.getToken();
        const user = AuthService.getUser();
        
        if (token && user) {
          // Verify token is still valid
          const decodedUser = Base64Util.decodeObject(user);
          if (decodedUser) {
            this.dispatch('auth', {
              isAuthenticated: true,
              user: decodedUser,
              token,
              lastActivity: Date.now(),
              sessionExpiry: Date.now() + APP_CONFIG.AUTH.SESSION_TIMEOUT
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to restore auth:', e);
    }
  }
  
  /**
   * Load master data
   */
  async loadMasterData() {
    try {
      // Try loading from cache first
      const cachedMasterData = await SheetsDataPersistence.loadDataCache('masterData');
      if (cachedMasterData) {
        this.dispatch('data.masterData', {
          ...cachedMasterData,
          lastUpdated: cachedMasterData.lastUpdated
        });
      }
      
      // Load from sheets if online
      if (navigator.onLine && typeof SheetsMiddleware !== 'undefined') {
        const masterData = await SheetsMiddleware.loadSheetData('masterData', { type: 'all' });
        if (masterData) {
          this.dispatch('data.masterData', {
            ...masterData,
            lastUpdated: Date.now()
          });
          
          // Cache the data
          await SheetsDataPersistence.saveDataCache('masterData', masterData);
        }
      }
    } catch (e) {
      console.error('Failed to load master data:', e);
    }
  }
  
  /**
   * Setup periodic persistence
   */
  setupPeriodicPersistence() {
    // Save state snapshot every 5 minutes
    this.persistenceInterval = setInterval(() => {
      SheetsDataPersistence.saveSnapshot(this.state);
    }, 300000); // 5 minutes
    
    // Save on page unload
    window.addEventListener('beforeunload', () => {
      SheetsDataPersistence.saveSnapshot(this.state);
    });
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
  
  /**
   * Batch dispatch (multiple updates at once)
   */
  batch(updates) {
    Object.entries(updates).forEach(([path, value]) => {
      // Set directly without triggering listeners
      const keys = path.split('.');
      const lastKey = keys.pop();
      let target = this.state;
      
      for (const key of keys) {
        if (!target[key]) target[key] = {};
        target = target[key];
      }
      
      target[lastKey] = value;
    });
    
    // Notify all paths at once
    Object.keys(updates).forEach(path => {
      this.notifyListeners(path, this.getState(path), null);
    });
  }
  
  /**
   * Destroy state manager
   */
  destroy() {
    // Save final snapshot
    SheetsDataPersistence.saveSnapshot(this.state);
    
    // Clear intervals
    if (this.persistenceInterval) {
      clearInterval(this.persistenceInterval);
    }
    
    SheetsSyncEngine.stopPeriodicSync();
    
    // Clear listeners
    this.listeners = {};
    
    // Clear history
    this.history = [];
    this.historyIndex = -1;
    
    console.log('🗑️ State manager destroyed');
  }
}

// ============================================
// INITIAL MIDDLEWARES
// ============================================
const loggingMiddleware = (path, newValue, oldValue, state) => {
  if (APP_CONFIG.APP_ENV === 'development') {
    console.log(`[State] ${path}:`, { old: oldValue, new: newValue });
  }
};

const analyticsMiddleware = (path, newValue, oldValue, state) => {
  if (!APP_CONFIG.ANALYTICS.ENABLED) return;
  
  const trackedPaths = ['auth.isAuthenticated', 'ui.currentRoute', 'app.theme'];
  
  if (trackedPaths.includes(path)) {
    // Queue analytics event
    const eventData = {
      event: 'state_change',
      path,
      timestamp: Date.now()
    };
    
    // Store in queue for batch sending
    const analyticsQueue = JSON.parse(localStorage.getItem('asd_analytics_queue') || '[]');
    analyticsQueue.push(eventData);
    
    if (analyticsQueue.length >= APP_CONFIG.ANALYTICS.BATCH_SIZE) {
      // Send batch
      if (typeof AnalyticsService !== 'undefined') {
        AnalyticsService.sendBatch(analyticsQueue);
      }
      localStorage.setItem('asd_analytics_queue', '[]');
    } else {
      localStorage.setItem('asd_analytics_queue', JSON.stringify(analyticsQueue));
    }
  }
};

const securityMiddleware = (path, newValue, oldValue, state) => {
  // Monitor auth changes
  if (path === 'auth.isAuthenticated' && !newValue && oldValue) {
    // User logged out, clear sensitive data
    const sensitivePaths = [
      'data.suratMasuk',
      'data.suratKeluar',
      'data.disposisi',
      'data.users',
      'data.notifications'
    ];
    
    sensitivePaths.forEach(p => {
      const defaultValue = this.getDefaultValue(p);
      if (defaultValue) {
        this.dispatch(p, defaultValue);
      }
    });
  }
  
  // Monitor token changes
  if (path === 'auth.token' && newValue) {
    this.dispatch('auth.sessionExpiry', Date.now() + APP_CONFIG.AUTH.SESSION_TIMEOUT);
  }
};

// ============================================
// SINGLETON INSTANCE
// ============================================
const store = new StateManager();

// Add middlewares
store.addMiddleware(loggingMiddleware);
store.addMiddleware(analyticsMiddleware);
store.addMiddleware(securityMiddleware);

// ============================================
// EXPORT FOR MODULE SYSTEMS
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    StateManager, 
    store,
    SheetsSyncEngine,
    SheetsDataPersistence
  };
}

// ============================================
// GLOBAL EXPOSURE
// ============================================
if (typeof window !== 'undefined') {
  window.StateManager = StateManager;
  window.store = store;
  window.SheetsSyncEngine = SheetsSyncEngine;
  window.SheetsDataPersistence = SheetsDataPersistence;
}
