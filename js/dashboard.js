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
    isLoading: false,
    
    // ========== RENDER ==========
    async render() {
        return `
            <div class="dashboard-page">
                <!-- Welcome Section -->
                <div class="card" style="margin-bottom: 20px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white; border: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                        <div>
                            <h2 style="font-size: 20px; font-weight: 700; color: white; margin-bottom: 4px;">
                                👋 Selamat Datang, <span id="dashboardUserName">${App.user?.namaLengkap || App.user?.username || 'User'}</span>
                            </h2>
                            <p style="color: rgba(255,255,255,0.8); font-size: 14px;">
                                <i class="fas fa-calendar-alt"></i> 
                                ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <button class="btn btn-sm" style="background: rgba(255,255,255,0.2); color: white; border: none;" onclick="Dashboard.refreshAll()">
                                <i class="fas fa-sync"></i> Refresh
                            </button>
                            <button class="btn btn-sm" style="background: rgba(255,255,255,0.2); color: white; border: none;" onclick="Dashboard.exportDashboard()">
                                <i class="fas fa-download"></i> Export
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="stats-grid" id="statsGrid">
                    <div class="stat-card" onclick="App.loadPage('surat-masuk')" style="cursor: pointer;">
                        <div class="stat-icon blue"><i class="fas fa-inbox"></i></div>
                        <div class="stat-number" id="statSMTotal">0</div>
                        <div class="stat-label">Total Surat Masuk</div>
                        <div class="stat-change up" id="smChange"><i class="fas fa-arrow-up"></i> 0%</div>
                        <div style="margin-top: 8px; font-size: 12px; color: var(--text-light);">
                            <span id="smPending">0</span> pending
                        </div>
                    </div>
                    <div class="stat-card" onclick="App.loadPage('surat-keluar')" style="cursor: pointer;">
                        <div class="stat-icon green"><i class="fas fa-paper-plane"></i></div>
                        <div class="stat-number" id="statSKTotal">0</div>
                        <div class="stat-label">Total Surat Keluar</div>
                        <div class="stat-change up" id="skChange"><i class="fas fa-arrow-up"></i> 0%</div>
                        <div style="margin-top: 8px; font-size: 12px; color: var(--text-light);">
                            <span id="skPending">0</span> pending approval
                        </div>
                    </div>
                    <div class="stat-card" onclick="App.loadPage('disposisi')" style="cursor: pointer;">
                        <div class="stat-icon orange"><i class="fas fa-clipboard-list"></i></div>
                        <div class="stat-number" id="statDispTotal">0</div>
                        <div class="stat-label">Total Disposisi</div>
                        <div class="stat-change up" id="dispChange"><i class="fas fa-arrow-up"></i> 0%</div>
                        <div style="margin-top: 8px; font-size: 12px; color: var(--text-light);">
                            <span id="dispPending">0</span> belum ditindaklanjuti
                        </div>
                    </div>
                    <div class="stat-card" onclick="App.loadPage('approval')" style="cursor: pointer;">
                        <div class="stat-icon purple"><i class="fas fa-check-double"></i></div>
                        <div class="stat-number" id="statApprovalPending">0</div>
                        <div class="stat-label">Approval Pending</div>
                        <div class="stat-change down" id="apprChange"><i class="fas fa-arrow-down"></i> 0%</div>
                        <div style="margin-top: 8px; font-size: 12px; color: var(--text-light);">
                            Menunggu persetujuan
                        </div>
                    </div>
                </div>

                <!-- Charts Row -->
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <!-- Main Chart -->
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-chart-bar"></i> Statistik Surat</h3>
                            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                                <select id="chartYear" class="form-control" style="width: auto; display: inline-block; padding: 4px 8px; font-size: 12px;">
                                    ${this.getYearOptions()}
                                </select>
                                <select id="chartType" class="form-control" style="width: auto; display: inline-block; padding: 4px 8px; font-size: 12px;">
                                    <option value="bar">Bar Chart</option>
                                    <option value="line">Line Chart</option>
                                </select>
                                <button class="btn btn-sm btn-outline" id="refreshChartBtn">
                                    <i class="fas fa-sync"></i>
                                </button>
                            </div>
                        </div>
                        <div style="position: relative; height: 280px;">
                            <canvas id="chartMain"></canvas>
                        </div>
                    </div>

                    <!-- Quick Stats / AI Insights -->
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-robot"></i> AI Insights</h3>
                        </div>
                        <div id="aiInsights" style="display: flex; flex-direction: column; gap: 12px;">
                            <div class="shimmer" style="height: 60px; border-radius: 8px;"></div>
                            <div class="shimmer" style="height: 60px; border-radius: 8px;"></div>
                            <div class="shimmer" style="height: 60px; border-radius: 8px;"></div>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity & Quick Actions -->
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
                    <!-- Recent Activity -->
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-history"></i> Aktivitas Terbaru</h3>
                            <button class="btn btn-sm btn-outline" id="refreshActivityBtn">
                                <i class="fas fa-sync"></i>
                            </button>
                        </div>
                        <div id="recentActivity">
                            <div class="shimmer" style="height: 40px; border-radius: 8px; margin-bottom: 8px;"></div>
                            <div class="shimmer" style="height: 40px; border-radius: 8px; margin-bottom: 8px;"></div>
                            <div class="shimmer" style="height: 40px; border-radius: 8px; margin-bottom: 8px;"></div>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="card">
                        <div class="card-header">
                            <h3><i class="fas fa-bolt"></i> Aksi Cepat</h3>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <button class="btn btn-primary btn-block" onclick="App.loadPage('surat-masuk')">
                                <i class="fas fa-plus"></i> Surat Masuk Baru
                            </button>
                            <button class="btn btn-success btn-block" onclick="App.loadPage('surat-keluar')">
                                <i class="fas fa-plus"></i> Surat Keluar Baru
                            </button>
                            <button class="btn btn-warning btn-block" onclick="App.loadPage('disposisi')">
                                <i class="fas fa-plus"></i> Buat Disposisi
                            </button>
                            <button class="btn btn-info btn-block" onclick="App.loadPage('approval')">
                                <i class="fas fa-check"></i> Proses Approval
                            </button>
                        </div>
                    </div>
                </div>

                <!-- System Status (mobile friendly) -->
                <div class="card" style="margin-top: 20px;">
                    <div class="card-header">
                        <h3><i class="fas fa-server"></i> Status Sistem</h3>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
                        <div>
                            <span style="font-size: 12px; color: var(--text-light);">Server</span>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span class="status-badge approved" id="serverStatus">Online</span>
                            </div>
                        </div>
                        <div>
                            <span style="font-size: 12px; color: var(--text-light);">Database</span>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span class="status-badge approved" id="dbStatus">Connected</span>
                            </div>
                        </div>
                        <div>
                            <span style="font-size: 12px; color: var(--text-light);">Cache</span>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span class="status-badge approved" id="cacheStatus">Active</span>
                            </div>
                        </div>
                        <div>
                            <span style="font-size: 12px; color: var(--text-light);">Last Update</span>
                            <div style="font-size: 12px; color: var(--text-secondary);" id="lastUpdateTime">-</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ========== INIT ==========
    init() {
        console.log('📊 Dashboard initializing...');
        
        // Set user name
        const userNameEl = document.getElementById('dashboardUserName');
        if (userNameEl && App.user) {
            userNameEl.textContent = App.user.namaLengkap || App.user.username || 'User';
        }
        
        // Load all data
        this.loadAllData();
        
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
        
        // Update last update time
        this.updateLastUpdateTime();
    },
    
    // ========== LOAD ALL DATA ==========
    async loadAllData() {
        this.isLoading = true;
        try {
            await Promise.all([
                this.loadStats(),
                this.loadChart(),
                this.loadAIInsights(),
                this.loadRecentActivity(),
                this.loadSystemStatus()
            ]);
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
        } finally {
            this.isLoading = false;
        }
    },
    
    // ========== REFRESH ALL ==========
    refreshAll() {
        console.log('🔄 Manual refresh...');
        this.loadAllData();
        showToast('info', 'Refresh', 'Dashboard diperbarui');
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
                const typeSelect = document.getElementById('chartType');
                if (yearSelect) {
                    this.loadChartData(yearSelect.value, typeSelect?.value || 'bar');
                }
            });
        }
        
        // Year select change
        const yearSelect = document.getElementById('chartYear');
        if (yearSelect) {
            yearSelect.addEventListener('change', () => {
                const typeSelect = document.getElementById('chartType');
                this.loadChartData(yearSelect.value, typeSelect?.value || 'bar');
            });
        }
        
        // Chart type change
        const typeSelect = document.getElementById('chartType');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => {
                const yearSelect = document.getElementById('chartYear');
                this.loadChartData(yearSelect?.value || new Date().getFullYear(), typeSelect.value);
            });
        }
        
        // Refresh activity button
        const refreshActivityBtn = document.getElementById('refreshActivityBtn');
        if (refreshActivityBtn) {
            refreshActivityBtn.addEventListener('click', () => {
                this.loadRecentActivity();
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
                const smPending = stats.suratMasuk?.pending || 0;
                const skPending = stats.suratKeluar?.pending || 0;
                const dispPending = stats.disposisi?.pending || 0;
                
                // Update numbers
                document.getElementById('statSMTotal').textContent = smTotal;
                document.getElementById('statSKTotal').textContent = skTotal;
                document.getElementById('statDispTotal').textContent = dispTotal;
                document.getElementById('statApprovalPending').textContent = apprPending;
                
                // Update pending counts
                document.getElementById('smPending').textContent = smPending;
                document.getElementById('skPending').textContent = skPending;
                document.getElementById('dispPending').textContent = dispPending;
                
                // Update change indicators
                this.updateChangeIndicator('smChange', smTotal);
                this.updateChangeIndicator('skChange', skTotal);
                this.updateChangeIndicator('dispChange', dispTotal);
                this.updateChangeIndicator('apprChange', apprPending, true);
                
                // Update badges di sidebar
                this.updateBadges(stats);
                
                // Save to cache
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
        
        const previous = parseInt(el.dataset.previous) || currentValue;
        const diff = currentValue - previous;
        
        if (diff > 0) {
            el.className = `stat-change ${isReverse ? 'down' : 'up'}`;
            el.innerHTML = `<i class="fas fa-arrow-${isReverse ? 'down' : 'up'}"></i> +${diff}`;
        } else if (diff < 0) {
            el.className = `stat-change ${isReverse ? 'up' : 'down'}`;
            el.innerHTML = `<i class="fas fa-arrow-${isReverse ? 'up' : 'down'}"></i> ${diff}`;
        } else {
            el.className = 'stat-change';
            el.innerHTML = `<i class="fas fa-minus"></i> 0`;
        }
        
        el.dataset.previous = currentValue;
    },
    
    // ========== UPDATE BADGES ==========
    updateBadges(stats) {
        const badgeIds = ['smBadge', 'skBadge', 'dispBadge', 'apprBadge'];
        const values = [
            stats.suratMasuk?.pending || 0,
            stats.suratKeluar?.pending || 0,
            stats.disposisi?.pending || 0,
            stats.suratKeluar?.pending || 0
        ];
        
        badgeIds.forEach((id, index) => {
            const el = document.getElementById(id);
            if (el) {
                const val = values[index];
                el.textContent = val;
                el.style.display = val > 0 ? 'inline' : 'none';
            }
        });
    },
    
    // ========== LOAD CHART ==========
    async loadChart() {
        const yearSelect = document.getElementById('chartYear');
        const typeSelect = document.getElementById('chartType');
        if (yearSelect) {
            this.loadChartData(yearSelect.value, typeSelect?.value || 'bar');
        }
    },
    
    // ========== LOAD CHART DATA ==========
    async loadChartData(year, type) {
        try {
            console.log('📊 Loading chart for year:', year, 'type:', type);
            
            const response = await API.get('dashboard.chart', { 
                token: App.token,
                year: year || new Date().getFullYear()
            });
            
            if (response.status === 'success' && response.data) {
                const chartData = response.data;
                if (chartData.labels && chartData.datasets) {
                    this.renderChart(chartData, type);
                } else {
                    console.warn('⚠️ Invalid chart data format:', chartData);
                    this.renderDefaultChart(type);
                }
            } else {
                console.warn('⚠️ Chart load failed:', response.message);
                this.renderDefaultChart(type);
            }
        } catch (error) {
            console.error('❌ Error loading chart:', error);
            this.renderDefaultChart();
        }
    },
    
    // ========== RENDER CHART ==========
    renderChart(data, type) {
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
        
        // Prepare data with defaults
        const labels = data.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const datasets = data.datasets || [
            { label: 'Surat Masuk', data: new Array(12).fill(0), backgroundColor: 'rgba(25, 118, 210, 0.7)', borderColor: '#1976D2' },
            { label: 'Surat Keluar', data: new Array(12).fill(0), backgroundColor: 'rgba(76, 175, 80, 0.7)', borderColor: '#4CAF50' }
        ];
        
        const ctx = canvas.getContext('2d');
        const chartType = type || 'bar';
        
        try {
            this.chartInstances.main = new Chart(ctx, {
                type: chartType,
                data: {
                    labels: labels,
                    datasets: datasets.map(ds => ({
                        ...ds,
                        borderWidth: 2,
                        borderRadius: 4,
                        tension: 0.3
                    }))
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
                                boxWidth: 12,
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
    renderDefaultChart(type) {
        const defaultData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
            datasets: [
                { label: 'Surat Masuk', data: new Array(12).fill(0), backgroundColor: 'rgba(25, 118, 210, 0.7)', borderColor: '#1976D2' },
                { label: 'Surat Keluar', data: new Array(12).fill(0), backgroundColor: 'rgba(76, 175, 80, 0.7)', borderColor: '#4CAF50' }
            ]
        };
        this.renderChart(defaultData, type);
    },
    
    // ========== LOAD AI INSIGHTS ==========
    async loadAIInsights() {
        try {
            const container = document.getElementById('aiInsights');
            if (!container) return;
            
            const response = await API.get('dashboard.aiInsights', { token: App.token });
            
            if (response.status === 'success') {
                const insights = response.data?.insights || [];
                if (insights.length === 0) {
                    container.innerHTML = `
                        <div class="text-center text-muted" style="padding: 20px;">
                            <i class="fas fa-robot" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>
                            <p>AI Insights akan aktif setelah data mencukupi</p>
                        </div>
                    `;
                    return;
                }
                
                container.innerHTML = insights.map(insight => `
                    <div style="display: flex; align-items: flex-start; gap: 12px; padding: 10px; background: var(--bg-hover); border-radius: 8px; border-left: 3px solid var(--primary);">
                        <span style="font-size: 20px;">${insight.icon || '💡'}</span>
                        <div>
                            <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">${insight.title || 'Info'}</div>
                            <div style="font-size: 13px; color: var(--text-secondary);">${insight.description || '-'}</div>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('❌ Error loading AI insights:', error);
        }
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
                            <i class="fas fa-inbox" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>
                            <p>Belum ada aktivitas</p>
                        </div>
                    `;
                    return;
                }
                
                container.innerHTML = items.slice(0, 10).map(item => `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-bottom: 1px solid var(--border-color);">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--bg-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="fas fa-circle" style="font-size: 8px; color: var(--primary);"></i>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 13px; color: var(--text-primary);">
                                <strong>${item.aksi || 'Unknown'}</strong>
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary); word-break: break-word;">
                                ${item.deskripsi || '-'}
                            </div>
                        </div>
                        <div style="font-size: 11px; color: var(--text-light); white-space: nowrap;">
                            ${Utils.timeAgo(item.createdAt)}
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="text-center text-danger" style="padding: 20px;">
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
                        <p>Gagal memuat aktivitas: ${error.message}</p>
                    </div>
                `;
            }
        }
    },
    
    // ========== LOAD SYSTEM STATUS ==========
    async loadSystemStatus() {
        try {
            const response = await API.get('system.status', { token: App.token });
            
            if (response.status === 'success') {
                const status = response.data;
                
                const serverStatus = document.getElementById('serverStatus');
                const dbStatus = document.getElementById('dbStatus');
                const cacheStatus = document.getElementById('cacheStatus');
                
                if (serverStatus) {
                    serverStatus.textContent = status.status === 'running' ? 'Online' : 'Offline';
                    serverStatus.className = `status-badge ${status.status === 'running' ? 'approved' : 'rejected'}`;
                }
                
                if (dbStatus) {
                    dbStatus.textContent = 'Connected';
                    dbStatus.className = 'status-badge approved';
                }
                
                if (cacheStatus) {
                    cacheStatus.textContent = 'Active';
                    cacheStatus.className = 'status-badge approved';
                }
            }
        } catch (error) {
            console.error('❌ Error loading system status:', error);
        }
    },
    
    // ========== UPDATE LAST UPDATE TIME ==========
    updateLastUpdateTime() {
        const el = document.getElementById('lastUpdateTime');
        if (el) {
            el.textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
    },
    
    // ========== EXPORT DASHBOARD ==========
    async exportDashboard() {
        try {
            showToast('info', 'Export', 'Mempersiapkan data...');
            
            // Get stats for export
            const response = await API.get('dashboard.stats', { token: App.token });
            
            if (response.status === 'success') {
                const stats = response.data;
                const timestamp = new Date().toISOString().slice(0, 10);
                
                // Create CSV data
                const csvData = [
                    ['Metric', 'Value'],
                    ['Total Surat Masuk', stats.suratMasuk?.total || 0],
                    ['Surat Masuk Pending', stats.suratMasuk?.pending || 0],
                    ['Total Surat Keluar', stats.suratKeluar?.total || 0],
                    ['Surat Keluar Pending', stats.suratKeluar?.pending || 0],
                    ['Total Disposisi', stats.disposisi?.total || 0],
                    ['Disposisi Pending', stats.disposisi?.pending || 0]
                ];
                
                const csv = csvData.map(row => row.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                
                // Download
                const link = document.createElement('a');
                link.href = url;
                link.download = `dashboard_export_${timestamp}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                showToast('success', 'Export Berhasil', 'Data dashboard berhasil diexport');
            } else {
                showToast('error', 'Export Gagal', response.message || 'Gagal export data');
            }
        } catch (error) {
            console.error('❌ Export error:', error);
            showToast('error', 'Export Gagal', error.message);
        }
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
    }
};

// ========== CLEANUP ON PAGE UNLOAD ==========
document.addEventListener('beforeunload', function() {
    if (Dashboard.destroy) {
        Dashboard.destroy();
    }
});

console.log('📊 Dashboard Module Loaded');
