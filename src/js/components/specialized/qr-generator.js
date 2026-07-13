/**
 * QR CODE GENERATOR - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Generate QR codes for documents
 */

class QRGenerator {
  constructor(options = {}) {
    this.options = {
      container: null,
      data: '',
      width: 200,
      height: 200,
      colorDark: '#000000',
      colorLight: '#FFFFFF',
      correctLevel: 'M', // L, M, Q, H
      logo: null,
      logoSize: 40,
      ...options
    };
    
    this.container = null;
    this.qrCode = null;
  }
  
  /**
   * Initialize QR Generator
   */
  init() {
    this.container = this.options.container;
    if (!this.container) {
      console.error('QRGenerator: container is required');
      return;
    }
    
    this.render();
    
    if (this.options.data) {
      this.generate(this.options.data);
    }
  }
  
  /**
   * Render QR code container
   */
  render() {
    this.container.innerHTML = `
      <div class="qr-generator">
        <div class="qr-code-wrapper" id="qr-code-container">
          <div class="qr-placeholder">
            <span class="material-icons">qr_code_2</span>
            <span>QR Code</span>
          </div>
        </div>
        <div class="qr-generator__actions">
          <button class="btn btn-sm btn-secondary" id="btn-download-qr">
            <span class="material-icons">download</span> Download
          </button>
          <button class="btn btn-sm btn-ghost" id="btn-print-qr">
            <span class="material-icons">print</span> Cetak
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Generate QR code
   */
  async generate(data, options = {}) {
    const {
      width = this.options.width,
      height = this.options.height,
      colorDark = this.options.colorDark,
      colorLight = this.options.colorLight,
      correctLevel = this.options.correctLevel,
      logo = this.options.logo
    } = options;
    
    this.options.data = data;
    
    const container = this.container.querySelector('#qr-code-container');
    if (!container) return;
    
    // Show loading
    container.innerHTML = '<div class="progress--circular"></div>';
    
    try {
      // Generate QR code using qrcode library
      const qrDataUrl = await QRCode.toDataURL(data, {
        width,
        height,
        color: {
          dark: colorDark,
          light: colorLight
        },
        errorCorrectionLevel: correctLevel
      });
      
      // Create image
      const img = document.createElement('img');
      img.src = qrDataUrl;
      img.alt = 'QR Code';
      img.className = 'qr-code-image';
      img.style.width = width + 'px';
      img.style.height = height + 'px';
      
      container.innerHTML = '';
      container.appendChild(img);
      
      // Add logo if provided
      if (logo) {
        this.addLogo(container, logo, width, height);
      }
      
      this.qrCode = qrDataUrl;
      
    } catch (error) {
      console.error('QR generation failed:', error);
      container.innerHTML = '<p class="text-error">Gagal membuat QR Code</p>';
    }
  }
  
  /**
   * Add logo to QR code
   */
  addLogo(container, logo, qrWidth, qrHeight) {
    const logoSize = this.options.logoSize || Math.floor(qrWidth * 0.2);
    
    const logoWrapper = document.createElement('div');
    logoWrapper.className = 'qr-logo-wrapper';
    logoWrapper.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${logoSize}px;
      height: ${logoSize}px;
      background: white;
      border-radius: 8px;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 4px white;
    `;
    
    const logoImg = document.createElement('img');
    logoImg.src = typeof logo === 'string' ? logo : URL.createObjectURL(logo);
    logoImg.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';
    logoWrapper.appendChild(logoImg);
    
    container.style.position = 'relative';
    container.appendChild(logoWrapper);
  }
  
  /**
   * Download QR code
   */
  download(fileName = 'qr-code.png') {
    if (!this.qrCode) {
      NotificationService.warning('QR Code belum dibuat');
      return;
    }
    
    const link = document.createElement('a');
    link.href = this.qrCode;
    link.download = fileName;
    link.click();
  }
  
  /**
   * Print QR code
   */
  print() {
    if (!this.qrCode) {
      NotificationService.warning('QR Code belum dibuat');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Print QR Code</title></head>
        <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
          <img src="${this.qrCode}" style="max-width:300px;max-height:300px">
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }
  
  /**
   * Generate QR with document info
   */
  async generateDocumentQR(docId, docNumber) {
    const data = JSON.stringify({
      id: docId,
      number: docNumber,
      timestamp: new Date().toISOString(),
      url: `${APP_CONFIG.API.BASE_URL}?action=verify.document&id=${docId}`
    });
    
    await this.generate(data);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QRGenerator };
}
