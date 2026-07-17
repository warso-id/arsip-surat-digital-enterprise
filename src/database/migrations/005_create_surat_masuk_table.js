// 005_create_surat_masuk_table.js - Migration for surat_masuk table
const migration005 = {
    up: async function() {
        const apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        
        const payload = btoa(encodeURIComponent(JSON.stringify({
            action: 'migration_run',
            migration: '005_create_surat_masuk_table',
            sql: `
                CREATE TABLE IF NOT EXISTS surat_masuk (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    no_agenda TEXT UNIQUE NOT NULL,
                    tanggal_terima DATE NOT NULL,
                    pengirim TEXT NOT NULL,
                    instansi_id INTEGER,
                    perihal TEXT NOT NULL,
                    kategori_id INTEGER,
                    sifat TEXT DEFAULT 'biasa',
                    status TEXT DEFAULT 'baru',
                    file_path TEXT,
                    catatan TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_by INTEGER,
                    updated_by INTEGER,
                    FOREIGN KEY (instansi_id) REFERENCES instansi(id),
                    FOREIGN KEY (kategori_id) REFERENCES kategori(id)
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
            
            console.log('Migration 005:', data.success ? 'Success' : 'Failed');
            return data;
        } catch (error) {
            console.error('Migration 005 error:', error);
            return { success: false };
        }
    },

    down: async function() {
        const apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        
        const payload = btoa(encodeURIComponent(JSON.stringify({
            action: 'migration_rollback',
            migration: '005_create_surat_masuk_table',
            sql: 'DROP TABLE IF EXISTS surat_masuk',
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
            console.error('Migration 005 rollback error:', error);
            return { success: false };
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = migration005;
}
