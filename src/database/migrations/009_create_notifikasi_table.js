// 009_create_notifikasi_table.js - Migration for notifikasi table
const migration009 = {
    up: async function() {
        const apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        
        const payload = btoa(encodeURIComponent(JSON.stringify({
            action: 'migration_run',
            migration: '009_create_notifikasi_table',
            sql: `
                CREATE TABLE IF NOT EXISTS notifikasi (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    tipe TEXT NOT NULL,
                    judul TEXT NOT NULL,
                    pesan TEXT,
                    is_read INTEGER DEFAULT 0,
                    link TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES pengguna(id)
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
            
            console.log('Migration 009:', data.success ? 'Success' : 'Failed');
            return data;
        } catch (error) {
            console.error('Migration 009 error:', error);
            return { success: false };
        }
    },

    down: async function() {
        const apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        
        const payload = btoa(encodeURIComponent(JSON.stringify({
            action: 'migration_rollback',
            migration: '009_create_notifikasi_table',
            sql: 'DROP TABLE IF EXISTS notifikasi',
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
            console.error('Migration 009 rollback error:', error);
            return { success: false };
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = migration009;
}
