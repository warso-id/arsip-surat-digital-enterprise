/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Universal Connector - All Pages to Google Apps Script
 * ============================================================
 * This file establishes the connection between ALL pages
 * and the Google Apps Script backend using Base64 encoding.
 * Include this file in EVERY HTML page.
 * ============================================================
 */

const EnterpriseConnector = (() => {
    'use strict';

    // ==================== CONNECTION CONFIGURATION ====================
    const CONNECTION = {
        // Primary Google Apps Script URL
        gasUrl: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
        
        // Connection status
        status: 'disconnected', // disconnected, connecting, connected, error
        lastPing: null,
        latency: 0,
        
        // Retry configuration
        maxRetries: 5,
        retryDelay: 2000,
        retryCount: 0,
        
        // Health check interval
        healthCheckInterval: 30000, // 30 seconds
        healthCheckTimer: null,
    };

    // ==================== BASE64 CODEC ====================
    const Base64Codec = {
        encode(data) {
            try {
                if (typeof data === 'object') data = JSON.stringify(data);
                return btoa(unescape(encodeURIComponent(data)));
            } catch (e) {
                console.error('Base64 encode error:', e);
                return null;
            }
        },
        
        decode(encoded) {
            try {
                return decodeURIComponent(escape(atob(encoded)));
            } catch (e) {
                console.error('Base64 decode error:', e);
                return null;
            }
        },
        
        encodeObject(obj) { return this.encode(JSON.stringify(obj)); },
        decodeObject(encoded) { return JSON.parse(this.decode(encoded)); },
    };

    // ==================== JSONP REQUEST HANDLER ====================
    class JsonpRequest {
        constructor() {
            this.pendingRequests = new Map();
            this.requestIdCounter = 0;
        }

        /**
         * Send JSONP request to Google Apps Script
         */
        send(action, data = {}, options = {}) {
            return new Promise((resolve, reject) => {
                const requestId = `req_${++this.requestIdCounter}_${Date.now()}`;
                const callbackName = `gasCallback_${requestId}`;
                
                // Prepare payload
                const payload = {
                    ...data,
                    _requestId: requestId,
                    _timestamp: Date.now(),
                    _version: '3.0.0',
                    _page: window.location.pathname.split('/').pop() || 'index.html',
                };
                
                // Add auth token if available
                const token = localStorage.getItem('enterprise_token');
                if (token) payload._token = token;
                
                // Encode to Base64
                const encoded = Base64Codec.encodeObject(payload);
                if (!encoded) {
                    reject(new Error('Base64 encoding failed'));
                    return;
                }
                
                // Build URL
                const url = new URL(CONNECTION.gasUrl);
                url.searchParams.set('action', action);
                url.searchParams.set('data', encoded);
                url.searchParams.set('callback', callbackName);
                url.searchParams.set('_t', Date.now());
                
                // Set timeout
                const timeout = setTimeout(() => {
                    this.cleanup(requestId, callbackName);
                    reject(new Error(`Request timeout: ${action}`));
                }, options.timeout || 30000);
                
                // Register callback
                window[callbackName] = (response) => {
                    clearTimeout(timeout);
                    this.cleanup(requestId, callbackName);
                    
                    try {
                        // Try to decode Base64 response
                        if (typeof response === 'string' && response.startsWith('ey')) {
                            response = Base64Codec.decodeObject(response);
                        }
                        resolve(response);
                    } catch (e) {
                        resolve(response);
                    }
                };
                
                // Create script element
                const script = document.createElement('script');
                script.src = url.toString();
                script.async = true;
                script.onerror = () => {
                    clearTimeout(timeout);
                    this.cleanup(requestId, callbackName);
                    reject(new Error(`Network error: ${action}`));
                };
                
                // Track pending request
                this.pendingRequests.set(requestId, { script, callbackName, timeout });
                
                // Append to DOM
                document.head.appendChild(script);
            });
        }

        cleanup(requestId, callbackName) {
            const pending = this.pendingRequests.get(requestId);
            if (pending) {
                if (pending.script.parentNode) {
                    pending.script.parentNode.removeChild(pending.script);
                }
                clearTimeout(pending.timeout);
                this.pendingRequests.delete(requestId);
            }
            delete window[callbackName];
        }

        cancelAll() {
            this.pendingRequests.forEach((pending, requestId) => {
                this.cleanup(requestId, pending.callbackName);
            });
        }
    }

    // ==================== CONNECTION MANAGER ====================
    class ConnectionManager {
        constructor() {
            this.jsonp = new JsonpRequest();
            this.listeners = [];
            this.isOnline = navigator.onLine;
        }

        /**
         * Initialize connection
         */
        async init() {
            console.log('🔗 Initializing Enterprise Connector...');
            console.log('📡 Target:', CONNECTION.gasUrl);
            
            CONNECTION.status = 'connecting';
            this.notifyListeners('connecting');
            
            try {
                // Test connection
                const result = await this.ping();
                
                if (result.success) {
                    CONNECTION.status = 'connected';
                    CONNECTION.latency = result.latency || 0;
                    CONNECTION.lastPing = Date.now();
                    CONNECTION.retryCount = 0;
                    
                    console.log(`✅ Connected to Google Apps Script (latency: ${CONNECTION.latency}ms)`);
                    this.notifyListeners('connected', { latency: CONNECTION.latency });
                    
                    // Start health check
                    this.startHealthCheck();
                } else {
                    throw new Error('Connection test failed');
                }
            } catch (error) {
                console.warn('⚠️ Google Apps Script connection failed:', error.message);
                CONNECTION.status = 'error';
                this.notifyListeners('error', { error: error.message });
                
                // Retry connection
                this.scheduleRetry();
            }
            
            // Listen for online/offline events
            this.setupNetworkListeners();
            
            return CONNECTION.status;
        }

        /**
         * Ping Google Apps Script
         */
        async ping() {
            const startTime = Date.now();
            
            try {
                const response = await this.jsonp.send('system/ping', {}, { timeout: 10000 });
                const latency = Date.now() - startTime;
                
                return {
                    success: response?.success || response?.message === 'pong',
                    latency,
                    response,
                };
            } catch (error) {
                return {
                    success: false,
                    latency: Date.now() - startTime,
                    error: error.message,
                };
            }
        }

        /**
         * Send request through connector
         */
        async request(action, data = {}, options = {}) {
            // Check connection
            if (CONNECTION.status !== 'connected') {
                // Try to reconnect
                await this.init();
                
                if (CONNECTION.status !== 'connected') {
                    // Queue for offline
                    this.queueOffline(action, data);
                    return {
                        success: true,
                        queued: true,
                        message: 'Request queued for offline processing',
                    };
                }
            }
            
            try {
                const response = await this.jsonp.send(action, data, options);
                return response;
            } catch (error) {
                // Queue for retry
                this.queueOffline(action, data);
                throw error;
            }
        }

        /**
         * Queue request for offline processing
         */
        queueOffline(action, data) {
            try {
                const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
                queue.push({
                    action,
                    data,
                    timestamp: Date.now(),
                });
                localStorage.setItem('offline_queue', JSON.stringify(queue.slice(-50))); // Keep last 50
            } catch (e) {
                console.warn('Failed to queue offline request:', e);
            }
        }

        /**
         * Process offline queue
         */
        async processOfflineQueue() {
            if (CONNECTION.status !== 'connected') return;
            
            try {
                const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
                if (queue.length === 0) return;
                
                console.log(`🔄 Processing ${queue.length} offline requests...`);
                
                const successful = [];
                const failed = [];
                
                for (const item of queue) {
                    try {
                        await this.jsonp.send(item.action, item.data);
                        successful.push(item);
                    } catch (error) {
                        failed.push(item);
                    }
                }
                
                // Save failed items back
                localStorage.setItem('offline_queue', JSON.stringify(failed));
                
                console.log(`✅ Processed: ${successful.length} success, ${failed.length} failed`);
            } catch (e) {
                console.warn('Failed to process offline queue:', e);
            }
        }

        /**
         * Schedule reconnection
         */
        scheduleRetry() {
            if (CONNECTION.retryCount >= CONNECTION.maxRetries) {
                console.warn('❌ Max retries reached. Connection failed.');
                return;
            }
            
            CONNECTION.retryCount++;
            const delay = CONNECTION.retryDelay * Math.pow(2, CONNECTION.retryCount - 1);
            
            console.log(`🔄 Retrying connection in ${delay}ms (attempt ${CONNECTION.retryCount}/${CONNECTION.maxRetries})...`);
            
            setTimeout(() => {
                this.init();
            }, delay);
        }

        /**
         * Start health check
         */
        startHealthCheck() {
            this.stopHealthCheck();
            
            CONNECTION.healthCheckTimer = setInterval(async () => {
                const result = await this.ping();
                
                if (result.success) {
                    CONNECTION.lastPing = Date.now();
                    CONNECTION.latency = result.latency;
                    
                    if (CONNECTION.status !== 'connected') {
                        CONNECTION.status = 'connected';
                        this.notifyListeners('connected');
                        this.processOfflineQueue();
                    }
                } else if (CONNECTION.status === 'connected') {
                    CONNECTION.status = 'error';
                    this.notifyListeners('error');
                }
            }, CONNECTION.healthCheckInterval);
        }

        /**
         * Stop health check
         */
        stopHealthCheck() {
            if (CONNECTION.healthCheckTimer) {
                clearInterval(CONNECTION.healthCheckTimer);
                CONNECTION.healthCheckTimer = null;
            }
        }

        /**
         * Setup network listeners
         */
        setupNetworkListeners() {
            window.addEventListener('online', () => {
                console.log('🌐 Network: ONLINE');
                this.isOnline = true;
                this.init();
                this.processOfflineQueue();
            });
            
            window.addEventListener('offline', () => {
                console.log('📡 Network: OFFLINE');
                this.isOnline = false;
                CONNECTION.status = 'disconnected';
                this.notifyListeners('offline');
            });
        }

        /**
         * Subscribe to connection events
         */
        subscribe(listener) {
            this.listeners.push(listener);
            return () => {
                this.listeners = this.listeners.filter(l => l !== listener);
            };
        }

        /**
         * Notify all listeners
         */
        notifyListeners(event, data = {}) {
            this.listeners.forEach(listener => {
                try {
                    listener(event, { ...data, status: CONNECTION.status });
                } catch (e) {
                    console.error('Listener error:', e);
                }
            });
        }

        /**
         * Get connection status
         */
        getStatus() {
            return {
                status: CONNECTION.status,
                latency: CONNECTION.latency,
                lastPing: CONNECTION.lastPing,
                retryCount: CONNECTION.retryCount,
                isOnline: this.isOnline,
                gasUrl: CONNECTION.gasUrl,
            };
        }

        /**
         * Get Base64 codec
         */
        getCodec() {
            return Base64Codec;
        }
    }

    // ==================== INITIALIZE ====================
    const connectionManager = new ConnectionManager();

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => connectionManager.init());
    } else {
        connectionManager.init();
    }

    // ==================== PUBLIC API ====================
    return {
        // Connection management
        connect: () => connectionManager.init(),
        disconnect: () => connectionManager.stopHealthCheck(),
        ping: () => connectionManager.ping(),
        getStatus: () => connectionManager.getStatus(),
        
        // Request methods
        request: (action, data, options) => connectionManager.request(action, data, options),
        
        // Base64 utilities
        base64: Base64Codec,
        encode: (data) => Base64Codec.encodeObject(data),
        decode: (encoded) => Base64Codec.decodeObject(encoded),
        
        // Queue management
        processQueue: () => connectionManager.processOfflineQueue(),
        
        // Event subscription
        subscribe: (listener) => connectionManager.subscribe(listener),
        onConnected: (callback) => connectionManager.subscribe((event, data) => {
            if (event === 'connected') callback(data);
        }),
        onDisconnected: (callback) => connectionManager.subscribe((event, data) => {
            if (event === 'offline' || event === 'error') callback(data);
        }),
        
        // Convenience API methods
        api: {
            // Auth
            login: (email, password) => connectionManager.request('auth/login', { email, password, action: 'auth/login' }),
            logout: () => connectionManager.request('auth/logout', { action: 'auth/logout' }),
            
            // Surat Masuk
            getSuratMasuk: (params) => connectionManager.request('surat-masuk/list', { ...params, action: 'surat-masuk/list' }),
            createSuratMasuk: (data) => connectionManager.request('surat-masuk/create', { ...data, action: 'surat-masuk/create' }),
            
            // Surat Keluar
            getSuratKeluar: (params) => connectionManager.request('surat-keluar/list', { ...params, action: 'surat-keluar/list' }),
            createSuratKeluar: (data) => connectionManager.request('surat-keluar/create', { ...data, action: 'surat-keluar/create' }),
            
            // Disposisi
            getDisposisi: (params) => connectionManager.request('disposisi/list', { ...params, action: 'disposisi/list' }),
            createDisposisi: (data) => connectionManager.request('disposisi/create', { ...data, action: 'disposisi/create' }),
            
            // Dashboard
            getDashboardStats: () => connectionManager.request('dashboard/stats', { action: 'dashboard/stats' }),
            
            // System
            ping: () => connectionManager.ping(),
            getVersion: () => connectionManager.request('system/version', { action: 'system/version' }),
        },
    };
})();

// Export globally - THIS MUST BE AVAILABLE ON EVERY PAGE
window.EnterpriseConnector = EnterpriseConnector;
