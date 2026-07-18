const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const storageConfig = require('../../config/storage');

class FileService {
    /**
     * Upload file
     */
    static async upload(file, options = {}) {
        const {
            folder = 'uploads',
            allowedTypes = storageConfig.file.allowedMimeTypes,
            maxSize = storageConfig.file.maxSize,
            generateThumbnail = false,
            thumbnailWidth = 200,
            thumbnailHeight = 200
        } = options;

        // Validate file
        this.validateFile(file, allowedTypes, maxSize);

        // Generate unique filename
        const extension = path.extname(file.originalname);
        const filename = uuidv4() + extension;
        const uploadDir = path.join(storageConfig.paths.uploads, folder);
        const filePath = path.join(uploadDir, filename);

        // Create directory if not exists
        await fs.mkdir(uploadDir, { recursive: true });

        // Save file
        await fs.writeFile(filePath, file.buffer);

        const result = {
            filename,
            originalName: file.originalname,
            path: filePath,
            relativePath: path.join(folder, filename),
            size: file.size,
            mimeType: file.mimetype,
            extension
        };

        // Generate thumbnail for images
        if (generateThumbnail && file.mimetype.startsWith('image/')) {
            result.thumbnail = await this.generateThumbnail(
                filePath,
                path.join(uploadDir, 'thumbnails'),
                thumbnailWidth,
                thumbnailHeight
            );
        }

        return result;
    }

    /**
     * Upload multiple files
     */
    static async uploadMultiple(files, options = {}) {
        const results = [];
        const errors = [];

        for (const file of files) {
            try {
                const result = await this.upload(file, options);
                results.push(result);
            } catch (error) {
                errors.push({
                    filename: file.originalname,
                    error: error.message
                });
            }
        }

        return { results, errors };
    }

    /**
     * Validate file
     */
    static validateFile(file, allowedTypes, maxSize) {
        if (!file) {
            throw new Error('File tidak ditemukan');
        }

        if (!allowedTypes.includes(file.mimetype)) {
            throw new Error(`Tipe file ${file.mimetype} tidak diizinkan`);
        }

        if (file.size > maxSize) {
            const maxSizeMB = maxSize / (1024 * 1024);
            throw new Error(`Ukuran file melebihi batas maksimal ${maxSizeMB}MB`);
        }
    }

    /**
     * Generate thumbnail
     */
    static async generateThumbnail(filePath, thumbnailDir, width = 200, height = 200) {
        try {
            await fs.mkdir(thumbnailDir, { recursive: true });

            const filename = 'thumb_' + path.basename(filePath);
            const thumbnailPath = path.join(thumbnailDir, filename);

            await sharp(filePath)
                .resize(width, height, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: 80 })
                .toFile(thumbnailPath);

            return {
                filename,
                path: thumbnailPath,
                relativePath: path.relative(storageConfig.paths.uploads, thumbnailPath)
            };
        } catch (error) {
            console.error('Error generating thumbnail:', error);
            return null;
        }
    }

    /**
     * Delete file
     */
    static async delete(filePath) {
        try {
            const fullPath = path.join(storageConfig.paths.uploads, filePath);
            await fs.unlink(fullPath);
            
            // Also delete thumbnail if exists
            const dir = path.dirname(fullPath);
            const thumbPath = path.join(dir, 'thumbnails', 'thumb_' + path.basename(filePath));
            try {
                await fs.unlink(thumbPath);
            } catch (error) {
                // Thumbnail might not exist, ignore error
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    /**
     * Delete multiple files
     */
    static async deleteMultiple(filePaths) {
        const results = [];
        for (const filePath of filePaths) {
            results.push(await this.delete(filePath));
        }
        return results;
    }

    /**
     * Move file
     */
    static async move(sourcePath, destinationPath) {
        try {
            const source = path.join(storageConfig.paths.uploads, sourcePath);
            const destination = path.join(storageConfig.paths.uploads, destinationPath);
            
            await fs.mkdir(path.dirname(destination), { recursive: true });
            await fs.rename(source, destination);
            
            return destinationPath;
        } catch (error) {
            console.error('Error moving file:', error);
            throw error;
        }
    }

    /**
     * Copy file
     */
    static async copy(sourcePath, destinationPath) {
        try {
            const source = path.join(storageConfig.paths.uploads, sourcePath);
            const destination = path.join(storageConfig.paths.uploads, destinationPath);
            
            await fs.mkdir(path.dirname(destination), { recursive: true });
            await fs.copyFile(source, destination);
            
            return destinationPath;
        } catch (error) {
            console.error('Error copying file:', error);
            throw error;
        }
    }

    /**
     * Get file info
     */
    static async getInfo(filePath) {
        try {
            const fullPath = path.join(storageConfig.paths.uploads, filePath);
            const stats = await fs.stat(fullPath);
            
            return {
                filename: path.basename(filePath),
                path: filePath,
                fullPath,
                size: stats.size,
                sizeFormatted: this.formatSize(stats.size),
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                extension: path.extname(filePath),
                mimeType: this.getMimeType(path.extname(filePath))
            };
        } catch (error) {
            console.error('Error getting file info:', error);
            return null;
        }
    }

    /**
     * Check if file exists
     */
    static async exists(filePath) {
        try {
            const fullPath = path.join(storageConfig.paths.uploads, filePath);
            await fs.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get file URL
     */
    static getUrl(filePath) {
        if (!filePath) return null;
        return `/uploads/${filePath.replace(/\\/g, '/')}`;
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

    /**
     * Get MIME type from extension
     */
    static getMimeType(extension) {
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
            '.svg': 'image/svg+xml'
        };
        return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
    }

    /**
     * Clean temporary files
     */
    static async cleanTempFiles(maxAge = 24 * 60 * 60 * 1000) {
        try {
            const tempDir = storageConfig.paths.temp;
            const files = await fs.readdir(tempDir);
            const now = Date.now();
            let cleanedCount = 0;

            for (const file of files) {
                const filePath = path.join(tempDir, file);
                const stats = await fs.stat(filePath);
                
                if (now - stats.mtime.getTime() > maxAge) {
                    await fs.unlink(filePath);
                    cleanedCount++;
                }
            }

            return cleanedCount;
        } catch (error) {
            console.error('Error cleaning temp files:', error);
            return 0;
        }
    }

    /**
     * Get disk usage
     */
    static async getDiskUsage(directory = null) {
        try {
            const dir = directory || storageConfig.paths.uploads;
            let totalSize = 0;
            
            const calculateSize = async (dirPath) => {
                const files = await fs.readdir(dirPath);
                
                for (const file of files) {
                    const filePath = path.join(dirPath, file);
                    const stats = await fs.stat(filePath);
                    
                    if (stats.isDirectory()) {
                        await calculateSize(filePath);
                    } else {
                        totalSize += stats.size;
                    }
                }
            };
            
            await calculateSize(dir);
            
            return {
                bytes: totalSize,
                formatted: this.formatSize(totalSize)
            };
        } catch (error) {
            console.error('Error getting disk usage:', error);
            return { bytes: 0, formatted: '0 B' };
        }
    }
}

module.exports = FileService;
