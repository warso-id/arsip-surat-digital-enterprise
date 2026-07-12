/**
 * ============================================
 * API.JS - CONNECT TO APPS SCRIPT
 * ARSIP SURAT DIGITAL v3.2.3
 * ============================================
 */

// ========== SET URL APPS SCRIPT ==========
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzzmttzSRYsM7KodsEdFqHRdwBs2kY7VTzFPOpsiab3p3v-6CBl-eKIuUI0Vhqd0opYtA/exec';

const API = {
    baseUrl: APP_SCRIPT_URL,
    token: null,
    csrf: null,
    
    init() {
        this.token = localStorage.getItem('token');
        this.csrf = localStorage.getItem('csrf');
    },
    
    async request(action, method = 'GET', data = null) {
        const url = new URL(this.baseUrl);
        url.searchParams.set('action', action);
        
        if (this.token) {
            url.searchParams.set('token', this.token);
        }
        
        if (this.csrf && method !== 'GET') {
            url.searchParams.set('csrf', this.csrf);
        }
        
        const options = {
            method: method,
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            console.log('📤 Request:', { url: url.toString(), method, data });
            const response = await fetch(url.toString(), options);
            const result = await response.json();
            console.log('📥 Response:', result);
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw new Error('Koneksi ke server gagal: ' + error.message);
        }
    },
    
    async get(action, params = {}) {
        const url = new URL(this.baseUrl);
        url.searchParams.set('action', action);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                url.searchParams.set(key, params[key]);
            }
        });
        
        if (this.token) {
            url.searchParams.set('token', this.token);
        }
        
        try {
            console.log('📤 GET:', url.toString());
            const response = await fetch(url.toString(), {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit',
                headers: { 'Accept': 'application/json' }
            });
            const result = await response.json();
            console.log('📥 GET Response:', result);
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw new Error('Koneksi ke server gagal');
        }
    },
    
    async post(action, data = {}) {
        return this.request(action, 'POST', data);
    },
    
    async put(action, data = {}) {
        return this.request(action, 'PUT', data);
    },
    
    async delete(action) {
        return this.request(action, 'DELETE');
    }
};

// ========== INIT ==========
API.init();

// ========== EXPOSE TO GLOBAL ==========
window.API = API;
