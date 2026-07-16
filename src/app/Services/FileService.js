// ==================== FILE SERVICE ====================
// Arsip Surat Digital Enterprise

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const config = require('../../../config/app');

class FileService {
    constructor() {
        this.storagePath = config.storage.disks.local.root;
        this.publicPath = config.storage.disks.public.root;
        this.maxFileSize = config.storage.maxFileSize;
        this.allowedMimeTypes = config.storage.allowedMimeTypes;
    }

    /**
     * Save uploaded file
     */
    async saveFile(file, subPath = '') {
        try {
            // Validate file
            this.validateFile(file);

            // Generate unique filename
            const uniqueName = this.generateUniqueName(file.originalname);
            
            // Create directory if not exists
            const uploadDir = path.join(this.storagePath, subPath);
            await fs.mkdir(uploadDir, { recursive: true });

            // Save file
            const filePath = path.join(uploadDir, uniqueName);
            await fs.writeFile(filePath, file.buffer);

            // Process image if applicable
            if (this.isImage(file.mimetype)) {
                await this.processImage(filePath);
            }

            return {
                originalName: file.originalname,
                filename: uniqueName,
                path: path.join(subPath, uniqueName).replace(/\\/g, '/'),
                fullPath: filePath,
                size: file.size,
                mimeType: file.mimetype,
                url: `/storage/${subPath}/${uniqueName}`,
            };

        } catch (error) {
            console.error('File save error:', error);
            throw error;
        }
    }

    /**
     * Save multiple files
     */
    async saveFiles(files, subPath = '') {
        const results = [];
        
        for (const file of files) {
            try {
                const result = await this.saveFile(file, subPath);
                results.push(result);
            } catch (error) {
                console.error(`Failed to save file ${file.originalname}:`, error);
                results.push({
                    originalName: file.originalname,
                    error: error.message,
                });
            }
        }

        return results;
    }

    /**
     * Delete file
     */
    async deleteFile(filePath) {
        try {
            const fullPath = path.join(this.storagePath, filePath);
            
            // Check if file exists
            await fs.access(fullPath);
            
            // Delete file
            await fs.unlink(fullPath);
            
            // Delete empty directories
            await this.removeEmptyDirectories(path.dirname(fullPath));
            
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist, consider it deleted
                return true;
            }
            console.error('File delete error:', error);
            throw error;
        }
    }

    /**
     * Delete multiple files
     */
    async deleteFiles(filePaths) {
        const results = [];
        
        for (const filePath of filePaths) {
            try {
                await this.deleteFile(filePath);
                results.push({ path: filePath, success: true });
            } catch (error) {
                results.push({ path: filePath, success: false, error: error.message });
            }
        }

        return results;
    }

    /**
     * Get file info
     */
    async getFileInfo(filePath) {
        try {
            const fullPath = path.join(this.storagePath, filePath);
            const stats = await fs.stat(fullPath);
            
            return {
                path: filePath,
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                isFile: stats.isFile(),
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if file exists
     */
    async fileExists(filePath) {
        try {
            const fullPath = path.join(this.storagePath, filePath);
            await fs.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Copy file
     */
    async copyFile(sourcePath, destPath) {
        const sourceFullPath = path.join(this.storagePath, sourcePath);
        const destFullPath = path.join(this.storagePath, destPath);

        await fs.mkdir(path.dirname(destFullPath), { recursive: true });
        await fs.copyFile(sourceFullPath, destFullPath);

        return destPath;
    }

    /**
     * Move file
     */
    async moveFile(sourcePath, destPath) {
        const newPath = await this.copyFile(sourcePath, destPath);
        await this.deleteFile(sourcePath);
        return newPath;
    }

    /**
     * Get file URL
     */
    getFileUrl(filePath) {
        return `/storage/${filePath.replace(/\\/g, '/')}`;
    }

    /**
     * Get file content as buffer
     */
    async getFileBuffer(filePath) {
        const fullPath = path.join(this.storagePath, filePath);
        return await fs.readFile(fullPath);
    }

    /**
     * Get file as base64
     */
    async getFileBase64(filePath) {
        const buffer = await this.getFileBuffer(filePath);
        return buffer.toString('base64');
    }

    /**
     * Get file as data URL
     */
    async getFileDataUrl(filePath, mimeType = null) {
        const base64 = await this.getFileBase64(filePath);
        const mime = mimeType || this.getMimeType(filePath);
        return `data:${mime};base64,${base64}`;
    }

    /**
     * Validate file
     */
    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            throw new Error(`Ukuran file melebihi batas maksimal ${this.formatSize(this.maxFileSize)}`);
        }

        // Check mime type
        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            throw new Error(`Tipe file ${file.mimetype} tidak diizinkan`);
        }

        return true;
    }

    /**
     * Process and optimize image
     */
    async processImage(filePath) {
        try {
            const image = sharp(filePath);
            const metadata = await image.metadata();

            // Resize if too large
            if (metadata.width > config.storage.image.maxWidth || 
                metadata.height > config.storage.image.maxHeight) {
                
                const resized = await image
                    .resize(
                        config.storage.image.maxWidth,
                        config.storage.image.maxHeight,
                        { fit: 'inside', withoutEnlargement: true }
                    )
                    .jpeg({ quality: config.storage.image.quality })
                    .toBuffer();

                await fs.writeFile(filePath, resized);
            }

            // Generate thumbnail
            const thumbPath = filePath.replace(/(\.[\w\d_-]+)$/i, '_thumb$1');
            await image
                .resize(300, 300, { fit: 'cover' })
                .jpeg({ quality: 70 })
                .toFile(thumbPath);

        } catch (error) {
            console.warn('Image processing warning:', error.message);
        }
    }

    /**
     * Generate unique filename
     */
    generateUniqueName(originalName) {
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const extension = path.extname(originalName);
        const basename = path.basename(originalName, extension)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .substring(0, 50);

        return `${basename}-${timestamp}-${randomString}${extension}`;
    }

    /**
     * Remove empty directories recursively
     */
    async removeEmptyDirectories(dirPath) {
        try {
            const files = await fs.readdir(dirPath);
            
            if (files.length === 0) {
                await fs.rmdir(dirPath);
                // Try to remove parent if it becomes empty
                const parentDir = path.dirname(dirPath);
                if (parentDir !== this.storagePath) {
                    await this.removeEmptyDirectories(parentDir);
                }
            }
        } catch (error) {
            // Ignore errors when removing directories
        }
    }

    /**
     * Get directory size
     */
    async getDirectorySize(dirPath) {
        const fullPath = path.join(this.storagePath, dirPath);
        let totalSize = 0;

        try {
            const files = await fs.readdir(fullPath);
            
            for (const file of files) {
                const filePath = path.join(fullPath, file);
                const stats = await fs.stat(filePath);
                
                if (stats.isFile()) {
                    totalSize += stats.size;
                } else if (stats.isDirectory()) {
                    totalSize += await this.getDirectorySize(path.join(dirPath, file));
                }
            }
        } catch (error) {
            // Directory doesn't exist or no access
        }

        return totalSize;
    }

    /**
     * Get total storage usage
     */
    async getStorageUsage() {
        return await this.getDirectorySize('');
    }

    /**
     * Clean temp files older than specified hours
     */
    async cleanTempFiles(hours = 24) {
        const tempDir = path.join(this.storagePath, 'temp');
        const now = Date.now();
        const maxAge = hours * 60 * 60 * 1000;
        let cleanedCount = 0;

        try {
            const files = await fs.readdir(tempDir);
            
            for (const file of files) {
                const filePath = path.join(tempDir, file);
                const stats = await fs.stat(filePath);
                
                if (now - stats.mtimeMs > maxAge) {
                    await fs.unlink(filePath);
                    cleanedCount++;
                }
            }
        } catch (error) {
            // Temp directory doesn't exist
        }

        return cleanedCount;
    }

    /**
     * Check if file is image
     */
    isImage(mimeType) {
        return mimeType?.startsWith('image/');
    }

    /**
     * Get mime type from extension
     */
    getMimeType(filePath) {
        const extension = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.txt': 'text/plain',
            '.csv': 'text/csv',
        };

        return mimeTypes[extension] || 'application/octet-stream';
    }

    /**
     * Format file size
     */
    formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Create ZIP archive of files
     */
    async createZip(files, zipName = 'archive.zip') {
        const archiver = require('archiver');
        const zipPath = path.join(this.storagePath, 'temp', zipName);
        
        await fs.mkdir(path.dirname(zipPath), { recursive: true });
        
        return new Promise((resolve, reject) => {
            const output = require('fs').createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => resolve(zipPath));
            archive.on('error', reject);

            archive.pipe(output);

            files.forEach(file => {
                const filePath = path.join(this.storagePath, file.path);
                archive.file(filePath, { name: file.originalName || path.basename(file.path) });
            });

            archive.finalize();
        });
    }
}

module.exports = new FileService();
