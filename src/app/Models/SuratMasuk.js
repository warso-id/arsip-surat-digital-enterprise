// SuratMasuk.js - Surat Masuk Model
class SuratMasuk {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.table = 'surat_masuk';
        this.primaryKey = 'id';
        this.fillable = [
            'no_agenda',
            'tanggal_terima',
            'pengirim',
            'instansi_id',
            'perihal',
            'kategori_id',
            'sifat',
            'status',
            'file_path',
            'created_by',
            'updated_by'
        ];
    }

    async all(page = 1, limit = 10, orderBy = 'tanggal_terima', order = 'DESC') {
        try {
            const payload = this.encode({
                action: 'model_get_all',
                table: this.table,
                page: page,
                limit: limit,
                orderBy: orderBy,
                order: order
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
            console.error('Model delete error:', error);
            return { success: false };
        }
    }

    async where(conditions, page = 1, limit = 10) {
        try {
            const payload = this.encode({
                action: 'model_where',
                table: this.table,
                conditions: conditions,
                page: page,
                limit: limit
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Model where error:', error);
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
    module.exports = SuratMasuk;
}
