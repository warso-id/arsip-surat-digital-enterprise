// Dashboard Renderer
class DashboardRenderer {
    async render(stats) {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="dashboard-container">
                <div class="page-header">
                    <h2><i class="fas fa-tachometer-alt"></i> Dashboard</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="refreshDashboard()">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card surat-masuk">
                        <div class="stat-icon">
                            <i class="fas fa-envelope"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.totalSuratMasuk || 0}</h3>
                            <p>Surat Masuk</p>
                        </div>
                    </div>

                    <div class="stat-card surat-keluar">
                        <div class="stat-icon">
                            <i class="fas fa-paper-plane"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.totalSuratKeluar || 0}</h3>
                            <p>Surat Keluar</p>
                        </div>
                    </div>

                    <div class="stat-card disposisi">
                        <div class="stat-icon">
                            <i class="fas fa-exchange-alt"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.totalDisposisi || 0}</h3>
                            <p>Disposisi</p>
                        </div>
                    </div>

                    <div class="stat-card pending">
                        <div class="stat-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.pendingDisposisi || 0}</h3>
                            <p>Pending</p>
                        </div>
                    </div>
                </div>

                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3>Aktivitas Terbaru</h3>
                        </div>
                        <div class="card-body">
                            <div class="activity-list">
                                ${stats.recentActivities && stats.recentActivities.length > 0 ?
                                    stats.recentActivities.map(activity => `
                                        <div class="activity-item">
                                            <div class="activity-icon">
                                                <i class="fas fa-circle"></i>
                                            </div>
                                            <div class="activity-content">
                                                <p>${activity.description}</p>
                                                <small>${this.formatDate(activity.timestamp)}</small>
                                            </div>
                                        </div>
                                    `).join('') :
                                    '<p class="text-center">Belum ada aktivitas</p>'
                                }
                            </div>
                        </div>
                    </div>

                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3>Quick Actions</h3>
                        </div>
                        <div class="card-body">
                            <div class="quick-actions">
                                <button class="btn btn-primary" onclick="app.showSuratMasuk()">
                                    <i class="fas fa-plus"></i> Surat Masuk Baru
                                </button>
                                <button class="btn btn-success" onclick="app.showSuratKeluar()">
                                    <i class="fas fa-plus"></i> Surat Keluar Baru
                                </button>
                                <button class="btn btn-info" onclick="app.showDisposisi()">
                                    <i class="fas fa-exchange-alt"></i> Buat Disposisi
                                </button>
                                <button class="btn btn-warning" onclick="app.showLaporan()">
                                    <i class="fas fa-chart-bar"></i> Generate Laporan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Global instance
const dashboardRenderer = new DashboardRenderer();

// Global function
function refreshDashboard() {
    app.showDashboard();
}
