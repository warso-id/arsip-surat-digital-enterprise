/**
 * ============================================
 * FILE UPLOADER COMPONENT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL DRAG & DROP UPLOADER - SIAP PRODUKSI
 * Mendukung: Multi-file, Preview, Progress, 
 * Chunked Upload, Retry, Validation, Compression
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class FileUploader {
  constructor(options = {}) {
    this.options = {
      container: null,
      maxFiles: 10,
      maxSize: 25 * 1024 * 1024, // 25MB
      maxTotalSize: 100 * 1024 * 1024, // 100MB total
      allowedTypes: null,
      allowedExtensions: null,
      multiple: true,
      autoUpload: false,
      showPreview: true,
      compressImages: false,
      compressQuality: 0.8,
      compressMaxWidth: 1920,
      compressMaxHeight: 1080,
      chunkedUpload: false,
      chunkSize: 1024 * 1024, // 1MB per chunk
      maxRetries: 3,
      retryDelay: 1000,
      parallel: true,
      maxParallel: 3,
      uploadEndpoint: 'file.upload',
      deleteEndpoint: 'file.delete',
      onBeforeUpload: null,
      onUpload: null,
      onProgress: null,
      onComplete: null,
      onError: null,
      onRemove: null,
      onQueueComplete: null,
      ...options
    };

    this.files = [];
    this.uploadedFiles = [];
    this.container = null;
    this.uploadZone = null;
    this.fileList = null;
    this.fileInput = null;
    this.isDragover = false;
    this.isUploading = false;
    this.uploadQueue = [];
    this.activeUploads = 0;
    this.totalProgress = 0;
    this.uploaderId = 'uploader-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Initialize uploader
   */
  init() {
    this.container = this.options.container;
    if (!this.container) {
      console.error('FileUploader: container is required');
      return;
    }

    this.container.setAttribute('data-uploader-id', this.uploaderId);
    this.container.classList.add('file-uploader');
    this.container._uploaderInstance = this;

    this.render();
    this.bindEvents();
    
    console.log('✅ FileUploader initialized');
  }

  /**
   * Render uploader UI
   */
  render() {
    this.container.innerHTML = `
      <div class="file-uploader">
        <!-- Upload Zone -->
        <div class="upload-zone" id="upload-zone-${this.uploaderId}">
          <div class="upload-zone__icon">
            <span class="material-icons">cloud_upload</span>
          </div>
          <div class="upload-zone__text">
            <strong>Drag & drop</strong> file di sini
          </div>
          <div class="upload-zone__hint">
            atau <button type="button" class="upload-zone__browse" id="browse-files-${this.uploaderId}">browse</button> 
            untuk memilih file
          </div>
          <div class="upload-zone__info">
            ${this.getAcceptInfo()}
          </div>
          <input type="file" 
                 id="file-input-${this.uploaderId}" 
                 ${this.options.multiple ? 'multiple' : ''} 
                 accept="${this.getAcceptString()}"
                 style="display:none"
                 aria-label="Pilih file untuk diupload">
        </div>

        <!-- File List -->
        <div class="file-list" id="file-list-${this.uploaderId}">
          <div class="file-list__empty">
            <span class="material-icons">description</span>
            <span>Belum ada file dipilih</span>
          </div>
        </div>

        <!-- Upload Summary -->
        <div class="upload-summary hidden" id="upload-summary-${this.uploaderId}">
          <div class="upload-summary__progress">
            <div class="progress progress--lg">
              <div class="progress__bar" id="total-progress-bar-${this.uploaderId}" style="width:0%"></div>
            </div>
            <span class="upload-summary__text" id="total-progress-text-${this.uploaderId}">0%</span>
          </div>
          <div class="upload-summary__actions">
            <button class="btn btn-primary btn-sm" id="btn-upload-all-${this.uploaderId}">
              <span class="material-icons">cloud_upload</span> Upload Semua
            </button>
            <button class="btn btn-ghost btn-sm" id="btn-clear-all-${this.uploaderId}">
              <span class="material-icons">clear_all</span> Hapus Semua
            </button>
          </div>
        </div>
      </div>
    `;

    // Cache element references
    this.uploadZone = this.container.querySelector(`#upload-zone-${this.uploaderId}`);
    this.fileList = this.container.querySelector(`#file-list-${this.uploaderId}`);
    this.fileInput = this.container.querySelector(`#file-input-${this.uploaderId}`);
    this.uploadSummary = this.container.querySelector(`#upload-summary-${this.uploaderId}`);
  }

  /**
   * Get accept info text
   */
  getAcceptInfo() {
    const parts = [];

    if (this.options.allowedExtensions) {
      parts.push(`Format: ${this.options.allowedExtensions.join(', ')}`);
    } else if (this.options.allowedTypes) {
      const types = this.options.allowedTypes.map(t => t.split('/').pop().toUpperCase()).join(', ');
      parts.push(`Tipe: ${types}`);
    }

    if (this.options.maxSize) {
      parts.push(`Maks: ${this.formatSize(this.options.maxSize)}/file`);
    }

    if (this.options.maxFiles > 1) {
      parts.push(`Maks ${this.options.maxFiles} file`);
    }

    return parts.join(' • ');
  }

  /**
   * Get accept string for file input
   */
  getAcceptString() {
    if (this.options.allowedTypes) {
      return this.options.allowedTypes.join(',');
    }
    if (this.options.allowedExtensions) {
      return this.options.allowedExtensions.join(',');
    }
    return '*/*';
  }

  /**
   * Add files to uploader
   */
  addFiles(fileList) {
    const newFiles = Array.from(fileList);

    // Check max files
    if (this.files.length + newFiles.length > this.options.maxFiles) {
      this.showToast(`Maksimal ${this.options.maxFiles} file`, 'warning');
      return;
    }

    // Validate each file
    const validFiles = [];
    for (const file of newFiles) {
      // Check duplicate
      if (this.files.some(f => f.name === file.name && f.size === file.size)) {
        this.showToast(`File "${file.name}" sudah ditambahkan`, 'warning');
        continue;
      }

      const validation = this.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        this.showToast(validation.error, 'error');
        if (this.options.onError) {
          this.options.onError(validation.error, file);
        }
      }
    }

    if (validFiles.length === 0) return;

    // Check total size
    const currentTotal = this.files.reduce((sum, f) => sum + f.file.size, 0);
    const newTotal = validFiles.reduce((sum, f) => sum + f.size, 0);
    if (currentTotal + newTotal > this.options.maxTotalSize) {
      this.showToast(`Total ukuran file melebihi ${this.formatSize(this.options.maxTotalSize)}`, 'error');
      return;
    }

    // Process files
    this.processFiles(validFiles);
  }

  /**
   * Process files (compress, thumbnail)
   */
  async processFiles(files) {
    for (const file of files) {
      let processedFile = file;
      let thumbnail = null;
      let wasCompressed = false;

      // Compress images if enabled
      if (this.options.compressImages && this.isImage(file)) {
        try {
          processedFile = await this.compressImage(file);
          wasCompressed = processedFile.size !== file.size;
        } catch (error) {
          console.warn('Image compression failed:', error);
        }
      }

      // Generate thumbnail for preview
      if (this.options.showPreview && this.isImage(processedFile)) {
        try {
          thumbnail = await this.generateThumbnail(processedFile);
        } catch (error) {
          console.warn('Thumbnail generation failed:', error);
        }
      }

      const fileData = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file: processedFile,
        originalFile: file,
        name: file.name,
        size: processedFile.size,
        originalSize: file.size,
        type: processedFile.type,
        thumbnail: thumbnail,
        progress: 0,
        status: 'pending', // pending, uploading, completed, error, cancelled
        uploadedId: null,
        uploadedUrl: null,
        retries: 0,
        error: null,
        wasCompressed: wasCompressed
      };

      this.files.push(fileData);
      this.renderFileItem(fileData);

      // Auto upload if enabled
      if (this.options.autoUpload) {
        this.uploadFile(fileData.id);
      }
    }

    // Update file input (for form submission compatibility)
    this.updateFileInput();

    // Update UI
    this.updateUploadSummary();

    // Trigger callback
    if (this.options.onUpload) {
      this.options.onUpload(this.getFilesData());
    }
  }

  /**
   * Validate single file
   */
  validateFile(file) {
    // Check empty
    if (file.size === 0) {
      return { valid: false, error: `File "${file.name}" kosong` };
    }

    // Check size
    if (file.size > this.options.maxSize) {
      return {
        valid: false,
        error: `File "${file.name}" terlalu besar. Maksimal ${this.formatSize(this.options.maxSize)}`
      };
    }

    // Check type
    if (this.options.allowedTypes && this.options.allowedTypes.length > 0) {
      if (!this.options.allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `Tipe file "${file.name}" (${file.type}) tidak didukung`
        };
      }
    }

    // Check extension
    if (this.options.allowedExtensions && this.options.allowedExtensions.length > 0) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!this.options.allowedExtensions.includes(ext)) {
        return {
          valid: false,
          error: `Ekstensi file "${file.name}" (${ext}) tidak didukung`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Render single file item
   */
  renderFileItem(fileData) {
    // Remove empty state
    const emptyState = this.fileList.querySelector('.file-list__empty');
    if (emptyState) emptyState.remove();

    const item = document.createElement('div');
    item.className = `file-item file-item--${fileData.status}`;
    item.id = fileData.id;
    item.setAttribute('data-file-id', fileData.id);

    const icon = this.getFileIcon(fileData.name);
    const fileSize = this.formatSize(fileData.size);
    const compressedInfo = fileData.wasCompressed 
      ? ` (dikompresi dari ${this.formatSize(fileData.originalSize)})` 
      : '';

    item.innerHTML = `
      <div class="file-item__icon">
        ${fileData.thumbnail 
          ? `<img src="${fileData.thumbnail}" alt="${fileData.name}" class="file-item__thumbnail" loading="lazy">`
          : `<span class="material-icons file-item__icon-fallback">${icon}</span>`
        }
      </div>
      <div class="file-item__info">
        <div class="file-item__name" title="${fileData.name}">${fileData.name}</div>
        <div class="file-item__size">${fileSize}${compressedInfo}</div>
        ${fileData.status === 'uploading' ? `
          <div class="file-item__progress">
            <div class="progress">
              <div class="progress__bar" style="width:${fileData.progress}%"></div>
            </div>
            <small>${fileData.progress}%</small>
          </div>
        ` : ''}
        ${fileData.status === 'error' ? `
          <div class="file-item__error">
            <span class="material-icons">error_outline</span>
            <span>${fileData.error || 'Gagal upload'}</span>
            <button class="btn btn-sm btn-ghost file-item__retry-btn" data-file-id="${fileData.id}">
              Coba Lagi
            </button>
          </div>
        ` : ''}
      </div>
      <div class="file-item__status">
        ${fileData.status === 'completed' 
          ? '<span class="material-icons file-item__status-icon--success">check_circle</span>'
          : fileData.status === 'uploading'
            ? '<span class="material-icons file-item__status-icon--uploading" style="animation:spin 1s linear infinite">sync</span>'
            : fileData.status === 'error'
              ? '<span class="material-icons file-item__status-icon--error">cancel</span>'
              : ''
        }
      </div>
      <div class="file-item__actions">
        ${fileData.status === 'pending' ? `
          <button class="btn-icon btn-icon-sm file-item__upload-btn" data-file-id="${fileData.id}" title="Upload">
            <span class="material-icons">cloud_upload</span>
          </button>
        ` : ''}
        ${fileData.status === 'completed' ? `
          <button class="btn-icon btn-icon-sm file-item__download-btn" data-file-id="${fileData.id}" title="Download">
            <span class="material-icons">download</span>
          </button>
          <button class="btn-icon btn-icon-sm file-item__copy-btn" data-file-id="${fileData.id}" title="Salin Link">
            <span class="material-icons">content_copy</span>
          </button>
        ` : ''}
        ${fileData.status !== 'uploading' ? `
          <button class="btn-icon btn-icon-sm file-item__remove-btn" data-file-id="${fileData.id}" title="Hapus">
            <span class="material-icons">close</span>
          </button>
        ` : ''}
      </div>
    `;

    this.fileList.appendChild(item);
  }

  /**
   * Update file item in DOM
   */
  updateFileItem(fileData) {
    const existingItem = this.fileList.querySelector(`#${fileData.id}`);
    if (existingItem) {
      // Update progress
      const progressBar = existingItem.querySelector('.progress__bar');
      const progressText = existingItem.querySelector('.file-item__progress small');
      if (progressBar) progressBar.style.width = `${fileData.progress}%`;
      if (progressText) progressText.textContent = `${fileData.progress}%`;

      // Update status
      existingItem.className = `file-item file-item--${fileData.status}`;
      
      // Update status icon
      const statusEl = existingItem.querySelector('.file-item__status');
      if (statusEl) {
        if (fileData.status === 'completed') {
          statusEl.innerHTML = '<span class="material-icons file-item__status-icon--success">check_circle</span>';
        } else if (fileData.status === 'error') {
          statusEl.innerHTML = '<span class="material-icons file-item__status-icon--error">cancel</span>';
        }
      }

      // Update actions
      const actionsEl = existingItem.querySelector('.file-item__actions');
      if (actionsEl) {
        if (fileData.status === 'completed') {
          actionsEl.innerHTML = `
            <button class="btn-icon btn-icon-sm file-item__download-btn" data-file-id="${fileData.id}" title="Download">
              <span class="material-icons">download</span>
            </button>
            <button class="btn-icon btn-icon-sm file-item__remove-btn" data-file-id="${fileData.id}" title="Hapus">
              <span class="material-icons">close</span>
            </button>
          `;
        } else if (fileData.status === 'error') {
          actionsEl.innerHTML = `
            <button class="btn-icon btn-icon-sm file-item__retry-btn" data-file-id="${fileData.id}" title="Coba Lagi">
              <span class="material-icons">refresh</span>
            </button>
            <button class="btn-icon btn-icon-sm file-item__remove-btn" data-file-id="${fileData.id}" title="Hapus">
              <span class="material-icons">close</span>
            </button>
          `;
        }
      }

      // Update error message
      const errorEl = existingItem.querySelector('.file-item__error');
      if (fileData.status === 'error' && !errorEl) {
        const infoEl = existingItem.querySelector('.file-item__info');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'file-item__error';
        errorDiv.innerHTML = `
          <span class="material-icons">error_outline</span>
          <span>${fileData.error || 'Gagal upload'}</span>
          <button class="btn btn-sm btn-ghost file-item__retry-btn" data-file-id="${fileData.id}">Coba Lagi</button>
        `;
        infoEl.appendChild(errorDiv);
      }
    } else {
      // Re-render completely
      this.renderFileItem(fileData);
    }
  }

  /**
   * Upload single file
   */
  async uploadFile(fileId, retry = false) {
    const fileData = this.files.find(f => f.id === fileId);
    if (!fileData) return;
    if (fileData.status === 'uploading') return;

    // Before upload callback
    if (this.options.onBeforeUpload && !retry) {
      const shouldContinue = await this.options.onBeforeUpload(fileData);
      if (shouldContinue === false) return;
    }

    fileData.status = 'uploading';
    fileData.progress = 0;
    fileData.error = null;
    if (!retry) fileData.retries = 0;
    
    this.updateFileItem(fileData);
    this.updateUploadSummary();

    try {
      let result;

      if (this.options.chunkedUpload && fileData.file.size > this.options.chunkSize) {
        // Chunked upload untuk file besar
        result = await this.chunkedUpload(fileData);
      } else {
        // Single upload
        result = await this.singleUpload(fileData);
      }

      if (result.status === 'success' || result.success) {
        fileData.status = 'completed';
        fileData.progress = 100;
        fileData.uploadedId = result.data?.id || result.data?.fileId || result.id;
        fileData.uploadedUrl = result.data?.fileUrl || result.url;

        this.uploadedFiles.push(fileData);

        if (this.options.onComplete) {
          this.options.onComplete(fileData, result.data || result);
        }
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      fileData.retries++;
      
      if (fileData.retries <= this.options.maxRetries) {
        // Retry with delay
        fileData.status = 'pending';
        fileData.error = `${error.message} (Retry ${fileData.retries}/${this.options.maxRetries})`;
        this.updateFileItem(fileData);
        
        await this.delay(this.options.retryDelay * fileData.retries);
        return this.uploadFile(fileId, true);
      } else {
        fileData.status = 'error';
        fileData.error = error.message;
        
        if (this.options.onError) {
          this.options.onError(error, fileData);
        }
      }
    }

    this.updateFileItem(fileData);
    this.updateUploadSummary();

    // Check if all uploads complete
    if (this.uploadQueue.length === 0 && this.activeUploads === 0) {
      if (this.options.onQueueComplete) {
        const completed = this.files.filter(f => f.status === 'completed');
        const failed = this.files.filter(f => f.status === 'error');
        this.options.onQueueComplete(completed, failed);
      }
    }
  }

  /**
   * Single upload (regular)
   */
  async singleUpload(fileData) {
    // Try using API service
    if (typeof API !== 'undefined' && API.uploadFile) {
      return API.uploadFile(fileData.file, (progress) => {
        fileData.progress = Math.round(progress);
        this.updateFileItem(fileData);
        
        if (this.options.onProgress) {
          this.options.onProgress(fileData, fileData.progress);
        }
      });
    }

    // Fallback: XMLHttpRequest with progress
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('action', this.options.uploadEndpoint);
      formData.append('filename', fileData.name);

      // Add auth token
      const token = this.getAuthToken();
      if (token) formData.append('token', token);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          fileData.progress = Math.round((e.loaded / e.total) * 100);
          this.updateFileItem(fileData);
          
          if (this.options.onProgress) {
            this.options.onProgress(fileData, fileData.progress);
          }
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            resolve({ success: true, data: { fileUrl: xhr.responseText } });
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

      const apiUrl = this.getApiUrl();
      xhr.open('POST', apiUrl);
      xhr.send(formData);
    });
  }

  /**
   * Chunked upload untuk file besar
   */
  async chunkedUpload(fileData) {
    const file = fileData.file;
    const totalChunks = Math.ceil(file.size / this.options.chunkSize);
    let uploadedChunks = 0;
    let uploadId = null;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.options.chunkSize;
      const end = Math.min(start + this.options.chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkIndex', i);
      formData.append('totalChunks', totalChunks);
      formData.append('filename', fileData.name);
      formData.append('fileSize', file.size);
      if (uploadId) formData.append('uploadId', uploadId);
      formData.append('action', this.options.uploadEndpoint);

      const token = this.getAuthToken();
      if (token) formData.append('token', token);

      try {
        const response = await fetch(this.getApiUrl(), {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        
        if (result.status === 'success') {
          uploadedChunks++;
          fileData.progress = Math.round((uploadedChunks / totalChunks) * 100);
          this.updateFileItem(fileData);
          
          if (result.uploadId) uploadId = result.uploadId;
          
          if (this.options.onProgress) {
            this.options.onProgress(fileData, fileData.progress);
          }
        } else {
          throw new Error(result.message || `Chunk ${i} upload failed`);
        }
      } catch (error) {
        throw new Error(`Chunk ${i}/${totalChunks} failed: ${error.message}`);
      }
    }

    // Finalize upload
    if (uploadId) {
      const finalizeFormData = new FormData();
      finalizeFormData.append('action', this.options.uploadEndpoint);
      finalizeFormData.append('finalize', 'true');
      finalizeFormData.append('uploadId', uploadId);
      finalizeFormData.append('filename', fileData.name);

      const token = this.getAuthToken();
      if (token) finalizeFormData.append('token', token);

      const finalizeResponse = await fetch(this.getApiUrl(), {
        method: 'POST',
        body: finalizeFormData
      });

      return finalizeResponse.json();
    }

    return { success: true };
  }

  /**
   * Upload all pending files
   */
  async uploadAll() {
    const pendingFiles = this.files.filter(f => f.status === 'pending');
    
    if (this.options.parallel) {
      // Upload secara parallel dengan batas maksimal
      const queue = [...pendingFiles];
      this.uploadQueue = queue;
      
      const uploadNext = async () => {
        if (queue.length === 0) return;
        const fileData = queue.shift();
        this.activeUploads++;
        await this.uploadFile(fileData.id);
        this.activeUploads--;
        await uploadNext();
      };

      const workers = Array(Math.min(this.options.maxParallel, queue.length))
        .fill(null)
        .map(() => uploadNext());

      await Promise.all(workers);
      this.uploadQueue = [];
    } else {
      // Upload secara sequential
      for (const fileData of pendingFiles) {
        await this.uploadFile(fileData.id);
      }
    }

    this.updateUploadSummary();
  }

  /**
   * Remove file
   */
  removeFile(fileId) {
    const index = this.files.findIndex(f => f.id === fileId);
    if (index === -1) return;

    const fileData = this.files[index];

    // Remove from arrays
    this.files.splice(index, 1);
    this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== fileId);
    this.uploadQueue = this.uploadQueue.filter(f => f.id !== fileId);

    // Remove from DOM with animation
    const item = this.fileList.querySelector(`#${fileId}`);
    if (item) {
      item.style.transition = 'all 0.3s ease';
      item.style.opacity = '0';
      item.style.transform = 'translateX(20px)';
      item.style.maxHeight = '0';
      item.style.marginBottom = '0';
      item.style.padding = '0';
      item.style.border = 'none';
      setTimeout(() => item.remove(), 300);
    }

    // Update file input
    this.updateFileInput();
    this.updateUploadSummary();

    // Trigger callback
    if (this.options.onRemove) {
      this.options.onRemove(fileData);
    }

    // Show empty state if no files
    if (this.files.length === 0) {
      this.showEmptyState();
    }
  }

  /**
   * Retry failed upload
   */
  retryUpload(fileId) {
    const fileData = this.files.find(f => f.id === fileId);
    if (fileData) {
      fileData.status = 'pending';
      fileData.retries = 0;
      fileData.error = null;
      this.updateFileItem(fileData);
      this.uploadFile(fileId);
    }
  }

  /**
   * Download uploaded file
   */
  downloadFile(fileId) {
    const fileData = this.uploadedFiles.find(f => f.id === fileId);
    if (fileData && fileData.uploadedUrl) {
      window.open(fileData.uploadedUrl, '_blank');
    }
  }

  /**
   * Copy file URL to clipboard
   */
  async copyFileUrl(fileId) {
    const fileData = this.uploadedFiles.find(f => f.id === fileId);
    if (fileData && fileData.uploadedUrl) {
      try {
        await navigator.clipboard.writeText(fileData.uploadedUrl);
        this.showToast('Link file disalin ke clipboard', 'success');
      } catch (error) {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = fileData.uploadedUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.showToast('Link file disalin ke clipboard', 'success');
      }
    }
  }

  /**
   * Clear all files
   */
  clearAll() {
    this.files = [];
    this.uploadedFiles = [];
    this.uploadQueue = [];
    this.fileList.innerHTML = '';
    this.showEmptyState();
    this.updateFileInput();
    this.updateUploadSummary();
  }

  /**
   * Show empty state
   */
  showEmptyState() {
    this.fileList.innerHTML = `
      <div class="file-list__empty">
        <span class="material-icons">description</span>
        <span>Belum ada file dipilih</span>
      </div>
    `;
  }

  /**
   * Update upload summary
   */
  updateUploadSummary() {
    const summary = this.uploadSummary;
    if (!summary) return;

    const totalFiles = this.files.length;
    const pendingFiles = this.files.filter(f => f.status === 'pending').length;
    const completedFiles = this.files.filter(f => f.status === 'completed').length;
    const errorFiles = this.files.filter(f => f.status === 'error').length;

    if (totalFiles === 0) {
      summary.classList.add('hidden');
      return;
    }

    summary.classList.remove('hidden');

    // Update total progress
    const totalProgress = this.files.reduce((sum, f) => sum + f.progress, 0) / Math.max(totalFiles, 1);
    const progressBar = this.container.querySelector(`#total-progress-bar-${this.uploaderId}`);
    const progressText = this.container.querySelector(`#total-progress-text-${this.uploaderId}`);
    
    if (progressBar) progressBar.style.width = `${Math.round(totalProgress)}%`;
    if (progressText) progressText.textContent = `${Math.round(totalProgress)}%`;

    // Update buttons
    const uploadAllBtn = this.container.querySelector(`#btn-upload-all-${this.uploaderId}`);
    if (uploadAllBtn) {
      uploadAllBtn.disabled = pendingFiles === 0;
      uploadAllBtn.textContent = pendingFiles > 0 
        ? `Upload ${pendingFiles} File` 
        : 'Upload Semua';
    }

    // Update status text
    let statusText = '';
    if (completedFiles > 0) statusText += `${completedFiles} selesai `;
    if (errorFiles > 0) statusText += `${errorFiles} gagal `;
    if (pendingFiles > 0) statusText += `${pendingFiles} menunggu`;
    progressText.textContent = statusText || `${Math.round(totalProgress)}%`;
  }

  /**
   * Update hidden file input (for form compatibility)
   */
  updateFileInput() {
    const dt = new DataTransfer();
    this.files.forEach(f => {
      if (f.status === 'completed' || f.status === 'pending') {
        dt.items.add(f.file);
      }
    });
    this.fileInput.files = dt.files;
  }

  /**
   * Compress image
   */
  async compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          
          if (width > this.options.compressMaxWidth) {
            height = (this.options.compressMaxWidth / width) * height;
            width = this.options.compressMaxWidth;
          }
          if (height > this.options.compressMaxHeight) {
            width = (this.options.compressMaxHeight / height) * width;
            height = this.options.compressMaxHeight;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          }, 'image/jpeg', this.options.compressQuality);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate thumbnail
   */
  async generateThumbnail(file, maxSize = 150) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const ratio = maxSize / Math.max(img.width, img.height);
          const canvas = document.createElement('canvas');
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

  /**
   * Check if file is image
   */
  isImage(file) {
    return file.type?.startsWith('image/');
  }

  /**
   * Get file icon based on extension
   */
  getFileIcon(fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const icons = {
      'pdf': 'picture_as_pdf',
      'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'gif', 'svg': 'image',
      'doc': 'description', 'docx': 'description',
      'xls': 'table_chart', 'xlsx': 'table_chart', 'csv': 'table_chart',
      'ppt': 'slideshow', 'pptx': 'slideshow',
      'txt': 'article', 'md': 'article',
      'zip': 'folder_zip', 'rar': 'folder_zip', '7z': 'folder_zip',
      'mp3': 'audio_file', 'wav': 'audio_file',
      'mp4': 'video_file', 'avi': 'video_file',
      'json': 'code', 'js': 'code', 'html': 'code', 'css': 'code'
    };
    return icons[ext] || 'insert_drive_file';
  }

  /**
   * Format file size
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
  }

  /**
   * Get auth token
   */
  getAuthToken() {
    try {
      if (typeof AuthService !== 'undefined' && AuthService.getToken) {
        return AuthService.getToken();
      }
      if (typeof Storage !== 'undefined') {
        return Storage.get('asd_token') || Storage.get('asd_auth_token');
      }
      return localStorage.getItem('asd_token') || localStorage.getItem('asd_auth_token');
    } catch {
      return null;
    }
  }

  /**
   * Get API URL
   */
  getApiUrl() {
    if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.API_URL) {
      return APP_CONFIG.API_URL;
    }
    if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.API_BASE_URL) {
      return APP_CONFIG.API_BASE_URL;
    }
    return window.location.origin + '/api';
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    if (typeof Toast !== 'undefined') {
      Toast.show(message, type);
    } else if (typeof NotificationService !== 'undefined') {
      NotificationService.show(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get uploaded file IDs
   */
  getUploadedIds() {
    return this.uploadedFiles.map(f => f.uploadedId).filter(Boolean);
  }

  /**
   * Get uploaded file URLs
   */
  getUploadedUrls() {
    return this.uploadedFiles.map(f => f.uploadedUrl).filter(Boolean);
  }

  /**
   * Get all files data
   */
  getFilesData() {
    return this.files.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      status: f.status,
      progress: f.progress,
      uploadedId: f.uploadedId,
      uploadedUrl: f.uploadedUrl,
      error: f.error
    }));
  }

  /**
   * Bind all events
   */
  bindEvents() {
    // Click to browse
    this.uploadZone.addEventListener('click', (e) => {
      if (!e.target.closest('button') && !e.target.closest('a')) {
        this.fileInput.click();
      }
    });

    // Browse button
    const browseBtn = this.container.querySelector(`#browse-files-${this.uploaderId}`);
    if (browseBtn) {
      browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.fileInput.click();
      });
    }

    // File input change
    this.fileInput.addEventListener('change', () => {
      if (this.fileInput.files.length > 0) {
        this.addFiles(this.fileInput.files);
        this.fileInput.value = '';
      }
    });

    // Drag and drop
    this.uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.uploadZone.classList.add('upload-zone--dragover');
    });

    this.uploadZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!this.uploadZone.contains(e.relatedTarget)) {
        this.uploadZone.classList.remove('upload-zone--dragover');
      }
    });

    this.uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.uploadZone.classList.remove('upload-zone--dragover');

      if (e.dataTransfer.files.length > 0) {
        this.addFiles(e.dataTransfer.files);
      }
    });

    // File list delegation events
    this.fileList.addEventListener('click', (e) => {
      const fileId = e.target.closest('[data-file-id]')?.dataset.fileId;
      if (!fileId) return;

      if (e.target.closest('.file-item__upload-btn') || e.target.closest('.file-item__retry-btn')) {
        this.retryUpload(fileId);
      } else if (e.target.closest('.file-item__remove-btn')) {
        this.removeFile(fileId);
      } else if (e.target.closest('.file-item__download-btn')) {
        this.downloadFile(fileId);
      } else if (e.target.closest('.file-item__copy-btn')) {
        this.copyFileUrl(fileId);
      }
    });

    // Upload all button
    const uploadAllBtn = this.container.querySelector(`#btn-upload-all-${this.uploaderId}`);
    if (uploadAllBtn) {
      uploadAllBtn.addEventListener('click', () => this.uploadAll());
    }

    // Clear all button
    const clearAllBtn = this.container.querySelector(`#btn-clear-all-${this.uploaderId}`);
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => this.clearAll());
    }

    // Paste files from clipboard
    document.addEventListener('paste', (e) => {
      if (this.container.contains(document.activeElement) || 
          this.uploadZone.matches(':focus-within') || 
          this.container.matches(':focus-within')) {
        const items = e.clipboardData?.items;
        if (items) {
          const files = [];
          for (const item of items) {
            if (item.kind === 'file') {
              files.push(item.getAsFile());
            }
          }
          if (files.length > 0) {
            e.preventDefault();
            this.addFiles(files);
          }
        }
      }
    });
  }

  /**
   * Destroy uploader
   */
  destroy() {
    this.files = [];
    this.uploadedFiles = [];
    this.uploadQueue = [];
    if (this.container) {
      this.container.innerHTML = '';
      this.container.classList.remove('file-uploader');
      this.container.removeAttribute('data-uploader-id');
      this.container._uploaderInstance = null;
    }
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FileUploader };
}
