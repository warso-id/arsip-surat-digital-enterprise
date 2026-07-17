// API Service untuk komunikasi dengan Google Apps Script
class ApiService {
    constructor() {
        this.baseUrl = APP_CONFIG.api.baseUrl;
        this.token = localStorage.getItem(APP_CONFIG.auth.tokenKey);
    }

    // Helper untuk encode data ke base64
    encodeBase64(data) {
        try {
            const jsonString = JSON.stringify(data);
            return btoa(unescape(encodeURIComponent(jsonString)));
        } catch (error) {
            console.error('Base64 encode error:', error);
            return null;
        }
    }

    // Helper untuk decode base64 ke data
    decodeBase64(base64String) {
        try {
            const jsonString = decodeURIComponent(escape(atob(base64String)));
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Base64 decode error:', error);
            return null;
        }
    }

    // Helper untuk membuat request
    async makeRequest(action, data = {}, method = 'GET') {
        const formData = new FormData();
        formData.append('action', action);
        formData.append('data', this.encodeBase64(data));
        
        if (this.token) {
            formData.append('token', this.token);
        }

        const config = {
            method: 'POST',
            body: formData,
            timeout: APP_CONFIG.api.timeout
        };

        try {
            const response = await fetch(this.baseUrl, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Decode response jika dalam base64
            if (result.data && typeof result.data === 'string') {
                result.data = this.decodeBase64(result.data);
            }

            return result;
        } catch (error) {
            console.error('API request error:', error);
            
            // Jika offline, gunakan data dari cache
            if (!navigator.onLine) {
                return await this.getFromCache(action, data);
            }
            
            throw error;
        }
    }

    // Cache data untuk offline
    async cacheData(key, data) {
        await dbService.saveData('cache', {
            key: key,
            data: data,
            timestamp: Date.now()
        });
    }

    async getFromCache(key, params = {}) {
        const cacheKey = key + '_' + JSON.stringify(params);
        const cached = await dbService.getData('cache', cacheKey);
        
        if (cached) {
            // Cache valid untuk 1 jam
            if (Date.now() - cached.timestamp < 3600000) {
                return cached.data;
            }
        }
        return null;
    }

    // API Methods
    // Auth
    async login(username, password) {
        const data = { username, password };
        const result = await this.makeRequest('login', data);
        
        if (result.success) {
            this.token = result.token;
            localStorage.setItem(APP_CONFIG.auth.tokenKey, result.token);
            localStorage.setItem(APP_CONFIG.auth.userKey, JSON.stringify(result.user));
        }
        
        return result;
    }

    async register(userData) {
        return await this.makeRequest('register', userData);
    }

    async logout() {
        const result = await this.makeRequest('logout');
        localStorage.removeItem(APP_CONFIG.auth.tokenKey);
        localStorage.removeItem(APP_CONFIG.auth.userKey);
        this.token = null;
        return result;
    }

    // Surat Masuk
    async getSuratMasuk(params = {}) {
        const result = await this.makeRequest('getSuratMasuk', params);
        
        // Cache untuk offline
        if (result.success) {
            await this.cacheData('suratMasuk', result);
        }
        
        return result;
    }

    async createSuratMasuk(data) {
        // Jika offline, simpan ke queue
        if (!navigator.onLine) {
            await dbService.addToSyncQueue({
                action: 'createSuratMasuk',
                data: data
            });
            return { success: true, offline: true, message: 'Data akan disimpan saat online' };
        }
        
        return await this.makeRequest('createSuratMasuk', data);
    }

    async updateSuratMasuk(id, data) {
        return await this.makeRequest('updateSuratMasuk', { id, ...data });
    }

    async deleteSuratMasuk(id) {
        return await this.makeRequest('deleteSuratMasuk', { id });
    }

    // Surat Keluar
    async getSuratKeluar(params = {}) {
        return await this.makeRequest('getSuratKeluar', params);
    }

    async createSuratKeluar(data) {
        return await this.makeRequest('createSuratKeluar', data);
    }

    async updateSuratKeluar(id, data) {
        return await this.makeRequest('updateSuratKeluar', { id, ...data });
    }

    async deleteSuratKeluar(id) {
        return await this.makeRequest('deleteSuratKeluar', { id });
    }

    // Disposisi
    async getDisposisi(params = {}) {
        return await this.makeRequest('getDisposisi', params);
    }

    async createDisposisi(data) {
        return await this.makeRequest('createDisposisi', data);
    }

    async updateDisposisi(id, data) {
        return await this.makeRequest('updateDisposisi', { id, ...data });
    }

    // Kategori
    async getKategori() {
        return await this.makeRequest('getKategori');
    }

    async createKategori(data) {
        return await this.makeRequest('createKategori', data);
    }

    // Instansi
    async getInstansi() {
        return await this.makeRequest('getInstansi');
    }

    async createInstansi(data) {
        return await this.makeRequest('createInstansi', data);
    }

    // Pengguna
    async getPengguna() {
        return await this.makeRequest('getPengguna');
    }

    async createPengguna(data) {
        return await this.makeRequest('createPengguna', data);
    }

    async updatePengguna(id, data) {
        return await this.makeRequest('updatePengguna', { id, ...data });
    }

    // Laporan
    async getLaporan(params = {}) {
        return await this.makeRequest('getLaporan', params);
    }

    async generateReport(type, params = {}) {
        return await this.makeRequest('generateReport', { type, ...params });
    }

    // Dashboard
    async getDashboardStats() {
        return await this.makeRequest('getDashboardStats');
    }

    // Upload File
    async uploadFile(file, type) {
        const formData = new FormData();
        formData.append('action', 'uploadFile');
        formData.append('file', file);
        formData.append('type', type);
        
        if (this.token) {
            formData.append('token', this.token);
        }

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            body: formData
        });

        return await response.json();
    }

    // Sync offline data
    async syncOfflineData() {
        if (!navigator.onLine) return;

        const queue = await dbService.getSyncQueue();
        
        for (const item of queue) {
            try {
                const result = await this.makeRequest(item.action.action, item.action.data);
                
                if (result.success) {
                    item.synced = true;
                    item.syncedAt = new Date().toISOString();
                    await dbService.saveData('syncQueue', item);
                }
            } catch (error) {
                console.error('Sync error for item:', item, error);
            }
        }
    }
}

// Inisialisasi instance global
const apiService = new ApiService();
