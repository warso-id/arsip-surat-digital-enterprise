/**
 * DISPOSISI CREATE PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class DisposisiCreatePage {
  constructor() {
    this.container = null;
    this.selectedSurat = null;
    this.selectedRecipients = [];
    this.formData = {};
  }
  
  async render(container) {
    this.container = container;
    
    // Get suratMasukId from query params
    const route = store.getState('ui.currentRoute');
    const suratMasukId = route?.query?.suratMasukId || route?.query?.ids?.split(',')[0];
    
    this.container.innerHTML = this.getTemplate();
    
    // Load surat if ID provided
    if (suratMasukId) {
      await this.loadSuratMasuk(suratMasukId);
    }
    
    // Load recipients
    await this.loadRecipients();
    
    this.bindEvents();
  }
  
  getTemplate() {
    return `
      <div class="disposisi-create">
        <!-- Header -->
        <div class="content-area__header">
          <h1 class="content-area__title">Buat Disposisi</h1>
          <p class="content-area__description">
            Buat disposisi untuk surat masuk
          </p>
        </div>
        
        <!-- Surat Reference -->
        <div class="surat-reference" id="surat-reference">
          <div class="surat-reference__icon">
            <span class="material-icons">description</span>
          </div>
          <div class="surat-reference__info">
            <div class="surat-reference__number" id="ref-number">Pilih Surat Masuk</div>
            <div class="surat-reference__subject" id="ref-subject">Klik untuk memilih surat</div>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-select-surat">
            <span class="material-icons">search</span>
            Pilih
          </button>
        </div>
        
        <!-- Recipients -->
        <div class="form-section">
          <div class="form-section__header">
            <h3>Tujuan Disposisi</h3>
          </div>
          <div class="form-section__body">
            <div class="recipient-list" id="recipient-list">
              <p class="text-muted">Belum ada penerima dipilih</p>
            </div>
            <button class="add-recipient-btn" id="btn-add-recipient">
              <span class="material-icons">person_add</span>
              Tambah Penerima
            </button>
          </div>
        </div>
        
        <!-- Instruction -->
        <div class="form-section">
          <div class="form-section__header">
            <h3>Instruksi</h3>
          </div>
          <div class="form-section__body">
            <div class="form-field">
              <label class="form-label form-label--required">Instruksi</label>
              <textarea class="form-input form-textarea" id="instruksi" 
                        placeholder="Tulis instruksi disposisi..." rows="4"></textarea>
              <span class="form-helper">Minimal 10 karakter</span>
            </div>
            
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Sifat</label>
                <select class="form-select" id="sifat">
                  <option value="biasa">Biasa</option>
                  <option value="penting">Penting</option>
                  <option value="segera">Segera</option>
                  <option value="rahasia">Rahasia</option>
                </select>
              </div>
              
              <div class="form-field">
                <label class="form-label">Batas Waktu</label>
                <input type="date" class="form-input" id="batas-waktu">
              </div>
            </div>
          </div>
        </div>
        
        <!-- Additional Options -->
        <div class="form-section">
          <div class="form-section__header">
            <h3>Opsi Tambahan</h3>
          </div>
          <div class="form-section__body">
            <label class="form-checkbox">
              <input type="checkbox" class="form-checkbox__input" id="notify-email">
              <span class="form-checkbox__label">Kirim notifikasi email</span>
            </label>
            
            <label class="form-checkbox">
              <input type="checkbox" class="form-checkbox__input" id="notify-telegram">
              <span class="form-checkbox__label">Kirim notifikasi Telegram</span>
            </label>
            
            <label class="form-checkbox">
              <input type="checkbox" class="form-checkbox__input" id="require-approval">
              <span class="form-checkbox__label">Perlu approval lanjutan</span>
            </label>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="form-actions">
          <button class="btn btn-ghost" onclick="history.back()">Batal</button>
          <button class="btn btn-secondary" id="btn-save-draft">
            <span class="material-icons">save</span>
            Simpan Draft
          </button>
          <button class="btn btn-primary" id="btn-submit">
            <span class="material-icons">send</span>
            Kirim Disposisi
          </button>
        </div>
      </div>
    `;
  }
  
  async loadSuratMasuk(id) {
    try {
      const response = await api.getSuratMasukDetail(id);
      
      if (response.status === 'success') {
        this.selectedSurat = response.data;
        
        document.getElementById('ref-number').textContent = 
          response.data.nomorAgenda || response.data.nomorSurat || '-';
        document.getElementById('ref-subject').textContent = 
          response.data.perihal || 'Tidak ada perihal';
      }
    } catch (error) {
      NotificationService.error('Gagal memuat data surat');
    }
  }
  
  async loadRecipients() {
    try {
      const response = await api.getUsersList({ role: 'staff,kabid,kasubag', limit: 100 });
      
      if (response.status === 'success') {
        window._recipientOptions = response.data.items || [];
      }
    } catch (error) {
      console.warn('Failed to load recipients:', error);
    }
  }
  
  addRecipient(user) {
    if (this.selectedRecipients.find(r => r.id === user.id)) {
      NotificationService.warning('Penerima sudah ditambahkan');
      return;
    }
    
    this.selectedRecipients.push(user);
    this.renderRecipients();
  }
  
  removeRecipient(userId) {
    this.selectedRecipients = this.selectedRecipients.filter(r => r.id !== userId);
    this.renderRecipients();
  }
  
  renderRecipients() {
    const list = document.getElementById('recipient-list');
    if (!list) return;
    
    if (this.selectedRecipients.length === 0) {
      list.innerHTML = '<p class="text-muted">Belum ada penerima dipilih</p>';
      return;
    }
    
    list.innerHTML = this.selectedRecipients.map(user => `
      <div class="recipient-item">
        <div class="recipient-item__avatar">
          ${(user.namaLengkap || user.username).charAt(0).toUpperCase()}
        </div>
        <div class="recipient-item__info">
          <div class="recipient-item__name">${user.namaLengkap || user.username}</div>
          <div class="recipient-item__role">${user.jabatan || user.role || '-'}</div>
        </div>
        <button class="btn-icon btn-icon-sm recipient-item__remove" 
                onclick="window._removeRecipient('${user.id}')">
          <span class="material-icons">close</span>
        </button>
      </div>
    `).join('');
  }
  
  async submitDisposisi(isDraft = false) {
    // Validate
    if (!this.selectedSurat) {
      NotificationService.error('Pilih surat masuk terlebih dahulu');
      return;
    }
    
    if (this.selectedRecipients.length === 0) {
      NotificationService.error('Pilih minimal satu penerima');
      return;
    }
    
    const instruksi = document.getElementById('instruksi').value.trim();
    if (!isDraft && instruksi.length < 10) {
      NotificationService.error('Instruksi minimal 10 karakter');
      return;
    }
    
    const data = {
      suratMasukId: this.selectedSurat.id,
      kepadaUserId: this.selectedRecipients[0].id,
      instruksi: instruksi,
      sifat: document.getElementById('sifat').value,
      batasWaktu: document.getElementById('batas-waktu').value || null,
      status: isDraft ? 'draft' : 'pending'
    };
    
    try {
      // If multiple recipients, create multiple disposisi
      if (this.selectedRecipients.length > 1 && !isDraft) {
        const multiData = {
          suratMasukId: this.selectedSurat.id,
          recipients: this.selectedRecipients.map(r => ({
            kepadaUserId: r.id,
            instruksi: instruksi
          })),
          sifat: data.sifat,
          batasWaktu: data.batasWaktu
        };
        
        const response = await api.createMultipleDisposisi(multiData);
        
        if (response.status === 'success') {
          NotificationService.success('Disposisi berhasil dibuat');
          router.navigate('/disposisi');
        }
      } else {
        const response = await api.createDisposisi(data);
        
        if (response.status === 'success') {
          NotificationService.success(
            isDraft ? 'Disposisi disimpan sebagai draft' : 'Disposisi berhasil dikirim'
          );
          router.navigate('/disposisi');
        }
      }
    } catch (error) {
      NotificationService.error('Gagal membuat disposisi: ' + error.message);
    }
  }
  
  showSuratSelector() {
    // Create modal for surat selection
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content modal-content--lg">
        <div class="modal-header">
          <h3>Pilih Surat Masuk</h3>
          <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="search-input" style="margin-bottom:16px">
            <span class="search-input__icon material-icons">search</span>
            <input type="text" class="form-input" placeholder="Cari surat..." id="surat-search">
          </div>
          <div class="surat-list" id="surat-list" style="max-height:400px;overflow-y:auto">
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load surat list
    this.loadSuratList();
    
    // Bind search
    modal.querySelector('#surat-search').addEventListener('input', (e) => {
      this.loadSuratList(e.target.value);
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }
  
  async loadSuratList(search = '') {
    try {
      const response = await api.getSuratMasukList({ search, status: 'diterima,diproses', limit: 50 });
      const list = document.getElementById('surat-list');
      
      if (response.status === 'success' && list) {
        const items = response.data.items || [];
        
        if (items.length === 0) {
          list.innerHTML = '<p class="text-muted text-center">Tidak ada surat ditemukan</p>';
          return;
        }
        
        list.innerHTML = items.map(item => `
          <div class="surat-select-item" onclick="window._selectSurat('${item.id}')">
            <div class="surat-select-item__number">${item.nomorAgenda || item.nomorSurat}</div>
            <div class="surat-select-item__subject">${item.perihal || '-'}</div>
            <div class="surat-select-item__sender">${item.pengirim || '-'}</div>
            <span class="badge badge-${this.getStatusClass(item.status)}">${item.status}</span>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Failed to load surat list:', error);
    }
  }
  
  async selectSurat(id) {
    // Close modal
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
    
    // Load surat detail
    await this.loadSuratMasuk(id);
  }
  
  showRecipientSelector() {
    const recipients = window._recipientOptions || [];
    
    if (recipients.length === 0) {
      NotificationService.warning('Tidak ada pengguna tersedia');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Pilih Penerima</h3>
          <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="search-input" style="margin-bottom:16px">
            <span class="search-input__icon material-icons">search</span>
            <input type="text" class="form-input" placeholder="Cari pengguna..." id="recipient-search">
          </div>
          <div id="recipient-options" style="max-height:400px;overflow-y:auto">
            ${recipients.map(user => `
              <div class="recipient-option" onclick="window._addRecipient('${user.id}')">
                <div class="recipient-option__avatar">
                  ${(user.namaLengkap || user.username).charAt(0).toUpperCase()}
                </div>
                <div class="recipient-option__info">
                  <div class="recipient-option__name">${user.namaLengkap || user.username}</div>
                  <div class="recipient-option__detail">
                    ${user.jabatan || ''} ${user.unitKerja ? '· ' + user.unitKerja : ''}
                  </div>
                </div>
                ${this.selectedRecipients.find(r => r.id === user.id) ? 
                  '<span class="material-icons" style="color:var(--md-sys-color-primary)">check_circle</span>' : 
                  '<span class="material-icons" style="color:var(--md-sys-color-outline)">radio_button_unchecked</span>'}
              </div>
            `).join('')}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Selesai</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Search filter
    modal.querySelector('#recipient-search').addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      const options = modal.querySelectorAll('.recipient-option');
      options.forEach(opt => {
        const name = opt.querySelector('.recipient-option__name').textContent.toLowerCase();
        opt.style.display = name.includes(search) ? 'flex' : 'none';
      });
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }
  
  getStatusClass(status) {
    const classes = {
      'diterima': 'info',
      'diproses': 'warning',
      'selesai': 'success'
    };
    return classes[status] || 'default';
  }
  
  bindEvents() {
    // Select surat
    document.getElementById('btn-select-surat')?.addEventListener('click', () => {
      this.showSuratSelector();
    });
    
    // Click surat reference
    document.getElementById('surat-reference')?.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        this.showSuratSelector();
      }
    });
    
    // Add recipient
    document.getElementById('btn-add-recipient')?.addEventListener('click', () => {
      this.showRecipientSelector();
    });
    
    // Submit
    document.getElementById('btn-submit')?.addEventListener('click', () => {
      this.submitDisposisi(false);
    });
    
    // Save draft
    document.getElementById('btn-save-draft')?.addEventListener('click', () => {
      this.submitDisposisi(true);
    });
  }
}

// Global handlers
window._selectSurat = (id) => {
  const page = document.querySelector('.disposisi-create');
  if (page?._instance) {
    page._instance.selectSurat(id);
  }
};

window._addRecipient = (userId) => {
  const page = document.querySelector('.disposisi-create');
  const user = (window._recipientOptions || []).find(u => u.id === userId);
  if (page?._instance && user) {
    page._instance.addRecipient(user);
  }
};

window._removeRecipient = (userId) => {
  const page = document.querySelector('.disposisi-create');
  if (page?._instance) {
    page._instance.removeRecipient(userId);
  }
};

// Export for router
const DisposisiCreateComponent = (props) => {
  const page = new DisposisiCreatePage();
  const container = document.createElement('div');
  container.className = 'content-area disposisi-create';
  container._instance = page;
  
  page.render(container);
  
  return container;
};
