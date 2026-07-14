/**
 * ============================================
 * FILE MANAGER PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL FILE MANAGER - SIAP PRODUKSI
 * Mendukung: Grid/List View, Upload, Preview,
 * Download, Delete, Share, Search, Filter, Sort
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class FileManagerPage {
  constructor() {
    this.container = null;
    this.files = [];
    this.pagination = { page: 1, limit: 24, total: 0, totalPages: 0 };
    this.filters = { search: '', type: '', sortBy: 'createdAt', sortOrder: 'desc' };
    this.selectedFiles = new Set();
    this.viewMode = 'grid'; // grid | list
    this.isLoading = false;
    this.uploader = null;
    this.pageId = 'filemgr-' + Math.random().toString(36).substr(2, 9);
    this.selectAll = false;
  }

  async render(container) {
    this.container = container;
    this.container.setAttribute('data-page-id', this.pageId);
    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
    await this.loadFiles();
    console.log('✅ FileManagerPage rendered');
  }

  getTemplate() {
    return `
      <div class="file-manager" id="filemgr-${this.pageId}">
        <div class="content-area__header">
          <div class="header-left">
            <h1 class="content-area__title">
              <span class="material-icons">folder</span> File Manager
            </h1>
            <p class="content-area__description">Kelola semua file dan dokumen yang tersimpan</p>
          </div>
          <div class="header-right">
            <button class="btn btn-secondary btn-sm" id="btn-refresh" title="Refresh">
              <span class="material-icons">refresh</span>
            </button>
            <button class="btn btn-primary" id="btn-upload">
              <span class="material-icons">upload</span> Upload File
            </button>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="filters-bar">
          <div class="search-input" style="max-width:320px;flex:1">
            <span class="search-input__icon material-icons">search</span>
            <input type="text" class="form-input" placeholder="Cari file..." id="filter-search">
          </div>
          <select class="form-select" id="filter-type" style="width:160px">
            <option value="">Semua Tipe</option>
            <option value="pdf">📄 PDF</option>
            <option value="image">🖼️ Gambar</option>
            <option value="document">📝 Dokumen</option>
            <option value="spreadsheet">📊 Spreadsheet</option>
            <option value="archive">📦 Arsip</option>
            <option value="other">📁 Lainnya</option>
          </select>
          <select class="form-select" id="filter-sort" style="width:160px">
            <option value="createdAt:desc">Terbaru</option>
            <option value="createdAt:asc">Terlama</option>
            <option value="fileName:asc">Nama A-Z</option>
            <option value="fileName:desc">Nama Z-A</option>
            <option value="fileSize:desc">Ukuran Besar</option>
            <option value="fileSize:asc">Ukuran Kecil</option>
          </select>
          <div class="view-toggle">
            <button class="btn-icon btn-icon-sm view-btn ${this.viewMode === 'grid' ? 'active' : ''}" data-view="grid" title="Grid View">
              <span class="material-icons">grid_view</span>
            </button>
            <button class="btn-icon btn-icon-sm view-btn ${this.viewMode === 'list' ? 'active' : ''}" data-view="list" title="List View">
              <span class="material-icons">view_list</span>
            </button>
          </div>
          <span class="text-muted" id="total-files" style="margin-left:auto">0 file</span>
        </div>

        <!-- Bulk Actions -->
        <div class="bulk-actions hidden" id="bulk-actions">
          <span id="selected-count">0 file dipilih</span>
          <div class="bulk-actions__buttons">
            <button class="btn btn-sm btn-secondary" id="btn-bulk-download">
              <span class="material-icons">download</span> Download
            </button>
            <button class="btn btn-sm btn-error" id="btn-bulk-delete">
              <span class="material-icons">delete</span> Hapus
            </button>
            <button class="btn btn-sm btn-ghost" id="btn-clear-selection">
              <span class="material-icons">clear</span> Batalkan
            </button>
          </div>
        </div>

        <!-- File Display Area -->
        <div id="files-container">
          <div class="file-grid" id="file-grid"></div>
          <div class="file-list-view hidden" id="file-list"></div>
        </div>

        <!-- Loading -->
        <div id="files-loading" class="page-loading" style="display:none">
          <div class="progress--circular"></div>
          <p>Memuat file...</p>
        </div>

        <!-- Empty State -->
        <div id="files-empty" class="empty-state" style="display:none">
          <span class="material-icons" style="font-size:64px;color:var(--md-sys-color-outline)">folder_open</span>
          <h3>Belum ada file</h3>
          <p>Upload file untuk memulai</p>
          <button class="btn btn-primary" id="btn-upload-empty">
            <span class="material-icons">upload</span> Upload File
          </button>
        </div>

        <!-- Pagination -->
        <div class="table-pagination" id="pagination">
          <div class="table-pagination__info">
            Menampilkan <span id="page-start">0</span>-<span id="page-end">0</span> dari <span id="page-total">0</span>
          </div>
          <div class="table-pagination__controls">
            <select class="table-pagination__size-select" id="page-size-select">
              <option value="12">12</option>
              <option value="24" selected>24</option>
              <option value="48">48</option>
              <option value="96">96</option>
            </select>
            <span class="text-muted">per halaman</span>
            <button class="btn-icon btn-icon-sm" id="btn-first" disabled><span class="material-icons">first_page</span></button>
            <button class="btn-icon btn-icon-sm" id="btn-prev" disabled><span class="material-icons">chevron_left</span></button>
            <span class="text-muted"><span id="page-current">1</span>/<span id="page-total-pages">1</span></span>
            <button class="btn-icon btn-icon-sm" id="btn-next" disabled><span class="material-icons">chevron_right</span></button>
            <button class="btn-icon btn-icon-sm" id="btn-last" disabled><span class="material-icons">last_page</span></button>
          </div>
        </div>

        <!-- Upload Modal -->
        <div class="modal-overlay hidden" id="upload-modal">
          <div class="modal-content modal-content--md">
            <div class="modal-header">
              <h3>Upload File</h3>
              <button class="btn-icon" id="btn-close-upload">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="upload-zone" id="upload-zone">
                <span class="upload-zone__icon material-icons">cloud_upload</span>
                <p class="upload-zone__text"><strong>Drag & drop</strong> file di sini</p>
                <p class="upload-zone__hint">atau klik untuk memilih file</p>
                <input type="file" id="file-upload-input" multiple style="display:none">
              </div>
              <div class="upload-progress hidden" id="upload-progress-container">
                <div class="progress progress--lg">
                  <div class="progress__bar" id="upload-progress-bar" style="width:0%"></div>
                </div>
                <small id="upload-progress-text">0%</small>
              </div>
              <div class="upload-file-list" id="upload-file-list"></div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" id="btn-cancel-upload">Batal</button>
              <button class="btn btn-primary" id="btn-start-upload" disabled>
                <span class="material-icons">upload</span> Upload
              </button>
            </div>
          </div>
        </div>

        <!-- Preview Modal -->
        <div class="modal-overlay hidden" id="preview-modal">
          <div class="modal-content modal-content--xl">
            <div class="modal-header">
              <h3 id="preview-title">Preview File</h3>
              <div class="preview-actions">
                <button class="btn btn-sm btn-secondary" id="btn-download-preview">
                  <span class="material-icons">download</span>
                </button>
                <button class="btn btn-sm btn-secondary" id="btn-share-preview">
                  <span class="material-icons">share</span>
                </button>
                <button class="btn-icon" id="btn-close-preview">
                  <span class="material-icons">close</span>
                </button>
              </div>
            </div>
            <div class="modal-body modal-body--no-padding" id="preview-container" style="min-height:400px;display:flex;align-items:center;justify-content:center;background:#f5f5f5">
              <div class="progress--circular"></div>
            </div>
            <div class="modal-footer">
              <span class="text-muted text-sm" id="preview-file-info"></span>
              <button class="btn btn-ghost btn-sm" id="btn-close-preview-footer">Tutup</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async loadFiles() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.showLoading();

    try {
      let response;
      const params = {
        page: this.pagination.page,
        limit: this.pagination.limit,
        search: this.filters.search,
        type: this.filters.type,
        sortBy: this.filters.sortBy,
        sortOrder: this.filters.sortOrder
      };

      if (typeof api !== 'undefined' && api.getFileList) {
        response = await api.getFileList(params);
      } else if (typeof API !== 'undefined') {
        response = await API.get('file.list', params);
      } else {
        const query = new URLSearchParams({ action: 'file.list', ...params });
        const url = this.getApiUrl() + '?' + query.toString();
        const res = await fetch(url);
        response = await res.json();
      }

      if (response?.status === 'success') {
        this.files = response.data?.items || [];
        this.pagination.total = response.data?.total || response.data?.pagination?.total || 0;
        this.pagination.totalPages = response.data?.totalPages || response.data?.pagination?.totalPages || Math.ceil(this.pagination.total / this.pagination.limit) || 1;
        this.renderFiles();
        this.updatePagination();
        this.updateTotalDisplay();
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      this.showToast('Gagal memuat file', 'error');
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  renderFiles() {
    const grid = document.getElementById('file-grid');
    const list = document.getElementById('file-list');
    const empty = document.getElementById('files-empty');

    if (this.files.length === 0) {
      if (grid) grid.innerHTML = '';
      if (list) list.innerHTML = '';
      empty.style.display = 'flex';
      document.getElementById('pagination').style.display = 'none';
      return;
    }

    empty.style.display = 'none';
    document.getElementById('pagination').style.display = '';

    if (this.viewMode === 'grid') {
      grid.style.display = 'grid';
      list.classList.add('hidden');
      grid.innerHTML = this.renderGridFiles();
    } else {
      grid.style.display = 'none';
      list.classList.remove('hidden');
      list.innerHTML = this.renderListFiles();
    }
  }

  renderGridFiles() {
    return this.files.map(file => `
      <div class="file-card ${this.selectedFiles.has(file.id) ? 'file-card--selected' : ''}" 
           data-id="${file.id}" data-filename="${this.escapeAttr(file.fileName || file.name)}">
        <div class="file-card__checkbox">
          <input type="checkbox" class="form-checkbox__input file-checkbox" 
                 data-id="${file.id}" ${this.selectedFiles.has(file.id) ? 'checked' : ''}>
        </div>
        <div class="file-card__preview" data-action="preview">
          ${this.isImage(file) && (file.thumbnailUrl || file.fileUrl) ? 
            `<img src="${file.thumbnailUrl || file.fileUrl}" alt="${this.escapeAttr(file.fileName)}" loading="lazy">` :
            `<span class="material-icons file-card__icon">${this.getFileIcon(file.fileName || file.name)}</span>`
          }
        </div>
        <div class="file-card__info" data-action="preview">
          <div class="file-card__name" title="${this.escapeAttr(file.fileName || file.name)}">${file.fileName || file.name}</div>
          <div class="file-card__meta">
            <span>${this.formatSize(file.fileSize || file.size)}</span>
            <span>•</span>
            <span>${this.formatDate(file.createdAt)}</span>
          </div>
        </div>
        <div class="file-card__actions">
          <button class="btn-icon btn-icon-sm" data-action="download" data-id="${file.id}" title="Download">
            <span class="material-icons">download</span>
          </button>
          <button class="btn-icon btn-icon-sm" data-action="share" data-id="${file.id}" title="Bagikan">
            <span class="material-icons">share</span>
          </button>
          <button class="btn-icon btn-icon-sm" data-action="delete" data-id="${file.id}" title="Hapus">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  renderListFiles() {
    return `
      <div class="table-container">
        <table class="data-table data-table--hover">
          <thead>
            <tr>
              <th width="40"><input type="checkbox" class="form-checkbox__input" id="select-all-checkbox"></th>
              <th>Nama File</th>
              <th width="100">Tipe</th>
              <th width="100">Ukuran</th>
              <th width="150">Tanggal Upload</th>
              <th width="120">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${this.files.map(file => `
              <tr class="${this.selectedFiles.has(file.id) ? 'row-selected' : ''}" data-id="${file.id}">
                <td><input type="checkbox" class="form-checkbox__input file-checkbox" data-id="${file.id}" ${this.selectedFiles.has(file.id) ? 'checked' : ''}></td>
                <td data-action="preview" style="cursor:pointer">
                  <div class="file-name-cell">
                    <span class="material-icons" style="font-size:20px;color:var(--md-sys-color-primary)">${this.getFileIcon(file.fileName || file.name)}</span>
                    <span>${file.fileName || file.name}</span>
                  </div>
                </td>
                <td><span class="badge badge-sm badge-outline">${this.getFileType(file.fileName || file.name)}</span></td>
                <td>${this.formatSize(file.fileSize || file.size)}</td>
                <td class="text-sm">${this.formatDate(file.createdAt)}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn-icon btn-icon-sm" data-action="download" data-id="${file.id}" title="Download"><span class="material-icons">download</span></button>
                    <button class="btn-icon btn-icon-sm" data-action="share" data-id="${file.id}" title="Bagikan"><span class="material-icons">share</span></button>
                    <button class="btn-icon btn-icon-sm" data-action="delete" data-id="${file.id}" title="Hapus"><span class="material-icons">delete</span></button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  async uploadFiles(files) {
    const fileList = Array.from(files);
    const uploadList = document.getElementById('upload-file-list');
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    const progressText = document.getElementById('upload-progress-text');
    const startBtn = document.getElementById('btn-start-upload');

    if (fileList.length === 0) return;

    // Show file list
    if (uploadList) {
      uploadList.innerHTML = fileList.map((f, i) => `
        <div class="upload-file-item" data-index="${i}">
          <span class="material-icons">${this.getFileIcon(f.name)}</span>
          <span class="upload-file-item__name">${f.name}</span>
          <span class="upload-file-item__size">${this.formatSize(f.size)}</span>
          <span class="upload-file-item__status" id="upload-status-${i}">Menunggu</span>
        </div>
      `).join('');
    }

    if (progressContainer) progressContainer.classList.remove('hidden');
    if (startBtn) startBtn.disabled = true;

    let completed = 0;
    const total = fileList.length;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const statusEl = document.getElementById(`upload-status-${i}`);
      if (statusEl) statusEl.textContent = 'Mengupload...';

      try {
        if (typeof api !== 'undefined' && api.uploadFile) {
          await api.uploadFile(file, (progress) => {
            if (progressBar) progressBar.style.width = Math.round(((completed + progress / 100) / total) * 100) + '%';
            if (progressText) progressText.textContent = Math.round(((completed + progress / 100) / total) * 100) + '%';
          });
        } else if (this.uploader) {
          await this.uploader.uploadFile(file);
        }
        completed++;
        if (statusEl) { statusEl.textContent = '✅ Selesai'; statusEl.style.color = 'var(--md-sys-color-success)'; }
      } catch (error) {
        if (statusEl) { statusEl.textContent = '❌ Gagal'; statusEl.style.color = 'var(--md-sys-color-error)'; }
      }
    }

    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.textContent = '100%';
    this.showToast(`${completed}/${total} file berhasil diupload`, 'success');
    
    // Reload files
    await this.loadFiles();
    
    // Close modal after delay
    setTimeout(() => {
      document.getElementById('upload-modal')?.classList.add('hidden');
    }, 1500);
  }

  async previewFile(fileId) {
    const file = this.files.find(f => f.id === fileId);
    if (!file) return;

    const modal = document.getElementById('preview-modal');
    const container = document.getElementById('preview-container');
    const title = document.getElementById('preview-title');
    const info = document.getElementById('preview-file-info');

    if (title) title.textContent = file.fileName || file.name;
    if (info) info.textContent = `${this.getFileType(file.fileName || file.name)} • ${this.formatSize(file.fileSize || file.size)}`;
    if (modal) modal.classList.remove('hidden');
    if (container) container.innerHTML = '<div class="progress--circular"></div>';

    const fileUrl = file.fileUrl || file.url;

    if (!fileUrl) {
      if (container) container.innerHTML = '<p class="text-muted">URL file tidak tersedia</p>';
      return;
    }

    if (this.isImage(file)) {
      container.innerHTML = `<img src="${fileUrl}" alt="${this.escapeAttr(file.fileName)}" style="max-width:100%;max-height:70vh;object-fit:contain">`;
    } else if (this.isPDF(file)) {
      container.innerHTML = `<iframe src="${fileUrl}" style="width:100%;height:70vh;border:none" frameborder="0"></iframe>`;
    } else {
      container.innerHTML = `
        <div style="text-align:center;padding:40px">
          <span class="material-icons" style="font-size:64px;color:var(--md-sys-color-outline)">${this.getFileIcon(file.fileName || file.name)}</span>
          <h4>${file.fileName || file.name}</h4>
          <p class="text-muted">Preview tidak tersedia untuk tipe file ini</p>
          <button class="btn btn-primary btn-sm" data-action="download" data-id="${file.id}">
            <span class="material-icons">download</span> Download
          </button>
        </div>
      `;
    }
  }

  async deleteFile(fileId) {
    const file = this.files.find(f => f.id === fileId);
    if (!file) return;

    const confirmed = await this.confirm(
      `Apakah Anda yakin ingin menghapus file "${file.fileName || file.name}"?`,
      'Konfirmasi Hapus'
    );

    if (!confirmed) return;

    try {
      if (typeof api !== 'undefined' && api.deleteFile) {
        await api.deleteFile(fileId);
      } else if (typeof API !== 'undefined') {
        await API.post('file.delete', { id: fileId });
      } else {
        const url = this.getApiUrl() + '?action=file.delete';
        await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: fileId }) });
      }
      this.showToast('File berhasil dihapus', 'success');
      this.selectedFiles.delete(fileId);
      await this.loadFiles();
    } catch (error) {
      this.showToast('Gagal menghapus file', 'error');
    }
  }

  async bulkDelete() {
    if (this.selectedFiles.size === 0) return;

    const confirmed = await this.confirm(
      `Hapus ${this.selectedFiles.size} file yang dipilih?`,
      'Konfirmasi Hapus Massal'
    );

    if (!confirmed) return;

    let deleted = 0;
    for (const id of this.selectedFiles) {
      try {
        if (typeof api !== 'undefined' && api.deleteFile) {
          await api.deleteFile(id);
        } else if (typeof API !== 'undefined') {
          await API.post('file.delete', { id });
        }
        deleted++;
      } catch (e) {}
    }

    this.showToast(`${deleted} file berhasil dihapus`, 'success');
    this.selectedFiles.clear();
    this.updateBulkActions();
    await this.loadFiles();
  }

  async downloadFile(fileId) {
    const file = this.files.find(f => f.id === fileId);
    if (!file?.fileUrl && !file?.url) {
      this.showToast('URL file tidak tersedia', 'warning');
      return;
    }

    const url = file.fileUrl || file.url;
    const link = document.createElement('a');
    link.href = url;
    link.download = file.fileName || file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  bulkDownload() {
    this.selectedFiles.forEach(id => this.downloadFile(id));
  }

  async shareFile(fileId) {
    const file = this.files.find(f => f.id === fileId);
    if (!file?.fileUrl && !file?.url) return;

    const url = file.fileUrl || file.url;
    try {
      await navigator.clipboard.writeText(url);
      this.showToast('Link file disalin ke clipboard', 'success');
    } catch {
      this.showToast('Gagal menyalin link', 'error');
    }
  }

  openUploadModal() {
    document.getElementById('upload-modal')?.classList.remove('hidden');
    document.getElementById('upload-file-list').innerHTML = '';
    document.getElementById('upload-progress-container')?.classList.add('hidden');
  }

  toggleSelectFile(fileId) {
    if (this.selectedFiles.has(fileId)) {
      this.selectedFiles.delete(fileId);
    } else {
      this.selectedFiles.add(fileId);
    }
    this.updateBulkActions();
    this.renderFiles();
  }

  updateBulkActions() {
    const bulk = document.getElementById('bulk-actions');
    const count = document.getElementById('selected-count');
    if (bulk) bulk.classList.toggle('hidden', this.selectedFiles.size === 0);
    if (count) count.textContent = `${this.selectedFiles.size} file dipilih`;
  }

  updateTotalDisplay() {
    document.getElementById('total-files').textContent = `${this.pagination.total} file`;
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
    document.getElementById('page-total').textContent = total;
  }

  showLoading() { document.getElementById('files-loading').style.display = 'flex'; }
  hideLoading() { document.getElementById('files-loading').style.display = 'none'; }

  // Helpers
  isImage(f) { const t = f.fileType || f.type || ''; return t.startsWith('image/') || /\.(jpg|jpeg|png|gif|svg|webp|bmp)$/i.test(f.fileName || f.name || ''); }
  isPDF(f) { const t = f.fileType || f.type || ''; return t === 'application/pdf' || /\.pdf$/i.test(f.fileName || f.name || ''); }
  getFileIcon(n) { const e = (n || '').split('.').pop()?.toLowerCase(); const i = { pdf:'picture_as_pdf', doc:'description', docx:'description', xls:'table_chart', xlsx:'table_chart', ppt:'slideshow', pptx:'slideshow', jpg:'image', jpeg:'image', png:'image', gif:'gif', svg:'image', mp4:'video_file', mp3:'audio_file', zip:'folder_zip', rar:'folder_zip', txt:'article', csv:'table_chart', json:'code', js:'code', html:'code', css:'code' }; return i[e] || 'insert_drive_file'; }
  getFileType(n) { const e = (n || '').split('.').pop()?.toLowerCase(); const t = { pdf:'PDF', doc:'Word', docx:'Word', xls:'Excel', xlsx:'Excel', ppt:'PowerPoint', pptx:'PowerPoint', jpg:'Gambar', jpeg:'Gambar', png:'Gambar', gif:'Gambar', svg:'Gambar', mp4:'Video', mp3:'Audio', zip:'Arsip', rar:'Arsip', txt:'Teks', csv:'CSV', json:'JSON' }; return t[e] || 'File'; }
  formatSize(b) { if (!b) return '-'; return b < 1024 ? b+' B' : b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB'; }
  formatDate(d) { try { return new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }); } catch { return '-'; } }
  escapeAttr(s) { return (s || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  getApiUrl() { return (typeof APP_CONFIG !== 'undefined') ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : ''; }
  showToast(m, t) { if (typeof Toast !== 'undefined') Toast.show(m, t); else if (typeof NotificationService !== 'undefined') NotificationService.show(m, t); }
  confirm(m, t) { return new Promise(resolve => { if (typeof NotificationService !== 'undefined' && NotificationService.confirm) { NotificationService.confirm(m, t).then(resolve); } else { resolve(window.confirm(m)); } }); }

  bindEvents() {
    // Upload
    document.getElementById('btn-upload')?.addEventListener('click', () => this.openUploadModal());
    document.getElementById('btn-upload-empty')?.addEventListener('click', () => this.openUploadModal());
    document.getElementById('btn-close-upload')?.addEventListener('click', () => document.getElementById('upload-modal').classList.add('hidden'));
    document.getElementById('btn-cancel-upload')?.addEventListener('click', () => document.getElementById('upload-modal').classList.add('hidden'));
    document.getElementById('btn-start-upload')?.addEventListener('click', () => {
      const input = document.getElementById('file-upload-input');
      if (input?.files?.length) this.uploadFiles(input.files);
    });

    // Upload zone
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-upload-input');
    uploadZone?.addEventListener('click', () => fileInput?.click());
    uploadZone?.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('upload-zone--dragover'); });
    uploadZone?.addEventListener('dragleave', () => uploadZone.classList.remove('upload-zone--dragover'));
    uploadZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('upload-zone--dragover');
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        document.getElementById('btn-start-upload').disabled = false;
      }
    });
    fileInput?.addEventListener('change', () => {
      document.getElementById('btn-start-upload').disabled = !fileInput.files?.length;
    });

    // Filters
    let searchTimeout;
    document.getElementById('filter-search')?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => { this.filters.search = e.target.value; this.pagination.page = 1; this.loadFiles(); }, 500);
    });
    document.getElementById('filter-type')?.addEventListener('change', (e) => { this.filters.type = e.target.value; this.pagination.page = 1; this.loadFiles(); });
    document.getElementById('filter-sort')?.addEventListener('change', (e) => {
      const [sortBy, sortOrder] = e.target.value.split(':');
      this.filters.sortBy = sortBy;
      this.filters.sortOrder = sortOrder;
      this.pagination.page = 1;
      this.loadFiles();
    });

    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.viewMode = btn.dataset.view;
        this.renderFiles();
      });
    });

    // File actions (delegation)
    document.getElementById('file-grid')?.addEventListener('click', (e) => this.handleFileAction(e));
    document.getElementById('file-list')?.addEventListener('click', (e) => this.handleFileAction(e));

    // Bulk actions
    document.getElementById('btn-bulk-download')?.addEventListener('click', () => this.bulkDownload());
    document.getElementById('btn-bulk-delete')?.addEventListener('click', () => this.bulkDelete());
    document.getElementById('btn-clear-selection')?.addEventListener('click', () => {
      this.selectedFiles.clear();
      this.updateBulkActions();
      this.renderFiles();
    });

    // Select all
    document.getElementById('select-all-checkbox')?.addEventListener('change', (e) => {
      this.selectAll = e.target.checked;
      if (this.selectAll) {
        this.files.forEach(f => this.selectedFiles.add(f.id));
      } else {
        this.selectedFiles.clear();
      }
      this.updateBulkActions();
      this.renderFiles();
    });

    // Preview modal
    document.getElementById('btn-close-preview')?.addEventListener('click', () => document.getElementById('preview-modal').classList.add('hidden'));
    document.getElementById('btn-close-preview-footer')?.addEventListener('click', () => document.getElementById('preview-modal').classList.add('hidden'));
    document.getElementById('btn-download-preview')?.addEventListener('click', () => {
      const id = document.getElementById('preview-modal').dataset.fileId;
      if (id) this.downloadFile(id);
    });
    document.getElementById('btn-share-preview')?.addEventListener('click', () => {
      const id = document.getElementById('preview-modal').dataset.fileId;
      if (id) this.shareFile(id);
    });

    // Pagination
    document.getElementById('btn-first')?.addEventListener('click', () => { this.pagination.page = 1; this.loadFiles(); });
    document.getElementById('btn-prev')?.addEventListener('click', () => { if (this.pagination.page > 1) { this.pagination.page--; this.loadFiles(); } });
    document.getElementById('btn-next')?.addEventListener('click', () => { if (this.pagination.page < this.pagination.totalPages) { this.pagination.page++; this.loadFiles(); } });
    document.getElementById('btn-last')?.addEventListener('click', () => { this.pagination.page = this.pagination.totalPages; this.loadFiles(); });
    document.getElementById('page-size-select')?.addEventListener('change', (e) => { this.pagination.limit = parseInt(e.target.value); this.pagination.page = 1; this.loadFiles(); });

    // Refresh
    document.getElementById('btn-refresh')?.addEventListener('click', () => this.loadFiles());

    // Modal backdrop
    document.querySelectorAll('.modal-overlay').forEach(m => m.addEventListener('click', (e) => { if (e.target === m) m.classList.add('hidden'); }));

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'u') { e.preventDefault(); this.openUploadModal(); }
    });
  }

  handleFileAction(e) {
    const target = e.target.closest('[data-action]') || e.target;
    const action = target.dataset?.action || (target.closest('[data-action]')?.dataset?.action);
    const fileId = target.dataset?.id || target.closest('[data-id]')?.dataset?.id;

    if (!action && e.target.closest('.file-card__preview')) {
      const card = e.target.closest('.file-card');
      if (card) { this.previewFile(card.dataset.id); return; }
    }
    if (!action && e.target.closest('[data-action="preview"]')) {
      const row = e.target.closest('[data-id]');
      if (row) { this.previewFile(row.dataset.id); return; }
    }

    if (!fileId) return;

    switch (action) {
      case 'preview': this.previewFile(fileId); break;
      case 'download': this.downloadFile(fileId); break;
      case 'share': this.shareFile(fileId); break;
      case 'delete': this.deleteFile(fileId); break;
    }

    // Checkbox
    if (e.target.classList.contains('file-checkbox') || e.target.closest('.file-checkbox')) {
      this.toggleSelectFile(fileId);
    }
  }

  destroy() {}
}

const FileManagerComponent = (props) => {
  const page = new FileManagerPage();
  const container = document.createElement('div');
  container.className = 'content-area file-manager';
  container._instance = page;
  page.render(container);
  return container;
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FileManagerPage, FileManagerComponent };
}
