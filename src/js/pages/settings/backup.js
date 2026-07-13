/**
 * BACKUP SETTINGS PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class BackupSettingsPage {
  constructor() {
    this.container = null;
    this.backups = [];
    this.autoBackupEnabled = false;
  }
  
  async render(container) {
    this.container = container;
    this.container.innerHTML = this.getTemplate();
    await this.loadBackups();
    this.bindEvents();
  }
  
  getTemplate() {
    return `
      <div class="settings-content">
        <div class="settings-section">
          <h2 class="settings-section__title">Backup & Restore</h2>
          <p class="settings-section__description">
            Kelola backup data sistem
          </p>
          
          <!-- Create Backup -->
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Buat Backup Baru</div>
                <div class="settings-card__label-description">
                  Backup seluruh data surat, disposisi, dan pengaturan
                </div>
              </div>
              <div class="settings-card__action">
                <button class="btn btn-primary btn-sm" id="btn-create-backup">
                  <span class="material-icons">backup</span> Backup Sekarang
                </button>
              </div>
            </div>
          </div>
          
          <!-- Auto Backup -->
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Backup Otomatis</div>
                <div class="settings-card__label-description">
                  Backup data secara otomatis setiap hari
                </div>
              </div>
              <div class="settings-card__action">
                <div class="form-switch">
                  <input type="checkbox" class="form-switch__input" id="auto-backup-toggle" ${this.autoBackupEnabled ? 'checked' : ''}>
                  <div class="form-switch__track"></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Upload Backup -->
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Upload Backup</div>
                <div class="settings-card__label-description">
                  Restore dari file backup yang tersimpan
                </div>
              </div>
              <div class="settings-card__action">
                <button class="btn btn-secondary btn-sm" id="btn-upload-backup">
                  <span class="material-icons">upload</span> Upload
                </button>
                <input type="file" id="backup-file-input" accept=".json" style="display:none">
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
          </div>
          
          <!-- Backup List -->
          <div class="backup-list" id="backup-list" style="margin-top:24px">
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
          </div>
        </div>
      </div>
    `;
  }
  
  async loadBackups() {
    try {
      this.backups = await BackupService.getBackups();
      this.renderBackups();
      this.updateStats();
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  }
  
  renderBackups() {
    const list = document.getElementById('backup-list');
    if (!list) return;
    
    if (this.backups.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <span class="material-icons">backup</span>
          <p>Belum ada backup</p>
        </div>
      `;
      return;
    }
    
    list.innerHTML = this.backups.map(backup => `
      <div class="backup-item">
        <div class="backup-item__icon">
          <span class="material-icons">backup</span>
        </div>
        <div class="backup-item__info">
          <div class="backup-item__name">${backup.description || 'Backup'}</div>
          <div class="backup-item__meta">
            <span>${Formatters.dateTime(backup.timestamp)}</span>
            <span>v${backup.version || '3.2.2'}</span>
          </div>
        </div>
        <div class="backup-item__size">${FileService.formatSize(backup.size || 0)}</div>
        <div class="backup-item__actions">
          <button class="btn-icon btn-icon-sm" onclick="window._restoreBackup('${backup.id}')" title="Restore">
            <span class="material-icons">restore</span>
          </button>
          <button class="btn-icon btn-icon-sm" onclick="window._downloadBackup('${backup.id}')" title="Download">
            <span class="material-icons">download</span>
          </button>
          <button class="btn-icon btn-icon-sm" onclick="window._deleteBackup('${backup.id}')" title="Hapus">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
    `).join('');
  }
  
  updateStats() {
    const stats = BackupService.getStats();
    
    document.getElementById('stat-total-backups').textContent = stats.totalBackups;
    document.getElementById('stat-total-size').textContent = stats.totalSize;
    document.getElementById('stat-last-backup').textContent = stats.lastBackup 
      ? Formatters.relativeTime(stats.lastBackup) 
      : 'Belum pernah';
  }
  
  async createBackup() {
    try {
      await BackupService.createBackup({
        description: `Backup Manual ${new Date().toLocaleDateString('id-ID')}`
      });
      this.loadBackups();
    } catch (error) {
      NotificationService.error('Gagal membuat backup');
    }
  }
  
  async uploadBackup(file) {
    try {
      await BackupService.uploadBackup(file);
      this.loadBackups();
    } catch (error) {
      // Error handled in service
    }
  }
  
  bindEvents() {
    document.getElementById('btn-create-backup')?.addEventListener('click', () => this.createBackup());
    
    document.getElementById('btn-upload-backup')?.addEventListener('click', () => {
      document.getElementById('backup-file-input').click();
    });
    
    document.getElementById('backup-file-input')?.addEventListener('change', (e) => {
      if (e.target.files[0]) {
        this.uploadBackup(e.target.files[0]);
        e.target.value = '';
      }
    });
    
    document.getElementById('auto-backup-toggle')?.addEventListener('change', async (e) => {
      this.autoBackupEnabled = e.target.checked;
      await BackupService.scheduleAutoBackup(this.autoBackupEnabled);
      NotificationService.success(
        `Backup otomatis ${this.autoBackupEnabled ? 'diaktifkan' : 'dinonaktifkan'}`
      );
    });
  }
}

window._restoreBackup = async (id) => {
  await BackupService.restoreBackup(id);
};
window._downloadBackup = (id) => {
  BackupService.downloadBackup(id);
};
window._deleteBackup = async (id) => {
  const confirmed = await NotificationService.confirm('Hapus backup ini?');
  if (confirmed) {
    await BackupService.deleteBackup(id);
    const page = document.querySelector('.settings-content');
    if (page?._instance) page._instance.loadBackups();
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
