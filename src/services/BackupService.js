// ==================== BACKUP SERVICE ====================
// Arsip Surat Digital Enterprise
// Automated backup service

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');
const config = require('../config/app');

class BackupService {
    constructor() {
        this.backupDir = path.join(__dirname, '..', '..', 'storage', 'backup');
        this.dbPath = path.join(__dirname, '..', '..', 'database', 'database.sqlite');
        this.storagePath = path.join(__dirname, '..', '..', 'storage', 'app');
    }

    /**
     * Create full backup
     */
    async createFullBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `full-backup-${timestamp}`;
        const backupPath = path.join(this.backupDir, backupName);
        
        try {
            await fs.mkdir(backupPath, { recursive: true });
            
            // Backup database
            await this.backupDatabase(backupPath);
            
            // Backup storage files
            await this.backupStorage(backupPath);
            
            // Create metadata
            const metadata = {
                timestamp: new Date().toISOString(),
                version: config.app.version,
                type: 'full',
                databaseSize: await this.getFileSize(path.join(backupPath, 'database.sqlite')),
                nodeVersion: process.version,
                platform: process.platform,
            };
            
            await fs.writeFile(
                path.join(backupPath, 'metadata.json'),
                JSON.stringify(metadata, null, 2)
            );
            
            // Create ZIP archive
            const zipFile = await this.createZip(backupPath, backupName);
            
            // Clean up temp directory
            await fs.rm(backupPath, { recursive: true, force: true });
            
            console.log(`Backup created: ${zipFile}`);
            
            // Clean old backups
            await this.cleanOldBackups();
            
            return {
                filename: path.basename(zipFile),
                path: zipFile,
                size: await this.getFileSize(zipFile),
                metadata: metadata,
            };
        } catch (error) {
            console.error('Backup failed:', error);
            throw error;
        }
    }

    /**
     * Create database backup
     */
    async createDatabaseBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `db-backup-${timestamp}`;
        const backupPath = path.join(this.backupDir, backupName);
        
        try {
            await fs.mkdir(backupPath, { recursive: true });
            await this.backupDatabase(backupPath);
            
            const zipFile = await this.createZip(backupPath, backupName);
            await fs.rm(backupPath, { recursive: true, force: true });
            
            return {
                filename: path.basename(zipFile),
                path: zipFile,
            };
        } catch (error) {
            console.error('Database backup failed:', error);
            throw error;
        }
    }

    /**
     * Backup database file
     */
    async backupDatabase(destPath) {
        if (await this.fileExists(this.dbPath)) {
            await fs.copyFile(this.dbPath, path.join(destPath, 'database.sqlite'));
        }
    }

    /**
     * Backup storage files
     */
    async backupStorage(destPath) {
        const storageDest = path.join(destPath, 'storage');
        await this.copyDirectory(this.storagePath, storageDest);
    }

    /**
     * Restore from backup
     */
    async restoreBackup(backupFile) {
        const extractPath = path.join(this.backupDir, 'restore-temp');
        
        try {
            // Create temp directory
            await fs.mkdir(extractPath, { recursive: true });
            
            // Extract ZIP
            await this.extractZip(backupFile, extractPath);
            
            // Restore database
            const dbBackup = path.join(extractPath, 'database.sqlite');
            if (await this.fileExists(dbBackup)) {
                // Backup current database first
                const currentDbBackup = this.dbPath + '.before-restore-' + Date.now();
                if (await this.fileExists(this.dbPath)) {
                    await fs.copyFile(this.dbPath, currentDbBackup);
                }
                await fs.copyFile(dbBackup, this.dbPath);
            }
            
            // Restore storage
            const storageBackup = path.join(extractPath, 'storage');
            if (await this.fileExists(storageBackup)) {
                await this.copyDirectory(storageBackup, this.storagePath);
            }
            
            // Clean up
            await fs.rm(extractPath, { recursive: true, force: true });
            
            return { success: true, message: 'Restore completed successfully' };
        } catch (error) {
            console.error('Restore failed:', error);
            throw error;
        }
    }

    /**
     * List all backups
     */
    async listBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backups = [];
            
            for (const file of files) {
                if (!file.endsWith('.zip')) continue;
                
                const filePath = path.join(this.backupDir, file);
                const stats = await fs.stat(filePath);
                
                backups.push({
                    filename: file,
                    size: stats.size,
                    sizeFormatted: this.formatSize(stats.size),
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime,
                });
            }
            
            return backups.sort((a, b) => b.createdAt - a.createdAt);
        } catch (error) {
            return [];
        }
    }

    /**
     * Delete backup
     */
    async deleteBackup(filename) {
        const filePath = path.join(this.backupDir, filename);
        if (await this.fileExists(filePath)) {
            await fs.unlink(filePath);
            return true;
        }
        return false;
    }

    /**
     * Clean old backups
     */
    async cleanOldBackups(keepCount = 7) {
        const backups = await this.listBackups();
        
        if (backups.length > keepCount) {
            const toDelete = backups.slice(keepCount);
            
            for (const backup of toDelete) {
                await this.deleteBackup(backup.filename);
                console.log(`Deleted old backup: ${backup.filename}`);
            }
        }
    }

    /**
     * Create ZIP archive
     */
    createZip(sourcePath, zipName) {
        return new Promise((resolve, reject) => {
            const output = require('fs').createWriteStream(sourcePath + '.zip');
            const archive = archiver('zip', { zlib: { level: 9 } });
            
            output.on('close', () => resolve(sourcePath + '.zip'));
            archive.on('error', reject);
            
            archive.pipe(output);
            archive.directory(sourcePath, zipName);
            archive.finalize();
        });
    }

    /**
     * Extract ZIP archive
     */
    extractZip(zipPath, destPath) {
        return new Promise((resolve, reject) => {
            execSync(`unzip -o "${zipPath}" -d "${destPath}"`);
            resolve();
        });
    }

    /**
     * Copy directory recursively
     */
    async copyDirectory(src, dest) {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    }

    /**
     * Check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get file size
     */
    async getFileSize(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return stats.size;
        } catch {
            return 0;
        }
    }

    /**
     * Format file size
     */
    formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = new BackupService();
