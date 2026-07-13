/**
 * ============================================
 * APP.JS - Main Application Controller
 * ARSIP SURAT DIGITAL v3.2.2
 * FIXED: Session Management, Navigation, Notifications
 * ============================================
 */

const App = {
    user: null,
    token: null,
    csrf: null,
    currentPage: 'dashboard',
    initialized: false,
    theme: 'light',
    notifications: [],
    unreadCount: 0,
    connectionFailed: false,
    
    // ========== INIT ==========
    init() {
        console.log('🚀 App Initializing...');
        
        // Check authentication from localStorage
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
                this.redirectToLogin();
            }
        } else {
            this.redirectToLogin();
        }
        
        this.setupEventListeners();
        
        this.theme = localStorage.getItem('theme') || 'light';
        this.applyTheme();
        
        // Test connection after 1 second
        setTimeout(() => {
            this.testConnection();
        }, 1000);
    },
    
    // ========== REDIRECT TO LOGIN ==========
    redirectToLogin() {
        console.log('🔀 Redirecting to login page...');
        window.location.href = 'login.html';
    },
    
    // ========== TEST CONNECTION ==========
    async testConnection() {
        try {
            console.log('🔗 Testing connection to backend...');
            console.log('📍 URL:', API.baseUrl);
            
            const result = await API.get('ping', { token: null });
            console.log('📥 Connection response:', result);
            
            if (result.status === 'success') {
                console.log('📦 Backend version:', result.data?.version);
                console.log('📊 Public actions:', result.data?.publicActions);
                this.connectionFailed = false;
                showToast('success', 'Koneksi Berhasil', 'Terhubung ke server!');
            } else {
                console.warn('⚠️ Connection failed:', result);
                this.connectionFailed = true;
                showToast('error', 'Koneksi Gagal', result.message || 'Gagal terhubung ke server.');
            }
        } catch (error) {
            console.warn('⚠️ Connection test failed:', error.message);
            this.connectionFailed = true;
            showToast('error', 'Koneksi Gagal', 'Gagal terhubung ke server: ' + error.message);
        }
    },
    
    // ========== SESSION VERIFICATION ==========
    async verifySession() {
        try {
            console.log('🔐 Verifying session...');
            const response = await API.get('me', { token: this.token });
            
            if (response.status === 'success') {
                this.user = response.data.user || response.data;
                localStorage.setItem('user', JSON.stringify(this.user));
                console.log('✅ Session verified:', this.user.username);
                this.showApp();
                this.loadPage('dashboard');
                this.startNotificationPolling();
            } else {
                console.warn('⚠️ Session invalid:', response.message);
                this.clearSession();
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('❌ Session verification failed:', error);
            this.clearSession();
            this.redirectToLogin();
        }
    },
    
    // ========== SHOW/HIDE PAGES ==========
    showAuth() {
        // Tidak digunakan lagi - redirect ke login.html
        this.redirectToLogin();
    },
    
    showApp() {
        const authPage = document.getElementById('authPage');
        const mainApp = document.getElementById('mainApp');
        const loading = document.getElementById('loadingScreen');
        
        if (authPage) authPage.style.display = 'none';
        if (mainApp) mainApp.style.display = 'flex';
        if (loading) loading.style.display = 'none';
        
        if (this.user) {
            const userName = document.getElementById('userName');
            const userRole = document.getElementById('userRole');
            const userAvatar = document.getElementById('userAvatar');
            const menuUsers = document.getElementById('menuUsers');
            
            if (userName) userName.textContent = this.user.namaLengkap || this.user.username;
            if (userRole) userRole.textContent = this.user.role || 'Staff';
            if (userAvatar) userAvatar.textContent = (this.user.namaLengkap || this.user.username).charAt(0).toUpperCase();
            
            const isAdmin = this.user.role === 'admin';
            if (menuUsers) menuUsers.style.display = isAdmin ? 'flex' : 'none';
            
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
            this.redirectToLogin();
            return;
        }
        
        this.currentPage = page;
        const container = document.getElementById('pageContent');
        if (!container) return;
        
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
        const titleEl = document.getElementById('pageTitle');
        if (titleEl) titleEl.textContent = titles[page] || page;
        
        console.log('📄 Loading page:', page);
        
        try {
            let html = '';
            switch (page) {
                case 'dashboard':
                    html = typeof Dashboard !== 'undefined' ? await Dashboard.render() : '<div class="card"><p>Dashboard</p></div>';
                    break;
                case 'surat-masuk':
                    html = typeof SuratMasuk !== 'undefined' ? await SuratMasuk.render(params) : '<div class="card"><p>Surat Masuk</p></div>';
                    break;
                case 'surat-keluar':
                    html = typeof SuratKeluar !== 'undefined' ? await SuratKeluar.render(params) : '<div class="card"><p>Surat Keluar</p></div>';
                    break;
                case 'disposisi':
                    html = typeof Disposisi !== 'undefined' ? await Disposisi.render(params) : '<div class="card"><p>Disposisi</p></div>';
                    break;
                case 'approval':
                    html = typeof Approval !== 'undefined' ? await Approval.render(params) : '<div class="card"><p>Approval</p></div>';
                    break;
                case 'template':
                    html = typeof Template !== 'undefined' ? await Template.render(params) : '<div class="card"><p>Template</p></div>';
                    break;
                case 'users':
                    html = typeof Users !== 'undefined' ? await Users.render(params) : '<div class="card"><p>Users</p></div>';
                    break;
                case 'report':
                    html = typeof Report !== 'undefined' ? await Report.render(params) : '<div class="card"><p>Report</p></div>';
                    break;
                case 'settings':
                    html = typeof Settings !== 'undefined' ? await Settings.render(params) : '<div class="card"><p>Settings</p></div>';
                    break;
                default:
                    html = '<div class="card"><h3>Halaman tidak ditemukan</h3></div>';
            }
            
            container.innerHTML = html;
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
        try {
            switch (page) {
                case 'dashboard':
                    if (typeof Dashboard !== 'undefined' && typeof Dashboard.init === 'function') Dashboard.init();
                    break;
                case 'surat-masuk':
                    if (typeof SuratMasuk !== 'undefined' && typeof SuratMasuk.init === 'function') SuratMasuk.init();
                    break;
                case 'surat-keluar':
                    if (typeof SuratKeluar !== 'undefined' && typeof SuratKeluar.init === 'function') SuratKeluar.init();
                    break;
                case 'disposisi':
                    if (typeof Disposisi !== 'undefined' && typeof Disposisi.init === 'function') Disposisi.init();
                    break;
                case 'approval':
                    if (typeof Approval !== 'undefined' && typeof Approval.init === 'function') Approval.init();
                    break;
                case 'template':
                    if (typeof Template !== 'undefined' && typeof Template.init === 'function') Template.init();
                    break;
                case 'users':
                    if (typeof Users !== 'undefined' && typeof Users.init === 'function') Users.init();
                    break;
                case 'report':
                    if (typeof Report !== 'undefined' && typeof Report.init === 'function') Report.init();
                    break;
                case 'settings':
                    if (typeof Settings !== 'undefined' && typeof Settings.init === 'function') Settings.init();
                    break;
            }
        } catch (e) {
            console.warn('⚠️ Page init error:', e);
        }
    },
    
    // ========== LOGOUT HANDLER ==========
    async handleLogout() {
        try {
            if (this.token) {
                await API.get('logout', { token: this.token });
            }
        } catch (error) {
            // Ignore
        }
        
        this.clearSession();
        this.redirectToLogin();
        showToast('info', 'Logout', 'Anda telah logout');
    },
    
    // ========== NOTIFICATIONS ==========
    startNotificationPolling() {
        this.fetchNotifications();
        setInterval(() => this.fetchNotifications(), 30000);
    },
    
    async fetchNotifications() {
        if (!this.token) return;
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
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
        this.updateBadges();
    },
    
    async updateBadges() {
        if (!this.token) return;
        try {
            const response = await API.get('dashboard.stats', { token: this.token });
            if (response.status === 'success') {
                const stats = response.data;
                const smBadge = document.getElementById('smBadge');
                const skBadge = document.getElementById('skBadge');
                const dispBadge = document.getElementById('dispBadge');
                const apprBadge = document.getElementById('apprBadge');
                
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
    
    // ========== EVENT LISTENERS ==========
    setupEventListeners() {
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
        
        // Modal
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
            console.error('Error:', error);
        }
    },
    
    async readAllNotifications() {
        try {
            await API.get('notifikasi.readAll', { token: this.token });
            this.fetchNotifications();
            showToast('success', 'Berhasil', 'Semua notifikasi ditandai dibaca');
        } catch (error) {
            console.error('Error:', error);
        }
    }
};

// ========== MODAL ==========
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

// ========== TOAST ==========
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
