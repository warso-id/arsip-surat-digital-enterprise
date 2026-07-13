/**
 * ============================================
 * DASHBOARD.JS - Dashboard Module
 * ARSIP SURAT DIGITAL v3.2.2
 * FULL FEATURES - RESPONSIVE - MATERIAL DESIGN 3
 * ============================================
 */

const Dashboard = {
    // ========== STATE ==========
    chartInstances: {},
    refreshInterval: null,
    data: {
        stats: null,
        chart: null,
        activities: [],
        notifications: []
    },
    isLoading: false,
    lastUpdate: null,
    viewMode: 'grid', // grid | list
    
    // ========== RENDER ==========
    async render() {
        return `
            <div class="dashboard-page">
                <!-- Welcome Banner -->
                <div class="welcome-banner" style="
                    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                    border-radius: var(--radius-lg);
                    padding: var(--spacing-lg);
                    margin-bottom: var(--spacing-lg);
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: var(--spacing-md);
                ">
                    <div>
                        <h2 style="font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: var(--spacing-xs);">
                            👋 Selamat Datang, <span id="welcomeName">${App.user?.namaLengkap || App.user?.username || 'User'}</span>
                        </h2>
                        <p style="opacity: 0.8; font-size: var(--font-size-sm);">
                            <span id="welcomeDate">${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            • <span id="welcomeTime">${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                            • ${App.user?.role === 'admin' ? 'Administrator' : App.user?.role === 'kabid' ? 'Kepala Bidang' : 'Staff'}
                        </p>
                    </div>
                    <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap;">
                        <button class="btn btn-sm btn-outline" onclick="Dashboard.refreshData()" style="background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); color: white;">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="Dashboard.toggleViewMode()" style="background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); color: white;">
                            <i class="fas fa-th"></i> <span id="viewModeLabel">Grid</span>
                        </button>
                    </div>
                </div>
                
                <!-- Stats Grid -->
                <div class="stats-grid" id="statsGrid">
                    <div class="stat-card" data-stat="suratMasuk">
                        <div class="stat-icon blue"><i class="fas fa-inbox"></i></div>
                        <div class="stat-number" id="statSMTotal">0</div>
                        <div class="stat-label">Total Surat Masuk</div>
                        <div class="stat-change up" id="smChange"><i class="fas fa-arrow-up"></i> 0%</div>
                        <div style="margin-top: var(--spacing-sm); font-size: var(--font-size-sm); color: var(--text-light);">
                            <span id="smPending">0</span> pending
                        </div>
                    </div>
                    <div class="stat-card" data-stat="suratKeluar">
                        <div class="stat-icon green"><i class="fas fa-paper-plane"></i></div>
                        <div class="stat-number" id="statSKTotal">0</div>
                        <div class="stat-label">Total Surat Keluar</div>
                        <div class="stat-change up" id="skChange"><i class="fas fa-arrow-up"></i> 0%</div>
                        <div style="margin-top: var(--spacing-sm); font-size: var(--font-size-sm); color: var(--text-light);">
                            <span id="skPending">0</span> pending approval
                        </div>
                    </div>
                    <div class="stat-card" data-stat="disposisi">
                        <div class="stat-icon orange"><i class="fas fa-clipboard-list"></i></div>
                        <div class="stat-number" id="statDispTotal">0</div>
                        <div class="stat-label">Total Disposisi</div>
                        <div class="stat-change up" id="dispChange"><i class="fas fa-arrow-up"></i> 0%</div>
                        <div style="margin-top: var(--spacing-sm); font-size: var(--font-size-sm); color: var(--text-light);">
                            <span id="dispPending">0</span> pending
                        </div>
                    </div>
                    <div class="stat-card" data-stat="approval">
                        <div class="stat-icon purple"><i class="fas fa-check-double"></i></div>
                        <div class="stat-number" id="statApprovalPending">0</div>
                        <div class="stat-label">Approval Pending</div>
                        <div class="stat-change down" id="apprChange"><i class="fas fa-arrow-down"></i> 0%</div>
                        <div style="margin-top: var(--spacing-sm); font-size: var(--font-size-sm); color: var(--text-light);">
                            Perlu persetujuan
                        </div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--spacing-sm); margin-bottom: var(--spacing-lg);">
                    <button class="btn btn-primary btn-sm" onclick="App.loadPage('surat-masuk')" style="width: 100%;">
                        <i class="fas fa-plus"></i> Surat Masuk
                    </button>
                    <button class="btn btn-success btn-sm" onclick="App.loadPage('surat-keluar')" style="width: 100%;">
                        <i class="fas fa-plus"></i> Surat Keluar
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="App.loadPage('disposisi')" style="width: 100%;">
                        <i class="fas fa-pen"></i> Disposisi
                    </button>
                    <button class="btn btn-info btn-sm" onclick="App.loadPage('approval')" style="width: 100%;">
                        <i class="fas fa-check"></i> Approval
                    </button>
                </div>
                
                <!-- Charts Row -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-chart-bar"></i> Statistik Surat</h3>
                            <div style="display: flex; gap: var(--spacing-xs); align-items: center;">
                                <select id="chartYear" class="form-control" style="width: auto; padding: 4px 8px; font-size: var(--font-size-sm);">
                                    ${this.getYearOptions()}
                                </select>
                                <button class="btn btn-sm btn-outline" id="refreshChartBtn" title="Refresh Chart">
                                    <i class="fas fa-sync"></i>
                                </button>
                            </div>
                        </div>
                        <div style="position: relative; height: 280px;">
                            <canvas id="chartMain"></canvas>
                            <div id="chartLoading" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: var(--text-light);"></i>
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-pie-chart"></i> Distribusi Status</h3>
                            <button class="btn btn-sm btn-outline" id="refreshPieBtn">
                                <i class="fas fa-sync"></i>
                            </button>
                        </div>
                        <div style="position: relative; height: 280px;">
                            <canvas id="chartPie"></canvas>
                            <div id="pieLoading" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: var(--text-light);"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Activity & Quick Info -->
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--spacing-md);">
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-history"></i> Aktivitas Terbaru</h3>
                            <div style="display: flex; gap: var(--spacing-xs);">
                                <button class="btn btn-sm btn-outline" id="refreshActivityBtn">
                                    <i class="fas fa-sync"></i>
                                </button>
                            </div>
                        </div>
                        <div id="recentActivity">
                            <div class="text-center text-muted" style="padding: var(--spacing-lg);">
                                <i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i>
                                <p style="margin-top: var(--spacing-sm);">Memuat aktivitas...</p>
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-info-circle"></i> Ringkasan</h3>
                        </div>
                        <div id="quickInfo">
                            <div style="padding: var(--spacing-sm);">
                                <div style="display: flex; justify-content: space-between; padding: var(--spacing-xs) 0; border-bottom: 1px solid var(--border-color);">
                                    <span class="text-muted">Last Updated</span>
                                    <span id="lastUpdated">-</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: var(--spacing-xs) 0; border-bottom: 1px solid var(--border-color);">
                                    <span class="text-muted">Total Dokumen</span>
                                    <span id="totalDocs">0</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: var(--spacing-xs) 0; border-bottom: 1px solid var(--border-color);">
                                    <span class="text-muted">Pending Actions</span>
                                    <span id="pendingActions">0</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: var(--spacing-xs) 0;">
                                    <span class="text-muted">Completion Rate</span>
                                    <span id="completionRate">0%</span>
                                </div>
                            </div>
                            <div style="margin-top: var(--spacing-md); padding-top: var(--spacing-md); border-top: 1px solid var(--border-color);">
                                <button class="btn btn-sm btn-primary btn-block" onclick="App.loadPage('report')">
                                    <i class="fas fa-file-alt"></i> Lihat Laporan Lengkap
                                </button>
                            </div>
                        </div>
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
        this.loadPieChart();
        this.loadRecentActivity();
        
        // Update time
        this.updateClock();
        setInterval(() => this.updateClock(), 60000);
        
        // Auto refresh every 30 seconds
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        this.refreshInterval = setInterval(() => {
            console.log('🔄 Auto refreshing dashboard...');
            this.loadStats();
            this.loadChart();
            this.loadPieChart();
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
        if (this.chartInstances.pie) {
            this.chartInstances.pie.destroy();
            this.chartInstances.pie = null;
        }
    },
    
    // ========== UPDATE CLOCK ==========
    updateClock() {
        const now = new Date();
        const timeEl = document.getElementById('welcomeTime');
        if (timeEl) {
            timeEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
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
    
    // ========== TOGGLE VIEW MODE ==========
    toggleViewMode() {
        this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
        const label = document.getElementById('viewModeLabel');
        if (label) {
            label.textContent = this.viewMode === 'grid' ? 'Grid' : 'List';
        }
        // Apply view mode to stats grid
        const grid = document.getElementById('statsGrid');
        if (grid) {
            grid.style.gridTemplateColumns = this.viewMode === 'grid' 
                ? 'repeat(auto-fit, minmax(200px, 1fr))' 
                : '1fr';
        }
        localStorage.setItem('dashboard_view_mode', this.viewMode);
    },
    
    // ========== REFRESH DATA ==========
    async refreshData() {
        console.log('🔄 Manual refresh triggered...');
        showToast('info', 'Refresh', 'Memperbarui data...');
        await this.loadStats();
        await this.loadChart();
        await this.loadPieChart();
        await this.loadRecentActivity();
        showToast('success', 'Refresh', 'Data berhasil diperbarui!');
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
            });
        }
        
        // Year select change
        const yearSelect = document.getElementById('chartYear');
        if (yearSelect) {
            yearSelect.addEventListener('change', () => {
                this.loadChartData(yearSelect.value);
            });
        }
        
        // Restore view mode
        const savedMode = localStorage.getItem('dashboard_view_mode');
        if (savedMode) {
            this.viewMode = savedMode;
            const label = document.getElementById('viewModeLabel');
            if (label) label.textContent = savedMode === 'grid' ? 'Grid' : 'List';
        }
    },
    
    // ========== LOAD STATS ==========
    async loadStats() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        try {
            console.log('📊 Loading stats...');
            const response = await API.get('dashboard.stats', { token: App.token });
            
            if (response.status === 'success') {
                const stats = response.data;
                console.log('📊 Stats received:', stats);
                
                this.data.stats = stats;
                this.lastUpdate = new Date();
                
                // Update stat cards
                this.updateStatsUI(stats);
                
                // Update quick info
                this.updateQuickInfo(stats);
                
                // Update badges
                this.updateBadges(stats);
                
                // Save to cache
                try {
                    localStorage.setItem('dashboard_stats', JSON.stringify({ stats, timestamp: this.lastUpdate.toISOString() }));
                } catch(e) {}
            } else {
                console.warn('⚠️ Stats load failed:', response.message);
                this.loadCachedStats();
            }
        } catch (error) {
            console.error('❌ Error loading stats:', error);
            this.loadCachedStats();
        } finally {
            this.isLoading = false;
        }
    },
    
    // ========== LOAD CACHED STATS ==========
    loadCachedStats() {
        try {
            const cached = localStorage.getItem('dashboard_stats');
            if (cached) {
                const data = JSON.parse(cached);
                this.data.stats = data.stats;
                this.lastUpdate = new Date(data.timestamp);
                this.updateStatsUI(data.stats);
                this.updateQuickInfo(data.stats);
                this.updateBadges(data.stats);
                console.log('📊 Loaded cached stats');
            }
        } catch(e) {
            console.warn('⚠️ No cached stats available');
        }
    },
    
    // ========== UPDATE STATS UI ==========
    updateStatsUI(stats) {
        const smTotal = stats.suratMasuk?.total || 0;
        const skTotal = stats.suratKeluar?.total || 0;
        const dispTotal = stats.disposisi?.total || 0;
        const apprPending = stats.suratKeluar?.pending || 0;
        const smPending = stats.suratMasuk?.pending || 0;
        const skPending = stats.suratKeluar?.pending || 0;
        const dispPending = stats.disposisi?.pending || 0;
        
        document.getElementById('statSMTotal').textContent = smTotal;
        document.getElementById('statSKTotal').textContent = skTotal;
        document.getElementById('statDispTotal').textContent = dispTotal;
        document.getElementById('statApprovalPending').textContent = apprPending;
        
        document.getElementById('smPending').textContent = smPending;
        document.getElementById('skPending').textContent = skPending;
        document.getElementById('dispPending').textContent = dispPending;
        
        // Calculate changes from previous data
        this.updateChangeIndicator('smChange', smTotal);
        this.updateChangeIndicator('skChange', skTotal);
        this.updateChangeIndicator('dispChange', dispTotal);
        this.updateChangeIndicator('apprChange', apprPending, true);
    },
    
    // ========== UPDATE CHANGE INDICATOR ==========
    updateChangeIndicator(elementId, currentValue, isReverse = false) {
        const el = document.getElementById(elementId);
        if (!el) return;
        
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
        
        el.dataset.previous = currentValue;
    },
    
    // ========== UPDATE QUICK INFO ==========
    updateQuickInfo(stats) {
        const totalDocs = (stats.suratMasuk?.total || 0) + (stats.suratKeluar?.total || 0);
        const pendingActions = (stats.suratMasuk?.pending || 0) + (stats.suratKeluar?.pending || 0) + (stats.disposisi?.pending || 0);
        const completed = stats.suratMasuk?.selesai || 0;
        const total = stats.suratMasuk?.total || 1;
        const completionRate = Math.round((completed / total) * 100);
        
        document.getElementById('totalDocs').textContent = totalDocs;
        document.getElementById('pendingActions').textContent = pendingActions;
        document.getElementById('completionRate').textContent = completionRate + '%';
        
        const lastUpdated = document.getElementById('lastUpdated');
        if (lastUpdated && this.lastUpdate) {
            lastUpdated.textContent = this.lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        }
    },
    
    // ========== UPDATE BADGES ==========
    updateBadges(stats) {
        const badges = {
            smBadge: stats.suratMasuk?.pending || 0,
            skBadge: stats.suratKeluar?.pending || 0,
            dispBadge: stats.disposisi?.pending || 0,
            apprBadge: stats.suratKeluar?.pending || 0
        };
        
        Object.keys(badges).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const count = badges[id];
                el.textContent = count;
                el.style.display = count > 0 ? 'inline' : 'none';
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
        const loadingEl = document.getElementById('chartLoading');
        if (loadingEl) loadingEl.style.display = 'block';
        
        try {
            console.log('📊 Loading chart for year:', year);
            const response = await API.get('dashboard.chart', { 
                token: App.token,
                year: year || new Date().getFullYear()
            });
            
            if (response.status === 'success' && response.data) {
                this.data.chart = response.data;
                this.renderChart(response.data);
            } else {
                console.warn('⚠️ Chart load failed:', response.message);
                this.renderDefaultChart();
            }
        } catch (error) {
            console.error('❌ Error loading chart:', error);
            this.renderDefaultChart();
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    },
    
    // ========== RENDER CHART ==========
    renderChart(data) {
        const canvas = document.getElementById('chartMain');
        if (!canvas) return;
        
        if (this.chartInstances.main) {
            this.chartInstances.main.destroy();
            this.chartInstances.main = null;
        }
        
        const labels = data.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const datasets = data.datasets || [
            { label: 'Surat Masuk', data: new Array(12).fill(0), backgroundColor: 'rgba(25, 118, 210, 0.7)', borderColor: '#1976D2', borderWidth: 2 },
            { label: 'Surat Keluar', data: new Array(12).fill(0), backgroundColor: 'rgba(76, 175, 80, 0.7)', borderColor: '#4CAF50', borderWidth: 2 }
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
                                padding: 20,
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
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: { size: 11 }
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
                { label: 'Surat Masuk', data: new Array(12).fill(0), backgroundColor: 'rgba(25, 118, 210, 0.7)', borderColor: '#1976D2', borderWidth: 2 },
                { label: 'Surat Keluar', data: new Array(12).fill(0), backgroundColor: 'rgba(76, 175, 80, 0.7)', borderColor: '#4CAF50', borderWidth: 2 }
            ]
        };
        this.renderChart(defaultData);
    },
    
    // ========== LOAD PIE CHART ==========
    async loadPieChart() {
        const loadingEl = document.getElementById('pieLoading');
        if (loadingEl) loadingEl.style.display = 'block';
        
        try {
            const response = await API.get('dashboard.stats', { token: App.token });
            
            if (response.status === 'success') {
                const stats = response.data;
                const data = this.preparePieData(stats);
                this.renderPieChart(data);
            } else {
                this.renderDefaultPieChart();
            }
        } catch (error) {
            console.error('❌ Error loading pie chart:', error);
            this.renderDefaultPieChart();
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    },
    
    // ========== PREPARE PIE DATA ==========
    preparePieData(stats) {
        const statusMap = {};
        
        // Get status from surat masuk
        if (stats.suratMasuk?.byStatus) {
            Object.keys(stats.suratMasuk.byStatus).forEach(key => {
                statusMap[key] = (statusMap[key] || 0) + stats.suratMasuk.byStatus[key];
            });
        }
        
        // Get status from surat keluar
        if (stats.suratKeluar?.byStatus) {
            Object.keys(stats.suratKeluar.byStatus).forEach(key => {
                statusMap[key] = (statusMap[key] || 0) + stats.suratKeluar.byStatus[key];
            });
        }
        
        const labels = Object.keys(statusMap);
        const values = Object.values(statusMap);
        const colors = this.generateColors(labels.length);
        
        return { labels, values, colors };
    },
    
    // ========== GENERATE COLORS ==========
    generateColors(count) {
        const palette = [
            '#1976D2', '#4CAF50', '#FF9800', '#F44336', '#7B1FA2',
            '#009688', '#2196F3', '#FF5722', '#8BC34A', '#9C27B0',
            '#00BCD4', '#FFC107', '#E91E63', '#607D8B', '#3F51B5'
        ];
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(palette[i % palette.length]);
        }
        return colors;
    },
    
    // ========== RENDER PIE CHART ==========
    renderPieChart(data) {
        const canvas = document.getElementById('chartPie');
        if (!canvas) return;
        
        if (this.chartInstances.pie) {
            this.chartInstances.pie.destroy();
            this.chartInstances.pie = null;
        }
        
        const ctx = canvas.getContext('2d');
        
        try {
            this.chartInstances.pie = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.values,
                        backgroundColor: data.colors,
                        borderWidth: 2,
                        borderColor: 'var(--bg-card)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 12,
                                font: { size: 11 },
                                boxWidth: 12
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
    
    // ========== RENDER DEFAULT PIE CHART ==========
    renderDefaultPieChart() {
        const data = {
            labels: ['Belum Ada Data'],
            values: [1],
            colors: ['#ECEFF1']
        };
        this.renderPieChart(data);
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
                this.data.activities = items;
                
                if (items.length === 0) {
                    container.innerHTML = `
                        <div class="text-center text-muted" style="padding: var(--spacing-lg);">
                            <i class="fas fa-inbox" style="font-size: 32px; display: block; margin-bottom: var(--spacing-sm);"></i>
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
                                ${items.slice(0, 15).map(item => `
                                    <tr>
                                        <td style="white-space: nowrap; font-size: var(--font-size-sm);">
                                            ${Utils.formatDate(item.createdAt)}
                                        </td>
                                        <td>
                                            <span class="status-badge" style="
                                                background: ${this.getActionColor(item.aksi)};
                                                color: white;
                                            ">
                                                ${item.aksi || '-'}
                                            </span>
                                        </td>
                                        <td>${item.deskripsi || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="text-center text-muted" style="padding: var(--spacing-lg);">
                        <i class="fas fa-exclamation-circle" style="font-size: 32px; display: block; margin-bottom: var(--spacing-sm); color: var(--warning);"></i>
                        <p>${response.message || 'Gagal memuat aktivitas'}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ Error loading recent activity:', error);
            const container = document.getElementById('recentActivity');
            if (container) {
                container.innerHTML = `
                    <div class="text-center text-danger" style="padding: var(--spacing-lg);">
                        <i class="fas fa-exclamation-circle" style="font-size: 32px; display: block; margin-bottom: var(--spacing-sm);"></i>
                        <p>Gagal memuat aktivitas: ${error.message}</p>
                    </div>
                `;
            }
        }
    },
    
    // ========== GET ACTION COLOR ==========
    getActionColor(action) {
        const colors = {
            'LOGIN': '#1976D2',
            'LOGOUT': '#78909C',
            'CREATE_SURAT_MASUK': '#4CAF50',
            'UPDATE_SURAT_MASUK': '#FF9800',
            'DELETE_SURAT_MASUK': '#F44336',
            'CREATE_SURAT_KELUAR': '#4CAF50',
            'UPDATE_SURAT_KELUAR': '#FF9800',
            'DELETE_SURAT_KELUAR': '#F44336',
            'CREATE_DISPOSISI': '#7B1FA2',
            'UPDATE_DISPOSISI': '#FF9800',
            'APPROVAL': '#009688',
            'CHANGE_PASSWORD': '#2196F3'
        };
        return colors[action] || '#78909C';
    }
};

// ========== CLEANUP ON PAGE UNLOAD ==========
document.addEventListener('beforeunload', function() {
    if (Dashboard.destroy) {
        Dashboard.destroy();
    }
});

console.log('📊 Dashboard Module Loaded');
