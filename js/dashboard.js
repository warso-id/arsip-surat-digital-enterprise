/**
 * ============================================
 * DASHBOARD.JS - Dashboard Module
 * ARSIP SURAT DIGITAL v3.2.2
 * ============================================
 */

const Dashboard = {
    chartInstances: {},
    
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
                        <div class="stat-change up"><i class="fas fa-arrow-up"></i> 0%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon green"><i class="fas fa-paper-plane"></i></div>
                        <div class="stat-number" id="statSKTotal">0</div>
                        <div class="stat-label">Total Surat Keluar</div>
                        <div class="stat-change up"><i class="fas fa-arrow-up"></i> 0%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon orange"><i class="fas fa-clipboard-list"></i></div>
                        <div class="stat-number" id="statDispTotal">0</div>
                        <div class="stat-label">Total Disposisi</div>
                        <div class="stat-change up"><i class="fas fa-arrow-up"></i> 0%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon purple"><i class="fas fa-check-double"></i></div>
                        <div class="stat-number" id="statApprovalPending">0</div>
                        <div class="stat-label">Approval Pending</div>
                        <div class="stat-change down"><i class="fas fa-arrow-down"></i> 0%</div>
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
                        </div>
                    </div>
                    <canvas id="chartMain" height="300"></canvas>
                </div>
                
                <!-- Recent Activity -->
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-history"></i> Aktivitas Terbaru</h3>
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
        this.loadStats();
        this.loadChart();
        this.loadRecentActivity();
    },
    
    getYearOptions() {
        const currentYear = new Date().getFullYear();
        let options = '';
        for (let y = currentYear - 3; y <= currentYear; y++) {
            options += `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`;
        }
        return options;
    },
    
    // ========== LOAD STATS ==========
    async loadStats() {
        try {
            const response = await API.get('dashboard.stats', { token: App.token });
            if (response.status === 'success') {
                const stats = response.data;
                document.getElementById('statSMTotal').textContent = stats.suratMasuk?.total || 0;
                document.getElementById('statSKTotal').textContent = stats.suratKeluar?.total || 0;
                document.getElementById('statDispTotal').textContent = stats.disposisi?.total || 0;
                document.getElementById('statApprovalPending').textContent = stats.suratKeluar?.pending || 0;
                
                // Update badges
                document.getElementById('smBadge').textContent = stats.suratMasuk?.pending || 0;
                document.getElementById('skBadge').textContent = stats.suratKeluar?.pending || 0;
                document.getElementById('dispBadge').textContent = stats.disposisi?.pending || 0;
                document.getElementById('apprBadge').textContent = stats.suratKeluar?.pending || 0;
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },
    
    // ========== LOAD CHART ==========
    async loadChart() {
        const yearSelect = document.getElementById('chartYear');
        if (yearSelect) {
            yearSelect.addEventListener('change', () => {
                this.loadChartData(yearSelect.value);
            });
            this.loadChartData(yearSelect.value);
        }
    },
    
    async loadChartData(year) {
        try {
            const response = await API.get('dashboard.chart', { 
                token: App.token,
                year: year
            });
            
            if (response.status === 'success' && response.data) {
                this.renderChart(response.data);
            }
        } catch (error) {
            console.error('Error loading chart:', error);
        }
    },
    
    renderChart(data) {
        const canvas = document.getElementById('chartMain');
        if (!canvas) return;
        
        // Destroy existing chart
        if (this.chartInstances.main) {
            this.chartInstances.main.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        this.chartInstances.main = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels || [],
                datasets: data.datasets || []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
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
    },
    
    // ========== LOAD RECENT ACTIVITY ==========
    async loadRecentActivity() {
        try {
            const response = await API.get('auditLog.list', { 
                token: App.token,
                limit: 10
            });
            
            const container = document.getElementById('recentActivity');
            
            if (response.status === 'success') {
                const items = response.data.items || [];
                if (items.length === 0) {
                    container.innerHTML = '<p class="text-muted">Belum ada aktivitas</p>';
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
                                        <td>${Utils.formatDate(item.createdAt)}</td>
                                        <td><span class="status-badge">${item.aksi}</span></td>
                                        <td>${item.deskripsi || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading recent activity:', error);
            document.getElementById('recentActivity').innerHTML = 
                '<p class="text-danger">Gagal memuat aktivitas</p>';
        }
    }
};
