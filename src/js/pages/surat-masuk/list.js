/**
 * SURAT MASUK LIST PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * List and manage incoming letters
 */

class SuratMasukListPage {
  constructor() {
    this.container = null;
    this.data = [];
    this.pagination = {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    };
    this.filters = {
      search: '',
      status: '',
      sifat: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    this.selectedItems = new Set();
    this.isLoading = false;
  }
  
  /**
   * Render page
   */
  async render(container) {
    this.container = container;
    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
    await this.loadData();
  }
  
  /**
   * Get page template
   */
  getTemplate() {
    return `
      <div class="surat-masuk-list">
        <!-- Header -->
        <div class="content-area__header">
          <div class="header-left">
            <h1 class="content-area__title">Surat Masuk</h1>
            <p class="content-area__description">
              Kelola dan lacak semua surat masuk
            </p>
          </div>
          <div class="header-right">
            <button class="btn btn-primary" onclick="router.navigate('/surat-masuk/create')">
              <span class="material-icons">add</span>
              Tambah Surat
            </button>
            <button class="btn btn-secondary" id="btn-import">
              <span class="material-icons">upload</span>
              Import
            </button>
            <button class="btn btn-tertiary" id="btn-export">
              <span class="material-icons">download</span>
              Export
            </button>
          </div>
        </div>
        
        <!-- Filters -->
        <div class="filters-bar">
          <div class="search-input">
            <span class="search-input__icon material-icons">search</span>
            <input type="text" class="form-input" placeholder="Cari surat..." id="filter-search">
          </div>
          
          <select class="form-select" id="filter-status" style="width:180px">
            <option value="">Semua Status</option>
            <option value="diterima">Diterima</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
            <option value="diarsipkan">Diarsipkan</option>
          </select>
          
          <select class="form-select" id="filter-sifat" style="width:180px">
            <option value="">Semua Sifat</option>
            <option value="biasa">Biasa</option>
            <option value="penting">Penting</option>
            <option value="segera">Segera</option>
            <option value="rahasia">Rahasia</option>
          </select>
          
          <input type="date" class="form-input" id="filter-start-date" style="width:160px" placeholder="Tanggal Mulai">
          <input type="date" class="form-input" id="filter-end-date" style="width:160px" placeholder="Tanggal Akhir">
          
          <button class="btn btn-ghost" id="btn-clear-filters">
            <span class="material-icons">clear</span>
            Reset
          </button>
          
          <div class="filters-bar__stats">
            <span class="text-muted" id="total-records">0 surat</span>
          </div>
        </div>
        
        <!-- Bulk Actions -->
        <div class="bulk-actions" id="bulk-actions" style="display:none">
          <span id="selected-count">0 item dipilih</span>
          <button class="btn btn-sm btn-secondary" id="btn-bulk-disposisi">
            <span class="material-icons">forward</span>
            Disposisi
          </button>
          <button class="btn btn-sm btn-error" id="btn-bulk-delete">
            <span class="material-icons">delete</span>
            Hapus
          </button>
          <button class="btn btn-sm btn-ghost" id="btn-clear-selection">
            Batalkan
          </button>
        </div>
        
        <!-- Table -->
        <div class="table-container">
          <table class="data-table" id="surat-masuk-table">
            <thead>
              <tr>
                <th width="40">
                  <input type="checkbox" id="select-all" class="form-checkbox__input">
                </th>
                <th>No. Agenda</th>
                <th>No. Surat</th>
                <th>Tanggal Surat</th>
                <th>Tanggal Terima</th>
                <th>Pengirim</th>
                <th>Perihal</th>
                <th>Sifat</th>
                <th>Status</th>
                <th width="120">Aksi</th>
              </tr>
            </thead>
            <tbody id="table-body">
              <!-- Data will be loaded here -->
            </tbody>
          </table>
        </div>
        
        <!-- Loading State -->
        <div class="table-loading" id="table-loading" style="display:none">
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
        </div>
        
        <!-- Empty State -->
        <div class="empty-state" id="empty-state" style="display:none">
          <img src="src/assets/images/empty-state.svg" alt="No Data">
          <h3>Belum ada surat masuk</h3>
          <p>Klik tombol "Tambah Surat" untuk mencatat surat masuk baru</p>
          <button class="btn btn-primary" onclick="router.navigate('/surat-masuk/create')">
            <span class="material-icons">add</span>
            Tambah Surat
          </button>
        </div>
        
        <!-- Pagination -->
        <div class="pagination" id="pagination">
          <div class="pagination__info">
            Menampilkan <span id="page-start">0</span>-<span id="page-end">0</span> dari <span id="page-total">0</span>
          </div>
          <div class="pagination__controls">
            <button class="btn-icon" id="btn-prev" disabled>
              <span class="material-icons">chevron_left</span>
            </button>
            <span class="pagination__current" id="page-current">1</span>
            <button class="btn-icon" id="btn-next" disabled>
              <span class="material-icons">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Load data
   */
  async loadData() {
    if (this.isLoading) return;
    this.isLoading = true;
    
    this.showLoading();
    
    try {
      const response = await api.getSuratMasukList({
        page: this.pagination.page,
        limit: this.pagination.limit,
        ...this.filters
      });
      
      if (response.status === 'success') {
        this.data = response.data.items || [];
        this.pagination = {
          ...this.pagination,
          ...response.data.pagination
        };
        
        this.renderTable();
        this.updatePagination();
        this.updateStats();
      }
    } catch (error) {
      this.showError(error);
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }
  
  /**
   * Render table
   */
  renderTable() {
    const tbody = this.container.querySelector('#table-body');
    const emptyState = this.container.querySelector('#empty-state');
    const table = this.container.querySelector('#surat-masuk-table');
    
    if (this.data.length === 0) {
      table.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }
    
    table.style.display = 'table';
    emptyState.style.display = 'none';
    
    tbody.innerHTML = this.data.map(item => `
      <tr class="data-table__row" data-id="${item.id}">
        <td>
          <input type="checkbox" class="form-checkbox__input row-checkbox" data-id="${item.id}">
        </td>
        <td>
          <span class="text-mono">${item.nomorAgenda || '-'}</span>
        </td>
        <td>${item.nomorSurat || '-'}</td>
        <td>${this.formatDate(item.tanggalSurat)}</td>
        <td>${this.formatDate(item.tanggalTerima)}</td>
        <td>${item.pengirim || '-'}</td>
        <td>
          <span class="text-truncate" title="${item.perihal || ''}">${item.perihal || '-'}</span>
        </td>
        <td>
          <span class="badge badge-${this.getSifatClass(item.sifat)}">${item.sifat || 'biasa'}</span>
        </td>
        <td>
          <span class="badge badge-${this.getStatusClass(item.status)}">${item.status || 'diterima'}</span>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-icon btn-icon-sm" onclick="router.navigate('/surat-masuk/${item.id}')" title="Detail">
              <span class="material-icons">visibility</span>
            </button>
            <button class="btn-icon btn-icon-sm" onclick="router.navigate('/surat-masuk/${item.id}/edit')" title="Edit">
              <span class="material-icons">edit</span>
            </button>
            <button class="btn-icon btn-icon-sm" onclick="handleDisposisi('${item.id}')" title="Disposisi">
              <span class="material-icons">forward</span>
            </button>
            <div class="dropdown">
              <button class="btn-icon btn-icon-sm dropdown-toggle" title="Lainnya">
                <span class="material-icons">more_vert</span>
              </button>
              <div class="dropdown__menu">
                <button class="dropdown__item" onclick="handleDownload('${item.id}')">
                  <span class="material-icons">download</span>
                  Download
                </button>
                <button class="dropdown__item" onclick="handlePrint('${item.id}')">
                  <span class="material-icons">print</span>
                  Cetak
                </button>
                <div class="dropdown__divider"></div>
                <button class="dropdown__item dropdown__item--danger" onclick="handleDelete('${item.id}')">
                  <span class="material-icons">delete</span>
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </td>
      </tr>
    `).join('');
  }
  
  /**
   * Update pagination
   */
  updatePagination() {
    const btnPrev = this.container.querySelector('#btn-prev');
    const btnNext = this.container.querySelector('#btn-next');
    const pageCurrent = this.container.querySelector('#page-current');
    const pageStart = this.container.querySelector('#page-start');
    const pageEnd = this.container.querySelector('#page-end');
    const pageTotal = this.container.querySelector('#page-total');
    
    const { page, limit, total, totalPages } = this.pagination;
    
    btnPrev.disabled = page <= 1;
    btnNext.disabled = page >= totalPages;
    pageCurrent.textContent = page;
    pageStart.textContent = total > 0 ? (page - 1) * limit + 1 : 0;
    pageEnd.textContent = Math.min(page * limit, total);
    pageTotal.textContent = total;
  }
  
  /**
   * Update stats
   */
  updateStats() {
    const totalRecords = this.container.querySelector('#total-records');
    if (totalRecords) {
      totalRecords.textContent = `${this.pagination.total} surat`;
    }
  }
  
  /**
   * Handle bulk selection
   */
  updateBulkActions() {
    const bulkActions = this.container.querySelector('#bulk-actions');
    const selectedCount = this.container.querySelector('#selected-count');
    
    if (this.selectedItems.size > 0) {
      bulkActions.style.display = 'flex';
      selectedCount.textContent = `${this.selectedItems.size} item dipilih`;
    } else {
      bulkActions.style.display = 'none';
    }
  }
  
  /**
   * Handle search with debounce
   */
  handleSearch(value) {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    
    this.searchTimeout = setTimeout(() => {
      this.filters.search = value;
      this.pagination.page = 1;
      this.loadData();
    }, 500);
  }
  
  /**
   * Handle filter change
   */
  handleFilterChange() {
    this.filters.status = this.container.querySelector('#filter-status').value;
    this.filters.sifat = this.container.querySelector('#filter-sifat').value;
    this.filters.startDate = this.container.querySelector('#filter-start-date').value;
    this.filters.endDate = this.container.querySelector('#filter-end-date').value;
    this.pagination.page = 1;
    this.loadData();
  }
  
  /**
   * Clear filters
   */
  clearFilters() {
    this.container.querySelector('#filter-search').value = '';
    this.container.querySelector('#filter-status').value = '';
    this.container.querySelector('#filter-sifat').value = '';
    this.container.querySelector('#filter-start-date').value = '';
    this.container.querySelector('#filter-end-date').value = '';
    
    this.filters = {
      search: '',
      status: '',
      sifat: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    
    this.pagination.page = 1;
    this.loadData();
  }
  
  /**
   * Handle delete
   */
  async handleDelete(id) {
    const confirmed = await NotificationService.confirm(
      'Apakah Anda yakin ingin menghapus surat ini?',
      'Konfirmasi Hapus'
    );
    
    if (confirmed) {
      try {
        const response = await api.deleteSuratMasuk(id);
        if (response.status === 'success') {
          NotificationService.show('Surat berhasil dihapus', 'success');
          this.loadData();
        }
      } catch (error) {
        NotificationService.show('Gagal menghapus surat', 'error');
      }
    }
  }
  
  /**
   * Handle bulk delete
   */
  async handleBulkDelete() {
    if (this.selectedItems.size === 0) return;
    
    const confirmed = await NotificationService.confirm(
      `Apakah Anda yakin ingin menghapus ${this.selectedItems.size} surat?`,
      'Konfirmasi Hapus Massal'
    );
    
    if (confirmed) {
      try {
        for (const id of this.selectedItems) {
          await api.deleteSuratMasuk(id);
        }
        NotificationService.show(`${this.selectedItems.size} surat berhasil dihapus`, 'success');
        this.selectedItems.clear();
        this.updateBulkActions();
        this.loadData();
      } catch (error) {
        NotificationService.show('Gagal menghapus surat', 'error');
      }
    }
  }
  
  /**
   * Format date
   */
  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
  
  /**
   * Get status class
   */
  getStatusClass(status) {
    const classes = {
      'diterima': 'info',
      'diproses': 'warning',
      'selesai': 'success',
      'diarsipkan': 'primary',
      'ditolak': 'error'
    };
    return classes[status] || 'default';
  }
  
  /**
   * Get sifat class
   */
  getSifatClass(sifat) {
    const classes = {
      'biasa': 'default',
      'penting': 'warning',
      'segera': 'error',
      'rahasia': 'error',
      'sangat_rahasia': 'error'
    };
    return classes[sifat] || 'default';
  }
  
  /**
   * Show loading
   */
  showLoading() {
    const loading = this.container.querySelector('#table-loading');
    if (loading) loading.style.display = 'block';
  }
  
  /**
   * Hide loading
   */
  hideLoading() {
    const loading = this.container.querySelector('#table-loading');
    if (loading) loading.style.display = 'none';
  }
  
  /**
   * Show error
   */
  showError(error) {
    const tbody = this.container.querySelector('#table-body');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" class="text-center">
            <div class="error-state">
              <span class="material-icons" style="font-size:48px;color:var(--md-sys-color-error)">error_outline</span>
              <p>Gagal memuat data: ${error.message}</p>
              <button class="btn btn-sm btn-primary" onclick="this.closest('.surat-masuk-list').querySelector('#btn-refresh').click()">
                Muat Ulang
              </button>
            </div>
          </td>
        </tr>
      `;
    }
  }
  
  /**
   * Bind events
   */
  bindEvents() {
    // Search
    const searchInput = this.container.querySelector('#filter-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    }
    
    // Filters
    ['filter-status', 'filter-sifat', 'filter-start-date', 'filter-end-date'].forEach(id => {
      const el = this.container.querySelector(`#${id}`);
      if (el) {
        el.addEventListener('change', () => this.handleFilterChange());
      }
    });
    
    // Clear filters
    const btnClear = this.container.querySelector('#btn-clear-filters');
    if (btnClear) {
      btnClear.addEventListener('click', () => this.clearFilters());
    }
    
    // Select all
    const selectAll = this.container.querySelector('#select-all');
    if (selectAll) {
      selectAll.addEventListener('change', (e) => {
        const checkboxes = this.container.querySelectorAll('.row-checkbox');
        checkboxes.forEach(cb => {
          cb.checked = e.target.checked;
          if (e.target.checked) {
            this.selectedItems.add(cb.dataset.id);
          } else {
            this.selectedItems.delete(cb.dataset.id);
          }
        });
        this.updateBulkActions();
      });
    }
    
    // Row checkboxes (event delegation)
    const tbody = this.container.querySelector('#table-body');
    if (tbody) {
      tbody.addEventListener('change', (e) => {
        if (e.target.classList.contains('row-checkbox')) {
          if (e.target.checked) {
            this.selectedItems.add(e.target.dataset.id);
          } else {
            this.selectedItems.delete(e.target.dataset.id);
          }
          this.updateBulkActions();
        }
      });
    }
    
    // Clear selection
    const btnClearSelection = this.container.querySelector('#btn-clear-selection');
    if (btnClearSelection) {
      btnClearSelection.addEventListener('click', () => {
        this.selectedItems.clear();
        this.updateBulkActions();
        const checkboxes = this.container.querySelectorAll('.row-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
        const selectAll = this.container.querySelector('#select-all');
        if (selectAll) selectAll.checked = false;
      });
    }
    
    // Bulk delete
    const btnBulkDelete = this.container.querySelector('#btn-bulk-delete');
    if (btnBulkDelete) {
      btnBulkDelete.addEventListener('click', () => this.handleBulkDelete());
    }
    
    // Bulk disposisi
    const btnBulkDisposisi = this.container.querySelector('#btn-bulk-disposisi');
    if (btnBulkDisposisi) {
      btnBulkDisposisi.addEventListener('click', () => {
        const ids = Array.from(this.selectedItems);
        router.navigate('/disposisi/create', { query: { ids: ids.join(',') } });
      });
    }
    
    // Pagination
    const btnPrev = this.container.querySelector('#btn-prev');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (this.pagination.page > 1) {
          this.pagination.page--;
          this.loadData();
        }
      });
    }
    
    const btnNext = this.container.querySelector('#btn-next');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (this.pagination.page < this.pagination.totalPages) {
          this.pagination.page++;
          this.loadData();
        }
      });
    }
    
    // Import
    const btnImport = this.container.querySelector('#btn-import');
    if (btnImport) {
      btnImport.addEventListener('click', () => {
        router.navigate('/surat-masuk/import');
      });
    }
    
    // Export
    const btnExport = this.container.querySelector('#btn-export');
    if (btnExport) {
      btnExport.addEventListener('click', async () => {
        try {
          await api.exportExcel({ type: 'suratMasuk', ...this.filters });
          NotificationService.show('Export berhasil', 'success');
        } catch (error) {
          NotificationService.show('Export gagal', 'error');
        }
      });
    }
    
    // Row click (navigate to detail)
    tbody?.addEventListener('click', (e) => {
      const row = e.target.closest('.data-table__row');
      if (row && !e.target.closest('input, button, .dropdown__menu')) {
        const id = row.dataset.id;
        if (id) router.navigate(`/surat-masuk/${id}`);
      }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        router.navigate('/surat-masuk/create');
      }
    });
  }
}

// Global handlers for table actions
window.handleDisposisi = (id) => {
  router.navigate('/disposisi/create', { query: { suratMasukId: id } });
};

window.handleDownload = async (id) => {
  try {
    const detail = await api.getSuratMasukDetail(id);
    if (detail.data?.fileUrl) {
      window.open(detail.data.fileUrl, '_blank');
    }
  } catch (error) {
    NotificationService.show('Gagal download file', 'error');
  }
};

window.handlePrint = (id) => {
  window.open(`#/surat-masuk/${id}?print=true`, '_blank');
};

window.handleDelete = async (id) => {
  const confirmed = await NotificationService.confirm('Hapus surat ini?');
  if (confirmed) {
    try {
      await api.deleteSuratMasuk(id);
      NotificationService.show('Surat berhasil dihapus', 'success');
      // Reload current page
      const page = document.querySelector('.surat-masuk-list');
      if (page && page._instance) {
        page._instance.loadData();
      }
    } catch (error) {
      NotificationService.show('Gagal menghapus surat', 'error');
    }
  }
};

// Export for router
const SuratMasukListComponent = (props) => {
  const page = new SuratMasukListPage();
  const container = document.createElement('div');
  container.className = 'content-area surat-masuk-list';
  container._instance = page;
  
  page.render(container);
  
  return container;
};
