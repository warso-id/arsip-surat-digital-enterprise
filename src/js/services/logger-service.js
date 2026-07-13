/**
 * LOGGER SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Centralized logging with levels and transports
 */

class LoggerService {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.level = 'info'; // debug, info, warn, error
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
    this.transports = ['console', 'memory'];
    this.prefix = '[ASD]';
  }
  
  /**
   * Initialize logger
   */
  init() {
    // Override console methods
    this.overrideConsole();
    
    console.log('✅ Logger Service initialized');
  }
  
  /**
   * Override console methods
   */
  overrideConsole() {
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };
    
    console.log = (...args) => {
      this.log('info', ...args);
      originalConsole.log(...args);
    };
    
    console.info = (...args) => {
      this.log('info', ...args);
      originalConsole.info(...args);
    };
    
    console.warn = (...args) => {
      this.log('warn', ...args);
      originalConsole.warn(...args);
    };
    
    console.error = (...args) => {
      this.log('error', ...args);
      originalConsole.error(...args);
    };
    
    console.debug = (...args) => {
      this.log('debug', ...args);
      originalConsole.debug(...args);
    };
  }
  
  /**
   * Log message
   */
  log(level, ...args) {
    if (this.levels[level] < this.levels[this.level]) return;
    
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      level,
      message: args.map(a => this.serializeArg(a)).join(' '),
      timestamp: new Date().toISOString(),
      stack: new Error().stack?.split('\n').slice(3, 6).join('\n')
    };
    
    // Store in memory
    if (this.transports.includes('memory')) {
      this.logs.push(entry);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
    }
    
    // Send to server for errors
    if (level === 'error' && this.transports.includes('server')) {
      this.sendToServer(entry);
    }
    
    // Store in local storage for persistence
    if (level === 'error') {
      this.persistError(entry);
    }
  }
  
  /**
   * Log debug
   */
  debug(...args) {
    this.log('debug', ...args);
  }
  
  /**
   * Log info
   */
  info(...args) {
    this.log('info', ...args);
  }
  
  /**
   * Log warning
   */
  warn(...args) {
    this.log('warn', ...args);
  }
  
  /**
   * Log error
   */
  error(...args) {
    this.log('error', ...args);
  }
  
  /**
   * Serialize argument for logging
   */
  serializeArg(arg) {
    if (arg instanceof Error) {
      return `${arg.message}\n${arg.stack}`;
    }
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }
  
  /**
   * Send log to server
   */
  async sendToServer(entry) {
    try {
      await api.post('system.log', {
        level: entry.level,
        message: entry.message,
        stack: entry.stack,
        timestamp: entry.timestamp,
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    } catch {
      // Silent fail
    }
  }
  
  /**
   * Persist error to localStorage
   */
  persistError(entry) {
    try {
      const errors = JSON.parse(localStorage.getItem('asd_error_logs') || '[]');
      errors.push({
        message: entry.message,
        stack: entry.stack,
        timestamp: entry.timestamp
      });
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('asd_error_logs', JSON.stringify(errors));
    } catch {}
  }
  
  /**
   * Get all logs
   */
  getLogs(options = {}) {
    const { level, limit = 100, offset = 0, startDate, endDate } = options;
    
    let filtered = [...this.logs];
    
    if (level) {
      filtered = filtered.filter(l => l.level === level);
    }
    
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(l => new Date(l.timestamp) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      filtered = filtered.filter(l => new Date(l.timestamp) <= end);
    }
    
    return filtered.slice(offset, offset + limit);
  }
  
  /**
   * Get error logs from storage
   */
  getPersistedErrors() {
    try {
      return JSON.parse(localStorage.getItem('asd_error_logs') || '[]');
    } catch {
      return [];
    }
  }
  
  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('asd_error_logs');
  }
  
  /**
   * Export logs
   */
  exportLogs(format = 'json') {
    const logs = this.getLogs();
    
    if (format === 'csv') {
      const header = 'Timestamp,Level,Message\n';
      const rows = logs.map(l => 
        `"${l.timestamp}","${l.level}","${l.message.replace(/"/g, '""')}"`
      ).join('\n');
      return header + rows;
    }
    
    return JSON.stringify(logs, null, 2);
  }
  
  /**
   * Download logs
   */
  downloadLogs() {
    const content = this.exportLogs('json');
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
  
  /**
   * Set log level
   */
  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.level = level;
    }
  }
  
  /**
   * Add transport
   */
  addTransport(transport) {
    if (!this.transports.includes(transport)) {
      this.transports.push(transport);
    }
  }
  
  /**
   * Remove transport
   */
  removeTransport(transport) {
    this.transports = this.transports.filter(t => t !== transport);
  }
  
  /**
   * Get log statistics
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {},
      recentErrors: this.logs.filter(l => l.level === 'error').slice(-5).length,
      persistedErrors: this.getPersistedErrors().length
    };
    
    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    });
    
    return stats;
  }
}

// Singleton instance
const LoggerService = new LoggerService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LoggerService };
}
