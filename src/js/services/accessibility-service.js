/**
 * ACCESSIBILITY SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Accessibility features and enhancements
 */

class AccessibilityService {
  constructor() {
    this.settings = {
      highContrast: false,
      largeText: false,
      reduceMotion: false,
      screenReader: false,
      fontSize: 16,
      letterSpacing: 0,
      lineHeight: 1.5
    };
    
    this.announcements = [];
    this.announcementTimer = null;
  }
  
  /**
   * Initialize accessibility service
   */
  init() {
    // Load saved settings
    this.loadSettings();
    
    // Apply settings
    this.applySettings();
    
    // Detect screen reader
    this.detectScreenReader();
    
    // Setup keyboard navigation
    this.setupKeyboardNavigation();
    
    // Setup focus management
    this.setupFocusManagement();
    
    // Setup reduced motion
    this.setupReducedMotion();
    
    // Listen for system preferences
    this.listenSystemPreferences();
    
    console.log('✅ Accessibility Service initialized');
  }
  
  /**
   * Load saved settings
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('asd_accessibility');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch {}
  }
  
  /**
   * Save settings
   */
  saveSettings() {
    try {
      localStorage.setItem('asd_accessibility', JSON.stringify(this.settings));
    } catch {}
  }
  
  /**
   * Apply accessibility settings
   */
  applySettings() {
    const root = document.documentElement;
    
    // High contrast
    if (this.settings.highContrast) {
      root.classList.add('a11y-high-contrast');
    } else {
      root.classList.remove('a11y-high-contrast');
    }
    
    // Large text
    if (this.settings.largeText) {
      root.classList.add('a11y-large-text');
    } else {
      root.classList.remove('a11y-large-text');
    }
    
    // Reduce motion
    if (this.settings.reduceMotion) {
      root.classList.add('a11y-reduce-motion');
    } else {
      root.classList.remove('a11y-reduce-motion');
    }
    
    // Font size
    root.style.fontSize = `${this.settings.fontSize}px`;
    
    // Letter spacing
    root.style.letterSpacing = `${this.settings.letterSpacing}em`;
    
    // Line height
    root.style.setProperty('--a11y-line-height', this.settings.lineHeight);
  }
  
  /**
   * Toggle high contrast
   */
  toggleHighContrast() {
    this.settings.highContrast = !this.settings.highContrast;
    this.applySettings();
    this.saveSettings();
    this.announce(`Mode kontras tinggi ${this.settings.highContrast ? 'diaktifkan' : 'dinonaktifkan'}`);
  }
  
  /**
   * Toggle large text
   */
  toggleLargeText() {
    this.settings.largeText = !this.settings.largeText;
    this.applySettings();
    this.saveSettings();
    this.announce(`Teks besar ${this.settings.largeText ? 'diaktifkan' : 'dinonaktifkan'}`);
  }
  
  /**
   * Toggle reduce motion
   */
  toggleReduceMotion() {
    this.settings.reduceMotion = !this.settings.reduceMotion;
    this.applySettings();
    this.saveSettings();
    this.announce(`Kurangi gerakan ${this.settings.reduceMotion ? 'diaktifkan' : 'dinonaktifkan'}`);
  }
  
  /**
   * Increase font size
   */
  increaseFontSize() {
    if (this.settings.fontSize < 24) {
      this.settings.fontSize += 1;
      this.applySettings();
      this.saveSettings();
      this.announce(`Ukuran font: ${this.settings.fontSize}px`);
    }
  }
  
  /**
   * Decrease font size
   */
  decreaseFontSize() {
    if (this.settings.fontSize > 12) {
      this.settings.fontSize -= 1;
      this.applySettings();
      this.saveSettings();
      this.announce(`Ukuran font: ${this.settings.fontSize}px`);
    }
  }
  
  /**
   * Reset accessibility settings
   */
  resetSettings() {
    this.settings = {
      highContrast: false,
      largeText: false,
      reduceMotion: false,
      screenReader: false,
      fontSize: 16,
      letterSpacing: 0,
      lineHeight: 1.5
    };
    this.applySettings();
    this.saveSettings();
    this.announce('Pengaturan aksesibilitas direset');
  }
  
  /**
   * Announce message for screen readers
   */
  announce(message, priority = 'polite') {
    // Remove old announcements
    const oldAnnouncements = document.querySelectorAll('[aria-live]');
    
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.classList.add('sr-only');
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    // Remove after announcement
    setTimeout(() => {
      announcer.remove();
    }, 3000);
  }
  
  /**
   * Detect screen reader
   */
  detectScreenReader() {
    // Create a test element
    const testEl = document.createElement('div');
    testEl.setAttribute('role', 'status');
    testEl.setAttribute('aria-live', 'assertive');
    testEl.classList.add('sr-only');
    testEl.textContent = 'test';
    document.body.appendChild(testEl);
    
    // Check if accessible name is computed
    setTimeout(() => {
      const computed = window.getComputedStyle(testEl);
      // Screen readers typically don't affect visual styles
      // This is an approximation
      testEl.remove();
    }, 100);
  }
  
  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    // Add skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-to-content';
    skipLink.textContent = 'Langsung ke konten';
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Focus trap for modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const activeModal = document.querySelector('.modal-overlay:not([style*="display: none"])');
        if (activeModal) {
          this.trapFocus(e, activeModal);
        }
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay');
        if (activeModal) {
          activeModal.dispatchEvent(new Event('close'));
        }
      }
    });
  }
  
  /**
   * Trap focus within element
   */
  trapFocus(event, container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  }
  
  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Add visible focus indicator
    document.addEventListener('focusin', (e) => {
      if (e.target.matches('button, a, input, select, textarea, [tabindex]')) {
        e.target.classList.add('focus-visible');
      }
    });
    
    document.addEventListener('focusout', (e) => {
      if (e.target.matches('button, a, input, select, textarea, [tabindex]')) {
        e.target.classList.remove('focus-visible');
      }
    });
  }
  
  /**
   * Setup reduced motion
   */
  setupReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (mediaQuery.matches) {
      this.settings.reduceMotion = true;
      this.applySettings();
    }
    
    mediaQuery.addEventListener('change', (e) => {
      this.settings.reduceMotion = e.matches;
      this.applySettings();
    });
  }
  
  /**
   * Listen for system preferences
   */
  listenSystemPreferences() {
    // Color scheme
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    colorSchemeQuery.addEventListener('change', () => {
      if (store.getState('app.theme') === 'auto') {
        app.applyTheme('auto');
      }
    });
    
    // Contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    if (contrastQuery.matches) {
      this.settings.highContrast = true;
      this.applySettings();
    }
    contrastQuery.addEventListener('change', (e) => {
      this.settings.highContrast = e.matches;
      this.applySettings();
    });
  }
  
  /**
   * Get accessibility status
   */
  getStatus() {
    return {
      ...this.settings,
      screenReaderDetected: this.settings.screenReader
    };
  }
  
  /**
   * Add ARIA labels dynamically
   */
  enhanceARIA() {
    // Add labels to icon buttons
    document.querySelectorAll('.btn-icon:not([aria-label])').forEach(btn => {
      const icon = btn.querySelector('.material-icons');
      if (icon) {
        btn.setAttribute('aria-label', icon.textContent || 'Button');
      }
    });
    
    // Add roles to tables
    document.querySelectorAll('table:not([role])').forEach(table => {
      table.setAttribute('role', 'table');
    });
    
    // Add roles to table headers
    document.querySelectorAll('th:not([role])').forEach(th => {
      th.setAttribute('role', 'columnheader');
    });
    
    // Add roles to table cells
    document.querySelectorAll('td:not([role])').forEach(td => {
      td.setAttribute('role', 'cell');
    });
  }
}

// Singleton instance
const AccessibilityService = new AccessibilityService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AccessibilityService };
}
