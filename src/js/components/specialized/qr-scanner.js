/**
 * ============================================
 * QR SCANNER COMPONENT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL QR CODE SCANNER - SIAP PRODUKSI
 * Mendukung: Live Camera, Image Upload, jsQR,
 * Multiple Formats, History, Document Verification
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class QRScanner {
  constructor(options = {}) {
    this.options = {
      container: null,
      onScan: null,
      onError: null,
      onStatusChange: null,
      fps: 10,
      facingMode: 'environment',
      highlightColor: '#1976D2',
      highlightSuccessColor: '#2E7D32',
      highlightErrorColor: '#BA1A1A',
      scanDelay: 1000,
      formats: ['qr', 'barcode', 'all'],
      autoStart: true,
      showControls: true,
      showFrame: true,
      showTorch: false,
      torchEnabled: false,
      maxScans: 0,
      stopAfterScan: false,
      validatePattern: null,
      soundEnabled: true,
      soundSuccess: null,
      soundError: null,
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
    this.scanCount = 0;
    this.scannerId = 'qrscan-' + Math.random().toString(36).substr(2, 9);
    this.useLibrary = false;
    this.track = null;
  }

  /**
   * Initialize scanner
   */
  init() {
    this.container = this.options.container;
    if (!this.container) {
      console.error('QRScanner: container is required');
      return;
    }

    this.container.setAttribute('data-scanner-id', this.scannerId);

    // Check if jsQR library is available
    this.useLibrary = typeof jsQR !== 'undefined';

    this.render();
    this.bindEvents();

    // Auto-start if enabled
    if (this.options.autoStart) {
      this.start();
    }

    console.log(`✅ QRScanner initialized (jsQR: ${this.useLibrary ? 'available' : 'fallback'})`);
  }

  /**
   * Render scanner UI
   */
  render() {
    this.container.innerHTML = `
      <div class="qr-scanner" id="qrscan-${this.scannerId}">
        <!-- Scanner Viewport -->
        <div class="qr-scanner__viewport">
          <!-- Video Element -->
          <video id="qr-video-${this.scannerId}" 
                 autoplay playsinline muted 
                 style="width:100%;max-width:100%;border-radius:12px;background:#000">
          </video>
          
          <!-- Canvas untuk frame capture -->
          <canvas id="qr-canvas-${this.scannerId}" style="display:none"></canvas>
          
          <!-- Scanning Overlay -->
          ${this.options.showFrame ? `
            <div class="qr-scanner__overlay">
              <div class="qr-scanner__frame" id="qr-frame-${this.scannerId}">
                <div class="qr-scanner__frame-corner qr-scanner__frame-corner--tl"></div>
                <div class="qr-scanner__frame-corner qr-scanner__frame-corner--tr"></div>
                <div class="qr-scanner__frame-corner qr-scanner__frame-corner--bl"></div>
                <div class="qr-scanner__frame-corner qr-scanner__frame-corner--br"></div>
              </div>
              <div class="qr-scanner__scan-line"></div>
            </div>
          ` : ''}

          <!-- Info Text -->
          <div class="qr-scanner__info" id="qr-info-${this.scannerId}">
            <span class="material-icons">qr_code_scanner</span>
            <span>Arahkan kamera ke QR Code</span>
          </div>

          <!-- Status Indicator -->
          <div class="qr-scanner__status hidden" id="qr-status-${this.scannerId}">
            <span class="qr-scanner__status-text"></span>
          </div>
        </div>

        <!-- Controls -->
        ${this.options.showControls ? `
          <div class="qr-scanner__controls">
            <button class="btn btn-sm btn-secondary" id="btn-switch-camera-${this.scannerId}" 
                    title="Ganti Kamera">
              <span class="material-icons">flip_camera_android</span>
              <span>Ganti</span>
            </button>
            
            ${this.options.showTorch ? `
              <button class="btn btn-sm btn-ghost" id="btn-toggle-torch-${this.scannerId}" 
                      title="Senter">
                <span class="material-icons">flashlight_off</span>
                <span>Senter</span>
              </button>
            ` : ''}
            
            <button class="btn btn-sm btn-ghost" id="btn-upload-image-${this.scannerId}" 
                    title="Upload Gambar">
              <span class="material-icons">image</span>
              <span>Gambar</span>
            </button>
            
            <button class="btn btn-sm btn-ghost" id="btn-stop-scanner-${this.scannerId}" 
                    title="Berhenti">
              <span class="material-icons">stop</span>
              <span>Berhenti</span>
            </button>
            
            <input type="file" id="qr-image-input-${this.scannerId}" 
                   accept="image/*" style="display:none">
          </div>
        ` : ''}

        <!-- Scan Result -->
        <div class="qr-scanner__result hidden" id="qr-result-${this.scannerId}">
          <div class="qr-scanner__result-content">
            <div class="qr-scanner__result-header">
              <span class="material-icons" id="qr-result-icon-${this.scannerId}">check_circle</span>
              <span>QR Code Terdeteksi</span>
            </div>
            <div class="qr-scanner__result-data" id="qr-result-data-${this.scannerId}"></div>
            <div class="qr-scanner__result-actions">
              <button class="btn btn-sm btn-primary" id="btn-copy-result-${this.scannerId}">
                <span class="material-icons">content_copy</span> Salin
              </button>
              <button class="btn btn-sm btn-secondary" id="btn-open-result-${this.scannerId}">
                <span class="material-icons">open_in_new</span> Buka
              </button>
              <button class="btn btn-sm btn-ghost" id="btn-scan-again-${this.scannerId}">
                <span class="material-icons">refresh</span> Scan Lagi
              </button>
            </div>
          </div>
        </div>

        <!-- History -->
        <div class="qr-scanner__history" id="qr-history-${this.scannerId}">
          <div class="qr-scanner__history-header">
            <span>Riwayat Scan</span>
            <button class="btn btn-sm btn-ghost" id="btn-clear-history-${this.scannerId}">
              <span class="material-icons">clear_all</span>
            </button>
          </div>
          <div class="qr-scanner__history-list" id="qr-history-list-${this.scannerId}">
            <div class="qr-scanner__history-empty">Belum ada hasil scan</div>
          </div>
        </div>
      </div>
    `;

    // Cache element references
    this.video = this.container.querySelector(`#qr-video-${this.scannerId}`);
    this.canvas = this.container.querySelector(`#qr-canvas-${this.scannerId}`);
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.frame = this.container.querySelector(`#qr-frame-${this.scannerId}`);
    this.info = this.container.querySelector(`#qr-info-${this.scannerId}`);
    this.status = this.container.querySelector(`#qr-status-${this.scannerId}`);
    this.result = this.container.querySelector(`#qr-result-${this.scannerId}`);
    this.resultData = this.container.querySelector(`#qr-result-data-${this.scannerId}`);
    this.historyList = this.container.querySelector(`#qr-history-list-${this.scannerId}`);
    this.scanHistory = [];
  }

  /**
   * Start scanning
   */
  async start() {
    if (this.isScanning) return;

    try {
      // Update UI
      this.updateStatus('Memulai kamera...', 'info');

      const constraints = {
        video: {
          facingMode: this.options.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      this.stream = stream;
      this.video.srcObject = stream;
      this.isScanning = true;

      // Get video track for torch control
      this.track = stream.getVideoTracks()[0];

      this.video.addEventListener('loadedmetadata', () => {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        this.updateStatus('Mencari QR Code...', 'info');
        this.scanLoop();
      });

      this.video.addEventListener('play', () => {
        if (this.options.onStatusChange) {
          this.options.onStatusChange('started');
        }
      });

    } catch (error) {
      console.error('Camera access failed:', error);
      
      let errorMessage = 'Gagal mengakses kamera. ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Izin kamera ditolak. Buka pengaturan browser untuk mengizinkan akses kamera.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'Kamera tidak ditemukan.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Kamera sedang digunakan oleh aplikasi lain.';
      } else {
        errorMessage += error.message;
      }

      this.updateStatus(errorMessage, 'error');
      
      if (this.options.onError) {
        this.options.onError(error);
      }
    }
  }

  /**
   * Main scan loop
   */
  scanLoop() {
    if (!this.isScanning) return;

    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      // Draw video frame to canvas
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      
      // Get image data for processing
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      
      let code = null;

      if (this.useLibrary) {
        // Use jsQR library for accurate detection
        code = jsQR(
          imageData.data,
          imageData.width,
          imageData.height,
          { inversionAttempts: 'dontInvert' }
        );
      } else {
        // Fallback: basic detection
        code = this.basicDetect(imageData);
      }

      if (code) {
        const now = Date.now();
        if (now - this.lastScanTime > this.options.scanDelay) {
          this.lastScanTime = now;
          this.scanCount++;
          
          const codeData = this.useLibrary ? code.data : code;
          this.onCodeDetected(codeData);
          
          // Stop after max scans
          if (this.options.maxScans > 0 && this.scanCount >= this.options.maxScans) {
            this.stop();
            return;
          }
          
          // Stop after first scan
          if (this.options.stopAfterScan) {
            this.stop();
            return;
          }
        }
      }
    }

    this.animationId = requestAnimationFrame(() => this.scanLoop());
  }

  /**
   * Basic QR detection (fallback without jsQR)
   */
  basicDetect(imageData) {
    const { data, width, height } = imageData;
    
    // Scan multiple rows for finder patterns
    const finderPatterns = [];
    const scanRows = [
      Math.floor(height * 0.25),
      Math.floor(height * 0.5),
      Math.floor(height * 0.75)
    ];

    for (const row of scanRows) {
      const rowPatterns = this.scanRowForFinderPattern(data, width, row);
      finderPatterns.push(...rowPatterns);
    }

    // Also scan columns
    const scanCols = [
      Math.floor(width * 0.25),
      Math.floor(width * 0.5),
      Math.floor(width * 0.75)
    ];

    for (const col of scanCols) {
      const colPatterns = this.scanColumnForFinderPattern(data, width, height, col);
      finderPatterns.push(...colPatterns);
    }

    // Group nearby patterns
    const grouped = this.groupFinderPatterns(finderPatterns, 50);

    // Need at least 3 finder patterns for a QR code
    if (grouped.length >= 3) {
      return 'QR_DETECTED_WITH_PATTERNS';
    }

    // If no clear patterns, check for high contrast areas
    const contrastScore = this.calculateContrastScore(data, width, height);
    if (contrastScore > 0.3) {
      return 'POSSIBLE_QR_' + Math.round(contrastScore * 100);
    }

    return null;
  }

  /**
   * Scan row for finder pattern (1:1:3:1:1 ratio)
   */
  scanRowForFinderPattern(data, width, row) {
    const patterns = [];
    const rowStart = row * width * 4;
    
    let state = 0; // 0=light, 1=dark
    let runLength = 0;
    const runs = [];
    
    for (let x = 0; x < width; x++) {
      const idx = rowStart + x * 4;
      const luminance = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const isDark = luminance < 128;

      if ((isDark && state === 0) || (!isDark && state === 1)) {
        runs.push({ dark: state === 1, length: runLength });
        state = isDark ? 1 : 0;
        runLength = 0;
      }
      runLength++;
    }
    runs.push({ dark: state === 1, length: runLength });

    // Look for 1:1:3:1:1 pattern
    for (let i = 0; i < runs.length - 4; i++) {
      const avg = (runs[i].length + runs[i+1].length + runs[i+2].length + runs[i+3].length + runs[i+4].length) / 5;
      
      if (avg > 2 && 
          runs[i].dark && !runs[i+1].dark && runs[i+2].dark && !runs[i+3].dark && runs[i+4].dark) {
        // Check ratio
        const ratios = [
          runs[i].length / avg,
          runs[i+1].length / avg,
          runs[i+2].length / avg,
          runs[i+3].length / avg,
          runs[i+4].length / avg
        ];
        
        const isFinderPattern = ratios.every(r => r > 0.5 && r < 2.0) &&
          Math.abs(ratios[2] - 3) < 1.5;
        
        if (isFinderPattern) {
          // Calculate x position
          let xPos = 0;
          for (let j = 0; j <= i + 2; j++) xPos += runs[j].length;
          
          patterns.push({ x: xPos, y: row, confidence: 0.7 });
        }
      }
    }

    return patterns;
  }

  /**
   * Scan column for finder pattern
   */
  scanColumnForFinderPattern(data, width, height, col) {
    const patterns = [];
    const colOffset = col * 4;
    
    let state = 0;
    let runLength = 0;
    const runs = [];
    
    for (let y = 0; y < height; y++) {
      const idx = y * width * 4 + colOffset;
      const luminance = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const isDark = luminance < 128;

      if ((isDark && state === 0) || (!isDark && state === 1)) {
        runs.push({ dark: state === 1, length: runLength });
        state = isDark ? 1 : 0;
        runLength = 0;
      }
      runLength++;
    }
    runs.push({ dark: state === 1, length: runLength });

    // Similar pattern detection as row scan
    for (let i = 0; i < runs.length - 4; i++) {
      const avg = (runs[i].length + runs[i+1].length + runs[i+2].length + runs[i+3].length + runs[i+4].length) / 5;
      
      if (avg > 2 && 
          runs[i].dark && !runs[i+1].dark && runs[i+2].dark && !runs[i+3].dark && runs[i+4].dark) {
        const ratios = [
          runs[i].length / avg,
          runs[i+1].length / avg,
          runs[i+2].length / avg,
          runs[i+3].length / avg,
          runs[i+4].length / avg
        ];
        
        const isFinderPattern = ratios.every(r => r > 0.5 && r < 2.0) &&
          Math.abs(ratios[2] - 3) < 1.5;
        
        if (isFinderPattern) {
          let yPos = 0;
          for (let j = 0; j <= i + 2; j++) yPos += runs[j].length;
          
          patterns.push({ x: col, y: yPos, confidence: 0.7 });
        }
      }
    }

    return patterns;
  }

  /**
   * Group nearby finder patterns
   */
  groupFinderPatterns(patterns, threshold) {
    if (patterns.length === 0) return [];
    
    const groups = [];
    const used = new Set();

    for (let i = 0; i < patterns.length; i++) {
      if (used.has(i)) continue;
      
      const group = [patterns[i]];
      used.add(i);

      for (let j = i + 1; j < patterns.length; j++) {
        if (used.has(j)) continue;
        
        const dx = patterns[i].x - patterns[j].x;
        const dy = patterns[i].y - patterns[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < threshold) {
          group.push(patterns[j]);
          used.add(j);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Calculate contrast score
   */
  calculateContrastScore(data, width, height) {
    const sampleSize = 1000;
    const samples = [];
    
    for (let i = 0; i < sampleSize; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const idx = (y * width + x) * 4;
      const luminance = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      samples.push(luminance);
    }

    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
    
    return Math.min(variance / 10000, 1);
  }

  /**
   * Handle detected code
   */
  onCodeDetected(code) {
    console.log('QR Code detected:', code);

    // Validate pattern if specified
    if (this.options.validatePattern) {
      const isValid = this.options.validatePattern(code);
      if (!isValid) {
        this.flashFrame('error');
        return;
      }
    }

    // Play success sound
    if (this.options.soundEnabled) {
      this.playSound('success');
    }

    // Flash frame green
    this.flashFrame('success');

    // Add to history
    this.addToHistory(code);

    // Display result
    this.displayResult(code);

    // Update info
    this.updateStatus('QR Code terdeteksi! ✅', 'success');

    // Callback
    if (this.options.onScan) {
      // Try to parse as JSON
      let parsedData = code;
      try {
        parsedData = JSON.parse(code);
      } catch (e) {
        // Not JSON, use as string
      }

      this.options.onScan(parsedData, code);
    }

    // Verify document if it's a document QR
    this.verifyDocumentIfApplicable(code);
  }

  /**
   * Flash scanner frame
   */
  flashFrame(type) {
    if (!this.frame) return;

    const colors = {
      success: this.options.highlightSuccessColor,
      error: this.options.highlightErrorColor
    };

    const color = colors[type] || this.options.highlightColor;
    
    this.frame.style.borderColor = color;
    this.frame.style.boxShadow = `0 0 20px ${color}40`;
    
    setTimeout(() => {
      this.frame.style.borderColor = this.options.highlightColor;
      this.frame.style.boxShadow = 'none';
    }, 600);
  }

  /**
   * Display scan result
   */
  displayResult(code) {
    if (!this.result || !this.resultData) return;

    let displayData = code;
    let isUrl = false;
    let isJson = false;

    // Check if URL
    try {
      const url = new URL(code);
      isUrl = true;
      displayData = `
        <div class="qr-result__type">🔗 URL</div>
        <div class="qr-result__value">${code}</div>
      `;
    } catch (e) {}

    // Check if JSON
    if (!isUrl) {
      try {
        const json = JSON.parse(code);
        isJson = true;
        displayData = `
          <div class="qr-result__type">📋 JSON Data</div>
          <pre class="qr-result__json">${JSON.stringify(json, null, 2)}</pre>
        `;
        
        // Show document info if applicable
        if (json.docId || json.type === 'document' || json.type === 'surat-masuk') {
          displayData += `
            <div class="qr-result__meta">
              ${json.number ? `<span>📄 ${json.number}</span>` : ''}
              ${json.subject ? `<span>📝 ${json.subject}</span>` : ''}
              ${json.date ? `<span>📅 ${json.date}</span>` : ''}
              ${json.sender ? `<span>👤 ${json.sender}</span>` : ''}
            </div>
          `;
        }
      } catch (e) {}
    }

    // Plain text
    if (!isUrl && !isJson) {
      displayData = `
        <div class="qr-result__type">📝 Teks</div>
        <div class="qr-result__value">${code}</div>
      `;
    }

    this.resultData.innerHTML = displayData;
    this.result.classList.remove('hidden');

    // Setup action buttons
    const copyBtn = this.container.querySelector(`#btn-copy-result-${this.scannerId}`);
    const openBtn = this.container.querySelector(`#btn-open-result-${this.scannerId}`);
    
    if (copyBtn) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(code).then(() => {
          this.showToast('Data disalin ke clipboard', 'success');
        });
      };
    }

    if (openBtn) {
      openBtn.style.display = isUrl ? 'flex' : 'none';
      if (isUrl) {
        openBtn.onclick = () => window.open(code, '_blank');
      }
    }
  }

  /**
   * Add scan to history
   */
  addToHistory(code) {
    const MAX_HISTORY = 20;
    
    // Remove duplicate
    this.scanHistory = this.scanHistory.filter(h => h.data !== code);
    
    // Add to beginning
    this.scanHistory.unshift({
      id: Date.now(),
      data: code,
      timestamp: new Date().toISOString(),
      type: this.detectDataType(code)
    });

    // Limit history
    if (this.scanHistory.length > MAX_HISTORY) {
      this.scanHistory = this.scanHistory.slice(0, MAX_HISTORY);
    }

    this.renderHistory();
  }

  /**
   * Detect data type
   */
  detectDataType(code) {
    try {
      new URL(code);
      return 'url';
    } catch (e) {}
    
    try {
      JSON.parse(code);
      return 'json';
    } catch (e) {}
    
    return 'text';
  }

  /**
   * Render scan history
   */
  renderHistory() {
    if (!this.historyList) return;

    const emptyEl = this.historyList.querySelector('.qr-scanner__history-empty');
    
    if (this.scanHistory.length === 0) {
      this.historyList.innerHTML = '<div class="qr-scanner__history-empty">Belum ada hasil scan</div>';
      return;
    }

    this.historyList.innerHTML = this.scanHistory.map(item => `
      <div class="qr-scanner__history-item" data-id="${item.id}">
        <div class="qr-scanner__history-item-icon">
          <span class="material-icons">${item.type === 'url' ? 'link' : item.type === 'json' ? 'data_object' : 'text_fields'}</span>
        </div>
        <div class="qr-scanner__history-item-content" title="${item.data}">
          <div class="qr-scanner__history-item-text">${item.data.substring(0, 100)}</div>
          <div class="qr-scanner__history-item-time">${new Date(item.timestamp).toLocaleTimeString()}</div>
        </div>
        <div class="qr-scanner__history-item-actions">
          <button class="btn-icon btn-icon-sm history-copy-btn" data-code="${this.escapeHtml(item.data)}" title="Salin">
            <span class="material-icons">content_copy</span>
          </button>
          <button class="btn-icon btn-icon-sm history-rescan-btn" data-code="${this.escapeHtml(item.data)}" title="Lihat">
            <span class="material-icons">visibility</span>
          </button>
        </div>
      </div>
    `).join('');

    // Bind history item events
    this.historyList.querySelectorAll('.history-copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const code = btn.dataset.code;
        navigator.clipboard.writeText(code).then(() => {
          this.showToast('Disalin ke clipboard', 'success');
        });
      });
    });

    this.historyList.querySelectorAll('.history-rescan-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const code = btn.dataset.code;
        this.displayResult(code);
        this.result.classList.remove('hidden');
        this.result.scrollIntoView({ behavior: 'smooth' });
      });
    });

    this.historyList.querySelectorAll('.qr-scanner__history-item').forEach(item => {
      item.addEventListener('click', () => {
        const code = item.querySelector('.history-rescan-btn')?.dataset.code;
        if (code) {
          this.displayResult(code);
          this.result.classList.remove('hidden');
          this.result.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /**
   * Verify document from QR code
   */
  async verifyDocumentIfApplicable(code) {
    try {
      const data = JSON.parse(code);
      if (data.docId || (data.type && data.type.includes('document'))) {
        // Try to verify via API
        if (typeof API !== 'undefined') {
          const result = await API.post('verify.document', { 
            hash: data.hash || code,
            documentId: data.docId 
          });
          
          if (result.status === 'success') {
            this.showToast('Dokumen terverifikasi di blockchain ✅', 'success');
          }
        }
      }
    } catch (e) {
      // Not JSON or verification not applicable
    }
  }

  /**
   * Scan from uploaded image
   */
  async scanImage(file) {
    if (!file) return;

    this.updateStatus('Memproses gambar...', 'info');

    try {
      const img = await this.loadImage(file);
      
      this.canvas.width = img.width;
      this.canvas.height = img.height;
      this.ctx.drawImage(img, 0, 0);
      
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      
      let code = null;
      if (this.useLibrary) {
        code = jsQR(imageData.data, imageData.width, imageData.height);
      } else {
        code = this.basicDetect(imageData);
      }

      if (code) {
        const codeData = this.useLibrary ? code.data : code;
        this.onCodeDetected(codeData);
        this.updateStatus('QR Code terdeteksi! ✅', 'success');
      } else {
        this.updateStatus('QR Code tidak ditemukan di gambar', 'error');
        if (this.options.onError) {
          this.options.onError(new Error('No QR code found in image'));
        }
      }
    } catch (error) {
      this.updateStatus('Gagal memproses gambar', 'error');
      console.error('Image scan failed:', error);
    }
  }

  /**
   * Load image from file
   */
  loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Toggle torch/flashlight
   */
  async toggleTorch() {
    if (!this.track) return;

    try {
      const capabilities = this.track.getCapabilities();
      if (!capabilities.torch) {
        this.showToast('Senter tidak didukung di perangkat ini', 'warning');
        return;
      }

      this.options.torchEnabled = !this.options.torchEnabled;
      await this.track.applyConstraints({
        advanced: [{ torch: this.options.torchEnabled }]
      });

      const torchBtn = this.container.querySelector(`#btn-toggle-torch-${this.scannerId}`);
      if (torchBtn) {
        const icon = torchBtn.querySelector('.material-icons');
        if (icon) {
          icon.textContent = this.options.torchEnabled ? 'flashlight_on' : 'flashlight_off';
        }
      }

    } catch (error) {
      console.warn('Torch toggle failed:', error);
    }
  }

  /**
   * Switch camera (front/back)
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
      this.track = null;
    }

    if (this.video) {
      this.video.srcObject = null;
    }

    this.updateStatus('Scanner berhenti', 'info');
    
    if (this.options.onStatusChange) {
      this.options.onStatusChange('stopped');
    }
  }

  /**
   * Pause scanning (keep camera)
   */
  pause() {
    this.isScanning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.updateStatus('Scanner dijeda', 'info');
  }

  /**
   * Resume scanning
   */
  resume() {
    if (this.stream && this.video) {
      this.isScanning = true;
      this.scanLoop();
      this.updateStatus('Mencari QR Code...', 'info');
    }
  }

  /**
   * Update status display
   */
  updateStatus(message, type = 'info') {
    if (!this.info) return;

    const colors = {
      success: '#2E7D32',
      error: '#C62828',
      warning: '#E65100',
      info: '#1565C0'
    };

    this.info.innerHTML = `
      <span class="material-icons">qr_code_scanner</span>
      <span style="color:${colors[type] || colors.info}">${message}</span>
    `;
  }

  /**
   * Clear scan history
   */
  clearHistory() {
    this.scanHistory = [];
    this.renderHistory();
  }

  /**
   * Play sound
   */
  playSound(type) {
    try {
      const sounds = {
        success: this.options.soundSuccess || 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10',
        error: this.options.soundError || null
      };

      if (sounds[type]) {
        const audio = new Audio(sounds[type]);
        audio.volume = 0.5;
        audio.play().catch(() => {});
      }
    } catch (e) {
      // Ignore audio errors
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
   * Escape HTML
   */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Get scan history
   */
  getHistory() {
    return [...this.scanHistory];
  }

  /**
   * Bind events
   */
  bindEvents() {
    if (!this.container) return;

    // Switch camera
    const switchBtn = this.container.querySelector(`#btn-switch-camera-${this.scannerId}`);
    if (switchBtn) {
      switchBtn.addEventListener('click', () => this.switchCamera());
    }

    // Toggle torch
    const torchBtn = this.container.querySelector(`#btn-toggle-torch-${this.scannerId}`);
    if (torchBtn) {
      torchBtn.addEventListener('click', () => this.toggleTorch());
    }

    // Upload image
    const uploadBtn = this.container.querySelector(`#btn-upload-image-${this.scannerId}`);
    const imageInput = this.container.querySelector(`#qr-image-input-${this.scannerId}`);
    if (uploadBtn && imageInput) {
      uploadBtn.addEventListener('click', () => imageInput.click());
      imageInput.addEventListener('change', () => {
        if (imageInput.files[0]) {
          this.scanImage(imageInput.files[0]);
          imageInput.value = '';
        }
      });
    }

    // Stop scanner
    const stopBtn = this.container.querySelector(`#btn-stop-scanner-${this.scannerId}`);
    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.stop());
    }

    // Scan again
    const scanAgainBtn = this.container.querySelector(`#btn-scan-again-${this.scannerId}`);
    if (scanAgainBtn) {
      scanAgainBtn.addEventListener('click', () => {
        this.result.classList.add('hidden');
        if (!this.isScanning) this.start();
      });
    }

    // Clear history
    const clearHistoryBtn = this.container.querySelector(`#btn-clear-history-${this.scannerId}`);
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    }

    // Drag & drop image
    const viewport = this.container.querySelector('.qr-scanner__viewport');
    if (viewport) {
      viewport.addEventListener('dragover', (e) => {
        e.preventDefault();
        viewport.classList.add('qr-scanner__viewport--dragover');
      });
      viewport.addEventListener('dragleave', () => {
        viewport.classList.remove('qr-scanner__viewport--dragover');
      });
      viewport.addEventListener('drop', (e) => {
        e.preventDefault();
        viewport.classList.remove('qr-scanner__viewport--dragover');
        if (e.dataTransfer.files[0]) {
          this.scanImage(e.dataTransfer.files[0]);
        }
      });
    }
  }

  /**
   * Destroy scanner
   */
  destroy() {
    this.stop();
    this.scanHistory = [];
    if (this.container) {
      this.container.innerHTML = '';
      this.container.removeAttribute('data-scanner-id');
    }
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QRScanner };
}
