/**
 * ============================================
 * PERFORMANCE MONITOR - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL PERFORMANCE MONITORING - SIAP PRODUKSI
 * Mendukung: Navigation, Resources, Long Tasks,
 * Memory, FPS, API Calls, Web Vitals, Reporting
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoads: [],
      apiCalls: [],
      longTasks: [],
      memoryUsage: [],
      resources: [],
      webVitals: { LCP: null, FID: null, CLS: null, FCP: null, TTFB: null, INP: null },
      fps: [],
      errors: []
    };

    this.observers = [];
    this.isMonitoring = false;
    this.sessionStart = Date.now();
    this.monitoringInterval = null;
    this.maxEntries = 200;
    this.reportUrl = null;
    this.samplingRate = 1; // 100%
    this.debugMode = false;
  }

  /**
   * Initialize performance monitor
   */
  init() {
    if (typeof APP_CONFIG === 'undefined' || !APP_CONFIG.ANALYTICS?.ENABLED) {
      console.log('Performance monitoring disabled by config');
      return;
    }

    this.isMonitoring = true;
    this.sessionStart = Date.now();

    // Core Web Vitals
    this.monitorWebVitals();

    // Navigation timing
    this.monitorNavigation();

    // Long tasks
    this.monitorLongTasks();

    // Memory usage
    this.monitorMemory();

    // Resource loading
    this.monitorResources();

    // FPS monitoring
    this.monitorFPS();

    // First paint metrics
    this.monitorPaintTiming();

    // Layout shifts
    this.monitorLayoutShifts();

    // Periodic reporting
    this.startPeriodicReporting();

    // Log initial page load
    this.logPageLoadMetrics();

    console.log('✅ Performance Monitor initialized');
  }

  /**
   * Monitor Core Web Vitals
   */
  monitorWebVitals() {
    if (!('PerformanceObserver' in window)) return;

    // LCP - Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.metrics.webVitals.LCP = {
            value: Math.round(lastEntry.startTime),
            rating: this.getLCPRating(lastEntry.startTime),
            element: lastEntry.element?.tagName || 'unknown',
            timestamp: Date.now()
          };
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(lcpObserver);
    } catch (e) {}

    // FID - First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.webVitals.FID = {
            value: Math.round(entry.processingStart - entry.startTime),
            rating: this.getFIDRating(entry.processingStart - entry.startTime),
            name: entry.name,
            timestamp: Date.now()
          };
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.push(fidObserver);
    } catch (e) {}

    // CLS - Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.metrics.webVitals.CLS = {
          value: Math.round(clsValue * 1000) / 1000,
          rating: this.getCLSRating(clsValue),
          timestamp: Date.now()
        };
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(clsObserver);
    } catch (e) {}

    // FCP - First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          this.metrics.webVitals.FCP = {
            value: Math.round(entries[0].startTime),
            rating: this.getFCPRating(entries[0].startTime),
            timestamp: Date.now()
          };
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      this.observers.push(fcpObserver);
    } catch (e) {}

    // TTFB - Time to First Byte
    try {
      const ttfbObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          this.metrics.webVitals.TTFB = {
            value: Math.round(entries[0].responseStart - entries[0].requestStart),
            rating: this.getTTFBRating(entries[0].responseStart - entries[0].requestStart),
            timestamp: Date.now()
          };
        }
      });
      ttfbObserver.observe({ type: 'navigation', buffered: true });
      this.observers.push(ttfbObserver);
    } catch (e) {}

    // INP - Interaction to Next Paint
    try {
      const inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.webVitals.INP = {
            value: Math.round(entry.duration),
            rating: this.getINPRating(entry.duration),
            name: entry.name,
            timestamp: Date.now()
          };
        }
      });
      inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 16 });
      this.observers.push(inpObserver);
    } catch (e) {}
  }

  /**
   * Monitor navigation timing
   */
  monitorNavigation() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const metrics = {
              type: entry.type,
              domContentLoaded: Math.round(entry.domContentLoadedEventEnd - entry.startTime),
              loadComplete: Math.round(entry.loadEventEnd - entry.startTime),
              firstByte: Math.round(entry.responseStart - entry.startTime),
              domInteractive: Math.round(entry.domInteractive - entry.startTime),
              redirectTime: Math.round(entry.redirectEnd - entry.redirectStart),
              dnsTime: Math.round(entry.domainLookupEnd - entry.domainLookupStart),
              tcpTime: Math.round(entry.connectEnd - entry.connectStart),
              requestTime: Math.round(entry.responseStart - entry.requestStart),
              responseTime: Math.round(entry.responseEnd - entry.responseStart),
              transferSize: entry.transferSize,
              timestamp: Date.now()
            };
            this.metrics.pageLoads.push(metrics);
            if (this.metrics.pageLoads.length > this.maxEntries) {
              this.metrics.pageLoads.shift();
            }
            if (this.debugMode) console.log('Navigation metrics:', metrics);
          }
        }
      });
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Navigation monitoring not supported');
    }
  }

  /**
   * Monitor long tasks
   */
  monitorLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            this.metrics.longTasks.push({
              duration: Math.round(entry.duration),
              startTime: Math.round(entry.startTime),
              name: entry.name || 'unknown',
              attribution: entry.attribution?.map(a => ({
                name: a.name,
                containerType: a.containerType,
                containerName: a.containerName
              })) || [],
              timestamp: Date.now()
            });
            if (this.metrics.longTasks.length > this.maxEntries) {
              this.metrics.longTasks.shift();
            }
            if (this.debugMode && entry.duration > 100) {
              console.warn(`Long task: ${Math.round(entry.duration)}ms`, entry.attribution);
            }
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Long task monitoring not supported');
    }
  }

  /**
   * Monitor memory usage
   */
  monitorMemory() {
    if (!('memory' in performance)) return;

    this.monitoringInterval = setInterval(() => {
      const memory = performance.memory;
      if (memory) {
        const entry = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usagePercent: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100),
          timestamp: Date.now()
        };
        this.metrics.memoryUsage.push(entry);
        if (this.metrics.memoryUsage.length > 100) {
          this.metrics.memoryUsage.shift();
        }

        if (entry.usagePercent > 80) {
          console.warn(`⚠️ High memory usage: ${entry.usagePercent}% (${this.formatBytes(memory.usedJSHeapSize)} / ${this.formatBytes(memory.jsHeapSizeLimit)})`);
        }
      }
    }, 15000); // Every 15 seconds
  }

  /**
   * Monitor resource loading
   */
  monitorResources() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = {
            name: entry.name,
            type: entry.initiatorType,
            duration: Math.round(entry.duration),
            size: entry.transferSize || 0,
            timestamp: Date.now()
          };

          // Log slow resources
          if (entry.duration > 2000) {
            console.warn(`🐢 Slow resource (${Math.round(entry.duration)}ms): ${entry.name}`);
            resource.slow = true;
          }

          // Log failed resources
          if (entry.transferSize === 0 && entry.duration > 100) {
            resource.failed = true;
          }

          this.metrics.resources.push(resource);
          if (this.metrics.resources.length > this.maxEntries) {
            this.metrics.resources.shift();
          }
        }
      });
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Resource monitoring not supported');
    }
  }

  /**
   * Monitor FPS
   */
  monitorFPS() {
    let lastTime = performance.now();
    let frames = 0;
    let fpsMeasurements = [];

    const measureFPS = () => {
      frames++;
      const now = performance.now();
      if (now >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (now - lastTime));
        fpsMeasurements.push({ fps, timestamp: Date.now() });
        if (fpsMeasurements.length > 60) fpsMeasurements.shift();
        this.metrics.fps = fpsMeasurements;

        if (fps < 30 && this.debugMode) {
          console.warn(`📉 Low FPS: ${fps}`);
        }

        frames = 0;
        lastTime = now;
      }
      if (this.isMonitoring) {
        requestAnimationFrame(measureFPS);
      }
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Monitor paint timing
   */
  monitorPaintTiming() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-paint') {
            this.metrics.webVitals.FP = { value: Math.round(entry.startTime), timestamp: Date.now() };
          }
        }
      });
      observer.observe({ type: 'paint', buffered: true });
      this.observers.push(observer);
    } catch (e) {}
  }

  /**
   * Monitor layout shifts
   */
  monitorLayoutShifts() {
    if (!('PerformanceObserver' in window)) return;

    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(observer);
    } catch (e) {}
  }

  /**
   * Track API call performance
   */
  trackApiCall(action, duration, status, size = 0) {
    if (!this.isMonitoring || Math.random() > this.samplingRate) return;

    const entry = {
      action,
      duration: Math.round(duration),
      status,
      size,
      timestamp: Date.now()
    };

    this.metrics.apiCalls.push(entry);
    if (this.metrics.apiCalls.length > this.maxEntries) {
      this.metrics.apiCalls.shift();
    }

    // Warn for slow API calls
    if (duration > 3000) {
      console.warn(`🐢 Slow API call (${Math.round(duration)}ms): ${action} [${status}]`);
    }

    // Track error rate
    if (status >= 400) {
      entry.error = true;
    }
  }

  /**
   * Track page load metrics
   */
  trackPageLoad(metrics) {
    if (!this.isMonitoring) return;
    this.metrics.pageLoads.push({ ...metrics, timestamp: Date.now() });
  }

  /**
   * Track error
   */
  trackError(error, context = {}) {
    this.metrics.errors.push({
      message: error?.message || String(error),
      context,
      timestamp: Date.now()
    });
    if (this.metrics.errors.length > 50) this.metrics.errors.shift();
  }

  /**
   * Log initial page load metrics
   */
  logPageLoadMetrics() {
    if (window.performance?.timing) {
      const t = window.performance.timing;
      const metrics = {
        pageLoadTime: t.loadEventEnd - t.navigationStart,
        domReady: t.domContentLoadedEventEnd - t.navigationStart,
        firstByte: t.responseStart - t.requestStart,
        connectTime: t.connectEnd - t.connectStart,
        renderTime: t.domComplete - t.domLoading,
        timestamp: Date.now()
      };
      this.metrics.pageLoads.push(metrics);
    }
  }

  /**
   * Start periodic reporting
   */
  startPeriodicReporting() {
    setInterval(() => {
      if (this.isMonitoring && this.reportUrl) {
        this.sendReport();
      }
    }, 60000); // Every minute
  }

  /**
   * Send performance report to server
   */
  async sendReport() {
    try {
      const report = {
        sessionId: this.sessionStart,
        duration: Date.now() - this.sessionStart,
        webVitals: this.metrics.webVitals,
        summary: this.getMetrics(),
        rating: this.getRating(),
        timestamp: new Date().toISOString()
      };

      if (typeof api !== 'undefined') {
        await api.post('analytics.api', { metrics: report });
      } else if (typeof API !== 'undefined') {
        await API.post('analytics.api', { metrics: report });
      } else if (this.reportUrl) {
        await fetch(this.reportUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report)
        });
      }
    } catch (error) {
      // Silent fail for reporting
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  getMetrics() {
    const apiCalls = this.metrics.apiCalls;
    const avgAPIDuration = apiCalls.length > 0
      ? Math.round(apiCalls.reduce((s, c) => s + c.duration, 0) / apiCalls.length)
      : 0;
    const slowAPICalls = apiCalls.filter(c => c.duration > 3000).length;
    const errorAPICalls = apiCalls.filter(c => c.status >= 400).length;
    const apiErrorRate = apiCalls.length > 0 ? Math.round((errorAPICalls / apiCalls.length) * 100) : 0;

    const longTasks = this.metrics.longTasks;
    const avgLongTaskDuration = longTasks.length > 0
      ? Math.round(longTasks.reduce((s, t) => s + t.duration, 0) / longTasks.length)
      : 0;

    const lastPageLoad = this.metrics.pageLoads[this.metrics.pageLoads.length - 1];
    const memory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];

    const fpsValues = this.metrics.fps.map(f => f.fps);
    const avgFPS = fpsValues.length > 0 ? Math.round(fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length) : 60;

    return {
      // Page Load
      pageLoad: lastPageLoad?.loadComplete || 0,
      domReady: lastPageLoad?.domContentLoaded || 0,
      firstByte: lastPageLoad?.firstByte || 0,

      // API
      avgAPIDuration,
      totalAPICalls: apiCalls.length,
      slowAPICalls,
      errorAPICalls,
      apiErrorRate,

      // Long Tasks
      avgLongTaskDuration,
      totalLongTasks: longTasks.length,
      longTasksOver100ms: longTasks.filter(t => t.duration > 100).length,

      // Memory
      memoryUsage: memory ? this.formatBytes(memory.usedJSHeapSize) : 'N/A',
      memoryPercent: memory?.usagePercent || 0,

      // FPS
      avgFPS,
      minFPS: fpsValues.length > 0 ? Math.min(...fpsValues) : 60,

      // Web Vitals
      LCP: this.metrics.webVitals.LCP?.value || null,
      FID: this.metrics.webVitals.FID?.value || null,
      CLS: this.metrics.webVitals.CLS?.value || null,
      FCP: this.metrics.webVitals.FCP?.value || null,
      TTFB: this.metrics.webVitals.TTFB?.value || null,

      // Session
      sessionDuration: Math.round((Date.now() - this.sessionStart) / 1000)
    };
  }

  /**
   * Get overall performance rating
   */
  getRating() {
    const m = this.getMetrics();
    let score = 100;

    // LCP rating (25%)
    if (m.LCP && m.LCP > 2500) score -= 25;
    else if (m.LCP && m.LCP > 1500) score -= 12;

    // FID rating (10%)
    if (m.FID && m.FID > 100) score -= 10;
    else if (m.FID && m.FID > 50) score -= 5;

    // CLS rating (15%)
    if (m.CLS && m.CLS > 0.25) score -= 15;
    else if (m.CLS && m.CLS > 0.1) score -= 7;

    // Page load (10%)
    if (m.pageLoad > 3000) score -= 10;
    else if (m.pageLoad > 1500) score -= 5;

    // API performance (15%)
    if (m.avgAPIDuration > 2000) score -= 15;
    else if (m.avgAPIDuration > 1000) score -= 7;

    // Long tasks (10%)
    if (m.totalLongTasks > 30) score -= 10;
    else if (m.totalLongTasks > 10) score -= 5;

    // FPS (10%)
    if (m.avgFPS < 30) score -= 10;
    else if (m.avgFPS < 50) score -= 5;

    // Error rate (5%)
    if (m.apiErrorRate > 10) score -= 5;
    else if (m.apiErrorRate > 5) score -= 2;

    if (score >= 90) return { rating: 'excellent', label: 'Sangat Baik', color: '#4CAF50', score };
    if (score >= 75) return { rating: 'good', label: 'Baik', color: '#8BC34A', score };
    if (score >= 60) return { rating: 'needs-improvement', label: 'Perlu Peningkatan', color: '#FFC107', score };
    if (score >= 40) return { rating: 'poor', label: 'Buruk', color: '#FF9800', score };
    return { rating: 'critical', label: 'Kritis', color: '#F44336', score };
  }

  /**
   * Get FPS asynchronously
   */
  getFPS() {
    return new Promise((resolve) => {
      let frameCount = 0;
      let startTime = performance.now();

      const countFrame = () => {
        frameCount++;
        const elapsed = performance.now() - startTime;
        if (elapsed >= 1000) {
          resolve(Math.round((frameCount / elapsed) * 1000));
        } else {
          requestAnimationFrame(countFrame);
        }
      };

      requestAnimationFrame(countFrame);
    });
  }

  /**
   * Web Vitals rating helpers
   */
  getLCPRating(value) {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  getFIDRating(value) {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  getCLSRating(value) {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  getFCPRating(value) {
    if (value <= 1800) return 'good';
    if (value <= 3000) return 'needs-improvement';
    return 'poor';
  }

  getTTFBRating(value) {
    if (value <= 800) return 'good';
    if (value <= 1800) return 'needs-improvement';
    return 'poor';
  }

  getINPRating(value) {
    if (value <= 200) return 'good';
    if (value <= 500) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = {
      pageLoads: [],
      apiCalls: [],
      longTasks: [],
      memoryUsage: [],
      resources: [],
      webVitals: { LCP: null, FID: null, CLS: null, FCP: null, TTFB: null, INP: null },
      fps: [],
      errors: []
    };
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Get session duration
   */
  getSessionDuration() {
    return Math.round((Date.now() - this.sessionStart) / 1000);
  }
}

// Singleton instance
const PerformanceMonitor = new PerformanceMonitor();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PerformanceMonitor };
}
