/**
 * DISTRIBUSI SURAT MASUK PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class DistribusiSuratPage {
  constructor() {
    this.container = null;
    this.suratList = [];
    this.selectedSurat = null;
    this.selectedRecipients = [];
    this.loading = false;
  }
  
  async render(container) {
    this.container = container;
    this.container.innerHTML = this.getTemplate();
    await this.loadSuratList();
    this.bindEvents();
  }
  
  getTemplate() {
    return `
      <div class="distribusi-page">
        <div class="content-area__header">
          <h1 class="content-area__title">Distribusi Surat Masuk</h1>
          <p class="content-area__description">Distribusikan surat masuk ke unit/bagian terkait</p>
        </div>
        
        <div class="distribusi-layout">
          <div class="distribusi-main">
            <div class="filters-bar">
              <div class="search-input" style="max-width:400px">
                <span class="search-input__icon material-icons">search</span>
                <input type="text" class="form-input" placeholder="Cari surat untuk didistribusikan..." id="filter-search">
              </div>
              <select class="form-select" id="filter-status" style="width:180px">
                <option value="diterima">Belum Didistribusikan</option>
                <option value="">Semua Status</option>
                <option value="diproses">Sedang Diproses</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>
            
            <div class="surat-select-list" id="surat-select-list">
              <div class="skeleton-text"></div>
              <div class="skeleton-text"></div>
              <div class="skeleton-text"></div>
            </div>
          </div>
          
          <div class="distribusi-sidebar">
            <div class="card" id="selected-surat-card">
              <div class="card__header"><h3>Surat Terpilih</h3></div>
              <div class="card__body">
                <p class="text-muted" id="no-surat-selected">Pilih surat dari daftar</p>
                <div id="surat-detail" style="display:none"></div>
              </div>
            </div>
            
            <div class="card" id="recipients-card">
              <div class="card__header">
                <h3>Tujuan Distribusi</h3>
                <button class="btn btn-sm btn-primary" id="btn-add-recipient">
                  <span class="material-icons">person_add</span>
                </button>
              </div>
              <div class="card__body" id="recipients-list">
                <p class="text-muted">Belum ada penerima</p>
              </div>
            </div>
            
            <button class="btn btn-primary btn-block" id="btn-distribusikan" disabled>
              <span class="material-icons">send</span>
              Distribusikan
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  async loadSuratList() {
    try {
      const response = await api.getSuratMasukList({ status: 'diterima', limit: 50 });
      
      if (response.status === 'success') {
        this.suratList = response.data.items || [];
        this.renderSuratList();
      }
    } catch (error) {
      NotificationService.error('Gagal memuat daftar surat');
    }
  }
  
  renderSuratList() {
    const list = document.getElementById('surat-select-list');
    if (!list) return;
    
    if (this.suratList.length === 0) {
      list.innerHTML = `<div class="empty-state"><span class="material-icons">inbox</span><p>Tidak ada surat yang perlu didistribusikan</p></div>`;
      return;
    }
    
    list.innerHTML = this.suratList.map(surat => `
      <div class="surat-select-item ${this.selectedSurat?.id === surat.id ? 'surat-select-item--selected' : ''}" 
           data-id="${surat.id}" onclick="window._selectDistribusiSurat('${surat.id}')">
        <div class="surat-select-item__checkbox">
          <span class="material-icons">${this.selectedSurat?.id === surat.id ? 'check_circle' : 'radio_button_unchecked'}</span>
        </div>
        <div class="surat-select-item__content">
          <div class="surat-select-item__number">${surat.nomorAgenda || surat.nomorSurat}</div>
          <div class="surat-select-item__subject">${surat.perihal || '-'}</div>
          <div class="surat-select-item__meta">
            <span>${surat.pengirim || '-'}</span>
            <span>${Formatters.date(surat.tanggalSurat)}</span>
            <span class="badge badge-info">${surat.status}</span>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  selectSurat(id) {
    this.selectedSurat = this.suratList.find(s => s.id === id);
    this.selectedRecipients = [];
    this.renderSuratList();
    this.renderSuratDetail();
    this.renderRecipients();
    this.updateDistribusiButton();
  }
  
  renderSuratDetail() {
    const noSurat = document.getElementById('no-surat-selected');
    const detail = document.getElementById('surat-detail');
    
    if (!this.selectedSurat) {
      noSurat.style.display = 'block';
      detail.style.display = 'none';
      return;
    }
    
    noSurat.style.display = 'none';
    detail.style.display = 'block';
    
    const s = this.selectedSurat;
    detail.innerHTML = `
      <div class="detail-item">
        <span class="detail-item__label">Nomor Agenda</span>
        <span class="detail-item__value text-mono">${s.nomorAgenda || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-item__label">Nomor Surat</span>
        <span class="detail-item__value">${s.nomorSurat || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-item__label">Tanggal Surat</span>
        <span class="detail-item__value">${Formatters.date(s.tanggalSurat)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-item__label">Pengirim</span>
        <span class="detail-item__value">${s.pengirim || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-item__label">Perihal</span>
        <span class="detail-item__value">${s.perihal || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-item__label">Sifat</span>
        <span class="detail-item__value"><span class="badge">${s.sifat || 'biasa'}</span></span>
      </div>
    `;
  }
  
  addRecipient(user) {
    if (this.selectedRecipients.find(r => r.id === user.id)) {
      NotificationService.warning('Penerima sudah ditambahkan');
      return;
    }
    
    this.selectedRecipients.push(user);
    this.renderRecipients();
    this.updateDistribusiButton();
  }
  
  removeRecipient(userId) {
    this.selectedRecipients = this.selectedRecipients.filter(r => r.id !== userId);
    this.renderRecipients();
    this.updateDistribusiButton();
  }
  
  renderRecipients() {
    const list = document.getElementById('recipients-list');
    if (!list) return;
    
    if (this.selectedRecipients.length === 0) {
      list.innerHTML = '<p class="text-muted">Belum ada penerima</p>';
      return;
    }
    
    list.innerHTML = this.selectedRecipients.map(user => `
      <div class="recipient-item">
        <div class="recipient-item__avatar">${Formatters.initials(user.namaLengkap || user.username)}</div>
        <div class="recipient-item__info">
          <div class="recipient-item__name">${user.namaLengkap || user.username}</div>
          <div class="recipient-item__role">${user.jabatan || user.role || '-'}</div>
        </div>
        <button class="btn-icon btn-icon-sm" onclick="window._removeDistribusiRecipient('${user.id}')">
          <span class="material-icons">close</span>
        </button>
      </div>
    `).join('');
  }
  
  updateDistribusiButton() {
    const btn = document.getElementById('btn-distribusikan');
    if (btn) {
      btn.disabled = !this.selectedSurat || this.selectedRecipients.length === 0;
    }
  }
  
  async distribusikan() {
    if (!this.selectedSurat || this.selectedRecipients.length === 0) return;
    
    try {
      const response = await api.post('suratMasuk.distribusi', {
        suratMasukId: this.selectedSurat.id,
        recipients: this.selectedRecipients.map(r => r.id),
        instruksi: ''
      });
      
      if (response.status === 'success') {
        NotificationService.success('Surat berhasil didistribusikan');
        this.selectedSurat = null;
        this.selectedRecipients = [];
        this.loadSuratList();
        this.renderSuratDetail();
        this.renderRecipients();
        this.updateDistribusiButton();
      }
    } catch (error) {
      NotificationService.error('Gagal mendistribusikan surat');
    }
  }
  
  showRecipientSelector() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content modal-content--md">
        <div class="modal-header">
          <h3>Pilih Penerima</h3>
          <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body" id="recipient-options-body">
          <div class="progress--circular"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.loadRecipientOptions(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }
  
  async loadRecipientOptions(modal) {
    try {
      const response = await api.getUsersList({ isActive: true, limit: 100 });
      const body = modal.querySelector('#recipient-options-body');
      
      if (response.status === 'success') {
        const users = response.data.items || [];
        body.innerHTML = users.map(user => `
          <div class="recipient-option" onclick="window._addDistribusiRecipient('${user.id}')">
            <div class="recipient-option__avatar">${Formatters.initials(user.namaLengkap || user.username)}</div>
            <div class="recipient-option__info">
              <div class="recipient-option__name">${user.namaLengkap || user.username}</div>
              <div class="recipient-option__detail">${user.jabatan || ''} · ${user.unitKerja || ''}</div>
            </div>
            ${this.selectedRecipients.find(r => r.id === user.id) 
              ? '<span class="material-icons" style="color:var(--md-sys-color-primary)">check_circle</span>' 
              : '<span class="material-icons" style="color:var(--md-sys-color-outline)">add_circle</span>'}
          </div>
        `).join('');
      }
    } catch (error) {
      modal.querySelector('#recipient-options-body').innerHTML = '<p class="text-muted">Gagal memuat pengguna</p>';
    }
  }
  
  bindEvents() {
    document.getElementById('filter-search')?.addEventListener('input', debounce((e) => {
      this.loadSuratList();
    }, 500));
    
    document.getElementById('filter-status')?.addEventListener('change', () => {
      this.loadSuratList();
    });
    
    document.getElementById('btn-add-recipient')?.addEventListener('click', () => {
      if (!this.selectedSurat) {
        NotificationService.warning('Pilih surat terlebih dahulu');
        return;
      }
      this.showRecipientSelector();
    });
    
    document.getElementById('btn-distribusikan')?.addEventListener('click', () => {
      this.distribusikan();
    });
  }
}

window._selectDistribusiSurat = (id) => {
  const page = document.querySelector('.distribusi-page');
  if (page?._instance) page._instance.selectSurat(id);
};
window._addDistribusiRecipient = (userId) => {
  const modal = document.querySelector('.modal-overlay');
  const page = document.querySelector('.distribusi-page');
  const user = window._recipientOptions?.find(u => u.id === userId);
  if (page?._instance && user) {
    page._instance.addRecipient(user);
    if (modal) modal.remove();
  }
};
window._removeDistribusiRecipient = (userId) => {
  const page = document.querySelector('.distribusi-page');
  if (page?._instance) page._instance.removeRecipient(userId);
};

const DistribusiSuratComponent = (props) => {
  const page = new DistribusiSuratPage();
  const container = document.createElement('div');
  container.className = 'content-area distribusi-page';
  container._instance = page;
  page.render(container);
  return container;
};
