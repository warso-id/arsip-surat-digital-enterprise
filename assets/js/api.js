// api.js - API Service untuk komunikasi dengan Google Apps Script
class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API.BASE_URL;
        this.token = localStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
    }

    // Encode data ke Base64
    encodeBase64(data) {
        try {
            const jsonStr = JSON.stringify(data);
            const encoder = new TextEncoder();
            const bytes = encoder.encode(jsonStr);
            let binary = '';
            bytes.forEach(byte => binary += String.fromCharCode(byte));
            return btoa(binary);
        } catch (error) {
            console.error('Base64 encode error:', error);
            return btoa(JSON.stringify(data));
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
            try {
                return JSON.parse(atob(base64Str));
            } catch (e) {
                return base64Str;
            }
        }
    }

    // Helper untuk membuat request ke Google Apps Script
    async makeRequest(action, data = {}) {
        console.log(`API Request: ${action}`, data);
        
        // Cek koneksi
        if (!navigator.onLine) {
            return {
                success: false,
                message: 'Tidak ada koneksi internet'
            };
        }

        try {
            // Siapkan FormData (Google Apps Script menerima POST dengan FormData atau URL encoded)
            const formData = new URLSearchParams();
            formData.append('action', action);
            formData.append('data', this.encodeBase64(data));
            
            if (this.token) {
                formData.append('token', this.token);
            }

            console.log('Sending request to:', this.baseUrl);
            console.log('FormData:', formData.toString());

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const result = await response.json();
            console.log('API Response:', result);

            // Decode response data jika perlu
            if (result.data && typeof result.data === 'string') {
                try {
                    result.data = this.decodeBase64(result.data);
                } catch (e) {
                    console.log('Data is not base64 encoded');
                }
            }

            return result;
        } catch (error) {
            console.error('API Error:', error);
            return {
                success: false,
                message: 'Gagal terhubung ke server: ' + error.message
            };
        }
    }

    // Auth Methods
    async login(email, password, remember = false) {
        console.log('Login attempt:', email);
        
        const result = await this.makeRequest('login', {
            email: email,
            password: password,
            remember: remember
        });
        
        console.log('Login result:', result);
        
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
        console.log('Register attempt:', userData.email);
        
        const result = await this.makeRequest('register', {
            fullname: userData.fullname,
            email: userData.email,
            password: userData.password
        });
        
        console.log('Register result:', result);
        
        return result;
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

    // Process sync queue
    async processSyncQueue() {
        const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
        if (queue.length === 0) return;

        console.log(`Processing sync queue: ${queue.length} items`);
        
        const newQueue = [];
        for (const item of queue) {
            try {
                const result = await this.makeRequest(item.action, item.data);
                if (!result.success && item.retryCount < 3) {
                    item.retryCount = (item.retryCount || 0) + 1;
                    newQueue.push(item);
                }
            } catch (error) {
                console.error('Sync error:', error);
                if (item.retryCount < 3) {
                    item.retryCount = (item.retryCount || 0) + 1;
                    newQueue.push(item);
                }
            }
        }
        
        localStorage.setItem('sync_queue', JSON.stringify(newQueue));
    }
}

// Create global instance
const api = new ApiService();
console.log('API Service initialized');
