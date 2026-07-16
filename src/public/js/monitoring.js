/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * System Monitoring & Error Tracking
 * ============================================================
 */

const EnterpriseMonitor = (() => {
    'use strict';

    // ==================== MONITORING CONFIGURATION ====================
    const CONFIG = {
        enabled: true,
        logLevel: 'info', // debug, info, warn, error
        remoteLogging: true,
        performanceMonitoring: true,
        errorTracking: true,
        batchSize: 10,
        flushInterval: 30000, // 30 seconds
    };

    // ==================== LOG LEVELS ====================
    const LOG_LEVELS = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
        fatal: 4,
    };

    // ==================== LOG STORAGE ====================
    let logBuffer = [];
    let metricsBuffer = [];
    let flushTimer = null;

    // ==================== PERFORMANCE OBSERVER ====================
    class PerformanceMonitor {
        constructor() {
            this.metrics = {};
            this.observers = [];
        }

        /**
         * Start monitoring
         */
        start() {
            // Monitor page load
            this.monitorPageLoad();
            
            // Monitor network requests
            this.monitorNetworkRequests();
            
            // Monitor user interactions
            this.monitorUserInteractions();
            
            // Monitor memory usage
            this.monitorMemory();
        }

        /**
         * Monitor page load performance
         */
        monitorPageLoad() {
            if (!window.performance || !window.performance.timing) return;

            window.addEventListener('load', () => {
                const timing = window.performance.timing;
                const metrics = {
                    type: 'page_load',
                    dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
                    tcpConnection: timing.connectEnd - timing.connectStart,
                    serverResponse: timing.responseEnd - timing.requestStart,
                    domLoad: timing.domContentLoadedEventEnd - timing.navigationStart,
                    pageLoad: timing.loadEventEnd - timing.navigationStart,
                    timestamp: Date.now(),
                };

                this.recordMetric('page_load', metrics);
            });
        }

        /**
         * Monitor network requests
         */
        monitorNetworkRequests() {
            if (!window.PerformanceObserver) return;

            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.initiatorType === 'xmlhttprequest' || entry.initiatorType === 'fetch') {
                            this.recordMetric('network_request', {
                                url: entry.name,
                                duration: entry.duration,
                                size: entry.transferSize,
                                timestamp: Date.now(),
                            });
                        }
                    }
                });

                observer.observe({ entryTypes: ['resource'] });
                this.observers.push(observer);
            } catch (error) {
                console.warn('PerformanceObserver not supported');
            }
        }

        /**
         * Monitor user interactions
         */
        monitorUserInteractions() {
            let interactionCount = 0;
            const events = ['click', 'keydown', 'scroll', 'touchstart'];
            
            events.forEach(eventType => {
                document.addEventListener(eventType, () => {
                    interactionCount++;
                }, { passive: true });
            });

            // Report every minute
            setInterval(() => {
                if (interactionCount > 0) {
                    this.recordMetric('user_interactions', {
                        count: interactionCount,
                        timestamp: Date.now(),
                    });
                    interactionCount = 0;
                }
            }, 60000);
        }

        /**
         * Monitor memory usage
         */
        monitorMemory() {
            if (!window.performance || !window.performance.memory) return;

            setInterval(() => {
                const memory = window.performance.memory;
                this.recordMetric('memory_usage', {
                    usedJSHeapSize: memory.usedJSHeapSize,
                    totalJSHeapSize: memory.totalJSHeapSize,
                    jsHeapSizeLimit: memory.jsHeapSizeLimit,
                    usagePercent: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2),
                    timestamp: Date.now(),
                });
            }, 30000);
        }

        /**
         * Record metric
         */
        recordMetric(name, data) {
            metricsBuffer.push({
                name,
                data,
                timestamp: Date.now(),
            });

            if (metricsBuffer.length >= CONFIG.batchSize) {
                this.flushMetrics();
            }
        }

        /**
         * Flush metrics to server
         */
        async flushMetrics() {
            if (metricsBuffer.length === 0) return;

            const metrics = [...metricsBuffer];
            metricsBuffer = [];

            try {
                if (window.GASAPI) {
                    const encoded = window.EnterpriseBase64 
                        ? window.EnterpriseBase64.encodeObject(metrics)
                        : btoa(JSON.stringify(metrics));

                    await window.GASAPI.call('system/metrics', {
                        metrics: encoded,
                        action: 'system/metrics',
                    });
                }
            } catch (error) {
                // Re-add failed metrics
                metricsBuffer = [...metrics, ...metricsBuffer];
            }
        }

        /**
         * Get all metrics
         */
        getMetrics() {
            return this.metrics;
        }

        /**
         * Stop all observers
         */
        stop() {
            this.observers.forEach(observer => observer.disconnect());
            this.observers = [];
        }
    }

    // ==================== ERROR TRACKER ====================
    class ErrorTracker {
        constructor() {
            this.errors = [];
            this.maxErrors = 100;
        }

        /**
         * Start tracking
         */
        start() {
            // Global error handler
            window.addEventListener('error', (event) => {
                this.trackError({
                    type: 'global_error',
                    message: event.message,
                    filename: event.filename,
                    lineNo: event.lineno,
                    colNo: event.colno,
                    stack: event.error?.stack,
                    timestamp: Date.now(),
                });
            });

            // Unhandled promise rejection
            window.addEventListener('unhandledrejection', (event) => {
                this.trackError({
                    type: 'unhandled_rejection',
                    message: event.reason?.message || 'Unknown rejection',
                    stack: event.reason?.stack,
                    timestamp: Date.now(),
                });
            });

            // Console error override
            const originalError = console.error;
            console.error = (...args) => {
                this.trackError({
                    type: 'console_error',
                    message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '),
                    timestamp: Date.now(),
                });
                originalError.apply(console, args);
            };
        }

        /**
         * Track error
         */
        trackError(errorData) {
            const error = {
                ...errorData,
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: errorData.timestamp || Date.now(),
            };

            this.errors.push(error);

            // Keep only recent errors
            if (this.errors.length > this.maxErrors) {
                this.errors = this.errors.slice(-this.maxErrors);
            }

            // Log to server for critical errors
            if (errorData.type === 'global_error' || errorData.type === 'unhandled_rejection') {
                this.sendErrorToServer(error);
            }

            // Store locally
            this.storeErrorLocally(error);
        }

        /**
         * Send error to server
         */
        async sendErrorToServer(error) {
            try {
                if (window.GASAPI) {
                    const encoded = window.EnterpriseBase64 
                        ? window.EnterpriseBase64.encodeObject(error)
                        : btoa(JSON.stringify(error));

                    await window.GASAPI.call('system/error', {
                        error: encoded,
                        action: 'system/error',
                    });
                }
            } catch (err) {
                // Silent fail - don't want error tracking to cause more errors
            }
        }

        /**
         * Store error locally
         */
        storeErrorLocally(error) {
            try {
                const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
                storedErrors.push(error);
                
                // Keep only last 50 errors
                if (storedErrors.length > 50) {
                    storedErrors.splice(0, storedErrors.length - 50);
                }
                
                localStorage.setItem('app_errors', JSON.stringify(storedErrors));
            } catch (err) {
                // Silent fail
            }
        }

        /**
         * Get all tracked errors
         */
        getErrors() {
            return this.errors;
        }

        /**
         * Clear errors
         */
        clearErrors() {
            this.errors = [];
            localStorage.removeItem('app_errors');
        }
    }

    // ==================== LOGGER ====================
    class Logger {
        /**
         * Log message
         */
        log(level, message, data = {}) {
            if (!CONFIG.enabled) return;
            
            const levelValue = LOG_LEVELS[level] || LOG_LEVELS.info;
            const configLevel = LOG_LEVELS[CONFIG.logLevel] || LOG_LEVELS.info;
            
            if (levelValue < configLevel) return;

            const logEntry = {
                level,
                message,
                data: typeof data === 'object' ? JSON.stringify(data) : data,
                timestamp: new Date().toISOString(),
                url: window.location.href,
            };

            // Console output
            const consoleMethod = level === 'error' || level === 'fatal' ? 'error' 
                : level === 'warn' ? 'warn' 
                : level === 'debug' ? 'debug' 
                : 'log';
            
            console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data);

            // Buffer for remote logging
            if (CONFIG.remoteLogging) {
                logBuffer.push(logEntry);
                
                if (logBuffer.length >= CONFIG.batchSize) {
                    this.flush();
                }
            }
        }

        debug(message, data) { this.log('debug', message, data); }
        info(message, data) { this.log('info', message, data); }
        warn(message, data) { this.log('warn', message, data); }
        error(message, data) { this.log('error', message, data); }
        fatal(message, data) { this.log('fatal', message, data); }

        /**
         * Flush logs to server
         */
        async flush() {
            if (logBuffer.length === 0) return;

            const logs = [...logBuffer];
            logBuffer = [];

            try {
                if (window.GASAPI && CONFIG.remoteLogging) {
                    const encoded = window.EnterpriseBase64 
                        ? window.EnterpriseBase64.encodeObject(logs)
                        : btoa(JSON.stringify(logs));

                    await window.GASAPI.call('system/logs', {
                        logs: encoded,
                        action: 'system/logs',
                    });
                }
            } catch (error) {
                // Re-add failed logs
                logBuffer = [...logs, ...logBuffer];
            }
        }
    }

    // ==================== HEALTH CHECK ====================
    class HealthChecker {
        /**
         * Check system health
         */
        async check() {
            const checks = {
                api: await this.checkAPI(),
                database: await this.checkDatabase(),
                storage: this.checkStorage(),
                memory: this.checkMemory(),
                network: this.checkNetwork(),
            };

            const status = Object.values(checks).every(c => c.status === 'healthy') 
                ? 'healthy' 
                : 'degraded';

            return {
                status,
                checks,
                timestamp: Date.now(),
            };
        }

        /**
         * Check API connectivity
         */
        async checkAPI() {
            try {
                const start = Date.now();
                const response = await window.GASAPI?.system.ping();
                const latency = Date.now() - start;

                return {
                    status: response?.success ? 'healthy' : 'unhealthy',
                    latency,
                    message: response?.message || 'No response',
                };
            } catch (error) {
                return {
                    status: 'unhealthy',
                    latency: null,
                    message: error.message,
                };
            }
        }

        /**
         * Check database
         */
        async checkDatabase() {
            try {
                if (!window.EnterpriseDB) {
                    return { status: 'unhealthy', message: 'Database module not loaded' };
                }

                const size = await window.EnterpriseDB.getSize();
                
                return {
                    status: 'healthy',
                    size: size,
                    message: 'Database accessible',
                };
            } catch (error) {
                return {
                    status: 'unhealthy',
                    message: error.message,
                };
            }
        }

        /**
         * Check storage
         */
        checkStorage() {
            try {
                const test = '__health_check__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                
                return { status: 'healthy', message: 'Storage accessible' };
            } catch (error) {
                return { status: 'unhealthy', message: error.message };
            }
        }

        /**
         * Check memory
         */
        checkMemory() {
            if (!window.performance?.memory) {
                return { status: 'unknown', message: 'Memory API not available' };
            }

            const memory = window.performance.memory;
            const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

            return {
                status: usagePercent < 80 ? 'healthy' : 'warning',
                used: memory.usedJSHeapSize,
                total: memory.jsHeapSizeLimit,
                usagePercent: usagePercent.toFixed(2),
            };
        }

        /**
         * Check network
         */
        checkNetwork() {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

            return {
                status: navigator.onLine ? 'healthy' : 'unhealthy',
                online: navigator.onLine,
                type: connection?.type || 'unknown',
                effectiveType: connection?.effectiveType || 'unknown',
                downlink: connection?.downlink || null,
            };
        }
    }

    // ==================== INITIALIZE ====================
    const logger = new Logger();
    const performanceMonitor = new PerformanceMonitor();
    const errorTracker = new ErrorTracker();
    const healthChecker = new HealthChecker();

    // Start flush timer
    flushTimer = setInterval(() => {
        logger.flush();
        performanceMonitor.flushMetrics();
    }, CONFIG.flushInterval);

    // Start monitoring
    if (CONFIG.performanceMonitoring) {
        performanceMonitor.start();
    }

    if (CONFIG.errorTracking) {
        errorTracker.start();
    }

    // Log initialization
    logger.info('Monitoring system initialized', {
        version: window.EnterpriseCore?.version || '3.0.0',
        userAgent: navigator.userAgent,
        online: navigator.onLine,
    });

    // ==================== PUBLIC API ====================
    return {
        logger,
        performance: performanceMonitor,
        errors: errorTracker,
        health: healthChecker,
        
        log: (level, message, data) => logger.log(level, message, data),
        debug: (msg, data) => logger.debug(msg, data),
        info: (msg, data) => logger.info(msg, data),
        warn: (msg, data) => logger.warn(msg, data),
        error: (msg, data) => logger.error(msg, data),
        
        getMetrics: () => performanceMonitor.getMetrics(),
        getErrors: () => errorTracker.getErrors(),
        clearErrors: () => errorTracker.clearErrors(),
        healthCheck: () => healthChecker.check(),
        
        flush: () => {
            logger.flush();
            performanceMonitor.flushMetrics();
        },
        
        stop: () => {
            clearInterval(flushTimer);
            performanceMonitor.stop();
        },
    };
})();

window.EnterpriseMonitor = EnterpriseMonitor;
