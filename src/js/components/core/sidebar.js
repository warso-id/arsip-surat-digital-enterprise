/**
 * SIDEBAR COMPONENT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Main navigation sidebar
 */

class SidebarComponent {
  constructor() {
    this.element = null;
    this.menuItems = [];
    this.activePath = null;
    this.expandedGroups = new Set();
  }
  
  /**
   * Initialize sidebar
   */
  init() {
    this.element = document.querySelector('.sidebar');
    if (!this.element) {
      this.createSidebar();
    }
    
    this.loadMenuItems();
    this.renderMenu();
    this.bindEvents();
    this.updateActiveState();
    
    // Subscribe to state changes
    store.subscribe('app.sidebarCollapsed', (collapsed) => {
      this.toggleCollapsed(collapsed);
    });
    
    store.subscribe('ui.currentRoute', (route) => {
      if (route) {
        this.setActive(route.path);
      }
    });
    
    // Load notification count
    this.updateNotificationBadge();
    
    console.log('✅ Sidebar initialized');
  }
  
  /**
   * Create sidebar element
   */
  createSidebar() {
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.id = 'sidebar';
    sidebar.innerHTML = `
      <div class="sidebar__header">
        <a href="#/" class="sidebar__logo">
          <img src="src/assets/icons/logo.svg" alt="Logo" class="sidebar__logo-img">
          <span class="sidebar__logo-text">Arsip Surat</span>
        </a>
      </div>
      <nav class="sidebar__nav" id="sidebar-nav"></nav>
      <div class="sidebar__footer">
        <button class="sidebar__nav-item" onclick="app.toggleTheme()" title="Toggle Theme">
          <span class="sidebar__nav-icon material-icons">brightness_medium</span>
          <span class="sidebar__nav-text">Toggle Theme</span>
        </button>
        <button class="sidebar__nav-item" onclick="router.navigate('/settings')" title="Settings">
          <span class="sidebar__nav-icon material-icons">settings</span>
          <span class="sidebar__nav-text">Pengaturan</span>
        </button>
      </div>
    `;
    
    const appShell = document.querySelector('.app-shell');
    if (appShell) {
      appShell.prepend(sidebar);
    } else {
      document.body.prepend(sidebar);
    }
    
    this.element = sidebar;
  }
  
  /**
   * Load menu items based on user role
   */
  loadMenuItems() {
    const userRole = AuthService.getUserRole() || 'staff';
    
    const allMenus = [
      {
        group: 'Utama',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'dashboard',
            path: '/dashboard',
            roles: ['admin', 'kabid', 'kasubag', 'staff', 'sekretaris']
          },
          {
            id: 'surat-masuk',
            label: 'Surat Masuk',
            icon: 'inbox',
            path: '/surat-masuk',
            roles: ['admin', 'kabid', 'kasubag', 'staff', 'sekretaris']
          },
          {
            id: 'surat-keluar',
            label: 'Surat Keluar',
            icon: 'outbox',
            path: '/surat-keluar',
            roles: ['admin', 'kabid', 'kasubag', 'staff', 'sekretaris']
          },
          {
            id: 'disposisi',
            label: 'Disposisi',
            icon: 'forward',
            path: '/disposisi',
            roles: ['admin', 'kabid', 'kasubag', 'staff', 'sekretaris'],
            badge: 'disposisi_pending'
          }
        ]
      },
      {
        group: 'Approval',
        items: [
          {
            id: 'approval',
            label: 'Approval',
            icon: 'check_circle',
            path: '/approval',
            roles: ['admin', 'kabid', 'sekretaris'],
            badge: 'approval_pending'
          },
          {
            id: 'agenda',
            label: 'Agenda Surat',
            icon: 'calendar_today',
            path: '/surat-keluar/agenda',
            roles: ['admin', 'kabid', 'sekretaris']
          }
        ]
      },
      {
        group: 'Manajemen',
        items: [
          {
            id: 'users',
            label: 'Pengguna',
            icon: 'people',
            path: '/users',
            roles: ['admin']
          },
          {
            id: 'master-data',
            label: 'Master Data',
            icon: 'storage',
            path: '/master-data',
            roles: ['admin']
          },
          {
            id: 'files',
            label: 'File Manager',
            icon: 'folder',
            path: '/files',
            roles: ['admin']
          }
        ]
      },
      {
        group: 'Laporan',
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
            id: 'settings',
            label: 'Pengaturan',
            icon: 'settings',
            path: '/settings',
            roles: ['admin']
          }
        ]
      }
    ];
    
    // Filter menus by role
    this.menuItems = allMenus
      .map(group => ({
        ...group,
        items: group.items.filter(item => item.roles.includes(userRole))
      }))
      .filter(group => group.items.length > 0);
  }
  
  /**
   * Render menu items
   */
  renderMenu() {
    const nav = this.element.querySelector('#sidebar-nav');
    if (!nav) return;
    
    nav.innerHTML = '';
    
    this.menuItems.forEach(group => {
      const groupEl = document.createElement('div');
      groupEl.className = 'sidebar__nav-group';
      
      const label = document.createElement('div');
      label.className = 'sidebar__nav-label';
      label.textContent = group.group;
      groupEl.appendChild(label);
      
      group.items.forEach(item => {
        const itemEl = this.createMenuItem(item);
        groupEl.appendChild(itemEl);
      });
      
      nav.appendChild(groupEl);
    });
  }
  
  /**
   * Create menu item element
   */
  createMenuItem(item) {
    const link = document.createElement('a');
    link.className = 'sidebar__nav-item';
    link.href = `#${item.path}`;
    link.setAttribute('data-path', item.path);
    link.setAttribute('data-id', item.id);
    link.title = item.label;
    
    link.innerHTML = `
      <span class="sidebar__nav-icon material-icons">${item.icon}</span>
      <span class="sidebar__nav-text">${item.label}</span>
      ${item.badge ? `<span class="sidebar__nav-badge" data-badge="${item.badge}" style="display:none">0</span>` : ''}
    `;
    
    link.addEventListener('click', (e) => {
      e.preventDefault();
      router.navigate(item.path);
      
      // Close sidebar on mobile
      if (window.innerWidth < 905) {
        store.dispatch('app.sidebarCollapsed', true);
      }
    });
    
    return link;
  }
  
  /**
   * Set active menu item
   */
  setActive(path) {
    this.activePath = path;
    
    // Remove active from all items
    this.element.querySelectorAll('.sidebar__nav-item--active').forEach(item => {
      item.classList.remove('sidebar__nav-item--active');
    });
    
    // Find and activate matching item
    const items = this.element.querySelectorAll('.sidebar__nav-item');
    items.forEach(item => {
      const itemPath = item.getAttribute('data-path');
      if (itemPath && path.startsWith(itemPath) && itemPath !== '/') {
        item.classList.add('sidebar__nav-item--active');
      } else if (itemPath === '/' && path === '/') {
        item.classList.add('sidebar__nav-item--active');
      }
    });
  }
  
  /**
   * Toggle collapsed state
   */
  toggleCollapsed(collapsed) {
    if (collapsed) {
      this.element.classList.add('sidebar--collapsed');
    } else {
      this.element.classList.remove('sidebar--collapsed');
    }
    
    localStorage.setItem(APP_CONFIG.UI.SIDEBAR.COLLAPSED_KEY, collapsed);
  }
  
  /**
   * Toggle sidebar
   */
  toggle() {
    const collapsed = store.getState('app.sidebarCollapsed');
    store.dispatch('app.sidebarCollapsed', !collapsed);
  }
  
  /**
   * Open sidebar (mobile)
   */
  open() {
    this.element.classList.add('sidebar--mobile-open');
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) overlay.classList.add('sidebar-overlay--visible');
  }
  
  /**
   * Close sidebar (mobile)
   */
  close() {
    this.element.classList.remove('sidebar--mobile-open');
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) overlay.classList.remove('sidebar-overlay--visible');
  }
  
  /**
   * Update notification badge
   */
  async updateNotificationBadge() {
    try {
      const response = await api.getUnreadCount();
      if (response.status === 'success') {
        const count = response.data.count || 0;
        const badges = this.element.querySelectorAll('[data-badge]');
        badges.forEach(badge => {
          if (count > 0) {
            badge.style.display = 'flex';
            badge.textContent = count > 99 ? '99+' : count;
          } else {
            badge.style.display = 'none';
          }
        });
      }
    } catch (error) {
      console.warn('Failed to update notification badge:', error);
    }
  }
  
  /**
   * Update specific badge
   */
  async updateBadge(type, count) {
    const badge = this.element.querySelector(`[data-badge="${type}"]`);
    if (badge) {
      if (count > 0) {
        badge.style.display = 'flex';
        badge.textContent = count > 99 ? '99+' : count;
      } else {
        badge.style.display = 'none';
      }
    }
  }
  
  /**
   * Bind events
   */
  bindEvents() {
    // Mobile overlay click
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.close());
    }
    
    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        this.toggle();
      }
    });
    
    // Window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth < 905) {
        store.dispatch('app.sidebarCollapsed', true);
      }
    });
  }
  
  /**
   * Refresh sidebar
   */
  refresh() {
    this.loadMenuItems();
    this.renderMenu();
    this.updateActiveState();
    this.updateNotificationBadge();
  }
  
  /**
   * Update active state
   */
  updateActiveState() {
    const currentRoute = store.getState('ui.currentRoute');
    if (currentRoute) {
      this.setActive(currentRoute.path);
    }
  }
}
