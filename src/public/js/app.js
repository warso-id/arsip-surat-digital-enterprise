// app.js - Enterprise Application Core
class EnterpriseApp {
    constructor() {
        this.apiBaseUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.currentUser = null;
        this.token = localStorage.getItem('enterprise_token');
        this.init();
    }

    async init() {
        this.showSpinner(true);
        await this.checkAuth();
        this.setupEventListeners();
        this.updateDateTime();
        await this.loadInitialData();
        this.showSpinner(false);
    }

    async checkAuth() {
        const authData = localStorage.getItem('auth_enterprise');
        if (authData) {
            try {
                const decoded = JSON.parse(atob(authData));
                this.currentUser = decoded;
                this.updateUserInterface();
                return true;
            } catch (error) {
                console.error('Auth check failed:', error);
                window.location.href = '/auth/login.html';
                return false;
            }
        }
    }

    async apiRequest(action, data = {}) {
        try {
            const payload = {
                action: action,
                data: btoa(JSON.stringify(data)), // Encode to Base64
                timestamp: new Date().toISOString(),
                version: '2026.1'
            };

            const response = await fetch(this.apiBaseUrl, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Enterprise-Token': this.token || '',
                    'X-Request-ID': this.generateRequestId()
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.data) {
                result.data = JSON.parse(atob(result.data)); // Decode Base64
            }

            return result;
        } catch (error) {
            console.error('API Request failed:', error);
            this.showNotification('error', 'Gagal terhubung ke server');
            throw error;
        }
    }

    generateRequestId() {
        return 'REQ-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    showSpinner(show) {
        const spinner = document.getElementById('spinner');
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
    }

    showNotification(type, message) {
        // Implementasi notifikasi
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    updateDateTime() {
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            const now = new Date();
            dateElement.textContent = now.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        setInterval(() => this.updateDateTime(), 60000);
    }

    updateUserInterface() {
        const userSection = document.getElementById('user-section');
        if (userSection && this.currentUser) {
            userSection.innerHTML = `
                <div class="user-info">
                    <img src="${this.currentUser.avatar || 'src/public/images/default-avatar.png'}" alt="Avatar" class="user-avatar">
                    <span class="user-name">${this.currentUser.nama}</span>
                    <span class="user-role">${this.currentUser.role}</span>
                    <button onclick="app.logout()" class="btn btn-sm btn-logout">Logout</button>
                </div>
            `;
        }
    }

    async loadInitialData() {
        await Promise.all([
            this.loadDashboardStats(),
            this.loadCategories(),
            this.loadInstansi()
        ]);
    }

    async loadDashboardStats() {
        try {
            const response = await this.apiRequest('getDashboardStats');
            if (response.success) {
                this.renderDashboardStats(response.data);
            }
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        }
    }

    renderDashboardStats(stats) {
        const statsContainer = document.getElementById('dashboard-stats');
        if (statsContainer && stats) {
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon incoming"></div>
                    <div class="stat-info">
                        <h3>${stats.totalSuratMasuk || 0}</h3>
                        <p>Surat Masuk</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon outgoing"></div>
                    <div class="stat-info">
                        <h3>${stats.totalSuratKeluar || 0}</h3>
                        <p>Surat Keluar</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon disposition"></div>
                    <div class="stat-info">
                        <h3>${stats.totalDisposisi || 0}</h3>
                        <p>Disposisi Aktif</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon users"></div>
                    <div class="stat-info">
                        <h3>${stats.totalPengguna || 0}</h3>
                        <p>Pengguna</p>
                    </div>
                </div>
            `;
        }
    }

    async loadCategories() {
        try {
            const response = await this.apiRequest('getCategories');
            if (response.success) {
                this.populateCategoryFilters(response.data);
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    populateCategoryFilters(categories) {
        const filters = ['filter-kategori-masuk', 'filter-kategori-keluar'];
        filters.forEach(filterId => {
            const select = document.getElementById(filterId);
            if (select && categories) {
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.nama_kategori;
                    select.appendChild(option);
                });
            }
        });
    }

    async loadInstansi() {
        try {
            const response = await this.apiRequest('getInstansi');
            if (response.success) {
                window.instansiList = response.data;
            }
        } catch (error) {
            console.error('Failed to load instansi:', error);
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('a').getAttribute('href').replace('#', '');
                this.navigateTo(section);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch(e.key) {
                    case '1': e.preventDefault(); this.navigateTo('dashboard'); break;
                    case '2': e.preventDefault(); this.navigateTo('surat-masuk'); break;
                    case '3': e.preventDefault(); this.navigateTo('surat-keluar'); break;
                    case '4': e.preventDefault(); this.navigateTo('disposisi'); break;
                    case '5': e.preventDefault(); this.navigateTo('laporan'); break;
                }
            }
        });
    }

    navigateTo(section) {
        // Update active nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${section}"]`)?.classList.add('active');

        // Show section
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(`${section}-section`)?.classList.add('active');

        // Load section data
        switch(section) {
            case 'dashboard':
                this.loadDashboardStats();
                break;
            case 'surat-masuk':
                this.loadSuratMasuk();
                break;
            case 'surat-keluar':
                this.loadSuratKeluar();
                break;
            case 'disposisi':
                this.loadDisposisi();
                break;
            case 'pengguna':
                this.loadPengguna();
                break;
        }
    }

    logout() {
        localStorage.removeItem('auth_enterprise');
        localStorage.removeItem('enterprise_token');
        window.location.href = '/auth/login.html';
    }
}

// Initialize application
const app = new EnterpriseApp();
window.app = app;
