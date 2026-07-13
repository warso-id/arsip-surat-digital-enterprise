/**
 * BLOCKCHAIN VERIFY PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class BlockchainVerifyPage {
  constructor() {
    this.container = null;
    this.verificationResult = null;
  }
  
  render(container) {
    this.container = container;
    const docId = store.getState('ui.currentRoute')?.params?.id || 
                  store.getState('ui.currentRoute')?.query?.id;
    
    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
    
    if (docId) {
      this.verifyById(docId);
    }
  }
  
  getTemplate() {
    return `
      <div class="blockchain-verify">
        <div class="content-area__header">
          <h1 class="content-area__title">
            <span class="material-icons">verified</span>
            Verifikasi Dokumen
          </h1>
          <p class="content-area__description">
            Verifikasi keaslian dan integritas dokumen menggunakan blockchain
          </p>
        </div>
        
        <div class="verify-methods">
          <div class="card">
            <div class="card__header"><h3>Upload Dokumen</h3></div>
            <div class="card__body">
              <p>Upload file dokumen untuk memverifikasi integritasnya di blockchain.</p>
              <div class="upload-zone" id="verify-upload-zone">
                <span class="upload-zone__icon material-icons">cloud_upload</span>
                <p class="upload-zone__text">Drag & drop file di sini</p>
                <p class="upload-zone__hint">atau klik untuk memilih file</p>
                <input type="file" id="verify-file-input" style="display:none">
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card__header"><h3>Masukkan Hash</h3></div>
            <div class="card__body">
              <p>Masukkan hash dokumen untuk verifikasi.</p>
              <div class="form-field">
                <input type="text" class="form-input" id="hash-input" placeholder="Masukkan hash SHA-256...">
              </div>
              <button class="btn btn-primary" id="btn-verify-hash">
                <span class="material-icons">search</span>
                Verifikasi
              </button>
            </div>
          </div>
          
          <div class="card">
            <div class="card__header"><h3>Scan QR Code</h3></div>
            <div class="card__body">
              <p>Scan QR code pada dokumen untuk verifikasi.</p>
              <button class="btn btn-secondary" id="btn-scan-qr">
                <span class="material-icons">qr_code_scanner</span>
                Scan QR
              </button>
              <div id="qr-scanner-container" style="display:none;margin-top:16px">
                <video id="qr-video" style="width:100%;max-width:400px;border-radius:8px"></video>
              </div>
            </div>
          </div>
        </div>
        
        <div id="verify-result-container"></div>
      </div>
    `;
  }
  
  async verifyFile(file) {
    this.showLoading();
    
    try {
      const result = await BlockchainService.verifyDocument(file);
      this.showResult(result);
    } catch (error) {
      this.showError('Gagal memverifikasi file: ' + error.message);
    }
  }
  
  async verifyByHash(hash) {
    if (!hash || hash.length < 10) {
      NotificationService.error('Hash tidak valid');
      return;
    }
    
    this.showLoading();
    
    try {
      const result = await BlockchainService.verifyDocument(hash);
      this.showResult(result);
    } catch (error) {
      this.showError('Gagal memverifikasi hash: ' + error.message);
    }
  }
  
  async verifyById(docId) {
    this.showLoading();
    
    try {
      const result = await BlockchainService.verifyDocument(docId);
      this.showResult(result);
    } catch (error) {
      this.showError('Dokumen tidak ditemukan di blockchain');
    }
  }
  
  showLoading() {
    const container = document.getElementById('verify-result-container');
    if (container) {
      container.innerHTML = `
        <div class="verify-result" style="text-align:center;padding:40px">
          <div class="progress--circular" style="margin:0 auto 16px"></div>
          <p>Memverifikasi dokumen...</p>
        </div>
      `;
    }
  }
  
  showResult(result) {
    const container = document.getElementById('verify-result-container');
    if (!container) return;
    
    if (result.verified) {
      container.innerHTML = `
        <div class="verify-result verify-result--valid">
          <div class="verify-result__icon">
            <span class="material-icons">verified</span>
          </div>
          <div class="verify-result__title">Dokumen Terverifikasi ✓</div>
          <div class="verify-result__detail">
            Dokumen ini valid dan tercatat di blockchain.
          </div>
          <div class="verify-result__info">
            <div class="detail-grid" style="margin-top:16px;text-align:left">
              <div class="detail-item">
                <span class="detail-item__label">Block Index</span>
                <span class="detail-item__value">#${result.blockIndex || '-'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-item__label">Timestamp</span>
                <span class="detail-item__value">${Formatters.dateTime(result.timestamp)}</span>
              </div>
              ${result.hash ? `
                <div class="detail-item detail-item--full">
                  <span class="detail-item__label">Hash</span>
                  <span class="verify-result__hash">${result.hash}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="verify-result verify-result--invalid">
          <div class="verify-result__icon">
            <span class="material-icons">gpp_bad</span>
          </div>
          <div class="verify-result__title">Dokumen Tidak Ditemukan</div>
          <div class="verify-result__detail">
            Dokumen ini tidak tercatat di blockchain atau telah dimodifikasi.
          </div>
        </div>
      `;
    }
  }
  
  showError(message) {
    const container = document.getElementById('verify-result-container');
    if (container) {
      container.innerHTML = `
        <div class="verify-result verify-result--invalid">
          <div class="verify-result__icon">
            <span class="material-icons">error</span>
          </div>
          <div class="verify-result__title">Verifikasi Gagal</div>
          <div class="verify-result__detail">${message}</div>
        </div>
      `;
    }
  }
  
  async scanQR() {
    const scannerContainer = document.getElementById('qr-scanner-container');
    const video = document.getElementById('qr-video');
    
    if (scannerContainer.style.display === 'none') {
      scannerContainer.style.display = 'block';
      
      const result = await QRService.startScanner(video, {
        onScan: (data) => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.docId) {
              this.verifyById(parsed.docId);
            } else if (parsed.hash) {
              this.verifyByHash(parsed.hash);
            }
          } catch {
            this.verifyByHash(data);
          }
        },
        onError: (error) => {
          NotificationService.error('Gagal mengakses kamera');
        }
      });
    } else {
      QRService.stopScanner();
      scannerContainer.style.display = 'none';
    }
  }
  
  bindEvents() {
    const uploadZone = document.getElementById('verify-upload-zone');
    const fileInput = document.getElementById('verify-file-input');
    
    uploadZone?.addEventListener('click', () => fileInput.click());
    uploadZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('upload-zone--dragover');
    });
    uploadZone?.addEventListener('dragleave', () => {
      uploadZone.classList.remove('upload-zone--dragover');
    });
    uploadZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('upload-zone--dragover');
      if (e.dataTransfer.files[0]) this.verifyFile(e.dataTransfer.files[0]);
    });
    
    fileInput?.addEventListener('change', (e) => {
      if (e.target.files[0]) this.verifyFile(e.target.files[0]);
    });
    
    document.getElementById('btn-verify-hash')?.addEventListener('click', () => {
      const hash = document.getElementById('hash-input').value.trim();
      this.verifyByHash(hash);
    });
    
    document.getElementById('btn-scan-qr')?.addEventListener('click', () => this.scanQR());
  }
}

const BlockchainVerifyComponent = (props) => {
  const page = new BlockchainVerifyPage();
  const container = document.createElement('div');
  container.className = 'content-area blockchain-verify';
  page.render(container);
  return container;
};
