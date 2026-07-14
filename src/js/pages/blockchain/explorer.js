/**
 * ============================================
 * BLOCKCHAIN EXPLORER PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL BLOCKCHAIN EXPLORER - SIAP PRODUKSI
 * Mendukung: Chain View, Block Detail, Verify,
 * Document Registration, Proof of Existence
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class BlockchainExplorerPage {
  constructor() {
    this.container = null;
    this.chain = [];
    this.stats = null;
    this.isLoading = false;
    this.selectedBlock = null;
    this.verificationResult = null;
    this.pollingInterval = null;
  }

  async render(container) {
    this.container = container;
    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
    
    await Promise.all([
      this.loadChain(),
      this.loadStats()
    ]);
    
    this.startPolling();
    console.log('✅ BlockchainExplorerPage rendered');
  }

  getTemplate() {
    return `
      <div class="blockchain-explorer" id="bc-explorer">
        <div class="content-area__header">
          <div class="header-left">
            <h1 class="content-area__title">
              <span class="material-icons" style="vertical-align:middle">link</span>
              Blockchain Explorer
            </h1>
            <p class="content-area__description">
              Verifikasi integritas dokumen menggunakan teknologi blockchain SHA-256
            </p>
          </div>
          <div class="header-right">
            <button class="btn btn-sm btn-ghost" id="btn-refresh-chain" title="Refresh">
              <span class="material-icons">refresh</span>
            </button>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid" id="blockchain-stats">
          <div class="stat-card stat-card--primary">
            <div class="stat-card__icon"><span class="material-icons">layers</span></div>
            <div class="stat-card__content">
              <div class="stat-card__title">Total Blocks</div>
              <div class="stat-card__value" id="stat-blocks">-</div>
            </div>
          </div>
          <div class="stat-card" id="stat-valid-card">
            <div class="stat-card__icon"><span class="material-icons">verified</span></div>
            <div class="stat-card__content">
              <div class="stat-card__title">Chain Status</div>
              <div class="stat-card__value" id="stat-valid">-</div>
            </div>
          </div>
          <div class="stat-card stat-card--tertiary">
            <div class="stat-card__icon"><span class="material-icons">description</span></div>
            <div class="stat-card__content">
              <div class="stat-card__title">Documents</div>
              <div class="stat-card__value" id="stat-documents">-</div>
            </div>
          </div>
          <div class="stat-card stat-card--success">
            <div class="stat-card__icon"><span class="material-icons">speed</span></div>
            <div class="stat-card__content">
              <div class="stat-card__title">Last Block</div>
              <div class="stat-card__value text-sm" id="stat-last-block">-</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="content-area__actions">
          <button class="btn btn-primary" id="btn-verify-document">
            <span class="material-icons">verified</span> Verifikasi Dokumen
          </button>
          <button class="btn btn-secondary" id="btn-verify-chain">
            <span class="material-icons">account_tree</span> Verifikasi Chain
          </button>
          <button class="btn btn-secondary" id="btn-register-document">
            <span class="material-icons">add_link</span> Register Dokumen
          </button>
          <button class="btn btn-ghost" id="btn-export-chain">
            <span class="material-icons">download</span> Export
          </button>
        </div>

        <!-- Search Block -->
        <div class="blockchain-search" style="margin-bottom:16px">
          <div class="search-input" style="max-width:400px">
            <span class="search-input__icon material-icons">search</span>
            <input type="text" class="form-input" placeholder="Cari block #index atau hash..." id="search-block">
          </div>
        </div>

        <!-- Chain Visualization -->
        <div id="chain-loading" class="page-loading" style="display:none">
          <div class="progress--circular"></div>
          <p>Memuat blockchain...</p>
        </div>
        <div id="chain-container">
          <div class="blockchain-chain" id="blockchain-chain"></div>
        </div>
        <div id="chain-empty" style="display:none">
          <div class="empty-state">
            <span class="material-icons" style="font-size:64px">link_off</span>
            <h3>Blockchain Kosong</h3>
            <p>Belum ada block dalam chain. Daftarkan dokumen untuk memulai blockchain.</p>
            <button class="btn btn-primary" id="btn-register-first">
              <span class="material-icons">add_link</span> Register Dokumen Pertama
            </button>
          </div>
        </div>

        <!-- Block Detail Modal -->
        <div class="modal-overlay hidden" id="block-detail-modal">
          <div class="modal-content modal-content--lg">
            <div class="modal-header">
              <h3>Detail Block</h3>
              <button class="btn-icon" id="btn-close-block-detail">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body" id="block-detail-body"></div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-sm" id="btn-verify-block">
                <span class="material-icons">verified</span> Verifikasi Block
              </button>
              <button class="btn btn-ghost btn-sm" id="btn-close-block-footer">Tutup</button>
            </div>
          </div>
        </div>

        <!-- Verify Document Modal -->
        <div class="modal-overlay hidden" id="verify-modal">
          <div class="modal-content modal-content--md">
            <div class="modal-header">
              <h3>Verifikasi Dokumen</h3>
              <button class="btn-icon" id="btn-close-verify">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <p style="margin-bottom:16px">Upload dokumen atau masukkan hash untuk memverifikasi integritasnya di blockchain.</p>
              
              <div class="tabs tabs--pills" style="margin-bottom:16px">
                <button class="tab tab--active" data-tab="upload">Upload File</button>
                <button class="tab" data-tab="hash">Input Hash</button>
              </div>

              <div id="tab-upload">
                <div class="upload-zone" id="verify-upload-zone">
                  <span class="upload-zone__icon material-icons">cloud_upload</span>
                  <p class="upload-zone__text">Drag & drop file di sini</p>
                  <p class="upload-zone__hint">atau klik untuk memilih file</p>
                  <input type="file" id="verify-file-input" style="display:none">
                </div>
                <div class="file-info hidden" id="verify-file-info"></div>
              </div>

              <div id="tab-hash" style="display:none">
                <div class="form-field">
                  <label class="form-label">Hash SHA-256</label>
                  <textarea class="form-input form-textarea form-textarea--no-resize" 
                            id="verify-hash-input" rows="2" 
                            placeholder="Masukkan hash SHA-256 dokumen..."></textarea>
                </div>
                <button class="btn btn-primary btn-sm" id="btn-verify-hash">
                  <span class="material-icons">search</span> Verifikasi Hash
                </button>
              </div>

              <div id="verify-result" style="margin-top:16px;display:none"></div>
            </div>
          </div>
        </div>

        <!-- Register Document Modal -->
        <div class="modal-overlay hidden" id="register-modal">
          <div class="modal-content modal-content--md">
            <div class="modal-header">
              <h3>Register Dokumen ke Blockchain</h3>
              <button class="btn-icon" id="btn-close-register">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-field">
                <label class="form-label">Upload Dokumen</label>
                <div class="upload-zone" id="register-upload-zone">
                  <span class="upload-zone__icon material-icons">cloud_upload</span>
                  <p class="upload-zone__text">Pilih dokumen untuk diregistrasi</p>
                  <input type="file" id="register-file-input" style="display:none">
                </div>
                <div class="file-info hidden" id="register-file-info"></div>
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label class="form-label">Tipe Dokumen</label>
                  <select class="form-select" id="register-doc-type">
                    <option value="surat-masuk">Surat Masuk</option>
                    <option value="surat-keluar">Surat Keluar</option>
                    <option value="disposisi">Disposisi</option>
                    <option value="approval">Approval</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
                <div class="form-field">
                  <label class="form-label">Nomor Dokumen</label>
                  <input type="text" class="form-input" id="register-doc-number" placeholder="Nomor surat/dokumen">
                </div>
              </div>
              <div id="register-result" style="margin-top:16px;display:none"></div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" id="btn-close-register-footer">Batal</button>
              <button class="btn btn-primary" id="btn-submit-register">
                <span class="material-icons">add_link</span> Register
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async loadChain() {
    this.showChainLoading();
    
    try {
      let response;
      if (typeof api !== 'undefined') {
        response = await api.get('blockchain.getChain');
      } else if (typeof API !== 'undefined') {
        response = await API.get('blockchain.getChain');
      } else {
        const url = this.getApiUrl() + '?action=blockchain.getChain';
        const res = await fetch(url);
        response = await res.json();
      }

      if (response?.status === 'success') {
        this.chain = response.data?.chain || [];
        this.renderChain();
      }
    } catch (error) {
      console.error('Failed to load chain:', error);
      this.showToast('Gagal memuat blockchain', 'error');
    } finally {
      this.hideChainLoading();
    }
  }

  async loadStats() {
    try {
      let response;
      if (typeof api !== 'undefined') {
        response = await api.get('blockchain.getStats');
      } else if (typeof API !== 'undefined') {
        response = await API.get('blockchain.getStats');
      } else {
        const url = this.getApiUrl() + '?action=blockchain.getStats';
        const res = await fetch(url);
        response = await res.json();
      }

      if (response?.status === 'success') {
        this.stats = response.data;
        this.updateStats();
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  updateStats() {
    if (!this.stats) return;
    
    document.getElementById('stat-blocks').textContent = (this.stats.blocks || 0).toLocaleString();
    document.getElementById('stat-documents').textContent = (this.stats.documents || 0).toLocaleString();

    const validEl = document.getElementById('stat-valid');
    const validCard = document.getElementById('stat-valid-card');
    if (validEl) {
      validEl.innerHTML = this.stats.valid
        ? '<span style="color:var(--md-sys-color-success);display:flex;align-items:center;gap:8px"><span class="material-icons">check_circle</span> Valid</span>'
        : '<span style="color:var(--md-sys-color-error);display:flex;align-items:center;gap:8px"><span class="material-icons">error</span> Invalid</span>';
    }
    if (validCard && !this.stats.valid) {
      validCard.style.borderColor = 'var(--md-sys-color-error)';
    }

    const lastBlockEl = document.getElementById('stat-last-block');
    if (lastBlockEl && this.stats.lastBlockTime) {
      lastBlockEl.textContent = this.formatTime(this.stats.lastBlockTime);
    }
  }

  renderChain() {
    const chainEl = document.getElementById('blockchain-chain');
    const emptyEl = document.getElementById('chain-empty');
    if (!chainEl) return;

    if (this.chain.length === 0) {
      chainEl.innerHTML = '';
      emptyEl.style.display = 'flex';
      return;
    }

    emptyEl.style.display = 'none';

    chainEl.innerHTML = `
      <div class="chain-visualization">
        ${this.chain.map((block, index) => `
          <div class="chain-block animate-fade-in-up" 
               data-index="${block.index || index}" 
               style="cursor:pointer;animation-delay:${index * 50}ms"
               data-block-index="${block.index || index}">
            <div class="chain-block__header">
              <span class="chain-block__index">
                <span class="material-icons" style="font-size:16px">link</span>
                Block #${block.index || index}
              </span>
              <span class="chain-block__time">${this.formatTime(block.timestamp)}</span>
            </div>
            <div class="chain-block__body">
              <div class="chain-block__hash-row">
                <span class="chain-block__label">Hash:</span>
                <code class="text-mono text-sm" title="${block.hash}">${this.shortenHash(block.hash)}</code>
              </div>
              <div class="chain-block__hash-row">
                <span class="chain-block__label">Previous:</span>
                <code class="text-mono text-sm" title="${block.previousHash}">${this.shortenHash(block.previousHash)}</code>
              </div>
              <div class="chain-block__data-preview text-muted text-sm">
                ${this.truncate(this.extractBlockTitle(block.data), 80)}
              </div>
            </div>
            <div class="chain-block__footer">
              <span class="chain-block__nonce">Nonce: ${block.nonce || 0}</span>
              <span class="chain-block__badge badge badge-sm ${block.index === 0 ? 'badge-primary' : 'badge-success'}">
                ${block.index === 0 ? 'Genesis' : 'Verified'}
              </span>
            </div>
          </div>
          ${index < this.chain.length - 1 ? `
            <div class="chain-connector">
              <span class="material-icons" style="color:var(--md-sys-color-primary)">arrow_downward</span>
            </div>
          ` : ''}
        `).join('')}
      </div>
    `;
  }

  showBlockDetail(block) {
    this.selectedBlock = block;
    const modal = document.getElementById('block-detail-modal');
    const body = document.getElementById('block-detail-body');
    if (!modal || !body) return;

    modal.classList.remove('hidden');
    body.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-item__label">Index</span>
          <span class="detail-item__value">#${block.index || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Timestamp</span>
          <span class="detail-item__value">${this.formatDateTime(block.timestamp)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Nonce</span>
          <span class="detail-item__value text-mono">${block.nonce || 0}</span>
        </div>
        <div class="detail-item detail-item--full">
          <span class="detail-item__label">Hash</span>
          <span class="detail-item__value text-mono text-sm" style="word-break:break-all">${block.hash || '-'}</span>
        </div>
        <div class="detail-item detail-item--full">
          <span class="detail-item__label">Previous Hash</span>
          <span class="detail-item__value text-mono text-sm" style="word-break:break-all">${block.previousHash || (block.index === 0 ? '0 (Genesis)' : '-')}</span>
        </div>
        <div class="detail-item detail-item--full">
          <span class="detail-item__label">Data</span>
          <pre class="text-sm" style="background:var(--md-sys-color-surface-container);padding:12px;border-radius:8px;overflow-x:auto;max-height:300px">${JSON.stringify(block.data, null, 2)}</pre>
        </div>
      </div>
    `;
  }

  async verifyChain() {
    this.showToast('Memverifikasi blockchain...', 'info');
    
    try {
      let response;
      if (typeof api !== 'undefined') {
        response = await api.get('blockchain.verifyChain');
      } else if (typeof API !== 'undefined') {
        response = await API.get('blockchain.verifyChain');
      } else {
        const url = this.getApiUrl() + '?action=blockchain.verifyChain';
        const res = await fetch(url);
        response = await res.json();
      }

      if (response?.status === 'success') {
        if (response.data?.valid) {
          this.showToast('✅ Blockchain valid! Semua block terverifikasi.', 'success');
        } else {
          this.showToast(`❌ Blockchain tidak valid! ${response.data.invalidBlocks?.length || 0} block bermasalah.`, 'error');
          // Highlight invalid blocks
          if (response.data.invalidBlocks) {
            response.data.invalidBlocks.forEach(idx => {
              const el = document.querySelector(`[data-block-index="${idx}"]`);
              if (el) el.style.borderColor = 'var(--md-sys-color-error)';
            });
          }
        }
        // Reload stats
        await this.loadStats();
      }
    } catch (error) {
      this.showToast('Gagal verifikasi blockchain: ' + error.message, 'error');
    }
  }

  async verifySingleBlock(block) {
    try {
      const computedHash = await this.computeBlockHash(block);
      const isValid = computedHash === block.hash;
      
      this.showToast(
        isValid ? '✅ Block hash valid!' : '❌ Block hash tidak valid!',
        isValid ? 'success' : 'error'
      );
    } catch (error) {
      this.showToast('Gagal verifikasi block: ' + error.message, 'error');
    }
  }

  async computeBlockHash(block) {
    const data = block.index + block.timestamp + JSON.stringify(block.data) + block.previousHash + block.nonce;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  openVerifyModal() {
    document.getElementById('verify-modal').classList.remove('hidden');
  }

  openRegisterModal() {
    document.getElementById('register-modal').classList.remove('hidden');
  }

  async verifyFile(file) {
    const resultEl = document.getElementById('verify-result');
    const fileInfo = document.getElementById('verify-file-info');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<div class="progress--circular"></div><p style="text-align:center">Menghitung hash dan memverifikasi...</p>';

    if (fileInfo) {
      fileInfo.classList.remove('hidden');
      fileInfo.innerHTML = `<strong>${file.name}</strong> (${this.formatSize(file.size)})`;
    }

    try {
      // Calculate hash locally
      const hash = await this.hashFile(file);
      
      // Verify via API
      let response;
      if (typeof api !== 'undefined') {
        response = await api.post('verify.document', { hash, fileName: file.name });
      } else if (typeof API !== 'undefined') {
        response = await API.post('verify.document', { hash, fileName: file.name });
      } else {
        const url = this.getApiUrl() + '?action=verify.document';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hash, fileName: file.name })
        });
        response = await res.json();
      }

      resultEl.innerHTML = this.renderVerificationResult(response, hash);
    } catch (error) {
      resultEl.innerHTML = `<div class="alert alert-error">❌ Gagal memverifikasi: ${error.message}</div>`;
    }
  }

  async verifyHash(hash) {
    if (!hash || hash.length < 10) {
      this.showToast('Masukkan hash yang valid (minimal 10 karakter)', 'warning');
      return;
    }

    const resultEl = document.getElementById('verify-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<div class="progress--circular"></div><p style="text-align:center">Memverifikasi hash...</p>';

    try {
      let response;
      if (typeof api !== 'undefined') {
        response = await api.post('verify.document', { hash });
      } else if (typeof API !== 'undefined') {
        response = await API.post('verify.document', { hash });
      } else {
        const url = this.getApiUrl() + '?action=verify.document';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hash })
        });
        response = await res.json();
      }

      resultEl.innerHTML = this.renderVerificationResult(response, hash);
    } catch (error) {
      resultEl.innerHTML = `<div class="alert alert-error">❌ Gagal memverifikasi: ${error.message}</div>`;
    }
  }

  renderVerificationResult(response, hash) {
    if (response?.status === 'success' && response.data?.verified) {
      const data = response.data;
      return `
        <div class="verify-result verify-result--valid" style="text-align:center;padding:20px;background:var(--md-sys-color-success-container);border-radius:12px">
          <span class="material-icons" style="font-size:48px;color:var(--md-sys-color-success)">verified</span>
          <h4 style="color:var(--md-sys-color-on-success-container)">✅ Dokumen Terverifikasi</h4>
          <p style="color:var(--md-sys-color-on-success-container)">Dokumen ini valid dan tercatat di blockchain.</p>
          <div style="margin-top:12px;text-align:left;font-size:13px">
            <p><strong>Block:</strong> #${data.blockIndex || '-'}</p>
            <p><strong>Hash:</strong> <code class="text-mono text-sm" style="word-break:break-all">${hash}</code></p>
            <p><strong>Terdaftar:</strong> ${this.formatDateTime(data.timestamp)}</p>
          </div>
        </div>
      `;
    }
    return `
      <div class="verify-result verify-result--invalid" style="text-align:center;padding:20px;background:var(--md-sys-color-error-container);border-radius:12px">
        <span class="material-icons" style="font-size:48px;color:var(--md-sys-color-error)">gpp_bad</span>
        <h4 style="color:var(--md-sys-color-on-error-container)">❌ Dokumen Tidak Ditemukan</h4>
        <p style="color:var(--md-sys-color-on-error-container)">Dokumen ini tidak tercatat di blockchain atau telah dimodifikasi.</p>
        <p style="margin-top:8px;color:var(--md-sys-color-on-error-container);font-size:12px">Hash: <code class="text-mono">${this.shortenHash(hash)}</code></p>
      </div>
    `;
  }

  async registerDocument() {
    const fileInput = document.getElementById('register-file-input');
    const file = fileInput?.files?.[0];
    const docType = document.getElementById('register-doc-type')?.value || 'lainnya';
    const docNumber = document.getElementById('register-doc-number')?.value?.trim();
    const resultEl = document.getElementById('register-result');

    if (!file) {
      this.showToast('Pilih dokumen terlebih dahulu', 'warning');
      return;
    }

    resultEl.style.display = 'block';
    resultEl.innerHTML = '<div class="progress--circular"></div><p style="text-align:center">Meregistrasi dokumen ke blockchain...</p>';

    try {
      const hash = await this.hashFile(file);

      let response;
      if (typeof api !== 'undefined') {
        response = await api.post('blockchain.addBlock', {
          documentId: docNumber || hash.substring(0, 16),
          documentType: docType,
          hash: hash,
          nomorSurat: docNumber || '',
          fileName: file.name,
          fileSize: file.size,
          metadata: JSON.stringify({ type: docType, registeredAt: new Date().toISOString() }),
          timestamp: new Date().toISOString()
        });
      } else if (typeof API !== 'undefined') {
        response = await API.post('blockchain.addBlock', {
          documentId: docNumber || hash.substring(0, 16),
          documentType: docType,
          hash: hash,
          nomorSurat: docNumber || '',
          fileName: file.name
        });
      } else {
        const url = this.getApiUrl() + '?action=blockchain.addBlock';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: docNumber || hash.substring(0, 16),
            documentType: docType,
            hash: hash,
            fileName: file.name
          })
        });
        response = await res.json();
      }

      if (response?.status === 'success') {
        resultEl.innerHTML = `
          <div class="alert alert-success">
            ✅ Dokumen berhasil diregistrasi di blockchain!
            <br><strong>Block:</strong> #${response.data?.index || '-'}
            <br><strong>Hash:</strong> <code class="text-mono text-sm">${this.shortenHash(hash)}</code>
          </div>
        `;
        this.showToast('Dokumen berhasil diregistrasi!', 'success');
        await this.loadChain();
        await this.loadStats();
        
        // Clear file input
        if (fileInput) fileInput.value = '';
        document.getElementById('register-file-info')?.classList.add('hidden');
        document.getElementById('register-doc-number').value = '';
      }
    } catch (error) {
      resultEl.innerHTML = `<div class="alert alert-error">❌ Gagal meregistrasi: ${error.message}</div>`;
    }
  }

  async hashFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  searchBlock(query) {
    if (!query) return;
    
    // Search by index
    const index = parseInt(query);
    if (!isNaN(index)) {
      const block = this.chain.find(b => (b.index || 0) === index);
      if (block) {
        this.showBlockDetail(block);
        return;
      }
    }

    // Search by hash
    const blockByHash = this.chain.find(b => b.hash?.startsWith(query) || b.hash === query);
    if (blockByHash) {
      this.showBlockDetail(blockByHash);
      return;
    }

    this.showToast('Block tidak ditemukan', 'warning');
  }

  exportChain() {
    if (this.chain.length === 0) {
      this.showToast('Blockchain kosong', 'warning');
      return;
    }

    const data = JSON.stringify({
      exportedAt: new Date().toISOString(),
      totalBlocks: this.chain.length,
      chain: this.chain
    }, null, 2);

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blockchain-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToast('Blockchain berhasil diexport', 'success');
  }

  showChainLoading() {
    document.getElementById('chain-loading').style.display = 'flex';
    document.getElementById('chain-container').style.display = 'none';
  }

  hideChainLoading() {
    document.getElementById('chain-loading').style.display = 'none';
    document.getElementById('chain-container').style.display = 'block';
  }

  startPolling() {
    this.stopPolling();
    this.pollingInterval = setInterval(() => this.loadStats(), 60000);
  }

  stopPolling() {
    if (this.pollingInterval) { clearInterval(this.pollingInterval); this.pollingInterval = null; }
  }

  // Helpers
  shortenHash(hash) { return hash ? hash.substring(0, 12) + '...' + hash.substring(hash.length - 8) : '-'; }
  truncate(str, len) { return str && str.length > len ? str.substring(0, len) + '...' : str || ''; }
  extractBlockTitle(data) {
    if (!data) return 'Empty block';
    if (typeof data === 'string') return data.substring(0, 80);
    const obj = typeof data === 'object' ? data : {};
    return obj.nomorSurat || obj.documentId || obj.fileName || obj.perihal || JSON.stringify(obj).substring(0, 80);
  }
  formatTime(d) { try { return new Date(d).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' }); } catch { return d; } }
  formatDateTime(d) { try { return new Date(d).toLocaleString('id-ID'); } catch { return d; } }
  formatSize(b) { if (!b) return ''; return b < 1024 ? b+' B' : b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB'; }
  getApiUrl() { return (typeof APP_CONFIG !== 'undefined') ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : ''; }
  showToast(m, t) { if (typeof Toast !== 'undefined') Toast.show(m, t); else if (typeof NotificationService !== 'undefined') NotificationService.show(m, t); }

  bindEvents() {
    document.getElementById('btn-refresh-chain')?.addEventListener('click', () => this.loadChain());
    document.getElementById('btn-verify-chain')?.addEventListener('click', () => this.verifyChain());
    document.getElementById('btn-verify-document')?.addEventListener('click', () => this.openVerifyModal());
    document.getElementById('btn-register-document')?.addEventListener('click', () => this.openRegisterModal());
    document.getElementById('btn-export-chain')?.addEventListener('click', () => this.exportChain());
    document.getElementById('btn-register-first')?.addEventListener('click', () => this.openRegisterModal());

    // Search
    let searchTimeout;
    document.getElementById('search-block')?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => this.searchBlock(e.target.value.trim()), 500);
    });

    // Chain block clicks
    document.getElementById('blockchain-chain')?.addEventListener('click', (e) => {
      const block = e.target.closest('.chain-block');
      if (block) {
        const index = parseInt(block.dataset.blockIndex);
        const blockData = this.chain.find(b => (b.index || 0) === index);
        if (blockData) this.showBlockDetail(blockData);
      }
    });

    // Modal close buttons
    document.querySelectorAll('#btn-close-block-detail, #btn-close-block-footer').forEach(b => b?.addEventListener('click', () => document.getElementById('block-detail-modal').classList.add('hidden')));
    document.querySelectorAll('#btn-close-verify').forEach(b => b?.addEventListener('click', () => document.getElementById('verify-modal').classList.add('hidden')));
    document.querySelectorAll('#btn-close-register, #btn-close-register-footer').forEach(b => b?.addEventListener('click', () => document.getElementById('register-modal').classList.add('hidden')));

    // Block verify button
    document.getElementById('btn-verify-block')?.addEventListener('click', () => {
      if (this.selectedBlock) this.verifySingleBlock(this.selectedBlock);
    });

    // Verify modal tabs
    document.querySelectorAll('#verify-modal .tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#verify-modal .tab').forEach(t => t.classList.remove('tab--active'));
        tab.classList.add('tab--active');
        document.getElementById('tab-upload').style.display = tab.dataset.tab === 'upload' ? 'block' : 'none';
        document.getElementById('tab-hash').style.display = tab.dataset.tab === 'hash' ? 'block' : 'none';
      });
    });

    // Verify file upload
    const uploadZone = document.getElementById('verify-upload-zone');
    const fileInput = document.getElementById('verify-file-input');
    uploadZone?.addEventListener('click', () => fileInput?.click());
    uploadZone?.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('upload-zone--dragover'); });
    uploadZone?.addEventListener('dragleave', () => uploadZone.classList.remove('upload-zone--dragover'));
    uploadZone?.addEventListener('drop', (e) => { e.preventDefault(); uploadZone.classList.remove('upload-zone--dragover'); if (e.dataTransfer.files[0]) this.verifyFile(e.dataTransfer.files[0]); });
    fileInput?.addEventListener('change', (e) => { if (e.target.files[0]) this.verifyFile(e.target.files[0]); });
    document.getElementById('btn-verify-hash')?.addEventListener('click', () => this.verifyHash(document.getElementById('verify-hash-input')?.value?.trim()));

    // Register file upload
    const regZone = document.getElementById('register-upload-zone');
    const regInput = document.getElementById('register-file-input');
    regZone?.addEventListener('click', () => regInput?.click());
    regZone?.addEventListener('dragover', (e) => { e.preventDefault(); regZone.classList.add('upload-zone--dragover'); });
    regZone?.addEventListener('dragleave', () => regZone.classList.remove('upload-zone--dragover'));
    regZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      regZone.classList.remove('upload-zone--dragover');
      if (e.dataTransfer.files[0]) {
        regInput.files = e.dataTransfer.files;
        const info = document.getElementById('register-file-info');
        if (info) { info.classList.remove('hidden'); info.innerHTML = `<strong>${e.dataTransfer.files[0].name}</strong> (${this.formatSize(e.dataTransfer.files[0].size)})`; }
      }
    });
    regInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      const info = document.getElementById('register-file-info');
      if (file && info) { info.classList.remove('hidden'); info.innerHTML = `<strong>${file.name}</strong> (${this.formatSize(file.size)})`; }
    });
    document.getElementById('btn-submit-register')?.addEventListener('click', () => this.registerDocument());

    // Close modals on backdrop click
    document.querySelectorAll('.modal-overlay').forEach(m => m.addEventListener('click', (e) => { if (e.target === m) m.classList.add('hidden'); }));
  }

  destroy() { this.stopPolling(); }
}

const BlockchainExplorerComponent = (props) => {
  const page = new BlockchainExplorerPage();
  const container = document.createElement('div');
  container.className = 'content-area blockchain-explorer';
  container._bcPage = page;
  page.render(container);
  return container;
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BlockchainExplorerPage, BlockchainExplorerComponent };
}
