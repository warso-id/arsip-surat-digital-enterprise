/**
 * ============================================
 * SEARCH SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL SEARCH ENGINE - SIAP PRODUKSI
 * Mendukung: Global, Advanced, AI, Local,
 * Fuzzy, Suggestions, History, Analytics
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class SearchService {
  constructor() {
    this.searchHistory = [];
    this.maxHistory = 50;
    this.searchTimeout = null;
    this.minQueryLength = 2;
    this.debounceDelay = 300;
    this.localIndex = {};
    this.indexBuilt = false;
    this.cachePrefix = 'asd_search_';
    this.cacheTTL = 300000; // 5 minutes
    this.fuzzyThreshold = 0.6;
    this.maxResults = 100;
    this.searchAnalytics = [];
  }

  /**
   * Initialize search service
   */
  init() {
    this.loadHistory();
    this.buildLocalIndex();
    console.log('✅ Search Service initialized');
  }

  /**
   * Global search - main entry point
   */
  async search(query, options = {}) {
    const {
      page = 1,
      limit = 20,
      filters = {},
      useAI = false,
      fuzzy = false,
      sortBy = 'relevance',
      sortOrder = 'desc',
      skipCache = false
    } = options;

    if (!query || query.length < this.minQueryLength) {
      return { results: [], total: 0, source: 'none' };
    }

    const cleanQuery = this.cleanQuery(query);

    // Save to history
    this.addToHistory(cleanQuery);

    // Check cache
    if (!skipCache) {
      const cacheKey = this.getCacheKey(cleanQuery, { page, limit, filters });
      const cached = await this.getCached(cacheKey);
      if (cached) return cached;
    }

    try {
      let response;

      // Try online search first
      if (navigator.onLine) {
        const endpoint = useAI ? 'ai.smartSearch' : 'search';
        const apiParams = {
          q: cleanQuery,
          page,
          limit,
          sortBy,
          sortOrder,
          ...filters
        };

        if (typeof api !== 'undefined') {
          response = await api.get(endpoint, apiParams);
        } else if (typeof API !== 'undefined') {
          response = await API.get(endpoint, apiParams);
        } else {
          const url = this.getApiUrl() + '?' + new URLSearchParams({ action: endpoint, ...apiParams }).toString();
          const res = await fetch(url);
          response = await res.json();
        }

        if (response?.status === 'success') {
          const data = {
            results: (response.data?.results || response.results || []).map(r => this.normalizeResult(r, cleanQuery)),
            total: response.data?.total || response.total || 0,
            page,
            limit,
            source: useAI ? 'ai' : 'api',
            query: cleanQuery
          };

          // Cache results
          await this.setCached(this.getCacheKey(cleanQuery, { page, limit, filters }), data);

          // Track analytics
          this.trackSearch(cleanQuery, data.total, data.source);

          return data;
        }
      }

      // Fallback to local search
      const localResults = this.localSearch(cleanQuery, { fuzzy, filters });
      const paginated = this.paginateResults(localResults, page, limit);

      return {
        results: paginated,
        total: localResults.length,
        page,
        limit,
        source: 'local',
        query: cleanQuery
      };

    } catch (error) {
      console.warn('Online search failed, trying local:', error.message);
      const localResults = this.localSearch(cleanQuery, { fuzzy, filters });
      const paginated = this.paginateResults(localResults, page, limit);

      return {
        results: paginated,
        total: localResults.length,
        page,
        limit,
        source: 'local-fallback',
        query: cleanQuery
      };
    }
  }

  /**
   * Advanced search with multiple criteria
   */
  async advancedSearch(params) {
    const {
      query, category, status, startDate, endDate,
      sifat, pengirim, tujuan, sortBy = 'date', sortOrder = 'desc',
      page = 1, limit = 20
    } = params;

    try {
      let response;
      const apiParams = { q: query, category, status, startDate, endDate, sifat, pengirim, tujuan, sortBy, sortOrder, page, limit };

      if (typeof api !== 'undefined') {
        response = await api.get('search.advanced', apiParams);
      } else if (typeof API !== 'undefined') {
        response = await API.get('search.advanced', apiParams);
      } else {
        const url = this.getApiUrl() + '?' + new URLSearchParams({ action: 'search.advanced', ...apiParams }).toString();
        const res = await fetch(url);
        response = await res.json();
      }

      if (response?.status === 'success') {
        return {
          results: (response.data?.results || []).map(r => this.normalizeResult(r, query)),
          total: response.data?.total || 0,
          page,
          limit,
          source: 'api'
        };
      }
    } catch (error) {
      console.error('Advanced search failed:', error);
    }

    return { results: [], total: 0, page, limit, source: 'error' };
  }

  /**
   * Local search (offline)
   */
  localSearch(query, options = {}) {
    const { fuzzy = false, filters = {} } = options;
    const lowerQuery = query.toLowerCase();
    const results = [];

    // Search in all local indexes
    Object.entries(this.localIndex).forEach(([type, items]) => {
      if (filters.category && type !== filters.category) return;

      items.forEach(item => {
        const searchText = (item._searchText || '').toLowerCase();
        let matched = false;
        let score = 0;

        if (fuzzy) {
          const { match, similarity } = this.fuzzyMatch(searchText, lowerQuery);
          if (match) {
            matched = true;
            score = similarity * 50 + this.calculateRelevance(item, lowerQuery);
          }
        } else {
          if (searchText.includes(lowerQuery)) {
            matched = true;
            score = this.calculateRelevance(item, lowerQuery);
          }
        }

        if (matched) {
          results.push({
            ...item,
            _type: type,
            _score: score,
            _source: 'local'
          });
        }
      });
    });

    // Apply filters
    let filtered = this.filterResults(results, filters);

    // Sort
    filtered = this.sortResults(filtered, 'relevance', 'desc');

    return filtered.slice(0, this.maxResults);
  }

  /**
   * Quick search for navbar/autocomplete
   */
  async quickSearch(query, limit = 5) {
    if (!query || query.length < 2) return [];

    const cleanQuery = this.cleanQuery(query);

    // Try online
    if (navigator.onLine) {
      try {
        let response;
        if (typeof api !== 'undefined') {
          response = await api.get('search', { q: cleanQuery, limit, quick: true });
        } else if (typeof API !== 'undefined') {
          response = await API.get('search', { q: cleanQuery, limit, quick: true });
        }
        if (response?.status === 'success') {
          return (response.data?.results || []).slice(0, limit).map(r => this.normalizeResult(r, cleanQuery));
        }
      } catch (e) {}
    }

    // Local quick search
    const localResults = this.localSearch(cleanQuery, {});
    return localResults.slice(0, limit);
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(query) {
    if (!query || query.length < 2) return [];

    const cleanQuery = this.cleanQuery(query);

    // From history
    const historyMatches = this.searchHistory
      .filter(h => h.toLowerCase().includes(cleanQuery.toLowerCase()) && h !== cleanQuery)
      .slice(0, 5);

    // From API
    let apiSuggestions = [];
    if (navigator.onLine) {
      try {
        let response;
        if (typeof api !== 'undefined') {
          response = await api.get('search', { q: cleanQuery, suggestions: true, limit: 5 });
        }
        if (response?.status === 'success' && response.data?.suggestions) {
          apiSuggestions = response.data.suggestions;
        }
      } catch (e) {}
    }

    // From local index (titles)
    const localSuggestions = [];
    Object.values(this.localIndex).forEach(items => {
      items.forEach(item => {
        const title = item.perihal || item.judul || item.namaLengkap || '';
        if (title.toLowerCase().includes(cleanQuery.toLowerCase())) {
          localSuggestions.push(title.substring(0, 60));
        }
      });
    });

    // Merge and deduplicate
    return [...new Set([...historyMatches, ...apiSuggestions, ...localSuggestions])].slice(0, 8);
  }

  /**
   * Search by category
   */
  async searchByCategory(category, query, options = {}) {
    const endpoints = {
      'surat-masuk': 'suratMasuk.list',
      'surat-keluar': 'suratKeluar.list',
      'disposisi': 'disposisi.list',
      'users': 'users.list',
      'files': 'file.list',
      'approval': 'approval.list'
    };

    const endpoint = endpoints[category];
    if (!endpoint) return { items: [], total: 0 };

    try {
      let response;
      if (typeof api !== 'undefined') {
        response = await api.get(endpoint, { search: query, ...options });
      } else if (typeof API !== 'undefined') {
        response = await API.get(endpoint, { search: query, ...options });
      }
      return response?.data || { items: [], total: 0 };
    } catch (error) {
      return { items: [], total: 0 };
    }
  }

  /**
   * Normalize search result
   */
  normalizeResult(result, query) {
    if (!result) return result;
    return {
      ...result,
      _type: result._type || result.type || 'unknown',
      _score: result._score || 0,
      _highlight: {
        title: this.highlightText(result.perihal || result.judul || result.namaLengkap || '', query),
        description: this.highlightText(
          result.pengirim || result.tujuan || result.catatan || result.instruksi?.substring(0, 100) || '',
          query
        )
      }
    };
  }

  /**
   * Calculate relevance score
   */
  calculateRelevance(item, query) {
    let score = 0;
    const fields = ['nomorSurat', 'nomorAgenda', 'perihal', 'pengirim', 'tujuan', 'namaLengkap', 'username'];
    const words = query.split(/\s+/);

    fields.forEach(field => {
      const value = (item[field] || '').toLowerCase();
      if (!value) return;

      // Exact match
      if (value === query) score += 100;
      // Starts with
      else if (value.startsWith(query)) score += 50;
      // Contains
      else if (value.includes(query)) score += 25;

      // Word-by-word match
      words.forEach(word => {
        if (value.includes(word)) score += 10;
      });
    });

    // Recency bonus (newer = higher)
    const dateField = item.createdAt || item.tanggalSurat || item.tanggalTerima;
    if (dateField) {
      const daysOld = (Date.now() - new Date(dateField).getTime()) / 86400000;
      score += Math.max(0, 30 - daysOld);
    }

    // Status priority (pending > processing > completed)
    const statusPriority = { pending: 15, diproses: 10, diterima: 8, selesai: 5, diarsipkan: 2 };
    score += statusPriority[item.status] || 0;

    return score;
  }

  /**
   * Fuzzy string matching
   */
  fuzzyMatch(text, query) {
    if (!text || !query) return { match: false, similarity: 0 };

    const words = text.split(/\s+/);
    let bestSimilarity = 0;

    for (const word of words) {
      if (word.length < 3) continue;
      const similarity = this.levenshteinSimilarity(word, query);
      if (similarity > bestSimilarity) bestSimilarity = similarity;
    }

    return {
      match: bestSimilarity >= this.fuzzyThreshold,
      similarity: bestSimilarity
    };
  }

  /**
   * Levenshtein similarity
   */
  levenshteinSimilarity(a, b) {
    const lenA = a.length;
    const lenB = b.length;
    const matrix = [];

    for (let i = 0; i <= lenA; i++) {
      matrix[i] = [i];
      for (let j = 1; j <= lenB; j++) {
        if (i === 0) {
          matrix[i][j] = j;
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
          );
        }
      }
    }

    const distance = matrix[lenA][lenB];
    return 1 - distance / Math.max(lenA, lenB);
  }

  /**
   * Filter results
   */
  filterResults(results, filters) {
    let filtered = [...results];

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(r => r._type === filters.category);
    }
    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status || r.approvalStatus === filters.status);
    }
    if (filters.sifat) {
      filtered = filtered.filter(r => r.sifat === filters.sifat);
    }
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      filtered = filtered.filter(r => new Date(r.createdAt || r.tanggalSurat) >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => new Date(r.createdAt || r.tanggalSurat) <= end);
    }

    return filtered;
  }

  /**
   * Sort results
   */
  sortResults(results, sortBy = 'relevance', sortOrder = 'desc') {
    const sorted = [...results];
    const comparators = {
      'relevance': (a, b) => (b._score || 0) - (a._score || 0),
      'date': (a, b) => new Date(b.createdAt || b.tanggalSurat || 0).getTime() - new Date(a.createdAt || a.tanggalSurat || 0).getTime(),
      'title': (a, b) => (a.perihal || a.judul || '').localeCompare(b.perihal || b.judul || ''),
      'number': (a, b) => (a.nomorSurat || a.nomorAgenda || '').localeCompare(b.nomorSurat || b.nomorAgenda || '')
    };

    sorted.sort(comparators[sortBy] || comparators.relevance);
    if (sortOrder === 'asc') sorted.reverse();
    return sorted;
  }

  /**
   * Paginate results
   */
  paginateResults(results, page = 1, limit = 20) {
    const start = (page - 1) * limit;
    return results.slice(start, start + limit);
  }

  /**
   * Highlight search terms
   */
  highlightText(text, query) {
    if (!text || !query) return text || '';
    const words = query.split(/\s+/).filter(w => w.length > 1);
    if (words.length === 0) return text;

    const pattern = words.map(w => this.escapeRegex(w)).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  /**
   * Build local search index
   */
  async buildLocalIndex() {
    try {
      const cacheKeys = ['sm_list', 'sk_list', 'disp_list', 'users_list', 'files_list'];
      const typeMap = {
        'sm_list': 'surat-masuk',
        'sk_list': 'surat-keluar',
        'disp_list': 'disposisi',
        'users_list': 'users',
        'files_list': 'files'
      };

      for (const key of cacheKeys) {
        let cached = null;
        if (typeof CacheService !== 'undefined') {
          cached = await CacheService.get(key);
        } else {
          try {
            const stored = localStorage.getItem(`asd_cache_${key}`);
            if (stored) cached = JSON.parse(stored)?.value;
          } catch (e) {}
        }

        if (cached?.items) {
          this.localIndex[typeMap[key]] = cached.items.map(item => ({
            ...item,
            _searchText: this.extractSearchText(item),
            _indexed: Date.now()
          }));
        }
      }

      this.indexBuilt = true;
      console.log(`✅ Local search index built (${Object.keys(this.localIndex).length} categories)`);
    } catch (error) {
      console.warn('Failed to build local index:', error);
    }
  }

  /**
   * Index individual data
   */
  indexData(category, items) {
    if (!items?.length) return;
    this.localIndex[category] = items.map(item => ({
      ...item,
      _searchText: this.extractSearchText(item),
      _indexed: Date.now()
    }));

    // Persist to localStorage
    try {
      localStorage.setItem(`asd_index_${category}`, JSON.stringify(this.localIndex[category]));
    } catch (e) {}
  }

  /**
   * Extract searchable text
   */
  extractSearchText(item) {
    const fields = [
      'nomorSurat', 'nomorAgenda', 'perihal', 'pengirim', 'tujuan',
      'instruksi', 'catatan', 'namaLengkap', 'username', 'email',
      'jabatan', 'unitKerja', 'fileName', 'description'
    ];
    return fields.map(f => item[f] || '').filter(Boolean).join(' ').toLowerCase();
  }

  /**
   * Search history management
   */
  addToHistory(query) {
    if (!query || query.length < 2) return;
    this.searchHistory = [query, ...this.searchHistory.filter(h => h !== query)].slice(0, this.maxHistory);
    this.saveHistory();
  }

  loadHistory() {
    try {
      this.searchHistory = JSON.parse(localStorage.getItem('asd_search_history') || '[]');
    } catch { this.searchHistory = []; }
  }

  saveHistory() {
    try { localStorage.setItem('asd_search_history', JSON.stringify(this.searchHistory)); } catch {}
  }

  clearHistory() {
    this.searchHistory = [];
    localStorage.removeItem('asd_search_history');
  }

  getHistory(limit = 20) { return this.searchHistory.slice(0, limit); }

  getPopularSearches(limit = 8) {
    const freq = {};
    this.searchHistory.forEach(q => { freq[q] = (freq[q] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([q]) => q);
  }

  /**
   * Cache helpers
   */
  getCacheKey(query, params) {
    const key = `${query}_${params.page}_${params.limit}_${JSON.stringify(params.filters || {})}`;
    return this.cachePrefix + this.hashString(key);
  }

  async getCached(key) {
    if (typeof CacheService !== 'undefined') {
      return CacheService.get(key);
    }
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < this.cacheTTL) return data;
      }
    } catch (e) {}
    return null;
  }

  async setCached(key, data) {
    if (typeof CacheService !== 'undefined') {
      await CacheService.set(key, data, this.cacheTTL);
    } else {
      try {
        localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
      } catch (e) {}
    }
  }

  /**
   * Track search analytics
   */
  trackSearch(query, totalResults, source) {
    this.searchAnalytics.push({ query, totalResults, source, timestamp: Date.now() });
    if (this.searchAnalytics.length > 200) this.searchAnalytics.shift();
  }

  getAnalytics() {
    return {
      totalSearches: this.searchAnalytics.length,
      avgResults: this.searchAnalytics.length > 0
        ? Math.round(this.searchAnalytics.reduce((s, a) => s + a.totalResults, 0) / this.searchAnalytics.length)
        : 0,
      sources: this.searchAnalytics.reduce((acc, a) => { acc[a.source] = (acc[a.source] || 0) + 1; return acc; }, {}),
      recentSearches: this.searchAnalytics.slice(-10)
    };
  }

  // Utilities
  cleanQuery(q) { return (q || '').trim().replace(/\s+/g, ' '); }
  escapeRegex(s) { return (s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  hashString(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return Math.abs(h).toString(36); }
  getApiUrl() { return (typeof APP_CONFIG !== 'undefined') ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : ''; }

  /**
   * Get search filters configuration
   */
  getFilters() {
    return {
      categories: [
        { value: '', label: 'Semua Kategori' },
        { value: 'surat-masuk', label: '📥 Surat Masuk' },
        { value: 'surat-keluar', label: '📤 Surat Keluar' },
        { value: 'disposisi', label: '➡️ Disposisi' },
        { value: 'users', label: '👤 Pengguna' }
      ],
      statuses: [
        { value: '', label: 'Semua Status' },
        { value: 'diterima', label: 'Diterima' },
        { value: 'diproses', label: 'Diproses' },
        { value: 'selesai', label: 'Selesai' },
        { value: 'diarsipkan', label: 'Diarsipkan' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' }
      ],
      sortOptions: [
        { value: 'relevance', label: '🎯 Relevansi' },
        { value: 'date', label: '📅 Tanggal' },
        { value: 'title', label: '🔤 Judul' },
        { value: 'number', label: '🔢 Nomor Surat' }
      ]
    };
  }

  /**
   * Destroy service
   */
  destroy() {
    this.localIndex = {};
    this.searchAnalytics = [];
  }
}

// Singleton instance
const SearchService = new SearchService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SearchService };
}
