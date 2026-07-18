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

        addRoute(path, handler) {
            this.routes.set(path, handler);
        }

        addGuard(guard) {
            this.guards.push(guard);
        }

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
                await Surat.showDetail('masuk', this.params.id);
            } else if (this.params.action === 'tambah') {
                // Show form
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
                mainContent.innerHTML = await this.loadTemplate('surat-detail');
                await Surat.showDetail('keluar', this.params.id);
            } else if (this.params.action === 'tambah') {
                mainContent.innerHTML = await this.loadTemplate('surat-form');
                await Surat.showForm('keluar');
            } else {
                mainContent.innerHTML = await this.loadTemplate('surat-list');
                await Surat.showList('keluar');
            }
        }

        async disposisiRoute() {
            const mainContent = document.getElementById('main-content');
            
            if (this.params.id) {
                mainContent.innerHTML = await this.loadTemplate('disposisi-detail');
                await Disposisi.showDetail(this.params.id);
            } else if (this.params.action === 'tambah') {
                mainContent.innerHTML = await this.loadTemplate('disposisi-form');
                await Disposisi.showForm();
            } else {
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

        async loadTemplate(name) {
            // Templates are embedded in the HTML or loaded dynamically
            const templates = {
                'dashboard': `
                    <div class="page-header">
                        <h2>Dashboard</h2>
                        <p class="page-subtitle">Ringkasan Sistem Arsip Surat</p>
                    </div>
                    <div id="dashboard-content"></div>
                `,
                'surat-list': `
                    <div class="page-header">
                        <h2 id="page-title">Daftar Surat</h2>
                        <div class="page-actions">
                            <button class="btn btn-primary" onclick="Router.navigate('/${Router.params.type === 'keluar' ? 'surat-keluar' : 'surat-masuk'}?action=tambah')">
                                + Tambah Surat
                            </button>
                        </div>
                    </div>
                    <div id="surat-list-content"></div>
                `,
                'surat-form': `
                    <div class="page-header">
                        <h2>Form Surat</h2>
                    </div>
                    <div id="surat-form-content"></div>
                `,
                'surat-detail': `
                    <div class="page-header">
                        <h2>Detail Surat</h2>
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
                    </div>
                    <div id="disposisi-form-content"></div>
                `,
                'laporan': `
                    <div class="page-header">
                        <h2>Laporan</h2>
                    </div>
                    <div id="laporan-content"></div>
                `,
                'pengaturan': `
                    <div class="page-header">
                        <h2>Pengaturan</h2>
                    </div>
                    <div id="settings-content"></div>
                `,
                'login': `
                    <div class="login-container">
                        <div class="login-card">
                            <img src="assets/images/logo.svg" alt="Logo" class="login-logo">
                            <h2>Arsip Surat Digital</h2>
                            <p class="login-subtitle">Enterprise Edition</p>
                            <form id="login-form">
                                <div class="form-group">
                                    <label>Username</label>
                                    <input type="text" id="login-username" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>Password</label>
                                    <input type="password" id="login-password" class="form-control" required>
                                </div>
                                <button type="submit" class="btn btn-primary btn-block">Masuk</button>
                            </form>
                        </div>
                    </div>
                `
            };

            return templates[name] || '<div class="error-page">Halaman tidak ditemukan</div>';
        }

        async authGuard(path) {
            // Allow access to login page without authentication
            if (path === '/login') return true;

            // Check if user is authenticated
            if (!Auth.isAuthenticated()) {
                this.navigate('/login');
                return false;
            }

            // Check role-based access
            if (path === '/pengaturan' && !Auth.hasRole('admin')) {
                showToast('Akses ditolak. Hanya admin yang dapat mengakses pengaturan.', 'error');
                this.navigate('/');
                return false;
            }

            return true;
        }

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
                if (item.getAttribute('data-route') === path) {
                    item.classList.add('active');
                }
            });
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

        show404() {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `
                <div class="error-page">
                    <h1>404</h1>
                    <p>Halaman tidak ditemukan</p>
                    <button class="btn btn-primary" onclick="Router.navigate('/')">
                        Kembali ke Dashboard
                    </button>
                </div>
            `;
        }

        showError(error) {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `
                <div class="error-page">
                    <h1>Error</h1>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="Router.navigate('/')">
                        Kembali ke Dashboard
                    </button>
                </div>
            `;
        }

        async initSettings() {
            const settingsContent = document.getElementById('settings-content');
            settingsContent.innerHTML = `
                <div class="settings-section">
                    <h3>Informasi Sistem</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Versi Aplikasi</label>
                            <span>${APP_CONFIG.APP_VERSION}</span>
                        </div>
                        <div class="info-item">
                            <label>Mode</label>
                            <span>${navigator.onLine ? 'Online' : 'Offline'}</span>
                        </div>
                        <div class="info-item">
                            <label>Pending Sync</label>
                            <span id="pending-sync-count">-</span>
                        </div>
                    </div>
                    
                    <div class="settings-actions">
                        <button class="btn btn-primary" onclick="API.forceSync()">
                            Sinkronisasi Sekarang
                        </button>
                        <button class="btn btn-secondary" onclick="DB.exportAllData()">
                            Backup Data
                        </button>
                        <button class="btn btn-secondary" onclick="document.getElementById('import-file').click()">
                            Restore Data
                        </button>
                        <input type="file" id="import-file" accept=".json" style="display:none" 
                               onchange="Router.handleImport(event)">
                    </div>
                </div>
            `;

            // Update pending sync count
            const count = await API.getPendingSyncCount();
            document.getElementById('pending-sync-count').textContent = count;
        }

        async handleImport(event) {
            const file = event.target.files[0];
            if (!file) return;

            if (confirm('Import data akan menimpa data yang ada. Lanjutkan?')) {
                try {
                    await DB.importData(file);
                    showToast('Data berhasil diimport', 'success');
                    window.location.reload();
                } catch (error) {
                    showToast('Gagal import data: ' + error.message, 'error');
                }
            }
        }

        async initLogin() {
            const form = document.getElementById('login-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const username = document.getElementById('login-username').value;
                    const password = document.getElementById('login-password').value;
                    
                    try {
                        Spinner.show('Memproses login...');
                        await Auth.login(username, password);
                        Router.navigate('/');
                        showToast('Login berhasil', 'success');
                    } catch (error) {
                        showToast(error.message, 'error');
                    } finally {
                        Spinner.hide();
                    }
                });
            }
        }
    }

    // Initialize Global Router
    window.Router = new EnterpriseRouter();
    Logger.info('Enterprise Router initialized');
})();
