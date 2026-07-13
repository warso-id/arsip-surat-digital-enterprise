/**
 * PERFORMANCE SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Performance monitoring and optimization
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoads: [],
      apiCalls: [],
      longTasks: [],
      memoryUsage: []
    };
    
    this.observers = [];
    this.isMonitoring = false;
  }
  
  /**
   * Initialize performance monitor
   */
  init() {
    if (!APP_CONFIG.ANALYTICS?.ENABLED) {
      console.log('Performance monitoring disabled');
      return;
    }
    
    this.isMonitoring = true;
    
    // Monitor navigation timing
    this.monitorNavigation();
    
    // Monitor long tasks
    this.monitorLongTasks();
    
    // Monitor memory
    this.monitorMemory();
    
    // Monitor resource loading
    this.monitorResources();
    
    console.log('✅ Performance Monitor initialized');
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
            this.metrics.pageLoads.push({
              type: entry.type,
              domContentLoaded: entry.domContentLoadedEventEnd - entry.startTime,
              loadComplete: entry.loadEventEnd - entry.startTime,
              firstByte: entry.responseStart - entry.startTime,
              timestamp: Date.now()
            });
            
            // Keep only last 50
            if (this.metrics.pageLoads.length > 50) {
              this.metrics.pageLoads.shift();
            }
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
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
              timestamp: Date.now()
            });
            
            if (this.metrics.longTasks.length > 100) {
              this.metrics.longTasks.shift();
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
    
    setInterval(() => {
      const memory = performance.memory;
      if (memory) {
        this.metrics.memoryUsage.push({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          timestamp: Date.now()
        });
        
        if (this.metrics.memoryUsage.length > 100) {
          this.metrics.memoryUsage.shift();
        }
        
        // Warn if memory usage is high
        const usagePercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        if (usagePercent > 0.8) {
          console.warn(`High memory usage: ${Math.round(usagePercent * 100)}%`);
        }
      }
    }, 30000);
  }
  
  /**
   * Monitor resource loading
   */
  monitorResources() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Log slow resources
          if (entry.duration > 1000) {
            console.warn(`Slow resource: ${entry.name} (${entry.duration.toFixed(0)}ms)`);
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
   * Track page load
   */
  trackPageLoad(metrics) {
    if (!this.isMonitoring) return;
    
    this.metrics.pageLoads.push({
      ...metrics,
      timestamp: Date.now()
    });
  }
  
  /**
   * Track API call
   */
  trackApiCall(action, duration, status) {
    if (!this.isMonitoring) return;
    
    this.metrics.apiCalls.push({
      action,
      duration,
      status,
      timestamp: Date.now()
    });
    
    if (this.metrics.apiCalls.length > 200) {
      this.metrics.apiCalls.shift();
    }
    
    // Log slow API calls
    if (duration > 3000) {
      console.warn(`Slow API call: ${action} (${duration.toFixed(0)}ms)`);
    }
  }
  
  /**
   * Track long task
   */
  trackLongTask(duration) {
    if (!this.isMonitoring) return;
    
    this.metrics.longTasks.push({
      duration,
      timestamp: Date.now()
    });
  }
  
  /**
   * Get performance metrics
   */
  getMetrics() {
    const apiCalls = this.metrics.apiCalls;
    const avgAPIDuration = apiCalls.length > 0
      ? apiCalls.reduce((sum, c) => sum + c.duration, 0) / apiCalls.length
      : 0;
    
    const slowAPICalls = apiCalls.filter(c => c.duration > 3000).length;
    
    const longTasks = this.metrics.longTasks;
    const avgLongTaskDuration = longTasks.length > 0
      ? longTasks.reduce((sum, t) => sum + t.duration, 0) / longTasks.length
      : 0;
    
    const lastPageLoad = this.metrics.pageLoads[this.metrics.pageLoads.length - 1];
    
    const memory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    
    return {
      pageLoad: lastPageLoad?.loadComplete || 0,
      domReady: lastPageLoad?.domContentLoaded || 0,
      avgAPIDuration: Math.round(avgAPIDuration),
      totalAPICalls: apiCalls.length,
      slowAPICalls,
      avgLongTaskDuration: Math.round(avgLongTaskDuration),
      totalLongTasks: longTasks.length,
      memoryUsage: memory ? Math.round(memory.usedJSHeapSize / 1048576) + ' MB' : 'N/A'
    };
  }
  
  /**
   * Get performance rating
   */
  getRating() {
    const metrics = this.getMetrics();
    
    let score = 100;
    
    if (metrics.pageLoad > 3000) score -= 20;
    else if (metrics.pageLoad > 1500) score -= 10;
    
    if (metrics.avgAPIDuration > 2000) score -= 20;
    else if (metrics.avgAPIDuration > 1000) score -= 10;
    
    if (metrics.slowAPICalls > 10) score -= 15;
    
    if (metrics.totalLongTasks > 20) score -= 15;
    
    if (score >= 90) return { rating: 'excellent', color: '#4CAF50', score };
    if (score >= 70) return { rating: 'good', color: '#8BC34A', score };
    if (score >= 50) return { rating: 'fair', color: '#FFC107', score };
    return { rating: 'poor', color: '#F44336', score };
  }
  
  /**
   * Clear metrics
   */
  clearMetrics() {
    this.metrics = {
      pageLoads: [],
      apiCalls: [],
      longTasks: [],
      memoryUsage: []
    };
  }
  
  /**
   * Stop monitoring
   */
  stop() {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
  
  /**
   * Get FPS
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
}

// Singleton instance
const PerformanceMonitor = new PerformanceMonitor();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PerformanceMonitor };
}
