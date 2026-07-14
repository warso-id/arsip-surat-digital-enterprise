/**
 * ============================================
 * COMPREHENSIVE REPORTS PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL REPORTING DASHBOARD - SIAP PRODUKSI
 * Mendukung: Charts, Stats, Export, Filters,
 * Multiple Report Types, API Integration
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
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
      category: 'all',
      groupBy: 'month'
    };
    this.isLoading = false;
    this.activeTab = 'overview'; // overview | surat-masuk | surat-keluar | disposisi
    this.pageId = 'reports-' + Math.random().toString(36).substr(2, 9);
  }

  async render(container) {
    this.container = container;
    this.container.setAttribute('data-page-id', this.pageId);
    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
    await this.loadReport();
    console.log('✅ ReportsPage rendered');
  }

  getTemplate() {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return `
      <div class="reports-page" id="reports-${this.pageId}">
        <div class="content-area__header">
          <div class="header-left">
            <h1 class="content-area__title">
              <span class="material-icons">assessment</span> Laporan Komprehensif
            </h1>
            <p class="content-area__description">Analisis dan laporan lengkap sistem arsip surat</p>
          </div>
          <div class="header-right">
            <button class="btn btn-sm btn-ghost" id="btn-refresh-report" title="Refresh">
              <span class="material-icons">refresh</span>
            </button>
          </div>
        </div>

        <!-- Period Quick Select -->
        <div class="chip-group" style="margin-bottom:16px">
          <span class="chip filter-chip active" data-period="today">Hari Ini</span>
          <span class="chip filter-chip" data-period="yesterday">Kemarin</span>
          <span class="chip filter-chip" data-period="this-week">Minggu Ini</span>
          <span class="chip filter-chip" data-period="this-month">Bulan Ini</span>
          <span class="chip filter-chip" data-period="last-month">Bulan Lalu</span>
          <span class="chip filter-chip" data-period="this-year">Tahun Ini</span>
          <span class="chip filter-chip" data-period="custom">Kustom</span>
        </div>

        <!-- Filters Bar -->
        <div class="filters-bar">
          <select class="form-select" id="filter-period" style="width:140px">
            <option value="daily">Harian</option>
            <option value="weekly">Mingguan</option>
            <option value="monthly" selected>Bulanan</option>
            <option value="yearly">Tahunan</option>
          </select>
          <div class="date-range" id="custom-date-range" style="display:none">
            <input type="date" class="form-input" id="filter-start" style="width:150px" value="${this.formatDateISO(firstOfMonth)}">
            <span class="text-muted">s/d</span>
            <input type="date" class="form-input" id="filter-end" style="width:150px" value="${this.formatDateISO(today)}">
          </div>
          <select class="form-select" id="filter-category" style="width:180px">
            <option value="all">Semua Kategori</option>
            <option value="surat-masuk">📥 Surat Masuk</option>
            <option value="surat-keluar">📤 Surat Keluar</option>
            <option value="disposisi">➡️ Disposisi</option>
          </select>
          <select class="form-select" id="filter-group" style="width:140px">
            <option value="day">Per Hari</option>
            <option value="week">Per Minggu</option>
            <option value="month" selected>Per Bulan</option>
            <option value="year">Per Tahun</option>
          </select>
          <div class="filters-bar__actions">
            <button class="btn btn-primary btn-sm" id="btn-apply-filter">
              <span class="material-icons">filter_alt</span> Terapkan
            </button>
            <button class="btn btn-ghost btn-sm" id="btn-reset-filter">
              <span class="material-icons">clear_all</span> Reset
            </button>
          </div>
          <div class="filters-bar__export">
            <button class="btn btn-sm btn-secondary" id="btn-export-pdf">
              <span class="material-icons">picture_as_pdf</span> PDF
            </button>
            <button class="btn btn-sm btn-secondary" id="btn-export-excel">
              <span class="material-icons">table_chart</span> Excel
            </button>
            <button class="btn btn-sm btn-ghost" id="btn-print-report">
              <span class="material-icons">print</span>
            </button>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="tabs" style="margin-bottom:24px">
          <button class="tab tab--active" data-tab="overview">📊 Ringkasan</button>
          <button class="tab" data-tab="surat-masuk">📥 Surat Masuk</button>
          <button class="tab" data-tab="surat-keluar">📤 Surat Keluar</button>
          <button class="tab" data-tab="disposisi">➡️ Disposisi</button>
        </div>

        <!-- Loading -->
        <div id="report-loading" class="page-loading" style="display:none">
          <div class="progress--circular"></div>
          <p>Memuat laporan...</p>
        </div>

        <!-- Tab: Overview -->
        <div id="tab-overview">
          <!-- Stats Cards -->
          <div class="stats-grid" id="report-stats">
            <div class="stat-card skeleton-card" style="height:120px"></div>
            <div class="stat-card skeleton-card" style="height:120px"></div>
            <div class="stat-card skeleton-card" style="height:120px"></div>
            <div class="stat-card skeleton-card" style="height:120px"></div>
          </div>

          <!-- Charts Row 1 -->
          <div class="charts-row">
            <div class="chart-card">
              <div class="chart-card__header">
                <h3>📈 Tren Surat</h3>
                <div class="chart-card__actions">
                  <button class="btn-icon btn-icon-sm chart-type-btn active" data-type="line"><span class="material-icons">show_chart</span></button>
                  <button class="btn-icon btn-icon-sm chart-type-btn" data-type="bar"><span class="material-icons">bar_chart</span></button>
                </div>
              </div>
              <div class="chart-card__body"><canvas id="chart-trend" height="300"></canvas></div>
            </div>
            <div class="chart-card">
              <div class="chart-card__header"><h3>🍩 Distribusi Status</h3></div>
              <div class="chart-card__body"><canvas id="chart-status" height="300"></canvas></div>
            </div>
          </div>

          <!-- Charts Row 2 -->
          <div class="charts-row">
            <div class="chart-card">
              <div class="chart-card__header"><h3>📊 Volume per Kategori</h3></div>
              <div class="chart-card__body"><canvas id="chart-category" height="300"></canvas></div>
            </div>
            <div class="chart-card">
              <div class="chart-card__header"><h3>🏆 Top 10 Pengirim</h3></div>
              <div class="chart-card__body" id="top-pengirim"></div>
            </div>
          </div>

          <!-- Detail Table -->
          <div class="card" style="margin-top:24px">
            <div class="card__header">
              <h3>📋 Detail Data</h3>
              <button class="btn btn-sm btn-ghost" id="btn-toggle-detail">
                <span class="material-icons">expand_more</span>
              </button>
            </div>
            <div class="card__body" id="detail-data" style="display:none">
              <div class="table-container">
                <table class="data-table data-table--striped">
                  <thead>
                    <tr>
                      <th>Kategori</th>
                      <th>Total</th>
                      <th>Selesai</th>
                      <th>Diproses</th>
                      <th>Pending</th>
                      <th>Persentase</th>
                    </tr>
                  </thead>
                  <tbody id="report-tbody"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Surat Masuk -->
        <div id="tab-surat-masuk" style="display:none">
          <div class="stats-grid" id="sm-stats"></div>
          <div class="charts-row">
            <div class="chart-card">
              <div class="chart-card__header"><h3>Tren Surat Masuk</h3></div>
              <div class="chart-card__body"><canvas id="chart-sm-trend" height="300"></canvas></div>
            </div>
            <div class="chart-card">
              <div class="chart-card__header"><h3>Distribusi Sifat</h3></div>
              <div class="chart-card__body"><canvas id="chart-sm-sifat" height="300"></canvas></div>
            </div>
          </div>
        </div>

        <!-- Tab: Surat Keluar -->
        <div id="tab-surat-keluar" style="display:none">
          <div class="stats-grid" id="sk-stats"></div>
          <div class="charts-row">
            <div class="chart-card">
              <div class="chart-card__header"><h3>Tren Surat Keluar</h3></div>
              <div class="chart-card__body"><canvas id="chart-sk-trend" height="300"></canvas></div>
            </div>
            <div class="chart-card">
              <div class="chart-card__header"><h3>Status Approval</h3></div>
              <div class="chart-card__body"><canvas id="chart-sk-approval" height="300"></canvas></div>
            </div>
          </div>
        </div>

        <!-- Tab: Disposisi -->
        <div id="tab-disposisi" style="display:none">
          <div class="stats-grid" id="disp-stats"></div>
          <div class="charts-row">
            <div class="chart-card">
              <div class="chart-card__header"><h3>Tren Disposisi</h3></div>
              <div class="chart-card__body"><canvas id="chart-disp-trend" height="300"></canvas></div>
            </div>
            <div class="chart-card">
              <div class="chart-card__header"><h3>Status Disposisi</h3></div>
              <div class="chart-card__body"><canvas id="chart-disp-status" height="300"></canvas></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async loadReport() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.showLoading();

    try {
      let response;
      const params = {
        period: this.filters.period,
        startDate: this.filters.startDate || undefined,
        endDate: this.filters.endDate || undefined,
        category: this.filters.category !== 'all' ? this.filters.category : undefined,
        groupBy: this.filters.groupBy
      };

      if (typeof api !== 'undefined') {
        response = await api.get('report.comprehensive', params);
      } else if (typeof API !== 'undefined') {
        response = await API.get('report.comprehensive', params);
      } else {
        const query = new URLSearchParams({ action: 'report.comprehensive', ...params });
        const url = this.getApiUrl() + '?' + query.toString();
        const res = await fetch(url);
        response = await res.json();
      }

      if (response?.status === 'success') {
        this.reportData = response.data || {};
        this.renderAll();
      } else {
        this.showToast('Gagal memuat laporan', 'error');
      }
    } catch (error) {
      console.error('Failed to load report:', error);
      this.showToast('Gagal memuat laporan: ' + error.message, 'error');
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  renderAll() {
    if (!this.reportData) return;
    this.updateOverviewStats();
    this.renderTrendChart();
    this.renderStatusChart();
    this.renderCategoryChart();
    this.renderTopPengirim();
    this.renderDetailTable();
    this.renderSMSection();
    this.renderSKSection();
    this.renderDispSection();
  }

  updateOverviewStats() {
    const data = this.reportData;
    const stats = [
      { title: 'Total Surat Masuk', value: data.suratMasuk?.total || 0, icon: 'inbox', color: 'primary' },
      { title: 'Total Surat Keluar', value: data.suratKeluar?.total || 0, icon: 'outbox', color: 'secondary' },
      { title: 'Total Disposisi', value: data.disposisi?.total || 0, icon: 'forward', color: 'tertiary' },
      { title: 'Completion Rate', value: `${data.completionRate || 0}%`, icon: 'check_circle', color: 'success' }
    ];

    const grid = document.getElementById('report-stats');
    if (grid) {
      grid.innerHTML = stats.map(s => `
        <div class="stat-card stat-card--${s.color} animate-fade-in-up">
          <div class="stat-card__icon"><span class="material-icons">${s.icon}</span></div>
          <div class="stat-card__content">
            <div class="stat-card__title">${s.title}</div>
            <div class="stat-card__value">${typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
          </div>
        </div>
      `).join('');
    }
  }

  renderTrendChart() {
    const canvas = document.getElementById('chart-trend');
    if (!canvas) return;
    this.destroyChart('trend');

    const data = this.reportData?.trend || { labels: [], suratMasuk: [], suratKeluar: [], disposisi: [] };
    const labels = data.labels?.length ? data.labels : ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

    this.charts.trend = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Surat Masuk', data: data.suratMasuk || [], borderColor: '#1976D2', backgroundColor: 'rgba(25,118,210,0.1)', tension: 0.4, fill: true, pointRadius: 3 },
          { label: 'Surat Keluar', data: data.suratKeluar || [], borderColor: '#E65100', backgroundColor: 'rgba(230,81,0,0.1)', tension: 0.4, fill: true, pointRadius: 3 },
          { label: 'Disposisi', data: data.disposisi || [], borderColor: '#2E7D32', backgroundColor: 'rgba(46,125,50,0.1)', tension: 0.4, fill: true, pointRadius: 3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: { legend: { position: 'bottom' }, tooltip: { backgroundColor: '#333', padding: 12, cornerRadius: 8 } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } }
      }
    });
  }

  renderStatusChart() {
    const canvas = document.getElementById('chart-status');
    if (!canvas) return;
    this.destroyChart('status');

    const data = this.reportData?.statusDistribution || { labels: ['Selesai','Diproses','Pending','Terlambat'], data: [30,20,10,5] };

    this.charts.status = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{ data: data.data, backgroundColor: ['#4CAF50','#FF9800','#2196F3','#F44336'], borderWidth: 2, borderColor: '#fff' }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  renderCategoryChart() {
    const canvas = document.getElementById('chart-category');
    if (!canvas) return;
    this.destroyChart('category');

    const data = this.reportData?.categories || { labels: ['Undangan','Pemberitahuan','Permohonan','Laporan'], data: [25,20,15,10] };

    this.charts.category = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{ label: 'Jumlah', data: data.data, backgroundColor: ['#1976D2','#E65100','#2E7D32','#7B1FA2'], borderRadius: 6 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } }
      }
    });
  }

  renderTopPengirim() {
    const container = document.getElementById('top-pengirim');
    if (!container) return;

    const data = this.reportData?.topPengirim || [];

    if (data.length === 0) {
      container.innerHTML = '<p class="text-muted text-center" style="padding:40px">Tidak ada data</p>';
      return;
    }

    container.innerHTML = data.slice(0, 10).map((item, index) => `
      <div class="top-item">
        <span class="top-item__rank">${index + 1}</span>
        <div class="top-item__info">
          <span class="top-item__name">${this.escapeHtml(item.nama || item.pengirim || '-')}</span>
          <span class="top-item__count">${(item.count || item.total || 0).toLocaleString()} surat</span>
        </div>
        <div class="top-item__bar">
          <div class="progress" style="width:120px">
            <div class="progress__bar" style="width:${Math.min(100, item.percentage || ((item.count || 1) / (data[0]?.count || 1)) * 100)}%"></div>
          </div>
          <small>${Math.round(item.percentage || 0)}%</small>
        </div>
      </div>
    `).join('');
  }

  renderDetailTable() {
    const tbody = document.getElementById('report-tbody');
    if (!tbody || !this.reportData) return;

    const rows = [
      { category: 'Surat Masuk', ...this.reportData.suratMasuk },
      { category: 'Surat Keluar', ...this.reportData.suratKeluar },
      { category: 'Disposisi', ...this.reportData.disposisi }
    ];

    tbody.innerHTML = rows.map(r => {
      const total = r.total || 0;
      const selesai = r.selesai || r.completed || 0;
      const diproses = r.diproses || r.processing || 0;
      const pending = r.pending || 0;
      return `
        <tr>
          <td><strong>${r.category}</strong></td>
          <td>${total.toLocaleString()}</td>
          <td>${selesai.toLocaleString()}</td>
          <td>${diproses.toLocaleString()}</td>
          <td>${pending.toLocaleString()}</td>
          <td>
            <div class="progress" style="width:100px;display:inline-block;vertical-align:middle;margin-right:8px">
              <div class="progress__bar ${total > 0 && selesai === total ? 'progress__bar--success' : ''}" style="width:${total > 0 ? Math.round((selesai/total)*100) : 0}%"></div>
            </div>
            ${total > 0 ? Math.round((selesai/total)*100) : 0}%
          </td>
        </tr>
      `;
    }).join('');
  }

  renderSMSection() {
    const data = this.reportData?.suratMasuk;
    const grid = document.getElementById('sm-stats');
    if (grid) {
      grid.innerHTML = `
        <div class="stat-card stat-card--primary"><div class="stat-card__icon"><span class="material-icons">inbox</span></div><div class="stat-card__content"><div class="stat-card__title">Total</div><div class="stat-card__value">${(data?.total || 0).toLocaleString()}</div></div></div>
        <div class="stat-card stat-card--success"><div class="stat-card__icon"><span class="material-icons">check_circle</span></div><div class="stat-card__content"><div class="stat-card__title">Selesai</div><div class="stat-card__value">${(data?.selesai || 0).toLocaleString()}</div></div></div>
        <div class="stat-card stat-card--warning"><div class="stat-card__icon"><span class="material-icons">pending</span></div><div class="stat-card__content"><div class="stat-card__title">Pending</div><div class="stat-card__value">${(data?.pending || 0).toLocaleString()}</div></div></div>
        <div class="stat-card stat-card--info"><div class="stat-card__icon"><span class="material-icons">speed</span></div><div class="stat-card__content"><div class="stat-card__title">Rate</div><div class="stat-card__value">${data?.completionRate || 0}%</div></div></div>
      `;
    }
  }

  renderSKSection() {
    const data = this.reportData?.suratKeluar;
    const grid = document.getElementById('sk-stats');
    if (grid) {
      grid.innerHTML = `
        <div class="stat-card stat-card--secondary"><div class="stat-card__icon"><span class="material-icons">outbox</span></div><div class="stat-card__content"><div class="stat-card__title">Total</div><div class="stat-card__value">${(data?.total || 0).toLocaleString()}</div></div></div>
        <div class="stat-card stat-card--success"><div class="stat-card__icon"><span class="material-icons">check</span></div><div class="stat-card__content"><div class="stat-card__title">Approved</div><div class="stat-card__value">${(data?.approved || 0).toLocaleString()}</div></div></div>
        <div class="stat-card stat-card--warning"><div class="stat-card__icon"><span class="material-icons">hourglass_empty</span></div><div class="stat-card__content"><div class="stat-card__title">Pending</div><div class="stat-card__value">${(data?.pending || 0).toLocaleString()}</div></div></div>
        <div class="stat-card stat-card--error"><div class="stat-card__icon"><span class="material-icons">cancel</span></div><div class="stat-card__content"><div class="stat-card__title">Rejected</div><div class="stat-card__value">${(data?.rejected || 0).toLocaleString()}</div></div></div>
      `;
    }
  }

  renderDispSection() {
    const data = this.reportData?.disposisi;
    const grid = document.getElementById('disp-stats');
    if (grid) {
      grid.innerHTML = `
        <div class="stat-card stat-card--tertiary"><div class="stat-card__icon"><span class="material-icons">forward</span></div><div class="stat-card__content"><div class="stat-card__title">Total</div><div class="stat-card__value">${(data?.total || 0).toLocaleString()}</div></div></div>
        <div class="stat-card stat-card--success"><div class="stat-card__icon"><span class="material-icons">task_alt</span></div><div class="stat-card__content"><div class="stat-card__title">Selesai</div><div class="stat-card__value">${(data?.selesai || 0).toLocaleString()}</div></div></div>
        <div class="stat-card stat-card--warning"><div class="stat-card__icon"><span class="material-icons">schedule</span></div><div class="stat-card__content"><div class="stat-card__title">Pending</div><div class="stat-card__value">${(data?.pending || 0).toLocaleString()}</div></div></div>
        <div class="stat-card stat-card--error"><div class="stat-card__icon"><span class="material-icons">warning</span></div><div class="stat-card__content"><div class="stat-card__title">Terlambat</div><div class="stat-card__value">${(data?.terlambat || 0).toLocaleString()}</div></div></div>
      `;
    }
  }

  async exportPDF() {
    this.showToast('Membuat PDF...', 'info');
    if (typeof ExportService !== 'undefined') {
      await ExportService.exportPDF('report', this.reportData, { title: 'Laporan Komprehensif', orientation: 'landscape' });
    } else {
      window.print();
    }
  }

  async exportExcel() {
    this.showToast('Membuat Excel...', 'info');
    if (typeof ExportService !== 'undefined') {
      await ExportService.exportExcel('report', this.reportData, { fileName: `laporan-${new Date().toISOString().slice(0,10)}.xlsx` });
    }
  }

  applyPeriodFilter(period) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    this.filters.startDate = '';
    this.filters.endDate = '';

    switch (period) {
      case 'today': this.filters.startDate = this.formatDateISO(today); this.filters.endDate = this.formatDateISO(now); this.filters.groupBy = 'day'; break;
      case 'yesterday': const y = new Date(today); y.setDate(y.getDate()-1); this.filters.startDate = this.formatDateISO(y); this.filters.endDate = this.formatDateISO(y); this.filters.groupBy = 'day'; break;
      case 'this-week': const ws = new Date(today); ws.setDate(ws.getDate()-ws.getDay()+1); this.filters.startDate = this.formatDateISO(ws); this.filters.endDate = this.formatDateISO(now); this.filters.groupBy = 'day'; break;
      case 'this-month': this.filters.startDate = this.formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1)); this.filters.endDate = this.formatDateISO(now); this.filters.groupBy = 'week'; break;
      case 'last-month': this.filters.startDate = this.formatDateISO(new Date(now.getFullYear(), now.getMonth()-1, 1)); this.filters.endDate = this.formatDateISO(new Date(now.getFullYear(), now.getMonth(), 0)); this.filters.groupBy = 'week'; break;
      case 'this-year': this.filters.startDate = this.formatDateISO(new Date(now.getFullYear(), 0, 1)); this.filters.endDate = this.formatDateISO(now); this.filters.groupBy = 'month'; break;
      case 'custom':
        document.getElementById('custom-date-range').style.display = 'flex';
        break;
    }

    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    document.querySelector(`[data-period="${period}"]`)?.classList.add('active');

    if (period !== 'custom') {
      document.getElementById('custom-date-range').style.display = 'none';
    }

    this.loadReport();
  }

  destroyChart(name) {
    if (this.charts[name]) { this.charts[name].destroy(); this.charts[name] = null; }
  }

  showLoading() { const el = document.getElementById('report-loading'); if (el) el.style.display = 'flex'; }
  hideLoading() { const el = document.getElementById('report-loading'); if (el) el.style.display = 'none'; }

  formatDateISO(d) { try { return d.toISOString().split('T')[0]; } catch { return ''; } }
  escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
  getApiUrl() { return (typeof APP_CONFIG !== 'undefined') ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : ''; }
  showToast(m, t) { if (typeof Toast !== 'undefined') Toast.show(m, t); else if (typeof NotificationService !== 'undefined') NotificationService.show(m, t); }

  bindEvents() {
    document.getElementById('btn-apply-filter')?.addEventListener('click', () => {
      this.filters.period = document.getElementById('filter-period')?.value || 'monthly';
      this.filters.startDate = document.getElementById('filter-start')?.value || '';
      this.filters.endDate = document.getElementById('filter-end')?.value || '';
      this.filters.category = document.getElementById('filter-category')?.value || 'all';
      this.filters.groupBy = document.getElementById('filter-group')?.value || 'month';
      this.loadReport();
    });

    document.getElementById('btn-reset-filter')?.addEventListener('click', () => {
      this.filters = { period: 'monthly', startDate: '', endDate: '', category: 'all', groupBy: 'month' };
      document.getElementById('filter-start').value = '';
      document.getElementById('filter-end').value = '';
      document.getElementById('custom-date-range').style.display = 'none';
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      document.querySelector('[data-period="this-month"]')?.classList.add('active');
      this.loadReport();
    });

    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => this.applyPeriodFilter(chip.dataset.period));
    });

    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab--active'));
        tab.classList.add('tab--active');
        this.activeTab = tab.dataset.tab;
        document.getElementById('tab-overview').style.display = this.activeTab === 'overview' ? 'block' : 'none';
        document.getElementById('tab-surat-masuk').style.display = this.activeTab === 'surat-masuk' ? 'block' : 'none';
        document.getElementById('tab-surat-keluar').style.display = this.activeTab === 'surat-keluar' ? 'block' : 'none';
        document.getElementById('tab-disposisi').style.display = this.activeTab === 'disposisi' ? 'block' : 'none';
      });
    });

    document.getElementById('btn-export-pdf')?.addEventListener('click', () => this.exportPDF());
    document.getElementById('btn-export-excel')?.addEventListener('click', () => this.exportExcel());
    document.getElementById('btn-print-report')?.addEventListener('click', () => window.print());
    document.getElementById('btn-refresh-report')?.addEventListener('click', () => this.loadReport());

    document.getElementById('btn-toggle-detail')?.addEventListener('click', () => {
      const detail = document.getElementById('detail-data');
      const icon = document.querySelector('#btn-toggle-detail .material-icons');
      if (detail.style.display === 'none') { detail.style.display = 'block'; icon.textContent = 'expand_less'; }
      else { detail.style.display = 'none'; icon.textContent = 'expand_more'; }
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
  container._reportPage = page;
  page.render(container);
  container.addEventListener('destroy', () => page.destroy());
  return container;
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ReportsPage, ReportsComponent };
}
