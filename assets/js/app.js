// app.js - Main Application Class (FULLY FIXED)
class App {
    constructor() {
        this.version = CONFIG.APP_VERSION;
        this.currentRoute = null;
        this.isOnline = navigator.onLine;
        this.isLoading = false;
        this.initTime = Date.now();
    }

    async init() {
        try {
            console.log('Initializing Enterprise App v' + this.version);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Check online status
            await this.checkOnlineStatus();
            
            // Check authentication
            if (auth.isAuthenticated) {
                await this.showDashboard();
            } else {
                this.showLandingPage();
            }
            
            // Process any pending sync queue
            if (this.isOnline) {
                await api.processSyncQueue();
            }
            
            // Register service worker
            this.registerServiceWorker();
            
            // Hide loading spinner
            this.hideSpinner();
            
            console.log('App initialized successfully in', Date.now() - this.initTime, 'ms');
            
        } catch (error) {
            console.error('App initialization error:', error);
            this.showToast('Gagal menginisialisasi aplikasi', 'error');
            this.hideSpinner();
        }
    }

    setupEventListeners() {
        // Online/Offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Handle browser back/forward
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.route) {
                this.navigateTo(event.state.route, false);
            }
        });
        
        // Close modals on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
        
        // Global click handler for closing dropdowns
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown-menu') && !e.target.closest('[data-toggle="dropdown"]')) {
                this.closeAllDropdowns();
            }
        });
    }

    async checkOnlineStatus() {
        this.isOnline = navigator.onLine;
        this.updateOfflineIndicator();
        
        // Update sync status
        if (this.isOnline) {
            await api.processSyncQueue();
        }
        
        return this.isOnline;
    }

    updateOfflineIndicator() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            if (this.isOnline) {
                indicator.classList.remove('show');
                setTimeout(() => {
                    if (indicator.classList.contains('show') === false) {
                        indicator.style.display = 'none';
                    }
                }, 300);
            } else {
                indicator.style.display = 'block';
                setTimeout(() => indicator.classList.add('show'), 10);
            }
        }
    }

    handleOnline() {
        this.isOnline = true;
        this.updateOfflineIndicator();
        this.showToast('Koneksi internet tersedia', 'success');
        api.processSyncQueue();
        this.refreshCurrentPage();
    }

    handleOffline() {
        this.isOnline = false;
        this.updateOfflineIndicator();
        this.showToast('Anda sedang offline', 'warning');
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js', {
                    scope: '/'
                });
                console.log('Service Worker registered:', registration.scope);
                
                // Setup background sync
                if ('SyncManager' in window) {
                    await registration.sync.register('sync-queue');
                }
            } catch (error) {
                console.warn('Service Worker registration failed:', error);
            }
        }
    }

    // Navigation
    async navigateTo(route, addToHistory = true) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.currentRoute = route;
        
        // Update browser history
        if (addToHistory) {
            history.pushState({ route: route }, '', `#${route}`);
        }
        
        // Update active menu
        this.updateActiveMenu(route);
        
        try {
            switch(route) {
                case CONFIG.ROUTES.DASHBOARD:
                    await this.showDashboard();
                    break;
                case CONFIG.ROUTES.SURAT_MASUK:
                    await this.showSuratMasuk();
                    break;
                case CONFIG.ROUTES.SURAT_KELUAR:
                    await this.showSuratKeluar();
                    break;
                case CONFIG.ROUTES.DISPOSISI:
                    await this.showDisposisi();
                    break;
                case CONFIG.ROUTES.LAPORAN:
                    await this.showLaporan();
                    break;
                case CONFIG.ROUTES.PENGGUNA:
                    await this.showPengguna();
                    break;
                case CONFIG.ROUTES.INSTANSI:
                    await this.showInstansi();
                    break;
                case CONFIG.ROUTES.PENGATURAN:
                    await this.showPengaturan();
                    break;
                case CONFIG.ROUTES.PROFILE:
                    await this.showProfile();
                    break;
                default:
                    this.show404();
            }
        } catch (error) {
            console.error(`Navigation error to ${route}:`, error);
            this.showError('Gagal memuat halaman');
        } finally {
            this.isLoading = false;
        }
    }

    updateActiveMenu(route) {
        // Remove all active states
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Set active for current route
        const activeLink = document.querySelector(`[data-section="${route}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Page Renderers
    showLandingPage() {
        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div class="landing-page">
                <div class="landing-container">
                    <div class="landing-header">
                        <div class="logo-placeholder">AS</div>
                        <h1>Arsip Surat Digital</h1>
                        <p class="subtitle">Sistem Manajemen Arsip Surat Enterprise 2026</p>
                        <span class="version">🚀 Version ${this.version}</span>
                        <br><br>
                        <button class="btn-landing btn-login" onclick="app.showLoginForm()">
                            <i class="fas fa-sign-in-alt"></i> Masuk
                        </button>
                        <button class="btn-landing btn-register" onclick="app.showRegisterForm()">
                            <i class="fas fa-user-plus"></i> Daftar
                        </button>
                    </div>
                    
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">📥</div>
                            <h3>Manajemen Surat Masuk</h3>
                            <p>Kelola surat masuk dengan mudah, lengkap dengan tracking status dan disposisi otomatis.</p>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">📤</div>
                            <h3>Manajemen Surat Keluar</h3>
                            <p>Buat dan kelola surat keluar dengan template dinamis dan export ke berbagai format.</p>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">📋</div>
                            <h3>Sistem Disposisi</h3>
                            <p>Disposisi multi-level dengan notifikasi real-time dan tracking status lengkap.</p>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">📊</div>
                            <h3>Dashboard & Laporan</h3>
                            <p>Dashboard interaktif dengan grafik dan laporan yang dapat diexport ke Excel/PDF.</p>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">📱</div>
                            <h3>PWA Support</h3>
                            <p>Aplikasi dapat diinstall di mobile dan digunakan secara offline dengan sinkronisasi otomatis.</p>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">🔒</div>
                            <h3>Keamanan Enterprise</h3>
                            <p>Enkripsi Base64, JWT authentication, role-based access, dan audit logging lengkap.</p>
                        </div>
                    </div>
                    
                    <div class="footer-landing">
                        <p>&copy; 2026 Arsip Surat Digital Enterprise v${this.version} | 
                           <a href="#"><i class="fab fa-github"></i> GitHub</a> | 
                           <a href="#"><i class="fas fa-envelope"></i> Contact</a>
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    async showDashboard() {
        if (!auth.isAuthenticated) {
            this.showLandingPage();
            return;
        }

        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div class="dashboard-page">
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
                        <div class="header-right">
                            <div class="user-info">
                                <span id="user-name-display">${auth.user?.fullName || auth.user?.username || 'User'}</span>
                                <button onclick="app.logout()" class="btn btn-sm btn-secondary">
                                    <i class="fas fa-sign-out-alt"></i> Keluar
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
                
                <div class="main-layout">
                    <aside class="sidebar">
                        <nav>
                            <a href="#" onclick="app.navigateTo('dashboard')" class="nav-link active" data-section="dashboard">
                                <i class="fas fa-chart-pie"></i> Dashboard
                            </a>
                            <a href="#" onclick="app.navigateTo('surat-masuk')" class="nav-link" data-section="surat-masuk">
                                <i class="fas fa-inbox"></i> Surat Masuk
                            </a>
                            <a href="#" onclick="app.navigateTo('surat-keluar')" class="nav-link" data-section="surat-keluar">
                                <i class="fas fa-paper-plane"></i> Surat Keluar
                            </a>
                            <a href="#" onclick="app.navigateTo('disposisi')" class="nav-link" data-section="disposisi">
                                <i class="fas fa-clipboard-list"></i> Disposisi
                            </a>
                            <a href="#" onclick="app.navigateTo('laporan')" class="nav-link" data-section="laporan">
                                <i class="fas fa-chart-bar"></i> Laporan
                            </a>
                            <hr>
                            <a href="#" onclick="app.navigateTo('pengguna')" class="nav-link" data-section="pengguna">
                                <i class="fas fa-users"></i> Pengguna
                            </a>
                            <a href="#" onclick="app.navigateTo('instansi')" class="nav-link" data-section="instansi">
                                <i class="fas fa-building"></i> Instansi
                            </a>
                            <a href="#" onclick="app.navigateTo('pengaturan')" class="nav-link" data-section="pengaturan">
                                <i class="fas fa-cog"></i> Pengaturan
                            </a>
                        </nav>
                    </aside>
                    
                    <main class="main-content" id="main-content">
                        <div class="dashboard-container">
                            <div class="page-header">
                                <h2><i class="fas fa-chart-pie"></i> Dashboard</h2>
                                <div class="header-actions">
                                    <span id="current-date">${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    <button onclick="app.refreshDashboard()" class="btn btn-primary btn-sm">
                                        <i class="fas fa-sync-alt"></i> Refresh
                                    </button>
                                </div>
                            </div>
                            
                            <div class="stats-grid" id="dashboard-stats">
                                <div class="text-center p-5">
                                    <i class="fas fa-spinner fa-spin"></i> Memuat statistik...
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        `;

        // Load dashboard stats
        this.loadDashboardStats();
    }

    async loadDashboardStats() {
        try {
            const result = await api.getDashboardStats();
            const stats = result.success ? result.data : this.getDefaultStats();
            this.renderDashboardStats(stats);
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            this.renderDashboardStats(this.getDefaultStats());
        }
    }

    getDefaultStats() {
        return {
            totalSuratMasuk: 0,
            totalSuratKeluar: 0,
            totalDisposisi: 0,
            pendingDisposisi: 0,
            totalPengguna: 0,
            recentActivities: []
        };
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

    async refreshDashboard() {
        await this.loadDashboardStats();
        this.showToast('Dashboard diperbarui', 'success');
    }

    async refreshCurrentPage() {
        if (this.currentRoute) {
            await this.navigateTo(this.currentRoute, false);
        }
    }

    // Auth Forms
    showLoginForm() {
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const saveBtn = document.getElementById('modal-save-btn');
        
        modalTitle.textContent = 'Masuk ke Sistem';
        modalBody.innerHTML = `
            <form id="login-form" onsubmit="event.preventDefault(); app.handleLogin()">
                <div class="form-group">
                    <label><i class="fas fa-envelope"></i> Email</label>
                    <input type="email" id="login-email" class="form-control" 
                           placeholder="Masukkan email" required autocomplete="email">
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
            </form>
        `;
        
        saveBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
        saveBtn.onclick = () => app.handleLogin();
        
        this.showModal();
        
        // Focus on email input after modal is shown
        setTimeout(() => {
            const emailInput = document.getElementById('login-email');
            if (emailInput) emailInput.focus();
        }, 100);
    }

    showRegisterForm() {
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const saveBtn = document.getElementById('modal-save-btn');
        
        modalTitle.textContent = 'Registrasi Pengguna Baru';
        modalBody.innerHTML = `
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
            </form>
        `;
        
        saveBtn.innerHTML = '<i class="fas fa-user-plus"></i> Daftar';
        saveBtn.onclick = () => app.handleRegister();
        
        this.showModal();
        
        setTimeout(() => {
            const nameInput = document.getElementById('reg-fullname');
            if (nameInput) nameInput.focus();
        }, 100);
    }

    async handleLogin() {
        const email = document.getElementById('login-email')?.value;
        const password = document.getElementById('login-password')?.value;
        const remember = document.getElementById('login-remember')?.checked;
        const errorDiv = document.getElementById('login-error');
        
        if (!email || !password) {
            if (errorDiv) {
                errorDiv.textContent = 'Email dan password wajib diisi';
                errorDiv.style.display = 'block';
            }
            return;
        }
        
        const saveBtn = document.getElementById('modal-save-btn');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
            saveBtn.disabled = true;
        }
        
        try {
            const result = await auth.login(email, password, remember);
            
            if (result.success) {
                this.closeModal();
                this.showToast('Login berhasil! Selamat datang.', 'success');
                await this.showDashboard();
            } else {
                if (errorDiv) {
                    errorDiv.textContent = result.message || 'Login gagal';
                    errorDiv.style.display = 'block';
                }
                if (saveBtn) {
                    saveBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
                    saveBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            if (errorDiv) {
                errorDiv.textContent = 'Gagal terhubung ke server';
                errorDiv.style.display = 'block';
            }
            if (saveBtn) {
                saveBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
                saveBtn.disabled = false;
            }
        }
    }

    async handleRegister() {
        const fullname = document.getElementById('reg-fullname')?.value;
        const username = document.getElementById('reg-username')?.value;
        const email = document.getElementById('reg-email')?.value;
        const password = document.getElementById('reg-password')?.value;
        const confirmPassword = document.getElementById('reg-confirm-password')?.value;
        const errorDiv = document.getElementById('register-error');
        
        if (!fullname || !username || !email || !password) {
            if (errorDiv) {
                errorDiv.textContent = 'Semua field wajib diisi';
                errorDiv.style.display = 'block';
            }
            return;
        }
        
        if (password !== confirmPassword) {
            if (errorDiv) {
                errorDiv.textContent = 'Password tidak cocok';
                errorDiv.style.display = 'block';
            }
            return;
        }
        
        if (password.length < 6) {
            if (errorDiv) {
                errorDiv.textContent = 'Password minimal 6 karakter';
                errorDiv.style.display = 'block';
            }
            return;
        }
        
        const saveBtn = document.getElementById('modal-save-btn');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
            saveBtn.disabled = true;
        }
        
        try {
            const result = await auth.register({
                fullname,
                username,
                email,
                password
            });
            
            if (result.success) {
                this.closeModal();
                this.showToast('Registrasi berhasil! Silakan login.', 'success');
                this.showLoginForm();
            } else {
                if (errorDiv) {
                    errorDiv.textContent = result.message || 'Registrasi gagal';
                    errorDiv.style.display = 'block';
                }
                if (saveBtn) {
                    saveBtn.innerHTML = '<i class="fas fa-user-plus"></i> Daftar';
                    saveBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('Register error:', error);
            if (errorDiv) {
                errorDiv.textContent = 'Gagal terhubung ke server';
                errorDiv.style.display = 'block';
            }
            if (saveBtn) {
                saveBtn.innerHTML = '<i class="fas fa-user-plus"></i> Daftar';
                saveBtn.disabled = false;
            }
        }
    }

    async logout() {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            await auth.logout();
            this.showLandingPage();
            this.showToast('Anda telah logout', 'info');
        }
    }

    // Other pages (simplified)
    async showSuratMasuk() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h2>Surat Masuk</h2><p>Halaman surat masuk akan ditampilkan disini.</p>';
        }
    }

    async showSuratKeluar() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h2>Surat Keluar</h2><p>Halaman surat keluar akan ditampilkan disini.</p>';
        }
    }

    async showDisposisi() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h2>Disposisi</h2><p>Halaman disposisi akan ditampilkan disini.</p>';
        }
    }

    async showLaporan() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h2>Laporan</h2><p>Halaman laporan akan ditampilkan disini.</p>';
        }
    }

    async showPengguna() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h2>Pengguna</h2><p>Halaman manajemen pengguna akan ditampilkan disini.</p>';
        }
    }

    async showInstansi() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h2>Instansi</h2><p>Halaman data instansi akan ditampilkan disini.</p>';
        }
    }

    async showPengaturan() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h2>Pengaturan</h2><p>Halaman pengaturan akan ditampilkan disini.</p>';
        }
    }

    async showProfile() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h2>Profil</h2><p>Halaman profil akan ditampilkan disini.</p>';
        }
    }

    show404() {
        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div style="text-align: center; padding: 100px 20px;">
                <h1 style="font-size: 72px; color: #1a73e8;">404</h1>
                <h3>Halaman Tidak Ditemukan</h3>
                <p>Maaf, halaman yang Anda cari tidak tersedia.</p>
                <button class="btn btn-primary" onclick="app.navigateTo('dashboard')">
                    <i class="fas fa-home"></i> Kembali ke Dashboard
                </button>
            </div>
        `;
    }

    showError(message) {
        const container = document.getElementById('app-container');
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

    // Modal Management
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

    closeAllDropdowns() {
        document.querySelectorAll('.dropdown-menu.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }

    // Toast Notifications
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

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
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

// Close modal when clicking overlay
document.addEventListener('click', function(e) {
    if (e.target.id === 'crud-modal') {
        window.app?.closeModal();
    }
});

// Global function untuk backward compatibility
function closeModal() {
    if (window.app) window.app.closeModal();
}

function showLoginForm() {
    if (window.app) window.app.showLoginForm();
}

function showRegisterForm() {
    if (window.app) window.app.showRegisterForm();
}

function refreshDashboard() {
    if (window.app) window.app.refreshDashboard();
}

console.log('App class loaded');
