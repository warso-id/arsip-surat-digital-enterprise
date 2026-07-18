/* ============================================
   ENTERPRISE DASHBOARD MODULE
   ============================================ */
(function() {
    'use strict';

    class DashboardModule {
        constructor() {
            this.charts = {};
            this.refreshInterval = null;
            this.stats = null;
        }

        async init() {
            const dashboardContent = document.getElementById('dashboard-content');
            if (!dashboardContent) return;

            dashboardContent.innerHTML = this.getDashboardTemplate();
            
            await this.loadStats();
            await this.initCharts();
            await this.loadRecentActivities();
            this.setupAutoRefresh();
            this.setupEventListeners();
        }

        getDashboardTemplate() {
            return `
                <!-- Stats Cards -->
                <div class="stats-grid">
                    <div class="stat-card primary">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" width="32" height="32">
                                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">Surat Masuk</span>
                            <span class="stat-value" id="stat-masuk">0</span>
                            <span class="stat-detail" id="stat-masuk-today">Hari ini: 0</span>
                        </div>
                    </div>

                    <div class="stat-card success">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" width="32" height="32">
                                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">Surat Keluar</span>
                            <span class="stat-value" id="stat-keluar">0</span>
                            <span class="stat-detail" id="stat-keluar-today">Hari ini: 0</span>
                        </div>
                    </div>

                    <div class="stat-card warning">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" width="32" height="32">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">Disposisi Aktif</span>
                            <span class="stat-value" id="stat-disposisi">0</span>
                            <span class="stat-detail" id="stat-disposisi-pending">Pending: 0</span>
                        </div>
                    </div>

                    <div class="stat-card info">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" width="32" height="32">
                                <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" fill="currentColor"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">Status Sync</span>
                            <span class="stat-value" id="stat-sync">0</span>
                            <span class="stat-detail">Pending items</span>
                        </div>
                    </div>
                </div>

                <!-- Charts Row -->
                <div class="dashboard-row">
                    <div class="dashboard-card chart-card">
                        <div class="card-header">
                            <h3>Statistik Surat Bulanan</h3>
                        </div>
                        <div class="card-body">
                            <canvas id="monthlyChart" height="300"></canvas>
                        </div>
                    </div>

                    <div class="dashboard-card chart-card">
                        <div class="card-header">
                            <h3>Distribusi Status Surat</h3>
                        </div>
                        <div class="card-body">
                            <canvas id="statusChart" height="300"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Recent Activities -->
                <div class="dashboard-row">
                    <div class="dashboard-card full-width">
                        <div class="card-header">
                            <h3>Aktivitas Terbaru</h3>
                            <button class="btn btn-sm btn-secondary" onclick="Dashboard.refreshActivities()">
                                Refresh
                            </button>
                        </div>
                        <div class="card-body">
                            <div id="recent-activities" class="activity-list">
                                <div class="loading-placeholder">Memuat aktivitas...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="quick-actions">
                    <button class="action-btn" onclick="Router.navigate('/surat-masuk?action=tambah')">
                        <svg viewBox="0 0 24 24" width="24" height="24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                        Surat Masuk Baru
                    </button>
                    <button class="action-btn" onclick="Router.navigate('/surat-keluar?action=tambah')">
                        <svg viewBox="0 0 24 24" width="24" height="24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                        Surat Keluar Baru
                    </button>
                    <button class="action-btn" onclick="Router.navigate('/disposisi?action=tambah')">
                        <svg viewBox="0 0 24 24" width="24" height="24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                        Disposisi Baru
                    </button>
                    <button class="action-btn" onclick="DB.exportAllData()">
                        <svg viewBox="0 0 24 24" width="24" height="24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/></svg>
                        Backup Data
                    </button>
                </div>
            `;
        }

        async loadStats() {
            try {
                const stats = await API.getDashboardStats();
                this.stats = stats;

                // Update stat cards with animation
                this.animateValue('stat-masuk', 0, stats.total_surat_masuk || 0);
                this.animateValue('stat-keluar', 0, stats.total_surat_keluar || 0);
                this.animateValue('stat-disposisi', 0, stats.total_disposisi || 0);
                this.animateValue('stat-sync', 0, stats.pending_sync || 0);

                document.getElementById('stat-masuk-today').textContent = 
                    `Hari ini: ${stats.surat_masuk_hari_ini || 0}`;
                document.getElementById('stat-keluar-today').textContent = 
                    `Hari ini: ${stats.surat_keluar_hari_ini || 0}`;
                document.getElementById('stat-disposisi-pending').textContent = 
                    `Pending: ${stats.pending_disposisi || 0}`;

            } catch (error) {
                Logger.error('Failed to load stats:', error);
                showToast('Gagal memuat statistik', 'error');
            }
        }

        animateValue(elementId, start, end) {
            const element = document.getElementById(elementId);
            if (!element) return;

            const duration = 1000;
            const startTime = performance.now();

            const update = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const current = Math.floor(progress * (end - start) + start);
                
                element.textContent = current;

                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            };

            requestAnimationFrame(update);
        }

        async initCharts() {
            // Check if Chart.js is available
            if (typeof Chart === 'undefined') {
                await this.loadChartJS();
            }

            await this.createMonthlyChart();
            await this.createStatusChart();
        }

        async loadChartJS() {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        async createMonthlyChart() {
            const ctx = document.getElementById('monthlyChart');
            if (!ctx || typeof Chart === 'undefined') return;

            // Get monthly data
            const monthlyData = await this.getMonthlyData();

            this.charts.monthly = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
                    datasets: [
                        {
                            label: 'Surat Masuk',
                            data: monthlyData.masuk,
                            backgroundColor: 'rgba(26, 115, 232, 0.7)',
                            borderColor: '#1a73e8',
                            borderWidth: 1
                        },
                        {
                            label: 'Surat Keluar',
                            data: monthlyData.keluar,
                            backgroundColor: 'rgba(52, 168, 83, 0.7)',
                            borderColor: '#34a853',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }

        async createStatusChart() {
            const ctx = document.getElementById('statusChart');
            if (!ctx || typeof Chart === 'undefined') return;

            const statusData = await this.getStatusData();

            this.charts.status = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Baru', 'Diproses', 'Selesai', 'Ditolak'],
                    datasets: [{
                        data: [
                            statusData.baru || 0,
                            statusData.diproses || 0,
                            statusData.selesai || 0,
                            statusData.ditolak || 0
                        ],
                        backgroundColor: [
                            '#1a73e8',
                            '#fbbc04',
                            '#34a853',
                            '#ea4335'
                        ]
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

        async getMonthlyData() {
            // Calculate from local data
            const suratMasuk = await DB.getAll('surat_masuk');
            const suratKeluar = await DB.getAll('surat_keluar');
            const currentYear = new Date().getFullYear();

            const masuk = new Array(12).fill(0);
            const keluar = new Array(12).fill(0);

            suratMasuk.forEach(s => {
                const date = new Date(s.tanggal_surat);
                if (date.getFullYear() === currentYear) {
                    masuk[date.getMonth()]++;
                }
            });

            suratKeluar.forEach(s => {
                const date = new Date(s.tanggal_surat);
                if (date.getFullYear() === currentYear) {
                    keluar[date.getMonth()]++;
                }
            });

            return { masuk, keluar };
        }

        async getStatusData() {
            const allSurat = [
                ...(await DB.getAll('surat_masuk')),
                ...(await DB.getAll('surat_keluar'))
            ];

            return {
                baru: allSurat.filter(s => s.status === 'baru').length,
                diproses: allSurat.filter(s => s.status === 'diproses').length,
                selesai: allSurat.filter(s => s.status === 'selesai').length,
                ditolak: allSurat.filter(s => s.status === 'ditolak').length
            };
        }

        async loadRecentActivities() {
            const activitiesContainer = document.getElementById('recent-activities');
            if (!activitiesContainer) return;

            try {
                // Get combined recent data
                const suratMasuk = (await DB.getAll('surat_masuk')).slice(-5);
                const suratKeluar = (await DB.getAll('surat_keluar')).slice(-5);
                const disposisi = (await DB.getAll('disposisi')).slice(-5);

                const activities = [];
                
                suratMasuk.forEach(s => {
                    activities.push({
                        type: 'surat_masuk',
                        icon: '📨',
                        title: 'Surat Masuk Baru',
                        description: `${s.nomor_surat} - ${s.perihal}`,
                        time: s.created_at
                    });
                });

                suratKeluar.forEach(s => {
                    activities.push({
                        type: 'surat_keluar',
                        icon: '📤',
                        title: 'Surat Keluar Baru',
                        description: `${s.nomor_surat} - ${s.perihal}`,
                        time: s.created_at
                    });
                });

                disposisi.forEach(d => {
                    activities.push({
                        type: 'disposisi',
                        icon: '📋',
                        title: 'Disposisi Baru',
                        description: `Tujuan: ${d.tujuan}`,
                        time: d.created_at
                    });
                });

                // Sort by time
                activities.sort((a, b) => new Date(b.time) - new Date(a.time));
                
                // Show latest 10
                const latest = activities.slice(0, 10);

                if (latest.length === 0) {
                    activitiesContainer.innerHTML = `
                        <div class="empty-state">
                            <p>Belum ada aktivitas</p>
                        </div>
                    `;
                    return;
                }

                activitiesContainer.innerHTML = latest.map(activity => `
                    <div class="activity-item">
                        <div class="activity-icon">${activity.icon}</div>
                        <div class="activity-info">
                            <div class="activity-title">${activity.title}</div>
                            <div class="activity-desc">${activity.description}</div>
                        </div>
                        <div class="activity-time">${this.formatTime(activity.time)}</div>
                    </div>
                `).join('');

            } catch (error) {
                Logger.error('Failed to load activities:', error);
                activitiesContainer.innerHTML = `
                    <div class="error-state">
                        <p>Gagal memuat aktivitas</p>
                    </div>
                `;
            }
        }

        formatTime(timestamp) {
            if (!timestamp) return '-';
            
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            
            if (diff < 60000) return 'Baru saja';
            if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
            if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
            if (diff < 604800000) return `${Math.floor(diff / 86400000)} hari lalu`;
            
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }

        async refreshActivities() {
            await this.loadRecentActivities();
            showToast('Aktivitas diperbarui', 'info');
        }

        setupAutoRefresh() {
            // Refresh stats every 30 seconds
            this.refreshInterval = setInterval(() => {
                this.loadStats();
            }, 30000);

            // Clear interval when navigating away
            window.addEventListener('hashchange', () => {
                if (window.location.hash !== '#/') {
                    this.cleanup();
                }
            });
        }

        setupEventListeners() {
            // Add click handlers for stat cards
            document.querySelector('.stat-card.primary')?.addEventListener('click', () => {
                Router.navigate('/surat-masuk');
            });

            document.querySelector('.stat-card.success')?.addEventListener('click', () => {
                Router.navigate('/surat-keluar');
            });

            document.querySelector('.stat-card.warning')?.addEventListener('click', () => {
                Router.navigate('/disposisi');
            });
        }

        cleanup() {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }

            // Destroy charts
            Object.values(this.charts).forEach(chart => {
                if (chart) chart.destroy();
            });
            this.charts = {};
        }
    }

    // Initialize Global Dashboard
    window.Dashboard = new DashboardModule();
    Logger.info('Dashboard module loaded');
})();
