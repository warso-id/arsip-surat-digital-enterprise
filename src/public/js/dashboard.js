// dashboard.js - Enterprise Dashboard Module
class DashboardModule {
    constructor(app) {
        this.app = app;
        this.charts = {};
    }

    async loadDashboard() {
        try {
            const response = await this.app.apiRequest('getDashboardStats');
            if (response.success) {
                this.renderStats(response.data);
                this.renderRecentActivities(response.data.recentActivities);
                this.initCharts(response.data);
            }
        } catch (error) {
            console.error('Dashboard load failed:', error);
            this.app.showToast('Gagal memuat dashboard', 'error');
        }
    }

    renderStats(stats) {
        const container = document.getElementById('dashboard-stats');
        if (!container) return;

        const statCards = [
            {
                icon: '📥',
                title: 'Surat Masuk',
                value: stats.totalSuratMasuk || 0,
                color: 'primary',
                subtitle: `Bulan ini: ${stats.suratMasukBulanIni || 0}`
            },
            {
                icon: '📤',
                title: 'Surat Keluar',
                value: stats.totalSuratKeluar || 0,
                color: 'success',
                subtitle: `Bulan ini: ${stats.suratKeluarBulanIni || 0}`
            },
            {
                icon: '📋',
                title: 'Disposisi Aktif',
                value: stats.disposisiAktif || 0,
                color: 'warning',
                subtitle: `Total: ${stats.totalDisposisi || 0}`
            },
            {
                icon: '👥',
                title: 'Pengguna',
                value: stats.totalPengguna || 0,
                color: 'info',
                subtitle: `Aktif: ${stats.penggunaAktif || 0}`
            },
            {
                icon: '📁',
                title: 'Kategori',
                value: stats.totalKategori || 0,
                color: 'secondary',
                subtitle: 'Kategori surat'
            },
            {
                icon: '🏢',
                title: 'Instansi',
                value: stats.totalInstansi || 0,
                color: 'dark',
                subtitle: 'Instansi terdaftar'
            }
        ];

        container.innerHTML = statCards.map(card => `
            <div class="stat-card stat-card-${card.color}">
                <div class="stat-icon">${card.icon}</div>
                <div class="stat-content">
                    <h3 class="stat-value">${card.value}</h3>
                    <p class="stat-title">${card.title}</p>
                    <small class="stat-subtitle">${card.subtitle}</small>
                </div>
            </div>
        `).join('');
    }

    renderRecentActivities(activities) {
        const container = document.getElementById('recent-activities');
        if (!container) return;

        if (!activities || activities.length === 0) {
            container.innerHTML = '<p class="empty-text">Belum ada aktivitas terbaru</p>';
            return;
        }

        container.innerHTML = activities.slice(0, 10).map(activity => `
            <div class="activity-item">
                <div class="activity-icon activity-${activity.type}">
                    ${this.getActivityIcon(activity.type)}
                </div>
                <div class="activity-content">
                    <p class="activity-text">${activity.description}</p>
                    <small class="activity-time">${this.formatTime(activity.timestamp)}</small>
                </div>
                <div class="activity-user">
                    <img src="${activity.user_avatar || 'src/public/images/default-avatar.png'}" 
                         alt="${activity.user_name}" class="user-avatar-sm">
                    <span>${activity.user_name}</span>
                </div>
            </div>
        `).join('');
    }

    getActivityIcon(type) {
        const icons = {
            'create': '➕',
            'update': '✏️',
            'delete': '🗑️',
            'disposisi': '📋',
            'login': '🔑',
            'logout': '🚪'
        };
        return icons[type] || '📌';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Baru saja';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} menit yang lalu`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam yang lalu`;
        
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    initCharts(data) {
        // Initialize charts if chart library is available
        if (typeof Chart !== 'undefined') {
            this.initSuratChart(data);
            this.initDisposisiChart(data);
        }
    }

    initSuratChart(data) {
        const ctx = document.getElementById('surat-chart');
        if (!ctx) return;

        if (this.charts.surat) {
            this.charts.surat.destroy();
        }

        this.charts.surat = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.chartLabels || [],
                datasets: [{
                    label: 'Surat Masuk',
                    data: data.suratMasukData || [],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Surat Keluar',
                    data: data.suratKeluarData || [],
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    initDisposisiChart(data) {
        const ctx = document.getElementById('disposisi-chart');
        if (!ctx) return;

        if (this.charts.disposisi) {
            this.charts.disposisi.destroy();
        }

        this.charts.disposisi = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Selesai', 'Proses', 'Pending'],
                datasets: [{
                    data: [
                        data.disposisiSelesai || 0,
                        data.disposisiProses || 0,
                        data.disposisiPending || 0
                    ],
                    backgroundColor: ['#4CAF50', '#FF9800', '#F44336']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    async refreshDashboard() {
        this.app.showSpinner(true);
        await this.loadDashboard();
        this.app.showSpinner(false);
        this.app.showToast('Dashboard diperbarui', 'success');
    }
}

// Initialize when app is ready
window.dashboardModule = new DashboardModule(window.enterpriseApp);
