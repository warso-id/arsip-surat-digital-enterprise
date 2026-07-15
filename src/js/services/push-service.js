/**
 * ============================================
 * PUSH SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL PUSH NOTIFICATIONS - SIAP PRODUKSI
 * Mendukung: Subscribe/Unsubscribe, VAPID, 
 * Permission Management, Test, Categories
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class PushService {
  constructor() {
    this.subscription = null;
    this.isSupported = false;
    this.isSubscribed = false;
    this.vapidPublicKey = null;
    this.permissionState = 'default';
    this.swRegistration = null;
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.subscriptionChangeCallbacks = [];
  }

  /**
   * Initialize push service
   */
  async init() {
    // Check browser support
    this.isSupported = 'serviceWorker' in navigator && 
                       'PushManager' in window && 
                       'Notification' in window;

    if (!this.isSupported) {
      console.warn('Push notifications not supported in this browser');
      return;
    }

    // Get VAPID public key from config
    this.vapidPublicKey = this.getVapidKey();

    // Get current permission state
    this.permissionState = Notification.permission;

    // Get service worker registration
    try {
      this.swRegistration = await navigator.serviceWorker.ready;
    } catch (error) {
      console.warn('Service worker not ready:', error);
    }

    // Check existing subscription
    await this.checkSubscription();

    // Listen for permission changes
    if (navigator.permissions) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'notifications' });
        permissionStatus.addEventListener('change', () => {
          this.permissionState = permissionStatus.state;
          this.notifySubscriptionChange();
        });
      } catch (e) {}
    }

    console.log(`✅ Push Service initialized (Supported: ${this.isSupported}, Subscribed: ${this.isSubscribed}, Permission: ${this.permissionState})`);
  }

  /**
   * Get VAPID key from various sources
   */
  getVapidKey() {
    if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.PUSH_VAPID_KEY) {
      return APP_CONFIG.PUSH_VAPID_KEY;
    }
    if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.VAPID_PUBLIC_KEY) {
      return APP_CONFIG.VAPID_PUBLIC_KEY;
    }
    // Try to get from meta tag
    const meta = document.querySelector('meta[name="vapid-key"]');
    if (meta?.content) return meta.content;
    // Try localStorage
    try {
      const stored = localStorage.getItem('asd_vapid_key');
      if (stored) return stored;
    } catch (e) {}
    return null;
  }

  /**
   * Check existing push subscription
   */
  async checkSubscription() {
    if (!this.swRegistration) return;

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();

      if (subscription) {
        this.subscription = subscription;
        this.isSubscribed = true;
        console.log('Existing push subscription found');
        
        // Verify with server that subscription is still valid
        await this.verifySubscriptionWithServer();
      }
    } catch (error) {
      console.warn('Failed to check subscription:', error);
    }
  }

  /**
   * Verify subscription with server
   */
  async verifySubscriptionWithServer() {
    try {
      if (typeof api !== 'undefined') {
        const response = await api.post('push.register', {
          subscription: this.subscription.toJSON(),
          verify: true
        });
        if (response?.status !== 'success') {
          // Server doesn't have this subscription, re-register
          await this.registerWithServer(this.subscription);
        }
      }
    } catch (error) {
      console.warn('Subscription verification failed:', error);
    }
  }

  /**
   * Request permission and subscribe
   */
  async subscribe(options = {}) {
    if (!this.isSupported) {
      throw new Error('Push notifications tidak didukung di browser ini');
    }

    const { silent = false } = options;

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      this.permissionState = permission;

      if (permission !== 'granted') {
        const messages = {
          denied: 'Izin notifikasi ditolak. Buka pengaturan browser untuk mengizinkan.',
          default: 'Izin notifikasi diperlukan untuk fitur ini.'
        };
        throw new Error(messages[permission] || 'Izin notifikasi tidak diberikan');
      }

      // Get service worker registration
      if (!this.swRegistration) {
        this.swRegistration = await navigator.serviceWorker.ready;
      }

      // Check if VAPID key is available
      if (!this.vapidPublicKey) {
        throw new Error('VAPID public key tidak dikonfigurasi. Hubungi administrator.');
      }

      // Subscribe to push
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      this.subscription = subscription;
      this.isSubscribed = true;
      this.retryAttempts = 0;

      // Register with server
      const registered = await this.registerWithServer(subscription);
      
      if (!registered && !silent) {
        console.warn('Push subscription created locally but server registration failed');
      }

      // Save preference
      this.savePreference(true);

      // Notify listeners
      this.notifySubscriptionChange();

      console.log('✅ Push subscription successful');
      return subscription;

    } catch (error) {
      console.error('Push subscription failed:', error);
      this.retryAttempts++;

      if (this.retryAttempts < this.maxRetries && error.name !== 'NotAllowedError') {
        console.log(`Retrying subscription (${this.retryAttempts}/${this.maxRetries})...`);
        await this.delay(1000 * this.retryAttempts);
        return this.subscribe({ ...options, silent: true });
      }

      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    if (!this.subscription) return true;

    try {
      const unsubscribed = await this.subscription.unsubscribe();

      if (unsubscribed) {
        // Notify server
        try {
          if (typeof api !== 'undefined') {
            await api.post('push.register', { unsubscribe: true, endpoint: this.subscription.endpoint });
          }
        } catch (e) {}

        this.subscription = null;
        this.isSubscribed = false;
        this.savePreference(false);
        this.notifySubscriptionChange();
        console.log('✅ Push unsubscription successful');
      }

      return unsubscribed;
    } catch (error) {
      console.error('Push unsubscription failed:', error);

      // Force clear if unsubscribe fails
      this.subscription = null;
      this.isSubscribed = false;
      return false;
    }
  }

  /**
   * Register subscription with server (code.gs)
   */
  async registerWithServer(subscription) {
    try {
      const subscriptionJSON = subscription.toJSON();

      const payload = {
        endpoint: subscriptionJSON.endpoint,
        expirationTime: subscription.expirationTime,
        keys: {
          p256dh: subscriptionJSON.keys.p256dh,
          auth: subscriptionJSON.keys.auth
        },
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        timestamp: new Date().toISOString()
      };

      let response;
      if (typeof api !== 'undefined') {
        response = await api.post('push.register', payload);
      } else if (typeof API !== 'undefined') {
        response = await API.post('push.register', payload);
      } else {
        // Direct fetch fallback
        const url = (typeof APP_CONFIG !== 'undefined' ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : '') + '?action=push.register';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        response = await res.json();
      }

      return response?.status === 'success';
    } catch (error) {
      console.error('Failed to register push with server:', error);
      return false;
    }
  }

  /**
   * Send a local test notification
   */
  async sendTest(title = 'Test Notification', options = {}) {
    if (!this.swRegistration) {
      throw new Error('Service worker tidak tersedia');
    }

    const defaultOptions = {
      body: 'Push notifications berfungsi dengan baik! ✅',
      icon: '/src/assets/icons/icon-192x192.png',
      badge: '/src/assets/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      tag: 'test-notification',
      renotify: true,
      requireInteraction: false,
      data: {
        url: '/',
        timestamp: Date.now(),
        test: true
      },
      actions: [
        { action: 'open', title: '🔍 Buka Aplikasi' },
        { action: 'close', title: '✕ Tutup' }
      ]
    };

    try {
      await this.swRegistration.showNotification(title, { ...defaultOptions, ...options });
      return true;
    } catch (error) {
      console.error('Test notification failed:', error);
      return false;
    }
  }

  /**
   * Send a notification via service worker
   */
  async sendNotification(title, body, options = {}) {
    if (!this.swRegistration && 'serviceWorker' in navigator) {
      this.swRegistration = await navigator.serviceWorker.ready;
    }

    if (!this.swRegistration) {
      // Fallback: post message to service worker
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          body,
          ...options
        });
        return true;
      }
      return false;
    }

    try {
      await this.swRegistration.showNotification(title, {
        body,
        icon: options.icon || '/src/assets/icons/icon-192x192.png',
        badge: options.badge || '/src/assets/icons/icon-72x72.png',
        vibrate: options.vibrate || [200, 100, 200],
        tag: options.tag || 'default',
        data: options.data || {},
        actions: options.actions || [],
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  /**
   * Get subscription info (masked for security)
   */
  getSubscriptionInfo() {
    if (!this.subscription) return null;

    const json = this.subscription.toJSON();
    return {
      endpoint: this.truncate(json.endpoint, 50),
      expirationTime: this.subscription.expirationTime,
      keys: {
        p256dh: this.truncate(json.keys?.p256dh, 20),
        auth: this.truncate(json.keys?.auth, 10)
      }
    };
  }

  /**
   * Get permission state
   */
  getPermissionState() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Check if notifications are blocked
   */
  isBlocked() {
    return Notification.permission === 'denied';
  }

  /**
   * Check if can request permission
   */
  canRequestPermission() {
    return Notification.permission === 'default';
  }

  /**
   * Get comprehensive status
   */
  getStatus() {
    return {
      supported: this.isSupported,
      subscribed: this.isSubscribed,
      permission: this.getPermissionState(),
      blocked: this.isBlocked(),
      canRequest: this.canRequestPermission(),
      vapidConfigured: !!this.vapidPublicKey,
      swReady: !!this.swRegistration,
      info: this.isSubscribed ? this.getSubscriptionInfo() : null
    };
  }

  /**
   * Add subscription change callback
   */
  onSubscriptionChange(callback) {
    this.subscriptionChangeCallbacks.push(callback);
    return () => {
      this.subscriptionChangeCallbacks = this.subscriptionChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify subscription change listeners
   */
  notifySubscriptionChange() {
    const status = this.getStatus();
    this.subscriptionChangeCallbacks.forEach(cb => {
      try { cb(status); } catch (e) {}
    });

    // Update store if available
    if (typeof store !== 'undefined') {
      store.dispatch('push.status', status);
    }
  }

  /**
   * Save user preference
   */
  savePreference(enabled) {
    try {
      localStorage.setItem('asd_push_enabled', enabled ? '1' : '0');
    } catch (e) {}
  }

  /**
   * Get user preference
   */
  getPreference() {
    try {
      return localStorage.getItem('asd_push_enabled') === '1';
    } catch (e) {
      return false;
    }
  }

  /**
   * URL-safe base64 to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    if (!base64String) return new Uint8Array(0);

    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Convert Uint8Array to base64
   */
  uint8ArrayToBase64(uint8Array) {
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  }

  /**
   * Truncate string
   */
  truncate(str, maxLength) {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup
   */
  destroy() {
    this.subscriptionChangeCallbacks = [];
  }
}

// Singleton instance
const PushService = new PushService();

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PushService.init());
} else {
  setTimeout(() => PushService.init(), 500);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PushService };
}
