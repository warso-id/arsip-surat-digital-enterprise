/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Main Application Bootstrap
 * ============================================================
 * Initializes all modules and establishes connections
 * between all pages and Google Apps Script
 * ============================================================
 */

(function(global) {
    'use strict';

    // ==================== APPLICATION CONFIGURATION ====================
    const APP_CONFIG = {
        version: '3.0.0',
        buildDate: '2024-01-20',
        environment: 'production',
        debug: false,
        
        // Google Apps Script Connection
        gas: {
            url: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
            timeout: 30000,
            retries: 3,
            useBase64: true,
        },
        
        // Page Routes
        pages: {
            landing: '/index.html',
            login: '/login.html',
            dashboard: '/dashboard.html',
            suratMasuk: '/surat-masuk.html',
            suratKeluar: '/surat-keluar.html',
            disposisi: '/disposisi.html',
            laporan: '/laporan.html',
            admin: '/admin.html',
            profile: '/profile.html',
            error: '/404.html',
            offline: '/offline.html',
        },
        
        // API Endpoints
        api: {
            auth: 'auth',
            suratMasuk: 'surat-masuk',
            suratKeluar: 'surat-keluar',
            disposisi: 'disposisi',
            laporan: 'laporan',
            dashboard: 'dashboard',
            users: 'users',
            system: 'system',
        },
    };

    // ==================== APPLICATION CLASS ====================
    class Application {
        constructor() {
            this.version = APP_CONFIG.version;
            this.modules = new Map();
            this.initialized = false;
            this.startTime = Date.now();
            this.pageReady = false;
        }

        /**
         * Initialize the entire application
         */
        async init() {
            if (this.initialized) return this;
            
            console.log(`🚀 Initializing Arsip Surat Digital Enterprise v${this.version}...`);
            console.log('📡 Google Apps Script URL:', APP_CONFIG.gas.url);
            console.log('🔐 Base64 Encoding:', APP_CONFIG.gas.useBase64 ? 'ENABLED' : 'DISABLED');
            
            try {
                // Phase 1: Core Systems
                await this.initCore();
                
                // Phase 2: Services
                await this.initServices();
                
                // Phase 3: UI Components
                await this.initUI();
                
                // Phase 4: Page-specific logic
                await this.initCurrentPage();
                
                // Phase 5: Post-initialization
                await this.postInit();
                
                this.initialized = true;
                const initTime = Date.now() - this.startTime;
                
                console.log(`✅ Application initialized in ${initTime}ms`);
                console.log(`📄 Current page: ${this.getCurrentPage()}`);
                console.log(`👤 Auth status: ${this.isAuthenticated() ? 'Logged in' : 'Guest'}`);
                console.log(`🌐 Online status: ${navigator.onLine ? 'Online' : 'Offline'}`);
                
                // Dispatch ready event
                this.dispatchEvent('app:ready', { initTime });
                
                return this;
                
            } catch (error) {
                console.error('❌ Application initialization failed:', error);
                this.handleInitError(error);
                throw error;
            }
        }

        /**
         * Initialize core systems
         */
        async initCore() {
            console.log('📦 Phase 1: Initializing core systems...');
            
            // Initialize Enterprise Core if available
            if (global.EnterpriseCore && !global.EnterpriseCore.initialized) {
                await global.EnterpriseCore.initialize();
                this.modules.set('core', global.EnterpriseCore);
                console.log('  ✓ Enterprise Core initialized');
            }
            
            // Initialize Base64 system
            if (!global.EnterpriseBase64 && global.EnterpriseCore?.base64) {
                global.EnterpriseBase64 = global.EnterpriseCore.base64;
            }
            
            // Test Base64 encoding
            const testData = { test: 'Arsip Surat Digital Enterprise v3.0.0' };
            const encoded = global.EnterpriseBase64?.encodeObject(testData);
            if (encoded) {
                const decoded = global.EnterpriseBase64?.decodeObject(encoded);
                console.log('  ✓ Base64 encoding system: ACTIVE');
            }
        }

        /**
         * Initialize services
         */
        async initServices() {
            console.log('📦 Phase 2: Initializing services...');
            
            // Initialize API handler
            if (global.GASAPI) {
                this.modules.set('api', global.GASAPI);
                console.log('  ✓ Google Apps Script API ready');
            }
            
            // Initialize database
            if (global.EnterpriseDB) {
                await global.EnterpriseDB.init();
                this.modules.set('db', global.EnterpriseDB);
                console.log('  ✓ IndexedDB ready');
            }
            
            // Initialize authentication
            if (global.EnterpriseAuth) {
                this.modules.set('auth', global.EnterpriseAuth);
                console.log('  ✓ Authentication system ready');
            }
            
            // Initialize cache
            if (global.EnterpriseCache) {
                this.modules.set('cache', global.EnterpriseCache);
                console.log('  ✓ Cache system ready');
            }
            
            // Initialize notifications
            if (global.EnterpriseRealtime) {
                this.modules.set('realtime', global.EnterpriseRealtime);
                console.log('  ✓ Notification system ready');
            }
            
            // Initialize monitoring
            if (global.EnterpriseMonitor) {
                this.modules.set('monitor', global.EnterpriseMonitor);
                console.log('  ✓ Monitoring system ready');
            }
        }

        /**
         * Initialize UI components
         */
        async initUI() {
            console.log('📦 Phase 3: Initializing UI components...');
            
            // Initialize theme
            if (global.EnterpriseTheme) {
                this.modules.set('theme', global.EnterpriseTheme);
                console.log('  ✓ Theme manager ready');
            }
            
            // Initialize i18n
            if (global.EnterpriseI18n) {
                global.EnterpriseI18n.updatePage();
                this.modules.set('i18n', global.EnterpriseI18n);
                console.log('  ✓ Internationalization ready');
            }
            
            // Initialize performance optimizations
            if (global.EnterprisePerformance) {
                this.modules.set('performance', global.EnterprisePerformance);
                console.log('  ✓ Performance optimization ready');
            }
            
            // Initialize backup system
            if (global.EnterpriseBackup) {
                this.modules.set('backup', global.EnterpriseBackup);
                console.log('  ✓ Backup system ready');
            }
            
            // Setup global event listeners
            this.setupGlobalListeners();
        }

        /**
         * Initialize current page-specific logic
         */
        async initCurrentPage() {
            console.log('📦 Phase 4: Initializing page-specific logic...');
            
            const currentPage = this.getCurrentPage();
            
            // Common page initialization
            this.initCommonElements();
            
            // Page-specific initialization
            switch (currentPage) {
                case 'login':
                    await this.initLoginPage();
                    break;
                case 'dashboard':
                    await this.initDashboardPage();
                    break;
                case 'surat-masuk':
                    await this.initSuratMasukPage();
                    break;
                case 'surat-keluar':
                    await this.initSuratKeluarPage();
                    break;
                case 'disposisi':
                    await this.initDisposisiPage();
                    break;
                case 'laporan':
                    await this.initLaporanPage();
                    break;
                case 'admin':
                    await this.initAdminPage();
                    break;
                case 'profile':
                    await this.initProfilePage();
                    break;
                default:
                    console.log('  ℹ️ Generic page initialization');
            }
            
            this.pageReady = true;
            this.dispatchEvent('page:ready', { page: currentPage });
        }

        /**
         * Post-initialization tasks
         */
        async postInit() {
            console.log('📦 Phase 5: Post-initialization...');
            
            // Verify Google Apps Script connection
            await this.verifyGASConnection();
            
            // Check for updates
            await this.checkForUpdates();
            
            // Preload common data
            await this.preloadData();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            console.log('✅ All systems ready!');
        }

        /**
         * Setup global event listeners
         */
        setupGlobalListeners() {
            // Online/Offline detection
            global.addEventListener('online', () => {
                console.log('🌐 Application is online');
                this.dispatchEvent('network:online');
                this.syncPendingData();
            });
            
            global.addEventListener('offline', () => {
                console.log('📡 Application is offline');
                this.dispatchEvent('network:offline');
                this.showOfflineNotification();
            });
            
            // Keyboard shortcuts
            global.addEventListener('keydown', (e) => {
                // Ctrl+D = Go to Dashboard
                if (e.ctrlKey && e.key === 'd') {
                    e.preventDefault();
                    this.navigateTo('dashboard');
                }
                // Ctrl+L = Go to Login
                if (e.ctrlKey && e.key === 'l' && !this.isAuthenticated()) {
                    e.preventDefault();
                    this.navigateTo('login');
                }
                // Escape = Close modals
                if (e.key === 'Escape') {
                    this.dispatchEvent('modal:close');
                }
            });
            
            // Before unload - save state
            global.addEventListener('beforeunload', () => {
                this.saveApplicationState();
            });
            
            // Visibility change - log activity
            global.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.dispatchEvent('app:resume');
                } else {
                    this.dispatchEvent('app:pause');
                }
            });
        }

        /**
         * Initialize common page elements
         */
        initCommonElements() {
            // Initialize user avatar and name
            this.updateUserDisplay();
            
            // Initialize navigation active state
            this.updateNavigationState();
            
            // Initialize sidebar if present
            this.initSidebar();
            
            // Initialize logout buttons
            this.initLogoutButtons();
        }

        /**
         * Update user display (avatar, name)
         */
        updateUserDisplay() {
            const user = this.getCurrentUser();
            const avatarEl = document.getElementById('userAvatar');
            const nameEl = document.getElementById('userName');
            
            if (avatarEl && user) {
                avatarEl.textContent = user.nama_lengkap?.charAt(0)?.toUpperCase() || 'U';
            }
            
            if (nameEl && user) {
                nameEl.textContent = user.nama_lengkap || 'User';
            }
        }

        /**
         * Update navigation active state
         */
        updateNavigationState() {
            const currentPage = this.getCurrentPage();
            
            document.querySelectorAll('.nav-item, .nav-link').forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.includes(currentPage)) {
                    link.classList.add('active');
                }
            });
        }

        /**
         * Initialize sidebar
         */
        initSidebar() {
            const sidebar = document.getElementById('sidebar');
            const toggle = document.querySelector('.menu-toggle');
            
            if (sidebar && toggle) {
                toggle.addEventListener('click', () => {
                    sidebar.classList.toggle('open');
                });
                
                // Close sidebar on outside click (mobile)
                document.addEventListener('click', (e) => {
                    if (sidebar.classList.contains('open') && 
                        !sidebar.contains(e.target) && 
                        !toggle.contains(e.target)) {
                        sidebar.classList.remove('open');
                    }
                });
            }
        }

        /**
         * Initialize logout buttons
         */
        initLogoutButtons() {
            document.querySelectorAll('[data-action="logout"], #logoutBtn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            });
        }

        /**
         * Page-specific initializations
         */
        async initLoginPage() {
            console.log('  🔐 Initializing login page...');
            
            // Check if already authenticated
            if (this.isAuthenticated()) {
                this.navigateTo('dashboard');
                return;
            }
            
            // Load remembered email
            const rememberedEmail = localStorage.getItem('rememberedEmail');
            if (rememberedEmail) {
                const emailInput = document.getElementById('email');
                if (emailInput) emailInput.value = rememberedEmail;
            }
            
            // Setup login form
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            }
        }

        async initDashboardPage() {
            console.log('  📊 Initializing dashboard...');
            
            if (!this.requireAuth()) return;
            
            // Load dashboard data
            await this.loadDashboardData();
            
            // Setup refresh interval
            setInterval(() => this.loadDashboardData(), 60000);
        }

        async initSuratMasukPage() {
            console.log('  📥 Initializing surat masuk...');
            if (!this.requireAuth()) return;
        }

        async initSuratKeluarPage() {
            console.log('  📤 Initializing surat keluar...');
            if (!this.requireAuth()) return;
        }

        async initDisposisiPage() {
            console.log('  📋 Initializing disposisi...');
            if (!this.requireAuth()) return;
        }

        async initLaporanPage() {
            console.log('  📈 Initializing laporan...');
            if (!this.requireAuth()) return;
        }

        async initAdminPage() {
            console.log('  ⚙️ Initializing admin panel...');
            if (!this.requireAuth()) return;
            if (!this.hasPermission('admin:access')) {
                this.showError('Anda tidak memiliki izin untuk mengakses halaman ini.');
                this.navigateTo('dashboard');
                return;
            }
        }

        async initProfilePage() {
            console.log('  👤 Initializing profile...');
            if (!this.requireAuth()) return;
        }

        /**
         * Handle login form submission
         */
        async handleLogin(event) {
            event.preventDefault();
            
            const email = document.getElementById('email')?.value?.trim();
            const password = document.getElementById('password')?.value?.trim();
            const remember = document.getElementById('remember')?.checked;
            
            if (!email || !password) {
                this.showError('Email dan password harus diisi');
                return;
            }
            
            try {
                // Show loading
                this.showLoading('Memproses login...');
                
                // Encode credentials with Base64
                const credentials = global.EnterpriseBase64?.encodeObject({
                    email, password, remember,
                    timestamp: Date.now(),
                });
                
                // Call Google Apps Script API
                const response = await this.callAPI('auth/login', {
                    credentials,
                    action: 'auth/login',
                });
                
                if (response?.success) {
                    // Save authentication data
                    this.saveAuthData(response.data, remember);
                    
                    this.showSuccess('Login berhasil! Mengalihkan...');
                    
                    setTimeout(() => {
                        this.navigateTo('dashboard');
                    }, 500);
                } else {
                    // Demo mode fallback
                    if (email === 'admin@arsipsurat.id' && password === 'password123') {
                        this.saveAuthData({
                            token: 'demo-token-' + Date.now(),
                            refreshToken: 'demo-refresh-' + Date.now(),
                            user: {
                                id: 1,
                                nama_lengkap: 'Administrator',
                                email: 'admin@arsipsurat.id',
                                role: { id: 1, nama: 'Super Admin', slug: 'super-admin' },
                                permissions: ['*'],
                            }
                        }, remember);
                        
                        this.showSuccess('Login berhasil (Mode Demo)!');
                        setTimeout(() => this.navigateTo('dashboard'), 500);
                    } else {
                        this.showError('Email atau password salah');
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                this.showError('Gagal terhubung ke server. Silakan coba lagi.');
            } finally {
                this.hideLoading();
            }
        }

        /**
         * Save authentication data
         */
        saveAuthData(data, remember) {
            localStorage.setItem('enterprise_token', data.token);
            localStorage.setItem('enterprise_refresh', data.refreshToken);
            localStorage.setItem('enterprise_user', global.EnterpriseBase64?.encodeObject(data.user) || JSON.stringify(data.user));
            
            if (remember && data.user?.email) {
                localStorage.setItem('rememberedEmail', data.user.email);
            }
        }

        /**
         * Logout
         */
        async logout() {
            try {
                await this.callAPI('auth/logout', { action: 'auth/logout' });
            } catch (error) {
                console.warn('Logout API call failed:', error);
            }
            
            localStorage.removeItem('enterprise_token');
            localStorage.removeItem('enterprise_refresh');
            localStorage.removeItem('enterprise_user');
            
            this.navigateTo('login');
        }

        /**
         * Navigation helper
         */
        navigateTo(page) {
            const pages = APP_CONFIG.pages;
            const url = pages[page] || pages.landing;
            window.location.href = url;
        }

        /**
         * Call Google Apps Script API
         */
        async callAPI(endpoint, params = {}) {
            if (global.GASAPI) {
                return global.GASAPI.call(endpoint, params);
            }
            
            // Fallback: direct JSONP call
            return new Promise((resolve, reject) => {
                const callbackName = 'gasCallback_' + Date.now();
                const url = new URL(APP_CONFIG.gas.url);
                
                url.searchParams.set('action', endpoint);
                url.searchParams.set('data', global.EnterpriseBase64?.encodeObject(params) || JSON.stringify(params));
                url.searchParams.set('callback', callbackName);
                url.searchParams.set('_t', Date.now());
                
                global[callbackName] = function(response) {
                    delete global[callbackName];
                    resolve(response);
                };
                
                const script = document.createElement('script');
                script.src = url.toString();
                script.onerror = () => {
                    delete global[callbackName];
                    reject(new Error('Network error'));
                };
                
                document.head.appendChild(script);
                
                setTimeout(() => {
                    if (global[callbackName]) {
                        delete global[callbackName];
                        reject(new Error('Timeout'));
                    }
                }, APP_CONFIG.gas.timeout);
            });
        }

        /**
         * Verify Google Apps Script connection
         */
        async verifyGASConnection() {
            try {
                const response = await this.callAPI('system/ping', { action: 'system/ping' });
                if (response?.success) {
                    console.log('📡 Google Apps Script: CONNECTED');
                }
            } catch (error) {
                console.warn('⚠️ Google Apps Script connection verification failed');
            }
        }

        /**
         * Check for updates
         */
        async checkForUpdates() {
            try {
                const response = await this.callAPI('system/version', { action: 'system/version' });
                if (response?.data?.version !== this.version) {
                    console.log('🔄 New version available:', response?.data?.version);
                }
            } catch (error) {
                // Silently fail
            }
        }

        /**
         * Preload common data
         */
        async preloadData() {
            if (!this.isAuthenticated()) return;
            
            try {
                // Preload dashboard stats
                if (global.EnterpriseCache) {
                    await global.EnterpriseCache.preload();
                }
            } catch (error) {
                console.warn('Preload failed:', error);
            }
        }

        /**
         * Sync pending data when back online
         */
        async syncPendingData() {
            if (global.GASAPI) {
                await global.GASAPI.processQueue();
            }
            if (global.EnterpriseDB?.sync) {
                await global.EnterpriseDB.sync.syncWithServer();
            }
        }

        /**
         * Load dashboard data
         */
        async loadDashboardData() {
            try {
                const response = await this.callAPI('dashboard/stats', { action: 'dashboard/stats' });
                if (response?.success) {
                    this.updateDashboardStats(response.data);
                }
            } catch (error) {
                console.warn('Failed to load dashboard data');
            }
        }

        /**
         * Update dashboard statistics
         */
        updateDashboardStats(data) {
            const elements = {
                'totalSuratMasuk': data?.totalSuratMasuk,
                'totalSuratKeluar': data?.totalSuratKeluar,
                'totalDisposisi': data?.totalDisposisi,
                'totalArsip': data?.totalArsip,
            };
            
            Object.entries(elements).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el && value !== undefined) {
                    el.textContent = value.toLocaleString('id-ID');
                }
            });
        }

        /**
         * Utility functions
         */
        getCurrentPage() {
            const path = window.location.pathname;
            const filename = path.split('/').pop()?.replace('.html', '');
            
            const pageMap = {
                'index': 'landing',
                'login': 'login',
                'dashboard': 'dashboard',
                'surat-masuk': 'surat-masuk',
                'surat-keluar': 'surat-keluar',
                'disposisi': 'disposisi',
                'laporan': 'laporan',
                'admin': 'admin',
                'profile': 'profile',
                '404': 'error',
                'offline': 'offline',
            };
            
            return pageMap[filename] || 'landing';
        }

        isAuthenticated() {
            const token = localStorage.getItem('enterprise_token');
            const user = localStorage.getItem('enterprise_user');
            return !!(token && user);
        }

        getCurrentUser() {
            try {
                const saved = localStorage.getItem('enterprise_user');
                if (!saved) return null;
                
                return global.EnterpriseBase64 
                    ? global.EnterpriseBase64.decodeObject(saved)
                    : JSON.parse(saved);
            } catch {
                return null;
            }
        }

        hasPermission(permission) {
            const user = this.getCurrentUser();
            return user?.permissions?.includes(permission) || user?.permissions?.includes('*') || false;
        }

        requireAuth() {
            if (!this.isAuthenticated()) {
                this.navigateTo('login');
                return false;
            }
            return true;
        }

        showLoading(message = 'Memproses...') {
            if (global.EnterpriseCore?.ui) {
                global.EnterpriseCore.ui.showLoading(message);
            }
        }

        hideLoading() {
            if (global.EnterpriseCore?.ui) {
                global.EnterpriseCore.ui.hideLoading();
            }
        }

        hideLoadingScreen() {
            const loader = document.getElementById('loading-screen');
            if (loader) {
                loader.classList.add('hidden');
                setTimeout(() => loader.remove(), 500);
            }
        }

        showSuccess(message) {
            if (global.EnterpriseRealtime) {
                global.EnterpriseRealtime.success('Sukses', message);
            } else if (global.EnterpriseCore?.notifications) {
                global.EnterpriseCore.notifications.success(message);
            } else {
                alert(message);
            }
        }

        showError(message) {
            if (global.EnterpriseRealtime) {
                global.EnterpriseRealtime.error('Error', message);
            } else if (global.EnterpriseCore?.notifications) {
                global.EnterpriseCore.notifications.error(message);
            } else {
                alert('Error: ' + message);
            }
        }

        showOfflineNotification() {
            if (global.EnterpriseRealtime) {
                global.EnterpriseRealtime.warning('Offline', 'Anda sedang offline. Data akan disimpan secara lokal.');
            }
        }

        dispatchEvent(name, detail = {}) {
            global.dispatchEvent(new CustomEvent(name, { detail }));
        }

        saveApplicationState() {
            try {
                const state = {
                    lastPage: this.getCurrentPage(),
                    timestamp: Date.now(),
                    version: this.version,
                };
                sessionStorage.setItem('app_state', JSON.stringify(state));
            } catch (error) {
                // Silently fail
            }
        }

        handleInitError(error) {
            console.error('Fatal initialization error:', error);
            
            // Show error to user
            const errorEl = document.getElementById('init-error');
            if (errorEl) {
                errorEl.textContent = 'Gagal menginisialisasi aplikasi: ' + error.message;
                errorEl.style.display = 'block';
            }
            
            // Hide loading screen
            this.hideLoadingScreen();
        }

        /**
         * Get application info
         */
        getInfo() {
            return {
                version: this.version,
                initialized: this.initialized,
                pageReady: this.pageReady,
                currentPage: this.getCurrentPage(),
                authenticated: this.isAuthenticated(),
                user: this.getCurrentUser()?.nama_lengkap || 'Guest',
                online: navigator.onLine,
                uptime: Date.now() - this.startTime,
                modules: Array.from(this.modules.keys()),
            };
        }
    }

    // ==================== CREATE AND EXPORT ====================
    const app = new Application();

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => app.init());
    } else {
        app.init();
    }

    // Export globally
    global.EnterpriseApp = app;
    global.APP_CONFIG = APP_CONFIG;

})(window);
