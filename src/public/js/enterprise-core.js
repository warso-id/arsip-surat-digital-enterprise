/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Full Stack Enterprise Core System
 * ============================================================
 * Author: Enterprise Development Team
 * License: MIT
 * ============================================================
 */

(function(global) {
    'use strict';

    // ==================== ENTERPRISE CONFIGURATION ====================
    const ENTERPRISE_CONFIG = {
        version: '3.0.0',
        build: '2024.01.15-enterprise',
        environment: 'production',
        debug: false,
        
        // Google Apps Script Configuration
        gas: {
            primaryUrl: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
            fallbackUrl: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
            useBase64: true,
        },
        
        // Database Configuration
        database: {
            name: 'ArsipSuratEnterprise',
            version: 3,
            tables: {
                users: 'tbl_users',
                instansi: 'tbl_instansi',
                roles: 'tbl_roles',
                permissions: 'tbl_permissions',
                suratMasuk: 'tbl_surat_masuk',
                suratKeluar: 'tbl_surat_keluar',
                disposisi: 'tbl_disposisi',
                attachments: 'tbl_attachments',
                logs: 'tbl_activity_logs',
                settings: 'tbl_settings',
                notifications: 'tbl_notifications',
            }
        },
        
        // Security
        security: {
            tokenKey: 'enterprise_token',
            refreshKey: 'enterprise_refresh',
            userKey: 'enterprise_user',
            sessionTimeout: 3600, // 1 hour
            maxLoginAttempts: 5,
            lockoutDuration: 900, // 15 minutes
            encryptionEnabled: true,
            csrfProtection: true,
        },
        
        // Features
        features: {
            multiInstansi: true,
            rbac: true,
            auditTrail: true,
            notifications: true,
            exportPdf: true,
            exportExcel: true,
            qrCode: true,
            digitalSign: false,
            apiAccess: true,
            backupSystem: true,
            offlineMode: true,
            pwaEnabled: true,
        },
        
        // UI Configuration
        ui: {
            theme: 'light',
            sidebarCollapsed: false,
            tablePageSize: 25,
            dateFormat: 'DD/MM/YYYY',
            currency: 'IDR',
            language: 'id',
        }
    };

    // ==================== BASE64 ENTERPRISE ENCODER ====================
    class EnterpriseBase64 {
        /**
         * Encode data to Base64
         * @param {string|object} data - Data to encode
         * @returns {string} Base64 encoded string
         */
        static encode(data) {
            try {
                if (typeof data === 'object') {
                    data = JSON.stringify(data);
                }
                // UTF-8 safe Base64 encoding
                const utf8Bytes = this.toUTF8Array(data);
                let binary = '';
                utf8Bytes.forEach(byte => binary += String.fromCharCode(byte));
                return btoa(binary);
            } catch (error) {
                console.error('Base64 Encode Error:', error);
                throw new EnterpriseError('ENCODE_ERROR', 'Failed to encode data', error);
            }
        }

        /**
         * Decode Base64 to string
         * @param {string} encoded - Base64 encoded string
         * @returns {string} Decoded string
         */
        static decode(encoded) {
            try {
                const binary = atob(encoded);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                return this.fromUTF8Array(bytes);
            } catch (error) {
                console.error('Base64 Decode Error:', error);
                throw new EnterpriseError('DECODE_ERROR', 'Failed to decode data', error);
            }
        }

        /**
         * Encode object to Base64
         */
        static encodeObject(obj) {
            return this.encode(JSON.stringify(obj));
        }

        /**
         * Decode Base64 to object
         */
        static decodeObject(encoded) {
            return JSON.parse(this.decode(encoded));
        }

        /**
         * Encode file to Base64
         */
        static async encodeFile(file) {
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
                reader.onerror = () => reject(new EnterpriseError('FILE_ENCODE_ERROR', 'Failed to encode file'));
                reader.readAsDataURL(file);
            });
        }

        /**
         * Decode Base64 to Blob
         */
        static decodeToBlob(base64, mimeType) {
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

        /**
         * Check if string is Base64
         */
        static isBase64(str) {
            if (typeof str !== 'string') return false;
            const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
            return base64Regex.test(str) && str.length % 4 === 0;
        }

        /**
         * UTF-8 helper methods
         */
        static toUTF8Array(str) {
            const utf8 = [];
            for (let i = 0; i < str.length; i++) {
                let charcode = str.charCodeAt(i);
                if (charcode < 0x80) utf8.push(charcode);
                else if (charcode < 0x800) {
                    utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
                } else if (charcode < 0xd800 || charcode >= 0xe000) {
                    utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
                } else {
                    i++;
                    charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
                    utf8.push(0xf0 | (charcode >> 18), 0x80 | ((charcode >> 12) & 0x3f), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
                }
            }
            return utf8;
        }

        static fromUTF8Array(bytes) {
            let str = '';
            let i = 0;
            while (i < bytes.length) {
                let charcode = bytes[i];
                if (charcode < 0x80) {
                    str += String.fromCharCode(charcode);
                    i++;
                } else if (charcode < 0xe0) {
                    str += String.fromCharCode(((charcode & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
                    i += 2;
                } else if (charcode < 0xf0) {
                    str += String.fromCharCode(((charcode & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f));
                    i += 3;
                } else {
                    str += String.fromCodePoint(((charcode & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f));
                    i += 4;
                }
            }
            return str;
        }
    }

    // ==================== ENTERPRISE ERROR CLASS ====================
    class EnterpriseError extends Error {
        constructor(code, message, originalError = null) {
            super(message);
            this.name = 'EnterpriseError';
            this.code = code;
            this.timestamp = new Date().toISOString();
            this.originalError = originalError;
            
            if (Error.captureStackTrace) {
                Error.captureStackTrace(this, EnterpriseError);
            }
        }

        toJSON() {
            return {
                name: this.name,
                code: this.code,
                message: this.message,
                timestamp: this.timestamp,
                stack: ENTERPRISE_CONFIG.debug ? this.stack : undefined
            };
        }
    }

    // ==================== EVENT BUS ====================
    class EventBus {
        constructor() {
            this.events = new Map();
            this.onceEvents = new Map();
        }

        on(event, callback, priority = 0) {
            if (!this.events.has(event)) {
                this.events.set(event, []);
            }
            this.events.get(event).push({ callback, priority });
            this.events.get(event).sort((a, b) => b.priority - a.priority);
            return this;
        }

        once(event, callback) {
            if (!this.onceEvents.has(event)) {
                this.onceEvents.set(event, []);
            }
            this.onceEvents.get(event).push(callback);
            return this;
        }

        off(event, callback) {
            if (this.events.has(event)) {
                const callbacks = this.events.get(event);
                const index = callbacks.findIndex(cb => cb.callback === callback);
                if (index > -1) callbacks.splice(index, 1);
            }
            return this;
        }

        emit(event, ...args) {
            // Regular events
            if (this.events.has(event)) {
                this.events.get(event).forEach(({ callback }) => {
                    try {
                        callback(...args);
                    } catch (error) {
                        console.error(`Event handler error for "${event}":`, error);
                    }
                });
            }

            // Once events
            if (this.onceEvents.has(event)) {
                const callbacks = this.onceEvents.get(event);
                this.onceEvents.delete(event);
                callbacks.forEach(callback => {
                    try {
                        callback(...args);
                    } catch (error) {
                        console.error(`Once event handler error for "${event}":`, error);
                    }
                });
            }

            return this;
        }

        clear(event = null) {
            if (event) {
                this.events.delete(event);
                this.onceEvents.delete(event);
            } else {
                this.events.clear();
                this.onceEvents.clear();
            }
            return this;
        }
    }

    // ==================== STATE MANAGER ====================
    class StateManager {
        constructor() {
            this.state = {};
            this.listeners = new Map();
            this.eventBus = new EventBus();
            this.loadPersistedState();
        }

        loadPersistedState() {
            try {
                const saved = localStorage.getItem('enterprise_app_state');
                if (saved) {
                    const decoded = EnterpriseBase64.decode(saved);
                    this.state = JSON.parse(decoded);
                }
            } catch (error) {
                console.warn('Failed to load persisted state:', error);
                this.state = {};
            }
        }

        persistState() {
            try {
                const jsonStr = JSON.stringify(this.state);
                const encoded = EnterpriseBase64.encode(jsonStr);
                localStorage.setItem('enterprise_app_state', encoded);
            } catch (error) {
                console.warn('Failed to persist state:', error);
            }
        }

        get(key, defaultValue = null) {
            return key ? (this.state[key] ?? defaultValue) : { ...this.state };
        }

        set(key, value) {
            const oldValue = this.state[key];
            this.state[key] = value;
            this.persistState();
            this.notifyListeners(key, value, oldValue);
            this.eventBus.emit(`state:${key}:changed`, value, oldValue);
            this.eventBus.emit('state:changed', key, value, oldValue);
        }

        remove(key) {
            const oldValue = this.state[key];
            delete this.state[key];
            this.persistState();
            this.eventBus.emit(`state:${key}:removed`, oldValue);
        }

        watch(key, callback) {
            if (!this.listeners.has(key)) {
                this.listeners.set(key, []);
            }
            this.listeners.get(key).push(callback);
            
            // Return unsubscribe function
            return () => {
                const listeners = this.listeners.get(key);
                if (listeners) {
                    const index = listeners.indexOf(callback);
                    if (index > -1) listeners.splice(index, 1);
                }
            };
        }

        notifyListeners(key, newValue, oldValue) {
            if (this.listeners.has(key)) {
                this.listeners.get(key).forEach(callback => {
                    try {
                        callback(newValue, oldValue);
                    } catch (error) {
                        console.error(`State listener error for "${key}":`, error);
                    }
                });
            }
        }

        clear() {
            this.state = {};
            this.listeners.clear();
            localStorage.removeItem('enterprise_app_state');
        }
    }

    // ==================== STORAGE MANAGER ====================
    class StorageManager {
        static set(key, value, useBase64 = true) {
            try {
                let data = typeof value === 'object' ? JSON.stringify(value) : value;
                if (useBase64) {
                    data = EnterpriseBase64.encode(data);
                }
                localStorage.setItem(key, data);
                return true;
            } catch (error) {
                console.error('Storage set error:', error);
                return false;
            }
        }

        static get(key, defaultValue = null, useBase64 = true) {
            try {
                const data = localStorage.getItem(key);
                if (!data) return defaultValue;
                
                const decoded = useBase64 ? EnterpriseBase64.decode(data) : data;
                try {
                    return JSON.parse(decoded);
                } catch {
                    return decoded;
                }
            } catch (error) {
                console.error('Storage get error:', error);
                return defaultValue;
            }
        }

        static remove(key) {
            localStorage.removeItem(key);
        }

        static clear() {
            localStorage.clear();
        }

        static getAll() {
            const items = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                items[key] = this.get(key, null, false);
            }
            return items;
        }
    }

    // ==================== NOTIFICATION MANAGER ====================
    class NotificationManager {
        constructor() {
            this.container = null;
            this.notifications = [];
            this.maxNotifications = 5;
            this.createContainer();
        }

        createContainer() {
            this.container = document.createElement('div');
            this.container.className = 'enterprise-notifications';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(this.container);
        }

        show(message, type = 'info', duration = 5000) {
            const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const notification = {
                id,
                message,
                type,
                duration,
                element: this.createNotificationElement(id, message, type)
            };

            this.notifications.push(notification);
            this.container.appendChild(notification.element);

            // Remove old notifications if exceeding max
            while (this.notifications.length > this.maxNotifications) {
                this.remove(this.notifications[0].id);
            }

            // Auto remove after duration
            if (duration > 0) {
                setTimeout(() => this.remove(id), duration);
            }

            // Animate in
            requestAnimationFrame(() => {
                notification.element.style.transform = 'translateX(0)';
                notification.element.style.opacity = '1';
            });

            return id;
        }

        createNotificationElement(id, message, type) {
            const element = document.createElement('div');
            element.className = `enterprise-notification notification-${type}`;
            element.style.cssText = `
                background: white;
                border-radius: 12px;
                padding: 16px 20px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 12px;
                transform: translateX(120%);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border-left: 4px solid ${this.getTypeColor(type)};
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                color: #1f2937;
                cursor: pointer;
            `;

            const icon = this.getTypeIcon(type);
            element.innerHTML = `
                <span style="font-size: 20px;">${icon}</span>
                <span style="flex: 1;">${message}</span>
                <button onclick="event.stopPropagation(); EnterpriseCore.notifications.remove('${id}')" 
                        style="background: none; border: none; cursor: pointer; color: #6b7280; font-size: 18px; padding: 4px;">
                    ✕
                </button>
            `;

            element.addEventListener('click', () => this.remove(id));

            return element;
        }

        getTypeColor(type) {
            const colors = {
                success: '#10b981',
                error: '#ef4444',
                warning: '#f59e0b',
                info: '#3b82f6',
            };
            return colors[type] || colors.info;
        }

        getTypeIcon(type) {
            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️',
            };
            return icons[type] || icons.info;
        }

        remove(id) {
            const index = this.notifications.findIndex(n => n.id === id);
            if (index > -1) {
                const notification = this.notifications[index];
                
                // Animate out
                notification.element.style.transform = 'translateX(120%)';
                notification.element.style.opacity = '0';
                
                setTimeout(() => {
                    if (notification.element.parentNode) {
                        notification.element.parentNode.removeChild(notification.element);
                    }
                }, 300);
                
                this.notifications.splice(index, 1);
            }
        }

        success(message, duration) {
            return this.show(message, 'success', duration);
        }

        error(message, duration) {
            return this.show(message, 'error', duration);
        }

        warning(message, duration) {
            return this.show(message, 'warning', duration);
        }

        info(message, duration) {
            return this.show(message, 'info', duration);
        }

        clearAll() {
            while (this.notifications.length > 0) {
                this.remove(this.notifications[0].id);
            }
        }
    }

    // ==================== ENTERPRISE CORE CLASS ====================
    class EnterpriseCoreClass {
        constructor() {
            this.version = ENTERPRISE_CONFIG.version;
            this.config = ENTERPRISE_CONFIG;
            this.base64 = EnterpriseBase64;
            this.state = new StateManager();
            this.storage = StorageManager;
            this.events = new EventBus();
            this.notifications = new NotificationManager();
            this.modules = new Map();
            this.initialized = false;
            this.startTime = Date.now();
        }

        async initialize() {
            if (this.initialized) return this;
            
            console.log(`🚀 Initializing Arsip Surat Digital Enterprise v${this.version}...`);
            console.log('📡 Google Apps Script:', this.config.gas.primaryUrl);
            console.log('🔐 Base64 Encryption:', this.config.gas.useBase64 ? 'ACTIVE' : 'INACTIVE');
            
            try {
                // Initialize modules
                await this.initModules();
                
                // Setup event listeners
                this.setupGlobalListeners();
                
                // Check authentication
                await this.checkAuth();
                
                // Initialize PWA
                if (this.config.features.pwaEnabled) {
                    this.initPWA();
                }
                
                this.initialized = true;
                console.log('✅ Enterprise System Ready');
                console.log(`⏱️ Initialization time: ${Date.now() - this.startTime}ms`);
                
                this.events.emit('core:initialized', this);
                return this;
            } catch (error) {
                console.error('❌ Enterprise initialization failed:', error);
                throw error;
            }
        }

        async initModules() {
            // Register core modules
            this.registerModule('auth', new AuthManager(this));
            this.registerModule('api', new APIManager(this));
            this.registerModule('db', new DatabaseManager(this));
            this.registerModule('router', new RouterManager(this));
            this.registerModule('ui', new UIManager(this));
            
            // Initialize each module
            for (const [name, module] of this.modules) {
                if (module.initialize) {
                    await module.initialize();
                    console.log(`  ✓ Module "${name}" initialized`);
                }
            }
        }

        registerModule(name, module) {
            this.modules.set(name, module);
            this[name] = module;
        }

        setupGlobalListeners() {
            // Online/Offline detection
            window.addEventListener('online', () => {
                this.events.emit('network:online');
                this.notifications.success('Koneksi internet kembali tersedia');
            });
            
            window.addEventListener('offline', () => {
                this.events.emit('network:offline');
                this.notifications.warning('Anda sedang offline. Data akan disimpan secara lokal.');
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                // Ctrl+S for quick save
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    this.events.emit('shortcut:save');
                }
                // Escape to close modals
                if (e.key === 'Escape') {
                    this.events.emit('shortcut:escape');
                }
            });

            // Error handling
            window.addEventListener('error', (event) => {
                console.error('Global error:', event.error);
                this.events.emit('error:global', event.error);
            });

            window.addEventListener('unhandledrejection', (event) => {
                console.error('Unhandled rejection:', event.reason);
                this.events.emit('error:rejection', event.reason);
            });
        }

        async checkAuth() {
            const token = this.storage.get(this.config.security.tokenKey);
            const user = this.storage.get(this.config.security.userKey);
            
            if (token && user) {
                this.state.set('isAuthenticated', true);
                this.state.set('currentUser', user);
                this.state.set('authToken', token);
            } else {
                this.state.set('isAuthenticated', false);
                this.state.set('currentUser', null);
            }
        }

        initPWA() {
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/service-worker.js')
                        .then(registration => {
                            console.log('📱 PWA Service Worker registered:', registration.scope);
                            this.state.set('pwaRegistered', true);
                        })
                        .catch(error => {
                            console.error('PWA registration failed:', error);
                            this.state.set('pwaRegistered', false);
                        });
                });
            }
        }

        isAuthenticated() {
            return this.state.get('isAuthenticated', false);
        }

        getCurrentUser() {
            return this.state.get('currentUser', null);
        }

        hasPermission(permission) {
            const user = this.getCurrentUser();
            if (!user) return false;
            return user.permissions?.includes(permission) || user.permissions?.includes('*') || false;
        }

        hasRole(role) {
            const user = this.getCurrentUser();
            if (!user) return false;
            return user.role?.slug === role;
        }

        getUptime() {
            return Date.now() - this.startTime;
        }

        getSystemInfo() {
            return {
                version: this.version,
                uptime: this.getUptime(),
                authenticated: this.isAuthenticated(),
                user: this.getCurrentUser()?.nama_lengkap || 'Guest',
                online: navigator.onLine,
                modules: Array.from(this.modules.keys()),
                features: Object.entries(this.config.features)
                    .filter(([_, enabled]) => enabled)
                    .map(([feature]) => feature),
            };
        }

        destroy() {
            this.events.clear();
            this.state.clear();
            this.notifications.clearAll();
            this.modules.clear();
            this.initialized = false;
        }
    }

    // ==================== AUTH MANAGER ====================
    class AuthManager {
        constructor(core) {
            this.core = core;
            this.loginAttempts = new Map();
        }

        async initialize() {
            // Load login attempts from storage
            const saved = this.core.storage.get('loginAttempts');
            if (saved) {
                this.loginAttempts = new Map(Object.entries(saved));
            }
        }

        async login(email, password, remember = false) {
            // Check if account is locked
            if (this.isLocked(email)) {
                throw new EnterpriseError('ACCOUNT_LOCKED', 'Akun terkunci. Silakan coba lagi dalam 15 menit.');
            }

            try {
                // Encode credentials with Base64
                const credentials = this.core.base64.encodeObject({
                    email,
                    password,
                    remember,
                    timestamp: Date.now(),
                    deviceInfo: this.getDeviceInfo(),
                });

                // Call API
                const response = await this.core.api.call('auth/login', {
                    credentials,
                    action: 'auth/login',
                });

                if (response.success) {
                    // Reset login attempts
                    this.loginAttempts.delete(email);
                    
                    // Save tokens
                    this.core.storage.set(this.core.config.security.tokenKey, response.data.token);
                    this.core.storage.set(this.core.config.security.refreshKey, response.data.refreshToken);
                    this.core.storage.set(this.core.config.security.userKey, response.data.user);
                    
                    if (remember) {
                        this.core.storage.set('rememberedEmail', email);
                    }

                    // Update state
                    this.core.state.set('isAuthenticated', true);
                    this.core.state.set('currentUser', response.data.user);
                    this.core.state.set('authToken', response.data.token);

                    // Log activity
                    await this.logActivity('login', 'User logged in successfully');

                    this.core.events.emit('auth:login', response.data.user);
                    
                    return response.data;
                } else {
                    this.incrementAttempts(email);
                    throw new EnterpriseError('LOGIN_FAILED', response.message || 'Login gagal');
                }
            } catch (error) {
                this.incrementAttempts(email);
                throw error;
            }
        }

        async logout() {
            try {
                await this.core.api.call('auth/logout');
            } catch (error) {
                console.warn('Logout API call failed:', error);
            }

            // Clear all auth data
            this.core.storage.remove(this.core.config.security.tokenKey);
            this.core.storage.remove(this.core.config.security.refreshKey);
            this.core.storage.remove(this.core.config.security.userKey);
            
            this.core.state.set('isAuthenticated', false);
            this.core.state.set('currentUser', null);
            this.core.state.set('authToken', null);

            await this.logActivity('logout', 'User logged out');
            
            this.core.events.emit('auth:logout');
            
            window.location.href = '/login.html';
        }

        async refreshToken() {
            const refreshToken = this.core.storage.get(this.core.config.security.refreshKey);
            if (!refreshToken) {
                throw new EnterpriseError('NO_REFRESH_TOKEN', 'No refresh token available');
            }

            try {
                const response = await this.core.api.call('auth/refresh', {
                    refreshToken: this.core.base64.encode(refreshToken),
                    action: 'auth/refresh',
                });

                if (response.success) {
                    this.core.storage.set(this.core.config.security.tokenKey, response.data.token);
                    this.core.state.set('authToken', response.data.token);
                    return response.data.token;
                } else {
                    throw new EnterpriseError('REFRESH_FAILED', 'Token refresh failed');
                }
            } catch (error) {
                await this.logout();
                throw error;
            }
        }

        incrementAttempts(email) {
            const attempts = this.loginAttempts.get(email) || { count: 0, firstAttempt: Date.now() };
            attempts.count++;
            if (!attempts.firstAttempt) {
                attempts.firstAttempt = Date.now();
            }
            this.loginAttempts.set(email, attempts);
            
            // Persist to storage
            const obj = Object.fromEntries(this.loginAttempts);
            this.core.storage.set('loginAttempts', obj);
        }

        isLocked(email) {
            const attempts = this.loginAttempts.get(email);
            if (!attempts) return false;

            // Reset after lockout duration
            if (Date.now() - attempts.firstAttempt > this.core.config.security.lockoutDuration * 1000) {
                this.loginAttempts.delete(email);
                return false;
            }

            return attempts.count >= this.core.config.security.maxLoginAttempts;
        }

        getDeviceInfo() {
            return {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                cores: navigator.hardwareConcurrency || 'unknown',
                memory: navigator.deviceMemory || 'unknown',
            };
        }

        async logActivity(action, description, metadata = {}) {
            try {
                const user = this.core.getCurrentUser();
                const logData = {
                    user_id: user?.id,
                    user_name: user?.nama_lengkap,
                    action,
                    description,
                    metadata: this.core.base64.encodeObject(metadata),
                    ip: 'client-side',
                    user_agent: navigator.userAgent.substring(0, 200),
                    timestamp: new Date().toISOString(),
                };

                // Fire and forget
                this.core.api.call('logs/create', { ...logData, action: 'logs/create' }).catch(() => {});
            } catch (error) {
                console.error('Log activity error:', error);
            }
        }
    }

    // ==================== API MANAGER ====================
    class APIManager {
        constructor(core) {
            this.core = core;
            this.baseUrl = core.config.gas.primaryUrl;
            this.fallbackUrl = core.config.gas.fallbackUrl;
            this.pendingRequests = new Map();
            this.requestQueue = [];
            this.isOnline = navigator.onLine;
        }

        async initialize() {
            // Load queued requests
            const queue = this.core.storage.get('apiQueue', []);
            this.requestQueue = queue;
            
            // Process queue if online
            if (this.isOnline && this.requestQueue.length > 0) {
                await this.processQueue();
            }
        }

        async call(endpoint, params = {}, options = {}) {
            const defaultOptions = {
                method: 'GET',
                timeout: this.core.config.gas.timeout,
                retries: this.core.config.gas.retryAttempts,
                useBase64: this.core.config.gas.useBase64,
                requireAuth: true,
                cache: false,
            };

            const opts = { ...defaultOptions, ...options };
            const requestId = this.generateRequestId();

            // Add auth token if required
            if (opts.requireAuth) {
                const token = this.core.state.get('authToken');
                if (token) {
                    params._token = token;
                }
            }

            // Add metadata
            params._requestId = requestId;
            params._timestamp = Date.now();
            params._version = this.core.version;

            // Encode with Base64
            let encodedParams;
            if (opts.useBase64) {
                encodedParams = this.core.base64.encodeObject(params);
            } else {
                encodedParams = JSON.stringify(params);
            }

            // Build URL
            const url = this.buildUrl(endpoint, encodedParams);

            try {
                const response = await this.executeRequest(url, requestId, opts);
                return this.decodeResponse(response);
            } catch (error) {
                if (opts.retries > 0) {
                    await this.delay(this.core.config.gas.retryDelay);
                    return this.call(endpoint, params, { ...opts, retries: opts.retries - 1 });
                }
                throw error;
            }
        }

        buildUrl(endpoint, encodedData) {
            const url = new URL(this.baseUrl);
            url.searchParams.set('action', endpoint);
            url.searchParams.set('data', encodedData);
            url.searchParams.set('_t', Date.now());
            return url.toString();
        }

        executeRequest(url, requestId, opts) {
            return new Promise((resolve, reject) => {
                const callbackName = `gasCallback_${requestId}`;
                
                const timeout = setTimeout(() => {
                    cleanup();
                    reject(new EnterpriseError('TIMEOUT', `Request ${requestId} timed out`));
                }, opts.timeout);

                window[callbackName] = function(response) {
                    cleanup();
                    resolve(response);
                };

                const script = document.createElement('script');
                script.src = `${url}&callback=${callbackName}`;
                script.onerror = () => {
                    cleanup();
                    reject(new EnterpriseError('NETWORK_ERROR', 'Network request failed'));
                };

                function cleanup() {
                    clearTimeout(timeout);
                    delete window[callbackName];
                    if (script.parentNode) script.parentNode.removeChild(script);
                }

                document.head.appendChild(script);
            });
        }

        decodeResponse(response) {
            try {
                if (typeof response === 'string' && this.core.base64.isBase64(response)) {
                    return this.core.base64.decodeObject(response);
                }
                if (typeof response === 'object') return response;
                return JSON.parse(response);
            } catch (error) {
                console.error('Response decode error:', error);
                return response;
            }
        }

        async uploadFile(endpoint, file, params = {}) {
            const fileData = await this.core.base64.encodeFile(file);
            const uploadParams = {
                ...params,
                fileData: fileData.data,
                fileName: fileData.fileName,
                mimeType: fileData.mimeType,
                fileSize: fileData.size,
            };
            return this.call(endpoint, uploadParams, { timeout: 60000 });
        }

        queueRequest(endpoint, params) {
            this.requestQueue.push({ endpoint, params, timestamp: Date.now() });
            this.core.storage.set('apiQueue', this.requestQueue);
        }

        async processQueue() {
            if (!this.isOnline || this.requestQueue.length === 0) return;

            const queue = [...this.requestQueue];
            this.requestQueue = [];

            for (const request of queue) {
                try {
                    await this.call(request.endpoint, request.params);
                } catch (error) {
                    this.requestQueue.push(request);
                }
            }

            this.core.storage.set('apiQueue', this.requestQueue);
        }

        generateRequestId() {
            return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    // ==================== DATABASE MANAGER ====================
    class DatabaseManager {
        constructor(core) {
            this.core = core;
            this.db = null;
            this.dbName = core.config.database.name;
            this.dbVersion = core.config.database.version;
        }

        async initialize() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);

                request.onerror = () => {
                    console.error('Database initialization failed:', request.error);
                    reject(request.error);
                };

                request.onsuccess = () => {
                    this.db = request.result;
                    console.log('✅ IndexedDB initialized');
                    resolve(this.db);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    this.createTables(db);
                };
            });
        }

        createTables(db) {
            const tables = this.core.config.database.tables;

            // Users table
            if (!db.objectStoreNames.contains(tables.users)) {
                const store = db.createObjectStore(tables.users, { keyPath: 'id', autoIncrement: true });
                store.createIndex('email', 'email', { unique: true });
                store.createIndex('role', 'role_id');
                store.createIndex('instansi', 'instansi_id');
            }

            // Surat Masuk table
            if (!db.objectStoreNames.contains(tables.suratMasuk)) {
                const store = db.createObjectStore(tables.suratMasuk, { keyPath: 'id', autoIncrement: true });
                store.createIndex('no_agenda', 'no_agenda', { unique: true });
                store.createIndex('tanggal', 'tanggal');
                store.createIndex('status', 'status');
            }

            // Surat Keluar table
            if (!db.objectStoreNames.contains(tables.suratKeluar)) {
                const store = db.createObjectStore(tables.suratKeluar, { keyPath: 'id', autoIncrement: true });
                store.createIndex('no_agenda', 'no_agenda', { unique: true });
                store.createIndex('tanggal', 'tanggal');
            }

            // Disposisi table
            if (!db.objectStoreNames.contains(tables.disposisi)) {
                const store = db.createObjectStore(tables.disposisi, { keyPath: 'id', autoIncrement: true });
                store.createIndex('surat_id', 'surat_id');
                store.createIndex('user_id', 'user_id');
            }

            // Activity Logs table
            if (!db.objectStoreNames.contains(tables.logs)) {
                const store = db.createObjectStore(tables.logs, { keyPath: 'id', autoIncrement: true });
                store.createIndex('user_id', 'user_id');
                store.createIndex('timestamp', 'timestamp');
            }
        }

        async add(table, data) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([table], 'readwrite');
                const store = transaction.objectStore(table);
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

        async getAll(table) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([table], 'readonly');
                const store = transaction.objectStore(table);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async update(table, id, data) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([table], 'readwrite');
                const store = transaction.objectStore(table);
                const getRequest = store.get(id);
                getRequest.onsuccess = () => {
                    const existing = getRequest.result;
                    const updated = { ...existing, ...data, id, updated_at: new Date().toISOString() };
                    const putRequest = store.put(updated);
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
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }

    // ==================== ROUTER MANAGER ====================
    class RouterManager {
        constructor(core) {
            this.core = core;
            this.routes = new Map();
            this.currentRoute = null;
            this.params = {};
        }

        async initialize() {
            // Listen for popstate events
            window.addEventListener('popstate', (event) => {
                if (event.state) {
                    this.navigate(event.state.path, false);
                }
            });

            // Handle initial route
            const path = window.location.pathname;
            this.navigate(path, false);
        }

        addRoute(path, handler, options = {}) {
            this.routes.set(path, { handler, options });
            return this;
        }

        async navigate(path, pushState = true) {
            // Find matching route
            const route = this.findRoute(path);
            
            if (!route) {
                // 404 handling
                if (this.routes.has('*')) {
                    return this.routes.get('*').handler({ path, params: {} });
                }
                console.warn(`No route found for: ${path}`);
                return;
            }

            // Check authentication requirement
            if (route.options.requireAuth && !this.core.isAuthenticated()) {
                this.core.storage.set('redirectAfterLogin', path);
                window.location.href = '/login.html';
                return;
            }

            // Check permissions
            if (route.options.permission && !this.core.hasPermission(route.options.permission)) {
                this.core.notifications.error('Anda tidak memiliki izin untuk mengakses halaman ini.');
                return;
            }

            // Update state
            if (pushState) {
                window.history.pushState({ path }, '', path);
            }

            this.currentRoute = route;
            this.core.events.emit('route:changed', { path, route });

            // Execute handler
            try {
                await route.handler({ path, params: this.params });
            } catch (error) {
                console.error('Route handler error:', error);
            }
        }

        findRoute(path) {
            // Exact match
            if (this.routes.has(path)) {
                return this.routes.get(path);
            }

            // Pattern match
            for (const [pattern, route] of this.routes) {
                const match = this.matchPattern(pattern, path);
                if (match) {
                    this.params = match.params;
                    return route;
                }
            }

            return null;
        }

        matchPattern(pattern, path) {
            // Convert pattern to regex
            const regexStr = pattern
                .replace(/\//g, '\\/')
                .replace(/:(\w+)/g, '(?<$1>[^/]+)')
                .replace(/\*/g, '.*');
            
            const regex = new RegExp(`^${regexStr}$`);
            const match = path.match(regex);

            if (match) {
                return { params: match.groups || {} };
            }

            return null;
        }
    }

    // ==================== UI MANAGER ====================
    class UIManager {
        constructor(core) {
            this.core = core;
            this.loadingOverlay = null;
            this.modals = new Map();
        }

        async initialize() {
            this.createLoadingOverlay();
        }

        createLoadingOverlay() {
            this.loadingOverlay = document.createElement('div');
            this.loadingOverlay.id = 'enterprise-loading';
            this.loadingOverlay.style.cssText = `
                display: none;
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(255,255,255,0.9);
                z-index: 99999;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                gap: 16px;
            `;
            this.loadingOverlay.innerHTML = `
                <div style="width: 48px; height: 48px; border: 4px solid #e5e7eb; border-top-color: #1a56db; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                <p style="color: #6b7280; font-family: sans-serif; font-size: 14px;">Memproses...</p>
            `;
            document.body.appendChild(this.loadingOverlay);

            // Add animation style
            const style = document.createElement('style');
            style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }

        showLoading(message = 'Memproses...') {
            const overlay = this.loadingOverlay;
            const textEl = overlay.querySelector('p');
            textEl.textContent = message;
            overlay.style.display = 'flex';
        }

        hideLoading() {
            if (this.loadingOverlay) {
                this.loadingOverlay.style.display = 'none';
            }
        }

        showModal(id, content, options = {}) {
            // Remove existing modal with same ID
            this.closeModal(id);

            const modal = document.createElement('div');
            modal.id = `modal-${id}`;
            modal.className = 'enterprise-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
                animation: fadeIn 0.3s ease;
            `;

            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background: white;
                border-radius: 16px;
                padding: 32px;
                max-width: ${options.maxWidth || '600px'};
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: slideUp 0.3s ease;
            `;
            modalContent.innerHTML = content;

            // Close button
            if (options.showClose !== false) {
                const closeBtn = document.createElement('button');
                closeBtn.innerHTML = '✕';
                closeBtn.style.cssText = `
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: #f3f4f6;
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                `;
                closeBtn.onmouseover = () => closeBtn.style.background = '#e5e7eb';
                closeBtn.onmouseout = () => closeBtn.style.background = '#f3f4f6';
                closeBtn.onclick = () => this.closeModal(id);
                modalContent.style.position = 'relative';
                modalContent.appendChild(closeBtn);
            }

            modal.appendChild(modalContent);

            // Close on backdrop click
            if (options.closeOnBackdrop !== false) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeModal(id);
                    }
                });
            }

            document.body.appendChild(modal);
            this.modals.set(id, modal);

            // Prevent body scroll
            document.body.style.overflow = 'hidden';

            return modal;
        }

        closeModal(id) {
            const modal = this.modals.get(id);
            if (modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300);
                this.modals.delete(id);
            }

            // Restore body scroll if no more modals
            if (this.modals.size === 0) {
                document.body.style.overflow = '';
            }
        }

        closeAllModals() {
            this.modals.forEach((_, id) => this.closeModal(id));
        }
    }

    // ==================== CREATE AND EXPORT ENTERPRISE CORE ====================
    const EnterpriseCore = new EnterpriseCoreClass();

    // Export to global scope
    global.EnterpriseCore = EnterpriseCore;
    global.EnterpriseBase64 = EnterpriseBase64;
    global.EnterpriseError = EnterpriseError;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => EnterpriseCore.initialize());
    } else {
        EnterpriseCore.initialize();
    }

})(window);
