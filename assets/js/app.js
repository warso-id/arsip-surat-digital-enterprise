// app.js - Main Application (Updated with Router)
class App {
    constructor() {
        this.version = CONFIG.APP_VERSION;
        this.currentRoute = null;
        this.isOnline = navigator.onLine;
        this.isLoading = false;
        this.pageCache = new Map();
    }

    async init() {
        try {
            console.log('Initializing App v' + this.version);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Check online status
            this.checkOnlineStatus();
            
            // Hide spinner
            this.hideSpinner();
            
            // Listen for route changes from router
            window.addEventListener('route-change', (event) => {
                const { route } = event.detail;
                this.navigateTo(route);
            });
            
            // Check authentication and show appropriate page
            if (auth.isAuthenticated) {
                // Router will handle the initial route
                const route = router.getCurrentRoute() || 'dashboard';
                await this.navigateTo(route);
            } else {
                this.showLoginPage();
            }
            
            // Process sync queue if online
            if (this.isOnline) {
                try {
                    await api.processSyncQueue();
                } catch (e) {
                    console.log('Sync queue processing skipped');
                }
            }
            
            console.log('App initialized successfully');
            
        } catch (error) {
            console.error('App initialization error:', error);
            this.hideSpinner();
            this.showLoginPage();
        }
    }

    setupEventListeners() {
        // Online/Offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Close modals on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
        
        // Close modal when clicking overlay
        document.addEventListener('click', (e) => {
            if (e.target.id === 'crud-modal') {
                this.closeModal();
            }
        });

        // Handle service worker messages
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SYNC_QUEUE') {
                    api.processSyncQueue();
                }
            });
        }
    }

    checkOnlineStatus() {
        this.isOnline = navigator.onLine;
        this.updateOfflineIndicator();
        return this.isOnline;
    }

    updateOfflineIndicator() {
        const indicator = document.getElementById('offline-indicator');
        if (!indicator) return;
        
        if (this.isOnline) {
            indicator.classList.remove('show');
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 300);
        } else {
            indicator.style.display = 'block';
            setTimeout(() => indicator.classList.add('show'), 10);
        }
    }

    handleOnline() {
        this.isOnline = true;
        this.updateOfflineIndicator();
        this.showToast('Koneksi internet tersedia', 'success');
        api.processSyncQueue().catch(e => {
            console.log('Sync queue processing failed:', e);
        });
    }

    handleOffline() {
        this.isOnline = false;
        this.updateOfflineIndicator();
        this.showToast('Anda sedang offline', 'warning');
    }

    async navigateTo(route) {
        if (this.isLoading) return;
        
        // Security: Sanitize route
        route = Router.sanitizeRoute(route || 'dashboard');
        
        this.isLoading = true;
        this.currentRoute = route;
        
        // Show loading state
        this.showPageLoading();
        
        try {
            switch(route) {
                case 'dashboard':
                    await this.showDashboard();
                    break;
                case 'surat-masuk':
                    await this.showSuratMasuk();
                    break;
                case 'surat-keluar':
                    await this.showSuratKeluar();
                    break;
                case 'disposisi':
                    await this.showDisposisi();
                    break;
                case 'laporan':
                    await this.showLaporan();
                    break;
                case 'pengguna':
                    await this.showPengguna();
                    break;
                case 'instansi':
                    await this.showInstansi();
                    break;
                case 'kategori':
                    await this.showKategori();
                    break;
                case 'pengaturan':
                    await this.showPengaturan();
                    break;
                case 'profile':
                    await this.showProfile();
                    break;
                case 'notifikasi':
                    await this.showNotifikasi();
                    break;
                case 'login':
                    this.showLoginPage();
                    break;
                case 'register':
                    this.showRegisterPage();
                    break;
                case 'logout':
                    await this.logout();
                    break;
                default:
                    this.show404();
            }
        } catch (error) {
            console.error('Navigation error:', error);
            this.showError('Gagal memuat halaman');
        } finally {
            this.isLoading = false;
            this.hidePageLoading();
        }
    }

    showPageLoading() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <div class="spinner-enterprise"></div>
                    <p class="spinner-text">Memuat halaman...</p>
                </div>
            `;
        }
    }

    hidePageLoading() {
        // Loading state is replaced by actual content
    }

    // ============================================
    // PAGE RENDERERS
    // ============================================

    async showDashboard() {
        if (!auth.isAuthenticated) {
            this.showLoginPage();
            return;
        }

        const container = document.getElementById('app-container');
        if (!container) return;

        container.innerHTML = `
            <div class="dashboard-page">
                ${this.renderHeader()}
                <div class="main-layout">
                    ${this.renderSidebar()}
                    <main class="main-content" id="main-content">
                        <div class="dashboard-container">
                            <div class="page-header">
                                <h2><i class="fas fa-chart-pie"></i> Dashboard</h2>
                                <div class="header-actions">
                                    <span id="current-date">${this.formatDate(new Date())}</span>
                                    <button onclick="app.refreshDashboard()" class="btn btn-primary btn-sm">
                                        <i class="fas fa-sync-alt"></i> Refresh
                                    </button>
                                </div>
                            </div>
                            <div class="stats-grid" id="dashboard-stats">
                                <div style="text-align: center; padding: 50px;">
                                    <i class="fas fa-spinner fa-spin"></i> Memuat data...
                                </div>
                            </div>
                            <div class="dashboard-grid">
                                <div class="chart-container">
                                    <h3>Aktivitas Terbaru</h3>
                                    <div id="recent-activities">
                                        <p class="text-center">Memuat aktivitas...</p>
                                    </div>
                                </div>
                                <div class="chart-container">
                                    <h3>Quick Actions</h3>
                                    <div class="quick-actions">
                                        <button class="btn btn-primary" data-route="surat-masuk">
                                            <i class="fas fa-plus"></i> Surat Masuk Baru
                                        </button>
                                        <button class="btn btn-success" data-route="surat-keluar">
                                            <i class="fas fa-plus"></i> Surat Keluar Baru
                                        </button>
                                        <button class="btn btn-info" data-route="disposisi">
                                            <i class="fas fa-exchange-alt"></i> Buat Disposisi
                                        </button>
                                        <button class="btn btn-warning" data-route="laporan">
                                            <i class="fas fa-chart-bar"></i> Generate Laporan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        `;

        // Load dashboard stats
        await this.loadDashboardStats();
    }

    async showSuratMasuk() {
        if (!auth.isAuthenticated) {
            this.showLoginPage();
            return;
        }

        const container = document.getElementById('app-container');
        if (!container) return;

        container.innerHTML = `
            <div class="dashboard-page">
                ${this.renderHeader()}
                <div class="main-layout">
                    ${this.renderSidebar()}
                    <main class="main-content" id="main-content">
                        <div class="surat-container">
                            <div class="page-header">
                                <h2><i class="fas fa-inbox"></i> Surat Masuk</h2>
                                <div class="header-actions">
                                    <button class="btn btn-success btn-sm" onclick="app.exportData('surat-masuk')">
                                        <i class="fas fa-download"></i> Export
                                    </button>
                                    <button class="btn btn-primary" onclick="app.showSuratMasukForm()">
                                        <i class="fas fa-plus"></i> Tambah Surat Masuk
                                    </button>
                                </div>
                            </div>
                            
                            <div class="filter-bar">
                                <div class="filter-row">
                                    <div class="search-box">
                                        <i class="fas fa-search search-icon-input"></i>
                                        <input type="text" id="search-surat-masuk" 
                                               placeholder="Cari surat masuk..." 
                                               class="form-control"
                                               onkeyup="app.searchSuratMasuk()">
                                    </div>
                                    <select id="filter-status-masuk" class="form-control" onchange="app.filterSuratMasuk()">
                                        <option value="">Semua Status</option>
                                        <option value="baru">Baru</option>
                                        <option value="diproses">Diproses</option>
                                        <option value="selesai">Selesai</option>
                                    </select>
                                    <input type="date" id="filter-date-masuk" class="form-control" onchange="app.filterSuratMasuk()">
                                    <button onclick="app.resetFilterSuratMasuk()" class="btn btn-secondary btn-sm">
                                        <i class="fas fa-undo"></i> Reset
                                    </button>
                                </div>
                            </div>

                            <div class="table-responsive" id="surat-masuk-table">
                                <p class="text-center">Memuat data...</p>
                            </div>
                            
                            <div id="pagination-surat-masuk"></div>
                        </div>
                    </main>
                </div>
            </div>
        `;

        await this.loadSuratMasukData();
    }

    async showSuratKeluar() {
        if (!auth.isAuthenticated) {
            this.showLoginPage();
            return;
        }

        const container = document.getElementById('app-container');
        if (!container) return;

        container.innerHTML = `
            <div class="dashboard-page">
                ${this.renderHeader()}
                <div class="main-layout">
                    ${this.renderSidebar()}
                    <main class="main-content" id="main-content">
                        <div class="surat-container">
                            <div class="page-header">
                                <h2><i class="fas fa-paper-plane"></i> Surat Keluar</h2>
                                <div class="header-actions">
                                    <button class="btn btn-success btn-sm" onclick="app.exportData('surat-keluar')">
                                        <i class="fas fa-download"></i> Export
                                    </button>
                                    <button class="btn btn-primary" onclick="app.showSuratKeluarForm()">
                                        <i class="fas fa-plus"></i> Tambah Surat Keluar
                                    </button>
                                </div>
                            </div>
                            
                            <div class="filter-bar">
                                <div class="filter-row">
                                    <div class="search-box">
                                        <i class="fas fa-search search-icon-input"></i>
                                        <input type="text" id="search-surat-keluar" 
                                               placeholder="Cari surat keluar..." 
                                               class="form-control"
                                               onkeyup="app.searchSuratKeluar()">
                                    </div>
                                </div>
                            </div>

                            <div class="table-responsive" id="surat-keluar-table">
                                <p class="text-center">Memuat data...</p>
                            </div>
                            
                            <div id="pagination-surat-keluar"></div>
                        </div>
                    </main>
                </div>
            </div>
        `;

        await this.loadSuratKeluarData();
    }

    async showDisposisi() {
        if (!auth.isAuthenticated) {
            this.showLoginPage();
            return;
        }

        const container = document.getElementById('app-container');
        if (!container) return;

        container.innerHTML = `
            <div class="dashboard-page">
                ${this.renderHeader()}
                <div class="main-layout">
                    ${this.renderSidebar()}
                    <main class="main-content" id="main-content">
                        <div class="disposisi-container">
                            <div class="page-header">
                                <h2><i class="fas fa-clipboard-list"></i> Disposisi</h2>
                                <button class="btn btn-primary" onclick="app.showDisposisiForm()">
                                    <i class="fas fa-plus"></i> Buat Disposisi
                                </button>
                            </div>
                            <div class="table-responsive" id="disposisi-table">
                                <p class="text-center">Memuat data...</p>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        `;

        await this.loadDisposisiData();
    }

    async showLaporan() {
        if (!auth.isAuthenticated) {
            this.showLoginPage();
            return;
        }

        const container = document.getElementById('app-container');
        if (!container) return;

        container.innerHTML = `
            <div class="dashboard-page">
                ${this.renderHeader()}
                <div class="main-layout">
                    ${this.renderSidebar()}
                    <main class="main-content" id="main-content">
                        <div class="laporan-container">
                            <div class="page-header">
                                <h2><i class="fas fa-chart-bar"></i> Laporan</h2>
                            </div>
                            <div class="report-cards">
                                <div class="report-card">
                                    <div class="card-icon"><i class="fas fa-file-pdf"></i></div>
                                    <div class="card-content">
                                        <h3>Laporan Surat Masuk</h3>
                                        <p>Generate laporan surat masuk per periode</p>
                                        <button class="btn btn-primary" onclick="app.generateReport('surat-masuk')">
                                            <i class="fas fa-download"></i> Generate
                                        </button>
                                    </div>
                                </div>
                                <div class="report-card">
                                    <div class="card-icon"><i class="fas fa-file-pdf"></i></div>
                                    <div class="card-content">
                                        <h3>Laporan Surat Keluar</h3>
                                        <p>Generate laporan surat keluar per periode</p>
                                        <button class="btn btn-primary" onclick="app.generateReport('surat-keluar')">
                                            <i class="fas fa-download"></i> Generate
                                        </button>
                                    </div>
                                </div>
                                <div class="report-card">
                                    <div class="card-icon"><i class="fas fa-file-pdf"></i></div>
                                    <div class="card-content">
                                        <h3>Laporan Disposisi</h3>
                                        <p>Generate laporan disposisi per periode</p>
                                        <button class="btn btn-primary" onclick="app.generateReport('disposisi')">
                                            <i class="fas fa-download"></i> Generate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        `;
    }

    async showPengguna() {
        if (!auth.isAuthenticated) {
            this.showLoginPage();
            return;
        }

        const container = document.getElementById('app-container');
        if (!container) return;

        container.innerHTML = `
            <div class="dashboard-page">
                ${this.renderHeader()}
                <div class="main-layout">
                    ${this.renderSidebar()}
                    <main class="main-content" id="main-content">
                        <div class="page-header">
                            <h2><i class="fas fa-users"></i> Manajemen Pengguna</h2>
                            <button class="btn btn-primary" onclick="app.showAddUserForm()">
                                <i class="fas fa-user-plus"></i> Tambah Pengguna
                            </button>
                        </div>
                        <div class="table-responsive" id="pengguna-table">
                            <p class="text-center">Memuat data...</p>
                        </div>
                    </main>
                </div>
            </div>
        `;

        await this.loadPenggunaData();
    }

    async showInstansi() {
        if (!auth.isAuthenticated) {
            this.showLoginPage();
            return;
        }

        const container = document.getElementById('app-container');
        if (!container) return;

        container.innerHTML = `
            <div class="dashboard-page">
                ${this.renderHeader()}
                <div class="main-layout">
                    ${this.renderSidebar()}
                    <main class="main-content" id="main-content">
                        <div class="page-header">
                            <h2><i class="fas fa-building"></i> Data Instansi</h2>
                            <button class="btn btn-primary" onclick="app.showAddInstansiForm()">
                                <i class="fas fa-plus"></i> Tambah Instansi
                            </button>
                        </div>
                        <div class="table-responsive" id="instansi-table">
                            <p class="text-center">Memuat data...</p>
                        </div>
                    </main>
                </div>
            </div>
        `;

        await this.loadInstansiData();
    }

    async showKategori() {
        if (!auth.isAuthenticated) {
            this.showLoginPage();
            return;
        }

        const container = document.getElementById('app-container');
        if (!container) return;

        container.innerHTML = `
            <div class="dashboard-page">
                ${this.renderHeader()}
                <div class="main-layout">
                    ${this.renderSidebar()}
                    <main class="main-content" id="main-content">
                        <div class="page-header">
                            <h2><i class="fas fa-tags"></i> Kategori Surat</h2>
                            <button class="btn btn-primary" onclick="app.showAddKategoriForm()">
                                <i class="fas fa-plus"></i> Tambah Kategori
                            </button>
                        </div>
                        <div class="table-responsive" id="kategori-table">
                            <p class="text-center">Memuat data...</p>
                        </div>
                    </main>
                </div>
            </div>
        `;

        await this.loadKategoriData();
    }

    showPengaturan() {
        if (!auth.isAuthenticated) {
            this.showLoginPage();
            return;
        }

        const container = document.getElementById('app-container');
        if (!container) return;

        container.innerHTML = `
            <div class="dashboard-page">
                ${this.renderHeader()}
                <div class="main-layout">
                    ${this.renderSidebar()}
                    <main class="main-content" id="main-content">
                        <div class="page-header">
                            <h2><i class="fas fa-cog"></i> Pengaturan</h2>
                        </div>
                        <div class="settings-container">
                            <p>Pengaturan sistem sedang dalam pengembangan.</p>
                        </div>
                    </main>
                </div>
            </div>
        `;
    }

    showProfile() {
        if (!auth.isAuthenticated) {
            this.showLoginPage();
            return;
        }

        const user = auth.getUser();
        const container = document.getElementById('app-container');
        if (!container) return;

        container.innerHTML = `
            <div class="dashboard-page">
                ${this.renderHeader()}
                <div class="main-layout">
                    ${this.renderSidebar()}
                    <main class="main-content" id="main-content">
                        <div class="profile-container">
                            <div class="page-header">
                                <h2><i class="fas fa-user"></i> Profil Pengguna</h2>
                            </div>
                            <div class="profile-card">
                                <div class="profile-avatar-large">
                                    <div class="avatar-placeholder">${(user.fullName || user.username || 'U').charAt(0).toUpperCase()}</div>
                                </div>
                                <div class="profile-details">
                                    <h3>${user.fullName || user.username}</h3>
                                    <p><strong>Username:</strong> ${user.username}</p>
                                    <p><strong>Email:</strong> ${user.email || '-'}</p>
                                    <p><strong>Role:</strong> ${user.role || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        `;
    }

    showNotifikasi() {
        if (!auth.isAuthenticated) {
            this.showLoginPage();
            return;
        }

        const container = document.getElementById('app-container');
        if (!container) return;

        container.innerHTML = `
            <div class="dashboard-page">
                ${this.renderHeader()}
                <div class="main-layout">
                    ${this.renderSidebar()}
                    <main class="main-content" id="main-content">
                        <div class="page-header">
                            <h2><i class="fas fa-bell"></i> Notifikasi</h2>
                            <button class="btn btn-secondary btn-sm" onclick="app.markAllNotificationsRead()">
                                <i class="fas fa-check-double"></i> Tandai Semua Dibaca
                            </button>
                        </div>
                        <div id="notifikasi-list">
                            <p class="text-center">Memuat notifikasi...</p>
                        </div>
                    </main>
                </div>
            </div>
        `;

        this.loadNotifications();
    }

    showLoginPage() {
        const container = document.getElementById('app-container');
        if (!container) return;

        container.innerHTML = `
            <div class="auth-page">
                <div class="auth-container">
                    <div class="auth-card">
                        <div class="auth-header">
                            <div class="auth-logo">AS</div>
                            <h2>Arsip Surat Digital</h2>
                            <p>Enterprise ${this.version}</p>
                        </div>
                        <form id="login-form" onsubmit="event.preventDefault(); app.handleLogin()">
                            <div class="form-group">
                                <label><i class="fas fa-user"></i> Username atau Email</label>
                                <input type="text" id="login-identifier" class="form-control" 
                                       placeholder="Masukkan username atau email" required autocomplete="username">
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-lock"></i> Password</label>
                                <input type="password" id="login-password" class="form-control" 
                                       placeholder="Masukkan password" required autocomplete="current-password">
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px;">
                                    <input type="checkbox" id="login-remember">
                                    <span>Ingat Saya</span>
                                </label>
                            </div>
                            <div id="login-error" class="alert alert-error" style="display: none;"></div>
                            <button type="submit" class="btn btn-primary btn-block" id="login-btn">
                                <i class="fas fa-sign-in-alt"></i> Masuk
                            </button>
                        </form>
                        <div class="auth-footer">
                            <p>Belum punya akun? <a href="#" onclick="event.preventDefault(); app.showRegisterPage()">Daftar disini</a></p>
                            <a href="#" onclick="event.preventDefault(); app.showForgotPassword()">Lupa password?</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showRegisterPage() {
        const container = document.getElementById('app-container');
        if (!container) return;

        container.innerHTML = `
            <div class="auth-page">
                <div class="auth-container">
                    <div class="auth-card">
                        <div class="auth-header">
                            <div class="auth-logo">AS</div>
                            <h2>Registrasi</h2>
                            <p>Buat akun baru</p>
                        </div>
                        <form id="register-form" onsubmit="event.preventDefault(); app.handleRegister()">
                            <div class="form-group">
                                <label><i class="fas fa-user"></i> Nama Lengkap</label>
                                <input type="text" id="reg-fullname" class="form-control" 
                                       placeholder="Masukkan nama lengkap" required>
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-user-circle"></i> Username</label>
                                <input type="text" id="reg-username" class="form-control" 
                                       placeholder="Masukkan username" required>
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-envelope"></i> Email</label>
                                <input type="email" id="reg-email" class="form-control" 
                                       placeholder="Masukkan email" required>
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-lock"></i> Password</label>
                                <input type="password" id="reg-password" class="form-control" 
                                       placeholder="Masukkan password" required minlength="6">
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-lock"></i> Konfirmasi Password</label>
                                <input type="password" id="reg-confirm-password" class="form-control" 
                                       placeholder="Konfirmasi password" required minlength="6">
                            </div>
                            <div id="register-error" class="alert alert-error" style="display: none;"></div>
                            <button type="submit" class="btn btn-primary btn-block" id="register-btn">
                                <i class="fas fa-user-plus"></i> Daftar
                            </button>
                        </form>
                        <div class="auth-footer">
                            <p>Sudah punya akun? <a href="#" onclick="event.preventDefault(); app.showLoginPage()">Login disini</a></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    show404() {
        const container = document.getElementById('app-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 100px 20px;">
                    <h1 style="font-size: 72px; color: #1a73e8;">404</h1>
                    <h3>Halaman Tidak Ditemukan</h3>
                    <p>Maaf, halaman yang Anda cari tidak tersedia.</p>
                    <button class="btn btn-primary" data-route="dashboard">
                        <i class="fas fa-home"></i> Kembali ke Dashboard
                    </button>
                </div>
            `;
        }
    }

    showError(message) {
        const container = document.getElementById('app-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 100px 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: #ff9800;"></i>
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Muat Ulang
                    </button>
                </div>
            `;
        }
    }

    // ============================================
    // COMPONENT RENDERERS
    // ============================================

    renderHeader() {
        const user = auth.getUser();
        return `
            <header class="app-header">
                <div class="header-container">
                    <div class="header-left">
                        <button class="menu-toggle" onclick="app.toggleSidebar()">
                            <i class="fas fa-bars"></i>
                        </button>
                        <div class="logo-section">
                            <div class="logo-placeholder-small">AS</div>
                            <div>
                                <h1>Arsip Surat Digital</h1>
                                <span class="version-badge">Enterprise ${this.version}</span>
                            </div>
                        </div>
                    </div>
                    <div class="header-center">
                        <div class="search-global">
                            <i class="fas fa-search"></i>
                            <input type="text" placeholder="Cari surat..." class="search-input"
                                   onkeyup="if(event.key==='Enter') app.globalSearch(this.value)">
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="btn-icon" data-route="notifikasi" title="Notifikasi">
                            <i class="fas fa-bell"></i>
                            <span class="badge" id="notif-badge" style="display:none;">0</span>
                        </button>
                        <div class="user-info">
                            <span>${user?.fullName || user?.username || 'User'}</span>
                            <button onclick="app.logout()" class="btn btn-secondary btn-sm">
                                <i class="fas fa-sign-out-alt"></i> Keluar
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }

    renderSidebar() {
        return `
            <aside class="sidebar">
                <nav>
                    <a href="/arsip-surat-digital-enterprise/dashboard" data-route="dashboard" class="nav-link active">
                        <i class="fas fa-chart-pie"></i> Dashboard
                    </a>
                    <a href="/arsip-surat-digital-enterprise/surat-masuk" data-route="surat-masuk" class="nav-link">
                        <i class="fas fa-inbox"></i> Surat Masuk
                    </a>
                    <a href="/arsip-surat-digital-enterprise/surat-keluar" data-route="surat-keluar" class="nav-link">
                        <i class="fas fa-paper-plane"></i> Surat Keluar
                    </a>
                    <a href="/arsip-surat-digital-enterprise/disposisi" data-route="disposisi" class="nav-link">
                        <i class="fas fa-clipboard-list"></i> Disposisi
                    </a>
                    <a href="/arsip-surat-digital-enterprise/laporan" data-route="laporan" class="nav-link">
                        <i class="fas fa-chart-bar"></i> Laporan
                    </a>
                    <hr>
                    <a href="/arsip-surat-digital-enterprise/pengguna" data-route="pengguna" class="nav-link">
                        <i class="fas fa-users"></i> Pengguna
                    </a>
                    <a href="/arsip-surat-digital-enterprise/instansi" data-route="instansi" class="nav-link">
                        <i class="fas fa-building"></i> Instansi
                    </a>
                    <a href="/arsip-surat-digital-enterprise/kategori" data-route="kategori" class="nav-link">
                        <i class="fas fa-tags"></i> Kategori
                    </a>
                    <a href="/arsip-surat-digital-enterprise/pengaturan" data-route="pengaturan" class="nav-link">
                        <i class="fas fa-cog"></i> Pengaturan
                    </a>
                </nav>
            </aside>
        `;
    }

    // ============================================
    // DATA LOADING METHODS
    // ============================================

    async loadDashboardStats() {
        try {
            const result = await api.getDashboardStats();
            if (result.success) {
                this.renderDashboardStats(result.data);
                this.renderRecentActivities(result.data.recentActivities || []);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    renderDashboardStats(stats) {
        const container = document.getElementById('dashboard-stats');
        if (!container) return;

        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-inbox"></i></div>
                <div class="stat-info">
                    <h3>${stats.totalSuratMasuk || 0}</h3>
                    <p>Surat Masuk</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-paper-plane"></i></div>
                <div class="stat-info">
                    <h3>${stats.totalSuratKeluar || 0}</h3>
                    <p>Surat Keluar</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-clipboard-list"></i></div>
                <div class="stat-info">
                    <h3>${stats.totalDisposisi || 0}</h3>
                    <p>Disposisi</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-clock"></i></div>
                <div class="stat-info">
                    <h3>${stats.pendingDisposisi || 0}</h3>
                    <p>Pending</p>
                </div>
            </div>
        `;
    }

    renderRecentActivities(activities) {
        const container = document.getElementById('recent-activities');
        if (!container) return;

        if (activities.length === 0) {
            container.innerHTML = '<p class="text-center">Belum ada aktivitas</p>';
            return;
        }

        container.innerHTML = activities.slice(0, 5).map(activity => `
            <div class="activity-item">
                <div class="activity-icon"><i class="fas fa-circle"></i></div>
                <div class="activity-content">
                    <p>${activity.description}</p>
                    <small>${this.formatDateTime(activity.timestamp)}</small>
                </div>
            </div>
        `).join('');
    }

    async loadSuratMasukData() {
        try {
            const result = await api.getSuratMasuk();
            if (result.success) {
                this.renderSuratMasukTable(result.data);
            }
        } catch (error) {
            console.error('Error loading surat masuk:', error);
        }
    }

    renderSuratMasukTable(data) {
        const container = document.getElementById('surat-masuk-table');
        if (!container) return;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-center">Tidak ada data surat masuk</p>';
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>No. Agenda</th>
                        <th>No. Surat</th>
                        <th>Tanggal</th>
                        <th>Pengirim</th>
                        <th>Perihal</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item.nomor_agenda || '-'}</td>
                            <td>${item.nomor_surat || '-'}</td>
                            <td>${this.formatDate(item.tanggal_surat)}</td>
                            <td>${item.pengirim || '-'}</td>
                            <td>${item.perihal || '-'}</td>
                            <td><span class="badge badge-info">${item.status || 'baru'}</span></td>
                            <td>
                                <button class="btn btn-sm btn-info" onclick="app.viewSuratMasuk('${item.id}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="app.editSuratMasuk('${item.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="app.deleteSuratMasuk('${item.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    async loadSuratKeluarData() {
        try {
            const result = await api.getSuratKeluar();
            if (result.success) {
                this.renderSuratKeluarTable(result.data);
            }
        } catch (error) {
            console.error('Error loading surat keluar:', error);
        }
    }

    renderSuratKeluarTable(data) {
        const container = document.getElementById('surat-keluar-table');
        if (!container) return;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-center">Tidak ada data surat keluar</p>';
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>No. Surat</th>
                        <th>Tanggal</th>
                        <th>Tujuan</th>
                        <th>Perihal</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item.nomor_surat || '-'}</td>
                            <td>${this.formatDate(item.tanggal_surat)}</td>
                            <td>${item.tujuan || '-'}</td>
                            <td>${item.perihal || '-'}</td>
                            <td><span class="badge badge-warning">${item.status || 'draft'}</span></td>
                            <td>
                                <button class="btn btn-sm btn-info" onclick="app.viewSuratKeluar('${item.id}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="app.editSuratKeluar('${item.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="app.deleteSuratKeluar('${item.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    async loadDisposisiData() {
        try {
            const result = await api.getDisposisi();
            if (result.success) {
                this.renderDisposisiTable(result.data);
            }
        } catch (error) {
            console.error('Error loading disposisi:', error);
        }
    }

    renderDisposisiTable(data) {
        const container = document.getElementById('disposisi-table');
        if (!container) return;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-center">Tidak ada data disposisi</p>';
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Instruksi</th>
                        <th>Sifat</th>
                        <th>Batas Waktu</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item.instruksi || '-'}</td>
                            <td>${item.sifat || '-'}</td>
                            <td>${this.formatDate(item.batas_waktu)}</td>
                            <td><span class="badge badge-info">${item.status || 'pending'}</span></td>
                            <td>
                                <button class="btn btn-sm btn-success" onclick="app.approveDisposisi('${item.id}')">
                                    <i class="fas fa-check"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    async loadPenggunaData() {
        try {
            const result = await api.getPengguna();
            if (result.success) {
                this.renderPenggunaTable(result.data);
            }
        } catch (error) {
            console.error('Error loading pengguna:', error);
        }
    }

    renderPenggunaTable(data) {
        const container = document.getElementById('pengguna-table');
        if (!container) return;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-center">Tidak ada data pengguna</p>';
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Username</th>
                        <th>Nama</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item.username}</td>
                            <td>${item.fullName || '-'}</td>
                            <td>${item.email || '-'}</td>
                            <td><span class="badge badge-info">${item.role}</span></td>
                            <td><span class="badge ${item.isActive ? 'badge-success' : 'badge-danger'}">
                                ${item.isActive ? 'Aktif' : 'Nonaktif'}
                            </span></td>
                            <td>
                                <button class="btn btn-sm btn-warning" onclick="app.editPengguna('${item.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="app.deletePengguna('${item.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    async loadInstansiData() {
        try {
            const result = await api.getInstansi();
            if (result.success) {
                this.renderInstansiTable(result.data);
            }
        } catch (error) {
            console.error('Error loading instansi:', error);
        }
    }

    renderInstansiTable(data) {
        const container = document.getElementById('instansi-table');
        if (!container) return;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-center">Tidak ada data instansi</p>';
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Nama Instansi</th>
                        <th>Alamat</th>
                        <th>Telepon</th>
                        <th>Email</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item.nama || '-'}</td>
                            <td>${item.alamat || '-'}</td>
                            <td>${item.telepon || '-'}</td>
                            <td>${item.email || '-'}</td>
                            <td>
                                <button class="btn btn-sm btn-warning" onclick="app.editInstansi('${item.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="app.deleteInstansi('${item.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    async loadKategoriData() {
        try {
            const result = await api.getKategori();
            if (result.success) {
                this.renderKategoriTable(result.data);
            }
        } catch (error) {
            console.error('Error loading kategori:', error);
        }
    }

    renderKategoriTable(data) {
        const container = document.getElementById('kategori-table');
        if (!container) return;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-center">Tidak ada data kategori</p>';
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Nama Kategori</th>
                        <th>Deskripsi</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item.nama || '-'}</td>
                            <td>${item.deskripsi || '-'}</td>
                            <td>
                                <button class="btn btn-sm btn-warning" onclick="app.editKategori('${item.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="app.deleteKategori('${item.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    async loadNotifications() {
        try {
            const result = await api.getNotifications();
            if (result.success) {
                this.renderNotifications(result.data);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    renderNotifications(data) {
        const container = document.getElementById('notifikasi-list');
        if (!container) return;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-center">Tidak ada notifikasi</p>';
            return;
        }

        container.innerHTML = data.map(item => `
            <div class="notification-item ${item.isRead ? 'read' : 'unread'}">
                <div class="notification-icon">
                    <i class="fas fa-${item.tipe === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                </div>
                <div class="notification-content">
                    <h4>${item.judul}</h4>
                    <p>${item.pesan}</p>
                    <small>${this.formatDateTime(item.created_at)}</small>
                </div>
            </div>
        `).join('');
    }

    // ============================================
    // AUTH METHODS
    // ============================================

    async handleLogin() {
        const identifier = document.getElementById('login-identifier')?.value;
        const password = document.getElementById('login-password')?.value;
        const remember = document.getElementById('login-remember')?.checked;
        const errorDiv = document.getElementById('login-error');
        const loginBtn = document.getElementById('login-btn');
        
        if (!identifier || !password) {
            this.showFormError(errorDiv, 'Username/email dan password wajib diisi');
            return;
        }
        
        this.setButtonLoading(loginBtn, true);
        
        try {
            const result = await auth.login(identifier, password, remember);
            
            if (result.success) {
                this.showToast('Login berhasil! Selamat datang.', 'success');
                router.navigate('dashboard');
            } else {
                this.showFormError(errorDiv, result.message || 'Login gagal');
            }
        } catch (error) {
            this.showFormError(errorDiv, 'Gagal terhubung ke server');
        } finally {
            this.setButtonLoading(loginBtn, false);
        }
    }

    async handleRegister() {
        const fullname = document.getElementById('reg-fullname')?.value;
        const username = document.getElementById('reg-username')?.value;
        const email = document.getElementById('reg-email')?.value;
        const password = document.getElementById('reg-password')?.value;
        const confirmPassword = document.getElementById('reg-confirm-password')?.value;
        const errorDiv = document.getElementById('register-error');
        const registerBtn = document.getElementById('register-btn');
        
        if (!fullname || !username || !email || !password) {
            this.showFormError(errorDiv, 'Semua field wajib diisi');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showFormError(errorDiv, 'Password tidak cocok');
            return;
        }
        
        if (password.length < 6) {
            this.showFormError(errorDiv, 'Password minimal 6 karakter');
            return;
        }
        
        this.setButtonLoading(registerBtn, true);
        
        try {
            const result = await auth.register({ fullname, username, email, password });
            
            if (result.success) {
                this.showToast('Registrasi berhasil! Silakan login.', 'success');
                this.showLoginPage();
            } else {
                this.showFormError(errorDiv, result.message || 'Registrasi gagal');
            }
        } catch (error) {
            this.showFormError(errorDiv, 'Gagal terhubung ke server');
        } finally {
            this.setButtonLoading(registerBtn, false);
        }
    }

    async logout() {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            await auth.logout();
            router.navigate('login');
            this.showToast('Anda telah logout', 'info');
        }
    }

    showForgotPassword() {
        this.showToast('Fitur lupa password sedang dalam pengembangan', 'info');
    }

    // ============================================
    // CRUD ACTIONS
    // ============================================

    showSuratMasukForm() {
        this.showToast('Form surat masuk akan ditampilkan', 'info');
    }

    showSuratKeluarForm() {
        this.showToast('Form surat keluar akan ditampilkan', 'info');
    }

    showDisposisiForm() {
        this.showToast('Form disposisi akan ditampilkan', 'info');
    }

    viewSuratMasuk(id) {
        console.log('View surat masuk:', id);
    }

    editSuratMasuk(id) {
        console.log('Edit surat masuk:', id);
    }

    async deleteSuratMasuk(id) {
        if (confirm('Apakah Anda yakin ingin menghapus surat ini?')) {
            try {
                const result = await api.deleteSuratMasuk(id);
                if (result.success) {
                    this.showToast('Surat berhasil dihapus', 'success');
                    await this.loadSuratMasukData();
                } else {
                    this.showToast(result.message || 'Gagal menghapus surat', 'error');
                }
            } catch (error) {
                this.showToast('Gagal menghapus surat', 'error');
            }
        }
    }

    viewSuratKeluar(id) {
        console.log('View surat keluar:', id);
    }

    editSuratKeluar(id) {
        console.log('Edit surat keluar:', id);
    }

    async deleteSuratKeluar(id) {
        if (confirm('Apakah Anda yakin ingin menghapus surat ini?')) {
            try {
                const result = await api.deleteSuratKeluar(id);
                if (result.success) {
                    this.showToast('Surat berhasil dihapus', 'success');
                    await this.loadSuratKeluarData();
                } else {
                    this.showToast(result.message || 'Gagal menghapus surat', 'error');
                }
            } catch (error) {
                this.showToast('Gagal menghapus surat', 'error');
            }
        }
    }

    async approveDisposisi(id) {
        if (confirm('Setujui disposisi ini?')) {
            try {
                const result = await api.updateDisposisi(id, { status: 'selesai' });
                if (result.success) {
                    this.showToast('Disposisi disetujui', 'success');
                    await this.loadDisposisiData();
                } else {
                    this.showToast('Gagal menyetujui disposisi', 'error');
                }
            } catch (error) {
                this.showToast('Gagal menyetujui disposisi', 'error');
            }
        }
    }

    searchSuratMasuk() {
        const searchValue = document.getElementById('search-surat-masuk')?.value || '';
        console.log('Search surat masuk:', searchValue);
    }

    filterSuratMasuk() {
        console.log('Filter surat masuk');
    }

    resetFilterSuratMasuk() {
        document.getElementById('search-surat-masuk').value = '';
        document.getElementById('filter-status-masuk').value = '';
        document.getElementById('filter-date-masuk').value = '';
        this.loadSuratMasukData();
    }

    searchSuratKeluar() {
        const searchValue = document.getElementById('search-surat-keluar')?.value || '';
        console.log('Search surat keluar:', searchValue);
    }

    globalSearch(query) {
        console.log('Global search:', query);
        router.navigate('surat-masuk', { search: query });
    }

    exportData(type) {
        this.showToast(`Mengexport data ${type}...`, 'info');
    }

    async generateReport(type) {
        try {
            const result = await api.generateReport(type);
            if (result.success) {
                this.showToast('Laporan berhasil digenerate', 'success');
            } else {
                this.showToast('Gagal mengenerate laporan', 'error');
            }
        } catch (error) {
            this.showToast('Gagal mengenerate laporan', 'error');
        }
    }

    async refreshDashboard() {
        await this.loadDashboardStats();
        this.showToast('Dashboard diperbarui', 'success');
    }

    async markAllNotificationsRead() {
        try {
            await api.markAllNotificationsRead();
            this.showToast('Semua notifikasi ditandai dibaca', 'success');
            this.loadNotifications();
        } catch (error) {
            this.showToast('Gagal memperbarui notifikasi', 'error');
        }
    }

    // ============================================
    // UI HELPERS
    // ============================================

    showModal() {
        const modal = document.getElementById('crud-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const modal = document.getElementById('crud-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    showFormError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    }

    setButtonLoading(button, isLoading) {
        if (!button) return;
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        } else {
            button.disabled = false;
            button.innerHTML = button.getAttribute('data-original-text') || button.innerHTML;
        }
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }

    formatDateTime(dateString) {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    }

    hideSpinner() {
        const spinner = document.getElementById('app-spinner');
        if (spinner) {
            spinner.classList.add('hidden');
            setTimeout(() => {
                spinner.style.display = 'none';
            }, 300);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating app instance...');
    window.app = new App();
    window.app.init();
});

// Global functions for backward compatibility
function closeModal() {
    if (window.app) window.app.closeModal();
}

function refreshDashboard() {
    if (window.app) window.app.refreshDashboard();
}

console.log('App script loaded');
