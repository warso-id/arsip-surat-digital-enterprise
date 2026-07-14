/**
 * ============================================
 * APPROVAL PROCESS PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL APPROVAL WORKFLOW - SIAP PRODUKSI
 * Mendukung: Multi-Level, Parallel, Delegation,
 * TTD Integration, History, Notifications
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class ApprovalProcessPage {
  constructor() {
    this.container = null;
    this.approvalData = null;
    this.approvalId = null;
    this.currentUser = null;
    this.isLoading = false;
    this.pollingInterval = null;
    this.signaturePad = null;
    this.selectedAction = null;
    this.showTTD = false;
    this.delegateUsers = [];
  }

  /**
   * Render halaman approval process
   */
  async render(container) {
    this.container = container;
    
    // Get approval ID dari route
    this.approvalId = this.getApprovalId();
    
    // Get current user
    this.currentUser = this.getCurrentUser();
    
    if (!this.approvalId) {
      this.showError('ID Approval tidak ditemukan', 'Silakan pilih surat yang perlu disetujui dari daftar approval.');
      return;
    }

    // Render template
    this.container.innerHTML = this.getTemplate();
    
    // Load data
    await this.loadApproval();
    
    // Bind events
    this.bindEvents();
    
    // Start polling untuk real-time updates
    this.startPolling();
    
    console.log('✅ ApprovalProcessPage rendered');
  }

  /**
   * Get approval ID dari route atau query
   */
  getApprovalId() {
    // Try store first
    if (typeof store !== 'undefined') {
      const route = store.getState('ui.currentRoute');
      if (route?.params?.id) return route.params.id;
      if (route?.query?.id) return route.query.id;
    }
    // Fallback: parse dari URL hash
    const hash = window.location.hash;
    const match = hash.match(/\/approval\/([^\/?]+)/);
    if (match) return match[1];
    
    const params = new URLSearchParams(hash.split('?')[1] || '');
    return params.get('id');
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    if (typeof AuthService !== 'undefined' && AuthService.getUser) {
      return AuthService.getUser();
    }
    if (typeof Storage !== 'undefined') {
      return Storage.getJSON('asd_user') || Storage.getJSON('asd_auth_user');
    }
    try {
      const data = localStorage.getItem('asd_user') || localStorage.getItem('asd_auth_user');
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  }

  /**
   * Get page template
   */
  getTemplate() {
    const user = this.currentUser;
    return `
      <div class="approval-process" id="approval-process-container">
        <!-- Header -->
        <div class="content-area__header">
          <div class="header-left">
            <div class="approval-breadcrumb">
              <a href="#/approval" onclick="event.preventDefault();router.navigate('/approval')" class="approval-breadcrumb__link">
                <span class="material-icons">arrow_back</span> Daftar Approval
              </a>
            </div>
            <h1 class="content-area__title">Proses Approval</h1>
            <p class="content-area__description" id="approval-title-desc">Memuat data approval...</p>
          </div>
          <div class="header-right" id="approval-header-actions"></div>
        </div>

        <!-- Loading -->
        <div id="approval-loading" class="page-loading">
          <div class="progress--circular"></div>
          <p>Memuat data approval...</p>
        </div>

        <!-- Main Content -->
        <div id="approval-content" style="display:none">
          <div class="approval-layout">
            <!-- Left: Detail & Actions -->
            <div class="approval-main">
              <!-- Document Detail Card -->
              <div class="card" id="approval-detail-card">
                <div class="card__header">
                  <h3><span class="material-icons">description</span> Detail Dokumen</h3>
                  <span id="approval-status-badge-top"></span>
                </div>
                <div class="card__body" id="approval-detail"></div>
              </div>

              <!-- Attachments -->
              <div class="card hidden" id="approval-attachments-card">
                <div class="card__header">
                  <h3><span class="material-icons">attachment</span> Lampiran</h3>
                </div>
                <div class="card__body" id="approval-attachments"></div>
              </div>

              <!-- Approval History -->
              <div class="card" id="approval-history-card">
                <div class="card__header">
                  <h3><span class="material-icons">history</span> Riwayat Approval</h3>
                </div>
                <div class="card__body" id="approval-history"></div>
              </div>

              <!-- Approval Action Form -->
              <div class="card hidden" id="approval-form-card">
                <div class="card__header">
                  <h3><span class="material-icons">edit_note</span> Tindakan Approval</h3>
                </div>
                <div class="card__body" id="approval-form"></div>
              </div>
            </div>

            <!-- Right: Progress Sidebar -->
            <div class="approval-sidebar">
              <!-- Progress Tracker -->
              <div class="card">
                <div class="card__header">
                  <h3><span class="material-icons">account_tree</span> Alur Approval</h3>
                </div>
                <div class="card__body" id="approval-progress"></div>
              </div>

              <!-- Document Info -->
              <div class="card" id="approval-info-card">
                <div class="card__header">
                  <h3><span class="material-icons">info</span> Informasi</h3>
                </div>
                <div class="card__body" id="approval-info"></div>
              </div>

              <!-- Approver List -->
              <div class="card" id="approval-approvers-card">
                <div class="card__header">
                  <h3><span class="material-icons">people</span> Pihak Terkait</h3>
                </div>
                <div class="card__body" id="approval-approvers"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div id="approval-error" style="display:none">
          <div class="error-state">
            <span class="material-icons error-state__icon">error_outline</span>
            <h3 class="error-state__title" id="error-title">Gagal Memuat</h3>
            <p class="error-state__description" id="error-message">Terjadi kesalahan saat memuat data approval.</p>
            <div class="error-state__actions">
              <button class="btn btn-primary" onclick="window.location.reload()">
                <span class="material-icons">refresh</span> Muat Ulang
              </button>
              <a href="#/approval" class="btn btn-secondary">
                <span class="material-icons">list</span> Daftar Approval
              </a>
            </div>
          </div>
        </div>

        <!-- TTD Modal -->
        <div class="modal-overlay hidden" id="ttd-modal">
          <div class="modal-content modal-content--md">
            <div class="modal-header">
              <h3>Tanda Tangan Digital</h3>
              <button class="btn-icon" onclick="document.getElementById('ttd-modal').classList.add('hidden')">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <p style="margin-bottom:16px">Silakan tanda tangan di bawah ini untuk menyetujui dokumen.</p>
              <div id="ttd-pad-container" style="border:1px solid #ccc;border-radius:12px"></div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" onclick="document.getElementById('ttd-modal').classList.add('hidden')">Batal</button>
              <button class="btn btn-primary" id="btn-confirm-ttd">
                <span class="material-icons">check</span> Konfirmasi & Setujui
              </button>
            </div>
          </div>
        </div>

        <!-- Delegate Modal -->
        <div class="modal-overlay hidden" id="delegate-modal">
          <div class="modal-content modal-content--sm">
            <div class="modal-header">
              <h3>Delegasikan Approval</h3>
              <button class="btn-icon" onclick="document.getElementById('delegate-modal').classList.add('hidden')">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-field">
                <label class="form-label">Pilih Penerima Delegasi</label>
                <select class="form-select" id="delegate-user-select">
                  <option value="">Pilih pengguna...</option>
                </select>
              </div>
              <div class="form-field">
                <label class="form-label">Alasan Delegasi</label>
                <textarea class="form-input form-textarea" id="delegate-reason" rows="2" placeholder="Alasan mendelegasikan approval ini..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" onclick="document.getElementById('delegate-modal').classList.add('hidden')">Batal</button>
              <button class="btn btn-primary" id="btn-confirm-delegate">
                <span class="material-icons">forward</span> Delegasikan
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Load approval data
   */
  async loadApproval() {
    if (this.isLoading) return;
    this.isLoading = true;

    this.showLoading();

    try {
      let response;

      // Try different API methods
      if (typeof api !== 'undefined') {
        response = await api.get('approval.list', { id: this.approvalId });
      } else if (typeof API !== 'undefined') {
        response = await API.get('approval.list', { id: this.approvalId });
      } else {
        // Direct fetch
        const url = this.getApiUrl() + '?action=approval.list&id=' + this.approvalId;
        const res = await fetch(url);
        response = await res.json();
      }

      if (response.status === 'success') {
        this.approvalData = response.data?.items?.[0] || response.data;
        
        if (!this.approvalData) {
          this.showError('Data approval tidak ditemukan', 'Approval dengan ID tersebut tidak ditemukan di sistem.');
          return;
        }

        this.renderAll();
      } else {
        throw new Error(response.message || 'Gagal memuat data');
      }
    } catch (error) {
      console.error('Failed to load approval:', error);
      this.showError('Gagal memuat data approval', error.message);
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  /**
   * Render semua komponen
   */
  renderAll() {
    if (!this.approvalData) return;

    // Show content
    document.getElementById('approval-loading').style.display = 'none';
    document.getElementById('approval-content').style.display = 'block';

    // Update title
    const descEl = document.getElementById('approval-title-desc');
    if (descEl) {
      descEl.textContent = `${this.approvalData.nomorSurat || 'Surat'} - ${this.approvalData.perihal || 'Tanpa Perihal'}`;
    }

    // Render components
    this.renderStatusBadge();
    this.renderDetail();
    this.renderAttachments();
    this.renderProgress();
    this.renderInfo();
    this.renderApprovers();
    this.renderHistory();
    this.renderHeaderActions();

    // Render approval form if user can approve
    if (this.canCurrentUserApprove()) {
      this.renderApprovalForm();
    }
  }

  /**
   * Render status badge di header
   */
  renderStatusBadge() {
    const data = this.approvalData;
    const status = data.status || data.approvalStatus || 'pending';
    
    const badges = {
      'pending': { class: 'badge-warning', text: 'Menunggu Approval', icon: 'hourglass_empty' },
      'approved': { class: 'badge-success', text: 'Disetujui', icon: 'check_circle' },
      'rejected': { class: 'badge-error', text: 'Ditolak', icon: 'cancel' },
      'revisi': { class: 'badge-info', text: 'Perlu Revisi', icon: 'edit' },
      'draft': { class: 'badge-secondary', text: 'Draft', icon: 'draft' },
      'cancelled': { class: 'badge-error', text: 'Dibatalkan', icon: 'remove_circle' }
    };

    const badge = badges[status] || badges.pending;

    const topBadge = document.getElementById('approval-status-badge-top');
    if (topBadge) {
      topBadge.innerHTML = `<span class="badge ${badge.class} badge-lg"><span class="material-icons" style="font-size:16px">${badge.icon}</span> ${badge.text}</span>`;
    }

    const headerActions = document.getElementById('approval-header-actions');
    if (headerActions) {
      headerActions.innerHTML = `<span class="badge ${badge.class} badge-lg"><span class="material-icons" style="font-size:16px">${badge.icon}</span> ${badge.text}</span>`;
    }
  }

  /**
   * Render document detail
   */
  renderDetail() {
    const detail = document.getElementById('approval-detail');
    if (!detail || !this.approvalData) return;

    const data = this.approvalData;

    detail.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-item__label">Nomor Surat</span>
          <span class="detail-item__value text-mono">${this.escapeHtml(data.nomorSurat || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Tanggal Surat</span>
          <span class="detail-item__value">${this.formatDate(data.tanggalSurat)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Tujuan</span>
          <span class="detail-item__value">${this.escapeHtml(data.tujuan || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Perihal</span>
          <span class="detail-item__value">${this.escapeHtml(data.perihal || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Sifat</span>
          <span class="detail-item__value"><span class="badge">${data.sifat || 'biasa'}</span></span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Jenis Surat</span>
          <span class="detail-item__value">${data.jenisSurat || '-'}</span>
        </div>
        ${data.catatan ? `
          <div class="detail-item detail-item--full">
            <span class="detail-item__label">Catatan</span>
            <span class="detail-item__value">${this.escapeHtml(data.catatan)}</span>
          </div>
        ` : ''}
        <div class="detail-item">
          <span class="detail-item__label">Dibuat Oleh</span>
          <span class="detail-item__value">${this.escapeHtml(data.createdByName || data.createdBy || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Tanggal Dibuat</span>
          <span class="detail-item__value">${this.formatDateTime(data.createdAt)}</span>
        </div>
      </div>
    `;
  }

  /**
   * Render attachments
   */
  renderAttachments() {
    const container = document.getElementById('approval-attachments-card');
    const body = document.getElementById('approval-attachments');
    if (!container || !body) return;

    const files = this.approvalData?.files || [];
    if (this.approvalData?.fileUrl) {
      files.push({
        name: this.approvalData.fileName || 'Lampiran',
        url: this.approvalData.fileUrl,
        size: this.approvalData.fileSize
      });
    }

    if (files.length === 0) return;

    container.classList.remove('hidden');
    body.innerHTML = files.map(file => `
      <div class="file-preview-card">
        <div class="file-preview-card__header">
          <span class="material-icons file-preview-card__icon">${this.getFileIcon(file.name)}</span>
          <span class="file-preview-card__name">${this.escapeHtml(file.name)}</span>
          ${file.size ? `<span class="file-preview-card__size">${this.formatSize(file.size)}</span>` : ''}
        </div>
        <div class="file-preview-card__actions">
          <a href="${file.url}" target="_blank" class="btn btn-sm btn-secondary">
            <span class="material-icons">visibility</span> Preview
          </a>
          <a href="${file.url}" download class="btn btn-sm btn-ghost">
            <span class="material-icons">download</span> Download
          </a>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render approval progress
   */
  renderProgress() {
    const progress = document.getElementById('approval-progress');
    if (!progress || !this.approvalData) return;

    const levels = this.approvalData.levels || this.buildDefaultLevels();

    progress.innerHTML = `
      <div class="approval-steps">
        ${levels.map((level, index) => `
          <div class="approval-step 
            ${level.status === 'current' ? 'approval-step--current' : ''} 
            ${level.status === 'approved' ? 'approval-step--completed' : ''} 
            ${level.status === 'rejected' ? 'approval-step--rejected' : ''}
            ${level.status === 'skipped' ? 'approval-step--skipped' : ''}">
            
            <div class="approval-step__indicator">
              ${level.status === 'approved' ? '<span class="material-icons">check</span>' : 
                level.status === 'rejected' ? '<span class="material-icons">close</span>' : 
                level.status === 'skipped' ? '<span class="material-icons">skip_next</span>' :
                level.status === 'current' ? '<span class="material-icons" style="animation:spin 2s linear infinite">hourglass_top</span>' : 
                `<span>${level.level || index + 1}</span>`}
            </div>
            
            <div class="approval-step__info">
              <div class="approval-step__title">${level.label || `Level ${level.level || index + 1}`}</div>
              <div class="approval-step__name">${this.escapeHtml(level.name || level.approverName || '-')}</div>
              ${level.approvedBy ? `<div class="approval-step__approver">Oleh: ${this.escapeHtml(level.approvedBy)}</div>` : ''}
              ${level.approvedAt ? `<div class="approval-step__time">${this.formatDateTime(level.approvedAt)}</div>` : ''}
              ${level.komentar ? `<div class="approval-step__comment">"${this.escapeHtml(level.komentar)}"</div>` : ''}
              ${level.status === 'current' && this.canCurrentUserApprove() ? 
                '<div class="approval-step__action-hint">⏳ Menunggu tindakan Anda</div>' : ''}
            </div>
            
            ${index < levels.length - 1 ? `
              <div class="approval-step__connector ${level.status === 'approved' ? 'approval-step__connector--completed' : ''}"></div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Build default levels if not provided
   */
  buildDefaultLevels() {
    const data = this.approvalData;
    const levels = [];
    
    if (data.approvalLevels) {
      return data.approvalLevels.map((l, i) => ({
        ...l,
        status: l.status || (i === 0 ? 'approved' : i === 1 ? (data.status === 'pending' ? 'current' : 'pending') : 'pending')
      }));
    }

    // Default 3-level approval
    levels.push({ level: 1, name: 'Pembuat', status: 'approved', approvedBy: data.createdByName, approvedAt: data.createdAt });
    levels.push({ level: 2, name: 'Kepala Sub Bagian', status: data.status === 'pending' ? 'current' : (data.status === 'approved' ? 'approved' : 'pending') });
    levels.push({ level: 3, name: 'Kepala Bidang', status: 'pending' });
    
    return levels;
  }

  /**
   * Render document info sidebar
   */
  renderInfo() {
    const info = document.getElementById('approval-info');
    if (!info) return;

    const data = this.approvalData;
    info.innerHTML = `
      <div class="info-list">
        <div class="info-item">
          <span class="info-item__label">Status</span>
          <span class="badge badge-${this.getStatusClass(data.status)}">${data.status || 'pending'}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">Approval Status</span>
          <span class="badge">${data.approvalStatus || data.status || 'pending'}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">Dibuat</span>
          <span>${this.formatDateTime(data.createdAt)}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">Diupdate</span>
          <span>${this.formatDateTime(data.updatedAt)}</span>
        </div>
      </div>
    `;
  }

  /**
   * Render approvers list
   */
  renderApprovers() {
    const container = document.getElementById('approval-approvers');
    if (!container) return;

    const approvers = this.approvalData?.approvers || [];
    if (approvers.length === 0) {
      container.innerHTML = '<p class="text-muted">Tidak ada data pihak terkait</p>';
      return;
    }

    container.innerHTML = approvers.map(a => `
      <div class="approver-item">
        <div class="avatar avatar-sm">${this.getInitials(a.name)}</div>
        <div class="approver-item__info">
          <div class="approver-item__name">${this.escapeHtml(a.name)}</div>
          <div class="approver-item__role">${this.escapeHtml(a.role || a.jabatan || '-')}</div>
        </div>
        <span class="badge badge-sm badge-${this.getStatusClass(a.status)}">${a.status || 'pending'}</span>
      </div>
    `).join('');
  }

  /**
   * Render approval history
   */
  renderHistory() {
    const history = document.getElementById('approval-history');
    if (!history) return;

    const historyData = this.approvalData?.history || [];
    
    if (historyData.length === 0) {
      history.innerHTML = `
        <div class="empty-state" style="min-height:100px;padding:24px">
          <span class="material-icons" style="font-size:40px;color:var(--md-sys-color-outline)">history</span>
          <p class="text-muted">Belum ada riwayat approval</p>
        </div>
      `;
      return;
    }

    history.innerHTML = `
      <div class="timeline">
        ${historyData.map(h => `
          <div class="timeline-item 
            ${h.status === 'approved' ? 'timeline-item--completed' : ''} 
            ${h.status === 'rejected' ? 'timeline-item--rejected' : ''}
            ${h.status === 'revisi' ? 'timeline-item--revisi' : ''}">
            <div class="timeline-item__time">${this.formatDateTime(h.createdAt || h.approvedAt)}</div>
            <div class="timeline-item__title">
              <strong>${this.escapeHtml(h.approverName || h.name || 'Unknown')}</strong>
              <span class="badge badge-sm badge-${this.getStatusClass(h.status)}" style="margin-left:8px">${h.status}</span>
            </div>
            <div class="timeline-item__action">${this.getActionLabel(h.status)}</div>
            ${h.komentar ? `<div class="timeline-item__description">${this.escapeHtml(h.komentar)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render header actions
   */
  renderHeaderActions() {
    const container = document.getElementById('approval-header-actions');
    if (!container) return;

    const data = this.approvalData;
    let actions = '';

    // Download button
    if (data.fileUrl) {
      actions += `
        <a href="${data.fileUrl}" download class="btn btn-secondary btn-sm">
          <span class="material-icons">download</span> Download
        </a>
      `;
    }

    // Print button
    actions += `
      <button class="btn btn-secondary btn-sm" onclick="window.print()">
        <span class="material-icons">print</span> Cetak
      </button>
    `;

    // Refresh button
    actions += `
      <button class="btn btn-ghost btn-sm" id="btn-refresh-approval">
        <span class="material-icons">refresh</span>
      </button>
    `;

    container.innerHTML = actions;
  }

  /**
   * Render approval action form
   */
  renderApprovalForm() {
    const formCard = document.getElementById('approval-form-card');
    const form = document.getElementById('approval-form');
    if (!formCard || !form) return;

    formCard.classList.remove('hidden');
    formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

    form.innerHTML = `
      <div class="approval-form">
        <div class="form-field">
          <label class="form-label">Komentar / Catatan</label>
          <textarea class="form-input form-textarea" id="approval-komentar" 
                    placeholder="Tambahkan komentar atau catatan untuk approval ini (opsional)" 
                    rows="3"></textarea>
        </div>
        
        <div class="form-field">
          <label class="form-checkbox">
            <input type="checkbox" class="form-checkbox__input" id="approval-ttd-check">
            <span class="form-checkbox__label">Sertakan Tanda Tangan Digital (TTD)</span>
          </label>
        </div>

        <div class="form-field">
          <label class="form-checkbox">
            <input type="checkbox" class="form-checkbox__input" id="approval-notify-check" checked>
            <span class="form-checkbox__label">Kirim notifikasi ke pembuat surat</span>
          </label>
        </div>

        <div class="form-actions">
          <button class="btn btn-success btn-lg" id="btn-approve">
            <span class="material-icons">check_circle</span>
            Setujui
          </button>
          <button class="btn btn-error" id="btn-reject">
            <span class="material-icons">cancel</span>
            Tolak
          </button>
          <button class="btn btn-info" id="btn-revisi">
            <span class="material-icons">edit</span>
            Revisi
          </button>
          <button class="btn btn-secondary" id="btn-delegate">
            <span class="material-icons">forward</span>
            Delegasikan
          </button>
        </div>
      </div>
    `;

    // Initialize signature pad
    const ttdCheck = document.getElementById('approval-ttd-check');
    if (ttdCheck) {
      ttdCheck.addEventListener('change', () => {
        if (ttdCheck.checked) {
          this.showTTDModal();
        }
      });
    }
  }

  /**
   * Check if current user can approve
   */
  canCurrentUserApprove() {
    if (!this.approvalData || !this.currentUser) return false;

    // Check if status is pending
    if (this.approvalData.status !== 'pending' && this.approvalData.approvalStatus !== 'pending') {
      return false;
    }

    // Check if user is in the approver list for current level
    const levels = this.approvalData.levels || [];
    const currentLevel = levels.find(l => l.status === 'current');
    
    if (currentLevel) {
      if (currentLevel.approverId === this.currentUser.id) return true;
      if (currentLevel.approverIds?.includes(this.currentUser.id)) return true;
      if (currentLevel.role && currentLevel.role === this.currentUser.role) return true;
    }

    // Admin can always approve
    if (this.currentUser.role === 'admin') return true;

    // Check if user is the assigned approver
    if (this.approvalData.approverId === this.currentUser.id) return true;
    
    return this.approvalData.canApprove === true;
  }

  /**
   * Process approval
   */
  async processApproval(status) {
    // Validate
    if (status === 'rejected' || status === 'revisi') {
      const komentar = document.getElementById('approval-komentar')?.value?.trim();
      if (!komentar) {
        this.showToast('Komentar wajib diisi untuk penolakan/revisi', 'warning');
        document.getElementById('approval-komentar')?.focus();
        return;
      }
    }

    // Check TTD
    const ttdCheck = document.getElementById('approval-ttd-check');
    if (ttdCheck?.checked && status === 'approved') {
      this.showTTDModal();
      this.selectedAction = status;
      return;
    }

    await this.submitApproval(status);
  }

  /**
   * Submit approval to server
   */
  async submitApproval(status, signatureData = null) {
    const komentar = document.getElementById('approval-komentar')?.value?.trim() || '';
    const notifyChecked = document.getElementById('approval-notify-check')?.checked ?? true;
    
    // Show loading
    const btn = document.getElementById(`btn-${status}`);
    if (btn) {
      btn.classList.add('btn-loading');
      btn.disabled = true;
    }

    try {
      const payload = {
        id: this.approvalId,
        status: status,
        komentar: komentar,
        notify: notifyChecked
      };

      if (signatureData) {
        payload.signature = signatureData;
      }

      let response;
      if (typeof api !== 'undefined') {
        response = await api.post('approval.process', payload);
      } else if (typeof API !== 'undefined') {
        response = await API.post('approval.process', payload);
      }

      if (response?.status === 'success') {
        const messages = {
          'approved': '✅ Surat telah disetujui',
          'rejected': '❌ Surat telah ditolak',
          'revisi': '📝 Surat perlu direvisi'
        };

        this.showToast(messages[status] || 'Approval berhasil diproses', 'success');

        // Reload data
        setTimeout(() => {
          this.loadApproval();
          // Scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 800);
      } else {
        throw new Error(response?.message || 'Gagal memproses approval');
      }
    } catch (error) {
      console.error('Approval processing failed:', error);
      this.showToast('Gagal memproses approval: ' + error.message, 'error');
    } finally {
      if (btn) {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
      }
    }
  }

  /**
   * Show TTD modal
   */
  showTTDModal() {
    const modal = document.getElementById('ttd-modal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    
    // Initialize signature pad if not yet
    const padContainer = document.getElementById('ttd-pad-container');
    if (padContainer && !this.signaturePad) {
      if (typeof SignaturePad !== 'undefined') {
        this.signaturePad = new SignaturePad({
          container: padContainer,
          height: 200,
          penColor: '#1976D2',
          placeholder: 'Tanda tangan di sini'
        });
        this.signaturePad.init();
      } else {
        padContainer.innerHTML = `
          <div style="padding:40px;text-align:center">
            <p class="text-muted">Komponen tanda tangan tidak tersedia.</p>
            <p class="text-muted">Lanjutkan tanpa TTD?</p>
          </div>
        `;
      }
    }
  }

  /**
   * Confirm TTD and approve
   */
  async confirmTTD() {
    let signatureData = null;
    
    if (this.signaturePad) {
      const dataUrl = this.signaturePad.toDataURL();
      if (dataUrl) {
        signatureData = dataUrl;
      }
    }

    // Close modal
    document.getElementById('ttd-modal')?.classList.add('hidden');

    // Submit with signature
    await this.submitApproval(this.selectedAction || 'approved', signatureData);
  }

  /**
   * Show delegate modal
   */
  async showDelegateModal() {
    const modal = document.getElementById('delegate-modal');
    if (!modal) return;

    modal.classList.remove('hidden');

    // Load users for delegate
    await this.loadDelegateUsers();

    const select = document.getElementById('delegate-user-select');
    if (select && this.delegateUsers.length > 0) {
      select.innerHTML = `
        <option value="">Pilih pengguna...</option>
        ${this.delegateUsers.map(u => `
          <option value="${u.id}">${u.namaLengkap || u.username} (${u.jabatan || u.role || '-'})</option>
        `).join('')}
      `;
    }
  }

  /**
   * Load users for delegation
   */
  async loadDelegateUsers() {
    try {
      let response;
      if (typeof api !== 'undefined') {
        response = await api.get('users.list', { limit: 100, isActive: true });
      } else if (typeof API !== 'undefined') {
        response = await API.get('users.list', { limit: 100, isActive: true });
      }
      
      if (response?.status === 'success') {
        this.delegateUsers = (response.data?.items || []).filter(u => u.id !== this.currentUser?.id);
      }
    } catch (error) {
      console.warn('Failed to load delegate users:', error);
    }
  }

  /**
   * Confirm delegation
   */
  async confirmDelegate() {
    const userId = document.getElementById('delegate-user-select')?.value;
    const reason = document.getElementById('delegate-reason')?.value?.trim();

    if (!userId) {
      this.showToast('Pilih penerima delegasi', 'warning');
      return;
    }

    try {
      const payload = {
        id: this.approvalId,
        delegateTo: userId,
        reason: reason || 'Didelegasikan'
      };

      let response;
      if (typeof api !== 'undefined') {
        response = await api.post('approval.delegate', payload);
      } else if (typeof API !== 'undefined') {
        response = await API.post('approval.delegate', payload);
      }

      if (response?.status === 'success') {
        this.showToast('Approval berhasil didelegasikan', 'success');
        document.getElementById('delegate-modal')?.classList.add('hidden');
        this.loadApproval();
      } else {
        throw new Error(response?.message || 'Gagal mendelegasikan');
      }
    } catch (error) {
      this.showToast('Gagal mendelegasikan: ' + error.message, 'error');
    }
  }

  /**
   * Show loading
   */
  showLoading() {
    const loading = document.getElementById('approval-loading');
    const content = document.getElementById('approval-content');
    if (loading) loading.style.display = 'flex';
    if (content) content.style.display = 'none';
  }

  /**
   * Hide loading
   */
  hideLoading() {
    const loading = document.getElementById('approval-loading');
    if (loading) loading.style.display = 'none';
  }

  /**
   * Show error
   */
  showError(title, message) {
    document.getElementById('approval-loading')?.style.display = 'none';
    document.getElementById('approval-content')?.style.display = 'none';
    
    const errorEl = document.getElementById('approval-error');
    if (errorEl) errorEl.style.display = 'block';
    
    document.getElementById('error-title').textContent = title || 'Gagal Memuat';
    document.getElementById('error-message').textContent = message || 'Terjadi kesalahan';
  }

  /**
   * Start polling for updates
   */
  startPolling() {
    this.stopPolling();
    this.pollingInterval = setInterval(async () => {
      try {
        await this.loadApproval();
      } catch (e) {}
    }, 30000); // Poll every 30 seconds
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Helper methods
   */
  formatDate(date) {
    if (!date) return '-';
    try { return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return date; }
  }

  formatDateTime(date) {
    if (!date) return '-';
    try { return new Date(date).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return date; }
  }

  formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }

  getFileIcon(name) {
    const ext = name?.split('.').pop()?.toLowerCase();
    const icons = { pdf: 'picture_as_pdf', doc: 'description', docx: 'description', xls: 'table_chart', xlsx: 'table_chart', jpg: 'image', jpeg: 'image', png: 'image' };
    return icons[ext] || 'insert_drive_file';
  }

  getStatusClass(status) {
    const classes = { approved: 'success', rejected: 'error', pending: 'warning', revisi: 'info', draft: 'secondary', cancelled: 'error' };
    return classes[status] || 'default';
  }

  getActionLabel(status) {
    const labels = { approved: '✅ Menyetujui', rejected: '❌ Menolak', revisi: '📝 Meminta Revisi', pending: '⏳ Menunggu', submitted: '📤 Mengajukan' };
    return labels[status] || status;
  }

  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  getApiUrl() {
    if (typeof APP_CONFIG !== 'undefined') {
      return APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '';
    }
    return '';
  }

  showToast(message, type = 'info') {
    if (typeof Toast !== 'undefined') Toast.show(message, type);
    else if (typeof NotificationService !== 'undefined') NotificationService.show(message, type);
  }

  /**
   * Bind events
   */
  bindEvents() {
    // Approval actions
    document.getElementById('btn-approve')?.addEventListener('click', () => this.processApproval('approved'));
    document.getElementById('btn-reject')?.addEventListener('click', () => this.processApproval('rejected'));
    document.getElementById('btn-revisi')?.addEventListener('click', () => this.processApproval('revisi'));
    document.getElementById('btn-delegate')?.addEventListener('click', () => this.showDelegateModal());

    // TTD confirmation
    document.getElementById('btn-confirm-ttd')?.addEventListener('click', () => this.confirmTTD());

    // Delegate confirmation
    document.getElementById('btn-confirm-delegate')?.addEventListener('click', () => this.confirmDelegate());

    // Refresh button
    document.getElementById('btn-refresh-approval')?.addEventListener('click', () => this.loadApproval());

    // Close modals on backdrop click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        this.loadApproval();
      }
    });
  }

  /**
   * Destroy page
   */
  destroy() {
    this.stopPolling();
    if (this.signaturePad && typeof this.signaturePad.destroy === 'function') {
      this.signaturePad.destroy();
    }
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Export component
const ApprovalProcessComponent = (props) => {
  const page = new ApprovalProcessPage();
  const container = document.createElement('div');
  container.className = 'content-area approval-process';
  page.render(container);
  
  // Store instance for cleanup
  container._approvalPage = page;
  
  return container;
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApprovalProcessPage, ApprovalProcessComponent };
}
