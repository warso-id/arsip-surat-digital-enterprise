/**
 * ============================================
 * APP.JS - Main Application Controller
 * ARSIP SURAT DIGITAL v3.2.2
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
        // Get API base from URL or config
        this.apiBase = window.API_BASE || '';
        
        // Check authentication
        this.token = localStorage.getItem('token');
        this.csrf = localStorage.getItem('csrf');
        
        if (this.token && this.csrf) {
            this.verifySession();
        } else {
            this.showAuth();
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load theme preference
        this.theme = localStorage.getItem('theme') || 'light';
        this.applyTheme();
        
        // Start notification polling
        if (this.user) {
            this.startNotificationPolling();
        }
    },
    
    // ========== SESSION VERIFICATION ==========
    async verifySession() {
        try {
            const response = await API.get('me', { token: this.token });
            if (response.status === 'success') {
                this.user = response.data;
                this.showApp();
                this.loadPage('dashboard');
            } else {
                this.clearSession();
                this.showAuth();
            }
        } catch (error) {
            this.clearSession();
            this.showAuth();
        }
    },
    
    // ========== SHOW/HIDE PAGES ==========
    showAuth() {
        document.getElementById('authPage').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('loadingScreen').style.display = 'none';
    },
    
    showApp() {
        document.getElementById('authPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';
        document.getElementById('loadingScreen').style.display = 'none';
        
        // Update user info
        if (this.user) {
            document.getElementById('userName').textContent = this.user.namaLengkap || this.user.username;
            document.getElementById('userRole').textContent = this.user.role || 'Staff';
            document.getElementById('userAvatar').textContent = (this.user.namaLengkap || this.user.username).charAt(0).toUpperCase();
            
            // Show/hide admin menus
            const isAdmin = this.user.role === 'admin';
            document.getElementById('menuUsers').style.display = isAdmin ? 'flex' : 'none';
        }
    },
    
    clearSession() {
        this.token = null;
        this.csrf = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('csrf');
        localStorage.removeItem('user');
    },
    
    // ========== PAGE LOADING ==========
    async loadPage(page, params = {}) {
        if (!this.user) return;
        
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
            console.error('Error loading page:', error);
            container.innerHTML = `
                <div class="card">
                    <h3>Error</h3>
                    <p class="text-danger">Gagal memuat halaman: ${error.message}</p>
                </div>
            `;
        }
    },
    
    executePageScripts(page) {
        switch (page) {
            case 'dashboard':
                Dashboard.init();
                break;
            case 'surat-masuk':
                SuratMasuk.init();
                break;
            case 'surat-keluar':
                SuratKeluar.init();
                break;
            case 'disposisi':
                Disposisi.init();
                break;
            case 'approval':
                Approval.init();
                break;
            case 'template':
                Template.init();
                break;
            case 'users':
                Users.init();
                break;
            case 'report':
                Report.init();
                break;
            case 'settings':
                Settings.init();
                break;
            case 'backup':
                Backup.init();
                break;
            case 'audit':
                Audit.init();
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
        
        badge.textContent = this.unreadCount;
        badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        
        // Update other badges from dashboard
        this.updateBadges();
    },
    
    async updateBadges() {
        try {
            const response = await API.get('dashboard.stats', { token: this.token });
            if (response.status === 'success') {
                const stats = response.data;
                document.getElementById('smBadge').textContent = stats.suratMasuk?.pending || 0;
                document.getElementById('skBadge').textContent = stats.suratKeluar?.pending || 0;
                document.getElementById('dispBadge').textContent = stats.disposisi?.pending || 0;
                document.getElementById('apprBadge').textContent = stats.suratKeluar?.pending || 0;
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
                document.getElementById(tab.dataset.tab + 'Form').classList.add('active');
            });
        });
        
        // Login form
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
        
        // Register form
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister();
        });
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });
        
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });
        
        // Menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page) this.loadPage(page);
                // Close sidebar on mobile
                if (window.innerWidth <= 768) {
                    document.getElementById('sidebar').classList.remove('open');
                }
            });
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Notification panel
        document.getElementById('notifBtn').addEventListener('click', () => {
            this.toggleNotificationPanel();
        });
        
        document.getElementById('notifClose').addEventListener('click', () => {
            document.getElementById('notifPanel').style.display = 'none';
        });
        
        document.getElementById('notifReadAll').addEventListener('click', () => {
            this.readAllNotifications();
        });
        
        // Modal close
        document.getElementById('modalClose').addEventListener('click', () => {
            closeModal();
        });
        document.getElementById('modalOverlay').addEventListener('click', () => {
            closeModal();
        });
        
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
            
            const response = await API.post('login', { username, password });
            
            if (response.status === 'success') {
                this.token = response.data.token;
                this.csrf = response.data.csrf;
                this.user = response.data.user;
                
                localStorage.setItem('token', this.token);
                localStorage.setItem('csrf', this.csrf);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                this.showApp();
                this.loadPage('dashboard');
                this.startNotificationPolling();
                
                showToast('success', 'Login Berhasil', `Selamat datang, ${this.user.namaLengkap || this.user.username}!`);
            } else {
                errorEl.textContent = response.message || 'Login gagal';
                errorEl.style.display = 'block';
            }
        } catch (error) {
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
            
            const response = await API.post('users.create', {
                username,
                email,
                namaLengkap: nama,
                password,
                role: 'staff'
            });
            
            if (response.status === 'success') {
                showToast('success', 'Registrasi Berhasil', 'Akun berhasil dibuat. Silakan login.');
                
                // Switch to login tab
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                document.querySelector('.auth-tab[data-tab="login"]').classList.add('active');
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                document.getElementById('loginForm').classList.add('active');
                
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
        if (panel.style.display === 'none') {
            panel.style.display = 'flex';
            this.renderNotifications();
        } else {
            panel.style.display = 'none';
        }
    },
    
    renderNotifications() {
        const body = document.getElementById('notifBody');
        
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
        
        // Click to mark as read
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
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modalFooter').innerHTML = footerHTML;
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('modalContainer').style.display = 'none';
}

// ========== TOAST FUNCTIONS ==========
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
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
    document.getElementById('progressBar').style.width = percent + '%';
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    // Show loading
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
