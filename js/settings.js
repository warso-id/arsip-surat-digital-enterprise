/**
 * ============================================
 * SETTINGS.JS - Settings Module (FULL VERSION)
 * ARSIP SURAT DIGITAL v3.2.2
 * Integrated with Spreadsheet, code.gs & Frontend
 * Responsive: Windows, iOS, Android, All OS
 * ============================================
 */

const Settings = {
    config: {},
    userPreferences: {},
    systemInfo: {},
    
    // ========== RENDER ==========
    async render(params = {}) {
        await this.loadConfig();
        await this.loadUserPreferences();
        await this.loadSystemInfo();
        
        const deviceType = this.detectDevice();
        const isMobile = deviceType === 'mobile';
        const isTablet = deviceType === 'tablet';
        
        return `
            <div class="settings-page ${isMobile ? 'mobile-layout' : ''} ${isTablet ? 'tablet-layout' : ''}">
                <!-- Settings Header -->
                <div class="settings-header">
                    <h2>
                        <i class="fas fa-cog"></i> 
                        Pengaturan Sistem
                    </h2>
                    <p class="settings-subtitle">Konfigurasi aplikasi sesuai kebutuhan Anda</p>
                </div>
                
                <!-- Settings Tabs - Responsive -->
                <div class="settings-tabs-wrapper">
                    <div class="settings-tabs ${isMobile ? 'scrollable-tabs' : ''}">
                        <button class="settings-tab active" data-tab="general">
                            <i class="fas fa-sliders-h"></i>
                            <span class="tab-text">Umum</span>
                        </button>
                        <button class="settings-tab" data-tab="security">
                            <i class="fas fa-shield-alt"></i>
                            <span class="tab-text">Keamanan</span>
                        </button>
                        <button class="settings-tab" data-tab="profile">
                            <i class="fas fa-user-circle"></i>
                            <span class="tab-text">Profil</span>
                        </button>
                        <button class="settings-tab" data-tab="system">
                            <i class="fas fa-server"></i>
                            <span class="tab-text">Sistem</span>
                        </button>
                        <button class="settings-tab" data-tab="backup">
                            <i class="fas fa-database"></i>
                            <span class="tab-text">Backup</span>
                        </button>
                        <button class="settings-tab" data-tab="integration">
                            <i class="fas fa-plug"></i>
                            <span class="tab-text">Integrasi</span>
                        </button>
                    </div>
                </div>
                
                <!-- Settings Content -->
                <div class="settings-content">
                    ${this.renderGeneralPanel(isMobile)}
                    ${this.renderSecurityPanel(isMobile)}
                    ${this.renderProfilePanel(isMobile)}
                    ${this.renderSystemPanel(isMobile)}
                    ${this.renderBackupPanel(isMobile)}
                    ${this.renderIntegrationPanel(isMobile)}
                </div>
            </div>
        `;
    },
    
    // ========== RENDER GENERAL PANEL ==========
    renderGeneralPanel(isMobile) {
        return `
            <div class="settings-panel active" id="panel-general">
                <!-- Informasi Instansi -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-building"></i> Informasi Instansi</h3>
                        <span class="card-badge">Utama</span>
                    </div>
                    <div class="card-body">
                        <form id="settingsInstansiForm" class="settings-form">
                            <div class="form-row ${isMobile ? 'form-col' : ''}">
                                <div class="form-group">
                                    <label>Nama Instansi <span class="required">*</span></label>
                                    <input type="text" class="form-control" name="instansi_nama" 
                                           value="${this.config.instansi_nama || ''}" 
                                           placeholder="Masukkan nama instansi" required />
                                </div>
                                <div class="form-group">
                                    <label>Kode Instansi</label>
                                    <input type="text" class="form-control" name="instansi_kode" 
                                           value="${this.config.instansi_kode || ''}" 
                                           placeholder="Kode unik instansi" />
                                </div>
                            </div>
                            <div class="form-row ${isMobile ? 'form-col' : ''}">
                                <div class="form-group">
                                    <label>Alamat</label>
                                    <textarea class="form-control" name="instansi_alamat" 
                                              rows="2" placeholder="Alamat lengkap">${this.config.instansi_alamat || ''}</textarea>
                                </div>
                                <div class="form-group">
                                    <label>Nomor Telepon</label>
                                    <input type="tel" class="form-control" name="instansi_telp" 
                                           value="${this.config.instansi_telp || ''}" 
                                           placeholder="Contoh: 021-1234567" />
                                </div>
                            </div>
                            <div class="form-row ${isMobile ? 'form-col' : ''}">
                                <div class="form-group">
                                    <label>Email Resmi</label>
                                    <input type="email" class="form-control" name="instansi_email" 
                                           value="${this.config.instansi_email || ''}" 
                                           placeholder="email@instansi.go.id" />
                                </div>
                                <div class="form-group">
                                    <label>Website</label>
                                    <input type="url" class="form-control" name="instansi_website" 
                                           value="${this.config.instansi_website || ''}" 
                                           placeholder="https://www.instansi.go.id" />
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> Simpan Informasi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Pengaturan Aplikasi -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-cogs"></i> Pengaturan Aplikasi</h3>
                    </div>
                    <div class="card-body">
                        <form id="settingsAppForm" class="settings-form">
                            <div class="form-row ${isMobile ? 'form-col' : ''}">
                                <div class="form-group">
                                    <label>Nama Aplikasi</label>
                                    <input type="text" class="form-control" name="app_name" 
                                           value="${this.config.app_name || 'Arsip Surat Digital'}" />
                                </div>
                                <div class="form-group">
                                    <label>Bahasa Default</label>
                                    <select class="form-control" name="default_language">
                                        <option value="id" ${this.config.default_language === 'id' ? 'selected' : ''}>Bahasa Indonesia</option>
                                        <option value="en" ${this.config.default_language === 'en' ? 'selected' : ''}>English</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row ${isMobile ? 'form-col' : ''}">
                                <div class="form-group">
                                    <label>Timezone</label>
                                    <select class="form-control" name="timezone">
                                        <option value="Asia/Jakarta" ${this.config.timezone === 'Asia/Jakarta' ? 'selected' : ''}>WIB (Asia/Jakarta)</option>
                                        <option value="Asia/Makassar" ${this.config.timezone === 'Asia/Makassar' ? 'selected' : ''}>WITA (Asia/Makassar)</option>
                                        <option value="Asia/Jayapura" ${this.config.timezone === 'Asia/Jayapura' ? 'selected' : ''}>WIT (Asia/Jayapura)</option>
                                        <option value="UTC" ${this.config.timezone === 'UTC' ? 'selected' : ''}>UTC</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Format Tanggal</label>
                                    <select class="form-control" name="date_format">
                                        <option value="DD/MM/YYYY" ${this.config.date_format === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
                                        <option value="YYYY-MM-DD" ${this.config.date_format === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
                                        <option value="MM/DD/YYYY" ${this.config.date_format === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row ${isMobile ? 'form-col' : ''}">
                                <div class="form-group">
                                    <label>Item Per Halaman</label>
                                    <select class="form-control" name="items_per_page">
                                        <option value="10" ${this.config.items_per_page == '10' ? 'selected' : ''}>10</option>
                                        <option value="25" ${this.config.items_per_page == '25' ? 'selected' : ''}>25</option>
                                        <option value="50" ${this.config.items_per_page == '50' ? 'selected' : ''}>50</option>
                                        <option value="100" ${this.config.items_per_page == '100' ? 'selected' : ''}>100</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Retensi Data (hari)</label>
                                    <input type="number" class="form-control" name="retention_days" 
                                           value="${this.config.retention_days || 365}" min="30" max="3650" />
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="enable_notifications" 
                                           ${this.config.enable_notifications === 'true' ? 'checked' : ''} />
                                    <span>Aktifkan notifikasi browser</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="enable_auto_save" 
                                           ${this.config.enable_auto_save === 'true' ? 'checked' : ''} />
                                    <span>Aktifkan auto-save pada form</span>
                                </label>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> Simpan Pengaturan
                                </button>
                                <button type="button" class="btn btn-outline" id="resetGeneralBtn">
                                    <i class="fas fa-undo"></i> Reset Default
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ========== RENDER SECURITY PANEL ==========
    renderSecurityPanel(isMobile) {
        return `
            <div class="settings-panel" id="panel-security">
                <!-- Keamanan Login -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-lock"></i> Keamanan Login</h3>
                        <span class="card-badge badge-warning">Penting</span>
                    </div>
                    <div class="card-body">
                        <form id="settingsSecurityForm" class="settings-form">
                            <div class="form-row ${isMobile ? 'form-col' : ''}">
                                <div class="form-group">
                                    <label>Max Login Attempts</label>
                                    <input type="number" class="form-control" id="maxLoginAttempts" 
                                           value="${this.config.max_login_attempts || 5}" min="3" max="10" />
                                    <small class="form-hint">Jumlah maksimal percobaan login sebelum akun terkunci</small>
                                </div>
                                <div class="form-group">
                                    <label>Durasi Kunci (menit)</label>
                                    <input type="number" class="form-control" id="lockDuration" 
                                           value="${this.config.lock_duration || 15}" min="5" max="1440" />
                                    <small class="form-hint">Waktu penguncian akun setelah gagal login</small>
                                </div>
                            </div>
                            <div class="form-row ${isMobile ? 'form-col' : ''}">
                                <div class="form-group">
                                    <label>Sesi Timeout (menit)</label>
                                    <input type="number" class="form-control" name="session_timeout" 
                                           value="${this.config.session_timeout || 30}" min="5" max="480" />
                                    <small class="form-hint">Auto-logout setelah tidak ada aktivitas</small>
                                </div>
                                <div class="form-group">
                                    <label>Minimal Password Length</label>
                                    <input type="number" class="form-control" name="min_password_length" 
                                           value="${this.config.min_password_length || 8}" min="6" max="20" />
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Kompleksitas Password</label>
                                <select class="form-control" name="password_complexity">
                                    <option value="low" ${this.config.password_complexity === 'low' ? 'selected' : ''}>Rendah (min. 6 karakter)</option>
                                    <option value="medium" ${this.config.password_complexity === 'medium' ? 'selected' : ''}>Sedang (huruf + angka)</option>
                                    <option value="high" ${this.config.password_complexity === 'high' ? 'selected' : ''}>Tinggi (huruf besar+kecil+angka+simbol)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="require_password_change" 
                                           ${this.config.require_password_change === 'true' ? 'checked' : ''} />
                                    <span>Wajib ganti password setiap 90 hari</span>
                                </label>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-shield-alt"></i> Simpan Keamanan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Two-Factor Authentication -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-fingerprint"></i> Two-Factor Authentication (2FA)</h3>
                    </div>
                    <div class="card-body">
                        <div class="twofa-status">
                            <div class="status-indicator ${this.config.enable_2fa === 'true' ? 'active' : 'inactive'}">
                                <i class="fas ${this.config.enable_2fa === 'true' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                <span>2FA ${this.config.enable_2fa === 'true' ? 'Aktif' : 'Nonaktif'}</span>
                            </div>
                            <button class="btn ${this.config.enable_2fa === 'true' ? 'btn-danger' : 'btn-primary'} toggle-2fa-btn">
                                ${this.config.enable_2fa === 'true' ? 'Nonaktifkan 2FA' : 'Aktifkan 2FA'}
                            </button>
                        </div>
                        <div class="twofa-info">
                            <p><i class="fas fa-info-circle"></i> Two-Factor Authentication menambahkan lapisan keamanan ekstra dengan memverifikasi identitas Anda melalui aplikasi authenticator.</p>
                        </div>
                    </div>
                </div>
                
                <!-- IP Whitelist -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-network-wired"></i> IP Whitelist</h3>
                    </div>
                    <div class="card-body">
                        <div class="ip-whitelist-container">
                            <div class="form-group">
                                <label>Tambah IP Address</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="newIpAddress" 
                                           placeholder="Contoh: 192.168.1.1" pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$" />
                                    <button class="btn btn-primary" id="addIpBtn">
                                        <i class="fas fa-plus"></i> Tambah
                                    </button>
                                </div>
                                <small class="form-hint">IP yang diizinkan mengakses sistem tanpa verifikasi tambahan</small>
                            </div>
                            <div id="ipWhitelist">
                                <p class="text-muted">Memuat daftar IP...</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- API Keys -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-key"></i> API Keys</h3>
                        <span class="card-badge badge-info">Developer</span>
                    </div>
                    <div class="card-body">
                        <div id="apiKeyList">
                            <p class="text-muted">Memuat API Keys...</p>
                        </div>
                        <button class="btn btn-primary" id="apiKeyGenerateBtn">
                            <i class="fas fa-plus-circle"></i> Generate API Key Baru
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ========== RENDER PROFILE PANEL ==========
    renderProfilePanel(isMobile) {
        return `
            <div class="settings-panel" id="panel-profile">
                <!-- Avatar & Info -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-id-card"></i> Identitas Pengguna</h3>
                    </div>
                    <div class="card-body">
                        <div class="profile-header">
                            <div class="avatar-upload">
                                <div class="avatar-preview" style="background-image: url('${App.user?.avatar || 'assets/img/default-avatar.png'}');">
                                    <div class="avatar-overlay">
                                        <i class="fas fa-camera"></i>
                                        <span>Ubah Foto</span>
                                    </div>
                                </div>
                                <input type="file" id="avatarInput" accept="image/*" style="display: none;" />
                            </div>
                            <div class="profile-info-summary">
                                <h4>${App.user?.namaLengkap || 'Nama Pengguna'}</h4>
                                <span class="badge badge-primary">${App.user?.role || 'User'}</span>
                                <p>${App.user?.email || 'email@example.com'}</p>
                            </div>
                        </div>
                        
                        <form id="settingsProfileForm" class="settings-form">
                            <div class="form-row ${isMobile ? 'form-col' : ''}">
                                <div class="form-group">
                                    <label>Username</label>
                                    <input type="text" class="form-control" value="${App.user?.username || ''}" disabled />
                                    <small class="form-hint">Username tidak dapat diubah</small>
                                </div>
                                <div class="form-group">
                                    <label>NIP / NIK</label>
                                    <input type="text" class="form-control" name="nip" 
                                           value="${App.user?.nip || ''}" placeholder="Nomor Induk Pegawai" />
                                </div>
                            </div>
                            <div class="form-row ${isMobile ? 'form-col' : ''}">
                                <div class="form-group">
                                    <label>Nama Lengkap <span class="required">*</span></label>
                                    <input type="text" class="form-control" name="namaLengkap" 
                                           value="${App.user?.namaLengkap || ''}" required />
                                </div>
                                <div class="form-group">
                                    <label>Gelar</label>
                                    <input type="text" class="form-control" name="gelar" 
                                           value="${App.user?.gelar || ''}" placeholder="Contoh: S.Kom, M.T" />
                                </div>
                            </div>
                            <div class="form-row ${isMobile ? 'form-col' : ''}">
                                <div class="form-group">
                                    <label>Email <span class="required">*</span></label>
                                    <input type="email" class="form-control" name="email" 
                                           value="${App.user?.email || ''}" required />
                                </div>
                                <div class="form-group">
                                    <label>Nomor HP</label>
                                    <input type="tel" class="form-control" name="noHp" 
                                           value="${App.user?.noHp || ''}" placeholder="08xxxxxxxxxx" />
                                </div>
                            </div>
                            <div class="form-row ${isMobile ? 'form-col' : ''}">
                                <div class="form-group">
                                    <label>Jabatan</label>
                                    <input type="text" class="form-control" name="jabatan" 
                                           value="${App.user?.jabatan || ''}" placeholder="Jabatan struktural/fungsional" />
                                </div>
                                <div class="form-group">
                                    <label>Unit Kerja</label>
                                    <input type="text" class="form-control" name="unitKerja" 
                                           value="${App.user?.unitKerja || ''}" placeholder="Bagian/Bidang/Subbag" />
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-user-check"></i> Update Profil
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Ganti Password -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-lock"></i> Ganti Password</h3>
                    </div>
                    <div class="card-body">
                        <form id="settingsPasswordForm" class="settings-form">
                            <div class="form-group">
                                <label>Password Saat Ini <span class="required">*</span></label>
                                <div class="password-input-wrapper">
                                    <input type="password" class="form-control" name="oldPassword" required />
                                    <button type="button" class="toggle-password-btn" tabindex="-1">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Password Baru <span class="required">*</span></label>
                                <div class="password-input-wrapper">
                                    <input type="password" class="form-control" name="newPassword" 
                                           required minlength="${this.config.min_password_length || 8}" />
                                    <button type="button" class="toggle-password-btn" tabindex="-1">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                                <div class="password-strength-meter">
                                    <div class="strength-bar"></div>
                                </div>
                                <small class="form-hint">Minimal ${this.config.min_password_length || 8} karakter</small>
                            </div>
                            <div class="form-group">
                                <label>Konfirmasi Password Baru <span class="required">*</span></label>
                                <div class="password-input-wrapper">
                                    <input type="password" class="form-control" name="confirmNewPassword" required />
                                    <button type="button" class="toggle-password-btn" tabindex="-1">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-key"></i> Ganti Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Riwayat Login -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-history"></i> Riwayat Login</h3>
                    </div>
                    <div class="card-body">
                        <div id="loginHistory">
                            <p class="text-muted">Memuat riwayat login...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ========== RENDER SYSTEM PANEL ==========
    renderSystemPanel(isMobile) {
        return `
            <div class="settings-panel" id="panel-system">
                <!-- Informasi Sistem -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-info-circle"></i> Informasi Sistem</h3>
                    </div>
                    <div class="card-body">
                        <div class="system-info-grid ${isMobile ? 'grid-col-1' : 'grid-col-2'}">
                            <div class="info-item">
                                <span class="info-label">Versi Aplikasi</span>
                                <span class="info-value">${CONFIG.APP_VERSION || '3.2.2'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Build Date</span>
                                <span class="info-value">${CONFIG.BUILD_DATE || '2026-07-12'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Environment</span>
                                <span class="info-value badge badge-success">${CONFIG.ENVIRONMENT || 'Production'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Total API Endpoints</span>
                                <span class="info-value">${this.systemInfo.total_endpoints || '130+'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Spreadsheet ID</span>
                                <span class="info-value"><code>${CONFIG.SPREADSHEET_ID || '-'}</code></span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Web App URL</span>
                                <span class="info-value"><code>${CONFIG.WEBAPP_URL || '-'}</code></span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Total Users</span>
                                <span class="info-value">${this.systemInfo.total_users || 0}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Total Surat</span>
                                <span class="info-value">${this.systemInfo.total_surat || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Log Sistem -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-clipboard-list"></i> Log Sistem</h3>
                        <div class="header-actions">
                            <select id="logLevelFilter" class="form-control form-control-sm">
                                <option value="all">Semua Level</option>
                                <option value="INFO">INFO</option>
                                <option value="WARNING">WARNING</option>
                                <option value="ERROR">ERROR</option>
                            </select>
                            <button class="btn btn-sm btn-outline" id="refreshLogBtn">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div id="systemLogs" class="log-container">
                            <p class="text-muted">Memuat log sistem...</p>
                        </div>
                        <div class="log-actions">
                            <button class="btn btn-sm btn-outline" id="downloadLogBtn">
                                <i class="fas fa-download"></i> Download Log
                            </button>
                            <button class="btn btn-sm btn-danger" id="clearLogBtn">
                                <i class="fas fa-trash"></i> Hapus Log
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Monitoring -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-chart-line"></i> Monitoring</h3>
                    </div>
                    <div class="card-body">
                        <div class="monitoring-grid ${isMobile ? 'grid-col-1' : 'grid-col-3'}">
                            <div class="monitoring-item">
                                <h4>Request Hari Ini</h4>
                                <span class="monitoring-value">${this.systemInfo.requests_today || 0}</span>
                            </div>
                            <div class="monitoring-item">
                                <h4>Error Rate</h4>
                                <span class="monitoring-value ${this.systemInfo.error_rate > 5 ? 'text-danger' : 'text-success'}">${this.systemInfo.error_rate || 0}%</span>
                            </div>
                            <div class="monitoring-item">
                                <h4>Uptime</h4>
                                <span class="monitoring-value text-success">${this.systemInfo.uptime || '99.9%'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Maintenance -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-tools"></i> Maintenance</h3>
                    </div>
                    <div class="card-body">
                        <div class="maintenance-actions">
                            <button class="btn btn-warning" id="clearCacheBtn">
                                <i class="fas fa-broom"></i> Clear Cache
                            </button>
                            <button class="btn btn-info" id="optimizeSheetBtn">
                                <i class="fas fa-compress"></i> Optimize Spreadsheet
                            </button>
                            <button class="btn btn-danger" id="clearDataBtn">
                                <i class="fas fa-trash-alt"></i> Clear All Data
                            </button>
                        </div>
                        <div class="maintenance-mode">
                            <label class="checkbox-label">
                                <input type="checkbox" id="maintenanceMode" 
                                       ${this.config.maintenance_mode === 'true' ? 'checked' : ''} />
                                <span>Maintenance Mode (nonaktifkan akses pengguna)</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ========== RENDER BACKUP PANEL ==========
    renderBackupPanel(isMobile) {
        return `
            <div class="settings-panel" id="panel-backup">
                <!-- Backup & Restore -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-cloud-upload-alt"></i> Backup Data</h3>
                    </div>
                    <div class="card-body">
                        <div class="backup-options">
                            <div class="form-group">
                                <label>Backup Type</label>
                                <select class="form-control" id="backupType">
                                    <option value="full">Full Backup (Data + Konfigurasi)</option>
                                    <option value="data">Data Only (Surat & Pengguna)</option>
                                    <option value="config">Config Only (Pengaturan)</option>
                                </select>
                            </div>
                            <button class="btn btn-primary" id="createBackupBtn">
                                <i class="fas fa-download"></i> Buat Backup Sekarang
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Restore -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-cloud-download-alt"></i> Restore Data</h3>
                    </div>
                    <div class="card-body">
                        <div class="restore-upload">
                            <div class="upload-area" id="restoreDropArea">
                                <i class="fas fa-file-archive"></i>
                                <p>Drag & drop file backup atau klik untuk memilih</p>
                                <small>Format: JSON atau ZIP</small>
                                <input type="file" id="restoreFileInput" accept=".json,.zip" style="display: none;" />
                            </div>
                            <button class="btn btn-warning" id="restoreBtn" disabled>
                                <i class="fas fa-upload"></i> Restore
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Auto Backup -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-clock"></i> Auto Backup</h3>
                    </div>
                    <div class="card-body">
                        <form id="autoBackupForm" class="settings-form">
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="enable_auto_backup" 
                                           ${this.config.enable_auto_backup === 'true' ? 'checked' : ''} />
                                    <span>Aktifkan backup otomatis</span>
                                </label>
                            </div>
                            <div class="form-row ${isMobile ? 'form-col' : ''}">
                                <div class="form-group">
                                    <label>Frekuensi</label>
                                    <select class="form-control" name="backup_frequency">
                                        <option value="daily" ${this.config.backup_frequency === 'daily' ? 'selected' : ''}>Harian</option>
                                        <option value="weekly" ${this.config.backup_frequency === 'weekly' ? 'selected' : ''}>Mingguan</option>
                                        <option value="monthly" ${this.config.backup_frequency === 'monthly' ? 'selected' : ''}>Bulanan</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Waktu Backup</label>
                                    <input type="time" class="form-control" name="backup_time" 
                                           value="${this.config.backup_time || '00:00'}" />
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Backup History -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-history"></i> Riwayat Backup</h3>
                    </div>
                    <div class="card-body">
                        <div id="backupHistory">
                            <p class="text-muted">Memuat riwayat backup...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ========== RENDER INTEGRATION PANEL ==========
    renderIntegrationPanel(isMobile) {
        return `
            <div class="settings-panel" id="panel-integration">
                <!-- Email Configuration -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-envelope"></i> Konfigurasi Email</h3>
                    </div>
                    <div class="card-body">
                        <form id="emailConfigForm" class="settings-form">
                            <div class="form-group">
                                <label>SMTP Server</label>
                                <input type="text" class="form-control" name="smtp_server" 
                                       value="${this.config.smtp_server || ''}" placeholder="smtp.gmail.com" />
                            </div>
                            <div class="form-row ${isMobile ? 'form-col' : ''}">
                                <div class="form-group">
                                    <label>Port</label>
                                    <input type="number" class="form-control" name="smtp_port" 
                                           value="${this.config.smtp_port || 587}" />
                                </div>
                                <div class="form-group">
                                    <label>Email Pengirim</label>
                                    <input type="email" class="form-control" name="sender_email" 
                                           value="${this.config.sender_email || ''}" />
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Password / App Password</label>
                                <input type="password" class="form-control" name="smtp_password" 
                                       placeholder="Masukkan password" />
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Simpan</button>
                                <button type="button" class="btn btn-outline" id="testEmailBtn">Test Email</button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Webhook Configuration -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-link"></i> Webhook</h3>
                    </div>
                    <div class="card-body">
                        <form id="webhookConfigForm" class="settings-form">
                            <div class="form-group">
                                <label>Webhook URL</label>
                                <input type="url" class="form-control" name="webhook_url" 
                                       value="${this.config.webhook_url || ''}" 
                                       placeholder="https://your-webhook-url.com/endpoint" />
                            </div>
                            <div class="form-group">
                                <label>Events</label>
                                <div class="checkbox-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" name="webhook_events" value="surat_masuk" 
                                               ${this.config.webhook_events?.includes('surat_masuk') ? 'checked' : ''} />
                                        Surat Masuk
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" name="webhook_events" value="surat_keluar" 
                                               ${this.config.webhook_events?.includes('surat_keluar') ? 'checked' : ''} />
                                        Surat Keluar
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" name="webhook_events" value="disposisi" 
                                               ${this.config.webhook_events?.includes('disposisi') ? 'checked' : ''} />
                                        Disposisi
                                    </label>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Simpan</button>
                                <button type="button" class="btn btn-outline" id="testWebhookBtn">Test Webhook</button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- TTE Integration -->
                <div class="settings-card">
                    <div class="card-header">
                        <h3><i class="fas fa-signature"></i> Tanda Tangan Elektronik (TTE)</h3>
                    </div>
                    <div class="card-body">
                        <form id="tteConfigForm" class="settings-form">
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="enable_tte" 
                                           ${this.config.enable_tte === 'true' ? 'checked' : ''} />
                                    <span>Aktifkan TTE</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label>TTE Provider</label>
                                <select class="form-control" name="tte_provider">
                                    <option value="bsre" ${this.config.tte_provider === 'bsre' ? 'selected' : ''}>BSrE (Badan Siber dan Sandi Negara)</option>
                                    <option value="privy" ${this.config.tte_provider === 'privy' ? 'selected' : ''}>PrivyID</option>
                                    <option value="vida" ${this.config.tte_provider === 'vida' ? 'selected' : ''}>VIDA</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>API Key</label>
                                <input type="text" class="form-control" name="tte_api_key" 
                                       value="${this.config.tte_api_key || ''}" />
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ========== INIT ==========
    init() {
        this.setupEventListeners();
        this.setupDeviceSpecific();
    },
    
    // ========== LOAD CONFIG ==========
    async loadConfig() {
        try {
            const response = await API.get('config.get', { token: App.token });
            if (response.status === 'success') {
                this.config = response.data || {};
                // Merge dengan default config
                this.config = { ...this.getDefaultConfig(), ...this.config };
            }
        } catch (error) {
            console.error('Error loading config:', error);
            this.config = this.getDefaultConfig();
        }
    },
    
    // ========== LOAD USER PREFERENCES ==========
    async loadUserPreferences() {
        try {
            const response = await API.get('users.preferences', { token: App.token });
            if (response.status === 'success') {
                this.userPreferences = response.data || {};
            }
        } catch (error) {
            console.error('Error loading user preferences:', error);
            this.userPreferences = {};
        }
    },
    
    // ========== LOAD SYSTEM INFO ==========
    async loadSystemInfo() {
        try {
            const response = await API.get('system.info', { token: App.token });
            if (response.status === 'success') {
                this.systemInfo = response.data || {};
            }
        } catch (error) {
            console.error('Error loading system info:', error);
            this.systemInfo = {};
        }
    },
    
    // ========== GET DEFAULT CONFIG ==========
    getDefaultConfig() {
        return {
            app_name: 'Arsip Surat Digital',
            instansi_nama: '',
            instansi_kode: '',
            instansi_alamat: '',
            instansi_telp: '',
            instansi_email: '',
            instansi_website: '',
            default_language: 'id',
            timezone: 'Asia/Jakarta',
            date_format: 'DD/MM/YYYY',
            items_per_page: '25',
            retention_days: '365',
            enable_notifications: 'true',
            enable_auto_save: 'true',
            max_login_attempts: '5',
            lock_duration: '15',
            session_timeout: '30',
            min_password_length: '8',
            password_complexity: 'medium',
            require_password_change: 'false',
            enable_2fa: 'false',
            enable_auto_backup: 'false',
            backup_frequency: 'weekly',
            backup_time: '00:00',
            maintenance_mode: 'false',
            smtp_server: '',
            smtp_port: '587',
            sender_email: '',
            webhook_url: '',
            webhook_events: [],
            enable_tte: 'false',
            tte_provider: 'bsre',
            tte_api_key: ''
        };
    },
    
    // ========== DETECT DEVICE ==========
    detectDevice() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    },
    
    // ========== SETUP DEVICE SPECIFIC ==========
    setupDeviceSpecific() {
        const deviceType = this.detectDevice();
        
        // Adjust layout for mobile/tablet
        if (deviceType === 'mobile') {
            document.querySelector('.settings-tabs')?.classList.add('scrollable-tabs');
        }
        
        // Handle touch events for mobile
        if ('ontouchstart' in window) {
            this.setupTouchEvents();
        }
        
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.adjustLayout();
            }, 300);
        });
    },
    
    // ========== SETUP TOUCH EVENTS ==========
    setupTouchEvents() {
        // Swipe untuk tab pada mobile
        let touchStartX = 0;
        const tabsWrapper = document.querySelector('.settings-tabs-wrapper');
        
        if (tabsWrapper) {
            tabsWrapper.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
            });
            
            tabsWrapper.addEventListener('touchend', (e) => {
                const touchEndX = e.changedTouches[0].clientX;
                const diff = touchStartX - touchEndX;
                
                if (Math.abs(diff) > 50) {
                    const tabs = document.querySelector('.settings-tabs');
                    if (tabs) {
                        tabs.scrollLeft += diff;
                    }
                }
            });
        }
    },
    
    // ========== ADJUST LAYOUT ==========
    adjustLayout() {
        const deviceType = this.detectDevice();
        const page = document.querySelector('.settings-page');
        
        if (page) {
            page.classList.remove('mobile-layout', 'tablet-layout', 'desktop-layout');
            page.classList.add(`${deviceType}-layout`);
        }
    },
    
    // ========== EVENT LISTENERS ==========
    setupEventListeners() {
        // Tab switching
        this.setupTabListeners();
        
        // Form submissions
        this.setupFormListeners();
        
        // Security actions
        this.setupSecurityListeners();
        
        // Profile actions
        this.setupProfileListeners();
        
        // System actions
        this.setupSystemListeners();
        
        // Backup actions
        this.setupBackupListeners();
        
        // Integration actions
        this.setupIntegrationListeners();
        
        // Password visibility toggle
        this.setupPasswordToggle();
        
        // Password strength meter
        this.setupPasswordStrength();
        
        // Avatar upload
        this.setupAvatarUpload();
        
        // Load dynamic content
        this.loadDynamicContent();
    },
    
    // ========== SETUP TAB LISTENERS ==========
    setupTabListeners() {
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = tab.dataset.tab;
                
                // Update active tab
                document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active panel
                document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
                const panel = document.getElementById(`panel-${targetTab}`);
                if (panel) {
                    panel.classList.add('active');
                }
                
                // Load panel-specific content
                this.loadPanelContent(targetTab);
                
                // Save last active tab
                this.saveActiveTab(targetTab);
            });
        });
        
        // Restore last active tab
        this.restoreActiveTab();
    },
    
    // ========== SAVE ACTIVE TAB ==========
    saveActiveTab(tabName) {
        try {
            localStorage.setItem('settings_active_tab', tabName);
        } catch (e) {
            // Ignore storage errors
        }
    },
    
    // ========== RESTORE ACTIVE TAB ==========
    restoreActiveTab() {
        try {
            const lastTab = localStorage.getItem('settings_active_tab');
            if (lastTab) {
                const tab = document.querySelector(`.settings-tab[data-tab="${lastTab}"]`);
                if (tab) {
                    tab.click();
                }
            }
        } catch (e) {
            // Ignore storage errors
        }
    },
    
    // ========== LOAD PANEL CONTENT ==========
    async loadPanelContent(tabName) {
        switch (tabName) {
            case 'security':
                await this.loadApiKeys();
                await this.loadIpWhitelist();
                break;
            case 'profile':
                await this.loadLoginHistory();
                break;
            case 'system':
                await this.loadSystemLogs();
                break;
            case 'backup':
                await this.loadBackupHistory();
                break;
        }
    },
    
    // ========== SETUP FORM LISTENERS ==========
    setupFormListeners() {
        // Instansi form
        document.getElementById('settingsInstansiForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmit(e.target, 'config.update', 'Informasi instansi berhasil disimpan');
        });
        
        // App settings form
        document.getElementById('settingsAppForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmit(e.target, 'config.update', 'Pengaturan aplikasi berhasil disimpan');
            
            // Reload page if language changed
            const langSelect = e.target.querySelector('[name="default_language"]');
            if (langSelect && langSelect.value !== this.config.default_language) {
                setTimeout(() => location.reload(), 1500);
            }
        });
        
        // Reset general button
        document.getElementById('resetGeneralBtn')?.addEventListener('click', async () => {
            if (!confirm('Reset pengaturan ke default?')) return;
            
            try {
                const response = await API.post('config.reset', { section: 'general' }, App.token);
                if (response.status === 'success') {
                    showToast('success', 'Berhasil', 'Pengaturan umum direset ke default');
                    await this.loadConfig();
                    // Re-render panel
                    App.router.navigate('settings');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal reset pengaturan');
            }
        });
        
        // Security form
        document.getElementById('settingsSecurityForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmit(e.target, 'config.update', 'Pengaturan keamanan berhasil disimpan');
        });
        
        // Profile form
        document.getElementById('settingsProfileForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleProfileUpdate(e.target);
        });
        
        // Password form
        document.getElementById('settingsPasswordForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handlePasswordChange(e.target);
        });
        
        // Auto backup form
        document.getElementById('autoBackupForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmit(e.target, 'config.update', 'Pengaturan backup otomatis disimpan');
        });
        
        // Email config form
        document.getElementById('emailConfigForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmit(e.target, 'config.update', 'Konfigurasi email berhasil disimpan');
        });
        
        // Webhook config form
        document.getElementById('webhookConfigForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // Handle webhook_events as array
            data.webhook_events = formData.getAll('webhook_events');
            
            try {
                const response = await API.post('config.update', data, App.token);
                if (response.status === 'success') {
                    showToast('success', 'Berhasil', 'Konfigurasi webhook berhasil disimpan');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal menyimpan konfigurasi webhook');
            }
        });
        
        // TTE config form
        document.getElementById('tteConfigForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmit(e.target, 'config.update', 'Konfigurasi TTE berhasil disimpan');
        });
    },
    
    // ========== HANDLE FORM SUBMIT ==========
    async handleFormSubmit(form, endpoint, successMessage) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Convert checkbox values
        form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (!checkbox.multiple) {
                data[checkbox.name] = checkbox.checked ? 'true' : 'false';
            }
        });
        
        try {
            const response = await API.post(endpoint, data, App.token);
            if (response.status === 'success') {
                showToast('success', 'Berhasil', successMessage);
                await this.loadConfig();
            } else {
                showToast('error', 'Error', response.message || 'Gagal menyimpan');
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal menyimpan pengaturan');
        }
    },
    
    // ========== HANDLE PROFILE UPDATE ==========
    async handleProfileUpdate(form) {
        const formData = new FormData(form);
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
    },
    
    // ========== HANDLE PASSWORD CHANGE ==========
    async handlePasswordChange(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate password match
        if (data.newPassword !== data.confirmNewPassword) {
            showToast('warning', 'Peringatan', 'Password baru dan konfirmasi tidak cocok');
            return;
        }
        
        // Validate password length
        const minLength = parseInt(this.config.min_password_length || 8);
        if (data.newPassword.length < minLength) {
            showToast('warning', 'Peringatan', `Password minimal ${minLength} karakter`);
            return;
        }
        
        try {
            const response = await API.post('users.changePassword', {
                oldPassword: data.oldPassword,
                newPassword: data.newPassword
            }, App.token);
            
            if (response.status === 'success') {
                showToast('success', 'Berhasil', 'Password berhasil diubah. Silakan login ulang.');
                form.reset();
                
                // Force logout after password change
                setTimeout(() => {
                    Auth.logout();
                }, 2000);
            } else {
                showToast('error', 'Error', response.message || 'Gagal mengubah password');
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal mengubah password');
        }
    },
    
    // ========== SETUP SECURITY LISTENERS ==========
    setupSecurityListeners() {
        // Toggle 2FA
        document.querySelector('.toggle-2fa-btn')?.addEventListener('click', async () => {
            const isEnabled = this.config.enable_2fa === 'true';
            
            if (isEnabled) {
                if (!confirm('Nonaktifkan Two-Factor Authentication?')) return;
                await this.disable2FA();
            } else {
                await this.enable2FA();
            }
        });
        
        // Add IP to whitelist
        document.getElementById('addIpBtn')?.addEventListener('click', () => {
            this.addIpToWhitelist();
        });
        
        // Enter key for IP input
        document.getElementById('newIpAddress')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addIpToWhitelist();
            }
        });
        
        // API Key generate
        document.getElementById('apiKeyGenerateBtn')?.addEventListener('click', () => {
            this.showApiKeyForm();
        });
    },
    
    // ========== ENABLE 2FA ==========
    async enable2FA() {
        try {
            const response = await Auth.setup2FA();
            if (response.status === 'success') {
                // Show QR code or setup instructions
                if (response.data?.qrCode) {
                    this.show2FASetup(response.data);
                } else {
                    showToast('success', 'Berhasil', '2FA berhasil diaktifkan');
                    await this.loadConfig();
                    this.update2FAUI(true);
                }
            } else {
                showToast('error', 'Error', response.message || 'Gagal mengaktifkan 2FA');
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal mengaktifkan 2FA');
        }
    },
    
    // ========== DISABLE 2FA ==========
    async disable2FA() {
        try {
            const response = await Auth.disable2FA();
            if (response.status === 'success') {
                showToast('success', 'Berhasil', '2FA berhasil dinonaktifkan');
                await this.loadConfig();
                this.update2FAUI(false);
            } else {
                showToast('error', 'Error', response.message || 'Gagal menonaktifkan 2FA');
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal menonaktifkan 2FA');
        }
    },
    
    // ========== SHOW 2FA SETUP ==========
    show2FASetup(data) {
        const modalContent = `
            <div class="twofa-setup">
                <h3>Setup Two-Factor Authentication</h3>
                <p>Scan QR code berikut menggunakan aplikasi authenticator (Google Authenticator, Authy, dll):</p>
                <div class="qr-code-container">
                    <img src="${data.qrCode}" alt="QR Code 2FA" />
                </div>
                <p class="manual-code">Atau masukkan kode manual: <strong>${data.secret}</strong></p>
                <div class="form-group">
                    <label>Kode Verifikasi</label>
                    <input type="text" class="form-control" id="twofaVerificationCode" 
                           placeholder="Masukkan kode 6 digit" maxlength="6" />
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" id="verify2FABtn">Verifikasi</button>
                </div>
            </div>
        `;
        
        openModal('Setup 2FA', modalContent);
        
        document.getElementById('verify2FABtn')?.addEventListener('click', async () => {
            const code = document.getElementById('twofaVerificationCode')?.value;
            if (!code || code.length !== 6) {
                showToast('warning', 'Peringatan', 'Masukkan kode 6 digit');
                return;
            }
            
            try {
                const response = await API.post('auth.verify2FA', { 
                    code: code,
                    secret: data.secret 
                }, App.token);
                
                if (response.status === 'success') {
                    closeModal();
                    showToast('success', 'Berhasil', '2FA berhasil diaktifkan');
                    await this.loadConfig();
                    this.update2FAUI(true);
                } else {
                    showToast('error', 'Error', 'Kode verifikasi tidak valid');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal verifikasi 2FA');
            }
        });
    },
    
    // ========== UPDATE 2FA UI ==========
    update2FAUI(isEnabled) {
        const statusIndicator = document.querySelector('.twofa-status .status-indicator');
        const toggleBtn = document.querySelector('.toggle-2fa-btn');
        
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${isEnabled ? 'active' : 'inactive'}`;
            statusIndicator.innerHTML = `
                <i class="fas ${isEnabled ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                <span>2FA ${isEnabled ? 'Aktif' : 'Nonaktif'}</span>
            `;
        }
        
        if (toggleBtn) {
            toggleBtn.className = `btn ${isEnabled ? 'btn-danger' : 'btn-primary'} toggle-2fa-btn`;
            toggleBtn.textContent = isEnabled ? 'Nonaktifkan 2FA' : 'Aktifkan 2FA';
        }
    },
    
    // ========== IP WHITELIST ==========
    async addIpToWhitelist() {
        const input = document.getElementById('newIpAddress');
        const ip = input?.value?.trim();
        
        if (!ip) {
            showToast('warning', 'Peringatan', 'Masukkan IP address');
            return;
        }
        
        // Validate IP format
        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        if (!ipRegex.test(ip)) {
            showToast('warning', 'Peringatan', 'Format IP tidak valid');
            return;
        }
        
        try {
            const response = await API.post('config.ipWhitelist.add', { ip_address: ip }, App.token);
            if (response.status === 'success') {
                showToast('success', 'Berhasil', 'IP berhasil ditambahkan ke whitelist');
                input.value = '';
                await this.loadIpWhitelist();
            } else {
                showToast('error', 'Error', response.message || 'Gagal menambahkan IP');
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal menambahkan IP');
        }
    },
    
    async loadIpWhitelist() {
        try {
            const response = await API.get('config.ipWhitelist.list', { token: App.token });
            const container = document.getElementById('ipWhitelist');
            
            if (response.status === 'success') {
                const items = response.data.items || [];
                if (items.length === 0) {
                    container.innerHTML = '<p class="text-muted">Belum ada IP dalam whitelist</p>';
                    return;
                }
                
                container.innerHTML = `
                    <div class="ip-list">
                        ${items.map(item => `
                            <div class="ip-item">
                                <span class="ip-address">
                                    <i class="fas fa-network-wired"></i> ${item.ip_address}
                                </span>
                                <span class="ip-date">${Utils.formatDate(item.created_at)}</span>
                                <button class="btn btn-sm btn-danger remove-ip-btn" data-ip="${item.ip_address}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `;
                
                // Remove IP listeners
                container.querySelectorAll('.remove-ip-btn').forEach(btn => {
                    btn.addEventListener('click', () => this.removeIpFromWhitelist(btn.dataset.ip));
                });
            }
        } catch (error) {
            console.error('Error loading IP whitelist:', error);
        }
    },
    
    async removeIpFromWhitelist(ip) {
        if (!confirm(`Hapus IP ${ip} dari whitelist?`)) return;
        
        try {
            const response = await API.post('config.ipWhitelist.remove', { ip_address: ip }, App.token);
            if (response.status === 'success') {
                showToast('success', 'Berhasil', 'IP berhasil dihapus dari whitelist');
                await this.loadIpWhitelist();
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal menghapus IP');
        }
    },
    
    // ========== API KEYS ==========
    async loadApiKeys() {
        try {
            const response = await API.get('apiKey.list', { token: App.token });
            const container = document.getElementById('apiKeyList');
            
            if (response.status === 'success') {
                const items = response.data.items || [];
                if (items.length === 0) {
                    container.innerHTML = '<p class="text-muted">Belum ada API Key</p>';
                    return;
                }
                
                container.innerHTML = `
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Nama</th>
                                    <th>Key</th>
                                    <th>Scope</th>
                                    <th>Status</th>
                                    <th>Dibuat</th>
                                    <th>Expired</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td><code class="api-key-code">${item.api_key?.substring(0, 16)}...</code></td>
                                        <td><span class="badge badge-info">${item.scope}</span></td>
                                        <td><span class="status-badge ${item.is_active ? 'status-active' : 'status-revoked'}">${item.is_active ? 'Aktif' : 'Dicabut'}</span></td>
                                        <td>${Utils.formatDate(item.created_at)}</td>
                                        <td>${item.expires_at ? Utils.formatDate(item.expires_at) : 'Tidak ada'}</td>
                                        <td>
                                            <div class="action-btns">
                                                ${item.is_active ? `
                                                    <button class="btn btn-sm btn-outline copy-key-btn" data-key="${item.api_key}" title="Salin API Key">
                                                        <i class="fas fa-copy"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-danger revoke-api-btn" data-id="${item.id}" title="Cabut">
                                                        <i class="fas fa-ban"></i>
                                                    </button>
                                                ` : `
                                                    <span class="text-muted">-</span>
                                                `}
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                
                // Copy key listeners
                container.querySelectorAll('.copy-key-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        navigator.clipboard.writeText(btn.dataset.key).then(() => {
                            showToast('success', 'Berhasil', 'API Key disalin ke clipboard');
                        });
                    });
                });
                
                // Revoke key listeners
                container.querySelectorAll('.revoke-api-btn').forEach(btn => {
                    btn.addEventListener('click', () => this.revokeApiKey(btn.dataset.id));
                });
            }
        } catch (error) {
            console.error('Error loading API keys:', error);
        }
    },
    
    showApiKeyForm() {
        const formHTML = `
            <form id="apiKeyForm" class="api-key-form">
                <div class="form-group">
                    <label>Nama Key <span class="required">*</span></label>
                    <input type="text" class="form-control" name="name" 
                           placeholder="Contoh: Mobile App Key" required />
                    <small class="form-hint">Nama untuk identifikasi API Key</small>
                </div>
                <div class="form-group">
                    <label>Scope <span class="required">*</span></label>
                    <select class="form-control" name="scope" required>
                        <option value="read">Read Only</option>
                        <option value="write">Read & Write</option>
                        <option value="admin">Admin (Full Access)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Expiry Date</label>
                    <input type="date" class="form-control" name="expires_at" 
                           min="${new Date().toISOString().split('T')[0]}" />
                    <small class="form-hint">Kosongkan untuk tanpa batas waktu</small>
                </div>
                <div class="form-group">
                    <label>IP Restriction (opsional)</label>
                    <input type="text" class="form-control" name="ip_restriction" 
                           placeholder="192.168.1.1 (pisahkan dengan koma untuk multiple IP)" />
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-key"></i> Generate API Key
                    </button>
                </div>
            </form>
        `;
        
        openModal('Generate API Key Baru', formHTML);
        
        document.getElementById('apiKeyForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await API.post('apiKey.generate', data, App.token);
                if (response.status === 'success') {
                    closeModal();
                    
                    // Show the generated key
                    this.showGeneratedKey(response.data);
                    
                    await this.loadApiKeys();
                } else {
                    showToast('error', 'Error', response.message || 'Gagal membuat API Key');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal membuat API Key');
            }
        });
    },
    
    showGeneratedKey(data) {
        const modalContent = `
            <div class="generated-key">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Penting!</strong> Simpan API Key ini sekarang. Key tidak akan ditampilkan lagi.
                </div>
                <div class="key-display">
                    <code>${data.api_key}</code>
                    <button class="btn btn-outline copy-key-btn" data-key="${data.api_key}">
                        <i class="fas fa-copy"></i> Salin
                    </button>
                </div>
                <div class="key-info">
                    <p><strong>Nama:</strong> ${data.name}</p>
                    <p><strong>Scope:</strong> ${data.scope}</p>
                    ${data.expires_at ? `<p><strong>Expired:</strong> ${Utils.formatDate(data.expires_at)}</p>` : '<p><strong>Expired:</strong> Tidak ada</p>'}
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="closeModal()">Saya Sudah Menyimpan</button>
                </div>
            </div>
        `;
        
        openModal('API Key Berhasil Dibuat', modalContent);
        
        document.querySelector('.copy-key-btn')?.addEventListener('click', function() {
            navigator.clipboard.writeText(this.dataset.key).then(() => {
                showToast('success', 'Berhasil', 'API Key disalin ke clipboard');
            });
        });
    },
    
    async revokeApiKey(id) {
        if (!confirm('Cabut API Key ini? Tindakan ini tidak dapat dibatalkan.')) return;
        
        try {
            const response = await API.post('apiKey.revoke', { id: id }, App.token);
            if (response.status === 'success') {
                showToast('success', 'Berhasil', 'API Key berhasil dicabut');
                await this.loadApiKeys();
            } else {
                showToast('error', 'Error', response.message || 'Gagal mencabut API Key');
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal mencabut API Key');
        }
    },
    
    // ========== SETUP PROFILE LISTENERS ==========
    setupProfileListeners() {
        // Avatar upload
        document.getElementById('avatarInput')?.addEventListener('change', (e) => {
            this.handleAvatarUpload(e.target.files[0]);
        });
    },
    
    setupAvatarUpload() {
        const avatarPreview = document.querySelector('.avatar-preview');
        avatarPreview?.addEventListener('click', () => {
            document.getElementById('avatarInput')?.click();
        });
    },
    
    async handleAvatarUpload(file) {
        if (!file) return;
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showToast('error', 'Error', 'Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.');
            return;
        }
        
        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast('error', 'Error', 'Ukuran file maksimal 2MB');
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            
            const response = await API.upload('users.uploadAvatar', formData, App.token);
            if (response.status === 'success') {
                showToast('success', 'Berhasil', 'Foto profil berhasil diupdate');
                
                // Update preview
                const preview = document.querySelector('.avatar-preview');
                if (preview && response.data.url) {
                    preview.style.backgroundImage = `url('${response.data.url}')`;
                }
                
                // Refresh user data
                const meResponse = await API.get('me', { token: App.token });
                if (meResponse.status === 'success') {
                    App.user = meResponse.data;
                }
            } else {
                showToast('error', 'Error', response.message || 'Gagal upload foto');
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal upload foto');
        }
    },
    
    async loadLoginHistory() {
        try {
            const response = await API.get('users.loginHistory', { token: App.token });
            const container = document.getElementById('loginHistory');
            
            if (response.status === 'success') {
                const items = response.data.items || [];
                if (items.length === 0) {
                    container.innerHTML = '<p class="text-muted">Belum ada riwayat login</p>';
                    return;
                }
                
                container.innerHTML = `
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>IP Address</th>
                                    <th>Device</th>
                                    <th>Browser</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map(item => `
                                    <tr>
                                        <td>${Utils.formatDateTime(item.login_at)}</td>
                                        <td>${item.ip_address}</td>
                                        <td>${item.device || '-'}</td>
                                        <td>${item.browser || '-'}</td>
                                        <td><span class="badge ${item.status === 'success' ? 'badge-success' : 'badge-danger'}">${item.status}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading login history:', error);
        }
    },
    
    // ========== SETUP SYSTEM LISTENERS ==========
    setupSystemListeners() {
        // Clear cache
        document.getElementById('clearCacheBtn')?.addEventListener('click', async () => {
            if (!confirm('Bersihkan cache sistem?')) return;
            
            try {
                const response = await API.post('system.cache.clear', {}, App.token);
                if (response.status === 'success') {
                    showToast('success', 'Berhasil', 'Cache berhasil dibersihkan');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal membersihkan cache');
            }
        });
        
        // Optimize spreadsheet
        document.getElementById('optimizeSheetBtn')?.addEventListener('click', async () => {
            if (!confirm('Optimasi spreadsheet? Proses ini mungkin memakan waktu.')) return;
            
            try {
                showToast('info', 'Proses', 'Mengoptimasi spreadsheet...');
                const response = await API.post('system.spreadsheet.optimize', {}, App.token);
                if (response.status === 'success') {
                    showToast('success', 'Berhasil', 'Spreadsheet berhasil dioptimasi');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal optimasi spreadsheet');
            }
        });
        
        // Clear all data
        document.getElementById('clearDataBtn')?.addEventListener('click', async () => {
            if (!confirm('PERINGATAN! Ini akan menghapus SEMUA data. Lanjutkan?')) return;
            if (!confirm('Data yang dihapus TIDAK DAPAT dikembalikan. Yakin?')) return;
            
            const password = prompt('Masukkan password admin untuk konfirmasi:');
            if (!password) return;
            
            try {
                const response = await API.post('system.data.clear', { 
                    password: password 
                }, App.token);
                
                if (response.status === 'success') {
                    showToast('success', 'Berhasil', 'Semua data berhasil dihapus');
                    setTimeout(() => location.reload(), 2000);
                } else {
                    showToast('error', 'Error', response.message || 'Gagal menghapus data');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal menghapus data');
            }
        });
        
        // Maintenance mode toggle
        document.getElementById('maintenanceMode')?.addEventListener('change', async (e) => {
            const isEnabled = e.target.checked;
            
            if (!confirm(`${isEnabled ? 'Aktifkan' : 'Nonaktifkan'} maintenance mode?`)) {
                e.target.checked = !isEnabled;
                return;
            }
            
            try {
                const response = await API.post('config.update', {
                    maintenance_mode: isEnabled ? 'true' : 'false'
                }, App.token);
                
                if (response.status === 'success') {
                    showToast('success', 'Berhasil', `Maintenance mode ${isEnabled ? 'diaktifkan' : 'dinonaktifkan'}`);
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal mengubah maintenance mode');
                e.target.checked = !isEnabled;
            }
        });
        
        // Refresh log
        document.getElementById('refreshLogBtn')?.addEventListener('click', () => {
            this.loadSystemLogs();
        });
        
        // Log level filter
        document.getElementById('logLevelFilter')?.addEventListener('change', () => {
            this.loadSystemLogs();
        });
        
        // Download log
        document.getElementById('downloadLogBtn')?.addEventListener('click', () => {
            this.downloadSystemLogs();
        });
        
        // Clear log
        document.getElementById('clearLogBtn')?.addEventListener('click', async () => {
            if (!confirm('Hapus semua log sistem?')) return;
            
            try {
                const response = await API.post('system.logs.clear', {}, App.token);
                if (response.status === 'success') {
                    showToast('success', 'Berhasil', 'Log sistem berhasil dihapus');
                    this.loadSystemLogs();
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal menghapus log');
            }
        });
    },
    
    async loadSystemLogs() {
        try {
            const levelFilter = document.getElementById('logLevelFilter')?.value || 'all';
            
            const response = await API.get('system.logs', {
                token: App.token,
                level: levelFilter,
                limit: 100
            });
            
            const container = document.getElementById('systemLogs');
            
            if (response.status === 'success') {
                const items = response.data.items || [];
                if (items.length === 0) {
                    container.innerHTML = '<p class="text-muted">Tidak ada log</p>';
                    return;
                }
                
                container.innerHTML = `
                    <div class="log-entries">
                        ${items.map(item => `
                            <div class="log-entry log-level-${item.level?.toLowerCase()}">
                                <span class="log-timestamp">${Utils.formatDateTime(item.timestamp)}</span>
                                <span class="log-level badge badge-${item.level === 'ERROR' ? 'danger' : item.level === 'WARNING' ? 'warning' : 'info'}">${item.level}</span>
                                <span class="log-message">${item.message}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading system logs:', error);
        }
    },
    
    async downloadSystemLogs() {
        try {
            const response = await API.get('system.logs.download', { token: App.token });
            if (response.status === 'success' && response.data?.url) {
                window.open(response.data.url, '_blank');
            } else {
                showToast('error', 'Error', 'Gagal mendownload log');
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal mendownload log');
        }
    },
    
    // ========== SETUP BACKUP LISTENERS ==========
    setupBackupListeners() {
        // Create backup
        document.getElementById('createBackupBtn')?.addEventListener('click', async () => {
            const backupType = document.getElementById('backupType')?.value || 'full';
            
            try {
                showToast('info', 'Proses', 'Membuat backup...');
                
                const response = await API.post('system.backup.create', {
                    type: backupType
                }, App.token);
                
                if (response.status === 'success') {
                    showToast('success', 'Berhasil', 'Backup berhasil dibuat');
                    
                    // Download backup file
                    if (response.data?.download_url) {
                        window.open(response.data.download_url, '_blank');
                    }
                    
                    await this.loadBackupHistory();
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal membuat backup');
            }
        });
        
        // Restore upload area
        const dropArea = document.getElementById('restoreDropArea');
        const fileInput = document.getElementById('restoreFileInput');
        
        dropArea?.addEventListener('click', () => fileInput?.click());
        
        dropArea?.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('drag-over');
        });
        
        dropArea?.addEventListener('dragleave', () => {
            dropArea.classList.remove('drag-over');
        });
        
        dropArea?.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleRestoreFile(files[0]);
            }
        });
        
        fileInput?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleRestoreFile(e.target.files[0]);
            }
        });
        
        // Restore button
        document.getElementById('restoreBtn')?.addEventListener('click', async () => {
            const file = this.restoreFile;
            if (!file) return;
            
            if (!confirm('Restore data? Data saat ini akan ditimpa.')) return;
            
            try {
                showToast('info', 'Proses', 'Merestore data...');
                
                const formData = new FormData();
                formData.append('backup_file', file);
                
                const response = await API.upload('system.backup.restore', formData, App.token);
                
                if (response.status === 'success') {
                    showToast('success', 'Berhasil', 'Data berhasil direstore');
                    setTimeout(() => location.reload(), 2000);
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal restore data');
            }
        });
    },
    
    handleRestoreFile(file) {
        // Validate file type
        const allowedTypes = ['application/json', 'application/zip', 'application/x-zip-compressed'];
        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.json') && !file.name.endsWith('.zip')) {
            showToast('error', 'Error', 'Format file tidak didukung. Gunakan JSON atau ZIP.');
            return;
        }
        
        this.restoreFile = file;
        
        // Update UI
        const dropArea = document.getElementById('restoreDropArea');
        const restoreBtn = document.getElementById('restoreBtn');
        
        if (dropArea) {
            dropArea.innerHTML = `
                <i class="fas fa-file-archive"></i>
                <p>File dipilih: <strong>${file.name}</strong> (${Utils.formatFileSize(file.size)})</p>
                <small>Klik untuk mengganti file</small>
            `;
        }
        
        if (restoreBtn) {
            restoreBtn.disabled = false;
        }
    },
    
    async loadBackupHistory() {
        try {
            const response = await API.get('system.backup.history', { token: App.token });
            const container = document.getElementById('backupHistory');
            
            if (response.status === 'success') {
                const items = response.data.items || [];
                if (items.length === 0) {
                    container.innerHTML = '<p class="text-muted">Belum ada riwayat backup</p>';
                    return;
                }
                
                container.innerHTML = `
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Tipe</th>
                                    <th>Ukuran</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map(item => `
                                    <tr>
                                        <td>${Utils.formatDateTime(item.created_at)}</td>
                                        <td><span class="badge badge-info">${item.type}</span></td>
                                        <td>${Utils.formatFileSize(item.size)}</td>
                                        <td><span class="badge ${item.status === 'success' ? 'badge-success' : 'badge-danger'}">${item.status}</span></td>
                                        <td>
                                            <div class="action-btns">
                                                <button class="btn btn-sm btn-outline download-backup-btn" data-id="${item.id}">
                                                    <i class="fas fa-download"></i>
                                                </button>
                                                <button class="btn btn-sm btn-danger delete-backup-btn" data-id="${item.id}">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                
                // Download backup listeners
                container.querySelectorAll('.download-backup-btn').forEach(btn => {
                    btn.addEventListener('click', () => this.downloadBackup(btn.dataset.id));
                });
                
                // Delete backup listeners
                container.querySelectorAll('.delete-backup-btn').forEach(btn => {
                    btn.addEventListener('click', () => this.deleteBackup(btn.dataset.id));
                });
            }
        } catch (error) {
            console.error('Error loading backup history:', error);
        }
    },
    
    async downloadBackup(id) {
        try {
            const response = await API.get('system.backup.download', {
                token: App.token,
                id: id
            });
            
            if (response.status === 'success' && response.data?.url) {
                window.open(response.data.url, '_blank');
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal download backup');
        }
    },
    
    async deleteBackup(id) {
        if (!confirm('Hapus backup ini?')) return;
        
        try {
            const response = await API.post('system.backup.delete', { id: id }, App.token);
            if (response.status === 'success') {
                showToast('success', 'Berhasil', 'Backup berhasil dihapus');
                await this.loadBackupHistory();
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal menghapus backup');
        }
    },
    
    // ========== SETUP INTEGRATION LISTENERS ==========
    setupIntegrationListeners() {
        // Test email
        document.getElementById('testEmailBtn')?.addEventListener('click', async () => {
            const email = prompt('Masukkan email tujuan untuk test:');
            if (!email) return;
            
            try {
                showToast('info', 'Proses', 'Mengirim email test...');
                
                const response = await API.post('system.email.test', {
                    to: email
                }, App.token);
                
                if (response.status === 'success') {
                    showToast('success', 'Berhasil', 'Email test berhasil dikirim');
                } else {
                    showToast('error', 'Error', response.message || 'Gagal mengirim email test');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal mengirim email test');
            }
        });
        
        // Test webhook
        document.getElementById('testWebhookBtn')?.addEventListener('click', async () => {
            try {
                showToast('info', 'Proses', 'Mengirim webhook test...');
                
                const response = await API.post('system.webhook.test', {}, App.token);
                
                if (response.status === 'success') {
                    showToast('success', 'Berhasil', 'Webhook test berhasil dikirim');
                } else {
                    showToast('error', 'Error', response.message || 'Gagal mengirim webhook test');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal mengirim webhook test');
            }
        });
    },
    
    // ========== SETUP PASSWORD TOGGLE ==========
    setupPasswordToggle() {
        document.querySelectorAll('.toggle-password-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.parentElement.querySelector('input');
                const icon = btn.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    },
    
    // ========== SETUP PASSWORD STRENGTH ==========
    setupPasswordStrength() {
        const newPasswordInput = document.querySelector('[name="newPassword"]');
        const strengthBar = document.querySelector('.strength-bar');
        
        newPasswordInput?.addEventListener('input', () => {
            const password = newPasswordInput.value;
            const strength = this.calculatePasswordStrength(password);
            
            if (strengthBar) {
                strengthBar.style.width = `${strength.score * 25}%`;
                strengthBar.className = `strength-bar strength-${strength.level}`;
            }
        });
    },
    
    calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        let level;
        if (score <= 1) level = 'weak';
        else if (score <= 3) level = 'fair';
        else if (score <= 4) level = 'good';
        else level = 'strong';
        
        return { score: Math.min(score, 4), level };
    },
    
    // ========== LOAD DYNAMIC CONTENT ==========
    async loadDynamicContent() {
        // Load content for active panel
        const activePanel = document.querySelector('.settings-panel.active');
        if (activePanel) {
            const panelId = activePanel.id.replace('panel-', '');
            await this.loadPanelContent(panelId);
        }
    }
};

// ========== EXPORT CONFIG ==========
window.CONFIG = {
    APP_VERSION: '3.2.2',
    BUILD_DATE: '2026-07-12',
    SPREADSHEET_ID: '{{SPREADSHEET_ID}}',
    WEBAPP_URL: '{{WEBAPP_URL}}',
    ENVIRONMENT: '{{ENVIRONMENT}}'
};

// ========== EXPORT MODULE ==========
window.Settings = Settings;
