/**
 * AGENDA SURAT KELUAR PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class AgendaSuratKeluarPage {
  constructor() {
    this.container = null;
    this.agendaData = [];
    this.pagination = { page: 1, limit: 50, total: 0 };
    this.filters = { year: new Date().getFullYear(), month: '', search: '' };
  }
  
  async render(container) {
    this.container = container;
    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
    await this.loadAgenda();
  }
  
  getTemplate() {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    
    return `
      <div class="agenda-page">
        <div class="content-area__header">
          <h1 class="content-area__title">Agenda Surat Keluar</h1>
          <p class="content-area__description">Daftar agenda surat keluar per tahun</p>
        </div>
        
        <div class="filters-bar">
          <select class="form-select" id="filter-year" style="width:120px">
            ${years.map(y => `<option value="${y}" ${y === this.filters.year ? 'selected' : ''}>${y}</option>`).join('')}
          </select>
          <select class="form-select" id="filter-month" style="width:150px">
            <option value="">Semua Bulan</option>
            <option value="1">Januari</option>
            <option value="2">Februari</option>
            <option value="3">Maret</option>
            <option value="4">April</option>
            <option value="5">Mei</option>
            <option value="6">Juni</option>
            <option value="7">Juli</option>
            <option value="8">Agustus</option>
            <option value="9">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>
          <div class="search-input" style="max-width:300px">
            <span class="search-input__icon material-icons">search</span>
            <input type="text" class="form-input" placeholder="Cari agenda..." id="filter-search">
          </div>
          <span class="text-muted" id="total-agenda">0 agenda</span>
        </div>
        
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th width="50">No</th>
                <th width="150">Nomor Surat</th>
                <th width="120">Tanggal</th>
                <th>Tujuan</th>
                <th>Perihal</th>
                <th width="100">Sifat</th>
                <th width="100">Status</th>
                <th width="80">Aksi</th>
              </tr>
            </thead>
            <tbody id="agenda-tbody"></tbody>
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
  
  async loadAgenda() {
    try {
      const response = await api.get('suratKeluar.agenda', {
        page: this.pagination.page,
        limit: this.pagination.limit,
        year: this.filters.year,
        month: this.filters.month,
        search: this.filters.search
      });
      
      if (response.status === 'success') {
        this.agendaData = response.data.items || [];
        this.pagination.total = response.data.total || 0;
        this.renderTable();
        this.updatePagination();
        document.getElementById('total-agenda').textContent = `${this.pagination.total} agenda`;
      }
    } catch (error) {
      NotificationService.error('Gagal memuat agenda');
    }
  }
  
  renderTable() {
    const tbody = document.getElementById('agenda-tbody');
    if (!tbody) return;
    
    if (this.agendaData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center"><div class="empty-state"><span class="material-icons">calendar_today</span><p>Tidak ada agenda</p></div></td></tr>`;
      return;
    }
    
    const startNum = (this.pagination.page - 1) * this.pagination.limit;
    
    tbody.innerHTML = this.agendaData.map((item, index) => `
      <tr class="data-table__row" onclick="router.navigate('/surat-keluar/${item.id}')" style="cursor:pointer">
        <td>${startNum + index + 1}</td>
        <td><span class="text-mono">${item.nomorSurat || '-'}</span></td>
        <td>${Formatters.date(item.tanggalSurat)}</td>
        <td>${item.tujuan || '-'}</td>
        <td>${Formatters.truncate(item.perihal || '-', 60)}</td>
        <td><span class="badge badge-${this.getSifatClass(item.sifat)}">${item.sifat || 'biasa'}</span></td>
        <td><span class="badge badge-${this.getStatusClass(item.status)}">${item.status || 'draft'}</span></td>
        <td>
          <button class="btn-icon btn-icon-sm" onclick="event.stopPropagation();router.navigate('/surat-keluar/${item.id}')" title="Detail">
            <span class="material-icons">visibility</span>
          </button>
        </td>
      </tr>
    `).join('');
  }
  
  getSifatClass(sifat) {
    const classes = { 'biasa': 'default', 'penting': 'warning', 'segera': 'error', 'rahasia': 'error' };
    return classes[sifat] || 'default';
  }
  
  getStatusClass(status) {
    const classes = { 'draft': 'default', 'pending': 'warning', 'approved': 'success', 'rejected': 'error', 'sent': 'info' };
    return classes[status] || 'default';
  }
  
  updatePagination() {
    const { page, total, limit } = this.pagination;
    document.getElementById('btn-prev').disabled = page <= 1;
    document.getElementById('btn-next').disabled = page * limit >= total;
    document.getElementById('page-current').textContent = page;
  }
  
  bindEvents() {
    document.getElementById('filter-year')?.addEventListener('change', (e) => {
      this.filters.year = parseInt(e.target.value);
      this.pagination.page = 1;
      this.loadAgenda();
    });
    document.getElementById('filter-month')?.addEventListener('change', (e) => {
      this.filters.month = e.target.value;
      this.pagination.page = 1;
      this.loadAgenda();
    });
    document.getElementById('filter-search')?.addEventListener('input', debounce((e) => {
      this.filters.search = e.target.value;
      this.pagination.page = 1;
      this.loadAgenda();
    }, 500));
    document.getElementById('btn-prev')?.addEventListener('click', () => {
      if (this.pagination.page > 1) { this.pagination.page--; this.loadAgenda(); }
    });
    document.getElementById('btn-next')?.addEventListener('click', () => {
      if (this.pagination.page * this.pagination.limit < this.pagination.total) { this.pagination.page++; this.loadAgenda(); }
    });
  }
}

const AgendaSuratKeluarComponent = (props) => {
  const page = new AgendaSuratKeluarPage();
  const container = document.createElement('div');
  container.className = 'content-area agenda-page';
  page.render(container);
  return container;
};
