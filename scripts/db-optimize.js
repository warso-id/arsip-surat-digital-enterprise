#!/usr/bin/env node

// ==================== DATABASE OPTIMIZATION SCRIPT ====================
// Arsip Surat Digital Enterprise
// Optimize dan maintenance database

const path = require('path');
const fs = require('fs');

console.log('');
console.log('╔══════════════════════════════════════════════╗');
console.log('║   DATABASE OPTIMIZATION                      ║');
console.log('║   Arsip Surat Digital Enterprise             ║');
console.log('╚══════════════════════════════════════════════╝');
console.log('');

const dbPath = path.join(__dirname, '..', 'src', 'database', 'database.sqlite');

if (!fs.existsSync(dbPath)) {
    console.log('❌ Database file not found:', dbPath);
    process.exit(1);
}

try {
    const Database = require('better-sqlite3');
    const db = new Database(dbPath);

    // Get database info
    const pageCount = db.pragma('page_count');
    const freelistCount = db.pragma('freelist_count');
    const pageSize = db.pragma('page_size');
    
    const dbSize = fs.statSync(dbPath).size;
    const dbSizeFormatted = (dbSize / 1024 / 1024).toFixed(2) + ' MB';

    console.log('📊 Database Info:');
    console.log(`   Size: ${dbSizeFormatted}`);
    console.log(`   Pages: ${pageCount}`);
    console.log(`   Page Size: ${pageSize} bytes`);
    console.log(`   Free Pages: ${freelistCount}`);
    console.log('');

    // Backup before optimize
    const backupPath = dbPath + '.backup-' + Date.now();
    fs.copyFileSync(dbPath, backupPath);
    console.log('💾 Backup created:', path.basename(backupPath));

    // Run optimizations
    console.log('');
    console.log('🔧 Running optimizations...');

    // VACUUM - Reclaim unused space
    console.log('   1. VACUUM...');
    db.exec('VACUUM');

    // ANALYZE - Update statistics
    console.log('   2. ANALYZE...');
    db.exec('ANALYZE');

    // PRAGMA optimize
    console.log('   3. PRAGMA optimize...');
    db.exec('PRAGMA optimize');

    // Check integrity
    console.log('   4. Integrity check...');
    const integrity = db.pragma('integrity_check');
    console.log(`      Result: ${integrity[0].integrity_check}`);

    // Reindex
    console.log('   5. REINDEX...');
    db.exec('REINDEX');

    // Get new size
    const newSize = fs.statSync(dbPath).size;
    const newSizeFormatted = (newSize / 1024 / 1024).toFixed(2) + ' MB';
    const saved = dbSize - newSize;
    const savedFormatted = saved > 0 ? (saved / 1024 / 1024).toFixed(2) + ' MB' : '0 MB';

    console.log('');
    console.log('✅ Optimization complete!');
    console.log(`   Old Size: ${dbSizeFormatted}`);
    console.log(`   New Size: ${newSizeFormatted}`);
    console.log(`   Saved: ${savedFormatted}`);
    console.log('');
    console.log('💡 Tips:');
    console.log('   - Run this script monthly for best performance');
    console.log('   - Old backup can be deleted: ' + path.basename(backupPath));
    console.log('');

    // Clean old backups
    const dbDir = path.dirname(dbPath);
    const files = fs.readdirSync(dbDir);
    const backups = files.filter(f => f.startsWith('database.sqlite.backup-'));
    
    if (backups.length > 5) {
        const oldBackups = backups.slice(0, backups.length - 5);
        oldBackups.forEach(f => {
            fs.unlinkSync(path.join(dbDir, f));
            console.log(`   🗑️ Deleted old backup: ${f}`);
        });
    }

    db.close();
} catch (error) {
    console.error('❌ Optimization failed:', error.message);
    process.exit(1);
}
