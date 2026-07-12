/**
 * ============================================
 * API.JS - API Communication Layer
 * ARSIP SURAT DIGITAL v3.2.2
 * ============================================
 */

const API = {
    // ========== CONFIGURATION ==========
    baseUrl: 'https://script.google.com/macros/s/AKfycbzzmttzSRYsM7KodsEdFqHRdwBs2kY7VTzFPOpsiab3p3v-6CBl-eKIuUI0Vhqd0opYtA/exec', // Will be set from environment
    
    // ========== SETUP ==========
    init(baseUrl) {
        this.baseUrl = baseUrl;
    },
    
    // ========== GENERIC REQUEST ==========
    async request(action, method = 'GET', data = null, token = null, csrf = null) {
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
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url.toString(), options);
            const result = await response.json();
            
            if (result.status === 'error' && result.code === 401) {
                // Token expired, redirect to login
                if (token) {
                    App.clearSession();
                    App.showAuth();
                    showToast('error', 'Session Expired', 'Silakan login kembali');
                }
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw new Error('Koneksi ke server gagal');
        }
    },
    
    // ========== GET REQUEST ==========
    async get(action, params = {}) {
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
        
        try {
            const response = await fetch(url.toString());
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw new Error('Koneksi ke server gagal');
        }
    },
    
    // ========== POST REQUEST ==========
    async post(action, data = {}, token = null) {
        return this.request(action, 'POST', data, token || App.token, App.csrf);
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
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Upload Error:', error);
            throw new Error('Upload multiple file gagal');
        }
    }
};

// ========== CONFIGURATION ==========
// This will be set from the deployment URL
// Example: API.init('https://script.google.com/macros/s/XXXXX/exec');
