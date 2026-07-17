// Instansi.js - Instansi Model
class Instansi {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.table = 'instansi';
        this.primaryKey = 'id';
        this.fillable = ['nama_instansi', 'alamat', 'telepon', 'email', 'kode_instansi'];
    }

    async all(page = 1, limit = 50) {
        try {
            const payload = this.encode({
                action: 'model_get_all',
                table: this.table,
                page: page,
                limit: limit,
                orderBy: 'nama_instansi',
                order: 'ASC'
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Get all instansi error:', error);
            return [];
        }
    }

    async find(id) {
        try {
            const payload = this.encode({
                action: 'model_find',
                table: this.table,
                id: id,
                primaryKey: this.primaryKey
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Find instansi error:', error);
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
            console.error('Create instansi error:', error);
            return { success: false };
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
            console.error('Update instansi error:', error);
            return { success: false };
        }
    }

    async delete(id) {
        try {
            const payload = this.encode({
                action: 'model_delete',
                table: this.table,
                id: id,
                primaryKey: this.primaryKey
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Delete instansi error:', error);
            return { success: false };
        }
    }

    async search(keyword) {
        try {
            const payload = this.encode({
                action: 'model_search',
                table: this.table,
                keyword: keyword,
                searchFields: ['nama_instansi', 'kode_instansi', 'email']
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Search instansi error:', error);
            return [];
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
    module.exports = Instansi;
}
