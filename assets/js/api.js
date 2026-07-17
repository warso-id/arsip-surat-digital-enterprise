// api.js - API Service dengan Base64 Encoding
class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API.BASE_URL;
        this.token = localStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
    }

    encodeBase64(data) {
        try {
            const jsonStr = JSON.stringify(data);
            return btoa(unescape(encodeURIComponent(jsonStr)));
        } catch (error) {
            console.error('Base64 encode error:', error);
            return btoa(JSON.stringify(data));
        }
    }

    decodeBase64(base64Str) {
        try {
            const jsonStr = decodeURIComponent(escape(atob(base64Str)));
            return JSON.parse(jsonStr);
        } catch (error) {
            try {
                return JSON.parse(atob(base64Str));
            } catch (e) {
                return base64Str;
            }
        }
    }

    async makeRequest(action, data = {}) {
        console.log(`API Request: ${action}`, data);

        if (!navigator.onLine) {
            return {
                success: false,
                message: 'Tidak ada koneksi internet. Data akan disimpan lokal.'
            };
        }

        try {
            // Encode data ke base64
            const encodedData = this.encodeBase64(data);
            
            // Buat URL dengan parameter
            const params = new URLSearchParams();
            params.append('action', action);
            params.append('data', encodedData);
            
            if (this.token) {
                params.append('token', this.token);
            }

            console.log('Sending to:', this.baseUrl);
            console.log('Params:', params.toString());

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString()
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const result = await response.json();
            console.log('API Response:', result);

            return result;
        } catch (error) {
            console.error('API Error:', error);
            return {
                success: false,
                message: 'Gagal terhubung ke server: ' + error.message
            };
        }
    }

    // Auth
    async login(username, password, remember = false) {
        const result = await this.makeRequest('login', { username, password, remember });
        
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
        return await this.makeRequest('publicRegister', {
            username: userData.username,
            email: userData.email,
            password: userData.password,
            fullName: userData.fullName || userData.fullname
        });
    }

    async logout() {
        try {
            await this.makeRequest('logout');
        } catch (error) {
            console.error('Logout error:', error);
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

    async deleteDisposisi(id) {
        return await this.makeRequest('deleteDisposisi', { id });
    }

    // Kategori
    async getKategori() {
        return await this.makeRequest('getKategori');
    }

    async createKategori(data) {
        return await this.makeRequest('createKategori', data);
    }

    async updateKategori(id, data) {
        return await this.makeRequest('updateKategori', { id, ...data });
    }

    async deleteKategori(id) {
        return await this.makeRequest('deleteKategori', { id });
    }

    // Instansi
    async getInstansi() {
        return await this.makeRequest('getInstansi');
    }

    async createInstansi(data) {
        return await this.makeRequest('createInstansi', data);
    }

    async updateInstansi(id, data) {
        return await this.makeRequest('updateInstansi', { id, ...data });
    }

    async deleteInstansi(id) {
        return await this.makeRequest('deleteInstansi', { id });
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

    async deletePengguna(id) {
        return await this.makeRequest('deletePengguna', { id });
    }

    // Laporan
    async generateReport(type, params = {}) {
        return await this.makeRequest('generateReport', { type, ...params });
    }

    async getLaporan(params = {}) {
        return await this.makeRequest('getLaporan', params);
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

    // Profile
    async getProfile() {
        return await this.makeRequest('getProfile');
    }

    async updateProfile(data) {
        return await this.makeRequest('updateProfile', data);
    }

    async changePassword(oldPassword, newPassword) {
        return await this.makeRequest('changePassword', { oldPassword, newPassword });
    }
}

const api = new ApiService();
console.log('API Service initialized');
