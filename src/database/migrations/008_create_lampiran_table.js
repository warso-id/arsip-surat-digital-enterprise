// 008_create_lampiran_table.js - Migration for lampiran table
const migration008 = {
    up: async function() {
        const apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        
        const payload = btoa(encodeURIComponent(JSON.stringify({
            action: 'migration_run',
            migration: '008_create_lampiran_table',
            sql: `
                CREATE TABLE IF NOT EXISTS lampiran (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    surat_type TEXT NOT NULL,
                    surat_id INTEGER NOT NULL,
                    nama_file TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    tipe_file TEXT,
                    ukuran INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
            console.log('Migration 008:', data.success ? 'Success' : 'Failed');
            return data;
        } catch (error) {
            console.error('Migration 008 error:', error);
            return { success: false };
        }
    },

    down: async function() {
        const apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        
        const payload = btoa(encodeURIComponent(JSON.stringify({
            action: 'migration_rollback',
            migration: '008_create_lampiran_table',
            sql: 'DROP TABLE IF EXISTS lampiran',
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
            console.error('Migration 008 rollback error:', error);
            return { success: false };
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = migration008;
}
