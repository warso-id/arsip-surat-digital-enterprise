#!/usr/bin/env node

// ==================== BACKUP TO GAS SCRIPT ====================
// Arsip Surat Digital Enterprise v2.1.0
// Backup database ke Google Sheets via Google Apps Script

const path = require('path');
const Database = require('better-sqlite3');

// GAS URL (Base64 encoded)
const GAS_URL_BASE64 = 'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J3YmxhdXcyOUN2OHJtcmpRSGhmWGdkbDBjc0JIbHhPM3h2WkppbXlCc1N5QTRGNWY5cUgyNUVqNVFZSXUtLU9HeTZCdwvZXhlYw==';
const GAS_URL = Buffer.from(GAS_URL_BASE64, 'base64').toString('utf-8');

const dbPath = path.join(__dirname, '..', 'src', 'database', 'database.sqlite');

console.log('');
console.log('╔══════════════════════════════════════════════╗');
console.log('║   BACKUP TO GOOGLE SHEETS                    ║');
console.log('║   Arsip Surat Digital Enterprise             ║');
console.log('╚══════════════════════════════════════════════╝');
console.log('');

async function backup() {
    const db = new Database(dbPath);

    try {
        // Get data
        const suratMasuk = db.prepare('SELECT * FROM surat_masuk ORDER BY created_at DESC LIMIT 100').all();
        const suratKeluar = db.prepare('SELECT * FROM surat_keluar ORDER BY created_at DESC LIMIT 100').all();
        const disposisi = db.prepare('SELECT * FROM disposisi ORDER BY created_at DESC LIMIT 100').all();
        const activityLog = db.prepare('SELECT * FROM log_aktivitas ORDER BY created_at DESC LIMIT 200').all();

        console.log(`📊 Data to backup:`);
        console.log(`   Surat Masuk: ${suratMasuk.length} records`);
        console.log(`   Surat Keluar: ${suratKeluar.length} records`);
        console.log(`   Disposisi: ${disposisi.length} records`);
        console.log(`   Activity Log: ${activityLog.length} records`);
        console.log('');

        // Send to GAS
        console.log('📤 Sending to Google Sheets...');

        const payload = Buffer.from(JSON.stringify({
            action: 'backupAll',
            data: {
                suratMasuk,
                suratKeluar,
                disposisi,
                activityLog,
            },
            timestamp: new Date().toISOString(),
            source: 'backup-script',
        })).toString('base64');

        const response = await fetch(`${GAS_URL}?action=backupAll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload }),
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Backup to Google Sheets successful!');
            console.log('   Response:', JSON.stringify(result).substring(0, 150));
        } else {
            console.log(`⚠️  GAS responded with status: ${response.status}`);
        }

    } catch (error) {
        console.error('❌ Backup failed:', error.message);
    } finally {
        db.close();
    }

    console.log('');
}

backup();
