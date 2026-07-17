// Disposisi.js - Disposisi Model
class Disposisi {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.table = 'disposisi';
        this.primaryKey = 'id';
        this.fillable = [
            'surat_masuk_id',
            'dari_user_id',
            'kepada_user_id',
            'instruksi',
            'sifat',
            'status',
            'batas_waktu',
            'catatan'
        ];
    }

    async all(page = 1, limit = 10, filters = {}) {
        try {
            const payload = this.encode({
                action: 'model_get_all',
                table: this.table,
                page: page,
                limit: limit,
                filters: filters,
                orderBy: 'created_at',
                order: 'DESC'
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Model all error:', error);
            return { data: [], total: 0 };
        }
    }

    async find(id) {
        try {
            const payload = this.encode({
                action: 'model_find',
                table: this.table,
                id: id,
                primaryKey: this.primaryKey,
                with: ['surat_masuk', 'dari_user', 'kepada_user']
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Model find error:', error);
            return null;
        }
    }

    async create(data) {
        try {
            const sanitizedData = {};
            this.fillable.forEach(field => {
                if (data[field] !== undefined) {
                    sanitizedData[field] = data[field];
                }
            });

            // Generate nomor disposisi
            sanitizedData.no_disposisi = await this.generateNomorDisposisi();

            const payload = this.encode({
                action: 'model_create',
                table: this.table,
                data: sanitizedData
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Model create error:', error);
            return { success: false, id: null };
        }
    }

    async update(id, data) {
        try {
            const sanitizedData = {};
            this.fillable.forEach(field => {
                if (data[field] !== undefined) {
                    sanitizedData[field] = data[field];
                }
            });

            const payload = this.encode({
                action: 'model_update',
                table: this.table,
                id: id,
                primaryKey: this.primaryKey,
                data: sanitizedData
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Model update error:', error);
            return { success: false };
        }
    }

    async updateStatus(id, status, catatan = '') {
        return this.update(id, {
            status: status,
            catatan: catatan,
            updated_at: new Date().toISOString()
        });
    }

    async getDisposisiMasuk(userId, page = 1, limit = 10) {
        try {
            const payload = this.encode({
                action: 'model_where',
                table: this.table,
                conditions: { kepada_user_id: userId },
                page: page,
                limit: limit,
                orderBy: 'created_at',
                order: 'DESC'
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Disposisi masuk error:', error);
            return { data: [], total: 0 };
        }
    }

    async getDisposisiKeluar(userId, page = 1, limit = 10) {
        try {
            const payload = this.encode({
                action: 'model_where',
                table: this.table,
                conditions: { dari_user_id: userId },
                page: page,
                limit: limit,
                orderBy: 'created_at',
                order: 'DESC'
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Disposisi keluar error:', error);
            return { data: [], total: 0 };
        }
    }

    async getTracking(id) {
        try {
            const payload = this.encode({
                action: 'model_get_tracking',
                table: this.table,
                id: id
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Tracking error:', error);
            return [];
        }
    }

    async generateNomorDisposisi() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        try {
            const payload = this.encode({
                action: 'model_count',
                table: this.table,
                conditions: {
                    created_at: {
                        operator: 'LIKE',
                        value: `${year}-${month}%`
                    }
                }
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);
            const count = (data.count || 0) + 1;
            
            return `DSP/${count.toString().padStart(4, '0')}/${month}/${year}`;

        } catch (error) {
            const random = Math.floor(Math.random() * 9999) + 1;
            return `DSP/${random.toString().padStart(4, '0')}/${month}/${year}`;
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
    module.exports = Disposisi;
}
