/**
 * ============================================
 * API.JS - API Communication Layer - FINAL FIX
 * ARSIP SURAT DIGITAL v3.2.2
 * FIXED: ID parameter handling, CSRF refresh, Error handling
 * ============================================
 */

const API = {
    // ========== CONFIGURATION ==========
    baseUrl: 'https://script.google.com/macros/s/AKfycbwA_QzyMeftZk9jkquYlpZcHXTClvDWQTYSt1j9Cr7SrmMC1VWk3bpm_2cMW1AHMXNxIQ/exec',
    
    // ========== SETUP ==========
    init(baseUrl) {
        this.baseUrl = baseUrl || this.baseUrl;
        console.log('✅ API initialized with baseUrl:', this.baseUrl);
        return this;
    },
    
    // ========== GET APP REFERENCE SAFELY ==========
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
            
            // 🔥 FIX: Hanya kirim token jika ada
            if (token) {
                url.searchParams.set('token', token);
            }
            
            // 🔥 FIX: Kirim ID sebagai parameter URL untuk update/delete
            if (data && data.id) {
                url.searchParams.set('id', data.id);
            }
            
            // 🔥 FIX: CSRF hanya untuk method non-GET
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
            
            // 🔥 FIX: Untuk POST/PUT, kirim data di body (tanpa id di body)
            if (data && (method === 'POST' || method === 'PUT')) {
                const bodyData = { ...data };
                delete bodyData.id; // Hapus id dari body karena sudah di URL
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
            
            // 🔥 FIX: Tambahkan timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            options.signal = controller.signal;
            
            const response = await fetch(url.toString(), options);
            clearTimeout(timeoutId);
            
            // Cek response
            const text = await response.text();
            console.log('📥 Raw Response:', text.substring(0, 200));
            
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('❌ Invalid JSON response:', text);
                throw new Error('Respons dari server tidak valid');
            }
            
            console.log('📥 Parsed Response:', result);
            
            // 🔥 FIX: Handle 401 dengan lebih baik
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
            
            // 🔥 FIX: Refresh CSRF jika ada token baru
            if (result.data && result.data.csrf) {
                try {
                    const app = this._getApp();
                    if (app) {
                        app.csrf = result.data.csrf;
                        if (typeof localStorage !== 'undefined') {
                            localStorage.setItem('csrf', result.data.csrf);
                        }
                    }
                } catch (e) {
                    console.warn('⚠️ Could not save CSRF:', e);
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
            // 🔥 FIX: Ambil token dengan aman
            let token = null;
            try {
                const app = this._getApp();
                if (app && app.token) {
                    token = app.token;
                }
            } catch (e) {
                // Ignore
            }
            
            // Override dengan token dari params jika ada
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
            
            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('❌ Invalid JSON:', text);
                throw new Error('Respons dari server tidak valid');
            }
            
            console.log('📥 GET Response:', result);
            
            // 🔥 FIX: Refresh CSRF jika ada
            if (result.data && result.data.csrf) {
                try {
                    const app = this._getApp();
                    if (app) {
                        app.csrf = result.data.csrf;
                        if (typeof localStorage !== 'undefined') {
                            localStorage.setItem('csrf', result.data.csrf);
                        }
                    }
                } catch (e) {
                    console.warn('⚠️ Could not save CSRF:', e);
                }
            }
            
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
        // 🔥 FIX: Ambil token dengan aman
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
        } catch (e) {
            // Ignore
        }
        
        console.log(`📡 POST Request: ${action}`, { 
            data: data, 
            hasToken: !!useToken, 
            hasCsrf: !!useCsrf 
        });
        
        return this.request(action, 'POST', data, useToken, useCsrf);
    },
    
    // ========== PUT REQUEST ==========
    async put(action, data = {}, token = null) {
        // 🔥 FIX: Ambil token dan CSRF dengan aman
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
        } catch (e) {
            // Ignore
        }
        
        return this.request(action, 'PUT', data, useToken, useCsrf);
    },
    
    // ========== DELETE REQUEST ==========
    async delete(action, id = null, token = null) {
        // 🔥 FIX: Ambil token dan CSRF dengan aman
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
        } catch (e) {
            // Ignore
        }
        
        const data = id ? { id: id } : null;
        return this.request(action, 'DELETE', data, useToken, useCsrf);
    },
    
    // ========== UPLOAD FILE ==========
    async uploadFile(file, token = null) {
        // 🔥 FIX: Ambil token dan CSRF dengan aman
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
        } catch (e) {
            // Ignore
        }
        
        // 🔥 FIX: Buat FormData dengan benar
        const formData = new FormData();
        formData.append('file', file);
        
        // 🔥 FIX: Action di URL, bukan di FormData
        const url = new URL(this.baseUrl);
        url.searchParams.set('action', 'file.upload');
        
        if (useToken) {
            url.searchParams.set('token', useToken);
        }
        if (useCsrf) {
            url.searchParams.set('csrf', useCsrf);
        }
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);
            
            const response = await fetch(url.toString(), {
                method: 'POST',
                mode: 'cors',
                body: formData,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            return await response.json();
        } catch (error) {
            console.error('Upload Error:', error);
            throw new Error('Upload file gagal');
        }
    },
    
    // ========== UPLOAD MULTIPLE FILES ==========
    async uploadMultipleFiles(files, token = null) {
        // 🔥 FIX: Ambil token dan CSRF dengan aman
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
        } catch (e) {
            // Ignore
        }
        
        // 🔥 FIX: Buat FormData dengan benar
        const formData = new FormData();
        files.forEach((file, index) => {
            formData.append(`file${index}`, file);
        });
        formData.append('filenames', files.map(f => f.name).join(','));
        
        // 🔥 FIX: Action di URL, bukan di FormData
        const url = new URL(this.baseUrl);
        url.searchParams.set('action', 'file.uploadMultiple');
        
        if (useToken) {
            url.searchParams.set('token', useToken);
        }
        if (useCsrf) {
            url.searchParams.set('csrf', useCsrf);
        }
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);
            
            const response = await fetch(url.toString(), {
                method: 'POST',
                mode: 'cors',
                body: formData,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            return await response.json();
        } catch (error) {
            console.error('Upload Error:', error);
            throw new Error('Upload multiple file gagal');
        }
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
    
    // ========== TOAST HELPER (SAFE) ==========
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
API.init('https://script.google.com/macros/s/AKfycbwA_QzyMeftZk9jkquYlpZcHXTClvDWQTYSt1j9Cr7SrmMC1VWk3bpm_2cMW1AHMXNxIQ/exec');

console.log('✅ API Module Loaded');
console.log('📍 API Base URL:', API.baseUrl);
