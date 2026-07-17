// app.js - Enterprise CRUD PWA Application Core
class EnterpriseCRUDApp {
    constructor() {
        // Configuration
        this.config = {
            apiUrl: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
            version: '2026.1',
            itemsPerPage: 10,
            searchDelay: 300,
            maxRetries: 3,
            retryDelay: 1000
        };

        // State Management
        this.state = {
            currentUser: null,
            currentSection: 'dashboard',
            currentPage: {},
            filters: {},
            selectedItems: {},
            formMode: null,
            formData: null,
            editingId: null,
            isOnline: navigator.onLine,
            pendingSync: [],
            cache: {}
        };

        // Database Tables Mapping
        this.tables = {
            'surat-masuk': {
                table: 'surat_masuk',
                primaryKey: 'id',
                searchFields: ['no_agenda', 'pengirim', 'perihal'],
                filters: ['kategori_id', 'status']
            },
            'surat-keluar': {
                table: 'surat_keluar',
                primaryKey: 'id',
                searchFields: ['no_surat', 'tujuan', 'perihal'],
                filters: ['kategori_id']
            },
            'disposisi': {
                table: 'disposisi',
                primaryKey: 'id',
                searchFields: ['no_disposisi', 'instruksi'],
                filters: ['status']
            },
            'pengguna': {
                table: 'pengguna',
                primaryKey: 'id',
                searchFields: ['nama', 'email'],
                filters: ['role_id', 'status']
            }
        };

        // Initialize
        this.init();
    }

    async init() {
        this.showSpinner(true);
        await this.checkOnlineStatus();
        await this.initializeAuth();
        this.setupEventListeners();
        this.initializePWA();
        await this.loadInitialData();
        this.showSpinner(false);
    }

    // ===================== PWA FUNCTIONS =====================
    initializePWA() {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('service-worker.js')
                    .then(registration => {
                        console.log('SW registered:', registration.scope);
                        this.setupBackgroundSync(registration);
                    })
                    .catch(err => console.error('SW registration failed:', err));
            });
        }

        // Online/Offline listeners
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));

        // Before install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });
    }

    setupBackgroundSync(registration) {
        if ('sync' in registration) {
            document.addEventListener('submit', (event) => {
                if (!this.state.isOnline) {
                    event.preventDefault();
                    this.addToPendingSync(event.target);
                    registration.sync.register('sync-forms');
                }
            });
        }
    }

    async handleOnlineStatus(isOnline) {
        this.state.isOnline = isOnline;
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.style.display = isOnline ? 'none' : 'flex';
        }

        if (isOnline && this.state.pendingSync.length > 0) {
            await this.syncPendingData();
        }

        // Refresh current data
        if (isOnline) {
            await this.loadCurrentSection();
        }
    }

    async syncPendingData() {
        const pendingData = JSON.parse(localStorage.getItem('pendingSync') || '[]');
        
        for (const item of pendingData) {
            try {
                await this.apiRequest(item.action, item.data);
            } catch (error) {
                console.error('Sync failed for item:', item, error);
            }
        }

        localStorage.setItem('pendingSync', '[]');
        this.state.pendingSync = [];
        this.showToast('Data berhasil disinkronkan', 'success');
    }

    addToPendingSync(data) {
        this.state.pendingSync.push(data);
        localStorage.setItem('pendingSync', JSON.stringify(this.state.pendingSync));
    }

    // ===================== API FUNCTIONS =====================
    async apiRequest(action, data = {}) {
        const requestId = this.generateRequestId();
        
        try {
            const payload = {
                action: action,
                data: this.encodeBase64(JSON.stringify(data)),
                timestamp: new Date().toISOString(),
                version: this.config.version,
                requestId: requestId
            };

            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Enterprise-Token': this.getToken() || '',
                    'X-Request-ID': requestId,
                    'X-App-Version': this.config.version
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.data) {
                result.data = this.decodeBase64(result.data);
                try {
                    result.data = JSON.parse(result.data);
                } catch (e) {
                    // Keep as string if not JSON
                }
            }

            return result;

        } catch (error) {
            console.error('API Request Failed:', error);
            
            // If offline, save to pending sync
            if (!this.state.isOnline && action !== 'getDashboardStats') {
                this.addToPendingSync({ action, data });
                return { success: false, offline: true, message: 'Data disimpan offline' };
            }
            
            throw error;
        }
    }

    // ===================== CRUD OPERATIONS =====================
    async loadData(section, page = 1) {
        try {
            const tableConfig = this.tables[section];
            if (!tableConfig) return;

            this.state.currentPage[section] = page;

            const searchTerm = document.getElementById(`search-${section}`)?.value || '';
            const filters = this.getActiveFilters(section);

            const response = await this.apiRequest('read', {
                table: tableConfig.table,
                page: page,
                limit: this.config.itemsPerPage,
                search: searchTerm,
                filters: filters,
                searchFields: tableConfig.searchFields
            });

            if (response.success) {
                this.renderTable(section, response.data);
                this.renderPagination(section, response.total, page);
                this.cacheData(section, response.data);
            }

        } catch (error) {
            console.error(`Failed to load ${section}:`, error);
            this.showToast(`Gagal memuat data ${section}`, 'error');
            this.loadFromCache(section);
        }
    }

    async createRecord(section, formData) {
        try {
            const tableConfig = this.tables[section];
            
            const response = await this.apiRequest('create', {
                table: tableConfig.table,
                data: formData
            });

            if (response.success) {
                this.showToast('Data berhasil ditambahkan', 'success');
                this.closeCRUDModal();
                await this.loadData(section);
                return true;
            } else {
                throw new Error(response.message || 'Gagal menambahkan data');
            }

        } catch (error) {
            console.error('Create failed:', error);
            this.showToast('Gagal menambahkan data', 'error');
            return false;
        }
    }

    async updateRecord(section, id, formData) {
        try {
            const tableConfig = this.tables[section];
            
            const response = await this.apiRequest('update', {
                table: tableConfig.table,
                id: id,
                data: formData,
                primaryKey: tableConfig.primaryKey
            });

            if (response.success) {
                this.showToast('Data berhasil diupdate', 'success');
                this.closeCRUDModal();
                await this.loadData(section);
                return true;
            } else {
                throw new Error(response.message || 'Gagal mengupdate data');
            }

        } catch (error) {
            console.error('Update failed:', error);
            this.showToast('Gagal mengupdate data', 'error');
            return false;
        }
    }

    async deleteRecord(section, id) {
        if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            return false;
        }

        try {
            const tableConfig = this.tables[section];
            
            const response = await this.apiRequest('delete', {
                table: tableConfig.table,
                id: id,
                primaryKey: tableConfig.primaryKey
            });

            if (response.success) {
                this.showToast('Data berhasil dihapus', 'success');
                await this.loadData(section);
                return true;
            } else {
                throw new Error(response.message || 'Gagal menghapus data');
            }

        } catch (error) {
            console.error('Delete failed:', error);
            this.showToast('Gagal menghapus data', 'error');
            return false;
        }
    }

    async viewRecord(section, id) {
        try {
            const tableConfig = this.tables[section];
            
            const response = await this.apiRequest('read', {
                table: tableConfig.table,
                id: id,
                primaryKey: tableConfig.primaryKey
            });

            if (response.success && response.data) {
                this.showDetailModal(section, response.data[0] || response.data);
            }

        } catch (error) {
            console.error('View failed:', error);
            this.showToast('Gagal memuat detail data', 'error');
        }
    }

    // ===================== UI RENDERING =====================
    showCRUDForm(section, mode, data = null) {
        this.state.currentSection = section;
        this.state.formMode = mode;
        this.state.editingId = data?.id || null;
        this.state.formData = data;

        const modal = document.getElementById('crud-modal');
        const title = document.getElementById('modal-title');
        
        title.textContent = mode === 'create' ? `Tambah ${this.getSectionTitle(section)}` : 
                           mode === 'edit' ? `Edit ${this.getSectionTitle(section)}` : 
                           `Detail ${this.getSectionTitle(section)}`;

        document.getElementById('modal-body').innerHTML = this.generateFormHTML(section, mode, data);
        document.getElementById('modal-save-btn').style.display = mode === 'view' ? 'none' : 'inline-block';
        
        modal.style.display = 'flex';
    }

    generateFormHTML(section, mode, data = {}) {
        let html = '';
        
        switch(section) {
            case 'surat-masuk':
                html = this.generateSuratMasukForm(data, mode);
                break;
            case 'surat-keluar':
                html = this.generateSuratKeluarForm(data, mode);
                break;
            case 'pengguna':
                html = this.generatePenggunaForm(data, mode);
                break;
            default:
                html = '<p>Form tidak tersedia</p>';
        }

        return html;
    }

    generateSuratMasukForm(data, mode) {
        return `
            <form id="surat-masuk-form" class="crud-form" onsubmit="event.preventDefault(); saveCRUD();">
                <div class="form-row">
                    <div class="form-group">
                        <label>No. Agenda</label>
                        <input type="text" name="no_agenda" class="form-control" 
                               value="${data.no_agenda || ''}" ${mode === 'view' ? 'readonly' : ''} required>
                    </div>
                    <div class="form-group">
                        <label>Tanggal Terima</label>
                        <input type="date" name="tanggal_terima" class="form-control" 
                               value="${data.tanggal_terima || ''}" ${mode === 'view' ? 'readonly' : ''} required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Pengirim</label>
                        <input type="text" name="pengirim" class="form-control" 
                               value="${data.pengirim || ''}" ${mode === 'view' ? 'readonly' : ''} required>
                    </div>
                    <div class="form-group">
                        <label>Instansi Pengirim</label>
                        <select name="instansi_id" class="form-control" ${mode === 'view' ? 'disabled' : ''}>
                            <option value="">Pilih Instansi</option>
                            ${this.generateInstansiOptions(data.instansi_id)}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Perihal</label>
                    <textarea name="perihal" class="form-control" rows="3" 
                              ${mode === 'view' ? 'readonly' : ''} required>${data.perihal || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Kategori</label>
                        <select name="kategori_id" class="form-control" ${mode === 'view' ? 'disabled' : ''}>
                            <option value="">Pilih Kategori</option>
                            ${this.generateKategoriOptions(data.kategori_id)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Sifat Surat</label>
                        <select name="sifat" class="form-control" ${mode === 'view' ? 'disabled' : ''}>
                            <option value="biasa" ${data.sifat === 'biasa' ? 'selected' : ''}>Biasa</option>
                            <option value="penting" ${data.sifat === 'penting' ? 'selected' : ''}>Penting</option>
                            <option value="rahasia" ${data.sifat === 'rahasia' ? 'selected' : ''}>Rahasia</option>
                            <option value="segera" ${data.sifat === 'segera' ? 'selected' : ''}>Segera</option>
                        </select>
                    </div>
                </div>
                ${mode !== 'view' ? `
                <div class="form-group">
                    <label>Upload File (PDF/DOC)</label>
                    <input type="file" name="file_surat" class="form-control" accept=".pdf,.doc,.docx">
                </div>
                ` : ''}
            </form>
        `;
    }

    generateSuratKeluarForm(data, mode) {
        return `
            <form id="surat-keluar-form" class="crud-form" onsubmit="event.preventDefault(); saveCRUD();">
                <div class="form-row">
                    <div class="form-group">
                        <label>No. Surat</label>
                        <input type="text" name="no_surat" class="form-control" 
                               value="${data.no_surat || ''}" ${mode === 'view' ? 'readonly' : ''} required>
                    </div>
                    <div class="form-group">
                        <label>Tanggal Surat</label>
                        <input type="date" name="tanggal_surat" class="form-control" 
                               value="${data.tanggal_surat || ''}" ${mode === 'view' ? 'readonly' : ''} required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Tujuan</label>
                        <input type="text" name="tujuan" class="form-control" 
                               value="${data.tujuan || ''}" ${mode === 'view' ? 'readonly' : ''} required>
                    </div>
                    <div class="form-group">
                        <label>Instansi Tujuan</label>
                        <select name="instansi_id" class="form-control" ${mode === 'view' ? 'disabled' : ''}>
                            <option value="">Pilih Instansi</option>
                            ${this.generateInstansiOptions(data.instansi_id)}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Perihal</label>
                    <textarea name="perihal" class="form-control" rows="3" 
                              ${mode === 'view' ? 'readonly' : ''} required>${data.perihal || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Kategori</label>
                        <select name="kategori_id" class="form-control" ${mode === 'view' ? 'disabled' : ''}>
                            ${this.generateKategoriOptions(data.kategori_id)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status" class="form-control" ${mode === 'view' ? 'disabled' : ''}>
                            <option value="draft" ${data.status === 'draft' ? 'selected' : ''}>Draft</option>
                            <option value="terkirim" ${data.status === 'terkirim' ? 'selected' : ''}>Terkirim</option>
                        </select>
                    </div>
                </div>
            </form>
        `;
    }

    generatePenggunaForm(data, mode) {
        return `
            <form id="pengguna-form" class="crud-form" onsubmit="event.preventDefault(); saveCRUD();">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nama Lengkap</label>
                        <input type="text" name="nama" class="form-control" 
                               value="${data.nama || ''}" ${mode === 'view' ? 'readonly' : ''} required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" class="form-control" 
                               value="${data.email || ''}" ${mode === 'view' ? 'readonly' : ''} required>
                    </div>
                </div>
                ${mode === 'create' ? `
                <div class="form-row">
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" name="password" class="form-control" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label>Konfirmasi Password</label>
                        <input type="password" name="password_confirmation" class="form-control" required minlength="6">
                    </div>
                </div>
                ` : ''}
                <div class="form-row">
                    <div class="form-group">
                        <label>Role</label>
                        <select name="role_id" class="form-control" ${mode === 'view' ? 'disabled' : ''}>
                            ${this.generateRoleOptions(data.role_id)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status" class="form-control" ${mode === 'view' ? 'disabled' : ''}>
                            <option value="aktif" ${data.status === 'aktif' ? 'selected' : ''}>Aktif</option>
                            <option value="nonaktif" ${data.status === 'nonaktif' ? 'selected' : ''}>Nonaktif</option>
                        </select>
                    </div>
                </div>
            </form>
        `;
    }

    async saveCRUD() {
        const section = this.state.currentSection;
        const mode = this.state.formMode;
        
        let form;
        switch(section) {
            case 'surat-masuk':
                form = document.getElementById('surat-masuk-form');
                break;
            case 'surat-keluar':
                form = document.getElementById('surat-keluar-form');
                break;
            case 'pengguna':
                form = document.getElementById('pengguna-form');
                break;
        }

        if (!form) return;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Validate
        if (!this.validateForm(section, data, mode)) {
            return;
        }

        // Save
        if (mode === 'create') {
            await this.createRecord(section, data);
        } else if (mode === 'edit') {
            await this.updateRecord(section, this.state.editingId, data);
        }
    }

    validateForm(section, data, mode) {
        if (section === 'pengguna' && mode === 'create') {
            if (data.password !== data.password_confirmation) {
                this.showToast('Password tidak cocok', 'error');
                return false;
            }
        }
        return true;
    }

    // ===================== UTILITY FUNCTIONS =====================
    encodeBase64(str) {
        try {
            return btoa(unescape(encodeURIComponent(str)));
        } catch (e) {
            return btoa(str);
        }
    }

    decodeBase64(str) {
        try {
            return decodeURIComponent(escape(atob(str)));
        } catch (e) {
            return atob(str);
        }
    }

    generateRequestId() {
        return `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getToken() {
        return localStorage.getItem('enterprise_token');
    }

    setToken(token) {
        localStorage.setItem('enterprise_token', token);
    }

    showSpinner(show) {
        const spinner = document.getElementById('app-spinner');
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span class="toast-message">${message}</span>
        `;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    getSectionTitle(section) {
        const titles = {
            'surat-masuk': 'Surat Masuk',
            'surat-keluar': 'Surat Keluar',
            'disposisi': 'Disposisi',
            'pengguna': 'Pengguna'
        };
        return titles[section] || section;
    }

    getActiveFilters(section) {
        const filters = {};
        const filterElements = document.querySelectorAll(`[id*="filter-"][id*="${section}"]`);
        
        filterElements.forEach(element => {
            if (element.value) {
                const filterName = element.id.replace(`filter-`, '').replace(`-${section}`, '');
                filters[filterName] = element.value;
            }
        });

        return filters;
    }

    closeCRUDModal() {
        document.getElementById('crud-modal').style.display = 'none';
    }

    closeDetailModal() {
        document.getElementById('detail-modal').style.display = 'none';
    }

    generateInstansiOptions(selectedId) {
        const instansi = JSON.parse(localStorage.getItem('instansi_list') || '[]');
        return instansi.map(i => 
            `<option value="${i.id}" ${i.id == selectedId ? 'selected' : ''}>${i.nama_instansi}</option>`
        ).join('');
    }

    generateKategoriOptions(selectedId) {
        const kategori = JSON.parse(localStorage.getItem('kategori_list') || '[]');
        return kategori.map(k => 
            `<option value="${k.id}" ${k.id == selectedId ? 'selected' : ''}>${k.nama_kategori}</option>`
        ).join('');
    }

    generateRoleOptions(selectedId) {
        const roles = JSON.parse(localStorage.getItem('role_list') || '[]');
        return roles.map(r => 
            `<option value="${r.id}" ${r.id == selectedId ? 'selected' : ''}>${r.nama_role}</option>`
        ).join('');
    }

    cacheData(key, data) {
        this.state.cache[key] = {
            data: data,
            timestamp: Date.now()
        };
    }

    loadFromCache(section) {
        const cached = this.state.cache[section];
        if (cached && (Date.now() - cached.timestamp) < 3600000) { // 1 hour cache
            this.renderTable(section, cached.data);
            this.showToast('Menampilkan data dari cache', 'warning');
        }
    }
}

// Global functions for HTML onclick handlers
function navigateTo(section) {
    if (window.enterpriseApp) {
        window.enterpriseApp.state.currentSection = section;
        
        // Update active nav
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
        
        // Show section
        document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(`${section}-section`)?.classList.add('active');
        
        // Load data
        window.enterpriseApp.loadData(section);
    }
}

function showCRUDForm(section, mode) {
    if (window.enterpriseApp) {
        window.enterpriseApp.showCRUDForm(section, mode);
    }
}

function saveCRUD() {
    if (window.enterpriseApp) {
        window.enterpriseApp.saveCRUD();
    }
}

function closeCRUDModal() {
    if (window.enterpriseApp) {
        window.enterpriseApp.closeCRUDModal();
    }
}

function deleteRecord(section, id) {
    if (window.enterpriseApp) {
        window.enterpriseApp.deleteRecord(section, id);
    }
}

function viewRecord(section, id) {
    if (window.enterpriseApp) {
        window.enterpriseApp.viewRecord(section, id);
    }
}

function handleLogout() {
    localStorage.removeItem('enterprise_token');
    localStorage.removeItem('auth_data');
    window.location.reload();
}
