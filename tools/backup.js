#!/usr/bin/env node

// ==================== BACKUP SCRIPT ====================
// Arsip Surat Digital Enterprise
// Usage: node tools/backup.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const config = {
    backupDir: path.join(__dirname, '..', 'src', 'storage', 'backup'),
    dbPath: path.join(__dirname, '..', 'src', 'database', 'database.sqlite'),
    storagePath: path.join(__dirname, '..', 'src', 'storage', 'app'),
    keepDays: 30,
};

function backup() {
    console.log('========================================');
    console.log('  ARSIP SURAT DIGITAL - BACKUP');
    console.log('========================================\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}`;
    const backupPath = path.join(config.backupDir, backupName);

    try {
        // Create backup directory
        if (!fs.existsSync(backupPath)) {
            fs.mkdirSync(backupPath, { recursive: true });
        }

        // Backup database
        console.log('📦 Backing up database...');
        if (fs.existsSync(config.dbPath)) {
            fs.copyFileSync(
                config.dbPath,
                path.join(backupPath, 'database.sqlite')
            );
            console.log('   ✅ Database backed up');
        } else {
            console.log('   ⚠️ Database file not found');
        }

        // Backup storage
        console.log('📦 Backing up storage files...');
        if (fs.existsSync(config.storagePath)) {
            execSync(`cp -r "${config.storagePath}" "${backupPath}/storage"`);
            console.log('   ✅ Storage backed up');
        }

        // Create backup info file
        const info = {
            timestamp: new Date().toISOString(),
            version: require('../version.json').version,
            node: process.version,
            platform: process.platform,
        };
        fs.writeFileSync(
            path.join(backupPath, 'backup-info.json'),
            JSON.stringify(info, null, 2)
        );

        // Create ZIP archive
        console.log('📦 Creating ZIP archive...');
        const zipFile = `${backupPath}.zip`;
        execSync(`cd "${config.backupDir}" && zip -r "${zipFile}" "${backupName}"`);
        
        // Remove uncompressed directory
        execSync(`rm -rf "${backupPath}"`);
        
        console.log(`\n✅ Backup completed: ${zipFile}`);
        
        // Clean old backups
        cleanOldBackups();
        
    } catch (error) {
        console.error('❌ Backup failed:', error.message);
        process.exit(1);
    }
}

function cleanOldBackups() {
    console.log('\n🧹 Cleaning old backups...');
    
    const files = fs.readdirSync(config.backupDir);
    const now = Date.now();
    let cleaned = 0;

    files.forEach(file => {
        if (!file.endsWith('.zip')) return;
        
        const filePath = path.join(config.backupDir, file);
        const stats = fs.statSync(filePath);
        const age = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

        if (age > config.keepDays) {
            fs.unlinkSync(filePath);
            cleaned++;
            console.log(`   🗑️ Deleted: ${file} (${Math.round(age)} days old)`);
        }
    });

    if (cleaned === 0) {
        console.log('   No old backups to clean');
    } else {
        console.log(`   ✅ Cleaned ${cleaned} old backup(s)`);
    }
}

function listBackups() {
    console.log('\n📋 Existing backups:');
    
    if (!fs.existsSync(config.backupDir)) {
        console.log('   No backups found');
        return;
    }

    const files = fs.readdirSync(config.backupDir)
        .filter(f => f.endsWith('.zip'))
        .sort()
        .reverse();

    if (files.length === 0) {
        console.log('   No backups found');
        return;
    }

    files.forEach((file, index) => {
        const filePath = path.join(config.backupDir, file);
        const stats = fs.statSync(filePath);
        const size = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`   ${index + 1}. ${file} (${size} MB)`);
    });
}

// Run
const args = process.argv.slice(2);
const command = args[0] || 'backup';

switch (command) {
    case 'backup':
        backup();
        break;
    case 'list':
        listBackups();
        break;
    case 'clean':
        cleanOldBackups();
        break;
    default:
        console.log('Usage: node tools/backup.js [backup|list|clean]');
}

module.exports = { backup, listBackups, cleanOldBackups };
