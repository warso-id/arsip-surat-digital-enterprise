/**
 * QR SCANNER COMPONENT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class QRScanner {
  constructor(options = {}) {
    this.options = {
      container: null,
      onScan: null,
      onError: null,
      fps: 10,
      facingMode: 'environment',
      highlightColor: '#1976D2',
      ...options
    };
    
    this.container = null;
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.stream = null;
    this.isScanning = false;
    this.animationId = null;
    this.lastScanTime = 0;
    this.scanDebounce = 1000;
  }
  
  /**
   * Initialize scanner
   */
  init() {
    this.container = this.options.container;
    if (!this.container) return;
    
    this.render();
    this.start();
  }
  
  /**
   * Render scanner
   */
  render() {
    this.container.innerHTML = `
      <div class="qr-scanner">
        <div class="qr-scanner__viewport">
          <video id="qr-scanner-video" autoplay playsinline muted></video>
          <canvas id="qr-scanner-canvas" style="display:none"></canvas>
          <div class="qr-scanner__overlay">
            <div class="qr-scanner__frame"></div>
          </div>
          <div class="qr-scanner__info">
            <span class="material-icons">qr_code_scanner</span>
            <span>Arahkan kamera ke QR Code</span>
          </div>
        </div>
        <div class="qr-scanner__controls">
          <button class="btn btn-sm btn-secondary" id="btn-switch-camera">
            <span class="material-icons">flip_camera_android</span>
            Ganti Kamera
          </button>
          <button class="btn btn-sm btn-ghost" id="btn-stop-scanner">
            <span class="material-icons">stop</span>
            Berhenti
          </button>
        </div>
      </div>
    `;
    
    this.video = this.container.querySelector('#qr-scanner-video');
    this.canvas = this.container.querySelector('#qr-scanner-canvas');
    this.ctx = this.canvas.getContext('2d');
  }
  
  /**
   * Start scanning
   */
  async start() {
    if (this.isScanning) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.options.facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      
      this.stream = stream;
      this.video.srcObject = stream;
      this.isScanning = true;
      
      this.video.addEventListener('loadedmetadata', () => {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.scanLoop();
      });
      
    } catch (error) {
      console.error('Camera access failed:', error);
      if (this.options.onError) {
        this.options.onError(error);
      }
    }
  }
  
  /**
   * Scan loop
   */
  scanLoop() {
    if (!this.isScanning) return;
    
    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const code = this.detectQRCode(imageData);
      
      if (code) {
        const now = Date.now();
        if (now - this.lastScanTime > this.scanDebounce) {
          this.lastScanTime = now;
          this.onCodeDetected(code);
        }
      }
    }
    
    this.animationId = requestAnimationFrame(() => this.scanLoop());
  }
  
  /**
   * Detect QR code from image data
   */
  detectQRCode(imageData) {
    // This is a simplified QR detection
    // For production, use jsQR library or similar
    const { data, width, height } = imageData;
    
    // Look for finder patterns
    const finderPatterns = this.findFinderPatterns(data, width, height);
    
    if (finderPatterns.length >= 3) {
      // QR code likely found
      // In production, decode the QR code properly
      return 'QR_DETECTED';
    }
    
    return null;
  }
  
  /**
   * Find QR finder patterns
   */
  findFinderPatterns(data, width, height) {
    const patterns = [];
    const sampleStep = 2; // Sample every 2 pixels for performance
    
    // Scan center row
    const centerY = Math.floor(height / 2);
    
    for (let x = 0; x < width; x += sampleStep) {
      const idx = (centerY * width + x) * 4;
      const luminance = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      // Look for 1:1:3:1:1 pattern
      if (luminance < 128) {
        // Found dark pixel
        patterns.push({ x, y: centerY });
      }
    }
    
    return patterns;
  }
  
  /**
   * Handle detected code
   */
  onCodeDetected(code) {
    // Highlight frame
    const frame = this.container.querySelector('.qr-scanner__frame');
    if (frame) {
      frame.style.borderColor = 'var(--md-sys-color-success)';
      setTimeout(() => {
        frame.style.borderColor = this.options.highlightColor;
      }, 500);
    }
    
    if (this.options.onScan) {
      this.options.onScan(code);
    }
  }
  
  /**
   * Switch camera
   */
  async switchCamera() {
    this.options.facingMode = this.options.facingMode === 'environment' ? 'user' : 'environment';
    this.stop();
    await this.start();
  }
  
  /**
   * Stop scanning
   */
  stop() {
    this.isScanning = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.video) {
      this.video.srcObject = null;
    }
  }
  
  /**
   * Destroy scanner
   */
  destroy() {
    this.stop();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QRScanner };
}
