/* ============================================
   ENTERPRISE MAIN APPLICATION
   ============================================ */
(function() {
    'use strict';

    class EnterpriseApp {
        constructor() {
            this.isOnline = navigator.onLine;
            this.isInitialized = false;
            this.syncInterval = null;
            this.toastQueue = [];
            this.modalStack = [];
            
            this.init();
        }

        async init() {
            try {
                // Show loading screen
                this.showLoadingScreen();

                // Initialize core services
                await this.initCoreServices();

                // Setup event listeners
                this.setupEventListeners();

                // Setup offline/online detection
                this.setupConnectivityDetection();

                // Setup background sync
                this.setupBackgroundSync();

                // Hide loading screen
                this.hideLoadingScreen();

                this.isInitialized = true;
                Logger.info('Enterprise App initialized successfully');

            } catch (error) {
                Logger.error('App initialization failed:', error);
                this.showErrorScreen(error);
            }
        }

        async initCoreServices() {
            // Initialize IndexedDB
            await DB.waitForDB();
            Logger.info('Database ready');

            // Check authentication
            if (Auth.isAuthenticated()) {
                Logger.info('User authenticated');
            }

            // Process pending sync operations
            if (navigator.onLine) {
                await DB.processPendingSync();
                Logger.info('Pending sync processed');
            }

            // Setup sync interval
            this.syncInterval = setInterval(() => {
                if (navigator.onLine) {
                    DB.processPendingSync();
                }
            }, APP_CONFIG.SYNC.INTERVAL);
        }

        setupEventListeners() {
            // Menu toggle
            const menuToggle = document.getElementById('menu-toggle');
            const sidebar = document.getElementById('sidebar');
            
            if (menuToggle && sidebar) {
                menuToggle.addEventListener('click', () => {
                    sidebar.classList.toggle('open');
                });

                // Close sidebar on outside click (mobile)
                document.addEventListener('click', (e) => {
                    if (window.innerWidth <= 768) {
                        if (!sidebar.contains(e.target) && e.target !== menuToggle) {
                            sidebar.classList.remove('open');
                        }
                    }
                });
            }

            // Logout button
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    this.confirmLogout();
                });
            }

            // User menu
            const userMenuBtn = document.getElementById('user-menu-btn');
            if (userMenuBtn) {
                userMenuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleUserMenu();
                });
            }

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                this.handleKeyboardShortcuts(e);
            });

            // Handle back/forward browser buttons
            window.addEventListener('popstate', () => {
                Router.handleRoute();
            });

            // Handle PWA install prompt
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                this.deferredPrompt = e;
                this.showInstallPrompt();
            });

            // Handle app installed
            window.addEventListener('appinstalled', () => {
                Logger.info('PWA installed');
                this.deferredPrompt = null;
            });

            // Handle service worker updates
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data.type === 'UPDATE_AVAILABLE') {
                        this.showUpdatePrompt();
                    }
                });
            }
        }

        setupConnectivityDetection() {
            window.addEventListener('online', () => {
                this.isOnline = true;
                this.updateConnectionStatus(true);
                showToast('Koneksi tersambung. Menyinkronkan data...', 'success');
                DB.processPendingSync();
            });

            window.addEventListener('offline', () => {
                this.isOnline = false;
                this.updateConnectionStatus(false);
                showToast('Koneksi terputus. Mode offline aktif.', 'warning');
            });

            // Initial status
            this.updateConnectionStatus(this.isOnline);
        }

        setupBackgroundSync() {
            if ('serviceWorker' in navigator && 'SyncManager' in window) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.sync.register('sync-data')
                        .then(() => {
                            Logger.info('Background sync registered');
                        })
                        .catch(err => {
                            Logger.error('Background sync failed:', err);
                        });
                });
            }
        }

        updateConnectionStatus(online) {
            const statusElement = document.getElementById('connection-status');
            if (statusElement) {
                const dot = statusElement.querySelector('.status-dot');
                const text = statusElement.querySelector('.status-text');
                
                if (dot && text) {
                    dot.className = `status-dot ${online ? 'online' : 'offline'}`;
                    text.textContent = online ? 'Online' : 'Offline';
                }
            }

            // Update sync button visibility
            const syncBtn = document.querySelector('.btn-sync');
            if (syncBtn) {
                syncBtn.style.display = online ? 'inline-flex' : 'none';
            }
        }

        handleKeyboardShortcuts(e) {
            // Ctrl+S - Force sync
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                API.forceSync();
                showToast('Sinkronisasi diproses', 'info');
            }

            // Ctrl+B - Backup
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                DB.exportAllData();
                showToast('Backup data berhasil', 'success');
            }

            // Ctrl+F - Search
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Escape - Close modals/sidebar
            if (e.key === 'Escape') {
                this.closeAllModals();
                document.getElementById('sidebar')?.classList.remove('open');
            }
        }

        // Loading Screen Management
        showLoadingScreen() {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'flex';
                loadingScreen.classList.add('enterprise-loading');
            }
        }

        hideLoadingScreen() {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('fade-out');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    loadingScreen.classList.remove('fade-out', 'enterprise-loading');
                }, 500);
            }
        }

        showErrorScreen(error) {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.innerHTML = `
                    <div class="error-container">
                        <div class="error-icon">⚠️</div>
                        <h2>Gagal Memuat Aplikasi</h2>
                        <p>${error.message}</p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            Muat Ulang
                        </button>
                        <button class="btn btn-secondary" onclick="window.location.href='${APP_CONFIG.BASE_PATH}/troubleshooting.html'">
                            Bantuan
                        </button>
                    </div>
                `;
            }
        }

        // Toast Notification System
        showToast(message, type = 'info', duration = 3000) {
            const toastContainer = document.getElementById('toast-container');
            if (!toastContainer) return;

            const toast = document.createElement('div');
            toast.className = `toast toast-${type} toast-enterprise`;
            toast.innerHTML = `
                <div class="toast-icon">
                    ${this.getToastIcon(type)}
                </div>
                <div class="toast-message">${message}</div>
                <button class="toast-close" onclick="this.parentElement.remove()">×</button>
                <div class="toast-progress"></div>
            `;

            toastContainer.appendChild(toast);

            // Animate in
            setTimeout(() => toast.classList.add('show'), 10);

            // Auto remove
            if (duration > 0) {
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }, duration);
            }

            // Limit toasts
            const toasts = toastContainer.children;
            if (toasts.length > 5) {
                toasts[0].remove();
            }
        }

        getToastIcon(type) {
            const icons = {
                success: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>',
                error: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>',
                warning: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/></svg>',
                info: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/></svg>'
            };
            return icons[type] || icons.info;
        }

        // Modal System
        showModal(title, content, options = {}) {
            const modalContainer = document.getElementById('modal-container');
            if (!modalContainer) return;

            const modal = document.createElement('div');
            modal.className = 'modal enterprise-modal';
            modal.innerHTML = `
                <div class="modal-overlay" onclick="${options.closable !== false ? 'App.closeModal(this.closest(\'.modal\'))' : ''}"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        ${options.closable !== false ? '<button class="modal-close" onclick="App.closeModal(this.closest(\'.modal\'))">×</button>' : ''}
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
                </div>
            `;

            modalContainer.appendChild(modal);
            this.modalStack.push(modal);

            // Animate in
            setTimeout(() => modal.classList.add('show'), 10);

            // Handle escape key
            if (options.closable !== false) {
                const escapeHandler = (e) => {
                    if (e.key === 'Escape') {
                        this.closeModal(modal);
                        document.removeEventListener('keydown', escapeHandler);
                    }
                };
                document.addEventListener('keydown', escapeHandler);
            }

            return modal;
        }

        closeModal(modal) {
            if (!modal) {
                // Close topmost modal
                modal = this.modalStack.pop();
            }
            
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.remove();
                    this.modalStack = this.modalStack.filter(m => m !== modal);
                }, 300);
            }
        }

        closeAllModals() {
            while (this.modalStack.length > 0) {
                this.closeModal(this.modalStack[this.modalStack.length - 1]);
            }
        }

        // Confirmation Dialog
        async showConfirm(message, title = 'Konfirmasi') {
            return new Promise((resolve) => {
                const content = `
                    <div class="confirm-dialog">
                        <p>${message}</p>
                    </div>
                `;
                
                const footer = `
                    <button class="btn btn-secondary" onclick="App.closeModal(); resolve(false)">Batal</button>
                    <button class="btn btn-primary" onclick="App.closeModal(); resolve(true)">OK</button>
                `;

                this.showModal(title, content, { footer });
            });
        }

        async confirmLogout() {
            const confirmed = await this.showConfirm(
                'Apakah Anda yakin ingin keluar dari sistem?',
                'Konfirmasi Keluar'
            );
            
            if (confirmed) {
                Auth.logout();
            }
        }

        // User Menu
        toggleUserMenu() {
            const existing = document.querySelector('.user-dropdown-menu');
            if (existing) {
                existing.remove();
                return;
            }

            const menu = document.createElement('div');
            menu.className = 'user-dropdown-menu';
            menu.innerHTML = `
                <div class="dropdown-header">
                    <strong>${Auth.currentUser?.nama || 'User'}</strong>
                    <small>${Auth.currentUser?.role || 'Guest'}</small>
                </div>
                <div class="dropdown-divider"></div>
                <a href="#/pengaturan" class="dropdown-item">
                    <svg viewBox="0 0 24 24" width="16" height="16"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor"/></svg>
                    Pengaturan
                </a>
                <a href="${APP_CONFIG.REPO_URL}" target="_blank" class="dropdown-item">
                    <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" fill="currentColor"/></svg>
                    Bantuan
                </a>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item text-danger" onclick="App.confirmLogout()">
                    <svg viewBox="0 0 24 24" width="16" height="16"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/></svg>
                    Keluar
                </button>
            `;

            const userInfo = document.getElementById('user-info');
            userInfo.appendChild(menu);

            // Close on outside click
            setTimeout(() => {
                document.addEventListener('click', function closeMenu(e) {
                    if (!menu.contains(e.target)) {
                        menu.remove();
                        document.removeEventListener('click', closeMenu);
                    }
                });
            }, 0);
        }

        // PWA Install Prompt
        showInstallPrompt() {
            const installBanner = document.createElement('div');
            installBanner.className = 'install-banner';
            installBanner.innerHTML = `
                <div class="install-content">
                    <img src="assets/images/icon-192x192.svg" alt="App Icon" class="install-icon">
                    <div class="install-text">
                        <strong>Install Aplikasi</strong>
                        <small>Akses cepat tanpa browser</small>
                    </div>
                    <button class="btn btn-primary btn-sm" id="install-btn">Install</button>
                    <button class="btn-icon" id="dismiss-install">×</button>
                </div>
            `;

            document.body.appendChild(installBanner);

            document.getElementById('install-btn').addEventListener('click', async () => {
                if (this.deferredPrompt) {
                    this.deferredPrompt.prompt();
                    const { outcome } = await this.deferredPrompt.userChoice;
                    Logger.info(`Install prompt: ${outcome}`);
                    this.deferredPrompt = null;
                }
                installBanner.remove();
            });

            document.getElementById('dismiss-install').addEventListener('click', () => {
                installBanner.remove();
                localStorage.setItem('install_dismissed', Date.now());
            });
        }

        // Update Prompt
        showUpdatePrompt() {
            const updateBanner = document.createElement('div');
            updateBanner.className = 'update-banner';
            updateBanner.innerHTML = `
                <div class="update-content">
                    <span>🔄 Update tersedia!</span>
                    <button class="btn btn-sm btn-primary" onclick="location.reload()">
                        Update Sekarang
                    </button>
                </div>
            `;

            document.body.appendChild(updateBanner);

            setTimeout(() => {
                updateBanner.remove();
            }, 10000);
        }
    }

    // Global toast function
    window.showToast = function(message, type, duration) {
        if (window.App) {
            window.App.showToast(message, type, duration);
        }
    };

    // Initialize app when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        window.App = new EnterpriseApp();
    });

    Logger.info('Enterprise App module loaded');
})();
