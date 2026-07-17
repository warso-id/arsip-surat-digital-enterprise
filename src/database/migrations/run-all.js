// run-all.js - Run All Database Migrations
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';

const migrations = [
    '001_create_roles_table',
    '002_create_pengguna_table',
    '003_create_kategori_table',
    '004_create_instansi_table',
    '005_create_surat_masuk_table',
    '006_create_surat_keluar_table',
    '007_create_disposisi_table',
    '008_create_lampiran_table',
    '009_create_notifikasi_table',
    '010_create_log_aktivitas_table',
    '011_create_pengaturan_table'
];

async function runMigrations() {
    console.log('=========================================');
    console.log('  Running Database Migrations...');
    console.log('=========================================\n');

    for (const migration of migrations) {
        try {
            console.log(`Running: ${migration}...`);
            
            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'migration_run',
                migration: migration,
                timestamp: Date.now()
            })));

            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = JSON.parse(decodeURIComponent(atob(result.data)));

            if (data.success) {
                console.log(`  ✓ ${migration} completed`);
            } else {
                console.log(`  ⚠ ${migration} skipped: ${data.message || 'Already exists'}`);
            }

        } catch (error) {
            console.error(`  ✗ ${migration} failed: ${error.message}`);
        }
    }

    console.log('\n=========================================');
    console.log('  Migration Complete!');
    console.log('=========================================');
}

async function rollbackMigrations() {
    console.log('=========================================');
    console.log('  Rolling Back Migrations...');
    console.log('=========================================\n');

    // Rollback in reverse order
    const reversed = [...migrations].reverse();

    for (const migration of reversed) {
        try {
            console.log(`Rolling back: ${migration}...`);
            
            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'migration_rollback',
                migration: migration,
                timestamp: Date.now()
            })));

            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = JSON.parse(decodeURIComponent(atob(result.data)));

            if (data.success) {
                console.log(`  ✓ ${migration} rolled back`);
            } else {
                console.log(`  ⚠ ${migration} skipped`);
            }

        } catch (error) {
            console.error(`  ✗ ${migration} rollback failed: ${error.message}`);
        }
    }

    console.log('\n=========================================');
    console.log('  Rollback Complete!');
    console.log('=========================================');
}

// Check command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'migrate';

if (command === 'rollback') {
    rollbackMigrations().catch(console.error);
} else if (command === 'refresh') {
    rollbackMigrations()
        .then(() => runMigrations())
        .catch(console.error);
} else {
    runMigrations().catch(console.error);
}
