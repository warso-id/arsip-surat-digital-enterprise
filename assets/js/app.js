// app.js - Main Application (FIXED - All errors resolved)
class App {
    constructor() {
        this.version = CONFIG.APP_VERSION;
        this.currentRoute = null;
        this.isOnline = navigator.onLine;
        this.isLoading = false;
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
            
            // Check authentication and show appropriate page
            if (auth.isAuthenticated) {
                await this.navigateTo('dashboard');
            } else {
                this.showLandingPage();
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
            this.showLandingPage();
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
        
        // Process sync queue
        api.processSyncQueue().catch(e => {
            console.log('Sync queue processing failed:', e);
        });
        
        // Refresh current page if any
        if (this.currentRoute) {
            this.navigateTo(this.currentRoute, false);
        }
    }

    handleOffline() {
        this.isOnline = false;
        this.updateOfflineIndicator();
        this.showToast('Anda sedang offline', 'warning');
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
        
        try {
            switch(route) {
                case 'dashboard':
                    await this.showDashboard();
                    break;
                case 'surat-masuk':
                    this.showSuratMasuk();
                    break;
                case 'surat-keluar':
                    this.showSuratKeluar();
                    break;
                case 'disposisi':
                    this.showDisposisi();
                    break;
                case 'laporan':
                    this.showLaporan();
                    break;
                case 'pengguna':
                    this.showPengguna();
                    break;
                case 'instansi':
                    this.showInstansi();
                    break;
                case 'pengaturan':
                    this.showPengaturan();
                    break;
                default:
                    this.show404();
            }
        } catch (error) {
            console.error('Navigation error:', error);
        } finally {
            this.isLoading = false;
        }
    }

    // Page Renderers
    showLandingPage() {
        const container = document.getElementById('app-container');
        if (!container) {
            console.error('App container not found');
            return;
        }

        container.innerHTML = `
            <div class="landing-page">
                <div class="landing-container">
                    <div class="landing-header">
                        <div class="logo-placeholder">AS</div>
                        <h1>Arsip Surat Digital</h1>
                        <p class="subtitle">Sistem Manajemen Arsip Surat Enterprise 2026</p>
                        <span class="version">🚀 Version ${this.version}</span>
                        <br><br>
                        <button class="btn-landing btn-login" onclick="window.app.showLoginForm()">
                            <i class="fas fa-sign-in-alt"></i> Masuk
                        </button>
                        <button class="btn-landing btn-register" onclick="window.app.showRegisterForm()">
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
                        <p>&copy; 2026 Arsip Surat Digital Enterprise v${this.version}</p>
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
        if (!container) return;

        container.innerHTML = `
            <div class="dashboard-page">
                <header class="app-header">
                    <div class="header-container">
                        <div class="header-left">
                            <button class="menu-toggle" onclick="window.app.toggleSidebar()">
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
                                <span>${auth.user?.fullName || auth.user?.username || 'User'}</span>
                                <button onclick="window.app.logout()" class="btn btn-secondary btn-sm">
                                    <i class="fas fa-sign-out-alt"></i> Keluar
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
                
                <div class="main-layout">
                    <aside class="sidebar">
                        <nav>
                            <a href="#" onclick="window.app.navigateTo('dashboard')" class="nav-link active" data-section="dashboard">
                                <i class="fas fa-chart-pie"></i> Dashboard
                            </a>
                            <a href="#" onclick="window.app.navigateTo('surat-masuk')" class="nav-link" data-section="surat-masuk">
                                <i class="fas fa-inbox"></i> Surat Masuk
                            </a>
                            <a href="#" onclick="window.app.navigateTo('surat-keluar')" class="nav-link" data-section="surat-keluar">
                                <i class="fas fa-paper-plane"></i> Surat Keluar
                            </a>
                            <a href="#" onclick="window.app.navigateTo('disposisi')" class="nav-link" data-section="disposisi">
                                <i class="fas fa-clipboard-list"></i> Disposisi
                            </a>
                            <a href="#" onclick="window.app.navigateTo('laporan')" class="nav-link" data-section="laporan">
                                <i class="fas fa-chart-bar"></i> Laporan
                            </a>
                        </nav>
                    </aside>
                    
                    <main class="main-content">
                        <div class="dashboard-container">
                            <div class="page-header">
                                <h2><i class="fas fa-chart-pie"></i> Dashboard</h2>
                                <div class="header-actions">
                                    <span>${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    <button onclick="window.app.refreshDashboard()" class="btn btn-primary btn-sm">
                                        <i class="fas fa-sync-alt"></i> Refresh
                                    </button>
                                </div>
                            </div>
                            
                            <div class="stats-grid" id="dashboard-stats">
                                <div style="text-align: center; padding: 50px;">
                                    <i class="fas fa-spinner fa-spin"></i> Memuat data...
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
            console.error('Error loading stats:', error);
            this.renderDashboardStats(this.getDefaultStats());
        }
    }

    getDefaultStats() {
        return {
            totalSuratMasuk: 0,
            totalSuratKeluar: 0,
            totalDisposisi: 0,
            pendingDisposisi: 0
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

    // Simple page placeholders
    showSuratMasuk() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="page-header">
                    <h2><i class="fas fa-inbox"></i> Surat Masuk</h2>
                    <button class="btn btn-primary"><i class="fas fa-plus"></i> Tambah Surat</button>
                </div>
                <p>Halaman manajemen surat masuk akan ditampilkan disini.</p>
            `;
        }
    }

    showSuratKeluar() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="page-header">
                    <h2><i class="fas fa-paper-plane"></i> Surat Keluar</h2>
                    <button class="btn btn-primary"><i class="fas fa-plus"></i> Tambah Surat</button>
                </div>
                <p>Halaman manajemen surat keluar akan ditampilkan disini.</p>
            `;
        }
    }

    showDisposisi() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h2>Disposisi</h2><p>Halaman disposisi akan ditampilkan disini.</p>';
        }
    }

    showLaporan() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h2>Laporan</h2><p>Halaman laporan akan ditampilkan disini.</p>';
        }
    }

    showPengguna() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h2>Pengguna</h2><p>Halaman manajemen pengguna akan ditampilkan disini.</p>';
        }
    }

    showInstansi() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h2>Instansi</h2><p>Halaman data instansi akan ditampilkan disini.</p>';
        }
    }

    showPengaturan() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h2>Pengaturan</h2><p>Halaman pengaturan akan ditampilkan disini.</p>';
        }
    }

    show404() {
        const container = document.getElementById('app-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 100px 20px;">
                    <h1 style="font-size: 72px; color: #1a73e8;">404</h1>
                    <h3>Halaman Tidak Ditemukan</h3>
                    <button class="btn btn-primary" onclick="window.app.navigateTo('dashboard')">
                        <i class="fas fa-home"></i> Kembali ke Dashboard
                    </button>
                </div>
            `;
        }
    }

    // Auth Forms
    showLoginForm() {
        auth.showLoginForm();
    }

    showRegisterForm() {
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const saveBtn = document.getElementById('modal-save-btn');
        
        if (!modalBody) return;
        
        if (modalTitle) modalTitle.textContent = 'Registrasi Pengguna Baru';
        
        modalBody.innerHTML = `
            <form onsubmit="event.preventDefault(); window.app.handleRegister()">
                <div class="form-group">
                    <label>Nama Lengkap</label>
                    <input type="text" id="reg-fullname" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="reg-email" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="reg-password" class="form-control" required minlength="6">
                </div>
                <div class="form-group">
                    <label>Konfirmasi Password</label>
                    <input type="password" id="reg-confirm-password" class="form-control" required minlength="6">
                </div>
                <div id="register-error" class="alert alert-error" style="display: none;"></div>
            </form>
        `;
        
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-user-plus"></i> Daftar';
            saveBtn.onclick = () => this.handleRegister();
        }
        
        this.showModal();
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
                this.showToast('Login berhasil!', 'success');
                await this.navigateTo('dashboard');
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
        const email = document.getElementById('reg-email')?.value;
        const password = document.getElementById('reg-password')?.value;
        const confirmPassword = document.getElementById('reg-confirm-password')?.value;
        const errorDiv = document.getElementById('register-error');
        
        if (password !== confirmPassword) {
            if (errorDiv) {
                errorDiv.textContent = 'Password tidak cocok';
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
            const result = await auth.register({ fullname, email, password });
            
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
