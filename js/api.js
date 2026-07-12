/**
 * ============================================
 * API.JS - API Communication Layer - FINAL FIX
 * ARSIP SURAT DIGITAL v3.2.2
 * FIXED: ID parameter handling, CSRF refresh
 * ============================================
 */

const API = {
    // ========== CONFIGURATION ==========
    baseUrl: 'https://script.google.com/macros/s/AKfycbxhOvnvXEDRBgeNgI9AKMr2scIlYIwL0MWVr17QbkqtxIx6G5TNcdR0TBewpn1wIvaRhw/exec',
    
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
            
            // 🔥 FIX: Hanya kirim token jika ada
            if (token) {
                url.searchParams.set('token', token);
            }
            
            // 🔥 FIX: Kirim ID sebagai parameter URL untuk update/delete
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
            
            // 🔥 FIX: Untuk POST/PUT, kirim data di body (tanpa id di body)
            if (data && (method === 'POST' || method === 'PUT')) {
                const bodyData = { ...data };
                delete bodyData.id; // Hapus id dari body karena sudah di URL
                options.body = JSON.stringify(bodyData);
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
                    App.clearSession();
                    App.showAuth();
                    showToast('error', 'Session Expired', 'Silakan login kembali');
                }
            }
            
            // 🔥 FIX: Refresh CSRF jika ada token baru
            if (result.data && result.data.csrf) {
                App.csrf = result.data.csrf;
                localStorage.setItem('csrf', App.csrf);
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
            
            // Refresh CSRF jika ada
            if (result.data && result.data.csrf) {
                App.csrf = result.data.csrf;
                localStorage.setItem('csrf', App.csrf);
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
        const useToken = token || App.token;
        const useCsrf = App.csrf;
        
        console.log(`📡 POST Request: ${action}`, { 
            data: data, 
            hasToken: !!useToken, 
            hasCsrf: !!useCsrf 
        });
        
        return this.request(action, 'POST', data, useToken, useCsrf);
    },
    
    // ========== PUT REQUEST ==========
    async put(action, data = {}, token = null) {
        return this.request(action, 'PUT', data, token || App.token, App.csrf);
    },
    
    // ========== DELETE REQUEST ==========
    async delete(action, id = null, token = null) {
        const data = id ? { id: id } : null;
        return this.request(action, 'DELETE', data, token || App.token, App.csrf);
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
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);
            
            const response = await fetch(this.baseUrl, {
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
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);
            
            const response = await fetch(this.baseUrl, {
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
    }
};

// ========== AUTO INIT ==========
API.init('https://script.google.com/macros/s/AKfycbxhOvnvXEDRBgeNgI9AKMr2scIlYIwL0MWVr17QbkqtxIx6G5TNcdR0TBewpn1wIvaRhw/exec');

console.log('✅ API Module Loaded');
console.log('📍 API Base URL:', API.baseUrl);
