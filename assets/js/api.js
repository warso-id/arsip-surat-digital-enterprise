/* ============================================
   ENTERPRISE API - Google Sheets Integration
   ============================================ */
(function() {
    'use strict';

    class EnterpriseAPI {
        constructor() {
            this.baseURL = APP_CONFIG.API_URL;
            this.cache = new Map();
            this.cacheTimeout = 30000; // 30 seconds
            this.retryAttempts = 3;
            this.retryDelay = 1000;
        }

        // Generic request method with caching and retry
        async request(endpoint, options = {}) {
            const cacheKey = `${options.method || 'GET'}_${endpoint}_${JSON.stringify(options.body || '')}`;
            
            // Check cache for GET requests
            if (options.method !== 'POST' && this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }

            let lastError;
            for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
                try {
                    const url = `${this.baseURL}?action=${endpoint}`;
                    const config = {
                        method: options.method || 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${Auth.getToken()}`,
                            'X-App-Version': APP_CONFIG.APP_VERSION,
                            'X-Request-ID': this.generateRequestId()
                        },
                        ...options
                    };

                    if (options.body) {
                        config.body = JSON.stringify(options.body);
                    }

                    const response = await fetch(url, config);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();
                    
                    // Decode Base64 responses
                    if (data.data && APP_CONFIG.ENCODING.ENABLED) {
                        data.data = this.decodeResponse(data.data);
                    }

                    // Cache successful GET responses
                    if (config.method === 'GET') {
                        this.cache.set(cacheKey, {
                            data: data,
                            timestamp: Date.now()
                        });
                    }

                    return data;

                } catch (error) {
                    lastError = error;
                    Logger.warn(`API attempt ${attempt} failed:`, error.message);
                    
                    if (attempt < this.retryAttempts) {
                        await this.delay(this.retryDelay * attempt);
                    }
                }
            }

            throw lastError;
        }

        // Surat Masuk Operations
        async getSuratMasuk(params = {}) {
            try {
                const queryString = new URLSearchParams(params).toString();
                const response = await this.request(`getSuratMasuk&${queryString}`);
                return this.processResponse(response);
            } catch (error) {
                Logger.error('Failed to fetch surat masuk:', error);
                return await this.getFromLocalDB('surat_masuk', params);
            }
        }

        async createSuratMasuk(data) {
            const encodedData = Base64Util.encodeObject(data, APP_CONFIG.ENCODING.FIELDS);
            
            // Save locally first (offline-first approach)
            await DB.add('surat_masuk', data);
            
            // Try to sync immediately
            try {
                const response = await this.request('createSuratMasuk', {
                    method: 'POST',
                    body: encodedData
                });
                return response;
            } catch (error) {
                Logger.warn('Offline - Data saved locally');
                return { success: true, offline: true };
            }
        }

        async updateSuratMasuk(id, data) {
            const encodedData = Base64Util.encodeObject(data, APP_CONFIG.ENCODING.FIELDS);
            
            await DB.update('surat_masuk', id, data);
            
            try {
                const response = await this.request('updateSuratMasuk', {
                    method: 'POST',
                    body: { id, ...encodedData }
                });
                return response;
            } catch (error) {
                Logger.warn('Offline - Update saved locally');
                return { success: true, offline: true };
            }
        }

        async deleteSuratMasuk(id) {
            await DB.delete('surat_masuk', id);
            
            try {
                return await this.request('deleteSuratMasuk', {
                    method: 'POST',
                    body: { id }
                });
            } catch (error) {
                Logger.warn('Offline - Delete queued');
                return { success: true, offline: true };
            }
        }

        // Surat Keluar Operations
        async getSuratKeluar(params = {}) {
            try {
                const queryString = new URLSearchParams(params).toString();
                const response = await this.request(`getSuratKeluar&${queryString}`);
                return this.processResponse(response);
            } catch (error) {
                Logger.error('Failed to fetch surat keluar:', error);
                return await this.getFromLocalDB('surat_keluar', params);
            }
        }

        async createSuratKeluar(data) {
            const encodedData = Base64Util.encodeObject(data, APP_CONFIG.ENCODING.FIELDS);
            
            await DB.add('surat_keluar', data);
            
            try {
                const response = await this.request('createSuratKeluar', {
                    method: 'POST',
                    body: encodedData
                });
                return response;
            } catch (error) {
                Logger.warn('Offline - Data saved locally');
                return { success: true, offline: true };
            }
        }

        // Disposisi Operations
        async getDisposisi(params = {}) {
            try {
                const queryString = new URLSearchParams(params).toString();
                const response = await this.request(`getDisposisi&${queryString}`);
                return this.processResponse(response);
            } catch (error) {
                Logger.error('Failed to fetch disposisi:', error);
                return await this.getFromLocalDB('disposisi', params);
            }
        }

        async createDisposisi(data) {
            const encodedData = Base64Util.encodeObject(data, APP_CONFIG.ENCODING.FIELDS);
            
            await DB.add('disposisi', data);
            
            try {
                const response = await this.request('createDisposisi', {
                    method: 'POST',
                    body: encodedData
                });
                return response;
            } catch (error) {
                Logger.warn('Offline - Disposisi saved locally');
                return { success: true, offline: true };
            }
        }

        // Batch Operations
        async batchCreate(store, dataArray) {
            const results = [];
            const errors = [];
            
            for (const data of dataArray) {
                try {
                    const result = await this.createSuratMasuk(data);
                    results.push(result);
                } catch (error) {
                    errors.push({ data, error: error.message });
                }
            }
            
            return {
                success: errors.length === 0,
                results,
                errors,
                total: dataArray.length,
                succeeded: results.length,
                failed: errors.length
            };
        }

        // Statistics and Reports
        async getDashboardStats() {
            try {
                const response = await this.request('getDashboardStats');
                return response.data || this.generateLocalStats();
            } catch (error) {
                Logger.warn('Using local stats');
                return this.generateLocalStats();
            }
        }

        async generateLocalStats() {
            const suratMasuk = await DB.getAll('surat_masuk');
            const suratKeluar = await DB.getAll('surat_keluar');
            const disposisi = await DB.getAll('disposisi');
            
            const today = new Date().toISOString().split('T')[0];
            
            return {
                total_surat_masuk: suratMasuk.length,
                total_surat_keluar: suratKeluar.length,
                total_disposisi: disposisi.length,
                surat_masuk_hari_ini: suratMasuk.filter(s => s.tanggal_surat?.startsWith(today)).length,
                surat_keluar_hari_ini: suratKeluar.filter(s => s.tanggal_surat?.startsWith(today)).length,
                pending_sync: await this.getPendingSyncCount()
            };
        }

        // Search with filters
        async searchSurat(query, type = 'masuk') {
            const store = type === 'masuk' ? 'surat_masuk' : 'surat_keluar';
            const allData = await DB.getAll(store);
            
            const searchTerm = query.toLowerCase();
            return allData.filter(item => 
                item.nomor_surat?.toLowerCase().includes(searchTerm) ||
                item.perihal?.toLowerCase().includes(searchTerm) ||
                item.pengirim?.toLowerCase().includes(searchTerm) ||
                item.penerima?.toLowerCase().includes(searchTerm)
            );
        }

        // Utility Methods
        processResponse(response) {
            if (response && response.data) {
                return {
                    success: true,
                    data: Array.isArray(response.data) ? response.data : [response.data],
                    total: response.total || response.data.length
                };
            }
            return { success: false, data: [], total: 0 };
        }

        async getFromLocalDB(store, params = {}) {
            let data = await DB.getAll(store);
            
            // Apply filters locally
            if (params.status) {
                data = data.filter(item => item.status === params.status);
            }
            if (params.date_from) {
                data = data.filter(item => item.tanggal_surat >= params.date_from);
            }
            if (params.date_to) {
                data = data.filter(item => item.tanggal_surat <= params.date_to);
            }
            if (params.limit) {
                data = data.slice(0, params.limit);
            }
            
            return {
                success: true,
                data: data,
                total: data.length,
                offline: true
            };
        }

        decodeResponse(data) {
            if (Array.isArray(data)) {
                return data.map(item => 
                    Base64Util.decodeObject(item, APP_CONFIG.ENCODING.FIELDS)
                );
            }
            return Base64Util.decodeObject(data, APP_CONFIG.ENCODING.FIELDS);
        }

        async getPendingSyncCount() {
            const queueItems = await DB.getAll('sync_queue');
            return queueItems.length;
        }

        async forceSync() {
            Logger.info('Starting force sync...');
            await DB.processPendingSync();
            this.cache.clear();
            Logger.info('Force sync completed');
        }

        generateRequestId() {
            return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // File upload support
        async uploadFile(file, metadata = {}) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = async (e) => {
                    try {
                        const base64Data = e.target.result.split(',')[1];
                        const uploadData = {
                            filename: file.name,
                            mimeType: file.type,
                            size: file.size,
                            data: base64Data,
                            ...metadata
                        };
                        
                        const response = await this.request('uploadFile', {
                            method: 'POST',
                            body: uploadData
                        });
                        
                        resolve(response);
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
    }

    // Initialize Global API
    window.API = new EnterpriseAPI();
    Logger.info('Enterprise API initialized');
})();
