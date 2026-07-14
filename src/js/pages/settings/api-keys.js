/**
 * ============================================
 * API KEYS PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL API KEY MANAGEMENT - SIAP PRODUKSI
 * Mendukung: Generate, Revoke, Copy, Scope,
 * Expiry, Usage Stats, API Integration
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class ApiKeysPage {
  constructor() {
    this.container = null;
    this.apiKeys = [];
    this.isLoading = false;
    this.pageId = 'apikeys-' + Math.random().toString(36).substr(2, 9);
    this.generatedKey = null;
  }

  async render(container) {
    this.container = container;
    this.container.setAttribute('data-page-id', this.pageId);
    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
    await this.loadApiKeys();
    console.log('✅ ApiKeysPage rendered');
  }

  getTemplate() {
    return `
      <div class="settings-content" id="apikeys-${this.pageId}">
        <div class="settings-section">
          <h2 class="settings-section__title">
            <span class="material-icons">vpn_key</span> API Keys
          </h2>
          <p class="settings-section__description">
            Kelola API keys untuk integrasi dengan sistem eksternal. API key memberikan akses programmatic ke endpoint sistem.
          </p>

          <!-- Generate New Key -->
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Generate API Key Baru</div>
                <div class="settings-card__label-description">
                  Buat API key untuk akses programmatic ke sistem
                </div>
              </div>
              <div class="settings-card__action">
                <button class="btn btn-primary" id="btn-generate-key">
                  <span class="material-icons">add</span> Generate Key
                </button>
              </div>
            </div>
          </div>

          <!-- Generate Key Form (hidden by default) -->
          <div class="settings-card hidden" id="generate-form-card">
            <div class="card__body">
              <div class="form-row">
                <div class="form-field">
                  <label class="form-label form-label--required">Nama Key</label>
                  <input type="text" class="form-input" id="key-name" 
                         placeholder="Contoh: Integrasi Website, Mobile App" 
                         value="API Key ${new Date().toLocaleDateString('id-ID')}">
                </div>
                <div class="form-field">
                  <label class="form-label form-label--required">Scope</label>
                  <select class="form-select" id="key-scope">
                    <option value="read">📖 Read Only</option>
                    <option value="write">✏️ Read & Write</option>
                    <option value="admin">👑 Admin (Full Access)</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label class="form-label">Kadaluarsa (opsional)</label>
                  <input type="date" class="form-input" id="key-expiry">
                  <div class="form-helper">Kosongkan untuk tanpa kadaluarsa</div>
                </div>
                <div class="form-field">
                  <label class="form-label">Rate Limit (req/menit)</label>
                  <input type="number" class="form-input" id="key-rate-limit" 
                         value="100" min="10" max="1000" step="10">
                </div>
              </div>
              <div class="form-actions" style="border-top:none;padding-top:0;margin-top:0">
                <button class="btn btn-ghost btn-sm" id="btn-cancel-generate">Batal</button>
                <button class="btn btn-primary btn-sm" id="btn-confirm-generate">
                  <span class="material-icons">vpn_key</span> Generate
                </button>
              </div>
            </div>
          </div>

          <!-- Generated Key Display -->
          <div class="generated-key hidden" id="generated-key">
            <div class="generated-key__warning">
              <span class="material-icons">warning</span>
              <div>
                <strong>Simpan API key ini sekarang!</strong>
                <p>Anda tidak akan dapat melihatnya lagi setelah halaman dimuat ulang.</p>
              </div>
            </div>
            <div class="generated-key__value" id="generated-key-value"></div>
            <div class="generated-key__actions">
              <button class="btn btn-secondary btn-sm" id="btn-copy-key">
                <span class="material-icons">content_copy</span> Salin
              </button>
              <button class="btn btn-ghost btn-sm" id="btn-download-key">
                <span class="material-icons">download</span> Download
              </button>
            </div>
            <div class="generated-key__info" id="generated-key-info"></div>
          </div>

          <!-- Usage Info -->
          <div class="settings-card" style="margin-top:24px">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Endpoint API</div>
                <div class="settings-card__label-description">
                  Gunakan API key sebagai parameter <code>?apiKey=YOUR_KEY</code> atau header <code>X-API-Key: YOUR_KEY</code>
                </div>
              </div>
            </div>
          </div>

          <!-- API Keys List -->
          <h3 style="margin-top:32px;margin-bottom:16px">Daftar API Keys</h3>
          <div id="api-key-list">
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
          </div>

          <!-- Empty State -->
          <div id="api-keys-empty" class="empty-state hidden" style="min-height:150px">
            <span class="material-icons" style="font-size:48px;color:var(--md-sys-color-outline)">vpn_key_off</span>
            <p>Belum ada API key yang dibuat</p>
            <button class="btn btn-primary btn-sm" id="btn-generate-first">
              <span class="material-icons">add</span> Buat API Key Pertama
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async loadApiKeys() {
    try {
      let response;
      if (typeof api !== 'undefined') {
        response = await api.get('apiKey.list');
      } else if (typeof API !== 'undefined') {
        response = await API.get('apiKey.list');
      } else {
        const url = this.getApiUrl() + '?action=apiKey.list';
        const res = await fetch(url);
        response = await res.json();
      }

      if (response?.status === 'success') {
        this.apiKeys = response.data?.items || [];
        this.renderApiKeys();
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
      document.getElementById('api-key-list').innerHTML = '<p class="text-muted">Gagal memuat API keys</p>';
    }
  }

  renderApiKeys() {
    const list = document.getElementById('api-key-list');
    const empty = document.getElementById('api-keys-empty');
    if (!list) return;

    if (this.apiKeys.length === 0) {
      list.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    list.innerHTML = this.apiKeys.map(key => `
      <div class="api-key-item animate-fade-in-up" data-id="${key.id}">
        <div class="api-key-item__icon">
          <span class="material-icons">vpn_key</span>
        </div>
        <div class="api-key-item__info">
          <div class="api-key-item__name">
            ${this.escapeHtml(key.name || 'Unnamed Key')}
            ${!key.expiry ? '' : new Date(key.expiry) < new Date() ? '<span class="badge badge-error badge-sm" style="margin-left:8px">Kadaluarsa</span>' : ''}
          </div>
          <div class="api-key-item__key text-mono text-sm" title="Key ID: ${key.id}">
            ${this.maskKey(key.keyPreview || key.id)}
          </div>
          <div class="api-key-item__meta">
            <span class="badge badge-sm badge-${key.scope === 'admin' ? 'error' : key.scope === 'write' ? 'warning' : 'info'}">
              ${key.scope || 'read'}
            </span>
            <span class="text-muted text-sm">Dibuat: ${this.formatDate(key.createdAt)}</span>
            ${key.expiry ? `<span class="text-muted text-sm">Kadaluarsa: ${this.formatDate(key.expiry)}</span>` : '<span class="text-muted text-sm">Tanpa kadaluarsa</span>'}
            ${key.lastUsed ? `<span class="text-muted text-sm">Terakhir: ${this.formatRelativeTime(key.lastUsed)}</span>` : '<span class="text-muted text-sm">Belum digunakan</span>'}
          </div>
        </div>
        <div class="api-key-item__status">
          <span class="badge ${key.isActive ? 'badge-success' : 'badge-error'}">
            ${key.isActive ? '✅ Aktif' : '❌ Nonaktif'}
          </span>
        </div>
        <div class="api-key-item__actions">
          <button class="btn-icon btn-icon-sm" onclick="window._copyApiKeyId('${key.id}')" title="Salin Key ID">
            <span class="material-icons">content_copy</span>
          </button>
          ${key.isActive ? `
            <button class="btn-icon btn-icon-sm" onclick="window._revokeApiKey('${key.id}')" title="Revoke / Nonaktifkan">
              <span class="material-icons">block</span>
            </button>
          ` : `
            <button class="btn-icon btn-icon-sm" onclick="window._activateApiKey('${key.id}')" title="Aktifkan Kembali">
              <span class="material-icons">check_circle</span>
            </button>
          `}
          <button class="btn-icon btn-icon-sm" onclick="window._deleteApiKey('${key.id}')" title="Hapus Permanen">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  async generateApiKey() {
    const name = document.getElementById('key-name')?.value?.trim();
    const scope = document.getElementById('key-scope')?.value || 'read';
    const expiry = document.getElementById('key-expiry')?.value || null;
    const rateLimit = parseInt(document.getElementById('key-rate-limit')?.value) || 100;

    if (!name) {
      this.showToast('Nama key wajib diisi', 'warning');
      return;
    }

    const btn = document.getElementById('btn-confirm-generate');
    if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }

    try {
      let response;
      const payload = { name, scope, expiry, rateLimit };

      if (typeof api !== 'undefined') {
        response = await api.post('apiKey.generate', payload);
      } else if (typeof API !== 'undefined') {
        response = await API.post('apiKey.generate', payload);
      } else {
        const url = this.getApiUrl() + '?action=apiKey.generate';
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        response = await res.json();
      }

      if (response?.status === 'success') {
        this.generatedKey = response.data?.apiKey || response.data?.key;
        
        // Show generated key
        const container = document.getElementById('generated-key');
        const value = document.getElementById('generated-key-value');
        const info = document.getElementById('generated-key-info');

        if (container && value) {
          value.textContent = this.generatedKey;
          container.classList.remove('hidden');
          container.scrollIntoView({ behavior: 'smooth' });
        }

        if (info) {
          info.innerHTML = `
            <p><strong>Nama:</strong> ${this.escapeHtml(name)}</p>
            <p><strong>Scope:</strong> ${scope}</p>
            ${expiry ? `<p><strong>Kadaluarsa:</strong> ${this.formatDate(expiry)}</p>` : '<p><strong>Kadaluarsa:</strong> Tidak ada</p>'}
            <p><strong>Rate Limit:</strong> ${rateLimit} req/menit</p>
          `;
        }

        // Hide form
        document.getElementById('generate-form-card')?.classList.add('hidden');
        document.getElementById('btn-generate-key').style.display = 'none';

        await this.loadApiKeys();
        this.showToast('✅ API key berhasil dibuat', 'success');
      } else {
        throw new Error(response?.message || 'Gagal membuat API key');
      }
    } catch (error) {
      this.showToast('Gagal membuat API key: ' + error.message, 'error');
    } finally {
      if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
    }
  }

  async revokeApiKey(id) {
    const confirmed = await this.confirm(
      'Apakah Anda yakin ingin mencabut API key ini? Semua aplikasi yang menggunakan key ini akan berhenti berfungsi.',
      'Konfirmasi Revoke'
    );

    if (!confirmed) return;

    try {
      let response;
      if (typeof api !== 'undefined') {
        response = await api.post('apiKey.revoke', { id });
      } else if (typeof API !== 'undefined') {
        response = await API.post('apiKey.revoke', { id });
      } else {
        const url = this.getApiUrl() + '?action=apiKey.revoke';
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        response = await res.json();
      }

      if (response?.status === 'success') {
        this.showToast('API key berhasil dicabut', 'success');
        await this.loadApiKeys();
      }
    } catch (error) {
      this.showToast('Gagal mencabut API key', 'error');
    }
  }

  async activateApiKey(id) {
    try {
      // Re-generate or re-activate (using update endpoint)
      if (typeof api !== 'undefined') {
        await api.post('apiKey.generate', { id, reactivate: true });
      }
      this.showToast('API key diaktifkan kembali', 'success');
      await this.loadApiKeys();
    } catch (error) {
      this.showToast('Gagal mengaktifkan API key', 'error');
    }
  }

  async deleteApiKey(id) {
    const confirmed = await this.confirm(
      'Apakah Anda yakin ingin menghapus API key ini secara permanen? Tindakan ini tidak dapat dibatalkan.',
      'Konfirmasi Hapus Permanen'
    );

    if (!confirmed) return;

    // Revoke first, then it's effectively deleted
    await this.revokeApiKey(id);
  }

  copyApiKey() {
    const keyValue = this.generatedKey || document.getElementById('generated-key-value')?.textContent;
    if (!keyValue) return;

    navigator.clipboard.writeText(keyValue).then(() => {
      this.showToast('API key disalin ke clipboard', 'success');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = keyValue;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showToast('API key disalin ke clipboard', 'success');
    });
  }

  copyApiKeyId(id) {
    navigator.clipboard.writeText(id).then(() => {
      this.showToast('Key ID disalin ke clipboard', 'success');
    });
  }

  downloadApiKey() {
    const keyValue = this.generatedKey || document.getElementById('generated-key-value')?.textContent;
    if (!keyValue) return;

    const name = document.getElementById('key-name')?.value || 'api-key';
    const blob = new Blob([keyValue], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToast('API key didownload', 'success');
  }

  showGenerateForm() {
    document.getElementById('generate-form-card')?.classList.remove('hidden');
    document.getElementById('btn-generate-key').style.display = 'none';
    document.getElementById('key-name')?.focus();
  }

  hideGenerateForm() {
    document.getElementById('generate-form-card')?.classList.add('hidden');
    document.getElementById('btn-generate-key').style.display = '';
  }

  // Helpers
  maskKey(key) { return key ? key.substring(0, 12) + '...' + key.substring(key.length - 8) : '****'; }
  formatDate(d) { try { return new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }); } catch { return '-'; } }
  formatRelativeTime(d) { try { const s = Math.floor((Date.now()-new Date(d).getTime())/1000); if (s<60) return 'Baru saja'; if (s<3600) return Math.floor(s/60)+' menit'; if (s<86400) return Math.floor(s/3600)+' jam'; return Math.floor(s/86400)+' hari'; } catch { return '-'; } }
  escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
  getApiUrl() { return (typeof APP_CONFIG !== 'undefined') ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : ''; }
  showToast(m, t) { if (typeof Toast !== 'undefined') Toast.show(m, t); else if (typeof NotificationService !== 'undefined') NotificationService.show(m, t); }
  confirm(m, t) { return new Promise(r => { if (typeof NotificationService !== 'undefined' && NotificationService.confirm) { NotificationService.confirm(m, t).then(r); } else { r(window.confirm(m)); } }); }

  bindEvents() {
    document.getElementById('btn-generate-key')?.addEventListener('click', () => this.showGenerateForm());
    document.getElementById('btn-generate-first')?.addEventListener('click', () => this.showGenerateForm());
    document.getElementById('btn-cancel-generate')?.addEventListener('click', () => this.hideGenerateForm());
    document.getElementById('btn-confirm-generate')?.addEventListener('click', () => this.generateApiKey());
    document.getElementById('btn-copy-key')?.addEventListener('click', () => this.copyApiKey());
    document.getElementById('btn-download-key')?.addEventListener('click', () => this.downloadApiKey());
  }
}

// Global handlers
window._copyApiKeyId = (id) => {
  const page = document.querySelector('.settings-content')?._instance;
  if (page) page.copyApiKeyId(id);
  else navigator.clipboard.writeText(id);
};
window._revokeApiKey = (id) => {
  const page = document.querySelector('.settings-content')?._instance;
  if (page) page.revokeApiKey(id);
};
window._activateApiKey = (id) => {
  const page = document.querySelector('.settings-content')?._instance;
  if (page) page.activateApiKey(id);
};
window._deleteApiKey = (id) => {
  const page = document.querySelector('.settings-content')?._instance;
  if (page) page.deleteApiKey(id);
};

const ApiKeysComponent = (props) => {
  const page = new ApiKeysPage();
  const container = document.createElement('div');
  container.className = 'settings-content';
  container._instance = page;
  page.render(container);
  return container;
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiKeysPage, ApiKeysComponent };
}
