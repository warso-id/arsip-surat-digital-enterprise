// api.js - API Service untuk komunikasi dengan Google Apps Script
class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API.BASE_URL;
        this.token = localStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
        this.pendingRequests = new Map();
    }

    // Encode data ke Base64
    encodeBase64(data) {
        try {
            const jsonStr = JSON.stringify(data);
            // Gunakan TextEncoder untuk handling UTF-8 yang benar
            const encoder = new TextEncoder();
            const bytes = encoder.encode(jsonStr);
            let binary = '';
            bytes.forEach(byte => binary += String.fromCharCode(byte));
            return btoa(binary);
        } catch (error) {
            console.error('Base64 encode error:', error);
            throw new Error('Gagal mengenkripsi data');
        }
    }

    // Decode Base64 ke data
    decodeBase64(base64Str) {
        try {
            const binary = atob(base64Str);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            const decoder = new TextDecoder();
            const jsonStr = decoder.decode(bytes);
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('Base64 decode error:', error);
            throw new Error('Gagal mendekripsi data');
        }
    }

    // Helper untuk membuat request dengan retry
    async makeRequest(action, data = {}, method = 'POST') {
        const requestId = Date.now().toString();
        
        // Cek koneksi
        if (!navigator.onLine) {
            // Simpan ke queue untuk sync nanti
            await this.addToSyncQueue(action, data);
            return {
                success: true,
                offline: true,
                message: 'Data akan disimpan saat online'
            };
        }

        // Siapkan FormData
        const formData = new FormData();
        formData.append('action', action);
        formData.append('data', this.encodeBase64(data));
        formData.append('timestamp', new Date().toISOString());
        formData.append('requestId', requestId);
        
        if (this.token) {
            formData.append('token', this.token);
        }

        // Retry logic
        let lastError = null;
        for (let attempt = 1; attempt <= CONFIG.API.RETRY_ATTEMPTS; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT);

                const response = await fetch(this.baseUrl, {
                    method: method,
                    body: formData,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();

                // Decode response data jika ada
                if (result.data && typeof result.data === 'string') {
                    try {
                        result.data = this.decodeBase64(result.data);
                    } catch (e) {
                        // Biarkan sebagai string jika bukan base64
                    }
                }

                return result;
            } catch (error) {
                lastError = error;
                console.error(`API Request attempt ${attempt} failed:`, error);
                
                if (attempt < CONFIG.API.RETRY_ATTEMPTS) {
                    await new Promise(resolve => setTimeout(resolve, CONFIG.API.RETRY_DELAY * attempt));
                }
            }
        }

        throw lastError || new Error('Gagal menghubungi server');
    }

    // Sync Queue Management
    async addToSyncQueue(action, data) {
        const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
        queue.push({
            id: Date.now(),
            action: action,
            data: data,
            timestamp: new Date().toISOString(),
            retryCount: 0
        });
        localStorage.setItem('sync_queue', JSON.stringify(queue));
        
        // Register background sync jika tersedia
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('sync-queue');
        }
    }

    async processSyncQueue() {
        const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
        if (queue.length === 0) return;

        console.log(`Processing sync queue: ${queue.length} items`);
        
        const newQueue = [];
        for (const item of queue) {
            try {
                const result = await this.makeRequest(item.action, item.data);
                if (result.success) {
                    console.log(`Synced: ${item.action} (ID: ${item.id})`);
                } else if (item.retryCount < 3) {
                    item.retryCount++;
                    newQueue.push(item);
                }
            } catch (error) {
                console.error(`Sync failed for item ${item.id}:`, error);
                if (item.retryCount < 3) {
                    item.retryCount++;
                    newQueue.push(item);
                }
            }
        }
        
        localStorage.setItem('sync_queue', JSON.stringify(newQueue));
    }

    // Auth Methods
    async login(email, password, remember = false) {
        const result = await this.makeRequest('login', { email, password, remember });
        
        if (result.success && result.token) {
            this.token = result.token;
            localStorage.setItem(CONFIG.AUTH.TOKEN_KEY, result.token);
            
            if (result.user) {
                localStorage.setItem(CONFIG.AUTH.USER_KEY, JSON.stringify(result.user));
            }
            
            if (remember) {
                localStorage.setItem(CONFIG.AUTH.REMEMBER_KEY, 'true');
            }
        }
        
        return result;
    }

    async register(userData) {
        return await this.makeRequest('register', userData);
    }

    async logout() {
        try {
            await this.makeRequest('logout');
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            this.token = null;
            localStorage.removeItem(CONFIG.AUTH.TOKEN_KEY);
            localStorage.removeItem(CONFIG.AUTH.USER_KEY);
            localStorage.removeItem(CONFIG.AUTH.REMEMBER_KEY);
        }
    }

    // Dashboard
    async getDashboardStats() {
        return await this.makeRequest('getDashboardStats');
    }

    // Surat Masuk
    async getSuratMasuk(params = {}) {
        return await this.makeRequest('getSuratMasuk', params);
    }

    async createSuratMasuk(data) {
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

    // Instansi
    async getInstansi() {
        return await this.makeRequest('getInstansi');
    }

    // Pengguna
    async getPengguna() {
        return await this.makeRequest('getPengguna');
    }

    // Laporan
    async generateReport(type, params = {}) {
        return await this.makeRequest('generateReport', { type, ...params });
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

    // Search
    async searchSurat(query, type = 'all') {
        return await this.makeRequest('searchSurat', { query, type });
    }

    // Notifications
    async getNotifications() {
        return await this.makeRequest('getNotifications');
    }

    async markNotificationRead(id) {
        return await this.makeRequest('markNotificationRead', { id });
    }
}

// Create global instance
const api = new ApiService();
console.log('API Service initialized');
