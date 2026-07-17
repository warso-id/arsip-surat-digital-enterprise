// Pengguna.js - Pengguna Model
class Pengguna {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.table = 'pengguna';
        this.primaryKey = 'id';
        this.fillable = ['nama', 'email', 'password', 'role_id', 'instansi_id', 'jabatan', 'telepon', 'status'];
        this.hidden = ['password'];
    }

    async all(page = 1, limit = 10, filters = {}) {
        try {
            const payload = this.encode({
                action: 'model_get_all',
                table: this.table,
                page: page,
                limit: limit,
                filters: filters,
                orderBy: 'nama',
                order: 'ASC'
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);
            
            // Remove hidden fields
            if (data.data) {
                data.data = data.data.map(user => this.removeHidden(user));
            }

            return data;

        } catch (error) {
            console.error('Get all pengguna error:', error);
            return { data: [], total: 0 };
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
            const data = this.decode(result.data);
            
            return this.removeHidden(data);

        } catch (error) {
            console.error('Find pengguna error:', error);
            return null;
        }
    }

    async findByEmail(email) {
        try {
            const payload = this.encode({
                action: 'model_find_by',
                table: this.table,
                column: 'email',
                value: email
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Find by email error:', error);
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

            // Hash password
            if (sanitizedData.password) {
                sanitizedData.password = this.hashPassword(sanitizedData.password);
            }

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
            console.error('Create pengguna error:', error);
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

            // Hash password if provided
            if (sanitizedData.password) {
                sanitizedData.password = this.hashPassword(sanitizedData.password);
            }

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
            console.error('Update pengguna error:', error);
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
            console.error('Delete pengguna error:', error);
            return { success: false };
        }
    }

    async updateProfile(id, data) {
        const allowedFields = ['nama', 'email', 'jabatan', 'telepon', 'avatar'];
        const profileData = {};
        
        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                profileData[field] = data[field];
            }
        });

        return this.update(id, profileData);
    }

    async changePassword(id, oldPassword, newPassword) {
        try {
            const payload = this.encode({
                action: 'pengguna_change_password',
                user_id: id,
                old_password: this.hashPassword(oldPassword),
                new_password: this.hashPassword(newPassword)
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Change password error:', error);
            return { success: false };
        }
    }

    hashPassword(password) {
        let hashed = password;
        for (let i = 0; i < 5; i++) {
            hashed = btoa(hashed + 'enterprise_salt_2026');
        }
        return hashed;
    }

    removeHidden(user) {
        if (!user) return user;
        const cleanUser = { ...user };
        this.hidden.forEach(field => {
            delete cleanUser[field];
        });
        return cleanUser;
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
    module.exports = Pengguna;
}
