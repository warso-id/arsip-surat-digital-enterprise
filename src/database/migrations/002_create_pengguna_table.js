// 002_create_pengguna_table.js - Migration for pengguna table
const migration002 = {
    up: async function() {
        const apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        
        const payload = btoa(encodeURIComponent(JSON.stringify({
            action: 'migration_run',
            migration: '002_create_pengguna_table',
            sql: `
                CREATE TABLE IF NOT EXISTS pengguna (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nama TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role_id INTEGER DEFAULT 4,
                    instansi_id INTEGER,
                    jabatan TEXT,
                    telepon TEXT,
                    avatar TEXT,
                    status TEXT DEFAULT 'aktif',
                    remember_token TEXT,
                    last_login DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_by INTEGER,
                    updated_by INTEGER,
                    FOREIGN KEY (role_id) REFERENCES roles(id),
                    FOREIGN KEY (instansi_id) REFERENCES instansi(id)
                )
            `,
            timestamp: Date.now()
        })));

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = JSON.parse(decodeURIComponent(atob(result.data)));
            
            console.log('Migration 002:', data.success ? 'Success' : 'Failed');
            return data;
        } catch (error) {
            console.error('Migration 002 error:', error);
            return { success: false };
        }
    },

    down: async function() {
        const apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        
        const payload = btoa(encodeURIComponent(JSON.stringify({
            action: 'migration_rollback',
            migration: '002_create_pengguna_table',
            sql: 'DROP TABLE IF EXISTS pengguna',
            timestamp: Date.now()
        })));

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = JSON.parse(decodeURIComponent(atob(result.data)));
            
            return data;
        } catch (error) {
            console.error('Migration 002 rollback error:', error);
            return { success: false };
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = migration002;
}
