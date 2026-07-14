/**
 * ============================================
 * NAVBAR COMPONENT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL NAVBAR WITH SEARCH, NOTIFICATIONS, USER MENU
 * SIAP PRODUKSI - Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class NavbarComponent {
  constructor() {
    this.element = null;
    this.searchTimeout = null;
    this.notificationPolling = null;
    this.notificationPollInterval = 30000; // 30 detik
    this.isMobile = window.innerWidth < 905;
    this.unreadCount = 0;
    this.currentUser = null;
    this.breadcrumbs = [];
    this.isSearchOpen = false;
    this.isFullscreen = false;
    this.isUserMenuOpen = false;
  }

  /**
   * Initialize navbar component
   */
  init() {
    // Cari atau buat navbar element
    this.element = document.querySelector('.navbar');
    if (!this.element) {
      this.createNavbar();
    }

    // Load user info
    this.loadUserInfo();
    
    // Bind semua events
    this.bindEvents();
    
    // Subscribe ke state changes
    this.subscribeToState();
    
    // Start notification polling
    this.startNotificationPolling();
    
    // Update tampilan awal
    this.updateNotificationBadge();
    this.updateBreadcrumbsDisplay();
    this.updateFullscreenIcon();
    
    console.log('✅ Navbar initialized');
  }

  /**
   * Create navbar element if not exists
   */
  createNavbar() {
    const navbar = document.createElement('header');
    navbar.className = 'navbar';
    navbar.id = 'navbar';
    navbar.setAttribute('role', 'banner');
    navbar.innerHTML = this.getNavbarTemplate();
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.prepend(navbar);
    } else {
      const appShell = document.querySelector('.app-shell');
      if (appShell) {
        const mainContentEl = appShell.querySelector('.main-content');
        if (mainContentEl) {
          mainContentEl.prepend(navbar);
        }
      }
    }
    
    this.element = navbar;
  }

  /**
   * Get navbar HTML template
   */
  getNavbarTemplate() {
    return `
      <!-- Sidebar Toggle -->
      <button class="navbar__toggle" id="sidebar-toggle" 
              title="${this.isMobile ? 'Buka Menu' : 'Toggle Sidebar'}" 
              aria-label="Toggle sidebar navigation">
        <span class="material-icons">menu</span>
      </button>
      
      <!-- Breadcrumb Navigation -->
      <nav class="navbar__breadcrumb" id="navbar-breadcrumb" aria-label="Breadcrumb">
        <span class="navbar__breadcrumb-item navbar__breadcrumb-item--active">
          <span class="material-icons" style="font-size:16px">dashboard</span>
          Dashboard
        </span>
      </nav>
      
      <!-- Page Title (hidden on mobile) -->
      <h1 class="navbar__title" id="navbar-title" style="display:none"></h1>
      
      <!-- Spacer -->
      <div class="navbar__spacer"></div>
      
      <!-- Actions -->
      <div class="navbar__actions">
        <!-- Global Search -->
        <div class="search-input" id="navbar-search" style="display:none">
          <span class="search-input__icon material-icons">search</span>
          <input type="text" class="form-input" 
                 placeholder="Cari surat, disposisi, pengguna..." 
                 id="global-search-input"
                 aria-label="Pencarian global">
          <button class="search-input__clear" id="search-clear-btn" 
                  style="display:none" aria-label="Hapus pencarian">
            <span class="material-icons">close</span>
          </button>
          <div class="search-input__dropdown" id="search-dropdown" style="display:none">
            <div class="search-input__results" id="search-results"></div>
          </div>
        </div>
        
        <!-- Search Toggle Button -->
        <button class="navbar__action-btn" id="btn-search-toggle" 
                title="Cari (Ctrl+F)" aria-label="Toggle search">
          <span class="material-icons">search</span>
        </button>
        
        <!-- Notifications Button -->
        <button class="navbar__action-btn" id="btn-notifications" 
                title="Notifikasi" aria-label="Notifications">
          <span class="material-icons">notifications</span>
          <span class="navbar__action-badge navbar__action-badge--count" 
                id="notification-badge" style="display:none">0</span>
        </button>
        
        <!-- Theme Toggle -->
        <button class="navbar__action-btn" id="btn-toggle-theme" 
                title="Ganti Tema" aria-label="Toggle theme">
          <span class="material-icons">light_mode</span>
        </button>
        
        <!-- Fullscreen Toggle -->
        <button class="navbar__action-btn" id="btn-fullscreen" 
                title="Fullscreen (F11)" aria-label="Toggle fullscreen">
          <span class="material-icons">fullscreen</span>
        </button>
        
        <!-- User Menu Dropdown -->
        <div class="dropdown" id="user-dropdown">
          <button class="navbar__user-menu" id="btn-user-menu" 
                  aria-label="Menu pengguna" aria-expanded="false" aria-haspopup="true">
            <div class="navbar__user-avatar" id="user-avatar">
              <span>A</span>
            </div>
            <div class="navbar__user-info" id="user-info">
              <span class="navbar__user-name" id="user-name">Admin</span>
              <span class="navbar__user-role" id="user-role">Administrator</span>
            </div>
            <span class="material-icons" id="dropdown-arrow">arrow_drop_down</span>
          </button>
          
          <div class="dropdown__menu" role="menu" aria-labelledby="btn-user-menu">
            <div class="dropdown__header">Akun Saya</div>
            
            <a class="dropdown__item" href="#/profile" role="menuitem" id="menu-profile">
              <span class="material-icons">person</span>
              <span>Profil Saya</span>
            </a>
            
            <a class="dropdown__item" href="#/settings" role="menuitem" id="menu-settings">
              <span class="material-icons">settings</span>
              <span>Pengaturan</span>
            </a>
            
            <div class="dropdown__divider"></div>
            
            <a class="dropdown__item" href="#/settings/security" role="menuitem" id="menu-security">
              <span class="material-icons">security</span>
              <span>Keamanan</span>
            </a>
            
            <a class="dropdown__item" href="#/audit-log" role="menuitem" id="menu-activity">
              <span class="material-icons">history</span>
              <span>Aktivitas</span>
            </a>
            
            <a class="dropdown__item" href="#/settings/backup" role="menuitem" id="menu-backup">
              <span class="material-icons">backup</span>
              <span>Backup</span>
            </a>
            
            <div class="dropdown__divider"></div>
            
            <button class="dropdown__item dropdown__item--danger" id="btn-logout" role="menuitem">
              <span class="material-icons">logout</span>
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Load current user information
   */
  loadUserInfo() {
    try {
      // Coba dari AuthService
      if (typeof AuthService !== 'undefined' && AuthService.getUser) {
        this.currentUser = AuthService.getUser();
      } 
      // Fallback ke Storage
      else if (typeof Storage !== 'undefined') {
        this.currentUser = Storage.getJSON('asd_user') || Storage.getJSON('asd_auth_user');
      }
      // Fallback ke localStorage langsung
      else {
        const userData = localStorage.getItem('asd_user') || localStorage.getItem('asd_auth_user');
        if (userData) {
          try {
            this.currentUser = JSON.parse(userData);
          } catch (e) {
            this.currentUser = null;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load user info:', e);
      this.currentUser = null;
    }

    this.updateUserInfo();
  }

  /**
   * Update user info display in navbar
   */
  updateUserInfo() {
    if (!this.element) return;

    const avatar = this.element.querySelector('#user-avatar span');
    const name = this.element.querySelector('#user-name');
    const role = this.element.querySelector('#user-role');
    const userInfo = this.element.querySelector('#user-info');

    if (!this.currentUser) {
      if (avatar) avatar.textContent = '?';
      if (name) name.textContent = 'Guest';
      if (role) role.textContent = '';
      return;
    }

    const displayName = this.currentUser.namaLengkap || this.currentUser.username || 'User';
    const userRole = this.currentUser.role || 'staff';
    const initials = this.getInitials(displayName);

    if (avatar) avatar.textContent = initials;
    if (name) name.textContent = displayName;
    if (role) {
      const roleLabels = {
        'admin': 'Administrator',
        'kabid': 'Kepala Bidang',
        'kasubag': 'Kepala Sub Bagian',
        'staff': 'Staff',
        'sekretaris': 'Sekretaris'
      };
      role.textContent = roleLabels[userRole] || userRole;
    }

    // Show/hide user info on mobile
    if (userInfo) {
      userInfo.style.display = this.isMobile ? 'none' : 'flex';
    }

    // Update avatar background color based on role
    const avatarEl = this.element.querySelector('#user-avatar');
    if (avatarEl) {
      avatarEl.style.backgroundColor = userRole === 'admin' 
        ? 'var(--md-sys-color-error-container, #FFDAD6)' 
        : 'var(--md-sys-color-primary-container, #D1E4FF)';
      avatarEl.style.color = userRole === 'admin'
        ? 'var(--md-sys-color-on-error-container, #410002)'
        : 'var(--md-sys-color-on-primary-container, #001D36)';
    }
  }

  /**
   * Get initials from name
   */
  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Subscribe to state changes
   */
  subscribeToState() {
    // Subscribe ke auth user changes
    if (typeof store !== 'undefined' && store.subscribe) {
      store.subscribe('auth.user', (user) => {
        this.currentUser = user;
        this.updateUserInfo();
      });

      store.subscribe('ui.breadcrumbs', (breadcrumbs) => {
        this.breadcrumbs = breadcrumbs || [];
        this.updateBreadcrumbsDisplay();
      });

      store.subscribe('ui.currentRoute', (route) => {
        if (route) {
          this.updateBreadcrumbsFromRoute(route);
          this.updateTitleFromRoute(route);
        }
      });

      store.subscribe('app.online', (online) => {
        this.updateOnlineStatus(online);
      });

      store.subscribe('data.notifications.unreadCount', (count) => {
        this.unreadCount = count || 0;
        this.updateNotificationBadge();
      });
    }
  }

  /**
   * Update breadcrumbs from route
   */
  updateBreadcrumbsFromRoute(route) {
    if (!route || !route.path) return;
    
    const parts = route.path.split('/').filter(Boolean);
    const breadcrumbs = [];
    let currentPath = '';
    
    // Add home
    breadcrumbs.push({
      label: 'Dashboard',
      path: '/',
      active: parts.length === 0
    });
    
    // Build breadcrumbs from path
    parts.forEach((part, index) => {
      currentPath += '/' + part;
      const isLast = index === parts.length - 1;
      
      // Format label
      let label = part
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      
      // Translate known paths
      const pathTranslations = {
        'surat-masuk': 'Surat Masuk',
        'surat-keluar': 'Surat Keluar',
        'disposisi': 'Disposisi',
        'approval': 'Approval',
        'users': 'Pengguna',
        'settings': 'Pengaturan',
        'reports': 'Laporan',
        'search': 'Pencarian',
        'files': 'File Manager',
        'audit-log': 'Audit Log',
        'blockchain': 'Blockchain',
        'profile': 'Profil',
        'dashboard': 'Dashboard',
        'create': 'Tambah',
        'edit': 'Edit',
        'detail': 'Detail',
        'security': 'Keamanan',
        'notifications': 'Notifikasi',
        'api-keys': 'API Keys',
        'webhooks': 'Webhooks',
        'backup': 'Backup',
        'about': 'Tentang'
      };
      
      label = pathTranslations[part] || label;
      
      breadcrumbs.push({
        label: label,
        path: currentPath,
        active: isLast
      });
    });
    
    this.breadcrumbs = breadcrumbs;
    this.updateBreadcrumbsDisplay();
  }

  /**
   * Update title from route
   */
  updateTitleFromRoute(route) {
    const titleEl = this.element?.querySelector('#navbar-title');
    if (!titleEl) return;
    
    if (route && route.title) {
      titleEl.textContent = route.title;
      titleEl.style.display = this.isMobile ? 'block' : 'none';
    } else {
      titleEl.style.display = 'none';
    }
  }

  /**
   * Update breadcrumbs display
   */
  updateBreadcrumbsDisplay() {
    const breadcrumbEl = this.element?.querySelector('#navbar-breadcrumb');
    if (!breadcrumbEl) return;
    
    if (!this.breadcrumbs || this.breadcrumbs.length === 0) {
      breadcrumbEl.innerHTML = `
        <span class="navbar__breadcrumb-item navbar__breadcrumb-item--active">
          <span class="material-icons" style="font-size:16px">dashboard</span>
          Dashboard
        </span>
      `;
      return;
    }
    
    // Hide breadcrumbs on mobile if there's a title
    if (this.isMobile) {
      breadcrumbEl.style.display = 'none';
      return;
    }
    
    breadcrumbEl.style.display = 'flex';
    
    breadcrumbEl.innerHTML = this.breadcrumbs.map((crumb, index) => {
      if (crumb.active) {
        return `<span class="navbar__breadcrumb-item navbar__breadcrumb-item--active">${crumb.label}</span>`;
      }
      return `
        <a class="navbar__breadcrumb-item" href="#${crumb.path}" onclick="event.preventDefault(); router.navigate('${crumb.path}')">${crumb.label}</a>
        <span class="navbar__breadcrumb-separator material-icons">chevron_right</span>
      `;
    }).join('');
  }

  /**
   * Toggle search bar
   */
  toggleSearch() {
    const searchEl = this.element?.querySelector('#navbar-search');
    const input = this.element?.querySelector('#global-search-input');
    const searchBtn = this.element?.querySelector('#btn-search-toggle');
    
    if (!searchEl) return;
    
    this.isSearchOpen = !this.isSearchOpen;
    
    if (this.isSearchOpen) {
      searchEl.style.display = 'block';
      if (input) {
        input.focus();
        input.value = '';
      }
      if (searchBtn) {
        searchBtn.style.color = 'var(--md-sys-color-primary, #1976D2)';
      }
      // Sembunyikan elemen lain di mobile
      if (this.isMobile) {
        this.hideMobileElementsForSearch(true);
      }
    } else {
      searchEl.style.display = 'none';
      if (input) input.value = '';
      if (searchBtn) {
        searchBtn.style.color = '';
      }
      this.clearSearchResults();
      if (this.isMobile) {
        this.hideMobileElementsForSearch(false);
      }
    }
  }

  /**
   * Hide/show elements for mobile search
   */
  hideMobileElementsForSearch(hide) {
    const elements = [
      this.element?.querySelector('#navbar-breadcrumb'),
      this.element?.querySelector('#navbar-title'),
      this.element?.querySelector('#btn-search-toggle'),
      this.element?.querySelector('#btn-notifications'),
      this.element?.querySelector('#btn-toggle-theme'),
      this.element?.querySelector('#btn-fullscreen'),
      this.element?.querySelector('#user-dropdown')
    ];
    
    elements.forEach(el => {
      if (el) el.style.display = hide ? 'none' : '';
    });
  }

  /**
   * Handle global search input
   */
  handleSearch(query) {
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    const clearBtn = this.element?.querySelector('#search-clear-btn');
    const dropdown = this.element?.querySelector('#search-dropdown');
    
    // Show/hide clear button
    if (clearBtn) {
      clearBtn.style.display = query.length > 0 ? 'flex' : 'none';
    }
    
    if (query.length < 2) {
      this.clearSearchResults();
      return;
    }
    
    // Debounce search
    this.searchTimeout = setTimeout(async () => {
      await this.performQuickSearch(query);
    }, 300);
  }

  /**
   * Perform quick search
   */
  async performQuickSearch(query) {
    try {
      let results = [];
      
      // Try SearchService first
      if (typeof SearchService !== 'undefined' && SearchService.quickSearch) {
        results = await SearchService.quickSearch(query);
      }
      // Fallback to API directly
      else if (typeof API !== 'undefined') {
        const response = await API.get('search', { q: query, limit: 5, quick: true });
        if (response.status === 'success') {
          results = response.data?.results || [];
        }
      }
      
      this.displaySearchResults(results);
    } catch (error) {
      console.warn('Quick search failed:', error);
      this.clearSearchResults();
    }
  }

  /**
   * Display search results dropdown
   */
  displaySearchResults(results) {
    const dropdown = this.element?.querySelector('#search-dropdown');
    const resultsEl = this.element?.querySelector('#search-results');
    
    if (!dropdown || !resultsEl) return;
    
    if (!results || results.length === 0) {
      dropdown.style.display = 'block';
      resultsEl.innerHTML = `
        <div class="search-input__empty">
          <span class="material-icons">search_off</span>
          <span>Tidak ada hasil</span>
        </div>
      `;
      return;
    }
    
    dropdown.style.display = 'block';
    resultsEl.innerHTML = results.map(result => `
      <a class="search-input__result-item" 
         href="#${this.getResultPath(result)}"
         onclick="event.preventDefault(); router.navigate('${this.getResultPath(result)}')">
        <span class="material-icons">${this.getResultIcon(result._type)}</span>
        <div class="search-input__result-content">
          <div class="search-input__result-title">${result.perihal || result.judul || result.namaLengkap || 'Unknown'}</div>
          <div class="search-input__result-subtitle">${result.pengirim || result.tujuan || result.username || ''}</div>
        </div>
        <span class="badge badge-sm">${this.getTypeLabel(result._type)}</span>
      </a>
    `).join('');
    
    // Add "View All" link
    resultsEl.innerHTML += `
      <a class="search-input__view-all" 
         href="#/search?q=${encodeURIComponent(document.getElementById('global-search-input')?.value || '')}"
         onclick="event.preventDefault(); router.navigate('/search', {query:{q:document.getElementById('global-search-input')?.value||''}})">
        <span class="material-icons">search</span>
        Lihat semua hasil
        <span class="material-icons">arrow_forward</span>
      </a>
    `;
  }

  /**
   * Get result path
   */
  getResultPath(result) {
    const type = result._type || 'surat-masuk';
    const paths = {
      'surat-masuk': '/surat-masuk/',
      'surat-keluar': '/surat-keluar/',
      'disposisi': '/disposisi/',
      'users': '/users/',
      'files': '/files/'
    };
    return (paths[type] || '/') + (result.id || '');
  }

  /**
   * Get result icon
   */
  getResultIcon(type) {
    const icons = {
      'surat-masuk': 'inbox',
      'surat-keluar': 'outbox',
      'disposisi': 'forward',
      'users': 'person',
      'files': 'description'
    };
    return icons[type] || 'description';
  }

  /**
   * Get type label
   */
  getTypeLabel(type) {
    const labels = {
      'surat-masuk': 'Surat Masuk',
      'surat-keluar': 'Surat Keluar',
      'disposisi': 'Disposisi',
      'users': 'Pengguna',
      'files': 'File'
    };
    return labels[type] || type;
  }

  /**
   * Clear search results
   */
  clearSearchResults() {
    const dropdown = this.element?.querySelector('#search-dropdown');
    if (dropdown) {
      dropdown.style.display = 'none';
    }
  }

  /**
   * Toggle fullscreen
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        this.isFullscreen = true;
        this.updateFullscreenIcon();
      }).catch(err => {
        console.warn('Fullscreen not supported:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        this.isFullscreen = false;
        this.updateFullscreenIcon();
      });
    }
  }

  /**
   * Update fullscreen icon
   */
  updateFullscreenIcon() {
    const icon = this.element?.querySelector('#btn-fullscreen .material-icons');
    if (icon) {
      icon.textContent = this.isFullscreen ? 'fullscreen_exit' : 'fullscreen';
    }
  }

  /**
   * Toggle theme
   */
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const themes = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('app-theme', nextTheme);
    
    // Update icon
    const icon = this.element?.querySelector('#btn-toggle-theme .material-icons');
    if (icon) {
      const themeIcons = {
        'light': 'light_mode',
        'dark': 'dark_mode',
        'auto': 'brightness_auto'
      };
      icon.textContent = themeIcons[nextTheme] || 'light_mode';
    }
    
    // Update store
    if (typeof store !== 'undefined') {
      store.dispatch('app.theme', nextTheme);
    }
    
    // Show toast
    const themeLabels = { 'light': 'Mode Terang', 'dark': 'Mode Gelap', 'auto': 'Auto' };
    if (typeof Toast !== 'undefined') {
      Toast.info(`Tema: ${themeLabels[nextTheme]}`);
    }
  }

  /**
   * Update notification badge
   */
  updateNotificationBadge() {
    const badge = this.element?.querySelector('#notification-badge');
    if (!badge) return;
    
    if (this.unreadCount > 0) {
      badge.style.display = 'flex';
      badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
      badge.title = `${this.unreadCount} notifikasi belum dibaca`;
    } else {
      badge.style.display = 'none';
    }
  }

  /**
   * Start notification polling
   */
  startNotificationPolling() {
    this.stopNotificationPolling();
    
    this.notificationPolling = setInterval(async () => {
      try {
        if (typeof API !== 'undefined') {
          const response = await API.get('notifikasi.unreadCount');
          if (response.status === 'success') {
            this.unreadCount = response.data?.count || 0;
            this.updateNotificationBadge();
          }
        }
      } catch (error) {
        // Silent fail for polling
      }
    }, this.notificationPollInterval);
  }

  /**
   * Stop notification polling
   */
  stopNotificationPolling() {
    if (this.notificationPolling) {
      clearInterval(this.notificationPolling);
      this.notificationPolling = null;
    }
  }

  /**
   * Show notification panel
   */
  showNotificationPanel() {
    if (typeof NotificationService !== 'undefined' && NotificationService.showPanel) {
      NotificationService.showPanel();
    } else {
      // Fallback: buka halaman notifikasi
      if (typeof router !== 'undefined') {
        router.navigate('/notifications');
      }
    }
  }

  /**
   * Toggle user dropdown
   */
  toggleUserDropdown() {
    const dropdown = this.element?.querySelector('#user-dropdown');
    const arrow = this.element?.querySelector('#dropdown-arrow');
    const btn = this.element?.querySelector('#btn-user-menu');
    
    if (!dropdown) return;
    
    this.isUserMenuOpen = !this.isUserMenuOpen;
    
    if (this.isUserMenuOpen) {
      dropdown.classList.add('dropdown--active');
      if (arrow) arrow.textContent = 'arrow_drop_up';
      if (btn) btn.setAttribute('aria-expanded', 'true');
    } else {
      dropdown.classList.remove('dropdown--active');
      if (arrow) arrow.textContent = 'arrow_drop_down';
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * Close user dropdown
   */
  closeUserDropdown() {
    const dropdown = this.element?.querySelector('#user-dropdown');
    const arrow = this.element?.querySelector('#dropdown-arrow');
    const btn = this.element?.querySelector('#btn-user-menu');
    
    if (dropdown) {
      dropdown.classList.remove('dropdown--active');
      this.isUserMenuOpen = false;
      if (arrow) arrow.textContent = 'arrow_drop_down';
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    let confirmed = true;
    
    // Try NotificationService first
    if (typeof NotificationService !== 'undefined' && NotificationService.confirm) {
      confirmed = await NotificationService.confirm(
        'Apakah Anda yakin ingin keluar dari sistem?',
        'Konfirmasi Logout',
        { type: 'warning', confirmText: 'Keluar', confirmClass: 'btn-error' }
      );
    } else {
      // Fallback ke browser confirm
      confirmed = window.confirm('Apakah Anda yakin ingin keluar?');
    }
    
    if (confirmed) {
      try {
        // Logout via AuthService
        if (typeof AuthService !== 'undefined' && AuthService.logout) {
          await AuthService.logout();
        } else {
          // Fallback: clear storage directly
          localStorage.removeItem('asd_token');
          localStorage.removeItem('asd_auth_token');
          localStorage.removeItem('asd_user');
          localStorage.removeItem('asd_auth_user');
          localStorage.removeItem('asd_csrf');
          localStorage.removeItem('asd_csrf_token');
        }
        
        // Navigate to login
        if (typeof router !== 'undefined') {
          router.navigate('/login');
        } else {
          window.location.hash = '#/login';
        }
      } catch (error) {
        console.error('Logout failed:', error);
        if (typeof Toast !== 'undefined') {
          Toast.error('Gagal logout: ' + error.message);
        }
      }
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 905;
    
    if (wasMobile !== this.isMobile) {
      this.updateUserInfo();
      this.updateBreadcrumbsDisplay();
      
      // Close search on resize
      if (this.isSearchOpen && !this.isMobile) {
        this.toggleSearch();
      }
    }
  }

  /**
   * Update online status indicator
   */
  updateOnlineStatus(online) {
    const statusEl = this.element?.querySelector('#online-status');
    if (statusEl) {
      statusEl.textContent = online ? '● Online' : '○ Offline';
      statusEl.style.color = online ? 'var(--md-sys-color-success, #2E7D32)' : 'var(--md-sys-color-error, #BA1A1A)';
    }
  }

  /**
   * Set page title
   */
  setTitle(title) {
    const titleEl = this.element?.querySelector('#navbar-title');
    if (titleEl) {
      titleEl.textContent = title;
      titleEl.style.display = title ? 'block' : 'none';
    }
    document.title = title ? `${title} - ${window.APP_CONFIG?.APP_NAME || 'Arsip Surat Digital Enterprise'}` : (window.APP_CONFIG?.APP_NAME || 'Arsip Surat Digital Enterprise');
  }

  /**
   * Bind all events
   */
  bindEvents() {
    if (!this.element) return;

    // Sidebar toggle
    const sidebarToggle = this.element.querySelector('#sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleSidebar();
      });
    }

    // Search toggle
    const searchToggle = this.element.querySelector('#btn-search-toggle');
    if (searchToggle) {
      searchToggle.addEventListener('click', () => this.toggleSearch());
    }

    // Global search input
    const searchInput = this.element.querySelector('#global-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.toggleSearch();
        }
        if (e.key === 'Enter') {
          const query = e.target.value.trim();
          if (query.length >= 2) {
            this.toggleSearch();
            if (typeof router !== 'undefined') {
              router.navigate('/search', { query: { q: query } });
            }
          }
        }
      });
    }

    // Search clear button
    const clearBtn = this.element.querySelector('#search-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
          this.clearSearchResults();
          clearBtn.style.display = 'none';
        }
      });
    }

    // Notifications button
    const btnNotifications = this.element.querySelector('#btn-notifications');
    if (btnNotifications) {
      btnNotifications.addEventListener('click', () => this.showNotificationPanel());
    }

    // Theme toggle
    const btnTheme = this.element.querySelector('#btn-toggle-theme');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => this.toggleTheme());
    }

    // Fullscreen toggle
    const btnFullscreen = this.element.querySelector('#btn-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
    }

    // User menu toggle
    const btnUserMenu = this.element.querySelector('#btn-user-menu');
    if (btnUserMenu) {
      btnUserMenu.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleUserDropdown();
      });
    }

    // Logout button
    const btnLogout = this.element.querySelector('#btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleLogout();
      });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      // Close user dropdown
      if (this.isUserMenuOpen) {
        const userDropdown = this.element.querySelector('#user-dropdown');
        if (userDropdown && !userDropdown.contains(e.target)) {
          this.closeUserDropdown();
        }
      }
      
      // Close search dropdown
      const searchDropdown = this.element.querySelector('#search-dropdown');
      const searchInput = this.element.querySelector('#global-search-input');
      if (searchDropdown && searchDropdown.style.display !== 'none') {
        if (!searchDropdown.contains(e.target) && e.target !== searchInput) {
          this.clearSearchResults();
        }
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+F = Toggle search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        this.toggleSearch();
      }
      
      // Escape = Close search or dropdown
      if (e.key === 'Escape') {
        if (this.isSearchOpen) {
          this.toggleSearch();
        }
        if (this.isUserMenuOpen) {
          this.closeUserDropdown();
        }
      }
      
      // F11 = Fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        this.toggleFullscreen();
      }
    });

    // Fullscreen change event
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
      this.updateFullscreenIcon();
    });

    // Window resize
    window.addEventListener('resize', () => this.handleResize());

    // Online/Offline events
    window.addEventListener('online', () => this.updateOnlineStatus(true));
    window.addEventListener('offline', () => this.updateOnlineStatus(false));
  }

  /**
   * Toggle sidebar
   */
  toggleSidebar() {
    if (this.isMobile) {
      // Mobile: toggle sidebar overlay
      const sidebar = document.querySelector('.sidebar');
      const overlay = document.querySelector('.sidebar-overlay');
      
      if (sidebar) {
        const isOpen = sidebar.classList.contains('sidebar--mobile-open');
        
        if (isOpen) {
          sidebar.classList.remove('sidebar--mobile-open');
          if (overlay) overlay.classList.remove('sidebar-overlay--visible');
          document.body.style.overflow = '';
        } else {
          sidebar.classList.add('sidebar--mobile-open');
          if (overlay) overlay.classList.add('sidebar-overlay--visible');
          document.body.style.overflow = 'hidden';
        }
      }
    } else {
      // Desktop: toggle sidebar collapse
      if (typeof store !== 'undefined') {
        const currentState = store.getState('app.sidebarCollapsed');
        store.dispatch('app.sidebarCollapsed', !currentState);
      } else {
        // Fallback: toggle directly
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
          sidebar.classList.toggle('sidebar--collapsed');
          const mainContent = document.querySelector('.main-content');
          if (mainContent) {
            mainContent.classList.toggle('main-content--expanded');
          }
        }
      }
    }
  }

  /**
   * Destroy navbar component
   */
  destroy() {
    this.stopNotificationPolling();
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    
    // Clear element reference
    this.element = null;
    
    console.log('Navbar destroyed');
  }
}

// Create singleton instance
const NavbarComponent = new NavbarComponent();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    NavbarComponent.init();
  });
} else {
  // DOM already loaded
  setTimeout(() => {
    NavbarComponent.init();
  }, 100);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NavbarComponent };
}
