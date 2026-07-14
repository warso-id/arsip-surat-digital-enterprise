/**
 * ============================================
 * 500 PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL 500 ERROR PAGE - SIAP PRODUKSI
 * Mendukung: Error Details, Retry, Report,
 * Diagnostics, Offline Check, Analytics
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

const Error500Component = (props) => {
  const container = document.createElement('div');
  container.className = 'error-page error-page--500';

  // Extract error information
  const error = props?.error || {};
  const errorMessage = error.message || 'Terjadi kesalahan internal pada server.';
  const errorStack = error.stack || '';
  const errorCode = error.code || error.status || 500;
  const requestUrl = error.url || window.location.hash?.slice(1) || window.location.pathname || '/';
  const timestamp = new Date().toLocaleString('id-ID');

  // Check if online
  const isOnline = navigator.onLine;

  // Check if authenticated
  let isAuthenticated = false;
  try {
    isAuthenticated = !!(localStorage.getItem('asd_token') || localStorage.getItem('asd_auth_token'));
  } catch (e) {}

  // Determine error type
  const errorType = errorMessage.includes('timeout') || errorMessage.includes('Timeout') ? 'timeout' :
                    errorMessage.includes('fetch') || errorMessage.includes('network') ? 'network' :
                    errorMessage.includes('quota') || errorMessage.includes('Quota') ? 'quota' :
                    errorMessage.includes('permission') || errorMessage.includes('Permission') ? 'permission' :
                    'server';

  const errorTypeInfo = {
    timeout: { icon: 'hourglass_empty', title: 'Koneksi Timeout', description: 'Server membutuhkan waktu terlalu lama untuk merespons. Ini mungkin terjadi karena beban server yang tinggi atau koneksi internet yang lambat.' },
    network: { icon: 'wifi_off', title: 'Gangguan Koneksi', description: 'Terjadi gangguan pada koneksi jaringan. Periksa koneksi internet Anda dan coba lagi.' },
    quota: { icon: 'storage_full', title: 'Kuota Penyimpanan Penuh', description: 'Penyimpanan Google Sheets/Drive mungkin telah mencapai batas. Hubungi administrator untuk meningkatkan kuota.' },
    permission: { icon: 'lock', title: 'Kesalahan Izin', description: 'Aplikasi tidak memiliki izin yang cukup untuk melakukan operasi ini. Periksa pengaturan izin Google Apps Script.' },
    server: { icon: 'dns', title: 'Kesalahan Server', description: 'Terjadi kesalahan internal pada server Google Apps Script. Ini biasanya bersifat sementara.' }
  };

  const typeInfo = errorTypeInfo[errorType] || errorTypeInfo.server;

  container.innerHTML = `
    <div class="error-page__content animate-fade-in-up">
      <!-- Animated Error Display -->
      <div class="error-page__animation">
        <div class="error-page__code">
          <span class="error-digit error-digit--5">5</span>
          <span class="error-digit error-digit--0">
            <span class="material-icons error-icon" style="font-size:inherit">${typeInfo.icon}</span>
          </span>
          <span class="error-digit error-digit--0">0</span>
        </div>
      </div>

      <!-- Title -->
      <h1 class="error-page__title">${typeInfo.title}</h1>

      <!-- Description -->
      <p class="error-page__description">
        ${typeInfo.description}
        <br><br>
        <span class="text-muted">${errorMessage}</span>
      </p>

      <!-- Online Status -->
      <div class="error-page__status">
        <span class="status-indicator ${isOnline ? 'status-indicator--online' : 'status-indicator--offline'}">
          <span class="status-dot"></span>
          ${isOnline ? 'Terhubung ke internet' : 'Tidak terhubung ke internet'}
        </span>
        <span class="status-indicator status-indicator--server">
          <span class="status-dot"></span>
          Server: <span id="server-status-text">Memeriksa...</span>
        </span>
      </div>

      <!-- Error Details (collapsible) -->
      ${errorMessage || errorStack ? `
        <details class="error-page__details">
          <summary>
            <span class="material-icons">bug_report</span>
            Detail Teknis
            <span class="material-icons details-arrow">expand_more</span>
          </summary>
          <div class="error-page__detail-content">
            <div class="detail-item">
              <span class="detail-item__label">Error Code</span>
              <span class="detail-item__value">${errorCode}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">Waktu</span>
              <span class="detail-item__value">${timestamp}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">URL</span>
              <span class="detail-item__value text-mono text-sm">${requestUrl}</span>
            </div>
            ${errorMessage ? `
              <div class="detail-item detail-item--full">
                <span class="detail-item__label">Pesan Error</span>
                <span class="detail-item__value text-error">${errorMessage}</span>
              </div>
            ` : ''}
            ${errorStack ? `
              <div class="detail-item detail-item--full">
                <span class="detail-item__label">Stack Trace</span>
                <pre class="error-page__stack">${errorStack}</pre>
              </div>
            ` : ''}
            <div class="detail-item">
              <span class="detail-item__label">User Agent</span>
              <span class="detail-item__value text-xs">${navigator.userAgent}</span>
            </div>
          </div>
        </details>
      ` : ''}

      <!-- Actions -->
      <div class="error-page__actions">
        <button class="btn btn-primary btn-lg" id="btn-retry">
          <span class="material-icons">refresh</span>
          Coba Lagi
        </button>
        <button class="btn btn-secondary" id="btn-go-dashboard">
          <span class="material-icons">home</span>
          ${isAuthenticated ? 'Ke Dashboard' : 'Ke Beranda'}
        </button>
        <button class="btn btn-ghost" id="btn-clear-cache">
          <span class="material-icons">cleaning_services</span>
          Bersihkan Cache
        </button>
      </div>

      <!-- Diagnostic Tools -->
      <div class="error-page__diagnostics">
        <h4>
          <span class="material-icons">build</span>
          Alat Diagnostik
        </h4>
        <div class="diagnostic-buttons">
          <button class="btn btn-sm btn-secondary" id="btn-test-api">
            <span class="material-icons">network_ping</span>
            Tes Koneksi API
          </button>
          <button class="btn btn-sm btn-secondary" id="btn-check-system">
            <span class="material-icons">monitor_heart</span>
            Cek Status Sistem
          </button>
          <button class="btn btn-sm btn-ghost" id="btn-copy-error">
            <span class="material-icons">content_copy</span>
            Salin Info Error
          </button>
        </div>
        <div id="diagnostic-result" style="margin-top:12px;display:none"></div>
      </div>

      <!-- Alternative Actions -->
      <div class="error-page__alternatives">
        <p>Anda juga dapat mencoba:</p>
        <ul>
          <li>Memuat ulang halaman (F5 atau Ctrl+R)</li>
          <li>Membersihkan cache browser</li>
          <li>Membuka di browser lain</li>
          <li>Menunggu beberapa saat dan mencoba lagi</li>
          <li>Menghubungi administrator jika masalah berlanjut</li>
        </ul>
      </div>

      <!-- Report Section -->
      <div class="error-page__report">
        <p>Jika masalah ini terus berlanjut, silakan laporkan ke administrator sistem.</p>
        <button class="btn btn-sm btn-ghost" id="btn-report-error">
          <span class="material-icons">bug_report</span>
          Laporkan Masalah
        </button>
      </div>

      <!-- Footer Info -->
      <div class="error-page__info">
        <span>Error Code: ${errorCode}</span>
        <span>•</span>
        <span>${timestamp}</span>
        <span>•</span>
        <span>Arsip Surat Digital Enterprise v3.2.2</span>
      </div>
    </div>

    <style>
      .error-page--500 {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 70vh;
        padding: 40px 24px;
        text-align: center;
      }

      .error-page__content {
        max-width: 650px;
        width: 100%;
      }

      .error-page__animation {
        margin-bottom: 8px;
      }

      .error-page__code {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 120px;
        font-weight: 900;
        line-height: 1;
        color: var(--md-sys-color-error, #BA1A1A);
        opacity: 0.2;
        user-select: none;
      }

      .error-digit {
        display: inline-block;
        animation: floatDigit 3s ease-in-out infinite;
      }
      .error-digit--0 { animation-delay: 0.3s; }
      .error-digit--0:last-child { animation-delay: 0.6s; }

      @keyframes floatDigit {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }

      .error-icon {
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.1); }
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
        margin-bottom: 20px;
        line-height: 1.6;
      }

      .error-page__status {
        display: flex;
        gap: 16px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 24px;
      }

      .status-indicator {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      }

      .status-indicator--online {
        background: #E8F5E9;
        color: #2E7D32;
      }

      .status-indicator--offline {
        background: #FFEBEE;
        color: #C62828;
      }

      .status-indicator--server {
        background: #E3F2FD;
        color: #1565C0;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }

      .status-indicator--online .status-dot { background: #4CAF50; }
      .status-indicator--offline .status-dot { background: #F44336; animation: pulse 1.5s infinite; }
      .status-indicator--server .status-dot { background: #1976D2; animation: pulse 1.5s infinite; }

      .error-page__details {
        background: var(--md-sys-color-surface-container, #F3F0F4);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 24px;
        text-align: left;
      }

      .error-page__details summary {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--md-sys-color-on-surface, #1A1C1E);
        list-style: none;
      }

      .error-page__details summary::-webkit-details-marker { display: none; }
      .error-page__details summary .details-arrow { margin-left: auto; transition: transform 0.2s; }
      .error-page__details[open] summary .details-arrow { transform: rotate(180deg); }

      .error-page__detail-content {
        margin-top: 16px;
        font-size: 13px;
      }

      .error-page__stack {
        background: rgba(0,0,0,0.05);
        padding: 12px;
        border-radius: 8px;
        font-size: 11px;
        font-family: 'Roboto Mono', monospace;
        overflow-x: auto;
        max-height: 200px;
        white-space: pre-wrap;
        word-break: break-all;
      }

      [data-theme="dark"] .error-page__stack {
        background: rgba(255,255,255,0.05);
      }

      .error-page__actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 24px;
      }

      .error-page__diagnostics {
        background: var(--md-sys-color-surface-container, #F3F0F4);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;
        text-align: left;
      }

      .error-page__diagnostics h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 12px;
      }

      .diagnostic-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .error-page__alternatives {
        font-size: 13px;
        color: var(--md-sys-color-on-surface-variant, #44474E);
        margin-bottom: 24px;
        text-align: left;
        line-height: 1.6;
      }

      .error-page__alternatives ul {
        padding-left: 20px;
        margin-top: 8px;
      }

      .error-page__alternatives li { margin-bottom: 4px; }

      .error-page__report {
        padding: 16px;
        background: var(--md-sys-color-error-container, #FFDAD6);
        border-radius: 12px;
        margin-bottom: 24px;
        font-size: 13px;
        color: var(--md-sys-color-on-error-container, #410002);
      }

      .error-page__info {
        font-size: 11px;
        color: var(--md-sys-color-outline, #74777F);
        display: flex;
        gap: 8px;
        justify-content: center;
        flex-wrap: wrap;
      }

      .detail-item { margin-bottom: 8px; }
      .detail-item__label { font-weight: 600; display: block; font-size: 11px; color: var(--md-sys-color-on-surface-variant); margin-bottom: 2px; }
      .detail-item__value { font-size: 13px; }
      .text-mono { font-family: 'Roboto Mono', monospace; }
      .text-xs { font-size: 10px; }
      .text-sm { font-size: 12px; }
      .text-error { color: var(--md-sys-color-error, #BA1A1A); }

      @media (max-width: 600px) {
        .error-page__code { font-size: 80px; }
        .error-page__title { font-size: 22px; }
        .diagnostic-buttons { flex-direction: column; }
        .diagnostic-buttons .btn { width: 100%; justify-content: center; }
      }
    </style>
  `;

  // Bind events
  setTimeout(() => {
    // Check server status on load
    checkServerStatus();

    // Retry button
    container.querySelector('#btn-retry')?.addEventListener('click', () => {
      const btn = container.querySelector('#btn-retry');
      if (btn) {
        btn.classList.add('btn-loading');
        btn.disabled = true;
      }
      window.location.reload();
    });

    // Go to dashboard
    container.querySelector('#btn-go-dashboard')?.addEventListener('click', () => {
      if (typeof router !== 'undefined') {
        router.navigate('/');
      } else {
        window.location.hash = '#/';
      }
    });

    // Clear cache
    container.querySelector('#btn-clear-cache')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-clear-cache');
      if (btn) {
        btn.classList.add('btn-loading');
        btn.disabled = true;
      }

      try {
        // Clear localStorage cache
        const keys = Object.keys(localStorage).filter(k => k.startsWith('asd_'));
        keys.forEach(k => localStorage.removeItem(k));
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear Cache API if available
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }

        // Clear IndexedDB if available
        if ('indexedDB' in window) {
          const databases = await indexedDB.databases();
          databases.forEach(db => { if (db.name) indexedDB.deleteDatabase(db.name); });
        }

        showToast('Cache berhasil dibersihkan. Memuat ulang...', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        showToast('Gagal membersihkan cache', 'error');
        if (btn) {
          btn.classList.remove('btn-loading');
          btn.disabled = false;
        }
      }
    });

    // Test API connection
    container.querySelector('#btn-test-api')?.addEventListener('click', async () => {
      const resultEl = document.getElementById('diagnostic-result');
      const btn = container.querySelector('#btn-test-api');
      if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }
      
      resultEl.style.display = 'block';
      resultEl.innerHTML = '<div class="progress--circular"></div><p>Menguji koneksi API...</p>';

      try {
        const apiUrl = (typeof APP_CONFIG !== 'undefined') ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : '';
        if (!apiUrl) {
          throw new Error('API URL tidak dikonfigurasi');
        }

        const startTime = performance.now();
        const response = await fetch(apiUrl + '?action=ping');
        const endTime = performance.now();
        const data = await response.json();

        if (data?.status === 'success') {
          resultEl.innerHTML = `
            <div class="alert alert-success">
              ✅ API terhubung! (${Math.round(endTime - startTime)}ms)
              <br>Version: ${data.data?.version || data.version || 'N/A'}
              <br>Timestamp: ${data.timestamp || 'N/A'}
            </div>
          `;
        } else {
          resultEl.innerHTML = `<div class="alert alert-error">❌ API merespons dengan error: ${data?.message || 'Unknown'}</div>`;
        }
      } catch (error) {
        resultEl.innerHTML = `<div class="alert alert-error">❌ Gagal terhubung ke API: ${error.message}</div>`;
      } finally {
        if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
      }
    });

    // Check system status
    container.querySelector('#btn-check-system')?.addEventListener('click', async () => {
      const resultEl = document.getElementById('diagnostic-result');
      const btn = container.querySelector('#btn-check-system');
      if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }
      
      resultEl.style.display = 'block';
      resultEl.innerHTML = '<div class="progress--circular"></div><p>Memeriksa status sistem...</p>';

      try {
        const apiUrl = (typeof APP_CONFIG !== 'undefined') ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : '';
        if (!apiUrl) throw new Error('API URL tidak dikonfigurasi');

        const response = await fetch(apiUrl + '?action=system.health');
        const data = await response.json();

        if (data?.status === 'success' && data.data) {
          const checks = data.data.checks || {};
          resultEl.innerHTML = `
            <div class="alert alert-${data.data.healthy ? 'success' : 'error'}">
              <strong>Status: ${data.data.healthy ? '✅ Sehat' : '❌ Ada Masalah'}</strong>
              <br>Spreadsheet: ${checks.spreadsheet ? '✅' : '❌'}
              <br>Folder: ${checks.folder ? '✅' : '❌'}
              <br>Cache: ${checks.cache ? '✅' : '❌'}
            </div>
          `;
        } else {
          resultEl.innerHTML = `<div class="alert alert-error">❌ Gagal memeriksa status sistem</div>`;
        }
      } catch (error) {
        resultEl.innerHTML = `<div class="alert alert-error">❌ ${error.message}</div>`;
      } finally {
        if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
      }
    });

    // Copy error info
    container.querySelector('#btn-copy-error')?.addEventListener('click', () => {
      const errorInfo = `
Error Report - Arsip Surat Digital Enterprise v3.2.2
====================================================
Error Code: ${errorCode}
Time: ${timestamp}
URL: ${requestUrl}
Message: ${errorMessage}
Stack: ${errorStack || 'N/A'}
Online: ${isOnline ? 'Yes' : 'No'}
User Agent: ${navigator.userAgent}
====================================================
      `.trim();

      navigator.clipboard.writeText(errorInfo).then(() => {
        showToast('Info error disalin ke clipboard', 'success');
      }).catch(() => {
        showToast('Gagal menyalin info error', 'error');
      });
    });

    // Report error
    container.querySelector('#btn-report-error')?.addEventListener('click', () => {
      const subject = encodeURIComponent(`Error ${errorCode} - Arsip Surat Digital`);
      const body = encodeURIComponent(`
Error Report
============
Error Code: ${errorCode}
Time: ${timestamp}
URL: ${requestUrl}
Message: ${errorMessage}
Stack: ${errorStack || 'N/A'}
      `.trim());
      
      window.open(`mailto:support@instansi.id?subject=${subject}&body=${body}`);
    });

    // Track analytics
    if (typeof AnalyticsService !== 'undefined') {
      AnalyticsService.trackError('500', errorMessage);
    }
  }, 100);

  // Check server status
  async function checkServerStatus() {
    const statusEl = document.getElementById('server-status-text');
    if (!statusEl) return;

    try {
      const apiUrl = (typeof APP_CONFIG !== 'undefined') ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : '';
      if (!apiUrl) {
        statusEl.textContent = 'URL tidak dikonfigurasi';
        return;
      }

      const response = await fetch(apiUrl + '?action=ping');
      if (response.ok) {
        statusEl.textContent = 'Online';
        const indicator = statusEl.closest('.status-indicator--server');
        if (indicator) {
          indicator.style.background = '#E8F5E9';
          indicator.style.color = '#2E7D32';
          indicator.querySelector('.status-dot').style.background = '#4CAF50';
          indicator.querySelector('.status-dot').style.animation = 'none';
        }
      } else {
        statusEl.textContent = 'Error ' + response.status;
      }
    } catch {
      statusEl.textContent = 'Tidak terjangkau';
    }
  }

  function showToast(message, type) {
    if (typeof Toast !== 'undefined') Toast.show(message, type);
    else if (typeof NotificationService !== 'undefined') NotificationService.show(message, type);
  }

  return container;
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Error500Component };
}
