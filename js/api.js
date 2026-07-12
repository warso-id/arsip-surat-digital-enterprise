/**
 * ============================================
 * API.JS - API Communication Layer - FINAL FIX
 * ARSIP SURAT DIGITAL v3.2.2
 * FIXED: CORS, Error Handling, Timeout
 * ============================================
 */

const API = {
    // ========== CONFIGURATION ==========
    // 🔥 UPDATE DENGAN URL DEPLOYMENT TERBARU
    baseUrl: 'https://script.google.com/macros/s/AKfycbyV2a5DBBJWCNKYE_AXbu_rM_8inZv9L1d2uLRi8_dVZQfDtAt9ldBPge2FOs0dyGS5TA/exec',
    
    // ========== SETUP ==========
    init(baseUrl) {
        this.baseUrl = baseUrl || this.baseUrl;
        console.log('✅ API initialized with baseUrl:', this.baseUrl);
        return this;
    },
    
    // ========== GET APP REFERENCE ==========
    _getApp() {
        try {
            return typeof App !== 'undefined' ? App : null;
        } catch (e) {
            return null;
        }
    },
    
    // ========== GENERIC REQUEST ==========
    async request(action, method = 'GET', data = null, token = null, csrf = null) {
        try {
            const url = new URL(this.baseUrl);
            url.searchParams.set('action', action);
            
            if (token) {
                url.searchParams.set('token', token);
            }
            
            if (data && data.id) {
                url.searchParams.set('id', data.id);
            }
            
            if (csrf && method !== 'GET') {
                url.searchParams.set('csrf', csrf);
            }
            
            const options = {
                method: method,
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                const bodyData = { ...data };
                delete bodyData.id;
                if (Object.keys(bodyData).length > 0) {
                    options.body = JSON.stringify(bodyData);
                }
            }
            
            console.log(`📡 ${method} Request:`, {
                url: url.toString(),
                hasToken: !!token,
                hasCsrf: !!csrf,
                hasData: !!data
            });
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            options.signal = controller.signal;
            
            const response = await fetch(url.toString(), options);
            clearTimeout(timeoutId);
            
            // 🔥 FIX: Cek response status
            if (!response.ok) {
                console.error('❌ HTTP Error:', response.status);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            console.log('📥 Raw Response:', text.substring(0, 300));
            
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('❌ Invalid JSON response:', text);
                throw new Error('Respons dari server tidak valid');
            }
            
            console.log('📥 Parsed Response:', result);
            
            if (result.status === 'error' && result.code === 401) {
                if (action === 'login') {
                    return result;
                }
                if (token) {
                    const app = this._getApp();
                    if (app && typeof app.clearSession === 'function') {
                        app.clearSession();
                        app.showAuth();
                    }
                    this._showToast('error', 'Session Expired', 'Silakan login kembali');
                }
            }
            
            return result;
        } catch (error) {
            console.error('❌ API Error:', error);
            if (error.name === 'AbortError') {
                throw new Error('Koneksi timeout. Periksa koneksi internet.');
            }
            throw new Error('Koneksi ke server gagal: ' + error.message);
        }
    },
    
    // ========== GET REQUEST ==========
    async get(action, params = {}) {
        try {
            let token = null;
            try {
                const app = this._getApp();
                if (app && app.token) {
                    token = app.token;
                }
            } catch (e) {}
            
            if (params.token !== undefined) {
                token = params.token;
            }
            
            const { token: _, ...rest } = params;
            const url = new URL(this.baseUrl);
            url.searchParams.set('action', action);
            
            Object.keys(rest).forEach(key => {
                if (rest[key] !== undefined && rest[key] !== null && rest[key] !== '') {
                    url.searchParams.set(key, rest[key]);
                }
            });
            
            if (token) {
                url.searchParams.set('token', token);
            }
            
            console.log(`📡 GET Request:`, url.toString());
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const response = await fetch(url.toString(), {
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                console.error('❌ HTTP Error:', response.status);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('❌ Invalid JSON:', text);
                throw new Error('Respons dari server tidak valid');
            }
            
            console.log('📥 GET Response:', result);
            return result;
        } catch (error) {
            console.error('❌ API GET Error:', error);
            if (error.name === 'AbortError') {
                throw new Error('Koneksi timeout. Periksa koneksi internet.');
            }
            throw error;
        }
    },
    
    // ========== POST REQUEST ==========
    async post(action, data = {}, token = null) {
        let useToken = token;
        let useCsrf = null;
        try {
            const app = this._getApp();
            if (!useToken && app && app.token) {
                useToken = app.token;
            }
            if (app && app.csrf) {
                useCsrf = app.csrf;
            }
        } catch (e) {}
        
        console.log(`📡 POST Request: ${action}`, { 
            data: data, 
            hasToken: !!useToken, 
            hasCsrf: !!useCsrf 
        });
        
        return this.request(action, 'POST', data, useToken, useCsrf);
    },
    
    // ========== PUT REQUEST ==========
    async put(action, data = {}, token = null) {
        let useToken = token;
        let useCsrf = null;
        try {
            const app = this._getApp();
            if (!useToken && app && app.token) {
                useToken = app.token;
            }
            if (app && app.csrf) {
                useCsrf = app.csrf;
            }
        } catch (e) {}
        
        return this.request(action, 'PUT', data, useToken, useCsrf);
    },
    
    // ========== DELETE REQUEST ==========
    async delete(action, id = null, token = null) {
        let useToken = token;
        let useCsrf = null;
        try {
            const app = this._getApp();
            if (!useToken && app && app.token) {
                useToken = app.token;
            }
            if (app && app.csrf) {
                useCsrf = app.csrf;
            }
        } catch (e) {}
        
        const data = id ? { id: id } : null;
        return this.request(action, 'DELETE', data, useToken, useCsrf);
    },
    
    // ========== TEST CONNECTION ==========
    async testConnection() {
        try {
            console.log('🔗 Testing connection...');
            console.log('📍 URL:', this.baseUrl);
            
            const response = await this.get('ping', { token: null });
            console.log('✅ Connection test:', response);
            return response;
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            return {
                status: 'error',
                message: error.message || 'Koneksi gagal'
            };
        }
    },
    
    // ========== TOAST HELPER ==========
    _showToast(type, title, message) {
        try {
            if (typeof showToast === 'function') {
                showToast(type, title, message);
            } else {
                console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
            }
        } catch (e) {
            console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        }
    }
};

// ========== AUTO INIT ==========
// 🔥 UPDATE DENGAN URL DEPLOYMENT TERBARU
API.init('https://script.google.com/macros/s/AKfycbyV2a5DBBJWCNKYE_AXbu_rM_8inZv9L1d2uLRi8_dVZQfDtAt9ldBPge2FOs0dyGS5TA/exec');

console.log('✅ API Module Loaded');
console.log('📍 API Base URL:', API.baseUrl);
