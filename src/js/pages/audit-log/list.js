/**
 * AUDIT LOG PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class AuditLogPage {
  constructor() {
    this.container = null;
    this.logs = [];
    this.pagination = { page: 1, limit: 50, total: 0 };
    this.filters = { search: '', action: '', userId: '', startDate: '', endDate: '' };
  }
  
  async render(container) {
    this.container = container;
    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
    await this.loadLogs();
  }
  
  getTemplate() {
    return `
      <div class="audit-log-page">
        <div class="content-area__header">
          <h1 class="content-area__title">Audit Log</h1>
          <p class="content-area__description">Riwayat aktivitas sistem</p>
        </div>
        
        <div class="filters-bar">
          <div class="search-input" style="max-width:300px">
            <span class="search-input__icon material-icons">search</span>
            <input type="text" class="form-input" placeholder="Cari aktivitas..." id="filter-search">
          </div>
          <select class="form-select" id="filter-action" style="width:200px">
            <option value="">Semua Aksi</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="APPROVE">Approve</option>
          </select>
          <input type="date" class="form-input" id="filter-start" style="width:160px">
          <input type="date" class="form-input" id="filter-end" style="width:160px">
          <button class="btn btn-sm btn-secondary" id="btn-export-log">
            <span class="material-icons">download</span> Export
          </button>
          <span class="text-muted" id="total-logs">0 aktivitas</span>
        </div>
        
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th width="80">Waktu</th>
                <th width="120">Pengguna</th>
                <th width="100">Aksi</th>
                <th width="150">Modul</th>
                <th>Deskripsi</th>
              </tr>
            </thead>
            <tbody id="log-tbody"></tbody>
          </table>
        </div>
        
        <div class="pagination" id="pagination">
          <button class="btn-icon" id="btn-prev" disabled><span class="material-icons">chevron_left</span></button>
          <span id="page-current">1</span>
          <button class="btn-icon" id="btn-next" disabled><span class="material-icons">chevron_right</span></button>
        </div>
      </div>
    `;
  }
  
  async loadLogs() {
    try {
      const response = await api.get('auditLog.list', {
        page: this.pagination.page,
        limit: this.pagination.limit,
        ...this.filters
      });
      
      if (response.status === 'success') {
        this.logs = response.data.items || [];
        this.pagination.total = response.data.total || 0;
        this.renderTable();
        this.updatePagination();
        document.getElementById('total-logs').textContent = `${this.pagination.total} aktivitas`;
      }
    } catch (error) {
      NotificationService.error('Gagal memuat audit log');
    }
  }
  
  renderTable() {
    const tbody = document.getElementById('log-tbody');
    if (!tbody) return;
    
    if (this.logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center"><div class="empty-state"><span class="material-icons">history</span><p>Tidak ada aktivitas</p></div></td></tr>`;
      return;
    }
    
    tbody.innerHTML = this.logs.map(log => `
      <tr>
        <td class="text-mono text-sm">${Formatters.dateTime(log.createdAt, 'DD/MM HH:mm:ss')}</td>
        <td>
          <div class="user-cell">
            <div class="avatar avatar-sm">${Formatters.initials(log.userId || 'System')}</div>
            <span>${log.userId || 'System'}</span>
          </div>
        </td>
        <td><span class="badge badge-${this.getActionClass(log.aksi)}">${log.aksi || '-'}</span></td>
        <td>${log.modul || '-'}</td>
        <td>${log.deskripsi || '-'}</td>
      </tr>
    `).join('');
  }
  
  getActionClass(action) {
    if (!action) return 'default';
    if (action.includes('LOGIN')) return 'info';
    if (action.includes('CREATE')) return 'success';
    if (action.includes('UPDATE')) return 'warning';
    if (action.includes('DELETE')) return 'error';
    if (action.includes('APPROVE')) return 'primary';
    return 'default';
  }
  
  updatePagination() {
    const { page, total, limit } = this.pagination;
    document.getElementById('btn-prev').disabled = page <= 1;
    document.getElementById('btn-next').disabled = page * limit >= total;
    document.getElementById('page-current').textContent = page;
  }
  
  async exportLog() {
    try {
      await api.get('auditLog.export', this.filters);
      NotificationService.success('Log berhasil diexport');
    } catch (error) {
      NotificationService.error('Gagal export log');
    }
  }
  
  bindEvents() {
    document.getElementById('filter-search')?.addEventListener('input', debounce((e) => {
      this.filters.search = e.target.value; this.pagination.page = 1; this.loadLogs();
    }, 500));
    document.getElementById('filter-action')?.addEventListener('change', (e) => {
      this.filters.action = e.target.value; this.pagination.page = 1; this.loadLogs();
    });
    document.getElementById('filter-start')?.addEventListener('change', (e) => {
      this.filters.startDate = e.target.value; this.pagination.page = 1; this.loadLogs();
    });
    document.getElementById('filter-end')?.addEventListener('change', (e) => {
      this.filters.endDate = e.target.value; this.pagination.page = 1; this.loadLogs();
    });
    document.getElementById('btn-export-log')?.addEventListener('click', () => this.exportLog());
    document.getElementById('btn-prev')?.addEventListener('click', () => { if (this.pagination.page > 1) { this.pagination.page--; this.loadLogs(); } });
    document.getElementById('btn-next')?.addEventListener('click', () => { if (this.pagination.page * this.pagination.limit < this.pagination.total) { this.pagination.page++; this.loadLogs(); } });
  }
}

const AuditLogComponent = (props) => {
  const page = new AuditLogPage();
  const container = document.createElement('div');
  container.className = 'content-area audit-log-page';
  page.render(container);
  return container;
};
