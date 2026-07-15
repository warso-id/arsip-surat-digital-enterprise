/**
 * SPINNER COMPONENT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * File: src/js/components/ui/spinner.js
 * Support: Google Apps Script + Google Sheets + Frontend
 * Loading spinner component
 */

class SpinnerComponent {
  constructor(options = {}) {
    this.options = {
      size: options.size || 'medium',     // small | medium | large
      color: options.color || 'primary',   // primary | white | custom
      type: options.type || 'border',      // border | dots | pulse
      overlay: options.overlay || false,
      text: options.text || 'Memuat...',
      fullscreen: options.fullscreen || false,
      customColor: options.customColor || null
    };
    
    this.element = null;
    this._create();
  }

  /**
   * Create spinner element
   */
  _create() {
    this.element = document.createElement('div');
    this.element.className = 'spinner-wrapper';
    
    if (this.options.overlay || this.options.fullscreen) {
      this.element.classList.add('spinner-overlay');
    }
    
    if (this.options.fullscreen) {
      this.element.classList.add('spinner-fullscreen');
    }
    
    this.element.innerHTML = this._getTemplate();
  }

  /**
   * Get spinner HTML template
   */
  _getTemplate() {
    const sizeClass = `spinner-${this.options.size}`;
    const colorStyle = this.options.customColor 
      ? `style="border-color: ${this.options.customColor}; border-top-color: transparent;"` 
      : '';
    
    switch (this.options.type) {
      case 'dots':
        return `
          <div class="spinner-container">
            <div class="spinner-dots ${sizeClass} ${this._getColorClass()}">
              <div class="dot dot-1"></div>
              <div class="dot dot-2"></div>
              <div class="dot dot-3"></div>
            </div>
            ${this.options.text ? `<p class="spinner-text">${this.options.text}</p>` : ''}
          </div>
        `;
      
      case 'pulse':
        return `
          <div class="spinner-container">
            <div class="spinner-pulse ${sizeClass} ${this._getColorClass()}"></div>
            ${this.options.text ? `<p class="spinner-text">${this.options.text}</p>` : ''}
          </div>
        `;
      
      case 'border':
      default:
        return `
          <div class="spinner-container">
            <div class="spinner-border ${sizeClass} ${this._getColorClass()}" 
                 ${colorStyle}
                 role="status"
                 aria-label="${this.options.text}">
              <span class="sr-only">${this.options.text}</span>
            </div>
            ${this.options.text ? `<p class="spinner-text">${this.options.text}</p>` : ''}
          </div>
        `;
    }
  }

  /**
   * Get color class
   */
  _getColorClass() {
    if (this.options.customColor) return '';
    
    const colorMap = {
      'primary': 'spinner-primary',
      'white': 'spinner-white',
      'success': 'spinner-success',
      'danger': 'spinner-danger',
      'warning': 'spinner-warning'
    };
    
    return colorMap[this.options.color] || 'spinner-primary';
  }

  /**
   * Show spinner in container
   */
  show(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    
    if (container) {
      // Store original position
      if (!container.dataset.originalPosition) {
        container.dataset.originalPosition = container.style.position || '';
      }
      
      container.style.position = 'relative';
      container.appendChild(this.element);
    } else if (this.options.fullscreen) {
      document.body.appendChild(this.element);
    }
    
    return this;
  }

  /**
   * Show spinner as overlay on element
   */
  showOverlay(target) {
    this.options.overlay = true;
    this.element.classList.add('spinner-overlay');
    
    if (typeof target === 'string') {
      target = document.querySelector(target);
    }
    
    if (target) {
      target.appendChild(this.element);
    }
    
    return this;
  }

  /**
   * Show fullscreen spinner
   */
  showFullscreen() {
    this.options.fullscreen = true;
    this.options.overlay = true;
    this.element.classList.add('spinner-overlay', 'spinner-fullscreen');
    document.body.appendChild(this.element);
    return this;
  }

  /**
   * Hide spinner
   */
  hide() {
    if (this.element && this.element.parentNode) {
      // Restore container position
      const container = this.element.parentNode;
      if (container.dataset?.originalPosition !== undefined) {
        container.style.position = container.dataset.originalPosition;
        delete container.dataset.originalPosition;
      }
      
      this.element.parentNode.removeChild(this.element);
    }
  }

  /**
   * Update spinner text
   */
  setText(text) {
    this.options.text = text;
    const textEl = this.element.querySelector('.spinner-text');
    if (textEl) {
      textEl.textContent = text;
    }
    return this;
  }

  /**
   * Update spinner color
   */
  setColor(color) {
    this.options.color = color;
    const spinner = this.element.querySelector('.spinner-border, .spinner-dots, .spinner-pulse');
    if (spinner) {
      // Remove old color classes
      ['primary', 'white', 'success', 'danger', 'warning'].forEach(c => {
        spinner.classList.remove(`spinner-${c}`);
      });
      spinner.classList.add(`spinner-${color}`);
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
   * Destroy spinner
   */
  destroy() {
    this.hide();
    this.element = null;
  }

  /**
   * Static method: Show loading on element
   */
  static showLoading(target, text = 'Memuat...') {
    const spinner = new SpinnerComponent({ text, overlay: true });
    spinner.showOverlay(target);
    return spinner;
  }

  /**
   * Static method: Show fullscreen loading
   */
  static showFullscreenLoading(text = 'Memuat...') {
    const spinner = new SpinnerComponent({ text, fullscreen: true });
    spinner.showFullscreen();
    return spinner;
  }

  /**
   * Static method: Create button spinner
   */
  static createButtonSpinner() {
    return new SpinnerComponent({ 
      size: 'small', 
      type: 'border',
      text: '' 
    });
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SpinnerComponent };
}

if (typeof window !== 'undefined') {
  window.SpinnerComponent = SpinnerComponent;
}
