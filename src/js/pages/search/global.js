/**
 * GLOBAL SEARCH PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class GlobalSearchPage {
  constructor() {
    this.container = null;
    this.results = [];
    this.total = 0;
    this.query = '';
    this.filters = { category: '', status: '', sortBy: 'relevance' };
    this.page = 1;
    this.limit = 20;
  }
  
  async render(container) {
    this.container = container;
    this.query = store.getState('ui.currentRoute')?.query?.q || '';
    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
    
    if (this.query) {
      document.getElementById('search-input').value = this.query;
      await this.performSearch();
    }
  }
  
  getTemplate() {
    return `
      <div class="search-page">
        <div class="search-hero">
          <div class="search-input" style="max-width:600px;margin:0 auto">
            <span class="search-input__icon material-icons">search</span>
            <input type="text" class="form-input form-input--lg" id="search-input" 
                   placeholder="Cari surat, disposisi, pengguna..." value="${this.query}">
            <button class="search-input__clear" id="btn-clear-search" style="display:${this.query ? 'flex' : 'none'}">
              <span class="material-icons">close</span>
            </button>
          </div>
        </div>
        
        <div class="filters-bar">
          <select class="form-select" id="filter-category" style="width:180px">
            <option value="">Semua Kategori</option>
            <option value="surat-masuk">Surat Masuk</option>
            <option value="surat-keluar">Surat Keluar</option>
            <option value="disposisi">Disposisi</option>
            <option value="users">Pengguna</option>
          </select>
          <select class="form-select" id="filter-status" style="width:150px">
            <option value="">Semua Status</option>
            <option value="diterima">Diterima</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
          </select>
          <select class="form-select" id="filter-sort" style="width:150px">
            <option value="relevance">Relevansi</option>
            <option value="date">Tanggal Terbaru</option>
            <option value="title">Judul A-Z</option>
          </select>
          <span class="text-muted" id="search-stats"></span>
        </div>
        
        <div id="search-results"></div>
        
        <div class="pagination" id="pagination" style="display:none">
          <button class="btn btn-ghost" id="btn-load-more">Muat Lebih Banyak</button>
        </div>
        
        <div id="search-suggestions" style="display:none">
          <h4>Pencarian Populer</h4>
          <div class="chip-group" id="popular-searches"></div>
        </div>
      </div>
    `;
  }
  
  async performSearch() {
    if (!this.query || this.query.length < 2) return;
    
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '<div class="skeleton-text"></div><div class="skeleton-text"></div><div class="skeleton-text"></div>';
    
    try {
      const response = await SearchService.search(this.query, {
        page: this.page,
        limit: this.limit,
        filters: this.filters
      });
      
      this.results = response.results || [];
      this.total = response.total || 0;
      
      this.renderResults();
      document.getElementById('search-stats').textContent = `${this.total} hasil ditemukan`;
      document.getElementById('pagination').style.display = this.results.length < this.total ? 'flex' : 'none';
      document.getElementById('search-suggestions').style.display = this.total === 0 ? 'block' : 'none';
      
      if (this.total === 0) this.renderSuggestions();
    } catch (error) {
      resultsDiv.innerHTML = '<p class="text-muted text-center">Gagal melakukan pencarian</p>';
    }
  }
  
  renderResults() {
    const resultsDiv = document.getElementById('search-results');
    if (!resultsDiv) return;
    
    if (this.results.length === 0) {
      resultsDiv.innerHTML = `<div class="empty-state"><span class="material-icons">search_off</span><h3>Tidak ada hasil</h3><p>Coba kata kunci lain atau filter berbeda</p></div>`;
      return;
    }
    
    resultsDiv.innerHTML = this.results.map(result => this.renderResultItem(result)).join('');
  }
  
  renderResultItem(result) {
    const highlightTitle = SearchService.highlightText(result.perihal || result.judul || result.namaLengkap || '', this.query);
    const highlightDesc = SearchService.highlightText(result.pengirim || result.tujuan || result.catatan || '', this.query);
    
    return `
      <div class="search-result-item" onclick="window._openResult('${result._type || 'surat-masuk'}', '${result.id}')">
        <div class="search-result__icon">
          <span class="material-icons">${this.getResultIcon(result._type)}</span>
        </div>
        <div class="search-result__content">
          <div class="search-result__title">${highlightTitle}</div>
          <div class="search-result__description">${highlightDesc}</div>
          <div class="search-result__meta">
            <span class="badge badge-${this.getTypeClass(result._type)}">${this.getTypeLabel(result._type)}</span>
            ${result.nomorAgenda ? `<span class="text-mono">${result.nomorAgenda}</span>` : ''}
            ${result.status ? `<span class="badge">${result.status}</span>` : ''}
            <span>${Formatters.relativeTime(result.createdAt || result.tanggalSurat)}</span>
          </div>
        </div>
        <div class="search-result__action">
          <span class="material-icons">chevron_right</span>
        </div>
      </div>
    `;
  }
  
  renderSuggestions() {
    const popular = SearchService.getPopularSearches();
    const container = document.getElementById('popular-searches');
    if (container && popular.length > 0) {
      container.innerHTML = popular.map(q => `
        <span class="chip" onclick="window._searchSuggestion('${q}')">${q}</span>
      `).join('');
    }
  }
  
  getResultIcon(type) {
    const icons = { 'surat-masuk': 'inbox', 'surat-keluar': 'outbox', 'disposisi': 'forward', 'users': 'person' };
    return icons[type] || 'description';
  }
  
  getTypeClass(type) {
    const classes = { 'surat-masuk': 'info', 'surat-keluar': 'warning', 'disposisi': 'success', 'users': 'primary' };
    return classes[type] || 'default';
  }
  
  getTypeLabel(type) {
    const labels = { 'surat-masuk': 'Surat Masuk', 'surat-keluar': 'Surat Keluar', 'disposisi': 'Disposisi', 'users': 'Pengguna' };
    return labels[type] || type;
  }
  
  bindEvents() {
    document.getElementById('search-input')?.addEventListener('input', debounce((e) => {
      this.query = e.target.value.trim();
      document.getElementById('btn-clear-search').style.display = this.query ? 'flex' : 'none';
      this.page = 1;
      if (this.query.length >= 2) this.performSearch();
    }, 500));
    document.getElementById('search-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { this.page = 1; this.performSearch(); }
    });
    document.getElementById('btn-clear-search')?.addEventListener('click', () => {
      document.getElementById('search-input').value = '';
      this.query = '';
      document.getElementById('btn-clear-search').style.display = 'none';
      document.getElementById('search-results').innerHTML = '';
    });
    document.getElementById('filter-category')?.addEventListener('change', (e) => { this.filters.category = e.target.value; this.page = 1; this.performSearch(); });
    document.getElementById('filter-status')?.addEventListener('change', (e) => { this.filters.status = e.target.value; this.page = 1; this.performSearch(); });
    document.getElementById('filter-sort')?.addEventListener('change', (e) => { this.filters.sortBy = e.target.value; this.performSearch(); });
    document.getElementById('btn-load-more')?.addEventListener('click', () => { this.page++; this.performSearch(); });
  }
}

window._openResult = (type, id) => {
  const paths = { 'surat-masuk': '/surat-masuk/', 'surat-keluar': '/surat-keluar/', 'disposisi': '/disposisi/', 'users': '/users/' };
  router.navigate((paths[type] || '/') + id);
};
window._searchSuggestion = (q) => {
  document.getElementById('search-input').value = q;
  document.getElementById('search-input').dispatchEvent(new Event('input'));
};

const GlobalSearchComponent = (props) => {
  const page = new GlobalSearchPage();
  const container = document.createElement('div');
  container.className = 'content-area search-page';
  page.render(container);
  return container;
};
