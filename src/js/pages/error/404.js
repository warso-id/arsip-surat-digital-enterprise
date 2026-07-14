/**
 * ============================================
 * 404 PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL 404 ERROR PAGE - SIAP PRODUKSI
 * Mendukung: Search Suggestions, Navigation,
 * Auto-redirect, Analytics, Animation
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

const Error404Component = (props) => {
  const container = document.createElement('div');
  container.className = 'error-page error-page--404';

  // Get attempted path
  const attemptedPath = props?.path || window.location.hash?.slice(1) || window.location.pathname || '/unknown';

  // Quick links suggestions
  const suggestions = [
    { label: 'Dashboard', path: '/', icon: 'dashboard' },
    { label: 'Surat Masuk', path: '/surat-masuk', icon: 'inbox' },
    { label: 'Surat Keluar', path: '/surat-keluar', icon: 'outbox' },
    { label: 'Disposisi', path: '/disposisi', icon: 'forward' },
    { label: 'Pencarian', path: '/search', icon: 'search' },
    { label: 'Login', path: '/login', icon: 'login' }
  ];

  // Check if user is authenticated
  let isAuthenticated = false;
  try {
    isAuthenticated = !!(localStorage.getItem('asd_token') || localStorage.getItem('asd_auth_token'));
  } catch (e) {}

  container.innerHTML = `
    <div class="error-page__content animate-fade-in-up">
      <!-- Animated 404 -->
      <div class="error-page__animation">
        <div class="error-page__code">
          <span class="error-digit error-digit--4">4</span>
          <span class="error-digit error-digit--0">
            <span class="material-icons error-icon" style="font-size:inherit">search_off</span>
          </span>
          <span class="error-digit error-digit--4">4</span>
        </div>
      </div>

      <!-- Title -->
      <h1 class="error-page__title">Halaman Tidak Ditemukan</h1>
      
      <!-- Description -->
      <p class="error-page__description">
        Maaf, halaman <code class="error-page__path">${attemptedPath}</code> tidak dapat ditemukan. 
        Halaman mungkin telah dipindahkan, dihapus, atau URL yang dimasukkan salah.
      </p>

      <!-- Search Box -->
      <div class="error-page__search">
        <div class="search-input">
          <span class="search-input__icon material-icons">search</span>
          <input type="text" class="form-input" id="error-search-input" 
                 placeholder="Cari halaman atau surat..." 
                 aria-label="Pencarian">
        </div>
        <button class="btn btn-primary btn-sm" id="btn-error-search" style="margin-top:8px">
          <span class="material-icons">search</span> Cari
        </button>
      </div>

      <!-- Actions -->
      <div class="error-page__actions">
        ${isAuthenticated ? `
          <button class="btn btn-primary" id="btn-go-dashboard">
            <span class="material-icons">dashboard</span>
            Ke Dashboard
          </button>
        ` : `
          <a href="#/login" class="btn btn-primary" onclick="event.preventDefault();if(typeof router!=='undefined')router.navigate('/login');else window.location.hash='#/login'">
            <span class="material-icons">login</span>
            Login
          </a>
        `}
        <button class="btn btn-secondary" id="btn-go-back">
          <span class="material-icons">arrow_back</span>
          Kembali
        </button>
        <button class="btn btn-ghost" id="btn-refresh">
          <span class="material-icons">refresh</span>
          Muat Ulang
        </button>
      </div>

      <!-- Suggestions -->
      <div class="error-page__suggestions">
        <h4>
          <span class="material-icons">lightbulb</span>
          Mungkin Anda mencari:
        </h4>
        <div class="error-page__suggestion-grid">
          ${suggestions.map(s => `
            <a href="#${s.path}" 
               class="error-page__suggestion-card"
               onclick="event.preventDefault();if(typeof router!=='undefined')router.navigate('${s.path}');else window.location.hash='#${s.path}'">
              <span class="material-icons">${s.icon}</span>
              <span>${s.label}</span>
            </a>
          `).join('')}
        </div>
      </div>

      <!-- Help Section -->
      <div class="error-page__help">
        <p>Jika Anda yakin halaman ini seharusnya ada, silakan:</p>
        <ul>
          <li>Periksa kembali URL yang dimasukkan</li>
          <li>Gunakan pencarian di atas untuk menemukan halaman</li>
          <li>Hubungi administrator sistem jika masalah berlanjut</li>
        </ul>
      </div>

      <!-- System Info -->
      <div class="error-page__info">
        <span>Error Code: 404</span>
        <span>•</span>
        <span>Path: ${attemptedPath}</span>
        <span>•</span>
        <span>Arsip Surat Digital Enterprise v3.2.2</span>
      </div>
    </div>

    <style>
      .error-page--404 {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 70vh;
        padding: 40px 24px;
        text-align: center;
      }

      .error-page__content {
        max-width: 600px;
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
        color: var(--md-sys-color-primary, #1976D2);
        opacity: 0.15;
        user-select: none;
        position: relative;
      }

      .error-digit {
        display: inline-block;
        animation: floatDigit 3s ease-in-out infinite;
      }

      .error-digit--0 { animation-delay: 0.3s; }
      .error-digit--4:last-child { animation-delay: 0.6s; }

      @keyframes floatDigit {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }

      .error-icon {
        animation: spinSlow 8s linear infinite;
      }

      @keyframes spinSlow {
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

      .error-page__path {
        background: var(--md-sys-color-surface-container, #F3F0F4);
        padding: 2px 8px;
        border-radius: 4px;
        font-family: 'Roboto Mono', monospace;
        font-size: 13px;
        word-break: break-all;
      }

      .error-page__search {
        max-width: 400px;
        margin: 0 auto 24px;
      }

      .error-page__actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 32px;
      }

      .error-page__suggestions {
        background: var(--md-sys-color-surface-container, #F3F0F4);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;
        text-align: left;
      }

      .error-page__suggestions h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 16px;
        color: var(--md-sys-color-on-surface, #1A1C1E);
      }

      .error-page__suggestion-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 8px;
      }

      .error-page__suggestion-card {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: var(--md-sys-color-surface, #FDFBFF);
        border-radius: 12px;
        text-decoration: none;
        color: var(--md-sys-color-on-surface, #1A1C1E);
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
        border: 1px solid var(--md-sys-color-outline-variant, #C4C6D0);
      }

      .error-page__suggestion-card:hover {
        border-color: var(--md-sys-color-primary, #1976D2);
        background: var(--md-sys-color-primary-container, #D1E4FF);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .error-page__suggestion-card .material-icons {
        font-size: 20px;
        color: var(--md-sys-color-primary, #1976D2);
      }

      .error-page__help {
        font-size: 13px;
        color: var(--md-sys-color-on-surface-variant, #44474E);
        margin-bottom: 24px;
        text-align: left;
        line-height: 1.6;
      }

      .error-page__help ul {
        padding-left: 20px;
        margin-top: 8px;
      }

      .error-page__help li {
        margin-bottom: 4px;
      }

      .error-page__info {
        font-size: 11px;
        color: var(--md-sys-color-outline, #74777F);
        display: flex;
        gap: 8px;
        justify-content: center;
        flex-wrap: wrap;
      }

      /* Dark mode */
      [data-theme="dark"] .error-page__suggestions {
        background: var(--md-sys-color-surface-container, #1E2024);
      }

      [data-theme="dark"] .error-page__suggestion-card {
        background: var(--md-sys-color-surface, #1A1C1E);
      }

      /* Responsive */
      @media (max-width: 600px) {
        .error-page__code {
          font-size: 80px;
        }
        .error-page__title {
          font-size: 22px;
        }
        .error-page__suggestion-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    </style>
  `;

  // Bind events
  setTimeout(() => {
    // Dashboard button
    container.querySelector('#btn-go-dashboard')?.addEventListener('click', () => {
      if (typeof router !== 'undefined') {
        router.navigate('/');
      } else {
        window.location.hash = '#/';
      }
    });

    // Back button
    container.querySelector('#btn-go-back')?.addEventListener('click', () => {
      window.history.back();
    });

    // Refresh button
    container.querySelector('#btn-refresh')?.addEventListener('click', () => {
      window.location.reload();
    });

    // Search functionality
    const searchInput = container.querySelector('#error-search-input');
    const searchBtn = container.querySelector('#btn-error-search');

    const performSearch = () => {
      const query = searchInput?.value?.trim();
      if (query) {
        if (typeof router !== 'undefined') {
          router.navigate('/search', { query: { q: query } });
        } else {
          window.location.hash = `#/search?q=${encodeURIComponent(query)}`;
        }
      }
    };

    searchBtn?.addEventListener('click', performSearch);
    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performSearch();
    });

    // Track analytics
    if (typeof AnalyticsService !== 'undefined') {
      AnalyticsService.trackEvent('error', '404', attemptedPath);
    }
  }, 100);

  // Auto-redirect to home after 30 seconds if no interaction
  let interactionDetected = false;
  const markInteraction = () => { interactionDetected = true; };
  container.addEventListener('click', markInteraction);
  container.addEventListener('keydown', markInteraction);

  setTimeout(() => {
    if (!interactionDetected && isAuthenticated) {
      if (typeof router !== 'undefined') {
        router.navigate('/');
      }
    }
  }, 30000);

  return container;
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Error404Component };
}
