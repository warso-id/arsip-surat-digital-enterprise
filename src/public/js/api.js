/**
 * ============================================================
 * GOOGLE APPS SCRIPT API INTEGRATION
 * ============================================================
 * Full Base64 Encoding System
 * Enterprise API Handler
 * ============================================================
 */

const GASEnterpriseAPI = (() => {
    'use strict';
    
    // ==================== CONFIGURATION ====================
    const CONFIG = {
        // Primary Google Apps Script URL
        baseUrl: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
        
        // Backup URLs (for failover)
        backupUrls: [],
        
        // Request configuration
        timeout: 30000,
        maxRetries: 3,
        retryDelay: 1000,
        
        // API Version
        version: '3.0.0',
        
        // Endpoints
        endpoints: {
            // Authentication
            LOGIN: 'auth/login',
            LOGOUT: 'auth/logout',
            REFRESH_TOKEN: 'auth/refresh',
            VERIFY_TOKEN: 'auth/verify',
            CHANGE_PASSWORD: 'auth/change-password',
            RESET_PASSWORD: 'auth/reset-password',
            
            // Users
            GET_USERS: 'users/list',
            GET_USER: 'users/detail',
            CREATE_USER: 'users/create',
            UPDATE_USER: 'users/update',
            DELETE_USER: 'users/delete',
            
            // Instansi
            GET_INSTANSI: 'instansi/list',
            GET_INSTANSI_DETAIL: 'instansi/detail',
            CREATE_INSTANSI: 'instansi/create',
            UPDATE_INSTANSI: 'instansi/update',
            
            // Surat Masuk
            GET_SURAT_MASUK: 'surat-masuk/list',
            GET_SURAT_MASUK_DETAIL: 'surat-masuk/detail',
            CREATE_SURAT_MASUK: 'surat-masuk/create',
            UPDATE_SURAT_MASUK: 'surat-masuk/update',
            DELETE_SURAT_MASUK: 'surat-masuk/delete',
            
            // Surat Keluar
            GET_SURAT_KELUAR: 'surat-keluar/list',
            GET_SURAT_KELUAR_DETAIL: 'surat-keluar/detail',
            CREATE_SURAT_KELUAR: 'surat-keluar/create',
            UPDATE_SURAT_KELUAR: 'surat-keluar/update',
            DELETE_SURAT_KELUAR: 'surat-keluar/delete',
            
            // Disposisi
            GET_DISPOSISI: 'disposisi/list',
            GET_DISPOSISI_DETAIL: 'disposisi/detail',
            CREATE_DISPOSISI: 'disposisi/create',
            UPDATE_DISPOSISI: 'disposisi/update',
            
            // Laporan
            GET_LAPORAN: 'laporan/generate',
            EXPORT_PDF: 'laporan/export-pdf',
            EXPORT_EXCEL: 'laporan/export-excel',
            
            // Dashboard
            GET_DASHBOARD_STATS: 'dashboard/stats',
            GET_CHART_DATA: 'dashboard/chart-data',
            
            // Attachments
            UPLOAD_FILE: 'attachment/upload',
            DOWNLOAD_FILE: 'attachment/download',
            DELETE_FILE: 'attachment/delete',
            
            // Logs
            GET_LOGS: 'logs/list',
            CREATE_LOG: 'logs/create',
        }
    };
    
    // ==================== BASE64 HANDLER ====================
    const Base64 = {
        encode(data) {
            try {
                if (typeof data === 'object') {
                    data = JSON.stringify(data);
                }
                return btoa(unescape(encodeURIComponent(data)));
            } catch (error) {
                console.error('Base64 encode error:', error);
                throw new Error('Failed to encode data');
            }
        },
        
        decode(encoded) {
            try {
                return decodeURIComponent(escape(atob(encoded)));
            } catch (error) {
                console.error('Base64 decode error:', error);
                throw new Error('Failed to decode data');
            }
        },
        
        encodeObject(obj) {
            return this.encode(JSON.stringify(obj));
        },
        
        decodeObject(encoded) {
            return JSON.parse(this.decode(encoded));
        },
        
        async encodeFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve({
                        data: base64,
                        fileName: file.name,
                        mimeType: file.type,
                        size: file.size
                    });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
    };
    
    // ==================== API REQUEST HANDLER ====================
    class APIRequest {
        constructor() {
            this.pendingRequests = new Map();
            this.requestQueue = [];
            this.isOnline = navigator.onLine;
            this.setupNetworkListeners();
        }
        
        setupNetworkListeners() {
            window.addEventListener('online', () => {
                this.isOnline = true;
                this.processQueue();
            });
            
            window.addEventListener('offline', () => {
                this.isOnline = false;
            });
        }
        
        async call(endpoint, params = {}, options = {}) {
            const defaultOptions = {
                method: 'GET',
                timeout: CONFIG.timeout,
                retries: CONFIG.maxRetries,
                useBase64: true,
                requireAuth: true,
                cache: false,
            };
            
            const opts = { ...defaultOptions, ...options };
            
            // Generate request ID
            const requestId = this.generateRequestId();
            
            // Add authentication token if required
            if (opts.requireAuth) {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    params.token = token;
                }
            }
            
            // Add metadata
            params._requestId = requestId;
            params._timestamp = Date.now();
            params._version = CONFIG.version;
            params._deviceInfo = Base64.encodeObject({
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                screenSize: `${window.screen.width}x${window.screen.height}`
            });
            
            // Encode parameters with Base64
            let encodedParams;
            if (opts.useBase64) {
                encodedParams = Base64.encodeObject(params);
            } else {
                encodedParams = JSON.stringify(params);
            }
            
            // Build URL
            const url = this.buildUrl(endpoint, encodedParams, opts);
            
            // Make request
            try {
                const response = await this.executeRequest(url, opts, requestId);
                
                // Decode response if Base64 encoded
                if (response && typeof response === 'string' && response.startsWith('ey')) {
                    return Base64.decodeObject(response);
                }
                
                return response;
            } catch (error) {
                // Retry logic
                if (opts.retries > 0) {
                    console.log(`Retrying request ${requestId}... (${opts.retries} attempts left)`);
                    await this.delay(CONFIG.retryDelay);
                    return this.call(endpoint, params, { ...opts, retries: opts.retries - 1 });
                }
                
                throw error;
            }
        }
        
        buildUrl(endpoint, encodedParams, opts) {
            const url = new URL(CONFIG.baseUrl);
            
            // Set action
            url.searchParams.set('action', endpoint);
            
            // Set Base64 data
            url.searchParams.set('data', encodedParams);
            
            // Cache busting
            if (!opts.cache) {
                url.searchParams.set('_t', Date.now());
            }
            
            return url.toString();
        }
        
        executeRequest(url, opts, requestId) {
            return new Promise((resolve, reject) => {
                // Use JSONP for Google Apps Script (bypasses CORS)
                const callbackName = `gasCallback_${requestId}`;
                
                // Create timeout
                const timeoutId = setTimeout(() => {
                    cleanup();
                    reject(new Error(`Request ${requestId} timed out after ${opts.timeout}ms`));
                }, opts.timeout);
                
                // Create global callback
                window[callbackName] = function(response) {
                    cleanup();
                    
                    if (response && response.error) {
                        reject(new Error(response.error));
                    } else {
                        resolve(response);
                    }
                };
                
                // Create script element
                const script = document.createElement('script');
                const finalUrl = `${url}&callback=${callbackName}&format=jsonp`;
                script.src = finalUrl;
                
                // Error handler
                script.onerror = function() {
                    cleanup();
                    reject(new Error(`Network error for request ${requestId}`));
                };
                
                // Cleanup function
                function cleanup() {
                    clearTimeout(timeoutId);
                    delete window[callbackName];
                    if (script.parentNode) {
                        script.parentNode.removeChild(script);
                    }
                }
                
                // Append to DOM
                document.head.appendChild(script);
            });
        }
        
        // Alternative method using fetch with no-cors (for POST operations)
        async fetchRequest(endpoint, params, method = 'POST') {
            const encodedData = Base64.encodeObject(params);
            
            const formData = new FormData();
            formData.append('action', endpoint);
            formData.append('data', encodedData);
            formData.append('version', CONFIG.version);
            
            try {
                const response = await fetch(CONFIG.baseUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: formData
                });
                
                return { success: true, message: 'Data sent successfully' };
            } catch (error) {
                throw new Error(`Fetch request failed: ${error.message}`);
            }
        }
        
        // File upload with Base64 encoding
        async uploadFile(endpoint, file, additionalParams = {}) {
            const fileData = await Base64.encodeFile(file);
            
            const params = {
                ...additionalParams,
                file: fileData.data,
                fileName: fileData.fileName,
                mimeType: fileData.mimeType,
                fileSize: fileData.size,
            };
            
            return this.call(endpoint, params, { timeout: 60000 });
        }
        
        // Queue requests when offline
        queueRequest(endpoint, params, options) {
            this.requestQueue.push({
                endpoint,
                params,
                options,
                timestamp: Date.now()
            });
            
            localStorage.setItem('offlineQueue', JSON.stringify(this.requestQueue));
        }
        
        async processQueue() {
            if (!this.isOnline || this.requestQueue.length === 0) return;
            
            const queue = [...this.requestQueue];
            this.requestQueue = [];
            
            for (const request of queue) {
                try {
                    await this.call(request.endpoint, request.params, request.options);
                } catch (error) {
                    this.requestQueue.push(request);
                }
            }
            
            localStorage.setItem('offlineQueue', JSON.stringify(this.requestQueue));
        }
        
        generateRequestId() {
            return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }
    
    // ==================== DATABASE SYNC ====================
    class DatabaseSync {
        constructor(api) {
            this.api = api;
            this.syncInterval = 5 * 60 * 1000; // 5 minutes
            this.lastSync = null;
        }
        
        async syncAll() {
            console.log('🔄 Starting database synchronization...');
            
            try {
                // Sync users
                const users = await this.api.call(CONFIG.endpoints.GET_USERS);
                if (users) {
                    await this.syncToLocalDB('users', users);
                }
                
                // Sync surat masuk
                const suratMasuk = await this.api.call(CONFIG.endpoints.GET_SURAT_MASUK);
                if (suratMasuk) {
                    await this.syncToLocalDB('surat_masuk', suratMasuk);
                }
                
                // Sync surat keluar
                const suratKeluar = await this.api.call(CONFIG.endpoints.GET_SURAT_KELUAR);
                if (suratKeluar) {
                    await this.syncToLocalDB('surat_keluar', suratKeluar);
                }
                
                this.lastSync = new Date();
                console.log('✅ Database synchronization completed');
            } catch (error) {
                console.error('❌ Database synchronization failed:', error);
            }
        }
        
        async syncToLocalDB(table, data) {
            // Use IndexedDB for local storage
            const db = await this.openDB();
            const transaction = db.transaction([table], 'readwrite');
            const store = transaction.objectStore(table);
            
            // Clear existing data
            await store.clear();
            
            // Add new data
            for (const item of data) {
                await store.add(item);
            }
        }
        
        openDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open('ArsipSuratEnterprise', 1);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
        
        startAutoSync() {
            // Initial sync
            this.syncAll();
            
            // Periodic sync
            setInterval(() => {
                this.syncAll();
            }, this.syncInterval);
        }
    }
    
    // ==================== INITIALIZE API ====================
    const api = new APIRequest();
    const dbSync = new DatabaseSync(api);
    
    // Load offline queue
    const savedQueue = localStorage.getItem('offlineQueue');
    if (savedQueue) {
        api.requestQueue = JSON.parse(savedQueue);
    }
    
    // Process any queued requests when online
    if (navigator.onLine) {
        api.processQueue();
    }
    
    // ==================== PUBLIC API ====================
    return {
        config: CONFIG,
        base64: Base64,
        call: (endpoint, params, options) => api.call(endpoint, params, options),
        upload: (endpoint, file, params) => api.uploadFile(endpoint, file, params),
        post: (endpoint, params) => api.fetchRequest(endpoint, params, 'POST'),
        sync: () => dbSync.syncAll(),
        startSync: () => dbSync.startAutoSync(),
        
        // Convenience methods
        auth: {
            login: (email, password) => api.call(CONFIG.endpoints.LOGIN, { email, password }),
            logout: () => api.call(CONFIG.endpoints.LOGOUT),
            verify: (token) => api.call(CONFIG.endpoints.VERIFY_TOKEN, { token }),
        },
        
        suratMasuk: {
            list: (params) => api.call(CONFIG.endpoints.GET_SURAT_MASUK, params),
            detail: (id) => api.call(CONFIG.endpoints.GET_SURAT_MASUK_DETAIL, { id }),
            create: (data) => api.fetchRequest(CONFIG.endpoints.CREATE_SURAT_MASUK, data),
            update: (id, data) => api.fetchRequest(CONFIG.endpoints.UPDATE_SURAT_MASUK, { id, ...data }),
            delete: (id) => api.fetchRequest(CONFIG.endpoints.DELETE_SURAT_MASUK, { id }),
        },
        
        suratKeluar: {
            list: (params) => api.call(CONFIG.endpoints.GET_SURAT_KELUAR, params),
            detail: (id) => api.call(CONFIG.endpoints.GET_SURAT_KELUAR_DETAIL, { id }),
            create: (data) => api.fetchRequest(CONFIG.endpoints.CREATE_SURAT_KELUAR, data),
            update: (id, data) => api.fetchRequest(CONFIG.endpoints.UPDATE_SURAT_KELUAR, { id, ...data }),
            delete: (id) => api.fetchRequest(CONFIG.endpoints.DELETE_SURAT_KELUAR, { id }),
        },
        
        disposisi: {
            list: (params) => api.call(CONFIG.endpoints.GET_DISPOSISI, params),
            detail: (id) => api.call(CONFIG.endpoints.GET_DISPOSISI_DETAIL, { id }),
            create: (data) => api.fetchRequest(CONFIG.endpoints.CREATE_DISPOSISI, data),
            update: (id, data) => api.fetchRequest(CONFIG.endpoints.UPDATE_DISPOSISI, { id, ...data }),
        },
        
        dashboard: {
            stats: () => api.call(CONFIG.endpoints.GET_DASHBOARD_STATS),
            charts: (type) => api.call(CONFIG.endpoints.GET_CHART_DATA, { type }),
        },
        
        laporan: {
            generate: (params) => api.call(CONFIG.endpoints.GET_LAPORAN, params),
            exportPdf: (params) => api.call(CONFIG.endpoints.EXPORT_PDF, params),
            exportExcel: (params) => api.call(CONFIG.endpoints.EXPORT_EXCEL, params),
        },
    };
})();

// Export globally
window.GASEnterpriseAPI = GASEnterpriseAPI;
