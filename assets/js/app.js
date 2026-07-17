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
        const
