// FileService.js - File Management Service
class FileService {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];
    }

    async uploadFile(file, category = 'surat', folder = '') {
        try {
            // Validasi file
            const validation = this.validateFile(file);
            if (!validation.valid) {
                return { success: false, message: validation.message };
            }

            // Baca file sebagai base64
            const base64Data = await this.readFileAsBase64(file);

            // Generate nama file unik
            const filename = this.generateFilename(file.name);
            const filePath = `${category}/${folder ? folder + '/' : ''}${filename}`;

            const payload = this.encode({
                action: 'file_upload',
                filename: filename,
                original_name: file.name,
                file_path: filePath,
                mime_type: file.type,
                size: file.size,
                data: base64Data,
                category: category,
                token: this.token,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Upload file error:', error);
            return { success: false, message: 'Gagal mengupload file' };
        }
    }

    async uploadMultipleFiles(files, category = 'surat', folder = '') {
        const results = [];
        
        for (const file of files) {
            const result = await this.uploadFile(file, category, folder);
            results.push(result);
        }

        return {
            success: results.every(r => r.success),
            results: results,
            total: results.length,
            successCount: results.filter(r => r.success).length
        };
    }

    async downloadFile(fileId) {
        try {
            const payload = this.encode({
                action: 'file_download',
                file_id: fileId,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);

            if (data.success && data.url) {
                const link = document.createElement('a');
                link.href = data.url;
                link.download = data.filename || 'download';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            return data;

        } catch (error) {
            console.error('Download file error:', error);
            return { success: false, message: 'Gagal mendownload file' };
        }
    }

    async deleteFile(fileId) {
        try {
            const payload = this.encode({
                action: 'file_delete',
                file_id: fileId,
                token: this.token,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Delete file error:', error);
            return { success: false, message: 'Gagal menghapus file' };
        }
    }

    async getFileInfo(fileId) {
        try {
            const payload = this.encode({
                action: 'file_info',
                file_id: fileId,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Get file info error:', error);
            return { success: false, data: null };
        }
    }

    async getFilesByCategory(category, page = 1, limit = 20) {
        try {
            const payload = this.encode({
                action: 'file_by_category',
                category: category,
                page: page,
                limit: limit,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Get files by category error:', error);
            return { success: false, data: [] };
        }
    }

    validateFile(file) {
        if (!file) {
            return { valid: false, message: 'File tidak ditemukan' };
        }

        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                message: `Ukuran file terlalu besar. Maksimal ${this.formatFileSize(this.maxFileSize)}`
            };
        }

        if (!this.allowedTypes.includes(file.type)) {
            return {
                valid: false,
                message: 'Tipe file tidak diizinkan'
            };
        }

        return { valid: true };
    }

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = () => reject(new Error('Gagal membaca file'));
            reader.readAsDataURL(file);
        });
    }

    generateFilename(originalName) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = originalName.split('.').pop();
        return `file_${timestamp}_${random}.${extension}`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            'pdf': '📕',
            'doc': '📘',
            'docx': '📘',
            'xls': '📗',
            'xlsx': '📗',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'png': '🖼️',
            'gif': '🖼️',
            'zip': '📦',
            'rar': '📦'
        };
        return icons[ext] || '📎';
    }

    encode(data) {
        return btoa(encodeURIComponent(JSON.stringify(data)));
    }

    decode(encoded) {
        try {
            return JSON.parse(decodeURIComponent(atob(encoded)));
        } catch (error) {
            return {};
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileService;
}
