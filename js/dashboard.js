/**
 * ============================================
 * DASHBOARD.JS - Dashboard Module
 * ARSIP SURAT DIGITAL v3.2.2
 * FULL FEATURES - RESPONSIVE - SYNC BACKEND
 * ============================================
 */

const Dashboard = {
    chartInstances: {},
    refreshInterval: null,
    statsCache: null,
    lastUpdate: null,
    
    // ========== RENDER ==========
    async render() {
        return `
            <div class="dashboard-page">
                <!-- Stats Grid -->
                <div class="stats-grid" id="statsGrid">
                    <div class="stat-card">
                        <div class="stat-icon blue"><i class="fas fa-inbox"></i></div>
                        <div class="stat-number" id="statSMTotal">0</div>
                        <div class="stat-label">Total Surat Masuk</div>
                        <div class="stat-change up" id="smChange"><i class="fas fa-arrow-up"></i> 0%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon green"><i class="fas fa-paper-plane"></i></div>
                        <div class="stat-number" id="statSKTotal">0</div>
                        <div class="stat-label">Total Surat Keluar</div>
                        <div class="stat-change up" id="skChange"><i class="fas fa-arrow-up"></i> 0%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon orange"><i class="fas fa-clipboard-list"></i></div>
                        <div class="stat-number" id="statDispTotal">0</div>
                        <div class="stat-label">Total Disposisi</div>
                        <div class="stat-change up" id="dispChange"><i class="fas fa-arrow-up"></i> 0%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon purple"><i class="fas fa-check-double"></i></div>
                        <div class="stat-number" id="statApprovalPending">0</div>
                        <div class="stat-label">Approval Pending</div>
                        <div class="stat-change down" id="apprChange"><i class="fas fa-arrow-down"></i> 0%</div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="card" style="margin-bottom: 20px;">
                    <div class="card-header">
                        <h3><i class="fas fa-bolt"></i> Aksi Cepat</h3>
                    </div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="App.loadPage('surat-masuk')">
                            <i class="fas fa-inbox"></i> Surat Masuk
                        </button>
                        <button class="btn btn-success" onclick="App.loadPage('surat-keluar')">
                            <i class="fas fa-paper-plane"></i> Surat Keluar
                        </button>
                        <button class="btn btn-warning" onclick="App.loadPage('disposisi')">
                            <i class="fas fa-clipboard-list"></i> Disposisi
                        </button>
                        <button class="btn btn-info" onclick="App.loadPage('approval')">
                            <i class="fas fa-check-double"></i> Approval
                        </button>
                    </div>
                </div>
                
                <!-- Charts Section -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-chart-bar"></i> Statistik Surat</h3>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <select id="chartYear" class="form-control" style="width: auto; padding: 4px 8px; font-size: 12px;">
                                    ${this.getYearOptions()}
                                </select>
                                <button class="btn btn-sm btn-outline" id="refreshChartBtn" title="Refresh Chart">
                                    <i class="fas fa-sync"></i>
                                </button>
                            </div>
                        </div>
                        <div style="position: relative; height: 250px;">
                            <canvas id="chartMain"></canvas>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-chart-pie"></i> Distribusi Status</h3>
                            <button class="btn btn-sm btn-outline" id="refreshPieBtn" title="Refresh Pie">
                                <i class="fas fa-sync"></i>
                            </button>
                        </div>
                        <div style="position: relative; height: 250px;">
                            <canvas id="chartPie"></canvas>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Activity -->
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-history"></i> Aktivitas Terbaru</h3>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span style="font-size: 12px; color: var(--text-light);" id="lastUpdateTime"></span>
                            <button class="btn btn-sm btn-outline" id="refreshActivityBtn" title="Refresh Activity">
                                <i class="fas fa-sync"></i>
                            </button>
                        </div>
                    </div>
                    <div id="recentActivity">
                        <div class="text-center text-muted" style="padding: 20px;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                            <p>Memuat aktivitas...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ========== GET YEAR OPTIONS ==========
    getYearOptions() {
        const currentYear = new Date().getFullYear();
        let options = '';
        for (let y = currentYear - 3; y <= currentYear + 1; y++) {
            options += `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`;
        }
        return options;
    },
    
    // ========== INIT ==========
    init() {
        console.log('📊 Dashboard initializing...');
        
        // Load all data
        this.loadStats();
        this.loadChart();
        this.loadPieChart();
        this.loadRecentActivity();
        
        // Setup auto refresh (every 30 seconds)
        this.startAutoRefresh();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update last update time
        this.updateLastUpdateTime();
    },
    
    // ========== DESTROY ==========
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        this.destroyCharts();
    },
    
    // ========== DESTROY CHARTS ==========
    destroyCharts() {
        Object.keys(this.chartInstances).forEach(key => {
            if (this.chartInstances[key]) {
                this.chartInstances[key].destroy();
                this.chartInstances[key] = null;
            }
        });
        this.chartInstances = {};
    },
    
    // ========== START AUTO REFRESH ==========
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        this.refreshInterval = setInterval(() => {
            console.log('🔄 Auto refreshing dashboard...');
            this.loadStats();
            this.loadChart();
            this.loadPieChart();
            this.updateLastUpdateTime();
        }, 30000);
    },
    
    // ========== UPDATE LAST UPDATE TIME ==========
    updateLastUpdateTime() {
        const el = document.getElementById('lastUpdateTime');
        if (el) {
            const now = new Date();
            el.textContent = 'Last update: ' + now.toLocaleTimeString('id-ID');
        }
    },
    
    // ========== SETUP EVENT LISTENERS ==========
    setupEventListeners() {
        // Refresh chart button
        const refreshChartBtn = document.getElementById('refreshChartBtn');
        if (refreshChartBtn) {
            refreshChartBtn.addEventListener('click', () => {
                const yearSelect = document.getElementById('chartYear');
                if (yearSelect) {
                    this.loadChartData(yearSelect.value);
                }
            });
        }
        
        // Refresh pie button
        const refreshPieBtn = document.getElementById('refreshPieBtn');
        if (refreshPieBtn) {
            refreshPieBtn.addEventListener('click', () => {
                this.loadPieChart();
            });
        }
        
        // Refresh activity button
        const refreshActivityBtn = document.getElementById('refreshActivityBtn');
        if (refreshActivityBtn) {
            refreshActivityBtn.addEventListener('click', () => {
                this.loadRecentActivity();
                this.updateLastUpdateTime();
            });
        }
        
        // Year select change
        const yearSelect = document.getElementById('chartYear');
        if (yearSelect) {
            yearSelect.addEventListener('change', () => {
                this.loadChartData(yearSelect.value);
            });
        }
    },
    
    // ========== LOAD STATS ==========
    async loadStats() {
        try {
            console.log('📊 Loading stats...');
            const response = await API.get('dashboard.stats', { token: App.token });
            
            if (response.status === 'success') {
                const stats = response.data;
                console.log('📊 Stats received:', stats);
                
                // Update stat cards
                const smTotal = stats.suratMasuk?.total || 0;
                const skTotal = stats.suratKeluar?.total || 0;
                const dispTotal = stats.disposisi?.total || 0;
                const apprPending = stats.suratKeluar?.pending || 0;
                
                this.updateStatNumber('statSMTotal', smTotal);
                this.updateStatNumber('statSKTotal', skTotal);
                this.updateStatNumber('statDispTotal', dispTotal);
                this.updateStatNumber('statApprovalPending', apprPending);
                
                // Update change indicators
                this.updateChangeIndicator('smChange', smTotal);
                this.updateChangeIndicator('skChange', skTotal);
                this.updateChangeIndicator('dispChange', dispTotal);
                this.updateChangeIndicator('apprChange', apprPending, true);
                
                // Update badges
                this.updateBadges(stats);
                
                // Cache stats
                this.statsCache = stats;
                try {
                    localStorage.setItem('dashboard_stats', JSON.stringify(stats));
                } catch(e) {}
            } else {
                console.warn('⚠️ Stats load failed:', response.message);
                this.loadCachedStats();
            }
        } catch (error) {
            console.error('❌ Error loading stats:', error);
            this.loadCachedStats();
        }
    },
    
    // ========== LOAD CACHED STATS ==========
    loadCachedStats() {
        try {
            const cached = localStorage.getItem('dashboard_stats');
            if (cached) {
                const stats = JSON.parse(cached);
                this.updateStatNumber('statSMTotal', stats.suratMasuk?.total || 0);
                this.updateStatNumber('statSKTotal', stats.suratKeluar?.total || 0);
                this.updateStatNumber('statDispTotal', stats.disposisi?.total || 0);
                this.updateStatNumber('statApprovalPending', stats.suratKeluar?.pending || 0);
                this.updateBadges(stats);
                showToast('info', 'Info', 'Menggunakan data cache');
            }
        } catch(e) {}
    },
    
    // ========== UPDATE STAT NUMBER ==========
    updateStatNumber(elementId, value) {
        const el = document.getElementById(elementId);
        if (el) {
            // Animate number change
            const current = parseInt(el.textContent) || 0;
            if (current !== value) {
                el.textContent = value;
                el.style.transition = 'all 0.3s ease';
                el.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    el.style.transform = 'scale(1)';
                }, 300);
            } else {
                el.textContent = value;
            }
        }
    },
    
    // ========== UPDATE CHANGE INDICATOR ==========
    updateChangeIndicator(elementId, currentValue, isReverse = false) {
        const el = document.getElementById(elementId);
        if (!el) return;
        
        // Get previous value from data attribute
        const previous = parseInt(el.dataset.previous) || currentValue;
        const diff = currentValue - previous;
        
        if (diff > 0) {
            el.className = `stat-change ${isReverse ? 'down' : 'up'}`;
            el.innerHTML = `<i class="fas fa-arrow-${isReverse ? 'down' : 'up'}"></i> ${Math.abs(diff)}%`;
        } else if (diff < 0) {
            el.className = `stat-change ${isReverse ? 'up' : 'down'}`;
            el.innerHTML = `<i class="fas fa-arrow-${isReverse ? 'up' : 'down'}"></i> ${Math.abs(diff)}%`;
        } else {
            el.className = 'stat-change';
            el.innerHTML = `<i class="fas fa-minus"></i> 0%`;
        }
        
        // Store current value for next comparison
        el.dataset.previous = currentValue;
    },
    
    // ========== UPDATE BADGES ==========
    updateBadges(stats) {
        const badges = [
            { id: 'smBadge', value: stats.suratMasuk?.pending || 0 },
            { id: 'skBadge', value: stats.suratKeluar?.pending || 0 },
            { id: 'dispBadge', value: stats.disposisi?.pending || 0 },
            { id: 'apprBadge', value: stats.suratKeluar?.pending || 0 }
        ];
        
        badges.forEach(({ id, value }) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;
                el.style.display = value > 0 ? 'inline' : 'none';
            }
        });
    },
    
    // ========== LOAD CHART ==========
    async loadChart() {
        const yearSelect = document.getElementById('chartYear');
        if (yearSelect) {
            this.loadChartData(yearSelect.value);
        }
    },
    
    // ========== LOAD CHART DATA ==========
    async loadChartData(year) {
        try {
            console.log('📊 Loading chart for year:', year);
            
            const response = await API.get('dashboard.chart', { 
                token: App.token,
                year: year || new Date().getFullYear()
            });
            
            if (response.status === 'success' && response.data) {
                const chartData = response.data;
                if (chartData.labels && chartData.datasets) {
                    this.renderChart(chartData);
                } else {
                    console.warn('⚠️ Invalid chart data format');
                    this.renderDefaultChart();
                }
            } else {
                console.warn('⚠️ Chart load failed:', response.message);
                this.renderDefaultChart();
            }
        } catch (error) {
            console.error('❌ Error loading chart:', error);
            this.renderDefaultChart();
        }
    },
    
    // ========== RENDER CHART ==========
    renderChart(data) {
        const canvas = document.getElementById('chartMain');
        if (!canvas) return;
        
        // Destroy existing chart
        if (this.chartInstances.main) {
            this.chartInstances.main.destroy();
            this.chartInstances.main = null;
        }
        
        // Prepare data with defaults
        const labels = data.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const datasets = data.datasets || [
            { 
                label: 'Surat Masuk', 
                data: new Array(12).fill(0), 
                backgroundColor: 'rgba(25, 118, 210, 0.7)',
                borderColor: '#1976D2',
                borderWidth: 2,
                borderRadius: 4
            },
            { 
                label: 'Surat Keluar', 
                data: new Array(12).fill(0), 
                backgroundColor: 'rgba(76, 175, 80, 0.7)',
                borderColor: '#4CAF50',
                borderWidth: 2,
                borderRadius: 4
            }
        ];
        
        const ctx = canvas.getContext('2d');
        
        try {
            this.chartInstances.main = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: { size: 12 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.parsed.y + ' surat';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                precision: 0,
                                font: { size: 11 }
                            },
                            grid: {
                                drawBorder: false,
                                color: 'rgba(0,0,0,0.05)'
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 11 } }
                        }
                    },
                    animation: {
                        duration: 800,
                        easing: 'easeInOutQuart'
                    }
                }
            });
            console.log('✅ Chart rendered successfully');
        } catch (error) {
            console.error('❌ Chart render error:', error);
        }
    },
    
    // ========== RENDER DEFAULT CHART ==========
    renderDefaultChart() {
        const defaultData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
            datasets: [
                { 
                    label: 'Surat Masuk', 
                    data: new Array(12).fill(0), 
                    backgroundColor: 'rgba(25, 118, 210, 0.7)',
                    borderColor: '#1976D2',
                    borderWidth: 2,
                    borderRadius: 4
                },
                { 
                    label: 'Surat Keluar', 
                    data: new Array(12).fill(0), 
                    backgroundColor: 'rgba(76, 175, 80, 0.7)',
                    borderColor: '#4CAF50',
                    borderWidth: 2,
                    borderRadius: 4
                }
            ]
        };
        this.renderChart(defaultData);
    },
    
    // ========== LOAD PIE CHART ==========
    async loadPieChart() {
        try {
            console.log('📊 Loading pie chart...');
            const response = await API.get('dashboard.stats', { token: App.token });
            
            if (response.status === 'success') {
                const stats = response.data;
                const pieData = this.preparePieData(stats);
                this.renderPieChart(pieData);
            }
        } catch (error) {
            console.error('❌ Error loading pie chart:', error);
        }
    },
    
    // ========== PREPARE PIE DATA ==========
    preparePieData(stats) {
        const data = [];
        const colors = ['#1976D2', '#FF9800', '#7B1FA2', '#4CAF50', '#F44336', '#009688'];
        let colorIndex = 0;
        
        // Surat Masuk status
        if (stats.suratMasuk) {
            Object.keys(stats.suratMasuk).forEach(key => {
                if (key !== 'total' && key !== 'pending' && key !== 'hariIni' && key !== 'bulanIni') {
                    data.push({
                        label: key,
                        value: stats.suratMasuk[key] || 0,
                        color: colors[colorIndex % colors.length]
                    });
                    colorIndex++;
                }
            });
        }
        
        // If no data, show default
        if (data.length === 0) {
            data.push({ label: 'Belum ada data', value: 1, color: '#9E9E9E' });
        }
        
        return data;
    },
    
    // ========== RENDER PIE CHART ==========
    renderPieChart(data) {
        const canvas = document.getElementById('chartPie');
        if (!canvas) return;
        
        // Destroy existing chart
        if (this.chartInstances.pie) {
            this.chartInstances.pie.destroy();
            this.chartInstances.pie = null;
        }
        
        const labels = data.map(d => d.label);
        const values = data.map(d => d.value);
        const colors = data.map(d => d.color);
        
        const ctx = canvas.getContext('2d');
        
        try {
            this.chartInstances.pie = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: 'var(--bg-card)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                usePointStyle: true,
                                padding: 12,
                                font: { size: 11 },
                                generateLabels: function(chart) {
                                    const data = chart.data;
                                    return data.labels.map((label, i) => ({
                                        text: label + ' (' + data.datasets[0].data[i] + ')',
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: data.datasets[0].backgroundColor[i],
                                        pointStyle: 'circle'
                                    }));
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                                    return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                                }
                            }
                        }
                    },
                    cutout: '60%',
                    animation: {
                        animateRotate: true,
                        duration: 800
                    }
                }
            });
            console.log('✅ Pie chart rendered successfully');
        } catch (error) {
            console.error('❌ Pie chart render error:', error);
        }
    },
    
    // ========== LOAD RECENT ACTIVITY ==========
    async loadRecentActivity() {
        try {
            console.log('📊 Loading recent activity...');
            const response = await API.get('auditLog.list', { 
                token: App.token,
                limit: 15
            });
            
            const container = document.getElementById('recentActivity');
            if (!container) return;
            
            if (response.status === 'success') {
                const items = response.data.items || [];
                if (items.length === 0) {
                    container.innerHTML = `
                        <div class="text-center text-muted" style="padding: 30px;">
                            <i class="fas fa-inbox" style="font-size: 32px; display: block; margin-bottom: 12px;"></i>
                            <p>Belum ada aktivitas</p>
                        </div>
                    `;
                    return;
                }
                
                container.innerHTML = `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th style="min-width: 160px;">Waktu</th>
                                    <th style="min-width: 100px;">Aksi</th>
                                    <th>Deskripsi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.slice(0, 15).map(item => `
                                    <tr>
                                        <td style="white-space: nowrap; font-size: 12px; color: var(--text-secondary);">
                                            ${Utils.formatDate(item.createdAt)}
                                        </td>
                                        <td>
                                            <span class="status-badge" style="
                                                background: #E3F2FD; 
                                                color: #1976D2;
                                                font-size: 10px;
                                            ">
                                                ${item.aksi || '-'}
                                            </span>
                                        </td>
                                        <td style="max-width: 300px; word-break: break-word;">
                                            ${item.deskripsi || '-'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${items.length > 15 ? `
                        <div style="text-align: center; margin-top: 12px;">
                            <button class="btn btn-sm btn-link" onclick="App.loadPage('audit')">
                                Lihat semua aktivitas <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    ` : ''}
                `;
            } else {
                container.innerHTML = `
                    <div class="text-center text-muted" style="padding: 30px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 32px; display: block; margin-bottom: 12px; color: #FF9800;"></i>
                        <p>${response.message || 'Gagal memuat aktivitas'}</p>
                        <button class="btn btn-sm btn-outline mt-2" onclick="Dashboard.loadRecentActivity()">
                            <i class="fas fa-sync"></i> Coba Lagi
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ Error loading recent activity:', error);
            const container = document.getElementById('recentActivity');
            if (container) {
                container.innerHTML = `
                    <div class="text-center text-danger" style="padding: 30px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 32px; display: block; margin-bottom: 12px;"></i>
                        <p>Gagal memuat aktivitas: ${error.message}</p>
                        <button class="btn btn-sm btn-outline mt-2" onclick="Dashboard.loadRecentActivity()">
                            <i class="fas fa-sync"></i> Coba Lagi
                        </button>
                    </div>
                `;
            }
        }
    }
};

// ========== CLEANUP ON PAGE UNLOAD ==========
document.addEventListener('beforeunload', function() {
    if (Dashboard.destroy) {
        Dashboard.destroy();
    }
});

// ========== HANDLE WINDOW RESIZE ==========
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Re-render charts with new size
        if (Dashboard.chartInstances.main) {
            Dashboard.chartInstances.main.resize();
        }
        if (Dashboard.chartInstances.pie) {
            Dashboard.chartInstances.pie.resize();
        }
    }, 250);
});

console.log('📊 Dashboard Module Loaded');
