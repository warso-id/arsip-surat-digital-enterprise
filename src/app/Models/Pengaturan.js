// Pengaturan.js - Pengaturan Model
class Pengaturan {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.table = 'pengaturan';
        this.primaryKey = 'id';
        this.fillable = ['kunci', 'nilai', 'deskripsi'];
        this.cache = {};
    }

    async getAll() {
        try {
            const payload = this.encode({
                action: 'model_get_all',
                table: this.table,
                orderBy: 'kunci',
                order: 'ASC'
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);
            
            // Convert to key-value object
            const settings = {};
            if (data && data.length > 0) {
                data.forEach(item => {
                    settings[item.kunci] = item.nilai;
                });
            }
            
            this.cache = settings;
            return settings;

        } catch (error) {
            console.error('Get all pengaturan error:', error);
            return {};
        }
    }

    async get(key, defaultValue = null) {
        // Check cache first
        if (this.cache[key] !== undefined) {
            return this.cache[key];
        }

        try {
            const payload = this.encode({
                action: 'model_find_by',
                table: this.table,
                column: 'kunci',
                value: key
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);
            
            const value = data?.nilai || defaultValue;
            this.cache[key] = value;
            
            return value;

        } catch (error) {
            console.error('Get pengaturan error:', error);
            return defaultValue;
        }
    }

    async set(key, value, deskripsi = '') {
        try {
            // Check if exists
            const existing = await this.get(key);
            
            if (existing !== null && existing !== undefined) {
                // Update
                const findPayload = this.encode({
                    action: 'model_find_by',
                    table: this.table,
                    column: 'kunci',
                    value: key
                });

                const findResponse = await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: findPayload })
                });

                const findResult = await findResponse.json();
                const findData = this.decode(findResult.data);

                if (findData?.id) {
                    const payload = this.encode({
                        action: 'model_update',
                        table: this.table,
                        id: findData.id,
                        primaryKey: this.primaryKey,
                        data: { nilai: value, deskripsi: deskripsi }
                    });

                    const response = await fetch(this.apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ data: payload })
                    });

                    const result = await response.json();
                    this.cache[key] = value;
                    return this.decode(result.data);
                }
            }

            // Create new
            const payload = this.encode({
                action: 'model_create',
                table: this.table,
                data: { kunci: key, nilai: value, deskripsi: deskripsi }
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            this.cache[key] = value;
            return this.decode(result.data);

        } catch (error) {
            console.error('Set pengaturan error:', error);
            return { success: false };
        }
    }

    async getMultiple(keys) {
        const result = {};
        for (const key of keys) {
            result[key] = await this.get(key);
        }
        return result;
    }

    async setMultiple(settings) {
        const results = [];
        for (const [key, value] of Object.entries(settings)) {
            const result = await this.set(key, value);
            results.push(result);
        }
        return results;
    }

    clearCache() {
        this.cache = {};
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
    module.exports = Pengaturan;
}
