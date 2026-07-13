/**
 * APPROVAL PROCESS PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class ApprovalProcessPage {
  constructor() {
    this.container = null;
    this.approvalData = null;
    this.approvalId = null;
  }
  
  async render(container) {
    this.container = container;
    this.approvalId = store.getState('ui.currentRoute')?.params?.id;
    
    if (!this.approvalId) {
      this.showError('ID Approval tidak ditemukan');
      return;
    }
    
    this.container.innerHTML = this.getTemplate();
    await this.loadApproval();
    this.bindEvents();
  }
  
  getTemplate() {
    return `
      <div class="approval-process">
        <div class="content-area__header">
          <h1 class="content-area__title">Proses Approval</h1>
          <div id="approval-status-badge"></div>
        </div>
        
        <div class="approval-layout">
          <div class="approval-main">
            <div id="approval-detail"></div>
            <div id="approval-history"></div>
            <div id="approval-form" style="display:none"></div>
          </div>
          
          <div class="approval-sidebar">
            <div class="card">
              <div class="card__header"><h3>Status Approval</h3></div>
              <div class="card__body" id="approval-progress"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  async loadApproval() {
    try {
      const response = await api.get('approval.list', { id: this.approvalId });
      
      if (response.status === 'success') {
        this.approvalData = response.data.items?.[0] || response.data;
        this.renderApprovalDetail();
        this.renderProgress();
        this.renderHistory();
        
        if (this.canApprove()) {
          this.renderApprovalForm();
        }
      }
    } catch (error) {
      this.showError('Gagal memuat data approval');
    }
  }
  
  renderApprovalDetail() {
    const detail = document.getElementById('approval-detail');
    if (!detail || !this.approvalData) return;
    
    const data = this.approvalData;
    
    detail.innerHTML = `
      <div class="card">
        <div class="card__header"><h3>Detail Surat</h3></div>
        <div class="card__body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-item__label">Nomor Surat</span>
              <span class="detail-item__value">${data.nomorSurat || '-'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">Tanggal</span>
              <span class="detail-item__value">${Formatters.date(data.tanggalSurat)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">Tujuan</span>
              <span class="detail-item__value">${data.tujuan || '-'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">Perihal</span>
              <span class="detail-item__value">${data.perihal || '-'}</span>
            </div>
            <div class="detail-item detail-item--full">
              <span class="detail-item__label">Catatan</span>
              <span class="detail-item__value">${data.catatan || '-'}</span>
            </div>
          </div>
          ${data.fileUrl ? `
            <div class="file-preview-card">
              <div class="file-preview-card__header">
                <span class="material-icons">attachment</span>
                <span>${data.fileName || 'Lampiran'}</span>
                <button class="btn btn-sm btn-secondary" onclick="window.open('${data.fileUrl}')">
                  <span class="material-icons">download</span>
                </button>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  renderProgress() {
    const progress = document.getElementById('approval-progress');
    if (!progress || !this.approvalData) return;
    
    const levels = this.approvalData.levels || [
      { level: 1, name: 'Kepala Sub Bagian', status: 'approved' },
      { level: 2, name: 'Kepala Bidang', status: this.approvalData.status === 'pending' ? 'current' : 'pending' },
      { level: 3, name: 'Sekretaris', status: 'pending' }
    ];
    
    progress.innerHTML = `
      <div class="approval-steps">
        ${levels.map((level, index) => `
          <div class="approval-step ${level.status === 'current' ? 'approval-step--current' : ''} ${level.status === 'approved' ? 'approval-step--completed' : ''} ${level.status === 'rejected' ? 'approval-step--rejected' : ''}">
            <div class="approval-step__indicator">
              ${level.status === 'approved' ? '<span class="material-icons">check</span>' : 
                level.status === 'rejected' ? '<span class="material-icons">close</span>' : 
                level.status === 'current' ? '<span class="material-icons">hourglass_top</span>' : 
                `<span>${level.level}</span>`}
            </div>
            <div class="approval-step__info">
              <div class="approval-step__title">Level ${level.level}</div>
              <div class="approval-step__name">${level.name}</div>
              ${level.approvedBy ? `<div class="approval-step__approver">${level.approvedBy}</div>` : ''}
              ${level.approvedAt ? `<div class="approval-step__time">${Formatters.dateTime(level.approvedAt)}</div>` : ''}
            </div>
            ${index < levels.length - 1 ? '<div class="approval-step__connector"></div>' : ''}
          </div>
        `).join('')}
      </div>
    `;
  }
  
  renderHistory() {
    const history = document.getElementById('approval-history');
    if (!history) return;
    
    const historyData = this.approvalData?.history || [];
    
    history.innerHTML = `
      <div class="card">
        <div class="card__header"><h3>Riwayat Approval</h3></div>
        <div class="card__body">
          ${historyData.length > 0 ? `
            <div class="timeline">
              ${historyData.map(h => `
                <div class="timeline-item ${h.status === 'approved' ? 'timeline-item--completed' : h.status === 'rejected' ? 'timeline-item--rejected' : ''}">
                  <div class="timeline-item__time">${Formatters.dateTime(h.createdAt)}</div>
                  <div class="timeline-item__title">${h.approverName || 'Unknown'} - ${h.status === 'approved' ? 'Menyetujui' : h.status === 'rejected' ? 'Menolak' : 'Meninjau'}</div>
                  ${h.komentar ? `<div class="timeline-item__description">${h.komentar}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : '<p class="text-muted">Belum ada riwayat approval</p>'}
        </div>
      </div>
    `;
  }
  
  renderApprovalForm() {
    const form = document.getElementById('approval-form');
    if (!form) return;
    
    form.style.display = 'block';
    form.innerHTML = `
      <div class="card">
        <div class="card__header"><h3>Tindakan Approval</h3></div>
        <div class="card__body">
          <div class="form-field">
            <label class="form-label">Komentar</label>
            <textarea class="form-input form-textarea" id="approval-komentar" 
                      placeholder="Tambahkan komentar (opsional)" rows="3"></textarea>
          </div>
          <div class="form-actions">
            <button class="btn btn-success" id="btn-approve">
              <span class="material-icons">check_circle</span>
              Setujui
            </button>
            <button class="btn btn-error" id="btn-reject">
              <span class="material-icons">cancel</span>
              Tolak
            </button>
            <button class="btn btn-warning" id="btn-revisi">
              <span class="material-icons">edit</span>
              Revisi
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  canApprove() {
    if (!this.approvalData) return false;
    return this.approvalData.status === 'pending' || this.approvalData.canApprove;
  }
  
  async processApproval(status) {
    const komentar = document.getElementById('approval-komentar')?.value?.trim() || '';
    
    try {
      const response = await api.post('approval.process', {
        id: this.approvalId,
        status,
        komentar
      });
      
      if (response.status === 'success') {
        const messages = {
          'approved': 'Surat telah disetujui',
          'rejected': 'Surat telah ditolak',
          'revisi': 'Surat perlu direvisi'
        };
        
        NotificationService.success(messages[status] || 'Approval diproses');
        
        // Reload
        setTimeout(() => this.loadApproval(), 500);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      NotificationService.error('Gagal memproses approval');
    }
  }
  
  showError(message) {
    if (this.container) {
      this.container.innerHTML = `
        <div class="error-state">
          <span class="material-icons">error</span>
          <h3>${message}</h3>
          <button class="btn btn-primary" onclick="history.back()">Kembali</button>
        </div>
      `;
    }
  }
  
  bindEvents() {
    document.getElementById('btn-approve')?.addEventListener('click', () => this.processApproval('approved'));
    document.getElementById('btn-reject')?.addEventListener('click', () => this.processApproval('rejected'));
    document.getElementById('btn-revisi')?.addEventListener('click', () => this.processApproval('revisi'));
  }
}

const ApprovalProcessComponent = (props) => {
  const page = new ApprovalProcessPage();
  const container = document.createElement('div');
  container.className = 'content-area approval-process';
  page.render(container);
  return container;
};
