/**
 * FILE SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Handles file upload, download, preview, and management
 */

class FileService {
  constructor() {
    this.maxFileSize = 25 * 1024 * 1024; // 25MB
    this.allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];
    this.allowedExtensions = [
      '.pdf', '.jpg', '.jpeg', '.png', '.gif',
      '.doc', '.docx', '.xls', '.xlsx',
      '.txt', '.csv', '.zip', '.rar'
    ];
    this.uploadQueue = [];
    this.isUploading = false;
  }
  
  /**
   * Initialize file service
   */
  init() {
    console.log('✅ File Service initialized');
  }
  
  /**
   * Upload file
   */
  async upload(file, options = {}) {
    const {
      onProgress = null,
      onSuccess = null,
      onError = null,
      metadata = {}
    } = options;
    
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      if (onError) onError(validation.error);
      throw new Error(validation.error);
    }
    
    // Add to queue
    const uploadTask = {
      id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      metadata,
      progress: 0,
      status: 'queued',
      onProgress,
      onSuccess,
      onError
    };
    
    this.uploadQueue.push(uploadTask);
    
    // Start upload if not already uploading
    if (!this.isUploading) {
      this.processQueue();
    }
    
    return uploadTask.id;
  }
  
  /**
   * Upload multiple files
   */
  async uploadMultiple(files, options = {}) {
    const tasks = [];
    
    for (const file of files) {
      const taskId = await this.upload(file, options);
      tasks.push(taskId);
    }
    
    return tasks;
  }
  
  /**
   * Process upload queue
   */
  async processQueue() {
    if (this.uploadQueue.length === 0) {
      this.isUploading = false;
      return;
    }
    
    this.isUploading = true;
    const task = this.uploadQueue.shift();
    
    try {
      task.status = 'uploading';
      
      const response = await api.uploadFile(task.file, (progress) => {
        task.progress = progress;
        if (task.onProgress) {
          task.onProgress(progress);
        }
      });
      
      if (response.status === 'success') {
        task.status = 'completed';
        task.result = response.data;
        
        if (task.onSuccess) {
          task.onSuccess(response.data);
        }
        
        NotificationService.success(`File "${task.file.name}" berhasil diupload`);
      } else {
        throw new Error(response.message || 'Upload gagal');
      }
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
      
      if (task.onError) {
        task.onError(error);
      }
      
      NotificationService.error(`Gagal upload "${task.file.name}": ${error.message}`);
    }
    
    // Process next
    this.processQueue();
  }
  
  /**
   * Validate file
   */
  validateFile(file) {
    // Check size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `Ukuran file terlalu besar. Maksimal ${this.formatSize(this.maxFileSize)}`
      };
    }
    
    // Check type
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!this.allowedExtensions.includes(extension) && 
        !this.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipe file tidak didukung. Format yang didukung: ${this.allowedExtensions.join(', ')}`
      };
    }
    
    // Check empty file
    if (file.size === 0) {
      return {
        valid: false,
        error: 'File kosong'
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Download file
   */
  async download(fileId, fileName = null) {
    try {
      const response = await api.getFilePreview(fileId);
      
      if (response.status === 'success' && response.data.previewUrl) {
        const url = response.data.previewUrl;
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || response.data.fileName || 'download';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return true;
      }
      
      throw new Error('File tidak ditemukan');
    } catch (error) {
      NotificationService.error('Gagal mendownload file');
      throw error;
    }
  }
  
  /**
   * Preview file
   */
  async preview(fileId, container) {
    try {
      const response = await api.getFilePreview(fileId);
      
      if (response.status === 'success') {
        const { fileUrl, fileName, mimeType } = response.data;
        
        // Render preview based on mime type
        if (mimeType?.startsWith('image/')) {
          container.innerHTML = `
            <div class="file-preview file-preview--image">
              <img src="${fileUrl}" alt="${fileName}" class="file-preview__image">
            </div>
          `;
        } else if (mimeType === 'application/pdf') {
          container.innerHTML = `
            <div class="file-preview file-preview--pdf">
              <iframe src="${fileUrl}" class="file-preview__iframe"></iframe>
            </div>
          `;
        } else {
          container.innerHTML = `
            <div class="file-preview file-preview--generic">
              <span class="material-icons" style="font-size:64px">description</span>
              <p>${fileName}</p>
              <button class="btn btn-primary" onclick="FileService.download('${fileId}')">
                <span class="material-icons">download</span>
                Download
              </button>
            </div>
          `;
        }
      }
    } catch (error) {
      container.innerHTML = `
        <div class="file-preview file-preview--error">
          <span class="material-icons">error</span>
          <p>Gagal memuat preview</p>
        </div>
      `;
    }
  }
  
  /**
   * Delete file
   */
  async delete(fileId) {
    try {
      const response = await api.deleteFile(fileId);
      
      if (response.status === 'success') {
        NotificationService.success('File berhasil dihapus');
        return true;
      }
      
      throw new Error(response.message);
    } catch (error) {
      NotificationService.error('Gagal menghapus file');
      throw error;
    }
  }
  
  /**
   * Get file list
   */
  async getFiles(params = {}) {
    try {
      const response = await api.getFileList(params);
      
      if (response.status === 'success') {
        return response.data;
      }
      
      return { items: [], total: 0 };
    } catch (error) {
      console.error('Failed to get files:', error);
      return { items: [], total: 0 };
    }
  }
  
  /**
   * Share file
   */
  async share(fileId, options = {}) {
    try {
      const response = await api.post('file.share', {
        id: fileId,
        ...options
      });
      
      if (response.status === 'success') {
        NotificationService.success('File berhasil dibagikan');
        return true;
      }
      
      throw new Error(response.message);
    } catch (error) {
      NotificationService.error('Gagal membagikan file');
      throw error;
    }
  }
  
  /**
   * Create file from blob
   */
  createFileFromBlob(blob, fileName, mimeType = 'application/octet-stream') {
    return new File([blob], fileName, { type: mimeType });
  }
  
  /**
   * Read file as text
   */
  readAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  
  /**
   * Read file as data URL
   */
  readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * Read file as array buffer
   */
  readAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }
  
  /**
   * Compress image
   */
  async compressImage(file, options = {}) {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8
    } = options;
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (maxHeight / height) * width;
            height = maxHeight;
          }
          
          // Draw on canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob
          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          }, 'image/jpeg', quality);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * Get file extension
   */
  getExtension(fileName) {
    return fileName.split('.').pop().toLowerCase();
  }
  
  /**
   * Get file icon based on extension
   */
  getFileIcon(fileName) {
    const ext = this.getExtension(fileName);
    
    const icons = {
      'pdf': 'picture_as_pdf',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'gif',
      'doc': 'description',
      'docx': 'description',
      'xls': 'table_chart',
      'xlsx': 'table_chart',
      'txt': 'article',
      'csv': 'table_chart',
      'zip': 'folder_zip',
      'rar': 'folder_zip'
    };
    
    return icons[ext] || 'insert_drive_file';
  }
  
  /**
   * Get file type label
   */
  getFileTypeLabel(fileName) {
    const ext = this.getExtension(fileName);
    
    const labels = {
      'pdf': 'PDF Document',
      'jpg': 'Image',
      'jpeg': 'Image',
      'png': 'Image',
      'gif': 'GIF Image',
      'doc': 'Word Document',
      'docx': 'Word Document',
      'xls': 'Excel Spreadsheet',
      'xlsx': 'Excel Spreadsheet',
      'txt': 'Text File',
      'csv': 'CSV File',
      'zip': 'ZIP Archive',
      'rar': 'RAR Archive'
    };
    
    return labels[ext] || 'File';
  }
  
  /**
   * Format file size
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
  }
  
  /**
   * Check if file is image
   */
  isImage(file) {
    return file.type?.startsWith('image/');
  }
  
  /**
   * Check if file is PDF
   */
  isPDF(file) {
    return file.type === 'application/pdf' || 
           file.name?.toLowerCase().endsWith('.pdf');
  }
  
  /**
   * Generate file thumbnail
   */
  async generateThumbnail(file, size = 150) {
    if (!this.isImage(file)) return null;
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ratio = size / Math.max(img.width, img.height);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
}

// Singleton instance
const FileService = new FileService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FileService };
}
