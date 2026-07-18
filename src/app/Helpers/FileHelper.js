const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

class FileHelper {
    /**
     * Upload file
     */
    static async uploadFile(file, options = {}) {
        const {
            destination = 'uploads',
            allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
            maxSize = 10 * 1024 * 1024, // 10MB
            generateThumbnail = false
        } = options;

        // Validasi tipe file
        if (!allowedTypes.includes(file.mimetype)) {
            throw new Error('Tipe file tidak diizinkan');
        }

        // Validasi ukuran file
        if (file.size > maxSize) {
            throw new Error('Ukuran file terlalu besar');
        }

        // Generate nama file unik
        const extension = path.extname(file.originalname);
        const fileName = uuidv4() + extension;
        const uploadPath = path.join(destination, fileName);

        // Buat direktori jika belum ada
        await fs.mkdir(destination, { recursive: true });

        // Simpan file
        await fs.writeFile(uploadPath, file.buffer);

        // Generate thumbnail untuk gambar
        let thumbnailPath = null;
        if (generateThumbnail && file.mimetype.startsWith('image/')) {
            thumbnailPath = await this.generateThumbnail(uploadPath, destination);
        }

        return {
            fileName,
            originalName: file.originalname,
            path: uploadPath,
            thumbnailPath,
            size: file.size,
            mimeType: file.mimetype,
            extension
        };
    }

    /**
     * Generate thumbnail
     */
    static async generateThumbnail(filePath, destination, width = 200, height = 200) {
        const thumbnailName = 'thumb_' + path.basename(filePath);
        const thumbnailPath = path.join(destination, 'thumbnails', thumbnailName);

        await fs.mkdir(path.join(destination, 'thumbnails'), { recursive: true });

        await sharp(filePath)
            .resize(width, height, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);

        return thumbnailPath;
    }

    /**
     * Hapus file
     */
    static async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    /**
     * Hapus multiple files
     */
    static async deleteFiles(filePaths) {
        const results = [];
        for (const filePath of filePaths) {
            results.push(await this.deleteFile(filePath));
        }
        return results;
    }

    /**
     * Pindahkan file
     */
    static async moveFile(sourcePath, destinationPath) {
        try {
            await fs.mkdir(path.dirname(destinationPath), { recursive: true });
            await fs.rename(sourcePath, destinationPath);
            return true;
        } catch (error) {
            console.error('Error moving file:', error);
            return false;
        }
    }

    /**
     * Copy file
     */
    static async copyFile(sourcePath, destinationPath) {
        try {
            await fs.mkdir(path.dirname(destinationPath), { recursive: true });
            await fs.copyFile(sourcePath, destinationPath);
            return true;
        } catch (error) {
            console.error('Error copying file:', error);
            return false;
        }
    }

    /**
     * Cek file exists
     */
    static async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Baca file
     */
    static async readFile(filePath, encoding = 'utf8') {
        try {
            return await fs.readFile(filePath, encoding);
        } catch (error) {
            console.error('Error reading file:', error);
            return null;
        }
    }

    /**
     * Tulis file
     */
    static async writeFile(filePath, content) {
        try {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, content);
            return true;
        } catch (error) {
            console.error('Error writing file:', error);
            return false;
        }
    }

    /**
     * Dapatkan info file
     */
    static async getFileInfo(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return {
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                isDirectory: stats.isDirectory(),
                isFile: stats.isFile(),
                extension: path.extname(filePath),
                name: path.basename(filePath),
                dirname: path.dirname(filePath)
            };
        } catch (error) {
            console.error('Error getting file info:', error);
            return null;
        }
    }

    /**
     * List files in directory
     */
    static async listFiles(dirPath, recursive = false) {
        try {
            const files = await fs.readdir(dirPath);
            const fileList = [];

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);

                if (stats.isDirectory() && recursive) {
                    fileList.push(...(await this.listFiles(filePath, recursive)));
                } else {
                    fileList.push({
                        name: file,
                        path: filePath,
                        size: stats.size,
                        isDirectory: stats.isDirectory(),
                        modifiedAt: stats.mtime
                    });
                }
            }

            return fileList;
        } catch (error) {
            console.error('Error listing files:', error);
            return [];
        }
    }

    /**
     * Buat direktori
     */
    static async createDirectory(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
            return true;
        } catch (error) {
            console.error('Error creating directory:', error);
            return false;
        }
    }

    /**
     * Hapus direktori
     */
    static async deleteDirectory(dirPath) {
        try {
            await fs.rm(dirPath, { recursive: true, force: true });
            return true;
        } catch (error) {
            console.error('Error deleting directory:', error);
            return false;
        }
    }

    /**
     * Kompres gambar
     */
    static async compressImage(filePath, quality = 80) {
        try {
            const outputPath = filePath.replace(/\.[^.]+$/, '_compressed$&');
            await sharp(filePath)
                .jpeg({ quality })
                .toFile(outputPath);
            return outputPath;
        } catch (error) {
            console.error('Error compressing image:', error);
            return null;
        }
    }

    /**
     * Resize gambar
     */
    static async resizeImage(filePath, width, height = null) {
        try {
            const outputPath = filePath.replace(/\.[^.]+$/, `_${width}x${height || 'auto'}$&`);
            await sharp(filePath)
                .resize(width, height, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .toFile(outputPath);
            return outputPath;
        } catch (error) {
            console.error('Error resizing image:', error);
            return null;
        }
    }

    /**
     * Convert gambar ke format lain
     */
    static async convertImage(filePath, format = 'jpeg') {
        try {
            const outputPath = filePath.replace(/\.[^.]+$/, `.${format}`);
            await sharp(filePath)
                .toFormat(format)
                .toFile(outputPath);
            return outputPath;
        } catch (error) {
            console.error('Error converting image:', error);
            return null;
        }
    }
}

module.exports = FileHelper;
