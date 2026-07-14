/**
 * ============================================
 * AUDIT LOG PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL AUDIT LOG WITH FILTERS & EXPORT - SIAP PRODUKSI
 * Mendukung: Search, Filter, Pagination, Export,
 * Detail View, Statistics, Real-time Updates
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class AuditLogPage {
  constructor() {
    this.container = null;
    this.logs = [];
    this.pagination = { page: 1, limit: 50, total: 0, totalPages: 0 };
    this.filters = { search: '', action: '', userId: '', modul: '', startDate: '', endDate: '', sortBy: 'createdAt', sortOrder: 'desc' };
    this.isLoading = false;
    this.selectedLog = null;
    this.pollingInterval = null;
    this.viewMode = 'table'; // table | timeline
  }

  async render(container) {
    this.container = container;
    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
    await this.loadLogs();
    this.startPolling();
    await this.loadStats();
  }

  getTemplate() {
    return `
      <div class="audit-log-page" id="audit-log-container">
        <div class="content-area__header">
          <div class="header-left">
            <h1 class="content-area__title">
              <span class="material-icons">history</span> Audit Log
            </h1>
            <p class="content-area__description">Riwayat aktivitas dan jejak audit sistem</p>
          </div>
          <div class="header-right">
            <div class="btn-group">
              <button class="btn btn-sm ${this.viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}" id="btn-view-table" title="Tampilan Tabel">
                <span class="material-icons">table_chart</span> Tabel
              </button>
              <button class="btn btn-sm ${this.viewMode === 'timeline' ? 'btn-primary' : 'btn-ghost'}" id="btn-view-timeline" title="Tampilan Timeline">
                <span class="material-icons">timeline</span> Timeline
              </button>
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid" id="audit-stats" style="margin-bottom:24px">
          <div class="stat-card stat-card--primary">
            <div class="stat-card__icon"><span class="material-icons">history</span></div>
            <div class="stat-card__content">
              <div class="stat-card__title">Total Aktivitas</div>
              <div class="stat-card__value" id="stat-total">0</div>
            </div>
          </div>
          <div class="stat-card stat-card--success">
            <div class="stat-card__icon"><span class="material-icons">login</span></div>
            <div class="stat-card__content">
              <div class="stat-card__title">Login Hari Ini</div>
              <div class="stat-card__value" id="stat-login">0</div>
            </div>
          </div>
          <div class="stat-card stat-card--warning">
            <div class="stat-card__icon"><span class="material-icons">edit</span></div>
            <div class="stat-card__content">
              <div class="stat-card__title">Modifikasi</div>
              <div class="stat-card__value" id="stat-update">0</div>
            </div>
          </div>
          <div class="stat-card stat-card--error">
            <div class="stat-card__icon"><span class="material-icons">warning</span></div>
            <div class="stat-card__content">
              <div class="stat-card__title">Error/Delete</div>
              <div class="stat-card__value" id="stat-error">0</div>
            </div>
          </div>
        </div>

        <!-- Filters Bar -->
        <div class="filters-bar">
          <div class="search-input" style="max-width:300px;flex:1">
            <span class="search-input__icon material-icons">search</span>
            <input type="text" class="form-input" placeholder="Cari aktivitas, user, deskripsi..." id="filter-search">
            <button class="search-input__clear" id="search-clear" style="display:none">
              <span class="material-icons">close</span>
            </button>
          </div>

          <select class="form-select" id="filter-action" style="width:180px">
            <option value="">Semua Aksi</option>
            <option value="LOGIN">🔑 Login</option>
            <option value="LOGOUT">🚪 Logout</option>
            <option value="CREATE">➕ Create</option>
            <option value="UPDATE">✏️ Update</option>
            <option value="DELETE">🗑️ Delete</option>
            <option value="APPROVE">✅ Approve</option>
            <option value="REJECT">❌ Reject</option>
            <option value="EXPORT">📤 Export</option>
            <option value="IMPORT">📥 Import</option>
            <option value="SETUP">⚙️ Setup</option>
            <option value="ERROR">⚠️ Error</option>
          </select>

          <select class="form-select" id="filter-modul" style="width:180px">
            <option value="">Semua Modul</option>
            <option value="SuratMasuk">Surat Masuk</option>
            <option value="SuratKeluar">Surat Keluar</option>
            <option value="Disposisi">Disposisi</option>
            <option value="Approval">Approval</option>
            <option value="Users">Pengguna</option>
            <option value="System">Sistem</option>
            <option value="Auth">Autentikasi</option>
            <option value="File">File</option>
            <option value="Config">Konfigurasi</option>
          </select>

          <div class="date-range">
            <input type="date" class="form-input" id="filter-start" style="width:150px" title="Tanggal Mulai">
            <span class="text-muted">s/d</span>
            <input type="date" class="form-input" id="filter-end" style="width:150px" title="Tanggal Akhir">
          </div>

          <div class="filters-bar__actions">
            <button class="btn btn-sm btn-secondary" id="btn-export-csv">
              <span class="material-icons">table_chart</span> CSV
            </button>
            <button class="btn btn-sm btn-secondary" id="btn-export-json">
              <span class="material-icons">code</span> JSON
            </button>
            <button class="btn btn-sm btn-ghost" id="btn-clear-filters">
              <span class="material-icons">clear_all</span> Reset
            </button>
          </div>

          <span class="text-muted" id="total-logs" style="margin-left:auto">0 aktivitas</span>
        </div>

        <!-- Quick Filters -->
        <div class="chip-group" style="margin-bottom:16px">
          <span class="chip filter-chip" data-filter="today">Hari Ini</span>
          <span class="chip filter-chip" data-filter="yesterday">Kemarin</span>
          <span class="chip filter-chip" data-filter="week">7 Hari</span>
          <span class="chip filter-chip" data-filter="month">30 Hari</span>
          <span class="chip filter-chip" data-filter="login">Login/Logout</span>
          <span class="chip filter-chip" data-filter="changes">Perubahan Data</span>
          <span class="chip filter-chip" data-filter="errors">Error</span>
        </div>

        <!-- Table View -->
        <div class="table-container" id="table-view">
          <table class="data-table data-table--hover">
            <thead>
              <tr>
                <th width="150" class="sortable" data-sort="createdAt">
                  Waktu <span class="sort-icon"></span>
                </th>
                <th width="120">Pengguna</th>
                <th width="120" class="sortable" data-sort="aksi">
                  Aksi <span class="sort-icon"></span>
                </th>
                <th width="140">Modul</th>
                <th>Deskripsi</th>
                <th width="60">Detail</th>
              </tr>
            </thead>
            <tbody id="log-tbody"></tbody>
          </table>
        </div>

        <!-- Timeline View -->
        <div class="timeline-view hidden" id="timeline-view"></div>

        <!-- Loading -->
        <div id="log-loading" class="page-loading" style="display:none">
          <div class="progress--circular"></div>
          <p>Memuat data...</p>
        </div>

        <!-- Empty State -->
        <div id="log-empty" class="empty-state" style="display:none">
          <span class="material-icons" style="font-size:64px;color:var(--md-sys-color-outline)">history</span>
          <h3>Tidak ada aktivitas</h3>
          <p>Tidak ada data audit log yang sesuai dengan filter</p>
          <button class="btn btn-primary btn-sm" id="btn-reset-filters">
            <span class="material-icons">clear_all</span> Reset Filter
          </button>
        </div>

        <!-- Pagination -->
        <div class="table-pagination" id="pagination">
          <div class="table-pagination__info">
            Menampilkan <span id="page-start">0</span>-<span id="page-end">0</span> dari <span id="page-total">0</span>
          </div>
          <div class="table-pagination__controls">
            <select class="table-pagination__size-select" id="page-size-select">
              <option value="25">25</option>
              <option value="50" selected>50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
            <span class="text-muted">per halaman</span>
            <button class="btn-icon btn-icon-sm" id="btn-first" disabled title="Halaman Pertama">
              <span class="material-icons">first_page</span>
            </button>
            <button class="btn-icon btn-icon-sm" id="btn-prev" disabled title="Sebelumnya">
              <span class="material-icons">chevron_left</span>
            </button>
            <span class="text-muted" style="min-width:80px;text-align:center">
              Halaman <strong id="page-current">1</strong> dari <strong id="page-total-pages">1</strong>
            </span>
            <button class="btn-icon btn-icon-sm" id="btn-next" disabled title="Berikutnya">
              <span class="material-icons">chevron_right</span>
            </button>
            <button class="btn-icon btn-icon-sm" id="btn-last" disabled title="Halaman Terakhir">
              <span class="material-icons">last_page</span>
            </button>
          </div>
        </div>

        <!-- Detail Modal -->
        <div class="modal-overlay hidden" id="log-detail-modal">
          <div class="modal-content modal-content--md">
            <div class="modal-header">
              <h3>Detail Aktivitas</h3>
              <button class="btn-icon" id="btn-close-detail">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body" id="log-detail-body"></div>
            <div class="modal-footer">
              <button class="btn btn-ghost" id="btn-close-detail-footer">Tutup</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async loadLogs(silent = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    if (!silent) this.showLoading();

    try {
      let response;

      if (typeof api !== 'undefined') {
        response = await api.get('auditLog.list', {
          page: this.pagination.page,
          limit: this.pagination.limit,
          ...this.filters
        });
      } else if (typeof API !== 'undefined') {
        response = await API.get('auditLog.list', {
          page: this.pagination.page,
          limit: this.pagination.limit,
          ...this.filters
        });
      } else {
        const params = new URLSearchParams({
          action: 'auditLog.list',
          page: this.pagination.page,
          limit: this.pagination.limit,
          ...this.filters
        });
        const url = (typeof APP_CONFIG !== 'undefined' ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL) : '') + '?' + params.toString();
        const res = await fetch(url);
        response = await res.json();
      }

      if (response?.status === 'success') {
        this.logs = response.data?.items || [];
        this.pagination.total = response.data?.total || response.data?.pagination?.total || 0;
        this.pagination.totalPages = response.data?.totalPages || response.data?.pagination?.totalPages || Math.ceil(this.pagination.total / this.pagination.limit) || 1;
        
        if (this.viewMode === 'table') {
          this.renderTable();
        } else {
          this.renderTimeline();
        }
        
        this.updatePagination();
        this.updateTotalDisplay();
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      if (!silent) this.showToast('Gagal memuat audit log', 'error');
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  async loadStats() {
    try {
      let response;
      if (typeof api !== 'undefined') {
        response = await api.get('auditLog.analytics', { startDate: this.filters.startDate, endDate: this.filters.endDate });
      } else if (typeof API !== 'undefined') {
        response = await API.get('auditLog.analytics', { startDate: this.filters.startDate, endDate: this.filters.endDate });
      }

      if (response?.status === 'success' && response.data) {
        document.getElementById('stat-total').textContent = (response.data.total || 0).toLocaleString();
        document.getElementById('stat-login').textContent = (response.data.loginCount || 0).toLocaleString();
        document.getElementById('stat-update').textContent = (response.data.updateCount || 0).toLocaleString();
        document.getElementById('stat-error').textContent = (response.data.errorCount || 0).toLocaleString();
      }
    } catch (error) {
      console.warn('Failed to load audit stats:', error);
    }
  }

  renderTable() {
    document.getElementById('table-view').style.display = 'block';
    document.getElementById('timeline-view').classList.add('hidden');
    
    const tbody = document.getElementById('log-tbody');
    const empty = document.getElementById('log-empty');
    if (!tbody) return;

    if (this.logs.length === 0) {
      tbody.innerHTML = '';
      empty.style.display = 'flex';
      document.getElementById('pagination').style.display = 'none';
      return;
    }

    empty.style.display = 'none';
    document.getElementById('pagination').style.display = '';

    tbody.innerHTML = this.logs.map(log => `
      <tr class="data-table__row" data-id="${log.id}" style="cursor:pointer">
        <td class="text-mono text-sm">
          <span title="${this.formatDateTime(log.createdAt)}">${this.formatTime(log.createdAt)}</span>
          <br><small class="text-muted">${this.formatDate(log.createdAt)}</small>
        </td>
        <td>
          <div class="user-cell">
            <div class="avatar avatar-sm" style="background:${this.getUserColor(log.userId)};color:white;font-weight:600">
              ${this.getInitials(log.userId || log.username || 'System')}
            </div>
            <div>
              <span>${this.escapeHtml(log.userId || log.username || 'System')}</span>
              ${log.ip ? `<br><small class="text-muted">IP: ${log.ip}</small>` : ''}
            </div>
          </div>
        </td>
        <td><span class="badge ${this.getActionClass(log.aksi)}">${this.getActionIcon(log.aksi)} ${log.aksi || '-'}</span></td>
        <td><span class="badge badge-outline">${log.modul || 'System'}</span></td>
        <td>
          <div class="text-truncate" style="max-width:400px" title="${this.escapeHtml(log.deskripsi || '')}">
            ${this.escapeHtml(log.deskripsi || '-')}
          </div>
        </td>
        <td>
          <button class="btn-icon btn-icon-sm view-detail-btn" data-id="${log.id}" title="Lihat Detail">
            <span class="material-icons">visibility</span>
          </button>
        </td>
      </tr>
    `).join('');
  }

  renderTimeline() {
    document.getElementById('table-view').style.display = 'none';
    const timelineView = document.getElementById('timeline-view');
    timelineView.classList.remove('hidden');
    const empty = document.getElementById('log-empty');

    if (this.logs.length === 0) {
      timelineView.innerHTML = '';
      empty.style.display = 'flex';
      return;
    }

    empty.style.display = 'none';

    timelineView.innerHTML = `
      <div class="timeline">
        ${this.logs.map(log => `
          <div class="timeline-item" data-id="${log.id}">
            <div class="timeline-item__time">${this.formatTime(log.createdAt)}</div>
            <div class="timeline-item__title">
              <span class="badge ${this.getActionClass(log.aksi)}">${log.aksi}</span>
              <strong>${this.escapeHtml(log.userId || 'System')}</strong>
              <span class="text-muted">· ${log.modul || 'System'}</span>
            </div>
            <div class="timeline-item__description">${this.escapeHtml(log.deskripsi || '-')}</div>
            <div class="timeline-item__meta">
              <span>${this.formatDate(log.createdAt)}</span>
              <button class="btn btn-ghost btn-sm view-detail-btn" data-id="${log.id}">Detail</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  showLogDetail(log) {
    if (!log) return;
    
    const modal = document.getElementById('log-detail-modal');
    const body = document.getElementById('log-detail-body');
    if (!modal || !body) return;

    modal.classList.remove('hidden');
    body.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-item__label">ID</span>
          <span class="detail-item__value text-mono text-sm">${log.id || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Waktu</span>
          <span class="detail-item__value">${this.formatDateTime(log.createdAt)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Pengguna</span>
          <span class="detail-item__value">${this.escapeHtml(log.userId || log.username || 'System')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Aksi</span>
          <span class="detail-item__value"><span class="badge ${this.getActionClass(log.aksi)}">${log.aksi}</span></span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Modul</span>
          <span class="detail-item__value">${log.modul || 'System'}</span>
        </div>
        ${log.ip ? `
          <div class="detail-item">
            <span class="detail-item__label">IP Address</span>
            <span class="detail-item__value text-mono">${log.ip}</span>
          </div>
        ` : ''}
        ${log.userAgent ? `
          <div class="detail-item detail-item--full">
            <span class="detail-item__label">User Agent</span>
            <span class="detail-item__value text-sm">${this.escapeHtml(log.userAgent)}</span>
          </div>
        ` : ''}
        <div class="detail-item detail-item--full">
          <span class="detail-item__label">Deskripsi</span>
          <span class="detail-item__value">${this.escapeHtml(log.deskripsi || '-')}</span>
        </div>
        ${log.metadata ? `
          <div class="detail-item detail-item--full">
            <span class="detail-item__label">Metadata</span>
            <pre class="text-sm" style="background:var(--md-sys-color-surface-container);padding:12px;border-radius:8px;overflow-x:auto;max-height:200px">${JSON.stringify(log.metadata, null, 2)}</pre>
          </div>
        ` : ''}
      </div>
    `;
  }

  async exportLog(format = 'csv') {
    try {
      let response;
      const params = { ...this.filters, format };

      if (typeof api !== 'undefined') {
        response = await api.get('auditLog.export', params);
      } else if (typeof API !== 'undefined') {
        response = await API.get('auditLog.export', params);
      }

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, `audit-log-${new Date().toISOString().slice(0,10)}.json`);
      } else {
        // Generate CSV
        const headers = ['Waktu', 'Pengguna', 'Aksi', 'Modul', 'Deskripsi'];
        const rows = this.logs.map(l => [
          this.formatDateTime(l.createdAt),
          l.userId || 'System',
          l.aksi || '',
          l.modul || '',
          `"${(l.deskripsi || '').replace(/"/g, '""')}"`
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        this.downloadBlob(blob, `audit-log-${new Date().toISOString().slice(0,10)}.csv`);
      }

      this.showToast('Log berhasil diexport', 'success');
    } catch (error) {
      this.showToast('Gagal export log', 'error');
    }
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  applyQuickFilter(filter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    this.filters = { ...this.filters, action: '', startDate: '', endDate: '' };

    switch (filter) {
      case 'today':
        this.filters.startDate = this.formatDateISO(today);
        this.filters.endDate = this.formatDateISO(now);
        break;
      case 'yesterday':
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        this.filters.startDate = this.formatDateISO(yesterday);
        this.filters.endDate = this.formatDateISO(today);
        break;
      case 'week':
        const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
        this.filters.startDate = this.formatDateISO(weekAgo);
        this.filters.endDate = this.formatDateISO(now);
        break;
      case 'month':
        const monthAgo = new Date(today); monthAgo.setDate(monthAgo.getDate() - 30);
        this.filters.startDate = this.formatDateISO(monthAgo);
        this.filters.endDate = this.formatDateISO(now);
        break;
      case 'login':
        this.filters.action = 'LOGIN,LOGOUT';
        break;
      case 'changes':
        this.filters.action = 'CREATE,UPDATE,DELETE';
        break;
      case 'errors':
        this.filters.action = 'ERROR';
        break;
    }

    this.updateFilterInputs();
    this.pagination.page = 1;
    this.loadLogs();
    this.loadStats();
  }

  updateFilterInputs() {
    const searchInput = document.getElementById('filter-search');
    const actionSelect = document.getElementById('filter-action');
    const modulSelect = document.getElementById('filter-modul');
    const startInput = document.getElementById('filter-start');
    const endInput = document.getElementById('filter-end');

    if (searchInput) searchInput.value = this.filters.search || '';
    if (actionSelect) actionSelect.value = this.filters.action || '';
    if (modulSelect) modulSelect.value = this.filters.modul || '';
    if (startInput) startInput.value = this.filters.startDate || '';
    if (endInput) endInput.value = this.filters.endDate || '';

    // Update quick filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('chip--active'));
  }

  updateTotalDisplay() {
    const el = document.getElementById('total-logs');
    if (el) el.textContent = `${this.pagination.total.toLocaleString()} aktivitas`;
  }

  updatePagination() {
    const { page, total, limit, totalPages } = this.pagination;

    document.getElementById('btn-first').disabled = page <= 1;
    document.getElementById('btn-prev').disabled = page <= 1;
    document.getElementById('btn-next').disabled = page >= totalPages;
    document.getElementById('btn-last').disabled = page >= totalPages;
    document.getElementById('page-current').textContent = page;
    document.getElementById('page-total-pages').textContent = totalPages || 1;
    document.getElementById('page-start').textContent = total > 0 ? (page - 1) * limit + 1 : 0;
    document.getElementById('page-end').textContent = Math.min(page * limit, total);
    document.getElementById('page-total').textContent = total.toLocaleString();
  }

  showLoading() {
    const loading = document.getElementById('log-loading');
    if (loading) loading.style.display = 'flex';
  }

  hideLoading() {
    const loading = document.getElementById('log-loading');
    if (loading) loading.style.display = 'none';
  }

  startPolling() {
    this.stopPolling();
    this.pollingInterval = setInterval(() => this.loadLogs(true), 60000);
  }

  stopPolling() {
    if (this.pollingInterval) { clearInterval(this.pollingInterval); this.pollingInterval = null; }
  }

  // Helper methods
  formatDate(date) { if (!date) return '-'; try { return new Date(date).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }); } catch { return date; } }
  formatTime(date) { if (!date) return '-'; try { return new Date(date).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' }); } catch { return date; } }
  formatDateTime(date) { if (!date) return '-'; try { return new Date(date).toLocaleString('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' }); } catch { return date; } }
  formatDateISO(date) { try { return new Date(date).toISOString().split('T')[0]; } catch { return ''; } }

  getActionClass(action) {
    if (!action) return 'badge-outline';
    const a = action.toUpperCase();
    if (a.includes('LOGIN')) return 'badge-info';
    if (a.includes('LOGOUT')) return 'badge-secondary';
    if (a.includes('CREATE') || a.includes('REGISTER')) return 'badge-success';
    if (a.includes('UPDATE') || a.includes('EDIT')) return 'badge-warning';
    if (a.includes('DELETE') || a.includes('REMOVE') || a.includes('DESTROY')) return 'badge-error';
    if (a.includes('APPROVE') || a.includes('ACCEPT')) return 'badge-primary';
    if (a.includes('REJECT') || a.includes('DENY')) return 'badge-error';
    if (a.includes('EXPORT') || a.includes('IMPORT')) return 'badge-info';
    if (a.includes('ERROR') || a.includes('FAIL')) return 'badge-error';
    return 'badge-outline';
  }

  getActionIcon(action) {
    if (!action) return '';
    const a = action.toUpperCase();
    if (a.includes('LOGIN')) return '🔑';
    if (a.includes('LOGOUT')) return '🚪';
    if (a.includes('CREATE') || a.includes('REGISTER')) return '➕';
    if (a.includes('UPDATE') || a.includes('EDIT')) return '✏️';
    if (a.includes('DELETE') || a.includes('REMOVE')) return '🗑️';
    if (a.includes('APPROVE')) return '✅';
    if (a.includes('REJECT')) return '❌';
    if (a.includes('EXPORT')) return '📤';
    if (a.includes('IMPORT')) return '📥';
    if (a.includes('ERROR')) return '⚠️';
    return '';
  }

  getInitials(name) {
    if (!name || name === 'System' || name === 'system') return 'S';
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getUserColor(name) {
    if (!name || name === 'System' || name === 'system') return '#607D8B';
    let hash = 0;
    for (let i = 0; i < String(name).length; i++) {
      hash = String(name).charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#1976D2', '#388E3C', '#E64A19', '#7B1FA2', '#00796B', '#C2185B', '#512DA8', '#F57C00', '#455A64', '#5D4037'];
    return colors[Math.abs(hash) % colors.length];
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  showToast(message, type = 'info') {
    if (typeof Toast !== 'undefined') Toast.show(message, type);
    else if (typeof NotificationService !== 'undefined') NotificationService.show(message, type);
  }

  bindEvents() {
    // Search
    const searchInput = document.getElementById('filter-search');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.filters.search = searchInput.value;
          this.pagination.page = 1;
          this.loadLogs();
        }, 500);
      });
    }

    // Filter selects
    document.getElementById('filter-action')?.addEventListener('change', (e) => { this.filters.action = e.target.value; this.pagination.page = 1; this.loadLogs(); });
    document.getElementById('filter-modul')?.addEventListener('change', (e) => { this.filters.modul = e.target.value; this.pagination.page = 1; this.loadLogs(); });
    document.getElementById('filter-start')?.addEventListener('change', (e) => { this.filters.startDate = e.target.value; this.pagination.page = 1; this.loadLogs(); });
    document.getElementById('filter-end')?.addEventListener('change', (e) => { this.filters.endDate = e.target.value; this.pagination.page = 1; this.loadLogs(); });

    // Quick filters
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('chip--active'));
        chip.classList.add('chip--active');
        this.applyQuickFilter(chip.dataset.filter);
      });
    });

    // View toggle
    document.getElementById('btn-view-table')?.addEventListener('click', () => { this.viewMode = 'table'; this.renderTable(); });
    document.getElementById('btn-view-timeline')?.addEventListener('click', () => { this.viewMode = 'timeline'; this.renderTimeline(); });

    // Export
    document.getElementById('btn-export-csv')?.addEventListener('click', () => this.exportLog('csv'));
    document.getElementById('btn-export-json')?.addEventListener('click', () => this.exportLog('json'));

    // Clear filters
    document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
      this.filters = { search: '', action: '', userId: '', modul: '', startDate: '', endDate: '', sortBy: 'createdAt', sortOrder: 'desc' };
      this.updateFilterInputs();
      this.pagination.page = 1;
      this.loadLogs();
      this.loadStats();
    });

    // Row click & detail buttons
    document.getElementById('log-tbody')?.addEventListener('click', (e) => {
      const row = e.target.closest('.data-table__row');
      const detailBtn = e.target.closest('.view-detail-btn');
      if (row) {
        const id = row.dataset.id || detailBtn?.dataset.id;
        const log = this.logs.find(l => l.id === id);
        if (log) this.showLogDetail(log);
      }
    });

    document.getElementById('timeline-view')?.addEventListener('click', (e) => {
      const detailBtn = e.target.closest('.view-detail-btn');
      if (detailBtn) {
        const id = detailBtn.dataset.id;
        const log = this.logs.find(l => l.id === id);
        if (log) this.showLogDetail(log);
      }
    });

    // Pagination
    document.getElementById('btn-first')?.addEventListener('click', () => { this.pagination.page = 1; this.loadLogs(); });
    document.getElementById('btn-prev')?.addEventListener('click', () => { if (this.pagination.page > 1) { this.pagination.page--; this.loadLogs(); } });
    document.getElementById('btn-next')?.addEventListener('click', () => { if (this.pagination.page < this.pagination.totalPages) { this.pagination.page++; this.loadLogs(); } });
    document.getElementById('btn-last')?.addEventListener('click', () => { this.pagination.page = this.pagination.totalPages; this.loadLogs(); });
    document.getElementById('page-size-select')?.addEventListener('change', (e) => { this.pagination.limit = parseInt(e.target.value); this.pagination.page = 1; this.loadLogs(); });

    // Sort
    document.querySelectorAll('.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const sortBy = th.dataset.sort;
        if (this.filters.sortBy === sortBy) {
          this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          this.filters.sortBy = sortBy;
          this.filters.sortOrder = 'desc';
        }
        this.pagination.page = 1;
        this.loadLogs();
      });
    });

    // Detail modal close
    document.getElementById('btn-close-detail')?.addEventListener('click', () => document.getElementById('log-detail-modal').classList.add('hidden'));
    document.getElementById('btn-close-detail-footer')?.addEventListener('click', () => document.getElementById('log-detail-modal').classList.add('hidden'));
    document.getElementById('log-detail-modal')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden'); });
  }

  destroy() {
    this.stopPolling();
  }
}

const AuditLogComponent = (props) => {
  const page = new AuditLogPage();
  const container = document.createElement('div');
  container.className = 'content-area audit-log-page';
  container._auditPage = page;
  page.render(container);
  return container;
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuditLogPage, AuditLogComponent };
}
