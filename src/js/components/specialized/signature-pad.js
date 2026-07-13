/**
 * SIGNATURE PAD COMPONENT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Digital signature canvas for TTD
 */

class SignaturePad {
  constructor(options = {}) {
    this.options = {
      container: null,
      width: 400,
      height: 200,
      penColor: '#000000',
      backgroundColor: '#FFFFFF',
      penWidth: 2,
      minWidth: 0.5,
      maxWidth: 2.5,
      velocityFilterWeight: 0.7,
      onBegin: null,
      onEnd: null,
      onChange: null,
      ...options
    };
    
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.isDrawing = false;
    this.isEmpty = true;
    this.points = [];
    this.lastVelocity = 0;
    this.lastWidth = this.options.penWidth;
    this.signatureData = null;
    this.undoStack = [];
    this.redoStack = [];
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
    
    this.render();
    this.setupCanvas();
    this.bindEvents();
  }
  
  /**
   * Render signature pad
   */
  render() {
    this.container.innerHTML = `
      <div class="signature-pad">
        <div class="signature-pad__canvas-wrapper">
          <canvas id="signature-canvas"></canvas>
          <div class="signature-pad__placeholder" id="signature-placeholder">
            <span class="material-icons">draw</span>
            <span>Tanda tangan di sini</span>
          </div>
        </div>
        <div class="signature-pad__actions">
          <button type="button" class="btn btn-sm btn-ghost" id="btn-undo" disabled>
            <span class="material-icons">undo</span>
            Undo
          </button>
          <button type="button" class="btn btn-sm btn-ghost" id="btn-redo" disabled>
            <span class="material-icons">redo</span>
            Redo
          </button>
          <button type="button" class="btn btn-sm btn-ghost" id="btn-clear" disabled>
            <span class="material-icons">delete</span>
            Hapus
          </button>
          <div class="signature-pad__color-picker">
            <input type="color" id="pen-color" value="${this.options.penColor}" title="Warna Pena">
          </div>
          <div class="signature-pad__size-picker">
            <input type="range" id="pen-size" min="1" max="5" value="${this.options.penWidth}" title="Ukuran Pena">
          </div>
        </div>
      </div>
    `;
    
    this.canvas = this.container.querySelector('#signature-canvas');
    this.placeholder = this.container.querySelector('#signature-placeholder');
  }
  
  /**
   * Setup canvas
   */
  setupCanvas() {
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    this.ctx = this.canvas.getContext('2d');
    
    // Set background
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Set pen style
    this.ctx.strokeStyle = this.options.penColor;
    this.ctx.lineWidth = this.options.penWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // Enable high DPI
    this.enableHighDPI();
  }
  
  /**
   * Enable high DPI for retina displays
   */
  enableHighDPI() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }
  
  /**
   * Start drawing
   */
  startDrawing(event) {
    event.preventDefault();
    
    this.isDrawing = true;
    this.isEmpty = false;
    
    const point = this.getPoint(event);
    this.points = [point];
    
    this.ctx.beginPath();
    this.ctx.moveTo(point.x, point.y);
    
    // Hide placeholder
    this.placeholder.style.display = 'none';
    
    // Save state for undo
    this.saveState();
    
    if (this.options.onBegin) {
      this.options.onBegin();
    }
    
    this.updateButtons();
  }
  
  /**
   * Draw
   */
  draw(event) {
    if (!this.isDrawing) return;
    event.preventDefault();
    
    const point = this.getPoint(event);
    this.points.push(point);
    
    // Calculate velocity
    if (this.points.length > 1) {
      const prevPoint = this.points[this.points.length - 2];
      const velocity = this.calculateVelocity(point, prevPoint);
      
      // Smooth width based on velocity
      const width = this.calculateWidth(velocity);
      
      this.ctx.lineWidth = width;
    }
    
    // Draw curve
    if (this.points.length >= 3) {
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
    
    this.isDrawing = false;
    
    // Finish the line
    if (this.points.length > 1) {
      const lastPoint = this.points[this.points.length - 1];
      this.ctx.lineTo(lastPoint.x, lastPoint.y);
      this.ctx.stroke();
    }
    
    this.ctx.closePath();
    this.points = [];
    
    if (this.options.onEnd) {
      this.options.onEnd();
    }
    
    this.updateButtons();
  }
  
  /**
   * Get point from event
   */
  getPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    
    let clientX, clientY;
    
    if (event.touches) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
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
    const time = point.time - prevPoint.time;
    
    return time > 0 ? distance / time : 0;
  }
  
  /**
   * Calculate pen width based on velocity
   */
  calculateWidth(velocity) {
    const { minWidth, maxWidth, velocityFilterWeight } = this.options;
    
    const newVelocity = velocityFilterWeight * velocity + 
                       (1 - velocityFilterWeight) * this.lastVelocity;
    
    const width = maxWidth - (newVelocity * (maxWidth - minWidth) / 5);
    
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
    if (this.undoStack.length > 20) {
      this.undoStack.shift();
    }
    
    // Clear redo stack
    this.redoStack = [];
  }
  
  /**
   * Undo
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
      this.placeholder.style.display = 'flex';
    }
    
    this.updateButtons();
    
    if (this.options.onChange) {
      this.options.onChange();
    }
  }
  
  /**
   * Redo
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
    this.placeholder.style.display = 'none';
    
    this.updateButtons();
    
    if (this.options.onChange) {
      this.options.onChange();
    }
  }
  
  /**
   * Clear signature
   */
  clear() {
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.isEmpty = true;
    this.placeholder.style.display = 'flex';
    this.undoStack = [];
    this.redoStack = [];
    
    // Save initial empty state
    const emptyState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.undoStack.push(emptyState);
    
    this.updateButtons();
    
    if (this.options.onChange) {
      this.options.onChange();
    }
  }
  
  /**
   * Check if canvas is empty
   */
  isCanvasEmpty() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const pixels = imageData.data;
    
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] !== 0) return false;
    }
    
    return true;
  }
  
  /**
   * Get signature data
   */
  toDataURL(type = 'image/png', quality = 1) {
    return this.isEmpty ? null : this.canvas.toDataURL(type, quality);
  }
  
  /**
   * Get signature as blob
   */
  toBlob(type = 'image/png', quality = 1) {
    return new Promise((resolve) => {
      if (this.isEmpty) {
        resolve(null);
        return;
      }
      
      this.canvas.toBlob((blob) => {
        resolve(blob);
      }, type, quality);
    });
  }
  
  /**
   * Get signature as file
   */
  async toFile(fileName = 'signature.png') {
    const blob = await this.toBlob();
    if (!blob) return null;
    return new File([blob], fileName, { type: 'image/png' });
  }
  
  /**
   * Load signature from data URL
   */
  fromDataURL(dataURL) {
    const img = new Image();
    img.onload = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(img, 0, 0);
      this.isEmpty = false;
      this.placeholder.style.display = 'none';
      this.updateButtons();
    };
    img.src = dataURL;
  }
  
  /**
   * Resize canvas
   */
  resize(width, height) {
    const imageData = this.toDataURL();
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    if (imageData) {
      this.fromDataURL(imageData);
    }
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
    this.options.penWidth = width;
  }
  
  /**
   * Update button states
   */
  updateButtons() {
    const btnUndo = this.container.querySelector('#btn-undo');
    const btnRedo = this.container.querySelector('#btn-redo');
    const btnClear = this.container.querySelector('#btn-clear');
    
    if (btnUndo) btnUndo.disabled = this.undoStack.length <= 1;
    if (btnRedo) btnRedo.disabled = this.redoStack.length === 0;
    if (btnClear) btnClear.disabled = this.isEmpty;
  }
  
  /**
   * Bind events
   */
  bindEvents() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', (e) => this.endDrawing(e));
    this.canvas.addEventListener('mouseleave', (e) => this.endDrawing(e));
    
    // Touch events
    this.canvas.addEventListener('touchstart', (e) => this.startDrawing(e));
    this.canvas.addEventListener('touchmove', (e) => this.draw(e));
    this.canvas.addEventListener('touchend', (e) => this.endDrawing(e));
    
    // Prevent scrolling on touch
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.target === this.canvas) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Buttons
    this.container.querySelector('#btn-undo')?.addEventListener('click', () => this.undo());
    this.container.querySelector('#btn-redo')?.addEventListener('click', () => this.redo());
    this.container.querySelector('#btn-clear')?.addEventListener('click', () => this.clear());
    
    // Color picker
    this.container.querySelector('#pen-color')?.addEventListener('change', (e) => {
      this.setPenColor(e.target.value);
    });
    
    // Size picker
    this.container.querySelector('#pen-size')?.addEventListener('input', (e) => {
      this.setPenWidth(parseInt(e.target.value));
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.container.contains(document.activeElement)) return;
      
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        this.undo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        this.redo();
      } else if (e.key === 'Delete') {
        this.clear();
      }
    });
    
    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      this.enableHighDPI();
    });
    resizeObserver.observe(this.canvas);
    
    // Save initial empty state
    const emptyState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.undoStack.push(emptyState);
  }
}
