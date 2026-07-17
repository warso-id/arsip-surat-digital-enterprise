// Main Application Class
class EnterpriseCRUDApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.isOnline = navigator.onLine;
        this.init();
    }

    async init() {
        try {
            // Check authentication
            if (!authService.checkAuth()) {
                return;
            }

            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize components
            this.initializeComponents();
            
            // Check online status
            await this.checkOnlineStatus();
            
            // Show dashboard by default
            this.showDashboard();
            
            // Sync offline data if online
            if (this.isOnline) {
                this.syncOfflineData();
            }

            console.log('Enterprise CRUD App initialized successfully');
        } catch (error) {
            console.error('App initialization error:', error);
            this.showNotification('Gagal menginisialisasi aplikasi', 'error');
        }
    }

    setupEventListeners() {
        // Online/Offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Menu toggle for mobile
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // User menu toggle
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserMenu();
            });
        }

        // Close dropdowns on outside click
        document.addEventListener('click', () => {
            this.closeAllDropdowns();
        });

        // Handle service worker
        if ('serviceWorker' in navigator) {
            this.registerServiceWorker();
        }
    }

    async checkOnlineStatus() {
        this.isOnline = navigator.onLine;
        const offlineIndicator = document.getElementById('offlineIndicator');
        
        if (offlineIndicator) {
            if (this.isOnline) {
                offlineIndicator.style.display = 'none';
            } else {
                offlineIndicator.style.display = 'flex';
            }
        }

        // Update user info if online
        if (this.isOnline && authService.isAuthenticated) {
            const user = authService.getUser();
            if (user) {
                this.updateUserInfo(user);
            }
        }
    }

    initializeComponents() {
        // Set user info in header
        const user = authService.getUser();
        if (user) {
            this.updateUserInfo(user);
        }
    }

    updateUserInfo(user) {
        const userNameDisplay = document.getElementById('userNameDisplay');
        if (userNameDisplay) {
            userNameDisplay.textContent = user.fullName || user.username || 'Pengguna';
        }
    }

    handleOnline() {
        this.isOnline = true;
        this.showNotification('Koneksi internet tersedia', 'success');
        this.syncOfflineData();
    }

    handleOffline() {
        this.isOnline = false;
        this.showNotification('Anda sedang offline', 'warning');
    }

    async syncOfflineData() {
        try {
            await apiService.syncOfflineData();
        } catch (error) {
            console.error('Sync error:', error);
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('active');
    }

    toggleUserMenu() {
        const dropdown = document.getElementById('dropdownMenu');
        dropdown.classList.toggle('active');
    }

    closeAllDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown-menu');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }

    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered:', registration);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }

    // Navigation methods
    showDashboard() {
        this.currentPage = 'dashboard';
        this.loadPage('dashboard');
        this.updateActiveMenu('dashboard');
    }

    showSuratMasuk() {
        this.currentPage = 'surat-masuk';
        this.loadPage('surat-masuk');
        this.updateActiveMenu('surat-masuk');
    }

    showSuratKeluar() {
        this.currentPage = 'surat-keluar';
        this.loadPage('surat-keluar');
        this.updateActiveMenu('surat-keluar');
    }

    showDisposisi() {
        this.currentPage = 'disposisi';
        this.loadPage('disposisi');
        this.updateActiveMenu('disposisi');
    }

    showKategori() {
        this.currentPage = 'kategori';
        this.loadPage('kategori');
        this.updateActiveMenu('kategori');
    }

    showInstansi() {
        this.currentPage = 'instansi';
        this.loadPage('instansi');
        this.updateActiveMenu('instansi');
    }

    showLaporan() {
        this.currentPage = 'laporan';
        this.loadPage('laporan');
        this.updateActiveMenu('laporan');
    }

    showPengguna() {
        this.currentPage = 'pengguna';
        this.loadPage('pengguna');
        this.updateActiveMenu('pengguna');
    }

    showProfile() {
        this.loadPage('profile');
    }

    showSettings() {
        this.loadPage('settings');
    }

    updateActiveMenu(page) {
        // Remove active class from all menu items
        const menuItems = document.querySelectorAll('.sidebar-nav a');
        menuItems.forEach(item => item.classList.remove('active'));

        // Add active class to current page
        const activeLink = document.querySelector(`[onclick*="${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    async loadPage(page) {
        const mainContent = document.getElementById('mainContent');
        
        // Show loading spinner
        mainContent.innerHTML = this.getSpinnerHTML();

        try {
            switch(page) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'surat-masuk':
                    await this.loadSuratMasuk();
                    break;
                case 'surat-keluar':
                    await this.loadSuratKeluar();
                    break;
                case 'disposisi':
                    await this.loadDisposisi();
                    break;
                case 'kategori':
                    await this.loadKategori();
                    break;
                case 'instansi':
                    await this.loadInstansi();
                    break;
                case 'laporan':
                    await this.loadLaporan();
                    break;
                case 'pengguna':
                    await this.loadPengguna();
                    break;
                case 'profile':
                    await this.loadProfile();
                    break;
                case 'settings':
                    await this.loadSettings();
                    break;
                default:
                    this.show404();
            }
        } catch (error) {
            console.error('Page load error:', error);
            mainContent.innerHTML = this.getErrorHTML('Gagal memuat halaman');
        }
    }

    // Load specific pages
    async loadDashboard() {
        const stats = await this.getDashboardStats();
        dashboardRenderer.render(stats);
    }

    async loadSuratMasuk() {
        suratRenderer.renderSuratMasuk();
    }

    async loadSuratKeluar() {
        suratRenderer.renderSuratKeluar();
    }

    async loadDisposisi() {
        disposisiRenderer.render();
    }

    async loadKategori() {
        const categories = await apiService.getKategori();
        this.renderKategoriPage(categories);
    }

    async loadInstansi() {
        const instansi = await apiService.getInstansi();
        this.renderInstansiPage(instansi);
    }

    async loadLaporan() {
        laporanRenderer.render();
    }

    async loadPengguna() {
        const users = await apiService.getPengguna();
        this.renderPenggunaPage(users);
    }

    async loadProfile() {
        const user = authService.getUser();
        this.renderProfilePage(user);
    }

    async loadSettings() {
        this.renderSettingsPage();
    }

    // Dashboard Stats
    async getDashboardStats() {
        try {
            const result = await apiService.getDashboardStats();
            return result.success ? result.data : this.getDefaultStats();
        } catch (error) {
            return this.getDefaultStats();
        }
    }

    getDefaultStats() {
        return {
            totalSuratMasuk: 0,
            totalSuratKeluar: 0,
            totalDisposisi: 0,
            pendingDisposisi: 0,
            recentActivities: []
        };
    }

    // Render methods for other pages
    renderKategoriPage(data) {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-tags"></i> Manajemen Kategori</h2>
                <button class="btn btn-primary" onclick="showAddKategoriForm()">
                    <i class="fas fa-plus"></i> Tambah Kategori
                </button>
            </div>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Nama Kategori</th>
                            <th>Deskripsi</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data && data.length > 0 ? 
                            data.map((item, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${item.nama}</td>
                                    <td>${item.deskripsi || '-'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="editKategori('${item.id}')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteKategori('${item.id}')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('') :
                            '<tr><td colspan="4" class="text-center">Tidak ada data</td></tr>'
                        }
                    </tbody>
                </table>
            </div>
        `;
    }

    renderInstansiPage(data) {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-building"></i> Data Instansi</h2>
                <button class="btn btn-primary" onclick="showAddInstansiForm()">
                    <i class="fas fa-plus"></i> Tambah Instansi
                </button>
            </div>
            <div class="table-responsive">
                <table class="table">
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
                        ${data && data.length > 0 ? 
                            data.map((item, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${item.nama}</td>
                                    <td>${item.alamat || '-'}</td>
                                    <td>${item.telepon || '-'}</td>
                                    <td>${item.email || '-'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="editInstansi('${item.id}')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteInstansi('${item.id}')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('') :
                            '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>'
                        }
                    </tbody>
                </table>
            </div>
        `;
    }

    renderPenggunaPage(data) {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-users"></i> Manajemen Pengguna</h2>
                <button class="btn btn-primary" onclick="showAddUserForm()">
                    <i class="fas fa-user-plus"></i> Tambah Pengguna
                </button>
            </div>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Username</th>
                            <th>Nama Lengkap</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data && data.length > 0 ? 
                            data.map((item, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${item.username}</td>
                                    <td>${item.fullName || '-'}</td>
                                    <td>${item.email || '-'}</td>
                                    <td><span class="badge badge-info">${item.role}</span></td>
                                    <td><span class="badge ${item.active ? 'badge-success' : 'badge-danger'}">
                                        ${item.active ? 'Aktif' : 'Nonaktif'}
                                    </span></td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="editUser('${item.id}')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteUser('${item.id}')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('') :
                            '<tr><td colspan="7" class="text-center">Tidak ada data</td></tr>'
                        }
                    </tbody>
                </table>
            </div>
        `;
    }

    renderProfilePage(user) {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="profile-container">
                <div class="profile-header">
                    <h2><i class="fas fa-user"></i> Profil Pengguna</h2>
                </div>
                <div class="profile-content">
                    <div class="profile-avatar">
                        <img src="assets/images/default-avatar.png" alt="Avatar" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'50\' fill=\'%23ccc\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'white\' font-size=\'40\'%3EU%3C/text%3E%3C/svg%3E'">
                    </div>
                    <div class="profile-info">
                        <p><strong>Username:</strong> ${user.username}</p>
                        <p><strong>Nama Lengkap:</strong> ${user.fullName || '-'}</p>
                        <p><strong>Email:</strong> ${user.email || '-'}</p>
                        <p><strong>Role:</strong> ${user.role || '-'}</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderSettingsPage() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="settings-container">
                <div class="settings-header">
                    <h2><i class="fas fa-cog"></i> Pengaturan Sistem</h2>
                </div>
                <div class="settings-content">
                    <p>Fitur pengaturan sedang dalam pengembangan.</p>
                </div>
            </div>
        `;
    }

    // Utility methods
    getSpinnerHTML() {
        return `
            <div class="loading-container">
                <div class="spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Memuat data...</p>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="error-container">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Muat Ulang
                </button>
            </div>
        `;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    getNotificationIcon(type) {
        switch(type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }

    show404() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="error-404">
                <h1>404</h1>
                <h3>Halaman Tidak Ditemukan</h3>
                <p>Maaf, halaman yang Anda cari tidak tersedia.</p>
                <button class="btn btn-primary" onclick="app.showDashboard()">
                    <i class="fas fa-home"></i> Kembali ke Dashboard
                </button>
            </div>
        `;
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new EnterpriseCRUDApp();
});

// Make app globally accessible
window.app = app;
