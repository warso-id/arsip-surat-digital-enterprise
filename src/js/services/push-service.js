/**
 * PUSH SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Web push notifications management
 */

class PushService {
  constructor() {
    this.subscription = null;
    this.isSupported = false;
    this.isSubscribed = false;
    this.vapidPublicKey = null;
  }
  
  /**
   * Initialize push service
   */
  async init() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    
    if (this.isSupported) {
      // Get VAPID key from config
      this.vapidPublicKey = APP_CONFIG.PUSH_VAPID_KEY;
      
      // Check existing subscription
      await this.checkSubscription();
    }
    
    console.log(`✅ Push Service initialized (Supported: ${this.isSupported}, Subscribed: ${this.isSubscribed})`);
  }
  
  /**
   * Check existing subscription
   */
  async checkSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        this.subscription = subscription;
        this.isSubscribed = true;
        console.log('Push subscription found');
      }
    } catch (error) {
      console.warn('Failed to check subscription:', error);
    }
  }
  
  /**
   * Request permission and subscribe
   */
  async subscribe() {
    if (!this.isSupported) {
      throw new Error('Push notifications tidak didukung di browser ini');
    }
    
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error('Izin notifikasi ditolak');
      }
      
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });
      
      this.subscription = subscription;
      this.isSubscribed = true;
      
      // Register with server
      await this.registerWithServer(subscription);
      
      console.log('Push subscription successful');
      return subscription;
      
    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error;
    }
  }
  
  /**
   * Unsubscribe from push
   */
  async unsubscribe() {
    if (!this.subscription) return;
    
    try {
      await this.subscription.unsubscribe();
      this.subscription = null;
      this.isSubscribed = false;
      
      // Notify server
      await api.post('push.register', { unsubscribe: true });
      
      console.log('Push unsubscription successful');
      return true;
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      return false;
    }
  }
  
  /**
   * Register subscription with server
   */
  async registerWithServer(subscription) {
    try {
      const subscriptionJSON = subscription.toJSON();
      
      const response = await api.post('push.register', {
        endpoint: subscriptionJSON.endpoint,
        keys: {
          p256dh: subscriptionJSON.keys.p256dh,
          auth: subscriptionJSON.keys.auth
        }
      });
      
      return response.status === 'success';
    } catch (error) {
      console.error('Failed to register push with server:', error);
      return false;
    }
  }
  
  /**
   * Send test notification
   */
  async sendTest() {
    if (!this.subscription) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification('Test Notification', {
        body: 'Push notifications berfungsi dengan baik!',
        icon: '/src/assets/icons/icon-192x192.png',
        badge: '/src/assets/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: { url: '/' },
        actions: [
          { action: 'open', title: 'Buka' },
          { action: 'close', title: 'Tutup' }
        ]
      });
      
      return true;
    } catch (error) {
      console.error('Test notification failed:', error);
      return false;
    }
  }
  
  /**
   * Get subscription info
   */
  getSubscriptionInfo() {
    if (!this.subscription) return null;
    
    const json = this.subscription.toJSON();
    return {
      endpoint: json.endpoint?.substring(0, 50) + '...',
      expirationTime: this.subscription.expirationTime,
      keys: {
        p256dh: json.keys?.p256dh?.substring(0, 20) + '...',
        auth: json.keys?.auth?.substring(0, 10) + '...'
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
   * Get status
   */
  getStatus() {
    return {
      supported: this.isSupported,
      subscribed: this.isSubscribed,
      permission: this.getPermissionState(),
      blocked: this.isBlocked(),
      info: this.getSubscriptionInfo()
    };
  }
  
  /**
   * URL base64 to Uint8Array
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
}

// Singleton instance
const PushService = new PushService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PushService };
}
