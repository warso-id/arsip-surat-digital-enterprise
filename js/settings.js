/**
 * ============================================
 * SETTINGS.JS - Settings Module
 * ARSIP SURAT DIGITAL v3.2.2
 * ============================================
 */

const Settings = {
    config: {},
    
    // ========== RENDER ==========
    async render(params = {}) {
        // Load config
        await this.loadConfig();
        
        return `
            <div class="settings-page">
                <div class="settings-tabs">
                    <button class="settings-tab active" data-tab="general">
                        <i class="fas fa-cog"></i> Umum
                    </button>
                    <button class="settings-tab" data-tab="security">
                        <i class="fas fa-shield-alt"></i> Keamanan
                    </button>
                    <button class="settings-tab" data-tab="profile">
                        <i class="fas fa-user"></i> Profil
                    </button>
                    <button class="settings-tab" data-tab="system">
                        <i class="fas fa-server"></i> Sistem
                    </button>
                </div>
                
                <div class="settings-content">
                    <!-- General Settings -->
                    <div class="settings-panel active" id="panel-general">
                        <div class="card">
                            <div class="card-header">
                                <h3>Pengaturan Umum</h3>
                            </div>
                            <form id="settingsGeneralForm">
                                <div class="form-group">
                                    <label>Nama Aplikasi</label>
                                    <input type="text" class="form-control" name="app_name" value="${this.config.app_name || 'Arsip Surat Digital'}" />
                                </div>
                                <div class="form-group">
                                    <label>Nama Instansi</label>
                                    <input type="text" class="form-control" name="instansi_nama" value="${this.config.instansi_nama || ''}" />
                                </div>
                                <div class="form-group">
                                    <label>Timezone</label>
                                    <select class="form-control" name="timezone">
                                        <option value="Asia/Jakarta" ${this.config.timezone === 'Asia/Jakarta' ? 'selected' : ''}>Asia/Jakarta</option>
                                        <option value="Asia/Makassar" ${this.config.timezone === 'Asia/Makassar' ? 'selected' : ''}>Asia/Makassar</option>
                                        <option value="Asia/Jayapura" ${this.config.timezone === 'Asia/Jayapura' ? 'selected' : ''}>Asia/Jayapura</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Retensi Data (hari)</label>
                                    <input type="number" class="form-control" name="retention_days" value="${this.config.retention_days || 365}" />
                                </div>
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary">Simpan Pengaturan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                    
                    <!-- Security Settings -->
                    <div class="settings-panel" id="panel-security">
                        <div class="card" style="margin-bottom: 20px;">
                            <div class="card-header">
                                <h3>Keamanan</h3>
                            </div>
                            <div class="form-group">
                                <label class="checkbox">
                                    <input type="checkbox" id="enable2FA" ${this.config.enable_2fa === 'true' ? 'checked' : ''} />
                                    Aktifkan 2FA
                                </label>
                            </div>
                            <div class="form-group">
                                <label>Max Login Attempts</label>
                                <input type="number" class="form-control" id="maxLoginAttempts" value="${this.config.max_login_attempts || 5}" />
                            </div>
                            <div class="form-group">
                                <label>Lock Duration (menit)</label>
                                <input type="number" class="form-control" id="lockDuration" value="${this.config.lock_duration || 15}" />
                            </div>
                            <button class="btn btn-primary" id="securitySaveBtn">Simpan Keamanan</button>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <h3>API Keys</h3>
                            </div>
                            <div id="apiKeyList">
                                <p class="text-muted">Memuat API Keys...</p>
                            </div>
                            <button class="btn btn-primary" id="apiKeyGenerateBtn">
                                <i class="fas fa-key"></i> Generate API Key
                            </button>
                        </div>
                    </div>
                    
                    <!-- Profile Settings -->
                    <div class="settings-panel" id="panel-profile">
                        <div class="card">
                            <div class="card-header">
                                <h3>Profil Saya</h3>
                            </div>
                            <form id="settingsProfileForm">
                                <div class="form-group">
                                    <label>Username</label>
                                    <input type="text" class="form-control" value="${App.user?.username || ''}" disabled />
                                </div>
                                <div class="form-group">
                                    <label>Nama Lengkap</label>
                                    <input type="text" class="form-control" name="namaLengkap" value="${App.user?.namaLengkap || ''}" required />
                                </div>
                                <div class="form-group">
                                    <label>Email</label>
                                    <input type="email" class="form-control" name="email" value="${App.user?.email || ''}" required />
                                </div>
                                <div class="form-group">
                                    <label>Jabatan</label>
                                    <input type="text" class="form-control" name="jabatan" value="${App.user?.jabatan || ''}" />
                                </div>
                                <div class="form-group">
                                    <label>Unit Kerja</label>
                                    <input type="text" class="form-control" name="unitKerja" value="${App.user?.unitKerja || ''}" />
                                </div>
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary">Update Profil</button>
                                </div>
                            </form>
                        </div>
                        
                        <div class="card" style="margin-top: 20px;">
                            <div class="card-header">
                                <h3>Ganti Password</h3>
                            </div>
                            <form id="settingsPasswordForm">
                                <div class="form-group">
                                    <label>Password Lama</label>
                                    <input type="password" class="form-control" name="oldPassword" required />
                                </div>
                                <div class="form-group">
                                    <label>Password Baru</label>
                                    <input type="password" class="form-control" name="newPassword" required minlength="8" />
                                </div>
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary">Ganti Password</button>
                                </div>
                            </form>
                        </div>
                    </div>
                    
                    <!-- System Settings -->
                    <div class="settings-panel" id="panel-system">
                        <div class="card" style="margin-bottom: 20px;">
                            <div class="card-header">
                                <h3>Informasi Sistem</h3>
                            </div>
                            <div class="form-group">
                                <label><strong>Version</strong></label>
                                <p>${CONFIG.APP_VERSION || '3.2.2'}</p>
                            </div>
                            <div class="form-group">
                                <label><strong>Build Date</strong></label>
                                <p>${CONFIG.BUILD_DATE || '2026-07-12'}</p>
                            </div>
                            <div class="form-group">
                                <label><strong>API Endpoints</strong></label>
                                <p>130+</p>
                            </div>
                            <div class="form-group">
                                <label><strong>Spreadsheet ID</strong></label>
                                <p><code>${CONFIG.SPREADSHEET_ID || '-'}</code></p>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <h3>Actions</h3>
                            </div>
                            <div class="flex" style="gap: 12px; flex-wrap: wrap;">
                                <button class="btn btn-warning" id="clearCacheBtn">
                                    <i class="fas fa-broom"></i> Clear Cache
                                </button>
                                <button class="btn btn-danger" id="clearDataBtn">
                                    <i class="fas fa-trash-alt"></i> Clear Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ========== INIT ==========
    init() {
        this.setupEventListeners();
    },
    
    // ========== LOAD CONFIG ==========
    async loadConfig() {
        try {
            const response = await API.get('config.get', {
                token: App.token
            });
            
            if (response.status === 'success') {
                this.config = response.data || {};
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
    },
    
    // ========== EVENT LISTENERS ==========
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
                document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
            });
        });
        
        // General settings
        document.getElementById('settingsGeneralForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await API.post('config.update', data, App.token);
                if (response.status === 'success') {
                    showToast('success', 'Berhasil', 'Pengaturan berhasil disimpan');
                } else {
                    showToast('error', 'Error', response.message || 'Gagal menyimpan pengaturan');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal menyimpan pengaturan');
            }
        });
        
        // Profile settings
        document.getElementById('settingsProfileForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await API.post('users.updateProfile', data, App.token);
                if (response.status === 'success') {
                    showToast('success', 'Berhasil', 'Profil berhasil diupdate');
                    // Refresh user data
                    const meResponse = await API.get('me', { token: App.token });
                    if (meResponse.status === 'success') {
                        App.user = meResponse.data;
                    }
                } else {
                    showToast('error', 'Error', response.message || 'Gagal update profil');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal update profil');
            }
        });
        
        // Password change
        document.getElementById('settingsPasswordForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            if (data.newPassword.length < 8) {
                showToast('warning', 'Peringatan', 'Password minimal 8 karakter');
                return;
            }
            
            try {
                const response = await API.post('changePassword', data, App.token);
                if (response.status === 'success') {
                    showToast('success', 'Berhasil', 'Password berhasil diubah');
                    e.target.reset();
                } else {
                    showToast('error', 'Error', response.message || 'Gagal ubah password');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal ubah password');
            }
        });
        
        // Security save
        document.getElementById('securitySaveBtn')?.addEventListener('click', async () => {
            const enable2FA = document.getElementById('enable2FA').checked;
            const maxAttempts = document.getElementById('maxLoginAttempts').value;
            const lockDuration = document.getElementById('lockDuration').value;
            
            try {
                // Update 2FA
                if (enable2FA) {
                    const response = await Auth.setup2FA();
                    if (response.status === 'success') {
                        showToast('success', 'Berhasil', '2FA berhasil diaktifkan');
                    }
                } else {
                    const response = await Auth.disable2FA();
                    if (response.status === 'success') {
                        showToast('success', 'Berhasil', '2FA berhasil dinonaktifkan');
                    }
                }
                
                // Update config
                const configResponse = await API.post('config.update', {
                    max_login_attempts: maxAttempts,
                    lock_duration: lockDuration
                }, App.token);
                
                if (configResponse.status === 'success') {
                    showToast('success', 'Berhasil', 'Pengaturan keamanan disimpan');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal menyimpan pengaturan keamanan');
            }
        });
        
        // API Key generate
        document.getElementById('apiKeyGenerateBtn')?.addEventListener('click', () => {
            this.showApiKeyForm();
        });
        
        // Clear cache
        document.getElementById('clearCacheBtn')?.addEventListener('click', async () => {
            if (!confirm('Apakah Anda yakin ingin membersihkan cache?')) return;
            
            try {
                const response = await API.get('system.cache.clear', {
                    token: App.token
                });
                if (response.status === 'success') {
                    showToast('success', 'Berhasil', 'Cache berhasil dibersihkan');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal membersihkan cache');
            }
        });
        
        // Load API Keys
        this.loadApiKeys();
    },
    
    // ========== LOAD API KEYS ==========
    async loadApiKeys() {
        try {
            const response = await API.get('apiKey.list', {
                token: App.token
            });
            
            const container = document.getElementById('apiKeyList');
            
            if (response.status === 'success') {
                const items = response.data.items || [];
                if (items.length === 0) {
                    container.innerHTML = '<p class="text-muted">Belum ada API Key</p>';
                    return;
                }
                
                container.innerHTML = `
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Scope</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.scope}</td>
                                    <td><span class="status-badge ${item.isActive ? 'status-badge approved' : 'status-badge rejected'}">${item.isActive ? 'Active' : 'Revoked'}</span></td>
                                    <td>${Utils.formatDate(item.createdAt)}</td>
                                    <td>
                                        ${item.isActive ? `
                                            <button class="btn btn-sm btn-danger revoke-api-btn" data-id="${item.id}">
                                                Revoke
                                            </button>
                                        ` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
                
                container.querySelectorAll('.revoke-api-btn').forEach(btn => {
                    btn.addEventListener('click', () => this.revokeApiKey(btn.dataset.id));
                });
            }
        } catch (error) {
            console.error('Error loading API keys:', error);
        }
    },
    
    // ========== SHOW API KEY FORM ==========
    showApiKeyForm() {
        const formHTML = `
            <form id="apiKeyForm">
                <div class="form-group">
                    <label>Name <span class="required">*</span></label>
                    <input type="text" class="form-control" name="name" required />
                </div>
                <div class="form-group">
                    <label>Scope</label>
                    <select class="form-control" name="scope">
                        <option value="read">Read</option>
                        <option value="write">Write</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Expiry (kosongkan untuk tidak ada)</label>
                    <input type="date" class="form-control" name="expiry" />
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                    <button type="submit" class="btn btn-primary">Generate</button>
                </div>
            </form>
        `;
        
        openModal('Generate API Key', formHTML);
        
        document.getElementById('apiKeyForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await API.post('apiKey.generate', data, App.token);
                if (response.status === 'success') {
                    closeModal();
                    showToast('success', 'Berhasil', 'API Key berhasil dibuat: ' + response.data.apiKey);
                    this.loadApiKeys();
                } else {
                    showToast('error', 'Error', response.message || 'Gagal membuat API Key');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal membuat API Key');
            }
        });
    },
    
    // ========== REVOKE API KEY ==========
    async revokeApiKey(id) {
        if (!confirm('Apakah Anda yakin ingin mencabut API Key ini?')) return;
        
        try {
            const response = await API.get('apiKey.revoke', {
                token: App.token,
                id: id
            });
            
            if (response.status === 'success') {
                showToast('success', 'Berhasil', 'API Key berhasil dicabut');
                this.loadApiKeys();
            } else {
                showToast('error', 'Error', response.message || 'Gagal mencabut API Key');
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal mencabut API Key');
        }
    }
};

// ========== EXPOSE CONFIG ==========
window.CONFIG = {
    APP_VERSION: '3.2.2',
    BUILD_DATE: '2026-07-12',
    SPREADSHEET_ID: '{{SPREADSHEET_ID}}'
};
