/**
 * ============================================
 * MAINTENANCE PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL MAINTENANCE PAGE - SIAP PRODUKSI
 * Mendukung: Countdown, Progress, Status Check,
 * Notifications, Contact Info, Auto-refresh
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

const MaintenancePageComponent = (props) => {
  const container = document.createElement('div');
  container.className = 'error-page error-page--maintenance';

  // Extract props
  const estimatedTime = props?.estimatedTime || props?.estimated || '30 menit';
  const message = props?.message || 'Kami sedang meningkatkan layanan untuk pengalaman yang lebih baik.';
  const startTime = props?.startTime || new Date().toISOString();
  const maintenanceId = props?.id || 'maint-' + Date.now();
  const showProgress = props?.showProgress !== false;
  const allowNotify = props?.allowNotify !== false;
  const contactEmail = props?.contactEmail || 'support@instansi.id';
  const contactPhone = props?.contactPhone || '';

  // Parse estimated time to seconds
  let estimatedSeconds = 1800; // Default 30 minutes
  const timeMatch = String(estimatedTime).match(/(\d+)\s*(menit|jam|hari|minute|hour|day|detik|second)/i);
  if (timeMatch) {
    const value = parseInt(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    if (unit.includes('detik') || unit.includes('second')) estimatedSeconds = value;
    else if (unit.includes('menit') || unit.includes('minute')) estimatedSeconds = value * 60;
    else if (unit.includes('jam') || unit.includes('hour')) estimatedSeconds = value * 3600;
    else if (unit.includes('hari') || unit.includes('day')) estimatedSeconds = value * 86400;
  }

  const startTimestamp = new Date(startTime).getTime();
  const estimatedEndTimestamp = startTimestamp + estimatedSeconds * 1000;
  const estimatedEndTime = new Date(estimatedEndTimestamp).toLocaleString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  container.innerHTML = `
    <div class="error-page__content animate-fade-in-up">
      <!-- Maintenance Icon -->
      <div class="error-page__icon">
        <div class="maintenance-icon-wrapper">
          <span class="material-icons maintenance-icon">engineering</span>
          <div class="maintenance-gear maintenance-gear--small">
            <span class="material-icons">settings</span>
          </div>
          <div class="maintenance-gear maintenance-gear--large">
            <span class="material-icons">settings</span>
          </div>
        </div>
      </div>

      <!-- Title -->
      <h1 class="error-page__title">Sedang Dalam Pemeliharaan</h1>

      <!-- Description -->
      <p class="error-page__description">
        ${message}
      </p>

      <!-- Maintenance Info Cards -->
      <div class="error-page__info-cards">
        <div class="info-card">
          <span class="material-icons info-card__icon">schedule</span>
          <div class="info-card__content">
            <strong>Estimasi Selesai</strong>
            <p>${estimatedEndTime}</p>
            <small>≈ ${estimatedTime}</small>
          </div>
        </div>

        <div class="info-card">
          <span class="material-icons info-card__icon">update</span>
          <div class="info-card__content">
            <strong>Dimulai Sejak</strong>
            <p>${new Date(startTimestamp).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
            <small>${new Date(startTimestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</small>
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      ${showProgress ? `
        <div class="maintenance-progress">
          <div class="maintenance-progress__header">
            <span>Progress Pemeliharaan</span>
            <span id="progress-percentage">0%</span>
          </div>
          <div class="progress progress--lg">
            <div class="progress__bar progress__bar--striped progress__bar--animated" 
                 id="maintenance-progress-bar" style="width:0%"></div>
          </div>
          <div class="maintenance-progress__time">
            <span id="elapsed-time">00:00:00</span>
            <span>berlalu</span>
          </div>
        </div>
      ` : ''}

      <!-- Countdown Timer -->
      <div class="maintenance-countdown">
        <div class="countdown-label">Sisa Waktu Perkiraan</div>
        <div class="countdown-display">
          <div class="countdown-item">
            <span class="countdown-value" id="countdown-hours">00</span>
            <span class="countdown-unit">Jam</span>
          </div>
          <span class="countdown-separator">:</span>
          <div class="countdown-item">
            <span class="countdown-value" id="countdown-minutes">00</span>
            <span class="countdown-unit">Menit</span>
          </div>
          <span class="countdown-separator">:</span>
          <div class="countdown-item">
            <span class="countdown-value" id="countdown-seconds">00</span>
            <span class="countdown-unit">Detik</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="error-page__actions">
        <button class="btn btn-primary btn-lg" id="btn-check-status">
          <span class="material-icons">refresh</span>
          Periksa Status
        </button>
        <button class="btn btn-secondary" id="btn-check-now">
          <span class="material-icons">network_ping</span>
          Cek Sekarang
        </button>
      </div>

      <!-- Notification Option -->
      ${allowNotify ? `
        <div class="maintenance-notify">
          <label class="form-checkbox" style="justify-content:center">
            <input type="checkbox" class="form-checkbox__input" id="notify-when-ready" checked>
            <span class="form-checkbox__label">Beritahu saya jika sistem sudah siap</span>
          </label>
        </div>
      ` : ''}

      <!-- Status Check Result -->
      <div id="status-check-result" style="margin-top:16px;display:none"></div>

      <!-- Contact Information -->
      <div class="maintenance-contact">
        <h4>
          <span class="material-icons">contact_support</span>
          Butuh Bantuan?
        </h4>
        <p>Hubungi tim support kami:</p>
        <div class="contact-methods">
          ${contactEmail ? `
            <a href="mailto:${contactEmail}" class="contact-method">
              <span class="material-icons">email</span>
              ${contactEmail}
            </a>
          ` : ''}
          ${contactPhone ? `
            <a href="tel:${contactPhone}" class="contact-method">
              <span class="material-icons">phone</span>
              ${contactPhone}
            </a>
          ` : ''}
        </div>
      </div>

      <!-- System Info -->
      <div class="maintenance-system-info">
        <div class="maintenance-status-indicator" id="maintenance-status">
          <span class="status-dot status-dot--warning"></span>
          <span>Status: Pemeliharaan</span>
        </div>
        <div class="maintenance-id">
          <small>ID: ${maintenanceId}</small>
        </div>
      </div>

      <!-- Footer -->
      <p class="error-page__footer">
        © 2026 Arsip Surat Digital Enterprise v3.2.2
      </p>
    </div>

    <style>
      .error-page--maintenance {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 80vh;
        padding: 40px 24px;
        text-align: center;
        background: var(--md-sys-color-surface, #FDFBFF);
      }

      .error-page__content {
        max-width: 550px;
        width: 100%;
      }

      /* Maintenance Icon Animation */
      .error-page__icon {
        margin-bottom: 24px;
      }

      .maintenance-icon-wrapper {
        position: relative;
        display: inline-block;
        width: 120px;
        height: 120px;
      }

      .maintenance-icon {
        font-size: 72px;
        color: var(--md-sys-color-primary, #1976D2);
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
      }

      .maintenance-gear {
        position: absolute;
        color: var(--md-sys-color-outline-variant, #C4C6D0);
        opacity: 0.6;
      }

      .maintenance-gear--small {
        top: 10px;
        right: 10px;
        font-size: 28px;
        animation: gearSpin 4s linear infinite reverse;
      }

      .maintenance-gear--large {
        bottom: 5px;
        left: 5px;
        font-size: 40px;
        animation: gearSpin 6s linear infinite;
      }

      @keyframes gearSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .error-page__title {
        font-size: 28px;
        font-weight: 500;
        margin-bottom: 12px;
        color: var(--md-sys-color-on-surface, #1A1C1E);
      }

      .error-page__description {
        font-size: 15px;
        color: var(--md-sys-color-on-surface-variant, #44474E);
        margin-bottom: 24px;
        line-height: 1.6;
      }

      /* Info Cards */
      .error-page__info-cards {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
      }

      .info-card {
        flex: 1;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        background: var(--md-sys-color-surface-container, #F3F0F4);
        border-radius: 12px;
        text-align: left;
        border: 1px solid var(--md-sys-color-outline-variant, #C4C6D0);
      }

      .info-card__icon {
        font-size: 28px;
        color: var(--md-sys-color-primary, #1976D2);
        flex-shrink: 0;
        margin-top: 2px;
      }

      .info-card__content strong {
        display: block;
        font-size: 12px;
        color: var(--md-sys-color-on-surface-variant, #44474E);
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .info-card__content p {
        font-size: 14px;
        font-weight: 500;
        color: var(--md-sys-color-on-surface, #1A1C1E);
        margin: 0;
      }

      .info-card__content small {
        font-size: 11px;
        color: var(--md-sys-color-on-surface-variant, #44474E);
      }

      /* Progress */
      .maintenance-progress {
        background: var(--md-sys-color-surface-container, #F3F0F4);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
      }

      .maintenance-progress__header {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        margin-bottom: 8px;
      }

      .maintenance-progress__time {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: var(--md-sys-color-on-surface-variant, #44474E);
        margin-top: 8px;
        font-family: 'Roboto Mono', monospace;
      }

      /* Countdown */
      .maintenance-countdown {
        margin-bottom: 24px;
      }

      .countdown-label {
        font-size: 13px;
        color: var(--md-sys-color-on-surface-variant, #44474E);
        margin-bottom: 12px;
      }

      .countdown-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .countdown-item {
        text-align: center;
      }

      .countdown-value {
        display: block;
        font-size: 36px;
        font-weight: 700;
        font-family: 'Roboto Mono', monospace;
        color: var(--md-sys-color-primary, #1976D2);
        background: var(--md-sys-color-primary-container, #D1E4FF);
        padding: 8px 16px;
        border-radius: 12px;
        min-width: 70px;
      }

      .countdown-unit {
        display: block;
        font-size: 11px;
        color: var(--md-sys-color-on-surface-variant, #44474E);
        margin-top: 4px;
      }

      .countdown-separator {
        font-size: 24px;
        font-weight: 700;
        color: var(--md-sys-color-primary, #1976D2);
        margin-bottom: 20px;
      }

      .error-page__actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 20px;
      }

      /* Notification */
      .maintenance-notify {
        margin-bottom: 20px;
      }

      /* Contact */
      .maintenance-contact {
        background: var(--md-sys-color-surface-container, #F3F0F4);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        text-align: left;
      }

      .maintenance-contact h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .maintenance-contact p {
        font-size: 13px;
        color: var(--md-sys-color-on-surface-variant, #44474E);
        margin-bottom: 8px;
      }

      .contact-methods {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .contact-method {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--md-sys-color-primary, #1976D2);
        text-decoration: none;
        padding: 8px 12px;
        border-radius: 8px;
        transition: background 0.2s;
      }

      .contact-method:hover {
        background: var(--md-sys-color-surface-container-highest, #E6E4EB);
      }

      .contact-method .material-icons {
        font-size: 18px;
      }

      /* System Info */
      .maintenance-system-info {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin-bottom: 16px;
      }

      .maintenance-status-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #E65100;
      }

      .status-dot--warning {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #FF9800;
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      .maintenance-id {
        font-size: 10px;
        color: var(--md-sys-color-outline, #74777F);
        font-family: 'Roboto Mono', monospace;
      }

      .error-page__footer {
        font-size: 12px;
        color: var(--md-sys-color-outline, #74777F);
      }

      /* Dark mode */
      [data-theme="dark"] .maintenance-icon-wrapper .maintenance-gear {
        color: var(--md-sys-color-outline-variant, #44474E);
      }

      /* Responsive */
      @media (max-width: 600px) {
        .error-page__info-cards {
          flex-direction: column;
        }
        .countdown-value {
          font-size: 28px;
          min-width: 55px;
          padding: 6px 12px;
        }
        .maintenance-icon {
          font-size: 56px;
        }
        .maintenance-icon-wrapper {
          width: 100px;
          height: 100px;
        }
      }
    </style>
  `;

  // Start timers
  let countdownInterval;
  let progressInterval;
  let autoCheckInterval;
  let notificationInterval;

  setTimeout(() => {
    // Countdown timer
    function updateCountdown() {
      const now = Date.now();
      const remaining = Math.max(0, estimatedEndTimestamp - now);
      const elapsed = Math.max(0, now - startTimestamp);

      // Update countdown
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      const hoursEl = document.getElementById('countdown-hours');
      const minutesEl = document.getElementById('countdown-minutes');
      const secondsEl = document.getElementById('countdown-seconds');

      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
      if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');

      // Update progress bar
      if (showProgress) {
        const totalDuration = estimatedSeconds * 1000;
        const progressPercent = totalDuration > 0 ? Math.min(100, Math.round((elapsed / totalDuration) * 100)) : 0;
        const progressBar = document.getElementById('maintenance-progress-bar');
        const progressText = document.getElementById('progress-percentage');
        if (progressBar) progressBar.style.width = progressPercent + '%';
        if (progressText) progressText.textContent = progressPercent + '%';

        // Update elapsed time
        const elapsedHours = Math.floor(elapsed / 3600000);
        const elapsedMinutes = Math.floor((elapsed % 3600000) / 60000);
        const elapsedSeconds = Math.floor((elapsed % 60000) / 1000);
        const elapsedEl = document.getElementById('elapsed-time');
        if (elapsedEl) {
          elapsedEl.textContent = `${String(elapsedHours).padStart(2, '0')}:${String(elapsedMinutes).padStart(2, '0')}:${String(elapsedSeconds).padStart(2, '0')}`;
        }
      }

      // If countdown finished
      if (remaining <= 0) {
        stopAllTimers();
        const statusEl = document.getElementById('maintenance-status');
        if (statusEl) {
          statusEl.innerHTML = '<span class="status-dot status-dot--success"></span><span>Status: Siap</span>';
          statusEl.style.color = '#2E7D32';
          statusEl.querySelector('.status-dot').style.background = '#4CAF50';
        }
      }
    }

    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);

    // Auto-check server status periodically
    autoCheckInterval = setInterval(checkServerStatus, 30000);

    // Check server status button
    container.querySelector('#btn-check-status')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-check-status');
      if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }

      const isReady = await checkServerStatus(true);
      
      if (isReady) {
        showToast('✅ Sistem sudah siap! Memuat ulang...', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast('Sistem masih dalam pemeliharaan', 'warning');
        if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
      }
    });

    // Check now button
    container.querySelector('#btn-check-now')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-check-now');
      if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }

      const isReady = await checkServerStatus(true);
      
      if (isReady) {
        showToast('✅ Sistem sudah siap! Memuat ulang...', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast('Sistem masih dalam pemeliharaan', 'warning');
        if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
      }
    });

    // Notification setup
    if (allowNotify && document.getElementById('notify-when-ready')?.checked) {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    // Initial check
    checkServerStatus();
  }, 100);

  async function checkServerStatus(showResult = false) {
    const resultEl = document.getElementById('status-check-result');
    
    try {
      const apiUrl = (typeof APP_CONFIG !== 'undefined') ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : '';
      if (!apiUrl) {
        if (showResult && resultEl) {
          resultEl.style.display = 'block';
          resultEl.innerHTML = '<div class="alert alert-warning">API URL tidak dikonfigurasi</div>';
        }
        return false;
      }

      const response = await fetch(apiUrl + '?action=ping');
      const data = await response.json();

      if (data?.status === 'success') {
        if (showResult && resultEl) {
          resultEl.style.display = 'block';
          resultEl.innerHTML = '<div class="alert alert-success">✅ Sistem sudah siap digunakan!</div>';
        }

        // Send notification if enabled
        if (document.getElementById('notify-when-ready')?.checked) {
          sendReadyNotification();
        }

        stopAllTimers();
        return true;
      } else {
        if (showResult && resultEl) {
          resultEl.style.display = 'block';
          resultEl.innerHTML = '<div class="alert alert-warning">⏳ Sistem masih dalam pemeliharaan</div>';
        }
        return false;
      }
    } catch (error) {
      if (showResult && resultEl) {
        resultEl.style.display = 'block';
        resultEl.innerHTML = '<div class="alert alert-error">❌ Tidak dapat terhubung ke server</div>';
      }
      return false;
    }
  }

  function sendReadyNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Arsip Surat Digital Enterprise', {
        body: 'Sistem sudah siap digunakan kembali!',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%231976D2"/><text x="50" y="65" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="50" fill="white">AS</text></svg>'
      });
    }

    // Also try service worker notification
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title: 'Arsip Surat Digital Enterprise',
        body: 'Sistem sudah siap digunakan kembali!'
      });
    }
  }

  function stopAllTimers() {
    if (countdownInterval) clearInterval(countdownInterval);
    if (progressInterval) clearInterval(progressInterval);
    if (autoCheckInterval) clearInterval(autoCheckInterval);
    if (notificationInterval) clearInterval(notificationInterval);
  }

  function showToast(message, type) {
    if (typeof Toast !== 'undefined') Toast.show(message, type);
    else if (typeof NotificationService !== 'undefined') NotificationService.show(message, type);
  }

  // Cleanup on destroy
  container.addEventListener('destroy', () => {
    stopAllTimers();
  });

  return container;
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MaintenancePageComponent };
}
