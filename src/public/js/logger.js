/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Enterprise Logger
 * ============================================================
 * Centralized logging system for debugging and monitoring
 * ============================================================
 */

const EnterpriseLogger = (() => {
    'use strict';

    // ==================== LOG LEVELS ====================
    const LOG_LEVELS = {
        TRACE: 0,
        DEBUG: 10,
        INFO: 20,
        WARN: 30,
        ERROR: 40,
        FATAL: 50,
        OFF: 100,
    };

    // ==================== LOGGER CONFIGURATION ====================
    const CONFIG = {
        level: LOG_LEVELS.INFO,
        enableConsole: true,
        enableRemote: true,
        enableStorage: true,
        maxStorageEntries: 1000,
        remoteEndpoint: 'system/logs',
        batchSize: 20,
        flushInterval: 15000,
        includeStackTrace: false,
    };

    // ==================== LOG ENTRY ====================
    class LogEntry {
        constructor(level, message, data = {}) {
            this.id = this.generateId();
            this.level = level;
            this.message = message;
            this.data = data;
            this.timestamp = new Date().toISOString();
            this.page = window.location.pathname;
            this.userId = this.getUserId();
            this.sessionId = this.getSessionId();
            this.stack = CONFIG.includeStackTrace ? this.captureStack() : null;
        }

        generateId() {
            return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        getUserId() {
            try {
                const user = JSON.parse(localStorage.getItem('enterprise_user') || '{}');
                return user.id || 'anonymous';
            } catch {
                return 'anonymous';
            }
        }

        getSessionId() {
            let sessionId = sessionStorage.getItem('session_id');
            if (!sessionId) {
                sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                sessionStorage.setItem('session_id', sessionId);
            }
            return sessionId;
        }

        captureStack() {
            const err = new Error();
            return err.stack?.split('\n').slice(2).join('\n') || null;
        }

        toJSON() {
            return {
                id: this.id,
                level: this.level,
                message: this.message,
                data: this.data,
                timestamp: this.timestamp,
                page: this.page,
                userId: this.userId,
                sessionId: this.sessionId,
                stack: this.stack,
            };
        }
    }

    // ==================== LOG STORE ====================
    class LogStore {
        constructor() {
            this.logs = [];
            this.buffer = [];
            this.loadFromStorage();
        }

        add(entry) {
            this.logs.push(entry);
            this.buffer.push(entry);

            // Trim if exceeds max
            if (this.logs.length > CONFIG.maxStorageEntries) {
                this.logs = this.logs.slice(-CONFIG.maxStorageEntries);
            }

            // Flush if buffer is full
            if (this.buffer.length >= CONFIG.batchSize) {
                this.flush();
            }

            this.saveToStorage();
        }

        flush() {
            if (this.buffer.length === 0) return;

            const batch = [...this.buffer];
            this.buffer = [];

            if (CONFIG.enableRemote && navigator.onLine) {
                this.sendToServer(batch);
            }
        }

        async sendToServer(batch) {
            try {
                if (window.EnterpriseConnector) {
                    const encoded = window.EnterpriseConnector.encode(batch);
                    await window.EnterpriseConnector.request(CONFIG.remoteEndpoint, {
                        action: CONFIG.remoteEndpoint,
                        logs: encoded,
                    });
                }
            } catch (error) {
                // Re-add to buffer
                this.buffer = [...batch, ...this.buffer];
            }
        }

        saveToStorage() {
            if (!CONFIG.enableStorage) return;
            
            try {
                const recent = this.logs.slice(-100); // Save last 100
                localStorage.setItem('app_logs', JSON.stringify(recent.map(l => l.toJSON())));
            } catch (e) {
                // Storage full, clear old logs
                this.logs = this.logs.slice(-50);
            }
        }

        loadFromStorage() {
            try {
                const saved = localStorage.getItem('app_logs');
                if (saved) {
                    this.logs = JSON.parse(saved);
                }
            } catch (e) {
                this.logs = [];
            }
        }

        getLogs(level = null, limit = 50) {
            let filtered = this.logs;
            if (level) {
                filtered = filtered.filter(l => l.level === level);
            }
            return filtered.slice(-limit);
        }

        search(query) {
            const lower = query.toLowerCase();
            return this.logs.filter(l => 
                l.message.toLowerCase().includes(lower) ||
                JSON.stringify(l.data).toLowerCase().includes(lower)
            );
        }

        clear() {
            this.logs = [];
            this.buffer = [];
            localStorage.removeItem('app_logs');
        }
    }

    // ==================== LOGGER CLASS ====================
    class Logger {
        constructor() {
            this.store = new LogStore();
            this.flushTimer = null;
        }

        /**
         * Start logger
         */
        start() {
            this.flushTimer = setInterval(() => {
                this.store.flush();
            }, CONFIG.flushInterval);

            this.info('Logger started', { version: '3.0.0' });
        }

        /**
         * Stop logger
         */
        stop() {
            if (this.flushTimer) {
                clearInterval(this.flushTimer);
                this.flushTimer = null;
            }
            this.store.flush();
        }

        /**
         * Log at specific level
         */
        log(level, message, data = {}) {
            if (LOG_LEVELS[level] < CONFIG.level) return;

            const entry = new LogEntry(level, message, data);

            // Console output
            if (CONFIG.enableConsole) {
                const consoleMethod = level === 'ERROR' || level === 'FATAL' ? 'error' 
                    : level === 'WARN' ? 'warn' 
                    : level === 'DEBUG' ? 'debug' 
                    : 'log';

                const prefix = `[${level}]`;
                const timestamp = new Date().toLocaleTimeString();

                if (Object.keys(data).length > 0) {
                    console[consoleMethod](`${prefix} ${timestamp} - ${message}`, data);
                } else {
                    console[consoleMethod](`${prefix} ${timestamp} - ${message}`);
                }
            }

            // Store
            this.store.add(entry);
        }

        trace(message, data) { this.log('TRACE', message, data); }
        debug(message, data) { this.log('DEBUG', message, data); }
        info(message, data) { this.log('INFO', message, data); }
        warn(message, data) { this.log('WARN', message, data); }
        error(message, data) { this.log('ERROR', message, data); }
        fatal(message, data) { this.log('FATAL', message, data); }

        /**
         * Get logs
         */
        getLogs(level, limit) {
            return this.store.getLogs(level, limit);
        }

        /**
         * Search logs
         */
        search(query) {
            return this.store.search(query);
        }

        /**
         * Clear logs
         */
        clear() {
            this.store.clear();
        }

        /**
         * Set log level
         */
        setLevel(level) {
            if (LOG_LEVELS[level] !== undefined) {
                CONFIG.level = LOG_LEVELS[level];
            }
        }

        /**
         * Get log stats
         */
        getStats() {
            const logs = this.store.logs;
            const levels = {};
            
            logs.forEach(l => {
                levels[l.level] = (levels[l.level] || 0) + 1;
            });

            return {
                total: logs.length,
                levels,
                bufferSize: this.store.buffer.length,
            };
        }
    }

    // ==================== INITIALIZE ====================
    const logger = new Logger();
    logger.start();

    // ==================== PUBLIC API ====================
    return {
        trace: (msg, data) => logger.trace(msg, data),
        debug: (msg, data) => logger.debug(msg, data),
        info: (msg, data) => logger.info(msg, data),
        warn: (msg, data) => logger.warn(msg, data),
        error: (msg, data) => logger.error(msg, data),
        fatal: (msg, data) => logger.fatal(msg, data),

        getLogs: (level, limit) => logger.getLogs(level, limit),
        search: (query) => logger.search(query),
        clear: () => logger.clear(),
        setLevel: (level) => logger.setLevel(level),
        getStats: () => logger.getStats(),

        // Log levels
        levels: LOG_LEVELS,
    };
})();

window.EnterpriseLogger = EnterpriseLogger;
