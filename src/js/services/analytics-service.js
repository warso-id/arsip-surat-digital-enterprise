/**
 * ANALYTICS SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Client-side analytics and tracking
 */

class AnalyticsService {
  constructor() {
    this.enabled = APP_CONFIG.ANALYTICS?.ENABLED || false;
    this.queue = [];
    this.flushInterval = 30000;
    this.batchSize = 10;
    this.flushTimer = null;
    this.sessionId = null;
    this.sessionStart = null;
    this.pageViews = 0;
    this.events = [];
  }
  
  /**
   * Initialize analytics
   */
  init() {
    if (!this.enabled) {
      console.log('Analytics disabled');
      return;
    }
    
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    
    // Start flush timer
    this.startFlushTimer();
    
    // Track page views
    this.setupPageViewTracking();
    
    // Track errors
    this.setupErrorTracking();
    
    // Track performance
    this.setupPerformanceTracking();
    
    console.log('✅ Analytics Service initialized');
  }
  
  /**
   * Generate session ID
   */
  generateSessionId() {
    return `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Start flush timer
   */
  startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }
  
  /**
   * Setup page view tracking
   */
  setupPageViewTracking() {
    // Track initial page view
    this.trackPageView(window.location.hash.slice(1) || '/', document.title);
    
    // Listen for route changes
    window.addEventListener('hashchange', () => {
      const path = window.location.hash.slice(1) || '/';
      this.trackPageView(path, document.title);
    });
  }
  
  /**
   * Setup error tracking
   */
  setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.trackError(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(event.reason, { type: 'unhandled_promise' });
    });
  }
  
  /**
   * Setup performance tracking
   */
  setupPerformanceTracking() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          this.trackPerformance({
            pageLoad: perfData.loadEventEnd - perfData.startTime,
            domReady: perfData.domContentLoadedEventEnd - perfData.startTime,
            firstPaint: performance.getEntriesByType('paint')
              .find(e => e.name === 'first-contentful-paint')?.startTime
          });
        }
      }, 0);
    });
  }
  
  /**
   * Track page view
   */
  trackPageView(path, title) {
    this.pageViews++;
    
    const event = {
      type: 'pageview',
      path,
      title,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      pageViewNumber: this.pageViews,
      referrer: document.referrer,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    };
    
    this.queue.push(event);
    this.checkFlush();
  }
  
  /**
   * Track event
   */
  trackEvent(category, action, label = null, value = null) {
    if (!this.enabled) return;
    
    const event = {
      type: 'event',
      category,
      action,
      label,
      value,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      path: window.location.hash.slice(1) || '/'
    };
    
    this.queue.push(event);
    this.events.push(event);
    this.checkFlush();
  }
  
  /**
   * Track error
   */
  trackError(error, metadata = {}) {
    if (!this.enabled) return;
    
    const event = {
      type: 'error',
      message: error?.message || String(error),
      stack: error?.stack,
      metadata,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      path: window.location.hash.slice(1) || '/'
    };
    
    this.queue.push(event);
    this.checkFlush();
  }
  
  /**
   * Track performance
   */
  trackPerformance(metrics) {
    if (!this.enabled) return;
    
    const event = {
      type: 'performance',
      metrics,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };
    
    this.queue.push(event);
    this.checkFlush();
  }
  
  /**
   * Track API call
   */
  trackAPICall(action, duration, status) {
    if (!this.enabled) return;
    
    const event = {
      type: 'api_call',
      action,
      duration,
      status,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };
    
    this.queue.push(event);
    this.checkFlush();
  }
  
  /**
   * Track user action
   */
  trackUserAction(action, details = {}) {
    this.trackEvent('user_action', action, details.label, details.value);
  }
  
  /**
   * Check if should flush
   */
  checkFlush() {
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }
  
  /**
   * Flush events to server
   */
  async flush() {
    if (this.queue.length === 0) return;
    
    const events = [...this.queue];
    this.queue = [];
    
    try {
      await api.post('analytics.api', {
        sessionId: this.sessionId,
        sessionStart: this.sessionStart,
        events
      });
    } catch (error) {
      // Re-add failed events
      this.queue.unshift(...events);
    }
  }
  
  /**
   * Get session stats
   */
  getSessionStats() {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.sessionStart,
      pageViews: this.pageViews,
      events: this.events.length
    };
  }
  
  /**
   * Enable/disable analytics
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem('asd_analytics', enabled ? '1' : '0');
  }
  
  /**
   * Check if enabled
   */
  isEnabled() {
    return this.enabled;
  }
}

// Singleton instance
const AnalyticsService = new AnalyticsService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AnalyticsService };
}
