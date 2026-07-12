/**
 * ============================================
 * APP.JS - Main Application Controller
 * ARSIP SURAT DIGITAL v3.2.2
 * FIXED: Login & Session Management
 * ============================================
 */

// ========== APP STATE ==========
const App = {
    user: null,
    token: null,
    csrf: null,
    currentPage: 'dashboard',
    apiBase: '',
    initialized: false,
    theme: 'light',
    notifications: [],
    unreadCount: 0,
    
    // ========== INIT ==========
    init() {
        console.log('🚀 App Initializing...');
        
        // Get API base
        this.apiBase = API.baseUrl || window.API_BASE || '';
        
        // Check authentication
        this.token = localStorage.getItem('token');
        this.csrf = localStorage.getItem('csrf');
        const savedUser = localStorage.getItem('user');
        
        console.log('🔐 Auth Check:', { 
            hasToken: !!this.token, 
            hasCsrf: !!this.csrf, 
            hasUser: !!savedUser 
        });
        
        if (this.token && this.csrf && savedUser) {
            try {
                this.user = JSON.parse(savedUser);
                console.log('👤 User loaded from storage:', this.user.username);
                this.showApp();
                this.loadPage('dashboard');
                this.startNotificationPolling();
            } catch (e) {
                console.error('Error parsing user:', e);
                this.clearSession();
                this.showAuth();
            }
        } else if (this.token && this.csrf) {
            // Verify session
            this.verifySession();
        } else {
            this.showAuth();
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load theme preference
        this.theme = localStorage.getItem('theme') || 'light';
        this.applyTheme();
        
        // Test connection
        this.testConnection();
    },
    
    // ========== TEST CONNECTION ==========
    async testConnection() {
        try {
            console.log('🔗 Testing connection to backend...');
            const result = await API.get('ping');
            console.log('✅ Connection successful:', result);
            
            if (result.status === 'success') {
                console.log('📦 Backend version:', result.data?.version);
                console.log('📊 Features:', result.data?.features);
            }
        } catch (error) {
            console.warn('⚠️ Connection test failed:', error.message);
            showToast('warning', 'Koneksi', 'Gagal terhubung ke server. Periksa koneksi internet.');
        }
    },
    
    // ========== SESSION VERIFICATION ==========
    async verifySession() {
        try {
            console.log('🔐 Verifying session...');
            const response = await API.get('me', { token: this.token });
            
            if (response.status === 'success') {
                this.user = response.data;
                localStorage.setItem('user', JSON.stringify(this.user));
                console.log('✅ Session verified:', this.user.username);
                this.showApp();
                this.loadPage('dashboard');
                this.startNotificationPolling();
            } else {
                console.warn('⚠️ Session invalid:', response.message);
                this.clearSession();
                this.showAuth();
            }
        } catch (error) {
            console.error('❌ Session verification failed:', error);
            this.clearSession();
            this.showAuth();
        }
    },
    
    // ========== SHOW/HIDE PAGES ==========
    showAuth() {
        document.getElementById('authPage').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('loadingScreen').style.display = 'none';
        console.log('📄 Showing Auth Page');
    },
    
    showApp() {
        document.getElementById('authPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';
        document.getElementById('loadingScreen').style.display = 'none';
        
        if (this.user) {
            document.getElementById('userName').textContent = this.user.namaLengkap || this.user.username;
            document.getElementById('userRole').textContent = this.user.role || 'Staff';
            document.getElementById('userAvatar').textContent = (this.user.namaLengkap || this.user.username).charAt(0).toUpperCase();
            
            const isAdmin = this.user.role === 'admin';
            document.getElementById('menuUsers').style.display = isAdmin ? 'flex' : 'none';
            console.log('👤 User logged in:', this.user.username, 'Role:', this.user.role);
        }
    },
    
    clearSession() {
        this.token = null;
        this.csrf = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('csrf');
        localStorage.removeItem('user');
        console.log('🔐 Session cleared');
    },
    
    // ========== PAGE LOADING ==========
    async loadPage(page, params = {}) {
        if (!this.user) {
            console.warn('⚠️ Cannot load page: No user');
            return;
        }
        
        this.currentPage = page;
        const container = document.getElementById('pageContent');
        
        // Update active menu
        document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
        const menuItem = document.querySelector(`.menu-item[data-page="${page}"]`);
        if (menuItem) menuItem.classList.add('active');
        
        // Update title
        const titles = {
            dashboard: 'Dashboard',
            'surat-masuk': 'Surat Masuk',
            'surat-keluar': 'Surat Keluar',
            disposisi: 'Disposisi',
            approval: 'Approval',
            template: 'Template Surat',
            users: 'Pengguna',
            report: 'Laporan',
            settings: 'Pengaturan',
            backup: 'Backup & Restore',
            audit: 'Audit Log'
        };
        document.getElementById('pageTitle').textContent = titles[page] || page;
        
        console.log('📄 Loading page:', page);
        
        // Load page content
        try {
            let html = '';
            switch (page) {
                case 'dashboard':
                    html = await Dashboard.render();
                    break;
                case 'surat-masuk':
                    html = await SuratMasuk.render(params);
                    break;
                case 'surat-keluar':
                    html = await SuratKeluar.render(params);
                    break;
                case 'disposisi':
                    html = await Disposisi.render(params);
                    break;
                case 'approval':
                    html = await Approval.render(params);
                    break;
                case 'template':
                    html = await Template.render(params);
                    break;
                case 'users':
                    html = await Users.render(params);
                    break;
                case 'report':
                    html = await Report.render(params);
                    break;
                case 'settings':
                    html = await Settings.render(params);
                    break;
                case 'backup':
                    html = await Backup.render(params);
                    break;
                case 'audit':
                    html = await Audit.render(params);
                    break;
                default:
                    html = '<div class="card"><h3>Halaman tidak ditemukan</h3></div>';
            }
            
            container.innerHTML = html;
            
            // Execute page-specific scripts
            this.executePageScripts(page);
            
        } catch (error) {
            console.error('❌ Error loading page:', error);
            container.innerHTML = `
                <div class="card">
                    <h3>Error</h3>
                    <p class="text-danger">Gagal memuat halaman: ${error.message}</p>
                    <button class="btn btn-primary mt-2" onclick="App.loadPage('${page}')">
                        <i class="fas fa-sync"></i> Coba Lagi
                    </button>
                </div>
            `;
        }
    },
    
    executePageScripts(page) {
        switch (page) {
            case 'dashboard':
                if (typeof Dashboard.init === 'function') Dashboard.init();
                break;
            case 'surat-masuk':
                if (typeof SuratMasuk.init === 'function') SuratMasuk.init();
                break;
            case 'surat-keluar':
                if (typeof SuratKeluar.init === 'function') SuratKeluar.init();
                break;
            case 'disposisi':
                if (typeof Disposisi.init === 'function') Disposisi.init();
                break;
            case 'approval':
                if (typeof Approval.init === 'function') Approval.init();
                break;
            case 'template':
                if (typeof Template.init === 'function') Template.init();
                break;
            case 'users':
                if (typeof Users.init === 'function') Users.init();
                break;
            case 'report':
                if (typeof Report.init === 'function') Report.init();
                break;
            case 'settings':
                if (typeof Settings.init === 'function') Settings.init();
                break;
            case 'backup':
                if (typeof Backup.init === 'function') Backup.init();
                break;
            case 'audit':
                if (typeof Audit.init === 'function') Audit.init();
                break;
        }
    },
    
    // ========== NOTIFICATIONS ==========
    startNotificationPolling() {
        this.fetchNotifications();
        setInterval(() => this.fetchNotifications(), 30000);
    },
    
    async fetchNotifications() {
        try {
            const response = await API.get('notifikasi.list', { token: this.token });
            if (response.status === 'success') {
                this.notifications = response.data.items || [];
                this.unreadCount = this.notifications.filter(n => !n.isRead).length;
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    },
    
    updateNotificationBadge() {
        const badge = document.getElementById('notifBadge');
        const smBadge = document.getElementById('smBadge');
        const skBadge = document.getElementById('skBadge');
        const dispBadge = document.getElementById('dispBadge');
        const apprBadge = document.getElementById('apprBadge');
        
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
        
        // Update other badges from dashboard
        this.updateBadges();
    },
    
    async updateBadges() {
        try {
            const response = await API.get('dashboard.stats', { token: this.token });
            if (response.status === 'success') {
                const stats = response.data;
                if (smBadge) smBadge.textContent = stats.suratMasuk?.pending || 0;
                if (skBadge) skBadge.textContent = stats.suratKeluar?.pending || 0;
                if (dispBadge) dispBadge.textContent = stats.disposisi?.pending || 0;
                if (apprBadge) apprBadge.textContent = stats.suratKeluar?.pending || 0;
            }
        } catch (error) {
            console.error('Error updating badges:', error);
        }
    },
    
    // ========== THEME ==========
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    },
    
    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    },
    
    // ========== SETUP EVENT LISTENERS ==========
    setupEventListeners() {
        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                const formId = tab.dataset.tab + 'Form';
                const form = document.getElementById(formId);
                if (form) form.classList.add('active');
            });
        });
        
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }
        
        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegister();
            });
        }
        
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
        
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('collapsed');
            });
        }
        
        // Menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page) this.loadPage(page);
                if (window.innerWidth <= 768) {
                    document.getElementById('sidebar').classList.remove('open');
                }
            });
        });
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Notification panel
        const notifBtn = document.getElementById('notifBtn');
        if (notifBtn) {
            notifBtn.addEventListener('click', () => {
                this.toggleNotificationPanel();
            });
        }
        
        const notifClose = document.getElementById('notifClose');
        if (notifClose) {
            notifClose.addEventListener('click', () => {
                document.getElementById('notifPanel').style.display = 'none';
            });
        }
        
        const notifReadAll = document.getElementById('notifReadAll');
        if (notifReadAll) {
            notifReadAll.addEventListener('click', () => {
                this.readAllNotifications();
            });
        }
        
        // Modal close
        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', closeModal);
        }
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', closeModal);
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.getElementById('notifPanel').style.display = 'none';
            }
        });
    },
    
    // ========== AUTH HANDLERS ==========
    async handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const errorEl = document.getElementById('loginError');
        
        if (!username || !password) {
            errorEl.textContent = 'Username dan password harus diisi';
            errorEl.style.display = 'block';
            return;
        }
        
        try {
            errorEl.style.display = 'none';
            console.log('🔐 Attempting login for:', username);
            
            const response = await API.post('login', { username, password });
            console.log('📥 Login response:', response);
            
            if (response.status === 'success') {
                this.token = response.data.token;
                this.csrf = response.data.csrf;
                this.user = response.data.user;
                
                localStorage.setItem('token', this.token);
                localStorage.setItem('csrf', this.csrf);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                console.log('✅ Login successful:', this.user.username);
                
                this.showApp();
                this.loadPage('dashboard');
                this.startNotificationPolling();
                
                showToast('success', 'Login Berhasil', `Selamat datang, ${this.user.namaLengkap || this.user.username}!`);
            } else {
                console.warn('⚠️ Login failed:', response.message);
                errorEl.textContent = response.message || 'Login gagal';
                errorEl.style.display = 'block';
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            errorEl.textContent = error.message || 'Terjadi kesalahan saat login';
            errorEl.style.display = 'block';
        }
    },
    
    async handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const nama = document.getElementById('registerNama').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirm = document.getElementById('registerConfirm').value;
        const errorEl = document.getElementById('registerError');
        
        if (!username || !email || !nama || !password || !confirm) {
            errorEl.textContent = 'Semua field harus diisi';
            errorEl.style.display = 'block';
            return;
        }
        
        if (password !== confirm) {
            errorEl.textContent = 'Password dan konfirmasi password tidak cocok';
            errorEl.style.display = 'block';
            return;
        }
        
        if (password.length < 8) {
            errorEl.textContent = 'Password minimal 8 karakter';
            errorEl.style.display = 'block';
            return;
        }
        
        try {
            errorEl.style.display = 'none';
            console.log('📝 Registering user:', username);
            
            const response = await API.post('users.create', {
                username,
                email,
                namaLengkap: nama,
                password,
                role: 'staff'
            });
            
            console.log('📥 Register response:', response);
            
            if (response.status === 'success') {
                showToast('success', 'Registrasi Berhasil', 'Akun berhasil dibuat. Silakan login.');
                
                // Switch to login tab
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
                if (loginTab) loginTab.classList.add('active');
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                const loginForm = document.getElementById('loginForm');
                if (loginForm) loginForm.classList.add('active');
                
                // Clear register form
                document.getElementById('registerUsername').value = '';
                document.getElementById('registerEmail').value = '';
                document.getElementById('registerNama').value = '';
                document.getElementById('registerPassword').value = '';
                document.getElementById('registerConfirm').value = '';
                
                // Fill login form
                document.getElementById('loginUsername').value = username;
            } else {
                errorEl.textContent = response.message || 'Registrasi gagal';
                errorEl.style.display = 'block';
            }
        } catch (error) {
            console.error('❌ Register error:', error);
            errorEl.textContent = error.message || 'Terjadi kesalahan saat registrasi';
            errorEl.style.display = 'block';
        }
    },
    
    async handleLogout() {
        try {
            if (this.token) {
                await API.get('logout', { token: this.token });
            }
        } catch (error) {
            // Ignore logout errors
        }
        
        this.clearSession();
        this.showAuth();
        showToast('info', 'Logout', 'Anda telah logout');
    },
    
    // ========== NOTIFICATION PANEL ==========
    toggleNotificationPanel() {
        const panel = document.getElementById('notifPanel');
        if (!panel) return;
        
        if (panel.style.display === 'none' || panel.style.display === '') {
            panel.style.display = 'flex';
            this.renderNotifications();
        } else {
            panel.style.display = 'none';
        }
    },
    
    renderNotifications() {
        const body = document.getElementById('notifBody');
        if (!body) return;
        
        if (this.notifications.length === 0) {
            body.innerHTML = `
                <div class="notif-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>Tidak ada notifikasi</p>
                </div>
            `;
            return;
        }
        
        body.innerHTML = this.notifications.slice(0, 50).map(n => `
            <div class="notif-item ${n.isRead ? '' : 'unread'}" data-id="${n.id}">
                <div class="notif-title">${n.judul}</div>
                <div class="notif-text">${n.pesan}</div>
                <div class="notif-time">${Utils.timeAgo(n.createdAt)}</div>
            </div>
        `).join('');
        
        body.querySelectorAll('.notif-item.unread').forEach(el => {
            el.addEventListener('click', () => {
                this.markNotificationRead(el.dataset.id);
            });
        });
    },
    
    async markNotificationRead(id) {
        try {
            await API.get('notifikasi.read', { token: this.token, id });
            this.fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    },
    
    async readAllNotifications() {
        try {
            await API.get('notifikasi.readAll', { token: this.token });
            this.fetchNotifications();
            showToast('success', 'Berhasil', 'Semua notifikasi ditandai dibaca');
        } catch (error) {
            console.error('Error reading all notifications:', error);
        }
    }
};

// ========== MODAL FUNCTIONS ==========
function openModal(title, bodyHTML, footerHTML = '') {
    const modal = document.getElementById('modalContainer');
    const titleEl = document.getElementById('modalTitle');
    const bodyEl = document.getElementById('modalBody');
    const footerEl = document.getElementById('modalFooter');
    
    if (!modal || !titleEl || !bodyEl || !footerEl) return;
    
    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHTML;
    footerEl.innerHTML = footerHTML;
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('modalContainer');
    if (modal) modal.style.display = 'none';
}

// ========== TOAST FUNCTIONS ==========
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
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
        <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    container.appendChild(toast);
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ========== LOADING PROGRESS ==========
function updateLoadingProgress(percent) {
    const bar = document.getElementById('progressBar');
    if (bar) bar.style.width = percent + '%';
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, initializing app...');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;
        updateLoadingProgress(progress);
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                App.init();
            }, 300);
        }
    }, 150);
});

console.log('📦 App Module Loaded');
