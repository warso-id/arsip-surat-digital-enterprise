/**
 * ============================================
 * GLOBAL SEARCH PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL SEARCH EXPERIENCE - SIAP PRODUKSI
 * Mendukung: Full-Text Search, Filters, Sort,
 * Recent Searches, Voice Search, AI Suggestions
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class GlobalSearchPage {
  constructor() {
    this.container = null;
    this.results = [];
    this.total = 0;
    this.query = '';
    this.filters = { category: '', status: '', sifat: '', dateFrom: '', dateTo: '', sortBy: 'relevance', sortOrder: 'desc' };
    this.page = 1;
    this.limit = 20;
    this.isSearching = false;
    this.recentSearches = [];
    this.pageId = 'search-' + Math.random().toString(36).substr(2, 9);
    this.searchTimeout = null;
    this.voiceActive = false;
  }

  async render(container) {
    this.container = container;
    this.container.setAttribute('data-page-id', this.pageId);

    // Get query from route
    this.query = this.getQueryFromRoute();

    this.container.innerHTML = this.getTemplate();
    this.loadRecentSearches();
    this.bindEvents();

    if (this.query) {
      document.getElementById('search-input').value = this.query;
      await this.performSearch();
    } else {
      this.showInitialState();
    }

    console.log('✅ GlobalSearchPage rendered');
  }

  getQueryFromRoute() {
    try {
      if (typeof store !== 'undefined') {
        const route = store.getState('ui.currentRoute');
        return route?.query?.q || route?.query?.query || '';
      }
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
      return params.get('q') || params.get('query') || '';
    } catch { return ''; }
  }

  getTemplate() {
    return `
      <div class="search-page" id="search-${this.pageId}">
        <!-- Search Hero -->
        <div class="search-hero">
          <div class="search-hero__content">
            <h1 class="search-hero__title">
              <span class="material-icons">search</span> Pencarian
            </h1>
            <div class="search-input search-input--lg" style="max-width:650px;margin:0 auto">
              <span class="search-input__icon material-icons">search</span>
              <input type="text" class="form-input form-input--lg" id="search-input" 
                     placeholder="Cari surat, disposisi, pengguna, dokumen..." 
                     value="${this.escapeAttr(this.query)}"
                     autocomplete="off"
                     autofocus>
              <button class="search-input__clear" id="btn-clear-search" style="display:${this.query ? 'flex' : 'none'}" aria-label="Hapus pencarian">
                <span class="material-icons">close</span>
              </button>
              <button class="search-input__voice" id="btn-voice-search" aria-label="Pencarian suara" title="Pencarian Suara">
                <span class="material-icons">mic</span>
              </button>
            </div>
            <button class="btn btn-primary" id="btn-search-submit" style="margin-top:12px">
              <span class="material-icons">search</span> Cari
            </button>
          </div>
        </div>

        <!-- Filters Bar -->
        <div class="filters-bar" id="filters-bar" style="display:none">
          <select class="form-select" id="filter-category" style="width:170px">
            <option value="">📂 Semua Kategori</option>
            <option value="surat-masuk">📥 Surat Masuk</option>
            <option value="surat-keluar">📤 Surat Keluar</option>
            <option value="disposisi">➡️ Disposisi</option>
            <option value="users">👤 Pengguna</option>
            <option value="files">📁 File</option>
          </select>
          <select class="form-select" id="filter-status" style="width:160px">
            <option value="">📊 Semua Status</option>
            <option value="diterima">Diterima</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
            <option value="diarsipkan">Diarsipkan</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select class="form-select" id="filter-sifat" style="width:150px">
            <option value="">🏷️ Semua Sifat</option>
            <option value="biasa">Biasa</option>
            <option value="penting">Penting</option>
            <option value="segera">Segera</option>
            <option value="rahasia">Rahasia</option>
          </select>
          <input type="date" class="form-input" id="filter-date-from" style="width:145px" title="Dari Tanggal" placeholder="Dari">
          <input type="date" class="form-input" id="filter-date-to" style="width:145px" title="Sampai Tanggal" placeholder="Sampai">
          <select class="form-select" id="filter-sort" style="width:170px">
            <option value="relevance:desc">🎯 Relevansi</option>
            <option value="date:desc">📅 Terbaru</option>
            <option value="date:asc">📅 Terlama</option>
            <option value="title:asc">🔤 Judul A-Z</option>
            <option value="title:desc">🔤 Judul Z-A</option>
          </select>
          <div class="filters-bar__actions">
            <button class="btn btn-sm btn-ghost" id="btn-clear-filters">
              <span class="material-icons">clear_all</span> Reset
            </button>
          </div>
        </div>

        <!-- Search Stats -->
        <div id="search-stats-bar" style="display:none;margin-bottom:16px">
          <span class="text-muted" id="search-stats"></span>
          <span class="text-muted" style="margin-left:auto" id="search-time"></span>
        </div>

        <!-- Results Area -->
        <div id="search-results"></div>

        <!-- Loading -->
        <div id="search-loading" class="page-loading" style="display:none">
          <div class="progress--circular"></div>
          <p>Mencari...</p>
        </div>

        <!-- Empty State -->
        <div id="search-empty" class="empty-state" style="display:none">
          <span class="material-icons" style="font-size:64px;color:var(--md-sys-color-outline)">search_off</span>
          <h3>Tidak ada hasil</h3>
          <p>Coba kata kunci lain atau filter berbeda</p>
        </div>

        <!-- Initial State -->
        <div id="search-initial">
          <!-- Recent Searches -->
          <div class="search-recent" id="recent-searches-section" style="display:none">
            <div class="search-recent__header">
              <h4><span class="material-icons">schedule</span> Pencarian Terakhir</h4>
              <button class="btn btn-ghost btn-sm" id="btn-clear-recent">Hapus Semua</button>
            </div>
            <div class="chip-group" id="recent-searches"></div>
          </div>

          <!-- Popular Searches -->
          <div class="search-popular">
            <h4><span class="material-icons">trending_up</span> Pencarian Populer</h4>
            <div class="chip-group" id="popular-searches">
              <span class="chip" data-query="undangan">📨 Undangan</span>
              <span class="chip" data-query="laporan">📊 Laporan</span>
              <span class="chip" data-query="permohonan">📝 Permohonan</span>
              <span class="chip" data-query="disposisi">➡️ Disposisi</span>
              <span class="chip" data-query="approval">✅ Approval</span>
              <span class="chip" data-query="rapat">📅 Rapat</span>
            </div>
          </div>

          <!-- Quick Links -->
          <div class="search-quick-links">
            <h4><span class="material-icons">rocket_launch</span> Akses Cepat</h4>
            <div class="quick-links-grid">
              <a href="#/surat-masuk" class="quick-link-card" onclick="event.preventDefault();router.navigate('/surat-masuk')">
                <span class="material-icons">inbox</span> Surat Masuk
              </a>
              <a href="#/surat-keluar" class="quick-link-card" onclick="event.preventDefault();router.navigate('/surat-keluar')">
                <span class="material-icons">outbox</span> Surat Keluar
              </a>
              <a href="#/disposisi" class="quick-link-card" onclick="event.preventDefault();router.navigate('/disposisi')">
                <span class="material-icons">forward</span> Disposisi
              </a>
              <a href="#/dashboard" class="quick-link-card" onclick="event.preventDefault();router.navigate('/dashboard')">
                <span class="material-icons">dashboard</span> Dashboard
              </a>
            </div>
          </div>
        </div>

        <!-- Load More -->
        <div id="load-more-container" style="text-align:center;margin-top:24px;display:none">
          <button class="btn btn-secondary" id="btn-load-more">
            <span class="material-icons">expand_more</span> Muat Lebih Banyak
          </button>
          <p class="text-muted text-sm" style="margin-top:8px">
            Menampilkan <span id="showing-count">0</span> dari <span id="total-count">0</span>
          </p>
        </div>
      </div>
    `;
  }

  async performSearch() {
    if (!this.query || this.query.length < 2) {
      this.showInitialState();
      return;
    }

    if (this.isSearching) return;
    this.isSearching = true;

    this.showSearching();
    this.hideInitialState();
    document.getElementById('filters-bar').style.display = 'flex';

    const startTime = performance.now();

    try {
      let response;

      if (typeof SearchService !== 'undefined' && SearchService.search) {
        response = await SearchService.search(this.query, {
          page: this.page,
          limit: this.limit,
          filters: this.filters
        });
      } else if (typeof api !== 'undefined') {
        response = await api.get('search', {
          q: this.query,
          page: this.page,
          limit: this.limit,
          category: this.filters.category,
          status: this.filters.status,
          sifat: this.filters.sifat,
          startDate: this.filters.dateFrom,
          endDate: this.filters.dateTo,
          sortBy: this.filters.sortBy,
          sortOrder: this.filters.sortOrder
        });
      } else if (typeof API !== 'undefined') {
        response = await API.get('search', {
          q: this.query, page: this.page, limit: this.limit,
          category: this.filters.category, status: this.filters.status
        });
      } else {
        const params = new URLSearchParams({
          action: 'search', q: this.query, page: this.page, limit: this.limit,
          category: this.filters.category, status: this.filters.status
        });
        const url = this.getApiUrl() + '?' + params.toString();
        const res = await fetch(url);
        response = await res.json();
      }

      const endTime = performance.now();
      const searchTime = Math.round(endTime - startTime);

      if (response?.status === 'success') {
        this.results = response.data?.results || response.results || [];
        this.total = response.data?.total || response.total || 0;
      }

      this.renderResults();
      this.updateStats(searchTime);
      this.updateLoadMore();

      // Save to recent
      this.saveRecentSearch(this.query);

    } catch (error) {
      console.error('Search failed:', error);
      this.showEmpty('Gagal melakukan pencarian. Silakan coba lagi.');
    } finally {
      this.isSearching = false;
      this.hideSearching();
    }
  }

  renderResults() {
    const container = document.getElementById('search-results');
    const empty = document.getElementById('search-empty');
    if (!container) return;

    if (this.results.length === 0) {
      container.innerHTML = '';
      empty.style.display = 'flex';
      document.getElementById('load-more-container').style.display = 'none';
      return;
    }

    empty.style.display = 'none';
    container.innerHTML = this.results.map((result, index) => this.renderResultItem(result, index)).join('');
  }

  renderResultItem(result, index) {
    const type = result._type || result.type || 'surat-masuk';
    const title = this.highlightText(result.perihal || result.judul || result.namaLengkap || result.title || 'Tanpa Judul');
    const desc = this.highlightText(
      result.pengirim || result.tujuan || result.email || result.instruksi?.substring(0, 100) || result.description || ''
    );

    return `
      <div class="search-result-item animate-fade-in-up" 
           style="animation-delay:${index * 40}ms"
           data-type="${type}" data-id="${result.id}"
           onclick="window._searchNavigate('${type}', '${result.id}')">
        <div class="search-result__icon search-result__icon--${this.getTypeClass(type)}">
          <span class="material-icons">${this.getResultIcon(type)}</span>
        </div>
        <div class="search-result__content">
          <div class="search-result__title">${title}</div>
          ${desc ? `<div class="search-result__description">${desc}</div>` : ''}
          <div class="search-result__meta">
            <span class="badge badge-sm badge-${this.getTypeClass(type)}">${this.getTypeLabel(type)}</span>
            ${result.nomorAgenda ? `<span class="text-mono text-sm">📄 ${result.nomorAgenda}</span>` : ''}
            ${result.nomorSurat ? `<span class="text-mono text-sm">📄 ${result.nomorSurat}</span>` : ''}
            ${result.status ? `<span class="badge badge-sm badge-${this.getStatusClass(result.status)}">${result.status}</span>` : ''}
            ${result.sifat ? `<span class="badge badge-sm badge-outline">${result.sifat}</span>` : ''}
            <span class="text-muted text-sm">${this.formatRelativeTime(result.createdAt || result.tanggalSurat)}</span>
          </div>
        </div>
        <div class="search-result__action">
          <span class="material-icons">chevron_right</span>
        </div>
      </div>
    `;
  }

  showInitialState() {
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('search-empty').style.display = 'none';
    document.getElementById('search-initial').style.display = 'block';
    document.getElementById('filters-bar').style.display = 'none';
    document.getElementById('search-stats-bar').style.display = 'none';
    document.getElementById('load-more-container').style.display = 'none';
    this.renderRecentSearches();
  }

  hideInitialState() {
    document.getElementById('search-initial').style.display = 'none';
  }

  showSearching() {
    document.getElementById('search-loading').style.display = 'flex';
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('search-empty').style.display = 'none';
  }

  hideSearching() {
    document.getElementById('search-loading').style.display = 'none';
  }

  showEmpty(message) {
    document.getElementById('search-empty').style.display = 'flex';
    document.getElementById('search-empty').querySelector('p').textContent = message;
  }

  updateStats(searchTime) {
    document.getElementById('search-stats-bar').style.display = 'flex';
    document.getElementById('search-stats').textContent = `🔍 ${this.total.toLocaleString()} hasil ditemukan untuk "${this.query}"`;
    document.getElementById('search-time').textContent = `⏱️ ${searchTime}ms`;
  }

  updateLoadMore() {
    const container = document.getElementById('load-more-container');
    const showing = Math.min(this.page * this.limit, this.total);

    if (this.results.length < this.total) {
      container.style.display = 'block';
      document.getElementById('showing-count').textContent = showing;
      document.getElementById('total-count').textContent = this.total.toLocaleString();
    } else if (this.total > 0) {
      container.style.display = 'block';
      document.getElementById('showing-count').textContent = showing;
      document.getElementById('total-count').textContent = this.total.toLocaleString();
      document.getElementById('btn-load-more').style.display = 'none';
    } else {
      container.style.display = 'none';
    }
  }

  highlightText(text) {
    if (!text || !this.query) return text || '';
    const escaped = this.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  loadRecentSearches() {
    try {
      const stored = localStorage.getItem('asd_recent_searches');
      this.recentSearches = stored ? JSON.parse(stored) : [];
    } catch { this.recentSearches = []; }
  }

  saveRecentSearch(query) {
    if (!query || query.length < 2) return;
    this.recentSearches = [query, ...this.recentSearches.filter(q => q !== query)].slice(0, 10);
    try { localStorage.setItem('asd_recent_searches', JSON.stringify(this.recentSearches)); } catch {}
  }

  renderRecentSearches() {
    const section = document.getElementById('recent-searches-section');
    const container = document.getElementById('recent-searches');
    if (!section || !container) return;

    if (this.recentSearches.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    container.innerHTML = this.recentSearches.map(q => `
      <span class="chip recent-chip" data-query="${this.escapeAttr(q)}">
        <span class="material-icons" style="font-size:14px">schedule</span> ${this.escapeHtml(q)}
      </span>
    `).join('');
  }

  clearRecentSearches() {
    this.recentSearches = [];
    localStorage.removeItem('asd_recent_searches');
    this.renderRecentSearches();
    this.showToast('Riwayat pencarian dihapus', 'info');
  }

  startVoiceSearch() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      this.showToast('Pencarian suara tidak didukung di browser ini', 'warning');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    this.voiceActive = true;
    const voiceBtn = document.getElementById('btn-voice-search');
    if (voiceBtn) {
      voiceBtn.classList.add('voice-active');
      voiceBtn.querySelector('.material-icons').textContent = 'mic';
      voiceBtn.querySelector('.material-icons').style.color = 'var(--md-sys-color-error)';
    }

    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const input = document.getElementById('search-input');
      if (input) {
        input.value = transcript;
        this.query = transcript;
        document.getElementById('btn-clear-search').style.display = 'flex';
        this.performSearch();
      }
    };

    recognition.onerror = () => {
      this.voiceActive = false;
      if (voiceBtn) {
        voiceBtn.classList.remove('voice-active');
        voiceBtn.querySelector('.material-icons').textContent = 'mic';
        voiceBtn.querySelector('.material-icons').style.color = '';
      }
    };

    recognition.onend = () => {
      this.voiceActive = false;
      if (voiceBtn) {
        voiceBtn.classList.remove('voice-active');
        voiceBtn.querySelector('.material-icons').textContent = 'mic';
        voiceBtn.querySelector('.material-icons').style.color = '';
      }
    };
  }

  // Helpers
  getResultIcon(t) { const i = { 'surat-masuk':'inbox', 'surat-keluar':'outbox', 'disposisi':'forward', 'users':'person', 'files':'description' }; return i[t] || 'description'; }
  getTypeClass(t) { const c = { 'surat-masuk':'info', 'surat-keluar':'warning', 'disposisi':'success', 'users':'primary', 'files':'secondary' }; return c[t] || 'default'; }
  getTypeLabel(t) { const l = { 'surat-masuk':'Surat Masuk', 'surat-keluar':'Surat Keluar', 'disposisi':'Disposisi', 'users':'Pengguna', 'files':'File' }; return l[t] || t; }
  getStatusClass(s) { const c = { diterima:'info', diproses:'warning', selesai:'success', diarsipkan:'primary', pending:'warning', approved:'success', rejected:'error' }; return c[s] || 'default'; }
  formatRelativeTime(d) { try { const diff = Date.now() - new Date(d).getTime(); const sec = Math.floor(diff/1000); if (sec<60) return 'Baru saja'; if (sec<3600) return Math.floor(sec/60)+' menit'; if (sec<86400) return Math.floor(sec/3600)+' jam'; if (sec<604800) return Math.floor(sec/86400)+' hari'; return new Date(d).toLocaleDateString('id-ID'); } catch { return '-'; } }
  escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
  escapeAttr(s) { return (s || '').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  getApiUrl() { return (typeof APP_CONFIG !== 'undefined') ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : ''; }
  showToast(m, t) { if (typeof Toast !== 'undefined') Toast.show(m, t); else if (typeof NotificationService !== 'undefined') NotificationService.show(m, t); }

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('search-input');
    searchInput?.addEventListener('input', () => {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.query = searchInput.value.trim();
        document.getElementById('btn-clear-search').style.display = this.query ? 'flex' : 'none';
        this.page = 1;
        if (this.query.length >= 2) this.performSearch();
        else this.showInitialState();
      }, 400);
    });

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(this.searchTimeout);
        this.query = searchInput.value.trim();
        this.page = 1;
        if (this.query.length >= 2) this.performSearch();
      }
    });

    // Search submit button
    document.getElementById('btn-search-submit')?.addEventListener('click', () => {
      this.query = searchInput?.value?.trim() || '';
      this.page = 1;
      if (this.query.length >= 2) this.performSearch();
    });

    // Clear search
    document.getElementById('btn-clear-search')?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      this.query = '';
      document.getElementById('btn-clear-search').style.display = 'none';
      this.showInitialState();
      searchInput?.focus();
    });

    // Voice search
    document.getElementById('btn-voice-search')?.addEventListener('click', () => this.startVoiceSearch());

    // Filters
    document.getElementById('filter-category')?.addEventListener('change', (e) => { this.filters.category = e.target.value; this.page = 1; this.performSearch(); });
    document.getElementById('filter-status')?.addEventListener('change', (e) => { this.filters.status = e.target.value; this.page = 1; this.performSearch(); });
    document.getElementById('filter-sifat')?.addEventListener('change', (e) => { this.filters.sifat = e.target.value; this.page = 1; this.performSearch(); });
    document.getElementById('filter-date-from')?.addEventListener('change', (e) => { this.filters.dateFrom = e.target.value; this.page = 1; this.performSearch(); });
    document.getElementById('filter-date-to')?.addEventListener('change', (e) => { this.filters.dateTo = e.target.value; this.page = 1; this.performSearch(); });
    document.getElementById('filter-sort')?.addEventListener('change', (e) => {
      const [sortBy, sortOrder] = e.target.value.split(':');
      this.filters.sortBy = sortBy; this.filters.sortOrder = sortOrder;
      this.page = 1; this.performSearch();
    });
    document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
      this.filters = { category:'', status:'', sifat:'', dateFrom:'', dateTo:'', sortBy:'relevance', sortOrder:'desc' };
      document.getElementById('filter-category').value = '';
      document.getElementById('filter-status').value = '';
      document.getElementById('filter-sifat').value = '';
      document.getElementById('filter-date-from').value = '';
      document.getElementById('filter-date-to').value = '';
      document.getElementById('filter-sort').value = 'relevance:desc';
      this.page = 1; this.performSearch();
    });

    // Load more
    document.getElementById('btn-load-more')?.addEventListener('click', () => { this.page++; this.performSearch(); });

    // Recent searches
    document.getElementById('recent-searches')?.addEventListener('click', (e) => {
      const chip = e.target.closest('.recent-chip');
      if (chip && searchInput) {
        searchInput.value = chip.dataset.query;
        this.query = chip.dataset.query;
        document.getElementById('btn-clear-search').style.display = 'flex';
        this.page = 1; this.performSearch();
      }
    });

    document.getElementById('btn-clear-recent')?.addEventListener('click', () => this.clearRecentSearches());

    // Popular searches
    document.getElementById('popular-searches')?.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (chip && searchInput) {
        searchInput.value = chip.dataset.query;
        this.query = chip.dataset.query;
        document.getElementById('btn-clear-search').style.display = 'flex';
        this.page = 1; this.performSearch();
      }
    });
  }

  destroy() {}
}

// Global navigation handler
window._searchNavigate = (type, id) => {
  const paths = {
    'surat-masuk': '/surat-masuk/', 'surat-keluar': '/surat-keluar/',
    'disposisi': '/disposisi/', 'users': '/users/', 'files': '/files/'
  };
  const path = (paths[type] || '/') + id;
  if (typeof router !== 'undefined') router.navigate(path);
  else window.location.hash = '#' + path;
};

const GlobalSearchComponent = (props) => {
  const page = new GlobalSearchPage();
  const container = document.createElement('div');
  container.className = 'content-area search-page';
  container._searchPage = page;
  page.render(container);
  return container;
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GlobalSearchPage, GlobalSearchComponent };
}
