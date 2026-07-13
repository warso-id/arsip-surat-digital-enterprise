/**
 * ERROR HANDLER SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Global error handling and recovery
 */

class ErrorHandler {
  constructor() {
    this.errorCount = 0;
    this.maxErrors = 50;
    this.errorWindow = 60000; // 1 minute
    this.errors = [];
    this.recoveryActions = {};
  }
  
  /**
   * Initialize error handler
   */
  init() {
    this.setupGlobalHandlers();
    this.registerDefaultRecoveryActions();
    
    console.log('✅ Error Handler initialized');
  }
  
  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleError(event.error || event.message, {
        type: 'global',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        source: event.target?.tagName
      });
    });
    
    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        type: 'unhandled_promise'
      });
    });
    
    // Resource load error
    window.addEventListener('error', (event) => {
      if (event.target !== window && event.target.tagName) {
        this.handleError(
          `Failed to load ${event.target.tagName}: ${event.target.src || event.target.href}`,
          { type: 'resource', element: event.target.tagName }
        );
      }
    }, true);
    
    // API error interceptor
    this.interceptFetch();
  }
  
  /**
   * Intercept fetch for API errors
   */
  interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.handleError(
            `API Error: ${response.status} ${response.statusText}`,
            {
              type: 'api',
              status: response.status,
              url: args[0]
            }
          );
        }
        
        return response;
      } catch (error) {
        this.handleError(error, {
          type: 'network',
          url: args[0]
        });
        throw error;
      }
    };
  }
  
  /**
   * Register default recovery actions
   */
  registerDefaultRecoveryActions() {
    this.recoveryActions = {
      'api_401': async () => {
        AuthService.clearAuth();
        router.navigate('/login', { query: { expired: true } });
      },
      
      'api_403': () => {
        NotificationService.error('Anda tidak memiliki akses');
      },
      
      'api_429': () => {
        NotificationService.warning('Terlalu banyak permintaan. Silakan tunggu.');
      },
      
      'api_500': async () => {
        const retry = await NotificationService.confirm(
          'Terjadi kesalahan server. Coba lagi?',
          'Kesalahan Server'
        );
        if (retry) return 'retry';
      },
      
      'network_error': () => {
        store.dispatch('app.online', false);
        NotificationService.warning('Koneksi terputus. Data akan disinkronkan saat online.');
      },
      
      'script_error': () => {
        NotificationService.error('Terjadi kesalahan. Memuat ulang...', 'error', { duration: 3000 });
        setTimeout(() => window.location.reload(), 3000);
      }
    };
  }
  
  /**
   * Handle error
   */
  handleError(error, metadata = {}) {
    const errorObj = this.normalizeError(error, metadata);
    
    // Track error count
    this.errorCount++;
    this.errors.push(errorObj);
    
    // Clean old errors
    const cutoff = Date.now() - this.errorWindow;
    this.errors = this.errors.filter(e => e.timestamp > cutoff);
    
    // Log error
    LoggerService.error('Error:', errorObj);
    
    // Track analytics
    if (APP_CONFIG.ANALYTICS?.ENABLED) {
      AnalyticsService.trackError(errorObj);
    }
    
    // Check error threshold
    if (this.errors.length > this.maxErrors) {
      this.handleErrorFlood();
      return;
    }
    
    // Attempt recovery
    this.attemptRecovery(errorObj);
    
    // Show user-friendly message
    this.showErrorMessage(errorObj);
  }
  
  /**
   * Normalize error object
   */
  normalizeError(error, metadata) {
    return {
      id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      message: error?.message || String(error),
      stack: error?.stack || new Error().stack,
      type: metadata.type || 'unknown',
      status: metadata.status,
      url: metadata.url || metadata.filename || window.location.href,
      metadata,
      timestamp: Date.now(),
      handled: false
    };
  }
  
  /**
   * Attempt recovery
   */
  async attemptRecovery(error) {
    // Find matching recovery action
    let recoveryKey = `${error.type}`;
    if (error.status) recoveryKey += `_${error.status}`;
    
    const recovery = this.recoveryActions[recoveryKey] || 
                    this.recoveryActions[error.type];
    
    if (recovery) {
      try {
        const result = await recovery(error);
        if (result === 'retry') {
          // Retry logic
        }
        error.handled = true;
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
      }
    }
  }
  
  /**
   * Show user-friendly error message
   */
  showErrorMessage(error) {
    const messages = {
      'network': 'Gagal terhubung ke server. Periksa koneksi internet Anda.',
      'api_400': 'Data yang dikirim tidak valid.',
      'api_401': 'Sesi telah berakhir. Silakan login kembali.',
      'api_403': 'Anda tidak memiliki akses untuk tindakan ini.',
      'api_404': 'Data tidak ditemukan.',
      'api_429': 'Terlalu banyak permintaan. Silakan tunggu sebentar.',
      'api_500': 'Terjadi kesalahan server. Silakan coba lagi.',
      'script': 'Terjadi kesalahan pada aplikasi.',
      'resource': 'Gagal memuat sumber daya.',
      'validation': 'Data tidak valid. Periksa kembali input Anda.',
      'default': 'Terjadi kesalahan yang tidak diketahui.'
    };
    
    const key = error.status ? `${error.type}_${error.status}` : error.type;
    const message = messages[key] || messages[error.type] || messages.default;
    
    // Don't show too many error messages
    if (this.errors.filter(e => Date.now() - e.timestamp < 5000).length <= 3) {
      NotificationService.error(message, 'error', { duration: 5000 });
    }
  }
  
  /**
   * Handle error flood
   */
  handleErrorFlood() {
    console.error('Error flood detected! Too many errors in short time.');
    
    // Clear old errors
    this.errors = [];
    
    // Attempt full recovery
    NotificationService.error(
      'Terjadi banyak kesalahan. Memuat ulang aplikasi...',
      'error',
      { duration: 3000 }
    );
    
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  }
  
  /**
   * Register custom recovery action
   */
  registerRecovery(key, action) {
    this.recoveryActions[key] = action;
  }
  
  /**
   * Get error statistics
   */
  getStats() {
    const recentErrors = this.errors.filter(
      e => Date.now() - e.timestamp < this.errorWindow
    );
    
    const byType = {};
    recentErrors.forEach(e => {
      byType[e.type] = (byType[e.type] || 0) + 1;
    });
    
    return {
      total: this.errorCount,
      recent: recentErrors.length,
      byType,
      handled: recentErrors.filter(e => e.handled).length,
      unhandled: recentErrors.filter(e => !e.handled).length
    };
  }
  
  /**
   * Clear error history
   */
  clearErrors() {
    this.errors = [];
    this.errorCount = 0;
  }
  
  /**
   * Create user-friendly error
   */
  createError(message, code = 'UNKNOWN', details = {}) {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    error.timestamp = new Date().toISOString();
    return error;
  }
}

// Singleton instance
const ErrorHandler = new ErrorHandler();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ErrorHandler };
}
