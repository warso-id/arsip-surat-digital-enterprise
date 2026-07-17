/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * UNIVERSAL STARTUP SCRIPT
 * ============================================================
 * INCLUDE THIS FIRST IN EVERY HTML PAGE (before any other script)
 * This script initializes the entire enterprise system
 * ============================================================
 */

(function(global) {
    'use strict';

    // ==================== GLOBAL CONFIGURATION ====================
    global.ENTERPRISE_CONFIG = {
        version: '3.0.0',
        build: '2024.01.20',
        
        // Google Apps Script Connection
        gas: {
            url: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
            encoding: 'base64',
            protocol: 'jsonp',
            timeout: 30000,
            retries: 3,
        },
        
        // Feature Flags
        features: {
            auth: true,
            pwa: true,
            offline: true,
            notifications: true,
            backup: true,
            monitoring: true,
            cache: true,
            i18n: true,
            themes: true,
        },
        
        // Debug
        debug: false,
        logLevel: 'warn', // trace, debug, info, warn, error
    };

    // ==================== MINIMAL BASE64 (NO DEPENDENCIES) ====================
    global.__BASE64 = {
        encode: function(data) {
            try {
                if (typeof data === 'object') data = JSON.stringify(data);
                return btoa(unescape(encodeURIComponent(data)));
            } catch(e) { return null; }
        },
        decode: function(encoded) {
            try {
                return decodeURIComponent(escape(atob(encoded)));
            } catch(e) { return null; }
        },
        encodeObject: function(obj) { return this.encode(JSON.stringify(obj)); },
        decodeObject: function(encoded) { return JSON.parse(this.decode(encoded)); }
    };

    // ==================== MINIMAL GAS CONNECTOR (NO DEPENDENCIES) ====================
    global.__GAS = {
        request: function(action, data, callback) {
            const cbName = '_gas_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
            const payload = global.__BASE64.encodeObject({ ...data, action: action, _t: Date.now() });
            const url = global.ENTERPRISE_CONFIG.gas.url + '?action=' + action + '&data=' + payload + '&callback=' + cbName;
            
            return new Promise(function(resolve, reject) {
                const timeout = setTimeout(function() {
                    cleanup();
                    reject(new Error('GAS timeout'));
                }, global.ENTERPRISE_CONFIG.gas.timeout);
                
                global[cbName] = function(response) {
                    cleanup();
                    try {
                        if (typeof response === 'string' && response.startsWith('ey')) {
                            response = global.__BASE64.decodeObject(response);
                        }
                        if (callback) callback(null, response);
                        resolve(response);
                    } catch(e) {
                        if (callback) callback(e);
                        reject(e);
                    }
                };
                
                const script = document.createElement('script');
                script.src = url;
                script.onerror = function() {
                    cleanup();
                    const err = new Error('GAS network error');
                    if (callback) callback(err);
                    reject(err);
                };
                
                function cleanup() {
                    clearTimeout(timeout);
                    delete global[cbName];
                    if (script.parentNode) script.parentNode.removeChild(script);
                }
                
                document.head.appendChild(script);
            });
        },
        
        ping: function() {
            return this.request('system/ping', {});
        }
    };

    // ==================== MINIMAL STORAGE (NO DEPENDENCIES) ====================
    global.__STORE = {
        set: function(key, value) {
            try {
                if (typeof value === 'object') value = JSON.stringify(value);
                localStorage.setItem('asde_' + key, value);
                return true;
            } catch(e) { return false; }
        },
        get: function(key, defaultValue) {
            try {
                const value = localStorage.getItem('asde_' + key);
                if (!value) return defaultValue;
                try { return JSON.parse(value); } catch(e) { return value; }
            } catch(e) { return defaultValue; }
        },
        remove: function(key) { localStorage.removeItem('asde_' + key); },
        clear: function() {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k.startsWith('asde_')) keys.push(k);
            }
            keys.forEach(function(k) { localStorage.removeItem(k); });
        }
    };

    // ==================== MINIMAL LOGGER (NO DEPENDENCIES) ====================
    global.__LOG = {
        levels: { TRACE: 0, DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 },
        currentLevel: 20,
        
        log: function(level, message, data) {
            if (this.levels[level] < this.currentLevel) return;
            const prefix = '[' + level + '] ' + new Date().toLocaleTimeString();
            const method = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log';
            if (data) console[method](prefix, message, data);
            else console[method](prefix, message);
        },
        
        info: function(msg, data) { this.log('INFO', msg, data); },
        warn: function(msg, data) { this.log('WARN', msg, data); },
        error: function(msg, data) { this.log('ERROR', msg, data); },
        debug: function(msg, data) { this.log('DEBUG', msg, data); }
    };

    // ==================== STARTUP SEQUENCE ====================
    function startup() {
        const startTime = performance.now();
        
        global.__LOG.info('🚀 Enterprise Startup v' + global.ENTERPRISE_CONFIG.version);
        global.__LOG.info('📡 GAS URL: ' + global.ENTERPRISE_CONFIG.gas.url);
        global.__LOG.info('🔐 Base64 Encoding: ACTIVE');
        global.__LOG.info('📄 Page: ' + (window.location.pathname.split('/').pop() || 'index.html'));
        
        // Set startup timestamp
        global.__STARTUP_TIME = startTime;
        
        // Set session ID
        if (!sessionStorage.getItem('asde_session')) {
            sessionStorage.setItem('asde_session', 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2,9));
        }
        
        // Check authentication
        const token = global.__STORE.get('token');
        const user = global.__STORE.get('user');
        global.__AUTH = {
            isAuthenticated: !!(token && user),
            token: token,
            user: user,
            hasPermission: function(perm) {
                return this.user && (this.user.permissions || []).includes(perm) || (this.user.permissions || []).includes('*');
            }
        };
        
        // Check online status
        global.__ONLINE = navigator.onLine;
        
        // Test GAS connection (non-blocking)
        global.__GAS.ping().then(function(r) {
            global.__LOG.info('✅ GAS Connected' + (r && r.latency ? ' (' + r.latency + 'ms)' : ''));
        }).catch(function() {
            global.__LOG.warn('⚠️ GAS connection pending - will retry');
        });
        
        // Hide loading screen
        setTimeout(function() {
            const loader = document.getElementById('loading-screen');
            if (loader) {
                loader.classList.add('hidden');
                setTimeout(function() { if (loader.parentNode) loader.remove(); }, 500);
            }
        }, 300);
        
        // Log completion
        const loadTime = (performance.now() - startTime).toFixed(2);
        global.__LOG.info('✅ Startup complete in ' + loadTime + 'ms');
        
        // Dispatch ready event
        global.dispatchEvent(new CustomEvent('enterprise:ready', {
            detail: { loadTime: parseFloat(loadTime), version: global.ENTERPRISE_CONFIG.version }
        }));
    }

    // ==================== EXECUTE STARTUP ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startup);
    } else {
        startup();
    }

    // ==================== EXPORT ====================
    global.startup = {
        config: global.ENTERPRISE_CONFIG,
        base64: global.__BASE64,
        gas: global.__GAS,
        store: global.__STORE,
        log: global.__LOG,
        auth: global.__AUTH,
        isOnline: function() { return global.__ONLINE; },
        getStartupTime: function() { return global.__STARTUP_TIME; }
    };

})(window);
