/**
 * ============================================
 * OFFLINE PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL OFFLINE PAGE - SIAP PRODUKSI
 * Mendukung: Connection Detection, Auto-Retry,
 * Cached Pages, Pending Actions, Diagnostics
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

const OfflinePageComponent = (props) => {
  const container = document.createElement('div');
  container.className = 'error-page error-page--offline';

  // Detect connection type
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const connectionType = connection?.type || 'unknown';
  const connectionSpeed = connection?.downlink ? `${connection.downlink} Mbps` : 'unknown';

  // Get pending sync actions
  let pendingActions = 0;
  try {
    const stored = localStorage.getItem('asd_sync_queue');
    if (stored) {
      const queue = JSON.parse(stored);
      pendingActions = Array.isArray(queue) ? queue.length : 0;
    }
  } catch (e) {}

  container.innerHTML = `
    <div class="error-page__content animate-fade-in-up">
      <!-- Offline Icon -->
      <div class="error-page__icon">
        <div class="offline-icon-wrapper">
          <span class="material-icons offline-icon">wifi_off</span>
          <div class="offline-waves">
            <span class="offline-wave offline-wave--1"></span>
            <span class="offline-wave offline-wave--2"></span>
            <span class="offline-wave offline-wave--3"></span>
          </div>
        </div>
      </div>

      <!-- Title -->
      <h1 class="error-page__title">Anda Sedang Offline</h1>

      <!-- Description -->
      <p class="error-page__description">
        Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.
      </p>

      <!-- Connection Status -->
      <div class="error-page__status" id="connection-status">
        <div class="connection-indicator">
          <span class="status-dot status-dot--offline" id="status-dot"></span>
          <span id="status-text">Mencoba menghubungkan...</span>
        </div>
        <div class="connection-attempts" id="connection-attempts" style="display:none">
          <small>Percobaan: <span id="attempt-count">0</span></small>
        </div>
      </div>

      <!-- Connection Info -->
      <div class="connection-info">
        <div class="connection-info__item">
          <span class="material-icons">network_check</span>
          <span>Tipe Koneksi: <strong>${connectionType === 'unknown' ? 'Tidak Terdeteksi' : connectionType}</strong></span>
        </div>
        <div class="connection-info__item">
          <span class="material-icons">speed</span>
          <span>Kecepatan: <strong>${connectionSpeed}</strong></span>
        </div>
        ${connection?.rtt ? `
          <div class="connection-info__item">
            <span class="material-icons">timer</span>
            <span>Latency: <strong>${connection.rtt}ms</strong></span>
          </div>
        ` : ''}
      </div>

      <!-- Pending Actions -->
      ${pendingActions > 0 ? `
        <div class="pending-actions-card">
          <div class="pending-actions-card__header">
            <span class="material-icons">sync</span>
            <span><strong>${pendingActions}</strong> perubahan menunggu sinkronisasi</span>
          </div>
          <p class="text-muted text-sm">Data akan otomatis disinkronkan saat koneksi tersedia kembali.</p>
        </div>
      ` : ''}

      <!-- Actions -->
      <div class="error-page__actions">
        <button class="btn btn-primary btn-lg" id="btn-retry-connection">
          <span class="material-icons">refresh</span>
          Coba Lagi
        </button>
        <button class="btn btn-secondary" id="btn-diagnostics">
          <span class="material-icons">troubleshoot</span>
          Diagnostik
        </button>
      </div>

      <!-- Diagnostic Result -->
      <div id="diagnostic-result" style="margin-top:16px;display:none"></div>

      <!-- Cached Pages -->
      <div class="error-page__cached">
        <h4>
          <span class="material-icons">offline_bolt</span>
          Halaman Tersedia Offline
        </h4>
        <div id="cached-pages-list">
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
        </div>
        ${pendingActions > 0 ? `
          <div class="cached-pages__hint">
            <span class="material-icons">info</span>
            Halaman yang sudah di-cache tetap dapat diakses tanpa koneksi internet.
          </div>
        ` : ''}
      </div>

      <!-- Offline Tips -->
      <div class="offline-tips">
        <h4>
          <span class="material-icons">tips_and_updates</span>
          Tips
        </h4>
        <ul>
          <li>Periksa apakah mode pesawat tidak aktif</li>
          <li>Pastikan WiFi atau data seluler aktif</li>
          <li>Coba buka situs lain untuk memastikan koneksi</li>
          <li>Restart router atau modem jika menggunakan WiFi</li>
          <li>Hubungi administrator jika masalah berlanjut</li>
        </ul>
      </div>

      <!-- Auto-Retry Info -->
      <div class="auto-retry-info">
        <span class="material-icons">schedule</span>
        <span>Pengecekan otomatis setiap <strong>5 detik</strong></span>
      </div>
    </div>

    <style>
      .error-page--offline {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 70vh;
        padding: 40px 24px;
        text-align: center;
        background: var(--md-sys-color-surface, #FDFBFF);
      }

      .error-page__content {
        max-width: 550px;
        width: 100%;
      }

      /* Offline Icon */
      .error-page__icon {
        margin-bottom: 24px;
      }

      .offline-icon-wrapper {
        position: relative;
        display: inline-block;
        width: 120px;
        height: 120px;
      }

      .offline-icon {
        font-size: 72px;
        color: var(--md-sys-color-outline, #74777F);
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
        animation: offlinePulse 2s ease-in-out infinite;
      }

      @keyframes offlinePulse {
        0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
      }

      .offline-waves {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .offline-wave {
        position: absolute;
        border: 2px solid var(--md-sys-color-outline-variant, #C4C6D0);
        border-radius: 50%;
        opacity: 0;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .offline-wave--1 {
        width: 60px;
        height: 60px;
        animation: waveExpand 3s ease-out infinite;
      }

      .offline-wave--2 {
        width: 60px;
        height: 60px;
        animation: waveExpand 3s ease-out 1s infinite;
      }

      .offline-wave--3 {
        width: 60px;
        height: 60px;
        animation: waveExpand 3s ease-out 2s infinite;
      }

      @keyframes waveExpand {
        0% { width: 60px; height: 60px; opacity: 0.6; }
        100% { width: 160px; height: 160px; opacity: 0; }
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

      /* Connection Status */
      .error-page__status {
        margin-bottom: 20px;
      }

      .connection-indicator {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: var(--md-sys-color-surface-container, #F3F0F4);
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        color: var(--md-sys-color-on-surface-variant, #44474E);
      }

      .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .status-dot--offline {
        background: var(--md-sys-color-error, #BA1A1A);
        animation: pulse 1.5s ease-in-out infinite;
      }

      .status-dot--online {
        background: var(--md-sys-color-success, #2E7D32);
        animation: none;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }

      .connection-attempts {
        margin-top: 8px;
        color: var(--md-sys-color-on-surface-variant, #44474E);
      }

      /* Connection Info */
      .connection-info {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        margin-bottom: 24px;
      }

      .connection-info__item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: var(--md-sys-color-surface-container, #F3F0F4);
        border-radius: 8px;
        font-size: 12px;
        color: var(--md-sys-color-on-surface-variant, #44474E);
      }

      .connection-info__item .material-icons {
        font-size: 16px;
        color: var(--md-sys-color-primary, #1976D2);
      }

      /* Pending Actions */
      .pending-actions-card {
        background: var(--md-sys-color-warning-container, #FFDDB4);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 24px;
        text-align: left;
        border: 1px solid var(--md-sys-color-warning, #ED6C02);
      }

      .pending-actions-card__header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
        color: var(--md-sys-color-on-warning-container, #2B1700);
      }

      .pending-actions-card__header .material-icons {
        animation: spin 2s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .error-page__actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 24px;
      }

      /* Cached Pages */
      .error-page__cached {
        background: var(--md-sys-color-surface-container, #F3F0F4);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 20px;
        text-align: left;
      }

      .error-page__cached h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 12px;
        color: var(--md-sys-color-on-surface, #1A1C1E);
      }

      .error-page__cached a {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: var(--md-sys-color-surface, #FDFBFF);
        border-radius: 8px;
        text-decoration: none;
        color: var(--md-sys-color-primary, #1976D2);
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 6px;
        border: 1px solid var(--md-sys-color-outline-variant, #C4C6D0);
        transition: all 0.2s;
      }

      .error-page__cached a:hover {
        background: var(--md-sys-color-primary-container, #D1E4FF);
        border-color: var(--md-sys-color-primary, #1976D2);
      }

      .error-page__cached a::before {
        content: '📄';
        font-size: 16px;
      }

      .cached-pages__hint {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: var(--md-sys-color-on-surface-variant, #44474E);
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--md-sys-color-outline-variant, #C4C6D0);
      }

      .cached-pages__hint .material-icons {
        font-size: 16px;
      }

      /* Offline Tips */
      .offline-tips {
        background: var(--md-sys-color-surface-container, #F3F0F4);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 20px;
        text-align: left;
      }

      .offline-tips h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .offline-tips ul {
        padding-left: 20px;
        font-size: 13px;
        color: var(--md-sys-color-on-surface-variant, #44474E);
        line-height: 1.8;
      }

      /* Auto-Retry */
      .auto-retry-info {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 12px;
        color: var(--md-sys-color-outline, #74777F);
      }

      .auto-retry-info .material-icons {
        font-size: 16px;
      }

      /* Dark mode */
      [data-theme="dark"] .offline-wave {
        border-color: var(--md-sys-color-outline-variant, #44474E);
      }

      /* Responsive */
      @media (max-width: 600px) {
        .offline-icon {
          font-size: 56px;
        }
        .offline-icon-wrapper {
          width: 100px;
          height: 100px;
        }
        .error-page__title {
          font-size: 22px;
        }
        .connection-info {
          flex-direction: column;
          align-items: center;
        }
      }
    </style>
  `;

  // State variables
  let checkInterval = null;
  let attemptCount = 0;
  const maxAttempts = 20; // 20 * 5 seconds = 100 seconds
  let diagnosticsRun = false;

  // Start monitoring
  setTimeout(() => {
    // Retry button
    container.querySelector('#btn-retry-connection')?.addEventListener('click', () => {
      const btn = container.querySelector('#btn-retry-connection');
      if (btn) {
        btn.classList.add('btn-loading');
        btn.disabled = true;
        btn.innerHTML = '<span class="material-icons">sync</span> Menghubungkan...';
      }

      checkConnection(true).then((online) => {
        if (online) {
          showToast('✅ Koneksi tersedia! Memuat ulang...', 'success');
          setTimeout(() => window.location.reload(), 800);
        } else {
          showToast('❌ Masih offline. Mencoba terus di background.', 'warning');
          if (btn) {
            btn.classList.remove('btn-loading');
            btn.disabled = false;
            btn.innerHTML = '<span class="material-icons">refresh</span> Coba Lagi';
          }
        }
      });
    });

    // Diagnostics button
    container.querySelector('#btn-diagnostics')?.addEventListener('click', () => {
      runDiagnostics();
    });

    // Listen for online event
    window.addEventListener('online', () => {
      updateStatus(true);
      showToast('✅ Koneksi tersedia!', 'success');
      setTimeout(() => window.location.reload(), 800);
    });

    // Listen for offline event
    window.addEventListener('offline', () => {
      updateStatus(false);
    });

    // Auto-check connection
    checkInterval = setInterval(() => {
      attemptCount++;
      updateAttemptCount();
      
      if (navigator.onLine) {
        checkConnection(false).then((online) => {
          if (online) {
            stopAutoCheck();
            updateStatus(true);
            showToast('✅ Koneksi tersedia! Memuat ulang...', 'success');
            setTimeout(() => window.location.reload(), 800);
          }
        });
      }

      // Stop after max attempts
      if (attemptCount >= maxAttempts) {
        stopAutoCheck();
        updateStatusText('Pengecekan otomatis dihentikan. Silakan coba lagi secara manual.');
      }
    }, 5000);

    // Load cached pages
    loadCachedPages();
    
    // Initial status
    updateStatus(navigator.onLine);
    updateAttemptCount();
  }, 100);

  async function checkConnection(showResult = false) {
    try {
      // First check navigator.onLine
      if (!navigator.onLine) {
        updateStatus(false);
        return false;
      }

      // Try to fetch a small resource to confirm connectivity
      const apiUrl = (typeof APP_CONFIG !== 'undefined') ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : '';
      
      if (apiUrl) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(apiUrl + '?action=ping', {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          updateStatus(true);
          return true;
        }
      } else {
        // Try fetching the current page
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await fetch(window.location.href, {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        updateStatus(true);
        return true;
      }
      
      updateStatus(false);
      return false;
    } catch (error) {
      updateStatus(false);
      return false;
    }
  }

  function updateStatus(online) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    const retryBtn = container.querySelector('#btn-retry-connection');

    if (dot) {
      dot.className = online ? 'status-dot status-dot--online' : 'status-dot status-dot--offline';
    }
    if (text) {
      text.textContent = online ? 'Terhubung! Memuat ulang...' : 'Mencoba menghubungkan...';
    }
    if (retryBtn && online) {
      retryBtn.classList.add('btn-loading');
      retryBtn.disabled = true;
    }
  }

  function updateStatusText(message) {
    const text = document.getElementById('status-text');
    if (text) text.textContent = message;
  }

  function updateAttemptCount() {
    const countEl = document.getElementById('attempt-count');
    const attemptsEl = document.getElementById('connection-attempts');
    if (countEl) countEl.textContent = attemptCount;
    if (attemptsEl && attemptCount > 0) attemptsEl.style.display = 'block';
  }

  function stopAutoCheck() {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  }

  async function runDiagnostics() {
    if (diagnosticsRun) return;
    diagnosticsRun = true;

    const resultEl = document.getElementById('diagnostic-result');
    if (!resultEl) return;

    const btn = container.querySelector('#btn-diagnostics');
    if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }

    resultEl.style.display = 'block';
    resultEl.innerHTML = '<div class="progress--circular"></div><p>Menjalankan diagnostik...</p>';

    const results = [];

    // Test 1: Navigator online
    results.push({
      name: 'Navigator Online',
      status: navigator.onLine ? 'pass' : 'fail',
      detail: navigator.onLine ? 'Browser mendeteksi koneksi' : 'Browser tidak mendeteksi koneksi'
    });

    // Test 2: Connection API
    if (connection) {
      results.push({
        name: 'Connection API',
        status: connection.downlink > 0 ? 'pass' : 'warn',
        detail: `Type: ${connection.type}, Speed: ${connection.downlink} Mbps, RTT: ${connection.rtt}ms`
      });
    }

    // Test 3: LocalStorage
    try {
      localStorage.setItem('__diag_test__', '1');
      localStorage.removeItem('__diag_test__');
      results.push({ name: 'LocalStorage', status: 'pass', detail: 'Berfungsi normal' });
    } catch (e) {
      results.push({ name: 'LocalStorage', status: 'fail', detail: e.message });
    }

    // Test 4: Cache API
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        results.push({ name: 'Cache API', status: 'pass', detail: `${cacheNames.length} cache ditemukan` });
      } else {
        results.push({ name: 'Cache API', status: 'warn', detail: 'Tidak didukung' });
      }
    } catch (e) {
      results.push({ name: 'Cache API', status: 'fail', detail: e.message });
    }

    // Test 5: Service Worker
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        results.push({ name: 'Service Worker', status: reg ? 'pass' : 'warn', detail: reg ? 'Terdaftar' : 'Tidak terdaftar' });
      } else {
        results.push({ name: 'Service Worker', status: 'warn', detail: 'Tidak didukung' });
      }
    } catch (e) {
      results.push({ name: 'Service Worker', status: 'fail', detail: e.message });
    }

    // Test 6: API ping
    try {
      const apiUrl = (typeof APP_CONFIG !== 'undefined') ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : '';
      if (apiUrl) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(apiUrl + '?action=ping', { signal: controller.signal });
        clearTimeout(timeoutId);
        results.push({ name: 'API Ping', status: response.ok ? 'pass' : 'fail', detail: `Status: ${response.status}` });
      } else {
        results.push({ name: 'API Ping', status: 'warn', detail: 'URL tidak dikonfigurasi' });
      }
    } catch (e) {
      results.push({ name: 'API Ping', status: 'fail', detail: e.message });
    }

    // Render results
    resultEl.innerHTML = `
      <div class="diagnostic-results">
        <h4>Hasil Diagnostik</h4>
        ${results.map(r => `
          <div class="diagnostic-item diagnostic-item--${r.status}">
            <span class="diagnostic-item__icon">
              ${r.status === 'pass' ? '✅' : r.status === 'warn' ? '⚠️' : '❌'}
            </span>
            <div class="diagnostic-item__info">
              <strong>${r.name}</strong>
              <small>${r.detail}</small>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
  }

  function showToast(message, type) {
    if (typeof Toast !== 'undefined') Toast.show(message, type);
    else if (typeof NotificationService !== 'undefined') NotificationService.show(message, type);
  }

  // Cleanup
  container.addEventListener('destroy', () => {
    stopAutoCheck();
    window.removeEventListener('online', updateStatus);
    window.removeEventListener('offline', updateStatus);
  });

  return container;
};

async function loadCachedPages() {
  try {
    const cacheNames = await caches.keys();
    const appCache = cacheNames.find(name => name.includes('asd-') || name.includes('arsip'));
    const list = document.getElementById('cached-pages-list');

    if (appCache && list) {
      const cache = await caches.open(appCache);
      const requests = await cache.keys();
      
      // Filter HTML pages
      const pages = requests
        .filter(req => {
          const url = new URL(req.url);
          return url.pathname.endsWith('/') || 
                 url.pathname.endsWith('.html') ||
                 url.pathname === '' ||
                 url.pathname === '/';
        })
        .map(req => {
          const url = new URL(req.url);
          let label = url.pathname || '/';
          // Beautify path
          label = label.replace(/-/g, ' ').replace(/\//g, ' › ').replace(/^\s*›\s*/, '');
          if (label === '' || label === '/') label = 'Beranda';
          return { url: req.url, label: label.trim() };
        })
        // Remove duplicates
        .filter((page, index, self) => 
          index === self.findIndex(p => p.url === page.url)
        );

      if (pages.length > 0) {
        list.innerHTML = pages.map(page => `
          <a href="${page.url}">
            ${page.label}
          </a>
        `).join('');
      } else {
        list.innerHTML = '<p class="text-muted text-sm">Tidak ada halaman tersedia offline</p>';
      }
    } else if (list) {
      list.innerHTML = '<p class="text-muted text-sm">Cache tidak ditemukan. Buka halaman saat online untuk menyimpannya.</p>';
    }
  } catch (error) {
    const list = document.getElementById('cached-pages-list');
    if (list) {
      list.innerHTML = '<p class="text-muted text-sm">Gagal memuat halaman cache</p>';
    }
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OfflinePageComponent, loadCachedPages };
}
