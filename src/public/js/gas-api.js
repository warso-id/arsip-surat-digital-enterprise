/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Google Apps Script API Handler
 * ============================================================
 * Handles all communication with Google Apps Script
 * using Base64 encoding system
 * ============================================================
 */

const GASAPI = (() => {
    'use strict';

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        // Primary Google Apps Script Web App URL
        baseUrl: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
        
        // Request settings
        timeout: 30000,
        maxRetries: 3,
        retryDelay: 1000,
        useBase64: true,
        
        // Cache settings
        cacheEnabled: true,
        cacheDuration: 300000, // 5 minutes
        
        // API Version
        version: '3.0.0',
    };

    // ==================== REQUEST CACHE ====================
    const requestCache = new Map();

    // ==================== PENDING QUEUE (OFFLINE SUPPORT) ====================
    let pendingQueue = [];
    
    // Load pending queue from localStorage
    try {
        const saved = localStorage.getItem('gas_pending_queue');
        if (saved) {
            pendingQueue = JSON.parse(saved);
        }
    } catch (error) {
        console.warn('Failed to load pending queue:', error);
    }

    // ==================== BASE64 ENCODER/DECODER ====================
    const Base64 = {
        /**
         * Encode data to Base64 (UTF-8 safe)
         */
        encode(data) {
            try {
                if (typeof data === 'object') {
                    data = JSON.stringify(data);
                }
                return btoa(unescape(encodeURIComponent(data)));
            } catch (error) {
                console.error('Base64 encode error:', error);
                throw new Error('Failed to encode data to Base64');
            }
        },

        /**
         * Decode Base64 to string (UTF-8 safe)
         */
        decode(encoded) {
            try {
                return decodeURIComponent(escape(atob(encoded)));
            } catch (error) {
                console.error('Base64 decode error:', error);
                throw new Error('Failed to decode Base64 data');
            }
        },

        /**
         * Encode object to Base64
         */
        encodeObject(obj) {
            return this.encode(JSON.stringify(obj));
        },

        /**
         * Decode Base64 to object
         */
        decodeObject(encoded) {
            try {
                return JSON.parse(this.decode(encoded));
            } catch (error) {
                console.error('Base64 decode object error:', error);
                return null;
            }
        },

        /**
         * Check if string is valid Base64
         */
        isValid(str) {
            if (typeof str !== 'string') return false;
            const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
            return base64Regex.test(str) && str.length % 4 === 0;
        },

        /**
         * Encode file to Base64
         */
        async encodeFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve({
                        data: base64,
                        fileName: file.name,
                        mimeType: file.type,
                        size: file.size,
                        lastModified: file.lastModified
                    });
                };
                reader.onerror = () => reject(new Error('Failed to encode file'));
                reader.readAsDataURL(file);
            });
        },

        /**
         * Decode Base64 to Blob
         */
        decodeToBlob(base64, mimeType = 'application/octet-stream') {
            const byteChars = atob(base64);
            const byteArrays = [];
            
            for (let offset = 0; offset < byteChars.length; offset += 512) {
                const slice = byteChars.slice(offset, offset + 512);
                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                byteArrays.push(new Uint8Array(byteNumbers));
            }
            
            return new Blob(byteArrays, { type: mimeType });
        },

        /**
         * Decode Base64 and trigger download
         */
        downloadFile(base64, fileName, mimeType) {
            const blob = this.decodeToBlob(base64, mimeType);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    // ==================== API REQUEST CLASS ====================
    class APIRequest {
        constructor() {
            this.pendingRequests = new Map();
            this.requestId = 0;
        }

        /**
         * Generate unique request ID
         */
        generateRequestId() {
            this.requestId++;
            return `req_${Date.now()}_${this.requestId}_${Math.random().toString(36).substr(2, 9)}`;
        }

        /**
         * Main API call method
         */
        async call(endpoint, params = {}, options = {}) {
            const defaultOptions = {
                method: 'GET',
                timeout: CONFIG.timeout,
                retries: CONFIG.maxRetries,
                useBase64: CONFIG.useBase64,
                requireAuth: true,
                cache: false,
                cacheDuration: CONFIG.cacheDuration,
            };

            const opts = { ...defaultOptions, ...options };
            const requestId = this.generateRequestId();

            // Check cache
            if (opts.cache && opts.method === 'GET') {
                const cacheKey = this.getCacheKey(endpoint, params);
                const cached = this.getFromCache(cacheKey);
                if (cached) {
                    console.log(`📦 Cache hit: ${endpoint}`);
                    return cached;
                }
            }

            // Prepare parameters
            const preparedParams = await this.prepareParams(params, opts);

            // Build request URL
            const url = this.buildUrl(endpoint, preparedParams, opts);

            // Execute request with retry logic
            try {
                const response = await this.executeWithRetry(url, requestId, opts);
                
                // Cache response if needed
                if (opts.cache && opts.method === 'GET') {
                    const cacheKey = this.getCacheKey(endpoint, params);
                    this.setCache(cacheKey, response, opts.cacheDuration);
                }

                return response;
            } catch (error) {
                // If offline, queue request
                if (!navigator.onLine && opts.method !== 'GET') {
                    this.queueRequest(endpoint, params, opts);
                    return {
                        success: true,
                        queued: true,
                        message: 'Request queued for sync when online'
                    };
                }
                throw error;
            }
        }

        /**
         * Prepare parameters for request
         */
        async prepareParams(params, opts) {
            const prepared = { ...params };

            // Add authentication token
            if (opts.requireAuth) {
                const token = localStorage.getItem('enterprise_token');
                if (token) {
                    prepared._token = token;
                }
            }

            // Add metadata
            prepared._timestamp = Date.now();
            prepared._version = CONFIG.version;
            prepared._deviceInfo = Base64.encode(JSON.stringify({
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screenSize: `${window.screen.width}x${window.screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }));

            // Handle file data
            if (params.file) {
                prepared._hasFile = true;
                prepared.fileData = params.file;
            }

            return prepared;
        }

        /**
         * Build URL with Base64 encoded parameters
         */
        buildUrl(endpoint, params, opts) {
            const url = new URL(CONFIG.baseUrl);
            
            // Set action/endpoint
            url.searchParams.set('action', endpoint);
            
            // Encode all parameters to Base64
            if (opts.useBase64) {
                const jsonStr = JSON.stringify(params);
                const encoded = Base64.encode(jsonStr);
                url.searchParams.set('data', encoded);
            } else {
                // Fallback: send as individual params
                Object.entries(params).forEach(([key, value]) => {
                    if (typeof value === 'object') {
                        url.searchParams.set(key, JSON.stringify(value));
                    } else {
                        url.searchParams.set(key, value);
                    }
                });
            }
            
            // Cache busting
            url.searchParams.set('_t', Date.now());
            
            return url.toString();
        }

        /**
         * Execute request with JSONP (for Google Apps Script CORS)
         */
        executeWithRetry(url, requestId, opts, attempt = 0) {
            return new Promise((resolve, reject) => {
                const callbackName = `gasCallback_${requestId}`;
                
                // Set timeout
                const timeoutId = setTimeout(() => {
                    cleanup();
                    
                    if (attempt < opts.retries) {
                        console.log(`🔄 Retrying request ${requestId} (attempt ${attempt + 1}/${opts.retries})...`);
                        setTimeout(() => {
                            this.executeWithRetry(url, requestId, opts, attempt + 1)
                                .then(resolve)
                                .catch(reject);
                        }, CONFIG.retryDelay * Math.pow(2, attempt));
                    } else {
                        reject(new Error(`Request timeout after ${opts.retries} retries`));
                    }
                }, opts.timeout);

                // Create global callback
                window[callbackName] = function(response) {
                    cleanup();
                    
                    try {
                        // Try to decode Base64 response
                        if (typeof response === 'string' && Base64.isValid(response)) {
                            const decoded = Base64.decode(response);
                            response = JSON.parse(decoded);
                        }
                        
                        if (response && response.error) {
                            reject(new Error(response.error));
                        } else {
                            resolve(response);
                        }
                    } catch (error) {
                        resolve(response);
                    }
                };

                // Create script element for JSONP
                const script = document.createElement('script');
                script.src = `${url}&callback=${callbackName}&format=jsonp`;
                script.async = true;
                
                script.onerror = function() {
                    cleanup();
                    
                    if (attempt < opts.retries) {
                        console.log(`🔄 Retrying after network error (attempt ${attempt + 1}/${opts.retries})...`);
                        setTimeout(() => {
                            this.executeWithRetry(url, requestId, opts, attempt + 1)
                                .then(resolve)
                                .catch(reject);
                        }, CONFIG.retryDelay * Math.pow(2, attempt));
                    } else {
                        reject(new Error('Network error'));
                    }
                }.bind(this);

                // Cleanup function
                function cleanup() {
                    clearTimeout(timeoutId);
                    delete window[callbackName];
                    if (script.parentNode) {
                        script.parentNode.removeChild(script);
                    }
                }

                // Append to document
                document.head.appendChild(script);
            });
        }

        /**
         * POST request using fetch with no-cors
         */
        async post(endpoint, data = {}, options = {}) {
            const opts = { ...options, method: 'POST' };
            
            // For file uploads
            if (data.file) {
                const formData = new FormData();
                formData.append('action', endpoint);
                
                // Encode data to Base64
                const encodedData = Base64.encodeObject(data);
                formData.append('data', encodedData);
                
                try {
                    const response = await fetch(CONFIG.baseUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        body: formData
                    });
                    return { success: true, message: 'Data sent successfully' };
                } catch (error) {
                    throw new Error(`POST request failed: ${error.message}`);
                }
            }
            
            return this.call(endpoint, data, opts);
        }

        /**
         * Upload file
         */
        async uploadFile(endpoint, file, additionalParams = {}) {
            const fileData = await Base64.encodeFile(file);
            
            const params = {
                ...additionalParams,
                fileName: fileData.fileName,
                mimeType: fileData.mimeType,
                fileSize: fileData.size,
                fileData: fileData.data,
            };

            return this.post(endpoint, params, { timeout: 120000 });
        }

        /**
         * Queue request for offline sync
         */
        queueRequest(endpoint, params, opts) {
            const queueItem = {
                endpoint,
                params,
                opts,
                timestamp: Date.now(),
                id: this.generateRequestId()
            };
            
            pendingQueue.push(queueItem);
            this.saveQueue();
            
            console.log(`📝 Request queued: ${endpoint}`);
        }

        /**
         * Save pending queue to localStorage
         */
        saveQueue() {
            try {
                localStorage.setItem('gas_pending_queue', JSON.stringify(pendingQueue));
            } catch (error) {
                console.warn('Failed to save pending queue:', error);
            }
        }

        /**
         * Process pending queue
         */
        async processQueue() {
            if (!navigator.onLine || pendingQueue.length === 0) {
                return;
            }

            console.log(`🔄 Processing ${pendingQueue.length} pending requests...`);
            
            const queue = [...pendingQueue];
            pendingQueue = [];
            this.saveQueue();

            let successCount = 0;
            let failCount = 0;

            for (const item of queue) {
                try {
                    await this.call(item.endpoint, item.params, item.opts);
                    successCount++;
                } catch (error) {
                    console.error(`Failed to process queued request: ${item.endpoint}`, error);
                    pendingQueue.push(item);
                    failCount++;
                }
            }

            this.saveQueue();
            console.log(`✅ Queue processed: ${successCount} success, ${failCount} failed`);
        }

        /**
         * Cache management
         */
        getCacheKey(endpoint, params) {
            const key = `${endpoint}:${JSON.stringify(params)}`;
            return Base64.encode(key);
        }

        getFromCache(cacheKey) {
            const cached = requestCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < cached.duration) {
                return cached.data;
            }
            requestCache.delete(cacheKey);
            return null;
        }

        setCache(cacheKey, data, duration) {
            requestCache.set(cacheKey, {
                data,
                timestamp: Date.now(),
                duration
            });
        }

        clearCache() {
            requestCache.clear();
        }
    }

    // ==================== API ENDPOINTS ====================
    const ENDPOINTS = {
        // Authentication
        AUTH: {
            LOGIN: 'auth/login',
            LOGOUT: 'auth/logout',
            REFRESH: 'auth/refresh',
            VERIFY: 'auth/verify',
            CHANGE_PASSWORD: 'auth/change-password',
        },
        // Surat Masuk
        SURAT_MASUK: {
            LIST: 'surat-masuk/list',
            DETAIL: 'surat-masuk/detail',
            CREATE: 'surat-masuk/create',
            UPDATE: 'surat-masuk/update',
            DELETE: 'surat-masuk/delete',
            SEARCH: 'surat-masuk/search',
            EXPORT: 'surat-masuk/export',
        },
        // Surat Keluar
        SURAT_KELUAR: {
            LIST: 'surat-keluar/list',
            DETAIL: 'surat-keluar/detail',
            CREATE: 'surat-keluar/create',
            UPDATE: 'surat-keluar/update',
            DELETE: 'surat-keluar/delete',
            SEARCH: 'surat-keluar/search',
            EXPORT: 'surat-keluar/export',
        },
        // Disposisi
        DISPOSISI: {
            LIST: 'disposisi/list',
            DETAIL: 'disposisi/detail',
            CREATE: 'disposisi/create',
            UPDATE: 'disposisi/update',
            DELETE: 'disposisi/delete',
            TRACK: 'disposisi/track',
        },
        // Dashboard
        DASHBOARD: {
            STATS: 'dashboard/stats',
            CHARTS: 'dashboard/charts',
            ACTIVITIES: 'dashboard/activities',
        },
        // Laporan
        LAPORAN: {
            GENERATE: 'laporan/generate',
            PDF: 'laporan/pdf',
            EXCEL: 'laporan/excel',
        },
        // Users
        USERS: {
            LIST: 'users/list',
            DETAIL: 'users/detail',
            CREATE: 'users/create',
            UPDATE: 'users/update',
            DELETE: 'users/delete',
        },
        // Instansi
        INSTANSI: {
            LIST: 'instansi/list',
            DETAIL: 'instansi/detail',
            CREATE: 'instansi/create',
            UPDATE: 'instansi/update',
        },
        // Logs
        LOGS: {
            LIST: 'logs/list',
            CREATE: 'logs/create',
        },
        // System
        SYSTEM: {
            PING: 'system/ping',
            VERSION: 'system/version',
            HEALTH: 'system/health',
            BACKUP: 'system/backup',
            RESTORE: 'system/restore',
        },
    };

    // ==================== INITIALIZE API ====================
    const api = new APIRequest();

    // Process queue when coming online
    window.addEventListener('online', () => {
        console.log('🌐 Back online, processing pending queue...');
        api.processQueue();
    });

    // Process queue periodically
    setInterval(() => {
        if (navigator.onLine && pendingQueue.length > 0) {
            api.processQueue();
        }
    }, 30000); // Every 30 seconds

    // ==================== PUBLIC API ====================
    return {
        // Configuration
        config: CONFIG,
        
        // Base64 utilities
        base64: Base64,
        
        // API endpoints
        endpoints: ENDPOINTS,
        
        // Core methods
        call: (endpoint, params, options) => api.call(endpoint, params, options),
        post: (endpoint, data, options) => api.post(endpoint, data, options),
        upload: (endpoint, file, params) => api.uploadFile(endpoint, file, params),
        
        // Cache management
        clearCache: () => api.clearCache(),
        
        // Queue management
        getPendingCount: () => pendingQueue.length,
        processQueue: () => api.processQueue(),
        
        // Convenience methods for each module
        auth: {
            login: (email, password, remember) => api.call(ENDPOINTS.AUTH.LOGIN, { email, password, remember }),
            logout: () => api.call(ENDPOINTS.AUTH.LOGOUT),
            refresh: () => api.call(ENDPOINTS.AUTH.REFRESH),
            verify: (token) => api.call(ENDPOINTS.AUTH.VERIFY, { token }),
            changePassword: (oldPass, newPass) => api.call(ENDPOINTS.AUTH.CHANGE_PASSWORD, { oldPassword: oldPass, newPassword: newPass }),
        },
        
        suratMasuk: {
            list: (params) => api.call(ENDPOINTS.SURAT_MASUK.LIST, params),
            detail: (id) => api.call(ENDPOINTS.SURAT_MASUK.DETAIL, { id }),
            create: (data) => api.post(ENDPOINTS.SURAT_MASUK.CREATE, data),
            update: (id, data) => api.post(ENDPOINTS.SURAT_MASUK.UPDATE, { id, ...data }),
            delete: (id) => api.post(ENDPOINTS.SURAT_MASUK.DELETE, { id }),
            search: (query) => api.call(ENDPOINTS.SURAT_MASUK.SEARCH, { query }),
            export: (params) => api.call(ENDPOINTS.SURAT_MASUK.EXPORT, params),
        },
        
        suratKeluar: {
            list: (params) => api.call(ENDPOINTS.SURAT_KELUAR.LIST, params),
            detail: (id) => api.call(ENDPOINTS.SURAT_KELUAR.DETAIL, { id }),
            create: (data) => api.post(ENDPOINTS.SURAT_KELUAR.CREATE, data),
            update: (id, data) => api.post(ENDPOINTS.SURAT_KELUAR.UPDATE, { id, ...data }),
            delete: (id) => api.post(ENDPOINTS.SURAT_KELUAR.DELETE, { id }),
            search: (query) => api.call(ENDPOINTS.SURAT_KELUAR.SEARCH, { query }),
            export: (params) => api.call(ENDPOINTS.SURAT_KELUAR.EXPORT, params),
        },
        
        disposisi: {
            list: (params) => api.call(ENDPOINTS.DISPOSISI.LIST, params),
            detail: (id) => api.call(ENDPOINTS.DISPOSISI.DETAIL, { id }),
            create: (data) => api.post(ENDPOINTS.DISPOSISI.CREATE, data),
            update: (id, data) => api.post(ENDPOINTS.DISPOSISI.UPDATE, { id, ...data }),
            delete: (id) => api.post(ENDPOINTS.DISPOSISI.DELETE, { id }),
            track: (id) => api.call(ENDPOINTS.DISPOSISI.TRACK, { id }),
        },
        
        dashboard: {
            stats: () => api.call(ENDPOINTS.DASHBOARD.STATS),
            charts: (type) => api.call(ENDPOINTS.DASHBOARD.CHARTS, { type }),
            activities: (limit) => api.call(ENDPOINTS.DASHBOARD.ACTIVITIES, { limit }),
        },
        
        laporan: {
            generate: (params) => api.call(ENDPOINTS.LAPORAN.GENERATE, params),
            pdf: (params) => api.call(ENDPOINTS.LAPORAN.PDF, params),
            excel: (params) => api.call(ENDPOINTS.LAPORAN.EXCEL, params),
        },
        
        users: {
            list: (params) => api.call(ENDPOINTS.USERS.LIST, params),
            detail: (id) => api.call(ENDPOINTS.USERS.DETAIL, { id }),
            create: (data) => api.post(ENDPOINTS.USERS.CREATE, data),
            update: (id, data) => api.post(ENDPOINTS.USERS.UPDATE, { id, ...data }),
            delete: (id) => api.post(ENDPOINTS.USERS.DELETE, { id }),
        },
        
        instansi: {
            list: (params) => api.call(ENDPOINTS.INSTANSI.LIST, params),
            detail: (id) => api.call(ENDPOINTS.INSTANSI.DETAIL, { id }),
            create: (data) => api.post(ENDPOINTS.INSTANSI.CREATE, data),
            update: (id, data) => api.post(ENDPOINTS.INSTANSI.UPDATE, { id, ...data }),
        },
        
        system: {
            ping: () => api.call(ENDPOINTS.SYSTEM.PING),
            version: () => api.call(ENDPOINTS.SYSTEM.VERSION),
            health: () => api.call(ENDPOINTS.SYSTEM.HEALTH),
            backup: () => api.call(ENDPOINTS.SYSTEM.BACKUP),
            restore: (data) => api.post(ENDPOINTS.SYSTEM.RESTORE, data),
        },
    };
})();

// Export globally
window.GASAPI = GASAPI;
