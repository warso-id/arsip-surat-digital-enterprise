/**
 * FILE UPLOADER COMPONENT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Drag & drop file upload with preview
 */

class FileUploader {
  constructor(options = {}) {
    this.options = {
      container: null,
      maxFiles: 10,
      maxSize: 25 * 1024 * 1024, // 25MB
      allowedTypes: null,
      allowedExtensions: null,
      multiple: true,
      autoUpload: false,
      showPreview: true,
      compressImages: false,
      onUpload: null,
      onProgress: null,
      onComplete: null,
      onError: null,
      onRemove: null,
      ...options
    };
    
    this.files = [];
    this.uploadedFiles = [];
    this.container = null;
    this.uploadZone = null;
    this.fileList = null;
    this.fileInput = null;
    this.isDragover = false;
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
    
    this.render();
    this.bindEvents();
  }
  
  /**
   * Render uploader
   */
  render() {
    this.container.innerHTML = `
      <div class="file-uploader">
        <div class="upload-zone" id="upload-zone">
          <div class="upload-zone__icon">
            <span class="material-icons">cloud_upload</span>
          </div>
          <div class="upload-zone__text">
            Drag & drop file di sini
          </div>
          <div class="upload-zone__hint">
            atau <button type="button" class="upload-zone__browse" id="browse-files">browse</button> untuk memilih file
          </div>
          <div class="upload-zone__info">
            ${this.getAcceptInfo()}
          </div>
          <input type="file" id="file-input" 
                 ${this.options.multiple ? 'multiple' : ''} 
                 accept="${this.getAcceptString()}"
                 style="display:none">
        </div>
        <div class="file-list" id="file-list"></div>
      </div>
    `;
    
    this.uploadZone = this.container.querySelector('#upload-zone');
    this.fileList = this.container.querySelector('#file-list');
    this.fileInput = this.container.querySelector('#file-input');
  }
  
  /**
   * Get accept info text
   */
  getAcceptInfo() {
    const parts = [];
    
    if (this.options.allowedExtensions) {
      parts.push(`Format: ${this.options.allowedExtensions.join(', ')}`);
    }
    
    if (this.options.maxSize) {
      parts.push(`Maks: ${FileService.formatSize(this.options.maxSize)}`);
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
   * Add files
   */
  addFiles(fileList) {
    const newFiles = Array.from(fileList);
    
    // Check max files
    if (this.files.length + newFiles.length > this.options.maxFiles) {
      NotificationService.warning(`Maksimal ${this.options.maxFiles} file`);
      return;
    }
    
    // Validate each file
    const validFiles = [];
    for (const file of newFiles) {
      const validation = this.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        NotificationService.error(validation.error);
        if (this.options.onError) {
          this.options.onError(validation.error, file);
        }
      }
    }
    
    if (validFiles.length === 0) return;
    
    // Process files
    this.processFiles(validFiles);
  }
  
  /**
   * Process files
   */
  async processFiles(files) {
    for (const file of files) {
      let processedFile = file;
      
      // Compress images if enabled
      if (this.options.compressImages && file.type?.startsWith('image/')) {
        try {
          processedFile = await FileService.compressImage(file);
        } catch (error) {
          console.warn('Image compression failed:', error);
        }
      }
      
      // Generate thumbnail for preview
      let thumbnail = null;
      if (this.options.showPreview && file.type?.startsWith('image/')) {
        thumbnail = await FileService.generateThumbnail(processedFile);
      }
      
      const fileData = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file: processedFile,
        name: processedFile.name,
        size: processedFile.size,
        type: processedFile.type,
        thumbnail: thumbnail,
        progress: 0,
        status: 'pending',
        uploadedId: null
      };
      
      this.files.push(fileData);
      this.renderFileItem(fileData);
      
      // Auto upload if enabled
      if (this.options.autoUpload) {
        this.uploadFile(fileData.id);
      }
    }
    
    // Update file input (for form submission)
    this.updateFileInput();
    
    // Trigger callback
    if (this.options.onUpload) {
      this.options.onUpload(this.files);
    }
  }
  
  /**
   * Validate file
   */
  validateFile(file) {
    // Check size
    if (file.size > this.options.maxSize) {
      return {
        valid: false,
        error: `File "${file.name}" terlalu besar. Maksimal ${FileService.formatSize(this.options.maxSize)}`
      };
    }
    
    // Check type
    if (this.options.allowedTypes && this.options.allowedTypes.length > 0) {
      if (!this.options.allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `Tipe file "${file.name}" tidak didukung`
        };
      }
    }
    
    // Check extension
    if (this.options.allowedExtensions && this.options.allowedExtensions.length > 0) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!this.options.allowedExtensions.includes(ext)) {
        return {
          valid: false,
          error: `Ekstensi file "${file.name}" tidak didukung`
        };
      }
    }
    
    // Check empty
    if (file.size === 0) {
      return {
        valid: false,
        error: `File "${file.name}" kosong`
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Render file item
   */
  renderFileItem(fileData) {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.id = fileData.id;
    item.innerHTML = `
      <div class="file-item__icon">
        ${fileData.thumbnail 
          ? `<img src="${fileData.thumbnail}" alt="${fileData.name}" class="file-item__thumbnail">`
          : `<span class="material-icons">${FileService.getFileIcon(fileData.name)}</span>`
        }
      </div>
      <div class="file-item__info">
        <div class="file-item__name" title="${fileData.name}">${fileData.name}</div>
        <div class="file-item__size">${FileService.formatSize(fileData.size)}</div>
      </div>
      ${fileData.status === 'uploading' ? `
        <div class="file-item__progress">
          <div class="progress">
            <div class="progress__bar" style="width:${fileData.progress}%"></div>
          </div>
          <small>${fileData.progress}%</small>
        </div>
      ` : ''}
      ${fileData.status === 'completed' ? `
        <span class="material-icons" style="color:var(--md-sys-color-success)">check_circle</span>
      ` : ''}
      ${fileData.status === 'error' ? `
        <span class="material-icons" style="color:var(--md-sys-color-error)">error</span>
        <small style="color:var(--md-sys-color-error)">${fileData.error || 'Gagal'}</small>
      ` : ''}
      <div class="file-item__actions">
        ${fileData.status !== 'uploading' ? `
          <button class="btn-icon btn-icon-sm" onclick="window._removeFile('${fileData.id}')" title="Hapus">
            <span class="material-icons">close</span>
          </button>
        ` : ''}
        ${fileData.status === 'pending' && !this.options.autoUpload ? `
          <button class="btn-icon btn-icon-sm" onclick="window._uploadFile('${fileData.id}')" title="Upload">
            <span class="material-icons">cloud_upload</span>
          </button>
        ` : ''}
      </div>
    `;
    
    this.fileList.appendChild(item);
  }
  
  /**
   * Upload single file
   */
  async uploadFile(fileId) {
    const fileData = this.files.find(f => f.id === fileId);
    if (!fileData) return;
    
    fileData.status = 'uploading';
    fileData.progress = 0;
    this.updateFileItem(fileData);
    
    try {
      const response = await api.uploadFile(fileData.file, (progress) => {
        fileData.progress = progress;
        this.updateFileItem(fileData);
        
        if (this.options.onProgress) {
          this.options.onProgress(fileData, progress);
        }
      });
      
      if (response.status === 'success') {
        fileData.status = 'completed';
        fileData.uploadedId = response.data?.id || response.data?.fileId;
        fileData.uploadedUrl = response.data?.fileUrl;
        
        this.uploadedFiles.push(fileData);
        
        if (this.options.onComplete) {
          this.options.onComplete(fileData, response.data);
        }
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      fileData.status = 'error';
      fileData.error = error.message;
      
      if (this.options.onError) {
        this.options.onError(error, fileData);
      }
    }
    
    this.updateFileItem(fileData);
  }
  
  /**
   * Upload all files
   */
  async uploadAll() {
    const pendingFiles = this.files.filter(f => f.status === 'pending');
    
    for (const fileData of pendingFiles) {
      await this.uploadFile(fileData.id);
    }
  }
  
  /**
   * Update file item in DOM
   */
  updateFileItem(fileData) {
    const item = this.fileList.querySelector(`#${fileData.id}`);
    if (!item) return;
    
    // Update progress
    const progressBar = item.querySelector('.progress__bar');
    if (progressBar) {
      progressBar.style.width = `${fileData.progress}%`;
    }
    
    // Update status icon
    const statusArea = item.querySelector('.file-item__actions');
    if (statusArea) {
      if (fileData.status === 'completed') {
        const checkIcon = document.createElement('span');
        checkIcon.className = 'material-icons';
        checkIcon.style.color = 'var(--md-sys-color-success)';
        checkIcon.textContent = 'check_circle';
        statusArea.parentElement.insertBefore(checkIcon, statusArea);
      }
    }
    
    // Re-render if status changed
    if (fileData.status === 'completed' || fileData.status === 'error') {
      item.outerHTML = this.generateFileItemHTML(fileData);
    }
  }
  
  /**
   * Generate file item HTML
   */
  generateFileItemHTML(fileData) {
    return `
      <div class="file-item" id="${fileData.id}">
        <div class="file-item__icon">
          ${fileData.thumbnail 
            ? `<img src="${fileData.thumbnail}" alt="${fileData.name}" class="file-item__thumbnail">`
            : `<span class="material-icons">${FileService.getFileIcon(fileData.name)}</span>`
          }
        </div>
        <div class="file-item__info">
          <div class="file-item__name" title="${fileData.name}">${fileData.name}</div>
          <div class="file-item__size">${FileService.formatSize(fileData.size)}</div>
        </div>
        ${fileData.status === 'completed' 
          ? '<span class="material-icons" style="color:var(--md-sys-color-success)">check_circle</span>'
          : fileData.status === 'error'
            ? `<span class="material-icons" style="color:var(--md-sys-color-error)">error</span>
               <small style="color:var(--md-sys-color-error)">${fileData.error || 'Gagal'}</small>`
            : ''
        }
        <div class="file-item__actions">
          <button class="btn-icon btn-icon-sm remove-file-btn" title="Hapus">
            <span class="material-icons">close</span>
          </button>
        </div>
      </div>
    `;
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
    
    // Remove from DOM
    const item = this.fileList.querySelector(`#${fileId}`);
    if (item) {
      item.classList.add('file-item--removing');
      setTimeout(() => item.remove(), 300);
    }
    
    // Update file input
    this.updateFileInput();
    
    // Trigger callback
    if (this.options.onRemove) {
      this.options.onRemove(fileData);
    }
  }
  
  /**
   * Clear all files
   */
  clearAll() {
    this.files = [];
    this.uploadedFiles = [];
    this.fileList.innerHTML = '';
    this.updateFileInput();
  }
  
  /**
   * Update hidden file input
   */
  updateFileInput() {
    // Create DataTransfer for form compatibility
    const dt = new DataTransfer();
    this.files.forEach(f => {
      if (f.status === 'completed' || f.status === 'pending') {
        dt.items.add(f.file);
      }
    });
    
    this.fileInput.files = dt.files;
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
      name: f.name,
      size: f.size,
      type: f.type,
      status: f.status,
      uploadedId: f.uploadedId,
      uploadedUrl: f.uploadedUrl
    }));
  }
  
  /**
   * Bind events
   */
  bindEvents() {
    // Click to browse
    this.uploadZone.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        this.fileInput.click();
      }
    });
    
    // Browse button
    this.container.querySelector('#browse-files')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.fileInput.click();
    });
    
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
      this.uploadZone.classList.remove('upload-zone--dragover');
    });
    
    this.uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.uploadZone.classList.remove('upload-zone--dragover');
      
      if (e.dataTransfer.files.length > 0) {
        this.addFiles(e.dataTransfer.files);
      }
    });
    
    // Remove file (event delegation)
    this.fileList.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.remove-file-btn');
      if (removeBtn) {
        const fileItem = removeBtn.closest('.file-item');
        if (fileItem) {
          this.removeFile(fileItem.id);
        }
      }
    });
    
    // Paste files
    document.addEventListener('paste', (e) => {
      if (this.uploadZone.matches(':focus-within') || this.container.matches(':focus-within')) {
        const items = e.clipboardData?.items;
        if (items) {
          const files = [];
          for (const item of items) {
            if (item.kind === 'file') {
              files.push(item.getAsFile());
            }
          }
          if (files.length > 0) {
            this.addFiles(files);
          }
        }
      }
    });
  }
}

// Global handlers
window._removeFile = (fileId) => {
  const uploader = document.querySelector('.file-uploader');
  if (uploader?._uploaderInstance) {
    uploader._uploaderInstance.removeFile(fileId);
  }
};

window._uploadFile = (fileId) => {
  const uploader = document.querySelector('.file-uploader');
  if (uploader?._uploaderInstance) {
    uploader._uploaderInstance.uploadFile(fileId);
  }
};
