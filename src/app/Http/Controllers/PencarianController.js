// PencarianController.js - Advanced Search Controller
class PencarianController {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
        this.searchHistory = JSON.parse(localStorage.getItem('search_history') || '[]');
        this.maxHistory = 20;
    }

    async globalSearch(keyword, options = {}) {
        try {
            const payload = this.encodeData({
                action: 'pencarian_global',
                keyword: keyword,
                options: options,
                token: this.token,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decodeData(result.data);

            if (data.success) {
                this.saveSearchHistory(keyword);
            }

            return data;

        } catch (error) {
            console.error('Global search error:', error);
            return { success: false, results: [], total: 0 };
        }
    }

    async advancedSearch(criteria) {
        try {
            const payload = this.encodeData({
                action: 'pencarian_advanced',
                criteria: {
                    keyword: criteria.keyword || '',
                    type: criteria.type || 'all', // surat_masuk, surat_keluar, disposisi
                    tanggal_dari: criteria.tanggal_dari || '',
                    tanggal_sampai: criteria.tanggal_sampai || '',
                    kategori: criteria.kategori || '',
                    status: criteria.status || '',
                    pengirim: criteria.pengirim || '',
                    penerima: criteria.penerima || '',
                    instansi: criteria.instansi || '',
                    sifat: criteria.sifat || ''
                },
                token: this.token,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decodeData(result.data);

            if (data.success && criteria.keyword) {
                this.saveSearchHistory(criteria.keyword);
            }

            return data;

        } catch (error) {
            console.error('Advanced search error:', error);
            return { success: false, results: [], total: 0 };
        }
    }

    async searchByDateRange(type, startDate, endDate) {
        try {
            const payload = this.encodeData({
                action: 'pencarian_date_range',
                type: type,
                start_date: startDate,
                end_date: endDate,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Date range search error:', error);
            return { success: false, results: [] };
        }
    }

    async searchByInstansi(instansiId, type = 'all') {
        try {
            const payload = this.encodeData({
                action: 'pencarian_instansi',
                instansi_id: instansiId,
                type: type,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Instansi search error:', error);
            return { success: false, results: [] };
        }
    }

    async searchDisposisiByUser(userId) {
        try {
            const payload = this.encodeData({
                action: 'pencarian_disposisi_user',
                user_id: userId,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Disposisi user search error:', error);
            return { success: false, results: [] };
        }
    }

    getSearchHistory() {
        return this.searchHistory.slice(0, this.maxHistory);
    }

    saveSearchHistory(keyword) {
        if (!keyword || keyword.trim() === '') return;
        
        // Remove duplicate
        this.searchHistory = this.searchHistory.filter(h => h.keyword !== keyword);
        
        // Add to front
        this.searchHistory.unshift({
            keyword: keyword,
            timestamp: Date.now()
        });
        
        // Limit history
        if (this.searchHistory.length > this.maxHistory) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistory);
        }
        
        localStorage.setItem('search_history', JSON.stringify(this.searchHistory));
    }

    clearSearchHistory() {
        this.searchHistory = [];
        localStorage.removeItem('search_history');
    }

    getSearchSuggestions(keyword) {
        if (!keyword || keyword.length < 2) return [];
        
        const suggestions = [];
        const lowerKeyword = keyword.toLowerCase();
        
        // Search in history
        this.searchHistory.forEach(h => {
            if (h.keyword.toLowerCase().includes(lowerKeyword)) {
                suggestions.push({
                    text: h.keyword,
                    type: 'history',
                    timestamp: h.timestamp
                });
            }
        });
        
        return suggestions.slice(0, 5);
    }

    async getPopularSearches() {
        try {
            const payload = this.encodeData({
                action: 'pencarian_popular',
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Popular searches error:', error);
            return { success: false, data: [] };
        }
    }

    async getQuickSearchResults(keyword) {
        if (!keyword || keyword.length < 2) return [];
        
        try {
            const payload = this.encodeData({
                action: 'pencarian_quick',
                keyword: keyword,
                limit: 5,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Quick search error:', error);
            return { success: false, results: [] };
        }
    }

    encodeData(data) {
        return btoa(encodeURIComponent(JSON.stringify(data)));
    }

    decodeData(encoded) {
        try {
            return JSON.parse(decodeURIComponent(atob(encoded)));
        } catch (error) {
            return {};
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PencarianController;
}
