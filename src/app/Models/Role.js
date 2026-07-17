// Role.js - Role Model
class Role {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.table = 'roles';
        this.primaryKey = 'id';
        this.fillable = ['nama_role', 'kode', 'deskripsi'];
    }

    async all() {
        try {
            const payload = this.encode({
                action: 'model_get_all',
                table: this.table,
                orderBy: 'id',
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
            console.error('Get all roles error:', error);
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
            console.error('Find role error:', error);
            return null;
        }
    }

    async findByKode(kode) {
        try {
            const payload = this.encode({
                action: 'model_find_by',
                table: this.table,
                column: 'kode',
                value: kode
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Find by kode error:', error);
            return null;
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
    module.exports = Role;
}
