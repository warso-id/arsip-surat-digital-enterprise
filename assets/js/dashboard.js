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
            this.isInitialized = false;
        }

        // ============================================
        // INITIALIZATION
        // ============================================
        async init() {
            const dashboardContent = document.getElementById('dashboard-content');
            if (!dashboardContent) return;

            // Render template
            dashboardContent.innerHTML = this.getDashboardTemplate();
            
            // Load data
            await this.loadStats();
            await this.initCharts();
            await this.loadRecentActivities();
            
            // Setup auto refresh & events
            this.setupAutoRefresh();
            this.setupEventListeners();
            
            this.isInitialized = true;
            Logger.info('Dashboard initialized');
        }

        // ============================================
        // TEMPLATE
        // ============================================
        getDashboardTemplate() {
            const currentDate = new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            return `
                <!-- Welcome Banner -->
                <div class="welcome-banner" style="
                    background: linear-gradient(135deg, #1a73e8, #4285f4);
                    color: white;
                    padding: 20px 24px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 16px;
                ">
                    <div>
                        <h2 style="margin:0; font-size:20px;">👋 Selamat Datang, ${Auth.currentUser?.nama || 'Administrator'}</h2>
                        <p style="margin:4px 0 0; opacity:0.9; font-size:13px;">${currentDate} • Sistem Arsip Surat Digital Enterprise</p>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-sm" style="background:rgba(255,255,255,0.2); color:white; border:1px solid rgba(255,255,255,0.3);" 
                                onclick="API.forceSync()">
                            🔄 Sync
                        </button>
                    </div>
                </div>

                <!-- Stats Cards -->
                <div class="stats-grid">
                    <div class="stat-card primary" onclick="Router.navigate('/surat-masuk')" title="Klik untuk lihat Surat Masuk">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" width="28" height="28">
                                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">Surat Masuk</span>
                            <span class="stat-value" id="stat-masuk">0</span>
                            <span class="stat-detail" id="stat-masuk-today">Hari ini: 0</span>
                        </div>
                    </div>

                    <div class="stat-card success" onclick="Router.navigate('/surat-keluar')" title="Klik untuk lihat Surat Keluar">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" width="28" height="28">
                                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">Surat Keluar</span>
                            <span class="stat-value" id="stat-keluar">0</span>
                            <span class="stat-detail" id="stat-keluar-today">Hari ini: 0</span>
                        </div>
                    </div>

                    <div class="stat-card warning" onclick="Router.navigate('/disposisi')" title="Klik untuk lihat Disposisi">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" width="28" height="28">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">Disposisi</span>
                            <span class="stat-value" id="stat-disposisi">0</span>
                            <span class="stat-detail" id="stat-disposisi-pending">Pending: 0</span>
                        </div>
                    </div>

                    <div class="stat-card info" onclick="API.forceSync()" title="Klik untuk sinkronisasi">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" width="28" height="28">
                                <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" fill="currentColor"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">Status Sync</span>
                            <span class="stat-value" id="stat-sync">0</span>
                            <span class="stat-detail" id="stat-sync-label">Pending items</span>
                        </div>
                    </div>
                </div>

                <!-- Charts Row -->
                <div class="dashboard-row">
                    <div class="dashboard-card chart-card">
                        <div class="card-header">
                            <h3>📊 Statistik Surat Bulanan</h3>
                            <span class="text-xs text-muted">Tahun ${new Date().getFullYear()}</span>
                        </div>
                        <div class="card-body">
                            <canvas id="monthlyChart" height="280"></canvas>
                        </div>
                    </div>

                    <div class="dashboard-card chart-card">
                        <div class="card-header">
                            <h3>🍩 Distribusi Status Surat</h3>
                            <span class="text-xs text-muted">Semua Surat</span>
                        </div>
                        <div class="card-body">
                            <canvas id="statusChart" height="280"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Recent Activities -->
                <div class="dashboard-row">
                    <div class="dashboard-card full-width">
                        <div class="card-header">
                            <h3>📋 Aktivitas Terbaru</h3>
                            <button class="btn btn-sm btn-secondary" onclick="Dashboard.refreshActivities()">
                                🔄 Refresh
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
                        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                        <span>Surat Masuk Baru</span>
                    </button>
                    <button class="action-btn" onclick="Router.navigate('/surat-keluar?action=tambah')">
                        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                        <span>Surat Keluar Baru</span>
                    </button>
                    <button class="action-btn" onclick="Router.navigate('/disposisi?action=tambah')">
                        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                        <span>Disposisi Baru</span>
                    </button>
                    <button class="action-btn" onclick="Router.navigate('/laporan')">
                        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/></svg>
                        <span>Lihat Laporan</span>
                    </button>
                </div>
            `;
        }

        // ============================================
        // STATS LOADING
        // ============================================
        async loadStats() {
            try {
                const stats = await API.getDashboardStats();
                this.stats = stats;

                // Animate stat values
                this.animateValue('stat-masuk', 0, stats.total_surat_masuk || 0);
                this.animateValue('stat-keluar', 0, stats.total_surat_keluar || 0);
                this.animateValue('stat-disposisi', 0, stats.total_disposisi || 0);
                this.animateValue('stat-sync', 0, stats.pending_sync || 0);

                // Update details
                document.getElementById('stat-masuk-today').textContent = 
                    `Hari ini: ${stats.surat_masuk_hari_ini || 0}`;
                document.getElementById('stat-keluar-today').textContent = 
                    `Hari ini: ${stats.surat_keluar_hari_ini || 0}`;
                document.getElementById('stat-disposisi-pending').textContent = 
                    `Pending: ${stats.pending_disposisi || 0}`;

                // Update sync label
                const syncLabel = document.getElementById('stat-sync-label');
                if (syncLabel) {
                    syncLabel.textContent = stats.pending_sync > 0 
                        ? `${stats.pending_sync} pending items` 
                        : '✅ Semua tersinkron';
                }

            } catch (error) {
                Logger.error('Failed to load stats:', error);
                this.showStatsError();
            }
        }

        animateValue(elementId, start, end) {
            const element = document.getElementById(elementId);
            if (!element) return;
            
            // If already animating, just set value
            if (element.dataset.animating === 'true') {
                element.textContent = end;
                return;
            }

            element.dataset.animating = 'true';
            const duration = 800;
            const startTime = performance.now();

            const update = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(eased * (end - start) + start);
                
                element.textContent = current;

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    element.dataset.animating = 'false';
                }
            };

            requestAnimationFrame(update);
        }

        showStatsError() {
            const ids = ['stat-masuk', 'stat-keluar', 'stat-disposisi', 'stat-sync'];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '---';
            });
            showToast('Gagal memuat statistik. Coba refresh.', 'warning');
        }

        // ============================================
        // CHARTS
        // ============================================
        async initCharts() {
            // Check if Chart.js is available
            if (typeof Chart === 'undefined') {
                await this.loadChartJS();
            }

            if (typeof Chart === 'undefined') {
                Logger.warn('Chart.js not available, skipping charts');
                this.showChartFallback();
                return;
            }

            await this.createMonthlyChart();
            await this.createStatusChart();
        }

        async loadChartJS() {
            return new Promise((resolve) => {
                // Check if already loaded
                if (typeof Chart !== 'undefined') {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
                script.onload = () => {
                    Logger.info('Chart.js loaded');
                    resolve();
                };
                script.onerror = () => {
                    Logger.warn('Chart.js failed to load');
                    resolve(); // Resolve anyway, charts will be skipped
                };
                document.head.appendChild(script);
            });
        }

        showChartFallback() {
            const chartContainers = document.querySelectorAll('.chart-card .card-body');
            chartContainers.forEach(container => {
                container.innerHTML = `
                    <div class="empty-state" style="min-height:280px; display:flex; align-items:center; justify-content:center;">
                        <div>
                            <p>📊 Chart tidak dapat dimuat</p>
                            <small class="text-muted">Periksa koneksi internet untuk memuat Chart.js</small>
                        </div>
                    </div>
                `;
            });
        }

        async createMonthlyChart() {
            const ctx = document.getElementById('monthlyChart');
            if (!ctx || typeof Chart === 'undefined') return;

            // Destroy existing chart
            if (this.charts.monthly) {
                this.charts.monthly.destroy();
            }

            const monthlyData = await this.getMonthlyData();

            this.charts.monthly = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
                    datasets: [
                        {
                            label: 'Surat Masuk',
                            data: monthlyData.masuk,
                            backgroundColor: 'rgba(26, 115, 232, 0.75)',
                            borderColor: '#1a73e8',
                            borderWidth: 1,
                            borderRadius: 4,
                            borderSkipped: false
                        },
                        {
                            label: 'Surat Keluar',
                            data: monthlyData.keluar,
                            backgroundColor: 'rgba(52, 168, 83, 0.75)',
                            borderColor: '#34a853',
                            borderWidth: 1,
                            borderRadius: 4,
                            borderSkipped: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: { size: 12 }
                            }
                        },
                        tooltip: {
                            backgroundColor: '#1a1a1a',
                            padding: 12,
                            cornerRadius: 8,
                            titleFont: { size: 13 },
                            bodyFont: { size: 12 }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                font: { size: 11 }
                            },
                            grid: {
                                color: 'rgba(0,0,0,0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: { size: 11 }
                            }
                        }
                    }
                }
            });
        }

        async createStatusChart() {
            const ctx = document.getElementById('statusChart');
            if (!ctx || typeof Chart === 'undefined') return;

            // Destroy existing chart
            if (this.charts.status) {
                this.charts.status.destroy();
            }

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
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 2,
                        hoverBorderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: { size: 12 }
                            }
                        },
                        tooltip: {
                            backgroundColor: '#1a1a1a',
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const value = context.parsed;
                                    const percent = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return ` ${context.label}: ${value} (${percent}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }

        async getMonthlyData() {
            try {
                const suratMasuk = await DB.getAll('surat_masuk');
                const suratKeluar = await DB.getAll('surat_keluar');
                const currentYear = new Date().getFullYear();

                const masuk = new Array(12).fill(0);
                const keluar = new Array(12).fill(0);

                suratMasuk.forEach(s => {
                    if (s.tanggal_surat) {
                        const date = new Date(s.tanggal_surat);
                        if (!isNaN(date) && date.getFullYear() === currentYear) {
                            masuk[date.getMonth()]++;
                        }
                    }
                });

                suratKeluar.forEach(s => {
                    if (s.tanggal_surat) {
                        const date = new Date(s.tanggal_surat);
                        if (!isNaN(date) && date.getFullYear() === currentYear) {
                            keluar[date.getMonth()]++;
                        }
                    }
                });

                return { masuk, keluar };
            } catch (error) {
                Logger.error('Error getting monthly data:', error);
                return { masuk: new Array(12).fill(0), keluar: new Array(12).fill(0) };
            }
        }

        async getStatusData() {
            try {
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
            } catch (error) {
                Logger.error('Error getting status data:', error);
                return { baru: 0, diproses: 0, selesai: 0, ditolak: 0 };
            }
        }

        // ============================================
        // RECENT ACTIVITIES
        // ============================================
        async loadRecentActivities() {
            const activitiesContainer = document.getElementById('recent-activities');
            if (!activitiesContainer) return;

            try {
                const suratMasuk = (await DB.getAll('surat_masuk')).slice(-10);
                const suratKeluar = (await DB.getAll('surat_keluar')).slice(-10);
                const disposisi = (await DB.getAll('disposisi')).slice(-10);

                const activities = [];
                
                suratMasuk.forEach(s => {
                    activities.push({
                        type: 'surat_masuk',
                        icon: '📨',
                        color: '#1a73e8',
                        title: 'Surat Masuk',
                        description: `${s.nomor_surat || 'Tanpa nomor'} - ${s.perihal || 'Tanpa perihal'}`,
                        time: s.created_at || s.tanggal_surat,
                        route: `/surat-masuk?id=${s.id}`
                    });
                });

                suratKeluar.forEach(s => {
                    activities.push({
                        type: 'surat_keluar',
                        icon: '📤',
                        color: '#34a853',
                        title: 'Surat Keluar',
                        description: `${s.nomor_surat || 'Tanpa nomor'} - ${s.perihal || 'Tanpa perihal'}`,
                        time: s.created_at || s.tanggal_surat,
                        route: `/surat-keluar?id=${s.id}`
                    });
                });

                disposisi.forEach(d => {
                    activities.push({
                        type: 'disposisi',
                        icon: '📋',
                        color: '#fbbc04',
                        title: 'Disposisi',
                        description: `Tujuan: ${d.tujuan || '-'} - ${d.instruksi || '-'}`,
                        time: d.created_at || d.tanggal_disposisi,
                        route: `/disposisi?id=${d.id}`
                    });
                });

                // Sort by time (newest first)
                activities.sort((a, b) => new Date(b.time) - new Date(a.time));
                
                // Show latest 10
                const latest = activities.slice(0, 10);

                if (latest.length === 0) {
                    activitiesContainer.innerHTML = `
                        <div class="empty-state">
                            <p>📭 Belum ada aktivitas</p>
                            <small>Data surat dan disposisi akan muncul di sini</small>
                        </div>
                    `;
                    return;
                }

                activitiesContainer.innerHTML = latest.map(activity => `
                    <div class="activity-item" onclick="Router.navigate('${activity.route}')" 
                         style="cursor:pointer;" title="Klik untuk lihat detail">
                        <div class="activity-icon" style="background:${activity.color}15; color:${activity.color};">
                            ${activity.icon}
                        </div>
                        <div class="activity-info">
                            <div class="activity-title">${activity.title}</div>
                            <div class="activity-desc">${this.escapeHtml(activity.description)}</div>
                        </div>
                        <div class="activity-time">${this.formatTime(activity.time)}</div>
                    </div>
                `).join('');

            } catch (error) {
                Logger.error('Failed to load activities:', error);
                activitiesContainer.innerHTML = `
                    <div class="error-state">
                        <p>❌ Gagal memuat aktivitas</p>
                        <button class="btn btn-sm btn-secondary" onclick="Dashboard.refreshActivities()">
                            Coba Lagi
                        </button>
                    </div>
                `;
            }
        }

        async refreshActivities() {
            const btn = document.querySelector('#recent-activities').closest('.dashboard-card').querySelector('.btn');
            if (btn) {
                btn.disabled = true;
                btn.textContent = '⏳ Memuat...';
            }
            
            await this.loadRecentActivities();
            
            if (btn) {
                btn.disabled = false;
                btn.textContent = '🔄 Refresh';
            }
            
            showToast('Aktivitas diperbarui', 'success');
        }

        formatTime(timestamp) {
            if (!timestamp) return '-';
            
            try {
                const date = new Date(timestamp);
                if (isNaN(date.getTime())) return '-';
                
                const now = new Date();
                const diff = now - date;
                
                if (diff < 60000) return 'Baru saja';
                if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
                if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
                if (diff < 604800000) return `${Math.floor(diff / 86400000)} hari lalu`;
                
                return date.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
                });
            } catch(e) {
                return timestamp;
            }
        }

        // ============================================
        // AUTO REFRESH
        // ============================================
        setupAutoRefresh() {
            // Clear existing interval
            this.clearAutoRefresh();

            // Refresh stats every 30 seconds
            this.refreshInterval = setInterval(() => {
                if (document.hidden) return; // Don't refresh if tab is hidden
                this.loadStats();
            }, 30000);

            // Clear interval when navigating away
            const hashChangeHandler = () => {
                if (window.location.hash !== '#/' && window.location.hash !== '') {
                    this.cleanup();
                    window.removeEventListener('hashchange', hashChangeHandler);
                }
            };
            window.addEventListener('hashchange', hashChangeHandler);

            // Clear on page unload
            window.addEventListener('beforeunload', () => this.cleanup());
        }

        clearAutoRefresh() {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
        }

        // ============================================
        // EVENT LISTENERS
        // ============================================
        setupEventListeners() {
            // Stat card clicks handled via onclick in template
            
            // Keyboard shortcut: Ctrl+R untuk refresh dashboard
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'r' && window.location.hash === '#/') {
                    e.preventDefault();
                    this.refreshDashboard();
                }
            });
        }

        async refreshDashboard() {
            showToast('Memperbarui dashboard...', 'info');
            await this.loadStats();
            await this.loadRecentActivities();
            showToast('Dashboard diperbarui', 'success');
        }

        // ============================================
        // UTILITY
        // ============================================
        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // ============================================
        // CLEANUP
        // ============================================
        cleanup() {
            this.clearAutoRefresh();

            // Destroy charts
            Object.values(this.charts).forEach(chart => {
                try {
                    if (chart && typeof chart.destroy === 'function') {
                        chart.destroy();
                    }
                } catch(e) {
                    // Ignore destroy errors
                }
            });
            this.charts = {};
            
            this.isInitialized = false;
            Logger.info('Dashboard cleaned up');
        }
    }

    // ============================================
    // INITIALIZE GLOBAL DASHBOARD
    // ============================================
    window.Dashboard = new DashboardModule();
    Logger.info('Dashboard module loaded');

})();
