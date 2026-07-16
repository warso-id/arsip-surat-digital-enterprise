/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Core Enterprise System
 * ============================================================
 * Integrated with Google Apps Script Base64 System
 * Full Support Enterprise Features
 * ============================================================
 */

const EnterpriseCore = (() => {
    'use strict';

    // ==================== ENTERPRISE CONFIGURATION ====================
    const CONFIG = {
        version: '3.0.0-enterprise',
        buildDate: '2024-01-15',
        environment: 'production',
        debug: false,
        
        // Google Apps Script Configuration
        googleAppsScript: {
            baseUrl: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
        },
        
        // Security Configuration
        security: {
            encryptionKey: 'ASDE-ENTERPRISE-2024-SECURE-KEY',
            tokenExpiry: 86400, // 24 hours
            maxLoginAttempts: 5,
            sessionTimeout: 3600, // 1 hour
        },
        
        // Database Tables
        tables: {
            users: 'tbl_users',
            instansi: 'tbl_instansi',
            suratMasuk: 'tbl_surat_masuk',
            suratKeluar: 'tbl_surat_keluar',
            disposisi: 'tbl_disposisi',
            attachments: 'tbl_attachments',
            logs: 'tbl_activity_logs',
            roles: 'tbl_roles',
            permissions: 'tbl_permissions',
        },
        
        // Feature Flags
        features: {
            multiInstansi: true,
            rbac: true,
            auditTrail: true,
            notifications: true,
            exportPdf: true,
            exportExcel: true,
            qrCode: true,
            digitalSign: true,
            apiAccess: true,
            backupSystem: true,
        }
    };

    // ==================== STATE MANAGEMENT ====================
    class StateManager {
        constructor() {
            this.state = {
                isAuthenticated: false,
                currentUser: null,
                currentInstansi: null,
                permissions: [],
                sessionId: null,
                lastActivity: null,
                offlineData: {},
            };
            
            this.listeners = new Map();
            this.loadState();
            this.startSessionMonitor();
        }
        
        loadState() {
            try {
                const saved = localStorage.getItem('enterpriseState');
                if (saved) {
                    const decoded = EnterpriseBase64.decode(saved);
                    this.state = { ...this.state, ...JSON.parse(decoded) };
                }
            } catch (error) {
                console.error('State load error:', error);
                this.state = this.getInitialState();
            }
        }
        
        saveState() {
            try {
                const jsonStr = JSON.stringify(this.state);
                const encoded = EnterpriseBase64.encode(jsonStr);
                localStorage.setItem('enterpriseState', encoded);
            } catch (error) {
                console.error('State save error:', error);
            }
        }
        
        getState(key) {
            return key ? this.state[key] : this.state;
        }
        
        setState(key, value) {
            this.state[key] = value;
            this.saveState();
            this.notify(key, value);
        }
        
        subscribe(key, callback) {
            if (!this.listeners.has(key)) {
                this.listeners.set(key, []);
            }
            this.listeners.get(key).push(callback);
        }
        
        notify(key, value) {
            const listeners = this.listeners.get(key);
            if (listeners) {
                listeners.forEach(callback => callback(value));
            }
        }
        
        startSessionMonitor() {
            setInterval(() => {
                const lastActivity = this.state.lastActivity;
                if (lastActivity && this.state.isAuthenticated) {
                    const inactiveTime = Date.now() - new Date(lastActivity).getTime();
                    if (inactiveTime > CONFIG.security.sessionTimeout * 1000) {
                        this.logout('Session expired due to inactivity');
                    }
                }
            }, 60000); // Check every minute
        }
        
        updateActivity() {
            this.setState('lastActivity', new Date().toISOString());
        }
        
        async logout(reason = 'User logout') {
            try {
                await EnterpriseAPI.logout();
            } catch (error) {
                console.error('Logout error:', error);
            }
            
            this.state = this.getInitialState();
            localStorage.removeItem('enterpriseState');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            
            window.location.href = './login.html';
        }
        
        getInitialState() {
            return {
                isAuthenticated: false,
                currentUser: null,
                currentInstansi: null,
                permissions: [],
                sessionId: null,
                lastActivity: null,
                offlineData: {},
            };
        }
    }

    // ==================== BASE64 HANDLER ====================
    const EnterpriseBase64 = {
        encode(data) {
            try {
                if (typeof data === 'object') {
                    data = JSON.stringify(data);
                }
                // Use browser's built-in btoa with UTF-8 safe encoding
                return btoa(unescape(encodeURIComponent(data)));
            } catch (error) {
                console.error('Base64 encode error:', error);
                return null;
            }
        },
        
        decode(encoded) {
            try {
                // Use browser's built-in atob with UTF-8 safe decoding
                return decodeURIComponent(escape(atob(encoded)));
            } catch (error) {
                console.error('Base64 decode error:', error);
                return null;
            }
        },
        
        encodeObject(obj) {
            const jsonStr = JSON.stringify(obj);
            return this.encode(jsonStr);
        },
        
        decodeObject(encoded) {
            const decoded = this.decode(encoded);
            return decoded ? JSON.parse(decoded) : null;
        },
        
        // Encode file to Base64
        async encodeFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        },
        
        // Decode Base64 to Blob
        decodeToBlob(base64, mimeType) {
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
        }
    };

    // ==================== API HANDLER ====================
    class APIHandler {
        constructor() {
            this.baseUrl = CONFIG.googleAppsScript.baseUrl;
            this.pendingRequests = new Map();
            this.requestQueue = [];
            this.isProcessing = false;
        }
        
        async request(endpoint, params = {}, method = 'GET') {
            const requestId = this.generateRequestId();
            
            try {
                // Encode all parameters with Base64
                const encodedParams = this.encodeParams(params);
                
                // Build URL with Base64 data
                const url = this.buildUrl(endpoint, encodedParams);
                
                // Create request payload
                const payload = {
                    id: requestId,
                    endpoint: endpoint,
                    params: encodedParams,
                    timestamp: Date.now(),
                    sessionId: EnterpriseState.getState('sessionId'),
                };
                
                // Add to pending requests
                this.pendingRequests.set(requestId, { url, payload, timestamp: Date.now() });
                
                // Make the request
                const response = await this.executeRequest(url, payload, method);
                
                // Remove from pending
                this.pendingRequests.delete(requestId);
                
                // Decode response
                return this.decodeResponse(response);
                
            } catch (error) {
                this.pendingRequests.delete(requestId);
                
                // Retry logic
                if (params.retryCount < CONFIG.googleAppsScript.retryAttempts) {
                    params.retryCount = (params.retryCount || 0) + 1;
                    await this.delay(CONFIG.googleAppsScript.retryDelay);
                    return this.request(endpoint, params, method);
                }
                
                throw error;
            }
        }
        
        encodeParams(params) {
            // Remove non-serializable values
            const cleanParams = { ...params };
            delete cleanParams.retryCount;
            
            // Convert to Base64
            const jsonStr = JSON.stringify(cleanParams);
            return EnterpriseBase64.encode(jsonStr);
        }
        
        buildUrl(endpoint, encodedParams) {
            const url = new URL(this.baseUrl);
            
            // Add action parameter
            url.searchParams.set('action', endpoint);
            
            // Add Base64 encoded data
            url.searchParams.set('data', encodedParams);
            
            // Add cache buster
            url.searchParams.set('_t', Date.now());
            
            // Add API version
            url.searchParams.set('version', CONFIG.version);
            
            return url.toString();
        }
        
        async executeRequest(url, payload, method) {
            return new Promise((resolve, reject) => {
                // Use JSONP for Google Apps Script (handles CORS)
                const callbackName = 'gasCallback_' + payload.id;
                const script = document.createElement('script');
                
                // Set timeout
                const timeout = setTimeout(() => {
                    cleanup();
                    reject(new Error('Request timeout'));
                }, CONFIG.googleAppsScript.timeout);
                
                // Create callback
                window[callbackName] = function(response) {
                    cleanup();
                    resolve(response);
                };
                
                // Add callback to URL
                const finalUrl = url + '&callback=' + callbackName;
                script.src = finalUrl;
                
                // Error handling
                script.onerror = function() {
                    cleanup();
                    reject(new Error('Network error'));
                };
                
                function cleanup() {
                    clearTimeout(timeout);
                    delete window[callbackName];
                    if (script.parentNode) {
                        script.parentNode.removeChild(script);
                    }
                }
                
                document.head.appendChild(script);
            });
        }
        
        decodeResponse(response) {
            try {
                // If response is Base64 encoded
                if (typeof response === 'string' && response.startsWith('ey')) {
                    const decoded = EnterpriseBase64.decode(response);
                    return JSON.parse(decoded);
                }
                
                // If response is already an object
                if (typeof response === 'object') {
                    return response;
                }
                
                // Try to parse as JSON
                return JSON.parse(response);
            } catch (error) {
                console.error('Response decode error:', error);
                return response;
            }
        }
        
        generateRequestId() {
            return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        
        // Queue management for offline support
        async queueRequest(endpoint, params, method) {
            this.requestQueue.push({ endpoint, params, method, timestamp: Date.now() });
            
            if (!this.isProcessing) {
                this.processQueue();
            }
        }
        
        async processQueue() {
            if (this.requestQueue.length === 0) {
                this.isProcessing = false;
                return;
            }
            
            this.isProcessing = true;
            
            const request = this.requestQueue.shift();
            
            try {
                await this.request(request.endpoint, request.params, request.method);
            } catch (error) {
                // Re-queue failed requests
                this.requestQueue.unshift(request);
                await this.delay(5000);
            }
            
            await this.processQueue();
        }
    }

    // ==================== DATABASE HANDLER ====================
    class DatabaseHandler {
        constructor() {
            this.dbName = 'ArsipSuratEnterprise';
            this.dbVersion = 1;
            this.db = null;
            this.tables = CONFIG.tables;
        }
        
        async init() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    this.db = request.result;
                    resolve(this.db);
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    // Create tables
                    this.createTables(db);
                };
            });
        }
        
        createTables(db) {
            // Users table
            if (!db.objectStoreNames.contains(this.tables.users)) {
                const userStore = db.createObjectStore(this.tables.users, { keyPath: 'id', autoIncrement: true });
                userStore.createIndex('email', 'email', { unique: true });
                userStore.createIndex('instansi_id', 'instansi_id');
                userStore.createIndex('role_id', 'role_id');
            }
            
            // Instansi table
            if (!db.objectStoreNames.contains(this.tables.instansi)) {
                const instansiStore = db.createObjectStore(this.tables.instansi, { keyPath: 'id', autoIncrement: true });
                instansiStore.createIndex('kode', 'kode', { unique: true });
            }
            
            // Surat Masuk table
            if (!db.objectStoreNames.contains(this.tables.suratMasuk)) {
                const smStore = db.createObjectStore(this.tables.suratMasuk, { keyPath: 'id', autoIncrement: true });
                smStore.createIndex('no_agenda', 'no_agenda', { unique: true });
                smStore.createIndex('tanggal', 'tanggal');
                smStore.createIndex('instansi_id', 'instansi_id');
            }
            
            // Surat Keluar table
            if (!db.objectStoreNames.contains(this.tables.suratKeluar)) {
                const skStore = db.createObjectStore(this.tables.suratKeluar, { keyPath: 'id', autoIncrement: true });
                skStore.createIndex('no_agenda', 'no_agenda', { unique: true });
                skStore.createIndex('tanggal', 'tanggal');
            }
            
            // Disposisi table
            if (!db.objectStoreNames.contains(this.tables.disposisi)) {
                const dispStore = db.createObjectStore(this.tables.disposisi, { keyPath: 'id', autoIncrement: true });
                dispStore.createIndex('surat_id', 'surat_id');
                dispStore.createIndex('user_id', 'user_id');
            }
            
            // Activity Logs table
            if (!db.objectStoreNames.contains(this.tables.logs)) {
                const logStore = db.createObjectStore(this.tables.logs, { keyPath: 'id', autoIncrement: true });
                logStore.createIndex('user_id', 'user_id');
                logStore.createIndex('timestamp', 'timestamp');
            }
        }
        
        async add(table, data) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([table], 'readwrite');
                const store = transaction.objectStore(table);
                
                // Add timestamp
                data.created_at = new Date().toISOString();
                data.updated_at = new Date().toISOString();
                
                const request = store.add(data);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
        
        async get(table, id) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([table], 'readonly');
                const store = transaction.objectStore(table);
                const request = store.get(id);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
        
        async getAll(table, index = null, value = null) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([table], 'readonly');
                const store = transaction.objectStore(table);
                
                let request;
                if (index && value !== null) {
                    const idx = store.index(index);
                    request = idx.getAll(value);
                } else {
                    request = store.getAll();
                }
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
        
        async update(table, id, data) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([table], 'readwrite');
                const store = transaction.objectStore(table);
                
                data.updated_at = new Date().toISOString();
                
                const getRequest = store.get(id);
                getRequest.onsuccess = () => {
                    const existingData = getRequest.result;
                    const updatedData = { ...existingData, ...data, id: id };
                    const putRequest = store.put(updatedData);
                    putRequest.onsuccess = () => resolve(putRequest.result);
                    putRequest.onerror = () => reject(putRequest.error);
                };
                getRequest.onerror = () => reject(getRequest.error);
            });
        }
        
        async delete(table, id) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([table], 'readwrite');
                const store = transaction.objectStore(table);
                const request = store.delete(id);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
        
        async search(table, field, query) {
            const allData = await this.getAll(table);
            return allData.filter(item => {
                const value = item[field]?.toString().toLowerCase() || '';
                return value.includes(query.toLowerCase());
            });
        }
        
        async count(table, index = null, value = null) {
            const data = await this.getAll(table, index, value);
            return data.length;
        }
        
        async clear(table) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([table], 'readwrite');
                const store = transaction.objectStore(table);
                const request = store.clear();
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }

    // ==================== AUTHENTICATION MANAGER ====================
    class AuthManager {
        constructor() {
            this.maxAttempts = CONFIG.security.maxLoginAttempts;
            this.attempts = {};
        }
        
        async login(email, password, remember = false) {
            // Check login attempts
            if (this.isLocked(email)) {
                throw new Error('Akun terkunci. Silakan coba lagi dalam 15 menit.');
            }
            
            // Encode credentials with Base64
            const credentials = EnterpriseBase64.encodeObject({
                email: email,
                password: password,
                timestamp: Date.now(),
                deviceInfo: this.getDeviceInfo(),
            });
            
            try {
                // Call API
                const response = await EnterpriseAPI.request('auth/login', {
                    credentials: credentials,
                    remember: remember,
                });
                
                if (response.success) {
                    // Reset attempts
                    delete this.attempts[email];
                    
                    // Save tokens
                    const tokenData = response.data;
                    localStorage.setItem('accessToken', tokenData.accessToken);
                    localStorage.setItem('refreshToken', tokenData.refreshToken);
                    
                    // Save user data
                    const userData = EnterpriseBase64.encodeObject(tokenData.user);
                    localStorage.setItem('userData', userData);
                    
                    // Update state
                    EnterpriseState.setState('isAuthenticated', true);
                    EnterpriseState.setState('currentUser', tokenData.user);
                    EnterpriseState.setState('sessionId', tokenData.sessionId);
                    EnterpriseState.setState('permissions', tokenData.permissions || []);
                    
                    // Log activity
                    await this.logActivity('login', 'User logged in');
                    
                    return tokenData;
                } else {
                    // Increment attempts
                    this.incrementAttempts(email);
                    throw new Error(response.message || 'Login gagal');
                }
            } catch (error) {
                this.incrementAttempts(email);
                throw error;
            }
        }
        
        async logout() {
            try {
                await EnterpriseAPI.request('auth/logout');
            } catch (error) {
                console.error('Logout API error:', error);
            }
            
            // Clear all data
            localStorage.clear();
            EnterpriseState.state = EnterpriseState.getInitialState();
            
            // Log activity
            await this.logActivity('logout', 'User logged out');
            
            // Redirect to login
            window.location.href = './login.html';
        }
        
        isAuthenticated() {
            const token = localStorage.getItem('accessToken');
            const userData = localStorage.getItem('userData');
            
            if (!token || !userData) {
                return false;
            }
            
            // Check token expiry
            try {
                const decoded = this.decodeToken(token);
                if (decoded.exp && decoded.exp < Date.now() / 1000) {
                    return false;
                }
            } catch (error) {
                return false;
            }
            
            return true;
        }
        
        getCurrentUser() {
            const userData = localStorage.getItem('userData');
            if (userData) {
                return EnterpriseBase64.decodeObject(userData);
            }
            return null;
        }
        
        hasPermission(permission) {
            const permissions = EnterpriseState.getState('permissions') || [];
            return permissions.includes(permission) || permissions.includes('*');
        }
        
        hasRole(role) {
            const user = this.getCurrentUser();
            return user && user.role && user.role.slug === role;
        }
        
        decodeToken(token) {
            try {
                const parts = token.split('.');
                if (parts.length !== 3) {
                    throw new Error('Invalid token format');
                }
                
                const payload = EnterpriseBase64.decode(parts[1]);
                return JSON.parse(payload);
            } catch (error) {
                console.error('Token decode error:', error);
                return {};
            }
        }
        
        incrementAttempts(email) {
            if (!this.attempts[email]) {
                this.attempts[email] = { count: 0, firstAttempt: Date.now() };
            }
            
            this.attempts[email].count++;
            
            // Store in localStorage for persistence
            localStorage.setItem('loginAttempts', EnterpriseBase64.encodeObject(this.attempts));
        }
        
        isLocked(email) {
            const attempt = this.attempts[email];
            if (!attempt) return false;
            
            // Reset after 15 minutes
            if (Date.now() - attempt.firstAttempt > 15 * 60 * 1000) {
                delete this.attempts[email];
                return false;
            }
            
            return attempt.count >= this.maxAttempts;
        }
        
        getDeviceInfo() {
            return {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            };
        }
        
        async logActivity(action, description, metadata = {}) {
            try {
                const user = this.getCurrentUser();
                const logData = {
                    user_id: user?.id || null,
                    action: action,
                    description: description,
                    metadata: EnterpriseBase64.encodeObject(metadata),
                    ip_address: 'client-side',
                    user_agent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                };
                
                // Store locally
                await EnterpriseDB.add(CONFIG.tables.logs, logData);
                
                // Send to server (non-blocking)
                EnterpriseAPI.request('logs/create', logData).catch(() => {});
            } catch (error) {
                console.error('Log activity error:', error);
            }
        }
    }

    // Initialize Enterprise System
    const EnterpriseState = new StateManager();
    const EnterpriseAPI = new APIHandler();
    const EnterpriseDB = new DatabaseHandler();
    const EnterpriseAuth = new AuthManager();

    // ==================== PUBLIC API ====================
    return {
        version: CONFIG.version,
        config: CONFIG,
        state: EnterpriseState,
        api: EnterpriseAPI,
        db: EnterpriseDB,
        auth: EnterpriseAuth,
        base64: EnterpriseBase64,
        
        // Initialize the entire system
        async init() {
            console.log(`🚀 Initializing Arsip Surat Digital Enterprise v${CONFIG.version}...`);
            
            // Initialize database
            await EnterpriseDB.init();
            console.log('✅ Database initialized');
            
            // Load login attempts
            const savedAttempts = localStorage.getItem('loginAttempts');
            if (savedAttempts) {
                EnterpriseAuth.attempts = EnterpriseBase64.decodeObject(savedAttempts);
            }
            
            // Check authentication
            if (EnterpriseAuth.isAuthenticated()) {
                const user = EnterpriseAuth.getCurrentUser();
                EnterpriseState.setState('isAuthenticated', true);
                EnterpriseState.setState('currentUser', user);
                console.log(`👤 Welcome back, ${user?.nama_lengkap || 'User'}!`);
            }
            
            console.log('✅ Enterprise System Ready');
            console.log('📡 Google Apps Script:', CONFIG.googleAppsScript.baseUrl);
            console.log('🔐 Base64 Encoding: ACTIVE');
            
            return true;
        },
        
        // Check if user is authenticated
        requireAuth() {
            if (!EnterpriseAuth.isAuthenticated()) {
                window.location.href = './login.html';
                return false;
            }
            return true;
        },
        
        // Check permission
        requirePermission(permission) {
            if (!EnterpriseAuth.hasPermission(permission)) {
                this.showError('Anda tidak memiliki izin untuk mengakses halaman ini.');
                setTimeout(() => {
                    window.location.href = './dashboard.html';
                }, 2000);
                return false;
            }
            return true;
        },
        
        // Show error message
        showError(message) {
            const toast = document.createElement('div');
            toast.className = 'enterprise-toast error';
            toast.innerHTML = `
                <span>❌</span>
                <span>${message}</span>
            `;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 5000);
        },
        
        // Show success message
        showSuccess(message) {
            const toast = document.createElement('div');
            toast.className = 'enterprise-toast success';
            toast.innerHTML = `
                <span>✅</span>
                <span>${message}</span>
            `;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 5000);
        },
    };
})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    EnterpriseCore.init();
});

// Export for global use
window.EnterpriseCore = EnterpriseCore;
