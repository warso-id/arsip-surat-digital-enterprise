// Main Application JavaScript
class App {
    constructor() {
        this.apiBaseUrl = '/api';
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.init();
    }

    /**
     * Initialize application
     */
    init() {
        this.setupAxios();
        this.setupEventListeners();
        this.checkAuth();
        this.loadComponents();
    }

    /**
     * Setup Axios defaults
     */
    setupAxios() {
        axios.defaults.baseURL = this.apiBaseUrl;
        axios.defaults.headers.common['Authorization'] = this.token ? `Bearer ${this.token}` : '';
        
        // Response interceptor
        axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && error.response.status === 401) {
                    this.logout();
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Logout button
        document.addEventListener('click', (e) => {
            if (e.target.matches('#btnLogout') || e.target.closest('#btnLogout')) {
                e.preventDefault();
                this.logout();
            }
        });

        // Toggle sidebar
        document.addEventListener('click', (e) => {
            if (e.target.matches('#btnToggleSidebar')) {
                document.querySelector('.sidebar').classList.toggle('collapsed');
            }
        });

        // Mobile menu
        document.addEventListener('click', (e) => {
            if (e.target.matches('#btnMobileMenu')) {
                document.querySelector('.sidebar').classList.toggle('show');
            }
        });
    }

    /**
     * Check authentication
     */
    async checkAuth() {
        if (!this.token) {
            if (!window.location.pathname.includes('/login') && 
                !window.location.pathname.includes('/register')) {
                window.location.href = '/login';
            }
            return;
        }

        try {
            const response = await axios.get('/auth/me');
            this.user = response.data.data;
            localStorage.setItem('user', JSON.stringify(this.user));
            this.updateUI();
        } catch (error) {
            this.logout();
        }
    }

    /**
     * Load components
     */
    loadComponents() {
        // Load notifications
        if (this.user) {
            this.loadNotifications();
            setInterval(() => this.loadNotifications(), 30000); // Refresh every 30 seconds
        }
    }

    /**
     * Load notifications
     */
    async loadNotifications() {
        try {
            const response = await axios.get('/notifications?perPage=5');
            const notifications = response.data.data;
            this.renderNotifications(notifications);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    /**
     * Render notifications
     */
    renderNotifications(notifications) {
        const container = document.getElementById('notificationList');
        if (!container) return;

        const unreadCount = notifications.unread_count || 0;
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
        }

        if (notifications.data && notifications.data.length > 0) {
            container.innerHTML = notifications.data.map(notif => `
                <a href="#" class="dropdown-item" onclick="app.markNotificationRead(${notif.id})">
                    <div class="d-flex align-items-center">
                        <div class="flex-grow-1">
                            <p class="mb-0 ${notif.is_read ? '' : 'fw-bold'}">${notif.judul}</p>
                            <small class="text-muted">${this.timeAgo(notif.created_at)}</small>
                        </div>
                        ${!notif.is_read ? '<span class="badge bg-primary rounded-pill">Baru</span>' : ''}
                    </div>
                </a>
            `).join('');
        } else {
            container.innerHTML = '<div class="text-center py-3">Tidak ada notifikasi</div>';
        }
    }

    /**
     * Mark notification as read
     */
    async markNotificationRead(id) {
        try {
            await axios.put(`/notifications/${id}/read`);
            this.loadNotifications();
        } catch (error) {
            console.error('Error marking notification:', error);
        }
    }

    /**
     * Update UI based on user
     */
    updateUI() {
        // Update user info
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = this.user.nama_lengkap;
        });

        const userRoleElements = document.querySelectorAll('.user-role');
        userRoleElements.forEach(el => {
            el.textContent = this.user.role?.nama_role || '';
        });

        // Show/hide elements based on role
        const roleBasedElements = document.querySelectorAll('[data-role]');
        roleBasedElements.forEach(el => {
            const allowedRoles = el.dataset.role.split(',');
            if (!allowedRoles.includes(this.user.role?.nama_role)) {
                el.style.display = 'none';
            }
        });
    }

    /**
     * Logout
     */
    async logout() {
        try {
            await axios.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    }

    /**
     * Show alert
     */
    showAlert(message, type = 'success') {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        const container = document.getElementById('alertContainer');
        if (container) {
            container.innerHTML = alertHtml;
            setTimeout(() => {
                const alert = container.querySelector('.alert');
                if (alert) {
                    alert.remove();
                }
            }, 5000);
        }
    }

    /**
     * Show loading
     */
    showLoading(element = 'body') {
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (target) {
            target.classList.add('loading');
        }
    }

    /**
     * Hide loading
     */
    hideLoading(element = 'body') {
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (target) {
            target.classList.remove('loading');
        }
    }

    /**
     * Format date
     */
    formatDate(date) {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Format datetime
     */
    formatDateTime(date) {
        return new Date(date).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Time ago
     */
    timeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + ' tahun yang lalu';
        
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + ' bulan yang lalu';
        
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + ' hari yang lalu';
        
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + ' jam yang lalu';
        
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + ' menit yang lalu';
        
        return 'Baru saja';
    }

    /**
     * Confirm dialog
     */
    confirm(message) {
        return new Promise((resolve) => {
            const result = confirm(message);
            resolve(result);
        });
    }

    /**
     * Format number
     */
    formatNumber(number) {
        return new Intl.NumberFormat('id-ID').format(number);
    }

    /**
     * Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Get URL parameter
     */
    getUrlParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    /**
     * Set URL parameter
     */
    setUrlParam(param, value) {
        const url = new URL(window.location);
        url.searchParams.set(param, value);
        window.history.pushState({}, '', url);
    }
}

// Initialize app
const app = new App();
