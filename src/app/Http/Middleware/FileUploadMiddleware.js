// FileUploadMiddleware.js - File Upload Handler Middleware
class FileUploadMiddleware {
    constructor() {
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
        this.allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif'];
    }

    async handleUpload(file, options = {}) {
        // Validate file
        const validation = this.validateFile(file, options);
        if (!validation.valid) {
            return {
                success: false,
                message: validation.message
            };
        }

        try {
            // Read file as base64
            const base64Data = await this.readFileAsBase64(file);
            
            // Prepare upload data
            const uploadData = {
                filename: this.generateFilename(file.name),
                original_name: file.name,
                mime_type: file.type,
                size: file.size,
                data: base64Data,
                category: options.category || 'general',
                folder: options.folder || 'uploads',
                description: options.description || ''
            };

            // Upload to server via Google Apps Script
            const result = await this.uploadToServer(uploadData);
            return result;

        } catch (error) {
            console.error('File upload error:', error);
            return {
                success: false,
                message: 'Gagal mengupload file: ' + error.message
            };
        }
    }

    async handleMultipleUpload(files, options = {}) {
        const results = [];
        
        for (const file of files) {
            const result = await this.handleUpload(file, options);
            results.push(result);
        }

        return {
            success: results.every(r => r.success),
            results: results,
            total: results.length,
            successCount: results.filter(r => r.success).length
        };
    }

    validateFile(file, options = {}) {
        // Check file existence
        if (!file) {
            return { valid: false, message: 'File tidak ditemukan' };
        }

        // Check file size
        const maxSize = options.maxSize || this.maxFileSize;
        if (file.size > maxSize) {
            return {
                valid: false,
                message: `Ukuran file terlalu besar. Maksimal ${this.formatFileSize(maxSize)}`
            };
        }

        // Check file type
        if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
            return {
                valid: false,
                message: 'Tipe file tidak diizinkan'
            };
        }

        // Check extension
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!this.allowedExtensions.includes(extension)) {
            return {
                valid: false,
                message: `Ekstensi file ${extension} tidak diizinkan`
            };
        }

        return { valid: true };
    }

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Extract base64 data
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = () => reject(new Error('Gagal membaca file'));
            reader.readAsDataURL(file);
        });
    }

    async uploadToServer(uploadData) {
        const apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        const token = localStorage.getItem('auth_token');

        const payload = btoa(encodeURIComponent(JSON.stringify({
            action: 'file_upload',
            ...uploadData,
            token: token,
            timestamp: Date.now()
        })));

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: payload })
        });

        const result = await response.json();
        return JSON.parse(decodeURIComponent(atob(result.data)));
    }

    async deleteFile(fileId) {
        const apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        const token = localStorage.getItem('auth_token');

        const payload = btoa(encodeURIComponent(JSON.stringify({
            action: 'file_delete',
            file_id: fileId,
            token: token,
            timestamp: Date.now()
        })));

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: payload })
        });

        const result = await response.json();
        return JSON.parse(decodeURIComponent(atob(result.data)));
    }

    async downloadFile(fileId) {
        const apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        const token = localStorage.getItem('auth_token');

        const payload = btoa(encodeURIComponent(JSON.stringify({
            action: 'file_download',
            file_id: fileId,
            token: token
        })));

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: payload })
        });

        const result = await response.json();
        const data = JSON.parse(decodeURIComponent(atob(result.data)));

        if (data.success && data.url) {
            window.open(data.url, '_blank');
        }

        return data;
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

    getFileIcon(mimeType) {
        const icons = {
            'application/pdf': '📕',
            'application/msword': '📘',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📘',
            'application/vnd.ms-excel': '📗',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📗',
            'image/jpeg': '🖼️',
            'image/png': '🖼️',
            'image/gif': '🖼️'
        };
        return icons[mimeType] || '📎';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileUploadMiddleware;
}
