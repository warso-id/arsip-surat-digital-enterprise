// ============================================
// API Configuration - Google Apps Script
// ============================================

const API_CONFIG = {
    // Google Apps Script URL
    baseURL: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
    
    // Timeout dalam milidetik
    timeout: 30000,
    
    // Retry configuration
    maxRetries: 3,
    retryDelay: 1000,
    
    // Headers default
    headers: {
        'Content-Type': 'application/json'
    }
};

class ApiService {
    constructor() {
        this.token = localStorage.getItem('token') || null;
    }

    /**
     * Set token untuk autentikasi
     */
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    /**
     * Get token
     */
    getToken() {
        return this.token || localStorage.getItem('token');
    }

    /**
     * Main request method
     */
    async request(action, data = {}, method = 'POST') {
        const url = new URL(API_CONFIG.baseURL);
        url.searchParams.append('action', action);
        
        // Add token if available
        const token = this.getToken();
        if (token) {
            data.token = token;
        }

        let lastError = null;
        
        for (let attempt = 0; attempt <= API_CONFIG.maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
                
                const options = {
                    method: method,
                    headers: { ...API_CONFIG.headers },
                    signal: controller.signal
                };

                if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
                    options.body = JSON.stringify(data);
                }

                const response = await fetch(url.toString(), options);
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                
                // Check if token expired
                if (result.status === 'error' && result.code === 'TOKEN_EXPIRED') {
                    this.setToken(null);
                    window.location.href = '../auth/login.html';
                    return null;
                }
                
                return result;
            } catch (error) {
                lastError = error;
                
                if (error.name === 'AbortError') {
                    console.warn(`Request timeout (attempt ${attempt + 1})`);
                }
                
                if (attempt < API_CONFIG.maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * (attempt + 1)));
                }
            }
        }
        
        throw lastError || new Error('Request failed after retries');
    }

    // ============================================
    // AUTH METHODS
    // ============================================
    
    async login(email, password) {
        const result = await this.request('login', { email, password });
        if (result && result.status === 'success') {
            this.setToken(result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
        }
        return result;
    }

    async register(userData) {
        return await this.request('register', {
            ...userData,
            action: 'register'
        });
    }

    async logout() {
        try {
            await this.request('logout', {});
        } catch (e) {
            // Ignore logout errors
        }
        this.setToken(null);
        localStorage.removeItem('user');
    }

    async forgotPassword(email) {
        return await this.request('forgot_password', { email });
    }

    async resetPassword(token, password) {
        return await this.request('reset_password', { token, password });
    }

    async getProfile() {
        return await this.request('get_profile', {});
    }

    // ============================================
    // SURAT MASUK METHODS
    // ============================================
    
    async getSuratMasuk(filters = {}, page = 1, perPage = 20) {
        return await this.request('get_surat_masuk', {
            ...filters,
            page,
            perPage
        });
    }

    async getSuratMasukById(id) {
        return await this.request('get_surat_masuk_by_id', { id });
    }

    async createSuratMasuk(data) {
        return await this.request('create_surat_masuk', data);
    }

    async updateSuratMasuk(id, data) {
        return await this.request('update_surat_masuk', { id, ...data });
    }

    async deleteSuratMasuk(id) {
        return await this.request('delete_surat_masuk', { id });
    }

    // ============================================
    // SURAT KELUAR METHODS
    // ============================================
    
    async getSuratKeluar(filters = {}, page = 1, perPage = 20) {
        return await this.request('get_surat_keluar', {
            ...filters,
            page,
            perPage
        });
    }

    async getSuratKeluarById(id) {
        return await this.request('get_surat_keluar_by_id', { id });
    }

    async createSuratKeluar(data) {
        return await this.request('create_surat_keluar', data);
    }

    async updateSuratKeluar(id, data) {
        return await this.request('update_surat_keluar', { id, ...data });
    }

    async deleteSuratKeluar(id) {
        return await this.request('delete_surat_keluar', { id });
    }

    // ============================================
    // DISPOSISI METHODS
    // ============================================
    
    async getDisposisi(filters = {}, page = 1, perPage = 20) {
        return await this.request('get_disposisi', {
            ...filters,
            page,
            perPage
        });
    }

    async createDisposisi(data) {
        return await this.request('create_disposisi', data);
    }

    async updateStatusDisposisi(id, status, catatan = '') {
        return await this.request('update_disposisi_status', { id, status, catatan });
    }

    // ============================================
    // DASHBOARD METHODS
    // ============================================
    
    async getDashboardData() {
        return await this.request('get_dashboard', {});
    }

    async getStatistics(tahun = null) {
        return await this.request('get_statistics', { tahun });
    }

    async getNotifications(page = 1, perPage = 20) {
        return await this.request('get_notifications', { page, perPage });
    }

    async markNotificationRead(id) {
        return await this.request('mark_notification_read', { id });
    }

    // ============================================
    // PENGATURAN METHODS
    // ============================================
    
    async getSettings() {
        return await this.request('get_settings', {});
    }

    async updateSettings(settings) {
        return await this.request('update_settings', { settings });
    }

    // ============================================
    // HELPER METHODS
    // ============================================
    
    isAuthenticated() {
        return !!this.getToken();
    }

    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    }
}

// Create global instance
const api = new ApiService();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiService, api, API_CONFIG };
}
