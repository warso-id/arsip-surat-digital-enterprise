/**
 * ============================================
 * DASHBOARD.JS - Dashboard Module
 * ARSIP SURAT DIGITAL v3.2.2
 * FIXED: Sync dengan backend, error handling, badge update
 * ============================================
 */

const Dashboard = {
    chartInstances: {},
    refreshInterval: null,
    
    // ========== RENDER ==========
    async render() {
        return `
            <div class="dashboard-page">
                <!-- Stats -->
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
                
                <!-- Charts -->
                <div class="card" style="margin-bottom: 20px;">
                    <div class="card-header">
                        <h3><i class="fas fa-chart-bar"></i> Statistik Surat</h3>
                        <div>
                            <select id="chartYear" class="form-control" style="width: auto; display: inline-block;">
                                ${this.getYearOptions()}
                            </select>
                            <button class="btn btn-sm btn-outline" id="refreshChartBtn">
                                <i class="fas fa-sync"></i>
                            </button>
                        </div>
                    </div>
                    <div style="position: relative; height: 300px;">
                        <canvas id="chartMain"></canvas>
                    </div>
                </div>
                
                <!-- Recent Activity -->
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-history"></i> Aktivitas Terbaru</h3>
                        <button class="btn btn-sm btn-outline" id="refreshActivityBtn">
                            <i class="fas fa-sync"></i>
                        </button>
                    </div>
                    <div id="recentActivity">
                        <p class="text-muted">Memuat aktivitas...</p>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ========== INIT ==========
    init() {
        console.log('📊 Dashboard initializing...');
        
        // Load data
        this.loadStats();
        this.loadChart();
        this.loadRecentActivity();
        
        // Setup auto refresh (every 30 seconds)
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        this.refreshInterval = setInterval(() => {
            console.log('🔄 Auto refreshing dashboard...');
            this.loadStats();
            this.loadChart();
        }, 30000);
        
        // Setup event listeners
        this.setupEventListeners();
    },
    
    // ========== DESTROY ==========
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        if (this.chartInstances.main) {
            this.chartInstances.main.destroy();
            this.chartInstances.main = null;
        }
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
    
    // ========== SETUP EVENT LISTENERS ==========
    setupEventListeners() {
        // Refresh chart button
        const refreshBtn = document.getElementById('refreshChartBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                const yearSelect = document.getElementById('chartYear');
                if (yearSelect) {
                    this.loadChartData(yearSelect.value);
                }
            });
        }
        
        // Refresh activity button
        const refreshActivityBtn = document.getElementById('refreshActivityBtn');
        if (refreshActivityBtn) {
            refreshActivityBtn.addEventListener('click', () => {
                this.loadRecentActivity();
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
                
                document.getElementById('statSMTotal').textContent = smTotal;
                document.getElementById('statSKTotal').textContent = skTotal;
                document.getElementById('statDispTotal').textContent = dispTotal;
                document.getElementById('statApprovalPending').textContent = apprPending;
                
                // Update change indicators (simple logic)
                this.updateChangeIndicator('smChange', smTotal);
                this.updateChangeIndicator('skChange', skTotal);
                this.updateChangeIndicator('dispChange', dispTotal);
                this.updateChangeIndicator('apprChange', apprPending, true);
                
                // Update badges di sidebar
                this.updateBadges(stats);
                
                // Simpan ke localStorage untuk perubahan berikutnya
                try {
                    localStorage.setItem('dashboard_stats', JSON.stringify(stats));
                } catch(e) {}
            } else {
                console.warn('⚠️ Stats load failed:', response.message);
                // Gunakan data dari cache jika ada
                this.loadCachedStats();
            }
        } catch (error) {
            console.error('❌ Error loading stats:', error);
            // Gunakan data dari cache
            this.loadCachedStats();
        }
    },
    
    // ========== LOAD CACHED STATS ==========
    loadCachedStats() {
        try {
            const cached = localStorage.getItem('dashboard_stats');
            if (cached) {
                const stats = JSON.parse(cached);
                document.getElementById('statSMTotal').textContent = stats.suratMasuk?.total || 0;
                document.getElementById('statSKTotal').textContent = stats.suratKeluar?.total || 0;
                document.getElementById('statDispTotal').textContent = stats.disposisi?.total || 0;
                document.getElementById('statApprovalPending').textContent = stats.suratKeluar?.pending || 0;
                this.updateBadges(stats);
            }
        } catch(e) {}
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
        const smBadge = document.getElementById('smBadge');
        const skBadge = document.getElementById('skBadge');
        const dispBadge = document.getElementById('dispBadge');
        const apprBadge = document.getElementById('apprBadge');
        
        if (smBadge) {
            const pending = stats.suratMasuk?.pending || 0;
            smBadge.textContent = pending;
            smBadge.style.display = pending > 0 ? 'inline' : 'none';
        }
        if (skBadge) {
            const pending = stats.suratKeluar?.pending || 0;
            skBadge.textContent = pending;
            skBadge.style.display = pending > 0 ? 'inline' : 'none';
        }
        if (dispBadge) {
            const pending = stats.disposisi?.pending || 0;
            dispBadge.textContent = pending;
            dispBadge.style.display = pending > 0 ? 'inline' : 'none';
        }
        if (apprBadge) {
            const pending = stats.suratKeluar?.pending || 0;
            apprBadge.textContent = pending;
            apprBadge.style.display = pending > 0 ? 'inline' : 'none';
        }
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
                // Pastikan data memiliki format yang benar
                const chartData = response.data;
                if (chartData.labels && chartData.datasets) {
                    this.renderChart(chartData);
                } else {
                    console.warn('⚠️ Invalid chart data format:', chartData);
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
        if (!canvas) {
            console.warn('⚠️ Canvas not found');
            return;
        }
        
        // Destroy existing chart
        if (this.chartInstances.main) {
            this.chartInstances.main.destroy();
            this.chartInstances.main = null;
        }
        
        // Siapkan data dengan default jika kosong
        const labels = data.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const datasets = data.datasets || [
            { label: 'Surat Masuk', data: new Array(12).fill(0), backgroundColor: '#1976D2' },
            { label: 'Surat Keluar', data: new Array(12).fill(0), backgroundColor: '#388E3C' }
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
                                padding: 20
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
                                precision: 0
                            },
                            grid: {
                                drawBorder: false
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    },
                    animation: {
                        duration: 800
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
                { label: 'Surat Masuk', data: new Array(12).fill(0), backgroundColor: '#1976D2' },
                { label: 'Surat Keluar', data: new Array(12).fill(0), backgroundColor: '#388E3C' }
            ]
        };
        this.renderChart(defaultData);
    },
    
    // ========== LOAD RECENT ACTIVITY ==========
    async loadRecentActivity() {
        try {
            console.log('📊 Loading recent activity...');
            const response = await API.get('auditLog.list', { 
                token: App.token,
                limit: 10
            });
            
            const container = document.getElementById('recentActivity');
            if (!container) return;
            
            if (response.status === 'success') {
                const items = response.data.items || [];
                if (items.length === 0) {
                    container.innerHTML = `
                        <div class="text-center text-muted" style="padding: 20px;">
                            <i class="fas fa-inbox" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
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
                                    <th>Waktu</th>
                                    <th>Aksi</th>
                                    <th>Deskripsi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.slice(0, 10).map(item => `
                                    <tr>
                                        <td style="white-space: nowrap;">${Utils.formatDate(item.createdAt)}</td>
                                        <td><span class="status-badge" style="background: #E3F2FD; color: #1976D2;">${item.aksi || '-'}</span></td>
                                        <td>${item.deskripsi || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="text-center text-muted" style="padding: 20px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 24px; display: block; margin-bottom: 8px; color: #FF9800;"></i>
                        <p>${response.message || 'Gagal memuat aktivitas'}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ Error loading recent activity:', error);
            const container = document.getElementById('recentActivity');
            if (container) {
                container.innerHTML = `
                    <div class="text-center text-danger" style="padding: 20px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                        <p>Gagal memuat aktivitas: ${error.message}</p>
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

console.log('📊 Dashboard Module Loaded');
