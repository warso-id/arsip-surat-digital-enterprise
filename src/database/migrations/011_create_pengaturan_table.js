// 011_create_pengaturan_table.js - Migration for pengaturan table
const migration011 = {
    up: async function() {
        const apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        
        const payload = btoa(encodeURIComponent(JSON.stringify({
            action: 'migration_run',
            migration: '011_create_pengaturan_table',
            sql: `
                CREATE TABLE IF NOT EXISTS pengaturan (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    kunci TEXT UNIQUE NOT NULL,
                    nilai TEXT,
                    deskripsi TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
            console.log('Migration 011:', data.success ? 'Success' : 'Failed');
            return data;
        } catch (error) {
            console.error('Migration 011 error:', error);
            return { success: false };
        }
    },

    down: async function() {
        const apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        
        const payload = btoa(encodeURIComponent(JSON.stringify({
            action: 'migration_rollback',
            migration: '011_create_pengaturan_table',
            sql: 'DROP TABLE IF EXISTS pengaturan',
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
            console.error('Migration 011 rollback error:', error);
            return { success: false };
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = migration011;
}
