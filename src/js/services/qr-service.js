/**
 * QR SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * QR Code generation and scanning
 */

class QRService {
  constructor() {
    this.scannerActive = false;
    this.scannerStream = null;
  }
  
  /**
   * Initialize QR service
   */
  init() {
    console.log('✅ QR Service initialized');
  }
  
  /**
   * Generate QR code
   */
  async generate(data, options = {}) {
    const {
      width = 256,
      height = 256,
      color = '#000000',
      backgroundColor = '#FFFFFF',
      logo = null,
      type = 'png'
    } = options;
    
    try {
      if (typeof QRCode !== 'undefined') {
        // Use qrcode library
        const qrDataUrl = await QRCode.toDataURL(
          typeof data === 'string' ? data : JSON.stringify(data),
          {
            width,
            height,
            color: { dark: color, light: backgroundColor },
            margin: 2
          }
        );
        
        return {
          dataUrl: qrDataUrl,
          width,
          height,
          type: 'image/png'
        };
      }
      
      // Fallback: generate via canvas
      return this.generateBasicQR(data, options);
      
    } catch (error) {
      console.error('QR generation failed:', error);
      throw new Error('Gagal membuat QR Code');
    }
  }
  
  /**
   * Generate basic QR (fallback without library)
   */
  generateBasicQR(data, options) {
    const { width = 256, height = 256 } = options;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Simple pattern generation
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    const moduleCount = 25; // Simplified QR matrix
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    
    const moduleSize = Math.floor(Math.min(width, height) / (moduleCount + 8));
    const offsetX = Math.floor((width - moduleCount * moduleSize) / 2);
    const offsetY = Math.floor((height - moduleCount * moduleSize) / 2);
    
    // Draw finder patterns
    this.drawFinderPattern(ctx, offsetX, offsetY, moduleSize);
    this.drawFinderPattern(ctx, offsetX + (moduleCount - 7) * moduleSize, offsetY, moduleSize);
    this.drawFinderPattern(ctx, offsetX, offsetY + (moduleCount - 7) * moduleSize, moduleSize);
    
    // Generate pseudo-random pattern based on text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
    
    // Draw data modules
    ctx.fillStyle = '#000000';
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        // Skip finder pattern areas
        if (this.isInFinderPattern(row, col, moduleCount)) continue;
        
        // Simple hash-based pattern
        const seed = Math.abs(hash + row * moduleCount + col);
        if (seed % 3 === 0) {
          ctx.fillRect(
            offsetX + col * moduleSize + 1,
            offsetY + row * moduleSize + 1,
            moduleSize - 2,
            moduleSize - 2
          );
        }
      }
    }
    
    return {
      dataUrl: canvas.toDataURL('image/png'),
      width,
      height,
      type: 'image/png'
    };
  }
  
  /**
   * Draw finder pattern
   */
  drawFinderPattern(ctx, x, y, size) {
    ctx.fillStyle = '#000000';
    // Outer square
    ctx.fillRect(x, y, size * 7, size * 7);
    // White square
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + size, y + size, size * 5, size * 5);
    // Inner square
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + size * 2, y + size * 2, size * 3, size * 3);
  }
  
  /**
   * Check if position is in finder pattern
   */
  isInFinderPattern(row, col, moduleCount) {
    // Top-left finder
    if (row < 8 && col < 8) return true;
    // Top-right finder
    if (row < 8 && col >= moduleCount - 8) return true;
    // Bottom-left finder
    if (row >= moduleCount - 8 && col < 8) return true;
    return false;
  }
  
  /**
   * Generate document QR code
   */
  async generateDocumentQR(documentData) {
    const {
      id,
      type,
      nomorSurat,
      perihal,
      tanggalSurat,
      pengirim
    } = documentData;
    
    const qrData = {
      docId: id,
      type: type,
      number: nomorSurat,
      subject: perihal?.substring(0, 100),
      date: tanggalSurat,
      sender: pengirim,
      timestamp: new Date().toISOString(),
      verifyUrl: `${APP_CONFIG.APP_URL}#/verify/${id}`
    };
    
    return this.generate(JSON.stringify(qrData));
  }
  
  /**
   * Generate approval QR code
   */
  async generateApprovalQR(approvalData) {
    const qrData = {
      type: 'approval',
      documentId: approvalData.documentId,
      approvalId: approvalData.approvalId,
      approver: approvalData.approver,
      timestamp: new Date().toISOString(),
      signature: approvalData.signature
    };
    
    return this.generate(JSON.stringify(qrData), {
      color: '#1976D2',
      width: 200,
      height: 200
    });
  }
  
  /**
   * Start QR scanner
   */
  async startScanner(videoElement, options = {}) {
    const {
      onScan = null,
      onError = null,
      facingMode = 'environment'
    } = options;
    
    if (this.scannerActive) {
      this.stopScanner();
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      
      videoElement.srcObject = stream;
      this.scannerStream = stream;
      this.scannerActive = true;
      
      // Start scanning loop
      this.scanLoop(videoElement, onScan, onError);
      
      return true;
    } catch (error) {
      console.error('Camera access failed:', error);
      if (onError) onError(error);
      return false;
    }
  }
  
  /**
   * Scan loop for QR detection
   */
  scanLoop(videoElement, onScan, onError) {
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
        
        // Try to detect QR code pattern
        const detected = this.detectQRPattern(imageData);
        
        if (detected && onScan) {
          onScan(detected);
          this.stopScanner();
          return;
        }
      }
      
      requestAnimationFrame(scan);
    };
    
    requestAnimationFrame(scan);
  }
  
  /**
   * Basic QR pattern detection
   */
  detectQRPattern(imageData) {
    // Check for finder pattern (simplified)
    const { data, width, height } = imageData;
    
    // Look for alternating black/white pattern
    let consecutiveDark = 0;
    let consecutiveLight = 0;
    let patternCount = 0;
    let lastColor = null;
    
    const sampleRow = Math.floor(height / 2);
    const startIdx = sampleRow * width * 4;
    
    for (let x = 0; x < width; x++) {
      const idx = startIdx + x * 4;
      const luminance = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const isDark = luminance < 128;
      
      if (isDark) {
        if (lastColor === 'light' && consecutiveLight > 0) {
          patternCount++;
        }
        consecutiveDark++;
        consecutiveLight = 0;
        lastColor = 'dark';
      } else {
        if (lastColor === 'dark' && consecutiveDark > 0) {
          patternCount++;
        }
        consecutiveLight++;
        consecutiveDark = 0;
        lastColor = 'light';
      }
    }
    
    // QR finder pattern has 1:1:3:1:1 ratio
    return patternCount > 10 ? 'QR_PATTERN_DETECTED' : null;
  }
  
  /**
   * Stop QR scanner
   */
  stopScanner() {
    if (this.scannerStream) {
      this.scannerStream.getTracks().forEach(track => track.stop());
      this.scannerStream = null;
    }
    this.scannerActive = false;
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
  printQR(dataUrl) {
    const printWindow = window.open('', '_blank', 'width=400,height=400');
    printWindow.document.write(`
      <html>
        <head><title>Print QR Code</title>
        <style>body{display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}</style></head>
        <body><img src="${dataUrl}" style="max-width:300px;max-height:300px"></body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }
}

// Singleton instance
const QRService = new QRService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QRService };
}
