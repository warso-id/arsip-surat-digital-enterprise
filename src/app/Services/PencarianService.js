// PencarianService.js - Search Engine Service
class PencarianService {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
        this.searchHistory = JSON.parse(localStorage.getItem('search_history') || '[]');
    }

    async search(keyword, options = {}) {
        try {
            const payload = this.encode({
                action: 'search_global',
                keyword: keyword,
                options: {
                    type: options.type || 'all',
                    limit: options.limit || 20,
                    page: options.page || 1,
                    sort_by: options.sortBy || 'relevance'
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
            const data = this.decode(result.data);

            if (data.success && keyword) {
                this.saveToHistory(keyword);
            }

            return data;

        } catch (error) {
            console.error('Search error:', error);
            return { success: false, results: [], total: 0 };
        }
    }

    async advancedSearch(criteria) {
        try {
            const payload = this.encode({
                action: 'search_advanced',
                criteria: criteria,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Advanced search error:', error);
            return { success: false, results: [], total: 0 };
        }
    }

    async getSuggestions(keyword) {
        if (!keyword || keyword.length < 2) return [];

        try {
            const payload = this.encode({
                action: 'search_suggestions',
                keyword: keyword,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);

            // Gabungkan dengan history lokal
            const localSuggestions = this.getLocalSuggestions(keyword);
            const allSuggestions = [...(data.suggestions || []), ...localSuggestions];

            return allSuggestions.slice(0, 10);

        } catch (error) {
            console.error('Get suggestions error:', error);
            return this.getLocalSuggestions(keyword);
        }
    }

    getLocalSuggestions(keyword) {
        const lowerKeyword = keyword.toLowerCase();
        return this.searchHistory
            .filter(h => h.keyword.toLowerCase().includes(lowerKeyword))
            .map(h => ({ text: h.keyword, type: 'history' }))
            .slice(0, 5);
    }

    async getPopularSearches() {
        try {
            const payload = this.encode({
                action: 'search_popular',
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Get popular searches error:', error);
            return { success: false, data: [] };
        }
    }

    saveToHistory(keyword) {
        if (!keyword.trim()) return;

        this.searchHistory = this.searchHistory.filter(h => h.keyword !== keyword);
        this.searchHistory.unshift({
            keyword: keyword,
            timestamp: Date.now()
        });

        if (this.searchHistory.length > 50) {
            this.searchHistory = this.searchHistory.slice(0, 50);
        }

        localStorage.setItem('search_history', JSON.stringify(this.searchHistory));
    }

    getSearchHistory(limit = 20) {
        return this.searchHistory.slice(0, limit);
    }

    clearSearchHistory() {
        this.searchHistory = [];
        localStorage.removeItem('search_history');
    }

    async indexDocument(type, id, content) {
        try {
            const payload = this.encode({
                action: 'search_index',
                type: type,
                id: id,
                content: content,
                token: this.token
            });

            await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });
        } catch (error) {
            console.error('Index document error:', error);
        }
    }

    encode(data) {
        return btoa(encodeURIComponent(JSON.stringify(data)));
    }

    decode(encoded) {
        try {
            return JSON.parse(decodeURIComponent(atob(encoded)));
        } catch (error) {
            return {};
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PencarianService;
}
