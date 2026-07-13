/**
 * BLOCKCHAIN EXPLORER PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class BlockchainExplorerPage {
  constructor() {
    this.container = null;
    this.chain = [];
    this.stats = null;
  }
  
  async render(container) {
    this.container = container;
    this.container.innerHTML = this.getTemplate();
    
    await Promise.all([
      this.loadChain(),
      this.loadStats()
    ]);
    
    this.bindEvents();
  }
  
  getTemplate() {
    return `
      <div class="blockchain-explorer">
        <!-- Header -->
        <div class="content-area__header">
          <h1 class="content-area__title">
            <span class="material-icons" style="vertical-align:middle">link</span>
            Blockchain Explorer
          </h1>
          <p class="content-area__description">
            Verifikasi integritas dokumen menggunakan teknologi blockchain
          </p>
        </div>
        
        <!-- Stats Cards -->
        <div class="stats-grid" id="blockchain-stats">
          <div class="stat-card">
            <div class="stat-card__icon">
              <span class="material-icons">layers</span>
            </div>
            <div class="stat-card__content">
              <div class="stat-card__title">Total Blocks</div>
              <div class="stat-card__value" id="stat-blocks">0</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card__icon">
              <span class="material-icons">verified</span>
            </div>
            <div class="stat-card__content">
              <div class="stat-card__title">Chain Valid</div>
              <div class="stat-card__value" id="stat-valid">
                <span class="material-icons" style="color:var(--md-sys-color-success)">check_circle</span>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card__icon">
              <span class="material-icons">description</span>
            </div>
            <div class="stat-card__content">
              <div class="stat-card__title">Documents</div>
              <div class="stat-card__value" id="stat-documents">0</div>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="content-area__actions">
          <button class="btn btn-primary" id="btn-verify-document">
            <span class="material-icons">verified</span>
            Verifikasi Dokumen
          </button>
          <button class="btn btn-secondary" id="btn-verify-chain">
            <span class="material-icons">account_tree</span>
            Verifikasi Chain
          </button>
          <button class="btn btn-tertiary" id="btn-add-block">
            <span class="material-icons">add</span>
            Tambah Block
          </button>
        </div>
        
        <!-- Chain Visualization -->
        <div class="blockchain-chain" id="blockchain-chain">
          <!-- Blocks will be rendered here -->
        </div>
      </div>
    `;
  }
  
  async loadChain() {
    try {
      const response = await api.get('blockchain.getChain');
      
      if (response.status === 'success') {
        this.chain = response.data.chain || [];
        this.renderChain();
      }
    } catch (error) {
      console.error('Failed to load chain:', error);
    }
  }
  
  async loadStats() {
    try {
      const response = await api.get('blockchain.getStats');
      
      if (response.status === 'success') {
        this.stats = response.data;
        this.updateStats();
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }
  
  updateStats() {
    if (!this.stats) return;
    
    document.getElementById('stat-blocks').textContent = this.stats.blocks || 0;
    document.getElementById('stat-documents').textContent = this.stats.documents || 0;
    
    const validEl = document.getElementById('stat-valid');
    if (validEl) {
      validEl.innerHTML = this.stats.valid 
        ? '<span class="material-icons" style="color:var(--md-sys-color-success)">check_circle</span> Valid'
        : '<span class="material-icons" style="color:var(--md-sys-color-error)">error</span> Invalid';
    }
  }
  
  renderChain() {
    const chainEl = document.getElementById('blockchain-chain');
    if (!chainEl) return;
    
    if (this.chain.length === 0) {
      chainEl.innerHTML = `
        <div class="empty-state">
          <span class="material-icons" style="font-size:64px">link_off</span>
          <h3>Blockchain Kosong</h3>
          <p>Belum ada block dalam chain. Tambahkan dokumen untuk memulai.</p>
        </div>
      `;
      return;
    }
    
    chainEl.innerHTML = `
      <div class="chain-visualization">
        ${this.chain.map((block, index) => `
          <div class="chain-block" data-index="${index}">
            <div class="chain-block__header">
              <span class="chain-block__index">Block #${block.index || index}</span>
              <span class="chain-block__time">${this.formatTime(block.timestamp)}</span>
            </div>
            <div class="chain-block__body">
              <div class="chain-block__data">
                <strong>Data:</strong>
                <pre>${this.truncate(JSON.stringify(block.data, null, 2), 200)}</pre>
              </div>
              <div class="chain-block__hash">
                <strong>Hash:</strong>
                <code>${this.truncate(block.hash, 32)}</code>
              </div>
              <div class="chain-block__previous">
                <strong>Previous:</strong>
                <code>${this.truncate(block.previousHash, 32)}</code>
              </div>
            </div>
            <div class="chain-block__footer">
              <span class="chain-block__nonce">Nonce: ${block.nonce || 0}</span>
              ${index < this.chain.length - 1 ? 
                '<span class="chain-connector material-icons">arrow_downward</span>' : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  async verifyChain() {
    try {
      NotificationService.show('Memverifikasi blockchain...', 'info', { duration: 2000 });
      
      const response = await api.get('blockchain.verifyChain');
      
      if (response.status === 'success') {
        if (response.data.valid) {
          NotificationService.success('✅ Blockchain valid! Semua block terverifikasi.');
        } else {
          NotificationService.error('❌ Blockchain tidak valid! Ditemukan block yang dimodifikasi.');
        }
      }
    } catch (error) {
      NotificationService.error('Gagal verifikasi blockchain');
    }
  }
  
  async verifyDocument() {
    // Show document upload dialog
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Verifikasi Dokumen</h3>
          <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <p>Upload dokumen untuk memverifikasi integritasnya di blockchain.</p>
          <div class="upload-zone" id="verify-upload-zone">
            <span class="upload-zone__icon material-icons">cloud_upload</span>
            <p class="upload-zone__text">Drag & drop file di sini</p>
            <p class="upload-zone__hint">atau klik untuk memilih file</p>
            <input type="file" id="verify-file-input" style="display:none">
          </div>
          <div id="verify-result" style="margin-top:16px;display:none"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // File upload handlers
    const uploadZone = modal.querySelector('#verify-upload-zone');
    const fileInput = modal.querySelector('#verify-file-input');
    
    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('upload-zone--dragover');
    });
    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('upload-zone--dragover');
    });
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('upload-zone--dragover');
      const file = e.dataTransfer.files[0];
      if (file) this.verifyFile(file, modal);
    });
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.verifyFile(file, modal);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }
  
  async verifyFile(file, modal) {
    const resultEl = modal.querySelector('#verify-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<div class="progress--circular"></div><p>Memverifikasi...</p>';
    
    try {
      // Read file as base64
      const base64 = await this.fileToBase64(file);
      
      const response = await api.post('verify.document', {
        fileName: file.name,
        fileContent: base64
      });
      
      if (response.status === 'success') {
        if (response.data.verified) {
          resultEl.innerHTML = `
            <div style="color:var(--md-sys-color-success);text-align:center">
              <span class="material-icons" style="font-size:48px">verified</span>
              <h4>Dokumen Terverifikasi</h4>
              <p>Dokumen ini valid dan tercatat di blockchain.</p>
              <p><strong>Block:</strong> #${response.data.blockIndex}</p>
              <p><strong>Hash:</strong> <code>${this.truncate(response.data.hash, 32)}</code></p>
              <p><strong>Timestamp:</strong> ${this.formatTime(response.data.timestamp)}</p>
            </div>
          `;
        } else {
          resultEl.innerHTML = `
            <div style="color:var(--md-sys-color-error);text-align:center">
              <span class="material-icons" style="font-size:48px">gpp_bad</span>
              <h4>Dokumen Tidak Ditemukan</h4>
              <p>Dokumen ini tidak tercatat di blockchain atau telah dimodifikasi.</p>
            </div>
          `;
        }
      }
    } catch (error) {
      resultEl.innerHTML = `
        <div style="color:var(--md-sys-color-error);text-align:center">
          <p>Gagal memverifikasi dokumen: ${error.message}</p>
        </div>
      `;
    }
  }
  
  async addBlock() {
    const data = prompt('Masukkan data untuk block baru (JSON):', '{"documentId":"","type":""}');
    if (!data) return;
    
    try {
      const parsedData = JSON.parse(data);
      
      const response = await api.post('blockchain.addBlock', parsedData);
      
      if (response.status === 'success') {
        NotificationService.success('Block berhasil ditambahkan');
        await this.loadChain();
        await this.loadStats();
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        NotificationService.error('Format JSON tidak valid');
      } else {
        NotificationService.error('Gagal menambahkan block');
      }
    }
  }
  
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  truncate(str, maxLength) {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  }
  
  formatTime(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('id-ID');
  }
  
  bindEvents() {
    document.getElementById('btn-verify-document')?.addEventListener('click', () => {
      this.verifyDocument();
    });
    
    document.getElementById('btn-verify-chain')?.addEventListener('click', () => {
      this.verifyChain();
    });
    
    document.getElementById('btn-add-block')?.addEventListener('click', () => {
      this.addBlock();
    });
  }
}

// Export
const BlockchainExplorerComponent = (props) => {
  const page = new BlockchainExplorerPage();
  const container = document.createElement('div');
  container.className = 'content-area blockchain-explorer';
  
  page.render(container);
  
  return container;
};
