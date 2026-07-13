/**
 * NAVBAR COMPONENT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Top navigation bar
 */

class NavbarComponent {
  constructor() {
    this.element = null;
    this.searchTimeout = null;
  }
  
  /**
   * Initialize navbar
   */
  init() {
    this.element = document.querySelector('.navbar');
    if (!this.element) {
      this.createNavbar();
    }
    
    this.bindEvents();
    this.updateUserInfo();
    
    // Subscribe to state changes
    store.subscribe('auth.user', (user) => {
      this.updateUserInfo();
    });
    
    store.subscribe('ui.breadcrumbs', (breadcrumbs) => {
      this.updateBreadcrumbs(breadcrumbs);
    });
    
    console.log('✅ Navbar initialized');
  }
  
  /**
   * Create navbar element
   */
  createNavbar() {
    const navbar = document.createElement('header');
    navbar.className = 'navbar';
    navbar.id = 'navbar';
    navbar.innerHTML = `
      <button class="navbar__toggle" id="sidebar-toggle" title="Toggle Sidebar">
        <span class="material-icons">menu</span>
      </button>
      
      <nav class="navbar__breadcrumb" id="navbar-breadcrumb"></nav>
      
      <div class="navbar__spacer"></div>
      
      <div class="navbar__actions">
        <!-- Search -->
        <div class="search-input" id="navbar-search" style="display:none">
          <span class="search-input__icon material-icons">search</span>
          <input type="text" class="form-input" placeholder="Cari..." id="global-search-input">
        </div>
        
        <button class="navbar__action-btn" id="btn-search-toggle" title="Search (Ctrl+F)">
          <span class="material-icons">search</span>
        </button>
        
        <!-- Notifications -->
        <button class="navbar__action-btn" id="btn-notifications" title="Notifications">
          <span class="material-icons">notifications</span>
          <span class="navbar__action-badge" id="notification-badge" style="display:none"></span>
        </button>
        
        <!-- Fullscreen -->
        <button class="navbar__action-btn" id="btn-fullscreen" title="Fullscreen">
          <span class="material-icons">fullscreen</span>
        </button>
        
        <!-- User Menu -->
        <div class="dropdown" id="user-dropdown">
          <div class="navbar__user-menu" id="btn-user-menu">
            <div class="navbar__user-avatar" id="user-avatar">A</div>
            <div class="navbar__user-info">
              <span class="navbar__user-name" id="user-name">Admin</span>
              <span class="navbar__user-role" id="user-role">Administrator</span>
            </div>
            <span class="material-icons">arrow_drop_down</span>
          </div>
          <div class="dropdown__menu">
            <div class="dropdown__header">Akun Saya</div>
            <a class="dropdown__item" href="#/profile">
              <span class="material-icons">person</span>
              Profil
            </a>
            <a class="dropdown__item" href="#/settings">
              <span class="material-icons">settings</span>
              Pengaturan
            </a>
            <div class="dropdown__divider"></div>
            <a class="dropdown__item" href="#/settings/security">
              <span class="material-icons">security</span>
              Keamanan
            </a>
            <a class="dropdown__item" href="#/activity-log">
              <span class="material-icons">history</span>
              Aktivitas
            </a>
            <div class="dropdown__divider"></div>
            <a class="dropdown__item dropdown__item--danger" id="btn-logout">
              <span class="material-icons">logout</span>
              Keluar
            </a>
          </div>
        </div>
      </div>
    `;
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.prepend(navbar);
    }
    
    this.element = navbar;
  }
  
  /**
   * Update user info in navbar
   */
  updateUserInfo() {
    const user = AuthService.getUser();
    if (!user) return;
    
    const avatar = this.element.querySelector('#user-avatar');
    const name = this.element.querySelector('#user-name');
    const role = this.element.querySelector('#user-role');
    
    if (avatar) {
      avatar.textContent = (user.namaLengkap || user.username).charAt(0).toUpperCase();
    }
    if (name) {
      name.textContent = user.namaLengkap || user.username;
    }
    if (role) {
      const roleLabels = {
        'admin': 'Administrator',
        'kabid': 'Kepala Bidang',
        'kasubag': 'Kepala Sub Bagian',
        'staff': 'Staff',
        'sekretaris': 'Sekretaris'
      };
      role.textContent = roleLabels[user.role] || user.role;
    }
  }
  
  /**
   * Update breadcrumbs
   */
  updateBreadcrumbs(breadcrumbs) {
    const breadcrumbEl = this.element.querySelector('#navbar-breadcrumb');
    if (!breadcrumbEl || !breadcrumbs) return;
    
    breadcrumbEl.innerHTML = breadcrumbs.map((crumb, index) => {
      if (crumb.active) {
        return `<span class="navbar__breadcrumb-item navbar__breadcrumb-item--active">${crumb.label}</span>`;
      }
      return `
        <a class="navbar__breadcrumb-item" href="#${crumb.path}">${crumb.label}</a>
        <span class="navbar__breadcrumb-separator material-icons">chevron_right</span>
      `;
    }).join('');
  }
  
  /**
   * Toggle search bar
   */
  toggleSearch() {
    const searchEl = this.element.querySelector('#navbar-search');
    const input = this.element.querySelector('#global-search-input');
    
    if (searchEl.style.display === 'none') {
      searchEl.style.display = 'block';
      input.focus();
    } else {
      searchEl.style.display = 'none';
      input.value = '';
    }
  }
  
  /**
   * Handle global search
   */
  handleSearch(query) {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      if (query.length >= 2) {
        router.navigate('/search', { query: { q: query } });
      }
    }, 500);
  }
  
  /**
   * Toggle fullscreen
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Fullscreen not supported:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }
  
  /**
   * Update notification badge
   */
  updateNotificationBadge(count) {
    const badge = this.element.querySelector('#notification-badge');
    if (badge) {
      if (count > 0) {
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }
  }
  
  /**
   * Toggle user dropdown
   */
  toggleUserDropdown() {
    const dropdown = this.element.querySelector('#user-dropdown');
    dropdown.classList.toggle('dropdown--active');
  }
  
  /**
   * Handle logout
   */
  async handleLogout() {
    const confirmed = await NotificationService.confirm(
      'Apakah Anda yakin ingin keluar?',
      'Konfirmasi Logout'
    );
    
    if (confirmed) {
      await AuthService.logout();
      router.navigate('/login');
    }
  }
  
  /**
   * Bind events
   */
  bindEvents() {
    // Sidebar toggle
    const sidebarToggle = this.element.querySelector('#sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        if (window.innerWidth < 905) {
          const sidebar = document.querySelector('.sidebar');
          if (sidebar.classList.contains('sidebar--mobile-open')) {
            document.querySelector('.sidebar').classList.remove('sidebar--mobile-open');
          } else {
            document.querySelector('.sidebar').classList.add('sidebar--mobile-open');
          }
        } else {
          store.dispatch('app.sidebarCollapsed', !store.getState('app.sidebarCollapsed'));
        }
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
          router.navigate('/search', { query: { q: e.target.value } });
        }
      });
    }
    
    // Notifications
    const btnNotifications = this.element.querySelector('#btn-notifications');
    if (btnNotifications) {
      btnNotifications.addEventListener('click', () => {
        // Show notifications panel
        NotificationService.showPanel();
      });
    }
    
    // Fullscreen
    const btnFullscreen = this.element.querySelector('#btn-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
    }
    
    // User menu
    const btnUserMenu = this.element.querySelector('#btn-user-menu');
    if (btnUserMenu) {
      btnUserMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleUserDropdown();
      });
    }
    
    // Logout
    const btnLogout = this.element.querySelector('#btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }
    
    // Close dropdowns on outside click
    document.addEventListener('click', () => {
      const dropdown = this.element.querySelector('#user-dropdown');
      if (dropdown) {
        dropdown.classList.remove('dropdown--active');
      }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        this.toggleSearch();
      }
    });
    
    // Fullscreen change
    document.addEventListener('fullscreenchange', () => {
      const icon = this.element.querySelector('#btn-fullscreen .material-icons');
      if (icon) {
        icon.textContent = document.fullscreenElement ? 'fullscreen_exit' : 'fullscreen';
      }
    });
  }
}
