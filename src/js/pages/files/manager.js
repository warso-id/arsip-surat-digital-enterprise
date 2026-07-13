/**
 * FILE MANAGER PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class FileManagerPage {
  constructor() {
    this.container = null;
    this.files = [];
    this.pagination = { page: 1, limit: 20, total: 0 };
    this.filters = { search: '', type: '' };
    this.selectedFiles = new Set();
    this.viewMode = 'grid'; // grid | list
  }
  
  async render(container) {
    this.container = container;
    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
    await this.loadFiles();
  }
  
  getTemplate() {
    return `
      <div class="file-manager">
        <div class="content-area__header">
          <div class="header-left">
            <h1 class="content-area__title">File Manager</h1>
            <p class="content-area__description">Kelola semua file dan dokumen</p>
          </div>
          <div class="header-right">
            <button class="btn btn-primary" id="btn-upload">
              <span class="material-icons">upload</span> Upload File
            </button>
          </div>
        </div>
        
        <div class="filters-bar">
          <div class="search-input" style="max-width:300px">
            <span class="search-input__icon material-icons">search</span>
            <input type="text" class="form-input" placeholder="Cari file..." id="filter-search">
          </div>
          <select class="form-select" id="filter-type" style="width:150px">
            <option value="">Semua Tipe</option>
            <option value="pdf">PDF</option>
            <option value="image">Gambar</option>
            <option value="document">Dokumen</option>
            <option value="spreadsheet">Spreadsheet</option>
            <option value="archive">Arsip</option>
          </select>
          <div class="view-toggle">
            <button class="btn-icon btn-icon-sm view-btn active" data-view="grid" title="Grid View">
              <span class="material-icons">grid_view</span>
            </button>
            <button class="btn-icon btn-icon-sm view-btn" data-view="list" title="List View">
              <span class="material-icons">view_list</span>
            </button>
          </div>
          <span class="text-muted" id="total-files">0 file</span>
        </div>
        
        <div class="file-grid" id="file-grid"></div>
        
        <div class="pagination" id="pagination">
          <div class="pagination__info">
            Menampilkan <span id="page-start">0</span>-<span id="page-end">0</span> dari <span id="page-total">0</span>
          </div>
          <div class="pagination__controls">
            <button class="btn-icon" id="btn-prev" disabled><span class="material-icons">chevron_left</span></button>
            <span id="page-current">1</span>
            <button class="btn-icon" id="btn-next" disabled><span class="material-icons">chevron_right</span></button>
          </div>
        </div>
        
        <input type="file" id="file-upload-input" multiple style="display:none">
      </div>
    `;
  }
  
  async loadFiles() {
    try {
      const response = await api.getFileList({
        page: this.pagination.page,
        limit: this.pagination.limit,
        search: this.filters.search,
        type: this.filters.type
      });
      
      if (response.status === 'success') {
        this.files = response.data.items || [];
        this.pagination.total = response.data.total || 0;
        this.renderFiles();
        this.updatePagination();
        document.getElementById('total-files').textContent = `${this.pagination.total} file`;
      }
    } catch (error) {
      NotificationService.error('Gagal memuat file');
    }
  }
  
  renderFiles() {
    const grid = document.getElementById('file-grid');
    if (!grid) return;
    
    if (this.files.length === 0) {
      grid.innerHTML = `<div class="empty-state"><span class="material-icons">folder_open</span><h3>Tidak ada file</h3><p>Upload file untuk memulai</p></div>`;
      return;
    }
    
    if (this.viewMode === 'grid') {
      grid.className = 'file-grid';
      grid.innerHTML = this.files.map(file => `
        <div class="file-card" data-id="${file.id}" onclick="window._previewFile('${file.id}')">
          <div class="file-card__preview">
            ${file.thumbnailUrl 
              ? `<img src="${file.thumbnailUrl}" alt="${file.fileName}" loading="lazy">`
              : `<span class="material-icons file-card__icon">${FileService.getFileIcon(file.fileName)}</span>`
            }
          </div>
          <div class="file-card__info">
            <div class="file-card__name" title="${file.fileName}">${file.fileName}</div>
            <div class="file-card__meta">
              <span>${FileService.formatSize(file.fileSize)}</span>
              <span>${Formatters.relativeTime(file.createdAt)}</span>
            </div>
          </div>
          <div class="file-card__actions">
            <button class="btn-icon btn-icon-sm" onclick="event.stopPropagation();window._downloadFile('${file.id}')" title="Download">
              <span class="material-icons">download</span>
            </button>
            <button class="btn-icon btn-icon-sm" onclick="event.stopPropagation();window._shareFile('${file.id}')" title="Share">
              <span class="material-icons">share</span>
            </button>
            <button class="btn-icon btn-icon-sm" onclick="event.stopPropagation();window._deleteFile('${file.id}')" title="Hapus">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
      `).join('');
    } else {
      grid.className = 'file-list-view';
      grid.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Nama File</th><th>Tipe</th><th>Ukuran</th><th>Tanggal</th><th>Aksi</th></tr></thead>
          <tbody>${this.files.map(file => `
            <tr onclick="window._previewFile('${file.id}')" style="cursor:pointer">
              <td><div class="file-name-cell"><span class="material-icons">${FileService.getFileIcon(file.fileName)}</span>${file.fileName}</div></td>
              <td>${FileService.getFileTypeLabel(file.fileName)}</td>
              <td>${FileService.formatSize(file.fileSize)}</td>
              <td>${Formatters.relativeTime(file.createdAt)}</td>
              <td><div class="table-actions">
                <button class="btn-icon btn-icon-sm" onclick="event.stopPropagation();window._downloadFile('${file.id}')"><span class="material-icons">download</span></button>
                <button class="btn-icon btn-icon-sm" onclick="event.stopPropagation();window._deleteFile('${file.id}')"><span class="material-icons">delete</span></button>
              </div></td>
            </tr>
          `).join('')}</tbody>
        </table>
      `;
    }
  }
  
  async uploadFiles(files) {
    for (const file of files) {
      try {
        await api.uploadFile(file, (progress) => {
          NotificationService.show(`Uploading ${file.name}: ${progress}%`, 'info', { duration: 1000, id: 'upload-progress' });
        });
      } catch (error) {
        NotificationService.error(`Gagal upload ${file.name}`);
      }
    }
    NotificationService.success('Upload selesai');
    this.loadFiles();
  }
  
  async previewFile(fileId) {
    const file = this.files.find(f => f.id === fileId);
    if (!file) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content modal-content--xl">
        <div class="modal-header">
          <h3>${file.fileName}</h3>
          <div><button class="btn btn-sm btn-secondary" onclick="window._downloadFile('${fileId}')"><span class="material-icons">download</span></button>
          <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()"><span class="material-icons">close</span></button></div>
        </div>
        <div class="modal-body modal-body--no-padding" id="preview-container" style="min-height:400px;display:flex;align-items:center;justify-content:center">
          <div class="progress--circular"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    await FileService.preview(fileId, modal.querySelector('#preview-container'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }
  
  updatePagination() {
    const { page, total } = this.pagination;
    const limit = this.pagination.limit;
    document.getElementById('btn-prev').disabled = page <= 1;
    document.getElementById('btn-next').disabled = page * limit >= total;
    document.getElementById('page-current').textContent = page;
    document.getElementById('page-start').textContent = total > 0 ? (page - 1) * limit + 1 : 0;
    document.getElementById('page-end').textContent = Math.min(page * limit, total);
    document.getElementById('page-total').textContent = total;
  }
  
  bindEvents() {
    document.getElementById('btn-upload')?.addEventListener('click', () => document.getElementById('file-upload-input').click());
    document.getElementById('file-upload-input')?.addEventListener('change', (e) => {
      if (e.target.files.length > 0) { this.uploadFiles(e.target.files); e.target.value = ''; }
    });
    document.getElementById('filter-search')?.addEventListener('input', debounce((e) => {
      this.filters.search = e.target.value; this.pagination.page = 1; this.loadFiles();
    }, 500));
    document.getElementById('filter-type')?.addEventListener('change', (e) => {
      this.filters.type = e.target.value; this.pagination.page = 1; this.loadFiles();
    });
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.viewMode = btn.dataset.view;
        this.renderFiles();
      });
    });
    document.getElementById('btn-prev')?.addEventListener('click', () => { if (this.pagination.page > 1) { this.pagination.page--; this.loadFiles(); } });
    document.getElementById('btn-next')?.addEventListener('click', () => { if (this.pagination.page * this.pagination.limit < this.pagination.total) { this.pagination.page++; this.loadFiles(); } });
  }
}

window._previewFile = (id) => { const page = document.querySelector('.file-manager'); if (page?._instance) page._instance.previewFile(id); };
window._downloadFile = (id) => { FileService.download(id); };
window._deleteFile = async (id) => {
  const confirmed = await NotificationService.confirm('Hapus file ini?');
  if (confirmed) { await FileService.delete(id); const page = document.querySelector('.file-manager'); if (page?._instance) page._instance.loadFiles(); }
};
window._shareFile = (id) => { FileService.share(id); };

const FileManagerComponent = (props) => {
  const page = new FileManagerPage();
  const container = document.createElement('div');
  container.className = 'content-area file-manager';
  container._instance = page;
  page.render(container);
  return container;
};
