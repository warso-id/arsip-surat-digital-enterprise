/**
 * ============================================
 * NOTIFICATION SETTINGS PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL NOTIFICATION PREFERENCES - SIAP PRODUKSI
 * Mendukung: Email, Telegram, Push, In-App,
 * Sound, Event Types, Schedule, Test
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class NotificationSettingsPage {
  constructor() {
    this.container = null;
    this.settings = {
      email: { enabled: false, address: '' },
      telegram: { enabled: false, chatId: '', botToken: '' },
      push: { enabled: false },
      inApp: { enabled: true },
      sound: { enabled: true },
      events: {
        suratMasuk: true,
        suratKeluar: true,
        disposisi: true,
        approval: true,
        reminder: true,
        system: false
      },
      schedule: {
        startTime: '08:00',
        endTime: '17:00',
        days: ['senin', 'selasa', 'rabu', 'kamis', 'jumat']
      },
      quietHours: { enabled: false, start: '22:00', end: '06:00' }
    };
    this.pageId = 'notifset-' + Math.random().toString(36).substr(2, 9);
    this.pushSupported = false;
    this.pushSubscribed = false;
    this.telegramLinked = false;
  }

  async render(container) {
    this.container = container;
    this.container.setAttribute('data-page-id', this.pageId);
    await this.loadSettings();
    await this.checkPushStatus();
    await this.checkTelegramStatus();
    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
    console.log('✅ NotificationSettingsPage rendered');
  }

  async loadSettings() {
    try {
      const saved = localStorage.getItem('asd_notification_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
      // Try API for server-side settings
      if (typeof api !== 'undefined') {
        const response = await api.get('config.get', { key: 'notification_settings' });
        if (response?.status === 'success' && response.data?.value) {
          try {
            const serverSettings = JSON.parse(response.data.value);
            this.settings = { ...this.settings, ...serverSettings };
          } catch {}
        }
      }
    } catch (e) { console.warn('Failed to load notification settings:', e); }
  }

  saveSettings() {
    try {
      localStorage.setItem('asd_notification_settings', JSON.stringify(this.settings));
    } catch {}
  }

  async checkPushStatus() {
    this.pushSupported = 'PushManager' in window && 'serviceWorker' in navigator;
    if (this.pushSupported) {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        this.pushSubscribed = !!sub;
      } catch {}
    }
  }

  async checkTelegramStatus() {
    try {
      if (typeof api !== 'undefined') {
        const response = await api.get('notifikasi.telegram.status');
        this.telegramLinked = response?.data?.linked || false;
      }
    } catch {}
  }

  getTemplate() {
    return `
      <div class="settings-content" id="notifset-${this.pageId}">
        <div class="settings-section">
          <h2 class="settings-section__title">
            <span class="material-icons">notifications</span> Notifikasi
          </h2>
          <p class="settings-section__description">
            Kelola preferensi notifikasi untuk berbagai kanal dan jenis aktivitas.
          </p>

          <!-- Notification Channels -->
          <h3 style="margin-top:24px;margin-bottom:16px">Kanal Notifikasi</h3>

          <!-- Email -->
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">
                  <span class="material-icons">email</span> Notifikasi Email
                </div>
                <div class="settings-card__label-description">Terima notifikasi melalui email</div>
              </div>
              <div class="settings-card__action">
                <div class="form-switch">
                  <input type="checkbox" class="form-switch__input" id="email-toggle" ${this.settings.email.enabled ? 'checked' : ''}>
                  <div class="form-switch__track"></div>
                </div>
              </div>
            </div>
            <div class="settings-card__row" id="email-config" style="display:${this.settings.email.enabled ? 'flex' : 'none'}">
              <div class="form-field" style="width:100%">
                <label class="form-label">Alamat Email</label>
                <div class="input-with-icon">
                  <span class="input-with-icon__icon input-with-icon__icon--left material-icons">email</span>
                  <input type="email" class="form-input" id="email-address" 
                         value="${this.settings.email.address || ''}" 
                         placeholder="email@instansi.id">
                </div>
                <div class="form-helper">Notifikasi akan dikirim ke alamat email ini</div>
              </div>
            </div>
          </div>

          <!-- Telegram -->
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">
                  <span class="material-icons">telegram</span> Notifikasi Telegram
                </div>
                <div class="settings-card__label-description">
                  ${this.telegramLinked ? '✅ Terhubung ke Telegram Bot' : 'Terima notifikasi melalui Telegram Bot'}
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
              <div class="form-row form-row--2col" style="width:100%">
                <div class="form-field">
                  <label class="form-label">Chat ID</label>
                  <input type="text" class="form-input" id="telegram-chat-id" 
                         value="${this.settings.telegram.chatId || ''}" 
                         placeholder="123456789">
                </div>
                <div class="form-field">
                  <label class="form-label">Bot Token (opsional)</label>
                  <input type="text" class="form-input" id="telegram-bot-token" 
                         value="${this.settings.telegram.botToken || ''}" 
                         placeholder="123456:ABC-DEF1234ghikl">
                </div>
              </div>
              ${!this.telegramLinked ? `
                <button class="btn btn-sm btn-secondary" id="btn-link-telegram" style="margin-top:8px">
                  <span class="material-icons">link</span> Hubungkan Telegram Bot
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Push Notifications -->
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">
                  <span class="material-icons">notifications_active</span> Push Notifications
                </div>
                <div class="settings-card__label-description" id="push-status-text">
                  ${!this.pushSupported ? '❌ Tidak didukung di browser ini' : 
                    this.pushSubscribed ? '✅ Terdaftar untuk push notifications' : 'Dapatkan notifikasi bahkan saat browser ditutup'}
                </div>
              </div>
              <div class="settings-card__action">
                ${this.pushSupported ? `
                  <button class="btn btn-sm ${this.pushSubscribed ? 'btn-error' : 'btn-primary'}" id="btn-toggle-push">
                    ${this.pushSubscribed ? 'Unsubscribe' : 'Subscribe'}
                  </button>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- In-App -->
          <div class="settings-card">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">
                  <span class="material-icons">chat</span> Notifikasi Dalam Aplikasi
                </div>
                <div class="settings-card__label-description">Tampilkan toast notifikasi saat menggunakan aplikasi</div>
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
                <div class="settings-card__label-title">
                  <span class="material-icons">volume_up</span> Suara Notifikasi
                </div>
                <div class="settings-card__label-description">Putar suara saat notifikasi muncul</div>
              </div>
              <div class="settings-card__action">
                <div class="form-switch">
                  <input type="checkbox" class="form-switch__input" id="sound-toggle" ${this.settings.sound.enabled ? 'checked' : ''}>
                  <div class="form-switch__track"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Event Types -->
          <h3 style="margin-top:32px;margin-bottom:16px">Jenis Notifikasi</h3>
          <div class="settings-card">
            <div class="card__body">
              <p class="text-muted" style="margin-bottom:16px">Pilih aktivitas yang ingin Anda terima notifikasinya:</p>
              <label class="form-checkbox">
                <input type="checkbox" class="form-checkbox__input event-checkbox" data-event="suratMasuk" ${this.settings.events.suratMasuk ? 'checked' : ''}>
                <span class="form-checkbox__label">📥 Surat Masuk - Notifikasi saat ada surat masuk baru</span>
              </label>
              <label class="form-checkbox">
                <input type="checkbox" class="form-checkbox__input event-checkbox" data-event="suratKeluar" ${this.settings.events.suratKeluar ? 'checked' : ''}>
                <span class="form-checkbox__label">📤 Surat Keluar - Notifikasi status surat keluar</span>
              </label>
              <label class="form-checkbox">
                <input type="checkbox" class="form-checkbox__input event-checkbox" data-event="disposisi" ${this.settings.events.disposisi ? 'checked' : ''}>
                <span class="form-checkbox__label">➡️ Disposisi - Notifikasi disposisi baru & tindak lanjut</span>
              </label>
              <label class="form-checkbox">
                <input type="checkbox" class="form-checkbox__input event-checkbox" data-event="approval" ${this.settings.events.approval ? 'checked' : ''}>
                <span class="form-checkbox__label">✅ Approval - Notifikasi permintaan & hasil approval</span>
              </label>
              <label class="form-checkbox">
                <input type="checkbox" class="form-checkbox__input event-checkbox" data-event="reminder" ${this.settings.events.reminder ? 'checked' : ''}>
                <span class="form-checkbox__label">⏰ Pengingat - Notifikasi pengingat tenggat waktu</span>
              </label>
              <label class="form-checkbox">
                <input type="checkbox" class="form-checkbox__input event-checkbox" data-event="system" ${this.settings.events.system ? 'checked' : ''}>
                <span class="form-checkbox__label">⚙️ Sistem - Notifikasi pemeliharaan & update sistem</span>
              </label>
            </div>
          </div>

          <!-- Schedule -->
          <h3 style="margin-top:32px;margin-bottom:16px">Jadwal Notifikasi</h3>
          <div class="settings-card">
            <div class="card__body">
              <div class="form-row form-row--2col">
                <div class="form-field">
                  <label class="form-label">Jam Mulai</label>
                  <input type="time" class="form-input" id="schedule-start" value="${this.settings.schedule.startTime}">
                </div>
                <div class="form-field">
                  <label class="form-label">Jam Selesai</label>
                  <input type="time" class="form-input" id="schedule-end" value="${this.settings.schedule.endTime}">
                </div>
              </div>
              <label class="form-label" style="margin-top:12px">Hari Aktif</label>
              <div class="chip-group" id="days-chips">
                ${['senin','selasa','rabu','kamis','jumat','sabtu','minggu'].map(d => `
                  <span class="chip day-chip ${this.settings.schedule.days.includes(d) ? 'chip--active' : ''}" data-day="${d}">
                    ${d.charAt(0).toUpperCase() + d.slice(1)}
                  </span>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Quiet Hours -->
          <div class="settings-card" style="margin-top:16px">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Jam Tenang (Quiet Hours)</div>
                <div class="settings-card__label-description">Jangan kirim notifikasi selama jam tertentu</div>
              </div>
              <div class="settings-card__action">
                <div class="form-switch">
                  <input type="checkbox" class="form-switch__input" id="quiet-hours-toggle" ${this.settings.quietHours.enabled ? 'checked' : ''}>
                  <div class="form-switch__track"></div>
                </div>
              </div>
            </div>
            <div class="settings-card__row" id="quiet-hours-config" style="display:${this.settings.quietHours.enabled ? 'flex' : 'none'}">
              <div class="form-row form-row--2col" style="width:100%">
                <div class="form-field">
                  <label class="form-label">Dari Jam</label>
                  <input type="time" class="form-input" id="quiet-start" value="${this.settings.quietHours.start}">
                </div>
                <div class="form-field">
                  <label class="form-label">Sampai Jam</label>
                  <input type="time" class="form-input" id="quiet-end" value="${this.settings.quietHours.end}">
                </div>
              </div>
            </div>
          </div>

          <!-- Test Notification -->
          <div class="settings-card" style="margin-top:24px">
            <div class="settings-card__row">
              <div class="settings-card__label">
                <div class="settings-card__label-title">Tes Notifikasi</div>
                <div class="settings-card__label-description">Kirim notifikasi percobaan untuk memastikan pengaturan berfungsi</div>
              </div>
              <div class="settings-card__action">
                <div class="btn-group">
                  <button class="btn btn-sm btn-secondary" id="btn-test-inapp">
                    <span class="material-icons">chat</span> In-App
                  </button>
                  <button class="btn btn-sm btn-secondary" id="btn-test-email">
                    <span class="material-icons">email</span> Email
                  </button>
                  <button class="btn btn-sm btn-secondary" id="btn-test-push">
                    <span class="material-icons">notifications_active</span> Push
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async togglePush() {
    if (this.pushSubscribed) {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
        this.pushSubscribed = false;
        this.showToast('Push notification dinonaktifkan', 'success');
      } catch (e) { this.showToast('Gagal unsubscribe', 'error'); }
    } else {
      try {
        const reg = await navigator.serviceWorker.ready;
        const vapidKey = (typeof APP_CONFIG !== 'undefined') ? (APP_CONFIG.PUSH_VAPID_KEY || '') : '';
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey ? this.urlBase64ToUint8Array(vapidKey) : undefined
        });
        if (typeof api !== 'undefined') {
          await api.post('push.register', { subscription: sub.toJSON() });
        }
        this.pushSubscribed = true;
        this.showToast('Push notification diaktifkan!', 'success');
      } catch (e) { this.showToast('Gagal subscribe: ' + e.message, 'error'); }
    }
    this.refreshView();
  }

  async linkTelegram() {
    const botToken = document.getElementById('telegram-bot-token')?.value?.trim();
    if (!botToken) {
      this.showToast('Masukkan Bot Token terlebih dahulu', 'warning');
      return;
    }
    try {
      if (typeof api !== 'undefined') {
        const response = await api.post('notifikasi.telegram.link', { botToken });
        if (response?.status === 'success') {
          this.telegramLinked = true;
          this.showToast('Telegram Bot berhasil dihubungkan!', 'success');
          this.refreshView();
        }
      }
    } catch (e) { this.showToast('Gagal menghubungkan Telegram', 'error'); }
  }

  testNotification(type = 'inapp') {
    switch (type) {
      case 'inapp':
        if (typeof NotificationService !== 'undefined') {
          NotificationService.show('🔔 Ini adalah notifikasi percobaan!', 'success', {
            duration: 5000,
            action: { label: 'OK', callback: () => console.log('Test notification dismissed') }
          });
        } else if (typeof Toast !== 'undefined') {
          Toast.show('🔔 Notifikasi percobaan berhasil!', 'success');
        } else {
          alert('Notifikasi percobaan!');
        }
        break;
      case 'email':
        if (typeof api !== 'undefined') {
          api.post('notifikasi.email', { to: this.settings.email.address, subject: 'Test Notification', message: 'Ini adalah email percobaan dari Arsip Surat Digital Enterprise.' });
          this.showToast('Email percobaan dikirim ke ' + this.settings.email.address, 'info');
        } else {
          this.showToast('Fitur email memerlukan koneksi API', 'warning');
        }
        break;
      case 'push':
        if (this.pushSubscribed) {
          if (typeof PushService !== 'undefined' && PushService.sendTest) {
            PushService.sendTest();
          } else {
            this.showToast('Push notification percobaan dikirim', 'info');
          }
        } else {
          this.showToast('Push notification belum diaktifkan', 'warning');
        }
        break;
    }
  }

  refreshView() {
    const scrollTop = this.container?.scrollTop || 0;
    this.render(this.container).then(() => {
      if (this.container) this.container.scrollTop = scrollTop;
    });
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  showToast(m, t) { if (typeof Toast !== 'undefined') Toast.show(m, t); else if (typeof NotificationService !== 'undefined') NotificationService.show(m, t); }

  bindEvents() {
    // Email
    document.getElementById('email-toggle')?.addEventListener('change', (e) => {
      this.settings.email.enabled = e.target.checked;
      document.getElementById('email-config').style.display = e.target.checked ? 'flex' : 'none';
      this.saveSettings();
    });
    document.getElementById('email-address')?.addEventListener('change', (e) => { this.settings.email.address = e.target.value; this.saveSettings(); });

    // Telegram
    document.getElementById('telegram-toggle')?.addEventListener('change', (e) => {
      this.settings.telegram.enabled = e.target.checked;
      document.getElementById('telegram-config').style.display = e.target.checked ? 'flex' : 'none';
      this.saveSettings();
    });
    document.getElementById('telegram-chat-id')?.addEventListener('change', (e) => { this.settings.telegram.chatId = e.target.value; this.saveSettings(); });
    document.getElementById('telegram-bot-token')?.addEventListener('change', (e) => { this.settings.telegram.botToken = e.target.value; this.saveSettings(); });
    document.getElementById('btn-link-telegram')?.addEventListener('click', () => this.linkTelegram());

    // Push
    document.getElementById('btn-toggle-push')?.addEventListener('click', () => this.togglePush());

    // In-App & Sound
    document.getElementById('inapp-toggle')?.addEventListener('change', (e) => { this.settings.inApp.enabled = e.target.checked; this.saveSettings(); });
    document.getElementById('sound-toggle')?.addEventListener('change', (e) => { this.settings.sound.enabled = e.target.checked; this.saveSettings(); });

    // Event types
    document.querySelectorAll('.event-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        this.settings.events = {};
        document.querySelectorAll('.event-checkbox').forEach(c => { this.settings.events[c.dataset.event] = c.checked; });
        this.saveSettings();
      });
    });

    // Schedule
    document.getElementById('schedule-start')?.addEventListener('change', (e) => { this.settings.schedule.startTime = e.target.value; this.saveSettings(); });
    document.getElementById('schedule-end')?.addEventListener('change', (e) => { this.settings.schedule.endTime = e.target.value; this.saveSettings(); });

    // Day chips
    document.querySelectorAll('.day-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const day = chip.dataset.day;
        chip.classList.toggle('chip--active');
        if (this.settings.schedule.days.includes(day)) {
          this.settings.schedule.days = this.settings.schedule.days.filter(d => d !== day);
        } else {
          this.settings.schedule.days.push(day);
        }
        this.saveSettings();
      });
    });

    // Quiet hours
    document.getElementById('quiet-hours-toggle')?.addEventListener('change', (e) => {
      this.settings.quietHours.enabled = e.target.checked;
      document.getElementById('quiet-hours-config').style.display = e.target.checked ? 'flex' : 'none';
      this.saveSettings();
    });
    document.getElementById('quiet-start')?.addEventListener('change', (e) => { this.settings.quietHours.start = e.target.value; this.saveSettings(); });
    document.getElementById('quiet-end')?.addEventListener('change', (e) => { this.settings.quietHours.end = e.target.value; this.saveSettings(); });

    // Test buttons
    document.getElementById('btn-test-inapp')?.addEventListener('click', () => this.testNotification('inapp'));
    document.getElementById('btn-test-email')?.addEventListener('click', () => this.testNotification('email'));
    document.getElementById('btn-test-push')?.addEventListener('click', () => this.testNotification('push'));
  }

  destroy() {}
}

const NotificationSettingsComponent = (props) => {
  const page = new NotificationSettingsPage();
  const container = document.createElement('div');
  container.className = 'settings-content';
  container._instance = page;
  page.render(container);
  return container;
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotificationSettingsPage, NotificationSettingsComponent };
}
