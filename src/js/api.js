/**
 * API SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Menangani semua komunikasi dengan Google Apps Script backend
 */

class ApiService {
  constructor() {
    this.baseUrl = APP_CONFIG.API.BASE_URL;
    this.timeout = APP_CONFIG.API.TIMEOUT;
    this.retryCount = APP_CONFIG.API.RETRY_COUNT;
    this.pendingRequests = new Map();
    this.requestQueue = [];
    this.rateLimiter = new RateLimiter(100, 60000); // 100 requests per menit
  }
  
  /**
   * Build URL dengan parameters
   */
  buildUrl(action, params = {}) {
    const url = new URL(this.baseUrl);
    url.searchParams.set('action', action);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });
    
    return url.toString();
  }
  
  /**
   * Get headers untuk request
   */
  getHeaders(includeAuth = true, includeCsrf = false) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-App-Version': APP_CONFIG.APP_VERSION,
      'X-Client-Id': this.getClientId()
    };
    
    if (includeAuth) {
      const token = AuthService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    if (includeCsrf) {
      const csrf = AuthService.getCsrfToken();
      if (csrf) {
        headers['X-CSRF-Token'] = csrf;
      }
    }
    
    return headers;
  }
  
  /**
   * Get client ID untuk tracking
   */
  getClientId() {
    let clientId = localStorage.getItem('asd_client_id');
    if (!clientId) {
      clientId = this.generateUUID();
      localStorage.setItem('asd_client_id', clientId);
    }
    return clientId;
  }
  
  /**
   * Generate UUID
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  /**
   * Main request method
   */
  async request(action, params = {}, options = {}) {
    const {
      method = 'GET',
      body = null,
      includeAuth = true,
      includeCsrf = false,
      retry = true,
      retries = this.retryCount,
      timeout = this.timeout,
      cacheKey = null,
      cacheTTL = APP_CONFIG.CACHE.TTL,
      skipCache = false,
      signal = null
    } = options;
    
    // Check cache first
    if (method === 'GET' && cacheKey && !skipCache) {
      const cached = await CacheService.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < cacheTTL * 1000) {
        return cached.data;
      }
    }
    
    // Check rate limiter
    if (!this.rateLimiter.allow()) {
      throw new Error('Rate limit exceeded. Silakan tunggu sebentar.');
    }
    
    // Build request
    const url = this.buildUrl(action, params);
    const headers = this.getHeaders(includeAuth, includeCsrf);
    
    const requestOptions = {
      method,
      headers,
      signal,
      mode: 'cors'
    };
    
    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }
    
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    requestOptions.signal = signal || controller.signal;
    
    try {
      const startTime = performance.now();
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);
      
      const duration = performance.now() - startTime;
      
      // Track performance
      PerformanceMonitor.trackApiCall(action, duration, response.status);
      
      // Handle response
      const data = await response.json();
      
      if (!response.ok) {
        throw new ApiError(
          data.message || 'Request failed',
          response.status,
          data.code,
          data
        );
      }
      
      // Handle token refresh
      if (data.data && data.data.token) {
        AuthService.setToken(data.data.token);
      }
      
      // Handle CSRF token
      if (data.data && data.data.csrf) {
        AuthService.setCsrfToken(data.data.csrf);
      }
      
      // Cache response
      if (method === 'GET' && cacheKey) {
        await CacheService.set(cacheKey, {
          data: data,
          timestamp: Date.now()
        });
      }
      
      return data;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle retry
      if (retry && retries > 0 && this.isRetryableError(error)) {
        await this.delay(this.getRetryDelay(retries));
        return this.request(action, params, {
          ...options,
          retries: retries - 1
        });
      }
      
      // Handle auth error
      if (error.status === 401) {
        AuthService.clearAuth();
        Router.navigate('/login');
        throw new ApiError('Session expired. Silakan login kembali.', 401);
      }
      
      throw error;
    }
  }
  
  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    if (error.name === 'AbortError') return true;
    if (error.status >= 500) return true;
    if (error.status === 429) return true;
    return false;
  }
  
  /**
   * Get retry delay
   */
  getRetryDelay(retries) {
    return Math.min(1000 * Math.pow(2, this.retryCount - retries), 30000);
  }
  
  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // ============================================
  // CONVENIENCE METHODS
  // ============================================
  
  get(action, params = {}, options = {}) {
    return this.request(action, params, { ...options, method: 'GET' });
  }
  
  post(action, body = {}, options = {}) {
    return this.request(action, {}, { ...options, method: 'POST', body, includeCsrf: true });
  }
  
  put(action, body = {}, options = {}) {
    return this.request(action, {}, { ...options, method: 'POST', body, includeCsrf: true });
  }
  
  delete(action, params = {}, options = {}) {
    return this.request(action, params, { ...options, method: 'POST', includeCsrf: true });
  }
  
  // ============================================
  // PUBLIC ENDPOINTS (NO AUTH)
  // ============================================
  
  async ping() {
    return this.get(APP_CONFIG.API.ENDPOINTS.PUBLIC.PING, {}, { includeAuth: false });
  }
  
  async checkSetup() {
    return this.get(APP_CONFIG.API.ENDPOINTS.PUBLIC.CHECK_SETUP, {}, { includeAuth: false });
  }
  
  async setup(data) {
    return this.post(APP_CONFIG.API.ENDPOINTS.PUBLIC.SETUP, data, { includeAuth: false });
  }
  
  async debugInfo() {
    return this.get(APP_CONFIG.API.ENDPOINTS.PUBLIC.DEBUG, {}, { includeAuth: false });
  }
  
  async checkUser(identifier) {
    return this.post(APP_CONFIG.API.ENDPOINTS.AUTH.CHECK_USER, { identifier }, { includeAuth: false });
  }
  
  async resetAdmin() {
    return this.get(APP_CONFIG.API.ENDPOINTS.AUTH.RESET_ADMIN, {}, { includeAuth: false });
  }
  
  // ============================================
  // AUTH ENDPOINTS
  // ============================================
  
  async login(username, password) {
    return this.post(APP_CONFIG.API.ENDPOINTS.AUTH.LOGIN, { username, password }, { includeAuth: false });
  }
  
  async register(data) {
    return this.post(APP_CONFIG.API.ENDPOINTS.AUTH.REGISTER, data, { includeAuth: false });
  }
  
  async logout() {
    return this.post(APP_CONFIG.API.ENDPOINTS.AUTH.LOGOUT);
  }
  
  async getMe() {
    return this.get(APP_CONFIG.API.ENDPOINTS.AUTH.ME);
  }
  
  async changePassword(oldPassword, newPassword) {
    return this.post(APP_CONFIG.API.ENDPOINTS.AUTH.CHANGE_PASSWORD, { oldPassword, newPassword });
  }
  
  async getCsrfToken() {
    return this.get(APP_CONFIG.API.ENDPOINTS.AUTH.CSRF);
  }
  
  // ============================================
  // DASHBOARD ENDPOINTS
  // ============================================
  
  async getDashboardStats() {
    return this.get(APP_CONFIG.API.ENDPOINTS.DASHBOARD.STATS, {}, {
      cacheKey: 'dashboard_stats',
      cacheTTL: 60
    });
  }
  
  async getDashboardChart(period = 'monthly') {
    return this.get(APP_CONFIG.API.ENDPOINTS.DASHBOARD.CHART, { period }, {
      cacheKey: `dashboard_chart_${period}`,
      cacheTTL: 300
    });
  }
  
  async getDashboardAIInsights() {
    return this.get(APP_CONFIG.API.ENDPOINTS.DASHBOARD.AI_INSIGHTS, {}, {
      cacheKey: 'dashboard_ai',
      cacheTTL: 3600
    });
  }
  
  async getDashboardRealtime() {
    return this.get(APP_CONFIG.API.ENDPOINTS.DASHBOARD.REALTIME, {}, {
      cacheKey: 'dashboard_realtime',
      cacheTTL: 10
    });
  }
  
  // ============================================
  // SURAT MASUK ENDPOINTS
  // ============================================
  
  async getSuratMasukList(params = {}) {
    const { page = 1, limit = 20, search, status, sifat, startDate, endDate, sortBy, sortOrder } = params;
    return this.get(APP_CONFIG.API.ENDPOINTS.SURAT_MASUK.LIST, {
      page, limit, search, status, sifat, startDate, endDate, sortBy, sortOrder
    });
  }
  
  async getSuratMasukDetail(id) {
    return this.get(APP_CONFIG.API.ENDPOINTS.SURAT_MASUK.DETAIL, { id }, {
      cacheKey: `sm_detail_${id}`,
      cacheTTL: 60
    });
  }
  
  async createSuratMasuk(data) {
    return this.post(APP_CONFIG.API.ENDPOINTS.SURAT_MASUK.CREATE, data);
  }
  
  async updateSuratMasuk(id, data) {
    return this.post(APP_CONFIG.API.ENDPOINTS.SURAT_MASUK.UPDATE, { ...data, id });
  }
  
  async deleteSuratMasuk(id) {
    return this.post(APP_CONFIG.API.ENDPOINTS.SURAT_MASUK.DELETE, { id });
  }
  
  async getSuratMasukStats() {
    return this.get(APP_CONFIG.API.ENDPOINTS.SURAT_MASUK.STATS, {}, {
      cacheKey: 'sm_stats',
      cacheTTL: 300
    });
  }
  
  async updateSuratMasukStatus(id, status) {
    return this.post(APP_CONFIG.API.ENDPOINTS.SURAT_MASUK.STATUS, { id, status });
  }
  
  async distribusiSuratMasuk(data) {
    return this.post(APP_CONFIG.API.ENDPOINTS.SURAT_MASUK.DISTRIBUSI, data);
  }
  
  async getSuratMasukHistory(id) {
    return this.get(APP_CONFIG.API.ENDPOINTS.SURAT_MASUK.HISTORY, { id });
  }
  
  // ============================================
  // SURAT KELUAR ENDPOINTS
  // ============================================
  
  async getSuratKeluarList(params = {}) {
    const { page = 1, limit = 20, search, status, approvalStatus, startDate, endDate } = params;
    return this.get(APP_CONFIG.API.ENDPOINTS.SURAT_KELUAR.LIST, {
      page, limit, search, status, approvalStatus, startDate, endDate
    });
  }
  
  async getSuratKeluarDetail(id) {
    return this.get(APP_CONFIG.API.ENDPOINTS.SURAT_KELUAR.DETAIL, { id }, {
      cacheKey: `sk_detail_${id}`,
      cacheTTL: 60
    });
  }
  
  async createSuratKeluar(data) {
    return this.post(APP_CONFIG.API.ENDPOINTS.SURAT_KELUAR.CREATE, data);
  }
  
  async updateSuratKeluar(id, data) {
    return this.post(APP_CONFIG.API.ENDPOINTS.SURAT_KELUAR.UPDATE, { ...data, id });
  }
  
  async deleteSuratKeluar(id) {
    return this.post(APP_CONFIG.API.ENDPOINTS.SURAT_KELUAR.DELETE, { id });
  }
  
  async submitApproval(id) {
    return this.post(APP_CONFIG.API.ENDPOINTS.SURAT_KELUAR.SUBMIT_APPROVAL, { id });
  }
  
  // ============================================
  // DISPOSISI ENDPOINTS
  // ============================================
  
  async getDisposisiList(params = {}) {
    return this.get(APP_CONFIG.API.ENDPOINTS.DISPOSISI.LIST, params);
  }
  
  async createDisposisi(data) {
    return this.post(APP_CONFIG.API.ENDPOINTS.DISPOSISI.CREATE, data);
  }
  
  async createMultipleDisposisi(data) {
    return this.post(APP_CONFIG.API.ENDPOINTS.DISPOSISI.CREATE_MULTIPLE, data);
  }
  
  async tindakLanjutDisposisi(id, data) {
    return this.post(APP_CONFIG.API.ENDPOINTS.DISPOSISI.TINDAK_LANJUT, { ...data, id });
  }
  
  async updateDisposisiStatus(id, status) {
    return this.post(APP_CONFIG.API.ENDPOINTS.DISPOSISI.UPDATE_STATUS, { id, status });
  }
  
  async eskalasiDisposisi(id, data) {
    return this.post(APP_CONFIG.API.ENDPOINTS.DISPOSISI.ESKALASI, { ...data, id });
  }
  
  // ============================================
  // USERS ENDPOINTS
  // ============================================
  
  async getUsersList(params = {}) {
    return this.get(APP_CONFIG.API.ENDPOINTS.USERS.LIST, params);
  }
  
  async createUser(data) {
    return this.post(APP_CONFIG.API.ENDPOINTS.USERS.CREATE, data);
  }
  
  async updateUser(id, data) {
    return this.post(APP_CONFIG.API.ENDPOINTS.USERS.UPDATE, { ...data, id });
  }
  
  async deleteUser(id) {
    return this.post(APP_CONFIG.API.ENDPOINTS.USERS.DELETE, { id });
  }
  
  async updateProfile(data) {
    return this.post(APP_CONFIG.API.ENDPOINTS.USERS.UPDATE_PROFILE, data);
  }
  
  // ============================================
  // SEARCH ENDPOINTS
  // ============================================
  
  async searchGlobal(query) {
    return this.get(APP_CONFIG.API.ENDPOINTS.SEARCH.GLOBAL, { q: query });
  }
  
  async searchAdvanced(params) {
    return this.get(APP_CONFIG.API.ENDPOINTS.SEARCH.ADVANCED, params);
  }
  
  // ============================================
  // NOTIFICATION ENDPOINTS
  // ============================================
  
  async getNotifications(params = {}) {
    return this.get(APP_CONFIG.API.ENDPOINTS.NOTIFIKASI.LIST, params);
  }
  
  async getUnreadCount() {
    return this.get(APP_CONFIG.API.ENDPOINTS.NOTIFIKASI.UNREAD, {}, {
      cacheKey: 'unread_count',
      cacheTTL: 30
    });
  }
  
  async markAsRead(id) {
    return this.post(APP_CONFIG.API.ENDPOINTS.NOTIFIKASI.READ, { id });
  }
  
  async markAllAsRead() {
    return this.post(APP_CONFIG.API.ENDPOINTS.NOTIFIKASI.READ_ALL);
  }
  
  // ============================================
  // FILE ENDPOINTS
  // ============================================
  
  async uploadFile(file, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('action', APP_CONFIG.API.ENDPOINTS.FILE.UPLOAD);
    
    const token = AuthService.getToken();
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (onProgress && e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new ApiError('Upload failed', xhr.status));
        }
      });
      
      xhr.addEventListener('error', () => reject(new Error('Network error')));
      
      xhr.open('POST', this.buildUrl(APP_CONFIG.API.ENDPOINTS.FILE.UPLOAD));
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  }
  
  async getFileList(params = {}) {
    return this.get(APP_CONFIG.API.ENDPOINTS.FILE.LIST, params);
  }
  
  async deleteFile(id) {
    return this.post(APP_CONFIG.API.ENDPOINTS.FILE.DELETE, { id });
  }
  
  async getFilePreview(fileId) {
    return this.get(APP_CONFIG.API.ENDPOINTS.FILE.PREVIEW, { fileId });
  }
  
  // ============================================
  // SYSTEM ENDPOINTS
  // ============================================
  
  async getSystemStatus() {
    return this.get(APP_CONFIG.API.ENDPOINTS.SYSTEM.STATUS);
  }
  
  async getSystemInfo() {
    return this.get(APP_CONFIG.API.ENDPOINTS.SYSTEM.INFO);
  }
  
  async getSystemHealth() {
    return this.get(APP_CONFIG.API.ENDPOINTS.SYSTEM.HEALTH);
  }
  
  async clearCache() {
    return this.post(APP_CONFIG.API.ENDPOINTS.SYSTEM.CACHE_CLEAR);
  }
}

// Singleton instance
const api = new ApiService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiService, api };
}
