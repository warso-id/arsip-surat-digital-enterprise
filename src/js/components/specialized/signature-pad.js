/**
 * ============================================
 * SIGNATURE PAD COMPONENT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL DIGITAL SIGNATURE PAD - SIAP PRODUKSI
 * Mendukung: Mouse, Touch, Stylus, Undo/Redo,
 * Export, API Integration, TTD Verification
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class SignaturePad {
  constructor(options = {}) {
    this.options = {
      container: null,
      width: 600,
      height: 250,
      penColor: '#000000',
      backgroundColor: '#FFFFFF',
      penWidth: 2,
      minWidth: 0.5,
      maxWidth: 4,
      velocityFilterWeight: 0.7,
      smoothing: true,
      dotSize: 1.5,
      throttle: 16, // ~60fps
      placeholder: 'Tanda tangan di sini',
      placeholderColor: '#9E9E9E',
      showGrid: false,
      gridColor: '#E0E0E0',
      gridSize: 20,
      showBorder: true,
      borderColor: '#C4C6D0',
      borderRadius: 12,
      showControls: true,
      showUndoRedo: true,
      showClear: true,
      showColorPicker: true,
      showSizePicker: true,
      showDownload: true,
      showUpload: false,
      maxUndoStack: 30,
      required: false,
      requiredMessage: 'Tanda tangan wajib diisi',
      readOnly: false,
      disabled: false,
      onBegin: null,
      onDraw: null,
      onEnd: null,
      onChange: null,
      onClear: null,
      onUndo: null,
      onRedo: null,
      onLoad: null,
      ...options
    };

    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.isDrawing = false;
    this.isEmpty = true;
    this.isReadOnly = this.options.readOnly || this.options.disabled;
    this.points = [];
    this.lastVelocity = 0;
    this.lastWidth = this.options.penWidth;
    this.signatureData = null;
    this.undoStack = [];
    this.redoStack = [];
    this.lastPointTime = 0;
    this.padId = 'sigpad-' + Math.random().toString(36).substr(2, 9);
    this.resizeObserver = null;
    this.isHighDPI = false;
  }

  /**
   * Initialize signature pad
   */
  init() {
    this.container = this.options.container;
    if (!this.container) {
      console.error('SignaturePad: container is required');
      return;
    }

    this.container.setAttribute('data-pad-id', this.padId);
    this.isReadOnly = this.options.readOnly || this.options.disabled;

    this.render();
    this.setupCanvas();
    this.bindEvents();

    console.log('✅ SignaturePad initialized');
  }

  /**
   * Render signature pad UI
   */
  render() {
    this.container.innerHTML = `
      <div class="signature-pad ${this.isReadOnly ? 'signature-pad--readonly' : ''}" 
           id="sigpad-${this.padId}">
        
        <!-- Canvas Area -->
        <div class="signature-pad__canvas-wrapper" 
             style="${this.options.showBorder ? 'border:1px solid ' + this.options.borderColor + ';border-radius:' + this.options.borderRadius + 'px' : ''}">
          <canvas id="sig-canvas-${this.padId}" 
                  style="width:100%;height:${this.options.height}px;cursor:${this.isReadOnly ? 'default' : 'crosshair'};display:block;border-radius:${this.options.borderRadius - 4}px">
          </canvas>
          
          <!-- Placeholder -->
          <div class="signature-pad__placeholder" id="sig-placeholder-${this.padId}"
               style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:${this.options.placeholderColor};pointer-events:none;transition:opacity 0.3s">
            <span class="material-icons" style="font-size:48px;display:block;margin-bottom:8px">draw</span>
            <span style="font-size:14px;font-weight:500">${this.options.placeholder}</span>
          </div>

          <!-- Required Indicator -->
          ${this.options.required ? `
            <div class="signature-pad__required" style="position:absolute;top:8px;right:12px;color:#BA1A1A;font-size:11px;font-weight:600">
              * Wajib
            </div>
          ` : ''}

          <!-- Grid Overlay -->
          ${this.options.showGrid ? `
            <canvas id="sig-grid-${this.padId}" 
                    style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;opacity:0.5">
            </canvas>
          ` : ''}
        </div>

        <!-- Controls -->
        ${this.options.showControls && !this.isReadOnly ? `
          <div class="signature-pad__controls">
            <!-- Left Controls -->
            <div class="signature-pad__controls-left">
              ${this.options.showUndoRedo ? `
                <button type="button" class="btn btn-sm btn-ghost sig-btn" data-action="undo" 
                        disabled title="Undo (Ctrl+Z)">
                  <span class="material-icons">undo</span>
                  <span>Undo</span>
                </button>
                <button type="button" class="btn btn-sm btn-ghost sig-btn" data-action="redo" 
                        disabled title="Redo (Ctrl+Y)">
                  <span class="material-icons">redo</span>
                  <span>Redo</span>
                </button>
              ` : ''}
              ${this.options.showClear ? `
                <button type="button" class="btn btn-sm btn-ghost sig-btn" data-action="clear" 
                        disabled title="Hapus Tanda Tangan">
                  <span class="material-icons">delete</span>
                  <span>Hapus</span>
                </button>
              ` : ''}
            </div>

            <!-- Right Controls -->
            <div class="signature-pad__controls-right">
              ${this.options.showColorPicker ? `
                <div class="signature-pad__color-picker" title="Warna Pena">
                  <input type="color" id="sig-color-${this.padId}" 
                         value="${this.options.penColor}" 
                         style="width:32px;height:32px;border:none;border-radius:50%;cursor:pointer;padding:0;background:none">
                </div>
              ` : ''}
              ${this.options.showSizePicker ? `
                <div class="signature-pad__size-picker" title="Ukuran Pena">
                  <input type="range" id="sig-size-${this.padId}" 
                         min="1" max="8" value="${this.options.penWidth}" 
                         style="width:80px;accent-color:var(--md-sys-color-primary, #1976D2)">
                </div>
              ` : ''}
              ${this.options.showDownload ? `
                <button type="button" class="btn btn-sm btn-secondary sig-btn" data-action="download" 
                        ${this.isEmpty ? 'disabled' : ''} title="Download Tanda Tangan">
                  <span class="material-icons">download</span>
                </button>
              ` : ''}
              ${this.options.showUpload ? `
                <button type="button" class="btn btn-sm btn-ghost sig-btn" data-action="upload" 
                        title="Upload Tanda Tangan">
                  <span class="material-icons">upload</span>
                </button>
                <input type="file" id="sig-upload-${this.padId}" accept="image/*" style="display:none">
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Status Bar -->
        <div class="signature-pad__status" id="sig-status-${this.padId}">
          <span class="signature-pad__status-text">
            ${this.isEmpty ? 'Silakan tanda tangan di atas' : 'Tanda tangan tersimpan ✓'}
          </span>
        </div>
      </div>
    `;

    // Cache element references
    this.canvas = this.container.querySelector(`#sig-canvas-${this.padId}`);
    this.placeholder = this.container.querySelector(`#sig-placeholder-${this.padId}`);
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    
    // Setup grid if enabled
    if (this.options.showGrid) {
      this.gridCanvas = this.container.querySelector(`#sig-grid-${this.padId}`);
      if (this.gridCanvas) {
        this.gridCtx = this.gridCanvas.getContext('2d');
        this.drawGrid();
      }
    }
  }

  /**
   * Setup canvas with High DPI support
   */
  setupCanvas() {
    this.enableHighDPI();
    
    // Set background
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Set pen style
    this.ctx.strokeStyle = this.options.penColor;
    this.ctx.lineWidth = this.options.penWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.miterLimit = 10;

    // Save initial empty state
    const emptyState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.undoStack.push(emptyState);
  }

  /**
   * Enable High DPI for retina displays
   */
  enableHighDPI() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    if (rect.width === 0 || rect.height === 0) return;
    
    const displayWidth = rect.width;
    const displayHeight = this.options.height || rect.height;
    
    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    this.canvas.style.width = displayWidth + 'px';
    this.canvas.style.height = displayHeight + 'px';
    
    this.isHighDPI = dpr > 1;
    
    // Redraw grid if enabled
    if (this.options.showGrid && this.gridCanvas && this.gridCtx) {
      this.gridCanvas.width = displayWidth * dpr;
      this.gridCanvas.height = displayHeight * dpr;
      this.gridCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.drawGrid();
    }
  }

  /**
   * Draw grid
   */
  drawGrid() {
    if (!this.gridCtx) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = this.options.height || rect.height;
    const gridSize = this.options.gridSize;
    
    this.gridCtx.clearRect(0, 0, width, height);
    this.gridCtx.strokeStyle = this.options.gridColor;
    this.gridCtx.lineWidth = 0.5;
    
    // Vertical lines
    for (let x = gridSize; x < width; x += gridSize) {
      this.gridCtx.beginPath();
      this.gridCtx.moveTo(x, 0);
      this.gridCtx.lineTo(x, height);
      this.gridCtx.stroke();
    }
    
    // Horizontal lines
    for (let y = gridSize; y < height; y += gridSize) {
      this.gridCtx.beginPath();
      this.gridCtx.moveTo(0, y);
      this.gridCtx.lineTo(width, y);
      this.gridCtx.stroke();
    }
  }

  /**
   * Start drawing
   */
  startDrawing(event) {
    if (this.isReadOnly) return;
    
    event.preventDefault();
    this.isDrawing = true;
    this.isEmpty = false;

    const point = this.getPoint(event);
    this.points = [point];
    this.lastPointTime = point.time;

    this.ctx.beginPath();
    this.ctx.moveTo(point.x, point.y);
    
    // Draw initial dot
    this.ctx.fillStyle = this.options.penColor;
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, this.options.penWidth * this.options.dotSize / 4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = this.options.penColor;
    this.ctx.beginPath();
    this.ctx.moveTo(point.x, point.y);

    // Hide placeholder
    this.hidePlaceholder();

    // Save state for undo
    this.saveState();

    // Update status
    this.updateStatus('Menggambar...');

    if (this.options.onBegin) {
      this.options.onBegin();
    }

    this.updateButtons();
  }

  /**
   * Draw
   */
  draw(event) {
    if (!this.isDrawing || this.isReadOnly) return;
    event.preventDefault();

    const now = Date.now();
    if (now - this.lastPointTime < this.options.throttle) return;
    this.lastPointTime = now;

    const point = this.getPoint(event);
    
    if (point.x === this.points[this.points.length - 1]?.x && 
        point.y === this.points[this.points.length - 1]?.y) return;

    this.points.push(point);

    // Calculate velocity-based width
    if (this.points.length > 1) {
      const prevPoint = this.points[this.points.length - 2];
      const velocity = this.calculateVelocity(point, prevPoint);
      const width = this.calculateWidth(velocity);
      this.ctx.lineWidth = width;
    }

    // Draw smooth curve
    if (this.options.smoothing && this.points.length >= 3) {
      const p1 = this.points[this.points.length - 3];
      const p2 = this.points[this.points.length - 2];
      const p3 = point;

      const cp1x = (p1.x + p2.x) / 2;
      const cp1y = (p1.y + p2.y) / 2;
      const cp2x = (p2.x + p3.x) / 2;
      const cp2y = (p2.y + p3.y) / 2;

      this.ctx.quadraticCurveTo(p2.x, p2.y, cp2x, cp2y);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(cp2x, cp2y);
    } else if (this.points.length >= 2) {
      const prevPoint = this.points[this.points.length - 2];
      this.ctx.lineTo(point.x, point.y);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(point.x, point.y);
    }

    if (this.options.onDraw) {
      this.options.onDraw(point);
    }
    if (this.options.onChange) {
      this.options.onChange();
    }
  }

  /**
   * End drawing
   */
  endDrawing(event) {
    if (!this.isDrawing) return;
    
    event?.preventDefault();
    this.isDrawing = false;

    // Finish the line
    if (this.points.length > 0) {
      const lastPoint = this.points[this.points.length - 1];
      this.ctx.lineTo(lastPoint.x, lastPoint.y);
      this.ctx.stroke();
    }

    this.ctx.closePath();
    this.points = [];

    // Update status
    this.updateStatus('Tanda tangan tersimpan ✓');

    if (this.options.onEnd) {
      this.options.onEnd();
    }
    if (this.options.onChange) {
      this.options.onChange();
    }

    this.updateButtons();
  }

  /**
   * Get point from event (supports mouse, touch, stylus)
   */
  getPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = rect.width / (this.options.width || rect.width);
    const scaleY = rect.height / (this.options.height || rect.height);

    let clientX, clientY, pressure = 0.5;

    if (event.touches && event.touches.length > 0) {
      // Touch event
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
      pressure = event.touches[0].force || 0.5;
    } else if (event.changedTouches && event.changedTouches.length > 0) {
      clientX = event.changedTouches[0].clientX;
      clientY = event.changedTouches[0].clientY;
    } else {
      // Mouse/Pen event
      clientX = event.clientX;
      clientY = event.clientY;
      pressure = event.pressure || 0.5;
    }

    // Adjust for High DPI
    const dpr = this.isHighDPI ? (window.devicePixelRatio || 1) : 1;

    return {
      x: (clientX - rect.left) / scaleX,
      y: (clientY - rect.top) / scaleY,
      pressure: Math.max(0.1, Math.min(1, pressure)),
      time: Date.now()
    };
  }

  /**
   * Calculate velocity between two points
   */
  calculateVelocity(point, prevPoint) {
    const distance = Math.sqrt(
      Math.pow(point.x - prevPoint.x, 2) + 
      Math.pow(point.y - prevPoint.y, 2)
    );
    const time = Math.max(point.time - prevPoint.time, 1);
    return distance / time;
  }

  /**
   * Calculate pen width based on velocity
   */
  calculateWidth(velocity) {
    const { minWidth, maxWidth, velocityFilterWeight } = this.options;

    const newVelocity = velocityFilterWeight * velocity + 
                       (1 - velocityFilterWeight) * this.lastVelocity;

    const width = maxWidth - (newVelocity * (maxWidth - minWidth) / 8);

    this.lastVelocity = newVelocity;
    this.lastWidth = Math.max(minWidth, Math.min(maxWidth, width));

    return this.lastWidth;
  }

  /**
   * Save state for undo
   */
  saveState() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.undoStack.push(imageData);

    // Limit undo stack
    if (this.undoStack.length > this.options.maxUndoStack) {
      this.undoStack.shift();
    }

    // Clear redo stack on new action
    this.redoStack = [];

    this.updateButtons();
  }

  /**
   * Undo last stroke
   */
  undo() {
    if (this.undoStack.length <= 1) return;

    // Save current state to redo
    const currentState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.redoStack.push(currentState);

    // Remove current state
    this.undoStack.pop();

    // Restore previous state
    const previousState = this.undoStack[this.undoStack.length - 1];
    this.ctx.putImageData(previousState, 0, 0);

    // Check if empty
    this.isEmpty = this.isCanvasEmpty();
    
    if (this.isEmpty) {
      this.showPlaceholder();
      this.updateStatus('Silakan tanda tangan di atas');
    }

    this.updateButtons();

    if (this.options.onUndo) this.options.onUndo();
    if (this.options.onChange) this.options.onChange();
  }

  /**
   * Redo last undone stroke
   */
  redo() {
    if (this.redoStack.length === 0) return;

    // Save current state to undo
    const currentState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.undoStack.push(currentState);

    // Restore redo state
    const redoState = this.redoStack.pop();
    this.ctx.putImageData(redoState, 0, 0);

    this.isEmpty = false;
    this.hidePlaceholder();
    this.updateStatus('Tanda tangan tersimpan ✓');

    this.updateButtons();

    if (this.options.onRedo) this.options.onRedo();
    if (this.options.onChange) this.options.onChange();
  }

  /**
   * Clear signature completely
   */
  clear() {
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.isEmpty = true;
    this.showPlaceholder();
    this.undoStack = [];
    this.redoStack = [];

    // Save initial empty state
    const emptyState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.undoStack.push(emptyState);

    this.updateStatus('Silakan tanda tangan di atas');
    this.updateButtons();

    if (this.options.onClear) this.options.onClear();
    if (this.options.onChange) this.options.onChange();
  }

  /**
   * Check if canvas is empty
   */
  isCanvasEmpty() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const pixels = imageData.data;

    // Check alpha channel for any non-transparent pixels
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] !== 0) return false;
    }
    return true;
  }

  /**
   * Show placeholder
   */
  showPlaceholder() {
    if (this.placeholder) {
      this.placeholder.style.opacity = '1';
      this.placeholder.style.pointerEvents = 'none';
    }
  }

  /**
   * Hide placeholder
   */
  hidePlaceholder() {
    if (this.placeholder) {
      this.placeholder.style.opacity = '0';
      this.placeholder.style.pointerEvents = 'none';
    }
  }

  /**
   * Update status text
   */
  updateStatus(message) {
    const statusEl = this.container?.querySelector('.signature-pad__status-text');
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  /**
   * Update button states
   */
  updateButtons() {
    const btns = {
      'undo': this.undoStack.length <= 1,
      'redo': this.redoStack.length === 0,
      'clear': this.isEmpty,
      'download': this.isEmpty
    };

    Object.entries(btns).forEach(([action, disabled]) => {
      const btn = this.container?.querySelector(`[data-action="${action}"]`);
      if (btn) btn.disabled = disabled;
    });
  }

  /**
   * Set pen color
   */
  setPenColor(color) {
    this.options.penColor = color;
    this.ctx.strokeStyle = color;
  }

  /**
   * Set pen width
   */
  setPenWidth(width) {
    this.options.penWidth = parseInt(width);
    this.ctx.lineWidth = this.options.penWidth;
  }

  /**
   * Set read-only mode
   */
  setReadOnly(readOnly) {
    this.isReadOnly = readOnly;
    if (this.canvas) {
      this.canvas.style.cursor = readOnly ? 'default' : 'crosshair';
    }
    // Hide controls in read-only
    const controls = this.container?.querySelector('.signature-pad__controls');
    if (controls) {
      controls.style.display = readOnly ? 'none' : '';
    }
  }

  /**
   * Get signature as Data URL
   */
  toDataURL(type = 'image/png', quality = 1) {
    if (this.isEmpty) return null;

    // Create temp canvas for export (without grid)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Fill white background
    tempCtx.fillStyle = this.options.backgroundColor;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw signature
    tempCtx.drawImage(this.canvas, 0, 0);
    
    return tempCanvas.toDataURL(type, quality);
  }

  /**
   * Get signature as Blob
   */
  toBlob(type = 'image/png', quality = 1) {
    return new Promise((resolve, reject) => {
      if (this.isEmpty) {
        resolve(null);
        return;
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.canvas.width;
      tempCanvas.height = this.canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.fillStyle = this.options.backgroundColor;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(this.canvas, 0, 0);

      tempCanvas.toBlob((blob) => {
        resolve(blob);
      }, type, quality);
    });
  }

  /**
   * Get signature as File
   */
  async toFile(fileName) {
    const blob = await this.toBlob();
    if (!blob) return null;
    return new File([blob], fileName || `signature-${Date.now()}.png`, { type: 'image/png' });
  }

  /**
   * Get signature as Base64 string (without data URL prefix)
   */
  toBase64() {
    const dataUrl = this.toDataURL();
    if (!dataUrl) return null;
    return dataUrl.split(',')[1];
  }

  /**
   * Load signature from Data URL
   */
  fromDataURL(dataURL) {
    if (!dataURL) return;

    const img = new Image();
    img.onload = () => {
      // Clear canvas
      this.ctx.fillStyle = this.options.backgroundColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw loaded signature
      this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
      
      this.isEmpty = false;
      this.hidePlaceholder();
      this.updateStatus('Tanda tangan dimuat ✓');
      this.updateButtons();
      
      // Save state
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      this.undoStack = [imageData];
      this.redoStack = [];

      if (this.options.onLoad) this.options.onLoad();
      if (this.options.onChange) this.options.onChange();
    };
    img.onerror = () => {
      this.showToast('Gagal memuat tanda tangan', 'error');
    };
    img.src = dataURL;
  }

  /**
   * Load signature from File
   */
  async fromFile(file) {
    if (!file) return;
    
    try {
      const dataUrl = await this.readFileAsDataURL(file);
      this.fromDataURL(dataUrl);
    } catch (error) {
      this.showToast('Gagal memuat file tanda tangan', 'error');
    }
  }

  /**
   * Read file as Data URL
   */
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Download signature
   */
  download(fileName) {
    const dataUrl = this.toDataURL();
    if (!dataUrl) {
      this.showToast('Tanda tangan masih kosong', 'warning');
      return;
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName || `ttd-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast('Tanda tangan berhasil didownload', 'success');
  }

  /**
   * Validate signature (for required fields)
   */
  validate() {
    if (this.options.required && this.isEmpty) {
      return { valid: false, error: this.options.requiredMessage };
    }
    return { valid: true };
  }

  /**
   * Resize canvas
   */
  resize(width, height) {
    const imageData = this.toDataURL();
    
    if (width) this.options.width = width;
    if (height) this.options.height = height;
    
    if (imageData) {
      this.fromDataURL(imageData);
    } else {
      this.setupCanvas();
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    if (typeof Toast !== 'undefined') {
      Toast.show(message, type);
    } else if (typeof NotificationService !== 'undefined') {
      NotificationService.show(message, type);
    }
  }

  /**
   * Bind all events
   */
  bindEvents() {
    if (!this.canvas || this.isReadOnly) return;

    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', (e) => this.endDrawing(e));
    this.canvas.addEventListener('mouseleave', (e) => this.endDrawing(e));
    this.canvas.addEventListener('mouseenter', (e) => {
      if (e.buttons === 1) this.startDrawing(e);
    });

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => this.startDrawing(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.draw(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.endDrawing(e));
    this.canvas.addEventListener('touchcancel', (e) => this.endDrawing(e));

    // Prevent scrolling on touch
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.target === this.canvas && e.cancelable) {
        e.preventDefault();
      }
    }, { passive: false });

    // Prevent context menu on long press
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Button controls (event delegation)
    this.container.addEventListener('click', (e) => {
      const btn = e.target.closest('.sig-btn');
      if (!btn) return;

      const action = btn.dataset.action;
      
      switch (action) {
        case 'undo': this.undo(); break;
        case 'redo': this.redo(); break;
        case 'clear': this.clear(); break;
        case 'download': this.download(); break;
        case 'upload': 
          const uploadInput = this.container.querySelector(`#sig-upload-${this.padId}`);
          if (uploadInput) uploadInput.click();
          break;
      }
    });

    // Color picker
    const colorPicker = this.container.querySelector(`#sig-color-${this.padId}`);
    if (colorPicker) {
      colorPicker.addEventListener('change', (e) => this.setPenColor(e.target.value));
      colorPicker.addEventListener('input', (e) => this.setPenColor(e.target.value));
    }

    // Size picker
    const sizePicker = this.container.querySelector(`#sig-size-${this.padId}`);
    if (sizePicker) {
      sizePicker.addEventListener('input', (e) => this.setPenWidth(e.target.value));
    }

    // Upload input
    const uploadInput = this.container.querySelector(`#sig-upload-${this.padId}`);
    if (uploadInput) {
      uploadInput.addEventListener('change', () => {
        if (uploadInput.files[0]) {
          this.fromFile(uploadInput.files[0]);
          uploadInput.value = '';
        }
      });
    }

    // Keyboard shortcuts
    const handleKeyboard = (e) => {
      if (!this.container.contains(document.activeElement) && 
          document.activeElement !== this.canvas) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        this.redo();
      } else if (e.key === 'Delete' || e.key === 'Escape') {
        if (e.key === 'Delete') {
          e.preventDefault();
          this.clear();
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    this._keyboardHandler = handleKeyboard;

    // Resize observer for responsive canvas
    this.resizeObserver = new ResizeObserver(() => {
      this.enableHighDPI();
    });
    this.resizeObserver.observe(this.canvas);
  }

  /**
   * Unbind events
   */
  unbindEvents() {
    if (this._keyboardHandler) {
      document.removeEventListener('keydown', this._keyboardHandler);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  /**
   * Destroy signature pad
   */
  destroy() {
    this.unbindEvents();
    this.undoStack = [];
    this.redoStack = [];
    if (this.container) {
      this.container.innerHTML = '';
      this.container.removeAttribute('data-pad-id');
    }
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SignaturePad };
}
