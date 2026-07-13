/**
 * API KEYS PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class ApiKeysPage {
  constructor() {
    this.container = null;
    this.apiKeys = [];
  }
  
  async render(container) {
    this.container = container;
    this.container.innerHTML = this.getTemplate();
    await this.loadApiKeys();
    this.bindEvents();
  }
  
  getTemplate() {
    return `
      <div class="settings-content">
        <div class="settings-section">
          <h2 class="settings-section__title">API Keys</h2>
          <p class="settings-section__description">
            Kelola API keys untuk integrasi dengan sistem eksternal
          </p>
          
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
                  <span class="material-icons">add</span>
                  Generate Key
                </button>
              </div>
            </div>
          </div>
          
          <!-- Generated Key Display -->
          <div class="generated-key" id="generated-key" style="display:none">
            <div class="generated-key__warning">
              <span class="material-icons">warning</span>
              <span>Simpan API key ini sekarang. Anda tidak akan dapat melihatnya lagi!</span>
            </div>
            <div class="generated-key__value" id="generated-key-value"></div>
            <button class="btn btn-secondary btn-sm" id="btn-copy-key">
              <span class="material-icons">content_copy</span>
              Salin
            </button>
          </div>
          
          <!-- API Keys List -->
          <div class="api-key-list" id="api-key-list">
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
          </div>
        </div>
      </div>
    `;
  }
  
  async loadApiKeys() {
    try {
      const response = await api.get('apiKey.list');
      
      if (response.status === 'success') {
        this.apiKeys = response.data.items || [];
        this.renderApiKeys();
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
      document.getElementById('api-key-list').innerHTML = `
        <p class="text-muted">Gagal memuat API keys</p>
      `;
    }
  }
  
  renderApiKeys() {
    const list = document.getElementById('api-key-list');
    if (!list) return;
    
    if (this.apiKeys.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <span class="material-icons" style="font-size:48px;color:var(--md-sys-color-outline)">vpn_key_off</span>
          <p>Belum ada API key</p>
        </div>
      `;
      return;
    }
    
    list.innerHTML = this.apiKeys.map(key => `
      <div class="api-key-item">
        <div class="api-key-item__info">
          <div class="api-key-item__name">${key.name || 'Unnamed Key'}</div>
          <div class="api-key-item__key">${this.maskKey(key.id)}</div>
          <div class="api-key-item__meta">
            <span>Scope: ${key.scope || 'read'}</span>
            <span>Dibuat: ${this.formatDate(key.createdAt)}</span>
            ${key.expiry ? `<span>Kadaluarsa: ${this.formatDate(key.expiry)}</span>` : ''}
          </div>
        </div>
        <div class="api-key-item__status">
          <span class="badge ${key.isActive ? 'badge-success' : 'badge-error'}">
            ${key.isActive ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
        <div class="api-key-item__actions">
          ${key.isActive ? `
            <button class="btn-icon btn-icon-sm" onclick="window._revokeApiKey('${key.id}')" title="Revoke">
              <span class="material-icons">block</span>
            </button>
          ` : ''}
          <button class="btn-icon btn-icon-sm" onclick="window._deleteApiKey('${key.id}')" title="Hapus">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
    `).join('');
  }
  
  maskKey(id) {
    if (!id) return '****';
    return id.substring(0, 8) + '...' + id.substring(id.length - 4);
  }
  
  async generateApiKey() {
    const name = prompt('Nama untuk API key ini:', `API Key ${new Date().toLocaleDateString()}`);
    if (!name) return;
    
    const scope = prompt('Scope (read/write/admin):', 'read');
    if (!scope) return;
    
    try {
      const response = await api.post('apiKey.generate', {
        name,
        scope
      });
      
      if (response.status === 'success') {
        // Show generated key
        const generatedKey = document.getElementById('generated-key');
        const generatedKeyValue = document.getElementById('generated-key-value');
        
        if (generatedKey && generatedKeyValue) {
          generatedKeyValue.textContent = response.data.apiKey;
          generatedKey.style.display = 'block';
          
          // Scroll to key
          generatedKey.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Reload list
        await this.loadApiKeys();
        
        NotificationService.success('API key berhasil dibuat');
      }
    } catch (error) {
      NotificationService.error('Gagal membuat API key');
    }
  }
  
  async revokeApiKey(id) {
    const confirmed = await NotificationService.confirm(
      'Apakah Anda yakin ingin mencabut API key ini? Aplikasi yang menggunakan key ini akan berhenti berfungsi.',
      'Konfirmasi Revoke'
    );
    
    if (confirmed) {
      try {
        const response = await api.post('apiKey.revoke', { id });
        
        if (response.status === 'success') {
          NotificationService.success('API key berhasil dicabut');
          await this.loadApiKeys();
        }
      } catch (error) {
        NotificationService.error('Gagal mencabut API key');
      }
    }
  }
  
  async deleteApiKey(id) {
    const confirmed = await NotificationService.confirm(
      'Apakah Anda yakin ingin menghapus API key ini secara permanen?',
      'Konfirmasi Hapus'
    );
    
    if (confirmed) {
      // API keys are revoked, not deleted
      await this.revokeApiKey(id);
    }
  }
  
  copyApiKey() {
    const keyValue = document.getElementById('generated-key-value')?.textContent;
    if (!keyValue) return;
    
    navigator.clipboard.writeText(keyValue).then(() => {
      NotificationService.success('API key disalin ke clipboard');
    }).catch(() => {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = keyValue;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      NotificationService.success('API key disalin ke clipboard');
    });
  }
  
  formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  bindEvents() {
    document.getElementById('btn-generate-key')?.addEventListener('click', () => {
      this.generateApiKey();
    });
    
    document.getElementById('btn-copy-key')?.addEventListener('click', () => {
      this.copyApiKey();
    });
  }
}

// Global handlers
window._revokeApiKey = (id) => {
  const page = document.querySelector('.settings-content');
  if (page?._instance) {
    page._instance.revokeApiKey(id);
  }
};

window._deleteApiKey = (id) => {
  const page = document.querySelector('.settings-content');
  if (page?._instance) {
    page._instance.deleteApiKey(id);
  }
};

// Export
const ApiKeysComponent = (props) => {
  const page = new ApiKeysPage();
  const container = document.createElement('div');
  container.className = 'settings-content';
  container._instance = page;
  
  page.render(container);
  
  return container;
};
