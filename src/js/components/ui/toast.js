/**
 * TOAST COMPONENT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * File: src/js/components/ui/toast.js
 * Support: Google Apps Script + Google Sheets + Frontend
 * Notification toast component
 */

class ToastComponent {
  constructor(options = {}) {
    this.options = {
      type: options.type || 'info',        // info | success | warning | error
      title: options.title || '',
      message: options.message || '',
      duration: options.duration || 5000,
      position: options.position || 'bottom-right',
      showIcon: options.showIcon !== false,
      showClose: options.showClose !== false,
      dismissible: options.dismissible !== false,
      animation: options.animation !== false,
      onClose: options.onClose || null,
      onClick: options.onClick || null,
      action: options.action || null,       // { text: 'Action', callback: fn }
      id: options.id || this._generateId()
    };
    
    this.element = null;
    this.timer = null;
    this._create();
  }

  /**
   * Generate unique ID
   */
  _generateId() {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create toast element
   */
  _create() {
    this.element = document.createElement('div');
    this.element.id = this.options.id;
    this.element.className = `toast toast--${this.options.type}`;
    this.element.setAttribute('role', 'alert');
    this.element.setAttribute('aria-live', 'polite');
    
    if (this.options.animation) {
      this.element.classList.add('toast--animate-in');
    }
    
    this.element.innerHTML = this._getTemplate();
    
    this._bindEvents();
  }

  /**
   * Get toast HTML template
   */
  _getTemplate() {
    const iconMap = {
      info: 'icon-info-circle',
      success: 'icon-check-circle',
      warning: 'icon-exclamation-triangle',
      error: 'icon-times-circle'
    };

    const icon = this.options.showIcon ? 
      `<span class="toast__icon">
        <i class="${iconMap[this.options.type] || 'icon-bell'}"></i>
      </span>` : '';

    const title = this.options.title ? 
      `<h4 class="toast__title">${this.options.title}</h4>` : '';

    const message = this.options.message ? 
      `<p class="toast__message">${this.options.message}</p>` : '';

    const closeBtn = this.options.showClose ? 
      `<button class="toast__close" aria-label="Tutup">
        <i class="icon-times"></i>
      </button>` : '';

    const actionBtn = this.options.action ? 
      `<button class="toast__action">${this.options.action.text}</button>` : '';

    // Progress bar for auto-dismiss
    const progressBar = this.options.duration > 0 ? 
      `<div class="toast__progress">
        <div class="toast__progress-bar"></div>
      </div>` : '';

    return `
      <div class="toast__content">
        ${icon}
        <div class="toast__body">
          ${title}
          ${message}
          ${actionBtn}
        </div>
        ${closeBtn}
      </div>
      ${progressBar}
    `;
  }

  /**
   * Bind events
   */
  _bindEvents() {
    // Close button
    const closeBtn = this.element.querySelector('.toast__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.dismiss());
    }

    // Action button
    const actionBtn = this.element.querySelector('.toast__action');
    if (actionBtn && this.options.action) {
      actionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.options.action.callback) {
          this.options.action.callback();
        }
        this.dismiss();
      });
    }

    // Click on toast
    if (this.options.onClick) {
      this.element.addEventListener('click', () => {
        this.options.onClick();
      });
    }

    // Hover pause auto-dismiss
    if (this.options.duration > 0) {
      this.element.addEventListener('mouseenter', () => this._pauseTimer());
      this.element.addEventListener('mouseleave', () => this._resumeTimer());
    }
  }

  /**
   * Show toast in container
   */
  show(container) {
    const targetContainer = this._getContainer(container);
    
    if (targetContainer) {
      targetContainer.appendChild(this.element);
      
      // Trigger animation
      requestAnimationFrame(() => {
        this.element.classList.add('toast--visible');
      });
      
      // Start auto-dismiss timer
      if (this.options.duration > 0) {
        this._startTimer();
      }
      
      // Announce for screen readers
      this._announce();
    }
    
    return this;
  }

  /**
   * Dismiss toast
   */
  dismiss() {
    if (!this.element) return;
    
    this._clearTimer();
    
    this.element.classList.remove('toast--visible');
    this.element.classList.add('toast--animate-out');
    
    const handleAnimationEnd = () => {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      if (this.options.onClose) {
        this.options.onClose();
      }
      
      this.element.removeEventListener('animationend', handleAnimationEnd);
      this.element = null;
    };
    
    this.element.addEventListener('animationend', handleAnimationEnd);
    
    // Fallback if animation doesn't fire
    setTimeout(handleAnimationEnd, 500);
  }

  /**
   * Get or create toast container
   */
  _getContainer(container) {
    if (container) {
      if (typeof container === 'string') {
        return document.querySelector(container);
      }
      return container;
    }
    
    // Default container based on position
    const containerId = `toast-container-${this.options.position}`;
    let toastContainer = document.getElementById(containerId);
    
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = containerId;
      toastContainer.className = `toast-container toast-container--${this.options.position}`;
      document.body.appendChild(toastContainer);
    }
    
    return toastContainer;
  }

  /**
   * Start auto-dismiss timer
   */
  _startTimer() {
    this._clearTimer();
    
    this.remainingTime = this.options.duration;
    this.startTime = Date.now();
    
    this.timer = setTimeout(() => {
      this.dismiss();
    }, this.options.duration);
    
    // Animate progress bar
    const progressBar = this.element.querySelector('.toast__progress-bar');
    if (progressBar) {
      progressBar.style.animationDuration = `${this.options.duration}ms`;
      progressBar.classList.add('toast__progress-bar--active');
    }
  }

  /**
   * Pause auto-dismiss timer
   */
  _pauseTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.remainingTime -= Date.now() - this.startTime;
      
      const progressBar = this.element.querySelector('.toast__progress-bar');
      if (progressBar) {
        progressBar.style.animationPlayState = 'paused';
      }
    }
  }

  /**
   * Resume auto-dismiss timer
   */
  _resumeTimer() {
    if (this.remainingTime > 0) {
      this.startTime = Date.now();
      this.timer = setTimeout(() => this.dismiss(), this.remainingTime);
      
      const progressBar = this.element.querySelector('.toast__progress-bar');
      if (progressBar) {
        progressBar.style.animationPlayState = 'running';
      }
    }
  }

  /**
   * Clear timer
   */
  _clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Announce for accessibility
   */
  _announce() {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = `${this.options.title} - ${this.options.message}`;
    
    document.body.appendChild(announcer);
    
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  /**
   * Update toast content
   */
  update(options = {}) {
    if (options.message) {
      this.options.message = options.message;
      const msgEl = this.element.querySelector('.toast__message');
      if (msgEl) msgEl.textContent = options.message;
    }
    
    if (options.title) {
      this.options.title = options.title;
      const titleEl = this.element.querySelector('.toast__title');
      if (titleEl) titleEl.textContent = options.title;
    }
    
    if (options.type) {
      this.options.type = options.type;
      this.element.className = `toast toast--${options.type} toast--visible`;
    }
    
    return this;
  }

  /**
   * Get element
   */
  getElement() {
    return this.element;
  }

  /**
   * Get ID
   */
  getId() {
    return this.options.id;
  }

  /**
   * Destroy toast
   */
  destroy() {
    this._clearTimer();
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }

  // ============================================
  // STATIC METHODS
  // ============================================

  /**
   * Show info toast
   */
  static info(message, options = {}) {
    return new ToastComponent({ ...options, type: 'info', message }).show();
  }

  /**
   * Show success toast
   */
  static success(message, options = {}) {
    return new ToastComponent({ ...options, type: 'success', message }).show();
  }

  /**
   * Show warning toast
   */
  static warning(message, options = {}) {
    return new ToastComponent({ ...options, type: 'warning', message }).show();
  }

  /**
   * Show error toast
   */
  static error(message, options = {}) {
    return new ToastComponent({ 
      ...options, 
      type: 'error', 
      message,
      duration: options.duration || 0 // Don't auto-dismiss errors
    }).show();
  }

  /**
   * Show loading toast
   */
  static loading(message = 'Memproses...', options = {}) {
    return new ToastComponent({
      ...options,
      type: 'info',
      message,
      showClose: false,
      duration: 0,
      showIcon: true
    }).show();
  }

  /**
   * Dismiss all toasts
   */
  static dismissAll() {
    document.querySelectorAll('.toast').forEach(toast => {
      toast.classList.add('toast--animate-out');
      setTimeout(() => toast.remove(), 300);
    });
  }

  /**
   * Dismiss toasts by container
   */
  static dismissByContainer(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (container) {
      container.querySelectorAll('.toast').forEach(toast => {
        toast.classList.add('toast--animate-out');
        setTimeout(() => toast.remove(), 300);
      });
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ToastComponent };
}

if (typeof window !== 'undefined') {
  window.ToastComponent = ToastComponent;
}
