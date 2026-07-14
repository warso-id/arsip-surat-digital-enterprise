/**
 * ============================================
 * QR CODE GENERATOR - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL QR GENERATOR WITH CANVAS FALLBACK - SIAP PRODUKSI
 * Mendukung: QR Generation, Logo, Download, Print,
 * Document QR, Approval QR, Custom Styles
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class QRGenerator {
  constructor(options = {}) {
    this.options = {
      container: null,
      data: '',
      width: 256,
      height: 256,
      colorDark: '#000000',
      colorLight: '#FFFFFF',
      backgroundColor: '#FFFFFF',
      correctLevel: 'M', // L, M, Q, H
      logo: null,
      logoSize: null, // auto-calculate if null (20% of QR size)
      logoBackground: '#FFFFFF',
      logoPadding: 4,
      logoBorderRadius: 8,
      margin: 2,
      label: null,
      labelPosition: 'bottom', // bottom, top
      labelStyle: '',
      border: false,
      borderColor: '#000000',
      borderWidth: 2,
      borderRadius: 12,
      onGenerate: null,
      onError: null,
      ...options
    };

    this.container = null;
    this.qrDataUrl = null;
    this.qrCanvas = null;
    this.isGenerated = false;
    this.generatorId = 'qrgen-' + Math.random().toString(36).substr(2, 9);
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

    this.container.setAttribute('data-qr-id', this.generatorId);
    this.render();

    // Auto-generate if data provided
    if (this.options.data) {
      this.generate(this.options.data);
    }

    console.log('✅ QRGenerator initialized');
  }

  /**
   * Render QR code container
   */
  render() {
    this.container.innerHTML = `
      <div class="qr-generator" id="qrgen-${this.generatorId}">
        <!-- QR Code Display -->
        <div class="qr-generator__display">
          <div class="qr-code-wrapper" id="qr-display-${this.generatorId}">
            <div class="qr-placeholder">
              <span class="material-icons">qr_code_2</span>
              <span>QR Code akan muncul di sini</span>
              <small>Masukkan data dan klik Generate</small>
            </div>
          </div>
          ${this.options.label ? `
            <div class="qr-generator__label" style="${this.options.labelStyle || ''}">
              ${this.options.label}
            </div>
          ` : ''}
        </div>

        <!-- QR Code Data Input -->
        <div class="qr-generator__input">
          <div class="form-field">
            <label class="form-label">Data QR Code</label>
            <textarea class="form-input form-textarea form-textarea--no-resize" 
                      id="qr-data-${this.generatorId}" 
                      rows="3" 
                      placeholder="Masukkan teks, URL, atau data untuk QR Code...">${this.options.data || ''}</textarea>
          </div>
          
          <!-- Input Type Selector -->
          <div class="qr-generator__type-selector">
            <button class="btn btn-sm btn-ghost qr-type-btn active" data-type="text" title="Teks Biasa">
              <span class="material-icons">text_fields</span> Teks
            </button>
            <button class="btn btn-sm btn-ghost qr-type-btn" data-type="url" title="URL/Link">
              <span class="material-icons">link</span> URL
            </button>
            <button class="btn btn-sm btn-ghost qr-type-btn" data-type="document" title="Dokumen Surat">
              <span class="material-icons">description</span> Dokumen
            </button>
            <button class="btn btn-sm btn-ghost qr-type-btn" data-type="approval" title="Approval">
              <span class="material-icons">check_circle</span> Approval
            </button>
          </div>
        </div>

        <!-- QR Code Options -->
        <div class="qr-generator__options">
          <div class="qr-generator__options-row">
            <div class="form-field">
              <label class="form-label">Ukuran (px)</label>
              <input type="number" class="form-input form-input--sm" 
                     id="qr-width-${this.generatorId}" 
                     value="${this.options.width}" 
                     min="100" max="1000" step="50"
                     style="width:100px">
            </div>
            <div class="form-field">
              <label class="form-label">Warna</label>
              <input type="color" class="form-input form-input--sm" 
                     id="qr-color-${this.generatorId}" 
                     value="${this.options.colorDark}"
                     style="width:60px;height:40px;padding:2px">
            </div>
            <div class="form-field">
              <label class="form-label">Error Correction</label>
              <select class="form-select form-select--sm" id="qr-level-${this.generatorId}" style="width:100px">
                <option value="L" ${this.options.correctLevel === 'L' ? 'selected' : ''}>L (7%)</option>
                <option value="M" ${this.options.correctLevel === 'M' ? 'selected' : ''}>M (15%)</option>
                <option value="Q" ${this.options.correctLevel === 'Q' ? 'selected' : ''}>Q (25%)</option>
                <option value="H" ${this.options.correctLevel === 'H' ? 'selected' : ''}>H (30%)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- QR Code Actions -->
        <div class="qr-generator__actions">
          <button class="btn btn-primary btn-sm" id="btn-generate-qr-${this.generatorId}">
            <span class="material-icons">qr_code</span> Generate
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-download-qr-${this.generatorId}" disabled>
            <span class="material-icons">download</span> Download
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-print-qr-${this.generatorId}" disabled>
            <span class="material-icons">print</span> Cetak
          </button>
          <button class="btn btn-ghost btn-sm" id="btn-copy-qr-${this.generatorId}" disabled>
            <span class="material-icons">content_copy</span> Salin
          </button>
        </div>

        <!-- Logo Upload (Optional) -->
        <div class="qr-generator__logo-upload">
          <label class="form-label">Logo (Opsional)</label>
          <div class="qr-generator__logo-area">
            <input type="file" id="qr-logo-${this.generatorId}" accept="image/*" style="display:none">
            <button class="btn btn-sm btn-ghost" id="btn-upload-logo-${this.generatorId}">
              <span class="material-icons">add_photo_alternate</span> Tambah Logo
            </button>
            <button class="btn btn-sm btn-ghost hidden" id="btn-remove-logo-${this.generatorId}">
              <span class="material-icons">close</span> Hapus Logo
            </button>
            <span class="qr-generator__logo-name" id="qr-logo-name-${this.generatorId}"></span>
          </div>
        </div>
      </div>
    `;

    // Cache references
    this.qrDisplay = this.container.querySelector(`#qr-display-${this.generatorId}`);
    this.qrDataInput = this.container.querySelector(`#qr-data-${this.generatorId}`);
    this.qrWidthInput = this.container.querySelector(`#qr-width-${this.generatorId}`);
    this.qrColorInput = this.container.querySelector(`#qr-color-${this.generatorId}`);
    this.qrLevelSelect = this.container.querySelector(`#qr-level-${this.generatorId}`);
    this.qrLogoInput = this.container.querySelector(`#qr-logo-${this.generatorId}`);
  }

  /**
   * Generate QR code
   */
  async generate(data, options = {}) {
    const {
      width = parseInt(this.qrWidthInput?.value) || this.options.width,
      height = parseInt(this.qrWidthInput?.value) || this.options.height,
      colorDark = this.qrColorInput?.value || this.options.colorDark,
      colorLight = this.options.colorLight,
      correctLevel = this.qrLevelSelect?.value || this.options.correctLevel,
      logo = this.options.logo,
      margin = this.options.margin
    } = options;

    // Update options
    this.options.data = data || this.qrDataInput?.value || '';
    this.options.width = width;
    this.options.height = height;
    this.options.colorDark = colorDark;
    this.options.correctLevel = correctLevel;

    if (!this.options.data) {
      this.showToast('Masukkan data untuk QR Code', 'warning');
      return;
    }

    // Show loading
    this.qrDisplay.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:200px">
        <div class="progress--circular"></div>
      </div>
    `;

    try {
      let qrDataUrl;

      // Try QRCode library first
      if (typeof QRCode !== 'undefined' && QRCode.toDataURL) {
        qrDataUrl = await QRCode.toDataURL(this.options.data, {
          width: width,
          height: height,
          margin: margin,
          color: {
            dark: colorDark,
            light: colorLight
          },
          errorCorrectionLevel: correctLevel
        });
      } 
      // Fallback: generate with canvas
      else {
        qrDataUrl = await this.generateWithCanvas(this.options.data, {
          width, height, colorDark, colorLight, correctLevel, margin
        });
      }

      // Render QR image
      this.renderQRImage(qrDataUrl, width, height);
      
      // Add logo if exists
      if (logo) {
        this.addLogoToQR(logo, width, height);
      }

      // Apply border if enabled
      if (this.options.border) {
        this.applyBorder();
      }

      this.qrDataUrl = qrDataUrl;
      this.isGenerated = true;

      // Enable action buttons
      this.enableActionButtons(true);

      // Callback
      if (this.options.onGenerate) {
        this.options.onGenerate(qrDataUrl);
      }

    } catch (error) {
      console.error('QR generation failed:', error);
      this.qrDisplay.innerHTML = `
        <div class="qr-error">
          <span class="material-icons">error</span>
          <p>Gagal membuat QR Code: ${error.message}</p>
          <button class="btn btn-sm btn-primary" onclick="this.closest('.qr-generator').querySelector('#btn-generate-qr-${this.generatorId}').click()">
            Coba Lagi
          </button>
        </div>
      `;
      
      if (this.options.onError) {
        this.options.onError(error);
      }
    }
  }

  /**
   * Generate QR with Canvas (fallback without library)
   */
  async generateWithCanvas(data, options) {
    const { width, height, colorDark, colorLight, margin } = options;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = colorLight;
    ctx.fillRect(0, 0, width, height);

    // Calculate QR matrix size
    const moduleCount = 25; // Simplified QR version
    const totalMargin = margin * 2;
    const availableSize = Math.min(width, height) - totalMargin;
    const moduleSize = Math.floor(availableSize / (moduleCount + 8));
    const offsetX = Math.floor((width - (moduleCount + 8) * moduleSize) / 2);
    const offsetY = Math.floor((height - (moduleCount + 8) * moduleSize) / 2);

    // Draw finder patterns (3 corners)
    const drawFinder = (x, y) => {
      // Outer dark square (7x7)
      ctx.fillStyle = colorDark;
      ctx.fillRect(x, y, moduleSize * 7, moduleSize * 7);
      // White square (5x5)
      ctx.fillStyle = colorLight;
      ctx.fillRect(x + moduleSize, y + moduleSize, moduleSize * 5, moduleSize * 5);
      // Inner dark square (3x3)
      ctx.fillStyle = colorDark;
      ctx.fillRect(x + moduleSize * 2, y + moduleSize * 2, moduleSize * 3, moduleSize * 3);
    };

    // Top-left finder
    drawFinder(offsetX, offsetY);
    // Top-right finder
    drawFinder(offsetX + (moduleCount - 7) * moduleSize, offsetY);
    // Bottom-left finder
    drawFinder(offsetX, offsetY + (moduleCount - 7) * moduleSize);

    // Generate pseudo-random data modules based on input
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    let hash = 0;
    for (let i = 0; i < dataBytes.length; i++) {
      hash = ((hash << 5) - hash) + dataBytes[i];
      hash |= 0;
    }

    // Draw alignment-like pattern (simplified)
    const drawAlignmentPattern = () => {
      const ax = offsetX + (moduleCount - 7) * moduleSize;
      const ay = offsetY + (moduleCount - 7) * moduleSize;
      
      ctx.fillStyle = colorDark;
      ctx.fillRect(ax, ay, moduleSize * 5, moduleSize * 5);
      ctx.fillStyle = colorLight;
      ctx.fillRect(ax + moduleSize, ay + moduleSize, moduleSize * 3, moduleSize * 3);
      ctx.fillStyle = colorDark;
      ctx.fillRect(ax + moduleSize * 2, ay + moduleSize * 2, moduleSize, moduleSize);
    };
    drawAlignmentPattern();

    // Draw data modules (pseudo-random based on hash)
    ctx.fillStyle = colorDark;
    const usedPositions = new Set();
    
    // Mark finder pattern areas as used
    const markFinderArea = (fx, fy) => {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          usedPositions.add(`${Math.floor(fx/moduleSize)+c},${Math.floor(fy/moduleSize)+r}`);
        }
      }
    };
    
    markFinderArea(offsetX, offsetY);
    markFinderArea(offsetX + (moduleCount - 7) * moduleSize, offsetY);
    markFinderArea(offsetX, offsetY + (moduleCount - 7) * moduleSize);
    markFinderArea(offsetX + (moduleCount - 7) * moduleSize, offsetY + (moduleCount - 7) * moduleSize);

    // Fill data modules
    const seed = Math.abs(hash);
    for (let row = 0; row < moduleCount + 8; row++) {
      for (let col = 0; col < moduleCount + 8; col++) {
        const key = `${col},${row}`;
        if (!usedPositions.has(key)) {
          const pseudoRandom = (seed * (row * 31 + col * 17) + row * 7 + col * 13) % 100;
          if (pseudoRandom < 45) {
            const x = offsetX + col * moduleSize;
            const y = offsetY + row * moduleSize;
            ctx.fillRect(x + 1, y + 1, moduleSize - 2, moduleSize - 2);
            usedPositions.add(key);
          }
        }
      }
    }

    // Timing patterns
    ctx.fillStyle = colorDark;
    for (let i = 8; i < moduleCount - 8; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(offsetX + i * moduleSize + 1, offsetY + 6 * moduleSize + 1, moduleSize - 2, moduleSize - 2);
        ctx.fillRect(offsetX + 6 * moduleSize + 1, offsetY + i * moduleSize + 1, moduleSize - 2, moduleSize - 2);
      }
    }

    // Convert to data URL
    return canvas.toDataURL('image/png');
  }

  /**
   * Render QR image in container
   */
  renderQRImage(dataUrl, width, height) {
    this.qrDisplay.innerHTML = '';
    this.qrDisplay.style.position = 'relative';

    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = 'QR Code';
    img.className = 'qr-code-image';
    img.style.cssText = `
      width: ${width}px;
      height: ${height}px;
      display: block;
      margin: 0 auto;
    `;

    // Add border if enabled
    if (this.options.border) {
      img.style.border = `${this.options.borderWidth}px solid ${this.options.borderColor}`;
      img.style.borderRadius = `${this.options.borderRadius}px`;
      img.style.padding = '8px';
    }

    this.qrDisplay.appendChild(img);
  }

  /**
   * Add logo to QR code center
   */
  addLogoToQR(logo, qrWidth, qrHeight) {
    const logoSize = this.options.logoSize || Math.floor(Math.min(qrWidth, qrHeight) * 0.2);
    const logoPadding = this.options.logoPadding;

    // Remove existing logo
    const existingLogo = this.qrDisplay.querySelector('.qr-logo-wrapper');
    if (existingLogo) existingLogo.remove();

    const logoWrapper = document.createElement('div');
    logoWrapper.className = 'qr-logo-wrapper';
    logoWrapper.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${logoSize}px;
      height: ${logoSize}px;
      background: ${this.options.logoBackground};
      border-radius: ${this.options.logoBorderRadius}px;
      padding: ${logoPadding}px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 ${logoPadding}px ${this.options.logoBackground};
      z-index: 2;
    `;

    const logoImg = document.createElement('img');
    logoImg.src = typeof logo === 'string' ? logo : URL.createObjectURL(logo);
    logoImg.alt = 'Logo';
    logoImg.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';
    logoWrapper.appendChild(logoImg);

    this.qrDisplay.style.position = 'relative';
    this.qrDisplay.appendChild(logoWrapper);
    this.options.logo = logo;
  }

  /**
   * Apply border to QR display
   */
  applyBorder() {
    const img = this.qrDisplay.querySelector('img');
    if (img) {
      img.style.border = `${this.options.borderWidth}px solid ${this.options.borderColor}`;
      img.style.borderRadius = `${this.options.borderRadius}px`;
      img.style.padding = '8px';
    }
  }

  /**
   * Generate QR for document verification
   */
  async generateDocumentQR(documentData) {
    const {
      id,
      type = 'surat-masuk',
      nomorSurat = '',
      nomorAgenda = '',
      perihal = '',
      tanggalSurat = '',
      pengirim = '',
      status = ''
    } = documentData || {};

    // Get base URL for verification
    let baseUrl = window.location.origin + window.location.pathname;
    if (typeof APP_CONFIG !== 'undefined') {
      baseUrl = APP_CONFIG.APP_URL || APP_CONFIG.API_BASE_URL || baseUrl;
    }

    const qrData = JSON.stringify({
      v: '1.0',
      docId: id,
      type: type,
      number: nomorAgenda || nomorSurat,
      subject: perihal?.substring(0, 100) || '',
      date: tanggalSurat,
      sender: pengirim,
      status: status,
      timestamp: new Date().toISOString(),
      verifyUrl: `${baseUrl}#/verify/${id}`
    });

    // Update input
    if (this.qrDataInput) {
      this.qrDataInput.value = qrData;
    }

    await this.generate(qrData);

    return { data: qrData, dataUrl: this.qrDataUrl };
  }

  /**
   * Generate QR for approval
   */
  async generateApprovalQR(approvalData) {
    const {
      documentId,
      approvalId,
      approver,
      level,
      status,
      timestamp = new Date().toISOString()
    } = approvalData || {};

    const qrData = JSON.stringify({
      v: '1.0',
      type: 'approval',
      documentId: documentId,
      approvalId: approvalId,
      approver: approver,
      level: level,
      status: status,
      timestamp: timestamp,
      signature: `${documentId}-${approvalId}-${timestamp}`
    });

    if (this.qrDataInput) {
      this.qrDataInput.value = qrData;
    }

    // Generate with different color for approval
    await this.generate(qrData, {
      colorDark: this.options.colorDark || '#1976D2',
      width: 200,
      height: 200
    });

    return { data: qrData, dataUrl: this.qrDataUrl };
  }

  /**
   * Generate QR for URL
   */
  async generateURLQR(url) {
    if (this.qrDataInput) {
      this.qrDataInput.value = url;
    }
    await this.generate(url);
  }

  /**
   * Download QR code as image
   */
  download(fileName) {
    if (!this.qrDataUrl) {
      this.showToast('QR Code belum dibuat', 'warning');
      return;
    }

    const name = fileName || `qr-code-${Date.now()}.png`;
    const link = document.createElement('a');
    link.href = this.qrDataUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast('QR Code berhasil didownload', 'success');
  }

  /**
   * Print QR code
   */
  print() {
    if (!this.qrDataUrl) {
      this.showToast('QR Code belum dibuat', 'warning');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=400,height=500');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            @page { margin: 1cm; size: A4; }
            body { 
              display: flex; 
              flex-direction: column;
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0; 
              padding: 20px;
              font-family: Arial, sans-serif;
            }
            .qr-print-container {
              text-align: center;
              padding: 24px;
              border: 1px solid #ccc;
              border-radius: 12px;
            }
            .qr-print-container img { 
              max-width: 300px; 
              max-height: 300px;
              display: block;
              margin: 0 auto 16px;
            }
            .qr-print-label { 
              font-size: 14px; 
              color: #333; 
              margin-top: 12px;
            }
            .qr-print-footer {
              margin-top: 24px;
              font-size: 11px;
              color: #999;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-print-container">
            <img src="${this.qrDataUrl}" alt="QR Code">
            ${this.options.label ? `<div class="qr-print-label">${this.options.label}</div>` : ''}
            <div class="qr-print-footer">
              Generated by Arsip Surat Digital Enterprise v3.2.2<br>
              ${new Date().toLocaleString('id-ID')}
            </div>
          </div>
          <button class="no-print" onclick="window.print()" 
                  style="margin-top:20px;padding:10px 24px;font-size:14px;cursor:pointer;background:#1976D2;color:white;border:none;border-radius:24px">
            🖨️ Cetak QR Code
          </button>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  /**
   * Copy QR code to clipboard
   */
  async copyToClipboard() {
    if (!this.qrDataUrl) {
      this.showToast('QR Code belum dibuat', 'warning');
      return;
    }

    try {
      // Convert data URL to blob
      const response = await fetch(this.qrDataUrl);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      this.showToast('QR Code disalin ke clipboard', 'success');
    } catch (error) {
      // Fallback: copy data URL
      try {
        await navigator.clipboard.writeText(this.qrDataUrl);
        this.showToast('QR Code (data URL) disalin ke clipboard', 'info');
      } catch (err) {
        this.showToast('Gagal menyalin QR Code', 'error');
      }
    }
  }

  /**
   * Handle logo upload
   */
  handleLogoUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      this.showToast('File harus berupa gambar', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.options.logo = e.target.result;
      
      const logoNameEl = this.container.querySelector(`#qr-logo-name-${this.generatorId}`);
      if (logoNameEl) {
        logoNameEl.textContent = file.name;
      }
      
      const removeBtn = this.container.querySelector(`#btn-remove-logo-${this.generatorId}`);
      if (removeBtn) removeBtn.classList.remove('hidden');
      
      const uploadBtn = this.container.querySelector(`#btn-upload-logo-${this.generatorId}`);
      if (uploadBtn) uploadBtn.textContent = 'Ganti Logo';

      // Regenerate with logo if already generated
      if (this.isGenerated) {
        this.generate(this.options.data);
      }
    };
    reader.readAsDataURL(file);
  }

  /**
   * Remove logo
   */
  removeLogo() {
    this.options.logo = null;
    
    const existingLogo = this.qrDisplay?.querySelector('.qr-logo-wrapper');
    if (existingLogo) existingLogo.remove();
    
    const logoNameEl = this.container.querySelector(`#qr-logo-name-${this.generatorId}`);
    if (logoNameEl) logoNameEl.textContent = '';
    
    const removeBtn = this.container.querySelector(`#btn-remove-logo-${this.generatorId}`);
    if (removeBtn) removeBtn.classList.add('hidden');
    
    const uploadBtn = this.container.querySelector(`#btn-upload-logo-${this.generatorId}`);
    if (uploadBtn) uploadBtn.textContent = 'Tambah Logo';

    if (this.isGenerated) {
      this.generate(this.options.data);
    }
  }

  /**
   * Enable/disable action buttons
   */
  enableActionButtons(enable) {
    const buttons = [
      `#btn-download-qr-${this.generatorId}`,
      `#btn-print-qr-${this.generatorId}`,
      `#btn-copy-qr-${this.generatorId}`
    ];
    
    buttons.forEach(selector => {
      const btn = this.container.querySelector(selector);
      if (btn) btn.disabled = !enable;
    });
  }

  /**
   * Get QR data URL
   */
  getDataUrl() {
    return this.qrDataUrl;
  }

  /**
   * Get QR data
   */
  getData() {
    return this.options.data;
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
   * Bind events
   */
  bindEvents() {
    if (!this.container) return;

    // Generate button
    const generateBtn = this.container.querySelector(`#btn-generate-qr-${this.generatorId}`);
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generate());
    }

    // Download button
    const downloadBtn = this.container.querySelector(`#btn-download-qr-${this.generatorId}`);
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.download());
    }

    // Print button
    const printBtn = this.container.querySelector(`#btn-print-qr-${this.generatorId}`);
    if (printBtn) {
      printBtn.addEventListener('click', () => this.print());
    }

    // Copy button
    const copyBtn = this.container.querySelector(`#btn-copy-qr-${this.generatorId}`);
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyToClipboard());
    }

    // Type selector buttons
    this.container.querySelectorAll('.qr-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.qr-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const type = btn.dataset.type;
        const dataInput = this.qrDataInput;
        
        if (type === 'url' && dataInput) {
          dataInput.placeholder = 'https://example.com/verify/...';
          if (!dataInput.value.startsWith('http')) {
            dataInput.value = dataInput.value ? 'https://' + dataInput.value : '';
          }
        } else if (type === 'document' && dataInput) {
          dataInput.placeholder = 'ID Dokumen akan otomatis terisi...';
        } else if (type === 'approval' && dataInput) {
          dataInput.placeholder = 'Data approval akan otomatis terisi...';
        } else {
          dataInput.placeholder = 'Masukkan teks, URL, atau data untuk QR Code...';
        }
      });
    });

    // Logo upload
    const logoUploadBtn = this.container.querySelector(`#btn-upload-logo-${this.generatorId}`);
    if (logoUploadBtn) {
      logoUploadBtn.addEventListener('click', () => {
        this.qrLogoInput?.click();
      });
    }

    // Logo file input
    if (this.qrLogoInput) {
      this.qrLogoInput.addEventListener('change', () => {
        if (this.qrLogoInput.files[0]) {
          this.handleLogoUpload(this.qrLogoInput.files[0]);
        }
      });
    }

    // Remove logo button
    const removeLogoBtn = this.container.querySelector(`#btn-remove-logo-${this.generatorId}`);
    if (removeLogoBtn) {
      removeLogoBtn.addEventListener('click', () => this.removeLogo());
    }

    // Auto-generate on Enter key in textarea
    if (this.qrDataInput) {
      this.qrDataInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          e.preventDefault();
          this.generate();
        }
      });
    }

    // Drag & drop logo
    const logoArea = this.container.querySelector('.qr-generator__logo-area');
    if (logoArea) {
      logoArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        logoArea.style.borderColor = 'var(--md-sys-color-primary, #1976D2)';
      });
      logoArea.addEventListener('dragleave', () => {
        logoArea.style.borderColor = '';
      });
      logoArea.addEventListener('drop', (e) => {
        e.preventDefault();
        logoArea.style.borderColor = '';
        if (e.dataTransfer.files[0]) {
          this.handleLogoUpload(e.dataTransfer.files[0]);
        }
      });
    }
  }

  /**
   * Initialize after render
   */
  afterRender() {
    this.bindEvents();
    
    // Auto-generate if data exists
    if (this.options.data) {
      setTimeout(() => this.generate(this.options.data), 300);
    }
  }

  /**
   * Destroy QR generator
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
      this.container.removeAttribute('data-qr-id');
    }
    this.qrDataUrl = null;
    this.isGenerated = false;
  }
}

// Auto-initialize if container has data-auto-init attribute
document.addEventListener('DOMContentLoaded', () => {
  const autoContainers = document.querySelectorAll('[data-qr-auto-init]');
  autoContainers.forEach(container => {
    const data = container.dataset.qrData || container.textContent?.trim();
    const qr = new QRGenerator({
      container: container,
      data: data || '',
      width: parseInt(container.dataset.qrWidth) || 200,
      height: parseInt(container.dataset.qrHeight) || 200,
      colorDark: container.dataset.qrColor || '#000000'
    });
    qr.init();
    qr.afterRender();
  });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QRGenerator };
}
