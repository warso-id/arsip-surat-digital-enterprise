/**
 * COMPREHENSIVE REPORTS PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class ReportsPage {
  constructor() {
    this.container = null;
    this.reportData = null;
    this.charts = {};
    this.filters = {
      period: 'monthly',
      startDate: '',
      endDate: '',
      category: 'all'
    };
  }
  
  async render(container) {
    this.container = container;
    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
    await this.loadReport();
  }
  
  getTemplate() {
    return `
      <div class="reports-page">
        <div class="content-area__header">
          <h1 class="content-area__title">Laporan Komprehensif</h1>
          <p class="content-area__description">Analisis dan laporan lengkap sistem arsip surat</p>
        </div>
        
        <div class="filters-bar">
          <select class="form-select" id="filter-period" style="width:150px">
            <option value="daily">Harian</option>
            <option value="weekly">Mingguan</option>
            <option value="monthly" selected>Bulanan</option>
            <option value="yearly">Tahunan</option>
          </select>
          <input type="date" class="form-input" id="filter-start" style="width:160px">
          <input type="date" class="form-input" id="filter-end" style="width:160px">
          <select class="form-select" id="filter-category" style="width:180px">
            <option value="all">Semua Kategori</option>
            <option value="surat-masuk">Surat Masuk</option>
            <option value="surat-keluar">Surat Keluar</option>
            <option value="disposisi">Disposisi</option>
          </select>
          <button class="btn btn-primary btn-sm" id="btn-apply-filter">
            <span class="material-icons">filter_alt</span> Terapkan
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-export-pdf">
            <span class="material-icons">picture_as_pdf</span> Export PDF
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-export-excel">
            <span class="material-icons">table_chart</span> Export Excel
          </button>
        </div>
        
        <div class="stats-grid" id="report-stats">
          <div class="stat-card skeleton-card" style="height:120px"></div>
          <div class="stat-card skeleton-card" style="height:120px"></div>
          <div class="stat-card skeleton-card" style="height:120px"></div>
          <div class="stat-card skeleton-card" style="height:120px"></div>
        </div>
        
        <div class="charts-row">
          <div class="chart-card">
            <div class="chart-card__header"><h3>Tren Surat</h3></div>
            <div class="chart-card__body"><canvas id="chart-trend" height="300"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-card__header"><h3>Distribusi Status</h3></div>
            <div class="chart-card__body"><canvas id="chart-status" height="300"></canvas></div>
          </div>
        </div>
        
        <div class="charts-row">
          <div class="chart-card">
            <div class="chart-card__header"><h3>Kategori Surat</h3></div>
            <div class="chart-card__body"><canvas id="chart-category" height="300"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-card__header"><h3>Top Pengirim</h3></div>
            <div class="chart-card__body" id="top-pengirim"></div>
          </div>
        </div>
        
        <div class="card">
          <div class="card__header">
            <h3>Detail Data</h3>
            <button class="btn btn-sm btn-ghost" id="btn-toggle-detail">
              <span class="material-icons">expand_more</span>
            </button>
          </div>
          <div class="card__body" id="detail-data" style="display:none">
            <table class="data-table" id="report-table">
              <thead><tr><th>Kategori</th><th>Total</th><th>Selesai</th><th>Pending</th><th>Persentase</th></tr></thead>
              <tbody id="report-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
  
  async loadReport() {
    try {
      const response = await api.get('report.comprehensive', this.filters);
      
      if (response.status === 'success') {
        this.reportData = response.data;
        this.updateStats();
        this.renderCharts();
        this.renderTopPengirim();
        this.renderDetailTable();
      }
    } catch (error) {
      NotificationService.error('Gagal memuat laporan');
    }
  }
  
  updateStats() {
    if (!this.reportData) return;
    
    const stats = [
      { title: 'Total Surat Masuk', value: this.reportData.suratMasuk?.total || 0, icon: 'inbox', color: 'primary' },
      { title: 'Total Surat Keluar', value: this.reportData.suratKeluar?.total || 0, icon: 'outbox', color: 'secondary' },
      { title: 'Total Disposisi', value: this.reportData.disposisi?.total || 0, icon: 'forward', color: 'tertiary' },
      { title: 'Completion Rate', value: `${this.reportData.completionRate || 0}%`, icon: 'check_circle', color: 'success' }
    ];
    
    const statsGrid = document.getElementById('report-stats');
    if (statsGrid) {
      statsGrid.innerHTML = stats.map(s => `
        <div class="stat-card stat-card--${s.color}">
          <div class="stat-card__icon"><span class="material-icons">${s.icon}</span></div>
          <div class="stat-card__content">
            <div class="stat-card__title">${s.title}</div>
            <div class="stat-card__value">${typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
          </div>
        </div>
      `).join('');
    }
  }
  
  renderCharts() {
    this.renderTrendChart();
    this.renderStatusChart();
    this.renderCategoryChart();
  }
  
  renderTrendChart() {
    const canvas = document.getElementById('chart-trend');
    if (!canvas) return;
    
    if (this.charts.trend) this.charts.trend.destroy();
    
    const data = this.reportData?.trend || { labels: [], suratMasuk: [], suratKeluar: [] };
    
    this.charts.trend = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: data.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
        datasets: [
          { label: 'Surat Masuk', data: data.suratMasuk || [], borderColor: '#1976D2', tension: 0.4, fill: false },
          { label: 'Surat Keluar', data: data.suratKeluar || [], borderColor: '#E65100', tension: 0.4, fill: false }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }
  
  renderStatusChart() {
    const canvas = document.getElementById('chart-status');
    if (!canvas) return;
    
    if (this.charts.status) this.charts.status.destroy();
    
    const data = this.reportData?.statusDistribution || { labels: [], data: [] };
    
    this.charts.status = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: data.labels || ['Selesai', 'Diproses', 'Pending'],
        datasets: [{ data: data.data || [30, 20, 10], backgroundColor: ['#4CAF50', '#FF9800', '#F44336'] }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }
  
  renderCategoryChart() {
    const canvas = document.getElementById('chart-category');
    if (!canvas) return;
    
    if (this.charts.category) this.charts.category.destroy();
    
    const data = this.reportData?.categories || { labels: [], data: [] };
    
    this.charts.category = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: data.labels || [],
        datasets: [{ label: 'Jumlah', data: data.data || [], backgroundColor: '#1976D2' }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }
  
  renderTopPengirim() {
    const container = document.getElementById('top-pengirim');
    if (!container) return;
    
    const data = this.reportData?.topPengirim || [];
    
    if (data.length === 0) {
      container.innerHTML = '<p class="text-muted text-center">Tidak ada data</p>';
      return;
    }
    
    container.innerHTML = data.slice(0, 10).map((item, index) => `
      <div class="top-item">
        <span class="top-item__rank">${index + 1}</span>
        <span class="top-item__name">${item.nama || '-'}</span>
        <span class="top-item__count">${item.count || 0} surat</span>
        <div class="progress" style="width:100px">
          <div class="progress__bar" style="width:${item.percentage || 0}%"></div>
        </div>
      </div>
    `).join('');
  }
  
  renderDetailTable() {
    const tbody = document.getElementById('report-tbody');
    if (!tbody || !this.reportData) return;
    
    const rows = [
      { category: 'Surat Masuk', total: this.reportData.suratMasuk?.total || 0, selesai: this.reportData.suratMasuk?.selesai || 0, pending: this.reportData.suratMasuk?.pending || 0 },
      { category: 'Surat Keluar', total: this.reportData.suratKeluar?.total || 0, selesai: this.reportData.suratKeluar?.selesai || 0, pending: this.reportData.suratKeluar?.pending || 0 },
      { category: 'Disposisi', total: this.reportData.disposisi?.total || 0, selesai: this.reportData.disposisi?.selesai || 0, pending: this.reportData.disposisi?.pending || 0 }
    ];
    
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td><strong>${r.category}</strong></td>
        <td>${r.total.toLocaleString()}</td>
        <td>${r.selesai.toLocaleString()}</td>
        <td>${r.pending.toLocaleString()}</td>
        <td>${r.total > 0 ? Math.round((r.selesai / r.total) * 100) : 0}%</td>
      </tr>
    `).join('');
  }
  
  async exportPDF() {
    await ExportService.exportPDF('report', this.reportData, {
      title: 'Laporan Komprehensif',
      orientation: 'landscape'
    });
  }
  
  async exportExcel() {
    await ExportService.exportExcel('surat-masuk', this.reportData?.suratMasuk?.items || [], {
      fileName: `laporan-komprehensif-${new Date().toISOString().split('T')[0]}.xlsx`
    });
  }
  
  bindEvents() {
    document.getElementById('btn-apply-filter')?.addEventListener('click', () => {
      this.filters.period = document.getElementById('filter-period').value;
      this.filters.startDate = document.getElementById('filter-start').value;
      this.filters.endDate = document.getElementById('filter-end').value;
      this.filters.category = document.getElementById('filter-category').value;
      this.loadReport();
    });
    document.getElementById('btn-export-pdf')?.addEventListener('click', () => this.exportPDF());
    document.getElementById('btn-export-excel')?.addEventListener('click', () => this.exportExcel());
    document.getElementById('btn-toggle-detail')?.addEventListener('click', () => {
      const detail = document.getElementById('detail-data');
      const icon = document.querySelector('#btn-toggle-detail .material-icons');
      if (detail.style.display === 'none') {
        detail.style.display = 'block';
        icon.textContent = 'expand_less';
      } else {
        detail.style.display = 'none';
        icon.textContent = 'expand_more';
      }
    });
  }
  
  destroy() {
    Object.values(this.charts).forEach(chart => { if (chart?.destroy) chart.destroy(); });
    this.charts = {};
  }
}

const ReportsComponent = (props) => {
  const page = new ReportsPage();
  const container = document.createElement('div');
  container.className = 'content-area reports-page';
  page.render(container);
  container.addEventListener('destroy', () => page.destroy());
  return container;
};
