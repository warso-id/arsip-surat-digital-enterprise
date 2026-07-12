/**
 * ============================================
 * API.JS - API Communication Layer
 * ARSIP SURAT DIGITAL v3.2.2
 * FIXED: CORS & Connection Issues
 * ============================================
 */

const API = {
    // ========== CONFIGURATION ==========
    baseUrl: 'https://script.google.com/macros/s/AKfycbzzmttzSRYsM7KodsEdFqHRdwBs2kY7VTzFPOpsiab3p3v-6CBl-eKIuUI0Vhqd0opYtA/exec',
    
    // ========== SETUP ==========
    init(baseUrl) {
        this.baseUrl = baseUrl || this.baseUrl;
        console.log('✅ API initialized with baseUrl:', this.baseUrl);
    },
    
    // ========== GENERIC REQUEST ==========
    async request(action, method = 'GET', data = null, token = null, csrf = null) {
        try {
            const url = new URL(this.baseUrl);
            url.searchParams.set('action', action);
            
            if (token) {
                url.searchParams.set('token', token);
            }
            
            if (csrf && method !== 'GET') {
                url.searchParams.set('csrf', csrf);
            }
            
            const options = {
                method: method,
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                }
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }
            
            console.log(`📡 ${method} Request:`, url.toString());
            
            const response = await fetch(url.toString(), options);
            
            // Cek response status
            if (!response.ok) {
                const errorText = await response.text();
                console.error('HTTP Error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`);
            }
            
            const result = await response.json();
            console.log('📥 Response:', result);
            
            if (result.status === 'error' && result.code === 401) {
                if (token) {
                    App.clearSession();
                    App.showAuth();
                    showToast('error', 'Session Expired', 'Silakan login kembali');
                }
            }
            
            return result;
        } catch (error) {
            console.error('❌ API Error:', error);
            throw new Error('Koneksi ke server gagal: ' + error.message);
        }
    },
    
    // ========== GET REQUEST ==========
    async get(action, params = {}) {
        try {
            const { token = App.token, ...rest } = params;
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
            
            const response = await fetch(url.toString(), {
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log('📥 Response:', result);
            return result;
        } catch (error) {
            console.error('❌ API GET Error:', error);
            throw new Error('Koneksi ke server gagal: ' + error.message);
        }
    },
    
    // ========== POST REQUEST ==========
    async post(action, data = {}, token = null) {
        const useToken = token || App.token;
        const useCsrf = App.csrf;
        
        console.log(`📡 POST Request: ${action}`, { data, hasToken: !!useToken, hasCsrf: !!useCsrf });
        
        return this.request(action, 'POST', data, useToken, useCsrf);
    },
    
    // ========== PUT REQUEST ==========
    async put(action, data = {}, token = null) {
        return this.request(action, 'PUT', data, token || App.token, App.csrf);
    },
    
    // ========== DELETE REQUEST ==========
    async delete(action, token = null) {
        return this.request(action, 'DELETE', null, token || App.token, App.csrf);
    },
    
    // ========== UPLOAD FILE ==========
    async uploadFile(file, token = null) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('action', 'file.upload');
        
        if (token || App.token) {
            formData.append('token', token || App.token);
        }
        if (App.csrf) {
            formData.append('csrf', App.csrf);
        }
        
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                mode: 'cors',
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Upload Error:', error);
            throw new Error('Upload file gagal');
        }
    },
    
    // ========== UPLOAD MULTIPLE FILES ==========
    async uploadMultipleFiles(files, token = null) {
        const formData = new FormData();
        files.forEach((file, index) => {
            formData.append(`file${index}`, file);
        });
        formData.append('action', 'file.uploadMultiple');
        formData.append('filenames', files.map(f => f.name).join(','));
        
        if (token || App.token) {
            formData.append('token', token || App.token);
        }
        if (App.csrf) {
            formData.append('csrf', App.csrf);
        }
        
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                mode: 'cors',
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Upload Error:', error);
            throw new Error('Upload multiple file gagal');
        }
    },
    
    // ========== TEST CONNECTION ==========
    async testConnection() {
        try {
            const response = await this.get('ping');
            console.log('✅ Connection test:', response);
            return response;
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            throw error;
        }
    }
};

// ========== AUTO INIT ==========
// Initialize with the deployment URL
API.init('https://script.google.com/macros/s/AKfycbzzmttzSRYsM7KodsEdFqHRdwBs2kY7VTzFPOpsiab3p3v-6CBl-eKIuUI0Vhqd0opYtA/exec');

console.log('✅ API Module Loaded');
console.log('📍 API Base URL:', API.baseUrl);
