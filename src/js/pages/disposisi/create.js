/**
 * ============================================
 * DISPOSISI CREATE PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL DISPOSISI CREATION - SIAP PRODUKSI
 * Mendukung: Single/Multiple Recipients, Draft,
 * Auto-save, File Attachments, Templates
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class DisposisiCreatePage {
  constructor() {
    this.container = null;
    this.selectedSurat = null;
    this.selectedRecipients = [];
    this.formData = {};
    this.isSubmitting = false;
    this.autoSaveTimer = null;
    this.autoSaveKey = null;
    this.availableRecipients = [];
    this.pageId = 'dispcreate-' + Math.random().toString(36).substr(2, 9);
    this.draftLoaded = false;
  }

  async render(container) {
    this.container = container;
    this.container.setAttribute('data-page-id', this.pageId);

    // Get suratMasukId dari query params atau route
    const suratMasukId = this.getSuratMasukId();

    this.container.innerHTML = this.getTemplate();

    // Load recipients
    await this.loadRecipients();

    // Load surat if ID provided
    if (suratMasukId) {
      await this.loadSuratMasuk(suratMasukId);
    }

    // Load draft if exists
    this.loadDraft();

    this.bindEvents();

    // Start auto-save
    this.startAutoSave();

    console.log('✅ DisposisiCreatePage rendered');
  }

  getSuratMasukId() {
    try {
      if (typeof store !== 'undefined') {
        const route = store.getState('ui.currentRoute');
        if (route?.query?.suratMasukId) return route.query.suratMasukId;
        if (route?.query?.ids) return route.query.ids.split(',')[0];
      }
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
      return params.get('suratMasukId') || params.get('ids')?.split(',')[0];
    } catch { return null; }
  }

  getTemplate() {
    return `
      <div class="disposisi-create" id="dispcreate-${this.pageId}">
        <!-- Header -->
        <div class="content-area__header">
          <div class="header-left">
            <h1 class="content-area__title">Buat Disposisi</h1>
            <p class="content-area__description">Buat disposisi untuk surat masuk yang perlu ditindaklanjuti</p>
          </div>
          <div class="header-right">
            <button class="btn btn-ghost btn-sm" id="btn-load-draft" style="display:none" title="Load Draft">
              <span class="material-icons">restore_page</span> Ada Draft Tersimpan
            </button>
          </div>
        </div>

        <div class="disposisi-layout">
          <!-- Main Form -->
          <div class="disposisi-main">
            <!-- Surat Reference -->
            <div class="card" id="surat-reference-card">
              <div class="card__header">
                <h3><span class="material-icons">description</span> Surat Masuk</h3>
                <button class="btn btn-sm btn-secondary" id="btn-select-surat">
                  <span class="material-icons">search</span>
                  ${this.selectedSurat ? 'Ganti' : 'Pilih Surat'}
                </button>
              </div>
              <div class="card__body">
                <div class="surat-reference" id="surat-reference">
                  ${this.selectedSurat ? this.renderSuratReference() : `
                    <div class="surat-reference__empty">
                      <span class="material-icons" style="font-size:48px;color:var(--md-sys-color-outline)">inbox</span>
                      <p>Pilih surat masuk yang akan didisposisikan</p>
                      <button class="btn btn-primary btn-sm" id="btn-select-surat-empty">
                        <span class="material-icons">search</span> Pilih Surat
                      </button>
                    </div>
                  `}
                </div>
              </div>
            </div>

            <!-- Recipients -->
            <div class="card" id="recipients-card">
              <div class="card__header">
                <h3><span class="material-icons">people</span> Tujuan Disposisi</h3>
                <span class="badge badge-sm" id="recipient-count">0 penerima</span>
              </div>
              <div class="card__body">
                <div class="recipient-list" id="recipient-list">
                  <p class="text-muted">Belum ada penerima dipilih</p>
                </div>
                <button class="btn btn-secondary btn-sm" id="btn-add-recipient" style="margin-top:12px">
                  <span class="material-icons">person_add</span>
                  Tambah Penerima
                </button>
              </div>
            </div>

            <!-- Instruction -->
            <div class="card">
              <div class="card__header">
                <h3><span class="material-icons">edit_note</span> Instruksi Disposisi</h3>
              </div>
              <div class="card__body">
                <div class="form-field">
                  <label class="form-label form-label--required">Instruksi</label>
                  <textarea class="form-input form-textarea" id="instruksi" 
                            placeholder="Tulis instruksi disposisi dengan jelas dan lengkap..." 
                            rows="4"></textarea>
                  <div class="form-helper">
                    <span id="char-count">0</span> karakter (minimal 10)
                  </div>
                </div>

                <div class="form-row form-row--3col">
                  <div class="form-field">
                    <label class="form-label">Sifat Disposisi</label>
                    <select class="form-select" id="sifat">
                      <option value="biasa">📋 Biasa</option>
                      <option value="penting">⚠️ Penting</option>
                      <option value="segera">🔴 Segera</option>
                      <option value="rahasia">🔒 Rahasia</option>
                    </select>
                  </div>

                  <div class="form-field">
                    <label class="form-label">Batas Waktu</label>
                    <input type="date" class="form-input" id="batas-waktu">
                  </div>

                  <div class="form-field">
                    <label class="form-label">Prioritas</label>
                    <select class="form-select" id="prioritas">
                      <option value="normal">Normal</option>
                      <option value="tinggi">Tinggi</option>
                      <option value="rendah">Rendah</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Additional Options -->
            <div class="card">
              <div class="card__header">
                <h3><span class="material-icons">tune</span> Opsi Tambahan</h3>
              </div>
              <div class="card__body">
                <label class="form-checkbox">
                  <input type="checkbox" class="form-checkbox__input" id="notify-email" checked>
                  <span class="form-checkbox__label">Kirim notifikasi email ke penerima</span>
                </label>
                <label class="form-checkbox">
                  <input type="checkbox" class="form-checkbox__input" id="notify-telegram">
                  <span class="form-checkbox__label">Kirim notifikasi Telegram</span>
                </label>
                <label class="form-checkbox">
                  <input type="checkbox" class="form-checkbox__input" id="require-tindak-lanjut">
                  <span class="form-checkbox__label">Wajib lapor tindak lanjut</span>
                </label>
                <label class="form-checkbox">
                  <input type="checkbox" class="form-checkbox__input" id="set-reminder">
                  <span class="form-checkbox__label">Atur pengingat otomatis</span>
                </label>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="form-actions form-actions--sticky">
              <button class="btn btn-ghost" id="btn-cancel">
                <span class="material-icons">arrow_back</span> Batal
              </button>
              <div style="flex:1"></div>
              <button class="btn btn-secondary" id="btn-save-draft">
                <span class="material-icons">save</span> Simpan Draft
              </button>
              <button class="btn btn-primary" id="btn-submit">
                <span class="material-icons">send</span> Kirim Disposisi
              </button>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="disposisi-sidebar">
            <!-- Quick Info -->
            <div class="card">
              <div class="card__header">
                <h3><span class="material-icons">info</span> Informasi</h3>
              </div>
              <div class="card__body" id="sidebar-info">
                <p class="text-muted">Pilih surat dan penerima untuk melihat ringkasan</p>
              </div>
            </div>

            <!-- Recent Templates -->
            <div class="card">
              <div class="card__header">
                <h3><span class="material-icons">bookmark</span> Template Instruksi</h3>
              </div>
              <div class="card__body" id="template-list">
                <div class="chip-group">
                  <span class="chip template-chip" data-text="Mohon ditindaklanjuti sesuai ketentuan yang berlaku.">Tindak Lanjut</span>
                  <span class="chip template-chip" data-text="Harap diproses segera dan laporkan hasilnya.">Proses Segera</span>
                  <span class="chip template-chip" data-text="Pelajari dan berikan tanggapan tertulis.">Pelajari & Tanggapi</span>
                  <span class="chip template-chip" data-text="Koordinasikan dengan pihak terkait untuk penyelesaian.">Koordinasi</span>
                  <span class="chip template-chip" data-text="Arsipkan setelah selesai ditindaklanjuti.">Arsipkan</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Select Surat Modal -->
        <div class="modal-overlay hidden" id="surat-selector-modal">
          <div class="modal-content modal-content--lg">
            <div class="modal-header">
              <h3>Pilih Surat Masuk</h3>
              <button class="btn-icon" id="btn-close-surat-modal">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="search-input" style="margin-bottom:16px">
                <span class="search-input__icon material-icons">search</span>
                <input type="text" class="form-input" placeholder="Cari surat berdasarkan nomor, perihal, pengirim..." id="surat-search">
              </div>
              <div id="surat-list" style="max-height:450px;overflow-y:auto">
                <div class="skeleton-text"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Select Recipient Modal -->
        <div class="modal-overlay hidden" id="recipient-selector-modal">
          <div class="modal-content modal-content--md">
            <div class="modal-header">
              <h3>Pilih Penerima Disposisi</h3>
              <button class="btn-icon" id="btn-close-recipient-modal">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="search-input" style="margin-bottom:16px">
                <span class="search-input__icon material-icons">search</span>
                <input type="text" class="form-input" placeholder="Cari pengguna..." id="recipient-search">
              </div>
              <div id="recipient-options" style="max-height:400px;overflow-y:auto"></div>
            </div>
            <div class="modal-footer">
              <span class="text-muted" id="recipient-selected-count">0 dipilih</span>
              <button class="btn btn-primary btn-sm" id="btn-confirm-recipients">Selesai</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderSuratReference() {
    const s = this.selectedSurat;
    if (!s) return '';
    return `
      <div class="surat-reference__detail">
        <div class="surat-reference__header">
          <span class="material-icons surat-reference__icon-ref">description</span>
          <div class="surat-reference__info">
            <div class="surat-reference__number text-mono">${s.nomorAgenda || s.nomorSurat || '-'}</div>
            <div class="surat-reference__subject">${s.perihal || 'Tanpa Perihal'}</div>
          </div>
        </div>
        <div class="surat-reference__meta">
          <span><strong>Pengirim:</strong> ${s.pengirim || '-'}</span>
          <span><strong>Tanggal:</strong> ${this.formatDate(s.tanggalSurat)}</span>
          <span><strong>Sifat:</strong> <span class="badge badge-sm">${s.sifat || 'biasa'}</span></span>
          <span><strong>Status:</strong> <span class="badge badge-sm badge-info">${s.status || 'diterima'}</span></span>
        </div>
        ${s.catatan ? `<div class="surat-reference__catatan text-muted text-sm">${s.catatan}</div>` : ''}
      </div>
    `;
  }

  async loadSuratMasuk(id) {
    try {
      let response;
      if (typeof api !== 'undefined') {
        response = await api.get('suratMasuk.detail', { id });
      } else if (typeof API !== 'undefined') {
        response = await API.get('suratMasuk.detail', { id });
      } else {
        const url = this.getApiUrl() + '?action=suratMasuk.detail&id=' + id;
        const res = await fetch(url);
        response = await res.json();
      }

      if (response?.status === 'success' && response.data) {
        this.selectedSurat = response.data;
        this.refreshSuratReference();
        this.updateSidebarInfo();
      }
    } catch (error) {
      this.showToast('Gagal memuat data surat', 'error');
    }
  }

  async loadRecipients() {
    try {
      let response;
      if (typeof api !== 'undefined') {
        response = await api.get('users.list', { limit: 200, isActive: true });
      } else if (typeof API !== 'undefined') {
        response = await API.get('users.list', { limit: 200, isActive: true });
      } else {
        const url = this.getApiUrl() + '?action=users.list&limit=200&isActive=true';
        const res = await fetch(url);
        response = await res.json();
      }

      if (response?.status === 'success') {
        this.availableRecipients = response.data?.items || [];
      }
    } catch (error) {
      console.warn('Failed to load recipients:', error);
    }
  }

  refreshSuratReference() {
    const container = document.getElementById('surat-reference');
    if (container) {
      if (this.selectedSurat) {
        container.innerHTML = this.renderSuratReference();
      } else {
        container.innerHTML = `
          <div class="surat-reference__empty">
            <span class="material-icons" style="font-size:48px;color:var(--md-sys-color-outline)">inbox</span>
            <p>Pilih surat masuk yang akan didisposisikan</p>
          </div>
        `;
      }
    }
  }

  addRecipient(user) {
    if (this.selectedRecipients.find(r => r.id === user.id)) {
      this.showToast('Penerima sudah ditambahkan', 'warning');
      return;
    }

    this.selectedRecipients.push(user);
    this.renderRecipients();
    this.updateSidebarInfo();
  }

  removeRecipient(userId) {
    this.selectedRecipients = this.selectedRecipients.filter(r => r.id !== userId);
    this.renderRecipients();
    this.updateSidebarInfo();
  }

  renderRecipients() {
    const list = document.getElementById('recipient-list');
    const countEl = document.getElementById('recipient-count');
    if (!list) return;

    if (countEl) countEl.textContent = `${this.selectedRecipients.length} penerima`;

    if (this.selectedRecipients.length === 0) {
      list.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px">Belum ada penerima dipilih</p>';
      return;
    }

    list.innerHTML = this.selectedRecipients.map((user, index) => `
      <div class="recipient-item animate-fade-in-up" style="animation-delay:${index * 50}ms">
        <div class="recipient-item__avatar" style="background:${this.getUserColor(user)}">
          ${this.getInitials(user.namaLengkap || user.username)}
        </div>
        <div class="recipient-item__info">
          <div class="recipient-item__name">${this.escapeHtml(user.namaLengkap || user.username)}</div>
          <div class="recipient-item__detail">
            ${user.jabatan ? this.escapeHtml(user.jabatan) : ''}
            ${user.unitKerja ? ' · ' + this.escapeHtml(user.unitKerja) : ''}
            <span class="badge badge-sm badge-outline" style="margin-left:8px">${user.role || 'staff'}</span>
          </div>
        </div>
        <div class="recipient-item__order">
          <span class="recipient-item__order-number">#${index + 1}</span>
        </div>
        <button class="btn-icon btn-icon-sm recipient-item__remove" data-user-id="${user.id}" title="Hapus">
          <span class="material-icons">close</span>
        </button>
      </div>
    `).join('');
  }

  updateSidebarInfo() {
    const info = document.getElementById('sidebar-info');
    if (!info) return;

    if (!this.selectedSurat && this.selectedRecipients.length === 0) {
      info.innerHTML = '<p class="text-muted">Pilih surat dan penerima untuk melihat ringkasan</p>';
      return;
    }

    info.innerHTML = `
      <div class="info-list">
        ${this.selectedSurat ? `
          <div class="info-item">
            <span class="info-item__label">Surat</span>
            <span>${this.selectedSurat.nomorAgenda || this.selectedSurat.nomorSurat || '-'}</span>
          </div>
        ` : ''}
        <div class="info-item">
          <span class="info-item__label">Penerima</span>
          <span>${this.selectedRecipients.length} orang</span>
        </div>
        ${this.selectedRecipients.length > 0 ? `
          <div class="info-item">
            <span class="info-item__label">Daftar</span>
            <span class="text-sm">${this.selectedRecipients.map(r => r.namaLengkap || r.username).join(', ')}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  openSuratSelector() {
    const modal = document.getElementById('surat-selector-modal');
    if (modal) {
      modal.classList.remove('hidden');
      this.loadSuratList();
      document.getElementById('surat-search')?.focus();
    }
  }

  async loadSuratList(search = '') {
    const list = document.getElementById('surat-list');
    if (!list) return;

    list.innerHTML = '<div class="skeleton-text"></div><div class="skeleton-text"></div><div class="skeleton-text"></div>';

    try {
      let response;
      if (typeof api !== 'undefined') {
        response = await api.get('suratMasuk.list', { search, status: 'diterima,diproses', limit: 50 });
      } else if (typeof API !== 'undefined') {
        response = await API.get('suratMasuk.list', { search, status: 'diterima,diproses', limit: 50 });
      } else {
        const url = this.getApiUrl() + `?action=suratMasuk.list&search=${search}&status=diterima,diproses&limit=50`;
        const res = await fetch(url);
        response = await res.json();
      }

      if (response?.status === 'success') {
        const items = response.data?.items || [];
        if (items.length === 0) {
          list.innerHTML = '<p class="text-muted text-center" style="padding:40px">Tidak ada surat ditemukan</p>';
          return;
        }

        list.innerHTML = items.map(item => `
          <div class="surat-select-item ${this.selectedSurat?.id === item.id ? 'surat-select-item--selected' : ''}" 
               data-id="${item.id}">
            <div class="surat-select-item__checkbox">
              <span class="material-icons">${this.selectedSurat?.id === item.id ? 'check_circle' : 'radio_button_unchecked'}</span>
            </div>
            <div class="surat-select-item__content">
              <div class="surat-select-item__number text-mono">${item.nomorAgenda || item.nomorSurat || '-'}</div>
              <div class="surat-select-item__subject">${this.escapeHtml(item.perihal || '-')}</div>
              <div class="surat-select-item__meta">
                <span>${this.escapeHtml(item.pengirim || '-')}</span>
                <span>${this.formatDate(item.tanggalSurat)}</span>
                <span class="badge badge-sm badge-${item.status === 'diterima' ? 'info' : 'warning'}">${item.status}</span>
                ${item.sifat ? `<span class="badge badge-sm badge-outline">${item.sifat}</span>` : ''}
              </div>
            </div>
          </div>
        `).join('');

        // Bind click
        list.querySelectorAll('.surat-select-item').forEach(item => {
          item.addEventListener('click', () => {
            this.selectSurat(item.dataset.id);
            document.getElementById('surat-selector-modal')?.classList.add('hidden');
          });
        });
      }
    } catch (error) {
      list.innerHTML = '<p class="text-muted text-center">Gagal memuat daftar surat</p>';
    }
  }

  async selectSurat(id) {
    await this.loadSuratMasuk(id);
    this.autoSave();
  }

  openRecipientSelector() {
    const modal = document.getElementById('recipient-selector-modal');
    const options = document.getElementById('recipient-options');
    if (!modal || !options) return;

    modal.classList.remove('hidden');

    if (this.availableRecipients.length === 0) {
      options.innerHTML = '<p class="text-muted text-center" style="padding:40px">Tidak ada pengguna tersedia</p>';
      return;
    }

    this.renderRecipientOptions(options);
    document.getElementById('recipient-search')?.focus();
  }

  renderRecipientOptions(container, filter = '') {
    const search = filter.toLowerCase();
    const filtered = this.availableRecipients.filter(u => {
      const name = (u.namaLengkap || u.username || '').toLowerCase();
      const jabatan = (u.jabatan || '').toLowerCase();
      const unit = (u.unitKerja || '').toLowerCase();
      return name.includes(search) || jabatan.includes(search) || unit.includes(search);
    });

    if (filtered.length === 0) {
      container.innerHTML = '<p class="text-muted text-center" style="padding:40px">Tidak ada pengguna ditemukan</p>';
      return;
    }

    container.innerHTML = filtered.map(user => {
      const isSelected = this.selectedRecipients.some(r => r.id === user.id);
      return `
        <div class="recipient-option ${isSelected ? 'recipient-option--selected' : ''}" data-user-id="${user.id}">
          <div class="recipient-option__checkbox">
            <span class="material-icons">${isSelected ? 'check_box' : 'check_box_outline_blank'}</span>
          </div>
          <div class="recipient-option__avatar" style="background:${this.getUserColor(user)}">
            ${this.getInitials(user.namaLengkap || user.username)}
          </div>
          <div class="recipient-option__info">
            <div class="recipient-option__name">${this.escapeHtml(user.namaLengkap || user.username)}</div>
            <div class="recipient-option__detail">
              ${user.jabatan ? this.escapeHtml(user.jabatan) : ''}
              ${user.unitKerja ? ' · ' + this.escapeHtml(user.unitKerja) : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind toggle
    container.querySelectorAll('.recipient-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const userId = opt.dataset.userId;
        const user = this.availableRecipients.find(u => u.id === userId);
        if (!user) return;

        if (this.selectedRecipients.find(r => r.id === userId)) {
          this.removeRecipient(userId);
        } else {
          this.addRecipient(user);
        }
        this.renderRecipientOptions(container, document.getElementById('recipient-search')?.value || '');
        document.getElementById('recipient-selected-count').textContent = `${this.selectedRecipients.length} dipilih`;
      });
    });
  }

  async submitDisposisi(isDraft = false) {
    if (this.isSubmitting) return;

    // Validate
    if (!this.selectedSurat) {
      this.showToast('Pilih surat masuk terlebih dahulu', 'warning');
      return;
    }

    if (this.selectedRecipients.length === 0) {
      this.showToast('Pilih minimal satu penerima', 'warning');
      return;
    }

    const instruksi = document.getElementById('instruksi')?.value?.trim() || '';
    if (!isDraft && instruksi.length < 10) {
      this.showToast('Instruksi minimal 10 karakter', 'warning');
      document.getElementById('instruksi')?.focus();
      return;
    }

    this.isSubmitting = true;
    const btnSubmit = document.getElementById('btn-submit');
    const btnDraft = document.getElementById('btn-save-draft');
    this.setButtonLoading(btnSubmit, true);
    if (btnDraft) btnDraft.disabled = true;

    const data = {
      suratMasukId: this.selectedSurat.id,
      instruksi: instruksi,
      sifat: document.getElementById('sifat')?.value || 'biasa',
      batasWaktu: document.getElementById('batas-waktu')?.value || null,
      prioritas: document.getElementById('prioritas')?.value || 'normal',
      status: isDraft ? 'draft' : 'pending',
      notifyEmail: document.getElementById('notify-email')?.checked || false,
      notifyTelegram: document.getElementById('notify-telegram')?.checked || false,
      requireTindakLanjut: document.getElementById('require-tindak-lanjut')?.checked || false,
      setReminder: document.getElementById('set-reminder')?.checked || false
    };

    try {
      let response;

      if (this.selectedRecipients.length > 1 && !isDraft) {
        // Create multiple disposisi
        const multiData = {
          suratMasukId: data.suratMasukId,
          recipients: this.selectedRecipients.map(r => ({
            kepadaUserId: r.id,
            instruksi: data.instruksi
          })),
          sifat: data.sifat,
          batasWaktu: data.batasWaktu,
          prioritas: data.prioritas,
          notifyEmail: data.notifyEmail,
          notifyTelegram: data.notifyTelegram
        };

        if (typeof api !== 'undefined') {
          response = await api.post('disposisi.createMultiple', multiData);
        } else if (typeof API !== 'undefined') {
          response = await API.post('disposisi.createMultiple', multiData);
        } else {
          const url = this.getApiUrl() + '?action=disposisi.createMultiple';
          const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(multiData) });
          response = await res.json();
        }
      } else {
        // Single disposisi
        const singleData = {
          ...data,
          kepadaUserId: this.selectedRecipients[0]?.id
        };

        if (typeof api !== 'undefined') {
          response = await api.post('disposisi.create', singleData);
        } else if (typeof API !== 'undefined') {
          response = await API.post('disposisi.create', singleData);
        } else {
          const url = this.getApiUrl() + '?action=disposisi.create';
          const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(singleData) });
          response = await res.json();
        }
      }

      if (response?.status === 'success') {
        this.clearDraft();
        this.showToast(
          isDraft ? '📝 Disposisi disimpan sebagai draft' : '✅ Disposisi berhasil dikirim ke ' + this.selectedRecipients.length + ' penerima',
          'success'
        );

        if (!isDraft) {
          setTimeout(() => {
            if (typeof router !== 'undefined') {
              router.navigate('/disposisi');
            } else {
              window.location.hash = '#/disposisi';
            }
          }, 800);
        }
      } else {
        throw new Error(response?.message || 'Gagal membuat disposisi');
      }
    } catch (error) {
      this.showToast('Gagal membuat disposisi: ' + error.message, 'error');
    } finally {
      this.isSubmitting = false;
      this.setButtonLoading(btnSubmit, false);
      if (btnDraft) btnDraft.disabled = false;
    }
  }

  startAutoSave() {
    this.autoSaveKey = `asd_draft_disposisi_${this.pageId}`;
    this.autoSaveTimer = setInterval(() => this.autoSave(), 15000);
  }

  autoSave() {
    if (!this.selectedSurat && this.selectedRecipients.length === 0) return;

    const data = {
      suratMasukId: this.selectedSurat?.id || null,
      recipientIds: this.selectedRecipients.map(r => r.id),
      instruksi: document.getElementById('instruksi')?.value || '',
      sifat: document.getElementById('sifat')?.value || 'biasa',
      batasWaktu: document.getElementById('batas-waktu')?.value || '',
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(this.autoSaveKey, JSON.stringify(data));
      // Update draft indicator
      const btn = document.getElementById('btn-load-draft');
      if (btn) btn.style.display = 'flex';
    } catch (e) {}
  }

  loadDraft() {
    try {
      const saved = localStorage.getItem(this.autoSaveKey);
      if (!saved) return;

      const data = JSON.parse(saved);
      if (!data.timestamp) return;

      // Check if draft is less than 24 hours old
      if (Date.now() - data.timestamp > 86400000) {
        localStorage.removeItem(this.autoSaveKey);
        return;
      }

      this.draftLoaded = true;
      const btn = document.getElementById('btn-load-draft');
      if (btn) {
        btn.style.display = 'flex';
        btn.addEventListener('click', () => this.restoreDraft(data));
      }
    } catch (e) {}
  }

  async restoreDraft(data) {
    if (data.suratMasukId) {
      await this.loadSuratMasuk(data.suratMasukId);
    }

    if (data.recipientIds?.length > 0) {
      data.recipientIds.forEach(id => {
        const user = this.availableRecipients.find(u => u.id === id);
        if (user) this.addRecipient(user);
      });
    }

    if (data.instruksi) {
      document.getElementById('instruksi').value = data.instruksi;
      document.getElementById('char-count').textContent = data.instruksi.length;
    }

    if (data.sifat) document.getElementById('sifat').value = data.sifat;
    if (data.batasWaktu) document.getElementById('batas-waktu').value = data.batasWaktu;

    document.getElementById('btn-load-draft').style.display = 'none';
    this.showToast('Draft berhasil dimuat', 'info');
  }

  clearDraft() {
    try { localStorage.removeItem(this.autoSaveKey); } catch (e) {}
  }

  // Helpers
  formatDate(d) { try { return new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }); } catch { return d || '-'; } }
  getInitials(n) { if (!n) return '?'; const p = n.trim().split(/\s+/); return p.length === 1 ? p[0].charAt(0).toUpperCase() : (p[0].charAt(0) + p[p.length-1].charAt(0)).toUpperCase(); }
  getUserColor(u) { let h = 0; const s = (u.namaLengkap || u.username || ''); for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h); const colors = ['#1976D2','#388E3C','#E64A19','#7B1FA2','#00796B','#C2185B','#512DA8','#F57C00']; return colors[Math.abs(h) % colors.length]; }
  escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
  getApiUrl() { return (typeof APP_CONFIG !== 'undefined') ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : ''; }
  showToast(m, t) { if (typeof Toast !== 'undefined') Toast.show(m, t); else if (typeof NotificationService !== 'undefined') NotificationService.show(m, t); }
  setButtonLoading(b, l) { if (!b) return; if (l) { b.classList.add('btn-loading'); b.disabled = true; } else { b.classList.remove('btn-loading'); b.disabled = false; } }

  bindEvents() {
    // Surat selector
    document.getElementById('btn-select-surat')?.addEventListener('click', () => this.openSuratSelector());
    document.getElementById('btn-select-surat-empty')?.addEventListener('click', () => this.openSuratSelector());
    document.getElementById('btn-close-surat-modal')?.addEventListener('click', () => document.getElementById('surat-selector-modal').classList.add('hidden'));
    document.getElementById('surat-search')?.addEventListener('input', (e) => this.loadSuratList(e.target.value));

    // Recipient selector
    document.getElementById('btn-add-recipient')?.addEventListener('click', () => this.openRecipientSelector());
    document.getElementById('btn-close-recipient-modal')?.addEventListener('click', () => document.getElementById('recipient-selector-modal').classList.add('hidden'));
    document.getElementById('btn-confirm-recipients')?.addEventListener('click', () => document.getElementById('recipient-selector-modal').classList.add('hidden'));
    document.getElementById('recipient-search')?.addEventListener('input', (e) => {
      const options = document.getElementById('recipient-options');
      this.renderRecipientOptions(options, e.target.value);
    });

    // Remove recipient (delegation)
    document.getElementById('recipient-list')?.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.recipient-item__remove');
      if (removeBtn) {
        this.removeRecipient(removeBtn.dataset.userId);
      }
    });

    // Character counter
    document.getElementById('instruksi')?.addEventListener('input', (e) => {
      document.getElementById('char-count').textContent = e.target.value.length;
      this.autoSave();
    });

    // Template chips
    document.querySelectorAll('.template-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.dataset.text;
        const textarea = document.getElementById('instruksi');
        if (textarea) {
          textarea.value = textarea.value ? textarea.value + '\n' + text : text;
          document.getElementById('char-count').textContent = textarea.value.length;
          textarea.focus();
        }
      });
    });

    // Submit buttons
    document.getElementById('btn-submit')?.addEventListener('click', () => this.submitDisposisi(false));
    document.getElementById('btn-save-draft')?.addEventListener('click', () => this.submitDisposisi(true));

    // Cancel
    document.getElementById('btn-cancel')?.addEventListener('click', () => {
      if (this.selectedSurat || this.selectedRecipients.length > 0) {
        const confirmed = window.confirm('Apakah Anda yakin ingin membatalkan? Data akan disimpan sebagai draft.');
        if (confirmed) {
          this.autoSave();
          history.back();
        }
      } else {
        history.back();
      }
    });

    // Modal backdrop close
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.addEventListener('click', (e) => { if (e.target === m) m.classList.add('hidden'); });
    });

    // Auto-save on form changes
    ['sifat', 'batas-waktu', 'prioritas'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => this.autoSave());
    });

    // Before unload
    window.addEventListener('beforeunload', () => {
      this.autoSave();
    });
  }

  destroy() {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    this.autoSave();
  }
}

const DisposisiCreateComponent = (props) => {
  const page = new DisposisiCreatePage();
  const container = document.createElement('div');
  container.className = 'content-area disposisi-create';
  container._instance = page;
  page.render(container);
  return container;
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DisposisiCreatePage, DisposisiCreateComponent };
}
