// 007_create_disposisi_table.js - Migration for disposisi table
const migration007 = {
    up: async function() {
        const apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        
        const payload = btoa(encodeURIComponent(JSON.stringify({
            action: 'migration_run',
            migration: '007_create_disposisi_table',
            sql: `
                CREATE TABLE IF NOT EXISTS disposisi (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    no_disposisi TEXT UNIQUE NOT NULL,
                    surat_masuk_id INTEGER NOT NULL,
                    dari_user_id INTEGER NOT NULL,
                    kepada_user_id INTEGER NOT NULL,
                    instruksi TEXT NOT NULL,
                    sifat TEXT DEFAULT 'biasa',
                    status TEXT DEFAULT 'pending',
                    batas_waktu DATE,
                    catatan TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (surat_masuk_id) REFERENCES surat_masuk(id),
                    FOREIGN KEY (dari_user_id) REFERENCES pengguna(id),
                    FOREIGN KEY (kepada_user_id) REFERENCES pengguna(id)
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
            
            console.log('Migration 007:', data.success ? 'Success' : 'Failed');
            return data;
        } catch (error) {
            console.error('Migration 007 error:', error);
            return { success: false };
        }
    },

    down: async function() {
        const apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        
        const payload = btoa(encodeURIComponent(JSON.stringify({
            action: 'migration_rollback',
            migration: '007_create_disposisi_table',
            sql: 'DROP TABLE IF EXISTS disposisi',
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
            console.error('Migration 007 rollback error:', error);
            return { success: false };
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = migration007;
}
