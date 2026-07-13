/**
 * WEBHOOKS SETTINGS PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class WebhooksSettingsPage {
  constructor() {
    this.container = null;
    this.webhooks = [];
  }
  
  async render(container) {
    this.container = container;
    this.container.innerHTML = this.getTemplate();
    await this.loadWebhooks();
    this.bindEvents();
  }
  
  getTemplate() {
    return `
      <div class="settings-content">
        <div class="settings-section">
          <h2 class="settings-section__title">Webhooks</h2>
          <p class="settings-section__description">
            Konfigurasi webhook untuk integrasi dengan sistem eksternal
          </p>
          
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Tambah Webhook Baru</div>
                <div class="settings-card__label-description">
                  Kirim data ke URL eksternal saat event terjadi
                </div>
              </div>
              <div class="settings-card__action">
                <button class="btn btn-primary btn-sm" id="btn-add-webhook">
                  <span class="material-icons">add</span> Tambah
                </button>
              </div>
            </div>
          </div>
          
          <div class="webhook-list" id="webhook-list">
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
          </div>
        </div>
      </div>
    `;
  }
  
  async loadWebhooks() {
    try {
      const response = await api.get('webhook.list');
      
      if (response.status === 'success') {
        this.webhooks = response.data.items || [];
        this.renderWebhooks();
      }
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    }
  }
  
  renderWebhooks() {
    const list = document.getElementById('webhook-list');
    if (!list) return;
    
    if (this.webhooks.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <span class="material-icons">webhook</span>
          <p>Belum ada webhook terdaftar</p>
        </div>
      `;
      return;
    }
    
    list.innerHTML = this.webhooks.map(webhook => `
      <div class="webhook-item">
        <div class="webhook-item__status webhook-item__status--${webhook.isActive ? 'active' : 'inactive'}"></div>
        <div class="webhook-item__info">
          <div class="webhook-item__url">${webhook.url || '-'}</div>
          <div class="webhook-item__events">
            ${(webhook.events || []).map(e => `<span class="badge badge-sm">${e}</span>`).join(' ')}
          </div>
          <div class="webhook-item__meta">
            <span>Dibuat: ${Formatters.date(webhook.createdAt)}</span>
            ${webhook.lastTrigger ? `<span>Terakhir: ${Formatters.relativeTime(webhook.lastTrigger)}</span>` : ''}
          </div>
        </div>
        <div class="webhook-item__actions">
          <button class="btn-icon btn-icon-sm" onclick="window._testWebhook('${webhook.id}')" title="Test">
            <span class="material-icons">play_arrow</span>
          </button>
          <button class="btn-icon btn-icon-sm" onclick="window._editWebhook('${webhook.id}')" title="Edit">
            <span class="material-icons">edit</span>
          </button>
          <button class="btn-icon btn-icon-sm" onclick="window._deleteWebhook('${webhook.id}')" title="Hapus">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
    `).join('');
  }
  
  async addWebhook() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content modal-content--md">
        <div class="modal-header">
          <h3>Tambah Webhook</h3>
          <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label class="form-label form-label--required">URL Webhook</label>
            <input type="url" class="form-input" id="webhook-url" placeholder="https://example.com/webhook">
          </div>
          <div class="form-field">
            <label class="form-label">Secret Key (opsional)</label>
            <input type="text" class="form-input" id="webhook-secret" placeholder="Secret untuk verifikasi">
          </div>
          <div class="form-field">
            <label class="form-label">Events</label>
            <div class="checkbox-group">
              <label class="form-checkbox">
                <input type="checkbox" class="form-checkbox__input" value="surat-masuk.created" checked>
                <span class="form-checkbox__label">Surat Masuk Dibuat</span>
              </label>
              <label class="form-checkbox">
                <input type="checkbox" class="form-checkbox__input" value="surat-keluar.created">
                <span class="form-checkbox__label">Surat Keluar Dibuat</span>
              </label>
              <label class="form-checkbox">
                <input type="checkbox" class="form-checkbox__input" value="disposisi.created">
                <span class="form-checkbox__label">Disposisi Dibuat</span>
              </label>
              <label class="form-checkbox">
                <input type="checkbox" class="form-checkbox__input" value="disposisi.completed">
                <span class="form-checkbox__label">Disposisi Selesai</span>
              </label>
              <label class="form-checkbox">
                <input type="checkbox" class="form-checkbox__input" value="approval.processed">
                <span class="form-checkbox__label">Approval Diproses</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Batal</button>
          <button class="btn btn-primary" id="btn-save-webhook">Simpan</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#btn-save-webhook').addEventListener('click', async () => {
      const url = modal.querySelector('#webhook-url').value.trim();
      const secret = modal.querySelector('#webhook-secret').value.trim();
      const events = Array.from(modal.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);
      
      if (!url) {
        NotificationService.error('URL webhook diperlukan');
        return;
      }
      
      try {
        const response = await api.post('webhook.register', { url, secret, events });
        
        if (response.status === 'success') {
          NotificationService.success('Webhook berhasil ditambahkan');
          modal.remove();
          this.loadWebhooks();
        }
      } catch (error) {
        NotificationService.error('Gagal menambah webhook');
      }
    });
    
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }
  
  async testWebhook(id) {
    try {
      NotificationService.show('Mengirim test webhook...', 'info', { duration: 2000 });
      
      const response = await api.post('webhook.trigger', {
        id,
        test: true,
        payload: { test: true, timestamp: new Date().toISOString() }
      });
      
      if (response.status === 'success') {
        NotificationService.success('Webhook berhasil dikirim');
      }
    } catch (error) {
      NotificationService.error('Gagal mengirim webhook');
    }
  }
  
  async deleteWebhook(id) {
    const confirmed = await NotificationService.confirm('Hapus webhook ini?');
    
    if (confirmed) {
      try {
        await api.post('webhook.delete', { id });
        NotificationService.success('Webhook dihapus');
        this.loadWebhooks();
      } catch (error) {
        NotificationService.error('Gagal menghapus webhook');
      }
    }
  }
  
  bindEvents() {
    document.getElementById('btn-add-webhook')?.addEventListener('click', () => this.addWebhook());
  }
}

window._testWebhook = (id) => {
  const page = document.querySelector('.settings-content');
  if (page?._instance) page._instance.testWebhook(id);
};
window._editWebhook = (id) => { NotificationService.info('Fitur edit webhook sedang dikembangkan'); };
window._deleteWebhook = (id) => {
  const page = document.querySelector('.settings-content');
  if (page?._instance) page._instance.deleteWebhook(id);
};

const WebhooksSettingsComponent = (props) => {
  const page = new WebhooksSettingsPage();
  const container = document.createElement('div');
  container.className = 'settings-content';
  container._instance = page;
  page.render(container);
  return container;
};
