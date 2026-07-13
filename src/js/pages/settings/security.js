/**
 * SECURITY SETTINGS PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class SecuritySettingsPage {
  constructor() {
    this.container = null;
    this.settings = {};
  }
  
  async render(container) {
    this.container = container;
    this.container.innerHTML = this.getTemplate();
    await this.loadSettings();
    this.bindEvents();
  }
  
  getTemplate() {
    return `
      <div class="settings-content">
        <div class="settings-section">
          <h2 class="settings-section__title">Keamanan</h2>
          <p class="settings-section__description">Kelola pengaturan keamanan akun dan sistem</p>
          
          <!-- Password -->
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Ubah Password</div>
                <div class="settings-card__label-description">Perbarui password akun Anda secara berkala</div>
              </div>
              <div class="settings-card__action">
                <button class="btn btn-secondary btn-sm" id="btn-change-password">
                  <span class="material-icons">lock</span> Ubah
                </button>
              </div>
            </div>
          </div>
          
          <!-- 2FA -->
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Autentikasi Dua Faktor (2FA)</div>
                <div class="settings-card__label-description" id="2fa-status">Memuat...</div>
              </div>
              <div class="settings-card__action">
                <button class="btn btn-sm" id="btn-toggle-2fa">
                  <span class="material-icons">security</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Biometric -->
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Biometric Login</div>
                <div class="settings-card__label-description" id="biometric-status">
                  Gunakan fingerprint atau face recognition untuk login
                </div>
              </div>
              <div class="settings-card__action">
                <button class="btn btn-sm" id="btn-toggle-biometric">
                  <span class="material-icons">fingerprint</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Session Management -->
          <div class="settings-card">
            <div class="settings-card__header">
              <h4>Sesi Aktif</h4>
            </div>
            <div class="settings-card__body" id="active-sessions">
              <div class="skeleton-text"></div>
              <div class="skeleton-text"></div>
            </div>
          </div>
          
          <!-- Session Timeout -->
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Timeout Sesi</div>
                <div class="settings-card__label-description">Sesi akan otomatis berakhir setelah tidak aktif</div>
              </div>
              <div class="settings-card__action">
                <select class="form-select form-select--sm" id="session-timeout" style="width:150px">
                  <option value="15">15 menit</option>
                  <option value="30">30 menit</option>
                  <option value="60" selected>1 jam</option>
                  <option value="120">2 jam</option>
                  <option value="240">4 jam</option>
                </select>
              </div>
            </div>
          </div>
          
          <!-- Login History -->
          <div class="settings-card">
            <div class="settings-card__header">
              <h4>Riwayat Login</h4>
            </div>
            <div class="settings-card__body" id="login-history">
              <div class="skeleton-text"></div>
              <div class="skeleton-text"></div>
              <div class="skeleton-text"></div>
            </div>
          </div>
          
          <!-- Danger Zone -->
          <div class="settings-section">
            <h3 class="settings-section__title" style="color:var(--md-sys-color-error)">Zona Berbahaya</h3>
            
            <div class="settings-card" style="border-color:var(--md-sys-color-error)">
              <div class="settings-card__row">
                <div class="settings-card__label">
                  <div class="settings-card__label-title">Hapus Semua Sesi</div>
                  <div class="settings-card__label-description">Keluar dari semua perangkat yang terhubung</div>
                </div>
                <div class="settings-card__action">
                  <button class="btn btn-error btn-sm" id="btn-logout-all">
                    <span class="material-icons">logout</span> Keluar Semua
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  async loadSettings() {
    try {
      // Load 2FA status
      const twoFactorResponse = await api.get('2fa.status');
      if (twoFactorResponse.status === 'success') {
        this.settings.twoFactorEnabled = twoFactorResponse.data.enabled;
        this.update2FAStatus();
      }
      
      // Load biometric status
      if (BiometricService.isSupported) {
        const bioStatus = await BiometricService.checkStatus();
        this.settings.biometricEnabled = bioStatus;
        this.updateBiometricStatus();
      }
      
      // Load active sessions
      this.loadActiveSessions();
      
      // Load login history
      this.loadLoginHistory();
      
    } catch (error) {
      console.warn('Failed to load security settings:', error);
    }
  }
  
  update2FAStatus() {
    const statusEl = document.getElementById('2fa-status');
    const btnEl = document.getElementById('btn-toggle-2fa');
    
    if (this.settings.twoFactorEnabled) {
      statusEl.textContent = '2FA aktif. Akun Anda lebih aman.';
      btnEl.innerHTML = '<span class="material-icons">shield</span> Nonaktifkan';
      btnEl.classList.add('btn-success');
    } else {
      statusEl.textContent = '2FA belum diaktifkan. Aktifkan untuk keamanan ekstra.';
      btnEl.innerHTML = '<span class="material-icons">security</span> Aktifkan';
      btnEl.classList.add('btn-primary');
    }
  }
  
  updateBiometricStatus() {
    const statusEl = document.getElementById('biometric-status');
    const btnEl = document.getElementById('btn-toggle-biometric');
    
    if (!BiometricService.isSupported) {
      statusEl.textContent = 'Biometric tidak didukung di perangkat ini';
      btnEl.disabled = true;
      return;
    }
    
    if (this.settings.biometricEnabled) {
      statusEl.textContent = `Biometric login aktif (${BiometricService.getLabel()})`;
      btnEl.innerHTML = '<span class="material-icons">fingerprint</span> Nonaktifkan';
    } else {
      statusEl.textContent = `Gunakan ${BiometricService.getLabel()} untuk login cepat`;
      btnEl.innerHTML = '<span class="material-icons">fingerprint</span> Aktifkan';
    }
  }
  
  async loadActiveSessions() {
    const container = document.getElementById('active-sessions');
    if (!container) return;
    
    try {
      const response = await api.get('session.list');
      
      if (response.status === 'success') {
        const sessions = response.data.sessions || [];
        
        if (sessions.length === 0) {
          container.innerHTML = '<p class="text-muted">Tidak ada sesi aktif lainnya</p>';
          return;
        }
        
        container.innerHTML = sessions.map(session => `
          <div class="session-item">
            <div class="session-item__info">
              <div class="session-item__device">
                <span class="material-icons">${this.getDeviceIcon(session.device)}</span>
                <span>${session.device || 'Unknown'}</span>
                ${session.isCurrent ? '<span class="badge badge-success">Saat Ini</span>' : ''}
              </div>
              <div class="session-item__meta">
                <span>IP: ${session.ip || '-'}</span>
                <span>${Formatters.relativeTime(session.lastActive)}</span>
              </div>
            </div>
            ${!session.isCurrent ? `
              <button class="btn btn-ghost btn-sm btn-error" onclick="window._revokeSession('${session.id}')">
                Hapus
              </button>
            ` : ''}
          </div>
        `).join('');
      }
    } catch (error) {
      container.innerHTML = '<p class="text-muted">Gagal memuat sesi aktif</p>';
    }
  }
  
  async loadLoginHistory() {
    const container = document.getElementById('login-history');
    if (!container) return;
    
    try {
      const activities = AuthService.getActivities(10);
      
      if (activities.length === 0) {
        container.innerHTML = '<p class="text-muted">Tidak ada riwayat login</p>';
        return;
      }
      
      container.innerHTML = activities.map(activity => `
        <div class="activity-item">
          <div class="activity-item__icon">
            <span class="material-icons">${activity.action === 'LOGIN' ? 'login' : 'logout'}</span>
          </div>
          <div class="activity-item__content">
            <div class="activity-item__title">${activity.action === 'LOGIN' ? 'Login' : 'Logout'}</div>
            <div class="activity-item__time">${Formatters.dateTime(activity.timestamp)}</div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      container.innerHTML = '<p class="text-muted">Gagal memuat riwayat login</p>';
    }
  }
  
  getDeviceIcon(device) {
    const icons = {
      'desktop': 'computer',
      'mobile': 'smartphone',
      'tablet': 'tablet',
      'unknown': 'devices'
    };
    return icons[device?.toLowerCase()] || 'devices';
  }
  
  async changePassword() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content modal-content--sm">
        <div class="modal-header">
          <h3>Ubah Password</h3>
          <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label class="form-label">Password Lama</label>
            <input type="password" class="form-input" id="old-password" placeholder="Masukkan password lama">
          </div>
          <div class="form-field">
            <label class="form-label">Password Baru</label>
            <input type="password" class="form-input" id="new-password" placeholder="Minimal 8 karakter">
          </div>
          <div class="form-field">
            <label class="form-label">Konfirmasi Password</label>
            <input type="password" class="form-input" id="confirm-password" placeholder="Ulangi password baru">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Batal</button>
          <button class="btn btn-primary" id="btn-save-password">Simpan</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#btn-save-password').addEventListener('click', async () => {
      const oldPassword = modal.querySelector('#old-password').value;
      const newPassword = modal.querySelector('#new-password').value;
      const confirmPassword = modal.querySelector('#confirm-password').value;
      
      if (!oldPassword || !newPassword) {
        NotificationService.error('Semua field harus diisi');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        NotificationService.error('Password tidak cocok');
        return;
      }
      
      try {
        await AuthService.changePassword(oldPassword, newPassword);
        modal.remove();
      } catch (error) {
        // Error already handled in AuthService
      }
    });
    
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }
  
  async toggle2FA() {
    if (this.settings.twoFactorEnabled) {
      const confirmed = await NotificationService.confirm('Nonaktifkan 2FA? Keamanan akun akan berkurang.');
      if (confirmed) {
        try {
          await api.post('2fa.disable');
          this.settings.twoFactorEnabled = false;
          this.update2FAStatus();
          NotificationService.success('2FA dinonaktifkan');
        } catch (error) {
          NotificationService.error('Gagal menonaktifkan 2FA');
        }
      }
    } else {
      router.navigate('/2fa-setup');
    }
  }
  
  async toggleBiometric() {
    if (this.settings.biometricEnabled) {
      try {
        await BiometricService.remove();
        this.settings.biometricEnabled = false;
        this.updateBiometricStatus();
      } catch (error) {
        NotificationService.error('Gagal menonaktifkan biometric');
      }
    } else {
      try {
        await BiometricService.register();
        this.settings.biometricEnabled = true;
        this.updateBiometricStatus();
      } catch (error) {
        NotificationService.error('Gagal mengaktifkan biometric');
      }
    }
  }
  
  async logoutAllSessions() {
    const confirmed = await NotificationService.confirm(
      'Keluar dari semua perangkat? Anda harus login kembali.',
      'Konfirmasi',
      { type: 'warning' }
    );
    
    if (confirmed) {
      try {
        const user = AuthService.getUser();
        await api.post('session.logout', { userId: user.id });
        NotificationService.success('Semua sesi telah dihapus');
        this.loadActiveSessions();
      } catch (error) {
        NotificationService.error('Gagal menghapus sesi');
      }
    }
  }
  
  async revokeSession(sessionId) {
    try {
      await api.post('session.revoke', { id: sessionId });
      NotificationService.success('Sesi dihapus');
      this.loadActiveSessions();
    } catch (error) {
      NotificationService.error('Gagal menghapus sesi');
    }
  }
  
  bindEvents() {
    document.getElementById('btn-change-password')?.addEventListener('click', () => this.changePassword());
    document.getElementById('btn-toggle-2fa')?.addEventListener('click', () => this.toggle2FA());
    document.getElementById('btn-toggle-biometric')?.addEventListener('click', () => this.toggleBiometric());
    document.getElementById('btn-logout-all')?.addEventListener('click', () => this.logoutAllSessions());
    document.getElementById('session-timeout')?.addEventListener('change', (e) => {
      const timeout = parseInt(e.target.value) * 60000;
      localStorage.setItem('asd_session_timeout', timeout);
      NotificationService.success('Timeout sesi diperbarui');
    });
  }
}

window._revokeSession = (id) => {
  const page = document.querySelector('.settings-content');
  if (page?._instance) page._instance.revokeSession(id);
};

const SecuritySettingsComponent = (props) => {
  const page = new SecuritySettingsPage();
  const container = document.createElement('div');
  container.className = 'settings-content';
  container._instance = page;
  page.render(container);
  return container;
};
