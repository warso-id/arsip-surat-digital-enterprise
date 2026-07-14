/**
 * ============================================
 * SIDEBAR COMPONENT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL SIDEBAR WITH NAVIGATION, USER INFO, BADGES
 * SIAP PRODUKSI - Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class SidebarComponent {
  constructor() {
    this.element = null;
    this.menuItems = [];
    this.activePath = null;
    this.isCollapsed = false;
    this.isMobileOpen = false;
    this.userRole = null;
    this.pendingBadges = {};
    this.initialized = false;
  }

  /**
   * Initialize sidebar component
   */
  init() {
    // Cari atau buat sidebar element
    this.element = document.querySelector('.sidebar');
    if (!this.element) {
      this.createSidebar();
    }

    // Load user role
    this.loadUserRole();
    
    // Load menu items berdasarkan role
    this.loadMenuItems();
    
    // Render menu
    this.renderMenu();
    
    // Render user info di sidebar footer
    this.renderUserInfo();
    
    // Bind semua events
    this.bindEvents();
    
    // Subscribe ke state changes
    this.subscribeToState();
    
    // Update active state
    this.updateActiveState();
    
    // Load collapsed state dari storage
    this.loadCollapsedState();
    
    // Load notification badges
    this.loadAllBadges();
    
    // Create overlay untuk mobile
    this.createOverlay();
    
    this.initialized = true;
    console.log('✅ Sidebar initialized');
  }

  /**
   * Create sidebar element if not exists
   */
  createSidebar() {
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.id = 'sidebar';
    sidebar.setAttribute('role', 'navigation');
    sidebar.setAttribute('aria-label', 'Navigasi Utama');
    sidebar.innerHTML = this.getSidebarTemplate();
    
    // Insert ke app-shell
    const appShell = document.querySelector('.app-shell');
    if (appShell) {
      appShell.prepend(sidebar);
    } else {
      const app = document.getElementById('app');
      if (app) {
        app.prepend(sidebar);
      } else {
        document.body.prepend(sidebar);
      }
    }
    
    this.element = sidebar;
  }

  /**
   * Get sidebar HTML template
   */
  getSidebarTemplate() {
    return `
      <!-- Sidebar Header with Logo -->
      <div class="sidebar__header">
        <a href="#/" class="sidebar__logo" title="Dashboard" aria-label="Ke Dashboard">
          <div class="sidebar__logo-img">
            <svg viewBox="0 0 100 100" width="36" height="36">
              <rect width="100" height="100" rx="20" fill="#1976D2"/>
              <text x="50" y="65" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="50" fill="white">AS</text>
            </svg>
          </div>
          <span class="sidebar__logo-text">Arsip Surat</span>
        </a>
      </div>
      
      <!-- Sidebar Navigation -->
      <nav class="sidebar__nav" id="sidebar-nav" aria-label="Menu Navigasi">
        <!-- Menu akan dirender oleh JavaScript -->
      </nav>
      
      <!-- Sidebar Footer dengan User Info -->
      <div class="sidebar__footer">
        <!-- User Info -->
        <div class="sidebar__user" id="sidebar-user" onclick="if(typeof router!=='undefined')router.navigate('/profile')" 
             title="Lihat Profil" role="button" tabindex="0" aria-label="Profil Pengguna">
          <div class="sidebar__user-avatar" id="sidebar-avatar">
            <span>A</span>
          </div>
          <div class="sidebar__user-info">
            <div class="sidebar__user-name" id="sidebar-user-name">Admin</div>
            <div class="sidebar__user-role" id="sidebar-user-role">Administrator</div>
          </div>
        </div>
        
        <!-- Footer Actions -->
        <div class="sidebar__footer-actions">
          <button class="sidebar__nav-item" id="btn-toggle-theme-sidebar" 
                  title="Ganti Tema" aria-label="Toggle Theme">
            <span class="sidebar__nav-icon material-icons">brightness_medium</span>
            <span class="sidebar__nav-text">Ganti Tema</span>
          </button>
          
          <a class="sidebar__nav-item" href="#/settings" 
             title="Pengaturan" aria-label="Pengaturan"
             onclick="if(typeof router!=='undefined'){event.preventDefault();router.navigate('/settings')}">
            <span class="sidebar__nav-icon material-icons">settings</span>
            <span class="sidebar__nav-text">Pengaturan</span>
          </a>
          
          <button class="sidebar__nav-item" id="btn-logout-sidebar" 
                  title="Keluar" aria-label="Logout">
            <span class="sidebar__nav-icon material-icons" style="color:var(--md-sys-color-error, #BA1A1A)">logout</span>
            <span class="sidebar__nav-text" style="color:var(--md-sys-color-error, #BA1A1A)">Keluar</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Create overlay untuk mobile
   */
  createOverlay() {
    // Cek apakah overlay sudah ada
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      document.body.appendChild(overlay);
      
      // Klik overlay untuk menutup sidebar mobile
      overlay.addEventListener('click', () => this.closeMobile());
    }
  }

  /**
   * Load user role dari berbagai sumber
   */
  loadUserRole() {
    try {
      // Coba dari AuthService
      if (typeof AuthService !== 'undefined' && AuthService.getUserRole) {
        this.userRole = AuthService.getUserRole();
      } 
      // Coba dari AuthService.getUser
      else if (typeof AuthService !== 'undefined' && AuthService.getUser) {
        const user = AuthService.getUser();
        this.userRole = user?.role || 'staff';
      }
      // Fallback ke Storage
      else if (typeof Storage !== 'undefined') {
        const user = Storage.getJSON('asd_user') || Storage.getJSON('asd_auth_user');
        this.userRole = user?.role || 'staff';
      }
      // Fallback ke localStorage
      else {
        const userData = localStorage.getItem('asd_user') || localStorage.getItem('asd_auth_user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            this.userRole = user?.role || 'staff';
          } catch (e) {
            this.userRole = 'staff';
          }
        } else {
          this.userRole = 'staff';
        }
      }
    } catch (e) {
      console.warn('Failed to load user role:', e);
      this.userRole = 'staff';
    }
  }

  /**
   * Load menu items berdasarkan user role
   */
  loadMenuItems() {
    const role = this.userRole || 'staff';
    
    // Definisi semua menu
    const allMenus = [
      {
        group: 'Utama',
        showLabel: true,
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'dashboard',
            path: '/',
            roles: ['admin', 'kabid', 'kasubag', 'staff', 'sekretaris'],
            exact: true
          },
          {
            id: 'surat-masuk',
            label: 'Surat Masuk',
            icon: 'inbox',
            path: '/surat-masuk',
            roles: ['admin', 'kabid', 'kasubag', 'staff', 'sekretaris'],
            badge: 'sm_pending'
          },
          {
            id: 'surat-keluar',
            label: 'Surat Keluar',
            icon: 'outbox',
            path: '/surat-keluar',
            roles: ['admin', 'kabid', 'kasubag', 'staff', 'sekretaris'],
            badge: 'sk_pending'
          },
          {
            id: 'disposisi',
            label: 'Disposisi',
            icon: 'forward',
            path: '/disposisi',
            roles: ['admin', 'kabid', 'kasubag', 'staff', 'sekretaris'],
            badge: 'disp_pending'
          }
        ]
      },
      {
        group: 'Approval & Agenda',
        showLabel: true,
        items: [
          {
            id: 'approval',
            label: 'Approval',
            icon: 'check_circle',
            path: '/approval',
            roles: ['admin', 'kabid', 'sekretaris'],
            badge: 'appr_pending'
          },
          {
            id: 'agenda',
            label: 'Agenda Surat',
            icon: 'calendar_today',
            path: '/surat-keluar/agenda',
            roles: ['admin', 'kabid', 'sekretaris']
          },
          {
            id: 'kalender-disposisi',
            label: 'Kalender Disposisi',
            icon: 'event',
            path: '/disposisi/kalender',
            roles: ['admin', 'kabid', 'kasubag', 'staff']
          }
        ]
      },
      {
        group: 'Manajemen',
        showLabel: true,
        items: [
          {
            id: 'users',
            label: 'Pengguna',
            icon: 'people',
            path: '/users',
            roles: ['admin']
          },
          {
            id: 'files',
            label: 'File Manager',
            icon: 'folder',
            path: '/files',
            roles: ['admin', 'kabid']
          }
        ]
      },
      {
        group: 'Laporan & Pencarian',
        showLabel: true,
        items: [
          {
            id: 'reports',
            label: 'Laporan',
            icon: 'assessment',
            path: '/reports',
            roles: ['admin', 'kabid']
          },
          {
            id: 'search',
            label: 'Pencarian',
            icon: 'search',
            path: '/search',
            roles: ['admin', 'kabid', 'kasubag', 'staff', 'sekretaris']
          }
        ]
      },
      {
        group: 'Sistem',
        showLabel: true,
        items: [
          {
            id: 'audit-log',
            label: 'Audit Log',
            icon: 'history',
            path: '/audit-log',
            roles: ['admin']
          },
          {
            id: 'blockchain',
            label: 'Blockchain',
            icon: 'link',
            path: '/blockchain',
            roles: ['admin']
          },
          {
            id: 'backup',
            label: 'Backup & Restore',
            icon: 'backup',
            path: '/settings/backup',
            roles: ['admin']
          }
        ]
      }
    ];

    // Filter menu berdasarkan role user
    this.menuItems = allMenus
      .map(group => ({
        ...group,
        items: group.items.filter(item => item.roles.includes(role))
      }))
      .filter(group => group.items.length > 0);
  }

  /**
   * Render menu items ke sidebar
   */
  renderMenu() {
    const nav = this.element?.querySelector('#sidebar-nav');
    if (!nav) return;

    nav.innerHTML = '';

    this.menuItems.forEach((group, groupIndex) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'sidebar__nav-group';
      groupEl.setAttribute('data-group-index', groupIndex);

      // Group label
      if (group.showLabel !== false) {
        const label = document.createElement('div');
        label.className = 'sidebar__nav-label';
        label.textContent = group.group;
        groupEl.appendChild(label);
      }

      // Menu items
      group.items.forEach((item, itemIndex) => {
        const itemEl = this.createMenuItem(item, groupIndex, itemIndex);
        groupEl.appendChild(itemEl);
      });

      nav.appendChild(groupEl);
    });
  }

  /**
   * Create single menu item element
   */
  createMenuItem(item, groupIndex, itemIndex) {
    const link = document.createElement('a');
    link.className = 'sidebar__nav-item';
    link.href = `#${item.path}`;
    link.setAttribute('data-path', item.path);
    link.setAttribute('data-id', item.id);
    link.setAttribute('data-group', groupIndex);
    link.setAttribute('data-index', itemIndex);
    link.title = item.label;
    link.setAttribute('role', 'menuitem');
    
    // Icon
    const icon = document.createElement('span');
    icon.className = 'sidebar__nav-icon material-icons';
    icon.textContent = item.icon;
    link.appendChild(icon);
    
    // Text
    const text = document.createElement('span');
    text.className = 'sidebar__nav-text';
    text.textContent = item.label;
    link.appendChild(text);
    
    // Badge (jika ada)
    if (item.badge) {
      const badge = document.createElement('span');
      badge.className = 'sidebar__nav-badge';
      badge.setAttribute('data-badge', item.badge);
      badge.style.display = 'none';
      badge.textContent = '0';
      link.appendChild(badge);
    }
    
    // Submenu indicator (jika ada children)
    if (item.children && item.children.length > 0) {
      const arrow = document.createElement('span');
      arrow.className = 'sidebar__nav-arrow material-icons';
      arrow.textContent = 'expand_more';
      arrow.style.cssText = 'margin-left:auto;font-size:18px;transition:transform 0.2s';
      link.appendChild(arrow);
    }
    
    // Click handler
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Jika ada children, toggle submenu
      if (item.children && item.children.length > 0) {
        this.toggleSubmenu(link, item);
        return;
      }
      
      // Navigasi ke path
      if (typeof router !== 'undefined') {
        router.navigate(item.path);
      } else {
        window.location.hash = item.path;
      }
      
      // Set active
      this.setActive(item.path);
      
      // Close sidebar on mobile
      if (window.innerWidth < 905) {
        this.closeMobile();
      }
      
      // Track analytics
      if (typeof AnalyticsService !== 'undefined') {
        AnalyticsService.trackEvent('sidebar', 'navigate', item.label);
      }
    });
    
    // Keyboard handler
    link.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        link.click();
      }
    });
    
    return link;
  }

  /**
   * Toggle submenu expand/collapse
   */
  toggleSubmenu(parentLink, item) {
    const parentItem = parentLink.closest('.sidebar__nav-item');
    const submenu = parentLink.nextElementSibling;
    const arrow = parentLink.querySelector('.sidebar__nav-arrow');
    
    if (!submenu || !submenu.classList.contains('sidebar__submenu')) {
      // Buat submenu jika belum ada
      const newSubmenu = document.createElement('div');
      newSubmenu.className = 'sidebar__submenu';
      newSubmenu.style.cssText = 'overflow:hidden;max-height:0;transition:max-height 0.3s ease';
      
      item.children.forEach(child => {
        const childLink = document.createElement('a');
        childLink.className = 'sidebar__nav-item sidebar__nav-item--child';
        childLink.href = `#${child.path}`;
        childLink.innerHTML = `
          <span class="sidebar__nav-icon material-icons">${child.icon || 'circle'}</span>
          <span class="sidebar__nav-text">${child.label}</span>
        `;
        childLink.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof router !== 'undefined') {
            router.navigate(child.path);
          }
          this.setActive(child.path);
          if (window.innerWidth < 905) this.closeMobile();
        });
        newSubmenu.appendChild(childLink);
      });
      
      parentLink.parentElement.insertBefore(newSubmenu, parentLink.nextElementSibling);
      
      // Animate open
      requestAnimationFrame(() => {
        newSubmenu.style.maxHeight = newSubmenu.scrollHeight + 'px';
        if (arrow) arrow.style.transform = 'rotate(180deg)';
      });
    } else {
      // Toggle existing submenu
      if (submenu.style.maxHeight === '0px' || !submenu.style.maxHeight) {
        submenu.style.maxHeight = submenu.scrollHeight + 'px';
        if (arrow) arrow.style.transform = 'rotate(180deg)';
      } else {
        submenu.style.maxHeight = '0px';
        if (arrow) arrow.style.transform = 'rotate(0deg)';
      }
    }
  }

  /**
   * Set active menu item berdasarkan path
   */
  setActive(path) {
    this.activePath = path;
    
    // Remove active class dari semua item
    const allItems = this.element?.querySelectorAll('.sidebar__nav-item--active');
    allItems?.forEach(item => item.classList.remove('sidebar__nav-item--active'));
    
    // Cari dan aktifkan item yang cocok
    const allNavItems = this.element?.querySelectorAll('.sidebar__nav-item');
    if (!allNavItems) return;
    
    let bestMatch = null;
    let bestMatchLength = 0;
    
    allNavItems.forEach(item => {
      const itemPath = item.getAttribute('data-path');
      if (!itemPath) return;
      
      // Exact match (paling prioritas)
      if (itemPath === path) {
        bestMatch = item;
        bestMatchLength = itemPath.length;
        return;
      }
      
      // Root path special case
      if (path === '/' && itemPath === '/') {
        bestMatch = item;
        bestMatchLength = 1;
        return;
      }
      
      // Prefix match (untuk nested routes)
      if (path.startsWith(itemPath + '/') || (itemPath !== '/' && path.startsWith(itemPath))) {
        if (itemPath.length > bestMatchLength) {
          bestMatch = item;
          bestMatchLength = itemPath.length;
        }
      }
    });
    
    // Aktifkan best match
    if (bestMatch) {
      bestMatch.classList.add('sidebar__nav-item--active');
      
      // Expand parent submenu jika ada
      const parentSubmenu = bestMatch.closest('.sidebar__submenu');
      if (parentSubmenu) {
        parentSubmenu.style.maxHeight = parentSubmenu.scrollHeight + 'px';
        const parentLink = parentSubmenu.previousElementSibling;
        if (parentLink) {
          parentLink.classList.add('sidebar__nav-item--active');
          const arrow = parentLink.querySelector('.sidebar__nav-arrow');
          if (arrow) arrow.style.transform = 'rotate(180deg)';
        }
      }
      
      // Scroll item into view
      bestMatch.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Toggle sidebar collapsed state (desktop)
   */
  toggleCollapsed(collapsed) {
    if (collapsed === undefined) {
      collapsed = !this.isCollapsed;
    }
    
    this.isCollapsed = collapsed;
    
    if (collapsed) {
      this.element?.classList.add('sidebar--collapsed');
    } else {
      this.element?.classList.remove('sidebar--collapsed');
    }
    
    // Update main content margin
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      if (collapsed) {
        mainContent.classList.add('main-content--expanded');
      } else {
        mainContent.classList.remove('main-content--expanded');
      }
    }
    
    // Save state
    try {
      localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0');
    } catch (e) {}
    
    // Update store
    if (typeof store !== 'undefined') {
      store.dispatch('app.sidebarCollapsed', collapsed);
    }
  }

  /**
   * Toggle sidebar (smart toggle)
   */
  toggle() {
    if (window.innerWidth < 905) {
      // Mobile: toggle overlay
      if (this.isMobileOpen) {
        this.closeMobile();
      } else {
        this.openMobile();
      }
    } else {
      // Desktop: toggle collapse
      this.toggleCollapsed(!this.isCollapsed);
    }
  }

  /**
   * Open sidebar mobile
   */
  openMobile() {
    this.element?.classList.add('sidebar--mobile-open');
    this.isMobileOpen = true;
    
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
      overlay.classList.add('sidebar-overlay--visible');
      overlay.setAttribute('aria-hidden', 'false');
    }
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Focus sidebar
    setTimeout(() => {
      const firstItem = this.element?.querySelector('.sidebar__nav-item');
      if (firstItem) firstItem.focus();
    }, 300);
  }

  /**
   * Close sidebar mobile
   */
  closeMobile() {
    this.element?.classList.remove('sidebar--mobile-open');
    this.isMobileOpen = false;
    
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
      overlay.classList.remove('sidebar-overlay--visible');
      overlay.setAttribute('aria-hidden', 'true');
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
  }

  /**
   * Load collapsed state dari localStorage
   */
  loadCollapsedState() {
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved === '1') {
        this.toggleCollapsed(true);
      } else if (saved === '0') {
        this.toggleCollapsed(false);
      } else {
        // Default: collapsed on tablet, expanded on desktop
        const shouldCollapse = window.innerWidth >= 906 && window.innerWidth < 1240;
        this.toggleCollapsed(shouldCollapse);
      }
    } catch (e) {
      // Default state
    }
  }

  /**
   * Render user info di sidebar footer
   */
  renderUserInfo() {
    let user = null;
    
    try {
      if (typeof AuthService !== 'undefined' && AuthService.getUser) {
        user = AuthService.getUser();
      } else if (typeof Storage !== 'undefined') {
        user = Storage.getJSON('asd_user') || Storage.getJSON('asd_auth_user');
      } else {
        const userData = localStorage.getItem('asd_user') || localStorage.getItem('asd_auth_user');
        if (userData) {
          try { user = JSON.parse(userData); } catch (e) {}
        }
      }
    } catch (e) {}
    
    if (!user) return;
    
    const avatar = this.element?.querySelector('#sidebar-avatar span');
    const name = this.element?.querySelector('#sidebar-user-name');
    const role = this.element?.querySelector('#sidebar-user-role');
    
    if (avatar) {
      const displayName = user.namaLengkap || user.username || 'User';
      avatar.textContent = this.getInitials(displayName);
    }
    if (name) {
      name.textContent = user.namaLengkap || user.username || 'User';
      name.title = user.namaLengkap || user.username || '';
    }
    if (role) {
      const roleLabels = {
        'admin': 'Administrator',
        'kabid': 'Kepala Bidang',
        'kasubag': 'Kepala Sub Bagian',
        'staff': 'Staff',
        'sekretaris': 'Sekretaris'
      };
      role.textContent = roleLabels[user.role] || user.role || '';
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
   * Subscribe ke state changes
   */
  subscribeToState() {
    if (typeof store === 'undefined' || !store.subscribe) return;
    
    // Sidebar collapsed state
    store.subscribe('app.sidebarCollapsed', (collapsed) => {
      if (collapsed !== this.isCollapsed) {
        this.toggleCollapsed(collapsed);
      }
    });
    
    // Route changes untuk update active state
    store.subscribe('ui.currentRoute', (route) => {
      if (route && route.path) {
        this.setActive(route.path);
      }
    });
    
    // User changes untuk refresh menu
    store.subscribe('auth.user', (user) => {
      if (user && user.role !== this.userRole) {
        this.userRole = user.role;
        this.loadMenuItems();
        this.renderMenu();
        this.renderUserInfo();
      }
    });
  }

  /**
   * Update active state dari current route
   */
  updateActiveState() {
    try {
      if (typeof store !== 'undefined') {
        const currentRoute = store.getState('ui.currentRoute');
        if (currentRoute && currentRoute.path) {
          this.setActive(currentRoute.path);
        }
      } else {
        // Fallback: gunakan hash
        const hash = window.location.hash.slice(1) || '/';
        this.setActive(hash);
      }
    } catch (e) {}
  }

  /**
   * Load semua notification badges
   */
  async loadAllBadges() {
    // Load disposisi pending
    this.loadBadge('disp_pending', 'disposisi.list', { status: 'pending' });
    // Load approval pending
    this.loadBadge('appr_pending', 'approval.list', { status: 'pending' });
  }

  /**
   * Load single badge count
   */
  async loadBadge(badgeName, action, params) {
    try {
      let count = 0;
      
      if (typeof API !== 'undefined') {
        const response = await API.get(action, { ...params, limit: 1 });
        if (response.status === 'success') {
          count = response.data?.total || response.data?.pagination?.total || 0;
        }
      }
      
      this.updateBadge(badgeName, count);
    } catch (error) {
      // Silent fail untuk badges
    }
  }

  /**
   * Update badge count
   */
  updateBadge(type, count) {
    const badge = this.element?.querySelector(`[data-badge="${type}"]`);
    if (!badge) return;
    
    this.pendingBadges[type] = count;
    
    if (count > 0) {
      badge.style.display = 'flex';
      badge.textContent = count > 99 ? '99+' : String(count);
      badge.title = `${count} item pending`;
    } else {
      badge.style.display = 'none';
    }
  }

  /**
   * Update notification badge
   */
  async updateNotificationBadge() {
    try {
      let count = 0;
      
      if (typeof API !== 'undefined') {
        const response = await API.get('notifikasi.unreadCount');
        if (response.status === 'success') {
          count = response.data?.count || 0;
        }
      }
      
      const badges = this.element?.querySelectorAll('[data-badge]');
      badges?.forEach(badge => {
        if (count > 0) {
          badge.style.display = 'flex';
          badge.textContent = count > 99 ? '99+' : String(count);
        } else {
          badge.style.display = 'none';
        }
      });
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Refresh sidebar (reload menu dan badges)
   */
  refresh() {
    this.loadUserRole();
    this.loadMenuItems();
    this.renderMenu();
    this.renderUserInfo();
    this.updateActiveState();
    this.loadAllBadges();
    this.updateNotificationBadge();
  }

  /**
   * Bind semua event listeners
   */
  bindEvents() {
    if (!this.element) return;

    // Mobile overlay click (sudah di-handle di createOverlay)
    
    // Theme toggle di sidebar
    const btnTheme = this.element.querySelector('#btn-toggle-theme-sidebar');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(currentTheme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('app-theme', nextTheme);
        
        const themeIcons = {
          'light': 'light_mode',
          'dark': 'dark_mode',
          'auto': 'brightness_auto'
        };
        btnTheme.querySelector('.material-icons').textContent = themeIcons[nextTheme] || 'brightness_medium';
        
        if (typeof Toast !== 'undefined') {
          const labels = { 'light': 'Mode Terang', 'dark': 'Mode Gelap', 'auto': 'Auto' };
          Toast.info(`Tema: ${labels[nextTheme]}`);
        }
      });
    }
    
    // Logout button di sidebar
    const btnLogout = this.element.querySelector('#btn-logout-sidebar');
    if (btnLogout) {
      btnLogout.addEventListener('click', async () => {
        let confirmed = true;
        
        if (typeof NotificationService !== 'undefined' && NotificationService.confirm) {
          confirmed = await NotificationService.confirm(
            'Apakah Anda yakin ingin keluar?',
            'Konfirmasi Logout'
          );
        } else {
          confirmed = window.confirm('Apakah Anda yakin ingin keluar?');
        }
        
        if (confirmed) {
          try {
            if (typeof AuthService !== 'undefined' && AuthService.logout) {
              await AuthService.logout();
            } else {
              localStorage.removeItem('asd_token');
              localStorage.removeItem('asd_auth_token');
              localStorage.removeItem('asd_user');
              localStorage.removeItem('asd_auth_user');
              localStorage.removeItem('asd_csrf');
            }
            
            if (typeof router !== 'undefined') {
              router.navigate('/login');
            } else {
              window.location.hash = '#/login';
            }
          } catch (error) {
            console.error('Logout failed:', error);
            if (typeof Toast !== 'undefined') {
              Toast.error('Gagal logout');
            }
          }
        }
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+B = Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        this.toggle();
      }
      
      // Escape = Close mobile sidebar
      if (e.key === 'Escape' && this.isMobileOpen) {
        this.closeMobile();
      }
    });

    // Window resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (window.innerWidth < 905) {
          // Mobile: close if open, ensure not collapsed
          if (this.isCollapsed) this.toggleCollapsed(false);
        } else if (window.innerWidth >= 906 && window.innerWidth < 1240) {
          // Tablet: auto-collapse
          if (!this.isCollapsed) this.toggleCollapsed(true);
        } else {
          // Desktop: auto-expand
          if (this.isCollapsed) this.toggleCollapsed(false);
        }
      }, 200);
    });

    // Swipe gesture untuk mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      
      // Swipe right dari tepi kiri untuk membuka sidebar
      if (diffX > 80 && Math.abs(diffY) < 50 && touchStartX < 30) {
        if (window.innerWidth < 905 && !this.isMobileOpen) {
          this.openMobile();
        }
      }
      
      // Swipe left untuk menutup sidebar
      if (diffX < -50 && Math.abs(diffY) < 50 && this.isMobileOpen) {
        this.closeMobile();
      }
    });
  }

  /**
   * Destroy sidebar component
   */
  destroy() {
    // Remove event listeners
    this.element = null;
    this.menuItems = [];
    console.log('Sidebar destroyed');
  }
}

// Create singleton instance
const SidebarComponent = new SidebarComponent();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      SidebarComponent.init();
    }, 100);
  });
} else {
  // DOM already loaded
  setTimeout(() => {
    SidebarComponent.init();
  }, 100);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SidebarComponent };
}
