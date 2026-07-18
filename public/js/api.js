// ============================================
// API Configuration - Google Apps Script
// ============================================

const API_CONFIG = {
    baseURL: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
    timeout: 30000,
    maxRetries: 2,
    retryDelay: 1000
};

class ApiService {
    constructor() {
        this.token = localStorage.getItem('token') || null;
    }

    async request(action, data = {}) {
        const url = new URL(API_CONFIG.baseURL);
        url.searchParams.append('action', action);
        
        const token = this.token || localStorage.getItem('token');
        if (token) {
            data.token = token;
        }

        let lastError = null;
        
        for (let attempt = 0; attempt <= API_CONFIG.maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
                
                // Gunakan mode no-cors atau kirim sebagai form data
                const formData = new URLSearchParams();
                formData.append('data', JSON.stringify(data));
                
                const response = await fetch(url.toString(), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: formData.toString(),
                    signal: controller.signal,
                    mode: 'cors',
                    credentials: 'omit'
                });
                
                clearTimeout(timeoutId);
                
                const result = await response.json();
                
                if (result.status === 'error' && result.code === 'TOKEN_EXPIRED') {
                    this.clearAuth();
                    if (window.location.pathname.includes('dashboard')) {
                        window.location.href = '../auth/login.html';
                    }
                }
                
                return result;
            } catch (error) {
                lastError = error;
                if (attempt < API_CONFIG.maxRetries) {
                    await new Promise(r => setTimeout(r, API_CONFIG.retryDelay));
                }
            }
        }
        
        throw lastError || new Error('Request failed');
    }

    // Auth methods
    async login(email, password) {
        const result = await this.request('login', { email, password });
        if (result && result.status === 'success') {
            this.setAuth(result.token, result.user);
        }
        return result;
    }

    async register(userData) {
        return await this.request('register', {
            nama_lengkap: userData.nama_lengkap,
            email: userData.email,
            password: userData.password,
            instansi: userData.instansi || ''
        });
    }

    async forgotPassword(email) {
        return await this.request('forgot_password', { email });
    }

    async resetPassword(token, password) {
        return await this.request('reset_password', { token, password });
    }

    setAuth(token, user) {
        this.token = token;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    clearAuth() {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    isAuthenticated() {
        return !!(this.token || localStorage.getItem('token'));
    }

    getUser() {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch {
            return null;
        }
    }
}

const api = new ApiService();
