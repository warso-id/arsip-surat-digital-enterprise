/**
 * OFFLINE PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

const OfflinePageComponent = (props) => {
  const container = document.createElement('div');
  container.className = 'error-page error-page--offline';
  container.innerHTML = `
    <div class="error-page__content">
      <div class="error-page__icon">
        <span class="material-icons">wifi_off</span>
      </div>
      <h1 class="error-page__title">Anda Sedang Offline</h1>
      <p class="error-page__description">
        Tidak dapat terhubung ke server. Periksa koneksi internet Anda.
      </p>
      <div class="error-page__status" id="connection-status">
        <span class="status-dot status-dot--offline"></span>
        <span>Mencoba menghubungkan...</span>
      </div>
      <div class="error-page__actions">
        <button class="btn btn-primary" id="btn-retry-connection">
          <span class="material-icons">refresh</span>
          Coba Lagi
        </button>
      </div>
      <div class="error-page__cached">
        <h4>Halaman Tersedia Offline:</h4>
        <div id="cached-pages-list">Memuat...</div>
      </div>
    </div>
  `;
  
  // Retry button
  setTimeout(() => {
    container.querySelector('#btn-retry-connection')?.addEventListener('click', () => {
      window.location.reload();
    });
    
    // Auto-check connection
    const checkConnection = setInterval(() => {
      if (navigator.onLine) {
        clearInterval(checkConnection);
        window.location.reload();
      }
    }, 5000);
    
    // Load cached pages
    loadCachedPages();
  }, 0);
  
  return container;
};

async function loadCachedPages() {
  try {
    const cacheNames = await caches.keys();
    const appCache = cacheNames.find(name => name.includes('asd-'));
    const list = document.getElementById('cached-pages-list');
    
    if (appCache && list) {
      const cache = await caches.open(appCache);
      const requests = await cache.keys();
      const pages = requests.filter(req => req.url.endsWith('/') || req.url.endsWith('.html'));
      
      list.innerHTML = pages.length > 0 
        ? pages.map(req => `<a href="${req.url}">${new URL(req.url).pathname || 'Beranda'}</a>`).join('<br>')
        : 'Tidak ada halaman tersedia';
    }
  } catch {}
}
