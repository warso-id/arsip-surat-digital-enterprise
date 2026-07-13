/**
 * NOTIFICATION SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Handles toast notifications, push notifications, and alerts
 */

class NotificationService {
  constructor() {
    this.toasts = [];
    this.maxToasts = 5;
    this.defaultDuration = APP_CONFIG.UI.TOAST.DURATION;
    this.position = APP_CONFIG.UI.TOAST.POSITION;
    this.toastContainer = null;
    this.confirmCallback = null;
    this.pushSubscription = null;
  }
  
  /**
   * Initialize notification service
   */
  init() {
    this.createToastContainer();
    this.setupPushNotifications();
    
    console.log('✅ Notification Service initialized');
  }
  
  /**
   * Create toast container
   */
  createToastContainer() {
    if (document.getElementById('toast-container')) return;
    
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = `toast-container toast-container--${this.position}`;
    document.body.appendChild(container);
    
    this.toastContainer = container;
  }
  
  /**
   * Show toast notification
   */
  show(message, type = 'info', options = {}) {
    const {
      duration = this.defaultDuration,
      action = null,
      icon = null,
      dismissible = true,
      id = null
    } = options;
    
    // Limit number of toasts
    if (this.toasts.length >= this.maxToasts) {
      this.dismiss(this.toasts[0].id);
    }
    
    const toastId = id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const toast = {
      id: toastId,
      message,
      type,
      duration,
      action,
      icon: icon || this.getDefaultIcon(type),
      dismissible,
      element: null,
      timer: null
    };
    
    // Create toast element
    toast.element = this.createToastElement(toast);
    
    // Add to container
    this.toastContainer.appendChild(toast.element);
    
    // Add to tracking array
    this.toasts.push(toast);
    
    // Animate in
    requestAnimationFrame(() => {
      toast.element.classList.add('toast--visible');
    });
    
    // Auto dismiss
    if (duration > 0) {
      toast.timer = setTimeout(() => {
        this.dismiss(toastId);
      }, duration);
    }
    
    // Play sound
    this.playSound(type);
    
    // Add to store
    const currentToasts = store.getState('ui.toasts') || [];
    store.dispatch('ui.toasts', [...currentToasts, { id: toastId, message, type }]);
    
    return toastId;
  }
  
  /**
   * Show success toast
   */
  success(message, options = {}) {
    return this.show(message, 'success', options);
  }
  
  /**
   * Show error toast
   */
  error(message, options = {}) {
    return this.show(message, 'error', options);
  }
  
  /**
   * Show warning toast
   */
  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }
  
  /**
   * Show info toast
   */
  info(message, options = {}) {
    return this.show(message, 'info', options);
  }
  
  /**
   * Create toast element
   */
  createToastElement(toast) {
    const element = document.createElement('div');
    element.className = `toast toast--${toast.type}`;
    element.setAttribute('data-toast-id', toast.id);
    element.setAttribute('role', 'alert');
    element.setAttribute('aria-live', 'polite');
    
    element.innerHTML = `
      <div class="toast__icon">
        <span class="material-icons">${toast.icon}</span>
      </div>
      <div class="toast__content">
        <p class="toast__message">${toast.message}</p>
        ${toast.action ? `
          <button class="toast__action" onclick="window._toastAction('${toast.id}')">
            ${toast.action.label}
          </button>
        ` : ''}
      </div>
      ${toast.dismissible ? `
        <button class="toast__close" onclick="window._dismissToast('${toast.id}')" aria-label="Tutup">
          <span class="material-icons">close</span>
        </button>
      ` : ''}
      <div class="toast__progress">
        <div class="toast__progress-bar" style="animation-duration: ${toast.duration}ms"></div>
      </div>
    `;
    
    // Store action callback
    if (toast.action) {
      element._actionCallback = toast.action.callback;
    }
    
    return element;
  }
  
  /**
   * Dismiss toast
   */
  dismiss(toastId) {
    const index = this.toasts.findIndex(t => t.id === toastId);
    if (index === -1) return;
    
    const toast = this.toasts[index];
    
    // Clear timer
    if (toast.timer) {
      clearTimeout(toast.timer);
    }
    
    // Animate out
    toast.element.classList.add('toast--hiding');
    toast.element.classList.remove('toast--visible');
    
    // Remove after animation
    setTimeout(() => {
      if (toast.element.parentNode) {
        toast.element.parentNode.removeChild(toast.element);
      }
      
      // Remove from tracking
      this.toasts.splice(index, 1);
      
      // Update store
      const currentToasts = store.getState('ui.toasts') || [];
      store.dispatch('ui.toasts', currentToasts.filter(t => t.id !== toastId));
    }, 300);
  }
  
  /**
   * Dismiss all toasts
   */
  dismissAll() {
    this.toasts.forEach(toast => this.dismiss(toast.id));
  }
  
  /**
   * Show confirm dialog
   */
  confirm(message, title = 'Konfirmasi', options = {}) {
    return new Promise((resolve) => {
      const {
        confirmText = 'Ya',
        cancelText = 'Batal',
        confirmClass = 'btn-primary',
        cancelClass = 'btn-ghost',
        type = 'warning',
        icon = 'help_outline'
      } = options;
      
      // Store callback
      store.dispatch('ui.confirmDialog', {
        show: true,
        title,
        message,
        confirmText,
        cancelText,
        confirmClass,
        cancelClass,
        type,
        icon,
        onConfirm: () => {
          store.dispatch('ui.confirmDialog', null);
          resolve(true);
        },
        onCancel: () => {
          store.dispatch('ui.confirmDialog', null);
          resolve(false);
        }
      });
    });
  }
  
  /**
   * Show alert dialog
   */
  alert(message, title = 'Info', options = {}) {
    return new Promise((resolve) => {
      const {
        buttonText = 'OK',
        buttonClass = 'btn-primary',
        type = 'info',
        icon = 'info'
      } = options;
      
      store.dispatch('ui.confirmDialog', {
        show: true,
        title,
        message,
        confirmText: buttonText,
        confirmClass: buttonClass,
        type,
        icon,
        showCancel: false,
        onConfirm: () => {
          store.dispatch('ui.confirmDialog', null);
          resolve(true);
        }
      });
    });
  }
  
  /**
   * Show modal notification
   */
  modal(title, content, options = {}) {
    const modalId = `modal-${Date.now()}`;
    
    store.dispatch('ui.modals', {
      ...store.getState('ui.modals'),
      [modalId]: {
        show: true,
        title,
        content,
        size: options.size || 'medium',
        onClose: options.onClose || null
      }
    });
    
    return modalId;
  }
  
  /**
   * Close modal
   */
  closeModal(modalId) {
    const modals = store.getState('ui.modals') || {};
    delete modals[modalId];
    store.dispatch('ui.modals', { ...modals });
  }
  
  /**
   * Get default icon for type
   */
  getDefaultIcon(type) {
    const icons = {
      'success': 'check_circle',
      'error': 'error',
      'warning': 'warning',
      'info': 'info'
    };
    return icons[type] || 'info';
  }
  
  /**
   * Play notification sound
   */
  playSound(type) {
    try {
      const sounds = {
        'success': '/src/assets/sounds/success.mp3',
        'error': '/src/assets/sounds/error.mp3',
        'warning': '/src/assets/sounds/notification.mp3',
        'info': '/src/assets/sounds/notification.mp3'
      };
      
      const audio = new Audio(sounds[type] || sounds.info);
      audio.volume = 0.5;
      audio.play().catch(() => {}); // Ignore autoplay restrictions
    } catch {}
  }
  
  /**
   * Setup push notifications
   */
  async setupPushNotifications() {
    if (!APP_CONFIG.FEATURES.PUSH_NOTIFICATIONS) return;
    if (!('Notification' in window)) return;
    if (!('serviceWorker' in navigator)) return;
    
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        // Get VAPID public key (from server or config)
        const vapidPublicKey = APP_CONFIG.PUSH_VAPID_KEY;
        
        if (vapidPublicKey) {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
          });
          
          this.pushSubscription = subscription;
          
          // Register with server
          await api.post('push.register', {
            subscription: subscription
          });
          
          console.log('✅ Push notifications enabled');
        }
      }
    } catch (error) {
      console.warn('Push notification setup failed:', error);
    }
  }
  
  /**
   * Send push notification
   */
  async sendPush(title, body, options = {}) {
    if (!this.pushSubscription) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/src/assets/icons/icon-192x192.png',
        badge: '/src/assets/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: options.data || {},
        actions: options.actions || [],
        requireInteraction: options.requireInteraction || false,
        ...options
      });
    } catch (error) {
      console.warn('Failed to show notification:', error);
    }
  }
  
  /**
   * Browser notification
   */
  browserNotify(title, body, options = {}) {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/src/assets/icons/icon-192x192.png',
        ...options
      });
    }
  }
  
  /**
   * Show notification panel
   */
  async showPanel() {
    // Create or toggle notification panel
    let panel = document.getElementById('notification-panel');
    
    if (panel) {
      panel.classList.toggle('hidden');
      return;
    }
    
    panel = document.createElement('div');
    panel.id = 'notification-panel';
    panel.className = 'notification-panel';
    panel.innerHTML = `
      <div class="notification-panel__header">
        <h3>Notifikasi</h3>
        <div class="notification-panel__actions">
          <button class="btn-ghost btn-sm" id="btn-mark-all-read">
            Tandai Semua Dibaca
          </button>
          <button class="btn-icon btn-icon-sm" id="btn-close-panel">
            <span class="material-icons">close</span>
          </button>
        </div>
      </div>
      <div class="notification-panel__body" id="notification-list">
        <div class="skeleton-text"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text"></div>
      </div>
      <div class="notification-panel__footer">
        <a href="#/notifications" class="btn-ghost btn-sm">Lihat Semua</a>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Load notifications
    this.loadNotifications();
    
    // Bind events
    panel.querySelector('#btn-close-panel').addEventListener('click', () => {
      panel.remove();
    });
    
    panel.querySelector('#btn-mark-all-read').addEventListener('click', async () => {
      await api.markAllAsRead();
      this.loadNotifications();
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && !e.target.closest('#btn-notifications')) {
        panel.remove();
      }
    }, { once: true });
  }
  
  /**
   * Load notifications
   */
  async loadNotifications() {
    try {
      const response = await api.getNotifications({ limit: 20 });
      const notificationList = document.getElementById('notification-list');
      
      if (response.status === 'success' && notificationList) {
        const items = response.data.items || [];
        
        if (items.length === 0) {
          notificationList.innerHTML = `
            <div class="empty-state">
              <span class="material-icons">notifications_none</span>
              <p>Tidak ada notifikasi</p>
            </div>
          `;
          return;
        }
        
        notificationList.innerHTML = items.map(item => `
          <div class="notification-item ${!item.isRead ? 'notification-item--unread' : ''}" 
               data-id="${item.id}"
               onclick="window._handleNotificationClick('${item.id}', '${item.linkUrl || ''}')">
            <div class="notification-item__icon notification-item__icon--${item.tipe}">
              <span class="material-icons">${this.getNotificationIcon(item.tipe)}</span>
            </div>
            <div class="notification-item__content">
              <div class="notification-item__title">${item.judul}</div>
              <div class="notification-item__message">${item.pesan}</div>
              <div class="notification-item__time">${this.formatTime(item.createdAt)}</div>
            </div>
            ${!item.isRead ? '<div class="notification-item__dot"></div>' : ''}
          </div>
        `).join('');
      }
    } catch (error) {
      console.warn('Failed to load notifications:', error);
    }
  }
  
  /**
   * Handle notification click
   */
  async handleNotificationClick(id, linkUrl) {
    // Mark as read
    await api.markAsRead(id);
    
    // Navigate if link provided
    if (linkUrl) {
      router.navigate(linkUrl);
    }
    
    // Close panel
    const panel = document.getElementById('notification-panel');
    if (panel) panel.remove();
  }
  
  /**
   * Get notification icon
   */
  getNotificationIcon(type) {
    const icons = {
      'info': 'info',
      'success': 'check_circle',
      'warning': 'warning',
      'error': 'error',
      'disposisi': 'forward',
      'approval': 'check_circle',
      'reminder': 'alarm',
      'system': 'settings'
    };
    return icons[type] || 'notifications';
  }
  
  /**
   * Format time
   */
  formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}j`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}h`;
    return date.toLocaleDateString('id-ID');
  }
  
  /**
   * URL base64 to Uint8Array (for VAPID key)
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
}

// Global handlers
window._dismissToast = (id) => {
  NotificationService.dismiss(id);
};

window._toastAction = (id) => {
  const toast = NotificationService.toasts.find(t => t.id === id);
  if (toast && toast.action) {
    toast.action.callback();
    NotificationService.dismiss(id);
  }
};

window._handleNotificationClick = (id, linkUrl) => {
  NotificationService.handleNotificationClick(id, linkUrl);
};

// Singleton instance
const NotificationService = new NotificationService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotificationService };
}
