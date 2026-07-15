/**
 * ============================================
 * API SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL API COMMUNICATION LAYER - SIAP PRODUKSI
 * Mendukung: REST, File Upload, Cache, Retry,
 * Rate Limit, Circuit Breaker, Batch, Queue
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class ApiService {
  constructor() {
    // Base configuration
    this.baseUrl = this.getConfig('API.BASE_URL', '');
    this.timeout = this.getConfig('API.TIMEOUT', 30000);
    this.retryCount = this.getConfig('API.RETRY_COUNT', 3);
    this.retryDelay = this.getConfig('API.RETRY_DELAY', 1000);

    // State tracking
    this.pendingRequests = new Map();
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.rateLimiter = new RateLimiter(
      this.getConfig('RATE_LIMIT', 100),
      60000
    );

    // Circuit breaker
    this.circuitBreaker = {
      failures: 0,
      threshold: 5,
      resetTimeout: 30000,
      lastFailure: null,
      isOpen: false
    };

    // Cache
    this.responseCache = new Map();
    this.cacheMaxSize = 100;

    // Auth refresh
    this.tokenRefreshPromise = null;
    this.tokenRefreshThreshold = 300000; // 5 minutes before expiry

    // Batch requests
    this.batchQueue = [];
    this.batchTimer = null;
    this.batchDelay = 50;
    this.maxBatchSize = 10;

    // Request deduplication
    this.dedupeMap = new Map();
    this.dedupeTTL = 2000;
  }

  /**
   * Get config value with fallback
   */
  getConfig(path, defaultValue) {
    try {
      const keys = path.split('.');
      let value = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG : null;
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
   * Build URL with parameters
   */
  buildUrl(action, params = {}) {
    const url = new URL(this.baseUrl);
    url.searchParams.set('action', action);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  }

  /**
   * Get request headers
   */
  getHeaders(includeAuth = true, includeCsrf = false, extraHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-App-Version': this.getConfig('APP_VERSION', '3.2.2'),
      'X-Client-Id': this.getClientId(),
      'X-Request-Id': this.generateUUID(),
      ...extraHeaders
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    if (includeCsrf) {
      const csrf = this.getCsrfToken();
      if (csrf) {
        headers['X-CSRF-Token'] = csrf;
      }
    }

    return headers;
  }

  /**
   * Get auth token
   */
  getAuthToken() {
    try {
      if (typeof AuthService !== 'undefined' && AuthService.getToken) {
        return AuthService.getToken();
      }
      return localStorage.getItem('asd_token') || localStorage.getItem('asd_auth_token');
    } catch {
      return null;
    }
  }

  /**
   * Get CSRF token
   */
  getCsrfToken() {
    try {
      if (typeof AuthService !== 'undefined' && AuthService.getCsrfToken) {
        return AuthService.getCsrfToken();
      }
      return localStorage.getItem('asd_csrf') || localStorage.getItem('asd_csrf_token');
    } catch {
      return null;
    }
  }

  /**
   * Get/set client ID
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
   * Generate UUID v4
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
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
      cacheTTL = 300000,
      skipCache = false,
      signal = null,
      dedupe = true,
      batch = false,
      extraHeaders = {}
    } = options;

    // Check circuit breaker
    if (this.circuitBreaker.isOpen) {
      if (Date.now() - this.circuitBreaker.lastFailure < this.circuitBreaker.resetTimeout) {
        throw new ApiError('Service temporarily unavailable', 503, 'CIRCUIT_OPEN');
      }
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.failures = 0;
    }

    // Check cache
    if (method === 'GET' && cacheKey && !skipCache) {
      const cached = this.getCachedResponse(cacheKey, cacheTTL);
      if (cached) return cached;
    }

    // Check rate limiter
    if (!this.rateLimiter.allow()) {
      throw new ApiError('Rate limit exceeded. Silakan tunggu.', 429, 'RATE_LIMITED');
    }

    // Deduplication
    if (dedupe && method === 'GET') {
      const dedupeKey = `${action}_${JSON.stringify(params)}`;
      if (this.dedupeMap.has(dedupeKey)) {
        return this.dedupeMap.get(dedupeKey);
      }
    }

    // Build request
    const url = this.buildUrl(action, params);
    const headers = this.getHeaders(includeAuth, includeCsrf, extraHeaders);

    const requestOptions = { method, headers, signal, mode: 'cors', credentials: 'omit' };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    // Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    requestOptions.signal = signal || controller.signal;

    const startTime = performance.now();

    try {
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      const duration = Math.round(performance.now() - startTime);

      // Track performance
      this.trackApiCall(action, duration, response.status);

      // Parse response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
        try { data = JSON.parse(data); } catch {}
      }

      // Handle HTTP errors
      if (!response.ok) {
        throw new ApiError(
          data?.message || `HTTP ${response.status}`,
          response.status,
          data?.code || 'HTTP_ERROR',
          data
        );
      }

      // Reset circuit breaker on success
      this.circuitBreaker.failures = 0;

      // Handle token refresh
      if (data?.data?.token) {
        this.saveAuthToken(data.data.token);
      }
      if (data?.data?.csrf) {
        this.saveCsrfToken(data.data.csrf);
      }

      // Cache successful GET response
      if (method === 'GET' && cacheKey) {
        this.setCachedResponse(cacheKey, data, cacheTTL);
      }

      // Store dedupe promise
      if (dedupe && method === 'GET') {
        const dedupeKey = `${action}_${JSON.stringify(params)}`;
        this.dedupeMap.set(dedupeKey, Promise.resolve(data));
        setTimeout(() => this.dedupeMap.delete(dedupeKey), this.dedupeTTL);
      }

      return data;

    } catch (error) {
      clearTimeout(timeoutId);

      // Track failure for circuit breaker
      this.circuitBreaker.failures++;
      this.circuitBreaker.lastFailure = Date.now();
      if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
        this.circuitBreaker.isOpen = true;
      }

      // Retry logic
      if (retry && retries > 0 && this.isRetryableError(error)) {
        await this.delay(this.getRetryDelay(retries));
        return this.request(action, params, { ...options, retries: retries - 1 });
      }

      // Auth error handling
      if (error.status === 401) {
        this.clearAuth();
        if (typeof router !== 'undefined') {
          router.navigate('/login', { query: { expired: true } });
        }
      }

      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    if (error.name === 'AbortError') return true;
    if (error.name === 'TypeError') return true; // Network error
    if (error.status >= 500 && error.status < 600) return true;
    if (error.status === 429) return true;
    if (error.code === 'CIRCUIT_OPEN') return false;
    return false;
  }

  /**
   * Calculate retry delay with jitter
   */
  getRetryDelay(retries) {
    const base = this.retryDelay * Math.pow(2, this.retryCount - retries);
    const max = 30000;
    const jitter = Math.random() * 1000;
    return Math.min(base + jitter, max);
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Track API call performance
   */
  trackApiCall(action, duration, status) {
    if (typeof PerformanceMonitor !== 'undefined' && PerformanceMonitor.trackApiCall) {
      PerformanceMonitor.trackApiCall(action, duration, status);
    }
  }

  /**
   * Save auth token
   */
  saveAuthToken(token) {
    try {
      localStorage.setItem('asd_token', token);
      localStorage.setItem('asd_auth_token', token);
      if (typeof AuthService !== 'undefined' && AuthService.setToken) {
        AuthService.setToken(token);
      }
    } catch {}
  }

  /**
   * Save CSRF token
   */
  saveCsrfToken(token) {
    try {
      localStorage.setItem('asd_csrf', token);
      localStorage.setItem('asd_csrf_token', token);
    } catch {}
  }

  /**
   * Clear auth data
   */
  clearAuth() {
    try {
      localStorage.removeItem('asd_token');
      localStorage.removeItem('asd_auth_token');
      localStorage.removeItem('asd_user');
      localStorage.removeItem('asd_auth_user');
      localStorage.removeItem('asd_csrf');
    } catch {}
  }

  /**
   * Cache helpers
   */
  getCachedResponse(key, ttl) {
    if (typeof CacheService !== 'undefined') {
      return CacheService.get(key);
    }
    const entry = this.responseCache.get(key);
    if (entry && Date.now() - entry.timestamp < ttl) {
      return entry.data;
    }
    this.responseCache.delete(key);
    return null;
  }

  setCachedResponse(key, data, ttl) {
    if (typeof CacheService !== 'undefined') {
      CacheService.set(key, data, ttl);
    }
    this.responseCache.set(key, { data, timestamp: Date.now(), ttl });
    if (this.responseCache.size > this.cacheMaxSize) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }
  }

  clearCache() {
    this.responseCache.clear();
    if (typeof CacheService !== 'undefined') CacheService.clear();
  }

  /**
   * File upload with progress
   */
  async uploadFile(file, onProgress = null, options = {}) {
    const { action = 'file.upload', extraFields = {} } = options;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('action', action);
    Object.entries(extraFields).forEach(([k, v]) => formData.append(k, v));

    const token = this.getAuthToken();
    const url = this.baseUrl;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (onProgress && e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { resolve({ status: 'success', data: { url: xhr.responseText } }); }
        } else {
          reject(new ApiError('Upload failed', xhr.status));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

      xhr.open('POST', url);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
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

  patch(action, body = {}, options = {}) {
    return this.request(action, {}, { ...options, method: 'POST', body, includeCsrf: true });
  }

  delete(action, params = {}, options = {}) {
    return this.request(action, params, { ...options, method: 'POST', includeCsrf: true });
  }

  // ============================================
  // BATCH REQUESTS
  // ============================================
  async batch(requests) {
    const results = await Promise.allSettled(
      requests.map(req => this.request(req.action, req.params, req.options))
    );
    return results.map((r, i) => ({
      success: r.status === 'fulfilled',
      data: r.status === 'fulfilled' ? r.value : null,
      error: r.status === 'rejected' ? r.reason?.message : null
    }));
  }

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================
  async ping() {
    return this.get('ping', {}, { includeAuth: false, cacheKey: 'ping', cacheTTL: 30000 });
  }

  async checkSetup() {
    return this.get('checkSetup', {}, { includeAuth: false });
  }

  async setup(data) {
    return this.post('setup', data, { includeAuth: false });
  }

  async login(username, password) {
    return this.post('login', { username, password }, { includeAuth: false, retry: false });
  }

  async register(data) {
    return this.post('publicRegister', data, { includeAuth: false });
  }

  async logout() {
    return this.post('logout');
  }

  async getMe() {
    return this.get('me');
  }

  async changePassword(oldPassword, newPassword) {
    return this.post('changePassword', { oldPassword, newPassword });
  }

  async checkUser(identifier) {
    return this.post('checkUser', { identifier }, { includeAuth: false });
  }

  async resetAdmin() {
    return this.get('resetAdmin', {}, { includeAuth: false });
  }

  async getCsrfToken() {
    return this.get('csrf.generate');
  }

  // ============================================
  // DASHBOARD
  // ============================================
  async getDashboardStats() {
    return this.get('dashboard.stats', {}, { cacheKey: 'dashboard_stats', cacheTTL: 60000 });
  }

  async getDashboardChart(period = 'monthly') {
    return this.get('dashboard.chart', { period }, { cacheKey: `dashboard_chart_${period}`, cacheTTL: 300000 });
  }

  // ============================================
  // SURAT MASUK
  // ============================================
  async getSuratMasukList(params = {}) {
    return this.get('suratMasuk.list', params);
  }

  async getSuratMasukDetail(id) {
    return this.get('suratMasuk.detail', { id }, { cacheKey: `sm_detail_${id}`, cacheTTL: 60000 });
  }

  async createSuratMasuk(data) {
    return this.post('suratMasuk.create', data);
  }

  async updateSuratMasuk(id, data) {
    return this.post('suratMasuk.update', { ...data, id });
  }

  async deleteSuratMasuk(id) {
    return this.post('suratMasuk.delete', { id });
  }

  async updateSuratMasukStatus(id, status) {
    return this.post('suratMasuk.updateStatus', { id, status });
  }

  // ============================================
  // SURAT KELUAR
  // ============================================
  async getSuratKeluarList(params = {}) {
    return this.get('suratKeluar.list', params);
  }

  async getSuratKeluarDetail(id) {
    return this.get('suratKeluar.detail', { id }, { cacheKey: `sk_detail_${id}`, cacheTTL: 60000 });
  }

  async createSuratKeluar(data) {
    return this.post('suratKeluar.create', data);
  }

  async updateSuratKeluar(id, data) {
    return this.post('suratKeluar.update', { ...data, id });
  }

  async deleteSuratKeluar(id) {
    return this.post('suratKeluar.delete', { id });
  }

  async submitApproval(id) {
    return this.post('suratKeluar.submitApproval', { id });
  }

  // ============================================
  // DISPOSISI
  // ============================================
  async getDisposisiList(params = {}) {
    return this.get('disposisi.list', params);
  }

  async createDisposisi(data) {
    return this.post('disposisi.create', data);
  }

  async createMultipleDisposisi(data) {
    return this.post('disposisi.createMultiple', data);
  }

  async updateDisposisiStatus(id, status) {
    return this.post('disposisi.updateStatus', { id, status });
  }

  // ============================================
  // USERS
  // ============================================
  async getUsersList(params = {}) {
    return this.get('users.list', params);
  }

  async createUser(data) {
    return this.post('users.create', data);
  }

  async updateUser(id, data) {
    return this.post('users.update', { ...data, id });
  }

  async deleteUser(id) {
    return this.post('users.delete', { id });
  }

  async updateProfile(data) {
    return this.post('users.updateProfile', data);
  }

  // ============================================
  // SEARCH
  // ============================================
  async searchGlobal(query, params = {}) {
    return this.get('search', { q: query, ...params });
  }

  async searchAdvanced(params) {
    return this.get('search.advanced', params);
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================
  async getNotifications(params = {}) {
    return this.get('notifikasi.list', params);
  }

  async getUnreadCount() {
    return this.get('notifikasi.unreadCount', {}, { cacheKey: 'unread_count', cacheTTL: 30000 });
  }

  async markAsRead(id) {
    return this.post('notifikasi.read', { id });
  }

  async markAllAsRead() {
    return this.post('notifikasi.readAll');
  }

  // ============================================
  // FILES
  // ============================================
  async getFileList(params = {}) {
    return this.get('file.list', params);
  }

  async deleteFile(id) {
    return this.post('file.delete', { id });
  }

  async getFilePreview(fileId) {
    return this.get('file.preview', { fileId });
  }

  // ============================================
  // SYSTEM
  // ============================================
  async getSystemStatus() {
    return this.get('system.status');
  }

  async getSystemHealth() {
    return this.get('system.health');
  }

  async clearSystemCache() {
    return this.post('system.cache.clear');
  }

  // ============================================
  // REPORT
  // ============================================
  async getComprehensiveReport(params = {}) {
    return this.get('report.comprehensive', params);
  }

  // ============================================
  // EXPORT
  // ============================================
  async exportData(params = {}) {
    return this.get('export.data', params);
  }

  async exportPDF(params = {}) {
    return this.get('export.pdf', params);
  }

  async exportExcel(params = {}) {
    return this.get('export.excel', params);
  }

  // ============================================
  // BACKUP
  // ============================================
  async createBackup(data) {
    return this.post('backup.create', data);
  }

  async getBackupList() {
    return this.get('backup.list');
  }

  async restoreBackup(id) {
    return this.post('backup.restore', { id });
  }

  // ============================================
  // BLOCKCHAIN
  // ============================================
  async getBlockchainChain() {
    return this.get('blockchain.getChain');
  }

  async verifyBlockchainChain() {
    return this.get('blockchain.verifyChain');
  }

  async addBlockchainBlock(data) {
    return this.post('blockchain.addBlock', data);
  }

  async verifyDocument(data) {
    return this.post('verify.document', data);
  }

  // ============================================
  // APPROVAL
  // ============================================
  async getApprovalList(params = {}) {
    return this.get('approval.list', params);
  }

  async processApproval(data) {
    return this.post('approval.process', data);
  }

  // ============================================
  // TTD
  // ============================================
  async signDocument(data) {
    return this.post('ttd.sign', data);
  }

  async verifySignature(id) {
    return this.get('ttd.verify', { id });
  }

  // ============================================
  // AUDIT LOG
  // ============================================
  async getAuditLogList(params = {}) {
    return this.get('auditLog.list', params);
  }

  async exportAuditLog(params = {}) {
    return this.get('auditLog.export', params);
  }

  // ============================================
  // 2FA
  // ============================================
  async setup2FA(data) {
    return this.post('2fa.setup', data);
  }

  async verify2FA(data) {
    return this.post('2fa.verify', data);
  }

  async get2FAStatus() {
    return this.get('2fa.status');
  }

  async disable2FA() {
    return this.post('2fa.disable');
  }

  // ============================================
  // API KEYS
  // ============================================
  async generateApiKey(data) {
    return this.post('apiKey.generate', data);
  }

  async revokeApiKey(id) {
    return this.post('apiKey.revoke', { id });
  }

  async listApiKeys() {
    return this.get('apiKey.list');
  }

  // ============================================
  // BIOMETRIC
  // ============================================
  async registerBiometric(data) {
    return this.post('biometric.register', data);
  }

  async verifyBiometric(data) {
    return this.post('biometric.verify', data);
  }

  async getBiometricStatus() {
    return this.get('biometric.status');
  }

  // ============================================
  // AI
  // ============================================
  async autoTag(data) {
    return this.post('ai.autoTag', data);
  }

  async classifyDocument(data) {
    return this.post('ai.classify', data);
  }

  async summarizeDocument(data) {
    return this.post('ai.summarize', data);
  }

  // ============================================
  // OCR
  // ============================================
  async ocrScan(data) {
    return this.post('ocr.scan', data);
  }

  // ============================================
  // WEBHOOK
  // ============================================
  async registerWebhook(data) {
    return this.post('webhook.register', data);
  }

  async listWebhooks() {
    return this.get('webhook.list');
  }

  async deleteWebhook(id) {
    return this.post('webhook.delete', { id });
  }

  // ============================================
  // UTILITY
  // ============================================
  getStatus() {
    return {
      baseUrl: this.baseUrl,
      pendingRequests: this.pendingRequests.size,
      circuitBreakerOpen: this.circuitBreaker.isOpen,
      circuitBreakerFailures: this.circuitBreaker.failures,
      cacheSize: this.responseCache.size,
      rateLimiter: this.rateLimiter.getStatus?.() || 'unknown'
    };
  }
}

/**
 * API Error class
 */
class ApiError extends Error {
  constructor(message, status, code, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

/**
 * Simple rate limiter
 */
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  allow() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowMs);
    if (this.requests.length >= this.maxRequests) return false;
    this.requests.push(now);
    return true;
  }

  getStatus() {
    return {
      current: this.requests.length,
      max: this.maxRequests,
      windowMs: this.windowMs
    };
  }
}

// Singleton instance
const api = new ApiService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiService, ApiError, RateLimiter, api };
}
