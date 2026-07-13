/**
 * ============================================
 * API.JS - API Communication Layer - FINAL FIX
 * ARSIP SURAT DIGITAL v3.2.2
 * FIXED: Menggunakan x-www-form-urlencoded untuk menghindari preflight CORS
 * ============================================
 */

const API = {
    // ========== CONFIGURATION ==========
    // 🔥 UPDATE DENGAN URL DEPLOYMENT TERBARU
    baseUrl: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
    
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
    
    // ========== BUILD URL WITH PARAMS ==========
    _buildUrl(action, params = {}) {
        const url = new URL(this.baseUrl);
        url.searchParams.set('action', action);
        
        // 🔥 Semua parameter dikirim sebagai query string
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                url.searchParams.set(key, params[key]);
            }
        });
        
        return url;
    },
    
    // ========== GENERIC REQUEST (x-www-form-urlencoded) ==========
    async request(action, method = 'GET', data = null, token = null, csrf = null) {
        try {
            // 🔥 Build params untuk URL
            const params = {};
            
            // 🔥 Tambahkan token jika ada
            if (token) {
                params.token = token;
            }
            
            // 🔥 Tambahkan CSRF jika ada dan method bukan GET
            if (csrf && method !== 'GET') {
                params.csrf = csrf;
            }
            
            // 🔥 Tambahkan ID jika ada (untuk update/delete)
            if (data && data.id) {
                params.id = data.id;
            }
            
            // 🔥 Untuk POST/PUT, tambahkan data sebagai query string
            // (bukan JSON body) untuk menghindari preflight
            if (data && (method === 'POST' || method === 'PUT')) {
                const bodyData = { ...data };
                delete bodyData.id;
                Object.keys(bodyData).forEach(key => {
                    if (bodyData[key] !== undefined && bodyData[key] !== null) {
                        params[key] = typeof bodyData[key] === 'object' 
                            ? JSON.stringify(bodyData[key]) 
                            : String(bodyData[key]);
                    }
                });
            }
            
            // 🔥 Build URL dengan semua parameter
            const url = this._buildUrl(action, params);
            
            console.log(`📡 ${method} Request:`, {
                url: url.toString(),
                hasToken: !!token,
                hasCsrf: !!csrf,
                hasData: !!data
            });
            
            // 🔥 Options untuk fetch - SIMPLE REQUEST (tanpa preflight)
            const options = {
                method: method,
                mode: 'cors',
                headers: {
                    // 🔥 Gunakan x-www-form-urlencoded (bukan application/json)
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                }
            };
            
            // 🔥 Untuk POST/PUT, kirim data sebagai form-urlencoded
            if (data && (method === 'POST' || method === 'PUT')) {
                const bodyData = { ...data };
                delete bodyData.id;
                // Konversi ke form-urlencoded
                const formBody = new URLSearchParams();
                Object.keys(bodyData).forEach(key => {
                    if (bodyData[key] !== undefined && bodyData[key] !== null) {
                        formBody.append(key, typeof bodyData[key] === 'object' 
                            ? JSON.stringify(bodyData[key]) 
                            : String(bodyData[key]));
                    }
                });
                options.body = formBody.toString();
            }
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            options.signal = controller.signal;
            
            const response = await fetch(url.toString(), options);
            clearTimeout(timeoutId);
            
            // 🔥 Cek response status
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
            
            // 🔥 Handle 401
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
            
            // 🔥 Refresh CSRF jika ada
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
            
            // 🔥 Build URL dengan semua parameter
            const url = this._buildUrl(action, rest);
            if (token) {
                url.searchParams.set('token', token);
            }
            
            console.log(`📡 GET Request:`, url.toString());
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const response = await fetch(url.toString(), {
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
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
    
    // ========== UPLOAD FILE (FormData - tetap pakai multipart) ==========
    async uploadFile(file, token = null) {
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
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('action', 'file.upload');
        
        if (useToken) {
            formData.append('token', useToken);
        }
        if (useCsrf) {
            formData.append('csrf', useCsrf);
        }
        
        const url = new URL(this.baseUrl);
        url.searchParams.set('action', 'file.upload');
        
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
            
            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('❌ Invalid JSON:', text);
                throw new Error('Upload gagal: response tidak valid');
            }
        } catch (error) {
            console.error('Upload Error:', error);
            throw new Error('Upload file gagal: ' + error.message);
        }
    },
    
    // ========== UPLOAD MULTIPLE FILES ==========
    async uploadMultipleFiles(files, token = null) {
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
        
        const formData = new FormData();
        files.forEach((file, index) => {
            formData.append(`file${index}`, file);
        });
        formData.append('filenames', files.map(f => f.name).join(','));
        formData.append('action', 'file.uploadMultiple');
        
        if (useToken) {
            formData.append('token', useToken);
        }
        if (useCsrf) {
            formData.append('csrf', useCsrf);
        }
        
        const url = new URL(this.baseUrl);
        url.searchParams.set('action', 'file.uploadMultiple');
        
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
            
            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('❌ Invalid JSON:', text);
                throw new Error('Upload multiple gagal: response tidak valid');
            }
        } catch (error) {
            console.error('Upload Error:', error);
            throw new Error('Upload multiple file gagal: ' + error.message);
        }
    },
    
    // ========== TEST CONNECTION ==========
    async testConnection() {
        try {
            console.log('🔗 Testing connection...');
            console.log('📍 URL:', this.baseUrl);
            
            // 🔥 Jangan kirim token untuk ping
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
API.init('https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec');

console.log('✅ API Module Loaded (x-www-form-urlencoded Mode)');
console.log('📍 API Base URL:', API.baseUrl);
