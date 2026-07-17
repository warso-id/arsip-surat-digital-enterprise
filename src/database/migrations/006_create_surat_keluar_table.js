// 006_create_surat_keluar_table.js - Migration for surat_keluar table
const migration006 = {
    up: async function() {
        const apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        
        const payload = btoa(encodeURIComponent(JSON.stringify({
            action: 'migration_run',
            migration: '006_create_surat_keluar_table',
            sql: `
                CREATE TABLE IF NOT EXISTS surat_keluar (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    no_surat TEXT UNIQUE NOT NULL,
                    tanggal_surat DATE NOT NULL,
                    tujuan TEXT NOT NULL,
                    instansi_id INTEGER,
                    perihal TEXT NOT NULL,
                    isi_surat TEXT,
                    kategori_id INTEGER,
                    status TEXT DEFAULT 'draft',
                    file_path TEXT,
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
            console.log('Migration 006:', data.success ? 'Success' : 'Failed');
            return data;
        } catch (error) {
            console.error('Migration 006 error:', error);
            return { success: false };
        }
    },

    down: async function() {
        const apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        
        const payload = btoa(encodeURIComponent(JSON.stringify({
            action: 'migration_rollback',
            migration: '006_create_surat_keluar_table',
            sql: 'DROP TABLE IF EXISTS surat_keluar',
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
            console.error('Migration 006 rollback error:', error);
            return { success: false };
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = migration006;
}
