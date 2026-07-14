/**
 * ============================================
 * BACKUP SETTINGS PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL BACKUP & RESTORE - SIAP PRODUKSI
 * Mendukung: Create, Restore, Download, Upload,
 * Auto-Backup, Schedule, Stats, API Integration
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class BackupSettingsPage {
  constructor() {
    this.container = null;
    this.backups = [];
    this.autoBackupEnabled = false;
    this.isProcessing = false;
    this.pageId = 'backup-' + Math.random().toString(36).substr(2, 9);
    this.autoBackupInterval = 'daily';
    this.autoBackupTime = '02:00';
  }

  async render(container) {
    this.container = container;
    this.container.setAttribute('data-page-id', this.pageId);
    this.container.innerHTML = this.getTemplate();
    
    // Load saved preferences
    this.loadPreferences();
    
    await this.loadBackups();
    this.bindEvents();
    console.log('✅ BackupSettingsPage rendered');
  }

  getTemplate() {
    return `
      <div class="settings-content" id="backup-${this.pageId}">
        <div class="settings-section">
          <h2 class="settings-section__title">
            <span class="material-icons">backup</span> Backup & Restore
          </h2>
          <p class="settings-section__description">
            Kelola backup data sistem untuk menjaga keamanan data. Backup mencakup seluruh data surat, disposisi, pengguna, dan konfigurasi.
          </p>

          <!-- Quick Actions -->
          <div class="stats-grid" style="margin-bottom:24px">
            <div class="stat-card stat-card--primary" id="btn-create-backup-card" style="cursor:pointer">
              <div class="stat-card__icon"><span class="material-icons">backup</span></div>
              <div class="stat-card__content">
                <div class="stat-card__title">Buat Backup</div>
                <div class="stat-card__value text-sm">Backup data sekarang</div>
              </div>
            </div>
            <div class="stat-card stat-card--secondary" id="btn-upload-backup-card" style="cursor:pointer">
              <div class="stat-card__icon"><span class="material-icons">upload</span></div>
              <div class="stat-card__content">
                <div class="stat-card__title">Restore Backup</div>
                <div class="stat-card__value text-sm">Dari file backup</div>
              </div>
            </div>
            <div class="stat-card stat-card--tertiary" id="btn-download-all-card" style="cursor:pointer">
              <div class="stat-card__icon"><span class="material-icons">download</span></div>
              <div class="stat-card__content">
                <div class="stat-card__title">Download Semua</div>
                <div class="stat-card__value text-sm">Export data lengkap</div>
              </div>
            </div>
          </div>

          <!-- Auto Backup Configuration -->
          <div class="settings-card">
            <div class="settings-card__header">
              <h4><span class="material-icons">schedule</span> Backup Otomatis</h4>
            </div>
            <div class="settings-card__body">
              <div class="settings-card__row">
                <div class="settings-card__label">
                  <div class="settings-card__label-title">Aktifkan Backup Otomatis</div>
                  <div class="settings-card__label-description">
                    Backup data secara otomatis sesuai jadwal
                  </div>
                </div>
                <div class="settings-card__action">
                  <div class="form-switch">
                    <input type="checkbox" class="form-switch__input" id="auto-backup-toggle" ${this.autoBackupEnabled ? 'checked' : ''}>
                    <div class="form-switch__track"></div>
                  </div>
                </div>
              </div>
              <div class="settings-card__row" id="auto-backup-options" style="display:${this.autoBackupEnabled ? 'flex' : 'none'}">
                <div class="form-row form-row--3col" style="width:100%">
                  <div class="form-field">
                    <label class="form-label">Frekuensi</label>
                    <select class="form-select" id="backup-frequency">
                      <option value="daily" ${this.autoBackupInterval === 'daily' ? 'selected' : ''}>Setiap Hari</option>
                      <option value="weekly" ${this.autoBackupInterval === 'weekly' ? 'selected' : ''}>Setiap Minggu</option>
                      <option value="monthly" ${this.autoBackupInterval === 'monthly' ? 'selected' : ''}>Setiap Bulan</option>
                    </select>
                  </div>
                  <div class="form-field">
                    <label class="form-label">Waktu</label>
                    <input type="time" class="form-input" id="backup-time" value="${this.autoBackupTime}">
                  </div>
                  <div class="form-field">
                    <label class="form-label">Retensi</label>
                    <select class="form-select" id="backup-retention">
                      <option value="7">7 backup terakhir</option>
                      <option value="14">14 backup terakhir</option>
                      <option value="30" selected>30 backup terakhir</option>
                      <option value="90">90 backup terakhir</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Backup Stats -->
          <div class="stats-grid" style="margin-top:16px">
            <div class="stat-card">
              <div class="stat-card__icon"><span class="material-icons">backup</span></div>
              <div class="stat-card__content">
                <div class="stat-card__title">Total Backup</div>
                <div class="stat-card__value" id="stat-total-backups">0</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card__icon"><span class="material-icons">storage</span></div>
              <div class="stat-card__content">
                <div class="stat-card__title">Total Ukuran</div>
                <div class="stat-card__value" id="stat-total-size">0 B</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card__icon"><span class="material-icons">schedule</span></div>
              <div class="stat-card__content">
                <div class="stat-card__title">Backup Terakhir</div>
                <div class="stat-card__value" id="stat-last-backup">-</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card__icon"><span class="material-icons">auto_fix_high</span></div>
              <div class="stat-card__content">
                <div class="stat-card__title">Auto Backup</div>
                <div class="stat-card__value" id="stat-auto-status">Nonaktif</div>
              </div>
            </div>
          </div>

          <!-- Backup Progress -->
          <div id="backup-progress" class="hidden" style="margin-top:16px">
            <div class="progress progress--lg">
              <div class="progress__bar progress__bar--striped progress__bar--animated" id="backup-progress-bar" style="width:0%"></div>
            </div>
            <p class="text-muted text-sm" id="backup-progress-text" style="margin-top:8px">Memproses...</p>
          </div>

          <!-- Backup List -->
          <h3 style="margin-top:32px;margin-bottom:16px">Riwayat Backup</h3>
          <div id="backup-list">
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
          </div>
          <div id="backup-empty" class="empty-state hidden" style="min-height:150px">
            <span class="material-icons" style="font-size:48px;color:var(--md-sys-color-outline)">backup</span>
            <p>Belum ada backup</p>
            <button class="btn btn-primary btn-sm" id="btn-create-first-backup">
              <span class="material-icons">backup</span> Buat Backup Pertama
            </button>
          </div>

          <!-- Upload Backup Modal -->
          <div class="modal-overlay hidden" id="restore-modal">
            <div class="modal-content modal-content--sm">
              <div class="modal-header">
                <h3>Restore dari Backup</h3>
                <button class="btn-icon" id="btn-close-restore-modal">
                  <span class="material-icons">close</span>
                </button>
              </div>
              <div class="modal-body">
                <div class="restore-warning" style="background:var(--md-sys-color-error-container);padding:16px;border-radius:12px;margin-bottom:16px;display:flex;align-items:flex-start;gap:12px">
                  <span class="material-icons" style="color:var(--md-sys-color-error)">warning</span>
                  <div>
                    <strong style="color:var(--md-sys-color-on-error-container)">Peringatan!</strong>
                    <p style="color:var(--md-sys-color-on-error-container);font-size:13px;margin-top:4px">
                      Restore akan menimpa semua data saat ini. Pastikan Anda telah membuat backup terbaru sebelum melanjutkan.
                    </p>
                  </div>
                </div>
                <div class="upload-zone" id="restore-upload-zone">
                  <span class="upload-zone__icon material-icons">upload</span>
                  <p class="upload-zone__text"><strong>Pilih file backup</strong></p>
                  <p class="upload-zone__hint">Format: .json</p>
                  <input type="file" id="backup-file-input" accept=".json" style="display:none">
                </div>
                <div class="file-info hidden" id="restore-file-info"></div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-ghost" id="btn-cancel-restore">Batal</button>
                <button class="btn btn-error" id="btn-confirm-restore" disabled>
                  <span class="material-icons">restore</span> Restore
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  loadPreferences() {
    try {
      const prefs = JSON.parse(localStorage.getItem('asd_backup_prefs') || '{}');
      this.autoBackupEnabled = prefs.autoBackupEnabled || false;
      this.autoBackupInterval = prefs.autoBackupInterval || 'daily';
      this.autoBackupTime = prefs.autoBackupTime || '02:00';
    } catch {}
  }

  savePreferences() {
    try {
      localStorage.setItem('asd_backup_prefs', JSON.stringify({
        autoBackupEnabled: this.autoBackupEnabled,
        autoBackupInterval: this.autoBackupInterval,
        autoBackupTime: this.autoBackupTime
      }));
    } catch {}
  }

  async loadBackups() {
    try {
      if (typeof BackupService !== 'undefined' && BackupService.getBackups) {
        this.backups = await BackupService.getBackups();
      } else {
        // Try API
        let response;
        if (typeof api !== 'undefined') {
          response = await api.get('backup.list');
        } else if (typeof API !== 'undefined') {
          response = await API.get('backup.list');
        } else {
          const url = this.getApiUrl() + '?action=backup.list';
          const res = await fetch(url);
          response = await res.json();
        }
        if (response?.status === 'success') {
          this.backups = response.data?.items || [];
        }
      }
      this.renderBackups();
      this.updateStats();
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  }

  renderBackups() {
    const list = document.getElementById('backup-list');
    const empty = document.getElementById('backup-empty');
    if (!list) return;

    if (this.backups.length === 0) {
      list.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    list.innerHTML = this.backups.map((backup, index) => `
      <div class="backup-item animate-fade-in-up" style="animation-delay:${index * 50}ms" data-id="${backup.id}">
        <div class="backup-item__icon">
          <span class="material-icons">backup</span>
        </div>
        <div class="backup-item__info">
          <div class="backup-item__name">${this.escapeHtml(backup.description || backup.name || 'Backup')}</div>
          <div class="backup-item__meta">
            <span>📅 ${this.formatDateTime(backup.timestamp || backup.createdAt)}</span>
            <span>📦 v${backup.version || '3.2.2'}</span>
            ${backup.type ? `<span>🏷️ ${backup.type}</span>` : ''}
            ${backup.autoBackup ? '<span class="badge badge-sm badge-info">🤖 Auto</span>' : '<span class="badge badge-sm">👤 Manual</span>'}
          </div>
        </div>
        <div class="backup-item__size">${this.formatSize(backup.size || backup.fileSize || 0)}</div>
        <div class="backup-item__actions">
          <button class="btn-icon btn-icon-sm" onclick="window._restoreBackup('${backup.id}')" title="Restore backup ini">
            <span class="material-icons">restore</span>
          </button>
          <button class="btn-icon btn-icon-sm" onclick="window._downloadBackup('${backup.id}')" title="Download backup">
            <span class="material-icons">download</span>
          </button>
          <button class="btn-icon btn-icon-sm" onclick="window._deleteBackup('${backup.id}')" title="Hapus backup">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  updateStats() {
    const stats = this.getStats();
    document.getElementById('stat-total-backups').textContent = stats.totalBackups;
    document.getElementById('stat-total-size').textContent = stats.totalSize;
    document.getElementById('stat-last-backup').textContent = stats.lastBackup || 'Belum pernah';
    document.getElementById('stat-auto-status').textContent = this.autoBackupEnabled ? '✅ Aktif' : '❌ Nonaktif';
    document.getElementById('stat-auto-status').style.color = this.autoBackupEnabled ? 'var(--md-sys-color-success)' : '';
  }

  getStats() {
    const totalSize = this.backups.reduce((s, b) => s + (b.size || b.fileSize || 0), 0);
    return {
      totalBackups: this.backups.length,
      totalSize: this.formatSize(totalSize),
      lastBackup: this.backups[0] ? this.formatRelativeTime(this.backups[0].timestamp || this.backups[0].createdAt) : null
    };
  }

  async createBackup() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    this.showProgress(10, 'Mengumpulkan data...');

    try {
      if (typeof BackupService !== 'undefined' && BackupService.createBackup) {
        this.showProgress(30, 'Membuat backup...');
        await BackupService.createBackup({ description: `Backup ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}` });
      } else if (typeof api !== 'undefined') {
        this.showProgress(30, 'Membuat backup via server...');
        await api.post('backup.create', { description: `Backup ${new Date().toLocaleDateString('id-ID')}` });
      } else if (typeof API !== 'undefined') {
        await API.post('backup.create', { description: `Backup ${new Date().toLocaleDateString('id-ID')}` });
      } else {
        // Create local backup
        const data = {
          timestamp: new Date().toISOString(),
          version: '3.2.2',
          localStorage: { ...localStorage },
          sessionStorage: { ...sessionStorage }
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }

      this.showProgress(100, 'Selesai!');
      this.showToast('✅ Backup berhasil dibuat', 'success');
      await this.loadBackups();
    } catch (error) {
      this.showToast('Gagal membuat backup: ' + error.message, 'error');
    } finally {
      this.isProcessing = false;
      setTimeout(() => this.hideProgress(), 1500);
    }
  }

  async uploadBackup(file) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    this.showProgress(10, 'Membaca file backup...');

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      if (typeof BackupService !== 'undefined' && BackupService.uploadBackup) {
        this.showProgress(50, 'Memproses backup...');
        await BackupService.uploadBackup(file);
      } else {
        // Store locally
        const backups = JSON.parse(localStorage.getItem('asd_backups') || '[]');
        backups.unshift({
          id: 'backup-' + Date.now(),
          description: file.name,
          timestamp: new Date().toISOString(),
          size: file.size,
          data: backupData
        });
        localStorage.setItem('asd_backups', JSON.stringify(backups.slice(0, 30)));
      }

      this.showProgress(100, 'Selesai!');
      this.showToast('✅ Backup berhasil diupload', 'success');
      document.getElementById('restore-modal')?.classList.add('hidden');
      await this.loadBackups();
    } catch (error) {
      this.showToast('Gagal upload backup: ' + error.message, 'error');
    } finally {
      this.isProcessing = false;
      setTimeout(() => this.hideProgress(), 1500);
    }
  }

  async restoreBackup(id) {
    const confirmed = await this.confirm(
      '⚠️ Restore akan menimpa semua data saat ini. Apakah Anda yakin ingin melanjutkan?',
      'Konfirmasi Restore'
    );
    if (!confirmed) return;

    this.showProgress(10, 'Memproses restore...');

    try {
      if (typeof BackupService !== 'undefined' && BackupService.restoreBackup) {
        await BackupService.restoreBackup(id);
      } else {
        // Local restore from localStorage
        const backups = JSON.parse(localStorage.getItem('asd_backups') || '[]');
        const backup = backups.find(b => b.id === id);
        if (backup?.data?.localStorage) {
          Object.entries(backup.data.localStorage).forEach(([k, v]) => localStorage.setItem(k, v));
        }
      }
      this.showProgress(100, 'Selesai!');
      this.showToast('✅ Data berhasil direstore. Memuat ulang...', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      this.showToast('Gagal restore: ' + error.message, 'error');
      this.hideProgress();
    }
  }

  downloadBackup(id) {
    const backup = this.backups.find(b => b.id === id);
    if (!backup) return;

    if (backup.fileUrl || backup.url) {
      window.open(backup.fileUrl || backup.url, '_blank');
    } else if (backup.data) {
      const blob = new Blob([JSON.stringify(backup.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (typeof BackupService !== 'undefined' && BackupService.downloadBackup) {
      BackupService.downloadBackup(id);
    }
  }

  async deleteBackup(id) {
    const confirmed = await this.confirm('Hapus backup ini secara permanen?', 'Konfirmasi Hapus');
    if (!confirmed) return;

    try {
      if (typeof BackupService !== 'undefined' && BackupService.deleteBackup) {
        await BackupService.deleteBackup(id);
      } else {
        const backups = JSON.parse(localStorage.getItem('asd_backups') || '[]');
        localStorage.setItem('asd_backups', JSON.stringify(backups.filter(b => b.id !== id)));
      }
      this.showToast('Backup dihapus', 'success');
      await this.loadBackups();
    } catch (error) {
      this.showToast('Gagal menghapus backup', 'error');
    }
  }

  toggleAutoBackup(enabled) {
    this.autoBackupEnabled = enabled;
    document.getElementById('auto-backup-options').style.display = enabled ? 'flex' : 'none';
    this.savePreferences();

    if (typeof BackupService !== 'undefined' && BackupService.scheduleAutoBackup) {
      BackupService.scheduleAutoBackup(enabled);
    }

    this.updateStats();
    this.showToast(`Backup otomatis ${enabled ? 'diaktifkan ✅' : 'dinonaktifkan ❌'}`, enabled ? 'success' : 'info');
  }

  showProgress(percent, text) {
    const container = document.getElementById('backup-progress');
    const bar = document.getElementById('backup-progress-bar');
    const textEl = document.getElementById('backup-progress-text');
    if (container) container.classList.remove('hidden');
    if (bar) bar.style.width = percent + '%';
    if (textEl) textEl.textContent = text || `${percent}%`;
  }

  hideProgress() {
    const container = document.getElementById('backup-progress');
    if (container) container.classList.add('hidden');
  }

  // Helpers
  formatDateTime(d) { try { return new Date(d).toLocaleString('id-ID'); } catch { return '-'; } }
  formatSize(b) { if (!b) return '0 B'; return b < 1024 ? b+' B' : b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB'; }
  formatRelativeTime(d) { try { const s = Math.floor((Date.now()-new Date(d).getTime())/1000); if (s<60) return 'Baru saja'; if (s<3600) return Math.floor(s/60)+' menit'; if (s<86400) return Math.floor(s/3600)+' jam'; return Math.floor(s/86400)+' hari'; } catch { return '-'; } }
  escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
  getApiUrl() { return (typeof APP_CONFIG !== 'undefined') ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : ''; }
  showToast(m, t) { if (typeof Toast !== 'undefined') Toast.show(m, t); else if (typeof NotificationService !== 'undefined') NotificationService.show(m, t); }
  confirm(m, t) { return new Promise(r => { if (typeof NotificationService !== 'undefined' && NotificationService.confirm) { NotificationService.confirm(m, t).then(r); } else { r(window.confirm(m)); } }); }

  bindEvents() {
    // Quick action cards
    document.getElementById('btn-create-backup-card')?.addEventListener('click', () => this.createBackup());
    document.getElementById('btn-create-first-backup')?.addEventListener('click', () => this.createBackup());
    document.getElementById('btn-upload-backup-card')?.addEventListener('click', () => document.getElementById('restore-modal').classList.remove('hidden'));
    document.getElementById('btn-download-all-card')?.addEventListener('click', () => {
      if (typeof BackupService !== 'undefined' && BackupService.downloadBackup) {
        BackupService.downloadBackup('all');
      } else if (typeof api !== 'undefined') {
        api.get('export.all').then(r => {
          const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `full-export-${new Date().toISOString().slice(0,10)}.json`;
          link.click();
          URL.revokeObjectURL(url);
        });
      }
    });

    // Auto backup toggle
    document.getElementById('auto-backup-toggle')?.addEventListener('change', (e) => this.toggleAutoBackup(e.target.checked));

    // Auto backup options
    document.getElementById('backup-frequency')?.addEventListener('change', (e) => { this.autoBackupInterval = e.target.value; this.savePreferences(); });
    document.getElementById('backup-time')?.addEventListener('change', (e) => { this.autoBackupTime = e.target.value; this.savePreferences(); });

    // Restore modal
    document.getElementById('btn-close-restore-modal')?.addEventListener('click', () => document.getElementById('restore-modal').classList.add('hidden'));
    document.getElementById('btn-cancel-restore')?.addEventListener('click', () => document.getElementById('restore-modal').classList.add('hidden'));
    document.getElementById('restore-modal')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden'); });

    // Restore upload zone
    const restoreZone = document.getElementById('restore-upload-zone');
    const fileInput = document.getElementById('backup-file-input');
    restoreZone?.addEventListener('click', () => fileInput?.click());
    restoreZone?.addEventListener('dragover', (e) => { e.preventDefault(); restoreZone.classList.add('upload-zone--dragover'); });
    restoreZone?.addEventListener('dragleave', () => restoreZone.classList.remove('upload-zone--dragover'));
    restoreZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      restoreZone.classList.remove('upload-zone--dragover');
      const file = e.dataTransfer.files[0];
      if (file) {
        document.getElementById('restore-file-info').classList.remove('hidden');
        document.getElementById('restore-file-info').innerHTML = `<strong>${file.name}</strong> (${this.formatSize(file.size)})`;
        document.getElementById('btn-confirm-restore').disabled = false;
        fileInput.files = e.dataTransfer.files;
      }
    });
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        document.getElementById('restore-file-info').classList.remove('hidden');
        document.getElementById('restore-file-info').innerHTML = `<strong>${file.name}</strong> (${this.formatSize(file.size)})`;
        document.getElementById('btn-confirm-restore').disabled = false;
      }
    });
    document.getElementById('btn-confirm-restore')?.addEventListener('click', () => {
      const file = fileInput?.files?.[0];
      if (file) this.uploadBackup(file);
    });
  }

  destroy() {}
}

// Global handlers
window._restoreBackup = async (id) => {
  const page = document.querySelector('.settings-content')?._instance;
  if (page && page.restoreBackup) {
    await page.restoreBackup(id);
  } else {
    // Fallback
    if (typeof BackupService !== 'undefined' && BackupService.restoreBackup) {
      await BackupService.restoreBackup(id);
    }
  }
};
window._downloadBackup = (id) => {
  const page = document.querySelector('.settings-content')?._instance;
  if (page && page.downloadBackup) {
    page.downloadBackup(id);
  } else if (typeof BackupService !== 'undefined' && BackupService.downloadBackup) {
    BackupService.downloadBackup(id);
  }
};
window._deleteBackup = async (id) => {
  const page = document.querySelector('.settings-content')?._instance;
  if (page && page.deleteBackup) {
    await page.deleteBackup(id);
  } else if (typeof BackupService !== 'undefined' && BackupService.deleteBackup) {
    const confirmed = await (typeof NotificationService !== 'undefined' && NotificationService.confirm ? NotificationService.confirm('Hapus backup ini?') : Promise.resolve(window.confirm('Hapus backup ini?')));
    if (confirmed) {
      await BackupService.deleteBackup(id);
      if (page && page.loadBackups) page.loadBackups();
    }
  }
};

const BackupSettingsComponent = (props) => {
  const page = new BackupSettingsPage();
  const container = document.createElement('div');
  container.className = 'settings-content';
  container._instance = page;
  page.render(container);
  return container;
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BackupSettingsPage, BackupSettingsComponent };
}
