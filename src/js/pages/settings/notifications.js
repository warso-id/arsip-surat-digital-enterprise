/**
 * NOTIFICATION SETTINGS PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class NotificationSettingsPage {
  constructor() {
    this.container = null;
    this.settings = {
      email: { enabled: false, address: '' },
      telegram: { enabled: false, chatId: '' },
      push: { enabled: false },
      inApp: { enabled: true },
      sound: { enabled: true }
    };
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
          <h2 class="settings-section__title">Notifikasi</h2>
          <p class="settings-section__description">
            Kelola preferensi notifikasi
          </p>
          
          <!-- Email Notifications -->
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Notifikasi Email</div>
                <div class="settings-card__label-description">
                  Terima notifikasi melalui email
                </div>
              </div>
              <div class="settings-card__action">
                <div class="form-switch">
                  <input type="checkbox" class="form-switch__input" id="email-toggle" ${this.settings.email.enabled ? 'checked' : ''}>
                  <div class="form-switch__track"></div>
                </div>
              </div>
            </div>
            <div class="settings-card__row" id="email-config" style="display:${this.settings.email.enabled ? 'flex' : 'none'}">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Alamat Email</div>
              </div>
              <div class="settings-card__action" style="flex:1">
                <input type="email" class="form-input" id="email-address" 
                       value="${this.settings.email.address || ''}" 
                       placeholder="email@example.com">
              </div>
            </div>
          </div>
          
          <!-- Telegram Notifications -->
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Notifikasi Telegram</div>
                <div class="settings-card__label-description">
                  Terima notifikasi melalui Telegram Bot
                </div>
              </div>
              <div class="settings-card__action">
                <div class="form-switch">
                  <input type="checkbox" class="form-switch__input" id="telegram-toggle" ${this.settings.telegram.enabled ? 'checked' : ''}>
                  <div class="form-switch__track"></div>
                </div>
              </div>
            </div>
            <div class="settings-card__row" id="telegram-config" style="display:${this.settings.telegram.enabled ? 'flex' : 'none'}">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Chat ID</div>
              </div>
              <div class="settings-card__action" style="flex:1">
                <input type="text" class="form-input" id="telegram-chat-id" 
                       value="${this.settings.telegram.chatId || ''}" 
                       placeholder="123456789">
              </div>
            </div>
          </div>
          
          <!-- Push Notifications -->
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Push Notifications</div>
                <div class="settings-card__label-description" id="push-status">
                  ${PushService.isSubscribed ? 'Terdaftar' : 'Tidak terdaftar'}
                </div>
              </div>
              <div class="settings-card__action">
                <button class="btn btn-sm ${PushService.isSubscribed ? 'btn-error' : 'btn-primary'}" id="btn-toggle-push">
                  ${PushService.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                </button>
              </div>
            </div>
          </div>
          
          <!-- In-App Notifications -->
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Notifikasi Dalam Aplikasi</div>
                <div class="settings-card__label-description">
                  Tampilkan notifikasi saat menggunakan aplikasi
                </div>
              </div>
              <div class="settings-card__action">
                <div class="form-switch">
                  <input type="checkbox" class="form-switch__input" id="inapp-toggle" ${this.settings.inApp.enabled ? 'checked' : ''}>
                  <div class="form-switch__track"></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Sound -->
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Suara Notifikasi</div>
                <div class="settings-card__label-description">
                  Putar suara saat notifikasi muncul
                </div>
              </div>
              <div class="settings-card__action">
                <div class="form-switch">
                  <input type="checkbox" class="form-switch__input" id="sound-toggle" ${this.settings.sound.enabled ? 'checked' : ''}>
                  <div class="form-switch__track"></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Test Notification -->
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Tes Notifikasi</div>
                <div class="settings-card__label-description">
                  Kirim notifikasi percobaan
                </div>
              </div>
              <div class="settings-card__action">
                <button class="btn btn-secondary btn-sm" id="btn-test-notification">
                  <span class="material-icons">send</span> Tes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  loadSettings() {
    try {
      const saved = localStorage.getItem('asd_notification_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch {}
  }
  
  saveSettings() {
    try {
      localStorage.setItem('asd_notification_settings', JSON.stringify(this.settings));
    } catch {}
  }
  
  async testNotification() {
    // Test in-app notification
    NotificationService.show('Ini adalah notifikasi percobaan!', 'success', {
      duration: 5000,
      action: {
        label: 'OK',
        callback: () => console.log('Notification action clicked')
      }
    });
    
    // Test push if subscribed
    if (PushService.isSubscribed) {
      await PushService.sendTest();
    }
  }
  
  async togglePush() {
    if (PushService.isSubscribed) {
      await PushService.unsubscribe();
      NotificationService.success('Push notification dinonaktifkan');
    } else {
      try {
        await PushService.subscribe();
        NotificationService.success('Push notification diaktifkan');
      } catch (error) {
        NotificationService.error('Gagal mengaktifkan push notification');
      }
    }
    
    // Refresh view
    this.render(this.container);
  }
  
  bindEvents() {
    document.getElementById('email-toggle')?.addEventListener('change', (e) => {
      this.settings.email.enabled = e.target.checked;
      document.getElementById('email-config').style.display = e.target.checked ? 'flex' : 'none';
      this.saveSettings();
    });
    
    document.getElementById('email-address')?.addEventListener('change', (e) => {
      this.settings.email.address = e.target.value;
      this.saveSettings();
    });
    
    document.getElementById('telegram-toggle')?.addEventListener('change', (e) => {
      this.settings.telegram.enabled = e.target.checked;
      document.getElementById('telegram-config').style.display = e.target.checked ? 'flex' : 'none';
      this.saveSettings();
    });
    
    document.getElementById('telegram-chat-id')?.addEventListener('change', (e) => {
      this.settings.telegram.chatId = e.target.value;
      this.saveSettings();
    });
    
    document.getElementById('btn-toggle-push')?.addEventListener('click', () => this.togglePush());
    
    document.getElementById('inapp-toggle')?.addEventListener('change', (e) => {
      this.settings.inApp.enabled = e.target.checked;
      this.saveSettings();
    });
    
    document.getElementById('sound-toggle')?.addEventListener('change', (e) => {
      this.settings.sound.enabled = e.target.checked;
      this.saveSettings();
    });
    
    document.getElementById('btn-test-notification')?.addEventListener('click', () => this.testNotification());
  }
}

const NotificationSettingsComponent = (props) => {
  const page = new NotificationSettingsPage();
  const container = document.createElement('div');
  container.className = 'settings-content';
  page.render(container);
  return container;
};
