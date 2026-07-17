/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Error Boundary & Recovery System
 * ============================================================
 * Catches errors across all pages and provides recovery options
 * ============================================================
 */

const EnterpriseErrorBoundary = (() => {
    'use strict';

    // ==================== ERROR TYPES ====================
    const ERROR_TYPES = {
        NETWORK: 'network_error',
        API: 'api_error',
        AUTH: 'auth_error',
        DATABASE: 'database_error',
        RENDER: 'render_error',
        SCRIPT: 'script_error',
        UNKNOWN: 'unknown_error',
    };

    // ==================== ERROR STORE ====================
    const errorStore = {
        errors: [],
        maxErrors: 100,
        
        add(error) {
            this.errors.push({
                ...error,
                id: Date.now() + Math.random(),
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
            });
            
            if (this.errors.length > this.maxErrors) {
                this.errors = this.errors.slice(-this.maxErrors);
            }
            
            this.persist();
        },
        
        persist() {
            try {
                localStorage.setItem('error_log', JSON.stringify(this.errors.slice(-20)));
            } catch (e) {}
        },
        
        getAll() {
            return this.errors;
        },
        
        clear() {
            this.errors = [];
            localStorage.removeItem('error_log');
        },
    };

    // ==================== ERROR HANDLER ====================
    class ErrorHandler {
        /**
         * Initialize error handling
         */
        init() {
            // Global error handler
            window.addEventListener('error', (event) => {
                this.handleError({
                    type: ERROR_TYPES.SCRIPT,
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    stack: event.error?.stack,
                    source: 'window.onerror',
                });
                
                // Prevent default browser error handling
                return false;
            });

            // Unhandled promise rejection
            window.addEventListener('unhandledrejection', (event) => {
                this.handleError({
                    type: ERROR_TYPES.UNKNOWN,
                    message: event.reason?.message || 'Unhandled Promise Rejection',
                    stack: event.reason?.stack,
                    source: 'unhandledrejection',
                });
            });

            // Console error interceptor
            const originalConsoleError = console.error;
            console.error = (...args) => {
                this.handleError({
                    type: ERROR_TYPES.UNKNOWN,
                    message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
                    source: 'console.error',
                });
                originalConsoleError.apply(console, args);
            };

            // Network error detection
            this.monitorNetworkErrors();
            
            // API error detection
            this.monitorAPIErrors();

            console.log('🛡️ Error Boundary initialized');
        }

        /**
         * Handle error
         */
        handleError(errorData) {
            const error = {
                ...errorData,
                handled: true,
            };

            // Categorize error
            error.category = this.categorizeError(error);

            // Store error
            errorStore.add(error);

            // Log to console (original)
            console.warn('🛡️ Error Boundary caught:', error.category, error.message);

            // Show user-friendly message
            this.showUserMessage(error);

            // Send to monitoring
            this.reportError(error);

            // Attempt recovery
            this.attemptRecovery(error);
        }

        /**
         * Categorize error
         */
        categorizeError(error) {
            if (error.type === ERROR_TYPES.NETWORK) return ERROR_TYPES.NETWORK;
            
            const message = (error.message || '').toLowerCase();
            
            if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
                return ERROR_TYPES.NETWORK;
            }
            if (message.includes('auth') || message.includes('token') || message.includes('unauthorized')) {
                return ERROR_TYPES.AUTH;
            }
            if (message.includes('database') || message.includes('indexeddb') || message.includes('storage')) {
                return ERROR_TYPES.DATABASE;
            }
            if (message.includes('render') || message.includes('dom') || message.includes('template')) {
                return ERROR_TYPES.RENDER;
            }
            if (error.source === 'gas-api' || message.includes('script.google.com')) {
                return ERROR_TYPES.API;
            }
            
            return ERROR_TYPES.UNKNOWN;
        }

        /**
         * Show user-friendly error message
         */
        showUserMessage(error) {
            const messages = {
                [ERROR_TYPES.NETWORK]: {
                    title: 'Masalah Koneksi',
                    message: 'Gagal terhubung ke server. Periksa koneksi internet Anda.',
                    action: 'Coba Lagi',
                    actionFn: () => window.location.reload(),
                },
                [ERROR_TYPES.API]: {
                    title: 'Server Error',
                    message: 'Server sedang mengalami masalah. Tim kami sedang menanganinya.',
                    action: 'Refresh',
                    actionFn: () => window.location.reload(),
                },
                [ERROR_TYPES.AUTH]: {
                    title: 'Sesi Berakhir',
                    message: 'Sesi Anda telah berakhir. Silakan login kembali.',
                    action: 'Login',
                    actionFn: () => window.location.href = '/login.html',
                },
                [ERROR_TYPES.DATABASE]: {
                    title: 'Database Error',
                    message: 'Gagal mengakses penyimpanan lokal. Data mungkin perlu direset.',
                    action: 'Reset Cache',
                    actionFn: () => {
                        localStorage.clear();
                        window.location.reload();
                    },
                },
                [ERROR_TYPES.RENDER]: {
                    title: 'Tampilan Error',
                    message: 'Gagal menampilkan halaman. Silakan refresh halaman.',
                    action: 'Refresh',
                    actionFn: () => window.location.reload(),
                },
                [ERROR_TYPES.UNKNOWN]: {
                    title: 'Terjadi Kesalahan',
                    message: 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.',
                    action: 'Refresh',
                    actionFn: () => window.location.reload(),
                },
            };

            const msg = messages[error.category] || messages[ERROR_TYPES.UNKNOWN];

            // Show notification if available
            if (window.EnterpriseRealtime) {
                window.EnterpriseRealtime.error(msg.title, msg.message);
            }

            // Show inline error if on a page
            this.showInlineError(msg);
        }

        /**
         * Show inline error on page
         */
        showInlineError(msg) {
            // Remove existing error overlay
            const existing = document.getElementById('error-boundary-overlay');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'error-boundary-overlay';
            overlay.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                max-width: 400px;
                background: white;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                z-index: 10000;
                border-left: 4px solid #ef4444;
                animation: slideInRight 0.3s ease;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;

            overlay.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <strong style="color: #1f2937;">⚠️ ${msg.title}</strong>
                    <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; cursor: pointer; font-size: 18px; color: #9ca3af;">✕</button>
                </div>
                <p style="color: #6b7280; font-size: 13px; margin-bottom: 12px;">${msg.message}</p>
                <button onclick="this.closest('#error-boundary-overlay').remove(); (${msg.actionFn.toString()})()" 
                        style="padding: 8px 16px; background: #1a56db; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">
                    ${msg.action}
                </button>
            `;

            document.body.appendChild(overlay);

            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (overlay.parentNode) overlay.remove();
            }, 10000);
        }

        /**
         * Report error to monitoring
         */
        reportError(error) {
            try {
                if (window.EnterpriseMonitor) {
                    window.EnterpriseMonitor.error(error.message, error);
                }
                
                // Send to Google Apps Script
                if (window.EnterpriseConnector && window.EnterpriseConnector.getStatus().status === 'connected') {
                    window.EnterpriseConnector.request('system/error', {
                        action: 'system/error',
                        error: window.EnterpriseConnector.encode(error),
                    }).catch(() => {});
                }
            } catch (e) {
                // Silent fail
            }
        }

        /**
         * Attempt recovery based on error type
         */
        attemptRecovery(error) {
            switch (error.category) {
                case ERROR_TYPES.AUTH:
                    // Clear auth and redirect to login
                    setTimeout(() => {
                        localStorage.removeItem('enterprise_token');
                        localStorage.removeItem('enterprise_user');
                        if (!window.location.href.includes('login.html')) {
                            window.location.href = '/login.html';
                        }
                    }, 3000);
                    break;
                    
                case ERROR_TYPES.NETWORK:
                    // Start retry mechanism
                    this.retryConnection();
                    break;
                    
                case ERROR_TYPES.DATABASE:
                    // Attempt database recovery
                    this.recoverDatabase();
                    break;
            }
        }

        /**
         * Retry connection
         */
        retryConnection() {
            let retries = 0;
            const maxRetries = 5;
            
            const retry = setInterval(async () => {
                retries++;
                
                if (navigator.onLine) {
                    try {
                        if (window.EnterpriseConnector) {
                            await window.EnterpriseConnector.ping();
                        }
                        clearInterval(retry);
                        console.log('✅ Connection restored');
                        window.location.reload();
                    } catch (e) {
                        console.log(`Retry ${retries}/${maxRetries} failed`);
                    }
                }
                
                if (retries >= maxRetries) {
                    clearInterval(retry);
                }
            }, 5000);
        }

        /**
         * Recover database
         */
        recoverDatabase() {
            try {
                // Backup important data before reset
                const token = localStorage.getItem('enterprise_token');
                const user = localStorage.getItem('enterprise_user');
                
                // Reset IndexedDB
                if (window.EnterpriseDB) {
                    window.EnterpriseDB.close();
                }
                
                const deleteRequest = indexedDB.deleteDatabase('ArsipSuratEnterprise');
                deleteRequest.onsuccess = () => {
                    // Restore critical data
                    if (token) localStorage.setItem('enterprise_token', token);
                    if (user) localStorage.setItem('enterprise_user', user);
                    
                    console.log('✅ Database recovered');
                    window.location.reload();
                };
            } catch (e) {
                console.error('Database recovery failed:', e);
            }
        }

        /**
         * Monitor network errors
         */
        monitorNetworkErrors() {
            // Intercept fetch errors
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                try {
                    const response = await originalFetch(...args);
                    return response;
                } catch (error) {
                    this.handleError({
                        type: ERROR_TYPES.NETWORK,
                        message: `Fetch failed: ${error.message}`,
                        source: 'fetch',
                        url: args[0],
                    });
                    throw error;
                }
            };
        }

        /**
         * Monitor API errors
         */
        monitorAPIErrors() {
            // Listen for API error events
            window.addEventListener('gas-api-error', (event) => {
                this.handleError({
                    type: ERROR_TYPES.API,
                    message: event.detail?.message || 'API Error',
                    source: 'gas-api',
                    details: event.detail,
                });
            });
        }

        /**
         * Get error statistics
         */
        getStats() {
            const errors = errorStore.getAll();
            const categories = {};
            
            errors.forEach(error => {
                categories[error.category] = (categories[error.category] || 0) + 1;
            });
            
            return {
                total: errors.length,
                categories,
                latest: errors[errors.length - 1] || null,
            };
        }
    }

    // ==================== INITIALIZE ====================
    const errorHandler = new ErrorHandler();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => errorHandler.init());
    } else {
        errorHandler.init();
    }

    // ==================== PUBLIC API ====================
    return {
        handleError: (error) => errorHandler.handleError(error),
        getStats: () => errorHandler.getStats(),
        clearErrors: () => errorStore.clear(),
        getErrors: () => errorStore.getAll(),
        
        // Wrap function with error boundary
        wrap: (fn, errorContext = {}) => {
            return async (...args) => {
                try {
                    return await fn(...args);
                } catch (error) {
                    errorHandler.handleError({
                        ...errorContext,
                        message: error.message,
                        stack: error.stack,
                    });
                    throw error;
                }
            };
        },
        
        // Safe execute (returns fallback on error)
        safeExecute: async (fn, fallback = null) => {
            try {
                return await fn();
            } catch (error) {
                errorHandler.handleError({
                    message: error.message,
                    stack: error.stack,
                });
                return fallback;
            }
        },
    };
})();

window.EnterpriseErrorBoundary = EnterpriseErrorBoundary;
