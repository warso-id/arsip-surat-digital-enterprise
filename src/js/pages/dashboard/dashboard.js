/**
 * DASHBOARD PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Main dashboard with stats, charts, and real-time data
 */

class DashboardPage {
  constructor() {
    this.container = null;
    this.charts = {};
    this.refreshInterval = null;
    this.widgets = [];
  }
  
  /**
   * Render dashboard
   */
  async render(container) {
    this.container = container;
    
    // Show loading
    this.showLoading();
    
    try {
      // Load data
      const [stats, chart, insights, realtime] = await Promise.all([
        api.getDashboardStats(),
        api.getDashboardChart(),
        api.getDashboardAIInsights(),
        api.getDashboardRealtime()
      ]);
      
      // Render dashboard
      this.container.innerHTML = this.getTemplate();
      
      // Update stats cards
      if (stats.status === 'success') {
        this.updateStatsCards(stats.data);
      }
      
      // Render charts
      if (chart.status === 'success') {
        this.renderCharts(chart.data);
      }
      
      // Show AI insights
      if (insights.status === 'success') {
        this.renderInsights(insights.data);
      }
      
      // Setup real-time updates
      if (realtime.status === 'success') {
        this.setupRealtime(realtime.data);
      }
      
      // Setup refresh
      this.setupAutoRefresh();
      
      // Setup widgets
      this.setupWidgets();
      
    } catch (error) {
      this.showError(error);
    }
  }
  
  /**
   * Get dashboard template
   */
  getTemplate() {
    return `
      <div class="dashboard">
        <!-- Header -->
        <div class="content-area__header">
          <h1 class="content-area__title">Dashboard</h1>
          <p class="content-area__description">
            Selamat datang di Arsip Surat Digital Enterprise
          </p>
        </div>
        
        <!-- Quick Actions -->
        <div class="quick-actions">
          <button class="btn btn-primary" onclick="router.navigate('/surat-masuk/create')">
            <span class="material-icons">add</span>
            Surat Masuk Baru
          </button>
          <button class="btn btn-secondary" onclick="router.navigate('/surat-keluar/create')">
            <span class="material-icons">add</span>
            Surat Keluar Baru
          </button>
          <button class="btn btn-tertiary" onclick="router.navigate('/disposisi/create')">
            <span class="material-icons">forward</span>
            Buat Disposisi
          </button>
        </div>
        
        <!-- Stats Cards -->
        <div class="stats-grid" id="stats-grid">
          <div class="stat-card skeleton-card"></div>
          <div class="stat-card skeleton-card"></div>
          <div class="stat-card skeleton-card"></div>
          <div class="stat-card skeleton-card"></div>
        </div>
        
        <!-- Charts Row -->
        <div class="charts-row">
          <div class="chart-card" id="chart-surat-masuk">
            <div class="chart-card__header">
              <h3>Tren Surat Masuk</h3>
              <div class="chart-card__actions">
                <button class="btn-icon btn-icon-sm chart-period" data-period="weekly">M</button>
                <button class="btn-icon btn-icon-sm chart-period active" data-period="monthly">B</button>
                <button class="btn-icon btn-icon-sm chart-period" data-period="yearly">T</button>
              </div>
            </div>
            <div class="chart-card__body">
              <canvas id="chart-sm" height="300"></canvas>
            </div>
          </div>
          
          <div class="chart-card" id="chart-surat-keluar">
            <div class="chart-card__header">
              <h3>Tren Surat Keluar</h3>
            </div>
            <div class="chart-card__body">
              <canvas id="chart-sk" height="300"></canvas>
            </div>
          </div>
        </div>
        
        <!-- Bottom Row -->
        <div class="dashboard-bottom">
          <!-- Recent Activity -->
          <div class="card" id="recent-activity">
            <div class="card__header">
              <h3>Aktivitas Terbaru</h3>
              <a href="#/audit-log" class="btn-ghost btn-sm">Lihat Semua</a>
            </div>
            <div class="card__body" id="activity-list">
              <div class="skeleton-text"></div>
              <div class="skeleton-text"></div>
              <div class="skeleton-text"></div>
            </div>
          </div>
          
          <!-- AI Insights -->
          <div class="card" id="ai-insights">
            <div class="card__header">
              <h3>
                <span class="material-icons">psychology</span>
                AI Insights
              </h3>
            </div>
            <div class="card__body" id="insights-list">
              <div class="skeleton-text"></div>
              <div class="skeleton-text"></div>
            </div>
          </div>
          
          <!-- Real-time Status -->
          <div class="card" id="realtime-status">
            <div class="card__header">
              <h3>
                <span class="material-icons">online_prediction</span>
                Real-time Status
              </h3>
            </div>
            <div class="card__body" id="realtime-content">
              <div class="skeleton-text"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Update stats cards
   */
  updateStatsCards(data) {
    const statsGrid = this.container.querySelector('#stats-grid');
    if (!statsGrid) return;
    
    const cards = [
      {
        title: 'Surat Masuk',
        icon: 'inbox',
        color: 'primary',
        total: data.suratMasuk?.total || 0,
        pending: data.suratMasuk?.pending || 0,
        link: '/surat-masuk'
      },
      {
        title: 'Surat Keluar',
        icon: 'outbox',
        color: 'secondary',
        total: data.suratKeluar?.total || 0,
        pending: data.suratKeluar?.pending || 0,
        link: '/surat-keluar'
      },
      {
        title: 'Disposisi',
        icon: 'forward',
        color: 'tertiary',
        total: data.disposisi?.total || 0,
        pending: data.disposisi?.pending || 0,
        link: '/disposisi'
      },
      {
        title: 'Approval',
        icon: 'check_circle',
        color: 'warning',
        total: data.approval?.total || 0,
        pending: data.approval?.pending || 0,
        link: '/approval'
      }
    ];
    
    statsGrid.innerHTML = cards.map(card => `
      <div class="stat-card stat-card--${card.color}" onclick="router.navigate('${card.link}')">
        <div class="stat-card__icon">
          <span class="material-icons">${card.icon}</span>
        </div>
        <div class="stat-card__content">
          <div class="stat-card__title">${card.title}</div>
          <div class="stat-card__value">${card.total.toLocaleString()}</div>
          ${card.pending > 0 ? `
            <div class="stat-card__pending">
              <span class="badge badge-warning">${card.pending} pending</span>
            </div>
          ` : ''}
        </div>
        <div class="stat-card__trend">
          <span class="material-icons">trending_up</span>
          <span>12%</span>
        </div>
      </div>
    `).join('');
    
    // Animate numbers
    this.animateNumbers();
  }
  
  /**
   * Animate stat numbers
   */
  animateNumbers() {
    const values = this.container.querySelectorAll('.stat-card__value');
    values.forEach(el => {
      const target = parseInt(el.textContent.replace(/,/g, ''));
      if (isNaN(target)) return;
      
      const duration = 1000;
      const start = performance.now();
      const initial = 0;
      
      const animate = (currentTime) => {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // Ease out
        const current = Math.floor(initial + (target - initial) * eased);
        el.textContent = current.toLocaleString();
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    });
  }
  
  /**
   * Render charts
   */
  renderCharts(data) {
    this.renderSuratMasukChart(data);
    this.renderSuratKeluarChart(data);
  }
  
  /**
   * Render surat masuk chart
   */
  renderSuratMasukChart(data) {
    const canvas = this.container.querySelector('#chart-sm');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (this.charts.suratMasuk) {
      this.charts.suratMasuk.destroy();
    }
    
    // Create new chart
    this.charts.suratMasuk = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
        datasets: [{
          label: 'Surat Masuk',
          data: data.suratMasuk || [12, 19, 15, 25, 22, 30],
          borderColor: '#1976D2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#1976D2',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#333',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#666' }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { color: '#666' }
          }
        }
      }
    });
  }
  
  /**
   * Render surat keluar chart
   */
  renderSuratKeluarChart(data) {
    const canvas = this.container.querySelector('#chart-sk');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (this.charts.suratKeluar) {
      this.charts.suratKeluar.destroy();
    }
    
    // Create new chart
    this.charts.suratKeluar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
        datasets: [{
          label: 'Surat Keluar',
          data: data.suratKeluar || [8, 15, 12, 20, 18, 25],
          backgroundColor: [
            'rgba(25, 118, 210, 0.7)',
            'rgba(25, 118, 210, 0.7)',
            'rgba(25, 118, 210, 0.7)',
            'rgba(25, 118, 210, 0.7)',
            'rgba(25, 118, 210, 0.7)',
            'rgba(25, 118, 210, 0.7)'
          ],
          borderColor: '#1976D2',
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#666' }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { color: '#666' }
          }
        }
      }
    });
  }
  
  /**
   * Render AI insights
   */
  renderInsights(data) {
    const insightsList = this.container.querySelector('#insights-list');
    if (!insightsList) return;
    
    const insights = data.insights || [
      'Tren surat masuk meningkat 15% dibanding bulan lalu',
      'Rata-rata waktu disposisi: 2.5 hari',
      'Kategori surat terbanyak: Undangan (30%)',
      'Rekomendasi: Optimalkan alur approval surat keluar'
    ];
    
    insightsList.innerHTML = insights.map(insight => `
      <div class="insight-item">
        <span class="material-icons insight-icon">tips_and_updates</span>
        <p>${insight}</p>
      </div>
    `).join('');
  }
  
  /**
   * Setup real-time updates
   */
  setupRealtime(data) {
    const realtimeContent = this.container.querySelector('#realtime-content');
    if (!realtimeContent) return;
    
    const { online = 0, activeUsers = 0, lastActivity = null } = data.stats || {};
    
    realtimeContent.innerHTML = `
      <div class="realtime-stats">
        <div class="realtime-stat">
          <div class="realtime-stat__value">${online}</div>
          <div class="realtime-stat__label">Online</div>
        </div>
        <div class="realtime-stat">
          <div class="realtime-stat__value">${activeUsers}</div>
          <div class="realtime-stat__label">Aktif</div>
        </div>
      </div>
      <div class="realtime-indicator">
        <span class="status-dot status-dot--online"></span>
        Sistem berjalan normal
      </div>
      ${lastActivity ? `<small>Update: ${new Date(lastActivity).toLocaleTimeString()}</small>` : ''}
    `;
  }
  
  /**
   * Setup auto refresh
   */
  setupAutoRefresh() {
    // Refresh every 30 seconds
    this.refreshInterval = setInterval(async () => {
      try {
        const stats = await api.getDashboardStats();
        if (stats.status === 'success') {
          this.updateStatsCards(stats.data);
        }
      } catch (error) {
        console.warn('Auto refresh failed:', error);
      }
    }, 30000);
  }
  
  /**
   * Setup widgets
   */
  setupWidgets() {
    // Load recent activity
    this.loadRecentActivity();
    
    // Setup chart period buttons
    const periodButtons = this.container.querySelectorAll('.chart-period');
    periodButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        periodButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const period = btn.dataset.period;
        try {
          const chart = await api.getDashboardChart(period);
          if (chart.status === 'success') {
            this.renderCharts(chart.data);
          }
        } catch (error) {
          console.error('Failed to load chart:', error);
        }
      });
    });
  }
  
  /**
   * Load recent activity
   */
  async loadRecentActivity() {
    try {
      const response = await api.getAuditLogList({ limit: 5 });
      const activityList = this.container.querySelector('#activity-list');
      
      if (response.status === 'success' && activityList) {
        const items = response.data.items || [];
        activityList.innerHTML = items.map(item => `
          <div class="activity-item">
            <div class="activity-item__icon">
              <span class="material-icons">${this.getActivityIcon(item.aksi)}</span>
            </div>
            <div class="activity-item__content">
              <div class="activity-item__title">${item.deskripsi || item.aksi}</div>
              <div class="activity-item__time">${this.formatTime(item.createdAt)}</div>
            </div>
          </div>
        `).join('');
        
        if (items.length === 0) {
          activityList.innerHTML = '<p class="text-muted">Belum ada aktivitas</p>';
        }
      }
    } catch (error) {
      console.warn('Failed to load activity:', error);
    }
  }
  
  /**
   * Get activity icon
   */
  getActivityIcon(action) {
    const icons = {
      'LOGIN': 'login',
      'LOGOUT': 'logout',
      'CREATE_SURAT_MASUK': 'inbox',
      'CREATE_SURAT_KELUAR': 'outbox',
      'CREATE_DISPOSISI': 'forward',
      'APPROVE': 'check_circle',
      'DELETE': 'delete'
    };
    return icons[action] || 'info';
  }
  
  /**
   * Format time
   */
  formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
    return date.toLocaleDateString('id-ID');
  }
  
  /**
   * Show loading state
   */
  showLoading() {
    if (this.container) {
      this.container.innerHTML = `
        <div class="dashboard-loading">
          <div class="skeleton-card" style="height:200px"></div>
          <div class="stats-grid">
            <div class="skeleton-card" style="height:120px"></div>
            <div class="skeleton-card" style="height:120px"></div>
            <div class="skeleton-card" style="height:120px"></div>
            <div class="skeleton-card" style="height:120px"></div>
          </div>
        </div>
      `;
    }
  }
  
  /**
   * Show error state
   */
  showError(error) {
    if (this.container) {
      this.container.innerHTML = `
        <div class="error-state">
          <img src="src/assets/images/error-state.svg" alt="Error" class="error-state__image">
          <h3>Gagal Memuat Dashboard</h3>
          <p>${error.message || 'Terjadi kesalahan'}</p>
          <button class="btn btn-primary" onclick="router.reload()">
            <span class="material-icons">refresh</span>
            Muat Ulang
          </button>
        </div>
      `;
    }
  }
  
  /**
   * Destroy dashboard
   */
  destroy() {
    // Clear refresh interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Destroy charts
    Object.values(this.charts).forEach(chart => {
      if (chart && chart.destroy) {
        chart.destroy();
      }
    });
    this.charts = {};
  }
}

// Export for router
const DashboardComponent = (props) => {
  const dashboard = new DashboardPage();
  const container = document.createElement('div');
  container.className = 'content-area';
  
  dashboard.render(container);
  
  // Store reference for cleanup
  container._dashboard = dashboard;
  
  // Cleanup on destroy
  container.addEventListener('destroy', () => {
    dashboard.destroy();
  });
  
  return container;
};
