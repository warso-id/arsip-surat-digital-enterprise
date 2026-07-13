/**
 * SEARCH SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Global search, advanced search, and AI-powered smart search
 */

class SearchService {
  constructor() {
    this.searchHistory = [];
    this.maxHistory = 20;
    this.searchTimeout = null;
    this.minQueryLength = 2;
    this.debounceDelay = 300;
  }
  
  /**
   * Initialize search service
   */
  init() {
    this.loadHistory();
    
    // Index data for offline search
    this.buildLocalIndex();
    
    console.log('✅ Search Service initialized');
  }
  
  /**
   * Global search
   */
  async search(query, options = {}) {
    const {
      page = 1,
      limit = 20,
      filters = {},
      useAI = false
    } = options;
    
    if (!query || query.length < this.minQueryLength) {
      return { results: [], total: 0 };
    }
    
    // Save to history
    this.addToHistory(query);
    
    try {
      // Try API search first
      if (navigator.onLine) {
        const endpoint = useAI ? 'ai.smartSearch' : 'search';
        const response = await api.get(endpoint, {
          q: query,
          page,
          limit,
          ...filters
        });
        
        if (response.status === 'success') {
          // Cache results
          await CacheService.set(`search_${query}`, response.data, 300000);
          
          return response.data;
        }
      }
      
      // Fallback to local search
      return this.localSearch(query);
      
    } catch (error) {
      console.warn('Search failed, trying local:', error);
      return this.localSearch(query);
    }
  }
  
  /**
   * Advanced search
   */
  async advancedSearch(params) {
    const {
      query,
      category,
      status,
      startDate,
      endDate,
      sifat,
      pengirim,
      tujuan,
      sortBy,
      sortOrder
    } = params;
    
    try {
      const response = await api.get('search.advanced', {
        q: query,
        category,
        status,
        startDate,
        endDate,
        sifat,
        pengirim,
        tujuan,
        sortBy,
        sortOrder
      });
      
      if (response.status === 'success') {
        return response.data;
      }
      
      return { results: [], total: 0 };
    } catch (error) {
      console.error('Advanced search failed:', error);
      return { results: [], total: 0 };
    }
  }
  
  /**
   * Local search (offline fallback)
   */
  localSearch(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    // Search in cached data
    const caches = ['cache_sm', 'cache_sk', 'cache_disp'];
    
    caches.forEach(cacheKey => {
      const cached = this.getLocalCache(cacheKey);
      if (cached && cached.items) {
        const matches = cached.items.filter(item => {
          const searchable = [
            item.nomorSurat,
            item.nomorAgenda,
            item.perihal,
            item.pengirim,
            item.tujuan,
            item.instruksi,
            item.catatan
          ].filter(Boolean).join(' ').toLowerCase();
          
          return searchable.includes(lowerQuery);
        });
        
        results.push(...matches.map(item => ({
          ...item,
          _type: cacheKey.replace('cache_', ''),
          _score: this.calculateRelevance(item, lowerQuery)
        })));
      }
    });
    
    // Sort by relevance
    results.sort((a, b) => (b._score || 0) - (a._score || 0));
    
    return {
      results: results.slice(0, 20),
      total: results.length,
      source: 'local'
    };
  }
  
  /**
   * Calculate relevance score
   */
  calculateRelevance(item, query) {
    let score = 0;
    const fields = ['nomorSurat', 'nomorAgenda', 'perihal', 'pengirim', 'tujuan'];
    
    fields.forEach(field => {
      const value = (item[field] || '').toLowerCase();
      
      // Exact match
      if (value === query) score += 100;
      
      // Starts with
      if (value.startsWith(query)) score += 50;
      
      // Contains
      if (value.includes(query)) score += 25;
      
      // Word match
      const words = query.split(' ');
      words.forEach(word => {
        if (value.includes(word)) score += 10;
      });
    });
    
    // Recency bonus
    if (item.createdAt) {
      const daysOld = (Date.now() - new Date(item.createdAt).getTime()) / 86400000;
      score += Math.max(0, 30 - daysOld);
    }
    
    return score;
  }
  
  /**
   * Get suggestions
   */
  async getSuggestions(query) {
    if (!query || query.length < 2) return [];
    
    // Get from history
    const historyMatches = this.searchHistory
      .filter(h => h.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
    
    // Get from API
    try {
      const response = await api.get('search', { q: query, suggestions: true });
      if (response.status === 'success' && response.data.suggestions) {
        const apiSuggestions = response.data.suggestions || [];
        return [...new Set([...historyMatches, ...apiSuggestions])].slice(0, 8);
      }
    } catch {}
    
    return historyMatches;
  }
  
  /**
   * Quick search (for navbar)
   */
  async quickSearch(query) {
    if (!query || query.length < 2) return [];
    
    try {
      const response = await api.get('search', {
        q: query,
        limit: 5,
        quick: true
      });
      
      if (response.status === 'success') {
        return response.data.results || [];
      }
    } catch {}
    
    return [];
  }
  
  /**
   * Search by category
   */
  async searchByCategory(category, query, options = {}) {
    const categories = {
      'surat-masuk': 'suratMasuk.list',
      'surat-keluar': 'suratKeluar.list',
      'disposisi': 'disposisi.list',
      'users': 'users.list',
      'files': 'file.list'
    };
    
    const endpoint = categories[category];
    if (!endpoint) return { items: [], total: 0 };
    
    try {
      const response = await api.get(endpoint, {
        search: query,
        ...options
      });
      
      return response.data || { items: [], total: 0 };
    } catch (error) {
      return { items: [], total: 0 };
    }
  }
  
  /**
   * Filter results
   */
  filterResults(results, filters) {
    let filtered = [...results];
    
    if (filters.category) {
      filtered = filtered.filter(r => r._type === filters.category);
    }
    
    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }
    
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(r => new Date(r.createdAt || r.tanggalSurat) >= startDate);
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filtered = filtered.filter(r => new Date(r.createdAt || r.tanggalSurat) <= endDate);
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
      'date': (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      'title': (a, b) => (a.perihal || '').localeCompare(b.perihal || ''),
      'number': (a, b) => (a.nomorSurat || '').localeCompare(b.nomorSurat || '')
    };
    
    const comparator = comparators[sortBy] || comparators.relevance;
    sorted.sort(comparator);
    
    if (sortOrder === 'asc') sorted.reverse();
    
    return sorted;
  }
  
  /**
   * Highlight search terms
   */
  highlightText(text, query) {
    if (!text || !query) return text || '';
    
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }
  
  /**
   * Escape regex special characters
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  /**
   * Build local index for offline search
   */
  async buildLocalIndex() {
    try {
      // Get all cached data
      const cacheKeys = ['sm_list', 'sk_list', 'disp_list', 'users_list'];
      
      for (const key of cacheKeys) {
        const cached = await CacheService.get(key);
        if (cached) {
          this.indexData(key, cached.items || []);
        }
      }
    } catch (error) {
      console.warn('Failed to build local index:', error);
    }
  }
  
  /**
   * Index data locally
   */
  indexData(cacheKey, items) {
    try {
      const indexed = items.map(item => ({
        ...item,
        _indexed: Date.now(),
        _searchText: this.extractSearchText(item)
      }));
      
      localStorage.setItem(`asd_index_${cacheKey}`, JSON.stringify(indexed));
    } catch {}
  }
  
  /**
   * Extract searchable text from item
   */
  extractSearchText(item) {
    const fields = [
      'nomorSurat', 'nomorAgenda', 'perihal', 'pengirim',
      'tujuan', 'instruksi', 'catatan', 'namaLengkap',
      'username', 'email', 'jabatan', 'unitKerja'
    ];
    
    return fields
      .map(f => item[f] || '')
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }
  
  /**
   * Get local cache
   */
  getLocalCache(cacheKey) {
    try {
      const data = localStorage.getItem(`asd_index_${cacheKey}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
  
  /**
   * Add to search history
   */
  addToHistory(query) {
    if (!query || query.length < 2) return;
    
    // Remove duplicate
    this.searchHistory = this.searchHistory.filter(h => h !== query);
    
    // Add to beginning
    this.searchHistory.unshift(query);
    
    // Limit size
    if (this.searchHistory.length > this.maxHistory) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistory);
    }
    
    this.saveHistory();
  }
  
  /**
   * Load search history
   */
  loadHistory() {
    try {
      const data = localStorage.getItem('asd_search_history');
      this.searchHistory = data ? JSON.parse(data) : [];
    } catch {
      this.searchHistory = [];
    }
  }
  
  /**
   * Save search history
   */
  saveHistory() {
    try {
      localStorage.setItem('asd_search_history', JSON.stringify(this.searchHistory));
    } catch {}
  }
  
  /**
   * Clear search history
   */
  clearHistory() {
    this.searchHistory = [];
    localStorage.removeItem('asd_search_history');
  }
  
  /**
   * Get search history
   */
  getHistory() {
    return [...this.searchHistory];
  }
  
  /**
   * Remove from history
   */
  removeFromHistory(query) {
    this.searchHistory = this.searchHistory.filter(h => h !== query);
    this.saveHistory();
  }
  
  /**
   * Get popular searches
   */
  getPopularSearches() {
    const frequency = {};
    this.searchHistory.forEach(query => {
      frequency[query] = (frequency[query] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query]) => query);
  }
  
  /**
   * Debounced search
   */
  debouncedSearch(query, callback, delay = this.debounceDelay) {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(async () => {
      const results = await this.search(query);
      if (callback) callback(results);
    }, delay);
  }
  
  /**
   * Get search filters
   */
  getFilters() {
    return {
      categories: [
        { value: '', label: 'Semua Kategori' },
        { value: 'surat-masuk', label: 'Surat Masuk' },
        { value: 'surat-keluar', label: 'Surat Keluar' },
        { value: 'disposisi', label: 'Disposisi' }
      ],
      statuses: [
        { value: '', label: 'Semua Status' },
        { value: 'diterima', label: 'Diterima' },
        { value: 'diproses', label: 'Diproses' },
        { value: 'selesai', label: 'Selesai' },
        { value: 'diarsipkan', label: 'Diarsipkan' }
      ],
      sortOptions: [
        { value: 'relevance', label: 'Relevansi' },
        { value: 'date', label: 'Tanggal' },
        { value: 'title', label: 'Judul' },
        { value: 'number', label: 'Nomor Surat' }
      ]
    };
  }
}

// Singleton instance
const SearchService = new SearchService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SearchService };
}
