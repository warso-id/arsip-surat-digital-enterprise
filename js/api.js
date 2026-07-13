// ============================================
// api.js - API Connector untuk Arsip Surat Digital v3.2.2
// Menghubungkan frontend dengan Google Apps Script (code.gs)
// dan Google Spreadsheet sebagai database
// ============================================

class ApiConnector {
    constructor() {
        // Konfigurasi URL Google Apps Script (Web App Deployment)
        this.baseUrl = 'https://script.google.com/macros/s/AKfycbwXqwertyuiop1234567890-asdfghjkl/exec';
        
        // Cache untuk mengurangi request
        this.cache = new Map();
        this.cacheTimeout = 60000; // 1 menit
        
        // Status koneksi
        this.isOnline = navigator.onLine;
        this.lastSyncTime = null;
        this.syncInProgress = false;
        
        // Queue untuk offline mode
        this.offlineQueue = [];
        this.maxOfflineQueue = 100;
        
        // Retry configuration
        this.maxRetries = 3;
        this.retryDelay = 1000;
        
        // Event listeners untuk monitoring koneksi
        this._setupConnectionListeners();
        
        // Load offline queue dari localStorage
        this._loadOfflineQueue();
        
        // Session token
        this.sessionToken = localStorage.getItem('sessionToken') || null;
        this.userData = JSON.parse(localStorage.getItem('userData') || 'null');
    }

    // ============================================
    // KONEKSI & MONITORING
    // ============================================

    _setupConnectionListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this._showToast('Koneksi dipulihkan', 'success');
            this._processOfflineQueue();
            this._triggerSyncEvent('connected');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this._showToast('Anda sedang offline. Data akan disimpan lokal.', 'warning');
            this._triggerSyncEvent('disconnected');
        });

        // Periodic sync check
        setInterval(() => this._healthCheck(), 30000);
    }

    async _healthCheck() {
        try {
            const start = Date.now();
            await this._fetchWithTimeout(this.baseUrl + '?action=ping', {}, 5000);
            const latency = Date.now() - start;
            this._triggerSyncEvent('health', { latency, status: 'healthy' });
            return true;
        } catch (error) {
            this._triggerSyncEvent('health', { status: 'unhealthy', error: error.message });
            return false;
        }
    }

    _triggerSyncEvent(event, data = {}) {
        const syncEvent = new CustomEvent('sync:status', {
            detail: {
                event,
                timestamp: new Date().toISOString(),
                online: this.isOnline,
                lastSync: this.lastSyncTime,
                queueLength: this.offlineQueue.length,
                ...data
            }
        });
        window.dispatchEvent(syncEvent);
    }

    // ============================================
    // CORE API CALL METHOD
    // ============================================

    async call(action, params = {}, method = 'POST', options = {}) {
        const {
            useCache = false,
            cacheKey = null,
            retries = this.maxRetries,
            timeout = 15000,
            showLoader = false,
            offlineFallback = null
        } = options;

        // Generate cache key
        const effectiveCacheKey = cacheKey || `${action}_${JSON.stringify(params)}`;

        // Check cache
        if (useCache && this.cache.has(effectiveCacheKey)) {
            const cached = this.cache.get(effectiveCacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        // Handle offline
        if (!this.isOnline && offlineFallback) {
            return offlineFallback;
        }

        // Queue request if offline
        if (!this.isOnline) {
            return this._queueOfflineRequest(action, params, method);
        }

        // Build request payload
        const payload = {
            action,
            params,
            token: this.sessionToken,
            timestamp: new Date().toISOString(),
            clientVersion: '3.2.2',
            deviceInfo: this._getDeviceInfo()
        };

        let lastError = null;

        // Retry loop
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                if (attempt > 0) {
                    await this._delay(this.retryDelay * attempt);
                }

                // Show loader indicator
                if (showLoader) {
                    this._updateLoadingProgress(Math.floor((attempt / (retries + 1)) * 100));
                }

                const response = await this._fetchWithTimeout(
                    this.baseUrl,
                    {
                        method,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload)
                    },
                    timeout
                );

                // Parse response
                let data;
                try {
                    data = await response.json();
                } catch (e) {
                    throw new Error('Invalid JSON response from server');
                }

                // Check for errors
                if (data.error) {
                    throw new Error(data.error);
                }

                if (data.status === 'error') {
                    throw new Error(data.message || 'Unknown server error');
                }

                // Handle session expiry
                if (data.sessionExpired) {
                    this._handleSessionExpiry();
                    throw new Error('Session expired. Silakan login kembali.');
                }

                // Cache successful response
                if (useCache && data) {
                    this.cache.set(effectiveCacheKey, {
                        data: data.data || data,
                        timestamp: Date.now()
                    });
                }

                // Update sync time
                this.lastSyncTime = new Date().toISOString();

                return data.data || data;

            } catch (error) {
                lastError = error;
                
                // Don't retry on certain errors
                if (error.message.includes('Session expired') || 
                    error.message.includes('Unauthorized')) {
                    break;
                }

                if (attempt === retries) {
                    this._triggerSyncEvent('error', { action, error: error.message });
                    
                    // If offline fallback provided, use it
                    if (offlineFallback) {
                        return offlineFallback;
                    }
                    
                    throw new Error(`API Error [${action}]: ${error.message}`);
                }
            }
        }

        throw lastError;
    }

    async _fetchWithTimeout(url, options, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    _getDeviceInfo() {
        const ua = navigator.userAgent;
        return {
            platform: navigator.platform,
            userAgent: ua.substring(0, 100),
            screenSize: `${window.screen.width}x${window.screen.height}`,
            devicePixelRatio: window.devicePixelRatio,
            language: navigator.language,
            isMobile: /Android|iPhone|iPad|iPod|webOS/i.test(ua),
            isIOS: /iPhone|iPad|iPod/i.test(ua),
            isAndroid: /Android/i.test(ua),
            isWindows: /Windows/i.test(ua),
            timestamp: new Date().toISOString()
        };
    }

    // ============================================
    // AUTHENTICATION API
    // ============================================

    async login(username, password, rememberMe = false) {
        const result = await this.call('login', {
            username,
            password,
            rememberMe
        }, 'POST', {
            showLoader: true,
            retries: 1
        });

        if (result) {
            this.sessionToken = result.token || result.sessionId;
            this.userData = result.user;
            
            if (rememberMe) {
                localStorage.setItem('sessionToken', this.sessionToken);
                localStorage.setItem('userData', JSON.stringify(result.user));
            } else {
                sessionStorage.setItem('sessionToken', this.sessionToken);
                sessionStorage.setItem('userData', JSON.stringify(result.user));
            }
        }

        return result;
    }

    async register(userData) {
        return await this.call('register', userData, 'POST', {
            showLoader: true,
            retries: 1
        });
    }

    async logout() {
        try {
            await this.call('logout', {}, 'POST', { retries: 1 });
        } catch (e) {
            // Ignore logout errors
        } finally {
            this._clearSession();
        }
    }

    async forgotPassword(email) {
        return await this.call('forgotPassword', { email }, 'POST');
    }

    async resetPassword(token, newPassword) {
        return await this.call('resetPassword', { token, newPassword }, 'POST');
    }

    async changePassword(oldPassword, newPassword) {
        return await this.call('changePassword', {
            oldPassword,
            newPassword,
            userId: this.userData?.id
        }, 'POST');
    }

    async refreshToken() {
        const result = await this.call('refreshToken', {}, 'POST');
        if (result?.token) {
            this.sessionToken = result.token;
            if (localStorage.getItem('sessionToken')) {
                localStorage.setItem('sessionToken', result.token);
            }
        }
        return result;
    }

    _handleSessionExpiry() {
        this._clearSession();
        window.dispatchEvent(new CustomEvent('session:expired'));
    }

    _clearSession() {
        this.sessionToken = null;
        this.userData = null;
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('userData');
        sessionStorage.removeItem('sessionToken');
        sessionStorage.removeItem('userData');
        this.cache.clear();
    }

    // ============================================
    // DASHBOARD & STATISTICS API
    // ============================================

    async getDashboardStats(period = 'month') {
        return await this.call('getDashboardStats', { period }, 'GET', {
            useCache: true,
            cacheKey: `dashboard_stats_${period}`,
            offlineFallback: this._getLocalDashboardStats()
        });
    }

    async getRecentActivities(limit = 10) {
        return await this.call('getRecentActivities', { limit }, 'GET', {
            useCache: true,
            cacheKey: `recent_activities_${limit}`
        });
    }

    async getChartData(type = 'surat_masuk', period = 'year') {
        return await this.call('getChartData', { type, period }, 'GET', {
            useCache: true,
            cacheKey: `chart_${type}_${period}`
        });
    }

    async getPendingApprovals() {
        return await this.call('getPendingApprovals', {
            userId: this.userData?.id
        }, 'GET', {
            useCache: true,
            cacheTimeout: 30000
        });
    }

    async getNotifications(limit = 20, unreadOnly = false) {
        return await this.call('getNotifications', {
            userId: this.userData?.id,
            limit,
            unreadOnly
        }, 'GET');
    }

    async markNotificationRead(notificationId) {
        return await this.call('markNotificationRead', {
            notificationId,
            userId: this.userData?.id
        }, 'POST');
    }

    async markAllNotificationsRead() {
        return await this.call('markAllNotificationsRead', {
            userId: this.userData?.id
        }, 'POST');
    }

    _getLocalDashboardStats() {
        // Fallback data when offline
        try {
            const cached = JSON.parse(localStorage.getItem('dashboardStatsCache') || 'null');
            if (cached && Date.now() - cached.timestamp < 3600000) {
                return cached.data;
            }
        } catch (e) {
            // Ignore
        }
        return {
            totalSuratMasuk: 0,
            totalSuratKeluar: 0,
            totalDisposisi: 0,
            pendingApprovals: 0
        };
    }

    // ============================================
    // SURAT MASUK API
    // ============================================

    async getSuratMasuk(filters = {}) {
        const {
            page = 1,
            limit = 20,
            search = '',
            status = '',
            tanggalDari = '',
            tanggalSampai = '',
            sortBy = 'tanggal_surat',
            sortOrder = 'DESC'
        } = filters;

        return await this.call('getSuratMasuk', {
            page,
            limit,
            search,
            status,
            tanggalDari,
            tanggalSampai,
            sortBy,
            sortOrder
        }, 'GET', {
            useCache: true,
            cacheKey: `surat_masuk_${JSON.stringify(filters)}`,
            cacheTimeout: 30000,
            offlineFallback: this._getOfflineData('suratMasuk')
        });
    }

    async getSuratMasukById(id) {
        return await this.call('getSuratMasukById', { id }, 'GET', {
            useCache: true,
            cacheKey: `surat_masuk_${id}`
        });
    }

    async createSuratMasuk(data) {
        const result = await this.call('createSuratMasuk', {
            ...data,
            userId: this.userData?.id
        }, 'POST', {
            showLoader: true
        });

        // Invalidate cache
        this._invalidateCache('surat_masuk');
        
        return result;
    }

    async updateSuratMasuk(id, data) {
        const result = await this.call('updateSuratMasuk', {
            id,
            ...data,
            userId: this.userData?.id
        }, 'PUT');

        this._invalidateCache('surat_masuk');
        this.cache.delete(`surat_masuk_${id}`);
        
        return result;
    }

    async deleteSuratMasuk(id) {
        const result = await this.call('deleteSuratMasuk', {
            id,
            userId: this.userData?.id
        }, 'DELETE');

        this._invalidateCache('surat_masuk');
        this.cache.delete(`surat_masuk_${id}`);
        
        return result;
    }

    async uploadSuratMasukFile(id, file) {
        // Convert file to base64 for Apps Script
        const base64 = await this._fileToBase64(file);
        
        return await this.call('uploadSuratMasukFile', {
            id,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileData: base64,
            userId: this.userData?.id
        }, 'POST', {
            timeout: 60000 // Longer timeout for uploads
        });
    }

    async getSuratMasukFile(id) {
        return await this.call('getSuratMasukFile', { id }, 'GET');
    }

    async searchSuratMasuk(query, filters = {}) {
        return await this.call('searchSuratMasuk', {
            query,
            ...filters
        }, 'GET', {
            useCache: false
        });
    }

    async getSuratMasukStats(period = 'month') {
        return await this.call('getSuratMasukStats', { period }, 'GET', {
            useCache: true,
            cacheKey: `surat_masuk_stats_${period}`
        });
    }

    // ============================================
    // SURAT KELUAR API
    // ============================================

    async getSuratKeluar(filters = {}) {
        const {
            page = 1,
            limit = 20,
            search = '',
            status = '',
            tanggalDari = '',
            tanggalSampai = '',
            sortBy = 'tanggal_surat',
            sortOrder = 'DESC'
        } = filters;

        return await this.call('getSuratKeluar', {
            page,
            limit,
            search,
            status,
            tanggalDari,
            tanggalSampai,
            sortBy,
            sortOrder
        }, 'GET', {
            useCache: true,
            cacheKey: `surat_keluar_${JSON.stringify(filters)}`,
            cacheTimeout: 30000,
            offlineFallback: this._getOfflineData('suratKeluar')
        });
    }

    async getSuratKeluarById(id) {
        return await this.call('getSuratKeluarById', { id }, 'GET', {
            useCache: true,
            cacheKey: `surat_keluar_${id}`
        });
    }

    async createSuratKeluar(data) {
        const result = await this.call('createSuratKeluar', {
            ...data,
            userId: this.userData?.id
        }, 'POST', {
            showLoader: true
        });

        this._invalidateCache('surat_keluar');
        return result;
    }

    async updateSuratKeluar(id, data) {
        const result = await this.call('updateSuratKeluar', {
            id,
            ...data,
            userId: this.userData?.id
        }, 'PUT');

        this._invalidateCache('surat_keluar');
        this.cache.delete(`surat_keluar_${id}`);
        return result;
    }

    async deleteSuratKeluar(id) {
        const result = await this.call('deleteSuratKeluar', {
            id,
            userId: this.userData?.id
        }, 'DELETE');

        this._invalidateCache('surat_keluar');
        this.cache.delete(`surat_keluar_${id}`);
        return result;
    }

    async getNomorSuratOtomatis(jenisSurat = 'keluar') {
        return await this.call('getNomorSuratOtomatis', {
            jenisSurat,
            tahun: new Date().getFullYear()
        }, 'GET', {
            useCache: false // Selalu dapat nomor terbaru
        });
    }

    // ============================================
    // DISPOSISI API
    // ============================================

    async getDisposisi(filters = {}) {
        const {
            page = 1,
            limit = 20,
            status = '',
            dari = '',
            kepada = '',
            suratId = ''
        } = filters;

        return await this.call('getDisposisi', {
            page,
            limit,
            status,
            dari,
            kepada,
            suratId
        }, 'GET', {
            useCache: true,
            cacheKey: `disposisi_${JSON.stringify(filters)}`,
            cacheTimeout: 30000,
            offlineFallback: this._getOfflineData('disposisi')
        });
    }

    async getDisposisiById(id) {
        return await this.call('getDisposisiById', { id }, 'GET', {
            useCache: true,
            cacheKey: `disposisi_${id}`
        });
    }

    async createDisposisi(data) {
        const result = await this.call('createDisposisi', {
            ...data,
            userId: this.userData?.id
        }, 'POST', {
            showLoader: true
        });

        this._invalidateCache('disposisi');
        return result;
    }

    async updateDisposisi(id, data) {
        const result = await this.call('updateDisposisi', {
            id,
            ...data,
            userId: this.userData?.id
        }, 'PUT');

        this._invalidateCache('disposisi');
        this.cache.delete(`disposisi_${id}`);
        return result;
    }

    async deleteDisposisi(id) {
        const result = await this.call('deleteDisposisi', {
            id,
            userId: this.userData?.id
        }, 'DELETE');

        this._invalidateCache('disposisi');
        this.cache.delete(`disposisi_${id}`);
        return result;
    }

    async getDisposisiBySurat(suratId) {
        return await this.call('getDisposisiBySurat', { suratId }, 'GET', {
            useCache: true,
            cacheKey: `disposisi_surat_${suratId}`
        });
    }

    // ============================================
    // APPROVAL API
    // ============================================

    async getApproval(filters = {}) {
        const {
            page = 1,
            limit = 20,
            status = '',
            type = '', // 'surat_masuk', 'surat_keluar', 'disposisi'
            userId = ''
        } = filters;

        return await this.call('getApproval', {
            page,
            limit,
            status,
            type,
            userId: userId || this.userData?.id
        }, 'GET', {
            useCache: true,
            cacheKey: `approval_${JSON.stringify(filters)}`,
            cacheTimeout: 15000, // Shorter cache for approvals
            offlineFallback: this._getOfflineData('approval')
        });
    }

    async getApprovalById(id) {
        return await this.call('getApprovalById', { id }, 'GET', {
            useCache: true,
            cacheKey: `approval_${id}`
        });
    }

    async approveRequest(id, notes = '', data = {}) {
        const result = await this.call('approveRequest', {
            id,
            notes,
            data,
            userId: this.userData?.id,
            approvedAt: new Date().toISOString()
        }, 'POST', {
            showLoader: true
        });

        this._invalidateCache('approval');
        this.cache.delete(`approval_${id}`);
        
        // Also invalidate related caches
        this._invalidateCache('surat_masuk');
        this._invalidateCache('surat_keluar');
        this._invalidateCache('disposisi');
        
        return result;
    }

    async rejectRequest(id, notes = '', reason = '') {
        const result = await this.call('rejectRequest', {
            id,
            notes,
            reason,
            userId: this.userData?.id,
            rejectedAt: new Date().toISOString()
        }, 'POST', {
            showLoader: true
        });

        this._invalidateCache('approval');
        this.cache.delete(`approval_${id}`);
        return result;
    }

    async getApprovalHistory(documentId, documentType) {
        return await this.call('getApprovalHistory', {
            documentId,
            documentType
        }, 'GET', {
            useCache: true,
            cacheKey: `approval_history_${documentType}_${documentId}`
        });
    }

    // ============================================
    // USER MANAGEMENT API
    // ============================================

    async getUsers(filters = {}) {
        const {
            page = 1,
            limit = 20,
            search = '',
            role = '',
            status = ''
        } = filters;

        return await this.call('getUsers', {
            page,
            limit,
            search,
            role,
            status
        }, 'GET', {
            useCache: true,
            cacheKey: `users_${JSON.stringify(filters)}`,
            offlineFallback: this._getOfflineData('users')
        });
    }

    async getUserById(id) {
        return await this.call('getUserById', { id }, 'GET', {
            useCache: true,
            cacheKey: `user_${id}`
        });
    }

    async createUser(userData) {
        const result = await this.call('createUser', userData, 'POST', {
            showLoader: true
        });

        this._invalidateCache('users');
        return result;
    }

    async updateUser(id, userData) {
        const result = await this.call('updateUser', {
            id,
            ...userData,
            updatedBy: this.userData?.id
        }, 'PUT');

        this._invalidateCache('users');
        this.cache.delete(`user_${id}`);
        return result;
    }

    async deleteUser(id) {
        const result = await this.call('deleteUser', {
            id,
            deletedBy: this.userData?.id
        }, 'DELETE');

        this._invalidateCache('users');
        this.cache.delete(`user_${id}`);
        return result;
    }

    async updateUserRole(id, role) {
        return await this.call('updateUserRole', {
            id,
            role,
            updatedBy: this.userData?.id
        }, 'PUT');
    }

    async updateUserStatus(id, status) {
        return await this.call('updateUserStatus', {
            id,
            status,
            updatedBy: this.userData?.id
        }, 'PUT');
    }

    async getUserProfile() {
        return await this.call('getUserProfile', {
            userId: this.userData?.id
        }, 'GET', {
            useCache: true,
            cacheKey: `profile_${this.userData?.id}`
        });
    }

    async updateUserProfile(profileData) {
        const result = await this.call('updateUserProfile', {
            ...profileData,
            userId: this.userData?.id
        }, 'PUT');

        this.cache.delete(`profile_${this.userData?.id}`);
        
        // Update local user data
        if (this.userData) {
            this.userData = { ...this.userData, ...profileData };
            const storage = localStorage.getItem('userData') ? localStorage : sessionStorage;
            storage.setItem('userData', JSON.stringify(this.userData));
        }
        
        return result;
    }

    async uploadAvatar(file) {
        const base64 = await this._fileToBase64(file);
        
        return await this.call('uploadAvatar', {
            userId: this.userData?.id,
            fileName: file.name,
            fileType: file.type,
            fileData: base64
        }, 'POST', {
            timeout: 30000
        });
    }

    // ============================================
    // TEMPLATE SURAT API
    // ============================================

    async getTemplates(filters = {}) {
        const { page = 1, limit = 20, search = '', category = '' } = filters;

        return await this.call('getTemplates', {
            page,
            limit,
            search,
            category
        }, 'GET', {
            useCache: true,
            cacheKey: `templates_${JSON.stringify(filters)}`,
            offlineFallback: this._getOfflineData('templates')
        });
    }

    async getTemplateById(id) {
        return await this.call('getTemplateById', { id }, 'GET', {
            useCache: true,
            cacheKey: `template_${id}`
        });
    }

    async createTemplate(templateData) {
        const result = await this.call('createTemplate', {
            ...templateData,
            createdBy: this.userData?.id
        }, 'POST', {
            showLoader: true
        });

        this._invalidateCache('templates');
        return result;
    }

    async updateTemplate(id, templateData) {
        const result = await this.call('updateTemplate', {
            id,
            ...templateData,
            updatedBy: this.userData?.id
        }, 'PUT');

        this._invalidateCache('templates');
        this.cache.delete(`template_${id}`);
        return result;
    }

    async deleteTemplate(id) {
        const result = await this.call('deleteTemplate', {
            id,
            deletedBy: this.userData?.id
        }, 'DELETE');

        this._invalidateCache('templates');
        this.cache.delete(`template_${id}`);
        return result;
    }

    async generateSuratFromTemplate(templateId, data) {
        return await this.call('generateSuratFromTemplate', {
            templateId,
            data,
            generatedBy: this.userData?.id
        }, 'POST', {
            showLoader: true,
            timeout: 30000
        });
    }

    // ============================================
    // REPORT & ANALYTICS API
    // ============================================

    async getReportData(reportType, filters = {}) {
        const {
            period = 'month',
            startDate = '',
            endDate = '',
            format = 'json'
        } = filters;

        return await this.call('getReportData', {
            reportType,
            period,
            startDate,
            endDate,
            format
        }, 'GET', {
            useCache: true,
            cacheKey: `report_${reportType}_${JSON.stringify(filters)}`,
            cacheTimeout: 300000 // 5 minutes
        });
    }

    async exportReport(reportType, format = 'pdf', filters = {}) {
        return await this.call('exportReport', {
            reportType,
            format,
            ...filters,
            exportedBy: this.userData?.id
        }, 'POST', {
            timeout: 60000 // Longer timeout for exports
        });
    }

    async getMonthlyRecap(year, month) {
        return await this.call('getMonthlyRecap', {
            year,
            month
        }, 'GET', {
            useCache: true,
            cacheKey: `monthly_recap_${year}_${month}`
        });
    }

    async getYearlyRecap(year) {
        return await this.call('getYearlyRecap', { year }, 'GET', {
            useCache: true,
            cacheKey: `yearly_recap_${year}`
        });
    }

    // ============================================
    // SETTINGS API
    // ============================================

    async getSettings() {
        return await this.call('getSettings', {}, 'GET', {
            useCache: true,
            cacheKey: 'app_settings',
            offlineFallback: this._getLocalSettings()
        });
    }

    async updateSettings(settingsData) {
        const result = await this.call('updateSettings', {
            ...settingsData,
            updatedBy: this.userData?.id
        }, 'PUT');

        this.cache.delete('app_settings');
        
        // Cache settings locally
        localStorage.setItem('appSettings', JSON.stringify({
            data: settingsData,
            timestamp: Date.now()
        }));
        
        return result;
    }

    async getSystemInfo() {
        return await this.call('getSystemInfo', {}, 'GET', {
            useCache: true,
            cacheKey: 'system_info',
            cacheTimeout: 60000
        });
    }

    async testEmailConfig(emailConfig) {
        return await this.call('testEmailConfig', emailConfig, 'POST', {
            timeout: 15000
        });
    }

    _getLocalSettings() {
        try {
            const cached = JSON.parse(localStorage.getItem('appSettings') || 'null');
            if (cached && Date.now() - cached.timestamp < 86400000) { // 24 hours
                return cached.data;
            }
        } catch (e) {
            // Ignore
        }
        return null;
    }

    // ============================================
    // BACKUP & RESTORE API
    // ============================================

    async createBackup(type = 'full', options = {}) {
        return await this.call('createBackup', {
            type,
            options,
            createdBy: this.userData?.id
        }, 'POST', {
            timeout: 120000, // 2 minutes for backup
            showLoader: true
        });
    }

    async getBackups() {
        return await this.call('getBackups', {}, 'GET', {
            useCache: true,
            cacheKey: 'backup_list'
        });
    }

    async restoreBackup(backupId) {
        return await this.call('restoreBackup', {
            backupId,
            restoredBy: this.userData?.id
        }, 'POST', {
            timeout: 120000,
            showLoader: true
        });
    }

    async deleteBackup(backupId) {
        return await this.call('deleteBackup', {
            backupId,
            deletedBy: this.userData?.id
        }, 'DELETE');

        this.cache.delete('backup_list');
    }

    async downloadBackup(backupId) {
        return await this.call('downloadBackup', { backupId }, 'GET', {
            timeout: 60000
        });
    }

    async exportData(tableName, format = 'csv') {
        return await this.call('exportData', {
            tableName,
            format,
            exportedBy: this.userData?.id
        }, 'POST', {
            timeout: 30000
        });
    }

    async importData(tableName, data) {
        return await this.call('importData', {
            tableName,
            data,
            importedBy: this.userData?.id
        }, 'POST', {
            timeout: 60000,
            showLoader: true
        });
    }

    // ============================================
    // AUDIT LOG API
    // ============================================

    async getAuditLogs(filters = {}) {
        const {
            page = 1,
            limit = 20,
            userId = '',
            action = '',
            entityType = '',
            startDate = '',
            endDate = ''
        } = filters;

        return await this.call('getAuditLogs', {
            page,
            limit,
            userId,
            action,
            entityType,
            startDate,
            endDate
        }, 'GET', {
            useCache: true,
            cacheKey: `audit_logs_${JSON.stringify(filters)}`,
            cacheTimeout: 10000
        });
    }

    async getAuditLogById(id) {
        return await this.call('getAuditLogById', { id }, 'GET', {
            useCache: true,
            cacheKey: `audit_log_${id}`
        });
    }

    async exportAuditLogs(format = 'csv', filters = {}) {
        return await this.call('exportAuditLogs', {
            format,
            ...filters,
            exportedBy: this.userData?.id
        }, 'POST', {
            timeout: 30000
        });
    }

    async clearAuditLogs(beforeDate) {
        return await this.call('clearAuditLogs', {
            beforeDate,
            clearedBy: this.userData?.id
        }, 'DELETE', {
            showLoader: true
        });
    }

    // ============================================
    // SPREADSHEET SPECIFIC OPERATIONS
    // ============================================

    async getSheetData(sheetName, range = '') {
        return await this.call('getSheetData', {
            sheetName,
            range
        }, 'GET', {
            useCache: true,
            cacheKey: `sheet_${sheetName}_${range}`,
            cacheTimeout: 30000
        });
    }

    async updateSheetData(sheetName, range, values) {
        return await this.call('updateSheetData', {
            sheetName,
            range,
            values,
            updatedBy: this.userData?.id
        }, 'PUT');

        this._invalidateCache(`sheet_${sheetName}`);
    }

    async appendSheetData(sheetName, values) {
        return await this.call('appendSheetData', {
            sheetName,
            values,
            appendedBy: this.userData?.id
        }, 'POST');

        this._invalidateCache(`sheet_${sheetName}`);
    }

    async deleteSheetRows(sheetName, startRow, endRow) {
        return await this.call('deleteSheetRows', {
            sheetName,
            startRow,
            endRow,
            deletedBy: this.userData?.id
        }, 'DELETE');

        this._invalidateCache(`sheet_${sheetName}`);
    }

    // ============================================
    // FILE MANAGEMENT API
    // ============================================

    async uploadFile(file, folder = 'uploads') {
        const base64 = await this._fileToBase64(file);
        
        return await this.call('uploadFile', {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileData: base64,
            folder,
            uploadedBy: this.userData?.id
        }, 'POST', {
            timeout: 120000, // 2 minutes for large files
            showLoader: true
        });
    }

    async getFile(fileId) {
        return await this.call('getFile', { fileId }, 'GET');
    }

    async deleteFile(fileId) {
        return await this.call('deleteFile', {
            fileId,
            deletedBy: this.userData?.id
        }, 'DELETE');
    }

    async getFilesByFolder(folder) {
        return await this.call('getFilesByFolder', { folder }, 'GET', {
            useCache: true,
            cacheKey: `files_${folder}`
        });
    }

    _fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // ============================================
    // SEARCH API
    // ============================================

    async globalSearch(query, limit = 20) {
        return await this.call('globalSearch', {
            query,
            limit
        }, 'GET', {
            useCache: true,
            cacheKey: `search_${query}_${limit}`,
            cacheTimeout: 10000
        });
    }

    async advancedSearch(criteria) {
        return await this.call('advancedSearch', criteria, 'POST', {
            useCache: false
        });
    }

    // ============================================
    // NOTIFICATION API
    // ============================================

    async sendNotification(notification) {
        return await this.call('sendNotification', {
            ...notification,
            sentBy: this.userData?.id
        }, 'POST');
    }

    async getNotificationPreferences() {
        return await this.call('getNotificationPreferences', {
            userId: this.userData?.id
        }, 'GET', {
            useCache: true,
            cacheKey: `notif_prefs_${this.userData?.id}`
        });
    }

    async updateNotificationPreferences(preferences) {
        return await this.call('updateNotificationPreferences', {
            ...preferences,
            userId: this.userData?.id
        }, 'PUT');

        this.cache.delete(`notif_prefs_${this.userData?.id}`);
    }

    // ============================================
    // OFFLINE SUPPORT
    // ============================================

    _queueOfflineRequest(action, params, method) {
        if (this.offlineQueue.length >= this.maxOfflineQueue) {
            throw new Error('Offline queue penuh. Silakan online-kan perangkat.');
        }

        const queuedRequest = {
            id: Date.now(),
            action,
            params,
            method,
            timestamp: new Date().toISOString(),
            retries: 0
        };

        this.offlineQueue.push(queuedRequest);
        this._saveOfflineQueue();

        this._triggerSyncEvent('queued', { requestId: queuedRequest.id });

        return {
            queued: true,
            requestId: queuedRequest.id,
            message: 'Request disimpan dan akan diproses saat online'
        };
    }

    async _processOfflineQueue() {
        if (!this.isOnline || this.syncInProgress || this.offlineQueue.length === 0) {
            return;
        }

        this.syncInProgress = true;
        const results = [];
        const failedRequests = [];

        for (const request of [...this.offlineQueue]) {
            try {
                const result = await this.call(request.action, request.params, request.method, {
                    retries: 2
                });
                results.push({ requestId: request.id, success: true, result });
                this.offlineQueue = this.offlineQueue.filter(r => r.id !== request.id);
            } catch (error) {
                request.retries++;
                if (request.retries > 3) {
                    failedRequests.push({ requestId: request.id, error: error.message });
                    this.offlineQueue = this.offlineQueue.filter(r => r.id !== request.id);
                } else {
                    failedRequests.push({ requestId: request.id, error: error.message, willRetry: true });
                }
            }
        }

        this._saveOfflineQueue();
        this.syncInProgress = false;

        this._triggerSyncEvent('queue_processed', {
            processed: results.length,
            failed: failedRequests.length,
            remaining: this.offlineQueue.length
        });

        return { results, failed: failedRequests };
    }

    _saveOfflineQueue() {
        try {
            localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
        } catch (e) {
            console.warn('Failed to save offline queue:', e);
        }
    }

    _loadOfflineQueue() {
        try {
            const saved = localStorage.getItem('offlineQueue');
            if (saved) {
                this.offlineQueue = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load offline queue:', e);
            this.offlineQueue = [];
        }
    }

    _getOfflineData(key) {
        try {
            const data = localStorage.getItem(`offline_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    saveOfflineData(key, data) {
        try {
            localStorage.setItem(`offline_${key}`, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Failed to save offline data:', e);
        }
    }

    getOfflineQueueStatus() {
        return {
            queueLength: this.offlineQueue.length,
            isProcessing: this.syncInProgress,
            requests: this.offlineQueue.map(r => ({
                id: r.id,
                action: r.action,
                timestamp: r.timestamp,
                retries: r.retries
            }))
        };
    }

    // ============================================
    // CACHE MANAGEMENT
    // ============================================

    _invalidateCache(prefix) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }

    clearAllCache() {
        this.cache.clear();
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    _showToast(message, type = 'info') {
        const event = new CustomEvent('show:toast', {
            detail: { message, type }
        });
        window.dispatchEvent(event);
    }

    _updateLoadingProgress(percentage) {
        const event = new CustomEvent('loading:progress', {
            detail: { percentage }
        });
        window.dispatchEvent(event);
    }

    isAuthenticated() {
        return !!this.sessionToken && !!this.userData;
    }

    getCurrentUser() {
        return this.userData;
    }

    hasRole(role) {
        return this.userData?.role === role;
    }

    hasPermission(permission) {
        if (!this.userData?.permissions) return false;
        return this.userData.permissions.includes(permission);
    }

    isAdmin() {
        return this.userData?.role === 'admin';
    }

    // ============================================
    // BATCH OPERATIONS
    // ============================================

    async batchDelete(table, ids) {
        return await this.call('batchDelete', {
            table,
            ids,
            deletedBy: this.userData?.id
        }, 'POST', {
            showLoader: true
        });
    }

    async batchUpdateStatus(table, ids, status) {
        return await this.call('batchUpdateStatus', {
            table,
            ids,
            status,
            updatedBy: this.userData?.id
        }, 'PUT', {
            showLoader: true
        });
    }

    async batchProcess(action, items) {
        return await this.call('batchProcess', {
            action,
            items,
            processedBy: this.userData?.id
        }, 'POST', {
            timeout: 30000,
            showLoader: true
        });
    }

    // ============================================
    // SYNC MANAGEMENT
    // ============================================

    async forceSync() {
        this._triggerSyncEvent('sync_start');
        
        try {
            // Process offline queue first
            const queueResult = await this._processOfflineQueue();
            
            // Refresh cache
            this.clearAllCache();
            
            // Refresh session
            if (this.sessionToken) {
                await this.refreshToken();
            }
            
            this._triggerSyncEvent('sync_complete', {
                queueProcessed: queueResult?.processed || 0,
                queueFailed: queueResult?.failed?.length || 0
            });
            
            return {
                success: true,
                queueResult,
                syncTime: new Date().toISOString()
            };
        } catch (error) {
            this._triggerSyncEvent('sync_error', { error: error.message });
            throw error;
        }
    }

    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            lastSync: this.lastSyncTime,
            queueLength: this.offlineQueue.length,
            isProcessing: this.syncInProgress,
            sessionValid: this.isAuthenticated()
        };
    }

    // ============================================
    // DATA VALIDATION HELPERS
    // ============================================

    validateSuratMasuk(data) {
        const errors = [];
        
        if (!data.nomor_surat) errors.push('Nomor surat wajib diisi');
        if (!data.tanggal_surat) errors.push('Tanggal surat wajib diisi');
        if (!data.pengirim) errors.push('Pengirim wajib diisi');
        if (!data.perihal) errors.push('Perihal wajib diisi');
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    validateSuratKeluar(data) {
        const errors = [];
        
        if (!data.nomor_surat) errors.push('Nomor surat wajib diisi');
        if (!data.tanggal_surat) errors.push('Tanggal surat wajib diisi');
        if (!data.tujuan) errors.push('Tujuan wajib diisi');
        if (!data.perihal) errors.push('Perihal wajib diisi');
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    validateUser(data) {
        const errors = [];
        
        if (!data.username) errors.push('Username wajib diisi');
        if (data.username && data.username.length < 3) errors.push('Username minimal 3 karakter');
        if (!data.email) errors.push('Email wajib diisi');
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Format email tidak valid');
        if (!data.password && !data.id) errors.push('Password wajib diisi');
        if (data.password && data.password.length < 8) errors.push('Password minimal 8 karakter');
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// ============================================
// GLOBAL API INSTANCE
// ============================================

// Create singleton instance
window.api = new ApiConnector();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiConnector;
}

// ============================================
// EVENT LISTENERS FOR API STATUS
// ============================================

// Listen for sync status events and update UI accordingly
window.addEventListener('sync:status', (event) => {
    const { event: syncEvent, online, queueLength } = event.detail;
    
    // Update connection status indicator
    const statusIndicator = document.getElementById('connectionStatus');
    if (statusIndicator) {
        if (!online) {
            statusIndicator.className = 'connection-status offline';
            statusIndicator.textContent = 'Offline';
        } else if (queueLength > 0) {
            statusIndicator.className = 'connection-status syncing';
            statusIndicator.textContent = `Syncing (${queueLength})`;
        } else {
            statusIndicator.className = 'connection-status online';
            statusIndicator.textContent = 'Online';
        }
    }
    
    // Show toast for important events
    if (syncEvent === 'disconnected') {
        window.dispatchEvent(new CustomEvent('show:toast', {
            detail: {
                message: 'Koneksi terputus. Beralih ke mode offline.',
                type: 'warning',
                duration: 5000
            }
        }));
    } else if (syncEvent === 'connected' && queueLength > 0) {
        window.dispatchEvent(new CustomEvent('show:toast', {
            detail: {
                message: `Memproses ${queueLength} request offline...`,
                type: 'info'
            }
        }));
    }
});

// Listen for session expiry
window.addEventListener('session:expired', () => {
    window.dispatchEvent(new CustomEvent('show:toast', {
        detail: {
            message: 'Sesi telah berakhir. Silakan login kembali.',
            type: 'error',
            duration: 5000
        }
    }));
    
    // Redirect to login after delay
    setTimeout(() => {
        window.location.reload();
    }, 2000);
});

console.log('✅ API Connector v3.2.2 loaded successfully');
console.log('📡 Google Apps Script endpoint:', window.api.baseUrl);
console.log('📱 Device info:', window.api._getDeviceInfo());
