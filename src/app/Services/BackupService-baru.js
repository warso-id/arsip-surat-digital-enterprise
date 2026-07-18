const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const archiver = require('archiver');
const { sequelize } = require('../../config/database');
const storageConfig = require('../../config/storage');

class BackupService {
    /**
     * Create database backup
     */
    static async backupDatabase() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = storageConfig.paths.backups;
        const backupFile = path.join(backupDir, `database-${timestamp}.sql.gz`);

        try {
            await fs.mkdir(backupDir, { recursive: true });

            const dbConfig = sequelize.config;
            const command = `mysqldump -h ${dbConfig.host} -u ${dbConfig.username} -p${dbConfig.password} ${dbConfig.database} | gzip > ${backupFile}`;

            return new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error('Backup error:', stderr);
                        reject(error);
                        return;
                    }
                    resolve(backupFile);
                });
            });
        } catch (error) {
            console.error('Database backup failed:', error);
            throw error;
        }
    }

    /**
     * Create files backup
     */
    static async backupFiles() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = storageConfig.paths.backups;
        const backupFile = path.join(backupDir, `files-${timestamp}.tar.gz`);

        try {
            await fs.mkdir(backupDir, { recursive: true });

            const output = require('fs').createWriteStream(backupFile);
            const archive = archiver('tar', { gzip: true });

            return new Promise((resolve, reject) => {
                output.on('close', () => resolve(backupFile));
                archive.on('error', reject);

                archive.pipe(output);
                archive.directory(storageConfig.paths.uploads, 'uploads');
                archive.file('.env', { name: '.env' });
                archive.directory('src/config', 'config');
                archive.finalize();
            });
        } catch (error) {
            console.error('Files backup failed:', error);
            throw error;
        }
    }

    /**
     * Create full backup
     */
    static async createFullBackup() {
        try {
            console.log('Starting full backup...');
            
            const dbBackup = await this.backupDatabase();
            console.log('Database backup completed:', dbBackup);
            
            const filesBackup = await this.backupFiles();
            console.log('Files backup completed:', filesBackup);
            
            // Combine into single archive
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = storageConfig.paths.backups;
            const fullBackup = path.join(backupDir, `full-backup-${timestamp}.tar.gz`);
            
            const output = require('fs').createWriteStream(fullBackup);
            const archive = archiver('tar', { gzip: true });

            return new Promise((resolve, reject) => {
                output.on('close', () => {
                    // Clean up individual backups
                    fs.unlink(dbBackup).catch(console.error);
                    fs.unlink(filesBackup).catch(console.error);
                    resolve(fullBackup);
                });
                
                archive.on('error', reject);
                archive.pipe(output);
                archive.file(dbBackup, { name: path.basename(dbBackup) });
                archive.file(filesBackup, { name: path.basename(filesBackup) });
                archive.finalize();
            });
        } catch (error) {
            console.error('Full backup failed:', error);
            throw error;
        }
    }

    /**
     * Restore database from backup
     */
    static async restoreDatabase(backupFile) {
        try {
            const dbConfig = sequelize.config;
            const command = `gunzip < ${backupFile} | mysql -h ${dbConfig.host} -u ${dbConfig.username} -p${dbConfig.password} ${dbConfig.database}`;

            return new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error('Restore error:', stderr);
                        reject(error);
                        return;
                    }
                    resolve(true);
                });
            });
        } catch (error) {
            console.error('Database restore failed:', error);
            throw error;
        }
    }

    /**
     * Clean old backups
     */
    static async cleanOldBackups(retentionDays = 30) {
        try {
            const backupDir = storageConfig.paths.backups;
            const files = await fs.readdir(backupDir);
            const now = Date.now();
            const maxAge = retentionDays * 24 * 60 * 60 * 1000;

            let cleanedCount = 0;
            for (const file of files) {
                const filePath = path.join(backupDir, file);
                const stats = await fs.stat(filePath);
                
                if (now - stats.mtime.getTime() > maxAge) {
                    await fs.unlink(filePath);
                    cleanedCount++;
                    console.log(`Deleted old backup: ${file}`);
                }
            }

            console.log(`Cleaned ${cleanedCount} old backup(s)`);
            return cleanedCount;
        } catch (error) {
            console.error('Clean old backups failed:', error);
            throw error;
        }
    }

    /**
     * List backups
     */
    static async listBackups() {
        try {
            const backupDir = storageConfig.paths.backups;
            const files = await fs.readdir(backupDir);
            
            const backups = [];
            for (const file of files) {
                const filePath = path.join(backupDir, file);
                const stats = await fs.stat(filePath);
                
                backups.push({
                    name: file,
                    path: filePath,
                    size: stats.size,
                    sizeFormatted: this.formatSize(stats.size),
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime
                });
            }

            // Sort by date descending
            backups.sort((a, b) => b.modifiedAt - a.modifiedAt);
            
            return backups;
        } catch (error) {
            console.error('List backups failed:', error);
            throw error;
        }
    }

    /**
     * Format file size
     */
    static formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = BackupService;
