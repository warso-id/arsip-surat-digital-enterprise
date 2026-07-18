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
            if (!dashboardContent) {
                Logger.warn('Dashboard container not found');
                return;
            }

            // Cleanup previous instance
            this.cleanup();

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
                    background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
                    color: white;
                    padding: 24px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 16px;
                ">
                    <div>
                        <h2 style="margin:0 0 4px; font-size:22px;">
                            Selamat Datang, ${Auth.currentUser?.nama || 'Administrator'}
                        </h2>
                        <p style="margin:0; opacity:0.9; font-size:14px;">
                            ${currentDate} • Sistem Arsip Surat Digital Enterprise
                        </p>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-sm" style="background:rgba(255,255,255,0.2); color:white; border:1px solid rgba(255,255,255,0.3);" 
                                onclick="API.forceSync()" title="Sinkronisasi data">
                            🔄 Sync
                        </button>
                        <button class="btn btn-sm" style="background:rgba(255,255,255,0.2); color:white; border:1px solid rgba(255,255,255,0.3);" 
                                onclick="Dashboard.refreshAll()" title="Refresh dashboard">
                            🔃 Refresh
                        </button>
                    </div>
                </div>

                <!-- Stats Cards -->
                <div class="stats-grid">
                    <!-- Surat Masuk -->
                    <div class="stat-card primary" onclick="Router.navigate('/surat-masuk')" title="Klik untuk lihat Surat Masuk">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" width="28" height="28">
                                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">Total Surat Masuk</span>
                            <span class="stat-value" id="stat-masuk">0</span>
                            <span class="stat-detail" id="stat-masuk-today">Hari ini: 0</span>
                        </div>
                        <div class="stat-trend" id="stat-masuk-trend"></div>
                    </div>

                    <!-- Surat Keluar -->
                    <div class="stat-card success" onclick="Router.navigate('/surat-keluar')" title="Klik untuk lihat Surat Keluar">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" width="28" height="28">
                                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">Total Surat Keluar</span>
                            <span class="stat-value" id="stat-keluar">0</span>
                            <span class="stat-detail" id="stat-keluar-today">Hari ini: 0</span>
                        </div>
                    </div>

                    <!-- Disposisi -->
                    <div class="stat-card warning" onclick="Router.navigate('/disposisi')" title="Klik untuk lihat Disposisi">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" width="28" height="28">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">Disposisi Aktif</span>
                            <span class="stat-value" id="stat-disposisi">0</span>
                            <span class="stat-detail" id="stat-disposisi-pending">Pending: 0</span>
                        </div>
                    </div>

                    <!-- Sync Status -->
                    <div class="stat-card info" onclick="API.forceSync()" title="Klik untuk sinkronisasi">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" width="28" height="28">
                                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">Status Sinkronisasi</span>
                            <span class="stat-value" id="stat-sync">0</span>
                            <span class="stat-detail">Pending items</span>
                        </div>
                    </div>
                </div>

                <!-- Charts Row -->
                <div class="dashboard-row">
                    <div class="dashboard-card chart-card">
                        <div class="card-header">
                            <h3>📊 Statistik Surat Bulanan</h3>
                            <span class="text-muted" style="font-size:12px;">Tahun ${new Date().getFullYear()}</span>
                        </div>
                        <div class="card-body">
                            <canvas id="monthlyChart" height="280"></canvas>
                        </div>
                    </div>

                    <div class="dashboard-card chart-card">
                        <div class="card-header">
                            <h3>🍩 Distribusi Status Surat</h3>
                            <span class="text-muted" style="font-size:12px;">Semua Surat</span>
                        </div>
                        <div class="card-body">
                            <canvas id="statusChart" height="280"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Recent Activities & Quick Actions Row -->
                <div class="dashboard-row">
                    <!-- Recent Activities -->
                    <div class="dashboard-card">
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

                    <!-- Quick Stats -->
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3>⚡ Quick Info</h3>
                        </div>
                        <div class="card-body">
                            <div id="quick-info" style="display:flex; flex-direction:column; gap:12px;">
                                <div class="info-item">
                                    <span class="info-label">📄 Surat belum diproses</span>
                                    <span class="info-value" id="quick-belum-diproses">0</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">⏳ Disposisi pending</span>
                                    <span class="info-value" id="quick-pending-disposisi">0</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">📅 Surat bulan ini</span>
                                    <span class="info-value" id="quick-bulan-ini">0</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">💾 Data offline</span>
                                    <span class="info-value" id="quick-pending-sync">0</span>
                                </div>
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
                        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="currentColor"/></svg>
                        <span>Lihat Laporan</span>
                    </button>
                    <button class="action-btn" onclick="DB.exportAllData()">
                        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/></svg>
                        <span>Backup Data</span>
                    </button>
                </div>
            `;
        }

        // ============================================
        // STATISTICS
        // ============================================
        async loadStats() {
            try {
                const stats = await API.getDashboardStats();
                this.stats = stats;

                // Animate stat values
                this.animateValue('stat-masuk', 0, stats.total_surat_masuk || 0, 800);
                this.animateValue('stat-keluar', 0, stats.total_surat_keluar || 0, 800);
                this.animateValue('stat-disposisi', 0, stats.total_disposisi || 0, 800);
                this.animateValue('stat-sync', 0, stats.pending_sync || 0, 600);

                // Update detail text
                document.getElementById('stat-masuk-today').textContent = 
                    `Hari ini: ${stats.surat_masuk_hari_ini || 0}`;
                document.getElementById('stat-keluar-today').textContent = 
                    `Hari ini: ${stats.surat_keluar_hari_ini || 0}`;
                document.getElementById('stat-disposisi-pending').textContent = 
                    `Pending: ${stats.pending_disposisi || 0}`;

                // Update quick info
                document.getElementById('quick-belum-diproses').textContent = 
                    stats.surat_belum_diproses || 0;
                document.getElementById('quick-pending-disposisi').textContent = 
                    stats.pending_disposisi || 0;
                document.getElementById('quick-bulan-ini').textContent = 
                    (stats.surat_masuk_bulan_ini || 0) + (stats.surat_keluar_bulan_ini || 0);
                document.getElementById('quick-pending-sync').textContent = 
                    stats.pending_sync || 0;

            } catch (error) {
                Logger.error('Failed to load stats:', error);
                // Set default values on error
                this.setDefaultStats();
            }
        }

        setDefaultStats() {
            const elements = ['stat-masuk', 'stat-keluar', 'stat-disposisi', 'stat-sync'];
            elements.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '0';
            });
        }

        animateValue(elementId, start, end, duration = 1000) {
            const element = document.getElementById(elementId);
            if (!element) return;

            // If already at target, skip animation
            if (parseInt(element.textContent) === end) return;

            const startTime = performance.now();

            const update = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out cubic
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(easeProgress * (end - start) + start);
                
                element.textContent = current.toLocaleString('id-ID');

                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            };

            requestAnimationFrame(update);
        }

        // ============================================
        // CHARTS
        // ============================================
        async initCharts() {
            // Check if Chart.js is available
            if (typeof Chart === 'undefined') {
                await this.loadChartJS();
            }

            // Small delay to ensure canvas is rendered
            await this.delay(100);

            await this.createMonthlyChart();
            await this.createStatusChart();
        }

        async loadChartJS() {
            return new Promise((resolve, reject) => {
                // Check if already loading
                if (document.querySelector('script[src*="chart.js"]')) {
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
                    Logger.error('Failed to load Chart.js');
                    reject(new Error('Chart.js failed to load'));
                };
                document.head.appendChild(script);
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
                            backgroundColor: 'rgba(26, 115, 232, 0.7)',
                            borderColor: '#1a73e8',
                            borderWidth: 1,
                            borderRadius: 4,
                            hoverBackgroundColor: '#1a73e8'
                        },
                        {
                            label: 'Surat Keluar',
                            data: monthlyData.keluar,
                            backgroundColor: 'rgba(52, 168, 83, 0.7)',
                            borderColor: '#34a853',
                            borderWidth: 1,
                            borderRadius: 4,
                            hoverBackgroundColor: '#34a853'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: '#333',
                            titleFont: { size: 13 },
                            bodyFont: { size: 12 },
                            padding: 12,
                            cornerRadius: 8
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
                        borderWidth: 2,
                        borderColor: '#fff',
                        hoverBorderWidth: 3,
                        hoverBorderColor: '#fff'
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
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: '#333',
                            titleFont: { size: 13 },
                            bodyFont: { size: 12 },
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const value = context.parsed;
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return ` ${context.label}: ${value} (${percentage}%)`;
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
                    const date = new Date(s.tanggal_surat);
                    if (!isNaN(date) && date.getFullYear() === currentYear) {
                        masuk[date.getMonth()]++;
                    }
                });

                suratKeluar.forEach(s => {
                    const date = new Date(s.tanggal_surat);
                    if (!isNaN(date) && date.getFullYear() === currentYear) {
                        keluar[date.getMonth()]++;
                    }
                });

                return { masuk, keluar };
            } catch (error) {
                Logger.error('Failed to get monthly data:', error);
                return { 
                    masuk: new Array(12).fill(0), 
                    keluar: new Array(12).fill(0) 
                };
            }
        }

        async getStatusData() {
            try {
                const allSurat = [
                    ...(await DB.getAll('surat_masuk')),
                    ...(await DB.getAll('surat_keluar'))
                ];

                return {
                    baru: allSurat.filter(s => s.status === 'baru' || !s.status).length,
                    diproses: allSurat.filter(s => s.status === 'diproses').length,
                    selesai: allSurat.filter(s => s.status === 'selesai').length,
                    ditolak: allSurat.filter(s => s.status === 'ditolak').length
                };
            } catch (error) {
                Logger.error('Failed to get status data:', error);
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
                const suratMasuk = (await DB.getAll('surat_masuk')).slice(-5).reverse();
                const suratKeluar = (await DB.getAll('surat_keluar')).slice(-5).reverse();
                const disposisi = (await DB.getAll('disposisi')).slice(-5).reverse();

                const activities = [];
                
                suratMasuk.forEach(s => {
                    activities.push({
                        type: 'surat_masuk',
                        icon: '📨',
                        color: '#1a73e8',
                        title: 'Surat Masuk',
                        description: `${s.nomor_surat || '-'} - ${s.perihal || '-'}`,
                        time: s.created_at || s.tanggal_surat,
                        link: `#/surat-masuk?id=${s.id}`
                    });
                });

                suratKeluar.forEach(s => {
                    activities.push({
                        type: 'surat_keluar',
                        icon: '📤',
                        color: '#34a853',
                        title: 'Surat Keluar',
                        description: `${s.nomor_surat || '-'} - ${s.perihal || '-'}`,
                        time: s.created_at || s.tanggal_surat,
                        link: `#/surat-keluar?id=${s.id}`
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
                        link: `#/disposisi?id=${d.id}`
                    });
                });

                // Sort by time (newest first)
                activities.sort((a, b) => new Date(b.time) - new Date(a.time));
                
                // Show latest 8
                const latest = activities.slice(0, 8);

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
                    <div class="activity-item" onclick="window.location.href='${activity.link}'" 
                         style="cursor:pointer;" title="Klik untuk lihat detail">
                        <div class="activity-icon" style="background:${activity.color}20; color:${activity.color};">
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
            const activitiesContainer = document.getElementById('recent-activities');
            if (activitiesContainer) {
                activitiesContainer.innerHTML = '<div class="loading-placeholder">Memuat aktivitas...</div>';
            }
            await this.loadRecentActivities();
            showToast('Aktivitas diperbarui', 'info');
        }

        async refreshAll() {
            showToast('Memperbarui dashboard...', 'info');
            await this.loadStats();
            await this.loadRecentActivities();
            
            // Update charts
            if (this.charts.monthly) {
                const monthlyData = await this.getMonthlyData();
                this.charts.monthly.data.datasets[0].data = monthlyData.masuk;
                this.charts.monthly.data.datasets[1].data = monthlyData.keluar;
                this.charts.monthly.update();
            }
            
            if (this.charts.status) {
                const statusData = await this.getStatusData();
                this.charts.status.data.datasets[0].data = [
                    statusData.baru,
                    statusData.diproses,
                    statusData.selesai,
                    statusData.ditolak
                ];
                this.charts.status.update();
            }
            
            showToast('Dashboard diperbarui', 'success');
        }

        // ============================================
        // AUTO REFRESH
        // ============================================
        setupAutoRefresh() {
            // Clear existing interval
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
            }

            // Refresh stats every 30 seconds (only when dashboard is visible)
            this.refreshInterval = setInterval(() => {
                const dashboardContent = document.getElementById('dashboard-content');
                if (dashboardContent && dashboardContent.offsetParent !== null) {
                    this.loadStats();
                    this.loadRecentActivities();
                }
            }, 30000);

            // Clear interval when navigating away
            const clearOnNavigate = () => {
                const hash = window.location.hash;
                if (hash !== '#/' && hash !== '') {
                    this.cleanup();
                    window.removeEventListener('hashchange', clearOnNavigate);
                }
            };
            window.addEventListener('hashchange', clearOnNavigate);
        }

        // ============================================
        // EVENT LISTENERS
        // ============================================
        setupEventListeners() {
            // Stat card clicks handled via onclick in template
            
            // Keyboard shortcut: Ctrl+R to refresh
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'r' && !e.shiftKey) {
                    const dashboardContent = document.getElementById('dashboard-content');
                    if (dashboardContent && dashboardContent.offsetParent !== null) {
                        e.preventDefault();
                        this.refreshAll();
                    }
                }
            });
        }

        // ============================================
        // UTILITY FUNCTIONS
        // ============================================
        formatTime(timestamp) {
            if (!timestamp) return '-';
            
            try {
                const date = new Date(timestamp);
                
                // Check if valid date
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
                    year: 'numeric'
                });
            } catch (e) {
                return '-';
            }
        }

        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // ============================================
        // CLEANUP
        // ============================================
        cleanup() {
            // Clear refresh interval
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }

            // Destroy charts
            Object.entries(this.charts).forEach(([key, chart]) => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            });
            this.charts = {};

            this.isInitialized = false;
        }
    }

    // ============================================
    // INITIALIZE GLOBAL DASHBOARD
    // ============================================
    window.Dashboard = new DashboardModule();
    Logger.info('Dashboard module loaded');

})();
