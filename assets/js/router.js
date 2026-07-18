/* ============================================
   ENTERPRISE ROUTER - SPA Navigation
   ============================================ */
(function() {
    'use strict';

    class EnterpriseRouter {
        constructor() {
            this.routes = new Map();
            this.currentRoute = null;
            this.params = {};
            this.guards = [];
            this.history = [];
            this.maxHistory = 50;
            
            this.init();
        }

        // ============================================
        // INITIALIZATION
        // ============================================
        init() {
            // Define routes
            this.addRoute('/', this.dashboardRoute.bind(this));
            this.addRoute('/surat-masuk', this.suratMasukRoute.bind(this));
            this.addRoute('/surat-keluar', this.suratKeluarRoute.bind(this));
            this.addRoute('/disposisi', this.disposisiRoute.bind(this));
            this.addRoute('/laporan', this.laporanRoute.bind(this));
            this.addRoute('/pengaturan', this.pengaturanRoute.bind(this));
            this.addRoute('/login', this.loginRoute.bind(this));
            
            // Add auth guard
            this.addGuard(this.authGuard.bind(this));

            // Listen for hash changes
            window.addEventListener('hashchange', () => this.handleRoute());
            
            // Handle initial route
            this.handleRoute();

            Logger.info('Router initialized');
        }

        // ============================================
        // ROUTE MANAGEMENT
        // ============================================
        addRoute(path, handler) {
            this.routes.set(path, handler);
        }

        addGuard(guard) {
            this.guards.push(guard);
        }

        navigate(path) {
            window.location.hash = path;
        }

        goBack() {
            if (this.history.length > 1) {
                this.history.pop(); // Remove current
                const previous = this.history.pop(); // Get previous
                this.navigate(previous.path);
            } else {
                this.navigate('/');
            }
        }

        getCurrentParams() {
            return this.params;
        }

        getCurrentRoute() {
            return this.currentRoute;
        }

        // ============================================
        // ROUTE HANDLER
        // ============================================
        async handleRoute() {
            const hash = window.location.hash.slice(1) || '/';
            const [path, queryString] = hash.split('?');
            
            // Parse query parameters
            this.params = {};
            if (queryString) {
                const searchParams = new URLSearchParams(queryString);
                for (const [key, value] of searchParams) {
                    this.params[key] = value;
                }
            }

            // Find matching route
            const handler = this.routes.get(path);
            
            if (!handler) {
                this.show404();
                return;
            }

            // Check guards
            for (const guard of this.guards) {
                const canProceed = await guard(path);
                if (!canProceed) {
                    return;
                }
            }

            // Update navigation history
            this.updateHistory(path);

            // Show loading spinner
            Spinner.show('Memuat halaman...');

            try {
                // Execute route handler
                await handler();
                this.currentRoute = path;
                
                // Update active nav item
                this.updateActiveNav(path);

                // Scroll to top
                window.scrollTo(0, 0);

            } catch (error) {
                Logger.error('Route error:', error);
                this.showError(error);
            } finally {
                Spinner.hide();
            }
        }

        // ============================================
        // AUTH GUARD
        // ============================================
        async authGuard(path) {
            // Allow login page without authentication
            if (path === '/login') return true;

            // Check Auth service first
            if (Auth && Auth.isAuthenticated && Auth.isAuthenticated()) {
                // Check role-based access
                if (path === '/pengaturan' && Auth.hasRole && !Auth.hasRole('admin')) {
                    showToast('Akses ditolak. Hanya admin yang dapat mengakses pengaturan.', 'error');
                    this.navigate('/');
                    return false;
                }
                return true;
            }

            // Check session in localStorage (fallback)
            const savedSession = localStorage.getItem('auth_session');
            if (savedSession) {
                try {
                    const session = JSON.parse(atob(savedSession));
                    if (session.token && session.expiry > Date.now()) {
                        // Restore session to Auth service
                        if (Auth && Auth.setSession) {
                            Auth.setSession(session);
                        }
                        return true; // Valid session
                    }
                } catch(e) {
                    localStorage.removeItem('auth_session');
                }
            }

            // No valid session - redirect to login page
            this.navigate('/login');
            return false;
        }

        // ============================================
        // ROUTE HANDLERS
        // ============================================
        async dashboardRoute() {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = await this.loadTemplate('dashboard');
            
            // Initialize dashboard
            if (window.Dashboard) {
                await Dashboard.init();
            }
        }

        async suratMasukRoute() {
            const mainContent = document.getElementById('main-content');
            
            if (this.params.id) {
                // Show detail
                mainContent.innerHTML = await this.loadTemplate('surat-detail');
                await Surat.showDetail('masuk', parseInt(this.params.id));
            } else if (this.params.action === 'tambah') {
                // Show form
                mainContent.innerHTML = await this.loadTemplate('surat-form');
                await Surat.showForm('masuk');
            } else if (this.params.action === 'edit' && this.params.id) {
                // Show edit form
                mainContent.innerHTML = await this.loadTemplate('surat-form');
                await Surat.showForm('masuk');
            } else {
                // Show list
                mainContent.innerHTML = await this.loadTemplate('surat-list');
                await Surat.showList('masuk');
            }
        }

        async suratKeluarRoute() {
            const mainContent = document.getElementById('main-content');
            
            if (this.params.id) {
                // Show detail
                mainContent.innerHTML = await this.loadTemplate('surat-detail');
                await Surat.showDetail('keluar', parseInt(this.params.id));
            } else if (this.params.action === 'tambah') {
                // Show form
                mainContent.innerHTML = await this.loadTemplate('surat-form');
                await Surat.showForm('keluar');
            } else if (this.params.action === 'edit' && this.params.id) {
                // Show edit form
                mainContent.innerHTML = await this.loadTemplate('surat-form');
                await Surat.showForm('keluar');
            } else {
                // Show list
                mainContent.innerHTML = await this.loadTemplate('surat-list');
                await Surat.showList('keluar');
            }
        }

        async disposisiRoute() {
            const mainContent = document.getElementById('main-content');
            
            if (this.params.id) {
                // Show detail
                mainContent.innerHTML = await this.loadTemplate('disposisi-detail');
                await Disposisi.showDetail(parseInt(this.params.id));
            } else if (this.params.action === 'tambah') {
                // Show form
                mainContent.innerHTML = await this.loadTemplate('disposisi-form');
                await Disposisi.showForm();
            } else {
                // Show list
                mainContent.innerHTML = await this.loadTemplate('disposisi-list');
                await Disposisi.showList();
            }
        }

        async laporanRoute() {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = await this.loadTemplate('laporan');
            await Laporan.init();
        }

        async pengaturanRoute() {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = await this.loadTemplate('pengaturan');
            await this.initSettings();
        }

        async loginRoute() {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = await this.loadTemplate('login');
            await this.initLogin();
        }

        // ============================================
        // TEMPLATE LOADER
        // ============================================
        async loadTemplate(name) {
            // Templates are embedded in the HTML or loaded dynamically
            const templates = {
                'dashboard': `
                    <div class="page-header">
                        <div>
                            <h2>Dashboard</h2>
                            <p class="page-subtitle">Ringkasan Sistem Arsip Surat</p>
                        </div>
                        <div class="page-actions">
                            <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/surat-masuk?action=tambah')">
                                + Surat Masuk
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/surat-keluar?action=tambah')">
                                + Surat Keluar
                            </button>
                        </div>
                    </div>
                    <div id="dashboard-content"></div>
                `,
                'surat-list': `
                    <div class="page-header">
                        <h2 id="page-title">Daftar Surat</h2>
                        <div class="page-actions">
                            <button class="btn btn-primary" id="btn-tambah-surat">
                                + Tambah Surat
                            </button>
                        </div>
                    </div>
                    <div id="surat-list-content"></div>
                `,
                'surat-form': `
                    <div class="page-header">
                        <h2>Form Surat</h2>
                        <button class="btn btn-secondary" onclick="history.back()">
                            ← Kembali
                        </button>
                    </div>
                    <div id="surat-form-content"></div>
                `,
                'surat-detail': `
                    <div class="page-header">
                        <h2>Detail Surat</h2>
                        <button class="btn btn-secondary" onclick="history.back()">
                            ← Kembali
                        </button>
                    </div>
                    <div id="surat-detail-content"></div>
                `,
                'disposisi-list': `
                    <div class="page-header">
                        <h2>Daftar Disposisi</h2>
                        <button class="btn btn-primary" onclick="Router.navigate('/disposisi?action=tambah')">
                            + Tambah Disposisi
                        </button>
                    </div>
                    <div id="disposisi-list-content"></div>
                `,
                'disposisi-form': `
                    <div class="page-header">
                        <h2>Form Disposisi</h2>
                        <button class="btn btn-secondary" onclick="history.back()">
                            ← Kembali
                        </button>
                    </div>
                    <div id="disposisi-form-content"></div>
                `,
                'disposisi-detail': `
                    <div class="page-header">
                        <h2>Detail Disposisi</h2>
                        <button class="btn btn-secondary" onclick="history.back()">
                            ← Kembali
                        </button>
                    </div>
                    <div id="disposisi-detail-content"></div>
                `,
                'laporan': `
                    <div class="page-header">
                        <h2>Laporan</h2>
                        <p class="page-subtitle">Generate dan export laporan arsip surat</p>
                    </div>
                    <div id="laporan-content"></div>
                `,
                'pengaturan': `
                    <div class="page-header">
                        <h2>Pengaturan</h2>
                        <p class="page-subtitle">Konfigurasi sistem dan backup data</p>
                    </div>
                    <div id="settings-content"></div>
                `,
                'login': `
                    <div class="login-container">
                        <div class="login-card">
                            <img src="assets/images/logo.svg" alt="Logo" class="login-logo" onerror="this.src='assets/images/icon-192x192.svg'">
                            <h2>Arsip Surat Digital</h2>
                            <p class="login-subtitle">Enterprise Edition v${APP_CONFIG.APP_VERSION}</p>
                            
                            <div id="login-error" class="login-error"></div>
                            
                            <form id="login-form" autocomplete="off">
                                <div class="form-group">
                                    <label for="login-username">Username</label>
                                    <input type="text" id="login-username" class="form-control" 
                                           placeholder="Masukkan username" required autocomplete="username">
                                </div>
                                <div class="form-group">
                                    <label for="login-password">Password</label>
                                    <input type="password" id="login-password" class="form-control" 
                                           placeholder="Masukkan password" required autocomplete="current-password">
                                </div>
                                <div class="form-options">
                                    <label class="remember-me">
                                        <input type="checkbox" id="remember-me">
                                        <span>Ingat saya</span>
                                    </label>
                                </div>
                                <button type="submit" class="btn btn-primary btn-block">
                                    Masuk ke Sistem
                                </button>
                            </form>
                            
                            <div class="login-footer">
                                <p class="hint">
                                    Default: <code>admin</code> / <code>admin123</code>
                                </p>
                            </div>
                        </div>
                    </div>
                `
            };

            return templates[name] || '<div class="error-page"><h1>404</h1><p>Template tidak ditemukan</p></div>';
        }

        // ============================================
        // HISTORY MANAGEMENT
        // ============================================
        updateHistory(path) {
            this.history.push({
                path,
                timestamp: Date.now()
            });

            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }
        }

        updateActiveNav(path) {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                const route = item.getAttribute('data-route');
                if (route === path || (path.includes(route) && route !== '/')) {
                    item.classList.add('active');
                }
            });
        }

        // ============================================
        // ERROR PAGES
        // ============================================
        show404() {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `
                <div class="error-page">
                    <h1>404</h1>
                    <p>Halaman tidak ditemukan</p>
                    <p class="text-muted">URL: ${window.location.hash}</p>
                    <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                        <button class="btn btn-primary" onclick="Router.navigate('/')">
                            🏠 Dashboard
                        </button>
                        <button class="btn btn-secondary" onclick="history.back()">
                            ← Kembali
                        </button>
                    </div>
                </div>
            `;
        }

        showError(error) {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `
                <div class="error-page">
                    <h1>⚠️ Error</h1>
                    <p>${error.message || 'Terjadi kesalahan'}</p>
                    <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                        <button class="btn btn-primary" onclick="Router.navigate('/')">
                            🏠 Dashboard
                        </button>
                        <button class="btn btn-secondary" onclick="location.reload()">
                            🔄 Muat Ulang
                        </button>
                    </div>
                </div>
            `;
        }

        // ============================================
        // SETTINGS PAGE
        // ============================================
        async initSettings() {
            const settingsContent = document.getElementById('settings-content');
            if (!settingsContent) return;

            settingsContent.innerHTML = `
                <div class="settings-section">
                    <h3>Informasi Sistem</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Versi Aplikasi</label>
                            <span>${APP_CONFIG.APP_VERSION}</span>
                        </div>
                        <div class="info-item">
                            <label>Mode Koneksi</label>
                            <span id="settings-mode">${navigator.onLine ? '🟢 Online' : '🔴 Offline'}</span>
                        </div>
                        <div class="info-item">
                            <label>Pending Sync</label>
                            <span id="pending-sync-count">-</span>
                        </div>
                        <div class="info-item">
                            <label>Base Path</label>
                            <span>${APP_CONFIG.BASE_PATH}</span>
                        </div>
                        <div class="info-item">
                            <label>User Agent</label>
                            <span style="font-size:11px;">${navigator.userAgent.substring(0, 50)}...</span>
                        </div>
                        <div class="info-item">
                            <label>Session</label>
                            <span>${Auth.isAuthenticated() ? '✅ Active' : '❌ Expired'}</span>
                        </div>
                    </div>
                    
                    <div class="settings-actions">
                        <button class="btn btn-primary" onclick="API.forceSync()">
                            🔄 Sinkronisasi Sekarang
                        </button>
                        <button class="btn btn-secondary" onclick="DB.exportAllData()">
                            💾 Backup Data
                        </button>
                        <button class="btn btn-secondary" onclick="document.getElementById('import-file').click()">
                            📥 Restore Data
                        </button>
                        <input type="file" id="import-file" accept=".json" style="display:none" 
                               onchange="Router.handleImport(event)">
                    </div>
                </div>

                <div class="settings-section" style="margin-top: 20px;">
                    <h3>Debug & Troubleshooting</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Service Worker</label>
                            <span id="sw-status">Mengecek...</span>
                        </div>
                        <div class="info-item">
                            <label>Cache Storage</label>
                            <span id="cache-status">Mengecek...</span>
                        </div>
                        <div class="info-item">
                            <label>IndexedDB</label>
                            <span id="idb-status">Mengecek...</span>
                        </div>
                        <div class="info-item">
                            <label>LocalStorage</label>
                            <span id="ls-status">Mengecek...</span>
                        </div>
                    </div>
                    <div class="settings-actions">
                        <button class="btn btn-secondary" onclick="window.open('troubleshooting.html', '_blank')">
                            🔧 Troubleshooting Tool
                        </button>
                        <button class="btn btn-secondary" onclick="Router.clearAllCache()">
                            🧹 Bersihkan Cache
                        </button>
                    </div>
                </div>
            `;

            // Update pending sync count
            try {
                const count = await API.getPendingSyncCount();
                document.getElementById('pending-sync-count').textContent = count;
            } catch(e) {
                document.getElementById('pending-sync-count').textContent = 'Error';
            }

            // Check Service Worker
            this.checkServiceWorkerStatus();
            
            // Check storage
            this.checkStorageStatus();
        }

        async checkServiceWorkerStatus() {
            const swStatus = document.getElementById('sw-status');
            if (!swStatus) return;

            if ('serviceWorker' in navigator) {
                try {
                    const reg = await navigator.serviceWorker.getRegistration();
                    swStatus.textContent = reg ? '✅ Active' : '⚠️ Not Registered';
                } catch(e) {
                    swStatus.textContent = '❌ Error';
                }
            } else {
                swStatus.textContent = '❌ Not Supported';
            }
        }

        async checkStorageStatus() {
            // Cache status
            const cacheStatus = document.getElementById('cache-status');
            if (cacheStatus && 'caches' in window) {
                try {
                    const keys = await caches.keys();
                    cacheStatus.textContent = `✅ ${keys.length} cache(s)`;
                } catch(e) {
                    cacheStatus.textContent = '❌ Error';
                }
            }

            // IndexedDB status
            const idbStatus = document.getElementById('idb-status');
            if (idbStatus && 'indexedDB' in window) {
                try {
                    const dbs = await indexedDB.databases();
                    idbStatus.textContent = `✅ ${dbs.length} database(s)`;
                } catch(e) {
                    idbStatus.textContent = '❌ Error';
                }
            }

            // LocalStorage status
            const lsStatus = document.getElementById('ls-status');
            if (lsStatus) {
                try {
                    const size = JSON.stringify(localStorage).length;
                    lsStatus.textContent = `✅ ${(size / 1024).toFixed(1)} KB`;
                } catch(e) {
                    lsStatus.textContent = '❌ Error';
                }
            }
        }

        async clearAllCache() {
            if (!confirm('Bersihkan semua cache? Data offline akan hilang.')) return;

            try {
                if ('caches' in window) {
                    const keys = await caches.keys();
                    for (const key of keys) {
                        await caches.delete(key);
                    }
                }
                showToast('Cache berhasil dibersihkan', 'success');
                setTimeout(() => location.reload(), 1000);
            } catch(e) {
                showToast('Gagal membersihkan cache', 'error');
            }
        }

        async handleImport(event) {
            const file = event.target.files[0];
            if (!file) return;

            if (confirm('Import data akan menimpa data yang ada. Lanjutkan?')) {
                try {
                    Spinner.show('Mengimport data...');
                    await DB.importData(file);
                    showToast('Data berhasil diimport', 'success');
                    setTimeout(() => location.reload(), 1000);
                } catch (error) {
                    showToast('Gagal import data: ' + error.message, 'error');
                } finally {
                    Spinner.hide();
                }
            }
        }

        // ============================================
        // LOGIN HANDLER
        // ============================================
        async initLogin() {
            const form = document.getElementById('login-form');
            const errorDiv = document.getElementById('login-error');
            
            if (!form) return;

            // Check if already logged in
            if (Auth.isAuthenticated()) {
                this.navigate('/');
                return;
            }

            // Load remembered username
            const remembered = localStorage.getItem('remembered_user');
            if (remembered) {
                try {
                    const data = JSON.parse(atob(remembered));
                    document.getElementById('login-username').value = data.username || '';
                    document.getElementById('remember-me').checked = true;
                } catch(e) {
                    localStorage.removeItem('remembered_user');
                }
            }

            // Handle form submit
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const username = document.getElementById('login-username').value.trim();
                const password = document.getElementById('login-password').value.trim();
                const rememberMe = document.getElementById('remember-me').checked;
                
                // Validate
                if (!username || !password) {
                    this.showLoginError(errorDiv, 'Username dan password harus diisi!');
                    return;
                }
                
                // Hide error
                errorDiv.classList.remove('show');
                
                // Show loading
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Memproses...';
                
                try {
                    await Auth.login(username, password);
                    
                    // Save remember me
                    if (rememberMe) {
                        localStorage.setItem('remembered_user', btoa(JSON.stringify({ username })));
                    } else {
                        localStorage.removeItem('remembered_user');
                    }
                    
                    showToast('Login berhasil!', 'success');
                    this.navigate('/');
                    
                } catch (error) {
                    this.showLoginError(errorDiv, error.message || 'Login gagal');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    document.getElementById('login-password').value = '';
                    document.getElementById('login-password').focus();
                }
            });

            // Focus username field
            setTimeout(() => {
                const usernameInput = document.getElementById('login-username');
                if (usernameInput && !usernameInput.value) {
                    usernameInput.focus();
                } else {
                    document.getElementById('login-password')?.focus();
                }
            }, 300);
        }

        showLoginError(errorDiv, message) {
            if (!errorDiv) return;
            errorDiv.textContent = message;
            errorDiv.classList.add('show');
            
            // Auto hide after 5 seconds
            setTimeout(() => {
                errorDiv.classList.remove('show');
            }, 5000);
        }
    }

    // ============================================
    // INITIALIZE GLOBAL ROUTER
    // ============================================
    window.Router = new EnterpriseRouter();
    Logger.info('Enterprise Router initialized');

})();
