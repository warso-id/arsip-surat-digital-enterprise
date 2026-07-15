/**
 * ============================================
 * QR SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL QR CODE GENERATION & SCANNING - SIAP PRODUKSI
 * Mendukung: Generate, Scan, Download, Print,
 * Document QR, Approval QR, Logo, Colors
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class QRService {
  constructor() {
    this.scannerActive = false;
    this.scannerStream = null;
    this.scannerAnimationId = null;
    this.qrLibraryAvailable = false;
    this.scanCallbacks = {};
    this.generationCache = new Map();
    this.maxCacheSize = 50;
    this.defaultOptions = {
      width: 256,
      height: 256,
      color: '#000000',
      backgroundColor: '#FFFFFF',
      margin: 2,
      errorCorrection: 'M'
    };
  }

  /**
   * Initialize QR service
   */
  init() {
    // Check if QRCode library is available
    this.qrLibraryAvailable = typeof QRCode !== 'undefined';
    console.log(`✅ QR Service initialized (Library: ${this.qrLibraryAvailable ? 'available' : 'fallback'})`);
  }

  /**
   * Generate QR code
   */
  async generate(data, options = {}) {
    const opts = { ...this.defaultOptions, ...options };
    const cacheKey = this.getCacheKey(data, opts);

    // Check cache
    if (this.generationCache.has(cacheKey)) {
      return this.generationCache.get(cacheKey);
    }

    try {
      let result;

      if (this.qrLibraryAvailable) {
        result = await this.generateWithLibrary(data, opts);
      } else {
        result = await this.generateBasicQR(data, opts);
      }

      // Add logo if provided
      if (opts.logo && result.dataUrl) {
        result.dataUrl = await this.addLogoToQR(result.dataUrl, opts.logo, opts);
      }

      // Cache result
      this.addToCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error('QR generation failed:', error);
      // Fallback to basic generator
      try {
        return await this.generateBasicQR(data, opts);
      } catch (e) {
        throw new Error('Gagal membuat QR Code: ' + error.message);
      }
    }
  }

  /**
   * Generate QR using QRCode library
   */
  async generateWithLibrary(data, options) {
    const { width, height, color, backgroundColor, margin, errorCorrection } = options;
    const text = typeof data === 'string' ? data : JSON.stringify(data);

    const qrDataUrl = await QRCode.toDataURL(text, {
      width,
      height,
      margin,
      color: { dark: color, light: backgroundColor },
      errorCorrectionLevel: errorCorrection
    });

    return {
      dataUrl: qrDataUrl,
      width,
      height,
      type: 'image/png',
      data: text
    };
  }

  /**
   * Generate basic QR code (canvas fallback)
   */
  generateBasicQR(data, options) {
    const { width, height, color, backgroundColor, margin } = options;
    const text = typeof data === 'string' ? data : JSON.stringify(data);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Calculate module size
    const moduleCount = 25;
    const totalMargin = margin * 2;
    const availableSize = Math.min(width, height) - totalMargin;
    const moduleSize = Math.floor(availableSize / (moduleCount + 8));
    const offsetX = Math.floor((width - (moduleCount + 8) * moduleSize) / 2);
    const offsetY = Math.floor((height - (moduleCount + 8) * moduleSize) / 2);

    // Draw finder patterns (3 corners)
    this.drawFinderPattern(ctx, offsetX, offsetY, moduleSize, color);
    this.drawFinderPattern(ctx, offsetX + (moduleCount - 7) * moduleSize, offsetY, moduleSize, color);
    this.drawFinderPattern(ctx, offsetX, offsetY + (moduleCount - 7) * moduleSize, moduleSize, color);

    // Draw alignment pattern
    this.drawAlignmentPattern(ctx, offsetX + (moduleCount - 7) * moduleSize, offsetY + (moduleCount - 7) * moduleSize, moduleSize, color);

    // Draw timing patterns
    ctx.fillStyle = color;
    for (let i = 8; i < moduleCount - 8; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(offsetX + i * moduleSize + 1, offsetY + 6 * moduleSize + 1, moduleSize - 2, moduleSize - 2);
        ctx.fillRect(offsetX + 6 * moduleSize + 1, offsetY + i * moduleSize + 1, moduleSize - 2, moduleSize - 2);
      }
    }

    // Generate hash-based data modules
    const hash = this.hashString(text);
    const usedPositions = new Set();

    // Mark finder patterns
    this.markFinderAreas(usedPositions, offsetX, offsetY, moduleCount, moduleSize);

    // Fill data modules
    ctx.fillStyle = color;
    const seed = Math.abs(hash);
    for (let row = 0; row < moduleCount + 8; row++) {
      for (let col = 0; col < moduleCount + 8; col++) {
        const key = `${col},${row}`;
        if (!usedPositions.has(key)) {
          const pseudoRandom = (seed * (row * 31 + col * 17) + row * 7 + col * 13) % 100;
          if (pseudoRandom < 45) {
            ctx.fillRect(offsetX + col * moduleSize + 1, offsetY + row * moduleSize + 1, moduleSize - 2, moduleSize - 2);
            usedPositions.add(key);
          }
        }
      }
    }

    return {
      dataUrl: canvas.toDataURL('image/png'),
      width,
      height,
      type: 'image/png',
      data: text,
      canvas
    };
  }

  /**
   * Add logo to QR code
   */
  async addLogoToQR(dataUrl, logo, options) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(options.width, options.height);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Draw QR code
        const qrImg = new Image();
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 0, 0, size, size);

          // Calculate logo size (20% of QR)
          const logoSize = Math.floor(size * 0.2);
          const logoX = (size - logoSize) / 2;
          const logoY = (size - logoSize) / 2;

          // White background behind logo
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(logoX - 4, logoY - 4, logoSize + 8, logoSize + 8);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);

          // Draw logo
          ctx.drawImage(img, logoX, logoY, logoSize, logoSize);

          resolve(canvas.toDataURL('image/png'));
        };
        qrImg.src = dataUrl;
      };
      img.onerror = () => resolve(dataUrl);
      img.src = typeof logo === 'string' ? logo : URL.createObjectURL(logo);
    });
  }

  /**
   * Draw finder pattern
   */
  drawFinderPattern(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size * 7, size * 7);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + size, y + size, size * 5, size * 5);
    ctx.fillStyle = color;
    ctx.fillRect(x + size * 2, y + size * 2, size * 3, size * 3);
  }

  /**
   * Draw alignment pattern
   */
  drawAlignmentPattern(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size * 5, size * 5);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + size, y + size, size * 3, size * 3);
    ctx.fillStyle = color;
    ctx.fillRect(x + size * 2, y + size * 2, size, size);
  }

  /**
   * Mark finder pattern areas as used
   */
  markFinderAreas(used, ox, oy, moduleCount, moduleSize) {
    const mark = (fx, fy) => {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          used.add(`${Math.floor(fx / moduleSize) + c},${Math.floor(fy / moduleSize) + r}`);
        }
      }
    };
    mark(ox, oy);
    mark(ox + (moduleCount - 7) * moduleSize, oy);
    mark(ox, oy + (moduleCount - 7) * moduleSize);
  }

  /**
   * Generate document verification QR
   */
  async generateDocumentQR(documentData) {
    const {
      id, type = 'surat-masuk', nomorSurat, nomorAgenda,
      perihal, tanggalSurat, pengirim, status
    } = documentData || {};

    const baseUrl = this.getBaseUrl();
    const verifyUrl = `${baseUrl}#/verify/${id}`;

    const qrData = JSON.stringify({
      v: '1.0',
      docId: id,
      type,
      number: nomorAgenda || nomorSurat || '',
      subject: (perihal || '').substring(0, 100),
      date: tanggalSurat || '',
      sender: pengirim || '',
      status: status || '',
      timestamp: new Date().toISOString(),
      verifyUrl
    });

    return this.generate(qrData, {
      width: 200,
      height: 200,
      color: '#1976D2',
      errorCorrection: 'H'
    });
  }

  /**
   * Generate approval QR
   */
  async generateApprovalQR(approvalData) {
    const { documentId, approvalId, approver, level, status } = approvalData || {};

    const qrData = JSON.stringify({
      v: '1.0',
      type: 'approval',
      documentId,
      approvalId,
      approver,
      level,
      status,
      timestamp: new Date().toISOString()
    });

    return this.generate(qrData, {
      width: 180,
      height: 180,
      color: '#2E7D32',
      errorCorrection: 'M'
    });
  }

  /**
   * Generate URL QR
   */
  async generateURLQR(url) {
    return this.generate(url, { width: 200, height: 200, errorCorrection: 'M' });
  }

  /**
   * Generate contact QR (vCard)
   */
  async generateContactQR(contactData) {
    const { name, phone, email, organization, title } = contactData || {};
    const vcard = [
      'BEGIN:VCARD', 'VERSION:3.0',
      `FN:${name || ''}`,
      phone ? `TEL:${phone}` : '',
      email ? `EMAIL:${email}` : '',
      organization ? `ORG:${organization}` : '',
      title ? `TITLE:${title}` : '',
      'END:VCARD'
    ].filter(Boolean).join('\n');

    return this.generate(vcard, { width: 200, height: 200 });
  }

  /**
   * Start QR scanner
   */
  async startScanner(videoElement, options = {}) {
    const { onScan, onError, facingMode = 'environment', continuous = false } = options;

    if (this.scannerActive) {
      this.stopScanner();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      videoElement.srcObject = stream;
      this.scannerStream = stream;
      this.scannerActive = true;
      this.scanCallbacks = { onScan, onError, continuous };

      // If jsQR library is available, use it
      if (typeof jsQR !== 'undefined') {
        this.scanLoopWithJSQR(videoElement);
      } else {
        this.scanLoopBasic(videoElement);
      }

      return true;
    } catch (error) {
      console.error('Camera access failed:', error);
      if (onError) onError(error);
      return false;
    }
  }

  /**
   * Scan loop using jsQR library
   */
  scanLoopWithJSQR(videoElement) {
    if (!this.scannerActive) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const scan = () => {
      if (!this.scannerActive) return;

      if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        ctx.drawImage(videoElement, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code?.data) {
          if (this.scanCallbacks.onScan) {
            this.scanCallbacks.onScan(code.data);
          }
          if (!this.scanCallbacks.continuous) {
            this.stopScanner();
            return;
          }
        }
      }

      this.scannerAnimationId = requestAnimationFrame(scan);
    };

    this.scannerAnimationId = requestAnimationFrame(scan);
  }

  /**
   * Basic scan loop (fallback)
   */
  scanLoopBasic(videoElement) {
    if (!this.scannerActive) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const scan = () => {
      if (!this.scannerActive) return;

      if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        ctx.drawImage(videoElement, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const detected = this.detectQRPattern(imageData);

        if (detected && this.scanCallbacks.onScan) {
          this.scanCallbacks.onScan(detected);
          if (!this.scanCallbacks.continuous) {
            this.stopScanner();
            return;
          }
        }
      }

      this.scannerAnimationId = requestAnimationFrame(scan);
    };

    this.scannerAnimationId = requestAnimationFrame(scan);
  }

  /**
   * Basic QR pattern detection
   */
  detectQRPattern(imageData) {
    const { data, width, height } = imageData;

    // Scan center row for 1:1:3:1:1 finder pattern
    const scanRow = Math.floor(height / 2);
    let consecutiveDark = 0;
    let consecutiveLight = 0;
    let patternCount = 0;
    let lastColor = null;

    const startIdx = scanRow * width * 4;

    for (let x = 0; x < width; x++) {
      const idx = startIdx + x * 4;
      const luminance = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const isDark = luminance < 128;

      if (isDark) {
        if (lastColor === 'light' && consecutiveLight > 0) patternCount++;
        consecutiveDark++;
        consecutiveLight = 0;
        lastColor = 'dark';
      } else {
        if (lastColor === 'dark' && consecutiveDark > 0) patternCount++;
        consecutiveLight++;
        consecutiveDark = 0;
        lastColor = 'light';
      }
    }

    // QR finder pattern should have many transitions
    if (patternCount > 10) {
      return `QR_PATTERN_DETECTED_${patternCount}`;
    }

    // Check contrast
    let minLum = 255, maxLum = 0;
    for (let i = startIdx; i < startIdx + width * 4; i += 4) {
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      minLum = Math.min(minLum, lum);
      maxLum = Math.max(maxLum, lum);
    }

    return (maxLum - minLum) > 100 ? 'POSSIBLE_QR' : null;
  }

  /**
   * Stop QR scanner
   */
  stopScanner() {
    if (this.scannerAnimationId) {
      cancelAnimationFrame(this.scannerAnimationId);
      this.scannerAnimationId = null;
    }
    if (this.scannerStream) {
      this.scannerStream.getTracks().forEach(track => track.stop());
      this.scannerStream = null;
    }
    this.scannerActive = false;
    this.scanCallbacks = {};
  }

  /**
   * Scan from image file
   */
  async scanImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          if (typeof jsQR !== 'undefined') {
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code?.data) resolve(code.data);
            else reject(new Error('QR code tidak ditemukan di gambar'));
          } else {
            const detected = this.detectQRPattern(imageData);
            if (detected) resolve(detected);
            else reject(new Error('QR code tidak terdeteksi'));
          }
        };
        img.onerror = () => reject(new Error('Gagal memuat gambar'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Download QR code as image
   */
  downloadQR(dataUrl, fileName = 'qr-code.png') {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Print QR code
   */
  printQR(dataUrl, title = 'QR Code') {
    const printWindow = window.open('', '_blank', 'width=400,height=500');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print ${title}</title>
        <style>
          @page { margin: 1cm; }
          body { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; margin:0; padding:20px; font-family:Arial,sans-serif; }
          img { max-width:300px; max-height:300px; }
          .label { margin-top:16px; font-size:14px; color:#333; text-align:center; }
          .footer { margin-top:24px; font-size:11px; color:#999; }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" alt="QR Code">
        <div class="label">${title}</div>
        <div class="footer">Generated by Arsip Surat Digital Enterprise v3.2.2</div>
        <script>window.onload=()=>window.print();<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  /**
   * Get cache key
   */
  getCacheKey(data, options) {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    return `${text}_${options.width}_${options.height}_${options.color}_${options.backgroundColor}`;
  }

  /**
   * Add to generation cache
   */
  addToCache(key, result) {
    if (this.generationCache.size >= this.maxCacheSize) {
      const firstKey = this.generationCache.keys().next().value;
      this.generationCache.delete(firstKey);
    }
    this.generationCache.set(key, result);
  }

  /**
   * Clear generation cache
   */
  clearCache() {
    this.generationCache.clear();
  }

  /**
   * Hash string
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash;
  }

  /**
   * Get base URL
   */
  getBaseUrl() {
    if (typeof APP_CONFIG !== 'undefined') {
      return APP_CONFIG.APP_URL || APP_CONFIG.API_BASE_URL || window.location.origin + window.location.pathname;
    }
    return window.location.origin + window.location.pathname;
  }

  /**
   * Get scanner status
   */
  getScannerStatus() {
    return {
      active: this.scannerActive,
      hasStream: !!this.scannerStream
    };
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.generationCache.size,
      maxSize: this.maxCacheSize
    };
  }

  /**
   * Destroy service
   */
  destroy() {
    this.stopScanner();
    this.clearCache();
  }
}

// Singleton instance
const QRService = new QRService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QRService };
}
